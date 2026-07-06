<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import {
  nfecha,
  peticionesFetchOffline,
  crearTablaSiNoExisteOffline,
  arrayToObjetoFromTablaOffline
} from '@/funciones/funciones.js'
import { useDatosEmpresa } from '@/stores'
import Swal from 'sweetalert2'
import LoadingOverlay from '@/Loading/LoadingOverlay.vue'

const router = useRouter()
const toast = useToast()
const datosEmpresa = useDatosEmpresa()

const loading = ref(false)
const vistaActual = ref('historial') // 'registrar' o 'historial'

// PDF embebido
const visiblePDF = ref(false)
const pdfUrl = ref('')

// Formulario de registro
const formulario = ref({
  codigo_producto: '',
  nombre_producto: '',
  cantidad: 1,
  imei_serial: '',
  motivo_baja: '',
  descripcion_dano: '',
  estado: 'Dado de baja',
  fecha: nfecha('fecha'),
  hora: nfecha('hora'),
  usuario: ''
})

// Lista de productos dañados
const productosDanados = ref([])
const searchQuery = ref('')

// Filtros de fecha
const filtroFecha = ref('hoy')
const fechaDesde = ref(null)
const fechaHasta = ref(null)

const opcionesFecha = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Ayer', value: 'ayer' },
  { label: 'Últimos 7 días', value: 'ultimos7dias' },
  { label: 'Este mes', value: 'estemes' },
  { label: 'Rango personalizado', value: 'rango' }
]

// Selector de productos
const productosDisponibles = ref([])
const productoSeleccionado = ref(null)
const filteredProductos = ref([])

// Para productos con IMEI/Serial (CELULARES y ELECTRODOMESTICOS)
const tieneSeriales = ref(false)
const opcionCantidad = ref('uno') // 'uno', 'varios', 'todos'
const imeiDisponibles = ref([])
const imeiSeleccionados = ref([])

const opcionesCantidad = [
  { label: 'Solo uno', value: 'uno' },
  { label: 'Varios', value: 'varios' },
  { label: 'Todos', value: 'todos' }
]

// Opciones para los selects
const motivosBaja = [
  'Producto dañado',
  'Mal estado',
  'Vencido',
  'Defectuoso',
  'Deteriorado',
  'Otro'
]

const estadosProducto = [
  'Dado de baja',
  'En reparación',
  'Reparado',
  'Devuelto a inventario',
  'Desechado',
  'Vendido como defectuoso'
]

// Funciones helper para fechas
const obtenerFechaInicio = () => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  switch (filtroFecha.value) {
    case 'hoy':
      return hoy

    case 'ayer':
      const ayer = new Date(hoy)
      ayer.setDate(ayer.getDate() - 1)
      return ayer

    case 'ultimos7dias':
      const hace7dias = new Date(hoy)
      hace7dias.setDate(hace7dias.getDate() - 7)
      return hace7dias

    case 'estemes':
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      return inicioMes

    case 'rango':
      return fechaDesde.value ? new Date(fechaDesde.value) : null

    default:
      return hoy
  }
}

const obtenerFechaFin = () => {
  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999)

  switch (filtroFecha.value) {
    case 'hoy':
      return hoy

    case 'ayer':
      const ayer = new Date(hoy)
      ayer.setDate(ayer.getDate() - 1)
      ayer.setHours(23, 59, 59, 999)
      return ayer

    case 'ultimos7dias':
    case 'estemes':
      return hoy

    case 'rango':
      return fechaHasta.value ? new Date(fechaHasta.value) : hoy

    default:
      return hoy
  }
}

const estaEnRangoFecha = (createdAt) => {
  if (!createdAt) {
    return false
  }

  try {
    // Convertir el created_at a Date object
    let fechaProducto

    if (typeof createdAt === 'number') {
      // Si es un timestamp numérico (milliseconds)
      fechaProducto = new Date(createdAt)
    } else if (typeof createdAt === 'string') {
      // Si es un string, puede ser ISO o timestamp string
      if (/^\d+$/.test(createdAt)) {
        // Es un timestamp en string, convertir a número
        fechaProducto = new Date(parseInt(createdAt))
      } else {
        // Es un string ISO u otro formato
        fechaProducto = new Date(createdAt)
      }
    } else {
      fechaProducto = new Date(createdAt)
    }

    // Verificar que la fecha sea válida
    if (isNaN(fechaProducto.getTime())) {
      console.log('⚠️ Fecha inválida:', createdAt)
      return false
    }

    const fechaInicio = obtenerFechaInicio()
    const fechaFin = obtenerFechaFin()

    if (!fechaInicio) return true

    // Log para debug
    console.log('Comparando:', {
      producto: fechaProducto.toISOString(),
      inicio: fechaInicio.toISOString(),
      fin: fechaFin.toISOString(),
      filtroActual: filtroFecha.value
    })

    // Para "hoy" y "ayer", comparar solo la fecha (sin hora)
    if (filtroFecha.value === 'hoy' || filtroFecha.value === 'ayer') {
      // Extraer solo la fecha (YYYY-MM-DD) para comparación
      const fechaProdStr = fechaProducto.toISOString().split('T')[0]
      const fechaInicioStr = fechaInicio.toISOString().split('T')[0]
      const fechaFinStr = fechaFin.toISOString().split('T')[0]

      const resultado = fechaProdStr >= fechaInicioStr && fechaProdStr <= fechaFinStr

      console.log('Comparación por fecha:', {
        producto: fechaProdStr,
        inicio: fechaInicioStr,
        fin: fechaFinStr,
        pasa: resultado
      })

      return resultado
    }

    // Para otros filtros, usar comparación con hora
    return fechaProducto >= fechaInicio && fechaProducto <= fechaFin
  } catch (error) {
    console.error('❌ Error al comparar fechas:', error, 'created_at:', createdAt)
    return false
  }
}

