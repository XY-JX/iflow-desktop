<template>
  <n-layout has-sider class="main-layout">
    <!-- 左侧：对话历史 -->
    <n-layout-sider
      bordered
      :width="260"
      :collapsed-width="0"
      collapse-mode="width"
      show-trigger="bar"
      content-style="padding: 0;"
    >
      <ChatHistory
        :conversations="conversations"
        :active-conversation-id="activeConversationId"
        @new-chat="handleNewChat"
        @select-conversation="handleSelectConversation"
        @delete-conversation="handleDeleteConversation"
      />
    </n-layout-sider>

    <!-- 中间：聊天区域 -->
    <n-layout content-style="display: flex; flex-direction: column; height: 100vh;">
      <n-layout-header bordered style="padding: 0;">
        <TopToolbar
          :zhipu-ready="zhipuReady"
          :zhipu-status="zhipuStatus"
          v-model:system-prompt="chatHandler.systemPrompt.value"
          :role-options="quickRoleOptions"
          :message-count="exportHandler.currentMessageCount.value"
          :token-count="exportHandler.estimatedTokens.value"
          @open-api-key-dialog="openApiKeyDialog"
          @toggle-settings="showSettingsPanel = !showSettingsPanel"
          @toggle-stats="showStatsPanel = !showStatsPanel"
        />
      </n-layout-header>
      <n-layout-content content-style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
        <ChatInterface
          :messages="currentMessages"
          :is-generating="chatHandler.isGenerating.value"
          @send-message="handleSendMessage"
          @clear-conversation="handleClearConversation"
          @export-conversation="exportHandler.exportAsMarkdown"
          @export-pdf="exportHandler.exportAsPDF"
          @copy-last-answer="exportHandler.copyLastAnswer"
          @apply-template="applyPromptTemplate"
          @save-code-snippet="handleSaveCodeSnippet"
        />
      </n-layout-content>
    </n-layout>

    <!-- 右侧：工具面板 -->
    <n-layout-sider
      bordered
      :width="300"
      :collapsed-width="0"
      collapse-mode="width"
      show-trigger="bar"
      content-style="padding: 0;"
    >
      <template v-if="showSettingsPanel">
        <Suspense>
          <template #default>
            <SettingsPanel
              :system-prompt="chatHandler.systemPrompt.value"
              :temperature="chatHandler.temperature.value"
              :max-tokens="chatHandler.maxTokens.value"
              @close="showSettingsPanel = false"
              @update:settings="handleSettingsUpdate"
              @role-added="handleRoleAdded"
            />
          </template>
          <template #fallback>
            <n-card size="small">
              <n-skeleton :repeat="5" size="medium" />
            </n-card>
          </template>
        </Suspense>
      </template>

      <template v-else-if="showStatsPanel">
        <Suspense>
          <template #default>
            <StatsPanel :conversations="conversations" @close="showStatsPanel = false" />
          </template>
          <template #fallback>
            <n-card size="small">
              <n-skeleton :repeat="3" size="large" />
            </n-card>
          </template>
        </Suspense>
      </template>

      <div v-else class="tools-container">
          <QuickToolsPanel
            :active-tab="activeToolTab"
            :tabs="toolTabs"
            :snippets="quickTools.codeSnippets.value"
            :links="quickTools.quickLinks.value"
            :notes="quickTools.quickNotes.value"
            @tab-change="activeToolTab = $event"
            @add-snippet="quickTools.showAddSnippetDialog"
            @copy-snippet="quickTools.copySnippet"
            @delete-snippet="quickTools.handleDeleteSnippet"
            @add-link="quickTools.showAddLinkDialog"
            @delete-link="quickTools.handleDeleteLink"
            @add-note="quickTools.handleAddNote"
            @save-notes="quickTools.handleSaveNotes"
            @delete-note="quickTools.handleDeleteNote"
          />

        <div v-if="chatHandler.latestThinking.value" class="thinking-footer">
          <n-card size="small" title="思考过程" :bordered="false">
            <n-text depth="3" style="font-size: 12px; white-space: pre-wrap; font-family: monospace;">
              {{ chatHandler.latestThinking.value }}
            </n-text>
          </n-card>
        </div>
      </div>
    </n-layout-sider>
  </n-layout>

  <!-- 文件编辑器 -->
  <n-drawer
    v-model:show="showEditor"
    :width="500"
    placement="right"
    :trap-focus="false"
  >
    <n-drawer-content title="文件编辑器" closable>
      <FileEditor v-if="selectedFile" :file="selectedFile" @close="clearSelection" />
    </n-drawer-content>
  </n-drawer>

  <!-- API Key 对话框 -->
  <ApiKeyDialog
    ref="apiKeyDialogRef"
    v-model:visible="showApiKeyDialog"
    :zhipu-ready="zhipuReady"
    @clear-key="handleClearKey"
    @save-key="handleSaveKey"
  />

  <!-- 统一输入对话框 -->
  <InputDialog
    :visible="quickTools.inputDialog.value.visible"
    :title="quickTools.inputDialog.value.title"
    :fields="quickTools.inputDialog.value.fields"
    @update:visible="quickTools.closeInputDialog"
    @submit="quickTools.inputDialog.value.onSubmit"
  />

  <!-- 快捷键帮助对话框 -->
  <KeyboardHelpDialog v-model:visible="showKeyboardHelp" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineAsyncComponent, watch } from 'vue';
