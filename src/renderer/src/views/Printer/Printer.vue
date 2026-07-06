<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, formatoMonedaRD } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
import QrcodeVue from 'qrcode';
import { useDatosEmpresa } from '@/stores'
import html2pdf from 'html2pdf.js';
const toast = useToast();
const router = useRouter();
const route = useRoute();
const usuarioLocal = ref({});
const qrCodeData = ref(null);
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const visible = ref(false);
const visiblecrear = ref(false);
const datosCliente = ref({});

const tipofact = ref('facturas')
const tipoDoc = ref('factura')
const noFact = ref('no_factura')
const numeroDoc = ref('000000')


const datosFactura = ref({
  productos: [] // Inicializar productos como un array vacío
});

const minHeight = 40; // Altura mínima en mm
const rowHeight = 6;  // Altura de cada fila en mm

const fillerRows = computed(() => {
  const rowsNeeded = Math.ceil(minHeight / rowHeight);
  const actualRows = datosFactura.value.productos ? datosFactura.value.productos.length : 0;
  return Math.max(0, rowsNeeded - actualRows);
});

/*************************************************************/
const datosUsuario = async(clienteCode)=>{
const response = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/clientes/codigo/${clienteCode}`, {}, tokenCifrado.value, 'GET');
    datosCliente.value = response;

}
/*************************************************************/
const datosdeFactura = async () => {
  const response = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/${tipofact.value}/${noFact.value}/${route.params.factura}`, {}, tokenCifrado.value, 'GET');
    datosFactura.value = response;

    await datosUsuario(datosFactura.value.cod_cliente)

   numeroDoc.value = route.params.tipo === 'facturas' ? response.no_factura : response.no_cotizacion;
  datosFactura.value.productos = JSON.parse(response.productos);
  qrCodeData.value = await QrcodeVue.toDataURL(`${link.value}/receipt/factura?${tipoDoc.value}=${numeroDoc.value}`);
}
/**********************************************************/
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
  linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
  patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
  tokenCifrado.value = await encryptarPassword(token.value, 10);

if (route.params.tipo) {
  tipofact.value = route.params.tipo;
  noFact.value = route.params.tipo === 'facturas' ? 'no_factura' : 'no_cotizacion';
  tipoDoc.value = route.params.tipo === 'facturas' ? 'factura' : 'cotizacion';
} else {
  // Asignar valores por defecto si route.params.tipo no existe
  tipofact.value = 'facturas';
  noFact.value = 'no_factura';
  tipoDoc.value = 'factura';
}

  await datosdeFactura();
});
/**********************************************************/

const fnRegresar = () => {
  router.push('/editarfacturas/' + datosFactura.value.id);
}

