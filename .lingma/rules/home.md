---
trigger: always_on
---

# iFlow Desktop - AI 助手工作指南

> **重要**: 本文档是 AI 助手的核心工作指南。

## 📖 项目简介

iFlow Desktop 是一个基于 Tauri + Vue 3 + Rust 开发的 AI 编程助手桌面应用，集成智谱 AI API。

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
iflow-desktop/
├── src/                      # Vue 前端源码
│   ├── components/          # Vue 组件
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
└── .lingma/
    └── rules/
        ├── home.md         # 本文档
        └── development.md  # 开发指南
```

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
