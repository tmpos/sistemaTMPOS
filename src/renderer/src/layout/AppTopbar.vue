<script setup>
import { useLayout } from '@/layout/composables/layout';
import AppConfigurator from './AppConfigurator.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import Button from 'primevue/button';
const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();

import { ref, computed, onMounted,watch, onBeforeUnmount,onUnmounted,nextTick } from 'vue';
import { useRouter,useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { t } = useI18n();
import Swal from 'sweetalert2'
import {
cerrarSession,
logout,
encryptarPassword,
peticionImagen,
nfecha,
enviarDatosPorPost,
peticiones,
peticionImagenUsuarios,
verificaAutentificado,
peticionesFetch,
generarCodigoUnicoN,
codificarBase64,
arrayToObjetoFromTablaOffline,
crearTablaSiNoExiste,
crearTablaSiNoExisteOffline,
arrayToObjetoFromTabla,
peticionesFetchOffline,
envioElectron
} from '@/funciones/funciones.js';

import { useToast } from 'primevue/usetoast';
const toast = useToast();

/****************************************************/
const rutasProhibidas = ['/login', '/config', '/ruta-privada']
/****************************************************/
import Awesomplete from '@/components/Awesomplete.vue';
import LoadingOverlay from '../Loading/LoadingOverlay.vue';
/****************************************************/
const notifications = ref([]);
const unreadCount = ref(0);
const linkInventario = ref('');
/****************************************************/
import QRCode from 'qrcode';
const qrCode = ref('');
const qrDialogVisible = ref(false)
/****************************************************/
    const descargando = ref(false)
    const porcentajeDescarga = ref(0)
    const mensajeDescarga = ref('')
/****************************************************/
const sonidoON = ref(false)
const rutasDisponibles = ref([])
/****************************************************/
const status = ref(true)
const isOnline = ref(navigator.onLine);
const pendingSync = ref(0);
const syncing = ref(false);
const consultandoTasa = ref(false);
const ultimaTasaCambio = ref(null);
/****************************************************/
const tokenCorto = ref(null);
const previousRoute = ref(null);
const loading = ref(false)
const tipo = ref('Online')
/****************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();

const link = ref(null);
const api = ref(null);
const token = ref(null);
const patronTelefono = ref(null);
const linkImpresora = ref(null);
const patroncedula = ref(null);
const tokenCifrado = ref(null);
/****************************************************/
const visibleRuleta = ref(false);
/****************************************************/
const usuarioLocal = ref({})
const datosDefault = ref({})
/****************************************************/
const buscadorProducto = ref(null);
const productosArray = ref([]);
const listaBuscador = ref([]);
/****************************************************/
const nombrePC = ref({})
/****************************************************/
const fnCrearBackup = async () => {
  try {
    const nJSONResponse = await envioElectron('datosarchivo');

    if (tipo.value === 'Offline') {
      try {
        const datosOffline = await peticionesFetchOffline('crearBackupSQLConControl');
      } catch (error) {
        console.error('Error al crear backup offline:', error);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: "Error al crear el Backup offline",
          life: 3000,
        });
        return;
      }
    } else {
      // Online (o por defecto): backup remoto
      try {
        const crearBackUp = await peticionesFetch(`${link.value}${api.value}`, 'backupdb', {}, tokenCifrado.value, 'GET', 'online');
        await logout(link.value, api.value, tokenCifrado.value, toast);
      } catch (error) {
        console.error('Error al crear backup online:', error);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: "Error al crear el Backup online",
          life: 3000,
        });
        return;
      }
    }

    toast.add({
      severity: "success",
      summary: "Éxito",
      detail: "Se ha creado el Backup correctamente",
      life: 3000,
    });
  } catch (error) {
    console.error('Error general al crear backup:', error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Error general al crear el Backup",
      life: 3000,
    });
  }
};

/****************************************************/
let columnaAlmacenVerificada = false

