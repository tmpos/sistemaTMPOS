
<script setup>
import { ref, onMounted, nextTick, watchEffect, computed } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, generarCodigoUnico, generarTablaFromStringJSON, peticiones, enviarSolicitudGet, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline, enviarDatosLocalStorage } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import jsPDF from 'jspdf';
/************************************************************************/
import TablaJSON from '@/components/tablaJSON.vue'
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
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
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
const todosLosapartados = ref([]);
/************************************************************************/
const visibleAbonoModal = ref(false)
const btn1Abono = ref('0.00')
const btn2Abono = ref('0.00')
const btn3Abono = ref('0.00')
const fechaAbonoModal = ref('')
const abonoAbonoModal = ref('0.00')
const metodoAbonoModal = ref('EFECTIVO')
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'apartados');
    const jsonData = response;
    todosLosapartados.value = response;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
};
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosapartados.value.findIndex(notacredito => notacredito.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosapartados.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosapartados.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosapartados.value[newIndex];
    router.push({ path: `/editarapartados/${todosLosapartados.value[newIndex].id}` });
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
watchEffect(()=>{

  if (visibleAbonoModal.value) {
    fechaAbonoModal.value = nfecha('fecha')
    metodoAbonoModal.value = 'EFECTIVO'
    btn1Abono.value = (Number(datoscampos.value.saldo) / 4).toFixed(2)
    btn2Abono.value = (Number(datoscampos.value.saldo) / 2).toFixed(2)
    btn3Abono.value = (Number(datoscampos.value.saldo)).toFixed(2)
    abonoAbonoModal.value = datoscampos.value.saldo;
  }

})
/************************************************************************/
async function funcionActualizar(e) {
  if(e){
    e.preventDefault();
  }
  const url = link.value+api.value+"/actualizarcampos/apartados";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData', 'apartados', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const editPago = async (index, datos) => {

  const { value: formValues } = await Swal.fire({
    title: `Editar Pago #${datos.nopago}`,
    html: `
      <div class="flex flex-col space-y-4 text-left">

        <!-- Fecha -->
        <div class="flex flex-col">
          <label class="text-sm font-semibold text-gray-700 mb-1">Fecha</label>
          <input 
            id="swal-fecha" 
            value="${datos.fecha}" 
            type="text" 
            class="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
        </div>

        <!-- Cantidad -->
        <div class="flex flex-col">
          <label class="text-sm font-semibold text-gray-700 mb-1">Cantidad</label>
          <input 
            id="swal-cantidad" 
            value="${datos.cantidad}" 
            type="number" 
            step="0.01"
            class="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
        </div>

        <!-- Método -->
        <div class="flex flex-col">
          <label class="text-sm font-semibold text-gray-700 mb-1">Método</label>
          <select 
            id="swal-metodo" 
            class="w-full px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          >
            <option value="EFECTIVO" ${datos.metodo === "EFECTIVO" ? "selected" : ""}>EFECTIVO</option>
            <option value="TRANSFERENCIA" ${datos.metodo === "TRANSFERENCIA" ? "selected" : ""}>TRANSFERENCIA</option>
            <option value="TARJETA" ${datos.metodo === "TARJETA" ? "selected" : ""}>TARJETA</option>
          </select>
        </div>

      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Guardar Cambios",
    cancelButtonText: "Cancelar",

    customClass: {
      popup: "rounded-xl p-0",
      confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-md shadow-md transition",
      cancelButton: "bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-md ml-2 transition",
      actions: "flex justify-center gap-3 pb-4",
      title: "pt-6 text-xl font-bold text-gray-800",
      htmlContainer: "px-6 pb-2"
    },

    preConfirm: () => {
      return {
        fecha: document.getElementById("swal-fecha").value,
        cantidad: document.getElementById("swal-cantidad").value,
        metodo: document.getElementById("swal-metodo").value
      };
    }
  });

  if (!formValues) return;
  let pagosArray = JSON.parse(datoscampos.value.pagos || "[]");

// Saldo global ANTES de editar el pago
let montoCredito = Number(datoscampos.value.monto_credito);

// Sumar TODOS los pagos exceptuando el que se está editando
let totalSinEstePago = pagosArray.reduce((acc, p, i) => {
  return i === index ? acc : acc + Number(p.cantidad);
}, 0);

// Nuevo saldo inmediatamente después de este pago editado
let saldoDespuesPago = (montoCredito - (totalSinEstePago + Number(formValues.cantidad))).toFixed(2);



  // === Actualización ===

    pagosArray[index] = {
      ...pagosArray[index],
      fecha: formValues.fecha,
      cantidad: Number(formValues.cantidad).toFixed(2),
      metodo: formValues.metodo,
      saldo: saldoDespuesPago
    };


  const totalAbonado = pagosArray.reduce((acc, p) => acc + Number(p.cantidad), 0).toFixed(2);
  const saldo = (Number(datoscampos.value.monto_credito) - Number(totalAbonado)).toFixed(2);

  datoscampos.value.pagos = JSON.stringify(pagosArray);
  datoscampos.value.abonado = totalAbonado;
  datoscampos.value.saldo = saldo;
  datoscampos.value.estatus = saldo <= 0 ? "SALDADO" : "PENDIENTE";

  datoscampos.value.updated_at = nfecha("timestamp");

  await funcionActualizar();

  Swal.fire({
    icon: "success",
    title: "Pago actualizado",
    timer: 1500,
    showConfirmButton: false
  });
};

const rowColorCallback = ()=>{

}
/************************************************************************/
const deletePago = async (index) => {

  const result = await Swal.fire({
    title: "Eliminar Pago",
    html: `
      <p class="text-gray-700 text-sm mt-2">
        ¿Seguro que deseas eliminar este pago?<br>
        Esta acción no se puede deshacer.
      </p>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    customClass: {
      popup: "rounded-xl",
      confirmButton: "bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-md shadow-md transition",
      cancelButton: "bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-md ml-2 transition",
      actions: "flex justify-center gap-4 pb-2",
      title: "pt-6 text-xl font-bold text-gray-800",
      htmlContainer: "px-6"
    }
  });

  if (!result.isConfirmed) return;

  let pagosArray = JSON.parse(datoscampos.value.pagos || "[]");

  pagosArray.splice(index, 1);

  // 🔥 Sanitizar y reenumerar todo
  pagosArray = pagosArray.map((p, i) => ({
    nopago: i + 1,
    cantidad: Number(p.cantidad || 0).toFixed(2),
    metodo: p.metodo || "EFECTIVO",
    fecha: p.fecha || "",
    hora: p.hora || "",
    turno: p.turno || "",
    cajero: p.cajero || "",
    saldo: Number(p.saldo || 0).toFixed(2)
  }));

  // === Recalcular totales ===
  const totalAbonado = pagosArray.reduce((acc, p) => acc + Number(p.cantidad), 0).toFixed(2);

  const saldo = (Number(datoscampos.value.monto_credito) - Number(totalAbonado)).toFixed(2);

  const estado = saldo <= 0 ? "SALDADO" : "PENDIENTE";

  datoscampos.value.pagos = JSON.stringify(pagosArray);
  datoscampos.value.abonado = totalAbonado;
  datoscampos.value.saldo = saldo;
  datoscampos.value.estatus = estado;
  datoscampos.value.updated_at = nfecha("timestamp");

  await funcionActualizar();

  Swal.fire({
    icon: "success",
    title: "Pago eliminado",
    timer: 1500,
    showConfirmButton: false
  });
};


/************************************************************************/
const fnbtnAgregArbono = (cantidad)=>{
   abonoAbonoModal.value = Number(cantidad).toFixed(2)
}
/************************************************************************/
const fnAgregarAbonoModal = async() => {
  visibleAbonoModal.value = false;
    let totalAbonado = Number(abonoAbonoModal.value);

        const pagosArray = JSON.parse(datoscampos.value.pagos) || [];
        const saldoFactura = Number(datoscampos.value.saldo);

        let abonoActual = Math.min(totalAbonado, saldoFactura); // Abonar lo máximo posible sin exceder el saldo
        let saldoN = (saldoFactura - abonoActual).toFixed(2);

        var estado = 'PENDIENTE';
        if (saldoN <= 0) {
            estado = 'SALDADO';
        }

        const numeroPago = pagosArray.length + 1;
        const npago = {
            "nopago": numeroPago,
            "cantidad": abonoActual.toFixed(2),
            "metodo": metodoAbonoModal.value,
            "fecha": fechaAbonoModal.value,
            "hora": nfecha('hora'),
            "turno": datosEmpresa.usuario.token,
            "cajero": datosEmpresa.usuario.email,
            "saldo": saldoN
        };

        pagosArray.push(npago);

        const sumaAbono = pagosArray
            .map(abono => Number(abono.cantidad))
            .reduce((acc, curr) => acc + curr, 0)
            .toFixed(2);

        datoscampos.value.pagos = JSON.stringify(pagosArray);
        datoscampos.value.estatus = estado;
        datoscampos.value.abonado = sumaAbono;
        datoscampos.value.saldo = saldoN;
        datoscampos.value.updated_at = nfecha('timestamp');

        // Actualizar la datoscampos en la base de datos
        funcionActualizar()
        fnPrint()
};
/************************************************************************/
const fnPrint = () => {
  const doc = new jsPDF({
    orientation: 'p', // Vertical
    unit: 'mm',
    format: [80, 200], // Tamaño de ticket
  });

  let y = 10; // Posición vertical inicial

  // Datos de la empresa
  doc.setFontSize(10);
  doc.text(datosEmpresa.empresa.nombre, 40, y, { align: 'center' });
  y += 5;
  doc.text(datosEmpresa.empresa.direccion, 40, y, { align: 'center' });
  y += 5;
  doc.text(`Tel: ${datosEmpresa.empresa.telefono}`, 40, y, { align: 'center' });
  y += 10;

  // Línea separadora
  doc.line(5, y, 75, y);
  y += 5;

  // Datos del cliente
  doc.setFontSize(9);
  doc.text(`Cliente: ${datoscampos.value.nombre_cliente}`, 5, y);
  y += 5;
  doc.text(`Cédula: ${datoscampos.value.cedula_cliente}`, 5, y);
  y += 5;
  doc.text(`Teléfono: ${datoscampos.value.telefono_cliente}`, 5, y);
  y += 10;

  // Detalles del crédito
  doc.text(`No. Factura: ${datoscampos.value.no_factura}`, 5, y);
  y += 5;
  doc.text(`Total Crédito: RD$ ${datoscampos.value.monto_credito}`, 5, y);
  y += 5;
  doc.text(`Cuotas: ${datoscampos.value.cuotas}`, 5, y);
  y += 5;
  doc.text(`Saldo Pendiente: RD$ ${datoscampos.value.saldo}`, 5, y);
  y += 10;

  // Línea separadora
  doc.line(5, y, 75, y);
  y += 5;

  // Pagos realizados
  doc.setFontSize(8);
  doc.text(`Pagos`, 5, y);
  y += 5;

  const pagosArray = JSON.parse(datoscampos.value.pagos || "[]");

  if (pagosArray.length === 0) {
    doc.text("No hay pagos registrados.", 5, y);
    y += 5;
  } else {
    pagosArray.forEach((pago, index) => {
      doc.text(`#${index + 1} - ${pago.fecha} - RD$ ${pago.cantidad} (${pago.metodo})`, 5, y);
      y += 5;
    });
  }
  
  y += 10;

  // Totales
  doc.setFontSize(10);
  doc.text(`Total Crédito: RD$ ${datoscampos.value.monto_credito}`, 5, y);
  y += 5;
  doc.text(`Total Abonado: RD$ ${datoscampos.value.abonado}`, 5, y);
  y += 5;
  doc.text(`Saldo Pendiente: RD$ ${datoscampos.value.saldo}`, 5, y);
  y += 10;

  // Línea final
  doc.line(5, y, 75, y);
  y += 5;

  doc.text(`Gracias por su pago`, 40, y, { align: 'center' });

  // Convertir a Blob URL para mostrarlo en el Swal
  const pdfDataUri = doc.output('datauristring');

  Swal.fire({
    title: 'Ticket de Pago',
    html: `<iframe width="100%" height="400" src="${pdfDataUri}"></iframe>`,
    showCancelButton: true,
    confirmButtonText: 'Imprimir',
    cancelButtonText: 'Cerrar',
    preConfirm: () => {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    },
  });
};
/************************************************************************/
const formatCurrency = (value) => {
  if (value) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  return '$0.00';
};
/************************************************************************/
const currentIndex = computed(() => {
  return todosLosapartados.value.findIndex(apartado => apartado.id == route.params.id);
});
const isFirst = computed(() => currentIndex.value === 0);
const isLast = computed(() => currentIndex.value === todosLosapartados.value.length - 1);
/************************************************************************/
const datosEmpresa2 = JSON.stringify(enviarDatosLocalStorage());
/************************************************************************/
const fnImprimirTicket = async () => {
  try {
    // Crear copia limpia sin referencias circulares
    const datosApartadoCompleto = {
      no_emision: datoscampos.value.no_emision,
      no_factura: datoscampos.value.no_factura,
      cod_cliente: datoscampos.value.cod_cliente,
      nombre_cliente: datoscampos.value.nombre_cliente,
      cedula_cliente: datoscampos.value.cedula_cliente,
      telefono_cliente: datoscampos.value.telefono_cliente,
      whatsapp_cliente: datoscampos.value.whatsapp_cliente,
      email_cliente: datoscampos.value.email_cliente,
      direccion_cliente: datoscampos.value.direccion_cliente,
      productos: datoscampos.value.productos,
      fecha_emision: datoscampos.value.fecha_emision,
      hora: datoscampos.value.hora,
      fecha_vencimiento: datoscampos.value.fecha_vencimiento,
      monto_credito: datoscampos.value.monto_credito,
      cuotas: datoscampos.value.cuotas,
      tiempo: datoscampos.value.tiempo,
      fecha_ultimo_pago: datoscampos.value.fecha_ultimo_pago,
      proxima_fecha_pago: datoscampos.value.proxima_fecha_pago,
      abonado: datoscampos.value.abonado,
      saldo: datoscampos.value.saldo,
      estatus: datoscampos.value.estatus,
      vendedor: datoscampos.value.vendedor,
      pagos: datoscampos.value.pagos,
      nota: datoscampos.value.nota
    };

    await window.electron.ipcRenderer.invoke('ticketApartado', JSON.stringify(datosApartadoCompleto), datosEmpresa2);
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Ticket enviado a impresora', life: 3000 });
  } catch (error) {
    console.error('Error al imprimir ticket:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al imprimir ticket', life: 3000 });
  }
};
/************************************************************************/
const fnImprimirCartaPDF = async () => {
  try {
    // Crear copia limpia sin referencias circulares
    const datosApartadoCompleto = {
      no_emision: datoscampos.value.no_emision,
      no_factura: datoscampos.value.no_factura,
      cod_cliente: datoscampos.value.cod_cliente,
      nombre_cliente: datoscampos.value.nombre_cliente,
      cedula_cliente: datoscampos.value.cedula_cliente,
      telefono_cliente: datoscampos.value.telefono_cliente,
      whatsapp_cliente: datoscampos.value.whatsapp_cliente,
      email_cliente: datoscampos.value.email_cliente,
      direccion_cliente: datoscampos.value.direccion_cliente,
      productos: datoscampos.value.productos,
      fecha_emision: datoscampos.value.fecha_emision,
      hora: datoscampos.value.hora,
      fecha_vencimiento: datoscampos.value.fecha_vencimiento,
      monto_credito: datoscampos.value.monto_credito,
      cuotas: datoscampos.value.cuotas,
      tiempo: datoscampos.value.tiempo,
      fecha_ultimo_pago: datoscampos.value.fecha_ultimo_pago,
      proxima_fecha_pago: datoscampos.value.proxima_fecha_pago,
      abonado: datoscampos.value.abonado,
      saldo: datoscampos.value.saldo,
      estatus: datoscampos.value.estatus,
      vendedor: datoscampos.value.vendedor,
      pagos: datoscampos.value.pagos,
      nota: datoscampos.value.nota
    };

    const clienteLimpio = {
      nombre: datoscampos.value.nombre_cliente || '',
      telefono: datoscampos.value.telefono_cliente || '',
      rnc: datoscampos.value.cedula_cliente || '',
      direccion: datoscampos.value.direccion_cliente || ''
    };

    await window.electron.ipcRenderer.invoke('apartadoPDF', JSON.stringify(datosApartadoCompleto), JSON.stringify(clienteLimpio), datosEmpresa2);
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'PDF generado correctamente', life: 3000 });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al generar PDF', life: 3000 });
  }
};
/************************************************************************/
</script>
<template>
<main class="editar-apartados-container">
  <div class="w-full">
    <!-- Header Profesional -->
    <div class="editar-apartados-header mb-4">
      <div class="editar-apartados-header-content">
        <div class="editar-apartados-icon-wrapper">
          <i class="pi pi-pencil editar-apartados-icon"></i>
        </div>
        <div>
          <h1 class="editar-apartados-title">Editar Apartado</h1>
          <p class="editar-apartados-subtitle">Modificar información del apartado #{{ datoscampos.no_factura }}</p>
        </div>
      </div>
    </div>

    <!-- Toolbar de Navegación y Acciones -->
    <Card class="mb-4 toolbar-card">
      <template #content>
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <router-link to="/apartados">
              <Button icon="pi pi-home" label="Volver" severity="secondary" class="btn-action" />
            </router-link>
            <router-link to="/crearapartados">
              <Button icon="pi pi-plus" label="Nuevo Apartado" severity="success" class="btn-action" />
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
              icon="pi pi-dollar"
              label="Registrar Abono"
              @click="visibleAbonoModal = true"
              severity="warning"
              class="btn-abono"
            />
            <Button
              icon="pi pi-ticket"
              label="Ticket"
              @click="fnImprimirTicket"
              severity="secondary"
              v-tooltip.bottom="'Imprimir Ticket 80mm'"
            />
            <Button
              icon="pi pi-file-pdf"
              label="Carta PDF"
              @click="fnImprimirCartaPDF"
              severity="secondary"
              v-tooltip.bottom="'Imprimir Carta A4'"
            />
            <Button
              icon="pi pi-eye"
              label="Vista Previa"
              @click="fnPrint"
              severity="secondary"
              v-tooltip.bottom="'Vista previa PDF'"
            />
          </div>
        </div>
      </template>
    </Card>
    <!-- Formulario de Edición -->
    <form @submit.prevent="funcionActualizar">
      <!-- Información del Apartado y Montos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <!-- Información del Apartado -->
        <Card class="section-card">
          <template #header>
            <div class="section-header">
              <i class="pi pi-info-circle section-icon"></i>
              <span class="section-title">Información del Apartado</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">
                  <i class="pi pi-hashtag mr-2"></i>
                  No. Emisión
                </label>
                <InputText v-model="datoscampos.no_emision" class="w-full" readonly disabled />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-file mr-2"></i>
                  No. Factura
                </label>
                <InputText v-model="datoscampos.no_factura" class="w-full" readonly disabled />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-calendar mr-2"></i>
                  Fecha Emisión
                </label>
                <InputText v-model="datoscampos.fecha_emision" class="w-full" readonly />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-clock mr-2"></i>
                  Hora
                </label>
                <InputText v-model="datoscampos.hora" class="w-full" readonly />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-calendar-times mr-2"></i>
                  Vencimiento
                </label>
                <InputText v-model="datoscampos.fecha_vencimiento" class="w-full" readonly />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-user mr-2"></i>
                  Vendedor
                </label>
                <InputText v-model="datoscampos.vendedor" class="w-full" readonly />
              </div>
            </div>
          </template>
        </Card>

        <!-- Montos y Pagos -->
        <Card class="section-card">
          <template #header>
            <div class="section-header">
              <i class="pi pi-dollar section-icon"></i>
              <span class="section-title">Montos y Pagos</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">
                  <i class="pi pi-money-bill mr-2"></i>
                  Monto Crédito
                </label>
                <InputText v-model="datoscampos.monto_credito" class="w-full" readonly />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-list mr-2"></i>
                  Cuotas
                </label>
                <InputText v-model="datoscampos.cuotas" class="w-full" readonly />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-hourglass mr-2"></i>
                  Tiempo
                </label>
                <Dropdown
                  v-model="datoscampos.tiempo"
                  :options="['DIARIO','SEMANAL','QUINCENAL','MENSUAL','LOS 15','LOS 30']"
                  placeholder="Seleccione tiempo"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-tag mr-2"></i>
                  Estado
                </label>
                <Dropdown
                  v-model="datoscampos.estatus"
                  :options="['PENDIENTE','SALDADO','OTRO']"
                  placeholder="Seleccione estado"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-check-circle mr-2"></i>
                  Abonado
                </label>
                <div class="total-display-green">
                  {{ formatCurrency(datoscampos.abonado) }}
                </div>
              </div>

              <div>
                <label class="field-label total-label">
                  <i class="pi pi-money-bill mr-2"></i>
                  Saldo
                </label>
                <div class="total-display">
                  {{ formatCurrency(datoscampos.saldo) }}
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Información del Cliente -->
      <Card class="section-card mb-4">
        <template #header>
          <div class="section-header">
            <i class="pi pi-users section-icon"></i>
            <span class="section-title">Información del Cliente</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="field-label">
                <i class="pi pi-id-card mr-2"></i>
                Código Cliente
              </label>
              <InputText v-model="datoscampos.cod_cliente" class="w-full" readonly />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-user mr-2"></i>
                Nombre
              </label>
              <InputText v-model="datoscampos.nombre_cliente" class="w-full" readonly />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-id-card mr-2"></i>
                Cédula
              </label>
              <InputText v-model="datoscampos.cedula_cliente" class="w-full" readonly />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-phone mr-2"></i>
                Teléfono
              </label>
              <InputText v-model="datoscampos.telefono_cliente" class="w-full" readonly />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-whatsapp mr-2"></i>
                WhatsApp
              </label>
              <InputText v-model="datoscampos.whatsapp_cliente" class="w-full" readonly />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-envelope mr-2"></i>
                Email
              </label>
              <InputText v-model="datoscampos.email_cliente" class="w-full" readonly />
            </div>

            <div class="md:col-span-3">
              <label class="field-label">
                <i class="pi pi-map-marker mr-2"></i>
                Dirección
              </label>
              <Textarea v-model="datoscampos.direccion_cliente" rows="2" class="w-full" readonly />
            </div>
          </div>
        </template>
      </Card>

      <!-- Fechas de Pago -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card class="section-card">
          <template #header>
            <div class="section-header">
              <i class="pi pi-calendar-plus section-icon"></i>
              <span class="section-title">Fechas de Pago</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 gap-3">
              <div>
                <label class="field-label">
                  <i class="pi pi-calendar mr-2"></i>
                  Último Pago
                </label>
                <InputText v-model="datoscampos.fecha_ultimo_pago" class="w-full" readonly />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-calendar mr-2"></i>
                  Próximo Pago
                </label>
                <InputText v-model="datoscampos.proxima_fecha_pago" class="w-full" />
              </div>
            </div>
          </template>
        </Card>

        <Card class="section-card">
          <template #header>
            <div class="section-header">
              <i class="pi pi-file-edit section-icon"></i>
              <span class="section-title">Notas</span>
            </div>
          </template>
          <template #content>
            <div>
              <label class="field-label">
                <i class="pi pi-comment mr-2"></i>
                Observaciones
              </label>
              <Textarea v-model="datoscampos.nota" rows="4" class="w-full" />
            </div>
          </template>
        </Card>
      </div>
      <!-- Productos -->
      <Card class="section-card productos-card mb-4">
        <template #header>
          <div class="section-header">
            <i class="pi pi-shopping-cart section-icon"></i>
            <span class="section-title">Productos</span>
          </div>
        </template>
        <template #content>
          <div class="productos-table-wrapper">
            <div v-html="generarTablaFromStringJSON(datoscampos.productos)" class="productos-table"></div>
          </div>
        </template>
      </Card>

      <!-- Pagos -->
      <Card class="section-card pagos-card mb-4">
        <template #header>
          <div class="section-header">
            <i class="pi pi-wallet section-icon"></i>
            <span class="section-title">Historial de Pagos</span>
          </div>
        </template>
        <template #content>
