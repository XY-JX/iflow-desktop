<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <n-tag :type="zhipuReady ? 'success' : 'warning'" size="small" round>
        {{ zhipuReady ? '✅ 已连接' : '⚠️ 未配置' }}
      </n-tag>
      <n-button
        @click="$emit('open-api-key-dialog')"
        size="small"
        :type="zhipuReady ? 'default' : 'primary'"
      >
        {{ zhipuReady ? '⚙️ API Key' : '🔑 配置' }}
      </n-button>
    </div>

    <!-- 快速角色选择 -->
    <div class="toolbar-center">
      <n-select
        :value="systemPrompt"
        class="role-select"
        @update:value="$emit('update:systemPrompt', $event)"
        :options="roleOptions"
        :title="systemPrompt"
        placeholder="选择角色..."
        size="small"
      />
    </div>

    <div class="toolbar-right">
      <!-- 对话统计 -->
      <div class="stats-display">
        <n-tag size="small" type="info">
          💬 {{ messageCount }}
        </n-tag>
        <n-tag size="small" type="info">
          🔢 {{ formatTokenCount(tokenCount) }}
        </n-tag>
      </div>

      <div class="toolbar-actions">
        <n-button @click="$emit('toggle-settings')" size="small" quaternary circle title="设置">
          ⚙️
        </n-button>
        <n-button @click="$emit('toggle-stats')" size="small" quaternary circle title="统计">
          📊
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NTag, NButton, NSelect } from 'naive-ui';

interface Props {
  zhipuReady: boolean;
  zhipuStatus: string;
  systemPrompt: string;
  roleOptions: Array<{ label: string; value: string }>;
  messageCount: number;
  tokenCount: number;
}

defineProps<Props>();

defineEmits<{
  'open-api-key-dialog': [];
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

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
  gap: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.toolbar-center {
  flex: 1;
  max-width: 280px;
  margin: 0 auto;
}

.role-select {
  width: 100%;
}

.stats-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