const fetchNotifications = async () => {
  try {
    if (!columnaAlmacenVerificada) {
      const columnas = await peticionesFetchOffline('getTableColumns', 'notificaciones');
      if (!columnas.includes('almacen')) {
        await peticionesFetchOffline('addColumnToTable', { tabla: 'notificaciones', campo: 'almacen' });
        await peticionesFetchOffline('updateEntireColumn', 'notificaciones', 'almacen', datosEmpresa.empresa.nombre);
      }
      columnaAlmacenVerificada = true
    }
    const fechaS = nfecha('timestampcompleta');
    const response = await peticionesFetch(`${link.value}${api.value}`,`datostimestamp`,{"campo":'created_at','fechainicio':fechaS.fechainicio,'fechafin':fechaS.fechafin,'tabla':'notificaciones'},tokenCifrado.value,'POST');

    if (response && response.length > 0) {
      notifications.value = response;
      unreadCount.value = response.filter((notif) => !notif.read).length;

      // Leer el estado del sonido directamente del archivo JSON
      const datosActuales = await envioElectron('datosarchivo');
      const sonidoActivo = datosActuales.VITE_SOUND ?? false;

      if (sonidoActivo === true || sonidoActivo === 'true') {
        window.electron.ipcRenderer.invoke("play-sound",'Subtle.mp3');
      }
    }

    
  } catch (error) {
    console.error("Error fetching notifications:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Unable to fetch notifications', life: 3000 });
  }
};


/****************************************************/
 
/****************************************************/
const verficaBloqueo = async () => {
  try {
/*    const response = await peticiones(`${link.value}${api.value}/datoscampo/empresa/id/${datosEmpresa.empresa.id}`, {}, 'GET', tokenCifrado.value);*/
    const response = await peticionesFetchOffline('getDataByField', 'empresa','id',datosEmpresa.empresa.id);


    if (response && response.bloqueo === 'ON') {

     const codigo = generarCodigoUnicoN();
     const codigoCodificado = codificarBase64(codigo)

/*const verificaTokens = await peticiones(`${link.value}${api.value}/datoscampo/tokens/nombre/desbloqueo`, {}, 'GET', tokenCifrado.value);*/
const verificaTokens =  await peticionesFetchOffline('getDataByField', 'tokens','nombre','desbloqueo');

    if(!verificaTokens){
      const campos = await arrayToObjetoFromTabla('tokens');
  if (campos.hasOwnProperty('created_at')) {
    campos.created_at = nfecha('timestamp');
    campos.updated_at = nfecha('timestamp');
  }
  campos.nombre = 'desbloqueo'
  campos.token = codigoCodificado
  const datosEnviar = JSON.parse(JSON.stringify(campos));
  const envioDatos = await peticionesFetchOffline('insertData','tokens', JSON.stringify(datosEnviar));

  if(envioDatos[0] == 'ok'){
       localStorage.clear();
       router.push('/bloqueo')
  }

    }else{


  if (verificaTokens.hasOwnProperty('created_at')) {
    verificaTokens.updated_at = nfecha('timestamp');
  }

   verificaTokens.token = codigoCodificado;

  const datosEnviar = JSON.parse(JSON.stringify(verificaTokens));
  const envioDatos = await peticionesFetchOffline('updateData','tokens', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {

       localStorage.clear();
       router.push('/bloqueo')
  }
    }


    }
  } catch (error) {
    console.error('Error verificando bloqueo:', error);
  }
};
/****************************************************/
const imagenUsuario = async(location)=>{
   const imagen =  await peticionImagenUsuarios(link.value,api.value,location,tokenCifrado.value)
   usuarioLocal.value.imagen =  imagen;
   const datosLocal = [];
   datosLocal.push(usuarioLocal.value)
   window.localStorage.setItem('usuarioLocal',JSON.stringify(datosLocal))
};
/****************************************************/
const processSyncQueue = async () => {
  return null;
};
/****************************************************/
const handleConnectionChange = async() => {
  if (navigator.onLine) {
    isOnline.value = true;
    toast.add({ severity: 'success', summary: 'Conexión restaurada', detail: 'Has vuelto a estar en línea', life: 3000 });
    //await revisaCambiosLocal();
    //await peticionesFetchOffline('subirDatos');
  } else {
    isOnline.value = false;
    toast.add({ severity: 'error', summary: 'Conexión perdida', detail: 'Has perdido la conexión a internet', life: 3000 });
  }
};
/****************************************************/
const subirDatosLocal = async()=>{
    if (navigator.onLine) {
       //const envio = await peticionesFetchOffline('subirDatos');
  }
}
/****************************************************/
const checkLocalStorage = async ()=> {
  const usuarioLocal = localStorage.getItem('usuarioLocal');
  if (usuarioLocal) {
    const parsedUsuario = JSON.parse(usuarioLocal)[0];
    const storedDate = parsedUsuario.fecha;

/*    if (storedDate !== nfecha('fecha')) {
          localStorage.clear();
          await logout(link.value,api.value,tokenCifrado.value,toast)
          await cerrarSession();
          router.push('/login')
    }*/


  }
}
/****************************************************/
const startVerificationInterval = () => {
  verficaBloqueo(); // Llamar inmediatamente al montar
  const interval = setInterval(async () => {
    await verficaBloqueo();
  }, 10 * 60 * 1000); // 10 minutos en milisegundos
  return interval;
};
/****************************************************/
function addClassToLayoutWrapper() {
  const layoutWrapper = document.getElementsByClassName('layout-wrapper')[0];
  if (layoutWrapper) {
    layoutWrapper.classList.add('layout-static-inactive');
  }
}
/****************************************************/
const generateQR = async (text) => {
  try {
    if (text) {
      qrCode.value = await QRCode.toDataURL(text);
      qrDialogVisible.value = true;
    } else {
      console.error('QR code text is empty or invalid');
    }
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
};
/****************************************************/


const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const router = useRouter();
const route = useRoute();
let intervalId;
/****************************************************/
const handler = async () => {
  if (window.electron) {
    const rutas = await window.electron.ipcRenderer.invoke('rutas-permitidas');

    // ✅ Eliminar duplicados por path
    const rutasUnicas = rutas.filter(
      (ruta, index, self) =>
        index === self.findIndex(r => r.path === ruta.path)
    );

    rutasDisponibles.value = rutasUnicas.filter(r => !rutasProhibidas.includes(r.path));
    window.electron.ipcRenderer.removeListener('menu-generado', handler);
  }
}
/****************************************************/
if(window.electron){
  if (navigator.onLine) {
window.electron.ipcRenderer.on('actualizacion-disponible', (event, version) => {
  Swal.fire({
    title: `Versión ${version} disponible`,
    html: '<div id="progreso-barra">0%</div>',
    showCancelButton: true,
    confirmButtonText: 'Actualizar ahora',
    cancelButtonText: 'Más tarde',
    preConfirm: async () => {
      ipcRenderer.invoke('descargar-e-instalar');
    }
  });

  ipcRenderer.on('progreso-descarga', (event, porcentaje) => {
    document.getElementById('barra-descarga').innerText = `${porcentaje}%`;
  });
});

}
}

const verificarActualizacion = async () => {
  if (navigator.onLine) {
  if(window.electron){
  const res = await window.electron.ipcRenderer.invoke('revisarActualizacionDisponible');
  if (res.available) {
    Swal.fire({
      title: `Versión ${res.version} disponible`,
      html: `
        <p>¿Deseas actualizar ahora?</p>
        <p id="barra-descarga">Esperando...</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Actualizar ahora',
      cancelButtonText: 'Más tarde',
      preConfirm: async () => {
        Swal.close();
        await window.electron.ipcRenderer.invoke('descargar-e-instalar', res.exeName);
      }
    });
  }
  }
  }
};
/***************************************************************/


/************************************************************************/
const revisaCambiosLocal = async () => {
    const responseArray = await peticionesFetchOffline('revisaCambiosLocal');
};
/***************************************************************/
const KEY_BY_TABLE = {
  facturas: 'no_factura',
  clientes: 'codigo',
  productos: 'codigo',
  taller: 'no_factura',
  cuentas_cobrar: 'no_emision',
};

// Normaliza lo que devuelva tu offline (objeto o arreglo)
const normalizeLocal = (res) => {
  if (!res) return null;
  if (Array.isArray(res)) return res[0] || null;
  return res;
};

const cloneWithoutId = (row) => {
  const copy = JSON.parse(JSON.stringify(row || {}));
  delete copy.id; // muy importante
  return copy;
};

const upsertOffline = async (tabla, claveCampo, filaRemota) => {
  const valorClave = filaRemota?.[claveCampo];
  if (valorClave == null || valorClave === '') return { tabla, skip: true, reason: `Fila sin ${claveCampo}` };

  // 1) Buscar en local por el campo clave
  const localFound = normalizeLocal(await peticionesFetchOffline('getDataByField', tabla, claveCampo, valorClave));

  if (localFound && localFound.id != null) {
    // 2) UPDATE → reusar id local, borrar id remoto
    const datos = cloneWithoutId(filaRemota);
    datos.id = localFound.id; // conservar PK local
    const actualizacion = await peticionesFetchOffline('updateData', tabla, JSON.stringify(datos));
    return { tabla, op: 'update', key: claveCampo, value: valorClave, idLocal: localFound.id,retorno:actualizacion };
  } else {
    // 3) INSERT → sin id
    const datos = cloneWithoutId(filaRemota);
    // Si tu adapter usa otro nombre, cambia 'insertData' por 'addData'
    const crear = await peticionesFetchOffline('insertData', tabla, JSON.stringify(datos));
    return { tabla, op: 'insert', key: claveCampo, value: valorClave,retorno:crear };
  }
};
/*************************************************************/
const fnCrearDatosLocal = async(datos)=>{
      const datosMachine = await peticionesFetchOffline('obtenerDatosEquipo');
          const dataN = JSON.parse(datos.data);
          delete dataN.id;

          const crear = await peticionesFetchOffline(
            'insertData',
            datos.tabla,
            JSON.stringify(dataN)
          );

          if (crear[0] === 'ok') {
            let equiposRegistro = [];
            if (datos.equipos && datos.equipos.trim() !== '') {
              equiposRegistro = datos.equipos.split(',').map(e => e.trim());
            }

            if (!equiposRegistro.includes(datosMachine.hostname)) {
              equiposRegistro.push(datosMachine.hostname);
            }

            const cambios = await peticionesFetch(
              `${link.value}${api.value}`,
              'actualizaruncampo/data_pendiente',
              {
                campo: 'equipos',
                valor: equiposRegistro.join(','),
                id: datos.id
              },
              tokenCifrado.value,
              'POST',
              'online'
            );
          }
}
/*************************************************************/
const actualizarDatosLocal = async(datos,idLocal)=>{
    const datosMachine = await peticionesFetchOffline('obtenerDatosEquipo');
  const dataN = JSON.parse(datos.data);
  delete dataN.id;
  dataN.id = idLocal

  const actualizarLocal = await peticionesFetchOffline('updateData', datos.tabla, JSON.stringify(dataN));
   if(actualizarLocal[0] === 'ok'){

            let equiposRegistro = [];
            if (datos.equipos && datos.equipos.trim() !== '') {
              equiposRegistro = datos.equipos.split(',').map(e => e.trim());
            }

            if (!equiposRegistro.includes(datosMachine.hostname)) {
              equiposRegistro.push(datosMachine.hostname);
            }


         const cambios = await peticionesFetch(
           `${link.value}${api.value}`,
           'actualizaruncampo/data_pendiente',
           {
             campo: 'equipos',
             valor: equiposRegistro.join(','),
             id: datos.id
           },
           tokenCifrado.value,
           'POST',
           'online'
         );

         const cambios2 = await peticionesFetch(
           `${link.value}${api.value}`,
           'actualizaruncampo/data_pendiente',
           {
             campo: 'id_machine',
             valor: datosMachine.hostname,
             id: datos.id
           },
           tokenCifrado.value,
           'POST',
           'online'
         );


     }
}
/*************************************************************/
const borrarDataInterna = async(datos)=>{
    const datosMachine = await peticionesFetchOffline('obtenerDatosEquipo');
   const data = JSON.parse(datos.data)
   const datosServidorLocal = await peticionesFetchOffline('getDataByField', datos.tabla,'identificadordb',data.identificadordb);
   if(datosServidorLocal){
    const envio = await peticionesFetchOffline('deleteEntry',datos.tabla, datosServidorLocal.id);
    if(envio[0] === 'ok'){

     try{
            let equiposRegistro = [];
            if (datos.equipos && datos.equipos.trim() !== '') {
              equiposRegistro = datos.equipos.split(',').map(e => e.trim());
            }

            if (!equiposRegistro.includes(datosMachine.hostname)) {
              equiposRegistro.push(datosMachine.hostname);
            }


            const cambios = await peticionesFetch(
              `${link.value}${api.value}`,
              'actualizaruncampo/data_pendiente',
              {
                campo: 'equipos',
                valor: equiposRegistro.join(','),
                id: datos.id
              },
              tokenCifrado.value,
              'POST',
              'online'
            );
     }catch(error){
      console.log("error", error);

     }



    }
   }
}
/*************************************************************/
const revisaCambios = async () => {
  if (!navigator.onLine) {
     return
  }
  const fechasNfecha = nfecha('timestampcompleta')
  try {

    const datosMachine = await peticionesFetchOffline('obtenerDatosEquipo');
    const datosPendientes = await peticionesFetch(
      `${link.value}${api.value}`,
      'datos_pendientes',                  
      {
        id_machine:datosMachine.hostname
      },
      tokenCifrado.value,
      'POST',
      'online'
    );

    if (datosPendientes.data.length > 0) {
       toast.removeAllGroups();
      toast.add({ severity: 'warn', summary: 'Datos nuevos', detail: 'Se han registrado cambios en el servirdor', life: 3000 });

      for (const datos of datosPendientes.data) {
        if (datos.accion === 'crear') {

          await fnCrearDatosLocal(datos)

        }else if(datos.accion === 'borrar'){
          await borrarDataInterna(datos)
        }else if(datos.accion === 'actualizar'){
            const dataN = JSON.parse(datos.data);
            delete dataN.id;
            if(datos.tabla === 'facturas'){
                const datosServidorLocal = await peticionesFetchOffline('getDataByField', datos.tabla,'no_factura',dataN.no_factura);
                 if(datosServidorLocal){
                    await actualizarDatosLocal(datos,datosServidorLocal.id)
                 }else{
                   await fnCrearDatosLocal(datos)
                 }
            }else if(datos.tabla === 'productos'){
                const datosServidorLocal = await peticionesFetchOffline('getDataByField', datos.tabla,'codigo',dataN.codigo);
                 if(datosServidorLocal){
                    await actualizarDatosLocal(datos,datosServidorLocal.id)
                 }else{
                   await fnCrearDatosLocal(datos)
                 }
            }else if(datos.tabla === 'taller'){
                const datosServidorLocal = await peticionesFetchOffline('getDataByField', datos.tabla,'no_factura',dataN.no_factura);
                 if(datosServidorLocal){
                    await actualizarDatosLocal(datos,datosServidorLocal.id)
                 }else{
                   await fnCrearDatosLocal(datos)
                 }
            }else if(datos.tabla === 'cuentas_cobrar'){
                const datosServidorLocal = await peticionesFetchOffline('getDataByField', datos.tabla,'no_emision',dataN.no_emision);
                 if(datosServidorLocal){
                    await actualizarDatosLocal(datos,datosServidorLocal.id)
                 }else{
                   await fnCrearDatosLocal(datos)
                 }
            }else{
                const datosServidorLocal = await peticionesFetchOffline('getDataByField', datos.tabla,'identificadordb',dataN.identificadordb);
                 if(datosServidorLocal){
                    await actualizarDatosLocal(datos,datosServidorLocal.id)
                 }else{
                   await fnCrearDatosLocal(datos)
                 }
            }
        }
      }
    }


    console.log("datosPendientes", datosPendientes);


  } catch (error) {
    console.log("error", error);
  }
};
/***************************************************************/
onMounted(async() => {


  const storedRoute = localStorage.getItem('previousRoute');
  if (storedRoute) {
    previousRoute.value = JSON.parse(storedRoute);
  }

addClassToLayoutWrapper()

await handler()

const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;

tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
linkInventario.value = datosJSON.VITE_LINK_INVENTARIO;

tokenCifrado.value = await encryptarPassword(token.value, 10);

const sonido = datosJSON.VITE_SOUND;

tipo.value = datosJSON.OFFLINE === "true"?'Offline':'Online'

if(!sonido){
   sonidoON.value = sonido;
}else{
   sonidoON.value = sonido;
}


/****************************************************/
  if(window.electron){
     await crearTablaSiNoExiste(
       link.value,
       api.value,
       'tokens',
       ['almacen', 'nombre', 'token', 'usuario', 'identificadordb'],
       tokenCifrado.value,
       toast
     )
  }
/****************************************************/
  pendingSync.value = 0;
/****************************************************/
/****************************************************/
/*const worker = new Worker(new URL('@/workers/notificaciones.js', import.meta.url), {
    type: 'module'
  });

  // Enviar los datos necesarios
  worker.postMessage({
    token: tokenCifrado.value,
    link: link.value,
    api: api.value
  });

  // Escuchar respuestas del worker
  worker.onmessage = (e) => {
    const { tipo, data, mensaje } = e.data;

    if (tipo === 'alerta') {
      notifications.value = data;
      unreadCount.value = data.filter((notif) => !notif.read).length;
      //window.electron.ipcRenderer.invoke("play-sound",'Subtle.mp3');
     }

    if (tipo === 'error') {
      console.warn('❌ Error en worker:', mensaje);
    }
  };*/
/****************************************************/

intervalId = startVerificationInterval();

  //const usuarioLocalStorage = localStorage.getItem('usuarioLocal');
  const usuarioLocalStorage = datosEmpresa.usuario
  console.log("usuarioLocalStorage", usuarioLocalStorage);
  tokenCifrado.value = await encryptarPassword(token.value, 10);


      const permissions = []; 
       permissions.push(datosEmpresa.usuario.usuario)
       if(window.electron){
        if(permissions.length < 1) {
          router.push('/login')
        }
     window.electron.ipcRenderer.send('toggle-menu',true, permissions);
     }

/*-----------------------------------*/
    if (usuarioLocalStorage) {
    const datosUser = usuarioLocalStorage;
    imagenUsuario(datosUser.imagen);
    usuarioLocal.value = datosUser;
   }else{
      logout(link.value,api.value,tokenCifrado.value,toast)
   }

 datosDefault.value = JSON.parse(localStorage.getItem('datosDefault'));

//const arrayPrinter = await peticionesFetch(`${link.value}${api.value}`, `datosarray/printerconfig`, {}, tokenCifrado.value, 'GET');
const arrayPrinter = await peticionesFetchOffline('getDataAsArray', 'printerconfig');

localStorage.setItem('printerconfig',JSON.stringify(arrayPrinter))


/*-----------------------------------*/


if(datosDefault.value && datosDefault.value.actualizacion_automatica === 'true'){
  if (navigator.onLine) {
  await verificarActualizacion()
}
}


/*-----------------------------------*/
  window.addEventListener('online', handleConnectionChange);
  window.addEventListener('offline', handleConnectionChange);
/*-----------------------------------*/
  checkLocalStorage();
/*-----------------------------------*/

    bindOutsideClickListener();

      if(window.electron){
  window.electron.ipcRenderer.on('qr', (qr) => {
    try {
      if (qr) {
        if(datosDefault.value.whatsapp && datosDefault.value.whatsapp === 'true'){
           generateQR(qr);
        }
      } else {
        console.error('QR code text is empty or invalid');
      }
    } catch (err) {
      console.error('Error receiving QR code:', err);
    }
  });
       }else{
         //toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }

      if(window.electron){
  try {
    nombrePC.value = await window.electron.ipcRenderer.invoke('nombrePC');
  } catch (error) {
    console.error('Error en el proceso de login:', error);
  }
       }else{
        // toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }

await fetchNotifications()

setInterval(fetchNotifications, 60000); 

      if(window.electron){
    window.electron.ipcRenderer.on('newMessage', (newMessage) => {
         toast.add({ severity: 'success', summary: 'Mensaje Nuevo', detail: `${newMessage.from}:${newMessage.text}`, life: 3000 });
    });
       }else{
         //toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }



      if(window.electron){

  window.electron.ipcRenderer.on('progreso-descarga', (porcentaje) => {
    console.log('Progreso:', porcentaje + '%');
    // Actualiza la barra de progreso en tu interfaz
    descargando.value = true;
    porcentajeDescarga.value = porcentaje;


  });

  window.electron.ipcRenderer.on('descarga-completa', (event, ruta) => {
    console.log('Descarga completada en:', ruta);
    // Muestra un diálogo o mensaje de éxito
    descargando.value = false;
    mensajeDescarga.value = `Descargado en: ${ruta}`;
    // Luego, por ejemplo, confirmar instalación:
    window.electron.ipcRenderer.send('confirmar-instalacion');
  });


       }else{
         //toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }


});
/**********************************************************/

/**********************************************************/
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
/**********************************************************/
onBeforeUnmount(() => {
    unbindOutsideClickListener();
});
/**********************************************************/
const fnDevTool = ()=>{
      if(window.electron){
    window.electron.ipcRenderer.invoke('devtools');
       }else{
         //toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }
}
/**********************************************************/

/*const logoUrl = computed(() => {
    return `/layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});*/

const onTopBarMenuButton = () => {
    topbarMenuActive.value = !topbarMenuActive.value;
};
const onSettingsClick = () => {
    topbarMenuActive.value = false;
    router.push('/configuracion');
};

//fnVender
/************************************************/
const fnVender = () => {
    topbarMenuActive.value = false;
    router.push('/vender');
};
/************************************************/
//fnCaja
const fnCaja = () => {
    topbarMenuActive.value = false;
    router.push('/caja');
};
/************************************************/
const topbarMenuClasses = computed(() => {
    return {
        'layout-topbar-menu-mobile-active': topbarMenuActive.value
    };
});

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                topbarMenuActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
};
const isOutsideClicked = (event) => {
    if (!topbarMenuActive.value) return;

    const sidebarEl = document.querySelector('.layout-topbar-menu');
    const topbarEl = document.querySelector('.layout-topbar-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};

const op = ref();
const selectOptions = ref([
    { name: 'Perfil', code: 'PF' },
    { name: 'Cerrar Sesión', code: 'CS' }
]);

const toggle = (event) => {
    op.value.toggle(event);
}

const selectedOption = ref()

const fnOption = async()=>{
if (selectedOption.value.code === 'CS') {
    await fnCrearBackup();
    await cerrarSession();
         authStore.logout();
   verificaAutentificado(router)
}else if(selectedOption.value.code === 'PF'){
    router.push('/home');
}



}

/*****************************************************************/
/*****************************************************************/

const cerrarSessiones = async()=>{

const sessiones = await peticionesFetchOffline('getDataByDoubleCondition','registrocaja','estado','Abierta','username',datosEmpresa.usuario.email);
    //await fnCrearBackup();
  for(let session of sessiones){
      session.estado = 'Cerrada'
      session.updated_at = nfecha('timestamp');
      session.otro = JSON.stringify(nombrePC.value)
     const datosEnCaja = await peticionesFetchOffline('updateData','registrocaja', JSON.stringify(session));
  }

}

/*****************************************************************/
const fnRealizarRelleno = async(campo,valor)=>{

const datos = {
  'tabla':'productos',
  'campo':campo,
  'nuevovalor':valor,
}

/* const envio = await peticiones(link.value+api.value+'/actualizarcolumnacompletadb',datos,'POST',tokenCifrado.value)*/
 const envio = await peticionesFetchOffline('updateEntireColumn','productos', campo,valor);

if (envio[0] == 'ok') {
            toast.add({
            severity: "success",
            summary: "Éxito",
            detail: "Relleno correctamente",
            life: 3000,
          });
}else{
            toast.add({
            severity: "error",
            summary: "Error",
            detail: "Error al Rellenar",
            life: 3000,
          });
}


}
/*****************************************************************/

const sincroniZarAlmacen = async()=>{

     loading.value = true;

    try {
      const nURL = linkInventario.value;
/*      const productosAlmacen = await peticionesFetch(
        `${nURL}`,
        `datosarray/productos/${token.value}`,
        { tabla: 'productos' },
        tokenCifrado.value,
        'GET'
      );*/

      const productosAlmacen = await peticionesFetchOffline('getDataAsArray', 'productos');
      const productosLocal = await peticionesFetchOffline('getDataAsArray', 'productos');

      const camposProductos = await arrayToObjetoFromTablaOffline('productos');
      const urlActualizar = nURL + "2/actualizarcampos/productos";
      const urlCrear = nURL + "2/insertar/productos";

      for (let producto of productosLocal) {
        const buscarProducto = productosAlmacen.find(prod => prod.codigo === producto.codigo);

        if (buscarProducto) {
          if (buscarProducto.hasOwnProperty('created_at')) {
            buscarProducto.updated_at = nfecha('timestamp');
          }
          buscarProducto.stock = producto.stock;
          if (buscarProducto.tipo_impuesto == '') {
              buscarProducto.tipo_impuesto = 'Incluido'
              producto.impuestos = '18.00'
          }
/*          const envioDatosUpdate = await enviarDatosPorPost(urlActualizar, buscarProducto, tokenCifrado.value);*/
          const envioDatosUpdate = await peticionesFetchOffline('updateData','productos', JSON.stringify(buscarProducto));

        } else {
          delete producto.id
          if (producto.alerta == '') {
            producto.alerta = '1'
          }
          producto.tipo_impuesto = 'Incluido'
          producto.impuestos = '18.00'
          const nuevoProducto = { ...camposProductos, ...producto };
          nuevoProducto.almacen = datosEmpresa.empresa.nombre
/*          const envioDatosCreate = await enviarDatosPorPost(urlCrear, nuevoProducto, tokenCifrado.value);*/
          const envioDatosCreate = await peticionesFetchOffline('insertData','productos', JSON.stringify(nuevoProducto));
        }
      }
      await fnRealizarRelleno('stock','0')
      loading.value = false;
    } catch (error) {
      loading.value = false;
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch data from productos',
        life: 3000
      });
    }

}


const fncerrarSession = async()=>{
  const result = await Swal.fire({
      title: '¿Qué acción deseas realizar?',
      text: "Selecciona una opción para continuar",
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Cerrar sesión',
      denyButtonText: 'Suspender sesión',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
  });

  if (result.isConfirmed) {
      if (linkInventario.value && linkInventario.value !='') {
        //await sincroniZarAlmacen()
      }
      await fnCrearBackup()

      //await peticionesFetchOffline('crearBackupSQLConControl');

      await cerrarSessiones()
      await cerrarSession();
      authStore.logout();
      verificaAutentificado(router);
  } else if (result.isDenied) {
      router.push('/login')
  } else if (result.dismiss === Swal.DismissReason.cancel) {
      console.log('Acción cancelada');
  }
};






const fnIa = ()=>{
     router.push('/ia');
}

const fnIr = (lugar)=>{
     router.push(lugar);
}

const fnAtras = ()=>{
  const storedRoute = localStorage.getItem('previousRoute');
  if (storedRoute) {
    previousRoute.value = JSON.parse(storedRoute);
    if (previousRoute.value.ruta !='login') {
       router.back();
       //router.push('/'+previousRoute.value.ruta);
    }
  }

}
/*******************************************************************/
const fnRuleta = () => {
  const promptForPassword = () => {
    Swal.fire({
      title: 'Ingrese la contraseña',
      input: 'password',
      inputPlaceholder: 'Contraseña',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const contrasenaIngresada = result.value;
        if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
          visibleRuleta.value = true;
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Contraseña incorrecta',
            text: 'La contraseña ingresada es incorrecta.'
          }).then(() => {
            promptForPassword();
          });
        }
      }
    });
  };

  promptForPassword();
};
/*******************************************************************/

const fnBuscadorProducto = ()=>{

}

const fnActivarkeyboard = () => {
  // Intentamos obtener el estado actual del teclado virtual desde el localStorage
  const currentStatus = JSON.parse(window.localStorage.getItem('TecladoVirtual'))?.activado || false;

  // Alternamos el estado actual
  const newStatus = !currentStatus;

  // Mostramos una notificación basada en el nuevo estado del teclado virtual
  if (newStatus) {
      toast.add({ severity: 'success', summary: 'Activado', detail: 'TECLADO ACTIVADO', life: 3000 });
  } else {
      toast.add({ severity: 'error', summary: 'Desactivado', detail: 'TECLADO DESACTIVADO', life: 3000 });
  }

  // Guardamos el nuevo estado en el localStorage
  window.localStorage.setItem('TecladoVirtual', JSON.stringify({ activado: newStatus }));
};



/*******************************************************************/
const textoBuscador = ref('');
const mostrarBuscador = ref(false);
const inputBuscador = ref(null);

watch(mostrarBuscador, (val) => {
  if (val) {
    nextTick(() => {
      setTimeout(() => {
        document.querySelector('#buscador').focus()
      }, 50)
    })
  }
})
/*******************************************************************/
const fnBuscador = () => {
  mostrarBuscador.value = !mostrarBuscador.value
}
/*******************************************************************/
const fnPerfil =()=>{
    router.push('/perfil')
}
/*******************************************************************/
const fnLock = ()=>{
    router.push('/lock')
}
/*******************************************************************/
// Mark notifications as read
const markNotificationsAsRead = () => {
  notifications.value.forEach((notif) => {
    notif.read = true;
  });
  unreadCount.value = 0; // Reset unread count
  // Optionally, send this update to the backend
};
/*******************************************************************/
const notificationPanel = ref(null);

const toggleNotificationsPanel = (event) => {
  markNotificationsAsRead();
  notificationPanel.value.toggle(event);
};
/*******************************************************************/
const notificationIcon = computed(() => {
  return unreadCount.value > 0 ? 'pi pi-bell' : 'pi pi-bell-outline';
});

/*******************************************************************/
const fnNotificaciones = ()=>{

}
/*******************************************************************/
const handleNotificationClick = async (notif) => {
  Swal.fire({
    title: notif.titulo,
    text: notif.mensaje,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Acción',
    cancelButtonText: 'Cerrar',
    reverseButtons: true
  }).then(async(result) => {
    if (result.isConfirmed) {
        const borrarNotificacion = await peticionesFetch(`${link.value}${api.value}`, `borrarporcampo/notificaciones`, { campo: 'id', valor: notif.id }, tokenCifrado.value, 'POST');
          router.push({ path: `${notif.accion}` });
    }
  });
};


const markAsRead = async(notif) => {
 const borrarNotificacion = await peticionesFetch(`${link.value}${api.value}`, `borrarporcampo/notificaciones`, { campo: 'id', valor: notif.id }, tokenCifrado.value, 'POST');
   //await fetchNotifications()
/*  notif.read = true;
  unreadCount.value = notifications.value.filter((n) => !n.read).length;*/
};

// Optional: Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
/*******************************************************************/
const rutasFiltradas = computed(() => {
  return rutasDisponibles.value.filter(r =>
    r.label.toLowerCase().includes(textoBuscador.value.toLowerCase())
  );
});

const irARuta = (ruta) => {
  mostrarBuscador.value = false;
  router.push(ruta);
  textoBuscador.value = ''
};
/*******************************************************************/
const fnSound = async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    const sonidoActual = datosJSON.VITE_SOUND ?? false; // Asegura que tenga un valor booleano

    // Alternar el valor de sonido
    const nuevoEstado = !sonidoActual;
    datosJSON.VITE_SOUND = nuevoEstado;

      if(window.electron){
    await window.electron.ipcRenderer.invoke('actualizarjson', datosJSON);
       }else{
         //toast.add({ severity: 'error', summary: 'Upps', detail: 'Esta funcion es solo para la aplicacion Desktop', life: 3000 });
     }
    // Guardar cambios en el JSON

    // Actualizar el estado en la UI
    sonidoON.value = nuevoEstado;

    // Mostrar notificación
    toast.add({
      severity: nuevoEstado ? 'success' : 'error',
      summary: nuevoEstado ? 'Activado' : 'Desactivado',
      detail: nuevoEstado ? 'Sonido activado' : 'Sonido desactivado',
      life: 3000,
    });
  } catch (error) {
    console.error('Error al alternar sonido:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado del sonido', life: 3000 });
  }
};
/*******************************************************************/
const fnConsultarTasaCambio = async () => {
  if (consultandoTasa.value) {
    return;
  }

  consultandoTasa.value = true;
  try {
    const data = await peticionesFetch(`${link.value}${api.value}`, 'tasacambio', {}, tokenCifrado.value, 'GET');
    if (data?.error || !data?.ok) {
      throw new Error(data?.error || 'Respuesta invalida de tasa de cambio');
    }

    ultimaTasaCambio.value = data;

    await Swal.fire({
      title: 'Tasa de Cambio',
      width: 520,
      showConfirmButton: true,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#0f766e',
      html: `
        <div style="
          border-radius:14px;
          background:linear-gradient(135deg,#f0fdfa 0%,#eff6ff 100%);
          border:1px solid #c7d2fe;
          padding:14px;
          margin-bottom:12px;
          text-align:left;
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div style="font-size:12px;color:#475569;">Par consultado</div>
            <div style="font-size:12px;color:#0f766e;font-weight:700;">Actualizado ${data.fecha || ''}</div>
          </div>
          <div style="font-size:22px;font-weight:800;color:#0f172a;margin-top:4px;">${data.moneda_origen || 'USD'} -> ${data.moneda_destino || 'DOP'}</div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;text-align:left;">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Cantidad base</div>
            <div style="font-size:20px;font-weight:700;color:#0f172a;">${data.cantidad ?? 1}</div>
          </div>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Tasa actual</div>
            <div style="font-size:20px;font-weight:800;color:#0f766e;">${Number(data.tasa || 0).toFixed(2)}</div>
          </div>
        </div>
      `
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo consultar la tasa de cambio',
      life: 3000
    });
  } finally {
    consultandoTasa.value = false;
  }
};
/*******************************************************************/
// Variables y funciones de la calculadora
const visibleCalculadora = ref(false);
const displayCalc = ref('0');
const operacionActual = ref('');
const valorAnterior = ref(null);
const operadorActivo = ref(null);
const nuevoNumero = ref(true);

