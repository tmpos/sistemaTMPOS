<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
import Swal from 'sweetalert2';
import * as XLSX from "xlsx";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  enviarDatosPorPost,
  nfecha,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  peticionesFetchOffline,
  arrayToObjetoFromTablaOffline,
  generadorCodigo
} from '../../funciones/funciones.js';
import { useDatosEmpresa } from '../../stores';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const datosEmpresa = useDatosEmpresa();

// Referencias de configuración
const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref('');
const loading = ref(false);

// PDF
const pdfDialogVisible = ref(false);
const pdfUrl = ref('');

// Datos de la compra
const compra = ref({});
const todasLasCompras = ref([]);
const productosAgregados = computed(() => {
  try {
    return JSON.parse(compra.value.productos || '[]');
  } catch {
    return [];
  }
});

// Opciones
const estadosOptions = [
  { label: 'PENDIENTE', value: 'PENDIENTE', severity: 'warning' },
  { label: 'PAGADO', value: 'PAGADO', severity: 'success' },
  { label: 'CREDITO', value: 'CREDITO', severity: 'info' }
];

const metodoPagoOptions = [
  { label: 'EFECTIVO', value: 'EFECTIVO' },
  { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA' },
  { label: 'TARJETA', value: 'TARJETA' },
  { label: 'CHEQUE', value: 'CHEQUE' }
];

// =============== INICIALIZACIÓN ===============
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  tokenCifrado.value = await encryptarPassword(token.value, 10);

  if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
  }

  await cargarCompras();
});

// =============== CARGAR DATOS ===============
const cargarCompras = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'compras');
  todasLasCompras.value = response || [];
  compra.value = todasLasCompras.value.find(c => c.id == route.params.id) || {};
};

// =============== NAVEGACIÓN ===============
const indiceActual = computed(() => {
  return todasLasCompras.value.findIndex(c => c.id == route.params.id);
});

const puedeIrAnterior = computed(() => indiceActual.value > 0);
const puedeIrSiguiente = computed(() => indiceActual.value < todasLasCompras.value.length - 1);

const navegarPrimero = () => {
  if (todasLasCompras.value.length > 0) {
    router.push(`/editarcompras/${todasLasCompras.value[0].id}`);
  }
};

const navegarAnterior = () => {
  if (puedeIrAnterior.value) {
    router.push(`/editarcompras/${todasLasCompras.value[indiceActual.value - 1].id}`);
  }
};

const navegarSiguiente = () => {
  if (puedeIrSiguiente.value) {
    router.push(`/editarcompras/${todasLasCompras.value[indiceActual.value + 1].id}`);
  }
};

const navegarUltimo = () => {
  if (todasLasCompras.value.length > 0) {
    const ultimo = todasLasCompras.value[todasLasCompras.value.length - 1];
    router.push(`/editarcompras/${ultimo.id}`);
  }
};

// =============== CÁLCULOS ===============
watchEffect(() => {
  if (compra.value.total && compra.value.abono) {
    const total = parseFloat(compra.value.total) || 0;
    const abono = parseFloat(compra.value.abono) || 0;
    compra.value.saldo = (total - abono).toFixed(2);
  }
});

