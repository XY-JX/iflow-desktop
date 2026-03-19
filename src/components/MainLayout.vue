<template>
  <div class="main-layout">
    <!-- 主界面 -->
    <div class="sidebar-left">
      <ChatHistory
        :conversations="conversations"
        :active-conversation-id="activeConversationId"
        @new-chat="handleNewChat"
        @select-conversation="selectConversationWrapper"
        @delete-conversation="deleteConversationWrapper"
      />
    </div>

    <div class="main-content">
      <div class="toolbar">
        <div class="status-indicator">
          <div :class="['status-dot', iflowRunning ? 'running' : 'stopped']"></div>
          <span class="status-text">
            iFlow: {{ iflowRunning ? '已就绪' : '未就绪' }}
          </span>
        </div>
        <button @click="toggleIflow" :class="['btn-toggle', iflowRunning ? 'btn-stop' : 'btn-start']">
          {{ iflowRunning ? '⏹️ 停止服务' : '🚀 启动服务' }}
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
      <div class="sidebar-right-top">
        <div class="panel-header">
          <span class="panel-title">📁 文件浏览器</span>
        </div>
        <FileExplorer
          @file-selected="handleFileSelected"
        />
      </div>
      <div class="sidebar-right-bottom">
        <div class="panel-header">
          <span class="panel-title">🧠 思考过程</span>
        </div>
        <div class="thinking-display">
          <div v-if="latestThinking" class="thinking-content">
            <div class="thinking-note">
              ℹ️ 注意：以下显示的是 AI 的思考和回答过程
            </div>
            {{ latestThinking }}
          </div>
          <div v-else class="thinking-placeholder">
            <span class="placeholder-icon">💭</span>
            <span class="placeholder-text">思考过程将显示在这里</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedFile" class="editor-panel">
      <FileEditor
        :file="selectedFile"
        @close="clearSelection"
        @saved="handleFileSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../stores/chatStore';
import { useFileStore } from '../stores/fileStore';
import { useIflowStore } from '../stores/iflowStore';
import ChatHistory from './ChatHistory.vue';
import ChatInterface from './ChatInterface.vue';
import FileExplorer from './FileExplorer.vue';
import FileEditor from './FileEditor.vue';
import type { Message, Model, FileItem } from '../types';

// 初始化 Store
const chatStore = useChatStore();
const fileStore = useFileStore();
const iflowStore = useIflowStore();

// 解构状态 (使用 storeToRefs 保持响应式)
const { conversations, activeConversationId, currentMessages, isGenerating, latestThinking } = storeToRefs(chatStore);
const { createNewConversation, selectConversation, deleteConversation: storeDeleteConversation, addMessage, setGenerating, setThinking } = chatStore;
const { selectedFile, selectFile, clearSelection } = fileStore;
const iflowStoreRefs = storeToRefs(iflowStore);
const { iflowRunning, iflowStatus } = iflowStoreRefs;

// 当前模型 (本地状态)
const availableModels: Model[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'glm-4', name: 'GLM-4', provider: '智谱 AI' },
];
const currentModel = ref('glm-4');

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
      iflowStatus.value = `停止失败：${error}`;
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
      iflowStatus.value = `启动失败：${error}`;
      setTimeout(() => {
        iflowStatus.value = '';
      }, 3000);
    }
  }
}

// 组件挂载时检查 iFlow 状态
onMounted(async () => {
  await checkIflowStatus();
});

// 当前对话的消息 (从 store 计算属性获取)
// const currentMessages = computed(() => {
//   if (!activeConversationId.value) return [];
//   const conversation = conversations.value.find(c => c.id === activeConversationId.value);
//   return conversation?.messages || [];
// });

// 创建新对话
function handleNewChat() {
  createNewConversation('新对话', currentModel.value);
}

// 选择对话
function selectConversationWrapper(id: string) {
  selectConversation(id);
  const conversation = conversations.value.find(c => c.id === id);
  if (conversation) {
    currentModel.value = conversation.model;
  }
}

// 删除对话
function deleteConversationWrapper(id: string) {
  storeDeleteConversation(id);
}

// 发送消息
async function handleSendMessage(content: string) {
  // 如果没有活动对话，创建一个
  if (!activeConversationId.value) {
    createNewConversation();
  }

  // 添加用户消息
  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: Date.now(),
  };
  addMessage(userMessage);

  // 设置生成状态
  setGenerating(true);
  setThinking('正在思考...');

  try {
    // 调用 iFlow CLI 获取回复
    const response = await invoke<Record<string, any>>('send_message_to_iflow', {
      message: content
    });

    // 提取内容
    const assistantContent = response.content || '';
    const executionInfo = response.execution_info;

    // 更新思考过程显示
    setThinking(assistantContent);

    // 创建助手消息
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: assistantContent,
      timestamp: Date.now(),
      executionInfo: executionInfo
    };

    addMessage(assistantMessage);
  } catch (error) {
    // 添加错误消息
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `❌ 获取回复失败：${error}`,
      timestamp: Date.now(),
    };
    addMessage(errorMessage);
    setThinking('获取回复失败');
  } finally {
    setGenerating(false);
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
  selectFile(file);
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
  box-sizing: border-box;
}

.sidebar-left {
  border-right: 1px solid var(--border-color, #e0e0e0);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-color, #ffffff);
  flex-shrink: 0;
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  min-height: 0;
}

.sidebar-right-top {
  flex: 1;
  overflow: hidden;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.sidebar-right-bottom {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-header {
  padding: 12px 16px;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary, #333);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.thinking-display {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 16px;
  min-height: 0;
}

.thinking-content {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary, #333);
  white-space: pre-wrap;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.thinking-note {
  background: var(--thinking-bg, #fff7e6);
  border-left: 3px solid var(--thinking-border, #ffd591);
  padding: 8px 12px;
  margin-bottom: 12px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--thinking-text, #d46b08);
  font-style: italic;
}

.thinking-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #999);
  gap: 12px;
}

.placeholder-icon {
  font-size: 32px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 13px;
  opacity: 0.7;
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