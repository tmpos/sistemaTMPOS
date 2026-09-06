<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,peticionesFetchOffline,
arrayToObjetoFromTablaOffline,
crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["ganancias","taller","cuentas_cobrar","cuentas_pagar","propinas","turno","nombre","username","fecha","hora_inicio","hora_cierre","cant_inicio","ventas","efectivo","tarjeta","transferencia","cheque","entradas","inversiones","gastos","devoluciones","estado","abono","otro","usuario"];
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
const datoscamposRegistrocaja = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const visibleCambiarEstado = ref(false);
const registroCambiarEstado = ref(null);
const guardandoEstado = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const RegistrocajaEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposRegistrocaja.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'registrocaja');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('registrocaja');
  datoscamposRegistrocaja.value = campos;
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
await crearTablaSiNoExisteOffline('registrocaja', camposArray, toast);
usuarioLocal.value = datosEmpresa.usuario
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'registrocaja');
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
async function funcionActualizar() {
  const url = link.value+api.value+"/actualizarcampos/registrocaja";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'registrocaja',JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const estadoCajaEstaAbierto = (estado) => {
  const estadoNormalizado = String(estado || '').trim().toUpperCase();
  return estadoNormalizado === 'ABIERTO' || estadoNormalizado === 'ABIERTA';
};

const estadoActualCaja = computed(() =>
  estadoCajaEstaAbierto(registroCambiarEstado.value?.estado) ? 'ABIERTO' : 'CERRADO'
);

const proximoEstadoCaja = computed(() =>
  estadoActualCaja.value === 'ABIERTO' ? 'CERRADO' : 'ABIERTO'
);

const abrirModalCambiarEstado = (registro) => {
  registroCambiarEstado.value = registro ? { ...registro } : null;
  visibleCambiarEstado.value = true;
};

const cambiarEstadoCaja = async () => {
  if (!registroCambiarEstado.value?.id || guardandoEstado.value) return;

  guardandoEstado.value = true;
  const datosActualizacion = {
    id: registroCambiarEstado.value.id,
    estado: proximoEstadoCaja.value
  };

  try {
    const envioDatos = await peticionesFetchOffline(
      'updateData',
      'registrocaja',
      JSON.stringify(datosActualizacion)
    );

    if (envioDatos?.[0] === 'ok') {
      visibleCambiarEstado.value = false;
      await fetchAndSetupData();
      toast.add({
        severity: datosActualizacion.estado === 'ABIERTO' ? 'success' : 'warn',
        summary: 'Estado actualizado',
        detail: `La caja ahora está ${datosActualizacion.estado}`,
        life: 3000
      });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.', life: 3000 });
    }
  } catch (error) {
    console.error('Error al cambiar el estado del registro de caja:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.', life: 3000 });
  } finally {
    guardandoEstado.value = false;
  }
};
/************************************************************************/
async function funcionCrear() {
  const url = link.value+api.value+"/insertar/registrocaja";
  if (datoscamposRegistrocaja.value.hasOwnProperty('created_at')) {
    datoscamposRegistrocaja.value.created_at = nfecha('timestamp');
    datoscamposRegistrocaja.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'registrocaja',JSON.stringify(datoscamposRegistrocaja.value));
  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'registrocaja',id);
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
const itemsRegistrocaja = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleRegistrocaja = (event, rowData) => {
currentRowData.value = rowData;
itemsRegistrocaja.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
visible.value = true;
datoscampos.value = currentRowData.value;
} },
{ label: 'Cambiar estado', icon: 'pi pi-sync', command: () => {
abrirModalCambiarEstado(currentRowData.value);
} },
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'registrocaja',rowData.id);
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
const filteredRegistrocaja = computed(() => {
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
<main class="content-wrapper">
  <div class="w-full px-4 mx-auto py-8 max-w-7xl">

    <!-- Header Mejorado -->
    <Card class="mb-6 shadow-lg">
      <template #content>
        <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span class="text-4xl">💰</span>
            </div>
            <div>
              <h1 class="text-2xl font-bold">Registro de Caja</h1>
              <p class="text-sm opacity-90 mt-1">Administra y controla los registros de apertura y cierre de caja</p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Acciones Rápidas -->
    <Card class="mb-6 shadow-lg">
      <template #content>
        <fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
          <legend class="float-none w-auto px-4 text-lg font-bold text-gray-700 dark:text-gray-200">
            ⚡ Acciones Rápidas
          </legend>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">

            <!-- Recargar -->
            <div
              @click="fetchAndSetupData"
              class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
            >
              <div class="flex flex-col items-center justify-center space-y-3">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span class="text-3xl">🔄</span>
                </div>
                <div class="text-center">
                  <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Recargar</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Actualizar datos</div>
                </div>
              </div>
            </div>

            <!-- Agregar Nuevo -->
            <div
              @click="visiblecrear = true"
              class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500"
            >
              <div class="flex flex-col items-center justify-center space-y-3">
                <div class="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span class="text-3xl">➕</span>
                </div>
                <div class="text-center">
                  <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Agregar Nuevo</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Crear registro</div>
                </div>
              </div>
            </div>

            <!-- Borrar Selección -->
            <div
              @click="borrarSeleccionados"
              class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500"
            >
              <div class="flex flex-col items-center justify-center space-y-3">
                <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span class="text-3xl">🗑️</span>
                </div>
                <div class="text-center">
                  <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Borrar Selección</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Eliminar seleccionados</div>
                </div>
              </div>
            </div>

            <!-- Borrar Todo (Solo Soporte) -->
            <div
              v-if="usuarioLocal.usuario == 'Soporte'"
              @click="borrarTodo"
              class="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500"
            >
              <div class="flex flex-col items-center justify-center space-y-3">
                <div class="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span class="text-3xl">⚠️</span>
                </div>
                <div class="text-center">
                  <div class="text-sm font-bold text-gray-700 dark:text-gray-200">Borrar Todo</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Eliminar todos</div>
                </div>
                <div class="absolute top-2 right-2">
                  <div class="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                </div>
              </div>
            </div>

          </div>
        </fieldset>
      </template>
    </Card>

    <!-- Tabla de Registros -->
    <Card class="shadow-lg">
      <template #content>
        <fieldset class="border-2 border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
          <legend class="float-none w-auto px-4 text-lg font-bold text-gray-700 dark:text-gray-200">
            📋 Listado de Registros de Caja
          </legend>

          <!-- Buscador -->
          <div class="flex justify-end mb-4 mt-4">
            <div class="w-full md:w-1/3">
              <IconField iconPosition="left">
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchQuery"
                  placeholder="Buscar registro..."
                  class="w-full"
                />
              </IconField>
            </div>
          </div>

          <!-- DataTable -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <DataTable
              :value="filteredRegistrocaja"
              scrollable
              scrollHeight="600px"
              dataKey="id"
              paginator
              :rows="10"
              v-model:selection="selectedItems"
              selectionMode="single"
              :rowsPerPageOptions="[5, 10, 20, 50]"
              class="p-datatable-sm">
              <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
              <Column header="Opciones" headerStyle="width: 5rem">
                <template #body="slotProps">
                  <Button
                    icon="pi pi-cog"
                    rounded
                    text
                    severity="secondary"
                    @click="toggleRegistrocaja($event, slotProps.data)"
                    aria-haspopup="true"
                    aria-controls="overlay_menu_factura"
                  />
                  <Menu
                    ref="menu"
                    id="overlay_menu_Registrocaja"
                    :model="itemsRegistrocaja"
                    :popup="true"
                  />
                </template>
              </Column>
              <Column field="fecha" header="Fecha">
                <template #body="slotProps">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">📅</span>
                    <span class="font-semibold">{{ slotProps.data.fecha }}</span>
                  </div>
                </template>
              </Column>
              <Column field="turno" header="Turno"></Column>
              <Column field="nombre" header="Cajero"></Column>
              <Column field="hora_inicio" header="Hora Inicio"></Column>
              <Column field="hora_cierre" header="Hora Cierre"></Column>
              <Column field="estado" header="Estado">
                <template #body="slotProps">
                  <Tag
                    :value="slotProps.data.estado"
                    :severity="estadoCajaEstaAbierto(slotProps.data.estado) ? 'success' : 'danger'"
                  />
                </template>
              </Column>
              <Column field="cant_inicio" header="Cant. Inicio"></Column>
              <Column field="ventas" header="Ventas"></Column>
              <Column field="efectivo" header="Efectivo"></Column>
              <Column field="tarjeta" header="Tarjeta"></Column>
              <Column field="transferencia" header="Transferencia"></Column>
              <Column field="cheque" header="Cheque"></Column>
              <Column field="ganancias" header="Ganancias"></Column>
              <Column field="gastos" header="Gastos"></Column>
              <Column field="devoluciones" header="Devoluciones"></Column>
              <Column field="entradas" header="Entradas"></Column>
              <Column field="inversiones" header="Inversiones"></Column>
              <Column field="abono" header="Abono"></Column>
              <Column field="propinas" header="Propinas"></Column>
              <Column field="taller" header="Taller"></Column>
              <Column field="cuentas_cobrar" header="Ctas. Cobrar"></Column>
              <Column field="cuentas_pagar" header="Ctas. Pagar"></Column>
              <Column field="otro" header="Otro"></Column>
            </DataTable>
          </div>
        </fieldset>
      </template>
    </Card>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visible" :position="position" modal :style="{ width: '60rem' }" :breakpoints="{ '1199px': '85vw', '575px': '95vw' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
        <span class="text-2xl">✏️</span>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 dark:text-white">Editar Registro de Caja</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Modificar información del registro</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <Accordion :multiple="true" :activeIndex="[0, 1, 2]">

      <!-- Información General -->
      <AccordionTab>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="text-lg">📋</span>
            <span class="font-semibold">Información General</span>
          </div>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
          <FloatLabel>
            <InputText id="turno-edit" v-model="datoscampos.turno" class="w-full" />
            <label for="turno-edit">Turno</label>
          </FloatLabel>

          <FloatLabel>
            <InputText id="nombre-edit" v-model="datoscampos.nombre" class="w-full" />
            <label for="nombre-edit">Nombre Cajero</label>
          </FloatLabel>

          <FloatLabel>
            <InputText id="username-edit" v-model="datoscampos.username" class="w-full" />
            <label for="username-edit">Username</label>
          </FloatLabel>

          <FloatLabel>
            <InputText id="fecha-edit" v-model="datoscampos.fecha" class="w-full" />
            <label for="fecha-edit">Fecha</label>
          </FloatLabel>

          <FloatLabel>
            <InputText id="hora-inicio-edit" v-model="datoscampos.hora_inicio" class="w-full" />
            <label for="hora-inicio-edit">Hora Inicio</label>
          </FloatLabel>

          <FloatLabel>
            <InputText id="hora-cierre-edit" v-model="datoscampos.hora_cierre" class="w-full" />
            <label for="hora-cierre-edit">Hora Cierre</label>
          </FloatLabel>

          <FloatLabel>
            <Dropdown id="estado-edit" v-model="datoscampos.estado" :options="['Abierta', 'Cerrada']" class="w-full" />
            <label for="estado-edit">Estado</label>
          </FloatLabel>
        </div>
      </AccordionTab>

      <!-- Montos y Métodos de Pago -->
      <AccordionTab>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="text-lg">💰</span>
            <span class="font-semibold">Montos y Métodos de Pago</span>
          </div>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
          <FloatLabel>
            <InputNumber id="cant-inicio-edit" v-model="datoscampos.cant_inicio" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="cant-inicio-edit">Cantidad Inicio</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="ventas-edit" v-model="datoscampos.ventas" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="ventas-edit">Ventas</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="efectivo-edit" v-model="datoscampos.efectivo" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="efectivo-edit">Efectivo</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="tarjeta-edit" v-model="datoscampos.tarjeta" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="tarjeta-edit">Tarjeta</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="transferencia-edit" v-model="datoscampos.transferencia" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="transferencia-edit">Transferencia</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="cheque-edit" v-model="datoscampos.cheque" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="cheque-edit">Cheque</label>
          </FloatLabel>
        </div>
      </AccordionTab>

      <!-- Movimientos Financieros -->
      <AccordionTab>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="text-lg">📊</span>
            <span class="font-semibold">Movimientos Financieros</span>
          </div>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
          <FloatLabel>
            <InputNumber id="ganancias-edit" v-model="datoscampos.ganancias" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="ganancias-edit">Ganancias</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="gastos-edit" v-model="datoscampos.gastos" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="gastos-edit">Gastos</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="entradas-edit" v-model="datoscampos.entradas" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="entradas-edit">Entradas</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="inversiones-edit" v-model="datoscampos.inversiones" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="inversiones-edit">Inversiones</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="devoluciones-edit" v-model="datoscampos.devoluciones" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="devoluciones-edit">Devoluciones</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="abono-edit" v-model="datoscampos.abono" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="abono-edit">Abono</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="propinas-edit" v-model="datoscampos.propinas" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="propinas-edit">Propinas</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="taller-edit" v-model="datoscampos.taller" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="taller-edit">Taller</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="cuentas-cobrar-edit" v-model="datoscampos.cuentas_cobrar" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="cuentas-cobrar-edit">Cuentas por Cobrar</label>
          </FloatLabel>

          <FloatLabel>
            <InputNumber id="cuentas-pagar-edit" v-model="datoscampos.cuentas_pagar" class="w-full" mode="currency" currency="USD" locale="en-US" />
            <label for="cuentas-pagar-edit">Cuentas por Pagar</label>
          </FloatLabel>

          <div class="col-span-full">
            <FloatLabel>
              <Textarea id="otro-edit" v-model="datoscampos.otro" rows="3" class="w-full" />
              <label for="otro-edit">Observaciones / Otros</label>
            </FloatLabel>
          </div>
        </div>
      </AccordionTab>

    </Accordion>
  </div>

  <template #footer>
    <div class="flex justify-end gap-3">
      <Button label="Cancelar" icon="pi pi-times" severity="secondary" text @click="visible = false" />
      <Button label="Guardar Cambios" icon="pi pi-check" severity="success" raised @click="funcionActualizar" />
    </div>
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog
  v-model:visible="visibleCambiarEstado"
  modal
  header="Cambiar estado de caja"
  :style="{ width: '32rem' }"
  :breakpoints="{ '575px': '92vw' }"
>
  <div v-if="registroCambiarEstado" class="flex flex-col items-center gap-5 py-4">
    <div class="text-center">
      <p class="mb-2 text-sm text-gray-500">Estado actual</p>
      <Tag
        :value="estadoActualCaja"
        :severity="estadoActualCaja === 'ABIERTO' ? 'success' : 'danger'"
        class="text-xl px-4 py-2"
      />
    </div>

    <p class="m-0 text-center text-gray-600">
      Presiona el botón para cambiar esta caja a <strong>{{ proximoEstadoCaja }}</strong>.
    </p>

    <Button
      :label="`CAMBIAR A ${proximoEstadoCaja}`"
      :icon="proximoEstadoCaja === 'ABIERTO' ? 'pi pi-lock-open' : 'pi pi-lock'"
      :severity="proximoEstadoCaja === 'ABIERTO' ? 'success' : 'danger'"
      :loading="guardandoEstado"
      size="large"
      raised
      class="w-full h-24 text-xl"
      @click="cambiarEstadoCaja"
    />
  </div>

  <template #footer>
    <Button
      label="Cancelar"
      icon="pi pi-times"
      severity="secondary"
      text
      :disabled="guardandoEstado"
      @click="visibleCambiarEstado = false"
    />
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Registrocaja" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Crear</span>
                </div>
            </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Registrocaja</legend>
     <form id="formularioActualizarRegistrocaja" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="gananciasAgregarDatos">GANANCIAS</label>
<input type="input" v-model="datoscamposRegistrocaja.ganancias" name="ganancias"  class="form-control soloNumero" id="gananciasAgregarDatos" v-solonumeros placeholder="ganancias" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="tallerAgregarDatos">TALLER</label>
<input type="input" v-model="datoscamposRegistrocaja.taller" name="taller"  class="form-control soloNumero" id="tallerAgregarDatos" v-solonumeros placeholder="taller" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="cuentas_cobrarAgregarDatos">CUENTAS_COBRAR</label>
<input type="input" v-model="datoscamposRegistrocaja.cuentas_cobrar" name="cuentas_cobrar"  class="form-control soloNumero" id="cuentas_cobrarAgregarDatos" v-solonumeros placeholder="cuentas_cobrar" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="cuentas_pagarAgregarDatos">CUENTAS_PAGAR</label>
<input type="input" v-model="datoscamposRegistrocaja.cuentas_pagar" name="cuentas_pagar"  class="form-control soloNumero" id="cuentas_pagarAgregarDatos" v-solonumeros placeholder="cuentas_pagar" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="propinasAgregarDatos">PROPINAS</label>
<input type="input" v-model="datoscamposRegistrocaja.propinas" name="propinas"  class="form-control soloNumero" id="propinasAgregarDatos" v-solonumeros placeholder="propinas" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="turnoAgregarDatos">TURNO</label>
<input type="input" v-model="datoscamposRegistrocaja.turno" name="turno"  class="form-control " id="turnoAgregarDatos"  placeholder="turno" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="nombreAgregarDatos">NOMBRE</label>
<input type="input" v-model="datoscamposRegistrocaja.nombre" name="nombre"  class="form-control " id="nombreAgregarDatos"  placeholder="nombre" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="usernameAgregarDatos">USERNAME</label>
<input type="input" v-model="datoscamposRegistrocaja.username" name="username"  class="form-control " id="usernameAgregarDatos"  placeholder="username" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="fechaAgregarDatos">FECHA</label>
<input type="input" v-model="datoscamposRegistrocaja.fecha" name="fecha"  class="form-control " id="fechaAgregarDatos"  placeholder="fecha" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="hora_inicioAgregarDatos">HORA_INICIO</label>
<input type="input" v-model="datoscamposRegistrocaja.hora_inicio" name="hora_inicio"  class="form-control " id="hora_inicioAgregarDatos"  placeholder="hora_inicio" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="hora_cierreAgregarDatos">HORA_CIERRE</label>
<input type="input" v-model="datoscamposRegistrocaja.hora_cierre" name="hora_cierre"  class="form-control " id="hora_cierreAgregarDatos"  placeholder="hora_cierre" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="cant_inicioAgregarDatos">CANT_INICIO</label>
<input type="input" v-model="datoscamposRegistrocaja.cant_inicio" name="cant_inicio"  class="form-control soloNumero" id="cant_inicioAgregarDatos" v-solonumeros placeholder="cant_inicio" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="ventasAgregarDatos">VENTAS</label>
<input type="input" v-model="datoscamposRegistrocaja.ventas" name="ventas"  class="form-control soloNumero" id="ventasAgregarDatos" v-solonumeros placeholder="ventas" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="efectivoAgregarDatos">EFECTIVO</label>
<input type="input" v-model="datoscamposRegistrocaja.efectivo" name="efectivo"  class="form-control soloNumero" id="efectivoAgregarDatos" v-solonumeros placeholder="efectivo" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="tarjetaAgregarDatos">TARJETA</label>
<input type="input" v-model="datoscamposRegistrocaja.tarjeta" name="tarjeta"  class="form-control soloNumero" id="tarjetaAgregarDatos" v-solonumeros placeholder="tarjeta" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="transferenciaAgregarDatos">TRANSFERENCIA</label>
<input type="input" v-model="datoscamposRegistrocaja.transferencia" name="transferencia"  class="form-control soloNumero" id="transferenciaAgregarDatos" v-solonumeros placeholder="transferencia" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="chequeAgregarDatos">CHEQUE</label>
<input type="input" v-model="datoscamposRegistrocaja.cheque" name="cheque"  class="form-control soloNumero" id="chequeAgregarDatos" v-solonumeros placeholder="cheque" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="entradasAgregarDatos">ENTRADAS</label>
<input type="input" v-model="datoscamposRegistrocaja.entradas" name="entradas"  class="form-control soloNumero" id="entradasAgregarDatos" v-solonumeros placeholder="entradas" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="inversionesAgregarDatos">INVERSIONES</label>
<input type="input" v-model="datoscamposRegistrocaja.inversiones" name="inversiones"  class="form-control soloNumero" id="inversionesAgregarDatos" v-solonumeros placeholder="inversiones" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="gastosAgregarDatos">GASTOS</label>
<input type="input" v-model="datoscamposRegistrocaja.gastos" name="gastos"  class="form-control soloNumero" id="gastosAgregarDatos" v-solonumeros placeholder="gastos" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="devolucionesAgregarDatos">DEVOLUCIONES</label>
<input type="input" v-model="datoscamposRegistrocaja.devoluciones" name="devoluciones"  class="form-control soloNumero" id="devolucionesAgregarDatos" v-solonumeros placeholder="devoluciones" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="estadoAgregarDatos">ESTADO</label>
<select class="form-control " v-model="datoscamposRegistrocaja.estado" id="estadoAgregarDatos" name="estado" >
  <option value="Cerrada">Cerrada</option>
<option value="Abierta">Abierta</option>
</select></div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="abonoAgregarDatos">ABONO</label>
<input type="input" v-model="datoscamposRegistrocaja.abono" name="abono"  class="form-control soloNumero" id="abonoAgregarDatos" v-solonumeros placeholder="abono" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="otroAgregarDatos">OTRO</label>
<textarea class="form-control " v-model="datoscamposRegistrocaja.otro" id="otroAgregarDatos" name="otro" cols="30" rows="3" ></textarea>
</div>
<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposRegistrocaja.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposRegistrocaja.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>
<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposRegistrocaja.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
</div>

        </div>
        </form>
</fieldset>
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="visiblecrear = false" autofocus />
                <Button label="Crear" outlined severity="secondary" @click="funcionCrear" autofocus />
            </template>
        </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
</style>
