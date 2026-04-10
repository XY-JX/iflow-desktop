/**
 * 全局主题配置
 * 统一管理应用的颜色、间距、字体等设计令牌
 */

import { ref } from 'vue';

// 浅色主题
export const lightTheme = {
  // 主色调
  colors: {
    primary: {
      main: '#667eea',
      light: '#7c8ff0',
      dark: '#5a6fd6',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    success: {
      main: '#52c41a',
      light: '#73d13d',
      bg: '#f6ffed',
      border: '#b7eb8f',
    },
    warning: {
      main: '#fa8c16',
      light: '#ffc53d',
      bg: '#fff7e6',
      border: '#ffd591',
    },
    error: {
      main: '#ff4d4f',
      light: '#ff7875',
      bg: '#fff1f0',
      border: '#ffccc7',
    },
    neutral: {
      white: '#ffffff',
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#f0f0f0',
      gray300: '#d9d9d9',
      gray400: '#bfbfbf',
      gray500: '#8c8c8c',
      gray600: '#595959',
      gray700: '#434343',
      gray800: '#262626',
      gray900: '#141414',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#fafafa',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
      tertiary: '#999999',
    },
    border: '#e8e8e8',
  },

  // 间距系统
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },

  // 圆角
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },

  // 阴影
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 8px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.12)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.15)',
  },

  // 字体
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"Courier New", Consolas, Monaco, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // 过渡动画
  transitions: {
    fast: 'all 0.15s ease',
    base: 'all 0.2s ease',
    slow: 'all 0.3s ease',
  },

  // Z-index 层级
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 9999,
    modal: 10000,
    popover: 10100,
    tooltip: 10200,
  },
} as const;

// 深色主题
export const darkTheme = {
  colors: {
    primary: {
      main: '#7c8ff0',
      light: '#9aa8f5',
      dark: '#667eea',
      gradient: 'linear-gradient(135deg, #7c8ff0 0%, #8b5cf6 100%)',
    },
    success: {
      main: '#73d13d',
      light: '#95de64',
      bg: '#1f2e1a',
      border: '#274916',
    },
    warning: {
      main: '#ffc53d',
      light: '#ffd666',
      bg: '#2b2111',
      border: '#614700',
    },
    error: {
      main: '#ff7875',
      light: '#ff9c8f',
      bg: '#2a1215',
      border: '#5c0011',
    },
    neutral: {
      white: '#1a1a1a',
      gray50: '#1f1f1f',
      gray100: '#242424',
      gray200: '#2a2a2a',
      gray300: '#333333',
      gray400: '#404040',
      gray500: '#595959',
      gray600: '#8c8c8c',
      gray700: '#bfbfbf',
      gray800: '#d9d9d9',
      gray900: '#f0f0f0',
    },
    background: {
      primary: '#1a1a1a',
      secondary: '#242424',
      tertiary: '#2a2a2a',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#b0b0b0',
      tertiary: '#808080',
    },
    border: '#333333',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
    md: '0 4px 8px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.4)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  typography: lightTheme.typography,
  transitions: lightTheme.transitions,
  zIndex: lightTheme.zIndex,
} as const;

// 当前主题类型
export type ThemeType = 'light' | 'dark';

// 当前主题状态
export const currentTheme = ref<ThemeType>('light');

// 获取当前主题配置
export function getTheme() {
  return currentTheme.value === 'dark' ? darkTheme : lightTheme;
}

// 切换主题
export function toggleTheme() {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
  applyTheme();
}

// 应用主题到 DOM
export function applyTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme.value);
  localStorage.setItem('app_theme', currentTheme.value);
}

// 初始化主题
export function initTheme() {
  const savedTheme = localStorage.getItem('app_theme') as ThemeType;
  if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
    currentTheme.value = savedTheme;
  } else {
    // 检测系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme.value = prefersDark ? 'dark' : 'light';
  }
  applyTheme();
}

// 导出默认主题（兼容旧代码）
export const theme = lightTheme;

// 导出常用颜色的便捷访问
export const color = theme.colors;
export const spacing = theme.spacing;
export const radius = theme.borderRadius;
export const shadow = theme.shadows;
export const font = theme.typography;
export const transition = theme.transitions;
export const z = theme.zIndex;
