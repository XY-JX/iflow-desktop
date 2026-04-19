/**
 * 对话导出 Composable
 * 处理对话记录的导出功能(Markdown、PDF、复制)
 */

import { computed } from 'vue';
import { showSuccess, showWarning } from '../utils/message';
import type { Conversation, Message } from '../types';

export function useConversationExport(
  conversations: Conversation[],
  activeConversationId: string | undefined,
  currentMessages: Message[]
) {
  // 计算属性：当前对话消息数
  const currentMessageCount = computed(() => {
    return currentMessages.length;
  });

  // 估算 Token 数
  const estimatedTokens = computed(() => {
    if (currentMessages.length === 0) return 0;

    let totalTokens = 0;
    for (const msg of currentMessages) {
      // 简单估算：中文字符 ~1.5 token, 英文单词 ~0.75 token
      const chineseChars = (msg.content.match(/[\u4e00-\u9fa5]/g) || []).length;
      const englishWords = msg.content.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).length;
      totalTokens += Math.ceil(chineseChars * 1.5 + englishWords * 0.75);
    }

    return totalTokens;
  });

  // 导出对话记录为 Markdown
  function exportAsMarkdown() {
    if (currentMessages.length === 0) {
      showWarning('当前对话没有消息可导出');
      return;
    }

    const conversation = conversations.find((c) => c.id === activeConversationId);
    if (!conversation) return;

    // 生成 Markdown 格式
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**导出时间**: ${new Date().toLocaleString()}\n`;
    markdown += `**模型**: ${conversation.model}

---

`;

    conversation.messages.forEach((msg) => {
      const role = msg.role === 'user' ? '👤 用户' : '🤖 助手';
      const time = new Date(msg.timestamp).toLocaleString();
      markdown += `### ${role} (${time})

${msg.content}

---

`;
    });

    // 创建下载链接
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('对话已导出为 Markdown 文件');
  }

  // 导出对话为 PDF（通过打印功能）
  function exportAsPDF() {
    if (currentMessages.length === 0) {
      showWarning('当前对话没有消息可导出');
      return;
    }

    const conversation = conversations.find((c) => c.id === activeConversationId);
    if (!conversation) return;

    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showWarning('无法打开打印窗口，请检查浏览器设置');
      return;
    }

    // 生成 HTML 内容
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${conversation.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
    .user { background: #f0f0f0; }
    .assistant { background: #fafafa; border-left: 4px solid #667eea; }
    .role { font-weight: bold; margin-bottom: 8px; }
    .time { color: #999; font-size: 12px; }
    .content { line-height: 1.6; white-space: pre-wrap; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${conversation.title}</h1>
  <div class="meta">
    <p><strong>导出时间:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>模型:</strong> ${conversation.model}</p>
    <p><strong>消息数:</strong> ${conversation.messages.length}</p>
  </div>
  <hr>
`;

    conversation.messages.forEach((msg) => {
      const role = msg.role === 'user' ? '👤 用户' : '🤖 助手';
      const time = new Date(msg.timestamp).toLocaleString();
      const className = msg.role === 'user' ? 'user' : 'assistant';
      
      html += `
  <div class="message ${className}">
    <div class="role">${role} <span class="time">(${time})</span></div>
    <div class="content">${escapeHtml(msg.content)}</div>
  </div>
`;
    });

    html += `
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // 延迟打印以确保内容加载
    setTimeout(() => {
      printWindow.print();
    }, 250);

    showSuccess('正在打开打印对话框...');
  }

  // 复制最后一条助手回答
  function copyLastAnswer() {
    if (currentMessages.length === 0) {
      showWarning('当前对话没有消息');
      return;
    }

    // 从后往前找第一条助手消息
    const lastAssistantMsg = [...currentMessages].reverse().find((msg) => msg.role === 'assistant');
    
    if (!lastAssistantMsg) {
      showWarning('没有找到助手的回答');
      return;
    }

    navigator.clipboard
      .writeText(lastAssistantMsg.content)
      .then(() => {
        showSuccess('✅ 已复制到最后一条回答');
      })
      .catch(() => {
        showWarning('复制失败，请手动复制');
      });
  }

  // HTML 转义
  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return {
    // 计算属性
    currentMessageCount,
    estimatedTokens,
    // 方法
    exportAsMarkdown,
    exportAsPDF,
    copyLastAnswer,
  };
}
