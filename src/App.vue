<script setup lang="ts">
  import { computed } from 'vue';
  import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, darkTheme } from 'naive-ui';
  import AppContent from './components/AppContent.vue';
  import { generateNaiveThemeOverrides } from './theme/naive';
  import { currentTheme } from './theme';
  
  // 响应式主题配置
  const naiveThemeOverrides = computed(() => generateNaiveThemeOverrides());
  
  // Naive UI 基础主题
  const naiveBaseTheme = computed(() => currentTheme.value === 'dark' ? darkTheme : null);
</script>

<template>
  <NConfigProvider :theme="naiveBaseTheme" :theme-overrides="naiveThemeOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <AppContent />
        </NNotificationProvider>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  #app {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  body {
    margin: 0;
    padding: 0;
  }

  /* 滚动条样式 - 使用 Naive UI 主题变量 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--n-scrollbar-color);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--n-scrollbar-color-hover);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--n-scrollbar-color-pressed);
  }
</style>