// Función simplificada para comparar solo fechas (sin hora)
const compararSoloFecha = (timestamp) => {
  if (!timestamp) return false

  try {
    // Convertir timestamp a fecha
    const fechaProducto = new Date(timestamp)
    const hoy = new Date()

    // Obtener solo YYYY-MM-DD
    const fechaProdStr = fechaProducto.toISOString().split('T')[0]
    const hoyStr = hoy.toISOString().split('T')[0]
    const ayerStr = new Date(hoy.setDate(hoy.getDate() - 1)).toISOString().split('T')[0]

    console.log('🔍 Comparando:', {
      producto: fechaProdStr,
      hoy: hoyStr,
      ayer: ayerStr,
      filtro: filtroFecha.value
    })

    switch (filtroFecha.value) {
      case 'hoy':
        return fechaProdStr === hoyStr

      case 'ayer':
        return fechaProdStr === ayerStr

      case 'ultimos7dias': {
        const hace7dias = new Date()
        hace7dias.setDate(hace7dias.getDate() - 7)
        const hace7diasStr = hace7dias.toISOString().split('T')[0]
        return fechaProdStr >= hace7diasStr && fechaProdStr <= hoyStr
      }

      case 'estemes': {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        const inicioMesStr = inicioMes.toISOString().split('T')[0]
        return fechaProdStr >= inicioMesStr && fechaProdStr <= hoyStr
      }

      case 'rango': {
        if (!fechaDesde.value || !fechaHasta.value) return true
        const desdeStr = new Date(fechaDesde.value).toISOString().split('T')[0]
        const hastaStr = new Date(fechaHasta.value).toISOString().split('T')[0]
        return fechaProdStr >= desdeStr && fechaProdStr <= hastaStr
      }

      default:
        return true
    }
  } catch (error) {
    console.error('Error al comparar:', error)
    return false
  }
}

// Computed para filtrar productos
const productosFiltrados = computed(() => {
  // Forzar dependencias reactivas
  const filtro = filtroFecha.value
  const desde = fechaDesde.value
  const hasta = fechaHasta.value
  const busqueda = searchQuery.value

  console.log('🔄 FILTRO EJECUTADO - Filtro:', filtro)
  console.log('📦 Total productos:', productosDanados.value.length)

  let resultado = [...productosDanados.value]

  // Filtrar por fecha usando created_at
  resultado = resultado.filter((p) => {
    const pasa = compararSoloFecha(p.created_at)
    return pasa
  })

  console.log('✅ Productos después de filtro:', resultado.length)

  // Filtrar por búsqueda de texto
  if (busqueda) {
    const query = busqueda.toLowerCase()
    resultado = resultado.filter(
      (p) =>
        p.nombre_producto?.toLowerCase().includes(query) ||
        p.codigo_producto?.toLowerCase().includes(query) ||
        p.motivo_baja?.toLowerCase().includes(query) ||
        p.estado?.toLowerCase().includes(query) ||
        p.imei_serial?.toLowerCase().includes(query)
    )
  }

  return resultado
})

// Estadísticas (basadas en el filtro de fecha)
const estadisticas = computed(() => {
  // Usar la misma lógica de filtrado que productosFiltrados
  const productosFiltradosPorFecha = productosDanados.value.filter((p) =>
    compararSoloFecha(p.created_at)
  )

  const total = productosFiltradosPorFecha.length
  const dadosDeBaja = productosFiltradosPorFecha.filter((p) => p.estado === 'Dado de baja').length
  const enReparacion = productosFiltradosPorFecha.filter((p) => p.estado === 'En reparación').length
  const reparados = productosFiltradosPorFecha.filter((p) => p.estado === 'Reparado').length

  return { total, dadosDeBaja, enReparacion, reparados }
})

// Inicializar
onMounted(async () => {
  await inicializarTabla()
  await cargarDatos()
  await cargarProductos()
})

// Cargar productos disponibles
const cargarProductos = async () => {
  try {
    const datos = await peticionesFetchOffline('getDataAsArray', 'productos', '')
    productosDisponibles.value = datos.map((p) => ({
      ...p,
      label: `${p.codigo || p.codigo_barra} - ${p.nombre} (Stock: ${p.stock})`,
      value: p.id
    }))
  } catch (error) {
    console.error('Error al cargar productos:', error)
  }
}

