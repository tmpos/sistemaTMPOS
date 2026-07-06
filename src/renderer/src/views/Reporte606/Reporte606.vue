<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from "primevue/usetoast";
import Swal from 'sweetalert2';
import {
  envioElectron,
  encryptarPassword,
  nfecha,
  transformarFechaTimestamp,
  formatearFecha,
  peticionesFetchOffline
} from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const router = useRouter();
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
const tipoNCFFilter = ref('');

// Datos
const comprasData = ref([]);
const comprasFiltradas = computed(() => {
  let filtered = comprasData.value;

  // Filtro por búsqueda
  if (busqueda.value) {
    const query = busqueda.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.proveedor?.toLowerCase().includes(query) ||
      item.rnc_proveedor?.toLowerCase().includes(query) ||
      item.ncf_proveedor?.toLowerCase().includes(query) ||
      item.no_factura?.toLowerCase().includes(query)
    );
  }

  // Filtro por tipo de NCF
  if (tipoNCFFilter.value) {
    filtered = filtered.filter(item => {
      const ncf = item.ncf_proveedor || '';
      return ncf.startsWith(tipoNCFFilter.value);
    });
  }

  return filtered;
});

// Estadísticas
const totalCompras = computed(() => comprasFiltradas.value.length);
const totalMonto = computed(() => {
  return comprasFiltradas.value.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
});
const totalITBIS = computed(() => {
  return comprasFiltradas.value.reduce((sum, item) => sum + parseFloat(item.impuesto || 0), 0);
});
const totalBase = computed(() => {
  return comprasFiltradas.value.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
});

// Tipos de NCF según normativa DGII
const tiposNCF = [
  { label: 'Todos', value: '' },
  { label: '01 - Gastos Menores', value: 'B01' },
  { label: '02 - Gastos Personales', value: 'B02' },
  { label: '03 - Facturas de Crédito Fiscal', value: 'B03' },
  { label: '04 - Nota de Crédito', value: 'B04' },
  { label: '14 - Régimen Especial', value: 'B14' },
  { label: '15 - Gubernamental', value: 'B15' },
  { label: '16 - Exportaciones', value: 'B16' }
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
// Función helper para parsear fechas DD/MM/YYYY
const parsearFecha = (fechaStr) => {
  if (!fechaStr) return null;

  // Formato DD/MM/YYYY (usado por nfecha('fecha'))
  if (fechaStr.includes('/')) {
    const partes = fechaStr.split('/');
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1; // Los meses en JS son 0-11
      const año = parseInt(partes[2], 10);
      const fecha = new Date(año, mes, dia);
      fecha.setHours(0, 0, 0, 0);
      return fecha;
    }
  }

  // Formato YYYY-MM-DD
  if (fechaStr.includes('-')) {
    const fecha = new Date(fechaStr);
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  }

  return null;
};

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
    // Obtener todas las compras
    const response = await peticionesFetchOffline('getDataAsArray', 'compras');
    console.log('Total compras en DB:', response?.length || 0);

    // Normalizar rango de fechas
    const fechaInicio = new Date(rangoFecha.value[0]);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(rangoFecha.value[1]);
    fechaFin.setHours(23, 59, 59, 999);

    console.log('Rango seleccionado:', {
      inicio: fechaInicio.toLocaleDateString('es-DO'),
      fin: fechaFin.toLocaleDateString('es-DO'),
      inicioISO: fechaInicio.toISOString(),
      finISO: fechaFin.toISOString()
    });

    // Filtrar compras
    comprasData.value = (response || []).filter(compra => {
      // FILTRO 1: Solo compras con NCF
      if (!compra.ncf_proveedor || compra.ncf_proveedor.trim() === '') {
        return false;
      }

      // FILTRO 2: Verificar y parsear fecha
      if (!compra.fecha) return false;

      const fechaCompra = parsearFecha(compra.fecha);
      if (!fechaCompra) {
        console.warn('Fecha inválida:', compra.fecha, compra.no_factura);
        return false;
      }

      // Comparar fechas (ya están normalizadas a medianoche)
      const dentroRango = fechaCompra >= fechaInicio && fechaCompra <= fechaFin;

      if (!dentroRango) {
        console.log('Compra con NCF fuera de rango:', {
          fechaOriginal: compra.fecha,
          fechaParsed: fechaCompra.toLocaleDateString('es-DO'),
          fechaParseISO: fechaCompra.toISOString(),
          proveedor: compra.proveedor,
          no_factura: compra.no_factura,
          ncf: compra.ncf_proveedor
        });
      }

      return dentroRango;
    }).map((compra, index) => ({
      ...compra,
      linea: index + 1,
      montoFacturado: parseFloat(compra.total || 0),
      itbisFacturado: parseFloat(compra.impuesto || 0),
      servicios: 0,
      bienes: parseFloat(compra.subtotal || 0)
    }));

    console.log('Compras con NCF filtradas:', comprasData.value.length);

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `${comprasData.value.length} compras con NCF cargadas`,
      life: 3000
    });
  } catch (error) {
    console.error('Error al cargar datos:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar datos de compras',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
const exportarExcel = () => {
  if (comprasFiltradas.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No hay datos para exportar',
      life: 3000
    });
    return;
  }

  const datos = comprasFiltradas.value.map((item, index) => ({
    'Línea': index + 1,
    'RNC/Cédula': item.rnc_proveedor || '',
    'Nombre/Razón Social': item.proveedor || '',
    'Tipo Comprobante': obtenerTipoNCF(item.ncf_proveedor),
    'NCF': item.ncf_proveedor || '',
    'No. Factura': item.no_factura || '',
    'Fecha': formatearFecha(item.fecha),
    'Monto Facturado': parseFloat(item.total || 0).toFixed(2),
    'ITBIS Facturado': parseFloat(item.impuesto || 0).toFixed(2),
    'ITBIS Retenido': '0.00',
    'ITBIS Percibido': '0.00',
    'Retención Renta': '0.00',
    'ISR Percibido': '0.00',
    'Propina Legal': '0.00',
    'Servicios': '0.00',
    'Bienes': parseFloat(item.subtotal || 0).toFixed(2)
  }));

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '606');

  // Ajustar anchos de columna
  const colWidths = [
    { wch: 8 },  // Línea
    { wch: 15 }, // RNC
    { wch: 35 }, // Nombre
    { wch: 20 }, // Tipo
    { wch: 20 }, // NCF
    { wch: 15 }, // No. Factura
    { wch: 12 }, // Fecha
    { wch: 15 }, // Monto
    { wch: 15 }, // ITBIS
    { wch: 15 }, // ITBIS Ret
    { wch: 15 }, // ITBIS Perc
    { wch: 15 }, // Ret Renta
    { wch: 15 }, // ISR Perc
    { wch: 12 }, // Propina
    { wch: 15 }, // Servicios
    { wch: 15 }  // Bienes
  ];
  ws['!cols'] = colWidths;

  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;
  XLSX.writeFile(wb, `606_Compras_${periodo}.xlsx`);

  toast.add({
    severity: 'success',
    summary: 'Éxito',
    detail: 'Archivo Excel exportado correctamente',
    life: 3000
  });
};

