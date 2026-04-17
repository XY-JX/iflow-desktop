/**
 * 对话框管理 Composable
 * 提供统一的对话框状态管理
 */

import { ref } from 'vue';

/**
 * 对话框管理
 * @param initialState 初始显示状态(默认false)
 */
export function useDialog(initialState = false) {
  const show = ref(initialState);

  /**
   * 打开对话框
   */
  const open = () => {
    show.value = true;
  };

  /**
   * 关闭对话框
   */
  const close = () => {
    show.value = false;
  };

  /**
   * 切换对话框状态
   */
  const toggle = () => {
    show.value = !show.value;
  };

  return {
    show,
    open,
    close,
    toggle,
  };
}
