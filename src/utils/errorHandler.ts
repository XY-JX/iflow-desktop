/**
 * 错误处理工具
 */

export interface AppError {
  message: string;
  code?: string;
  context?: string;
  timestamp: number;
  stack?: string;
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 100;

  /**
   * 处理错误
   */
  static handle(error: unknown, context: string = 'Unknown'): AppError {
    const appError: AppError = {
      message: error instanceof Error ? error.message : String(error),
      context,
      timestamp: Date.now(),
      stack: error instanceof Error ? error.stack : undefined,
    };

    // 记录错误日志
    this.logError(appError);

    // 开发环境输出详细错误
    if (import.meta.env.DEV) {
      console.error(`[${context}]`, error);
    }

    return appError;
  }

  /**
   * 记录错误
   */
  private static logError(error: AppError): void {
    this.errorLog.unshift(error);

    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // 保存到 localStorage（可选）
    try {
      localStorage.setItem('app_error_log', JSON.stringify(this.errorLog.slice(0, 10)));
    } catch (e) {
      // 忽略存储失败
    }
  }

  /**
   * 获取错误日志
   */
  static getErrorLog(): AppError[] {
    return this.errorLog;
  }

  /**
   * 清除错误日志
   */
  static clearErrorLog(): void {
    this.errorLog = [];
    localStorage.removeItem('app_error_log');
  }

  /**
   * 显示用户友好的错误提示
   */
  static showUserMessage(error: AppError): string {
    // 根据错误类型返回友好提示
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return '网络连接失败，请检查网络后重试';
    }

    if (error.message.includes('timeout')) {
      return '请求超时，请稍后重试';
    }

    if (error.message.includes('permission') || error.message.includes('auth')) {
      return '权限不足，请检查配置';
    }

    return `操作失败：${error.message}`;
  }

  /**
   * 安全执行异步函数
   */
  static async safeExecute<T>(
    fn: () => Promise<T>,
    context: string = 'Async Operation'
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const appError = this.handle(error, context);
      return { success: false, error: appError };
    }
  }
}

/**
 * 全局未捕获错误处理
 */
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    ErrorHandler.handle(event.error, 'Global Error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handle(event.reason, 'Unhandled Promise Rejection');
  });
}
