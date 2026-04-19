<template>
  <div class="model-selector">
    <label>模型</label>
    <n-select
      :value="selectedModel"
      :options="modelOptions"
      @update:value="$emit('model-change', $event)"
      placeholder="选择模型"
      :menu-props="{ style: { minWidth: '200px' } }"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { NSelect } from 'naive-ui';
  import type { Model } from '../types';

  const props = defineProps<{
    models: Model[];
    selectedModel: string;
  }>();

  defineEmits<{
    'model-change': [modelId: string];
  }>();

  // 转换为 Naive UI 需要的 options 格式
  const modelOptions = computed(() => {
    return props.models.map(model => ({
      label: `${model.name} (${model.provider})`,
      value: model.id
    }));
  });
</script>

<style scoped>
  .model-selector {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .model-selector label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary, #333);
    white-space: nowrap;
  }
</style>
