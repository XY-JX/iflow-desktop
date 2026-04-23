/**
 * Markdown 渲染 Composable
 * 提供统一的 Markdown 解析功能
 */

import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/atom-one-dark.css';
import { warn } from '../utils/logger';

// 选择性导入常用语言（避免全量导入 ~1MB）
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import java from 'highlight.js/lib/languages/java';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';

// 注册语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('java', java);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);

let md: MarkdownIt | null = null;

/**
 * 获取 Markdown 渲染器实例(单例)
 */
function getMarkdownInstance(): MarkdownIt {
  if (!md) {
    md = new MarkdownIt({
      html: false, // 禁止原始 HTML 渲染，防止 XSS
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
        } catch (_e) {
          warn('Markdown', `语法高亮失败: ${lang}`);
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
          <button class="code-copy-btn" data-copy-btn title="复制代码">
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
 * 设置代码复制按钮的事件委托
 * 在消息容器上监听点击事件，避免全局函数污染
 */
export function setupCodeCopyDelegation(container: HTMLElement): void {
  container.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const btn = target.closest('[data-copy-btn]') as HTMLButtonElement | null;
    if (!btn) return;

    const codeBlock = btn.closest('.code-block');
    if (!codeBlock) return;

    const codeContent = codeBlock.querySelector('.code-content code');
    if (!codeContent) return;

    const code = codeContent.textContent || '';

    navigator.clipboard.writeText(code).then(() => {
      const originalText = btn.textContent;
      btn.textContent = '✅ 已复制';
      btn.classList.add('copied');

      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      warn('Markdown', '复制失败');
    });
  });
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
