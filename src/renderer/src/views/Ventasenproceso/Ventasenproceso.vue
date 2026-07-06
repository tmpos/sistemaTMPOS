<script setup>
import { ref, onMounted, nextTick, watchEffect, computed } from 'vue';
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, generarTablaFromStringJSON, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["cod_cliente","nombre","productos","turno","fecha","token","usuario"];
/************************************************************************/
import { useDatosEmpresa } from '@/stores';
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
const datoscamposVentasenproceso = ref({})
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const VentasenprocesoEditar = ref(null);
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposVentasenproceso.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'ventasenproceso');
    const jsonData = response;
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('ventasenproceso');
  datoscamposVentasenproceso.value = campos;
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
await crearTablaSiNoExisteOffline('ventasenproceso', camposArray.join(','), toast);
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'ventasenproceso');
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
  const url = link.value+api.value+"/actualizarcampos/ventasenproceso";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData', 'ventasenproceso', JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/ventasenproceso";
  if (datoscamposVentasenproceso.value.hasOwnProperty('created_at')) {
    datoscamposVentasenproceso.value.created_at = nfecha('timestamp');
    datoscamposVentasenproceso.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData', 'ventasenproceso', JSON.stringify(datoscamposVentasenproceso.value));
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
                                const envioDatos = await peticionesFetchOffline('deleteEntry', 'ventasenproceso', id);
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
const itemsVentasenproceso = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleVentasenproceso = (event, rowData) => {
currentRowData.value = rowData;
itemsVentasenproceso.value = [
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
                        const datosFactura = await peticionesFetchOffline('deleteEntry', 'ventasenproceso', rowData.id);
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
const estadisticasVentas = computed(() => {
  const total = data.value.length;
  const manana = data.value.filter(item => item.turno === 'MAÑANA' || item.turno === 'MANANA').length;
  const tarde = data.value.filter(item => item.turno === 'TARDE').length;
  const noche = data.value.filter(item => item.turno === 'NOCHE').length;

  // Contar total de productos
  let totalProductos = 0;
  data.value.forEach(venta => {
    if (venta.productos) {
      try {
        const productos = JSON.parse(venta.productos);
        if (Array.isArray(productos)) {
          totalProductos += productos.length;
        }
      } catch (e) {
        // Si no es JSON válido, contar como 1 producto
        totalProductos += 1;
      }
    }
  });

  return { total, manana, tarde, noche, totalProductos };
});

const getSeverityTurno = (turno) => {
  switch (turno?.toUpperCase()) {
    case 'MAÑANA':
    case 'MANANA':
      return 'info';
    case 'TARDE':
      return 'warning';
    case 'NOCHE':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const rowClass = (data) => {
  const turno = data.turno?.toUpperCase();
  if (turno === 'MAÑANA' || turno === 'MANANA') return 'row-manana';
  if (turno === 'TARDE') return 'row-tarde';
  if (turno === 'NOCHE') return 'row-noche';
  return '';
};
/************************************************************************/
const filteredVentasenproceso = computed(() => {
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
</script>
<template>
<main class="content-wrapper">
  <!-- Header Profesional -->
  <div class="header-ventas">
    <div class="header-content">
      <div class="header-title">
        <i class="pi pi-shopping-cart header-icon"></i>
        <div>
          <h1 class="title">Ventas en Proceso</h1>
          <p class="subtitle">Gestión de ventas activas y pendientes</p>
        </div>
      </div>
    </div>
  </div>

  <div class="w-full px-4 mt-5">
    <!-- Dashboard de Estadísticas -->
    <div class="dashboard-grid">
      <Card class="dashboard-card card-blue">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-blue">
              <i class="pi pi-shopping-cart stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Total Ventas</p>
              <p class="stat-value">{{ estadisticasVentas.total }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-info">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-info">
              <i class="pi pi-sun stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Turno Mañana</p>
              <p class="stat-value">{{ estadisticasVentas.manana }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-warning">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-warning">
              <i class="pi pi-cloud stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Turno Tarde</p>
              <p class="stat-value">{{ estadisticasVentas.tarde }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-dark">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-dark">
              <i class="pi pi-moon stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Turno Noche</p>
              <p class="stat-value">{{ estadisticasVentas.noche }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="dashboard-card card-success">
        <template #content>
          <div class="card-stat-content">
            <div class="stat-icon-wrapper icon-success">
              <i class="pi pi-box stat-icon"></i>
            </div>
            <div class="stat-details">
              <p class="stat-label">Total Productos</p>
              <p class="stat-value">{{ estadisticasVentas.totalProductos }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Toolbar -->
    <Card class="mt-4">
      <template #content>
        <div class="toolbar-ventas">
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
              label="Nueva Venta"
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
              placeholder="Buscar ventas..."
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

    <!-- Tabla de Ventas -->
    <Card class="mt-4">
      <template #content>
        <DataTable
          :value="filteredVentasenproceso"
          :rowClass="rowClass"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          v-model:selection="selectedItems"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          class="ventas-table"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column header="Opciones" frozen alignFrozen="right" style="min-width: 100px">
            <template #body="slotProps">
              <Button
                icon="pi pi-cog"
                @click="toggleVentasenproceso($event, slotProps.data)"
                severity="info"
                text
                rounded
              />
              <Menu
                ref="menu"
                id="overlay_menu_Ventasenproceso"
                :model="itemsVentasenproceso"
                :popup="true"
              />
            </template>
          </Column>
          <Column field="cod_cliente" header="Código" style="min-width: 120px" sortable></Column>
          <Column field="nombre" header="Cliente" style="min-width: 250px" sortable></Column>
          <Column field="turno" header="Turno" style="min-width: 120px" sortable>
            <template #body="slotProps">
              <Badge :value="slotProps.data.turno" :severity="getSeverityTurno(slotProps.data.turno)" />
            </template>
          </Column>
          <Column field="fecha" header="Fecha" style="min-width: 150px" sortable></Column>
          <Column field="token" header="Token" style="min-width: 150px"></Column>
          <Column field="usuario" header="Usuario" style="min-width: 150px" sortable></Column>
        </DataTable>
      </template>
    </Card>
<!-- Modal Editar -->
<Dialog v-model:visible="visible" modal :style="{ width: '60rem' }" :breakpoints="{ '1199px': '85vw', '575px': '95vw' }">
  <template #header>
    <div class="modal-header-custom">
      <i class="pi pi-pencil mr-3 text-blue-500"></i>
      <span class="modal-title-custom">Editar Venta en Proceso</span>
    </div>
  </template>

  <div class="dialog-content">
    <!-- Card: Información del Cliente -->
    <Card class="mb-4 section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-user section-icon"></i>
          <span class="section-title">Información del Cliente</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div class="md:col-span-4">
            <label class="field-label">
              <i class="pi pi-hashtag mr-2"></i>
              Código Cliente
            </label>
            <InputText v-model="datoscampos.cod_cliente" class="w-full" placeholder="Código" />
          </div>
          <div class="md:col-span-8">
            <label class="field-label">
              <i class="pi pi-user mr-2"></i>
              Nombre
            </label>
            <InputText v-model="datoscampos.nombre" v-mayuscula class="w-full" placeholder="Nombre del cliente" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Card: Detalles de la Venta -->
    <Card class="mb-4 section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-info-circle section-icon"></i>
          <span class="section-title">Detalles de la Venta</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="field-label">
              <i class="pi pi-clock mr-2"></i>
              Turno
            </label>
            <InputText v-model="datoscampos.turno" class="w-full" placeholder="Turno" />
          </div>
          <div>
            <label class="field-label">
              <i class="pi pi-calendar mr-2"></i>
              Fecha
            </label>
            <InputText v-model="datoscampos.fecha" class="w-full" placeholder="Fecha" />
          </div>
          <div>
            <label class="field-label">
              <i class="pi pi-key mr-2"></i>
              Token
            </label>
            <InputText v-model="datoscampos.token" class="w-full" placeholder="Token" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Card: Productos -->
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-box section-icon"></i>
          <span class="section-title">Productos</span>
        </div>
      </template>
      <template #content>
        <div class="productos-table-wrapper">
          <div v-html="generarTablaFromStringJSON(datoscampos.productos)" class="productos-table"></div>
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
<Dialog v-model:visible="visiblecrear" modal :style="{ width: '60rem' }" :breakpoints="{ '1199px': '85vw', '575px': '95vw' }">
  <template #header>
    <div class="modal-header-custom">
      <i class="pi pi-plus-circle mr-3 text-blue-500"></i>
      <span class="modal-title-custom">Nueva Venta en Proceso</span>
    </div>
  </template>

  <div class="dialog-content">
    <!-- Card: Información del Cliente -->
    <Card class="mb-4 section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-user section-icon"></i>
          <span class="section-title">Información del Cliente</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div class="md:col-span-4">
            <label class="field-label">
              <i class="pi pi-hashtag mr-2"></i>
              Código Cliente
            </label>
            <InputText v-model="datoscamposVentasenproceso.cod_cliente" class="w-full" placeholder="Código" />
          </div>
          <div class="md:col-span-8">
            <label class="field-label">
              <i class="pi pi-user mr-2"></i>
              Nombre
            </label>
            <InputText v-model="datoscamposVentasenproceso.nombre" v-mayuscula class="w-full" placeholder="Nombre del cliente" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Card: Detalles de la Venta -->
    <Card class="mb-4 section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-info-circle section-icon"></i>
          <span class="section-title">Detalles de la Venta</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="field-label">
              <i class="pi pi-clock mr-2"></i>
              Turno
            </label>
            <InputText v-model="datoscamposVentasenproceso.turno" class="w-full" placeholder="Turno" />
          </div>
          <div>
            <label class="field-label">
              <i class="pi pi-calendar mr-2"></i>
              Fecha
            </label>
            <InputText v-model="datoscamposVentasenproceso.fecha" class="w-full" placeholder="Fecha" />
          </div>
          <div>
            <label class="field-label">
              <i class="pi pi-key mr-2"></i>
              Token
            </label>
            <InputText v-model="datoscamposVentasenproceso.token" class="w-full" placeholder="Token" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Card: Productos -->
    <Card class="section-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-box section-icon"></i>
          <span class="section-title">Productos</span>
        </div>
      </template>
      <template #content>
        <div>
          <label class="field-label">
            <i class="pi pi-list mr-2"></i>
            Productos (JSON)
          </label>
          <Textarea v-model="datoscamposVentasenproceso.productos" rows="5" class="w-full" placeholder='[{"producto":"Nombre","cantidad":1,"precio":100}]' />
        </div>
      </template>
    </Card>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" @click="visiblecrear = false" severity="secondary" text />
      <Button label="Crear Venta" icon="pi pi-check" @click="funcionCrear" severity="success" />
    </div>
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Toast />
  </div>
</main>
</template>

<style scoped>
/* Header Profesional con tema azul */
.header-ventas {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  padding: 2rem;
  margin: -1rem -1rem 2rem -1rem;
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
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
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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

.card-blue { border-left: 4px solid #3b82f6; }
.card-info { border-left: 4px solid #06b6d4; }
.card-warning { border-left: 4px solid #f59e0b; }
.card-dark { border-left: 4px solid #6366f1; }
.card-success { border-left: 4px solid #10b981; }

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

.icon-blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.icon-info { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
.icon-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.icon-dark { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
.icon-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }

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

/* Toolbar */
.toolbar-ventas {
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
.ventas-table {
  font-size: 0.95rem;
}

.ventas-table :deep(.p-datatable-thead > tr > th) {
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
  color: white;
  font-weight: 600;
  padding: 1rem;
  border: none;
}

.ventas-table :deep(.p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.ventas-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: #eff6ff !important;
  transform: scale(1.01);
}

/* Row classes por turno */
.ventas-table :deep(.row-manana) {
  background-color: #dbeafe;
}

.ventas-table :deep(.row-tarde) {
  background-color: #fef3c7;
}

.ventas-table :deep(.row-noche) {
  background-color: #e0e7ff;
}

/* Scrollbar azul personalizado */
.ventas-table :deep(.p-datatable-wrapper)::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.ventas-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 5px;
}

.ventas-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
  border-radius: 5px;
}

.ventas-table :deep(.p-datatable-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #2563eb, #1d4ed8);
}

/* Paginación azul */
.ventas-table :deep(.p-paginator) {
  background: #f8fafc;
  border-top: 2px solid #3b82f6;
}

.ventas-table :deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #2563eb;
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
  background: linear-gradient(to right, #3b82f6, #2563eb);
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
  color: #3b82f6;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.field-label i {
  color: #3b82f6;
  font-size: 1rem;
}

/* Productos Table Wrapper */
.productos-table-wrapper {
  max-height: 400px;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #f8fafc;
}

.productos-table {
  width: 100%;
}

.productos-table :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.productos-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
}

.productos-table :deep(th) {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: white;
  border-bottom: 2px solid #2563eb;
}

.productos-table :deep(td) {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.productos-table :deep(tr:hover td) {
  background-color: #eff6ff;
}

.productos-table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.productos-table-wrapper::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.productos-table-wrapper::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
  border-radius: 4px;
}

.productos-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #2563eb, #1d4ed8);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-ventas {
    padding: 1.5rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .dashboard-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .toolbar-ventas {
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
  .header-ventas {
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

/* Focus states con tema azul */
.ventas-table :deep(.p-inputtext:focus),
.search-input:focus,
:deep(.p-inputtext:focus),
:deep(.p-dropdown:focus),
:deep(.p-textarea:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}
</style>
