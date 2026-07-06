<script setup>
import { ref, onMounted, nextTick, watchEffect, watch, computed } from 'vue';
import router from '../../router';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';
import LoadingOverlay from '../../Loading/LoadingOverlay.vue';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, transformarFechaTimestamp, agregarDiasalaFechaActual, envioElectron, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import bcrypt from 'bcryptjs';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";

const toast = useToast();
const loading = ref(true);

import { useDatosEmpresa } from '../../stores'
const datosEmpresa = useDatosEmpresa();
const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const patroncedula = ref(null);
const tokenCifrado = ref(null);

const asientoDiario = ref([]);
const cuentas = ref({});
const fechaInicio = ref('');
const horaInicio = ref('');
const fechaFin = ref('');
const horaFin = ref('');
const busquedaCuenta = ref('');

/************************************************************************/
// Computed properties para estadísticas
const totalCuentas = computed(() => Object.keys(cuentas.value).length);

const totalDebitos = computed(() => {
  return Object.values(cuentas.value).reduce((total, cuenta) => {
    return total + cuenta.movimientos.reduce((sum, mov) => sum + mov.debito, 0);
  }, 0);
});

const totalCreditos = computed(() => {
  return Object.values(cuentas.value).reduce((total, cuenta) => {
    return total + cuenta.movimientos.reduce((sum, mov) => sum + mov.credito, 0);
  }, 0);
});

const cuentasFiltradas = computed(() => {
  if (!busquedaCuenta.value) return cuentas.value;

  const query = busquedaCuenta.value.toLowerCase();
  const filtered = {};

  Object.entries(cuentas.value).forEach(([nombre, datos]) => {
    if (typeof nombre === 'string' && nombre.toLowerCase().includes(query)) {
      filtered[nombre] = datos;
    }
  });

  return filtered;
});

// Lista estable para v-for (evitar iteración directa de objeto)
const cuentasLista = computed(() => {
  const src = cuentasFiltradas.value || {};
  return Object.entries(src).map(([nombre, cuenta]) => ({ nombre, cuenta }));
});

/************************************************************************/
function getTimestamps() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 1);
  const currentDay = new Date();

  const formatTimestamp = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return {
    firstDayOfMonth: formatTimestamp(firstDayOfMonth),
    currentDay: formatTimestamp(currentDay),
  };
}

