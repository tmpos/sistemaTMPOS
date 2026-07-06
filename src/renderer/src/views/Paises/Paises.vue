<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,peticionesFetchOffline,
arrayToObjetoFromTablaOffline,
crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["nombre","moneda","simbolo","iso","prefijo","digitos","nombre_imp","c_imp","idioma","z_horaria","usuario"];
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
const datoscamposPaises = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const PaisesEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposPaises.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'paises');
    const jsonData = response;
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('paises');
  datoscamposPaises.value = campos;
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
await crearTablaSiNoExisteOffline('paises', camposArray, toast);
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'paises');
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
  const url = link.value+api.value+"/actualizarcampos/paises";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'paises',JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/paises";
  if (datoscamposPaises.value.hasOwnProperty('created_at')) {
    datoscamposPaises.value.created_at = nfecha('timestamp');
    datoscamposPaises.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'paises',JSON.stringify(datoscamposPaises.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'paises',id);
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
const itemsPaises = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const togglePaises = (event, rowData) => {
currentRowData.value = rowData;
itemsPaises.value = [
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'paises',rowData.id);
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
const filteredPaises = computed(() => {
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
          <legend class="float-none w-auto px-2">Datos de Paises</legend>
            <div class="grid grid-cols-12 gap-4">
              <div class="sm:col-span-12">
                <a href="#" @click="fetchAndSetupData" class="btn btn-warning text-white cartelito" data-toggle="tooltip" title="Recargar" id="reload"><i class="icon-arrows-cw"></i></a>
               <a href="#" class="btn btn-success cartelito ms-1" title="Agregar Nuevo" id="nuevoregistro" @click="visiblecrear = true"><i class="icon-plus"></i></a>
               <a href="#" @click="borrarSeleccionados" class="btn btn-danger btnaccion cartelito ms-1" data-toggle="tooltip" title="Borrar Selección" id="borrador"><i class="icon-trash-4"></i></a>
<a href="#" v-if="usuarioLocal.usuario =='Soporte'"  @click="borrarTodo" class="btn btn-danger btnaccion cartelito float-end ms-1" data-toggle="tooltip" title="Borrar Todo" id="borrartodo"><i class="icon-trash"></i> Borrar Todo</a>
              </div>
            </div>
        </fieldset>
      </div>
      <div class="md:col-span-12">
 <div style="display: flex; justify-content: flex-end;">
 <input v-model="searchQuery" placeholder="Buscar paises..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
</div>
<DataTable 
    :value="filteredPaises"  
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
                @click="togglePaises($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
            />
            <Menu 
                ref="menu" 
                id="overlay_menu_Paises" 
                :model="itemsPaises" 
                :popup="true"
            />
        </template>
    </Column>
    <Column field="nombre" header="Nombre"></Column>
<Column field="moneda" header="Moneda"></Column>
<Column field="simbolo" header="Simbolo"></Column>
<Column field="iso" header="Iso"></Column>
<Column field="prefijo" header="Prefijo"></Column>
<Column field="digitos" header="Digitos"></Column>
<Column field="nombre_imp" header="Nombre_imp"></Column>
<Column field="c_imp" header="C_imp"></Column>
<Column field="idioma" header="Idioma"></Column>
<Column field="z_horaria" header="Z_horaria"></Column>
<Column field="usuario" header="Usuario"></Column>

</DataTable>
      </div>
    </div>
      </template>
</Card>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visible" :position="position" modal header="Modificar Paises" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Editar</span>
                </div>
            </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Paises</legend>
     <form id="formularioActualizarPaises" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12" hidden>
<label for="id-Actualizador">ID</label>
<input type="input" v-model="datoscampos.id" name="id"  class="form-control" id="id-Actualizador" readonly placeholder="id"  maxlength="11">
</div>
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="nombre-Actualizador">NOMBRE</label>
<input type="input" v-model="datoscampos.nombre" name="nombre"  class="form-control" id="nombre-Actualizador"  placeholder="nombre" v-mayuscula maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="moneda-Actualizador">MONEDA</label>
<input type="input" v-model="datoscampos.moneda" name="moneda"  class="form-control" id="moneda-Actualizador"  placeholder="moneda" v-mayuscula maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="simbolo-Actualizador">SIMBOLO</label>
<input type="input" v-model="datoscampos.simbolo" name="simbolo"  class="form-control" id="simbolo-Actualizador"  placeholder="simbolo"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="iso-Actualizador">ISO</label>
<input type="input" v-model="datoscampos.iso" name="iso"  class="form-control" id="iso-Actualizador"  placeholder="iso"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="prefijo-Actualizador">PREFIJO</label>
<input type="input" v-model="datoscampos.prefijo" name="prefijo"  class="form-control" id="prefijo-Actualizador"  placeholder="prefijo"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="digitos-Actualizador">DIGITOS</label>
<input type="input" v-model="datoscampos.digitos" name="digitos"  class="form-control" id="digitos-Actualizador"  placeholder="digitos"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="nombre_imp-Actualizador">NOMBRE_IMP</label>
<input type="input" v-model="datoscampos.nombre_imp" name="nombre_imp"  class="form-control" id="nombre_imp-Actualizador"  placeholder="nombre_imp" v-mayuscula maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="c_imp-Actualizador">C_IMP</label>
<input type="input" v-model="datoscampos.c_imp" name="c_imp"  class="form-control" id="c_imp-Actualizador"  placeholder="c_imp"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-6" >
<label for="idioma-Actualizador">IDIOMA</label>
<input type="input" v-model="datoscampos.idioma" name="idioma"  class="form-control" id="idioma-Actualizador"  placeholder="idioma"  maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-6" >
<label for="z_horaria-Actualizador">Z_HORARIA</label>
<select class="form-control " id="z_horaria-Actualizador" v-model="datoscampos.z_horaria" name="z_horaria" >
<option value="Africa/Abidjan" >
                             UTC/GMT -04:00 - Africa/Abidjan                           </option>
                                                    <option value="Africa/Accra" >
                             UTC/GMT -04:00 - Africa/Accra                           </option>
                                                    <option value="Africa/Addis_Ababa" >
                             UTC/GMT -04:00 - Africa/Addis_Ababa                           </option>
                                                    <option value="Africa/Algiers" >
                             UTC/GMT -04:00 - Africa/Algiers                           </option>
                                                    <option value="Africa/Asmara" >
                             UTC/GMT -04:00 - Africa/Asmara                           </option>
                                                    <option value="Africa/Bamako" >
                             UTC/GMT -04:00 - Africa/Bamako                           </option>
                                                    <option value="Africa/Bangui" >
                             UTC/GMT -04:00 - Africa/Bangui                           </option>
                                                    <option value="Africa/Banjul" >
                             UTC/GMT -04:00 - Africa/Banjul                           </option>
                                                    <option value="Africa/Bissau" >
                             UTC/GMT -04:00 - Africa/Bissau                           </option>
                                                    <option value="Africa/Blantyre" >
                             UTC/GMT -04:00 - Africa/Blantyre                           </option>
                                                    <option value="Africa/Brazzaville" >
                             UTC/GMT -04:00 - Africa/Brazzaville                           </option>
                                                    <option value="Africa/Bujumbura" >
                             UTC/GMT -04:00 - Africa/Bujumbura                           </option>
                                                    <option value="Africa/Cairo" >
                             UTC/GMT -04:00 - Africa/Cairo                           </option>
                                                    <option value="Africa/Casablanca" >
                             UTC/GMT -04:00 - Africa/Casablanca                           </option>
                                                    <option value="Africa/Ceuta" >
                             UTC/GMT -04:00 - Africa/Ceuta                           </option>
                                                    <option value="Africa/Conakry" >
                             UTC/GMT -04:00 - Africa/Conakry                           </option>
                                                    <option value="Africa/Dakar" >
                             UTC/GMT -04:00 - Africa/Dakar                           </option>
                                                    <option value="Africa/Dar_es_Salaam" >
                             UTC/GMT -04:00 - Africa/Dar_es_Salaam                           </option>
                                                    <option value="Africa/Djibouti" >
                             UTC/GMT -04:00 - Africa/Djibouti                           </option>
                                                    <option value="Africa/Douala" >
                             UTC/GMT -04:00 - Africa/Douala                           </option>
                                                    <option value="Africa/El_Aaiun" >
                             UTC/GMT -04:00 - Africa/El_Aaiun                           </option>
                                                    <option value="Africa/Freetown" >
                             UTC/GMT -04:00 - Africa/Freetown                           </option>
                                                    <option value="Africa/Gaborone" >
                             UTC/GMT -04:00 - Africa/Gaborone                           </option>
                                                    <option value="Africa/Harare" >
                             UTC/GMT -04:00 - Africa/Harare                           </option>
                                                    <option value="Africa/Johannesburg" >
                             UTC/GMT -04:00 - Africa/Johannesburg                           </option>
                                                    <option value="Africa/Juba" >
                             UTC/GMT -04:00 - Africa/Juba                           </option>
                                                    <option value="Africa/Kampala" >
                             UTC/GMT -04:00 - Africa/Kampala                           </option>
                                                    <option value="Africa/Khartoum" >
                             UTC/GMT -04:00 - Africa/Khartoum                           </option>
                                                    <option value="Africa/Kigali" >
                             UTC/GMT -04:00 - Africa/Kigali                           </option>
                                                    <option value="Africa/Kinshasa" >
                             UTC/GMT -04:00 - Africa/Kinshasa                           </option>
                                                    <option value="Africa/Lagos" >
                             UTC/GMT -04:00 - Africa/Lagos                           </option>
                                                    <option value="Africa/Libreville" >
                             UTC/GMT -04:00 - Africa/Libreville                           </option>
                                                    <option value="Africa/Lome" >
                             UTC/GMT -04:00 - Africa/Lome                           </option>
                                                    <option value="Africa/Luanda" >
                             UTC/GMT -04:00 - Africa/Luanda                           </option>
                                                    <option value="Africa/Lubumbashi" >
                             UTC/GMT -04:00 - Africa/Lubumbashi                           </option>
                                                    <option value="Africa/Lusaka" >
                             UTC/GMT -04:00 - Africa/Lusaka                           </option>
                                                    <option value="Africa/Malabo" >
                             UTC/GMT -04:00 - Africa/Malabo                           </option>
                                                    <option value="Africa/Maputo" >
                             UTC/GMT -04:00 - Africa/Maputo                           </option>
                                                    <option value="Africa/Maseru" >
                             UTC/GMT -04:00 - Africa/Maseru                           </option>
                                                    <option value="Africa/Mbabane" >
                             UTC/GMT -04:00 - Africa/Mbabane                           </option>
                                                    <option value="Africa/Mogadishu" >
                             UTC/GMT -04:00 - Africa/Mogadishu                           </option>
                                                    <option value="Africa/Monrovia" >
                             UTC/GMT -04:00 - Africa/Monrovia                           </option>
                                                    <option value="Africa/Nairobi" >
                             UTC/GMT -04:00 - Africa/Nairobi                           </option>
                                                    <option value="Africa/Ndjamena" >
                             UTC/GMT -04:00 - Africa/Ndjamena                           </option>
                                                    <option value="Africa/Niamey" >
                             UTC/GMT -04:00 - Africa/Niamey                           </option>
                                                    <option value="Africa/Nouakchott" >
                             UTC/GMT -04:00 - Africa/Nouakchott                           </option>
                                                    <option value="Africa/Ouagadougou" >
                             UTC/GMT -04:00 - Africa/Ouagadougou                           </option>
                                                    <option value="Africa/Porto-Novo" >
                             UTC/GMT -04:00 - Africa/Porto-Novo                           </option>
                                                    <option value="Africa/Sao_Tome" >
                             UTC/GMT -04:00 - Africa/Sao_Tome                           </option>
                                                    <option value="Africa/Tripoli" >
                             UTC/GMT -04:00 - Africa/Tripoli                           </option>
                                                    <option value="Africa/Tunis" >
                             UTC/GMT -04:00 - Africa/Tunis                           </option>
                                                    <option value="Africa/Windhoek" >
                             UTC/GMT -04:00 - Africa/Windhoek                           </option>
                                                    <option value="America/Adak" >
                             UTC/GMT -04:00 - America/Adak                           </option>
                                                    <option value="America/Anchorage" >
                             UTC/GMT -04:00 - America/Anchorage                           </option>
                                                    <option value="America/Anguilla" >
                             UTC/GMT -04:00 - America/Anguilla                           </option>
                                                    <option value="America/Antigua" >
                             UTC/GMT -04:00 - America/Antigua                           </option>
                                                    <option value="America/Araguaina" >
                             UTC/GMT -04:00 - America/Araguaina                           </option>
                                                    <option value="America/Argentina/Buenos_Aires" >
                             UTC/GMT -04:00 - America/Argentina/Buenos_Aires                           </option>
                                                    <option value="America/Argentina/Catamarca" >
                             UTC/GMT -04:00 - America/Argentina/Catamarca                           </option>
                                                    <option value="America/Argentina/Cordoba" >
                             UTC/GMT -04:00 - America/Argentina/Cordoba                           </option>
                                                    <option value="America/Argentina/Jujuy" >
                             UTC/GMT -04:00 - America/Argentina/Jujuy                           </option>
                                                    <option value="America/Argentina/La_Rioja" >
                             UTC/GMT -04:00 - America/Argentina/La_Rioja                           </option>
                                                    <option value="America/Argentina/Mendoza" >
                             UTC/GMT -04:00 - America/Argentina/Mendoza                           </option>
                                                    <option value="America/Argentina/Rio_Gallegos" >
                             UTC/GMT -04:00 - America/Argentina/Rio_Gallegos                           </option>
                                                    <option value="America/Argentina/Salta" >
                             UTC/GMT -04:00 - America/Argentina/Salta                           </option>
                                                    <option value="America/Argentina/San_Juan" >
                             UTC/GMT -04:00 - America/Argentina/San_Juan                           </option>
                                                    <option value="America/Argentina/San_Luis" >
                             UTC/GMT -04:00 - America/Argentina/San_Luis                           </option>
                                                    <option value="America/Argentina/Tucuman" >
                             UTC/GMT -04:00 - America/Argentina/Tucuman                           </option>
                                                    <option value="America/Argentina/Ushuaia" >
                             UTC/GMT -04:00 - America/Argentina/Ushuaia                           </option>
                                                    <option value="America/Aruba" >
                             UTC/GMT -04:00 - America/Aruba                           </option>
                                                    <option value="America/Asuncion" >
                             UTC/GMT -04:00 - America/Asuncion                           </option>
                                                    <option value="America/Atikokan" >
                             UTC/GMT -04:00 - America/Atikokan                           </option>
                                                    <option value="America/Bahia" >
                             UTC/GMT -04:00 - America/Bahia                           </option>
                                                    <option value="America/Bahia_Banderas" >
                             UTC/GMT -04:00 - America/Bahia_Banderas                           </option>
                                                    <option value="America/Barbados" >
                             UTC/GMT -04:00 - America/Barbados                           </option>
                                                    <option value="America/Belem" >
                             UTC/GMT -04:00 - America/Belem                           </option>
                                                    <option value="America/Belize" >
                             UTC/GMT -04:00 - America/Belize                           </option>
                                                    <option value="America/Blanc-Sablon" >
                             UTC/GMT -04:00 - America/Blanc-Sablon                           </option>
                                                    <option value="America/Boa_Vista" >
                             UTC/GMT -04:00 - America/Boa_Vista                           </option>
                                                    <option value="America/Bogota" >
                             UTC/GMT -04:00 - America/Bogota                           </option>
                                                    <option value="America/Boise" >
                             UTC/GMT -04:00 - America/Boise                           </option>
                                                    <option value="America/Cambridge_Bay" >
                             UTC/GMT -04:00 - America/Cambridge_Bay                           </option>
                                                    <option value="America/Campo_Grande" >
                             UTC/GMT -04:00 - America/Campo_Grande                           </option>
                                                    <option value="America/Cancun" >
                             UTC/GMT -04:00 - America/Cancun                           </option>
                                                    <option value="America/Caracas">
                             UTC/GMT -04:00 - America/Caracas                           </option>
                                                    <option value="America/Cayenne" >
                             UTC/GMT -04:00 - America/Cayenne                           </option>
                                                    <option value="America/Cayman" >
                             UTC/GMT -04:00 - America/Cayman                           </option>
                                                    <option value="America/Chicago" >
                             UTC/GMT -04:00 - America/Chicago                           </option>
                                                    <option value="America/Chihuahua" >
                             UTC/GMT -04:00 - America/Chihuahua                           </option>
                                                    <option value="America/Costa_Rica" >
                             UTC/GMT -04:00 - America/Costa_Rica                           </option>
                                                    <option value="America/Creston" >
                             UTC/GMT -04:00 - America/Creston                           </option>
                                                    <option value="America/Cuiaba" >
                             UTC/GMT -04:00 - America/Cuiaba                           </option>
                                                    <option value="America/Curacao" >
                             UTC/GMT -04:00 - America/Curacao                           </option>
                                                    <option value="America/Danmarkshavn" >
                             UTC/GMT -04:00 - America/Danmarkshavn                           </option>
                                                    <option value="America/Dawson" >
                             UTC/GMT -04:00 - America/Dawson                           </option>
                                                    <option value="America/Dawson_Creek" >
                             UTC/GMT -04:00 - America/Dawson_Creek                           </option>
                                                    <option value="America/Denver" >
                             UTC/GMT -04:00 - America/Denver                           </option>
                                                    <option value="America/Detroit" >
                             UTC/GMT -04:00 - America/Detroit                           </option>
                                                    <option value="America/Dominica" >
                             UTC/GMT -04:00 - America/Dominica                           </option>
                                                    <option value="America/Edmonton" >
                             UTC/GMT -04:00 - America/Edmonton                           </option>
                                                    <option value="America/Eirunepe" >
                             UTC/GMT -04:00 - America/Eirunepe                           </option>
                                                    <option value="America/El_Salvador" >
                             UTC/GMT -04:00 - America/El_Salvador                           </option>
                                                    <option value="America/Fort_Nelson" >
                             UTC/GMT -04:00 - America/Fort_Nelson                           </option>
                                                    <option value="America/Fortaleza" >
                             UTC/GMT -04:00 - America/Fortaleza                           </option>
                                                    <option value="America/Glace_Bay" >
                             UTC/GMT -04:00 - America/Glace_Bay                           </option>
                                                    <option value="America/Godthab" >
                             UTC/GMT -04:00 - America/Godthab                           </option>
                                                    <option value="America/Goose_Bay" >
                             UTC/GMT -04:00 - America/Goose_Bay                           </option>
                                                    <option value="America/Grand_Turk" >
                             UTC/GMT -04:00 - America/Grand_Turk                           </option>
                                                    <option value="America/Grenada" >
                             UTC/GMT -04:00 - America/Grenada                           </option>
                                                    <option value="America/Guadeloupe" >
                             UTC/GMT -04:00 - America/Guadeloupe                           </option>
                                                    <option value="America/Guatemala" >
                             UTC/GMT -04:00 - America/Guatemala                           </option>
                                                    <option value="America/Guayaquil" >
                             UTC/GMT -04:00 - America/Guayaquil                           </option>
                                                    <option value="America/Guyana" >
                             UTC/GMT -04:00 - America/Guyana                           </option>
                                                    <option value="America/Halifax" >
                             UTC/GMT -04:00 - America/Halifax                           </option>
                                                    <option value="America/Havana" >
                             UTC/GMT -04:00 - America/Havana                           </option>
                                                    <option value="America/Hermosillo" >
                             UTC/GMT -04:00 - America/Hermosillo                           </option>
                                                    <option value="America/Indiana/Indianapolis" >
                             UTC/GMT -04:00 - America/Indiana/Indianapolis                           </option>
                                                    <option value="America/Indiana/Knox" >
                             UTC/GMT -04:00 - America/Indiana/Knox                           </option>
                                                    <option value="America/Indiana/Marengo" >
                             UTC/GMT -04:00 - America/Indiana/Marengo                           </option>
                                                    <option value="America/Indiana/Petersburg" >
                             UTC/GMT -04:00 - America/Indiana/Petersburg                           </option>
                                                    <option value="America/Indiana/Tell_City" >
                             UTC/GMT -04:00 - America/Indiana/Tell_City                           </option>
                                                    <option value="America/Indiana/Vevay" >
                             UTC/GMT -04:00 - America/Indiana/Vevay                           </option>
                                                    <option value="America/Indiana/Vincennes" >
                             UTC/GMT -04:00 - America/Indiana/Vincennes                           </option>
                                                    <option value="America/Indiana/Winamac" >
                             UTC/GMT -04:00 - America/Indiana/Winamac                           </option>
                                                    <option value="America/Inuvik" >
                             UTC/GMT -04:00 - America/Inuvik                           </option>
                                                    <option value="America/Iqaluit" >
                             UTC/GMT -04:00 - America/Iqaluit                           </option>
                                                    <option value="America/Jamaica" >
                             UTC/GMT -04:00 - America/Jamaica                           </option>
                                                    <option value="America/Juneau" >
                             UTC/GMT -04:00 - America/Juneau                           </option>
                                                    <option value="America/Kentucky/Louisville" >
                             UTC/GMT -04:00 - America/Kentucky/Louisville                           </option>
                                                    <option value="America/Kentucky/Monticello" >
                             UTC/GMT -04:00 - America/Kentucky/Monticello                           </option>
                                                    <option value="America/Kralendijk" >
                             UTC/GMT -04:00 - America/Kralendijk                           </option>
                                                    <option value="America/La_Paz" >
                             UTC/GMT -04:00 - America/La_Paz                           </option>
                                                    <option value="America/Lima" >
                             UTC/GMT -04:00 - America/Lima                           </option>
                                                    <option value="America/Los_Angeles" >
                             UTC/GMT -04:00 - America/Los_Angeles                           </option>
                                                    <option value="America/Lower_Princes" >
                             UTC/GMT -04:00 - America/Lower_Princes                           </option>
                                                    <option value="America/Maceio" >
                             UTC/GMT -04:00 - America/Maceio                           </option>
                                                    <option value="America/Managua" >
                             UTC/GMT -04:00 - America/Managua                           </option>
                                                    <option value="America/Manaus" >
                             UTC/GMT -04:00 - America/Manaus                           </option>
                                                    <option value="America/Marigot" >
                             UTC/GMT -04:00 - America/Marigot                           </option>
                                                    <option value="America/Martinique" >
                             UTC/GMT -04:00 - America/Martinique                           </option>
                                                    <option value="America/Matamoros" >
                             UTC/GMT -04:00 - America/Matamoros                           </option>
                                                    <option value="America/Mazatlan" >
                             UTC/GMT -04:00 - America/Mazatlan                           </option>
                                                    <option value="America/Menominee" >
                             UTC/GMT -04:00 - America/Menominee                           </option>
                                                    <option value="America/Merida" >
                             UTC/GMT -04:00 - America/Merida                           </option>
                                                    <option value="America/Metlakatla" >
                             UTC/GMT -04:00 - America/Metlakatla                           </option>
                                                    <option value="America/Mexico_City" >
                             UTC/GMT -04:00 - America/Mexico_City                           </option>
                                                    <option value="America/Miquelon" >
                             UTC/GMT -04:00 - America/Miquelon                           </option>
                                                    <option value="America/Moncton" >
                             UTC/GMT -04:00 - America/Moncton                           </option>
                                                    <option value="America/Monterrey" >
                             UTC/GMT -04:00 - America/Monterrey                           </option>
                                                    <option value="America/Montevideo" >
                             UTC/GMT -04:00 - America/Montevideo                           </option>
                                                    <option value="America/Montserrat" >
                             UTC/GMT -04:00 - America/Montserrat                           </option>
                                                    <option value="America/Nassau" >
                             UTC/GMT -04:00 - America/Nassau                           </option>
                                                    <option value="America/New_York" >
                             UTC/GMT -04:00 - America/New_York                           </option>
                                                    <option value="America/Nipigon" >
                             UTC/GMT -04:00 - America/Nipigon                           </option>
                                                    <option value="America/Nome" >
                             UTC/GMT -04:00 - America/Nome                           </option>
                                                    <option value="America/Noronha" >
                             UTC/GMT -04:00 - America/Noronha                           </option>
                                                    <option value="America/North_Dakota/Beulah" >
                             UTC/GMT -04:00 - America/North_Dakota/Beulah                           </option>
                                                    <option value="America/North_Dakota/Center" >
                             UTC/GMT -04:00 - America/North_Dakota/Center                           </option>
                                                    <option value="America/North_Dakota/New_Salem" >
                             UTC/GMT -04:00 - America/North_Dakota/New_Salem                           </option>
                                                    <option value="America/Ojinaga" >
                             UTC/GMT -04:00 - America/Ojinaga                           </option>
                                                    <option value="America/Panama" >
                             UTC/GMT -04:00 - America/Panama                           </option>
                                                    <option value="America/Pangnirtung" >
                             UTC/GMT -04:00 - America/Pangnirtung                           </option>
                                                    <option value="America/Paramaribo" >
                             UTC/GMT -04:00 - America/Paramaribo                           </option>
                                                    <option value="America/Phoenix" >
                             UTC/GMT -04:00 - America/Phoenix                           </option>
                                                    <option value="America/Port-au-Prince" >
                             UTC/GMT -04:00 - America/Port-au-Prince                           </option>
                                                    <option value="America/Port_of_Spain" >
                             UTC/GMT -04:00 - America/Port_of_Spain                           </option>
                                                    <option value="America/Porto_Velho" >
                             UTC/GMT -04:00 - America/Porto_Velho                           </option>
                                                    <option value="America/Puerto_Rico" >
                             UTC/GMT -04:00 - America/Puerto_Rico                           </option>
                                                    <option value="America/Punta_Arenas" >
                             UTC/GMT -04:00 - America/Punta_Arenas                           </option>
                                                    <option value="America/Rainy_River" >
                             UTC/GMT -04:00 - America/Rainy_River                           </option>
                                                    <option value="America/Rankin_Inlet" >
                             UTC/GMT -04:00 - America/Rankin_Inlet                           </option>
                                                    <option value="America/Recife" >
                             UTC/GMT -04:00 - America/Recife                           </option>
                                                    <option value="America/Regina" >
                             UTC/GMT -04:00 - America/Regina                           </option>
                                                    <option value="America/Resolute" >
                             UTC/GMT -04:00 - America/Resolute                           </option>
                                                    <option value="America/Rio_Branco" >
                             UTC/GMT -04:00 - America/Rio_Branco                           </option>
                                                    <option value="America/Santarem" >
                             UTC/GMT -04:00 - America/Santarem                           </option>
                                                    <option value="America/Santiago" >
                             UTC/GMT -04:00 - America/Santiago                           </option>
                                                    <option value="America/Santo_Domingo" >
                             UTC/GMT -04:00 - America/Santo_Domingo                           </option>
                                                    <option value="America/Sao_Paulo" >
                             UTC/GMT -04:00 - America/Sao_Paulo                           </option>
                                                    <option value="America/Scoresbysund" >
                             UTC/GMT -04:00 - America/Scoresbysund                           </option>
                                                    <option value="America/Sitka" >
                             UTC/GMT -04:00 - America/Sitka                           </option>
                                                    <option value="America/St_Barthelemy" >
                             UTC/GMT -04:00 - America/St_Barthelemy                           </option>
                                                    <option value="America/St_Johns" >
                             UTC/GMT -04:00 - America/St_Johns                           </option>
                                                    <option value="America/St_Kitts" >
                             UTC/GMT -04:00 - America/St_Kitts                           </option>
                                                    <option value="America/St_Lucia" >
                             UTC/GMT -04:00 - America/St_Lucia                           </option>
                                                    <option value="America/St_Thomas" >
                             UTC/GMT -04:00 - America/St_Thomas                           </option>
                                                    <option value="America/St_Vincent" >
                             UTC/GMT -04:00 - America/St_Vincent                           </option>
                                                    <option value="America/Swift_Current" >
                             UTC/GMT -04:00 - America/Swift_Current                           </option>
                                                    <option value="America/Tegucigalpa" >
                             UTC/GMT -04:00 - America/Tegucigalpa                           </option>
                                                    <option value="America/Thule" >
                             UTC/GMT -04:00 - America/Thule                           </option>
                                                    <option value="America/Thunder_Bay" >
                             UTC/GMT -04:00 - America/Thunder_Bay                           </option>
                                                    <option value="America/Tijuana" >
                             UTC/GMT -04:00 - America/Tijuana                           </option>
                                                    <option value="America/Toronto" >
                             UTC/GMT -04:00 - America/Toronto                           </option>
                                                    <option value="America/Tortola" >
                             UTC/GMT -04:00 - America/Tortola                           </option>
                                                    <option value="America/Vancouver" >
                             UTC/GMT -04:00 - America/Vancouver                           </option>
                                                    <option value="America/Whitehorse" >
                             UTC/GMT -04:00 - America/Whitehorse                           </option>
                                                    <option value="America/Winnipeg" >
                             UTC/GMT -04:00 - America/Winnipeg                           </option>
                                                    <option value="America/Yakutat" >
                             UTC/GMT -04:00 - America/Yakutat                           </option>
                                                    <option value="America/Yellowknife" >
                             UTC/GMT -04:00 - America/Yellowknife                           </option>
                                                    <option value="Antarctica/Casey" >
                             UTC/GMT -04:00 - Antarctica/Casey                           </option>
                                                    <option value="Antarctica/Davis" >
                             UTC/GMT -04:00 - Antarctica/Davis                           </option>
                                                    <option value="Antarctica/DumontDUrville" >
                             UTC/GMT -04:00 - Antarctica/DumontDUrville                           </option>
                                                    <option value="Antarctica/Macquarie" >
                             UTC/GMT -04:00 - Antarctica/Macquarie                           </option>
                                                    <option value="Antarctica/Mawson" >
                             UTC/GMT -04:00 - Antarctica/Mawson                           </option>
                                                    <option value="Antarctica/McMurdo" >
                             UTC/GMT -04:00 - Antarctica/McMurdo                           </option>
                                                    <option value="Antarctica/Palmer" >
                             UTC/GMT -04:00 - Antarctica/Palmer                           </option>
                                                    <option value="Antarctica/Rothera" >
                             UTC/GMT -04:00 - Antarctica/Rothera                           </option>
                                                    <option value="Antarctica/Syowa" >
                             UTC/GMT -04:00 - Antarctica/Syowa                           </option>
                                                    <option value="Antarctica/Troll" >
                             UTC/GMT -04:00 - Antarctica/Troll                           </option>
                                                    <option value="Antarctica/Vostok" >
                             UTC/GMT -04:00 - Antarctica/Vostok                           </option>
                                                    <option value="Arctic/Longyearbyen" >
                             UTC/GMT -04:00 - Arctic/Longyearbyen                           </option>
                                                    <option value="Asia/Aden" >
                             UTC/GMT -04:00 - Asia/Aden                           </option>
                                                    <option value="Asia/Almaty" >
                             UTC/GMT -04:00 - Asia/Almaty                           </option>
                                                    <option value="Asia/Amman" >
                             UTC/GMT -04:00 - Asia/Amman                           </option>
                                                    <option value="Asia/Anadyr" >
                             UTC/GMT -04:00 - Asia/Anadyr                           </option>
                                                    <option value="Asia/Aqtau" >
                             UTC/GMT -04:00 - Asia/Aqtau                           </option>
                                                    <option value="Asia/Aqtobe" >
                             UTC/GMT -04:00 - Asia/Aqtobe                           </option>
                                                    <option value="Asia/Ashgabat" >
                             UTC/GMT -04:00 - Asia/Ashgabat                           </option>
                                                    <option value="Asia/Atyrau" >
                             UTC/GMT -04:00 - Asia/Atyrau                           </option>
                                                    <option value="Asia/Baghdad" >
                             UTC/GMT -04:00 - Asia/Baghdad                           </option>
                                                    <option value="Asia/Bahrain" >
                             UTC/GMT -04:00 - Asia/Bahrain                           </option>
                                                    <option value="Asia/Baku" >
                             UTC/GMT -04:00 - Asia/Baku                           </option>
                                                    <option value="Asia/Bangkok" >
                             UTC/GMT -04:00 - Asia/Bangkok                           </option>
                                                    <option value="Asia/Barnaul" >
                             UTC/GMT -04:00 - Asia/Barnaul                           </option>
                                                    <option value="Asia/Beirut" >
                             UTC/GMT -04:00 - Asia/Beirut                           </option>
                                                    <option value="Asia/Bishkek" >
                             UTC/GMT -04:00 - Asia/Bishkek                           </option>
                                                    <option value="Asia/Brunei" >
                             UTC/GMT -04:00 - Asia/Brunei                           </option>
                                                    <option value="Asia/Chita" >
                             UTC/GMT -04:00 - Asia/Chita                           </option>
                                                    <option value="Asia/Choibalsan" >
                             UTC/GMT -04:00 - Asia/Choibalsan                           </option>
                                                    <option value="Asia/Colombo" >
                             UTC/GMT -04:00 - Asia/Colombo                           </option>
                                                    <option value="Asia/Damascus" >
                             UTC/GMT -04:00 - Asia/Damascus                           </option>
                                                    <option value="Asia/Dhaka" >
                             UTC/GMT -04:00 - Asia/Dhaka                           </option>
                                                    <option value="Asia/Dili" >
                             UTC/GMT -04:00 - Asia/Dili                           </option>
                                                    <option value="Asia/Dubai" >
                             UTC/GMT -04:00 - Asia/Dubai                           </option>
                                                    <option value="Asia/Dushanbe" >
                             UTC/GMT -04:00 - Asia/Dushanbe                           </option>
                                                    <option value="Asia/Famagusta" >
                             UTC/GMT -04:00 - Asia/Famagusta                           </option>
                                                    <option value="Asia/Gaza" >
                             UTC/GMT -04:00 - Asia/Gaza                           </option>
                                                    <option value="Asia/Hebron" >
                             UTC/GMT -04:00 - Asia/Hebron                           </option>
                                                    <option value="Asia/Ho_Chi_Minh" >
                             UTC/GMT -04:00 - Asia/Ho_Chi_Minh                           </option>
                                                    <option value="Asia/Hong_Kong" >
                             UTC/GMT -04:00 - Asia/Hong_Kong                           </option>
                                                    <option value="Asia/Hovd" >
                             UTC/GMT -04:00 - Asia/Hovd                           </option>
                                                    <option value="Asia/Irkutsk" >
                             UTC/GMT -04:00 - Asia/Irkutsk                           </option>
                                                    <option value="Asia/Jakarta" >
                             UTC/GMT -04:00 - Asia/Jakarta                           </option>
                                                    <option value="Asia/Jayapura" >
                             UTC/GMT -04:00 - Asia/Jayapura                           </option>
                                                    <option value="Asia/Jerusalem" >
                             UTC/GMT -04:00 - Asia/Jerusalem                           </option>
                                                    <option value="Asia/Kabul" >
                             UTC/GMT -04:00 - Asia/Kabul                           </option>
                                                    <option value="Asia/Kamchatka" >
                             UTC/GMT -04:00 - Asia/Kamchatka                           </option>
                                                    <option value="Asia/Karachi" >
                             UTC/GMT -04:00 - Asia/Karachi                           </option>
                                                    <option value="Asia/Kathmandu" >
                             UTC/GMT -04:00 - Asia/Kathmandu                           </option>
                                                    <option value="Asia/Khandyga" >
                             UTC/GMT -04:00 - Asia/Khandyga                           </option>
                                                    <option value="Asia/Kolkata" >
                             UTC/GMT -04:00 - Asia/Kolkata                           </option>
                                                    <option value="Asia/Krasnoyarsk" >
                             UTC/GMT -04:00 - Asia/Krasnoyarsk                           </option>
                                                    <option value="Asia/Kuala_Lumpur" >
                             UTC/GMT -04:00 - Asia/Kuala_Lumpur                           </option>
                                                    <option value="Asia/Kuching" >
                             UTC/GMT -04:00 - Asia/Kuching                           </option>
                                                    <option value="Asia/Kuwait" >
                             UTC/GMT -04:00 - Asia/Kuwait                           </option>
                                                    <option value="Asia/Macau" >
                             UTC/GMT -04:00 - Asia/Macau                           </option>
                                                    <option value="Asia/Magadan" >
                             UTC/GMT -04:00 - Asia/Magadan                           </option>
                                                    <option value="Asia/Makassar" >
                             UTC/GMT -04:00 - Asia/Makassar                           </option>
                                                    <option value="Asia/Manila" >
                             UTC/GMT -04:00 - Asia/Manila                           </option>
                                                    <option value="Asia/Muscat" >
                             UTC/GMT -04:00 - Asia/Muscat                           </option>
                                                    <option value="Asia/Nicosia" >
                             UTC/GMT -04:00 - Asia/Nicosia                           </option>
                                                    <option value="Asia/Novokuznetsk" >
                             UTC/GMT -04:00 - Asia/Novokuznetsk                           </option>
                                                    <option value="Asia/Novosibirsk" >
                             UTC/GMT -04:00 - Asia/Novosibirsk                           </option>
                                                    <option value="Asia/Omsk" >
                             UTC/GMT -04:00 - Asia/Omsk                           </option>
                                                    <option value="Asia/Oral" >
                             UTC/GMT -04:00 - Asia/Oral                           </option>
                                                    <option value="Asia/Phnom_Penh" >
                             UTC/GMT -04:00 - Asia/Phnom_Penh                           </option>
                                                    <option value="Asia/Pontianak" >
                             UTC/GMT -04:00 - Asia/Pontianak                           </option>
                                                    <option value="Asia/Pyongyang" >
                             UTC/GMT -04:00 - Asia/Pyongyang                           </option>
                                                    <option value="Asia/Qatar" >
                             UTC/GMT -04:00 - Asia/Qatar                           </option>
                                                    <option value="Asia/Qostanay" >
                             UTC/GMT -04:00 - Asia/Qostanay                           </option>
                                                    <option value="Asia/Qyzylorda" >
                             UTC/GMT -04:00 - Asia/Qyzylorda                           </option>
                                                    <option value="Asia/Riyadh" >
                             UTC/GMT -04:00 - Asia/Riyadh                           </option>
                                                    <option value="Asia/Sakhalin" >
                             UTC/GMT -04:00 - Asia/Sakhalin                           </option>
                                                    <option value="Asia/Samarkand" >
                             UTC/GMT -04:00 - Asia/Samarkand                           </option>
                                                    <option value="Asia/Seoul" >
                             UTC/GMT -04:00 - Asia/Seoul                           </option>
                                                    <option value="Asia/Shanghai" >
                             UTC/GMT -04:00 - Asia/Shanghai                           </option>
                                                    <option value="Asia/Singapore" >
                             UTC/GMT -04:00 - Asia/Singapore                           </option>
                                                    <option value="Asia/Srednekolymsk" >
                             UTC/GMT -04:00 - Asia/Srednekolymsk                           </option>
                                                    <option value="Asia/Taipei" >
                             UTC/GMT -04:00 - Asia/Taipei                           </option>
                                                    <option value="Asia/Tashkent" >
                             UTC/GMT -04:00 - Asia/Tashkent                           </option>
                                                    <option value="Asia/Tbilisi" >
                             UTC/GMT -04:00 - Asia/Tbilisi                           </option>
                                                    <option value="Asia/Tehran" >
                             UTC/GMT -04:00 - Asia/Tehran                           </option>
                                                    <option value="Asia/Thimphu" >
                             UTC/GMT -04:00 - Asia/Thimphu                           </option>
                                                    <option value="Asia/Tokyo" >
                             UTC/GMT -04:00 - Asia/Tokyo                           </option>
                                                    <option value="Asia/Tomsk" >
                             UTC/GMT -04:00 - Asia/Tomsk                           </option>
                                                    <option value="Asia/Ulaanbaatar" >
                             UTC/GMT -04:00 - Asia/Ulaanbaatar                           </option>
                                                    <option value="Asia/Urumqi" >
                             UTC/GMT -04:00 - Asia/Urumqi                           </option>
                                                    <option value="Asia/Ust-Nera" >
                             UTC/GMT -04:00 - Asia/Ust-Nera                           </option>
                                                    <option value="Asia/Vientiane" >
                             UTC/GMT -04:00 - Asia/Vientiane                           </option>
                                                    <option value="Asia/Vladivostok" >
                             UTC/GMT -04:00 - Asia/Vladivostok                           </option>
                                                    <option value="Asia/Yakutsk" >
                             UTC/GMT -04:00 - Asia/Yakutsk                           </option>
                                                    <option value="Asia/Yangon" >
                             UTC/GMT -04:00 - Asia/Yangon                           </option>
                                                    <option value="Asia/Yekaterinburg" >
                             UTC/GMT -04:00 - Asia/Yekaterinburg                           </option>
                                                    <option value="Asia/Yerevan" >
                             UTC/GMT -04:00 - Asia/Yerevan                           </option>
                                                    <option value="Atlantic/Azores" >
                             UTC/GMT -04:00 - Atlantic/Azores                           </option>
                                                    <option value="Atlantic/Bermuda" >
                             UTC/GMT -04:00 - Atlantic/Bermuda                           </option>
                                                    <option value="Atlantic/Canary" >
                             UTC/GMT -04:00 - Atlantic/Canary                           </option>
                                                    <option value="Atlantic/Cape_Verde" >
                             UTC/GMT -04:00 - Atlantic/Cape_Verde                           </option>
                                                    <option value="Atlantic/Faroe" >
                             UTC/GMT -04:00 - Atlantic/Faroe                           </option>
                                                    <option value="Atlantic/Madeira" >
                             UTC/GMT -04:00 - Atlantic/Madeira                           </option>
                                                    <option value="Atlantic/Reykjavik" >
                             UTC/GMT -04:00 - Atlantic/Reykjavik                           </option>
                                                    <option value="Atlantic/South_Georgia" >
                             UTC/GMT -04:00 - Atlantic/South_Georgia                           </option>
                                                    <option value="Atlantic/St_Helena" >
                             UTC/GMT -04:00 - Atlantic/St_Helena                           </option>
                                                    <option value="Atlantic/Stanley" >
                             UTC/GMT -04:00 - Atlantic/Stanley                           </option>
                                                    <option value="Australia/Adelaide" >
                             UTC/GMT -04:00 - Australia/Adelaide                           </option>
                                                    <option value="Australia/Brisbane" >
                             UTC/GMT -04:00 - Australia/Brisbane                           </option>
                                                    <option value="Australia/Broken_Hill" >
                             UTC/GMT -04:00 - Australia/Broken_Hill                           </option>
                                                    <option value="Australia/Currie" >
                             UTC/GMT -04:00 - Australia/Currie                           </option>
                                                    <option value="Australia/Darwin" >
                             UTC/GMT -04:00 - Australia/Darwin                           </option>
                                                    <option value="Australia/Eucla" >
                             UTC/GMT -04:00 - Australia/Eucla                           </option>
                                                    <option value="Australia/Hobart" >
                             UTC/GMT -04:00 - Australia/Hobart                           </option>
                                                    <option value="Australia/Lindeman" >
                             UTC/GMT -04:00 - Australia/Lindeman                           </option>
                                                    <option value="Australia/Lord_Howe" >
                             UTC/GMT -04:00 - Australia/Lord_Howe                           </option>
                                                    <option value="Australia/Melbourne" >
                             UTC/GMT -04:00 - Australia/Melbourne                           </option>
                                                    <option value="Australia/Perth" >
                             UTC/GMT -04:00 - Australia/Perth                           </option>
                                                    <option value="Australia/Sydney" >
                             UTC/GMT -04:00 - Australia/Sydney                           </option>
                                                    <option value="Europe/Amsterdam" >
                             UTC/GMT -04:00 - Europe/Amsterdam                           </option>
                                                    <option value="Europe/Andorra" >
                             UTC/GMT -04:00 - Europe/Andorra                           </option>
                                                    <option value="Europe/Astrakhan" >
                             UTC/GMT -04:00 - Europe/Astrakhan                           </option>
                                                    <option value="Europe/Athens" >
                             UTC/GMT -04:00 - Europe/Athens                           </option>
                                                    <option value="Europe/Belgrade" >
                             UTC/GMT -04:00 - Europe/Belgrade                           </option>
                                                    <option value="Europe/Berlin" >
                             UTC/GMT -04:00 - Europe/Berlin                           </option>
                                                    <option value="Europe/Bratislava" >
                             UTC/GMT -04:00 - Europe/Bratislava                           </option>
                                                    <option value="Europe/Brussels" >
                             UTC/GMT -04:00 - Europe/Brussels                           </option>
                                                    <option value="Europe/Bucharest" >
                             UTC/GMT -04:00 - Europe/Bucharest                           </option>
                                                    <option value="Europe/Budapest" >
                             UTC/GMT -04:00 - Europe/Budapest                           </option>
                                                    <option value="Europe/Busingen" >
                             UTC/GMT -04:00 - Europe/Busingen                           </option>
                                                    <option value="Europe/Chisinau" >
                             UTC/GMT -04:00 - Europe/Chisinau                           </option>
                                                    <option value="Europe/Copenhagen" >
                             UTC/GMT -04:00 - Europe/Copenhagen                           </option>
                                                    <option value="Europe/Dublin" >
                             UTC/GMT -04:00 - Europe/Dublin                           </option>
                                                    <option value="Europe/Gibraltar" >
                             UTC/GMT -04:00 - Europe/Gibraltar                           </option>
                                                    <option value="Europe/Guernsey" >
                             UTC/GMT -04:00 - Europe/Guernsey                           </option>
                                                    <option value="Europe/Helsinki" >
                             UTC/GMT -04:00 - Europe/Helsinki                           </option>
                                                    <option value="Europe/Isle_of_Man" >
                             UTC/GMT -04:00 - Europe/Isle_of_Man                           </option>
                                                    <option value="Europe/Istanbul" >
                             UTC/GMT -04:00 - Europe/Istanbul                           </option>
                                                    <option value="Europe/Jersey" >
                             UTC/GMT -04:00 - Europe/Jersey                           </option>
                                                    <option value="Europe/Kaliningrad" >
                             UTC/GMT -04:00 - Europe/Kaliningrad                           </option>
                                                    <option value="Europe/Kiev" >
                             UTC/GMT -04:00 - Europe/Kiev                           </option>
                                                    <option value="Europe/Kirov" >
                             UTC/GMT -04:00 - Europe/Kirov                           </option>
                                                    <option value="Europe/Lisbon" >
                             UTC/GMT -04:00 - Europe/Lisbon                           </option>
                                                    <option value="Europe/Ljubljana" >
                             UTC/GMT -04:00 - Europe/Ljubljana                           </option>
                                                    <option value="Europe/London" >
                             UTC/GMT -04:00 - Europe/London                           </option>
                                                    <option value="Europe/Luxembourg" >
                             UTC/GMT -04:00 - Europe/Luxembourg                           </option>
                                                    <option value="Europe/Madrid" >
                             UTC/GMT -04:00 - Europe/Madrid                           </option>
                                                    <option value="Europe/Malta" >
                             UTC/GMT -04:00 - Europe/Malta                           </option>
                                                    <option value="Europe/Mariehamn" >
                             UTC/GMT -04:00 - Europe/Mariehamn                           </option>
                                                    <option value="Europe/Minsk" >
                             UTC/GMT -04:00 - Europe/Minsk                           </option>
                                                    <option value="Europe/Monaco" >
                             UTC/GMT -04:00 - Europe/Monaco                           </option>
                                                    <option value="Europe/Moscow" >
                             UTC/GMT -04:00 - Europe/Moscow                           </option>
                                                    <option value="Europe/Oslo" >
                             UTC/GMT -04:00 - Europe/Oslo                           </option>
                                                    <option value="Europe/Paris" >
                             UTC/GMT -04:00 - Europe/Paris                           </option>
                                                    <option value="Europe/Podgorica" >
                             UTC/GMT -04:00 - Europe/Podgorica                           </option>
                                                    <option value="Europe/Prague" >
                             UTC/GMT -04:00 - Europe/Prague                           </option>
                                                    <option value="Europe/Riga" >
                             UTC/GMT -04:00 - Europe/Riga                           </option>
                                                    <option value="Europe/Rome" >
                             UTC/GMT -04:00 - Europe/Rome                           </option>
                                                    <option value="Europe/Samara" >
                             UTC/GMT -04:00 - Europe/Samara                           </option>
                                                    <option value="Europe/San_Marino" >
                             UTC/GMT -04:00 - Europe/San_Marino                           </option>
                                                    <option value="Europe/Sarajevo" >
                             UTC/GMT -04:00 - Europe/Sarajevo                           </option>
                                                    <option value="Europe/Saratov" >
                             UTC/GMT -04:00 - Europe/Saratov                           </option>
                                                    <option value="Europe/Simferopol" >
                             UTC/GMT -04:00 - Europe/Simferopol                           </option>
                                                    <option value="Europe/Skopje" >
                             UTC/GMT -04:00 - Europe/Skopje                           </option>
                                                    <option value="Europe/Sofia" >
                             UTC/GMT -04:00 - Europe/Sofia                           </option>
                                                    <option value="Europe/Stockholm" >
                             UTC/GMT -04:00 - Europe/Stockholm                           </option>
                                                    <option value="Europe/Tallinn" >
                             UTC/GMT -04:00 - Europe/Tallinn                           </option>
                                                    <option value="Europe/Tirane" >
                             UTC/GMT -04:00 - Europe/Tirane                           </option>
                                                    <option value="Europe/Ulyanovsk" >
                             UTC/GMT -04:00 - Europe/Ulyanovsk                           </option>
                                                    <option value="Europe/Uzhgorod" >
                             UTC/GMT -04:00 - Europe/Uzhgorod                           </option>
                                                    <option value="Europe/Vaduz" >
                             UTC/GMT -04:00 - Europe/Vaduz                           </option>
                                                    <option value="Europe/Vatican" >
                             UTC/GMT -04:00 - Europe/Vatican                           </option>
                                                    <option value="Europe/Vienna" >
                             UTC/GMT -04:00 - Europe/Vienna                           </option>
                                                    <option value="Europe/Vilnius" >
                             UTC/GMT -04:00 - Europe/Vilnius                           </option>
                                                    <option value="Europe/Volgograd" >
                             UTC/GMT -04:00 - Europe/Volgograd                           </option>
                                                    <option value="Europe/Warsaw" >
                             UTC/GMT -04:00 - Europe/Warsaw                           </option>
                                                    <option value="Europe/Zagreb" >
                             UTC/GMT -04:00 - Europe/Zagreb                           </option>
                                                    <option value="Europe/Zaporozhye" >
                             UTC/GMT -04:00 - Europe/Zaporozhye                           </option>
                                                    <option value="Europe/Zurich" >
                             UTC/GMT -04:00 - Europe/Zurich                           </option>
                                                    <option value="Indian/Antananarivo" >
                             UTC/GMT -04:00 - Indian/Antananarivo                           </option>
                                                    <option value="Indian/Chagos" >
                             UTC/GMT -04:00 - Indian/Chagos                           </option>
                                                    <option value="Indian/Christmas" >
                             UTC/GMT -04:00 - Indian/Christmas                           </option>
                                                    <option value="Indian/Cocos" >
                             UTC/GMT -04:00 - Indian/Cocos                           </option>
                                                    <option value="Indian/Comoro" >
                             UTC/GMT -04:00 - Indian/Comoro                           </option>
                                                    <option value="Indian/Kerguelen" >
                             UTC/GMT -04:00 - Indian/Kerguelen                           </option>
                                                    <option value="Indian/Mahe" >
                             UTC/GMT -04:00 - Indian/Mahe                           </option>
                                                    <option value="Indian/Maldives" >
                             UTC/GMT -04:00 - Indian/Maldives                           </option>
                                                    <option value="Indian/Mauritius" >
                             UTC/GMT -04:00 - Indian/Mauritius                           </option>
                                                    <option value="Indian/Mayotte" >
                             UTC/GMT -04:00 - Indian/Mayotte                           </option>
                                                    <option value="Indian/Reunion" >
                             UTC/GMT -04:00 - Indian/Reunion                           </option>
                                                    <option value="Pacific/Apia" >
                             UTC/GMT -04:00 - Pacific/Apia                           </option>
                                                    <option value="Pacific/Auckland" >
                             UTC/GMT -04:00 - Pacific/Auckland                           </option>
                                                    <option value="Pacific/Bougainville" >
                             UTC/GMT -04:00 - Pacific/Bougainville                           </option>
                                                    <option value="Pacific/Chatham" >
                             UTC/GMT -04:00 - Pacific/Chatham                           </option>
                                                    <option value="Pacific/Chuuk" >
                             UTC/GMT -04:00 - Pacific/Chuuk                           </option>
                                                    <option value="Pacific/Easter" >
                             UTC/GMT -04:00 - Pacific/Easter                           </option>
                                                    <option value="Pacific/Efate" >
                             UTC/GMT -04:00 - Pacific/Efate                           </option>
                                                    <option value="Pacific/Enderbury" >
                             UTC/GMT -04:00 - Pacific/Enderbury                           </option>
                                                    <option value="Pacific/Fakaofo" >
                             UTC/GMT -04:00 - Pacific/Fakaofo                           </option>
                                                    <option value="Pacific/Fiji" >
                             UTC/GMT -04:00 - Pacific/Fiji                           </option>
                                                    <option value="Pacific/Funafuti" >
                             UTC/GMT -04:00 - Pacific/Funafuti                           </option>
                                                    <option value="Pacific/Galapagos" >
                             UTC/GMT -04:00 - Pacific/Galapagos                           </option>
                                                    <option value="Pacific/Gambier" >
                             UTC/GMT -04:00 - Pacific/Gambier                           </option>
                                                    <option value="Pacific/Guadalcanal" >
                             UTC/GMT -04:00 - Pacific/Guadalcanal                           </option>
                                                    <option value="Pacific/Guam" >
                             UTC/GMT -04:00 - Pacific/Guam                           </option>
                                                    <option value="Pacific/Honolulu" >
                             UTC/GMT -04:00 - Pacific/Honolulu                           </option>
                                                    <option value="Pacific/Kiritimati" >
                             UTC/GMT -04:00 - Pacific/Kiritimati                           </option>
                                                    <option value="Pacific/Kosrae" >
                             UTC/GMT -04:00 - Pacific/Kosrae                           </option>
                                                    <option value="Pacific/Kwajalein" >
                             UTC/GMT -04:00 - Pacific/Kwajalein                           </option>
                                                    <option value="Pacific/Majuro" >
                             UTC/GMT -04:00 - Pacific/Majuro                           </option>
                                                    <option value="Pacific/Marquesas" >
                             UTC/GMT -04:00 - Pacific/Marquesas                           </option>
                                                    <option value="Pacific/Midway" >
                             UTC/GMT -04:00 - Pacific/Midway                           </option>
                                                    <option value="Pacific/Nauru" >
                             UTC/GMT -04:00 - Pacific/Nauru                           </option>
                                                    <option value="Pacific/Niue" >
                             UTC/GMT -04:00 - Pacific/Niue                           </option>
                                                    <option value="Pacific/Norfolk" >
                             UTC/GMT -04:00 - Pacific/Norfolk                           </option>
                                                    <option value="Pacific/Noumea" >
                             UTC/GMT -04:00 - Pacific/Noumea                           </option>
                                                    <option value="Pacific/Pago_Pago" >
                             UTC/GMT -04:00 - Pacific/Pago_Pago                           </option>
                                                    <option value="Pacific/Palau" >
                             UTC/GMT -04:00 - Pacific/Palau                           </option>
                                                    <option value="Pacific/Pitcairn" >
                             UTC/GMT -04:00 - Pacific/Pitcairn                           </option>
                                                    <option value="Pacific/Pohnpei" >
                             UTC/GMT -04:00 - Pacific/Pohnpei                           </option>
                                                    <option value="Pacific/Port_Moresby" >
                             UTC/GMT -04:00 - Pacific/Port_Moresby                           </option>
                                                    <option value="Pacific/Rarotonga" >
                             UTC/GMT -04:00 - Pacific/Rarotonga                           </option>
                                                    <option value="Pacific/Saipan" >
                             UTC/GMT -04:00 - Pacific/Saipan                           </option>
                                                    <option value="Pacific/Tahiti" >
                             UTC/GMT -04:00 - Pacific/Tahiti                           </option>
                                                    <option value="Pacific/Tarawa" >
                             UTC/GMT -04:00 - Pacific/Tarawa                           </option>
                                                    <option value="Pacific/Tongatapu" >
                             UTC/GMT -04:00 - Pacific/Tongatapu                           </option>
                                                    <option value="Pacific/Wake" >
                             UTC/GMT -04:00 - Pacific/Wake                           </option>
                                                    <option value="Pacific/Wallis" >
                             UTC/GMT -04:00 - Pacific/Wallis                           </option>
                                                    <option value="UTC" >
                             UTC/GMT -04:00 - UTC                           </option>
</select></div>
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
                <Button label="Cancel" text severity="secondary" @click="visible = false" autofocus />
                <Button label="Save" outlined severity="secondary" @click="funcionActualizar" autofocus />
            </template>
        </Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visiblecrear" :position="position" modal header="Crear Paises" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <template #header>
                <div class="inline-flex align-items-center justify-content-center gap-2">
                    <span class="font-bold white-space-nowrap">Modal Crear</span>
                </div>
            </template>
  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Paises</legend>
     <form id="formularioActualizarPaises" action="" method="">
         <div  style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
<div class="form-group col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-12" >
<label for="nombreAgregarDatos">NOMBRE</label>
<input type="input" v-model="datoscamposPaises.nombre" name="nombre"  class="form-control mayusc" id="nombreAgregarDatos" v-mayuscula placeholder="nombre" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="monedaAgregarDatos">MONEDA</label>
<input type="input" v-model="datoscamposPaises.moneda" name="moneda"  class="form-control mayusc" id="monedaAgregarDatos" v-mayuscula placeholder="moneda" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="simboloAgregarDatos">SIMBOLO</label>
<input type="input" v-model="datoscamposPaises.simbolo" name="simbolo"  class="form-control " id="simboloAgregarDatos"  placeholder="simbolo" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-4 xl:col-span-4" >
<label for="isoAgregarDatos">ISO</label>
<input type="input" v-model="datoscamposPaises.iso" name="iso"  class="form-control " id="isoAgregarDatos"  placeholder="iso" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="prefijoAgregarDatos">PREFIJO</label>
<input type="input" v-model="datoscamposPaises.prefijo" name="prefijo"  class="form-control " id="prefijoAgregarDatos"  placeholder="prefijo" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="digitosAgregarDatos">DIGITOS</label>
<input type="input" v-model="datoscamposPaises.digitos" name="digitos"  class="form-control " id="digitosAgregarDatos"  placeholder="digitos" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="nombre_impAgregarDatos">NOMBRE_IMP</label>
<input type="input" v-model="datoscamposPaises.nombre_imp" name="nombre_imp"  class="form-control mayusc" id="nombre_impAgregarDatos" v-mayuscula placeholder="nombre_imp" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-3 md:col-span-3 lg:col-span-3 xl:col-span-3" >
<label for="c_impAgregarDatos">C_IMP</label>
<input type="input" v-model="datoscamposPaises.c_imp" name="c_imp"  class="form-control " id="c_impAgregarDatos"  placeholder="c_imp" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-6" >
<label for="idiomaAgregarDatos">IDIOMA</label>
<input type="input" v-model="datoscamposPaises.idioma" name="idioma"  class="form-control " id="idiomaAgregarDatos"  placeholder="idioma" maxlength="250">
</div>
<div class="form-group col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-6" >
<label for="z_horariaAgregarDatos">Z_HORARIA</label>
<select class="form-control " v-model="datoscamposPaises.z_horaria" id="z_horariaAgregarDatos" name="z_horaria" >
<option value="Africa/Abidjan" >
                             UTC/GMT -04:00 - Africa/Abidjan                           </option>
                                                    <option value="Africa/Accra" >
                             UTC/GMT -04:00 - Africa/Accra                           </option>
                                                    <option value="Africa/Addis_Ababa" >
                             UTC/GMT -04:00 - Africa/Addis_Ababa                           </option>
                                                    <option value="Africa/Algiers" >
                             UTC/GMT -04:00 - Africa/Algiers                           </option>
                                                    <option value="Africa/Asmara" >
                             UTC/GMT -04:00 - Africa/Asmara                           </option>
                                                    <option value="Africa/Bamako" >
                             UTC/GMT -04:00 - Africa/Bamako                           </option>
                                                    <option value="Africa/Bangui" >
                             UTC/GMT -04:00 - Africa/Bangui                           </option>
                                                    <option value="Africa/Banjul" >
                             UTC/GMT -04:00 - Africa/Banjul                           </option>
                                                    <option value="Africa/Bissau" >
                             UTC/GMT -04:00 - Africa/Bissau                           </option>
                                                    <option value="Africa/Blantyre" >
                             UTC/GMT -04:00 - Africa/Blantyre                           </option>
                                                    <option value="Africa/Brazzaville" >
                             UTC/GMT -04:00 - Africa/Brazzaville                           </option>
                                                    <option value="Africa/Bujumbura" >
                             UTC/GMT -04:00 - Africa/Bujumbura                           </option>
                                                    <option value="Africa/Cairo" >
                             UTC/GMT -04:00 - Africa/Cairo                           </option>
                                                    <option value="Africa/Casablanca" >
                             UTC/GMT -04:00 - Africa/Casablanca                           </option>
                                                    <option value="Africa/Ceuta" >
                             UTC/GMT -04:00 - Africa/Ceuta                           </option>
                                                    <option value="Africa/Conakry" >
                             UTC/GMT -04:00 - Africa/Conakry                           </option>
                                                    <option value="Africa/Dakar" >
                             UTC/GMT -04:00 - Africa/Dakar                           </option>
                                                    <option value="Africa/Dar_es_Salaam" >
                             UTC/GMT -04:00 - Africa/Dar_es_Salaam                           </option>
                                                    <option value="Africa/Djibouti" >
                             UTC/GMT -04:00 - Africa/Djibouti                           </option>
                                                    <option value="Africa/Douala" >
                             UTC/GMT -04:00 - Africa/Douala                           </option>
                                                    <option value="Africa/El_Aaiun" >
                             UTC/GMT -04:00 - Africa/El_Aaiun                           </option>
                                                    <option value="Africa/Freetown" >
                             UTC/GMT -04:00 - Africa/Freetown                           </option>
                                                    <option value="Africa/Gaborone" >
                             UTC/GMT -04:00 - Africa/Gaborone                           </option>
                                                    <option value="Africa/Harare" >
                             UTC/GMT -04:00 - Africa/Harare                           </option>
                                                    <option value="Africa/Johannesburg" >
                             UTC/GMT -04:00 - Africa/Johannesburg                           </option>
                                                    <option value="Africa/Juba" >
                             UTC/GMT -04:00 - Africa/Juba                           </option>
                                                    <option value="Africa/Kampala" >
                             UTC/GMT -04:00 - Africa/Kampala                           </option>
                                                    <option value="Africa/Khartoum" >
                             UTC/GMT -04:00 - Africa/Khartoum                           </option>
                                                    <option value="Africa/Kigali" >
                             UTC/GMT -04:00 - Africa/Kigali                           </option>
                                                    <option value="Africa/Kinshasa" >
                             UTC/GMT -04:00 - Africa/Kinshasa                           </option>
                                                    <option value="Africa/Lagos" >
                             UTC/GMT -04:00 - Africa/Lagos                           </option>
                                                    <option value="Africa/Libreville" >
                             UTC/GMT -04:00 - Africa/Libreville                           </option>
                                                    <option value="Africa/Lome" >
                             UTC/GMT -04:00 - Africa/Lome                           </option>
                                                    <option value="Africa/Luanda" >
                             UTC/GMT -04:00 - Africa/Luanda                           </option>
                                                    <option value="Africa/Lubumbashi" >
                             UTC/GMT -04:00 - Africa/Lubumbashi                           </option>
                                                    <option value="Africa/Lusaka" >
                             UTC/GMT -04:00 - Africa/Lusaka                           </option>
                                                    <option value="Africa/Malabo" >
                             UTC/GMT -04:00 - Africa/Malabo                           </option>
                                                    <option value="Africa/Maputo" >
                             UTC/GMT -04:00 - Africa/Maputo                           </option>
                                                    <option value="Africa/Maseru" >
                             UTC/GMT -04:00 - Africa/Maseru                           </option>
                                                    <option value="Africa/Mbabane" >
                             UTC/GMT -04:00 - Africa/Mbabane                           </option>
                                                    <option value="Africa/Mogadishu" >
                             UTC/GMT -04:00 - Africa/Mogadishu                           </option>
                                                    <option value="Africa/Monrovia" >
                             UTC/GMT -04:00 - Africa/Monrovia                           </option>
                                                    <option value="Africa/Nairobi" >
                             UTC/GMT -04:00 - Africa/Nairobi                           </option>
                                                    <option value="Africa/Ndjamena" >
                             UTC/GMT -04:00 - Africa/Ndjamena                           </option>
                                                    <option value="Africa/Niamey" >
                             UTC/GMT -04:00 - Africa/Niamey                           </option>
                                                    <option value="Africa/Nouakchott" >
                             UTC/GMT -04:00 - Africa/Nouakchott                           </option>
                                                    <option value="Africa/Ouagadougou" >
                             UTC/GMT -04:00 - Africa/Ouagadougou                           </option>
                                                    <option value="Africa/Porto-Novo" >
                             UTC/GMT -04:00 - Africa/Porto-Novo                           </option>
                                                    <option value="Africa/Sao_Tome" >
                             UTC/GMT -04:00 - Africa/Sao_Tome                           </option>
                                                    <option value="Africa/Tripoli" >
                             UTC/GMT -04:00 - Africa/Tripoli                           </option>
                                                    <option value="Africa/Tunis" >
                             UTC/GMT -04:00 - Africa/Tunis                           </option>
                                                    <option value="Africa/Windhoek" >
                             UTC/GMT -04:00 - Africa/Windhoek                           </option>
                                                    <option value="America/Adak" >
                             UTC/GMT -04:00 - America/Adak                           </option>
                                                    <option value="America/Anchorage" >
                             UTC/GMT -04:00 - America/Anchorage                           </option>
                                                    <option value="America/Anguilla" >
                             UTC/GMT -04:00 - America/Anguilla                           </option>
                                                    <option value="America/Antigua" >
                             UTC/GMT -04:00 - America/Antigua                           </option>
                                                    <option value="America/Araguaina" >
                             UTC/GMT -04:00 - America/Araguaina                           </option>
                                                    <option value="America/Argentina/Buenos_Aires" >
                             UTC/GMT -04:00 - America/Argentina/Buenos_Aires                           </option>
                                                    <option value="America/Argentina/Catamarca" >
                             UTC/GMT -04:00 - America/Argentina/Catamarca                           </option>
                                                    <option value="America/Argentina/Cordoba" >
                             UTC/GMT -04:00 - America/Argentina/Cordoba                           </option>
                                                    <option value="America/Argentina/Jujuy" >
                             UTC/GMT -04:00 - America/Argentina/Jujuy                           </option>
                                                    <option value="America/Argentina/La_Rioja" >
                             UTC/GMT -04:00 - America/Argentina/La_Rioja                           </option>
                                                    <option value="America/Argentina/Mendoza" >
                             UTC/GMT -04:00 - America/Argentina/Mendoza                           </option>
                                                    <option value="America/Argentina/Rio_Gallegos" >
                             UTC/GMT -04:00 - America/Argentina/Rio_Gallegos                           </option>
                                                    <option value="America/Argentina/Salta" >
                             UTC/GMT -04:00 - America/Argentina/Salta                           </option>
                                                    <option value="America/Argentina/San_Juan" >
                             UTC/GMT -04:00 - America/Argentina/San_Juan                           </option>
                                                    <option value="America/Argentina/San_Luis" >
                             UTC/GMT -04:00 - America/Argentina/San_Luis                           </option>
                                                    <option value="America/Argentina/Tucuman" >
                             UTC/GMT -04:00 - America/Argentina/Tucuman                           </option>
                                                    <option value="America/Argentina/Ushuaia" >
                             UTC/GMT -04:00 - America/Argentina/Ushuaia                           </option>
                                                    <option value="America/Aruba" >
                             UTC/GMT -04:00 - America/Aruba                           </option>
                                                    <option value="America/Asuncion" >
                             UTC/GMT -04:00 - America/Asuncion                           </option>
                                                    <option value="America/Atikokan" >
                             UTC/GMT -04:00 - America/Atikokan                           </option>
                                                    <option value="America/Bahia" >
                             UTC/GMT -04:00 - America/Bahia                           </option>
                                                    <option value="America/Bahia_Banderas" >
                             UTC/GMT -04:00 - America/Bahia_Banderas                           </option>
                                                    <option value="America/Barbados" >
                             UTC/GMT -04:00 - America/Barbados                           </option>
                                                    <option value="America/Belem" >
                             UTC/GMT -04:00 - America/Belem                           </option>
                                                    <option value="America/Belize" >
                             UTC/GMT -04:00 - America/Belize                           </option>
                                                    <option value="America/Blanc-Sablon" >
                             UTC/GMT -04:00 - America/Blanc-Sablon                           </option>
                                                    <option value="America/Boa_Vista" >
                             UTC/GMT -04:00 - America/Boa_Vista                           </option>
                                                    <option value="America/Bogota" >
                             UTC/GMT -04:00 - America/Bogota                           </option>
                                                    <option value="America/Boise" >
                             UTC/GMT -04:00 - America/Boise                           </option>
                                                    <option value="America/Cambridge_Bay" >
                             UTC/GMT -04:00 - America/Cambridge_Bay                           </option>
                                                    <option value="America/Campo_Grande" >
                             UTC/GMT -04:00 - America/Campo_Grande                           </option>
                                                    <option value="America/Cancun" >
                             UTC/GMT -04:00 - America/Cancun                           </option>
                                                    <option value="America/Caracas">
                             UTC/GMT -04:00 - America/Caracas                           </option>
                                                    <option value="America/Cayenne" >
                             UTC/GMT -04:00 - America/Cayenne                           </option>
                                                    <option value="America/Cayman" >
                             UTC/GMT -04:00 - America/Cayman                           </option>
                                                    <option value="America/Chicago" >
                             UTC/GMT -04:00 - America/Chicago                           </option>
                                                    <option value="America/Chihuahua" >
                             UTC/GMT -04:00 - America/Chihuahua                           </option>
                                                    <option value="America/Costa_Rica" >
                             UTC/GMT -04:00 - America/Costa_Rica                           </option>
                                                    <option value="America/Creston" >
                             UTC/GMT -04:00 - America/Creston                           </option>
                                                    <option value="America/Cuiaba" >
                             UTC/GMT -04:00 - America/Cuiaba                           </option>
                                                    <option value="America/Curacao" >
                             UTC/GMT -04:00 - America/Curacao                           </option>
                                                    <option value="America/Danmarkshavn" >
                             UTC/GMT -04:00 - America/Danmarkshavn                           </option>
                                                    <option value="America/Dawson" >
                             UTC/GMT -04:00 - America/Dawson                           </option>
                                                    <option value="America/Dawson_Creek" >
                             UTC/GMT -04:00 - America/Dawson_Creek                           </option>
                                                    <option value="America/Denver" >
                             UTC/GMT -04:00 - America/Denver                           </option>
                                                    <option value="America/Detroit" >
                             UTC/GMT -04:00 - America/Detroit                           </option>
                                                    <option value="America/Dominica" >
                             UTC/GMT -04:00 - America/Dominica                           </option>
                                                    <option value="America/Edmonton" >
                             UTC/GMT -04:00 - America/Edmonton                           </option>
                                                    <option value="America/Eirunepe" >
                             UTC/GMT -04:00 - America/Eirunepe                           </option>
                                                    <option value="America/El_Salvador" >
                             UTC/GMT -04:00 - America/El_Salvador                           </option>
                                                    <option value="America/Fort_Nelson" >
                             UTC/GMT -04:00 - America/Fort_Nelson                           </option>
                                                    <option value="America/Fortaleza" >
                             UTC/GMT -04:00 - America/Fortaleza                           </option>
                                                    <option value="America/Glace_Bay" >
                             UTC/GMT -04:00 - America/Glace_Bay                           </option>
                                                    <option value="America/Godthab" >
                             UTC/GMT -04:00 - America/Godthab                           </option>
                                                    <option value="America/Goose_Bay" >
                             UTC/GMT -04:00 - America/Goose_Bay                           </option>
                                                    <option value="America/Grand_Turk" >
                             UTC/GMT -04:00 - America/Grand_Turk                           </option>
                                                    <option value="America/Grenada" >
                             UTC/GMT -04:00 - America/Grenada                           </option>
                                                    <option value="America/Guadeloupe" >
                             UTC/GMT -04:00 - America/Guadeloupe                           </option>
                                                    <option value="America/Guatemala" >
                             UTC/GMT -04:00 - America/Guatemala                           </option>
                                                    <option value="America/Guayaquil" >
                             UTC/GMT -04:00 - America/Guayaquil                           </option>
                                                    <option value="America/Guyana" >
                             UTC/GMT -04:00 - America/Guyana                           </option>
                                                    <option value="America/Halifax" >
                             UTC/GMT -04:00 - America/Halifax                           </option>
                                                    <option value="America/Havana" >
                             UTC/GMT -04:00 - America/Havana                           </option>
                                                    <option value="America/Hermosillo" >
                             UTC/GMT -04:00 - America/Hermosillo                           </option>
                                                    <option value="America/Indiana/Indianapolis" >
                             UTC/GMT -04:00 - America/Indiana/Indianapolis                           </option>
                                                    <option value="America/Indiana/Knox" >
                             UTC/GMT -04:00 - America/Indiana/Knox                           </option>
                                                    <option value="America/Indiana/Marengo" >
                             UTC/GMT -04:00 - America/Indiana/Marengo                           </option>
                                                    <option value="America/Indiana/Petersburg" >
                             UTC/GMT -04:00 - America/Indiana/Petersburg                           </option>
                                                    <option value="America/Indiana/Tell_City" >
                             UTC/GMT -04:00 - America/Indiana/Tell_City                           </option>
                                                    <option value="America/Indiana/Vevay" >
                             UTC/GMT -04:00 - America/Indiana/Vevay                           </option>
                                                    <option value="America/Indiana/Vincennes" >
                             UTC/GMT -04:00 - America/Indiana/Vincennes                           </option>
                                                    <option value="America/Indiana/Winamac" >
                             UTC/GMT -04:00 - America/Indiana/Winamac                           </option>
                                                    <option value="America/Inuvik" >
                             UTC/GMT -04:00 - America/Inuvik                           </option>
                                                    <option value="America/Iqaluit" >
                             UTC/GMT -04:00 - America/Iqaluit                           </option>
                                                    <option value="America/Jamaica" >
                             UTC/GMT -04:00 - America/Jamaica                           </option>
                                                    <option value="America/Juneau" >
                             UTC/GMT -04:00 - America/Juneau                           </option>
                                                    <option value="America/Kentucky/Louisville" >
                             UTC/GMT -04:00 - America/Kentucky/Louisville                           </option>
                                                    <option value="America/Kentucky/Monticello" >
                             UTC/GMT -04:00 - America/Kentucky/Monticello                           </option>
                                                    <option value="America/Kralendijk" >
                             UTC/GMT -04:00 - America/Kralendijk                           </option>
                                                    <option value="America/La_Paz" >
                             UTC/GMT -04:00 - America/La_Paz                           </option>
                                                    <option value="America/Lima" >
                             UTC/GMT -04:00 - America/Lima                           </option>
                                                    <option value="America/Los_Angeles" >
                             UTC/GMT -04:00 - America/Los_Angeles                           </option>
                                                    <option value="America/Lower_Princes" >
                             UTC/GMT -04:00 - America/Lower_Princes                           </option>
                                                    <option value="America/Maceio" >
                             UTC/GMT -04:00 - America/Maceio                           </option>
                                                    <option value="America/Managua" >
                             UTC/GMT -04:00 - America/Managua                           </option>
                                                    <option value="America/Manaus" >
                             UTC/GMT -04:00 - America/Manaus                           </option>
                                                    <option value="America/Marigot" >
                             UTC/GMT -04:00 - America/Marigot                           </option>
                                                    <option value="America/Martinique" >
                             UTC/GMT -04:00 - America/Martinique                           </option>
                                                    <option value="America/Matamoros" >
                             UTC/GMT -04:00 - America/Matamoros                           </option>
                                                    <option value="America/Mazatlan" >
                             UTC/GMT -04:00 - America/Mazatlan                           </option>
                                                    <option value="America/Menominee" >
                             UTC/GMT -04:00 - America/Menominee                           </option>
                                                    <option value="America/Merida" >
                             UTC/GMT -04:00 - America/Merida                           </option>
                                                    <option value="America/Metlakatla" >
                             UTC/GMT -04:00 - America/Metlakatla                           </option>
                                                    <option value="America/Mexico_City" >
                             UTC/GMT -04:00 - America/Mexico_City                           </option>
                                                    <option value="America/Miquelon" >
                             UTC/GMT -04:00 - America/Miquelon                           </option>
                                                    <option value="America/Moncton" >
                             UTC/GMT -04:00 - America/Moncton                           </option>
                                                    <option value="America/Monterrey" >
                             UTC/GMT -04:00 - America/Monterrey                           </option>
                                                    <option value="America/Montevideo" >
                             UTC/GMT -04:00 - America/Montevideo                           </option>
                                                    <option value="America/Montserrat" >
                             UTC/GMT -04:00 - America/Montserrat                           </option>
                                                    <option value="America/Nassau" >
                             UTC/GMT -04:00 - America/Nassau                           </option>
                                                    <option value="America/New_York" >
                             UTC/GMT -04:00 - America/New_York                           </option>
                                                    <option value="America/Nipigon" >
                             UTC/GMT -04:00 - America/Nipigon                           </option>
                                                    <option value="America/Nome" >
                             UTC/GMT -04:00 - America/Nome                           </option>
                                                    <option value="America/Noronha" >
                             UTC/GMT -04:00 - America/Noronha                           </option>
                                                    <option value="America/North_Dakota/Beulah" >
                             UTC/GMT -04:00 - America/North_Dakota/Beulah                           </option>
                                                    <option value="America/North_Dakota/Center" >
                             UTC/GMT -04:00 - America/North_Dakota/Center                           </option>
                                                    <option value="America/North_Dakota/New_Salem" >
                             UTC/GMT -04:00 - America/North_Dakota/New_Salem                           </option>
                                                    <option value="America/Ojinaga" >
                             UTC/GMT -04:00 - America/Ojinaga                           </option>
                                                    <option value="America/Panama" >
                             UTC/GMT -04:00 - America/Panama                           </option>
                                                    <option value="America/Pangnirtung" >
                             UTC/GMT -04:00 - America/Pangnirtung                           </option>
                                                    <option value="America/Paramaribo" >
                             UTC/GMT -04:00 - America/Paramaribo                           </option>
                                                    <option value="America/Phoenix" >
                             UTC/GMT -04:00 - America/Phoenix                           </option>
                                                    <option value="America/Port-au-Prince" >
                             UTC/GMT -04:00 - America/Port-au-Prince                           </option>
                                                    <option value="America/Port_of_Spain" >
                             UTC/GMT -04:00 - America/Port_of_Spain                           </option>
                                                    <option value="America/Porto_Velho" >
                             UTC/GMT -04:00 - America/Porto_Velho                           </option>
                                                    <option value="America/Puerto_Rico" >
                             UTC/GMT -04:00 - America/Puerto_Rico                           </option>
                                                    <option value="America/Punta_Arenas" >
                             UTC/GMT -04:00 - America/Punta_Arenas                           </option>
                                                    <option value="America/Rainy_River" >
                             UTC/GMT -04:00 - America/Rainy_River                           </option>
                                                    <option value="America/Rankin_Inlet" >
                             UTC/GMT -04:00 - America/Rankin_Inlet                           </option>
                                                    <option value="America/Recife" >
                             UTC/GMT -04:00 - America/Recife                           </option>
                                                    <option value="America/Regina" >
                             UTC/GMT -04:00 - America/Regina                           </option>
                                                    <option value="America/Resolute" >
                             UTC/GMT -04:00 - America/Resolute                           </option>
                                                    <option value="America/Rio_Branco" >
                             UTC/GMT -04:00 - America/Rio_Branco                           </option>
                                                    <option value="America/Santarem" >
                             UTC/GMT -04:00 - America/Santarem                           </option>
                                                    <option value="America/Santiago" >
                             UTC/GMT -04:00 - America/Santiago                           </option>
                                                    <option value="America/Santo_Domingo" >
                             UTC/GMT -04:00 - America/Santo_Domingo                           </option>
                                                    <option value="America/Sao_Paulo" >
                             UTC/GMT -04:00 - America/Sao_Paulo                           </option>
                                                    <option value="America/Scoresbysund" >
                             UTC/GMT -04:00 - America/Scoresbysund                           </option>
                                                    <option value="America/Sitka" >
                             UTC/GMT -04:00 - America/Sitka                           </option>
                                                    <option value="America/St_Barthelemy" >
                             UTC/GMT -04:00 - America/St_Barthelemy                           </option>
                                                    <option value="America/St_Johns" >
                             UTC/GMT -04:00 - America/St_Johns                           </option>
                                                    <option value="America/St_Kitts" >
                             UTC/GMT -04:00 - America/St_Kitts                           </option>
                                                    <option value="America/St_Lucia" >
                             UTC/GMT -04:00 - America/St_Lucia                           </option>
                                                    <option value="America/St_Thomas" >
                             UTC/GMT -04:00 - America/St_Thomas                           </option>
                                                    <option value="America/St_Vincent" >
                             UTC/GMT -04:00 - America/St_Vincent                           </option>
                                                    <option value="America/Swift_Current" >
                             UTC/GMT -04:00 - America/Swift_Current                           </option>
                                                    <option value="America/Tegucigalpa" >
                             UTC/GMT -04:00 - America/Tegucigalpa                           </option>
                                                    <option value="America/Thule" >
                             UTC/GMT -04:00 - America/Thule                           </option>
                                                    <option value="America/Thunder_Bay" >
                             UTC/GMT -04:00 - America/Thunder_Bay                           </option>
                                                    <option value="America/Tijuana" >
                             UTC/GMT -04:00 - America/Tijuana                           </option>
                                                    <option value="America/Toronto" >
                             UTC/GMT -04:00 - America/Toronto                           </option>
                                                    <option value="America/Tortola" >
                             UTC/GMT -04:00 - America/Tortola                           </option>
                                                    <option value="America/Vancouver" >
                             UTC/GMT -04:00 - America/Vancouver                           </option>
                                                    <option value="America/Whitehorse" >
                             UTC/GMT -04:00 - America/Whitehorse                           </option>
                                                    <option value="America/Winnipeg" >
                             UTC/GMT -04:00 - America/Winnipeg                           </option>
                                                    <option value="America/Yakutat" >
                             UTC/GMT -04:00 - America/Yakutat                           </option>
                                                    <option value="America/Yellowknife" >
                             UTC/GMT -04:00 - America/Yellowknife                           </option>
                                                    <option value="Antarctica/Casey" >
                             UTC/GMT -04:00 - Antarctica/Casey                           </option>
                                                    <option value="Antarctica/Davis" >
                             UTC/GMT -04:00 - Antarctica/Davis                           </option>
                                                    <option value="Antarctica/DumontDUrville" >
                             UTC/GMT -04:00 - Antarctica/DumontDUrville                           </option>
                                                    <option value="Antarctica/Macquarie" >
                             UTC/GMT -04:00 - Antarctica/Macquarie                           </option>
                                                    <option value="Antarctica/Mawson" >
                             UTC/GMT -04:00 - Antarctica/Mawson                           </option>
                                                    <option value="Antarctica/McMurdo" >
                             UTC/GMT -04:00 - Antarctica/McMurdo                           </option>
                                                    <option value="Antarctica/Palmer" >
                             UTC/GMT -04:00 - Antarctica/Palmer                           </option>
                                                    <option value="Antarctica/Rothera" >
                             UTC/GMT -04:00 - Antarctica/Rothera                           </option>
                                                    <option value="Antarctica/Syowa" >
                             UTC/GMT -04:00 - Antarctica/Syowa                           </option>
                                                    <option value="Antarctica/Troll" >
                             UTC/GMT -04:00 - Antarctica/Troll                           </option>
                                                    <option value="Antarctica/Vostok" >
                             UTC/GMT -04:00 - Antarctica/Vostok                           </option>
                                                    <option value="Arctic/Longyearbyen" >
                             UTC/GMT -04:00 - Arctic/Longyearbyen                           </option>
                                                    <option value="Asia/Aden" >
                             UTC/GMT -04:00 - Asia/Aden                           </option>
                                                    <option value="Asia/Almaty" >
                             UTC/GMT -04:00 - Asia/Almaty                           </option>
                                                    <option value="Asia/Amman" >
                             UTC/GMT -04:00 - Asia/Amman                           </option>
                                                    <option value="Asia/Anadyr" >
                             UTC/GMT -04:00 - Asia/Anadyr                           </option>
                                                    <option value="Asia/Aqtau" >
                             UTC/GMT -04:00 - Asia/Aqtau                           </option>
                                                    <option value="Asia/Aqtobe" >
                             UTC/GMT -04:00 - Asia/Aqtobe                           </option>
                                                    <option value="Asia/Ashgabat" >
                             UTC/GMT -04:00 - Asia/Ashgabat                           </option>
                                                    <option value="Asia/Atyrau" >
                             UTC/GMT -04:00 - Asia/Atyrau                           </option>
                                                    <option value="Asia/Baghdad" >
                             UTC/GMT -04:00 - Asia/Baghdad                           </option>
                                                    <option value="Asia/Bahrain" >
                             UTC/GMT -04:00 - Asia/Bahrain                           </option>
                                                    <option value="Asia/Baku" >
                             UTC/GMT -04:00 - Asia/Baku                           </option>
                                                    <option value="Asia/Bangkok" >
                             UTC/GMT -04:00 - Asia/Bangkok                           </option>
                                                    <option value="Asia/Barnaul" >
                             UTC/GMT -04:00 - Asia/Barnaul                           </option>
                                                    <option value="Asia/Beirut" >
                             UTC/GMT -04:00 - Asia/Beirut                           </option>
                                                    <option value="Asia/Bishkek" >
                             UTC/GMT -04:00 - Asia/Bishkek                           </option>
                                                    <option value="Asia/Brunei" >
                             UTC/GMT -04:00 - Asia/Brunei                           </option>
                                                    <option value="Asia/Chita" >
                             UTC/GMT -04:00 - Asia/Chita                           </option>
                                                    <option value="Asia/Choibalsan" >
                             UTC/GMT -04:00 - Asia/Choibalsan                           </option>
                                                    <option value="Asia/Colombo" >
                             UTC/GMT -04:00 - Asia/Colombo                           </option>
                                                    <option value="Asia/Damascus" >
                             UTC/GMT -04:00 - Asia/Damascus                           </option>
                                                    <option value="Asia/Dhaka" >
                             UTC/GMT -04:00 - Asia/Dhaka                           </option>
                                                    <option value="Asia/Dili" >
                             UTC/GMT -04:00 - Asia/Dili                           </option>
                                                    <option value="Asia/Dubai" >
                             UTC/GMT -04:00 - Asia/Dubai                           </option>
                                                    <option value="Asia/Dushanbe" >
                             UTC/GMT -04:00 - Asia/Dushanbe                           </option>
                                                    <option value="Asia/Famagusta" >
                             UTC/GMT -04:00 - Asia/Famagusta                           </option>
                                                    <option value="Asia/Gaza" >
                             UTC/GMT -04:00 - Asia/Gaza                           </option>
                                                    <option value="Asia/Hebron" >
                             UTC/GMT -04:00 - Asia/Hebron                           </option>
                                                    <option value="Asia/Ho_Chi_Minh" >
                             UTC/GMT -04:00 - Asia/Ho_Chi_Minh                           </option>
                                                    <option value="Asia/Hong_Kong" >
                             UTC/GMT -04:00 - Asia/Hong_Kong                           </option>
                                                    <option value="Asia/Hovd" >
                             UTC/GMT -04:00 - Asia/Hovd                           </option>
                                                    <option value="Asia/Irkutsk" >
                             UTC/GMT -04:00 - Asia/Irkutsk                           </option>
                                                    <option value="Asia/Jakarta" >
                             UTC/GMT -04:00 - Asia/Jakarta                           </option>
                                                    <option value="Asia/Jayapura" >
                             UTC/GMT -04:00 - Asia/Jayapura                           </option>
                                                    <option value="Asia/Jerusalem" >
                             UTC/GMT -04:00 - Asia/Jerusalem                           </option>
                                                    <option value="Asia/Kabul" >
                             UTC/GMT -04:00 - Asia/Kabul                           </option>
                                                    <option value="Asia/Kamchatka" >
                             UTC/GMT -04:00 - Asia/Kamchatka                           </option>
                                                    <option value="Asia/Karachi" >
                             UTC/GMT -04:00 - Asia/Karachi                           </option>
                                                    <option value="Asia/Kathmandu" >
                             UTC/GMT -04:00 - Asia/Kathmandu                           </option>
                                                    <option value="Asia/Khandyga" >
                             UTC/GMT -04:00 - Asia/Khandyga                           </option>
                                                    <option value="Asia/Kolkata" >
                             UTC/GMT -04:00 - Asia/Kolkata                           </option>
                                                    <option value="Asia/Krasnoyarsk" >
                             UTC/GMT -04:00 - Asia/Krasnoyarsk                           </option>
                                                    <option value="Asia/Kuala_Lumpur" >
                             UTC/GMT -04:00 - Asia/Kuala_Lumpur                           </option>
                                                    <option value="Asia/Kuching" >
                             UTC/GMT -04:00 - Asia/Kuching                           </option>
                                                    <option value="Asia/Kuwait" >
                             UTC/GMT -04:00 - Asia/Kuwait                           </option>
                                                    <option value="Asia/Macau" >
                             UTC/GMT -04:00 - Asia/Macau                           </option>
                                                    <option value="Asia/Magadan" >
                             UTC/GMT -04:00 - Asia/Magadan                           </option>
                                                    <option value="Asia/Makassar" >
                             UTC/GMT -04:00 - Asia/Makassar                           </option>
                                                    <option value="Asia/Manila" >
                             UTC/GMT -04:00 - Asia/Manila                           </option>
                                                    <option value="Asia/Muscat" >
                             UTC/GMT -04:00 - Asia/Muscat                           </option>
                                                    <option value="Asia/Nicosia" >
                             UTC/GMT -04:00 - Asia/Nicosia                           </option>
                                                    <option value="Asia/Novokuznetsk" >
                             UTC/GMT -04:00 - Asia/Novokuznetsk                           </option>
                                                    <option value="Asia/Novosibirsk" >
                             UTC/GMT -04:00 - Asia/Novosibirsk                           </option>
                                                    <option value="Asia/Omsk" >
                             UTC/GMT -04:00 - Asia/Omsk                           </option>
                                                    <option value="Asia/Oral" >
                             UTC/GMT -04:00 - Asia/Oral                           </option>
                                                    <option value="Asia/Phnom_Penh" >
                             UTC/GMT -04:00 - Asia/Phnom_Penh                           </option>
                                                    <option value="Asia/Pontianak" >
                             UTC/GMT -04:00 - Asia/Pontianak                           </option>
                                                    <option value="Asia/Pyongyang" >
                             UTC/GMT -04:00 - Asia/Pyongyang                           </option>
                                                    <option value="Asia/Qatar" >
                             UTC/GMT -04:00 - Asia/Qatar                           </option>
                                                    <option value="Asia/Qostanay" >
                             UTC/GMT -04:00 - Asia/Qostanay                           </option>
                                                    <option value="Asia/Qyzylorda" >
                             UTC/GMT -04:00 - Asia/Qyzylorda                           </option>
                                                    <option value="Asia/Riyadh" >
                             UTC/GMT -04:00 - Asia/Riyadh                           </option>
                                                    <option value="Asia/Sakhalin" >
                             UTC/GMT -04:00 - Asia/Sakhalin                           </option>
                                                    <option value="Asia/Samarkand" >
                             UTC/GMT -04:00 - Asia/Samarkand                           </option>
                                                    <option value="Asia/Seoul" >
                             UTC/GMT -04:00 - Asia/Seoul                           </option>
                                                    <option value="Asia/Shanghai" >
                             UTC/GMT -04:00 - Asia/Shanghai                           </option>
                                                    <option value="Asia/Singapore" >
                             UTC/GMT -04:00 - Asia/Singapore                           </option>
                                                    <option value="Asia/Srednekolymsk" >
                             UTC/GMT -04:00 - Asia/Srednekolymsk                           </option>
                                                    <option value="Asia/Taipei" >
                             UTC/GMT -04:00 - Asia/Taipei                           </option>
                                                    <option value="Asia/Tashkent" >
                             UTC/GMT -04:00 - Asia/Tashkent                           </option>
                                                    <option value="Asia/Tbilisi" >
                             UTC/GMT -04:00 - Asia/Tbilisi                           </option>
                                                    <option value="Asia/Tehran" >
                             UTC/GMT -04:00 - Asia/Tehran                           </option>
                                                    <option value="Asia/Thimphu" >
                             UTC/GMT -04:00 - Asia/Thimphu                           </option>
                                                    <option value="Asia/Tokyo" >
                             UTC/GMT -04:00 - Asia/Tokyo                           </option>
                                                    <option value="Asia/Tomsk" >
                             UTC/GMT -04:00 - Asia/Tomsk                           </option>
                                                    <option value="Asia/Ulaanbaatar" >
                             UTC/GMT -04:00 - Asia/Ulaanbaatar                           </option>
                                                    <option value="Asia/Urumqi" >
                             UTC/GMT -04:00 - Asia/Urumqi                           </option>
                                                    <option value="Asia/Ust-Nera" >
                             UTC/GMT -04:00 - Asia/Ust-Nera                           </option>
                                                    <option value="Asia/Vientiane" >
                             UTC/GMT -04:00 - Asia/Vientiane                           </option>
                                                    <option value="Asia/Vladivostok" >
                             UTC/GMT -04:00 - Asia/Vladivostok                           </option>
                                                    <option value="Asia/Yakutsk" >
                             UTC/GMT -04:00 - Asia/Yakutsk                           </option>
                                                    <option value="Asia/Yangon" >
                             UTC/GMT -04:00 - Asia/Yangon                           </option>
                                                    <option value="Asia/Yekaterinburg" >
                             UTC/GMT -04:00 - Asia/Yekaterinburg                           </option>
                                                    <option value="Asia/Yerevan" >
                             UTC/GMT -04:00 - Asia/Yerevan                           </option>
                                                    <option value="Atlantic/Azores" >
                             UTC/GMT -04:00 - Atlantic/Azores                           </option>
                                                    <option value="Atlantic/Bermuda" >
                             UTC/GMT -04:00 - Atlantic/Bermuda                           </option>
                                                    <option value="Atlantic/Canary" >
                             UTC/GMT -04:00 - Atlantic/Canary                           </option>
                                                    <option value="Atlantic/Cape_Verde" >
                             UTC/GMT -04:00 - Atlantic/Cape_Verde                           </option>
                                                    <option value="Atlantic/Faroe" >
                             UTC/GMT -04:00 - Atlantic/Faroe                           </option>
                                                    <option value="Atlantic/Madeira" >
                             UTC/GMT -04:00 - Atlantic/Madeira                           </option>
                                                    <option value="Atlantic/Reykjavik" >
                             UTC/GMT -04:00 - Atlantic/Reykjavik                           </option>
                                                    <option value="Atlantic/South_Georgia" >
                             UTC/GMT -04:00 - Atlantic/South_Georgia                           </option>
                                                    <option value="Atlantic/St_Helena" >
                             UTC/GMT -04:00 - Atlantic/St_Helena                           </option>
                                                    <option value="Atlantic/Stanley" >
                             UTC/GMT -04:00 - Atlantic/Stanley                           </option>
                                                    <option value="Australia/Adelaide" >
                             UTC/GMT -04:00 - Australia/Adelaide                           </option>
                                                    <option value="Australia/Brisbane" >
                             UTC/GMT -04:00 - Australia/Brisbane                           </option>
                                                    <option value="Australia/Broken_Hill" >
                             UTC/GMT -04:00 - Australia/Broken_Hill                           </option>
                                                    <option value="Australia/Currie" >
                             UTC/GMT -04:00 - Australia/Currie                           </option>
                                                    <option value="Australia/Darwin" >
                             UTC/GMT -04:00 - Australia/Darwin                           </option>
                                                    <option value="Australia/Eucla" >
                             UTC/GMT -04:00 - Australia/Eucla                           </option>
                                                    <option value="Australia/Hobart" >
                             UTC/GMT -04:00 - Australia/Hobart                           </option>
                                                    <option value="Australia/Lindeman" >
                             UTC/GMT -04:00 - Australia/Lindeman                           </option>
                                                    <option value="Australia/Lord_Howe" >
                             UTC/GMT -04:00 - Australia/Lord_Howe                           </option>
                                                    <option value="Australia/Melbourne" >
                             UTC/GMT -04:00 - Australia/Melbourne                           </option>
                                                    <option value="Australia/Perth" >
                             UTC/GMT -04:00 - Australia/Perth                           </option>
                                                    <option value="Australia/Sydney" >
                             UTC/GMT -04:00 - Australia/Sydney                           </option>
                                                    <option value="Europe/Amsterdam" >
                             UTC/GMT -04:00 - Europe/Amsterdam                           </option>
                                                    <option value="Europe/Andorra" >
                             UTC/GMT -04:00 - Europe/Andorra                           </option>
                                                    <option value="Europe/Astrakhan" >
                             UTC/GMT -04:00 - Europe/Astrakhan                           </option>
                                                    <option value="Europe/Athens" >
                             UTC/GMT -04:00 - Europe/Athens                           </option>
                                                    <option value="Europe/Belgrade" >
                             UTC/GMT -04:00 - Europe/Belgrade                           </option>
                                                    <option value="Europe/Berlin" >
                             UTC/GMT -04:00 - Europe/Berlin                           </option>
                                                    <option value="Europe/Bratislava" >
                             UTC/GMT -04:00 - Europe/Bratislava                           </option>
                                                    <option value="Europe/Brussels" >
                             UTC/GMT -04:00 - Europe/Brussels                           </option>
                                                    <option value="Europe/Bucharest" >
                             UTC/GMT -04:00 - Europe/Bucharest                           </option>
                                                    <option value="Europe/Budapest" >
                             UTC/GMT -04:00 - Europe/Budapest                           </option>
                                                    <option value="Europe/Busingen" >
                             UTC/GMT -04:00 - Europe/Busingen                           </option>
                                                    <option value="Europe/Chisinau" >
                             UTC/GMT -04:00 - Europe/Chisinau                           </option>
                                                    <option value="Europe/Copenhagen" >
                             UTC/GMT -04:00 - Europe/Copenhagen                           </option>
                                                    <option value="Europe/Dublin" >
                             UTC/GMT -04:00 - Europe/Dublin                           </option>
                                                    <option value="Europe/Gibraltar" >
                             UTC/GMT -04:00 - Europe/Gibraltar                           </option>
                                                    <option value="Europe/Guernsey" >
                             UTC/GMT -04:00 - Europe/Guernsey                           </option>
                                                    <option value="Europe/Helsinki" >
                             UTC/GMT -04:00 - Europe/Helsinki                           </option>
                                                    <option value="Europe/Isle_of_Man" >
                             UTC/GMT -04:00 - Europe/Isle_of_Man                           </option>
                                                    <option value="Europe/Istanbul" >
                             UTC/GMT -04:00 - Europe/Istanbul                           </option>
                                                    <option value="Europe/Jersey" >
                             UTC/GMT -04:00 - Europe/Jersey                           </option>
                                                    <option value="Europe/Kaliningrad" >
                             UTC/GMT -04:00 - Europe/Kaliningrad                           </option>
                                                    <option value="Europe/Kiev" >
                             UTC/GMT -04:00 - Europe/Kiev                           </option>
                                                    <option value="Europe/Kirov" >
                             UTC/GMT -04:00 - Europe/Kirov                           </option>
                                                    <option value="Europe/Lisbon" >
                             UTC/GMT -04:00 - Europe/Lisbon                           </option>
                                                    <option value="Europe/Ljubljana" >
                             UTC/GMT -04:00 - Europe/Ljubljana                           </option>
                                                    <option value="Europe/London" >
                             UTC/GMT -04:00 - Europe/London                           </option>
                                                    <option value="Europe/Luxembourg" >
                             UTC/GMT -04:00 - Europe/Luxembourg                           </option>
                                                    <option value="Europe/Madrid" >
                             UTC/GMT -04:00 - Europe/Madrid                           </option>
                                                    <option value="Europe/Malta" >
                             UTC/GMT -04:00 - Europe/Malta                           </option>
                                                    <option value="Europe/Mariehamn" >
                             UTC/GMT -04:00 - Europe/Mariehamn                           </option>
                                                    <option value="Europe/Minsk" >
                             UTC/GMT -04:00 - Europe/Minsk                           </option>
                                                    <option value="Europe/Monaco" >
                             UTC/GMT -04:00 - Europe/Monaco                           </option>
                                                    <option value="Europe/Moscow" >
                             UTC/GMT -04:00 - Europe/Moscow                           </option>
                                                    <option value="Europe/Oslo" >
                             UTC/GMT -04:00 - Europe/Oslo                           </option>
                                                    <option value="Europe/Paris" >
                             UTC/GMT -04:00 - Europe/Paris                           </option>
                                                    <option value="Europe/Podgorica" >
                             UTC/GMT -04:00 - Europe/Podgorica                           </option>
                                                    <option value="Europe/Prague" >
                             UTC/GMT -04:00 - Europe/Prague                           </option>
                                                    <option value="Europe/Riga" >
                             UTC/GMT -04:00 - Europe/Riga                           </option>
                                                    <option value="Europe/Rome" >
                             UTC/GMT -04:00 - Europe/Rome                           </option>
                                                    <option value="Europe/Samara" >
                             UTC/GMT -04:00 - Europe/Samara                           </option>
                                                    <option value="Europe/San_Marino" >
                             UTC/GMT -04:00 - Europe/San_Marino                           </option>
                                                    <option value="Europe/Sarajevo" >
                             UTC/GMT -04:00 - Europe/Sarajevo                           </option>
                                                    <option value="Europe/Saratov" >
                             UTC/GMT -04:00 - Europe/Saratov                           </option>
                                                    <option value="Europe/Simferopol" >
                             UTC/GMT -04:00 - Europe/Simferopol                           </option>
                                                    <option value="Europe/Skopje" >
                             UTC/GMT -04:00 - Europe/Skopje                           </option>
                                                    <option value="Europe/Sofia" >
                             UTC/GMT -04:00 - Europe/Sofia                           </option>
                                                    <option value="Europe/Stockholm" >
                             UTC/GMT -04:00 - Europe/Stockholm                           </option>
                                                    <option value="Europe/Tallinn" >
                             UTC/GMT -04:00 - Europe/Tallinn                           </option>
                                                    <option value="Europe/Tirane" >
                             UTC/GMT -04:00 - Europe/Tirane                           </option>
                                                    <option value="Europe/Ulyanovsk" >
                             UTC/GMT -04:00 - Europe/Ulyanovsk                           </option>
                                                    <option value="Europe/Uzhgorod" >
                             UTC/GMT -04:00 - Europe/Uzhgorod                           </option>
                                                    <option value="Europe/Vaduz" >
                             UTC/GMT -04:00 - Europe/Vaduz                           </option>
                                                    <option value="Europe/Vatican" >
                             UTC/GMT -04:00 - Europe/Vatican                           </option>
                                                    <option value="Europe/Vienna" >
                             UTC/GMT -04:00 - Europe/Vienna                           </option>
                                                    <option value="Europe/Vilnius" >
                             UTC/GMT -04:00 - Europe/Vilnius                           </option>
                                                    <option value="Europe/Volgograd" >
                             UTC/GMT -04:00 - Europe/Volgograd                           </option>
                                                    <option value="Europe/Warsaw" >
                             UTC/GMT -04:00 - Europe/Warsaw                           </option>
                                                    <option value="Europe/Zagreb" >
                             UTC/GMT -04:00 - Europe/Zagreb                           </option>
                                                    <option value="Europe/Zaporozhye" >
                             UTC/GMT -04:00 - Europe/Zaporozhye                           </option>
                                                    <option value="Europe/Zurich" >
                             UTC/GMT -04:00 - Europe/Zurich                           </option>
                                                    <option value="Indian/Antananarivo" >
                             UTC/GMT -04:00 - Indian/Antananarivo                           </option>
                                                    <option value="Indian/Chagos" >
                             UTC/GMT -04:00 - Indian/Chagos                           </option>
                                                    <option value="Indian/Christmas" >
                             UTC/GMT -04:00 - Indian/Christmas                           </option>
                                                    <option value="Indian/Cocos" >
                             UTC/GMT -04:00 - Indian/Cocos                           </option>
                                                    <option value="Indian/Comoro" >
                             UTC/GMT -04:00 - Indian/Comoro                           </option>
                                                    <option value="Indian/Kerguelen" >
                             UTC/GMT -04:00 - Indian/Kerguelen                           </option>
                                                    <option value="Indian/Mahe" >
                             UTC/GMT -04:00 - Indian/Mahe                           </option>
                                                    <option value="Indian/Maldives" >
                             UTC/GMT -04:00 - Indian/Maldives                           </option>
                                                    <option value="Indian/Mauritius" >
                             UTC/GMT -04:00 - Indian/Mauritius                           </option>
                                                    <option value="Indian/Mayotte" >
                             UTC/GMT -04:00 - Indian/Mayotte                           </option>
                                                    <option value="Indian/Reunion" >
                             UTC/GMT -04:00 - Indian/Reunion                           </option>
                                                    <option value="Pacific/Apia" >
                             UTC/GMT -04:00 - Pacific/Apia                           </option>
                                                    <option value="Pacific/Auckland" >
                             UTC/GMT -04:00 - Pacific/Auckland                           </option>
                                                    <option value="Pacific/Bougainville" >
                             UTC/GMT -04:00 - Pacific/Bougainville                           </option>
                                                    <option value="Pacific/Chatham" >
                             UTC/GMT -04:00 - Pacific/Chatham                           </option>
                                                    <option value="Pacific/Chuuk" >
                             UTC/GMT -04:00 - Pacific/Chuuk                           </option>
                                                    <option value="Pacific/Easter" >
                             UTC/GMT -04:00 - Pacific/Easter                           </option>
                                                    <option value="Pacific/Efate" >
                             UTC/GMT -04:00 - Pacific/Efate                           </option>
                                                    <option value="Pacific/Enderbury" >
                             UTC/GMT -04:00 - Pacific/Enderbury                           </option>
                                                    <option value="Pacific/Fakaofo" >
                             UTC/GMT -04:00 - Pacific/Fakaofo                           </option>
                                                    <option value="Pacific/Fiji" >
                             UTC/GMT -04:00 - Pacific/Fiji                           </option>
                                                    <option value="Pacific/Funafuti" >
                             UTC/GMT -04:00 - Pacific/Funafuti                           </option>
                                                    <option value="Pacific/Galapagos" >
                             UTC/GMT -04:00 - Pacific/Galapagos                           </option>
                                                    <option value="Pacific/Gambier" >
                             UTC/GMT -04:00 - Pacific/Gambier                           </option>
                                                    <option value="Pacific/Guadalcanal" >
                             UTC/GMT -04:00 - Pacific/Guadalcanal                           </option>
                                                    <option value="Pacific/Guam" >
                             UTC/GMT -04:00 - Pacific/Guam                           </option>
                                                    <option value="Pacific/Honolulu" >
                             UTC/GMT -04:00 - Pacific/Honolulu                           </option>
                                                    <option value="Pacific/Kiritimati" >
                             UTC/GMT -04:00 - Pacific/Kiritimati                           </option>
                                                    <option value="Pacific/Kosrae" >
                             UTC/GMT -04:00 - Pacific/Kosrae                           </option>
                                                    <option value="Pacific/Kwajalein" >
                             UTC/GMT -04:00 - Pacific/Kwajalein                           </option>
                                                    <option value="Pacific/Majuro" >
                             UTC/GMT -04:00 - Pacific/Majuro                           </option>
                                                    <option value="Pacific/Marquesas" >
                             UTC/GMT -04:00 - Pacific/Marquesas                           </option>
                                                    <option value="Pacific/Midway" >
                             UTC/GMT -04:00 - Pacific/Midway                           </option>
                                                    <option value="Pacific/Nauru" >
                             UTC/GMT -04:00 - Pacific/Nauru                           </option>
                                                    <option value="Pacific/Niue" >
                             UTC/GMT -04:00 - Pacific/Niue                           </option>
                                                    <option value="Pacific/Norfolk" >
                             UTC/GMT -04:00 - Pacific/Norfolk                           </option>
                                                    <option value="Pacific/Noumea" >
                             UTC/GMT -04:00 - Pacific/Noumea                           </option>
                                                    <option value="Pacific/Pago_Pago" >
                             UTC/GMT -04:00 - Pacific/Pago_Pago                           </option>
                                                    <option value="Pacific/Palau" >
                             UTC/GMT -04:00 - Pacific/Palau                           </option>
                                                    <option value="Pacific/Pitcairn" >
                             UTC/GMT -04:00 - Pacific/Pitcairn                           </option>
                                                    <option value="Pacific/Pohnpei" >
                             UTC/GMT -04:00 - Pacific/Pohnpei                           </option>
                                                    <option value="Pacific/Port_Moresby" >
                             UTC/GMT -04:00 - Pacific/Port_Moresby                           </option>
                                                    <option value="Pacific/Rarotonga" >
                             UTC/GMT -04:00 - Pacific/Rarotonga                           </option>
                                                    <option value="Pacific/Saipan" >
                             UTC/GMT -04:00 - Pacific/Saipan                           </option>
                                                    <option value="Pacific/Tahiti" >
                             UTC/GMT -04:00 - Pacific/Tahiti                           </option>
                                                    <option value="Pacific/Tarawa" >
                             UTC/GMT -04:00 - Pacific/Tarawa                           </option>
                                                    <option value="Pacific/Tongatapu" >
                             UTC/GMT -04:00 - Pacific/Tongatapu                           </option>
                                                    <option value="Pacific/Wake" >
                             UTC/GMT -04:00 - Pacific/Wake                           </option>
                                                    <option value="Pacific/Wallis" >
                             UTC/GMT -04:00 - Pacific/Wallis                           </option>
                                                    <option value="UTC" >
                             UTC/GMT -04:00 - UTC                           </option>
</select></div>
<div class="form-group col-span-6" hidden>
<label for="created_atAgregarDatos">CREATED_AT</label>
<input type="input" v-model="datoscamposPaises.created_at" name="created_at"  class="form-control " id="created_atAgregarDatos"  placeholder="created_at" maxlength="">
</div>
<div class="form-group col-span-6" hidden>
<label for="updated_atAgregarDatos">UPDATED_AT</label>
<input type="input" v-model="datoscamposPaises.updated_at" name="updated_at"  class="form-control " id="updated_atAgregarDatos"  placeholder="updated_at" maxlength="">
</div>
<div class="form-group col-span-12" hidden>
<label for="usuarioAgregarDatos">USUARIO</label>
<input type="input" v-model="datoscamposPaises.usuario" name="usuario"  class="form-control " id="usuarioAgregarDatos"  placeholder="usuario" maxlength="250">
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
