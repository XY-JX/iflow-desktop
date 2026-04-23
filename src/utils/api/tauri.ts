/**
 * Tauri 环境检测工具
 */

/**
 * 检查是否在 Tauri 环境中
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
