<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["usuario","pin"];
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
const datoscamposPin = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const PinEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposPin.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'pin');
    const jsonData = response;
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('pin');
  datoscamposPin.value = campos;
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
await crearTablaSiNoExisteOffline('pin', camposArray, toast);
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'pin');
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
  const url = link.value+api.value+"/actualizarcampos/pin";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'pin', JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/pin";
  if (datoscamposPin.value.hasOwnProperty('created_at')) {
    datoscamposPin.value.created_at = nfecha('timestamp');
    datoscamposPin.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'pin', JSON.stringify(datoscamposPin.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'pin', id);
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
const itemsPin = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const togglePin = (event, rowData) => {
currentRowData.value = rowData;
itemsPin.value = [
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'pin', rowData.id);
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
const filteredPin = computed(() => {
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
  <div class="w-full px-4 mt-5">
<Card>
      <template #content>
<div class="grid grid-cols-12 gap-4">
      <div class="md:col-span-12">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Pin</legend>
            <div class="grid grid-cols-12 gap-4">
              <div class="sm:col-span-12">
  <Button icon="pi pi-sync" raised rounded severity="warn" @click="fetchAndSetupData" aria-label="Recargar" />
            <Button icon="pi pi-plus" raised rounded severity="success" @click="visiblecrear = true" aria-label="Agregar Nuevo" class="ml-1" />
<Button icon="pi pi-trash" raised rounded severity="danger" @click="borrarSeleccionados" aria-label="Agregar Nuevo" class="ml-1" />
<Button icon="pi pi-trash" v-if="usuarioLocal.usuario =='Soporte'" raised rounded severity="danger" label="Borrar Todo" class="float-end" @click="borrarTodo" aria-label="Borrar Todo" />
    
              </div>
            </div>
        </fieldset>
      </div>
      <div class="md:col-span-12">
 <div style="display: flex; justify-content: flex-end;">
 <input v-model="searchQuery" placeholder="Buscar pin..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
</div>
<DataTable 
    :value="filteredPin"  
    scrollable 
    scrollHeight="600px"  
    dataKey="id" 
    paginator 
    :rows="10" 
    v-model:selection="selectedItems" 
    selectionMode="single" 
    :rowsPerPageOptions="[5, 10, 20, 50]" 
    tableStyle="min-width: 50rem">
    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
    <Column header="Options">
        <template #body="slotProps">
            <Button 
                icon="pi pi-cog" 
                @click="togglePin($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
            />
            <Menu 
                ref="menu" 
                id="overlay_menu_Pin" 
                :model="itemsPin" 
                :popup="true"
            />
        </template>
    </Column>
    <Column field="usuario" header="Usuario"></Column>

</DataTable>
      </div>
    </div>
      </template>
</Card>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visible" :position="position" modal header="Modificar Pin" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Editar</span>
                </div>
            </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Pin</legend>
     <form id="formularioActualizarPin" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12" hidden>
<label for="id-Actualizador">ID</label>
<input type="input" v-model="datoscampos.id" name="id"  class="form-control" id="id-Actualizador" readonly placeholder="id"  maxlength="11">
</div>
<div class="form-group col-span-12 sm:col-span-8 md:col-span-8 lg:col-span-8 xl:col-span-8" >
<label for="usuario-Actualizador">USUARIO</label>
<input type="input" v-model="datoscampos.usuario" name="usuario"  class="form-control" id="usuario-Actualizador"  placeholder="usuario"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="pin-Actualizador">PIN</label>
<input type="password" v-model="datoscampos.pin" name="pin"  class="form-control" id="pin-Actualizador"  placeholder="pin" v-solonumeros maxlength="250">
</div>
<div class="form-group col-span-6" hidden>
<label for="created_at-Actualizador">CREATED_AT</label>
<input type="input" v-model="datoscampos.created_at" name="created_at"  class="form-control" id="created_at-Actualizador"  placeholder="created_at"  maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_at-Actualizador">UPDATED_AT</label>
<input type="input" v-model="datoscampos.updated_at" name="updated_at"  class="form-control" id="updated_at-Actualizador"  placeholder="updated_at"  maxlength="">
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
<Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Pin" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Crear</span>
                </div>
            </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Pin</legend>
     <form id="formularioActualizarPin" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12 sm:col-span-8 md:col-span-8 lg:col-span-8 xl:col-span-8" >
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposPin.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="pinAgregarDatos">PIN</label>
<input type="password" v-model="datoscamposPin.pin" name="pin"  class="form-control soloNumero" id="pinAgregarDatos" v-solonumeros placeholder="pin" maxlength="250">
</div>
<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposPin.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposPin.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
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
