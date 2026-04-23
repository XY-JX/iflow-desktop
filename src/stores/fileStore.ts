import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { FileItem } from '../types';

export const useFileStore = defineStore('file', () => {
  const selectedFile = ref<FileItem | null>(null);

  function selectFile(file: FileItem | null) {
    selectedFile.value = file;
  }

  function clearSelection() {
    selectedFile.value = null;
  }

  return {
    selectedFile,
    selectFile,
    clearSelection,
  };
});
