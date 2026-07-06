<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
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
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  envioElectron,
  generarCodigoUnico,
  arrayToObjetoFromTablaOffline,
  peticiones,
  peticionesFetchOffline,
  mensajetoast,
  lasMayusculas} from '@/funciones/funciones.js';
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
const rutasData = ref([])
const rutasDataNames = ref([])
/************************************************************************/
const datoscamposClientes = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const position = "top";
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('clientes');
    datoscamposClientes.value = jsonData;
    datoscamposClientes.value.codigo = generarCodigoUnico();
    datoscamposClientes.value.activo = 'ON';
    datoscamposClientes.value.genero = 'HOMBRE';
    datoscamposClientes.value.estado_civil = 'SOLTERO';
    datoscamposClientes.value.precio_fijado = 'Normal';
    datoscamposClientes.value.limite_credito = '1';

};
/************************************************************************/

const fetchRutasDatosarraypost = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'rutas');
    rutasData.value = response;
    rutasDataNames.value = response.map(rutas=>rutas.nombre);
    datoscamposClientes.value.ruta = rutasDataNames.value[0];
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from rutas',
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

await fetchAndSetupData()
//await fetchRutasDatosarraypost()
});
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/clientes";
  if (!datoscamposClientes.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposClientes.value.hasOwnProperty('created_at')) {
     datoscamposClientes.value.created_at = nfecha('timestamp')
     datoscamposClientes.value.updated_at = nfecha('timestamp')
    }
  const envioDatos = await peticionesFetchOffline('insertData','clientes', JSON.stringify(datoscamposClientes.value));
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
    router.push({ path: `/clientes` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
const fnPasswordN = async () => {
  const pass = datoscamposClientes.value.password;
  const isEncrypted = pass.startsWith('$2a$10');
  if (!isEncrypted) {
    datoscamposClientes.value.password = await encryptarPassword(pass, 10);
  }
};

/************************************************************************/
const buscarDatosCedula = async()=>{
  const consulta = await peticionesFetch(
                'https://demo.tmposrd.com/api2',
                'buscarcedula',
                { cedula: datoscamposClientes.value.cedula },
                tokenCifrado.value,
                'POST'
              );
  if(consulta.datos){
    const fechaN = consulta.datos.birth_day.split('-')
    datoscamposClientes.value.rnc = consulta.datos.document
    datoscamposClientes.value.nombre = consulta.datos.name
    datoscamposClientes.value.genero = consulta.datos.sex === 'M'?'HOMBRE':'MUJER'
    datoscamposClientes.value.edad = consulta.datos.age
    datoscamposClientes.value.fecha_nacimiento = fechaN[2]+'/'+fechaN[1]+'/'+fechaN[0]
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, o no se encuentra registro.', life: 3000 });
  }
}
/************************************************************************/
</script>
<template>
<main class="crear-cliente-wrapper">
  <div class="w-full px-4 py-6">
    <!-- Header Section -->
    <div class="header-section">
      <div class="header-content">
        <div class="header-icon">
          <i class="pi pi-user-plus"></i>
        </div>
        <div class="header-text">
          <h1 class="header-title">Crear Nuevo Cliente</h1>
          <p class="header-description">Registra un nuevo cliente en tu sistema con toda su información de contacto</p>
        </div>
      </div>
    </div>

    <!-- Navigation Card -->
    <Card class="navigation-card">
      <template #content>
        <Button
          icon="pi pi-home"
          severity="secondary"
          label="Volver al Inicio"
          @click="router.push('/clientes')"
          class="nav-btn"
        />
      </template>
    </Card>

    <!-- Form Card -->
    <Card class="form-card">
      <template #content>
        <form @submit="enviarDatos">
          <div class="form-grid">
            <!-- Section: Información Personal -->
            <div class="col-span-12">
              <div class="section-divider">
                <i class="pi pi-user mr-2"></i>
                <span>Información Personal</span>
              </div>
            </div>

            <!-- Nombre -->
            <div class="col-span-12">
              <label class="field-label">
                <i class="pi pi-user mr-2 text-blue-500"></i>
                NOMBRE COMPLETO
              </label>
              <InputText
                v-model="datoscamposClientes.nombre"
                class="modern-input"
                placeholder="Ingrese el nombre completo del cliente"
                maxlength="250"
              />
            </div>

            <!-- Cédula -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-id-card mr-2 text-purple-500"></i>
                CÉDULA
              </label>
              <InputText
                v-model="datoscamposClientes.cedula"
                @blur="buscarDatosCedula"
                @keydown.enter="buscarDatosCedula"
                class="modern-input"
                placeholder="000-0000000-0"
                maxlength="250"
              />
            </div>

            <!-- Teléfono -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-phone mr-2 text-green-500"></i>
                TELÉFONO
              </label>
              <InputMask
                v-model="datoscamposClientes.telefono"
                :mask="patronTelefono"
                class="modern-input"
                placeholder="(000) 000-0000"
              />
            </div>

            <!-- WhatsApp -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-whatsapp mr-2 text-green-600"></i>
                WHATSAPP
              </label>
              <InputMask
                v-model="datoscamposClientes.whatsapp"
                :mask="patronTelefono"
                class="modern-input"
                placeholder="(000) 000-0000"
              />
            </div>

            <!-- Email -->
            <div class="col-span-12 md:col-span-6">
              <label class="field-label">
                <i class="pi pi-envelope mr-2 text-orange-500"></i>
                EMAIL
              </label>
              <InputText
                v-model="datoscamposClientes.email"
                type="email"
                class="modern-input"
                placeholder="correo@ejemplo.com"
                maxlength="250"
              />
            </div>

            <!-- Password -->
            <div class="col-span-12 md:col-span-6">
              <label class="field-label">
                <i class="pi pi-lock mr-2 text-red-500"></i>
                CONTRASEÑA
              </label>
              <Password
                v-model="datoscamposClientes.password"
                @blur="fnPasswordN"
                class="modern-input"
                placeholder="Contraseña"
                toggleMask
                :feedback="false"
                fluid
              />
            </div>

            <!-- Dirección -->
            <div class="col-span-12">
              <label class="field-label">
                <i class="pi pi-map-marker mr-2 text-indigo-500"></i>
                DIRECCIÓN
              </label>
              <Textarea
                v-model="datoscamposClientes.direccion"
                class="modern-input"
                rows="3"
                placeholder="Ingrese la dirección completa"
              />
            </div>

            <!-- Género -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-users mr-2 text-pink-500"></i>
                GÉNERO
              </label>
              <Dropdown
                v-model="datoscamposClientes.genero"
                :options="['HOMBRE', 'MUJER', 'OTRO']"
                class="modern-input"
                placeholder="Seleccione género"
              />
            </div>

            <!-- Estado Civil -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-heart mr-2 text-red-400"></i>
                ESTADO CIVIL
              </label>
              <Dropdown
                v-model="datoscamposClientes.estado_civil"
                :options="['SOLTERO', 'CASADO', 'UNIDO', 'VIUDO', 'OTRO']"
                class="modern-input"
                placeholder="Seleccione estado civil"
              />
            </div>

            <!-- Apodo -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-tag mr-2 text-cyan-500"></i>
                APODO
              </label>
              <InputText
                v-model="datoscamposClientes.apodo"
                class="modern-input"
                placeholder="Apodo o sobrenombre"
                maxlength="250"
              />
            </div>

            <!-- Fecha Nacimiento -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-calendar mr-2 text-violet-500"></i>
                FECHA NACIMIENTO
              </label>
              <Calendar
                v-model="datoscamposClientes.fecha_nacimiento"
                class="modern-input"
                placeholder="DD/MM/YYYY"
                showIcon
                dateFormat="dd/mm/yy"
              />
            </div>

            <!-- Edad -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-clock mr-2 text-amber-500"></i>
                EDAD
              </label>
              <InputNumber
                v-model="datoscamposClientes.edad"
                class="modern-input"
                placeholder="Edad en años"
              />
            </div>

            <!-- Límite Crédito -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-dollar mr-2 text-green-600"></i>
                LÍMITE CRÉDITO
              </label>
              <InputText
                v-model="datoscamposClientes.limite_credito"
                class="modern-input"
                placeholder="1"
                maxlength="250"
              />
            </div>

            <!-- Precio Fijado -->
            <div class="col-span-12 md:col-span-4">
              <label class="field-label">
                <i class="pi pi-money-bill mr-2 text-teal-500"></i>
                PRECIO FIJADO
              </label>
              <Dropdown
                v-model="datoscamposClientes.precio_fijado"
                :options="['Normal', 'Minimo', 'PorMayor']"
                class="modern-input"
                placeholder="Seleccione precio"
              />
            </div>

            <!-- Section: Información Empresarial -->
            <div class="col-span-12 mt-4">
              <div class="section-divider">
                <i class="pi pi-building mr-2"></i>
                <span>Información Empresarial</span>
              </div>
            </div>

            <!-- Empresa -->
            <div class="col-span-12 md:col-span-6">
              <label class="field-label">
                <i class="pi pi-building mr-2 text-blue-600"></i>
                EMPRESA
              </label>
              <InputText
                v-model="datoscamposClientes.empresa"
                class="modern-input"
                placeholder="Nombre de la empresa"
                maxlength="250"
              />
            </div>

            <!-- Cargo -->
            <div class="col-span-12 md:col-span-6">
              <label class="field-label">
                <i class="pi pi-briefcase mr-2 text-indigo-600"></i>
                CARGO
              </label>
              <InputText
                v-model="datoscamposClientes.cargo"
                class="modern-input"
                placeholder="Cargo en la empresa"
                maxlength="250"
              />
            </div>

            <!-- Teléfono Empresa -->
            <div class="col-span-12 md:col-span-6">
              <label class="field-label">
                <i class="pi pi-phone mr-2 text-green-700"></i>
                TELÉFONO EMPRESA
              </label>
              <InputMask
                v-model="datoscamposClientes.telefono_empresa"
                mask="999-999-9999"
                class="modern-input"
                placeholder="(000) 000-0000"
              />
            </div>

            <!-- Nombre Comercial -->
            <div class="col-span-12 md:col-span-6">
              <label class="field-label">
                <i class="pi pi-bookmark mr-2 text-purple-600"></i>
                NOMBRE COMERCIAL
              </label>
              <InputText
                v-model="datoscamposClientes.n_comercial"
                class="modern-input"
                placeholder="Nombre comercial"
                maxlength="250"
              />
            </div>

            <!-- Dirección Empresa -->
            <div class="col-span-12">
              <label class="field-label">
                <i class="pi pi-map mr-2 text-cyan-600"></i>
                DIRECCIÓN EMPRESA
              </label>
              <Textarea
                v-model="datoscamposClientes.direccion_empresa"
                class="modern-input"
                rows="3"
                placeholder="Dirección de la empresa"
              />
            </div>

            <!-- RNC -->
            <div class="col-span-12 md:col-span-6">
              <label class="field-label">
                <i class="pi pi-file mr-2 text-orange-600"></i>
                RNC
              </label>
              <InputText
                v-model="datoscamposClientes.rnc"
                class="modern-input"
                placeholder="RNC de la empresa"
                maxlength="250"
              />
            </div>

            <!-- Section: Configuración -->
            <div class="col-span-12 mt-4">
              <div class="section-divider">
                <i class="pi pi-cog mr-2"></i>
                <span>Configuración</span>
              </div>
            </div>

            <!-- Código -->
            <div class="col-span-12 md:col-span-6">
              <label class="field-label">
                <i class="pi pi-hashtag mr-2 text-gray-600"></i>
                CÓDIGO
              </label>
              <InputText
                v-model="datoscamposClientes.codigo"
                class="modern-input"
                placeholder="Código"
                maxlength="250"
                readonly
              />
            </div>

            <!-- Activo -->
            <div class="col-span-12 md:col-span-6">
              <label class="field-label">
                <i class="pi pi-power-off mr-2 text-emerald-600"></i>
                ESTADO
              </label>
              <Dropdown
                v-model="datoscamposClientes.activo"
                :options="['ON', 'OFF']"
                class="modern-input"
                placeholder="Seleccione estado"
              />
            </div>

            <!-- Submit Button -->
            <div class="col-span-12 mt-6">
              <Button
                type="submit"
                label="Crear Cliente"
                icon="pi pi-check"
                class="submit-btn"
              />
            </div>
          </div>
        </form>
      </template>
    </Card>
  </div>
  <Toast />
</main>
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.crear-cliente-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  animation: slideIn 0.5s ease-out;
}

/* Header Section */
.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  animation: slideIn 0.5s ease-out;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-description {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

/* Navigation Card */
.navigation-card {
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border-radius: 12px;
  animation: slideIn 0.5s ease-out 0.1s backwards;
}

.nav-btn {
  font-weight: 600;
}

/* Form Card */
.form-card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border-radius: 12px;
  animation: slideIn 0.5s ease-out 0.2s backwards;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}

/* Section Divider */
.section-divider {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  padding-bottom: 0.75rem;
  border-bottom: 3px solid #e2e8f0;
  margin-bottom: 0.5rem;
}

/* Field Label */
.field-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Modern Input */
.modern-input {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.modern-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.modern-input:hover {
  border-color: #cbd5e1;
}

/* Modern Input for PrimeVue components */
:deep(.modern-input input),
:deep(.modern-input .p-inputtext),
:deep(.modern-input .p-dropdown),
:deep(.modern-input .p-calendar),
:deep(.modern-input .p-inputnumber-input),
:deep(.modern-input textarea) {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

:deep(.modern-input input:focus),
:deep(.modern-input .p-inputtext:focus),
:deep(.modern-input .p-dropdown:focus),
:deep(.modern-input .p-calendar:focus),
:deep(.modern-input textarea:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input) {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

:deep(.p-password input:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Submit Button */
.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .header-title {
    font-size: 1.5rem;
  }

  .form-grid > div[class*="md:col-span"] {
    grid-column: span 12;
  }
}
</style>
