<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from "primevue/usetoast";
import {
  envioElectron,
  encryptarPassword,
  formatearFecha,
  peticionesFetchOffline
} from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref(null);
const loading = ref(false);

// Filtros
const rangoFecha = ref([]);
const busqueda = ref('');
const tipoOperacionFilter = ref('');

// Datos
const anulacionesData = ref([]);
const anulacionesFiltradas = computed(() => {
  let filtered = anulacionesData.value;

  // Filtro por búsqueda
  if (busqueda.value) {
    const query = busqueda.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.ncf_anulado?.toLowerCase().includes(query) ||
      item.ncf_modificado?.toLowerCase().includes(query) ||
      item.descripcion?.toLowerCase().includes(query)
    );
  }

  // Filtro por tipo de operación
  if (tipoOperacionFilter.value) {
    filtered = filtered.filter(item => item.tipo_operacion === tipoOperacionFilter.value);
  }

  return filtered;
});

// Estadísticas
const totalAnulaciones = computed(() =>
  anulacionesFiltradas.value.filter(item => item.tipo_operacion === 'ANULACION').length
);
const totalModificaciones = computed(() =>
  anulacionesFiltradas.value.filter(item => item.tipo_operacion === 'MODIFICACION').length
);
const totalRegistros = computed(() => anulacionesFiltradas.value.length);

// Tipos de operación
const tiposOperacion = [
  { label: 'Todos', value: '' },
  { label: 'Anulación', value: 'ANULACION' },
  { label: 'Modificación', value: 'MODIFICACION' }
];

/************************************************************************/
document.body.classList.add('sidebar-close');

/************************************************************************/
onMounted(async() => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;

    tokenCifrado.value = await encryptarPassword(token.value, 10);

    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
    }

    // Establecer fechas del mes actual por defecto
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    rangoFecha.value = [primerDia, ultimoDia];

    await cargarDatos();
  } catch (error) {
    console.error('Error al inicializar:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar configuración',
      life: 3000
    });
  }
});

