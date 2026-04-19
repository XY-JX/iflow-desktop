<template>
  <div class="chat-history">
    <div class="history-header">
      <h3>对话历史</h3>
      <n-button type="primary" block @click="$emit('new-chat')">
        <template #icon><span>+</span></template>
        新建对话
      </n-button>

      <!-- 搜索框 -->
      <div class="search-box">
        <n-input
          v-model:value="searchKeyword"
          placeholder="🔍 搜索对话..."
          clearable
          size="small"
        />
      </div>
    </div>

    <div class="history-list">
      <div
        v-for="conversation in filteredConversations"
        :key="conversation.id"
        class="history-item"
        :class="{ active: activeConversationId === conversation.id }"
        @click="$emit('select-conversation', conversation.id)"
      >
        <div class="conversation-title">{{ conversation.title }}</div>

        <!-- 标签显示 -->
        <div v-if="conversation.tags && conversation.tags.length > 0" class="tags-container">
          <span v-for="tag in conversation.tags.slice(0, 2)" :key="tag" class="tag">
            {{ tag }}
          </span>
          <span v-if="conversation.tags.length > 2" class="tag-more">
            +{{ conversation.tags.length - 2 }}
          </span>
        </div>

        <div class="conversation-meta">
          <span class="model-name">{{ conversation.model }}</span>
          <span class="conversation-time">{{ formatTime(conversation.updatedAt) }}</span>
        </div>
        <n-button 
          quaternary 
          circle 
          size="tiny"
          class="delete-btn" 
          @click.stop="handleDeleteConversation(conversation.id, conversation.title)"
        >
          ×
        </n-button>
      </div>

      <!-- 无搜索结果提示 -->
      <div v-if="filteredConversations.length === 0 && searchKeyword" class="no-results">
        <p>未找到匹配的对话</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { NButton, NInput } from 'naive-ui';
  import { formatTime } from '../utils/common';
  import { showDeleteConfirm } from '../utils/message';
  import type { Conversation } from '../types';

  const props = defineProps<{
    conversations: Conversation[];
    activeConversationId?: string;
  }>();

  const emit = defineEmits<{
    'new-chat': [];
    'select-conversation': [id: string];
    'delete-conversation': [id: string];
  }>();

  // 搜索关键词
  const searchKeyword = ref('');

  // 处理删除对话
  function handleDeleteConversation(id: string, title: string) {
    showDeleteConfirm(title, () => {
      emit('delete-conversation', id);
    });
  }

  // 过滤后的对话列表（支持模糊搜索）
  const filteredConversations = computed(() => {
    if (!searchKeyword.value.trim()) {
      return props.conversations;
    }

    const keyword = searchKeyword.value.toLowerCase().trim();
    return props.conversations.filter((conv) => {
      // 搜索标题
      const titleMatch = conv.title.toLowerCase().includes(keyword);
      // 搜索模型名称
      const modelMatch = conv.model.toLowerCase().includes(keyword);
      // 搜索消息内容
      const messageMatch = conv.messages.some((msg) => msg.content.toLowerCase().includes(keyword));

      return titleMatch || modelMatch || messageMatch;
    });
  });
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

  /* 搜索框样式 */
  .search-box {
    margin-top: 12px;
  }

  /* 无搜索结果提示 */
  .no-results {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-secondary, #999);
  }

  .no-results p {
    margin: 0;
    font-size: 14px;
  }

  /* 高亮文本 */
  :deep(mark) {
    background: var(--color-warning);
    color: #856404;
    padding: 1px 2px;
    border-radius: 2px;
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

  /* 标签样式 */
  .tags-container {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .tag {
    display: inline-block;
    padding: 2px 8px;
    background: var(--primary-light, #e8f4ff);
    color: var(--primary-color, #4a90e2);
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
  }

  .tag-more {
    display: inline-block;
    padding: 2px 6px;
    background: var(--bg-hover, #f0f0f0);
    color: var(--text-secondary, #666);
    border-radius: 12px;
    font-size: 11px;
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
    opacity: 0;
    transition: all 0.2s;
  }

  .history-item:hover .delete-btn {
    opacity: 1;
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

    :deep(mark) {
      background: #5c4b1e;
      color: var(--color-warning);
    }

    /* 深色主题 - 标签 */
    .tag {
      background: var(--primary-dark, #1a4d7a);
      color: #7cb3ff;
    }

    .tag-more {
      background: var(--bg-hover, #3d3d3d);
      color: var(--text-secondary, #aaa);
    }
  }
</style>
