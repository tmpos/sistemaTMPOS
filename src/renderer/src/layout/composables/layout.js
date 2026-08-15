import { computed, reactive, onMounted, readonly, watch } from 'vue'

const LAYOUT_STORAGE_KEY = 'layout_theme_config'

export const DEFAULT_CUSTOM_THEME = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#10b981',
  surfaceColor: '#ffffff',
  textColor: '#0f172a',
  appTopbarBg: '#ffffff',
  appTopbarText: '#475569',
  appTopbarButtonBg: '#eef2ff',
  appTopbarButtonText: '#6366f1'
}

export const applyCustomThemeToDocument = (theme = {}) => {
  if (typeof document === 'undefined') return

  const config = {
    ...DEFAULT_CUSTOM_THEME,
    ...(theme || {})
  }
  const root = document.documentElement
  root.style.setProperty('--app-primary-color', config.primaryColor)
  root.style.setProperty('--app-secondary-color', config.secondaryColor)
  root.style.setProperty('--app-accent-color', config.accentColor)
  root.style.setProperty('--app-surface-color', config.surfaceColor)
  root.style.setProperty('--app-text-color', config.textColor)
  root.style.setProperty('--app-topbar-bg', config.appTopbarBg)
  root.style.setProperty('--app-topbar-text', config.appTopbarText)
  root.style.setProperty('--app-topbar-button-bg', config.appTopbarButtonBg)
  root.style.setProperty('--app-topbar-button-text', config.appTopbarButtonText)
  root.style.setProperty('--primary-color', config.primaryColor)
  root.style.setProperty('--primary-500', config.primaryColor)
  root.style.setProperty('--primary-600', config.primaryColor)
  root.style.setProperty('--primary-700', config.secondaryColor)
}

const layoutConfig = reactive({
  preset: 'Aura',
  primary: 'emerald',
  surface: null,
  darkTheme: false,
  menuMode: 'static',
  tipo: 'light' // Añadido para almacenar el tipo de tema
})

const layoutState = reactive({
  staticMenuDesktopInactive: false,
  overlayMenuActive: false,
  profileSidebarVisible: false,
  configSidebarVisible: false,
  staticMenuMobileActive: false,
  menuHoverActive: false,
  activeMenuItem: null
})

export function useLayout() {
  const applyThemeToDocument = (theme) => {
    const isDark = theme === 'dark'

    document.documentElement.classList.toggle('app-dark', isDark)
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light')
  }

  const setPrimary = (value) => {
    layoutConfig.primary = value
  }

  const setSurface = (value) => {
    layoutConfig.surface = value
  }

  const setPreset = (value) => {
    layoutConfig.preset = value
  }

  const setActiveMenuItem = (item) => {
    layoutState.activeMenuItem = item.value || item
  }

  const setMenuMode = (mode) => {
    layoutConfig.menuMode = mode
  }

  const toggleDarkMode = () => {
    if (!document.startViewTransition) {
      executeDarkModeToggle()
      return
    }

    document.startViewTransition(() => executeDarkModeToggle())
  }

  const executeDarkModeToggle = () => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme
    const newTheme = layoutConfig.darkTheme ? 'dark' : 'light'
    layoutConfig.tipo = newTheme

    applyThemeToDocument(newTheme)
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutConfig))
  }

  const onMenuToggle = () => {
    if (layoutConfig.menuMode === 'overlay') {
      layoutState.overlayMenuActive = !layoutState.overlayMenuActive
    }

    if (window.innerWidth > 991) {
      layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive
    } else {
      layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive
    }
  }

  const resetMenu = () => {
    layoutState.overlayMenuActive = false
    layoutState.staticMenuMobileActive = false
    layoutState.menuHoverActive = false
  }

  const closeSidebar = () => {
    layoutState.overlayMenuActive = false
    layoutState.staticMenuMobileActive = false
    layoutState.menuHoverActive = false
    layoutState.staticMenuDesktopInactive = true
  }

  const verificaLocalStorage = () => {
    const savedTheme = localStorage.getItem(LAYOUT_STORAGE_KEY) || localStorage.getItem('theme')
    const customTheme = localStorage.getItem('custom_theme_config')
    if (customTheme) {
      try {
        applyCustomThemeToDocument(JSON.parse(customTheme))
      } catch (error) {
        applyCustomThemeToDocument(DEFAULT_CUSTOM_THEME)
      }
    } else {
      applyCustomThemeToDocument(DEFAULT_CUSTOM_THEME)
    }

    if (savedTheme) {
      const datosConfig = JSON.parse(savedTheme)

      const darkThemeGuardado =
        typeof datosConfig.darkTheme === 'boolean'
          ? datosConfig.darkTheme
          : typeof datosConfig.darktheme === 'boolean'
            ? datosConfig.darktheme
            : layoutConfig.darkTheme

      const tipoGuardado = datosConfig.tipo || (darkThemeGuardado ? 'dark' : 'light')

      // Aplicar cada propiedad de la configuración guardada
      layoutConfig.preset = datosConfig.preset || layoutConfig.preset
      layoutConfig.primary = datosConfig.primary || layoutConfig.primary
      layoutConfig.surface = datosConfig.surface || layoutConfig.surface
      layoutConfig.darkTheme = darkThemeGuardado
      layoutConfig.menuMode = datosConfig.menuMode || layoutConfig.menuMode
      layoutConfig.tipo = tipoGuardado

      applyThemeToDocument(tipoGuardado)
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutConfig))
    } else {
      // Configuración predeterminada si no hay nada en localStorage
      layoutConfig.tipo = 'light'
      layoutConfig.darkTheme = false
      applyThemeToDocument('light')
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutConfig))
    }
  }

  onMounted(() => {
    verificaLocalStorage()

    // Vigilar cambios en layoutConfig y sincronizarlos con localStorage
    watch(
      () => layoutConfig,
      (newConfig) => {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newConfig))
      },
      { deep: true }
    )

    // Detectar cambios en localStorage desde otras pestañas
    window.addEventListener('storage', (event) => {
      if (event.key === LAYOUT_STORAGE_KEY || event.key === 'theme') {
        verificaLocalStorage()
      }
    })
  })

  const isSidebarActive = computed(
    () => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive
  )

  const isDarkTheme = computed(() => layoutConfig.darkTheme)

  const getPrimary = computed(() => layoutConfig.primary)

  const getSurface = computed(() => layoutConfig.surface)

  return {
    layoutConfig: readonly(layoutConfig),
    layoutState: readonly(layoutState),
    onMenuToggle,
    closeSidebar,
    isSidebarActive,
    isDarkTheme,
    getPrimary,
    getSurface,
    setActiveMenuItem,
    toggleDarkMode,
    setPrimary,
    setSurface,
    setPreset,
    resetMenu,
    setMenuMode
  }
}
