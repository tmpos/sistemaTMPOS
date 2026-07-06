
<script setup>
import { ref, onMounted, nextTick, watchEffect, computed } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, generarCodigoUnico, peticiones, generarTablaFromStringJSON, enviarSolicitudGet, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
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
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
const todosLosconduce = ref([]);
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'conduce');
    const jsonData = response;
    todosLosconduce.value = response;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
};
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosconduce.value.findIndex(notacredito => notacredito.id == route.params.id);
    if (currentIndex === -1) return;
    let newIndex;
    switch (action) {
        case 'primero':
            newIndex = 0;
            break;
        case 'anterior':
            newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            break;
        case 'siguiente':
            newIndex = currentIndex + 1 < todosLosconduce.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosconduce.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosconduce.value[newIndex];
    router.push({ path: `/editarconduce/${todosLosconduce.value[newIndex].id}` });
}
/************************************************************************/
onMounted(async() => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCifrado.value = await encryptarPassword(token.value, 10);
await fetchAllData()
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/conduce";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData', 'conduce', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const borrarEntrada = ()=>{

}
/************************************************************************/
const fnConduce = (index,campo,checked,data)=>{
  console.log("data", data);
  console.log("checked", checked);
  console.log("campo", campo);
  console.log("index", index);

}
/************************************************************************/
const currentIndex = computed(() => {
  return todosLosconduce.value.findIndex(conduce => conduce.id == route.params.id);
});

const isFirst = computed(() => currentIndex.value === 0);
const isLast = computed(() => currentIndex.value === todosLosconduce.value.length - 1);
/************************************************************************/
</script>
<template>
<main class="editar-conduce-container">
  <div class="w-full">
    <!-- Header Profesional -->
    <div class="editar-conduce-header mb-4">
      <div class="editar-conduce-header-content">
        <div class="editar-conduce-icon-wrapper">
          <i class="pi pi-pencil editar-conduce-icon"></i>
        </div>
        <div>
          <h1 class="editar-conduce-title">Editar Conduce</h1>
          <p class="editar-conduce-subtitle">Modificar documento de entrega #{{ datoscampos.no_conduce }}</p>
        </div>
      </div>
    </div>

    <!-- Toolbar de Navegación y Acciones -->
    <Card class="mb-4 toolbar-card">
      <template #content>
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <router-link to="/conduce">
              <Button icon="pi pi-home" label="Volver" severity="secondary" class="btn-action" />
            </router-link>
            <router-link to="/crearconduce">
              <Button icon="pi pi-plus" label="Nuevo Conduce" severity="success" class="btn-action" />
            </router-link>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              icon="pi pi-step-backward-alt"
              @click="navigate('primero')"
              :disabled="isFirst"
              severity="secondary"
              v-tooltip.bottom="'Primero'"
              class="btn-nav"
            />
            <Button
              icon="pi pi-chevron-left"
              @click="navigate('anterior')"
              :disabled="isFirst"
              severity="secondary"
              v-tooltip.bottom="'Anterior'"
              class="btn-nav"
            />
            <Button
              icon="pi pi-chevron-right"
              @click="navigate('siguiente')"
              :disabled="isLast"
              severity="secondary"
              v-tooltip.bottom="'Siguiente'"
              class="btn-nav"
            />
            <Button
              icon="pi pi-step-forward-alt"
              @click="navigate('ultimo')"
              :disabled="isLast"
              severity="secondary"
              v-tooltip.bottom="'Último'"
              class="btn-nav"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Formulario de Edición -->
    <form @submit.prevent="funcionActualizar">
      <!-- Card: Información del Conduce -->
      <Card class="mb-4 section-card">
        <template #header>
          <div class="section-header">
            <i class="pi pi-file section-icon"></i>
            <span class="section-title">Información del Conduce</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="field-label">
                <i class="pi pi-hashtag mr-2"></i>
                No. Conduce
              </label>
              <InputText
                v-model="datoscampos.no_conduce"
                v-solonumeros
                readonly
                disabled
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-file mr-2"></i>
                No. Factura
              </label>
              <InputText
                v-model="datoscampos.no_factura"
                v-solonumeros
                readonly
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-calendar mr-2"></i>
                Fecha
              </label>
              <InputText
                v-model="datoscampos.fecha"
                readonly
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-calendar-times mr-2"></i>
                Vencimiento
              </label>
              <DatePicker
                v-model="datoscampos.vencimiento"
                showButtonBar
                fluid
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Card: Información del Cliente -->
      <Card class="mb-4 section-card">
        <template #header>
          <div class="section-header">
            <i class="pi pi-user section-icon"></i>
            <span class="section-title">Información del Cliente</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="field-label">
                <i class="pi pi-id-card mr-2"></i>
                Código Cliente
              </label>
              <InputText
                v-model="datoscampos.cod_cliente"
                readonly
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-user mr-2"></i>
                Cliente
              </label>
              <InputText
                v-model="datoscampos.cliente"
                readonly
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-phone mr-2"></i>
                Teléfono
              </label>
              <InputMask
                v-model="datoscampos.telefono"
                :mask="patronTelefono"
                :placeholder="patronTelefono"
                fluid
                class="w-full"
              />
            </div>

            <div class="md:col-span-2">
              <label class="field-label">
                <i class="pi pi-map-marker mr-2"></i>
                Dirección
              </label>
              <Textarea
                v-model="datoscampos.direccion"
                rows="3"
                placeholder="Dirección de entrega"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Card: Información de Entrega -->
      <Card class="mb-4 section-card">
        <template #header>
          <div class="section-header">
            <i class="pi pi-truck section-icon"></i>
            <span class="section-title">Información de Entrega</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="field-label">
                <i class="pi pi-user mr-2"></i>
                Chofer
              </label>
              <InputText
                v-model="datoscampos.chofer"
                v-mayuscula
                placeholder="Nombre del chofer"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-car mr-2"></i>
                Placa
              </label>
              <InputText
                v-model="datoscampos.placa"
                placeholder="Placa del vehículo"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-send mr-2"></i>
                Estado de Entrega
              </label>
              <Dropdown
                editable
                v-model="datoscampos.entrega"
                :options="['PENDIENTE','EN TRANSITO','ENTREGADO','PARCIAL','TOTAL']"
                placeholder="Seleccione estado"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Card: Detalles y Productos -->
      <Card class="mb-4 section-card">
        <template #header>
          <div class="section-header">
            <i class="pi pi-box section-icon"></i>
            <span class="section-title">Detalles y Productos</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="field-label">
                <i class="pi pi-dollar mr-2"></i>
                Total
              </label>
              <InputText
                v-model="datoscampos.total"
                v-solonumeros
                readonly
                class="w-full"
                type="number"
                step="0.01"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-list mr-2"></i>
                Productos
              </label>
              <div class="productos-table-wrapper">
                <div v-html="generarTablaFromStringJSON(
                  datoscampos.productos,
                  true,
                  false,
                  null,
                  null,
                  'conduce',
                  null,
                  null,
                  true,
                  'entregado',
                  fnConduce
                )" class="productos-table">
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Botón de Actualizar -->
      <Button
        type="submit"
        label="Actualizar Conduce"
        icon="pi pi-save"
        class="w-full btn-submit"
        size="large"
      />
    </form>
  </div>

  <Toast />
