<template>
  <div class="main-layout">
    <!-- 主界面 -->
    <div class="sidebar-left">
      <ChatHistory
        :conversations="conversations"
        :active-conversation-id="activeConversationId"
        @new-chat="handleNewChat"
        @select-conversation="selectConversationWrapper"
        @delete-conversation="deleteConversationWrapper"
      />
    </div>

    <div class="main-content">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="status-indicator">
            <div :class="['status-dot', zhipuReady ? 'running' : 'stopped']"></div>
            <span class="status-text">
              智谱 AI: {{ zhipuReady ? '已就绪' : zhipuStatus || '未配置' }}
            </span>
          </div>
          <n-button
            @click="openApiKeyDialog"
            class="btn-toggle"
            :class="zhipuReady ? 'btn-stop' : 'btn-start'"
          >
            {{ zhipuReady ? '⚙️ 管理 API Key' : '🔑 配置 API Key' }}
          </n-button>
        </div>

        <!-- 快速角色选择 -->
        <div class="quick-role-selector">
          <n-select
            v-model:value="systemPrompt"
            class="role-select"
            @update:value="saveQuickRoles"
            :options="quickRoleOptions"
            :title="systemPrompt"
            :menu-props="{ style: { minWidth: '200px' } }"
          />
        </div>

        <div class="toolbar-right">
          <n-button @click="showSettingsPanel = !showSettingsPanel" class="btn-settings">
            ⚙️ 高级设置
          </n-button>

          <n-button @click="showStatsPanel = !showStatsPanel" class="btn-stats">📊 统计</n-button>

          <!-- 对话统计 -->
          <div class="conversation-stats">
            <div class="stat-item-small">
              <span class="stat-icon">💬</span>
              <span class="stat-value">{{ currentMessageCount }}</span>
              <span class="stat-label">消息</span>
            </div>
            <div class="stat-item-small">
              <span class="stat-icon">🔢</span>
              <span class="stat-value">{{ estimatedTokens }}</span>
              <span class="stat-label">Token</span>
            </div>
          </div>
        </div>

        <span v-if="zhipuStatus" class="status-message">{{ zhipuStatus }}</span>
      </div>
      <ChatInterface
        :messages="currentMessages"
        :is-generating="isGenerating"
        :available-models="availableModels"
        :current-model="currentModel"
        @send-message="handleSendMessage"
        @model-change="handleModelChange"
        @clear-conversation="handleClearConversation"
        @export-conversation="handleExportConversation"
        @export-pdf="handleExportAsPDF"
        @copy-last-answer="handleCopyLastAnswer"
        @apply-template="applyPromptTemplate"
        @save-code-snippet="handleSaveCodeSnippet"
      />
    </div>

    <div class="sidebar-right">
      <!-- 设置面板 (条件显示) -->
      <div v-if="showSettingsPanel" class="settings-panel-container">
        <Suspense>
          <template #default>
            <SettingsPanel
              :system-prompt="systemPrompt"
              :temperature="temperature"
              :max-tokens="maxTokens"
              @close="showSettingsPanel = false"
              @update:settings="handleSettingsUpdate"
              @role-added="handleRoleAdded"
            />
          </template>
          <template #fallback>
            <div class="skeleton-loading">
              <n-skeleton :repeat="5" size="medium" />
            </div>
          </template>
        </Suspense>
      </div>

      <!-- 统计面板 -->
      <div v-else-if="showStatsPanel" class="stats-panel-container">
        <Suspense>
          <template #default>
            <StatsPanel :conversations="conversations" @close="showStatsPanel = false" />
          </template>
          <template #fallback>
            <div class="skeleton-loading">
              <n-skeleton :repeat="3" size="large" />
            </div>
          </template>
        </Suspense>
      </div>

      <!-- 原来的文件浏览器和思考过程 -->
      <template v-else>
        <div class="sidebar-right-top">
          <div class="panel-header">
            <span class="panel-title">🛠️ 快捷工具</span>
          </div>

          <QuickToolsPanel
            :active-tab="activeToolTab"
            :tabs="toolTabs"
            :snippets="codeSnippets"
            :links="quickLinks"
            :notes="quickNotes"
            @tab-change="activeToolTab = $event"
            @add-snippet="addNewSnippet"
            @copy-snippet="copySnippet"
            @delete-snippet="deleteSnippet"
            @add-link="addNewLink"
            @delete-link="deleteLink"
            @add-note="addNewNote"
            @save-notes="saveNotes"
            @delete-note="deleteNote"
          />
        </div>

        <!-- 思考过程面板 -->
        <div v-if="latestThinking" class="sidebar-right-bottom">
          <div class="panel-header">
            <span class="panel-title">🧠 思考过程</span>
          </div>
          <div class="thinking-display" ref="thinkingDisplay">
            <div class="thinking-content">{{ latestThinking }}</div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="selectedFile" class="editor-panel">
      <FileEditor :file="selectedFile" @close="clearSelection" @saved="handleFileSaved" />
    </div>

    <!-- API Key 管理对话框 -->
    <n-modal 
      v-model:show="showApiKeyDialog" 
      preset="card" 
      :title="zhipuReady ? '⚙️ API Key 管理' : '🔑 配置 API Key'" 
      style="max-width: 450px;"
      :mask-closable="false"
    >
      <div class="api-key-dialog-content">
        <div v-if="zhipuReady" class="status-info success">
          <span class="status-icon">✅</span>
          <span class="status-text">已配置并可用</span>
        </div>
        <div v-else class="status-info warning">
          <span class="status-icon">⚠️</span>
          <span class="status-text">未配置</span>
        </div>

        <div class="input-section">
          <n-input
            v-model:value="apiKeyInput"
            type="password"
            placeholder="请输入智谱 AI API Key"
            show-password-on="click"
            size="large"
          />
          <p class="input-hint">如果没有 API Key，可以留空直接关闭</p>
        </div>

        <div class="dialog-actions">
          <n-button @click="handleClearKey" :disabled="!zhipuReady" type="error" block>
            🗑️ 清除配置
          </n-button>
          <n-button @click="handleSaveKey" type="primary" block>
            💾 保存配置
          </n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch, computed, defineAsyncComponent, Suspense } from 'vue';
  import { NButton, NInput, NSelect, NModal, NSkeleton } from 'naive-ui';
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { storeToRefs } from 'pinia';
  import { useChatStore } from '../stores/chatStore';
  import { useFileStore } from '../stores/fileStore';
  import { loadCustomRoles as fetchCustomRoles } from '../utils/configUtils';
  import { formatTime } from '../utils/common';
  import { useKeyboardShortcuts } from '../composables';
  import { showSuccess, showError, showConfirm, showDeleteConfirm, showWarning } from '../utils/message';
  import ChatHistory from './ChatHistory.vue';
  import ChatInterface from './ChatInterface.vue';
  import FileEditor from './FileEditor.vue';
  // 懒加载大型组件
  const SettingsPanel = defineAsyncComponent(() => import('./SettingsPanel.vue'));
  const StatsPanel = defineAsyncComponent(() => import('./StatsPanel.vue'));
  const QuickToolsPanel = defineAsyncComponent(() => import('./QuickToolsPanel.vue'));
  import { truncateConversation, estimateTokenCount } from '../utils/tokenUtils';
  import { toggleTheme, currentTheme } from '../theme';
  import { info, error as logError } from '../utils/logger';
  import type { Message, Model, FileItem, AppConfig, CustomRole, ZhipuModelInfo } from '../types';

  // 初始化 Store
  const chatStore = useChatStore();
  const fileStore = useFileStore();

  // 解构状态 (使用 storeToRefs 保持响应式)
  const { conversations, activeConversationId, currentMessages, isGenerating, latestThinking } =
    storeToRefs(chatStore);
  const {
    createNewConversation,
    selectConversation,
    deleteConversation: storeDeleteConversation,
    addMessage,
    setGenerating,
    setThinking,
    clearThinking,
    loadFromStorage,
  } = chatStore;
  const { selectedFile, selectFile, clearSelection } = fileStore;

  // 获取当前角色名称
  const defaultRoles = [
    {
      icon: '💻',
      label: '编程助手',
      value: '你是一个专业的 AI 编程助手，擅长代码编写、调试和优化。',
    },
    { icon: '📝', label: '文案专家', value: '你是专业的文案写作专家，擅长创作吸引人的营销内容。' },
    { icon: '🔬', label: '学术顾问', value: '你是学术研究顾问，能提供专业的学术建议和指导。' },
    {
      icon: '🎨',
      label: '创意助手',
      value: '你是富有创意的 AI 助手，能帮助进行头脑风暴和创意构思。',
    },
  ];

  // 智谱 AI 状态
  const zhipuReady = ref(false);
  const zhipuStatus = ref('');
  const showApiKeyDialog = ref(false); // 显示 API Key 管理对话框
  const apiKeyInput = ref(''); // API Key 输入框

  // 主题状态
  const isDarkMode = computed(() => currentTheme.value === 'dark');

  // 设置面板状态
  const showSettingsPanel = ref(false);
  const showStatsPanel = ref(false);
  const systemPrompt = ref(defaultRoles[0]?.value || '你是一个有用的 AI 编程助手。');
  const temperature = ref(0.7);
  const maxTokens = ref(2048);

  // 自定义角色列表（从 SettingsPanel 同步）
  const customRoles = ref<CustomRole[]>([]);

  // 快捷工具状态
  const activeToolTab = ref('totp'); // 当前激活的工具tab
  const toolTabs = [
    { id: 'totp', icon: '🔐', label: '验证码' },
    { id: 'snippets', icon: '💾', label: '代码片段' },
    { id: 'links', icon: '🔗', label: '快速链接' },
    { id: 'notes', icon: '📝', label: '快捷笔记' },
  ];

  // 代码片段
  interface CodeSnippet {
    name: string;
    code: string;
  }

  const codeSnippets = ref([] as CodeSnippet[]);
  codeSnippets.value = [
    {
      name: 'Vue3 模板',
      code:
        '<' +
        'template>\n  <div>\n    <!-- 内容 -->\n  </div>\n</' +
        'template>\n\n<' +
        'script setup lang="ts">\n// 代码\n</' +
        'script>',
    },
    {
      name: 'TypeScript 接口',
      code: 'interface UserData {\n  id: string;\n  name: string;\n  email?: string;\n}',
    },
  ];

  // 快速链接
  interface QuickLink {
    name: string;
    url: string;
    icon: string;
  }

  const quickLinks = ref([] as QuickLink[]);
  quickLinks.value = [
    { name: 'Vue 文档', url: 'https://vuejs.org/', icon: '💚' },
    { name: 'Tauri 文档', url: 'https://tauri.app/', icon: '🦀' },
    { name: '智谱 AI', url: 'https://open.bigmodel.cn/', icon: '🤖' },
  ];

  // 快捷笔记
  interface QuickNote {
    content: string;
    timestamp: number;
  }

  const quickNotes = ref([] as QuickNote[]);

  // 本地存储键名（已废弃，改用 Rust 后端配置）
  // const API_KEY_STORAGE_KEY = 'zhipu_api_key';

  // 当前模型 (本地状态)
  const availableModels = ref<Model[]>([
    { id: 'glm-4.6v', name: 'GLM-4.6V', provider: '智谱 AI' },
    { id: 'glm-4.5-air', name: 'GLM-4.5 Air', provider: '智谱 AI' },
    { id: 'glm-4', name: 'GLM-4', provider: '智谱 AI' },
    { id: 'glm-4-flash', name: 'GLM-4 Flash', provider: '智谱 AI' },
  ]);
  const currentModel = ref('glm-4.6v');

  // 思考过程显示引用
  const thinkingDisplay = ref<HTMLDivElement>();

  // async function checkZhipuStatus() {
  //   try {
  //     const isReady = await invoke<boolean>('check_zhipu_status');
  //     zhipuReady.value = isReady;
  //   } catch (error) {
  //     console.error('检查智谱 AI 状态失败:', error);
  //     zhipuReady.value = false;
  //   }
  // }

  // 初始化智谱 AI 客户端
  async function initZhipuClient(apiKey: string) {
    info('MainLayout', '开始初始化智谱 AI 客户端');

    info('MainLayout', `用户输入了 API Key，长度: ${apiKey.length}`);
    zhipuStatus.value = '正在初始化...';

    try {
      // 调用后端初始化
      info('MainLayout', '调用 Rust 后端 init_zhipu_client');
      const result = await invoke<string>('init_zhipu_client', { apiKey });
      info('MainLayout', `后端返回结果: ${result}`);

      zhipuStatus.value = result;
      zhipuReady.value = true;

      // 保存到 Rust 后端配置文件
      try {
        await invoke('save_api_key', { apiKey });
        info('MainLayout', 'API Key 已保存到 config/app_config.json');
      } catch (error) {
        logError('MainLayout', '保存 API Key 失败:', error);
      }

      // 自动获取模型列表并缓存
      try {
        info('MainLayout', '正在获取模型列表...');
        const models = await invoke<ZhipuModelInfo[]>('fetch_zhipu_models');
        info('MainLayout', `成功获取 ${models.length} 个模型`);

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
          info('MainLayout', `默认选择模型: ${currentModel.value}`);
        }
      } catch (error) {
        logError('MainLayout', '获取模型列表失败:', error);
        // 尝试从配置文件加载缓存
        try {
          const config = await invoke<AppConfig>('load_app_config');
          if (config.cached_models && config.cached_models.length > 0) {
            info('MainLayout', `从配置文件加载 ${config.cached_models.length} 个缓存模型`);
            availableModels.value = config.cached_models.map((m) => ({
              id: m.id,
              name: m.name || m.id,
              provider: '智谱 AI',
              description: m.description,
            }));

            // 默认选择第一个模型
            currentModel.value = config.cached_models[0].id;
            info('MainLayout', `默认选择模型: ${currentModel.value}`);
          }
        } catch (loadError) {
          logError('MainLayout', '加载缓存模型失败:', loadError);
        }
      }

      info('MainLayout', '智谱 AI 配置成功！');

      setTimeout(() => {
        zhipuStatus.value = '';
      }, 2000);
    } catch (error) {
      logError('MainLayout', '初始化失败:', error);
      zhipuStatus.value = '❌ 配置失败';
      zhipuReady.value = false;
      setTimeout(() => {
        zhipuStatus.value = '';
      }, 5000);
    }
  }

  // 清除 API Key
  async function handleClearKey() {
    if (!zhipuReady.value) return;

    try {
      // 从 Rust 后端配置中清除
      await invoke('save_api_key', { apiKey: '' });
      info('MainLayout', 'API Key 已从配置文件中清除');
    } catch (error) {
      logError('MainLayout', '清除 API Key 失败:', error);
    }

    zhipuReady.value = false;
    zhipuStatus.value = '';
    apiKeyInput.value = '';
    info('MainLayout', 'API Key 已清除');
  }

  // 保存 API Key
  async function handleSaveKey() {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      // 如果输入为空且已配置，询问是否清除
      if (zhipuReady.value) {
        const confirm = window.confirm('输入为空，是否清除当前配置？');
        if (confirm) {
          handleClearKey();
        }
        return;
      }
      // 未配置时直接关闭
      closeApiKeyDialog();
      return;
    }

    // 保存并初始化
    await initZhipuClient(apiKey);
    closeApiKeyDialog();
  }

  // 打开 API Key 对话框
  async function openApiKeyDialog() {
    // 从 Rust 后端配置加载当前 key
    try {
      const savedKey = await invoke<string | null>('get_api_key');
      if (savedKey) {
        apiKeyInput.value = savedKey;
        info('MainLayout', '已从配置文件加载 API Key');
      } else {
        apiKeyInput.value = '';
      }
    } catch (error) {
      logError('MainLayout', '加载 API Key 失败:', error);
      apiKeyInput.value = '';
    }
    showApiKeyDialog.value = true;
  }

  // 关闭 API Key 对话框
  function closeApiKeyDialog() {
    showApiKeyDialog.value = false;
    apiKeyInput.value = '';
  }

  // ========== 快捷工具相关函数 ==========

  // 添加新代码片段
  function addNewSnippet() {
    const name = prompt('请输入代码片段名称：');
    if (!name) return;

    const code = prompt('请输入代码内容：');
    if (!code) return;

    codeSnippets.value.push({ name, code });
    saveSnippets();
  }

  // 复制代码片段
  function copySnippet(code: string) {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        showSuccess('已复制到剪贴板');
      })
      .catch(() => {
        showError('复制失败');
      });
  }

  // 删除代码片段
  function deleteSnippet(index: number) {
    showDeleteConfirm('代码片段', () => {
      codeSnippets.value.splice(index, 1);
      saveSnippets();
      showSuccess('代码片段已删除');
    });
  }

  // 保存代码片段
  function saveSnippets() {
    localStorage.setItem('code_snippets', JSON.stringify(codeSnippets.value));
  }

  // 加载代码片段
  function loadSnippets() {
    const saved = localStorage.getItem('code_snippets');
    if (saved) {
      try {
        codeSnippets.value = JSON.parse(saved);
      } catch (e) {
        logError('MainLayout', '加载代码片段失败', e);
      }
    }
  }

  // 从对话中收藏代码片段
  function handleSaveCodeSnippet(code: string, language: string) {
    const name = prompt(`请输入代码片段名称（语言：${language}）：`);
    if (!name) return;

    codeSnippets.value.unshift({ name, code });
    saveSnippets();
    showSuccess('✅ 代码片段已收藏');
  }

  // 添加新链接
  function addNewLink() {
    const name = prompt('请输入链接名称：');
    if (!name) return;

    const url = prompt('请输入链接地址：');
    if (!url) return;

    const icon = prompt('请输入图标 emoji（可选）：') || '🔗';

    quickLinks.value.push({ name, url, icon });
    saveLinks();
  }

  // 删除链接
  function deleteLink(index: number) {
    const link = quickLinks.value[index];
    showDeleteConfirm(link.name, () => {
      quickLinks.value.splice(index, 1);
      saveLinks();
      showSuccess('链接已删除');
    });
  }

  // 保存链接
  function saveLinks() {
    localStorage.setItem('quick_links', JSON.stringify(quickLinks.value));
  }

  // 加载链接
  function loadLinks() {
    const saved = localStorage.getItem('quick_links');
    if (saved) {
      try {
        quickLinks.value = JSON.parse(saved);
      } catch (e) {
        logError('MainLayout', '加载链接失败', e);
      }
    }
  }

  // 添加新笔记
  function addNewNote() {
    quickNotes.value.unshift({
      content: '',
      timestamp: Date.now(),
    });
    saveNotes();
  }

  // 删除笔记
  function deleteNote(index: number) {
    showDeleteConfirm('笔记', () => {
      quickNotes.value.splice(index, 1);
      saveNotes();
      showSuccess('笔记已删除');
    });
  }

  // 保存笔记
  function saveNotes() {
    localStorage.setItem('quick_notes', JSON.stringify(quickNotes.value));
  }

  // 加载笔记
  function loadNotes() {
    const saved = localStorage.getItem('quick_notes');
    if (saved) {
      try {
        quickNotes.value = JSON.parse(saved);
      } catch (e) {
        logError('MainLayout', '加载笔记失败', e);
      }
    }
  }

  // 计算属性：当前对话消息数
  const currentMessageCount = computed(() => {
    return currentMessages.value.length;
  });

  // 计算属性：估算 Token 数
  const estimatedTokens = computed(() => {
    if (currentMessages.value.length === 0) return 0;

    let totalTokens = 0;
    for (const msg of currentMessages.value) {
      totalTokens += estimateTokenCount(msg.content);
    }

    return totalTokens;
  });

  // 清空当前对话
  function handleClearConversation() {
    if (currentMessages.value.length === 0) {
      showWarning('当前对话已经没有消息了');
      return;
    }

    showConfirm(
      '确认清空',
      '确定要清空当前对话的所有消息吗？\n\n此操作不可恢复！',
      () => {
        const conversation = conversations.value.find((c) => c.id === activeConversationId.value);
        if (conversation) {
          conversation.messages = [];
          showSuccess('对话已清空');
        }
      }
    );
  }

  // 导出对话记录
  function handleExportConversation() {
    if (currentMessages.value.length === 0) {
      showWarning('当前对话没有消息可导出');
      return;
    }

    const conversation = conversations.value.find((c) => c.id === activeConversationId.value);
    if (!conversation) return;

    // 生成 Markdown 格式
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**导出时间**: ${new Date().toLocaleString()}\n`;
    markdown += `**模型**: ${conversation.model}

---

`;

    conversation.messages.forEach((msg) => {
      const role = msg.role === 'user' ? '👤 用户' : '🤖 助手';
      const time = new Date(msg.timestamp).toLocaleString();
      markdown += `### ${role} (${time})

${msg.content}

---

`;
    });

    // 创建下载链接
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('对话已导出为 Markdown 文件');
  }

  // 导出对话为 PDF（通过打印功能）
  function handleExportAsPDF() {
    if (currentMessages.value.length === 0) {
      showWarning('当前对话没有消息可导出');
      return;
    }

    const conversation = conversations.value.find((c) => c.id === activeConversationId.value);
    if (!conversation) return;

    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError('无法打开打印窗口，请允许弹出窗口');
      return;
    }

    // 生成 HTML 内容
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${conversation.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      border-bottom: 2px solid #4a90e2;
      padding-bottom: 10px;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .message {
      margin-bottom: 30px;
      padding: 15px;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .user {
      background: #f0f7ff;
      border-left: 4px solid #4a90e2;
    }
    .assistant {
      background: #f5f5f5;
      border-left: 4px solid #6c5ce7;
    }
    .role {
      font-weight: bold;
      margin-bottom: 8px;
      color: #4a90e2;
    }
    .time {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
    }
    pre {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
    }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    @media print {
      body { padding: 20px; }
      .message { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${conversation.title}</h1>
  <div class="meta">
    <p><strong>导出时间：</strong>${new Date().toLocaleString()}</p>
    <p><strong>模型：</strong>${conversation.model}</p>
    <p><strong>消息数：</strong>${conversation.messages.length}</p>
  </div>
`;

    conversation.messages.forEach((msg) => {
      const role = msg.role === 'user' ? '👤 用户' : '🤖 助手';
      const time = new Date(msg.timestamp).toLocaleString();
      const content = msg.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

      html += `
  <div class="message ${msg.role}">
    <div class="role">${role}</div>
    <div class="content">${content}</div>
    <div class="time">${time}</div>
  </div>
`;
    });

    html += `
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();

    // 等待内容加载后打印
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  // 复制最后一条助手回答
  function handleCopyLastAnswer() {
    const assistantMessages = currentMessages.value.filter((m) => m.role === 'assistant');

    if (assistantMessages.length === 0) {
      showWarning('没有找到助手的回答');
      return;
    }

    const lastAnswer = assistantMessages[assistantMessages.length - 1].content;

    navigator.clipboard
      .writeText(lastAnswer)
      .then(() => {
        showSuccess('已复制到剪贴板');
      })
      .catch(() => {
        showError('复制失败，请手动复制');
      });
  }

  // 应用提示词模板
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

    // 将模板填入输入框（通过自定义事件）
    const event = new CustomEvent('apply-prompt-template', { detail: template });
    window.dispatchEvent(event);
  }

  // 注册键盘快捷键
  function registerKeyboardShortcuts() {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: 发送消息（如果输入框有焦点）
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        const textarea = document.querySelector('.input-area textarea') as HTMLTextAreaElement;
        if (textarea && document.activeElement === textarea && textarea.value.trim()) {
          event.preventDefault();
          textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        }
      }

      // Ctrl/Cmd + K: 清空对话
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        handleClearConversation();
      }

      // Ctrl/Cmd + /: 显示帮助
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        showKeyboardHelp();
      }

      // Escape: 关闭对话框/面板
      if (event.key === 'Escape') {
        if (showApiKeyDialog.value) {
          closeApiKeyDialog();
        } else if (showSettingsPanel.value) {
          showSettingsPanel.value = false;
        }
      }
    });
  }

  // 显示快捷键帮助
  function showKeyboardHelp() {
    const help = `
📝 快捷键列表：

Ctrl/Cmd + Enter  - 发送消息
Ctrl/Cmd + K      - 清空当前对话
Ctrl/Cmd + /      - 显示此帮助
Escape            - 关闭对话框/面板
  `;
    alert(help);
  }

  onMounted(async () => {
    info('MainLayout', '组件开始挂载');

    try {
      // 加载对话历史
      info('MainLayout', '加载对话历史');
      loadFromStorage();

      // 加载自定义角色
      try {
        const config = await invoke<AppConfig>('load_app_config');
        customRoles.value = config.custom_roles || [];
        info('MainLayout', `已加载 ${customRoles.value.length} 个自定义角色`);
      } catch (error) {
        logError('MainLayout', '加载自定义角色失败:', error);
      }

      // 加载快捷工具数据
      loadSnippets();
      loadLinks();
      loadNotes();

      // 尝试从 Rust 后端配置加载 API Key
      try {
        const savedApiKey = await invoke<string | null>('get_api_key');
        info('MainLayout', `配置文件中的 API Key: ${savedApiKey ? '存在' : '不存在'}`);

        if (savedApiKey) {
          try {
            info('MainLayout', '自动初始化智谱 AI...');
            await initZhipuClient(savedApiKey);
            zhipuStatus.value = '✅ 已就绪';
            zhipuReady.value = true;
            info('MainLayout', '智谱 AI 初始化成功');
          } catch (error) {
            logError('MainLayout', '自动初始化失败:', error);
            // 清除无效的 API Key
            await invoke('save_api_key', { apiKey: '' });
            zhipuStatus.value = '⚠️ 配置失效';
            zhipuReady.value = false;
          }
        } else {
          info('MainLayout', '未找到 API Key - 不影响其他功能使用');
          zhipuStatus.value = '⚠️ 未配置';
          zhipuReady.value = false;
        }
      } catch (error) {
        logError('MainLayout', '加载 API Key 失败:', error);
        zhipuStatus.value = '⚠️ 暂时不可用';
        zhipuReady.value = false;
      }

      // 如果没有对话，创建一个
      if (conversations.value.length === 0) {
        info('MainLayout', '创建新对话');
        createNewConversation();
      }

      // 如果智谱 AI 已就绪，获取模型列表
      if (zhipuReady.value) {
        try {
          info('MainLayout', '正在获取智谱 AI 模型列表...');
          const models = await invoke<ZhipuModelInfo[]>('fetch_zhipu_models');
          info('MainLayout', `成功获取 ${models.length} 个模型`);

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
            info('MainLayout', `默认选择模型: ${currentModel.value}`);
          }
        } catch (error) {
          logError('MainLayout', '获取模型列表失败，尝试从配置文件加载:', error);

          // 从配置文件加载缓存的模型列表
          try {
            const config = await invoke<AppConfig>('load_app_config');
            if (config.cached_models && config.cached_models.length > 0) {
              info('MainLayout', `从配置文件加载 ${config.cached_models.length} 个缓存模型`);
              availableModels.value = config.cached_models.map((m) => ({
                id: m.id,
                name: m.name || m.id,
                provider: '智谱 AI',
                description: m.description,
              }));

              // 默认选择第一个模型
              currentModel.value = config.cached_models[0].id;
              info('MainLayout', `默认选择模型: ${currentModel.value}`);
            } else {
              info('MainLayout', '配置文件中没有缓存模型，使用默认列表');
            }
          } catch (loadError) {
            logError('MainLayout', '加载缓存模型失败，使用默认列表:', loadError);
          }
        }
      }

      // 注册快捷键
      registerKeyboardShortcuts();

      info('MainLayout', '组件挂载完成 - 应用可正常使用');
    } catch (error) {
      logError('MainLayout', '组件挂载异常:', error);
      // 即使出错也不影响其他功能
      zhipuStatus.value = '⚠️ 暂时不可用';
      zhipuReady.value = false;
    }
  });


  // 更新消息内容和执行信息
  function updateMessageContent(
    messageId: string,
    content: string,
    executionInfo?: Message['executionInfo'],
  ) {
    const conversation = conversations.value.find((c) => c.id === activeConversationId.value);
    if (conversation) {
      const message = conversation.messages.find((m) => m.id === messageId);
      if (message) {
        message.content = content;
        message.thinking = undefined; // 清除思考过程
        if (executionInfo) {
          message.executionInfo = executionInfo;
        }
        
        // 自动保存
        chatStore.saveToStorage();
      }
    }
  }
  // const currentMessages = computed(() => {
  //   if (!activeConversationId.value) return [];
  //   const conversation = conversations.value.find(c => c.id === activeConversationId.value);
  //   return conversation?.messages || [];
  // });

  // 创建新对话
  function handleNewChat() {
    createNewConversation('新对话', currentModel.value);
  }

  // 选择对话
  function selectConversationWrapper(id: string) {
    selectConversation(id);
    const conversation = conversations.value.find((c) => c.id === id);
    if (conversation) {
      currentModel.value = conversation.model;
    }
  }

  // 删除对话
  function deleteConversationWrapper(id: string) {
    storeDeleteConversation(id);
  }

  // 发送消息
  async function handleSendMessage(content: string) {
    // 如果没有活动对话，创建一个
    if (!activeConversationId.value) {
      createNewConversation();
    }

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    // 设置生成状态并记录开始时间
    setGenerating(true);

    try {
      // 先创建一个空的助手消息用于显示流式内容
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      addMessage(assistantMessage);

      // 监听 AI chunk 事件
      const unlistenChunk = await listen('ai-chunk', (event: any) => {
        const data = event.payload;
        
        // 更新思考过程
        if (data.chunk) {
          setThinking(data.full_content);
          
          // 自动滚动思考面板
          if (thinkingDisplay.value) {
            thinkingDisplay.value.scrollTop = thinkingDisplay.value.scrollHeight;
          }
        }
        
        // 直接修改消息对象，避免频繁触发响应式更新
        if (data.full_content) {
          const conversation = conversations.value.find((c) => c.id === activeConversationId.value);
          if (conversation) {
            const message = conversation.messages.find((m) => m.id === assistantMessageId);
            if (message) {
              message.content = data.full_content;
            }
          }
        }
      });

      // 监听 AI 完成事件
      const unlistenComplete = await listen('ai-complete', async (event: any) => {
        const data = event.payload;

        // 计算 Token 数
        const inputTokens = estimateTokenCount(messagesForApi.map((m) => m.content).join('\n'));
        const outputTokens = estimateTokenCount(data.content);

        // 更新为最终消息
        updateMessageContent(assistantMessageId, data.content, {
          session_id: '',
          conversation_id: '',
          assistant_rounds: 1,
          execution_time_ms: data.execution_time_ms,
          token_usage: {
            input: inputTokens,
            output: outputTokens,
            total: inputTokens + outputTokens,
          },
        });

        setGenerating(false);
        clearThinking(); // 清除思考过程

        // 清理事件监听
        unlistenChunk();
        unlistenComplete();
      });

      // 监听 AI 错误事件
      const unlistenError = await listen('ai-error', (event: any) => {
        const data = event.payload;

        updateMessageContent(assistantMessageId, `❌ ${data.error}`, undefined);
        setGenerating(false);

        unlistenChunk();
        unlistenComplete();
        unlistenError();
      });

      // 构建完整的对话历史 (包含 system, user, assistant)
      const conversation = conversations.value.find((c) => c.id === activeConversationId.value);
      const allMessages =
        conversation?.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })) || [];

      // 计算当前 Token 数
      const currentTokens = estimateTokenCount(allMessages.map((m) => m.content).join('\n'));

      // 自动截断超出限制的对话历史
      const messagesForApi = truncateConversation(
        allMessages,
        maxTokens.value - 500, // 预留 500 tokens 给回复
        systemPrompt.value,
        10, // 保留最近 10 轮对话
      );

      // 调用带上下文的流式 API
      await invoke('send_message_to_zhipu_stream_with_context', {
        messages: messagesForApi,
        model: currentModel.value,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
        system_prompt: systemPrompt.value,
      });
    } catch (error) {
      // 添加错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ 获取回复失败：${error}`,
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
      setGenerating(false);
    }
  }


  // 切换模型
  function handleModelChange(modelId: string) {
    currentModel.value = modelId;
    if (activeConversationId.value) {
      const conversation = conversations.value.find((c) => c.id === activeConversationId.value);
      if (conversation) {
        conversation.model = modelId;
        conversation.updatedAt = Date.now();
        
        // 自动保存
        chatStore.saveToStorage();
      }
    }
  }

  // 处理设置更新
  function handleSettingsUpdate(settings: {
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
  }) {
    systemPrompt.value = settings.systemPrompt;
    temperature.value = settings.temperature;
    maxTokens.value = settings.maxTokens;
  }

  // 计算属性：合并默认角色和自定义角色
  const quickRoles = computed(() => {
    return [...defaultRoles, ...customRoles.value];
  });

  // 转换为 Naive UI 需要的 options 格式
  const quickRoleOptions = computed(() => {
    return quickRoles.value.map(role => ({
      label: `${role.icon} ${role.label}`,
      value: role.value
    }));
  });

  // 从 SettingsPanel 接收角色添加事件
  async function handleRoleAdded() {
    try {
      customRoles.value = await fetchCustomRoles();
    } catch (error) {
      logError('MainLayout', '加载角色失败:', error);
    }
  }

  // 删除角色
  // function deleteRole(index: number) {
  //   const customRoles = getCustomRoles();
  //   customRoles.splice(index, 1);
  //   saveCustomRoles(customRoles);
  // }

  // 保存快速角色 (当系统提示变化时)
  function saveQuickRoles() {
    // 这里可以记录用户偏好
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */

  // 选择文件
  function handleFileSelected(file: FileItem) {
    selectFile(file);
  }

  // 文件保存成功
  function handleFileSaved() {
    // 文件保存成功处理
  }

  // ========== 快捷键支持 ==========
  const { registerShortcut } = useKeyboardShortcuts();
  
  // 注册 Ctrl/Cmd + N: 新建对话
  registerShortcut('ctrl+n', () => {
    handleNewChat();
  });
  
  // 注册 Esc: 关闭面板
  registerShortcut('escape', () => {
    if (showSettingsPanel.value) {
      showSettingsPanel.value = false;
    } else if (showStatsPanel.value) {
      showStatsPanel.value = false;
    } else if (showApiKeyDialog.value) {
      closeApiKeyDialog();
    }
  });
</script>

<style scoped>
  .main-layout {
    display: grid;
    grid-template-columns: 280px 1fr 280px;
    height: 100vh;
    overflow: hidden;
  }

  .sidebar-left {
    border-right: 1px solid var(--n-border-color);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--n-border-color);
    flex-shrink: 0;
    flex-wrap: wrap;
    min-height: 56px;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-left: auto;
  }

  /* 响应式工具栏 */
  @media (max-width: 1100px) {
    .toolbar {
      gap: 6px;
      padding: 8px 12px;
    }

    .conversation-stats {
      display: none;
    }
  }

  @media (max-width: 900px) {
    .toolbar {
      gap: 4px;
      padding: 6px 8px;
      flex-wrap: wrap;
    }

    .toolbar-left {
      flex: 1;
      min-width: 0;
    }

    .toolbar-right {
      flex-basis: 100%;
      justify-content: flex-end;
      margin-left: 0;
      padding-top: 6px;
      flex-wrap: wrap;
    }

    .quick-role-selector {
      max-width: 180px;
    }

    .role-select {
      min-width: 100px;
    }

    .status-indicator {
      padding: 4px 6px;
    }

    .status-text {
      font-size: 11px;
    }

    .btn-toggle.n-button {
      padding: 4px 10px;
      font-size: 11px;
    }

    .btn-settings,
    .btn-stats {
      padding: 4px 8px;
      font-size: 11px;
    }
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .status-indicator:hover {
    background: var(--n-action-color);
  }

  /* 状态指示器 */
  .status-dot.running {
    background: var(--n-success-color);
    box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
    animation: pulse 2s infinite;
  }

  .status-dot.stopped {
    background: var(--n-error-color);
    box-shadow: 0 0 6px rgba(255, 77, 79, 0.5);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  .status-text {
    font-size: 14px;
    font-weight: 500;
  }

  .btn-toggle.n-button {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-width: fit-content;
    color: white !important;
  }

  .btn-toggle.n-button.btn-start {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%) !important;
    box-shadow: 0 2px 4px rgba(82, 196, 26, 0.3);
  }

  .btn-toggle.n-button.btn-start:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(82, 196, 26, 0.4);
  }

  .btn-toggle.n-button.btn-stop {
    background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%) !important;
    box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
  }

  .btn-toggle.n-button.btn-stop:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(255, 77, 79, 0.4);
  }

  .btn-toggle.n-button:active {
    transform: translateY(0);
  }

  .status-message {
    font-size: 13px;
    color: var(--n-text-color-2);
    padding: 6px 12px;
    border-radius: 6px;
    white-space: nowrap;
  }

  /* 快速角色选择器 */
  .quick-role-selector {
    display: flex;
    align-items: center;
    flex: 0 1 200px;
    min-width: 120px;
    max-width: 200px;
  }

  .role-select {
    width: 100%;
    min-width: 150px;
  }

  /* 对话统计 */
  .conversation-stats {
    display: flex;
    gap: 12px;
    padding: 6px 12px;
    border-radius: 8px;
  }

  .stat-item-small {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stat-icon {
    font-size: 14px;
  }

  .stat-value {
    font-size: 14px;
    font-weight: 700;
    color: var(--n-primary-color);
    min-width: 20px;
    text-align: center;
  }

  .stat-label {
    font-size: 11px;
    color: var(--n-text-color-3);
  }

  .sidebar-right {
    border-left: 1px solid var(--n-border-color);
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    min-height: 0;
  }

  .settings-panel-container,
  .stats-panel-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .sidebar-right-top {
    flex: 1;
    overflow: hidden;
    border-bottom: 1px solid var(--n-border-color);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .sidebar-right-bottom {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .thinking-display {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    padding: 16px;
    min-height: 0;
  }

  .thinking-content {
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  .thinking-note {
    padding: 8px 12px;
    margin-bottom: 12px;
    border-radius: 4px;
    font-size: 12px;
    font-style: italic;
    background: var(--n-warning-color);
    border-left: 3px solid var(--n-warning-border-color);
    color: var(--n-warning-text-color);
  }

  .thinking-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--n-text-color-3);
    gap: 12px;
  }

  .placeholder-icon {
    font-size: 32px;
    opacity: 0.5;
  }

  .placeholder-text {
    font-size: 13px;
    opacity: 0.7;
  }

  .editor-panel {
    position: fixed;
    top: 0;
    right: 280px;
    width: 500px;
    height: 100vh;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  /* API Key 对话框样式 */
  .api-key-dialog-content {
    padding: 8px 0;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 600;
  }

  .status-info.success {
    background: var(--n-success-color);
    color: var(--n-success-text-color);
    border: 1px solid var(--n-success-border-color);
  }

  .status-info.warning {
    background: var(--n-warning-color);
    color: var(--n-warning-text-color);
    border: 1px solid var(--n-warning-border-color);
  }

  .input-section {
    margin-bottom: 24px;
  }

  .input-hint {
    font-size: 12px;
    color: var(--n-text-color-3);
    margin: 8px 0 0 0;
  }

  .dialog-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  /* 骨架屏加载样式 */
  .skeleton-loading {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
