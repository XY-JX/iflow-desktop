<template>
  <NLayout style="height: 100%;">
    <NLayoutHeader bordered style="padding: 16px;">
      <NSpace vertical :size="12">
        <NSpace justify="space-between" align="center">
          <NText strong>对话历史</NText>
          <NButton type="primary" size="small" @click="$emit('new-chat')">
            + 新建
          </NButton>
        </NSpace>
        <NInput
          v-model:value="searchKeyword"
          placeholder="搜索对话..."
          clearable
          size="small"
        />
      </NSpace>
    </NLayoutHeader>

    <NLayoutContent style="padding: 8px;">
      <NList hoverable clickable>
        <NListItem
          v-for="conversation in filteredConversations"
          :key="conversation.id"
          :style="activeConversationId === conversation.id ? { backgroundColor: 'var(--n-color-hover)' } : undefined"
          @click="$emit('select-conversation', conversation.id)"
        >
          <NThing>
            <template #header>
              <NText depth="1" style="font-size: 14px;">{{ conversation.title }}</NText>
            </template>
            <template #header-extra>
              <NButton
                quaternary
                circle
                size="tiny"
                type="error"
                @click.stop="handleDeleteConversation(conversation.id, conversation.title)"
              >
                ×
              </NButton>
            </template>
            <template #description>
              <NSpace :size="6" align="center">
                <NTag size="tiny" type="info">{{ conversation.model }}</NTag>
                <NText depth="3" style="font-size: 12px;">
                  {{ formatTime(conversation.updatedAt) }}
                </NText>
              </NSpace>
            </template>
          </NThing>
        </NListItem>
      </NList>

      <NEmpty
        v-if="filteredConversations.length === 0 && searchKeyword"
        description="未找到匹配的对话"
        style="margin-top: 40px;"
      />

      <NEmpty
        v-else-if="conversations.length === 0"
        description="暂无对话记录"
        style="margin-top: 40px;"
      >
        <template #extra>
          <NButton @click="$emit('new-chat')" type="primary" size="small">
            创建第一个对话
          </NButton>
        </template>
      </NEmpty>
    </NLayoutContent>
  </NLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
const debouncedKeyword = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 防抖处理搜索关键词
watch(searchKeyword, (newVal) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debouncedKeyword.value = newVal;
    debounceTimer = null;
  }, 200);
});

function handleDeleteConversation(id: string, title: string) {
  showDeleteConfirm(title, () => {
    emit('delete-conversation', id);
  });
}

const filteredConversations = computed(() => {
  if (!debouncedKeyword.value.trim()) {
    return props.conversations;
  }

  const keyword = debouncedKeyword.value.toLowerCase().trim();
  return props.conversations.filter((conv) => {
    const titleMatch = conv.title.toLowerCase().includes(keyword);
    const modelMatch = conv.model.toLowerCase().includes(keyword);
    const messageMatch = conv.messages.some((msg) => msg.content.toLowerCase().includes(keyword));
    return titleMatch || modelMatch || messageMatch;
  });
});
</script>
