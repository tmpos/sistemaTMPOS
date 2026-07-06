
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline,enviarDatosLocalStorage } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
/************************************************************************/
import jsPDF from 'jspdf';
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ['no_emision', 'no_factura', 'cod_cliente', 'nombre_cliente', 'cedula_cliente', 'telefono_cliente', 'whatsapp_cliente', 'email_cliente', 'direccion_cliente', 'productos', 'fecha_emision', 'hora', 'fecha_vencimiento', 'monto_credito', 'cuotas', 'tiempo', 'fecha_ultimo_pago', 'proxima_fecha_pago', 'abonado', 'saldo', 'estatus', 'vendedor', 'pagos', 'nota','created_at','updated_at','almacen','identificadordb'];
/************************************************************************/
import { useDatosEmpresa } from '../../stores'
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
const selectedItems = ref([]);
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposApartados = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const ApartadosEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposApartados.value = {}
await campos();
}
/************************************************************************/
const visibleAbonoModal = ref(false)
const btn1Abono = ref('0.00')
const btn2Abono = ref('0.00')
const btn3Abono = ref('0.00')
const fechaAbonoModal = ref('')
const abonoAbonoModal = ref('0.00')
const metodoAbonoModal = ref('EFECTIVO')
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'apartados');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('apartados');
  datoscamposApartados.value = campos;
}
/************************************************************************/
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
await crearTablaSiNoExisteOffline('apartados', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await campos();
await fetchAndSetupData();
});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Se borrarán los datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo",
        cancelButtonText: "No, cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
               if (password === token.value || password === tokenCorto.value) {
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'apartados');
                    if (envioDatos[0] == 'ok') {
                        fetchAndSetupData();
                        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos borrados', life: 3000 });
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
                   }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
        }
    });
}
/************************************************************************/
async function borrarSeleccionados() {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
    Swal.fire({
        title: "¿Estas Seguro?",
        text: "Se Borraran los Datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo!",
        cancelButtonText: "No, cancelar!",
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
                if (password === token.value || password === tokenCorto.value) {
                    let exitoTotal = true;
                    if (ids.length > 0) {
                        for (const id of ids) {
                            try {
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'apartados', id);
                            } catch (error) {
                                console.error(`Error al eliminar datos para ID: ${id}`, error);
                                exitoTotal = false;
                            }
                        }
                        if (exitoTotal) {
                            fetchAndSetupData();
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Borrados', life: 3000 });
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar los datos.', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay datos para borrar', life: 3000 });
                    }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos Seguros', life: 3000 });
        }
    });
}
/************************************************************************/
const currentRowData = ref(null);
/************************************************************************/
/************************************************************************/
const itemsApartados = ref([]);
const menu = ref(null);
const toggleApartados = (event, rowData) => {
currentRowData.value = rowData;
itemsApartados.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
router.push({ path: `/editarapartados/${currentRowData.value.id}` });
} },
{ label: 'Abonar', icon: 'pi pi-wallet', command: () => {
    fechaAbonoModal.value = nfecha('fecha')
    metodoAbonoModal.value = 'EFECTIVO'
    btn1Abono.value = (Number(currentRowData.value.saldo) / 4).toFixed(2)
    btn2Abono.value = (Number(currentRowData.value.saldo) / 2).toFixed(2)
    btn3Abono.value = (Number(currentRowData.value.saldo)).toFixed(2)
    abonoAbonoModal.value = currentRowData.value.saldo;


   visibleAbonoModal.value = true;
} },
{ separator: true },
{ label: 'Imprimir Ticket', icon: 'pi pi-ticket', command: () => {
   fnImprimirTicket()
} },
{ label: 'Imprimir Carta PDF', icon: 'pi pi-file-pdf', command: () => {
   fnImprimirCartaPDF()
} },
{ label: 'Print (Vista Previa)', icon: 'pi pi-eye', command: () => {
   fnPrint()
} },
{ separator: true },
{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {
            Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const contrasenaIngresada = result.value;
                    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'apartados', rowData.id);
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                            await fetchAndSetupData()
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                    }
                }
            });
        } 
    },
];
menu.value.toggle(event);
};
/************************************************************************/

