<template>
  <main class="content-wrapper">
    <div class="login-container">
      <!-- Background con gradiente animado -->
      <div class="animated-background">
        <div class="gradient-sphere sphere-1"></div>
        <div class="gradient-sphere sphere-2"></div>
        <div class="gradient-sphere sphere-3"></div>
      </div>

      <!-- Login Card Moderno -->
      <div class="login-card">
        <!-- Logo/Icono -->
        <div class="login-header">
          <div class="logo-container">
            <i class="pi pi-lock text-6xl text-white"></i>
          </div>
          <h1 class="login-title">Bienvenido</h1>
          <p class="login-subtitle">Inicia sesión para continuar</p>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleLogin" class="login-form-modern">
          <!-- Email Input -->
          <div class="input-wrapper">
            <div class="input-icon">
              <i class="pi pi-envelope"></i>
            </div>
            <FloatLabel>
              <InputText
                id="email"
                v-model="email"
                type="text"
                class="w-full modern-input"
                required
              />
              <label for="email">Correo electrónico</label>
            </FloatLabel>
          </div>

          <!-- Password Input -->
          <div class="input-wrapper">
            <div class="input-icon">
              <i class="pi pi-lock"></i>
            </div>
            <FloatLabel>
              <Password
                id="password"
                v-model="password"
                toggleMask
                :feedback="false"
                class="w-full"
                inputClass="modern-input w-full"
                required
              />
              <label for="password">Contraseña</label>
            </FloatLabel>
          </div>

          <!-- Login Button -->
          <Button
            type="submit"
            @click="loading = true"
            label="Iniciar Sesión"
            icon="pi pi-sign-in"
            class="w-full modern-login-btn"
            size="large"
          />
        </form>

        <!-- Footer Info -->
        <div class="login-footer">
          <p class="text-sm text-gray-400">
            <i class="pi pi-shield mr-2"></i>
            Sistema seguro y protegido
          </p>
        </div>
      </div>
    </div>
  </main>
  <LoadingOverlay :visible="loading" />
  <Toast />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';
import Swal from 'sweetalert2'
import { peticiones, 
generarCodigoUnico, 
encryptarPassword,
envioElectron, 
nfecha,
arrayToObjetoFromTabla,
peticionesFetch } from '../funciones/funciones.js';

const toast = useToast();
const email = ref('');
const password = ref('');
const router = useRouter();
import LoadingOverlay from '../../Loading/LoadingOverlay.vue';

import config from '../../../../resources/config.json';
/************************************************************************/
import {useDatosEmpresa} from '../stores'
const datosEmpresa = useDatosEmpresa();
const production = config.VITE_PRODUCTION;
const link = ref(config.VITE_LINKURL);
const api = ref(config.VITE_LINK_API);
const token = ref(config.VITE_TOKEN);
const patronTelefono = ref(config.VITE_PATRON_TELEFONO);
const linkImpresora = ref(config.VITE_IMPRESORA_LOCAL);
const idImpresa = ref(config.VITE_ID_EMPRESA);
const tokenCifrado = ref(null);
const inicialCajero = ref('0.00');
/*******************************************************************************/
const emailUsuario = ref(null);
const nombreUsuario = ref(null);
const usuario = ref(null);
const tokenLocal = ref(null);
const miObjeto = ref({})
/*******************************************************************************/
const loading = ref(false)
/*******************************************************************************/

