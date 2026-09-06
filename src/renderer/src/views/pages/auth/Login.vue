<template>
  <div class="login-root">

    <!-- Orbs decorativos de fondo -->
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <div class="bg-orb orb-3"></div>

    <div class="login-layout">

      <!-- ===== PANEL IZQUIERDO: MARCA ===== -->
      <div class="brand-panel" v-if="!isSmallScreen">
        <div
          class="brand-bg"
          :style="{ backgroundImage: `url(${backgroundImages[currentImageIndex]})` }"
        ></div>
        <div class="brand-content">
          <div class="brand-logo-wrap">
            <img :src="logoIMG" class="brand-logo-img" alt="Logo" />
          </div>
          <h1 class="brand-name">{{ datosEmpresaP.nombre || miAlmacen || 'Sistema TM' }}</h1>
          <p class="brand-tagline">Plataforma de Gestión Empresarial</p>
          <div class="brand-features">
            <div class="feature-pill">
              <i class="pi pi-shield"></i>
              <span>Datos 100% Seguros</span>
            </div>
            <div class="feature-pill">
              <i class="pi pi-cloud"></i>
              <span>Operación 100% en línea</span>
            </div>
            <div class="feature-pill">
              <i class="pi pi-sync"></i>
              <span>Sincronización Automática</span>
            </div>
          </div>
        </div>
        <div class="brand-bottom">
          <span>© 2024 AA Systems · Todos los derechos reservados</span>
        </div>
      </div>

      <!-- ===== PANEL DERECHO: FORMULARIO ===== -->
      <div class="form-panel">

        <!-- Loading Overlay -->
        <div v-if="loadingUsers" class="loading-overlay">
          <div class="loading-content">
            <div class="spinner"></div>
            <p class="loading-text">Cargando sistema...</p>
          </div>
        </div>

        <div class="form-box">

          <!-- Header mobile -->
          <div class="mobile-top" v-if="isSmallScreen">
            <Image :src="logoIMG" style="max-height: 56px;" />
            <h2 class="mobile-name">{{ miAlmacen || 'Sistema AA' }}</h2>
          </div>

          <div class="form-header">
            <h2 class="form-title">Bienvenido</h2>
            <p class="form-subtitle">Ingresa tus credenciales para continuar</p>
            <!-- Indicador de estado de conexión -->
            <div class="connection-status" :class="{ 'online': verificaINTERNET, 'offline': !verificaINTERNET }">
              <i :class="verificaINTERNET ? 'pi pi-wifi' : 'pi pi-wifi-slash'"></i>
              <span>{{ verificaINTERNET ? 'En línea' : 'Sin conexión: acceso no disponible' }}</span>
            </div>
          </div>

          <form @submit.prevent="navigateToDashboard" :class="{ 'form-disabled': loadingUsers }">

            <div class="field-group">
              <label class="f-label">
                <i class="pi pi-user"></i>
                Usuario
              </label>
              <InputText
                id="username"
                v-model="username"
                type="text"
                placeholder="Ingrese su usuario"
                :disabled="loadingUsers"
                required
                class="f-input"
              />
            </div>

            <div class="field-group">
              <label class="f-label">
                <i class="pi pi-lock"></i>
                Contraseña
              </label>
              <div class="pw-wrapper">
                <InputText
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Ingrese su contraseña"
                  :disabled="loadingUsers"
                  required
                  class="f-input"
                />
                <button type="button" @click="togglePassword" class="eye-btn">
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
            </div>

            <div class="forgot-row">
              <button type="button" class="forgot-link">¿Olvidaste tu contraseña?</button>
            </div>

            <button type="submit" class="submit-btn" :disabled="loadingUsers">
              <span>Iniciar Sesión</span>
              <i class="pi pi-sign-in"></i>
            </button>

          </form>

          <div class="section-divider">
            <span>Accesos Especiales</span>
          </div>

          <div class="special-actions">
            <button type="button" @click="visiblePinUnlock = true" class="sp-btn sp-vip">
              <i class="pi pi-star-fill"></i>
              <span>Acceso VIP</span>
            </button>
            <button type="button" @click="visibleAgregarLicencia = true" class="sp-btn sp-license">
              <i class="pi pi-key"></i>
              <span>Agregar Licencia</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  </div>
<!-- //////////////////////////////////////////////////////////////////////////// -->
  <Dialog
    v-model:visible="visibleOpcionesEmpresa"
    modal
    appendTo="body"
    :draggable="false"
    :style="{ width: 'min(94vw, 36rem)' }"
    header="Configurar acceso"
    class="empresa-options-dialog"
  >
    <div class="empresa-options-content">
      <div class="empresa-options-intro">
        <span class="empresa-options-icon">
          <i class="pi pi-question"></i>
        </span>
        <div>
          <h3>Elija una opción</h3>
          <p>Seleccione cómo desea configurar el acceso al sistema.</p>
        </div>
      </div>

      <div class="empresa-options-grid">
        <button type="button" class="empresa-option option-license" @click="seleccionarAgregarLicencia">
          <i class="pi pi-key"></i>
          <span>
            <strong>Agregar licencia</strong>
            <small>Activar una licencia existente</small>
          </span>
          <i class="pi pi-chevron-right option-arrow"></i>
        </button>

        <button type="button" class="empresa-option option-register" @click="seleccionarRegistrarEmpresa">
          <i class="pi pi-building"></i>
          <span>
            <strong>Registrar empresa</strong>
            <small>Crear una nueva configuración</small>
          </span>
          <i class="pi pi-chevron-right option-arrow"></i>
        </button>

        <button type="button" class="empresa-option option-demo" @click="seleccionarProbarDemo">
          <i class="pi pi-play-circle"></i>
          <span>
            <strong>Probar demo</strong>
            <small>Continuar con los datos de demostración</small>
          </span>
          <i class="pi pi-chevron-right option-arrow"></i>
        </button>
      </div>
    </div>
  </Dialog>
<!-- //////////////////////////////////////////////////////////////////////////// -->
  <Dialog
    v-model:visible="cargando"
    modal
    :closable="false"
    :draggable="false"
    header="Sincronizando base de datos"
    :style="{ width: '400px' }"
  >
    <div class="text-center space-y-2">
      <p class="font-medium">Procesando tabla: <strong>{{ tablaActual }}</strong></p>
      <ProgressBar :value="Number(((progreso / total) * 100).toFixed(2))" />

      <p>{{ progreso }} de {{ total }} completado</p>
    </div>
  </Dialog>
<!-- //////////////////////////////////////////////////////////////////////////// -->
 <Dialog v-model:visible="visiblePIN" modal :position="position" header="Listado de Productos" :style="{ width: '30rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Listado de Productos</span>
    </div>
  </template>

  <div class="row">
    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">INTRODUZCA EL PIN</legend>

      <label for="email1" class="block text-900 text-xl font-medium mb-2 text-center">PIN</label>

      <!-- Aquí centramos el OTP -->
      <div class="flex justify-content-center">
        <InputOtp
          ref="otpInput"
          class="text-center"
          v-model="pinOTP"
          focus
          mask
          integerOnly
          @change="fnPIN"
        />
      </div>
    </fieldset>
  </div>

  <template #footer>
    <ButtonGroup>
      <Button label="Limpiar" icon="pi pi-eraser" severity="success" @click="fnBorrar" outlined />
      <Button label="Cerrar" icon="pi pi-times" severity="danger" @click="visiblePIN = false" outlined />
    </ButtonGroup>
  </template>
</Dialog>

<!-- //////////////////////////////////////////////////////////////////////////// -->

<Dialog v-model:visible="registroEmpresa" position="top" modal :style="{ width: '30rem' }" header="RegistrarEmpresa">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Registrar Empresa</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Datos de la Empresa</legend>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="col-span-2">
        <label for="nombreEmpresa" class="block text-sm font-medium mb-1">Nombre de la Empresa</label>
        <InputText id="nombreEmpresa" v-mayuscula v-model="form.nombreEmpresa" class="w-full" />
      </div>

      <div class="col-span-2">
        <label for="telefono" class="block text-sm font-medium mb-1">Teléfono</label>
        <InputText id="telefono" v-model="form.telefono" class="w-full" />
      </div>

      <div class="col-span-2">
        <label for="email" class="col-span-2 block text-sm font-medium mb-1">Email</label>
        <InputText id="email" v-model="form.email" class="w-full" />
      </div>

      <div class="col-span-2">
        <label for="contacto" class="block text-sm font-medium mb-1">Nombre del Contacto</label>
        <InputText id="contacto" v-mayuscula v-model="form.contacto" class="w-full" />
      </div>

      <div class="col-span-2">
        <label for="direccion" class="block text-sm font-medium mb-1">Dirección</label>
        <Textarea id="direccion" v-model="form.direccion" rows="3" class="w-full" />
      </div>
    </div>
  </fieldset>

  <template #footer>
    <Button label="Cerrar" outlined severity="secondary" @click="registroEmpresa = false" autofocus />
    <Button label="Guardar" icon="pi pi-check" class="ml-2" @click="guardarEmpresa" />
  </template>
</Dialog>

<!-- //////////////////////////////////////////////////////////////////////////// -->

<Dialog v-model:visible="visibleAgregarLicencia" position="top" modal :style="{ width: '30rem' }" header="AgregarLicencia">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">AgregarLicencia</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Agregar Licencia</legend>
    <div class="grid grid-cols-1 gap-4">
      <div class="flex-auto">
        <FloatLabel>
    <label for="serial" class="font-bold block mb-2">Serial</label>
    <InputMask id="serial" v-model="licencia" mask="*****-*****-*****" placeholder="****-****-****" fluid class="material-input" />
  </FloatLabel>
   </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Aplicar" outlined severity="secondary" @click="verificaLicencia" />
      <Button label="Cerrar" outlined severity="secondary" @click="visibleAgregarLicencia = false" />
  </template>
