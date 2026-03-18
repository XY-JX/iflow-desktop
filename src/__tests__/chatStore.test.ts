import { describe, it, expect } from 'vitest';
import { useChatStore } from '../stores/chatStore';
import { createPinia, setActivePinia } from 'pinia';

describe('ChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('初始化时状态为空', () => {
    const store = useChatStore();
    expect(store.conversations).toEqual([]);
    expect(store.activeConversationId).toBeUndefined();
    expect(store.currentMessages).toEqual([]);
  });

  it('创建新对话', () => {
    const store = useChatStore();
    const conversation = store.createNewConversation('测试对话', 'gpt-4');
    
    expect(conversation.title).toBe('测试对话');
    expect(conversation.model).toBe('gpt-4');
    expect(store.conversations.length).toBe(1);
    expect(store.activeConversationId).toBe(conversation.id);
  });

  it('删除对话', () => {
    const store = useChatStore();
    const conversation = store.createNewConversation();
    const id = conversation.id;
    
    store.deleteConversation(id);
    
    expect(store.conversations.length).toBe(0);
    expect(store.activeConversationId).toBeUndefined();
  });

  it('添加消息到当前对话', () => {
    const store = useChatStore();
    store.createNewConversation();
    
    const message = {
      id: '1',
      role: 'user' as const,
      content: '你好',
      timestamp: Date.now(),
    };
    
    store.addMessage(message);
    
    expect(store.currentMessages.length).toBe(1);
    expect(store.currentMessages[0].content).toBe('你好');
  });

  it('更新思考过程', () => {
    const store = useChatStore();
    
    store.setThinking('正在思考...');
    expect(store.latestThinking).toBe('正在思考...');
    
    store.setThinking('这是答案');
    expect(store.latestThinking).toBe('这是答案');
  });
});
