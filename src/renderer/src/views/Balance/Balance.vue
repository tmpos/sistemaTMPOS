<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { peticionesFetch, encryptarPassword, envioElectron, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline, nfecha, transformarFechaTimestamp, agregarDiasalaFechaActual } from '../../funciones/funciones.js';
import { useDatosEmpresa } from '../../stores';
import { useToast } from "primevue/usetoast";
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

// Variables reactivas
const link = ref(null);
const api = ref(null);
const token = ref(null);
const tokenCifrado = ref(null);
const balanceComprobacion = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const fechaInicio = ref('');
const fechaFin = ref('');
const horaInicio = ref('00:00:00');
const horaFin = ref('23:59:59');

/************************************************************************/
const fetchAsientoDiario = async () => {
  try {
    loading.value = true;
    const datosAsientoDiario = await peticionesFetchOffline('getDataAsArray', 'asientodiario');

    if (!datosAsientoDiario || datosAsientoDiario.length === 0) {
      balanceComprobacion.value = [];
      toast.add({
        severity: 'info',
        summary: 'Sin datos',
        detail: 'No hay asientos diarios registrados',
        life: 3000
      });
      return;
    }

    // Aplicar filtro de fechas si están definidas
    let datosFiltrados = datosAsientoDiario;

    if (fechaInicio.value && fechaFin.value) {
      const formatDate = (dateInput) => {
        if (typeof dateInput === 'string') return dateInput;
        if (dateInput instanceof Date) {
          const year = dateInput.getFullYear();
          const month = String(dateInput.getMonth() + 1).padStart(2, '0');
          const day = String(dateInput.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return '';
      };

      const startDateStr = `${formatDate(fechaInicio.value)} ${horaInicio.value}`;
      const endDateStr = `${formatDate(fechaFin.value)} ${horaFin.value}`;
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      datosFiltrados = datosAsientoDiario.filter(item => {
        const updatedAt = new Date(item.updated_at);
        return updatedAt >= startDate && updatedAt <= endDate;
      });
    }

    generarBalanceComprobacion(datosFiltrados);

    toast.add({
      severity: 'success',
      summary: 'Datos cargados',
      detail: `Se procesaron ${datosFiltrados.length} asientos`,
      life: 3000
    });
  } catch (error) {
    console.error('Error al cargar asientos:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar los datos del balance',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
function generarBalanceComprobacion(datosAsientoDiario) {
  const balance = {};

  datosAsientoDiario.forEach(entrada => {
    try {
      const asiento = JSON.parse(entrada.asiento);

      asiento.forEach(transaccion => {
        const debitoCuenta = transaccion.debito;
        const creditoCuenta = transaccion.credito;
        const debito = parseFloat(transaccion.cantidadDebito) || 0;
        const credito = parseFloat(transaccion.cantidadCredito) || 0;

        // Agrupar los débitos
        if (debitoCuenta) {
          if (!balance[debitoCuenta]) {
            balance[debitoCuenta] = { debito: 0, credito: 0 };
          }
          balance[debitoCuenta].debito += debito;
        }

        // Agrupar los créditos
        if (creditoCuenta) {
          if (!balance[creditoCuenta]) {
            balance[creditoCuenta] = { debito: 0, credito: 0 };
          }
          balance[creditoCuenta].credito += credito;
        }
      });
    } catch (error) {
      console.error('Error procesando entrada:', entrada, error);
    }
  });

  // Convertir el objeto balance a un array para ser usado en la tabla
  balanceComprobacion.value = Object.keys(balance).map(cuentaNombre => ({
    cuenta: cuentaNombre,
    debito: balance[cuentaNombre].debito,
    credito: balance[cuentaNombre].credito,
    saldo: balance[cuentaNombre].debito - balance[cuentaNombre].credito
  }));
}

/************************************************************************/
// Computed properties
const totalDebito = computed(() => {
  return balanceComprobacion.value.reduce((acc, curr) => acc + curr.debito, 0);
});

const totalCredito = computed(() => {
  return balanceComprobacion.value.reduce((acc, curr) => acc + curr.credito, 0);
});

const diferencia = computed(() => {
  return totalDebito.value - totalCredito.value;
});

const estaBalanceado = computed(() => {
  return Math.abs(diferencia.value) < 0.01;
});

const balanceFiltrado = computed(() => {
  if (!searchQuery.value) return balanceComprobacion.value;

  const query = searchQuery.value.toLowerCase();
  return balanceComprobacion.value.filter(item =>
    item.cuenta.toLowerCase().includes(query)
  );
});

const cuentasConSaldoDeudor = computed(() => {
  return balanceComprobacion.value.filter(item => item.saldo > 0);
});

const cuentasConSaldoAcreedor = computed(() => {
  return balanceComprobacion.value.filter(item => item.saldo < 0);
});

const totalSaldoDeudor = computed(() => {
  return cuentasConSaldoDeudor.value.reduce((sum, item) => sum + item.saldo, 0);
});

const totalSaldoAcreedor = computed(() => {
  return Math.abs(cuentasConSaldoAcreedor.value.reduce((sum, item) => sum + item.saldo, 0));
});

/************************************************************************/
function exportarExcel() {
  if (balanceComprobacion.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Sin datos',
      detail: 'No hay datos para exportar',
      life: 3000
    });
    return;
  }

  try {
    const wsData = [
      ["Balance de Comprobación"],
      [`Período: ${fechaInicio.value || 'Inicio'} - ${fechaFin.value || 'Fin'}`],
      [],
      ["Cuenta", "Débito", "Crédito", "Saldo"],
      ...balanceComprobacion.value.map(item => [
        item.cuenta,
        item.debito > 0 ? item.debito.toFixed(2) : '0.00',
        item.credito > 0 ? item.credito.toFixed(2) : '0.00',
        item.saldo.toFixed(2)
      ]),
      [],
      ["TOTALES", totalDebito.value.toFixed(2), totalCredito.value.toFixed(2), diferencia.value.toFixed(2)]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Balance de Comprobación");

    XLSX.writeFile(wb, `balance_comprobacion_${nfecha('fechaAmericana')}.xlsx`);

    toast.add({
      severity: 'success',
      summary: 'Exportado',
      detail: 'Archivo Excel generado exitosamente',
      life: 3000
    });
  } catch (error) {
    console.error('Error exportando Excel:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo generar el archivo Excel',
      life: 3000
    });
  }
}

/************************************************************************/
function exportarPDF() {
  if (balanceComprobacion.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Sin datos',
      detail: 'No hay datos para exportar',
      life: 3000
    });
    return;
  }

  try {
    // Usar orientación horizontal para mejor visualización de la tabla
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // **ENCABEZADO EJECUTIVO CON GRADIENTE**
    // Fondo con gradiente azul
    doc.setFillColor(30, 58, 138); // Azul oscuro
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFillColor(37, 99, 235); // Azul medio
    doc.rect(0, 20, pageWidth, 20, 'F');

    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('BALANCE DE COMPROBACIÓN', pageWidth / 2, 18, { align: 'center' });

    // Información de la empresa
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const nombreEmpresa = datosEmpresa?.empresa?.nombre || 'Empresa';
    doc.text(nombreEmpresa, pageWidth / 2, 28, { align: 'center' });

    // Período
    doc.setFontSize(10);
    doc.text(`Período: ${fechaInicio.value || 'Inicio'} - ${fechaFin.value || 'Fin'}`, pageWidth / 2, 35, { align: 'center' });

    // Fecha de generación
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text(`Generado: ${nfecha('fechaAmericana')} a las ${nfecha('horaAmericana')}`, pageWidth / 2, 45, { align: 'center' });

    // **TABLA PRINCIPAL CON COLORES PROFESIONALES**
    const head = [['Cuenta', 'Débito (RD$)', 'Crédito (RD$)', 'Saldo Deudor (RD$)', 'Saldo Acreedor (RD$)']];

    const body = balanceComprobacion.value.map(item => {
      const saldoDeudor = item.saldo > 0 ? item.saldo.toFixed(2) : '-';
      const saldoAcreedor = item.saldo < 0 ? Math.abs(item.saldo).toFixed(2) : '-';

      return [
        item.cuenta,
        item.debito > 0 ? item.debito.toFixed(2) : '-',
        item.credito > 0 ? item.credito.toFixed(2) : '-',
        saldoDeudor,
        saldoAcreedor
      ];
    });

    // Fila de totales con estilo destacado
    body.push([
      { content: 'TOTALES', styles: { fontStyle: 'bold', fontSize: 11 } },
      { content: totalDebito.value.toFixed(2), styles: { fontStyle: 'bold', fontSize: 11, fillColor: [220, 252, 231] } },
      { content: totalCredito.value.toFixed(2), styles: { fontStyle: 'bold', fontSize: 11, fillColor: [254, 226, 226] } },
      { content: totalSaldoDeudor.value.toFixed(2), styles: { fontStyle: 'bold', fontSize: 11, fillColor: [219, 234, 254] } },
      { content: totalSaldoAcreedor.value.toFixed(2), styles: { fontStyle: 'bold', fontSize: 11, fillColor: [254, 243, 199] } }
    ]);

    doc.autoTable({
      head: head,
      body: body,
      startY: 52,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 4
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold', textColor: [30, 58, 138] },
        1: { halign: 'right', cellWidth: 45, textColor: [22, 163, 74] }, // Verde para débito
        2: { halign: 'right', cellWidth: 45, textColor: [220, 38, 38] }, // Rojo para crédito
        3: { halign: 'right', cellWidth: 50, textColor: [37, 99, 235] }, // Azul para saldo deudor
        4: { halign: 'right', cellWidth: 50, textColor: [245, 158, 11] } // Naranja para saldo acreedor
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        // Pie de página con número de página
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${doc.internal.getNumberOfPages()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );

        // Nota de confidencialidad
        doc.setFontSize(7);
        doc.text('Documento Confidencial - Solo para uso interno', 15, pageHeight - 10);
      }
    });

    // **SECCIÓN DE VERIFICACIÓN**
    const finalY = doc.lastAutoTable.finalY + 10;

    // Caja de verificación con borde
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(15, finalY, pageWidth - 30, 25, 3, 3, 'FD');

    // Título de verificación
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('VERIFICACIÓN DEL BALANCE:', 20, finalY + 8);

    // Información de verificación
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const balanceVerificado = estaBalanceado.value;
    const colorEstado = balanceVerificado ? [22, 163, 74] : [220, 38, 38];
    const textoEstado = balanceVerificado ? '✓ Balance Cuadrado' : '✗ Balance Descuadrado';

    doc.setTextColor(60, 60, 60);
    doc.text(`Total Débitos: RD$ ${totalDebito.value.toFixed(2)}`, 20, finalY + 16);
    doc.text(`Total Créditos: RD$ ${totalCredito.value.toFixed(2)}`, 20, finalY + 22);

    doc.text(`Diferencia: RD$ ${diferencia.value.toFixed(2)}`, pageWidth / 2 - 20, finalY + 16);

    // Estado con color
    doc.setTextColor(...colorEstado);
    doc.setFont(undefined, 'bold');
    doc.text(textoEstado, pageWidth / 2 - 20, finalY + 22);

    // Generar el PDF y mostrarlo embebido
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const nombreArchivo = `balance_comprobacion_${nfecha('fechaAmericana')}.pdf`;

    Swal.fire({
      title: '<strong>Balance de Comprobación</strong>',
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
        // Agregar estilos para los botones
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
        // Descargar el PDF
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = nombreArchivo;
        link.click();
        return false;
      }
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        // Imprimir el PDF
        const printWindow = window.open(pdfUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }

      // Limpiar el objeto URL
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    });

  } catch (error) {
    console.error('Error exportando PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo generar el archivo PDF',
      life: 3000
    });
  }
}