</Dialog>

<!-- //////////////////////////////////////////////////////////////////////////// -->
<Drawer
  v-model:visible="visiblePinUnlock"
  position="full"
  :modal="true"
  class="pin-drawer"
  :pt="{
    root: { style: 'background: #0d0d14; color: white;' },
    header: { style: 'display: none;' },
    content: { style: 'background: #0d0d14; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden;' }
  }"
>
  <div class="pin-unlock-wrapper">

    <!-- Botón cerrar flotante -->
    <button class="pin-close-btn" @click="visiblePinUnlock = false">
      <i class="pi pi-times"></i>
    </button>

    <h2 class="pin-title">Introduce tu PIN</h2>

    <div class="pin-dots">
      <span v-for="n in 4" :key="n" class="dot" :class="{ filled: pinValue.length >= n }"></span>
    </div>

    <p v-if="pinStatus.mensaje" :class="['pin-status-msg', pinStatus.color]">
      {{ pinStatus.mensaje }}
    </p>

    <div class="pin-grid">
      <button v-for="n in 9" :key="n" class="pin-btn" @click="appendPin(n)">
        {{ n }}
      </button>
      <button class="pin-btn action" @click="borrarPin">⌫</button>
      <button class="pin-btn" @click="appendPin(0)">0</button>
      <button class="pin-btn action" @click="verificarPin">✔</button>
    </div>
  </div>
</Drawer>

<!-- //////////////////////////////////////////////////////////////////////////// -->
<Dialog
  v-model:visible="visibleSesionesAbiertas"
  modal
  :closable="!procesandoSesionesAbiertas"
  :dismissableMask="!procesandoSesionesAbiertas"
  :style="{ width: '34rem', maxWidth: '94vw' }"
  class="open-sessions-dialog"
  @hide="cancelarSesionesAbiertas"
>
  <template #header>
    <div class="flex items-center gap-3">
      <span class="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600">
        <i class="pi pi-exclamation-triangle text-xl"></i>
      </span>
      <div>
        <h3 class="text-xl font-bold m-0 text-gray-800">Sesiones abiertas</h3>
        <p class="text-sm text-gray-500 m-0 mt-1">Selecciona cómo deseas continuar</p>
      </div>
    </div>
  </template>

  <div class="open-sessions-summary">
    <div class="open-sessions-avatar">
      <i class="pi pi-user"></i>
    </div>
    <div>
      <span class="block text-sm text-gray-500">Cajero</span>
      <strong class="block text-lg text-gray-800">{{ username }}</strong>
    </div>
    <div class="open-sessions-count">
      <strong>{{ sesionesAbiertasDetectadas.length }}</strong>
      <span>{{ sesionesAbiertasDetectadas.length === 1 ? 'sesión abierta' : 'sesiones abiertas' }}</span>
    </div>
  </div>

  <p class="text-sm text-gray-500 mt-4 mb-0">
    Puedes continuar con la sesión existente o cerrar todas para iniciar una caja nueva.
  </p>

  <template #footer>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        :disabled="procesandoSesionesAbiertas"
        @click="cancelarSesionesAbiertas"
      />
      <Button
        label="Cerrar sesiones"
        icon="pi pi-power-off"
        severity="danger"
        outlined
        :loading="procesandoSesionesAbiertas === 'cerrar'"
        :disabled="Boolean(procesandoSesionesAbiertas) && procesandoSesionesAbiertas !== 'cerrar'"
        @click="cerrarSesionesDesdeModal"
      />
      <Button
        ref="continuarSesionButton"
        label="Continuar"
        icon="pi pi-arrow-right"
        iconPos="right"
        autofocus
        :loading="procesandoSesionesAbiertas === 'continuar'"
        :disabled="Boolean(procesandoSesionesAbiertas) && procesandoSesionesAbiertas !== 'continuar'"
        @click="continuarSesionAbierta"
      />
    </div>
  </template>
</Dialog>

<!-- //////////////////////////////////////////////////////////////////////////// -->
    <!-- DIALOGO DE ALMACÉN -->
<Dialog
  v-model:visible="visibleCantidadInicial"
  modal
  appendTo="body"
  :draggable="false"
  :closable="!procesandoCantidadInicial"
  :closeOnEscape="!procesandoCantidadInicial"
  :style="{ width: 'min(94vw, 30rem)' }"
  header="Abrir caja"
  class="cantidad-inicial-dialog"
>
  <form class="cantidad-inicial-content" @submit.prevent="confirmarCantidadInicial">
    <div class="cantidad-inicial-heading">
      <span class="cantidad-inicial-icon"><i class="pi pi-wallet"></i></span>
      <div>
        <h3>Cantidad inicial</h3>
        <p>Indique el efectivo disponible al comenzar este turno.</p>
      </div>
    </div>

    <div class="cantidad-inicial-field">
      <label for="cantidadInicialCaja">Efectivo inicial</label>
      <div class="cantidad-inicial-input-wrap">
        <span>RD$</span>
        <InputText
          id="cantidadInicialCaja"
          ref="cantidadInicialInput"
          v-model="inicialCajero"
          type="number"
          min="0"
          step="0.01"
          inputmode="decimal"
          placeholder="0.00"
          :disabled="procesandoCantidadInicial"
          autofocus
          fluid
        />
      </div>
    </div>
  </form>

  <template #footer>
    <div class="flex justify-end gap-2 w-full">
      <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined :disabled="procesandoCantidadInicial" @click="cancelarCantidadInicial" />
      <Button label="Abrir caja" icon="pi pi-check" :loading="procesandoCantidadInicial" @click="confirmarCantidadInicial" />
    </div>
  </template>
</Dialog>

<!-- //////////////////////////////////////////////////////////////////////////// -->
    <Dialog v-model:visible="visibleSeleccionAlmacen" modal :closable="false" header="Selecciona un Almacén" :style="{ width: '25rem' }">
      <p class="mb-4">Debes seleccionar el almacén con el que deseas trabajar:</p>
      <Dropdown v-model="almacenSeleccionado" :options="listaAlmacenes" optionLabel="nombre" placeholder="Selecciona un almacén" class="w-full" />
      <template #footer>
        <Button label="Continuar" :disabled="!almacenSeleccionado" @click="confirmarAlmacen" class="w-full" />
      </template>
    </Dialog>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter,useRoute } from 'vue-router';
import { Buffer } from 'buffer';
import { peticionesFetch, encryptarPassword, comparePassword, buscadorArrayObjeto, nfecha, envioElectron, generateMicrosoftStyleLicense, arrayToObjetoFromTabla, peticiones, peticionesFetchOffline, generarCodigoUnico, TABLAS_LOCALSTORAGE, guardarTablaLocalStorage } from '@/funciones/funciones.js';
import { initOfflineDB, getCachedTable, saveCacheTable, guardarUsuarioOffline, hayInternet, getEstadoSincronizacion, sincronizarFacturas, limpiarFacturasSincronizadas, cargarDatosIniciales } from '@/composables/useOfflineDB';
import { useToast } from "primevue/usetoast";
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';
import { useDatosEmpresa } from '@/stores';
import emitter from '@/utils/emitter';

// Definir props para recibir el almacén desde la URL
const props = defineProps({
  almacen: {
    type: String,
    default: null
  }
});

const toast = useToast();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const datosEmpresa = useDatosEmpresa();
const tablaDefault = ref({})
//import fondo1 from '@/assets/medico.png';
import fondo1 from '@/assets/Fondobasico.png';
import logoPrincipal from '@/assets/img/logo1.png';
/*import fondo2 from '@/assets/fondo2.jpg';
import fondo3 from '@/assets/fondo3.jpg';
import fondo4 from '@/assets/fondo4.jpg';*/

const backgroundImages = [fondo1];
/*********************************************/
const logoIMG = ref(logoPrincipal)
/*********************************************/
/*if(window.electron){
      window.electron.ipcRenderer.send('toggle-menu',false, []);
  }*/
/*********************************************/
  const form = ref({})
/*********************************************/
  const pinStatus = ref({ mensaje: '', color: '' });

/*********************************************/

/*********************************************/
const visiblePIN = ref(false)
const visiblePATRON = ref(false)
const position = "top";
const pinOTP = ref(null)
const inicialCajero = ref(null)
const visibleCantidadInicial = ref(false)
const procesandoCantidadInicial = ref(false)
const cantidadInicialInput = ref(null)
/*********************************************/
const licencia = ref('')
/*********************************************/
const visibleSeleccionAlmacen = ref(false);
const almacenSeleccionado = ref(null);
const listaAlmacenes = ref([]);
const visibleSesionesAbiertas = ref(false);
const sesionesAbiertasDetectadas = ref([]);
const procesandoSesionesAbiertas = ref('');
const continuarSesionButton = ref(null);
/*********************************************/
const visiblePinUnlock = ref(false);
const pinValue = ref('');
const handlePinKeydown = (event) => {
  if (!visiblePinUnlock.value) return; // solo cuando el PIN Drawer está visible

  const key = event.key;

  if (/^\d$/.test(key)) {
    appendPin(key); // agrega número al pin
  } else if (key === 'Backspace') {
    borrarPin(); // borra último número
  } else if (key === 'Enter') {
    verificarPin(); // verifica el pin al presionar Enter
  }
};

/*********************************************/
const currentImageIndex = ref(0);
const transitionEffect = ref('fade-in');
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const isSmallScreen = ref(false);
const datosUsers = ref([]);
const loadingUsers = ref(true);
const link = ref('');
const api = ref('');
const token = ref('');
const tokenCorto = ref('');
const miAlmacen = ref('');
const tokenCifrado = ref('');
const datosJSON = ref([]);
const usuarioLocal = ref({});
const datosEmpresaP = ref({});
const nombrePC = ref({});
const impresora = ref(false);
const productosOffline = ref(0);
const cargandoDatos = ref(false);

const transitionEffects = ['fade-in'];

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