/************************************************************************/
const cargarDatos = async () => {
  if (!rangoFecha.value || rangoFecha.value.length < 2) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Selecciona un rango de fechas válido',
      life: 3000
    });
    return;
  }

  loading.value = true;
  try {
    // Obtener todas las facturas anuladas/modificadas
    const facturas = await peticionesFetchOffline('getDataAsArray', 'facturas');
    const devoluciones = await peticionesFetchOffline('getDataAsArray', 'devoluciones');

    // Filtrar por rango de fechas
    const fechaInicio = new Date(rangoFecha.value[0]);
    const fechaFin = new Date(rangoFecha.value[1]);
    fechaFin.setHours(23, 59, 59, 999);

    // Buscar facturas anuladas (estado_factura = ANULADO o similar)
    const facturasAnuladas = (facturas || []).filter(factura => {
      const fechaEstado = new Date(factura.fecha_estado || factura.fecha_emision);
      const esAnulada = factura.estado_factura === 'ANULADO' || factura.estado_factura === 'CANCELADO';
      return esAnulada && fechaEstado >= fechaInicio && fechaEstado <= fechaFin;
    }).map((factura, index) => ({
      linea: index + 1,
      tipo_operacion: 'ANULACION',
      fecha_operacion: factura.fecha_estado || factura.fecha_emision,
      ncf_anulado: factura.tipo_factura || '',
      ncf_modificado: '',
      comprobante: factura.comprobante || 'SIN COMPROBANTE',
      descripcion: `Factura ${factura.no_factura} anulada`,
      monto: parseFloat(factura.total || 0),
      itbis: parseFloat(factura.impuesto || 0)
    }));

    // Agregar devoluciones como anulaciones
    const devolucionesData = (devoluciones || []).filter(dev => {
      const fechaDev = new Date(dev.fecha);
      return fechaDev >= fechaInicio && fechaDev <= fechaFin;
    }).map((dev, index) => ({
      linea: facturasAnuladas.length + index + 1,
      tipo_operacion: 'ANULACION',
      fecha_operacion: dev.fecha,
      ncf_anulado: '',
      ncf_modificado: '',
      comprobante: 'DEVOLUCION',
      descripcion: dev.descripcion || 'Devolución',
      monto: parseFloat(dev.cantidad || 0),
      itbis: 0
    }));

    anulacionesData.value = [...facturasAnuladas, ...devolucionesData];

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `${anulacionesData.value.length} registros cargados`,
      life: 3000
    });
  } catch (error) {
    console.error('Error al cargar datos:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar datos de anulaciones',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
const exportarExcel = () => {
  if (anulacionesFiltradas.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No hay datos para exportar',
      life: 3000
    });
    return;
  }

  const datos = anulacionesFiltradas.value.map((item, index) => ({
    'Línea': index + 1,
    'Tipo Operación': item.tipo_operacion,
    'Fecha': formatearFecha(item.fecha_operacion),
    'Tipo Comprobante': obtenerTipoComprobante(item.comprobante),
    'NCF Anulado/Modificado': item.ncf_anulado || item.ncf_modificado || '',
    'NCF que Modifica': item.ncf_modificado || '',
    'Descripción': item.descripcion || '',
    'Monto': parseFloat(item.monto || 0).toFixed(2),
    'ITBIS': parseFloat(item.itbis || 0).toFixed(2)
  }));

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '608');

  // Ajustar anchos de columna
  const colWidths = [
    { wch: 8 },  // Línea
    { wch: 15 }, // Tipo
    { wch: 12 }, // Fecha
    { wch: 25 }, // Tipo Comp
    { wch: 25 }, // NCF Anulado
    { wch: 25 }, // NCF Modifica
    { wch: 50 }, // Descripción
    { wch: 15 }, // Monto
    { wch: 15 }  // ITBIS
  ];
  ws['!cols'] = colWidths;

  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;
  XLSX.writeFile(wb, `608_Anulaciones_${periodo}.xlsx`);

  toast.add({
    severity: 'success',
    summary: 'Éxito',
    detail: 'Archivo Excel exportado correctamente',
    life: 3000
  });
};

/************************************************************************/
const exportarTXT = () => {
  if (anulacionesFiltradas.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No hay datos para exportar',
      life: 3000
    });
    return;
  }

  // Formato TXT para DGII según normativa 608
  const lineas = anulacionesFiltradas.value.map(item => {
    const campos = [
      obtenerCodigoTipoComprobante(item.comprobante),  // Tipo Comprobante
      item.ncf_anulado || item.ncf_modificado || '',   // NCF
      formatearFechaDGII(item.fecha_operacion),        // Fecha
      item.tipo_operacion === 'ANULACION' ? '01' : '02', // Tipo Operación (01=Anulación, 02=Modificación)
      item.ncf_modificado || '',                       // NCF que Modifica (solo para modificaciones)
      formatearMonto(item.monto || 0),                 // Monto
      formatearMonto(item.itbis || 0)                  // ITBIS
    ];
    return campos.join('|');
  });

  const contenido = lineas.join('\n');
  const blob = new Blob([contenido], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;
  a.download = `608_${datosEmpresa.empresa.rnc || 'SIN_RNC'}_${periodo}.txt`;
  a.click();
  window.URL.revokeObjectURL(url);

  toast.add({
    severity: 'success',
    summary: 'Éxito',
    detail: 'Archivo TXT exportado correctamente',
    life: 3000
  });
};

