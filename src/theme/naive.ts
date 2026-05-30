/**
 * Naive UI 主题配置
 * 将现有主题系统映射到 Naive UI
 */

import type { GlobalThemeOverrides } from 'naive-ui';
import { getTheme } from '../theme';

/**
 * 生成 Naive UI 主题覆盖配置
 */
export function generateNaiveThemeOverrides(): GlobalThemeOverrides {
  const currentTheme = getTheme();

  return {
    common: {
      primaryColor: currentTheme.colors.primary.main,
      primaryColorHover: currentTheme.colors.primary.light,
      primaryColorPressed: currentTheme.colors.primary.dark,
      primaryColorSuppl: currentTheme.colors.primary.light,

      successColor: currentTheme.colors.success.main,
      successColorHover: currentTheme.colors.success.light,

      warningColor: currentTheme.colors.warning.main,
      warningColorHover: currentTheme.colors.warning.light,

      errorColor: currentTheme.colors.error.main,
      errorColorHover: currentTheme.colors.error.light,

      bodyColor: currentTheme.colors.background.primary,
      cardColor: currentTheme.colors.background.secondary,
      modalColor: currentTheme.colors.background.primary,
      popoverColor: currentTheme.colors.background.secondary,

      textColorBase: currentTheme.colors.text.primary,
      textColor1: currentTheme.colors.text.primary,
      textColor2: currentTheme.colors.text.secondary,
      textColor3: currentTheme.colors.text.tertiary,

      borderColor: currentTheme.colors.border,
      dividerColor: currentTheme.colors.border,

      borderRadius: currentTheme.borderRadius.md,
      borderRadiusSmall: currentTheme.borderRadius.sm,

      fontFamily: currentTheme.typography.fontFamily.sans,
      fontSize: currentTheme.typography.fontSize.base,
      fontSizeTiny: currentTheme.typography.fontSize.xs,
      fontSizeSmall: currentTheme.typography.fontSize.sm,
      fontSizeMedium: currentTheme.typography.fontSize.base,
      fontSizeLarge: currentTheme.typography.fontSize.lg,
      fontSizeHuge: currentTheme.typography.fontSize['2xl'],
    },

    Button: {
      borderRadius: currentTheme.borderRadius.md,
      borderRadiusSmall: currentTheme.borderRadius.sm,
      fontWeight: currentTheme.typography.fontWeight.medium,
    },

    Input: {
      borderRadius: currentTheme.borderRadius.md,
      fontSize: currentTheme.typography.fontSize.base,
    },

    Select: {
      borderRadius: currentTheme.borderRadius.md,
      fontSize: currentTheme.typography.fontSize.base,
    },

    Modal: {
      borderRadius: currentTheme.borderRadius.lg,
    },

    Dialog: {
      borderRadius: currentTheme.borderRadius.lg,
    },

    Slider: {
      railHeight: '6px',
      handleSize: '18px',
      railColor: '#e0e0e0',
      railColorHover: '#d0d0d0',
      fillColor: '#4a90e2',
      fillColorHover: '#357abd',
      handleColor: '#4a90e2',
      handleColorHover: '#357abd',
      handleBoxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      handleBoxShadowHover: '0 4px 8px rgba(0, 0, 0, 0.3)',
    },

    Message: {
      borderRadius: currentTheme.borderRadius.md,
    },
  };
}
