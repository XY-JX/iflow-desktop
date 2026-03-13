<template>
  <div class="main-layout">
    <!-- 主界面 - 总是显示 -->
    <div class="sidebar-left">
      <ChatHistory
        :conversations="conversations"
        :active-conversation-id="activeConversationId"
        @new-chat="handleNewChat"
        @select-conversation="selectConversation"
        @delete-conversation="deleteConversation"
      />
    </div>

    <div class="main-content">
      <!-- iflow 状态提示横幅 -->
      <div v-if="!iflowReady" class="iflow-status-banner">
        <div class="banner-content">
          <span class="banner-icon">⚠️</span>
          <span class="banner-text" v-if="!iflowInstalled">
            需要安装 iFlow CLI 才能使用 AI 对话功能。
            <code>npm install -g @iflow-ai/iflow-cli@latest</code>
          </span>
          <span class="banner-text" v-else>
            iFlow CLI 需要登录。运行 <code>iflow</code> 完成授权。
          </span>
          <button class="banner-btn" @click="checkIflowStatus">重新检查</button>
        </div>
      </div>

      <ChatInterface
        :messages="currentMessages"
        :is-generating="isGenerating"
        :available-models="availableModels"
        :current-model="currentModel"
        @send-message="handleSendMessage"
        @model-change="handleModelChange"
      />
    </div>

    <div class="sidebar-right">
      <FileExplorer
        @file-selected="handleFileSelected"
      />
    </div>

    <div v-if="selectedFile" class="editor-panel">
      <FileEditor
        :file="selectedFile"
        @close="selectedFile = null"
        @saved="handleFileSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ChatHistory from './ChatHistory.vue';
import ChatInterface from './ChatInterface.vue';
import FileExplorer from './FileExplorer.vue';
import FileEditor from './FileEditor.vue';
import type { Conversation, Message, Model, FileItem } from '../types';

// iflow 状态
const iflowInstalled = ref(false);
const iflowReady = ref(false);

// 对话历史
const conversations = ref<Conversation[]>([]);
const activeConversationId = ref<string | undefined>();

// 当前模型
const availableModels: Model[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'glm-4', name: 'GLM-4', provider: '智谱AI' },
];
const currentModel = ref('glm-4');

// 生成状态
const isGenerating = ref(false);

// 文件编辑
const selectedFile = ref<FileItem | null>(null);

// 当前对话的消息
const currentMessages = computed(() => {
  if (!activeConversationId.value) return [];
  const conversation = conversations.value.find(c => c.id === activeConversationId.value);
  return conversation?.messages || [];
});

// 检查 iflow 状态（不阻塞界面）
async function checkIflowStatus() {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const installed = await invoke<boolean>('check_iflow_installed');
    iflowInstalled.value = installed;

    // 如果已安装，尝试调用一次以检查是否已登录
    if (installed) {
      try {
        await invoke<string>('call_iflow', {
          message: '/help',
          model: null
        });
        iflowReady.value = true;
      } catch (error) {
        iflowReady.value = false;
        console.log('iflow 检查失败，可能未登录:', error);
      }
    }
  } catch (error) {
    console.error('检查 iflow 状态失败:', error);
    iflowInstalled.value = false;
    iflowReady.value = false;
  }
}

// 组件挂载时异步检查 iflow
onMounted(() => {
  checkIflowStatus();
});

// 创建新对话
function handleNewChat() {
  const newConversation: Conversation = {
    id: Date.now().toString(),
    title: '新对话',
    messages: [],
    model: currentModel.value,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  conversations.value.unshift(newConversation);
  activeConversationId.value = newConversation.id;
}

// 选择对话
function selectConversation(id: string) {
  activeConversationId.value = id;
  const conversation = conversations.value.find(c => c.id === id);
  if (conversation) {
    currentModel.value = conversation.model;
  }
}

// 删除对话
function deleteConversation(id: string) {
  conversations.value = conversations.value.filter(c => c.id !== id);
  if (activeConversationId.value === id) {
    activeConversationId.value = undefined;
  }
}

// 发送消息
async function handleSendMessage(content: string) {
  // 检查 iflow 是否可用
  if (!iflowReady.value) {
    // 如果没有活动对话，创建一个
    if (!activeConversationId.value) {
      handleNewChat();
    }
    const conversation = conversations.value.find(c => c.id === activeConversationId.value);
    if (conversation) {
      // 添加用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      conversation.messages.push(userMessage);
      
      // 更新对话标题
      if (conversation.messages.length === 1) {
        conversation.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
      }
      conversation.updatedAt = Date.now();

      // 添加错误提示消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: !iflowInstalled.value 
          ? '⚠️ iFlow CLI 未安装\n\n请按照以下步骤安装：\n1. 打开命令提示符或 PowerShell\n2. 运行：npm install -g @iflow-ai/iflow-cli@latest\n3. 然后在命令行运行 iflow 完成登录\n\n安装完成后点击顶部的"重新检查"按钮。'
          : '⚠️ iFlow CLI 需要登录\n\n请在命令提示符中运行 iflow 完成登录授权，然后点击顶部的"重新检查"按钮。',
        timestamp: Date.now(),
      };
      conversation.messages.push(errorMessage);
      conversation.updatedAt = Date.now();
    }
    return;
  }

  // iflow 可用，正常处理
  if (!activeConversationId.value) {
    handleNewChat();
  }

  const conversation = conversations.value.find(c => c.id === activeConversationId.value);
  if (!conversation) return;

  // 添加用户消息
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: Date.now(),
  };
  conversation.messages.push(userMessage);

  // 更新对话标题（如果是第一条消息）
  if (conversation.messages.length === 1) {
    conversation.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
  }

  conversation.updatedAt = Date.now();

  // 调用 iflow 命令行
  isGenerating.value = true;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const response = await invoke<string>('call_iflow', {
      message: content,
      model: currentModel.value
    });

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = Date.now();
  } catch (error) {
    console.error('调用 iflow 失败:', error);
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `调用 iflow 失败: ${error}\n\n请检查 iflow 是否正常运行。`,
      timestamp: Date.now(),
    };
    conversation.messages.push(errorMessage);
    checkIflowStatus();
  } finally {
    isGenerating.value = false;
  }
}

// 切换模型
function handleModelChange(modelId: string) {
  currentModel.value = modelId;
  if (activeConversationId.value) {
    const conversation = conversations.value.find(c => c.id === activeConversationId.value);
    if (conversation) {
      conversation.model = modelId;
      conversation.updatedAt = Date.now();
    }
  }
}

// 选择文件
function handleFileSelected(file: FileItem) {
  selectedFile.value = file;
}

// 文件保存成功
function handleFileSaved() {
  console.log('文件保存成功');
}
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  grid-template-rows: 100vh;
  height: 100vh;
  overflow: hidden;
}

.iflow-status-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 100%;
}

.banner-icon {
  font-size: 20px;
}

.banner-text {
  flex: 1;
  color: white;
  font-size: 13px;
  line-height: 1.5;
}

.banner-text code {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: white;
}

.banner-btn {
  padding: 6px 16px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.banner-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.sidebar-left {
  border-right: 1px solid var(--border-color, #e0e0e0);
}

.main-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-right {
  border-left: 1px solid var(--border-color, #e0e0e0);
}

.editor-panel {
  position: fixed;
  top: 0;
  right: 280px;
  width: 500px;
  height: 100vh;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

@media (prefers-color-scheme: dark) {
  .iflow-status-banner {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  }
  
  .sidebar-left {
    border-right-color: var(--border-color, #404040);
  }

  .sidebar-right {
    border-left-color: var(--border-color, #404040);
  }
}
</style>