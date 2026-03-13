# iFlow Desktop - 开发维护文档

本文档面向开发者，包含项目开发、构建、测试、发布等详细信息。

---

# 初学者快速入门指南

> 💡 **初学者提示**：如果你是第一次接触 Tauri，建议先阅读 [TAURI_BASICS.md](TAURI_BASICS.md) 了解基本概念和操作。

如果你是第一次接触 Tauri，本指南将帮你快速上手。

## 什么是 Tauri？

Tauri 是一个用 Rust 开发的桌面应用框架，它让你可以用 Web 技术（HTML、CSS、JavaScript/TypeScript）开发桌面应用。

**简单理解**：
- **前端**：就像写网页一样（Vue 3）
- **后端**：Rust 代码处理系统操作
- **打包**：自动打包成桌面应用（.exe、.dmg 等）

## 第一次运行项目

### 第一步：检查环境

打开命令行，依次输入以下命令检查：

```bash
node --version
```

如果显示版本号（如 `v24.14.0`），说明 Node.js 已安装。

```bash
rustc --version
```

如果显示版本号（如 `rustc 1.94.0`），说明 Rust 已安装。

**如果任何命令报错**，请参考后面的"安装步骤"章节。

### 第二步：安装依赖

进入项目目录：

```bash
cd iflow-desktop
```

安装前端依赖：

```bash
npm install
```

等待安装完成（可能需要几分钟）。

### 第三步：启动应用

**方式一：只看前端界面（快速预览）**

```bash
npm run dev
```

这会打开浏览器显示应用界面，但无法使用文件操作等功能。

**方式二：启动完整桌面应用（推荐）**

```bash
npm run tauri dev
```

这会：
1. 编译 Rust 代码（首次需要 5-15 分钟）
2. 打开桌面应用窗口
3. 可以使用所有功能

### 第四步：开始使用

应用启动后，你可以：

1. **创建对话**：点击左侧"新建对话"
2. **发送消息**：在中间输入框输入消息并发送
3. **浏览文件**：点击右侧"选择目录"按钮
4. **编辑文件**：点击文件可打开编辑器

## 常用命令速查

| 想做什么 | 命令 |
|---------|------|
| 启动应用 | `npm run tauri dev` |
| 只看前端 | `npm run dev` |
| 构建应用 | `npm run tauri build` |
| 检查代码 | `npm run type-check` |
| 安装依赖 | `npm install` |

## 修改代码后

当你修改了代码，应用会自动更新（热更新），无需重启。

如果修改了 Rust 代码，会自动重新编译。

## 遇到问题怎么办？

1. **看错误信息**：命令行会显示错误原因
2. **查文档**：查看本文档的"故障排除"章节
3. **重启应用**：关闭命令行，重新运行 `npm run tauri dev`

## 推荐学习路径

1. 先运行项目，熟悉界面
2. 尝试修改 `src/App.vue` 的文字
3. 看懂前端组件的结构
4. 学习如何添加新功能
5. 了解 Rust 后端命令

---

## 目录

