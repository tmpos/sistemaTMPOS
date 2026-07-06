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
// Datos del balance
const cuentas = ref([]);

/************************************************************************/
// Cálculos totales
const totalDebitos = computed(() => {
  return cuentas.value.reduce((sum, c) => sum + parseFloat(c.debito || 0), 0);
});

const totalCreditos = computed(() => {
  return cuentas.value.reduce((sum, c) => sum + parseFloat(c.credito || 0), 0);
});

const totalDeudor = computed(() => {
  return cuentas.value.reduce((sum, c) => sum + parseFloat(c.saldoDeudor || 0), 0);
});

const totalAcreedor = computed(() => {
  return cuentas.value.reduce((sum, c) => sum + parseFloat(c.saldoAcreedor || 0), 0);
});

const balanceCuadrado = computed(() => {
  return Math.abs(totalDebitos.value - totalCreditos.value) < 0.01;
});

/************************************************************************/
// Función para cargar datos
const cargarDatos = async () => {
  try {
    if (!fechaInicio.value || !fechaFin.value) {
      return;
    }

    const nombreEmpresa = datosEmpresa.empresa.nombre;
    const fechaInicioFormato = fechaInicio.value + ' 00:01:00';
    const fechaFinFormato = fechaFin.value + ' 23:59:59';

    // Obtener datos del período
    const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioFormato, fechaFinFormato);

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

    // Calcular movimientos para el balance de comprobación
    const cuentasMap = new Map();

    // ACTIVOS - Débitos
    // Efectivo
    const cuentasBanco = await peticionesFetchOffline('getDataAsArray', 'banco');
    const totalBancos = cuentasBanco.reduce((sum, b) => sum + parseFloat(b.saldo || 0), 0);
    agregarCuenta(cuentasMap, '1101', 'Efectivo y Bancos', totalBancos, 0);

    // Cuentas por cobrar
    const cuentasCobrar = await peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar');
    const totalCuentasCobrar = cuentasCobrar.reduce((sum, c) => {
      const total = parseFloat(c.total || 0);
      const abonado = parseFloat(c.abonado || 0);
      return sum + (total - abonado);
    }, 0);
    agregarCuenta(cuentasMap, '1102', 'Cuentas por Cobrar', totalCuentasCobrar, 0);

    // Inventario
    const compras = await peticionesFetchOffline('getDataAsArray', 'compras');
    const totalInventario = compras.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
    agregarCuenta(cuentasMap, '1103', 'Inventario', totalInventario, 0);

    // PASIVOS - Créditos
    // Cuentas por pagar
    const cuentasPagar = await peticionesFetchOffline('getDataAsArray', 'cuentasxpagar');
    const totalCuentasPagar = cuentasPagar.reduce((sum, c) => {
      const total = parseFloat(c.total || 0);
      const abonado = parseFloat(c.abonado || 0);
      return sum + (total - abonado);
    }, 0);
    agregarCuenta(cuentasMap, '2101', 'Cuentas por Pagar', 0, totalCuentasPagar);

    // INGRESOS - Créditos
    const totalVentas = facturasEmpresa
      .map(f => Number(f.total || 0))
      .reduce((acc, total) => acc + total, 0);
    agregarCuenta(cuentasMap, '4101', 'Ventas', 0, totalVentas);

    // GASTOS - Débitos
    const totalGastos = gastosEmpresa.reduce((sum, g) =>
      sum + parseFloat(g.cantidad || g.monto || 0), 0
    );
    agregarCuenta(cuentasMap, '5101', 'Gastos Operativos', totalGastos, 0);

    // COSTO DE VENTAS - Débitos
    const totalGanancias = facturasEmpresa
      .map(f => Number(f.ganancia || 0))
      .reduce((acc, total) => acc + total, 0);
    const totalCostoVentas = totalVentas - totalGanancias;
    agregarCuenta(cuentasMap, '5001', 'Costo de Ventas', totalCostoVentas, 0);

    // Convertir el mapa a array y calcular saldos
    cuentas.value = Array.from(cuentasMap.values())
      .map(cuenta => {
        const debito = cuenta.debito;
        const credito = cuenta.credito;
        const diferencia = debito - credito;

        return {
          ...cuenta,
          saldoDeudor: diferencia > 0 ? diferencia : 0,
          saldoAcreedor: diferencia < 0 ? Math.abs(diferencia) : 0
        };
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo));

  } catch (error) {
    console.error('Error al cargar datos del balance:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos', life: 3000 });
    cuentas.value = [];
  }
};

