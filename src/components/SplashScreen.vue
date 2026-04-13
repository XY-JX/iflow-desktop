<template>
  <div v-if="visible" class="splash-screen" :class="{ hidden: !visible }">
    <!-- 鍔ㄦ€佽儗鏅�矑瀛?-->
    <div class="splash-particles">
      <div v-for="i in 10" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>

    <!-- Logo 瀹瑰櫒 -->
    <div class="splash-logo">
      <div class="logo-ring"></div>
    </div>

    <!-- 椤圭洰鍚嶇О -->
    <div class="splash-title">{{ appName }}</div>
    <div class="splash-subtitle">Desktop</div>

    <!-- 鍔犺浇杩涘害鏉?-->
    <div class="splash-progress">
      <div class="splash-progress-bar"></div>
    </div>

    <!-- 鐗堟湰淇℃伅 -->
    <div class="splash-version">v{{ appVersion }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const visible = ref(true);
const appName = import.meta.env.VITE_APP_NAME || '我的一个梦';
const appVersion = import.meta.env.VITE_APP_VERSION || '1.8.1';

// 生成粒子随机样式
const getParticleStyle = (index: number) => {
  const left = (index * 10) % 100;
  const delay = (index * 0.3) % 3;
  const duration = 11 + (index % 5);
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  };
};

// 隐藏启动屏
const hide = () => {
  visible.value = false;
};

defineExpose({
  hide
});
</script>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  transition: opacity 0.6s ease-out, visibility 0.6s ease-out;
}

.splash-screen.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

/* 鍔ㄦ€佽儗鏅�矑瀛?*/
.splash-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: float 15s infinite;
}

@keyframes float {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) scale(1.5);
    opacity: 0;
  }
}

/* Logo 瀹瑰櫒 */
.splash-logo {
  position: relative;
  z-index: 10;
  margin-bottom: 40px;
}

/* 鍙戝厜鍦嗙幆 */
.logo-ring {
  width: 120px;
  height: 120px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.1);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 椤圭洰鍚嶇О */
.splash-title {
  position: relative;
  z-index: 10;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
  margin-bottom: 12px;
  animation: fadeInUp 0.8s ease-out;
}

.splash-subtitle {
  position: relative;
  z-index: 10;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 4px;
  text-transform: uppercase;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 鍔犺浇杩涘害鏉?*/
.splash-progress {
  position: relative;
  z-index: 10;
  width: 200px;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-top: 40px;
  overflow: hidden;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.splash-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.6));
  border-radius: 2px;
  animation: progress 2s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

@keyframes progress {
  0% {
    width: 0%;
    margin-left: 0%;
  }
  50% {
    width: 70%;
    margin-left: 15%;
  }
  100% {
    width: 0%;
    margin-left: 100%;
  }
}

/* 鐗堟湰淇℃伅 */
.splash-version {
  position: absolute;
  bottom: 30px;
  right: 30px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  z-index: 10;
  animation: fadeInUp 0.8s ease-out 0.6s both;
}
</style>