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
        <div class="status-indicator">
          <div :class="['status-dot', zhipuReady ? 'running' : 'stopped']"></div>
          <span class="status-text">
            智谱 AI: {{ zhipuReady ? '已就绪' : (zhipuStatus || '未配置') }}
          </span>
        </div>
        <button @click="initZhipuClient" :class="['btn-toggle', zhipuReady ? 'btn-stop' : 'btn-start']">
          {{ zhipuReady ? '✅ 已就绪' : '🔑 配置 API Key' }}
        </button>
        
        <!-- 快速角色选择 -->
        <div class="quick-role-selector">
          <select v-model="systemPrompt" class="role-select" @change="saveQuickRoles" :title="systemPrompt">
            <option v-for="role in quickRoles" :key="role.value" :value="role.value">
              {{ role.icon }} {{ role.label }}
            </option>
          </select>
        </div>
        
        <button @click="showSettingsPanel = !showSettingsPanel" class="btn-settings">
          ⚙️ 高级设置
        </button>
        <span v-if="zhipuStatus" class="status-message">{{ zhipuStatus }}</span>
      </div>
      <ChatInterface
        :messages="currentMessages"
        :is-generating="isGenerating"
        :available-models="availableModels"
        :current-model="currentModel"
        @send-message="handleSendMessage"
        @model-change="handleModelChange"
      />
    </div>

    <div class="sidebar-right">
      <!-- 设置面板 (条件显示) -->
      <div v-if="showSettingsPanel" class="settings-panel-container">
        <SettingsPanel
          :system-prompt="systemPrompt"
          :temperature="temperature"
          :max-tokens="maxTokens"
          @close="showSettingsPanel = false"
          @update:settings="handleSettingsUpdate"
        />
      </div>
      
      <!-- 原来的文件浏览器和思考过程 -->
      <template v-else>
        <div class="sidebar-right-top">
          <div class="panel-header">
            <span class="panel-title">📁 文件浏览器</span>
          </div>
          <FileExplorer
            @file-selected="handleFileSelected"
          />
        </div>
        <div class="sidebar-right-bottom">
          <div class="panel-header">
            <span class="panel-title">🧠 思考过程</span>
          </div>
          <div class="thinking-display" ref="thinkingDisplay">
            <div v-if="latestThinking" class="thinking-content">
              <div class="thinking-note">
                ℹ️ 注意：以下显示的是 AI 的思考和回答过程
              </div>
              {{ latestThinking }}
            </div>
            <div v-else class="thinking-placeholder">
              <span class="placeholder-icon">💭</span>
              <span class="placeholder-text">思考过程将显示在这里</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="selectedFile" class="editor-panel">
      <FileEditor
        :file="selectedFile"
        @close="clearSelection"
        @saved="handleFileSaved"
      />
    </div>

    <!-- 添加角色对话框 -->
    <div v-if="showAddRoleDialog" class="dialog-overlay" @click="showAddRoleDialog = false">
      <div class="dialog-content" @click.stop>
        <h3 class="dialog-title">➕ 添加自定义角色</h3>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">角色图标</label>
            <input 
              v-model="newRole.icon"
              type="text"
              class="form-input"
              placeholder="例如：🚀"
              maxlength="2"
            />
          </div>
          <div class="form-group">
            <label class="form-label">角色名称</label>
            <input 
              v-model="newRole.label"
              type="text"
              class="form-input"
              placeholder="例如：翻译助手"
              maxlength="10"
            />
          </div>
          <div class="form-group">
            <label class="form-label">系统提示词</label>
            <textarea 
              v-model="newRole.value"
              class="form-textarea"
              placeholder="描述这个角色的职责和能力..."
              rows="4"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="showAddRoleDialog = false" class="btn-dialog-cancel">取消</button>
          <button @click="handleAddRole" class="btn-dialog-confirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { storeToRefs } from 'pinia';
