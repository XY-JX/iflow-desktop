/**
 * 配置管理工具函数
 * 提供统一的配置加载和保存方法
 */

import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, CustomRole } from '../types';
import { error as logError } from './logger';

/**
 * 加载应用配置
 */
export async function loadAppConfig(): Promise<AppConfig> {
  try {
    return await invoke<AppConfig>('load_app_config');
  } catch (error) {
    logError('configUtils', '加载配置失败:', error);
    throw error;
  }
}

/**
 * 保存应用配置
 */
export async function saveAppConfig(config: AppConfig): Promise<void> {
  try {
    await invoke('save_app_config', { config });
  } catch (error) {
    logError('configUtils', '保存配置失败:', error);
    throw error;
  }
}

/**
 * 加载自定义角色列表
 */
export async function loadCustomRoles(): Promise<CustomRole[]> {
  try {
    const config = await loadAppConfig();
    return config.custom_roles || [];
  } catch (error) {
    logError('configUtils', '加载自定义角色失败:', error);
    return [];
  }
}

/**
 * 添加自定义角色
 */
export async function addCustomRole(role: CustomRole): Promise<void> {
  try {
    await invoke('add_custom_role', { role });
  } catch (error) {
    logError('configUtils', '添加角色失败:', error);
    throw error;
  }
}

/**
 * 删除自定义角色
 */
export async function deleteCustomRole(index: number): Promise<void> {
  try {
    await invoke('delete_custom_role', { index });
  } catch (error) {
    logError('configUtils', '删除角色失败:', error);
    throw error;
  }
}
