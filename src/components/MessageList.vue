<template>
  <div class="messages-container" ref="containerRef">
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
            <n-button 
              @click="$emit('reply-to-message', message)" 
              size="tiny" 
              quaternary 
              title="回复" 
              class="reply-btn"
            >
              ↩️
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { NButton } from 'naive-ui';
import { formatTime } from '../utils/common';
import { useMarkdown } from '../composables';
import type { Message } from '../types';

const { renderMarkdown } = useMarkdown();

interface Props {
  messages: Message[];
  isGenerating: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  'reply-to-message': [message: Message];
}>();

const containerRef = ref<HTMLDivElement>();

function scrollToBottom() {
  if (!containerRef.value) return;
  containerRef.value.scrollTop = containerRef.value.scrollHeight;
}

// 监听消息变化,自动滚动到底部
watch(
  () => props.messages,
  (newMessages, oldMessages) => {
    if (props.isGenerating || !oldMessages || newMessages.length > oldMessages.length) {
      scrollToBottom();
    }
  },
  { deep: true }
);

watch(() => props.isGenerating, scrollToBottom);

onMounted(scrollToBottom);
</script>

<style scoped>
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
  opacity: 0;
  transition: all 0.2s;
}

.message-item:hover .reply-btn {
  opacity: 1;
}

.message-text :deep(p) {
  margin: 6px 0;
}

.message-text :deep(p:first-child) {
  margin-top: 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

/* 代码块样式 */
.message-text :deep(.code-block) {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
  border: 1px solid #333;
}

.message-text :deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #252526;
  border-bottom: 1px solid #333;
}

.message-text :deep(.code-lang) {
  font-size: 12px;
  color: #858585;
  font-weight: 500;
  text-transform: uppercase;
}

.message-text :deep(.code-copy-btn) {
  background: #0e639c;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.message-text :deep(.code-copy-btn:hover) {
  background: #1177bb;
}

.message-text :deep(.code-copy-btn.copied) {
  background: #16825d;
}

.message-text :deep(.code-content) {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  background: #1e1e1e;
}

.message-text :deep(.code-content code) {
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #d4d4d4;
  background: transparent;
  padding: 0;
}

/* 用户消息中的代码块 */
.message.user :deep(.code-block) {
  background: #0a3a6b;
  border-color: #1a5aa8;
}

.message.user :deep(.code-header) {
  background: #0d4480;
  border-bottom-color: #1a5aa8;
}

.message.user :deep(.code-lang) {
  color: #a3c9ff;
}

.message.user :deep(.code-copy-btn) {
  background: #0e639c;
}

.message.user :deep(.code-copy-btn:hover) {
  background: #1177bb;
}

.message.user :deep(.code-content) {
  background: #0a3a6b;
}

.message.user :deep(.code-content code) {
  color: #e8f4ff;
}

/* 行内代码 */
.message-text :deep(code) {
  background: var(--n-tag-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.message-text :deep(.code-content code) {
  background: transparent;
  padding: 0;
}
</style>
