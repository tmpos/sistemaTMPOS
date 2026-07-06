<script setup>
import { ref, computed, onMounted } from 'vue'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { useToast } from 'primevue/usetoast'
import Swal from 'sweetalert2'
import LoadingOverlay from '@/Loading/LoadingOverlay.vue'
import { nfecha, crearTablaSiNoExisteOffline, peticionesFetchOffline, generarCodigoUnico } from '@/funciones/funciones.js'
import { useDatosEmpresa } from '@/stores'

const toast = useToast()
const datosEmpresa = useDatosEmpresa()

const loading = ref(false)
const visibleDialog = ref(false)
const visibleAsignarModal = ref(false)
const visiblePdfMovimientos = ref(false)
const searchQuery = ref('')
const searchOrdenQuery = ref('')
const searchMovimientoQuery = ref('')
const rangoFechaMovimientos = ref(null)
const pdfMovimientosUrl = ref('')
const piezas = ref([])
const movimientos = ref([])
const piezaEditando = ref(null)
const menuAcciones = ref()
const piezaMenuActual = ref(null)
const accionesMenu = ref([])
const ordenesRevision = ref([])
const ordenSeleccionada = ref(null)
const cantidadAsignar = ref(1)

const generarCodigoPieza = () => {
  let codigo = ''

  do {
    codigo = `PZA-${generarCodigoUnico(10)}`
  } while (piezas.value.some((pieza) => pieza.codigo === codigo))

  return codigo
}

const crearFormulario = () => ({
  codigo: generarCodigoPieza(),
  nombre: '',
  categoria: 'PANTALLA',
  modelo_compatible: '',
  stock: 0,
  stock_minimo: 1,
  costo: '0.00',
  precio_venta: '0.00',
  ubicacion: '',
  suplidor: '',
  observaciones: '',
  estado: 'ACTIVA'
})

const formulario = ref(crearFormulario())

const categorias = [
  'PANTALLA',
  'BATERIA',
  'FLEX',
  'CAMARA',
  'CONECTOR',
  'TAPA',
  'BOARD',
  'MICROFONO',
  'ALTAVOZ',
  'OTRA'
]

const estados = ['ACTIVA', 'AGOTADA', 'INACTIVA']

const stats = computed(() => {
  const total = piezas.value.length
  const activas = piezas.value.filter((pieza) => pieza.estado === 'ACTIVA').length
  const stockBajo = piezas.value.filter((pieza) => Number(pieza.stock || 0) <= Number(pieza.stock_minimo || 0)).length
  const valorInventario = piezas.value.reduce((acc, pieza) => {
    return acc + Number(pieza.stock || 0) * Number(pieza.costo || 0)
  }, 0)

  return { total, activas, stockBajo, valorInventario }
})

const piezasFiltradas = computed(() => {
  if (!searchQuery.value) return piezas.value

  const query = searchQuery.value.toLowerCase()
  return piezas.value.filter((pieza) =>
    String(pieza.codigo || '').toLowerCase().includes(query) ||
    String(pieza.nombre || '').toLowerCase().includes(query) ||
    String(pieza.categoria || '').toLowerCase().includes(query) ||
    String(pieza.modelo_compatible || '').toLowerCase().includes(query) ||
    String(pieza.ubicacion || '').toLowerCase().includes(query)
  )
})

const ordenesRevisionFiltradas = computed(() => {
  if (!searchOrdenQuery.value) return ordenesRevision.value

  const query = searchOrdenQuery.value.toLowerCase()
  return ordenesRevision.value.filter((orden) =>
    String(orden.no_factura || '').toLowerCase().includes(query) ||
    String(orden.nombre || '').toLowerCase().includes(query) ||
    String(orden.telefono || '').toLowerCase().includes(query) ||
    String(orden.equipo || '').toLowerCase().includes(query) ||
    String(orden.marca || '').toLowerCase().includes(query) ||
    String(orden.modelo || '').toLowerCase().includes(query)
  )
})

const movimientosFiltrados = computed(() => {
  let base = [...movimientos.value].sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0))

  if (Array.isArray(rangoFechaMovimientos.value) && rangoFechaMovimientos.value[0] && rangoFechaMovimientos.value[1]) {
    const inicio = new Date(rangoFechaMovimientos.value[0])
    const fin = new Date(rangoFechaMovimientos.value[1])
    inicio.setHours(0, 0, 0, 0)
    fin.setHours(23, 59, 59, 999)

    base = base.filter((movimiento) => {
      const fechaMovimiento = new Date(Number(movimiento.created_at || 0))
      return !Number.isNaN(fechaMovimiento.getTime()) && fechaMovimiento >= inicio && fechaMovimiento <= fin
    })
  }

  if (!searchMovimientoQuery.value) return base

  const query = searchMovimientoQuery.value.toLowerCase()
  return base.filter((movimiento) =>
    String(movimiento.codigo_pieza || '').toLowerCase().includes(query) ||
    String(movimiento.nombre_pieza || '').toLowerCase().includes(query) ||
    String(movimiento.tipo || '').toLowerCase().includes(query) ||
    String(movimiento.detalle || '').toLowerCase().includes(query) ||
    String(movimiento.referencia || '').toLowerCase().includes(query)
  )
})

