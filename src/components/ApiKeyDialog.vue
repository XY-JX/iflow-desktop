<template>
  <n-modal
    :show="visible"
    preset="card"
    :title="zhipuReady ? '⚙️ API Key 管理' : '🔑 配置 API Key'"
    style="max-width: 450px;"
    :mask-closable="false"
    @update:show="$emit('update:visible', $event)"
  >
    <n-space vertical :size="16">
      <n-alert v-if="zhipuReady" type="success" :show-icon="false">
        ✅ 已配置并可用
      </n-alert>
      <n-alert v-else type="warning" :show-icon="false">
        ⚠️ 未配置
      </n-alert>

      <n-space vertical :size="4">
        <n-input
          v-model:value="apiKeyInput"
          type="password"
          placeholder="请输入智谱 AI API Key"
          show-password-on="click"
          size="large"
        />
        <n-text depth="3" style="font-size: 12px;">如果没有 API Key，可以留空直接关闭</n-text>
      </n-space>

      <n-space justify="end">
        <n-button @click="$emit('clear-key')" :disabled="!zhipuReady" type="error">
          🗑️ 清除配置
        </n-button>
        <n-button @click="$emit('save-key', apiKeyInput)" type="primary">
          💾 保存配置
        </n-button>
      </n-space>
    </n-space>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NInput, NButton, NSpace, NAlert, NText } from 'naive-ui';

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

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    apiKeyInput.value = '';
  }
});

defineExpose({
  setApiKey: (key: string) => {
    apiKeyInput.value = key;
  },
});
</script>
