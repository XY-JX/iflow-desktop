# iFlow Desktop

一个基于 Tauri + Vue 3 + Rust 的 AI 助手桌面应用。

## 功能特性

- **智能对话**：集成 iFlow CLI，提供智能代码分析和编程辅助
  - 🧠 思考模式：展示 AI 的思考过程
  - 📊 执行信息：显示 token 使用、耗时、轮次等
  - 🌊 流式传输：实时显示 AI 响应
- **对话管理**：创建、切换、删除对话历史
- **模型选择**：支持多种 AI 模型
- **文件浏览器**：浏览本地文件系统
- **文件编辑器**：在应用内编辑文件并保存
- **服务管理**：一键启动/停止 iFlow CLI 服务

## 技术栈

- **前端**: Vue 3 + TypeScript + Pinia
- **桌面框架**: Tauri 2.0
- **后端**: Rust
- **构建工具**: Vite
- **测试**: Vitest

## 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.70

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建生产版本

```bash
npm run tauri build
```

## 项目结构

```
iflow-desktop/
├── src/                    # Vue 前端源码
│   ├── components/         # Vue 组件
│   ├── stores/            # Pinia 状态管理
│   ├── types/             # TypeScript 类型定义
│   └── main.ts            # 应用入口
├── src-tauri/              # Tauri 后端
│   ├── src/               # Rust 源码
│   └── Cargo.toml         # Rust 依赖配置
└── package.json            # Node.js 依赖
```

## 许可证

MIT
