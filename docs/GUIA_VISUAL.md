# Guia visual del sistema

Esta guia define reglas de interfaz para que las pantallas nuevas y existentes se sientan como un solo producto profesional.

## Principios

- Priorizar rapidez de trabajo sobre decoracion.
- Mostrar informacion densa, ordenada y escaneable.
- Usar los mismos patrones para filtros, tablas, formularios, modales y estados.
- Evitar pantallas con estilos aislados si ya existe un patron funcional.

## Estructura de pantalla

Cada pantalla administrativa debe seguir este orden:

1. Encabezado compacto con titulo, descripcion corta y acciones primarias.
2. Barra de filtros/busqueda.
3. Tabla o contenido principal.
4. Modales para crear, editar o confirmar acciones.

Patron recomendado:

```vue
<main class="tm-page">
  <section class="tm-page-header">
    <div>
      <p class="tm-eyebrow">Modulo</p>
      <h1>Titulo del modulo</h1>
      <p>Descripcion corta de la tarea.</p>
    </div>
    <div class="tm-actions">
      <Button icon="pi pi-refresh" label="Recargar" outlined />
      <Button icon="pi pi-plus" label="Nuevo" severity="success" />
    </div>
  </section>

  <section class="tm-panel">
    <!-- filtros y tabla -->
  </section>
</main>
```

## Botones

- Accion principal: `severity="primary"` o `success`.
- Accion destructiva: `severity="danger"` y confirmacion.
- Accion secundaria: `outlined`.
- Acciones de fila: icono dentro de menu contextual.
- No usar texto largo en botones de tabla.

Iconos recomendados:

- Nuevo: `pi pi-plus`
- Guardar: `pi pi-save`
- Editar: `pi pi-pencil`
- Eliminar: `pi pi-trash`
- Imprimir: `pi pi-print`
- Recargar: `pi pi-refresh`
- Buscar: `pi pi-search`
- Cerrar: `pi pi-times`

## Tablas

Todas las tablas deben tener:

- `dataKey="id"` cuando exista.
- Paginacion.
- Busqueda visible.
- Columna de opciones al inicio o final.
- Columnas de estado con `Tag`.
- Fechas en columnas separadas cuando sean importantes.
- Acciones peligrosas dentro de menu o confirmacion.

Columnas comunes:

- `No.` o identificador.
- Cliente/proveedor.
- Total.
- Estado.
- Fecha.
- Usuario.
- Almacen.
- Opciones.

## Estados

Usar textos en mayuscula para estados de control:

- DISPONIBLE: verde.
- USADA / VENDIDO / COBRADO: verde o azul segun contexto.
- PENDIENTE: amarillo.
- ANULADO / ERROR / DEVOLUCION: rojo.
- GARANTIA / REPARACION: azul.

Ejemplo:

```vue
<Tag
  :value="row.estado || 'SIN ESTADO'"
  :severity="estadoSeverity(row.estado)"
/>
```

## Formularios

- Agrupar campos por secciones.
- No mezclar datos principales con configuraciones secundarias.
- Campos requeridos con marca visual.
- Usar inputs numericos para montos.
- Usar select para estados.
- Usar DatePicker cuando sea fecha editable.
- Boton guardar fijo al final del formulario.

Orden recomendado:

1. Identificacion.
2. Cliente/proveedor.
3. Detalle.
4. Montos.
5. Estado.
6. Auditoria o notas.

## Modales

- Usar modales para tareas cortas.
- Ancho sugerido:
  - confirmacion: `25rem`
  - formulario corto: `38rem`
  - formulario largo: `60rem`
- Footer con Cerrar/Cancelar a la izquierda y Guardar/Aplicar a la derecha.
- No poner tablas grandes dentro de modales pequenos.

## Filtros

Cada pantalla con tabla debe incluir:

- Buscador general.
- Filtro por estado si aplica.
- Filtro por almacen si el usuario puede ver varios.
- Boton de limpiar filtros.

## Colores

Usar colores funcionales, no decorativos:

- Primario: azul sobrio.
- Exito: verde.
- Advertencia: amarillo/naranja.
- Error: rojo.
- Neutro: slate/gris.

Evitar pantallas dominadas por un solo gradiente. Los gradientes deben ser discretos y no competir con datos.

## Texto

- Titulos cortos: "Notas de credito", "Cuentas por cobrar", "Recibir equipo".
- Mensajes de error accionables: "No se pudo guardar la nota de credito. Intenta de nuevo."
- Evitar textos largos en cards o botones.
- Usar "No hay registros disponibles" para vacios.

## Confirmaciones

Acciones que siempre requieren confirmacion:

- Borrar.
- Anular.
- Devolver.
- Cambiar estado de documento cerrado.
- Reintegrar IMEI.
- Cerrar caja.
- Usar nota de credito si el monto supera un limite configurable.

## Pantallas prioritarias para unificar

1. Vender.
2. Facturas.
3. Notas de credito.
4. Cuentas por cobrar.
5. Recibir equipo.
6. IMEI.
7. Productos.
8. Caja.

## Checklist antes de terminar una pantalla

- La pantalla tiene titulo claro.
- Las acciones principales estan visibles.
- La tabla tiene busqueda, estado y opciones.
- Los formularios validan campos requeridos.
- Los estados se ven con `Tag`.
- No hay texto que se salga en movil.
- Los botones destructivos piden confirmacion.
- Se guarda `almacen` cuando aplica.
- Se guarda usuario/fecha cuando aplica.

