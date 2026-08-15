
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
peticionesFetchOffline,
envioElectron,
crearTablaSiNoExisteOffline,
buscadorArrayObjeto } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
/************************************************************************/

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
const camposArray = ['cedula_cliente', 'nombre_cliente', 'telefono_cliente', 'whatsapp_cliente', 'email_cliente', 'direccion_cliente', 'referencia_direccion_cliente', 'fecha_nacimiento', 'edad_cliente', 'estado_civil', 'nombre_conyugue', 'telefono_conyugue', 'ocupcion', 'salario','sexo', 'tiempo_laborando', 'tipo_empresa', 'empresa_labora', 'contacto_empresa', 'ingresos_adicionales', 'tipo_vivienda', 'vehiculo', 'cantidad_hijos', 'cantidad_dependientes', 'referencia_familiar1', 'contacto_familiar1', 'referencia_familiar2', 'contacto_familiar2', 'referencia_personal1', 'contacto_personal1', 'referencia_personal2', 'contacto_personal2', 'redes_solciales', 'no_financiamiento', 'fecha_solicitud', 'hora_emision', 'etapa_solicitud', 'score_aa', 'agente', 'resultados_prospecto', 'resultado_analisis', 'motivo', 'cedula_garante', 'nombre_garante', 'telefono_garante', 'whatsapp_garante', 'email_garante', 'vinculo_deudor', 'direccion_garante', 'referencia_direccion_garante', 'articulos', 'inicial', 'capital','total_capital', 'tasa_interes', 'interes_total', 'no_cuotas', 'valor_cuotas', 'gastos_legales','porcentaje_seguro',
'total_seguro', 'monto_total', 'total_abonado', 'total_pendiente', 'frecuencia_pago', 'fechas_pago', 'proximo_pago', 'prorrateo', 'proxima_cuota','fecha_vencimiento', 'fecha_entrega', 'responsable_entrega', 'cobrador_asignado', 'geolocalizacion', 'estado_financiamiento', 'historial_pagos', 'comentario', 'imagen','vinculo_referencia_familiar1',
'vinculo_referencia_familiar2',
'vinculo_contacto_personal1',
'vinculo_contacto_personal2','almacen'];
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
const datoscamposFinanciamientos = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const FinanciamientosEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposFinanciamientos.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'financiamientos');
    const jsonData = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre).reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('financiamientos');
  datoscamposFinanciamientos.value = campos;
}
/************************************************************************/
const datosConfig = async()=>{
    const response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = response.VITE_LINKURL;
    api.value = response.VITE_LINK_API;
    token.value = response.VITE_TOKEN;
    patronTelefono.value = response.VITE_PATRON_TELEFONO;
    linkImpresora.value = response.VITE_IMPRESORA_LOCAL;
    patroncedula.value = response.VITE_PATRON_CEDULA;
    tokenCorto.value = response.VITE_TOKEN_CORTO;

}
/************************************************************************/
onMounted(async () => {
await datosConfig()
tokenCifrado.value = await encryptarPassword(token.value, 10);

     await crearTablaSiNoExisteOffline('financiamientos',camposArray.join(','),toast)

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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'financiamientos');
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
                            const envioDatos = await peticionesFetchOffline('deleteEntry','financiamientos', id);
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
const itemsFinanciamientos = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleFinanciamientos = (event, rowData) => {
currentRowData.value = rowData;
itemsFinanciamientos.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
router.push({ path: `/editarfinanciamientos/${currentRowData.value.id}` });
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','financiamientos', rowData.id);
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
const filteredFinanciamientos = computed(() => {
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
const getStatusSeverity = (estado) => {
  const map = {
    'AL DIA': 'success',
    'ATRASADO': 'danger',
    'PENDIENTE': 'warn',
    'PAGADO': 'success',
    'CANCELADO': 'contrast'
  }
  return map[estado] || 'info'
}
/************************************************************************/
const onRowSelect = (event) => {
 router.push({ path: `/editarfinanciamientos/${event.data.id}` });

};
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <div class="p-4 md:p-6">
    <div class="flex flex-col gap-6">

      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Financiamientos</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestion de solicitudes, aprobaciones y seguimiento</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Buscar por nombre, cedula o No...." class="p-inputtext-sm" />
          </span>
          <Button icon="pi pi-refresh" severity="secondary" v-tooltip.top="'Recargar'" @click="fetchAndSetupData" />
          <Button as="router-link" icon="pi pi-plus" label="Nuevo" to="/crearfinanciamientos" />
          <Button icon="pi pi-trash" severity="danger" v-tooltip.top="'Borrar seleccion'" @click="borrarSeleccionados" />
          <Button
            v-if="datosEmpresa.usuario.nivel_seguridad == 'Soporte'"
            label="Borrar Todo"
            icon="pi pi-trash"
            severity="danger"
            @click="borrarTodo"
          />
        </div>
      </div>

      <!-- TABLE -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          :value="filteredFinanciamientos"
          scrollable
          scrollHeight="calc(100vh - 280px)"
          dataKey="id"
          paginator
          :rows="15"
          size="small"
          resizableColumns
          columnResizeMode="fit"
          v-model:selection="selectedItems"
          @rowSelect="onRowSelect"
          selectionMode="multiple"
          :rowsPerPageOptions="[10, 15, 25, 50]"
          tableStyle="min-width: 60rem"
          class="p-datatable-sm"
          stripedRows>
        <Column selectionMode="multiple" headerStyle="width: 3rem">
        <template #body="{ data }">
             <div @click.stop>
                  <Checkbox v-model="selectedItems" :value="data" />
             </div>
         </template>
        </Column>

          <Column header="Options">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                @click="toggleFinanciamientos($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
              />
              <Menu
                ref="menu"
                id="overlay_menu_Financiamientos"
                :model="itemsFinanciamientos"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="no_financiamiento" header="No."></Column>
          <Column field="nombre_cliente" header="Cliente"></Column>
          <Column field="cedula_cliente" header="Cedula"></Column>
          <Column field="telefono_cliente" header="Telefono"></Column>
          <Column field="capital" header="Capital">
            <template #body="{ data }">
              <span class="font-semibold">RD$ {{ parseFloat(data.capital || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</span>
            </template>
          </Column>
          <Column field="total_pendiente" header="Pendiente">
            <template #body="{ data }">
              <span :class="parseFloat(data.total_pendiente) > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'">
                RD$ {{ parseFloat(data.total_pendiente || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}
              </span>
            </template>
          </Column>
          <Column field="no_cuotas" header="Cuotas"></Column>
          <Column field="frecuencia_pago" header="Frecuencia"></Column>
          <Column field="fecha_solicitud" header="Solicitud"></Column>
          <Column field="agente" header="Agente"></Column>
          <Column field="estado_financiamiento" header="Estado">
            <template #body="{ data }">
              <Tag :severity="getStatusSeverity(data.estado_financiamiento)" :value="data.estado_financiamiento" />
            </template>
          </Column>
        </DataTable>
      </div>

    </div>
    <Toast />
  </div>
</main>
</template>
<style scoped>
</style>

