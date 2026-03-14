// 对话消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: string; // 思考过程
  executionInfo?: ExecutionInfo; // 执行信息
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

// 文件项目类型
export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modifiedTime?: number;
}