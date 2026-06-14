<template>
  <NCard v-if="file" size="small" :bordered="false">
    <template #header>
      <NSpace align="center" :size="8">
        <span style="font-size: 18px;">📄</span>
        <NText strong>{{ file.name }}</NText>
        <NText depth="3" style="font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          {{ file.path }}
        </NText>
      </NSpace>
    </template>
    <template #header-extra>
      <NSpace :size="8">
        <NButton
          type="primary"
          size="small"
          @click="saveFile"
          :disabled="!hasChanges"
        >
          💾 保存
        </NButton>
        <NButton size="small" quaternary @click="$emit('close')">✕ 关闭</NButton>
      </NSpace>
    </template>

    <NInput
      v-model:value="content"
      @update:value="hasChanges = true"
      type="textarea"
      placeholder="文件内容..."
      :autosize="false"
      spellcheck="false"
      style="height: calc(100vh - 200px);"
      input-style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 14px; line-height: 1.6;"
    />
  </NCard>
  <NEmpty v-else description="请从文件浏览器中选择一个文件进行编辑" />
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { NButton, NInput, NEmpty, NCard, NSpace, NText } from 'naive-ui';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import { error as logError } from '../utils/logger';
  import type { FileItem } from '../types';

  const props = defineProps<{
    file: FileItem | null;
  }>();

  const emit = defineEmits<{
    close: [];
    saved: [];
  }>();

  const content = ref('');
  const hasChanges = ref(false);

  async function loadFile() {
    if (props.file && !props.file.isDirectory) {
      try {
        content.value = await readTextFile(props.file.path);
        hasChanges.value = false;
      } catch (error) {
        logError('FileEditor', '读取文件失败:', error);
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
        logError('FileEditor', '保存文件失败:', error);
      }
    }
  }

  watch(
    () => props.file,
    () => {
      loadFile();
    },
    { immediate: true },
  );
</script>
