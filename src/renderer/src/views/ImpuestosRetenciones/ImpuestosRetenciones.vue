<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { envioElectron, peticionesFetchOffline } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';

const router = useRouter();
const toast = useToast();
const datosEmpresa = useDatosEmpresa();
const loading = ref(false);
const activeTab = ref(0);
const rangoFecha = ref([]);
const busqueda = ref('');
const origenFiltro = ref('');
const rows = ref([]);
const ultimaActualizacion = ref(null);

const origenes = [
  { label: 'Todos los movimientos', value: '' },
  { label: 'Ventas', value: 'VENTA' },
  { label: 'Compras', value: 'COMPRA' },
  { label: 'Gastos fijos', value: 'GASTO' }
];

document.body.classList.add('sidebar-close');

const numero = (valor) => {
  const parsed = Number.parseFloat(String(valor ?? 0).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const primerValor = (registro, campos) => {
  for (const campo of campos) {
    if (registro?.[campo] !== undefined && registro?.[campo] !== null && registro?.[campo] !== '') {
      return numero(registro[campo]);
    }
  }
  return 0;
};

const parsearFecha = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor;
  const texto = String(valor).trim();
  const partes = texto.split(/[\/\-]/);
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(texto)) {
    const fecha = new Date(Number(partes[2].slice(0, 4)), Number(partes[1]) - 1, Number(partes[0]));
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const fechaTexto = (fecha) => parsearFecha(fecha)?.toLocaleDateString('es-DO') || 'Sin fecha';
const moneda = (valor) => numero(valor).toLocaleString('es-DO', {
  style: 'currency', currency: 'DOP', minimumFractionDigits: 2, maximumFractionDigits: 2
});

const normalizarRegistro = (registro, origen, index) => {
  const esVenta = origen === 'VENTA';
  const esGasto = origen === 'GASTO';
  const total = numero(esGasto ? registro.valor : registro.total);
  const itbis = numero(registro.impuesto ?? registro.itbis ?? registro.itbis_facturado);
  const isc = numero(registro.impuesto_selectivo_consumo ?? registro.isc);
  const otros = numero(registro.otros_impuestos_tasas ?? registro.otros_impuestos);
  const base = numero(registro.subtotal ?? registro.base_imponible) || Math.max(total - itbis - isc - otros, 0);
  const itbisRetenido = primerValor(registro, ['itbis_retenido', 'retencion_itbis', 'monto_itbis_retenido', 'itbisRetenido']);
  const isrRetenido = primerValor(registro, ['isr_retenido', 'retencion_isr', 'retencion_renta', 'monto_isr_retenido', 'isrRetenido']);
  const fecha = esVenta
    ? registro.fecha_emision || registro.fecha
    : esGasto ? registro.fecha_comprobante || registro.fecha_pago : registro.fecha || registro.fecha_emision;
  const contraparte = esVenta
    ? registro.nombre_cliente || registro.cliente || 'Consumidor final'
    : registro.proveedor || registro.nombre_proveedor || registro.descripcion || 'Sin proveedor';
  return {
    id: `${origen}-${registro.id ?? registro.no_factura ?? index}`,
    origen,
    origenLabel: esVenta ? 'Venta' : esGasto ? 'Gasto fijo' : 'Compra',
    fecha,
    fechaDate: parsearFecha(fecha),
    contraparte,
    documento: esVenta ? registro.comprobante || registro.ncf || 'Sin NCF' : registro.ncf_proveedor || registro.ncf || 'Sin NCF',
    referencia: registro.no_factura || registro.numero_factura || (esGasto ? `GF-${registro.id ?? index + 1}` : '—'),
    identificacion: esVenta ? registro.rnc_cedula || registro.cod_cliente || '' : registro.rnc_proveedor || registro.rnc || '',
    base, total, itbis, isc, otros, itbisRetenido, isrRetenido,
    retenciones: itbisRetenido + isrRetenido
  };
};

const enRango = (row) => {
  if (!rangoFecha.value?.[0] || !rangoFecha.value?.[1]) return true;
  if (!row.fechaDate) return false;
  const inicio = new Date(rangoFecha.value[0]);
  const fin = new Date(rangoFecha.value[1]);
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(23, 59, 59, 999);
  return row.fechaDate >= inicio && row.fechaDate <= fin;
};

const rowsFiltradas = computed(() => {
  const query = busqueda.value.trim().toLocaleLowerCase('es');
  return rows.value.filter((row) => {
    const coincideOrigen = !origenFiltro.value || row.origen === origenFiltro.value;
    const coincideBusqueda = !query || [row.contraparte, row.documento, row.referencia, row.identificacion]
      .some((valor) => String(valor || '').toLocaleLowerCase('es').includes(query));
    return coincideOrigen && enRango(row) && coincideBusqueda;
  });
});

const movimientosImpuestos = computed(() => rowsFiltradas.value.filter((row) => row.itbis > 0 || row.isc > 0 || row.otros > 0));
const movimientosRetenciones = computed(() => rowsFiltradas.value.filter((row) => row.retenciones > 0));
const tablaActual = computed(() => activeTab.value === 0 ? movimientosImpuestos.value : movimientosRetenciones.value);
const sumar = (lista, campo) => lista.reduce((total, row) => total + numero(row[campo]), 0);
const ventas = computed(() => rowsFiltradas.value.filter((row) => row.origen === 'VENTA'));
const comprasYGastos = computed(() => rowsFiltradas.value.filter((row) => row.origen !== 'VENTA'));
const itbisVentas = computed(() => sumar(ventas.value, 'itbis'));
const itbisCompras = computed(() => sumar(comprasYGastos.value, 'itbis'));
const itbisRetenido = computed(() => sumar(rowsFiltradas.value, 'itbisRetenido'));
const isrRetenido = computed(() => sumar(rowsFiltradas.value, 'isrRetenido'));
const iscTotal = computed(() => sumar(rowsFiltradas.value, 'isc'));
const otrosTotal = computed(() => sumar(rowsFiltradas.value, 'otros'));
const balanceITBIS = computed(() => itbisVentas.value - itbisCompras.value - itbisRetenido.value);
const totalRetenido = computed(() => itbisRetenido.value + isrRetenido.value);
const totalFiscal = computed(() => itbisVentas.value + itbisCompras.value + iscTotal.value + otrosTotal.value);
const porcentaje = (valor) => totalFiscal.value > 0 ? Math.min((numero(valor) / totalFiscal.value) * 100, 100) : 0;
const periodoTexto = computed(() => rangoFecha.value?.[0] && rangoFecha.value?.[1]
  ? `${fechaTexto(rangoFecha.value[0])} — ${fechaTexto(rangoFecha.value[1])}` : 'Todos los períodos');

const kpis = computed(() => [
  { label: 'ITBIS en ventas', value: itbisVentas.value, detail: `${ventas.value.length} ventas en el período`, icon: 'pi-arrow-up-right', tone: 'blue' },
  { label: 'ITBIS adelantado', value: itbisCompras.value, detail: `${comprasYGastos.value.length} compras y gastos`, icon: 'pi-arrow-down-left', tone: 'emerald' },
  { label: balanceITBIS.value >= 0 ? 'ITBIS estimado a pagar' : 'Saldo a favor estimado', value: Math.abs(balanceITBIS.value), detail: 'Ventas − adelantos − retenciones', icon: balanceITBIS.value >= 0 ? 'pi-wallet' : 'pi-check-circle', tone: balanceITBIS.value >= 0 ? 'amber' : 'violet' },
  { label: 'Total retenido', value: totalRetenido.value, detail: `ITBIS ${moneda(itbisRetenido.value)} · ISR ${moneda(isrRetenido.value)}`, icon: 'pi-percentage', tone: 'rose' }
]);

const chartData = computed(() => ({
  labels: ['ITBIS ventas', 'ITBIS adelantado', 'ITBIS retenido', 'ISR retenido', 'ISC y otros'],
  datasets: [{
    data: [itbisVentas.value, itbisCompras.value, itbisRetenido.value, isrRetenido.value, iscTotal.value + otrosTotal.value],
    backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6'], borderWidth: 0, hoverOffset: 6
  }]
}));
const chartOptions = {
  responsive: true, maintainAspectRatio: false, cutout: '72%',
  plugins: {
    legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 18, boxWidth: 8 } },
    tooltip: { callbacks: { label: (context) => ` ${context.label}: ${moneda(context.raw)}` } }
  }
};

