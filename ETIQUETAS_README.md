# Sistema de Impresión de Etiquetas 🏷️

## Descripción
Sistema profesional para generar e imprimir etiquetas de productos con códigos de barras o QR, optimizado para impresoras térmicas de etiquetas.

## Características Principales

### ✨ Funcionalidades
- **Búsqueda Inteligente**: Busca productos por código de barras, IMEI, código o nombre
- **Códigos Flexibles**: Alterna entre código de barras y código QR
- **Soporte IMEI**: Para celulares, muestra y selecciona IMEIs individuales con:
  - Capacidad de almacenamiento
  - Estado de batería
  - Precio específico por unidad
- **Vista Previa en Tiempo Real**: Visualiza la etiqueta antes de imprimir
- **Múltiples Tamaños**: 4 tamaños de etiquetas configurables:
  - 50mm x 30mm (Pequeña)
  - 60mm x 40mm (Mediana)
  - 80mm x 50mm (Grande)
  - 100mm x 60mm (Extra Grande)
- **Impresión por Lotes**: Imprime múltiples copias de la misma etiqueta
- **Información Completa**:
  - Nombre de la empresa (opcional)
  - Nombre del producto
  - Marca y modelo (opcional)
  - Código de barras o QR
  - Precio
  - Especificaciones (capacidad y batería para celulares)

## Cómo Acceder

### Desde el Menú del Sistema
1. Inicia sesión en el sistema
2. Ve al menú de navegación
3. Busca la opción "Etiquetas" o "Imprimir Etiquetas"
4. También puedes acceder directamente mediante la URL: `/etiquetas`

## Cómo Usar

### 1️⃣ Buscar Producto
1. En el campo "Buscar Producto", ingresa:
   - Código de barras del producto
   - IMEI (para celulares)
   - Código interno
   - Nombre del producto (búsqueda parcial)
2. Presiona Enter o haz clic en "Buscar"
3. Si hay múltiples resultados, selecciona el producto deseado de la tabla

### 2️⃣ Configurar la Etiqueta

#### Para Productos Celulares:
1. **Seleccionar IMEI**: Si el producto es un celular, selecciona el IMEI específico del dropdown
   - Verás la capacidad (32GB, 64GB, etc.)
   - Verás el estado de batería (0-100%)
   - El precio se ajustará automáticamente

#### Opciones de Diseño:
1. **Tamaño de Etiqueta**: Selecciona el tamaño según tu impresora
2. **Tipo de Código**:
   - Código de Barras (mejor para lectores estándar)
   - Código QR (para lectores QR o smartphones)
3. **Mostrar nombre de empresa**: Marca/desmarca según necesites
4. **Mostrar marca y modelo**: Marca/desmarca según necesites
5. **Cantidad de Etiquetas**: Define cuántas copias imprimir (1-100)

### 3️⃣ Vista Previa
- Haz clic en "Vista Previa" para actualizar la visualización
- La vista previa se actualiza automáticamente al cambiar configuraciones
- Verifica que todos los datos se muestren correctamente

### 4️⃣ Imprimir
1. Asegúrate de que tu impresora de etiquetas esté conectada
2. Haz clic en "Imprimir Etiquetas"
3. Se abrirá una ventana de impresión del navegador
4. Selecciona tu impresora de etiquetas
5. Configura las preferencias de impresión:
   - Orientación: Portrait (Vertical)
   - Márgenes: Mínimos o Ninguno
   - Escala: 100%
6. Haz clic en "Imprimir"

## Casos de Uso

### 📱 Etiqueta para Celular
```
JTA SMART SYSTEMS
iPhone 13 Pro
APPLE • iPhone 13 Pro
📦 128GB ⚡ Batería 95%
[CÓDIGO DE BARRAS]
351234567890123
RD$ 45,000.00
```

### 🎧 Etiqueta para Accesorio
```
JTA SMART SYSTEMS
Audífonos Bluetooth Premium
SAMSUNG
[CÓDIGO QR]
1234567890
RD$ 1,500.00
```

## Recomendaciones de Impresión

### Configuración de Impresora
- **Tipo de Papel**: Etiquetas térmicas adhesivas
- **Densidad de Impresión**: Media a Alta
- **Velocidad**: Media (evita manchas)
- **Modo de Color**: Monocromo/Blanco y Negro

### Tamaños Recomendados por Tipo
- **Accesorios pequeños**: 50mm x 30mm
- **Productos estándar**: 60mm x 40mm
- **Celulares**: 80mm x 50mm
- **Productos premium**: 100mm x 60mm

## Solución de Problemas

### No encuentra el producto
- Verifica que el producto esté registrado en el sistema
- Asegúrate de escribir correctamente el código
- Intenta buscar por nombre usando palabras clave

### No aparecen IMEIs para celulares
- Verifica que el producto tenga IMEIs registrados
- Confirma que la categoría del producto sea "CELULARES"
- Revisa el módulo de IMEIs en el sistema

### La impresión sale cortada
- Ajusta el tamaño de etiqueta en la configuración
- Verifica que el tamaño seleccionado coincida con tus etiquetas físicas
- Reduce los márgenes en las preferencias de impresión

### El código de barras no escanea
- Usa el tipo "Código de Barras" en lugar de QR
- Aumenta el tamaño de la etiqueta
- Verifica que la impresora tenga buena densidad de impresión
- Asegúrate de que el código de barras del producto sea válido

### El código QR no se lee
- Aumenta el tamaño de la etiqueta
- Verifica que el código sea válido
- Usa una aplicación de lectura QR confiable

## Soporte Técnico

### Contacto
- **Sistema**: TM-POS v44.1.0
- **Autor**: Tomas Taveras
- **Website**: https://tmposrd.com
- **Email**: [Consulta en el sistema]

### Reportar Problemas
Si encuentras algún error o tienes sugerencias:
1. Ve a la sección de Soporte en el menú
2. Describe detalladamente el problema
3. Incluye capturas de pantalla si es posible

---

**¡Imprime etiquetas profesionales en segundos! 🚀**
