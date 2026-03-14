# 部署说明

## 概述

iFlow Desktop 支持多种部署方式，包括本地开发、本地打包和远程自动构建。

## 环境要求

### 开发环境

**必需工具**：
- Node.js 20+
- Rust 1.70+
- Git
- iFlow CLI (`npm install -g @iflow-ai/iflow-cli@latest`)

**推荐工具**：
- VS Code
- 代码格式化工具 (Prettier, cargo fmt)
- Git 客户端

### 构建环境

**Windows**：
- Visual Studio Build Tools 2017 或更高版本
- C++ 桌面开发工具

**macOS**：
- Xcode 命令行工具
- `xcode-select --install`

**Linux**：
- GCC/Clang
- 系统开发包

## 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/XY-JX/iflow-desktop.git
cd iflow-desktop
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式

**启动开发服务器**：
```bash
npm run dev
```

**启动完整桌面应用**：
```bash
npm run tauri dev
```

### 4. 开发注意事项

- 热重载已启用，修改代码会自动刷新
- 日志文件位置：`安装目录/logs/`
- 配置文件位置：`安装目录/config/`
- 使用 `npm run type-check` 检查类型错误

## 本地打包

### 1. 构建应用

```bash
npm run tauri build
```

### 2. 构建产物

**Windows**：
- MSI 安装包：`src-tauri/target/release/bundle/msi/`
- NSIS 安装包：`src-tauri/target/release/bundle/nsis/`

**macOS**：
- DMG 镜像：`src-tauri/target/release/bundle/dmg/`
- APP 应用：`src-tauri/target/release/bundle/macos/`

### 3. 构建时间

- **首次构建**：10-30 分钟（需要编译所有 Rust 依赖）
- **后续构建**：3-5 分钟（增量编译）
- **缓存清理**：清理后恢复首次构建时间

### 4. 构建优化

**使用缓存加速**：
```bash
# Windows
set CARGO_NET_RETRY=10
set CARGO_INCREMENTAL=0
npm run tauri build
```

**清理构建缓存**：
```bash
cargo clean
npm run tauri build
```

## 远程自动构建

### 1. GitHub Actions 配置

**触发条件**：
- 推送标签：`git tag v1.7.1 && git push origin v1.7.1`
- 手动触发：在 GitHub Actions 页面点击 "Run workflow"

**构建平台**：
- Windows (windows-latest)
- macOS (macos-latest)

### 2. 缓存策略

**缓存内容**：
- Rust 依赖：`~/.cargo/registry`, `~/.cargo/git`
- Rust 构建产物：`src-tauri/target/debug`, `src-tauri/target/release`
- Node modules：`node_modules`, `~/.npm`

**缓存策略**：
- 首次构建：无缓存，完整下载和编译
- 后续构建：命中缓存，仅更新变更部分
- 缓存失效：依赖文件变更时自动重建

**预期效果**：
- 首次构建：10-15 分钟
- 缓存命中：3-5 分钟
- 依赖变更：5-8 分钟

### 3. 构建产物

**自动上传**：
- Windows: `windows-bundle` (MSI + EXE)
- macOS: `macos-bundle` (DMG + APP)

**下载位置**：
- GitHub Actions 页面 → Artifacts
- 或使用 GitHub Actions API 下载

### 4. 监控构建

**查看构建状态**：
```bash
gh run list --repo XY-JX/iflow-desktop
```

**查看构建日志**：
```bash
gh run view <run-id> --repo XY-JX/iflow-desktop
```

**下载构建产物**：
```bash
gh run download <run-id> --repo XY-JX/iflow-desktop
```

## 部署流程

### 标准发布流程

**1. 开发和测试**
```bash
# 本地开发
npm run tauri dev

# 类型检查
npm run type-check
```

**2. 代码提交**
```bash
git add .
git commit -m "feat: 新功能描述"
git push origin master
```

**3. 创建标签**
```bash
git tag v1.7.1
git push origin v1.7.1
```

**4. 自动构建**
- GitHub Actions 自动触发
- 等待构建完成（3-15 分钟）
- 下载构建产物

**5. 测试安装包**
- 在干净环境中测试安装
- 验证核心功能
- 检查兼容性

**6. 发布**
- 更新 GitHub Release
- 上传安装包
- 发布更新日志

### 持续集成

**自动构建策略**：
- 每次标签推送自动构建
- 多平台并行构建
- 缓存优化加速
- 自动上传产物

**分支策略**：
- `master`: 主分支，用于生产环境
- `develop`: 开发分支，用于新功能
- `feature/*`: 功能分支

## 安装包分发

### Windows 安装

**MSI 安装包**：
1. 下载 `iFlow-Desktop-x.x.x-x64.msi`
2. 双击运行安装程序
3. 按照提示完成安装
4. 从开始菜单启动应用

**NSIS 安装包**：
1. 下载 `iFlow-Desktop_x.x.x_x64-setup.exe`
2. 双击运行安装程序
3. 自定义安装路径和选项
4. 完成安装并启动

**静默安装**：
```bash
msiexec /i iFlow-Desktop-x.x.x-x64.msi /quiet
```

