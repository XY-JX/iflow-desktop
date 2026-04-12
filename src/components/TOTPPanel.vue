<template>
  <div class="totp-panel">
    <div class="panel-header">
      <span class="panel-title">🔐 谷歌验证码</span>
      <button @click="showAddDialog = true" class="btn-add" title="添加新密钥">+</button>
    </div>

    <div class="codes-container">
      <div v-if="codes.length === 0" class="empty-state">
        <div class="empty-icon">🔑</div>
        <div class="empty-text">暂无验证码</div>
        <div class="empty-hint">点击右上角 + 添加</div>
      </div>

      <div v-for="code in codes" :key="code.id" class="code-item">
        <div class="code-info">
          <div class="code-name">{{ code.name }}</div>
          <div class="code-value">{{ code.code }}</div>
          <div class="code-timer">
            <div 
              class="timer-bar" 
              :style="{ width: (code.timeLeft / 30 * 100) + '%' }"
              :class="{ 'timer-warning': code.timeLeft <= 5 }"
            ></div>
            <span class="timer-text">{{ code.timeLeft }}s</span>
          </div>
        </div>
        <button @click="handleDelete(code.id)" class="btn-delete" title="删除">×</button>
      </div>
    </div>

    <!-- 添加密钥对话框 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-content" @click.stop>
        <h3 class="dialog-title">添加验证码</h3>
        
        <div class="form-group">
          <label>名称</label>
          <input 
            v-model="newSecret.name" 
            type="text" 
            placeholder="例如: GitHub"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>密钥 (Base32)</label>
          <div class="secret-input-group">
            <input 
              v-model="newSecret.secret" 
              type="text" 
              placeholder="输入或生成密钥"
              class="form-input"
            />
            <button @click="generateNewSecret" class="btn-generate" title="生成随机密钥">
              🎲
            </button>
          </div>
        </div>

        <div class="qr-section" v-if="qrCodeUrl">
          <div class="qr-label">扫描二维码:</div>
          <img :src="qrCodeUrl" alt="QR Code" class="qr-code" />
        </div>

        <div class="dialog-actions">
          <button @click="closeDialog" class="btn-cancel">取消</button>
          <button @click="handleAdd" class="btn-confirm" :disabled="!isValid">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getAllCodes, addSecret, deleteSecret, generateSecret } from '../utils/totp';
import type { TOTPCode } from '../utils/totp';

const codes = ref<TOTPCode[]>([]);
const showAddDialog = ref(false);
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
}

// 删除密钥
async function handleDelete(id: string) {
  if (confirm('确定要删除这个验证码吗?')) {
    await deleteSecret(id);
    await updateCodes();
  }
}

// 关闭对话框
function closeDialog() {
  showAddDialog.value = false;
  newSecret.value = { name: '', secret: '' };
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
  background: transparent;
}

.panel-header {
  padding: 8px 12px;
  background: transparent;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.panel-title {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary, #333);
}

.btn-add {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--primary-color, #4a90e2);
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-add:hover {
  background: var(--primary-dark, #357abd);
  transform: scale(1.1);
}

.codes-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #999);
  gap: 8px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.7;
}

.code-item {
  background: var(--bg-secondary, #f8f9fa);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.code-item:hover {
  border-color: var(--primary-color, #4a90e2);
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
}

.code-info {
  flex: 1;
}

.code-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #333);
  margin-bottom: 4px;
}

.code-value {
  font-size: 20px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  color: var(--primary-color, #4a90e2);
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.code-timer {
  position: relative;
  height: 4px;
  background: var(--border-color, #e0e0e0);
  border-radius: 2px;
  overflow: hidden;
}

.timer-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--primary-color, #4a90e2);
  transition: width 1s linear;
}

.timer-bar.timer-warning {
  background: #ff4d4f;
}

.timer-text {
  position: absolute;
  right: 0;
  top: -18px;
  font-size: 11px;
  color: var(--text-secondary, #999);
}

.btn-delete {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary, #999);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: 8px;
}

.btn-delete:hover {
  background: #ff4d4f;
  color: white;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 350px;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #555);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #d9d9d9);
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color, #4a90e2);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.secret-input-group {
  display: flex;
  gap: 8px;
}

.secret-input-group .form-input {
  flex: 1;
}

.btn-generate {
  padding: 10px 12px;
  border: 1px solid var(--border-color, #d9d9d9);
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-generate:hover {
  background: var(--bg-secondary, #f8f9fa);
  border-color: var(--primary-color, #4a90e2);
}

.qr-section {
  margin: 16px 0;
  text-align: center;
}

.qr-label {
  font-size: 13px;
  color: var(--text-secondary, #666);
  margin-bottom: 8px;
}

.qr-code {
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  padding: 8px;
  background: white;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-secondary, #f5f5f5);
  color: var(--text-primary, #666);
}

.btn-cancel:hover {
  background: var(--border-color, #e0e0e0);
}

.btn-confirm {
  background: var(--primary-color, #4a90e2);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--primary-dark, #357abd);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  .totp-panel {
    background: var(--bg-primary, #1a1a1a);
  }

  .panel-header {
    background: var(--bg-secondary, #2d2d2d);
    border-bottom-color: var(--border-color, #404040);
  }

  .panel-title {
    color: var(--text-primary, #f0f0f0);
  }

  .code-item {
    background: var(--bg-secondary, #2d2d2d);
    border-color: var(--border-color, #404040);
  }

  .code-item:hover {
    border-color: var(--primary-color, #4a90e2);
  }

  .code-name {
    color: var(--text-primary, #f0f0f0);
  }

  .dialog-content {
    background: var(--bg-primary, #1a1a1a);
  }

  .dialog-title {
    color: var(--text-primary, #f0f0f0);
  }

  .form-group label {
    color: var(--text-primary, #ccc);
  }

  .form-input {
    background: var(--bg-secondary, #2d2d2d);
    border-color: var(--border-color, #404040);
    color: var(--text-primary, #f0f0f0);
  }

  .form-input:focus {
    border-color: var(--primary-color, #4a90e2);
  }

  .btn-generate {
    background: var(--bg-secondary, #2d2d2d);
    border-color: var(--border-color, #404040);
    color: var(--text-primary, #f0f0f0);
  }

  .btn-generate:hover {
    background: var(--bg-hover, #3d3d3d);
  }

  .btn-cancel {
    background: var(--bg-secondary, #2d2d2d);
    color: var(--text-primary, #ccc);
  }

  .btn-cancel:hover {
    background: var(--bg-hover, #3d3d3d);
  }
}
</style>
