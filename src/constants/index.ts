/**
 * 应用常量定义
 */

/**
 * 应用配置常量
 */
export const APP_CONSTANTS = {
  // Token限制
  MAX_TOKENS: 8192,
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2048,
  
  // TOTP配置
  TOTP_PERIOD: 30,
  TOTP_DIGITS: 6,
  
  // 日志配置
  LOG_RETENTION_DAYS: 3,
  MAX_ERROR_LOG_SIZE: 50,
  
  // UI配置
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
} as const;

/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
  CODE_SNIPPETS: 'code_snippets',
  QUICK_LINKS: 'quick_links',
  QUICK_NOTES: 'quick_notes',
  THEME: 'theme_preference',
} as const;

/**
 * 默认值常量
 */
export const DEFAULTS = {
  MODEL: 'glm-4',
  SYSTEM_PROMPT: '你是一个有用的 AI 编程助手。',
  CONVERSATION_TITLE: '新对话',
} as const;
