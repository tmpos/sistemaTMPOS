# Guía de Internacionalización (i18n)

Esta guía explica cómo usar la internacionalización en el sistema TM-POS.

## Configuración

El sistema ya está configurado con `vue-i18n` y soporta los siguientes idiomas:
- **Español (es)** - Idioma por defecto
- **Inglés (en-US)**
- **Francés (fr)**
- **Ruso (ru)**

## Cambiar de Idioma

Los usuarios pueden cambiar el idioma del sistema usando el selector de idiomas ubicado en la barra superior (AppTopbar), junto a los otros controles.

## Cómo Usar Traducciones en Componentes

### 1. En Templates (Composition API)

```vue
<template>
  <div>
    <!-- Usando $t para traducciones -->
    <h1>{{ $t('Welcome') }}</h1>
    <button>{{ $t('Save') }}</button>
    <p>{{ $t('Loading') }}</p>
  </div>
</template>
```

### 2. En Script Setup

```vue
<script setup>
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

// Usar t() para traducir
const title = t('Dashboard');
const message = t('Welcome');

// Cambiar idioma programáticamente
const changeToEnglish = () => {
  locale.value = 'en-US';
};
</script>

<template>
  <h1>{{ t('Hello') }}</h1>
  <button @click="changeToEnglish">Change to English</button>
</template>
```

### 3. Traducciones con Variables (Interpolación)

Primero, agrega la traducción con variables en los archivos de idioma:

```javascript
// es/index.js
export default {
  "greeting": "Hola {name}, bienvenido",
  "items_count": "Tienes {count} artículos"
}
```

Luego úsalas en tu componente:

```vue
<template>
  <p>{{ $t('greeting', { name: 'Juan' }) }}</p>
  <p>{{ $t('items_count', { count: 5 }) }}</p>
</template>
```

### 4. Pluralización

```javascript
// es/index.js
export default {
  "car": "ningún coche | un coche | {count} coches"
}
```

```vue
<template>
  <p>{{ $t('car', 0) }}</p>  <!-- ningún coche -->
  <p>{{ $t('car', 1) }}</p>  <!-- un coche -->
  <p>{{ $t('car', 5) }}</p>  <!-- 5 coches -->
</template>
```

### 5. En JavaScript/TypeScript

```javascript
import { useI18n } from 'vue-i18n';

export function useMyFeature() {
  const { t } = useI18n();

  const showAlert = () => {
    alert(t('Success'));
  };

  const getErrorMessage = () => {
    return t('Error');
  };

  return { showAlert, getErrorMessage };
}
```

## Agregar Nuevas Traducciones

### 1. Agrega la traducción en todos los archivos de idioma:

**es/index.js (Español):**
```javascript
export default {
  "My New Key": "Mi Nueva Traducción"
}
```

**en-US/index.js (Inglés):**
```javascript
export default {
  "My New Key": "My New Translation"
}
```

**fr/index.js (Francés):**
```javascript
export default {
  "My New Key": "Ma Nouvelle Traduction"
}
```

**ru/index.js (Ruso):**
```javascript
export default {
  "My New Key": "Мой Новый Перевод"
}
```

### 2. Úsala en tu componente:

```vue
<template>
  <p>{{ $t('My New Key') }}</p>
</template>
```

## Traducciones Disponibles

Algunas de las traducciones más comunes disponibles:

| Clave | Español | Inglés |
|-------|---------|--------|
| Welcome | Bienvenido | Welcome |
| Hello | Hola | Hello |
| Save | Guardar | Save |
| Cancel | Cancelar | Cancel |
| Delete | Eliminar | Delete |
| Search | Buscar | Search |
| Loading | Cargando | Loading |
| Success | Éxito | Success |
| Error | Error | Error |
| Warning | Advertencia | Warning |
| Confirm | Confirmar | Confirm |
| Close | Cerrar | Close |
| Profile | Perfil | Profile |
| Settings | Ajustes | Settings |
| Logout | Salir | Logout |
| Calendar | Calendario | Calendar |
| Notifications | Notificaciones | Notifications |

## Consejos y Mejores Prácticas

1. **Siempre usa claves descriptivas**: Usa nombres que describan el contenido, no la ubicación
   - ✅ `"Save"`
   - ❌ `"button_text_1"`

2. **Mantén consistencia**: Usa las mismas claves para los mismos conceptos en toda la aplicación

3. **Agrega TODAS las traducciones**: Cuando agregues una nueva clave, agrégala en TODOS los archivos de idioma

4. **Usa namespaces para organización**: Para proyectos grandes, considera organizar las traducciones por módulos

5. **Fallback automático**: Si una traducción no existe, el sistema mostrará la clave o usará el idioma de fallback (en-US)

