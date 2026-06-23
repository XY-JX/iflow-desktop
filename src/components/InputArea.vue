<template>
  <div style="padding: 12px 16px; border-top: 1px solid var(--n-border-color); flex-shrink: 0;">
    <!-- 快捷操作栏 -->
    <div style="display: flex; align-items: center; gap: 2px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--n-border-color); flex-wrap: wrap;">
      <NButton @click="$emit('clear-conversation')" size="small" quaternary title="清空对话">🗑️</NButton>
      <NButton @click="$emit('export-conversation')" size="small" quaternary title="导出 Markdown">📥</NButton>
      <NButton @click="$emit('export-pdf')" size="small" quaternary title="导出 PDF">📄</NButton>
      <NButton @click="$emit('copy-last-answer')" size="small" quaternary title="复制最后回答">📋</NButton>
      <NButton @click="$emit('save-code-snippet')" size="small" quaternary title="收藏代码">💾</NButton>
      <NDivider vertical />
      <NButton @click="$emit('apply-template', 'explain')" size="small" quaternary title="解释代码">💡 解释</NButton>
      <NButton @click="$emit('apply-template', 'optimize')" size="small" quaternary title="优化代码">⚡ 优化</NButton>
      <NButton @click="$emit('apply-template', 'debug')" size="small" quaternary title="调试代码">🐛 调试</NButton>
    </div>

    <!-- 输入框 + 发送按钮 -->
    <div style="display: flex; gap: 10px; align-items: flex-end; width: 100%;">
      <NInput
        ref="inputRef"
        v-model:value="inputText"
        @keydown="handleKeyDown"
        type="textarea"
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
        :autosize="{ minRows: 2, maxRows: 8 }"
        :bordered="true"
        style="flex: 1;"
      />
      <NButton
        @click="sendMessage"
        :disabled="!inputText.trim() || isGenerating"
        type="primary"
        size="large"
        style="flex-shrink: 0; height: 40px; min-width: 80px;"
      >
        {{ isGenerating ? '⏳' : '📤 发送' }}
      </NButton>
    </div>

    <!-- 状态提示 -->
    <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px; height: 20px;">
      <template v-if="isGenerating">
        <NBadge dot color="var(--n-primary-color)" />
        <NText depth="3" style="font-size: 12px;">AI 正在回复...</NText>
      </template>
      <NText v-else depth="3" style="font-size: 12px;">
        Enter 发送 | Shift+Enter 换行
      </NText>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NInput, NDivider, NText, NBadge } from 'naive-ui';

interface Props {
  isGenerating: boolean;
  templateText?: string;
}

const props = defineProps<Props>();

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

// 通过 prop 接收模板文本，替代 window CustomEvent
watch(() => props.templateText, (newText) => {
  if (newText) {
    inputText.value = newText;
  }
});
</script>
