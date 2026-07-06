# 🎡 Sistema de Ruleta de Premios

Sistema completo de ruleta de premios integrado con el sistema de facturas del POS TM-POS.

## 📋 Características

- ✅ Gestión completa de premios (crear, editar, eliminar)
- ✅ Ruleta visual animada con probabilidades configurables
- ✅ Integración con sistema de facturas existente
- ✅ Historial de ganadores
- ✅ Espacios "sin premio" automáticos
- ✅ Validación de participación única por factura
- ✅ Base de datos SQLite
- ✅ Exportación de ganadores (próximamente)

## 🚀 Instalación

### 1. Inicializar las Tablas de Base de Datos

Antes de usar la ruleta por primera vez, necesitas inicializar las tablas en la base de datos.

**Opción A: Desde la Consola del Navegador**

1. Abre la aplicación y presiona `F12` para abrir DevTools
2. Ve a la pestaña "Console"
3. Ejecuta el siguiente código:

```javascript
import { inicializarTablasRuleta } from './src/renderer/src/utils/inicializarRuleta.js'
inicializarTablasRuleta().then(result => console.log(result))
```

**Opción B: Ejecutar SQL Manualmente**

Puedes ejecutar el archivo SQL directamente en tu base de datos SQLite:
- Ubicación del archivo: `database/migrations/create_ruleta_tables.sql`
- Ubicación de la base de datos: `%APPDATA%/TM-POS/database/database.db`

**Opción C: Desde un Componente Vue**

Puedes agregar un botón de inicialización en cualquier componente:

```vue
<script setup>
import { inicializarTablasRuleta } from '@/utils/inicializarRuleta.js'

const inicializar = async () => {
  const result = await inicializarTablasRuleta()
  console.log(result)
}
</script>

<template>
  <Button @click="inicializar" label="Inicializar Ruleta" />
</template>
```

## 📂 Estructura de Archivos

```
src/renderer/src/
├── views/
│   └── Ruleta/
│       ├── Ruleta.vue          # Vista principal - Ingresar factura y girar
│       └── Premios.vue         # Gestión de premios
├── components/
│   └── RuletaPremios.vue       # Componente visual de la ruleta
└── utils/
    └── inicializarRuleta.js    # Script de inicialización

database/
└── migrations/
    └── create_ruleta_tables.sql # SQL de creación de tablas
```

## 🎯 Uso del Sistema

### 1. Gestionar Premios

**Ruta:** `/ruleta/premios`

En esta vista puedes:
- Crear nuevos premios
- Editar premios existentes
- Eliminar premios
- Activar/Desactivar premios
- Configurar:
  - **Nombre del premio**: Texto que se mostrará en la ruleta
  - **Descripción**: Detalles del premio
  - **Imagen**: URL de imagen (opcional)
  - **Color**: Color del segmento en la ruleta
  - **Probabilidad**: Porcentaje de probabilidad (0-100)
  - **Estado**: Activo/Inactivo

**Nota sobre Probabilidades:**
- La suma de todas las probabilidades debe ser menor a 100%
- El porcentaje restante se asigna automáticamente a espacios "sin premio"
- Ejemplo: Si tienes 5 premios con 10% cada uno (total 50%), el 50% restante será "sin premio"

### 2. Girar la Ruleta

**Ruta:** `/ruleta`

Proceso:
1. **Ingresar número de factura**: El sistema verificará que la factura exista
2. **Mostrar información de la factura**: Se muestra los datos del cliente y la compra
3. **Validación de participación**: Se verifica si la factura ya participó anteriormente
4. **Girar la ruleta**: Al hacer clic en "Continuar a la Ruleta" se muestra la ruleta
5. **Resultado**: La ruleta gira y cae en un premio o "sin premio"
6. **Guardar resultado**: El resultado se guarda automáticamente en la base de datos

### 3. Ver Historial de Ganadores

Desde la vista principal de la ruleta (`/ruleta`), haz clic en el botón **"Ver Ganadores"** para:
- Ver lista completa de participaciones
- Filtrar por cliente, factura o premio
- Ver fechas y horas de participación
- Exportar a Excel (próximamente)

## 🗄️ Estructura de Base de Datos

