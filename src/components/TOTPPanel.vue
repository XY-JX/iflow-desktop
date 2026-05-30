<template>
  <div class="totp-panel">
    <!-- 头部 -->
    <div class="totp-header">
      <n-text strong>🔐 谷歌验证码</n-text>
      <n-button @click="openAddDialog" circle size="small" type="primary" title="添加新密钥">+</n-button>
    </div>

    <!-- 验证码列表 -->
    <div class="totp-list">
      <n-empty v-if="codes.length === 0" description="暂无验证码">
        <template #icon>
          <span style="font-size: 48px">🔑</span>
        </template>
        <template #extra>
          <n-text depth="3" style="font-size: 12px">点击右上角 + 添加</n-text>
        </template>
      </n-empty>

      <n-card v-for="code in codes" :key="code.id" size="small" hoverable style="margin-bottom: 12px;">
        <n-space justify="space-between" align="center">
          <n-text strong>{{ code.name }}</n-text>
          <n-space :size="4">
            <n-button @click="copyCode(code.code)" quaternary circle size="tiny" title="复制">📋</n-button>
            <n-button @click="handleDelete(code.id)" quaternary circle size="tiny" type="error" title="删除">×</n-button>
          </n-space>
        </n-space>
        <n-text class="totp-code" @click="copyCode(code.code)">
          {{ code.code }}
        </n-text>
        <n-space align="center" :size="8">
          <n-progress
            type="line"
            :percentage="(code.timeLeft / 30 * 100)"
            :height="4"
            :show-indicator="false"
            :color="code.timeLeft <= 5 ? 'var(--n-error-color)' : 'var(--n-primary-color)'"
            :rail-color="'var(--n-border-color)'"
            style="flex: 1;"
          />
          <n-text depth="3" style="font-size: 12px; font-family: monospace; min-width: 35px; text-align: right;">
            {{ code.timeLeft }}s
          </n-text>
        </n-space>
      </n-card>
    </div>

    <!-- 添加密钥对话框 -->
    <n-modal v-model:show="showAddDialog" preset="card" title="添加验证码" style="max-width: 450px;">
      <n-form label-placement="left" label-width="100" require-mark-placement="right-hanging">
        <n-form-item label="名称" required>
          <n-input v-model:value="newSecret.name" placeholder="例如: GitHub" clearable />
        </n-form-item>
        <n-form-item label="密钥 (Base32)" required>
          <n-input-group>
            <n-input v-model:value="newSecret.secret" placeholder="输入或生成密钥" clearable />
            <n-button @click="generateNewSecret" type="primary" title="生成随机密钥">🎲</n-button>
          </n-input-group>
        </n-form-item>
      </n-form>

      <n-alert v-if="qrCodeDataUrl" type="info" title="扫描二维码:" style="margin-top: 16px;">
        <div style="text-align: center; margin-top: 12px;">
          <img :src="qrCodeDataUrl" alt="QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
        </div>
      </n-alert>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddDialog = false">取消</n-button>
          <n-button @click="handleAdd" type="primary" :disabled="!isValid">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  NSpace, NText, NButton, NCard, NEmpty, NModal,
  NForm, NFormItem, NInput, NInputGroup, NAlert, NProgress,
} from 'naive-ui';
import QRCode from 'qrcode';
import { getAllCodes, addSecret, deleteSecret, generateSecret } from '../utils/totp';
import { showConfirm, showSuccess, showError } from '../utils/message';
import { info as logInfo, warn } from '../utils/logger';
import type { TOTPCode } from '../utils/totp';

const codes = ref<TOTPCode[]>([]);
const showAddDialog = ref(false);
const newSecret = ref({ name: '', secret: '' });
const qrCodeDataUrl = ref('');
let timer: number | null = null;

// 本地生成二维码
async function generateQrCode() {
  if (!newSecret.value.name || !newSecret.value.secret) {
    qrCodeDataUrl.value = '';
    return;
  }
  try {
    const issuer = encodeURIComponent('iFlow Desktop');
    const label = encodeURIComponent(newSecret.value.name);
    const otpauthUrl = `otpauth://totp/${issuer}:${label}?secret=${newSecret.value.secret}&issuer=${issuer}`;
    qrCodeDataUrl.value = await QRCode.toDataURL(otpauthUrl, { width: 200, margin: 2 });
  } catch (e) {
    warn('TOTPPanel', '生成二维码失败:', e);
    qrCodeDataUrl.value = '';
  }
}

watch(() => [newSecret.value.name, newSecret.value.secret], () => {
  generateQrCode();
});

const isValid = computed(() => {
  return newSecret.value.name.trim() && newSecret.value.secret.trim();
});

async function updateCodes() {
  try {
    const result = await getAllCodes();
    logInfo('TOTPPanel', `加载了 ${result.length} 个验证码`);
    codes.value = result;
  } catch (e) {
    warn('TOTPPanel', '更新验证码失败:', e);
  }
}

function generateNewSecret() {
  newSecret.value.secret = generateSecret();
}

function openAddDialog() {
  newSecret.value = { name: '', secret: '' };
  qrCodeDataUrl.value = '';
  showAddDialog.value = true;
}

async function handleAdd() {
  if (!isValid.value) return;
  try {
    const name = newSecret.value.name.trim();
    const secret = newSecret.value.secret.trim();
    logInfo('TOTPPanel', `添加验证码: name=${name}, secret=${secret.substring(0, 4)}...`);
    await addSecret(name, secret);
    showAddDialog.value = false;
    await updateCodes();
    showSuccess('验证码已添加');
  } catch (e) {
    logInfo('TOTPPanel', `添加失败: ${e}`);
    showError('添加验证码失败：' + e);
  }
}

async function handleDelete(id: string) {
  showConfirm('确认删除', '确定要删除这个验证码吗?', async () => {
    try {
      await deleteSecret(id);
      await updateCodes();
    } catch (e) {
      showError('删除失败：' + e);
    }
  });
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code).then(() => {
    showSuccess('已复制到剪贴板');
  }).catch(() => {
    warn('TOTPPanel', '复制失败');
  });
}

onMounted(() => {
  updateCodes();
  timer = window.setInterval(updateCodes, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.totp-panel {
  display: flex;
  flex-direction: column;
  /* 不设 height: 100%，作为 flex 子项直接 flex: 1 撑满 */
}

.totp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

.totp-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 0;
}

.totp-code {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  display: block;
  user-select: all;
  cursor: pointer;
  margin: 12px 0;
  letter-spacing: 4px;
}
</style>
