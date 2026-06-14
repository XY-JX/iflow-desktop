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
      '@types': path.resolve(__dirname, './src/types')
    }
  },

  // 定义全局常量替换
  define: {
    __APP_NAME__: JSON.stringify(process.env.VITE_APP_NAME || '我的一个梦'),
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || '1.8.1')
  },

  // 预构建优化：提前打包常用依赖
  optimizeDeps: {
    include: ['vue', 'pinia', 'naive-ui', 'markdown-it', 'highlight.js', 'otpauth'],
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,
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
      ignored: ["**/src-tauri/**"],
    },
  },

  // 构建优化
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'pinia'],
          'naive-ui': ['naive-ui'],
          'markdown': ['markdown-it', 'highlight.js'],
          'tauri': ['@tauri-apps/api/core', '@tauri-apps/api/event'],
          'otpauth': ['otpauth']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 使用 esbuild 压缩（比 terser 快 20-40 倍）
    minify: 'esbuild',
    // chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 资源内联限制 (小于 4KB 转 base64)
    assetsInlineLimit: 4096,
    // 生成 source map（开发环境）
    sourcemap: process.env.NODE_ENV === 'development',
    // 目标浏览器（Tauri 使用系统 WebView）
    target: 'esnext',
  },

  preview: {
    port: 4173,
    strictPort: true
  }
}));