const inicializarTabla = async () => {
  const campos = [
    'codigo',
    'nombre',
    'categoria',
    'modelo_compatible',
    'stock',
    'stock_minimo',
    'costo',
    'precio_venta',
    'ubicacion',
    'suplidor',
    'observaciones',
    'estado',
    'usuario'
  ]

  await crearTablaSiNoExisteOffline('piezas_celulares', campos, toast)
  await crearTablaSiNoExisteOffline('piezas_movimientos', [
    'pieza_id',
    'codigo_pieza',
    'nombre_pieza',
    'tipo',
    'cantidad',
    'stock_anterior',
    'stock_nuevo',
    'detalle',
    'referencia',
    'usuario',
    'fecha',
    'hora'
  ], toast)
}

const cargarPiezas = async () => {
  try {
    loading.value = true
    const datos = await peticionesFetchOffline('getDataAsArray', 'piezas_celulares', '')
    piezas.value = [...datos].sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0))
  } catch (error) {
    console.error('Error al cargar piezas:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las piezas.', life: 3000 })
  } finally {
    loading.value = false
  }
}

const cargarMovimientos = async () => {
  try {
    const datos = await peticionesFetchOffline('getDataAsArray', 'piezas_movimientos', '')
    movimientos.value = Array.isArray(datos) ? datos : []
  } catch (error) {
    console.error('Error al cargar movimientos de piezas:', error)
  }
}

const registrarMovimiento = async ({
  pieza,
  tipo,
  cantidad,
  stockAnterior,
  stockNuevo,
  detalle,
  referencia = ''
}) => {
  const payload = {
    pieza_id: pieza?.id || '',
    codigo_pieza: pieza?.codigo || '',
    nombre_pieza: pieza?.nombre || '',
    tipo,
    cantidad: Number(cantidad || 0),
    stock_anterior: Number(stockAnterior || 0),
    stock_nuevo: Number(stockNuevo || 0),
    detalle: detalle || '',
    referencia,
    usuario: datosEmpresa.usuario?.nombre || datosEmpresa.usuario?.email || 'Sistema',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp')
  }

  try {
    await peticionesFetchOffline('insertData', 'piezas_movimientos', JSON.stringify(payload))
  } catch (error) {
    console.error('Error registrando movimiento de pieza:', error)
  }
}

const abrirCrear = () => {
  piezaEditando.value = null
  formulario.value = crearFormulario()
  visibleDialog.value = true
}

const abrirEditar = (pieza) => {
  piezaEditando.value = pieza
  formulario.value = {
    codigo: pieza.codigo || '',
    nombre: pieza.nombre || '',
    categoria: pieza.categoria || 'PANTALLA',
    modelo_compatible: pieza.modelo_compatible || '',
    stock: Number(pieza.stock || 0),
    stock_minimo: Number(pieza.stock_minimo || 1),
    costo: String(pieza.costo || '0.00'),
    precio_venta: String(pieza.precio_venta || '0.00'),
    ubicacion: pieza.ubicacion || '',
    suplidor: pieza.suplidor || '',
    observaciones: pieza.observaciones || '',
    estado: pieza.estado || 'ACTIVA'
  }
  visibleDialog.value = true
}

const guardarPieza = async () => {
  if (!formulario.value.codigo || !formulario.value.nombre) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Código y nombre son obligatorios.', life: 3000 })
    return
  }

  const payload = {
    ...piezaEditando.value,
    ...formulario.value,
    stock: Number(formulario.value.stock || 0),
    stock_minimo: Number(formulario.value.stock_minimo || 0),
    costo: Number(formulario.value.costo || 0).toFixed(2),
    precio_venta: Number(formulario.value.precio_venta || 0).toFixed(2),
    usuario: datosEmpresa.usuario?.nombre || datosEmpresa.usuario?.email || 'Sistema',
    updated_at: nfecha('timestamp')
  }

  if (!piezaEditando.value) {
    payload.created_at = nfecha('timestamp')
  }

  const stockAnterior = Number(piezaEditando.value?.stock || 0)
  const stockNuevo = Number(payload.stock || 0)

  try {
    loading.value = true
    const accion = piezaEditando.value ? 'updateData' : 'insertData'
    const resultado = await peticionesFetchOffline(accion, 'piezas_celulares', JSON.stringify(payload))

    if (resultado[0] === 'ok') {
      if (!piezaEditando.value) {
        await cargarPiezas()
        const creada = piezas.value.find((pieza) => pieza.codigo === payload.codigo)
        await registrarMovimiento({
          pieza: creada || payload,
          tipo: 'CREACION',
          cantidad: stockNuevo,
          stockAnterior: 0,
          stockNuevo,
          detalle: 'Pieza creada en inventario.'
        })
      } else if (stockAnterior !== stockNuevo) {
        await registrarMovimiento({
          pieza: payload,
          tipo: 'AJUSTE',
          cantidad: Math.abs(stockNuevo - stockAnterior),
          stockAnterior,
          stockNuevo,
          detalle: 'Ajuste manual de stock desde edición.'
        })
      }

      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: piezaEditando.value ? 'Pieza actualizada correctamente.' : 'Pieza agregada al inventario.',
        life: 3000
      })
      visibleDialog.value = false
      await cargarPiezas()
      await cargarMovimientos()
      return
    }

    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la pieza.', life: 3000 })
  } catch (error) {
    console.error('Error guardando pieza:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error inesperado al guardar la pieza.', life: 3000 })
  } finally {
    loading.value = false
  }
}

