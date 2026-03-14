# 架构说明

## 整体架构

iFlow Desktop 采用现代化的前端架构，结合 Tauri 的跨平台能力和 Rust 的高性能特性。

## 技术栈

### 前端技术栈
- **框架**：Vue 3.5.13
- **语言**：TypeScript 5.6.2
- **构建工具**：Vite 6.0.3
- **桌面框架**：Tauri 2.0
- **UI 库**：原生 Vue 组件（无第三方 UI 库）

### 后端技术栈
- **语言**：Rust 2021 Edition
- **桌面框架**：Tauri 2.0
- **日志**：tracing + tracing-subscriber
- **序列化**：serde + serde_json

## 架构分层

```
┌─────────────────────────────────────────┐
│         用户界面层 (Vue 3)              │
│  ┌─────────────────────────────────────┐ │
│  │  ChatInterface  │  FileExplorer   │ │
│  │  ChatHistory    │  FileEditor     │ │
│  │  ModelSelector  │  MainLayout      │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                   ↓ Tauri API
┌─────────────────────────────────────────┐
│      桌面应用层 (Tauri 2.0)             │
│  ┌─────────────────────────────────────┐ │
│  │  Plugin Manager  │  Event System   │ │
│  │  Window Manager  │  File System    │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                   ↓ FFI
┌─────────────────────────────────────────┐
│       业务逻辑层 (Rust)                 │
│  ┌─────────────────────────────────────┐ │
│  │  iFlow CLI Integration             │ │
│  │  Logging System                    │ │
│  │  Config Management                 │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                   ↓ Process
┌─────────────────────────────────────────┐
│       外部服务层                        │
│  ┌─────────────────────────────────────┐ │
│  │  iFlow CLI (node.exe)              │ │
│  │  File System                       │ │
│  │  System Registry                   │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 核心模块

### 1. 消息处理模块

**位置**：`src-tauri/src/lib.rs`

**功能**：
- 与 iFlow CLI 通信
- 解析执行信息
- 处理思考过程
- 错误处理和日志记录

**关键函数**：
- `send_message_to_iflow()`: 发送消息到 iFlow CLI
- `start_iflow()`: 检查 iFlow CLI 可用性
- `check_iflow_running()`: 检查运行状态
- `stop_iflow()`: 停止 iFlow CLI

### 2. 日志系统模块

**位置**：`src-tauri/src/logging.rs`

**功能**：
- 初始化日志系统
- 配置日志输出（控制台 + 文件）
- 日志文件滚动（每日一个文件）
- 清理旧日志（保留 7 天）

**日志位置**：`安装目录/logs/`

### 3. 配置管理模块

**位置**：`src-tauri/src/lib.rs`

**功能**：
- 获取安装目录
- 管理配置文件
- 对话历史持久化

**配置位置**：`安装目录/config/`

### 4. UI 组件模块

**位置**：`src/components/`

**组件说明**：
- `ChatInterface.vue`: 聊天界面，含思考过程展示
- `ChatHistory.vue`: 对话历史管理
- `FileExplorer.vue`: 文件浏览器
- `FileEditor.vue`: 文件编辑器
- `MainLayout.vue`: 主布局，右侧分栏
- `ModelSelector.vue`: 模型选择器

## 数据流

### 消息发送流程

```
用户输入
    ↓
ChatInterface.vue
    ↓ (emit)
MainLayout.vue
    ↓ (invoke)
Tauri Command
    ↓ (execute)
send_message_to_iflow()
    ↓ (Command::new)
iFlow CLI (--thinking --stream)
    ↓ (output)
解析响应
    ↓ (return JSON)
MainLayout.vue
    ↓ (update state)
右侧边栏显示思考过程
```

### 状态管理

**全局状态**：
- `conversations`: 对话列表
- `activeConversationId`: 当前对话 ID
- `currentModel`: 当前选择的模型
- `isGenerating`: 是否正在生成
- `iflowRunning`: iFlow 服务状态
- `latestThinking`: 最新的思考过程

**状态流转**：
```
用户输入 → 生成中 → 思考中 → 完成
    ↓        ↓        ↓       ↓
