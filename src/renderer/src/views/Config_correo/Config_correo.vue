
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
buscadorArrayObjeto } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
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
const camposArray = ['host', 'port', 'username', 'password'];
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
const datoscamposConfig_correo = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const Config_correoEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposConfig_correo.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'config_correo');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('config_correo');
  datoscamposConfig_correo.value = campos;
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

if(navigator.onLine){
   await crearTablaSiNoExiste(link.value, api.value, 'config_correo', camposArray, tokenCifrado.value,toast);
}else{
  if(window.electron){
     await crearTablaSiNoExisteOffline('config_correo',camposArray.join(','),toast)
  }   
}
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'config_correo');
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
  const url = link.value+api.value+"/actualizarcampos/config_correo";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','config_correo', JSON.stringify(datosEnviar));
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
  const url = link.value+api.value+"/insertar/config_correo";
  if (datoscamposConfig_correo.value.hasOwnProperty('created_at')) {
    datoscamposConfig_correo.value.created_at = nfecha('timestamp');
    datoscamposConfig_correo.value.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(datoscamposConfig_correo.value));
  const envioDatos = await peticionesFetchOffline('insertData','config_correo', JSON.stringify(datosEnviar));
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
                              const envioDatos = await peticionesFetchOffline('deleteEntry','config_correo', id);
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
const itemsConfig_correo = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleConfig_correo = (event, rowData) => {
currentRowData.value = rowData;
itemsConfig_correo.value = [
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','config_correo', rowData.id);
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
const filteredConfig_correo = computed(() => {
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
const onRowSelect = (event) => {
 
datoscampos.value = event.data;
visible.value = true;


};
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="mt-5">
<Card>
      <template #content>
<div class="flex flex-col space-y-4">
<div class="w-full">
<fieldset class="border p-3 rounded-md mb-2">
  <legend class="px-2">Datos de Config_correo</legend>
  <div class="flex items-center">
    <div class="flex space-x-2">
      <Button icon="pi pi-refresh" severity="primary" @click="fetchAndSetupData" data-toggle="tooltip" title="Recargar" id="reload" />
      <Button icon="pi pi-plus" severity="primary" title="Agregar Nuevo" id="nuevoregistro" @click="visiblecrear = true" />
      <Button icon="pi pi-trash" severity="danger" @click="borrarSeleccionados" data-toggle="tooltip" title="Borrar Selección" id="borrador" />
    </div>
    <div class="ml-auto">
      <Button
        v-if="datosEmpresa.usuario.nivel_seguridad == 'Soporte'"
        label="Borrar Todo"
        icon="pi pi-trash"
        severity="danger"
        @click="borrarTodo"
        id="borrartodo"
      />
    </div>
  </div>
</fieldset>
</div>

      <div class="w-full">
        <div class="flex justify-end mb-4">
          <InputText v-model="searchQuery" placeholder="Buscar config_correo..." class="p-inputtext p-component" />
        </div>
        <DataTable
          :value="filteredConfig_correo"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          size="small"
          resizableColumns 
          columnResizeMode="fit"
          v-model:selection="selectedItems"
          @rowSelect="onRowSelect"
          selectionMode="single"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          tableStyle="min-width: 50rem">
         <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column header="Options">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                @click="toggleConfig_correo($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
              />
              <Menu
                ref="menu"
                id="overlay_menu_Config_correo"
                :model="itemsConfig_correo"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="host" header="Host"></Column>
<Column field="port" header="Port"></Column>
<Column field="username" header="Username"></Column>
<!-- <Column field="password" header="Password"></Column> -->
        </DataTable>
      </div>
    </div>
      </template>
</Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visible" :position="position" modal header="Modificar Config_correo" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold whitespace-nowrap">Modal Editar</span>
    </div>
  </template>
  <fieldset class="border p-3 rounded-md mb-2">
    <legend class="px-2">Config_correo</legend>
    <form id="formularioActualizarConfig_correo" action="" method="">
      <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600">
        <div class="hidden col-span-12">
          <label for="id-Actualizador" class="block text-sm font-medium text-gray-700">ID</label>
          <InputText v-model="datoscampos.id" name="id" id="id-Actualizador" readonly placeholder="id" maxlength="11" class="w-full" />
        </div>

         <div class="col-span-12 sm:col-span-12 md:col-span-8 lg:col-span-8 xl:col-span-8 2xl:col-span-8">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="host">HOST</label>
                <InputText type="text" fluid  class=" " v-model="datoscampos.host" name="host" placeholder="host" id="actualizarhost" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="port">PORT</label>
                <InputText type="text" fluid  v-solonumeros class=" " v-model="datoscampos.port" name="port" placeholder="port" id="actualizarport" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="username">USERNAME</label>
                <InputText type="text" fluid  class=" " v-model="datoscampos.username" name="username" placeholder="username" id="actualizarusername" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-400">PASSWORD</label>
                          <InputText v-model="datoscampos.password" fluid type="password"  />
                    </div>
        <div class="hidden col-span-12">
          <label for="created_at-Actualizador" class="block text-sm font-medium text-gray-700">CREATED_AT</label>
          <InputText v-model="datoscampos.created_at" name="created_at" id="created_at-Actualizador" placeholder="created_at" class="w-full" />
        </div>
        <div class="hidden col-span-12">
          <label for="updated_at-Actualizador" class="block text-sm font-medium text-gray-700">UPDATED_AT</label>
          <InputText v-model="datoscampos.updated_at" name="updated_at" id="updated_at-Actualizador" placeholder="updated_at" class="w-full" />
        </div>
        <div class="hidden col-span-12">
          <label for="usuario-Actualizador" class="block text-sm font-medium text-gray-700">USUARIO</label>
          <InputText v-model="datoscampos.usuario" name="usuario" id="usuario-Actualizador" placeholder="usuario" maxlength="250" class="w-full" />
        </div>
      </div>
    </form>
  </fieldset>
  <template #footer>
    <Button label="Cancel" text severity="secondary" @click="visible = false" autofocus />
    <Button label="Save" outlined severity="secondary" @click="funcionActualizar" autofocus />
  </template>
</Dialog>


<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Config_correo" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold whitespace-nowrap">Modal Crear</span>
    </div>
  </template>
  <fieldset class="border p-3 rounded-md mb-2">
    <legend class="px-2">Config_correo</legend>
    <form id="formularioCrearConfig_correo" action="" method="">
      <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600">

<div class="col-span-12 sm:col-span-12 md:col-span-8 lg:col-span-8 xl:col-span-8 2xl:col-span-8">
                    <label for="host" class="block text-sm font-medium text-gray-700 dark:text-gray-400">HOST</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposConfig_correo.host" placeholder="host" name="crearhost" id="host" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4">
                    <label for="port" class="block text-sm font-medium text-gray-700 dark:text-gray-400">PORT</label>
                    <InputText type="text" fluid class=" "  v-solonumeros v-model="datoscamposConfig_correo.port" placeholder="port" name="crearport" id="port" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-400">USERNAME</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposConfig_correo.username" placeholder="username" name="crearusername" id="username" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-400">PASSWORD</label>
                          <InputText fluid v-model="datoscamposConfig_correo.password" type="password" class="" />
                    </div>


        <div class="hidden col-span-6">
          <label for="created_atAgregarDatos" class="block text-sm font-medium text-gray-700">CREATED_AT</label>
          <InputText v-model="datoscamposConfig_correo.created_at" name="created_at" id="created_atAgregarDatos" placeholder="created_at" class="w-full" />
        </div>
        <div class="hidden col-span-6">
          <label for="updated_atAgregarDatos" class="block text-sm font-medium text-gray-700">UPDATED_AT</label>
          <InputText v-model="datoscamposConfig_correo.updated_at" name="updated_at" id="updated_atAgregarDatos" placeholder="updated_at" class="w-full" />
        </div>
        <div class="hidden col-span-12">
          <label for="usuarioAgregarDatos" class="block text-sm font-medium text-gray-700">USUARIO</label>
          <InputText v-model="datoscamposConfig_correo.usuario" name="usuario" id="usuarioAgregarDatos" placeholder="usuario" maxlength="250" class="w-full" />
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

