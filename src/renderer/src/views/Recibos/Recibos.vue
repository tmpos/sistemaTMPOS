<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, generadorCodigo, enviarDatosLocalStorage, peticionesFetchOffline, arrayToObjetoFromTablaOffline,crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import jsPDF from 'jspdf';
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["no_emision","empresa","fecha","hora","tipo_recibo","cantidad","total_trabajo","balance_pendiente","concepto","descripcion_trabajo","pagadopor","recibidopor","usuario"];
/************************************************************************/
import { useDatosEmpresa } from '@/stores'
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
const datoscamposRecibos = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const RecibosEditar = ref(null);
/************************************************************************/
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposRecibos.value = {}
await campos();
}
/************************************************************************/
watchEffect(async() => {
  if (visiblecrear.value) {

      const ultimaFactura = await peticionesFetchOffline('getMaxValue', 'recibos', 'no_emision');

    datoscamposRecibos.value.no_emision = generadorCodigo(ultimaFactura[0], '', 7);
    datoscamposRecibos.value.fecha = nfecha('fecha');
    datoscamposRecibos.value.hora = nfecha('hora');
    datoscamposRecibos.value.tipo_recibo = 'PAGO COMPLETO';
    datoscamposRecibos.value.cantidad = '0.00';
    datoscamposRecibos.value.total_trabajo = '0.00';
    datoscamposRecibos.value.balance_pendiente = '0.00';
    datoscamposRecibos.value.pagadopor = usuarioLocal.value.nombre;



  }
});
/************************************************************************/
const calcularBalance = () => {
  const total = parseFloat(datoscamposRecibos.value.total_trabajo || 0);
  const cantidad = parseFloat(datoscamposRecibos.value.cantidad || 0);
  datoscamposRecibos.value.balance_pendiente = (total - cantidad).toFixed(2);
};
/************************************************************************/
const fetchAndSetupData = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'recibos');
    if (response && Array.isArray(response)) {
      data.value = response.reverse();
    } else {
      data.value = [];
      console.warn('No se encontraron recibos o la respuesta no es un array');
    }
  } catch (error) {
    console.error('Error en fetchAndSetupData:', error);
    data.value = [];
  }
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('recibos');
  datoscamposRecibos.value = campos;
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
  patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
  tokenCifrado.value = await encryptarPassword(token.value, 10);
} catch (error) {
  console.error('Error al cargar configuración:', error);
}

try {
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
} catch (error) {
  console.error('Error al cargar usuario local:', error);
  usuarioLocal.value = {};
}

try {
  await crearTablaSiNoExisteOffline('recibos', camposArray, toast);
  await campos();
} catch (error) {
  console.error('Error al crear tabla o campos:', error);
}

