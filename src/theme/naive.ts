/**
 * Naive UI 主题配置
 * 将现有主题系统映射到 Naive UI
 */

import { darkTheme, lightTheme } from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';
import { getTheme } from '../theme';

/**
 * 生成 Naive UI 主题覆盖配置
 */
export function generateNaiveThemeOverrides(): GlobalThemeOverrides {
  const currentTheme = getTheme();
  
  return {
    common: {
      // 主色调
      primaryColor: currentTheme.colors.primary.main,
      primaryColorHover: currentTheme.colors.primary.light,
      primaryColorPressed: currentTheme.colors.primary.dark,
      primaryColorSuppl: currentTheme.colors.primary.light,
      
      // 成功色
      successColor: currentTheme.colors.success.main,
      successColorHover: currentTheme.colors.success.light,
      
      // 警告色
      warningColor: currentTheme.colors.warning.main,
      warningColorHover: currentTheme.colors.warning.light,
      
      // 错误色
      errorColor: currentTheme.colors.error.main,
      errorColorHover: currentTheme.colors.error.light,
      
      // 背景色
      bodyColor: currentTheme.colors.background.primary,
      cardColor: currentTheme.colors.background.secondary,
      modalColor: currentTheme.colors.background.primary,
      popoverColor: currentTheme.colors.background.secondary,
      
      // 文本颜色
      textColorBase: currentTheme.colors.text.primary,
      textColor1: currentTheme.colors.text.primary,
      textColor2: currentTheme.colors.text.secondary,
      textColor3: currentTheme.colors.text.tertiary,
      
      // 边框颜色
      borderColor: currentTheme.colors.border,
      dividerColor: currentTheme.colors.border,
      
      // 圆角
      borderRadius: currentTheme.borderRadius.md,
      borderRadiusSmall: currentTheme.borderRadius.sm,
      
      // 字体
      fontFamily: currentTheme.typography.fontFamily.sans,
      fontSize: currentTheme.typography.fontSize.base,
      fontSizeTiny: currentTheme.typography.fontSize.xs,
      fontSizeSmall: currentTheme.typography.fontSize.sm,
      fontSizeMedium: currentTheme.typography.fontSize.base,
      fontSizeLarge: currentTheme.typography.fontSize.lg,
      fontSizeHuge: currentTheme.typography.fontSize['2xl'],
    },
    
    // Button 组件定制
    Button: {
      borderRadius: currentTheme.borderRadius.md,
      borderRadiusSmall: currentTheme.borderRadius.sm,
      fontWeight: currentTheme.typography.fontWeight.medium,
    },
    
    // Input 组件定制
    Input: {
      borderRadius: currentTheme.borderRadius.md,
      fontSize: currentTheme.typography.fontSize.base,
    },
    
    // Select 组件定制
    Select: {
      borderRadius: currentTheme.borderRadius.md,
      fontSize: currentTheme.typography.fontSize.base,
    },
    
    // Modal 组件定制
    Modal: {
      borderRadius: currentTheme.borderRadius.lg,
    },
    
    // Dialog 组件定制
    Dialog: {
      borderRadius: currentTheme.borderRadius.lg,
    },
    
    // Slider 组件定制
    Slider: {
      railHeight: '4px',
      handleSize: '16px',
    },
    
    // Message 组件定制
    Message: {
      borderRadius: currentTheme.borderRadius.md,
    },
  };
}

/**
 * 获取完整的 Naive UI 主题配置
 */
export function getNaiveUITheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const baseTheme = isDark ? darkTheme : lightTheme;
  const overrides = generateNaiveThemeOverrides();
  
  return {
    ...baseTheme,
    common: {
      ...baseTheme.common,
      ...overrides.common,
    },
  };
}
