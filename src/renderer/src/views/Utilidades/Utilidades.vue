<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { peticionesFetchOffline, nfecha, envioElectron, encryptarPassword, transformarFechaTimestamp, agregarDiasalaFechaActual } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Chart from 'primevue/chart';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();
const loading = ref(false);

// Filtros
const fechaInicio = ref('');
const fechaFin = ref('');
const empresaFilter = ref('');

// Datos de utilidades
const datosUtilidades = ref({
  ingresos: 0,
  costoVentas: 0,
  utilidadBruta: 0,
  gastosOperativos: 0,
  utilidadOperativa: 0,
  otrosGastos: 0,
  utilidadNeta: 0,
  margenBruto: 0,
  margenOperativo: 0,
  margenNeto: 0
});

// Detalles
const detalleIngresos = ref([]);
const detalleGastos = ref([]);
const detalleCompras = ref([]);

// Gráficos
const chartData = ref(null);
const chartOptions = ref(null);

/************************************************************************/
// Configurar gráfico
const configurarGrafico = () => {
  chartData.value = {
    labels: ['Ingresos', 'Costo de Ventas', 'Gastos Operativos', 'Utilidad Neta'],
    datasets: [
      {
        label: 'Montos (RD$)',
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Verde brillante para Ingresos
          'rgba(239, 68, 68, 0.8)',    // Rojo para Costo de Ventas
          'rgba(251, 146, 60, 0.8)',   // Naranja para Gastos
          'rgba(59, 130, 246, 0.8)'    // Azul para Utilidad Neta
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(251, 146, 60)',
          'rgb(59, 130, 246)'
        ],
        borderWidth: 2,
        data: [
          datosUtilidades.value.ingresos,
          datosUtilidades.value.costoVentas,
          datosUtilidades.value.gastosOperativos,
          Math.abs(datosUtilidades.value.utilidadNeta)
        ]
      }
    ]
  };

  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#374151'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        callbacks: {
          label: function(context) {
            return 'RD$ ' + context.parsed.y.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11,
            weight: '500'
          },
          color: '#6B7280',
          callback: function(value) {
            return 'RD$ ' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            weight: 'bold'
          },
          color: '#374151'
        }
      }
    }
  };
};