/**********************************************************/
const registroEmpresa = ref(false)
const visibleAgregarLicencia = ref(false)
const visibleOpcionesEmpresa = ref(false)
/**********************************************************/
const cerrarDialogosLogin = () => {
  cargando.value = false;
  visiblePIN.value = false;
  visiblePATRON.value = false;
  visibleSeleccionAlmacen.value = false;
  visiblePinUnlock.value = false;
  registroEmpresa.value = false;
  visibleAgregarLicencia.value = false;
  visibleOpcionesEmpresa.value = false;
  visibleCantidadInicial.value = false;
};

const navegarDesdeLogin = async (ruta) => {
  cerrarDialogosLogin();
  await nextTick();
  router.push(ruta);
};
/**********************************************************/
const registrarEmpresa = async()=>{

}
/**********************************************************/
const noIMG = link.value+'vistas/img/noimagen.jpg';
/**********************************************************/
const nuevaEmpresa = async () => {
  visibleOpcionesEmpresa.value = true;
};

const seleccionarAgregarLicencia = async () => {
  visibleOpcionesEmpresa.value = false;
  await nextTick();
  visibleAgregarLicencia.value = true;
};

const seleccionarRegistrarEmpresa = async () => {
  visibleOpcionesEmpresa.value = false;
  await nextTick();
  registroEmpresa.value = true;
};

const seleccionarProbarDemo = () => {
  visibleOpcionesEmpresa.value = false;
  console.log('Usuario eligió probar demo');
};

/**********************************************************/
const datosConfig = async () => {
  let response;
  try {
   response = await envioElectron('datosarchivo');
    datosJSON.value = response;
    link.value = response.VITE_LINKURL;
    api.value = response.VITE_LINK_API;
    token.value = response.VITE_TOKEN;
    tokenCorto.value = response.VITE_TOKEN_CORTO;
    miAlmacen.value = response.almacen;

    if(!response.almacen){
        if(window.electron){
              const clonedData = JSON.parse(JSON.stringify(response));
              const datosEmpresa1 = await peticionesFetchOffline('getDataByField', 'empresa', 'id', 1);
              clonedData.almacen = datosEmpresa1.nombre
              const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
              miAlmacen.value = response.almacen;

       }else{
        // toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }

    }

    //patronTelefono.value = response.VITE_PATRON_TELEFONO;
    //linkImpresora.value = response.VITE_IMPRESORA_LOCAL;
    //patroncedula.value = response.VITE_PATRON_CEDULA;
      if (link.value === "https://demo.tmposrd.com") {
          const skipDemoPrompt = sessionStorage.getItem('skipDemoPrompt') === 'true';
          if (skipDemoPrompt) {
            sessionStorage.removeItem('skipDemoPrompt');
          } else {
            nuevaEmpresa()
          }
      }



  } catch (error) {
    console.error('Error al obtener la configuración:', error);
  }
};
/**********************************************************/
const fetchEmpresa = async (id = 1) => {
  try {
    let response;

      console.log("miAlmacen.value", miAlmacen.value);
     if(miAlmacen.value != ''){
     response = await peticionesFetchOffline('getDataByField', 'empresa', 'nombre', miAlmacen.value);

     if(!response){
      response = await peticionesFetchOffline('getDataByField', 'empresa', 'id', 1);
      miAlmacen.value = response.almacen;


      if (window.electron) {
        const clonedData = JSON.parse(JSON.stringify(datosJSON.value));
        clonedData.almacen = response.almacen;
        await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
      }


     }

   }else{

      response = await peticionesFetchOffline('getDataByField', 'empresa', 'id', 1);
   }

    // Validar que response no sea null antes de procesarlo
    if (!response) {
      console.error('No se pudo obtener datos de la empresa');
      return;
    }

    // const response = await peticionesFetchOffline('getDataByField', 'empresa', 'id', id);
    const copiaResponse = JSON.parse(JSON.stringify(response));
    const arrayIMG = await peticionesFetchOffline('listarArchivosDeCarpeta', 'empresa/'+copiaResponse.imagen);
    const copia = JSON.parse(JSON.stringify(response))

function isLocalPath(p) {
  if (!p) return false;
  const s = String(p);
  // Windows: C:\...
  if (/^[a-zA-Z]:\\/.test(s)) return true;
  // Linux/Mac: /home/... o /Users/...
  if (s.startsWith('/')) return true;
  return false;
}

function toFileUrl(p) {
  // "C:\Users\...\logo.png" => "file:///C:/Users/.../logo.png"
  const normalized = String(p).replace(/\\/g, '/');
  return `file:///${normalized.replace(/^\/+/, '')}`;
}

function filenameOnly(p) {
  if (!p) return "";
  return String(p).split(/[/\\]+/).pop();
}

if (arrayIMG && arrayIMG.length) {
  const img0 = arrayIMG[0];
  const img1 = arrayIMG[1];

  const local = isLocalPath(img0); // con uno basta (normalmente ambos vienen igual)

  if (local) {
    // ✅ servidor local: usar rutas reales como file://
    response.imagen = toFileUrl(img0);
    response.logoprinter = img1 ? toFileUrl(img1) : "";
    response.imagenesArray = arrayIMG; // o arrayIMG.map(toFileUrl) si quieres
    response.direccionimagenes = copia.imagen;
  } else {
    // ✅ servidor normal: construir URL con endpoint
    const f0 = filenameOnly(img0);
    const f1 = filenameOnly(img1);

    response.imagen = `${link.value}/vista/img/empresa/${copia.imagen}/${f0}`;
    response.logoprinter = `${link.value}/vista/img/empresa/${copia.imagen}/${f1}`;
    response.imagenesArray = [f0, f1];
    response.direccionimagenes = copia.imagen;
  }

  logoIMG.value = response.imagen;
}


    datosEmpresa.setDatosEmpresa(response);
    datosEmpresaP.value = response;

    almacenSeleccionado.value = response.nombre


  } catch (error) {
    console.error('Error al obtener la empresa:', error);
  }
};
/**********************************************************/
// Función para cambiar el almacén cuando viene por URL
const cambiarAlmacenPorURL = async () => {
  if (props.almacen) {
    console.log('Almacén recibido por URL:', props.almacen);

    // Buscar el almacén en la base de datos
    const almacenEncontrado = await peticionesFetchOffline('getDataByField', 'empresa', 'nombre', props.almacen);

    if (almacenEncontrado) {
      console.log('Almacén encontrado:', almacenEncontrado);

      // Actualizar el almacén en el archivo de configuración
      if (window.electron) {
        const clonedData = JSON.parse(JSON.stringify(datosJSON.value));
        clonedData.almacen = props.almacen;
        await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);
      }

      // Actualizar las variables locales
      miAlmacen.value = props.almacen;

      // Recargar los datos de la empresa con el nuevo almacén
      await fetchEmpresa();

      toast.add({
        severity: 'success',
        summary: 'Almacén Cambiado',
        detail: `Se ha cambiado al almacén: ${props.almacen}`,
        life: 3000
      });
    } else {
      console.warn('Almacén no encontrado en la base de datos:', props.almacen);
      toast.add({
        severity: 'warn',
        summary: 'Almacén no encontrado',
        detail: `El almacén "${props.almacen}" no existe en el sistema`,
        life: 4000
      });
    }
  }
};
/**********************************************************/

const fetchUsers = async () => {
  try {
    loadingUsers.value = true;
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    datosUsers.value = response;
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    if (false && !navigator.onLine) {
      try {
        initOfflineDB();
        const cachedUsers = await getCachedTable('usuarios');
        if (cachedUsers && cachedUsers.length > 0) {
          datosUsers.value = cachedUsers;
          toast.add({ severity: 'warn', summary: 'Sin conexión', detail: 'Usando datos guardados (sin internet)', life: 4000 });
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios', life: 3000 });
        }
      } catch (dbError) {
        console.error('Error al cargar usuarios del caché:', dbError);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios', life: 3000 });
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios', life: 3000 });
    }
  } finally {
    loadingUsers.value = false;
  }
};

/**********************************************************/
const cachearTablasLocalStorage = async () => {
  if (!navigator.onLine) return {};

  const resultados = {};
  const descargas = await Promise.allSettled(
    TABLAS_LOCALSTORAGE.map(async (tabla) => {
      const registros = await peticionesFetchOffline('getDataAsArray', tabla, { forceApi: true });
      const data = Array.isArray(registros)
        ? registros
        : Array.isArray(registros?.data)
          ? registros.data
          : Array.isArray(registros?.datos)
            ? registros.datos
            : null;

      if (!Array.isArray(data)) {
        resultados[tabla] = 'omitida';
        return;
      }

      guardarTablaLocalStorage(tabla, data);
      resultados[tabla] = data.length;
    })
  );

  descargas.forEach((resultado, index) => {
    if (resultado.status === 'rejected') {
      console.warn(`[Login] No se pudo cachear ${TABLAS_LOCALSTORAGE[index]} en localStorage:`, resultado.reason);
      resultados[TABLAS_LOCALSTORAGE[index]] = 'omitida';
    }
  });

  window.localStorage.setItem('cache_tablas_estaticas_updated_at', new Date().toISOString());
  return resultados;
};

/**********************************************************/
const cacheDataForOffline = async (mostrarNotificacion = true) => {
  if (!navigator.onLine) {
    console.log('[Offline] Sin conexión, omitiendo carga de datos');
    // Actualizar contador con datos locales existentes
    await actualizarContadoresOffline();
    return;
  }

  try {
    cargandoDatos.value = true;
    initOfflineDB();

    if (mostrarNotificacion) {
      toast.add({
        severity: 'info',
        summary: 'Cargando datos',
        detail: 'Descargando productos y datos para uso offline...',
        life: 2000
      });
    }

    // Cargar todos los datos necesarios en paralelo desde la API y cachearlos para modo navegador/IndexedDB
    const [productos, clientes, empresa, usuarios, configuracion,
           configuracionfactura, metodopago, theme] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'productos'),
      peticionesFetchOffline('getDataAsArray', 'clientes'),
      peticionesFetchOffline('getDataAsArray', 'empresa'),
      peticionesFetchOffline('getDataAsArray', 'usuarios'),
      peticionesFetchOffline('getDataAsArray', 'configuracion'),
      peticionesFetchOffline('getDataAsArray', 'configuracionfactura'),
      peticionesFetchOffline('getDataAsArray', 'metodopago'),
      peticionesFetchOffline('getDataAsArray', 'theme'),
    ]);

    console.log('[Login] 📥 Datos descargados del servidor:')
    console.log('  - Productos:', Array.isArray(productos) ? productos.length : 0)
    console.log('  - Clientes:', Array.isArray(clientes) ? clientes.length : 0)
    console.log('  - Usuarios:', Array.isArray(usuarios) ? usuarios.length : 0)

    // Usar la nueva función optimizada para cargar masivamente
    const resultados = await cargarDatosIniciales({
      productos: Array.isArray(productos) ? productos : [],
      clientes: Array.isArray(clientes) ? clientes : [],
      empresa: Array.isArray(empresa) ? empresa : [],
      usuarios: Array.isArray(usuarios) ? usuarios : [],
      configuracion: Array.isArray(configuracion) ? configuracion : [],
      configuracionfactura: Array.isArray(configuracionfactura) ? configuracionfactura : [],
      metodopago: Array.isArray(metodopago) ? metodopago : [],
      theme: Array.isArray(theme) ? theme : []
    });

    console.log('[Login] ✅ Datos cacheados exitosamente en IndexedDB:', resultados);

    // Actualizar contador de productos
    productosOffline.value = resultados.productos || 0;

    if (mostrarNotificacion) {
      const totalRegistros = Object.values(resultados).reduce((a, b) => a + b, 0);
      toast.add({
        severity: 'success',
        summary: 'Datos cargados',
        detail: `${resultados.productos || 0} productos y ${totalRegistros} registros en total listos para uso offline`,
        life: 4000
      });
    }

    return resultados;
  } catch (error) {
    console.error('[Offline] Error al cachear datos:', error);
    if (mostrarNotificacion) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar todos los datos offline',
        life: 3000
      });
    }
    throw error;
  } finally {
    cargandoDatos.value = false;
  }
};
/**********************************************************/

