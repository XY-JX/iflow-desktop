<template>
  <div class="quick-tools-panel">
    <!-- Tab 切换 -->
    <div class="panel-tabs">
      <n-button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('tab-change', tab.id)"
        size="small"
        :type="activeTab === tab.id ? 'primary' : 'default'"
        quaternary
      >
        {{ tab.icon }} {{ tab.label }}
      </n-button>
    </div>

    <!-- TOTP: 直接渲染，自己管理布局 -->
    <TOTPPanel v-if="activeTab === 'totp'" class="panel-body" />

    <!-- 其他 Tab: 包在可滚动容器中 -->
    <div v-else class="panel-body panel-scroll">
      <!-- 代码片段 -->
      <template v-if="activeTab === 'snippets'">
        <n-space justify="space-between" align="center" style="margin-bottom: 12px;">
          <n-text strong>💾 常用代码片段</n-text>
          <n-button @click="$emit('add-snippet')" size="tiny" circle title="添加新片段">+</n-button>
        </n-space>
        <n-space vertical :size="8">
          <n-card v-for="(snippet, index) in snippets" :key="index" size="small" hoverable>
            <template #header>
              <n-space justify="space-between" align="center">
                <n-text strong style="font-size: 13px;">{{ snippet.name }}</n-text>
                <n-space :size="4">
                  <n-button @click="$emit('copy-snippet', snippet.code)" size="tiny" quaternary title="复制">📋</n-button>
                  <n-button @click="$emit('delete-snippet', index)" size="tiny" quaternary type="error" title="删除">🗑️</n-button>
                </n-space>
              </n-space>
            </template>
            <n-text code style="font-size: 12px; word-break: break-all; white-space: pre-wrap;">
              {{ snippet.code.substring(0, 100) }}{{ snippet.code.length > 100 ? '...' : '' }}
            </n-text>
          </n-card>
          <n-empty v-if="snippets.length === 0" description="暂无代码片段">
            <template #extra>
              <n-text depth="3" style="font-size: 12px">点击 + 添加常用代码</n-text>
            </template>
          </n-empty>
        </n-space>
      </template>

      <!-- 快速链接 -->
      <template v-if="activeTab === 'links'">
        <n-space justify="space-between" align="center" style="margin-bottom: 12px;">
          <n-text strong>🔗 快速链接</n-text>
          <n-button @click="$emit('add-link')" size="tiny" circle title="添加链接">+</n-button>
        </n-space>
        <n-space vertical :size="8">
          <n-card
            v-for="(link, index) in links"
            :key="index"
            size="small"
            hoverable
            @click="openLink(link.url)"
            style="cursor: pointer;"
          >
            <n-space align="center" :size="8">
              <span style="font-size: 18px;">{{ link.icon }}</span>
              <div style="flex: 1; overflow: hidden;">
                <n-text strong style="font-size: 13px; display: block;">{{ link.name }}</n-text>
                <n-text depth="3" style="font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;">
                  {{ link.url }}
                </n-text>
              </div>
            </n-space>
            <template #action>
              <n-button @click.stop="$emit('delete-link', index)" size="tiny" text type="error" title="删除">×</n-button>
            </template>
          </n-card>
          <n-empty v-if="links.length === 0" description="暂无收藏链接">
            <template #extra>
              <n-text depth="3" style="font-size: 12px">点击 + 添加常用网站</n-text>
            </template>
          </n-empty>
        </n-space>
      </template>

      <!-- 快捷笔记 -->
      <template v-if="activeTab === 'notes'">
        <n-space justify="space-between" align="center" style="margin-bottom: 12px;">
          <n-text strong>📝 快捷笔记</n-text>
          <n-button @click="$emit('add-note')" size="tiny" circle title="添加笔记">+</n-button>
        </n-space>
        <n-space vertical :size="8">
          <n-card v-for="(note, index) in notes" :key="index" size="small">
            <n-input
              v-model:value="note.content"
              @update:value="$emit('save-notes')"
              type="textarea"
              placeholder="输入笔记内容..."
              :autosize="{ minRows: 3, maxRows: 6 }"
            />
            <template #action>
              <n-space justify="space-between" align="center">
                <n-text depth="3" style="font-size: 11px;">{{ formatTime(note.timestamp) }}</n-text>
                <n-button @click="$emit('delete-note', index)" size="tiny" quaternary type="error" title="删除">🗑️</n-button>
              </n-space>
            </template>
          </n-card>
          <n-empty v-if="notes.length === 0" description="暂无笔记">
            <template #extra>
              <n-text depth="3" style="font-size: 12px">点击 + 添加临时笔记</n-text>
            </template>
          </n-empty>
        </n-space>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NCard, NEmpty, NText, NSpace } from 'naive-ui';
import TOTPPanel from './TOTPPanel.vue';
import { formatTime } from '../utils/common';
import type { CodeSnippet, QuickLink, QuickNote } from '../types';

const props = defineProps<{
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

<style scoped>
.quick-tools-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-tabs {
  padding: 8px;
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

/* 内容区：占满剩余空间 */
.panel-body {
  flex: 1;
  min-height: 0;
}

/* 非 TOTP tab：带 padding 和滚动 */
.panel-scroll {
  overflow-y: auto;
  padding: 12px;
}
</style>
