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