import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { FileItem } from '../types';

export const useFileStore = defineStore('file', () => {
  // 状态
  const selectedFile = ref<FileItem | null>(null);
  const currentDirectory = ref<string>('');

  // 方法
  function selectFile(file: FileItem | null) {
    selectedFile.value = file;
  }

  function setDirectory(path: string) {
    currentDirectory.value = path;
  }

  function clearSelection() {
    selectedFile.value = null;
  }

  return {
    // 状态
    selectedFile,
    currentDirectory,
    // 方法
    selectFile,
    setDirectory,
    clearSelection,
  };
});
