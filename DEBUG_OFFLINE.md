# 🔍 Debug: Productos Offline en Vender.vue

## Script de Diagnóstico

Abre la **Consola del Navegador** (F12 > Console) y ejecuta estos comandos paso a paso:

---

## 1️⃣ Verificar si hay productos en IndexedDB

```javascript
// Importar función
const { getCachedTable } = await import('./src/composables/useOfflineDB.js')

// Ver productos guardados
const productos = await getCachedTable('productos')
console.log(`📦 Total productos en IndexedDB: ${productos.length}`)

// Ver primeros 3 productos
if (productos.length > 0) {
  console.table(productos.slice(0, 3))
} else {
  console.error('❌ NO HAY PRODUCTOS en IndexedDB')
}
```

**Resultado esperado:** Debería mostrar el número de productos guardados (ej: 500)

---

## 2️⃣ Verificar estado de conexión

```javascript
// Ver si detecta offline
console.log('🌐 Estado de conexión:')
console.log('navigator.onLine:', navigator.onLine)
console.log(navigator.onLine ? '✅ ONLINE' : '❌ OFFLINE')
```

**Resultado esperado:** Debe mostrar el estado correcto de tu conexión

---

## 3️⃣ Probar función getDataAsArrayLazy offline

```javascript
// Importar función
const { getDataAsArrayLazy, initOfflineDB } = await import('./src/composables/useOfflineDB.js')

// Inicializar BD
initOfflineDB()

// Buscar productos
const resultado = await getDataAsArrayLazy('productos', {
  limit: 10,
  offset: 0,
  search: '',
  searchFields: ['nombre', 'codigo'],
  orderBy: 'nombre',
  orderDir: 'ASC'
})

console.log('🔍 Resultado de búsqueda:')
console.log('Total:', resultado.total)
console.log('Registros:', resultado.data.length)
console.table(resultado.data.slice(0, 3))
```

**Resultado esperado:** Debe retornar productos de IndexedDB

---

## 4️⃣ Probar peticionesFetchOffline

```javascript
// Importar función
const { peticionesFetchOffline } = await import('./src/funciones/funciones.js')

// Probar getDataAsArrayLazy
const response = await peticionesFetchOffline('getDataAsArrayLazy', 'productos', {
  limit: 10,
  offset: 0,
  search: 'laptop',
  searchFields: ['nombre', 'codigo'],
  orderBy: 'nombre',
  orderDir: 'ASC'
})

console.log('📡 Respuesta de peticionesFetchOffline:')
console.log('Tipo:', typeof response)
console.log('Es array?', Array.isArray(response))
console.log('Tiene .data?', response && 'data' in response)
console.log('Response:', response)
```

**Resultado esperado:** Debe retornar `{ data: [...], total: X }`

---

## 5️⃣ Verificar que se cargaron los productos al hacer login

```javascript
// Ver timestamp de última carga
const ultimaCarga = localStorage.getItem('offline_cache_timestamp')
if (ultimaCarga) {
  const fecha = new Date(parseInt(ultimaCarga))
  console.log('📅 Última carga de productos:', fecha.toLocaleString())
} else {
  console.error('❌ NO SE HAN CARGADO productos todavía')
}

// Ver tablas cacheadas
const tablas = localStorage.getItem('offline_cache_tables')
if (tablas) {
  console.log('📋 Tablas cacheadas:', JSON.parse(tablas))
} else {
  console.error('❌ NO HAY tablas cacheadas')
}
```

---

## 6️⃣ Verificar IndexedDB directamente

```javascript
// Abrir IndexedDB
const request = indexedDB.open('sistemaAA_offline')

request.onsuccess = (event) => {
  const db = event.target.result

  console.log('💾 Base de datos IndexedDB:')
  console.log('Nombre:', db.name)
  console.log('Versión:', db.version)
  console.log('Object Stores:', [...db.objectStoreNames])

  // Contar registros en productos
  const transaction = db.transaction(['productos'], 'readonly')
  const store = transaction.objectStore('productos')
  const countRequest = store.count()

  countRequest.onsuccess = () => {
    console.log(`📦 Productos en store 'productos': ${countRequest.result}`)
  }
}

request.onerror = (error) => {
  console.error('❌ Error abriendo IndexedDB:', error)
}
```

---

## 7️⃣ Simular búsqueda como en Vender.vue

