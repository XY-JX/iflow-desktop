/**
 * Composables - 可复用的组合式函数
 * 提供组件级别的逻辑复用
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { error as logError } from '../utils/logger';

/**
 * 键盘快捷键管理
 * @returns 快捷键处理函数和生命周期钩子
 */
export function useKeyboardShortcuts() {
  const handlers = new Map<string, (event: KeyboardEvent) => void>();

  function handleKeydown(event: KeyboardEvent) {
    // 构建键组合字符串
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

  /**
   * 注册快捷键
   * @param keyCombo 键组合 (如 'ctrl+n', 'escape')
   * @param handler 处理函数
   */
  function registerShortcut(keyCombo: string, handler: (event: KeyboardEvent) => void) {
    handlers.set(keyCombo, handler);
  }

  /**
   * 注销快捷键
   * @param keyCombo 键组合
   */
  function unregisterShortcut(keyCombo: string) {
    handlers.delete(keyCombo);
  }

  /**
   * 清除所有快捷键
   */
  function clearShortcuts() {
    handlers.clear();
  }

  // 自动管理事件监听
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    clearShortcuts();
  });

  return {
    registerShortcut,
    unregisterShortcut,
    clearShortcuts,
  };
}

/**
 * 本地存储管理
 * @param key 存储键名
 * @param defaultValue 默认值
 * @returns 响应式数据和操作方法
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(defaultValue);

  // 加载数据
  function load() {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        data.value = JSON.parse(stored);
      }
    } catch (error) {
      logError('useLocalStorage', `Failed to load ${key} from localStorage:`, error);
    }
  }

  // 保存数据
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(data.value));
    } catch (error) {
      logError('useLocalStorage', `Failed to save ${key} to localStorage:`, error);
    }
  }

  // 清除数据
  function clear() {
    try {
      localStorage.removeItem(key);
      data.value = defaultValue;
    } catch (error) {
      logError('useLocalStorage', `Failed to clear ${key} from localStorage:`, error);
    }
  }

  // 初始化时加载
  onMounted(() => {
    load();
  });

  return {
    data,
    load,
    save,
    clear,
  };
}

/**
 * 剪贴板操作
 * @returns 剪贴板操作方法
 */
export function useClipboard() {
  /**
   * 复制文本到剪贴板
   * @param text 要复制的文本
   * @returns 是否成功
   */
  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      logError('useClipboard', 'Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * 从剪贴板读取文本
   * @returns 剪贴板文本
   */
  async function paste(): Promise<string> {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      logError('useClipboard', 'Failed to read from clipboard:', error);
      return '';
    }
  }

  return {
    copy,
    paste,
  };
}

/**
 * 防抖值更新
 * @param initialValue 初始值
 * @param delay 延迟时间(毫秒)
 * @returns 防抖后的值和更新函数
 */
export function useDebouncedRef<T>(initialValue: T, delay: number) {
  const value = ref<T>(initialValue);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function setValue(newValue: T) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      value.value = newValue;
    }, delay);
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return {
    value,
    setValue,
  };
}

/**
 * 窗口大小响应
 * @returns 响应式的窗口宽度和高度
 */
export function useWindowSize() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  function updateSize() {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
  }

  onMounted(() => {
    window.addEventListener('resize', updateSize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize);
  });

  return {
    width,
    height,
  };
}

/**
 * 暗黑模式检测
 * @returns 是否为暗黑模式
 */
export function useDarkMode() {
  const isDark = ref(false);

  function checkDarkMode() {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  onMounted(() => {
    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
  });

  onUnmounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.removeEventListener('change', checkDarkMode);
  });

  return {
    isDark,
  };
}

// 导出所有 composables
export { useMarkdown } from './useMarkdown';
export { useDialog } from './useDialog';
