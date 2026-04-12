// 国际化配置
export type Locale = 'zh-CN' | 'en-US';

export interface Translation {
  common: {
    appName: string;
    newChat: string;
    delete: string;
    send: string;
    cancel: string;
    save: string;
    clear: string;
    export: string;
    copy: string;
    search: string;
    loading: string;
    error: string;
    success: string;
  };
  chat: {
    placeholder: string;
    thinking: string;
    reply: string;
    replyTo: string;
    noMessages: string;
    exportMarkdown: string;
    exportPDF: string;
    copyLastAnswer: string;
    clearConversation: string;
    explainCode: string;
    optimizeCode: string;
    debugHelp: string;
    saveCodeSnippet: string;
  };
  conversation: {
    history: string;
    title: string;
    model: string;
    messages: string;
    tokens: string;
    createdAt: string;
    updatedAt: string;
  };
  settings: {
    title: string;
    apiKey: string;
    systemPrompt: string;
    temperature: string;
    maxTokens: string;
    advancedSettings: string;
  };
}

export const translations: Record<Locale, Translation> = {
  'zh-CN': {
    common: {
      appName: 'iFlow Desktop',
      newChat: '新建对话',
      delete: '删除',
      send: '发送',
      cancel: '取消',
      save: '保存',
      clear: '清除',
      export: '导出',
      copy: '复制',
      search: '搜索',
      loading: '加载中...',
      error: '错误',
      success: '成功',
    },
    chat: {
      placeholder: '输入消息与 iFlow AI 交流...',
      thinking: '思考中...',
      reply: '回复',
      replyTo: '回复',
      noMessages: '暂无消息',
      exportMarkdown: '导出为Markdown',
      exportPDF: '导出为PDF',
      copyLastAnswer: '复制最后回答',
      clearConversation: '清空对话',
      explainCode: '解释代码',
      optimizeCode: '优化代码',
      debugHelp: '调试帮助',
      saveCodeSnippet: '收藏代码片段',
    },
    conversation: {
      history: '对话历史',
      title: '标题',
      model: '模型',
      messages: '消息',
      tokens: 'Token',
      createdAt: '创建时间',
      updatedAt: '更新时间',
    },
    settings: {
      title: '设置',
      apiKey: 'API Key',
      systemPrompt: '系统提示词',
      temperature: '温度',
      maxTokens: '最大 Token',
      advancedSettings: '高级设置',
    },
  },
  'en-US': {
    common: {
      appName: 'iFlow Desktop',
      newChat: 'New Chat',
      delete: 'Delete',
      send: 'Send',
      cancel: 'Cancel',
      save: 'Save',
      clear: 'Clear',
      export: 'Export',
      copy: 'Copy',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    chat: {
      placeholder: 'Type a message to chat with iFlow AI...',
      thinking: 'Thinking...',
      reply: 'Reply',
      replyTo: 'Reply to',
      noMessages: 'No messages',
      exportMarkdown: 'Export as Markdown',
      exportPDF: 'Export as PDF',
      copyLastAnswer: 'Copy Last Answer',
      clearConversation: 'Clear Conversation',
      explainCode: 'Explain Code',
      optimizeCode: 'Optimize Code',
      debugHelp: 'Debug Help',
      saveCodeSnippet: 'Save Code Snippet',
    },
    conversation: {
      history: 'Chat History',
      title: 'Title',
      model: 'Model',
      messages: 'Messages',
      tokens: 'Tokens',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
    },
    settings: {
      title: 'Settings',
      apiKey: 'API Key',
      systemPrompt: 'System Prompt',
      temperature: 'Temperature',
      maxTokens: 'Max Tokens',
      advancedSettings: 'Advanced Settings',
    },
  },
};

// 当前语言
let currentLocale: Locale = 'zh-CN';

export function setLocale(locale: Locale) {
  currentLocale = locale;
  localStorage.setItem('app_locale', locale);
}

export function getLocale(): Locale {
  const saved = localStorage.getItem('app_locale') as Locale;
  if (saved && (saved === 'zh-CN' || saved === 'en-US')) {
    return saved;
  }
  return 'zh-CN';
}

export function t(
  key:
    | keyof Translation['common']
    | keyof Translation['chat']
    | keyof Translation['conversation']
    | keyof Translation['settings'],
): string {
  const keys = key.split('.');
  let value: unknown = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}
