<script setup>
import { ref, onMounted, nextTick, watchEffect } from 'vue';
import { useRoute} from 'vue-router';
import { useToast } from "primevue/usetoast";
import router from '../../router';
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
  generadorPassword,
  envioElectron,
  generarCodigoUnico,
  arrayToObjetoFromTablaOffline,
peticionesFetchOffline,
  mensajetoast,
  lasMayusculas} from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
const personaId = ref('123');   // o lo que uses
const minEnroll = ref(70);
const visible = ref(false);
const imagenHuella = ref(null);
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref(null);
/************************************************************************/
const datoscamposUsuarios = ref({})
const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
/************************************************************************/
const fetchAndSetupData = async () => {
    const jsonData = await arrayToObjetoFromTablaOffline('usuarios');
    datoscamposUsuarios.value = jsonData;
    datoscamposUsuarios.value.intentos_login = '0';
    datoscamposUsuarios.value.fecha = nfecha('fecha');
    datoscamposUsuarios.value.meta = '0';
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
await fetchAndSetupData();

});
/************************************************************************/
const encriptado = async(password)=>{
   const passwordEcriptada = await encryptarPassword(password, 10);
   datoscamposUsuarios.value.password = passwordEcriptada
}
/************************************************************************/
async function enviarDatos(event) {
    event.preventDefault();
  const url = link.value+api.value+"/insertar/usuarios";
  if (!datoscamposUsuarios.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (datoscamposUsuarios.value.hasOwnProperty('created_at')) {
     datoscamposUsuarios.value.created_at = nfecha('timestamp')
     datoscamposUsuarios.value.updated_at = nfecha('timestamp')
     console.log("datoscamposUsuarios.value", datoscamposUsuarios.value);
    }
  const envioDatos = await peticionesFetchOffline('insertData','usuarios', JSON.stringify(datoscamposUsuarios.value));
  console.log("envioDatos", envioDatos);
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
    router.push({ path: `/usuarios` });
  }
})
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function registrarHuella() {
  if (!window.electron) {
    toast.add({ severity: 'error', summary: 'Solo Desktop', detail: 'Función disponible solo en app de escritorio', life: 2500 });
    return;
  }

  try {
    Swal.fire({ title: 'Enrolando...', html: 'Coloca el mismo dedo 3 veces', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const res = await window.electron.ipcRenderer.invoke('registrarHuella', {
      id: codigoUnico.value,
      min: minEnroll.value,
      readings: 2,
      debug: false
    });

    Swal.close();



      try{
          let resObject = res.template;
          datoscamposUsuarios.value.huella = resObject
          //await funcionActualizar()

      }catch(error){
        console.log("error", error);

      }

    if (res?.result === 'OK') {
      imagenHuella.value = res.png || ''; // "data:image/png;base64,...."
      toast.add({ severity: 'success', summary: 'OK', detail: `huella Registrada`, life: 3000 });
      // Guarda res.template en tu BD aquí
    } else {
      toast.add({ severity: 'warn', summary: 'Falló', detail: JSON.stringify(res), life: 4000 });
      registrarHuella()
    }
  } catch (err) {
    Swal.close();
    toast.add({ severity: 'error', summary: 'Error', detail: err.message || String(err), life: 4000 });
    //registrarHuella()
  } finally {
    //visible.value = false;
  }
}
/************************************************************************/
const preguntasSecretas = [
  '¿Dónde se conocieron sus padres?',
  '¿Cuál es tu país favorito?',
  'Nombre de tu amigo de infancia',
]

const nivelesSeguridad = [
  'Administrador',
  'Vendedor',
  'Cajero',
  'Gerente',
  'Técnico',
]
/************************************************************************/
</script>
<template>
  <main class="content-wrapper p-4">
    <!-- Navegación superior -->
    <div class="mb-6">
      <Card class="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
        <template #content>
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-green-500 rounded-full">
                <i class="pi pi-user-plus text-2xl text-white"></i>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Crear Nuevo Usuario</h1>
                <p class="text-sm text-gray-600 dark:text-gray-400">Complete el formulario para agregar un usuario</p>
              </div>
            </div>

            <div class="flex gap-2">
              <Button
                icon="pi pi-arrow-left"
                label="Volver"
                severity="secondary"
                class="font-semibold"
                @click="router.push('/usuarios')"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Banner de instrucciones -->
    <div class="mb-6">
      <Card class="shadow-lg border-0 border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-800">
        <template #content>
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-blue-500 text-xl mt-1"></i>
            <div>
              <h3 class="font-bold text-gray-800 dark:text-white mb-1">Información importante</h3>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Complete todos los campos requeridos. La contraseña será encriptada automáticamente.
                Puede registrar la huella digital después de crear el usuario.
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Formulario principal -->
    <form id="formularioAgregar" @submit.prevent="enviarDatos">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sección: Información Personal -->
        <Card class="shadow-lg border-0 create-card">
          <template #header>
            <div class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 flex items-center gap-3">
              <i class="pi pi-user text-2xl"></i>
              <h2 class="text-xl font-bold">Información Personal</h2>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Nombre -->
              <div class="form-field">
                <label class="form-label required">
                  <i class="pi pi-user mr-2"></i>
                  Nombre Completo
                </label>
                <InputText
                  v-model="datoscamposUsuarios.nombre"
                  v-mayuscula
                  placeholder="Ingrese el nombre completo"
                  fluid
                  class="form-input"
                  required
                />
              </div>

              <!-- Email -->
              <div class="form-field">
                <label class="form-label required">
                  <i class="pi pi-envelope mr-2"></i>
                  Correo Electrónico
                </label>
                <InputText
                  v-model="datoscamposUsuarios.email"
                  placeholder="correo@ejemplo.com"
                  type="text"
                  fluid
                  class="form-input"
                  required
                />
              </div>

              <!-- Nivel de seguridad -->
              <div class="form-field">
                <label class="form-label required">
                  <i class="pi pi-shield mr-2"></i>
                  Nivel de Seguridad
                </label>
                <Dropdown
                  v-model="datoscamposUsuarios.nivel_seguridad"
                  :options="nivelesSeguridad"
                  placeholder="Seleccione un nivel"
                  fluid
                  class="form-input"
                  required
                />
              </div>

              <!-- Fecha -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-calendar mr-2"></i>
                  Fecha de Registro
                </label>
                <Calendar
                  v-model="datoscamposUsuarios.fecha"
                  dateFormat="dd/mm/yy"
                  showIcon
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Estado -->
              <div class="form-field">
                <label class="form-label required">
                  <i class="pi pi-power-off mr-2"></i>
                  Estado
                </label>
                <Dropdown
                  v-model="datoscamposUsuarios.estado"
                  :options="['Desactivado', 'Activado', 'Bloqueado']"
                  placeholder="Seleccione estado"
                  fluid
                  class="form-input"
                  required
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Sección: Seguridad -->
        <Card class="shadow-lg border-0 create-card">
          <template #header>
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex items-center gap-3">
              <i class="pi pi-lock text-2xl"></i>
              <h2 class="text-xl font-bold">Seguridad</h2>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Password -->
              <div class="form-field">
                <label class="form-label required">
                  <i class="pi pi-lock mr-2"></i>
                  Contraseña
                </label>
                <InputText
                  type="password"
                  v-model="datoscamposUsuarios.password"
                  :feedback="false"
                  toggleMask
                  @change="encriptado(datoscamposUsuarios.password)"
                  placeholder="Ingrese contraseña segura"
                  fluid
                  class="form-input"
                  required
                />
                <small class="text-gray-500 dark:text-gray-400 mt-1 block">
                  Mínimo 8 caracteres, incluya mayúsculas y números
                </small>
              </div>

              <!-- PIN -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-key mr-2"></i>
                  PIN de Acceso
                </label>
                <InputText
                  v-model="datoscamposUsuarios.pin"
                  type="password"
                  placeholder="PIN de 4-6 dígitos"
                  maxlength="6"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Pregunta secreta -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-question-circle mr-2"></i>
                  Pregunta Secreta
                </label>
                <Dropdown
                  v-model="datoscamposUsuarios.pregunta_secreta"
                  :options="preguntasSecretas"
                  placeholder="Seleccione una pregunta"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Respuesta -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-comment mr-2"></i>
                  Respuesta Secreta
                </label>
                <InputText
                  v-model="datoscamposUsuarios.respuesta"
                  placeholder="Respuesta a la pregunta"
                  fluid
                  class="form-input"
                />
              </div>

              <!-- Huella Digital -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-fingerprint mr-2"></i>
                  Huella Digital
                </label>
                <Button
                  icon="pi pi-fingerprint"
                  label="Registrar Huella"
                  severity="info"
                  outlined
                  class="w-full"
                  @click="registrarHuella"
                  type="button"
                />
                <small class="text-gray-500 dark:text-gray-400 mt-1 block">
                  Opcional: Registre la huella para acceso biométrico
                </small>
              </div>
            </div>
          </template>
        </Card>

        <!-- Sección: Metas y Objetivos -->
        <Card class="shadow-lg border-0 create-card">
          <template #header>
            <div class="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 flex items-center gap-3">
              <i class="pi pi-chart-line text-2xl"></i>
              <h2 class="text-xl font-bold">Metas y Objetivos</h2>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Meta -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-dollar mr-2"></i>
                  Meta de Ventas
                </label>
                <InputNumber
                  v-model="datoscamposUsuarios.meta"
                  mode="currency"
                  currency="DOP"
                  locale="es-DO"
                  fluid
                  class="form-input"
                  placeholder="0.00"
                />
              </div>

              <!-- Porcentaje -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-percentage mr-2"></i>
                  Porcentaje Inicial
                </label>
                <InputNumber
                  v-model="datoscamposUsuarios.porcentaje"
                  suffix="%"
                  fluid
                  class="form-input"
                  :min="0"
                  :max="100"
                  placeholder="0"
                />
              </div>

              <!-- Intentos login -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-sign-in mr-2"></i>
                  Intentos de Login
                </label>
                <InputNumber
                  v-model="datoscamposUsuarios.intentos_login"
                  fluid
                  class="form-input"
                  readonly
                  :min="0"
                />
                <small class="text-gray-500 dark:text-gray-400 mt-1 block">
                  Se reinicia automáticamente en cada inicio exitoso
                </small>
              </div>
            </div>
          </template>
        </Card>

        <!-- Sección: Permisos y Restricciones -->
        <Card class="shadow-lg border-0 create-card">
          <template #header>
            <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 flex items-center gap-3">
              <i class="pi pi-verified text-2xl"></i>
              <h2 class="text-xl font-bold">Permisos y Restricciones</h2>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Permisos -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-check-circle mr-2"></i>
                  Permisos del Sistema
                </label>
                <Textarea
                  v-model="datoscamposUsuarios.permisos"
                  rows="5"
                  placeholder="Defina los permisos del usuario (ej: ventas, inventario, reportes)..."
                  fluid
                  class="form-input"
                />
                <small class="text-gray-500 dark:text-gray-400 mt-1 block">
                  Separe cada permiso con comas o líneas nuevas
                </small>
              </div>

              <!-- Restricciones -->
              <div class="form-field">
                <label class="form-label">
                  <i class="pi pi-ban mr-2"></i>
                  Restricciones
                </label>
                <Textarea
                  v-model="datoscamposUsuarios.restrinciones"
                  rows="5"
                  placeholder="Defina las restricciones del usuario..."
                  fluid
                  class="form-input"
                />
                <small class="text-gray-500 dark:text-gray-400 mt-1 block">
                  Especifique las limitaciones o restricciones de acceso
                </small>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Botones de acción -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card class="shadow-lg border-0">
          <template #content>
            <Button
              icon="pi pi-times"
              label="Cancelar"
              severity="danger"
              outlined
              size="large"
              class="w-full font-bold text-lg"
              type="button"
              @click="router.push('/usuarios')"
            />
          </template>
        </Card>

        <Card class="shadow-lg border-0">
          <template #content>
            <Button
              type="submit"
              label="Crear Usuario"
              icon="pi pi-user-plus"
              severity="success"
              size="large"
              class="w-full font-bold text-lg submit-btn"
            />
          </template>
        </Card>
      </div>
    </form>

    <Toast />
  </main>
</template>

<style scoped>
/* Animación de entrada */
.create-card {
  animation: fadeInScale 0.6s ease-out backwards;
}

.create-card:nth-child(1) {
  animation-delay: 0.1s;
}

.create-card:nth-child(2) {
  animation-delay: 0.2s;
}

.create-card:nth-child(3) {
  animation-delay: 0.3s;
}

.create-card:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Estilos de campos de formulario */
.form-field {
  position: relative;
  transition: all 0.3s ease;
}

.form-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-label.required::after {
  content: '*';
  color: #ef4444;
  margin-left: 0.25rem;
  font-size: 1.1rem;
}

:deep(.dark) .form-label {
  color: #d1d5db;
}

.form-input {
  transition: all 0.3s ease;
}

/* Hover en las cards */
.shadow-lg {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Gradientes en los headers de las cards */
.bg-gradient-to-r {
  position: relative;
  overflow: hidden;
}

.bg-gradient-to-r::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.bg-gradient-to-r:hover::after {
  left: 100%;
}

/* Mejora de inputs y dropdowns */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-inputnumber) {
  transition: all 0.3s ease;
}

:deep(.p-inputtext:focus),
:deep(.p-dropdown:focus-within),
:deep(.p-calendar:focus-within),
:deep(.p-inputnumber:focus-within) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
}

/* Botones con efecto */
:deep(.p-button) {
  transition: all 0.3s ease;
}

:deep(.p-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.p-button:active) {
  transform: translateY(0);
}

/* Textarea mejorado */
:deep(.p-textarea) {
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;
}

:deep(.p-textarea:focus) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
}

