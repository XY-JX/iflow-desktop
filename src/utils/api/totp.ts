/**
 * TOTP API封装
 */

import { invoke } from '@tauri-apps/api/core';
import type { TOTPSecret } from '../totp';

/**
 * 检查是否在 Tauri 环境中
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * 加载TOTP密钥
 */
export async function loadSecrets(): Promise<TOTPSecret[]> {
  if (!isTauri()) {
    console.warn('[TOTP] 非 Tauri 环境，返回空列表');
    return [];
  }
  return invoke('load_totp_secrets');
}

/**
 * 保存TOTP密钥
 */
export async function saveSecrets(secrets: TOTPSecret[]): Promise<void> {
  if (!isTauri()) {
    console.warn('[TOTP] 非 Tauri 环境，跳过保存');
    return;
  }
  return invoke('save_totp_secrets', { secrets });
}

/**
 * 删除所有TOTP密钥
 */
export async function deleteAllSecrets(): Promise<void> {
  if (!isTauri()) {
    console.warn('[TOTP] 非 Tauri 环境，跳过删除');
    return;
  }
  return invoke('delete_totp_secrets');
}

// 默认导出所有函数作为命名空间对象
const totpApi = {
  loadSecrets,
  saveSecrets,
  deleteAllSecrets,
};

export default totpApi;