// Buscar productos (para el autocomplete)
const buscarProducto = (event) => {
  if (!event.query.trim().length) {
    filteredProductos.value = [...productosDisponibles.value]
  } else {
    const query = event.query.toLowerCase()
    filteredProductos.value = productosDisponibles.value.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(query) ||
        p.codigo?.toLowerCase().includes(query) ||
        p.codigo_barra?.toLowerCase().includes(query)
    )
  }
}

// Cuando se selecciona un producto
const onProductoSelect = async (event) => {
  if (event.value) {
    const producto = productosDisponibles.value.find((p) => p.id === event.value.id)
    if (producto) {
      formulario.value.codigo_producto = producto.codigo || producto.codigo_barra
      formulario.value.nombre_producto = producto.nombre

      // Si es CELULARES o ELECTRODOMESTICOS, cargar IMEI/Serial disponibles
      if (producto.categoria === 'CELULARES' || producto.categoria === 'ELECTRODOMESTICOS') {
        tieneSeriales.value = true
        opcionCantidad.value = 'uno'
        imeiSeleccionados.value = []

        // Cargar IMEI/Serial disponibles
        await cargarImeisDisponibles(producto.id)

        toast.add({
          severity: 'info',
          summary: 'Producto con Serial/IMEI',
          detail: `Se encontraron ${imeiDisponibles.value.length} unidades disponibles. Selecciona cuántas deseas pasar a dañados.`,
          life: 5000
        })
      } else {
        tieneSeriales.value = false
        imeiDisponibles.value = []
        imeiSeleccionados.value = []
      }
    }
  }
}