<!--           <div class="pagos-table-wrapper">
            <div v-html="generarTablaFromStringJSON(datoscampos.pagos, false, true,editPago,deletepago,'tablaPagos',undefined,rowColorCallback)" class="pagos-table"></div>
          </div> -->
          <TablaJSON :productos="datoscampos.pagos" :botones="true" :onEditar="editPago" tableId="tablaPagos" :onEliminar="deletePago" />
        </template>
      </Card>

      <!-- Botón de Actualizar - Full Width -->
      <Button
        type="submit"
        label="Actualizar Datos"
        icon="pi pi-save"
        class="w-full btn-actualizar mb-4"
      />
    </form>

  </div>

  <!-- Modal de Abono Modernizado -->
  <Dialog v-model:visible="visibleAbonoModal" modal :style="{ width: '40rem' }" class="abono-dialog">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
        <i class="pi pi-wallet text-orange-600 text-2xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 m-0">Registrar Abono</h3>
        <p class="text-sm text-gray-500 m-0">{{datoscampos.nombre_cliente}}</p>
      </div>
    </div>
  </template>

  <div class="abono-modal-content">
    <!-- Resumen del Apartado -->
    <div class="abono-resumen mb-4">
      <div class="grid grid-cols-3 gap-3">
        <div class="resumen-item">
          <p class="resumen-label">Monto Total</p>
          <p class="resumen-value">{{ formatCurrency(datoscampos.monto_credito) }}</p>
        </div>
        <div class="resumen-item">
          <p class="resumen-label">Abonado</p>
          <p class="resumen-value text-green-600">{{ formatCurrency(datoscampos.abonado) }}</p>
        </div>
        <div class="resumen-item">
          <p class="resumen-label">Saldo</p>
          <p class="resumen-value text-orange-600">{{ formatCurrency(datoscampos.saldo) }}</p>
        </div>
      </div>
    </div>

    <!-- Botones de Cantidad Rápida -->
    <div class="mb-4">
      <label class="block text-sm font-semibold text-gray-700 mb-2">
        <i class="pi pi-money-bill mr-2"></i>
        Cantidad Rápida
      </label>
      <div class="flex gap-2">
        <Button
          :label="formatCurrency(btn1Abono)"
          outlined
          severity="secondary"
          @click="fnbtnAgregArbono(btn1Abono)"
          class="flex-1"
        />
        <Button
          :label="formatCurrency(btn2Abono)"
          outlined
          severity="secondary"
          @click="fnbtnAgregArbono(btn2Abono)"
          class="flex-1"
        />
        <Button
          :label="formatCurrency(btn3Abono)"
          outlined
          severity="warning"
          @click="fnbtnAgregArbono(btn3Abono)"
          class="flex-1"
        />
      </div>
    </div>

    <!-- Campos del Formulario -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="field-label">
          <i class="pi pi-calendar mr-2"></i>
          Fecha
        </label>
        <InputText
          v-model="fechaAbonoModal"
          v-datepicker
          class="w-full"
        />
      </div>

      <div>
        <label class="field-label">
          <i class="pi pi-dollar mr-2"></i>
          Abono
        </label>
        <InputText
          v-model="abonoAbonoModal"
          v-solonumeros
          v-numeroFocusinOut
          v-decimales
          class="w-full"
        />
      </div>

      <div>
        <label class="field-label">
          <i class="pi pi-credit-card mr-2"></i>
          Método
        </label>
        <Dropdown
          v-model="metodoAbonoModal"
          :options="['EFECTIVO','TRANSFERENCIA','TARJETA']"
          placeholder="Seleccione método"
          class="w-full"
        />
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex gap-2 justify-end">
      <Button label="Cancelar" severity="secondary" outlined @click="visibleAbonoModal = false" />
      <Button label="Registrar Abono" icon="pi pi-check" severity="success" @click="fnAgregarAbonoModal" />
    </div>
  </template>
  </Dialog>

  <Toast />
