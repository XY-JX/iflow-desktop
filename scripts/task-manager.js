#!/usr/bin/env node

/**
 * AI 任务管理工具 v2.0
 * 
 * 使用方法：
 *   node scripts/task-manager.js add "任务描述" --priority high --files "src/a.ts,src/b.vue" --note "注意事项"
 *   node scripts/task-manager.js complete 1
 *   node scripts/task-manager.js move 1 high
 *   node scripts/task-manager.js list
 *   node scripts/task-manager.js stats
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE = path.join(__dirname, '..', 'AI_TASKS.md');

// 优先级映射
const PRIORITY_MAP = {
  high: '🔴 高优先级（立即执行）',
  medium: '🟡 中优先级（近期执行）',
  low: '🟢 低优先级（有空执行）'
};

/**
 * 读取任务文件
 */
function readTasksFile() {
  if (!fs.existsSync(TASKS_FILE)) {
    console.error('❌ 任务文件不存在：', TASKS_FILE);
    process.exit(1);
  }
  return fs.readFileSync(TASKS_FILE, 'utf-8');
}

/**
 * 写入任务文件
 */
function writeTasksFile(content) {
  fs.writeFileSync(TASKS_FILE, content, 'utf-8');
  console.log('✅ 任务文件已更新');
}

/**
 * 添加任务（支持详细信息）
 */
function addTask(description, options = {}) {
  const { priority = 'medium', files = '', note = '' } = options;
  const content = readTasksFile();
  const section = PRIORITY_MAP[priority] || PRIORITY_MAP.medium;
  
  // 构建任务内容
  let taskContent = `- [ ] ${description}\n`;
  if (files) {
    taskContent += `  - 相关文件：\`${files}\`\n`;
  }
  if (note) {
    taskContent += `  - 说明：${note}\n`;
  }
  taskContent += '\n';
  
  // 在对应优先级区域添加任务
  const lines = content.split('\n');
  const sectionIndex = lines.findIndex(line => line.includes(section));
  
  if (sectionIndex !== -1) {
    // 找到该部分的结束位置（下一个 --- 或文件末尾）
    let insertIndex = sectionIndex + 2; // 跳过标题和空行
    while (insertIndex < lines.length && !lines[insertIndex].includes('---')) {
      insertIndex++;
    }
    
    lines.splice(insertIndex, 0, taskContent);
    writeTasksFile(lines.join('\n'));
    console.log(`✅ 已添加${priority === 'high' ? '🔴高' : priority === 'low' ? '🟢低' : '🟡中'}优先级任务`);
  } else {
    console.error('❌ 未找到对应的优先级区域');
  }
}

/**
 * 列出所有任务（增强版）
 */
function listTasks() {
  const content = readTasksFile();
  const lines = content.split('\n');
  
  console.log('\n📋 当前任务清单：\n');
  
  let currentPriority = '';
  let taskCount = 0;
  let pendingCount = 0;
  let completedCount = 0;
  
  lines.forEach((line, index) => {
    // 检测优先级标题
    if (line.includes('🔴') || line.includes('🟡') || line.includes('🟢')) {
      currentPriority = line.trim();
      console.log(`\n${currentPriority}`);
      return;
    }
    
    // 检测已完成区域
    if (line.includes('✅ 已完成任务')) {
      console.log(`\n${line.trim()}`);
      return;
    }
    
    // 检测任务项
    if (line.includes('- [ ]') || line.includes('- [x]')) {
      taskCount++;
      const isCompleted = line.includes('[x]');
      if (isCompleted) {
        completedCount++;
      } else {
        pendingCount++;
      }
      
      const status = isCompleted ? '✅' : '⬜';
      const taskDesc = line.replace(/^- \[[ x]\] /, '').trim();
      console.log(`  ${status} ${taskDesc}`);
      
      // 显示任务的详细信息（下一行）
      if (index + 1 < lines.length && lines[index + 1].trim().startsWith('-')) {
        console.log(`     ${lines[index + 1].trim()}`);
      }
    }
  });
  
  if (taskCount === 0) {
    console.log('  （暂无任务）');
  }
  
  console.log(`\n📊 统计：待完成 ${pendingCount} | 已完成 ${completedCount} | 总计 ${taskCount}\n`);
}

/**
 * 完成任务（自动删除）
 */
