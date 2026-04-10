# 任务管理系统使用指南 v2.0

## 📖 概述

本项目包含一个功能完善的任务管理系统，帮助 AI 助手高效跟踪和管理待执行任务。

**主要特性：**
- ✅ 支持任务详细信息（相关文件、说明）
- ✅ 完成任务后自动删除
- ✅ 支持移动任务优先级
- ✅ 统计信息展示
- ✅ 命令行工具 + NPM 脚本

---

## 📁 相关文件

- **AI_TASKS.md** - 任务清单文件（手动编辑）
- **scripts/task-manager.js** - 任务管理工具（命令行）
- **.lingma/AI_PROJECT_GUIDE.md** - AI 项目理解指南

---

## 🚀 快速开始

### 方法一：使用命令行工具

```bash
# 1. 添加任务（支持详细信息）
npm run task:add "优化登录页面性能" --priority high --files "src/Login.vue" --note "需要考虑移动端适配"

# 2. 查看所有任务
npm run task:list

# 3. 完成任务（自动删除）
npm run task:complete 1

# 4. 移动任务优先级
npm run task:move 2 low

# 5. 查看统计信息
npm run task:stats

# 6. 删除任务
npm run task:delete 3
```

### 方法二：直接编辑 AI_TASKS.md

直接在 `AI_TASKS.md` 文件中添加或删除任务：

```markdown
## 🔴 高优先级（立即执行）

- [ ] 任务描述
  - 相关文件：`path/to/file`
  - 预期结果：...
  - 注意事项：...
```

---

## 📋 任务格式

### 基本格式

```markdown
- [ ] 任务标题
  - 相关文件：`file1.ts`, `file2.vue`
  - 说明：功能说明或注意事项
```

**示例：**

```markdown
- [ ] 实现用户登录功能
  - 相关文件：`src/components/LoginForm.vue`, `src/stores/authStore.ts`
  - 说明：需要支持手机号和邮箱两种登录方式
```

### 状态标记

- `- [ ]` - 未完成任务
- `- [x]` - 已完成任务

### 优先级分类

| 优先级 | 标识 | 说明 |
|--------|------|------|
| 高 | 🔴 | 立即执行，紧急且重要 |
| 中 | 🟡 | 近期执行，重要但不紧急 |
| 低 | 🟢 | 有空执行，优化类任务 |

---

## 💡 使用场景

### 场景 1：多步骤开发任务

```markdown
## 🔴 高优先级（立即执行）

- [ ] 实现用户登录功能
  - 步骤 1：创建登录表单组件
  - 步骤 2：添加 API 调用逻辑
  - 步骤 3：实现错误处理
  - 步骤 4：编写单元测试
```

### 场景 2：Bug 修复列表

```markdown
## 🟡 中优先级（近期执行）

- [ ] 修复消息发送失败问题
  - 相关文件：`src/components/ChatInterface.vue`
  - 原因：API Key 未正确传递
  
- [ ] 修复主题切换不生效
  - 相关文件：`src/theme/index.ts`
  - 原因：CSS 变量未更新
```

### 场景 3：功能优化建议

```markdown
## 🟢 低优先级（有空执行）

- [ ] 优化首屏加载速度
  - 方案：代码分割 + 懒加载
  - 预期提升：50%
  
- [ ] 添加键盘快捷键支持
  - Ctrl+Enter: 发送消息
  - Ctrl+K: 清空对话
```

---

## 🔄 工作流程

### AI 助手的标准流程

1. **启动时检查任务**
   ```bash
   npm run task:list
   ```

2. **从高优先级开始执行**
   - 选择第一个未完成的高优先级任务
   - 阅读任务详情和相关文件

3. **执行任务**
   - 按照任务描述进行开发
   - 测试功能是否正常

4. **标记完成（自动删除）**
   ```bash
   npm run task:complete 1
   ```
   - 任务会自动从清单中删除
   - 无需手动编辑文件

5. **继续下一个任务**
   - 重复步骤 2-4，直到所有任务完成

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **任务描述清晰具体**
   ```markdown
   - [ ] ❌ 优化性能
   - [ ] ✅ 优化 ChatInterface 组件渲染性能，减少不必要的重渲染
   ```

2. **标注相关文件**
   ```markdown
   - [ ] 修复导出功能
     - 相关文件：`src/components/MainLayout.vue:handleExportConversation`
   ```

3. **设置合理优先级**
   - Bug 修复 → 高优先级
   - 新功能 → 中优先级
   - 优化改进 → 低优先级