/************************************************************************/
// Cargar datos de utilidades
const cargarDatos = async () => {
  loading.value = true;
  try {
    const fechaInicioFormato = `${fechaInicio.value} 00:00:00`;
    const fechaFinFormato = `${fechaFin.value} 23:59:59`;

    const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioFormato, fechaFinFormato);

    const facturas = response.facturas || [];
    const gastos = response.gastos || [];
    const compras = await peticionesFetchOffline('getDataAsArray', 'compras') || [];

    // Filtrar por empresa si está seleccionada
    const facturasEmpresa = empresaFilter.value
      ? facturas.filter(f => f.almacen === empresaFilter.value)
      : facturas;

    const gastosEmpresa = empresaFilter.value
      ? gastos.filter(g => g.almacen === empresaFilter.value)
      : gastos;

    // **CÁLCULO DE INGRESOS**
    const ingresos = facturasEmpresa.reduce((sum, f) => sum + (parseFloat(f.total) || 0), 0);

    // **CÁLCULO DE COSTO DE VENTAS**
    // El costo de ventas es el costo de los productos vendidos
    let costoVentas = 0;
    facturasEmpresa.forEach(factura => {
      try {
        const productos = JSON.parse(factura.productos || '[]');
        productos.forEach(prod => {
          const cantidad = parseFloat(prod.cantidad) || 0;
          const costo = parseFloat(prod.costo) || 0;
          costoVentas += cantidad * costo;
        });
      } catch (error) {
        console.warn('Error parseando productos de factura:', error);
      }
    });

    // **CÁLCULO DE GASTOS OPERATIVOS**
    const gastosOperativos = gastosEmpresa.reduce((sum, g) => sum + (parseFloat(g.cantidad) || 0), 0);

    // **CÁLCULO DE OTROS GASTOS (compras que no son inventario)**
    const comprasPeriodo = compras.filter(c => {
      const fechaCompra = new Date(c.created_at);
      const inicio = new Date(fechaInicioFormato);
      const fin = new Date(fechaFinFormato);
      return fechaCompra >= inicio && fechaCompra <= fin;
    });

    const comprasFiltradas = empresaFilter.value
      ? comprasPeriodo.filter(c => c.almacen === empresaFilter.value)
      : comprasPeriodo;

    const otrosGastos = comprasFiltradas.reduce((sum, c) => {
      const precio = parseFloat(c.precio) || 0;
      const cantidad = parseFloat(c.cantidad) || 1;
      return sum + (precio * cantidad);
    }, 0);

    // **CÁLCULOS DE UTILIDADES**
    const utilidadBruta = ingresos - costoVentas;
    const utilidadOperativa = utilidadBruta - gastosOperativos;
    const utilidadNeta = utilidadOperativa - otrosGastos;

    // **CÁLCULOS DE MÁRGENES**
    const margenBruto = ingresos > 0 ? (utilidadBruta / ingresos) * 100 : 0;
    const margenOperativo = ingresos > 0 ? (utilidadOperativa / ingresos) * 100 : 0;
    const margenNeto = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0;

    // Actualizar datos
    datosUtilidades.value = {
      ingresos,
      costoVentas,
      utilidadBruta,
      gastosOperativos,
      utilidadOperativa,
      otrosGastos,
      utilidadNeta,
      margenBruto,
      margenOperativo,
      margenNeto
    };

    // Detalles para las tablas
    detalleIngresos.value = facturasEmpresa.map(f => ({
      fecha: f.fecha,
      numero: f.numero,
      cliente: f.nombre,
      total: parseFloat(f.total) || 0
    }));

    detalleGastos.value = gastosEmpresa.map(g => ({
      fecha: g.fecha,
      concepto: g.concepto,
      descripcion: g.descripcion,
      cantidad: parseFloat(g.cantidad) || 0
    }));

    detalleCompras.value = comprasFiltradas.map(c => ({
      fecha: c.created_at?.split(' ')[0] || '',
      producto: c.producto,
      cantidad: parseFloat(c.cantidad) || 1,
      precio: parseFloat(c.precio) || 0,
      total: (parseFloat(c.cantidad) || 1) * (parseFloat(c.precio) || 0)
    }));

    configurarGrafico();

    toast.add({
      severity: 'success',
      summary: 'Datos Cargados',
      detail: 'Análisis de utilidades actualizado',
      life: 3000
    });

  } catch (error) {
    console.error('Error cargando datos:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los datos',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
// Exportar PDF
const exportarPDF = () => {
  if (datosUtilidades.value.ingresos === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Sin Datos',
      detail: 'Debe cargar los datos primero',
      life: 3000
    });
    return;
  }

  loading.value = true;

  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // **ENCABEZADO EJECUTIVO CON GRADIENTE**
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 20, pageWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('ANÁLISIS DE UTILIDADES', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const nombreEmpresa = empresaFilter.value || datosEmpresa?.empresa?.nombre || 'Todas las Empresas';
    doc.text(nombreEmpresa, pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Período: ${fechaInicio.value} - ${fechaFin.value}`, pageWidth / 2, 35, { align: 'center' });

    // **ESTADO DE RESULTADOS EN TABLA**
    const estadoResultadosRows = [
      [
        { content: 'Ingresos por Ventas', styles: { fontStyle: 'bold', textColor: [22, 163, 74] } },
        { content: `RD$ ${datosUtilidades.value.ingresos.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [22, 163, 74] } }
      ],
      [
        '(-) Costo de Ventas',
        { content: `RD$ ${datosUtilidades.value.costoVentas.toFixed(2)}`, styles: { textColor: [220, 38, 38] } }
      ],
      [
        { content: '(=) Utilidad Bruta', styles: { fontStyle: 'bold', fillColor: [219, 234, 254] } },
        { content: `RD$ ${datosUtilidades.value.utilidadBruta.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [219, 234, 254], textColor: [37, 99, 235] } }
      ],
      [
        '(-) Gastos Operativos',
        { content: `RD$ ${datosUtilidades.value.gastosOperativos.toFixed(2)}`, styles: { textColor: [220, 38, 38] } }
      ],
      [
        { content: '(=) Utilidad Operativa', styles: { fontStyle: 'bold', fillColor: [243, 232, 255] } },
        { content: `RD$ ${datosUtilidades.value.utilidadOperativa.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [243, 232, 255], textColor: [147, 51, 234] } }
      ],
      [
        '(-) Otros Gastos',
        { content: `RD$ ${datosUtilidades.value.otrosGastos.toFixed(2)}`, styles: { textColor: [220, 38, 38] } }
      ],
      [
        { content: '(=) UTILIDAD NETA', styles: { fontStyle: 'bold', fontSize: 11, fillColor: datosUtilidades.value.utilidadNeta >= 0 ? [220, 252, 231] : [254, 226, 226] } },
        {
          content: `RD$ ${datosUtilidades.value.utilidadNeta.toFixed(2)}`,
          styles: {
            fontStyle: 'bold',
            fontSize: 11,
            fillColor: datosUtilidades.value.utilidadNeta >= 0 ? [220, 252, 231] : [254, 226, 226],
            textColor: datosUtilidades.value.utilidadNeta >= 0 ? [22, 163, 74] : [220, 38, 38]
          }
        }
      ]
    ];

    doc.autoTable({
      startY: 50,
      body: estadoResultadosRows,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: 'normal' },
        1: { halign: 'right', cellWidth: 60 }
      },
      margin: { left: 14, right: 14 }
    });

    let finalY = doc.lastAutoTable.finalY + 15;

    // **MÁRGENES DE UTILIDAD**
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.setFont(undefined, 'bold');
    doc.text('MÁRGENES DE UTILIDAD', pageWidth / 2, finalY, { align: 'center' });

    finalY += 10;

    const margenesRows = [
      [
        'Margen Bruto',
        { content: `${datosUtilidades.value.margenBruto.toFixed(1)}%`, styles: { textColor: [22, 163, 74], fontStyle: 'bold' } }
      ],
      [
        'Margen Operativo',
        { content: `${datosUtilidades.value.margenOperativo.toFixed(1)}%`, styles: { textColor: [147, 51, 234], fontStyle: 'bold' } }
      ],
      [
        'Margen Neto',
        {
          content: `${datosUtilidades.value.margenNeto.toFixed(1)}%`,
          styles: {
            textColor: datosUtilidades.value.margenNeto >= 0 ? [22, 163, 74] : [220, 38, 38],
            fontStyle: 'bold'
          }
        }
      ]
    ];

    doc.autoTable({
      startY: finalY,
      head: [['Indicador', 'Porcentaje']],
      body: margenesRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: 'bold' },
        1: { halign: 'right', cellWidth: 60 }
      },
      margin: { left: 14, right: 14 }
    });

    // **RESUMEN DE DATOS**
    doc.addPage();

    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN DE DATOS', pageWidth / 2, 20, { align: 'center' });

    const resumenRows = [
      ['Total de Facturas', detalleIngresos.value.length.toString()],
      ['Total de Gastos Registrados', detalleGastos.value.length.toString()],
      ['Total de Compras', detalleCompras.value.length.toString()],
      ['Período Analizado', `${fechaInicio.value} al ${fechaFin.value}`]
    ];

    doc.autoTable({
      startY: 30,
      head: [['Concepto', 'Valor']],
      body: resumenRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { halign: 'right', cellWidth: 60 }
      },
      margin: { left: 14, right: 14 }
    });

    // Footer en todas las páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.setFontSize(7);
      doc.text('Documento Confidencial - Solo para uso interno', 14, pageHeight - 10);
      doc.text(`Generado: ${nfecha('fechaAmericana')} ${nfecha('horaAmericana')}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    // Generar blob y mostrar
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const nombreArchivo = `Utilidades_${fechaInicio.value}_${fechaFin.value}.pdf`;

    Swal.fire({
      title: '<strong>Análisis de Utilidades</strong>',
      html: `
        <div style="width: 100%; height: 75vh; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <embed
            src="${pdfUrl}"
            type="application/pdf"
            width="100%"
            height="100%"
            style="border: none;"
          />
        </div>
        <p style="margin-top: 15px; color: #6b7280; font-size: 14px;">
          <i class="pi pi-info-circle"></i> Puede descargar o imprimir el documento usando los botones de abajo
        </p>
      `,
      width: '95%',
      showCloseButton: true,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar',
      cancelButtonText: '<i class="pi pi-print"></i> Imprimir',
      confirmButtonColor: '#1e3a8a',
      cancelButtonColor: '#059669',
      reverseButtons: true,
      customClass: {
        confirmButton: 'swal-button-spacing',
        cancelButton: 'swal-button-spacing'
      },
      didOpen: () => {
        const style = document.createElement('style');
        style.innerHTML = `
          .swal-button-spacing {
            margin: 0 8px !important;
            padding: 12px 24px !important;
            font-weight: 600 !important;
            border-radius: 8px !important;
          }
        `;
        document.head.appendChild(style);
      },
      preConfirm: () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = nombreArchivo;
        link.click();
        return false;
      }
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    });

    toast.add({
      severity: 'success',
      summary: 'PDF Generado',
      detail: 'El reporte se generó correctamente',
      life: 3000
    });

  } catch (error) {
    console.error('Error exportando PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: `No se pudo generar el PDF: ${error.message}`,
      life: 5000
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');

    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(datosJSON.VITE_LINKURL + datosJSON.VITE_LINK_API);
    }

    // Fechas por defecto: último mes
    fechaInicio.value = transformarFechaTimestamp(agregarDiasalaFechaActual(-30), false);
    fechaFin.value = nfecha('fechaAmericana');

    await cargarDatos();

  } catch (error) {
    console.error('Error en onMounted:', error);
  }
});
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="bg-purple-100 text-purple-700 rounded-full p-3">
            <i class="pi pi-chart-pie text-2xl"></i>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Análisis de Utilidades</h1>
            <p class="text-gray-600">Reporte detallado de rentabilidad y márgenes</p>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-blue-600"></i>
            <span>Filtros</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Fecha Inicio</label>
              <DatePicker
                v-model="fechaInicio"
                dateFormat="yy-mm-dd"
                showIcon
                class="w-full"
              />
            </div>

            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Fecha Fin</label>
              <DatePicker
                v-model="fechaFin"
                dateFormat="yy-mm-dd"
                showIcon
                class="w-full"
              />
            </div>

            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Empresa (Opcional)</label>
              <InputText
                v-model="empresaFilter"
                placeholder="Filtrar por empresa..."
                class="w-full"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <Button
              label="Cargar Datos"
              icon="pi pi-refresh"
              @click="cargarDatos"
              :loading="loading"
            />
            <Button
              label="Exportar PDF"
              icon="pi pi-file-pdf"
              @click="exportarPDF"
              severity="danger"
              :disabled="datosUtilidades.ingresos === 0"
            />
          </div>
        </template>
      </Card>

      <!-- Cards de Utilidades -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Ingresos -->
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-dollar text-2xl text-green-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Ingresos</p>
                <p class="text-xl font-bold text-green-600">RD$ {{ datosUtilidades.ingresos.toFixed(2) }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Utilidad Bruta -->
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-chart-bar text-2xl text-blue-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Utilidad Bruta</p>
                <p class="text-xl font-bold text-blue-600">RD$ {{ datosUtilidades.utilidadBruta.toFixed(2) }}</p>
                <p class="text-xs text-gray-500">Margen: {{ datosUtilidades.margenBruto.toFixed(1) }}%</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Utilidad Operativa -->
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-chart-line text-2xl text-purple-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Utilidad Operativa</p>
                <p class="text-xl font-bold text-purple-600">RD$ {{ datosUtilidades.utilidadOperativa.toFixed(2) }}</p>
                <p class="text-xs text-gray-500">Margen: {{ datosUtilidades.margenOperativo.toFixed(1) }}%</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Utilidad Neta -->
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div
                :class="[
                  'w-12 h-12 rounded-lg flex items-center justify-center',
                  datosUtilidades.utilidadNeta >= 0 ? 'bg-cyan-100' : 'bg-red-100'
                ]"
              >
                <i
                  :class="[
                    'pi text-2xl',
                    datosUtilidades.utilidadNeta >= 0 ? 'pi-check-circle text-cyan-600' : 'pi-times-circle text-red-600'
                  ]"
                ></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Utilidad Neta</p>
                <p
                  :class="[
                    'text-xl font-bold',
                    datosUtilidades.utilidadNeta >= 0 ? 'text-cyan-600' : 'text-red-600'
                  ]"
                >
                  RD$ {{ datosUtilidades.utilidadNeta.toFixed(2) }}
                </p>
                <p class="text-xs text-gray-500">Margen: {{ datosUtilidades.margenNeto.toFixed(1) }}%</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Estado de Resultados -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-list text-blue-600"></i>
            <span>Estado de Resultados</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-green-50 rounded">
              <span class="font-semibold text-gray-700">Ingresos por Ventas</span>
              <span class="font-bold text-green-600">RD$ {{ datosUtilidades.ingresos.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center p-3 pl-8">
              <span class="text-gray-600">(-) Costo de Ventas</span>
              <span class="text-red-600">RD$ {{ datosUtilidades.costoVentas.toFixed(2) }}</span>
            </div>

            <Divider />

            <div class="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span class="font-semibold text-gray-700">(=) Utilidad Bruta</span>
              <span class="font-bold text-blue-600">RD$ {{ datosUtilidades.utilidadBruta.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center p-3 pl-8">
              <span class="text-gray-600">(-) Gastos Operativos</span>
              <span class="text-red-600">RD$ {{ datosUtilidades.gastosOperativos.toFixed(2) }}</span>
            </div>

            <Divider />

            <div class="flex justify-between items-center p-3 bg-purple-50 rounded">
              <span class="font-semibold text-gray-700">(=) Utilidad Operativa</span>
              <span class="font-bold text-purple-600">RD$ {{ datosUtilidades.utilidadOperativa.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between items-center p-3 pl-8">
              <span class="text-gray-600">(-) Otros Gastos</span>
              <span class="text-red-600">RD$ {{ datosUtilidades.otrosGastos.toFixed(2) }}</span>
            </div>

            <Divider />

            <div
              :class="[
                'flex justify-between items-center p-4 rounded',
                datosUtilidades.utilidadNeta >= 0 ? 'bg-cyan-50' : 'bg-red-50'
              ]"
            >
              <span class="font-bold text-gray-800 text-lg">(=) UTILIDAD NETA</span>
              <span
                :class="[
                  'font-bold text-xl',
                  datosUtilidades.utilidadNeta >= 0 ? 'text-cyan-600' : 'text-red-600'
                ]"
              >
                RD$ {{ datosUtilidades.utilidadNeta.toFixed(2) }}
              </span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Gráfico -->
      <Card class="mb-6" v-if="chartData">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar text-purple-600"></i>
            <span>Visualización</span>
          </div>
        </template>
        <template #content>
          <Chart type="bar" :data="chartData" :options="chartOptions" style="height: 300px" />
        </template>
      </Card>

      <!-- Detalles en Tabs -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-table text-gray-600"></i>
            <span>Detalles</span>
          </div>
        </template>
        <template #content>
          <TabView>
            <!-- Tab Ingresos -->
            <TabPanel header="Ingresos">
              <DataTable
                :value="detalleIngresos"
                :rows="10"
                :paginator="detalleIngresos.length > 10"
                class="text-sm"
              >
                <Column field="fecha" header="Fecha" sortable></Column>
                <Column field="numero" header="Número" sortable></Column>
                <Column field="cliente" header="Cliente"></Column>
                <Column field="total" header="Total" sortable style="text-align: right">
                  <template #body="{ data }">
                    <span class="text-green-600 font-semibold">RD$ {{ data.total.toFixed(2) }}</span>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <!-- Tab Gastos -->
            <TabPanel header="Gastos Operativos">
              <DataTable
                :value="detalleGastos"
                :rows="10"
                :paginator="detalleGastos.length > 10"
                class="text-sm"
              >
                <Column field="fecha" header="Fecha" sortable></Column>
                <Column field="concepto" header="Concepto"></Column>
                <Column field="descripcion" header="Descripción"></Column>
                <Column field="cantidad" header="Monto" sortable style="text-align: right">
                  <template #body="{ data }">
                    <span class="text-red-600 font-semibold">RD$ {{ data.cantidad.toFixed(2) }}</span>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <!-- Tab Compras/Otros Gastos -->
            <TabPanel header="Otros Gastos">
              <DataTable
                :value="detalleCompras"
                :rows="10"
                :paginator="detalleCompras.length > 10"
                class="text-sm"
              >
                <Column field="fecha" header="Fecha" sortable></Column>
                <Column field="producto" header="Producto"></Column>
                <Column field="cantidad" header="Cantidad" sortable style="text-align: center"></Column>
                <Column field="precio" header="Precio Unit." style="text-align: right">
                  <template #body="{ data }">
                    RD$ {{ data.precio.toFixed(2) }}
                  </template>
                </Column>
                <Column field="total" header="Total" sortable style="text-align: right">
                  <template #body="{ data }">
                    <span class="text-orange-600 font-semibold">RD$ {{ data.total.toFixed(2) }}</span>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>
          </TabView>
        </template>
      </Card>
    </div>
  </main>

  <Toast />
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}
</style>
