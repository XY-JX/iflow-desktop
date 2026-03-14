<template>
  <div class="main-layout">
    <!-- 主界面 -->
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
      <div class="toolbar">
        <div class="status-indicator">
          <div :class="['status-dot', iflowRunning ? 'running' : 'stopped']"></div>
          <span class="status-text">
            iFlow CLI: {{ iflowRunning ? '运行中' : '已停止' }}
          </span>
        </div>
        <button @click="toggleIflow" :class="['btn-toggle', iflowRunning ? 'btn-stop' : 'btn-start']">
          {{ iflowRunning ? '⏹️ 停止' : '🚀 启动' }}
        </button>
        <span v-if="iflowStatus" class="status-message">{{ iflowStatus }}</span>
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
import { invoke } from '@tauri-apps/api/core';
import ChatHistory from './ChatHistory.vue';
import ChatInterface from './ChatInterface.vue';
import FileExplorer from './FileExplorer.vue';
import FileEditor from './FileEditor.vue';
import type { Conversation, Message, Model, FileItem } from '../types';

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

// iFlow 启动状态
const iflowStatus = ref<string>('');
const iflowRunning = ref(false);

// 检查 iFlow 运行状态
async function checkIflowStatus() {
  try {
    const isRunning = await invoke<boolean>('check_iflow_running');
    iflowRunning.value = isRunning;
  } catch (error) {
    console.error('检查 iFlow 状态失败:', error);
    iflowRunning.value = false;
  }
}

// 切换 iFlow 状态
async function toggleIflow() {
  if (iflowRunning.value) {
    // 停止 iFlow
    iflowStatus.value = '正在停止 iFlow CLI...';
    try {
      const result = await invoke<string>('stop_iflow');
      iflowStatus.value = result;
      await checkIflowStatus();
      setTimeout(() => {
        iflowStatus.value = '';
      }, 2000);
    } catch (error) {
      iflowStatus.value = `停止失败: ${error}`;
      setTimeout(() => {
        iflowStatus.value = '';
      }, 3000);
    }
  } else {
    // 启动 iFlow
    iflowStatus.value = '正在启动 iFlow CLI...';
    try {
      const result = await invoke<string>('start_iflow');
      iflowStatus.value = result;
      await checkIflowStatus();
      setTimeout(() => {
        iflowStatus.value = '';
      }, 2000);
    } catch (error) {
      iflowStatus.value = `启动失败: ${error}`;
      setTimeout(() => {
        iflowStatus.value = '';
      }, 3000);
    }
  }
}

// 组件挂载时自动检查并启动 iFlow
onMounted(async () => {
  await checkIflowStatus();
  if (!iflowRunning.value) {
    await toggleIflow();
  }
});

// 当前对话的消息
const currentMessages = computed(() => {
  if (!activeConversationId.value) return [];
  const conversation = conversations.value.find(c => c.id === activeConversationId.value);
  return conversation?.messages || [];
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
  // 如果没有活动对话，创建一个
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

  // 添加提示消息
  const guideMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: `💡 提示：\n\n"我的一个梦" 桌面应用用于管理文件和对话历史。\n\n🚀 iFlow CLI 已自动启动！在打开的命令窗口中登录即可使用。\n\n📋 快速开始：\n1. iFlow CLI 已自动启动\n2. 在打开的命令窗口中选择 "Login with iFlow" 登录\n3. 完成浏览器授权\n4. 开始使用 AI 辅助编程\n\n⚙️ 状态管理：\n- 顶部状态栏显示 iFlow 运行状态\n- 点击"启动/停止"按钮可手动控制\n\n📚 详细文档：https://platform.iflow.cn/cli/quickstart\n\n🎯 当前对话已保存，您可以随时继续。`,
    timestamp: Date.now(),
  };
  conversation.messages.push(guideMessage);
  conversation.updatedAt = Date.now();
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

.sidebar-left {
  border-right: 1px solid var(--border-color, #e0e0e0);
}

.main-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-color, #ffffff);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.running {
  background: #52c41a;
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.6);
  animation: pulse 2s infinite;
}

.status-dot.stopped {
  background: #ff4d4f;
  box-shadow: 0 0 8px rgba(255, 77, 79, 0.6);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.status-text {
  font-size: 14px;
  color: var(--text-color, #333);
  font-weight: 500;
}

.btn-toggle {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 100px;
}

.btn-start {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(82, 196, 26, 0.3);
}

.btn-start:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(82, 196, 26, 0.4);
}

.btn-stop {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
}

.btn-stop:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 77, 79, 0.4);
}

.btn-toggle:active {
  transform: translateY(0);
}

.btn-primary {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.status-message {
  font-size: 14px;
  color: var(--text-color-secondary, #666);
}

@media (prefers-color-scheme: dark) {
  .toolbar {
    border-bottom-color: var(--border-color, #404040);
    background: var(--bg-color, #1e1e1e);
  }

  .status-message {
    color: var(--text-color-secondary, #999);
  }
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
  .sidebar-left {
    border-right-color: var(--border-color, #404040);
  }

  .sidebar-right {
    border-left-color: var(--border-color, #404040);
  }

  .toolbar {
    border-bottom-color: var(--border-color, #404040);
    background: var(--bg-color, #1e1e1e);
  }

  .status-indicator {
    background: var(--bg-secondary, #2d2d2d);
  }

  .status-text {
    color: var(--text-color, #e0e0e0);
  }

  .status-message {
    color: var(--text-color-secondary, #999);
  }
}
</style>