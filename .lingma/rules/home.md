 ---
trigger: always_on
---

# 我的一个梦 - AI 助手工作指南

> **重要**: 本文档是 AI 助手的快速参考指南。

## 📖 项目简介

基于 Tauri + Vue 3 + Rust + Naive UI 的 AI 编程助手桌面应用。

**核心价值**: 本地化 AI 助手，支持对话管理、文件操作和代码分析。

## 🚀 AI 助手工作流程

1. **直接执行** - 收到任务后立即开始
2. **分阶段完成** - 复杂任务拆解为步骤
3. **即时反馈** - 每步完成后汇报进度
4. **简洁高效** - 避免过度设计

---

## 📚 文档分工

| 文档 | 用途 | 触发场景 |
|------|------|----------|
| **home.md** | AI 助手快速参考 | 始终加载（always_on） |
| **guidelines.md** | 详细开发规范 | 开发新功能时加载（model_decision） |

**💡 提示**: 
- home.md: 项目简介、核心原则、数据存储规范
- guidelines.md: 架构设计、代码规范、质量标准、协作流程

---

## 💾 数据存储规范

**核心原则**: 所有数据存储在安装目录下。

```
安装目录/
├── config/          # 配置文件 (API Key、角色、TOTP)
├── data/            # 用户数据 (对话记录)
└── logs/            # 日志文件 (自动清理3天前)
```

**关键规则**:
- ✅ 通过 Rust 后端存储 (`load_conversations`, `save_conversations`)
- ✅ 流式更新不保存，完成后才保存
- ❌ 禁止使用 localStorage 存储业务数据
- ❌ 不使用系统目录 (`dirs::data_local_dir()`)

---

## 🎯 开发要点

### 分层架构

```
Components → Composables → Stores → API Layer → Rust Backend
```

**禁止跨层调用**:
- ❌ Components 直接调用 Rust Command
- ❌ Components 直接操作 localStorage
- ❌ Stores 包含复杂业务逻辑

### 组件开发

- ✅ **必须使用 Naive UI 组件**（禁止原生 HTML 元素）
  - 按钮: `<n-button>` 替代 `<button>`
  - 输入框: `<n-input>` 替代 `<input/textarea>`
  - 卡片: `<n-card>` 替代自定义 div
  - 对话框: `<n-modal preset="card">` 标准模式
  - 空状态: `<n-empty>` 替代自定义提示
- ✅ 使用消息提示系统 (`showSuccess`/`showError`/`showWarning`)
- ✅ 响应式数据使用 `storeToRefs` 解构
- ❌ 不在组件中编写复杂业务逻辑
- ❌ 不使用 `alert`/`confirm`
- ❌ 不定义重复的公共样式（使用 `components.css`）

### 代码规范

- ✅ 使用统一 logger (`src/utils/logger.ts`)
- ✅ 使用 API 封装层 (`src/utils/api/`)
- ✅ 类型安全，避免 `any`
- ❌ 直接使用 `console.log`
- ❌ 硬编码颜色值

---

## 📝 AI 助手职责

1. ✅ 直接执行用户任务
2. ✅ 分阶段完成复杂任务
3. ✅ 遵循项目规范
4. ✅ 测试验证后汇报
