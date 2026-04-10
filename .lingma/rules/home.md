---
trigger: always_on
---

# iFlow Desktop - AI 助手工作指南

> **重要**: 本文档是 AI 助手的核心工作指南，请仔细阅读并遵循。

## 📖 项目简介

iFlow Desktop 是一个基于 Tauri + Vue 3 + Rust 开发的 AI 编程助手桌面应用。它集成了智谱 AI API，提供智能对话、代码分析和思考过程展示等功能。

**核心价值**: 为开发者提供一个本地化的 AI 编程助手，支持对话管理、文件操作和代码分析。

## 🚀 AI 助手任务流程

### 标准工作流程（每次启动时执行）

#### 1️⃣ 启动时检查任务

```bash
# 查看所有任务
npm run task:list

# 或查看统计信息
npm run task:stats
```

**关注点:**
- 🔴 高优先级任务（立即执行）
- 🟡 中优先级任务（近期执行）
- 🟢 低优先级任务（有空执行）

#### 2️⃣ 理解任务要求

**任务格式:**
```markdown
- [ ] 任务描述
  - 相关文件：`path/to/file`
  - 说明：功能说明或注意事项
```

**行动:**
1. 阅读任务描述，明确目标
2. 查看相关文件的当前实现
3. 理解预期结果和注意事项
4. 如有疑问，参考 `DEVELOPMENT.md` 或 `.lingma/AI_PROJECT_GUIDE.md`

#### 3️⃣ 执行任务

**开发原则:**
- ✅ 遵循现有代码风格和规范
- ✅ 保持代码简洁、可读
- ✅ 添加必要的注释
- ✅ 确保类型安全（TypeScript）
- ✅ 考虑深色主题兼容性

**常见操作:**
- 修改组件: `src/components/*.vue`
- 更新状态: `src/stores/*.ts`
- 添加类型: `src/types/index.ts`
- Rust 后端: `src-tauri/src/commands/*.rs`

#### 4️⃣ 测试验证

```bash
# 启动开发服务器
npm run tauri dev

# 运行单元测试
npm run test
```

**测试要点:**
- 功能是否按预期工作
- UI 是否正常显示
- 深色主题是否适配
- 是否有控制台错误
- 性能是否合理

#### 5️⃣ 完成任务

```bash
# 自动删除已完成任务
npm run task:complete <任务编号>
```

**特性:**
- ✅ 任务会自动从清单中删除
- ✅ 包括详细信息一起删除
- ✅ 无需手动编辑文件

#### 6️⃣ 继续下一个任务

重复步骤 1-5，直到所有任务完成。

---

## 🛠️ 任务管理工具

### 常用命令

```bash
# 查看任务
npm run task:list          # 列出所有任务
npm run task:stats         # 查看统计信息

# 添加任务
npm run task:add "描述" --priority high --files "src/a.vue" --note "说明"

# 完成任务（自动删除）
npm run task:complete 1

# 移动任务优先级
npm run task:move 2 low

# 删除任务
npm run task:delete 3
```

### 任务优先级

| 优先级 | 标识 | 说明 | 响应时间 |
|--------|------|------|----------|
| 高 | 🔴 | Bug 修复、紧急功能 | 立即执行 |
| 中 | 🟡 | 新功能、重要改进 | 近期执行 |
| 低 | 🟢 | 优化、重构 | 有空执行 |

### 最佳实践

✅ **推荐:**
- 任务描述清晰具体
- 标注相关文件和说明
- 及时清理已完成任务
- 定期查看统计信息

❌ **避免:**
- 任务过于笼统
- 缺少关键信息
- 积累过多历史任务
- 所有任务都设为高优先级

---

## 技术栈

- **前端**: Vue 3 + TypeScript + Pinia + Vite
- **后端**: Rust + Tauri 2.0
- **状态管理**: Pinia
- **测试框架**: Vitest
- **构建工具**: Cargo (Rust) + Vite (Frontend)

---

## 📚 核心文档索引

| 文档 | 路径 | 用途 | 何时查阅 |
|------|------|------|----------|
| **任务清单** | `AI_TASKS.md` | 查看待执行任务 | 每次启动时 |
| **任务管理指南** | `TASK_MANAGEMENT_GUIDE.md` | 学习使用任务系统 | 需要时 |
| **开发指南** | `DEVELOPMENT.md` | 环境搭建、架构、规范 | 开发新功能时 |
| **项目理解指南** | `.lingma/AI_PROJECT_GUIDE.md` | 深入理解项目架构 | 遇到复杂问题时 |
| **README** | `README.md` | 项目介绍、快速开始 | 初次接触时 |