const eliminarPieza = async (pieza) => {
  const result = await Swal.fire({
    title: 'Eliminar pieza',
    text: `Se eliminará ${pieza.nombre}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  })

  if (!result.isConfirmed) return

  try {
    loading.value = true
    const respuesta = await peticionesFetchOffline('deleteEntry', 'piezas_celulares', pieza.id)
    if (respuesta[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pieza eliminada.', life: 3000 })
      await cargarPiezas()
      return
    }

    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la pieza.', life: 3000 })
  } catch (error) {
    console.error('Error eliminando pieza:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error inesperado al eliminar.', life: 3000 })
  } finally {
    loading.value = false
  }
}

const abrirMenuAcciones = (event, pieza) => {
  piezaMenuActual.value = pieza
  accionesMenu.value = [
    {
      label: 'Asignar a orden',
      icon: 'pi pi-send',
      command: () => asignarAOrden(pieza)
    },
    {
      label: 'Agregar stock',
      icon: 'pi pi-plus-circle',
      command: () => agregarStock(pieza)
    },
    {
      label: 'Sacar del inventario',
      icon: 'pi pi-minus-circle',
      command: () => sacarDelInventario(pieza)
    },
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => abrirEditar(pieza)
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      command: () => eliminarPieza(pieza)
    }
  ]
  menuAcciones.value.toggle(event)
}

const asignarAOrden = async (pieza) => {
  const stockActual = Number(pieza.stock || 0)

  if (!Number.isFinite(stockActual) || stockActual <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Esta pieza no tiene stock disponible para asignar.', life: 3000 })
    return
  }

  try {
    loading.value = true
    const ordenes = await peticionesFetchOffline('getDataAsArray', 'taller', '')
    const almacenActual = String(datosEmpresa.empresa?.nombre || '').trim()
    ordenesRevision.value = ordenes.filter((orden) => {
      const almacenOrden = String(orden.almacen || '').trim()
      const mismoAlmacen = almacenActual ? almacenOrden === almacenActual : true
      return orden.estado === 'En Revision' && mismoAlmacen
    })

    if (!ordenesRevision.value.length) {
      toast.add({ severity: 'warn', summary: 'Sin órdenes', detail: 'No hay órdenes en revisión disponibles.', life: 3000 })
      return
    }
    piezaMenuActual.value = pieza
    ordenSeleccionada.value = null
    cantidadAsignar.value = 1
    searchOrdenQuery.value = ''
    visibleAsignarModal.value = true
  } catch (error) {
    console.error('Error asignando pieza a orden:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error inesperado al asignar la pieza a la orden.', life: 3000 })
  } finally {
    loading.value = false
  }
}

const confirmarAsignacionOrden = async () => {
  const pieza = piezaMenuActual.value
  const orden = ordenSeleccionada.value
  const stockActual = Number(pieza?.stock || 0)
  const cantidad = Number(cantidadAsignar.value || 0)

  if (!pieza || !orden) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una orden.', life: 3000 })
    return
  }

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe indicar una cantidad válida.', life: 3000 })
    return
  }

  if (cantidad > stockActual) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No puedes asignar más piezas que el stock disponible.', life: 3000 })
    return
  }

  const ordenActualizada = { ...orden }
  const descripcionPieza = cantidad === 1 ? pieza.nombre : `${pieza.nombre} x${cantidad}`
  const piezasActuales = String(ordenActualizada.piezas || '').trim()
  const costoPiezaAsignada = Number(pieza.costo || 0) * cantidad
  ordenActualizada.piezas = piezasActuales ? `${piezasActuales}, ${descripcionPieza}` : descripcionPieza
  ordenActualizada.preciopiezas = (Number(ordenActualizada.preciopiezas || 0) + costoPiezaAsignada).toFixed(2)
  ordenActualizada.updated_at = nfecha('timestamp')

  const nuevoStock = stockActual - cantidad
  const payloadPieza = {
    ...pieza,
    stock: nuevoStock,
    estado: nuevoStock <= 0 ? 'AGOTADA' : pieza.estado === 'INACTIVA' ? 'INACTIVA' : 'ACTIVA',
    usuario: datosEmpresa.usuario?.nombre || datosEmpresa.usuario?.email || 'Sistema',
    updated_at: nfecha('timestamp')
  }

  try {
    loading.value = true
    const actualizacionOrden = await peticionesFetchOffline('updateData', 'taller', JSON.stringify(ordenActualizada))
    if (actualizacionOrden[0] !== 'ok') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la orden de taller.', life: 3000 })
      return
    }

    const actualizacionPieza = await peticionesFetchOffline('updateData', 'piezas_celulares', JSON.stringify(payloadPieza))
    if (actualizacionPieza[0] !== 'ok') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'La orden se actualizó, pero falló la salida del inventario.', life: 3500 })
      return
    }

    await registrarMovimiento({
      pieza: payloadPieza,
      tipo: 'ASIGNACION_TALLER',
      cantidad,
      stockAnterior: stockActual,
      stockNuevo: nuevoStock,
      detalle: `Asignada a la orden #${ordenActualizada.no_factura || ordenActualizada.id}.`,
      referencia: String(ordenActualizada.no_factura || ordenActualizada.id || '')
    })

    visibleAsignarModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `Se asignó ${descripcionPieza} a la orden #${ordenActualizada.no_factura || ordenActualizada.id}.`,
      life: 3500
    })
    await cargarPiezas()
    await cargarMovimientos()
  } catch (error) {
    console.error('Error confirmando asignación de pieza:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error inesperado al guardar la asignación.', life: 3000 })
  } finally {
    loading.value = false
  }
}

