# 🧪 Prueba Offline - Paso a Paso

Sigue estos pasos EXACTAMENTE y reporta en qué paso falla.

---

## ✅ PASO 1: Limpiar Todo

1. Abre **DevTools** (F12)
2. Ve a la pestaña **Application** (o Aplicación)
3. En el menú izquierdo, busca **IndexedDB**
4. Haz clic derecho en `sistemaAA_offline` → **Delete database**
5. En **Local Storage**, busca tu dominio y limpia:
   - `offline_cache_timestamp`
   - `offline_cache_tables`
6. **Recarga la página** (F5)

**Resultado esperado:** Todo limpio, sin datos offline

---

## ✅ PASO 2: Login CON Internet

1. **Asegúrate de tener INTERNET activo**
2. Abre la **Consola** (F12 > Console)
3. **Limpia la consola** (icono de prohibido o Ctrl+L)
4. Ve a la página de **Login**
5. **Ingresa credenciales** y haz login

### 🔍 Busca en la consola:

Debes ver estos mensajes en ESTE ORDEN:

```
[Login] Cargando datos offline en segundo plano...
[Login] 📥 Datos descargados del servidor:
  - Productos: 500  (o el número que tengas)
  - Clientes: X
  - Usuarios: X
[OfflineDB] productos: 500 registros cargados
[OfflineDB] clientes: X registros cargados
[Login] ✅ Datos cacheados exitosamente en IndexedDB: {productos: 500, clientes: X, ...}
```

### 📸 Captura de pantalla de la consola

**Si NO ves estos mensajes:**
- ❌ **Los productos NO se cargaron**
- Reporta qué mensajes SÍ aparecen
- Busca mensajes de ERROR (en rojo)

**Si SÍ ves los mensajes:**
- ✅ **Continúa al PASO 3**

---

## ✅ PASO 3: Verificar IndexedDB

En la **Consola**, ejecuta:

```javascript
// Verificar productos en IndexedDB
const { getCachedTable } = await import('./src/composables/useOfflineDB.js')
const productos = await getCachedTable('productos')
console.log(`✅ TOTAL PRODUCTOS EN INDEXEDDB: ${productos.length}`)

if (productos.length > 0) {
  console.log('✅ Primeros 3 productos:')
  console.table(productos.slice(0, 3).map(p => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    almacen: p.almacen
  })))
} else {
  console.error('❌ NO HAY PRODUCTOS en IndexedDB')
}
```

**Resultado esperado:**

```
✅ TOTAL PRODUCTOS EN INDEXEDDB: 500
✅ Primeros 3 productos:
(tabla con 3 productos)
```

**Si muestra 0 productos:**
- ❌ **PROBLEMA:** Los productos no se guardaron en IndexedDB
- Verifica que el PASO 2 haya mostrado los mensajes correctos
- Revisa si hay errores en consola

**Si muestra productos:**
- ✅ **Continúa al PASO 4**

---

## ✅ PASO 4: Desconectar Internet

1. **Desconecta WiFi o Ethernet**
2. En la **Consola**, ejecuta:

```javascript
console.log('Estado de conexión:', navigator.onLine ? '✅ ONLINE' : '❌ OFFLINE')
```

**Resultado esperado:**

```
Estado de conexión: ❌ OFFLINE
```

**Si muestra ONLINE:**
- ❌ **No estás realmente offline**
- Desconecta la conexión físicamente
- Verifica de nuevo

**Si muestra OFFLINE:**
- ✅ **Continúa al PASO 5**

---

## ✅ PASO 5: Ir a Vender.vue (OFFLINE)

1. **Navega a** `/vender` (o la ruta de tu sistema de ventas)
2. **Limpia la consola** (Ctrl+L)
3. En la **Consola**, ejecuta:

```javascript
console.log('=== ESTADO AL ENTRAR A VENDER ===')
console.log('Online:', navigator.onLine)
console.log('=================================')
```

**Resultado esperado:**

```
=== ESTADO AL ENTRAR A VENDER ===
Online: false
=================================
```

---

## ✅ PASO 6: Buscar un Producto (CRÍTICO)

1. Haz clic en el **campo de búsqueda de productos**
2. **Limpia la consola**
3. Escribe algo en el buscador (ej: "laptop")