function completeTask(taskNumber) {
  const content = readTasksFile();
  const lines = content.split('\n');
  
  let taskIndex = 0;
  let found = false;
  let taskDescription = '';
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('- [ ]')) {
      taskIndex++;
      if (taskIndex === taskNumber) {
        taskDescription = lines[i].replace(/^- \[ \] /, '').trim();
        // 删除任务及其详细信息
        let deleteCount = 1;
        // 检查是否有详细信息行
        while (i + deleteCount < lines.length && 
               (lines[i + deleteCount].trim().startsWith('- ') || 
                lines[i + deleteCount].trim() === '')) {
          if (lines[i + deleteCount].trim() === '' && 
              (i + deleteCount + 1 >= lines.length || !lines[i + deleteCount + 1].trim().startsWith('- '))) {
            break;
          }
          deleteCount++;
        }
        lines.splice(i, deleteCount);
        found = true;
        console.log(`✅ 已完成并删除任务 #${taskNumber}: ${taskDescription}`);
        break;
      }
    }
  }
  
  if (!found) {
    console.error(`❌ 未找到任务 #${taskNumber}`);
  } else {
    writeTasksFile(lines.join('\n'));
  }
}

/**
 * 删除任务
 */
function deleteTask(taskNumber) {
  const content = readTasksFile();
  const lines = content.split('\n');
  
  let taskIndex = 0;
  let found = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('- [')) {
      taskIndex++;
      if (taskIndex === taskNumber) {
        const taskDesc = lines[i].replace(/^- \[[ x]\] /, '').trim();
        // 删除任务及其详细信息
        let deleteCount = 1;
        while (i + deleteCount < lines.length && 
               (lines[i + deleteCount].trim().startsWith('- ') || 
                lines[i + deleteCount].trim() === '')) {
          if (lines[i + deleteCount].trim() === '' && 
              (i + deleteCount + 1 >= lines.length || !lines[i + deleteCount + 1].trim().startsWith('- '))) {
            break;
          }
          deleteCount++;
        }
        lines.splice(i, deleteCount);
        found = true;
        console.log(`🗑️  已删除任务 #${taskNumber}: ${taskDesc}`);
        break;
      }
    }
  }
  
  if (!found) {
    console.error(`❌ 未找到任务 #${taskNumber}`);
  } else {
    writeTasksFile(lines.join('\n'));
  }
}

/**
 * 移动任务到不同优先级
 */
function moveTask(taskNumber, newPriority) {
  const content = readTasksFile();
  const lines = content.split('\n');
  const targetSection = PRIORITY_MAP[newPriority];
  
  if (!targetSection) {
    console.error('❌ 无效的优先级，请使用: high, medium, low');
    return;
  }
  
  let taskIndex = 0;
  let found = false;
  let taskContent = [];
  let taskStartIndex = -1;
  
  // 找到任务并提取内容
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('- [ ]') || lines[i].includes('- [x]')) {
      taskIndex++;
      if (taskIndex === taskNumber) {
        taskStartIndex = i;
        // 提取任务及其详细信息
        taskContent.push(lines[i]);
        let j = i + 1;
        while (j < lines.length && 
               (lines[j].trim().startsWith('- ') || lines[j].trim() === '')) {
          if (lines[j].trim() === '' && 
              (j + 1 >= lines.length || !lines[j + 1].trim().startsWith('- '))) {
            break;
          }
          taskContent.push(lines[j]);
          j++;
        }
        // 从原位置删除
        lines.splice(i, taskContent.length);
        found = true;
        break;
      }
    }
  }
  
  if (!found) {
    console.error(`❌ 未找到任务 #${taskNumber}`);
    return;
  }
  
  // 插入到目标区域
  const sectionIndex = lines.findIndex(line => line.includes(targetSection));
  if (sectionIndex !== -1) {
    let insertIndex = sectionIndex + 2;
    while (insertIndex < lines.length && !lines[insertIndex].includes('---')) {
      insertIndex++;
    }
    
    // 在目标位置插入
    lines.splice(insertIndex, 0, ...taskContent);
    writeTasksFile(lines.join('\n'));
    console.log(`🔄 已将任务 #${taskNumber} 移动到${newPriority === 'high' ? '🔴高' : newPriority === 'low' ? '🟢低' : '🟡中'}优先级`);
  } else {
    console.error('❌ 未找到目标优先级区域');
  }
}

