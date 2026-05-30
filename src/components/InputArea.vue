<template>
  <div class="input-area">
    <!-- 快捷操作栏 -->
    <div class="action-bar">
      <n-button @click="$emit('clear-conversation')" size="small" quaternary title="清空对话">🗑️</n-button>
      <n-button @click="$emit('export-conversation')" size="small" quaternary title="导出 Markdown">📥</n-button>
      <n-button @click="$emit('export-pdf')" size="small" quaternary title="导出 PDF">📄</n-button>
      <n-button @click="$emit('copy-last-answer')" size="small" quaternary title="复制最后回答">📋</n-button>
      <n-button @click="$emit('save-code-snippet')" size="small" quaternary title="收藏代码">💾</n-button>
      <n-divider vertical />
      <n-button @click="$emit('apply-template', 'explain')" size="small" quaternary title="解释代码">💡 解释</n-button>
      <n-button @click="$emit('apply-template', 'optimize')" size="small" quaternary title="优化代码">⚡ 优化</n-button>
      <n-button @click="$emit('apply-template', 'debug')" size="small" quaternary title="调试代码">🐛 调试</n-button>
    </div>

    <!-- 输入框 + 发送按钮 -->
    <div class="input-row">
      <n-input
        ref="inputRef"
        v-model:value="inputText"
        @keydown="handleKeyDown"
        type="textarea"
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
        :autosize="{ minRows: 2, maxRows: 8 }"
        :bordered="true"
      />
      <n-button
        @click="sendMessage"
        :disabled="!inputText.trim() || isGenerating"
        type="primary"
        size="large"
        class="send-btn"
      >
        {{ isGenerating ? '⏳' : '📤 发送' }}
      </n-button>
    </div>

    <!-- 状态提示 -->
    <div class="input-footer">
      <template v-if="isGenerating">
        <n-badge dot color="var(--n-primary-color)" />
        <n-text depth="3" style="font-size: 12px;">AI 正在回复...</n-text>
      </template>
      <n-text v-else depth="3" style="font-size: 12px;">
        Enter 发送 | Shift+Enter 换行
      </n-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NInput, NDivider, NText, NBadge } from 'naive-ui';

interface Props {
  isGenerating: boolean;
}

defineProps<Props>();

const inputText = ref('');
const inputRef = ref<HTMLTextAreaElement>();

const emit = defineEmits<{
  'send-message': [content: string];
  'clear-conversation': [];
  'export-conversation': [];
  'export-pdf': [];
  'copy-last-answer': [];
  'apply-template': [type: string];
  'save-code-snippet': [];
}>();

function sendMessage() {
  const content = inputText.value.trim();
  if (!content) return;
  emit('send-message', content);
  inputText.value = '';
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}
</script>

<style scoped>
.input-area {
  padding: 12px 16px;
  background: var(--n-color);
  border-top: 1px solid var(--n-border-color);
  width: 100%;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--n-border-color);
  flex-wrap: wrap;
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  width: 100%;
}

/* 让 n-input 撑满剩余空间 */
.input-row :deep(.n-input) {
  flex: 1;
}

.send-btn {
  flex-shrink: 0;
  height: 40px;
  min-width: 80px;
}

.input-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  height: 20px;
}
</style>