// Cargar IMEIs/Seriales disponibles de un producto
const cargarImeisDisponibles = async (productoId) => {
  try {
    loading.value = true
    const response = await peticionesFetchOffline(
      'getDataArrayByTwoConditions',
      'imei',
      'id_equi',
      productoId,
      'estado',
      'DISPONIBLE'
    )
    imeiDisponibles.value = response
  } catch (error) {
    console.error('Error al cargar IMEI/Serial:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar los IMEI/Serial disponibles',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Crear tabla si no existe
const inicializarTabla = async () => {
  const camposArray = [
    'codigo_producto',
    'nombre_producto',
    'cantidad',
    'imei_serial',
    'motivo_baja',
    'descripcion_dano',
    'estado',
    'fecha',
    'hora',
    'usuario'
  ]

  await crearTablaSiNoExisteOffline('productos_danados', camposArray, toast)
}

// Cargar datos
const cargarDatos = async () => {
  loading.value = true
  try {
    const datos = await peticionesFetchOffline('getDataAsArray', 'productos_danados', '')
    productosDanados.value = datos.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at)
    })

    // DEBUG: Mostrar formato de created_at
    if (datos.length > 0) {
      console.log('📊 FORMATO DE DATOS:')
      console.log('Total productos:', datos.length)
      console.log('Ejemplo de producto:', datos[0])
      console.log('created_at:', datos[0].created_at)
      console.log('Tipo de created_at:', typeof datos[0].created_at)
      console.log('fecha:', datos[0].fecha)
    }
  } catch (error) {
    console.error('Error al cargar productos dañados:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar datos',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Registrar producto dañado
const registrarProductoDanado = async () => {
  if (!formulario.value.codigo_producto || !formulario.value.nombre_producto) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el producto',
      life: 3000
    })
    return
  }

  if (!formulario.value.motivo_baja) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Debe especificar el motivo de baja',
      life: 3000
    })
    return
  }

  // Validaciones para productos con seriales
  if (tieneSeriales.value) {
    if (opcionCantidad.value === 'uno' && imeiSeleccionados.value.length !== 1) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar exactamente un IMEI/Serial',
        life: 3000
      })
      return
    }

    if (opcionCantidad.value === 'varios' && imeiSeleccionados.value.length === 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe seleccionar al menos un IMEI/Serial',
        life: 3000
      })
      return
    }

    if (opcionCantidad.value === 'todos') {
      imeiSeleccionados.value = [...imeiDisponibles.value]
    }
  } else {
    // Validación para productos sin seriales
    if (formulario.value.cantidad <= 0) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La cantidad debe ser mayor a 0',
        life: 3000
      })
      return
    }
  }

  loading.value = true

  try {
    if (tieneSeriales.value) {
      // Procesar productos con IMEI/Serial
      for (const imeiData of imeiSeleccionados.value) {
        // Registrar en productos_danados
        const datos = {
          codigo_producto: formulario.value.codigo_producto,
          nombre_producto: formulario.value.nombre_producto,
          cantidad: 1,
          imei_serial: imeiData.imei,
          motivo_baja: formulario.value.motivo_baja,
          descripcion_dano: formulario.value.descripcion_dano,
          estado: formulario.value.estado,
          fecha: nfecha('fecha'),
          hora: nfecha('hora'),
          usuario: datosEmpresa.usuario.nombre,
          created_at: nfecha('timestamp'),
          updated_at: nfecha('timestamp')
        }

        await peticionesFetchOffline('insertData', 'productos_danados', JSON.stringify(datos))

        // Actualizar estado del IMEI a 'DANADO'
        imeiData.estado = 'DANADO'
        imeiData.updated_at = nfecha('timestamp')
        await peticionesFetchOffline('updateData', 'imei', JSON.stringify(imeiData))
      }

      // Actualizar stock del producto
      const producto = productosDisponibles.value.find(
        (p) =>
          p.codigo === formulario.value.codigo_producto ||
          p.codigo_barra === formulario.value.codigo_producto
      )

      if (producto) {
        const responseImeiDisponibles = await peticionesFetchOffline(
          'getDataArrayByTwoConditions',
          'imei',
          'id_equi',
          producto.id,
          'estado',
          'DISPONIBLE'
        )
        producto.stock = responseImeiDisponibles.length
        producto.updated_at = nfecha('timestamp')
        await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto))
      }

      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `${imeiSeleccionados.value.length} producto(s) registrado(s) como dañado(s)`,
        life: 3000
      })
    } else {
      // Procesar productos sin seriales
      const datos = {
        ...formulario.value,
        usuario: datosEmpresa.usuario.nombre,
        fecha: nfecha('fecha'),
        hora: nfecha('hora'),
        created_at: nfecha('timestamp'),
        updated_at: nfecha('timestamp')
      }

      const resultado = await peticionesFetchOffline(
        'insertData',
        'productos_danados',
        JSON.stringify(datos)
      )

      if (resultado[0] === 'ok') {
        // Actualizar stock del producto
        const producto = productosDisponibles.value.find(
          (p) =>
            p.codigo === formulario.value.codigo_producto ||
            p.codigo_barra === formulario.value.codigo_producto
        )

        if (producto) {
          producto.stock = Number(producto.stock) - formulario.value.cantidad
          producto.updated_at = nfecha('timestamp')
          await peticionesFetchOffline('updateData', 'productos', JSON.stringify(producto))
        }

        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto registrado como dañado',
          life: 3000
        })
      }
    }

    limpiarFormulario()
    await cargarDatos()
    await cargarProductos() // Recargar lista de productos
    vistaActual.value = 'historial'
  } catch (error) {
    console.error('Error:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al procesar la solicitud',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Cambiar estado de producto
const cambiarEstado = async (producto) => {
  const { value: nuevoEstado } = await Swal.fire({
    title: 'Cambiar Estado',
    text: `Producto: ${producto.nombre_producto}`,
    input: 'select',
    inputOptions: estadosProducto.reduce((obj, estado) => {
      obj[estado] = estado
      return obj
    }, {}),
    inputValue: producto.estado,
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debe seleccionar un estado'
      }
    }
  })

  if (nuevoEstado) {
    loading.value = true
    try {
      const datosActualizados = {
        ...producto,
        estado: nuevoEstado,
        updated_at: nfecha('timestamp')
      }

      const resultado = await peticionesFetchOffline(
        'updateData',
        'productos_danados',
        JSON.stringify(datosActualizados)
      )

      if (resultado[0] === 'ok') {
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado actualizado correctamente',
          life: 3000
        })
        await cargarDatos()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al actualizar el estado',
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }
}