// Siempre cargar los datos, incluso si hay errores previos
try {
  await fetchAndSetupData();
} catch (error) {
  console.error('Error al cargar datos:', error);
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los recibos', life: 3000 });
}
});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¶¨EstÇ­s seguro?",
        text: "¶­Se borrarÇ­n los datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "SÇð, de acuerdo",
        cancelButtonText: "No, cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseÇña',
                input: 'password',
                inputPlaceholder: 'ContraseÇña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
               if (password === token.value || password === tokenCorto.value) {
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'recibos');
                    if (envioDatos[0] == 'ok') {
                        fetchAndSetupData();
                        toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos borrados', life: 3000 });
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
                   }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'ContraseÇña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
        }
    });
}
/************************************************************************/
async function funcionActualizar() {
  const url = link.value+api.value+"/actualizarcampos/recibos";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'recibos', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function funcionCrear() {
  const url = link.value+api.value+"/insertar/recibos";
  if (datoscamposRecibos.value.hasOwnProperty('created_at')) {
    datoscamposRecibos.value.created_at = nfecha('timestamp');
    datoscamposRecibos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'recibos', JSON.stringify(datoscamposRecibos.value));
  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();

 const datos = {
    datos:datoscamposRecibos.value
 }

 const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
 window.electron.ipcRenderer.invoke('recibo',JSON.stringify(datos),datosEmpresa);


    toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos Agregados', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function borrarSeleccionados() {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
    Swal.fire({
        title: "¶¨Estas Seguro?",
        text: "Se Borraran los Datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "SÇð, de acuerdo!",
        cancelButtonText: "No, cancelar!",
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseÇña',
                input: 'password',
                inputPlaceholder: 'ContraseÇña',
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'recibos', id);
                            } catch (error) {
                                console.error(`Error al eliminar datos para ID: ${id}`, error);
                                exitoTotal = false;
                            }
                        }
                        if (exitoTotal) {
                            fetchAndSetupData();
                            toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos Borrados', life: 3000 });
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar los datos.', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay datos para borrar', life: 3000 });
                    }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'ContraseÇña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos Seguros', life: 3000 });
        }
    });
}
/************************************************************************/
const itemsRecibos = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleRecibos = (event, rowData) => {
currentRowData.value = rowData;
itemsRecibos.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
datoscampos.value = { ...currentRowData.value };
visible.value = true;
} },
{ label: 'Imprimir', icon: 'pi pi-print', command: () => fnImprimirRecibo(currentRowData.value) },
{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {
            Swal.fire({
                title: 'Introduce la contraseÇña',
                input: 'password',
                inputPlaceholder: 'ContraseÇña',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const contrasenaIngresada = result.value;
                    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'recibos', rowData.id);
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Ç%xito', detail: 'Datos eliminados correctamente', life: 3000 });
                            await fetchAndSetupData()
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'ContraseÇña incorrecta', life: 3000 });
                    }
                }
            });
        }
    },
];
menu.value.toggle(event);
};
/************************************************************************/
const fnImprimirRecibo = async (recibo) => {
  if (!recibo) return;
  const { isConfirmed, isDenied } = await Swal.fire({
    title: 'Seleccionar formato',
    text: 'Elige el formato para imprimir el recibo',
    icon: 'question',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Carta / A4',
    denyButtonText: 'Ticket 80mm',
    cancelButtonText: 'Cerrar'
  });
  if (!isConfirmed && !isDenied) return;
  const esTicket = isDenied;
  const empresa = datosEmpresa.empresa || {};
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: esTicket ? [80, 240] : 'a4'
  });
  const pageWidth = doc.internal.pageSize.getWidth();

  const marginX = esTicket ? 6 : 14;
  const contentWidth = pageWidth - marginX * 2;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, esTicket ? 26 : 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(esTicket ? 12 : 18);
  doc.text(empresa.nombre || 'RECIBO DE PAGO', marginX, esTicket ? 13 : 16);
  doc.setFontSize(esTicket ? 9 : 11);
  doc.text(empresa.direccion || '', marginX, esTicket ? 18 : 23);
  const contacto = [empresa.telefono, empresa.email].filter(Boolean).join(' • ');
  if (contacto) doc.text(contacto, marginX, esTicket ? 23 : 29);

  // Body
  doc.setTextColor(15, 23, 42);
  const accent = { r: 14, g: 165, b: 233 };
  let y = esTicket ? 34 : 42;

  const label = (text, posY, posX = marginX) => {
    doc.setFontSize(esTicket ? 8 : 10);
    doc.setTextColor(100, 116, 139);
    doc.text(text, posX, posY);
  };
  const value = (text, posY, posX = marginX) => {
    doc.setFontSize(esTicket ? 10 : 12);
    doc.setTextColor(15, 23, 42);
    doc.text(text || '-', posX, posY);
  };

  // Primera fila
  const col2 = marginX + contentWidth / 2;
  label('No. emision', y); value(recibo.no_emision, y + 6);
  label('Fecha', y, col2); value(recibo.fecha, y + 6, col2);
  y += esTicket ? 14 : 18;

  // Segunda fila
  label('Hora', y); value(recibo.hora, y + 6);
  label('Empresa', y, col2); value(recibo.empresa || empresa.nombre, y + 6, col2);
  y += esTicket ? 14 : 16;

  // Tipo de recibo
  if (recibo.tipo_recibo) {
    label('Tipo de recibo', y);
    doc.setFontSize(esTicket ? 10 : 12);
    doc.setTextColor(14, 165, 233);
    doc.text(recibo.tipo_recibo, marginX, y + 6);
    y += esTicket ? 14 : 16;
  }

  // Cantidad destacada
  const boxHeight = esTicket ? 14 : 16;
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.roundedRect(marginX, y, contentWidth, boxHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(esTicket ? 10 : 12);
  const cantidadLabel = recibo.tipo_recibo !== 'PAGO COMPLETO' ? 'Monto del ' + recibo.tipo_recibo.toLowerCase() : 'Cantidad';
  doc.text(cantidadLabel, marginX + 4, y + boxHeight - 5);
  doc.setFontSize(esTicket ? 12 : 16);
  doc.text(`${recibo.cantidad || '0.00'}`, marginX + contentWidth - 4, y + boxHeight - 5, { align: 'right' });
  y += boxHeight + (esTicket ? 12 : 16);

  // Información adicional para adelantos/abonos
  if (recibo.tipo_recibo !== 'PAGO COMPLETO' && recibo.total_trabajo) {
    doc.setTextColor(15, 23, 42);
    label('Total del trabajo', y); value(`$${recibo.total_trabajo}`, y + 6);
    label('Balance pendiente', y, col2);
    doc.setFontSize(esTicket ? 10 : 12);
    doc.setTextColor(220, 38, 38);
    doc.text(`$${recibo.balance_pendiente || '0.00'}`, col2, y + 6);
    y += esTicket ? 14 : 16;
    doc.setTextColor(15, 23, 42);
  }

  doc.setTextColor(15, 23, 42);
  label('Concepto', y);
  const concepto = doc.splitTextToSize(recibo.concepto || '-', contentWidth);
  doc.text(concepto, marginX, y + 8);
  y += 12 + concepto.length * 6;

  // Descripción del trabajo para adelantos/abonos
  if (recibo.tipo_recibo !== 'PAGO COMPLETO' && recibo.descripcion_trabajo) {
    label('Descripción del trabajo', y);
    const descripcion = doc.splitTextToSize(recibo.descripcion_trabajo || '-', contentWidth);
    doc.text(descripcion, marginX, y + 8);
    y += 12 + descripcion.length * 6;
  }

  label('Pagado por', y); value(recibo.pagadopor, y + 6);
  label('Recibido por', y, col2); value(recibo.recibidopor, y + 6, col2);

  // Footer
  const footerY = esTicket ? doc.internal.pageSize.getHeight() - 8 : 285;
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.line(marginX, footerY - 2, marginX + contentWidth, footerY - 2);
  doc.setFontSize(esTicket ? 8 : 10);
  doc.setTextColor(100, 116, 139);
  doc.text('Generado por el sistema', marginX, footerY);

  const pdfData = doc.output('datauristring');
  await Swal.fire({
    title: 'Vista previa del recibo',
    width: '80%',
    html: `<embed src="${pdfData}#toolbar=1" type="application/pdf" width="100%" height="500px" />`,
    showCancelButton: true,
    cancelButtonText: 'Cerrar',
    confirmButtonText: 'Imprimir',
    preConfirm: () => {
      const blobUrl = doc.output('bloburl');
      const printWindow = window.open(blobUrl, '_blank');
      printWindow?.print();
    }
  });
};
/************************************************************************/
const filteredRecibos = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const fnRouter = (ruta) => {
  router.push(ruta);
};
/************************************************************************/
</script>
<template>
  <main class="receipts-wrapper">
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <section class="receipts-hero shadow-lg">
        <div class="receipts-hero__text">
          <p class="eyebrow">Recibos</p>
          <h1>Gestión de recibos</h1>
          <p>Registra, revisa y emite recibos con una vista clara y acciones rápidas.</p>
          <div class="receipts-hero__meta">
            <span class="meta-pill">
              <i class="pi pi-user"></i>
              {{ usuarioLocal.usuario || 'Usuario' }}
            </span>
            <span class="meta-pill">
              <i class="pi pi-calendar"></i>
              {{ new Date().toLocaleDateString() }}
            </span>
          </div>
        </div>
        <div class="receipts-hero__stats">
          <div class="stat-card">
            <span class="label">Recibos</span>
            <span class="value">{{ filteredRecibos.length }}</span>
          </div>
          <div class="stat-card alt">
            <span class="label">Filtro activo</span>
            <span class="value">{{ searchQuery ? 'Si' : 'No' }}</span>
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Acciones</p>
            <h2>Administrar recibos</h2>
            <span class="helper-text">Recarga, agrega o elimina registros con controles claros.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-sync" label="Recargar" severity="info" outlined @click="fetchAndSetupData" />
            <Button icon="pi pi-plus" label="Nuevo recibo" severity="success" @click="visiblecrear = true" />
            <Button icon="pi pi-trash" label="Borrar seleccion" severity="danger" outlined @click="borrarSeleccionados" />
            <Button
              v-if="usuarioLocal.usuario =='Soporte'"
              icon="pi pi-times"
              label="Borrar todo"
              severity="danger"
              @click="borrarTodo"
            />
          </div>
        </div>

        <div class="panel__body">
          <div class="filter-bar">
            <div class="filter-bar__input">
              <i class="pi pi-search"></i>
              <input v-model="searchQuery" placeholder="Buscar recibos..." type="text" />
            </div>
            <div class="filter-bar__info">
              <span class="pill">Resultados: {{ filteredRecibos.length }}</span>
            </div>
          </div>

          <DataTable
            class="receipts-table"
            :value="filteredRecibos"
            scrollable
            scrollHeight="600px"
            dataKey="id"
            paginator
            :rows="10"
            v-model:selection="selectedItems"
            selectionMode="single"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            rowHover
            tableStyle="min-width: 50rem"
          >
            <template #header>
              <div class="table-header">
                <div>
                  <h3>Listado de recibos</h3>
                  <p class="helper-text">Selecciona una fila para ver opciones rápidas.</p>
                </div>
              </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column header="Opciones">
              <template #body="slotProps">
                <Button
                  icon="pi pi-cog"
                  severity="secondary"
                  text
                  rounded
                  @click="toggleRecibos($event, slotProps.data)"
                  aria-haspopup="true"
                  aria-controls="overlay_menu_recibo"
                />
                <Menu
                  ref="menu"
                  id="overlay_menu_recibo"
                  :model="itemsRecibos"
                  :popup="true"
                />
              </template>
            </Column>
            <Column field="no_emision" header="No emisión"></Column>
            <Column field="tipo_recibo" header="Tipo"></Column>
            <Column field="empresa" header="Empresa"></Column>
            <Column field="fecha" header="Fecha"></Column>
            <Column field="hora" header="Hora"></Column>
            <Column field="cantidad" header="Monto"></Column>
            <Column field="total_trabajo" header="Total trabajo">
              <template #body="slotProps">
                {{ slotProps.data.tipo_recibo !== 'PAGO COMPLETO' ? slotProps.data.total_trabajo : '-' }}
              </template>
            </Column>
            <Column field="balance_pendiente" header="Balance pendiente">
              <template #body="slotProps">
                {{ slotProps.data.tipo_recibo !== 'PAGO COMPLETO' ? slotProps.data.balance_pendiente : '-' }}
              </template>
            </Column>
            <Column field="concepto" header="Concepto"></Column>
            <Column field="pagadopor" header="Pagado por"></Column>
            <Column field="recibidopor" header="Recibido por"></Column>
            <Column field="usuario" header="Usuario"></Column>
          </DataTable>
        </div>
      </section>

      <Dialog v-model:visible="visible" :position="position" modal header="Modificar Recibo" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <template #header>
          <div class="inline-flex align-items-center justify-content-center gap-2">
            <span class="font-bold white-space-nowrap">Editar recibo</span>
          </div>
        </template>
        <div class="form-grid">
          <input type="hidden" v-model="datoscampos.id" />
          <div class="field">
            <label for="no_emision-Actualizador">No emisión</label>
            <input id="no_emision-Actualizador" v-model="datoscampos.no_emision" type="text" v-solonumeros placeholder="No emisión" maxlength="250" />
          </div>
          <div class="field">
            <label for="empresa-Actualizador">Empresa</label>
            <input id="empresa-Actualizador" v-model="datoscampos.empresa" type="text" placeholder="Empresa" v-mayuscula maxlength="250" />
          </div>
          <div class="field">
            <label for="fecha-Actualizador">Fecha</label>
            <input id="fecha-Actualizador" v-model="datoscampos.fecha" type="text" v-datepicker placeholder="Fecha" maxlength="250" />
          </div>
          <div class="field">
            <label for="hora-Actualizador">Hora</label>
            <input id="hora-Actualizador" v-model="datoscampos.hora" type="text" placeholder="Hora" maxlength="250" />
          </div>
          <div class="field">
            <label for="tipo-recibo-Actualizador">Tipo de recibo</label>
            <select id="tipo-recibo-Actualizador" v-model="datoscampos.tipo_recibo" class="select-field">
              <option value="PAGO COMPLETO">PAGO COMPLETO</option>
              <option value="ADELANTO">ADELANTO</option>
              <option value="ABONO">ABONO</option>
            </select>
          </div>
          <div class="field">
            <label for="cantidad-Actualizador">{{ datoscampos.tipo_recibo === 'PAGO COMPLETO' ? 'Cantidad' : 'Monto del adelanto/abono' }}</label>
            <input id="cantidad-Actualizador" v-model="datoscampos.cantidad" type="text" v-solonumeros v-numeroFocusinOut v-decimales placeholder="Cantidad" maxlength="250" />
          </div>
          <div class="field" v-if="datoscampos.tipo_recibo !== 'PAGO COMPLETO'">
            <label for="total-trabajo-Actualizador">Total del trabajo</label>
            <input id="total-trabajo-Actualizador" v-model="datoscampos.total_trabajo" type="text" v-solonumeros v-numeroFocusinOut v-decimales placeholder="Total" maxlength="250" />
          </div>
          <div class="field" v-if="datoscampos.tipo_recibo !== 'PAGO COMPLETO'">
            <label for="balance-pendiente-Actualizador">Balance pendiente</label>
            <input id="balance-pendiente-Actualizador" v-model="datoscampos.balance_pendiente" type="text" placeholder="Balance" maxlength="250" readonly />
          </div>
          <div class="field full">
            <label for="concepto-Actualizador">Concepto</label>
            <textarea id="concepto-Actualizador" v-model="datoscampos.concepto" rows="3"></textarea>
          </div>
          <div class="field full" v-if="datoscampos.tipo_recibo !== 'PAGO COMPLETO'">
            <label for="descripcion-trabajo-Actualizador">Descripción del trabajo</label>
            <textarea id="descripcion-trabajo-Actualizador" v-model="datoscampos.descripcion_trabajo" rows="3"></textarea>
          </div>
          <div class="field">
            <label for="pagadopor-Actualizador">Pagado por</label>
            <input id="pagadopor-Actualizador" v-model="datoscampos.pagadopor" type="text" v-mayuscula placeholder="Pagado por" maxlength="250" />
          </div>
          <div class="field">
            <label for="recibidopor-Actualizador">Recibido por</label>
            <input id="recibidopor-Actualizador" v-model="datoscampos.recibidopor" type="text" v-mayuscula placeholder="Recibido por" maxlength="250" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" text severity="secondary" @click="visible = false" />
          <Button label="Guardar" outlined severity="primary" @click="funcionActualizar" />
        </template>
      </Dialog>

      <Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Recibo" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
        <template #header>
          <div class="inline-flex align-items-center justify-content-center gap-2">
            <span class="font-bold white-space-nowrap">Nuevo recibo</span>
          </div>
        </template>
        <div class="form-grid">
          <div class="field">
            <label for="no_emisionAgregarDatos">No emisión</label>
            <input id="no_emisionAgregarDatos" v-model="datoscamposRecibos.no_emision" type="text" v-solonumeros placeholder="No emisión" maxlength="250" readonly />
          </div>
          <div class="field">
            <label for="empresaAgregarDatos">Empresa</label>
            <input id="empresaAgregarDatos" v-model="datoscamposRecibos.empresa" type="text" v-mayuscula placeholder="Empresa" maxlength="250" />
          </div>
          <div class="field">
            <label for="fechaAgregarDatos">Fecha</label>
            <input id="fechaAgregarDatos" v-model="datoscamposRecibos.fecha" type="text" placeholder="Fecha" maxlength="250" readonly />
          </div>
          <div class="field">
            <label for="horaAgregarDatos">Hora</label>
            <input id="horaAgregarDatos" v-model="datoscamposRecibos.hora" type="text" placeholder="Hora" maxlength="250" readonly />
          </div>
          <div class="field">
            <label for="tipo-reciboAgregarDatos">Tipo de recibo</label>
            <select id="tipo-reciboAgregarDatos" v-model="datoscamposRecibos.tipo_recibo" class="select-field">
              <option value="PAGO COMPLETO">PAGO COMPLETO</option>
              <option value="ADELANTO">ADELANTO</option>
              <option value="ABONO">ABONO</option>
            </select>
          </div>
          <div class="field">
            <label for="cantidadAgregarDatos">{{ datoscamposRecibos.tipo_recibo === 'PAGO COMPLETO' ? 'Cantidad' : 'Monto del adelanto/abono' }}</label>
            <input id="cantidadAgregarDatos" v-model="datoscamposRecibos.cantidad" type="text" v-solonumeros v-numeroFocusinOut v-decimales placeholder="Cantidad" maxlength="250" @input="calcularBalance" />
          </div>
          <div class="field" v-if="datoscamposRecibos.tipo_recibo !== 'PAGO COMPLETO'">
            <label for="total-trabajoAgregarDatos">Total del trabajo</label>
            <input id="total-trabajoAgregarDatos" v-model="datoscamposRecibos.total_trabajo" type="text" v-solonumeros v-numeroFocusinOut v-decimales placeholder="Total" maxlength="250" @input="calcularBalance" />
          </div>
          <div class="field" v-if="datoscamposRecibos.tipo_recibo !== 'PAGO COMPLETO'">
            <label for="balance-pendienteAgregarDatos">Balance pendiente</label>
            <input id="balance-pendienteAgregarDatos" v-model="datoscamposRecibos.balance_pendiente" type="text" placeholder="Balance" maxlength="250" readonly />
          </div>
          <div class="field full">
            <label for="conceptoAgregarDatos">Concepto</label>
            <textarea id="conceptoAgregarDatos" v-model="datoscamposRecibos.concepto" rows="3"></textarea>
          </div>
          <div class="field full" v-if="datoscamposRecibos.tipo_recibo !== 'PAGO COMPLETO'">
            <label for="descripcion-trabajoAgregarDatos">Descripción del trabajo</label>
            <textarea id="descripcion-trabajoAgregarDatos" v-model="datoscamposRecibos.descripcion_trabajo" rows="3"></textarea>
          </div>
          <div class="field">
            <label for="pagadoporAgregarDatos">Pagado por</label>
            <input id="pagadoporAgregarDatos" v-model="datoscamposRecibos.pagadopor" type="text" v-mayuscula placeholder="Pagado por" maxlength="250" />
          </div>
          <div class="field">
            <label for="recibidoporAgregarDatos">Recibido por</label>
            <input id="recibidoporAgregarDatos" v-model="datoscamposRecibos.recibidopor" type="text" v-mayuscula placeholder="Recibido por" maxlength="250" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancelar" text severity="secondary" @click="visiblecrear = false" />
          <Button label="Guardar" outlined severity="primary" @click="funcionCrear" />
        </template>
      </Dialog>
      <Toast />
    </div>
  </main>