const establecerMesActual = () => {
  const hoy = new Date();
  rangoFecha.value = [new Date(hoy.getFullYear(), hoy.getMonth(), 1), new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)];
};

const cargarDatos = async (notificar = false) => {
  loading.value = true;
  try {
    const resultados = await Promise.allSettled([
      peticionesFetchOffline('getDataAsArray', 'facturas'),
      peticionesFetchOffline('getDataAsArray', 'compras'),
      peticionesFetchOffline('getDataAsArray', 'gastosfijos')
    ]);
    const obtener = (indice) => resultados[indice].status === 'fulfilled' && Array.isArray(resultados[indice].value) ? resultados[indice].value : [];
    rows.value = [
      ...obtener(0).map((item, index) => normalizarRegistro(item, 'VENTA', index)),
      ...obtener(1).map((item, index) => normalizarRegistro(item, 'COMPRA', index)),
      ...obtener(2).map((item, index) => normalizarRegistro(item, 'GASTO', index))
    ].sort((a, b) => (b.fechaDate?.getTime() || 0) - (a.fechaDate?.getTime() || 0));
    ultimaActualizacion.value = new Date();
    const errores = resultados.filter((resultado) => resultado.status === 'rejected').length;
    if (errores) toast.add({ severity: 'warn', summary: 'Carga parcial', detail: `${errores} fuente(s) no estuvieron disponibles.`, life: 4000 });
    else if (notificar) toast.add({ severity: 'success', summary: 'Actualizado', detail: `${rows.value.length} movimientos procesados.`, life: 2500 });
  } catch (error) {
    console.error('Error al cargar impuestos y retenciones:', error);
    toast.add({ severity: 'error', summary: 'No se pudo cargar', detail: 'Revisa la conexión e inténtalo nuevamente.', life: 4000 });
  } finally { loading.value = false; }
};

