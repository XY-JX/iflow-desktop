<template>
  <n-modal 
    :show="visible" 
    preset="card" 
    :title="zhipuReady ? '⚙️ API Key 管理' : '🔑 配置 API Key'" 
    style="max-width: 450px;"
    :mask-closable="false"
    @update:show="$emit('update:visible', $event)"
  >
    <div class="api-key-dialog-content">
      <div v-if="zhipuReady" class="status-info success">
        <span class="status-icon">✅</span>
        <span class="status-text">已配置并可用</span>
      </div>
      <div v-else class="status-info warning">
        <span class="status-icon">⚠️</span>
        <span class="status-text">未配置</span>
      </div>

      <div class="input-section">
        <n-input
          v-model:value="apiKeyInput"
          type="password"
          placeholder="请输入智谱 AI API Key"
          show-password-on="click"
          size="large"
        />
        <p class="input-hint">如果没有 API Key，可以留空直接关闭</p>
      </div>

      <div class="dialog-actions">
        <n-button @click="$emit('clear-key')" :disabled="!zhipuReady" type="error">
          🗑️ 清除配置
        </n-button>
        <n-button @click="$emit('save-key', apiKeyInput)" type="primary">
          💾 保存配置
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NInput, NButton } from 'naive-ui';

interface Props {
  visible: boolean;
  zhipuReady: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'clear-key': [];
  'save-key': [apiKey: string];
}>();

const apiKeyInput = ref('');

// 监听对话框打开,清空输入框
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    apiKeyInput.value = '';
  }
});

// 暴露方法供父组件设置初始值
defineExpose({
  setApiKey: (key: string) => {
    apiKeyInput.value = key;
  },
});
</script>

<style scoped>
.api-key-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: var(--radius-md);
}

.status-info.success {
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
}

.status-info.warning {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
}

.status-icon {
  font-size: 20px;
}

.status-text {
  font-size: 14px;
  color: var(--text-primary);
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}
</style>
