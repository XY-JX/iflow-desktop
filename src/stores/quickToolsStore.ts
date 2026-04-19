import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CodeSnippet, QuickLink, QuickNote } from '../types';
import { info, error as logError } from '../utils/logger';

export const useQuickToolsStore = defineStore('quickTools', () => {
  // 状态
  const codeSnippets = ref<CodeSnippet[]>([]);
  const quickLinks = ref<QuickLink[]>([]);
  const quickNotes = ref<QuickNote[]>([]);
  const lastSaveTime = ref<number>(0); // 上次保存时间
  const SAVE_THROTTLE = 1000; // 保存节流: 1秒

  // 从 localStorage 加载(仅用于迁移)
  function loadFromStorage() {
    try {
      // 加载代码片段
      const savedSnippets = localStorage.getItem('code_snippets');
      if (savedSnippets) {
        codeSnippets.value = JSON.parse(savedSnippets);
        info('quickToolsStore', `已加载 ${codeSnippets.value.length} 个代码片段`);
      }

      // 加载快速链接
      const savedLinks = localStorage.getItem('quick_links');
      if (savedLinks) {
        quickLinks.value = JSON.parse(savedLinks);
        info('quickToolsStore', `已加载 ${quickLinks.value.length} 个快速链接`);
      }

      // 加载快捷笔记
      const savedNotes = localStorage.getItem('quick_notes');
      if (savedNotes) {
        quickNotes.value = JSON.parse(savedNotes);
        info('quickToolsStore', `已加载 ${quickNotes.value.length} 条快捷笔记`);
      }
    } catch (error) {
      logError('quickToolsStore', '加载快捷工具数据失败:', error);
    }
  }

  // 保存到 localStorage(临时方案,后续迁移到 Rust 后端)
  function saveToStorage() {
    const now = Date.now();
    // 节流: 如果距离上次保存不足 1 秒,跳过
    if (now - lastSaveTime.value < SAVE_THROTTLE) {
      return;
    }

    try {
      localStorage.setItem('code_snippets', JSON.stringify(codeSnippets.value));
      localStorage.setItem('quick_links', JSON.stringify(quickLinks.value));
      localStorage.setItem('quick_notes', JSON.stringify(quickNotes.value));
      lastSaveTime.value = now;
    } catch (error) {
      logError('quickToolsStore', '保存快捷工具数据失败:', error);
    }
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

  function updateNote(index: number, content: string) {
    if (quickNotes.value[index]) {
      quickNotes.value[index].content = content;
      quickNotes.value[index].timestamp = Date.now();
      saveToStorage();
    }
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
    addSnippet,
    deleteSnippet,
    addLink,
    deleteLink,
    addNote,
    updateNote,
    deleteNote,
  };
});
