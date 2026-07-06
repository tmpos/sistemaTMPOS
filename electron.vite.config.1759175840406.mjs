// electron.vite.config.mjs
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
var __electron_vite_injected_import_meta_url =
  'file:///C:/Users/Tomas%20Taveras/Desktop/Sistemas/Sistema%20AA/electron.vite.config.mjs'
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src/renderer/src', __electron_vite_injected_import_meta_url))
      }
    },
    plugins: [
      vue(),
      Components({
        resolvers: [PrimeVueResolver()]
      })
    ]
  }
})
export { electron_vite_config_default as default }
