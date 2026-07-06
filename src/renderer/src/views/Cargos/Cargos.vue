
<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import axios from 'axios';
import {
nfecha,
arrayToObjetoFromTabla,
peticionesFetch,
obtenerIdsSeleccionados,
crearTablaSiNoExiste,
encryptarPassword,
envioElectron,
crearTablaSiNoExisteOffline,
peticionesFetchOffline,
buscadorArrayObjeto } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Textarea from 'primevue/textarea';
const toast = useToast();
/************************************************************************/
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
/************************************************************************/
  const basic = ref({
    dateFormat: 'd/m/Y',
  });
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ['nombre', 'departamento', 'descripcion'];
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
const datosJSON = ref([]);
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposCargos = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const CargosEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposCargos.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'cargos');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('cargos');
  datoscamposCargos.value = campos;
}
/************************************************************************/
const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = datosJSON.value.VITE_LINKURL;
    api.value = datosJSON.value.VITE_LINK_API;
    token.value = datosJSON.value.VITE_TOKEN;
    patronTelefono.value = datosJSON.value.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.value.VITE_IMPRESORA_LOCAL;
    tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
    patroncedula.value = datosJSON.value.VITE_PATRON_CEDULA;
}
/************************************************************************/
onMounted(async () => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);

const offline = datosJSON.value.OFFLINE === 'true' ? true : false;

   await crearTablaSiNoExisteOffline('cargos',camposArray.join(','),toast)


//usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'cargos');
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
  const url = link.value+api.value+"/actualizarcampos/cargos";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','cargos', JSON.stringify(datosEnviar));
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
  const url = link.value+api.value+"/insertar/cargos";
  if (datoscamposCargos.value.hasOwnProperty('created_at')) {
    datoscamposCargos.value.created_at = nfecha('timestamp');
    datoscamposCargos.value.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(datoscamposCargos.value));
  const envioDatos = await peticionesFetchOffline('insertData','cargos', JSON.stringify(datosEnviar));
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
                              const envioDatos = await peticionesFetchOffline('deleteEntry','cargos', id);
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
const itemsCargos = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleCargos = (event, rowData) => {
currentRowData.value = rowData;
itemsCargos.value = [
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','cargos', rowData.id);
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
const filteredCargos = computed(() => {
if (!searchQuery.value) return data.value;
return data.value.filter(busqueda => {
  return Object.values(busqueda).some(value =>
    String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
   );
  });
});
/************************************************************************/
// Estadísticas computadas
const cargosPorDepartamento = computed(() => {
  const departamentos = {};
  data.value.forEach(cargo => {
    const dept = cargo.departamento || 'Sin Departamento';
    departamentos[dept] = (departamentos[dept] || 0) + 1;
  });
  return departamentos;
});

const departamentoMasComun = computed(() => {
  const depts = cargosPorDepartamento.value;
  if (Object.keys(depts).length === 0) return 'N/A';
  return Object.keys(depts).reduce((a, b) => depts[a] > depts[b] ? a : b);
});

const cantidadDepartamentos = computed(() => {
  return Object.keys(cargosPorDepartamento.value).length;
});
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
const editarCargo = (rowData) => {
  datoscampos.value = rowData;
  visible.value = true;
};

const eliminarCargo = async (rowData) => {
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
      const datosFactura = await peticionesFetchOffline('deleteEntry', 'cargos', rowData.id);
      if (datosFactura[0] == 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cargo eliminado correctamente', life: 3000 });
        await fetchAndSetupData();
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar el cargo', life: 3000 });
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    }
  }
};

// Helper para obtener color de departamento
const getDepartamentoColor = (departamento) => {
  const colores = {
    'VENTAS': 'success',
    'ADMINISTRACION': 'info',
    'RECURSOS HUMANOS': 'warning',
    'TECNOLOGIA': 'primary',
    'FINANZAS': 'danger',
    'OPERACIONES': 'secondary'
  };
  return colores[departamento?.toUpperCase()] || 'contrast';
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
            <i class="pi pi-briefcase text-indigo-600"></i>
            Gestión de Cargos
          </h1>
          <p class="text-gray-500 mt-1">Administra los cargos y puestos de trabajo de la empresa</p>
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
            label="Nuevo Cargo"
            severity="success"
            @click="visiblecrear = true"
            class="hover:scale-105 transition-transform"
          />
        </div>
      </div>

      <!-- Tarjetas de estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Total Cargos -->
        <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-indigo-100 text-sm font-medium uppercase tracking-wide">Total Cargos</p>
              <p class="text-4xl font-bold mt-2">{{ data.length }}</p>
            </div>
            <div class="bg-indigo-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-briefcase text-3xl text-white"></i>
            </div>
          </div>
        </div>

        <!-- Departamentos -->
        <div class="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-cyan-100 text-sm font-medium uppercase tracking-wide">Departamentos</p>
              <p class="text-4xl font-bold mt-2">{{ cantidadDepartamentos }}</p>
            </div>
            <div class="bg-cyan-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-sitemap text-3xl text-white"></i>
            </div>
          </div>
        </div>

        <!-- Departamento Principal -->
        <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all cursor-pointer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-pink-100 text-sm font-medium uppercase tracking-wide">Dept. Principal</p>
              <p class="text-2xl font-bold mt-2 truncate max-w-[180px]">{{ departamentoMasComun }}</p>
              <p class="text-pink-100 text-xs mt-1">{{ cargosPorDepartamento[departamentoMasComun] || 0 }} cargos</p>
            </div>
            <div class="bg-pink-700 bg-opacity-50 backdrop-blur-sm rounded-full p-4 flex items-center justify-center">
              <i class="pi pi-users text-3xl text-white"></i>
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
                placeholder="Buscar por nombre, departamento, descripción..."
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
              v-tooltip.bottom="'Eliminar cargos seleccionados'"
            />
            <Button
              v-if="datosEmpresa.usuario.nivel_seguridad == 'Soporte'"
              label="Borrar Todo"
              icon="pi pi-exclamation-triangle"
              severity="danger"
              @click="borrarTodo"
            />
          </div>
        </div>

        <!-- Tabla de datos -->
        <DataTable
          :value="filteredCargos"
          v-model:selection="selectedItems"
          dataKey="id"
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          scrollable
          scrollHeight="500px"
          class="modern-datatable"
          stripedRows
          :globalFilterFields="['nombre', 'departamento', 'descripcion']"
          responsiveLayout="scroll"
        >
          <template #empty>
            <div class="text-center py-12">
              <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-500 text-lg">No se encontraron cargos</p>
              <Button
                label="Crear primer cargo"
                icon="pi pi-plus"
                class="mt-4"
                @click="visiblecrear = true"
              />
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" class="bg-gray-50"></Column>

          <Column field="nombre" header="Cargo" sortable class="font-semibold">
            <template #body="slotProps">
              <div class="flex items-center gap-3">
                <div class="bg-indigo-100 text-indigo-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {{ slotProps.data.nombre.charAt(0) }}
                </div>
                <div>
                  <p class="font-semibold text-gray-800">{{ slotProps.data.nombre }}</p>
                  <p class="text-xs text-gray-500">ID: {{ slotProps.data.id }}</p>
                </div>
              </div>
            </template>
          </Column>

          <Column field="departamento" header="Departamento" sortable>
            <template #body="slotProps">
              <Tag
                :value="slotProps.data.departamento || 'Sin Departamento'"
                :severity="getDepartamentoColor(slotProps.data.departamento)"
                class="font-semibold"
              />
            </template>
          </Column>

          <Column field="descripcion" header="Descripción">
            <template #body="slotProps">
              <p class="text-sm text-gray-600 line-clamp-2">
                {{ slotProps.data.descripcion || 'Sin descripción' }}
              </p>
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
                  @click="editarCargo(slotProps.data)"
                  v-tooltip.bottom="'Editar'"
                  class="hover:scale-110 transition-transform"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  rounded
                  @click="eliminarCargo(slotProps.data)"
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
  :style="{ width: '700px' }"
  :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  class="modern-dialog"
>
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-indigo-100 text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center">
        <i class="pi pi-pencil text-xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800">Editar Cargo</h3>
        <p class="text-sm text-gray-500">Modifica la información del cargo</p>
      </div>
    </div>
  </template>

  <div class="p-6">
    <form id="formularioActualizarCargos">
      <div class="space-y-6">
        <!-- Nombre del Cargo -->
        <div>
          <label for="nombre-edit" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-briefcase mr-2 text-indigo-600"></i>
            Nombre del Cargo
          </label>
          <InputText
            v-model="datoscampos.nombre"
            v-mayuscula
            id="nombre-edit"
            placeholder="Ej: GERENTE DE VENTAS, CONTADOR, etc."
            class="w-full p-3 text-lg"
          />
          <small class="text-gray-500 mt-1 block">Ingresa el nombre completo del cargo</small>
        </div>

        <!-- Departamento -->
        <div>
          <label for="departamento-edit" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-sitemap mr-2 text-cyan-600"></i>
            Departamento
          </label>
          <InputText
            v-model="datoscampos.departamento"
            v-mayuscula
            id="departamento-edit"
            placeholder="Ej: VENTAS, ADMINISTRACION, etc."
            class="w-full p-3 text-lg"
          />
          <small class="text-gray-500 mt-1 block">Departamento al que pertenece el cargo</small>
        </div>

        <!-- Descripción -->
        <div>
          <label for="descripcion-edit" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-align-left mr-2 text-gray-600"></i>
            Descripción
          </label>
          <Textarea
            v-model="datoscampos.descripcion"
            id="descripcion-edit"
            rows="4"
            placeholder="Describe las responsabilidades y funciones del cargo..."
            class="w-full p-3"
          />
          <small class="text-gray-500 mt-1 block">Opcional: Detalla las funciones y responsabilidades</small>
        </div>

        <!-- Vista previa -->
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
          <p class="text-sm font-semibold text-gray-700 mb-2">Vista Previa:</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                {{ (datoscampos.nombre || 'C').charAt(0) }}
              </div>
              <div>
                <span class="font-bold text-gray-800">{{ datoscampos.nombre || 'Nombre del Cargo' }}</span>
                <Tag
                  :value="datoscampos.departamento || 'Sin Departamento'"
                  :severity="getDepartamentoColor(datoscampos.departamento)"
                  class="ml-2"
                />
              </div>
            </div>
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
  :style="{ width: '700px' }"
  :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  class="modern-dialog"
>
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center">
        <i class="pi pi-plus text-xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800">Nuevo Cargo</h3>
        <p class="text-sm text-gray-500">Registra un nuevo cargo o puesto de trabajo</p>
      </div>
    </div>
  </template>

  <div class="p-6">
    <form id="formularioCrearCargos">
      <div class="space-y-6">
        <!-- Nombre del Cargo -->
        <div>
          <label for="nombre-create" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-briefcase mr-2 text-indigo-600"></i>
            Nombre del Cargo
            <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="datoscamposCargos.nombre"
            v-mayuscula
            id="nombre-create"
            placeholder="Ej: GERENTE DE VENTAS, CONTADOR, etc."
            class="w-full p-3 text-lg"
          />
          <small class="text-gray-500 mt-1 block">Ingresa el nombre completo del cargo</small>
        </div>

        <!-- Departamento -->
        <div>
          <label for="departamento-create" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-sitemap mr-2 text-cyan-600"></i>
            Departamento
            <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="datoscamposCargos.departamento"
            v-mayuscula
            id="departamento-create"
            placeholder="Ej: VENTAS, ADMINISTRACION, etc."
            class="w-full p-3 text-lg"
          />
          <small class="text-gray-500 mt-1 block">Departamento al que pertenece el cargo</small>
        </div>

        <!-- Descripción -->
        <div>
          <label for="descripcion-create" class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="pi pi-align-left mr-2 text-gray-600"></i>
            Descripción
          </label>
          <Textarea
            v-model="datoscamposCargos.descripcion"
            id="descripcion-create"
            rows="4"
            placeholder="Describe las responsabilidades y funciones del cargo..."
            class="w-full p-3"
          />
          <small class="text-gray-500 mt-1 block">Opcional: Detalla las funciones y responsabilidades</small>
        </div>

        <!-- Ejemplo informativo -->
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-blue-600 text-xl mt-1"></i>
            <div>
              <p class="font-semibold text-blue-900 mb-1">¿Para qué sirve un cargo?</p>
              <p class="text-sm text-blue-800">
                Los cargos permiten organizar la estructura de la empresa y asignar responsabilidades específicas a los empleados.
                Cada cargo debe tener un nombre claro y pertenecer a un departamento.
              </p>
            </div>
          </div>
        </div>

        <!-- Vista previa -->
        <div v-if="datoscamposCargos.nombre" class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <p class="text-sm font-semibold text-gray-700 mb-2">Vista Previa:</p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                {{ datoscamposCargos.nombre.charAt(0) }}
              </div>
              <div>
                <span class="font-bold text-gray-800">{{ datoscamposCargos.nombre }}</span>
                <Tag
                  :value="datoscamposCargos.departamento || 'Sin Departamento'"
                  :severity="getDepartamentoColor(datoscamposCargos.departamento)"
                  class="ml-2"
                />
              </div>
            </div>
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
        label="Crear Cargo"
        icon="pi pi-check"
        severity="success"
        @click="funcionCrear"
        class="px-6"
        :disabled="!datoscamposCargos.nombre || !datoscamposCargos.departamento"
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
:deep(.p-inputtext),
:deep(.p-textarea) {
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

:deep(.p-inputtext:hover),
:deep(.p-textarea:hover) {
  border-color: #cbd5e1;
}

:deep(.p-inputtext:focus),
:deep(.p-textarea:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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
  background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%) !important;
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

/* Line clamp para descripción */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

