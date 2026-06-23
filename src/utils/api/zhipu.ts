/**
 * 智谱AI API封装
 * 提供统一的智谱AI接口调用
 */

import { invoke } from '@tauri-apps/api/core';
import type { Message, ZhipuModelInfo, ContextConfig } from '../../types';
import { isTauri } from './tauri';
import { warn } from '../logger';

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
): Promise<{ response: string }> {
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
): Promise<{ response: string }> {
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
  _apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model?: string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string,
  _contextConfig?: ContextConfig
): Promise<void> {
  if (!isTauri()) {
    throw new Error('非 Tauri 环境，无法调用智谱 AI');
  }
  return invoke('send_message_to_zhipu_stream_with_context', {
    messages,
    model,
    temperature,
    maxTokens,
    systemPrompt,
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
    warn('Zhipu', '非 Tauri 环境，返回空列表');
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
