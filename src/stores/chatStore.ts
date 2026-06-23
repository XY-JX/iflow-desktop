import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Conversation, Message } from '../types';
import { info, error as logError } from '../utils/logger';
import conversationApi from '../utils/api/conversation';
import { generateId } from '../utils/common';
import { DEFAULTS } from '../constants';

export const useChatStore = defineStore('chat', () => {
  // 状态
  const conversations = ref<Conversation[]>([]);
  const activeConversationId = ref<string | undefined>();
  const isGenerating = ref(false);
  const latestThinking = ref<string>('');
  const isLoading = ref(false); // 加载状态
  let saveTimer: ReturnType<typeof setTimeout> | null = null; // 防抖定时器
  const SAVE_DEBOUNCE = 500; // 保存防抖: 500ms

  // 从 Rust 后端加载对话
  async function loadFromStorage() {
    isLoading.value = true;
    try {
      const data = await conversationApi.loadConversations();
      conversations.value = data || [];
      info('chatStore', `已加载 ${conversations.value.length} 个对话`);
    } catch (error) {
      logError('chatStore', '加载对话历史失败:', error);
    } finally {
      isLoading.value = false;
    }
  }

  // 实际执行保存
  async function doSave() {
    try {
      // 使用 Pinia 的 $state 获取响应式数据的快照，避免昂贵的深拷贝
      const data = conversations.value.map(conv => ({
        ...conv,
        messages: [...conv.messages],
      }));
      await conversationApi.saveConversations(data);
      info('chatStore', `保存成功: ${data.length} 个对话`);
    } catch (error) {
      logError('chatStore', '保存对话历史失败:', error);
    }
  }

  // 保存到 Rust 后端 (带防抖)
  function saveToStorage() {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => {
      saveTimer = null;
      doSave();
    }, SAVE_DEBOUNCE);
  }

  // 立即保存（用于页面卸载等场景）
  async function saveToStorageImmediate() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    await doSave();
  }

  // 计算属性
  const currentMessages = computed(() => {
    if (!activeConversationId.value) return [];
    const conversation = conversations.value.find((c) => c.id === activeConversationId.value);
    return conversation?.messages || [];
  });

  const activeConversation = computed(() => {
    return conversations.value.find((c) => c.id === activeConversationId.value);
  });

  // 方法
  function createNewConversation(title: string = DEFAULTS.CONVERSATION_TITLE, model: string = DEFAULTS.MODEL): Conversation {
    const newConversation: Conversation = {
      id: generateId(),
      title,
      messages: [],
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    conversations.value.unshift(newConversation);
    activeConversationId.value = newConversation.id;

    // 自动保存（防抖）
    saveToStorage();
    return newConversation;
  }

  function selectConversation(id: string) {
    activeConversationId.value = id;
  }

  function deleteConversation(id: string) {
    info('chatStore', `删除对话: ${id}`);
    conversations.value = conversations.value.filter((c) => c.id !== id);
    if (activeConversationId.value === id) {
      activeConversationId.value = undefined;
    }

    // 立即保存（删除操作不能用防抖，否则刷新会丢失）
    saveToStorageImmediate().catch(err => {
      logError('chatStore', '删除后保存失败:', err);
    });
  }

  function addMessage(message: Message) {
    const conversation = activeConversation.value;
    if (!conversation) return;

    conversation.messages.push(message);
    conversation.updatedAt = Date.now();

    // 如果是第一条消息，更新标题
    if (conversation.messages.length === 1 && message.role === 'user') {
      conversation.title =
        message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
    }

    // 自动保存（防抖）
    saveToStorage();
  }

  function updateConversationTitle(title: string) {
    const conversation = activeConversation.value;
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = Date.now();
      saveToStorage();
    }
  }

  function setGenerating(generating: boolean) {
    isGenerating.value = generating;
  }

  function setThinking(thinking: string) {
    latestThinking.value = thinking;
  }

  function clearThinking() {
    latestThinking.value = '';
  }

  return {
    // 状态
    conversations,
    activeConversationId,
    isGenerating,
    latestThinking,
    isLoading,
    // 计算属性
    currentMessages,
    activeConversation,
    // 方法
    createNewConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    updateConversationTitle,
    setGenerating,
    setThinking,
    clearThinking,
    loadFromStorage,
    saveToStorage,
    saveToStorageImmediate,
  };
});