/************************************************************************/
const exportarTXT = () => {
  if (comprasFiltradas.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No hay datos para exportar',
      life: 3000
    });
    return;
  }

  // Formato TXT para DGII según normativa 606
  const lineas = comprasFiltradas.value.map(item => {
    const campos = [
      item.rnc_proveedor || '',                           // RNC/Cédula
      obtenerCodigoTipoNCF(item.ncf_proveedor),          // Tipo Comprobante
      item.ncf_proveedor || '',                           // NCF
      '',                                                  // NCF Modificado (opcional)
      formatearFechaDGII(item.fecha),                     // Fecha Comprobante
      formatearMonto(item.total || 0),                    // Monto Facturado
      formatearMonto(item.impuesto || 0),                 // ITBIS Facturado
      formatearMonto(0),                                   // ITBIS Retenido
      formatearMonto(0),                                   // ITBIS Percibido
      formatearMonto(0),                                   // Retención Renta
      formatearMonto(0),                                   // ISR Percibido
      formatearMonto(0),                                   // Propina Legal
      formatearMonto(0),                                   // Servicios
      formatearMonto(item.subtotal || 0)                  // Bienes
    ];
    return campos.join('|');
  });

  const contenido = lineas.join('\n');
  const blob = new Blob([contenido], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;
  a.download = `606_${datosEmpresa.empresa.rnc || 'SIN_RNC'}_${periodo}.txt`;
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
  if (comprasFiltradas.value.length === 0) {
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
  doc.text('REPORTE 606 - COMPRAS Y SERVICIOS', 148, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Empresa: ${datosEmpresa.empresa.nombre || 'N/A'}`, 14, 25);
  doc.text(`RNC: ${datosEmpresa.empresa.rnc || 'N/A'}`, 14, 30);
  doc.text(`Periodo: ${formatearFecha(rangoFecha.value[0])} - ${formatearFecha(rangoFecha.value[1])}`, 14, 35);
  doc.text(`Fecha de emisión: ${formatearFecha(new Date())}`, 14, 40);

  // Tabla
  const tableData = comprasFiltradas.value.map((item, index) => [
    index + 1,
    item.rnc_proveedor || '',
    item.proveedor || '',
    obtenerTipoNCF(item.ncf_proveedor),
    item.ncf_proveedor || '',
    formatearFecha(item.fecha),
    `RD$ ${parseFloat(item.total || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `RD$ ${parseFloat(item.impuesto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);

  doc.autoTable({
    startY: 45,
    head: [['#', 'RNC', 'Proveedor', 'Tipo', 'NCF', 'Fecha', 'Total', 'ITBIS']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25 },
      2: { cellWidth: 60 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
      5: { cellWidth: 25 },
      6: { cellWidth: 30, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' }
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
  doc.text(`Total de compras: ${totalCompras.value}`, 14, finalY + 5);
  doc.text(`Monto total: RD$ ${totalMonto.value.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 10);
  doc.text(`ITBIS total: RD$ ${totalITBIS.value.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 15);
  doc.text(`Base imponible: RD$ ${totalBase.value.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 20);

  // Mostrar PDF embebido en SweetAlert
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const periodo = `${formatearFecha(rangoFecha.value[0])}_${formatearFecha(rangoFecha.value[1])}`;

  Swal.fire({
    title: 'Reporte 606 - Compras y Servicios',
    html: `
      <div style="width: 100%; height: 70vh;">
        <iframe
          src="${pdfUrl}"
          style="width: 100%; height: 100%; border: none; border-radius: 8px;"
          title="Reporte 606 PDF"
        ></iframe>
      </div>
    `,
    width: '90%',
    showCloseButton: true,
    showConfirmButton: true,
    confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
    confirmButtonColor: '#3085d6',
    didOpen: () => {
      // Cleanup del blob URL cuando se cierre el modal
      const closeButton = Swal.getCloseButton();
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          URL.revokeObjectURL(pdfUrl);
        });
      }
    },
    preConfirm: () => {
      // Descargar el PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `606_Compras_${periodo}.pdf`;
      link.click();
      return false; // Mantener el modal abierto
    }
  }).then((result) => {
    // Cleanup al cerrar
    URL.revokeObjectURL(pdfUrl);
  });
};

/************************************************************************/
const cargarTodasLasCompras = async () => {
  loading.value = true;
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'compras');
    const totalCompras = response?.length || 0;

    // Filtrar solo compras con NCF
    const comprasConNCF = (response || []).filter(compra =>
      compra.ncf_proveedor && compra.ncf_proveedor.trim() !== ''
    );

    comprasData.value = comprasConNCF.map((compra, index) => ({
      ...compra,
      linea: index + 1,
      montoFacturado: parseFloat(compra.total || 0),
      itbisFacturado: parseFloat(compra.impuesto || 0),
      servicios: 0,
      bienes: parseFloat(compra.subtotal || 0)
    }));

    console.log(`Total compras: ${totalCompras}, Con NCF: ${comprasConNCF.length}`);

    toast.add({
      severity: 'success',
      summary: 'Compras con NCF',
      detail: `${comprasData.value.length} compras con NCF cargadas (de ${totalCompras} totales)`,
      life: 4000
    });
  } catch (error) {
    console.error('Error al cargar todas las compras:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar compras',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
// Funciones auxiliares
const obtenerTipoNCF = (ncf) => {
  if (!ncf) return 'Sin NCF';
  const codigo = ncf.substring(0, 3);
  const tipos = {
    'B01': '01 - Gastos Menores',
    'B02': '02 - Gastos Personales',
    'B03': '03 - Crédito Fiscal',
    'B04': '04 - Nota de Crédito',
    'B14': '14 - Régimen Especial',
    'B15': '15 - Gubernamental',
    'B16': '16 - Exportaciones'
  };
  return tipos[codigo] || ncf.substring(0, 3);
};

const obtenerCodigoTipoNCF = (ncf) => {
  if (!ncf) return '';
  const codigo = ncf.substring(0, 3);
  return codigo.replace('B', '');
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
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Reporte 606 - Compras y Servicios</h1>
            <p class="text-gray-600 mt-1">Informe de Compras según normativa DGII</p>
          </div>
          <div class="flex gap-2">
            <Button
              label="Nueva Compra"
              icon="pi pi-plus"
              severity="primary"
              @click="router.push('/crearcompras')"
            />
            <Button
              label="Ver Todas"
              icon="pi pi-list"
              severity="secondary"
              @click="cargarTodasLasCompras"
              :loading="loading"
            />
            <Button
              label="Excel"
              icon="pi pi-file-excel"
              severity="success"
              @click="exportarExcel"
              :disabled="loading || comprasFiltradas.length === 0"
            />
            <Button
              label="TXT DGII"
              icon="pi pi-file"
              severity="info"
              @click="exportarTXT"
              :disabled="loading || comprasFiltradas.length === 0"
            />
            <Button
              label="PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              @click="exportarPDF"
              :disabled="loading || comprasFiltradas.length === 0"
            />
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <Card class="mb-6 shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-blue-600"></i>
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
              <label class="font-semibold text-sm text-gray-700">Tipo de NCF</label>
              <Dropdown
                v-model="tipoNCFFilter"
                :options="tiposNCF"
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
                placeholder="RNC, Proveedor, NCF..."
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
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Total Compras</p>
                <p class="text-2xl font-bold text-blue-600">{{ totalCompras }}</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-full">
                <i class="pi pi-shopping-cart text-blue-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Monto Total</p>
                <p class="text-2xl font-bold text-green-600">
                  RD$ {{ totalMonto.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </p>
              </div>
              <div class="bg-green-100 p-3 rounded-full">
                <i class="pi pi-dollar text-green-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">ITBIS Total</p>
                <p class="text-2xl font-bold text-orange-600">
                  RD$ {{ totalITBIS.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </p>
              </div>
              <div class="bg-orange-100 p-3 rounded-full">
                <i class="pi pi-percentage text-orange-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>

        <Card class="shadow-lg">
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm mb-1">Base Imponible</p>
                <p class="text-2xl font-bold text-purple-600">
                  RD$ {{ totalBase.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </p>
              </div>
              <div class="bg-purple-100 p-3 rounded-full">
                <i class="pi pi-calculator text-purple-600 text-2xl"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Tabla de Datos -->
      <Card class="shadow-lg">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-list text-purple-600"></i>
            <span>Detalle de Compras</span>
          </div>
        </template>
        <template #content>
          <DataTable
            :value="comprasFiltradas"
            :paginator="true"
            :rows="20"
            :loading="loading"
            stripedRows
            showGridlines
            responsiveLayout="scroll"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[10, 20, 50, 100]"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} compras"
          >
            <template #empty>
              <div class="text-center py-8">
                <i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i>
                <p class="text-gray-500">No se encontraron compras en el periodo seleccionado</p>
              </div>
            </template>

            <Column field="linea" header="#" :style="{ width: '60px' }"></Column>
            <Column field="fecha" header="Fecha" :style="{ minWidth: '100px' }">
              <template #body="slotProps">
                {{ formatearFecha(slotProps.data.fecha) }}
              </template>
            </Column>
            <Column field="rnc_proveedor" header="RNC" :style="{ minWidth: '120px' }"></Column>
            <Column field="proveedor" header="Proveedor" :style="{ minWidth: '200px' }"></Column>
            <Column field="ncf_proveedor" header="NCF" :style="{ minWidth: '150px' }"></Column>
            <Column field="ncf_proveedor" header="Tipo NCF" :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                {{ obtenerTipoNCF(slotProps.data.ncf_proveedor) }}
              </template>
            </Column>
            <Column field="no_factura" header="No. Factura" :style="{ minWidth: '120px' }"></Column>
            <Column field="subtotal" header="Base" :style="{ minWidth: '120px' }">
              <template #body="slotProps">
                <span class="font-semibold text-blue-700">
                  RD$ {{ parseFloat(slotProps.data.subtotal || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
              </template>
            </Column>
            <Column field="impuesto" header="ITBIS" :style="{ minWidth: '120px' }">
              <template #body="slotProps">
                <span class="font-semibold text-orange-700">
                  RD$ {{ parseFloat(slotProps.data.impuesto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
              </template>
            </Column>
            <Column field="total" header="Total" :style="{ minWidth: '120px' }">
              <template #body="slotProps">
                <span class="font-bold text-green-700">
                  RD$ {{ parseFloat(slotProps.data.total || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
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