4. **及时清理已完成任务**
   - 保持任务清单简洁
   - 避免积累过多历史任务

### ❌ 避免的做法

1. **任务过于笼统**
   ```markdown
   - [ ] 改进应用  # 太模糊
   ```

2. **缺少关键信息**
   ```markdown
   - [ ] 修复 bug  # 哪个 bug？怎么修复？
   ```

3. **优先级混乱**
   - 不要把所有任务都设为高优先级
   - 根据实际情况合理分配

---

## 🛠️ 命令行工具详解

### 添加任务

```bash
# 基本用法
npm run task:add "任务描述"

# 指定优先级
npm run task:add "紧急任务" --priority high
npm run task:add "普通任务" --priority medium
npm run task:add "优化任务" --priority low

# 添加详细信息
npm run task:add "修复登录bug" \
  --priority high \
  --files "src/Login.vue,src/stores/authStore.ts" \
  --note "需要处理网络超时情况"
```

**参数说明：**
- `--priority`: 优先级 (high/medium/low)，默认 medium
- `--files`: 相关文件，多个文件用逗号分隔
- `--note`: 任务说明或注意事项

### 查看任务

```bash
npm run task:list
```

输出示例：
```
📋 当前任务清单：

## 🔴 高优先级（立即执行）
  ⬜ 修复登录页面样式问题
     - 相关文件：`src/Login.vue`

## 🟡 中优先级（近期执行）

## 🟢 低优先级（有空执行）

## ✅ 已完成任务（第2-4阶段）

📊 统计：待完成 1 | 已完成 8 | 总计 9
```

**特性：**
- ✅ 显示任务详细信息
- ✅ 区分待完成和已完成
- ✅ 实时统计数据

### 完成任务

```bash
npm run task:complete 1  # 完成第 1 个任务
```

**特性：**
- ✅ 自动删除任务（包括详细信息）
- ✅ 显示完成的任务描述
- ✅ 无需手动编辑文件

### 移动任务优先级

```bash
npm run task:move 2 high   # 将第 2 个任务移动到高优先级
npm run task:move 3 low    # 将第 3 个任务移动到低优先级
```

**使用场景：**
- 任务优先级发生变化
- 重新规划任务顺序

### 查看统计信息

```bash
npm run task:stats
```

输出示例：
```
📊 任务统计信息

🔴 高优先级: 2 个任务
🟡 中优先级: 3 个任务
🟢 低优先级: 1 个任务
   ──────────────
⏳ 待完成:   6 个任务
✅ 已完成:   8 个任务
   ──────────────
📋 总计:     14 个任务

📈 完成率: 57.1%
```

### 删除任务

```bash
npm run task:delete 2  # 删除第 2 个任务
```

**注意：** 删除操作不可恢复，请谨慎使用。

---

## 📊 任务统计

### 使用 stats 命令（推荐）

```bash
npm run task:stats
```

显示详细的统计信息，包括：
- 各优先级任务数量
- 待完成/已完成数量
- 完成率百分比

---

## 🔗 与其他工具集成

### Git 提交时引用任务

```bash
git commit -m "feat: 实现登录功能 (#1)"
```

### VS Code 任务面板

在 VS Code 中安装 Markdown Todo 插件，可以直接在编辑器中查看和管理任务。

---

## ❓ 常见问题

### Q: 如何批量添加任务？

A: 直接编辑 `AI_TASKS.md` 文件更高效：

```markdown
## 🔴 高优先级（立即执行）

- [ ] 任务 1
- [ ] 任务 2
- [ ] 任务 3
```

### Q: 任务太多怎么办？

A: 
1. 定期清理已完成的任务
2. 将低优先级任务移到后续迭代
3. 考虑拆分为多个小任务

### Q: 如何追踪任务历史？

A: 使用 Git 版本控制：

```bash
git log --oneline AI_TASKS.md
```

---

## 📝 示例：完整工作流

```bash
# 1. 查看当前任务
npm run task:list

# 2. 添加新任务（带详细信息）
npm run task:add "修复消息发送超时问题" \
  --priority high \
  --files "src/ChatInterface.vue,src/api/chat.ts" \
  --note "需要增加重试机制"

# 3. 开始执行任务
# ... 编码、测试 ...

# 4. 标记完成（自动删除）
npm run task:complete 1

# 5. 确认清理
npm run task:list

# 6. 查看统计
npm run task:stats
```

---

*祝您高效完成任务！* 🎉
