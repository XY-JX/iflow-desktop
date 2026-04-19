<template>
  <div class="settings-panel">
    <div class="panel-header">
      <span class="panel-title">⚙️ 模型设置</span>
      <n-button quaternary circle class="close-btn" @click="$emit('close')">
        <template #icon>×</template>
      </n-button>
    </div>

    <div class="panel-content">
      <!-- 系统提示词 -->
      <div class="setting-section">
        <label class="section-label">🤖 系统角色设定</label>
        <div class="current-role-display" v-if="localSystemPrompt">
          <span class="role-icon">✅</span>
          <span class="role-text">当前角色：{{ getCurrentRoleName() }}</span>
        </div>
        <n-input
          v-model:value="localSystemPrompt"
          type="textarea"
          class="system-prompt-input"
          placeholder="输入系统提示词，例如：你是一个有帮助的 AI 助手..."
          :rows="4"
          @change="updateSettings"
        />
        <div class="preset-prompts">
          <n-button
            size="small"
            :class="{ active: localSystemPrompt === preset.value }"
            v-for="preset in presetPrompts"
            :key="preset.value"
            @click="setSystemPrompt(preset.value)"
          >
            {{ preset.label }}
          </n-button>
        </div>
      </div>

      <!-- 温度参数 -->
      <div class="setting-section">
        <label class="section-label">🌡️ 温度 (Temperature): {{ temperature }}</label>
        <n-slider
          v-model:value="temperature"
          :min="0"
          :max="1"
          :step="0.1"
          class="slider"
          @update:value="updateSettings"
        />
        <div class="slider-labels">
          <span>精准 (0)</span>
          <span>随机 (1)</span>
        </div>
      </div>

      <!-- 最大 Token 数 -->
      <div class="setting-section">
        <label class="section-label">📏 最大输出长度 (Tokens): {{ maxTokens }}</label>
        <n-slider
          v-model:value="maxTokens"
          :min="256"
          :max="8192"
          :step="256"
          class="slider"
          @update:value="updateSettings"
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
          <n-select 
            v-model:value="contextConfig.compressionLevel" 
            @update:value="updateSettings" 
            class="config-select"
            :options="[
              { label: '不压缩', value: 'none' },
              { label: '轻度压缩', value: 'light' },
              { label: '激进压缩', value: 'aggressive' }
            ]"
          />
        </div>

        <!-- 保留最近轮数 -->
        <div class="context-config-item">
          <label class="config-label">保留最近对话轮数: {{ contextConfig.recentRounds }}</label>
          <n-slider
            v-model:value="contextConfig.recentRounds"
            :min="0"
            :max="20"
            :step="1"
            class="slider"
            @update:value="updateSettings"
          />
          <div class="slider-labels">
            <span>不限 (0)</span>
            <span>20 轮</span>
          </div>
        </div>

        <!-- 保护选项 -->
        <div class="context-config-item config-checkboxes">
          <n-checkbox v-model:checked="contextConfig.keepCodeBlocks" @update:checked="updateSettings">
            🔒 保护代码块
          </n-checkbox>
          <n-checkbox v-model:checked="contextConfig.keepErrors" @update:checked="updateSettings">
            🔒 保护错误信息
          </n-checkbox>
        </div>
      </div>

      <!-- 重置按钮 -->
      <div class="setting-actions">
        <n-button @click="resetToDefaults">🔄 恢复默认设置</n-button>
        <n-button @click="openDevTools">🐛 打开调试工具</n-button>
      </div>



      <!-- 自定义角色管理 -->
      <div class="setting-section">
        <div class="section-header">
          <label class="section-label">🎭 自定义角色管理</label>
          <n-button @click="showAddRoleDialog = true" type="primary" size="small" title="添加新角色">
            ➕ 添加角色
          </n-button>
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
              <n-button @click="editCustomRole(index)" size="tiny" quaternary title="编辑此角色">
                ✏️
              </n-button>
              <n-button @click="deleteCustomRole(index)" size="tiny" quaternary title="删除此角色">
                🗑️
              </n-button>
            </div>
          </div>
        </div>

        <div v-else class="no-roles-hint">
          <p>暂无自定义角色，点击上方按钮添加</p>
        </div>
      </div>
    </div>

    <!-- 添加角色对话框 -->
    <n-modal v-model:show="showAddRoleDialog" class="dialog-add-role">
      <div class="dialog-content">
        <h3 class="dialog-title">➕ 添加自定义角色</h3>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group form-group-icon">
              <label class="form-label">角色图标</label>
              <n-input
                v-model:value="newRole.icon"
                class="form-input input-icon"
                placeholder="🚀"
                maxlength="2"
              />
            </div>
            <div class="form-group form-group-name">
              <label class="form-label">角色名称</label>
              <n-input
                v-model:value="newRole.label"
                class="form-input"
                placeholder="例如：翻译助手"
                maxlength="10"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">系统提示词</label>
            <n-input
              v-model:value="newRole.value"
              type="textarea"
              class="form-textarea"
              placeholder="描述这个角色的职责和能力...\n\n例如：你是专业的翻译助手，精通多国语言翻译..."
              :rows="5"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <n-button @click="cancelAddRoleHandler" class="btn-dialog-cancel">取消</n-button>
          <n-button @click="handleAddRole" type="primary" class="btn-dialog-confirm">确定添加</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 编辑角色对话框 -->
    <n-modal v-model:show="showEditRoleDialog" class="dialog-add-role">
      <div class="dialog-content">
        <h3 class="dialog-title">✏️ 编辑自定义角色</h3>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group form-group-icon">
              <label class="form-label">角色图标</label>
              <n-input
                v-model:value="newRole.icon"
                class="form-input input-icon"
                placeholder="🚀"
                maxlength="2"
              />
            </div>
            <div class="form-group form-group-name">
              <label class="form-label">角色名称</label>
              <n-input
                v-model:value="newRole.label"
                class="form-input"
                placeholder="例如：翻译助手"
                maxlength="10"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">系统提示词</label>
            <n-input
              v-model:value="newRole.value"
              type="textarea"
              class="form-textarea"
              placeholder="描述这个角色的职责和能力..."
              :rows="5"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <n-button @click="cancelEditRoleHandler" class="btn-dialog-cancel">取消</n-button>
          <n-button @click="saveEditedRole" type="primary" class="btn-dialog-confirm">保存修改</n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { NButton, NInput, NSlider, NSelect, NModal, NCheckbox } from 'naive-ui';
  import type { ContextConfig, CustomRole } from '../types';
  import { loadCustomRoles as fetchCustomRoles, addCustomRole, deleteCustomRole as deleteCustomRoleUtil, loadAppConfig, saveAppConfig } from '../utils/configUtils';
  import { useDialog } from '../composables';
  import { error as logError } from '../utils/logger';

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
  const { show: showAddRoleDialog, close: cancelAddRole } = useDialog();
  const { show: showEditRoleDialog, close: cancelEditRole } = useDialog();
  const editingRoleIndex = ref(-1);
  const newRole = ref({
    icon: '🚀',
    label: '',
    value: '',
  });

  // 自定义角色存储
  const customRoles = ref<CustomRole[]>([]);

  // 加载自定义角色 (从本地文件)
  async function loadCustomRoles() {
    customRoles.value = await fetchCustomRoles();
  }

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
      await addCustomRole({
        icon: newRole.value.icon,
        label: newRole.value.label,
        value: newRole.value.value,
      });

      // 重新加载角色列表
      await loadCustomRoles();

      // 重置表单
      newRole.value = {
        icon: '🚀',
        label: '',
        value: '',
      };

      cancelAddRole();

      // 通知父组件角色已添加
      emit('role-added');
    } catch (error) {
      alert('添加角色失败：' + error);
    }
  }

  // 取消添加角色
  function cancelAddRoleHandler() {
    cancelAddRole();
    // 不重置表单，保留用户输入
  }

  // 选择自定义角色
  function selectCustomRole(role: CustomRole) {
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
      await deleteCustomRoleUtil(index);
      // 重新加载角色列表
      await loadCustomRoles();
      alert(`角色 "${role.icon} ${role.label}" 已删除`);
    } catch (error) {
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
  function cancelEditRoleHandler() {
    cancelEditRole();
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
      await addCustomRole({
        icon: newRole.value.icon,
        label: newRole.value.label,
        value: newRole.value.value,
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
      cancelEditRole();

      alert('角色已更新');
    } catch (error) {
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

  // 打开开发者工具
  async function openDevTools() {
    try {
      const { getCurrentWebview } = await import('@tauri-apps/api/webview');
      const webview = getCurrentWebview();
      // @ts-ignore - Tauri 2.0 API
      await webview.openDevTools();
    } catch (error) {
      logError('SettingsPanel', '打开开发者工具失败:', error);
      alert('无法打开开发者工具: ' + error);
    }
  }

  // 加载上下文配置
  async function loadContextConfig() {
    try {
      const config = await loadAppConfig();
      if (config.contextConfig) {
        contextConfig.value = { ...contextConfig.value, ...config.contextConfig };
      }
    } catch (error) {
      logError('SettingsPanel', '加载上下文配置失败:', error);
    }
  }

  // 保存上下文配置
  async function saveContextConfig() {
    try {
      const config = await loadAppConfig();
      config.contextConfig = contextConfig.value;
      await saveAppConfig(config);
    } catch (error) {
      logError('SettingsPanel', '保存上下文配置失败:', error);
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
  }

  .close-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 24px;
    border-radius: 4px;
    transition: all 0.2s;
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
    margin-bottom: 8px;
  }

  .system-prompt-input {
    width: 100%;
  }

  .preset-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .current-role-display {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 12px;
    background: var(--n-success-color);
    border: 1px solid var(--n-success-border-color);
  }

  .role-icon {
    font-size: 16px;
  }

  .role-text {
    font-size: 13px;
    font-weight: 600;
    color: var(--n-success-text-color);
  }

  /* 上下文压缩配置样式 */
  .context-config-item {
    margin-bottom: 16px;
  }

  .config-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
  }

  .config-checkboxes {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 12px;
    color: var(--n-text-color-3);
  }

  .setting-actions {
    margin-top: 32px;
    padding-top: 16px;
  }

  /* 角色管理 */
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
    border: 2px solid var(--n-border-color);
    border-radius: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .role-item:hover {
    background: var(--n-action-color);
    border-color: var(--n-primary-color);
    transform: translateX(2px);
  }

  .role-item.role-selected {
    background: var(--n-primary-color-suppl);
    border-color: var(--n-primary-color);
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
  }

  .role-prompt-display {
    font-size: 12px;
    color: var(--n-text-color-3);
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

  .no-roles-hint {
    text-align: center;
    padding: 24px;
    color: var(--n-text-color-3);
    font-size: 14px;
  }

  /* 对话框优化 */
  .dialog-add-role {
    max-width: 520px;
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
    border-radius: 6px;
    font-size: 20px;
    text-align: center;
    transition: all 0.2s;
  }

  .input-icon:focus {
    border-color: var(--n-primary-color);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
</style>
