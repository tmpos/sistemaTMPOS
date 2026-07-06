# Tipos de Premios en la Ruleta

## 📋 Descripción General

El sistema de ruleta ahora soporta tres tipos diferentes de resultados, cada uno con su propio comportamiento y propósito:

## 🎁 Tipos Disponibles

### 1. Premio (tipo: `premio`)
**Icono:** 🎁
**Color de Tag:** Verde (success)
**Descripción:** Representa premios reales, tangibles o beneficios concretos.

**Ejemplos:**
- Descuento 10%
- Producto Gratis
- Vale de $100
- 2x1 en tu próxima compra

**Comportamiento:**
- Se guarda en la base de datos como ganador
- Se muestra mensaje de felicitaciones
- El cliente puede reclamar el premio con su número de factura
- **NO permite volver a participar** con la misma factura

---

### 2. Comodín (tipo: `comodin`)
**Icono:** 🔄
**Color de Tag:** Azul (info)
**Descripción:** Permite al participante girar la ruleta nuevamente.

**Ejemplos:**
- "Gira de Nuevo"
- "Segunda Oportunidad"
- "Bonus: Otro Intento"

**Comportamiento:**
- **NO se guarda en la base de datos**
- Muestra botón "Girar de Nuevo"
- El participante puede volver a girar inmediatamente
- En el siguiente giro puede caer en cualquier resultado (premio, mensaje o sin premio)
- **Es ideal para aumentar la emoción** sin dar premios costosos

---

### 3. Mensaje de Participación (tipo: `mensaje`)
**Icono:** 💬
**Color de Tag:** Naranja (warning)
**Descripción:** Mensajes de agradecimiento o motivación sin premio físico.

**Ejemplos:**
- "Sigue Participando"
- "Gracias por Participar"
- "La Próxima Será"
- "Mejor Suerte la Próxima Vez"

**Comportamiento:**
- Se guarda en la base de datos como participación
- Se muestra un mensaje de agradecimiento
- **NO da premio físico**, pero reconoce la participación
- **NO permite volver a participar** con la misma factura

---

## 📊 Distribución Recomendada

Para una experiencia equilibrada, se recomienda la siguiente distribución de probabilidades:

```
Total configurado: ~53%
- Premios reales (tipo: premio): 28%
  - Descuento 10%: 12%
  - Producto Gratis: 8%
  - Vale $100: 5%
  - Premio Especial: 3%

- Comodines (tipo: comodin): 10%
  - Gira de Nuevo: 10%

- Mensajes (tipo: mensaje): 15%
  - Sigue Participando: 15%

Espacios sin premio: ~47% (automático)
```

**Nota:** El sistema calcula automáticamente los espacios "sin premio" restando del 100% la suma de todas las probabilidades configuradas.

---

## 🎯 Estrategias de Uso

### Estrategia Generosa (Más engagement)
```
Premios reales: 25%
Comodines: 20%
Mensajes: 20%
Sin premio: 35%
```
✅ Más participación y emoción
❌ Mayor costo en premios

### Estrategia Equilibrada (Recomendada)
```
Premios reales: 28%
Comodines: 10%
Mensajes: 15%
Sin premio: 47%
```
✅ Balance entre engagement y costos
✅ Experiencia satisfactoria

### Estrategia Conservadora (Menos premios)
```
Premios reales: 15%
Comodines: 5%
Mensajes: 20%
Sin premio: 60%
```
✅ Menor costo en premios
❌ Menos emocionante para los participantes

---

## 💡 Consejos de Configuración

### Para Comodines:
- **No exageres:** 5-15% es suficiente
- Úsalos para mantener el interés sin dar premios costosos
- Son perfectos para crear momentos emocionantes

### Para Mensajes:
- **Sé positivo:** "Sigue Participando" mejor que "Perdiste"
- Usa descripciones motivadoras
- Mantén la experiencia positiva

