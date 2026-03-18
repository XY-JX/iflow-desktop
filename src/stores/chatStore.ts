import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Conversation, Message } from '../types';

export const useChatStore = defineStore('chat', () => {
  // 状态
  const conversations = ref<Conversation[]>([]);
  const activeConversationId = ref<string | undefined>();
  const isGenerating = ref(false);
  const latestThinking = ref<string>('');

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
  };
});
