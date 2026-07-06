# Guía del Sistema Offline - Sistema AA

## 📋 Descripción General

El Sistema AA ahora cuenta con funcionalidad **offline completa** que permite:

1. ✅ **Login sin internet** - Los usuarios pueden acceder con credenciales previamente guardadas
2. ✅ **Guardar facturas offline** - Las facturas se almacenan localmente cuando no hay conexión
3. ✅ **Sincronización automática** - Al recuperar internet, los datos se sincronizan automáticamente
4. ✅ **Indicador de estado** - Muestra claramente si estás online u offline

---

## 🚀 Cómo Funciona

### 1. Login Offline

#### Primera vez (con internet):
1. El usuario inicia sesión normalmente con email y contraseña
2. El sistema **guarda automáticamente** sus credenciales en IndexedDB
3. Estos datos quedan disponibles para acceso sin internet

#### Login sin internet:
1. El usuario ingresa sus credenciales
2. El sistema busca en la base de datos local (IndexedDB)
3. Valida la contraseña contra la versión hasheada guardada
4. Permite acceso si las credenciales coinciden

#### Indicador Visual:
- **Verde con ícono WiFi** = En línea
- **Rojo con WiFi tachado** = Sin conexión (Modo Offline)

---

### 2. Guardar Facturas Offline

#### Implementación Básica

```javascript
import { useOfflineSync } from '@/composables/useOfflineSync'
import { peticionesFetchOffline } from '@/funciones/funciones'

// En tu componente
const { guardarFactura } = useOfflineSync()

// Guardar una factura (detecta automáticamente si hay internet)
const factura = {
  numero_factura: 'FAC-001',
  fecha: '2024-01-15',
  cliente: 'Juan Pérez',
  total: 1500.00,
  productos: [...],
  // ... otros campos
}

const resultado = await guardarFactura(factura, peticionesFetchOffline)

if (resultado.success) {
  if (resultado.mode === 'online') {
    console.log('Factura guardada en servidor')
  } else {
    console.log('Factura guardada offline, se sincronizará después')
  }
}
```

#### Funciones Disponibles en `useOfflineDB.js`

```javascript
import {
  guardarFacturaOffline,           // Guarda factura en IndexedDB
  getFacturasPendientesSincronizacion, // Obtiene facturas por sincronizar
  sincronizarFacturas,              // Sincroniza facturas con servidor
  limpiarFacturasSincronizadas,     // Limpia facturas ya sincronizadas
  getEstadoSincronizacion           // Estado del sistema offline
} from '@/composables/useOfflineDB'
```

---

### 3. Sincronización Automática

La sincronización ocurre automáticamente en estos momentos:

1. **Al recuperar internet** - El evento `online` dispara la sincronización
2. **Login exitoso** - Si hay datos pendientes, se sincronizan
3. **Manual** - Puedes disparar sincronización con `Ctrl+P` en login

#### Proceso de Sincronización:

```
┌─────────────────────────────┐
│ Usuario pierde conexión     │
│ Sigue trabajando offline    │
│ Facturas → IndexedDB        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Internet regresa            │
│ Sistema detecta "online"    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Sincronización automática   │
│ - Lee facturas pendientes   │
│ - Envía al servidor         │
│ - Marca como sincronizadas  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Limpieza (después 5 seg)    │
│ - Elimina sincronizadas     │
│ - Libera espacio            │
└─────────────────────────────┘
```

---

## 💾 Estructura de Base de Datos Offline

El sistema usa **IndexedDB con Dexie** para almacenamiento local:

### Tablas Disponibles:

```javascript
{
  productos: '++id, codigo, nombre',
  clientes: '++id, codigo, nombre',
  empresa: '++id, nombre',
  usuarios: '++id, email, password',      // ← NUEVO: con password
  configuracion: '++id',
  configuracionfactura: '++id',
  metodopago: '++id',
  theme: '++id',
  facturas_offline: '++id, numero_factura, fecha, cliente, estado',  // ← NUEVO
  cotizaciones_offline: '++id, numero_cotizacion, fecha, cliente, estado',  // ← NUEVO
  sync_queue: '++id, tabla, action, createdAt, synced'  // ← Cola de sincronización
}
```

---

## 🛠️ Ejemplo Completo: Componente de Facturación