const sacarDelInventario = async (pieza) => {
  const stockActual = Number(pieza.stock || 0)

  if (!Number.isFinite(stockActual) || stockActual <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Esta pieza no tiene stock disponible.', life: 3000 })
    return
  }

  const { value: cantidadSalida } = await Swal.fire({
    title: 'Sacar del inventario',
    text: `Stock disponible: ${stockActual}`,
    input: 'number',
    inputValue: 1,
    inputAttributes: {
      min: 1,
      max: stockActual,
      step: 1
    },
    showCancelButton: true,
    confirmButtonText: 'Descontar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      const cantidad = Number(value)
      if (!Number.isFinite(cantidad) || cantidad <= 0) return 'Debe indicar una cantidad válida.'
      if (cantidad > stockActual) return 'No puedes sacar más piezas que el stock disponible.'
      return null
    }
  })

  if (!cantidadSalida) return

  const nuevoStock = stockActual - Number(cantidadSalida)
  const payload = {
    ...pieza,
    stock: nuevoStock,
    estado: nuevoStock <= 0 ? 'AGOTADA' : pieza.estado === 'INACTIVA' ? 'INACTIVA' : 'ACTIVA',
    usuario: datosEmpresa.usuario?.nombre || datosEmpresa.usuario?.email || 'Sistema',
    updated_at: nfecha('timestamp')
  }

  try {
    loading.value = true
    const respuesta = await peticionesFetchOffline('updateData', 'piezas_celulares', JSON.stringify(payload))
    if (respuesta[0] === 'ok') {
      await registrarMovimiento({
        pieza: payload,
        tipo: 'SALIDA',
        cantidad: Number(cantidadSalida),
        stockAnterior: stockActual,
        stockNuevo: nuevoStock,
        detalle: 'Salida manual desde inventario.'
      })
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Se descontaron ${cantidadSalida} unidad(es) de ${pieza.nombre}.`,
        life: 3000
      })
      await cargarPiezas()
      await cargarMovimientos()
      return
    }

    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el stock.', life: 3000 })
  } catch (error) {
    console.error('Error descontando pieza:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error inesperado al descontar stock.', life: 3000 })
  } finally {
    loading.value = false
  }
}

const agregarStock = async (pieza) => {
  const { value: cantidadEntrada } = await Swal.fire({
    title: 'Agregar stock',
    text: `Stock actual: ${Number(pieza.stock || 0)}`,
    input: 'number',
    inputValue: 1,
    inputAttributes: {
      min: 1,
      step: 1
    },
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      const cantidad = Number(value)
      if (!Number.isFinite(cantidad) || cantidad <= 0) return 'Debe indicar una cantidad válida.'
      return null
    }
  })

  if (!cantidadEntrada) return

  const nuevoStock = Number(pieza.stock || 0) + Number(cantidadEntrada)
  const payload = {
    ...pieza,
    stock: nuevoStock,
    estado: pieza.estado === 'INACTIVA' ? 'INACTIVA' : 'ACTIVA',
    usuario: datosEmpresa.usuario?.nombre || datosEmpresa.usuario?.email || 'Sistema',
    updated_at: nfecha('timestamp')
  }

  try {
    loading.value = true
    const respuesta = await peticionesFetchOffline('updateData', 'piezas_celulares', JSON.stringify(payload))
    if (respuesta[0] === 'ok') {
      await registrarMovimiento({
        pieza: payload,
        tipo: 'ENTRADA',
        cantidad: Number(cantidadEntrada),
        stockAnterior: Number(pieza.stock || 0),
        stockNuevo: nuevoStock,
        detalle: 'Entrada manual de stock.'
      })
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Se agregaron ${cantidadEntrada} unidad(es) a ${pieza.nombre}.`,
        life: 3000
      })
      await cargarPiezas()
      await cargarMovimientos()
      return
    }

    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el stock.', life: 3000 })
  } catch (error) {
    console.error('Error agregando stock:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error inesperado al agregar stock.', life: 3000 })
  } finally {
    loading.value = false
  }
}

