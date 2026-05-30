<template>
  <n-layout class="chat-history">
    <n-layout-header bordered class="history-header">
      <n-space vertical :size="12">
        <n-space justify="space-between" align="center">
          <n-text strong>对话历史</n-text>
          <n-button type="primary" size="small" @click="$emit('new-chat')">
            + 新建
          </n-button>
        </n-space>
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索对话..."
          clearable
          size="small"
        />
      </n-space>
    </n-layout-header>

    <n-layout-content class="history-list">
      <n-list hoverable clickable>
        <n-list-item
          v-for="conversation in filteredConversations"
          :key="conversation.id"
          :class="{ 'active-item': activeConversationId === conversation.id }"
          @click="$emit('select-conversation', conversation.id)"
        >
          <n-thing>
            <template #header>
              <n-text depth="1" style="font-size: 14px;">{{ conversation.title }}</n-text>
            </template>
            <template #header-extra>
              <n-button
                quaternary
                circle
                size="tiny"
                type="error"
                @click.stop="handleDeleteConversation(conversation.id, conversation.title)"
              >
                ×
              </n-button>
            </template>
            <template #description>
              <n-space :size="6" align="center">
                <n-tag size="tiny" type="info">{{ conversation.model }}</n-tag>
                <n-text depth="3" style="font-size: 12px;">
                  {{ formatTime(conversation.updatedAt) }}
                </n-text>
              </n-space>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>

      <n-empty
        v-if="filteredConversations.length === 0 && searchKeyword"
        description="未找到匹配的对话"
        style="margin-top: 40px;"
      />

      <n-empty
        v-else-if="conversations.length === 0"
        description="暂无对话记录"
        style="margin-top: 40px;"
      >
        <template #extra>
          <n-button @click="$emit('new-chat')" type="primary" size="small">
            创建第一个对话
          </n-button>
        </template>
      </n-empty>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NLayout, NLayoutHeader, NLayoutContent,
  NSpace, NText, NInput, NButton, NList, NListItem,
  NThing, NTag, NEmpty
} from 'naive-ui';
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

const searchKeyword = ref('');

function handleDeleteConversation(id: string, title: string) {
  showDeleteConfirm(title, () => {
    emit('delete-conversation', id);
  });
}

const filteredConversations = computed(() => {
  if (!searchKeyword.value.trim()) {
    return props.conversations;
  }

  const keyword = searchKeyword.value.toLowerCase().trim();
  return props.conversations.filter((conv) => {
    const titleMatch = conv.title.toLowerCase().includes(keyword);
    const modelMatch = conv.model.toLowerCase().includes(keyword);
    const messageMatch = conv.messages.some((msg) => msg.content.toLowerCase().includes(keyword));
    return titleMatch || modelMatch || messageMatch;
  });
});
</script>

<style scoped>
.chat-history {
  height: 100%;
}

.history-header {
  padding: 16px;
}

.history-list {
  padding: 8px;
}

.active-item {
  background-color: var(--n-color-hover) !important;
}
</style>
