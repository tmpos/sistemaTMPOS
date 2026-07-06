# Guía de Uso: Productos Offline

## 📦 Descripción

Los productos se cargan automáticamente en IndexedDB cuando hay conexión a internet al entrar al login. Esto permite consultar productos incluso sin conexión.

---

## 🚀 Cómo Usar Productos Offline

### 1. Importar las Funciones

```javascript
import {
  buscarProductosOffline,
  getProductoOffline,
  getCachedTable
} from '@/composables/useOfflineDB'
```

---

### 2. Obtener Todos los Productos

```javascript
// En tu componente
const cargarProductos = async () => {
  try {
    const productos = await buscarProductosOffline()
    console.log(`${productos.length} productos encontrados`)
    return productos
  } catch (error) {
    console.error('Error cargando productos:', error)
    return []
  }
}
```

---

### 3. Buscar un Producto por Código

```javascript
const buscarPorCodigo = async (codigo) => {
  try {
    const producto = await getProductoOffline(codigo)

    if (producto) {
      console.log('Producto encontrado:', producto.nombre)
      return producto
    } else {
      console.log('Producto no encontrado')
      return null
    }
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}
```

---

### 4. Buscar Productos por Nombre

```javascript
const buscarPorNombre = async (nombre) => {
  try {
    // Busca productos que contengan el nombre (búsqueda flexible)
    const productos = await buscarProductosOffline('nombre', nombre)
    return productos
  } catch (error) {
    console.error('Error:', error)
    return []
  }
}
```

---

### 5. Componente Completo de Ejemplo

```vue
<template>
  <div class="productos-container">
    <h2>Buscar Productos</h2>

    <!-- Estado de conexión -->
    <div class="status-indicator" :class="isOnline ? 'online' : 'offline'">
      <i :class="isOnline ? 'pi pi-wifi' : 'pi pi-wifi-slash'"></i>
      {{ isOnline ? 'En línea' : 'Offline' }} - {{ productosDisponibles }} productos disponibles
    </div>

    <!-- Buscador -->
    <div class="search-box">
      <InputText
        v-model="busqueda"
        placeholder="Buscar por código o nombre..."
        @input="buscarProducto"
      />
    </div>

    <!-- Resultados -->
    <div class="resultados">
      <div v-if="cargando" class="loading">
        <i class="pi pi-spin pi-spinner"></i> Buscando...
      </div>

      <div v-else-if="resultados.length === 0" class="sin-resultados">
        No se encontraron productos
      </div>

      <div v-else class="lista-productos">
        <div
          v-for="producto in resultados"
          :key="producto.id"
          class="producto-item"
          @click="seleccionarProducto(producto)"
        >
          <div class="producto-info">
            <h4>{{ producto.nombre }}</h4>
            <p>Código: {{ producto.codigo }}</p>
            <p class="precio">RD$ {{ producto.precio }}</p>
            <p class="stock" :class="{ 'bajo-stock': producto.cantidad < 10 }">
              Stock: {{ producto.cantidad }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  buscarProductosOffline,
  getProductoOffline,
  hayInternet
} from '@/composables/useOfflineDB'
import { peticionesFetchOffline } from '@/funciones/funciones'

const busqueda = ref('')
const resultados = ref([])
const cargando = ref(false)
const productosDisponibles = ref(0)
const isOnline = ref(navigator.onLine)

// Buscar producto (online u offline automáticamente)
const buscarProducto = async () => {
  if (!busqueda.value.trim()) {
    resultados.value = []
    return
  }

  cargando.value = true

  try {
    if (hayInternet()) {
      // ONLINE: Buscar en servidor
      const response = await peticionesFetchOffline(
        'buscarProducto',
        'productos',
        busqueda.value
      )
      resultados.value = Array.isArray(response) ? response : [response]
    } else {
      // OFFLINE: Buscar en IndexedDB
      // Intentar buscar por código exacto primero
      let producto = await getProductoOffline(busqueda.value)

      if (producto) {
        resultados.value = [producto]
      } else {
        // Buscar por nombre (parcial)
        const productos = await buscarProductosOffline()
        resultados.value = productos.filter(p =>
          p.nombre?.toLowerCase().includes(busqueda.value.toLowerCase()) ||
          p.codigo?.toLowerCase().includes(busqueda.value.toLowerCase())
        )
      }
    }
  } catch (error) {
    console.error('Error buscando producto:', error)
    resultados.value = []
  } finally {
    cargando.value = false
  }
}

// Seleccionar producto
const seleccionarProducto = (producto) => {
  console.log('Producto seleccionado:', producto)
  // Aquí puedes emitir un evento o hacer lo que necesites
}

// Cargar contador de productos
const cargarContador = async () => {
  const productos = await buscarProductosOffline()
  productosDisponibles.value = productos.length
}

// Lifecycle
onMounted(async () => {
  await cargarContador()

  // Listener de conexión
  window.addEventListener('online', () => {
    isOnline.value = true
  })
  window.addEventListener('offline', () => {
    isOnline.value = false
  })
})
</script>

<style scoped>
.productos-container {
  padding: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-indicator.online {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #059669;
}

.status-indicator.offline {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #dc2626;
}

.search-box {
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6366f1;
}

.sin-resultados {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.producto-item {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.producto-item:hover {
  background: #f8fafc;
  border-color: #6366f1;
  transform: translateX(4px);
}

.producto-info h4 {
  margin: 0 0 0.5rem;
  color: #0f172a;
}

.producto-info p {
  margin: 0.25rem 0;
  color: #64748b;
  font-size: 0.9rem;
}

.precio {
  font-size: 1.1rem !important;
  font-weight: 700;
  color: #059669 !important;
}

.stock {
  font-weight: 600;
}

.stock.bajo-stock {
  color: #dc2626 !important;
}
</style>
```