const actualizarContadoresOffline = async () => {
  try {
    const estado = await getEstadoSincronizacion();
    productosOffline.value = estado.productosCached || 0;
  } catch (error) {
    console.error('[Login] Error actualizando contadores:', error);
  }
};
/**********************************************************/

const sincronizarCambiosPendientes = async (mostrarNotificacion = false) => {
  if (!window.electron || !navigator.onLine) return null;

  try {
    const resultado = await peticionesFetchOffline('sincronizarCambiosPendientes');
    const resumen = resultado?.[1] || {};

    if (mostrarNotificacion && resumen.sincronizados > 0) {
      toast.add({
        severity: 'success',
        summary: 'Sincronizacion completada',
        detail: `${resumen.sincronizados} cambios enviados al servidor`,
        life: 3000
      });
    }

    return resumen;
  } catch (error) {
    console.error('[Login] Error sincronizando cambios pendientes:', error);
    if (mostrarNotificacion) {
      toast.add({
        severity: 'warn',
        summary: 'Sincronizacion pendiente',
        detail: 'No se pudieron enviar todos los cambios al servidor',
        life: 3000
      });
    }
    return null;
  }
};
/**********************************************************/

const navigateToDashboard = async () => {
  if (!username.value || !password.value) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Por favor, complete todos los campos',
      timer: 3000,
      showConfirmButton: true
    });
    return;
  }

  // Verificar si hay conexión a internet
  if (!navigator.onLine) {
    Swal.fire({
      icon: 'error',
      title: 'Sin conexión',
      text: 'Este sistema requiere conexión a Internet para iniciar sesión.',
      timer: 4000,
      showConfirmButton: true
    });
    return;
  }

  const online = true;

  let datosUser = null;

  if (online) {
    // LOGIN ONLINE - Buscar en datosUsers (desde servidor)
    datosUser = datosUsers.value.find(user => user.email === username.value);
  } else {
    // LOGIN OFFLINE - Buscar en IndexedDB
    try {
      initOfflineDB();
      datosUser = await getCachedTable('usuarios').then(users =>
        users.find(user => user.email === username.value)
      );

      if (!datosUser) {
        Swal.fire({
          icon: 'error',
          title: 'Sin conexión',
          text: 'No hay datos de usuario guardados para acceso offline. Conéctate a internet primero.',
          timer: 4000,
          showConfirmButton: true
        });
        return;
      }
    } catch (error) {
      console.error('[Login] Error accediendo a datos offline:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos offline',
        timer: 3000,
        showConfirmButton: true
      });
      return;
    }
  }

  // Validar que se encontró el usuario
  if (datosUser) {
    const comparacion = await comparePassword(password.value, datosUser.password);

    if (comparacion) {
      // Login exitoso
      emitter.emit('sonido', 'addSound');

      authStore.login(datosUser);
      datosEmpresa.setDatosUsuario(datosUser);

      Swal.fire({
        icon: 'success',
        title: 'Bienvenido',
        text: `Bienvenido, ${datosUser.nombre}${!online ? ' (Modo Offline)' : ''}`,
        timer: 3000,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });

      window.localStorage.setItem('autenticacion', JSON.stringify({ activo: true }));

      // Si es login online, guardar usuario en IndexedDB para futuro acceso offline
      if (false && online) {
        try {
          initOfflineDB();
          await guardarUsuarioOffline(datosUser);
          console.log('[Login] Usuario guardado para acceso offline');
        } catch (error) {
          console.error('[Login] Error guardando usuario offline:', error);
        }
      }

      void datosLocalStorage(datosUser, false);

    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Contraseña incorrecta',
        timer: 3000,
        showConfirmButton: true
      });
    }
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: online
        ? 'No se encuentra el usuario, vuelva a escribir los datos'
        : 'Usuario no encontrado. Debe iniciar sesión con internet primero.',
      timer: 3000,
      showConfirmButton: true
    });
    username.value = '';
    password.value = '';
  }
};
/***********************************************************/
const fnVIP = () => {
  username.value = 'soporte';
  password.value = 'soporte';
  navigateToDashboard();
};
/***********************************************************/

const changeBackground = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % backgroundImages.length;
  transitionEffect.value = transitionEffects[Math.floor(Math.random() * transitionEffects.length)];
};
/***********************************************************/

const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth < 600;
};