const abrirCalculadora = () => {
  visibleCalculadora.value = true;
};

const cerrarCalculadora = () => {
  visibleCalculadora.value = false;
  limpiarCalculadora();
};

const limpiarCalculadora = () => {
  displayCalc.value = '0';
  operacionActual.value = '';
  valorAnterior.value = null;
  operadorActivo.value = null;
  nuevoNumero.value = true;
};

const agregarNumero = (numero) => {
  if (nuevoNumero.value) {
    displayCalc.value = numero;
    nuevoNumero.value = false;
  } else {
    if (displayCalc.value === '0' && numero !== '.') {
      displayCalc.value = numero;
    } else if (numero === '.' && displayCalc.value.includes('.')) {
      return;
    } else {
      displayCalc.value += numero;
    }
  }
};

const agregarOperador = (operador) => {
  const valorActual = parseFloat(displayCalc.value);

  if (valorAnterior.value === null) {
    valorAnterior.value = valorActual;
  } else if (operadorActivo.value) {
    const resultado = calcular();
    displayCalc.value = String(resultado);
    valorAnterior.value = resultado;
  }

  operadorActivo.value = operador;
  operacionActual.value = `${valorAnterior.value} ${operador}`;
  nuevoNumero.value = true;
};

const calcular = () => {
  const anterior = valorAnterior.value;
  const actual = parseFloat(displayCalc.value);

  let resultado = 0;

  switch (operadorActivo.value) {
    case '+':
      resultado = anterior + actual;
      break;
    case '-':
      resultado = anterior - actual;
      break;
    case '×':
      resultado = anterior * actual;
      break;
    case '÷':
      resultado = anterior / actual;
      break;
    default:
      return actual;
  }

  return resultado;
};

