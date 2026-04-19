/**
 * API Key 管理 Composable
 * 处理智谱 AI API Key 的初始化、保存和清除
 */

import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { info, error as logError } from '../utils/logger';
import type { Model, AppConfig, ZhipuModelInfo } from '../types';

export function useApiKey() {
  const zhipuReady = ref(false);
  const zhipuStatus = ref('');
  const availableModels = ref<Model[]>([]);
  const currentModel = ref('glm-4.6v');

  // 初始化智谱 AI 客户端
  async function initZhipuClient(apiKey: string) {
    info('useApiKey', '开始初始化智谱 AI 客户端');
    zhipuStatus.value = '正在初始化...';

    try {
      const result = await invoke<string>('init_zhipu_client', { apiKey });
      info('useApiKey', `后端返回结果: ${result}`);

      zhipuStatus.value = result;
      zhipuReady.value = true;

      // 保存到 Rust 后端配置文件
      try {
        await invoke('save_api_key', { apiKey });
        info('useApiKey', 'API Key 已保存到 config/app_config.json');
      } catch (error) {
        logError('useApiKey', '保存 API Key 失败:', error);
      }

      // 自动获取模型列表并缓存
      await fetchAndCacheModels();

      info('useApiKey', '智谱 AI 配置成功！');

      setTimeout(() => {
        zhipuStatus.value = '';
      }, 2000);
    } catch (error) {
      logError('useApiKey', '初始化失败:', error);
      zhipuStatus.value = '❌ 配置失败';
      zhipuReady.value = false;
      setTimeout(() => {
        zhipuStatus.value = '';
      }, 5000);
    }
  }

  // 获取并缓存模型列表
  async function fetchAndCacheModels() {
    try {
      info('useApiKey', '正在获取模型列表...');
      const models = await invoke<ZhipuModelInfo[]>('fetch_zhipu_models');
      info('useApiKey', `成功获取 ${models.length} 个模型`);

      // 更新可用模型列表
      availableModels.value = models.map((m) => ({
        id: m.id,
        name: m.name || m.id,
        provider: '智谱 AI',
        description: m.description,
      }));

      // 默认选择第一个模型
      if (models.length > 0) {
        currentModel.value = models[0].id;
        info('useApiKey', `默认选择模型: ${currentModel.value}`);
      }
    } catch (error) {
      logError('useApiKey', '获取模型列表失败，尝试从配置文件加载:', error);
      // 尝试从配置文件加载缓存
      await loadCachedModels();
    }
  }

  // 从配置文件加载缓存的模型列表
  async function loadCachedModels() {
    try {
      const config = await invoke<AppConfig>('load_app_config');
      if (config.cached_models && config.cached_models.length > 0) {
        info('useApiKey', `从配置文件加载 ${config.cached_models.length} 个缓存模型`);
        availableModels.value = config.cached_models.map((m) => ({
          id: m.id,
          name: m.name || m.id,
          provider: '智谱 AI',
          description: m.description,
        }));

        currentModel.value = config.cached_models[0].id;
        info('useApiKey', `默认选择模型: ${currentModel.value}`);
      } else {
        info('useApiKey', '配置文件中没有缓存模型，使用默认列表');
      }
    } catch (loadError) {
      logError('useApiKey', '加载缓存模型失败，使用默认列表:', loadError);
    }
  }

  // 清除 API Key
  async function clearApiKey() {
    if (!zhipuReady.value) return;

    try {
      await invoke('save_api_key', { apiKey: '' });
      info('useApiKey', 'API Key 已从配置文件中清除');
    } catch (error) {
      logError('useApiKey', '清除 API Key 失败:', error);
    }

    zhipuReady.value = false;
    zhipuStatus.value = '';
    info('useApiKey', 'API Key 已清除');
  }

  // 加载当前 API Key
  async function loadCurrentApiKey(): Promise<string | null> {
    try {
      const savedKey = await invoke<string | null>('get_api_key');
      if (savedKey) {
        info('useApiKey', '已从配置文件加载 API Key');
      }
      return savedKey;
    } catch (error) {
      logError('useApiKey', '加载 API Key 失败:', error);
      return null;
    }
  }

  return {
    // 状态
    zhipuReady,
    zhipuStatus,
    availableModels,
    currentModel,
    // 方法
    initZhipuClient,
    clearApiKey,
    loadCurrentApiKey,
    fetchAndCacheModels,
  };
}