let intervalId;
/***********************************************************/
const cargando = ref(false);
const progreso = ref(0);
const total = ref(0);
const tablaActual = ref('');
/***********************************************************/
const tokenLocal = ref('')
/*******************************************************************************/
const otpInput = ref(null);
watch(visiblePIN, (newVal) => {
  if (newVal) {
    nextTick(() => {
      setTimeout(() => {
      const inputElement = otpInput.value.$el.querySelector('input');
      if (inputElement) {
        inputElement.focus();
      }
       }, 500);
    });
  }
});
/*******************************************************************************/
async function buscarPrinter() {
  try {
    // Obtener configuración actual
    const campos = await arrayToObjetoFromTabla('printerconfig');

    // Obtener lista de impresoras del sistema
    const printers = await window.electron.ipcRenderer.invoke("get-printers");
    console.log("printers", printers);

    if (!printers || printers.length === 0) {
      return Swal.fire('No se encontraron impresoras instaladas.', '', 'warning');
    }

    // Preparar opciones para el select
    const printerOptions = Object.fromEntries(
      printers.map(printer => [printer.Location, printer.Location])
    );

    // Primer Swal: seleccionar impresora
    const { value: selectedPrinter } = await Swal.fire({
      title: 'Selecciona una impresora',
      input: 'select',
      inputOptions: printerOptions,
      inputPlaceholder: 'Selecciona una impresora',
      showCancelButton: true,
      confirmButtonText: 'Siguiente',
      cancelButtonText: 'Cancelar'
    });

    // Si seleccionaron una impresora
    if (selectedPrinter) {

      // Segundo Swal: seleccionar tipo de impresión
      const { value: tipoPapel } = await Swal.fire({
        title: 'Selecciona el tamaño del papel',
        input: 'radio',
        inputOptions: {
          'carta': 'Carta (8.5 x 11 pulgadas)',
          '80mm': '80mm (ticket)'
        },
        inputValidator: (value) => {
          if (!value) {
            return 'Debes seleccionar un tamaño de papel';
          }
        },
        confirmButtonText: 'Siguiente',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      });

      // Si se seleccionó tipo de papel
      if (tipoPapel) {
        // Tercer Swal: confirmar todo antes de guardar
        const confirm = await Swal.fire({
          title: `¿Agregar la impresora "${selectedPrinter}" con tamaño "${tipoPapel}"?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Agregar',
          cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
          // Guardar impresora y tipo
          campos.nombre = selectedPrinter;
          campos.tipo = tipoPapel; // <--- Guardamos tipo aquí
          campos.id = 1;
          campos.configuraciones = '{}';

          if ('created_at' in campos) {
            campos.updated_at = nfecha('timestamp');
          }

          const envioDatos = await peticionesFetchOffline('updateData', 'printerconfig', JSON.stringify(campos));

          if (envioDatos[0] === 'ok') {
            Swal.fire('Impresora guardada exitosamente', '', 'success');

/*            const camposConfig = await peticionesFetchOffline('getDataByField', 'datos_config', 'nombre', 'IMPRESORA_READY');
            camposConfig.valor = 'true';
            await peticionesFetchOffline('updateData', 'datos_config', JSON.stringify(camposConfig));*/

          } else {
            Swal.fire('No se pudo guardar la impresora', envioDatos.message || '', 'error');
          }
        }
      }
    }

  } catch (error) {
    console.error("Error:", error);
    Swal.fire('Error al obtener o guardar la impresora.', error.message || '', 'error');
  }
}

/*******************************************************************************/
const obtenerSesionesAbiertasCajero = async () => {
  const sesionesPorUsername = await peticionesFetchOffline('getDataByDoubleCondition', 'registrocaja','estado','ABIERTO','username',username.value);
  const sesionesLegadas = await peticionesFetchOffline('getDataByDoubleCondition', 'registrocaja','estado','ABIERTO','turno',username.value);
  const sesiones = [...(Array.isArray(sesionesPorUsername) ? sesionesPorUsername : []), ...(Array.isArray(sesionesLegadas) ? sesionesLegadas : [])];

  return sesiones.filter((sesion, index, array) => array.findIndex(item => item.id === sesion.id) === index);
};
/*******************************************************************************/
const verificaCaja = async () => {
  let datosEnCaja = await obtenerSesionesAbiertasCajero();
    if (datosEnCaja && Array.isArray(datosEnCaja) && datosEnCaja.length > 0) {
      sesionesAbiertasDetectadas.value = datosEnCaja;
      visibleSesionesAbiertas.value = true;
      await nextTick();
      const botonContinuar = continuarSesionButton.value?.$el || continuarSesionButton.value;
      botonContinuar?.focus?.();
      return;
    }else{
      await inicioCajero()
    }
};
/*******************************************************************************/
const cancelarSesionesAbiertas = () => {
  if (procesandoSesionesAbiertas.value) return;
  visibleSesionesAbiertas.value = false;
  sesionesAbiertasDetectadas.value = [];
};
/*******************************************************************************/
const obtenerSesionAbiertaActual = () => {
  const almacenActual = String(miAlmacen.value || datosEmpresaP.value?.nombre || '').trim().toLowerCase();
  const sesiones = [...sesionesAbiertasDetectadas.value].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));

  return sesiones.find((sesion) => String(sesion?.almacen || '').trim().toLowerCase() === almacenActual)
    || sesiones[0]
    || null;
};
/*******************************************************************************/
const restaurarTurnoSesionAbierta = (sesion) => {
  if (!sesion?.turno) return false;

  try {
    const usuariosGuardados = JSON.parse(window.localStorage.getItem('usuarioLocal') || '[]');
    const usuarioActual = Array.isArray(usuariosGuardados) ? usuariosGuardados[0] : usuariosGuardados;
    if (!usuarioActual) return false;

    const usuarioSesion = {
      ...usuarioActual,
      token: sesion.turno,
      hora_inicio: sesion.created_at || usuarioActual.hora_inicio
    };

    tokenLocal.value = sesion.turno;
    window.localStorage.setItem('usuarioLocal', JSON.stringify([usuarioSesion]));
    datosEmpresa.setDatosUsuario(usuarioSesion);
    return true;
  } catch (error) {
    console.error('[Login] No se pudo restaurar el turno de la caja abierta:', error);
    return false;
  }
};
/*******************************************************************************/
const continuarSesionAbierta = async () => {
  procesandoSesionesAbiertas.value = 'continuar';
  try {
    const sesionActual = obtenerSesionAbiertaActual();
    if (!restaurarTurnoSesionAbierta(sesionActual)) {
      throw new Error('No se pudo identificar el turno de la caja abierta.');
    }

    visibleSesionesAbiertas.value = false;
    sesionesAbiertasDetectadas.value = [];
    await navegarDesdeLogin('/caja');
  } catch (error) {
    console.error('[Login] Error al continuar la caja abierta:', error);
    toast.add({
      severity: 'error',
      summary: 'No se pudo continuar la caja',
      detail: 'Intenta iniciar sesión nuevamente.',
      life: 4000
    });
  } finally {
    procesandoSesionesAbiertas.value = '';
  }
};
/*******************************************************************************/
const cerrarSesionesDesdeModal = async () => {
  procesandoSesionesAbiertas.value = 'cerrar';
  try {
    const sesionesCerradas = await cerrarSesionesAbiertasCajero(sesionesAbiertasDetectadas.value);
    if (sesionesCerradas) {
      visibleSesionesAbiertas.value = false;
      sesionesAbiertasDetectadas.value = [];
      await navegarDesdeLogin('/caja');
    }
  } finally {
    procesandoSesionesAbiertas.value = '';
  }
};
/*******************************************************************************/
const cerrarSesionesAbiertasCajero = async (sesiones = []) => {
  for (const sesion of sesiones) {
    const datosSesion = { ...sesion };
    datosSesion.estado = 'CERRADO';
    datosSesion.hora_cierre = nfecha('hora');
    datosSesion.updated_at = nfecha('timestamp');
    datosSesion.otro = 'CERRADO DESDE LOGIN';

    const envioDatos = await peticionesFetchOffline('updateData', 'registrocaja', JSON.stringify(datosSesion));
    if (envioDatos[0] !== 'ok') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cerrar todas las sesiones abiertas del cajero'
      });
      return false;
    }
  }

  Swal.fire({
    icon: 'success',
    title: 'Sesiones cerradas',
    text: 'Todas las sesiones abiertas del cajero fueron cerradas'
  });

  return true;
};
/*******************************************************************************/
const inicioCajero = async () => {
  inicialCajero.value = null;
  visibleCantidadInicial.value = true;
  await nextTick();
  const input = cantidadInicialInput.value?.$el || cantidadInicialInput.value;
  input?.focus?.();
};

const cancelarCantidadInicial = () => {
  if (procesandoCantidadInicial.value) return;
  visibleCantidadInicial.value = false;
  inicialCajero.value = null;
};

const confirmarCantidadInicial = async () => {
  if (procesandoCantidadInicial.value) return;

  const cantidad = Number(inicialCajero.value);
  if (inicialCajero.value === null || inicialCajero.value === '' || !Number.isFinite(cantidad) || cantidad < 0) {
    toast.add({ severity: 'warn', summary: 'Cantidad requerida', detail: 'Ingrese una cantidad inicial válida.', life: 3000 });
    return;
  }

  procesandoCantidadInicial.value = true;
  try {
    inicialCajero.value = cantidad.toFixed(2);
    // Crear el objeto campos después de que el usuario haya ingresado la cantidad
    const campos = await arrayToObjetoFromTabla('registrocaja');
    const datosUsuario = datosUsers.value.find(user => user.email === username.value);
    campos.fecha = nfecha('fecha');

    campos.turno = tokenLocal.value;
    campos.nombre = datosUsuario?.nombre || username.value;
    campos.username = username.value;
    campos.identificadordb = generarCodigoUnico();
    campos.created_at = nfecha('timestamp');
    campos.updated_at = nfecha('timestamp');
    //campos.fecha_inicio = nfecha('timestamp');
    //campos.fecha_fin = nfecha('fechaAmericana')+' 23:59:59';
    //campos.total = '0.00';

    //campos.token = generarCodigoUnico();

    //campos.cantidad_inicio = inicialCajero.value;
    campos.cant_inicio = inicialCajero.value;
    campos.hora_inicio = nfecha('hora');
    campos.ventas = '0.00';
    campos.efectivo = '0.00';
    campos.tarjeta = '0.00';
    campos.transferencia = '0.00';
    campos.otro = '0.00';
    campos.gastos = '0.00';
    campos.devoluciones = '0.00';
    campos.estado = 'ABIERTO';
    campos.ganancias = '0.00';
    campos.almacen = miAlmacen.value;
    // Insertar los datos en la tabla registrocaja
    const envioDatos = await peticionesFetchOffline('insertData', 'registrocaja', JSON.stringify(campos));
    if (envioDatos[0] === 'ok') {
      visibleCantidadInicial.value = false;
      await navegarDesdeLogin('/caja');
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la sesión correctamente.', life: 4000 });
    }
  } catch (error) {
    console.error('[Login] Error abriendo la caja:', error);
    toast.add({ severity: 'error', summary: 'No se pudo abrir la caja', detail: error?.message || 'Ocurrió un error registrando la sesión.', life: 4000 });
  } finally {
    procesandoCantidadInicial.value = false;
  }
};

/*******************************************************************************/
const datosLocalStorage = async(envio,seguir = true)=>{
        tokenLocal.value = generarCodigoUnico();
        const usuarioSesion = {
          usuario: envio.nivel_seguridad,
          imagen: envio.imagen,
          nombre: envio.nombre,
          email: username.value,
          tokenaplicacion: token.value,
          token: tokenLocal.value,
          fecha: nfecha('fecha'),
          hora_inicio: nfecha('timestamp')
        };

        window.localStorage.setItem('usuarioLocal', JSON.stringify([usuarioSesion]));
        window.localStorage.setItem('autenticacion', JSON.stringify({activo:true}));
        window.localStorage.setItem('empresa', JSON.stringify(datosEmpresaP.value));
        window.localStorage.setItem('datosDefault', JSON.stringify(tablaDefault.value));
        window.localStorage.setItem('tabladefault', JSON.stringify(tablaDefault.value));
        window.localStorage.setItem('actualizaciones', JSON.stringify({version:nombrePC.value.version,cuando:"AHORA"}));
        datosEmpresa.setDatosUsuario(usuarioSesion);

        if(window.electron){
          window.electron.ipcRenderer.send('toggle-menu',true, [envio.nivel_seguridad]);
          window.electron.ipcRenderer.invoke("set-menu-enabled", true);
        }

        if (envio.nivel_seguridad === 'Cajero') {
          visiblePIN.value = false;
          await verificaCaja();
        } else {
          await navegarDesdeLogin('/vender');
        }

        void (async () => {
          try {
            const [arrayIMG, datosConfiguracion, configuracionfactura, theme, datosUsuario, tablaMetodoPago] = await Promise.all([
              peticionesFetchOffline('listarArchivosDeCarpeta', 'usuarios/' + envio.imagen),
              peticionesFetchOffline('getDataByField', 'configuracion','id',1),
              peticionesFetchOffline('getDataByField', 'configuracionfactura','id',1),
              peticionesFetchOffline('getDataByField', 'theme','id',1),
              peticionesFetchOffline('getDataByField', 'usuarios','email',username.value),
              peticionesFetchOffline('getAllData', 'metodopago')
            ]);

            const imagenUsuario = Array.isArray(arrayIMG) && arrayIMG.length > 0 ? arrayIMG[0] : noIMG;
            const usuarioSesionConImagen = { ...usuarioSesion, imagen: imagenUsuario };

            window.localStorage.setItem('usuarioLocal', JSON.stringify([usuarioSesionConImagen]));
            datosEmpresa.setDatosUsuario(usuarioSesionConImagen);

            if (datosUsuario) {
              datosUsuario.intentos_login = 0;
            }

            window.localStorage.setItem('configuracion', JSON.stringify(datosConfiguracion));
            window.localStorage.setItem('configuracionfactura', JSON.stringify(configuracionfactura));
            window.localStorage.setItem('metodopago', JSON.stringify(tablaMetodoPago));
            window.localStorage.setItem('theme', JSON.stringify(theme));

            await Promise.allSettled([
              datosEmpresa.inicializarDatosEmpresa(link.value+api.value),
              Promise.resolve()
            ]);
          } catch (error) {
            console.error('Error cargando datos post-login:', error);
          }
        })();


/*            if(datosJSON.value.OFFLINE !== 'true'){
              await navegarDesdeLogin('/');
            }else{
               await verificaCaja()

            }*/
/*        if (envio.nivel_seguridad ==='Cajero') {
          visiblePIN.value = false;
        }else{
         await navegarDesdeLogin('/');

        }*/

}
/***********************************************************/
const handleKeyDown = (event) => {
  if (event.key === 'F11') {
    event.preventDefault();
    void solicitarTokenParaModoDemo();
    return;
  }

  if (event.ctrlKey && event.key === 'p') {
    event.preventDefault();

    Swal.fire({
      title: 'Sincronizar Datos',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (window.electron) {
          peticionesFetchOffline('sincronizacionLocal');
        }

      }
    });
  }
};
/***********************************************************/
const solicitarTokenParaModoDemo = async () => {
  const { value: tokenIngresado } = await Swal.fire({
    title: 'Activar Modo Demo',
    text: 'Introduce el TOKEN para continuar',
    input: 'password',
    inputPlaceholder: 'TOKEN',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Activar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!String(value || '').trim()) {
        return 'Debes ingresar el TOKEN';
      }

      return null;
    }
  });

  if (!tokenIngresado) {
    return;
  }

  if (String(tokenIngresado).trim() !== String(tokenCorto.value || '').trim()) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'TOKEN corto incorrecto', life: 3000 });
    return;
  }

  await activarModoDemo();
};
/***********************************************************/
const activarModoDemo = async () => {
  if (!window.electron) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Esta funcion solo esta disponible en la aplicacion Desktop', life: 3000 });
    return;
  }

  try {
    const configActual = await envioElectron('datosarchivo');
    const nuevoConfig = JSON.parse(JSON.stringify(configActual || {}));

    nuevoConfig.VITE_LINKURL = 'https://demo.tmposrd.com';
    nuevoConfig.VITE_LINK_API = '/api2';
    nuevoConfig.almacen = 'TMPOS SRL';

    sessionStorage.setItem('skipDemoPrompt', 'true');
    await window.electron.ipcRenderer.invoke('actualizarjson', nuevoConfig);

    toast.add({ severity: 'success', summary: 'Ok', detail: 'Modo demo activado', life: 2500 });
    await datosConfig();
    await fetchEmpresa();
    await fetchUsers();
  } catch (error) {
    console.error('Error activando modo demo:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo activar el modo demo', life: 3000 });
  }
};
/***********************************************************/
const verificaINTERNET = ref(navigator.onLine)
/***********************************************************/
    if(navigator.onLine){
       verificaINTERNET.value = true
    }else{
       verificaINTERNET.value = false
    }
/***********************************************************/
const revisaInternet = async()=>{
  if (window.electron) {
    verificaINTERNET.value = navigator.onLine
  }

  await datosConfig()

  // Si hay internet, cargar datos para uso offline
  if (false && verificaINTERNET.value) {
    try {
      await cachearTablasLocalStorage();
      console.log('[Login] Cargando datos offline en segundo plano...');
      void cacheDataForOffline(true);
    } catch (error) {
      console.error('[Login] Error cargando datos offline:', error);
    }
  }

  await fetchEmpresa();
  await fetchUsers();
}
/***********************************************************/
const inicialApp = async()=>{
    await datosConfig()
    await fetchEmpresa();
    await fetchUsers()
}

/***********************************************************/
// Mock: puedes reemplazar esto por una llamada a tu DB local o remota
async function cargarAlmacenes() {
  listaAlmacenes.value = await peticionesFetchOffline('getDataAsArray', 'empresa') || [];
  if (listaAlmacenes.value.length > 0) {
    almacenSeleccionado.value = listaAlmacenes.value[0];
  }
}
/***********************************************************/
async function confirmarAlmacen() {
    if (almacenSeleccionado.value) {
    window.localStorage.setItem('almacenSeleccionado', JSON.stringify(almacenSeleccionado.value));
    visibleSeleccionAlmacen.value = false;
    await fetchEmpresa(almacenSeleccionado.value.id)
    // Redirige dependiendo del tipo de usuario
    const usuario = JSON.parse(localStorage.getItem('usuarioLocal'))[0];
    if (usuario.usuario === 'Cajero') {
      await navegarDesdeLogin('/caja');
    } else {
      await navegarDesdeLogin('/');
    }
  }
}

/***********************************************************/
onMounted(async () => {
  // Inicializar IndexedDB
  // Sin base IndexedDB: los datos se consultan directamente al servidor.

  // Actualizar contadores con datos existentes
  productosOffline.value = 0;

  window.addEventListener('keydown', handlePinKeydown);

  await revisaInternet()
  window.addEventListener('keydown', handleKeyDown);

window.addEventListener('online', async function() {
  toast.add({ severity: 'success', summary: 'Conexión restaurada', detail: 'Sincronizando datos pendientes...', life: 3000 });
  await revisaInternet();

  // Sincronizar cambios pendientes cuando regresa internet
  try {
    const facturasSincronizadas = 0;

    if (facturasSincronizadas > 0) {
      toast.add({
        severity: 'success',
        summary: 'Sincronización completada',
        detail: `${facturasSincronizadas} factura(s) sincronizada(s)`,
        life: 4000
      });

      // Limpiar facturas ya sincronizadas después de un tiempo
      setTimeout(async () => {
        await limpiarFacturasSincronizadas();
      }, 5000);
    }
  } catch (error) {
    console.error('[Login] Error sincronizando:', error);
    toast.add({
      severity: 'warn',
      summary: 'Sincronización pendiente',
      detail: 'Algunas operaciones no se pudieron sincronizar',
      life: 3000
    });
  }
});

window.addEventListener('offline', function() {
  toast.add({ severity: 'error', summary: 'Sin conexión', detail: 'Las operaciones están bloqueadas hasta recuperar Internet', life: 4000 });
  revisaInternet();
});

  if (window.electron) {
  window.electron.ipcRenderer.on('inicio-carga', (data) => {
    cargando.value = true;
    total.value = data.total;
    progreso.value = 0;
  });

/*  window.electron.ipcRenderer.invoke("set-menu-enabled", false);*/

  window.electron.ipcRenderer.on('progreso-carga', (data) => {
    cargando.value = true;
    tablaActual.value = data.tabla;
    progreso.value = data.actual.toFixed(2);
    total.value = data.total;
  });

  window.electron.ipcRenderer.on('fin-carga', async() => {
    cargando.value = false;
    await inicialApp()
    //window.electron.ipcRenderer.invoke('reload-window')
  });

  nombrePC.value = await window.electron.ipcRenderer.invoke('nombrePC');

  }

  await datosConfig();
  tokenCifrado.value = await encryptarPassword(token.value, 10);

  // Verificar si viene almacén por URL y cambiarlo antes de cargar la empresa
  await cambiarAlmacenPorURL();

  tablaDefault.value = await peticionesFetchOffline('getDataByField', 'tabladefault','id',1);

   if(impresora.value != 'true'){
     //await buscarPrinter()
    }

  const datosUsuarioLocal = window.localStorage.getItem('usuarioLocal');
  if (datosUsuarioLocal) {
    usuarioLocal.value = JSON.parse(datosUsuarioLocal)[0];
  }

  intervalId = setInterval(changeBackground, 10000); // Cambiado a 10 segundos
  window.addEventListener('resize', checkScreenSize);
  checkScreenSize();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handlePinKeydown);
  clearInterval(intervalId);
  window.removeEventListener('resize', checkScreenSize);
});

// Watch para detectar cambios en el almacén de la URL
watch(() => props.almacen, async (nuevoAlmacen) => {
  if (nuevoAlmacen) {
    await cambiarAlmacenPorURL();
  }
});

/********************************************************/
const fnPIN = async(pin)=>{
  if (pin.value.length === 4) {
    const datosEncontradosPin = datosUsers.value.find(user=>user.pin == pin.value);
    if (datosEncontradosPin) {
       pinStatus.value = { mensaje: 'PIN correcto ✅', color: 'text-green-400' };
/*      if(window.electron){
          window.electron.ipcRenderer.invoke("play-sound", 'Subtle.mp3');
      }*/
       emitter.emit('sonido', 'addSound');
      visiblePinUnlock.value = false

      Swal.fire({
        icon: 'success',
        title: 'Bienvenido',
        text: `Bienvenido, ${datosEncontradosPin.nombre}`,
        timer: 3000,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });

      username.value = datosEncontradosPin.email
      authStore.login(datosEncontradosPin);
      datosEmpresa.setDatosUsuario(datosEncontradosPin);
       window.localStorage.setItem('autenticacion', JSON.stringify({ activo: true }));
       void datosLocalStorage(datosEncontradosPin,false)



    }else{
      pinStatus.value = { mensaje: 'PIN incorrecto ❌', color: 'text-red-400' };
      toast.add({ severity: 'error', summary: 'Error', detail: 'PIN incorrecto.', life: 3000 });
            pinValue.value = '';

      // Opcional: reenfocar el primer input si estás usando InputOtp
      await nextTick();
      const inputElement = otpInput.value?.$el.querySelector("input");
      if (inputElement) inputElement.focus();
    }
  }

}
/********************************************************/
const fnBorrar = async () => {
  pinOTP.value = ""; // Borra el valor del PIN
  await nextTick(); // Espera a que Vue actualice el DOM
  const inputElement = otpInput.value?.$el.querySelector("input");
  if (inputElement) {
    inputElement.focus(); // Vuelve a enfocar el input
  }
};
/********************************************************/
const verificaLicencia = async () => {
    // Quita guiones y espacios para verificar solo caracteres reales
    const lic = licencia.value;

    if (licencia.value.length === 17) {
        visibleAgregarLicencia.value = false;
        try {
            const response = await peticionesFetch(`https://master.tmposrd.com${api.value}`, `datoscampo/empresas/licencia/${licencia.value}`, {}, tokenCifrado.value, 'GET');

            if (response.id) { // Asegúrate de que la respuesta indique que la licencia es válida

               const datosJSONN = datosJSON.value
                datosJSONN.VITE_LINKURL = response.link;
                datosJSONN.almacen = response.nombre;
                const clonedData = JSON.parse(JSON.stringify(datosJSONN));
                const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', clonedData);



                Swal.fire('Licencia verificada', 'La licencia es válida.', 'success');

                await inicialApp();

/*                try {
                    await peticionesFetchOffline('sincronizacionLocal', false);
                } catch (error) {
                  console.log("error", error);
                    Swal.fire('Licencia verificada', 'Hubo problemas con el proceso de datos en la DB', 'error');
                }*/
            } else {
                Swal.fire('Licencia inválida', 'La licencia no es válida.', 'error');
                visibleAgregarLicencia.value = true;
            }
        } catch (error) {
          console.log("error", error);
            Swal.fire('Error', 'Ocurrió un error al verificar la licencia.', 'error');
            visibleAgregarLicencia.value = true;
        }
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Upps',
            text: `Formato incorrecto`,
            timer: 3000,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
        });

        licencia.value = '';
    }
};

/*const inicioCajero = async (inicialCajero) => {
  // Lógica para manejar el inicio del cajero con el saldo inicial
  console.log('Saldo inicial del cajero:', inicialCajero);
  // Aquí puedes agregar la lógica para guardar el saldo inicial en la base de datos o en el estado de la aplicación
};*/

/********************************************************/
const appendPin = (num) => {
  if (pinValue.value.length < 4) {
    pinValue.value += num.toString();

    if (pinValue.value.length === 4) {
      verificarPin();
    }

  }
};

const borrarPin = () => {
  pinValue.value = pinValue.value.slice(0, -1);
};

const verificarPin = async () => {
  if (pinValue.value.length === 4) {
    const pin = { value: pinValue.value };
    await fnPIN(pin);
  }
};

/********************************************************/
              function removeSpacesAndToLowerCase(str) {
                  return str.replace(/\s+/g, '').toLowerCase();
                }
/********************************************************/
async function generarLicencia() {
  const datosEquipo = await window.electron.ipcRenderer.invoke('datos_del_equipo');
  const base = Buffer.from(datosEquipo.hostname).toString('base64').replace(/=/g, '').toUpperCase();
  const licenciaRaw = base.replace(/[^A-Z0-9]/g, '').substring(0, 15); // solo letras y números
  return licenciaRaw.match(/.{1,5}/g).join('-');
}
/********************************************************/
function decodificarLicencia(licencia) {
  const compacta = licencia.replace(/-/g, '');
  // Para hacer reversible, necesitas guardar más información. Aquí se asume que puedes guardar la versión Base64 original antes de cortar a 15.
  // Si no, solo puedes usar la licencia como identificación, no como "decodificación".
  return '[No reversible sin guardar la original]';
}
/********************************************************/
const guardarEmpresa = async()=>{
const nLicencia = await generarLicencia()
const nombreEmpresa = form.value.nombreEmpresa;
const telefono = form.value.telefono;
const email = form.value.email;
const contacto = form.value.contacto;
const direccion = form.value.direccion;

              const camposEmpresa = await arrayToObjetoFromTabla(`https://master.tmposrd.com${api.value}`,tokenCifrado.value,'empresas',true);

               camposEmpresa.nombre = nombreEmpresa;
               camposEmpresa.telefono = telefono;
               camposEmpresa.email = email;
               camposEmpresa.direccion = direccion;
               camposEmpresa.encargado = contacto;
               camposEmpresa.estado = 'PENDIENTE DE ACTIVACION';
               camposEmpresa.tipo = 'DEMO';
               camposEmpresa.fecha = nfecha('fecha');
               camposEmpresa.link = 'https://'+removeSpacesAndToLowerCase(nombreEmpresa)+'.tmposrd.com';;
               camposEmpresa.token = generarCodigoUnico();
               camposEmpresa.licencia = nLicencia;
               delete camposEmpresa.identificadordb;
               delete camposEmpresa.created_at;
               delete camposEmpresa.updated_at;
               delete camposEmpresa.almacen;
              const response = await peticiones(`https://master.tmposrd.com${api.value}/insertar/empresas`, camposEmpresa, 'POST', tokenCifrado.value);


              if(response[0] === 'ok'){
                registroEmpresa.value = false;
                      Swal.fire({
                    icon: 'success',
                    title: 'Bienvenido',
                    text: `La empresa ${nombreEmpresa} ha sido Registrada`,
                    timer: 3000,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false
              })
              }

}

/********************************************************/

/********************************************************/

</script>

<style scoped>
.open-sessions-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 1rem;
  background: linear-gradient(145deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.82));
}