</main>
</template>
<style scoped>
/* ===== Container Principal ===== */
.editar-apartados-container {
  padding: 1rem;
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  min-height: 100vh;
}

/* ===== Header Profesional ===== */
.editar-apartados-header {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
  animation: slideIn 0.5s ease-out;
}

.editar-apartados-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editar-apartados-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.editar-apartados-icon {
  font-size: 1.5rem;
  color: white;
}

.editar-apartados-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editar-apartados-subtitle {
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
}

.btn-action:hover,
.btn-nav:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-abono {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-abono:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

/* ===== Botón Actualizar ===== */
.btn-actualizar {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border: none;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.btn-actualizar:hover {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.4);
}

/* ===== Modal de Abono ===== */
.abono-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border-radius: 10px 10px 0 0;
  padding: 1.25rem;
}

.abono-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.abono-dialog :deep(.p-dialog-footer) {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.abono-modal-content {
  background: white;
}

.abono-resumen {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border-radius: 10px;
  padding: 1rem;
  border: 2px solid #fed7aa;
}

.resumen-item {
  text-align: center;
}

.resumen-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin: 0 0 0.25rem 0;
}

.resumen-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* ===== Section Cards ===== */
.section-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-out;
}

.section-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.section-card :deep(.p-card-body) {
  padding: 0;
}