const estadoSeverity = (estado) => {
  if (estado === 'ACTIVA') return 'success'
  if (estado === 'AGOTADA') return 'warn'
  return 'secondary'
}

const generarPdfMovimientos = async () => {
  const rows = movimientosFiltrados.value

  if (!rows.length) {
    toast.add({ severity: 'warn', summary: 'Sin datos', detail: 'No hay movimientos para generar el PDF.', life: 3000 })
    return
  }

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const fechaTexto =
      Array.isArray(rangoFechaMovimientos.value) && rangoFechaMovimientos.value[0] && rangoFechaMovimientos.value[1]
        ? `${new Date(rangoFechaMovimientos.value[0]).toLocaleDateString()} - ${new Date(rangoFechaMovimientos.value[1]).toLocaleDateString()}`
        : 'Todas las fechas'

    doc.setFontSize(16)
    doc.text('Movimientos de Piezas', 14, 14)
    doc.setFontSize(10)
    doc.text(`Rango: ${fechaTexto}`, 14, 21)

    const headers = [['Fecha', 'Hora', 'Codigo', 'Pieza', 'Tipo', 'Cant.', 'Antes', 'Despues', 'Referencia', 'Detalle', 'Usuario']]
    const body = rows.map((item) => [
      item.fecha || '',
      item.hora || '',
      item.codigo_pieza || '',
      item.nombre_pieza || '',
      item.tipo || '',
      String(item.cantidad || ''),
      String(item.stock_anterior || ''),
      String(item.stock_nuevo || ''),
      item.referencia || '',
      item.detalle || '',
      item.usuario || ''
    ])

    doc.autoTable({
      head: headers,
      body,
      startY: 26,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110] }
    })

    if (pdfMovimientosUrl.value) {
      URL.revokeObjectURL(pdfMovimientosUrl.value)
    }

    const blob = doc.output('blob')
    pdfMovimientosUrl.value = URL.createObjectURL(blob)
    visiblePdfMovimientos.value = true
  } catch (error) {
    console.error('Error generando PDF de movimientos:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF de movimientos.', life: 3000 })
  }
}

onMounted(async () => {
  await inicializarTabla()
  await cargarPiezas()
  await cargarMovimientos()
})
</script>

