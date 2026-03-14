<script setup lang="ts">
import MainLayout from './components/MainLayout.vue';
</script>

<template>
  <MainLayout />
</template>

<style>
:root {
  /* 浅色主题 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f0f0f0;
  --bg-hover: #f0f0f0;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --primary-color: #4a90e2;
  --primary-hover: #357abd;
  --primary-light: #e8f4ff;
  --secondary-color: #6c5ce7;

  /* 思考过程颜色 */
  --thinking-bg: #fff7e6;
  --thinking-border: #ffd591;
  --thinking-header-bg: #fffbe6;
  --thinking-hover-bg: #fff5cc;
  --thinking-text: #d46b08;

  /* 执行信息颜色 */
  --info-bg: #f0f9ff;
  --info-border: #bae7ff;
  --info-text: #096dd9;

  /* 字体 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* 深色主题 */
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --bg-tertiary: #1f1f1f;
    --bg-hover: #3d3d3d;
    --text-primary: #f0f0f0;
    --text-secondary: #aaaaaa;
    --border-color: #404040;
    --primary-color: #4a90e2;
    --primary-hover: #5aa0f2;
    --primary-light: #1a4d7a;
    --primary-dark: #1a4d7a;
    --secondary-color: #7c6ce8;

    /* 思考过程颜色 */
    --thinking-bg-dark: #2a2620;
    --thinking-border-dark: #4a4539;
    --thinking-header-bg-dark: #2a2a20;
    --thinking-hover-bg-dark: #3a3a30;
    --thinking-text-dark: #d4b896;

    /* 执行信息颜色 */
    --info-bg-dark: #1a2630;
    --info-border-dark: #2a4050;
    --info-text-dark: #5aa9ff;
  }
}

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

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>