/* Efecto de enfoque visual en secciones */
.form-field:focus-within .form-label {
  color: #3b82f6;
  transform: translateX(4px);
}

:deep(.dark) .form-field:focus-within .form-label {
  color: #60a5fa;
}

/* Botón de submit mejorado */
.submit-btn {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.submit-btn:hover::before {
  width: 300px;
  height: 300px;
}

/* Icono del header principal animado */
.p-3.bg-green-500 {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }
}

/* Banner de información */
.border-l-4 {
  animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Small text helper */
small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .create-card {
    margin-bottom: 1rem;
  }
}

/* Efecto de campo requerido */
.form-label.required {
  position: relative;
}

.form-field:has(:invalid:not(:placeholder-shown)) .form-label::after {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Mejora visual en hover de inputs */
.form-field:hover .form-input :deep(.p-inputtext),
.form-field:hover .form-input :deep(.p-dropdown),
.form-field:hover .form-input :deep(.p-calendar) {
  border-color: #93c5fd;
}

/* Efecto de loading en el submit */
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Header icon pulse */
.pi-user-plus {
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Card content padding consistency */
:deep(.p-card-content) {
  padding: 1.5rem;
}

/* Success state for filled inputs */
.form-field:has(:valid:not(:placeholder-shown)) .form-label {
  color: #10b981;
}

:deep(.dark) .form-field:has(:valid:not(:placeholder-shown)) .form-label {
  color: #34d399;
}

/* Input icons color */
.form-label i {
  color: #6b7280;
  transition: color 0.3s ease;
}

.form-field:focus-within .form-label i {
  color: #3b82f6;
}

:deep(.dark) .form-label i {
  color: #9ca3af;
}

:deep(.dark) .form-field:focus-within .form-label i {
  color: #60a5fa;
}
</style>
