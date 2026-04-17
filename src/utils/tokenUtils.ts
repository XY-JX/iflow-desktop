/**
 * 估算文本的 Token 数量
 * 优化版：基于 Unicode 范围和常见模式提高精度
 */
import { error as logError } from './logger';

export function estimateTokenCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;

  let tokens = 0;
  let i = 0;

  try {
    while (i < text.length) {
      const char = text.charCodeAt(i);
      const nextChar = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;

      // CJK 字符(中日韩统一表意文字)
      if (
        (char >= 0x4e00 && char <= 0x9fff) || // CJK Unified Ideographs
        (char >= 0x3400 && char <= 0x4dbf) || // CJK Unified Ideographs Extension A
        (char >= 0x20000 && char <= 0x2a6df) // CJK Unified Ideographs Extension B
      ) {
        tokens += 1.5;
        i++;
      }
      // Emoji 和特殊符号(通常占用更多 token)
      else if (
        (char >= 0x1f600 && char <= 0x1f64f) || // Emoticons
        (char >= 0x1f300 && char <= 0x1f5ff) || // Misc Symbols and Pictographs
        (char >= 0x1f680 && char <= 0x1f6ff) // Transport and Map
      ) {
        tokens += 2;
        i++;
      }
      // 代理对(Surrogate pairs,如某些 emoji)
      else if (char >= 0xd800 && char <= 0xdbff && nextChar >= 0xdc00 && nextChar <= 0xdfff) {
        tokens += 2;
        i += 2;
      }
      // ASCII 和控制字符
      else if (char < 128) {
        // 检查是否是代码块或 URL
        const context = text.substring(Math.max(0, i - 10), Math.min(text.length, i + 10));
        const isCodeLike = /[{}()\[\];:=]/.test(context);
        const isUrlLike = /https?:\/\//.test(context);

        if (isCodeLike || isUrlLike) {
          tokens += 0.5; // 代码/URL 中的字符消耗更多
        } else {
          tokens += 0.25; // 普通英文字符
        }
        i++;
      }
      // 其他 Unicode 字符(拉丁扩展、希腊文等)
      else {
        tokens += 0.75;
        i++;
      }
    }
  } catch (error) {
    logError('tokenUtils', 'Token 计算失败:', error);
    return Math.ceil(text.length * 0.5); // 降级方案
  }

  return Math.round(tokens);
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
 * 优化版：保护关键信息(代码块、错误、解决方案) + 滑动窗口
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

  // 如果有系统提示词，使用传入的；否则使用原有的
  const finalSystemPrompt = systemPrompt || systemMessages[0]?.content;

  // 标记关键消息(不应轻易删除)
  const isCriticalMessage = (content: string): boolean => {
    const criticalPatterns = [
      /```[\s\S]*?```/,           // 代码块
      /Error|错误|Exception/,     // 错误信息
      /解决方案|Solution|Fix/,    // 解决方案
      /总结|Summary|Conclusion/,  // 总结
      /^#{1,6}\s/m,              // Markdown 标题
    ];
    return criticalPatterns.some((pattern) => pattern.test(content));
  };

  // 从最新的消息开始向前遍历，累加 Token 数
  let currentTokens = 0;
  const resultMessages: Array<{ role: string; content: string }> = [];
  const skippedCritical: Array<{ index: number; message: { role: string; content: string }; tokens: number }> = [];

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
        // 超过限制，检查是否是关键消息
        if (isCriticalMessage(message.content)) {
          // 暂时跳过，稍后尝试保留
          skippedCritical.push({ index: i, message, tokens: messageTokens });
        }
        // 非关键消息直接停止
        break;
      }
    }

    // 尝试在预算内保留关键消息(替换最旧的非关键消息)
    if (skippedCritical.length > 0 && resultMessages.length > 2) {
      for (const critical of skippedCritical) {
        // 找到最旧的非关键消息
        const oldestNonCriticalIndex = resultMessages.findIndex(
          (msg) => !isCriticalMessage(msg.content) && msg.role !== 'system'
        );

        if (oldestNonCriticalIndex !== -1) {
          const removedMsg = resultMessages[oldestNonCriticalIndex];
          const removedTokens = estimateTokenCount(removedMsg.content);

          // 如果替换后总 token 更少或相当，则替换
          if (critical.tokens <= removedTokens + 500) {
            resultMessages.splice(oldestNonCriticalIndex, 1);
            resultMessages.unshift(critical.message);
            currentTokens = currentTokens - removedTokens + critical.tokens;
          }
        }
      }
    }

    // 滑动窗口：如果设置了保留轮数，确保至少保留最近 N 轮
    if (recentRounds > 0 && resultMessages.length > 0) {
      // 计算需要保留的消息数 (每轮 = user + assistant)
      const minMessages = Math.min(recentRounds * 2, otherMessages.length);
      
      if (resultMessages.length < minMessages) {
        // 从原始消息中补充缺失的最近消息
        const existingIds = new Set(resultMessages.map(m => m.content));
        
        for (let i = otherMessages.length - 1; i >= 0 && resultMessages.length < minMessages; i--) {
          const msg = otherMessages[i];
          if (!existingIds.has(msg.content)) {
            resultMessages.unshift(msg);
            existingIds.add(msg.content);
          }
        }
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
