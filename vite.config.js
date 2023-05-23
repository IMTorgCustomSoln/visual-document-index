import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
  resolve: {
    alias: {
      vue: '@vue/compat',
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  plugins: [
    vue(),
    viteSingleFile()
  ],
});