const limpiarFiltros = () => { busqueda.value = ''; origenFiltro.value = ''; establecerMesActual(); };
const filasExportacion = () => tablaActual.value.map((row) => ({
  Fecha: fechaTexto(row.fecha), Origen: row.origenLabel, Contraparte: row.contraparte, 'RNC/Cédula': row.identificacion,
  NCF: row.documento, Referencia: row.referencia, 'Base imponible': row.base, ITBIS: row.itbis, ISC: row.isc,
  'Otros impuestos': row.otros, 'ITBIS retenido': row.itbisRetenido, 'ISR retenido': row.isrRetenido, Total: row.total
}));
const validarExportacion = () => {
  if (tablaActual.value.length) return true;
  toast.add({ severity: 'info', summary: 'Sin datos', detail: 'No hay movimientos para exportar con los filtros actuales.', life: 3000 });
  return false;
};
const exportarExcel = () => {
  if (!validarExportacion()) return;
  const worksheet = XLSX.utils.json_to_sheet(filasExportacion());
  worksheet['!cols'] = [{ wch: 13 }, { wch: 12 }, { wch: 30 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.value === 0 ? 'Impuestos' : 'Retenciones');
  XLSX.writeFile(workbook, `impuestos-retenciones-${new Date().toISOString().slice(0, 10)}.xlsx`);
};
const exportarPDF = () => {
  if (!validarExportacion()) return;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(17); doc.setTextColor(30, 41, 59);
  doc.text(activeTab.value === 0 ? 'Detalle de impuestos' : 'Detalle de retenciones', 14, 16);
  doc.setFontSize(9); doc.setTextColor(100);
  doc.text(`${datosEmpresa.empresa.nombre || 'Empresa'} · ${periodoTexto.value}`, 14, 22);
  doc.autoTable({
    startY: 28,
    head: [['Fecha', 'Origen', 'Contraparte', 'NCF', 'Base', 'ITBIS', 'ITBIS ret.', 'ISR ret.', 'Total']],
    body: tablaActual.value.map((row) => [fechaTexto(row.fecha), row.origenLabel, row.contraparte, row.documento, moneda(row.base), moneda(row.itbis), moneda(row.itbisRetenido), moneda(row.isrRetenido), moneda(row.total)]),
    theme: 'striped', styles: { fontSize: 7.5, cellPadding: 2.2 }, headStyles: { fillColor: [30, 41, 59], textColor: 255 }, columnStyles: { 2: { cellWidth: 48 }, 3: { cellWidth: 31 } }
  });
  doc.save(`impuestos-retenciones-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const generarPDFFiscal = async () => {
  if (!rowsFiltradas.value.length) {
    toast.add({
      severity: 'info',
      summary: 'Sin datos',
      detail: 'No hay movimientos en el período seleccionado para generar el informe.',
      life: 3000
    });
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const empresa = datosEmpresa.empresa.nombre || 'Empresa';
  const fechaGeneracion = new Date().toLocaleString('es-DO');
  const colorPrincipal = [15, 118, 110];
  const colorOscuro = [30, 41, 59];

  const dibujarEncabezado = (titulo, subtitulo) => {
    doc.setFillColor(...colorOscuro);
    doc.rect(0, 0, 297, 27, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, 14, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(210, 221, 234);
    doc.text(`${empresa}  |  ${subtitulo}`, 14, 18);
    doc.text(`Generado: ${fechaGeneracion}`, 283, 18, { align: 'right' });
  };

  dibujarEncabezado('Informe de Impuestos y Retenciones', periodoTexto.value);

  const resumen = [
    ['ITBIS en ventas', moneda(itbisVentas.value)],
    ['ITBIS adelantado', moneda(itbisCompras.value)],
    [balanceITBIS.value >= 0 ? 'ITBIS estimado a pagar' : 'Saldo estimado a favor', moneda(Math.abs(balanceITBIS.value))],
    ['ITBIS retenido', moneda(itbisRetenido.value)],
    ['ISR retenido', moneda(isrRetenido.value)],
    ['ISC y otros', moneda(iscTotal.value + otrosTotal.value)]
  ];

  doc.autoTable({
    startY: 34,
    body: [resumen.map((item) => item[0]), resumen.map((item) => item[1])],
    theme: 'plain',
    styles: { halign: 'center', cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.25 },
    bodyStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.fontSize = 7.5;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [100, 116, 139];
      } else {
        data.cell.styles.fontSize = 10;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = colorOscuro;
      }
    }
  });

  let siguienteY = doc.lastAutoTable.finalY + 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colorOscuro);
  doc.text(`Detalle de impuestos (${movimientosImpuestos.value.length})`, 14, siguienteY);

  doc.autoTable({
    startY: siguienteY + 4,
    head: [['Fecha', 'Origen', 'Contraparte', 'NCF / comprobante', 'Referencia', 'Base', 'ITBIS', 'ISC', 'Otros', 'Total']],
    body: movimientosImpuestos.value.map((row) => [
      fechaTexto(row.fecha), row.origenLabel, row.contraparte, row.documento, row.referencia,
      moneda(row.base), moneda(row.itbis), moneda(row.isc), moneda(row.otros), moneda(row.total)
    ]),
    theme: 'striped',
    styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: colorPrincipal, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 250] },
    columnStyles: { 2: { cellWidth: 42 }, 3: { cellWidth: 32 }, 4: { cellWidth: 24 } },
    margin: { top: 32, left: 14, right: 14 },
    didDrawPage: () => {
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Impuestos · ${periodoTexto.value}`, 14, 20);
      }
    }
  });

  doc.addPage('a4', 'landscape');
  dibujarEncabezado('Detalle de Retenciones', periodoTexto.value);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total retenido: ${moneda(totalRetenido.value)}  |  ${movimientosRetenciones.value.length} movimiento(s)`, 14, 34);

  if (movimientosRetenciones.value.length) {
    doc.autoTable({
      startY: 39,
      head: [['Fecha', 'Origen', 'Agente / contraparte', 'RNC / Cédula', 'NCF', 'Base', 'ITBIS retenido', 'ISR retenido', 'Total retenido']],
      body: movimientosRetenciones.value.map((row) => [
        fechaTexto(row.fecha), row.origenLabel, row.contraparte, row.identificacion || '—', row.documento,
        moneda(row.base), moneda(row.itbisRetenido), moneda(row.isrRetenido), moneda(row.retenciones)
      ]),
      theme: 'striped',
      styles: { fontSize: 7.2, cellPadding: 2.2, overflow: 'linebreak' },
      headStyles: { fillColor: [190, 24, 93], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 247, 250] },
      columnStyles: { 2: { cellWidth: 48 }, 3: { cellWidth: 28 }, 4: { cellWidth: 31 } },
      margin: { top: 32, left: 14, right: 14 }
    });
  } else {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 43, 269, 28, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('No hay retenciones registradas para los filtros seleccionados.', 148.5, 58, { align: 'center' });
  }

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text('Documento informativo sujeto a validación contable.', 14, 202);
    doc.text(`Página ${pagina} de ${totalPaginas}`, 283, 202, { align: 'right' });
  }

  const nombreArchivo = `informe-fiscal-${new Date().toISOString().slice(0, 10)}.pdf`;
  const pdfUrl = URL.createObjectURL(doc.output('blob'));

  try {
    const resultado = await Swal.fire({
      title: 'Informe de Impuestos y Retenciones',
      html: `<iframe src="${pdfUrl}" title="Vista previa del informe fiscal" style="width:100%;height:72vh;border:0;border-radius:8px;background:#f8fafc"></iframe>`,
      width: '96%',
      padding: '1rem',
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      heightAuto: false,
      customClass: {
        popup: 'fiscal-pdf-preview',
        htmlContainer: 'fiscal-pdf-container'
      }
    });

    if (resultado.isConfirmed) {
      doc.save(nombreArchivo);
      toast.add({
        severity: 'success',
        summary: 'PDF descargado',
        detail: 'El informe fiscal se guardó correctamente.',
        life: 3000
      });
    }
  } finally {
    URL.revokeObjectURL(pdfUrl);
  }
};

onMounted(async () => {
  establecerMesActual();
  try {
    const config = await envioElectron('datosarchivo');
    if (!datosEmpresa.empresa.nombre && config?.VITE_LINKURL) await datosEmpresa.inicializarDatosEmpresa(config.VITE_LINKURL + config.VITE_LINK_API);
  } catch (error) { console.warn('No se pudo inicializar la empresa:', error); }
  await cargarDatos();
});
</script>

<template>
  <main class="tax-page">
    <div class="tax-shell">
      <section class="hero-panel">
        <div>
          <div class="eyebrow"><i class="pi pi-shield"></i> Centro fiscal <span>Vista consolidada</span></div>
          <h1>Impuestos y Retenciones</h1>
          <p>Consolida ventas, compras y gastos para conocer tu posición fiscal del período.</p>
          <div class="hero-meta">
            <div class="period-pill"><i class="pi pi-calendar"></i> {{ periodoTexto }}</div>
            <div class="period-pill status-pill"><i class="pi pi-check-circle"></i> Datos locales conciliados</div>
          </div>
        </div>
        <div class="hero-actions">
          <Button class="report-pdf-button" label="Generar PDF fiscal" icon="pi pi-file-pdf" severity="danger" :disabled="loading || !rowsFiltradas.length" @click="generarPDFFiscal" />
          <Button label="Reporte 606" icon="pi pi-arrow-down-left" severity="secondary" outlined @click="router.push('/reporte-606')" />
          <Button label="Reporte 607" icon="pi pi-arrow-up-right" severity="secondary" outlined @click="router.push('/reporte-607')" />
          <Button label="Actualizar" icon="pi pi-refresh" :loading="loading" @click="cargarDatos(true)" />
        </div>
      </section>

      <section class="filter-panel">
        <div class="filter-field"><label>Período fiscal</label><Calendar v-model="rangoFecha" selectionMode="range" dateFormat="dd/mm/yy" showIcon :manualInput="false" placeholder="Selecciona un rango" fluid /></div>
        <div class="filter-field"><label>Origen</label><Dropdown v-model="origenFiltro" :options="origenes" optionLabel="label" optionValue="value" placeholder="Todos" fluid /></div>
        <div class="filter-field"><label>Buscar movimiento</label><IconField><InputIcon class="pi pi-search" /><InputText v-model="busqueda" placeholder="RNC, NCF, factura o contraparte" fluid /></IconField></div>
        <Button class="clear-button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" text @click="limpiarFiltros" />
      </section>

      <section class="kpi-grid" aria-label="Resumen fiscal">
        <article v-for="item in kpis" :key="item.label" class="kpi-card" :class="`tone-${item.tone}`">
          <div class="kpi-top"><div class="kpi-icon"><i class="pi" :class="item.icon"></i></div><span class="live-dot"><i></i> Período</span></div>
          <p>{{ item.label }}</p><strong>{{ moneda(item.value) }}</strong><small>{{ item.detail }}</small>
        </article>
      </section>

      <section class="insights-grid">
        <article class="panel chart-panel">
          <div class="panel-heading"><div><span class="section-kicker">Distribución</span><h2>Composición fiscal</h2></div><span class="record-count">{{ rowsFiltradas.length }} movimientos</span></div>
          <div v-if="totalFiscal > 0 || totalRetenido > 0" class="chart-wrap">
            <Chart type="doughnut" :data="chartData" :options="chartOptions" />
            <div class="chart-total"><span>Volumen fiscal</span><strong>{{ moneda(totalFiscal + totalRetenido) }}</strong></div>
          </div>
          <div v-else class="empty-chart"><i class="pi pi-chart-pie"></i><p>No hay valores fiscales en este período.</p></div>
        </article>

        <article class="panel breakdown-panel">
          <div class="panel-heading"><div><span class="section-kicker">Resumen</span><h2>Desglose de obligaciones</h2></div></div>
          <div class="breakdown-list">
            <div class="breakdown-row"><div><span>ITBIS generado en ventas</span><strong>{{ moneda(itbisVentas) }}</strong></div><div class="progress-track"><span class="bg-blue" :style="{ width: `${porcentaje(itbisVentas)}%` }"></span></div></div>
            <div class="breakdown-row"><div><span>ITBIS adelantado en compras</span><strong>{{ moneda(itbisCompras) }}</strong></div><div class="progress-track"><span class="bg-emerald" :style="{ width: `${porcentaje(itbisCompras)}%` }"></span></div></div>
            <div class="breakdown-row"><div><span>Impuesto selectivo (ISC)</span><strong>{{ moneda(iscTotal) }}</strong></div><div class="progress-track"><span class="bg-violet" :style="{ width: `${porcentaje(iscTotal)}%` }"></span></div></div>
            <div class="breakdown-row"><div><span>Otros impuestos y tasas</span><strong>{{ moneda(otrosTotal) }}</strong></div><div class="progress-track"><span class="bg-amber" :style="{ width: `${porcentaje(otrosTotal)}%` }"></span></div></div>
          </div>
          <div class="balance-box" :class="{ favorable: balanceITBIS < 0 }">
            <div><span>{{ balanceITBIS >= 0 ? 'Balance estimado del ITBIS' : 'Saldo estimado a favor' }}</span><small>Cálculo informativo sujeto a validación contable</small></div>
            <strong>{{ moneda(Math.abs(balanceITBIS)) }}</strong>
          </div>
        </article>
      </section>

      <section class="panel table-panel">
        <div class="table-toolbar">
          <div><span class="section-kicker">Trazabilidad</span><h2>Detalle de movimientos</h2></div>
          <div class="export-actions"><Button label="Excel" icon="pi pi-file-excel" severity="success" outlined :disabled="!tablaActual.length" @click="exportarExcel" /><Button label="PDF" icon="pi pi-file-pdf" severity="danger" outlined :disabled="!tablaActual.length" @click="exportarPDF" /></div>
        </div>
        <TabView v-model:activeIndex="activeTab">
          <TabPanel>
            <template #header><span class="tab-label"><i class="pi pi-receipt"></i> Impuestos <Badge :value="movimientosImpuestos.length" /></span></template>
            <DataTable :value="movimientosImpuestos" :loading="loading" paginator :rows="12" :rowsPerPageOptions="[12, 25, 50]" stripedRows scrollable sortField="fechaDate" :sortOrder="-1" tableStyle="min-width: 72rem">
              <template #empty><div class="table-empty"><i class="pi pi-inbox"></i><strong>Sin movimientos fiscales</strong><span>Ajusta el período o los filtros para consultar otros registros.</span></div></template>
              <Column field="fechaDate" header="Fecha" sortable style="min-width: 8rem"><template #body="{ data }">{{ fechaTexto(data.fecha) }}</template></Column>
              <Column field="origenLabel" header="Origen" sortable style="min-width: 8rem"><template #body="{ data }"><Tag :value="data.origenLabel" :severity="data.origen === 'VENTA' ? 'info' : data.origen === 'COMPRA' ? 'success' : 'warn'" /></template></Column>
              <Column field="contraparte" header="Contraparte" sortable style="min-width: 15rem"><template #body="{ data }"><div class="party-cell"><strong>{{ data.contraparte }}</strong><small>{{ data.identificacion || 'Sin identificación' }}</small></div></template></Column>
              <Column field="documento" header="NCF / comprobante" style="min-width: 12rem"><template #body="{ data }"><span class="document-code">{{ data.documento }}</span></template></Column>
              <Column field="referencia" header="Referencia" style="min-width: 9rem" />
              <Column field="base" header="Base" sortable style="min-width: 9rem"><template #body="{ data }">{{ moneda(data.base) }}</template></Column>
              <Column field="itbis" header="ITBIS" sortable style="min-width: 9rem"><template #body="{ data }"><strong class="amount-blue">{{ moneda(data.itbis) }}</strong></template></Column>
              <Column field="isc" header="ISC" sortable style="min-width: 8rem"><template #body="{ data }">{{ moneda(data.isc) }}</template></Column>
              <Column field="otros" header="Otros" sortable style="min-width: 8rem"><template #body="{ data }">{{ moneda(data.otros) }}</template></Column>
              <Column field="total" header="Total" sortable frozen alignFrozen="right" style="min-width: 10rem"><template #body="{ data }"><strong>{{ moneda(data.total) }}</strong></template></Column>
            </DataTable>
          </TabPanel>
          <TabPanel>
            <template #header><span class="tab-label"><i class="pi pi-percentage"></i> Retenciones <Badge :value="movimientosRetenciones.length" severity="danger" /></span></template>
            <DataTable :value="movimientosRetenciones" :loading="loading" paginator :rows="12" :rowsPerPageOptions="[12, 25, 50]" stripedRows scrollable sortField="fechaDate" :sortOrder="-1" tableStyle="min-width: 64rem">
              <template #empty><div class="table-empty"><i class="pi pi-check-circle"></i><strong>No hay retenciones registradas</strong><span>Se mostrarán aquí cuando los movimientos incluyan ITBIS o ISR retenido.</span></div></template>
              <Column field="fechaDate" header="Fecha" sortable style="min-width: 8rem"><template #body="{ data }">{{ fechaTexto(data.fecha) }}</template></Column>
              <Column field="origenLabel" header="Origen" sortable style="min-width: 8rem"><template #body="{ data }"><Tag :value="data.origenLabel" :severity="data.origen === 'VENTA' ? 'info' : data.origen === 'COMPRA' ? 'success' : 'warn'" /></template></Column>
              <Column field="contraparte" header="Agente / contraparte" sortable style="min-width: 16rem"><template #body="{ data }"><div class="party-cell"><strong>{{ data.contraparte }}</strong><small>{{ data.identificacion || 'Sin identificación' }}</small></div></template></Column>
              <Column field="documento" header="NCF" style="min-width: 12rem"><template #body="{ data }"><span class="document-code">{{ data.documento }}</span></template></Column>
              <Column field="base" header="Base" sortable style="min-width: 10rem"><template #body="{ data }">{{ moneda(data.base) }}</template></Column>
              <Column field="itbisRetenido" header="ITBIS retenido" sortable style="min-width: 11rem"><template #body="{ data }"><strong class="amount-amber">{{ moneda(data.itbisRetenido) }}</strong></template></Column>
              <Column field="isrRetenido" header="ISR retenido" sortable style="min-width: 11rem"><template #body="{ data }"><strong class="amount-rose">{{ moneda(data.isrRetenido) }}</strong></template></Column>
              <Column field="retenciones" header="Total retenido" sortable frozen alignFrozen="right" style="min-width: 11rem"><template #body="{ data }"><strong>{{ moneda(data.retenciones) }}</strong></template></Column>
            </DataTable>
          </TabPanel>
        </TabView>
        <footer class="data-footer"><span><i class="pi pi-database"></i> Ventas, compras y gastos locales consolidados</span><span v-if="ultimaActualizacion">Actualizado {{ ultimaActualizacion.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) }}</span></footer>
      </section>
    </div>
    <Toast />
  </main>
</template>

<style scoped>
.tax-page { min-height: calc(100vh - 60px); background: #f4f7fb; color: #172033; }
.tax-page, .tax-page * { box-sizing: border-box; }
.tax-page { --surface: #ffffff; --surface-soft: #f8fafc; --line: #dfe7f1; --muted: #64748b; --ink: #172033; position: relative; isolation: isolate; overflow-x: hidden; background: radial-gradient(circle at 5% 0%, rgba(20, 184, 166, .08), transparent 25rem), linear-gradient(180deg, #f8fafc 0, #f3f6fa 34rem, #eef3f8 100%); font-family: Inter, "Segoe UI", system-ui, sans-serif; }
.tax-page::before { content: ''; position: absolute; z-index: -1; inset: 0 0 auto; height: 18rem; opacity: .45; background-image: linear-gradient(rgba(15, 118, 110, .035) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 118, 110, .035) 1px, transparent 1px); background-size: 28px 28px; mask-image: linear-gradient(to bottom, #000, transparent); }
.tax-shell { width: min(100%, 105rem); margin-inline: auto; padding: 1.5rem clamp(1rem, 2vw, 2rem) 2.5rem; }
.hero-panel { position: relative; overflow: hidden; display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; padding: 2rem; border-radius: 1.25rem; color: white; background: linear-gradient(125deg, #111c36 0%, #1e3a5f 58%, #135f68 100%); box-shadow: 0 16px 36px rgba(15, 23, 42, .16); }
.hero-panel { min-height: 13.25rem; border: 1px solid rgba(255,255,255,.08); background: radial-gradient(circle at 83% 20%, rgba(45,212,191,.19), transparent 20rem), linear-gradient(125deg, #0b1730 0%, #16385a 55%, #0f6267 100%); box-shadow: 0 24px 56px rgba(15,23,42,.18), inset 0 1px rgba(255,255,255,.08); }
.hero-panel::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .35; background-image: linear-gradient(120deg, transparent 0 65%, rgba(255,255,255,.04) 65% 66%, transparent 66%); }
.hero-panel::after { content: ''; position: absolute; width: 23rem; height: 23rem; right: -7rem; top: -12rem; border: 1px solid rgba(255,255,255,.16); border-radius: 50%; box-shadow: 0 0 0 3.5rem rgba(255,255,255,.035), 0 0 0 7rem rgba(255,255,255,.025); }
.hero-panel > * { position: relative; z-index: 1; }
.eyebrow, .section-kicker { display: inline-flex; align-items: center; gap: .45rem; text-transform: uppercase; letter-spacing: .09em; font-size: .72rem; font-weight: 800; }
.eyebrow { color: #8ee7dc; }.eyebrow span { margin-left: .15rem; padding: .2rem .48rem; border: 1px solid rgba(153,246,228,.24); border-radius: 99px; color: #ccfbf1; background: rgba(15,118,110,.26); font-size: .6rem; letter-spacing: .04em; }.hero-panel h1 { margin: .55rem 0 .45rem; font-size: clamp(1.85rem, 3vw, 2.65rem); line-height: 1.08; font-weight: 800; letter-spacing: -.035em; }.hero-panel p { max-width: 44rem; margin: 0; color: #d2dbea; font-size: .95rem; line-height: 1.6; }
.hero-meta { display: flex; flex-wrap: wrap; gap: .55rem; }.status-pill { color: #bbf7d0; }
.period-pill { display: inline-flex; align-items: center; gap: .5rem; margin-top: 1.2rem; padding: .45rem .75rem; border: 1px solid rgba(255,255,255,.15); border-radius: 999px; color: #e9f0f8; background: rgba(255,255,255,.08); font-size: .78rem; }
.hero-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .65rem; }.hero-actions :deep(.p-button-secondary) { color: #fff; border-color: rgba(255,255,255,.35); }
.hero-actions :deep(.p-button) { min-height: 2.7rem; border-radius: .7rem; font-weight: 700; box-shadow: none; }.hero-actions :deep(.p-button:not(.p-button-secondary)) { border-color: #14b8a6; background: #14b8a6; }.hero-actions :deep(.p-button:not(.p-button-secondary):hover) { border-color: #0d9488; background: #0d9488; transform: translateY(-1px); }.hero-actions :deep(.p-button-secondary:hover) { border-color: rgba(255,255,255,.65); background: rgba(255,255,255,.1); }
.hero-actions :deep(.report-pdf-button.p-button) { border-color: #e11d48; background: #e11d48; box-shadow: 0 8px 18px rgba(225,29,72,.22); }.hero-actions :deep(.report-pdf-button.p-button:hover) { border-color: #be123c; background: #be123c; }
.filter-panel { display: grid; grid-template-columns: minmax(15rem, 1.05fr) minmax(12rem, .75fr) minmax(17rem, 1.35fr) auto; align-items: end; gap: 1rem; margin: 1.25rem 0; padding: 1rem 1.15rem; border: 1px solid #e3e9f1; border-radius: 1rem; background: #fff; box-shadow: 0 5px 18px rgba(15,23,42,.045); }
.filter-panel { position: relative; z-index: 3; margin-top: -1rem; margin-inline: 1rem; padding: 1.1rem 1.2rem; border-color: rgba(203,213,225,.8); box-shadow: 0 14px 30px rgba(15,23,42,.09); }
.filter-field label { display: block; margin-bottom: .45rem; color: #526077; font-size: .75rem; font-weight: 750; }.clear-button { margin-bottom: .05rem; }
.filter-field :deep(.p-inputtext), .filter-field :deep(.p-dropdown), .filter-field :deep(.p-calendar) { width: 100%; }.filter-field :deep(.p-inputtext), .filter-field :deep(.p-dropdown) { min-height: 2.65rem; border-color: #d8e1eb; border-radius: .65rem; background: #fbfdff; }.filter-field :deep(.p-inputtext:enabled:hover), .filter-field :deep(.p-dropdown:not(.p-disabled):hover) { border-color: #94a3b8; }.filter-field :deep(.p-inputtext:enabled:focus), .filter-field :deep(.p-dropdown:not(.p-disabled).p-focus) { border-color: #0f766e; box-shadow: 0 0 0 3px rgba(13,148,136,.12); }.filter-field :deep(.p-icon-field) { width: 100%; }.clear-button:deep(.p-button) { min-height: 2.65rem; border-radius: .65rem; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.kpi-card { --tone: #2563eb; --soft: #dbeafe; position: relative; overflow: hidden; min-height: 10.6rem; padding: 1.2rem; border: 1px solid #e4eaf2; border-radius: 1rem; background: linear-gradient(145deg, #fff 0%, #fbfdff 100%); box-shadow: 0 7px 22px rgba(15,23,42,.055); transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }.kpi-card:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--tone) 25%, #e4eaf2); box-shadow: 0 14px 30px rgba(15,23,42,.09); }.kpi-card::before { content: ''; position: absolute; width: 7rem; height: 7rem; top: -4rem; right: -3rem; border-radius: 50%; background: var(--soft); opacity: .5; }.kpi-card::after { content: ''; position: absolute; inset: auto 1.2rem 0; height: 3px; border-radius: 99px 99px 0 0; background: var(--tone); }
.tone-emerald { --tone: #059669; --soft: #d1fae5; }.tone-amber { --tone: #d97706; --soft: #fef3c7; }.tone-violet { --tone: #7c3aed; --soft: #ede9fe; }.tone-rose { --tone: #e11d48; --soft: #ffe4e6; }
.kpi-top { display: flex; justify-content: space-between; align-items: center; }.kpi-icon { display: grid; place-items: center; width: 2.35rem; height: 2.35rem; border-radius: .75rem; color: var(--tone); background: var(--soft); }.live-dot { display: inline-flex; align-items: center; gap: .35rem; color: #7b8799; font-size: .68rem; font-weight: 700; }.live-dot i { width: .4rem; height: .4rem; border-radius: 50%; background: var(--tone); }
.kpi-card p { margin: .9rem 0 .2rem; color: #637086; font-size: .8rem; font-weight: 650; }.kpi-card strong { display: block; color: #182238; font-size: clamp(1.25rem, 2vw, 1.65rem); letter-spacing: -.035em; }.kpi-card small { display: block; min-height: 1.1rem; margin-top: .38rem; color: #8993a3; font-size: .68rem; }
.insights-grid { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 1rem; margin-top: 1rem; }.panel { border: 1px solid #e1e8f0; border-radius: 1rem; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.055); }.chart-panel, .breakdown-panel { min-height: 26rem; padding: 1.35rem; }
.panel-heading, .table-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }.section-kicker { color: #2b6a77; }.panel h2 { margin: .2rem 0 0; color: #1e293b; font-size: 1.05rem; font-weight: 800; }.record-count { padding: .3rem .55rem; border-radius: .45rem; color: #56647a; background: #f1f5f9; font-size: .7rem; font-weight: 700; }
.chart-wrap { position: relative; height: 19rem; padding-top: .7rem; }.chart-total { pointer-events: none; position: absolute; top: 43%; left: 50%; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); }.chart-total span { color: #8490a3; font-size: .65rem; }.chart-total strong { color: #1e293b; font-size: .9rem; }.empty-chart { display: grid; place-items: center; align-content: center; height: 19rem; color: #94a3b8; }.empty-chart i { font-size: 2.4rem; }.empty-chart p { margin: .7rem 0 0; }
.breakdown-list { display: grid; gap: 1.15rem; margin-top: 1.35rem; }.breakdown-row > div:first-child { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: .45rem; font-size: .78rem; }.breakdown-row span { color: #58667b; }.breakdown-row strong { color: #253047; }.progress-track { overflow: hidden; height: .42rem; border-radius: 999px; background: #edf1f6; }.progress-track span { display: block; height: 100%; border-radius: inherit; transition: width .35s ease; }.bg-blue { background: #2563eb; }.bg-emerald { background: #10b981; }.bg-violet { background: #8b5cf6; }.bg-amber { background: #f59e0b; }
.balance-box { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.3rem; padding: 1rem; border: 1px solid #fde6b3; border-radius: .85rem; background: #fffbeb; }.balance-box.favorable { border-color: #c7f0df; background: #ecfdf5; }.balance-box span, .balance-box small { display: block; }.balance-box span { color: #5b4b20; font-size: .78rem; font-weight: 800; }.balance-box small { margin-top: .15rem; color: #8f8060; font-size: .66rem; }.balance-box strong { color: #b45309; font-size: 1.12rem; }.balance-box.favorable strong { color: #047857; }
.table-panel { overflow: hidden; margin-top: 1rem; }.table-toolbar { padding: 1.3rem 1.35rem .75rem; }.export-actions { display: flex; gap: .55rem; }.export-actions :deep(.p-button) { border-radius: .65rem; }.table-panel :deep(.p-tabview-nav) { padding: 0 1.25rem; border-color: #e8edf3; background: transparent; }.table-panel :deep(.p-tabview-nav-link) { gap: .45rem; padding: 1rem .9rem; font-weight: 700; }.table-panel :deep(.p-tabview-panels) { padding: 0; background: transparent; }.table-panel :deep(.p-datatable-wrapper) { border-top: 1px solid #e8edf3; }.table-panel :deep(.p-datatable-thead > tr > th) { padding: .85rem .9rem; border-color: #e7edf4; color: #536176; background: #f7f9fc; font-size: .7rem; font-weight: 800; letter-spacing: .035em; text-transform: uppercase; }.table-panel :deep(.p-datatable-tbody > tr > td) { padding: .82rem .9rem; border-color: #edf1f5; color: #475569; font-size: .79rem; }.table-panel :deep(.p-datatable-tbody > tr:hover) { background: #f5faf9; }.table-panel :deep(.p-paginator) { border: 0; border-top: 1px solid #e8edf3; border-radius: 0; background: #fbfcfe; }.table-panel :deep(.p-paginator .p-paginator-page.p-highlight) { color: #0f766e; background: #ccfbf1; }.table-panel :deep(.p-badge) { min-width: 1.35rem; height: 1.35rem; font-size: .65rem; }.tab-label { display: inline-flex; align-items: center; gap: .5rem; }
.party-cell { display: flex; flex-direction: column; gap: .15rem; }.party-cell strong { color: #273449; font-size: .8rem; }.party-cell small { color: #8a95a6; font-size: .68rem; }.document-code { padding: .28rem .45rem; border: 1px solid #dfe6ef; border-radius: .35rem; color: #45546b; background: #f8fafc; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72rem; }.amount-blue { color: #1d4ed8; }.amount-amber { color: #b45309; }.amount-rose { color: #be123c; }
.table-empty { display: flex; min-height: 13rem; flex-direction: column; align-items: center; justify-content: center; color: #8a96a8; }.table-empty i { margin-bottom: .7rem; color: #bdc7d5; font-size: 2.1rem; }.table-empty strong { color: #4a586e; }.table-empty span { margin-top: .3rem; font-size: .75rem; }.data-footer { display: flex; justify-content: space-between; gap: 1rem; padding: .8rem 1.25rem; border-top: 1px solid #e8edf3; color: #7a8799; background: #fbfcfe; font-size: .68rem; }.data-footer i { margin-right: .3rem; }
@media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); }.filter-panel { grid-template-columns: repeat(2, 1fr); }.insights-grid { grid-template-columns: 1fr; } }
@media (max-width: 720px) { .tax-shell { padding: .7rem .65rem 1.5rem; }.hero-panel { min-height: 0; align-items: flex-start; flex-direction: column; padding: 1.35rem; border-radius: 1rem; }.hero-actions { width: 100%; justify-content: flex-start; }.hero-actions :deep(.p-button) { flex: 1 1 8rem; }.filter-panel { margin: .8rem 0; }.filter-panel, .kpi-grid { grid-template-columns: 1fr; }.kpi-card { min-height: 9.8rem; }.clear-button { width: 100%; justify-self: stretch; }.table-toolbar, .data-footer { align-items: flex-start; flex-direction: column; }.export-actions { width: 100%; }.export-actions :deep(.p-button) { flex: 1; }.chart-total { display: none; }.panel { border-radius: .85rem; } }
:global(.app-dark) .tax-page { --surface: #111827; --surface-soft: #0f172a; --line: #293448; --muted: #94a3b8; --ink: #eef2f7; color: #e5e7eb; background: radial-gradient(circle at 5% 0%, rgba(20,184,166,.09), transparent 25rem), linear-gradient(180deg, #080e1a 0, #0b1120 100%); }:global(.app-dark) .filter-panel, :global(.app-dark) .panel, :global(.app-dark) .kpi-card { border-color: #293448; background: linear-gradient(145deg, #111827, #0f172a); box-shadow: 0 12px 30px rgba(0,0,0,.22); }:global(.app-dark) .filter-field label, :global(.app-dark) .kpi-card p, :global(.app-dark) .breakdown-row span { color: #9aa8bb; }:global(.app-dark) .filter-field :deep(.p-inputtext), :global(.app-dark) .filter-field :deep(.p-dropdown) { border-color: #334155; color: #e2e8f0; background: #0b1220; }:global(.app-dark) .kpi-card strong, :global(.app-dark) .panel h2, :global(.app-dark) .breakdown-row strong, :global(.app-dark) .chart-total strong, :global(.app-dark) .party-cell strong { color: #eef2f7; }:global(.app-dark) .progress-track { background: #273449; }:global(.app-dark) .balance-box { border-color: #654c1c; background: rgba(120,78,12,.2); }:global(.app-dark) .balance-box.favorable { border-color: #145c4a; background: rgba(6,95,70,.2); }:global(.app-dark) .document-code, :global(.app-dark) .record-count { border-color: #334155; color: #cbd5e1; background: #1e293b; }:global(.app-dark) .table-panel :deep(.p-datatable-thead > tr > th), :global(.app-dark) .table-panel :deep(.p-paginator) { border-color: #293448; color: #aab6c7; background: #0d1525; }:global(.app-dark) .table-panel :deep(.p-datatable-tbody > tr) { color: #d5dce7; background: #111827; }:global(.app-dark) .table-panel :deep(.p-datatable-tbody > tr > td), :global(.app-dark) .table-panel :deep(.p-datatable-wrapper), :global(.app-dark) .table-panel :deep(.p-tabview-nav) { border-color: #293448; }:global(.app-dark) .table-panel :deep(.p-datatable-tbody > tr:hover) { background: #152133; }:global(.app-dark) .data-footer { border-color: #293448; background: #0b1322; }
:global(.fiscal-pdf-preview) { max-width: 1500px; border-radius: 1rem; }:global(.fiscal-pdf-container) { margin: .5rem 0 .75rem !important; padding: 0 !important; overflow: hidden !important; }
</style>
