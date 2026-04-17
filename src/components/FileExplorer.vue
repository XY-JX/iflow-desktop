<template>
  <div class="file-explorer">
    <div class="explorer-header">
      <h3>文件浏览器</h3>
      <button class="select-dir-btn" @click="selectDirectory">📁 选择目录</button>
    </div>
    <div class="path-bar" v-if="currentPath">
      <span class="path-label">路径:</span>
      <span class="path-text">{{ currentPath }}</span>
    </div>
    <div class="file-list" v-if="files.length > 0">
      <div
        v-for="file in files"
        :key="file.path"
        class="file-item"
        :class="{ isDirectory: file.isDirectory }"
        @click="handleFileClick(file)"
      >
        <span class="file-icon">
          {{ file.isDirectory ? '📁' : '📄' }}
        </span>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-meta" v-if="!file.isDirectory && file.size">
          {{ formatFileSize(file.size) }}
        </span>
      </div>
    </div>
    <div class="empty-state" v-else-if="currentPath">
      <p>此目录为空</p>
    </div>
    <div class="empty-state" v-else>
      <p>请选择一个目录开始浏览</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { open } from '@tauri-apps/plugin-dialog';
  import { readDir } from '@tauri-apps/plugin-fs';
  import { error as logError } from '../utils/logger';
  import { formatFileSize } from '../utils/common';
  import type { FileItem } from '../types';

  const emit = defineEmits<{
    'file-selected': [file: FileItem];
  }>();

  const currentPath = ref<string>('');
  const files = ref<FileItem[]>([]);

  async function selectDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择目录',
      });

      if (selected && typeof selected === 'string') {
        currentPath.value = selected;
        await loadFiles(selected);
      }
    } catch (error) {
      logError('FileExplorer', '选择目录失败:', error);
    }
  }

  async function loadFiles(path: string) {
    try {
      const entries = await readDir(path);
      files.value = entries
        .map((entry) => {
          const entryData = entry as any;
          return {
            name: entry.name,
            path: entryData.path || `${path}/${entry.name}`,
            isDirectory: !!entryData.children,
            size: entryData.metadata?.size,
            modifiedTime: entryData.metadata?.modified?.getTime(),
          };
        })
        .sort((a, b) => {
          // 目录排在前面
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          // 然后按名称排序
          return a.name.localeCompare(b.name);
        });
    } catch (error) {
      logError('FileExplorer', '加载文件列表失败:', error);
      files.value = [];
    }
  }

  function handleFileClick(file: FileItem) {
    if (!file.isDirectory) {
      emit('file-selected', file);
    } else {
      loadFiles(file.path);
      currentPath.value = file.path;
    }
  }
</script>

<style scoped>
  .file-explorer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-secondary, #f8f9fa);
    border-left: 1px solid var(--border-color, #e0e0e0);
  }

  .explorer-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .explorer-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  .select-dir-btn {
    padding: 8px 12px;
    background: var(--primary-color, #4a90e2);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .select-dir-btn:hover {
    background: var(--primary-hover, #357abd);
  }

  .path-bar {
    padding: 12px 16px;
    background: var(--bg-tertiary, #f0f0f0);
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    font-size: 13px;
  }

  .path-label {
    font-weight: 600;
    color: var(--text-secondary, #666);
    margin-right: 8px;
  }

  .path-text {
    color: var(--text-primary, #333);
    word-break: break-all;
  }

  .file-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    margin-bottom: 4px;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .file-item:hover {
    background: var(--bg-hover, #f0f0f0);
  }

  .file-item.isDirectory {
    font-weight: 500;
  }

  .file-icon {
    margin-right: 10px;
    font-size: 16px;
  }

  .file-name {
    flex: 1;
    font-size: 14px;
    color: var(--text-primary, #333);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-meta {
    font-size: 12px;
    color: var(--text-secondary, #999);
    margin-left: 8px;
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary, #999);
    font-size: 14px;
  }

  @media (prefers-color-scheme: dark) {
    .file-explorer {
      background: var(--bg-secondary, #2d2d2d);
      border-left-color: var(--border-color, #404040);
    }

    .explorer-header h3 {
      color: var(--text-primary, #f0f0f0);
    }

    .path-bar {
      background: var(--bg-tertiary, #1f1f1f);
      border-bottom-color: var(--border-color, #404040);
    }

    .path-label {
      color: var(--text-secondary, #aaa);
    }

    .path-text {
      color: var(--text-primary, #f0f0f0);
    }

    .file-item {
      background: var(--bg-primary, #252525);
    }

    .file-item:hover {
      background: var(--bg-hover, #3d3d3d);
    }

    .file-name {
      color: var(--text-primary, #f0f0f0);
    }

    .file-meta {
      color: var(--text-secondary, #777);
    }

    .empty-state {
      color: var(--text-secondary, #777);
    }
  }
</style>
