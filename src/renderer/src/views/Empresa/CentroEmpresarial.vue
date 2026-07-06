<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { jsPDF } from 'jspdf'
import { peticionesFetchOffline } from '@/funciones/funciones.js'
import { useDatosEmpresa } from '@/stores'

const router = useRouter()
const datosEmpresa = useDatosEmpresa()

const cargando = ref(false)
const busqueda = ref('')
const facturas = ref([])
const productos = ref([])
const clientes = ref([])
const cuentasCobrar = ref([])
const cuentasPagar = ref([])
const compras = ref([])
const proveedores = ref([])
const registroCaja = ref([])
const bitacora = ref([])
const notificaciones = ref([])
const cotizaciones = ref([])
const apartados = ref([])
const reclamaciones = ref([])
const facturacionElectronica = ref([])

const tablasCarga = [
  ['facturas', facturas],
  ['productos', productos],
  ['clientes', clientes],
  ['cuentas_cobrar', cuentasCobrar],
  ['cuentasxpagar', cuentasPagar],
  ['compras', compras],
  ['proveedores', proveedores],
  ['registrocaja', registroCaja],
  ['bitacora', bitacora],
  ['notificaciones', notificaciones],
  ['cotizacion', cotizaciones],
  ['apartados', apartados],
  ['reclamaciones', reclamaciones],
  ['facturacion_electronica_log', facturacionElectronica]
]

const money = (value) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2
  }).format(Number(value) || 0)

const numero = (value) => Number(value) || 0

const texto = (value) => String(value || '').trim()

const fechaRegistro = (item) =>
  texto(item.fecha_emision || item.fecha || item.created_at || item.timestamp || item.fecha_compra || item.fecha_vencimiento)

const esHoy = (item) => {
  const fecha = fechaRegistro(item)
  if (!fecha) return false
  return fecha.slice(0, 10) === new Date().toISOString().slice(0, 10)
}

const estaPendiente = (item) => {
  const estado = texto(item.estatus || item.estado || item.estado_factura).toUpperCase()
  return !['PAGADA', 'PAGADO', 'SALDADA', 'SALDADO', 'COBRADA', 'COBRADO', 'ANULADA', 'ANULADO'].includes(estado)
}