import { useChatStore } from '../stores/chatStore';
import { useFileStore } from '../stores/fileStore';
import ChatHistory from './ChatHistory.vue';
import ChatInterface from './ChatInterface.vue';
import FileExplorer from './FileExplorer.vue';
import FileEditor from './FileEditor.vue';
import SettingsPanel from './SettingsPanel.vue';
import { truncateConversation, estimateTokenCount } from '../utils/tokenUtils';
import type { Message, Model, FileItem } from '../types';

// 初始化 Store
const chatStore = useChatStore();
const fileStore = useFileStore();

// 解构状态 (使用 storeToRefs 保持响应式)
const { conversations, activeConversationId, currentMessages, isGenerating, latestThinking } = storeToRefs(chatStore);
const { createNewConversation, selectConversation, deleteConversation: storeDeleteConversation, addMessage, setGenerating, setThinking, loadFromStorage } = chatStore;
const { selectedFile, selectFile, clearSelection } = fileStore;

// 获取当前角色名称
const defaultRoles = [
  { icon: '💻', label: '编程助手', value: '你是一个专业的 AI 编程助手，擅长代码编写、调试和优化。' },
  { icon: '📝', label: '文案专家', value: '你是专业的文案写作专家，擅长创作吸引人的营销内容。' },
  { icon: '🔬', label: '学术顾问', value: '你是学术研究顾问，能提供专业的学术建议和指导。' },
  { icon: '🎨', label: '创意助手', value: '你是富有创意的 AI 助手，能帮助进行头脑风暴和创意构思。' },
];

// 智谱 AI 状态
const zhipuReady = ref(false);
const zhipuStatus = ref('');

// 设置面板状态
const showSettingsPanel = ref(false);
const systemPrompt = ref(defaultRoles[0]?.value || '你是一个有用的 AI 编程助手。'); // 默认选择第一个角色，如果 defaultRoles 未加载则使用默认值
const temperature = ref(0.7);
const maxTokens = ref(2048);
const showAddRoleDialog = ref(false);
const newRole = ref({
  icon: '🚀',
  label: '',
  value: ''
});

// 本地存储键名
const ROLES_STORAGE_KEY = 'iflow_custom_roles';

// API Key 存储键名
const API_KEY_STORAGE_KEY = 'zhipu_api_key';

// 当前模型 (本地状态)
const availableModels: Model[] = [
  { id: 'glm-4.6v', name: 'GLM-4.6V', provider: '智谱 AI' },
  { id: 'glm-4.5-air', name: 'GLM-4.5 Air', provider: '智谱 AI' },
  { id: 'glm-4', name: 'GLM-4', provider: '智谱 AI' },
  { id: 'glm-4-flash', name: 'GLM-4 Flash', provider: '智谱 AI' },
];
const currentModel = ref('glm-4.6v');

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
async function initZhipuClient() {
  console.log('[MainLayout] 开始初始化智谱 AI 客户端');
  
  if (zhipuReady.value) {
    // 已就绪时显示清除选项
    const confirmClear = confirm('是否要清除当前 API Key 并重新配置？\n\n点击"确定"清除并重新配置\n点击"取消"保持当前配置');
    if (!confirmClear) {
      zhipuStatus.value = '保持当前配置';
      setTimeout(() => {
        zhipuStatus.value = '';
      }, 2000);
      return;
    }
    // 清除存储的 API Key
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    zhipuReady.value = false;
  }
  
  // 提示用户输入 API Key
  const apiKey = prompt('请输入智谱 AI API Key:\n\n如果没有 API Key，可以点击“取消”跳过，不影响其他功能使用。');
  if (!apiKey) {
    console.log('[MainLayout] 用户取消配置 - 可继续使用其他功能');
    zhipuStatus.value = '⚠️ 未配置';
    zhipuReady.value = false;
    setTimeout(() => {
      zhipuStatus.value = '';
    }, 3000);
    return;
  }
  
  console.log('[MainLayout] 用户输入了 API Key，长度:', apiKey.length);
  zhipuStatus.value = '正在初始化...';
  
  try {
    // 调用后端初始化
    console.log('[MainLayout] 调用 Rust 后端 init_zhipu_client');
    const result = await invoke<string>('init_zhipu_client', { apiKey });
    console.log('[MainLayout] 后端返回结果:', result);
    
    zhipuStatus.value = result;
    zhipuReady.value = true;
    
    // 保存到 localStorage
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    console.log('[MainLayout] API Key 已保存到 localStorage');
    
    console.log('[MainLayout] 智谱 AI 配置成功！');
    
    setTimeout(() => {
      zhipuStatus.value = '';
    }, 2000);
  } catch (error) {
    console.error('[MainLayout] 初始化失败:', error);
    zhipuStatus.value = '❌ 配置失败';
    zhipuReady.value = false;
    setTimeout(() => {
      zhipuStatus.value = '';
    }, 5000);
  }
}

