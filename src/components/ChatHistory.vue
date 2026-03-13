<template>
  <div class="chat-history">
    <div class="history-header">
      <h3>对话历史</h3>
      <button class="new-chat-btn" @click="$emit('new-chat')">
        <span>+</span> 新建对话
      </button>
    </div>
    <div class="history-list">
      <div
        v-for="conversation in conversations"
        :key="conversation.id"
        class="history-item"
        :class="{ active: activeConversationId === conversation.id }"
        @click="$emit('select-conversation', conversation.id)"
      >
        <div class="conversation-title">{{ conversation.title }}</div>
        <div class="conversation-meta">
          <span class="model-name">{{ conversation.model }}</span>
          <span class="conversation-time">{{ formatTime(conversation.updatedAt) }}</span>
        </div>
        <button
          class="delete-btn"
          @click.stop="$emit('delete-conversation', conversation.id)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '../types';

defineProps<{
  conversations: Conversation[];
  activeConversationId?: string;
}>();

defineEmits<{
  'new-chat': [];
  'select-conversation': [id: string];
  'delete-conversation': [id: string];
}>();

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
.chat-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary, #f8f9fa);
  border-right: 1px solid var(--border-color, #e0e0e0);
}

.history-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.history-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.new-chat-btn {
  width: 100%;
  padding: 10px;
  background: var(--primary-color, #4a90e2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.new-chat-btn:hover {
  background: var(--primary-hover, #357abd);
}

.new-chat-btn span {
  font-size: 18px;
  margin-right: 4px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  padding: 12px;
  margin-bottom: 4px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 1px solid transparent;
}

.history-item:hover {
  background: var(--bg-hover, #f0f0f0);
}

.history-item.active {
  background: var(--primary-light, #e8f4ff);
  border-color: var(--primary-color, #4a90e2);
}

.conversation-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #333);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 20px;
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary, #666);
}

.model-name {
  font-weight: 500;
  color: var(--primary-color, #4a90e2);
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #999);
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  border-radius: 4px;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #d32f2f;
}

@media (prefers-color-scheme: dark) {
  .chat-history {
    background: var(--bg-secondary, #2d2d2d);
    border-right-color: var(--border-color, #404040);
  }

  .history-header h3 {
    color: var(--text-primary, #f0f0f0);
  }

  .history-item {
    background: var(--bg-primary, #252525);
  }

  .history-item:hover {
    background: var(--bg-hover, #3d3d3d);
  }

  .history-item.active {
    background: var(--primary-dark, #1a4d7a);
  }

  .conversation-title {
    color: var(--text-primary, #f0f0f0);
  }

  .conversation-meta {
    color: var(--text-secondary, #aaa);
  }
}
</style>