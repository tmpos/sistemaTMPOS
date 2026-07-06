<script setup>
import { ref, onMounted, nextTick, watchEffect,computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas,crearTablaSiNoExisteOffline,arrayToObjetoFromTablaOffline,peticionesFetchOffline  } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["cajero","cantidad","fecha","hora","turno","metodo","descripcion","mes","year","usuario","almacen"];
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
const datoscamposGastos = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const GastosEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposGastos.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'gastos');
    const jsonData = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre).reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('gastos');
  datoscamposGastos.value = campos;
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
await crearTablaSiNoExisteOffline('gastos', camposArray, toast);
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'gastos');
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
  const url = link.value+api.value+"/actualizarcampos/gastos";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'gastos', JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/gastos";
  if (datoscamposGastos.value.hasOwnProperty('created_at')) {
    datoscamposGastos.value.created_at = nfecha('timestamp');
    datoscamposGastos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'gastos', JSON.stringify(datoscamposGastos.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'gastos', id);
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
const itemsGastos = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleGastos = (event, rowData) => {
currentRowData.value = rowData;
itemsGastos.value = [
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'gastos', rowData.id);
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
const estadisticasGastos = computed(() => {
  const total = data.value.length;

  // Suma total de gastos
  const totalGastos = data.value.reduce((sum, item) => {
    const cantidad = parseFloat(item.cantidad) || 0;
    return sum + cantidad;
  }, 0);

  // Gastos del mes actual
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1; // 1-12
  const yearActual = fechaActual.getFullYear();

  const gastosMesActual = data.value.filter(item => {
    return parseInt(item.mes) === mesActual && parseInt(item.year) === yearActual;
  });

  const totalMesActual = gastosMesActual.reduce((sum, item) => {
    const cantidad = parseFloat(item.cantidad) || 0;
    return sum + cantidad;
  }, 0);

  // Gastos por método de pago
  const gastosPorMetodo = data.value.reduce((acc, item) => {
    const metodo = item.metodo || 'NO ESPECIFICADO';
    if (!acc[metodo]) {
      acc[metodo] = 0;
    }
    acc[metodo] += parseFloat(item.cantidad) || 0;
    return acc;
  }, {});

  return {
    total,
    totalGastos: totalGastos.toFixed(2),
    cantidadMesActual: gastosMesActual.length,
    totalMesActual: totalMesActual.toFixed(2),
    gastosPorMetodo
  };
});
/************************************************************************/
const filteredGastos = computed(() => {
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
  <!-- Header Profesional -->
  <div class="header-gastos">
    <div class="header-content">
      <div class="header-title">
        <i class="pi pi-wallet header-icon"></i>
        <div>
          <h1 class="title">Gastos</h1>
          <p class="subtitle">Gestión y control de gastos operacionales</p>
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
              <i class="pi pi-wallet stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Total Gastos</p>
              <p class="stat-value">{{ estadisticasGastos.total }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-orange">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-orange">
              <i class="pi pi-dollar stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Monto Total</p>
              <p class="stat-value-small">RD$ {{ estadisticasGastos.totalGastos }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-yellow">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-yellow">
              <i class="pi pi-calendar stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Este Mes</p>
              <p class="stat-value">{{ estadisticasGastos.cantidadMesActual }}</p>
              <p class="stat-sublabel">RD$ {{ estadisticasGastos.totalMesActual }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Toolbar -->
    <Card class="mt-4">
      <template #content>
        <div class="toolbar-gastos">
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
              label="Nuevo Gasto"
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
              placeholder="Buscar gastos..."
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

    <!-- Tabla de Gastos -->
    <Card class="mt-4">
      <template #content>
        <DataTable
          :value="filteredGastos"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          v-model:selection="selectedItems"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          class="gastos-table"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column header="Opciones" frozen alignFrozen="right" style="min-width: 100px">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                @click="toggleGastos($event, slotProps.data)"
                severity="info"
                text
                rounded
              />
              <Menu
                ref="menu"
                id="overlay_menu_Gastos"
                :model="itemsGastos"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="cajero" header="Cajero" style="min-width: 150px" sortable></Column>
          <Column field="cantidad" header="Cantidad" style="min-width: 130px" sortable>
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-dollar text-amber-500"></i>
                <span class="font-semibold">RD$ {{ parseFloat(slotProps.data.cantidad || 0).toFixed(2) }}</span>
              </div>
            </template>
          </Column>
          <Column field="fecha" header="Fecha" style="min-width: 120px" sortable></Column>
          <Column field="hora" header="Hora" style="min-width: 100px" sortable></Column>
          <Column field="metodo" header="Método" style="min-width: 140px" sortable>
            <template #body="slotProps">
              <Badge
                :value="slotProps.data.metodo"
                :severity="slotProps.data.metodo === 'EFECTIVO' ? 'success' : slotProps.data.metodo === 'TARJETA' ? 'info' : 'warning'"
                class="metodo-badge"
              />
            </template>
          </Column>
          <Column field="turno" header="Turno" style="min-width: 100px" sortable></Column>
          <Column field="descripcion" header="Descripción" style="min-width: 250px" sortable></Column>
          <Column field="mes" header="Mes" style="min-width: 80px" sortable></Column>
          <Column field="year" header="Año" style="min-width: 100px" sortable></Column>
          <Column field="usuario" header="Usuario" style="min-width: 150px" sortable></Column>
        </DataTable>
      </template>
    </Card>
<!-- Modal Editar -->
<Dialog v-model:visible="visible" modal :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
  <template #header>
    <div class="modal-header-custom">
      <i class="pi pi-pencil mr-3 text-amber-500"></i>
      <span class="modal-title-custom">Editar Gasto</span>
    </div>
  </template>

  <div class="dialog-content">
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-wallet section-icon"></i>
          <span class="section-title">Información del Gasto</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-user mr-2"></i>
              Cajero
            </label>
            <InputText
              v-model="datoscampos.cajero"
              class="w-full"
              placeholder="Nombre del cajero"
            />
          </div>
          <div class="col-span-12 sm:col-span-4">
            <label class="field-label">
              <i class="pi pi-dollar mr-2"></i>
              Cantidad
            </label>
            <InputText
              v-model="datoscampos.cantidad"
              v-solonumeros
              v-numeroFocusinOut
              v-decimales
              class="w-full"
              placeholder="0.00"
            />
          </div>
          <div class="col-span-12 sm:col-span-4">
            <label class="field-label">
              <i class="pi pi-calendar mr-2"></i>
              Fecha
            </label>
            <InputText
              v-model="datoscampos.fecha"
              v-datepicker
              class="w-full"
              placeholder="Fecha"
            />
          </div>
          <div class="col-span-12 sm:col-span-4">
            <label class="field-label">
              <i class="pi pi-clock mr-2"></i>
              Hora
            </label>
            <InputText
              v-model="datoscampos.hora"
              class="w-full"
              placeholder="Hora"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-sun mr-2"></i>
              Turno
            </label>
            <InputText
              v-model="datoscampos.turno"
              class="w-full"
              placeholder="Turno"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-credit-card mr-2"></i>
              Método de Pago
            </label>
            <Select
              v-model="datoscampos.metodo"
              :options="['EFECTIVO','TRANSFERENCIA','TARJETA']"
              class="w-full"
              placeholder="Seleccione método"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-align-left mr-2"></i>
              Descripción
            </label>
            <Textarea
              v-model="datoscampos.descripcion"
              rows="3"
              class="w-full"
              placeholder="Descripción del gasto"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-calendar-plus mr-2"></i>
              Mes
            </label>
            <InputText
              v-model="datoscampos.mes"
              class="w-full"
              placeholder="Mes"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-calendar mr-2"></i>
              Año
            </label>
            <InputText
              v-model="datoscampos.year"
              class="w-full"
              placeholder="Año"
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
      <span class="modal-title-custom">Nuevo Gasto</span>
    </div>
  </template>

  <div class="dialog-content">
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-wallet section-icon"></i>
          <span class="section-title">Información del Gasto</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-user mr-2"></i>
              Cajero
            </label>
            <InputText
              v-model="datoscamposGastos.cajero"
              class="w-full"
              placeholder="Nombre del cajero"
            />
          </div>
          <div class="col-span-12 sm:col-span-4">
            <label class="field-label">
              <i class="pi pi-dollar mr-2"></i>
              Cantidad
            </label>
            <InputText
              v-model="datoscamposGastos.cantidad"
              class="w-full"
              placeholder="0.00"
            />
          </div>
          <div class="col-span-12 sm:col-span-4">
            <label class="field-label">
              <i class="pi pi-calendar mr-2"></i>
              Fecha
            </label>
            <InputText
              v-model="datoscamposGastos.fecha"
              class="w-full"
              placeholder="Fecha"
            />
          </div>
          <div class="col-span-12 sm:col-span-4">
            <label class="field-label">
              <i class="pi pi-clock mr-2"></i>
              Hora
            </label>
            <InputText
              v-model="datoscamposGastos.hora"
              class="w-full"
              placeholder="Hora"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-sun mr-2"></i>
              Turno
            </label>
            <InputText
              v-model="datoscamposGastos.turno"
              class="w-full"
              placeholder="Turno"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-credit-card mr-2"></i>
              Método de Pago
            </label>
            <Select
              v-model="datoscamposGastos.metodo"
              :options="['EFECTIVO','TRANSFERENCIA','TARJETA']"
              class="w-full"
              placeholder="Seleccione método"
            />
          </div>
          <div class="col-span-12">
            <label class="field-label">
              <i class="pi pi-align-left mr-2"></i>
              Descripción
            </label>
            <Textarea
              v-model="datoscamposGastos.descripcion"
              rows="3"
              class="w-full"
              placeholder="Descripción del gasto"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-calendar-plus mr-2"></i>
              Mes
            </label>
            <InputText
              v-model="datoscamposGastos.mes"
              class="w-full"
              placeholder="Mes"
            />
          </div>
          <div class="col-span-12 sm:col-span-6">
            <label class="field-label">
              <i class="pi pi-calendar mr-2"></i>
              Año
            </label>
            <InputText
              v-model="datoscamposGastos.year"
              class="w-full"
              placeholder="Año"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" @click="visiblecrear = false" severity="secondary" text />
      <Button label="Crear Gasto" icon="pi pi-check" @click="funcionCrear" severity="success" />
    </div>
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>
<style scoped>
/* ===== HEADER ===== */
.content-wrapper {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(to bottom, #fffbeb, #fef3c7, #ffffff);
  padding-bottom: 2rem;
}

.header-gastos {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  padding: 2rem 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2), 0 2px 4px -1px rgba(245, 158, 11, 0.1);
  border-radius: 0 0 1.5rem 1.5rem;
  margin-bottom: 1.5rem;
  animation: slideIn 0.5s ease-out;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header-icon {
  font-size: 3rem;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin: 0;
  letter-spacing: -0.025em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0.25rem 0 0 0;
  font-weight: 500;
}

/* ===== DASHBOARD CARDS ===== */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.6s ease-out;
}

.dashboard-card {
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
  border: 2px solid transparent;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.card-amber {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
}

.card-amber:hover {
  border-color: #d97706;
}

.card-orange {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  border-color: #fb923c;
}

.card-orange:hover {
  border-color: #f97316;
}

.card-yellow {
  background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%);
  border-color: #eab308;
}

.card-yellow:hover {
  border-color: #ca8a04;
}

.card-stat-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0.5rem;
}

.stat-icon-wrapper {
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.icon-amber {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.icon-orange {
  background: linear-gradient(135deg, #fb923c, #f97316);
}

.icon-yellow {
  background: linear-gradient(135deg, #eab308, #ca8a04);
}

.stat-icon {
  font-size: 2rem;
  color: white;
}

.stat-details {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #78350f;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #92400e;
  margin: 0;
  line-height: 1;
}

.stat-value-small {
  font-size: 1.5rem;
  font-weight: 800;
  color: #92400e;
  margin: 0;
  line-height: 1;
}

.stat-sublabel {
  font-size: 0.875rem;
  color: #92400e;
  margin: 0.5rem 0 0 0;
  font-weight: 600;
}

/* ===== TOOLBAR ===== */
.toolbar-gastos {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.5rem;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  transition: all 0.3s ease;
  font-weight: 600;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
}

.search-wrapper {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

/* ===== TABLE ===== */
.gastos-table {
  border-radius: 0.75rem;
  overflow: hidden;
}

:deep(.gastos-table .p-datatable-header) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 1rem;
  border: none;
}

:deep(.gastos-table .p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-weight: 700;
  padding: 1rem;
  border: none;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

:deep(.gastos-table .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
  border-bottom: 1px solid #fef3c7;
}

:deep(.gastos-table .p-datatable-tbody > tr:hover) {
  background: linear-gradient(to right, #fffbeb, #fef3c7) !important;
  transform: scale(1.01);
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);
}

:deep(.gastos-table .p-datatable-tbody > tr > td) {
  padding: 1rem;
  border: none;
  color: #78350f;
  font-weight: 500;
}

:deep(.gastos-table .p-paginator) {
  background: #fef3c7;
  border: none;
  padding: 1rem;
  border-radius: 0 0 0.75rem 0.75rem;
}

:deep(.gastos-table .p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border-color: #f59e0b;
}

/* Custom scrollbar */
:deep(.gastos-table .p-datatable-wrapper::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.gastos-table .p-datatable-wrapper::-webkit-scrollbar-track) {
  background: #fef3c7;
  border-radius: 4px;
}

:deep(.gastos-table .p-datatable-wrapper::-webkit-scrollbar-thumb) {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 4px;
}

:deep(.gastos-table .p-datatable-wrapper::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(135deg, #d97706, #b45309);
}

/* Badge styles */
.metodo-badge {
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

/* ===== MODALS ===== */
.modal-header-custom {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #78350f;
}

.modal-title-custom {
  color: #78350f;
}

.dialog-content {
  padding: 1rem 0;
}

.section-card {
  border: 2px solid #fde68a;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.1);
  transition: all 0.3s ease;
}

.section-card:hover {
  border-color: #fbbf24;
  box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.15);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 0.75rem 0.75rem 0 0;
}

.section-icon {
  font-size: 1.5rem;
  color: #f59e0b;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #78350f;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #78350f;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

:deep(.p-inputtext),
:deep(.p-select),
:deep(.p-textarea) {
  border: 2px solid #fde68a;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

:deep(.p-inputtext:focus),
:deep(.p-select:focus),
:deep(.p-textarea:focus) {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

:deep(.p-inputtext:hover),
:deep(.p-select:hover),
:deep(.p-textarea:hover) {
  border-color: #fbbf24;
}

/* ===== ANIMATIONS ===== */
@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
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

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .header-icon {
    font-size: 2.5rem;
  }

  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .stat-value-small {
    font-size: 1.25rem;
  }
}

@media (max-width: 640px) {
  .header-gastos {
    padding: 1.5rem 1rem;
  }

  .header-title {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .header-icon {
    font-size: 2rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-gastos {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .search-wrapper {
    max-width: 100%;
  }

  .stat-icon-wrapper {
    width: 3.5rem;
    height: 3.5rem;
  }

  .stat-icon {
    font-size: 1.75rem;
  }
}
</style>
