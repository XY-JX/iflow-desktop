/**
 * 估算文本的 Token 数量
 * 简单实现：中文字符每个算 1.5 个 token，英文字符每个算 0.25 个 token
 */
export function estimateTokenCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;

  let chineseChars = 0;
  let englishChars = 0;

  try {
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      // 中文字符范围
      if (char >= 0x4e00 && char <= 0x9fff) {
        chineseChars++;
      } else {
        englishChars++;
      }
    }
  } catch (error) {
    console.error('Token 计算失败:', error);
    return 0;
  }

  // 估算：中文 ~1.5 tokens/字，英文 ~0.25 tokens/字符
  return Math.round(chineseChars * 1.5 + englishChars * 0.25);
}

/**
 * 计算对话历史的总 Token 数
 */
export function calculateConversationTokens(
  messages: Array<{ role: string; content: string }>,
): number {
  let totalTokens = 0;

  for (const message of messages) {
    // system prompt 额外计算
    if (message.role === 'system') {
      totalTokens += estimateTokenCount(message.content);
    } else {
      totalTokens += estimateTokenCount(message.content);
    }
  }

  return totalTokens;
}

/**
 * 截断对话历史，保留最近的 N 轮对话
 * @param messages 完整对话历史
 * @param maxTokens 最大 Token 数限制
 * @param systemPrompt 系统提示词 (始终保留)
 * @returns 截断后的对话历史
 */
export function truncateConversation(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  systemPrompt?: string,
): Array<{ role: string; content: string }> {
  if (messages.length === 0) return messages;

  // 分离系统提示和其他消息
  const systemMessages = messages.filter((m) => m.role === 'system');
  const otherMessages = messages.filter((m) => m.role !== 'system');

  // 如果有系统提示词，使用传入的；否则使用原有的
  const finalSystemPrompt = systemPrompt || systemMessages[0]?.content;

  // 从最新的消息开始向前遍历，累加 Token 数
  let currentTokens = 0;
  const resultMessages: Array<{ role: string; content: string }> = [];

  // 如果有限制
  if (maxTokens > 0) {
    // 先计算系统提示的 Token
    if (finalSystemPrompt) {
      currentTokens += estimateTokenCount(finalSystemPrompt);
    }

    // 从后向前遍历 (从最新的消息开始)
    for (let i = otherMessages.length - 1; i >= 0; i--) {
      const message = otherMessages[i];
      const messageTokens = estimateTokenCount(message.content);

      // 如果加上这条消息不超过限制，就添加
      if (currentTokens + messageTokens <= maxTokens) {
        resultMessages.unshift(message);
        currentTokens += messageTokens;
      } else {
        // 超过限制，停止添加
        break;
      }
    }
  } else {
    // 没有限制，返回所有消息
    return messages;
  }

  // 构建最终结果
  const finalMessages: Array<{ role: string; content: string }> = [];

  // 添加系统提示
  if (finalSystemPrompt) {
    finalMessages.push({
      role: 'system',
      content: finalSystemPrompt,
    });
  }

  // 添加其他消息
  finalMessages.push(...resultMessages);

  return finalMessages;
}