const igual = () => {
  if (operadorActivo.value && valorAnterior.value !== null) {
    const resultado = calcular();
    displayCalc.value = String(resultado);
    operacionActual.value = '';
    valorAnterior.value = null;
    operadorActivo.value = null;
    nuevoNumero.value = true;
  }
};

const borrarUltimo = () => {
  if (displayCalc.value.length > 1) {
    displayCalc.value = displayCalc.value.slice(0, -1);
  } else {
    displayCalc.value = '0';
  }
};

const porcentaje = () => {
  const valor = parseFloat(displayCalc.value);
  displayCalc.value = String(valor / 100);
};

const cambiarSigno = () => {
  const valor = parseFloat(displayCalc.value);
  displayCalc.value = String(valor * -1);
};
/*******************************************************************/

</script>

<template>
    <div class="layout-topbar-modern">
        <!-- Left Section: Logo & Menu -->
        <div class="topbar-left">
            <button
                class="menu-toggle-btn"
                v-if="datosEmpresa.usuario && (datosEmpresa.usuario.nivel_seguridad === 'Administrador' || datosEmpresa.usuario.nivel_seguridad === 'Soporte')"
                @click="onMenuToggle"
            >
                <i class="pi pi-bars"></i>
            </button>

            <router-link to="/" class="topbar-logo">
                <div class="logo-image-wrapper">
                    <img :src="datosEmpresa.empresa.imagen" alt="logo" />
                </div>
                <span class="logo-text">{{datosEmpresa.empresa.nombre}}</span>
            </router-link>
        </div>

        <!-- Center Section: Quick Actions -->
        <div class="topbar-center hidden lg:flex">
            <button @click="fnBuscador()" class="topbar-btn" v-tooltip.bottom="t('Search') + ' (Ctrl+K)'">
                <i class="pi pi-search"></i>
            </button>
            <button @click="fnAtras()" class="topbar-btn" v-tooltip.bottom="t('Back')">
                <i class="pi pi-arrow-left"></i>
            </button>
        </div>

        <!-- Right Section: Actions & User -->
        <div class="topbar-right">
            <!-- Quick Actions -->
            <div class="quick-actions">
                <!-- Offline indicator / sync button -->
                <Tag v-if="!isOnline" severity="danger" value="Sin conexión" style="font-size:0.75rem;" />

                <button @click="toggleDarkMode" class="topbar-icon-btn" v-tooltip.bottom="t('Theme')">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>

                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="topbar-icon-btn topbar-highlight"
                        v-tooltip.bottom="t('Colors')"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>

                <button
                    @click="fnDevTool"
                    v-if="datosEmpresa.usuario.usuario === 'Soporte'"
                    class="topbar-icon-btn"
                    v-tooltip.bottom="'DevTools'"
                >
                    <i class="pi pi-cog"></i>
                </button>

                <button @click="fnSound" class="topbar-icon-btn" v-tooltip.bottom="t('Sound')">
                    <i :class="['pi', sonidoON? 'pi-volume-up' :'pi-volume-off']"></i>
                </button>

                <button
                    v-if="datosEmpresa.usuario.nivel_seguridad ==='Soporte' || datosEmpresa.usuario.nivel_seguridad ==='Administrador'"
                    @click="fnIr('/calendar')"
                    class="topbar-icon-btn"
                    v-tooltip.bottom="t('Calendar')"
                >
                    <i class="pi pi-calendar"></i>
                </button>

                <button
                    @click="abrirCalculadora"
                    class="topbar-icon-btn"
                    v-tooltip.bottom="'Calculadora'"
                >
                    <i class="pi pi-calculator"></i>
                </button>

                <button
                    @click="fnConsultarTasaCambio"
                    class="topbar-icon-btn"
                    :disabled="consultandoTasa"
                    v-tooltip.bottom="'Tasa USD/DOP'"
                >
                    <i :class="['pi', consultandoTasa ? 'pi-spin pi-spinner' : 'pi-dollar']"></i>
                </button>
            </div>

            <!-- Language Switcher -->
            <LanguageSwitcher />

            <!-- Mobile Menu Toggle -->
            <button
                class="mobile-menu-btn lg:hidden"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <!-- Main Actions Menu -->
            <div class="main-actions-menu hidden lg:flex">
                <button
                    @click="fnCaja()"
                    v-if="datosEmpresa.usuario.nivel_seguridad !='Vendedor'"
                    class="action-btn"
                >
                    <i class="pi pi-inbox"></i>
                    <span>{{ t('Cash Register') }}</span>
                </button>

                <button @click="fnVender()" class="action-btn action-btn-primary">
                    <i class="pi pi-cart-plus"></i>
                    <span>{{ t('Sell') }}</span>
                </button>

                <OverlayBadge :value="unreadCount">
                    <button
                        class="action-btn notification-button"
                        @click="toggleNotificationsPanel"
                        :class="{ 'notification-unread': unreadCount > 0 }"
                    >
                        <i :class="['pi', unreadCount > 0 ? 'pi-bell' : 'icon-bell-off']"></i>
                        <span v-if="unreadCount > 0" class="notification-badge-modern">{{ unreadCount }}</span>
                    </button>
                </OverlayBadge>

                <button @click="toggle" class="action-btn">
                    <i class="pi pi-user"></i>
                    <span>{{ t('Profile') }}</span>
                </button>

                <button
                    @click="onSettingsClick()"
                    v-if="usuarioLocal.usuario == 'Soporte' || usuarioLocal.usuario == 'Administrador'"
                    class="action-btn"
                >
                    <i class="pi pi-cog"></i>
                    <span>{{ t('Settings') }}</span>
                </button>
            </div>
        </div>

