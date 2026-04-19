<template>
  <div class="quick-tools-panel">
    <!-- Tab 切换 -->
    <div class="tools-tabs">
      <n-button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('tab-change', tab.id)"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        size="small"
        :type="activeTab === tab.id ? 'primary' : 'default'"
        quaternary
      >
        {{ tab.icon }} {{ tab.label }}
      </n-button>
    </div>

    <!-- TOTP 验证码 -->
    <div v-if="activeTab === 'totp'" class="tool-content totp-tab">
      <TOTPPanel />
    </div>

    <!-- 代码片段 -->
    <div v-if="activeTab === 'snippets'" class="tool-content">
      <div class="tool-header">
        <span>💾 常用代码片段</span>
        <n-button @click="$emit('add-snippet')" size="tiny" circle title="添加新片段">+</n-button>
      </div>
      <div class="snippets-list">
        <n-card v-for="(snippet, index) in snippets" :key="index" class="snippet-item" size="small" hoverable>
          <template #header>
            <div class="snippet-header">
              <span class="snippet-name">{{ snippet.name }}</span>
              <div class="snippet-actions">
                <n-button @click="$emit('copy-snippet', snippet.code)" size="tiny" quaternary title="复制">
                  📋
                </n-button>
                <n-button @click="$emit('delete-snippet', index)" size="tiny" quaternary type="error" title="删除">
                  🗑️
                </n-button>
              </div>
            </div>
          </template>
          <pre class="snippet-code"
            >{{ snippet.code.substring(0, 100) }}{{ snippet.code.length > 100 ? '...' : '' }}</pre
          >
        </n-card>
        <n-empty v-if="snippets.length === 0" description="暂无代码片段">
          <template #extra>
            <n-text depth="3" style="font-size: 12px">点击 + 添加常用代码</n-text>
          </template>
        </n-empty>
      </div>
    </div>

    <!-- 快速链接 -->
    <div v-if="activeTab === 'links'" class="tool-content">
      <div class="tool-header">
        <span>🔗 快速链接</span>
        <n-button @click="$emit('add-link')" size="tiny" circle title="添加链接">+</n-button>
      </div>
      <div class="links-list">
        <n-card
          v-for="(link, index) in links"
          :key="index"
          class="link-item"
          size="small"
          hoverable
          @click="openLink(link.url)"
          style="cursor: pointer;"
        >
          <div class="link-content">
            <span class="link-icon">{{ link.icon }}</span>
            <div class="link-info">
              <span class="link-name">{{ link.name }}</span>
              <span class="link-url">{{ link.url }}</span>
            </div>
          </div>
          <template #action>
            <n-button @click.stop="$emit('delete-link', index)" size="tiny" text type="error" title="删除">
              ×
            </n-button>
          </template>
        </n-card>
        <n-empty v-if="links.length === 0" description="暂无收藏链接">
          <template #extra>
            <n-text depth="3" style="font-size: 12px">点击 + 添加常用网站</n-text>
          </template>
        </n-empty>
      </div>
    </div>

    <!-- 快捷笔记 -->
    <div v-if="activeTab === 'notes'" class="tool-content">
      <div class="tool-header">
        <span>📝 快捷笔记</span>
        <n-button @click="$emit('add-note')" size="tiny" circle title="添加笔记">+</n-button>
      </div>
      <div class="notes-list">
        <n-card v-for="(note, index) in notes" :key="index" class="note-item" size="small">
          <n-input
            v-model:value="note.content"
            @update:value="$emit('save-notes')"
            type="textarea"
            class="note-textarea"
            placeholder="输入笔记内容..."
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
          <template #action>
            <div class="note-footer">
              <span class="note-time">{{ formatTime(note.timestamp) }}</span>
              <n-button @click="$emit('delete-note', index)" size="tiny" quaternary type="error" title="删除">🗑️</n-button>
            </div>
          </template>
        </n-card>
        <n-empty v-if="notes.length === 0" description="暂无笔记">
          <template #extra>
            <n-text depth="3" style="font-size: 12px">点击 + 添加临时笔记</n-text>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { NButton, NInput, NCard, NEmpty, NText } from 'naive-ui';
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
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .tools-tabs {
    padding: 8px;
  }

  .tool-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .snippets-list,
  .links-list,
  .notes-list,
  .totp-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .totp-container {
    height: calc(100vh - 250px);
    min-height: 400px;
  }

  .snippet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .snippet-name {
    font-size: 13px;
    font-weight: 600;
  }

  .snippet-actions {
    display: flex;
    gap: 4px;
  }

  .snippet-code {
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    overflow-x: auto;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    background: var(--n-code-color);
    color: var(--n-code-text-color);
  }

  .link-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .link-icon {
    font-size: 18px;
  }

  .link-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .link-name {
    font-size: 13px;
    font-weight: 600;
  }

  .link-url {
    font-size: 11px;
    color: var(--n-text-color-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .note-time {
    font-size: 11px;
    color: var(--n-text-color-3);
  }
</style>
