# AI 项目理解指南

> 本文档专为 AI 助手设计，帮助快速理解 iFlow Desktop 项目的核心架构和关键信息。

---

## 🎯 项目概览

**iFlow Desktop** 是一个基于 **Tauri 2.0 + Vue 3 + Rust** 的 AI 编程助手桌面应用。

### 核心价值
- 提供智能代码对话和分析能力
- 集成智谱 AI（GLM 系列模型）
- 支持本地文件管理和编辑
- 跨平台桌面应用（Windows/macOS/Linux）

---

## 🏗️ 技术架构

### 前端技术栈
```
Vue 3 (Composition API)
├── Pinia (状态管理)
├── TypeScript (类型安全)
├── Vite (构建工具)
└── Markdown-it (Markdown 渲染)
```

### 后端技术栈
```
Rust + Tauri 2.0
├── Tauri Commands (前后端通信)
├── 智谱 AI SDK (AI 服务)
├── 文件系统操作
└── 配置管理
```

### 关键依赖
- `@tauri-apps/api`: Tauri 前端 API
- `pinia`: 状态管理
- `markdown-it`: Markdown 解析
- `vue`: UI 框架

---

## 📁 核心目录结构

```
iflow-desktop/
├── src/                          # 前端源码
│   ├── components/              # Vue 组件
│   │   ├── MainLayout.vue       # ⭐ 主布局（核心组件）
│   │   ├── ChatInterface.vue    # ⭐ 聊天界面
│   │   ├── SettingsPanel.vue    # 设置面板
│   │   ├── FileExplorer.vue     # 文件浏览器
│   │   ├── FileEditor.vue       # 文件编辑器
│   │   └── ChatHistory.vue      # 对话历史
│   ├── stores/                  # Pinia 状态管理
│   │   ├── chatStore.ts         # ⭐ 对话状态管理
│   │   ├── fileStore.ts         # 文件状态管理
│   │   └── iflowStore.ts        # iFlow 服务状态
│   ├── types/                   # TypeScript 类型定义
│   │   └── index.ts             # 核心类型定义
│   ├── utils/                   # 工具函数
│   │   ├── tokenUtils.ts        # Token 计算
│   │   ├── errorHandler.ts      # 错误处理
│   │   └── api.ts               # API 封装（如有）
│   ├── theme/                   # 主题系统
│   │   └── index.ts             # 浅色/深色主题
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 应用入口
│
├── src-tauri/                   # Rust 后端
│   ├── src/
│   │   ├── commands/            # Tauri 命令
│   │   │   ├── zhipu.rs         # ⭐ 智谱 AI 相关命令
│   │   │   ├── conversation.rs  # 对话管理命令
│   │   │   └── mod.rs           # 模块导出
│   │   ├── config.rs            # 配置管理
│   │   ├── logging.rs           # 日志系统
│   │   ├── zhipu_ai.rs          # 智谱 AI 客户端
│   │   ├── lib.rs               # 库入口
│   │   └── main.rs              # 主入口
│   ├── tauri.conf.json          # Tauri 配置
│   └── Cargo.toml               # Rust 依赖
│
└── .lingma/rules/
    └── home.md                  # Lingma 规则文件
```

---

## 🔑 核心概念

### 1. 对话系统

**数据流：**
```
用户输入 → ChatInterface → MainLayout → chatStore → Tauri Command → 智谱 AI
                                                                    ↓
响应 ← ChatInterface ← MainLayout ← chatStore ← Tauri Command ← 智谱 AI
```

**关键文件：**
- `src/stores/chatStore.ts`: 对话状态管理
- `src/components/ChatInterface.vue`: 聊天 UI
- `src-tauri/src/commands/zhipu.rs`: AI 调用逻辑

**消息结构：**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: string;        // 思考过程
  executionInfo?: {         // 执行信息
    execution_time_ms: number;
    token_usage: { input: number; output: number };
    assistant_rounds: number;
  };
}
```

### 2. 状态管理 (Pinia)

**三个核心 Store：**

1. **chatStore** - 对话管理
   - 对话列表 (`conversations`)
   - 当前活动对话 (`activeConversationId`)
   - 最新消息内容 (`latestMessageContent`)
   - 思考过程 (`latestThinking`)

2. **fileStore** - 文件管理
   - 当前工作目录
   - 文件列表
   - 选中文件

3. **iflowStore** - 服务状态
   - iFlow CLI 服务状态
   - 端口信息

**使用示例：**
```typescript
import { useChatStore } from '@/stores/chatStore';
import { storeToRefs } from 'pinia';

const chatStore = useChatStore();
const { conversations, activeConversationId } = storeToRefs(chatStore);
```

### 3. Tauri 命令调用

**前端调用方式：**
```typescript
import { invoke } from '@tauri-apps/api/core';

// 调用 Rust 命令
const result = await invoke('zhipu_chat', {
  messages: [...],
  model: 'glm-4',
  apiKey: '...'
});
```

**后端命令定义：**
```rust
#[tauri::command]
async fn zhipu_chat(
    messages: Vec<Message>,
    model: String,
    api_key: String
) -> Result<String, String> {
    // 实现逻辑
    Ok(response)
}
```

### 4. 主题系统

**位置：** `src/theme/index.ts`

**功能：**
- 浅色/深色主题切换
- CSS 变量自动应用
- localStorage 持久化
- 系统偏好检测

**使用：**
```typescript
import { toggleTheme, currentTheme } from '@/theme';