.open-sessions-avatar {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.9rem;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 12%, white);
  font-size: 1.25rem;
}

.open-sessions-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 7.5rem;
  padding: 0.65rem 0.8rem;
  border-radius: 0.85rem;
  color: #c2410c;
  background: rgba(255, 237, 213, 0.8);
}

.open-sessions-count strong {
  font-size: 1.35rem;
  line-height: 1;
}

.open-sessions-count span {
  margin-top: 0.3rem;
  font-size: 0.72rem;
  white-space: nowrap;
}

/* ===== ROOT: cubre toda la pantalla sin blancos ===== */
.login-root {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

/* ===== ORBS DECORATIVOS ===== */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.orb-1 {
  width: 500px; height: 500px;
  background: rgba(99, 102, 241, 0.18);
  top: -120px; left: -120px;
  animation: orbFloat 14s ease-in-out infinite;
}
.orb-2 {
  width: 400px; height: 400px;
  background: rgba(59, 130, 246, 0.15);
  bottom: -100px; right: 30%;
  animation: orbFloat 18s ease-in-out infinite reverse;
}
.orb-3 {
  width: 350px; height: 350px;
  background: rgba(16, 185, 129, 0.1);
  top: 40%; right: -80px;
  animation: orbFloat 22s ease-in-out infinite;
}
@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(30px, -40px) scale(1.08); }
  66%  { transform: translate(-20px, 20px) scale(0.95); }
}

