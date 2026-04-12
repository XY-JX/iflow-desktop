/**
 * 统一的日志工具
 * 支持通过环境变量控制日志输出
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
}

/**
 * 当前日志级别（生产环境只显示 ERROR）
 */
const currentLevel = isDev ? LogLevel.DEBUG : LogLevel.ERROR;

/**
 * 格式化日志消息
 */
function formatMessage(module: string, message: string): string {
  return `[${module}] ${message}`;
}

/**
 * 调试日志（仅开发环境）
 */
export function debug(module: string, ...args: any[]): void {
  if (currentLevel <= LogLevel.DEBUG) {
    console.debug(formatMessage(module, args[0]), ...args.slice(1));
  }
}

/**
 * 信息日志（仅开发环境）
 */
export function info(module: string, ...args: any[]): void {
  if (currentLevel <= LogLevel.INFO) {
    console.log(formatMessage(module, args[0]), ...args.slice(1));
  }
}

/**
 * 警告日志
 */
export function warn(module: string, ...args: any[]): void {
  if (currentLevel <= LogLevel.WARN) {
    console.warn(formatMessage(module, args[0]), ...args.slice(1));
  }
}

/**
 * 错误日志（始终显示）
 */
export function error(module: string, ...args: any[]): void {
  if (currentLevel <= LogLevel.ERROR) {
    console.error(formatMessage(module, args[0]), ...args.slice(1));
  }
}
