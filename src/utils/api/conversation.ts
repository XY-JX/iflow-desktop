/**
 * 对话管理API封装
 */

import { invoke } from '@tauri-apps/api/core';
import type { Conversation } from '../../types';

/**
 * 加载对话历史
 */
export async function loadConversations(): Promise<Conversation[]> {
  return invoke('load_conversations');
}

/**
 * 保存对话历史
 */
export async function saveConversations(conversations: Conversation[]): Promise<void> {
  return invoke('save_conversations', { conversations });
}

// 默认导出所有函数作为命名空间对象
const conversationApi = {
  loadConversations,
  saveConversations,
};

export default conversationApi;
