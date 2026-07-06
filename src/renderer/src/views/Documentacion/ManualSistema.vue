<script setup>
import { computed, ref } from 'vue'

const vistaActiva = ref('manual')
const busqueda = ref('')
const seccionActiva = ref('venta-normal')

const manualSecciones = [
  {
    id: 'reglas-generales',
    titulo: 'Reglas generales',
    icono: 'pi pi-shield',
    items: [
      'No vender sin caja abierta.',
      'No editar documentos cerrados sin permiso de administrador.',
      'No usar productos de otro almacen en ventas del almacen actual.',
      'Toda anulacion, devolucion, cambio de IMEI, ajuste de inventario o uso de nota de credito debe quedar registrado en bitacora.',
      'Los documentos deben conservar estado: pendiente, cobrado, saldado, anulado, devuelto, usado o disponible segun aplique.'
    ]
  },
  {
    id: 'venta-normal',
    titulo: 'Venta normal',
    icono: 'pi pi-shopping-cart',
    items: [
      'Confirmar que la caja esta abierta.',
      'Seleccionar cliente. Si no aplica cliente especifico, usar consumidor final.',
      'Agregar productos desde el almacen actual.',
      'Si el producto es celular, seleccionar IMEI disponible.',
      'Validar precio, descuento, metodo de pago y comprobante fiscal si aplica.',
      'Cobrar e imprimir factura o ticket.',
      'Verificar que el stock o IMEI quede actualizado.'
    ]
  },
  {
    id: 'cotizacion',
    titulo: 'Cotizacion',
    icono: 'pi pi-file-edit',
    items: [
      'Seleccionar cliente.',
      'Agregar productos.',
      'Confirmar vigencia y nota.',
      'Guardar como cotizacion.',
      'La cotizacion no debe descontar inventario.',
      'Al convertir a factura, validar stock actual antes de facturar.'
    ]
  },
  {
    id: 'prefactura-orden',
    titulo: 'Pre-factura y orden',
    icono: 'pi pi-list-check',
    items: [
      'Crear desde la pantalla de venta cuando se requiere reservar informacion sin cobrar.',
      'No deben descontar stock.',
      'Al convertir a factura, validar stock, cliente, comprobante y metodo de pago.'
    ]
  },
  {
    id: 'apartado',
    titulo: 'Apartado',
    icono: 'pi pi-bookmark',
    items: [
      'Seleccionar cliente identificado.',
      'Definir monto, abono y saldo.',
      'Guardar apartado.',
      'El apartado si descuenta stock cuando reserva mercancia.',
      'Cada pago debe guardar fecha, hora, cajero, turno, metodo y saldo restante.',
      'Al saldar, cambiar estado a SALDADO.'
    ]
  },
  {
    id: 'recibir-equipo',
    titulo: 'Recibir equipo',
    icono: 'pi pi-mobile',
    items: [
      'Completar proveedor, equipo, marca, modelo, IMEI, costo y precio de venta.',
      'Validar que el IMEI no exista como disponible.',
      'Si el IMEI existe, solo reintegrar con autorizacion.',
      'Registrar producto e IMEI con almacen actual.',
      'Registrar compra o gasto segun metodo usado.',
      'Si se genera nota de credito, debe nacer como DISPONIBLE.'
    ]
  },
  {
    id: 'nota-credito',
    titulo: 'Nota de credito',
    icono: 'pi pi-ticket',
    items: [
      'Una nota nueva debe crearse como DISPONIBLE.',
      'Al usarla en venta, el sistema debe aplicar el descuento.',
      'Al usarla, cambiar estado a USADA.',
      'Al usarla, guardar fecha_uso y hora_uso.',
      'Una nota USADA no puede volver a aplicarse.',
      'Si se revierte una factura donde se uso una nota, soporte debe evaluar si se reactiva manualmente.'
    ]
  },
  {
    id: 'devolucion',
    titulo: 'Devolucion',
    icono: 'pi pi-undo',
    items: [
      'Buscar factura original.',
      'Validar estado de factura.',
      'Confirmar productos a devolver.',
      'Reintegrar stock o IMEI si aplica.',
      'Cambiar factura a DEVOLUCION o generar registro de devolucion.',
      'Registrar motivo y usuario responsable.'
    ]
  },
  {
    id: 'cuentas-cobrar',
    titulo: 'Cuentas por cobrar',
    icono: 'pi pi-wallet',
    items: [
      'Toda factura a credito debe crear cuenta por cobrar.',
      'Cada abono debe guardar numero de pago, monto, cajero, fecha, hora, metodo y saldo restante.',
      'Si saldo llega a cero, marcar como SALDADO.'
    ]
  },
  {
    id: 'caja',
    titulo: 'Caja',
    icono: 'pi pi-inbox',
    items: [
      'Abrir caja al iniciar turno.',
      'Registrar ingresos y egresos con concepto.',
      'No cerrar caja sin revisar efectivo, tarjeta, transferencia, gastos y devoluciones.',
      'Si hay diferencia, registrar motivo.',
      'Caja cerrada no debe modificarse sin permiso.'
    ]
  },
  {
    id: 'inventario-imei',
    titulo: 'Inventario e IMEI',
    icono: 'pi pi-box',
    items: [
      'Todo IMEI debe tener estado y almacen.',
      'Estados recomendados: DISPONIBLE, VENDIDO, DEVOLUCION, GARANTIA y REPARACION.',
      'Los ajustes manuales deben guardar motivo y usuario.',
      'El stock de celulares debe calcularse desde IMEI disponibles.'
    ]
  },
  {
    id: 'offline',
    titulo: 'Incidencias offline',
    icono: 'pi pi-cloud',
    items: [
      'Si no hay internet, vender solo con datos sincronizados.',
      'Revisar cola de sincronizacion al volver internet.',
      'No borrar cache sin respaldo.',
      'Si hay duplicados, resolver por identificador unico y fecha de creacion.'
    ]
  },
  {
    id: 'cierre-diario',
    titulo: 'Cierre diario',
    icono: 'pi pi-calendar-clock',
    items: [
      'Cerrar caja.',
      'Revisar ventas por metodo de pago.',
      'Revisar cuentas por cobrar creadas.',
      'Revisar devoluciones y notas de credito usadas.',
      'Generar backup.',
      'Sincronizar datos pendientes.'
    ]
  }
]

