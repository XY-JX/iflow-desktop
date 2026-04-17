/**
 * 验证工具函数
 */

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证URL格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证API Key格式(智谱)
 */
export function isValidZhipuApiKey(key: string): boolean {
  // 智谱API Key通常以特定格式开头
  return key.length >= 32 && /^[a-zA-Z0-9._-]+$/.test(key);
}

/**
 * 验证TOTP密钥格式(Base32)
 */
export function isValidBase32(secret: string): boolean {
  // Base32字符集: A-Z, 2-7, 可能包含=填充
  return /^[A-Z2-7]+=*$/.test(secret.toUpperCase());
}

/**
 * 验证非空字符串
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 验证正整数
 */
export function isPositiveInteger(value: any): value is number {
  return Number.isInteger(value) && value > 0;
}
