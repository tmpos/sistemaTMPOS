<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useRoute} from 'vue-router';
import { useToast } from "primevue/usetoast";
import router from '../../router';
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, enviarSolicitudGet, generarCodigoUnico, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import JsBarcode from "jsbarcode";
//import config from '../../../../../resources/config.json';
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
const datosEmpresa = useDatosEmpresa();
//const production = config.VITE_PRODUCTION;
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref(null);
/************************************************************************/
document.body.classList.add('sidebar-close');
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const todosLosNotacredito = ref([]);
/************************************************************************/
/************************************************************************/
const fetchAllData = async () => {
    const columnas = await peticionesFetchOffline('getTableColumns', 'notacredito');
    if (!columnas.includes('estado')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'notacredito', campo: 'estado' });
      await peticionesFetchOffline('updateEntireColumn', 'notacredito', 'estado', 'DISPONIBLE');
    }
    if (!columnas.includes('fecha_uso')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'notacredito', campo: 'fecha_uso' });
    }
    if (!columnas.includes('hora_uso')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'notacredito', campo: 'hora_uso' });
    }
    const response = await peticionesFetchOffline('getDataAsArray', 'notacredito');
    const jsonData = response;
    todosLosNotacredito.value = jsonData;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
    if (datoscampos.value && !datoscampos.value.estado) {
      datoscampos.value.estado = 'DISPONIBLE';
    }
};
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosNotacredito.value.findIndex(notacredito => notacredito.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosNotacredito.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosNotacredito.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosNotacredito.value[newIndex];
    router.push({ path: `/editarnotacredito/${todosLosNotacredito.value[newIndex].id}` });
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


fetchAllData()
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/notacredito";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData', 'notacredito', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
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
  doc.text(`No. Crédito: ${datoscampos.value.no_credito}`, marginX + 2, startY - 5);
  doc.text(`No. Factura: ${datoscampos.value.no_factura}`, marginX + 2, startY);
  doc.text(`Cliente: ${datoscampos.value.cliente}`, marginX + 2, startY + 5);
  doc.text(`Código Cliente: ${datoscampos.value.cod_cliente}`, marginX + 2, startY + 10);
  doc.text(`Fecha: ${datoscampos.value.fecha} - Hora: ${datoscampos.value.hora}`, marginX + 2, startY + 15);
  doc.text(`NCF: ${datoscampos.value.ncf}`, marginX + 2, startY + 20);

  doc.setFillColor(0, 0, 0);
  doc.rect(marginX, 105, tamX, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("NOTA DE CRÉDITO", tamX / 2 - 15, 112);
  doc.setTextColor(0, 0, 0);

  startY += 35;

  // 📌 Generar tabla con `jspdf-autotable`
autoTable(doc, {
  startY,
  margin: { left: marginX, right: marginX },
  head: [['Concepto', 'Total']],
  body: [[datoscampos.value.concepto, `RD$ ${datoscampos.value.total}`]],
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

    doc.text("Firma de "+datoscampos.value.cliente, pageWidth / 2, startY + 35 , { align: "center" });

    startY += 40;

   //aqui quiero creau un codigo de barra que quede centrada

 // 📌 Generar código de barras centrado
  const barcodeData = await generateBarcode(datoscampos.value.no_credito);
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
</script>
<template>
  <main class="edit-credit-wrapper">
    <div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <section class="credit-hero shadow-lg">
        <div class="credit-hero__text">
          <p class="eyebrow">Editar nota de credito</p>
          <h1>Actualiza y valida la nota</h1>
          <p>Revisa los datos, ajusta campos clave y genera una impresion clara.</p>
          <div class="credit-hero__meta">
            <span class="meta-pill">
              <i class="pi pi-hashtag"></i>
              ID {{ datoscampos.id || '---' }}
            </span>
            <span class="meta-pill">
              <i class="pi pi-calendar"></i>
              {{ datoscampos.fecha || 'Sin fecha' }}
            </span>
          </div>
        </div>
        <div class="credit-hero__actions">
          <div class="nav-grid">
            <Button icon="pi pi-angle-double-left" label="Primero" text @click="navigate('primero')" />
            <Button icon="pi pi-angle-left" label="Anterior" text @click="navigate('anterior')" />
            <Button icon="pi pi-angle-right" label="Siguiente" text @click="navigate('siguiente')" />
            <Button icon="pi pi-angle-double-right" label="Ultimo" text @click="navigate('ultimo')" />
          </div>
          <div class="primary-actions">
            <router-link to="/notacredito">
              <Button icon="pi pi-arrow-left" label="Volver a listado" severity="secondary" outlined />
            </router-link>
            <router-link to="/crearnotacredito">
              <Button icon="pi pi-plus" label="Nueva nota" severity="success" />
            </router-link>
            <Button icon="pi pi-print" label="Imprimir" severity="info" outlined @click="fnPrint" />
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Formulario</p>
            <h2>Datos de la nota de credito</h2>
            <span class="helper-text">Completa o ajusta los campos requeridos y guarda los cambios.</span>
          </div>
          <div class="save-zone">
            <Button icon="pi pi-save" label="Guardar cambios" severity="primary" @click="funcionActualizar" />
          </div>
        </div>

        <form @submit.prevent="funcionActualizar">
          <div class="form-grid">
            <input type="hidden" v-model="datoscampos.id" />
            <div class="field">
              <label for="no_credito-Actualizador">No credito</label>
              <input id="no_credito-Actualizador" v-model="datoscampos.no_credito" type="text" placeholder="No credito" maxlength="250" />
            </div>
            <div class="field">
              <label for="no_factura-Actualizador">No factura</label>
              <input id="no_factura-Actualizador" v-model="datoscampos.no_factura" type="text" placeholder="No factura" maxlength="250" />
            </div>
            <div class="field">
              <label for="b04-Actualizador">B04</label>
              <input id="b04-Actualizador" v-model="datoscampos.b04" type="text" placeholder="B04" />
            </div>
            <div class="field">
              <label for="ncf-Actualizador">NCF</label>
              <input id="ncf-Actualizador" v-model="datoscampos.ncf" type="text" placeholder="NCF" />
            </div>
            <div class="field full">
              <label for="cliente-Actualizador">Cliente</label>
              <input id="cliente-Actualizador" v-model="datoscampos.cliente" type="text" placeholder="Cliente" maxlength="250" />
            </div>
            <div class="field">
              <label for="cod_cliente-Actualizador">Codigo cliente</label>
              <input id="cod_cliente-Actualizador" v-model="datoscampos.cod_cliente" type="text" placeholder="Codigo cliente" maxlength="250" />
            </div>
            <div class="field full">
              <label for="concepto-Actualizador">Concepto</label>
              <textarea id="concepto-Actualizador" v-model="datoscampos.concepto" rows="3" placeholder="Detalle de la nota"></textarea>
            </div>
            <div class="field">
              <label for="total-Actualizador">Total</label>
              <input id="total-Actualizador" v-model="datoscampos.total" type="text" placeholder="Total" maxlength="250" />
            </div>
            <div class="field">
              <label for="estado-Actualizador">Estado</label>
              <select id="estado-Actualizador" v-model="datoscampos.estado">
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="USADA">USADA</option>
              </select>
            </div>
            <div class="field">
              <label for="fecha_uso-Actualizador">Fecha uso</label>
              <input id="fecha_uso-Actualizador" v-model="datoscampos.fecha_uso" type="text" placeholder="Fecha uso" maxlength="250" />
            </div>
            <div class="field">
              <label for="hora_uso-Actualizador">Hora uso</label>
              <input id="hora_uso-Actualizador" v-model="datoscampos.hora_uso" type="text" placeholder="Hora uso" maxlength="250" />
            </div>
            <div class="field">
              <label for="fecha-Actualizador">Fecha</label>
              <input id="fecha-Actualizador" v-model="datoscampos.fecha" type="text" placeholder="Fecha" maxlength="250" />
            </div>
            <div class="field">
              <label for="hora-Actualizador">Hora</label>
              <input id="hora-Actualizador" v-model="datoscampos.hora" type="text" placeholder="Hora" maxlength="250" />
            </div>
            <div class="field full">
              <label for="nota-Actualizador">Nota</label>
              <textarea id="nota-Actualizador" v-model="datoscampos.nota" rows="3" placeholder="Nota adicional"></textarea>
            </div>
          </div>
          <div class="form-footer">
            <Button type="submit" icon="pi pi-save" label="Actualizar datos" severity="primary" class="w-full md:w-auto" />
          </div>
        </form>
      </section>
      <Toast />
    </div>
  </main>
</template>
<style scoped>
.edit-credit-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #ffffff 100%);
  color: #0f172a;
}

.credit-hero {
  background: linear-gradient(135deg, #0f172a, #1e293b 45%, #0ea5e9);
  color: #e2e8f0;
  border-radius: 18px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.credit-hero__text h1 {
  margin: 4px 0 8px;
  font-size: 1.8rem;
  font-weight: 800;
}

.credit-hero__text p {
  margin: 0;
  color: #cbd5e1;
}

.credit-hero__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(226, 232, 240, 0.12);
  color: #e2e8f0;
  padding: 8px 12px;
  border-radius: 9999px;
  font-size: 0.9rem;
  border: 1px solid rgba(226, 232, 240, 0.2);
}

.credit-hero__actions {
  display: grid;
  gap: 12px;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.primary-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.panel {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
}

.panel__header h2 {
  margin: 2px 0 4px;
  font-size: 1.4rem;
  color: #0f172a;
}

.helper-text {
  color: #64748b;
  font-size: 0.95rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #0ea5e9;
  margin: 0;
  font-size: 0.85rem;
}

.save-zone {
  display: flex;
  align-items: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full {
  grid-column: 1 / -1;
}

.field label {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
}

.field input:focus,
.field textarea:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
}

.form-footer {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .credit-hero {
    padding: 18px;
  }

  .panel {
    padding: 16px;
  }

  .primary-actions {
    flex-direction: column;
  }

  .form-footer {
    justify-content: stretch;
  }
}
</style>
