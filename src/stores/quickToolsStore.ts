import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CodeSnippet, QuickLink, QuickNote } from '../types';
import { info, error as logError } from '../utils/logger';
import { STORAGE_KEYS } from '../constants';

export const useQuickToolsStore = defineStore('quickTools', () => {
  // 状态
  const codeSnippets = ref<CodeSnippet[]>([]);
  const quickLinks = ref<QuickLink[]>([]);
  const quickNotes = ref<QuickNote[]>([]);
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const SAVE_DEBOUNCE = 500; // 保存防抖: 500ms

  // 从 localStorage 加载(仅用于迁移)
  function loadFromStorage() {
    try {
      // 加载代码片段
      const savedSnippets = localStorage.getItem(STORAGE_KEYS.CODE_SNIPPETS);
      if (savedSnippets) {
        codeSnippets.value = JSON.parse(savedSnippets);
        info('quickToolsStore', `已加载 ${codeSnippets.value.length} 个代码片段`);
      }

      // 加载快速链接
      const savedLinks = localStorage.getItem(STORAGE_KEYS.QUICK_LINKS);
      if (savedLinks) {
        quickLinks.value = JSON.parse(savedLinks);
        info('quickToolsStore', `已加载 ${quickLinks.value.length} 个快速链接`);
      }

      // 加载快捷笔记
      const savedNotes = localStorage.getItem(STORAGE_KEYS.QUICK_NOTES);
      if (savedNotes) {
        quickNotes.value = JSON.parse(savedNotes);
        info('quickToolsStore', `已加载 ${quickNotes.value.length} 条快捷笔记`);
      }
    } catch (error) {
      logError('quickToolsStore', '加载快捷工具数据失败:', error);
    }
  }

  // 实际执行保存
  function doSave() {
    try {
      localStorage.setItem(STORAGE_KEYS.CODE_SNIPPETS, JSON.stringify(codeSnippets.value));
      localStorage.setItem(STORAGE_KEYS.QUICK_LINKS, JSON.stringify(quickLinks.value));
      localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, JSON.stringify(quickNotes.value));
    } catch (error) {
      logError('quickToolsStore', '保存快捷工具数据失败:', error);
    }
  }

  // 保存到 localStorage (带防抖，确保最后一次保存被执行)
  function saveToStorage() {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => {
      saveTimer = null;
      doSave();
    }, SAVE_DEBOUNCE);
  }

  // 立即保存（用于页面卸载等场景）
  function saveToStorageImmediate() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    doSave();
  }

  // 代码片段操作
  function addSnippet(name: string, code: string) {
    codeSnippets.value.unshift({ name, code });
    saveToStorage();
  }

  function deleteSnippet(index: number) {
    codeSnippets.value.splice(index, 1);
    saveToStorage();
  }

  // 快速链接操作
  function addLink(name: string, url: string, icon: string = '🔗') {
    quickLinks.value.push({ name, url, icon });
    saveToStorage();
  }

  function deleteLink(index: number) {
    quickLinks.value.splice(index, 1);
    saveToStorage();
  }

  // 快捷笔记操作
  function addNote(content: string = '') {
    quickNotes.value.unshift({
      content,
      timestamp: Date.now(),
    });
    saveToStorage();
  }

  function deleteNote(index: number) {
    quickNotes.value.splice(index, 1);
    saveToStorage();
  }

  return {
    // 状态
    codeSnippets,
    quickLinks,
    quickNotes,
    // 方法
    loadFromStorage,
    saveToStorage,
    saveToStorageImmediate,
    addSnippet,
    deleteSnippet,
    addLink,
    deleteLink,
    addNote,
    deleteNote,
  };
});
