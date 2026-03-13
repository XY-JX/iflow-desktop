<template>
  <div class="chat-interface">
    <div class="chat-header">
      <ModelSelector
        :models="availableModels"
        :selected-model="currentModel"
        @model-change="handleModelChange"
      />
    </div>

    <div class="messages-container" ref="messagesContainer">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message"
        :class="message.role"
      >
        <div class="message-avatar">
          {{ message.role === 'user' ? '👤' : '🤖' }}
        </div>
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>
      <div v-if="isGenerating" class="message assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="message-text typing">正在思考...</div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <textarea
        v-model="inputText"
        @keydown="handleKeyDown"
        placeholder="输入消息..."
        rows="1"
        ref="inputRef"
      ></textarea>
      <button
        class="send-btn"
        @click="sendMessage"
        :disabled="!inputText.trim() || isGenerating"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import ModelSelector from './ModelSelector.vue';
import type { Message, Model } from '../types';

const props = defineProps<{
  messages: Message[];
  isGenerating: boolean;
  availableModels: Model[];
  currentModel: string;
}>();

const emit = defineEmits<{
  'send-message': [content: string];
  'model-change': [modelId: string];
}>();

const inputText = ref('');
const inputRef = ref<HTMLTextAreaElement>();
const messagesContainer = ref<HTMLDivElement>();

async function sendMessage() {
  const content = inputText.value.trim();
  if (!content || props.isGenerating) return;

  inputText.value = '';
  emit('send-message', content);

  // 自动调整输入框高度
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
    minute: '2-digit'
  });
}

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// 监听消息变化，自动滚动到底部
watch(() => props.messages, () => {
  scrollToBottom();
}, { deep: true });

// 监听生成状态变化
watch(() => props.isGenerating, () => {
  scrollToBottom();
});

// 自动调整输入框高度
watch(inputText, () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 150) + 'px';
  }
});
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, white);
}

.chat-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-secondary, #f8f9fa);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
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
  gap: 4px;
}

.message.user .message-content {
  align-items: flex-end;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
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
}

.message-time {
  font-size: 12px;
  color: var(--text-secondary, #999);
}

.message.user .message-time {
  text-align: right;
}

.input-area {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-secondary, #f8f9fa);
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
  transition: border-color 0.2s;
}

.input-area textarea:focus {
  outline: none;
  border-color: var(--primary-color, #4a90e2);
}

.send-btn {
  padding: 12px 24px;
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
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-color-scheme: dark) {
  .chat-interface {
    background: var(--bg-primary, #1a1a1a);
  }

  .chat-header {
    background: var(--bg-secondary, #2d2d2d);
    border-bottom-color: var(--border-color, #404040);
  }

  .message.assistant .message-text {
    background: var(--bg-secondary, #2d2d2d);
    color: var(--text-primary, #f0f0f0);
  }

  .message-time {
    color: var(--text-secondary, #777);
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
  }
}
</style>