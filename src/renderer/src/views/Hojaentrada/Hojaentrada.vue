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
const camposArray = ["fecha","no_orden","cliente","telefono","whatsapp","email","direccion","cia_seguro","no_poliza","no_ficha","marca_vehiculo","modelo","year","color","placa","km","combustible","bateria","tipo_combustible","chasis","grua","hora","fallas_electronicas_en_tablero","abolladuras_rayaduras","rotura","no_funciona","equipos","tecnico","costo_reparacion","observaciones","trabajos_realizar","usuario"];
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
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const HojaentradaEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposHojaentrada.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'hojaentrada');
    const jsonData = response;
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('hojaentrada');
  datoscamposHojaentrada.value = campos;
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
await crearTablaSiNoExisteOffline('hojaentrada', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'hojaentrada');
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
  const url = link.value+api.value+"/actualizarcampos/hojaentrada";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'hojaentrada', JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/hojaentrada";
  if (datoscamposHojaentrada.value.hasOwnProperty('created_at')) {
    datoscamposHojaentrada.value.created_at = nfecha('timestamp');
    datoscamposHojaentrada.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'hojaentrada', JSON.stringify(datoscamposHojaentrada.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'hojaentrada', id);
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
const itemsHojaentrada = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleHojaentrada = (event, rowData) => {
currentRowData.value = rowData;
itemsHojaentrada.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
router.push({ path: `/editarhojaentrada/${currentRowData.value.id}` });
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'hojaentrada', rowData.id);
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
const filteredHojaentrada = computed(() => {
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
<main class="content-wrapper card">
  <div class="w-full px-4 mt-5">
<Card>
      <template #content>
<div class="grid grid-cols-12 gap-4">
      <div class="md:col-span-12">
        <fieldset class="border p-3 rounded mb-2">
          <legend class="float-none w-auto px-2">Datos de Hojaentrada</legend>
            <div class="grid grid-cols-12 gap-4">
              <div class="sm:col-span-12">
                <a href="#" @click="fetchAndSetupData" class="btn btn-warning text-white cartelito" data-toggle="tooltip" title="Recargar" id="reload"><i class="icon-arrows-cw"></i></a>
<router-link to="/crearhojaentrada" class="btn btn-success text-white ms-1"><i class="icon-plus"></i></router-link>
               <a href="#" @click="borrarSeleccionados" class="btn btn-danger btnaccion cartelito ms-1" data-toggle="tooltip" title="Borrar Selección" id="borrador"><i class="icon-trash-4"></i></a>
<a href="#" v-if="usuarioLocal.usuario =='Soporte'"  @click="borrarTodo" class="btn btn-danger btnaccion cartelito float-end ms-1" data-toggle="tooltip" title="Borrar Todo" id="borrartodo"><i class="icon-trash"></i> Borrar Todo</a>
              </div>
            </div>
        </fieldset>
      </div>
      <div class="md:col-span-12">
 <div style="display: flex; justify-content: flex-end;">
 <input v-model="searchQuery" placeholder="Buscar hojaentrada..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
</div>
<DataTable 
    :value="filteredHojaentrada"  
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
                @click="toggleHojaentrada($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
            />
            <Menu 
                ref="menu" 
                id="overlay_menu_Hojaentrada" 
                :model="itemsHojaentrada" 
                :popup="true"
            />
        </template>
    </Column>
    <Column field="fecha" header="Fecha"></Column>
<Column field="no_orden" header="No_orden"></Column>
<Column field="cliente" header="Cliente"></Column>
<Column field="telefono" header="Telefono"></Column>
<Column field="whatsapp" header="Whatsapp"></Column>
<Column field="email" header="Email"></Column>
<Column field="direccion" header="Direccion"></Column>
<Column field="cia_seguro" header="Cia_seguro"></Column>
<Column field="no_poliza" header="No_poliza"></Column>
<Column field="no_ficha" header="No_ficha"></Column>
<Column field="marca_vehiculo" header="Marca_vehiculo"></Column>
<Column field="modelo" header="Modelo"></Column>
<Column field="year" header="Year"></Column>
<Column field="color" header="Color"></Column>
<Column field="placa" header="Placa"></Column>
<Column field="km" header="Km"></Column>
<Column field="combustible" header="Combustible"></Column>
<Column field="bateria" header="Bateria"></Column>
<Column field="tipo_combustible" header="Tipo_combustible"></Column>
<Column field="chasis" header="Chasis"></Column>
<Column field="grua" header="Grua"></Column>
<Column field="hora" header="Hora"></Column>
<Column field="fallas_electronicas_en_tablero" header="Fallas_electronicas_en_tablero"></Column>
<Column field="abolladuras_rayaduras" header="Abolladuras_rayaduras"></Column>
<Column field="rotura" header="Rotura"></Column>
<Column field="no_funciona" header="No_funciona"></Column>
<Column field="equipos" header="Equipos"></Column>
<Column field="tecnico" header="Tecnico"></Column>
<Column field="costo_reparacion" header="Costo_reparacion"></Column>
<Column field="observaciones" header="Observaciones"></Column>
<Column field="trabajos_realizar" header="Trabajos_realizar"></Column>
<Column field="usuario" header="Usuario"></Column>

</DataTable>
      </div>
    </div>
      </template>
</Card>
<Toast />
  </div>
</main>
</template>
<style scoped>
</style>
