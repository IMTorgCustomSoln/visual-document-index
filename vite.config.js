import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from "vite-plugin-singlefile"

import dotenv from 'dotenv'
dotenv.config()


export default ({mode}) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())}

  return defineConfig({
    define: {
      __VERSION__: `"${process.env.VITE_APP_VERSION}"`,
      __EXPORT_APP_STATE_FILE_NAME__: `"${process.env.EXPORT_APP_STATE_FILE_NAME}"`,
      __EXPORT_FILE_NAME__: `"${process.env.EXPORT_FILE_NAME}"`,
      __EXPORT_TEXT_NAME__: `"${process.env.EXPORT_TEXT_NAME}"`,
      __UPLOAD_LOGS_TEXT_NAME__: `"${process.env.UPLOAD_LOGS_TEXT_NAME}"`
    },
    resolve: {
      alias: {
        vue: '@vue/compat',
        //'@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    plugins: [
      vue(),
      viteSingleFile()
    ],
    /* TODO: append version to output file
    build: {
      rollupOptions: {
        output: {
          file: `dist/VDI_v${process.env.VITE_APP_VERSION}.html`,
        }
      }
    }*/
  })
}