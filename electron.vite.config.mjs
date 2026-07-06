import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src/renderer/src', import.meta.url))
      }
    },
    define: {
      'process.env': {},
      'process.platform': JSON.stringify(process.platform),
      'process.version': JSON.stringify(process.version),
      'process.versions': JSON.stringify(process.versions),
      global: 'globalThis'
    },
    plugins: [
      vue(),
      Components({
        // Directorios donde buscar componentes para auto-import
        dirs: ['src/renderer/src/components'],
        // Excluir la carpeta ui para evitar conflictos
        exclude: [
          /[\\/]node_modules[\\/]/,
          /[\\/]\.git[\\/]/,
          /[\\/]src[\\/]renderer[\\/]src[\\/]components[\\/]ui[\\/]/
        ],
        // Configurar los resolvers
        resolvers: [
          PrimeVueResolver({
            // Importar todos los componentes de PrimeVue automáticamente
            prefix: '' // Sin prefijo para componentes de PrimeVue
          })
        ]
      })
    ],
    build: {
      rollupOptions: {
        input: {
          // ventana principal
          main: resolve(__dirname, 'src/renderer/index.html')
          // ventana adicional
        }
      }
    },
    // 👇 Añade esto para abrirlo en toda la red en modo dev
    server: {
      host: '0.0.0.0', // escucha en todas las interfaces
      port: 5173, // puedes cambiarlo si quieres
      proxy: {
        '/api2': {
          target: 'https://demo.tmposrd.com',
          changeOrigin: true,
          secure: true
        }
      }
    }
  }
})
