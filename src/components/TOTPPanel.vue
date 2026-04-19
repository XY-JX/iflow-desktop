<template>
  <div class="totp-panel">
    <div class="panel-header">
      <span class="panel-title">🔐 谷歌验证码</span>
      <n-button @click="showAddDialog = true" circle size="small" type="primary" title="添加新密钥">
        +
      </n-button>
    </div>

    <div class="codes-container">
      <n-empty v-if="codes.length === 0" description="暂无验证码">
        <template #icon>
          <span style="font-size: 48px">🔑</span>
        </template>
        <template #extra>
          <n-text depth="3" style="font-size: 12px">点击右上角 + 添加</n-text>
        </template>
      </n-empty>

      <n-card v-for="code in codes" :key="code.id" class="code-item" size="small">
        <div class="code-info">
          <div class="code-name">{{ code.name }}</div>
          <div class="code-value">{{ code.code }}</div>
          <div class="code-timer">
            <n-progress
              type="line"
              :percentage="(code.timeLeft / 30 * 100)"
              :height="4"
              :show-indicator="false"
              :color="code.timeLeft <= 5 ? 'var(--n-error-color)' : 'var(--n-primary-color)'"
              :rail-color="'var(--n-border-color)'"
            />
            <span class="timer-text">{{ code.timeLeft }}s</span>
          </div>
        </div>
        <n-button @click="handleDelete(code.id)" quaternary circle size="small" type="error" title="删除">
          ×
        </n-button>
      </n-card>
    </div>

    <!-- 添加密钥对话框 -->
    <n-modal v-model:show="showAddDialog" preset="card" title="添加验证码" style="max-width: 450px;">
      <n-form label-placement="left" label-width="100" require-mark-placement="right-hanging">
        <n-form-item label="名称" required>
          <n-input 
            v-model:value="newSecret.name" 
            placeholder="例如: GitHub"
            clearable
          />
        </n-form-item>

        <n-form-item label="密钥 (Base32)" required>
          <n-input-group>
            <n-input 
              v-model:value="newSecret.secret" 
              placeholder="输入或生成密钥"
              clearable
            />
            <n-button @click="generateNewSecret" type="primary" title="生成随机密钥">
              🎲
            </n-button>
          </n-input-group>
        </n-form-item>
      </n-form>

      <n-alert v-if="qrCodeUrl" type="info" title="扫描二维码:" style="margin-top: 16px;">
        <div style="text-align: center; margin-top: 12px;">
          <img :src="qrCodeUrl" alt="QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
        </div>
      </n-alert>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <n-button @click="closeDialog">取消</n-button>
          <n-button @click="handleAdd" type="primary" :disabled="!isValid">确认</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { NButton, NCard, NEmpty, NModal, NForm, NFormItem, NInput, NInputGroup, NAlert, NProgress, NText } from 'naive-ui';
import { getAllCodes, addSecret, deleteSecret, generateSecret } from '../utils/totp';
import { useDialog } from '../composables';
import { showConfirm } from '../utils/message';
import type { TOTPCode } from '../utils/totp';

const codes = ref<TOTPCode[]>([]);
const { show: showAddDialog, close: closeDialog } = useDialog();
const newSecret = ref({ name: '', secret: '' });
let timer: number | null = null;

// QR Code URL (使用Google Charts API生成)
const qrCodeUrl = computed(() => {
  if (!newSecret.value.name || !newSecret.value.secret) return '';
  
  const issuer = encodeURIComponent('iFlow Desktop');
  const label = encodeURIComponent(newSecret.value.name);
  const secret = newSecret.value.secret;
  
  return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`;
});

// 验证表单
const isValid = computed(() => {
  return newSecret.value.name.trim() && newSecret.value.secret.trim();
});

// 更新验证码
async function updateCodes() {
  codes.value = await getAllCodes();
}

// 生成新密钥
function generateNewSecret() {
  newSecret.value.secret = generateSecret();
}

// 添加密钥
async function handleAdd() {
  if (!isValid.value) return;
  
  await addSecret(newSecret.value.name.trim(), newSecret.value.secret.trim());
  await updateCodes();
  closeDialog();
  newSecret.value = { name: '', secret: '' };
}

// 删除密钥
async function handleDelete(id: string) {
  showConfirm('确认删除', '确定要删除这个验证码吗?', async () => {
    await deleteSecret(id);
    await updateCodes();
  });
}

// 启动定时器
onMounted(() => {
  updateCodes();
  // 每秒更新一次
  timer = window.setInterval(updateCodes, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.totp-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.codes-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 0;
}

.code-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.code-info {
  flex: 1;
}

.code-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.code-value {
  font-size: 20px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  margin-bottom: 8px;
  color: var(--n-primary-color);
}

.code-timer {
  position: relative;
  height: 4px;
}

.timer-text {
  position: absolute;
  right: 0;
  top: -18px;
  font-size: 11px;
  color: var(--n-text-color-3);
}
</style>
