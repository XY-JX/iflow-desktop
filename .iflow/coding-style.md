# 编码规范

## 前端编码规范 (Vue 3 + TypeScript)

### 1. 文件命名

**组件文件**：
- 使用 PascalCase: `ChatInterface.vue`
- 组件名称与文件名一致

**TypeScript 文件**：
- 使用 camelCase: `index.ts`
- 类型定义文件放在 `types/` 目录

**样式文件**：
- 使用 scoped 样式
- 避免全局样式污染

### 2. 组件结构

**模板结构**：
```vue
<template>
  <!-- 根元素 -->
  <div class="component-name">
    <!-- 内容 -->
  </div>
</template>

<script setup lang="ts">
// 导入
import { ref, computed } from 'vue';

// 类型定义
interface Props {
  // 属性定义
}

// Props 和 Emits
const props = defineProps<Props>();
const emit = defineEmits<{
  'event-name': [payload: any];
}>();

// 响应式状态
const state = ref<State>();

// 计算属性
const computedValue = computed(() => {
  return state.value;
});

// 方法
function method() {
  // 实现
}

// 生命周期
onMounted(() => {
  // 初始化
});
</script>

<style scoped>
/* 样式 */
</style>
```

### 3. TypeScript 规范

**类型定义**：
```typescript
// 使用 interface 定义对象类型
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// 使用 type 定义联合类型或映射类型
type MessageRole = 'user' | 'assistant' | 'system';

// 避免使用 any，使用 unknown 或具体类型
function processData(data: unknown): Result {
  // 类型守卫
  if (isValidData(data)) {
    return processValidData(data);
  }
  throw new Error('Invalid data');
}
```

**类型导入**：
```typescript
// 从本地 types 目录导入
import type { Message, Conversation, Model } from '../types';

// 只导入类型，不导入值
import type { Command } from '@tauri-apps/api/core';
```

### 4. 响应式数据

**使用 Composition API**：
```typescript
// 使用 ref 处理基本类型
const count = ref(0);

// 使用 reactive 处理对象
const state = reactive({
  loading: false,
  error: null,
});

// 使用 computed 处理派生状态
const formattedCount = computed(() => {
  return count.value.toLocaleString();
});

// 使用 watch/effect 处理副作用
watch(count, (newVal) => {
  console.log('Count changed:', newVal);
});
```

### 5. 事件处理

**事件命名**：
- 使用 kebab-case: `send-message`, `update-model`
- 使用明确的语义

**事件参数**：
```typescript
// 定义 emit 类型
const emit = defineEmits<{
  'send-message': [content: string];
  'model-change': [modelId: string];
}>();

// 发送事件
emit('send-message', content);
```

### 6. 样式规范

**使用 CSS 变量**：
```css
.component {
  --primary-color: #4a90e2;
  --secondary-color: #6c5ce7;
  --bg-color: #ffffff;
  --text-color: #333333;
}

.element {
  background: var(--bg-color);
  color: var(--text-color);
}
```

**响应式设计**：
```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --text-color: #f0f0f0;
  }
}
```

**作用域样式**：
```vue
<style scoped>
/* 只影响当前组件 */
</style>
```

## Rust 编码规范

### 1. 文件组织

**模块结构**：
```
src/
├── main.rs           // 主入口
├── lib.rs            // 库接口
├── logging.rs        // 日志模块
└── modules/          // 功能模块
```

**模块导入**：
```rust
// 使用 mod 声明模块
pub mod logging;

// 使用 use 导入
use std::process::Command;
use tracing::{info, warn, error};
```

### 2. 命名规范

**类型和 Trait**：PascalCase
```rust
struct ExecutionInfo;
trait MessageHandler;
```

**函数和变量**：snake_case
```rust
fn send_message_to_iflow() {}
let execution_info = ...;
```

**常量**：SCREAMING_SNAKE_CASE
```rust
const CREATE_NO_WINDOW: u32 = 0x08000000;
```

### 3. 错误处理

**使用 Result 类型**：
```rust
fn parse_execution_info(stderr: &str) -> Option<ExecutionInfo> {
    // 处理逻辑
    Ok(info)
}

async fn send_message(message: String) -> Result<serde_json::Value, String> {
    // 处理逻辑
    Ok(response)
}
```

**错误传播**：
```rust
// 使用 ? 运算符
let config_dir = get_config_dir()?;
let content = fs::read_to_string(path)?;

// 使用 map_err 转换错误
let result = risky_operation().map_err(|e| format!("操作失败: {}", e))?;
```

### 4. 异步处理

**使用 async/await**：
```rust
#[tauri::command]
async fn send_message(message: String) -> Result<String, String> {
    let output = Command::new("iflow")
        .arg("-p")
        .arg(&message)
        .output()
        .await;
    
    // 处理输出
}
```

### 5. 日志记录

**使用 tracing 宏**：
```rust
use tracing::{info, warn, error, debug};

#[tauri::command]
#[instrument(skip(message))]
async fn send_message(message: String) -> Result<String, String> {
    info!("发送消息: {}", message);
    
    match result {
        Ok(_) => info!("操作成功"),
        Err(e) => error!("操作失败: {}", e),
    }
}
```

