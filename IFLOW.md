# iFlow CLI 配置文件

## 项目概述

**项目名称**：iFlow Desktop  
**项目类型**：AI 助手桌面应用  
**技术栈**：Tauri 2.0 + Vue 3 + Rust  
**主要功能**：集成 iFlow CLI，提供智能对话、文件管理和 AI 辅助编程功能

## iFlow CLI 集成说明

### 使用方式

本项目通过 Rust 后端直接调用 iFlow CLI，实现以下功能：

1. **智能对话**：
   - 使用 `iflow.cmd -p "消息" --stream --thinking` 进行非交互式对话
   - 自动启用思考模式（`--thinking`）
   - 使用流式传输（`--stream`）
   - 隐藏命令行窗口（`CREATE_NO_WINDOW`）

2. **服务检查**：
   - 使用 `iflow.cmd --version` 检查可用性
   - 不启动交互式 CLI，避免弹出命令行窗口

### 通信方式

- **命令执行**：通过 Rust 的 `std::process::Command` 调用
- **窗口隐藏**：使用 `CREATE_NO_WINDOW` 标志实现无窗口运行
- **输出解析**：解析 stdout（内容）和 stderr（执行信息）
- **数据格式**：返回 JSON 格式的结构化数据

## 项目结构

```
iflow-desktop/
├── src/                          # Vue 前端源码
│   ├── components/               # Vue 组件
│   │   ├── ChatInterface.vue    # 聊天界面（含思考过程展示）
│   │   ├── ChatHistory.vue      # 对话历史管理
│   │   ├── FileExplorer.vue     # 文件浏览器
│   │   ├── FileEditor.vue       # 文件编辑器
│   │   ├── MainLayout.vue       # 主布局（右侧分栏）
│   │   └── ModelSelector.vue    # 模型选择器
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts             # 核心类型（含 ExecutionInfo）
│   ├── App.vue                   # 根组件
│   └── main.ts                   # 应用入口
├── src-tauri/                    # Tauri 后端（Rust）
│   ├── src/                      # Rust 源码
│   │   ├── main.rs              # 主入口
│   │   ├── lib.rs               # 库接口（iFlow CLI 集成）
│   │   └── logging.rs           # 日志模块
│   ├── capabilities/             # 权限配置
│   │   └── default.json         # 默认权限
│   ├── icons/                    # 应用图标
│   ├── Cargo.toml               # Rust 依赖配置
│   ├── build.rs                 # 构建脚本
│   └── tauri.conf.json          # Tauri 配置
├── public/                       # 静态资源
├── logs/                         # 日志目录（安装目录下）
├── config/                       # 配置目录（安装目录下）
└── package.json                  # Node.js 依赖
```

## 核心功能实现

### 1. 智能对话（思考模式）

**后端实现**：
- 自动启用 `--thinking` 参数
- 解析执行信息（token 使用、耗时、轮次）
- 返回结构化 JSON 数据

**前端展示**：
- 右侧边栏下部分显示思考过程
- 实时更新最新的思考内容
- 支持长文本滚动显示

### 2. 无窗口后台运行

**实现方式**：
```rust
#[cfg(target_os = "windows")]
{
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    cmd.creation_flags(CREATE_NO_WINDOW);
}
```

**优势**：
- 无命令行弹框干扰
- 完全在桌面应用内交互
- 流畅的用户体验

### 3. 思考过程实时显示

**数据流**：
1. 用户输入消息
2. 后端调用 iFlow CLI（`--thinking`）
3. 解析思考过程和执行信息
4. 返回 JSON 格式数据
5. 前端实时更新到右侧边栏

**UI 布局**：
- 右侧边栏分为上下两部分
- 上部分：文件浏览器
- 下部分：思考过程显示

## 数据类型定义

### Message
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: string;           // 思考过程
  executionInfo?: ExecutionInfo; // 执行信息
}
```

### ExecutionInfo
```typescript
interface ExecutionInfo {
  session_id: string;
  conversation_id: string;
  assistant_rounds: number;
  execution_time_ms: number;
  token_usage: {
    input: number;
    output: number;
    total: number;
  };
}
```

## 配置文件位置

### 日志文件
```
安装目录/logs/iflow-desktop.log.YYYY-MM-DD
```

### 配置文件
```
安装目录/config/conversations.json
```

## 开发指南

### 本地开发

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **开发模式**：
   ```bash
   npm run tauri dev
   ```

3. **构建应用**：
   ```bash
   npm run tauri build
   ```

### 远程打包

使用 GitHub Actions 自动打包：
1. 推送标签触发构建
2. 支持 Windows 和 macOS 平台
3. 自动缓存依赖，加速构建

## 注意事项

1. **iFlow CLI 依赖**：
   - 应用运行前需要安装 iFlow CLI
   - 使用 `npm install -g @iflow-ai/iflow-cli@latest`
   - 首次使用需要登录授权

2. **平台兼容性**：
   - Windows：使用 `iflow.cmd`
   - macOS/Linux：使用 `iflow`
   - 已实现无窗口运行

3. **性能优化**：
   - 使用流式传输减少等待时间
   - 启用 GitHub Actions 缓存加速构建
   - 本地构建需等待 10-30 分钟（首次）

## 常见问题

### Q: 为什么思考过程显示在右侧而不是聊天窗口？
A: 为了更好地组织界面，右侧下部分专门用于显示思考过程，聊天窗口专注于对话内容。

### Q: 如何查看历史对话？
A: 点击左侧对话历史列表，选择对应的对话即可查看。

### Q: iFlow CLI 启动失败怎么办？
A: 检查是否已安装 iFlow CLI，并完成登录授权。查看日志文件获取详细错误信息。

### Q: 为什么本地构建很慢？
A: Rust 首次构建需要编译大量依赖，后续构建会使用增量编译，速度会快很多。建议使用 GitHub Actions 远程打包。

## 更新日志

### v1.7.1
- ✅ 集成 iFlow CLI 智能对话功能
- ✅ 实现思考过程实时显示
- ✅ 添加执行信息展示
- ✅ 优化右侧边栏布局
- ✅ 实现无窗口后台运行
- ✅ 移动配置和日志到安装目录
- ✅ 优化 GitHub Actions 缓存
- ✅ 修复编译警告

## 相关文档

- [README.md](README.md) - 项目说明
- [DEVELOPMENT.md](DEVELOPMENT.md) - 开发文档
- [TAURI_BASICS.md](TAURI_BASICS.md) - Tauri 基础知识