<template>
  <div class="model-selector">
    <label for="model-select">模型</label>
    <select
      id="model-select"
      :value="selectedModel"
      @change="$emit('model-change', ($event.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>选择模型</option>
      <option v-for="model in models" :key="model.id" :value="model.id">
        {{ model.name }} ({{ model.provider }})
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
  import type { Model } from '../types';

  defineProps<{
    models: Model[];
    selectedModel: string;
  }>();

  defineEmits<{
    'model-change': [modelId: string];
  }>();
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
  }

  .model-selector select {
    padding: 8px 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-size: 14px;
    background: var(--bg-primary, white);
    color: var(--text-primary, #333);
    cursor: pointer;
    transition: all 0.2s;
  }

  .model-selector select:hover {
    border-color: var(--primary-color, #4a90e2);
  }

  .model-selector select:focus {
    outline: none;
    border-color: var(--primary-color, #4a90e2);
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }

  @media (prefers-color-scheme: dark) {
    .model-selector label {
      color: var(--text-primary, #f0f0f0);
    }

    .model-selector select {
      background: var(--bg-primary, #252525);
      color: var(--text-primary, #f0f0f0);
      border-color: var(--border-color, #404040);
    }

    .model-selector select:hover {
      border-color: var(--primary-color, #4a90e2);
    }
  }
</style>