<OverlayPanel ref="notificationPanel" style="width: 350px">
  <div v-if="notifications.length > 0">
    <div
      v-for="(notif, index) in notifications"
      :key="index"
      class="notification-item"
      :class="{ unread: !notif.read }"
      @click="handleNotificationClick(notif)"
    >
      <div class="notification-content">
        <h4 class="notification-title">{{ notif.titulo }}</h4>
        <p class="notification-message">{{ notif.mensaje }}</p>
        <small class="notification-date">{{ formatDate(notif.created_at) }}</small>
      </div>
      <button
        class="mark-as-read-btn"
        v-if="!notif.read"
        @click.stop="markAsRead(notif)"
      >
        {{ t('Mark as read') }}
      </button>
    </div>
  </div>
  <p v-else>{{ t('No new notifications') }}</p>
</OverlayPanel>


        <OverlayPanel ref="op">
                    <Card style="width: 15rem; overflow: hidden">
 <template #header>
                            <div class="card flex justify-content-center">
                            <Image
                              :alt="datosEmpresa.usuario.nombre"
                              width="150"
                              v-if="datosEmpresa.usuario.imagen"
                              :src="datosEmpresa.usuario.imagen"
                         
                            />

                            </div>
                        </template>
                        <template #title>{{datosEmpresa.usuario.nombre}}</template>
                        <template #footer>
                            <div class="flex- gap-3- mt-1">
                                <Button :label="t('Profile')" @click="fnPerfil" severity="secondary" outlined class="w-full" />
                                <Button :label="t('Lock')" @click="fnLock" severity="secondary" outlined class="w-full" />
                                <Button :label="t('Close Session')" severity="danger" @click="fncerrarSession" outlined class="w-full" />
                            </div>
                        </template>
                    </Card>

