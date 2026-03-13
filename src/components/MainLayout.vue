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
import { ref, computed } from 'vue';
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
    content: `💡 提示：\n\n"我的一个梦" 桌面应用用于管理文件和对话历史。\n\n🚀 要使用 AI 编程功能，请在命令提示符中运行：\n\n  iflow\n\n📋 快速开始：\n1. 打开命令提示符或 PowerShell\n2. 运行：iflow\n3. 选择 "Login with iFlow" 登录\n4. 开始使用 AI 辅助编程\n\n📚 详细文档：https://platform.iflow.cn/cli/quickstart\n\n🎯 当前对话已保存，您可以随时继续。`,
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
}
</style>