### Tabla: `premios_ruleta`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID autoincremental (PK) |
| nombre | VARCHAR(255) | Nombre del premio |
| descripcion | TEXT | Descripción detallada |
| imagen | VARCHAR(500) | URL de la imagen |
| color | VARCHAR(7) | Color hexadecimal (#RRGGBB) |
| probabilidad | INTEGER | Probabilidad de ganar (0-100) |
| activo | INTEGER | 1=Activo, 0=Inactivo |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de última actualización |

### Tabla: `ganadores_ruleta`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID autoincremental (PK) |
| no_factura | VARCHAR(50) | Número de factura |
| nombre_cliente | VARCHAR(255) | Nombre del cliente |
| almacen | VARCHAR(100) | Almacén de la factura |
| premio_ganado | VARCHAR(255) | Nombre del premio (NULL si no ganó) |
| premio_id | INTEGER | ID del premio (FK) |
| fecha_participacion | DATE | Fecha de participación |
| hora_participacion | TIME | Hora de participación |
| created_at | DATETIME | Timestamp de creación |
| updated_at | DATETIME | Timestamp de actualización |

## 🎨 Personalización

### Cambiar Colores de la Ruleta

Edita los colores en el componente `RuletaPremios.vue`:

```javascript
const coloresPredefinidos = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
]
```

### Modificar Duración del Giro

En `RuletaPremios.vue`:

```javascript
const duracionGiro = 5 // segundos (cambia este valor)
```

### Permitir Múltiples Participaciones

En `Ruleta.vue`:

```javascript
const permitirReintento = ref(true) // Cambiar a true
```

## 🔧 Configuración Avanzada

### Algoritmo de Selección de Ganador

El sistema usa un algoritmo de selección ponderada basado en las probabilidades configuradas:

1. Se crean segmentos en la ruleta proporcionales a las probabilidades
2. Se mezclan aleatoriamente para mejor distribución visual
3. Al girar, se selecciona un segmento basado en peso estadístico
4. La animación se calcula para que la ruleta pare en el segmento seleccionado

### Integración con Facturación

El sistema se integra automáticamente con:
- Tabla `facturas`: Para validar que la factura existe
- Campos utilizados:
  - `no_factura`: Identificador único
  - `nombre_cliente`: Nombre del participante
  - `almacen`: Ubicación de la transacción
  - `fecha_emision`: Fecha de la factura
  - `total`: Monto de la compra

## 📱 Agregar al Menú de Navegación

Para agregar la ruleta al menú principal de la aplicación, edita el archivo de configuración del menú y agrega:

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
    }
  ]
}
```

## 🐛 Solución de Problemas

### La ruleta no gira
- Verifica que haya premios activos en la base de datos
- Abre DevTools (F12) y revisa la consola por errores
- Asegúrate de que las tablas estén inicializadas correctamente

### No se encuentra la factura
- Verifica que el número de factura esté escrito correctamente
- Asegúrate de que la factura existe en la tabla `facturas`
- Revisa que no tenga espacios adicionales

### Error al guardar ganador
- Verifica la conexión con la base de datos
- Revisa los permisos de escritura en la carpeta de la base de datos
- Consulta los logs en DevTools Console

## 📊 Reportes y Estadísticas (Próximamente)

Funcionalidades planificadas:
- Dashboard de estadísticas de premios
- Análisis de participación por cliente
- Reportes de premios más populares
- Gráficos de distribución de ganadores
- Exportación avanzada a Excel/PDF

## 🔐 Seguridad

- Las facturas solo pueden participar una vez (configurable)
- Validación de existencia de factura antes de participar
- Auditoría completa con timestamps
- No se pueden modificar resultados guardados

## 📞 Soporte

Para preguntas o problemas:
1. Revisa este documento
2. Consulta los logs en la consola del navegador (F12)
3. Verifica la base de datos SQLite directamente

## 🎉 ¡Listo para Usar!

Una vez inicializadas las tablas, el sistema está listo para usarse. Los premios de ejemplo se crean automáticamente en la primera inicialización.

---

**Desarrollado para TM-POS**
**Versión: 1.0.0**
**Última actualización: 2026-07-03**