.section-card :deep(.p-card-content) {
  padding: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 12px 12px 0 0;
}

.section-icon {
  font-size: 1.25rem;
  color: white;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

/* ===== Form Fields ===== */
.field-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
}

.field-label i {
  color: #f97316;
  font-size: 0.875rem;
}

/* ===== Total Display Boxes ===== */
.total-display {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
  transition: all 0.3s ease;
}

.total-display:hover {
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
  transform: scale(1.02);
}

.total-display-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.total-display-green:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  transform: scale(1.02);
}

/* ===== Productos and Pagos Cards ===== */
.productos-card :deep(.p-card-content),
.pagos-card :deep(.p-card-content) {
  padding: 0.75rem;
}

.productos-table-wrapper,
.pagos-table-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  border-radius: 8px;
  background: white;
  max-height: 400px;
  border: 1px solid #e5e7eb;
}

/* Custom scrollbar for table wrappers */
.productos-table-wrapper::-webkit-scrollbar,
.pagos-table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.productos-table-wrapper::-webkit-scrollbar-track,
.pagos-table-wrapper::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.productos-table-wrapper::-webkit-scrollbar-thumb,
.pagos-table-wrapper::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 4px;
}

.productos-table-wrapper::-webkit-scrollbar-thumb:hover,
.pagos-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
}

