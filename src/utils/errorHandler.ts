/**
 * 错误处理工具
 * 优化版：添加重试机制和更完善的错误分类
 */

export interface AppError {
  message: string;
  code?: string;
  context?: string;
  timestamp: number;
  stack?: string;
  retryable?: boolean; // 是否可重试
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 50; // 减少日志量

  /**
   * 处理错误
   */
  static handle(error: unknown, context: string = 'Unknown', retryable: boolean = false): AppError {
    const appError: AppError = {
      message: error instanceof Error ? error.message : String(error),
      context,
      timestamp: Date.now(),
      stack: error instanceof Error ? error.stack : undefined,
      retryable,
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

    if (error.message.includes('token') || error.message.includes('Token')) {
      return 'Token 计算异常，已使用默认值';
    }

    return `操作失败：${error.message}`;
  }

  /**
   * 安全执行异步函数（带重试）
   */
  static async safeExecute<T>(
    fn: () => Promise<T>,
    context: string = 'Async Operation',
    retries: number = 1,
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const data = await fn();
        return { success: true, data };
      } catch (error) {
        lastError = error;
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 指数退避
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    const appError = this.handle(lastError, context, retries > 0);
    return { success: false, error: appError };
  }

  /**
   * 全局错误恢复建议
   */
  static getRecoverySuggestion(error: AppError): string {
    if (error.retryable) {
      return '建议：您可以稍后重试此操作';
    }

    if (error.context && (error.context.includes('API') || error.context.includes('Network'))) {
      return '建议：检查网络连接或 API 配置';
    }

    if (error.context && error.context.includes('Storage')) {
      return '建议：清理浏览器缓存后重试';
    }

    return '建议：刷新页面或重启应用';
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