/* ===== LAYOUT ===== */
.login-layout {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100%;
}

/* ===== PANEL IZQUIERDO ===== */
.brand-panel {
  position: relative;
  width: 55%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}
.brand-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: brightness(0.25) saturate(0.6);
  z-index: 0;
}
.brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 3rem 3.5rem;
  text-align: center;
}
.brand-logo-wrap {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 24px;
  padding: 1.25rem 2rem;
  margin-bottom: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.brand-logo-img {
  max-height: 72px;
  max-width: 200px;
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
}
.brand-name {
  font-size: 2.4rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
  margin-bottom: 0.6rem;
  text-shadow: 0 2px 20px rgba(0,0,0,0.5);
}
.brand-tagline {
  font-size: 1rem;
  color: rgba(255,255,255,0.55);
  font-weight: 400;
  margin-bottom: 3rem;
  letter-spacing: 0.3px;
}
.brand-features {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  max-width: 340px;
}
.feature-pill {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 0.85rem 1.25rem;
  color: rgba(255,255,255,0.85);
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.3s;
}
.feature-pill:hover {
  background: rgba(255,255,255,0.12);
}
.feature-pill i {
  font-size: 1.1rem;
  color: #60a5fa;
  flex-shrink: 0;
}
.feature-pill.loading {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.25);
}
.feature-pill.loading i {
  color: #818cf8;
}
.brand-bottom {
  position: relative;
  z-index: 1;
  padding: 1.25rem 2rem;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.3);
  font-size: 0.78rem;
}

/* ===== PANEL DERECHO ===== */
.form-panel {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  overflow-y: auto;
}

/* ===== LOADING OVERLAY ===== */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(248, 250, 252, 0.96);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
.loading-content {
  text-align: center;
}
.spinner {
  width: 52px;
  height: 52px;
  border: 4px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin: 0 auto 1.25rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  color: #6366f1;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.3px;
}

/* ===== FORM BOX ===== */
.form-box {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem 2rem;
  animation: slideUp 0.5s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Mobile top */
.mobile-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}
.mobile-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

/* Form header */
.form-header {
  margin-bottom: 2rem;
}
.form-title {
  font-size: 1.9rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.4rem;
  letter-spacing: -0.5px;
}
.form-subtitle {
  color: #64748b;
  font-size: 0.93rem;
  margin: 0 0 0.75rem;
}

