/**
 * 对话管理API封装
 */

import { invoke } from '@tauri-apps/api/core';
import type { Conversation } from '../../types';
import { isTauri } from './tauri';
import { warn } from '../logger';

/**
 * 加载对话历史
 */
export async function loadConversations(): Promise<Conversation[]> {
  if (!isTauri()) {
    warn('Conversation', '非 Tauri 环境，返回空列表');
    return [];
  }
  return invoke('load_conversations');
}

/**
 * 保存对话历史
 */
export async function saveConversations(conversations: Conversation[]): Promise<void> {
  if (!isTauri()) {
    warn('Conversation', '非 Tauri 环境，跳过保存');
    return;
  }
  return invoke('save_conversations', { conversations });
}

// 默认导出所有函数作为命名空间对象
const conversationApi = {
  loadConversations,
  saveConversations,
};

export default conversationApi;
