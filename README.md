# iFlow Desktop

一个基于 Tauri + Vue 3 开发的 Windows 11 桌面应用，集成了 iFlow CLI，提供 AI 辅助编程和文件管理功能。

## 功能特性

- **对话管理**：创建、切换、删除对话历史
- **模型选择**：支持多种 AI 模型（GPT-4、GPT-3.5 Turbo、Claude 3、GLM-4）
- **文件浏览器**：浏览本地文件系统，选择工作目录
- **文件编辑器**：在应用内编辑文件并保存
- **AI 对话**：集成 iFlow CLI，提供智能代码分析和编程辅助

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite
- **桌面框架**：Tauri 2.0
- **后端**：Rust
- **构建工具**：Vite

## 快速开始

### 安装 iFlow CLI

```bash
npm install -g @iflow-ai/iflow-cli@latest
```

### 配置 iFlow CLI

首次运行 iFlow 需要登录：

```bash
iflow
```

选择 "Login with iFlow" 方式登录（推荐），完成浏览器授权。

### 启动应用

开发模式：
```bash
cd iflow-desktop
npm run dev
```

或启动完整桌面应用（需要先安装 Rust）：
```bash
npm run tauri dev
```

## 项目结构

```
iflow-desktop/
├── src/                    # Vue 前端源码
│   ├── components/         # Vue 组件
│   ├── types/              # TypeScript 类型定义
│   ├── App.vue             # 根组件
│   └── main.ts             # 应用入口
├── src-tauri/              # Tauri 后端
│   ├── src/                # Rust 源码
│   ├── capabilities/       # 权限配置
│   └── icons/              # 应用图标
├── public/                 # 静态资源
└── package.json            # Node.js 依赖
```

## 使用说明

1. **对话功能**：点击左侧"新建对话"按钮创建新对话，在中间输入框发送消息
2. **模型切换**：顶部选择器可切换不同的 AI 模型
3. **文件操作**：右侧文件浏览器可选择目录，点击文件可打开编辑器
4. **编辑文件**：文件编辑器支持编辑和保存文件内容

## 许可证

[MIT License](LICENSE)

## 联系方式

- 项目主页：[项目 URL]
- 问题反馈：[Issues URL]

## 致谢

- [Tauri](https://tauri.app/) - 桌面应用框架
- [Vue.js](https://vuejs.org/) - 前端框架
- [iFlow CLI](https://platform.iflow.cn/) - AI 命令行工具

## 开发文档

详细的开发和维护文档请查看 [DEVELOPMENT.md](DEVELOPMENT.md)