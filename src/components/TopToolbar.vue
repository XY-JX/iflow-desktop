<template>
  <NSpace justify="space-between" align="center" style="padding: 8px 16px;">
    <!-- 左侧 -->
    <NSpace align="center" :size="8">
      <NTag :type="zhipuReady ? 'success' : 'warning'" size="small" round>
        {{ zhipuReady ? '✅ 已连接' : '⚠️ 未配置' }}
      </NTag>
      <NButton
        @click="$emit('open-api-key-dialog')"
        size="small"
        :type="zhipuReady ? 'default' : 'primary'"
      >
        {{ zhipuReady ? '⚙️ API Key' : '🔑 配置' }}
      </NButton>
    </NSpace>

    <!-- 中间：模型选择 + 角色选择 -->
    <NSpace align="center" :size="8">
      <NSelect
        :value="model"
        style="width: 160px;"
        @update:value="$emit('update:model', $event)"
        :options="modelOptions"
        placeholder="选择模型..."
        size="small"
      />
      <NSelect
        :value="systemPrompt"
        style="width: 180px;"
        @update:value="$emit('update:systemPrompt', $event)"
        :options="roleOptions"
        :title="systemPrompt"
        placeholder="选择角色..."
        size="small"
      />
    </NSpace>

    <!-- 右侧 -->
    <NSpace align="center" :size="8">
      <NSpace align="center" :size="6">
        <NTag size="small" type="info">💬 {{ messageCount }}</NTag>
        <NTag size="small" type="info">🔢 {{ formatTokenCount(tokenCount) }}</NTag>
      </NSpace>

      <NSpace align="center" :size="4">
        <NButton @click="$emit('toggle-settings')" size="small" quaternary circle title="设置">⚙️</NButton>
        <NButton @click="$emit('toggle-stats')" size="small" quaternary circle title="统计">📊</NButton>
      </NSpace>
    </NSpace>
  </NSpace>
</template>

<script setup lang="ts">
import { NTag, NButton, NSelect, NSpace } from 'naive-ui';

interface Props {
  zhipuReady: boolean;
  zhipuStatus: string;
  model: string;
  modelOptions: Array<{ label: string; value: string }>;
  systemPrompt: string;
  roleOptions: Array<{ label: string; value: string }>;
  messageCount: number;
  tokenCount: number;
}

defineProps<Props>();

defineEmits<{
  'open-api-key-dialog': [];
  'update:model': [value: string];
  'update:systemPrompt': [value: string];
  'toggle-settings': [];
  'toggle-stats': [];
}>();

// 格式化 token 数量
function formatTokenCount(count: number): string {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}
</script>