<!--                <div class=" flex justify-content-center">
               <Listbox v-model="selectedOption" @click="fnOption" :options="selectOptions" optionLabel="name" class="w-full md:w-15rem" />
              </div> -->
        </OverlayPanel>


    </div>


  <LoadingOverlay :visible="loading" />


    <Dialog v-model:visible="qrDialogVisible" :style="{ width: '50vw' }" :modal="true" :dismissableMask="true">
      <div class="flex flex-col items-center justify-center">
       
        <img :src="qrCode" alt="QR Code" class="mx-auto text-center w-64 h-64" />
  
        <p class="mt-4 text-center">Escanea este código QR con tu teléfono para iniciar sesión en WhatsApp Web.</p>
      </div>
    </Dialog>

<Transition name="fade">
  <div
    v-if="mostrarBuscador"
    class="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50 w-50"
  >
    <div class="flex justify-between items-center mb-3">
      <span class="font-semibold text-gray-700 dark:text-white">{{ t('Search') }}</span>
      <button @click="mostrarBuscador = false" class="text-gray-500 hover:text-red-500">
        <i class="pi pi-times"></i>
      </button>
    </div>

    <InputGroup>

        <InputText
          id="buscador"
          v-model="textoBuscador"
          :placeholder="t('Search...')"
          class="w-full"
        />


      <InputGroupAddon>
        <Button
          icon="pi pi-delete-left"
          v-if="textoBuscador"
          fluid
          class="min-h-[40px] h-[45px]"
          @click="textoBuscador = ''"
        />
      </InputGroupAddon>
    </InputGroup>

    <ul v-if="textoBuscador && rutasDisponibles.length" class="mt-2 bg-white dark:bg-gray-800 p-2 rounded shadow-md w-full z-50">
      <li
        v-for="ruta in rutasFiltradas"
        :key="ruta.path"
        @click="irARuta(ruta.path)"
        class="cursor-pointer px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      >
        {{ ruta.label }}
      </li>
    </ul>
  </div>
