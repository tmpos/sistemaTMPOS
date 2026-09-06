<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, generarCodigoUnico, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["descripcion","minimo","blanco","plata","gris","negro","negro_texturizado","madera","inox","roble","otro","imagen","usuario"];
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
const datoscamposFabricacion = ref({})
/************************************************************************/
import FileUploader from '../Componentes/FileUploader.vue';
const rutaIMAGEN = ref('')
const urlIMAGEN = ref(null)
const fileUpload = ref(null);
const arrayIMG = ref([])
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const FabricacionEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposFabricacion.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
datoscamposFabricacion.value.imagen = generarCodigoUnico();
rutaIMAGEN.value = '../vista/img/fabricacion/'+datoscamposFabricacion.value.imagen;
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'fabricacion');
    const jsonData = response;
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('fabricacion');
  datoscamposFabricacion.value = campos;
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
await crearTablaSiNoExisteOffline('fabricacion', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await campos();
await fetchAndSetupData();
urlIMAGEN.value = link.value+api.value+"/subirunaimagen";
rutaIMAGEN.value = '../vista/img/fabricacion/'+datoscamposFabricacion.value.imagen;
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'fabricacion');
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
  const url = link.value+api.value+"/actualizarcampos/fabricacion";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'fabricacion', JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/fabricacion";
  if (datoscamposFabricacion.value.hasOwnProperty('created_at')) {
    datoscamposFabricacion.value.created_at = nfecha('timestamp');
    datoscamposFabricacion.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'fabricacion', JSON.stringify(datoscamposFabricacion.value));
  if (envioDatos[0] == 'ok') {
    await fetchAndSetupData();
const imagen = await peticionesFetch(`${link.value}${api.value}`,'creardirectorio',{'ruta':rutaIMAGEN.value},tokenCifrado.value,'POST');
    await uploadImages();
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'fabricacion', id);
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
const itemsFabricacion = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleFabricacion = (event, rowData) => {
currentRowData.value = rowData;
itemsFabricacion.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: async() => { 
visible.value = true;
datoscampos.value = currentRowData.value;
urlIMAGEN.value = link.value+api.value+"/subirunaimagen";
rutaIMAGEN.value = '../vista/img/fabricacion/'+datoscampos.value.imagen;
arrayIMG.value = await peticiones(link.value+api.value+'/peticionimagenes',{"origen":`${rutaIMAGEN.value}`},'POST',tokenCifrado.value)
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'fabricacion', rowData.id);
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
const filteredFabricacion = computed(() => {
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
    const uploadImages = async() => {
  if (fileUpload.value) {
    fileUpload.value.fnSubirIMG();
  }
};
/************************************************************************/
  const handleUploadSuccess = async(result) => {
  arrayIMG.value = await peticiones(link.value+api.value+'/peticionimagenes',{"origen":`${rutaIMAGEN.value}`},'POST',tokenCifrado.value)
toast.add({ severity: 'success', summary: 'Éxito', detail: 'Imagen Subida Correctamente', life: 3000 });
};
const deleteImage = async(ruta,imagen) => {
  const url = link.value+api.value+"/borrararchivo";
  const datos = {
    ruta:'../vista/img/fabricacion/'+ruta,
    archivo:imagen,
  }
  const envioDatos = await enviarDatosPorPost(url, datos,tokenCifrado.value);
    if (envioDatos[0] == 'ok') {
         arrayIMG.value = await peticiones(link.value+api.value+'/peticionimagenes',{"origen":`../vista/img/fabricacion/${ruta}`},'POST',tokenCifrado.value)
       toast.add({ severity: 'success', summary: 'Éxito', detail: 'Imagen Borrada', life: 3000 });
    }else{
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar la Imagen.', life: 3000 });
   }
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
          <legend class="float-none w-auto px-2">Datos de Fabricacion</legend>
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
 <input v-model="searchQuery" placeholder="Buscar fabricacion..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
</div>
<DataTable 
    :value="filteredFabricacion"  
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
                @click="toggleFabricacion($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
            />
            <Menu 
                ref="menu" 
                id="overlay_menu_Fabricacion" 
                :model="itemsFabricacion" 
                :popup="true"
            />
        </template>
    </Column>
    <Column field="descripcion" header="Descripcion"></Column>
<Column field="minimo" header="Minimo"></Column>
<Column field="blanco" header="Blanco"></Column>
<Column field="plata" header="Plata"></Column>
<Column field="gris" header="Gris"></Column>
<Column field="negro" header="Negro"></Column>
<Column field="negro_texturizado" header="Negro texturizado"></Column>
<Column field="madera" header="Madera"></Column>
<Column field="inox" header="Inox"></Column>
<Column field="roble" header="Roble"></Column>
<Column field="otro" header="Otro"></Column>

</DataTable>
      </div>
    </div>
      </template>
</Card>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visible" :position="position" modal header="Modificar Fabricacion" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Editar</span>
                </div>
            </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Fabricacion</legend>
     <form id="formularioActualizarFabricacion" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12" hidden>
<label for="id-Actualizador">ID</label>
<input type="input" v-model="datoscampos.id" name="id"  class="form-control" id="id-Actualizador" readonly placeholder="id"  maxlength="11">
</div>
<div class="form-group col-span-12 sm:col-span-8 md:col-span-8 lg:col-span-8 xl:col-span-8" >
<label for="descripcion-Actualizador">DESCRIPCION</label>
<input type="input" v-model="datoscampos.descripcion" name="descripcion"  class="form-control" id="descripcion-Actualizador" v-mayuscula placeholder="descripcion"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="minimo-Actualizador">MINIMO</label>
<input type="input" v-model="datoscampos.minimo" name="minimo"  class="form-control" id="minimo-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="minimo"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="blanco-Actualizador">BLANCO</label>
<input type="input" v-model="datoscampos.blanco" name="blanco"  class="form-control" id="blanco-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="blanco"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="plata-Actualizador">PLATA</label>
<input type="input" v-model="datoscampos.plata" name="plata"  class="form-control" id="plata-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="plata"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="gris-Actualizador">GRIS</label>
<input type="input" v-model="datoscampos.gris" name="gris" class="form-control" id="gris-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="gris" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="negro-Actualizador">NEGRO</label>
<input type="input" v-model="datoscampos.negro" name="negro"  class="form-control" id="negro-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="negro"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="negro-texturizado-Actualizador">NEGRO TEXTURIZADO</label>
<input type="input" v-model="datoscampos.negro_texturizado" name="negro_texturizado" class="form-control" id="negro-texturizado-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="negro texturizado" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="madera-Actualizador">MADERA</label>
<input type="input" v-model="datoscampos.madera" name="madera"  class="form-control" id="madera-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="madera"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="inox-Actualizador">INOX</label>
<input type="input" v-model="datoscampos.inox" name="inox"  class="form-control" id="inox-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="inox"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="roble-Actualizador">ROBLE</label>
<input type="input" v-model="datoscampos.roble" name="roble"  class="form-control" id="roble-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="roble"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="otro-Actualizador">OTRO</label>
<input type="input" v-model="datoscampos.otro" name="otro"  class="form-control" id="otro-Actualizador" v-solonumeros v-numeroFocusinOut v-decimales placeholder="otro"  maxlength="250">
</div>
<div class="form-group col-span-6" hidden>
<label for="created_at-Actualizador">CREATED_AT</label>
<input type="input" v-model="datoscampos.created_at" name="created_at"  class="form-control" id="created_at-Actualizador"  placeholder="created_at"  maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_at-Actualizador">UPDATED_AT</label>
<input type="input" v-model="datoscampos.updated_at" name="updated_at"  class="form-control" id="updated_at-Actualizador"  placeholder="updated_at"  maxlength="">
</div>
<div class="form-group col-span-12" >
<label for="imagen-Actualizador">IMAGEN</label>
 <FileUploader
    ref="fileUpload"
   :url-IMAGEN="urlIMAGEN"
   :ruta-IMAGEN="rutaIMAGEN"
   :autoUpload="true"
   @uploadSuccess="handleUploadSuccess"
   @uploadError="handleUploadError"
 />
<div class="grid grid-cols-12 gap-4">
<div class="border-1 surface-border border-round m-2 col-span-12 md:col-span-2 p-3" v-for="imagen in arrayIMG">
     <div class="mb-3">
        <div class="relative mx-auto">
            <img :src="`${link}/vista/img/fabricacion/${datoscampos.imagen}/${imagen}`" alt="Image" class="w-full border-round" />
          </div>
     </div>
     <div class="">
         <span>
             <button class="w-100 btn btn-danger" @click.prevent="deleteImage(datoscampos.imagen,imagen)">Eliminar</button>
         </span>
     </div>
 </div>
 </div>
</div>
<div class="form-group col-span-12" hidden>
<label for="usuario-Actualizador">USUARIO</label>
<input type="input" v-model="datoscampos.usuario" name="usuario"  class="form-control" id="usuario-Actualizador"  placeholder="usuario"  maxlength="250">
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
<Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Fabricacion" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Crear</span>
                </div>
            </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Fabricacion</legend>
     <form id="formularioActualizarFabricacion" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12 sm:col-span-8 md:col-span-8 lg:col-span-8 xl:col-span-8" >
<label for="descripcionAgregarDatos">DESCRIPCION</label>
<input type="input" v-model="datoscamposFabricacion.descripcion" name="descripcion"  class="form-control " id="descripcionAgregarDatos"  v-mayuscula placeholder="descripcion" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="minimoAgregarDatos">MINIMO</label>
<input type="input" v-model="datoscamposFabricacion.minimo" name="minimo"  class="form-control " id="minimoAgregarDatos"  v-solonumeros v-numeroFocusinOut v-decimales placeholder="minimo" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="blancoAgregarDatos">BLANCO</label>
<input type="input" v-model="datoscamposFabricacion.blanco" name="blanco"  class="form-control " id="blancoAgregarDatos"  v-solonumeros v-numeroFocusinOut v-decimales placeholder="blanco" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="plataAgregarDatos">PLATA</label>
<input type="input" v-model="datoscamposFabricacion.plata" name="plata"  class="form-control " id="plataAgregarDatos"  v-solonumeros v-numeroFocusinOut v-decimales placeholder="plata" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="grisAgregarDatos">GRIS</label>
<input type="input" v-model="datoscamposFabricacion.gris" name="gris" class="form-control " id="grisAgregarDatos" v-solonumeros v-numeroFocusinOut v-decimales placeholder="gris" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="negroAgregarDatos">NEGRO</label>
<input type="input" v-model="datoscamposFabricacion.negro" name="negro"  class="form-control " id="negroAgregarDatos"  v-solonumeros v-numeroFocusinOut v-decimales placeholder="negro" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="negroTexturizadoAgregarDatos">NEGRO TEXTURIZADO</label>
<input type="input" v-model="datoscamposFabricacion.negro_texturizado" name="negro_texturizado" class="form-control " id="negroTexturizadoAgregarDatos" v-solonumeros v-numeroFocusinOut v-decimales placeholder="negro texturizado" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="maderaAgregarDatos">MADERA</label>
<input type="input" v-model="datoscamposFabricacion.madera" name="madera"  class="form-control " id="maderaAgregarDatos"  v-solonumeros v-numeroFocusinOut v-decimales placeholder="madera" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="inoxAgregarDatos">INOX</label>
<input type="input" v-model="datoscamposFabricacion.inox" name="inox"  class="form-control " id="inoxAgregarDatos"  v-solonumeros v-numeroFocusinOut v-decimales placeholder="inox" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="robleAgregarDatos">ROBLE</label>
<input type="input" v-model="datoscamposFabricacion.roble" name="roble"  class="form-control " id="robleAgregarDatos"  v-solonumeros v-numeroFocusinOut v-decimales placeholder="roble" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="otroAgregarDatos">OTRO</label>
<input type="input" v-model="datoscamposFabricacion.otro" name="otro"  class="form-control " id="otroAgregarDatos"  v-solonumeros v-numeroFocusinOut v-decimales placeholder="otro" maxlength="250">
</div>
<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposFabricacion.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"   placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposFabricacion.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"   placeholder="updated_at" maxlength="">
</div>
<div class="form-group col-span-12" >
<label for="imagenAgregarDatos">IMAGEN</label>
 <FileUploader
    ref="fileUpload"
   :url-IMAGEN="urlIMAGEN"
   :ruta-IMAGEN="rutaIMAGEN"
   :autoUpload="false"
   @uploadSuccess="handleUploadSuccess"
   @uploadError="handleUploadError"
 />
</div>
<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposFabricacion.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"   placeholder="usuario" maxlength="250">
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
