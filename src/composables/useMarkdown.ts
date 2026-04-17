/**
 * Markdown 渲染 Composable
 * 提供统一的 Markdown 解析功能
 */

import MarkdownIt from 'markdown-it';

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