```vue
<template>
  <div>
    <!-- Indicador de conexión -->
    <div class="status-bar" :class="isOnline ? 'online' : 'offline'">
      <i :class="isOnline ? 'pi pi-wifi' : 'pi pi-wifi-slash'"></i>
      <span>{{ isOnline ? 'En línea' : 'Modo Offline' }}</span>
      <span v-if="!isOnline && facturasPendientes > 0">
        ({{ facturasPendientes }} facturas pendientes)
      </span>
    </div>

    <!-- Botón guardar factura -->
    <button @click="guardarNuevaFactura">
      Guardar Factura
    </button>

    <!-- Botón sincronizar manual -->
    <button
      @click="sincronizarManual"
      :disabled="!isOnline || sincronizando"
      v-if="facturasPendientes > 0"
    >
      {{ sincronizando ? 'Sincronizando...' : 'Sincronizar Ahora' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useOfflineSync } from '@/composables/useOfflineSync'
import { peticionesFetchOffline } from '@/funciones/funciones'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const {
  isOnline,
  sincronizando,
  guardarFactura,
  sincronizarTodo,
  getFacturasPendientes,
  inicializarListeners
} = useOfflineSync()

const facturasPendientes = ref(0)

// Guardar factura
const guardarNuevaFactura = async () => {
  const factura = {
    numero_factura: 'FAC-' + Date.now(),
    fecha: new Date().toISOString(),
    cliente: 'Cliente Ejemplo',
    total: 2500.00,
    productos: [
      { nombre: 'Producto 1', cantidad: 2, precio: 1000 },
      { nombre: 'Producto 2', cantidad: 1, precio: 500 }
    ]
  }

  const resultado = await guardarFactura(factura, peticionesFetchOffline)

  if (resultado.success) {
    toast.add({
      severity: resultado.mode === 'online' ? 'success' : 'info',
      summary: 'Factura guardada',
      detail: resultado.message,
      life: 3000
    })
    await actualizarContadores()
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: resultado.message,
      life: 3000
    })
  }
}

// Sincronizar manualmente
const sincronizarManual = async () => {
  const resultado = await sincronizarTodo(peticionesFetchOffline)

  toast.add({
    severity: resultado.success ? 'success' : 'error',
    summary: resultado.success ? 'Sincronización exitosa' : 'Error',
    detail: resultado.message,
    life: 3000
  })

  if (resultado.success) {
    await actualizarContadores()
  }
}

// Actualizar contadores
const actualizarContadores = async () => {
  const facturas = await getFacturasPendientes()
  facturasPendientes.value = facturas.length
}

// Lifecycle
let cleanup = null

onMounted(async () => {
  await actualizarContadores()

  // Inicializar listeners de conexión
  cleanup = inicializarListeners({
    onOnline: async () => {
      toast.add({
        severity: 'success',
        summary: 'Conexión restaurada',
        detail: 'Sincronizando datos...',
        life: 3000
      })

      const resultado = await sincronizarTodo(peticionesFetchOffline)
      if (resultado.success && resultado.facturasSincronizadas > 0) {
        toast.add({
          severity: 'success',
          summary: 'Sincronizado',
          detail: resultado.message,
          life: 4000
        })
        await actualizarContadores()
      }
    },
    onOffline: () => {
      toast.add({
        severity: 'warn',
        summary: 'Sin conexión',
        detail: 'Trabajando en modo offline',
        life: 3000
      })
    }
  })
})

onUnmounted(() => {
  if (cleanup) cleanup()
})
</script>
```

---

## 🔧 Configuración y Mantenimiento

### Verificar Estado del Sistema

```javascript
import { getEstadoSincronizacion } from '@/composables/useOfflineDB'

const estado = await getEstadoSincronizacion()
console.log(estado)
// {
//   online: true,
//   operacionesPendientes: 5,
//   facturasPendientes: 3,
//   usuariosCached: 2,
//   ultimoCache: "1705334400000"
// }
```

### Limpiar Datos Sincronizados

```javascript
import { limpiarFacturasSincronizadas } from '@/composables/useOfflineDB'

const eliminadas = await limpiarFacturasSincronizadas()
console.log(`${eliminadas} facturas eliminadas`)
```

---

## ⚠️ Consideraciones Importantes

### Seguridad
- Las contraseñas se almacenan **hasheadas con bcrypt**
- No se guardan contraseñas en texto plano
- La validación offline usa el mismo hash que online

### Limitaciones
- **Primera vez requiere internet**: El usuario debe hacer login con conexión al menos una vez
- **Capacidad de almacenamiento**: IndexedDB tiene límites del navegador (~50MB típicamente)
- **Resolución de conflictos**: Las facturas offline tienen timestamp, se sincronizan en orden

### Buenas Prácticas
1. Siempre notificar al usuario cuando trabaja offline
2. Mostrar cantidad de operaciones pendientes
3. Sincronizar automáticamente al recuperar conexión
4. Limpiar datos sincronizados periódicamente

---

## 🎯 Próximos Pasos

Para implementar **cotizaciones offline** y otras funcionalidades:

1. Agregar función `guardarCotizacionOffline()` similar a facturas
2. Crear tabla de sincronización para cada tipo de documento
3. Implementar lógica de sincronización específica

### Ejemplo para Cotizaciones:

```javascript
// En useOfflineDB.js
export async function guardarCotizacionOffline(cotizacion) {
  try {
    const database = getDB()
    if (!database.cotizaciones_offline) return null

    cotizacion.estado = 'pendiente_sincronizacion'
    cotizacion.fecha_creacion_offline = Date.now()

    const id = await database.cotizaciones_offline.add(cotizacion)
    await addToSyncQueue('cotizaciones', 'insert', cotizacion)

    return id
  } catch (e) {
    console.error('[OfflineDB] guardarCotizacionOffline:', e)
    return null
  }
}
```

---

## 📞 Soporte

Si tienes problemas con el sistema offline:

1. Verifica en consola los logs: `[OfflineDB]` y `[Login]`
2. Revisa el estado con `getEstadoSincronizacion()`
3. Limpia IndexedDB en DevTools si hay problemas
4. Asegúrate de tener la última versión del sistema

---

## 📝 Changelog

### Versión 1.0 (Login Offline)
- ✅ Login sin internet con credenciales guardadas
- ✅ Indicador visual de conexión
- ✅ Tabla de usuarios en IndexedDB con password hasheado
- ✅ Validación offline con bcrypt

### Versión 1.1 (Facturas Offline)
- ✅ Tabla facturas_offline en IndexedDB
- ✅ Guardar facturas sin internet
- ✅ Cola de sincronización (sync_queue)
- ✅ Sincronización automática al recuperar internet
- ✅ Limpieza de facturas sincronizadas

### Próximamente
- 🔄 Cotizaciones offline
- 🔄 Otros documentos (notas de crédito, recibos, etc.)
- 🔄 Sincronización bidireccional avanzada
- 🔄 Resolución de conflictos automática

---

**Desarrollado para Sistema AA** 🚀
