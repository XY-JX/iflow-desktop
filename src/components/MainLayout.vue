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
      <!-- iflow 状态提示横幅 -->
      <div v-if="!iflowReady" class="iflow-status-banner">
        <div class="banner-content">
          <span class="banner-icon">💡</span>
          <span class="banner-text">
            推荐使用独立终端运行 iFlow CLI 以获得最佳体验。点击查看使用指南。
          </span>
          <button class="banner-btn" @click="showGuide = true">查看指南</button>
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

    <!-- iFlow 使用指南对话框 -->
    <div v-if="showGuide" class="guide-modal" @click.self="showGuide = false">
      <div class="guide-content">
        <div class="guide-header">
          <h3>iFlow CLI 使用指南</h3>
          <button class="close-btn" @click="showGuide = false">✕</button>
        </div>
        <div class="guide-body">
          <div v-if="guideText" class="guide-text">{{ guideText }}</div>
          <div v-else class="guide-loading">加载中...</div>
        </div>
      </div>
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
const iflowReady = ref(true);
const showGuide = ref(false);
const guideText = ref('');

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
  } catch (error) {
    console.error('检查 iflow 状态失败:', error);
    iflowInstalled.value = false;
  }
}

// 加载使用指南
async function loadGuide() {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const guide = await invoke<string>('get_iflow_guide');
    guideText.value = guide;
  } catch (error) {
    console.error('加载指南失败:', error);
  }
}

// 组件挂载时检查 iflow
onMounted(() => {
  checkIflowStatus();
  loadGuide();
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
    content: `💡 提示：\n\n为了获得最佳的 AI 编程体验，建议使用独立的终端运行 iFlow CLI。\n\n📋 快速开始：\n1. 打开命令提示符或 PowerShell\n2. 运行：iflow\n3. 完成登录授权\n4. 开始使用 AI 辅助编程\n\n📚 详细文档：https://platform.iflow.cn/cli/quickstart\n\n🎯 当前对话已保存，您可以随时继续。`,
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

.guide-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.guide-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.guide-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary, #333);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary, #999);
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: var(--text-primary, #333);
}

.guide-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.guide-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--text-primary, #333);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.guide-loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary, #999);
}

@media (prefers-color-scheme: dark) {
  .iflow-status-banner {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  }
  
  .guide-content {
    background: var(--bg-primary, #1a1a1a);
  }
  
  .guide-header h3 {
    color: var(--text-primary, #f0f0f0);
  }
  
  .guide-text {
    color: var(--text-primary, #f0f0f0);
  }
  
  .sidebar-left {
    border-right-color: var(--border-color, #404040);
  }

  .sidebar-right {
    border-left-color: var(--border-color, #404040);
  }
}
</style>