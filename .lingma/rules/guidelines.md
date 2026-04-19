---
trigger: model_decision
description: 详细开发规范（架构+代码质量+协作流程）
---

# 我的一个梦 - 开发规范

> **版本**: 3.1.0 | **更新**: 2026-04-19
> 
> **说明**: 本文档是详细的开发规范，涵盖架构设计、代码质量标准和团队协作流程。
> 开发新功能时请参考此文档。

---

## 🏗️ 核心架构

### 消息流程
```
用户输入 → ChatInterface → MainLayout → chatStore 
→ Tauri Command → 智谱 AI API → 流式响应 → UI
```

### 数据保存时机
- ✅ 添加消息、AI回复完成、切换模型、删除对话 → **立即保存**
- ❌ 流式更新中 → **不保存** (避免频繁IO)

### 关键文件映射

| 功能 | 前端 | 后端 | Store |
|------|------|------|-------|
| 智能对话 | `ChatInterface.vue` | `zhipu.rs` | `chatStore.ts` |
| 对话历史 | `ChatHistory.vue` | `conversation.rs` | `chatStore.ts` |
| 文件操作 | `FileExplorer/Editor.vue` | - | `fileStore.ts` |
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

// ✅ 数据持久化 - 使用安装目录
fn get_data_path(_app: &AppHandle) -> PathBuf {
    let exe_path = std::env::current_exe().unwrap();
    let install_dir = exe_path.parent().unwrap();
    install_dir.join("data").join("data.json")
}
```

### TypeScript/Vue 规范

```typescript
// ✅ Pinia Store 解构保持响应式
import { storeToRefs } from 'pinia';
const { state } = storeToRefs(store);

// ✅ API层使用
import { zhipuApi, conversationApi } from '../utils/api';
await zhipuApi.sendMessage(apiKey, content, model);

// ✅ 日志记录
import { info, error as logError } from '../utils/logger';
info('Module', '操作成功');

// ✅ 代码复用
import { useKeyboardShortcuts } from '../composables';

// ✅ Naive UI 组件使用
import { NButton, NInput, NCard, NEmpty } from 'naive-ui';
```

**Naive UI 最佳实践**:

```vue
<!-- ✅ 按钮规范 -->
<n-button size="small" quaternary @click="handleClick">操作</n-button>
<n-button type="primary" :disabled="!isValid">确认</n-button>

<!-- ✅ 输入框规范 -->
<n-input 
  v-model:value="text" 
  type="textarea"
  :autosize="{ minRows: 1, maxRows: 6 }"
  clearable
  placeholder="请输入..."
/>

<!-- ✅ 卡片规范 -->
<n-card size="small" hoverable>
  <template #header>
    <div class="card-header">
      <span>标题</span>
      <n-button size="tiny" quaternary>操作</n-button>
    </div>
  </template>
  内容
  <template #action>
    <n-button size="tiny" text type="error">删除</n-button>
  </template>
</n-card>

<!-- ✅ 对话框规范 -->
<n-modal v-model:show="visible" preset="card" title="标题" style="max-width: 500px;">
  内容
  <template #footer>
    <div style="display: flex; justify-content: flex-end; gap: 12px;">
      <n-button @click="close">取消</n-button>
      <n-button @click="confirm" type="primary">确认</n-button>
    </div>
  </template>
</n-modal>

<!-- ✅ 空状态规范 -->
<n-empty description="暂无数据">
  <template #extra>
    <n-button @click="createNew" type="primary" size="small">
      创建新项
    </n-button>
  </template>
</n-empty>

<!-- ✅ 统计信息规范 -->
<n-space size="small">
  <n-statistic label="消息" :value="count" size="tiny">
    <template #prefix>💬</template>
  </n-statistic>
</n-space>

<!-- ✅ 状态标签规范 -->
<n-tag :type="ready ? 'success' : 'error'" size="small" round>
  <template #icon><span>{{ ready ? '✅' : '⚠️' }}</span></template>
  状态文本