const agregarCuenta = (map, codigo, nombre, debito, credito) => {
  if (!map.has(codigo)) {
    map.set(codigo, { codigo, nombre, debito: 0, credito: 0 });
  }
  const cuenta = map.get(codigo);
  cuenta.debito += debito;
  cuenta.credito += credito;
};

/************************************************************************/
const generarBalance = async () => {
  if (!fechaInicio.value || !fechaFin.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Selecciona el período del balance', life: 3000 });
    return;
  }

  loading.value = true;
  try {
    await cargarDatos();
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
  if (!fechaInicio.value || !fechaFin.value || cuentas.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Primero genera el balance', life: 3000 });
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Colores corporativos
    const colorPrimario = [30, 58, 138];
    const colorAzul = [59, 130, 246];
    const colorVerde = [16, 185, 129];
    const colorRojo = [239, 68, 68];
    const colorGris = [107, 114, 128];
    const colorGrisClaro = [243, 244, 246];

    // ============================================================================
    // HEADER
    // ============================================================================
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(datosEmpresa.empresa.nombre || 'EMPRESA', pageWidth / 2, 12, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('BALANCE DE COMPROBACIÓN', pageWidth / 2, 21, { align: 'center' });

    // ============================================================================
    // PERÍODO
    // ============================================================================
    let yPosition = 38;

    doc.setFillColor(...colorGrisClaro);
    doc.roundedRect(margin, yPosition, pageWidth - (margin * 2), 12, 2, 2, 'F');

    doc.setTextColor(...colorPrimario);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Período:', margin + 5, yPosition + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const fechaInicioFormat = new Date(fechaInicio.value).toLocaleDateString('es-DO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const fechaFinFormat = new Date(fechaFin.value).toLocaleDateString('es-DO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Del ${fechaInicioFormat} al ${fechaFinFormat}`, margin + 5, yPosition + 9);

    yPosition += 18;

    // ============================================================================
    // TABLA DE CUENTAS
    // ============================================================================
    const tableData = cuentas.value.map(cuenta => [
      cuenta.codigo,
      cuenta.nombre,
      `$${cuenta.debito.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      `$${cuenta.credito.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
      cuenta.saldoDeudor > 0 ? `$${cuenta.saldoDeudor.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '-',
      cuenta.saldoAcreedor > 0 ? `$${cuenta.saldoAcreedor.toLocaleString('es-DO', { minimumFractionDigits: 2 })}` : '-'
    ]);

    // Fila de totales
    tableData.push([
      '',
      { content: 'TOTALES', styles: { fontStyle: 'bold', fillColor: [226, 232, 240] } },
      { content: `$${totalDebitos.value.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [22, 163, 74] } },
      { content: `$${totalCreditos.value.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [220, 38, 38] } },
      { content: `$${totalDeudor.value.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', fillColor: [239, 246, 255], textColor: [37, 99, 235] } },
      { content: `$${totalAcreedor.value.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [217, 119, 6] } }
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [[
        { content: 'Código', styles: { halign: 'center', fillColor: colorPrimario } },
        { content: 'Cuenta', styles: { halign: 'center', fillColor: colorPrimario } },
        { content: 'Débito', styles: { halign: 'center', fillColor: [16, 185, 129] } },
        { content: 'Crédito', styles: { halign: 'center', fillColor: [239, 68, 68] } },
        { content: 'Saldo Deudor', styles: { halign: 'center', fillColor: [59, 130, 246] } },
        { content: 'Saldo Acreedor', styles: { halign: 'center', fillColor: [245, 158, 11] } }
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 80 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 35 },
        5: { halign: 'right', cellWidth: 35 }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: margin, right: margin }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // ============================================================================
    // VERIFICACIÓN
    // ============================================================================
    const colorVerificacion = balanceCuadrado.value ? [220, 252, 231] : [254, 226, 226];
    const colorTextoVerificacion = balanceCuadrado.value ? [22, 163, 74] : [220, 38, 38];

    doc.setFillColor(...colorVerificacion);
    doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 15, 2, 2, 'F');

    doc.setDrawColor(...colorTextoVerificacion);
    doc.setLineWidth(1);
    doc.roundedRect(margin, finalY, pageWidth - (margin * 2), 15, 2, 2, 'S');

    doc.setTextColor(...colorTextoVerificacion);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    const diferencia = totalDebitos.value - totalCreditos.value;
    const textoVerificacion = balanceCuadrado.value
      ? '✓ Balance Cuadrado - Los débitos y créditos están balanceados'
      : `⚠ Diferencia: $${Math.abs(diferencia).toLocaleString('es-DO', { minimumFractionDigits: 2 })} - ${diferencia > 0 ? 'Débitos mayores' : 'Créditos mayores'}`;

    doc.text(textoVerificacion, pageWidth / 2, finalY + 7, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Débitos = Total Créditos', pageWidth / 2, finalY + 11, { align: 'center' });

    // ============================================================================
    // FOOTER
    // ============================================================================
    const footerY = pageHeight - 10;
    doc.setDrawColor(...colorAzul);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

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
      title: '<strong>Balance de Comprobación</strong>',
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
      width: '95%',
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
        const nombreArchivo = `Balance_Comprobacion_${fechaInicio.value}_${fechaFin.value}.pdf`;
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
        <h1 class="text-3xl font-bold text-gray-800">Balance de Comprobación</h1>
        <p class="text-gray-600 mt-1">Verificación de saldos contables</p>
      </div>

      <!-- Filtros -->
      <Card class="shadow-lg mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calendar text-blue-600"></i>
            <span>Período del Balance</span>
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

      <!-- Tabla del Balance -->
      <Card class="shadow-lg mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-list text-blue-600"></i>
            <span>Listado de Cuentas</span>
          </div>
        </template>
        <template #content>
          <DataTable
            :value="cuentas"
            stripedRows
            showGridlines
            :paginator="true"
            :rows="20"
            responsiveLayout="scroll"
          >
            <template #empty>
              <div class="text-center py-8">
                <i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i>
                <p class="text-gray-500">Genera el balance para ver los datos</p>
              </div>
            </template>

            <Column field="codigo" header="Código" :style="{ width: '100px' }"></Column>
            <Column field="nombre" header="Nombre de Cuenta" :style="{ minWidth: '250px' }"></Column>
            <Column field="debito" header="Débito" :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                <span class="font-bold text-green-700">
                  ${{ slotProps.data.debito.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
              </template>
            </Column>
            <Column field="credito" header="Crédito" :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                <span class="font-bold text-red-700">
                  ${{ slotProps.data.credito.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
              </template>
            </Column>
            <Column field="saldoDeudor" header="Saldo Deudor" :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                <span class="font-semibold text-blue-700" v-if="slotProps.data.saldoDeudor > 0">
                  ${{ slotProps.data.saldoDeudor.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>
            <Column field="saldoAcreedor" header="Saldo Acreedor" :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                <span class="font-semibold text-orange-700" v-if="slotProps.data.saldoAcreedor > 0">
                  ${{ slotProps.data.saldoAcreedor.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>

            <template #footer>
              <div class="grid grid-cols-6 gap-4 p-3 bg-gray-100 font-bold">
                <div class="col-span-2 text-right">TOTALES:</div>
                <div class="text-right text-green-700">
                  ${{ totalDebitos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </div>
                <div class="text-right text-red-700">
                  ${{ totalCreditos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </div>
                <div class="text-right text-blue-700">
                  ${{ totalDeudor.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </div>
                <div class="text-right text-orange-700">
                  ${{ totalAcreedor.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </div>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>

      <!-- Verificación -->
      <Card class="shadow-lg mb-6" :class="{ 'bg-green-50': balanceCuadrado, 'bg-red-50': !balanceCuadrado }">
        <template #content>
          <div class="text-center py-4">
            <div class="flex items-center justify-center gap-3">
              <i :class="balanceCuadrado ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-red-600'" class="text-3xl"></i>
              <div>
                <h3 class="text-lg font-bold" :class="{ 'text-green-700': balanceCuadrado, 'text-red-700': !balanceCuadrado }">
                  {{ balanceCuadrado ? 'Balance Cuadrado ✓' : 'Balance Descuadrado ⚠' }}
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                  Débitos: ${{ totalDebitos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }} |
                  Créditos: ${{ totalCreditos.toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </p>
                <p v-if="!balanceCuadrado" class="text-sm text-red-600 font-semibold mt-1">
                  Diferencia: ${{ Math.abs(totalDebitos - totalCreditos).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 no-print">
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

      <Toast />
    </div>
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
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

  .content-wrapper {
    background: white !important;
  }
}
</style>