const guiaSecciones = [
  {
    id: 'estructura-pantalla',
    titulo: 'Estructura de pantalla',
    icono: 'pi pi-desktop',
    items: [
      'Encabezado compacto con titulo, descripcion corta y acciones primarias.',
      'Barra de filtros o busqueda.',
      'Tabla o contenido principal.',
      'Modales para crear, editar o confirmar acciones.'
    ]
  },
  {
    id: 'botones',
    titulo: 'Botones',
    icono: 'pi pi-circle',
    items: [
      'Accion principal: primary o success.',
      'Accion destructiva: danger y confirmacion.',
      'Accion secundaria: outlined.',
      'Acciones de fila: icono dentro de menu contextual.',
      'No usar texto largo en botones de tabla.'
    ]
  },
  {
    id: 'tablas',
    titulo: 'Tablas',
    icono: 'pi pi-table',
    items: [
      'Usar dataKey id cuando exista.',
      'Incluir paginacion.',
      'Incluir busqueda visible.',
      'Columna de opciones al inicio o final.',
      'Columnas de estado con Tag.',
      'Fechas en columnas separadas cuando sean importantes.'
    ]
  },
  {
    id: 'estados',
    titulo: 'Estados',
    icono: 'pi pi-tags',
    items: [
      'DISPONIBLE: verde.',
      'USADA, VENDIDO o COBRADO: verde o azul segun contexto.',
      'PENDIENTE: amarillo.',
      'ANULADO, ERROR o DEVOLUCION: rojo.',
      'GARANTIA o REPARACION: azul.'
    ]
  },
  {
    id: 'formularios',
    titulo: 'Formularios',
    icono: 'pi pi-pencil',
    items: [
      'Agrupar campos por secciones.',
      'Campos requeridos con marca visual.',
      'Usar inputs numericos para montos.',
      'Usar select para estados.',
      'Usar DatePicker cuando sea fecha editable.',
      'Boton guardar fijo al final del formulario.'
    ]
  },
  {
    id: 'modales',
    titulo: 'Modales',
    icono: 'pi pi-window-maximize',
    items: [
      'Confirmacion: ancho sugerido 25rem.',
      'Formulario corto: ancho sugerido 38rem.',
      'Formulario largo: ancho sugerido 60rem.',
      'Footer con cerrar/cancelar y guardar/aplicar.',
      'No poner tablas grandes dentro de modales pequenos.'
    ]
  },
  {
    id: 'filtros',
    titulo: 'Filtros',
    icono: 'pi pi-filter',
    items: [
      'Buscador general.',
      'Filtro por estado si aplica.',
      'Filtro por almacen si el usuario puede ver varios.',
      'Boton de limpiar filtros.'
    ]
  },
  {
    id: 'checklist',
    titulo: 'Checklist de pantalla',
    icono: 'pi pi-check-square',
    items: [
      'Titulo claro.',
      'Acciones principales visibles.',
      'Tabla con busqueda, estado y opciones.',
      'Formularios con validaciones requeridas.',
      'Estados visibles con Tag.',
      'Texto sin desbordarse en movil.',
      'Botones destructivos con confirmacion.',
      'Guardar almacen, usuario y fecha cuando aplique.'
    ]
  }
]

