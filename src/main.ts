import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { ErrorHandler } from './utils/errorHandler';
import { info } from './utils/logger';
import './styles/components.css';

const app = createApp(App);
const pinia = createPinia();

// 全局错误处理
app.config.errorHandler = (err, _instance, info_str) => {
  ErrorHandler.handle(err, `Vue Component: ${info_str}`);
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

info('main.ts', '应用开始初始化');

app.use(pinia);
app.mount('#app');

info('main.ts', '应用挂载成功');