</Transition>


 <Dialog v-model:visible="descargando" :closable="false" modal :header="t('Update') + '...'" :style="{ width: '350px' }">
    <p class="mb-3">{{ t('Loading') }}... {{ porcentajeDescarga }}%</p>
    <ProgressBar :value="porcentajeDescarga" showValue />
    <p v-if="mensajeDescarga" class="mt-3">{{ mensajeDescarga }}</p>
</Dialog>

<!-- Modal Calculadora -->
<Dialog v-model:visible="visibleCalculadora" modal header="Calculadora" :style="{ width: '320px' }" :closable="true">
  <template #header>
    <div class="flex items-center gap-2">
      <i class="pi pi-calculator text-blue-600"></i>
      <span class="font-bold">Calculadora</span>
    </div>
  </template>

  <div class="calculadora-container">
    <!-- Display -->
    <div class="calc-display-container">
      <div class="calc-operacion">{{ operacionActual }}</div>
      <div class="calc-display">{{ displayCalc }}</div>
    </div>

    <!-- Buttons -->
    <div class="calc-buttons">
      <!-- Fila 1 -->
      <button @click="limpiarCalculadora" class="calc-btn calc-btn-function">C</button>
      <button @click="cambiarSigno" class="calc-btn calc-btn-function">±</button>
      <button @click="porcentaje" class="calc-btn calc-btn-function">%</button>
      <button @click="agregarOperador('÷')" class="calc-btn calc-btn-operator">÷</button>

      <!-- Fila 2 -->
      <button @click="agregarNumero('7')" class="calc-btn">7</button>
      <button @click="agregarNumero('8')" class="calc-btn">8</button>
      <button @click="agregarNumero('9')" class="calc-btn">9</button>
      <button @click="agregarOperador('×')" class="calc-btn calc-btn-operator">×</button>

      <!-- Fila 3 -->
      <button @click="agregarNumero('4')" class="calc-btn">4</button>
      <button @click="agregarNumero('5')" class="calc-btn">5</button>
      <button @click="agregarNumero('6')" class="calc-btn">6</button>
      <button @click="agregarOperador('-')" class="calc-btn calc-btn-operator">-</button>

      <!-- Fila 4 -->
      <button @click="agregarNumero('1')" class="calc-btn">1</button>
      <button @click="agregarNumero('2')" class="calc-btn">2</button>
      <button @click="agregarNumero('3')" class="calc-btn">3</button>
      <button @click="agregarOperador('+')" class="calc-btn calc-btn-operator">+</button>

      <!-- Fila 5 -->
      <button @click="agregarNumero('0')" class="calc-btn calc-btn-zero">0</button>
      <button @click="agregarNumero('.')" class="calc-btn">.</button>
      <button @click="borrarUltimo" class="calc-btn calc-btn-function">⌫</button>
      <button @click="igual" class="calc-btn calc-btn-equal">=</button>
    </div>
  </div>

  <template #footer>
    <Button label="Cerrar" icon="pi pi-times" severity="secondary" outlined @click="cerrarCalculadora" />
  </template>
