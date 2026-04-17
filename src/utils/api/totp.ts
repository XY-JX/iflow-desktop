/**
 * TOTP API封装
 */

import { invoke } from '@tauri-apps/api/core';
import type { TOTPSecret } from '../totp';

/**
 * 加载TOTP密钥
 */
export async function loadSecrets(): Promise<TOTPSecret[]> {
  return invoke('load_totp_secrets');
}

/**
 * 保存TOTP密钥
 */
export async function saveSecrets(secrets: TOTPSecret[]): Promise<void> {
  return invoke('save_totp_secrets', { secrets });
}

/**
 * 删除所有TOTP密钥
 */
export async function deleteAllSecrets(): Promise<void> {
  return invoke('delete_totp_secrets');
}

// 默认导出所有函数作为命名空间对象
const totpApi = {
  loadSecrets,
  saveSecrets,
  deleteAllSecrets,
};

export default totpApi;
