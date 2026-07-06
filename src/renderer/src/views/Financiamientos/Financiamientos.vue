
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
/************************************************************************/
const onRowSelect = (event) => {
 router.push({ path: `/editarfinanciamientos/${event.data.id}` });

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
  <legend class="px-2">Datos de Financiamientos</legend>
  <div class="flex items-center">
    <div class="flex space-x-2">
      <Button icon="pi pi-refresh" severity="primary" @click="fetchAndSetupData" data-toggle="tooltip" title="Recargar" id="reload" />
      <Button as="router-link" icon="pi pi-plus-circle" to="/crearfinanciamientos" class="ms-1" />
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
          <InputText v-model="searchQuery" placeholder="Buscar financiamientos..." class="p-inputtext p-component" />
        </div>
        <DataTable
          :value="filteredFinanciamientos"
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
          selectionMode="multiple"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          tableStyle="min-width: 50rem">
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
          <Column field="cedula_cliente" header="Cedula_cliente"></Column>
<Column field="nombre_cliente" header="Nombre_cliente"></Column>
<Column field="telefono_cliente" header="Telefono_cliente"></Column>
<Column field="whatsapp_cliente" header="Whatsapp_cliente"></Column>
<Column field="email_cliente" header="Email_cliente"></Column>
<Column field="direccion_cliente" header="Direccion_cliente"></Column>
<Column field="referencia_direccion_cliente" header="Referencia_direccion_cliente"></Column>
<Column field="fecha_nacimiento" header="Fecha_nacimiento"></Column>
<Column field="edad_cliente" header="Edad_cliente"></Column>
<Column field="estado_civil" header="Estado_civil"></Column>
<Column field="nombre_conyugue" header="Nombre_conyugue"></Column>
<Column field="telefono_conyugue" header="Telefono_conyugue"></Column>
<Column field="ocupcion" header="Ocupcion"></Column>
<Column field="salario" header="Salario"></Column>
<Column field="tiempo_laborando" header="Tiempo_laborando"></Column>
<Column field="tipo_empresa" header="Tipo_empresa"></Column>
<Column field="empresa_labora" header="Empresa_labora"></Column>
<Column field="contacto_empresa" header="Contacto_empresa"></Column>
<Column field="ingresos_adicionales" header="Ingresos_adicionales"></Column>
<Column field="tipo_vivienda" header="Tipo_vivienda"></Column>
<Column field="vehiculo" header="Vehiculo"></Column>
<Column field="cantidad_hijos" header="Cantidad_hijos"></Column>
<Column field="cantidad_dependientes" header="Cantidad_dependientes"></Column>
<Column field="referencia_familiar1" header="Referencia_familiar1"></Column>
<Column field="contacto_familiar1" header="Contacto_familiar1"></Column>
<Column field="referencia_familiar2" header="Referencia_familiar2"></Column>
<Column field="contacto_familiar2" header="Contacto_familiar2"></Column>
<Column field="referencia_personal1" header="Referencia_personal1"></Column>
<Column field="contacto_personal1" header="Contacto_personal1"></Column>
<Column field="referencia_personal2" header="Referencia_personal2"></Column>
<Column field="contacto_personal2" header="Contacto_personal2"></Column>
<Column field="redes_solciales" header="Redes_solciales"></Column>
<Column field="no_financiamiento" header="No_financiamiento"></Column>
<Column field="fecha_solicitud" header="Fecha_solicitud"></Column>
<Column field="hora_emision" header="Hora_emision"></Column>
<Column field="etapa_solicitud" header="Etapa_solicitud"></Column>
<Column field="score_aa" header="Score_aa"></Column>
<Column field="agente" header="Agente"></Column>
<Column field="resultados_prospecto" header="Resultados_prospecto"></Column>
<Column field="resultado_analisis" header="Resultado_analisis"></Column>
<Column field="motivo" header="Motivo"></Column>
<Column field="cedula_garante" header="Cedula_garante"></Column>
<Column field="nombre_garante" header="Nombre_garante"></Column>
<Column field="telefono_garante" header="Telefono_garante"></Column>
<Column field="whatsapp_garante" header="Whatsapp_garante"></Column>
<Column field="email_garante" header="Email_garante"></Column>
<Column field="vinculo_deudor" header="Vinculo_deudor"></Column>
<Column field="direccion_garante" header="Direccion_garante"></Column>
<Column field="referencia_direccion_garante" header="Referencia_direccion_garante"></Column>
<Column field="articulos" header="Articulos"></Column>
<Column field="inicial" header="Inicial"></Column>
<Column field="capital" header="Capital"></Column>
<Column field="tasa_interes" header="Tasa_interes"></Column>
<Column field="interes_total" header="Interes_total"></Column>
<Column field="no_cuotas" header="No_cuotas"></Column>
<Column field="valor_cuotas" header="Valor_cuotas"></Column>
<Column field="gastos_legales" header="Gastos_legales"></Column>
<Column field="monto_total" header="Monto_total"></Column>
<Column field="total_abonado" header="Total_abonado"></Column>
<Column field="total_pendiente" header="Total_pendiente"></Column>
<Column field="frecuencia_pago" header="Frecuencia_pago"></Column>
<Column field="fechas_pago" header="Fechas_pago"></Column>
<Column field="proximo_pago" header="Proximo_pago"></Column>
<Column field="prorrateo" header="Prorrateo"></Column>
<Column field="proxima_cuota" header="Proxima_cuota"></Column>
<Column field="fecha_entrega" header="Fecha_entrega"></Column>
<Column field="responsable_entrega" header="Responsable_entrega"></Column>
<Column field="cobrador_asignado" header="Cobrador_asignado"></Column>
<Column field="geolocalizacion" header="Geolocalizacion"></Column>
<Column field="estado_financiamiento" header="Estado_financiamiento"></Column>
<Column field="historial_pagos" header="Historial_pagos"></Column>
<Column field="comentario" header="Comentario"></Column>
<Column field="imagen" header="Imagen"></Column>
        </DataTable>
      </div>
    </div>
      </template>
</Card>

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
</style>