import {
  NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NLayoutFooter,
  NCard, NSkeleton, NText
} from 'naive-ui';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../stores/chatStore';
import { useFileStore } from '../stores/fileStore';
import { loadCustomRoles as fetchCustomRoles } from '../utils/configUtils';
import { useKeyboardShortcuts, useApiKey, useConversationExport, useChatHandler, useQuickTools } from '../composables';
import { showSuccess, showError, showConfirm, showWarning, showDeleteConfirm } from '../utils/message';
import ChatHistory from './ChatHistory.vue';
import ChatInterface from './ChatInterface.vue';
import FileEditor from './FileEditor.vue';
import TopToolbar from './TopToolbar.vue';
import ApiKeyDialog from './ApiKeyDialog.vue';
import InputDialog from './InputDialog.vue';
import KeyboardHelpDialog from './KeyboardHelpDialog.vue';
import type { CustomRole } from '../types';
import { DEFAULT_ROLES } from '../constants';

// 懒加载大型组件
const SettingsPanel = defineAsyncComponent(() => import('./SettingsPanel.vue'));
const StatsPanel = defineAsyncComponent(() => import('./StatsPanel.vue'));
const QuickToolsPanel = defineAsyncComponent(() => import('./QuickToolsPanel.vue'));

// Stores
const chatStore = useChatStore();
const fileStore = useFileStore();
const { conversations, activeConversationId, currentMessages } = storeToRefs(chatStore);
const { selectedFile } = storeToRefs(fileStore);
const { clearSelection } = fileStore;

// 编辑器显示状态
const showEditor = computed({
  get: () => !!selectedFile.value,
  set: (val) => { if (!val) clearSelection(); },
});

// Composables
const apiKeyManager = useApiKey();
const chatHandler = useChatHandler();
const exportHandler = useConversationExport(
  conversations,
  activeConversationId,
  currentMessages,
);
const quickTools = useQuickTools();

const { zhipuReady, zhipuStatus, currentModel } = apiKeyManager;

// UI 状态
const showSettingsPanel = ref(false);
const showStatsPanel = ref(false);
const showApiKeyDialog = ref(false);
const showKeyboardHelp = ref(false);
const apiKeyDialogRef = ref<InstanceType<typeof ApiKeyDialog>>();
const activeToolTab = ref('totp');

// 工具标签页
const toolTabs = [
  { id: 'totp', icon: '🔐', label: '验证码' },
  { id: 'snippets', icon: '💾', label: '代码片段' },
  { id: 'links', icon: '🔗', label: '快速链接' },
  { id: 'notes', icon: '📝', label: '快捷笔记' },
];

// 自定义角色
const customRoles = ref<CustomRole[]>([]);

// 合并默认角色和自定义角色
const quickRoleOptions = computed(() => {
  const allRoles = [...DEFAULT_ROLES, ...customRoles.value];
  return allRoles.map((role) => ({
    label: `${role.icon} ${role.label}`,
    value: role.value,
  }));
});

// ========== 对话操作 ==========

function handleNewChat() {
  chatStore.createNewConversation('新对话', currentModel.value);
}

function handleSelectConversation(id: string) {
  chatStore.selectConversation(id);
  const conversation = conversations.value.find((c) => c.id === id);
  if (conversation) {
    currentModel.value = conversation.model;
  }
}

function handleDeleteConversation(id: string) {
  chatStore.deleteConversation(id);
}