/************************************************************************/
const filteredApartados = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
const estadisticasApartados = computed(() => {
  const pendientes = data.value.filter(item => item.estatus === 'PENDIENTE').length;
  const saldados = data.value.filter(item => item.estatus === 'SALDADO').length;
  const total = data.value.length;

  const totalMonto = data.value.reduce((sum, item) => sum + (parseFloat(item.monto_credito) || 0), 0);
  const totalAbonado = data.value.reduce((sum, item) => sum + (parseFloat(item.abonado) || 0), 0);
  const totalSaldo = data.value.reduce((sum, item) => sum + (parseFloat(item.saldo) || 0), 0);

  return { pendientes, saldados, total, totalMonto, totalAbonado, totalSaldo };
});
/************************************************************************/
const formatCurrency = (value) => {
  if (value) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  return '$0.00';
};
/************************************************************************/
const getSeverityEstatus = (estatus) => {
  switch (estatus) {
    case 'PENDIENTE': return 'warning';
    case 'SALDADO': return 'success';
    default: return 'info';
  }
};
/************************************************************************/
const rowClass = (data) => {
  return data.estatus === 'SALDADO' ? 'row-saldado' : 'row-pendiente';
};
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const onRowSelect = (event) => {
 router.push({ path: `/editarapartados/${event.data.id}` });

};
/************************************************************************/
/************************************************************************/
const fnbtnAgregArbono = (cantidad)=>{
   abonoAbonoModal.value = Number(cantidad).toFixed(2)
}
/************************************************************************/
const fnAgregarAbonoModal = async() => {
  visibleAbonoModal.value = false;
    let totalAbonado = Number(abonoAbonoModal.value);

        const pagosArray = JSON.parse(currentRowData.value.pagos) || [];
        const saldoFactura = Number(currentRowData.value.saldo);

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

        currentRowData.value.pagos = JSON.stringify(pagosArray);
        currentRowData.value.estatus = estado;
        currentRowData.value.abonado = sumaAbono;
        currentRowData.value.saldo = saldoN;
        currentRowData.value.updated_at = nfecha('timestamp');

        // Actualizar la currentRowData en la base de datos
        funcionActualizar()
        fnPrint()
};
/************************************************************************/
const funcionActualizar = async()=>{
      const url = link.value+api.value+"/actualizarcampos/apartados";
      currentRowData.value.updated_at = nfecha('timestamp')
  const envioDatos = await enviarDatosPorPost(url, currentRowData.value,tokenCifrado.value);
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
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
  doc.text(`Cliente: ${currentRowData.value.nombre_cliente}`, 5, y);
  y += 5;
  doc.text(`Cédula: ${currentRowData.value.cedula_cliente}`, 5, y);
  y += 5;
  doc.text(`Teléfono: ${currentRowData.value.telefono_cliente}`, 5, y);
  y += 10;

  // Detalles del crédito
  doc.text(`No. Factura: ${currentRowData.value.no_factura}`, 5, y);
  y += 5;
  doc.text(`Total Crédito: RD$ ${currentRowData.value.monto_credito}`, 5, y);
  y += 5;
  doc.text(`Cuotas: ${currentRowData.value.cuotas}`, 5, y);
  y += 5;
  doc.text(`Saldo Pendiente: RD$ ${currentRowData.value.saldo}`, 5, y);
  y += 10;

  // Línea separadora
  doc.line(5, y, 75, y);
  y += 5;

  // Pagos realizados
  doc.setFontSize(8);
  doc.text(`Pagos`, 5, y);
  y += 5;

  const pagosArray = JSON.parse(currentRowData.value.pagos || "[]");

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
  doc.text(`Total Crédito: RD$ ${currentRowData.value.monto_credito}`, 5, y);
  y += 5;
  doc.text(`Total Abonado: RD$ ${currentRowData.value.abonado}`, 5, y);
  y += 5;
  doc.text(`Saldo Pendiente: RD$ ${currentRowData.value.saldo}`, 5, y);
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
const datosEmpresa2 = JSON.stringify(enviarDatosLocalStorage());
/************************************************************************/
const fnImprimirTicket = async () => {
  try {
    // Crear copia limpia sin referencias circulares
    const datosApartadoCompleto = {
      no_emision: currentRowData.value.no_emision,
      no_factura: currentRowData.value.no_factura,
      cod_cliente: currentRowData.value.cod_cliente,
      nombre_cliente: currentRowData.value.nombre_cliente,
      cedula_cliente: currentRowData.value.cedula_cliente,
      telefono_cliente: currentRowData.value.telefono_cliente,
      whatsapp_cliente: currentRowData.value.whatsapp_cliente,
      email_cliente: currentRowData.value.email_cliente,
      direccion_cliente: currentRowData.value.direccion_cliente,
      productos: currentRowData.value.productos,
      fecha_emision: currentRowData.value.fecha_emision,
      hora: currentRowData.value.hora,
      fecha_vencimiento: currentRowData.value.fecha_vencimiento,
      monto_credito: currentRowData.value.monto_credito,
      cuotas: currentRowData.value.cuotas,
      tiempo: currentRowData.value.tiempo,
      fecha_ultimo_pago: currentRowData.value.fecha_ultimo_pago,
      proxima_fecha_pago: currentRowData.value.proxima_fecha_pago,
      abonado: currentRowData.value.abonado,
      saldo: currentRowData.value.saldo,
      estatus: currentRowData.value.estatus,
      vendedor: currentRowData.value.vendedor,
      pagos: currentRowData.value.pagos,
      nota: currentRowData.value.nota
    };

    await window.electron.ipcRenderer.invoke('ticketApartado', JSON.stringify(currentRowData.value), datosEmpresa2);
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
      no_emision: currentRowData.value.no_emision,
      no_factura: currentRowData.value.no_factura,
      cod_cliente: currentRowData.value.cod_cliente,
      nombre_cliente: currentRowData.value.nombre_cliente,
      cedula_cliente: currentRowData.value.cedula_cliente,
      telefono_cliente: currentRowData.value.telefono_cliente,
      whatsapp_cliente: currentRowData.value.whatsapp_cliente,
      email_cliente: currentRowData.value.email_cliente,
      direccion_cliente: currentRowData.value.direccion_cliente,
      productos: currentRowData.value.productos,
      fecha_emision: currentRowData.value.fecha_emision,
      hora: currentRowData.value.hora,
      fecha_vencimiento: currentRowData.value.fecha_vencimiento,
      monto_credito: currentRowData.value.monto_credito,
      cuotas: currentRowData.value.cuotas,
      tiempo: currentRowData.value.tiempo,
      fecha_ultimo_pago: currentRowData.value.fecha_ultimo_pago,
      proxima_fecha_pago: currentRowData.value.proxima_fecha_pago,
      abonado: currentRowData.value.abonado,
      saldo: currentRowData.value.saldo,
      estatus: currentRowData.value.estatus,
      vendedor: currentRowData.value.vendedor,
      pagos: currentRowData.value.pagos,
      nota: currentRowData.value.nota
    };

    const clienteLimpio = {
      nombre: currentRowData.value.nombre_cliente || '',
      telefono: currentRowData.value.telefono_cliente || '',
      rnc: currentRowData.value.cedula_cliente || '',
      direccion: currentRowData.value.direccion_cliente || ''
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
<main class="apartados-container">
  <div class="w-full">
    <!-- Header Profesional -->
    <div class="apartados-header mb-4">
      <div class="apartados-header-content">
        <div class="apartados-icon-wrapper">
          <i class="pi pi-bookmark apartados-icon"></i>
        </div>
        <div>
          <h1 class="apartados-title">Gestión de Apartados</h1>
          <p class="apartados-subtitle">Administración de pagos y apartados de clientes</p>
        </div>
      </div>
    </div>

    <!-- Dashboard de Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <!-- Apartados Pendientes -->
      <Card class="stat-card stat-card-warning">
        <template #content>
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Pendientes</p>
              <h3 class="stat-value">{{ estadisticasApartados.pendientes }}</h3>
              <p class="stat-amount">{{ formatCurrency(estadisticasApartados.totalSaldo) }}</p>
            </div>
            <div class="stat-icon-wrapper stat-icon-warning">
              <i class="pi pi-clock"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Apartados Saldados -->
      <Card class="stat-card stat-card-success">
        <template #content>
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Saldados</p>
              <h3 class="stat-value">{{ estadisticasApartados.saldados }}</h3>
              <p class="stat-amount">Completados</p>
            </div>
            <div class="stat-icon-wrapper stat-icon-success">
              <i class="pi pi-check-circle"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Monto Total -->
      <Card class="stat-card stat-card-primary">
        <template #content>
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Monto Total</p>
              <h3 class="stat-value">{{ formatCurrency(estadisticasApartados.totalMonto) }}</h3>
              <p class="stat-amount">Crédito total</p>
            </div>
            <div class="stat-icon-wrapper stat-icon-primary">
              <i class="pi pi-dollar"></i>
            </div>
          </div>
        </template>
      </Card>

      <!-- Total Registros -->
      <Card class="stat-card stat-card-info">
        <template #content>
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">Total Apartados</p>
              <h3 class="stat-value">{{ estadisticasApartados.total }}</h3>
              <p class="stat-amount">Registros totales</p>
            </div>
            <div class="stat-icon-wrapper stat-icon-info">
              <i class="pi pi-list"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Toolbar y Búsqueda -->
    <Card class="toolbar-card mb-4">
      <template #content>
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <Button icon="pi pi-refresh" label="Recargar" @click="fetchAndSetupData" severity="secondary" />
            <router-link to="/crearapartados">
              <Button icon="pi pi-plus" label="Nuevo Apartado" severity="success" />
            </router-link>
            <Button icon="pi pi-trash" label="Eliminar" @click="borrarSeleccionados" severity="danger" />
            <Button
              v-if="usuarioLocal.usuario == 'Soporte'"
              label="Borrar Todo"
              icon="pi pi-trash"
              severity="danger"
              @click="borrarTodo"
            />
          </div>
          <div class="search-wrapper">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="Buscar apartados..." class="search-input" />
            </span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Tabla de Apartados -->
    <Card class="table-card">
      <template #content>
        <DataTable
          :value="filteredApartados"
          scrollable
          scrollHeight="500px"
          dataKey="id"
          paginator
          :rows="10"
          v-model:selection="selectedItems"
          @rowSelect="onRowSelect"
          selectionMode="single"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          class="apartados-table"
          :rowClass="rowClass"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column header="Acciones" frozen style="min-width: 100px">
            <template #body="slotProps">
              <Button
                icon="pi pi-ellipsis-v"
                severity="secondary"
                text
                @click="toggleApartados($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
              />
              <Menu
                ref="menu"
                id="overlay_menu_Apartados"
                :model="itemsApartados"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="no_factura" header="No. Factura" style="min-width: 120px">
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-file text-orange-500"></i>
                <span class="font-semibold">{{ slotProps.data.no_factura }}</span>
              </div>
            </template>
          </Column>
          <Column field="nombre_cliente" header="Cliente" style="min-width: 200px">
            <template #body="slotProps">
              <div>
                <div class="font-semibold">{{ slotProps.data.nombre_cliente }}</div>
                <div class="text-sm text-gray-500">{{ slotProps.data.telefono_cliente }}</div>
              </div>
            </template>
          </Column>
          <Column field="fecha_emision" header="Fecha Emisión" style="min-width: 120px"></Column>
          <Column field="monto_credito" header="Monto Total" style="min-width: 120px">
            <template #body="slotProps">
              <span class="font-semibold">{{ formatCurrency(slotProps.data.monto_credito) }}</span>
            </template>
          </Column>
          <Column field="abonado" header="Abonado" style="min-width: 120px">
            <template #body="slotProps">
              <span class="text-green-600 font-semibold">{{ formatCurrency(slotProps.data.abonado) }}</span>
            </template>
          </Column>
          <Column field="saldo" header="Saldo" style="min-width: 120px">
            <template #body="slotProps">
              <span class="text-orange-600 font-semibold">{{ formatCurrency(slotProps.data.saldo) }}</span>
            </template>
          </Column>
          <Column field="estatus" header="Estado" style="min-width: 120px">
            <template #body="slotProps">
              <Badge :value="slotProps.data.estatus" :severity="getSeverityEstatus(slotProps.data.estatus)" />
            </template>
          </Column>
          <Column field="cuotas" header="Cuotas" style="min-width: 100px"></Column>
          <Column field="fecha_vencimiento" header="Vencimiento" style="min-width: 130px"></Column>
          <Column field="vendedor" header="Vendedor" style="min-width: 150px"></Column>
        </DataTable>
      </template>
    </Card>

    <!-- Modal de Abono Modernizado -->
    <Dialog v-model:visible="visibleAbonoModal" modal :style="{ width: '40rem' }" class="abono-dialog">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
            <i class="pi pi-wallet text-orange-600 text-2xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-800 m-0">Registrar Abono</h3>
            <p class="text-sm text-gray-500 m-0">{{currentRowData.nombre_cliente}}</p>
          </div>
        </div>
      </template>

      <div class="abono-modal-content">
        <!-- Resumen del Apartado -->
        <div class="abono-resumen mb-4">
          <div class="grid grid-cols-3 gap-3">
            <div class="resumen-item">
              <p class="resumen-label">Monto Total</p>
              <p class="resumen-value">{{ formatCurrency(currentRowData.monto_credito) }}</p>
            </div>
            <div class="resumen-item">
              <p class="resumen-label">Abonado</p>
              <p class="resumen-value text-green-600">{{ formatCurrency(currentRowData.abonado) }}</p>
            </div>
            <div class="resumen-item">
              <p class="resumen-label">Saldo</p>
              <p class="resumen-value text-orange-600">{{ formatCurrency(currentRowData.saldo) }}</p>
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
  </div>
<Toast />
</main>
</template>
<style scoped>
/* ===== Container Principal ===== */
.apartados-container {
  padding: 1rem;
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  min-height: 100vh;
}

/* ===== Header Profesional ===== */
.apartados-header {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
  animation: slideIn 0.5s ease-out;
}

.apartados-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.apartados-icon-wrapper {
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

.apartados-icon {
  font-size: 1.5rem;
  color: white;
}

.apartados-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.apartados-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* ===== Stat Cards ===== */
.stat-card {
  border-radius: 10px;
  border: none;
  transition: all 0.3s ease;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-card :deep(.p-card-body) {
  padding: 0;
}

.stat-card :deep(.p-card-content) {
  padding: 1.25rem;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.stat-amount {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.stat-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon-warning {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

.stat-icon-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.stat-icon-primary {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.stat-icon-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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

.search-wrapper {
  min-width: 250px;
}

.search-input {
  width: 100%;
}

/* ===== Table Card ===== */
.table-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
}

.table-card :deep(.p-card-body) {
  padding: 0;
}

.table-card :deep(.p-card-content) {
  padding: 0;
}

/* ===== DataTable Styles ===== */
.apartados-table :deep(.p-datatable-header) {
  background: transparent;
  border: none;
  padding: 1rem;
}

.apartados-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.875rem;
  border: none;
}

.apartados-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.apartados-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #fff7ed !important;
}

.apartados-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.875rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #f3f4f6;
}

/* Row Coloring */
.apartados-table :deep(.row-saldado) {
  background-color: #f0fdf4;
}

.apartados-table :deep(.row-pendiente) {
  background-color: #fffbeb;
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

/* ===== Responsive Design ===== */
@media (max-width: 1024px) {
  .apartados-container {
    padding: 0.75rem;
  }

  .apartados-header {
    padding: 1rem;
  }

  .apartados-title {
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .apartados-container {
    padding: 0.5rem;
  }

  .apartados-header {
    padding: 0.75rem;
  }

  .apartados-header-content {
    flex-direction: column;
    text-align: center;
  }

  .apartados-title {
    font-size: 1.125rem;
  }

  .apartados-subtitle {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-icon-wrapper {
    width: 3rem;
    height: 3rem;
    font-size: 1.25rem;
  }

  .search-wrapper {
    min-width: 100%;
    width: 100%;
  }

  .toolbar-card :deep(.p-card-body) {
    padding: 0.75rem;
  }
}

/* ===== Custom Scrollbar ===== */
.apartados-table :deep(.p-datatable-wrapper)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.apartados-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.apartados-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 4px;
}

.apartados-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
}
</style>

