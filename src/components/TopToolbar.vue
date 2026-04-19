<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <n-tag :type="zhipuReady ? 'success' : 'error'" size="small" round>
        <template #icon>
          <span>{{ zhipuReady ? '✅' : '⚠️' }}</span>
        </template>
        智谱 AI: {{ zhipuReady ? '已就绪' : zhipuStatus || '未配置' }}
      </n-tag>
      <n-button
        @click="$emit('open-api-key-dialog')"
        :type="zhipuReady ? 'warning' : 'primary'"
        size="small"
      >
        {{ zhipuReady ? '⚙️ 管理 API Key' : '🔑 配置 API Key' }}
      </n-button>
    </div>

    <!-- 快速角色选择 -->
    <div class="quick-role-selector">
      <n-select
        :value="systemPrompt"
        class="role-select"
        @update:value="$emit('update:systemPrompt', $event)"
        :options="roleOptions"
        :title="systemPrompt"
        :menu-props="{ style: { minWidth: '200px' } }"
      />
    </div>

    <div class="toolbar-right">
      <n-button @click="$emit('toggle-settings')" size="small" quaternary>
        ⚙️ 高级设置
      </n-button>

      <n-button @click="$emit('toggle-stats')" size="small" quaternary>📊 统计</n-button>

      <!-- 对话统计 -->
      <div class="stats-display">
        <span class="stat-item">
          <span class="stat-label">💬 消息</span>
          <span class="stat-value">{{ messageCount }}</span>
        </span>
        <span class="stat-item">
          <span class="stat-label">🔢 Token</span>
          <span class="stat-value">{{ tokenCount }}</span>
        </span>
      </div>
    </div>

    <span v-if="zhipuStatus" class="status-message">{{ zhipuStatus }}</span>
  </div>
</template>

<script setup lang="ts">
import { NTag, NButton, NSelect } from 'naive-ui';
import type { CustomRole } from '../types';

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
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-role-selector {
  flex: 1;
  max-width: 300px;
}

.role-select {
  width: 100%;
}

.status-message {
  font-size: 12px;
  color: var(--text-tertiary);
}

.stats-display {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.stat-label {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color-1);
}
</style>
