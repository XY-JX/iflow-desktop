# iFlow CLI 源码集成说明

## 集成方式

本项目通过 Rust 后端直接调用 iFlow CLI 实现智能对话功能。

## 核心文件

### 后端集成

**文件**：`src-tauri/src/lib.rs`

**主要功能**：
- 与 iFlow CLI 通信
- 解析执行信息
- 处理思考过程
- 状态管理

**关键函数**：

1. **send_message_to_iflow()**
   - 发送消息到 iFlow CLI
   - 使用 `--thinking` 参数启用思考模式
   - 使用 `--stream` 参数启用流式传输
   - 使用 `CREATE_NO_WINDOW` 隐藏命令行窗口

2. **check_iflow_installed()**
   - 检查 iFlow CLI 是否已安装
   - 执行 `iflow.cmd --version` 验证

3. **check_iflow_running()**
   - 检查 iFlow CLI 是否在运行
   - 使用进程列表检查

4. **start_iflow()**
   - 检查 iFlow CLI 可用性
   - 不启动交互式窗口

5. **stop_iflow()**
   - 停止 iFlow CLI 进程
   - 使用系统命令终止进程

### 前端集成

**文件**：`src/components/MainLayout.vue`

**主要功能**：
- 管理对话历史
- 调用 iFlow CLI 获取回复
- 更新思考过程显示
- 状态管理

**关键函数**：

1. **handleSendMessage()**
   - 发送用户消息
   - 调用后端获取回复
   - 更新 UI 状态

2. **checkIflowStatus()**
   - 检查 iFlow 服务状态
   - 更新状态指示器

3. **toggleIflow()**
   - 切换 iFlow 服务状态
   - 启动/停止服务

## 数据流

### 消息发送流程

```
用户输入
  ↓
handleSendMessage()
  ↓
invoke('send_message_to_iflow')
  ↓
send_message_to_iflow() [Rust]
  ↓
Command::new("iflow.cmd")
  ↓
执行 iFlow CLI
  ↓
解析响应
  ↓
更新 latestThinking
  ↓
更新对话历史
```

### 思考过程展示

**位置**：右侧边栏下部分

**更新逻辑**：
```typescript
// 发送消息时
latestThinking.value = '正在思考...';

// 接收响应时
latestThinking.value = response.content;
```

**UI 组件**：
```vue
<div class="sidebar-right-bottom">
  <div class="thinking-display">
    <div v-if="latestThinking" class="thinking-content">
      {{ latestThinking }}
    </div>
  </div>
</div>
```

## 类型定义

### Message 类型

**文件**：`src/types/index.ts`

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: string;           // 思考过程
  executionInfo?: ExecutionInfo; // 执行信息
}
```

### ExecutionInfo 类型

```typescript
interface ExecutionInfo {
  session_id: string;
  conversation_id: string;
  assistant_rounds: number;
  execution_time_ms: number;
  token_usage: {
    input: number;
    output: number;
    total: number;
  };
}
```

## 命令参数

### iFlow CLI 参数

**基础参数**：
- `-p "消息"`: 非交互模式，处理指定消息
- `--stream`: 启用流式传输
- `--thinking`: 启用思考模式

**Windows 命令**：
```bash
iflow.cmd -p "消息" --stream --thinking
```

**macOS/Linux 命令**：
```bash
iflow -p "消息" --stream --thinking
```

### 进程参数

**Windows 窗口隐藏**：
```rust
const CREATE_NO_WINDOW: u32 = 0x08000000;
cmd.creation_flags(CREATE_NO_WINDOW);
```

**其他平台**：
- macOS: 不需要特殊处理
- Linux: 不需要特殊处理

## 错误处理

### 常见错误

1. **iFlow CLI 不可用**
   - 错误：`iFlow CLI 未安装`
   - 解决：安装 iFlow CLI

2. **命令执行失败**
   - 错误：`执行失败: ...`
   - 解决：检查 iFlow CLI 配置

3. **解析失败**
   - 错误：`解析执行信息失败`
   - 解决：检查 iFlow CLI 输出格式

### 错误处理逻辑

```rust
match cmd.output() {
    Ok(output) => {
        if output.status.success() {
            // 处理成功响应
            Ok(response)
        } else {
            // 处理错误响应
            Ok(error_response)
        }
    },
    Err(e) => {
        // 处理执行错误
        Err(format!("执行失败: {}", e))
    }
}
```

## 日志记录

### 关键日志点

1. **消息发送**
   ```rust
   info!("向 iFlow CLI 发送消息: {}", message);
   ```

2. **响应接收**
   ```rust
   info!("iFlow CLI 响应成功，输出长度: {}", stdout.len());
   ```

3. **错误记录**
   ```rust
   error!("发送消息到 iFlow CLI 失败: {}", e);
   ```

### 日志位置

```
安装目录/logs/iflow-desktop.log.YYYY-MM-DD
```

## 性能优化

### 1. 进程管理

- 使用 `output()` 而不是 `spawn()`
- 避免创建不必要的进程
- 及时清理进程资源

### 2. 数据处理

- 使用 `serde_json` 高效解析
- 避免不必要的字符串复制
- 使用引用传递大数据

### 3. UI 更新

- 使用 Vue 的响应式系统
- 避免频繁更新导致重渲染
- 使用 `computed` 缓存计算结果

## 扩展点

### 添加新功能

1. **添加新的命令参数**
   ```rust
   cmd.arg("--new-parameter")
   ```

2. **添加新的数据字段**
   ```typescript
   interface Message {
     // 现有字段
     newField?: string; // 新字段
   }
   ```

3. **添加新的 UI 组件**
   ```vue
   <template>
     <NewComponent />
   </template>
   ```

### 自定义配置

**修改默认参数**：
```rust
// 在 lib.rs 中修改
const DEFAULT_MODEL: &str = "glm-4";
const DEFAULT_TIMEOUT: u64 = 300;
```

**修改 UI 默认值**：
```typescript
// 在 MainLayout.vue 中修改
const currentModel = ref('glm-4');
const isGenerating = ref(false);
```

## 测试

### 单元测试

**Rust 测试**：
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_send_message() {
        // 测试逻辑
    }
}
```

