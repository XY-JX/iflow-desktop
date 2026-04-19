import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Conversation, Message } from '../types';
import { info, error as logError } from '../utils/logger';
import conversationApi from '../utils/api/conversation';

export const useChatStore = defineStore('chat', () => {
  // 状态
  const conversations = ref<Conversation[]>([]);
  const activeConversationId = ref<string | undefined>();
  const isGenerating = ref(false);
  const latestThinking = ref<string>('');
  const isLoading = ref(false); // 加载状态
  const lastSaveTime = ref<number>(0); // 上次保存时间
  const SAVE_THROTTLE = 1000; // 保存节流: 1秒

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

  // 保存到 Rust 后端 (带节流)
  async function saveToStorage() {
    const now = Date.now();
    // 节流: 如果距离上次保存不足 1 秒,跳过
    if (now - lastSaveTime.value < SAVE_THROTTLE) {
      return;
    }

    try {
      await conversationApi.saveConversations(conversations.value);
      lastSaveTime.value = now;
      info('chatStore', `已保存 ${conversations.value.length} 个对话`);
    } catch (error) {
      logError('chatStore', '保存对话历史失败:', error);
    }
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
  function createNewConversation(title: string = '新对话', model: string = 'glm-4'): Conversation {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title,
      messages: [],
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    conversations.value.unshift(newConversation);
    activeConversationId.value = newConversation.id;
    
    // 自动保存
    saveToStorage();
    return newConversation;
  }

  function selectConversation(id: string) {
    activeConversationId.value = id;
  }

  function deleteConversation(id: string) {
    conversations.value = conversations.value.filter((c) => c.id !== id);
    if (activeConversationId.value === id) {
      activeConversationId.value = undefined;
    }
    
    // 自动保存
    saveToStorage();
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
    
    // 自动保存
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

  // 标签管理
  function addTag(conversationId: string, tag: string) {
    const conversation = conversations.value.find((c) => c.id === conversationId);
    if (!conversation) return;

    if (!conversation.tags) {
      conversation.tags = [];
    }

    // 避免重复标签
    if (!conversation.tags.includes(tag)) {
      conversation.tags.push(tag);
      conversation.updatedAt = Date.now();
      saveToStorage();
    }
  }

  function removeTag(conversationId: string, tag: string) {
    const conversation = conversations.value.find((c) => c.id === conversationId);
    if (!conversation || !conversation.tags) return;

    conversation.tags = conversation.tags.filter((t) => t !== tag);
    conversation.updatedAt = Date.now();
    saveToStorage();
  }

  function getUniqueTags(): string[] {
    const tagsSet = new Set<string>();
    conversations.value.forEach((conv) => {
      conv.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }

  function filterByTag(tag: string): Conversation[] {
    return conversations.value.filter((conv) => conv.tags?.includes(tag));
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
    // 标签管理
    addTag,
    removeTag,
    getUniqueTags,
    filterByTag,
  };
});
