<template>
  <n-layout class="settings-panel">
    <n-layout-header bordered style="padding: 12px 16px;">
      <n-space justify="space-between" align="center">
        <n-text strong>模型设置</n-text>
        <n-button quaternary circle size="small" @click="$emit('close')">×</n-button>
      </n-space>
    </n-layout-header>

    <n-layout-content style="padding: 12px;">
      <!-- 系统提示词 -->
      <n-card size="small" :bordered="false" style="margin-bottom: 12px;">
        <template #header>
          <n-text strong>系统角色设定</n-text>
        </template>

        <n-space vertical :size="12">
          <n-space :size="8" wrap>
            <n-button
              v-for="preset in presetPrompts"
              :key="preset.value"
              size="small"
              :type="localSystemPrompt === preset.value ? 'primary' : 'default'"
              @click="setSystemPrompt(preset.value)"
            >
              {{ preset.icon }} {{ preset.label }}
            </n-button>
          </n-space>

          <n-input
            v-model:value="localSystemPrompt"
            type="textarea"
            placeholder="输入系统提示词..."
            :rows="3"
            @change="updateSettings"
          />
        </n-space>
      </n-card>

      <!-- 温度和最大输出 -->
      <n-card size="small" :bordered="false" style="margin-bottom: 12px;">
        <template #header>
          <n-text strong>参数设置</n-text>
        </template>

        <n-space vertical :size="16">
          <div>
            <n-space justify="space-between">
              <n-text depth="3">温度 (Temperature)</n-text>
              <n-text>{{ temperature }}</n-text>
            </n-space>
            <n-slider
              v-model:value="temperature"
              :min="0"
              :max="1"
              :step="0.1"
              @update:value="updateSettings"
            />
          </div>

          <div>
            <n-space justify="space-between">
              <n-text depth="3">最大输出长度</n-text>
              <n-text>{{ maxTokens }} tokens</n-text>
            </n-space>
            <n-slider
              v-model:value="maxTokens"
              :min="256"
              :max="8192"
              :step="256"
              @update:value="updateSettings"
            />
          </div>
        </n-space>
      </n-card>

      <!-- 自定义角色 -->
      <n-card size="small" :bordered="false" style="margin-bottom: 12px;">
        <template #header>
          <n-text strong>自定义角色</n-text>
        </template>
        <template #header-extra>
          <n-button size="small" type="primary" @click="openAddDialog">
            + 添加
          </n-button>
        </template>

        <n-list v-if="customRoles.length > 0" hoverable clickable>
          <n-list-item
            v-for="(role, index) in customRoles"
            :key="index"
            :class="{ 'role-selected': localSystemPrompt === role.value }"
            @click="selectCustomRole(role)"
          >
            <n-thing>
              <template #header>
                <n-space align="center" :size="8">
                  <span>{{ role.icon }}</span>
                  <n-text>{{ role.label }}</n-text>
                  <n-tag v-if="localSystemPrompt === role.value" size="tiny" type="success">当前</n-tag>
                </n-space>
              </template>
              <template #header-extra>
                <n-space :size="4" @click.stop>
                  <n-button size="tiny" quaternary @click="openEditDialog(index)">✏️</n-button>
                  <n-button size="tiny" quaternary type="error" @click="handleDeleteRole(index)">🗑️</n-button>
                </n-space>
              </template>
              <template #description>
                <n-text depth="3" style="font-size: 12px;">
                  {{ role.value.substring(0, 60) }}{{ role.value.length > 60 ? '...' : '' }}
                </n-text>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>

        <n-empty v-else description="暂无自定义角色" />
      </n-card>

      <!-- 操作按钮 -->
      <n-card size="small" :bordered="false">
        <n-space>
          <n-button @click="handleResetDefaults" type="warning" secondary>
            恢复默认设置
          </n-button>
          <n-button @click="openDevTools" secondary>
            打开调试工具
          </n-button>
        </n-space>
      </n-card>
    </n-layout-content>
  </n-layout>

  <!-- 添加/编辑角色对话框 -->
  <n-modal v-model:show="showRoleDialog" preset="card" :title="isEditing ? '编辑角色' : '添加自定义角色'" style="max-width: 480px;">
    <n-form>
      <n-form-item label="角色图标">
        <n-input v-model:value="formData.icon" placeholder="🚀" maxlength="2" style="width: 80px;" />
      </n-form-item>
      <n-form-item label="角色名称">
        <n-input v-model:value="formData.label" placeholder="例如：翻译助手" maxlength="10" />
      </n-form-item>
      <n-form-item label="系统提示词">
        <n-input
          v-model:value="formData.value"
          type="textarea"
          placeholder="描述角色的职责和能力..."
          :rows="4"
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showRoleDialog = false">取消</n-button>
        <n-button @click="handleSaveRole" type="primary" :disabled="!formData.label || !formData.value">
          {{ isEditing ? '保存' : '确定添加' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NLayout, NLayoutHeader, NLayoutContent,
  NSpace, NText, NButton, NInput, NSlider, NTag,
  NCard, NList, NListItem, NThing, NEmpty, NModal, NForm, NFormItem,
} from 'naive-ui';
import type { CustomRole } from '../types';
import {
  loadCustomRoles as fetchCustomRoles,
  addCustomRole,
  deleteCustomRole as deleteCustomRoleUtil,
} from '../utils/configUtils';
import { DEFAULTS, DEFAULT_ROLES, APP_CONSTANTS } from '../constants';
import { error as logError } from '../utils/logger';
import { showError, showSuccess, showConfirm, showDeleteConfirm } from '../utils/message';

interface SettingsPanelProps {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

const props = withDefaults(defineProps<SettingsPanelProps>(), {
  systemPrompt: DEFAULTS.SYSTEM_PROMPT,
  temperature: APP_CONSTANTS.DEFAULT_TEMPERATURE,
  maxTokens: APP_CONSTANTS.DEFAULT_MAX_TOKENS,
});

const emit = defineEmits<{
  close: [];
  'update:settings': [settings: { systemPrompt: string; temperature: number; maxTokens: number }];
  'role-added': [];
}>();

const localSystemPrompt = ref(props.systemPrompt);
const temperature = ref(props.temperature);
const maxTokens = ref(props.maxTokens);

// 角色对话框状态
const showRoleDialog = ref(false);
const isEditing = ref(false);
const editingRoleIndex = ref(-1);
const formData = ref({ icon: '🚀', label: '', value: '' });
const customRoles = ref<CustomRole[]>([]);

// 预设角色（使用统一的常量定义）
const presetPrompts = DEFAULT_ROLES.map(role => ({ label: role.label, value: role.value, icon: role.icon }));

function setSystemPrompt(value: string) {
  localSystemPrompt.value = value;
  updateSettings();
}

function selectCustomRole(role: CustomRole) {
  localSystemPrompt.value = role.value;
  updateSettings();
}

function updateSettings() {
  emit('update:settings', {
    systemPrompt: localSystemPrompt.value,
    temperature: temperature.value,
    maxTokens: maxTokens.value,
  });
}

// 恢复默认设置
function handleResetDefaults() {
  showConfirm(
    '恢复默认设置',
    '确定要恢复所有设置为默认值吗？',
    () => {
      localSystemPrompt.value = DEFAULTS.SYSTEM_PROMPT;
      temperature.value = APP_CONSTANTS.DEFAULT_TEMPERATURE;
      maxTokens.value = APP_CONSTANTS.DEFAULT_MAX_TOKENS;
      updateSettings();
      showSuccess('已恢复默认设置');
    }
  );
}

// 打开调试工具
async function openDevTools() {
  try {
    const { getCurrentWebview } = await import('@tauri-apps/api/webview');
    const webview = getCurrentWebview();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((webview as any).openDevTools) {
      await (webview as any).openDevTools();
    }
  } catch {
    showError('调试工具不可用');
  }
}

// 加载角色列表
async function loadRoles() {
  customRoles.value = await fetchCustomRoles();
}

// 打开添加对话框
function openAddDialog() {
  isEditing.value = false;
  editingRoleIndex.value = -1;
  formData.value = { icon: '🚀', label: '', value: '' };
  showRoleDialog.value = true;
}

// 打开编辑对话框
function openEditDialog(index: number) {
  const role = customRoles.value[index];
  if (!role) {
    showError('未找到该角色');
    return;
  }
  isEditing.value = true;
  editingRoleIndex.value = index;
  formData.value = { icon: role.icon, label: role.label, value: role.value };
  showRoleDialog.value = true;
}

// 保存角色（添加或编辑）
async function handleSaveRole() {
  if (!formData.value.label || !formData.value.value) {
    showError('请填写角色名称和系统提示词');
    return;
  }

  try {
    if (isEditing.value) {
      // 先删除旧角色，再添加更新后的角色
      await deleteCustomRoleUtil(editingRoleIndex.value);
    }
    await addCustomRole({
      icon: formData.value.icon,
      label: formData.value.label,
      value: formData.value.value,
    });
    await loadRoles();
    showRoleDialog.value = false;
    emit('role-added');
    showSuccess(isEditing.value ? '角色已更新' : '角色已添加');
  } catch (error) {
    showError((isEditing.value ? '更新' : '添加') + '角色失败：' + error);
  }
}

// 删除角色
async function handleDeleteRole(index: number) {
  const role = customRoles.value[index];
  if (!role) return;

  showDeleteConfirm(`${role.icon} ${role.label}`, async () => {
    try {
      await deleteCustomRoleUtil(index);
      await loadRoles();
      showSuccess('角色已删除');
    } catch (error) {
      showError('删除角色失败：' + error);
    }
  });
}

onMounted(() => {
  loadRoles();
});
</script>

<style scoped>
.settings-panel {
  height: 100%;
}

.role-selected {
  background-color: var(--n-primary-color-suppl) !important;
  border-left: 3px solid var(--n-primary-color);
}
</style>