**💡 提示**: 遇到问题时，按以下顺序查找答案：
1. 本文档（工作流程）
2. `AI_PROJECT_GUIDE.md`（架构和概念）
3. `DEVELOPMENT.md`（开发细节）
4. 相关源代码文件

## 项目结构

```
iflow-desktop/
├── src/                      # Vue 前端源码
│   ├── components/          # Vue 组件 (MainLayout, ChatInterface, etc.)
│   ├── stores/             # Pinia 状态管理 (chatStore, fileStore)
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数 (tokenUtils, api)
│   ├── theme/              # 主题系统
│   └── main.ts             # 应用入口
├── src-tauri/               # Rust 后端
│   ├── src/
│   │   ├── commands/       # Tauri 命令 (zhipu.rs, conversation.rs)
│   │   ├── config.rs       # 配置管理
│   │   ├── logging.rs      # 日志系统
│   │   └── lib.rs          # Rust 库入口
│   └── Cargo.toml          # Rust 依赖配置
├── scripts/                 # 脚本工具
│   └── task-manager.js     # 任务管理工具
├── .lingma/                 # AI 助手文档
│   ├── rules/home.md       # 本文档（工作流程）
│   └── AI_PROJECT_GUIDE.md # 项目理解指南
└── AI_TASKS.md             # 任务清单
```

---

## 🔄 核心数据流

### 消息发送流程

```
用户输入 
  → ChatInterface.vue (输入框)
  → MainLayout.vue (handleSendMessage)
  → chatStore (addMessage)
  → Tauri Command (Rust: zhipu.rs)
  → 智谱 AI API
  → 流式响应
  → chatStore (updateMessage)
  → ChatInterface.vue (显示)
```

### 关键文件映射

| 功能 | 前端文件 | 后端文件 | Store |
|------|---------|---------|-------|
| 智能对话 | `ChatInterface.vue` | `zhipu.rs` | `chatStore.ts` |
| 对话历史 | `ChatHistory.vue` | `conversation.rs` | `chatStore.ts` |
| 文件浏览 | `FileExplorer.vue` | - | `fileStore.ts` |
| 文件编辑 | `FileEditor.vue` | - | `fileStore.ts` |
| 设置面板 | `SettingsPanel.vue` | `config.rs` | - |
| 统计面板 | `StatsPanel.vue` | - | `chatStore.ts` |

## 核心功能

### 1. 智能对话
- 集成智谱 AI API 进行 AI 对话
- 支持流式响应输出
- 显示思考过程和执行信息
- 支持消息引用和代码收藏

### 2. 对话管理
- 创建、切换、删除对话历史
- 支持多种 AI 模型切换
- 对话搜索和标签管理
- 导出为 Markdown 或 PDF

### 3. 文件操作
- 文件浏览器
- 文件编辑器
- 工作目录选择

### 4. 快捷工具
- 代码片段收藏
- 快速链接管理
- 快捷笔记
- 统计分析面板

## 打包构建流程

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run tauri dev

