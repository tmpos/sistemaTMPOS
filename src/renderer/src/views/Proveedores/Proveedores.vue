<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,peticionesFetchOffline,
arrayToObjetoFromTablaOffline,
crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["nombre","rnc","telefono","email","encargado","cuenta_bancaria","direccion","usuario"];
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
/************************************************************************/
const selectedItems = ref([]);
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const datoscamposProveedores = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const ProveedoresEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposProveedores.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
    const jsonData = response;
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('proveedores');
  datoscamposProveedores.value = campos;
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
await crearTablaSiNoExisteOffline('proveedores', camposArray, toast);
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'proveedores');
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
  const url = link.value+api.value+"/actualizarcampos/proveedores";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'proveedores',JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/proveedores";
  if (datoscamposProveedores.value.hasOwnProperty('created_at')) {
    datoscamposProveedores.value.created_at = nfecha('timestamp');
    datoscamposProveedores.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'proveedores',JSON.stringify(datoscamposProveedores.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'proveedores',id);
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
const itemsProveedores = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleProveedores = (event, rowData) => {
currentRowData.value = rowData;
itemsProveedores.value = [
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'proveedores',rowData.id);
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
const estadisticasProveedores = computed(() => {
  const total = data.value.length;

  // Proveedores ordenados alfabéticamente
  const proveedoresOrdenados = [...data.value].sort((a, b) =>
    (a.nombre || '').localeCompare(b.nombre || '')
  );

  // Primer y último proveedor alfabéticamente
  const primerProveedor = proveedoresOrdenados.length > 0 ? proveedoresOrdenados[0].nombre : 'N/A';
  const ultimoProveedor = proveedoresOrdenados.length > 0 ? proveedoresOrdenados[proveedoresOrdenados.length - 1].nombre : 'N/A';

  return {
    total,
    primerProveedor,
    ultimoProveedor
  };
});
/************************************************************************/
const filteredProveedores = computed(() => {
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
const fnBuscarRNC = async()=>{
  const rnc = datoscamposProveedores.value.rnc
  try {

//const response = await peticiones('https://demo.tmposrd.com/vista/buscadorRNCdgii.php',{'rnc':rnc},'POST')
        const response = await peticionesFetch(
          'https://demo.tmposrd.com/api2',
          `consultarrnc/${rnc}`,
          {},
          tokenCifrado.value,
          'GET'
        );

if (response) {
  console.log("response", response);
  toast.add({ severity: 'success', summary: 'Encontrado', detail: 'Datos Encontrados', life: 3000 });
  datoscamposProveedores.value.nombre = response.razon_social
}else{

toast.add({ severity: 'error', summary: 'Error', detail: 'Error, No se encuentran los Datos.', life: 3000 });
}
} catch (error) {
console.error('Error en la solicitud SOAP:', error);
toast.add({ severity: 'error', summary: 'Error', detail: 'Error, No se encuentran los Datos.', life: 3000 });
}
}
/************************************************************************/
</script>
<template>
<main class="content-wrapper">
  <!-- Header Profesional -->
  <div class="header-proveedores">
    <div class="header-content">
      <div class="header-title">
        <i class="pi pi-building header-icon"></i>
        <div>
          <h1 class="title">Proveedores</h1>
          <p class="subtitle">Gestión y administración de proveedores</p>
        </div>
      </div>
    </div>
  </div>

  <div class="w-full px-4 mt-5">
    <!-- Dashboard de Estadísticas -->
    <div class="dashboard-grid">
      <Card class="dashboard-card card-amber">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-amber">
              <i class="pi pi-building stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Total Proveedores</p>
              <p class="stat-value">{{ estadisticasProveedores.total }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-orange">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-orange">
              <i class="pi pi-sort-alpha-down stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Primer (A-Z)</p>
              <p class="stat-value-small">{{ estadisticasProveedores.primerProveedor }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-yellow">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-yellow">
              <i class="pi pi-sort-alpha-up stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Último (A-Z)</p>
              <p class="stat-value-small">{{ estadisticasProveedores.ultimoProveedor }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Toolbar -->
    <Card class="mt-4">
      <template #content>
        <div class="toolbar-proveedores">
          <div class="toolbar-actions">
            <Button
              icon="pi pi-refresh"
              label="Recargar"
              @click="fetchAndSetupData"
              severity="warning"
              class="action-button"
            />
            <Button
              icon="pi pi-plus"
              label="Nuevo Proveedor"
              @click="visiblecrear = true"
              severity="success"
              class="action-button"
            />
            <Button
              icon="pi pi-trash"
              label="Borrar Selección"
              @click="borrarSeleccionados"
              severity="danger"
              class="action-button"
            />
            <Button
              v-if="usuarioLocal.usuario === 'Soporte'"
              icon="pi pi-trash"
              label="Borrar Todo"
              @click="borrarTodo"
              severity="danger"
              outlined
              class="action-button"
            />
          </div>
          <div class="search-wrapper">
            <InputText
              v-model="searchQuery"
              placeholder="Buscar proveedores..."
              class="search-input"
            >
              <template #prepend>
                <i class="pi pi-search"></i>
              </template>
            </InputText>
          </div>
        </div>
      </template>
    </Card>

    <!-- Tabla de Proveedores -->
    <Card class="mt-4">
      <template #content>
        <DataTable
          :value="filteredProveedores"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          v-model:selection="selectedItems"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          class="proveedores-table"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column header="Opciones" frozen alignFrozen="right" style="min-width: 100px">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                @click="toggleProveedores($event, slotProps.data)"
                severity="info"
                text
                rounded
              />
              <Menu
                ref="menu"
                id="overlay_menu_Proveedores"
                :model="itemsProveedores"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="nombre" header="Nombre" style="min-width: 250px" sortable>
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-building text-amber-500"></i>
                <span class="font-semibold">{{ slotProps.data.nombre }}</span>
              </div>
            </template>
          </Column>
          <Column field="rnc" header="RNC" style="min-width: 150px" sortable></Column>
          <Column field="telefono" header="Teléfono" style="min-width: 150px" sortable></Column>
          <Column field="email" header="Email" style="min-width: 200px" sortable></Column>
          <Column field="encargado" header="Encargado" style="min-width: 200px" sortable></Column>
          <Column field="cuenta_bancaria" header="Cuenta Bancaria" style="min-width: 180px" sortable></Column>
          <Column field="direccion" header="Dirección" style="min-width: 250px" sortable></Column>
          <Column field="usuario" header="Usuario" style="min-width: 150px" sortable></Column>
        </DataTable>
      </template>
    </Card>
<!-- Modal Editar -->
<Dialog v-model:visible="visible" modal :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="modal-header-custom">
      <i class="pi pi-pencil mr-3 text-amber-500"></i>
      <span class="modal-title-custom">Editar Proveedor</span>
    </div>
  </template>

  <div class="dialog-content">
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-building section-icon"></i>
          <span class="section-title">Información del Proveedor</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 sm:col-span-8">
            <label class="field-label">
              <i class="pi pi-building mr-2"></i>
              Nombre
            </label>
            <InputText
              v-model="datoscampos.nombre"
              v-mayuscula
              class="w-full"
              placeholder="Ingrese el nombre del proveedor"
            />
          </div>
          <div class="col-span-12 sm:col-span-4">
            <label class="field-label">
              <i class="pi pi-id-card mr-2"></i>
              RNC
            </label>
            <InputText
              v-model="datoscampos.rnc"
              class="w-full"
              placeholder="RNC"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-phone mr-2"></i>
              Teléfono
            </label>
            <InputMask
              v-model="datoscampos.telefono"
              :mask="patronTelefono"
              :placeholder="patronTelefono"
              class="w-full"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-envelope mr-2"></i>
              Email
            </label>
            <InputText
              v-model="datoscampos.email"
              type="email"
              class="w-full"
              placeholder="email@ejemplo.com"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-user mr-2"></i>
              Encargado
            </label>
            <InputText
              v-model="datoscampos.encargado"
              v-mayuscula
              class="w-full"
              placeholder="Nombre del encargado"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-credit-card mr-2"></i>
              Cuenta Bancaria
            </label>
            <InputText
              v-model="datoscampos.cuenta_bancaria"
              class="w-full"
              placeholder="Número de cuenta"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-map-marker mr-2"></i>
              Dirección
            </label>
            <Textarea
              v-model="datoscampos.direccion"
              rows="3"
              class="w-full"
              placeholder="Dirección completa"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" @click="visible = false" severity="secondary" text />
      <Button label="Actualizar" icon="pi pi-check" @click="funcionActualizar" severity="info" />
    </div>
  </template>
</Dialog>
<!-- Modal Crear -->
<Dialog v-model:visible="visiblecrear" modal :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="modal-header-custom">
      <i class="pi pi-plus-circle mr-3 text-amber-500"></i>
      <span class="modal-title-custom">Nuevo Proveedor</span>
    </div>
  </template>

  <div class="dialog-content">
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-building section-icon"></i>
          <span class="section-title">Información del Proveedor</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 sm:col-span-8">
            <label class="field-label">
              <i class="pi pi-building mr-2"></i>
              Nombre
            </label>
            <InputText
              v-model="datoscamposProveedores.nombre"
              v-mayuscula
              class="w-full"
              placeholder="Ingrese el nombre del proveedor"
            />
          </div>
          <div class="col-span-12 sm:col-span-4">
            <label class="field-label">
              <i class="pi pi-id-card mr-2"></i>
              RNC
            </label>
            <InputGroup>
              <InputText
                placeholder="RNC"
                v-model="datoscamposProveedores.rnc"
              />
              <Button
                icon="pi pi-search"
                @click="fnBuscarRNC"
                severity="success"
              />
            </InputGroup>
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-phone mr-2"></i>
              Teléfono
            </label>
            <InputMask
              v-model="datoscamposProveedores.telefono"
              :mask="patronTelefono"
              :placeholder="patronTelefono"
              class="w-full"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-envelope mr-2"></i>
              Email
            </label>
            <InputText
              v-model="datoscamposProveedores.email"
              type="email"
              class="w-full"
              placeholder="email@ejemplo.com"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-user mr-2"></i>
              Encargado
            </label>
            <InputText
              v-model="datoscamposProveedores.encargado"
              v-mayuscula
              class="w-full"
              placeholder="Nombre del encargado"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-credit-card mr-2"></i>
              Cuenta Bancaria
            </label>
            <InputText
              v-model="datoscamposProveedores.cuenta_bancaria"
              class="w-full"
              placeholder="Número de cuenta"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-map-marker mr-2"></i>
              Dirección
            </label>
            <Textarea
              v-model="datoscamposProveedores.direccion"
              rows="3"
              class="w-full"
              placeholder="Dirección completa"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" @click="visiblecrear = false" severity="secondary" text />
      <Button label="Crear Proveedor" icon="pi pi-check" @click="funcionCrear" severity="success" />
    </div>
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>

<style scoped>
/* Header Profesional con tema amber */
.header-proveedores {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  padding: 2rem;
  margin: -1rem -1rem 2rem -1rem;
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 4px 6px rgba(245, 158, 11, 0.1);
  animation: slideIn 0.5s ease-out;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.header-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.subtitle {
  font-size: 1rem;
  margin: 0.25rem 0 0 0;
  opacity: 0.95;
  color: white;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.6s ease-out;
}

.dashboard-card {
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.card-amber { border-left: 4px solid #f59e0b; }
.card-orange { border-left: 4px solid #f97316; }
.card-yellow { border-left: 4px solid #eab308; }

.card-stat-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem;
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-amber { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.icon-orange { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
.icon-yellow { background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); }

.stat-icon {
  font-size: 1.75rem;
  color: white;
}

.stat-details {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1;
}

.stat-value-small {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Toolbar */
.toolbar-proveedores {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  transition: all 0.2s ease;
}

.search-wrapper {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

/* Tabla Profesional */
.proveedores-table {
  font-size: 0.95rem;
}

.proveedores-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(to bottom, #f59e0b, #d97706);
  color: white;
  font-weight: 600;
  padding: 1rem;
  border: none;
}

.proveedores-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.proveedores-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #fef3c7 !important;
  transform: scale(1.01);
}

/* Scrollbar amber personalizado */
.proveedores-table :deep(.p-datatable-wrapper)::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.proveedores-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 5px;
}

.proveedores-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #f59e0b, #d97706);
  border-radius: 5px;
}

.proveedores-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #d97706, #b45309);
}

/* Paginación amber */
.proveedores-table :deep(.p-paginator) {
  background: #f8fafc;
  border-top: 2px solid #f59e0b;
}

.proveedores-table :deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #d97706;
  color: white;
}

/* Modal personalizado */
.modal-header-custom {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-title-custom {
  color: #1e293b;
}

.dialog-content {
  padding: 1rem;
}

/* Cards de sección dentro del modal */
.section-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  background: linear-gradient(to right, #f59e0b, #d97706);
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem 0.5rem 0 0;
  margin: -1px -1px 0 -1px;
}

.section-icon {
  font-size: 1.25rem;
  color: white;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.field-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.field-label i {
  color: #f59e0b;
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-proveedores {
    padding: 1.5rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .toolbar-proveedores {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: center;
  }

  .search-wrapper {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .header-proveedores {
    padding: 1rem;
    margin: -0.5rem -0.5rem 1rem -0.5rem;
  }

  .header-icon {
    font-size: 2rem;
  }

  .title {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.875rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .stat-value-small {
    font-size: 1.1rem;
  }

  .toolbar-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-button {
    width: 100%;
  }
}

/* Animaciones */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Focus states con tema amber */
.proveedores-table :deep(.p-inputtext:focus),
.search-input:focus,
:deep(.p-inputtext:focus),
:deep(.p-dropdown:focus),
:deep(.p-textarea:focus) {
  border-color: #f59e0b;
  box-shadow: 0 0 0 0.2rem rgba(245, 158, 11, 0.25);
}
</style>
