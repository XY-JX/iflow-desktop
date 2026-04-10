<template>
  <div class="stats-panel">
    <div class="panel-header">
      <span class="panel-title">📊 统计分析</span>
      <button @click="$emit('close')" class="btn-close">×</button>
    </div>
    
    <div class="stats-content">
      <!-- 总体统计 -->
      <div class="stats-section">
        <h3>总体统计</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div class="stat-value">{{ totalConversations }}</div>
            <div class="stat-label">对话总数</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📨</div>
            <div class="stat-value">{{ totalMessages }}</div>
            <div class="stat-label">消息总数</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔢</div>
            <div class="stat-value">{{ formatNumber(totalTokens) }}</div>
            <div class="stat-label">Token 总量</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ averageResponseTime }}s</div>
            <div class="stat-label">平均响应时间</div>
          </div>
        </div>
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
            <div class="model-bar">
              <div 
                class="model-bar-fill" 
                :style="{ width: (count / maxModelUsage * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 时间趋势 -->
      <div class="stats-section">
        <h3>最近活动</h3>
        <div class="activity-list">
          <div v-for="conv in recentConversations" :key="conv.id" class="activity-item">
            <div class="activity-title">{{ conv.title }}</div>
            <div class="activity-meta">
              <span>{{ conv.messages.length }} 条消息</span>
              <span>{{ formatTime(conv.updatedAt) }}</span>
            </div>
          </div>
          <div v-if="recentConversations.length === 0" class="empty-state">
            暂无对话记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
  props.conversations.forEach(conv => {
    conv.messages.forEach(msg => {
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
  
  props.conversations.forEach(conv => {
    conv.messages.forEach(msg => {
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
  props.conversations.forEach(conv => {
    usage[conv.model] = (usage[conv.model] || 0) + 1;
  });
  return usage;
});

const maxModelUsage = computed(() => {
  return Math.max(...Object.values(modelUsage.value), 1);
});

// 最近的对话
const recentConversations = computed(() => {
  return [...props.conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);
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

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}
</script>

<style scoped>
.stats-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, white);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #666);
  font-size: 24px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--bg-hover, #f0f0f0);
  color: var(--text-primary, #333);
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
  color: var(--text-primary, #333);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  padding: 16px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 8px;
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color, #4a90e2);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary, #666);
}

/* 模型统计 */
.model-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-stat-item {
  padding: 12px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 8px;
}

.model-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.model-name {
  font-weight: 600;
  color: var(--text-primary, #333);
}

.model-count {
  color: var(--text-secondary, #666);
}

.model-bar {
  height: 6px;
  background: var(--bg-hover, #e0e0e0);
  border-radius: 3px;
  overflow: hidden;
}

.model-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color, #4a90e2), #6c5ce7);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 活动列表 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  padding: 12px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 8px;
  border-left: 3px solid var(--primary-color, #4a90e2);
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #333);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary, #666);
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary, #999);
  font-size: 14px;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  .stats-panel {
    background: var(--bg-primary, #1a1a1a);
  }
  
  .panel-title {
    color: var(--text-primary, #f0f0f0);
  }
  
  .btn-close:hover {
    background: var(--bg-hover, #3d3d3d);
  }
  
  .stats-section h3 {
    color: var(--text-primary, #f0f0f0);
  }
  
  .stat-card {
    background: var(--bg-secondary, #2d2d2d);
  }
  
  .stat-value {
    color: #7cb3ff;
  }
  
  .stat-label {
    color: var(--text-secondary, #aaa);
  }
  
  .model-stat-item {
    background: var(--bg-secondary, #2d2d2d);
  }
  
  .model-name {
    color: var(--text-primary, #f0f0f0);
  }
  
  .model-count {
    color: var(--text-secondary, #aaa);
  }
  
  .model-bar {
    background: var(--bg-hover, #3d3d3d);
  }
  
  .activity-item {
    background: var(--bg-secondary, #2d2d2d);
  }
  
  .activity-title {
    color: var(--text-primary, #f0f0f0);
  }
  
  .activity-meta {
    color: var(--text-secondary, #aaa);
  }
}
</style>
