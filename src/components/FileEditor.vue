<template>
  <div class="file-editor" v-if="file">
    <div class="editor-header">
      <div class="file-info">
        <span class="file-icon">📄</span>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-path">{{ file.path }}</span>
      </div>
      <div class="editor-actions">
        <button
          class="action-btn"
          @click="saveFile"
          :disabled="!hasChanges"
          :class="{ active: hasChanges }"
        >
          💾 保存
        </button>
        <button class="action-btn close-btn" @click="$emit('close')">
          ✕ 关闭
        </button>
      </div>
    </div>
    <div class="editor-content">
      <textarea
        v-model="content"
        @input="hasChanges = true"
        placeholder="文件内容..."
        spellcheck="false"
      ></textarea>
    </div>
  </div>
  <div class="empty-state" v-else>
    <p>请从文件浏览器中选择一个文件进行编辑</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { FileItem } from '../types';

const props = defineProps<{
  file: FileItem | null;
}>();

const emit = defineEmits<{
  'close': [];
  'saved': [];
}>();

const content = ref('');
const hasChanges = ref(false);

async function loadFile() {
  if (props.file && !props.file.isDirectory) {
    try {
      content.value = await readTextFile(props.file.path);
      hasChanges.value = false;
    } catch (error) {
      console.error('读取文件失败:', error);
      content.value = '';
    }
  }
}

async function saveFile() {
  if (props.file && !props.file.isDirectory && hasChanges.value) {
    try {
      await writeTextFile(props.file.path, content.value);
      hasChanges.value = false;
      emit('saved');
    } catch (error) {
      console.error('保存文件失败:', error);
    }
  }
}

watch(() => props.file, () => {
  loadFile();
}, { immediate: true });
</script>

<style scoped>
.file-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, white);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.file-icon {
  font-size: 18px;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #333);
  white-space: nowrap;
}

.file-path {
  font-size: 12px;
  color: var(--text-secondary, #666);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #ddd);
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-hover, #f0f0f0);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.active {
  background: var(--primary-color, #4a90e2);
  color: white;
  border-color: var(--primary-color, #4a90e2);
}

.close-btn {
  color: var(--text-secondary, #666);
}

.close-btn:hover {
  background: #fee;
  color: #d32f2f;
}

.editor-content {
  flex: 1;
  overflow: hidden;
}

.editor-content textarea {
  width: 100%;
  height: 100%;
  border: none;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  background: var(--bg-primary, white);
  color: var(--text-primary, #333);
}

.editor-content textarea:focus {
  outline: none;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #999);
  font-size: 14px;
}

@media (prefers-color-scheme: dark) {
  .file-editor {
    background: var(--bg-primary, #1a1a1a);
  }

  .editor-header {
    background: var(--bg-secondary, #2d2d2d);
    border-bottom-color: var(--border-color, #404040);
  }

  .file-name {
    color: var(--text-primary, #f0f0f0);
  }

  .file-path {
    color: var(--text-secondary, #aaa);
  }

  .action-btn {
    background: var(--bg-primary, #252525);
    border-color: var(--border-color, #404040);
    color: var(--text-primary, #f0f0f0);
  }

  .action-btn:hover:not(:disabled) {
    background: var(--bg-hover, #3d3d3d);
  }

  .action-btn.active {
    background: var(--primary-color, #4a90e2);
    color: white;
    border-color: var(--primary-color, #4a90e2);
  }

  .close-btn {
    color: var(--text-secondary, #aaa);
  }

  .close-btn:hover {
    background: #5a2a2a;
    color: #ff6b6b;
  }

  .editor-content textarea {
    background: var(--bg-primary, #1a1a1a);
    color: var(--text-primary, #f0f0f0);
  }

  .empty-state {
    color: var(--text-secondary, #777);
  }
}
</style>