<template>
  <div class="piezas-page">
    <div class="piezas-shell">
      <section class="piezas-hero">
        <div class="piezas-hero__copy">
          <div class="piezas-hero__icon">
            <i class="pi pi-box"></i>
          </div>
          <div>
            <h1>Inventario de Piezas</h1>
            <p>Controla repuestos de celulares con una vista limpia, rápida y enfocada en stock.</p>
          </div>
        </div>
        <div class="piezas-hero__actions">
          <Button label="Ir a taller" icon="pi pi-wrench" severity="secondary" outlined as="router-link" to="/taller" />
          <Button label="Agregar pieza" icon="pi pi-plus" @click="abrirCrear" />
        </div>
      </section>

      <section class="piezas-stats">
        <article class="piezas-stat-card">
          <span>Total piezas</span>
          <strong>{{ stats.total }}</strong>
          <small>Registros creados</small>
        </article>
        <article class="piezas-stat-card">
          <span>Activas</span>
          <strong>{{ stats.activas }}</strong>
          <small>Disponibles para venta</small>
        </article>
        <article class="piezas-stat-card">
          <span>Stock bajo</span>
          <strong>{{ stats.stockBajo }}</strong>
          <small>Requieren reposición</small>
        </article>
        <article class="piezas-stat-card">
          <span>Valor inventario</span>
          <strong>RD$ {{ Number(stats.valorInventario || 0).toFixed(2) }}</strong>
          <small>Costo acumulado</small>
        </article>
      </section>

      <Card class="piezas-toolbar">
        <template #content>
          <div class="piezas-toolbar__row">
            <div class="piezas-toolbar__search">
              <i class="pi pi-search"></i>
              <InputText v-model="searchQuery" placeholder="Buscar por código, nombre, categoría o modelo..." />
            </div>
            <div class="piezas-toolbar__actions">
              <Button label="Recargar" icon="pi pi-refresh" severity="secondary" outlined @click="cargarPiezas" />
              <Button label="Agregar pieza" icon="pi pi-plus" @click="abrirCrear" />
            </div>
          </div>
        </template>
      </Card>

      <Card class="piezas-table-card">
        <template #content>
          <DataTable
            :value="piezasFiltradas"
            paginator
            :rows="10"
            responsiveLayout="scroll"
            stripedRows
            dataKey="id"
            class="piezas-table"
          >
            <Column header="Acciones" style="width: 6rem">
              <template #body="{ data }">
                <div class="piezas-table__actions">
                  <Button icon="pi pi-ellipsis-h" severity="secondary" text @click="abrirMenuAcciones($event, data)" />
                </div>
              </template>
            </Column>
            <Column field="codigo" header="Código" />
            <Column field="nombre" header="Pieza" />
            <Column field="categoria" header="Categoría" />
            <Column field="modelo_compatible" header="Compatible" />
            <Column field="stock" header="Stock" />
            <Column field="stock_minimo" header="Mínimo" />
            <Column field="precio_venta" header="Venta">
              <template #body="{ data }">
                RD$ {{ Number(data.precio_venta || 0).toFixed(2) }}
              </template>
            </Column>
            <Column field="ubicacion" header="Ubicación" />
            <Column field="estado" header="Estado">
              <template #body="{ data }">
                <Tag :value="data.estado" :severity="estadoSeverity(data.estado)" />
              </template>
            </Column>
            <template #empty>
              <div class="piezas-empty">
                <i class="pi pi-inbox"></i>
                <p>No hay piezas registradas.</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <Card class="piezas-table-card">
        <template #content>
          <div class="piezas-table-card__header">
            <div>
              <h3>Movimientos de piezas</h3>
              <p>Entradas, salidas, asignaciones a taller y ajustes manuales.</p>
            </div>
            <div class="piezas-movimientos__tools">
              <DatePicker
                v-model="rangoFechaMovimientos"
                selectionMode="range"
                dateFormat="dd/mm/yy"
                :showButtonBar="true"
                placeholder="Rango de fechas"
                class="piezas-movimientos__range"
              />
              <div class="piezas-toolbar__search piezas-toolbar__search--compact">
                <i class="pi pi-search"></i>
                <InputText v-model="searchMovimientoQuery" placeholder="Buscar movimiento..." fluid />
              </div>
              <Button label="PDF" icon="pi pi-file-pdf" severity="danger" outlined @click="generarPdfMovimientos" />
            </div>
          </div>

          <DataTable
            :value="movimientosFiltrados"
            paginator
            :rows="8"
            responsiveLayout="scroll"
            stripedRows
            dataKey="id"
            class="piezas-table"
          >
            <Column field="fecha" header="Fecha" />
            <Column field="hora" header="Hora" />
            <Column field="codigo_pieza" header="Código" />
            <Column field="nombre_pieza" header="Pieza" />
            <Column field="tipo" header="Tipo">
              <template #body="{ data }">
                <Tag :value="data.tipo" :severity="data.tipo === 'ENTRADA' ? 'success' : data.tipo === 'SALIDA' || data.tipo === 'ASIGNACION_TALLER' ? 'warn' : 'info'" />
              </template>
            </Column>
            <Column field="cantidad" header="Cantidad" />
            <Column field="stock_anterior" header="Antes" />
            <Column field="stock_nuevo" header="Después" />
            <Column field="referencia" header="Referencia" />
            <Column field="detalle" header="Detalle" />
            <Column field="usuario" header="Usuario" />
            <template #empty>
              <div class="piezas-empty">
                <i class="pi pi-history"></i>
                <p>No hay movimientos registrados.</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>
    </div>

    <Dialog v-model:visible="visibleDialog" modal :style="{ width: 'min(96vw, 56rem)' }" :draggable="false">
      <template #header>
        <div class="piezas-dialog__header">
          <div class="piezas-dialog__icon">
            <i class="pi pi-wrench"></i>
          </div>
          <div>
            <h3>{{ piezaEditando ? 'Editar pieza' : 'Nueva pieza' }}</h3>
            <p>Inventario dedicado para repuestos de celulares.</p>
          </div>
        </div>
      </template>

      <div class="piezas-form-grid">
        <div class="p-field">
          <label>Código</label>
          <InputText v-model="formulario.codigo" fluid />
        </div>
        <div class="p-field">
          <label>Nombre</label>
          <InputText v-model="formulario.nombre" fluid />
        </div>
        <div class="p-field">
          <label>Categoría</label>
          <Select v-model="formulario.categoria" :options="categorias" fluid />
        </div>
        <div class="p-field">
          <label>Modelo compatible</label>
          <InputText v-model="formulario.modelo_compatible" placeholder="iPhone 13, A14, Samsung A34..." fluid />
        </div>
        <div class="p-field">
          <label>Stock</label>
          <InputNumber v-model="formulario.stock" :min="0" fluid />
        </div>
        <div class="p-field">
          <label>Stock mínimo</label>
          <InputNumber v-model="formulario.stock_minimo" :min="0" fluid />
        </div>
        <div class="p-field">
          <label>Costo</label>
          <InputNumber v-model="formulario.costo" mode="currency" currency="DOP" locale="es-DO" fluid />
        </div>
        <div class="p-field">
          <label>Precio de venta</label>
          <InputNumber v-model="formulario.precio_venta" mode="currency" currency="DOP" locale="es-DO" fluid />
        </div>
        <div class="p-field">
          <label>Ubicación</label>
          <InputText v-model="formulario.ubicacion" placeholder="Gaveta A-2, vitrina, almacén..." fluid />
        </div>
        <div class="p-field">
          <label>Suplidor</label>
          <InputText v-model="formulario.suplidor" fluid />
        </div>
        <div class="p-field p-field--full">
          <label>Estado</label>
          <Select v-model="formulario.estado" :options="estados" fluid />
        </div>
        <div class="p-field p-field--full">
          <label>Observaciones</label>
          <Textarea v-model="formulario.observaciones" rows="4" autoResize fluid />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="visibleDialog = false" />
        <Button :label="piezaEditando ? 'Guardar cambios' : 'Guardar pieza'" icon="pi pi-save" @click="guardarPieza" />
      </template>
    </Dialog>

    <Dialog v-model:visible="visibleAsignarModal" modal :style="{ width: 'min(96vw, 70rem)' }" :draggable="false">
      <template #header>
        <div class="piezas-dialog__header">
          <div class="piezas-dialog__icon">
            <i class="pi pi-send"></i>
          </div>
          <div>
            <h3>Asignar pieza a orden</h3>
            <p>Seleccione una orden en revisión y la cantidad a descontar del inventario.</p>
          </div>
        </div>
      </template>

      <div class="piezas-asignar">
        <div class="piezas-toolbar__search">
          <i class="pi pi-search"></i>
          <InputText v-model="searchOrdenQuery" placeholder="Buscar por orden, cliente, teléfono, equipo o modelo..." fluid />
        </div>

        <DataTable
          v-model:selection="ordenSeleccionada"
          :value="ordenesRevisionFiltradas"
          selectionMode="single"
          dataKey="id"
          paginator
          :rows="8"
          responsiveLayout="scroll"
          stripedRows
          class="piezas-table"
        >
          <Column selectionMode="single" headerStyle="width: 3rem" />
          <Column field="no_factura" header="Orden" />
          <Column field="nombre" header="Cliente" />
          <Column field="telefono" header="Teléfono" />
          <Column field="equipo" header="Equipo" />
          <Column field="marca" header="Marca" />
          <Column field="modelo" header="Modelo" />
        </DataTable>

        <div class="piezas-form-grid piezas-form-grid--assign">
          <div class="p-field">
            <label>Pieza seleccionada</label>
            <InputText :modelValue="piezaMenuActual?.nombre || ''" readonly fluid />
          </div>
          <div class="p-field">
            <label>Stock disponible</label>
            <InputText :modelValue="String(piezaMenuActual?.stock ?? 0)" readonly fluid />
          </div>
          <div class="p-field p-field--full">
            <label>Cantidad a asignar</label>
            <InputNumber v-model="cantidadAsignar" :min="1" :max="Number(piezaMenuActual?.stock || 0)" fluid />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="visibleAsignarModal = false" />
        <Button label="Asignar a orden" icon="pi pi-check" @click="confirmarAsignacionOrden" />
      </template>
    </Dialog>

    <Dialog v-model:visible="visiblePdfMovimientos" modal header="PDF de movimientos" :style="{ width: '90vw', height: '90vh' }">
      <iframe v-if="pdfMovimientosUrl" :src="pdfMovimientosUrl" class="piezas-pdf-frame"></iframe>
      <template #footer>
        <Button label="Cerrar" severity="secondary" text @click="visiblePdfMovimientos = false" />
      </template>
    </Dialog>

    <Menu ref="menuAcciones" :model="accionesMenu" popup />

    <LoadingOverlay :visible="loading" />
    <Toast />
  </div>
