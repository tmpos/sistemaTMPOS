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
// Fecha del balance
const fechaBalance = ref('');
const loading = ref(false);

/************************************************************************/
// Datos del balance
const activosCorrientes = ref([]);
const activosNoCorrientes = ref([]);
const pasivosCorrientes = ref([]);
const pasivosNoCorrientes = ref([]);
const patrimonio = ref([]);

/************************************************************************/
// Cálculos
const totalActivosCorrientes = computed(() => {
  return activosCorrientes.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const totalActivosNoCorrientes = computed(() => {
  return activosNoCorrientes.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const totalActivos = computed(() => {
  return totalActivosCorrientes.value + totalActivosNoCorrientes.value;
});

const totalPasivosCorrientes = computed(() => {
  return pasivosCorrientes.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const totalPasivosNoCorrientes = computed(() => {
  return pasivosNoCorrientes.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const totalPasivos = computed(() => {
  return totalPasivosCorrientes.value + totalPasivosNoCorrientes.value;
});

const totalPatrimonio = computed(() => {
  return patrimonio.value.reduce((sum, item) => sum + parseFloat(item.monto || 0), 0);
});

const totalPasivosPatrimonio = computed(() => {
  return totalPasivos.value + totalPatrimonio.value;
});

const balanceCuadrado = computed(() => {
  return Math.abs(totalActivos.value - totalPasivosPatrimonio.value) < 0.01;
});

/************************************************************************/
// Función para cargar datos del balance
const cargarDatosBalance = async () => {
  try {
    if (!fechaBalance.value) {
      return;
    }

    const nombreEmpresa = datosEmpresa.empresa.nombre;
    const fechaBalanceFormato = fechaBalance.value + ' 23:59:59';

    // Obtener datos acumulados hasta la fecha del balance
    const fechaInicioFormato = '2000-01-01 00:00:00'; // Desde el inicio
    const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioFormato, fechaBalanceFormato);

    if (!response || typeof response !== 'object') {
      console.warn('No se recibieron datos del servidor');
      return;
    }

    console.log('Respuesta datosVentasPorRango:', response);

    const facturas = response.facturas || [];
    const facturasEmpresa = nombreEmpresa
      ? facturas.filter(f => f.almacen === nombreEmpresa)
      : facturas;

    const gastosData = response.gastos || [];
    const gastosEmpresa = nombreEmpresa
      ? gastosData.filter(g => g.almacen === nombreEmpresa)
      : gastosData;

    // ============================================================================
    // ACTIVOS CORRIENTES
    // ============================================================================

    // Efectivo en caja/bancos
    const cuentasBanco = await peticionesFetchOffline('getDataAsArray', 'banco');
    const totalBancos = cuentasBanco.reduce((sum, b) => sum + parseFloat(b.saldo || 0), 0);

    // Cuentas por cobrar
    const cuentasCobrar = await peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar');
    const totalCuentasCobrar = cuentasCobrar.reduce((sum, c) => {
      const total = parseFloat(c.total || 0);
      const abonado = parseFloat(c.abonado || 0);
      return sum + (total - abonado);
    }, 0);

    // Inventario (estimado desde compras)
    const compras = await peticionesFetchOffline('getDataAsArray', 'compras');
    const totalInventario = compras.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);

    activosCorrientes.value = [
      { concepto: 'Efectivo y equivalentes', monto: totalBancos.toFixed(2) },
      { concepto: 'Cuentas por cobrar', monto: totalCuentasCobrar.toFixed(2) },
      { concepto: 'Inventario', monto: totalInventario.toFixed(2) }
    ];

    // ============================================================================
    // ACTIVOS NO CORRIENTES
    // ============================================================================

    // Activos fijos (si existe la tabla)
    try {
      const activosFijos = await peticionesFetchOffline('getDataAsArray', 'activos_fijos');
      const totalActivosFijos = activosFijos.reduce((sum, a) => sum + parseFloat(a.valor || 0), 0);

      activosNoCorrientes.value = [
        { concepto: 'Propiedad, planta y equipo', monto: totalActivosFijos.toFixed(2) }
      ];
    } catch (error) {
      activosNoCorrientes.value = [
        { concepto: 'Propiedad, planta y equipo', monto: '0.00' }
      ];
    }

    // ============================================================================
    // PASIVOS CORRIENTES
    // ============================================================================

    // Cuentas por pagar
    const cuentasPagar = await peticionesFetchOffline('getDataAsArray', 'cuentasxpagar');
    const totalCuentasPagar = cuentasPagar.reduce((sum, c) => {
      const total = parseFloat(c.total || 0);
      const abonado = parseFloat(c.abonado || 0);
      return sum + (total - abonado);
    }, 0);

    pasivosCorrientes.value = [
      { concepto: 'Cuentas por pagar', monto: totalCuentasPagar.toFixed(2) },
      { concepto: 'Otros pasivos corrientes', monto: '0.00' }
    ];

    // ============================================================================
    // PASIVOS NO CORRIENTES
    // ============================================================================

    pasivosNoCorrientes.value = [
      { concepto: 'Préstamos a largo plazo', monto: '0.00' }
    ];

    // ============================================================================
    // PATRIMONIO
    // ============================================================================

    // Calcular utilidad acumulada
    const totalVentas = facturasEmpresa
      .map(f => Number(f.total || 0))
      .reduce((acc, total) => acc + total, 0);

    const totalGanancias = facturasEmpresa
      .map(f => Number(f.ganancia || 0))
      .reduce((acc, total) => acc + total, 0);

    const totalCostoVentas = totalVentas - totalGanancias;

    const totalGastos = gastosEmpresa.reduce((sum, g) =>
      sum + parseFloat(g.cantidad || g.monto || 0), 0
    );

    const utilidadAcumulada = totalGanancias - totalGastos;

    // Capital (se calcula para cuadrar el balance)
    const activosCalculados = totalActivosCorrientes.value + totalActivosNoCorrientes.value;
    const pasivosCalculados = totalPasivosCorrientes.value + totalPasivosNoCorrientes.value;
    const capitalCalculado = activosCalculados - pasivosCalculados - utilidadAcumulada;

    patrimonio.value = [
      { concepto: 'Capital social', monto: capitalCalculado.toFixed(2) },
      { concepto: 'Utilidades retenidas', monto: utilidadAcumulada.toFixed(2) }
    ];

  } catch (error) {
    console.error('Error al cargar datos del balance:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos del balance', life: 3000 });

    // Inicializar con arrays vacíos
    activosCorrientes.value = [];
    activosNoCorrientes.value = [];
    pasivosCorrientes.value = [];
    pasivosNoCorrientes.value = [];
    patrimonio.value = [];
  }
};

/************************************************************************/
const generarBalance = async () => {
  if (!fechaBalance.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Selecciona la fecha del balance', life: 3000 });
    return;
  }

  loading.value = true;
  try {
    await cargarDatosBalance();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Balance generado correctamente', life: 3000 });
  } catch (error) {
    console.error('Error al generar balance:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al generar el balance', life: 3000 });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
const imprimirBalance = () => {
  window.print();
};

/************************************************************************/
const generarPDFProfesional = async () => {
  if (!fechaBalance.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Primero genera el balance', life: 3000 });
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
    const colorPrimario = [30, 58, 138];
    const colorVerde = [16, 185, 129];
    const colorAzul = [59, 130, 246];
    const colorNaranja = [245, 158, 11];
    const colorMorado = [139, 92, 246];
    const colorGris = [107, 114, 128];
    const colorGrisClaro = [243, 244, 246];

    let yPosition = margin;

    // ============================================================================
    // HEADER
    // ============================================================================
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(datosEmpresa.empresa.nombre || 'EMPRESA', margin, 15);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTADO DE SITUACIÓN FINANCIERA', margin, 25);

    doc.setDrawColor(...colorAzul);
    doc.setLineWidth(0.5);
    doc.line(margin, 30, pageWidth - margin, 30);

    yPosition = 45;

    // ============================================================================
    // FECHA DEL BALANCE
    // ============================================================================
    doc.setFillColor(...colorGrisClaro);
    doc.roundedRect(margin, yPosition, contentWidth, 15, 2, 2, 'F');

    doc.setTextColor(...colorPrimario);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Al:', margin + 5, yPosition + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const fechaFormat = new Date(fechaBalance.value).toLocaleDateString('es-DO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(fechaFormat, margin + 5, yPosition + 11);

    yPosition += 22;

    // ============================================================================
    // FUNCIONES AUXILIARES
    // ============================================================================
    const crearSeccion = (titulo, items, colorTitulo) => {
      doc.setFillColor(...colorTitulo);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, margin + 3, yPosition + 5.5);

      yPosition += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPosition, contentWidth, 6, 'F');
        }

        doc.text(item.concepto, margin + 8, yPosition + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
                 pageWidth - margin - 5, yPosition + 4, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        yPosition += 6;
      });

      yPosition += 2;
    };

    const crearSubtotal = (titulo, valor, nivel = 0) => {
      const indent = nivel * 5;

      doc.setFillColor(...colorGrisClaro);
      doc.roundedRect(margin + indent, yPosition, contentWidth - indent, 8, 1, 1, 'F');

      doc.setDrawColor(...colorGris);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin + indent, yPosition, contentWidth - indent, 8, 1, 1, 'S');

      doc.setTextColor(...colorPrimario);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, margin + indent + 3, yPosition + 5.5);

      const montoTexto = `$${valor.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
      doc.text(montoTexto, pageWidth - margin - 5, yPosition + 5.5, { align: 'right' });

      yPosition += 11;
    };

    const crearTotal = (titulo, valor, color) => {
      doc.setFillColor(...color);
      doc.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'F');

      doc.setDrawColor(...color);
      doc.setLineWidth(1);
      doc.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'S');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, margin + 5, yPosition + 7.5);

      const montoTexto = `$${valor.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
      doc.text(montoTexto, pageWidth - margin - 5, yPosition + 7.5, { align: 'right' });

      yPosition += 15;
    };

    const verificarEspacio = (espacioNecesario) => {
      if (yPosition + espacioNecesario > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // ============================================================================
    // ACTIVOS
    // ============================================================================
    doc.setFillColor(...colorVerde);
    doc.rect(margin, yPosition, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVOS', margin + 5, yPosition + 6.5);
    yPosition += 13;

    // Activos Corrientes
    if (activosCorrientes.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('Activos Corrientes', activosCorrientes.value, colorAzul);
      crearSubtotal('Total Activos Corrientes', totalActivosCorrientes.value, 1);
    }

    // Activos No Corrientes
    if (activosNoCorrientes.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('Activos No Corrientes', activosNoCorrientes.value, colorAzul);
      crearSubtotal('Total Activos No Corrientes', totalActivosNoCorrientes.value, 1);
    }

    // Total Activos
    verificarEspacio(20);
    crearTotal('TOTAL ACTIVOS', totalActivos.value, colorVerde);

    yPosition += 5;

    // ============================================================================
    // PASIVOS
    // ============================================================================
    doc.setFillColor(...colorNaranja);
    doc.rect(margin, yPosition, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PASIVOS', margin + 5, yPosition + 6.5);
    yPosition += 13;

    // Pasivos Corrientes
    if (pasivosCorrientes.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('Pasivos Corrientes', pasivosCorrientes.value, [251, 146, 60]);
      crearSubtotal('Total Pasivos Corrientes', totalPasivosCorrientes.value, 1);
    }

    // Pasivos No Corrientes
    if (pasivosNoCorrientes.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('Pasivos No Corrientes', pasivosNoCorrientes.value, [251, 146, 60]);
      crearSubtotal('Total Pasivos No Corrientes', totalPasivosNoCorrientes.value, 1);
    }

    // Total Pasivos
    verificarEspacio(20);
    crearTotal('TOTAL PASIVOS', totalPasivos.value, colorNaranja);

    yPosition += 5;

    // ============================================================================
    // PATRIMONIO
    // ============================================================================
    doc.setFillColor(...colorMorado);
    doc.rect(margin, yPosition, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PATRIMONIO', margin + 5, yPosition + 6.5);
    yPosition += 13;

    if (patrimonio.value.length > 0) {
      verificarEspacio(40);
      crearSeccion('Capital y Utilidades', patrimonio.value, [167, 139, 250]);
    }

    // Total Patrimonio
    verificarEspacio(20);
    crearTotal('TOTAL PATRIMONIO', totalPatrimonio.value, colorMorado);

    yPosition += 5;

    // ============================================================================
    // TOTAL PASIVOS + PATRIMONIO
    // ============================================================================
    verificarEspacio(20);
    crearTotal('TOTAL PASIVOS + PATRIMONIO', totalPasivosPatrimonio.value, colorPrimario);

    // ============================================================================
    // VERIFICACIÓN DE ECUACIÓN CONTABLE
    // ============================================================================
    yPosition += 5;
    verificarEspacio(25);

    const colorVerificacion = balanceCuadrado.value ? [220, 252, 231] : [254, 226, 226];
    const colorTextoVerificacion = balanceCuadrado.value ? [22, 163, 74] : [220, 38, 38];

    doc.setFillColor(...colorVerificacion);
    doc.roundedRect(margin, yPosition, contentWidth, 18, 2, 2, 'F');

    doc.setDrawColor(...colorTextoVerificacion);
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPosition, contentWidth, 18, 2, 2, 'S');

    doc.setTextColor(...colorTextoVerificacion);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    const diferencia = totalActivos.value - totalPasivosPatrimonio.value;
    const textoVerificacion = balanceCuadrado.value
      ? '✓ Balance Cuadrado - La ecuación contable está balanceada'
      : `⚠ Diferencia detectada: $${Math.abs(diferencia).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

    doc.text(textoVerificacion, pageWidth / 2, yPosition + 9, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Activos = Pasivos + Patrimonio', pageWidth / 2, yPosition + 14, { align: 'center' });

    // ============================================================================
    // FOOTER
    // ============================================================================
    const footerY = pageHeight - 15;
    doc.setDrawColor(...colorAzul);
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
      title: '<strong>Estado de Situación Financiera</strong>',
      html: `
        <div style="text-align: left; margin-bottom: 15px;">
          <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
            <i class="pi pi-calendar" style="margin-right: 5px;"></i>
            <strong>Al:</strong> ${fechaFormat}
          </p>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
            <i class="pi pi-building" style="margin-right: 5px;"></i>
            <strong>Empresa:</strong> ${datosEmpresa.empresa.nombre || 'N/A'}
          </p>
          <p style="color: ${balanceCuadrado.value ? '#059669' : '#dc2626'}; font-size: 13px; margin: 8px 0; font-weight: 600;">
            ${balanceCuadrado.value ? '✓ Balance Cuadrado' : '⚠ Balance Descuadrado'}
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
        const nombreArchivo = `Estado_Situacion_${fechaBalance.value}.pdf`;
        doc.save(nombreArchivo);
        toast.add({
          severity: 'success',
          summary: 'Descargado',
          detail: 'PDF descargado correctamente',
          life: 3000
        });
      } else if (result.isDenied) {
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

    // Establecer fecha por defecto (hoy)
    fechaBalance.value = new Date().toISOString().split('T')[0];
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
        <h1 class="text-3xl font-bold text-gray-800">Estado de Situación Financiera</h1>
        <p class="text-gray-600 mt-1">Balance General de la empresa</p>
      </div>

      <!-- Filtros -->
      <Card class="shadow-lg mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-blue-600"></i>
            <span>Fecha del Balance</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Al (fecha del balance)</label>
              <input
                v-model="fechaBalance"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div class="flex items-end">
              <Button
                label="Generar Balance"
                icon="pi pi-chart-bar"
                severity="primary"
                @click="generarBalance"
                :loading="loading"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Balance -->
      <div id="balance-impresion">
        <!-- Header de impresión -->
        <div class="print-only text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">{{ datosEmpresa.empresa.nombre || 'Empresa' }}</h1>
          <h2 class="text-xl font-semibold text-gray-700 mt-2">Estado de Situación Financiera</h2>
          <p class="text-gray-600 mt-1">Al {{ fechaBalance }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- ACTIVOS -->
          <Card class="shadow-lg">
            <template #content>
              <div class="balance-section">
                <!-- Título Activos -->
                <div class="section-header activos-header">
                  <h2>ACTIVOS</h2>
                </div>

                <!-- Activos Corrientes -->
                <div class="subsection">
                  <h3 class="subsection-title">Activos Corrientes</h3>
                  <div v-for="(item, index) in activosCorrientes" :key="'ac-' + index" class="linea-item">
                    <span class="concepto">{{ item.concepto }}</span>
                    <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                  <div class="linea-subtotal">
                    <span class="concepto-subtotal">Total Activos Corrientes</span>
                    <span class="monto-subtotal">${{ totalActivosCorrientes.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                </div>

                <!-- Activos No Corrientes -->
                <div class="subsection">
                  <h3 class="subsection-title">Activos No Corrientes</h3>
                  <div v-for="(item, index) in activosNoCorrientes" :key="'anc-' + index" class="linea-item">
                    <span class="concepto">{{ item.concepto }}</span>
                    <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                  <div class="linea-subtotal">
                    <span class="concepto-subtotal">Total Activos No Corrientes</span>
                    <span class="monto-subtotal">${{ totalActivosNoCorrientes.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                </div>

                <!-- Total Activos -->
                <div class="linea-total activos-total">
                  <span class="concepto-total">TOTAL ACTIVOS</span>
                  <span class="monto-total">${{ totalActivos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </template>
          </Card>

          <!-- PASIVOS Y PATRIMONIO -->
          <Card class="shadow-lg">
            <template #content>
              <div class="balance-section">
                <!-- PASIVOS -->
                <div class="section-header pasivos-header">
                  <h2>PASIVOS</h2>
                </div>

                <!-- Pasivos Corrientes -->
                <div class="subsection">
                  <h3 class="subsection-title">Pasivos Corrientes</h3>
                  <div v-for="(item, index) in pasivosCorrientes" :key="'pc-' + index" class="linea-item">
                    <span class="concepto">{{ item.concepto }}</span>
                    <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                  <div class="linea-subtotal">
                    <span class="concepto-subtotal">Total Pasivos Corrientes</span>
                    <span class="monto-subtotal">${{ totalPasivosCorrientes.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                </div>

                <!-- Pasivos No Corrientes -->
                <div class="subsection">
                  <h3 class="subsection-title">Pasivos No Corrientes</h3>
                  <div v-for="(item, index) in pasivosNoCorrientes" :key="'pnc-' + index" class="linea-item">
                    <span class="concepto">{{ item.concepto }}</span>
                    <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                  <div class="linea-subtotal">
                    <span class="concepto-subtotal">Total Pasivos No Corrientes</span>
                    <span class="monto-subtotal">${{ totalPasivosNoCorrientes.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                </div>

                <!-- Total Pasivos -->
                <div class="linea-total pasivos-total">
                  <span class="concepto-total">TOTAL PASIVOS</span>
                  <span class="monto-total">${{ totalPasivos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>

                <!-- PATRIMONIO -->
                <div class="section-header patrimonio-header mt-6">
                  <h2>PATRIMONIO</h2>
                </div>

                <div class="subsection">
                  <div v-for="(item, index) in patrimonio" :key="'pat-' + index" class="linea-item">
                    <span class="concepto">{{ item.concepto }}</span>
                    <span class="monto">${{ parseFloat(item.monto).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                  <div class="linea-subtotal">
                    <span class="concepto-subtotal">Total Patrimonio</span>
                    <span class="monto-subtotal">${{ totalPatrimonio.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                </div>

                <!-- Total Pasivos + Patrimonio -->
                <div class="linea-total general-total">
                  <span class="concepto-total">TOTAL PASIVOS + PATRIMONIO</span>
                  <span class="monto-total">${{ totalPasivosPatrimonio.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Verificación de ecuación contable -->
        <Card class="shadow-lg mt-6" :class="{ 'bg-green-50': balanceCuadrado, 'bg-red-50': !balanceCuadrado }">
          <template #content>
            <div class="text-center py-4">
              <div class="flex items-center justify-center gap-3">
                <i :class="balanceCuadrado ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-red-600'" class="text-3xl"></i>
                <div>
                  <h3 class="text-lg font-bold" :class="{ 'text-green-700': balanceCuadrado, 'text-red-700': !balanceCuadrado }">
                    {{ balanceCuadrado ? 'Balance Cuadrado ✓' : 'Balance Descuadrado ⚠' }}
                  </h3>
                  <p class="text-sm text-gray-600 mt-1">
                    Activos: ${{ totalActivos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }} |
                    Pasivos + Patrimonio: ${{ totalPasivosPatrimonio.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                  </p>
                  <p v-if="!balanceCuadrado" class="text-sm text-red-600 font-semibold mt-1">
                    Diferencia: ${{ Math.abs(totalActivos - totalPasivosPatrimonio).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                  </p>
                </div>
              </div>
            </div>
          </template>
        </Card>

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
            @click="imprimirBalance"
          />
          <router-link to="/contabilidad">
            <Button label="Volver" icon="pi pi-arrow-left" severity="info" outlined />
          </router-link>
        </div>
      </div>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}

.balance-section {
  max-width: 100%;
}

.section-header {
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 8px;
  text-align: center;
}

.section-header h2 {
  font-size: 1.3rem;
  font-weight: 800;
  color: white;
  margin: 0;
}

.activos-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.pasivos-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.patrimonio-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.subsection {
  margin-bottom: 20px;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 2px solid #3b82f6;
}

.linea-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
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

.linea-subtotal {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  margin-top: 8px;
  background: #f3f4f6;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

.concepto-subtotal {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.95rem;
}

.monto-subtotal {
  font-weight: 700;
  color: #1f2937;
  font-family: 'Courier New', monospace;
}

.linea-total {
  display: flex;
  justify-content: space-between;
  padding: 14px 12px;
  margin-top: 12px;
  border-radius: 8px;
  font-size: 1.1rem;
}

.activos-total {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #10b981;
}

.pasivos-total {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  border: 2px solid #f59e0b;
}

.general-total {
  background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);
  border: 2px solid #8b5cf6;
}

.concepto-total {
  font-weight: 800;
  color: #1f2937;
}

.monto-total {
  font-weight: 800;
  color: #1f2937;
  font-family: 'Courier New', monospace;
}

/* Botón PDF */
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

/* Estilos SweetAlert */
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

  .balance-section {
    max-width: 100%;
  }

  .section-header,
  .linea-total {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

@media screen {
  .print-only {
    display: none;
  }
}
</style>
