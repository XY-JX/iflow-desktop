import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useIflowStore = defineStore('iflow', () => {
  // 状态
  const iflowRunning = ref(false);
  const iflowStatus = ref<string>('');

  // 方法
  function setRunning(running: boolean) {
    iflowRunning.value = running;
  }

  function setStatus(status: string) {
    iflowStatus.value = status;
  }

  function clearStatus() {
    iflowStatus.value = '';
  }

  return {
    // 状态
    iflowRunning,
    iflowStatus,
    // 方法
    setRunning,
    setStatus,
    clearStatus,
  };
});