---

## 🔍 Funciones Disponibles

### `buscarProductosOffline(criterio, valor)`

Busca productos en IndexedDB por cualquier campo.

**Parámetros:**
- `criterio` (opcional): Campo por el que buscar (`'codigo'`, `'nombre'`, etc.)
- `valor` (opcional): Valor a buscar

**Retorna:** Array de productos

**Ejemplos:**
```javascript
// Todos los productos
const todos = await buscarProductosOffline()

// Por código
const porCodigo = await buscarProductosOffline('codigo', 'PROD-001')

// Por nombre (búsqueda parcial)
const porNombre = await buscarProductosOffline('nombre', 'Laptop')
```

---

### `getProductoOffline(busqueda)`

Obtiene un producto específico por código o nombre exacto.

**Parámetros:**
- `busqueda`: Código o nombre del producto

**Retorna:** Objeto producto o `null`

**Ejemplo:**
```javascript
const producto = await getProductoOffline('PROD-001')
if (producto) {
  console.log(producto.nombre, producto.precio)
}
```

---

### `getCachedTable('productos')`

Obtiene todos los productos cacheados directamente.

**Retorna:** Array de productos

**Ejemplo:**
```javascript
import { getCachedTable } from '@/composables/useOfflineDB'

const productos = await getCachedTable('productos')
console.log(`${productos.length} productos disponibles`)
```

---

## 💡 Mejores Prácticas

### 1. Siempre verificar conexión

```javascript
import { hayInternet } from '@/composables/useOfflineDB'

const cargarProducto = async (codigo) => {
  if (hayInternet()) {
    // Buscar en servidor (datos frescos)
    return await peticionesFetchOffline('getDataByField', 'productos', 'codigo', codigo)
  } else {
    // Buscar offline (datos cacheados)
    return await getProductoOffline(codigo)
  }
}
```

### 2. Notificar al usuario del modo offline

```javascript
import { useToast } from 'primevue/usetoast'

const toast = useToast()

if (!hayInternet()) {
  toast.add({
    severity: 'info',
    summary: 'Modo Offline',
    detail: 'Mostrando productos guardados localmente',
    life: 3000
  })
}
```

### 3. Actualizar caché periódicamente

```javascript
// Actualizar productos cada vez que haya conexión
window.addEventListener('online', async () => {
  const productos = await peticionesFetchOffline('getDataAsArray', 'productos')
  await saveCacheTable('productos', productos)
  toast.add({
    severity: 'success',
    summary: 'Productos actualizados',
    detail: `${productos.length} productos sincronizados`,
    life: 3000
  })
})
```

---

## 📊 Estructura de Datos de Producto

Los productos cacheados tienen esta estructura típica:

```javascript
{
  id: 1,
  codigo: "PROD-001",
  nombre: "Laptop HP 15",
  descripcion: "Laptop empresarial",
  precio: 25000.00,
  precio_compra: 20000.00,
  cantidad: 15,
  categoria: "Electrónica",
  marca: "HP",
  unidad: "Unidad",
  itbis: "18",
  imagen: "ruta/imagen.jpg",
  estado: "Activado",
  created_at: "2024-01-15 10:30:00",
  updated_at: "2024-01-20 14:20:00"
}
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Punto de Venta Offline

```javascript
// Buscar producto al escanear código de barras
const escanearProducto = async (codigoBarras) => {
  const producto = await getProductoOffline(codigoBarras)

  if (producto) {
    if (producto.cantidad > 0) {
      agregarAlCarrito(producto)
    } else {
      alertaSinStock()
    }
  } else {
    alertaProductoNoEncontrado()
  }
}
```

### Caso 2: Catálogo de Productos

```javascript
// Mostrar catálogo completo offline
const cargarCatalogo = async () => {
  const productos = await buscarProductosOffline()

  // Agrupar por categoría
  const porCategoria = productos.reduce((acc, prod) => {
    if (!acc[prod.categoria]) acc[prod.categoria] = []
    acc[prod.categoria].push(prod)
    return acc
  }, {})

  return porCategoria
}
```

### Caso 3: Búsqueda con Sugerencias

```javascript
// Búsqueda predictiva
const buscarConSugerencias = async (texto) => {
  if (texto.length < 2) return []

  const productos = await buscarProductosOffline()

  return productos
    .filter(p =>
      p.nombre.toLowerCase().includes(texto.toLowerCase()) ||
      p.codigo.toLowerCase().includes(texto.toLowerCase())
    )
    .slice(0, 10) // Máximo 10 sugerencias
}
```

---

## ⚠️ Limitaciones y Consideraciones

1. **Primera carga requiere internet**: Los productos deben cargarse al menos una vez con conexión
2. **Datos pueden estar desactualizados offline**: Los precios/stock pueden cambiar mientras estás offline
3. **Capacidad limitada**: IndexedDB típicamente permite ~50MB por origen
4. **Sincronización manual**: Cambios offline no se reflejan en servidor hasta sincronizar

---

## 🔄 Sincronización

Los productos se sincronizan automáticamente:

- ✅ Al entrar al login con internet
- ✅ Al recuperar conexión después de estar offline
- ✅ Manualmente con `Ctrl+P` en login

---

## 📞 Próximos Pasos

Para funcionalidades avanzadas, puedes implementar:

1. **Filtros avanzados**: Buscar por rango de precios, categoría, etc.
2. **Ordenamiento**: Por nombre, precio, stock, etc.
3. **Imágenes offline**: Cachear imágenes de productos
4. **Búsqueda fuzzy**: Búsqueda tolerante a errores tipográficos

---

**Sistema AA - Productos Offline** 🚀
