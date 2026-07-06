<script setup>
import { ref, onMounted, nextTick, watchEffect, computed } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
import {enviarDatosPorPost,
  eliminarDatos,
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  peticionesFetchOffline,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  enviarSolicitudGet,
  generarCodigoUnico,
  peticiones,
  generarTablaFromStringJSON,
  mensajetoast,
  lasMayusculas} from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
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
const position = "top";
/************************************************************************/
const datoscampos = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const todosLosCotizacion = ref([]);
/************************************************************************/
/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'cotizacion');
    const jsonData = response;
    todosLosCotizacion.value = jsonData;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)
};
/************************************************************************/
function navigate(action) {
    const currentIndex = todosLosCotizacion.value.findIndex(cotizacion => cotizacion.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosCotizacion.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosCotizacion.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosCotizacion.value[newIndex];
    router.push({ path: `/editarcotizacion/${todosLosCotizacion.value[newIndex].id}` });
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
fetchAllData()
});
/************************************************************************/
async function funcionActualizar(e) {
  e.preventDefault();
  const url = link.value+api.value+"/actualizarcampos/cotizacion";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('updateData','cotizacion', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnConvertir = ()=>{
    localStorage.setItem('productosVenta', datoscampos.value.productos);
    router.push('/vender')
}
/************************************************************************/
const formatCurrency = (value) => {
  if (value) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  return '$0.00';
};
/************************************************************************/
const currentIndex = computed(() => {
  return todosLosCotizacion.value.findIndex(cotizacion => cotizacion.id == route.params.id);
});
const isFirst = computed(() => currentIndex.value === 0);
const isLast = computed(() => currentIndex.value === todosLosCotizacion.value.length - 1);
/************************************************************************/
</script>
<template>
<main class="editar-cotizacion-container">
  <div class="w-full">
    <!-- Header Profesional -->
    <div class="editar-cotizacion-header mb-4">
      <div class="editar-cotizacion-header-content">
        <div class="editar-cotizacion-icon-wrapper">
          <i class="pi pi-pencil editar-cotizacion-icon"></i>
        </div>
        <div>
          <h1 class="editar-cotizacion-title">Editar Cotización</h1>
          <p class="editar-cotizacion-subtitle">Modificar y actualizar información de la cotización #{{ datoscampos.no_cotizacion }}</p>
        </div>
      </div>
    </div>

    <!-- Toolbar de Navegación y Acciones -->
    <Card class="mb-4 toolbar-card">
      <template #content>
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <router-link to="/cotizacion">
              <Button icon="pi pi-home" label="Volver" severity="secondary" class="btn-action" />
            </router-link>
            <router-link to="/vender">
              <Button icon="pi pi-plus" label="Nueva Venta" severity="success" class="btn-action" />
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

          <Button
            icon="pi pi-file-export"
            label="Convertir en Factura"
            @click="fnConvertir"
            severity="warning"
            class="btn-convert"
          />
        </div>
      </template>
    </Card>
    <!-- Formulario de Edición -->
    <form @submit.prevent="funcionActualizar">
      <!-- Información de la Cotización y Montos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <!-- Información de la Cotización -->
        <Card class="section-card">
          <template #header>
            <div class="section-header">
              <i class="pi pi-info-circle section-icon"></i>
              <span class="section-title">Información de la Cotización</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">
                  <i class="pi pi-hashtag mr-2"></i>
                  No. Cotización
                </label>
                <InputText
                  v-model="datoscampos.no_cotizacion"
                  class="w-full"
                  readonly
                  disabled
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-calendar mr-2"></i>
                  Fecha Emisión
                </label>
                <InputText
                  v-model="datoscampos.fecha_emision"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-user mr-2"></i>
                  Vendedor
                </label>
                <InputText
                  v-model="datoscampos.vendedor"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-credit-card mr-2"></i>
                  Método Pago
                </label>
                <InputText
                  v-model="datoscampos.metodo_pago"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-tag mr-2"></i>
                  Estado
                </label>
                <Dropdown
                  v-model="datoscampos.estado_cotizacion"
                  :options="['CONVERTIDA', 'PENDIENTE']"
                  placeholder="Selecciona un estado"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-calendar-times mr-2"></i>
                  Vencimiento
                </label>
                <InputText
                  v-model="datoscampos.vencimiento"
                  class="w-full"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Montos y Totales -->
        <Card class="section-card">
          <template #header>
            <div class="section-header">
              <i class="pi pi-dollar section-icon"></i>
              <span class="section-title">Montos y Totales</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">
                  <i class="pi pi-money-bill mr-2"></i>
                  Subtotal
                </label>
                <InputText
                  v-model="datoscampos.subtotal"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-percentage mr-2"></i>
                  Impuesto
                </label>
                <InputText
                  v-model="datoscampos.impuesto"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-tag mr-2"></i>
                  Descuento
                </label>
                <InputText
                  v-model="datoscampos.descuento"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label total-label">
                  <i class="pi pi-money-bill mr-2"></i>
                  Total
                </label>
                <div class="total-display">
                  {{ formatCurrency(datoscampos.total) }}
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Información del Cliente -->
      <Card class="section-card mb-4">
        <template #header>
          <div class="section-header">
            <i class="pi pi-users section-icon"></i>
            <span class="section-title">Información del Cliente</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="field-label">
                <i class="pi pi-id-card mr-2"></i>
                Código Cliente
              </label>
              <InputText
                v-model="datoscampos.cod_cliente"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-user mr-2"></i>
                Nombre
              </label>
              <InputText
                v-model="datoscampos.nombre_cliente"
                class="w-full"
                v-mayuscula
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-phone mr-2"></i>
                Teléfono
              </label>
              <InputMask
                v-model="datoscampos.telefono_cliente"
                :mask="patronTelefono"
                :placeholder="patronTelefono"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-whatsapp mr-2"></i>
                WhatsApp
              </label>
              <InputMask
                v-model="datoscampos.whatsapp_cliente"
                :mask="patronTelefono"
                :placeholder="patronTelefono"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-envelope mr-2"></i>
                Email
              </label>
              <InputText
                v-model="datoscampos.email_cliente"
                type="email"
                class="w-full"
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-building mr-2"></i>
                RNC
              </label>
              <InputText
                v-model="datoscampos.rnc_cliente"
                class="w-full"
              />
            </div>

            <div class="md:col-span-2">
              <label class="field-label">
                <i class="pi pi-briefcase mr-2"></i>
                Nombre Comercial
              </label>
              <InputText
                v-model="datoscampos.nombre_comercial"
                class="w-full"
                v-mayuscula
              />
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-map-marker mr-2"></i>
                Dirección
              </label>
              <Textarea
                v-model="datoscampos.direccion_cliente"
                rows="2"
                class="w-full"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Información de Conversión y Adicional -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <!-- Información de Conversión -->
        <Card class="section-card">
          <template #header>
            <div class="section-header">
              <i class="pi pi-file-export section-icon"></i>
              <span class="section-title">Información de Conversión</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 gap-3">
              <div>
                <label class="field-label">
                  <i class="pi pi-file mr-2"></i>
                  No. Factura
                </label>
                <InputText
                  v-model="datoscampos.no_factura"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-calendar mr-2"></i>
                  Fecha Cambio
                </label>
                <InputText
                  v-model="datoscampos.fecha_cambio"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-building mr-2"></i>
                  Entidad Financiera
                </label>
                <InputText
                  v-model="datoscampos.entidad_financiera"
                  class="w-full"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Información Adicional -->
        <Card class="section-card">
          <template #header>
            <div class="section-header">
              <i class="pi pi-file-edit section-icon"></i>
              <span class="section-title">Información Adicional</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label class="field-label">
                  <i class="pi pi-calendar mr-2"></i>
                  Año
                </label>
                <InputText
                  v-model="datoscampos.year"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-calendar mr-2"></i>
                  Mes
                </label>
                <InputText
                  v-model="datoscampos.mes"
                  class="w-full"
                />
              </div>

              <div>
                <label class="field-label">
                  <i class="pi pi-clock mr-2"></i>
                  Hora
                </label>
                <InputText
                  v-model="datoscampos.hora"
                  class="w-full"
                />
              </div>
            </div>

            <div>
              <label class="field-label">
                <i class="pi pi-comment mr-2"></i>
                Nota
              </label>
              <Textarea
                v-model="datoscampos.nota"
                rows="2"
                class="w-full"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Sección de Productos - Full Width -->
      <Card class="section-card productos-card mb-4">
        <template #header>
          <div class="section-header">
            <i class="pi pi-shopping-cart section-icon"></i>
            <span class="section-title">Productos</span>
          </div>
        </template>
        <template #content>
          <div class="productos-table-wrapper">
            <div v-html="generarTablaFromStringJSON(datoscampos.productos)" class="productos-table"></div>
          </div>
        </template>
      </Card>

      <!-- Botón de Actualizar - Full Width -->
      <Button
        type="submit"
        label="Actualizar Datos"
        icon="pi pi-save"
        class="w-full btn-actualizar"
      />
    </form>

  </div>
</main>
<Toast />
</template>
<style scoped>
/* ===== Container Principal ===== */
.editar-cotizacion-container {
  padding: 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f0f3 100%);
  min-height: 100vh;
}

/* ===== Header Profesional ===== */
.editar-cotizacion-header {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 8px 20px rgba(147, 51, 234, 0.2);
  animation: slideIn 0.5s ease-out;
}

.editar-cotizacion-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editar-cotizacion-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.editar-cotizacion-icon {
  font-size: 1.5rem;
  color: white;
}

.editar-cotizacion-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editar-cotizacion-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0 0;
}

