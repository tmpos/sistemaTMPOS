<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { peticionesFetchOffline, nfecha, envioElectron, encryptarPassword } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();
const loading = ref(false);
const token = ref(null);
const tokenCifrado = ref(null);

// Datos del cierre
const anioFiscal = ref(new Date().getFullYear());
const fechaCierre = ref(nfecha('fechaAmericana'));
const cierresAnteriores = ref([]);
const resumenCuentas = ref({
  ingresos: [],
  gastos: [],
  totalIngresos: 0,
  totalGastos: 0,
  utilidadPerdida: 0
});

// Estados del proceso
const pasoActual = ref(1);
const cierreEnProceso = ref(false);

/************************************************************************/
// Verificar si el año ya fue cerrado
const anioCerrado = computed(() => {
  return cierresAnteriores.value.some(cierre => {
    const anioCierre = new Date(cierre.fecha_cierre).getFullYear();
    return anioCierre === anioFiscal.value;
  });
});

/************************************************************************/
// Cargar cierres anteriores
const cargarCierresAnteriores = async () => {
  try {
    const cierres = await peticionesFetchOffline('getDataAsArray', 'cierres_fiscales');
    cierresAnteriores.value = (cierres || []).sort((a, b) =>
      new Date(b.fecha_cierre) - new Date(a.fecha_cierre)
    );
  } catch (error) {
    console.error('Error cargando cierres anteriores:', error);
  }
};

