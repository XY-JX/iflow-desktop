 ---
trigger: always_on
---

# 我的一个梦 - AI 助手工作指南

> **重要**: 本文档是 AI 助手的核心工作指南。

## 📖 项目简介

我的一个梦 Desktop 是一个基于 Tauri + Vue 3 + Rust 开发的 AI 编程助手桌面应用，集成智谱 AI API。

**核心价值**: 为开发者提供本地化的 AI 编程助手，支持对话管理、文件操作和代码分析。

## 🚀 AI 助手工作流程

### 基本原则

1. **直接执行** - 收到任务后立即开始执行
2. **分阶段完成** - 复杂任务拆解为多个步骤
3. **即时反馈** - 每完成一步就汇报进度
4. **简洁高效** - 避免过度设计

---

## 📚 核心文档

| 文档 | 路径 |
|------|------|
| **开发指南** | `.lingma/rules/development.md` |
| **README** | `README.md` |

**💡 提示**: AI 会根据任务自动加载开发指南。

## 项目结构

```
我的一个梦/
├── src/                      # Vue 前端源码
│   ├── components/          # Vue 组件
│   │   ├── SplashScreen.vue  # 启动页
│   │   ├── MainLayout.vue    # 主布局
│   │   ├── ChatInterface.vue # 聊天界面
│   │   └── ...              # 其他组件
│   ├── stores/             # Pinia 状态管理
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── theme/              # 主题系统
│   └── main.ts             # 应用入口
├── src-tauri/               # Rust 后端
│   ├── src/
│   │   ├── commands/       # Tauri 命令
│   │   ├── config.rs       # 配置管理
│   │   ├── logging.rs      # 日志系统
│   │   └── lib.rs          # Rust 库入口
│   └── Cargo.toml
├── .env*                    # 环境变量配置
└── .lingma/
    └── rules/
        ├── home.md         # 本文档
        └── development.md  # 开发指南
```

---

## 💾 数据存储规范

**核心原则**: 所有用户数据统一存储在安装目录下,便于便携和管理。

### 目录结构

```
安装目录/
├── config/                    # 配置文件
│   ├── app_config.json       # 应用配置(API Key、角色、模型等)
│   └── totp_secrets.json     # TOTP验证码密钥
├── data/                      # 用户数据
│   └── conversations.json    # 对话历史记录
├── logs/                      # 日志文件(自动清理3天前)
└── 我的一个梦.exe         # 主程序
```

### 实现要点

1. **配置文件** (`config.rs`)
   - 使用 `std::env::current_exe()` 获取安装目录
   - 在 `config/` 子目录存储
   - 包含: API Key、自定义角色、模型缓存、TOTP密钥等

2. **对话记录** (`commands/conversation.rs`)
   - 存储在 `data/` 子目录
   - 通过 Tauri Command: `load_conversations`, `save_conversations`
   - chatStore 调用 Rust 后端,不使用 localStorage
   - 对话包含: messages(消息列表)、model(模型选择)、tags(标签)

3. **TOTP数据** (`commands/totp.rs`)
   - 存储在 `config/` 子目录 (敏感配置)
   - 通过 Tauri Command: `load_totp_secrets`, `save_totp_secrets`
   - JSON格式明文存储(可后续加密)

4. **前端 Store 规范**
   - ✅ chatStore: 调用 Rust 后端保存/加载
   - ✅ 修改后自动调用 `saveToStorage()`
   - ✅ 流式更新时不触发保存,完成后才保存
   - ❌ 禁止使用 localStorage 存储业务数据

5. **组件开发规范**
   - ✅ 避免重复标题 (如 QuickToolsPanel + TOTPPanel)
   - ✅ 父组件包装子组件时,不重复显示子组件已有标题
   - ✅ 使用 CSS 变量支持深色主题
   - ✅ 响应式数据使用 `storeToRefs` 解构

6. **禁止行为**
   - ❌ 不使用 `dirs::data_local_dir()` 等系统目录
   - ❌ 不将数据存入 `logs/` 目录
   - ❌ 不使用 localStorage 存储敏感数据或业务数据
   - ❌ 不直接修改 Pinia store 对象而不保存

---

## 📝 总结

**AI 助手的核心职责:**
1. ✅ 直接执行用户任务
2. ✅ 分阶段完成复杂任务
3. ✅ 遵循项目规范
4. ✅ 测试验证后汇报
5. ✅ 保持代码质量

---

## 🔗 相关链接

- GitHub: https://github.com/XY-JX/iflow-desktop
- Tauri: https://tauri.app/
- Vue 3: https://vuejs.org/
- 智谱 AI: https://open.bigmodel.cn/