/************************************************************************/
onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    tokenCifrado.value = await encryptarPassword(token.value, 10);

    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
    }

    // Inicializar fechas (último mes)
    fechaInicio.value = transformarFechaTimestamp(agregarDiasalaFechaActual(-30), false);
    fechaFin.value = nfecha('fechaAmericana');

    await fetchAsientoDiario();
  } catch (error) {
    console.error('Error en onMounted:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al inicializar el componente',
      life: 3000
    });
  }
});

/************************************************************************/
watch([fechaInicio, fechaFin], async () => {
  await fetchAsientoDiario();
});
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Balance de Comprobación</h1>
        <p class="text-gray-600">Resumen de saldos de todas las cuentas contables</p>
      </div>

      <!-- Acciones -->
      <Card class="mb-4">
        <template #content>
          <div class="flex flex-wrap gap-2">
            <Button
              label="Asiento Diario"
              icon="pi pi-book"
              severity="contrast"
              outlined
              @click="$router.push('/asientodiario')"
            />
            <Button
              label="Mayor General"
              icon="pi pi-book"
              severity="contrast"
              outlined
              @click="$router.push('/mayorgeneral')"
            />
            <Button
              label="Actualizar"
              icon="pi pi-refresh"
              severity="info"
              outlined
              @click="fetchAsientoDiario"
            />
            <Button
              label="Exportar Excel"
              icon="pi pi-file-excel"
              severity="success"
              @click="exportarExcel"
              :disabled="balanceComprobacion.length === 0"
            />
            <Button
              label="Exportar PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              @click="exportarPDF"
              :disabled="balanceComprobacion.length === 0"
            />
          </div>
        </template>
      </Card>

      <!-- Filtros -->
      <Card class="mb-4">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-blue-600"></i>
            <span>Filtros de Período</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <DatePicker
                v-model="fechaInicio"
                dateFormat="yy-mm-dd"
                showIcon
                showButtonBar
                :manualInput="false"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <DatePicker
                v-model="fechaFin"
                dateFormat="yy-mm-dd"
                showIcon
                showButtonBar
                :manualInput="false"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Estadísticas -->
      <div v-if="balanceComprobacion.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-list text-2xl text-blue-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Cuentas</p>
                <p class="text-2xl font-bold text-gray-800">{{ balanceComprobacion.length }}</p>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-arrow-down text-2xl text-green-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Débitos</p>
                <p class="text-2xl font-bold text-green-600">RD$ {{ totalDebito.toFixed(2) }}</p>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-arrow-up text-2xl text-red-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Créditos</p>
                <p class="text-2xl font-bold text-red-600">RD$ {{ totalCredito.toFixed(2) }}</p>
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
                  estaBalanceado ? 'bg-green-100' : 'bg-orange-100'
                ]"
              >
                <i
                  :class="[
                    'text-2xl',
                    estaBalanceado ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-orange-600'
                  ]"
                ></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Diferencia</p>
                <p
                  :class="[
                    'text-2xl font-bold',
                    estaBalanceado ? 'text-green-600' : 'text-orange-600'
                  ]"
                >
                  RD$ {{ Math.abs(diferencia).toFixed(2) }}
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Alerta de estado del balance -->
      <div v-if="balanceComprobacion.length > 0" class="mb-4">
        <div
          v-if="estaBalanceado"
          class="p-4 bg-green-50 border-l-4 border-green-400 rounded"
        >
          <div class="flex items-center gap-2">
            <i class="pi pi-check-circle text-green-600"></i>
            <p class="text-sm text-green-800">
              <strong>Balance Correcto:</strong> Los débitos y créditos están balanceados.
            </p>
          </div>
        </div>
        <div v-else class="p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
          <div class="flex items-center gap-2">
            <i class="pi pi-exclamation-triangle text-orange-600"></i>
            <p class="text-sm text-orange-800">
              <strong>Advertencia:</strong> Existe una diferencia de RD$ {{ Math.abs(diferencia).toFixed(2) }} entre débitos y créditos.
            </p>
          </div>
        </div>
      </div>

      <!-- Buscador -->
      <Card v-if="balanceComprobacion.length > 0" class="mb-4">
        <template #content>
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar cuenta..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </template>
      </Card>

      <!-- Tabla del Balance -->
      <Card v-if="balanceFiltrado.length > 0">
        <template #content>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Débito
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Crédito
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="(item, index) in balanceFiltrado"
                  :key="index"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-4 py-3 text-sm text-gray-700 font-medium">{{ item.cuenta }}</td>
                  <td class="px-4 py-3 text-sm text-right text-green-600 font-medium">
                    {{ item.debito > 0 ? 'RD$ ' + item.debito.toFixed(2) : '-' }}
                  </td>
                  <td class="px-4 py-3 text-sm text-right text-red-600 font-medium">
                    {{ item.credito > 0 ? 'RD$ ' + item.credito.toFixed(2) : '-' }}
                  </td>
                  <td
                    :class="[
                      'px-4 py-3 text-sm text-right font-bold',
                      item.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                    ]"
                  >
                    RD$ {{ item.saldo.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-100">
                <tr class="font-bold">
                  <td class="px-4 py-3 text-sm text-gray-700">TOTALES</td>
                  <td class="px-4 py-3 text-sm text-right text-green-600">
                    RD$ {{ totalDebito.toFixed(2) }}
                  </td>
                  <td class="px-4 py-3 text-sm text-right text-red-600">
                    RD$ {{ totalCredito.toFixed(2) }}
                  </td>
                  <td
                    :class="[
                      'px-4 py-3 text-sm text-right font-bold',
                      estaBalanceado ? 'text-green-600' : 'text-orange-600'
                    ]"
                  >
                    RD$ {{ diferencia.toFixed(2) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </template>
      </Card>

      <!-- Estado vacío -->
      <Card v-else class="shadow-md">
        <template #content>
          <div class="flex flex-col items-center justify-center py-12">
            <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i class="pi pi-inbox text-5xl text-gray-400"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">No hay datos disponibles</h3>
            <p class="text-gray-500 text-center max-w-md">
              No se encontraron movimientos contables en el período seleccionado.
              Ajusta las fechas o verifica que existan asientos diarios registrados.
            </p>
          </div>
        </template>
      </Card>

      <!-- Análisis adicional -->
      <div v-if="balanceComprobacion.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-arrow-circle-up text-green-600"></i>
              <span class="text-base">Cuentas con Saldo Deudor</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-2">
              <div class="flex justify-between items-center pb-2 border-b">
                <span class="text-sm font-semibold text-gray-700">Total Cuentas:</span>
                <span class="text-sm font-bold text-gray-800">{{ cuentasConSaldoDeudor.length }}</span>
              </div>
              <div class="flex justify-between items-center pb-2 border-b">
                <span class="text-sm font-semibold text-gray-700">Total Saldo Deudor:</span>
                <span class="text-sm font-bold text-green-600">RD$ {{ totalSaldoDeudor.toFixed(2) }}</span>
              </div>
              <div class="mt-3 max-h-40 overflow-y-auto">
                <div
                  v-for="(cuenta, index) in cuentasConSaldoDeudor.slice(0, 5)"
                  :key="index"
                  class="flex justify-between items-center py-1 text-sm"
                >
                  <span class="text-gray-700 truncate mr-2">{{ cuenta.cuenta }}</span>
                  <span class="text-green-600 font-medium whitespace-nowrap">RD$ {{ cuenta.saldo.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-arrow-circle-down text-red-600"></i>
              <span class="text-base">Cuentas con Saldo Acreedor</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-2">
              <div class="flex justify-between items-center pb-2 border-b">
                <span class="text-sm font-semibold text-gray-700">Total Cuentas:</span>
                <span class="text-sm font-bold text-gray-800">{{ cuentasConSaldoAcreedor.length }}</span>
              </div>
              <div class="flex justify-between items-center pb-2 border-b">
                <span class="text-sm font-semibold text-gray-700">Total Saldo Acreedor:</span>
                <span class="text-sm font-bold text-red-600">RD$ {{ totalSaldoAcreedor.toFixed(2) }}</span>
              </div>
              <div class="mt-3 max-h-40 overflow-y-auto">
                <div
                  v-for="(cuenta, index) in cuentasConSaldoAcreedor.slice(0, 5)"
                  :key="index"
                  class="flex justify-between items-center py-1 text-sm"
                >
                  <span class="text-gray-700 truncate mr-2">{{ cuenta.cuenta }}</span>
                  <span class="text-red-600 font-medium whitespace-nowrap">RD$ {{ Math.abs(cuenta.saldo).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <Toast />
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}

/* Animaciones suaves para las tablas */
tbody tr {
  transition: background-color 0.2s ease;
}
</style>