</Dialog>


</template>

<style >
/* ===== MODERN TOPBAR STYLES ===== */
.layout-topbar-modern {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: var(--app-topbar-bg, linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid color-mix(in srgb, var(--app-primary-color, #6366f1) 20%, transparent);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1000;
  transition: all 0.3s ease;
}

/* Left Section */
.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-toggle-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-topbar-button-bg, rgba(99, 102, 241, 0.1));
  border: none;
  border-radius: 10px;
  color: var(--app-topbar-button-text, #6366f1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-toggle-btn:hover {
  background: color-mix(in srgb, var(--app-primary-color, #6366f1) 20%, transparent);
  transform: scale(1.05);
}

.topbar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.topbar-logo:hover {
  background: color-mix(in srgb, var(--app-primary-color, #6366f1) 8%, transparent);
}

.logo-image-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.logo-image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.logo-text {
  font-size: 1.125rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--app-primary-color, #6366f1) 0%, var(--app-secondary-color, #8b5cf6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Center Section */
.topbar-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.25rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.topbar-btn {
  padding: 0.625rem 1rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--app-topbar-text, #64748b);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topbar-btn:hover {
  background: color-mix(in srgb, var(--app-primary-color, #6366f1) 12%, transparent);
  color: var(--app-primary-color, #6366f1);
  transform: translateY(-1px);
}

/* Right Section */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
}

.topbar-icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--app-topbar-text, #64748b);
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.topbar-icon-btn:hover {
  background: color-mix(in srgb, var(--app-primary-color, #6366f1) 12%, transparent);
  color: var(--app-primary-color, #6366f1);
  transform: scale(1.1);
}

.topbar-highlight {
  background: linear-gradient(135deg, var(--app-primary-color, #6366f1) 0%, var(--app-secondary-color, #8b5cf6) 100%);
  color: white;
}

.topbar-highlight:hover {
  background: linear-gradient(135deg, var(--app-secondary-color, #8b5cf6) 0%, var(--app-primary-color, #6366f1) 100%);
  transform: scale(1.1);
}

.mobile-menu-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-topbar-button-bg, rgba(99, 102, 241, 0.1));
  border: none;
  border-radius: 10px;
  color: var(--app-topbar-button-text, #6366f1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover {
  background: color-mix(in srgb, var(--app-primary-color, #6366f1) 20%, transparent);
}

/* Main Actions Menu */
.main-actions-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid color-mix(in srgb, var(--app-primary-color, #6366f1) 15%, transparent);
  border-radius: 10px;
  color: var(--app-topbar-text, #475569);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.action-btn:hover {
  background: color-mix(in srgb, var(--app-primary-color, #6366f1) 12%, transparent);
  border-color: var(--app-primary-color, #6366f1);
  color: var(--app-primary-color, #6366f1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--app-primary-color, #6366f1) 25%, transparent);
}

.action-btn i {
  font-size: 1.125rem;
}

.action-btn-primary {
  background: linear-gradient(135deg, var(--app-primary-color, #6366f1) 0%, var(--app-secondary-color, #8b5cf6) 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--app-primary-color, #6366f1) 35%, transparent);
}

.action-btn-primary:hover {
  background: linear-gradient(135deg, var(--app-secondary-color, #8b5cf6) 0%, var(--app-primary-color, #6366f1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--app-primary-color, #6366f1) 45%, transparent);
}

/* Notification Badge Modern */
.notification-badge-modern {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0 6px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: badgePulse 2s infinite;
}

@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .topbar-center {
    display: none;
  }

  .quick-actions {
    display: none;
  }
}

@media (max-width: 768px) {
  .layout-topbar-modern {
    padding: 0.5rem 1rem;
  }

  .logo-text {
    display: none;
  }

  .action-btn span {
    display: none;
  }

  .action-btn {
    padding: 0.625rem;
    min-width: 42px;
    justify-content: center;
  }
}

/* Original Badge styling for notification count */
.notification-badge {
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 0.15em 0.4em;
  font-size: 0.7rem;
  position: absolute;
  top: -8px;
  right: -10px;
  min-width: 1.2em;
  height: 1.2em;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.2);
  z-index: 10;
  animation: badgeBlink 1s infinite alternate;
}

/* Notification button icon animation */
.notification-button.notification-unread .pi {
  color: #ff5733;
  animation: pulse 1s infinite;
}

/* Notification item styling */
.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5em;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #f0f0f0;
}

.notification-item.unread .notification-title {
  font-weight: bold;
  color: #ff5733; /* Optional color for unread titles */
}


/* Apply blink effect to unread items */
.notification-item.unread {
  animation: blink 1s infinite alternate; /* Blink effect */
}

/* Notification content sections */
.notification-content {
  flex-grow: 1;
  padding-right: 10px;
}

.notification-title {
  margin: 0;
  font-size: 1rem;
}

.notification-message {
  margin: 0.25em 0;
  font-size: 0.875rem;
  color: #555;
}

.notification-date {
  font-size: 0.75rem;
  color: #888;
}

/* Mark as Read button styling */
.mark-as-read-btn {
  background: none;
  border: none;
  color: #007bff;
  font-size: 0.75rem;
  cursor: pointer;
}

.mark-as-read-btn:hover {
  text-decoration: underline;
}

/* Keyframes for animations */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes blink {
  0% {
    background-color: rgba(255, 87, 51, 0.1); /* Light orange */
  }
  100% {
    background-color: rgba(255, 87, 51, 0.3); /* Darker orange */
  }
}


@keyframes badgeBlink {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* ===== CALCULADORA STYLES ===== */
.calculadora-container {
  padding: 0.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
}

.calc-display-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.25rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-height: 80px;
}

.calc-operacion {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  text-align: right;
  min-height: 20px;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.calc-display {
  color: white;
  font-size: 2rem;
  font-weight: 700;
  text-align: right;
  word-break: break-all;
  font-family: 'Courier New', monospace;
}

.calc-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.calc-btn {
  padding: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: white;
  color: #2d3748;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  user-select: none;
}

.calc-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.calc-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.calc-btn-function {
  background: linear-gradient(135deg, #a8b8d8 0%, #8693ab 100%);
  color: white;
}

.calc-btn-function:hover {
  background: linear-gradient(135deg, #8693ab 0%, #a8b8d8 100%);
}

.calc-btn-operator {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.5rem;
}

.calc-btn-operator:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.calc-btn-equal {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-size: 1.5rem;
}

.calc-btn-equal:hover {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
}

.calc-btn-zero {
  grid-column: span 2;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .calculadora-container {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  }

  .calc-btn {
    background: #4a5568;
    color: #e2e8f0;
  }

  .calc-btn:hover {
    background: #5a6778;
  }
}



</style>
