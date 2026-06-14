# 重写计划：全面使用 Naive UI 默认风格

## 目标

完全重写 `src/` 前端代码，保留 Rust 后端不变。最大化使用 Naive UI 组件，最小化自定义 CSS。

## 核心原则

- **Naive UI 默认主题**：删除 `theme/` 目录，不使用 `NConfigProvider` 的 theme-overrides
- **零自定义 CSS**：布局全部用 `NLayout`/`NSpace`/`NGrid`，不用 flex/position 手写
- **组件优先**：能用 Naive UI 组件实现的绝不手写 HTML+CSS
- **简化架构**：composables 精简，stores 保持不变，删除 styles/ 和 theme/

## 删除的文件

- `src/theme/` (整个目录) — 不再需要自定义主题
- `src/styles/components.css` — 不再需要公共样式库
- `src/components/SplashScreen.vue` — 用 Naive UI NSpin 替代
- `src/components/AppContent.vue` — 合并到 App.vue
- `src/composables/useDialog.ts` — 未使用
- `src/composables/useMarkdown.ts` — 简化到 MessageList 内部

## 保留不动的文件

- `src-tauri/` (整个 Rust 后端)
- `src/stores/chatStore.ts`
- `src/stores/fileStore.ts`
- `src/stores/quickToolsStore.ts`
- `src/utils/api/` (整个目录)
- `src/utils/common.ts`
- `src/utils/configUtils.ts`
- `src/utils/errorHandler.ts`
- `src/utils/logger.ts`
- `src/utils/tokenUtils.ts`
- `src/utils/totp.ts`
- `src/types/index.ts`
- `src/constants/index.ts`

## 重写的文件

### 1. `src/App.vue`

简化为：
```vue
<script setup lang="ts">
import { NMessageProvider, NDialogProvider, NNotificationProvider } from 'naive-ui';
import MainLayout from './components/MainLayout.vue';
import { onMounted } from 'vue';
import { initTheme } from './theme'; // 删除，改为不需要
import { useMessage, useDialog, useNotification } from 'naive-ui';
import { initMessageAPI } from './utils/message';

onMounted(() => {
  // initMessageAPI 在 AppContent 中初始化
});
</script>
```

- 删除 `NConfigProvider`（使用默认主题）
- 删除全局 CSS（只保留 `* { margin:0; padding:0; box-sizing:border-box }` 和 `#app { width:100vw; height:100vh }`）
- 把 AppContent 的初始化逻辑合并进来

### 2. `src/components/MainLayout.vue`

当前问题：有自定义 CSS（`.main-layout`, `.tools-container`, `.thinking-footer`）

重写方案：
- 用 `NLayout has-sider` 保持三栏布局（已用，保持）
- `.tools-container` → 用 `NSpace vertical` 替代
- `.thinking-footer` → 用 `NCard` + inline style 替代
- 删除所有 `<style scoped>` 块

### 3. `src/components/ChatInterface.vue`

当前问题：有自定义 CSS（`.chat-interface`）

重写方案：
- 用 `NSpace vertical` 包裹 MessageList 和 InputArea
- 删除 `<style scoped>` 块

### 4. `src/components/MessageList.vue`

当前问题：大量自定义 CSS（消息气泡、代码块样式、动画）

重写方案：
- 消息气泡：用 `NCard` + `NSpace` 布局（已用，简化 CSS）
- 代码块样式：保留 markdown 渲染的 `:deep()` 样式（这是必要的，Naive UI 没有代码块组件）
- 删除 `.message-row` 动画（用 Naive UI 的 transition）
- `.scroll-to-bottom` → 用 `NFloatButton` 或保留 minimal CSS
- 保留 `:deep(.code-block)` 等 markdown 代码块样式（无法用 Naive UI 替代）

### 5. `src/components/InputArea.vue`

当前问题：自定义 CSS 布局

重写方案：
- `.action-bar` → `NSpace` + `NDivider`
- `.input-row` → `NSpace` + `NInput` + `NButton`
- `.input-footer` → `NSpace`
- 删除所有 `<style scoped>` 块

