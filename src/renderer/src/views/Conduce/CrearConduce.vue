
<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, generarCodigoUnico, peticiones, generarTablaFromStringJSON, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline,generadorCodigo } from '@/funciones/funciones.js';
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
const datoscamposConduce = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('conduce');
    datoscamposConduce.value = jsonData;
    const ultimaREC = await peticionesFetchOffline('getMaxValue', 'conduce', 'no_conduce');
    datoscamposConduce.value.no_conduce = generadorCodigo(ultimaREC[0], 'REC', 8);
};
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
await fetchAndSetupData()
});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/conduce";
  if (!datoscamposConduce.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposConduce.value.hasOwnProperty('created_at')) {
     datoscamposConduce.value.created_at = nfecha('timestamp')
     datoscamposConduce.value.updated_at = nfecha('timestamp')
    }
     datoscamposConduce.value.almacen = datosEmpresa.empresa.nombre
  const envioDatos = await peticionesFetchOffline('insertData', 'conduce', JSON.stringify(datoscamposConduce.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados con éxito.', life: 3000 });
Swal.fire({
  title: "Datos Agregados",
  text: "Que hacemos ahora?",
  icon: "warning",
  showCancelButton: true,
  confirmButtonText: "Agregar Otro!",
  cancelButtonText: "No, Regresar al Inicio!",
 }).then(async(result) => {
  if (result.isConfirmed) {
      fetchAndSetupData()
} else if (result.dismiss === Swal.DismissReason.cancel) {
    router.push({ path: `/conduce` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
</script>
<template>
<main class="crear-conduce-container">
  <div class="w-full">
    <!-- Header Profesional -->
    <div class="crear-conduce-header mb-4">
      <div class="crear-conduce-header-content">
        <div class="crear-conduce-icon-wrapper">
          <i class="pi pi-plus-circle crear-conduce-icon"></i>
        </div>
        <div>
          <h1 class="crear-conduce-title">Nuevo Conduce</h1>
          <p class="crear-conduce-subtitle">Crear documento de entrega y envío</p>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <Card class="mb-4 toolbar-card">
      <template #content>
        <div class="flex items-center gap-2">
          <router-link to="/conduce">
            <Button icon="pi pi-home" label="Volver" severity="secondary" class="btn-action" />
          </router-link>
        </div>
      </template>
    </Card>

    <!-- Formulario -->
    <form @submit.prevent="enviarDatos">
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
                v-model="datoscamposConduce.no_conduce"
                v-solonumeros
                readonly
                placeholder="Número de conduce"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-file mr-2"></i>
                No. Factura
              </label>
              <InputText
                v-model="datoscamposConduce.no_factura"
                v-solonumeros
                readonly
                placeholder="Número de factura"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-calendar mr-2"></i>
                Fecha
              </label>
              <DatePicker
                v-model="datoscamposConduce.fecha"
                showButtonBar
                fluid
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-calendar-times mr-2"></i>
                Vencimiento
              </label>
              <DatePicker
                v-model="datoscamposConduce.vencimiento"
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
                v-model="datoscamposConduce.cod_cliente"
                readonly
                placeholder="Código del cliente"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-user mr-2"></i>
                Cliente
              </label>
              <InputText
                v-model="datoscamposConduce.cliente"
                readonly
                placeholder="Nombre del cliente"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-phone mr-2"></i>
                Teléfono
              </label>
              <InputText
                v-model="datoscamposConduce.telefono"
                v-maska="patronTelefono"
                placeholder="Teléfono"
                class="w-full"
              />
            </div>

            <div class="md:col-span-2">
              <label class="field-label">
                <i class="pi pi-map-marker mr-2"></i>
                Dirección
              </label>
              <Textarea
                v-model="datoscamposConduce.direccion"
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
                v-model="datoscamposConduce.chofer"
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
                v-model="datoscamposConduce.placa"
                placeholder="Placa del vehículo"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-send mr-2"></i>
                Tipo de Entrega
              </label>
              <Dropdown
                v-model="datoscamposConduce.entrega"
                :options="['PENDIENTE','EN TRANSITO','ENTREGADO','PARCIAL','TOTAL']"
                placeholder="Seleccione tipo de entrega"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Card: Detalles del Conduce -->
      <Card class="mb-4 section-card">
        <template #header>
          <div class="section-header">
            <i class="pi pi-info-circle section-icon"></i>
            <span class="section-title">Detalles del Conduce</span>
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
                v-model="datoscamposConduce.total"
                v-solonumeros
                placeholder="Total del conduce"
                class="w-full"
                type="number"
                step="0.01"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-box mr-2"></i>
                Productos
              </label>
              <Textarea
                v-model="datoscamposConduce.productos"
                rows="4"
                placeholder="Listado de productos..."
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Botón de Envío -->
      <Button
        type="submit"
        label="Crear Conduce"
        icon="pi pi-check"
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
.crear-conduce-container {
  padding: 1rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%);
  min-height: 100vh;
}

/* ===== Header Profesional ===== */
.crear-conduce-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  animation: slideIn 0.5s ease-out;
}

.crear-conduce-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.crear-conduce-icon-wrapper {
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

.crear-conduce-icon {
  font-size: 1.75rem;
  color: white;
}

.crear-conduce-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.crear-conduce-subtitle {
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

.btn-action {
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-action:hover {
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

/* ===== Input Styles ===== */
.crear-conduce-container :deep(.p-inputtext),
.crear-conduce-container :deep(.p-dropdown),
.crear-conduce-container :deep(.p-calendar),
.crear-conduce-container :deep(.p-textarea),
.crear-conduce-container :deep(.p-inputgroup) {
  transition: all 0.3s ease;
}

.crear-conduce-container :deep(.p-inputtext:focus),
.crear-conduce-container :deep(.p-dropdown:focus),
.crear-conduce-container :deep(.p-calendar:focus-within),
.crear-conduce-container :deep(.p-textarea:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.crear-conduce-container :deep(.p-inputtext:disabled),
.crear-conduce-container :deep(.p-inputtext[readonly]) {
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
  .crear-conduce-container {
    padding: 0.75rem;
  }

  .crear-conduce-header {
    padding: 1.25rem;
  }

  .crear-conduce-title {
    font-size: 1.5rem;
  }

  .section-header {
    padding: 0.875rem 1rem;
  }
}

@media (max-width: 640px) {
  .crear-conduce-container {
    padding: 0.5rem;
  }

  .crear-conduce-header {
    padding: 1rem;
  }

  .crear-conduce-header-content {
    flex-direction: column;
    text-align: center;
  }

  .crear-conduce-title {
    font-size: 1.25rem;
  }

  .crear-conduce-subtitle {
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