### 🔍 Busca en la consola:

Debes ver ESTA SECUENCIA:

```
[peticionesFetchOffline] getDataAsArrayLazy - offline: true, tabla: productos
[peticionesFetchOffline] opciones: {limit: 40, offset: 0, search: "laptop", ...}
[peticionesFetchOffline] Usando IndexedDB
[OfflineDB] getDataAsArrayLazy tabla: productos, opciones: {...}
[OfflineDB] ✅ getDataAsArrayLazy productos: 10/500 registros retornados
[OfflineDB] Resultado: {data: Array(10), total: 500, ...}
[peticionesFetchOffline] Respuesta de IndexedDB: {data: Array(10), total: 500, ...}
```

### 📸 Captura de pantalla de la consola

**Si VES estos mensajes:**
- ✅ **Los productos se están buscando correctamente offline**
- Deberían aparecer en el autocomplete
- **Continúa al PASO 7**

**Si NO ves estos mensajes:**
- ❌ **PROBLEMA EN LA BÚSQUEDA**
- Reporta qué mensajes SÍ aparecen
- Busca errores (en rojo)

---

## ✅ PASO 7: Seleccionar Producto

1. De las sugerencias que aparecen, **selecciona un producto**
2. **Verifica** si se agrega al carrito

**Resultado esperado:**
- El producto se agrega al carrito
- Puedes ver precio, cantidad, etc.

**Si NO se agrega:**
- ❌ **Problema en selección**
- Copia y pega TODO lo que aparece en la consola

---

## ✅ PASO 8: Crear Factura Offline

1. Agrega al menos **1 producto** al carrito
2. Selecciona un **cliente** (si es necesario)
3. Haz clic en **Guardar Factura** (o el botón equivalente)
4. **Observa la consola**

**Si se guarda:**
- ✅ **Factura guardada offline**
- Debe aparecer en `facturas_offline` en IndexedDB

**Si NO se guarda:**
- ❌ **Error guardando factura**
- Copia todo el error de la consola

---

## ✅ PASO 9: Verificar Factura Guardada

En la **Consola**, ejecuta:

```javascript
const { getFacturasPendientesSincronizacion } = await import('./src/composables/useOfflineDB.js')
const facturasOffline = await getFacturasPendientesSincronizacion()
console.log(`📄 Facturas offline pendientes: ${facturasOffline.length}`)

if (facturasOffline.length > 0) {
  console.table(facturasOffline.map(f => ({
    id: f.id,
    numero: f.numero_factura,
    cliente: f.cliente,
    total: f.total,
    estado: f.estado
  })))
}
```

**Resultado esperado:**
- Ver las facturas guardadas offline

---

## ✅ PASO 10: Reconectar y Sincronizar

1. **Reconecta internet**
2. **Espera 5 segundos**
3. **Observa las notificaciones**

**Debe aparecer:**
```
✅ Conexión restaurada
✅ Sincronizando datos pendientes...
✅ X factura(s) sincronizada(s)
```

---

## 📋 CHECKLIST FINAL

Marca cada paso que funcionó:

- [ ] PASO 1: ✅ Datos limpiados
- [ ] PASO 2: ✅ Login con mensajes correctos
- [ ] PASO 3: ✅ Productos en IndexedDB
- [ ] PASO 4: ✅ Modo offline activado
- [ ] PASO 5: ✅ Entró a Vender.vue offline
- [ ] PASO 6: ✅ Búsqueda funcionó (VER LOGS)
- [ ] PASO 7: ✅ Producto se agregó al carrito
- [ ] PASO 8: ✅ Factura guardada offline
- [ ] PASO 9: ✅ Factura visible en IndexedDB
- [ ] PASO 10: ✅ Sincronización automática

---

## 🚨 Si algo falla, reporta:

```
===== REPORTE DE ERROR =====

Falló en el PASO: [NÚMERO]

Mensajes en consola:
[COPIAR TODO]

Errores (en rojo):
[COPIAR TODO]

Pantalla: [CAPTURA]

============================
```

---

**Con estos logs detallados, podré identificar EXACTAMENTE dónde está el problema** 🔍