保存消息 → 显示思考 → 更新UI → 恢复状态
```

## 进程通信

### Tauri 命令

**前端 → 后端**：
```typescript
invoke('send_message_to_iflow', { message: content })
invoke('check_iflow_installed')
invoke('check_iflow_running')
invoke('start_iflow')
invoke('stop_iflow')
invoke('load_conversations')
invoke('save_conversations')
```

**后端 → 前端**：
- 通过事件系统
- 返回 Promise 结果
- 错误处理机制

### 外部进程调用

**iFlow CLI 调用**：
```rust
Command::new("iflow.cmd")
    .arg("-p")
    .arg(&message)
    .arg("--stream")
    .arg("--thinking")
    .creation_flags(CREATE_NO_WINDOW)
    .output()
```

**无窗口运行**：
- 使用 `CREATE_NO_WINDOW` 标志
- 完全后台运行
- 无用户界面干扰

## 性能优化

### 1. 构建优化

**GitHub Actions 缓存**：
- Rust 依赖缓存（registry + target）
- Node modules 缓存
- 多级缓存恢复策略

**预期效果**：
- 首次构建：10-30 分钟
- 后续构建：3-5 分钟（缓存命中）

### 2. 运行时优化

**前端优化**：
- Vue 3 Composition API
- 响应式数据绑定
- 虚拟滚动（如需要）

**后端优化**：
- 异步处理
- 流式传输
- 增量编译

### 3. 资源管理

**内存管理**：
- 对话历史分页加载
- 大文件按需读取
- 及时清理无用资源

**磁盘管理**：
- 日志文件滚动
- 自动清理旧日志
- 配置文件压缩

## 安全考虑

### 1. 进程隔离

- iFlow CLI 在独立进程中运行
- 窗口隐藏，无法交互
- 异常处理和日志记录

### 2. 文件访问

- 使用 Tauri 文件系统 API
- 权限控制（capabilities）
- 用户授权确认

### 3. 数据保护

- 配置文件存储在安装目录
- 日志文件定期清理
- 敏感信息不记录

## 扩展性

### 1. 插件系统

**Tauri Plugins**：
- `tauri-plugin-fs`: 文件系统
- `tauri-plugin-dialog`: 对话框
- `tauri-plugin-opener`: URL 打开

### 2. 功能扩展

**可扩展功能**：
- 更多 AI 模型支持
- 代码片段管理
- 项目模板
- 自定义命令

### 3. 集成扩展

**可集成服务**：
- Git 操作
- 云存储同步
- 团队协作
- CI/CD 集成

## 监控和调试

### 1. 日志系统

**日志级别**：
- INFO: 正常操作
- WARN: 警告信息
- ERROR: 错误信息
- DEBUG: 调试信息

**日志位置**：
```
安装目录/logs/iflow-desktop.log.YYYY-MM-DD
```

### 2. 性能监控

**执行信息**：
- token 使用量
- 执行时间
- 轮次统计

### 3. 错误处理

**错误类型**：
- iFlow CLI 调用失败
- 文件操作失败
- 网络请求失败
- 序列化/反序列化失败

**处理策略**：
- 友好错误提示
- 详细日志记录
- 自动重试机制

## 未来规划

### 1. 功能增强

- 流式传输实时更新
- 多对话并行处理
- 代码片段高亮
- Markdown 渲染

### 2. 性能提升

- WebAssembly 优化
- 离线模式支持
- 增量更新机制
- 资源预加载

### 3. 生态建设

- 插件市场
- 主题系统
- API 开放
- 社区贡献

## 参考资源

- [Tauri 官方文档](https://tauri.app/)
- [Vue 3 文档](https://vuejs.org/)
- [Rust 文档](https://www.rust-lang.org/)
- [iFlow CLI 文档](https://platform.iflow.cn/)