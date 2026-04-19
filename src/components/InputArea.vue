<template>
  <div class="input-section">
    <!-- 快捷操作栏 -->
    <div class="action-bar">
      <n-button @click="$emit('clear-conversation')" size="small" quaternary title="清空对话">🗑️</n-button>
      <n-button @click="$emit('export-conversation')" size="small" quaternary title="导出">📥</n-button>
      <n-button @click="$emit('export-pdf')" size="small" quaternary title="PDF">📄</n-button>
      <n-button @click="$emit('copy-last-answer')" size="small" quaternary title="复制">📋</n-button>
      <n-button @click="$emit('save-code-snippet')" size="small" quaternary title="收藏代码">💾</n-button>
      <div class="divider"></div>
      <n-button @click="$emit('apply-template', 'explain')" size="small" quaternary title="解释代码">💡</n-button>
      <n-button @click="$emit('apply-template', 'optimize')" size="small" quaternary title="优化">⚡</n-button>
      <n-button @click="$emit('apply-template', 'debug')" size="small" quaternary title="调试">🐛</n-button>
    </div>

    <!-- 输入框 -->
    <div class="input-box">
      <n-input
        ref="inputRef"
        v-model:value="inputText"
        @keydown="handleKeyDown"
        type="textarea"
        placeholder="输入消息..."
        :autosize="{ minRows: 1, maxRows: 6 }"
        :bordered="true"
        class="input-field"
      />
      <n-button 
        @click="sendMessage" 
        :disabled="!inputText.trim() || isGenerating"
        type="primary"
        class="send-button"
      >
        📤 发送
      </n-button>
    </div>

    <!-- 状态提示 -->
    <div v-if="isGenerating" class="status-tip">
      <span class="status-dot"></span>
      <span>AI 正在回复...</span>
    </div>
    <div class="hint-text">按 Enter 发送，Shift + Enter 换行</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NInput } from 'naive-ui';

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
  padding: 4px 8px;
  font-size: 14px;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--n-border-color);
  margin: 0 4px;
}

.input-box {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-field {
  flex: 1;
}

.send-button {
  flex-shrink: 0;
}

.status-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--n-text-color-3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--n-primary-color);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.hint-text {
  margin-top: 8px;
  font-size: 12px;
  color: var(--n-text-color-3);
  text-align: center;
}
</style>
