<template>
  <NTabs :value="activeTab" @update:value="$emit('tab-change', $event)" type="line" style="height: 100%;">
    <!-- TOTP -->
    <NTabPane name="totp" tab="🔐 验证码">
      <TOTPPanel />
    </NTabPane>

    <!-- 代码片段 -->
    <NTabPane name="snippets" tab="💾 代码片段">
      <NScrollbar style="max-height: calc(100vh - 200px);">
        <NSpace vertical :size="12" style="padding: 12px;">
          <NSpace justify="space-between" align="center">
            <NText strong>💾 常用代码片段</NText>
            <NButton @click="$emit('add-snippet')" size="tiny" circle title="添加新片段">+</NButton>
          </NSpace>
          <NSpace vertical :size="8">
            <NCard v-for="(snippet, index) in snippets" :key="index" size="small" hoverable>
              <template #header>
                <NSpace justify="space-between" align="center">
                  <NText strong style="font-size: 13px;">{{ snippet.name }}</NText>
                  <NSpace :size="4">
                    <NButton @click="$emit('copy-snippet', snippet.code)" size="tiny" quaternary title="复制">📋</NButton>
                    <NButton @click="$emit('delete-snippet', index)" size="tiny" quaternary type="error" title="删除">🗑️</NButton>
                  </NSpace>
                </NSpace>
              </template>
              <NText code style="font-size: 12px; word-break: break-all; white-space: pre-wrap;">
                {{ snippet.code.substring(0, 100) }}{{ snippet.code.length > 100 ? '...' : '' }}
              </NText>
            </NCard>
            <NEmpty v-if="snippets.length === 0" description="暂无代码片段">
              <template #extra>
                <NText depth="3" style="font-size: 12px">点击 + 添加常用代码</NText>
              </template>
            </NEmpty>
          </NSpace>
        </NSpace>
      </NScrollbar>
    </NTabPane>

    <!-- 快速链接 -->
    <NTabPane name="links" tab="🔗 快速链接">
      <NScrollbar style="max-height: calc(100vh - 200px);">
        <NSpace vertical :size="12" style="padding: 12px;">
          <NSpace justify="space-between" align="center">
            <NText strong>🔗 快速链接</NText>
            <NButton @click="$emit('add-link')" size="tiny" circle title="添加链接">+</NButton>
          </NSpace>
          <NSpace vertical :size="8">
            <NCard
              v-for="(link, index) in links"
              :key="index"
              size="small"
              hoverable
              @click="openLink(link.url)"
              style="cursor: pointer;"
            >
              <NSpace align="center" :size="8">
                <span style="font-size: 18px;">{{ link.icon }}</span>
                <div style="flex: 1; overflow: hidden;">
                  <NText strong style="font-size: 13px; display: block;">{{ link.name }}</NText>
                  <NText depth="3" style="font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;">
                    {{ link.url }}
                  </NText>
                </div>
              </NSpace>
              <template #action>
                <NButton @click.stop="$emit('delete-link', index)" size="tiny" text type="error" title="删除">×</NButton>
              </template>
            </NCard>
            <NEmpty v-if="links.length === 0" description="暂无收藏链接">
              <template #extra>
                <NText depth="3" style="font-size: 12px">点击 + 添加常用网站</NText>
              </template>
            </NEmpty>
          </NSpace>
        </NSpace>
      </NScrollbar>
    </NTabPane>

    <!-- 快捷笔记 -->
    <NTabPane name="notes" tab="📝 快捷笔记">
      <NScrollbar style="max-height: calc(100vh - 200px);">
        <NSpace vertical :size="12" style="padding: 12px;">
          <NSpace justify="space-between" align="center">
            <NText strong>📝 快捷笔记</NText>
            <NButton @click="$emit('add-note')" size="tiny" circle title="添加笔记">+</NButton>
          </NSpace>
          <NSpace vertical :size="8">
            <NCard v-for="(note, index) in notes" :key="index" size="small">
              <NInput
                v-model:value="note.content"
                @update:value="$emit('save-notes')"
                type="textarea"
                placeholder="输入笔记内容..."
                :autosize="{ minRows: 3, maxRows: 6 }"
              />
              <template #action>
                <NSpace justify="space-between" align="center">
                  <NText depth="3" style="font-size: 11px;">{{ formatTime(note.timestamp) }}</NText>
                  <NButton @click="$emit('delete-note', index)" size="tiny" quaternary type="error" title="删除">🗑️</NButton>
                </NSpace>
              </template>
            </NCard>
            <NEmpty v-if="notes.length === 0" description="暂无笔记">
              <template #extra>
                <NText depth="3" style="font-size: 12px">点击 + 添加临时笔记</NText>
              </template>
            </NEmpty>
          </NSpace>
        </NSpace>
      </NScrollbar>
    </NTabPane>
  </NTabs>
</template>

<script setup lang="ts">
import { NButton, NInput, NCard, NEmpty, NText, NSpace, NTabs, NTabPane, NScrollbar } from 'naive-ui';
import TOTPPanel from './TOTPPanel.vue';
import { formatTime } from '../utils/common';
import type { CodeSnippet, QuickLink, QuickNote } from '../types';

defineProps<{
  activeTab: string;
  tabs: Array<{ id: string; icon: string; label: string }>;
  snippets: CodeSnippet[];
  links: QuickLink[];
  notes: QuickNote[];
}>();

defineEmits<{
  'tab-change': [tabId: string];
  'add-snippet': [];
  'copy-snippet': [code: string];
  'delete-snippet': [index: number];
  'add-link': [];
  'delete-link': [index: number];
  'add-note': [];
  'save-notes': [];
  'delete-note': [index: number];
}>();

const openLink = (url: string) => {
  window.open(url, '_blank');
};
</script>
