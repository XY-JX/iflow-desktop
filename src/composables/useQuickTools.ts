/**
 * 快捷工具 Composable
 * 处理代码片段、快速链接、笔记的增删改
 */

import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuickToolsStore } from '../stores/quickToolsStore';
import { showSuccess, showDeleteConfirm } from '../utils/message';

export interface InputDialogState {
  visible: boolean;
  title: string;
  fields: Array<{
    key: string;
    label: string;
    value: string;
    type?: 'text' | 'textarea';
    required?: boolean;
    placeholder?: string;
  }>;
  onSubmit: (values: Record<string, string>) => void;
}

export function useQuickTools() {
  const quickToolsStore = useQuickToolsStore();
  const { codeSnippets, quickLinks, quickNotes } = storeToRefs(quickToolsStore);
  const { addSnippet, deleteSnippet, addLink, deleteLink, addNote, deleteNote } = quickToolsStore;

  // 输入对话框状态
  const inputDialog = ref<InputDialogState>({
    visible: false,
    title: '',
    fields: [],
    onSubmit: () => {},
  });

  // 关闭输入对话框
  function closeInputDialog() {
    inputDialog.value.visible = false;
  }

  // 添加代码片段 - 弹出输入对话框
  function showAddSnippetDialog() {
    inputDialog.value = {
      visible: true,
      title: '添加代码片段',
      fields: [
        { key: 'name', label: '名称', value: '', type: 'text', required: true, placeholder: '请输入代码片段名称' },
        { key: 'code', label: '代码', value: '', type: 'textarea', required: true, placeholder: '请输入代码内容' },
      ],
      onSubmit: (values) => {
        addSnippet(values.name, values.code);
        showSuccess('代码片段已添加');
        closeInputDialog();
      },
    };
  }

  // 从对话中收藏代码片段
  function showSaveCodeSnippetDialog(code: string, language: string) {
    inputDialog.value = {
      visible: true,
      title: `收藏代码片段 (${language})`,
      fields: [
        { key: 'name', label: '名称', value: '', type: 'text', required: true, placeholder: '请输入代码片段名称' },
      ],
      onSubmit: (values) => {
        addSnippet(values.name, code);
        showSuccess('代码片段已收藏');
        closeInputDialog();
      },
    };
  }

  // 复制代码片段
  async function copySnippet(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      showSuccess('已复制到剪贴板');
    } catch {
      // 复制失败
    }
  }

  // 删除代码片段
  function handleDeleteSnippet(index: number) {
    showDeleteConfirm('代码片段', () => {
      deleteSnippet(index);
      showSuccess('代码片段已删除');
    });
  }

  // 添加链接 - 弹出输入对话框
  function showAddLinkDialog() {
    inputDialog.value = {
      visible: true,
      title: '添加快速链接',
      fields: [
        { key: 'name', label: '名称', value: '', type: 'text', required: true, placeholder: '请输入链接名称' },
        { key: 'url', label: '地址', value: '', type: 'text', required: true, placeholder: '请输入链接地址' },
        { key: 'icon', label: '图标', value: '🔗', type: 'text', required: false, placeholder: '输入 emoji 图标' },
      ],
      onSubmit: (values) => {
        addLink(values.name, values.url, values.icon || '🔗');
        showSuccess('链接已添加');
        closeInputDialog();
      },
    };
  }

  // 删除链接
  function handleDeleteLink(index: number) {
    const link = quickLinks.value[index];
    showDeleteConfirm(link.name, () => {
      deleteLink(index);
      showSuccess('链接已删除');
    });
  }

  // 添加笔记
  function handleAddNote() {
    addNote('');
  }

  // 删除笔记
  function handleDeleteNote(index: number) {
    showDeleteConfirm('笔记', () => {
      deleteNote(index);
      showSuccess('笔记已删除');
    });
  }

  // 保存笔记
  function handleSaveNotes() {
    quickToolsStore.saveToStorage();
  }

  return {
    // 状态
    codeSnippets,
    quickLinks,
    quickNotes,
    inputDialog,
    // 方法
    closeInputDialog,
    showAddSnippetDialog,
    showSaveCodeSnippetDialog,
    copySnippet,
    handleDeleteSnippet,
    showAddLinkDialog,
    handleDeleteLink,
    handleAddNote,
    handleDeleteNote,
    handleSaveNotes,
  };
}
