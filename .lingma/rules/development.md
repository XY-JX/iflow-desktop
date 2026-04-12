---
trigger: model_decision
description: 开发新功能时的完整指南（架构+规范+调试）
---

# 开发指南

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
