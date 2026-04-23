/**
 * 格式化工具函数
 */

/**
 * 格式化时间戳为相对时间
 * @param timestamp 时间戳(毫秒)
 * @returns 相对时间字符串 (如: "2小时前")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return new Date(timestamp).toLocaleDateString('zh-CN');
}

/**
 * 格式化日期时间
 * @param timestamp 时间戳(毫秒)
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
