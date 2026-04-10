/**
 * Tauri API 调用封装
 * 提供统一的错误处理和日志记录
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * API 调用结果类型
 */
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 通用的 API 调用函数，带错误处理
 * @param command Tauri 命令名称
 * @param args 命令参数
 * @returns API 调用结果
 */
export async function callCommand<T = any>(
  command: string,
  args: Record<string, any> = {}
): Promise<ApiResult<T>> {
  try {
    console.log(`[API] 调用命令: ${command}`, args);
    const result = await invoke<T>(command, args);
    console.log(`[API] 命令成功: ${command}`);
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[API] 命令失败: ${command}`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 简化的 API 调用（直接返回结果或抛出错误）
 * @param command Tauri 命令名称
 * @param args 命令参数
 * @returns 命令执行结果
 */
export async function invokeCommand<T = any>(
  command: string,
  args: Record<string, any> = {}
): Promise<T> {
  const result = await callCommand<T>(command, args);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data as T;
}

/**
 * 批量调用多个命令
 * @param commands 命令列表
 * @returns 所有命令的结果
 */
export async function batchInvoke(
  commands: Array<{ command: string; args?: Record<string, any> }>
): Promise<ApiResult[]> {
  const results: ApiResult[] = [];
  
  for (const { command, args } of commands) {
    const result = await callCommand(command, args || {});
    results.push(result);
  }
  
  return results;
}

// 导出常用的命令封装
export const api = {
  /**
   * 初始化智谱 AI 客户端
   */
  initZhipuClient: (apiKey: string) => 
    invokeCommand<string>('init_zhipu_client', { apiKey }),
  
  /**
   * 检查智谱 AI 状态
   */
  checkZhipuStatus: () => 
    invokeCommand<boolean>('check_zhipu_status'),
  
  /**
   * 加载应用配置
   */
  loadConfig: () => 
    invokeCommand<any>('load_app_config'),
  
  /**
   * 保存应用配置
   */
  saveConfig: (config: any) => 
    invokeCommand<void>('save_app_config', { config }),
  
  /**
   * 添加自定义角色
   */
  addCustomRole: (role: any) => 
    invokeCommand<void>('add_custom_role', { role }),
  
  /**
   * 删除自定义角色
   */
  deleteCustomRole: (index: number) => 
    invokeCommand<void>('delete_custom_role', { index }),
  
  /**
   * 更新自定义角色
   */
  updateCustomRole: (index: number, role: any) => 
    invokeCommand<void>('update_custom_role', { index, role }),
};
