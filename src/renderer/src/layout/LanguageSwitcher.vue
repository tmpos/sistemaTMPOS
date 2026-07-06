<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, availableLocales } = useI18n();

const languages = ref([
  {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸',
    icon: 'pi pi-globe'
  },
  {
    code: 'en-US',
    name: 'English',
    flag: '🇺🇸',
    icon: 'pi pi-globe'
  },
  {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷',
    icon: 'pi pi-globe'
  },
  {
    code: 'ru',
    name: 'Русский',
    flag: '🇷🇺',
    icon: 'pi pi-globe'
  }
]);

const isOpen = ref(false);
const dropdownRef = ref(null);

const currentLanguage = computed(() => {
  return languages.value.find(lang => lang.code === locale.value) || languages.value[0];
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const changeLanguage = (langCode) => {
  locale.value = langCode;
  localStorage.setItem('user-locale', langCode);
  isOpen.value = false; // Cerrar el dropdown después de seleccionar
};

// Cerrar el dropdown al hacer clic fuera
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Restaurar idioma guardado al montar
const savedLocale = localStorage.getItem('user-locale');
if (savedLocale && availableLocales.includes(savedLocale)) {
  locale.value = savedLocale;
}
</script>

<template>
  <div class="language-switcher" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      class="language-button"
      :class="{ 'dropdown-open': isOpen }"
      v-tooltip.bottom="$t('Language')"
    >
      <span class="flag">{{ currentLanguage.flag }}</span>
      <span class="language-name hidden lg:inline">{{ currentLanguage.name }}</span>
      <i class="pi pi-angle-down" :class="{ 'rotate-180': isOpen }"></i>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="language-dropdown">
        <div class="language-dropdown-header">
          <i class="pi pi-globe"></i>
          <span>{{ $t('Select Language') }}</span>
        </div>
        <div class="language-list">
          <button
            v-for="lang in languages"
            :key="lang.code"
            @click="changeLanguage(lang.code)"
            class="language-item"
            :class="{ active: locale === lang.code }"
          >
            <span class="flag">{{ lang.flag }}</span>
            <span class="name">{{ lang.name }}</span>
            <i v-if="locale === lang.code" class="pi pi-check"></i>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-block;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 10px;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.language-button:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
  color: #6366f1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.language-button .flag {
  font-size: 1.25rem;
  line-height: 1;
}

.language-button .pi-angle-down {
  font-size: 0.875rem;
  transition: transform 0.3s ease;
}

.language-button .pi-angle-down.rotate-180 {
  transform: rotate(180deg);
}

.language-button.dropdown-open {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
  color: #6366f1;
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 220px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
}

/* Transiciones de Vue */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.language-dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.language-dropdown-header i {
  font-size: 1.125rem;
}

.language-list {
  padding: 0.5rem;
}

.language-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #475569;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.language-item:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.language-item.active {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  font-weight: 600;
}

.language-item .flag {
  font-size: 1.5rem;
  line-height: 1;
}

.language-item .name {
  flex: 1;
  text-align: left;
}

.language-item .pi-check {
  font-size: 1rem;
  color: #10b981;
  font-weight: bold;
}

/* Dark mode support */
.app-dark .language-button {
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  border-color: rgba(99, 102, 241, 0.2);
}

.app-dark .language-button:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.app-dark .language-button.dropdown-open {
  background: rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
  color: #a5b4fc;
}

.app-dark .language-dropdown {
  background: #1e293b;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.app-dark .language-item {
  color: #cbd5e1;
}

.app-dark .language-item:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.app-dark .language-item.active {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

/* Responsive */
@media (max-width: 768px) {
  .language-button {
    padding: 0.625rem;
    min-width: 42px;
    justify-content: center;
  }

  .language-name {
    display: none !important;
  }

  .language-dropdown {
    right: auto;
    left: 0;
  }
}
</style>
