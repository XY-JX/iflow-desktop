<template>
  <div class="main-layout">
    <!-- iflow 未安装或未登录的提示 -->
    <div v-if="false" class="iflow-warning">
      <div class="warning-content">
        <div class="warning-icon">⚠️</div>
        <div class="warning-text">
          <h3>iFlow CLI 未就绪</h3>
          
          <p v-if="!iflowInstalled" class="install-step">
            <strong>第 1 步：安装 iFlow CLI</strong><br>
            打开命令提示符（CMD）或 PowerShell，运行：<br>
            <code>npm install -g @iflow-ai/iflow-cli@latest</code><br>
            <span class="hint">提示：需要先安装 Node.js (https://nodejs.org)</span>
          </p>
          
          <p v-if="true" class="install-step">
            <strong>第 2 步：登录 iFlow</strong><br>
            在命令提示符中运行：<br>
            <code>iflow</code><br>
            按照提示完成登录授权
          </p>
          
          <p class="warning-note">
            💡 安装完成后，点击"重新检查"按钮继续使用应用
          </p>
          <button class="check-btn" @click="checkIflowStatus">重新检查</button>
        </div>
      </div>
    </div>

    <template v-if="true">
      <div class="sidebar-left">
        <ChatHistory
          :conversations="conversations"
          :active-conversation-id="activeConversationId"
          @new-chat="createNewConversation"
          @select-conversation="selectConversation"
          @delete-conversation="deleteConversation"
        />
      </div>

      <div class="main-content">
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
    </template>
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

// 检查 iflow 状态
async function checkIflowStatus() {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const installed = await invoke<boolean>('check_iflow_installed');
    iflowInstalled.value = installed;

    // 如果已安装，尝试调用一次以检查是否已登录
    if (installed) {
      try {
        // 使用简单的命令测试 iflow 是否可用
        await invoke<string>('call_iflow', {
          message: '/help',
          model: null
        });
        iflowReady.value = true;
      } catch (error) {
        // iflow 已安装但未登录或不工作
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

// 组件挂载时检查 iflow
onMounted(() => {
  checkIflowStatus();
});

// 创建新对话
function createNewConversation() {
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
  // 如果没有活动对话，创建一个
  if (!activeConversationId.value) {
    createNewConversation();
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

    // 调用 Tauri 命令来执行 iflow
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
      content: `抱歉，调用 iflow 失败: ${error}`,
      timestamp: Date.now(),
    };
    conversation.messages.push(errorMessage);

    // 重新检查 iflow 状态
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

.iflow-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--bg-primary, white);
  padding: 20px;
}

.warning-content {
  max-width: 600px;
  text-align: center;
}

.warning-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.warning-text h3 {
  margin-bottom: 16px;
  color: var(--text-primary, #333);
  font-size: 24px;
}

.warning-text p {
  margin-bottom: 12px;
  color: var(--text-secondary, #666);
  line-height: 1.6;
  font-size: 14px;
}

.warning-text .install-step {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--bg-tertiary, #f0f0f0);
  border-left: 4px solid var(--primary-color, #4a90e2);
  border-radius: 4px;
}

.warning-text .install-step strong {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary, #333);
  font-size: 15px;
}

.warning-text .hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary, #999);
}

.warning-text code {
  display: inline-block;
  padding: 4px 8px;
  background: var(--bg-tertiary, #f0f0f0);
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: var(--primary-color, #4a90e2);
  margin: 4px 0;
}

.warning-note {
  margin-top: 20px;
  padding: 12px 16px;
  background: var(--primary-light, #e8f4ff);
  border-left: 4px solid var(--primary-color, #4a90e2);
  border-radius: 4px;
  color: var(--primary-color, #4a90e2);
  font-size: 13px;
}

.check-btn {
  margin-top: 20px;
  padding: 10px 24px;
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.check-btn:hover {
  background: var(--primary-hover, #357abd);
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
  .iflow-warning {
    background: var(--bg-primary, #1a1a1a);
  }

  .warning-text h3 {
    color: var(--text-primary, #f0f0f0);
  }

  .warning-text p {
    color: var(--text-secondary, #aaa);
  }

  .warning-text code {
    background: var(--bg-tertiary, #2d2d2d);
  }

  .warning-note {
    background: var(--primary-dark, #1a4d7a);
  }

  .sidebar-left {
    border-right-color: var(--border-color, #404040);
  }

  .sidebar-right {
    border-left-color: var(--border-color, #404040);
  }
}
</style>