/************************************************************************/
const exportarPDF = () => {
  if (anulacionesFiltradas.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No hay datos para exportar',
      life: 3000
    });
    return;
  }

  const doc = new jsPDF('l', 'mm', 'a4');

  // Encabezado
  doc.setFontSize(16);
  doc.text('REPORTE 608 - CANCELACIONES Y MODIFICACIONES', 148, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Empresa: ${datosEmpresa.empresa.nombre || 'N/A'}`, 14, 25);
  doc.text(`RNC: ${datosEmpresa.empresa.rnc || 'N/A'}`, 14, 30);
  doc.text(`Periodo: ${formatearFecha(rangoFecha.value[0])} - ${formatearFecha(rangoFecha.value[1])}`, 14, 35);
  doc.text(`Fecha de emisión: ${formatearFecha(new Date())}`, 14, 40);

  // Tabla
  const tableData = anulacionesFiltradas.value.map((item, index) => [
    index + 1,
    item.tipo_operacion,
    formatearFecha(item.fecha_operacion),
    obtenerTipoComprobante(item.comprobante),
    item.ncf_anulado || item.ncf_modificado || 'N/A',
    item.descripcion || '',
    `RD$ ${parseFloat(item.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);

  doc.autoTable({
    startY: 45,
    head: [['#', 'Tipo Operación', 'Fecha', 'Tipo Comp.', 'NCF', 'Descripción', 'Monto']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 40 },
      4: { cellWidth: 40 },
      5: { cellWidth: 80 },
      6: { cellWidth: 30, halign: 'right' }
    },
    didDrawPage: (data) => {
      // Pie de página
      doc.setFontSize(8);
      doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber}`, 148, doc.internal.pageSize.height - 10, { align: 'center' });
    }
  });

  // Totales
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('RESUMEN:', 14, finalY);
  doc.setFont(undefined, 'normal');
  doc.text(`Total de registros: ${totalRegistros.value}`, 14, finalY + 5);
  doc.text(`Total anulaciones: ${totalAnulaciones.value}`, 14, finalY + 10);
  doc.text(`Total modificaciones: ${totalModificaciones.value}`, 14, finalY + 15);

  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;
  doc.save(`608_Anulaciones_${periodo}.pdf`);

  toast.add({
    severity: 'success',
    summary: 'Éxito',
    detail: 'PDF generado correctamente',
    life: 3000
  });
};

/************************************************************************/
// Funciones auxiliares
const obtenerTipoComprobante = (comprobante) => {
  if (!comprobante) return 'Sin Comprobante';
  const tipos = {
    'CONSUMIDOR FINAL': '02 - Consumidor Final',
    'COMPROBANTE CON VALOR FISCAL': '01 - Crédito Fiscal',
    'REGIMEN ESPECIAL': '14 - Régimen Especial',
    'COMPROBANTE GUBERNAMENTAL': '15 - Gubernamental',
    'DEVOLUCION': 'Devolución',
    'SIN COMPROBANTE': 'Sin Comprobante'
  };
  return tipos[comprobante] || comprobante;
};

const obtenerCodigoTipoComprobante = (comprobante) => {
  const codigos = {
    'CONSUMIDOR FINAL': '02',
    'COMPROBANTE CON VALOR FISCAL': '01',
    'REGIMEN ESPECIAL': '14',
    'COMPROBANTE GUBERNAMENTAL': '15',
    'DEVOLUCION': '02',
    'SIN COMPROBANTE': ''
  };
  return codigos[comprobante] || '';
};

const formatearFechaDGII = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const formatearMonto = (monto) => {
  return parseFloat(monto || 0).toFixed(2);
};

const getSeverityTipo = (tipo) => {
  return tipo === 'ANULACION' ? 'danger' : 'warning';
};
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Reporte 608 - Cancelaciones</h1>
            <p class="text-gray-600 mt-1">Informe de Cancelaciones y Modificaciones según normativa DGII</p>
          </div>
          <div class="flex gap-2">
            <Button
              label="Excel"
              icon="pi pi-file-excel"
              severity="success"
              @click="exportarExcel"
              :disabled="loading || anulacionesFiltradas.length === 0"
            />
            <Button
              label="TXT DGII"
              icon="pi pi-file"
              severity="info"
              @click="exportarTXT"
              :disabled="loading || anulacionesFiltradas.length === 0"
            />
            <Button
              label="PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              @click="exportarPDF"
              :disabled="loading || anulacionesFiltradas.length === 0"
            />
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <Card class="mb-6 shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-red-600"></i>
            <span>Filtros y Búsqueda</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm text-gray-700">Rango de Fechas</label>
              <DatePicker
                v-model="rangoFecha"
                selectionMode="range"
                dateFormat="dd/mm/yy"
                :showIcon="true"
                placeholder="Selecciona rango"
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm text-gray-700">Tipo de Operación</label>
              <Dropdown
                v-model="tipoOperacionFilter"
                :options="tiposOperacion"
                optionLabel="label"
                optionValue="value"
                placeholder="Todos los tipos"
                class="w-full"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm text-gray-700">Búsqueda</label>
              <InputText
                v-model="busqueda"
                placeholder="NCF, Descripción..."
                class="w-full"
              />
            </div>
            <div class="flex items-end">
              <Button
                label="Cargar Datos"
                icon="pi pi-search"
                severity="primary"
                @click="cargarDatos"
                :loading="loading"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Total Registros</p>
                <p class="text-2xl font-bold text-gray-700">{{ totalRegistros }}</p>
              </div>
              <div class="bg-gray-100 p-3 rounded-full">
                <i class="pi pi-list text-gray-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Anulaciones</p>
                <p class="text-2xl font-bold text-red-600">{{ totalAnulaciones }}</p>
              </div>
              <div class="bg-red-100 p-3 rounded-full">
                <i class="pi pi-times-circle text-red-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Modificaciones</p>
                <p class="text-2xl font-bold text-orange-600">{{ totalModificaciones }}</p>
              </div>
              <div class="bg-orange-100 p-3 rounded-full">
                <i class="pi pi-pencil text-orange-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Tabla de Datos -->
      <Card class="shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-list text-red-600"></i>
            <span>Detalle de Cancelaciones y Modificaciones</span>
          </div>
        </template>
        <template #content>
          <DataTable
            :value="anulacionesFiltradas"
            :paginator="true"
            :rows="20"
            :loading="loading"
            stripedRows
            showGridlines
            responsiveLayout="scroll"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[10, 20, 50, 100]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
          >
            <template #empty>
              <div class="text-center py-8">
                <i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i>
                <p class="text-gray-500">No se encontraron cancelaciones en el periodo seleccionado</p>
              </div>
            </template>

            <Column field="linea" header="#" :style="{ width: '60px' }"></Column>
            <Column field="tipo_operacion" header="Tipo Operación" :style="{ minWidth: '140px' }">
              <template #body="slotProps">
                <Tag :value="slotProps.data.tipo_operacion" :severity="getSeverityTipo(slotProps.data.tipo_operacion)" />
              </template>
            </Column>
            <Column field="fecha_operacion" header="Fecha" :style="{ minWidth: '100px' }">
              <template #body="slotProps">
                {{ formatearFecha(slotProps.data.fecha_operacion) }}
              </template>
            </Column>
            <Column field="comprobante" header="Tipo Comprobante" :style="{ minWidth: '180px' }">
              <template #body="slotProps">
                {{ obtenerTipoComprobante(slotProps.data.comprobante) }}
              </template>
            </Column>
            <Column field="ncf_anulado" header="NCF Anulado/Modificado" :style="{ minWidth: '180px' }">
              <template #body="slotProps">
                {{ slotProps.data.ncf_anulado || slotProps.data.ncf_modificado || 'N/A' }}
              </template>
            </Column>
            <Column field="ncf_modificado" header="NCF que Modifica" :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                {{ slotProps.data.ncf_modificado || '-' }}
              </template>
            </Column>
            <Column field="descripcion" header="Descripción" :style="{ minWidth: '250px' }"></Column>
            <Column field="monto" header="Monto" :style="{ minWidth: '120px' }">
              <template #body="slotProps">
                <span class="font-semibold text-blue-700">
                  RD$ {{ parseFloat(slotProps.data.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
              </template>
            </Column>
            <Column field="itbis" header="ITBIS" :style="{ minWidth: '120px' }">
              <template #body="slotProps">
                <span class="font-semibold text-orange-700">
                  RD$ {{ parseFloat(slotProps.data.itbis || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}
</style>
