
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
const camposArray = ['titulo', 'descripcion', 'tipo_meta', 'valor_objetivo', 'fecha_inicio', 'fecha_fin', 'valor_actual', 'porcentaje_avance', 'estado','almacen'];
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
const datoscamposMetas = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const MetasEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposMetas.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'metas');
    const jsonData = response.reverse();
    data.value = jsonData.filter(dt=>dt.almacen === datosEmpresa.empresa.nombre);
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('metas');
  datoscamposMetas.value = campos;
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

//if(navigator.onLine){
  // await crearTablaSiNoExiste(link.value, api.value, 'metas', camposArray, tokenCifrado.value,toast);
//}else{
  if(window.electron){
     await crearTablaSiNoExisteOffline('metas',camposArray.join(','),toast)
  }   
//}
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'metas');
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
  const url = link.value+api.value+"/actualizarcampos/metas";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','metas', JSON.stringify(datosEnviar));
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
  const url = link.value+api.value+"/insertar/metas";
  if (datoscamposMetas.value.hasOwnProperty('created_at')) {
    datoscamposMetas.value.created_at = nfecha('timestamp');
    datoscamposMetas.value.updated_at = nfecha('timestamp');
  }
    datoscamposMetas.value.almacen = datosEmpresa.empresa.nombre;
  const datosEnviar = JSON.parse(JSON.stringify(datoscamposMetas.value));
  const envioDatos = await peticionesFetchOffline('insertData','metas', JSON.stringify(datosEnviar));
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
                              const envioDatos = await peticionesFetchOffline('deleteEntry','metas', id);
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
const itemsMetas = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleMetas = (event, rowData) => {
currentRowData.value = rowData;
itemsMetas.value = [
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','metas', rowData.id);
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
const filteredMetas = computed(() => {
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
<Fieldset legend="Datos de Metas">                 
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
</Fieldset>
</div>

      <div class="w-full">
        <div class="flex justify-end mb-4">
          <InputText v-model="searchQuery" placeholder="Buscar metas..." class="p-inputtext p-component" />
        </div>
        <DataTable
          :value="filteredMetas"
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
                @click="toggleMetas($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
              />
              <Menu
                ref="menu"
                id="overlay_menu_Metas"
                :model="itemsMetas"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="titulo" header="Titulo"></Column>
<Column field="descripcion" header="Descripcion"></Column>
<Column field="tipo_meta" header="Tipo_meta"></Column>
<Column field="valor_objetivo" header="Valor_objetivo"></Column>
<Column field="fecha_inicio" header="Fecha_inicio"></Column>
<Column field="fecha_fin" header="Fecha_fin"></Column>
<Column field="valor_actual" header="Valor_actual"></Column>
<Column field="porcentaje_avance" header="Porcentaje_avance"></Column>
<Column field="estado" header="Estado"></Column>
        </DataTable>
      </div>
    </div>
      </template>
</Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visible" :position="position" modal header="Modificar Metas" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold whitespace-nowrap">Modal Editar</span>
    </div>
  </template>
<Fieldset legend="Metas">

    <form id="formularioActualizarMetas" action="" method="">
      <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600">
        <div class="hidden col-span-12">
          <label for="id-Actualizador" class="block text-sm font-medium text-gray-700">ID</label>
          <InputText v-model="datoscampos.id" name="id" id="id-Actualizador" readonly placeholder="id" maxlength="11" class="w-full" />
        </div>

         <div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="titulo">TITULO</label>
                <InputText type="text" fluid  class=" " v-model="datoscampos.titulo" name="titulo" placeholder="titulo" id="actualizartitulo" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="descripcion">DESCRIPCION</label>
                   <Textarea id="actualizardescripcion"  fluid v-model="datoscampos.descripcion" name="descripcion" rows="3" class="form-textarea w-full " placeholder="Enter Descripcion"></textarea>
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tipo_meta">TIPO_META</label>
                    <Dropdown editable v-model="datoscampos.tipo_meta" fluid :options="['VENTAS','CLIENTES','PRODUCTOS','UTILIDAD']" placeholder="Seleccione tipo_meta" class="w-full" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="valor_objetivo">VALOR_OBJETIVO</label>
                <InputText type="text" fluid  v-decimales v-numeroFocusinOut v-solonumeros class=" " v-model="datoscampos.valor_objetivo" name="valor_objetivo" placeholder="valor_objetivo" id="actualizarvalor_objetivo" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_inicio">FECHA_INICIO</label>
                    <flat-pickr v-model="datoscampos.fecha_inicio"  class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic"></flat-pickr>
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_fin">FECHA_FIN</label>
                    <flat-pickr v-model="datoscampos.fecha_fin"  class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic"></flat-pickr>
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="valor_actual">VALOR_ACTUAL</label>
                <InputText type="text" fluid  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.valor_actual" name="valor_actual" placeholder="valor_actual" id="actualizarvalor_actual" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="porcentaje_avance">PORCENTAJE_AVANCE</label>
                <InputText type="text" fluid  v-solonumeros v-decimales v-numeroFocusinOut class=" " v-model="datoscampos.porcentaje_avance" name="porcentaje_avance" placeholder="porcentaje_avance" id="actualizarporcentaje_avance" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="estado">ESTADO</label>
                    <Dropdown editable v-model="datoscampos.estado" fluid :options="['PENDIENTE','EN PROGRESO','CUMPLIDA','VENCIDA']" placeholder="Seleccione estado" class="w-full" />
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
</Fieldset>
<template #footer>
    <Button label="Cancel" text severity="secondary" @click="visible = false" autofocus />
    <Button label="Save" outlined severity="secondary" @click="funcionActualizar" autofocus />
  </template>
</Dialog>


<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Metas" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold whitespace-nowrap">Modal Crear</span>
    </div>
  </template>
<Fieldset legend="Metas">

    <form id="formularioCrearMetas" action="" method="">
      <div class="grid grid-cols-12 gap-4 mt-4 text-blue-600">

<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label for="titulo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">TITULO</label>
                    <InputText type="text" fluid class=" "  v-model="datoscamposMetas.titulo" placeholder="titulo" name="creartitulo" id="titulo" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12 2xl:col-span-12">
                    <label  class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="descripcion">DESCRIPCION</label>
                   <Textarea id="creardescripcion" rows="3" fluid class="form-textarea w-full "  v-model="datoscamposMetas.descripcion" placeholder="Descripcion" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label  class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="tipo_meta">TIPO_META</label>

              <Dropdown v-model="datoscamposMetas.tipo_meta" :options="['VENTAS','CLIENTES','PRODUCTOS','UTILIDAD']" placeholder="Seleccione tipo_meta" fluid class="" />
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="valor_objetivo" class="block text-sm font-medium text-gray-700 dark:text-gray-400">VALOR_OBJETIVO</label>
                    <InputText type="text" fluid class=" "  v-decimales v-numeroFocusinOut v-solonumeros v-model="datoscamposMetas.valor_objetivo" placeholder="valor_objetivo" name="crearvalor_objetivo" id="valor_objetivo" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_inicio">FECHA_INICIO</label>
                   <flat-pickr v-model="datoscamposMetas.fecha_inicio"  class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic"></flat-pickr>
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="fecha_fin">FECHA_FIN</label>
                   <flat-pickr v-model="datoscamposMetas.fecha_fin"  class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic"></flat-pickr>
            </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="valor_actual" class="block text-sm font-medium text-gray-700 dark:text-gray-400">VALOR_ACTUAL</label>
                    <InputText type="text" fluid class=" "  v-solonumeros v-decimales v-numeroFocusinOut v-model="datoscamposMetas.valor_actual" placeholder="valor_actual" name="crearvalor_actual" id="valor_actual" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label for="porcentaje_avance" class="block text-sm font-medium text-gray-700 dark:text-gray-400">PORCENTAJE_AVANCE</label>
                    <InputText type="text" fluid class=" "  v-solonumeros v-decimales v-numeroFocusinOut v-model="datoscamposMetas.porcentaje_avance" placeholder="porcentaje_avance" name="crearporcentaje_avance" id="porcentaje_avance" />
                </div>
<div class="col-span-12 sm:col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                    <label  class="block text-sm font-medium text-gray-700 dark:text-gray-400" for="estado">ESTADO</label>

              <Dropdown v-model="datoscamposMetas.estado" :options="['PENDIENTE','EN PROGRESO','CUMPLIDA','VENCIDA']" placeholder="Seleccione estado" fluid class="" />
            </div>


        <div class="hidden col-span-6">
          <label for="created_atAgregarDatos" class="block text-sm font-medium text-gray-700">CREATED_AT</label>
          <InputText v-model="datoscamposMetas.created_at" name="created_at" id="created_atAgregarDatos" placeholder="created_at" class="w-full" />
        </div>
        <div class="hidden col-span-6">
          <label for="updated_atAgregarDatos" class="block text-sm font-medium text-gray-700">UPDATED_AT</label>
          <InputText v-model="datoscamposMetas.updated_at" name="updated_at" id="updated_atAgregarDatos" placeholder="updated_at" class="w-full" />
        </div>
        <div class="hidden col-span-12">
          <label for="usuarioAgregarDatos" class="block text-sm font-medium text-gray-700">USUARIO</label>
          <InputText v-model="datoscamposMetas.usuario" name="usuario" id="usuarioAgregarDatos" placeholder="usuario" maxlength="250" class="w-full" />
        </div>
      </div>
    </form>
</Fieldset>
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

