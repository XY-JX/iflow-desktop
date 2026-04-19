/**
 * 智谱AI API封装
 * 提供统一的智谱AI接口调用
 */

import { invoke } from '@tauri-apps/api/core';
import type { Message, ZhipuModelInfo } from '../../types';

/**
 * 检查是否在 Tauri 环境中
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * 初始化智谱客户端
 */
export async function initZhipuClient(apiKey: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('非 Tauri 环境，无法初始化智谱 AI');
  }
  return invoke('init_zhipu_client', { apiKey });
}

/**
 * 发送消息(简单模式)
 */
export async function sendMessage(
  apiKey: string,
  content: string,
  model?: string,
  temperature?: number,
  maxTokens?: number
): Promise<any> {
  if (!isTauri()) {
    throw new Error('非 Tauri 环境，无法调用智谱 AI');
  }
  return invoke('send_message_to_zhipu', {
    apiKey,
    content,
    model,
    temperature,
    maxTokens,
  });
}

/**
 * 发送消息(带历史消息)
 */
export async function sendMessageWithMessages(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model?: string,
  temperature?: number,
  maxTokens?: number
): Promise<any> {
  if (!isTauri()) {
    throw new Error('非 Tauri 环境，无法调用智谱 AI');
  }
  return invoke('send_message_to_zhipu_with_messages', {
    apiKey,
    messages,
    model,
    temperature,
    maxTokens,
  });
}

/**
 * 流式发送消息
 */
export async function sendStreamMessage(
  apiKey: string,
  content: string,
  model?: string,
  temperature?: number,
  maxTokens?: number
): Promise<void> {
  if (!isTauri()) {
    throw new Error('非 Tauri 环境，无法调用智谱 AI');
  }
  return invoke('send_message_to_zhipu_stream', {
    apiKey,
    content,
    model,
    temperature,
    maxTokens,
  });
}

/**
 * 流式发送消息(带上下文压缩)
 */
export async function sendStreamMessageWithContext(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model?: string,
  temperature?: number,
  maxTokens?: number,
  contextConfig?: any
): Promise<void> {
  if (!isTauri()) {
    throw new Error('非 Tauri 环境，无法调用智谱 AI');
  }
  return invoke('send_message_to_zhipu_stream_with_context', {
    apiKey,
    messages,
    model,
    temperature,
    maxTokens,
    contextConfig,
  });
}

/**
 * 检查智谱状态
 */
export async function checkStatus(): Promise<{ ready: boolean; status: string }> {
  if (!isTauri()) {
    return { ready: false, status: '非 Tauri 环境' };
  }
  return invoke('check_zhipu_status');
}

/**
 * 获取可用模型列表
 */
export async function fetchModels(): Promise<ZhipuModelInfo[]> {
  if (!isTauri()) {
    console.warn('[Zhipu] 非 Tauri 环境，返回空列表');
    return [];
  }
  return invoke('fetch_zhipu_models');
}

// 默认导出所有函数作为命名空间对象
const zhipuApi = {
  initZhipuClient,
  sendMessage,
  sendMessageWithMessages,
  sendStreamMessage,
  sendStreamMessageWithContext,
  checkStatus,
  fetchModels,
};

export default zhipuApi;