### Para Premios Reales:
- Varía los valores: desde pequeños hasta especiales
- Asigna más probabilidad a premios de menor valor
- Los premios grandes deben tener probabilidad baja (2-5%)

---

## 🔧 Gestión en el Sistema

### Crear Nuevo Premio/Mensaje/Comodín:
1. Ve a **Ruleta de Premios → Gestionar Premios**
2. Haz clic en **"Nuevo Premio"**
3. Completa el formulario:
   - **Nombre:** Corto y atractivo
   - **Tipo:** Selecciona Premio, Comodín o Mensaje
   - **Descripción:** Detalles o instrucciones
   - **Color:** Para identificación visual en la ruleta
   - **Probabilidad:** Porcentaje de aparición (0-100)
   - **Estado:** Activo/Inactivo

### Ver en la Tabla:
- Cada registro muestra un **Tag de color** con su tipo
- **Verde** 🎁 = Premio
- **Azul** 🔄 = Comodín
- **Naranja** 💬 = Mensaje

### Iconos en la Ruleta:
- Durante el giro, cada segmento muestra su icono correspondiente
- Los participantes pueden identificar visualmente qué pueden ganar

---

## 📝 Base de Datos

### Tabla `premios_ruleta`
```sql
- id (INTEGER PRIMARY KEY)
- nombre (TEXT)
- descripcion (TEXT)
- tipo (TEXT) -- 'premio', 'comodin', 'mensaje'
- imagen (TEXT)
- color (TEXT)
- probabilidad (INTEGER)
- activo (INTEGER) -- 0 o 1
- created_at (INTEGER)
- updated_at (INTEGER)
```

### Tabla `ganadores_ruleta`
```sql
- id (INTEGER PRIMARY KEY)
- no_factura (TEXT)
- nombre_cliente (TEXT)
- almacen (TEXT)
- premio_ganado (TEXT) -- NULL si no ganó o si fue comodín
- premio_id (INTEGER)
- fecha_participacion (TEXT)
- hora_participacion (TEXT)
- created_at (INTEGER)
- updated_at (INTEGER)
```

**Importante:** Los comodines **NO se guardan** en `ganadores_ruleta`, permitiendo que el participante continúe girando.

---

## 🎨 Personalización Visual

Cada tipo tiene su propio diseño de resultado:

### Premio Real:
- Fondo: Gradiente morado-violeta
- Icono: Trofeo dorado
- Mensaje: "¡Felicidades!"

### Comodín:
- Fondo: Gradiente azul claro
- Icono: Flecha circular
- Mensaje: "¡Tienes otra oportunidad!"
- Botón: "Girar de Nuevo"

### Mensaje:
- Fondo: Gradiente rosa-rojo
- Icono: Burbuja de mensaje
- Mensaje: El configurado en el premio

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo tener múltiples comodines?**
R: Sí, pero la probabilidad total de comodines no debería superar el 15-20%.

**P: ¿Los comodines cuentan como participación?**
R: No, no se guardan en la base de datos para permitir el nuevo giro.

**P: ¿Un cliente puede ganar múltiples veces con comodines?**
R: En la misma sesión sí (si cae en otro comodín), pero cada factura solo puede participar una vez.

**P: ¿Qué pasa si la suma de probabilidades es mayor a 100%?**
R: El sistema lo permite, pero no habrá espacios "sin premio". Se recomienda mantener la suma bajo 80%.

**P: ¿Puedo desactivar premios temporalmente?**
R: Sí, marca el premio como "Inactivo" y no aparecerá en la ruleta.

---

## 🚀 Próximas Mejoras Sugeridas

1. **Límite de giros por comodín:** Evitar loops infinitos
2. **Estadísticas por tipo:** Ver cuántos premios, comodines y mensajes se dieron
3. **Horarios especiales:** Más probabilidad de premios en ciertos horarios
4. **Premios por categoría de cliente:** Diferentes ruletas según el monto de compra

---

**Última actualización:** Julio 2026
**Versión del sistema:** 49.5.0