const handleLogin = async () => {
   tokenLocal.value = generarCodigoUnico();
  try {
     loading.value = true
    const envio =  await peticiones(`${link.value}${api.value}/loginapi/usuarios`,{
      username: email.value,
      password: password.value,
      token: tokenLocal.value,
    }, 'POST', tokenCifrado.value);

    if (Array.isArray(envio)) {
      if (envio.length > 1) {

        nombreUsuario.value = envio[0];
        usuario.value = envio[2];
        emailUsuario.value = email.value;

        window.localStorage.setItem('usuarioLocal', JSON.stringify([
          { usuario: envio[2], imagen: envio[1], nombre: envio[0], email: email.value, tokenaplicacion: token.value, token: tokenLocal.value }
        ]));

        const datosEmpresaP = await peticiones(`${link.value}${api.value}/datoscampo/empresa/id/${idImpresa.value}`, {}, 'GET', tokenCifrado.value);
        const datosConfiguracion = await peticiones(`${link.value}${api.value}/datoscampo/configuracion/id/1`, {}, 'GET', tokenCifrado.value);
        const configuracionfactura = await peticiones(`${link.value}${api.value}/datoscampo/configuracionfactura/id/1`, {}, 'GET', tokenCifrado.value);
        const tablaDefault = await peticiones(`${link.value}${api.value}/datoscampo/tabladefault/id/1`, {}, 'GET', tokenCifrado.value);
        const tablaProductos = await peticiones(`${link.value}${api.value}/datosarray/productos`, {}, 'GET', tokenCifrado.value);
        const tablaClientes = await peticiones(`${link.value}${api.value}/datosarray/clientes`, {}, 'GET', tokenCifrado.value);
        const tablaFacturas = await peticiones(`${link.value}${api.value}/datosarray/facturas`, {}, 'GET', tokenCifrado.value);
        const tablaMetodoPago = await peticiones(`${link.value}${api.value}/datosarray/metodopago`, {}, 'GET', tokenCifrado.value);
        const tablaCategorias = await peticiones(`${link.value}${api.value}/datosarray/categorias`, {}, 'GET', tokenCifrado.value);
        const tablaProveedores = await peticiones(`${link.value}${api.value}/datosarray/proveedores`, {}, 'GET', tokenCifrado.value);
        const tablaMarcas = await peticiones(`${link.value}${api.value}/datosarray/marcas`, {}, 'GET', tokenCifrado.value);

        const datosUsuario = await peticiones(`${link.value}${api.value}/datoscampo/usuarios/email/${email.value}`, {}, 'GET', tokenCifrado.value);

          const url = link.value+api.value+"/actualizarcampos/usuarios";

          datosUsuario.intentos_login = 0;

        const envioDatosUsuario = await peticiones(url, datosUsuario, 'POST', tokenCifrado.value);

        if (envioDatosUsuario[0] != 'ok') {
          loading.value = false
          toast.add({ severity: 'error', summary: 'Upps', detail: 'Error al Actualizar datos del Usuario', life: 3000 });
          return
        }

        window.localStorage.setItem('empresa', JSON.stringify(datosEmpresaP));
        window.localStorage.setItem('configuracion', JSON.stringify(datosConfiguracion));
        window.localStorage.setItem('configuracionfactura', JSON.stringify(configuracionfactura));
        window.localStorage.setItem('datosDefault', JSON.stringify(tablaDefault));

        window.localStorage.setItem('metodopago', JSON.stringify(tablaMetodoPago));
        window.localStorage.setItem('categorias', JSON.stringify(tablaCategorias));
        window.localStorage.setItem('proveedores', JSON.stringify(tablaProveedores));
        window.localStorage.setItem('marcas', JSON.stringify(tablaMarcas));
        window.localStorage.setItem('autenticacion', JSON.stringify({activo:true}));


        await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
        //datosEmpresa.empresa


        if (envio[2] ==='Cajero') {
            Swal.fire({
            title: 'Introduce la cantidad',
            input: 'number',
            inputPlaceholder: 'Cantidad',
            showCancelButton: true,
            confirmButtonText: 'Enviar',
            cancelButtonText: 'Cancelar'
          }).then(async(result) => {
            if (result.isConfirmed) {
              loading.value = true
               inicialCajero.value = result.value;
                 await inicioCajero()
            }
          });
          
        }else{
          loading.value = true
          await inicioNormal()

        }




      } else if (envio[0] === 'bloqueo') {
        loading.value = false
        toast.add({ severity: 'error', summary: 'Cuenta Bloqueada', detail: 'Tu cuenta está bloqueada. Contacta al administrador.', life: 3000 });
        window.localStorage.setItem('bloqueo', JSON.stringify({bloqueo:email.value}));
        router.push('/bloqueo');
      }
    } else {
      loading.value = false
      toast.add({ severity: 'error', summary: 'Error', detail: 'Correo o contraseña incorrectos.', life: 3000 });
    }
  } catch (error) {
    loading.value = false
    console.error('Error en el proceso de login:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error durante el inicio de sesión. Inténtalo nuevamente.', life: 3000 });
  }
};

onMounted(async () => {

if (production == 'false') {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
}
tokenCifrado.value = await encryptarPassword(token.value, 10);


document.body.classList.add('sidebar-close');

const bloqueo = window.localStorage.getItem('bloqueo')

if (bloqueo) {
  router.push('/bloqueo');
}

miObjeto.value = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'registrocaja');


});

