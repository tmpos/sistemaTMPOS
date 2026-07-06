<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones,generarCodigoUnico, lasMayusculas,peticionesFetchOffline,
arrayToObjetoFromTablaOffline,
crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["titulo","mensaje","accion","usuario"];
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
const datoscamposNotificaciones = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const NotificacionesEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposNotificaciones.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'notificaciones');
    const jsonData = response;
    data.value = jsonData.reverse();
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('notificaciones');
  datoscamposNotificaciones.value = campos;
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
await crearTablaSiNoExisteOffline('notificaciones', camposArray,toast);
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'notificaciones');
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
  const url = link.value+api.value+"/actualizarcampos/notificaciones";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'notificaciones',JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/notificaciones";
  if (datoscamposNotificaciones.value.hasOwnProperty('created_at')) {
    datoscamposNotificaciones.value.created_at = nfecha('timestamp');
    datoscamposNotificaciones.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'notificaciones',JSON.stringify(datoscamposNotificaciones.value));
  if (envioDatos[0] == 'ok') {
    await fetchAndSetupData();
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'notificaciones',id);

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
const itemsNotificaciones = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleNotificaciones = (event, rowData) => {
currentRowData.value = rowData;
itemsNotificaciones.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: async() => { 
visible.value = true;
datoscampos.value = currentRowData.value;
} },
{ label: 'Acción', icon: 'pi pi-eye', command: async() => { 
      router.push({ path: `${currentRowData.value.accion}` });
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'notificaciones',rowData.id);
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
const filteredNotificaciones = computed(() => {
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
const onRowSelect = (event) => {
visible.value = true;
datoscampos.value = event.data;
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
        <fieldset class="border p-3 round mb-2">
          <legend class="float-none w-auto px-2">Datos de Notificaciones</legend>
            <div class="grid grid-cols-12 gap-4">
              <div class="sm:col-span-12">
  <Button icon="pi pi-sync" raised round severity="warn" @click="fetchAndSetupData" aria-label="Recargar" />
            <Button icon="pi pi-plus" raised round severity="success" @click="visiblecrear = true" aria-label="Agregar Nuevo" class="ml-2" />
<Button icon="pi pi-trash" raised round severity="danger" @click="borrarSeleccionados" aria-label="Agregar Nuevo" class="ml-2" />
<Button icon="pi pi-trash"  raised round severity="danger" label="Borrar Todo" class="float-end" @click="borrarTodo" aria-label="Borrar Todo" />
    
              </div>
            </div>
        </fieldset>
      </div>
      <div class="md:col-span-12">
 <div style="display: flex; justify-content: flex-end;">
 <input v-model="searchQuery" placeholder="Buscar notificaciones..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
</div>
<DataTable 
    :value="filteredNotificaciones"  
    scrollable 
    scrollHeight="600px"  
    dataKey="id" 
    paginator 
    :rows="10" 
    v-model="selectedItems" 
    selectionMode="single" 
    @rowSelect="onRowSelect" 
    :rowsPerPageOptions="[5, 10, 20, 50]" 
    tableStyle="min-width: 50rem">
    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
    <Column header="Options">
        <template #body="slotProps">
            <Button 
                icon="pi pi-cog" 
                @click="toggleNotificaciones($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
            />
            <Menu 
                ref="menu" 
                id="overlay_menu_Notificaciones" 
                :model="itemsNotificaciones" 
                :popup="true"
            />
        </template>
    </Column>
    <Column field="titulo" header="Titulo"></Column>
<Column field="mensaje" header="Mensaje"></Column>
<Column field="usuario" header="Usuario"></Column>

</DataTable>
      </div>
    </div>
      </template>
</Card>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visible" :position="position" modal header="Modificar Notificaciones" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Editar</span>
                </div>
            </template>
  <fieldset class="border p-3 round mb-2">
    <legend class="float-none w-auto px-2">Notificaciones</legend>
     <form id="formularioActualizarNotificaciones" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" hidden>
<label for="id-Actualizador">ID</label>
<input type="input" v-model="datoscampos.id" name="id"  class="form-control" id="id-Actualizador"  placeholder="id"  maxlength="11">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="titulo-Actualizador">TITULO</label>
<input type="input" v-model="datoscampos.titulo" name="titulo"  class="form-control" id="titulo-Actualizador" v-mayuscula placeholder="titulo"  maxlength="250">
</div>


<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="mensaje-Actualizador">MENSAJE</label>
<textarea class="form-control " id="mensaje-Actualizador" name="mensaje" v-model="datoscampos.mensaje" cols="30" rows="3" ></textarea>
</div>

<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="accion-Actualizador">ACCION</label>
<input type="input" v-model="datoscampos.accion" name="accion"  class="form-control" id="accion-Actualizador" placeholder="accion"  maxlength="250">
</div>

<div class="form-group col-span-6" hidden>
<label for="created_at-Actualizador">CREATED_AT</label>
<input type="input" v-model="datoscampos.created_at" name="created_at"  class="form-control" id="created_at-Actualizador"  placeholder="created_at"  maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_at-Actualizador">UPDATED_AT</label>
<input type="input" v-model="datoscampos.updated_at" name="updated_at"  class="form-control" id="updated_at-Actualizador"  placeholder="updated_at"  maxlength="">
</div>
<div class="form-group col-span-12" hidden>
<label for="usuario-Actualizador">USUARIO</label>
<input type="input" v-model="datoscampos.usuario" name="usuario"  class="form-control" id="usuario-Actualizador"  placeholder="usuario"  maxlength="250">
</div>

        </div>
        </form>
</fieldset>
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="visible = false"  />
                <Button label="Save" outlined severity="primary" @click="funcionActualizar" autofocus />
            </template>
        </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Notificaciones" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Crear</span>
                </div>
            </template>
  <fieldset class="border p-3 round mb-2">
    <legend class="float-none w-auto px-2">Notificaciones</legend>
     <form id="formularioActualizarNotificaciones" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="tituloAgregarDatos">TITULO</label>
<input type="input" v-model="datoscamposNotificaciones.titulo" name="titulo"  class="form-control " id="tituloAgregarDatos"  v-mayuscula placeholder="titulo" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="mensajeAgregarDatos">MENSAJE</label>
<textarea class="form-control " v-model="datoscamposNotificaciones.mensaje" id="mensajeAgregarDatos" name="mensaje" cols="30" rows="3" ></textarea>
</div>

<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="accionAgregarDatos">ACCION</label>
<input type="input" v-model="datoscamposNotificaciones.accion" name="accion"  class="form-control" id="accionAgregarDatos" placeholder="accion"  maxlength="250">
</div>

<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposNotificaciones.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"   placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposNotificaciones.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"   placeholder="updated_at" maxlength="">
</div>
<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposNotificaciones.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"   placeholder="usuario" maxlength="250">
</div>

        </div>
        </form>
</fieldset>
            <template #footer>
                <Button label="Cancel" text severity="secondary" @click="visiblecrear = false"  />
                <Button label="Crear" outlined severity="primary" @click="funcionCrear" autofocus />
            </template>
        </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
</style>
