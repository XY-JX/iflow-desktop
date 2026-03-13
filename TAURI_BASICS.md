# Tauri 基本概念和操作

本文档面向 Tauri 初学者，介绍 Tauri 的基本概念、核心原理和常用操作。

---

# 初学者快速入门指南

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

**如果任何命令报错**，请参考 DEVELOPMENT.md 中的"安装步骤"章节。

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
2. **查文档**：查看 DEVELOPMENT.md 的"故障排除"章节
3. **重启应用**：关闭命令行，重新运行 `npm run tauri dev`

## 推荐学习路径

1. 先运行项目，熟悉界面
2. 尝试修改 `src/App.vue` 的文字
3. 看懂前端组件的结构
4. 学习如何添加新功能
5. 了解 Rust 后端命令

---

# Tauri 核心概念解释

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

# 新手教程

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

---

# 下一步学习

完成以上教程后，你可以：

1. **深入 Vue 3**：学习更多 Vue 3 特性和最佳实践
2. **学习 Rust**：了解 Rust 语法和 Tauri 命令开发
3. **阅读项目代码**：研究 iFlow Desktop 的实现细节
4. **添加新功能**：尝试添加你想要的功能
5. **查看官方文档**：
   - [Tauri 官方文档](https://tauri.app/)
   - [Vue 3 官方文档](https://vuejs.org/)
   - [Rust 官方文档](https://www.rust-lang.org/)

如有任何问题，请参考 DEVELOPMENT.md 文档获取更详细的信息。