</template>
<style scoped>
.receipts-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #ffffff 100%);
  color: #0f172a;
}

.receipts-hero {
  background: linear-gradient(135deg, #0f172a, #1e293b 45%, #0ea5e9);
  color: #e2e8f0;
  border-radius: 18px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.receipts-hero__text h1 {
  margin: 4px 0 8px;
  font-size: 1.8rem;
  font-weight: 800;
}

.receipts-hero__text p {
  margin: 0;
  color: #cbd5e1;
}

.receipts-hero__meta {
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

.receipts-hero__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  align-items: center;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  padding: 14px;
  color: #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.stat-card.alt {
  background: rgba(14, 165, 233, 0.16);
}

.stat-card .label {
  display: block;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.stat-card .value {
  font-size: 1.6rem;
  font-weight: 800;
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

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 640px;
}

:deep(.actions-grid .p-button) {
  width: 100%;
}

.panel__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-bar__input {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  min-width: 260px;
}

.filter-bar__input input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  color: #0f172a;
}

.filter-bar__input input::placeholder {
  color: #94a3b8;
}

.filter-bar__info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pill {
  background: #0ea5e9;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 9999px;
  font-weight: 600;
}

.receipts-table {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

:deep(.receipts-table .p-datatable-header) {
  background: #f8fafc;
  border: 0;
  padding: 16px;
}

.table-header h3 {
  margin: 0;
  color: #0f172a;
}

:deep(.receipts-table .p-datatable-thead > tr > th) {
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 700;
  border: 0;
  padding: 14px 12px;
}

:deep(.receipts-table .p-datatable-tbody > tr > td) {
  padding: 12px 12px;
  border: 0;
  color: #1f2937;
  font-size: 0.95rem;
}

:deep(.receipts-table .p-datatable-tbody > tr:hover) {
  background: #ecfeff;
}

:deep(.receipts-table .p-paginator) {
  border-top: 1px solid #e2e8f0;
  padding: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
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
.field textarea,
.field .select-field {
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
.field textarea:focus,
.field .select-field:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
}

.select-field {
  cursor: pointer;
}

@media (max-width: 768px) {
  .receipts-hero {
    padding: 18px;
  }

  .panel {
    padding: 16px;
  }
}
</style>
