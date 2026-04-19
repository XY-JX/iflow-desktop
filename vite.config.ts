import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    // Gzip 压缩
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 大于 10KB 的文件才压缩
      algorithm: 'gzip',
      ext: '.gz'
    }),
    // 构建分析（仅在生产构建时启用）
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true
    })
  ].filter(Boolean),

  // 路径别名配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@theme': path.resolve(__dirname, './src/theme')
    }
  },

  // 定义全局常量替换
  define: {
    __APP_NAME__: JSON.stringify(process.env.VITE_APP_NAME || '我的一个梦'),
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || '1.8.1')
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  
  // 构建优化
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'pinia'],
          'naive-ui': ['naive-ui'],
          'markdown': ['markdown-it'],
          'tauri': ['@tauri-apps/api/core', '@tauri-apps/api/event'],
          'otpauth': ['otpauth']
        },
        // 优化 chunk 文件名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'] // 移除特定 console
      },
      format: {
        comments: false // 移除所有注释
      }
    },
    // chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 资源内联限制 (小于 4KB 转 base64)
    assetsInlineLimit: 4096,
    // 启用预加载策略
    modulePreload: {
      polyfill: true
    },
    // 减少并发数以减少内存占用
    cssMinify: true,
    // 生成 source map（开发环境）
    sourcemap: process.env.NODE_ENV === 'development'
  },
  
  // 预加载优化
  preview: {
    port: 4173,
    strictPort: true
  }
}));