/************************************************************************/
// Obtener datos del año fiscal
const obtenerDatosAnioFiscal = async () => {
  loading.value = true;
  try {
    const fechaInicio = `${anioFiscal.value}-01-01 00:00:00`;
    const fechaFin = `${anioFiscal.value}-12-31 23:59:59`;

    // Obtener datos de ventas/ingresos y gastos
    const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicio, fechaFin);

    const facturas = response.facturas || [];
    const gastos = response.gastos || [];

    // Calcular ingresos
    const ingresosPorCategoria = {};
    facturas.forEach(factura => {
      const total = parseFloat(factura.total) || 0;
      const categoria = 'Ventas';

      if (!ingresosPorCategoria[categoria]) {
        ingresosPorCategoria[categoria] = 0;
      }
      ingresosPorCategoria[categoria] += total;
    });

    // Calcular gastos
    const gastosPorCategoria = {};
    gastos.forEach(gasto => {
      const cantidad = parseFloat(gasto.cantidad) || 0;
      const categoria = gasto.concepto || 'Otros Gastos';

      if (!gastosPorCategoria[categoria]) {
        gastosPorCategoria[categoria] = 0;
      }
      gastosPorCategoria[categoria] += cantidad;
    });

    // Estructurar datos
    const ingresosArray = Object.entries(ingresosPorCategoria).map(([cuenta, monto]) => ({
      cuenta,
      monto
    }));

    const gastosArray = Object.entries(gastosPorCategoria).map(([cuenta, monto]) => ({
      cuenta,
      monto
    }));

    const totalIngresos = ingresosArray.reduce((sum, item) => sum + item.monto, 0);
    const totalGastos = gastosArray.reduce((sum, item) => sum + item.monto, 0);

    resumenCuentas.value = {
      ingresos: ingresosArray,
      gastos: gastosArray,
      totalIngresos,
      totalGastos,
      utilidadPerdida: totalIngresos - totalGastos
    };

    pasoActual.value = 2;

    toast.add({
      severity: 'success',
      summary: 'Datos Obtenidos',
      detail: `Se cargaron los datos del año ${anioFiscal.value}`,
      life: 3000
    });

  } catch (error) {
    console.error('Error obteniendo datos del año fiscal:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron obtener los datos del año fiscal',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
// Ejecutar cierre fiscal
const ejecutarCierre = async () => {
  const confirmacion = await Swal.fire({
    title: '⚠️ Confirmación de Cierre Fiscal',
    html: `
      <div style="text-align: left; padding: 20px;">
        <p style="font-size: 16px; margin-bottom: 15px;">
          Está a punto de realizar el <strong>cierre del año fiscal ${anioFiscal.value}</strong>.
        </p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <strong>⚠️ Advertencia:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Este proceso cerrará todas las cuentas de resultados</li>
            <li>Se transferirá la utilidad/pérdida a patrimonio</li>
            <li>Esta operación <strong>NO se puede deshacer</strong></li>
          </ul>
        </div>
        <p><strong>Resumen:</strong></p>
        <p>✓ Total Ingresos: <span style="color: #059669;">RD$ ${resumenCuentas.value.totalIngresos.toFixed(2)}</span></p>
        <p>✓ Total Gastos: <span style="color: #dc2626;">RD$ ${resumenCuentas.value.totalGastos.toFixed(2)}</span></p>
        <p>✓ ${resumenCuentas.value.utilidadPerdida >= 0 ? 'Utilidad' : 'Pérdida'}:
          <span style="color: ${resumenCuentas.value.utilidadPerdida >= 0 ? '#059669' : '#dc2626'}; font-weight: bold;">
            RD$ ${Math.abs(resumenCuentas.value.utilidadPerdida).toFixed(2)}
          </span>
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, Ejecutar Cierre',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    width: '600px'
  });

  if (!confirmacion.isConfirmed) return;

  loading.value = true;
  cierreEnProceso.value = true;

  try {
    // Crear registro del cierre fiscal
    const datosCierre = {
      anio_fiscal: anioFiscal.value,
      fecha_cierre: fechaCierre.value,
      total_ingresos: resumenCuentas.value.totalIngresos,
      total_gastos: resumenCuentas.value.totalGastos,
      utilidad_perdida: resumenCuentas.value.utilidadPerdida,
      tipo_resultado: resumenCuentas.value.utilidadPerdida >= 0 ? 'Utilidad' : 'Pérdida',
      detalle_ingresos: JSON.stringify(resumenCuentas.value.ingresos),
      detalle_gastos: JSON.stringify(resumenCuentas.value.gastos),
      usuario: JSON.parse(window.localStorage.getItem('usuarioLocal'))?.[0]?.email || 'Sistema',
      estado: 'Cerrado'
    };

    // Guardar el cierre
    const response = await peticionesFetchOffline('insertData', 'cierres_fiscales', JSON.stringify(datosCierre));

    if (response[0] === 'ok') {
      pasoActual.value = 3;

      await Swal.fire({
        title: '✅ Cierre Completado',
        html: `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; color: #059669; margin-bottom: 20px;">
              ✓
            </div>
            <p style="font-size: 18px; margin-bottom: 15px;">
              El cierre del año fiscal <strong>${anioFiscal.value}</strong> se completó exitosamente.
            </p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 5px 0;">
                ${resumenCuentas.value.utilidadPerdida >= 0 ? 'Utilidad' : 'Pérdida'} del ejercicio:
                <strong style="color: ${resumenCuentas.value.utilidadPerdida >= 0 ? '#059669' : '#dc2626'};">
                  RD$ ${Math.abs(resumenCuentas.value.utilidadPerdida).toFixed(2)}
                </strong>
              </p>
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Generar Reporte',
        confirmButtonColor: '#059669'
      }).then((result) => {
        if (result.isConfirmed) {
          generarReporteCierre();
        }
      });

      await cargarCierresAnteriores();
    } else {
      throw new Error('Error al guardar el cierre');
    }

  } catch (error) {
    console.error('Error ejecutando cierre:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo completar el cierre fiscal',
      life: 3000
    });
  } finally {
    loading.value = false;
    cierreEnProceso.value = false;
  }
};