/* ===== Toolbar Card ===== */
.toolbar-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: visible;
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
}

.btn-action:hover,
.btn-nav:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-convert {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-convert:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

/* ===== Section Cards ===== */
.section-card {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.section-card :deep(.p-card-header) {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  padding: 0.75rem 1rem;
  border-radius: 10px 10px 0 0;
}

.section-card :deep(.p-card-body) {
  padding: 0;
}

.section-card :deep(.p-card-content) {
  padding: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.section-icon {
  font-size: 1.25rem;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

/* ===== Form Fields ===== */
.field-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
}

.field-label i {
  color: #9333ea;
  font-size: 0.875rem;
}

/* ===== Input Styles ===== */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-inputmask),
:deep(.p-textarea) {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

:deep(.p-inputtext:enabled:hover),
:deep(.p-dropdown:not(.p-disabled):hover),
:deep(.p-inputmask:enabled:hover),
:deep(.p-textarea:enabled:hover) {
  border-color: #9333ea;
}

:deep(.p-inputtext:enabled:focus),
:deep(.p-dropdown:not(.p-disabled).p-focus),
:deep(.p-inputmask:enabled:focus),
:deep(.p-textarea:enabled:focus) {
  border-color: #9333ea;
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
}

:deep(.p-inputtext:disabled) {
  background-color: #f3f4f6;
  opacity: 0.7;
}

/* ===== Total Display ===== */
.total-label {
  color: #9333ea;
  font-size: 0.8125rem;
}

.total-display {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
}

/* ===== Productos Card ===== */
.productos-card :deep(.p-card-content) {
  padding: 0.75rem;
}

.productos-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  background: white;
  max-height: 300px;
  overflow-y: auto;
}

.productos-table :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.productos-table :deep(th) {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  color: white;
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.productos-table :deep(td) {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-size: 0.8125rem;
}

.productos-table :deep(tr:hover) {
  background-color: #f9fafb;
}

.productos-table :deep(tr:last-child td) {
  border-bottom: none;
}

/* ===== Botón Actualizar ===== */
.btn-actualizar {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  border: none;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
}

.btn-actualizar:hover {
  background: linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(147, 51, 234, 0.4);
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

/* ===== Responsive Design ===== */
@media (max-width: 1024px) {
  .editar-cotizacion-container {
    padding: 0.75rem;
  }

  .editar-cotizacion-header {
    padding: 1rem;
  }

  .editar-cotizacion-title {
    font-size: 1.25rem;
  }

  .editar-cotizacion-subtitle {
    font-size: 0.8125rem;
  }

  .editar-cotizacion-icon-wrapper {
    width: 45px;
    height: 45px;
  }

  .editar-cotizacion-icon {
    font-size: 1.25rem;
  }
}

@media (max-width: 640px) {
  .editar-cotizacion-container {
    padding: 0.5rem;
  }

  .editar-cotizacion-header {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .editar-cotizacion-header-content {
    flex-direction: column;
    text-align: center;
  }

  .editar-cotizacion-title {
    font-size: 1.125rem;
  }

  .editar-cotizacion-subtitle {
    font-size: 0.75rem;
  }

  .toolbar-card :deep(.p-card-body) {
    padding: 0.75rem;
  }

  .section-card :deep(.p-card-content) {
    padding: 0.75rem;
  }

  .section-card :deep(.p-card-header) {
    padding: 0.625rem 0.75rem;
  }

  .productos-table :deep(th),
  .productos-table :deep(td) {
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  .field-label {
    font-size: 0.75rem;
  }

  .total-display {
    font-size: 1.125rem;
  }
}

/* ===== Custom Scrollbar ===== */
.productos-table-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.productos-table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.productos-table-wrapper::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  border-radius: 4px;
}

.productos-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%);
}
</style>