toggleTheme(); // 切换主题
console.log(currentTheme.value); // 'light' | 'dark'
```

---

## 🔄 核心工作流程

### 发送消息流程

```
1. 用户在 ChatInterface 输入消息
   ↓
2. 触发 @send-message 事件
   ↓
3. MainLayout.handleSendMessage() 处理
   ↓
4. 添加到 chatStore.messages
   ↓
5. 调用 Tauri Command: zhipu_chat
   ↓
6. Rust 后端调用智谱 AI API
   ↓
7. 流式返回响应
   ↓
8. 更新 chatStore.latestMessageContent
   ↓
9. ChatInterface 实时显示
```

### 对话管理流程

```
1. 创建新对话 → chatStore.createConversation()
2. 切换对话 → chatStore.setActiveConversation(id)
3. 删除对话 → chatStore.deleteConversation(id)
4. 自动保存 → localStorage (通过 watch)
```

---

## 🛠️ 开发要点

### 前端开发

**组件通信模式：**
```vue
<!-- 父组件 -->
<ChatInterface
  :messages="messages"
  @send-message="handleSend"
/>

<!-- 子组件 -->
<script setup lang="ts">
const emit = defineEmits<{
  'send-message': [content: string];
}>();

emit('send-message', content);
</script>
```

**响应式注意事项：**
```typescript
// ✅ 正确：保持响应式
const { state } = storeToRefs(myStore);

// ❌ 错误：失去响应式
const { state } = myStore;
```

### Rust 后端开发

**命令注册：**
```rust
// src-tauri/src/lib.rs
fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            zhipu::zhipu_chat,
            conversation::save_conversation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**错误处理：**
```rust
#[tauri::command]
async fn my_command() -> Result<String, String> {
    // 成功
    Ok("success".to_string())
    
    // 失败
    Err("error message".to_string())
}
```

---

## 📊 数据流向图

```
┌─────────────┐
│   User UI   │  (ChatInterface, SettingsPanel, etc.)
└──────┬──────┘
       │ Events & Props
       ▼
┌─────────────┐
│ MainLayout  │  (中央控制器)
└──────┬──────┘
       │
       ├──────────────┐
       ▼              ▼
┌────────────┐  ┌─────────────┐
│ chatStore  │  │ fileStore   │  (Pinia Stores)
└──────┬─────┘  └──────┬──────┘
       │                │
       ▼                ▼
┌─────────────────────────────┐
│   Tauri Commands (Rust)     │  (zhipu.rs, conversation.rs)
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   External Services         │  (智谱 AI API, File System)
└─────────────────────────────┘
```

---

## 🎨 UI 组件层次

```
App.vue
└── MainLayout.vue
    ├── Sidebar Left
    │   └── ChatHistory.vue
    │
    ├── Main Content
    │   ├── Toolbar (顶部工具栏)
    │   │   ├── 状态指示器
    │   │   ├── API Key 按钮
    │   │   ├── 角色选择器
    │   │   ├── 高级设置按钮
    │   │   └── 对话统计
    │   │
    │   └── ChatInterface.vue
    │       ├── ModelSelector.vue
    │       ├── Messages Container
    │       ├── Chat Actions Bar (快捷操作)
    │       └── Input Area
    │
    └── Sidebar Right
        ├── Quick Tools Panel (快捷工具)
        │   ├── Code Snippets
        │   ├── Quick Links
        │   └── Quick Notes
        │
        └── Thinking Display (思考过程)
```

---

## 🔍 常见问题定位

### 问题：消息发送失败

**检查点：**
1. API Key 是否配置？→ 查看 `localStorage.getItem('zhipu_api_key')`
2. 智谱 AI 服务是否就绪？→ 查看 `zhipuReady` 状态
3. 控制台是否有错误？→ 查看 `[API]` 或 `[MainLayout]` 日志
4. Rust 后端是否正常？→ 查看终端输出

### 问题：主题不生效

**检查点：**
1. `initTheme()` 是否在 `main.ts` 中调用？
2. `data-theme` 属性是否在 `<html>` 上？
3. CSS 变量是否正确定义？

### 问题：对话历史丢失

**检查点：**
1. localStorage 是否被清除？
2. `loadFromStorage()` 是否执行？
3. 浏览器控制台是否有存储错误？

---

## 📝 代码规范摘要

### TypeScript/Vue
- 使用严格模式，避免 `any`
- 组件名使用 PascalCase
- Store 解构使用 `storeToRefs`
- 所有 props 和 emits 必须定义类型

### Rust
- 所有 Tauri 命令添加 `#[tauri::command]`
- 使用 `Result<T, String>` 返回错误
- 使用 `tracing` 记录日志
- 函数名在 `generate_handler!` 中不加括号

---

## 🚀 快速上手指令

### 启动开发环境
```bash
npm install
npm run tauri dev
```

### 构建生产版本
```bash
npm run tauri build
```

### 运行测试
```bash
npm run test
```

---

## 💡 AI 助手提示

当您需要修改或理解此项目时：

1. **先查看类型定义** → `src/types/index.ts`
2. **理解数据流** → 从 `chatStore.ts` 开始
3. **找到相关组件** → 查看 `components/` 目录
4. **检查后端命令** → 查看 `src-tauri/src/commands/`
5. **参考现有实现** → 搜索类似功能的代码

**常用搜索关键词：**
- "对话管理" → `chatStore`, `conversations`
- "消息发送" → `handleSendMessage`, `zhipu_chat`
- "文件操作" → `fileStore`, `FileExplorer`
- "主题切换" → `theme`, `toggleTheme`

---

*最后更新：2026-04-10*
