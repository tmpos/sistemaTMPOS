
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ['nombre', 'porciento', 'dias_vencimiento'];
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
const datoscamposInstituciones = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const InstitucionesEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposInstituciones.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'instituciones');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('instituciones');
  datoscamposInstituciones.value = campos;
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
await crearTablaSiNoExisteOffline('instituciones', camposArray.join(','), toast);
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'instituciones');
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
  const url = link.value+api.value+"/actualizarcampos/instituciones";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'instituciones', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function funcionCrear() {
  const url = link.value+api.value+"/insertar/instituciones";
  if (datoscamposInstituciones.value.hasOwnProperty('created_at')) {
    datoscamposInstituciones.value.created_at = nfecha('timestamp');
    datoscamposInstituciones.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'instituciones', JSON.stringify(datoscamposInstituciones.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'instituciones', id);
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
const itemsInstituciones = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleInstituciones = (event, rowData) => {
currentRowData.value = rowData;
itemsInstituciones.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
visible.value = true;
datoscampos.value = currentRowData.value;
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'instituciones', rowData.id);
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
const filteredInstituciones = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
// Estadísticas computadas
const promedioporcentaje = computed(() => {
  if (data.value.length === 0) return 0;
  const suma = data.value.reduce((acc, inst) => acc + parseFloat(inst.porciento || 0), 0);
  return (suma / data.value.length).toFixed(2);
});

const mayorPorcentaje = computed(() => {
  if (data.value.length === 0) return 0;
  const maxPorcentaje = Math.max(...data.value.map(inst => parseFloat(inst.porciento || 0)));
  return maxPorcentaje.toFixed(2);
});

const institucionMayorPorcentaje = computed(() => {
  if (data.value.length === 0) return 'N/A';
  const maxInst = data.value.reduce((max, inst) =>
    parseFloat(inst.porciento || 0) > parseFloat(max.porciento || 0) ? inst : max
  );
  return maxInst.nombre || 'N/A';
});

const promedioDiasVencimiento = computed(() => {
  if (data.value.length === 0) return 0;
  const suma = data.value.reduce((acc, inst) => acc + parseFloat(inst.dias_vencimiento || 0), 0);
  return Math.round(suma / data.value.length);
});
/************************************************************************/
// Helper para severity del porcentaje
const getPorcentajeSeverity = (porciento) => {
  const valor = parseFloat(porciento || 0);
  if (valor >= 70) return 'danger';
  if (valor >= 50) return 'warning';
  if (valor >= 30) return 'info';
  return 'success';
};
/************************************************************************/
// Helper para formatear fecha
const formatearFechaTabla = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const fecha = new Date(timestamp);
    return fecha.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return timestamp;
  }
};
/************************************************************************/
// Funciones para editar y eliminar
const editarInstitucion = (rowData) => {
  datoscampos.value = rowData;
  visible.value = true;
};

