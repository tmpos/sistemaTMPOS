# 🎡 Instalación del Sistema de Ruleta - Guía Completa

## ✅ Archivos Creados

Se han creado los siguientes archivos en tu proyecto:

### 📁 Vistas (Views)
```
src/renderer/src/views/Ruleta/
├── Ruleta.vue                  # Vista principal - Girar ruleta
├── Premios.vue                 # Gestión de premios
└── ConfiguracionRuleta.vue     # Panel de administración
```

### 🧩 Componentes
```
src/renderer/src/components/
└── RuletaPremios.vue           # Componente visual de la ruleta
```

### 🛠️ Utilidades
```
src/renderer/src/utils/
└── inicializarRuleta.js        # Scripts de inicialización
```

### 🗄️ Base de Datos
```
database/migrations/
└── create_ruleta_tables.sql    # SQL de creación de tablas
```

### 📚 Documentación
```
./
├── RULETA_README.md            # Documentación completa
├── MENU_RULETA_EJEMPLO.md      # Guía para agregar al menú
└── INSTALACION_RULETA.md       # Este archivo
```

### ⚙️ Rutas
Las rutas ya fueron agregadas automáticamente a:
```
src/renderer/src/router/index.js
```

## 🚀 Pasos de Instalación

### Paso 1: Verificar Archivos
Todos los archivos ya fueron creados. Verifica que existan en las rutas mencionadas arriba.

### Paso 2: Inicializar Base de Datos

**Opción A: Usar el Panel de Configuración (Recomendado)**

1. Inicia tu aplicación
2. Navega a la ruta: `http://localhost:XXXX/ruleta/configuracion` (o `/ruleta/configuracion` si ya estás en la app)
3. Haz clic en el botón **"Inicializar Tablas"**
4. Espera a que aparezca el mensaje de éxito
5. El sistema creará las tablas y agregará 5 premios de ejemplo

**Opción B: Desde la Consola del Navegador**

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Ejecuta:
```javascript
window.api.ejecutarConsulta(`
  CREATE TABLE IF NOT EXISTS premios_ruleta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(500),
    color VARCHAR(7) NOT NULL DEFAULT '#FF6384',
    probabilidad INTEGER NOT NULL DEFAULT 10,
    activo INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => console.log('Tabla premios_ruleta creada'))