/************************************************************************/
const fetchAsientoDiario = async () => {
  try {
    loading.value = true;
    const usuarioLocal = JSON.parse(window.localStorage.getItem('usuarioLocal'))?.[0];
    const datosAsientoDiario = await peticionesFetchOffline('getDataAsArray', 'asientodiario');

    if (!datosAsientoDiario || datosAsientoDiario.length === 0) {
      asientoDiario.value = [];
      cuentas.value = {};
      toast.add({
        severity: 'info',
        summary: 'Sin datos',
        detail: 'No hay asientos diarios en el rango seleccionado',
        life: 3000
      });
      loading.value = false;
      return;
    }

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

    const formatTime = (timeInput) => {
      if (typeof timeInput === 'string') return timeInput;
      if (timeInput instanceof Date) {
        const hours = String(timeInput.getHours()).padStart(2, '0');
        const minutes = String(timeInput.getMinutes()).padStart(2, '0');
        const seconds = String(timeInput.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      }
      return '00:00:00';
    };

    const startDateStr = `${formatDate(fechaInicio.value)} ${formatTime(horaInicio.value)}`;
    const endDateStr = `${formatDate(fechaFin.value)} ${formatTime(horaFin.value)}`;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const filteredAsientoDiario = datosAsientoDiario.filter(item => {
      const updatedAt = new Date(item.updated_at);
      return updatedAt >= startDate && updatedAt <= endDate;
    });

    asientoDiario.value = filteredAsientoDiario;
    generarMayorGeneral(asientoDiario.value);
    await nextTick();

    toast.add({
      severity: 'success',
      summary: 'Datos cargados',
      detail: `Se cargaron ${filteredAsientoDiario.length} asientos`,
      life: 3000
    });

  } catch (error) {
    console.error('Error al cargar asientos:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar los asientos diarios',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
function generarMayorGeneral(datosAsientoDiario) {
  const movimientos = [];

  function crearMovimiento(cuenta, fecha, descripcion, debito, credito, numero) {
    const movimientoExistente = movimientos.find(
      movimiento => movimiento.cuenta === cuenta && movimiento.numero === numero
    );

    if (movimientoExistente) {
      movimientoExistente.debito += debito;
      movimientoExistente.credito += credito;
    } else {
      movimientos.push({
        cuenta: cuenta,
        fecha: fecha,
        descripcion: descripcion,
        debito: debito,
        credito: credito,
        numero: numero
      });
    }
  }

  datosAsientoDiario.forEach(entrada => {
    try {
      const asiento = JSON.parse(entrada.asiento);

      asiento.forEach(cuenta => {
        const debito = parseFloat(cuenta.cantidadDebito) || 0;
        const credito = parseFloat(cuenta.cantidadCredito) || 0;
        const cuentaNombre = cuenta.debito;
        const cuentaContraparte = cuenta.credito;

        crearMovimiento(cuentaNombre, entrada.fecha, entrada.descripcion, debito, 0, entrada.numero);
        crearMovimiento(cuentaContraparte, entrada.fecha, entrada.descripcion, 0, credito, entrada.numero);
      });
    } catch (error) {
      console.error('Error procesando entrada:', entrada, error);
    }
  });

  const newCuentas = {};

  movimientos.forEach(movimiento => {
    const { cuenta, fecha, descripcion, debito, credito } = movimiento;

    if (!newCuentas[cuenta]) {
      newCuentas[cuenta] = {
        saldo: 0,
        movimientos: []
      };
    }

    newCuentas[cuenta].saldo += credito - debito;
    newCuentas[cuenta].movimientos.push({
      fecha,
      descripcion,
      debito,
      credito,
      saldo: newCuentas[cuenta].saldo
    });
  });

  cuentas.value = newCuentas;
}

/************************************************************************/
onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;

    tokenCifrado.value = await encryptarPassword(token.value, 10);

    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
    }

    fechaInicio.value = transformarFechaTimestamp(agregarDiasalaFechaActual(-30), false);
    horaInicio.value = '00:00:00';
    fechaFin.value = nfecha('fechaAmericana');
    horaFin.value = nfecha('horaAmericana');

    await fetchAsientoDiario();
  } catch (error) {
    console.error('Error en onMounted:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al inicializar el componente',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
});

/************************************************************************/
const exportarExcel = () => {
  if (Object.keys(cuentas.value).length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Sin datos',
      detail: 'No hay datos para exportar',
      life: 3000
    });
    return;
  }

  loading.value = true;
  try {
    const worksheetData = Object.entries(cuentas.value).map(([cuentaName, cuentaData]) => {
      const header = ['Fecha', 'Descripción', 'Débito', 'Crédito', 'Saldo'];

      const rows = cuentaData.movimientos.map(movimiento => [
        movimiento.fecha,
        movimiento.descripcion,
        movimiento.debito.toFixed(2),
        movimiento.credito.toFixed(2),
        movimiento.saldo.toFixed(2)
      ]);

      rows.unshift(header);
      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      return { name: cuentaName.substring(0, 31), worksheet };
    });

    const workbook = XLSX.utils.book_new();
    worksheetData.forEach(({ name, worksheet }) => {
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    });

    XLSX.writeFile(workbook, `MayorGeneral_${nfecha('fechaAmericana')}.xlsx`);

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
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
const exportarPDF = () => {
  if (Object.keys(cuentas.value).length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Sin datos',
      detail: 'No hay datos para exportar',
      life: 3000
    });
    return;
  }

  loading.value = true;
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    // **ENCABEZADO EJECUTIVO CON GRADIENTE**
    const addHeader = () => {
      // Fondo con gradiente azul
      pdf.setFillColor(30, 58, 138); // Azul oscuro
      pdf.rect(0, 0, pageWidth, 40, 'F');

      pdf.setFillColor(37, 99, 235); // Azul medio
      pdf.rect(0, 20, pageWidth, 20, 'F');

      // Título principal
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('MAYOR GENERAL', pageWidth / 2, 18, { align: 'center' });

      // Información de la empresa
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'normal');
      const nombreEmpresa = datosEmpresa?.empresa?.nombre || 'Empresa';
      pdf.text(nombreEmpresa, pageWidth / 2, 28, { align: 'center' });

      // Período
      pdf.setFontSize(10);
      pdf.text(`Período: ${fechaInicio.value} - ${fechaFin.value}`, pageWidth / 2, 35, { align: 'center' });
    };

    addHeader();

    let startY = 50;
    let isFirstPage = true;

    Object.entries(cuentas.value).forEach(([cuentaName, cuentaData], index) => {
      // Verificar si necesitamos nueva página
      if (startY > 240) {
        pdf.addPage();
        startY = 20;
        isFirstPage = false;
      }

      // **TÍTULO DE LA CUENTA CON ESTILO**
      pdf.setFillColor(240, 249, 255); // Azul muy claro
      pdf.rect(14, startY - 5, pageWidth - 28, 10, 'F');

      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text(cuentaName, 16, startY);

      // Saldo total de la cuenta
      const saldoFinal = cuentaData.saldo;
      const saldoColor = saldoFinal >= 0 ? [22, 163, 74] : [220, 38, 38];
      pdf.setTextColor(...saldoColor);
      pdf.setFontSize(11);
      pdf.text(`Saldo: RD$ ${saldoFinal.toFixed(2)}`, pageWidth - 16, startY, { align: 'right' });

      startY += 10;

      // **TABLA DE MOVIMIENTOS CON COLORES PROFESIONALES**
      const rows = cuentaData.movimientos.map(movimiento => {
        return [
          movimiento.fecha,
          movimiento.descripcion,
          movimiento.debito > 0 ? movimiento.debito.toFixed(2) : '-',
          movimiento.credito > 0 ? movimiento.credito.toFixed(2) : '-',
          {
            content: movimiento.saldo.toFixed(2),
            styles: {
              textColor: movimiento.saldo >= 0 ? [22, 163, 74] : [220, 38, 38],
              fontStyle: 'bold'
            }
          }
        ];
      });

      pdf.autoTable({
        startY: startY,
        head: [['Fecha', 'Descripción', 'Débito (RD$)', 'Crédito (RD$)', 'Saldo (RD$)']],
        body: rows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 3
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 70 },
          2: { halign: 'right', cellWidth: 25, textColor: [22, 163, 74] },
          3: { halign: 'right', cellWidth: 25, textColor: [220, 38, 38] },
          4: { halign: 'right', cellWidth: 27, fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer con número de página
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            `Página ${pdf.internal.getNumberOfPages()}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );

          // Nota de confidencialidad
          pdf.setFontSize(7);
          pdf.text('Documento Confidencial - Solo para uso interno', 15, pageHeight - 10);

          // Fecha de generación
          pdf.text(`Generado: ${nfecha('fechaAmericana')} ${nfecha('horaAmericana')}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
        }
      });

      startY = pdf.previousAutoTable.finalY + 12;
    });

    // **PÁGINA FINAL DE RESUMEN**
    pdf.addPage();
    addHeader();

    // Título del resumen
    pdf.setFontSize(16);
    pdf.setTextColor(30, 58, 138);
    pdf.setFont(undefined, 'bold');
    pdf.text('RESUMEN GENERAL', pageWidth / 2, 55, { align: 'center' });

    // Estadísticas en cards
    const cardY = 70;
    const cardHeight = 25;
    const cardWidth = (pageWidth - 40) / 3;
    const cardSpacing = 5;

    // Card 1: Total Cuentas
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(14, cardY, cardWidth, cardHeight, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('Total Cuentas', 14 + cardWidth / 2, cardY + 8, { align: 'center' });
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text(totalCuentas.value.toString(), 14 + cardWidth / 2, cardY + 19, { align: 'center' });

    // Card 2: Total Débitos
    pdf.setFillColor(22, 163, 74);
    pdf.roundedRect(14 + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, 3, 3, 'F');
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Total Débitos', 14 + cardWidth + cardSpacing + cardWidth / 2, cardY + 8, { align: 'center' });
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(`RD$ ${totalDebitos.value.toFixed(2)}`, 14 + cardWidth + cardSpacing + cardWidth / 2, cardY + 19, { align: 'center' });

    // Card 3: Total Créditos
    pdf.setFillColor(220, 38, 38);
    pdf.roundedRect(14 + (cardWidth + cardSpacing) * 2, cardY, cardWidth, cardHeight, 3, 3, 'F');
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Total Créditos', 14 + (cardWidth + cardSpacing) * 2 + cardWidth / 2, cardY + 8, { align: 'center' });
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(`RD$ ${totalCreditos.value.toFixed(2)}`, 14 + (cardWidth + cardSpacing) * 2 + cardWidth / 2, cardY + 19, { align: 'center' });

    // Lista de cuentas con sus saldos
    pdf.setFontSize(14);
    pdf.setTextColor(30, 58, 138);
    pdf.setFont(undefined, 'bold');
    pdf.text('Detalle de Saldos por Cuenta:', 14, cardY + cardHeight + 20);

    const cuentasRows = Object.entries(cuentas.value).map(([nombre, data]) => [
      nombre,
      {
        content: `RD$ ${data.saldo.toFixed(2)}`,
        styles: {
          textColor: data.saldo >= 0 ? [22, 163, 74] : [220, 38, 38],
          fontStyle: 'bold'
        }
      }
    ]);

    pdf.autoTable({
      startY: cardY + cardHeight + 25,
      head: [['Cuenta', 'Saldo Final']],
      body: cuentasRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 3
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: 'bold', textColor: [30, 58, 138] },
        1: { halign: 'right', cellWidth: 50 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    // Generar el PDF y mostrarlo embebido
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const nombreArchivo = `MayorGeneral_${nfecha('fechaAmericana')}.pdf`;

    Swal.fire({
      title: '<strong>Mayor General</strong>',
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
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
watch([fechaInicio, fechaFin, horaInicio, horaFin], async () => {
  await fetchAsientoDiario();
});

</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Mayor General</h1>
        <p class="text-gray-600">Consulta los movimientos contables de todas las cuentas</p>
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
              label="Exportar Excel"
              icon="pi pi-file-excel"
              severity="success"
              @click="exportarExcel"
              :disabled="totalCuentas === 0"
            />
            <Button
              label="Exportar PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              @click="exportarPDF"
              :disabled="totalCuentas === 0"
            />
          </div>
        </template>
      </Card>

      <!-- Filtros de fecha -->
      <Card class="mb-4">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-filter text-blue-600"></i>
            <span>Filtros de Período</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="flex flex-col gap-2">
              <label for="fecha-inicio" class="font-semibold text-gray-700">Fecha Inicio</label>
              <DatePicker
                id="fecha-inicio"
                v-model="fechaInicio"
                dateFormat="yy-mm-dd"
                showIcon
                showButtonBar
                :manualInput="false"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="hora-inicio" class="font-semibold text-gray-700">Hora Inicio</label>
              <DatePicker
                id="hora-inicio"
                v-model="horaInicio"
                timeOnly
                showIcon
                iconDisplay="input"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="fecha-fin" class="font-semibold text-gray-700">Fecha Fin</label>
              <DatePicker
                id="fecha-fin"
                v-model="fechaFin"
                dateFormat="yy-mm-dd"
                showIcon
                showButtonBar
                :manualInput="false"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="hora-fin" class="font-semibold text-gray-700">Hora Fin</label>
              <DatePicker
                id="hora-fin"
                v-model="horaFin"
                timeOnly
                showIcon
                iconDisplay="input"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Estadísticas -->
      <div v-if="totalCuentas > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-list text-2xl text-blue-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Cuentas</p>
                <p class="text-2xl font-bold text-gray-800">{{ totalCuentas }}</p>
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
                <p class="text-2xl font-bold text-green-600">RD$ {{ totalDebitos.toFixed(2) }}</p>
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
                <p class="text-2xl font-bold text-red-600">RD$ {{ totalCreditos.toFixed(2) }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Buscador de cuentas -->
      <Card v-if="totalCuentas > 0" class="mb-4">
        <template #content>
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              v-model="busquedaCuenta"
              type="text"
              placeholder="Buscar cuenta..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </template>
      </Card>

      <!-- Cuentas -->
      <div v-if="cuentasLista.length > 0" class="space-y-4">
        <Card v-for="item in cuentasLista" :key="item.nombre" class="shadow-md">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-book text-blue-600"></i>
                <span class="text-lg">{{ item.nombre }}</span>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Saldo Total</p>
                <p
                  :class="[
                    'text-xl font-bold',
                    item.cuenta.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                  ]"
                >
                  RD$ {{ item.cuenta.saldo.toFixed(2) }}
                </p>
              </div>
            </div>
          </template>
          <template #content>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Descripción
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
                    v-for="(movimiento, index) in item.cuenta.movimientos"
                    :key="index"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-4 py-3 text-sm text-gray-700">{{ movimiento.fecha }}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">{{ movimiento.descripcion }}</td>
                    <td class="px-4 py-3 text-sm text-right text-green-600 font-medium">
                      {{ movimiento.debito > 0 ? 'RD$ ' + movimiento.debito.toFixed(2) : '-' }}
                    </td>
                    <td class="px-4 py-3 text-sm text-right text-red-600 font-medium">
                      {{ movimiento.credito > 0 ? 'RD$ ' + movimiento.credito.toFixed(2) : '-' }}
                    </td>
                    <td
                      :class="[
                        'px-4 py-3 text-sm text-right font-bold',
                        movimiento.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                      ]"
                    >
                      RD$ {{ movimiento.saldo.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-100">
                  <tr>
                    <td colspan="4" class="px-4 py-3 text-right text-sm font-bold text-gray-700">
                      Saldo Final:
                    </td>
                    <td
                      :class="[
                        'px-4 py-3 text-sm text-right font-bold',
                        item.cuenta.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                      ]"
                    >
                      RD$ {{ item.cuenta.saldo.toFixed(2) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </template>
        </Card>
      </div>

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
              Intenta ajustar las fechas o verifica que existan asientos diarios registrados.
            </p>
          </div>
        </template>
      </Card>
    </div>
  </main>

  <LoadingOverlay :visible="loading" />
  <Toast />
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
