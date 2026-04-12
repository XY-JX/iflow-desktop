import * as OTPAuth from 'otpauth';
import { invoke } from '@tauri-apps/api/core';

const STORAGE_KEY = 'iflow_totp_secrets';

export interface TOTPSecret {
  id: string;
  name: string;
  secret: string;
  issuer?: string;
}

export interface TOTPCode {
  id: string;
  name: string;
  code: string;
  timeLeft: number;
}

/**
 * 生成随机密钥
 */
export function generateSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

/**
 * 生成TOTP验证码
 */
export function generateTOTP(secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: 'iFlow',
    label: 'iFlow Desktop',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  
  return totp.generate();
}

/**
 * 获取剩余时间(秒)
 */
export function getTimeLeft(): number {
  const epoch = Math.floor(Date.now() / 1000);
  return 30 - (epoch % 30);
}

/**
 * 保存密钥到本地文件
 */
export async function saveSecrets(secrets: TOTPSecret[]): Promise<void> {
  try {
    await invoke('save_totp_secrets', { secrets });
  } catch (error) {
    console.error('保存TOTP密钥失败:', error);
    throw error;
  }
}

/**
 * 从本地文件加载密钥
 */
export async function loadSecrets(): Promise<TOTPSecret[]> {
  try {
    const secrets = await invoke<TOTPSecret[]>('load_totp_secrets');
    return secrets;
  } catch (error) {
    console.error('加载TOTP密钥失败:', error);
    return [];
  }
}

/**
 * 添加新密钥
 */
export async function addSecret(name: string, secret: string, issuer?: string): Promise<TOTPSecret> {
  const secrets = await loadSecrets();
  const newSecret: TOTPSecret = {
    id: Date.now().toString(),
    name,
    secret,
    issuer,
  };
  
  secrets.push(newSecret);
  await saveSecrets(secrets);
  
  return newSecret;
}

/**
 * 删除密钥
 */
export async function deleteSecret(id: string): Promise<void> {
  const secrets = await loadSecrets();
  const filtered = secrets.filter(s => s.id !== id);
  await saveSecrets(filtered);
}

/**
 * 获取所有验证码
 */
export async function getAllCodes(): Promise<TOTPCode[]> {
  const secrets = await loadSecrets();
  
  return secrets.map(s => ({
    id: s.id,
    name: s.name,
    code: generateTOTP(s.secret),
    timeLeft: getTimeLeft(),
  }));
}