window.api.ejecutarConsulta(`
  CREATE TABLE IF NOT EXISTS ganadores_ruleta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    no_factura VARCHAR(50) NOT NULL,
    nombre_cliente VARCHAR(255) NOT NULL,
    almacen VARCHAR(100),
    premio_ganado VARCHAR(255),
    premio_id INTEGER,
    fecha_participacion DATE NOT NULL,
    hora_participacion TIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => console.log('Tabla ganadores_ruleta creada'))
```

**Opción C: SQL Manual**

Si tienes acceso directo a la base de datos SQLite:
1. Abre: `%APPDATA%/TM-POS/database/database.db`
2. Ejecuta el contenido del archivo: `database/migrations/create_ruleta_tables.sql`

### Paso 3: Agregar al Menú (Opcional)

Agrega la ruleta al menú de navegación principal. Consulta el archivo `MENU_RULETA_EJEMPLO.md` para instrucciones detalladas.

Ejemplo básico:
```javascript
{
  label: 'Ruleta de Premios',
  icon: 'pi pi-gift',
  items: [
    { label: 'Girar Ruleta', icon: 'pi pi-spin', to: '/ruleta' },
    { label: 'Gestionar Premios', icon: 'pi pi-cog', to: '/ruleta/premios' },
    { label: 'Configuración', icon: 'pi pi-wrench', to: '/ruleta/configuracion' }
  ]
}
```

### Paso 4: Configurar Premios

1. Navega a `/ruleta/premios`
2. Haz clic en **"Nuevo Premio"**
3. Configura:
   - **Nombre**: Nombre del premio
   - **Descripción**: Detalles
   - **Color**: Color del segmento
   - **Probabilidad**: % de ganar (0-100)
   - **Activo**: Marcar como activo
4. Guarda el premio
5. Repite para crear más premios

**Importante sobre Probabilidades:**
- La suma de todas las probabilidades debe ser < 100%
- El resto se asigna automáticamente a "Sin Premio"
- Ejemplo: 5 premios con 10% cada uno = 50% total, el 50% restante será "sin premio"

### Paso 5: Probar el Sistema

1. Navega a `/ruleta`
2. Ingresa un número de factura existente
3. Haz clic en **"Verificar y Girar"**
4. Revisa la información de la factura
5. Haz clic en **"Continuar a la Ruleta"**
6. Haz clic en el botón central para girar
7. Espera el resultado (tarda ~5 segundos)
8. El resultado se guarda automáticamente

## 🎯 Rutas Disponibles

| Ruta | Descripción |
|------|-------------|
| `/ruleta` | Vista principal para girar la ruleta |
| `/ruleta/premios` | Gestión de premios (CRUD) |
| `/ruleta/configuracion` | Panel de administración y diagnóstico |

## 🗄️ Estructura de Base de Datos

### Tabla: premios_ruleta
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
nombre          VARCHAR(255) NOT NULL
descripcion     TEXT
imagen          VARCHAR(500)
color           VARCHAR(7) NOT NULL DEFAULT '#FF6384'
probabilidad    INTEGER NOT NULL DEFAULT 10
activo          INTEGER NOT NULL DEFAULT 1
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Tabla: ganadores_ruleta
```sql
id                      INTEGER PRIMARY KEY AUTOINCREMENT
no_factura              VARCHAR(50) NOT NULL
nombre_cliente          VARCHAR(255) NOT NULL
almacen                 VARCHAR(100)
premio_ganado           VARCHAR(255)
premio_id               INTEGER (FK → premios_ruleta.id)
fecha_participacion     DATE NOT NULL
hora_participacion      TIME NOT NULL
created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Índices
```sql
idx_ganadores_no_factura    ON ganadores_ruleta(no_factura)
idx_ganadores_fecha         ON ganadores_ruleta(fecha_participacion)
idx_premios_activo          ON premios_ruleta(activo)
```

## 🎨 Personalización

### Cambiar Duración del Giro
En `RuletaPremios.vue`, línea ~17:
```javascript
const duracionGiro = 5 // Cambiar a los segundos deseados
```

### Permitir Múltiples Participaciones por Factura
En `Ruleta.vue`, agregar:
```javascript
const permitirReintento = ref(true)
```

### Cambiar Colores Predefinidos
En `RuletaPremios.vue`:
```javascript
const coloresPredefinidos = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
  // Agrega más colores aquí
]
```

### Modificar Tamaño de la Ruleta
En `RuletaPremios.vue`:
```javascript
const canvasSize = 500 // Cambiar el tamaño en píxeles
```

## 🔍 Verificar Instalación

### Checklist de Verificación

- [ ] ✅ Archivos de vistas creados
- [ ] ✅ Componente de ruleta creado
- [ ] ✅ Rutas agregadas al router
- [ ] ✅ Tablas de base de datos creadas
- [ ] ✅ Premios de ejemplo insertados
- [ ] ✅ Se puede acceder a `/ruleta/configuracion`
- [ ] ✅ Se puede gestionar premios en `/ruleta/premios`
- [ ] ✅ Se puede girar la ruleta en `/ruleta`
- [ ] ✅ (Opcional) Menú de navegación actualizado

### Comando de Verificación Rápida

Ejecuta en la consola del navegador (F12):
```javascript
// Verificar tablas
window.api.ejecutarConsulta("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%ruleta%'")
  .then(tables => console.log('Tablas:', tables))

// Contar premios
window.api.ejecutarConsulta("SELECT COUNT(*) as count FROM premios_ruleta")
  .then(result => console.log('Total premios:', result[0].count))

// Verificar premios activos
window.api.ejecutarConsulta("SELECT * FROM premios_ruleta WHERE activo = 1")
  .then(premios => console.log('Premios activos:', premios))
```

## 🐛 Solución de Problemas

### Error: "Tabla no existe"
- **Causa**: Las tablas no fueron inicializadas
- **Solución**: Ve a `/ruleta/configuracion` y haz clic en "Inicializar Tablas"

### Error: "No hay premios activos"
- **Causa**: No hay premios marcados como activos
- **Solución**: Ve a `/ruleta/premios` y activa al menos un premio

### La ruleta no gira
- **Causa**: Problema con el canvas o falta de premios
- **Solución**:
  1. Verifica la consola del navegador (F12) por errores
  2. Asegúrate de que haya premios activos
  3. Recarga la página

### Factura no encontrada
- **Causa**: El número de factura no existe o tiene espacios
- **Solución**: Verifica que la factura exista en la tabla `facturas`

### Error al guardar ganador
- **Causa**: Problema con la base de datos
- **Solución**: Verifica permisos de escritura en `%APPDATA%/TM-POS/database/`

## 📞 Soporte

Si encuentras problemas:

1. **Revisa la consola del navegador** (F12 → Console)
2. **Verifica el estado** en `/ruleta/configuracion`
3. **Consulta la documentación** en `RULETA_README.md`
4. **Revisa los logs** en el panel de configuración

## 🎉 ¡Listo!

Si seguiste todos los pasos, tu sistema de ruleta debería estar completamente funcional.

### Próximos Pasos Recomendados:

1. ✅ Personalizar los premios según tus necesidades
2. ✅ Configurar las probabilidades adecuadamente
3. ✅ Agregar la ruleta al menú principal
4. ✅ Probar con varias facturas
5. ✅ Revisar el historial de ganadores
6. ✅ (Opcional) Personalizar colores y duración

---

**¡Disfruta de tu nuevo sistema de ruleta de premios!** 🎊

**Versión:** 1.0.0
**Fecha:** 2026-07-03
**Compatible con:** TM-POS (Vue 3 + Electron + SQLite)