### macOS 安装

**DMG 镜像**：
1. 下载 `iFlow-Desktop-x.x.x-aarch64.dmg`
2. 打开 DMG 文件
3. 将应用拖拽到 Applications 文件夹
4. 从启动台启动应用

**APP 应用**：
1. 下载 `iFlow-Desktop.app`
2. 移动到 Applications 文件夹
3. 设置权限：`chmod +x iFlow-Desktop.app`
4. 启动应用

## 配置管理

### 默认配置

**应用配置**：
```json
{
  "theme": "auto",
  "model": "glm-4",
  "window": {
    "width": 1400,
    "height": 900
  }
}
```

**文件位置**：
```
安装目录/config/app.config.json
```

### 日志配置

**日志位置**：
```
安装目录/logs/iflow-desktop.log.YYYY-MM-DD
```

**日志清理**：
- 自动保留最近 7 天
- 超过 7 天的日志自动删除
- 手动清理：`rm -rf 安装目录/logs/*`

### 用户数据

**对话历史**：
```
安装目录/config/conversations.json
```

**文件编辑历史**：
```
安装目录/config/edit-history.json
```

## 更新策略

### 自动更新

**当前状态**：
- 未配置自动更新功能
- 需要手动下载新版本

**实现方案**：
1. 使用 Tauri Updater 插件
2. 配置更新服务器
3. 检测更新提示用户

### 手动更新

**更新流程**：
1. 访问 GitHub Releases
2. 下载最新版本
3. 卸载旧版本
4. 安装新版本
5. 迁移配置和数据

### 数据迁移

**兼容性**：
- 对话历史向后兼容
- 配置文件自动迁移
- 日志文件保留历史

## 故障排除

### 构建失败

**Windows 构建失败**：
```bash
# 检查 Rust 安装
rustc --version

# 检查 MSVC 工具
cl --version

# 重新安装依赖
cargo clean
npm install
npm run tauri build
```

**macOS 构建失败**：
```bash
# 检查 Xcode 工具
xcode-select --install

# 更新 Rust
rustup update

# 清理缓存
cargo clean
npm run tauri build
```

### 运行时问题

**iFlow CLI 不可用**：
```bash
# 重新安装 iFlow CLI
npm uninstall -g @iflow-ai/iflow-cli
npm install -g @iflow-ai/iflow-cli@latest

# 验证安装
iflow.cmd --version
```

**日志文件缺失**：
```bash
# 检查目录权限
ls -la 安装目录/logs

# 创建日志目录
mkdir -p 安装目录/logs
chmod 755 安装目录/logs
```

### 性能问题

**构建慢**：
- 使用 GitHub Actions 远程构建
- 确保 GitHub Actions 缓存生效
- 检查网络连接

**运行慢**：
- 清理对话历史
- 清理旧日志文件
- 关闭不必要的功能

## 监控和维护

### 日志监控

**查看最新日志**：
```bash
tail -f 安装目录/logs/iflow-desktop.log.$(date +%Y-%m-%d)
```

**日志级别调整**：
```rust
// 修改日志级别
EnvFilter::new("debug")  // 更详细的日志
EnvFilter::new("warn")   // 只显示警告和错误
```

### 错误监控

**常见错误**：
1. iFlow CLI 调用失败
2. 文件权限不足
3. 序列化/反序列化错误
4. 内存不足

**错误处理**：
- 详细日志记录
- 友好错误提示
- 自动重试机制
- 恢复策略

### 维护任务

**定期维护**：
- 清理旧日志（每周）
- 更新依赖（每月）
- 性能优化（每季度）
- 安全审计（每半年）

## 安全考虑

### 签名验证

**Windows**：
- 代码签名证书
- 驱动签名
- 安全更新

**macOS**：
- Apple 开发者证书
- 公证（公证）
- Gatekeeper 验证

### 依赖安全

**定期更新依赖**：
```bash
# 更新 npm 依赖
npm audit fix
npm update

# 更新 Rust 依赖
cargo update
```

**安全扫描**：
```bash
# npm 审计
npm audit

# Rust 审计
cargo audit
```

## 备份和恢复

### 配置备份

**备份配置文件**：
```bash
cp -r 安装目录/config 备份目录/
```

**备份对话历史**：
```bash
cp 安装目录/config/conversations.json 备份目录/
```

### 恢复配置

**恢复配置**：
```bash
cp 备份目录/config/* 安装目录/config/
```

**重置配置**：
```bash
rm -rf 安装目录/config/*
# 应用会使用默认配置重新初始化
```

## 参考资源

### 官方文档
- [Tauri 打包指南](https://tauri.app/v1/guides/building/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Rust 发布流程](https://doc.rust-lang.org/book/ch14-00-publishing.html)

### 工具和脚本
- [Tauri Bundler](https://github.com/tauri-apps/tauri)
- [Cargo Release](https://github.com/crate-ci/cargo-release)
- [Semantic Release](https://github.com/semantic-release/semantic-release)

### 社区支持
- [Tauri Discord](https://discord.gg/tauri)
- [GitHub Issues](https://github.com/tauri-apps/tauri/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/tauri)