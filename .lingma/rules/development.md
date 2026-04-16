---
trigger: model_decision
description: 开发新功能时的完整指南（架构+规范+调试）
---

# 我的一个梦 - 开发指南

> **版本**: 1.9.1  
> **最后更新**: 2026-04-17

## 🏗️ 项目架构

### 消息发送流程
```
用户输入 → ChatInterface.vue → MainLayout.vue → chatStore 
→ Tauri Command (zhipu.rs) → 智谱 AI API → 流式响应 
→ chatStore → ChatInterface.vue
```

### 数据保存时机
```
添加消息 → 立即保存
流式更新 → 不保存 (避免频繁IO)
AI回复完成 → 立即保存
切换模型 → 立即保存
删除对话 → 立即保存
```

### 数据存储规范
- ✅ **所有业务数据通过 Rust 后端存储**
- ✅ **配置文件存放在 `config/` 目录**
- ✅ **用户数据存放在 `data/` 目录**
- ❌ **禁止使用 localStorage 存储业务数据**
- ❌ **禁止在 errorHandler 中使用 localStorage**

### 关键文件映射

| 功能 | 前端 | 后端 | Store |
|------|------|------|-------|
| 智能对话 | `ChatInterface.vue` | `zhipu.rs` | `chatStore.ts` |
| 对话历史 | `ChatHistory.vue` | `conversation.rs` | `chatStore.ts` |
| 文件操作 | `FileExplorer.vue` / `FileEditor.vue` | - | `fileStore.ts` |
| 设置面板 | `SettingsPanel.vue` | `config.rs` | - |

---

## 💻 代码规范

### Rust 规范

```rust
// ✅ Tauri 命令必须添加属性
#[tauri::command]
pub async fn my_command() -> Result<String, String> {
    Ok("success".to_string())
}

// ✅ 使用 tracing 日志
use tracing::{info, warn, error};
info!("操作成功");

// ✅ 错误处理
pub fn do_something() -> Result<(), String> {
    if error {
        Err("错误描述".to_string())
    } else {
        Ok(())
    }
}

// ✅ 函数引用（不要加括号）
generate_handler![my_command]

// ✅ 数据持久化 - 使用安装目录
fn get_data_path(_app: &AppHandle) -> PathBuf {
    let exe_path = std::env::current_exe().unwrap();
    let install_dir = exe_path.parent().unwrap();
    install_dir.join("data").join("data.json")
}
```

### TypeScript/Vue 规范

```typescript
// ✅ 避免 any，定义接口
interface UserData {
  id: string;
  name: string;
}

// ✅ Pinia Store 解构保持响应式
import { storeToRefs } from 'pinia';
const store = useMyStore();
const { state } = storeToRefs(store); // ✅
// const { state } = store; // ❌

// ✅ 组件通信
// 父传子
<ChildComponent :prop="value" />

// 子传父
const emit = defineEmits(['event-name']);
emit('event-name', data);

// ✅ 深色主题使用 CSS 变量
.color-text {
  color: var(--color-text);
}

// ✅ 数据持久化 - 调用 Rust 后端
import { invoke } from '@tauri-apps/api/core';

async function loadData() {
  const data = await invoke<MyData[]>('load_my_data');
  return data;
}

async function saveData(data: MyData[]) {
  await invoke('save_my_data', { data });
}

// ✅ 日志记录 - 使用统一的 logger
import { info, error as logError } from '../utils/logger';

info('Module', '操作成功');
logError('Module', '错误信息:', error);

// ✅ 代码复用 - 优先使用 composables
import { useKeyboardShortcuts } from '../composables';
const { registerShortcut } = useKeyboardShortcuts();
registerShortcut('ctrl+n', () => handleNewChat());

// ✅ 工具函数 - 从 common.ts 导入
import { formatTime, debounce } from '../utils/common';
formatTime(timestamp); // 格式化时间
debounce(fn, 300); // 防抖
```

### 架构规范

#### 1. CSS与JS分离原则

