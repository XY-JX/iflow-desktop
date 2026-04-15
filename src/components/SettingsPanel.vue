<template>
  <div class="settings-panel">
    <div class="panel-header">
      <span class="panel-title">⚙️ 模型设置</span>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <div class="panel-content">
      <!-- 系统提示词 -->
      <div class="setting-section">
        <label class="section-label">🤖 系统角色设定</label>
        <div class="current-role-display" v-if="localSystemPrompt">
          <span class="role-icon">✅</span>
          <span class="role-text">当前角色：{{ getCurrentRoleName() }}</span>
        </div>
        <textarea
          v-model="localSystemPrompt"
          class="system-prompt-input"
          placeholder="输入系统提示词，例如：你是一个有帮助的 AI 助手..."
          rows="4"
          @change="updateSettings"
        ></textarea>
        <div class="preset-prompts">
          <button
            class="preset-btn"
            :class="{ active: localSystemPrompt === preset.value }"
            v-for="preset in presetPrompts"
            :key="preset.value"
            @click="setSystemPrompt(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- 温度参数 -->
      <div class="setting-section">
        <label class="section-label">🌡️ 温度 (Temperature): {{ temperature }}</label>
        <input
          type="range"
          v-model.number="temperature"
          min="0"
          max="1"
          step="0.1"
          class="slider"
          @change="updateSettings"
        />
        <div class="slider-labels">
          <span>精准 (0)</span>
          <span>随机 (1)</span>
        </div>
      </div>

      <!-- 最大 Token 数 -->
      <div class="setting-section">
        <label class="section-label">📏 最大输出长度 (Tokens): {{ maxTokens }}</label>
        <input
          type="range"
          v-model.number="maxTokens"
          min="256"
          max="8192"
          step="256"
          class="slider"
          @change="updateSettings"
        />
        <div class="slider-labels">
          <span>256</span>
          <span>8192</span>
        </div>
      </div>

      <!-- 上下文压缩配置 -->
      <div class="setting-section">
        <label class="section-label">🗜️ 上下文压缩设置</label>
        
        <!-- 压缩级别 -->
        <div class="context-config-item">
          <label class="config-label">压缩级别</label>
          <select v-model="contextConfig.compressionLevel" @change="updateSettings" class="config-select">
            <option value="none">不压缩</option>
            <option value="light">轻度压缩</option>
            <option value="aggressive">激进压缩</option>
          </select>
        </div>

        <!-- 保留最近轮数 -->
        <div class="context-config-item">
          <label class="config-label">保留最近对话轮数: {{ contextConfig.recentRounds }}</label>
          <input
            type="range"
            v-model.number="contextConfig.recentRounds"
            min="0"
            max="20"
            step="1"
            class="slider"
            @change="updateSettings"
          />
          <div class="slider-labels">
            <span>不限 (0)</span>
            <span>20 轮</span>
          </div>
        </div>

        <!-- 保护选项 -->
        <div class="context-config-item config-checkboxes">
          <label class="checkbox-label">
            <input type="checkbox" v-model="contextConfig.keepCodeBlocks" @change="updateSettings" />
            <span>🔒 保护代码块</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="contextConfig.keepErrors" @change="updateSettings" />
            <span>🔒 保护错误信息</span>
          </label>
        </div>
      </div>

      <!-- 重置按钮 -->
      <div class="setting-actions">
        <button class="reset-btn" @click="resetToDefaults">🔄 恢复默认设置</button>
      </div>

      <!-- 多模型协作配置入口 -->
      <div class="setting-section">
        <label class="section-label">🤖 多模型协作</label>
        <button @click="showAgentConfig = true" class="btn-agent-config">
          ⚙️ 配置 Agent 协作系统
        </button>
      </div>

      <!-- 自定义角色管理 -->
      <div class="setting-section">
        <div class="section-header">
          <label class="section-label">🎭 自定义角色管理</label>
          <button @click="showAddRoleDialog = true" class="btn-add-role-panel" title="添加新角色">
            ➕ 添加角色
          </button>
        </div>

        <div v-if="customRoles.length > 0" class="custom-roles-list">
          <div
            v-for="(role, index) in customRoles"
            :key="index"
            class="role-item"
            :class="{ 'role-selected': localSystemPrompt === role.value }"
            @click="selectCustomRole(role)"
          >
            <div class="role-info">
              <span class="role-icon-display">{{ role.icon }}</span>
              <div class="role-details">
                <span class="role-name-display">{{ role.label }}</span>
                <span class="role-prompt-display"
                  >{{ role.value.substring(0, 50) }}{{ role.value.length > 50 ? '...' : '' }}</span
                >
              </div>
            </div>
            <div class="role-actions" @click.stop>
              <button @click="editCustomRole(index)" class="btn-edit-role" title="编辑此角色">
                ✏️
              </button>
              <button @click="deleteCustomRole(index)" class="btn-delete-role" title="删除此角色">
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div v-else class="no-roles-hint">
          <p>暂无自定义角色，点击上方按钮添加</p>
        </div>
      </div>
    </div>

    <!-- 添加角色对话框 -->
    <div v-if="showAddRoleDialog" class="dialog-overlay" @click.self="cancelAddRole">
      <div class="dialog-content dialog-add-role" @click.stop>
        <h3 class="dialog-title">➕ 添加自定义角色</h3>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group form-group-icon">
              <label class="form-label">角色图标</label>
              <input
                v-model="newRole.icon"
                type="text"
                class="form-input input-icon"
                placeholder="🚀"
                maxlength="2"
              />
            </div>
            <div class="form-group form-group-name">
              <label class="form-label">角色名称</label>
              <input
                v-model="newRole.label"
                type="text"
                class="form-input"
                placeholder="例如：翻译助手"
                maxlength="10"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">系统提示词</label>
            <textarea
              v-model="newRole.value"
              class="form-textarea"
              placeholder="描述这个角色的职责和能力...\n\n例如：你是专业的翻译助手，精通多国语言翻译..."
              rows="5"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="cancelAddRole" class="btn-dialog-cancel">取消</button>
          <button @click="handleAddRole" class="btn-dialog-confirm">确定添加</button>
        </div>
      </div>
    </div>

    <!-- 编辑角色对话框 -->
    <div v-if="showEditRoleDialog" class="dialog-overlay" @click.self="cancelEditRole">
      <div class="dialog-content dialog-add-role" @click.stop>
        <h3 class="dialog-title">✏️ 编辑自定义角色</h3>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group form-group-icon">
              <label class="form-label">角色图标</label>
              <input
                v-model="newRole.icon"
                type="text"
                class="form-input input-icon"
                placeholder="🚀"
                maxlength="2"
              />
            </div>
            <div class="form-group form-group-name">
              <label class="form-label">角色名称</label>
              <input
                v-model="newRole.label"
                type="text"
                class="form-input"
                placeholder="例如：翻译助手"
                maxlength="10"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">系统提示词</label>
            <textarea
              v-model="newRole.value"
              class="form-textarea"
              placeholder="描述这个角色的职责和能力..."
              rows="5"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="cancelEditRole" class="btn-dialog-cancel">取消</button>
          <button @click="saveEditedRole" class="btn-dialog-confirm">保存修改</button>
        </div>
      </div>
    </div>

    <!-- Agent 配置对话框 -->
    <div v-if="showAgentConfig" class="dialog-overlay dialog-agent-config" @click.self="showAgentConfig = false">
      <div class="dialog-content" @click.stop>
        <AgentConfigPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { invoke } from '@tauri-apps/api/core';
  import type { ContextConfig } from '../types';
  import AgentConfigPanel from './AgentConfigPanel.vue';

  interface SettingsPanelProps {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }

  const props = withDefaults(defineProps<SettingsPanelProps>(), {
    systemPrompt: '你是一个有用的 AI 编程助手。',
    temperature: 0.7,
    maxTokens: 2048,
  });

  const emit = defineEmits<{
    close: [];
    'update:settings': [settings: { systemPrompt: string; temperature: number; maxTokens: number }];
    'role-added': []; // 新增事件：角色添加成功
  }>();

  const localSystemPrompt = ref(props.systemPrompt);
  const temperature = ref(props.temperature);
  const maxTokens = ref(props.maxTokens);
  
  // 上下文压缩配置
  const contextConfig = ref<ContextConfig>({
    maxTokens: 8192,
    compressionLevel: 'light',
    keepCodeBlocks: true,
    keepErrors: true,
    recentRounds: 10,
  });
  const showAddRoleDialog = ref(false);
  const showEditRoleDialog = ref(false);
  const showAgentConfig = ref(false);
  const editingRoleIndex = ref(-1);
  const newRole = ref({
    icon: '🚀',
    label: '',
    value: '',
  });

  // 自定义角色存储
  const customRoles = ref<any[]>([]);

  // 加载自定义角色 (从本地文件)
  async function loadCustomRoles() {
    try {
      const config: any = await invoke('load_app_config');
      customRoles.value = config.custom_roles || [];
      console.log(`已加载 ${customRoles.value.length} 个自定义角色`);
    } catch (error) {
      console.error('加载自定义角色失败:', error);
    }
  }

  // 保存自定义角色 (到本地文件)
  // async function saveCustomRoles() {
  //   try {
  //     const config: any = await invoke('load_app_config');
  //     config.custom_roles = customRoles.value;
  //     await invoke('save_app_config', { config });
  //     console.log(`已保存 ${customRoles.value.length} 个自定义角色`);
  //   } catch (error) {
  //     console.error('保存自定义角色失败:', error);
  //   }
  // }

  // 临时保存原始数据（用于取消时恢复）
  const tempRoleBackup = ref({
    icon: '🚀',
    label: '',
    value: '',
  });

  // 添加新角色
  async function handleAddRole() {
    if (!newRole.value.label || !newRole.value.value) {
      alert('请填写角色名称和系统提示词');
      return;
    }

    try {
      await invoke('add_custom_role', {
        role: {
          icon: newRole.value.icon,
          label: newRole.value.label,
          value: newRole.value.value,
        },
      });

      // 重新加载角色列表
      await loadCustomRoles();

      // 重置表单
      newRole.value = {
        icon: '🚀',
        label: '',
        value: '',
      };

      showAddRoleDialog.value = false;

      // 通知父组件角色已添加
      emit('role-added');
    } catch (error) {
      console.error('添加角色失败:', error);
      alert('添加角色失败：' + error);
    }
  }

  // 取消添加角色
  function cancelAddRole() {
    showAddRoleDialog.value = false;
    // 不重置表单，保留用户输入
  }

  // 选择自定义角色
  function selectCustomRole(role: any) {
    localSystemPrompt.value = role.value;
    updateSettings();
  }

  // 删除角色
  async function deleteCustomRole(index: number) {
    const role = customRoles.value[index];
    if (!role) {
      alert('未找到该角色');
      return;
    }

    if (!confirm(`确定要删除角色 "${role.icon} ${role.label}" 吗？\n\n此操作不可恢复！`)) {
      return;
    }

    try {
      await invoke('delete_custom_role', { index });
      // 重新加载角色列表
      await loadCustomRoles();
      alert(`角色 "${role.icon} ${role.label}" 已删除`);
    } catch (error) {
      console.error('删除角色失败:', error);
      alert('删除角色失败：' + error);
    }
  }

  // 编辑角色
  function editCustomRole(index: number) {
    const role = customRoles.value[index];
    if (!role) {
      alert('未找到该角色');
      return;
    }

    editingRoleIndex.value = index;
    // 备份原始数据
    tempRoleBackup.value = {
      icon: role.icon,
      label: role.label,
      value: role.value,
    };
    newRole.value = {
      icon: role.icon,
      label: role.label,
      value: role.value,
    };
    showEditRoleDialog.value = true;
  }

  // 取消编辑角色
  function cancelEditRole() {
    showEditRoleDialog.value = false;
    editingRoleIndex.value = -1;
    // 恢复原始数据
    newRole.value = { ...tempRoleBackup.value };
  }

  // 保存编辑的角色
  async function saveEditedRole() {
    if (!newRole.value.label || !newRole.value.value) {
      alert('请填写角色名称和系统提示词');
      return;
    }

    try {
      await invoke('add_custom_role', {
        role: {
          icon: newRole.value.icon,
          label: newRole.value.label,
          value: newRole.value.value,
        },
      });

      // 重新加载角色列表
      await loadCustomRoles();

      // 重置表单
      newRole.value = {
        icon: '🚀',
        label: '',
        value: '',
      };
      editingRoleIndex.value = -1;
      showEditRoleDialog.value = false;

      alert('角色已更新');
    } catch (error) {
      console.error('更新角色失败:', error);
      alert('更新角色失败：' + error);
    }
  }

  // 组件挂载时加载角色
  onMounted(() => {
    loadCustomRoles();
  });

  // 预设提示词
  const presetPrompts = [
    { label: '💻 编程助手', value: '你是一个专业的 AI 编程助手，擅长代码编写、调试和优化。' },
    { label: '📝 文案专家', value: '你是专业的文案写作专家，擅长创作吸引人的营销内容。' },
    { label: '🔬 学术顾问', value: '你是学术研究顾问，能提供专业的学术建议和指导。' },
    { label: '🎨 创意助手', value: '你是富有创意的 AI 助手，能帮助进行头脑风暴和创意构思。' },
  ];

  function setSystemPrompt(value: string) {
    localSystemPrompt.value = value;
    updateSettings();
  }

  function getCurrentRoleName() {
    const preset = presetPrompts.find((p) => p.value === localSystemPrompt.value);
    return preset ? preset.label : '自定义角色';
  }

  function updateSettings() {
    emit('update:settings', {
      systemPrompt: localSystemPrompt.value,
      temperature: temperature.value,
      maxTokens: maxTokens.value,
    });
  }

  function resetToDefaults() {
    localSystemPrompt.value = '你是一个有用的 AI 编程助手。';
    temperature.value = 0.7;
    maxTokens.value = 2048;
    contextConfig.value = {
      maxTokens: 8192,
      compressionLevel: 'light',
      keepCodeBlocks: true,
      keepErrors: true,
      recentRounds: 10,
    };
    updateSettings();
  }

  // 加载上下文配置
  async function loadContextConfig() {
    try {
      const config: any = await invoke('load_app_config');
      if (config.contextConfig) {
        contextConfig.value = { ...contextConfig.value, ...config.contextConfig };
      }
    } catch (error) {
      console.error('加载上下文配置失败:', error);
    }
  }

  // 保存上下文配置
  async function saveContextConfig() {
    try {
      const config: any = await invoke('load_app_config');
      config.contextConfig = contextConfig.value;
      await invoke('save_app_config', { config });
    } catch (error) {
      console.error('保存上下文配置失败:', error);
    }
  }

  onMounted(() => {
    loadCustomRoles();
    loadContextConfig();
  });