```javascript
// Simular exactamente lo que hace Vender.vue
const { peticionesFetchOffline } = await import('./src/funciones/funciones.js')

console.log('🔍 Simulando búsqueda en Vender.vue...')

// Desconectar (simular offline)
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false
})

console.log('Estado: OFFLINE simulado')

const busqueda = await peticionesFetchOffline('getDataAsArrayLazy', 'productos', {
  limit: 40,
  offset: 0,
  search: '',
  searchFields: ['nombre', 'codigo', 'codigo_barra'],
  orderBy: 'nombre',
  orderDir: 'ASC',
  filtroCampo: 'almacen',
  filtroValor: 'ALMACEN PRINCIPAL' // CAMBIAR POR TU ALMACÉN
})

console.log('Resultado búsqueda:', busqueda)
console.log('Productos encontrados:', busqueda?.data?.length || 0)

if (busqueda?.data?.length > 0) {
  console.log('✅ FUNCIONA! Primeros 3 productos:')
  console.table(busqueda.data.slice(0, 3))
} else {
  console.error('❌ NO FUNCIONA - No se encontraron productos')
}

// Restaurar online
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})
```

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: "NO HAY PRODUCTOS en IndexedDB"

**Causa:** No se cargaron al hacer login

**Solución:**
1. Con internet activo, ir al login
2. Hacer login
3. Esperar notificación: "X productos y X registros listos para uso offline"
4. Ejecutar test 1 de nuevo

---

### Problema 2: "La función no existe"

**Error:** `getDataAsArrayLazy is not a function`

**Solución:**
```javascript
// Verificar que existe la función
const module = await import('./src/composables/useOfflineDB.js')
console.log('Funciones disponibles:', Object.keys(module))
```

---

### Problema 3: "response.data is undefined"

**Causa:** El formato de respuesta no es el esperado

**Solución:**
```javascript
// Ver qué está retornando
const response = await peticionesFetchOffline('getDataAsArrayLazy', 'productos', {})
console.log('Tipo de response:', typeof response)
console.log('Claves:', Object.keys(response || {}))
console.log('Response completo:', response)
```

---

### Problema 4: "Filtra por almacén y no encuentra nada"

**Causa:** El nombre del almacén no coincide

**Solución:**
```javascript
// Ver almacenes disponibles
const { getCachedTable } = await import('./src/composables/useOfflineDB.js')
const productos = await getCachedTable('productos')

// Ver almacenes únicos
const almacenes = [...new Set(productos.map(p => p.almacen))]
console.log('Almacenes en productos:', almacenes)

// Contar por almacén
almacenes.forEach(almacen => {
  const count = productos.filter(p => p.almacen === almacen).length
  console.log(`${almacen}: ${count} productos`)
})
```

---

## 📋 Checklist de Verificación

Marca cada paso:

- [ ] **Test 1:** ✅ Hay productos en IndexedDB (> 0)
- [ ] **Test 2:** ✅ Detecta correctamente online/offline
- [ ] **Test 3:** ✅ getDataAsArrayLazy retorna productos
- [ ] **Test 4:** ✅ peticionesFetchOffline funciona offline
- [ ] **Test 5:** ✅ Hay timestamp de última carga
- [ ] **Test 6:** ✅ IndexedDB tiene productos
- [ ] **Test 7:** ✅ Simulación de búsqueda funciona

---

## 🔧 Si TODO falla

### Opción 1: Limpiar y recargar

```javascript
// Borrar toda la BD offline
indexedDB.deleteDatabase('sistemaAA_offline')

// Limpiar localStorage
localStorage.removeItem('offline_cache_timestamp')
localStorage.removeItem('offline_cache_tables')

// Recargar página
location.reload()

// Con internet, hacer login de nuevo
```

### Opción 2: Verificar versión de Dexie

```javascript
// Ver si Dexie está disponible
console.log('Dexie version:', typeof Dexie !== 'undefined' ? 'OK' : 'NO DISPONIBLE')
```

### Opción 3: Ver errores en Network

1. Abrir DevTools > Network
2. Filtrar por "XHR" o "Fetch"
3. Intentar buscar producto
4. Ver si hay errores 404, 500, etc.

---

## 📞 Reportar Problema

Si después de todos los tests sigue sin funcionar, copia y pega este reporte:

```
===== REPORTE DE DEBUG =====

Test 1 - Productos en IndexedDB: [PONER NÚMERO]
Test 2 - Estado conexión: [ONLINE/OFFLINE]
Test 3 - getDataAsArrayLazy: [OK/ERROR]
Test 4 - peticionesFetchOffline: [OK/ERROR]
Test 5 - Timestamp carga: [PONER FECHA o "NO EXISTE"]
Test 6 - IndexedDB stores: [PONER LISTA]
Test 7 - Simulación búsqueda: [OK/ERROR]

Errores en consola:
[COPIAR ERRORES AQUÍ]

============================
```

---

**Sistema AA - Debug Offline** 🔧