/* ===== Table Styling for Productos and Pagos ===== */
.productos-table :deep(table),
.pagos-table :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.productos-table :deep(thead),
.pagos-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.productos-table :deep(th),
.pagos-table :deep(th) {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  padding: 0.75rem 0.875rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8125rem;
  white-space: nowrap;
  border-bottom: 2px solid #ea580c;
}

.productos-table :deep(td),
.pagos-table :deep(td) {
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-size: 0.8125rem;
}

.productos-table :deep(tbody tr),
.pagos-table :deep(tbody tr) {
  transition: background-color 0.2s ease;
}

.productos-table :deep(tbody tr:hover),
.pagos-table :deep(tbody tr:hover) {
  background-color: #fff7ed;
}

.productos-table :deep(tbody tr:last-child td),
.pagos-table :deep(tbody tr:last-child td) {
  border-bottom: none;
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
  .editar-apartados-container {
    padding: 0.75rem;
  }

  .editar-apartados-header {
    padding: 1rem;
  }

  .editar-apartados-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 640px) {
  .editar-apartados-container {
    padding: 0.5rem;
  }

  .editar-apartados-header {
    padding: 0.75rem;
  }

  .editar-apartados-header-content {
    flex-direction: column;
    text-align: center;
  }

  .editar-apartados-title {
    font-size: 1.125rem;
  }

  .editar-apartados-subtitle {
    font-size: 0.75rem;
  }

  .toolbar-card :deep(.p-card-body) {
    padding: 0.75rem;
  }
}
</style>