</template>

<style scoped>
.piezas-page {
  min-height: 100vh;
  padding: 2rem;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.16), transparent 24%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 22%),
    linear-gradient(180deg, #f7fafc 0%, #eef6ff 52%, #f4f8fb 100%);
}

.piezas-shell {
  max-width: 1480px;
  margin: 0 auto;
}

.piezas-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem;
  border-radius: 28px;
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.16), transparent 18%),
    linear-gradient(135deg, #0f172a 0%, #0f766e 48%, #14b8a6 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  margin-bottom: 1.5rem;
}

.piezas-hero__copy {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.piezas-hero__actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.piezas-hero__icon,
.piezas-dialog__icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
  font-size: 1.8rem;
}

.piezas-hero h1,
.piezas-dialog__header h3 {
  margin: 0;
  color: white;
  font-size: clamp(1.7rem, 3vw, 2.2rem);
  font-weight: 800;
}

.piezas-hero p,
.piezas-dialog__header p {
  margin: 0.4rem 0 0;
  color: rgba(255, 255, 255, 0.82);
}

.piezas-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.piezas-stat-card,
.piezas-toolbar,
.piezas-table-card {
  border-radius: 24px;
  border: 1px solid #d9e7ef;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.piezas-stat-card {
  padding: 1.25rem;
}