/************************************************************************/
// Generar reporte PDF del cierre
const generarReporteCierre = () => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    // **ENCABEZADO EJECUTIVO**
    pdf.setFillColor(30, 58, 138);
    pdf.rect(0, 0, pageWidth, 50, 'F');

    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 25, pageWidth, 25, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(26);
    pdf.setFont(undefined, 'bold');
    pdf.text('CIERRE DE AÑO FISCAL', pageWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(16);
    pdf.text(`Año ${anioFiscal.value}`, pageWidth / 2, 32, { align: 'center' });

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    const nombreEmpresa = datosEmpresa?.empresa?.nombre || 'Empresa';
    pdf.text(nombreEmpresa, pageWidth / 2, 40, { align: 'center' });

    pdf.setFontSize(9);
    pdf.text(`Fecha de Cierre: ${fechaCierre.value}`, pageWidth / 2, 46, { align: 'center' });

    // **RESUMEN EJECUTIVO**
    let yPos = 65;

    pdf.setFontSize(14);
    pdf.setTextColor(30, 58, 138);
    pdf.setFont(undefined, 'bold');
    pdf.text('RESUMEN EJECUTIVO', 14, yPos);

    yPos += 10;

    // Cards de resumen
    const cardWidth = (pageWidth - 40) / 3;
    const cardHeight = 25;
    const cardSpacing = 5;

    // Card Ingresos
    pdf.setFillColor(220, 252, 231);
    pdf.setDrawColor(22, 163, 74);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(14, yPos, cardWidth, cardHeight, 3, 3, 'FD');
    pdf.setTextColor(22, 163, 74);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('INGRESOS TOTALES', 14 + cardWidth / 2, yPos + 8, { align: 'center' });
    pdf.setFontSize(16);
    pdf.text(`RD$ ${resumenCuentas.value.totalIngresos.toFixed(2)}`, 14 + cardWidth / 2, yPos + 18, { align: 'center' });

    // Card Gastos
    pdf.setFillColor(254, 226, 226);
    pdf.setDrawColor(220, 38, 38);
    pdf.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 3, 3, 'FD');
    pdf.setTextColor(220, 38, 38);
    pdf.setFontSize(10);
    pdf.text('GASTOS TOTALES', 14 + cardWidth + cardSpacing + cardWidth / 2, yPos + 8, { align: 'center' });
    pdf.setFontSize(16);
    pdf.text(`RD$ ${resumenCuentas.value.totalGastos.toFixed(2)}`, 14 + cardWidth + cardSpacing + cardWidth / 2, yPos + 18, { align: 'center' });

    // Card Resultado
    const resultadoColor = resumenCuentas.value.utilidadPerdida >= 0 ? [22, 163, 74] : [220, 38, 38];
    const resultadoBg = resumenCuentas.value.utilidadPerdida >= 0 ? [219, 234, 254] : [254, 243, 199];
    pdf.setFillColor(...resultadoBg);
    pdf.setDrawColor(...resultadoColor);
    pdf.roundedRect(14 + (cardWidth + cardSpacing) * 2, yPos, cardWidth, cardHeight, 3, 3, 'FD');
    pdf.setTextColor(...resultadoColor);
    pdf.setFontSize(10);
    pdf.text(resumenCuentas.value.utilidadPerdida >= 0 ? 'UTILIDAD' : 'PÉRDIDA', 14 + (cardWidth + cardSpacing) * 2 + cardWidth / 2, yPos + 8, { align: 'center' });
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(`RD$ ${Math.abs(resumenCuentas.value.utilidadPerdida).toFixed(2)}`, 14 + (cardWidth + cardSpacing) * 2 + cardWidth / 2, yPos + 18, { align: 'center' });

    yPos += cardHeight + 15;

    // **DETALLE DE INGRESOS**
    pdf.setFontSize(12);
    pdf.setTextColor(30, 58, 138);
    pdf.setFont(undefined, 'bold');
    pdf.text('DETALLE DE INGRESOS', 14, yPos);
    yPos += 5;

    const ingresosRows = resumenCuentas.value.ingresos.map(item => [
      item.cuenta,
      `RD$ ${item.monto.toFixed(2)}`
    ]);

    pdf.autoTable({
      startY: yPos,
      head: [['Cuenta', 'Monto']],
      body: ingresosRows,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { halign: 'right', cellWidth: 50, textColor: [22, 163, 74], fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    yPos = pdf.lastAutoTable.finalY + 10;

    // **DETALLE DE GASTOS**
    pdf.setFontSize(12);
    pdf.setTextColor(30, 58, 138);
    pdf.setFont(undefined, 'bold');
    pdf.text('DETALLE DE GASTOS', 14, yPos);
    yPos += 5;

    const gastosRows = resumenCuentas.value.gastos.map(item => [
      item.cuenta,
      `RD$ ${item.monto.toFixed(2)}`
    ]);

    pdf.autoTable({
      startY: yPos,
      head: [['Cuenta', 'Monto']],
      body: gastosRows,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { halign: 'right', cellWidth: 50, textColor: [220, 38, 38], fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generado: ${nfecha('fechaAmericana')} ${nfecha('horaAmericana')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.setFontSize(7);
    pdf.text('Documento Confidencial - Solo para uso interno', 14, pageHeight - 10);

    // Mostrar PDF embebido
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const nombreArchivo = `CierreFiscal_${anioFiscal.value}.pdf`;

    Swal.fire({
      title: '<strong>Reporte de Cierre Fiscal</strong>',
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
      `,
      width: '90%',
      showCloseButton: true,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar',
      cancelButtonText: '<i class="pi pi-print"></i> Imprimir',
      confirmButtonColor: '#1e3a8a',
      cancelButtonColor: '#059669',
      reverseButtons: true,
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

  } catch (error) {
    console.error('Error generando reporte:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo generar el reporte',
      life: 3000
    });
  }
};

/************************************************************************/
// Reiniciar proceso
const reiniciarProceso = () => {
  pasoActual.value = 1;
  resumenCuentas.value = {
    ingresos: [],
    gastos: [],
    totalIngresos: 0,
    totalGastos: 0,
    utilidadPerdida: 0
  };
};

/************************************************************************/
onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    token.value = datosJSON.VITE_TOKEN;
    tokenCifrado.value = await encryptarPassword(token.value, 10);

    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(datosJSON.VITE_LINKURL + datosJSON.VITE_LINK_API);
    }

    // Crear tabla de cierres fiscales si no existe
    const camposCierre = [
      'anio_fiscal',
      'fecha_cierre',
      'total_ingresos',
      'total_gastos',
      'utilidad_perdida',
      'tipo_resultado',
      'detalle_ingresos',
      'detalle_gastos',
      'usuario',
      'estado'
    ];
    await peticionesFetchOffline('crearTablaSiNoExiste', 'cierres_fiscales', JSON.stringify(camposCierre));

    await cargarCierresAnteriores();

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
          <div class="bg-red-100 text-red-700 rounded-full p-3">
            <i class="pi pi-lock text-2xl"></i>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Cierre de Año Fiscal</h1>
            <p class="text-gray-600">Cierre contable de fin de ejercicio</p>
          </div>
        </div>
      </div>

      <!-- Indicador de pasos -->
      <Card class="mb-6">
        <template #content>
          <div class="flex items-center justify-between relative">
            <div class="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" style="margin: 0 60px;">
              <div
                class="h-full bg-blue-600 transition-all duration-500"
                :style="{ width: `${((pasoActual - 1) / 2) * 100}%` }"
              ></div>
            </div>

            <div
              v-for="paso in 3"
              :key="paso"
              class="flex flex-col items-center z-10 bg-gray-50 px-4"
            >
              <div
                :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-all',
                  pasoActual >= paso
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                ]"
              >
                <i v-if="pasoActual > paso" class="pi pi-check"></i>
                <span v-else>{{ paso }}</span>
              </div>
              <span class="text-sm font-medium text-gray-700 text-center">
                {{ paso === 1 ? 'Selección' : paso === 2 ? 'Revisión' : 'Cierre' }}
              </span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Paso 1: Selección del año -->
      <Card v-if="pasoActual === 1" class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-blue-600"></i>
            <span>Paso 1: Seleccione el Año Fiscal</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="font-semibold text-gray-700 mb-2 block">Año Fiscal a Cerrar</label>
                <InputNumber
                  v-model="anioFiscal"
                  :min="2000"
                  :max="2100"
                  :useGrouping="false"
                  class="w-full"
                  :disabled="anioCerrado"
                />
                <small v-if="anioCerrado" class="text-red-500 flex items-center gap-1 mt-2">
                  <i class="pi pi-exclamation-triangle"></i>
                  Este año fiscal ya fue cerrado
                </small>
              </div>

              <div>
                <label class="font-semibold text-gray-700 mb-2 block">Fecha de Cierre</label>
                <DatePicker
                  v-model="fechaCierre"
                  dateFormat="yy-mm-dd"
                  showIcon
                  class="w-full"
                />
              </div>
            </div>

            <div class="flex justify-end">
              <Button
                label="Continuar"
                icon="pi pi-arrow-right"
                @click="obtenerDatosAnioFiscal"
                :disabled="anioCerrado || loading"
                :loading="loading"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Paso 2: Revisión de datos -->
      <div v-if="pasoActual === 2" class="space-y-6">
        <!-- Resumen en cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <template #content>
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="pi pi-arrow-up text-2xl text-green-600"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Total Ingresos</p>
                  <p class="text-2xl font-bold text-green-600">RD$ {{ resumenCuentas.totalIngresos.toFixed(2) }}</p>
                </div>
              </div>
            </template>
          </Card>

          <Card>
            <template #content>
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i class="pi pi-arrow-down text-2xl text-red-600"></i>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Total Gastos</p>
                  <p class="text-2xl font-bold text-red-600">RD$ {{ resumenCuentas.totalGastos.toFixed(2) }}</p>
                </div>
              </div>
            </template>
          </Card>

          <Card>
            <template #content>
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    resumenCuentas.utilidadPerdida >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                  ]"
                >
                  <i
                    :class="[
                      'pi text-2xl',
                      resumenCuentas.utilidadPerdida >= 0 ? 'pi-chart-line text-blue-600' : 'pi-exclamation-triangle text-orange-600'
                    ]"
                  ></i>
                </div>
                <div>
                  <p class="text-sm text-gray-600">{{ resumenCuentas.utilidadPerdida >= 0 ? 'Utilidad' : 'Pérdida' }}</p>
                  <p
                    :class="[
                      'text-2xl font-bold',
                      resumenCuentas.utilidadPerdida >= 0 ? 'text-blue-600' : 'text-orange-600'
                    ]"
                  >
                    RD$ {{ Math.abs(resumenCuentas.utilidadPerdida).toFixed(2) }}
                  </p>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Detalles en tablas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Ingresos -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-plus-circle text-green-600"></i>
                <span>Ingresos</span>
              </div>
            </template>
            <template #content>
              <DataTable
                :value="resumenCuentas.ingresos"
                :rows="10"
                :paginator="resumenCuentas.ingresos.length > 10"
                class="text-sm"
              >
                <Column field="cuenta" header="Cuenta"></Column>
                <Column field="monto" header="Monto" style="text-align: right">
                  <template #body="{ data }">
                    <span class="text-green-600 font-semibold">RD$ {{ data.monto.toFixed(2) }}</span>
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>

          <!-- Gastos -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-minus-circle text-red-600"></i>
                <span>Gastos</span>
              </div>
            </template>
            <template #content>
              <DataTable
                :value="resumenCuentas.gastos"
                :rows="10"
                :paginator="resumenCuentas.gastos.length > 10"
                class="text-sm"
              >
                <Column field="cuenta" header="Cuenta"></Column>
                <Column field="monto" header="Monto" style="text-align: right">
                  <template #body="{ data }">
                    <span class="text-red-600 font-semibold">RD$ {{ data.monto.toFixed(2) }}</span>
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>
        </div>

        <!-- Botones de acción -->
        <Card>
          <template #content>
            <div class="flex justify-between">
              <Button
                label="Volver"
                icon="pi pi-arrow-left"
                @click="reiniciarProceso"
                severity="secondary"
                outlined
              />
              <Button
                label="Ejecutar Cierre"
                icon="pi pi-lock"
                @click="ejecutarCierre"
                severity="danger"
                :loading="cierreEnProceso"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Paso 3: Cierre completado -->
      <Card v-if="pasoActual === 3">
        <template #content>
          <div class="text-center py-12">
            <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-check text-5xl text-green-600"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Cierre Completado</h2>
            <p class="text-gray-600 mb-6">
              El cierre del año fiscal {{ anioFiscal }} se realizó exitosamente
            </p>
            <div class="flex gap-3 justify-center">
              <Button
                label="Generar Reporte"
                icon="pi pi-file-pdf"
                @click="generarReporteCierre"
                severity="danger"
              />
              <Button
                label="Nuevo Cierre"
                icon="pi pi-plus"
                @click="reiniciarProceso"
                outlined
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Historial de cierres -->
      <Card v-if="cierresAnteriores.length > 0" class="mt-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-history text-gray-600"></i>
            <span>Historial de Cierres</span>
          </div>
        </template>
        <template #content>
          <DataTable
            :value="cierresAnteriores"
            :rows="5"
            :paginator="cierresAnteriores.length > 5"
            sortField="fecha_cierre"
            :sortOrder="-1"
          >
            <Column field="anio_fiscal" header="Año" sortable></Column>
            <Column field="fecha_cierre" header="Fecha de Cierre" sortable></Column>
            <Column field="total_ingresos" header="Ingresos" style="text-align: right">
              <template #body="{ data }">
                <span class="text-green-600">RD$ {{ parseFloat(data.total_ingresos).toFixed(2) }}</span>
              </template>
            </Column>
            <Column field="total_gastos" header="Gastos" style="text-align: right">
              <template #body="{ data }">
                <span class="text-red-600">RD$ {{ parseFloat(data.total_gastos).toFixed(2) }}</span>
              </template>
            </Column>
            <Column field="tipo_resultado" header="Resultado">
              <template #body="{ data }">
                <Tag
                  :severity="data.tipo_resultado === 'Utilidad' ? 'success' : 'warning'"
                  :value="`${data.tipo_resultado}: RD$ ${Math.abs(parseFloat(data.utilidad_perdida)).toFixed(2)}`"
                />
              </template>
            </Column>
            <Column field="usuario" header="Usuario"></Column>
          </DataTable>
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
