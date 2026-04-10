import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Conversation, Message } from '../types';

export const useChatStore = defineStore('chat', () => {
  // 状态
  const conversations = ref<Conversation[]>([]);
  const activeConversationId = ref<string | undefined>();
  const isGenerating = ref(false);
  const latestThinking = ref<string>('');

  // 本地存储键名
  const STORAGE_KEY = 'iflow_conversations';

  // 从 localStorage 加载对话
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        conversations.value = data || [];
        console.log(`已加载 ${conversations.value.length} 个对话`);
      }
    } catch (error) {
      console.error('加载对话历史失败:', error);
    }
  }

  // 保存到 localStorage
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.value));
      console.log(`已保存 ${conversations.value.length} 个对话`);
    } catch (error) {
      console.error('保存对话历史失败:', error);
    }
  }

  // 监听对话变化，自动保存
  watch(conversations, () => {
    saveToStorage();
  }, { deep: true });

  // 计算属性
  const currentMessages = computed(() => {
    if (!activeConversationId.value) return [];
    const conversation = conversations.value.find(c => c.id === activeConversationId.value);
    return conversation?.messages || [];
  });

  const activeConversation = computed(() => {
    return conversations.value.find(c => c.id === activeConversationId.value);
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
    return newConversation;
  }

  function selectConversation(id: string) {
    activeConversationId.value = id;
  }

  function deleteConversation(id: string) {
    conversations.value = conversations.value.filter(c => c.id !== id);
    if (activeConversationId.value === id) {
      activeConversationId.value = undefined;
    }
  }

  function addMessage(message: Message) {
    const conversation = activeConversation.value;
    if (!conversation) return;
    
    conversation.messages.push(message);
    conversation.updatedAt = Date.now();
    
    // 如果是第一条消息，更新标题
    if (conversation.messages.length === 1 && message.role === 'user') {
      conversation.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
    }
  }

  function updateConversationTitle(title: string) {
    const conversation = activeConversation.value;
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = Date.now();
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

  function loadConversations(data: Conversation[]) {
    conversations.value = data;
  }

  // 标签管理
  function addTag(conversationId: string, tag: string) {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (!conversation) return;
    
    if (!conversation.tags) {
      conversation.tags = [];
    }
    
    // 避免重复标签
    if (!conversation.tags.includes(tag)) {
      conversation.tags.push(tag);
      conversation.updatedAt = Date.now();
    }
  }

  function removeTag(conversationId: string, tag: string) {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (!conversation || !conversation.tags) return;
    
    conversation.tags = conversation.tags.filter(t => t !== tag);
    conversation.updatedAt = Date.now();
  }

  function getUniqueTags(): string[] {
    const tagsSet = new Set<string>();
    conversations.value.forEach(conv => {
      conv.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }

  function filterByTag(tag: string): Conversation[] {
    return conversations.value.filter(conv => conv.tags?.includes(tag));
  }

  return {
    // 状态
    conversations,
    activeConversationId,
    isGenerating,
    latestThinking,
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
    loadConversations,
    loadFromStorage,
    saveToStorage,
    // 标签管理
    addTag,
    removeTag,
    getUniqueTags,
    filterByTag,
  };
});
