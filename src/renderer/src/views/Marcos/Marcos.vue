
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
crearTablaSiNoExisteOffline,
envioElectron,
peticionesFetchOffline,
buscadorArrayObjeto } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
const fabricacionData = ref([])
const fabricacionDataNames = ref([])
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
const camposArray = ['nombre', 'precio_full', 'precio_sin_marco','almacen'];
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
const datoscamposMarcos = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const MarcosEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposMarcos.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
    datoscamposMarcos.value.precio_full = '0.00'
    datoscamposMarcos.value.precio_sin_marco = '0.00'
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'marcos');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('marcos');
  console.log("campos", campos);
  datoscamposMarcos.value = campos;
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
const fetchFabricacionDatosarray = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'fabricacion');
    fabricacionData.value = response;
    fabricacionDataNames.value = response.map(fabricacion=>fabricacion.descripcion);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from fabricacion',
      life: 3000
    });
  }
};

/************************************************************************/
onMounted(async () => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);

  if(window.electron){
     await crearTablaSiNoExisteOffline('marcos',camposArray.join(','),toast)
  }   

//usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await campos();
await fetchAndSetupData();
await fetchFabricacionDatosarray();
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'marcos');
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
  const url = link.value+api.value+"/actualizarcampos/marcos";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','marcos', JSON.stringify(datosEnviar));
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
  const url = link.value+api.value+"/insertar/marcos";
  if (datoscamposMarcos.value.hasOwnProperty('created_at')) {
    datoscamposMarcos.value.created_at = nfecha('timestamp');
    datoscamposMarcos.value.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(datoscamposMarcos.value));
  const envioDatos = await peticionesFetchOffline('insertData','marcos', JSON.stringify(datosEnviar));
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
                              const envioDatos = await peticionesFetchOffline('deleteEntry','marcos', id);
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
const itemsMarcos = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleMarcos = (event, rowData) => {
currentRowData.value = rowData;
itemsMarcos.value = [
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','marcos', rowData.id);
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
const filteredMarcos = computed(() => {
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
  <legend class="px-2">Datos de Marcos</legend>
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
          <InputText v-model="searchQuery" placeholder="Buscar marcos..." class="p-inputtext p-component" />
        </div>
        <DataTable
          :value="filteredMarcos"
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
                @click="toggleMarcos($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
              />
              <Menu
                ref="menu"
                id="overlay_menu_Marcos"
                :model="itemsMarcos"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="nombre" header="Nombre"></Column>
<Column field="precio_full" header="Precio_full"></Column>
<Column field="precio_sin_marco" header="Precio_sin_marco"></Column>
        </DataTable>
      </div>
    </div>
      </template>
</Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visible" :position="position" modal header="Modificar Marcos" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold whitespace-nowrap">Modal Editar</span>
    </div>
  </template>
  <fieldset class="border p-3 rounded-md mb-2">
    <legend class="px-2">Marcos</legend>
    <form id="formularioActualizarMarcos" action="" method="">
      <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600">
        <div class="hidden col-span-12">
          <label for="id-Actualizador" class="block text-sm font-medium text-gray-700">ID</label>
          <InputText v-model="datoscampos.id" name="id" id="id-Actualizador" readonly placeholder="id" maxlength="11" class="w-full" />
        </div>

         <div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="nombre">NOMBRE</label>
                    <Dropdown editable v-model="datoscampos.nombre" fluid :options="fabricacionDataNames" placeholder="Seleccione nombre" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="precio_full">PRECIO_FULL</label>
                <InputText type="text" fluid  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.precio_full" name="precio_full" placeholder="precio_full" id="actualizarprecio_full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="precio_sin_marco">PRECIO_SIN_MARCO</label>
                <InputText type="text" fluid  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.precio_sin_marco" name="precio_sin_marco" placeholder="precio_sin_marco" id="actualizarprecio_sin_marco" />
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
<Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Marcos" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold whitespace-nowrap">Modal Crear</span>
    </div>
  </template>
  <fieldset class="border p-3 rounded-md mb-2">
    <legend class="px-2">Marcos</legend>
    <form id="formularioCrearMarcos" action="" method="">
      <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600">

<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label  class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="nombre">NOMBRE</label>

              <Dropdown v-model="datoscamposMarcos.nombre" :options="fabricacionDataNames" placeholder="Seleccione nombre" fluid class="" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label for="precio_full" class="block text-sm font-medium text-gray-700 dark:text-gray-400">PRECIO_FULL</label>
                    <InputText type="text" fluid class=" "  v-solonumeros v-decimales v-numeroFocusinOut v-model="datoscamposMarcos.precio_full" placeholder="precio_full" name="crearprecio_full" id="precio_full" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-6 2xl:col-span-6">
                    <label for="precio_sin_marco" class="block text-sm font-medium text-gray-700 dark:text-gray-400">PRECIO_SIN_MARCO</label>
                    <InputText type="text" fluid class=" "  v-solonumeros v-decimales v-numeroFocusinOut v-model="datoscamposMarcos.precio_sin_marco" placeholder="precio_sin_marco" name="crearprecio_sin_marco" id="precio_sin_marco" />
                </div>


        <div class="hidden col-span-6">
          <label for="created_atAgregarDatos" class="block text-sm font-medium text-gray-700">CREATED_AT</label>
          <InputText v-model="datoscamposMarcos.created_at" name="created_at" id="created_atAgregarDatos" placeholder="created_at" class="w-full" />
        </div>
        <div class="hidden col-span-6">
          <label for="updated_atAgregarDatos" class="block text-sm font-medium text-gray-700">UPDATED_AT</label>
          <InputText v-model="datoscamposMarcos.updated_at" name="updated_at" id="updated_atAgregarDatos" placeholder="updated_at" class="w-full" />
        </div>
        <div class="hidden col-span-12">
          <label for="usuarioAgregarDatos" class="block text-sm font-medium text-gray-700">USUARIO</label>
          <InputText v-model="datoscamposMarcos.usuario" name="usuario" id="usuarioAgregarDatos" placeholder="usuario" maxlength="250" class="w-full" />
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