### 6. `src/components/ChatHistory.vue`

当前问题：少量自定义 CSS

重写方案：
- `.active-item` → 用 NListItem 的 `:class` + Naive UI 的 `--n-color-hover` 变量
- 其他已用 Naive UI 组件，只需删除多余 CSS

### 7. `src/components/TopToolbar.vue`

当前问题：自定义 CSS 布局

重写方案：
- `.toolbar` → `NSpace justify="space-between"`
- `.toolbar-left/center/right` → `NSpace align="center"`
- `.stats-display` → `NSpace`
- 删除所有 `<style scoped>` 块

### 8. `src/components/SettingsPanel.vue`

已大量使用 Naive UI，只需：
- `.role-selected` → 用 NListItem 的 highlight 属性或 inline style
- 删除 `<style scoped>` 块

### 9. `src/components/QuickToolsPanel.vue`

当前问题：自定义 CSS 布局

重写方案：
- `.panel-tabs` → `NTabs` + `NTabPane`（替代手写 tab 切换）
- `.panel-body` → `NScrollbar`
- 删除所有 `<style scoped>` 块

### 10. `src/components/TOTPPanel.vue`

当前问题：自定义 CSS

重写方案：
- `.totp-header` → `NSpace justify="space-between"`
- `.totp-list` → `NScrollbar`
- `.totp-code` → `NText` + inline style
- 删除所有 `<style scoped>` 块

### 11. `src/components/StatsPanel.vue`

已大量使用 Naive UI，只需删除 `<style scoped>` 块

### 12. `src/components/FileEditor.vue`

当前问题：自定义 CSS

重写方案：
- 用 `NCard` 包裹整个编辑器
- `.editor-header` → `NSpace justify="space-between"`
- `.file-info` → `NSpace align="center"`
- 保留 `.code-editor` 的 monospace 字体设置（用 inline style）
- 删除 `<style scoped>` 块

### 13. `src/components/ApiKeyDialog.vue`

已使用 Naive UI，无需修改

### 14. `src/components/InputDialog.vue`

已使用 Naive UI，无需修改

### 15. `src/components/KeyboardHelpDialog.vue`

已使用 Naive UI，无需修改

### 16. `src/composables/index.ts`

- 删除 `useMarkdown` 和 `setupCodeCopyDelegation` 的导出
- 保留 `useKeyboardShortcuts`
- 保留其他 composables

### 17. `src/composables/useMarkdown.ts`

简化为一个纯函数，不需要 composable。内联到 MessageList.vue 中。

### 18. `src/main.ts`

- 删除 `import './styles/components.css'`
- 其他保持不变

## 实施顺序

1. 删除 `src/theme/` 和 `src/styles/`
2. 重写 `src/main.ts`（删除 styles 导入）
3. 重写 `src/App.vue`（合并 AppContent，删除 theme）
4. 重写 `src/components/MainLayout.vue`
5. 重写 `src/components/ChatInterface.vue`
6. 重写 `src/components/MessageList.vue`
7. 重写 `src/components/InputArea.vue`
8. 重写 `src/components/TopToolbar.vue`
9. 重写 `src/components/ChatHistory.vue`
10. 重写 `src/components/SettingsPanel.vue`
11. 重写 `src/components/QuickToolsPanel.vue`（使用 NTabs）
12. 重写 `src/components/TOTPPanel.vue`
13. 重写 `src/components/StatsPanel.vue`
14. 重写 `src/components/FileEditor.vue`
15. 删除 `src/components/SplashScreen.vue` 和 `src/components/AppContent.vue`
16. 清理 composables
17. 验证构建 `npm run build`

## 注意事项

- Rust 后端完全不动
- stores/utils/api/types/constants 完全不动
- MessageList 的 markdown 代码块样式是唯一需要保留自定义 CSS 的地方
- 所有组件使用 `<script setup lang="ts">`
- 删除 `initTheme()` 调用（不再需要主题系统）
