/**
 * 估算文本的 Token 数量
 * 简化版：基于字符类型统计，性能优先
 */
import { TOKEN_WEIGHTS } from '../constants';

/**
 * 估算 Token 数量
 * CJK 字符约 1.5 token，英文单词约 0.75 token，代码字符约 0.5 token
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;

  let cjk = 0;
  let ascii = 0;
  let other = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    // CJK 字符
    if ((char >= 0x4e00 && char <= 0x9fff) || (char >= 0x3400 && char <= 0x4dbf)) {
      cjk++;
    }
    // ASCII（英文、数字、标点、代码符号）
    else if (char < 128) {
      ascii++;
    }
    // 其他（emoji、拉丁扩展等）
    else {
      other++;
    }
  }

  return Math.round(cjk * TOKEN_WEIGHTS.CJK + ascii * TOKEN_WEIGHTS.ASCII + other * 0.75);
}

/**
 * 计算对话历史的总 Token 数
 */
export function calculateConversationTokens(
  messages: Array<{ role: string; content: string }>,
): number {
  let totalTokens = 0;
  for (const message of messages) {
    totalTokens += estimateTokenCount(message.content);
  }
  return totalTokens;
}

/**
 * 截断对话历史，保留最近的 N 轮对话
 * @param messages 完整对话历史
 * @param maxTokens 最大 Token 数限制
 * @param systemPrompt 系统提示词 (始终保留)
 * @param recentRounds 保留最近完整对话轮数 (0 = 不限制)
 * @returns 截断后的对话历史
 */
export function truncateConversation(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  systemPrompt?: string,
  recentRounds: number = 0,
): Array<{ role: string; content: string }> {
  if (messages.length === 0) return messages;

  // 分离系统提示和其他消息
  const systemMessages = messages.filter((m) => m.role === 'system');
  const otherMessages = messages.filter((m) => m.role !== 'system');

  const finalSystemPrompt = systemPrompt || systemMessages[0]?.content;

  // 标记关键消息
  const isCritical = (content: string): boolean =>
    /```[\s\S]*?```/.test(content) ||
    /Error|错误|Exception/.test(content) ||
    /解决方案|Solution|Fix/.test(content);

  if (maxTokens <= 0) return messages;

  // 计算系统提示 token
  let currentTokens = finalSystemPrompt ? estimateTokenCount(finalSystemPrompt) : 0;

  // 从最新消息向前遍历，保留不超过限制的消息
  const resultMessages: Array<{ role: string; content: string }> = [];

  for (let i = otherMessages.length - 1; i >= 0; i--) {
    const msg = otherMessages[i];
    const tokens = estimateTokenCount(msg.content);

    if (currentTokens + tokens <= maxTokens) {
      resultMessages.unshift(msg);
      currentTokens += tokens;
    } else if (isCritical(msg.content) && resultMessages.length > 2) {
      // 关键消息：尝试替换最旧的非关键消息
      const oldestIdx = resultMessages.findIndex(
        (m) => !isCritical(m.content) && m.role !== 'system'
      );
      if (oldestIdx !== -1) {
        const removed = resultMessages[oldestIdx];
        const removedTokens = estimateTokenCount(removed.content);
        if (tokens <= removedTokens + 500) {
          resultMessages.splice(oldestIdx, 1);
          resultMessages.unshift(msg);
          currentTokens = currentTokens - removedTokens + tokens;
        }
      }
      break;
    } else {
      break;
    }
  }

  // 滑动窗口：确保至少保留最近 N 轮
  if (recentRounds > 0) {
    const minMessages = Math.min(recentRounds * 2, otherMessages.length);
    while (resultMessages.length < minMessages) {
      const idx = otherMessages.length - resultMessages.length - 1;
      if (idx < 0) break;
      const msg = otherMessages[idx];
      if (!resultMessages.some((m) => m.content === msg.content)) {
        resultMessages.unshift(msg);
      } else {
        break;
      }
    }
  }

  // 构建最终结果
  const finalMessages: Array<{ role: string; content: string }> = [];
  if (finalSystemPrompt) {
    finalMessages.push({ role: 'system', content: finalSystemPrompt });
  }
  finalMessages.push(...resultMessages);

  return finalMessages;
}