</main>
</template>
<style scoped>
/* ===== Container Principal ===== */
.editar-conduce-container {
  padding: 1rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%);
  min-height: 100vh;
}

/* ===== Header Profesional ===== */
.editar-conduce-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  animation: slideIn 0.5s ease-out;
}

.editar-conduce-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editar-conduce-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.editar-conduce-icon {
  font-size: 1.75rem;
  color: white;
}

.editar-conduce-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editar-conduce-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* ===== Toolbar Card ===== */
.toolbar-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
}

.toolbar-card :deep(.p-card-body) {
  padding: 1rem;
}

.toolbar-card :deep(.p-card-content) {
  padding: 0;
}

.btn-action,
.btn-nav {
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-action:hover,
.btn-nav:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ===== Section Cards ===== */
.section-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-out;
}

.section-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.section-card :deep(.p-card-body) {
  padding: 0;
}

.section-card :deep(.p-card-content) {
  padding: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px 12px 0 0;
}

.section-icon {
  font-size: 1.25rem;
  color: white;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

/* ===== Field Labels ===== */
.field-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.field-label i {
  color: #10b981;
  font-size: 0.875rem;
}

/* ===== Productos Table Wrapper ===== */
.productos-table-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  border-radius: 8px;
  background: white;
  max-height: 400px;
  border: 1px solid #e5e7eb;
}

.productos-table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.productos-table-wrapper::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.productos-table-wrapper::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 4px;
}

.productos-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.productos-table :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.productos-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.productos-table :deep(th) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 0.75rem 0.875rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8125rem;
  white-space: nowrap;
  border-bottom: 2px solid #059669;
}

.productos-table :deep(td) {
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-size: 0.8125rem;
}

.productos-table :deep(tbody tr) {
  transition: background-color 0.2s ease;
}

.productos-table :deep(tbody tr:hover) {
  background-color: #f0fdf4;
}

.productos-table :deep(tbody tr:last-child td) {
  border-bottom: none;
}

/* ===== Input Styles ===== */
.editar-conduce-container :deep(.p-inputtext),
.editar-conduce-container :deep(.p-dropdown),
.editar-conduce-container :deep(.p-calendar),
.editar-conduce-container :deep(.p-textarea),
.editar-conduce-container :deep(.p-inputmask),
.editar-conduce-container :deep(.p-inputgroup) {
  transition: all 0.3s ease;
}

.editar-conduce-container :deep(.p-inputtext:focus),
.editar-conduce-container :deep(.p-dropdown:focus),
.editar-conduce-container :deep(.p-calendar:focus-within),
.editar-conduce-container :deep(.p-textarea:focus),
.editar-conduce-container :deep(.p-inputmask:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.editar-conduce-container :deep(.p-inputtext:disabled),
.editar-conduce-container :deep(.p-inputtext[readonly]) {
  background-color: #f3f4f6;
  color: #6b7280;
  opacity: 0.7;
}

/* ===== Submit Button ===== */
.btn-submit {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  font-size: 1.125rem;
  font-weight: 700;
  padding: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-submit:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-submit:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

/* ===== Animations ===== */
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
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Responsive Design ===== */
@media (max-width: 1024px) {
  .editar-conduce-container {
    padding: 0.75rem;
  }

  .editar-conduce-header {
    padding: 1.25rem;
  }

  .editar-conduce-title {
    font-size: 1.5rem;
  }

  .section-header {
    padding: 0.875rem 1rem;
  }
}

@media (max-width: 640px) {
  .editar-conduce-container {
    padding: 0.5rem;
  }

  .editar-conduce-header {
    padding: 1rem;
  }

  .editar-conduce-header-content {
    flex-direction: column;
    text-align: center;
  }

  .editar-conduce-title {
    font-size: 1.25rem;
  }

  .editar-conduce-subtitle {
    font-size: 0.75rem;
  }

  .section-header {
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
  }

  .btn-submit {
    font-size: 1rem;
    padding: 0.875rem;
  }
}
</style>

