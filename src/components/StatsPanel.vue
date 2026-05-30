<template>
  <n-layout class="stats-panel">
    <n-layout-header bordered style="padding: 12px 16px;">
      <n-space justify="space-between" align="center">
        <n-text strong>📊 统计分析</n-text>
        <n-button quaternary circle @click="$emit('close')">×</n-button>
      </n-space>
    </n-layout-header>

    <n-layout-content style="padding: 16px;">
      <!-- 总体统计 -->
      <n-space vertical :size="24">
        <div>
          <n-h6 prefix="bar" style="margin-bottom: 12px;">总体统计</n-h6>
          <n-grid :cols="2" :x-gap="12" :y-gap="12">
            <n-gi>
              <n-statistic label="💬 对话总数">{{ totalConversations }}</n-statistic>
            </n-gi>
            <n-gi>
              <n-statistic label="📨 消息总数">{{ totalMessages }}</n-statistic>
            </n-gi>
            <n-gi>
              <n-statistic label="🔢 Token 总量">{{ formatNumber(totalTokens) }}</n-statistic>
            </n-gi>
            <n-gi>
              <n-statistic label="⏱️ 平均响应时间">{{ averageResponseTime }}s</n-statistic>
            </n-gi>
          </n-grid>
        </div>

        <!-- 模型使用统计 -->
        <div>
          <n-h6 prefix="bar" style="margin-bottom: 12px;">模型使用分布</n-h6>
          <n-space vertical :size="12">
            <n-card v-for="(count, model) in modelUsage" :key="model" size="small">
              <n-space justify="space-between" style="margin-bottom: 8px;">
                <n-text strong>{{ model }}</n-text>
                <n-text depth="3">{{ count }} 次对话</n-text>
              </n-space>
              <n-progress
                type="line"
                :percentage="(count / maxModelUsage) * 100"
                :height="6"
                :show-indicator="false"
              />
            </n-card>
          </n-space>
        </div>

        <!-- 最近活动 -->
        <div>
          <n-h6 prefix="bar" style="margin-bottom: 12px;">最近活动</n-h6>
          <n-space vertical :size="8">
            <n-card
              v-for="conv in recentConversations"
              :key="conv.id"
              size="small"
              style="border-left: 3px solid var(--n-primary-color);"
            >
              <n-text strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ conv.title }}
              </n-text>
              <n-space justify="space-between" style="margin-top: 6px;">
                <n-text depth="3" style="font-size: 12px;">{{ conv.messages.length }} 条消息</n-text>
                <n-text depth="3" style="font-size: 12px;">{{ formatTime(conv.updatedAt) }}</n-text>
              </n-space>
            </n-card>
            <n-empty v-if="recentConversations.length === 0" description="暂无对话记录" />
          </n-space>
        </div>
      </n-space>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  NLayout, NLayoutHeader, NLayoutContent,
  NSpace, NText, NButton, NGrid, NGi, NStatistic, NProgress, NCard, NEmpty, NH6,
} from 'naive-ui';
import { formatTime } from '../utils/common';
import type { Conversation } from '../types';

const props = defineProps<{
  conversations: Conversation[];
}>();

defineEmits<{
  close: [];
}>();

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

const recentConversations = computed(() => {
  return [...props.conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
});

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
</script>

<style scoped>
.stats-panel {
  height: 100%;
}
</style>
