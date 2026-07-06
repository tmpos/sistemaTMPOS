<script setup>
import { onMounted } from 'vue'
import { applyCustomThemeToDocument, DEFAULT_CUSTOM_THEME } from '@/layout/composables/layout'

onMounted(async () => {
  try {
    if (!window.electron?.ipcRenderer) {
      applyCustomThemeToDocument(DEFAULT_CUSTOM_THEME)
      return
    }
    const datosJSON = await window.electron.ipcRenderer.invoke('datosarchivo')
    const themeConfig = {
      ...DEFAULT_CUSTOM_THEME,
      ...(datosJSON?.themeConfig || {})
    }
    localStorage.setItem('custom_theme_config', JSON.stringify(themeConfig))
    applyCustomThemeToDocument(themeConfig)
  } catch (error) {
    applyCustomThemeToDocument(DEFAULT_CUSTOM_THEME)
  }
})
</script>

<template>
    <router-view />
</template>

<style scoped></style>
