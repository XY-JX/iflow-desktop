# 交互体验优化设计方案

## 背景

当前 iflow-desktop 项目存在多个交互体验问题：原生弹窗、MainLayout 过大、流式滚动不佳、事件管理混乱。本次优化旨在系统性解决这些问题。

## 设计方案

### 1. 弹窗系统改造

- 将所有 `prompt()` 替换为 Naive UI `NModal` + `NInput` 表单
- 将 `alert()` 替换为 Naive UI `NModal` 展示
- 将 `window.confirm()` 统一使用已有的 `showConfirm`/`showDeleteConfirm`
- 在 MainLayout 中创建统一的对话框组件管理添加代码片段、链接、笔记的输入

### 2. MainLayout 拆分

将 MainLayout.vue (1300+行) 中的逻辑提取为 composables:

- `useApiKey.ts` — API Key 加载、保存、初始化、清除
- `useChatHandler.ts` — 消息发送、流式响应监听、事件清理
- `useQuickTools.ts` — 代码片段/链接/笔记的增删改及存储
- `useExport.ts` — Markdown 导出、PDF 导出逻辑

拆分后 MainLayout 只负责布局组合和组件调度。

### 3. 流式响应与滚动优化

- MessageList 中当 `isGenerating=true` 时使用 `requestAnimationFrame` 持续滚动
- 添加「滚动到底部」浮动按钮（用户手动滚动后显示）
- 流式输出期间在输入区域显示 token 实时计数

### 4. 快捷键与事件处理统一

- 创建 `useShortcuts.ts` 集中管理所有快捷键注册
- 将流式响应逻辑提取为 `useStreamingChat` composable
- 统一事件监听的注册和清理，避免内存泄漏

## 文件变更清单

### 新增文件
- `src/composables/useApiKey.ts`
- `src/composables/useChatHandler.ts`
- `src/composables/useQuickTools.ts`
- `src/composables/useExport.ts`
- `src/composables/useStreamingChat.ts`
- `src/composables/useShortcuts.ts`

### 修改文件
- `src/components/MainLayout.vue` — 拆分逻辑，替换原生弹窗
- `src/components/InputArea.vue` — 添加生成中状态提示
- `src/components/MessageList.vue` — 优化滚动逻辑
- `src/composables/index.ts` — 导出新增的 composables

## 验收标准

1. 项目中不再有任何 `prompt()`、`alert()`、`window.confirm()` 调用
2. MainLayout.vue 行数减少到 400 行以下
3. 流式响应时消息列表自动滚动到底部
4. 所有功能正常工作，无回归问题
