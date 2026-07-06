<script setup>
import { ref, onMounted, computed } from 'vue';
import router from '../../router';
import axios from 'axios';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { enviarDatosPorPost, encryptarPassword, envioElectron } from '../../funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
const toast = useToast();

import { useDatosEmpresa } from '../../stores';
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const tokenCifrado = ref(null);

const searchQuery = ref('');

document.body.classList.add('sidebar-close');

const listadoServicios = ref([]);
const selectedProduct = ref();
const metaKey = ref(true);
const visiblebuscarImei = ref(false);
const imeiConsulta = ref(null);
const servicio = ref(null);

const filteredProducts = computed(() => {
  if (!searchQuery.value) return listadoServicios.value;
  return listadoServicios.value.filter(product => {
    return Object.values(product).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
});

const buscarDatosIMEI = async () => {
  if (!imeiConsulta.value || imeiConsulta.value == '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Escriba un IMEI válido', life: 3000 });
    return;
  }

  const datos = {
    "service": servicio.value,
    "imei": imeiConsulta.value,
    "key": "JKD-QC9-9L9-9C6-GT7-J2I-LIV-U3M"
  };

  try {
    const prueba = await enviarDatosPorPost('https://api.ifreeicloud.co.uk', datos, tokenCifrado.value);

    if (prueba.success) {
      visiblebuscarImei.value = false;
      const formattedData = Object.entries(prueba.object)
        .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
        .join('');

      Swal.fire({
        title: 'Datos del IMEI',
        html: `<ul>${formattedData}</ul>`,
        icon: 'success',
        confirmButtonText: 'Cerrar'
      });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentran Datos', life: 3000 });
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de petición', life: 3000 });
  }
};

const listadoServiciosIMEI = async () => {
  const datos = {
    "accountinfo": "servicelist",
    "key": "WLZ-OJ2-7HJ-0XH-DJ6-AVZ-OXU-1XB"
  };

  const gratis = {
    description: "Chequeo Básico gratuito.",
    name: "Chequeo Básico gratuito",
    objectSupport: true,
    price: 0.00,
    service: 0,
    snSupport: true,
    time: "Instant"
  };

  try {
    const consulta = await enviarDatosPorPost('https://api.ifreeicloud.co.uk', datos, tokenCifrado.value);

    if (consulta.success) {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Cargados ', life: 3000 });
      const nuevoListado = [
        gratis,
        ...Object.values(consulta.object)
      ];

      // Limpiar las descripciones de etiquetas HTML
      for (const item of nuevoListado) {
        if (item.description) {
          item.description = stripHtmlTags(item.description);
        }
      }

      listadoServicios.value = nuevoListado;
      console.log("listadoServicios.value", listadoServicios.value);
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentran Datos', life: 3000 });
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de petición', life: 3000 });
  }
};

onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
  linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;

  tokenCifrado.value = await encryptarPassword(token.value, 10);

  await listadoServiciosIMEI();
});

const onRowSelect = (event) => {
  visiblebuscarImei.value = true;
  servicio.value = event.data.service;
  toast.add({ severity: 'info', summary: event.data.service, detail: event.data.name, life: 3000 });
};

const onRowUnselect = (event) => {
  servicio.value = null;
};

const fnBuscarImei = async () => {
  // Implementar lógica para buscar IMEI
};

function stripHtmlTags(html) {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
</script>

<template>
  <main class="content-wrapper">
    <div class="w-full px-4 mt-5">
      <div class="grid grid-cols-12 gap-4">
        <div class="md:col-span-12">
          <fieldset class="border p-3 rounded mb-2">
            <legend class="float-none w-auto px-2">Datos de Cellinfo</legend>
            <div class="grid grid-cols-12 gap-4">
              <div class="sm:col-span-12">
                <div class="card">
                  <input v-model="searchQuery" placeholder="Buscar productos..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
                  <DataTable
                    v-model:selection="selectedProduct"
                    dataKey="service"
                    :value="filteredProducts"
                    stripedRows
                    :rows="5"
                    :rowsPerPageOptions="[5, 10, 20, 50]"
                    selectionMode="single"
                    :metaKeySelection="false"
                    scrollable
                    scrollHeight="400px"
                    @rowSelect="onRowSelect"
                    @rowUnselect="onRowUnselect"
                    tableStyle="min-width: 50rem">
                    <Column field="service" header="Code"></Column>
                    <Column field="name" header="Name"></Column>
                    <Column field="price" header="Price"></Column>
                    <Column field="description" header="Description"></Column>
                    <Column field="time" header="Time"></Column>
                  </DataTable>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>

      <Dialog v-model:visible="visiblebuscarImei" modal header="Buscar Imei" :style="{ width: '30rem' }">
        <template #header>
          <div class="inline-flex align-items-center justify-content-center gap-2">
            <span class="font-bold white-space-nowrap">Buscar Imei</span>
          </div>
        </template>
        <div class="grid grid-cols-12 gap-4">
          <fieldset class="border p-3 rounded mb-2">
            <legend class="float-none w-auto px-2">IMEI</legend>
            <form id="formularioAgregarClientes" action="" method="">
              <div style="margin-top: 15px;color: #34AAB2;" class="grid grid-cols-12 gap-4">
                <div class="form-group col-span-12">
                  <label for="ingresenumeroModifcarfactura">#IMEI</label>
                  <InputGroup>
                    <InputMask id="basic" v-model="imeiConsulta" mask="999999999999999" placeholder="00000000000000000" />
                  </InputGroup>
                </div>
              </div>
            </form>
          </fieldset>
        </div>
        <template #footer>
          <ButtonGroup>
            <Button label="Buscar" icon="pi pi-search" @click="buscarDatosIMEI" outlined />
            <Button label="Cancel" icon="pi pi-times" severity="danger" @click="visiblebuscarImei = false" outlined />
          </ButtonGroup>
        </template>
      </Dialog>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
</style>
