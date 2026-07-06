<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePrimeVue } from 'primevue/config';
import { useLayout } from '@/layout/composables/layout';
import SelectButton from 'primevue/selectbutton';
defineProps({
  simple: {
    type: Boolean,
    default: false
  }
});

const $primevue = usePrimeVue();
const inputStyle = computed(() => $primevue.config.inputStyle || 'outlined');

const scales = ref([12, 13, 14, 15, 16]);
const visible = ref(false);
const inputStyles = ref([
  { label: 'Outlined', value: 'outlined' },
  { label: 'Filled', value: 'filled' }
]);
const menuModes = ref([
  { label: 'Static', value: 'static' },
  { label: 'Overlay', value: 'overlay' }
]);
const compactMaterial = ref(false);
const primaryFocusRing = ref(true);

const { setScale, layoutConfig } = useLayout();

const onConfigButtonClick = () => {
  visible.value = !visible.value;
};

const onChangeTheme = (theme, mode) => {
  $primevue.changeTheme(layoutConfig.theme, theme, 'theme-css', () => {
    layoutConfig.theme = theme;
    layoutConfig.darkTheme = mode;
  });
};

const decrementScale = () => {
  setScale(layoutConfig.scale - 1);
  applyScale();
};

const incrementScale = () => {
  setScale(layoutConfig.scale + 1);
  applyScale();
};

const applyScale = () => {
  document.documentElement.style.fontSize = layoutConfig.scale + 'px';
};

const onInputStyleChange = (value) => {
  $primevue.config.inputStyle = value;
  layoutConfig.inputStyle = value; // Actualizar layoutConfig
};

const onMenuModeChange = (value) => {
  layoutConfig.menuMode = value; // Actualizar layoutConfig
};

const onRippleChange = (value) => {
  layoutConfig.ripple = value; // Actualizar layoutConfig
};

const onDarkModeChange = (value) => {
  const newThemeName = value ? layoutConfig.theme.replace('light', 'dark') : layoutConfig.theme.replace('dark', 'light');

  layoutConfig.darkTheme = value;
  onChangeTheme(newThemeName, value);
};

const changeTheme = (theme, color) => {
  let newTheme;

  newTheme = theme + '-' + (layoutConfig.darkTheme ? 'dark' : 'light');

  if (color) {
    newTheme += '-' + color;
  }

  if (newTheme.startsWith('md-') && compactMaterial.value) {
    newTheme = newTheme.replace('md-', 'mdc-');
  }

  onChangeTheme(newTheme, layoutConfig.darkTheme);
};

const isThemeActive = (themeFamily, color) => {
  let themeName;
  let themePrefix = themeFamily === 'md' && compactMaterial.value ? 'mdc' : themeFamily;

  themeName = themePrefix + (layoutConfig.darkTheme ? '-dark' : '-light');

  if (color) {
    themeName += '-' + color;
  }

  return layoutConfig.theme === themeName;
};

const onCompactMaterialChange = (value) => {
  compactMaterial.value = value;

  if (layoutConfig.theme.startsWith('md')) {
    let tokens = layoutConfig.theme.split('-');

    changeTheme(tokens[0].substring(0, 2), tokens[2]);
  }
};

const onFocusRingColorChange = (value) => {
  primaryFocusRing.value = value;
  let root = document.documentElement;

  if (value) {
    if (layoutConfig.darkTheme) root.style.setProperty('--p-focus-ring-color', 'var(--primary-500)');
    else root.style.setProperty('--p-focus-ring-color', 'var(--primary-500)');
  } else {
    if (layoutConfig.darkTheme) root.style.setProperty('--p-focus-ring-color', 'var(--surface-500)');
    else root.style.setProperty('--p-focus-ring-color', 'var(--surface-900)');
  }
};