</n-tag>
```

### 架构原则

**单一职责 (SRP)**: 每个模块/函数只做一件事
**开闭原则 (OCP)**: 对扩展开放，对修改关闭
**DRY 原则**: 相同逻辑只写一次

**CSS与JS分离**:
- 公共样式 → `src/styles/components.css`
  - `.panel-header` / `.panel-title` - 面板头部
  - `.tool-header` - 工具栏头部
  - `.status-dot` - 状态指示器（支持 success/error/warning/running/stopped）
  - `.loading-spinner` - 加载动画
  - `@keyframes pulse/spin` - 通用动画
- 可复用逻辑 → `src/composables/`
- 工具函数 → `src/utils/`
- 组件特有样式 → `<style scoped>`

**公共样式使用示例**:
```vue
<!-- ✅ 直接使用公共类，无需重复定义 -->
<div class="panel-header">
  <span class="panel-title">📌 面板标题</span>
  <n-button quaternary circle @click="close">×</n-button>
</div>

<!-- ❌ 不要在组件中重复定义 -->
<style scoped>
.panel-header { /* 删除！已存在于 components.css */ }
.panel-title { /* 删除！已存在于 components.css */ }
</style>
```

**Naive UI 使用规范**:
- **按钮**: 使用 `size="small"` 和 `quaternary` 实现幽灵按钮效果
- **输入框**: 添加 `clearable` 属性，使用 `:autosize` 自动调整高度
- **卡片**: 使用 `hoverable` 增强交互，通过 `template #header/action` 组织内容
- **对话框**: 统一使用 `preset="card"` 模式，通过 `template #footer` 放置按钮
- **空状态**: 使用 `<n-empty>` + `template #extra` 提供操作按钮
- **统计**: 使用 `<n-statistic>` + `<n-space>` 替代自定义布局
- **标签**: 使用 `<n-tag>` 替代自定义状态指示器

**分层调用规则**:
```
✅ 允许：Components → Composables → Stores → API Layer → Rust Backend
❌ 禁止：Components 直接调用 Rust Command
❌ 禁止：Components 直接操作 localStorage
❌ 禁止：Stores 包含复杂业务逻辑
```

**错误处理**:
```typescript
// ✅ 结构化错误
import { AppError, ErrorCodes } from '../utils/errorHandler';
throw new AppError(ErrorCodes.API_KEY_MISSING, 'API Key未配置');

// ✅ 安全执行（带重试）
const result = await ErrorHandler.safeExecute(
  () => fetchData(),
  'API Request',
  2 // 重试次数
);
```

---

## 🎯 代码质量标准

### 命名规范
```typescript
// ✅ 语义化
const apiKey = 'xxx';
const conversationList: Conversation[] = [];
async function loadConversations(): Promise<Conversation[]> {}

// ❌ 模糊
const data = 'xxx';
const list: any[] = [];
async function getData() {}
```

### 类型安全
```typescript
// ✅ 明确定义接口
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ❌ 使用 any
function sendMessage(message: any): Promise<void> {}
```

### 函数复杂度
- 单个函数 ≤ 50 行
- 圈复杂度 ≤ 10
- 参数 ≤ 3 个（超过则使用对象）

### 注释规范
```typescript
/**
 * 发送消息到智谱 AI
 * @param apiKey - 用户的 API Key
 * @param messages - 对话消息列表
 * @returns 流式响应迭代器
 */
async function* sendMessageStream(
  apiKey: string,
  messages: Message[],
  model: string
): AsyncGenerator<string> {}
```

---

## 🔍 Code Review 清单

### 提交前自检

**功能性**:
- [ ] 功能是否按需求实现？
- [ ] 边界情况是否处理？
- [ ] 错误提示是否友好？

**代码质量**:
- [ ] 是否有未使用的导入/变量？
- [ ] 是否有 console.log/debugger？
- [ ] 函数是否过长（>50 行）？
- [ ] 嵌套是否过深（>3 层）？

**类型安全**:
- [ ] 是否避免了 any 类型？
- [ ] 接口定义是否完整？

**性能**:
- [ ] 是否有不必要的重复计算？
- [ ] 是否有内存泄漏风险？

