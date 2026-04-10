# 开发指南

本文档提供 iFlow Desktop 项目的详细开发说明。

## 📋 目录

- [环境搭建](#环境搭建)
- [项目架构](#项目架构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [测试指南](#测试指南)
- [部署发布](#部署发布)
- [常见问题](#常见问题)

---

## 环境搭建

### 1. 安装基础工具

#### Node.js (>= 18.0.0)

```bash
# 使用 nvm 管理 Node.js 版本
nvm install 18
nvm use 18

# 验证安装
node --version
npm --version
```

#### Rust (>= 1.70.0)

```bash
# Windows: 下载 rustup-init.exe
# macOS/Linux:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 验证安装
rustc --version
cargo --version
```

#### 系统依赖

**Windows:**
- 安装 Visual Studio Build Tools（包含 MSVC 编译器）
- 或通过 Chocolatey: `choco install visualstudio2022buildtools`

**macOS:**
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

### 2. 克隆项目

```bash
git clone https://github.com/XY-JX/iflow-desktop.git
cd iflow-desktop
```

### 3. 安装依赖

```bash
npm install
```

### 4. 验证环境

```bash
# 启动开发服务器
npm run tauri dev

# 应该看到应用窗口打开
```

---

## 项目架构

### 整体架构

```
┌─────────────────────────────────────┐
│         前端层 (Vue 3)               │
│  ┌──────────┬──────────┬──────────┐ │
│  │ Components│ Stores   │ Utils    │ │
│  └──────────┴──────────┴──────────┘ │
└──────────────┬──────────────────────┘
               │ Tauri API
┌──────────────▼──────────────────────┐
│       后端层 (Rust + Tauri)          │
│  ┌──────────┬──────────┬──────────┐ │
│  │ Commands │ Config   │ Logging  │ │
│  └──────────┴──────────┴──────────┘ │
└──────────────┬──────────────────────┘
               │ System Calls
┌──────────────▼──────────────────────┐
│         操作系统层                   │
│   FileSystem | Network | UI         │
└─────────────────────────────────────┘
```

### 数据流

```
用户操作 → Vue Component → Pinia Store → Tauri Command → Rust Backend
                                                                    ↓
响应返回 ← Vue Update ← State Update ← Result ← Process Data ←
```

### 核心模块说明

#### 1. 状态管理 (Pinia Stores)

**chatStore.ts** - 对话管理
```typescript
interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  latestThinking: string;
}
```

**fileStore.ts** - 文件管理
```typescript
interface FileState {
  selectedFile: FileItem | null;
  recentFiles: FileItem[];
}
```

#### 2. API 调用层

```typescript
// 统一封装 Tauri 命令
import { api } from '@/utils/api';

// 使用示例
const result = await api.initZhipuClient(apiKey);
```

#### 3. 主题系统

```typescript
// 全局设计令牌
import { color, spacing, radius } from '@/theme';

// 在组件中使用
.button {
  background: color.primary.main;
  padding: spacing.md;
  border-radius: radius.md;
}
```

---

## 开发流程

### 功能开发流程

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发功能**
   - 编写组件代码
   - 更新状态管理
   - 添加必要的类型定义

3. **本地测试**
   ```bash
   npm run tauri dev
   npm run test
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

5. **创建 PR**
   - 在 GitHub 上创建 Pull Request
   - 描述功能和修改
   - 等待代码审查

### 调试技巧

#### 前端调试

```typescript
// 添加日志
console.log('[ComponentName]', data);

// 使用 Vue DevTools
// 安装: https://devtools.vuejs.org/
```

#### 后端调试

```rust
// Rust 日志
tracing::info!("Message: {}", value);
tracing::error!("Error: {:?}", error);
```

#### 性能分析

```bash
# 构建时分析包大小
npm run build
npx vite-bundle-visualizer

# 运行时性能
// 浏览器 Performance 面板
```

---

## 代码规范

### TypeScript 规范

#### 1. 类型定义

```typescript
// ✅ 明确定义类型
interface User {
  id: string;
  name: string;
  email?: string; // 可选属性
}

// ❌ 避免使用 any
const user: any = {};
```

#### 2. 函数签名

```typescript
// ✅ 完整的类型注解
async function fetchUser(id: string): Promise<User> {
  // ...
}

// ❌ 缺少返回类型
async function fetchUser(id) {
  // ...
}
```

### Vue 组件规范

#### 1. 组件结构

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 导入
import { ref, computed } from 'vue';

// 类型定义
interface Props {
  title: string;
}

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  update: [value: string];
}>();

// 响应式状态
const count = ref(0);

// 计算属性
const doubleCount = computed(() => count.value * 2);

// 方法
function increment() {
  count.value++;
}
</script>

<style scoped>
/* 样式 */
</style>
```

#### 2. 命名规范

- 组件名：PascalCase (`ChatInterface.vue`)
- 文件名：PascalCase (`SettingsPanel.vue`)
- 变量/函数：camelCase (`sendMessage`)
- 常量：UPPER_SNAKE_CASE (`MAX_TOKENS`)
- 类型/接口：PascalCase (`UserInfo`)

### Rust 规范

#### 1. 命令定义

```rust
// ✅ 正确的命令定义
#[tauri::command]
async fn my_command(param: String) -> Result<String, String> {
    tracing::info!("Command called with: {}", param);
    
    // 业务逻辑
    let result = process_data(&param).await?;
    
    Ok(result)
}

// ❌ 错误示例
fn my_command(param) { // 缺少类型和属性
    // ...
}
```

#### 2. 错误处理

```rust
// ✅ 使用 Result
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}

// ❌ 使用 unwrap
fn divide(a: f64, b: f64) -> f64 {
    a / b // 可能 panic
}
```

---

## 测试指南

### 单元测试

```typescript
// src/__tests__/chatStore.test.ts
import { describe, it, expect } from 'vitest';
import { useChatStore } from '../stores/chatStore';

describe('Chat Store', () => {
  it('should create new conversation', () => {
    const store = useChatStore();
    store.createNewConversation();
    expect(store.conversations.length).toBe(1);
  });
});
```

运行测试：
```bash
npm run test
npm run test:watch  # 监听模式
```

### 集成测试

测试组件交互：
```typescript
import { mount } from '@vue/test-utils';
import ChatInterface from '../components/ChatInterface.vue';

describe('ChatInterface', () => {
  it('renders messages', () => {
    const wrapper = mount(ChatInterface, {
      props: {
        messages: [{ id: '1', content: 'Hello' }]
      }
    });
    expect(wrapper.text()).toContain('Hello');
  });
});
```

---

## 部署发布

### 本地构建

```bash
# 构建生产版本
npm run tauri build

# 产物位置
# Windows: src-tauri/target/release/bundle/msi/*.msi
# macOS: src-tauri/target/release/bundle/dmg/*.dmg
```

### GitHub Actions 自动发布

1. 推送标签触发构建：
   ```bash
   git tag -a v1.8.1 -m "Release v1.8.1"
   git push origin v1.8.1
   ```

2. GitHub Actions 自动：
   - 构建 Windows/macOS/Linux 版本
   - 上传到 GitHub Releases
   - 生成发布说明

### 版本号管理

遵循语义化版本 (SemVer)：
- **主版本** (MAJOR): 不兼容的 API 变更
- **次版本** (MINOR): 向后兼容的功能新增
- **修订号** (PATCH): 向后兼容的问题修正

示例：`v1.8.1` → `v1.9.0` → `v2.0.0`

---

## 常见问题

### Q1: Rust 编译失败

**问题**: `link.exe not found`

**解决**:
```bash
# Windows: 安装 Visual Studio Build Tools
choco install visualstudio2022buildtools

# 或手动下载安装
# https://visualstudio.microsoft.com/zh-hans/downloads/
```

### Q2: 端口被占用

**问题**: `Port 1420 is already in use`

**解决**:
```bash
# 查找并停止占用端口的进程
netstat -ano | findstr :1420
taskkill /F /PID <PID>
```

### Q3: 依赖安装失败

**问题**: npm install 失败

**解决**:
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### Q4: 热更新不生效

**问题**: 修改代码后界面未更新

**解决**:
```bash
# 手动刷新
Ctrl + R (Windows/Linux)
Cmd + R (macOS)

# 或重启开发服务器
Ctrl + C
npm run tauri dev
```

### Q5: TypeScript 类型错误

**问题**: 类型检查报错

**解决**:
```bash
# 重新生成类型声明
npm run type-check

# 或查看具体错误
npx tsc --noEmit
```

---

## 性能优化建议

### 前端优化

1. **组件懒加载**
   ```typescript
   const HeavyComponent = defineAsyncComponent(
     () => import('./HeavyComponent.vue')
   );
   ```

2. **列表虚拟化**
   - 大量消息时使用虚拟滚动
   - 减少 DOM 节点数量

3. **防抖节流**
   ```typescript
   import { debounce } from 'lodash-es';
   
   const handleInput = debounce((value) => {
     // 处理输入
   }, 300);
   ```

### 后端优化

1. **异步处理**
   ```rust
   #[tauri::command]
   async fn heavy_task() -> Result<String, String> {
       tokio::spawn(async {
           // 耗时操作
       }).await.unwrap()
   }
   ```

2. **缓存机制**
   - 缓存频繁读取的配置
   - 使用 lazy_static 初始化全局状态

---

## 贡献指南

### 提交规范

遵循 Conventional Commits 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Type 类型:**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具链

**示例:**
```bash
git commit -m "feat(chat): add message search feature"
git commit -m "fix(api): handle timeout error correctly"
git commit -m "docs(readme): update installation guide"
```

### Code Review 清单

- [ ] 代码符合规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 没有遗留的 console.log
- [ ] 类型定义完整
- [ ] 错误处理完善

---

## 资源链接

- [Tauri 官方文档](https://tauri.app/)
- [Vue 3 文档](https://vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Rust 文档](https://doc.rust-lang.org/)
- [TypeScript 文档](https://www.typescriptlang.org/)

---

<div align="center">

**Happy Coding! 🎉**

</div>