const eliminarInstitucion = async (rowData) => {
  const result = await Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  });

  if (result.isConfirmed) {
    const contrasenaIngresada = result.value;
    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
      const datosFactura = await peticionesFetchOffline('deleteEntry', 'instituciones', rowData.id);
      if (datosFactura[0] == 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Institución eliminada correctamente', life: 3000 });
        await fetchAndSetupData();
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar la institución', life: 3000 });
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    }
  }
};
/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const onRowSelect = (event) => {

datoscampos.value = event.data;
visible.value = true;


};
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="mt-5 px-4">

    <!-- Header con título y estadísticas -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <i class="pi pi-building text-blue-600"></i>
            Gestión de Instituciones
          </h1>
          <p class="text-gray-500 mt-1">Administra las instituciones financieras del sistema</p>
        </div>
        <div class="flex gap-2">
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            @click="fetchAndSetupData"
            v-tooltip.bottom="'Actualizar datos'"
            class="hover:scale-105 transition-transform"
          />
          <Button
            icon="pi pi-plus"
            label="Nueva Institución"
            severity="success"
            @click="visiblecrear = true"
            class="hover:scale-105 transition-transform"
          />
        </div>
      </div>

      <!-- Tarjetas de estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total Instituciones -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Instituciones</p>
              <p class="text-4xl font-bold mt-2">{{ data.length }}</p>
            </div>
            <div class="bg-blue-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-building text-3xl text-white"></i>
            </div>
          </div>
        </div>

        <!-- Promedio Porcentaje -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm font-medium uppercase tracking-wide">Porcentaje Promedio</p>
              <p class="text-4xl font-bold mt-2">{{ promedioporcentaje }}%</p>
            </div>
            <div class="bg-green-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-percentage text-3xl text-white"></i>
            </div>
          </div>
        </div>

        <!-- Mayor Porcentaje -->
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm font-medium uppercase tracking-wide">Mayor Porcentaje</p>
              <p class="text-4xl font-bold mt-2">{{ mayorPorcentaje }}%</p>
              <p class="text-purple-100 text-xs mt-1 truncate max-w-[180px]">{{ institucionMayorPorcentaje }}</p>
            </div>
            <div class="bg-purple-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-chart-line text-3xl text-white"></i>
            </div>
          </div>
        </div>

        <!-- Promedio Días Vencimiento -->
        <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm font-medium uppercase tracking-wide">Promedio Días Vencimiento</p>
              <p class="text-4xl font-bold mt-2">{{ promedioDiasVencimiento }}</p>
              <p class="text-orange-100 text-xs mt-1">días hábiles</p>
            </div>
            <div class="bg-orange-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-clock text-3xl text-white"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección principal con tabla -->
    <Card class="shadow-xl border-0">
      <template #content>

        <!-- Toolbar con búsqueda y acciones -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div class="flex-1 w-full md:w-auto">
            <IconField iconPosition="left" class="w-full">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por nombre, porcentaje..."
                class="w-full md:w-96"
              />
            </IconField>
          </div>

          <div class="flex gap-2">
            <Button
              icon="pi pi-trash"
              label="Eliminar Selección"
              severity="danger"
              outlined
              @click="borrarSeleccionados"
              :disabled="selectedItems.length === 0"
              v-tooltip.bottom="'Eliminar instituciones seleccionadas'"
            />
            <Button
              v-if="usuarioLocal.usuario == 'Soporte'"
              label="Borrar Todo"
              icon="pi pi-exclamation-triangle"
              severity="danger"
              @click="borrarTodo"
            />
          </div>
        </div>

        <!-- Tabla de datos -->
        <DataTable
          :value="filteredInstituciones"
          v-model:selection="selectedItems"
          dataKey="id"
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          scrollable
          scrollHeight="500px"
          class="modern-datatable"
          stripedRows
          :globalFilterFields="['nombre', 'porciento']"
          responsiveLayout="scroll"
        >
          <template #empty>
            <div class="text-center py-12">
              <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-500 text-lg">No se encontraron instituciones</p>
              <Button
                label="Crear primera institución"
                icon="pi pi-plus"
                class="mt-4"
                @click="visiblecrear = true"
              />
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" class="bg-gray-50"></Column>

          <Column field="nombre" header="Institución" sortable class="font-semibold">
            <template #body="slotProps">
              <div class="flex items-center gap-3">
                <div class="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {{ slotProps.data.nombre.charAt(0) }}
                </div>
                <div>
                  <p class="font-semibold text-gray-800">{{ slotProps.data.nombre }}</p>
                  <p class="text-xs text-gray-500">ID: {{ slotProps.data.id }}</p>
                </div>
              </div>
            </template>
          </Column>

          <Column field="porciento" header="Porcentaje" sortable>
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <Tag
                  :value="`${slotProps.data.porciento}%`"
                  :severity="getPorcentajeSeverity(slotProps.data.porciento)"
                  class="font-bold px-4 py-2"
                />
                <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                  <div
                    class="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                    :style="{ width: `${Math.min(slotProps.data.porciento, 100)}%` }"
                  ></div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="dias_vencimiento" header="Días Vencimiento" sortable>
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-clock text-orange-500"></i>
                <span class="font-semibold text-gray-700">{{ slotProps.data.dias_vencimiento || 0 }} días</span>
              </div>
            </template>
          </Column>

          <Column field="created_at" header="Fecha de Creación" sortable>
            <template #body="slotProps">
              <div class="text-sm">
                <i class="pi pi-calendar mr-2 text-gray-400"></i>
                <span class="text-gray-600">{{ formatearFechaTabla(slotProps.data.created_at) }}</span>
              </div>
            </template>
          </Column>

          <Column header="Acciones" :exportable="false" style="min-width: 150px">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  severity="info"
                  outlined
                  rounded
                  @click="editarInstitucion(slotProps.data)"
                  v-tooltip.bottom="'Editar'"
                  class="hover:scale-110 transition-transform"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  rounded
                  @click="eliminarInstitucion(slotProps.data)"
                  v-tooltip.bottom="'Eliminar'"
                  class="hover:scale-110 transition-transform"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Editar - Diseño Profesional -->
<Dialog
  v-model:visible="visible"
  modal
  :style="{ width: '600px' }"
  :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  class="modern-dialog"
