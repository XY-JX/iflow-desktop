# Rust 后端重构计划

## 问题分析

### 1. 双重日志初始化
- `main.rs` 调用 `logging::init_logging()`
- `lib.rs` 的 `run()` 也调用 `logging::init_logging()`
- 虽然有 `INITIALIZED` 原子变量保护，但逻辑混乱

### 2. 配置路径逻辑重复
- `config.rs` 有三套路径获取逻辑：
  - `get_config_dir()` — 异步，用 `tokio::fs`
  - `get_data_dir()` — 异步，用 `tokio::fs`
  - `get_config_path()` — 同步，用 `std::fs`，还有 `IFLOW_CONFIG_DIR` 环境变量检查
- `get_config_dir` 和 `get_data_dir` 没有 `IFLOW_CONFIG_DIR` 支持

### 3. 全局状态管理方式过时
- `commands/zhipu.rs` 用 `static ZHIPU_CLIENT: Lazy<Arc<Mutex<Option<...>>>>` 全局变量
- Tauri 2.0 推荐使用 `tauri::Manager` 的 `manage()` 和 `state()` API

### 4. 对话数据类型松散
- `commands/conversation.rs` 用 `serde_json::Value` 而非强类型结构体
- 类型安全性差，容易出错

### 5. lib.rs 重复清理逻辑
- `run()` 中调用 `clean_old_logs()`，但 `main.rs` 已在启动时调用

### 6. zhipu_ai.rs SSE 解析复杂
- 流式响应解析逻辑过于复杂，嵌套深，可读性差

## 重构方案

### 1. 统一日志初始化
- 只在 `main.rs` 中初始化日志
- `lib.rs` 的 `run()` 移除 `init_logging()` 和 `clean_old_logs()` 调用

### 2. 统一配置路径
- 合并为统一的路径获取函数
- 所有路径函数都支持 `IFLOW_CONFIG_DIR` 环境变量
- 统一使用异步 `tokio::fs`

### 3. 使用 Tauri 管理状态
- 用 `tauri::Manager::manage()` 注册全局状态
- 用 `tauri::Manager::state()` 在命令中获取状态
- 替换 `static` 全局变量

### 4. 对话数据强类型化
- 定义 `Conversation` 和 `Message` 结构体
- 替换 `serde_json::Value`

### 5. 简化 SSE 解析
- 提取 SSE 行解析为独立函数
- 减少嵌套层级

### 6. 简化 lib.rs
- 移除重复的初始化和清理逻辑

## 文件修改清单

| 文件 | 操作 |
|------|------|
| `src-tauri/src/main.rs` | 保持不变（已经是正确的） |
| `src-tauri/src/lib.rs` | 简化：移除重复初始化，用 Tauri state 管理 |
| `src-tauri/src/config.rs` | 统一路径逻辑，删除 `get_config_path` |
| `src-tauri/src/logging.rs` | 保持不变 |
| `src-tauri/src/zhipu_ai.rs` | 简化 SSE 解析 |
| `src-tauri/src/commands/zhipu.rs` | 用 Tauri state 替换全局变量 |
| `src-tauri/src/commands/conversation.rs` | 强类型化对话数据 |
| `src-tauri/src/commands/totp.rs` | 保持不变 |

## 实施顺序

1. 重构 `config.rs` — 统一路径逻辑
2. 重构 `zhipu_ai.rs` — 简化 SSE 解析
3. 重构 `commands/conversation.rs` — 强类型化
4. 重构 `commands/zhipu.rs` — Tauri state 管理
5. 重构 `lib.rs` — 简化入口，注册 state
6. 验证构建 `cargo build`
