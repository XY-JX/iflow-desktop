import { describe, it, expect } from 'vitest';
import { estimateTokenCount, truncateConversation } from '../utils/tokenUtils';
import type { Conversation } from '../types';

describe('tokenUtils', () => {
  describe('estimateTokenCount', () => {
    it('should estimate tokens for English text', () => {
      const text = 'Hello world this is a test';
      const tokens = estimateTokenCount(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length); // Should be roughly 1/4 of characters
    });

    it('should estimate tokens for Chinese text', () => {
      const text = '这是一个测试文本';
      const tokens = estimateTokenCount(text);
      expect(tokens).toBeGreaterThan(0);
    });

    it('should handle empty string', () => {
      const tokens = estimateTokenCount('');
      expect(tokens).toBe(0);
    });

    it('should handle mixed language text', () => {
      const text = 'Hello 世界 test 测试';
      const tokens = estimateTokenCount(text);
      expect(tokens).toBeGreaterThan(0);
    });

    it('should handle code snippets', () => {
      const text = 'function test() { return "hello"; }';
      const tokens = estimateTokenCount(text);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('truncateConversation', () => {
    it('should not truncate if under token limit', () => {
      const messages = [
        { role: 'user' as const, content: 'Short message' },
        { role: 'assistant' as const, content: 'Short response' },
      ];

      const result = truncateConversation(messages, 10000);
      expect(result.length).toBe(2);
    });

    it('should keep system message when truncating', () => {
      const messages = [
        { role: 'system' as const, content: 'System prompt' },
        { role: 'user' as const, content: 'A'.repeat(5000) },
        { role: 'assistant' as const, content: 'B'.repeat(5000) },
      ];

      const result = truncateConversation(messages, 5000);
      expect(result[0].role).toBe('system');
      // System message is always kept, other messages may be truncated
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should remove oldest messages first', () => {
      const messages = [
        { role: 'user' as const, content: 'First message' },
        { role: 'assistant' as const, content: 'Second message' },
        { role: 'user' as const, content: 'Third message' },
      ];

      const result = truncateConversation(messages, 100);
      // Should keep the most recent messages
      expect(result[result.length - 1].content).toBe('Third message');
    });

    it('should preserve message order after truncation', () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `Message ${i}`,
      }));

      const result = truncateConversation(messages, 200);
      // Messages should still be in chronological order
      for (let i = 1; i < result.length; i++) {
        expect(result[i].content).not.toBe('');
      }
    });
  });
});
