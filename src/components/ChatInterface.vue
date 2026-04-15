<template>
  <div class="chat-interface">
    <div class="chat-header">
      <div class="header-left">
        <ModelSelector
          :models="availableModels"
          :selected-model="currentModel"
          @model-change="handleModelChange"
        />
        

      </div>
    </div>

    <div class="messages-container" ref="messagesContainer">
      <!-- 消息列表 -->
      <div v-for="message in messages" :key="message.id" class="message-wrapper">
        <!-- 消息内容 -->
        <div class="message" :class="message.role">
          <div class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <!-- 引用显示 -->
            <div v-if="message.replyTo" class="reply-reference">
              <span class="reply-icon">↩️</span>
              <span class="reply-text">回复：{{ getRepliedMessagePreview(message.replyTo) }}</span>
            </div>

            <div class="message-text" v-html="renderMarkdown(message.content)"></div>
            <div class="message-time">
              {{ formatTime(message.timestamp) }}
              <button @click="replyToMessageFunc(message)" class="btn-reply" title="回复此消息">
                ↩️ 回复
              </button>
            </div>

            <!-- 执行信息 -->
            <div v-if="message.executionInfo" class="execution-info">
              <div class="info-item">
                <span class="info-icon">⏱️</span>
                <span class="info-text"
                  >耗时：{{ (message.executionInfo.execution_time_ms / 1000).toFixed(2) }}s</span
                >
              </div>
              <div class="info-item">
                <span class="info-icon">📊</span>
                <span class="info-text"
                  >Token：输入 {{ formatNumber(message.executionInfo.token_usage.input) }} / 输出
                  {{ formatNumber(message.executionInfo.token_usage.output) }}</span
                >
              </div>
              <div class="info-item">
                <span class="info-icon">🔄</span>
                <span class="info-text">轮次：{{ message.executionInfo.assistant_rounds }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 聊天快捷操作栏 -->
    <div class="chat-actions-bar">
      <button @click="$emit('clear-conversation')" class="action-btn" title="清空对话">🗑️</button>
      <button @click="$emit('export-conversation')" class="action-btn" title="导出为Markdown">
        📥
      </button>
      <button @click="$emit('export-pdf')" class="action-btn" title="导出为PDF">📄</button>
      <button @click="$emit('copy-last-answer')" class="action-btn" title="复制最后回答">📋</button>
      <button @click="saveLastCodeSnippet" class="action-btn" title="收藏代码片段">💾</button>
      <div class="divider"></div>
      <button @click="$emit('apply-template', 'explain')" class="action-btn" title="解释代码">
        💡
      </button>
      <button @click="$emit('apply-template', 'optimize')" class="action-btn" title="优化代码">
        ⚡
      </button>
      <button @click="$emit('apply-template', 'debug')" class="action-btn" title="调试帮助">
        🐛
      </button>
    </div>

    <div class="input-area">
      <!-- 引用提示 -->
      <div v-if="replyToMessage" class="reply-indicator">
        <span class="reply-indicator-text">
          ↩️ 回复：{{ getRepliedMessagePreview(replyToMessage.id) }}
        </span>
        <button @click="cancelReply" class="btn-cancel-reply">×</button>
      </div>

      <div class="input-wrapper">
        <textarea
          v-model="inputText"
          @keydown="handleKeyDown"
          placeholder="输入消息与 iFlow AI 交流..."
          rows="1"
          ref="inputRef"
        ></textarea>
        <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim() || isGenerating">
          <span class="icon">📤</span>
          <span class="text">发送</span>
        </button>
      </div>
      
      <!-- 响应状态提示 -->
      <div v-if="isGenerating" class="response-status">
        <span class="status-dot"></span>
        <span class="status-text">AI 正在思考并回复中...</span>
      </div>
      
      <div class="input-hint">按 Enter 发送，Shift + Enter 换行</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, nextTick, watch, onMounted } from 'vue';
  import ModelSelector from './ModelSelector.vue';
  import MarkdownIt from 'markdown-it';
  import type { Message, Model } from '../types';

  // 初始化 Markdown 解析器
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  });

  const props = defineProps<{
    messages: Message[];
    isGenerating: boolean;
    availableModels: Model[];
    currentModel: string;
  }>();

  const emit = defineEmits<{
    'send-message': [content: string];
    'model-change': [modelId: string];
    'clear-conversation': [];
    'export-conversation': [];
    'export-pdf': [];
    'copy-last-answer': [];
    'apply-template': [type: string];
    'save-code-snippet': [code: string, language: string];
  }>();

  const inputText = ref('');
  const inputRef = ref<HTMLTextAreaElement>();
  const messagesContainer = ref<HTMLDivElement>();
  const replyToMessage = ref<Message | null>(null); // 当前引用的消息

  async function sendMessage() {
    const content = inputText.value.trim();
    if (!content || props.isGenerating) return;

    // 如果有引用，在内容前添加引用标记
    let finalContent = content;
    if (replyToMessage.value) {
      finalContent = `> 回复 @${replyToMessage.value.role === 'user' ? '用户' : '助手'}: ${getRepliedMessagePreview(replyToMessage.value.id)}\n\n${content}`;
      cancelReply();
    }

    // 普通模式发送消息
    emit('send-message', finalContent);

    // 清空输入框并触发视图更新
    inputText.value = '';

    // 确保DOM更新后再调整高度
    await nextTick();
    if (inputRef.value) {
      inputRef.value.style.height = 'auto';
    }

    // 滚动到底部
    await scrollToBottom();
  }



  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function handleModelChange(modelId: string) {
    emit('model-change', modelId);
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatNumber(num: number): string {
    return num.toLocaleString('zh-CN');
  }

  // 渲染 Markdown
  function renderMarkdown(content: string): string {
    if (!content) return '';
    return md.render(content);
  }

  function scrollToBottom() {
    if (!messagesContainer.value) return;
    
    // 立即滚动，不等待下一帧
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }

  // 监听消息变化，自动滚动到底部
  watch(
    () => props.messages,
    (newMessages, oldMessages) => {
      // 生成中时，始终滚动到底部
      if (props.isGenerating) {
        scrollToBottom();
        return;
      }
      
      // 非生成状态：只有当消息数量增加时才滚动
      if (!oldMessages || newMessages.length > oldMessages.length) {
        scrollToBottom();
      }
    },
    { deep: true },
  );

  // 监听生成状态变化
  watch(
    () => props.isGenerating,
    () => {
      scrollToBottom();
    },
  );

  // 自动调整输入框高度
  watch(inputText, async () => {
    if (inputRef.value) {
      // 先重置高度以获取正确的scrollHeight
      inputRef.value.style.height = 'auto';
      await nextTick();

      // 计算新高度，限制最大高度
      const newHeight = Math.min(inputRef.value.scrollHeight, 150);
      inputRef.value.style.height = newHeight + 'px';
    }
  });

  // 初始化时滚动到底部
  onMounted(() => {
    scrollToBottom();
  });

  // 从消息内容中提取代码块
  function extractCodeBlocks(content: string): Array<{ code: string; language: string }> {
    const codeBlocks: Array<{ code: string; language: string }> = [];
    const regex = /```(\w+)?\s*\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
      });
    }

    return codeBlocks;
  }

  // 收藏最后一条消息中的代码
  function saveLastCodeSnippet() {
    const assistantMessages = props.messages.filter((m) => m.role === 'assistant');
    if (assistantMessages.length === 0) {
      alert('没有找到助手的消息');
      return;
    }

    const lastMessage = assistantMessages[assistantMessages.length - 1];
    const codeBlocks = extractCodeBlocks(lastMessage.content);

    if (codeBlocks.length === 0) {
      alert('该消息中没有找到代码块');
      return;
    }

    // 收藏第一个代码块
    const firstBlock = codeBlocks[0];
    emit('save-code-snippet', firstBlock.code, firstBlock.language);
  }

  // 引用消息
  function replyToMessageFunc(message: Message) {
    replyToMessage.value = message;
    // 聚焦到输入框
    if (inputRef.value) {
      inputRef.value.focus();
    }
  }

  // 取消引用
  function cancelReply() {
    replyToMessage.value = null;
  }

  // 获取被引用消息的预览
  function getRepliedMessagePreview(messageId: string): string {
    const message = props.messages.find((m) => m.id === messageId);
    if (!message) return '未知消息';

    const preview = message.content.substring(0, 50);
    return preview + (message.content.length > 50 ? '...' : '');
  }
</script>

<style scoped>
  .chat-interface {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--bg-primary, white);
  }

  .chat-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    background: var(--bg-secondary, #f8f9fa);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  toggle-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--bg-primary, white);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    color: var(--text-secondary, #666);
  }

  toggle-btn:hover {
    border-color: var(--primary-color, #4a90e2);
    color: var(--primary-color, #4a90e2);
  }

  toggle-btn.active {
    background: var(--primary-color, #4a90e2);
    border-color: var(--primary-color, #4a90e2);
    color: white;
  }

  toggle-btn .icon {
    font-size: 16px;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 0;
  }

  .message-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 思考过程样式 */
  .thinking-process {
    background: var(--thinking-bg, #fff7e6);
    border: 1px solid var(--thinking-border, #ffd591);
    border-radius: 8px;
    overflow: hidden;
  }

  .thinking-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--thinking-header-bg, #fffbe6);
  }

  .thinking-icon {
    font-size: 16px;
  }

  .thinking-title {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--thinking-text, #d46b08);
    font-style: italic;
  }

  .thinking-content {
    padding: 12px;
    border-top: 1px solid var(--thinking-border, #ffd591);
  }

  .thinking-text {
    font-size: 13px;
    line-height: 1.6;
    color: var(--thinking-text, #d46b08);
    white-space: pre-wrap;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  /* 消息样式 */
  .message {
    display: flex;
    gap: 12px;
  }

  .message.user {
    flex-direction: row-reverse;
  }

  .message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .message.user .message-avatar {
    background: var(--primary-color, #4a90e2);
  }

  .message.assistant .message-avatar {
    background: var(--secondary-color, #6c5ce7);
  }

  .message-content {
    max-width: 70%;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .message.user .message-content {
    align-items: flex-end;
  }

  .message-text {
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.6;
    word-wrap: break-word;
  }

  /* Markdown 样式 */
  .message-text :deep(p) {
    margin: 8px 0;
  }

  .message-text :deep(p:first-child) {
    margin-top: 0;
  }

  .message-text :deep(p:last-child) {
    margin-bottom: 0;
  }

  .message-text :deep(h1),
  .message-text :deep(h2),
  .message-text :deep(h3),
  .message-text :deep(h4),
  .message-text :deep(h5),
  .message-text :deep(h6) {
    margin: 16px 0 8px;
    font-weight: 600;
    line-height: 1.4;
  }

  .message-text :deep(h1) {
    font-size: 1.5em;
  }
  .message-text :deep(h2) {
    font-size: 1.3em;
  }
  .message-text :deep(h3) {
    font-size: 1.1em;
  }

  .message-text :deep(ul),
  .message-text :deep(ol) {
    margin: 8px 0;
    padding-left: 24px;
  }

  .message-text :deep(li) {
    margin: 4px 0;
  }

  .message-text :deep(blockquote) {
    margin: 12px 0;
    padding: 8px 12px;
    border-left: 4px solid var(--primary-color, #4a90e2);
    background: var(--bg-secondary, #f5f5f5);
    border-radius: 4px;
    color: var(--text-secondary, #666);
  }

  .message-text :deep(hr) {
    margin: 16px 0;
    border: none;
    border-top: 1px solid var(--border-color, #e0e0e0);
  }

  .message-text :deep(a) {
    color: var(--primary-color, #4a90e2);
    text-decoration: underline;
  }

  .message-text :deep(a:hover) {
    text-decoration: none;
  }

  .message-text :deep(img) {
    max-width: 100%;
    border-radius: 8px;
    margin: 8px 0;
  }

  /* 代码块样式 */
  .message-text :deep(pre) {
    background: var(--code-bg, #1e1e1e);
    color: var(--code-text, #d4d4d4);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  .message-text :deep(code) {
    background: var(--inline-code-bg, #f0f0f0);
    color: var(--inline-code-text, #e83e8c);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
  }

  .message-text :deep(pre code) {
    background: transparent;
    color: inherit;
    padding: 0;
  }

  .message.user .message-text :deep(code) {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .message.user .message-text {
    background: var(--primary-color, #4a90e2);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message.assistant .message-text {
    background: var(--bg-secondary, #f0f0f0);
    color: var(--text-primary, #333);
    border-bottom-left-radius: 4px;
  }

  .message-text.typing {
    color: var(--text-secondary, #999);
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .typing-dot {
    width: 6px;
    height: 6px;
    background: var(--text-secondary, #999);
    border-radius: 50%;
    animation: typing 1.4s infinite;
  }

  .typing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing {
    0%,
    60%,
    100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-4px);
    }
  }

  .message-time {
    font-size: 12px;
    color: var(--text-secondary, #999);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .message.user .message-time {
    text-align: right;
    flex-direction: row-reverse;
  }

  /* 引用显示 */
  .reply-reference {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    margin-bottom: 8px;
    background: var(--bg-hover, #f5f5f5);
    border-left: 3px solid var(--primary-color, #4a90e2);
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-secondary, #666);
  }

  .reply-icon {
    font-size: 14px;
  }

  .reply-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 回复按钮 */
  .btn-reply {
    padding: 2px 8px;
    background: transparent;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-secondary, #666);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .btn-reply:hover {
    background: var(--primary-light, #e8f4ff);
    border-color: var(--primary-color, #4a90e2);
    color: var(--primary-color, #4a90e2);
  }

  /* 执行信息样式 */
  .execution-info {
    margin-top: 8px;
    padding: 8px 12px;
    background: var(--info-bg, #f0f9ff);
    border: 1px solid var(--info-border, #bae7ff);
    border-radius: 6px;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--info-text, #096dd9);
  }

  .info-icon {
    font-size: 14px;
  }

  .info-text {
    flex: 1;
  }

  /* 聊天快捷操作栏 */
  .chat-actions-bar {
    display: flex;
    gap: 6px;
    padding: 8px 16px;
    background: var(--bg-secondary, #f8f9fa);
    border-top: 1px solid var(--border-color, #e0e0e0);
  }

  .action-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    background: white;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover {
    background: #f0f5ff;
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  }

  .divider {
    width: 1px;
    background: var(--border-color, #e0e0e0);
    margin: 4px 4px;
  }

  /* 输入区域样式 */
  .input-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid var(--border-color, #e0e0e0);
    background: var(--bg-secondary, #f8f9fa);
  }

  /* 引用提示 */
  .reply-indicator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--primary-light, #e8f4ff);
    border-left: 3px solid var(--primary-color, #4a90e2);
    border-radius: 6px;
    font-size: 13px;
  }

  .reply-indicator-text {
    flex: 1;
    color: var(--text-primary, #333);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .btn-cancel-reply {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--text-secondary, #666);
    font-size: 18px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-left: 8px;
  }

  .btn-cancel-reply:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--text-primary, #333);
  }

  .input-wrapper {
    display: flex;
    gap: 12px;
  }

  .input-area textarea {
    flex: 1;
    padding: 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    max-height: 150px;
    background: var(--bg-primary, white);
    color: var(--text-primary, #333);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .input-area textarea:focus {
    outline: none;
    border-color: var(--primary-color, #4a90e2);
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }

  .send-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;
    background: var(--primary-color, #4a90e2);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--primary-hover, #357abd);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
  }

  .send-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-btn .icon {
    font-size: 16px;
  }

  .input-hint {
    font-size: 12px;
    color: var(--text-secondary, #999);
    text-align: center;
  }

  /* 响应状态提示 */
  .response-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 13px;
    color: var(--primary-color, #4a90e2);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color, #4a90e2);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }

  @media (prefers-color-scheme: dark) {
    .chat-interface {
      background: var(--bg-primary, #1a1a1a);
    }

    .chat-header {
      background: var(--bg-secondary, #2d2d2d);
      border-bottom-color: var(--border-color, #404040);
    }

    .toggle-btn {
      background: var(--bg-secondary, #2d2d2d);
      border-color: var(--border-color, #404040);
      color: var(--text-secondary, #999);
    }

    .toggle-btn:hover {
      border-color: var(--primary-color, #4a90e2);
      color: var(--primary-color, #4a90e2);
    }

    .thinking-process {
      background: var(--thinking-bg-dark, #2a2620);
      border-color: var(--thinking-border-dark, #4a4539);
    }

    .thinking-header {
      background: var(--thinking-header-bg-dark, #2a2a20);
    }

    .thinking-header:hover {
      background: var(--thinking-hover-bg-dark, #3a3a30);
    }

    .thinking-title,
    .collapse-icon {
      color: var(--thinking-text-dark, #d4b896);
    }

    .thinking-text {
      color: var(--thinking-text-dark, #d4b896);
    }

    .message.assistant .message-text {
      background: var(--bg-secondary, #2d2d2d);
      color: var(--text-primary, #f0f0f0);
    }

    .message-text :deep(code) {
      background: var(--inline-code-bg-dark, #2d2d2d);
      color: var(--inline-code-text-dark, #f472b6);
    }

    .message.user .message-text :deep(code) {
      background: rgba(255, 255, 255, 0.15);
    }

    .execution-info {
      background: var(--info-bg-dark, #1a2630);
      border-color: var(--info-border-dark, #2a4050);
    }

    .info-item {
      color: var(--info-text-dark, #5aa9ff);
    }

    .input-area {
      background: var(--bg-secondary, #2d2d2d);
      border-top-color: var(--border-color, #404040);
    }

    .input-area textarea {
      background: var(--bg-primary, #1a1a1a);
      color: var(--text-primary, #f0f0f0);
      border-color: var(--border-color, #404040);
    }

    .input-area textarea:focus {
      border-color: var(--primary-color, #4a90e2);
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
    }

    .input-hint {
      color: var(--text-secondary, #777);
    }

    /* 深色主题 - 引用 */
    .reply-indicator {
      background: var(--primary-dark, #1a4d7a);
    }

    .reply-indicator-text {
      color: var(--text-primary, #f0f0f0);
    }

    .btn-cancel-reply:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .reply-reference {
      background: var(--bg-hover, #3d3d3d);
    }

    .btn-reply {
      border-color: var(--border-color, #404040);
      color: var(--text-secondary, #aaa);
    }

    .btn-reply:hover {
      background: var(--primary-dark, #1a4d7a);
      border-color: var(--primary-color, #4a90e2);
      color: #7cb3ff;
    }
  }
</style>
