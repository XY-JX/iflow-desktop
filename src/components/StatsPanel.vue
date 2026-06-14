<template>
  <NLayout style="height: 100%;">
    <NLayoutHeader bordered style="padding: 12px 16px;">
      <NSpace justify="space-between" align="center">
        <NText strong>📊 统计分析</NText>
        <NButton quaternary circle @click="$emit('close')">×</NButton>
      </NSpace>
    </NLayoutHeader>

    <NLayoutContent style="padding: 16px;">
      <NSpace vertical :size="24">
        <!-- 总体统计 -->
        <div>
          <NH6 prefix="bar" style="margin-bottom: 12px;">总体统计</NH6>
          <NGrid :cols="2" :x-gap="12" :y-gap="12">
            <NGi>
              <NStatistic label="💬 对话总数">{{ totalConversations }}</NStatistic>
            </NGi>
            <NGi>
              <NStatistic label="📨 消息总数">{{ totalMessages }}</NStatistic>
            </NGi>
            <NGi>
              <NStatistic label="🔢 Token 总量">{{ formatNumber(totalTokens) }}</NStatistic>
            </NGi>
            <NGi>
              <NStatistic label="⏱️ 平均响应时间">{{ averageResponseTime }}s</NStatistic>
            </NGi>
          </NGrid>
        </div>

        <!-- 模型使用统计 -->
        <div>
          <NH6 prefix="bar" style="margin-bottom: 12px;">模型使用分布</NH6>
          <NSpace vertical :size="12">
            <NCard v-for="(count, model) in modelUsage" :key="model" size="small">
              <NSpace justify="space-between" style="margin-bottom: 8px;">
                <NText strong>{{ model }}</NText>
                <NText depth="3">{{ count }} 次对话</NText>
              </NSpace>
              <NProgress
                type="line"
                :percentage="(count / maxModelUsage) * 100"
                :height="6"
                :show-indicator="false"
              />
            </NCard>
          </NSpace>
        </div>

        <!-- 最近活动 -->
        <div>
          <NH6 prefix="bar" style="margin-bottom: 12px;">最近活动</NH6>
          <NSpace vertical :size="8">
            <NCard
              v-for="conv in recentConversations"
              :key="conv.id"
              size="small"
              style="border-left: 3px solid var(--n-primary-color);"
            >
              <NText strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {{ conv.title }}
              </NText>
              <NSpace justify="space-between" style="margin-top: 6px;">
                <NText depth="3" style="font-size: 12px;">{{ conv.messages.length }} 条消息</NText>
                <NText depth="3" style="font-size: 12px;">{{ formatTime(conv.updatedAt) }}</NText>
              </NSpace>
            </NCard>
            <NEmpty v-if="recentConversations.length === 0" description="暂无对话记录" />
          </NSpace>
        </div>
      </NSpace>
    </NLayoutContent>
  </NLayout>
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
