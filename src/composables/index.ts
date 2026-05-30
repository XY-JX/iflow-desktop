/**
 * Composables - 可复用的组合式函数
 */

import { onMounted, onUnmounted } from 'vue';

/**
 * 键盘快捷键管理
 */
export function useKeyboardShortcuts() {
  const handlers = new Map<string, (event: KeyboardEvent) => void>();

  function handleKeydown(event: KeyboardEvent) {
    const keys = [];
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    keys.push(event.key.toLowerCase());

    const keyCombo = keys.join('+');
    const handler = handlers.get(keyCombo);

    if (handler) {
      event.preventDefault();
      handler(event);
    }
  }

  function registerShortcut(keyCombo: string, handler: (event: KeyboardEvent) => void) {
    handlers.set(keyCombo, handler);
  }

  function unregisterShortcut(keyCombo: string) {
    handlers.delete(keyCombo);
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    handlers.clear();
  });

  return { registerShortcut, unregisterShortcut };
}

export { useMarkdown, setupCodeCopyDelegation } from './useMarkdown';
export { useDialog } from './useDialog';
export { useApiKey } from './useApiKey';
export { useConversationExport } from './useConversationExport';
export { useChatHandler } from './useChatHandler';
export { useQuickTools } from './useQuickTools';