// 组件挂载时检查智谱 AI 状态
onMounted(async () => {
  console.log('[MainLayout] 组件开始挂载');
  
  try {
    // 加载对话历史
    console.log('[MainLayout] 加载对话历史');
    loadFromStorage();
    
    // 尝试从 localStorage 加载 API Key
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    console.log('[MainLayout] localStorage 中的 API Key:', savedApiKey ? '存在' : '不存在');
    
    if (savedApiKey) {
      try {
        console.log('[MainLayout] 自动初始化智谱 AI...');
        await invoke<string>('init_zhipu_client', { apiKey: savedApiKey });
        zhipuStatus.value = '✅ 已就绪';
        zhipuReady.value = true;
        console.log('[MainLayout] 智谱 AI 初始化成功');
      } catch (error) {
        console.error('[MainLayout] 自动初始化失败:', error);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        zhipuStatus.value = '⚠️ 配置失效';
        zhipuReady.value = false;
      }
    } else {
      console.log('[MainLayout] 未找到 API Key - 不影响其他功能使用');
      zhipuStatus.value = '⚠️ 未配置';
      zhipuReady.value = false;
    }
    
    // 如果没有对话，创建一个
    if (conversations.value.length === 0) {
      console.log('[MainLayout] 创建新对话');
      createNewConversation();
    }
    
    console.log('[MainLayout] 组件挂载完成 - 应用可正常使用');
  } catch (error) {
    console.error('[MainLayout] 组件挂载异常:', error);
    // 即使出错也不影响其他功能
    zhipuStatus.value = '⚠️ 暂时不可用';
    zhipuReady.value = false;
  }
});

// 当前对话的消息 (从 store 计算属性获取)
const currentMessageContent = ref('');
const thinkingDisplay = ref<HTMLDivElement>();

// 监听思考内容变化，自动滚动到底部
watch(latestThinking, () => {
  if (thinkingDisplay.value) {
    thinkingDisplay.value.scrollTop = thinkingDisplay.value.scrollHeight;
  }
});

// 更新消息的思考过程
function updateMessageThinking(messageId: string, thinking: string) {
  // 更新消息中的 thinking
  const conversation = conversations.value.find(c => c.id === activeConversationId.value);
  if (conversation) {
    const message = conversation.messages.find(m => m.id === messageId);
    if (message) {
      message.thinking = thinking;
    }
  }
  // 同时更新 store 中的 latestThinking，让右下角能显示
  setThinking(thinking);
}

