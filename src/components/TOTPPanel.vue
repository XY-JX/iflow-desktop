<template>
  <NLayout style="height: 100%;">
    <!-- 头部 -->
    <NLayoutHeader bordered style="padding: 12px 16px;">
      <NSpace justify="space-between" align="center">
        <NText strong>🔐 谷歌验证码</NText>
        <NButton @click="openAddDialog" circle size="small" type="primary" title="添加新密钥">+</NButton>
      </NSpace>
    </NLayoutHeader>

    <!-- 验证码列表 -->
    <NLayoutContent style="padding: 12px;">
      <NEmpty v-if="codes.length === 0" description="暂无验证码">
        <template #icon>
          <span style="font-size: 48px">🔑</span>
        </template>
        <template #extra>
          <NText depth="3" style="font-size: 12px">点击右上角 + 添加</NText>
        </template>
      </NEmpty>

      <NCard v-for="code in codes" :key="code.id" size="small" hoverable style="margin-bottom: 12px;">
        <NSpace justify="space-between" align="center">
          <NText strong>{{ code.name }}</NText>
          <NSpace :size="4">
            <NButton @click="copyCode(code.code)" quaternary circle size="tiny" title="复制">📋</NButton>
            <NButton @click="handleDelete(code.id)" quaternary circle size="tiny" type="error" title="删除">×</NButton>
          </NSpace>
        </NSpace>
        <NText
          style="font-size: 28px; font-weight: 700; text-align: center; display: block; user-select: all; cursor: pointer; margin: 12px 0; letter-spacing: 4px;"
          @click="copyCode(code.code)"
        >
          {{ code.code }}
        </NText>
        <NProgress
          type="line"
          :percentage="(code.timeLeft / 30 * 100)"
          :height="8"
          :show-indicator="false"
          :color="getProgressColor(code.timeLeft)"
          :rail-color="'var(--n-border-color)'"
          :border-radius="4"
        />
        <NSpace justify="center" align="center" :size="4" style="margin-top: 6px;">
          <NText depth="3" style="font-size: 12px;">刷新倒计时</NText>
          <NTag
            :type="code.timeLeft <= 5 ? 'error' : code.timeLeft <= 10 ? 'warning' : 'success'"
            size="small"
            round
            style="font-family: monospace; min-width: 40px; text-align: center;"
          >
            {{ code.timeLeft }}s
          </NTag>
        </NSpace>
      </NCard>
    </NLayoutContent>
  </NLayout>

  <!-- 添加密钥对话框 -->
  <NModal v-model:show="showAddDialog" preset="card" title="添加验证码" style="max-width: 450px;">
    <NForm label-placement="left" label-width="100" require-mark-placement="right-hanging">
      <NFormItem label="名称" required>
        <NInput v-model:value="newSecret.name" placeholder="例如: GitHub" clearable />
      </NFormItem>
      <NFormItem label="密钥 (Base32)" required>
        <NInputGroup>
          <NInput v-model:value="newSecret.secret" placeholder="输入或生成密钥" clearable />
          <NButton @click="generateNewSecret" type="primary" title="生成随机密钥">🎲</NButton>
        </NInputGroup>
      </NFormItem>
    </NForm>

    <NAlert v-if="qrCodeDataUrl" type="info" title="扫描二维码:" style="margin-top: 16px;">
      <div style="text-align: center; margin-top: 12px;">
        <img :src="qrCodeDataUrl" alt="QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
      </div>
    </NAlert>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="showAddDialog = false">取消</NButton>
        <NButton @click="handleAdd" type="primary" :disabled="!isValid">确认</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  NLayout, NLayoutHeader, NLayoutContent,
  NSpace, NText, NButton, NCard, NEmpty, NModal,
  NForm, NFormItem, NInput, NInputGroup, NAlert, NProgress, NTag,
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

// 根据剩余时间返回进度条颜色
function getProgressColor(timeLeft: number): string {
  if (timeLeft <= 5) return '#d03050';   // 红色
  if (timeLeft <= 10) return '#f0a020';  // 橙色
  return '#18a058';                       // 绿色
}

// 获取当前 TOTP 周期的剩余秒数
function getTimeLeft(): number {
  const epoch = Math.floor(Date.now() / 1000);
  return 30 - (epoch % 30);
}

// 从后端加载密钥并生成验证码
async function loadCodes() {
  try {
    const result = await getAllCodes();
    logInfo('TOTPPanel', `加载了 ${result.length} 个验证码`);
    codes.value = result;
  } catch (e) {
    warn('TOTPPanel', '加载验证码失败:', e);
  }
}

// 本地倒计时：每秒只更新 timeLeft，不调后端
function tick() {
  const timeLeft = getTimeLeft();
  for (const code of codes.value) {
    code.timeLeft = timeLeft;
  }
  // 当进入新周期（timeLeft == 30）时，重新生成验证码
  if (timeLeft === 30) {
    loadCodes();
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
    await loadCodes();
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
      await loadCodes();
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
  loadCodes();
  timer = window.setInterval(tick, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
