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
      <n-card
        v-for="conversation in filteredConversations"
        :key="conversation.id"
        :class="{ 'active-conversation': activeConversationId === conversation.id }"
        @click="$emit('select-conversation', conversation.id)"
        hoverable
        size="small"
        style="margin-bottom: 4px; cursor: pointer; position: relative;"
        :content-style="{ padding: '12px' }"
      >
        <div class="conversation-title">{{ conversation.title }}</div>

        <!-- 标签显示 -->
        <n-space v-if="conversation.tags && conversation.tags.length > 0" :size="4" style="margin-top: 8px;">
          <n-tag
            v-for="tag in conversation.tags.slice(0, 2)"
            :key="tag"
            size="small"
            type="info"
          >
            {{ tag }}
          </n-tag>
          <n-tag v-if="conversation.tags.length > 2" size="small" type="default">
            +{{ conversation.tags.length - 2 }}
          </n-tag>
        </n-space>

        <div class="conversation-meta">
          <span class="model-name">{{ conversation.model }}</span>
          <span class="conversation-time">{{ formatTime(conversation.updatedAt) }}</span>
        </div>
        
        <n-button 
          quaternary 
          circle 
          size="tiny"
          type="error"
          class="delete-btn" 
          @click.stop="handleDeleteConversation(conversation.id, conversation.title)"
        >
          ×
        </n-button>
      </n-card>

      <!-- 无搜索结果提示 -->
      <n-empty v-if="filteredConversations.length === 0 && searchKeyword" description="未找到匹配的对话" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { NButton, NInput, NCard, NSpace, NTag, NEmpty } from 'naive-ui';
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
  }

  .history-header {
    padding: 16px;
  }

  .history-header h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
  }

  /* 搜索框样式 */
  .search-box {
    margin-top: 12px;
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  /* 激活的对话卡片 */
  :deep(.active-conversation) {
    border-color: var(--n-border-color-hover);
    background-color: var(--n-color-hover);
  }

  .conversation-title {
    font-size: 14px;
    font-weight: 500;
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
    color: var(--n-text-color-3);
    margin-top: 8px;
  }

  .model-name {
    font-weight: 500;
    color: var(--n-primary-color);
  }

  .delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0;
    transition: all 0.2s;
    z-index: 1;
  }

  :deep(.n-card:hover) .delete-btn {
    opacity: 1;
  }
</style>
