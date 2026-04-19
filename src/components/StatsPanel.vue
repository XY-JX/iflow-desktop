<template>
  <div class="stats-panel">
    <div class="panel-header">
      <span class="panel-title">📊 统计分析</span>
      <n-button quaternary circle @click="$emit('close')">×</n-button>
    </div>

    <div class="stats-content">
      <!-- 总体统计 -->
      <div class="stats-section">
        <h3>总体统计</h3>
        <n-grid :cols="2" :x-gap="12" :y-gap="12">
          <n-gi>
            <n-statistic label="对话总数">
              <template #prefix>💬</template>
              {{ totalConversations }}
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="消息总数">
              <template #prefix>📨</template>
              {{ totalMessages }}
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="Token 总量">
              <template #prefix>🔢</template>
              {{ formatNumber(totalTokens) }}
            </n-statistic>
          </n-gi>
          <n-gi>
            <n-statistic label="平均响应时间">
              <template #prefix>⏱️</template>
              {{ averageResponseTime }}s
            </n-statistic>
          </n-gi>
        </n-grid>
      </div>

      <!-- 模型使用统计 -->
      <div class="stats-section">
        <h3>模型使用分布</h3>
        <div class="model-stats">
          <div v-for="(count, model) in modelUsage" :key="model" class="model-stat-item">
            <div class="model-info">
              <span class="model-name">{{ model }}</span>
              <span class="model-count">{{ count }} 次对话</span>
            </div>
            <n-progress
              type="line"
              :percentage="(count / maxModelUsage) * 100"
              :height="6"
              :show-indicator="false"
              color="var(--n-primary-color)"
            />
          </div>
        </div>
      </div>

      <!-- 时间趋势 -->
      <div class="stats-section">
        <h3>最近活动</h3>
        <div class="activity-list">
          <n-card
            v-for="conv in recentConversations"
            :key="conv.id"
            size="small"
            style="border-left: 3px solid var(--n-primary-color);"
          >
            <div class="activity-title">{{ conv.title }}</div>
            <div class="activity-meta">
              <span>{{ conv.messages.length }} 条消息</span>
              <span>{{ formatTime(conv.updatedAt) }}</span>
            </div>
          </n-card>
          <n-empty v-if="recentConversations.length === 0" description="暂无对话记录" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { NButton, NGrid, NGi, NStatistic, NProgress, NCard, NEmpty } from 'naive-ui';
  import { formatTime } from '../utils/common';
  import type { Conversation } from '../types';

  const props = defineProps<{
    conversations: Conversation[];
  }>();

  defineEmits<{
    close: [];
  }>();

  // 总体统计
  const totalConversations = computed(() => props.conversations.length);

  const totalMessages = computed(() => {
    return props.conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
  });

  const totalTokens = computed(() => {
    let tokens = 0;
    props.conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        if (msg.executionInfo) {
          tokens += msg.executionInfo.token_usage.total;
        }
      });
    });
    return tokens;
  });

  const averageResponseTime = computed(() => {
    let totalTime = 0;
    let count = 0;

    props.conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        if (msg.executionInfo) {
          totalTime += msg.executionInfo.execution_time_ms;
          count++;
        }
      });
    });

    return count > 0 ? (totalTime / count / 1000).toFixed(2) : '0.00';
  });

  // 模型使用统计
  const modelUsage = computed(() => {
    const usage: Record<string, number> = {};
    props.conversations.forEach((conv) => {
      usage[conv.model] = (usage[conv.model] || 0) + 1;
    });
    return usage;
  });

  const maxModelUsage = computed(() => {
    return Math.max(...Object.values(modelUsage.value), 1);
  });

  // 最近的对话
  const recentConversations = computed(() => {
    return [...props.conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  });

  // 格式化数字
  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
</script>

<style scoped>
  .stats-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .stats-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .stats-section {
    margin-bottom: 24px;
  }

  .stats-section h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* 模型统计 */
  .model-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .model-stat-item {
    padding: 12px;
    border-radius: 8px;
    background: var(--n-color-modal);
  }

  .model-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .model-name {
    font-weight: 600;
  }

  .model-count {
    color: var(--n-text-color-3);
  }

  /* 活动列表 */
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .activity-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .activity-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--n-text-color-3);
  }
</style>
