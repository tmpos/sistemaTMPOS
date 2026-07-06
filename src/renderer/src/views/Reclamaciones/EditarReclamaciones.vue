
<script setup>
import { ref, onMounted, nextTick, watchEffect, computed } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, generarCodigoUnico, peticiones, enviarSolicitudGet, transformarFechaTimestamp, formatearFecha, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import JsBarcode from "jsbarcode";
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
/************************************************************************/
const value = ref('0');
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
const todosLosreclamaciones = ref([]);
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'reclamaciones');
    const jsonData = response;
    todosLosreclamaciones.value = response;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
};
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosreclamaciones.value.findIndex(notacredito => notacredito.id == route.params.id);
    if (currentIndex === -1) return;
    let newIndex;
    switch (action) {
        case 'primero':
            newIndex = 0;
            break;
        case 'anterior':
            newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            break;
        case 'siguiente':
            newIndex = currentIndex + 1 < todosLosreclamaciones.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosreclamaciones.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosreclamaciones.value[newIndex];
    router.push({ path: `/editarreclamaciones/${todosLosreclamaciones.value[newIndex].id}` });
}
/************************************************************************/
onMounted(async() => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCifrado.value = await encryptarPassword(token.value, 10);
await fetchAllData()
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/reclamaciones";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }

  datoscampos.value.fecha_respuesta = formatearFecha(datoscampos.value.fecha_respuesta);
  datoscampos.value.fecha_emision = formatearFecha(datoscampos.value.fecha_emision);
  datoscampos.value.fecha_vencimiento = formatearFecha(datoscampos.value.fecha_vencimiento);
  datoscampos.value.fecha_compra = formatearFecha(datoscampos.value.fecha_compra);
  datoscampos.value.fecha_cierre = formatearFecha(datoscampos.value.fecha_cierre) || '';


  const envioDatos = await peticionesFetchOffline('updateData', 'reclamaciones', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
/************************************************************************/
const fnPrint = async () => {
  const { isConfirmed } = await Swal.fire({
    title: 'Seleccionar formato de impresión',
    text: "Elige el formato en que deseas imprimir la Nota de Crédito",
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Grande (A4)',
    cancelButtonText: 'Ticket (80mm)'
  });

  if (isConfirmed) {
    generarPDF('grande');
  } else {
    generarPDF('ticket');
  }
};

/************************************************************************/
const getBase64ImageFromURL = async (url, maxWidth, maxHeight) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const img = await createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Calculate the new dimensions while preserving the aspect ratio
  let width = img.width;
  let height = img.height;

  if (width > maxWidth) {
    height *= maxWidth / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width *= maxHeight / height;
    height = maxHeight;
  }

  canvas.width = width;
  canvas.height = height;

  // Enable image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0, width, height);

  // Convert the canvas content to a Base64 string
  return new Promise((resolve) => {
    resolve(canvas.toDataURL());
  });
};


/************************************************************************/
// 📌 Función para generar código de barras en Base64
const generateBarcode = async (text) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "CODE128",
      height: 40
    });
    resolve(canvas.toDataURL("image/png"));
  });
};
/************************************************************************/
const generarPDF = async (tipo) => {
  if (!datoscampos.value) {
    Swal.fire('Error', 'No hay datos para generar el PDF', 'error');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: tipo === 'ticket' ? [80, 250] : 'a4'
  });

  let marginX = 15;
  if(tipo === 'ticket'){
     marginX = 5;
  }

  doc.setFont("helvetica", "bold");
 // 📌 Configurar datos de la empresa
const empresa = datosEmpresa.empresa || {};
const nombreEmpresa = empresa.nombre || "TMPOS SRL";
const legalEmpresa = empresa.legal || "RNC: 123456789";
const telefonoEmpresa = empresa.telefono || "+1 (829) 784-2912";
const emailEmpresa = empresa.email || "demo@tmposrd.com";
const direccionEmpresa = empresa.direccion || "57-19 Cooper Ave, Queens";

let startY = 10;
const pageWidth = doc.internal.pageSize.getWidth(); // 📌 Ancho de la página

  // Dibujar rectángulos redondeados
  const drawRoundedRect = (x, y, width, height, radius) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, width, height, radius, radius);
  };


// 📌 Agregar logo centrado si está disponible
if (empresa.logoprinter) {
  const logoBase64 = await getBase64ImageFromURL(empresa.logoprinter, 60, 60);
  if (logoBase64) {
    const logoWidth = 30; // 📌 Tamaño del logo
    const logoX = (pageWidth - logoWidth) / 2; // 📌 Calcular centro
    doc.addImage(logoBase64, "PNG", logoX, startY, logoWidth, 25);
    startY += 30; // 📌 Espacio después del logo
  }
}