**安全性**:
- [ ] 敏感信息是否加密存储？
- [ ] 用户输入是否验证？

---

## 📝 Git 提交规范

```bash
# ✅ 正确格式
git commit -m "feat: 添加对话导出为 PDF 功能"
git commit -m "fix: 修复深色模式下按钮颜色异常"
git commit -m "refactor: 重构消息发送逻辑"
git commit -m "docs: 更新 API 使用文档"
git commit -m "test: 添加 chatStore 单元测试"
git commit -m "chore: 更新依赖包版本"

# ❌ 错误格式
git commit -m "update"
git commit -m "fix bug"
```

**提交类型**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建工具变动

---

## 🧪 测试规范

**覆盖率要求**:
- 核心业务逻辑: ≥ 80%
- 工具函数: ≥ 90%
- UI 组件: ≥ 60%

```typescript
describe('validateApiKey', () => {
  it('应该接受有效的 API Key', () => {
    expect(validateApiKey('a'.repeat(32))).toBe(true);
  });
  
  it('应该拒绝过短的 API Key', () => {
    expect(validateApiKey('short')).toBe(false);
  });
});
```

---

## 🚀 性能优化

```typescript
// ✅ 懒加载大型组件
const SettingsPanel = defineAsyncComponent(() => import('./SettingsPanel.vue'));

// ✅ 搜索输入防抖
const debouncedSearch = debounce((keyword: string) => {
  performSearch(keyword);
}, 300);

// ✅ 大数据量虚拟滚动
const { list } = useVirtualList(messages, { itemHeight: 60 });
```

---

## 🔒 安全规范

```typescript
// ✅ API Key 通过 Rust 后端加密存储
await invoke('save_api_key', { key: apiKey });

// ✅ 用户输入验证
function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '');
}

// ❌ 明文存储在 localStorage
localStorage.setItem('apiKey', apiKey);
```

---

## 🤝 协作流程

### 分支管理
```bash
main              # 生产环境
develop           # 开发环境
feature/xxx       # 功能分支
fix/xxx          # Bug 修复
release/v1.9.0   # 发布分支
```

### Code Review 流程
```
开发者创建 PR
  ↓
自动化检查通过（Lint、Test、Build）
  ↓
至少 1 人 Review
  ↓
解决 Review 意见
  ↓
Merge 到 develop
```

---

## 🐛 常见问题

### Store 响应式丢失？
```typescript
// ✅ 正确
const { state } = storeToRefs(store);

// ❌ 错误
const { state } = store;
```

### 使用了 console.log？
```typescript
// ✅ 正确
import { info, error as logError } from '../utils/logger';
info('Module', '信息');

// ❌ 错误
console.log('信息');
```

### 数据持久化问题？
```typescript
// ✅ 使用 Rust 后端
const data = await invoke<Conversation[]>('load_conversations');

// ❌ 禁止使用 localStorage
localStorage.setItem('data', JSON.stringify(data));
```

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

## 📊 质量指标

| 指标 | 目标值 |
|------|--------|
| 测试覆盖率 | ≥ 70% |
| 圈复杂度 | ≤ 10 |
| 函数长度 | ≤ 50 行 |
| TypeScript 覆盖率 | 100% |
| 首屏加载 | ≤ 2s |
| 页面切换 | ≤ 300ms |

---

## ✅ 开发原则

1. **遵循现有代码风格**
2. **保持类型安全**（避免 any）
3. **考虑深色主题兼容性**
4. **分阶段完成复杂任务**
5. **即时反馈进度**
6. **数据持久化**: 所有业务数据通过 Rust 后端存储
7. **日志记录**: 使用统一 logger，禁止 `console.log`
8. **代码清理**: 及时删除注释代码和未使用的变量
9. **Naive UI 优先**: 必须使用 Naive UI 组件，禁止原生 HTML 元素
10. **公共样式复用**: 优先使用 `components.css` 中的公共样式，避免重复定义

---

**记住**: 好的代码是写给人看的，顺便给机器执行。