>
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center">
        <i class="pi pi-pencil text-xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800">Editar Institución</h3>
        <p class="text-sm text-gray-500">Modifica la información de la institución</p>
      </div>
    </div>
  </template>

  <div class="p-6">
    <form id="formularioActualizarInstituciones">
      <div class="space-y-6">
        <!-- Nombre de la Institución -->
        <div>
          <label for="nombre-edit" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-building mr-2 text-blue-600"></i>
            Nombre de la Institución
          </label>
          <InputText
            v-model="datoscampos.nombre"
            v-mayuscula
            id="nombre-edit"
            placeholder="Ej: SENASA, ARS Humano, etc."
            class="w-full p-3 text-lg"
          />
          <small class="text-gray-500 mt-1 block">Ingresa el nombre completo de la institución</small>
        </div>

        <!-- Porcentaje -->
        <div>
          <label for="porciento-edit" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-percentage mr-2 text-green-600"></i>
            Porcentaje de Descuento
          </label>
          <div class="flex items-center gap-3">
            <InputText
              v-model="datoscampos.porciento"
              v-solonumeros
              v-decimales
              v-numeroFocusinOut
              id="porciento-edit"
              placeholder="0.00"
              class="flex-1 p-3 text-lg"
            />
            <Tag
              :value="`${datoscampos.porciento || 0}%`"
              :severity="getPorcentajeSeverity(datoscampos.porciento)"
              class="text-lg px-4 py-2"
            />
          </div>
          <small class="text-gray-500 mt-1 block">Porcentaje que cubre la institución (0-100)</small>
        </div>

        <!-- Días de Vencimiento -->
        <div>
          <label for="dias_vencimiento-edit" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-clock mr-2 text-orange-600"></i>
            Días de Vencimiento
          </label>
          <div class="flex items-center gap-3">
            <InputText
              v-model="datoscampos.dias_vencimiento"
              v-solonumeros
              id="dias_vencimiento-edit"
              placeholder="30"
              class="flex-1 p-3 text-lg"
              type="number"
              min="0"
            />
            <div class="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
              <i class="pi pi-calendar text-orange-600"></i>
              <span class="font-semibold text-orange-700">{{ datoscampos.dias_vencimiento || 0 }} días</span>
            </div>
          </div>
          <small class="text-gray-500 mt-1 block">Plazo en días para el pago de la institución</small>
        </div>

        <!-- Vista previa -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <p class="text-sm font-semibold text-gray-700 mb-2">Vista Previa:</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                {{ (datoscampos.nombre || 'I').charAt(0) }}
              </div>
              <span class="font-bold text-gray-800">{{ datoscampos.nombre || 'Nombre de Institución' }}</span>
            </div>
            <Tag
              :value="`${datoscampos.porciento || 0}%`"
              :severity="getPorcentajeSeverity(datoscampos.porciento)"
              class="font-bold"
            />
          </div>
        </div>
      </div>
    </form>
  </div>

  <template #footer>
    <div class="flex justify-end gap-3">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        text
        severity="secondary"
        @click="visible = false"
        class="hover:bg-gray-100"
      />
      <Button
        label="Guardar Cambios"
        icon="pi pi-check"
        severity="success"
        @click="funcionActualizar"
        class="px-6"
      />
    </div>
  </template>
</Dialog>


<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<!-- Modal Crear - Diseño Profesional -->
<Dialog
  v-model:visible="visiblecrear"
  modal
  :style="{ width: '600px' }"
  :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  class="modern-dialog"