// 📌 Agregar datos de la empresa centrados
doc.setFontSize(12);
doc.text(nombreEmpresa, pageWidth / 2, startY, { align: "center" });
doc.setFontSize(10);
doc.text(legalEmpresa, pageWidth / 2, startY + 5, { align: "center" });
doc.text(telefonoEmpresa, pageWidth / 2, startY + 10, { align: "center" });
doc.text(emailEmpresa, pageWidth / 2, startY + 15, { align: "center" });
doc.text(direccionEmpresa, pageWidth / 2, startY + 20, { align: "center" });

startY += 30; // 📌 Espacio antes del título


  // 📌 Agregar título
/*  doc.setFontSize(14);
  doc.text("NOTA DE CRÉDITO", tipo === 'ticket' ? 20 : 105, startY, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");*/


  // 📌 Contenido principal
  startY += 10;


  let tamX = doc.internal.pageSize.getWidth();

    if(tipo != 'ticket'){
      tamX = tamX - 30; 
    }else{
      tamX = 70; 
    }

  drawRoundedRect(marginX, 70, tamX, 50, 1);
  doc.text(`No. Reclamación: ${datoscampos.value.no_reclamacion}`, marginX + 2, startY - 5);
  doc.text(`No. Factura: ${datoscampos.value.no_factura}`, marginX + 2, startY);
  doc.text(`Cliente: ${datoscampos.value.nombre}`, marginX + 2, startY + 5);
  doc.text(`Teléfono Cliente: ${datoscampos.value.telefono}`, marginX + 2, startY + 10);
  doc.text(`Fecha: ${datoscampos.value.fecha_emision}`, marginX + 2, startY + 15);
  doc.text(`Fecha Respuesta: ${datoscampos.value.fecha_respuesta}`, marginX + 2, startY + 20);

  doc.setFillColor(0, 0, 0);
  doc.rect(marginX, 105, tamX, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("RECLAMACION", tamX / 2 - 15, 112);
  doc.setTextColor(0, 0, 0);

  startY += 35;

  // 📌 Generar tabla con `jspdf-autotable`
autoTable(doc, {
  startY,
  margin: { left: marginX, right: marginX },
  head: [['Articulo']],
  body: [[datoscampos.value.articulo_reclamado]],
  theme: 'plain', // 📌 Usa un diseño sin bordes ni fondo
  styles: {
    fontSize: tipo === 'ticket' ? 8 : 10,
    fillColor: false, // 📌 Elimina cualquier color de fondo
  },
  headStyles: {
    fillColor: [255, 255, 255], // 📌 Asegura que el encabezado no tenga fondo
    textColor: [0, 0, 0], // 📌 Color del texto en negro
  },
  bodyStyles: {
    fillColor: false, // 📌 Asegura que el cuerpo no tenga fondo
  },
  alternateRowStyles: {
    fillColor: false, // 📌 Evita que las filas alternas tengan fondo
  }
});

   startY += 35;
//aqui se debe agregar la Nota datoscampos.value.nota
if (datoscampos.value.nota) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // 📌 Definir ancho de texto (sin pasarse del margen)
  const textWidth = pageWidth - 30;
  
  // 📌 Dividir la nota en líneas manejables dentro del ancho definido
  const notaLines = doc.splitTextToSize(datoscampos.value.nota, textWidth);
  
  // 📌 Agregar título "Nota" centrado
  doc.setFont("helvetica", "bold");
  doc.text("Nota:", pageWidth / 2, startY, { align: "center" });

  // 📌 Agregar la nota debajo
  doc.setFont("helvetica", "normal");
  doc.text(notaLines, marginX, startY + 5);
  
  // 📌 Ajustar startY después de la nota
  startY += notaLines.length * 5 + 10;
}

   //startY += 35;

const lineWidth = 60; // 📌 Define el ancho de la línea
const lineXStart = (pageWidth - lineWidth) / 2; // 📌 Calcula el punto inicial centrado
const lineXEnd = lineXStart + lineWidth; // 📌 Calcula el punto final centrado