# 构建生产版本
npm run tauri build
```

### GitHub Actions 自动打包

触发条件：推送标签（v*.*.*格式）

**构建步骤：**

1. **Windows 构建** (`build-windows`):
   - 安装 Visual Studio Build Tools（通过 Chocolatey）
   - 缓存 Rust 依赖和索引
   - 安装 Rust 工具链
   - 缓存 Node.js 模块
   - 安装 Node.js 依赖
   - 执行 `npm run tauri build`
   - 上传产物：`.msi` 和 `.exe` 安装包

2. **macOS 构建** (`build-macos`):
   - 缓存 Rust 依赖和索引
   - 安装 Rust 工具链（支持 x86_64 和 aarch64）
   - 缓存 Node.js 模块
   - 安装 Node.js 依赖
   - 执行 `npm run tauri build`
   - 上传产物：`.dmg` 和 `.app` 安装包

### 构建产物

**Windows:**
- `src-tauri/target/release/bundle/msi/*.msi`
- `src-tauri/target/release/bundle/nsis/*.exe`

**macOS:**
- `src-tauri/target/release/bundle/dmg/*.dmg`
- `src-tauri/target/release/bundle/macos/*.app`

## 常见问题修复

### 🔍 快速问题定位

#### 消息发送失败？
1. 检查 API Key: `localStorage.getItem('zhipu_api_key')`
2. 查看控制台日志: `[API]`, `[MainLayout]`
3. 确认智谱 AI 状态: `zhipuReady`
4. 检查网络请求是否成功

#### 主题不生效？
1. 检查 `main.ts` 是否调用 `initTheme()`
2. 查看 `<html>` 是否有 `data-theme` 属性
3. 验证 CSS 变量定义

#### 对话历史丢失？
1. 检查 localStorage 是否被清除
2. 确认 `loadFromStorage()` 已执行
3. 查看浏览器控制台错误

#### 组件通信问题？
- 父传子: 使用 props
- 子传父: 使用 emit
- 跨组件: 使用 Pinia store
- ⚠️ Store 解构必须用 `storeToRefs`

---

### Rust 编译错误

1. **link.exe not found** (Windows):
   - 原因：缺少 MSVC 编译器
   - 解决：在 GitHub Actions 中使用 Chocolatey 安装 Visual Studio Build Tools

2. **找不到函数/属性宏**:
   - 确保添加 `#[tauri::command]` 属性到命令函数
   - 导入必要的宏：`use tracing::instrument;`

3. **函数引用语法错误**:
   - `generate_handler!` 中使用函数名，不是函数调用
   - ✅ 正确：`logging::get_log_file_path,`
   - ❌ 错误：`logging::get_log_file_path(),`

### TypeScript 类型错误

1. **Store 响应式解构**:
   - 使用 `storeToRefs` 保持响应式
   ```typescript
   const { state } = storeToRefs(myStore);
   ```

2. **Vitest 全局变量**:
   - 在 `vite-env.d.ts` 中添加 `/// <reference types="vitest/globals" />`

## 发布流程

1. 提交代码并推送到 GitHub
2. 打标签：`git tag -a v1.8.1 -m "Release message"`
3. 推送标签：`git push origin v1.8.1`
4. GitHub Actions 自动触发构建
5. 构建成功后在 Releases 页面下载产物

## 代码规范

### Rust
- 所有 Tauri 命令必须添加 `#[tauri::command]` 属性
- 使用 `tracing` 进行日志记录
- 错误处理使用 `Result<T, String>`

### TypeScript/Vue
- 使用严格模式
- 避免使用 `any` 类型
- Store 解构使用 `storeToRefs`
- 组件名称可以使用单个单词
- 保持深色主题兼容性

---

## 💡 开发提示

### Vue 组件通信
```vue
<!-- 父传子 -->
<ChildComponent :prop="value" />

<!-- 子传父 -->
<script setup>
const emit = defineEmits(['event-name']);
emit('event-name', data);
</script>
```

### Pinia Store 使用
```typescript
import { storeToRefs } from 'pinia';

const store = useMyStore();
const { state } = storeToRefs(store); // ✅ 保持响应式
// const { state } = store; // ❌ 失去响应式
```

### Tauri 命令调用
```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('command_name', { param: value });
```

### 调试技巧
- **前端**: `Ctrl + Shift + I` 打开开发者工具
- **后端**: 查看终端输出的 Rust 日志
- **日志前缀**: `[MainLayout]`, `[API]`, `[ChatInterface]`

---

## 📝 总结

**AI 助手的核心职责:**
1. ✅ 每次启动时检查任务清单
2. ✅ 从高优先级开始执行任务
3. ✅ 遵循项目规范和最佳实践
4. ✅ 测试验证后标记完成
5. ✅ 持续迭代直到所有任务完成

**记住:**
- 任务完成后会自动删除，保持清单简洁
- 遇到问题先查阅相关文档
- 保持代码质量和一致性
- 考虑用户体验和深色主题

---

## 🔗 相关链接

- GitHub 仓库：https://github.com/XY-JX/iflow-desktop
- GitHub Actions: https://github.com/XY-JX/iflow-desktop/actions
- Tauri 文档：https://tauri.app/
- Vue 3 文档：https://vuejs.org/
- 智谱 AI: https://open.bigmodel.cn/

