<template>
  <MainLayout />
</template>

<script setup lang="ts">
import { useMessage, useDialog, useNotification } from 'naive-ui';
import MainLayout from './MainLayout.vue';
import { initMessageAPI } from '../utils/message';

// 初始化全局消息 API（必须在 Provider 内部调用 useXxx）
const message = useMessage();
const dialog = useDialog();
const notification = useNotification();
initMessageAPI(message, dialog, notification);
</script>
