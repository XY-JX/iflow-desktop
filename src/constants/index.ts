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

/**
 * 默认角色列表
 */
export const DEFAULT_ROLES = [
  { icon: '🤖', label: '通用助手', value: '你是一个有用的 AI 编程助手。' },
  { icon: '💻', label: '代码专家', value: '你是一个资深的软件工程师，请帮我分析和编写代码。' },
  { icon: '📝', label: '文案写作', value: '你是一个专业的文案写手，请帮我撰写和优化文本内容。' },
  { icon: '🔍', label: '数据分析', value: '你是一个数据分析专家，请帮我分析数据并提供洞察。' },
] as const;

/**
 * 默认模型列表
 */
export const DEFAULT_MODEL_LIST = [
  'glm-4.6v',
  'glm-4.5-air',
  'glm-4.5',
  'glm-4',
  'glm-4-flash',
] as const;

/**
 * Token 预留量（用于系统消息等开销）
 */
export const RESERVED_TOKENS = 500;

/**
 * Token 估算权重
 */
export const TOKEN_WEIGHTS = {
  CJK: 1.5,
  CODE: 0.5,
  ASCII: 0.25,
} as const;

/**
 * QR 码生成 API 基础 URL
 */
export const QR_CODE_BASE_URL = 'https://chart.googleapis.com/chart';
