// 对话消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: string; // 思考过程
  executionInfo?: ExecutionInfo; // 执行信息
  replyTo?: string; // 引用的消息 ID
}

// 执行信息类型
export interface ExecutionInfo {
  session_id: string;
  conversation_id: string;
  assistant_rounds: number;
  execution_time_ms: number;
  token_usage: {
    input: number;
    output: number;
    total: number;
  };
}

// 对话会话类型
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  tags?: string[]; // 标签列表
  createdAt: number;
  updatedAt: number;
}

// 模型类型
export interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

// 智谱 AI 模型信息
export interface ZhipuModelInfo {
  id: string;
  name?: string;
  description?: string;
}

// 文件项目类型
export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedTime?: number;
}

// 应用配置类型
export interface AppConfig {
  custom_roles: CustomRole[];
  api_key?: string;
  current_model?: string;
  temperature?: number;
  max_tokens?: number;
  cached_models?: ZhipuModelInfo[]; // 缓存的模型列表
  
  // 上下文压缩配置
  contextConfig?: ContextConfig;
  
  [key: string]: any;
}

// 上下文压缩配置
export interface ContextConfig {
  maxTokens: number;              // 最大 Token 限制
  compressionLevel: 'none' | 'light' | 'aggressive'; // 压缩级别
  keepCodeBlocks: boolean;        // 是否保留代码块
  keepErrors: boolean;            // 是否保留错误信息
  recentRounds: number;           // 保留最近完整对话轮数
}

// 自定义角色类型
export interface CustomRole {
  icon: string;
  label: string;
  value: string;
}

// API 调用参数类型
export interface ApiCommandArgs {
  apiKey?: string;
  config?: AppConfig;
  role?: CustomRole;
  index?: number;
  [key: string]: any;
}

// 代码片段类型
export interface CodeSnippet {
  name: string;
  code: string;
}

// 快速链接类型
export interface QuickLink {
  name: string;
  url: string;
  icon: string;
}

// 快捷笔记类型
export interface QuickNote {
  content: string;
  timestamp: number;
}
