/**
 * 聊天处理 Composable
 * 处理消息发送、流式响应监听、事件清理
 */

import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../stores/chatStore';
import { generateId } from '../utils/common';
import { estimateTokenCount, truncateConversation } from '../utils/tokenUtils';
import { APP_CONSTANTS, RESERVED_TOKENS, DEFAULTS } from '../constants';
import { info, error as logError } from '../utils/logger';
import { isTauri } from '../utils/api/tauri';
import type { Message, AiChunkPayload, AiCompletePayload, AiErrorPayload } from '../types';

export function useChatHandler() {
  const chatStore = useChatStore();
  const { conversations, activeConversationId, currentMessages, isGenerating } = storeToRefs(chatStore);
  const { addMessage, setGenerating, setThinking, clearThinking, saveToStorage } = chatStore;

  const latestThinking = ref('');

  // 当前模型
  const currentModel = ref('glm-4.6v');

  // 设置
  const systemPrompt = ref<string>(DEFAULTS.SYSTEM_PROMPT);
  const temperature = ref<number>(APP_CONSTANTS.DEFAULT_TEMPERATURE);
  const maxTokens = ref<number>(APP_CONSTANTS.DEFAULT_MAX_TOKENS);

  // 事件监听清理函数
  let activeUnlisteners: Array<() => void> = [];

  // 获取当前活动对话
  function getActiveConversation() {
    return conversations.value.find((c) => c.id === activeConversationId.value);
  }

  // 更新消息内容
  function updateMessageContent(
    messageId: string,
    content: string,
    executionInfo?: Message['executionInfo'],
  ) {
    const conversation = getActiveConversation();
    if (conversation) {
      const message = conversation.messages.find((m) => m.id === messageId);
      if (message) {
        message.content = content;
        message.thinking = undefined;
        if (executionInfo) {
          message.executionInfo = executionInfo;
        }
        saveToStorage();
      }
    }
  }

  // 清理事件监听
  function cleanupListeners() {
    activeUnlisteners.forEach(fn => fn());
    activeUnlisteners = [];
  }

  // 发送消息
  async function sendMessage(content: string, zhipuReady: boolean) {
    if (!zhipuReady || !isTauri()) {
      return false;
    }

    // 如果没有活动对话，创建一个
    if (!activeConversationId.value) {
      chatStore.createNewConversation();
    }

    // 添加用户消息
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    // 设置生成状态
    setGenerating(true);

    try {
      // 先创建一个空的助手消息
      const assistantMessageId = generateId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      addMessage(assistantMessage);

      // 构建对话历史
      const conversation = getActiveConversation();
      const allMessages =
        conversation?.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })) || [];

      // 自动截断超出限制的对话历史
      const messagesForApi = truncateConversation(
        allMessages,
        maxTokens.value - RESERVED_TOKENS,
        systemPrompt.value,
        10,
      );

      // 监听 AI chunk 事件
      const unlistenChunk = await listen<AiChunkPayload>('ai-chunk', (event) => {
        const data = event.payload;

        if (data.chunk) {
          latestThinking.value = data.full_content || '';
        }

        if (data.full_content) {
          const conv = getActiveConversation();
          if (conv) {
            const msg = conv.messages.find((m) => m.id === assistantMessageId);
            if (msg) {
              msg.content = data.full_content;
            }
          }
        }
      });

      // 监听 AI 完成事件
      const unlistenComplete = await listen<AiCompletePayload>('ai-complete', (event) => {
        const data = event.payload;

        const inputTokens = estimateTokenCount(messagesForApi.map((m) => m.content).join('\n'));
        const outputTokens = estimateTokenCount(data.content);

        updateMessageContent(assistantMessageId, data.content, {
          session_id: '',
          conversation_id: '',
          assistant_rounds: 1,
          execution_time_ms: data.execution_time_ms ?? 0,
          token_usage: {
            input: inputTokens,
            output: outputTokens,
            total: inputTokens + outputTokens,
          },
        });

        setGenerating(false);
        latestThinking.value = '';
        cleanupListeners();
      });

      // 监听 AI 错误事件
      const unlistenError = await listen<AiErrorPayload>('ai-error', (event) => {
        const data = event.payload;
        updateMessageContent(assistantMessageId, `❌ ${data.error}`, undefined);
        setGenerating(false);
        cleanupListeners();
      });

      activeUnlisteners = [unlistenChunk, unlistenComplete, unlistenError];

      // 调用流式 API
      await invoke('send_message_to_zhipu_stream_with_context', {
        messages: messagesForApi,
        model: currentModel.value,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
        system_prompt: systemPrompt.value,
      });

      return true;
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `❌ 获取回复失败：${error}`,
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
      setGenerating(false);
      return false;
    }
  }

  // 停止生成
  function stopGeneration() {
    cleanupListeners();
    setGenerating(false);
    latestThinking.value = '';
  }

  return {
    // 状态
    latestThinking,
    currentModel,
    systemPrompt,
    temperature,
    maxTokens,
    isGenerating,
    // 方法
    sendMessage,
    stopGeneration,
    cleanupListeners,
  };
}