const seccionesActuales = computed(() => vistaActiva.value === 'manual' ? manualSecciones : guiaSecciones)

const seccionesFiltradas = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  if (!texto) return seccionesActuales.value

  return seccionesActuales.value.filter((seccion) => {
    const contenido = [seccion.titulo, ...seccion.items].join(' ').toLowerCase()
    return contenido.includes(texto)
  })
})

const cambiarVista = (vista) => {
  vistaActiva.value = vista
  busqueda.value = ''
  seccionActiva.value = vista === 'manual' ? 'venta-normal' : 'estructura-pantalla'
}
</script>

<template>
  <main class="manual-page">
    <section class="manual-header">
      <div>
        <p class="eyebrow">Documentacion interna</p>
        <h1>Manual del sistema</h1>
        <p>Consulta los procesos operativos y las reglas visuales para mantener el sistema consistente.</p>
      </div>
      <div class="header-actions">
        <Button
          label="Manual operativo"
          icon="pi pi-book"
          :outlined="vistaActiva !== 'manual'"
          severity="primary"
          @click="cambiarVista('manual')"
        />
        <Button
          label="Guia visual"
          icon="pi pi-palette"
          :outlined="vistaActiva !== 'guia'"
          severity="info"
          @click="cambiarVista('guia')"
        />
      </div>
    </section>

    <section class="manual-shell">
      <aside class="manual-sidebar">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input v-model="busqueda" type="text" placeholder="Buscar en la documentacion" />
        </div>

        <div class="section-list">
          <button
            v-for="seccion in seccionesFiltradas"
            :key="seccion.id"
            type="button"
            :class="{ active: seccionActiva === seccion.id }"
            @click="seccionActiva = seccion.id"
          >
            <i :class="seccion.icono"></i>
            <span>{{ seccion.titulo }}</span>
          </button>
        </div>
      </aside>

      <div class="manual-content">
        <article
          v-for="seccion in seccionesFiltradas"
          :key="seccion.id"
          :id="seccion.id"
          class="doc-section"
          :class="{ highlighted: seccionActiva === seccion.id }"
        >
          <div class="doc-section__header">
            <i :class="seccion.icono"></i>
            <h2>{{ seccion.titulo }}</h2>
          </div>

          <ol>
            <li v-for="item in seccion.items" :key="item">{{ item }}</li>
          </ol>
        </article>

        <div v-if="seccionesFiltradas.length === 0" class="empty-state">
          <i class="pi pi-info-circle"></i>
          <p>No se encontraron resultados para la busqueda.</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.manual-page {
  min-height: 100vh;
  padding: 24px;
  background: #f8fafc;
  color: #0f172a;
}

.manual-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.manual-header h1 {
  margin: 4px 0 8px;
  font-size: 1.8rem;
  font-weight: 800;
}

.manual-header p {
  margin: 0;
  color: #64748b;
}

.eyebrow {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0;
  font-weight: 700;
  color: #2563eb;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.manual-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
}

.manual-sidebar,
.manual-content {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.manual-sidebar {
  position: sticky;
  top: 16px;
  align-self: start;
  padding: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 12px;
}

.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
}

.section-list {
  display: grid;
  gap: 6px;
  max-height: calc(100vh - 220px);
  overflow: auto;
}

.section-list button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 0;
  border-radius: 8px;
  padding: 10px;
  background: transparent;
  color: #334155;
  text-align: left;
  cursor: pointer;
}

.section-list button:hover,
.section-list button.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.manual-content {
  padding: 16px;
  display: grid;
  gap: 12px;
}

.doc-section {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  background: #ffffff;
}

.doc-section.highlighted {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.16);
}

.doc-section__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.doc-section__header i {
  color: #2563eb;
}

.doc-section h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
}

.doc-section ol {
  margin: 0;
  padding-left: 22px;
  color: #334155;
  line-height: 1.7;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 240px;
  color: #64748b;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 8px;
}

@media (max-width: 900px) {
  .manual-header,
  .manual-shell {
    grid-template-columns: 1fr;
  }

  .manual-header {
    display: grid;
  }

  .manual-sidebar {
    position: static;
  }
}
</style>
