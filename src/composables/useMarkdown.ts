/**
 * Markdown 渲染 Composable
 * 提供统一的 Markdown 解析功能
 */

import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

let md: MarkdownIt | null = null;

/**
 * 获取 Markdown 渲染器实例(单例)
 */
function getMarkdownInstance(): MarkdownIt {
  if (!md) {
    md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true,
    });

    // 自定义代码块渲染,添加语言标签和复制按钮
    md.renderer.rules.fence = function(tokens, idx, _options, _env, _self) {
      const token = tokens[idx];
      const lang = token.info.trim();
      const code = token.content;
      
      // 语法高亮
      let highlightedCode = code;
      if (lang && hljs.getLanguage(lang)) {
        try {
          highlightedCode = hljs.highlight(code, { language: lang }).value;
        } catch (e) {
          console.warn(`语法高亮失败: ${lang}`);
        }
      }
      
      // 转义 HTML 特殊字符(如果没做高亮)
      if (highlightedCode === code) {
        highlightedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }
      
      return `<div class="code-block" data-lang="${lang || 'text'}">
        <div class="code-header">
          <span class="code-lang">${lang || 'text'}</span>
          <button class="code-copy-btn" onclick="copyCode(this)" title="复制代码">
            📋 复制
          </button>
        </div>
        <pre class="code-content"><code class="language-${lang}">${highlightedCode}</code></pre>
      </div>`;
    };
  }
  return md;
}

/**
 * Markdown 渲染 Composable
 */
export function useMarkdown() {
  const instance = getMarkdownInstance();

  /**
   * 渲染 Markdown 内容为 HTML
   * @param content Markdown 字符串
   * @returns HTML 字符串
   */
  const renderMarkdown = (content: string): string => {
    return instance.render(content);
  };

  return {
    renderMarkdown,
  };
}