doc.line(lineXStart, startY + 30, lineXEnd, startY + 30);

    doc.text("Firma de "+datoscampos.value.nombre, pageWidth / 2, startY + 35 , { align: "center" });

    startY += 40;

   //aqui quiero creau un codigo de barra que quede centrada

 // 📌 Generar código de barras centrado
  const barcodeData = await generateBarcode(datoscampos.value.no_reclamacion);
  if (barcodeData) {
    const barcodeWidth = 60;
    const barcodeX = (pageWidth - barcodeWidth) / 2;
    doc.addImage(barcodeData, "PNG", barcodeX, startY, barcodeWidth, 20);
  }



  // 📌 Mostrar PDF en un Swal con `<embed>`
  const pdfData = doc.output('datauristring');
  Swal.fire({
    title: 'Vista previa de la Nota de Crédito',
    width: '80%',
    html: `<embed src="${pdfData}" type="application/pdf" width="100%" height="500px" />`,
    showCloseButton: true,
    showCancelButton: true,
    cancelButtonText: 'Cerrar',
    confirmButtonText: 'Imprimir',
    preConfirm: () => {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  });
};
/************************************************************************/
const currentIndex = computed(() => {
  return todosLosreclamaciones.value.findIndex(reclamacion => reclamacion.id == route.params.id);
});