## Obtener el Idioma Actual

```vue
<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

console.log('Idioma actual:', locale.value); // 'es', 'en-US', etc.
</script>
```

## Persistencia del Idioma

El idioma seleccionado se guarda automáticamente en `localStorage` con la clave `'user-locale'` y se restaura cuando el usuario vuelve a la aplicación.

## Agregar un Nuevo Idioma

Para agregar soporte para un nuevo idioma:

1. Crea un nuevo archivo en `src/renderer/src/i18n/[codigo-idioma]/index.js`
2. Exporta un objeto con todas las traducciones
3. Importa y agrega el idioma en `src/renderer/src/i18n/index.js`
4. Agrega el idioma al componente `LanguageSwitcher.vue`

Ejemplo para agregar Portugués:

```javascript
// src/renderer/src/i18n/pt/index.js
export default {
  "Welcome": "Bem-vindo",
  "Hello": "Olá",
  // ... más traducciones
}

// src/renderer/src/i18n/index.js
import pt from './pt'

export default {
  'en-US': enUS,
  'es': es,
  'fr': fr,
  'ru': ru,
  'pt': pt  // Agregar aquí
}
```

## Ejemplos Prácticos

### Formulario Completo con Traducciones

```vue
<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const name = ref('');
const email = ref('');

const handleSubmit = () => {
  alert(t('Success'));
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <h2>{{ $t('Profile') }}</h2>

    <div>
      <label>{{ $t('Name') }}</label>
      <InputText v-model="name" :placeholder="$t('Name')" />
    </div>

    <div>
      <label>{{ $t('Email') }}</label>
      <InputText v-model="email" :placeholder="$t('Email')" />
    </div>

    <div>
      <Button :label="$t('Save')" type="submit" />
      <Button :label="$t('Cancel')" severity="secondary" />
    </div>
  </form>
</template>
```

### Tabla con Traducciones

```vue
<template>
  <DataTable :value="products">
    <Column field="name" :header="$t('Name')" />
    <Column field="price" :header="$t('Price')" />
    <Column :header="$t('Actions')">
      <template #body="slotProps">
        <Button :label="$t('Edit')" icon="pi pi-pencil" />
        <Button :label="$t('Delete')" icon="pi pi-trash" severity="danger" />
      </template>
    </Column>
  </DataTable>
</template>
```

### Diálogos y Confirmaciones

```vue
<script setup>
import { useI18n } from 'vue-i18n';
import { useConfirm } from 'primevue/useconfirm';

const { t } = useI18n();
const confirm = useConfirm();

const deleteItem = () => {
  confirm.require({
    message: t('Are you sure you want to delete this item?'),
    header: t('Confirmation'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('Yes'),
    rejectLabel: t('No'),
    accept: () => {
      // Delete logic
    }
  });
};
</script>
```

### Tooltips Dinámicos

```vue
<template>
  <Button
    :label="$t('Save')"
    v-tooltip.bottom="$t('Click to save changes')"
  />

  <!-- Con función t() -->
  <Button
    :label="$t('Delete')"
    v-tooltip.bottom="t('Delete permanently')"
  />
</template>
```

## Notas Importantes

### Diferencia entre `$t()` y `t()`

- **`$t()`**: Usar en templates (HTML)
  ```vue
  <template>
    <h1>{{ $t('Welcome') }}</h1>
  </template>
  ```

- **`t()`**: Usar en script setup (JavaScript)
  ```vue
  <script setup>
  import { useI18n } from 'vue-i18n';
  const { t } = useI18n();

  const message = t('Welcome');
  </script>
  ```

### Reactive vs Non-Reactive

```vue
<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();

// ❌ No reactivo - no cambiará cuando cambie el idioma
const message = t('Welcome');

// ✅ Reactivo - cambiará automáticamente
const message = computed(() => t('Welcome'));
</script>
```

### Para PrimeVue Components

```vue
<template>
  <!-- Tooltips -->
  <Button v-tooltip.bottom="$t('Save')" />

  <!-- Labels -->
  <Button :label="$t('Save')" />

  <!-- Placeholders -->
  <InputText :placeholder="$t('Search...')" />

  <!-- Headers en DataTable -->
  <Column field="name" :header="$t('Name')" />
</template>
```

## Componente de Ejemplo

Puedes ver un componente completo de ejemplo en:
`src/renderer/src/components/ExampleI18nComponent.vue`

Este componente muestra:
- Uso de traducciones en templates con `$t()`
- Uso de traducciones en script con `t()`
- Traducciones reactivas con `computed()`
- Botones con labels traducidos
- Inputs con placeholders traducidos
- Mensajes y notificaciones traducidos

## Soporte

Para más información sobre vue-i18n, visita: https://vue-i18n.intlify.dev/