// 更新消息内容和执行信息
function updateMessageContent(
  messageId: string, 
  content: string, 
  executionInfo?: Message['executionInfo']
) {
  const conversation = conversations.value.find(c => c.id === activeConversationId.value);
  if (conversation) {
    const message = conversation.messages.find(m => m.id === messageId);
    if (message) {
      message.content = content;
      message.thinking = undefined; // 清除思考过程
      if (executionInfo) {
        message.executionInfo = executionInfo;
      }
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
  const conversation = conversations.value.find(c => c.id === id);
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
  
  // 清空当前消息内容
  currentMessageContent.value = '';

  try {
    // 先创建一个空的助手消息用于显示流式内容
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      thinking: '正在思考...',
    };
    addMessage(assistantMessage);

    // 监听 AI chunk 事件
    const unlistenChunk = await listen('ai-chunk', (event: any) => {
      const data = event.payload;
      // 直接使用 full_content 避免重复累积
      if (data.full_content) {
        updateMessageThinking(assistantMessageId, data.full_content);
      }
    });

    // 监听 AI 完成事件
    const unlistenComplete = await listen('ai-complete', async (event: any) => {
      const data = event.payload;
      
      // 计算 Token 数
      const inputTokens = estimateTokenCount(messagesForApi.map(m => m.content).join('\n'));
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
          total: inputTokens + outputTokens
        }
      });
      
      setGenerating(false);
      
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
    const conversation = conversations.value.find(c => c.id === activeConversationId.value);
    const allMessages = conversation?.messages.map(m => ({
      role: m.role,
      content: m.content
    })) || [];

    // 计算当前 Token 数
    const currentTokens = estimateTokenCount(allMessages.map(m => m.content).join('\n'));
    console.log(`当前对话 Token 数：${currentTokens}, 限制：${maxTokens.value}`);

    // 自动截断超出限制的对话历史
    const messagesForApi = truncateConversation(
      allMessages,
      maxTokens.value - 500, // 预留 500 tokens 给回复
      systemPrompt.value
    );

    if (messagesForApi.length < allMessages.length) {
      console.log(`已截断对话历史：${allMessages.length} -> ${messagesForApi.length} 条消息`);
    }

    // 调用带上下文的流式 API
    await invoke('send_message_to_zhipu_stream_with_context', {
      messages: messagesForApi,
      model: currentModel.value,
      temperature: temperature.value,
      max_tokens: maxTokens.value,
      system_prompt: systemPrompt.value
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
    const conversation = conversations.value.find(c => c.id === activeConversationId.value);
    if (conversation) {
      conversation.model = modelId;
      conversation.updatedAt = Date.now();
    }
  }
}

// 处理设置更新
function handleSettingsUpdate(settings: { systemPrompt: string; temperature: number; maxTokens: number }) {
  systemPrompt.value = settings.systemPrompt;
  temperature.value = settings.temperature;
  maxTokens.value = settings.maxTokens;
}

// 计算属性：合并默认角色和自定义角色
const quickRoles = computed(() => {
  const customRoles = getCustomRoles();
  return [...defaultRoles, ...customRoles];
});

// 加载自定义角色
function getCustomRoles() {
  try {
    const saved = localStorage.getItem(ROLES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('加载自定义角色失败:', error);
  }
  return [];
}

// 保存自定义角色
function saveCustomRoles(roles: any[]) {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
    console.log(`已保存 ${roles.length} 个自定义角色`);
  } catch (error) {
    console.error('保存自定义角色失败:', error);
  }
}

// 添加新角色
function addNewRole(role: { icon: string; label: string; value: string }) {
  const customRoles = getCustomRoles();
  customRoles.push(role);
  saveCustomRoles(customRoles);
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
  console.log('角色已切换:', systemPrompt.value);
}

/* eslint-disable @typescript-eslint/no-unused-vars */
// 删除自定义角色
function deleteCustomRole(roleLabel: string) {
  if (!confirm(`确定要删除角色 "${roleLabel}" 吗？\n\n此操作不可恢复！`)) {
    return;
  }
  
  try {
    const customRoles = getCustomRoles();
    const index = customRoles.findIndex((r: any) => r.label === roleLabel);
    
    if (index === -1) {
      alert('未找到该角色');
      return;
    }
    
    // 检查是否是当前选中的角色
    const deletedRole = customRoles[index];
    if (systemPrompt.value === deletedRole.value) {
      // 如果正在使用，切换到第一个默认角色
      systemPrompt.value = defaultRoles[0].value;
      console.log('已切换到默认角色');
    }
    
    customRoles.splice(index, 1);
    saveCustomRoles(customRoles);
    
    console.log(`已删除角色：${roleLabel}`);
    alert(`角色 "${roleLabel}" 已删除`);
  } catch (error) {
    console.error('删除角色失败:', error);
    alert('删除失败：' + error);
  }
}

// 处理添加角色
function handleAddRole() {
  if (!newRole.value.label || !newRole.value.value) {
    alert('请填写角色名称和系统提示词');
    return;
  }
  
  try {
    // 添加到存储
    addNewRole({
      icon: newRole.value.icon,
      label: newRole.value.label,
      value: newRole.value.value
    });
    
    // 重置表单
    newRole.value = {
      icon: '🚀',
      label: '',
      value: ''
    };
    
    showAddRoleDialog.value = false;
    
    // 提示成功
    alert('角色添加成功！\n新角色已添加到角色选择列表中。');
  } catch (error) {
    console.error('添加角色失败:', error);
    alert('添加角色失败：' + error);
  }
}

// 选择文件
function handleFileSelected(file: FileItem) {
  selectFile(file);
}

// 文件保存成功
function handleFileSaved() {
  console.log('文件保存成功');
}
</script>

<style scoped>
.main-layout {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.sidebar-left {
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.main-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  background: var(--bg-primary);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.status-indicator:hover {
  background: var(--bg-hover);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.running {
  background: #52c41a;
  box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
  animation: pulse 2s infinite;
}

.status-dot.stopped {
  background: #ff4d4f;
  box-shadow: 0 0 6px rgba(255, 77, 79, 0.5);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.status-text {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.btn-toggle {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 100px;
}

.btn-start {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(82, 196, 26, 0.3);
}

.btn-start:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(82, 196, 26, 0.4);
}

.btn-stop {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.3);
}

.btn-stop:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 77, 79, 0.4);
}

.btn-toggle:active {
  transform: translateY(0);
}

.btn-primary {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.status-message {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  white-space: nowrap;
}

/* 快速角色选择器 */
.quick-role-selector {
  display: flex;
  gap: 6px;
  align-items: center;
}

.role-select {
  padding: 6px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-width: 140px;
  font-weight: 500;
}

.role-select:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
}

.role-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.btn-settings {
  display: flex;
  align-items: center;
  gap: 6px;
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

.btn-settings:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.btn-settings:active {
  transform: translateY(0);
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.dialog-content {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  min-width: 420px;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  animation: dialog-fade-in 0.2s ease-out;
}

@keyframes dialog-fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dialog-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.dialog-body {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #333);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.15);
  background: var(--bg-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-dialog-cancel,
.btn-dialog-confirm {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-dialog-cancel {
  background: var(--bg-secondary, #f5f5f5);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, #ddd);
}

.btn-dialog-cancel:hover {
  background: var(--bg-hover, #e8e8e8);
}

.btn-dialog-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.btn-dialog-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

@media (prefers-color-scheme: dark) {
  .toolbar {
    border-bottom-color: var(--border-color);
    background: var(--bg-primary);
  }

  .status-message {
    color: var(--text-secondary);
  }
}

.sidebar-right {
  border-left: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  min-height: 0;
}

.settings-panel-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-right-top {
  flex: 1;
  overflow: hidden;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
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

.panel-header {
  padding: 12px 16px;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary, #333);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
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
  color: var(--text-primary, #333);
  white-space: pre-wrap;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.thinking-note {
  background: var(--thinking-bg, #fff7e6);
  border-left: 3px solid var(--thinking-border, #ffd591);
  padding: 8px 12px;
  margin-bottom: 12px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--thinking-text, #d46b08);
  font-style: italic;
}

.thinking-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #999);
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

@media (prefers-color-scheme: dark) {
  .sidebar-left {
    border-right-color: var(--border-color);
  }

  .sidebar-right {
    border-left-color: var(--border-color);
  }

  .toolbar {
    border-bottom-color: var(--border-color);
    background: var(--bg-primary);
  }

  .status-indicator {
    background: var(--bg-secondary);
  }

  .status-text {
    color: var(--text-primary);
  }

  .status-message {
    color: var(--text-secondary);
  }
}
</style>