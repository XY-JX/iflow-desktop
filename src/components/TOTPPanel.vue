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
        <div class="code-content">
          <div class="code-header">
            <div class="code-name">{{ code.name }}</div>
            <div class="code-actions">
              <n-button @click="copyCode(code.code)" quaternary circle size="tiny" title="复制">
                <template #icon><span>📋</span></template>
              </n-button>
              <n-button @click="handleDelete(code.id)" quaternary circle size="tiny" type="error" title="删除">
                <template #icon><span>×</span></template>
              </n-button>
            </div>
          </div>
          <div class="code-value">{{ code.code }}</div>
          <div class="code-footer">
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

// 复制验证码
function copyCode(code: string) {
  navigator.clipboard.writeText(code).then(() => {
    // 可以添加成功提示
  }).catch(() => {
    console.error('复制失败');
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
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
  gap: 8px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.codes-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 0;
}

.code-item {
  margin-bottom: 12px;
  transition: all 0.2s;
  border-radius: 8px;
}

.code-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.code-content {
  width: 100%;
  padding: 4px 0;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.code-name {
  font-size: 14px;
  color: var(--n-text-color-1);
  font-weight: 600;
}

.code-actions {
  display: flex;
  gap: 4px;
}

.code-value {
  font-size: 28px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: normal;
  margin-bottom: 12px;
  color: var(--n-text-color-1);
  text-align: center;
  user-select: all;
  cursor: pointer;
}

.code-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timer-text {
  font-size: 12px;
  color: var(--n-text-color-3);
  white-space: nowrap;
  min-width: 35px;
  text-align: right;
  font-family: monospace;
}
</style>
