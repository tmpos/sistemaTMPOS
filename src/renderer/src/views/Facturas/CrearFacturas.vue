<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, generarCodigoUnico, peticiones, mensajetoast, lasMayusculas, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import {useDatosEmpresa} from '../../stores'
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
const datoscamposFacturas = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('facturas');
    datoscamposFacturas.value = jsonData;
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
if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }
fetchAndSetupData()
});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/facturas";
  if (!datoscamposFacturas.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposFacturas.value.hasOwnProperty('created_at')) {
     datoscamposFacturas.value.created_at = nfecha('timestamp')
     datoscamposFacturas.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('insertData', 'facturas', JSON.stringify(datoscamposFacturas.value));
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
    router.push({ path: `/facturas` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
</script>
<template>
<main class="content-wrapper crear-factura-container">
  <div class="w-full px-4 mt-5">

    <!-- Modern Header -->
    <div class="crear-factura-header">
      <div class="crear-factura-header-content">
        <div class="crear-factura-icon-wrapper">
          <i class="pi pi-file-plus crear-factura-icon"></i>
        </div>
        <div>
          <h1 class="crear-factura-title">Crear Nueva Factura</h1>
          <p class="crear-factura-subtitle">Completa los datos de la factura</p>
        </div>
      </div>
    </div>

    <!-- Actions Card -->
    <Card class="crear-factura-actions-card">
      <template #content>
        <div class="crear-factura-actions-grid">
          <router-link to="/facturas">
            <Button icon="pi pi-home" label="Inicio" severity="secondary" outlined />
          </router-link>
        </div>
      </template>
    </Card>

    <!-- Section Divider -->
    <div class="crear-factura-section-divider">
      <div class="crear-factura-divider-line"></div>
      <div class="crear-factura-divider-content">
        <i class="pi pi-file-edit"></i>
        <span>Formulario de Factura</span>
      </div>
      <div class="crear-factura-divider-line"></div>
    </div>

<section>
    <form id="formularioActualizar" @submit.prevent="enviarDatos">
  <Card class="crear-factura-form-card">
    <template #content>

<!-- Información de Factura Section -->
<div class="crear-factura-form-section">
  <h3 class="crear-factura-section-title">
    <i class="pi pi-file"></i>
    Información de Factura
  </h3>
  <div class="crear-factura-form-grid">
    <div class="crear-factura-form-group">
      <label class="crear-factura-label">No. Factura</label>
      <InputText v-model="datoscamposFacturas.no_factura" class="crear-factura-input" placeholder="No. Factura" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Tipo Factura</label>
      <InputText v-model="datoscamposFacturas.tipo_factura" class="crear-factura-input" placeholder="Tipo" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Comprobante</label>
      <InputText v-model="datoscamposFacturas.comprobante" class="crear-factura-input" placeholder="Comprobante" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Fecha Emisión</label>
      <InputText v-model="datoscamposFacturas.fecha_emision" class="crear-factura-input" placeholder="Fecha" />
    </div>
  </div>
</div>

<!-- Datos del Cliente Section -->
<div class="crear-factura-form-section">
  <h3 class="crear-factura-section-title">
    <i class="pi pi-user"></i>
    Datos del Cliente
  </h3>
  <div class="crear-factura-form-grid">
    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Código Cliente</label>
      <InputText v-model="datoscamposFacturas.cod_cliente" class="crear-factura-input" placeholder="Código" />
    </div>

    <div class="crear-factura-form-group crear-factura-form-group-wide">
      <label class="crear-factura-label">Nombre Cliente</label>
      <InputText v-model="datoscamposFacturas.nombre_cliente" v-mayuscula class="crear-factura-input" placeholder="Nombre del cliente" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Teléfono Cliente</label>
      <InputMask v-model="datoscamposFacturas.telefono_cliente" :mask="patronTelefono" :placeholder="patronTelefono" class="crear-factura-input" />
    </div>
  </div>
</div>

<!-- Productos Section -->
<div class="crear-factura-form-section">
  <h3 class="crear-factura-section-title">
    <i class="pi pi-shopping-cart"></i>
    Productos
  </h3>
  <div class="crear-factura-form-grid">
    <div class="crear-factura-form-group" style="grid-column: 1 / -1;">
      <label class="crear-factura-label">Productos</label>
      <Textarea v-model="datoscamposFacturas.productos" rows="3" class="crear-factura-input" placeholder="Detalles de productos..." />
    </div>
  </div>
</div>

<!-- Métodos de Pago Section -->
<div class="crear-factura-form-section">
  <h3 class="crear-factura-section-title">
    <i class="pi pi-money-bill"></i>
    Métodos de Pago
  </h3>
  <div class="crear-factura-form-grid">
    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Método de Pago</label>
      <InputText v-model="datoscamposFacturas.metodo_pago" class="crear-factura-input" placeholder="Método" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Tarjeta</label>
      <InputText v-model="datoscamposFacturas.tarjeta" class="crear-factura-input" placeholder="Monto tarjeta" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Transferencia</label>
      <InputText v-model="datoscamposFacturas.transferencia" class="crear-factura-input" placeholder="Monto transferencia" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Efectivo</label>
      <InputText v-model="datoscamposFacturas.efectivo" class="crear-factura-input" placeholder="Monto efectivo" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Financiera</label>
      <InputText v-model="datoscamposFacturas.financiera" class="crear-factura-input" placeholder="Financiera" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Canal Venta</label>
      <InputText v-model="datoscamposFacturas.canal_venta" class="crear-factura-input" placeholder="Canal" />
    </div>
  </div>
</div>

<!-- Totales Section -->
<div class="crear-factura-form-section">
  <h3 class="crear-factura-section-title">
    <i class="pi pi-calculator"></i>
    Totales
  </h3>
  <div class="crear-factura-form-grid">
    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Subtotal</label>
      <InputText v-model="datoscamposFacturas.subtotal" class="crear-factura-input" placeholder="0.00" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Impuesto</label>
      <InputText v-model="datoscamposFacturas.impuesto" class="crear-factura-input" placeholder="0.00" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Descuento</label>
      <InputText v-model="datoscamposFacturas.descuento" class="crear-factura-input" placeholder="0.00" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Total</label>
      <InputText v-model="datoscamposFacturas.total" class="crear-factura-input" placeholder="0.00" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Ganancia</label>
      <InputText v-model="datoscamposFacturas.ganancia" class="crear-factura-input" placeholder="0.00" />
    </div>
  </div>
</div>

<!-- Información Adicional Section -->
<div class="crear-factura-form-section">
  <h3 class="crear-factura-section-title">
    <i class="pi pi-info-circle"></i>
    Información Adicional
  </h3>
  <div class="crear-factura-form-grid">
    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Vendedor</label>
      <InputText v-model="datoscamposFacturas.vendedor" class="crear-factura-input" placeholder="Vendedor" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Estado Factura</label>
      <InputText v-model="datoscamposFacturas.estado_factura" class="crear-factura-input" placeholder="Estado" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Fecha Estado</label>
      <InputText v-model="datoscamposFacturas.fecha_estado" class="crear-factura-input" placeholder="Fecha" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Mes</label>
      <InputText v-model="datoscamposFacturas.mes" class="crear-factura-input" placeholder="Mes" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Año</label>
      <InputText v-model="datoscamposFacturas.year" class="crear-factura-input" placeholder="Año" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Hora</label>
      <InputText v-model="datoscamposFacturas.hora" class="crear-factura-input" placeholder="Hora" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Cajero</label>
      <InputText v-model="datoscamposFacturas.cajero" class="crear-factura-input" placeholder="Cajero" />
    </div>

    <div class="crear-factura-form-group">
      <label class="crear-factura-label">Token</label>
      <InputText v-model="datoscamposFacturas.token" class="crear-factura-input" placeholder="Token" />
    </div>

    <div class="crear-factura-form-group" style="grid-column: 1 / -1;">
      <label class="crear-factura-label">Otro</label>
      <Textarea v-model="datoscamposFacturas.otro" rows="2" class="crear-factura-input" placeholder="Información adicional..." />
    </div>

    <div class="crear-factura-form-group" style="grid-column: 1 / -1;">
      <label class="crear-factura-label">Nota</label>
      <Textarea v-model="datoscamposFacturas.nota" rows="2" class="crear-factura-input" placeholder="Notas..." />
    </div>
  </div>
</div>

<!-- Submit Button -->
<div class="crear-factura-submit-container">
  <Button type="submit" label="Crear Factura" icon="pi pi-check" size="large" class="crear-factura-submit-btn" />
</div>

    </template>
  </Card>
   </form>
</section>
  </div>
   </main>
<Toast />
</template>
<style scoped>
/* ===================================
   🎨 CREAR FACTURA - MODERN STYLING
   =================================== */

/* Header */
.crear-factura-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  animation: slideIn 0.6s ease-out;
}

.crear-factura-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.crear-factura-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.crear-factura-icon {
  font-size: 2.5rem;
  color: white;
}

.crear-factura-title {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.crear-factura-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0.25rem 0 0 0;
}

/* Actions Card */
.crear-factura-actions-card {
  margin-bottom: 1.5rem;
  border-radius: 16px;
  border: 2px solid #d1fae5;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.crear-factura-actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Section Divider */
.crear-factura-section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1.5rem 0;
}

.crear-factura-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #10b981, transparent);
}

.crear-factura-divider-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Form Card */
.crear-factura-form-card {
  border-radius: 16px;
  border: 2px solid #d1fae5;
  margin-bottom: 2rem;
}

/* Form Sections */
.crear-factura-form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(209, 250, 229, 0.3);
  border-radius: 12px;
  border: 1px solid #d1fae5;
}

.crear-factura-section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
  margin: 0 0 1.5rem 0;
}

.crear-factura-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
}

.crear-factura-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.crear-factura-form-group-wide {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .crear-factura-form-group-wide {
    grid-column: span 1;
  }
}

.crear-factura-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.crear-factura-input {
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 100%;
}

.crear-factura-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Submit Button */
.crear-factura-submit-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #d1fae5;
}

.crear-factura-submit-btn {
  min-width: 300px;
  height: 3.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.crear-factura-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
}

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
</style>
