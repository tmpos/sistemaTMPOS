<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from "primevue/usetoast";
import { envioElectron, peticionesFetchOffline, nfecha } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

document.body.classList.add('sidebar-close');

/************************************************************************/
// Filtros
const fechaInicio = ref('');
const fechaFin = ref('');
const loading = ref(false);

/************************************************************************/
// Datos del reporte
const ingresos = ref([]);
const costos = ref([]);
const gastos = ref([]);
const otrosIngresos = ref([]);
const otrosGastos = ref([]);

/************************************************************************/
// Cálculos
const totalIngresos = computed(() => {
  return ingresos.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const totalCostos = computed(() => {
  return costos.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const utilidadBruta = computed(() => {
  return totalIngresos.value - totalCostos.value;
});

const totalGastos = computed(() => {
  return gastos.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const utilidadOperativa = computed(() => {
  return utilidadBruta.value - totalGastos.value;
});

const totalOtrosIngresos = computed(() => {
  return otrosIngresos.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const totalOtrosGastos = computed(() => {
  return otrosGastos.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const utilidadNeta = computed(() => {
  return utilidadOperativa.value + totalOtrosIngresos.value - totalOtrosGastos.value;
});

/************************************************************************/
// Funciones para cargar datos
const cargarDatosReporte = async () => {
  try {
    if (!fechaInicio.value || !fechaFin.value) {
      return;
    }

    // Convertir fechas al formato correcto
    const fechaInicioFormato = fechaInicio.value + ' 00:01:00';
    const fechaFinFormato = fechaFin.value + ' 23:59:59';

    // Obtener todos los datos del período
    const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioFormato, fechaFinFormato);

    if (!response || typeof response !== 'object') {
      console.warn('No se recibieron datos del servidor');
      return;
    }

    console.log('Respuesta datosVentasPorRango:', response);

    // Filtrar por almacén/empresa si es necesario
    const nombreEmpresa = datosEmpresa.empresa.nombre;

    // Calcular ingresos (ventas/facturas)
    const facturas = response.facturas || [];
    const facturasEmpresa = nombreEmpresa
      ? facturas.filter(f => f.almacen === nombreEmpresa)
      : facturas;

    const totalVentas = facturasEmpresa
      .map(factura => Number(factura.total || 0))
      .reduce((acc, total) => acc + total, 0);

    const totalGanancias = facturasEmpresa
      .map(factura => Number(factura.ganancia || 0))
      .reduce((acc, total) => acc + total, 0);

    ingresos.value = [
      { concepto: 'Ventas', monto: totalVentas.toFixed(2) }
    ];

    // Calcular costos (usamos el costo implícito: ventas - ganancias)
    const totalCostoVentas = totalVentas - totalGanancias;

    costos.value = [
      { concepto: 'Costo de ventas', monto: totalCostoVentas.toFixed(2) }
    ];

    // Calcular gastos operativos
    const gastosData = response.gastos || [];
    const gastosEmpresa = nombreEmpresa
      ? gastosData.filter(g => g.almacen === nombreEmpresa)
      : gastosData;

    // Agrupar gastos por tipo
    const gastosAgrupados = {};
    gastosEmpresa.forEach(g => {
      const tipo = g.tipo || 'Otros gastos operativos';
      if (!gastosAgrupados[tipo]) {
        gastosAgrupados[tipo] = 0;
      }
      gastosAgrupados[tipo] += parseFloat(g.cantidad || g.monto || 0);
    });

    gastos.value = Object.entries(gastosAgrupados).map(([concepto, monto]) => ({
      concepto,
      monto: monto.toFixed(2)
    }));

    // Otros ingresos y gastos (por ahora vacíos, se pueden agregar después)
    otrosIngresos.value = [];
    otrosGastos.value = [];

  } catch (error) {
    console.error('Error al cargar datos del reporte:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos del reporte', life: 3000 });
    // Inicializar con arrays vacíos
    ingresos.value = [];
    costos.value = [];
    gastos.value = [];
    otrosIngresos.value = [];
    otrosGastos.value = [];
  }
};

/************************************************************************/
const generarReporte = async () => {
  if (!fechaInicio.value || !fechaFin.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Selecciona el período del reporte', life: 3000 });
    return;
  }

  loading.value = true;
  try {
    await cargarDatosReporte();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado correctamente', life: 3000 });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el reporte', life: 3000 });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
const imprimirReporte = () => {
  window.print();
};

/************************************************************************/
const generarPDFProfesional = async () => {
  if (!fechaInicio.value || !fechaFin.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Primero genera el reporte', life: 3000 });
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Colores corporativos
    const colorPrimario = [30, 58, 138]; // Azul oscuro
    const colorSecundario = [59, 130, 246]; // Azul
    const colorExito = [16, 185, 129]; // Verde
    const colorPeligro = [239, 68, 68]; // Rojo
    const colorGris = [107, 114, 128];
    const colorGrisClaro = [243, 244, 246];

    let yPosition = margin;

    // ============================================================================
    // HEADER - Banda superior con gradiente
    // ============================================================================
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(datosEmpresa.empresa.nombre || 'EMPRESA', margin, 15);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTADO DE RESULTADOS', margin, 25);

    // Línea decorativa
    doc.setDrawColor(...colorSecundario);
    doc.setLineWidth(0.5);
    doc.line(margin, 30, pageWidth - margin, 30);

    yPosition = 45;

    // ============================================================================
    // INFORMACIÓN DEL PERÍODO
    // ============================================================================
    doc.setFillColor(...colorGrisClaro);
    doc.roundedRect(margin, yPosition, contentWidth, 18, 2, 2, 'F');

    doc.setTextColor(...colorPrimario);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Período del Reporte:', margin + 5, yPosition + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const fechaInicioFormat = new Date(fechaInicio.value).toLocaleDateString('es-DO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const fechaFinFormat = new Date(fechaFin.value).toLocaleDateString('es-DO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Del ${fechaInicioFormat} al ${fechaFinFormat}`, margin + 5, yPosition + 13);

    yPosition += 25;

    // ============================================================================
    // FUNCIÓN PARA CREAR SECCIONES
    // ============================================================================
    const crearSeccion = (titulo, items, colorTitulo = colorPrimario) => {
      // Título de sección
      doc.setFillColor(...colorTitulo);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, margin + 3, yPosition + 5.5);

      yPosition += 10;

      // Items de la sección
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      items.forEach((item, index) => {
        // Fondo alternado
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPosition, contentWidth, 6, 'F');
        }

        doc.text(item.concepto, margin + 5, yPosition + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
                 pageWidth - margin - 5, yPosition + 4, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        yPosition += 6;
      });

      yPosition += 2;
    };

    const crearTotal = (titulo, valor, esNegativo = false, tamano = 'normal') => {
      const altura = tamano === 'grande' ? 10 : 8;
      const fontSize = tamano === 'grande' ? 12 : 11;

      doc.setFillColor(...colorGrisClaro);
      doc.roundedRect(margin, yPosition, contentWidth, altura, 1, 1, 'F');

      doc.setDrawColor(...colorGris);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPosition, contentWidth, altura, 1, 1, 'S');

      doc.setTextColor(...colorPrimario);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, margin + 5, yPosition + (altura / 2) + 1.5);

      const montoTexto = `$${valor.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
      if (esNegativo) {
        doc.setTextColor(...colorPeligro);
      }
      doc.text(montoTexto, pageWidth - margin - 5, yPosition + (altura / 2) + 1.5, { align: 'right' });

      yPosition += altura + 3;
    };

    const crearUtilidad = (titulo, valor, tipo = 'normal') => {
      const altura = tipo === 'final' ? 14 : 10;
      const fontSize = tipo === 'final' ? 14 : 12;

      let colorFondo, colorTexto;

      if (tipo === 'final') {
        colorFondo = valor >= 0 ? [220, 252, 231] : [254, 226, 226]; // Verde claro o rojo claro
        colorTexto = valor >= 0 ? [22, 163, 74] : [220, 38, 38]; // Verde o rojo
      } else {
        colorFondo = valor >= 0 ? [239, 246, 255] : [254, 242, 242];
        colorTexto = valor >= 0 ? [37, 99, 235] : [220, 38, 38];
      }

      doc.setFillColor(...colorFondo);
      doc.roundedRect(margin, yPosition, contentWidth, altura, 2, 2, 'F');

      doc.setDrawColor(...colorTexto);
      doc.setLineWidth(tipo === 'final' ? 1 : 0.5);
      doc.roundedRect(margin, yPosition, contentWidth, altura, 2, 2, 'S');

      doc.setTextColor(...colorTexto);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, margin + 5, yPosition + (altura / 2) + 1.5);

      const montoTexto = `$${valor.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
      doc.text(montoTexto, pageWidth - margin - 5, yPosition + (altura / 2) + 1.5, { align: 'right' });

      yPosition += altura + 5;
    };

    // ============================================================================
    // CONTENIDO DEL REPORTE
    // ============================================================================

    // Verificar si hay espacio, sino nueva página
    const verificarEspacio = (espacioNecesario) => {
      if (yPosition + espacioNecesario > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // INGRESOS
    if (ingresos.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('INGRESOS', ingresos.value, colorSecundario);
      crearTotal('Total Ingresos', totalIngresos.value);
    }

    // COSTO DE VENTAS
    if (costos.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('COSTO DE VENTAS', costos.value, [239, 68, 68]);
      crearTotal('Total Costo de Ventas', totalCostos.value, true);
    }

    // UTILIDAD BRUTA
    verificarEspacio(15);
    crearUtilidad('UTILIDAD BRUTA', utilidadBruta.value);

    // GASTOS OPERATIVOS
    if (gastos.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('GASTOS OPERATIVOS', gastos.value, [245, 158, 11]);
      crearTotal('Total Gastos Operativos', totalGastos.value, true);
    }

    // UTILIDAD OPERATIVA
    verificarEspacio(15);
    crearUtilidad('UTILIDAD OPERATIVA', utilidadOperativa.value);

    // OTROS INGRESOS
    if (otrosIngresos.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('OTROS INGRESOS', otrosIngresos.value, [34, 197, 94]);
      crearTotal('Total Otros Ingresos', totalOtrosIngresos.value);
    }

    // OTROS GASTOS
    if (otrosGastos.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('OTROS GASTOS', otrosGastos.value, [239, 68, 68]);
      crearTotal('Total Otros Gastos', totalOtrosGastos.value, true);
    }

    // UTILIDAD NETA (DESTACADA)
    verificarEspacio(20);
    crearUtilidad('UTILIDAD NETA', utilidadNeta.value, 'final');

    // ============================================================================
    // FOOTER
    // ============================================================================
    const footerY = pageHeight - 15;
    doc.setDrawColor(...colorSecundario);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setTextColor(...colorGris);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado el ${new Date().toLocaleDateString('es-DO', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`, margin, footerY);

    doc.text('Documento confidencial - Para uso exclusivo de la Junta Directiva',
             pageWidth - margin, footerY, { align: 'right' });

    // ============================================================================
    // MOSTRAR PDF EN SWAL
    // ============================================================================
    const pdfDataUri = doc.output('datauristring');

    await Swal.fire({
      title: '<strong>Estado de Resultados</strong>',
      html: `
        <div style="text-align: left; margin-bottom: 15px;">
          <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
            <i class="pi pi-calendar" style="margin-right: 5px;"></i>
            <strong>Período:</strong> ${fechaInicioFormat} - ${fechaFinFormat}
          </p>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
            <i class="pi pi-building" style="margin-right: 5px;"></i>
            <strong>Empresa:</strong> ${datosEmpresa.empresa.nombre || 'N/A'}
          </p>
        </div>
        <embed src="${pdfDataUri}#toolbar=0&navpanes=0&scrollbar=1"
               type="application/pdf"
               width="100%"
               height="600px"
               style="border-radius: 8px; border: 1px solid #e2e8f0;" />
      `,
      width: '90%',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
      denyButtonText: '<i class="pi pi-print"></i> Imprimir',
      cancelButtonText: '<i class="pi pi-times"></i> Cerrar',
      confirmButtonColor: '#3b82f6',
      denyButtonColor: '#8b5cf6',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'swal-pdf-popup',
        confirmButton: 'swal-pdf-button',
        denyButton: 'swal-pdf-button',
        cancelButton: 'swal-pdf-button'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Descargar PDF
        const nombreArchivo = `Estado_Resultados_${fechaInicio.value}_${fechaFin.value}.pdf`;
        doc.save(nombreArchivo);
        toast.add({
          severity: 'success',
          summary: 'Descargado',
          detail: 'PDF descargado correctamente',
          life: 3000
        });
      } else if (result.isDenied) {
        // Imprimir PDF
        const blobUrl = doc.output('bloburl');
        const printWindow = window.open(blobUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        toast.add({
          severity: 'info',
          summary: 'Imprimiendo',
          detail: 'Abriendo ventana de impresión',
          life: 3000
        });
      }
    });

  } catch (error) {
    console.error('Error al generar PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al generar el PDF profesional',
      life: 3000
    });
  }
};

/************************************************************************/
onMounted(async() => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(datosJSON.VITE_LINKURL + datosJSON.VITE_LINK_API);
    }

    // Establecer fechas por defecto (primer y último día del mes actual)
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    fechaInicio.value = primerDia.toISOString().split('T')[0];
    fechaFin.value = ultimoDia.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error al inicializar:', error);
  }
});
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen no-print">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Estado de Resultados</h1>
        <p class="text-gray-600 mt-1">Estado de pérdidas y ganancias</p>
      </div>

      <!-- Filtros -->
      <Card class="shadow-lg mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-blue-600"></i>
            <span>Filtros de Período</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <input
                v-model="fechaInicio"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <input
                v-model="fechaFin"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div class="flex items-end">
              <Button
                label="Generar Reporte"
                icon="pi pi-chart-line"
                severity="primary"
                @click="generarReporte"
                :loading="loading"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Reporte -->
      <div id="reporte-impresion">
        <!-- Header de impresión -->
        <div class="print-only text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">{{ datosEmpresa.empresa.nombre || 'Empresa' }}</h1>
          <h2 class="text-xl font-semibold text-gray-700 mt-2">Estado de Resultados</h2>
          <p class="text-gray-600 mt-1">Del {{ fechaInicio }} al {{ fechaFin }}</p>
        </div>

        <Card class="shadow-lg">
          <template #content>
            <div class="estado-resultados">
              <!-- Ingresos -->
              <div class="seccion">
                <h3 class="seccion-titulo">INGRESOS</h3>
                <div v-for="(item, index) in ingresos" :key="'ingreso-' + index" class="linea-item">
                  <span class="concepto">{{ item.concepto }}</span>
                  <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="linea-total">
                  <span class="concepto-total">Total Ingresos</span>
                  <span class="monto-total">${{ totalIngresos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>

              <!-- Costos de Ventas -->
              <div class="seccion">
                <h3 class="seccion-titulo">COSTO DE VENTAS</h3>
                <div v-for="(item, index) in costos" :key="'costo-' + index" class="linea-item">
                  <span class="concepto">{{ item.concepto }}</span>
                  <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="linea-total">
                  <span class="concepto-total">Total Costo de Ventas</span>
                  <span class="monto-total">({{ totalCostos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }})</span>
                </div>
              </div>

              <!-- Utilidad Bruta -->
              <div class="linea-resultado bruta">
                <span class="concepto-resultado">UTILIDAD BRUTA</span>
                <span class="monto-resultado" :class="{ 'text-green-600': utilidadBruta >= 0, 'text-red-600': utilidadBruta < 0 }">
                  ${{ utilidadBruta.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
              </div>

              <!-- Gastos Operativos -->
              <div class="seccion">
                <h3 class="seccion-titulo">GASTOS OPERATIVOS</h3>
                <div v-for="(item, index) in gastos" :key="'gasto-' + index" class="linea-item">
                  <span class="concepto">{{ item.concepto }}</span>
                  <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="linea-total">
                  <span class="concepto-total">Total Gastos Operativos</span>
                  <span class="monto-total">({{ totalGastos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }})</span>
                </div>
              </div>

              <!-- Utilidad Operativa -->
              <div class="linea-resultado operativa">
                <span class="concepto-resultado">UTILIDAD OPERATIVA</span>
                <span class="monto-resultado" :class="{ 'text-green-600': utilidadOperativa >= 0, 'text-red-600': utilidadOperativa < 0 }">
                  ${{ utilidadOperativa.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
              </div>

              <!-- Otros Ingresos -->
              <div v-if="otrosIngresos.length > 0" class="seccion">
                <h3 class="seccion-titulo">OTROS INGRESOS</h3>
                <div v-for="(item, index) in otrosIngresos" :key="'otro-ingreso-' + index" class="linea-item">
                  <span class="concepto">{{ item.concepto }}</span>
                  <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="linea-total">
                  <span class="concepto-total">Total Otros Ingresos</span>
                  <span class="monto-total">${{ totalOtrosIngresos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>

              <!-- Otros Gastos -->
              <div v-if="otrosGastos.length > 0" class="seccion">
                <h3 class="seccion-titulo">OTROS GASTOS</h3>
                <div v-for="(item, index) in otrosGastos" :key="'otro-gasto-' + index" class="linea-item">
                  <span class="concepto">{{ item.concepto }}</span>
                  <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="linea-total">
                  <span class="concepto-total">Total Otros Gastos</span>
                  <span class="monto-total">({{ totalOtrosGastos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }})</span>
                </div>
              </div>

              <!-- Utilidad Neta -->
              <div class="linea-resultado neta">
                <span class="concepto-resultado">UTILIDAD NETA</span>
                <span class="monto-resultado" :class="{ 'text-green-600': utilidadNeta >= 0, 'text-red-600': utilidadNeta < 0 }">
                  ${{ utilidadNeta.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
              </div>

              <!-- Acciones -->
              <div class="mt-6 flex justify-end gap-3 no-print">
                <Button
                  label="PDF Ejecutivo"
                  icon="pi pi-file-pdf"
                  severity="danger"
                  @click="generarPDFProfesional"
                  class="pdf-button"
                />
                <Button
                  label="Imprimir"
                  icon="pi pi-print"
                  severity="secondary"
                  outlined
                  @click="imprimirReporte"
                />
                <router-link to="/contabilidad">
                  <Button label="Volver" icon="pi pi-arrow-left" severity="info" outlined />
                </router-link>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}

.estado-resultados {
  max-width: 800px;
  margin: 0 auto;
}

.seccion {
  margin-bottom: 24px;
}

.seccion-titulo {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #3b82f6;
}

.linea-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.concepto {
  color: #374151;
  font-size: 0.95rem;
}

.monto {
  font-weight: 600;
  color: #1f2937;
  font-family: 'Courier New', monospace;
}

.linea-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  margin-top: 8px;
  border-top: 2px solid #9ca3af;
  border-bottom: 2px solid #9ca3af;
}

.concepto-total {
  font-weight: 700;
  color: #1f2937;
  font-size: 1rem;
}

.monto-total {
  font-weight: 700;
  color: #1f2937;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
}

.linea-resultado {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  margin: 20px 0;
  border-radius: 8px;
  font-size: 1.1rem;
}

.linea-resultado.bruta {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid #3b82f6;
}

.linea-resultado.operativa {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
}

.linea-resultado.neta {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 3px solid #10b981;
  font-size: 1.3rem;
  font-weight: 800;
}

.concepto-resultado {
  font-weight: 700;
  color: #1f2937;
}

.monto-resultado {
  font-weight: 800;
  font-family: 'Courier New', monospace;
}

/* Estilos de impresión */
@media print {
  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  .content-wrapper {
    background: white !important;
  }

  .estado-resultados {
    max-width: 100%;
  }

  .linea-resultado.bruta,
  .linea-resultado.operativa,
  .linea-resultado.neta {
    background: white !important;
    border: 2px solid #000 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .seccion-titulo {
    color: #000 !important;
    border-bottom-color: #000 !important;
  }
}

@media screen {
  .print-only {
    display: none;
  }
}

/* Estilos para el botón PDF */
.pdf-button {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
  border: none !important;
  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3), 0 2px 4px -1px rgba(220, 38, 38, 0.2) !important;
  transition: all 0.3s ease !important;
}

.pdf-button:hover {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
  box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.4), 0 4px 6px -2px rgba(220, 38, 38, 0.3) !important;
  transform: translateY(-2px) !important;
}

/* Estilos para el SweetAlert del PDF */
:deep(.swal-pdf-popup) {
  border-radius: 16px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}

:deep(.swal-pdf-button) {
  border-radius: 8px !important;
  padding: 10px 20px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
}

:deep(.swal-pdf-button:hover) {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

:deep(.swal2-html-container) {
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.swal2-title) {
  color: #1e293b !important;
  font-size: 1.5rem !important;
  padding: 1rem 0 0.5rem 0 !important;
}
</style>