const isFirst = computed(() => currentIndex.value === 0);
const isLast = computed(() => currentIndex.value === todosLosreclamaciones.value.length - 1);
/************************************************************************/
</script>
<template>
<main class="editar-reclamacion-container">
  <div class="w-full">
    <!-- Header Profesional -->
    <div class="editar-reclamacion-header mb-4">
      <div class="editar-reclamacion-header-content">
        <div class="editar-reclamacion-icon-wrapper">
          <i class="pi pi-pencil editar-reclamacion-icon"></i>
        </div>
        <div>
          <h1 class="editar-reclamacion-title">Editar Reclamación</h1>
          <p class="editar-reclamacion-subtitle">Modificar información de reclamación #{{ datoscampos.no_reclamacion }}</p>
        </div>
      </div>
    </div>

    <!-- Toolbar de Navegación y Acciones -->
    <Card class="mb-4 toolbar-card">
      <template #content>
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <router-link to="/reclamaciones">
              <Button icon="pi pi-home" label="Volver" severity="secondary" class="btn-action" />
            </router-link>
            <router-link to="/crearreclamaciones">
              <Button icon="pi pi-plus" label="Nueva Reclamación" severity="success" class="btn-action" />
            </router-link>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              icon="pi pi-step-backward-alt"
              @click="navigate('primero')"
              :disabled="isFirst"
              severity="secondary"
              v-tooltip.bottom="'Primero'"
              class="btn-nav"
            />
            <Button
              icon="pi pi-chevron-left"
              @click="navigate('anterior')"
              :disabled="isFirst"
              severity="secondary"
              v-tooltip.bottom="'Anterior'"
              class="btn-nav"
            />
            <Button
              icon="pi pi-chevron-right"
              @click="navigate('siguiente')"
              :disabled="isLast"
              severity="secondary"
              v-tooltip.bottom="'Siguiente'"
              class="btn-nav"
            />
            <Button
              icon="pi pi-step-forward-alt"
              @click="navigate('ultimo')"
              :disabled="isLast"
              severity="secondary"
              v-tooltip.bottom="'Último'"
              class="btn-nav"
            />
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              icon="pi pi-print"
              label="Imprimir"
              @click="fnPrint"
              severity="secondary"
              class="btn-action"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Formulario de Edición -->
    <form @submit.prevent="funcionActualizar">
      <Card class="mb-4 form-card">
        <template #content>
          <div class="flex mb-3 gap-2 justify-end tab-indicators">
            <Button @click="value = '0'" rounded label="1" class="tab-indicator" :outlined="value !== '0'" severity="danger" />
            <Button @click="value = '1'" rounded label="2" class="tab-indicator" :outlined="value !== '1'" severity="danger" />
            <Button @click="value = '2'" rounded label="3" class="tab-indicator" :outlined="value !== '2'" severity="danger" />
          </div>

          <Tabs v-model:value="value" class="modern-tabs">
            <TabList>
              <Tab value="0">
                <i class="pi pi-user mr-2"></i>
                Datos Cliente
              </Tab>
              <Tab value="1">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                Detalles Reclamación
              </Tab>
              <Tab value="2">
                <i class="pi pi-check-square mr-2"></i>
                Resultado Reclamación
              </Tab>
            </TabList>

            <TabPanels>
              <!-- TAB 1: Datos Cliente -->
              <TabPanel value="0">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div class="md:col-span-2">
                    <label class="field-label">
                      <i class="pi pi-user mr-2"></i>
                      Nombre Completo
                    </label>
                    <InputText
                      v-model="datoscampos.nombre"
                      v-mayuscula
                      placeholder="Nombre completo del cliente"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-phone mr-2"></i>
                      Teléfono
                    </label>
                    <InputText
                      v-model="datoscampos.telefono"
                      v-maska="patronTelefono"
                      placeholder="Teléfono"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-whatsapp mr-2"></i>
                      WhatsApp
                    </label>
                    <InputText
                      v-model="datoscampos.whatsapp"
                      v-maska="patronTelefono"
                      placeholder="WhatsApp"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-envelope mr-2"></i>
                      Email
                    </label>
                    <InputText
                      v-model="datoscampos.email"
                      placeholder="Correo electrónico"
                      class="w-full"
                      type="email"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-building mr-2"></i>
                      Institución
                    </label>
                    <Dropdown
                      editable
                      v-model="datoscampos.institucion"
                      :options="['']"
                      placeholder="Seleccione institución"
                      class="w-full"
                    />
                  </div>
                </div>
              </TabPanel>

              <!-- TAB 2: Detalles Reclamación -->
              <TabPanel value="1">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label class="field-label">
                      <i class="pi pi-hashtag mr-2"></i>
                      No. Reclamación
                    </label>
                    <InputText
                      v-model="datoscampos.no_reclamacion"
                      readonly
                      disabled
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-calendar mr-2"></i>
                      Fecha Emisión
                    </label>
                    <InputText
                      v-model="datoscampos.fecha_emision"
                      readonly
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-calendar-plus mr-2"></i>
                      Fecha Respuesta
                    </label>
                    <DatePicker
                      v-model="datoscampos.fecha_respuesta"
                      showButtonBar
                      fluid
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-calendar-times mr-2"></i>
                      Fecha Vencimiento
                    </label>
                    <DatePicker
                      v-model="datoscampos.fecha_vencimiento"
                      showButtonBar
                      fluid
                      class="w-full"
                    />
                  </div>

                  <div class="md:col-span-2">
                    <label class="field-label">
                      <i class="pi pi-align-left mr-2"></i>
                      Descripción de la Reclamación
                    </label>
                    <Textarea
                      v-model="datoscampos.descripcion_reclamo"
                      rows="4"
                      placeholder="Detalle completo de la reclamación..."
                      class="w-full"
                    />
                  </div>

                  <div class="md:col-span-2">
                    <label class="field-label">
                      <i class="pi pi-box mr-2"></i>
                      Artículo Reclamado
                    </label>
                    <InputText
                      v-model="datoscampos.articulo_reclamado"
                      v-mayuscula
                      placeholder="Nombre del artículo o servicio reclamado"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-calendar mr-2"></i>
                      Fecha de Compra
                    </label>
                    <DatePicker
                      v-model="datoscampos.fecha_compra"
                      showButtonBar
                      fluid
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-tag mr-2"></i>
                      Estado de Reclamación
                    </label>
                    <Dropdown
                      editable
                      v-model="datoscampos.estado_reclamacion"
                      :options="['PENDIENTE','EN PROCESO','RESUELTA','CERRADA']"
                      placeholder="Seleccione estado"
                      class="w-full"
                    />
                  </div>

                  <div class="md:col-span-2">
                    <label class="field-label">
                      <i class="pi pi-chart-line mr-2"></i>
                      Resultado de Reclamación
                    </label>
                    <Dropdown
                      editable
                      v-model="datoscampos.resultado_reclamacion"
                      :options="['EN ESPERA','FAVORABLE','DESFAVORABLE','PARCIAL']"
                      placeholder="Seleccione resultado"
                      class="w-full"
                    />
                  </div>
                </div>
              </TabPanel>

              <!-- TAB 3: Resultado Reclamación -->
              <TabPanel value="2">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div class="md:col-span-2">
                    <label class="field-label">
                      <i class="pi pi-comment mr-2"></i>
                      Respuesta de la Reclamación
                    </label>
                    <Textarea
                      v-model="datoscampos.respuesta_reclamo"
                      rows="5"
                      placeholder="Ingrese la respuesta detallada de la reclamación..."
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-calendar-times mr-2"></i>
                      Fecha de Cierre
                    </label>
                    <DatePicker
                      v-model="datoscampos.fecha_cierre"
                      showButtonBar
                      fluid
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-user-edit mr-2"></i>
                      Representante
                    </label>
                    <InputText
                      v-model="datoscampos.representante"
                      v-mayuscula
                      placeholder="Nombre del representante"
                      class="w-full"
                    />
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </template>
      </Card>

      <!-- Botón de Actualizar -->
      <Button
        type="submit"
        label="Actualizar Reclamación"
        icon="pi pi-save"
        class="w-full btn-submit"
        size="large"
      />
    </form>
  </div>

  <Toast />
