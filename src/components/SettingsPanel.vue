<template>
  <NLayout style="height: 100%;">
    <NLayoutHeader bordered style="padding: 12px 16px;">
      <NSpace justify="space-between" align="center">
        <NText strong>模型设置</NText>
        <NButton quaternary circle size="small" @click="$emit('close')">×</NButton>
      </NSpace>
    </NLayoutHeader>

    <NLayoutContent style="padding: 12px;">
      <!-- 系统提示词 -->
      <NCard size="small" :bordered="false" style="margin-bottom: 12px;">
        <template #header>
          <NText strong>系统角色设定</NText>
        </template>

        <NSpace vertical :size="12">
          <NSpace :size="8" wrap>
            <NButton
              v-for="preset in presetPrompts"
              :key="preset.value"
              size="small"
              :type="localSystemPrompt === preset.value ? 'primary' : 'default'"
              @click="setSystemPrompt(preset.value)"
            >
              {{ preset.icon }} {{ preset.label }}
            </NButton>
          </NSpace>

          <NInput
            v-model:value="localSystemPrompt"
            type="textarea"
            placeholder="输入系统提示词..."
            :rows="3"
            @change="updateSettings"
          />
        </NSpace>
      </NCard>

      <!-- 温度和最大输出 -->
      <NCard size="small" :bordered="false" style="margin-bottom: 12px;">
        <template #header>
          <NText strong>参数设置</NText>
        </template>

        <NSpace vertical :size="16">
          <div>
            <NSpace justify="space-between">
              <NText depth="3">温度 (Temperature)</NText>
              <NText>{{ temperature }}</NText>
            </NSpace>
            <NSlider
              v-model:value="temperature"
              :min="0"
              :max="1"
              :step="0.1"
              @update:value="updateSettings"
            />
          </div>

          <div>
            <NSpace justify="space-between">
              <NText depth="3">最大输出长度</NText>
              <NText>{{ maxTokens }} tokens</NText>
            </NSpace>
            <NSlider
              v-model:value="maxTokens"
              :min="256"
              :max="8192"
              :step="256"
              @update:value="updateSettings"
            />
          </div>
        </NSpace>
      </NCard>

      <!-- 自定义角色 -->
      <NCard size="small" :bordered="false" style="margin-bottom: 12px;">
        <template #header>
          <NText strong>自定义角色</NText>
        </template>
        <template #header-extra>
          <NButton size="small" type="primary" @click="openAddDialog">
            + 添加
          </NButton>
        </template>

        <NList v-if="customRoles.length > 0" hoverable clickable>
          <NListItem
            v-for="(role, index) in customRoles"
            :key="index"
            :style="localSystemPrompt === role.value ? { backgroundColor: 'var(--n-primary-color-suppl)', borderLeft: '3px solid var(--n-primary-color)' } : undefined"
            @click="selectCustomRole(role)"
          >
            <NThing>
              <template #header>
                <NSpace align="center" :size="8">
                  <span>{{ role.icon }}</span>
                  <NText>{{ role.label }}</NText>
                  <NTag v-if="localSystemPrompt === role.value" size="tiny" type="success">当前</NTag>
                </NSpace>
              </template>
              <template #header-extra>
                <NSpace :size="4" @click.stop>
                  <NButton size="tiny" quaternary @click="openEditDialog(index)">✏️</NButton>
                  <NButton size="tiny" quaternary type="error" @click="handleDeleteRole(index)">🗑️</NButton>
                </NSpace>
              </template>
              <template #description>
                <NText depth="3" style="font-size: 12px;">
                  {{ role.value.substring(0, 60) }}{{ role.value.length > 60 ? '...' : '' }}
                </NText>
              </template>
            </NThing>
          </NListItem>
        </NList>

        <NEmpty v-else description="暂无自定义角色" />
      </NCard>

      <!-- 操作按钮 -->
      <NCard size="small" :bordered="false">
        <NSpace>
          <NButton @click="handleResetDefaults" type="warning" secondary>
            恢复默认设置
          </NButton>
          <NButton @click="openDevTools" secondary>
            打开调试工具
          </NButton>
        </NSpace>
      </NCard>
    </NLayoutContent>
  </NLayout>

  <!-- 添加/编辑角色对话框 -->
  <NModal v-model:show="showRoleDialog" preset="card" :title="isEditing ? '编辑角色' : '添加自定义角色'" style="max-width: 480px;">
    <NForm>
      <NFormItem label="角色图标">
        <NInput v-model:value="formData.icon" placeholder="🚀" maxlength="2" style="width: 80px;" />
      </NFormItem>
      <NFormItem label="角色名称">
        <NInput v-model:value="formData.label" placeholder="例如：翻译助手" maxlength="10" />
      </NFormItem>
      <NFormItem label="系统提示词">
        <NInput
          v-model:value="formData.value"
          type="textarea"
          placeholder="描述角色的职责和能力..."
          :rows="4"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="showRoleDialog = false">取消</NButton>
        <NButton @click="handleSaveRole" type="primary" :disabled="!formData.label || !formData.value">
          {{ isEditing ? '保存' : '确定添加' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
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
import { showError, showSuccess, showConfirm } from '../utils/message';
import { error as logError } from '../utils/logger';

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

// 预设角色
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
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_devtools');
    showSuccess('调试工具已打开');
  } catch (error) {
    logError('SettingsPanel', '打开调试工具失败:', error);
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

// 保存角色
async function handleSaveRole() {
  if (!formData.value.label || !formData.value.value) {
    showError('请填写角色名称和系统提示词');
    return;
  }

  try {
    if (isEditing.value) {
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

  showConfirm(
    '删除角色',
    `确定要删除角色 "${role.icon} ${role.label}" 吗？`,
    async () => {
      try {
        await deleteCustomRoleUtil(index);
        await loadRoles();
        showSuccess('角色已删除');
      } catch (error) {
        showError('删除角色失败：' + error);
      }
    }
  );
}

onMounted(() => {
  loadRoles();
});
</script>