**✅ 推荐做法:**
- 公共样式提取到 `src/styles/components.css`
- 可复用逻辑提取到 `src/composables/`
- 工具函数提取到 `src/utils/`
- 组件特有样式保留在 `<style scoped>`

**❌ 避免做法:**
- 在多个组件中重复定义相同样式
- 在每个组件中重复编写相同逻辑
- 硬编码颜色值（应使用CSS变量）

**公共样式库包含:**
- 按钮样式 (`.btn-primary`, `.btn-secondary`, `.btn-icon`, `.btn-close`)
- 对话框样式 (`.dialog-overlay`, `.dialog-content`, `.dialog-title`, `.dialog-footer`)
- 表单样式 (`.form-group`, `.form-input`, `.form-textarea`)
- 面板样式 (`.panel-header`, `.panel-title`)
- 卡片、标签、列表项、状态指示器等通用组件
- 动画关键帧 (`@keyframes dialog-fade-in`, `@keyframes slideDown`)

#### 2. 代码复用层级

```
优先级从高到低:
1. composables/     - 组件级逻辑复用 (useXxx)
2. utils/           - 纯函数工具 (formatXxx)
3. styles/          - 公共CSS类 (.btn-primary)
4. theme/           - CSS变量系统 (--color-*)
5. <style scoped>   - 组件特有样式
```

---

## 🐛 常见问题

### 消息发送失败？
1. 检查 API Key
2. 查看控制台日志 `[API]`, `[MainLayout]`
3. 确认 `zhipuReady` 状态

### Store 响应式丢失？
```typescript
// ✅ 正确
const { state } = storeToRefs(store);

// ❌ 错误
const { state } = store;
```

### 使用了 console.log？
```typescript
// ✅ 正确 - 使用统一 logger
import { info, error as logError } from '../utils/logger';
info('Module', '信息');
logError('Module', '错误:', error);

// ❌ 错误 - 直接使用 console
console.log('信息'); // ❌
console.error('错误'); // ❌
```

### 数据持久化问题？
```typescript
// ✅ chatStore - 使用 Rust 后端
import { invoke } from '@tauri-apps/api/core';

async function loadFromStorage() {
  const data = await invoke<Conversation[]>('load_conversations');
  conversations.value = data || [];
}

async function saveToStorage() {
  await invoke('save_conversations', { conversations: conversations.value });
}

// ❌ 禁止使用 localStorage
localStorage.setItem('data', JSON.stringify(data)); // ❌
```

### Rust 编译错误？
```rust
// ✅ 确保添加 #[tauri::command]
#[tauri::command]
pub async fn my_command() {}

// ✅ 导入必要宏
use tracing::instrument;
```

### 组件通信问题？
- 配置变更需通过事件通知其他组件刷新
- 跨组件通信使用 Pinia store

---

## 🔧 调试技巧

### 前端
- 开发者工具：`Ctrl + Shift + I`
- 日志前缀：`[MainLayout]`, `[API]`, `[ChatInterface]`

### 后端
- 查看终端 Rust 日志
- 生产环境日志级别：warn

### 常用命令
```bash
npm run tauri dev    # 开发
npm run test         # 测试
npm run tauri build  # 打包
```

---

## ✅ 开发原则

1. **遵循现有代码风格**
2. **保持类型安全**（避免 any）
3. **考虑深色主题兼容性**
4. **分阶段完成复杂任务**
5. **即时反馈进度**
6. **数据持久化规范**
   - 所有业务数据通过 Rust 后端存储
   - 配置文件存放在 `config/` 目录
   - 用户数据存放在 `data/` 目录
   - 禁止使用 localStorage 存储业务数据
7. **日志记录规范**
   - 使用统一的 logger 工具 (`src/utils/logger.ts`)
   - 禁止直接使用 `console.log/console.error`
   - 生产环境自动过滤 DEBUG/INFO 级别日志
8. **代码清理原则**
   - 及时删除注释掉的代码
   - 移除未使用的函数和变量
   - 修复乱码注释