</main>
</template>
<style scoped>
/* ===== Container Principal ===== */
.editar-reclamacion-container {
  padding: 1rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  min-height: 100vh;
}

/* ===== Header Profesional ===== */
.editar-reclamacion-header {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
  animation: slideIn 0.5s ease-out;
}

.editar-reclamacion-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editar-reclamacion-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.editar-reclamacion-icon {
  font-size: 1.75rem;
  color: white;
}

.editar-reclamacion-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editar-reclamacion-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* ===== Toolbar Card ===== */
.toolbar-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
}

.toolbar-card :deep(.p-card-body) {
  padding: 1rem;
}

.toolbar-card :deep(.p-card-content) {
  padding: 0;
}

.btn-action,
.btn-nav {
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-action:hover,
.btn-nav:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ===== Form Card ===== */
.form-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
  animation: fadeIn 0.5s ease-out;
}

.form-card :deep(.p-card-body) {
  padding: 0;
}

.form-card :deep(.p-card-content) {
  padding: 1.25rem;
}

/* ===== Field Labels ===== */
.field-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.field-label i {
  color: #dc2626;
  font-size: 0.875rem;
}

/* ===== Tab Indicators ===== */
.tab-indicators {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.75rem;
}

.tab-indicator {
  width: 2.5rem;
  height: 2.5rem;
  font-weight: 700;
  transition: all 0.3s ease;
}

.tab-indicator:not([data-p-disabled]):not(:disabled):hover {
  transform: scale(1.1);
}

/* ===== Modern Tabs ===== */
.modern-tabs :deep(.p-tablist) {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 8px;
  padding: 0.5rem;
  border: none;
  gap: 0.5rem;
}

.modern-tabs :deep(.p-tab) {
  background: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
  padding: 0.875rem 1.5rem;
}

.modern-tabs :deep(.p-tab:hover) {
  background: #fee2e2;
  color: #dc2626;
  transform: translateY(-2px);
}

.modern-tabs :deep(.p-tab[data-p-active="true"]) {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.modern-tabs :deep(.p-tab[data-p-active="true"]):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.modern-tabs :deep(.p-tabpanels) {
  background: transparent;
  padding: 0;
  border: none;
}

.modern-tabs :deep(.p-tabpanel) {
  background: transparent;
}

/* ===== Input Styles ===== */
.editar-reclamacion-container :deep(.p-inputtext),
.editar-reclamacion-container :deep(.p-dropdown),
.editar-reclamacion-container :deep(.p-calendar),
.editar-reclamacion-container :deep(.p-textarea),
.editar-reclamacion-container :deep(.p-inputgroup) {
  transition: all 0.3s ease;
}

.editar-reclamacion-container :deep(.p-inputtext:focus),
.editar-reclamacion-container :deep(.p-dropdown:focus),
.editar-reclamacion-container :deep(.p-calendar:focus-within),
.editar-reclamacion-container :deep(.p-textarea:focus) {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.editar-reclamacion-container :deep(.p-inputtext:disabled),
.editar-reclamacion-container :deep(.p-inputtext[readonly]) {
  background-color: #f3f4f6;
  color: #6b7280;
  opacity: 0.7;
}

/* ===== Submit Button ===== */
.btn-submit {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border: none;
  font-size: 1.125rem;
  font-weight: 700;
  padding: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-submit:hover {
  background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
}

.btn-submit:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

/* ===== Animations ===== */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Responsive Design ===== */
@media (max-width: 1024px) {
  .editar-reclamacion-container {
    padding: 0.75rem;
  }

  .editar-reclamacion-header {
    padding: 1.25rem;
  }

  .editar-reclamacion-title {
    font-size: 1.5rem;
  }

  .modern-tabs :deep(.p-tab) {
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 640px) {
  .editar-reclamacion-container {
    padding: 0.5rem;
  }

  .editar-reclamacion-header {
    padding: 1rem;
  }

  .editar-reclamacion-header-content {
    flex-direction: column;
    text-align: center;
  }

  .editar-reclamacion-title {
    font-size: 1.25rem;
  }

  .editar-reclamacion-subtitle {
    font-size: 0.75rem;
  }

  .modern-tabs :deep(.p-tab) {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
  }

  .modern-tabs :deep(.p-tablist) {
    flex-direction: column;
  }

  .btn-submit {
    font-size: 1rem;
    padding: 0.875rem;
  }

  .tab-indicators {
    justify-content: center;
  }
}
</style>