const normalizarProductosFactura = (factura) => {
  const raw = factura?.productos
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const ventasHoy = computed(() => facturas.value.filter(esHoy))
const ventasTotal = computed(() => facturas.value.reduce((sum, item) => sum + numero(item.total), 0))
const ventasHoyTotal = computed(() => ventasHoy.value.reduce((sum, item) => sum + numero(item.total), 0))
const gananciaTotal = computed(() => facturas.value.reduce((sum, item) => sum + numero(item.ganancia), 0))
const cxcPendiente = computed(() => cuentasCobrar.value.filter(estaPendiente))
const cxpPendiente = computed(() => cuentasPagar.value.filter(estaPendiente))
const saldoCxc = computed(() => cxcPendiente.value.reduce((sum, item) => sum + numero(item.saldo || item.monto_credito), 0))
const saldoCxp = computed(() => cxpPendiente.value.reduce((sum, item) => sum + numero(item.saldo || item.total), 0))
const stockBajo = computed(() => productos.value.filter((p) => numero(p.stock) <= numero(p.stock_minimo || p.minimo || 5)))
const productosSinCosto = computed(() => productos.value.filter((p) => numero(p.precio_compra || p.costo) <= 0))
const comprasTotal = computed(() => compras.value.reduce((sum, item) => sum + numero(item.total), 0))

const productosVendidos = computed(() => {
  const mapa = new Map()
  facturas.value.forEach((factura) => {
    normalizarProductosFactura(factura).forEach((prod) => {
      const nombre = texto(prod.nombre || prod.descripcion || prod.codigo || 'Producto')
      const actual = mapa.get(nombre) || { nombre, cantidad: 0, total: 0 }
      actual.cantidad += numero(prod.cantidad || 1)
      actual.total += numero(prod.total || prod.precio_final || prod.precio_venta)
      mapa.set(nombre, actual)
    })
  })
  return Array.from(mapa.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8)
})

const clientesTop = computed(() => {
  const mapa = new Map()
  facturas.value.forEach((factura) => {
    const codigo = texto(factura.cod_cliente || factura.codigo_cliente || factura.cedula_cliente || factura.nombre_cliente || 'SIN_CLIENTE')
    const nombre = texto(factura.nombre_cliente || factura.cliente || 'Cliente no registrado')
    const actual = mapa.get(codigo) || { codigo, nombre, facturas: 0, total: 0 }
    actual.facturas += 1
    actual.total += numero(factura.total)
    mapa.set(codigo, actual)
  })
  return Array.from(mapa.values()).sort((a, b) => b.total - a.total).slice(0, 8)
})

const auditoriaReciente = computed(() =>
  [...bitacora.value]
    .sort((a, b) => numero(b.timestamp || b.created_at) - numero(a.timestamp || a.created_at))
    .slice(0, 10)
)

const alertasOperativas = computed(() => [
  {
    titulo: 'Stock bajo',
    detalle: `${stockBajo.value.length} productos necesitan reposicion`,
    severidad: stockBajo.value.length ? 'danger' : 'success',
    ruta: '/productos'
  },
  {
    titulo: 'Cuentas por cobrar',
    detalle: `${cxcPendiente.value.length} cuentas pendientes por ${money(saldoCxc.value)}`,
    severidad: cxcPendiente.value.length ? 'warning' : 'success',
    ruta: '/cuentas_cobrar'
  },
  {
    titulo: 'Cuentas por pagar',
    detalle: `${cxpPendiente.value.length} compromisos por ${money(saldoCxp.value)}`,
    severidad: cxpPendiente.value.length ? 'warning' : 'success',
    ruta: '/cuentasxpagar'
  },
  {
    titulo: 'Productos sin costo',
    detalle: `${productosSinCosto.value.length} productos no tienen costo definido`,
    severidad: productosSinCosto.value.length ? 'danger' : 'success',
    ruta: '/productos'
  }
])

const modulos = [
  { titulo: 'Dashboard gerencial', icono: 'pi pi-chart-line', ruta: '/reportes-analitica', detalle: 'Ventas, utilidad, inventario y clientes.' },
  { titulo: 'Auditoria completa', icono: 'pi pi-shield', ruta: '/bitacora', detalle: 'Bitacora de acciones y cambios.' },
  { titulo: 'Cierre de caja', icono: 'pi pi-briefcase', ruta: '/caja', detalle: 'Turnos, metodos de pago y cuadre.' },
  { titulo: 'Inventario y kardex', icono: 'pi pi-box', ruta: '/productos', detalle: 'Stock bajo, costos y movimientos.' },
  { titulo: 'Compras y proveedores', icono: 'pi pi-shopping-cart', ruta: '/compras', detalle: 'Compras, proveedores y cuentas por pagar.' },
  { titulo: 'CRM clientes', icono: 'pi pi-users', ruta: '/clientes', detalle: 'Historial, credito y frecuencia.' },
  { titulo: 'Notificaciones', icono: 'pi pi-bell', ruta: '/notificaciones', detalle: 'Alertas internas del sistema.' },
  { titulo: 'Backups', icono: 'pi pi-download', ruta: '/backupexcel', detalle: 'Respaldo y restauracion de datos.' },
  { titulo: 'Documentos publicos', icono: 'pi pi-share-alt', ruta: '/home', detalle: 'Facturas, catalogo y consultas publicas.' },
  { titulo: 'Facturacion electronica', icono: 'pi pi-send', ruta: '/facturacion-electronica-log', detalle: 'Seguimiento de e-CF y respuestas.' },
  { titulo: 'Soporte y diagnostico', icono: 'pi pi-wrench', ruta: '/soporte', detalle: 'Estado del sistema y asistencia.' }
]

const filasFiltradas = computed(() => {
  const term = busqueda.value.toLowerCase()
  if (!term) return productos.value.slice(0, 12)
  return productos.value
    .filter((p) => [p.nombre, p.codigo, p.codigo_barra, p.categoria].some((v) => texto(v).toLowerCase().includes(term)))
    .slice(0, 20)
})

const cargarTabla = async (tabla, destino) => {
  try {
    const data = await peticionesFetchOffline('getDataAsArray', tabla)
    destino.value = Array.isArray(data) ? data : []
  } catch {
    destino.value = []
  }
}

const cargarDatos = async () => {
  cargando.value = true
  await Promise.all(tablasCarga.map(([tabla, destino]) => cargarTabla(tabla, destino)))
  cargando.value = false
}

const abrirRuta = (ruta) => {
  router.push(ruta)
}

const crearPdfEjecutivo = () => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margen = 14
  const empresa = datosEmpresa?.empresa?.nombre || 'Empresa'
  const fecha = new Date().toLocaleString('es-DO')
  const azul = [24, 55, 109]
  const azulClaro = [239, 246, 255]
  const gris = [89, 99, 118]
  const verde = [22, 163, 74]
  const rojo = [220, 38, 38]
  const naranja = [217, 119, 6]
  let y = 0

  const footer = () => {
    doc.setDrawColor(229, 231, 235)
    doc.line(margen, pageHeight - 14, pageWidth - margen, pageHeight - 14)
    doc.setTextColor(120, 130, 150)
    doc.setFontSize(8)
    doc.text(`Reporte generado por el Centro Empresarial - ${fecha}`, margen, pageHeight - 8)
    doc.text(`Pagina ${doc.internal.getNumberOfPages()}`, pageWidth - margen, pageHeight - 8, { align: 'right' })
  }

  const nuevaPaginaSiHaceFalta = (alto = 28) => {
    if (y + alto < pageHeight - 20) return
    footer()
    doc.addPage()
    y = 20
  }

  const section = (titulo, subtitulo = '') => {
    nuevaPaginaSiHaceFalta(24)
    doc.setFillColor(...azulClaro)
    doc.roundedRect(margen, y, pageWidth - margen * 2, 12, 2, 2, 'F')
    doc.setTextColor(...azul)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(titulo, margen + 4, y + 8)
    if (subtitulo) {
      doc.setTextColor(...gris)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(subtitulo, pageWidth - margen - 4, y + 8, { align: 'right' })
    }
    y += 18
  }

  const kpi = (x, yCard, w, titulo, valor, detalle, color = azul) => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, yCard, w, 28, 2, 2, 'FD')
    doc.setFillColor(...color)
    doc.rect(x, yCard, 2.2, 28, 'F')
    doc.setTextColor(...gris)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(titulo, x + 6, yCard + 8)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(String(valor), x + 6, yCard + 17, { maxWidth: w - 10 })
    doc.setTextColor(...gris)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(String(detalle), x + 6, yCard + 24, { maxWidth: w - 10 })
  }

  const tabla = (headers, rows, widths) => {
    nuevaPaginaSiHaceFalta(18)
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.rect(margen, y, pageWidth - margen * 2, 9, 'FD')
    let x = margen
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(55, 65, 81)
    headers.forEach((header, index) => {
      doc.text(header, x + 2, y + 6)
      x += widths[index]
    })
    y += 9

    doc.setFont('helvetica', 'normal')
    rows.forEach((row) => {
      nuevaPaginaSiHaceFalta(9)
      x = margen
      doc.setDrawColor(241, 245, 249)
      doc.line(margen, y + 8, pageWidth - margen, y + 8)
      row.forEach((cell, index) => {
        const text = doc.splitTextToSize(String(cell ?? ''), widths[index] - 4)
        doc.text(text.slice(0, 1), x + 2, y + 6)
        x += widths[index]
      })
      y += 9
    })
    y += 5
  }

  doc.setFillColor(...azul)
  doc.rect(0, 0, pageWidth, 42, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Resumen empresarial', margen, 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(empresa, margen, 27)
  doc.text(`Generado: ${fecha}`, margen, 34)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(pageWidth - 58, 11, 44, 20, 2, 2, 'F')
  doc.setTextColor(...azul)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('CENTRO', pageWidth - 36, 19, { align: 'center' })
  doc.text('EMPRESARIAL', pageWidth - 36, 26, { align: 'center' })

  y = 55
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const intro = 'Reporte ejecutivo con indicadores financieros, cartera, inventario, actividad comercial y riesgos operativos. Sirve como fotografia gerencial del estado actual del negocio.'
  doc.text(doc.splitTextToSize(intro, pageWidth - margen * 2), margen, y)
  y += 18

  const cardW = (pageWidth - margen * 2 - 10) / 3
  kpi(margen, y, cardW, 'Ventas hoy', money(ventasHoyTotal.value), `${ventasHoy.value.length} facturas`, verde)
  kpi(margen + cardW + 5, y, cardW, 'Ventas acumuladas', money(ventasTotal.value), `${facturas.value.length} documentos`, azul)
  kpi(margen + (cardW + 5) * 2, y, cardW, 'Utilidad registrada', money(gananciaTotal.value), 'Segun facturas', verde)
  y += 34
  kpi(margen, y, cardW, 'CxC pendiente', money(saldoCxc.value), `${cxcPendiente.value.length} cuentas`, rojo)
  kpi(margen + cardW + 5, y, cardW, 'CxP pendiente', money(saldoCxp.value), `${cxpPendiente.value.length} cuentas`, naranja)
  kpi(margen + (cardW + 5) * 2, y, cardW, 'Compras', money(comprasTotal.value), `${compras.value.length} registros`, azul)
  y += 40

  section('Semaforo operativo', 'Prioridades')
  tabla(
    ['Indicador', 'Estado', 'Detalle'],
    alertasOperativas.value.map((a) => [a.titulo, a.severidad === 'success' ? 'OK' : 'REVISAR', a.detalle]),
    [45, 28, pageWidth - margen * 2 - 73]
  )

  section('Rendimiento comercial', 'Top clientes y productos')
  tabla(
    ['Cliente', 'Facturas', 'Total'],
    clientesTop.value.slice(0, 8).map((c) => [c.nombre, c.facturas, money(c.total)]),
    [88, 30, pageWidth - margen * 2 - 118]
  )
  tabla(
    ['Producto', 'Cantidad', 'Total'],
    productosVendidos.value.slice(0, 8).map((p) => [p.nombre, p.cantidad, money(p.total)]),
    [88, 30, pageWidth - margen * 2 - 118]
  )

  section('Inventario', 'Control y reposicion')
  tabla(
    ['Producto', 'Stock', 'Costo', 'Precio'],
    stockBajo.value.slice(0, 12).map((p) => [p.nombre || 'Sin nombre', p.stock || 0, money(p.precio_compra || p.costo), money(p.precio_venta || p.precio_final)]),
    [86, 24, 36, pageWidth - margen * 2 - 146]
  )

  section('Cartera por cobrar', 'Principales saldos')
  tabla(
    ['Factura', 'Cliente', 'Saldo'],
    cxcPendiente.value.slice(0, 12).map((c) => [c.no_factura || c.no_emision || '', c.nombre_cliente || '', money(c.saldo || c.monto_credito)]),
    [36, 92, pageWidth - margen * 2 - 128]
  )

  section('Auditoria reciente', 'Ultimas acciones')
  tabla(
    ['Tabla', 'Accion', 'Detalle'],
    auditoriaReciente.value.slice(0, 10).map((a) => [a.tabla || '', a.accion || '', a.descripcion || a.referencia || '']),
    [36, 38, pageWidth - margen * 2 - 74]
  )

  section('Conclusion ejecutiva')
  const conclusion = [
    `El negocio registra ${money(ventasTotal.value)} en ventas acumuladas y ${money(ventasHoyTotal.value)} en ventas del dia.`,
    `La cartera pendiente por cobrar asciende a ${money(saldoCxc.value)} y las obligaciones por pagar a ${money(saldoCxp.value)}.`,
    `Existen ${stockBajo.value.length} productos con stock bajo y ${productosSinCosto.value.length} productos sin costo definido.`
  ]
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  conclusion.forEach((line) => {
    nuevaPaginaSiHaceFalta(10)
    doc.text(doc.splitTextToSize(`- ${line}`, pageWidth - margen * 2), margen, y)
    y += 8
  })

  footer()
  return doc.output('blob')
}

