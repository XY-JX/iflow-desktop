<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMessage, useDialog, useNotification } from 'naive-ui';
import MainLayout from './MainLayout.vue';
import SplashScreen from './SplashScreen.vue';
import { initTheme } from '../theme';
import { initMessageAPI } from '../utils/message';

const splashRef = ref<InstanceType<typeof SplashScreen> | null>(null);

onMounted(() => {
  // 初始化主题
  initTheme();
  
  // 获取 Naive UI API 实例（此时已在 Provider 内部）
  const message = useMessage();
  const dialog = useDialog();
  const notification = useNotification();
  
  // 初始化全局消息 API
  initMessageAPI(message, dialog, notification);
  
  // 隐藏启动屏
  setTimeout(() => {
    splashRef.value?.hide();
  }, 500);
});
</script>

<template>
  <SplashScreen ref="splashRef" />
  <MainLayout />
</template>
