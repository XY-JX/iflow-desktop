<template>
  <div ref="containerRef" style="flex: 1; overflow-y: auto; padding: 16px; position: relative;" @scroll="handleScroll">
    <NEmpty
      v-if="messages.length === 0"
      description="开始新的对话"
      style="margin: auto;"
    />

    <NSpace v-else vertical :size="12">
      <div v-for="message in messages" :key="message.id">
        <NCard
          size="small"
          :bordered="false"
          :style="{
            maxWidth: '85%',
            marginLeft: message.role === 'user' ? 'auto' : undefined,
            marginRight: message.role === 'assistant' ? 'auto' : undefined,
          }"
        >
          <!-- 助手消息：头像在左 -->
          <NSpace v-if="message.role === 'assistant'" align="flex-start" :wrap="false">
            <NAvatar :size="36" round style="background: var(--n-action-color);">🤖</NAvatar>
            <div style="flex: 1; min-width: 0;">
              <div class="message-text" v-html="getCachedMarkdown(message.content)" />
              <NSpace justify="space-between" align="center" style="margin-top: 6px;">
                <NText depth="3" style="font-size: 11px;">{{ formatTime(message.timestamp) }}</NText>
                <NButton @click="$emit('reply-to-message', message)" size="tiny" quaternary title="回复" class="reply-btn">↩️</NButton>
              </NSpace>
            </div>
          </NSpace>

          <!-- 用户消息：头像在右 -->
          <NSpace v-else align="flex-start" :wrap="false" justify="end">
            <div style="flex: 1; min-width: 0; text-align: right;">
              <div class="message-text" v-html="getCachedMarkdown(message.content)" />
              <NSpace justify="end" align="center" style="margin-top: 6px;">
                <NText depth="3" style="font-size: 11px;">{{ formatTime(message.timestamp) }}</NText>
              </NSpace>
            </div>
            <NAvatar :size="36" round style="background: var(--n-primary-color);">👤</NAvatar>
          </NSpace>
        </NCard>
      </div>
    </NSpace>

    <!-- 滚动到底部按钮 -->
    <Transition name="fade">
      <NButton
        v-if="showScrollButton"
        circle
        secondary
        size="small"
        @click="scrollToBottom(true)"
        title="滚动到底部"
        style="position: sticky; bottom: 16px; left: 50%; transform: translateX(-50%); box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10;"
      >
        ⬇️
      </NButton>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { NCard, NSpace, NAvatar, NButton, NText, NEmpty } from 'naive-ui';
import { formatTime } from '../utils/common';
import { useMarkdown, setupCodeCopyDelegation } from '../composables';
import type { Message } from '../types';

const { renderMarkdown } = useMarkdown();

// 缓存已渲染的 Markdown，避免重复解析
const markdownCache = new Map<string, string>();

function getCachedMarkdown(content: string): string {
  const cached = markdownCache.get(content);
  if (cached) return cached;
  const rendered = renderMarkdown(content);
  markdownCache.set(content, rendered);
  // 限制缓存大小，防止内存泄漏
  if (markdownCache.size > 200) {
    const firstKey = markdownCache.keys().next().value;
    if (firstKey !== undefined) {
      markdownCache.delete(firstKey);
    }
  }
  return rendered;
}

interface Props {
  messages: Message[];
  isGenerating: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  'reply-to-message': [message: Message];
}>();

const containerRef = ref<HTMLDivElement>();
const showScrollButton = ref(false);
const isUserScrolling = ref(false);
let rafId: number | null = null;

function isNearBottom(): boolean {
  if (!containerRef.value) return true;
  const { scrollTop, scrollHeight, clientHeight } = containerRef.value;
  return scrollHeight - scrollTop - clientHeight < 100;
}

function scrollToBottom(smooth = false) {
  if (!containerRef.value) return;
  containerRef.value.scrollTo({
    top: containerRef.value.scrollHeight,
    behavior: smooth ? 'smooth' : 'instant',
  });
  showScrollButton.value = false;
  isUserScrolling.value = false;
}

function handleScroll() {
  if (!containerRef.value) return;
  const nearBottom = isNearBottom();
  showScrollButton.value = !nearBottom && props.messages.length > 0;
  isUserScrolling.value = !nearBottom;
}

function startAutoScroll() {
  function tick() {
    if (props.isGenerating && !isUserScrolling.value) {
      scrollToBottom();
    }
    if (props.isGenerating) {
      rafId = requestAnimationFrame(tick);
    }
  }
  rafId = requestAnimationFrame(tick);
}

function stopAutoScroll() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

watch(
  () => props.isGenerating,
  (generating) => {
    if (generating) {
      isUserScrolling.value = false;
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
  },
);

watch(
  () => props.messages.length,
  () => {
    if (!isUserScrolling.value) {
      scrollToBottom();
    }
  },
);

onMounted(() => {
  scrollToBottom();
  if (containerRef.value) {
    setupCodeCopyDelegation(containerRef.value);
  }
});

onUnmounted(() => {
  stopAutoScroll();
});
</script>

<style scoped>
.reply-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

div:hover > .n-card .reply-btn {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Markdown 内容样式 */
.message-text :deep(p) { margin: 6px 0; }
.message-text :deep(p:first-child) { margin-top: 0; }
.message-text :deep(p:last-child) { margin-bottom: 0; }

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
}

.message-text :deep(.code-copy-btn) {
  background: #0e639c;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.message-text :deep(.code-copy-btn:hover) {
  background: #1177bb;
}

.message-text :deep(.code-content) {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
}

.message-text :deep(.code-content code) {
  font-family: 'Fira Code', 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #d4d4d4;
  background: transparent;
  padding: 0;
}

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