</script>

<style scoped>
  .settings-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-primary, white);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    background: var(--bg-secondary, #f8f9fa);
  }

  .panel-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  .close-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 24px;
    color: var(--text-secondary, #666);
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--hover-bg, #f0f0f0);
    color: var(--text-primary, #333);
  }

  .panel-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }

  .setting-section {
    margin-bottom: 24px;
  }

  .section-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #333);
    margin-bottom: 8px;
  }

  .system-prompt-input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    transition: border-color 0.2s;
  }

  .system-prompt-input:focus {
    outline: none;
    border-color: var(--primary-color, #4a90e2);
  }

  .preset-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .preset-btn {
    padding: 6px 12px;
    background: var(--bg-secondary, #f5f5f5);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .preset-btn:hover {
    background: var(--primary-color, #4a90e2);
    border-color: var(--primary-color, #4a90e2);
    color: white;
  }

  .preset-btn.active {
    background: var(--primary-color, #4a90e2);
    border-color: var(--primary-color, #4a90e2);
    color: white;
    font-weight: 600;
  }

  .current-role-display {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-success, #e6f7e6);
    border: 1px solid var(--border-success, #52c41a);
    border-radius: 6px;
    margin-bottom: 12px;
  }

  .role-icon {
    font-size: 16px;
  }

  .role-text {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-success, #389e0d);
  }

  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(
      to right,
      var(--primary-color, #4a90e2) 0%,
      var(--primary-color, #4a90e2) var(--value, 70%),
      var(--border-color, #ddd) var(--value, 70%),
      var(--border-color, #ddd) 100%
    );
    outline: none;
    -webkit-appearance: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary-color, #4a90e2);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-secondary, #999);
  }

  /* 上下文压缩配置样式 */
  .context-config-item {
    margin-bottom: 16px;
  }

  .config-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary, #333);
    margin-bottom: 6px;
  }

  .config-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-size: 13px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .config-select:focus {
    outline: none;
    border-color: var(--primary-color, #4a90e2);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
  }

  .config-checkboxes {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-primary, #333);
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .setting-actions {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color, #e0e0e0);
  }

  .reset-btn {
    width: 100%;
    padding: 12px;
    background: var(--bg-secondary, #f5f5f5);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-btn:hover {
    background: var(--hover-bg, #e0e0e0);
    border-color: var(--border-color, #ccc);
  }

  /* 角色管理 */
  .btn-add-role-panel {
    padding: 6px 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
    white-space: nowrap;
  }

  .btn-add-role-panel:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .custom-roles-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .role-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--bg-secondary, #f5f5f5);
    border: 2px solid var(--border-color, #ddd);
    border-radius: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .role-item:hover {
    background: var(--bg-hover, #e8e8e8);
    border-color: var(--primary-color, #4a90e2);
    transform: translateX(2px);
  }

  .role-item.role-selected {
    background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
  }

  .role-info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }

  .role-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .role-name-display {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  .role-prompt-display {
    font-size: 12px;
    color: var(--text-secondary, #999);
    line-height: 1.4;
  }

  .role-actions {
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .role-item:hover .role-actions {
    opacity: 1;
  }

  .btn-edit-role,
  .btn-delete-role {
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.7;
  }

  .btn-edit-role:hover {
    background: #1890ff;
    border-color: #1890ff;
    color: white;
    opacity: 1;
    transform: scale(1.05);
  }

  .btn-delete-role {
    opacity: 0.7;
  }

  .btn-delete-role:hover {
    background: #ff4d4f;
    border-color: #ff4d4f;
    color: white;
    opacity: 1;
    transform: scale(1.05);
  }

  .no-roles-hint {
    text-align: center;
    padding: 24px;
    color: var(--text-secondary, #999);
    font-size: 14px;
  }

  /* 对话框优化 */
  .dialog-add-role {
    max-width: 520px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #333);
    margin: 0 0 20px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .form-group-icon,
  .form-group-name {
    margin-bottom: 0;
  }

  .input-icon {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 20px;
    text-align: center;
    transition: all 0.2s;
    background: white;
  }

  .input-icon:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }

  .form-label {
    font-size: 14px;
    font-weight: 600;
    color: #555;
    margin-bottom: 8px;
    display: block;
  }

  .form-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;
    background: white;
  }

  .form-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }

  .form-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    transition: all 0.2s;
    line-height: 1.6;
    background: white;
    min-height: 100px;
  }

  .form-textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }

  .btn-dialog-cancel {
    padding: 8px 20px;
    background: white;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-dialog-cancel:hover {
    color: #667eea;
    border-color: #667eea;
  }

  .btn-dialog-confirm {
    padding: 8px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-dialog-confirm:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* Agent 配置按钮 */
  .btn-agent-config {
    width: 100%;
    padding: 12px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-agent-config:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  /* Agent 配置对话框 */
  .dialog-agent-config .dialog-content {
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
</style>
