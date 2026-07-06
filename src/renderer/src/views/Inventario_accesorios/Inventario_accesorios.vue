
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
peticionesFetchOffline,
crearTablaSiNoExisteOffline,
buscadorArrayObjeto } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
/************************************************************************/
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
const camposArray = ['fecha', 'hora', 'total_accesorios', 'total_inventario', 'accesorios_iventariados','total_accesorios_vendidos'];
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
const datoscamposInventario_accesorios = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const Inventario_accesoriosEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposInventario_accesorios.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'inventario_accesorios');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTabla('inventario_accesorios');
  datoscamposInventario_accesorios.value = campos;
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

/*if(navigator.onLine){
   await crearTablaSiNoExiste(link.value, api.value, 'inventario_accesorios', camposArray, tokenCifrado.value,toast);
}else{
  if(window.electron){
  }   
}*/
     await crearTablaSiNoExisteOffline('inventario_accesorios',camposArray.join(','),toast)
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'inventario_accesorios');
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
                            const envioDatos = await peticionesFetchOffline('deleteEntry','inventario_accesorios', id);
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
const itemsInventario_accesorios = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleInventario_accesorios = (event, rowData) => {
currentRowData.value = rowData;
itemsInventario_accesorios.value = [
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
router.push({ path: `/editarinventario_accesorios/${currentRowData.value.id}` });
} },
{ label: 'Imprimir', icon: 'pi pi-print', command: () => { 
fnPrint()
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry','inventario_accesorios', rowData.id);
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
const filteredInventario_accesorios = computed(() => {
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
 router.push({ path: `/editarinventario_accesorios/${event.data.id}` });

};
/************************************************************************/
const fnPrint = async () => {
  try {
    const doc = new jsPDF();

    // 🔹 Parsear accesorios_iventariados
    let accesorios = [];
    try {
      accesorios = JSON.parse(currentRowData.value.accesorios_iventariados || "[]");
    } catch (e) {
      console.error("Error al parsear accesorios_iventariados", e);
    }

    // 🔹 Contar accesorios inventariados (SI)
    //const accesoriosContados = accesorios.filter(cel => cel.inventariado === "SI").length;
    const accesoriosContados = accesorios.reduce((acc, item) => {
      return acc + (parseFloat(item.cantidad_contada) || 0);
    }, 0);

    // 🔹 Total accesorios registrados en el inventario
    const totalaccesorios = parseInt(currentRowData.value.total_accesorioses) || accesorios.length || 0;

    // 🔹 Calcular faltantes
    const accesoriosFaltantes = totalaccesorios - accesoriosContados;

    // 🔹 Encabezado
    doc.setFontSize(16);
    doc.text("Reporte de Inventario Productos", 10, 20);

    doc.setFontSize(12);
    doc.text(`Fecha: ${currentRowData.value.fecha || ""}`, 10, 35);
    doc.text(`Hora: ${currentRowData.value.hora || ""}`, 10, 45);
    doc.text(`Total accesorios: ${totalaccesorios}`, 10, 55);
    doc.text(`Total Inventario: ${currentRowData.value.total_inventario || ""}`, 10, 65);
    doc.text(`accesorios Contados: ${accesoriosContados}`, 10, 75);
    doc.text(`accesorios Faltantes: ${accesoriosFaltantes}`, 10, 85);

    // 🔹 Crear tabla con los datos
    if (Array.isArray(accesorios) && accesorios.length > 0) {
      const tableData = accesorios.map((cel, i) => [
        i + 1,
        cel.codigo || "",
        cel.producto || "",
        cel.cantidad || "",
        cel.precio || "",
        cel.cantidad_contada,
        cel.inventariado || "☐"
      ]);

      autoTable(doc, {
        head: [["#", "Codigo", "Producto", "Cantidad", "Precio","Cantidad Contada", "Inventariado"]],
        body: tableData,
        startY: 95,
        styles: {
          fontSize: 10,
          halign: "center"
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          halign: "center"
        }
      });
    } else {
      doc.text("No hay accesorios inventariados", 10, 95);
    }

    // 🔹 Crear un Blob URL para incrustar el PDF
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // 🔹 Mostrar en Swal
    Swal.fire({
      title: "Vista previa del PDF",
      html: `
        <iframe src="${pdfUrl}" width="100%" height="500px" style="border: none;"></iframe>
      `,
      width: "80%",
      heightAuto: true,
      showCancelButton: true,
      confirmButtonText: "Imprimir",
      cancelButtonText: "Cerrar"
    }).then((result) => {
      if (result.isConfirmed) {
        const printWindow = window.open(pdfUrl);
        printWindow.addEventListener("load", () => {
          printWindow.print();
        });
      }
    });
  } catch (error) {
    console.error("❌ Error al generar el PDF:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "No se pudo generar el PDF",
      life: 4000
    });
  }
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
 <Fieldset legend="Datos de Inventario Accesorios">
  <div class="flex items-center">
    <div class="flex space-x-2">
      <Button icon="pi pi-refresh" severity="primary" @click="fetchAndSetupData" data-toggle="tooltip" title="Recargar" id="reload" />
      <Button as="router-link" icon="pi pi-plus-circle" to="/crearinventario_accesorios" class="ms-1" />
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
          <InputText v-model="searchQuery" placeholder="Buscar inventario_accesorios..." class="p-inputtext p-component" />
        </div>
        <DataTable
          :value="filteredInventario_accesorios"
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
                @click="toggleInventario_accesorios($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
              />
              <Menu
                ref="menu"
                id="overlay_menu_Inventario_accesorios"
                :model="itemsInventario_accesorios"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="fecha" header="Fecha"></Column>
            <Column field="hora" header="Hora"></Column>
            <Column field="total_accesorios" header="Total_accesorios"></Column>
            <Column field="total_inventario" header="Total_inventario"></Column>
<!-- <Column field="accesorios_iventariados" header="accesorios_iventariados"></Column> -->
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