>
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center">
        <i class="pi pi-plus text-xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800">Nueva Institución</h3>
        <p class="text-sm text-gray-500">Registra una nueva institución financiera</p>
      </div>
    </div>
  </template>

  <div class="p-6">
    <form id="formularioCrearInstituciones">
      <div class="space-y-6">
        <!-- Nombre de la Institución -->
        <div>
          <label for="nombre-create" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-building mr-2 text-blue-600"></i>
            Nombre de la Institución
            <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="datoscamposInstituciones.nombre"
            v-mayuscula
            id="nombre-create"
            placeholder="Ej: SENASA, ARS Humano, etc."
            class="w-full p-3 text-lg"
          />
          <small class="text-gray-500 mt-1 block">Ingresa el nombre completo de la institución</small>
        </div>

        <!-- Porcentaje -->
        <div>
          <label for="porciento-create" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-percentage mr-2 text-green-600"></i>
            Porcentaje de Descuento
            <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-3">
            <InputText
              v-model="datoscamposInstituciones.porciento"
              v-solonumeros
              v-decimales
              v-numeroFocusinOut
              id="porciento-create"
              placeholder="0.00"
              class="flex-1 p-3 text-lg"
            />
            <Tag
              :value="`${datoscamposInstituciones.porciento || 0}%`"
              :severity="getPorcentajeSeverity(datoscamposInstituciones.porciento)"
              class="text-lg px-4 py-2"
            />
          </div>
          <small class="text-gray-500 mt-1 block">Porcentaje que cubre la institución (0-100)</small>
        </div>

        <!-- Días de Vencimiento -->
        <div>
          <label for="dias_vencimiento-create" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-clock mr-2 text-orange-600"></i>
            Días de Vencimiento
            <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-3">
            <InputText
              v-model="datoscamposInstituciones.dias_vencimiento"
              v-solonumeros
              id="dias_vencimiento-create"
              placeholder="30"
              class="flex-1 p-3 text-lg"
              type="number"
              min="0"
            />
            <div class="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
              <i class="pi pi-calendar text-orange-600"></i>
              <span class="font-semibold text-orange-700">{{ datoscamposInstituciones.dias_vencimiento || 0 }} días</span>
            </div>
          </div>
          <small class="text-gray-500 mt-1 block">Plazo en días para el pago de la institución</small>
        </div>

        <!-- Ejemplo informativo -->
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-blue-600 text-xl mt-1"></i>
            <div>
              <p class="font-semibold text-blue-900 mb-1">¿Qué es el porcentaje?</p>
              <p class="text-sm text-blue-800">
                Es el porcentaje del costo que la institución cubrirá en las ventas.
                Por ejemplo, si el porcentaje es 30%, la institución paga el 30% y el cliente el 70%.
              </p>
            </div>
          </div>
        </div>

        <!-- Vista previa -->
        <div v-if="datoscamposInstituciones.nombre" class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <p class="text-sm font-semibold text-gray-700 mb-2">Vista Previa:</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                {{ datoscamposInstituciones.nombre.charAt(0) }}
              </div>
              <span class="font-bold text-gray-800">{{ datoscamposInstituciones.nombre }}</span>
            </div>
            <Tag
              :value="`${datoscamposInstituciones.porciento || 0}%`"
              :severity="getPorcentajeSeverity(datoscamposInstituciones.porciento)"
              class="font-bold"
            />
          </div>
        </div>
      </div>
    </form>
  </div>

  <template #footer>
    <div class="flex justify-end gap-3">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        text
        severity="secondary"
        @click="visiblecrear = false"
        class="hover:bg-gray-100"
      />
      <Button
        label="Crear Institución"
        icon="pi pi-check"
        severity="success"
        @click="funcionCrear"
        class="px-6"
        :disabled="!datoscamposInstituciones.nombre || !datoscamposInstituciones.porciento || !datoscamposInstituciones.dias_vencimiento"
      />
    </div>
  </template>
</Dialog>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
/* Transiciones y animaciones suaves */
.modern-datatable {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Hover effects para las filas - Versión sutil */
:deep(.p-datatable-tbody > tr:hover) {
  background-color: #f1f5f9 !important;
  transition: background-color 0.15s ease;
}

/* Estilos para los botones de acción */
:deep(.p-button) {
  transition: all 0.3s ease;
}

:deep(.p-button:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Estilo para las tarjetas de estadísticas */
.bg-gradient-to-br {
  position: relative;
  overflow: hidden;
}

.bg-gradient-to-br::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

/* Animación de entrada para las cards */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-gradient-to-br {
  animation: fadeInUp 0.6s ease-out;
}

/* Mejorar apariencia del dialog */
:deep(.modern-dialog .p-dialog-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 2px solid #e5e7eb;
}

:deep(.modern-dialog .p-dialog-content) {
  background: #ffffff;
}

/* Estilos para inputs en los modales */
:deep(.p-inputtext) {
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

:deep(.p-inputtext:hover) {
  border-color: #cbd5e1;
}

:deep(.p-inputtext:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Mejorar la barra de búsqueda */
:deep(.p-iconfield) {
  width: 100%;
}

/* Estilos para tags con animación */
:deep(.p-tag) {
  transition: all 0.3s ease;
  font-weight: 600;
}

:deep(.p-tag:hover) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Mejorar el header de la tabla */
:deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
  color: white !important;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  border: none !important;
  padding: 1rem !important;
}

/* Estilos para filas alternas */
:deep(.p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f9fafb;
}

/* Mejorar el paginador */
:deep(.p-paginator) {
  background: #f8fafc;
  border-top: 2px solid #e5e7eb;
  padding: 1rem;
}

/* Scroll suave */
:deep(.p-datatable-scrollable-body) {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

:deep(.p-datatable-scrollable-body::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.p-datatable-scrollable-body::-webkit-scrollbar-track) {
  background: #f1f5f9;
  border-radius: 4px;
}

:deep(.p-datatable-scrollable-body::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 4px;
}

:deep(.p-datatable-scrollable-body::-webkit-scrollbar-thumb:hover) {
  background: #94a3b8;
}

/* Animación de carga */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Mejorar los botones rounded */
:deep(.p-button-rounded) {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Card con sombra suave */
:deep(.p-card) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
}

/* Mejorar el estado vacío */
:deep(.p-datatable-emptymessage) {
  padding: 3rem 0;
}
</style>

