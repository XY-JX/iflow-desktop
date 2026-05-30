/**
 * 错误处理工具
 */

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface AppErrorInfo {
  message: string;
  code?: string;
  context?: string;
  timestamp: number;
  stack?: string;
  retryable?: boolean;
}

export class ErrorHandler {
  private static errorLog: AppErrorInfo[] = [];
  private static maxLogSize = 50;

  static handle(error: unknown, context: string = 'Unknown', retryable: boolean = false): AppErrorInfo {
    const appError: AppErrorInfo = {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof AppError ? error.code : undefined,
      context,
      timestamp: Date.now(),
      stack: error instanceof Error ? error.stack : undefined,
      retryable,
    };

    this.logError(appError);

    if (import.meta.env.DEV) {
      console.error(`[${context}]`, error);
    }

    return appError;
  }

  private static logError(error: AppErrorInfo): void {
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  static getErrorLog(): AppErrorInfo[] {
    return this.errorLog;
  }

  static clearErrorLog(): void {
    this.errorLog = [];
  }

  static showUserMessage(error: AppErrorInfo): string {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return '网络连接失败，请检查网络后重试';
    }
    if (error.message.includes('timeout')) {
      return '请求超时，请稍后重试';
    }
    return `操作失败：${error.message}`;
  }
}
