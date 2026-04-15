<template>
  <div class="agent-config-panel">
    <h3>🤖 多模型协作配置</h3>
    
    <div class="config-section">
      <div class="toggle-container">
        <label class="switch">
          <input 
            type="checkbox" 
            :checked="agentStore.isMultiAgentMode"
            @change="toggleMode"
          />
          <span class="slider"></span>
        </label>
        <span class="toggle-label">启用多 Agent 协作模式</span>
      </div>
      
      <p class="hint-text">
        开启后,AI 将自动分解任务并调用不同的专业模型协作完成
      </p>
    </div>

    <div v-if="agentStore.isMultiAgentMode" class="agent-settings">
      <!-- 指挥官 AI -->
      <div class="agent-card">
        <div class="agent-header">
          <span class="agent-icon">🎯</span>
          <h4>指挥官 AI</h4>
          <span class="agent-status" :class="getStatusClass('commander')">
            {{ getStatusText('commander') }}
          </span>
        </div>
        <p class="agent-desc">负责任务分析、分解和协调</p>
        
        <div class="form-group">
          <label>API Key</label>
          <input 
            type="password" 
            v-model="configs.commander_api_key"
            placeholder="输入智谱 AI API Key"
          />
        </div>
        
        <div class="form-group">
          <label>默认模型</label>
          <select v-model="configs.default_commander_model">
            <option value="glm-4">GLM-4 (推荐)</option>
            <option value="glm-4-flash">GLM-4-Flash (快速)</option>
            <option value="glm-4.5-air">GLM-4.5-Air</option>
          </select>
        </div>
      </div>

      <!-- 代码专家 AI -->
      <div class="agent-card">
        <div class="agent-header">
          <span class="agent-icon">💻</span>
          <h4>代码专家 AI</h4>
          <span class="agent-status" :class="getStatusClass('code_expert')">
            {{ getStatusText('code_expert') }}
          </span>
        </div>
        <p class="agent-desc">负责代码生成和优化</p>
        
        <div class="form-group">
          <label>API Key (可选,共用指挥官的)</label>
          <input 
            type="password" 
            v-model="configs.code_expert_api_key"
            placeholder="留空则使用指挥官 API Key"
          />
        </div>
        
        <div class="form-group">
          <label>默认模型</label>
          <select v-model="configs.default_code_model">
            <option value="glm-4">GLM-4 (推荐)</option>
            <option value="glm-4.5-air">GLM-4.5-Air</option>
            <option value="glm-4-flash">GLM-4-Flash</option>
          </select>
        </div>
      </div>

      <!-- 审查 AI -->
      <div class="agent-card">
        <div class="agent-header">
          <span class="agent-icon">🔍</span>
          <h4>审查 AI</h4>
          <span class="agent-status" :class="getStatusClass('reviewer')">
            {{ getStatusText('reviewer') }}
          </span>
        </div>
        <p class="agent-desc">负责代码审查和质量检查</p>
        
        <div class="form-group">
          <label>API Key (可选,共用指挥官的)</label>
          <input 
            type="password" 
            v-model="configs.reviewer_api_key"
            placeholder="留空则使用指挥官 API Key"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="saveConfigs" :disabled="saving" class="btn-primary">
          {{ saving ? '保存中...' : '💾 保存配置' }}
        </button>
        <button @click="testAgents" class="btn-secondary">
          🧪 测试连接
        </button>
      </div>
    </div>

    <!-- 状态显示 -->
    <div v-if="agentStore.agentStatuses.length > 0" class="status-log">
      <h4>Agent 状态</h4>
      <div 
        v-for="status in agentStore.agentStatuses" 
        :key="status.name"
        class="status-item"
        :class="status.status"
      >
        <span class="status-name">{{ getAgentName(status.name) }}</span>
        <span class="status-text">{{ status.message || status.status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAgentStore } from '../stores/agentStore';
import type { AgentConfig } from '../stores/agentStore';

const agentStore = useAgentStore();
const { agentStatuses } = storeToRefs(agentStore);

const configs = ref<AgentConfig>({
  commander_api_key: '',
  code_expert_api_key: '',
  reviewer_api_key: '',
  default_commander_model: 'glm-4',
  default_code_model: 'glm-4',
});

const saving = ref(false);

// 加载配置
onMounted(async () => {
  await agentStore.loadAgentConfigs();
  if (agentStore.agentConfigs) {
    configs.value = { ...agentStore.agentConfigs };
  }
});

// 切换模式
async function toggleMode(event: Event) {
  const enabled = (event.target as HTMLInputElement).checked;
  agentStore.toggleMultiAgentMode(enabled);
}

// 保存配置
async function saveConfigs() {
  if (!configs.value.commander_api_key) {
    alert('请至少配置指挥官 AI 的 API Key');
    return;
  }

  saving.value = true;
  try {
    await agentStore.saveAgentConfigs(configs.value);
    alert('✅ 配置保存成功!');
  } catch (error) {
    alert('❌ 保存失败: ' + error);
  } finally {
    saving.value = false;
  }
}

// 测试连接
async function testAgents() {
  alert('🧪 测试功能开发中...');
}

// 获取状态样式
function getStatusClass(agentName: string): string {
  const status = agentStatuses.value.find((s) => s.name === agentName);
  return status?.status || 'idle';
}

// 获取状态文本
function getStatusText(agentName: string): string {
  const status = agentStatuses.value.find((s) => s.name === agentName);
  const statusMap: Record<string, string> = {
    idle: '待命',
    working: '工作中...',
    completed: '已完成',
    error: '错误',
  };
  return statusMap[status?.status || 'idle'];
}

// 获取 Agent 名称
function getAgentName(name: string): string {
  const nameMap: Record<string, string> = {
    commander: '🎯 指挥官',
    code_expert: '💻 代码专家',
    reviewer: '🔍 审查员',
  };
  return nameMap[name] || name;
}
</script>

<style scoped>
.agent-config-panel {
  padding: 20px;
  background: var(--color-surface);
  border-radius: 12px;
}

h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.config-section {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--color-background);
  border-radius: 8px;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.toggle-label {
  font-weight: 500;
  color: var(--color-text-primary);
}

.hint-text {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.agent-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.agent-card {
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.agent-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.agent-icon {
  font-size: 24px;
}

.agent-header h4 {
  margin: 0;
  flex: 1;
  font-size: 16px;
  color: var(--color-text-primary);
}

.agent-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.agent-status.idle {
  background: var(--color-border);
  color: var(--color-text-secondary);
}

.agent-status.working {
  background: #fff3cd;
  color: #856404;
}

.agent-status.completed {
  background: #d4edda;
  color: #155724;
}

.agent-status.error {
  background: #f8d7da;
  color: #721c24;
}

.agent-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.status-log {
  margin-top: 20px;
  padding: 15px;
  background: var(--color-background);
  border-radius: 8px;
}

.status-log h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--color-text-primary);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  font-size: 13px;
}

.status-item.idle {
  background: var(--color-surface);
}

.status-item.working {
  background: #fff3cd;
}

.status-item.completed {
  background: #d4edda;
}

.status-item.error {
  background: #f8d7da;
}

.status-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.status-text {
  color: var(--color-text-secondary);
}
</style>
