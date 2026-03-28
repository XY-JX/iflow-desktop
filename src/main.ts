import { createApp } from "vue";
import { createPinia } from 'pinia';
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue 全局错误]:', err, info);
};

// 未捕获的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('[未处理的 Promise 错误]:', event.reason);
  event.preventDefault(); // 防止控制台重复输出
});

// 未捕获的全局错误
window.addEventListener('error', (event) => {
  console.error('[全局 JavaScript 错误]:', event.error);
  event.preventDefault();
});

console.log('[main.ts] 应用开始初始化');

app.use(pinia);
app.mount("#app");

console.log('[main.ts] 应用挂载成功');
