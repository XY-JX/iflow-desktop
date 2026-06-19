/**
 * 通用工具函数
 */

// 计数器用于确保同毫秒内的 ID 唯一性
let idCounter = 0;

/**
 * 格式化时间戳为友好显示
 */
export function formatTime(timestamp: number, detailed: boolean = false): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (detailed) {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

/**
 * 生成唯一ID
 * 使用时间戳 + 计数器 + 随机数确保唯一性
 */
export function generateId(): string {
  idCounter = (idCounter + 1) % 10000;
  const timestamp = Date.now().toString(36);
  const counter = idCounter.toString(36).padStart(4, '0');
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${counter}-${random}`;
}