// Eliminar registro
const eliminarRegistro = async (producto) => {
  const result = await Swal.fire({
    title: '¿Está seguro?',
    text: `¿Desea eliminar el registro de "${producto.nombre_producto}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  })

  if (result.isConfirmed) {
    loading.value = true
    try {
      const resultado = await peticionesFetchOffline(
        'deleteEntry',
        'productos_danados',
        producto.id
      )

      if (resultado[0] === 'ok') {
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Registro eliminado correctamente',
          life: 3000
        })
        await cargarDatos()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el registro',
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }
}

// Limpiar formulario
const limpiarFormulario = () => {
  productoSeleccionado.value = null
  tieneSeriales.value = false
  opcionCantidad.value = 'uno'
  imeiDisponibles.value = []
  imeiSeleccionados.value = []
  formulario.value = {
    codigo_producto: '',
    nombre_producto: '',
    cantidad: 1,
    imei_serial: '',
    motivo_baja: '',
    descripcion_dano: '',
    estado: 'Dado de baja',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    usuario: ''
  }
}

// Obtener clase de badge según estado
const getEstadoBadgeClass = (estado) => {
  const clases = {
    'Dado de baja': 'bg-red-100 text-red-700',
    'En reparación': 'bg-yellow-100 text-yellow-700',
    Reparado: 'bg-green-100 text-green-700',
    'Devuelto a inventario': 'bg-blue-100 text-blue-700',
    Desechado: 'bg-gray-100 text-gray-700',
    'Vendido como defectuoso': 'bg-purple-100 text-purple-700'
  }
  return clases[estado] || 'bg-gray-100 text-gray-700'
}

// Exportar a Excel
const exportarExcel = () => {
  toast.add({
    severity: 'info',
    summary: 'Exportar',
    detail: 'Función de exportación próximamente',
    life: 3000
  })
}

// Generar PDF embebido (HTML convertido a PDF)
const generarPDF = async () => {
  try {
    loading.value = true

    const productos = productosFiltrados.value

    if (productos.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay productos para generar el PDF',
        life: 3000
      })
      loading.value = false
      return
    }

    // Obtener descripción del filtro
    let tituloFiltro = 'Todos los registros'
    switch (filtroFecha.value) {
      case 'hoy':
        tituloFiltro = 'Registros de Hoy'
        break
      case 'ayer':
        tituloFiltro = 'Registros de Ayer'
        break
      case 'ultimos7dias':
        tituloFiltro = 'Últimos 7 Días'
        break
      case 'estemes':
        tituloFiltro = 'Este Mes'
        break
      case 'rango':
        tituloFiltro = `Rango: ${fechaDesde.value || ''} - ${fechaHasta.value || ''}`
        break
    }

    // Generar HTML para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Productos Dañados</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ef4444; padding-bottom: 15px; }
          .header h1 { color: #dc2626; font-size: 24px; margin-bottom: 5px; }
          .header h2 { color: #4b5563; font-size: 16px; margin-bottom: 5px; }
          .header .filtro { color: #059669; font-size: 14px; font-weight: bold; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #ef4444; color: white; padding: 10px; text-align: left; font-size: 11px; }
          td { padding: 8px; border-bottom: 1px solid #fee2e2; font-size: 10px; }
          tr:nth-child(even) { background-color: #fef2f2; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; font-size: 11px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${datosEmpresa.empresa?.nombre || 'Empresa'}</h1>
          <h2>Reporte de Productos Dañados</h2>
          <div class="filtro">${tituloFiltro}</div>
        </div>

        <div class="info">
          <div>Fecha: ${nfecha('fecha')} | Hora: ${nfecha('hora')}</div>
          <div>Total de registros: ${productos.length}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Código</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>IMEI/Serial</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            ${productos
              .map(
                (p) => `
              <tr>
                <td>${p.fecha || ''}</td>
                <td>${p.codigo_producto || ''}</td>
                <td>${p.nombre_producto || ''}</td>
                <td style="text-align: center;">${p.cantidad || ''}</td>
                <td>${p.imei_serial || 'N/A'}</td>
                <td>${p.motivo_baja || ''}</td>
                <td>${p.estado || ''}</td>
                <td>${p.usuario || ''}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          Generado por Sistema AA
        </div>
      </body>
      </html>
    `

    // Crear blob del HTML
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    pdfUrl.value = url
    visiblePDF.value = true
    loading.value = false

    toast.add({
      severity: 'success',
      summary: 'Vista Generada',
      detail: 'Usa Ctrl+P para imprimir o guardar como PDF',
      life: 5000
    })
  } catch (error) {
    console.error('Error al generar vista:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al generar la vista',
      life: 3000
    })
    loading.value = false
  }
}

// Cerrar PDF
const cerrarPDF = () => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
    pdfUrl.value = ''
  }
  visiblePDF.value = false
}

// Imprimir/Descargar PDF
const descargarPDF = () => {
  if (pdfUrl.value) {
    // Abrir ventana de impresión
    const iframe = document.querySelector('iframe')
    if (iframe) {
      iframe.contentWindow.print()
    }
  }
}
</script>

<template>
  <div class="productos-danados-page">
    <LoadingOverlay :visible="loading" />

    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center gap-3 mb-4">
        <Button
          v-tooltip.bottom="'Volver al inicio'"
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          rounded
          @click="router.push('/')"
        />
        <div class="bg-red-500 rounded-full p-3">
          <i class="pi pi-exclamation-triangle text-white text-2xl"></i>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-800 m-0">Productos Dañados</h1>
          <p class="text-sm text-gray-500 m-0">Gestión y seguimiento de productos dados de baja</p>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="stat-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total</p>
              <p class="text-3xl font-bold text-gray-800">{{ estadisticas.total }}</p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <i class="pi pi-box text-blue-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Dados de Baja</p>
              <p class="text-3xl font-bold text-red-600">{{ estadisticas.dadosDeBaja }}</p>
            </div>
            <div class="bg-red-100 rounded-full p-3">
              <i class="pi pi-times-circle text-red-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">En Reparación</p>
              <p class="text-3xl font-bold text-yellow-600">{{ estadisticas.enReparacion }}</p>
            </div>
            <div class="bg-yellow-100 rounded-full p-3">
              <i class="pi pi-wrench text-yellow-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Reparados</p>
              <p class="text-3xl font-bold text-green-600">{{ estadisticas.reparados }}</p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <i class="pi pi-check-circle text-green-600 text-2xl"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Main Content Card -->
    <Card>
      <template #content>
        <!-- Pestañas de navegación -->
        <div class="mb-4 border-b border-gray-200">
          <nav class="flex gap-4">
            <button
              :class="[
                'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                vistaActual === 'historial'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
              @click="vistaActual = 'historial'"
            >
              <i class="pi pi-list mr-2"></i>Historial ({{ productosDanados.length }})
            </button>
            <button
              :class="[
                'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                vistaActual === 'registrar'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
              @click="vistaActual = 'registrar'"
            >
              <i class="pi pi-plus-circle mr-2"></i>Registrar Nuevo
            </button>
          </nav>
        </div>

        <!-- Vista de Historial -->
        <div v-if="vistaActual === 'historial'" class="space-y-4">
          <!-- Filtros de Fecha -->
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div class="flex flex-wrap items-end gap-4">
              <div class="flex-1" style="min-width: 250px">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="pi pi-calendar mr-1"></i>
                  Filtrar por fecha
                </label>
                <Select
                  v-model="filtroFecha"
                  :options="opcionesFecha"
                  option-label="label"
                  option-value="value"
                  placeholder="Seleccione período"
                  class="w-full"
                />
              </div>

              <!-- Rango de fechas personalizado -->
              <div v-if="filtroFecha === 'rango'" class="flex gap-3 flex-wrap">
                <div style="min-width: 180px">
                  <label class="block text-sm font-medium text-gray-700 mb-2"> Desde </label>
                  <DatePicker
                    v-model="fechaDesde"
                    placeholder="Fecha inicio"
                    date-format="yy-mm-dd"
                    show-icon
                    class="w-full"
                  />
                </div>
                <div style="min-width: 180px">
                  <label class="block text-sm font-medium text-gray-700 mb-2"> Hasta </label>
                  <DatePicker
                    v-model="fechaHasta"
                    placeholder="Fecha fin"
                    date-format="yy-mm-dd"
                    show-icon
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Resumen del filtro -->
              <div class="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                <i class="pi pi-info-circle mr-1"></i>
                <span v-if="filtroFecha === 'hoy'"
                  >Mostrando registros de <strong>hoy</strong></span
                >
                <span v-else-if="filtroFecha === 'ayer'"
                  >Mostrando registros de <strong>ayer</strong></span
                >
                <span v-else-if="filtroFecha === 'ultimos7dias'"
                  >Mostrando registros de los <strong>últimos 7 días</strong></span
                >
                <span v-else-if="filtroFecha === 'estemes'"
                  >Mostrando registros de <strong>este mes</strong></span
                >
                <span v-else-if="filtroFecha === 'rango'"
                  >Mostrando rango <strong>personalizado</strong></span
                >
              </div>
            </div>
          </div>

          <!-- Barra de acciones -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="p-input-icon-left flex-1" style="min-width: 300px">
              <i class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por producto, código, motivo, estado o IMEI/Serial..."
                class="w-full"
              />
            </span>
            <div class="flex gap-2">
              <Button
                icon="pi pi-refresh"
                label="Recargar"
                severity="secondary"
                outlined
                @click="cargarDatos"
              />
              <Button
                icon="pi pi-file-excel"
                label="Exportar"
                severity="success"
                outlined
                @click="exportarExcel"
              />
              <Button
                v-tooltip.bottom="'Generar PDF'"
                icon="pi pi-file-pdf"
                label="PDF"
                severity="danger"
                outlined
                @click="generarPDF"
              />
            </div>
          </div>

          <!-- Tabla de productos dañados -->
          <DataTable
            :value="productosFiltrados"
            paginator
            :rows="10"
            :rows-per-page-options="[5, 10, 20, 50, 100]"
            scrollable
            scroll-height="600px"
            class="mt-4"
            :empty-message="'No hay registros de productos dañados'"
          >
            <Column field="fecha" header="Fecha" style="min-width: 100px" sortable>
              <template #body="{ data }">
                <div class="text-sm">
                  <div class="font-medium">{{ data.fecha }}</div>
                  <div class="text-gray-500">{{ data.hora }}</div>
                </div>
              </template>
            </Column>

            <Column field="codigo_producto" header="Código" style="min-width: 120px" sortable>
              <template #body="{ data }">
                <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {{ data.codigo_producto }}
                </span>
              </template>
            </Column>

            <Column field="nombre_producto" header="Producto" style="min-width: 200px" sortable>
              <template #body="{ data }">
                <div class="font-medium">{{ data.nombre_producto }}</div>
              </template>
            </Column>

            <Column
              field="cantidad"
              header="Cant."
              style="min-width: 80px"
              class="text-center"
              sortable
            >
              <template #body="{ data }">
                <span class="font-bold">{{ data.cantidad }}</span>
              </template>
            </Column>

            <Column field="imei_serial" header="IMEI/Serial" style="min-width: 150px" sortable>
              <template #body="{ data }">
                <span
                  v-if="data.imei_serial"
                  class="font-mono text-xs bg-blue-50 px-2 py-1 rounded"
                >
                  {{ data.imei_serial }}
                </span>
                <span v-else class="text-gray-400 text-xs">N/A</span>
              </template>
            </Column>

            <Column field="motivo_baja" header="Motivo" style="min-width: 150px" sortable>
              <template #body="{ data }">
                <div class="text-sm">{{ data.motivo_baja }}</div>
              </template>
            </Column>

            <Column field="descripcion_dano" header="Descripción" style="min-width: 200px">
              <template #body="{ data }">
                <div class="text-sm text-gray-600 truncate" :title="data.descripcion_dano">
                  {{ data.descripcion_dano || 'Sin descripción' }}
                </div>
              </template>
            </Column>

            <Column field="estado" header="Estado" style="min-width: 180px" sortable>
              <template #body="{ data }">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    getEstadoBadgeClass(data.estado)
                  ]"
                >
                  {{ data.estado }}
                </span>
              </template>
            </Column>

            <Column field="usuario" header="Usuario" style="min-width: 120px" sortable>
              <template #body="{ data }">
                <div class="text-sm">{{ data.usuario }}</div>
              </template>
            </Column>

            <Column header="Acciones" style="min-width: 150px" frozen align-frozen="right">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button
                    v-tooltip.top="'Cambiar estado'"
                    icon="pi pi-sync"
                    severity="info"
                    size="small"
                    @click="cambiarEstado(data)"
                  />
                  <Button
                    v-tooltip.top="'Eliminar'"
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    @click="eliminarRegistro(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Vista de Registro -->
        <div v-else class="space-y-4">
          <div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
            <h3 class="text-lg font-semibold mb-3 text-gray-700">
              <i class="pi pi-info-circle mr-2"></i>Información del Producto
            </h3>
            <div class="grid grid-cols-1 gap-4">
              <!-- Selector de Producto -->
              <div class="md:col-span-2">
                <label for="producto_selector" class="block text-sm font-medium text-gray-700 mb-2">
                  Buscar y Seleccionar Producto <span class="text-red-500">*</span>
                </label>
                <AutoComplete
                  v-model="productoSeleccionado"
                  :suggestions="filteredProductos"
                  option-label="label"
                  placeholder="Buscar por código, nombre o descripción..."
                  class="w-full"
                  dropdown
                  force-selection
                  @complete="buscarProducto"
                  @item-select="onProductoSelect"
                >
                  <template #option="slotProps">
                    <div class="flex items-center gap-2">
                      <div>
                        <div class="font-medium">{{ slotProps.option.nombre }}</div>
                        <div class="text-xs text-gray-500">
                          Código: {{ slotProps.option.codigo || slotProps.option.codigo_barra }} |
                          Stock: {{ slotProps.option.stock }} |
                          {{ slotProps.option.categoria }}
                        </div>
                      </div>
                    </div>
                  </template>
                </AutoComplete>
                <small class="text-gray-500">
                  <i class="pi pi-info-circle mr-1"></i>
                  Escribe para buscar o haz clic en la flecha para ver todos los productos
                </small>
              </div>
            </div>

            <!-- Información del Producto Seleccionado -->
            <div
              v-if="formulario.codigo_producto"
              class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-orange-200"
            >
              <div>
                <label for="codigo_producto" class="block text-sm font-medium text-gray-700 mb-2">
                  Código del Producto
                </label>
                <InputText
                  id="codigo_producto"
                  v-model="formulario.codigo_producto"
                  placeholder="Código o código de barras"
                  class="w-full"
                  readonly
                  disabled
                />
              </div>

              <div>
                <label for="nombre_producto" class="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto
                </label>
                <InputText
                  id="nombre_producto"
                  v-model="formulario.nombre_producto"
                  placeholder="Nombre o descripción"
                  class="w-full"
                  readonly
                  disabled
                />
              </div>

              <!-- Si tiene seriales (CELULARES o ELECTRODOMESTICOS) -->
              <div v-if="tieneSeriales" class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  ¿Cuántos deseas pasar a dañados? <span class="text-red-500">*</span>
                </label>
                <SelectButton
                  v-model="opcionCantidad"
                  :options="opcionesCantidad"
                  option-label="label"
                  option-value="value"
                  class="w-full"
                />

                <!-- Lista de IMEI/Serial disponibles -->
                <div v-if="opcionCantidad !== 'todos'" class="mt-4 border rounded-lg p-4 bg-white">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-700">
                      Selecciona {{ opcionCantidad === 'uno' ? 'un' : 'los' }} IMEI/Serial
                    </h4>
                    <span class="text-sm text-gray-500">
                      Disponibles: {{ imeiDisponibles.length }}
                    </span>
                  </div>

                  <div v-if="imeiDisponibles.length === 0" class="text-center text-gray-500 py-4">
                    No hay IMEI/Seriales disponibles
                  </div>

                  <div v-else class="space-y-2 max-h-60 overflow-y-auto">
                    <!-- Si es "uno", usar radio buttons -->
                    <div
                      v-for="imeiData in imeiDisponibles"
                      v-if="opcionCantidad === 'uno'"
                      :key="imeiData.id"
                      class="flex items-center p-2 hover:bg-gray-50 rounded"
                    >
                      <RadioButton
                        v-model="imeiSeleccionados"
                        :value="[imeiData]"
                        :input-id="`imei-${imeiData.id}`"
                        name="imei_seleccionado"
                      />
                      <label :for="`imei-${imeiData.id}`" class="ml-3 cursor-pointer flex-1">
                        <div class="font-medium text-gray-900">{{ imeiData.imei }}</div>
                        <div class="text-xs text-gray-500">Fecha: {{ imeiData.fecha }}</div>
                      </label>
                    </div>

                    <!-- Si es "varios", usar checkboxes -->
                    <div
                      v-for="imeiData in imeiDisponibles"
                      v-else
                      :key="imeiData.id"
                      class="flex items-center p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        v-model="imeiSeleccionados"
                        :value="imeiData"
                        :input-id="`imei-${imeiData.id}`"
                      />
                      <label :for="`imei-${imeiData.id}`" class="ml-3 cursor-pointer flex-1">
                        <div class="font-medium text-gray-900">{{ imeiData.imei }}</div>
                        <div class="text-xs text-gray-500">Fecha: {{ imeiData.fecha }}</div>
                      </label>
                    </div>
                  </div>

                  <div v-if="opcionCantidad === 'varios'" class="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      label="Seleccionar Todos"
                      icon="pi pi-check-square"
                      severity="secondary"
                      outlined
                      size="small"
                      :disabled="imeiDisponibles.length === 0"
                      @click="imeiSeleccionados = [...imeiDisponibles]"
                    />
                    <Button
                      label="Deseleccionar Todos"
                      icon="pi pi-stop"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="imeiSeleccionados = []"
                    />
                  </div>

                  <div class="text-sm text-gray-600 mt-3 bg-blue-50 p-2 rounded">
                    <i class="pi pi-info-circle mr-1"></i>
                    Seleccionados: {{ imeiSeleccionados.length }}
                  </div>
                </div>

                <div v-else class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div class="flex items-start gap-2">
                    <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
                    <div>
                      <p class="font-semibold text-yellow-800">
                        Todos los IMEI/Seriales serán marcados como dañados
                      </p>
                      <p class="text-sm text-yellow-700 mt-1">
                        Se pasarán <strong>{{ imeiDisponibles.length }}</strong> unidades a
                        productos dañados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Si NO tiene seriales, mostrar campo de cantidad normal -->
              <div v-else>
                <label for="cantidad" class="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad <span class="text-red-500">*</span>
                </label>
                <InputNumber
                  id="cantidad"
                  v-model="formulario.cantidad"
                  :min="1"
                  show-buttons
                  class="w-full"
                />
              </div>

              <div>
                <label for="motivo_baja" class="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de Baja <span class="text-red-500">*</span>
                </label>
                <Select
                  id="motivo_baja"
                  v-model="formulario.motivo_baja"
                  :options="motivosBaja"
                  placeholder="Seleccione motivo"
                  class="w-full"
                />
              </div>

              <div>
                <label for="estado" class="block text-sm font-medium text-gray-700 mb-2">
                  Estado Inicial
                </label>
                <Select
                  id="estado"
                  v-model="formulario.estado"
                  :options="estadosProducto"
                  placeholder="Seleccione estado"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
            <h3 class="text-lg font-semibold mb-3 text-gray-700">
              <i class="pi pi-file-edit mr-2"></i>Detalles del Daño
            </h3>
            <div>
              <label for="descripcion_dano" class="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Daño
              </label>
              <Textarea
                id="descripcion_dano"
                v-model="formulario.descripcion_dano"
                rows="4"
                placeholder="Describa detalladamente el daño o problema del producto..."
                class="w-full"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="
                limpiarFormulario();
                vistaActual = 'historial'
              "
            />
            <Button
              label="Registrar Producto Dañado"
              icon="pi pi-save"
              severity="danger"
              :loading="loading"
              @click="registrarProductoDanado"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>

  <!-- Dialog PDF Embebido -->
  <Dialog
    v-model:visible="visiblePDF"
    modal
    :header="'Vista Previa del PDF'"
    :style="{ width: '90vw', height: '90vh' }"
    :maximizable="true"
    :dismissable-mask="false"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="bg-red-500 rounded-full p-2">
          <i class="pi pi-file-pdf text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800 m-0">Vista Previa del PDF</h2>
          <p class="text-sm text-gray-500 m-0">Reporte de Productos Dañados</p>
        </div>
      </div>
    </template>

    <div class="w-full h-full" style="min-height: 70vh">
      <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full border-0" style="min-height: 70vh" />
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-500">
          <i class="pi pi-info-circle mr-1"></i>
          Usa Ctrl+P o el botón "Imprimir" para guardar como PDF
        </div>
        <div class="flex gap-2">
          <Button
            label="Imprimir/Guardar PDF"
            icon="pi pi-print"
            severity="success"
            @click="descargarPDF"
          />
          <Button
            label="Cerrar"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="cerrarPDF"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <Toast />
</template>

<style scoped>
.productos-danados-page {
  padding: 1.5rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #f8f9fa;
}
</style>