/**
 * 显示帮助
 */
function showHelp() {
  console.log(`
📝 AI 任务管理工具 v2.0

用法：
  node task-manager.js <command> [options]

命令：
  add <description>     添加新任务
    --priority <level>  设置优先级 (high/medium/low)，默认 medium
    --files <files>     相关文件，多个文件用逗号分隔
    --note <note>       任务说明或注意事项
  
  list                  列出所有任务
  
  complete <number>     完成任务并自动删除
  
  delete <number>       删除任务
  
  move <number> <level> 移动任务到指定优先级
    level: high/medium/low
  
  stats                 显示任务统计信息
  
  help                  显示此帮助信息

示例：
  node task-manager.js add "优化登录页面" --priority high --files "src/Login.vue" --note "需要考虑移动端适配"
  node task-manager.js list
  node task-manager.js complete 1
  node task-manager.js move 2 low
  node task-manager.js stats
  `);
}

/**
 * 显示任务统计信息
 */
function showStats() {
  const content = readTasksFile();
  const lines = content.split('\n');
  
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let completedCount = 0;
  let currentSection = '';
  
  lines.forEach(line => {
    if (line.includes('🔴 高优先级')) {
      currentSection = 'high';
    } else if (line.includes('🟡 中优先级')) {
      currentSection = 'medium';
    } else if (line.includes('🟢 低优先级')) {
      currentSection = 'low';
    } else if (line.includes('✅ 已完成任务')) {
      currentSection = 'completed';
    }
    
    if (line.includes('- [ ]')) {
      if (currentSection === 'high') highCount++;
      else if (currentSection === 'medium') mediumCount++;
      else if (currentSection === 'low') lowCount++;
    } else if (line.includes('- [x]')) {
      completedCount++;
    }
  });
  
  const totalPending = highCount + mediumCount + lowCount;
  const totalAll = totalPending + completedCount;
  
  console.log('\n📊 任务统计信息\n');
  console.log(`🔴 高优先级: ${highCount} 个任务`);
  console.log(`🟡 中优先级: ${mediumCount} 个任务`);
  console.log(`🟢 低优先级: ${lowCount} 个任务`);
  console.log(`   ──────────────`);
  console.log(`⏳ 待完成:   ${totalPending} 个任务`);
  console.log(`✅ 已完成:   ${completedCount} 个任务`);
  console.log(`   ──────────────`);
  console.log(`📋 总计:     ${totalAll} 个任务\n`);
  
  // 完成率
  if (totalAll > 0) {
    const completionRate = ((completedCount / totalAll) * 100).toFixed(1);
    console.log(`📈 完成率: ${completionRate}%\n`);
  }
}

// 主逻辑
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'add':
    const description = args[1];
    
    // 解析选项
    const priorityFlag = args.indexOf('--priority');
    const filesFlag = args.indexOf('--files');
    const noteFlag = args.indexOf('--note');
    
    const priority = priorityFlag !== -1 ? args[priorityFlag + 1] : 'medium';
    const files = filesFlag !== -1 ? args[filesFlag + 1] : '';
    const note = noteFlag !== -1 ? args[noteFlag + 1] : '';
    
    if (!description) {
      console.error('❌ 请提供任务描述');
      process.exit(1);
    }
    
    addTask(description, { priority, files, note });
    break;
    
  case 'list':
    listTasks();
    break;
    
  case 'complete':
    const taskNum = parseInt(args[1]);
    if (!taskNum) {
      console.error('❌ 请提供任务编号');
      process.exit(1);
    }
    completeTask(taskNum);
    break;
    
  case 'delete':
    const delNum = parseInt(args[1]);
    if (!delNum) {
      console.error('❌ 请提供任务编号');
      process.exit(1);
    }
    deleteTask(delNum);
    break;
    
  case 'move':
    const moveNum = parseInt(args[1]);
    const newPriority = args[2];
    if (!moveNum || !newPriority) {
      console.error('❌ 请提供任务编号和目标优先级');
      console.error('   用法: node task-manager.js move <number> <high|medium|low>');
      process.exit(1);
    }
    moveTask(moveNum, newPriority);
    break;
    
  case 'stats':
    showStats();
    break;
    
  case 'help':
  default:
    showHelp();
}
