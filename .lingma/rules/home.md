---
trigger: always_on
---

# iFlow Desktop 项目说明

## 项目简介

iFlow Desktop 是一个基于 Tauri + Vue 3 + Rust 开发的 AI 编程助手桌面应用。它集成了 iFlow CLI，提供智能对话、代码分析和思考过程展示等功能。

## 技术栈

- **前端**: Vue 3 + TypeScript + Pinia + Vite
- **后端**: Rust + Tauri 2.0
- **状态管理**: Pinia
- **测试框架**: Vitest
- **构建工具**: Cargo (Rust) + Vite (Frontend)

## 项目结构

```
iflow-desktop/
├── src/                      # Vue 前端源码
│   ├── components/          # Vue 组件
│   ├── stores/             # Pinia 状态管理
│   ├── types/              # TypeScript 类型定义
│   └── main.ts             # 应用入口
├── src-tauri/               # Rust 后端
│   ├── src/
│   │   ├── commands/       # Tauri 命令实现
│   │   ├── logging.rs      # 日志系统
│   │   └── lib.rs          # Rust 库入口
│   └── Cargo.toml          # Rust 依赖配置
├── .github/workflows/       # GitHub Actions CI/CD
└── package.json             # Node.js 依赖配置
```

## 核心功能

### 1. 智能对话
- 集成 iFlow CLI 进行 AI 对话
- 支持流式响应输出
- 显示思考过程和执行信息

### 2. 对话管理
- 创建、切换、删除对话历史
- 支持多种 AI 模型切换

### 3. 文件操作
- 文件浏览器
- 文件编辑器
- 工作目录选择

### 4. 服务管理
- 一键启动/停止 iFlow CLI 服务
- 服务状态监控

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

## 相关链接

- GitHub 仓库：https://github.com/XY-JX/iflow-desktop
- GitHub Actions: https://github.com/XY-JX/iflow-desktop/actions
- Tauri 文档：https://tauri.app/
- Vue 3 文档：https://vuejs.org/