const inicioCajero = async()=>{

 
          miObjeto.value.turno = tokenLocal.value
          miObjeto.value.nombre = nombreUsuario
          miObjeto.value.username = emailUsuario
          miObjeto.value.fecha = nfecha('fecha')
          miObjeto.value.hora_inicio = nfecha('hora')
          miObjeto.value.created_at = nfecha('timestamp')
          miObjeto.value.updated_at = nfecha('timestamp')
          miObjeto.value.hora_cierre = '0.00'
          miObjeto.value.cant_inicio = inicialCajero.value
          miObjeto.value.ventas = '0.00'
          miObjeto.value.ganancias = '0.00'
          miObjeto.value.abono = '0.00'
          miObjeto.value.taller = '0.00'
          miObjeto.value.cuentas_cobrar = '0.00'
          miObjeto.value.cuentas_pagar = '0.00'
          miObjeto.value.propinas = '0.00'
          miObjeto.value.efectivo = '0.00'
          miObjeto.value.tarjeta = '0.00'
          miObjeto.value.transferencia = '0.00'
          miObjeto.value.cheque = '0.00'
          miObjeto.value.entradas = '0.00'
          miObjeto.value.inversiones = '0.00'
          miObjeto.value.gastos = '0.00'
          miObjeto.value.devoluciones = '0.00'
          miObjeto.value.estado = 'Abierta'
          miObjeto.value.usuario = usuario.value
          
  const url = link.value+api.value+"/insertar/registrocaja";

const envioDatosUsuario = await peticiones(url, miObjeto.value, 'POST', tokenCifrado.value);

if (envioDatosUsuario[0] === 'ok') {
  //loading.value = false
  router.push('/caja');
}else{
toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar la Caja', life: 3000 });
}



}
/*************************************/
const inicioNormal = async()=>{
   
          miObjeto.value.turno = tokenLocal.value
          miObjeto.value.nombre = nombreUsuario
          miObjeto.value.username = emailUsuario
          miObjeto.value.fecha = nfecha('fecha')
          miObjeto.value.hora_inicio = nfecha('hora')
          miObjeto.value.created_at = nfecha('timestamp')
          miObjeto.value.updated_at = nfecha('timestamp')
          miObjeto.value.hora_cierre = '0.00'
          miObjeto.value.cant_inicio = inicialCajero.value
          miObjeto.value.ventas = '0.00'
          miObjeto.value.ganancias = '0.00'
          miObjeto.value.abono = '0.00'
          miObjeto.value.taller = '0.00'
          miObjeto.value.cuentas_cobrar = '0.00'
          miObjeto.value.cuentas_pagar = '0.00'
          miObjeto.value.propinas = '0.00'
          miObjeto.value.efectivo = '0.00'
          miObjeto.value.tarjeta = '0.00'
          miObjeto.value.transferencia = '0.00'
          miObjeto.value.cheque = '0.00'
          miObjeto.value.entradas = '0.00'
          miObjeto.value.inversiones = '0.00'
          miObjeto.value.gastos = '0.00'
          miObjeto.value.devoluciones = '0.00'
          miObjeto.value.estado = 'Abierta'
          miObjeto.value.usuario = usuario.value
        

const url = link.value+api.value+"/insertar/registrocaja";
const envioDatosUsuario = await peticiones(url, miObjeto.value, 'POST', tokenCifrado.value);
if (envioDatosUsuario[0] === 'ok') {
  //window.location.href = '/vender';
  router.push('/vender');
}else{
toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar la Caja', life: 3000 });
}

}
/*************************************/
</script>

<style scoped>
/* ===== CONTENEDOR PRINCIPAL ===== */
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* ===== FONDO ANIMADO ===== */
.animated-background {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.gradient-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s infinite ease-in-out;
}

.sphere-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -10%;
  left: -10%;
  animation-delay: 0s;
}

.sphere-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -15%;
  right: -15%;
  animation-delay: 7s;
}

.sphere-3 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* ===== CARD DE LOGIN ===== */
.login-card {
  position: relative;
  z-index: 10;
  width: 90%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== HEADER DEL LOGIN ===== */
.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-container {
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
  }
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 500;
}

/* ===== FORMULARIO ===== */
.login-form-modern {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.input-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.input-wrapper :deep(.p-float-label) {
  flex: 1;
}

.input-wrapper :deep(.modern-input) {
  height: 48px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.input-wrapper :deep(.modern-input:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-wrapper :deep(.p-float-label label) {
  left: 1rem;
  color: #9ca3af;
  font-size: 0.95rem;
}

.input-wrapper :deep(.p-password) {
  width: 100%;
}

.input-wrapper :deep(.p-password-input) {
  width: 100%;
}

/* ===== BOTÓN DE LOGIN ===== */
.modern-login-btn {
  height: 54px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.modern-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(102, 126, 234, 0.5);
}

.modern-login-btn:active {
  transform: translateY(0);
}

/* ===== FOOTER ===== */
.login-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.login-footer p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* ===== RESPONSIVO ===== */
@media (max-width: 640px) {
  .login-card {
    padding: 2rem 1.5rem;
    max-width: 95%;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .logo-container {
    width: 80px;
    height: 80px;
  }

  .logo-container i {
    font-size: 2.5rem;
  }

  .input-icon {
    width: 44px;
    height: 44px;
    font-size: 1.1rem;
  }

  .input-wrapper :deep(.modern-input) {
    height: 44px;
  }

  .modern-login-btn {
    height: 50px;
  }
}
</style>
