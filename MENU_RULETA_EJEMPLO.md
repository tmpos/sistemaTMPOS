# Agregar Ruleta al Menú de Navegación

Para agregar las opciones de la ruleta al menú de navegación de tu aplicación, necesitas modificar el archivo donde se define el menú.

## Ubicación del archivo de menú

Busca el archivo que contiene la configuración del menú principal. Comúnmente puede estar en:
- `src/renderer/src/layout/AppMenu.vue`
- `src/renderer/src/components/Menu.vue`
- `src/renderer/src/config/menu.js`

## Ejemplo de configuración

Agrega el siguiente objeto al array de items del menú:

```javascript
{
  label: 'Ruleta de Premios',
  icon: 'pi pi-gift',
  items: [
    {
      label: 'Girar Ruleta',
      icon: 'pi pi-spin',
      to: '/ruleta'
    },
    {
      label: 'Gestionar Premios',
      icon: 'pi pi-cog',
      to: '/ruleta/premios'
    },
    {
      label: 'Configuración',
      icon: 'pi pi-wrench',
      to: '/ruleta/configuracion'
    }
  ]
}
```

## Ejemplo completo con PrimeVue Menu

Si estás usando PrimeVue Menu component:

```vue
<template>
  <Menu :model="items" />
</template>

<script setup>
import { ref } from 'vue'

const items = ref([
  // ... otros items del menú
  {
    label: 'Ruleta de Premios',
    icon: 'pi pi-gift',
    items: [
      {
        label: 'Girar Ruleta',
        icon: 'pi pi-spin',
        command: () => {
          router.push('/ruleta')
        }
      },
      {
        label: 'Gestionar Premios',
        icon: 'pi pi-cog',
        command: () => {
          router.push('/ruleta/premios')
        }
      },
      {
        label: 'Configuración',
        icon: 'pi pi-wrench',
        command: () => {
          router.push('/ruleta/configuracion')
        }
      }
    ]
  }
])
</script>
```

## Opción alternativa: Badge con contador

Para mostrar el número de premios activos:

```vue
<script setup>
import { ref, onMounted } from 'vue'

const premiosActivos = ref(0)

onMounted(async () => {
  const result = await window.api.ejecutarConsulta(
    'SELECT COUNT(*) as count FROM premios_ruleta WHERE activo = 1'
  )
  premiosActivos.value = result[0]?.count || 0
})

const items = ref([
  {
    label: 'Ruleta de Premios',
    icon: 'pi pi-gift',
    badge: premiosActivos.value,
    items: [
      // ... subitems
    ]
  }
])
</script>
```

## Iconos Alternativos

Puedes usar estos iconos de PrimeIcons:

- `pi pi-gift` - Regalo (recomendado para menú principal)
- `pi pi-spin` - Ruleta girando
- `pi pi-circle-fill` - Círculo
- `pi pi-trophy` - Trofeo
- `pi pi-star` - Estrella
- `pi pi-ticket` - Ticket/Factura
- `pi pi-cog` - Configuración
- `pi pi-wrench` - Herramientas

## Permisos y Roles

Si tu aplicación usa control de acceso por roles, puedes agregar validación:

```javascript
{
  label: 'Ruleta de Premios',
  icon: 'pi pi-gift',
  visible: () => {
    // Verificar si el usuario tiene permisos
    const authStore = useAuthStore()
    return authStore.hasPermission('ruleta') || authStore.isAdmin
  },
  items: [
    // ... subitems
  ]
}
```

## Ejemplo Visual

```
📋 Facturación
   ├─ 📄 Ver Facturas
   ├─ ➕ Nueva Factura
   └─ 📊 Reportes

🎁 Ruleta de Premios          <-- NUEVO
   ├─ 🎡 Girar Ruleta
   ├─ ⚙️  Gestionar Premios
   └─ 🔧 Configuración

👥 Clientes
   ├─ 👤 Ver Clientes
   └─ ➕ Nuevo Cliente
```

## Notas Importantes

1. **Orden en el menú**: Coloca la ruleta donde tenga más sentido en tu flujo de trabajo. Sugerencia: después de Facturación.

2. **Acceso rápido**: Considera agregar un botón de acceso rápido en el dashboard principal:
   ```vue
   <Button
     label="🎡 Ruleta de Premios"
     @click="router.push('/ruleta')"
     class="p-button-lg p-button-success"
   />
   ```

3. **Notificaciones**: Puedes agregar notificaciones cuando haya nuevos ganadores:
   ```javascript
   // En tu servicio de notificaciones
   socket.on('nuevo-ganador', (ganador) => {
     toast.add({
       severity: 'success',
       summary: '¡Nuevo Ganador!',
       detail: `${ganador.nombre} ganó: ${ganador.premio}`,
       life: 5000
     })
   })
   ```