// =============== ACTUALIZAR COMPRA ===============
const actualizarCompra = async () => {
  loading.value = true;

  try {
    compra.value.updated_at = nfecha('timestamp');

    const resultado = await peticionesFetchOffline('updateData', 'compras', JSON.stringify(compra.value));

    if (resultado[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Compra actualizada', life: 3000 });

      // Gestionar cuenta por pagar
      await gestionarCuentaPorPagar();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar', life: 3000 });
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar', life: 3000 });
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const gestionarCuentaPorPagar = async () => {
  try {
    if (compra.value.estado === 'PENDIENTE' || compra.value.estado === 'CREDITO') {
      const saldo = parseFloat(compra.value.saldo) || 0;
      const cuentaExistente = await peticionesFetchOffline('getDataByField', 'cuentasxpagar', 'no_factura', compra.value.no_factura);

      if (saldo > 0) {
        // Hay saldo pendiente
        if (cuentaExistente) {
          // Actualizar cuenta existente
          cuentaExistente.total = compra.value.total;
          cuentaExistente.abono = compra.value.abono;
          cuentaExistente.saldo = compra.value.saldo;
          cuentaExistente.estado = compra.value.estado;
          cuentaExistente.updated_at = nfecha('timestamp');

          await peticionesFetchOffline('updateData', 'cuentasxpagar', JSON.stringify(cuentaExistente));
          toast.add({ severity: 'info', summary: 'Cuenta por Pagar', detail: `Actualizada. Saldo: $${compra.value.saldo}`, life: 4000 });
        } else {
          // Crear nueva cuenta por pagar
          await crearCuentaPorPagar();
        }
      } else {
        // Compra 100% pagada
        if (cuentaExistente) {
          // Eliminar cuenta por pagar
          await peticionesFetchOffline('deleteData', 'cuentasxpagar', cuentaExistente.id);
          toast.add({ severity: 'success', summary: 'Pago Completo', detail: 'Cuenta por pagar eliminada', life: 4000 });
        }
      }
    }
  } catch (error) {
    console.error('Error al gestionar cuenta por pagar:', error);
  }
};

const crearCuentaPorPagar = async () => {
  try {
    const jsonDataPagar = await arrayToObjetoFromTablaOffline('cuentasxpagar');
    const ultimaFactura = await peticionesFetchOffline('getMaxValue', 'cuentasxpagar', 'no_emision');

    jsonDataPagar.no_emision = generadorCodigo(ultimaFactura[0], 'CXP', 7);
    jsonDataPagar.proveedor = compra.value.proveedor;
    jsonDataPagar.rnc = compra.value.rnc_proveedor;
    jsonDataPagar.estado = compra.value.estado;
    jsonDataPagar.fecha = compra.value.fecha;
    jsonDataPagar.hora = nfecha('hora');
    jsonDataPagar.productos = compra.value.productos;
    jsonDataPagar.total = compra.value.total;
    jsonDataPagar.subtotal = compra.value.subtotal;
    jsonDataPagar.saldo = compra.value.saldo;
    jsonDataPagar.abono = compra.value.abono;
    jsonDataPagar.impuestos = compra.value.impuesto;
    jsonDataPagar.nota = compra.value.nota;
    jsonDataPagar.no_factura = compra.value.no_factura;

    const npago = [];
    if (parseFloat(compra.value.abono) > 0) {
      npago.push({
        nopago: 1,
        cantidad: compra.value.abono,
        metodo: 'EFECTIVO',
        fecha: compra.value.fecha,
        hora: nfecha('hora'),
        turno: '',
        cajero: '',
        saldo: compra.value.saldo
      });
    }

    jsonDataPagar.pagos = JSON.stringify(npago);
    jsonDataPagar.created_at = nfecha('timestamp');
    jsonDataPagar.updated_at = nfecha('timestamp');

    const urlPAGAR = `${link.value}${api.value}/insertar/cuentasxpagar`;
    await enviarDatosPorPost(urlPAGAR, jsonDataPagar, tokenCifrado.value);

    toast.add({ severity: 'info', summary: 'Cuenta por Pagar', detail: `Creada. Saldo: $${compra.value.saldo}`, life: 4000 });
  } catch (error) {
    console.error('Error al crear cuenta por pagar:', error);
  }
};

// =============== EXPORTAR A EXCEL ===============
const exportarExcel = () => {
  try {
    const productosArray = productosAgregados.value;

    const purchaseData = [
      { label: "ID", value: compra.value.id },
      { label: "Proveedor", value: compra.value.proveedor },
      { label: "RNC Proveedor", value: compra.value.rnc_proveedor },
      { label: "Fecha", value: compra.value.fecha },
      { label: "No Factura", value: compra.value.no_factura },
      { label: "NCF", value: compra.value.ncf_proveedor },
      { label: "Estado", value: compra.value.estado },
      { label: "Subtotal", value: compra.value.subtotal },
      { label: "Descuento", value: compra.value.descuento },
      { label: "Total", value: compra.value.total },
      { label: "Abono", value: compra.value.abono },
      { label: "Saldo", value: compra.value.saldo },
      { label: "Nota", value: compra.value.nota },
    ];

    const purchaseSheetData = [
      ["Compra Detalle"],
      ...purchaseData.map((item) => [item.label, item.value]),
      [],
      ["Productos"],
      ["Código", "Nombre", "Categoría", "Marca", "P. Compra", "P. Venta", "Stock"],
      ...productosArray.map((producto) => [
        producto.codigo,
        producto.nombre,
        producto.categoria,
        producto.marca,
        producto.precio_compra,
        producto.precio_venta,
        producto.stock,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(purchaseSheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Factura");
    XLSX.writeFile(workbook, `Factura_Compra_${compra.value.id}.xlsx`);

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Excel exportado', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al exportar', life: 3000 });
  }
};

// =============== GENERAR PDF PROFESIONAL ===============
const generarPDF = () => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colores corporativos
    const primaryColor = [99, 102, 241]; // Azul
    const secondaryColor = [139, 92, 246]; // Morado
    const successColor = [16, 185, 129]; // Verde
    const grayColor = [107, 114, 128]; // Gris

    // ENCABEZADO
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Logo o nombre de empresa
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(datosEmpresa.empresa.nombre || 'EMPRESA', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(datosEmpresa.empresa.direccion || '', 15, 28);
    doc.text(`Tel: ${datosEmpresa.empresa.telefono || ''}`, 15, 34);
    doc.text(`RNC: ${datosEmpresa.empresa.rnc || ''}`, 15, 40);

    // Título del documento
    doc.setFillColor(...secondaryColor);
    doc.rect(0, 45, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPRA DE PRODUCTOS', pageWidth / 2, 54, { align: 'center' });

    // INFORMACIÓN DE LA COMPRA
    let yPos = 70;

    // Sección Proveedor
    doc.setFillColor(245, 247, 250);
    doc.rect(10, yPos, pageWidth - 20, 35, 'F');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PROVEEDOR', 15, yPos + 7);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Proveedor: ${compra.value.proveedor || 'N/A'}`, 15, yPos + 15);
    doc.text(`RNC: ${compra.value.rnc_proveedor || 'N/A'}`, 15, yPos + 22);
    doc.text(`NCF: ${compra.value.ncf_proveedor || 'N/A'}`, 15, yPos + 29);

    doc.text(`Fecha: ${compra.value.fecha || 'N/A'}`, pageWidth - 80, yPos + 15);
    doc.text(`No. Factura: ${compra.value.no_factura || 'N/A'}`, pageWidth - 80, yPos + 22);

    // Estado (tag colorido)
    const estadoX = pageWidth - 80;
    const estadoY = yPos + 26;
    const estadoColor = compra.value.estado === 'PAGADO' ? successColor :
                        compra.value.estado === 'PENDIENTE' ? [251, 191, 36] : [59, 130, 246];
    doc.setFillColor(...estadoColor);
    doc.roundedRect(estadoX, estadoY, 35, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(compra.value.estado || 'N/A', estadoX + 17.5, estadoY + 5, { align: 'center' });

    yPos += 45;

    // PRODUCTOS
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTOS', 15, yPos);

    yPos += 5;

    const productosArray = productosAgregados.value;
    const tableData = productosArray.map(producto => [
      producto.codigo || '',
      producto.nombre || '',
      producto.categoria || '',
      producto.marca || '',
      producto.stock || 0,
      formatCurrency(producto.precio_compra),
      formatCurrency((producto.precio_compra || 0) * (producto.stock || 0))
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Código', 'Producto', 'Categoría', 'Marca', 'Cant.', 'P. Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // TOTALES
    const totalesX = pageWidth - 75;

    doc.setFillColor(245, 247, 250);
    doc.rect(totalesX - 5, yPos - 5, 70, 40, 'F');

    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text('Subtotal:', totalesX, yPos);
    doc.text('Descuento:', totalesX, yPos + 7);
    doc.text('Total:', totalesX, yPos + 14);
    doc.text('Abono:', totalesX, yPos + 21);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(compra.value.subtotal), pageWidth - 15, yPos, { align: 'right' });
    doc.text(formatCurrency(compra.value.descuento), pageWidth - 15, yPos + 7, { align: 'right' });

    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text(formatCurrency(compra.value.total), pageWidth - 15, yPos + 14, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(...successColor);
    doc.text(formatCurrency(compra.value.abono), pageWidth - 15, yPos + 21, { align: 'right' });

    // Saldo
    doc.setDrawColor(...grayColor);
    doc.setLineWidth(0.5);
    doc.line(totalesX, yPos + 24, pageWidth - 10, yPos + 24);

    doc.setTextColor(220, 38, 38);
    doc.text('Saldo:', totalesX, yPos + 31);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(formatCurrency(compra.value.saldo), pageWidth - 15, yPos + 31, { align: 'right' });

    // Notas
    if (compra.value.nota) {
      yPos += 50;

      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.setTextColor(...primaryColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTAS:', 15, yPos);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const notaLines = doc.splitTextToSize(compra.value.nota, pageWidth - 30);
      doc.text(notaLines, 15, yPos + 5);
    }

    // FOOTER
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'italic');
    doc.text('Documento generado automáticamente', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Fecha de generación: ${nfecha('fecha')} ${nfecha('hora')}`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Generar PDF como blob URL
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    pdfUrl.value = url;
    pdfDialogVisible.value = true;

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'PDF generado correctamente', life: 3000 });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al generar PDF', life: 3000 });
  }
};

// =============== SALDAR CUENTA POR PAGAR ===============
const saldarCuentaPorPagar = async () => {
  try {
    const response = await peticionesFetchOffline('getDataByField', 'cuentasxpagar', 'no_factura', compra.value.no_factura);
    if (response) {
      router.push(`/editarcuentasxpagar/${response.id}`);
    } else {
      toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No existe cuenta por pagar', life: 3000 });
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar cuenta', life: 3000 });
  }
};

// =============== UTILIDADES ===============
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
};

const getSeverityEstado = (estado) => {
  const map = {
    'PENDIENTE': 'warning',
    'PAGADO': 'success',
    'CREDITO': 'info'
  };
  return map[estado] || 'secondary';
};
</script>

<template>
  <div class="editar-compra-container">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <i class="pi pi-pencil"></i>
          <div>
            <h1>Editar Compra</h1>
            <p>Modifica los detalles de la compra #{{ compra.id }}</p>
          </div>
        </div>
        <div class="header-actions">
          <Button
            label="Volver"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            @click="router.push('/compras')"
          />
          <Button
            label="Nueva"
            icon="pi pi-plus"
            severity="success"
            @click="router.push('/crearcompras')"
          />
        </div>
      </div>
    </div>

    <!-- NAVEGACIÓN -->
    <Card class="navegacion-card">
      <template #content>
        <div class="navegacion-wrapper">
          <div class="navegacion-info">
            <i class="pi pi-file"></i>
            <span>Registro {{ indiceActual + 1 }} de {{ todasLasCompras.length }}</span>
          </div>

          <div class="navegacion-controls">
            <ButtonGroup>
              <Button
                icon="pi pi-angle-double-left"
                severity="info"
                outlined
                :disabled="!puedeIrAnterior"
                @click="navegarPrimero"
                v-tooltip.top="'Primera'"
              />
              <Button
                icon="pi pi-angle-left"
                severity="info"
                outlined
                :disabled="!puedeIrAnterior"
                @click="navegarAnterior"
                v-tooltip.top="'Anterior'"
              />
              <Button
                icon="pi pi-angle-right"
                severity="info"
                outlined
                :disabled="!puedeIrSiguiente"
                @click="navegarSiguiente"
                v-tooltip.top="'Siguiente'"
              />
              <Button
                icon="pi pi-angle-double-right"
                severity="info"
                outlined
                :disabled="!puedeIrSiguiente"
                @click="navegarUltimo"
                v-tooltip.top="'Última'"
              />
            </ButtonGroup>
          </div>

          <div class="navegacion-acciones">
            <Button
              label="PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              outlined
              @click="generarPDF"
            />
            <Button
              label="Excel"
              icon="pi pi-file-excel"
              severity="success"
              outlined
              @click="exportarExcel"
            />
            <Button
              label="Saldar CxP"
              icon="pi pi-money-bill"
              severity="warning"
              outlined
              @click="saldarCuentaPorPagar"
            />
          </div>
        </div>
      </template>
    </Card>

    <div class="compra-content">
      <!-- SECCIÓN 1: PROVEEDOR -->
      <Card class="compra-section">
        <template #header>
          <div class="section-header proveedor-header">
            <i class="pi pi-building"></i>
            <span>Datos del Proveedor</span>
            <div class="header-badge">
              <Tag :value="compra.estado" :severity="getSeverityEstado(compra.estado)" />
            </div>
          </div>
        </template>
        <template #content>
          <div class="form-grid">
            <div class="form-field col-span-4">
              <label>Proveedor</label>
              <InputText
                v-model="compra.proveedor"
                placeholder="Nombre del proveedor"
              />
            </div>

            <div class="form-field col-span-2">
              <label>RNC</label>
              <InputText
                v-model="compra.rnc_proveedor"
                placeholder="RNC"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Fecha</label>
              <InputText v-model="compra.fecha" readonly />
            </div>

            <div class="form-field col-span-2">
              <label>No. Factura</label>
              <InputText v-model="compra.no_factura" />
            </div>

            <div class="form-field col-span-2">
              <label>NCF</label>
              <InputText
                v-model="compra.ncf_proveedor"
                placeholder="NCF"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- SECCIÓN 2: PRODUCTOS -->
      <Card class="compra-section">
        <template #header>
          <div class="section-header productos-header">
            <i class="pi pi-box"></i>
            <span>Productos</span>
            <div class="header-badge">
              <Tag :value="`${productosAgregados.length} productos`" severity="success" />
            </div>
          </div>
        </template>
        <template #content>
          <div v-if="productosAgregados.length > 0" class="productos-tabla">
            <DataTable
              :value="productosAgregados"
              stripedRows
              responsiveLayout="scroll"
              class="productos-datatable"
            >
              <Column field="nombre" header="Producto" style="min-width: 200px">
                <template #body="slotProps">
                  <div class="producto-cell">
                    <strong>{{ slotProps.data.nombre }}</strong>
                    <small>{{ slotProps.data.codigo }}</small>
                  </div>
                </template>
              </Column>
              <Column field="categoria" header="Categoría" />
              <Column field="marca" header="Marca" />
              <Column field="stock" header="Cant." style="width: 80px">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.stock" severity="info" />
                </template>
              </Column>
              <Column field="precio_compra" header="P. Compra" style="width: 120px">
                <template #body="slotProps">
                  {{ formatCurrency(slotProps.data.precio_compra) }}
                </template>
              </Column>
              <Column field="precio_venta" header="P. Venta" style="width: 120px">
                <template #body="slotProps">
                  {{ formatCurrency(slotProps.data.precio_venta) }}
                </template>
              </Column>
              <Column header="Subtotal" style="width: 120px">
                <template #body="slotProps">
                  <strong>{{ formatCurrency(slotProps.data.precio_compra * slotProps.data.stock) }}</strong>
                </template>
              </Column>
            </DataTable>
          </div>

          <div v-else class="no-productos">
            <i class="pi pi-inbox"></i>
            <p>No hay productos en esta compra</p>
          </div>
        </template>
      </Card>

      <!-- SECCIÓN 3: TOTALES Y ESTADO -->
      <Card class="compra-section">
        <template #header>
          <div class="section-header totales-header">
            <i class="pi pi-calculator"></i>
            <span>Totales y Estado de Compra</span>
          </div>
        </template>
        <template #content>
          <div class="form-grid">
            <div class="form-field col-span-3">
              <label>Estado</label>
              <SelectButton
                v-model="compra.estado"
                :options="estadosOptions"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
              >
                <template #option="slotProps">
                  <Tag :value="slotProps.option.label" :severity="slotProps.option.severity" />
                </template>
              </SelectButton>
            </div>

            <div class="form-field col-span-3">
              <label>Método de Pago</label>
              <Dropdown
                v-model="compra.metodo_pago"
                :options="metodoPagoOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Método de pago"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Subtotal</label>
              <InputNumber
                v-model="compra.subtotal"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                readonly
                class="total-input"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Descuento</label>
              <InputNumber
                v-model="compra.descuento"
                mode="currency"
                currency="DOP"
                locale="es-DO"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Total</label>
              <InputNumber
                v-model="compra.total"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                readonly
                class="total-input total-final"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Abono</label>
              <InputNumber
                v-model="compra.abono"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                class="abono-input"
              />
            </div>

            <div class="form-field col-span-2">
              <label>Saldo</label>
              <InputNumber
                v-model="compra.saldo"
                mode="currency"
                currency="DOP"
                locale="es-DO"
                readonly
                class="saldo-input"
              />
            </div>

            <div class="form-field col-span-12">
              <label>Notas</label>
              <Textarea
                v-model="compra.nota"
                rows="3"
                placeholder="Observaciones adicionales..."
              />
            </div>

            <div class="form-field col-span-12">
              <Button
                label="Actualizar Compra"
                icon="pi pi-check"
                severity="info"
                size="large"
                class="actualizar-compra-btn"
                :loading="loading"
                @click="actualizarCompra"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Toast />

    <!-- Modal PDF Embedido -->
    <Dialog
      v-model:visible="pdfDialogVisible"
      modal
      :style="{ width: '90vw', height: '90vh' }"
      header="Compra de Productos - PDF"
      :dismissableMask="true"
    >
      <template #header>
        <div class="pdf-dialog-header">
          <div class="pdf-header-info">
            <i class="pi pi-file-pdf"></i>
            <span>Compra #{{ compra.no_factura }}</span>
          </div>
          <Button
            label="Descargar"
            icon="pi pi-download"
            severity="success"
            size="small"
            @click="() => {
              const link = document.createElement('a');
              link.href = pdfUrl;
              link.download = `Compra_${compra.no_factura || compra.id}.pdf`;
              link.click();
            }"
          />
        </div>
      </template>

      <div class="pdf-viewer-container">
        <iframe
          v-if="pdfUrl"
          :src="pdfUrl"
          class="pdf-iframe"
          frameborder="0"
        ></iframe>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.editar-compra-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 2rem;
}

.page-header {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-title > i {
  font-size: 3rem;
  color: #6366f1;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-title h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-title p {
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.navegacion-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
}

.navegacion-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0;
}

.navegacion-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #6b7280;
  font-weight: 600;
}

.navegacion-info i {
  font-size: 1.25rem;
  color: #6366f1;
}

.navegacion-controls {
  flex: 1;
  display: flex;
  justify-content: center;
}

.navegacion-acciones {
  display: flex;
  gap: 0.75rem;
}

.compra-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.compra-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.section-header i {
  font-size: 1.5rem;
}

.header-badge {
  margin-left: auto;
}

.proveedor-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.productos-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.totales-header {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  padding: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-4 { grid-column: span 4; }
.col-span-6 { grid-column: span 6; }
.col-span-12 { grid-column: span 12; }

.productos-tabla {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.producto-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.producto-cell strong {
  color: #1f2937;
}

.producto-cell small {
  color: #6b7280;
  font-size: 0.75rem;
}

.no-productos {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.no-productos i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.total-input :deep(.p-inputnumber-input) {
  font-weight: 600;
  color: #2563eb;
}

.total-final :deep(.p-inputnumber-input) {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2563eb;
}

.abono-input :deep(.p-inputnumber-input) {
  font-weight: 600;
  color: #10b981;
}

.saldo-input :deep(.p-inputnumber-input) {
  font-weight: 600;
  color: #dc2626;
}

.actualizar-compra-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
}

.actualizar-compra-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

@media (max-width: 768px) {
  .editar-compra-container {
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .col-span-1,
  .col-span-2,
  .col-span-3,
  .col-span-4,
  .col-span-6 {
    grid-column: span 6;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
  }

  .navegacion-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .navegacion-info {
    justify-content: center;
  }

  .navegacion-controls {
    justify-content: center;
  }

  .navegacion-acciones {
    width: 100%;
  }

  .navegacion-acciones button {
    flex: 1;
  }
}

/* PDF Dialog */
.pdf-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
}

.pdf-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.pdf-header-info i {
  font-size: 1.5rem;
  color: #dc2626;
}

.pdf-viewer-container {
  width: 100%;
  height: calc(90vh - 120px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
}

:deep(.p-dialog-header) {
  padding: 1.5rem;
}

:deep(.p-dialog-content) {
  padding: 0 1.5rem 1.5rem 1.5rem;
}
</style>
