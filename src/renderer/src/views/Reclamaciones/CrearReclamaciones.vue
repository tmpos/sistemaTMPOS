
<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, generarCodigoUnico, peticiones, generadorCodigo, agregarDiasLaborablesalaFechaActual, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
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
const intitucionesData = ref([])
const value = ref('0');
/************************************************************************/
const datoscamposReclamaciones = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('reclamaciones');
    datoscamposReclamaciones.value = jsonData;
    datoscamposReclamaciones.value.estado_reclamacion = 'ABIERTO';
    datoscamposReclamaciones.value.resultado_reclamacion = 'EN ESPERA';
    datoscamposReclamaciones.value.representante = datosEmpresa.usuario.nombre;
    datoscamposReclamaciones.value.fecha_emision = nfecha('fecha');
    datoscamposReclamaciones.value.fecha_respuesta = agregarDiasLaborablesalaFechaActual(7);
    datoscamposReclamaciones.value.fecha_vencimiento = agregarDiasLaborablesalaFechaActual(15);
    datoscamposReclamaciones.value.institucion = intitucionesData.value[0];

      const ultimaREC = await peticionesFetchOffline('getMaxValue', 'reclamaciones', 'no_reclamacion');

    datoscamposReclamaciones.value.no_reclamacion = generadorCodigo(ultimaREC[0], 'REC', 8);
};
/************************************************************************/
const fetchIntituciones = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'instituciones');
    intitucionesData.value = response;
   // intitucionesDataNames.value = response.map(intitucion=>intitucion.nombre);
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from intituciones', 
      life: 3000 
    });
  }
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
await fetchIntituciones()
await fetchAndSetupData()
});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/reclamaciones";
  if (!datoscamposReclamaciones.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposReclamaciones.value.hasOwnProperty('created_at')) {
     datoscamposReclamaciones.value.created_at = nfecha('timestamp')
     datoscamposReclamaciones.value.updated_at = nfecha('timestamp')
    }

     datoscamposReclamaciones.value.institucion = datoscamposReclamaciones.value.institucion.nombre


  const envioDatos = await peticionesFetchOffline('insertData', 'reclamaciones', JSON.stringify(datoscamposReclamaciones.value));
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
    router.push({ path: `/reclamaciones` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnBuscarFactura = async()=>{
    const factura = datoscamposReclamaciones.value.no_factura
    if(!factura){
       toast.add({ severity: 'error', summary: 'Error', detail: 'Debe Agregar una Factura', life: 3000 });
    }

  const verificaFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', factura);

    if(!verificaFactura){
       toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentra la Factura', life: 3000 });
    
    }else{

      const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', verificaFactura.cod_cliente);
     datoscamposReclamaciones.value.nombre = verificaFactura.nombre_cliente
     datoscamposReclamaciones.value.telefono = datosCliente?.telefono || 'N/A'
     datoscamposReclamaciones.value.email = datosCliente?.email || 'N/A'
     datoscamposReclamaciones.value.whatsapp = datosCliente?.whatsapp || 'N/A'
     datoscamposReclamaciones.value.institucion = verificaFactura.institucion || 'N/A'
     datoscamposReclamaciones.value.fecha_compra = verificaFactura.fecha_emision || nfecha('fecha')


    }




}
/************************************************************************/
</script>
<template>
<main class="crear-reclamacion-container">
  <div class="w-full">
    <!-- Header Profesional -->
    <div class="crear-reclamacion-header mb-4">
      <div class="crear-reclamacion-header-content">
        <div class="crear-reclamacion-icon-wrapper">
          <i class="pi pi-plus-circle crear-reclamacion-icon"></i>
        </div>
        <div>
          <h1 class="crear-reclamacion-title">Nueva Reclamación</h1>
          <p class="crear-reclamacion-subtitle">Registrar una nueva reclamación de cliente</p>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <Card class="mb-4 toolbar-card">
      <template #content>
        <div class="flex items-center gap-2">
          <router-link to="/reclamaciones">
            <Button icon="pi pi-home" label="Volver" severity="secondary" class="btn-action" />
          </router-link>
        </div>
      </template>
    </Card>
    <!-- Card de Información de Reclamación -->
    <Card class="mb-4 info-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-info-circle section-icon"></i>
          <span class="section-title">Información de Reclamación</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="field-label">
              <i class="pi pi-hashtag mr-2"></i>
              No. Reclamación
            </label>
            <InputText
              v-model="datoscamposReclamaciones.no_reclamacion"
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
              v-model="datoscamposReclamaciones.fecha_emision"
              class="w-full"
              readonly
            />
          </div>

          <div>
            <label class="field-label">
              <i class="pi pi-calendar-plus mr-2"></i>
              Fecha Respuesta
            </label>
            <DatePicker
              v-model="datoscamposReclamaciones.fecha_respuesta"
              showButtonBar
              fluid
              class="w-full"
            />
          </div>

          <div>
            <label class="field-label">
              <i class="pi pi-calendar-times mr-2"></i>
              Fecha Vencimiento
            </label>
            <DatePicker
              v-model="datoscamposReclamaciones.fecha_vencimiento"
              showButtonBar
              fluid
              class="w-full"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Card de Búsqueda de Factura -->
    <Card class="mb-4 search-card">
      <template #header>
        <div class="section-header">
          <i class="pi pi-search section-icon"></i>
          <span class="section-title">Buscar Factura (Opcional)</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 gap-3">
          <div>
            <label class="field-label">
              <i class="pi pi-file mr-2"></i>
              No. Factura
            </label>
            <InputGroup>
              <InputText
                v-model="datoscamposReclamaciones.no_factura"
                @keydown.enter="fnBuscarFactura"
                placeholder="Ingrese número de factura"
                v-solonumeros
                class="w-full"
              />
              <InputGroupAddon>
                <Button icon="pi pi-search" @click="fnBuscarFactura" severity="secondary" />
              </InputGroupAddon>
            </InputGroup>
            <small class="text-gray-500 mt-1 block">Presione Enter o haga clic en buscar para autocompletar datos del cliente</small>
          </div>
        </div>
      </template>
    </Card>

    <!-- Formulario con Tabs -->
    <form @submit.prevent="enviarDatos">
      <Card class="mb-4 form-card">
        <template #content>
          <div class="flex mb-3 gap-2 justify-end tab-indicators">
            <Button @click="value = '0'" rounded label="1" class="tab-indicator" :outlined="value !== '0'" severity="danger" />
            <Button @click="value = '1'" rounded label="2" class="tab-indicator" :outlined="value !== '1'" severity="danger" />
            <Button @click="value = '2'" rounded label="3" class="tab-indicator" :outlined="value !== '2'" severity="danger" />
          </div>

          <Tabs v-model:value="value" class="modern-tabs">
            <TabList>
              <Tab value="0">
                <i class="pi pi-user mr-2"></i>
                Datos Cliente
              </Tab>
              <Tab value="1">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                Detalles Reclamación
              </Tab>
              <Tab value="2">
                <i class="pi pi-check-square mr-2"></i>
                Resultado Reclamación
              </Tab>
            </TabList>

            <TabPanels>
              <!-- TAB 1: Datos Cliente -->
              <TabPanel value="0">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div class="md:col-span-2">
                    <label class="field-label">
                      <i class="pi pi-user mr-2"></i>
                      Nombre Completo
                    </label>
                    <InputText
                      v-model="datoscamposReclamaciones.nombre"
                      v-mayuscula
                      placeholder="Nombre completo del cliente"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-phone mr-2"></i>
                      Teléfono
                    </label>
                    <InputText
                      v-model="datoscamposReclamaciones.telefono"
                      v-maska="patronTelefono"
                      placeholder="Teléfono"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-whatsapp mr-2"></i>
                      WhatsApp
                    </label>
                    <InputText
                      v-model="datoscamposReclamaciones.whatsapp"
                      v-maska="patronTelefono"
                      placeholder="WhatsApp"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-envelope mr-2"></i>
                      Email
                    </label>
                    <InputText
                      v-model="datoscamposReclamaciones.email"
                      placeholder="Correo electrónico"
                      class="w-full"
                      type="email"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-building mr-2"></i>
                      Institución
                    </label>
                    <Dropdown
                      editable
                      v-model="datoscamposReclamaciones.institucion"
                      :options="intitucionesData"
                      optionLabel="nombre"
                      placeholder="Seleccione institución"
                      class="w-full"
                    />
                  </div>
                </div>
              </TabPanel>

              <!-- TAB 2: Detalles Reclamación -->
              <TabPanel value="1">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div class="md:col-span-2">
                    <label class="field-label">
                      <i class="pi pi-align-left mr-2"></i>
                      Descripción de la Reclamación
                    </label>
                    <Textarea
                      v-model="datoscamposReclamaciones.descripcion_reclamo"
                      rows="4"
                      placeholder="Detalle completo de la reclamación..."
                      class="w-full"
                    />
                  </div>

                  <div class="md:col-span-2">
                    <label class="field-label">
                      <i class="pi pi-box mr-2"></i>
                      Artículo Reclamado
                    </label>
                    <InputText
                      v-model="datoscamposReclamaciones.articulo_reclamado"
                      v-mayuscula
                      placeholder="Nombre del artículo o servicio reclamado"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-calendar mr-2"></i>
                      Fecha de Compra
                    </label>
                    <DatePicker
                      v-model="datoscamposReclamaciones.fecha_compra"
                      showButtonBar
                      fluid
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-file mr-2"></i>
                      No. Factura Relacionada
                    </label>
                    <InputText
                      v-model="datoscamposReclamaciones.no_factura"
                      v-solonumeros
                      placeholder="Número de factura"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-tag mr-2"></i>
                      Estado de Reclamación
                    </label>
                    <Dropdown
                      v-model="datoscamposReclamaciones.estado_reclamacion"
                      :options="['PENDIENTE','EN PROCESO','RESUELTA','CERRADA']"
                      placeholder="Seleccione estado"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-chart-line mr-2"></i>
                      Resultado de Reclamación
                    </label>
                    <Dropdown
                      v-model="datoscamposReclamaciones.resultado_reclamacion"
                      :options="['EN ESPERA','FAVORABLE','DESFAVORABLE','PARCIAL']"
                      placeholder="Seleccione resultado"
                      class="w-full"
                    />
                  </div>
                </div>
              </TabPanel>

              <!-- TAB 3: Resultado Reclamación -->
              <TabPanel value="2">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div class="md:col-span-2">
                    <label class="field-label">
                      <i class="pi pi-comment mr-2"></i>
                      Respuesta de la Reclamación
                    </label>
                    <Textarea
                      v-model="datoscamposReclamaciones.respuesta_reclamo"
                      rows="5"
                      placeholder="Ingrese la respuesta detallada de la reclamación..."
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-calendar-times mr-2"></i>
                      Fecha de Cierre
                    </label>
                    <DatePicker
                      v-model="datoscamposReclamaciones.fecha_cierre"
                      showButtonBar
                      fluid
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="field-label">
                      <i class="pi pi-user-edit mr-2"></i>
                      Representante
                    </label>
                    <InputText
                      v-model="datoscamposReclamaciones.representante"
                      v-mayuscula
                      placeholder="Nombre del representante"
                      class="w-full"
                    />
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </template>
      </Card>

      <!-- Botón de Envío -->
      <Button
        type="submit"
        label="Registrar Reclamación"
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
.crear-reclamacion-container {
  padding: 1rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  min-height: 100vh;
}

/* ===== Header Profesional ===== */
.crear-reclamacion-header {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
  animation: slideIn 0.5s ease-out;
}

.crear-reclamacion-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.crear-reclamacion-icon-wrapper {
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

.crear-reclamacion-icon {
  font-size: 1.75rem;
  color: white;
}

.crear-reclamacion-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.crear-reclamacion-subtitle {
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

/* ===== Info & Search Cards ===== */
.info-card,
.search-card,
.form-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
  animation: fadeIn 0.5s ease-out;
}

.info-card :deep(.p-card-body),
.search-card :deep(.p-card-body),
.form-card :deep(.p-card-body) {
  padding: 0;
}

.info-card :deep(.p-card-content),
.search-card :deep(.p-card-content),
.form-card :deep(.p-card-content) {
  padding: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
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
  color: #dc2626;
  font-size: 0.875rem;
}

/* ===== Tab Indicators ===== */
.tab-indicators {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.75rem;
}

.tab-indicator {
  width: 2.5rem;
  height: 2.5rem;
  font-weight: 700;
  transition: all 0.3s ease;
}

.tab-indicator:not([data-p-disabled]):not(:disabled):hover {
  transform: scale(1.1);
}

/* ===== Modern Tabs ===== */
.modern-tabs :deep(.p-tablist) {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 8px;
  padding: 0.5rem;
  border: none;
  gap: 0.5rem;
}

.modern-tabs :deep(.p-tab) {
  background: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
  padding: 0.875rem 1.5rem;
}

.modern-tabs :deep(.p-tab:hover) {
  background: #fee2e2;
  color: #dc2626;
  transform: translateY(-2px);
}

.modern-tabs :deep(.p-tab[data-p-active="true"]) {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.modern-tabs :deep(.p-tab[data-p-active="true"]):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
}

.modern-tabs :deep(.p-tabpanels) {
  background: transparent;
  padding: 0;
  border: none;
}

.modern-tabs :deep(.p-tabpanel) {
  background: transparent;
}

/* ===== Input Styles ===== */
.crear-reclamacion-container :deep(.p-inputtext),
.crear-reclamacion-container :deep(.p-dropdown),
.crear-reclamacion-container :deep(.p-calendar),
.crear-reclamacion-container :deep(.p-textarea),
.crear-reclamacion-container :deep(.p-inputgroup) {
  transition: all 0.3s ease;
}

.crear-reclamacion-container :deep(.p-inputtext:focus),
.crear-reclamacion-container :deep(.p-dropdown:focus),
.crear-reclamacion-container :deep(.p-calendar:focus-within),
.crear-reclamacion-container :deep(.p-textarea:focus) {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.crear-reclamacion-container :deep(.p-inputtext:disabled) {
  background-color: #f3f4f6;
  color: #6b7280;
  opacity: 0.7;
}

/* ===== Submit Button ===== */
.btn-submit {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border: none;
  font-size: 1.125rem;
  font-weight: 700;
  padding: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-submit:hover {
  background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
}

.btn-submit:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
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
  .crear-reclamacion-container {
    padding: 0.75rem;
  }

  .crear-reclamacion-header {
    padding: 1.25rem;
  }

  .crear-reclamacion-title {
    font-size: 1.5rem;
  }

  .section-header {
    padding: 0.875rem 1rem;
  }

  .modern-tabs :deep(.p-tab) {
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 640px) {
  .crear-reclamacion-container {
    padding: 0.5rem;
  }

  .crear-reclamacion-header {
    padding: 1rem;
  }

  .crear-reclamacion-header-content {
    flex-direction: column;
    text-align: center;
  }

  .crear-reclamacion-title {
    font-size: 1.25rem;
  }

  .crear-reclamacion-subtitle {
    font-size: 0.75rem;
  }

  .section-header {
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
  }

  .modern-tabs :deep(.p-tab) {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
  }

  .modern-tabs :deep(.p-tablist) {
    flex-direction: column;
  }

  .btn-submit {
    font-size: 1rem;
    padding: 0.875rem;
  }

  .tab-indicators {
    justify-content: center;
  }
}
</style>

