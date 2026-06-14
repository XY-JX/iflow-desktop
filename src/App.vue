<template>
  <NMessageProvider>
    <NDialogProvider>
      <NNotificationProvider>
        <MainLayout />
      </NNotificationProvider>
    </NDialogProvider>
  </NMessageProvider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { NMessageProvider, NDialogProvider, NNotificationProvider, useMessage, useDialog, useNotification } from 'naive-ui';
import MainLayout from './components/MainLayout.vue';
import { initMessageAPI } from './utils/message';

onMounted(() => {
  // 初始化全局消息 API（需要在 Provider 内部调用 useXxx）
  const message = useMessage();
  const dialog = useDialog();
  const notification = useNotification();
  initMessageAPI(message, dialog, notification);
});
</script>

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
</style>
