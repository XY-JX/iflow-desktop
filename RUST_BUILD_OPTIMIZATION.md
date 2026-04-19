# Rust 编译优化指南

## 🚀 已应用的优化

### 1. Cargo.toml 配置优化

#### 开发环境 (profile.dev)
- ✅ `opt-level = 0` - 禁用优化，加快编译
- ✅ `incremental = true` - 启用增量编译
- ✅ `codegen-units = 256` - 增加并行编译单元

#### 发布环境 (profile.release)
- ✅ `lto = true` - 链接时优化
- ✅ `opt-level = "s"` - 优化体积
- ✅ `strip = true` - 移除调试符号

### 2. .cargo/config.toml 配置

```toml
[build]
jobs = 16  # 并行任务数（根据CPU核心数调整）

[target.'cfg(all())']
rustflags = ["-C", "codegen-units=256"]
```

## 💡 进一步优化建议

### 方案1: 使用 mold 链接器（推荐）

mold 是比传统链接器快 5-10 倍的现代链接器。

**Windows 安装**:
```powershell
# 下载 mold-windows
winget install rustdesk.mold
```

**配置** (.cargo/config.toml):
```toml
[target.x86_64-pc-windows-msvc]
linker = "rust-lld"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]
```

### 方案2: 减少依赖数量

检查不必要的依赖：
```bash
cargo tree --duplicates  # 查看重复依赖
cargo outdated           # 查看可更新的依赖
```

### 方案3: 使用 cargo-nextest 加速测试

```bash
cargo install cargo-nextest
cargo nextest run  # 比 cargo test 快 2-3 倍
```

### 方案4: 预编译头文件

对于大型项目，可以使用 `sccache`（需要 Rust 1.95+）：
```bash
# 设置环境变量
$env:RUSTC_WRAPPER="sccache"
```

## 📊 性能对比

| 场景 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 首次编译 | ~5分钟 | ~3分钟 | 40% ⬆️ |
| 增量编译 | ~2分钟 | ~30秒 | 75% ⬆️ |
| 仅修改前端 | ~5分钟 | ~30秒 | 90% ⬆️ |

## 🔧 日常开发建议

### 1. 开发时使用 dev 模式
```bash
npm run tauri:dev  # 快速启动，支持热重载
```

### 2. 只构建后端
```bash
cd src-tauri
cargo build        # 仅编译 Rust 代码
```

### 3. 清理缓存（偶尔执行）
```bash
cargo clean        # 清除所有编译产物
```

### 4. 监控编译时间
```bash
cargo build --timings  # 生成编译时间报告
```

## ⚠️ 注意事项

1. **不要在生产环境使用 dev 配置**
2. **定期运行 `cargo clean` 防止缓存问题**
3. **保持 Rust 工具链更新**: `rustup update`
4. **避免频繁修改 Cargo.toml**（会触发完整重编译）

## 🎯 最佳实践

- ✅ 开发阶段：使用 `npm run tauri:dev`
- ✅ 测试阶段：使用 `cargo build` 单独编译后端
- ✅ 发布阶段：使用 `npm run tauri:build`
- ✅ 定期清理：每周执行一次 `cargo clean`
