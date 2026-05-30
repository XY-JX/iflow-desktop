<template>
  <NModal
    :show="visible"
    preset="card"
    title="快捷键列表"
    style="width: 400px"
    :mask-closable="true"
    @update:show="$emit('update:visible', $event)"
  >
    <NList bordered>
      <NListItem v-for="item in shortcuts" :key="item.keys">
        <template #prefix>
          <NSpace :size="4">
            <NTag v-for="key in item.keys.split(' + ')" :key="key" size="small" round>{{ key }}</NTag>
          </NSpace>
        </template>
        <NText depth="2">{{ item.description }}</NText>
      </NListItem>
    </NList>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="$emit('update:visible', false)">关闭</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { NModal, NButton, NList, NListItem, NTag, NSpace, NText } from 'naive-ui';

defineProps<{
  visible: boolean;
}>();

defineEmits<{
  'update:visible': [value: boolean];
}>();

const shortcuts = [
  { keys: 'Enter', description: '发送消息' },
  { keys: 'Shift + Enter', description: '换行' },
  { keys: 'Ctrl + N', description: '新建对话' },
  { keys: 'Ctrl + K', description: '清空当前对话' },
  { keys: 'Ctrl + /', description: '显示快捷键帮助' },
  { keys: 'Escape', description: '关闭对话框/面板' },
];
</script>