**日志级别**：
- `info`: 重要信息
- `warn`: 警告信息
- `error`: 错误信息
- `debug`: 调试信息

### 6. 序列化

**使用 serde**：
```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
struct ExecutionInfo {
    #[serde(rename = "assistantRounds")]
    assistant_rounds: u64,
    
    #[serde(rename = "executionTimeMs")]
    execution_time_ms: u64,
}
```

**JSON 处理**：
```rust
use serde_json::json;

let data = json!({
    "content": content,
    "execution_info": info
});

let parsed: Data = serde_json::from_str(json_str)?;
```

## 通用规范

### 1. 注释规范

**函数注释**：
```rust
/// 发送消息到 iFlow CLI
///
/// # 参数
/// - `message`: 要发送的消息内容
///
/// # 返回
/// 返回包含响应内容和执行信息的 JSON 对象
///
/// # 错误
/// 如果 iFlow CLI 不可用或执行失败，返回错误信息
#[tauri::command]
async fn send_message(message: String) -> Result<serde_json::Value, String> {
    // 实现
}
```

**代码注释**：
```typescript
// 检查 iFlow CLI 是否可用
const isAvailable = await checkIflowStatus();

// 更新思考过程显示
latestThinking.value = response.content;
```

### 2. 代码格式化

**前端格式化**：
- 使用 ESLint + Prettier
- 2 空格缩进
- 单引号字符串
- 尾随逗号

**Rust 格式化**：
- 使用 `cargo fmt`
- 4 空格缩进
- 自动格式化

### 3. Git 提交规范

**提交信息格式**：
```
type(scope): subject

body

footer
```

**类型 (type)**：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具

**示例**：
```
feat(chat): 添加思考过程实时显示功能

主要改进：
- 实现思考过程流式传输
- 优化右侧边栏布局
- 添加执行信息展示

技术细节：
- 使用 WebSocket 实现实时通信
- 添加防抖处理
```

### 4. 性能优化

**前端优化**：
```typescript
// 使用 computed 缓存计算结果
const filteredList = computed(() => {
  return list.value.filter(item => item.active);
});

// 使用 v-for 的 key
<div v-for="item in list" :key="item.id">
```

**Rust 优化**：
```rust
// 避免不必要的克隆
let s = String::from(str);  // 好
let s = str.to_string();     // 好

// 使用引用
fn process(data: &str) -> String {
    data.to_uppercase()
}
```

### 5. 安全规范

**输入验证**：
```typescript
function validateInput(input: string): boolean {
  return input.length > 0 && input.length <= 1000;
}
```

**错误处理**：
```rust
// 不使用 unwrap，使用错误处理
let result = risky_operation()?;
// 或者
match risky_operation() {
    Ok(result) => process(result),
    Err(e) => return Err(format!("操作失败: {}", e)),
}
```

**敏感信息**：
- 不在日志中记录敏感信息
- 不在错误消息中暴露系统信息
- 使用环境变量管理配置

## 测试规范

### 前端测试

**组件测试**：
```typescript
import { describe, it, expect } from 'vitest';

describe('ChatInterface', () => {
  it('should render correctly', () => {
    // 测试逻辑
  });
});
```

### Rust 测试

**单元测试**：
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_execution_info() {
        // 测试逻辑
    }
}
```

## 文档规范

### README 文件

**项目 README 应包含**：
- 项目简介
- 功能特性
- 快速开始
- 安装说明
- 使用示例
- 贡献指南

### 代码注释

**原则**：
- 解释"为什么"而不是"是什么"
- 注释复杂的算法和逻辑
- 更新过时的注释

### API 文档

**Tauri 命令文档**：
```rust
/// 检查 iFlow CLI 是否已安装
///
/// # 返回
/// - `true`: iFlow CLI 已安装
/// - `false`: iFlow CLI 未安装或不可用
#[tauri::command]
async fn check_iflow_installed() -> Result<bool, String> {
    // 实现
}
```

## 最佳实践

### 1. 前端最佳实践

- 使用 Composition API
- 避免过度嵌套组件
- 合理使用计算属性
- 及时清理副作用
- 优化大列表渲染

### 2. Rust 最佳实践

- 使用 Result 而不是 panic
- 借用而不是所有权转移
- 使用迭代器而不是循环
- 合理使用生命周期
- 避免不必要的克隆

### 3. 跨语言交互

- 使用明确的类型定义
- 处理序列化错误
- 添加错误边界
- 记录跨语言调用日志
- 测试跨语言功能

## 工具配置

### VS Code 设置

**推荐扩展**：
- Vue - Official
- ESLint
- Prettier
- rust-analyzer

**推荐设置**：
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  }
}
```

### 代码检查

**前端**：
```bash
npm run lint
npm run type-check
```

**Rust**：
```bash
cargo clippy
cargo fmt --check
```

## 参考资料

- [Vue 3 风格指南](https://vuejs.org/style-guide/)
- [Rust API 指南](https://rust-lang.github.io/api-guidelines/)
- [TypeScript 编码规范](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Tauri 最佳实践](https://tauri.app/v1/guides/best-practices/)