.piezas-stat-card span {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.piezas-stat-card strong {
  display: block;
  margin-top: 0.4rem;
  font-size: 1.8rem;
  color: #0f172a;
}

.piezas-stat-card small {
  display: block;
  margin-top: 0.3rem;
  color: #64748b;
}

.piezas-toolbar :deep(.p-card-body),
.piezas-table-card :deep(.p-card-body) {
  padding: 1.2rem;
}

.piezas-toolbar__row {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.piezas-toolbar__search {
  flex: 1;
  position: relative;
}

.piezas-toolbar__search i {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  z-index: 1;
}

.piezas-toolbar__search :deep(.p-inputtext) {
  width: 100%;
  padding-left: 2.5rem;
}

.piezas-toolbar__actions {
  display: flex;
  gap: 0.75rem;
}

.piezas-table__actions {
  display: flex;
  gap: 0.35rem;
}

.piezas-table-card__header {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.piezas-table-card__header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
}

.piezas-table-card__header p {
  margin: 0.25rem 0 0;
  color: #64748b;
}

.piezas-toolbar__search--compact {
  max-width: 320px;
}

.piezas-movimientos__tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.piezas-movimientos__range {
  min-width: 240px;
}

.piezas-pdf-frame {
  width: 100%;
  height: 72vh;
  border: none;
  border-radius: 18px;
  background: white;
}

.piezas-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #64748b;
}

.piezas-empty i {
  font-size: 2rem;
  margin-bottom: 0.6rem;
}

.piezas-dialog__header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.piezas-dialog__header h3,
.piezas-dialog__header p {
  color: #0f172a;
}

.piezas-dialog__header p {
  color: #64748b;
}

.piezas-dialog__icon {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  border: none;
}

.piezas-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.piezas-form-grid--assign {
  margin-top: 1rem;
}

.piezas-asignar {
  display: grid;
  gap: 1rem;
}

.p-field label {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #0f172a;
}

.p-field--full {
  grid-column: 1 / -1;
}

.piezas-page :deep(.p-inputtext),
.piezas-page :deep(.p-dropdown),
.piezas-page :deep(.p-inputnumber-input),
.piezas-page :deep(.p-textarea) {
  border-radius: 16px;
}

.piezas-page :deep(.p-button) {
  border-radius: 16px;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .piezas-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .piezas-toolbar__row {
    flex-direction: column;
    align-items: stretch;
  }

  .piezas-movimientos__tools {
    justify-content: stretch;
  }

  .piezas-movimientos__range {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .piezas-page {
    padding: 1rem;
  }

  .piezas-hero {
    flex-direction: column;
    padding: 1.4rem;
  }

  .piezas-hero__copy {
    align-items: flex-start;
  }

  .piezas-hero__actions {
    width: 100%;
    flex-direction: column;
  }

  .piezas-hero__actions > * {
    width: 100%;
  }

  .piezas-stats,
  .piezas-form-grid {
    grid-template-columns: 1fr;
  }

  .piezas-toolbar__actions {
    flex-direction: column;
  }

  .piezas-toolbar__actions > * {
    width: 100%;
  }

  .piezas-table-card__header {
    flex-direction: column;
    align-items: stretch;
  }

  .piezas-movimientos__tools {
    flex-direction: column;
    align-items: stretch;
  }

  .piezas-movimientos__tools > * {
    width: 100%;
  }

  .piezas-toolbar__search--compact {
    max-width: none;
  }

  .piezas-pdf-frame {
    height: 68vh;
  }
}
</style>
