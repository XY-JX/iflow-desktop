<template>
  <div class="chat-interface">
    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <div class="empty-text">开始新的对话</div>
      </div>
      
      <div v-for="message in messages" :key="message.id" class="message-item">
        <div class="message" :class="message.role">
          <div class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-body">
            <div class="message-content">
              <div class="message-text" v-html="renderMarkdown(message.content)"></div>
            </div>
            <div class="message-footer">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <button @click="replyToMessageFunc(message)" class="reply-btn" title="回复">↩️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <!-- 快捷操作栏 -->
      <div class="action-bar">
        <button @click="$emit('clear-conversation')" class="action-btn" title="清空对话">🗑️</button>
        <button @click="$emit('export-conversation')" class="action-btn" title="导出">📥</button>
        <button @click="$emit('export-pdf')" class="action-btn" title="PDF">📄</button>
        <button @click="$emit('copy-last-answer')" class="action-btn" title="复制">📋</button>
        <button @click="saveLastCodeSnippet" class="action-btn" title="收藏代码">💾</button>
        <div class="divider"></div>
        <button @click="$emit('apply-template', 'explain')" class="action-btn" title="解释代码">💡</button>
        <button @click="$emit('apply-template', 'optimize')" class="action-btn" title="优化">⚡</button>
        <button @click="$emit('apply-template', 'debug')" class="action-btn" title="调试">🐛</button>
      </div>

      <!-- 输入框 -->
      <div class="input-box">
        <textarea
          ref="inputRef"
          v-model="inputText"
          @keydown="handleKeyDown"
          placeholder="输入消息..."
          class="input-field"
          rows="1"
        ></textarea>
        <button 
          @click="sendMessage" 
          :disabled="!inputText.trim() || isGenerating"
          class="send-button"
        >
          📤 发送
        </button>
      </div>

      <!-- 状态提示 -->
      <div v-if="isGenerating" class="status-tip">
        <span class="status-dot"></span>
        <span>AI 正在回复...</span>
      </div>
      <div class="hint-text">按 Enter 发送，Shift + Enter 换行</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { formatTime } from '../utils/common'
import { useMarkdown } from '../composables'
import type { Message, Model } from '../types'

const { renderMarkdown } = useMarkdown()

const props = defineProps<{
  messages: Message[]
  isGenerating: boolean
  availableModels: Model[]
  currentModel: string
}>()

const emit = defineEmits<{
  'send-message': [content: string]
  'model-change': [modelId: string]
  'clear-conversation': []
  'export-conversation': []
  'export-pdf': []
  'copy-last-answer': []
  'apply-template': [type: string]
  'save-code-snippet': [code: string, language: string]
}>()

const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement>()
const messagesContainer = ref<HTMLDivElement>()

function sendMessage() {
  const content = inputText.value.trim()
  if (!content || props.isGenerating) return

  emit('send-message', content)
  inputText.value = ''
  scrollToBottom()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

function handleModelChange(modelId: string) {
  emit('model-change', modelId)
}

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

function scrollToBottom() {
  if (!messagesContainer.value) return
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

watch(
  () => props.messages,
  (newMessages, oldMessages) => {
    if (props.isGenerating || !oldMessages || newMessages.length > oldMessages.length) {
      scrollToBottom()
    }
  },
  { deep: true }
)

watch(() => props.isGenerating, scrollToBottom)

onMounted(scrollToBottom)

function extractCodeBlocks(content: string): Array<{ code: string; language: string }> {
  const codeBlocks: Array<{ code: string; language: string }> = []
  const regex = /```(\w+)?\s*\n([\s\S]*?)```/g
  let match

  while ((match = regex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    })
  }

  return codeBlocks
}

function saveLastCodeSnippet() {
  const assistantMessages = props.messages.filter((m) => m.role === 'assistant')
  if (assistantMessages.length === 0) {
    alert('没有找到助手的消息')
    return
  }

  const lastMessage = assistantMessages[assistantMessages.length - 1]
  const codeBlocks = extractCodeBlocks(lastMessage.content)

  if (codeBlocks.length === 0) {
    alert('该消息中没有找到代码块')
    return
  }

  const firstBlock = codeBlocks[0]
  emit('save-code-snippet', firstBlock.code, firstBlock.language)
}

function replyToMessageFunc(message: Message) {
  // 简化处理，可以在父组件中实现
  console.log('Reply to:', message.id)
}
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0.5;
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 14px;
}

/* 消息样式 */
.message-item {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: var(--n-action-color);
}

.message.user .message-avatar {
  background: var(--n-primary-color);
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--n-action-color);
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message.user .message-content {
  background: var(--n-primary-color);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  border-bottom-left-radius: 4px;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
}

.message.user .message-footer {
  flex-direction: row-reverse;
}

.message-time {
  font-size: 11px;
  color: var(--n-text-color-3);
}

.reply-btn {
  padding: 2px 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.message-item:hover .reply-btn {
  opacity: 1;
}

.reply-btn:hover {
  background: var(--n-action-color);
}

/* Markdown 样式 */
.message-text :deep(p) {
  margin: 6px 0;
}

.message-text :deep(p:first-child) {
  margin-top: 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(pre) {
  background: var(--n-code-color);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-text :deep(code) {
  background: var(--n-tag-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.message-text :deep(pre code) {
  background: transparent;
  padding: 0;
}

/* 输入区域 */
.input-section {
  padding: 16px;
  background: var(--n-color);
  border-top: 1px solid var(--n-border-color);
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--n-border-color);
}

.action-btn {
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
}

.action-btn:hover {
  background: var(--n-action-color);
  opacity: 1;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--n-border-color);
  margin: 0 4px;
}

.input-box {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.input-field {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  min-height: 44px;
  max-height: 160px;
}

.input-field:focus {
  border-color: var(--n-primary-color);
}

.send-button {
  padding: 12px 24px;
  background: var(--n-primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  height: 44px;
}

.send-button:hover:not(:disabled) {
  opacity: 0.9;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 状态提示 */
.status-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--n-primary-color);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--n-primary-color);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.hint-text {
  font-size: 11px;
  color: var(--n-text-color-3);
  text-align: center;
  margin-top: 8px;
  opacity: 0.7;
}
</style>