/* Connection status indicator */
.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.75rem;
  transition: all 0.3s;
}
.connection-status i {
  font-size: 0.9rem;
}
.connection-status.online {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #059669;
}
.connection-status.offline {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #dc2626;
}

/* Fields */
.field-group {
  margin-bottom: 1.4rem;
}
.f-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 0.55rem;
}
.f-label i {
  color: #6366f1;
  font-size: 0.9rem;
}
.f-input {
  width: 100% !important;
  padding: 0.8rem 1rem !important;
  border: 2px solid #e2e8f0 !important;
  border-radius: 12px !important;
  font-size: 0.97rem !important;
  background: #ffffff !important;
  color: #0f172a !important;
  transition: border-color 0.25s, box-shadow 0.25s !important;
}
.f-input:hover {
  border-color: #c7d2fe !important;
}
.f-input:focus {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
  outline: none !important;
}
.f-input::placeholder {
  color: #94a3b8 !important;
}

/* Password wrapper */
.pw-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.pw-wrapper .f-input {
  padding-right: 3rem !important;
}
.eye-btn {
  position: absolute;
  right: 0.85rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 1rem;
  padding: 0.3rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.eye-btn:hover { color: #6366f1; }

/* Forgot */
.forgot-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}
.forgot-link {
  background: none;
  border: none;
  font-size: 0.83rem;
  font-weight: 600;
  color: #6366f1;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  transition: background 0.2s;
}
.forgot-link:hover { background: rgba(99,102,241,0.07); }

/* Submit button */
.submit-btn {
  width: 100%;
  padding: 0.95rem 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  box-shadow: 0 4px 18px rgba(99,102,241,0.35);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  position: relative;
  overflow: hidden;
}
.submit-btn::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transition: left 0.5s;
}
.submit-btn:hover::before { left: 100%; }
.submit-btn:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  box-shadow: 0 8px 28px rgba(99,102,241,0.45);
  transform: translateY(-2px);
}
.submit-btn:active { transform: translateY(0); }
.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

/* Divider */
.section-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.75rem 0 1.25rem;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

/* Special action buttons */
.special-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.sp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.sp-btn i { font-size: 1rem; }

.sp-vip {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fbbf24;
  color: #92400e;
  box-shadow: 0 2px 8px rgba(251,191,36,0.2);
}
.sp-vip:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
  border-color: #f59e0b;
  box-shadow: 0 4px 16px rgba(251,191,36,0.35);
  transform: translateY(-2px);
}
.sp-vip i { color: #d97706; animation: starPulse 2s ease-in-out infinite; }
@keyframes starPulse {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.15) rotate(5deg); }
}

.sp-license {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #34d399;
  color: #065f46;
  box-shadow: 0 2px 8px rgba(52,211,153,0.2);
}
.sp-license:hover {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #10b981;
  box-shadow: 0 4px 16px rgba(52,211,153,0.35);
  transform: translateY(-2px);
}
.sp-license i { color: #059669; }

/* Selector inicial de licencia, empresa o demo */
.empresa-options-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.empresa-options-intro {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 0 0.5rem;
}

.empresa-options-icon {
  width: 3.5rem;
  height: 3.5rem;
  flex: 0 0 3.5rem;
  display: grid;
  place-items: center;
  border-radius: 1rem;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 1.35rem;
}

.empresa-options-intro h3 {
  margin: 0 0 0.2rem;
  color: #1e293b;
  font-size: 1.2rem;
  font-weight: 750;
}

.empresa-options-intro p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.empresa-options-grid {
  display: grid;
  gap: 0.75rem;
}

.empresa-option {
  width: 100%;
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  background: #fff;
  color: #334155;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.empresa-option:hover {
  transform: translateY(-1px);
  border-color: #a5b4fc;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
}

.empresa-option > i:first-child {
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border-radius: 0.75rem;
  font-size: 1.05rem;
}

.empresa-option span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.15rem;
}

.empresa-option strong {
  font-size: 0.95rem;
}

.empresa-option small {
  color: #64748b;
  font-size: 0.78rem;
}

.option-license > i:first-child { background: #eef2ff; color: #4f46e5; }
.option-register > i:first-child { background: #fff1f2; color: #e11d48; }
.option-demo > i:first-child { background: #f1f5f9; color: #475569; }
.empresa-option .option-arrow { color: #94a3b8; font-size: 0.8rem; }

/* Apertura de caja */
.cantidad-inicial-content {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.cantidad-inicial-heading {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cantidad-inicial-icon {
  width: 3.25rem;
  height: 3.25rem;
  flex: 0 0 3.25rem;
  display: grid;
  place-items: center;
  border-radius: 0.9rem;
  background: #ecfdf5;
  color: #059669;
  font-size: 1.2rem;
}

.cantidad-inicial-heading h3 {
  margin: 0 0 0.2rem;
  color: #1e293b;
  font-size: 1.15rem;
  font-weight: 750;
}

.cantidad-inicial-heading p {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
}

.cantidad-inicial-field label {
  display: block;
  margin-bottom: 0.5rem;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 700;
}

.cantidad-inicial-input-wrap {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 0.8rem;
  background: #f8fafc;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.cantidad-inicial-input-wrap:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.cantidad-inicial-input-wrap > span {
  padding-left: 1rem;
  color: #475569;
  font-size: 1rem;
  font-weight: 750;
}

.cantidad-inicial-input-wrap :deep(.p-inputtext) {
  border: 0;
  box-shadow: none;
  background: transparent;
  padding: 0.95rem 1rem 0.95rem 0.55rem;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 700;
}

@media (max-width: 480px) {
  .empresa-options-intro { align-items: flex-start; }
  .empresa-option { padding: 0.85rem; }
}

.form-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* ===== DRAWER VIP PIN - fondo completamente oscuro ===== */
.pin-drawer :deep(.p-drawer) {
  background: #0d0d14 !important;
}
.pin-drawer :deep(.p-drawer-header) {
  background: #0d0d14 !important;
  border-bottom: 1px solid rgba(255,255,255,0.08) !important;
  padding: 1rem 1.5rem !important;
}
.pin-drawer :deep(.p-drawer-close-button),
.pin-drawer :deep(.p-drawer-header-close) {
  color: rgba(255,255,255,0.7) !important;
  background: rgba(255,255,255,0.05) !important;
  border-radius: 8px !important;
}
.pin-drawer :deep(.p-drawer-close-button:hover),
.pin-drawer :deep(.p-drawer-header-close:hover) {
  background: rgba(255,255,255,0.12) !important;
  color: white !important;
}
.pin-drawer :deep(.p-drawer-content) {
  padding: 0 !important;
  background: #0d0d14 !important;
  height: 100%;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* PIN UI - pantalla completa */
.pin-unlock-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: #0d0d14;
}

/* Botón cerrar flotante */
.pin-close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  color: rgba(255,255,255,0.65);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.pin-close-btn:hover {
  background: rgba(255,255,255,0.14);
  color: white;
}


.pin-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 2rem;
  letter-spacing: -0.3px;
}
.pin-dots {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  margin-bottom: 1rem;
}
.dot {
  width: 22px; height: 22px;
  border: 2px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  background: transparent;
  transition: all 0.2s;
}
.dot.filled {
  background: #6366f1;
  border-color: #6366f1;
  box-shadow: 0 0 12px rgba(99,102,241,0.6);
}
.pin-status-msg {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.pin-grid {
  display: grid;
  grid-template-columns: repeat(3, 88px);
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}
.pin-btn {
  height: 88px; width: 88px;
  font-size: 1.6rem;
  font-weight: 600;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  color: white;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
}
.pin-btn:hover {
  background: rgba(99,102,241,0.4);
  border-color: #6366f1;
  transform: scale(1.05);
}
.pin-btn:active { transform: scale(0.97); }
.pin-btn.action {
  background: rgba(255,255,255,0.04);
  font-size: 1.4rem;
}
.pin-btn.action:hover {
  background: rgba(239,68,68,0.25);
  border-color: rgba(239,68,68,0.5);
}

/* Material input (licencia) */
.material-input {
  font-size: 24px;
  border: none;
  appearance: none;
  text-align: center;
  transition: all 0.2s;
  background: transparent;
  border-bottom: 1px solid var(--p-inputtext-border-color);
}
.material-input:focus {
  outline: none;
  border-bottom-color: var(--p-primary-color);
}

/* Transiciones fondo */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<!-- Estilos globales para el Drawer VIP (el teleport lo saca del scope) -->
<style>
.pin-drawer.p-drawer,
.pin-drawer .p-drawer {
  background: #0d0d14 !important;
  color: white !important;
}
.pin-drawer .p-drawer-header {
  background: #0d0d14 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding: 1rem 1.5rem !important;
  color: white !important;
}
.pin-drawer .p-drawer-content {
  background: #0d0d14 !important;
  padding: 0 !important;
  color: white !important;
  height: 100% !important;
  overflow: hidden !important;
}
.pin-drawer .p-drawer-close-button {
  color: rgba(255, 255, 255, 0.75) !important;
  background: rgba(255, 255, 255, 0.06) !important;
  border-radius: 8px !important;
}
.pin-drawer .p-drawer-close-button:hover {
  background: rgba(255, 255, 255, 0.14) !important;
  color: white !important;
}
/* También cubrir la variante con sidebar (PrimeVue v3 compat) */
.pin-drawer.p-sidebar,
.pin-drawer .p-sidebar {
  background: #0d0d14 !important;
}
.pin-drawer .p-sidebar-header {
  background: #0d0d14 !important;
  border-bottom: 1px solid rgba(255,255,255,0.08) !important;
  color: white !important;
}
.pin-drawer .p-sidebar-content {
  background: #0d0d14 !important;
  color: white !important;
}
.pin-drawer .p-sidebar-close {
  color: rgba(255,255,255,0.75) !important;
}
</style>
