import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import { ErrorHandler } from './utils/errorHandler';
import './styles/components.css'; // 引入公共组件样式

const app = createApp(App);
const pinia = createPinia();

// 使用 Pinia 持久化插件
pinia.use(piniaPluginPersistedstate);

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  ErrorHandler.handle(err, `Vue Component: ${info}`);
};

// 未捕获的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handle(event.reason, 'Unhandled Promise Rejection');
  event.preventDefault();
});

// 未捕获的全局错误
window.addEventListener('error', (event) => {
  ErrorHandler.handle(event.error, 'Global JavaScript Error');
  event.preventDefault();
});

console.log('[main.ts] 应用开始初始化');

// 全局复制代码函数
(window as any).copyCode = function(btn: HTMLButtonElement) {
  const codeBlock = btn.closest('.code-block');
  if (!codeBlock) return;
  
  const codeContent = codeBlock.querySelector('.code-content code');
  if (!codeContent) return;
  
  const code = codeContent.textContent || '';
  
  navigator.clipboard.writeText(code).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ 已复制';
    btn.classList.add('copied');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    console.error('复制失败');
  });
};

app.use(pinia);
app.mount('#app');

console.log('[main.ts] 应用挂载成功');
