/**
 * 统一的日志工具
 * 支持通过环境变量控制日志输出
 * 生产环境自动禁用 DEBUG/INFO 日志
 */

// 判断是否为开发环境
const isDev = import.meta.env.DEV;

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4, // 完全禁用
}

/**
 * 当前日志级别
 * - 开发环境: DEBUG (显示所有)
 * - 生产环境: ERROR (仅错误)
 */
const currentLevel = isDev ? LogLevel.DEBUG : LogLevel.ERROR;

// 日志节流：防止重复日志刷屏
const logThrottle = new Map<string, number>();
const THROTTLE_MS = 1000; // 1秒内相同日志只显示一次

/**
 * 格式化日志消息
 */
function formatMessage(module: string, message: string): string {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  return `[${timestamp}] [${module}] ${message}`;
}

/**
 * 检查是否应该节流
 */
function shouldThrottle(key: string): boolean {
  const now = Date.now();
  const lastTime = logThrottle.get(key);
  
  if (lastTime && now - lastTime < THROTTLE_MS) {
    return true;
  }
  
  logThrottle.set(key, now);
  
  // 清理旧记录（保留最近 100 条）
  if (logThrottle.size > 100) {
    const oldestKey = logThrottle.keys().next().value;
    if (oldestKey) logThrottle.delete(oldestKey);
  }
  
  return false;
}

/**
 * 调试日志（仅开发环境，带节流）
 */
export function debug(module: string, ...args: any[]): void {
  if (currentLevel <= LogLevel.DEBUG) {
    const key = `debug:${module}:${args[0]}`;
    if (!shouldThrottle(key)) {
      console.debug(formatMessage(module, args[0]), ...args.slice(1));
    }
  }
}

/**
 * 信息日志（仅开发环境，带节流）
 */
export function info(module: string, ...args: any[]): void {
  if (currentLevel <= LogLevel.INFO) {
    const key = `info:${module}:${args[0]}`;
    if (!shouldThrottle(key)) {
      console.log(formatMessage(module, args[0]), ...args.slice(1));
    }
  }
}

/**
 * 警告日志（带节流）
 */
export function warn(module: string, ...args: any[]): void {
  if (currentLevel <= LogLevel.WARN) {
    console.warn(formatMessage(module, args[0]), ...args.slice(1));
  }
}

/**
 * 错误日志（始终显示，无节流）
 */
export function error(module: string, ...args: any[]): void {
  if (currentLevel <= LogLevel.ERROR) {
    console.error(formatMessage(module, args[0]), ...args.slice(1));
  }
}

/**
 * 清空日志节流缓存
 */
export function clearLogThrottle(): void {
  logThrottle.clear();
}
