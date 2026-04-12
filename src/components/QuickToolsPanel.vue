<template>
  <div class="quick-tools-panel">
    <!-- Tab 切换 -->
    <div class="tools-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('tab-change', tab.id)"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- TOTP 验证码 -->
    <div v-if="activeTab === 'totp'" class="tool-content totp-tab">
      <TOTPPanel />
    </div>

    <!-- 代码片段 -->
    <div v-if="activeTab === 'snippets'" class="tool-content">
      <div class="tool-header">
        <span>💾 常用代码片段</span>
        <button @click="$emit('add-snippet')" class="btn-add-small" title="添加新片段">+</button>
      </div>
      <div class="snippets-list">
        <div v-for="(snippet, index) in snippets" :key="index" class="snippet-item">
          <div class="snippet-header">
            <span class="snippet-name">{{ snippet.name }}</span>
            <div class="snippet-actions">
              <button @click="$emit('copy-snippet', snippet.code)" class="btn-icon" title="复制">
                📋
              </button>
              <button @click="$emit('delete-snippet', index)" class="btn-icon" title="删除">
                🗑️
              </button>
            </div>
          </div>
          <pre class="snippet-code"
            >{{ snippet.code.substring(0, 100) }}{{ snippet.code.length > 100 ? '...' : '' }}</pre
          >
        </div>
        <div v-if="snippets.length === 0" class="empty-state">
          <p>暂无代码片段</p>
          <p class="hint">点击 + 添加常用代码</p>
        </div>
      </div>
    </div>

    <!-- 快速链接 -->
    <div v-if="activeTab === 'links'" class="tool-content">
      <div class="tool-header">
        <span>🔗 快速链接</span>
        <button @click="$emit('add-link')" class="btn-add-small" title="添加链接">+</button>
      </div>
      <div class="links-list">
        <a
          v-for="(link, index) in links"
          :key="index"
          :href="link.url"
          target="_blank"
          class="link-item"
        >
          <span class="link-icon">{{ link.icon }}</span>
          <div class="link-info">
            <span class="link-name">{{ link.name }}</span>
            <span class="link-url">{{ link.url }}</span>
          </div>
          <button @click.prevent="$emit('delete-link', index)" class="btn-icon-delete" title="删除">
            ×
          </button>
        </a>
        <div v-if="links.length === 0" class="empty-state">
          <p>暂无收藏链接</p>
          <p class="hint">点击 + 添加常用网站</p>
        </div>
      </div>
    </div>

    <!-- 快捷笔记 -->
    <div v-if="activeTab === 'notes'" class="tool-content">
      <div class="tool-header">
        <span>📝 快捷笔记</span>
        <button @click="$emit('add-note')" class="btn-add-small" title="添加笔记">+</button>
      </div>
      <div class="notes-list">
        <div v-for="(note, index) in notes" :key="index" class="note-item">
          <textarea
            v-model="note.content"
            @input="$emit('save-notes')"
            class="note-textarea"
            placeholder="输入笔记内容..."
            rows="3"
          ></textarea>
          <div class="note-footer">
            <span class="note-time">{{ formatTime(note.timestamp) }}</span>
            <button @click="$emit('delete-note', index)" class="btn-icon" title="删除">🗑️</button>
          </div>
        </div>
        <div v-if="notes.length === 0" class="empty-state">
          <p>暂无笔记</p>
          <p class="hint">点击 + 添加临时笔记</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import TOTPPanel from './TOTPPanel.vue';
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

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;

    return date.toLocaleDateString();
  }
</script>

<style scoped>
  .quick-tools-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .tools-tabs {
    display: flex;
    gap: 4px;
    padding: 8px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .tab-btn {
    flex: 1;
    padding: 6px 8px;
    background: transparent;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-secondary, #666);
  }

  .tab-btn:hover {
    background: var(--bg-hover, #f0f0f0);
  }

  .tab-btn.active {
    background: var(--primary-color, #4a90e2);
    color: white;
  }

  .tool-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  .btn-add-small {
    width: 24px;
    height: 24px;
    border: 1px solid var(--border-color, #ddd);
    background: white;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-add-small:hover {
    background: var(--primary-color, #4a90e2);
    color: white;
    border-color: var(--primary-color, #4a90e2);
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

  .snippet-item {
    padding: 10px;
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 6px;
    border: 1px solid var(--border-color, #e0e0e0);
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
    color: var(--text-primary, #333);
  }

  .snippet-actions {
    display: flex;
    gap: 4px;
  }

  .btn-icon {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
  }

  .btn-icon:hover {
    background: var(--bg-hover, #f0f0f0);
  }

  .snippet-code {
    margin: 0;
    padding: 8px;
    background: var(--code-bg, #1e1e1e);
    color: var(--code-text, #d4d4d4);
    border-radius: 4px;
    font-size: 11px;
    font-family: 'Consolas', 'Monaco', monospace;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .link-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 6px;
    text-decoration: none;
    transition: all 0.2s;
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .link-item:hover {
    background: var(--bg-hover, #f0f0f0);
    transform: translateX(2px);
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
    color: var(--text-primary, #333);
  }

  .link-url {
    font-size: 11px;
    color: var(--text-secondary, #666);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .btn-icon-delete {
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--text-secondary, #999);
    font-size: 16px;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .btn-icon-delete:hover {
    background: #fee;
    color: #d32f2f;
  }

  .note-item {
    padding: 10px;
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 6px;
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .note-textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
    background: white;
    color: var(--text-primary, #333);
    margin-bottom: 8px;
  }

  .note-textarea:focus {
    outline: none;
    border-color: var(--primary-color, #4a90e2);
  }

  .note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .note-time {
    font-size: 11px;
    color: var(--text-secondary, #999);
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-secondary, #999);
  }

  .empty-state p {
    margin: 4px 0;
  }

  .empty-state .hint {
    font-size: 12px;
    color: var(--text-secondary, #bbb);
  }
</style>