function handleClearConversation() {
  if (currentMessages.value.length === 0) {
    showWarning('当前对话已经没有消息了');
    return;
  }

  showConfirm('确认清空', '确定要清空当前对话的所有消息吗？\n\n此操作不可恢复！', () => {
    const conversation = conversations.value.find((c) => c.id === activeConversationId.value);
    if (conversation) {
      conversation.messages = [];
      showSuccess('对话已清空');
    }
  });
}

// ========== 发送消息 ==========

async function handleSendMessage(content: string) {
  await chatHandler.sendMessage(content, zhipuReady.value);
}

// ========== API Key ==========

async function openApiKeyDialog() {
  const savedKey = await apiKeyManager.loadCurrentApiKey();
  if (savedKey && apiKeyDialogRef.value) {
    apiKeyDialogRef.value.setApiKey(savedKey);
  }
  showApiKeyDialog.value = true;
}

async function handleClearKey() {
  await apiKeyManager.clearApiKey();
}

async function handleSaveKey(apiKey: string) {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    if (zhipuReady.value) {
      showConfirm('清除配置', '输入为空，是否清除当前配置？', () => {
        handleClearKey();
      });
      return;
    }
    showApiKeyDialog.value = false;
    return;
  }

  await apiKeyManager.initZhipuClient(trimmedKey);
  showApiKeyDialog.value = false;
}

// ========== 设置 ==========

function handleSettingsUpdate(settings: {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}) {
  chatHandler.systemPrompt.value = settings.systemPrompt;
  chatHandler.temperature.value = settings.temperature;
  chatHandler.maxTokens.value = settings.maxTokens;
}

async function handleRoleAdded() {
  try {
    customRoles.value = await fetchCustomRoles();
  } catch {
    // 加载失败
  }
}

// ========== 模板 ==========

function applyPromptTemplate(type: string) {
  const templates: Record<string, string> = {
    explain: '请详细解释以下代码的功能、逻辑和可能的优化点：\n\n```\n[在此粘贴代码]\n```',
    optimize:
      '请分析以下代码的性能瓶颈，并提供优化建议和改进后的代码：\n\n```\n[在此粘贴代码]\n```',
    debug:
      '我遇到了一个问题，请帮我调试以下代码并找出问题所在：\n\n```\n[在此粘贴代码]\n```\n\n错误信息：\n[在此描述错误或异常行为]',
  };

  const template = templates[type];
  if (!template) return;

  const event = new CustomEvent('apply-prompt-template', { detail: template });
  window.dispatchEvent(event);
}

// 收藏代码片段
function handleSaveCodeSnippet(code: string, language: string) {
  quickTools.showSaveCodeSnippetDialog(code, language);
}

// ========== 快捷键 ==========

const { registerShortcut } = useKeyboardShortcuts();

registerShortcut('ctrl+n', () => handleNewChat());

registerShortcut('escape', () => {
  if (showSettingsPanel.value) {
    showSettingsPanel.value = false;
  } else if (showStatsPanel.value) {
    showStatsPanel.value = false;
  } else if (showApiKeyDialog.value) {
    showApiKeyDialog.value = false;
  } else if (showKeyboardHelp.value) {
    showKeyboardHelp.value = false;
  }
});

registerShortcut('ctrl+k', () => handleClearConversation());

registerShortcut('ctrl+/', () => {
  showKeyboardHelp.value = true;
});

// ========== 生命周期 ==========

onMounted(async () => {
  // 加载对话历史
  chatStore.loadFromStorage();

  // 加载自定义角色
  try {
    const { loadCustomRoles } = await import('../utils/configUtils');
    customRoles.value = await loadCustomRoles();
  } catch {
    // 加载失败
  }

  // 加载快捷工具数据
  const { useQuickToolsStore } = await import('../stores/quickToolsStore');
  const quickToolsStore = useQuickToolsStore();
  quickToolsStore.loadFromStorage();

  // 初始化 API Key
  try {
    const savedApiKey = await apiKeyManager.loadCurrentApiKey();
    if (savedApiKey) {
      await apiKeyManager.initZhipuClient(savedApiKey);
    }
  } catch {
    // 初始化失败
  }

  // 如果没有对话，创建一个
  if (conversations.value.length === 0) {
    chatStore.createNewConversation();
  }
});

onUnmounted(() => {
  chatHandler.cleanupListeners();
});
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.tools-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.thinking-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--n-border-color);
  padding: 8px 12px;
}
</style>
