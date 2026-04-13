# 我的一个梦

<div align="center">

![Version](https://img.shields.io/badge/version-1.8.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131.svg)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D.svg)

**一个功能强大的 AI 编程助手桌面应用**

基于 Tauri 2.0 + Vue 3 + Rust 构建，提供智能对话、代码分析、文件管理等功能。

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [开发指南](#-开发指南) • [项目结构](#-项目结构)

</div>

---

## ✨ 功能特性

### 🤖 智能对话
- **流式响应**：实时显示 AI 思考过程和回答内容
- **多模型支持**：GLM-4.6V、GLM-4.5 Air、GLM-4、GLM-4 Flash
- **角色系统**：预设角色 + 自定义角色，满足不同场景需求
- **执行信息**：显示 token 使用量、耗时、轮次等详细信息

### 💬 对话管理
- **历史管理**：创建、切换、删除对话历史
- **上下文保持**：自动保存对话状态
- **Token 优化**：智能截断超长对话，避免超出限制

### 📁 文件管理
- **文件浏览器**：可视化浏览本地文件系统
- **代码编辑器**：内置编辑器，支持语法高亮
- **即时保存**：编辑后直接保存到文件系统

### ⚙️ 系统配置
- **API Key 管理**：安全的密钥配置和管理
- **自定义角色**：创建个性化的 AI 助手角色
- **参数调节**：温度、最大 Token 等高级设置

### 🎨 用户体验
- **现代 UI**：简洁美观的界面设计
- **深色模式**：自动适配系统主题
- **响应式布局**：适配不同屏幕尺寸
- **流畅动画**：优雅的交互动画效果

---

## 🚀 快速开始

### 环境要求

在开始之前，请确保你的系统已安装以下工具：

- **Node.js** >= 18.0.0
- **Rust** >= 1.70.0
- **Git**（可选，用于版本控制）

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/XY-JX/iflow-desktop.git
cd iflow-desktop
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 启动开发服务器

```bash
npm run tauri dev
```

这将同时启动 Vite 前端开发服务器和 Tauri 后端，应用窗口会自动打开。

#### 4. 构建生产版本

```bash
npm run tauri build
```

构建产物将生成在 `src-tauri/target/release/bundle/` 目录下：
- **Windows**: `.msi` 和 `.exe` 安装包
- **macOS**: `.dmg` 和 `.app` 安装包
- **Linux**: `.deb` 和 `.AppImage` 包

---

## 📖 开发指南

### 项目结构

```
我的一个梦/
├── src/                          # Vue 前端源码
│   ├── components/              # Vue 组件
│   │   ├── SplashScreen.vue     # 启动页
│   │   ├── MainLayout.vue       # 主布局
│   │   ├── ChatInterface.vue    # 聊天界面
│   │   ├── ChatHistory.vue      # 聊天记录
│   │   ├── FileEditor.vue       # 文件编辑器
│   │   ├── FileExplorer.vue     # 文件浏览器
│   │   ├── SettingsPanel.vue    # 设置面板
│   │   └── ...                  # 其他组件
│   ├── stores/                  # Pinia 状态管理
│   │   ├── chatStore.ts         # 对话状态
│   │   ├── fileStore.ts         # 文件状态
│   │   └── iflowStore.ts        # iFlow 服务状态
│   ├── utils/                   # 工具函数
│   │   ├── api.ts               # API 调用封装
│   │   ├── errorHandler.ts      # 错误处理
│   │   ├── logger.ts            # 日志系统
│   │   ├── tokenUtils.ts        # Token 计算工具
│   │   └── totp.ts              # TOTP 生成器
│   ├── types/                   # TypeScript 类型定义
│   ├── theme/                   # 主题配置
│   │   └── index.ts             # 全局主题系统
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 应用入口
├── src-tauri/                   # Tauri 后端 (Rust)
│   ├── src/
│   │   ├── commands/            # Tauri 命令
│   │   │   ├── zhipu.rs         # 智谱 AI 相关命令
│   │   │   ├── conversation.rs  # 对话管理命令
│   │   │   └── totp.rs          # TOTP 相关命令
│   │   ├── config.rs            # 配置管理
│   │   ├── logging.rs           # 日志系统
│   │   ├── lib.rs               # 库入口
│   │   └── main.rs              # 主入口
│   ├── capabilities/            # 权限配置
│   ├── icons/                   # 应用图标
│   ├── Cargo.toml               # Rust 依赖
│   └── tauri.conf.json          # Tauri 配置
├── .env*                        # 环境变量配置
├── package.json                 # Node.js 依赖
├── tsconfig.json                # TypeScript 配置
└── vite.config.ts               # Vite 配置
```

### 常用命令

```bash
# 开发
npm run tauri dev          # 启动开发环境

# 构建
npm run tauri build        # 构建生产版本

# 测试
npm run test               # 运行单元测试
npm run test:watch         # 监听模式运行测试

# 代码质量
npm run lint               # 代码检查
npm run format             # 代码格式化
```

### 开发规范

#### 前端开发

1. **组件命名**：使用 PascalCase，如 `ChatInterface.vue`
2. **状态管理**：使用 Pinia store 管理全局状态
3. **类型安全**：所有变量和函数必须有明确的类型
4. **响应式解构**：使用 `storeToRefs` 保持响应式

```typescript
// ✅ 正确
const { state } = storeToRefs(myStore);

// ❌ 错误
const { state } = myStore; // 失去响应式
```

#### Rust 后端

1. **命令定义**：所有 Tauri 命令必须添加 `#[tauri::command]` 属性
2. **错误处理**：使用 `Result<T, String>` 返回错误
3. **日志记录**：使用 `tracing` 进行日志记录

```rust
// ✅ 正确
#[tauri::command]
async fn my_command() -> Result<String, String> {
    tracing::info!("Command executed");
    Ok("success".to_string())
}

// ❌ 错误
fn my_command() { /* ... */ } // 缺少属性和返回类型
```

### 调试技巧

#### 前端调试

- 打开开发者工具：`Ctrl + Shift + I` (Windows/Linux) 或 `Cmd + Option + I` (macOS)
- 查看控制台日志：所有 `[MainLayout]`、`[API]` 等前缀的日志
- 网络请求：Tauri 命令调用不会显示在网络面板，需查看控制台

#### 后端调试

- Rust 日志输出到控制台
- 使用 `tracing::info!`、`tracing::error!` 等宏记录日志
- 查看详细错误信息：查看终端输出

---

## 🏗️ 技术架构

### 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Vue 3 | Composition API + `<script setup>` |
| **状态管理** | Pinia | 轻量级、类型安全的状态管理 |
| **构建工具** | Vite | 快速的开发服务器和构建工具 |
| **桌面框架** | Tauri 2.0 | 轻量级跨平台桌面应用框架 |
| **后端语言** | Rust | 高性能、内存安全的系统编程语言 |
| **类型系统** | TypeScript | 静态类型检查，提高代码质量 |
| **测试框架** | Vitest | 快速的单元测试框架 |

### 核心模块

#### 1. 对话管理系统 (`chatStore.ts`)

负责管理所有对话相关的状态：
- 对话列表和当前活动对话
- 消息历史和流式响应
- Token 计数和自动截断

#### 2. 文件管理系统 (`fileStore.ts`)

提供文件浏览和编辑功能：
- 文件系统导航
- 文件选择和预览
- 编辑状态管理

#### 3. API 封装层 (`utils/api.ts`)

统一的 Tauri 命令调用接口：
- 错误处理和日志记录
- 类型安全的命令调用
- 批量操作支持

#### 4. 主题系统 (`theme/index.ts`)

全局设计令牌管理：
- 颜色、间距、圆角等常量
- 统一的视觉风格
- 易于维护和扩展

---

## 🔧 配置说明

### Tauri 配置 (`src-tauri/tauri.conf.json`)

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420"
  },
  "app": {
    "windows": [
      {
        "title": "iFlow Desktop",
        "width": 1200,
        "height": 800
      }
    ]
  }
}
```

### 环境变量

创建 `.env` 文件（可选）：

```env
VITE_APP_NAME=我的一个梦
VITE_APP_TITLE=我的一个梦 - Desktop
VITE_APP_VERSION=1.8.1
```

---

## 📝 常见问题

### Q: 如何重置 API Key？

A: 点击顶部的 "⚙️ 管理 API Key" 按钮，在弹出的对话框中可以清除或重新配置。

### Q: 自定义角色存储在哪里？

A: 自定义角色存储在应用的配置文件中，通过 Rust 后端管理，位置因系统而异：
- Windows: `%APPDATA%\com.iflow.desktop\`
- macOS: `~/Library/Application Support/com.iflow.desktop/`
- Linux: `~/.config/com.iflow.desktop/`

### Q: 如何贡献代码？

A: 
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [Tauri](https://tauri.app/) - 优秀的桌面应用框架
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [智谱 AI](https://open.bigmodel.cn/) - 提供强大的 AI 能力

---

<div align="center">

**Made with ❤️ by XY-JX**

[报告问题](https://github.com/XY-JX/iflow-desktop/issues) • [请求功能](https://github.com/XY-JX/iflow-desktop/issues)

</div>
