<template>
  <NModal
    :show="visible"
    preset="card"
    :title="title"
    style="width: 480px"
    :mask-closable="true"
    @update:show="$emit('update:visible', $event)"
  >
    <NForm ref="formRef" :model="formData">
      <NFormItem
        v-for="field in fields"
        :key="field.key"
        :label="field.label"
        :path="field.key"
        :rule="field.required ? { required: true, message: `请输入${field.label}` } : undefined"
      >
        <NInput
          v-if="field.type === 'textarea'"
          v-model:value="formData[field.key]"
          type="textarea"
          :placeholder="field.placeholder"
          :autosize="{ minRows: 3, maxRows: 8 }"
        />
        <NInput
          v-else
          v-model:value="formData[field.key]"
          :placeholder="field.placeholder"
          @keydown.enter="handleSubmit"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <NButton @click="$emit('update:visible', false)">取消</NButton>
        <NButton type="primary" @click="handleSubmit" :disabled="!isValid">确定</NButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NButton } from 'naive-ui';

interface Field {
  key: string;
  label: string;
  value: string;
  type?: 'text' | 'textarea';
  required?: boolean;
  placeholder?: string;
}

interface Props {
  visible: boolean;
  title: string;
  fields: Field[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'submit': [values: Record<string, string>];
}>();

const formRef = ref<InstanceType<typeof NForm>>();
const formData = ref<Record<string, string>>({});

// 当 fields 变化时，重置表单数据
watch(
  () => props.fields,
  (fields) => {
    const data: Record<string, string> = {};
    for (const field of fields) {
      data[field.key] = field.value;
    }
    formData.value = data;
  },
  { immediate: true, deep: true },
);

// 验证表单是否有效
const isValid = computed(() => {
  return props.fields.every((field) => {
    if (field.required) {
      return formData.value[field.key]?.trim();
    }
    return true;
  });
});

// 提交表单
async function handleSubmit() {
  if (!isValid.value) return;

  emit('submit', { ...formData.value });
}
</script>