const crearPdfResumen = (tipo = 'general') => {
  if (tipo === 'general') return crearPdfEjecutivo()

  const doc = new jsPDF()
  const fecha = new Date().toLocaleString('es-DO')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(tipo === 'cxc' ? 'Resumen de cuentas por cobrar' : 'Resumen de facturas', 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Generado: ${fecha}`, 14, 26)

  let y = 40
  const linea = (label, value) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), 86, y)
    y += 8
  }

  if (tipo === 'cxc') {
    linea('Cuentas pendientes', cxcPendiente.value.length)
    linea('Saldo pendiente', money(saldoCxc.value))
    cxcPendiente.value.slice(0, 18).forEach((c) => {
      doc.text(`${texto(c.no_factura || c.no_emision)} - ${texto(c.nombre_cliente)} - ${money(c.saldo || c.monto_credito)}`, 14, y)
      y += 7
    })
  } else if (tipo === 'facturas') {
    linea('Facturas', facturas.value.length)
    linea('Facturas hoy', ventasHoy.value.length)
    linea('Ventas hoy', money(ventasHoyTotal.value))
    linea('Ventas total', money(ventasTotal.value))
    facturas.value.slice(0, 18).forEach((f) => {
      doc.text(`${texto(f.no_factura)} - ${texto(f.nombre_cliente)} - ${money(f.total)}`, 14, y)
      y += 7
    })
  }

  return doc.output('blob')
}

const mostrarPdf = async (tipo) => {
  const blob = crearPdfResumen(tipo)
  const url = URL.createObjectURL(blob)
  await Swal.fire({
    title: 'Vista previa PDF',
    html: `<iframe src="${url}" style="width:100%;height:70vh;border:0;border-radius:8px;"></iframe>`,
    width: '80rem',
    showCloseButton: true,
    confirmButtonText: 'Cerrar',
    willClose: () => URL.revokeObjectURL(url)
  })
}

onMounted(cargarDatos)
</script>

<template>
  <main class="empresarial-page">
    <section class="emp-header">
      <div>
        <p class="eyebrow">Centro empresarial</p>
        <h1>Panel profesional del negocio</h1>
        <p class="sub">Una vista ejecutiva para ventas, caja, inventario, clientes, compras, auditoria y operacion.</p>
      </div>
      <div class="header-actions">
        <Button label="Actualizar" icon="pi pi-refresh" :loading="cargando" @click="cargarDatos" />
        <Button label="PDF resumen" icon="pi pi-file-pdf" severity="danger" outlined @click="mostrarPdf('general')" />
      </div>
    </section>

    <section class="metric-grid">
      <article class="metric-card">
        <span>Ventas hoy</span>
        <strong>{{ money(ventasHoyTotal) }}</strong>
        <small>{{ ventasHoy.length }} facturas</small>
      </article>
      <article class="metric-card">
        <span>Ventas acumuladas</span>
        <strong>{{ money(ventasTotal) }}</strong>
        <small>{{ facturas.length }} documentos</small>
      </article>
      <article class="metric-card">
        <span>Utilidad registrada</span>
        <strong>{{ money(gananciaTotal) }}</strong>
        <small>Segun facturas</small>
      </article>
      <article class="metric-card danger">
        <span>CxC pendiente</span>
        <strong>{{ money(saldoCxc) }}</strong>
        <small>{{ cxcPendiente.length }} cuentas</small>
      </article>
      <article class="metric-card warning">
        <span>CxP pendiente</span>
        <strong>{{ money(saldoCxp) }}</strong>
        <small>{{ cxpPendiente.length }} cuentas</small>
      </article>
      <article class="metric-card">
        <span>Compras</span>
        <strong>{{ money(comprasTotal) }}</strong>
        <small>{{ compras.length }} registros</small>
      </article>
    </section>

    <section class="two-col">
      <div class="panel">
        <div class="panel-title">
          <div>
            <h2>Alertas operativas</h2>
            <p>Prioridades que requieren seguimiento.</p>
          </div>
        </div>
        <button v-for="alerta in alertasOperativas" :key="alerta.titulo" class="alert-row" @click="abrirRuta(alerta.ruta)">
          <div>
            <strong>{{ alerta.titulo }}</strong>
            <span>{{ alerta.detalle }}</span>
          </div>
          <Tag :severity="alerta.severidad" :value="alerta.severidad === 'success' ? 'OK' : 'Revisar'" />
        </button>
      </div>

      <div class="panel">
        <div class="panel-title">
          <div>
            <h2>Reportes ejecutivos</h2>
            <p>Resumenes listos para presentar.</p>
          </div>
        </div>
        <div class="report-actions">
          <Button label="Resumen general" icon="pi pi-chart-bar" @click="mostrarPdf('general')" />
          <Button label="Cuentas por cobrar" icon="pi pi-wallet" severity="warning" outlined @click="mostrarPdf('cxc')" />
          <Button label="Facturas" icon="pi pi-file" severity="info" outlined @click="mostrarPdf('facturas')" />
          <Button label="Ir a reportes" icon="pi pi-arrow-right" severity="secondary" text @click="abrirRuta('/reportes')" />
        </div>
      </div>
    </section>

    <section class="module-grid">
      <button v-for="modulo in modulos" :key="modulo.titulo" class="module-card" @click="abrirRuta(modulo.ruta)">
        <i :class="modulo.icono"></i>
        <strong>{{ modulo.titulo }}</strong>
        <span>{{ modulo.detalle }}</span>
      </button>
    </section>

    <section class="two-col wide-left">
      <div class="panel">
        <div class="panel-title">
          <div>
            <h2>Inventario y kardex rapido</h2>
            <p>Productos con stock, costo y precio para revision.</p>
          </div>
          <InputText v-model="busqueda" placeholder="Buscar producto" />
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoria</th>
                <th>Stock</th>
                <th>Costo</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prod in filasFiltradas" :key="prod.id || prod.codigo || prod.nombre">
                <td>
                  <strong>{{ prod.nombre || 'Sin nombre' }}</strong>
                  <small>{{ prod.codigo || prod.codigo_barra }}</small>
                </td>
                <td>{{ prod.categoria || 'Sin categoria' }}</td>
                <td>{{ prod.stock || 0 }}</td>
                <td>{{ money(prod.precio_compra || prod.costo) }}</td>
                <td>{{ money(prod.precio_venta || prod.precio_final) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">
          <div>
            <h2>CRM clientes</h2>
            <p>Clientes con mayor facturacion.</p>
          </div>
        </div>
        <div class="rank-list">
          <div v-for="cliente in clientesTop" :key="cliente.codigo" class="rank-row">
            <div>
              <strong>{{ cliente.nombre }}</strong>
              <span>{{ cliente.facturas }} facturas</span>
            </div>
            <b>{{ money(cliente.total) }}</b>
          </div>
        </div>
      </div>
    </section>

    <section class="two-col">
      <div class="panel">
        <div class="panel-title">
          <div>
            <h2>Productos mas vendidos</h2>
            <p>Ranking por cantidad facturada.</p>
          </div>
        </div>
        <div class="rank-list">
          <div v-for="producto in productosVendidos" :key="producto.nombre" class="rank-row">
            <div>
              <strong>{{ producto.nombre }}</strong>
              <span>{{ producto.cantidad }} unidades</span>
            </div>
            <b>{{ money(producto.total) }}</b>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">
          <div>
            <h2>Auditoria reciente</h2>
            <p>Ultimas acciones registradas.</p>
          </div>
          <Button label="Ver todo" icon="pi pi-search" text @click="abrirRuta('/bitacora')" />
        </div>
        <div class="audit-list">
          <div v-for="item in auditoriaReciente" :key="item.id || item.timestamp || item.descripcion" class="audit-row">
            <i class="pi pi-history"></i>
            <div>
              <strong>{{ item.accion || 'Accion' }} - {{ item.tabla || 'tabla' }}</strong>
              <span>{{ item.descripcion || item.referencia || 'Sin descripcion' }}</span>
            </div>
          </div>
          <p v-if="!auditoriaReciente.length" class="empty">No hay eventos recientes en bitacora.</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.empresarial-page {
  min-height: 100vh;
  padding: 24px;
  background: #f6f7fb;
  color: #172033;
}

.emp-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #2563eb;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 30px;
  font-weight: 800;
}

h2 {
  font-size: 18px;
  font-weight: 800;
}

.sub,
.panel-title p,
.module-card span,
.rank-row span,
.audit-row span,
.metric-card small {
  color: #667085;
}

.header-actions,
.report-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card,
.panel,
.module-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
}

.metric-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-card span {
  color: #475467;
  font-size: 13px;
}

.metric-card strong {
  font-size: 20px;
  color: #101828;
}

.metric-card.danger {
  border-left: 4px solid #ef4444;
}

.metric-card.warning {
  border-left: 4px solid #f59e0b;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.two-col.wide-left {
  grid-template-columns: 1.6fr 1fr;
}

.panel {
  padding: 16px;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.module-card,
.alert-row {
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.module-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.module-card:hover {
  border-color: #2563eb;
  transform: translateY(-1px);
}

.module-card i {
  color: #2563eb;
  font-size: 22px;
}

.alert-row,
.rank-row,
.audit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #eef2f7;
  background: transparent;
}

.alert-row div,
.rank-row div,
.audit-row div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th {
  text-align: left;
  color: #475467;
  background: #f8fafc;
}

th,
td {
  padding: 10px;
  border-bottom: 1px solid #eef2f7;
  vertical-align: top;
}

td small {
  display: block;
  color: #667085;
}

.rank-list,
.audit-list {
  display: flex;
  flex-direction: column;
}

.audit-row {
  justify-content: flex-start;
}

.audit-row i {
  color: #2563eb;
}

.empty {
  color: #667085;
  padding: 12px 0;
}

@media (max-width: 1180px) {
  .metric-grid,
  .module-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .emp-header,
  .two-col,
  .two-col.wide-left {
    grid-template-columns: 1fr;
    display: grid;
  }

  .metric-grid,
  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .empresarial-page {
    padding: 14px;
  }

  .metric-grid,
  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