**前端测试**：
```typescript
import { describe, it, expect } from 'vitest';

describe('handleSendMessage', () => {
  it('should send message correctly', () => {
    // 测试逻辑
  });
});
```

### 集成测试

**端到端测试**：
1. 启动应用
2. 发送测试消息
3. 验证响应
4. 检查日志

## 调试技巧

### 1. 查看日志

**实时日志**：
```bash
tail -f 安装目录/logs/iflow-desktop.log.$(date +%Y-%m-%d)
```

**VS Code 插件**：
- Rust Analyzer
- Vue - Official
- Tauri

### 2. 断点调试

**Rust 断点**：
```rust
fn send_message() -> Result<String, String> {
    dbg!(message);  // 调试输出
    // ...
}
```

**Vue 断点**：
```typescript
function handleSendMessage(content: string) {
  console.log('Sending:', content);  // 调试输出
  // ...
}
```

### 3. 网络调试

**检查 iFlow CLI 连接**：
```bash
iflow.cmd --version
```

**测试命令参数**：
```bash
iflow.cmd -p "测试" --thinking --stream
```

## 常见问题

### Q: 为什么思考过程显示在右侧？

A: 为了更好地组织界面，右侧边栏分为上下两部分：上部分显示文件浏览器，下部分显示思考过程。

### Q: 如何启用/禁用思考模式？

A: 当前版本默认启用思考模式（`--thinking` 参数），可以在 `send_message_to_iflow()` 函数中修改。

### Q: 如何查看执行信息？

A: 执行信息包含在 `executionInfo` 字段中，可以在消息中显示或单独查看。

### Q: 如何优化响应速度？

A: 使用流式传输（`--stream`）和缓存策略可以显著提升响应速度。

## 未来改进

### 计划功能

1. **流式传输实时更新**
   - 实现 WebSocket 通信
   - 实时显示思考过程
   - 流式显示 AI 回复

2. **多对话并行**
   - 支持多个对话同时进行
   - 独立的思考过程显示
   - 并发状态管理

3. **高级功能**
   - 代码片段管理
   - 项目模板系统
   - 自定义命令

### 性能优化

1. **进程池管理**
   - 复用 iFlow CLI 进程
   - 减少启动开销
   - 提升响应速度

2. **数据缓存**
   - 缓存常见回复
   - 减少重复计算
   - 优化内存使用

## 相关文件

- `src-tauri/src/lib.rs` - 主要集成逻辑
- `src-tauri/src/logging.rs` - 日志系统
- `src/components/MainLayout.vue` - 主布局
- `src/components/ChatInterface.vue` - 聊天界面
- `src/types/index.ts` - 类型定义
- `src/App.vue` - 根组件
- `src-tauri/Cargo.toml` - Rust 依赖
- `package.json` - Node.js 依赖