- [环境要求](#环境要求)
- [安装步骤](#安装步骤)
- [开发指南](#开发指南)
- [构建部署](#构建部署)
- [项目结构](#项目结构)
- [核心组件说明](#核心组件说明)
- [Tauri 命令](#tauri-命令)
- [配置说明](#配置说明)
- [故障排除](#故障排除)
- [开发建议](#开发建议)
- [发布流程](#发布流程)
- [贡献指南](#贡献指南)

## 环境要求

- **Node.js**: 22+
- **Rust**: 1.70+
- **npm** 或 **yarn**
- **Windows 10/11**

### 检查版本

```bash
node --version    # 需要 22+
npm --version
rustc --version   # 需要 1.70+
cargo --version
```

## 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd iflow-desktop
```

### 2. 安装 Node.js 依赖

```bash
npm install
```

### 3. 安装 Rust（如果尚未安装）

Windows：
```bash
# 下载并运行 rustup-init.exe
.\rustup-init.exe
```

或者从官网下载：https://www.rust-lang.org/tools/install

安装完成后需要**重启终端**或**重启计算机**。

验证安装：
```bash
rustc --version
cargo --version
```

### 4. 安装 iFlow CLI

```bash
npm install -g @iflow-ai/iflow-cli@latest
```

验证安装：
```bash
iflow --version
```

### 5. 配置 iFlow CLI

首次运行 iFlow 需要登录：

```bash
iflow
```

选择 "Login with iFlow" 方式登录（推荐），完成浏览器授权。

## 开发指南

### 启动前端开发服务器

仅启动前端（不含 Rust 后端）：

```bash
npm run dev
```

前端将在 http://localhost:1420 运行。

适用于：
- 快速预览界面
- 调试前端逻辑
- 无需 Tauri 功能时

### 启动完整桌面应用

启动前端服务器并编译 Rust 后端：

```bash
npm run tauri dev
```

这将：
1. 启动 Vite 开发服务器
2. 编译 Rust 代码
3. 打开桌面应用窗口

首次运行需要下载和编译 Rust 依赖，可能需要 5-15 分钟。

### 常用开发命令

```bash
# 前端开发
npm run dev              # 启动 Vite 开发服务器
npm run build            # 构建前端生产版本
npm run preview          # 预览生产构建

# Tauri 开发
npm run tauri dev        # 启动开发模式
npm run tauri build      # 构建桌面应用
npm run tauri info       # 查看环境信息

# 代码检查
npm run type-check       # TypeScript 类型检查
```

## 构建部署

### 开发构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 生产构建

```bash
npm run tauri build
```

构建产物将输出到 `src-tauri/target/release/bundle/` 目录。

不同平台的构建产物：

- **Windows**: `.msi` 安装包和 `.exe` 可执行文件
- **macOS**: `.dmg` 磁盘镜像和 `.app` 应用包
- **Linux**: `.AppImage`、`.deb`、`.rpm` 等格式

### 构建优化

1. **减小体积**：
   - 使用 `npm ci` 代替 `npm install`
   - 清理不必要的依赖
   - 启用代码压缩和 tree-shaking

2. **提高速度**：
   - 使用 Cargo 缓存
   - 并行编译
   - 增量编译

## 项目结构

### 详细目录结构

```
iflow-desktop/
├── src/                          # Vue 前端源码
│   ├── components/               # Vue 组件
│   │   ├── ChatHistory.vue       # 对话历史管理
│   │   ├── ChatInterface.vue     # 主对话界面
│   │   ├── FileExplorer.vue      # 文件浏览器
│   │   ├── FileEditor.vue        # 文件编辑器
│   │   ├── MainLayout.vue        # 主布局组件
│   │   └── ModelSelector.vue     # 模型选择器
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts              # 全局类型
│   ├── assets/                   # 静态资源
│   ├── App.vue                   # 根组件
│   ├── main.ts                   # 应用入口
│   └── vite-env.d.ts             # Vite 环境类型
├── src-tauri/                    # Tauri 后端
│   ├── src/                      # Rust 源码
│   │   ├── main.rs               # Rust 入口文件
│   │   └── lib.rs                # Tauri 命令处理
│   ├── capabilities/             # 权限配置
│   │   └── default.json          # 默认权限
│   ├── icons/                    # 应用图标
│   │   ├── 32x32.png
│   │   ├── 128x128.png
│   │   ├── icon.ico
│   │   └── ...
│   ├── Cargo.toml                # Rust 依赖配置
│   ├── Cargo.lock                # Rust 依赖锁定
│   ├── build.rs                  # 构建脚本
│   ├── tauri.conf.json           # Tauri 配置
│   └── .gitignore                # Git 忽略文件
├── public/                       # 公共静态资源
│   ├── tauri.svg
│   └── vite.svg
├── .vscode/                      # VS Code 配置
│   └── extensions.json           # 推荐扩展
├── .gitignore                    # Git 忽略文件
├── index.html                    # HTML 入口
├── package.json                  # Node.js 依赖配置
├── package-lock.json             # 依赖锁定文件
├── tsconfig.json                 # TypeScript 配置
├── tsconfig.node.json            # Node TypeScript 配置
├── vite.config.ts                # Vite 配置
└── README.md                     # 项目说明文档
```

## 核心组件说明

### ChatHistory.vue

**功能**：管理对话历史列表

**主要职责**：
- 显示对话列表
- 创建新对话
- 切换对话
- 删除对话
- 显示对话元信息（时间、模型）

**Props**：
- `conversations`: 对话列表
- `activeConversationId`: 当前活动对话 ID

**Events**：
- `new-chat`: 创建新对话
- `select-conversation`: 选择对话
- `delete-conversation`: 删除对话

### ChatInterface.vue

**功能**：主对话界面

**主要职责**：
- 显示对话消息列表
- 提供消息输入框
- 发送消息
- 显示模型选择器
- 处理流式响应

**Props**：
- `messages`: 消息列表
- `isGenerating`: 是否正在生成响应
- `availableModels`: 可用模型列表
- `currentModel`: 当前模型

**Events**：
- `send-message`: 发送消息
- `model-change`: 切换模型

### FileExplorer.vue

**功能**：文件浏览器

**主要职责**：
- 浏览本地文件系统
- 显示文件和文件夹
- 目录导航
- 选择文件

**Events**：
- `file-selected`: 选择文件

**依赖**：
- `@tauri-apps/plugin-dialog`: 对话框插件
- `@tauri-apps/plugin-fs`: 文件系统插件

### FileEditor.vue

**功能**：文件编辑器

**主要职责**：
- 编辑文件内容
- 保存文件
- 显示文件信息

**Props**：
- `file`: 当前文件对象

**Events**：
- `close`: 关闭编辑器
- `saved`: 文件保存成功

**依赖**：
- `@tauri-apps/plugin-fs`: 文件系统插件

### MainLayout.vue

**功能**：主布局组件

**主要职责**：
- 三栏布局管理
- 集成所有子组件
- 管理应用状态
- 处理 iflow 集成

**状态管理**：
- `conversations`: 对话列表
- `activeConversationId`: 活动对话 ID
- `currentModel`: 当前模型
- `isGenerating`: 生成状态
- `selectedFile`: 选中的文件

## Tauri 命令

### call_iflow

调用 iFlow CLI 执行 AI 对话。

**函数签名**：
```rust
#[tauri::command]
async fn call_iflow(message: String, model: Option<String>) -> Result<String, String>
```

**参数**：
- `message`: 发送给 iFlow 的消息
- `model`: 可选的模型 ID

**返回**：
- 成功：`Ok(String)` - AI 响应内容
- 失败：`Err(String)` - 错误信息

**实现细节**：
- 通过 stdin 与 iflow CLI 通信
- 自动过滤提示性输出
- 完善的错误处理

### check_iflow_installed

检查 iFlow CLI 是否已安装。

**函数签名**：
```rust
#[tauri::command]
async fn check_iflow_installed() -> Result<bool, String>
```

**返回**：
- 成功：`Ok(bool)` - 是否已安装
- 失败：`Err(String)` - 错误信息

### load_conversations

加载对话历史（预留功能）。

**函数签名**：
```rust
#[tauri::command]
async fn load_conversations() -> Result<Vec<serde_json::Value>, String>
```

**状态**：待实现

**计划**：
- 从本地文件系统加载对话历史
- 支持 JSON 格式存储

### save_conversations

保存对话历史（预留功能）。

**函数签名**：
```rust
#[tauri::command]
async fn save_conversations(conversations: Vec<serde_json::Value>) -> Result<(), String>
```

**状态**：待实现

**计划**：
- 保存对话历史到本地文件系统
- 支持增量保存

## 配置说明

### tauri.conf.json

主要配置项：

```json
{
  "productName": "iFlow Desktop",
  "version": "0.1.0",
  "identifier": "com.zhang.iflow-desktop",
  "app": {
    "windows": [
      {
        "title": "iFlow Desktop",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 600,
        "resizable": true
      }
    ]
  },
  "plugins": {
    "dialog": {},
    "fs": {}
  }
}
```

**窗口配置**：
- `title`: 窗口标题
- `width`/`height`: 窗口大小
- `minWidth`/`minHeight`: 最小尺寸
- `resizable`: 是否可调整大小

### capabilities/default.json

权限配置，控制应用可以访问的系统功能。

```json
{
  "permissions": [
    "core:default",
    "opener:default",
    "dialog:default",
    "dialog:allow-open",
    "fs:default",
    "fs:allow-read-file",
    "fs:allow-write-file",
    "fs:allow-read-dir",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file"
  ]
}
```

**权限说明**：
- `dialog`: 对话框权限
- `fs`: 文件系统权限
- `opener`: 打开外部链接权限

### vite.config.ts

Vite 构建配置。

```typescript
export default defineConfig({
  plugins: [vue()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    hmr: {
      port: 1421,
    },
  },
})
```

**配置项**：
- `port`: 开发服务器端口
- `strictPort`: 端口占用时是否退出
- `hmr.port`: 热更新端口

### tsconfig.json

TypeScript 配置。

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## 故障排除

### Rust 未找到

**症状**：
```
rustc : The term 'rustc' is not recognized
```

**解决方案**：
```bash
# 刷新环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 验证安装
rustc --version
cargo --version

# 如果仍然失败，重启终端或计算机
```

### iFlow CLI 未找到

**症状**：
```
iflow : The term 'iflow' is not recognized
```

**解决方案**：
```bash
# 验证安装
iflow --version

# 如果未安装
npm install -g @iflow-ai/iflow-cli@latest

# 重新登录 iFlow
iflow
```

### 端口被占用

**症状**：
```
Error: Port 1420 is already in use
```

**解决方案**：
```bash
# 查找占用端口的进程
netstat -ano | findstr :1420

# 杀死进程（替换 <PID> 为实际进程 ID）
taskkill /F /PID <PID>

# 或者修改 Vite 配置使用其他端口
```

### 编译失败

**症状**：
```
failed to run 'cargo metadata'
```

**解决方案**：
```bash
# 确保环境变量正确
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 清除缓存
cargo clean
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run tauri dev
```

### Tauri 插件错误

**症状**：
```
RuntimeError: plugin not found
```

**解决方案**：
```bash
# 确保插件已安装
npm install @tauri-apps/plugin-dialog @tauri-apps/plugin-fs

# 检查 Cargo.toml 中插件依赖
# 检查 tauri.conf.json 中插件配置
# 检查 capabilities/default.json 中权限配置
```

### 热更新不工作

**症状**：修改代码后界面没有自动更新

**解决方案**：
```bash
# 检查 HMR 端口是否被占用
netstat -ano | findstr :1421

# 重启开发服务器
# 检查浏览器控制台是否有错误
```

## 开发建议

### 代码规范

1. **TypeScript**：
   - 启用严格模式
   - 为所有函数添加类型注解
   - 使用 interface 定义数据结构

2. **Vue 3**：
   - 使用 Composition API
   - 使用 `<script setup>` 语法
   - 组件命名使用 PascalCase

3. **Rust**：
   - 遵循 Rust 命名规范
   - 使用 `cargo fmt` 格式化代码
   - 使用 `cargo clippy` 进行静态检查

### 组件开发

1. **单一职责**：每个组件只负责一个功能
2. **Props 验证**：使用 TypeScript 验证 Props
3. **事件命名**：使用 kebab-case
4. **样式隔离**：使用 `scoped` 样式

### 状态管理

1. **本地状态**：使用 `ref` 和 `reactive`
2. **全局状态**：考虑使用 Pinia（如需要）
3. **持久化**：使用 localStorage 或文件系统

### 错误处理

1. **前端错误**：
   - 使用 try-catch
   - 显示用户友好的错误信息
   - 记录错误日志

2. **后端错误**：
   - 使用 `Result` 类型
   - 提供详细的错误信息
   - 记录错误到日志

### 性能优化

1. **代码分割**：使用动态导入
2. **懒加载**：路由级别的懒加载
3. **缓存**：合理使用缓存策略
4. **防抖节流**：对频繁操作使用防抖节流

### 测试

1. **单元测试**：
   - 使用 Vitest
   - 测试纯函数和工具函数

2. **组件测试**：
   - 使用 Vue Test Utils
   - 测试组件行为

3. **E2E 测试**：
   - 使用 Playwright
   - 测试完整用户流程

## 发布流程

### 版本管理

使用语义化版本（Semantic Versioning）：
- `MAJOR.MINOR.PATCH`
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

### 发布步骤

1. **更新版本号**：
   ```bash
   # 更新 package.json
   npm version patch|minor|major

   # 手动更新 tauri.conf.json 中的版本号
   ```

2. **运行测试**：
   ```bash
   npm run type-check
   npm run build
   ```

3. **更新 CHANGELOG**：
   - 记录新增功能
   - 记录修复的问题
   - 记录破坏性变更

4. **构建生产版本**：
   ```bash
   npm run tauri build
   ```

5. **测试构建产物**：
   - 在不同平台测试
   - 验证所有功能正常
   - 检查安装和卸载流程

6. **创建 Git 标签**：
   ```bash
   git tag -a v0.1.0 -m "Release version 0.1.0"
   git push origin v0.1.0
   ```

7. **发布到 GitHub Releases**：
   - 上传构建产物
   - 撰写发布说明
   - 关联相关问题

8. **发布到 npm**（如果需要）：
   ```bash
   npm publish
   ```

### 发布检查清单

- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 所有测试通过
- [ ] 构建产物已测试
- [ ] 文档已更新
- [ ] Git 标签已创建
- [ ] Release Notes 已撰写
- [ ] 构建产物已上传

## Tauri 核心概念解释

### 前端和后端

**前端（Frontend）**：
- 用户看到和操作的界面
- 使用 Vue 3、HTML、CSS、JavaScript/TypeScript
- 运行在 WebView 中（类似浏览器）

**后端（Backend）**：
- 处理系统操作（文件、网络等）
- 使用 Rust 编写
- 提供安全的 API 给前端调用

### 组件（Component）

**什么是组件**？

组件是独立的、可复用的代码块，就像搭积木一样。

**示例**：
- `ChatHistory.vue`：对话历史组件
- `ChatInterface.vue`：对话界面组件
- `FileExplorer.vue`：文件浏览器组件

**组件的好处**：
- 代码组织清晰
- 可以重复使用
- 便于维护和测试

### Props 和 Events

**Props（属性）**：
- 父组件传递给子组件的数据
- 只读的，子组件不能修改

**示例**：
```vue
<!-- 父组件 -->
<ChatHistory :conversations="conversations" />

<!-- 子组件 -->
<script setup lang="ts">
defineProps<{
  conversations: Conversation[];
}>();
</script>
```

**Events（事件）**：
- 子组件通知父组件发生了什么
- 用于组件间通信

**示例**：
```vue
<!-- 父组件 -->
<ChatHistory @new-chat="handleNewChat" />

<!-- 子组件 -->
<script setup lang="ts">
defineEmits<{
  'new-chat': [];
}>();
</script>
```

### 响应式数据（Reactive Data）

**什么是响应式**？

当数据改变时，界面自动更新。

**Vue 3 的响应式**：

```typescript
import { ref, reactive } from 'vue';

// 使用 ref 定义基本类型
const count = ref(0);
count.value++; // 需要用 .value 访问

// 使用 reactive 定义对象
const user = reactive({
  name: '张三',
  age: 20
});
user.name = '李四'; // 直接访问
```

### Tauri 命令（Tauri Commands）

**什么是 Tauri 命令**？

Tauri 命令是前端调用后端 Rust 代码的方式。

**如何工作**：

1. 后端定义命令（Rust）
2. 前端调用命令（JavaScript）
3. 后端执行并返回结果

**示例**：

```rust
// 后端（Rust）
#[tauri::command]
fn greet(name: &str) -> String {
    format!("你好，{}！", name)
}
```

```typescript
// 前端（TypeScript）
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<string>('greet', { name: '世界' });
console.log(result); // 输出：你好，世界！
```

### 状态管理（State Management）

**什么是状态**？

状态就是应用的数据，比如：
- 当前的对话列表
- 选中的模型
- 用户输入的文字

**如何管理状态**：

1. **本地状态**：使用 `ref` 或 `reactive`
2. **全局状态**：使用 Pinia（状态管理库）
3. **持久化**：保存到文件或数据库

### 生命周期（Lifecycle）

**组件生命周期**：

组件从创建到销毁的过程。

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

// 组件挂载后执行
onMounted(() => {
  console.log('组件已创建');
});

// 组件卸载前执行
onUnmounted(() => {
  console.log('组件将要销毁');
});
</script>
```

### 插件（Plugins）

**什么是插件**？

插件为 Tauri 提供额外功能。

**常用插件**：

- `tauri-plugin-dialog`：对话框（打开文件、保存文件）
- `tauri-plugin-fs`：文件系统操作
- `tauri-plugin-opener`：打开外部链接

**使用插件**：

```typescript
import { open } from '@tauri-apps/plugin-dialog';

const filePath = await open({
  multiple: false,
  directory: true
});
```

### 构建和打包（Build and Bundle）

**开发模式（Development）**：
- 快速迭代，支持热更新
- 代码未优化，体积较大

**生产模式（Production）**：
- 代码优化，体积小
- 生成可分发的安装包

**打包产物**：
- Windows: `.msi`、`.exe`
- macOS: `.dmg`、`.app`
- Linux: `.AppImage`、`.deb`

### WebView

**什么是 WebView**？

WebView 是一个嵌入式的浏览器组件，用于显示前端界面。

**Tauri 的 WebView**：
- 使用系统原生的 WebView
- Windows: WebView2
- macOS: WebKit
- Linux: WebKitGTK

**为什么用 WebView**：
- 可以使用熟悉的 Web 技术
- 跨平台兼容性好
- 性能接近原生应用

### 进程（Process）

**Tauri 的进程结构**：

1. **主进程（Main Process）**：
   - Rust 代码运行
   - 管理窗口和系统操作

2. **渲染进程（Renderer Process）**：
   - 前端代码运行
   - 在 WebView 中执行

3. **进程间通信（IPC）**：
   - 前端和后端通过 Tauri 命令通信

---

## 新手教程

### 教程一：修改欢迎信息

让我们从最简单的开始，修改应用的欢迎信息。

**步骤**：

1. 打开文件 `src/App.vue`
2. 找到 `<template>` 部分
3. 修改任何文字内容
4. 保存文件
5. 查看应用自动更新

**示例**：

```vue
<template>
  <MainLayout />
</template>
```

改为：

```vue
<template>
  <MainLayout />
  <div>你好，Tauri！</div>
</template>
```

### 教程二：修改应用标题

**步骤**：

1. 打开文件 `src-tauri/tauri.conf.json`
2. 找到 `title` 字段
3. 修改标题文字
4. 保存文件
5. 重启应用

**示例**：

```json
"title": "iFlow Desktop"
```

改为：

```json
"title": "我的第一个 Tauri 应用"
```

### 教程三：添加一个简单的按钮

让我们在主布局中添加一个按钮。

**步骤**：

1. 打开文件 `src/components/MainLayout.vue`
2. 在 `<template>` 中添加按钮
3. 在 `<script setup>` 中添加点击事件

**示例**：

在 `<template>` 的最后添加：

```vue
<button @click="handleClick">点击我</button>
```

在 `<script setup>` 中添加：

```vue
function handleClick() {
  alert('你点击了按钮！');
}
```

### 教程四：理解组件结构

让我们看看一个组件是如何工作的。

**打开文件**：`src/components/ChatHistory.vue`

**组件结构**：

```vue
<template>
  <!-- HTML 模板，显示界面 -->
  <div class="chat-history">
    ...
  </div>
</template>

<script setup lang="ts">
  // JavaScript/TypeScript 逻辑
  // 定义数据、函数等
</script>

<style scoped>
  /* CSS 样式 */
  /* scoped 表示样式只影响当前组件 */
</style>
```

### 教程五：添加一个新的模型

让我们在模型选择器中添加一个新的模型。

**步骤**：

1. 打开文件 `src/components/MainLayout.vue`
2. 找到 `availableModels` 数组
3. 添加新的模型

**示例**：

```typescript
const availableModels: Model[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'glm-4', name: 'GLM-4', provider: '智谱AI' },
  // 添加新模型
  { id: 'my-model', name: '我的模型', provider: '自定义' },
];
```

### 教程六：调用系统命令

让我们学习如何在 Rust 端添加一个新命令。

**步骤**：

1. 打开文件 `src-tauri/src/lib.rs`
2. 添加一个新的命令函数
3. 在 `invoke_handler` 中注册
4. 在前端调用

**示例**：

在 `lib.rs` 中添加：

```rust
#[tauri::command]
fn say_hello(name: &str) -> String {
    format!("你好，{}！", name)
}
```

在 `invoke_handler` 中添加：

```rust
.invoke_handler(tauri::generate_handler![
    call_iflow,
    load_conversations,
    save_conversations,
    check_iflow_installed,
    say_hello  // 添加新命令
])
```

在前端调用（在 MainLayout.vue 中）：

```typescript
const { invoke } = await import('@tauri-apps/api/core');
const result = await invoke<string>('say_hello', { name: '世界' });
console.log(result); // 输出：你好，世界！
```

### 教程七：理解数据流

了解数据如何在应用中流动。

**流程**：

1. 用户点击按钮 → 触发事件
2. 组件处理事件 → 更新数据
3. 数据变化 → 界面自动更新

**示例**：

```vue
<script setup lang="ts">
import { ref } from 'vue';

// 1. 定义响应式数据
const count = ref(0);

// 2. 定义函数
function increment() {
  count.value++; // 3. 更新数据
}
</script>

<template>
  <!-- 4. 显示数据 -->
  <div>计数：{{ count }}</div>
  <!-- 5. 触发事件 -->
  <button @click="increment">增加</button>
</template>
```

### 教程八：保存数据到文件

让我们学习如何保存对话历史到文件。

**步骤**：

1. 使用 Tauri 的文件系统 API
2. 选择保存位置
3. 写入文件

**示例代码**：

```typescript
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

async function saveConversationsToFile(conversations: any[]) {
  // 1. 选择保存位置
  const filePath = await save({
    defaultPath: 'conversations.json',
    filters: [
      {
        name: 'JSON',
        extensions: ['json']
      }
    ]
  });

  if (filePath) {
    // 2. 转换为 JSON 字符串
    const jsonData = JSON.stringify(conversations, null, 2);

    // 3. 写入文件
    await writeTextFile(filePath, jsonData);

    alert('保存成功！');
  }
}
```

### 教程九：添加深色模式切换

让我们为应用添加深色模式功能。

**步骤**：

1. 定义深色模式状态
2. 切换主题类名
3. 使用 CSS 变量

**示例**：

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isDark = ref(false);

// 检测系统主题
onMounted(() => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark.value = true;
  }
});

function toggleTheme() {
  isDark.value = !isDark.value;
}
</script>

<template>
  <div :class="{ 'dark-mode': isDark }">
    <button @click="toggleTheme">
      {{ isDark ? '☀️ 浅色' : '🌙 深色' }}
    </button>
  </div>
</template>

<style>
.dark-mode {
  --bg-primary: #1a1a1a;
  --text-primary: #f0f0f0;
}
</style>
```

### 教程十：调试技巧

学会调试会让开发更高效。

**前端调试**：

1. 打开浏览器开发者工具（F12）
2. 查看控制台输出
3. 使用 `console.log()` 输出变量

```typescript
console.log('变量值：', myVariable);
```

**后端调试**：

1. 使用 `println!` 输出信息
2. 查看 Tauri 日志

```rust
println!("调试信息：{}", variable);
```

**常见调试命令**：

```bash
# 检查 Rust 代码
cargo check

# 格式化代码
cargo fmt

# 静态分析
cargo clippy

# TypeScript 类型检查
npm run type-check
```

## 贡献指南

### 贡献流程

1. **Fork 项目**
2. **创建特性分支**：
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **提交更改**：
   ```bash
   git add .
   git commit -m 'feat: add some AmazingFeature'
   ```

4. **推送到分支**：
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **开启 Pull Request**

### 提交信息规范

使用 Conventional Commits 规范：

- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

示例：
```
feat(chat): add message export functionality

fix(editor): resolve file save issue on Windows

docs(readme): update installation instructions
```

### 代码审查

- 确保代码通过 lint
- 添加必要的测试
- 更新相关文档
- 保持代码风格一致

### 问题报告

提交问题时请包含：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（OS、版本号）
- 错误日志

## 常见问题

### Q: 如何添加新的 Tauri 命令？

A:
1. 在 `src-tauri/src/lib.rs` 中定义命令函数
2. 使用 `#[tauri::command]` 宏
3. 在 `invoke_handler` 中注册命令
4. 在前端使用 `invoke()` 调用

### Q: 如何添加新的 Vue 组件？

A:
1. 在 `src/components/` 创建组件文件
2. 使用 `<script setup lang="ts">` 语法
3. 在父组件中导入和使用
4. 添加必要的类型定义

### Q: 如何修改应用图标？

A:
1. 准备不同尺寸的图标
2. 替换 `src-tauri/icons/` 中的图标文件
3. 运行 `npm run tauri build` 重新构建

### Q: 如何调试 Rust 代码？

A:
1. 使用 `println!` 输出调试信息
2. 使用 VS Code 的 Rust 插件
3. 使用 `cargo check` 检查错误
4. 使用 `cargo clippy` 进行静态分析

## 资源链接

- [Tauri 官方文档](https://tauri.app/)
- [Vue 3 官方文档](https://vuejs.org/)
- [Rust 官方文档](https://www.rust-lang.org/)
- [iFlow CLI 文档](https://platform.iflow.cn/cli/)
- [Vite 官方文档](https://vitejs.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)