// Revisión del localStorage al iniciar para aplicar configuraciones guardadas
const loadConfigFromLocalStorage = () => {
  const savedConfig = localStorage.getItem('layout_theme_config') || localStorage.getItem('theme');

  if (savedConfig) {
        const config = JSON.parse(savedConfig);

          layoutConfig.preset = config.preset || config.preset_theme || layoutConfig.preset;
        layoutConfig.primary = config.primary || config.primary_theme || layoutConfig.primary;
          layoutConfig.surface = config.surface || config.surface_theme || layoutConfig.surface;
          layoutConfig.darkTheme =
            config.darkTheme !== undefined
              ? config.darkTheme
              : config.darktheme !== undefined
                ? config.darktheme
                : config.darktheme_theme !== undefined
                  ? config.darktheme_theme
                  : layoutConfig.darkTheme;
          //layoutConfig.menuMode = config.menumode_theme || layoutConfig.menuMode;
          layoutConfig.menuMode = 'overlay';
          layoutConfig.tipo = config.tipo || config.tipo_theme || (layoutConfig.darkTheme ? 'dark' : 'light');
        layoutConfig.scale = config.scale || layoutConfig.scale;

    // Aplicar el tema
    if (layoutConfig.tipo === 'dark') {
      document.documentElement.classList.add('app-dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('app-dark');
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-bs-theme', layoutConfig.tipo);

    applyScale(); // Aplicar la escala de fuente
    onInputStyleChange(config.inputStyle || 'outlined'); // Aplicar el estilo de entrada
    onRippleChange(config.ripple !== undefined ? config.ripple : true); // Aplicar el efecto Ripple
  }
};

onMounted(() => {
  loadConfigFromLocalStorage();
});
</script>


<template>
  <button class="layout-config-button p-link" type="button" @click="onConfigButtonClick()">
    <i class="pi pi-cog"></i>
  </button>

  <Sidebar v-model:visible="visible" position="right" class="layout-config-sidebar w-26rem" pt:closeButton="ml-auto">
    <div class="p-2">
      <section class="pb-4 flex align-items-center justify-content-between border-bottom-1 surface-border">
        <span class="text-xl font-semibold">Scale</span>
        <div class="flex align-items-center gap-2 border-1 surface-border py-1 px-2" style="border-radius: 30px">
          <Button icon="pi pi-minus" @click="decrementScale" text rounded
            :disabled="layoutConfig.scale.value === scales[0]" />
          <i v-for="s in scales" :key="s"
            :class="['pi pi-circle-fill text-sm text-200', { 'text-lg text-primary': s === layoutConfig.scale.value }]" />

          <Button icon="pi pi-plus" @click="incrementScale" text rounded
            :disabled="layoutConfig.scale.value === scales[scales.length - 1]" />
        </div>
      </section>

      <section class="py-4 flex align-items-center justify-content-between border-bottom-1 surface-border">
        <span :class="['text-xl font-semibold']">Dark Mode</span>
        <InputSwitch :modelValue="layoutConfig.darkTheme.value" @update:modelValue="onDarkModeChange" />
      </section>

      <template v-if="!simple">
        <section class="py-4 flex align-items-center justify-content-between border-bottom-1 surface-border">
          <span class="text-xl font-semibold">Menu Type</span>
          <SelectButton :modelValue="layoutConfig.menuMode.value" @update:modelValue="onMenuModeChange"
            :options="menuModes" optionLabel="label" optionValue="value" :allowEmpty="false" />
        </section>

        <section class="py-4 flex align-items-center justify-content-between border-bottom-1 surface-border">
          <span class="text-xl font-semibold">Input Variant</span>
          <SelectButton :modelValue="inputStyle" @update:modelValue="onInputStyleChange" :options="inputStyles"
            optionLabel="label" optionValue="value" :allowEmpty="false" />
        </section>
      </template>

      <section class="py-4 flex align-items-center justify-content-between border-bottom-1 surface-border">
        <span class="text-xl font-semibold">Ripple Effect</span>
        <InputSwitch :modelValue="layoutConfig.ripple.value" @update:modelValue="onRippleChange" />
      </section>

      <section class="py-4 border-bottom-1 surface-border">
        <div class="text-xl font-semibold mb-3">Themes</div>
        <div class="flex align-items-center gap-2 mb-3">
          <img src="https://primefaces.org/cdn/primevue/images/themes/aura.png" alt="Aura" style="width: 1.5rem" />
          <span class="font-medium">Aura</span>
        </div>
        <div class="flex align-items-center justify-content-between gap-3 mb-3">
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'green'), 'hover:border-500 surface-border': !isThemeActive('aura', 'green') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'green')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #4dac9c 0%, rgba(77, 172, 156, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'cyan'), 'hover:border-500 surface-border': !isThemeActive('aura', 'cyan') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'cyan')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #06b6d4 0%, rgba(6, 182, 212, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'blue'), 'hover:border-500 surface-border': !isThemeActive('aura', 'blue') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'blue')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #4378e6 0%, rgba(67, 120, 230, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'indigo'), 'hover:border-500 surface-border': !isThemeActive('aura', 'indigo') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'indigo')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #585fe0 0%, rgba(88, 95, 224, 0.5) 100%)"></span>
          </button>
        </div>
        <div class="flex align-items-center justify-content-between gap-3 mb-3">
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'purple'), 'hover:border-500 surface-border': !isThemeActive('aura', 'purple') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'purple')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #7758e4 0%, rgba(119, 88, 228, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'amber'), 'hover:border-500 surface-border': !isThemeActive('aura', 'amber') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'amber')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #f59e0b 0%, rgba(245, 158, 11, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'teal'), 'hover:border-500 surface-border': !isThemeActive('aura', 'teal') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'teal')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #14b8a6 0%, rgba(20, 184, 166, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'pink'), 'hover:border-500 surface-border': !isThemeActive('aura', 'pink') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'pink')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #ec4899 0%, rgba(236, 72, 153, 0.5) 100%)"></span>
          </button>
        </div>
        <div class="flex align-items-center justify-content-between gap-3">
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'noir'), 'hover:border-500 surface-border': !isThemeActive('aura', 'noir') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'noir')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #0f172a 0%, rgba(0, 0, 0, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('aura', 'lime'), 'hover:border-500 surface-border': !isThemeActive('aura', 'lime') }
          ]" style="border-radius: 30px" @click="changeTheme('aura', 'lime')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #84cc16 0%, rgb(132, 204, 22, 0.5) 100%)"></span>
          </button>
          <span class="w-3"></span>
          <span class="w-3"></span>
        </div>

        <section class="pt-4 flex align-items-center justify-content-between">
          <span class="text-sm">Primary Focus Ring</span>
          <InputSwitch :modelValue="primaryFocusRing" @update:modelValue="onFocusRingColorChange" />
        </section>
      </section>

      <section class="py-4 border-bottom-1 surface-border">
        <div class="flex align-items-center gap-2 mb-3">
          <img src="https://primefaces.org/cdn/primevue/images/themes/lara-light-teal.png" alt="Lara Light Teal"
            class="border-circle" style="width: 1.5rem" />
          <span class="font-medium">Lara</span>
        </div>
        <div class="flex align-items-center justify-content-between gap-3 mb-3">
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('lara', 'green'), 'hover:border-500 surface-border': !isThemeActive('lara', 'green') }
          ]" style="border-radius: 30px" @click="changeTheme('lara', 'green')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #4dac9c 0%, rgba(77, 172, 156, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('lara', 'cyan'), 'hover:border-500 surface-border': !isThemeActive('lara', 'cyan') }
          ]" style="border-radius: 30px" @click="changeTheme('lara', 'cyan')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #06b6d4 0%, rgba(6, 182, 212, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('lara', 'blue'), 'hover:border-500 surface-border': !isThemeActive('lara', 'blue') }
          ]" style="border-radius: 30px" @click="changeTheme('lara', 'blue')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #4378e6 0%, rgba(67, 120, 230, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('lara', 'indigo'), 'hover:border-500 surface-border': !isThemeActive('lara', 'indigo') }
          ]" style="border-radius: 30px" @click="changeTheme('lara', 'indigo')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #585fe0 0%, rgba(88, 95, 224, 0.5) 100%)"></span>
          </button>
        </div>
        <div class="flex align-items-center justify-content-between gap-3">
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('lara', 'purple'), 'hover:border-500 surface-border': !isThemeActive('lara', 'purple') }
          ]" style="border-radius: 30px" @click="changeTheme('lara', 'purple')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #7758e4 0%, rgba(119, 88, 228, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('lara', 'amber'), 'hover:border-500 surface-border': !isThemeActive('lara', 'amber') }
          ]" style="border-radius: 30px" @click="changeTheme('lara', 'amber')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #f59e0b 0%, rgba(245, 158, 11, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('lara', 'teal'), 'hover:border-500 surface-border': !isThemeActive('lara', 'teal') }
          ]" style="border-radius: 30px" @click="changeTheme('lara', 'teal')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #14b8a6 0%, rgba(20, 184, 166, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('lara', 'pink'), 'hover:border-500 surface-border': !isThemeActive('lara', 'pink') }
          ]" style="border-radius: 30px" @click="changeTheme('lara', 'pink')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #ec4899 0%, rgba(236, 72, 153, 0.5) 100%)"></span>
          </button>
        </div>
      </section>

      <section class="py-4 border-bottom-1 surface-border">
        <div class="flex align-items-center gap-2 mb-3">
          <img src="https://primefaces.org/cdn/primevue/images/themes/md-light-indigo.svg" alt="Material Design"
            class="border-circle" style="width: 1.5rem" />
          <span class="font-medium">Material Design</span>
          <div class="ml-auto flex align-items-center gap-2">
            <label for="material-condensed" class="text-sm">Condensed</label>
            <InputSwitch inputId="material-condensed" :modelValue="compactMaterial"
              @update:modelValue="onCompactMaterialChange" class="ml-auto" />
          </div>
        </div>
        <div class="flex align-items-center justify-content-between gap-3">
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('md', 'indigo'), 'hover:border-500 surface-border': !isThemeActive('md', 'indigo') }
          ]" style="border-radius: 30px" @click="changeTheme('md', 'indigo')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #0565f2 0%, rgba(5, 101, 242, 0.5) 100%)"></span>
          </button>
          <button :class="[
            'bg-transparent border-1 cursor-pointer p-2 w-3 flex align-items-center justify-content-center transition-all transition-duration-200',
            { 'border-primary': isThemeActive('md', 'deeppurple'), 'hover:border-500 surface-border': !isThemeActive('md', 'deeppurple') }
          ]" style="border-radius: 30px" @click="changeTheme('md', 'deeppurple')">
            <span class="block h-1rem w-full"
              style="border-radius: 30px; background: linear-gradient(180deg, #702f92 0%, rgba(112, 47, 146, 0.5) 100%)"></span>
          </button>
          <div class="w-3"></div>
          <div class="w-3"></div>
        </div>
      </section>
    </div>
  </Sidebar>
</template>

<style>
/* Estilos globales para scrollbars */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) #f1f1f1;
  /* Verde de Vue.js */
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

*::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  /* Verde de Vue.js */
  border-radius: 10px;
}

*::-webkit-scrollbar-thumb:hover {
  background: #f1f1f1;
  /* Un verde más oscuro */
}
</style>