const formateoNumerosDecimales = (numero) => {
  return formatoMonedaRD(numero);
}
const formattedNota = computed(() => {
  if (datosFactura.value.nota) {
    return `<strong>OBSERVACION:</strong><br>${datosFactura.value.nota.replace(/\n/g, '<br>')}`;
  }
  return '';
});


    const generarPDF = async () => {
      const elemento = document.getElementById("printMe");
      const opciones = {
        margin: [5, 10, 10, 10],
        filename: `${tipoDoc.value}_${numeroDoc.value}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      };
      try {
        const esIOS = /iPad|iPhone|Macintosh/.test(navigator.userAgent);
        let newWindow = null;
        if (esIOS) {
          newWindow = window.open("", "_blank");
          if (!newWindow) {
            Swal.fire("⚠️", "Permite las ventanas emergentes para ver el PDF.", "info");
            return;
          }
          newWindow.document.write("<p>Generando PDF...</p>");
        }
        const pdfBlob = await html2pdf().set(opciones).from(elemento).output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        if (esIOS && newWindow) {
          newWindow.location.href = pdfUrl;
          return;
        }
        Swal.fire({
          title: "📄 PDF Generado",
          html: `
        <div style="display:flex; justify-content:center; gap:10px; margin-bottom:10px;">
          <button id="btnDescargar" class="swal2-confirm swal2-styled" style="background:#2196f3;">⬇️ Descargar</button>
          <button id="btnCompartir" class="swal2-confirm swal2-styled" style="background:#4caf50;">🤝 Compartir</button>
        </div>
        <iframe src="${pdfUrl}" width="100%" height="600" style="border:1px solid #ccc; border-radius:8px;"></iframe>
      `,
          width: "70%",
          showConfirmButton: true,
          confirmButtonText: "Cerrar",
          didOpen: () => {
            document.getElementById("btnDescargar").addEventListener("click", () => {
              const link2 = document.createElement("a");
              link2.href = pdfUrl;
              link2.download = opciones.filename;
              document.body.appendChild(link2);
              link2.click();
              document.body.removeChild(link2);
            });
            document.getElementById("btnCompartir").addEventListener("click", async () => {
              const file = new File([pdfBlob], opciones.filename, { type: "application/pdf" });
              if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: "Compartir PDF",
                  text: "Te comparto el documento PDF generado",
                  files: [file]
                });
              } else {
                Swal.fire("⚠️ No soportado", "Este dispositivo no permite compartir archivos directamente.", "warning");
              }
            });
          }
        });
      } catch (err) {
        console.error("❌ Error generando el PDF:", err);
        Swal.fire("Error", "No se pudo generar el PDF.", "error");
      }
    };

/***************************************************************/
const enviarPorCorreo = async () => {
  const datosClient = datosFactura.value; // o datosCliente.value si lo tienes aparte
  let emailCliente = datosClient.email;

  // Si no tiene correo, pedírselo con un SweetAlert
  if (!emailCliente) {
    const { value: inputEmail, isConfirmed } = await Swal.fire({
      title: 'Correo del Cliente',
      input: 'email',
      inputLabel: 'Introduce el correo electrónico al que se enviará la factura:',
      inputPlaceholder: 'cliente@ejemplo.com',
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return '¡El correo es obligatorio!';
        const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!correoRegex.test(value)) return 'Correo inválido.';
        return null;
      }
    });

    if (!isConfirmed) return; // el usuario canceló
    emailCliente = inputEmail;
  }

  // Generar PDF como Blob
  const elemento = document.getElementById('printMe');
  const opciones = {
    margin: 10,
    filename: `${tipoDoc.value}_${numeroDoc.value}.pdf`,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 4, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  const pdfBlob = await html2pdf().set(opciones).from(elemento).output('blob');

  // Crear el archivo PDF como File
  const pdfFile = new File([pdfBlob], `${tipoDoc.value}_${numeroDoc.value}.pdf`, {
    type: 'application/pdf'
  });

  // FormData con los datos y el archivo adjunto
  const formData = new FormData();
  formData.append('subjet', `Copia de ${tipoDoc.value.toUpperCase()} #${numeroDoc.value}`);
  formData.append('mailto', emailCliente);
  formData.append('mensaje', 'Adjunto encontrará la factura generada por el sistema.');
  formData.append('albody', 'Adjunto encontrará la factura generada por el sistema.');
  formData.append('file', pdfFile);

  // Enviar con Axios
  try {
    const { data } = await axios.post(`${link.value}${api.value}/email`, formData, {
      headers: {
        Authorization: `${tokenCifrado.value}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    if (data[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Correo enviado', detail: 'Se envió correctamente.', life: 3000 });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el correo.', life: 3000 });
    }
  } catch (error) {
    console.error('Error al enviar correo:', error);
    toast.add({ severity: 'error', summary: 'Error crítico', detail: 'Falló el envío del correo.', life: 3000 });
  }
};

/***************************************************************/
const fnVender = ()=>{
  router.push('/vender')
}
/***************************************************************/
</script>

<template>
<main class="content-wrapper">
  <div class="">

<Card class="mb-2">
      <template #content>
<div class="">

     <Button 
    label="Regresar" 
    icon="pi pi-undo"  
    @click="fnRegresar" 
    />


    <Button 
    label="Ver Todas" 
    as="router-link" 
    class="ml-1"
    icon="pi pi-th-large"  
    to="/facturas" 
    />



    <Button 
    label="Crear Otra" 
    as="router-link" 
    class="ml-1"
    icon="pi pi-wrench"  
    to="/vender" 
    />


    <Button
      icon="pi pi-print"
      class="ms-1"
      label="Imprimir"
      v-print="'#printMe'"
    />

<Button
  icon="pi pi-file-pdf"
  class="ms-1"
  label="PDF"
  @click="generarPDF"
/>

<Button
  icon="pi pi-envelope"
  class="ms-1"
  label="Enviar por Correo"
  @click="enviarPorCorreo"
/>

<Button
  icon="pi pi-shopping-cart"
  class="ms-1"
  label="Ir a Ventas"
  @click="fnVender"
/>

      </div>
      </template>
</Card>


<Card>
      <template #content>
<div class="flex flex-col space-y-4">

  <div class="p-6 bg-white rounded-lg mx-auto" id="printMe"  style="width: 190mm; max-width: 100%;">
    <!-- Encabezado -->
    <div class="flex justify-between items-center border-b pb-4">
      <div class="text-left">
        <img :src="datosEmpresa.empresa.logoprinter" alt="TMPOS Logo" class="max-w-[250px] mb-2" />
        <h1 class="text-lg font-bold">{{datosEmpresa.empresa.nombre}}</h1>
        <p class="text-sm">{{datosEmpresa.empresa.legal}}9</p>
        <p class="text-sm">{{datosEmpresa.empresa.telefono}}</p>
        <p class="text-sm">{{datosEmpresa.empresa.email}}</p>
        <p class="text-sm">{{datosEmpresa.empresa.direccion}}</p>
      </div>
      <div class="text-right">
        <div class="border p-2 rounded">

        <table class="text-right text-sm w-full total">
          <tr>
            <td class="px-1 text-left">Fecha</td>
            <td class="px-1">{{ datosFactura.fecha_emision }}</td>
          </tr>
          <tr>
            <td class="px-1 text-left">Factura #</td>
            <td class="px-1">{{ numeroDoc }}</td>
          </tr>
          <tr v-if="route.params.tipo === 'facturas'">
            <td class="px-1 text-left">NCF</td>
            <td class="px-1">{{ datosFactura.tipo_factura }}</td>
          </tr>
          <tr v-if="datosFactura.comprobante != 'SIN COMPROBANTE' && route.params.tipo === 'facturas'">
            <td class="px-1 text-left">COMPROBANTE #</td>
            <td class="px-1">{{ datosFactura.comprobante }}</td>
          </tr>

            <tr v-if="route.params.tipo === 'cotizacion'">
              <td class=" px-1 text-left">VENCIMIENTO</td>
              <td class=" px-1">{{datosFactura.vencimiento}}</td>
            </tr>

        </table>
           <h2 v-if="route.params.tipo === 'facturas'" class="text-center font-bold mt-4 border-y border-black py-1 bg-gray-800 text-white rounded-md">
           {{datosFactura.metodo_pago === 'CREDITO'? 'FACTURA A CREDITO':'FACTURA'}}
           </h2>

           <h2 v-if="route.params.tipo === 'cotizacion'" class="text-center font-bold mt-4 border-y border-black py-1 bg-gray-800 text-white rounded-md">
           {{'COTIZACION'}}
           </h2>



        </div>
      </div>
    </div>

    <!-- Cliente -->
<div class="border p-2 mt-4 rounded flex justify-between">

       <div class="w-2/3">
         <p><strong>CLIENTE:</strong> AL CONTADO</p>
         <p><strong>TELEFONO:</strong> +1(000) 000-0000</p>
         <p><strong>EMAIL:</strong> SIN REGISTRO</p>
         <p><strong>DIRECCIÓN:</strong> SIN REGISTRO</p>
        </div>

      <div class="w-1/3 flex justify-end">
        <img :src="qrCodeData" alt="Código QR" class="w-24 h-24" />
      </div>


</div>
            <!-- Cinta de FACTURA -->
<!--             <div class="bg-black text-center text-white mt-2 px-6 py-1 text-lg font-bold rounded shadow-md">
              {{tipoDoc.toUpperCase()}}
            </div> -->


    <!-- Detalles de Factura -->
    <table class="w-full border-collapse border mt-2" id="tablafactura">
      <thead>
        <tr class="bg-gray-200">
          <th class="border px-3 py-2 text-left">COD</th>
          <th class="border px-3 py-2 text-left">DESCRIPCIÓN</th>
          <th class="border px-3 py-2">CANT.</th>
          <th class="border px-3 py-2">P.U</th>
          <th class="border px-3 py-2">ITBIS</th>
          <th class="border px-3 py-2">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in datosFactura.productos" :key="index">
          <td class="px-3 py-2">{{ item.codigo }}</td>
          <td class="px-3 py-2">{{ item.nombre }}</td>
          <td class="px-3 py-2 text-center">{{ item.cantidad }}</td>
          <td class="px-3 py-2 text-right">{{ formateoNumerosDecimales(item.precio_venta) }}</td>
          <td class="px-3 py-2 text-right">{{ formateoNumerosDecimales(item.impuesto) }}</td>
          <td class="px-3 py-2 text-right">{{ formateoNumerosDecimales(item.total) }}</td>
        </tr>
              <!-- Filas de relleno -->

      </tbody>
    </table>



    <!-- Totales -->
    <div class="flex justify-between mt-4 rounded">
       <div class="w-[400px]">
        <div class="border p-2 rounded">
            <div class="">
               <p class=" pt-4">ENTREGADO POR ({{datosFactura.vendedor}})</p>
           </div>
        </div>
        <div class="border p-4 rounded mt-4">
      <div class="">
        <p class=" pt-2">RECIBIDO POR ({{datosFactura.nombre_cliente}})</p>
      </div>
        </div>
      </div>
<table class="border w-1/3 rounded-lg overflow-hidden" style="border-collapse: separate; border-spacing: 0;">
  <tr>
    <td class="border px-3 py-2"><strong>SUBTOTAL</strong></td>
    <td class="border px-3 py-2 text-right">{{formateoNumerosDecimales(datosFactura.subtotal)}}</td>
  </tr>
  <tr>
    <td class="border px-3 py-2"><strong>ITBIS 18%</strong></td>
      <td class="border px-3 py-2 text-right">{{formateoNumerosDecimales(datosFactura.impuesto)}}</td> 
  </tr>
  <tr>
    <td class="border px-3 py-2"><strong>DESC.</strong></td>
    <td class="border px-3 py-2 text-right">{{formateoNumerosDecimales(datosFactura.descuento)}}</td>
  </tr>
  <tr class="bg-gray-200">
    <td class="border px-3 py-2"><strong>TOTAL</strong></td>
    <td class="border px-3 py-2 text-right">{{formateoNumerosDecimales(datosFactura.total)}}</td>
  </tr>
</table>

    </div>


    <!-- Observaciones -->
    <div class="border mt-4 p-4 text-xs rounded">
      <p v-if="datosFactura.nota" class="text-xs" v-html="formattedNota"></p>
    </div>
  </div>

    </div>
      </template>
</Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
/* Estilos generales para la tabla */
#tablafactura {
  border: 0.5pt solid darkblue;
  border-collapse: collapse;
  border-spacing: 0;
  box-sizing: border-box;
  clear: both;
  margin: 2mm 0mm;
  width: 100%;
}

#tablafactura th,
#tablafactura td {
  border-left: 0.5px solid #ccc;
  padding: 0;
  margin: 0;
}

#tablafactura th:first-child,
#tablafactura td:first-child {
  border-left: none;
}

#tablafactura th {
  border-bottom: 1px solid darkblue;
}

#tablafactura td {
  vertical-align: top;
  font-size: 8pt;
}

th {
  text-align: center;
  font-weight: normal;
}

.amount {
  text-align: right;
}

.invoice_line {
  height: 6mm;
}

.invoice_line td,
.invoice_line th {
  padding: 0.5mm 1mm;
}

#tablafactura tr {
  margin: 0;
  padding: 0;
}

/* Añadir una altura mínima al cuerpo de la tabla */
#tablafactura tbody {
  min-height: 50mm; /* Ajusta este valor según sea necesario */
  display: table-row-group;
  vertical-align: middle;
}

/* Estilos específicos para la impresión */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    background: white;
  }

  .print-bg {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  button {
    display: none;
  }

  /* Asegurar que la tabla no se divida en varias páginas */
  #tablafactura {
    page-break-inside: avoid;
  }

  /* Asegurar que las filas de la tabla no se dividan en varias páginas */
  #tablafactura tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  /* Asegurar que el contenido de la tabla se ajuste correctamente */
  #tablafactura tbody {
    display: table-row-group;
  }
}
</style>


