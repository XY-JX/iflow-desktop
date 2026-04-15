import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { info, error as logError } from '../utils/logger';

export interface AgentConfig {
  commander_api_key?: string;      // 指挥官 AI (任务分析)
  code_expert_api_key?: string;    // 代码专家 AI (代码生成)
  reviewer_api_key?: string;       // 审查 AI (代码审查)
  default_commander_model?: string; // 默认指挥官模型
  default_code_model?: string;      // 默认代码模型
}

export interface AgentStatus {
  name: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  message?: string;
}

export const useAgentStore = defineStore('agent', () => {
  // 状态
  const agentConfigs = ref<AgentConfig | null>(null);
  const agentStatuses = ref<AgentStatus[]>([]);
  const isMultiAgentMode = ref(false);

  // 计算属性
  const hasCommanderConfig = computed(() => !!agentConfigs.value?.commander_api_key);
  const hasCodeExpertConfig = computed(() => !!agentConfigs.value?.code_expert_api_key);
  const isConfigured = computed(() => hasCommanderConfig.value || hasCodeExpertConfig.value);

  // 加载 Agent 配置
  async function loadAgentConfigs() {
    try {
      const configs = await invoke<AgentConfig | null>('get_agent_configs');
      agentConfigs.value = configs;
      info('agentStore', 'Agent 配置已加载', configs);
    } catch (error) {
      logError('agentStore', '加载 Agent 配置失败:', error);
    }
  }

  // 保存 Agent 配置
  async function saveAgentConfigs(configs: AgentConfig) {
    try {
      await invoke('save_agent_configs', { configs });
      agentConfigs.value = configs;
      info('agentStore', 'Agent 配置已保存');
    } catch (error) {
      logError('agentStore', '保存 Agent 配置失败:', error);
      throw error;
    }
  }

  // 切换多 Agent 模式
  function toggleMultiAgentMode(enabled: boolean) {
    isMultiAgentMode.value = enabled;
    info('agentStore', `多 Agent 模式: ${enabled ? '开启' : '关闭'}`);
  }

  // 更新 Agent 状态
  function updateAgentStatus(name: string, status: AgentStatus['status'], message?: string) {
    const existingIndex = agentStatuses.value.findIndex((s) => s.name === name);
    
    if (existingIndex >= 0) {
      agentStatuses.value[existingIndex] = { name, status, message };
    } else {
      agentStatuses.value.push({ name, status, message });
    }
    
    info('agentStore', `Agent [${name}] 状态: ${status}`, message);
  }

  // 重置所有 Agent 状态
  function resetAgentStatuses() {
    agentStatuses.value = [];
  }

  // 获取 Commander API Key
  function getCommanderApiKey(): string | undefined {
    return agentConfigs.value?.commander_api_key;
  }

  // 获取 Code Expert API Key
  function getCodeExpertApiKey(): string | undefined {
    return agentConfigs.value?.code_expert_api_key;
  }

  // 获取 Reviewer API Key
  function getReviewerApiKey(): string | undefined {
    return agentConfigs.value?.reviewer_api_key;
  }

  return {
    // 状态
    agentConfigs,
    agentStatuses,
    isMultiAgentMode,
    // 计算属性
    hasCommanderConfig,
    hasCodeExpertConfig,
    isConfigured,
    // 方法
    loadAgentConfigs,
    saveAgentConfigs,
    toggleMultiAgentMode,
    updateAgentStatus,
    resetAgentStatuses,
    getCommanderApiKey,
    getCodeExpertApiKey,
    getReviewerApiKey,
  };
});
