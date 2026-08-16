<script setup>
import { ref, onMounted, watch,nextTick, watchEffect, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter,useRoute } from 'vue-router';
import Menu from 'primevue/menu';
import Button from 'primevue/button';
const router = useRouter();
const { t } = useI18n();
import Swal from 'sweetalert2'
import Awesomplete from '@/components/Awesomplete.vue';
import html2canvas from 'html2canvas';
import jszip from 'jszip';
import jsPDF from 'jspdf';
import pdfmake from 'pdfmake';
import axios from 'axios';
import { useToast } from 'primevue/usetoast';
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';

import EnviarWhatsApp from '@/components/WhatsappModal.vue';
import EmailModal from '@/components/EmailModal.vue';
import IphoneDeviceReport from '@/components/device-report/IphoneDeviceReport.vue';

import SelectButton from 'primevue/selectbutton';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputSwitch from 'primevue/inputswitch';

import {enviarDatosPorPost,
  eliminarDatos,
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  asientoDiario,
  decimales,
  transformarFechaTimestamp,
  peticiones,
  formatearFecha,
  generadorCodigo,
  arrayToObjetoFromTabla,
  arrayToObjetoFromTablaOffline,
  peticionesFetch,
  encryptarPassword,
  permisosPagina,
  envioElectron,
  convertirAFechaTimestamp,
    esFechaEnRango,
  mensajetoast,
  peticionesFetchOffline,
  enviarDatosLocalStorage,
  verificaAutentificado,
  lasMayusculas,
  formatoMonedaRD} from '../funciones/funciones.js';
import { facturaNueva } from '@/funciones/funcionesVentas.js';

//import config from '../../../../resources/config.json';
const toast = useToast();
/****************************************************/
const emailModal = ref();

const abrirModalCorreo = () => {
  emailModal.value.show({
    mailto: 'ejemplo@correo.com',
    subjet: 'Factura enviada',
    mensaje: 'Adjunto la factura correspondiente.'
  });
};
/****************************************************/
const loading = ref(false)
const position = "top";
/****************************************************/
const crearDiagnosticoFallback = (error = '') => ({
  connected: false,
  source: 'fallback-local',
  generatedAt: new Date().toISOString(),
  environment: {
    helperPath: 'No disponible',
    ideviceinfo: false,
    ideviceId: false,
    appleMobileDeviceService: {
      installed: false,
      running: false,
      status: 'No disponible'
    }
  },
  device: {
    name: 'iPhone',
    model: 'No disponible',
    iosVersion: 'No disponible',
    serial: 'No disponible',
    udid: 'No disponible',
    imei: 'No disponible',
    battery: 'No disponible',
    batteryHealth: 'No disponible',
    storage: 'No disponible',
    color: 'No disponible',
    class: 'No disponible',
    connectionStatus: 'No detectado'
  },
  reportItems: [],
  checklist: [
    { key: 'battery', label: 'Bateria', status: 'Pendiente', detail: 'Revisar salud, carga y consumo.' },
    { key: 'speakers', label: 'Bocinas', status: 'Pendiente', detail: 'Probar auricular y altavoz principal.' },
    { key: 'microphones', label: 'Microfonos', status: 'Pendiente', detail: 'Probar llamadas y notas de voz.' },
    { key: 'front_camera', label: 'Camara frontal', status: 'Pendiente', detail: 'Validar foto, video y enfoque.' },
    { key: 'rear_camera', label: 'Camara trasera', status: 'Pendiente', detail: 'Validar sensores, flash y video.' },
    { key: 'face_id', label: 'Face ID', status: 'Pendiente', detail: 'Revisar enrolamiento y desbloqueo.' },
    { key: 'screen', label: 'Pantalla y touch', status: 'Pendiente', detail: 'Brillo, pixeles y tactil.' },
    { key: 'buttons', label: 'Botones', status: 'Pendiente', detail: 'Power, volumen y silencio.' },
    { key: 'connectivity', label: 'Conectividad', status: 'Pendiente', detail: 'Wi-Fi, Bluetooth, SIM y carga.' },
    { key: 'sensors', label: 'Sensores', status: 'Pendiente', detail: 'Proximidad, vibracion y giro.' }
  ],
  notes: 'No se pudo cargar la lectura automatica. Complete el diagnostico manual.',
  error
});
/****************************************************/
const visibleIphoneDiagnostic = ref(false);
const loadingIphoneDiagnostic = ref(false);
const iphoneDiagnostic = ref(crearDiagnosticoFallback('No se ha ejecutado el diagnostico.'));
const visibleIphoneDiagnosticPdf = ref(false);
const iphoneDiagnosticPdfSrc = ref('');
const iphoneDiagnosticPdfBlobUrl = ref('');
/****************************************************/
/*DataTable.use(DataTablesCore);
DataTablesCore.Buttons.jszip(jszip);
DataTablesCore.Buttons.pdfMake(pdfmake);*/
/****************************************************/
const productosSinStock = ref([])
const cotizacionesArray = ref([])
/****************************************************/
const menu = ref(null);
/****************************************************/
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref(null);
const tokenCorto = ref('');
const tokenSoloUso = ref('');
const token24H = ref('');
/****************************************************/
document.body.classList.add('sidebar-close');
/****************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();
/****************************************************/
const dataFacturas = ref([]);
const dataIMEI = ref([]);
const cantidadFacturas = ref(0);
const cantidadFacturasHoy = ref(0);
const cantidadFacturasSemanaActual = ref(0);
const dataCotizaciones = ref([]);
const dataProductosStock = ref([]);
const dataVencidos = ref([]);
const dataCompras = ref([]);
const dataProductos = ref([]);
const cantidadProductos = ref(0);
const dataCLientes = ref([])
const cantidadCLientes = ref(0)
const datosDelDia = ref({
    "venta": 0.00,
    "efectivo": 0.00,
    "transferencia": 0.00,
    "tarjeta": 0.00,
    "ganancia": 0.00,
    "gastos": 0.00,
    "impuestos": 0.00,
    "entradas": 0.00,
    "devoluciones": 0.00,
    "inicioCaja": 0.00,
    "abono": 0.00,
    "taller": 0.00
});
const datosSemanaActual = ref({
    "venta": 0.00,
    "efectivo": 0.00,
    "transferencia": 0.00,
    "tarjeta": 0.00,
    "ganancia": 0.00,
    "gastos": 0.00,
    "impuestos": 0.00,
    "entradas": 0.00,
    "devoluciones": 0.00,
    "inicioCaja": 0.00,
    "abono": 0.00,
    "taller": 0.00
});
/****************************************************/
const datosFactCoti = ref({'numero':'','tipo':'Factura','nombre':'','impresora':'Termica'});
const datosConfiguracion = ref({})
const datosDefault = ref({})
const usuarioLocalStorage = ref({})
const mostrarHomeBoard = ref(true)
const mostrarHomeResumen = ref(false)
const mostrarHomeTallerCards = ref(true)
const mostrarAccionesRapidas = ref(true)
const mostrarDashboardDetalle = ref(true)
const mostrarTopProductos = ref(false)
const mostrarPanelTaller = ref(false)
const mostrarPanelCobranza = ref(false)
const mostrarPanelInventario = ref(false)
const mostrarInfoSistema = ref(true)
const ocultarAnalisisFinancieroSemanal = ref(false)
const botonesEnTarjeta = ref(true)
const mostrarAnalisisFinancieroSemanal = computed({
  get: () => !ocultarAnalisisFinancieroSemanal.value,
  set: (valor) => {
    ocultarAnalisisFinancieroSemanal.value = !valor
  }
})
const homeDisplayToggles = [
  { label: 'Dashboard central', model: mostrarHomeBoard, key: 'homeMostrarDashboardCentral' },
  { label: 'Resumen principal', model: mostrarHomeResumen, key: 'homeMostrarResumenPrincipal' },
  { label: 'Cards de taller', model: mostrarHomeTallerCards, key: 'homeMostrarTallerCards' },
  { label: 'Acciones rapidas', model: mostrarAccionesRapidas, key: 'homeMostrarAccionesRapidas' },
  { label: 'Dashboard detalle', model: mostrarDashboardDetalle, key: 'homeMostrarDashboardDetalle' },
  { label: 'Top productos', model: mostrarTopProductos, key: 'homeMostrarTopProductos' },
  { label: 'Panel taller', model: mostrarPanelTaller, key: 'homeMostrarPanelTaller' },
  { label: 'Panel cobranza', model: mostrarPanelCobranza, key: 'homeMostrarPanelCobranza' },
  { label: 'Panel inventario', model: mostrarPanelInventario, key: 'homeMostrarPanelInventario' },
  { label: 'Informacion del sistema', model: mostrarInfoSistema, key: 'homeMostrarInfoSistema' }
]
const visibleRutasPublicas = ref(false)
const rutasPublicas = [
  { label: 'Bloqueo', path: '/bloqueo', icon: 'pi pi-lock' },
  { label: 'Acceso denegado', path: '/access', icon: 'pi pi-ban' },
  { label: 'Registro clientes', path: '/registroclientes', icon: 'pi pi-user-plus' },
  { label: 'Catalogo', path: '/catalogo', icon: 'pi pi-list' },
  { label: 'Comanda', path: '/comanda', icon: 'pi pi-table' },
  { label: 'Comanda taller', path: '/comandataller', icon: 'pi pi-wrench' },
  { label: 'Consultar taller', path: '/consultar-taller', icon: 'pi pi-search' },
  { label: 'Firma entrega taller', path: '/firma-entrega-taller/NUMERO_ORDEN', icon: 'pi pi-pencil' },
  { label: 'Consulta facturas', path: '/consulta-facturas', icon: 'pi pi-file-search' },
  { label: 'Historial facturas cliente', path: '/historial-facturas-cliente', icon: 'pi pi-history' },
  { label: 'Consulta CxC', path: '/consulta-cuentas-cobrar', icon: 'pi pi-wallet' },
  { label: 'Consulta cotizaciones', path: '/consulta-cotizaciones', icon: 'pi pi-file-edit' },
  { label: 'Consulta apartados', path: '/consulta-apartados', icon: 'pi pi-bookmark' },
  { label: 'Consulta reclamaciones', path: '/consulta-reclamaciones', icon: 'pi pi-shield' },
  { label: 'Consulta fidelizacion', path: '/consulta-fidelizacion', icon: 'pi pi-star' },
  { label: 'Consulta inventario', path: '/consulta-inventario', icon: 'pi pi-box' },
  { label: 'Entrar cliente', path: '/entrarcliente', icon: 'pi pi-sign-in' },
  { label: 'Error', path: '/error', icon: 'pi pi-exclamation-triangle' },
  { label: 'Sin permiso', path: '/notpermission', icon: 'pi pi-shield' },
  { label: 'Lock', path: '/lock', icon: 'pi pi-lock' },
  { label: 'Not found', path: '/notfound', icon: 'pi pi-question-circle' }
]

const obtenerUrlCompletaRutaPublica = (path) => {
  const baseUrl = window.location.origin || ''
  return `${baseUrl}${path}`
}

const compartirRutaPublicaWhatsApp = (ruta) => {
  const url = obtenerUrlCompletaRutaPublica(ruta.path)
  const mensaje = encodeURIComponent(`${ruta.label}: ${url}`)
  window.open(`https://wa.me/?text=${mensaje}`, '_blank')
}

const guardarPreferenciasHome = async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo')
    datosJSON.homeDisplayPreferences = {
      mostrarHomeBoard: mostrarHomeBoard.value,
      mostrarHomeResumen: mostrarHomeResumen.value,
      mostrarHomeTallerCards: mostrarHomeTallerCards.value,
      mostrarAccionesRapidas: mostrarAccionesRapidas.value,
      mostrarDashboardDetalle: mostrarDashboardDetalle.value,
      mostrarTopProductos: mostrarTopProductos.value,
      mostrarPanelTaller: mostrarPanelTaller.value,
      mostrarPanelCobranza: mostrarPanelCobranza.value,
      mostrarPanelInventario: mostrarPanelInventario.value,
      mostrarInfoSistema: mostrarInfoSistema.value,
      ocultarAnalisisFinancieroSemanal: ocultarAnalisisFinancieroSemanal.value,
      botonesEnTarjeta: botonesEnTarjeta.value
    }
    await window.electron.ipcRenderer.invoke('actualizarjson', datosJSON)
  } catch (error) {
    console.error('Error al guardar preferencias home:', error)
  }
}

const cargarPreferenciasHome = async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo')
    const prefs = datosJSON.homeDisplayPreferences
    if (prefs) {
      mostrarHomeBoard.value = prefs.mostrarHomeBoard ?? true
      mostrarHomeResumen.value = prefs.mostrarHomeResumen ?? false
      mostrarHomeTallerCards.value = prefs.mostrarHomeTallerCards ?? true
      mostrarAccionesRapidas.value = prefs.mostrarAccionesRapidas ?? true
      mostrarDashboardDetalle.value = prefs.mostrarDashboardDetalle ?? true
      mostrarTopProductos.value = prefs.mostrarTopProductos ?? false
      mostrarPanelTaller.value = prefs.mostrarPanelTaller ?? false
      mostrarPanelCobranza.value = prefs.mostrarPanelCobranza ?? false
      mostrarPanelInventario.value = prefs.mostrarPanelInventario ?? false
      mostrarInfoSistema.value = prefs.mostrarInfoSistema ?? true
      ocultarAnalisisFinancieroSemanal.value = prefs.ocultarAnalisisFinancieroSemanal ?? false
      botonesEnTarjeta.value = prefs.botonesEnTarjeta ?? true
    }
  } catch (error) {
    console.error('Error al cargar preferencias home:', error)
  }
}

homeDisplayToggles.forEach((toggle) => {
  watch(toggle.model, guardarPreferenciasHome)
})

watch(ocultarAnalisisFinancieroSemanal, guardarPreferenciasHome)
watch(botonesEnTarjeta, guardarPreferenciasHome)

const mostrarTodosLosCardsHome = () => {
  homeDisplayToggles.forEach((toggle) => {
    toggle.model.value = true
  })
  ocultarAnalisisFinancieroSemanal.value = false
}
/****************************************************/
const showWhatsapp = ref(false);
const visiblegastos = ref(false);
const visibleCuadre = ref(false);
const visibleIMEI = ref(false);
const camposGastos = ref({});
const guardandoGasto = ref(false);
const bancoArray = ref([]);
const cuentaBancaria = ref(null);
const fechaHoy = ref(nfecha('fecha'))
/****************************************************/
const imeiModal = ref(null)
/****************************************************/
const productoBuscado = ref({
stock:'',
precio_compra:'',
ganancia:'',
impuesto:'',
precio_venta:'',
precio_min:'',
precio_xmayor:'',
imeiLista:'',
impuesto_venta:'',
precio_final:'',
nStock:'0'
});
const listaBuscador = ref([]);
const imeiShow = ref(false)
const productoSelected = ref(null)
/****************************************************/

const enviarWhatsAppRef = ref(null);
const datosWhatsApp = ref({
  nombre: 'John Doe',
  numero: '123456789',
  texto: 'Hola, este es un mensaje predefinido.'
});
/****************************************************/
const showWhatsAppModal = async () => {
  if (enviarWhatsAppRef.value) {
          enviarWhatsAppRef.value.updateDatosWhatsApp(datosWhatsApp.value);
          enviarWhatsAppRef.value.visible = true;
  }
};
/****************************************************/
const abrirWhatsapp = ()=>{
     showWhatsAppModal()
}
/****************************************************/
const visibleModificarStock = ref(false)
/****************************************************/
const closeWhatsapp = ()=>{
showWhatsapp.value = false;
}
/****************************************************/
const getDiagnosticSeverity = (status) => {
  if (status === 'Automatica') return 'success';
  if (status === 'Parcial') return 'info';
  if (status === 'Pendiente') return 'warn';
  if (status === 'Error') return 'danger';
  return 'secondary';
}
/****************************************************/
const getReportSeverity = (status) => {
  if (status === 'Normal') return 'success';
  if (status === 'Leido') return 'info';
  if (status === 'Referencia') return 'secondary';
  if (status === 'Revisar') return 'danger';
  if (status === 'Pendiente') return 'warn';
  return 'secondary';
}
/****************************************************/
const getIphoneReportScore = (diagnostic) => {
  const items = diagnostic?.reportItems || [];
  if (!items.length) return 0;

  let score = 100;
  for (const item of items) {
    if (item.status === 'Revisar') score -= 12;
    else if (item.status === 'Pendiente') score -= 5;
    else if (item.status === 'Referencia') score -= 2;
  }

  return Math.max(0, Math.min(100, score));
}
/****************************************************/
const getIphoneReportStars = (diagnostic) => {
  const score = getIphoneReportScore(diagnostic);
  return Math.max(1, Math.min(5, Math.round(score / 20)));
}
/****************************************************/
const getIphoneReportSummary = (diagnostic) => {
  const items = diagnostic?.reportItems || [];
  if (!items.length) return 'Sin datos';
  if (items.some((item) => item.status === 'Revisar')) return 'Requiere revision';
  if (items.some((item) => item.status === 'Pendiente')) return 'Inspeccion parcial';
  return 'Sin hallazgos';
}
/****************************************************/
const getIphoneReportSummarySeverity = (diagnostic) => {
  const summary = getIphoneReportSummary(diagnostic);
  if (summary === 'Sin hallazgos') return 'success';
  if (summary === 'Inspeccion parcial') return 'warn';
  if (summary === 'Requiere revision') return 'danger';
  return 'info';
}
/****************************************************/
const getIphoneLeftInfo = (diagnostic) => [
  { label: 'Model Identifier', value: diagnostic?.device?.model || 'No disponible' },
  { label: 'iOS Version', value: diagnostic?.device?.iosVersion || 'No disponible' },
  { label: 'Activation', value: diagnostic?.device?.activationState || 'No disponible' },
  { label: 'Jailbreak', value: 'No' },
  { label: 'Serial Number', value: diagnostic?.device?.serial || 'No disponible' },
  { label: 'SN Match', value: diagnostic?.reportItems?.find((item) => item.label === 'SN Match')?.readValue || 'No disponible' },
  { label: '5-Code Match', value: diagnostic?.reportItems?.find((item) => item.label === '5-Code Match')?.readValue || 'No disponible' },
  { label: 'SIM Lock', value: diagnostic?.device?.simStatus || 'No disponible' },
  { label: 'Mfg. Date', value: 'Unknown' },
  { label: 'Warranty Period', value: 'Unknown' },
  { label: 'ID Lock', value: 'Off' },
  { label: 'Battery Life', value: diagnostic?.reportItems?.find((item) => item.label === 'Battery Life')?.readValue || diagnostic?.device?.batteryHealth || 'No disponible' },
  { label: 'Charge Cycles', value: diagnostic?.reportItems?.find((item) => item.label === 'Charge Cycles')?.readValue || 'No disponible' }
]
/****************************************************/
const getIphoneConnectivityItems = (diagnostic) => [
  { label: 'LiDAR', value: diagnostic?.reportItems?.find((item) => item.label === 'LiDAR')?.readValue || 'Empty', status: diagnostic?.reportItems?.find((item) => item.label === 'LiDAR')?.status || 'Normal' },
  { label: 'Bluetooth', value: diagnostic?.device?.bluetoothAddress || 'No disponible', status: 'Normal' },
  { label: 'Cellular Address', value: diagnostic?.device?.imei || 'No disponible', status: 'Normal' },
  { label: 'Wi-Fi Address', value: diagnostic?.device?.wifiAddress || 'No disponible', status: 'Normal' }
]
/****************************************************/
const getIphoneFaceIdItems = (diagnostic) => [
  { label: 'Face ID', value: 'Tap to Check', status: diagnostic?.checklist?.find((item) => item.key === 'face_id')?.status || 'Pendiente' },
  { label: 'Infrared Camera', value: diagnostic?.reportItems?.find((item) => item.label === 'Infrared Camera')?.readValue || 'No disponible', status: diagnostic?.reportItems?.find((item) => item.label === 'Infrared Camera')?.status || 'Pendiente' },
  { label: 'Dot Projector', value: diagnostic?.reportItems?.find((item) => item.label === 'Dot Projector')?.readValue || 'No disponible', status: diagnostic?.reportItems?.find((item) => item.label === 'Dot Projector')?.status || 'Pendiente' },
  { label: 'Distance Sensor', value: diagnostic?.reportItems?.find((item) => item.label === 'Distance Sensor')?.readValue || 'No disponible', status: diagnostic?.reportItems?.find((item) => item.label === 'Distance Sensor')?.status || 'Pendiente' }
]
/****************************************************/
const getDetectionMode = (diagnostic) => {
  const source = String(diagnostic?.source || '').toLowerCase();
  if (source.includes('ideviceinfo') || source.includes('lockdownd-wrapper') || source.includes('mobiledevice')) return 'Lectura completa';
  if (source.includes('windows-pnp') || source.includes('fallback')) return 'Deteccion basica';
  if (source.includes('error')) return 'Error';
  return 'Manual';
}
/****************************************************/
const getDetectionModeSeverity = (diagnostic) => {
  const mode = getDetectionMode(diagnostic);
  if (mode === 'Lectura completa') return 'success';
  if (mode === 'Deteccion basica') return 'info';
  if (mode === 'Error') return 'danger';
  return 'warn';
}
/****************************************************/
const getAppleServiceSeverity = (diagnostic) => {
  const service = diagnostic?.environment?.appleMobileDeviceService || {};
  if (service.running) return 'success';
  if (service.installed) return 'warn';
  return 'danger';
}
/****************************************************/
const getAppleServiceLabel = (diagnostic) => {
  const service = diagnostic?.environment?.appleMobileDeviceService || {};
  if (service.running) return 'Activo';
  if (service.installed) return 'Instalado pero detenido';
  return 'No disponible';
}
/****************************************************/
const getNextStepIphone = (diagnostic) => {
  const environment = diagnostic?.environment || {};
  const service = environment.appleMobileDeviceService || {};
  const helperError = String(diagnostic?.error || environment?.ideviceInfoStdErr || '').toLowerCase();

  if (helperError.includes('password protected') || helperError.includes('lockdownd')) {
    return 'Desbloquea el iPhone, acepta "Confiar en este ordenador" y vuelve a cargar el diagnóstico.';
  }

  if (
    String(diagnostic?.source || '').toLowerCase().includes('ideviceinfo') ||
    String(diagnostic?.source || '').toLowerCase().includes('lockdownd-wrapper') ||
    String(diagnostic?.source || '').toLowerCase().includes('mobiledevice')
  ) {
    return 'Lectura completa activa. Ya puedes revisar los datos automáticos y completar el checklist físico.';
  }

  if (service.installed && !service.running) {
    return 'Inicia Apple Mobile Device Service, reconecta el iPhone y vuelve a cargar el diagnóstico.';
  }

  if (!service.installed) {
    return 'Instala Apple Mobile Device Support o iTunes completo para habilitar la comunicación USB del iPhone.';
  }

  if (!environment.ideviceinfo || !environment.ideviceId) {
    return 'Instala libimobiledevice para poder leer serial, UDID, batería y más datos automáticos.';
  }

  if (diagnostic?.connected) {
    return 'El iPhone fue detectado de forma básica. Falta habilitar la capa de lectura profunda para obtener datos tipo 3uTools.';
  }

  return 'Conecta el iPhone, acepta "Confiar en este ordenador" y vuelve a intentar.';
}
/****************************************************/
const cargarDiagnosticoIphone = async () => {
  loadingIphoneDiagnostic.value = true;
  visibleIphoneDiagnostic.value = false;

  await Swal.fire({
    title: 'Cargando diagnostico del iPhone',
    text: 'Leyendo dispositivo conectado...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: async () => {
      Swal.showLoading();

      try {
        if (!window.electron?.ipcRenderer) {
          iphoneDiagnostic.value = crearDiagnosticoFallback('Electron IPC no esta disponible en esta ventana.');
          console.log('Diagnostico iPhone Home:', iphoneDiagnostic.value);
          Swal.close();
          await nextTick();
          visibleIphoneDiagnostic.value = true;
          return;
        }

        const resultado = await window.electron.ipcRenderer.invoke('consultaiphone', 'getDiagnosticSnapshot');
        console.log('Diagnostico iPhone Home:', resultado);

        if (resultado?.data) {
          const fallback = crearDiagnosticoFallback('');
          iphoneDiagnostic.value = {
            ...fallback,
            ...resultado.data,
            device: {
              ...fallback.device,
              ...(resultado.data?.device || {})
            },
            environment: {
              ...fallback.environment,
              ...(resultado.data?.environment || {}),
              appleMobileDeviceService: {
                ...fallback.environment.appleMobileDeviceService,
                ...(resultado.data?.environment?.appleMobileDeviceService || {})
              }
            },
            checklist:
              Array.isArray(resultado.data?.checklist) && resultado.data.checklist.length
                ? resultado.data.checklist
                : fallback.checklist
          };
        } else {
          iphoneDiagnostic.value = crearDiagnosticoFallback('No llego respuesta del proceso principal.');
        }

        Swal.close();
        await nextTick();
        visibleIphoneDiagnostic.value = true;

        if (!resultado?.success) {
          toast.add({
            severity: resultado?.data?.connected ? 'warn' : 'error',
            summary: 'Diagnostico parcial',
            detail: resultado?.message || resultado?.error || 'No se pudo completar el diagnostico.',
            life: 4000
          });
        } else if (!resultado?.data?.connected) {
          toast.add({
            severity: 'warn',
            summary: 'Sin iPhone detectado',
            detail: 'Conecte un iPhone por cable para capturar datos automaticos.',
            life: 4000
          });
        }
      } catch (error) {
        iphoneDiagnostic.value = crearDiagnosticoFallback(error?.message || 'Fallo al consultar el iPhone.');
        console.error('Diagnostico iPhone Home error:', error);
        Swal.close();
        await nextTick();
        visibleIphoneDiagnostic.value = true;
        toast.add({ severity: 'warn', summary: 'Diagnostico manual', detail: 'La lectura automatica fallo; se abrio el diagnostico manual.', life: 4000 });
      } finally {
        loadingIphoneDiagnostic.value = false;
        Swal.close();
      }
    }
  });
}
/****************************************************/
const revokeIphoneDiagnosticPdfBlob = () => {
  if (iphoneDiagnosticPdfBlobUrl.value) {
    URL.revokeObjectURL(iphoneDiagnosticPdfBlobUrl.value);
    iphoneDiagnosticPdfBlobUrl.value = '';
  }
}
/****************************************************/
const cerrarPreviewDiagnosticoIphonePdf = () => {
  visibleIphoneDiagnosticPdf.value = false;
  iphoneDiagnosticPdfSrc.value = '';
  revokeIphoneDiagnosticPdfBlob();
}
/****************************************************/
const imprimirPreviewDiagnosticoIphonePdf = () => {
  try {
    if (!iphoneDiagnosticPdfBlobUrl.value) {
      toast.add({ severity: 'warn', summary: 'PDF', detail: 'No hay PDF listo para imprimir.', life: 3500 });
      return;
    }

    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.src = iphoneDiagnosticPdfBlobUrl.value;

    frame.onload = () => {
      setTimeout(() => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        setTimeout(() => frame.remove(), 1000);
      }, 250);
    };

    document.body.appendChild(frame);
  } catch (error) {
    console.error('Error imprimiendo preview PDF iPhone:', error);
    toast.add({ severity: 'error', summary: 'PDF', detail: 'No se pudo imprimir el PDF embebido.', life: 4000 });
  }
}
/****************************************************/
const descargarBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/****************************************************/
const capturarScreenshotDiagnosticoIphone = async () => {
  try {
    const target = document.querySelector('.iphone-device-report-dialog .device-report-view');
    if (!target) {
      toast.add({ severity: 'warn', summary: 'Screenshot', detail: 'No se encontro el reporte para capturar.', life: 3500 });
      return;
    }

    const canvas = await html2canvas(target, {
      backgroundColor: '#eff5fb',
      scale: Math.min(window.devicePixelRatio || 2, 2),
      useCORS: true,
      logging: false
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
    if (!blob) {
      toast.add({ severity: 'error', summary: 'Screenshot', detail: 'No se pudo generar la imagen del reporte.', life: 4000 });
      return;
    }

    const fileName = `reporte-iphone-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    let copied = false;
    let shared = false;

    if (window.isSecureContext && navigator.clipboard?.write && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copied = true;
      } catch (clipboardError) {
        console.warn('No se pudo copiar screenshot al portapapeles:', clipboardError);
      }
    }

    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      try {
        await navigator.share({
          title: `${datosEmpresa?.empresa?.nombre || 'Empresa'} - Reporte iPhone`,
          text: 'Reporte tecnico de dispositivo iPhone',
          files: [file]
        });
        shared = true;
      } catch (shareError) {
        if (shareError?.name !== 'AbortError') {
          console.warn('No se pudo compartir screenshot:', shareError);
        }
      }
    }

    if (!copied && !shared) {
      descargarBlob(blob, fileName);
      toast.add({ severity: 'success', summary: 'Screenshot', detail: 'La imagen se descargo en tu equipo.', life: 4000 });
      return;
    }

    if (copied && shared) {
      toast.add({ severity: 'success', summary: 'Screenshot', detail: 'La imagen se copio al portapapeles y se compartio.', life: 4000 });
      return;
    }

    if (copied) {
      toast.add({ severity: 'success', summary: 'Screenshot', detail: 'La imagen se copio al portapapeles.', life: 4000 });
      return;
    }

    if (shared) {
      toast.add({ severity: 'success', summary: 'Screenshot', detail: 'La imagen se compartio correctamente.', life: 4000 });
    }
  } catch (error) {
    console.error('Error capturando screenshot diagnostico iPhone:', error);
    toast.add({ severity: 'error', summary: 'Screenshot', detail: 'No se pudo capturar el reporte del iPhone.', life: 4000 });
  }
}
/****************************************************/
const imprimirDiagnosticoIphone80mm = async () => {
  try {
    const device = iphoneDiagnostic.value?.device || {};
    const empresaNombre = datosEmpresa?.empresa?.nombre || 'Empresa';
    const generado = iphoneDiagnostic.value?.generatedAt
      ? new Date(iphoneDiagnostic.value.generatedAt).toLocaleString()
      : new Date().toLocaleString();

    const safePdfValue = (value) => String(value || 'No disponible').trim() || 'No disponible';
    const sections = [
      {
        title: 'Resumen',
        rows: [
          ['Equipo', safePdfValue(device.name)],
          ['Modelo', safePdfValue(device.model)],
          ['Model Number', safePdfValue(device.modelNumber)],
          ['Color', safePdfValue(device.color)],
          ['Capacidad', safePdfValue(device.storage)],
          ['Bateria', safePdfValue(device.battery)],
          ['Salud bateria', safePdfValue(device.batteryHealth)]
        ]
      },
      {
        title: 'Identificacion',
        rows: [
          ['Serial', safePdfValue(device.serial)],
          ['IMEI', safePdfValue(device.imei)],
          ['IMEI 2', safePdfValue(device.imei2)],
          ['UDID', safePdfValue(device.udid)],
          ['Telefono', safePdfValue(device.phoneNumber)],
          ['ICCID', safePdfValue(device.iccid)],
          ['IMSI', safePdfValue(device.imsi)]
        ]
      },
      {
        title: 'Sistema',
        rows: [
          ['iOS', safePdfValue(device.iosVersion)],
          ['Build', safePdfValue(device.buildVersion)],
          ['Region', safePdfValue(device.region)],
          ['Baseband', safePdfValue(device.basebandVersion)],
          ['Firmware', safePdfValue(device.firmwareVersion)],
          ['Hardware Model', safePdfValue(device.hardwareModel)],
          ['Hardware Platform', safePdfValue(device.hardwarePlatform)],
          ['CPU', safePdfValue(device.cpuArchitecture)]
        ]
      }
    ];

    let estimatedHeight = 52;
    sections.forEach((section) => {
      estimatedHeight += 10;
      section.rows.forEach(([, value]) => {
        const estimatedLines = Math.max(1, Math.ceil(String(value).length / 24));
        estimatedHeight += 6 + (estimatedLines * 4.4) + 1.8;
      });
      estimatedHeight += 3;
    });
    estimatedHeight += 18;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, Math.max(estimatedHeight, 120)]
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 5;
    const contentWidth = pageWidth - (marginX * 2);
    let y = 8;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(marginX, y - 4, contentWidth, 20, 2.8, 2.8, 'F');
    doc.setFillColor(37, 99, 235);
    doc.circle(marginX + 6, y + 2.5, 3.3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(15, 23, 42);
    doc.text(empresaNombre, marginX + 12, y + 1.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text('Reporte tecnico de dispositivo Apple', marginX + 12, y + 5.6);
    doc.text(generado, marginX + 12, y + 9.8);
    y += 20;

    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(marginX, y, contentWidth, 8, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.7);
    doc.setTextColor(22, 101, 52);
    doc.text('Diagnostico automatico disponible', marginX + 3.2, y + 5.2);
    y += 11;

    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 4;
    doc.setLineDashPattern([], 0);

    sections.forEach((section) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX, y, contentWidth, 7, 1.8, 1.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.6);
      doc.setTextColor(51, 65, 85);
      doc.text(section.title.toUpperCase(), marginX + 2.5, y + 4.6);
      y += 8.5;

      section.rows.forEach(([label, value]) => {
        doc.setDrawColor(241, 245, 249);
        doc.line(marginX, y + 5.8, pageWidth - marginX, y + 5.8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(100, 116, 139);
        doc.text(label, marginX, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.1);
        doc.setTextColor(17, 24, 39);
        const valueLines = doc.splitTextToSize(value, contentWidth);
        doc.text(valueLines, marginX, y + 3.7);
        y += (valueLines.length * 4.2) + 4.2;
      });

      y += 2.2;
    });

    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 4.5;
    doc.setLineDashPattern([], 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Origen: ${iphoneDiagnostic.value?.source || 'No disponible'}`, marginX, y);
    y += 4.2;
    doc.text(`Estado: ${iphoneDiagnostic.value?.connected ? 'Conectado' : 'No detectado'}`, marginX, y);

    revokeIphoneDiagnosticPdfBlob();
    const pdfBlob = doc.output('blob');
    iphoneDiagnosticPdfBlobUrl.value = URL.createObjectURL(pdfBlob);
    iphoneDiagnosticPdfSrc.value = `${iphoneDiagnosticPdfBlobUrl.value}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
    visibleIphoneDiagnosticPdf.value = true;
  } catch (error) {
    console.error('Error imprimiendo diagnostico iPhone 80mm:', error);
    toast.add({ severity: 'error', summary: 'Impresion', detail: 'No se pudo generar el PDF del diagnostico del iPhone.', life: 4000 });
  }
}
/****************************************************/
const visibleimprimirfactura = ref(false)
const campoNombreFactura = ref('')
const campoFactura = ref(null);
const impresoraSeleccionada = ref(null);
const usuarioHoy = ref(null)
const datosUsuarios = ref(null)
const usuarioTuno = ref(null);
const turnosXfecha = ref([]);
const turnoHoraInicio = ref(null)
const turnoHoraFin = ref(null)
const turnoUsuarioSelected = ref('COMPLETO')
const modoCuadre = ref('COMPLETO')
const imeiArray = ref([])
/****************************************************/
const borrartablasdb = async ()=>{

}

//////////////////////////////////////////////////////
const fetchAndSetupDataFacturas = async () => {
//const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/facturas`,{},tokenCifrado.value,'GET');
  const response = await peticionesFetchOffline('getDataAsArray', 'facturas');
    const jsonData = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre);
    dataFacturas.value = jsonData.slice(-10).reverse();
    cantidadFacturas.value = jsonData.length;
    cantidadFacturasHoy.value = jsonData.filter(fact=>fact.fecha_emision === nfecha('fecha')).length;

};
//////////////////////////////////////////////////////
//dataIMEI
const fetchIMEI = async () => {
//const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/facturas`,{},tokenCifrado.value,'GET');
  const response = await peticionesFetchOffline('getDataAsArray', 'facturas');
    const jsonData = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre);;
    dataIMEI.value = jsonData;
    imeiArray.value = response.filter(im=>im.estado === 'DISPONIBLE');

};
//////////////////////////////////////////////////////
const fetchAndSetupDataCotizaciones = async () => {
//const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/cotizacion`,{},tokenCifrado.value,'GET');
  const response = await peticionesFetchOffline('getDataAsArray', 'cotizacion');
    const jsonData = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre);
    dataCotizaciones.value = jsonData.slice(-10).reverse();
};
//////////////////////////////////////////////////////
const fetchAndSetupDataCompras = async () => {
//const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/compras`,{},tokenCifrado.value,'GET');
  const response = await peticionesFetchOffline('getDataAsArray', 'compras');
    const jsonData = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre);;
    dataCompras.value = jsonData;
};
//////////////////////////////////////////////////////
const fetchAndSetupDataProductos = async () => {
//const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/productos`,{},tokenCifrado.value,'GET');
  const response = await peticionesFetchOffline('getDataAsArray', 'productos');
    const jsonData = response.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre);
    dataProductos.value = jsonData;
    productosSinStock.value = jsonData.filter(prod => Number(prod.stock) <= Number(prod.alerta))

    cantidadProductos.value = jsonData.length;

          var arraybuscador = [];
      var arraybuscadorSoloProductos = [];
       jsonData.forEach(function(index) {
        var keys = Object.keys(index);
        var values = Object.values(index);

        for (var i = 0; i < keys.length; i++) {
          if (keys[i] == 'codigo' || keys[i] == 'codigo_barra' || keys[i] == 'nombre') {
            arraybuscador.push(values[i])
            arraybuscadorSoloProductos.push(values[i])
          }
        }

      });

    listaBuscador.value = arraybuscador;

};
//////////////////////////////////////////////////////
const fetchAndSetupDataClientes = async () => {
//const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/clientes`,{},tokenCifrado.value,'GET');
  const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    const jsonData = response;
    dataCLientes.value = jsonData;
    cantidadCLientes.value = jsonData.length;
};
//////////////////////////////////////////////////////
const fetchAndSetupDatosdelDia1 = async () => {
/*const response = await peticionesFetch(`${link.value}${api.value}`,`datosventasdeldia`,{"fechainicio":nfecha('fechaAmericana')+' 07:00:00',"fechafinal":nfecha('timestamp')},tokenCifrado.value,'POST');*/
  //const response = await peticionesFetch(`${link.value}${api.value}`,`datosventasporrango`,{"fechainicio":nfecha('fechaAmericana')+' 07:00:00',"fechafinal":nfecha('timestamp')},tokenCifrado.value,'POST');
  const response = await peticionesFetchOffline('datosVentasPorRango', nfecha('fechaAmericana')+' 00:01:00',nfecha('timestamp'));
    const jsonData = response;
    datosDelDia.value = jsonData;
};

const facturasArray = ref([])
const productosVendidos = ref([])
const nombresProductosVendidos = ref([])
const cantidadProductosVendidos = ref([])
const gastosArray = ref([])
const tallerArray = ref([])
const dashboardResumen = ref({
  reparacionesPendientes: 0,
  equiposEntregados: 0,
  equiposNoEntregados: 0,
  cuentasPorCobrar: 0,
  montoCuentasPorCobrar: 0,
  alertasStock: 0,
  equiposGarantia: 0,
  cajaAbierta: false,
  cajaEstado: 'CERRADA'
})
const dashboardTopProductos = ref([])
const dashboardAlertasStock = ref([])
const dashboardPendientesTaller = ref([])
const dashboardResumenFinancieroChart = ref(null)
const dashboardResumenFinancieroOptions = ref(null)
const dashboardResumenFinancieroSemanaChart = ref(null)
const dashboardResumenFinancieroSemanaOptions = ref(null)
const dashboardSemanaActualPorDia = ref({
  labels: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
  ventas: [0, 0, 0, 0, 0, 0, 0],
  ganancias: [0, 0, 0, 0, 0, 0, 0],
  gastos: [0, 0, 0, 0, 0, 0, 0],
  abonos: [0, 0, 0, 0, 0, 0, 0]
})
const dashboardMetodosPagoChart = ref(null)
const dashboardMetodosPagoOptions = ref(null)

/*************************************************************/
const toDashboardNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const normalizarDashboardTexto = (value) => String(value || '').trim().toLowerCase()

const esEstadoEntregado = (estado) => normalizarDashboardTexto(estado) === 'entregado'

const esEstadoTallerPendiente = (estado) => {
  const estadoNormalizado = normalizarDashboardTexto(estado)
  return !['entregado', 'devolucion', 'devuelto'].includes(estadoNormalizado)
}

const formatearMonedaDashboard = (monto) => {
  const simbolo = datosConfiguracion.value?.simbolo || '$'
  return `${simbolo}${decimales(toDashboardNumber(monto))}`
}

const dashboardUtilidadNeta = computed(() =>
  toDashboardNumber(datosDelDia.value.venta) - toDashboardNumber(datosDelDia.value.gastos)
)

const dashboardUtilidadNetaSemanaActual = computed(() =>
  toDashboardNumber(datosSemanaActual.value.venta) - toDashboardNumber(datosSemanaActual.value.gastos)
)

const dashboardPromedioCuentaCobrar = computed(() => {
  const total = toDashboardNumber(dashboardResumen.value.montoCuentasPorCobrar)
  const cantidad = toDashboardNumber(dashboardResumen.value.cuentasPorCobrar)
  return cantidad > 0 ? total / cantidad : 0
})

const dashboardTopCantidadMaxima = computed(() => {
  if (!dashboardTopProductos.value.length) return 0
  return Math.max(...dashboardTopProductos.value.map((producto) => toDashboardNumber(producto.cantidad)))
})

const obtenerAnchoTopProducto = (cantidad) => {
  const maximo = dashboardTopCantidadMaxima.value
  if (!maximo) return '0%'
  return `${Math.max(12, Math.round((toDashboardNumber(cantidad) / maximo) * 100))}%`
}

const actualizarDashboardCharts = () => {
  const documentStyle = getComputedStyle(document.documentElement)
  const textColor = documentStyle.getPropertyValue('--text-color') || '#475569'
  const textMuted = documentStyle.getPropertyValue('--text-color-secondary') || '#94a3b8'
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e2e8f0'

  dashboardResumenFinancieroChart.value = {
    labels: ['Ventas', 'Ganancias', 'Gastos', 'CxC'],
    datasets: [
      {
        label: 'Monto',
        backgroundColor: ['#1d4ed8', '#059669', '#dc2626', '#7c3aed'],
        borderRadius: 12,
        maxBarThickness: 36,
        data: [
          toDashboardNumber(datosDelDia.value.venta),
          toDashboardNumber(datosDelDia.value.ganancia),
          toDashboardNumber(datosDelDia.value.gastos),
          toDashboardNumber(dashboardResumen.value.montoCuentasPorCobrar)
        ]
      }
    ]
  }

  dashboardResumenFinancieroOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        ticks: { color: textMuted },
        grid: { display: false, drawBorder: false }
      },
      y: {
        ticks: { color: textMuted },
        grid: { color: surfaceBorder, drawBorder: false }
      }
    }
  }

  dashboardResumenFinancieroSemanaChart.value = {
    labels: dashboardSemanaActualPorDia.value.labels,
    datasets: [
      {
        label: 'Ventas',
        backgroundColor: '#1d4ed8',
        borderRadius: 12,
        maxBarThickness: 24,
        data: dashboardSemanaActualPorDia.value.ventas
      },
      {
        label: 'Ganancias',
        backgroundColor: '#059669',
        borderRadius: 12,
        maxBarThickness: 24,
        data: dashboardSemanaActualPorDia.value.ganancias
      },
      {
        label: 'Gastos',
        backgroundColor: '#dc2626',
        borderRadius: 12,
        maxBarThickness: 24,
        data: dashboardSemanaActualPorDia.value.gastos
      },
      {
        label: 'Abonos',
        backgroundColor: '#7c3aed',
        borderRadius: 12,
        maxBarThickness: 24,
        data: dashboardSemanaActualPorDia.value.abonos
      }
    ]
  }

  dashboardResumenFinancieroSemanaOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      x: {
        ticks: { color: textMuted },
        grid: { display: false, drawBorder: false }
      },
      y: {
        ticks: { color: textMuted },
        grid: { color: surfaceBorder, drawBorder: false }
      }
    }
  }

  dashboardMetodosPagoChart.value = {
    labels: ['Efectivo', 'Tarjeta', 'Transferencia'],
    datasets: [
      {
        data: [
          toDashboardNumber(datosDelDia.value.efectivo),
          toDashboardNumber(datosDelDia.value.tarjeta),
          toDashboardNumber(datosDelDia.value.transferencia)
        ],
        backgroundColor: ['#0f766e', '#ea580c', '#2563eb'],
        hoverBackgroundColor: ['#14b8a6', '#fb923c', '#60a5fa'],
        borderWidth: 0
      }
    ]
  }

  dashboardMetodosPagoOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          color: textColor
        }
      }
    }
  }
}

const obtenerMontoPendienteCuenta = (cuenta) => {
  const saldo = toDashboardNumber(cuenta?.saldo)
  if (saldo > 0) {
    return saldo
  }

  return Math.max(
    0,
    toDashboardNumber(cuenta?.monto_credito) - toDashboardNumber(cuenta?.abonado)
  )
}

const cargarDashboardHome = async () => {
  try {
    const fechaBase = formatearFecha(fechaHoy.value || nfecha('fecha'))
    const fechaSql = transformarFechaTimestamp(fechaBase, false)
    const fechaInicio = `${fechaSql} 00:00:00`
    const fechaFin = `${fechaSql} 23:59:59`

    const [taller, garantias, cuentasCobrar, cajaRegistros] = await Promise.all([
      peticionesFetchOffline('getDataAsArray', 'taller'),
      peticionesFetchOffline('getDataAsArray', 'garantia_global'),
      peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar'),
      peticionesFetchOffline('getRowsByTimestampRange', 'registrocaja', 'updated_at', fechaInicio, fechaFin)
    ])

    const tallerFiltrado = (Array.isArray(taller) ? taller : []).filter(
      (item) => !item.almacen || item.almacen === datosEmpresa.empresa.nombre
    )
    const garantiasFiltradas = (Array.isArray(garantias) ? garantias : []).filter(
      (item) => !item.almacen || item.almacen === datosEmpresa.empresa.nombre
    )
    const cuentasPendientes = (Array.isArray(cuentasCobrar) ? cuentasCobrar : []).filter(
      (item) =>
        item.almacen === datosEmpresa.empresa.nombre &&
        normalizarDashboardTexto(item.estatus) === 'pendiente'
    )
    const cajaFiltrada = (Array.isArray(cajaRegistros) ? cajaRegistros : []).filter(
      (item) => !item.almacen || item.almacen === datosEmpresa.empresa.nombre
    )

    const topProductos = [...(productosVendidos.value || [])]
      .sort((a, b) => toDashboardNumber(b.cantidad) - toDashboardNumber(a.cantidad))
      .slice(0, 5)

    dashboardTopProductos.value = topProductos
    dashboardAlertasStock.value = [...(productosSinStock.value || [])]
      .sort((a, b) => toDashboardNumber(a.stock) - toDashboardNumber(b.stock))
      .slice(0, 5)

    dashboardPendientesTaller.value = tallerFiltrado
      .filter((item) => esEstadoTallerPendiente(item.estado))
      .slice(0, 5)

    const equiposEntregados = tallerFiltrado.filter((item) => esEstadoEntregado(item.estado)).length
    const equiposNoEntregados = tallerFiltrado.length - equiposEntregados
    const reparacionesPendientes = tallerFiltrado.filter((item) => esEstadoTallerPendiente(item.estado)).length
    const equiposGarantia = garantiasFiltradas.filter((item) => !esEstadoEntregado(item.estado)).length
    const cajaAbierta = cajaFiltrada.some(
      (item) => normalizarDashboardTexto(item.estado) === 'abierto'
    )

  dashboardResumen.value = {
      reparacionesPendientes,
      equiposEntregados,
      equiposNoEntregados,
      cuentasPorCobrar: cuentasPendientes.length,
      montoCuentasPorCobrar: cuentasPendientes.reduce(
        (total, item) => total + obtenerMontoPendienteCuenta(item),
        0
      ),
      alertasStock: productosSinStock.value.length,
      equiposGarantia,
      cajaAbierta,
      cajaEstado: cajaAbierta ? 'ABIERTA' : 'CERRADA'
    }
    actualizarDashboardCharts()
  } catch (error) {
    console.error('Error cargando dashboard del home:', error)
  }
}

//////////////////////////////////////////////////////
const fetchAndSetupDatosdelDia = async () => {
const fechaInicioN = transformarFechaTimestamp(formatearFecha(nfecha('fecha')),false);
const fechaFinN = transformarFechaTimestamp(formatearFecha(nfecha('fecha')),false);

const fechaS = nfecha('timestampcompleta');

//const response = await peticionesFetch(`${link.value}${api.value}`,`datosventasporrango`,{"fechainicio":fechaS.fechainicio,"fechafinal":fechaS.fechafin},tokenCifrado.value,'POST');
  


/*const response = await peticionesFetch(`${link.value}${api.value}`,`datosventasdeldia`,{"fechainicio":fechaInicioN+' '+horaInicio.value,"fechafinal":fechaFinN+' '+horaFin.value},tokenCifrado.value,'POST');*/

const laFechaInicio = fechaS.fechainicio;
const laFechaFin = fechaS.fechafin;

  const response = await peticionesFetchOffline('datosVentasPorRango', laFechaInicio,nfecha('timestamp'));

    const jsonData = response || {};
    const asArray = (value) => (Array.isArray(value) ? value : []);
    const toSafeNumber = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };
    datosDelDia.value = response || {};

const totalVentas = asArray(jsonData['facturas'])
.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
  .map(factura => toSafeNumber(factura.total)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

const totalGanancias = asArray(jsonData['facturas'])
.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
  .map(factura => toSafeNumber(factura.ganancia)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

const totalImpuestos = asArray(jsonData['facturas'])
.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
  .map(factura => toSafeNumber(factura.impuesto)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

const totalGastos = asArray(jsonData['gastos'])
.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
  .map(factura => toSafeNumber(factura.cantidad)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

const totalDevoluciones = asArray(jsonData['devoluciones'])
.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
  .map(factura => toSafeNumber(factura.cantidad)) 
  .reduce((acc, total) => acc + total, 0) || 0;


gastosArray.value = asArray(jsonData['gastos']);


   datosDelDia.value.venta = totalVentas;
   datosDelDia.value.ganancia = totalGanancias;
   datosDelDia.value.impuestos = totalImpuestos;
   datosDelDia.value.gastos = totalGastos;
   datosDelDia.value.devoluciones = totalDevoluciones;

   datosDelDia.value.efectivo = asArray(jsonData['facturas'])
   .filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
      .filter(factura => factura.metodo_pago !== 'CREDITO')
  .map(factura => toSafeNumber(factura.efectivo)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

   datosDelDia.value.tarjeta = asArray(jsonData['facturas'])
   .filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
      .filter(factura => factura.metodo_pago !== 'CREDITO')
  .map(factura => toSafeNumber(factura.tarjeta)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

   datosDelDia.value.transferencia = asArray(jsonData['facturas'])
   .filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
      .filter(factura => factura.metodo_pago !== 'CREDITO')
  .map(factura => toSafeNumber(factura.transferencia)) 
  .reduce((acc, total) => acc + total, 0) || 0; 


  datosDelDia.value.inicioCaja = asArray(jsonData['cuadres'])
  .filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
  .map(factura => toSafeNumber(factura.cantidad_inicio)) 
  .reduce((acc, total) => acc + total, 0) || 0; 

 datosDelDia.value.abono = asArray(jsonData['cuentas_cobrar'])
 .filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
  .map(factura => toSafeNumber(factura.abonado)) 
  .reduce((acc, total) => acc + total, 0) || 0; 


/*************************************************************/
datosDelDia.value.taller = asArray(jsonData['taller'])
.filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
  .map(factura => {
    let totalAbono = 0;
    let abonos = [];

    try {
        abonos = JSON.parse(factura.abono);
    } catch (error) {
        console.error('Error al parsear abonos:', error);
        return 0; 
    }

    for (let abono of abonos) {
        const fechaBuscar = convertirAFechaTimestamp(abono.fecha, abono.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, laFechaInicio, laFechaFin);
        if (estaFecha) {
            totalAbono += toSafeNumber(abono.abono); 
            if (abono.metodo_pago === 'EFECTIVO') {
               datosDelDia.value.efectivo += toSafeNumber(abono.abono);

            }else if(abono.metodo_pago === 'TARJETA'){
              datosDelDia.value.tarjeta += toSafeNumber(abono.abono);

            }else{
              datosDelDia.value.transferencia += toSafeNumber(abono.abono);

            }

        }
    }

    return totalAbono; 
  })
  .reduce((acc, total) => acc + total, 0) || 0;  

/*************************************************************/
  datosDelDia.value.abono = asArray(jsonData['cuentas_cobrar'])
  .filter(fact=>fact.almacen === datosEmpresa.empresa.nombre)
  .map(factura => {
    let totalAbono = 0;
    let abonos = [];

    try {
        abonos = JSON.parse(factura.pagos);
    } catch (error) {
        console.error('Error al parsear abonos:', error);
        return 0; 
    }

    for (let pago of abonos) {
        const fechaBuscar = convertirAFechaTimestamp(pago.fecha, pago.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, laFechaInicio, laFechaFin);
        if (estaFecha) {
            totalAbono += toSafeNumber(pago.cantidad); 
            if (pago.metodo === 'EFECTIVO') {
               datosDelDia.value.efectivo += toSafeNumber(pago.cantidad);

            }else if(pago.metodo === 'TARJETA'){
              datosDelDia.value.tarjeta += toSafeNumber(pago.cantidad);

            }else if (pago.metodo === 'TRANSFERENCIA'){
              datosDelDia.value.transferencia += toSafeNumber(pago.cantidad);

            }else{
               datosDelDia.value.efectivo += toSafeNumber(pago.cantidad);
            }

        }
    }

    return totalAbono; 
  })
  .reduce((acc, total) => acc + total, 0) || 0; 
/*************************************************************/


    facturasArray.value = asArray(jsonData['facturas']).filter(fact=>fact.almacen === datosEmpresa.empresa.nombre);


productosVendidos.value = asArray(jsonData['facturas']).filter(fact=>fact.almacen === datosEmpresa.empresa.nombre).reduce((acc, factura) => {
    const productos = (() => {
      try {
        return typeof factura.productos === 'string' ? JSON.parse(factura.productos || '[]') : Array.isArray(factura.productos) ? factura.productos : [];
      } catch {
        return [];
      }
    })();
    
    productos.forEach(producto => {
        const nombre = producto.nombre;
        const existente = acc.find(item => item.nombre === nombre);
        const totalProducto = toSafeNumber(producto.cantidad) * toSafeNumber(producto.precio);
        
        if (existente) {
            existente.cantidad += toSafeNumber(producto.cantidad);
            existente.total += totalProducto;
            
            if (existente.categorias[producto.categoria]) {
                existente.categorias[producto.categoria] += toSafeNumber(producto.cantidad);
            } else {
                existente.categorias[producto.categoria] = toSafeNumber(producto.cantidad);
            }
        } else {
            acc.push({ 
                nombre, 
                cantidad: toSafeNumber(producto.cantidad), 
                total: totalProducto, 
                categorias: [producto.categoria] 
            });
        }




    });

    
    return acc;
}, []);

/*************************************************************/
 nombresProductosVendidos.value = productosVendidos.value.map(prod=>prod.nombre)
 cantidadProductosVendidos.value = productosVendidos.value.map(prod=>prod.cantidad)

//setChartDataProductos();


   // datosDelDia.value = jsonData;

/*

          datosDelDia.value.venta,
          datosDelDia.value.ganancia,
          datosDelDia.value.impuestos,
          datosDelDia.value.gastos,
          datosDelDia.value.taller,
          datosDelDia.value.devoluciones,
          datosDelDia.value.inicioCaja,
          datosDelDia.value.abono

 */



};
//////////////////////////////////////////////////////
const fetchAndSetupDatosSemanaActual = async () => {
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const formatearFechaSql = (fecha) => {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    const hours = `${fecha.getHours()}`.padStart(2, '0');
    const minutes = `${fecha.getMinutes()}`.padStart(2, '0');
    const seconds = `${fecha.getSeconds()}`.padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const fechaInicioSemana = formatearFechaSql(inicioSemana);
  const fechaFinSemana = nfecha('timestamp');
  const response = await peticionesFetchOffline('datosVentasPorRango', fechaInicioSemana, fechaFinSemana);

  const jsonData = response || {};
  const asArray = (value) => (Array.isArray(value) ? value : []);
  const toSafeNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  datosSemanaActual.value = {
    venta: 0,
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
    ganancia: 0,
    gastos: 0,
    impuestos: 0,
    entradas: 0,
    devoluciones: 0,
    inicioCaja: 0,
    abono: 0,
    taller: 0
  };
  dashboardSemanaActualPorDia.value = {
    labels: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
    ventas: [0, 0, 0, 0, 0, 0, 0],
    ganancias: [0, 0, 0, 0, 0, 0, 0],
    gastos: [0, 0, 0, 0, 0, 0, 0],
    abonos: [0, 0, 0, 0, 0, 0, 0]
  };

  const facturasSemana = asArray(jsonData['facturas']).filter(
    (fact) => fact.almacen === datosEmpresa.empresa.nombre
  );

  facturasSemana.forEach((factura) => {
    const fechaFactura = new Date(factura.created_at || factura.updated_at || '');
    if (Number.isNaN(fechaFactura.getTime())) return;
    const dia = fechaFactura.getDay();
    dashboardSemanaActualPorDia.value.ventas[dia] += toSafeNumber(factura.total);
    dashboardSemanaActualPorDia.value.ganancias[dia] += toSafeNumber(factura.ganancia);
  });

  cantidadFacturasSemanaActual.value = facturasSemana.length;

  datosSemanaActual.value.venta = facturasSemana
    .map((factura) => toSafeNumber(factura.total))
    .reduce((acc, total) => acc + total, 0);

  datosSemanaActual.value.ganancia = facturasSemana
    .map((factura) => toSafeNumber(factura.ganancia))
    .reduce((acc, total) => acc + total, 0);

  datosSemanaActual.value.impuestos = facturasSemana
    .map((factura) => toSafeNumber(factura.impuesto))
    .reduce((acc, total) => acc + total, 0);

  datosSemanaActual.value.gastos = asArray(jsonData['gastos'])
    .filter((fact) => fact.almacen === datosEmpresa.empresa.nombre)
    .map((factura) => toSafeNumber(factura.cantidad))
    .reduce((acc, total) => acc + total, 0);

  asArray(jsonData['gastos'])
    .filter((fact) => fact.almacen === datosEmpresa.empresa.nombre)
    .forEach((gasto) => {
      const fechaGasto = new Date(gasto.created_at || gasto.updated_at || '');
      if (Number.isNaN(fechaGasto.getTime())) return;
      const dia = fechaGasto.getDay();
      dashboardSemanaActualPorDia.value.gastos[dia] += toSafeNumber(gasto.cantidad);
    });

  datosSemanaActual.value.devoluciones = asArray(jsonData['devoluciones'])
    .filter((fact) => fact.almacen === datosEmpresa.empresa.nombre)
    .map((factura) => toSafeNumber(factura.cantidad))
    .reduce((acc, total) => acc + total, 0);

  datosSemanaActual.value.efectivo = facturasSemana
    .filter((factura) => factura.metodo_pago !== 'CREDITO')
    .map((factura) => toSafeNumber(factura.efectivo))
    .reduce((acc, total) => acc + total, 0);

  datosSemanaActual.value.tarjeta = facturasSemana
    .filter((factura) => factura.metodo_pago !== 'CREDITO')
    .map((factura) => toSafeNumber(factura.tarjeta))
    .reduce((acc, total) => acc + total, 0);

  datosSemanaActual.value.transferencia = facturasSemana
    .filter((factura) => factura.metodo_pago !== 'CREDITO')
    .map((factura) => toSafeNumber(factura.transferencia))
    .reduce((acc, total) => acc + total, 0);

  datosSemanaActual.value.inicioCaja = asArray(jsonData['cuadres'])
    .filter((fact) => fact.almacen === datosEmpresa.empresa.nombre)
    .map((factura) => toSafeNumber(factura.cantidad_inicio))
    .reduce((acc, total) => acc + total, 0);

  datosSemanaActual.value.taller = asArray(jsonData['taller'])
    .filter((fact) => fact.almacen === datosEmpresa.empresa.nombre)
    .map((factura) => {
      let totalAbono = 0;
      let abonos = [];

      try {
        abonos = JSON.parse(factura.abono);
      } catch (error) {
        console.error('Error al parsear abonos de taller:', error);
        return 0;
      }

      for (const abono of abonos) {
        const fechaBuscar = convertirAFechaTimestamp(abono.fecha, abono.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, fechaInicioSemana, fechaFinSemana);
        if (estaFecha) {
          totalAbono += toSafeNumber(abono.abono);
          const dia = new Date(fechaBuscar).getDay();
          dashboardSemanaActualPorDia.value.abonos[dia] += toSafeNumber(abono.abono);
          if (abono.metodo_pago === 'EFECTIVO') {
            datosSemanaActual.value.efectivo += toSafeNumber(abono.abono);
          } else if (abono.metodo_pago === 'TARJETA') {
            datosSemanaActual.value.tarjeta += toSafeNumber(abono.abono);
          } else {
            datosSemanaActual.value.transferencia += toSafeNumber(abono.abono);
          }
        }
      }

      return totalAbono;
    })
    .reduce((acc, total) => acc + total, 0);

  datosSemanaActual.value.abono = asArray(jsonData['cuentas_cobrar'])
    .filter((fact) => fact.almacen === datosEmpresa.empresa.nombre)
    .map((factura) => {
      let totalAbono = 0;
      let pagos = [];

      try {
        pagos = JSON.parse(factura.pagos);
      } catch (error) {
        console.error('Error al parsear pagos:', error);
        return 0;
      }

      for (const pago of pagos) {
        const fechaBuscar = convertirAFechaTimestamp(pago.fecha, pago.hora);
        const estaFecha = esFechaEnRango(fechaBuscar, fechaInicioSemana, fechaFinSemana);
        if (estaFecha) {
          totalAbono += toSafeNumber(pago.cantidad);
          const dia = new Date(fechaBuscar).getDay();
          dashboardSemanaActualPorDia.value.abonos[dia] += toSafeNumber(pago.cantidad);
          if (pago.metodo === 'EFECTIVO') {
            datosSemanaActual.value.efectivo += toSafeNumber(pago.cantidad);
          } else if (pago.metodo === 'TARJETA') {
            datosSemanaActual.value.tarjeta += toSafeNumber(pago.cantidad);
          } else if (pago.metodo === 'TRANSFERENCIA') {
            datosSemanaActual.value.transferencia += toSafeNumber(pago.cantidad);
          } else {
            datosSemanaActual.value.efectivo += toSafeNumber(pago.cantidad);
          }
        }
      }

      return totalAbono;
    })
    .reduce((acc, total) => acc + total, 0);
};
//////////////////////////////////////////////////////
const fetchDataUsuarios = async () => {
//const response = await peticionesFetch(`${link.value}${api.value}`,`datosarray/usuarios`,{},tokenCifrado.value,'GET');
const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    const jsonData = response;
    datosUsuarios.value = jsonData;

};
//////////////////////////////////////////////////////
const cargaTurnos = async () => {
  try {
    const fechaBase = formatearFecha(fechaHoy.value || nfecha('fecha'));
    const fechaSql = transformarFechaTimestamp(fechaBase, false);
    const fechaInicio = `${fechaSql} 00:00:00`;
    const fechaFin = `${fechaSql} 23:59:59`;

    const response = await peticionesFetchOffline(
      'getRowsByTimestampRange',
      'registrocaja',
      'updated_at',
      fechaInicio,
      fechaFin
    );

    let registros = Array.isArray(response) ? response : [];
    registros = registros.filter(reg => !reg.almacen || reg.almacen === datosEmpresa.empresa.nombre);

    if (modoCuadre.value === 'USUARIO') {
      const emailUsuario = obtenerEmailUsuarioCuadre();
      if (emailUsuario) {
        registros = registros.filter(reg => String(reg.username || '').toLowerCase() === String(emailUsuario).toLowerCase());
      }
    }

    turnosXfecha.value = registros;

    if (registros.length > 0) {
      usuarioTuno.value = registros[0].turno;
      turnoUsuarioSelected.value = 'COMPLETO';
      await cambioTuno();
    } else {
      usuarioTuno.value = null;
      turnoUsuarioSelected.value = 'COMPLETO';
      turnoHoraInicio.value = '00:00:00';
      turnoHoraFin.value = '23:59:59';
    }
  } catch (error) {
    console.error('Error al cargar los turnos:', error);
    turnosXfecha.value = [];
    usuarioTuno.value = null;
    turnoHoraInicio.value = '00:00:00';
    turnoHoraFin.value = '23:59:59';
  }
};


//////////////////////////////////////////////////////
const cambioTuno = async()=>{
    const datos =  turnosXfecha.value.find(turno=>turno.turno === usuarioTuno.value)
    if (!datos) {
      turnoHoraInicio.value = '00:00:00';
      turnoHoraFin.value = '23:59:59';
      return;
    }

    const horaInicio = String(datos.created_at || '').split(' ');
    const horaFin = String(datos.updated_at || '').split(' ');
    turnoHoraInicio.value = horaInicio[1] || '00:00:00';
    turnoHoraFin.value = horaFin[1] || '23:59:59';
}
//////////////////////////////////////////////////////
const cambioTurnoSelected = async()=>{
    if (turnoUsuarioSelected.value === 'COMPLETO') {
      turnoHoraInicio.value = '00:00:00';
      turnoHoraFin.value = '23:59:59';
      return;
    }

    const datos =  turnosXfecha.value.find(turno=>turno.turno === turnoUsuarioSelected.value)
    if (!datos) {
      turnoHoraInicio.value = '00:00:00';
      turnoHoraFin.value = '23:59:59';
      return;
    }

    const horaInicio = String(datos.created_at || '').split(' ');
    const horaFin = String(datos.updated_at || '').split(' ');
    turnoHoraInicio.value = horaInicio[1] || '00:00:00';
    turnoHoraFin.value = horaFin[1] || '23:59:59';
}
//////////////////////////////////////////////////////
const actualizarTokenSoloUso = async()=>{
    const soloUso = Math.floor(1000 + Math.random() * 9000).toString();
const datosJSON = await envioElectron('datosarchivo');
  datosJSON.VITE_TOKEN_SOLOUSO = soloUso;
  try {
    const envioDatosJSON = await window.electron.ipcRenderer.invoke('actualizarjson', datosJSON);
    toast.add({ severity: 'success', summary: 'OK', detail: 'Datos Actualizados', life: 3000 });
  } catch (error) {
    console.error("Error sending data to Electron:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update data', life: 3000 });
  }

}
//////////////////////////////////////////////////////


onMounted(async()=>{

verificaAutentificado(router)
permisosPagina(router)

await cargarPreferenciasHome()

const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
tokenSoloUso.value = datosJSON.VITE_TOKEN_SOLOUSO;
token24H.value = datosJSON.VITE_TOKEN_24H;

tokenCifrado.value = await encryptarPassword(token.value, 10);
    if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(link.value+api.value);
  }

 usuarioLocalStorage.value = JSON.parse(localStorage.getItem('usuarioLocal'))[0];
 datosDefault.value = JSON.parse(localStorage.getItem('datosDefault'));
 datosConfiguracion.value = JSON.parse(localStorage.getItem('configuracion'));


    const printer = {
      'Impresora Ticket':'Termica',
      'Offline':'Termica2',
      'Impresora Normal':'Tinta',
    }
    datosFactCoti.value.impresora = printer[datosConfiguracion.value.tipo_impresora];


await fetchAndSetupDataFacturas();
await fetchAndSetupDataCotizaciones();
await fetchAndSetupDataCompras();
await fetchIMEI();
await fetchAndSetupDataProductos();
await fetchAndSetupDataClientes();
await fetchAndSetupDatosdelDia();
await fetchAndSetupDatosSemanaActual();
 await fetchBanco();
 await fetchDataUsuarios();
 camposGastos.value = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'gastos');
 loading.value = false

  usuarioHoy.value = usuarioLocalStorage.value.nombre;
  await cargaTurnos()
  await cargarDashboardHome()

})
//////////////////////////////////////////////////////
watchEffect(async() => {
  if (visiblegastos.value) {
      camposGastos.value.fecha = nfecha('fecha');
      camposGastos.value.hora = nfecha('hora');
      camposGastos.value.cantidad = '0.00';
      camposGastos.value.mes = nfecha('mes');
      camposGastos.value.year = nfecha('year');
      camposGastos.value.cajero = usuarioLocalStorage.value.email;
      camposGastos.value.turno = usuarioLocalStorage.value.token;
      camposGastos.value.metodo = 'EFECTIVO';
      cuentaBancaria.value = bancoArray.value[bancoArray.value.length - 1] || null;
  }

if (visibleimprimirfactura.value) {
   impresoraSeleccionada.value = datosConfiguracion.value.tipo_impresora
}

/*if (visibleCuadre) {
  usuarioHoy.value = usuarioLocalStorage.value.nombre;
  await cargaTurnos()
}
*/
  });
//////////////////////////////////////////////////////
watch(visibleCuadre, async(nuevoValor) => {
  if (nuevoValor) {
    await cargaTurnos();
  }
});
//////////////////////////////////////////////////////
const turnoFechaCambio = async()=>{
  await cargaTurnos();
}
//////////////////////////////////////////////////////
const botones = [{
  nombre:'editar',
  icono:'pencil',
  color:'success'
},
{
  nombre:'imprimir',
  icono:'print',
  color:'dark',
},
{
  nombre:'eliminar',
  icono:'trash',
  color:'danger',
}
];
let losBotones = "";
for (let boton of botones) {
  losBotones += `<li><a href="#" class="dropdown-item ${boton.nombre}" id="btn${boton.nombre}"><i class="icon-${boton.icono} text-${boton.color}"></i> ${boton.nombre}</a></li>`;
}
/************************************************************************/
const columnsFacturas = ref([
  {
    data: null,
    title: '<input type="checkbox" id="check-all" />',
    orderable: false,
    className: 'select-checkbox',
    render: function(data, type, row) {
        return '<input type="checkbox" class="dt-checkbox dt-checkboxes" value="' + row.id + '">';
    },
    width: "30px"
  },
  {
    title: 'Acción',
    orderable: false,
    data: null,
"defaultContent":`<div class="dropdown">
  <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
  <i class="icon-cog-alt"></i>
  </button>
  <ul class="dropdown-menu">
    ${losBotones}
  </ul>
</div>`},
{ data: 'no_factura', title: 'Numero' },
{ data: 'comprobante', title: 'Comprobante' },
{ data: 'nombre_cliente', title: 'Ciente' },
{ data: 'telefono_cliente', title: 'Telefono' },
{ data: 'fecha_emision', title: 'Fecha' },
{ data: 'vendedor', title: 'Vendedor' },
{ data: 'metodo_pago', title: 'Metodo de Pago' },
{ data: 'total', title: 'Total' },

]);
/****************************************************/
//////////////////////////////////////////////////////
const optionsFacturas = ref({
  responsive: true,
  "processing": true,
  dom: `
    <'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>
    <'row'<'col-sm-12'tr>>
    <'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>
  `,
   columnDefs:[ {
      targets:0, width:"30px", className:"", orderable:!1, render:function(e, a, t, n) {
          return `
           <div class="form-check-primary d-block new-control">
            <a class="btn"></a>
            </div>`
           }
        }],
  buttons: [
    'copy', 'excel', 'csv',
    {
      extend: 'pdfHtml5',
      text: 'PDF',
      titleAttr: 'Exportar a PDF',
      customize: function (doc) {}
    }
  ],
    language:lenguajeDataTable(),
  columns: columnsFacturas.value,
  drawCallback: function () {
    const apiDatatable = this.api();
     document.getElementById('check-all').addEventListener('click', function(e) {
      const checkboxes = apiDatatable.table().container().querySelectorAll('.dt-checkboxes');
      checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
      });
    });
/************************************************************************/
   apiDatatable.table().container().querySelectorAll('.editar').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const tr = e.target.closest('tr');
      const rowData = apiDatatable.row(tr).data();

    });
  });
/************************************************************************/
  apiDatatable.table().container().querySelectorAll('.imprimir').forEach(button => {
    button.addEventListener('click', async(e) => {
      e.preventDefault();
      const tr = e.target.closest('tr');
      const rowData = apiDatatable.row(tr).data();

    const factura  = rowData.no_factura;
    if (factura == '') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un documento para imprimir', life: 3000 });
      return
    }
      if (datosFactCoti.value.tipo == 'Factura') {
     if (datosFactCoti.value.impresora == 'Termica') {
         // var impresionpagina = link.value+'/receipt/ticket.php?factura='+factura;
          var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+factura;
         //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
       //  window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
        window.electron.ipcRenderer.invoke('ticket',factura,datosEmpresa);


     } else{
      var impresionpagina = link.value+'/receipt/factura.php?factura='+factura;

          if(window.electron){
             const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
             const envio = await window.electron.ipcRenderer.invoke('facturaPDF', factura, datosEmpresa1,null);

          }else{
              router.push({ path: `/factura/${factura}` });
            }



     }
    }else{

     if (datosFactCoti.value.impresora == 'Termica') {
          var impresionpagina = link.value+'/receipt/ticket.php?cotizacion='+factura;
          //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')

         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
        window.electron.ipcRenderer.invoke('ticket',factura,datosEmpresa);

     }else{
         var impresionpagina = link.value+'/receipt/factura.php?cotizacion='+factura;
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
     }


    }


    });
  });
/************************************************************************/
  apiDatatable.table().container().querySelectorAll('.eliminar').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const tr = e.target.closest('tr');
      const rowData = apiDatatable.row(tr).data();

    });
  });
  }
});
//////////////////////////////////////////////////////
const imprimirUltimoGasto = async ()=>{

  const ultimoRegistro = await peticionesFetchOffline('getLastXRows','gastos','1')

  if (ultimoRegistro) {
        const datosEnviar = JSON.stringify(ultimoRegistro[0])
        const datosEmpresaLoL = JSON.stringify(enviarDatosLocalStorage() )
        if(window.electron){
        window.electron.ipcRenderer.invoke('gasto',datosEnviar,datosEmpresaLoL);
      }

  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de Peticion.', life: 3000 });
  }

}
//////////////////////////////////////////////////////
const fetchBanco = async () => {
  try {
    const verificaLocalStorage = JSON.parse(window.localStorage.getItem('bancos')) || [];

    if (verificaLocalStorage.length > 0) {
      bancoArray.value = verificaLocalStorage;
      cuentaBancaria.value = verificaLocalStorage[verificaLocalStorage.length - 1];
      return;
    }

    const response = await peticionesFetchOffline('getDataAsArray', 'banco');
    const columnas = await peticionesFetchOffline('getTableColumns', 'banco');
    if (!columnas.includes('almacen')) {
      await peticionesFetchOffline('addColumnToTable', { tabla: 'banco', campo: 'almacen' });
      await peticionesFetchOffline('updateEntireColumn', 'banco', 'almacen', datosEmpresa.empresa.nombre);
    }

    bancoArray.value = response || [];
    cuentaBancaria.value = bancoArray.value[bancoArray.value.length - 1] || null;
    window.localStorage.setItem('bancos', JSON.stringify(bancoArray.value));
  } catch (error) {
    console.error('Error fetching banks', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los bancos', life: 3000 });
  }
}
//////////////////////////////////////////////////////
const rebajarMontoBancoGasto = async () => {
  if (camposGastos.value.metodo !== 'TRANSFERENCIA') {
    return true;
  }

  if (!cuentaBancaria.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return false;
  }

  const banco = bancoArray.value.find(b => b.id == cuentaBancaria.value.id);
  if (!banco) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Banco no encontrado', life: 3000 });
    return false;
  }

  const nuevoSaldo = Number(banco.saldo || 0) - Number(camposGastos.value.cantidad || 0);
  const datosBanco = { ...banco, saldo: nuevoSaldo, updated_at: nfecha('timestamp') };
  const envioDatosBanco = await peticionesFetchOffline('updateData', 'banco', JSON.stringify(datosBanco));

  if (envioDatosBanco[0] !== 'ok') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el saldo del banco', life: 3000 });
    return false;
  }

  const camposTransaccion = await arrayToObjetoFromTablaOffline('transaccionesbancarias');
  camposTransaccion.tipo = 'RETIRO';
  camposTransaccion.metodo = 'TRANSFERENCIA';
  camposTransaccion.cuenta_origen = banco.cuenta;
  camposTransaccion.cuenta_destino = '';
  camposTransaccion.monto = Number(camposGastos.value.cantidad || 0).toFixed(2);
  camposTransaccion.balance_anterior = Number(banco.saldo || 0).toFixed(2);
  camposTransaccion.balance_actual = Number(nuevoSaldo).toFixed(2);
  camposTransaccion.descripcion = `GASTO POR TRANSFERENCIA: ${camposGastos.value.descripcion || 'SIN DESCRIPCION'}`;
  camposTransaccion.depositante = '';
  camposTransaccion.beneficiario = datosEmpresa.empresa.nombre;
  camposTransaccion.fecha = nfecha('fecha');
  camposTransaccion.hora = nfecha('hora');
  camposTransaccion.estado = 'COMPLETADA';
  camposTransaccion.usuario = usuarioLocalStorage.value?.usuario || usuarioLocalStorage.value?.nombre || '';
  if (camposTransaccion.hasOwnProperty('created_at')) {
    camposTransaccion.created_at = nfecha('timestamp');
    camposTransaccion.updated_at = nfecha('timestamp');
  }

  const envioTransaccion = await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(camposTransaccion));
  if (envioTransaccion[0] !== 'ok') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la transacción bancaria', life: 3000 });
    return false;
  }

  toast.add({ severity: 'success', summary: 'Éxito', detail: `Saldo rebajado en ${banco.nombre}`, life: 3000 });
  await fetchBanco();
  return true;
}
//////////////////////////////////////////////////////
const agregarGasto = async()=>{
  if (guardandoGasto.value) {
    return;
  }

  guardandoGasto.value = true;

  try {

  const url = link.value+api.value+"/insertar/gastos";
  if (!camposGastos.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede Enviar.', life: 3000 });
    return;
  }
  if (camposGastos.value.metodo === 'TRANSFERENCIA' && !cuentaBancaria.value?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }
  if (camposGastos.value.hasOwnProperty('created_at')) {
     camposGastos.value.created_at = nfecha('timestamp')
     camposGastos.value.updated_at = nfecha('timestamp')
    }
     camposGastos.value.almacen = datosEmpresa.empresa.nombre
  const envioDatos = await peticionesFetchOffline('insertData', 'gastos', JSON.stringify(camposGastos.value));
  if (envioDatos[0] == 'ok') {
     const bancoOk = await rebajarMontoBancoGasto();
     if (!bancoOk) {
      return;
     }
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto Agregado con éxito.', life: 3000 });

    await asientoDiario(link.value,api.value,tokenCifrado.value,toast,'GASTOS','EFECTIVO EN CAJA',camposGastos.value.cantidad,'REGISTRO DE GASTO POR ('+camposGastos.value.cantidad+') '+camposGastos.value.descripcion);

   await fetchAndSetupDatosdelDia();
   await fetchAndSetupDatosSemanaActual();
   await cargarDashboardHome();

   // Limpiar solo descripción y cantidad, mantener fecha/hora y modal abierta
   camposGastos.value.descripcion = '';
   camposGastos.value.cantidad = '0.00';
   camposGastos.value.fecha = nfecha('fecha');
   camposGastos.value.hora = nfecha('hora');

   // Preguntar si desea imprimir
   const resultado = await Swal.fire({
     title: '¿Desea imprimir el gasto?',
     icon: 'question',
     showCancelButton: true,
     confirmButtonText: 'Sí, imprimir',
     cancelButtonText: 'No',
     confirmButtonColor: '#3085d6',
     cancelButtonColor: '#d33',
     customClass: {
       container: 'swal-high-zindex'
     }
   });

  if (resultado.isConfirmed) {
     await imprimirUltimoGasto();
   }
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el Gasto.', life: 3000 });
  }
  } finally {
    guardandoGasto.value = false;
  }

}
/////////////////////////////////////////////////////////////////////
const facturaSeleccionada = async(factura)=>{
  const datosFactura = dataFacturas.value.find(fact=>fact.no_factura === factura.value.no_factura);
  if (datosFactura) {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura Seleccionada.', life: 3000 });
    campoNombreFactura.value = datosFactura.nombre_cliente
  }

}
/////////////////////////////////////////////////////////////////////
const recargarFacturas = async()=>{
  await fetchAndSetupDataFacturas();
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Facturas Recargadas.', life: 3000 });
}
/////////////////////////////////////////////////////////////////////
/******************************************************/
//impresoraSeleccionada
const imprimirFactura = async()=>{

  const datosFactura = dataFacturas.value.find(fact=>fact.no_factura === campoFactura.value.no_factura);
  if (datosFactura) {
        console.log("impresoraSeleccionada.value", impresoraSeleccionada.value);

     if (impresoraSeleccionada.value == 'Impresora Ticket') {
         // var impresionpagina = link.value+'/receipt/ticket.php?factura='+datosFactura.no_factura;
          var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+datosFactura.no_factura;
        // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
          //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);


        const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
        window.electron.ipcRenderer.invoke('ticket',datosFactura.no_factura,datosEmpresa);


     }else if(datosFactCoti.value == 'Offline'){

          var impresionpagina = link.value+'/vista/impresoratermica.php?factura='+datosFactura.no_factura;
          window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

     } else{
            const impresionpagina = link.value+'/receipt/factura.php?factura='+datosFactura.no_factura;
         // window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)

     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
     const envio = await window.electron.ipcRenderer.invoke('facturaPDF', datosFactura.no_factura,datosEmpresa1,null);



     }

  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione una Factura', life: 3000 });
  }

}
/******************************************************/
const usuarioSeleccionado = async()=>{
  await cargaTurnos();
}
/******************************************************/
const onModoCuadreChange = async()=>{
  await cargaTurnos();
}
/******************************************************/
const obtenerEmailUsuarioCuadre = () => {
  if (usuarioHoy.value && typeof usuarioHoy.value === 'object') {
    return usuarioHoy.value.email || usuarioHoy.value.usuario || '';
  }

  const valor = String(usuarioHoy.value || '').trim();
  if (!valor) {
    return '';
  }

  const usuario = (Array.isArray(datosUsuarios.value) ? datosUsuarios.value : []).find(
    usr => usr?.nombre === valor || usr?.email === valor || usr?.usuario === valor
  );

  return usuario?.email || valor;
};

const obtenerRangoCuadre = () => {
  const fechaBase = transformarFechaTimestamp(formatearFecha(fechaHoy.value), false);

  if (modoCuadre.value === 'USUARIO') {
    if (turnosXfecha.value.length === 0) {
      return {
        fechainicio: `${fechaBase} 00:00:00`,
        fechafin: `${fechaBase} 23:59:59`,
        cantidadInicio: 0
      };
    }

    const inicios = turnosXfecha.value
      .map(t => String(t.created_at || '').split(' '))
      .filter(p => p.length >= 2 && p[1])
      .map(p => p[1]);

    const finales = turnosXfecha.value
      .map(t => String(t.updated_at || '').split(' '))
      .filter(p => p.length >= 2 && p[1])
      .map(p => p[1]);

    const horaInicio = inicios.sort()[0] || '00:00:00';
    const horaFin = finales.sort().slice(-1)[0] || '23:59:59';
    const cantidadInicio = turnosXfecha.value.reduce((acc, t) => acc + Number(t?.cant_inicio || 0), 0);

    return {
      fechainicio: `${fechaBase} ${horaInicio}`,
      fechafin: `${fechaBase} ${horaFin}`,
      cantidadInicio
    };
  }

  if (turnoUsuarioSelected.value === 'COMPLETO') {
    return {
      fechainicio: `${fechaBase} 00:00:00`,
      fechafin: `${fechaBase} 23:59:59`,
      cantidadInicio: 0
    };
  }

  const turnoActivo = turnosXfecha.value.find(turno => turno.turno === turnoUsuarioSelected.value);
  return {
    fechainicio: `${fechaBase} ${turnoHoraInicio.value || '00:00:00'}`,
    fechafin: `${fechaBase} ${turnoHoraFin.value || '23:59:59'}`,
    cantidadInicio: Number(turnoActivo?.cant_inicio || 0)
  };
};

const prepararPayloadCuadreCompleto = async () => {
  const rango = obtenerRangoCuadre();
  const response = await peticionesFetchOffline('datosVentasPorRango', rango.fechainicio, rango.fechafin);
  const jsonData = response || {};

  const filtrarPorAlmacen = (lista) =>
    (Array.isArray(lista) ? lista : []).filter(item => !item?.almacen || item.almacen === datosEmpresa.empresa.nombre);

  const datosCaja = {
    ...jsonData,
    facturas: filtrarPorAlmacen(jsonData.facturas),
    gastos: filtrarPorAlmacen(jsonData.gastos),
    devoluciones: filtrarPorAlmacen(jsonData.devoluciones),
    cuentas_cobrar: filtrarPorAlmacen(jsonData.cuentas_cobrar),
    taller: filtrarPorAlmacen(jsonData.taller),
    registrocaja: filtrarPorAlmacen(jsonData.registrocaja)
  };

  const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
  const nDatosEmpresa = JSON.parse(datosEmpresaA);
  nDatosEmpresa.usuario = datosEmpresa.usuario;
  nDatosEmpresa.datoscaja = datosCaja;

  return { rango, nDatosEmpresa };
};

const construirUrlCuadre = () => {
  const fecha = transformarFechaTimestamp(formatearFecha(fechaHoy.value), false);

  if (modoCuadre.value === 'USUARIO') {
    const emailUsuario = obtenerEmailUsuarioCuadre();
    if (!emailUsuario) {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Seleccione un usuario para filtrar el cuadre', life: 3000 });
      return null;
    }
    return `${link.value}/vista/impresorareporte.php?fecha=${fecha} 00:00:00AND${fecha} 23:59:59&usuario=${encodeURIComponent(emailUsuario)}`;
  }

  if (turnoUsuarioSelected.value === 'COMPLETO') {
    return `${link.value}/vista/impresorareporte.php?fecha=${fecha} 00:00:00AND${fecha} 23:59:59`;
  }

  return `${link.value}/vista/impresorareporte.php?fecha=${fecha} ${turnoHoraInicio.value}AND${fecha} ${turnoHoraFin.value}`;
};

const imprimirCuadre = async()=>{
  if (window.electron) {
    const { rango, nDatosEmpresa } = await prepararPayloadCuadreCompleto();
    await window.electron.ipcRenderer.invoke(
      'imprimirCuadreCompleto',
      0,
      JSON.stringify(nDatosEmpresa),
      true,
      false,
      false,
      JSON.stringify(rango)
    );
    return;
  }

  const impresionpagina = construirUrlCuadre();
  if (!impresionpagina) {
    return;
  }

  window.open(impresionpagina, '_blank');

}
/******************************************************/
const fnVerCuadre = async()=>{
  if (window.electron) {
    const { rango, nDatosEmpresa } = await prepararPayloadCuadreCompleto();
    await window.electron.ipcRenderer.invoke(
      'imprimirCuadreCompleto',
      0,
      JSON.stringify(nDatosEmpresa),
      false,
      true,
      true,
      JSON.stringify(rango)
    );
    return;
  }

  const impresionpagina = construirUrlCuadre();
  if (!impresionpagina) {
    return;
  }

  window.open(impresionpagina, '_blank');
}
/******************************************************/
const getRowClass = (data) => {
  if (Number(data.stock) <= 0) {
    return 'row-red';
  } else if (Number(data.stock) > 0 && Number(data.stock) <= Number(data.alerta)) {
    return 'row-yellow';
  } else if (Number(data.stock) > Number(data.alerta)) {
    return 'row-green';
  }
  return '';
};
/******************************************************/
const currentRowData = ref(null);
const currentRowId = ref(null);
const itemsCotizacion = ref([]);

const toggleCotizacion = (event, rowData) => {
    currentRowData.value = rowData;
    itemsCotizacion.value = [
        { label: 'Editar', icon: 'pi pi-pencil', command: () => { editRow(currentRowData.value) } },
        { label: 'Imprimir', icon: 'pi pi-print', command: async() => {

           if (datosConfiguracion.value.impresora == 'Termica') {
            var impresionpagina = link.value+'/vista/impresoratermica.php?cotizacion='+rowData.no_cotizacion;
            window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);

           } else{
            var impresionpagina = link.value+'/receipt/factura.php?cotizacion='+rowData.no_cotizacion;
/*            window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')*/

  if(window.electron){
      loading.value = true;
    const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
    let envio = ''
    try{

     await window.electron.ipcRenderer.invoke('cotizacionPDF', rowData.no_cotizacion, datosEmpresa1,null);
    }catch(error){
      console.log("error", error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al Imprimir', life: 3000 });

    }finally{
     console.log("impresion", envio);
    loading.value = false;
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Impresion Completada', life: 3000 });
    }

  }else{

      Swal.fire({
        html: '<iframe src="' + impresionpagina + '" width="100%" height="600" style="border: none;"></iframe>',
        confirmButtonText: 'Cerrar',
        showCloseButton: true
       });


  }



           }

         } },
        { label: 'Whatsapp', icon: 'pi pi-whatsapp', command: () => { editRow(currentRowData.value) } },
        { label: 'PDF', icon: 'pi pi-file-pdf', command: () => { editRow(currentRowData.value) } },
        { label: 'Eliminar', icon: 'pi pi-trash', command: () => { deleteRow(currentRowData.value) } },
    ];
    menu.value.toggle(event);
};

const editRow = (rowData) => {
    console.log("Editing row:", rowData);
    // Agrega tu lógica de edición aquí
};

const deleteRow = (rowData) => {
    console.log("Deleting row:", rowData);
    // Agrega tu lógica de eliminación aquí
};

/******************************************************/
/************************************************************/
function extractIMEIs(text) {
    const regex = /\((\d{15}(,\d{15})*)\)/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        const imeis = match[1].split(',');
        matches.push(...imeis);
    }

    return matches;
}
/************************************************************/
const enviarCorreoEliminacionFactura = async (datosFactura) => {
  try {
    // Verificar si estamos en Electron
    if (!window.electron?.ipcRenderer) {
      console.log('Envío de correo solo disponible en Electron');
      return;
    }

    // Obtener configuración del correo
    const datoscorreo = await peticionesFetchOffline('getDataByField', 'configuracion_correo', 'id', 1);

    if (!datoscorreo) {
      console.log('No se encontró configuración de correo');
      return;
    }

    const datosEmpresaLocal = enviarDatosLocalStorage();
    const productosArray = JSON.parse(datosFactura.productos || '[]');

    // Crear tabla HTML de productos
    let tablaProductos = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="background-color: #dc2626; color: white;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Código</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descripción</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Cant.</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Precio</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    productosArray.forEach(prod => {
      tablaProductos += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${prod.codigo || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${prod.nombre || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${prod.cantidad || 0}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatoMonedaRD(prod.precio || 0)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatoMonedaRD((prod.cantidad || 0) * (prod.precio || 0))}</td>
        </tr>
      `;
    });

    tablaProductos += `
        </tbody>
      </table>
    `;

    // Crear HTML del correo
    const htmlCorreo = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .info-section { background-color: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #111827; }
          .footer { margin-top: 30px; padding: 15px; background-color: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ ALERTA: FACTURA ELIMINADA</h1>
        </div>

        <div class="content">
          <div class="alert-box">
            <strong>⚠️ ADVERTENCIA:</strong> Se ha eliminado una factura del sistema.
            Esta acción ha sido registrada para fines de auditoría.
          </div>

          <div class="info-section">
            <h3 style="margin-top: 0; color: #dc2626;">📋 Información de la Factura Eliminada</h3>
            <div class="info-row">
              <span class="label">Número de Factura:</span>
              <span class="value">${datosFactura.no_factura || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Tipo de Factura:</span>
              <span class="value">${datosFactura.tipo_factura || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Comprobante:</span>
              <span class="value">${datosFactura.comprobante || 'SIN COMPROBANTE'}</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha de Emisión:</span>
              <span class="value">${datosFactura.fecha_emision || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Cliente:</span>
              <span class="value">${datosFactura.nombre_cliente || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Cédula/RNC:</span>
              <span class="value">${datosFactura.cod_cliente || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span class="value">${datosFactura.telefono_cliente || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Método de Pago:</span>
              <span class="value">${datosFactura.metodo_pago || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Vendedor:</span>
              <span class="value">${datosFactura.vendedor || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Cajero:</span>
              <span class="value">${datosFactura.cajero || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Subtotal:</span>
              <span class="value">${formatoMonedaRD(datosFactura.subtotal || 0)}</span>
            </div>
            <div class="info-row">
              <span class="label">Descuento:</span>
              <span class="value">${formatoMonedaRD(datosFactura.descuento || 0)}</span>
            </div>
            <div class="info-row">
              <span class="label">ITBIS:</span>
              <span class="value">${formatoMonedaRD(datosFactura.impuesto || 0)}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="label" style="font-size: 18px; color: #dc2626;">Total:</span>
              <span class="value" style="font-size: 18px; font-weight: bold; color: #dc2626;">${formatoMonedaRD(datosFactura.total || 0)}</span>
            </div>

          <div class="info-section">
            <h3 style="margin-top: 0; color: #dc2626;">📦 Productos</h3>
            ${tablaProductos}
          </div>

          <div class="info-section">
            <h3 style="margin-top: 0; color: #dc2626;">👤 Información de Eliminación</h3>
            <div class="info-row">
              <span class="label">Eliminado por:</span>
              <span class="value">${datosEmpresa.usuario?.nombre || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Empresa/Almacén:</span>
              <span class="value">${datosEmpresa.empresa?.nombre || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha de Eliminación:</span>
              <span class="value">${nfecha('fecha')}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="label">Hora de Eliminación:</span>
              <span class="value">${nfecha('hora')}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 5px 0;">Este es un mensaje automático del sistema ${datosEmpresaLocal.empresa?.nombre || 'Sistema AA'}</p>
          <p style="margin: 5px 0;">Por favor, no responda a este correo.</p>
        </div>
      </body>
      </html>
    `;

    const envioCorreo = {
      mailto: datosEmpresaLocal.empresa?.email || datoscorreo.email || 'admin@empresa.com',
      subjet: `⚠️ ALERTA: Factura Eliminada - #${datosFactura.no_factura} - ${datosEmpresa.empresa?.nombre || 'Sistema AA'}`,
      mensaje: `Se ha eliminado la factura #${datosFactura.no_factura} por ${datosEmpresa.usuario?.nombre || 'Usuario'} el ${nfecha('fecha')} a las ${nfecha('hora')}`,
      albody: htmlCorreo,
      correo: datoscorreo,
      empresa: datosEmpresaLocal.empresa?.nombre || 'Sistema AA'
    };

    // Enviar correo en segundo plano
    window.electron.ipcRenderer.invoke('enviarCorreo', envioCorreo)
      .then(resultado => {
        if (resultado?.ok) {
          console.log('Correo de eliminación enviado exitosamente');
        } else {
          console.error('Error al enviar correo de eliminación:', resultado?.error);
        }
      })
      .catch(err => {
        console.error('Error al enviar correo de eliminación:', err);
      });

  } catch (error) {
    console.error('Error al preparar/enviar correo de eliminación:', error);
  }
};
/************************************************************/
const eliminarFactura = (facturaObjet) =>{

const factura = facturaObjet.no_factura;

  Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  }).then(async(result) => {
    if (result.isConfirmed) {
      const contrasenaIngresada = result.value;
      if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value || contrasenaIngresada === tokenSoloUso.value || contrasenaIngresada === token24H.value) {

       if(contrasenaIngresada === tokenSoloUso.value){
          await actualizarTokenSoloUso()
       }

      if (facturaObjet) {
        
      const productosFactura = JSON.parse(facturaObjet.productos)
         
         for(let prod of productosFactura){

              if (prod.categoria == 'CELULARES') {

                 let listaImei = [];
                
                  if(prod.lista_imei){
                     listaImei = prod.lista_imei.split(',')
                  }else{
                    listaImei = extractIMEIs(prod.nombre)
                  }

                 for(let imei of listaImei){
                    const datosImei = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/imei/imei/${imei}`,{},tokenCifrado.value,'GET');
                    if(datosImei){
                      datosImei.estado = 'DISPONIBLE';
                      datosImei.comprador = '';
                      datosImei.fecha_venta = '';
                      datosImei.hora_venta = '';
                          const url = link.value+api.value+"/actualizarcampos/imei";
                            if (datosImei.hasOwnProperty('created_at')) {
                            datosImei.updated_at = nfecha('timestamp')
                          }
                           //const envioDatos = await enviarDatosPorPost(url, datosImei,tokenCifrado.value);
                             const envioDatos = await peticionesFetchOffline('updateData','imei', JSON.stringify(datosImei));
                           await fetchIMEI()
                           const stockProducto = imeiArray.value.filter(prod=>prod.id_equi == datosImei.id_equi)
                           
                           const datosProdArray = dataProductos.value.find(prod=>prod.id == datosImei.id_equi)

                           if (datosProdArray) {

                          const urlProd = link.value+api.value+"/actualizarcampos/productos";
                            if (datosProdArray.hasOwnProperty('created_at')) {
                              datosProdArray.updated_at = nfecha('timestamp')
                          }

                           datosProdArray.stock = stockProducto.length
                          //const envioDatosProd = await enviarDatosPorPost(urlProd, datosProdArray,tokenCifrado.value);
                          const envioDatosProd = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosProdArray));
                           if (envioDatosProd[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Restaurado correctamente', life: 3000 });
                           }
                        }
                    }


                 }
              }else{
                
                const datosProdArray = dataProductos.value.find(producto=>producto.codigo == prod.codigo)
            
                if (datosProdArray) {

                        const urlProd = link.value+api.value+"/actualizarcampos/productos";
                          if (datosProdArray.hasOwnProperty('created_at')) {
                            datosProdArray.updated_at = nfecha('timestamp')
                        }

                          datosProdArray.stock = (Number(datosProdArray.stock) + Number(prod.cantidad))
                        /*const envioDatosProd = await enviarDatosPorPost(urlProd, datosProdArray,tokenCifrado.value);*/
                        const envioDatosProd = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosProdArray));

                         if (envioDatosProd[0] == 'ok') {
                          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Restaurado correctamente', life: 3000 });
                         }
                
                }



              }

              await fetchAndSetupDataFacturas()
         }

                         if(facturaObjet.metodo_pago === 'CREDITO'){
                            const datosCredito = await peticionesFetch(`${link.value}${api.value}`, `datoscampo/cuentas_cobrar/no_factura/${facturaObjet.no_factura}`, {}, tokenCifrado.value, 'GET');
                            if(datosCredito){
                                const datosFacturaCredito = await peticionesFetch(`${link.value}${api.value}`, `borrarporcampo/cuentas_cobrar`, { campo: 'id', valor: datosCredito.id }, tokenCifrado.value, 'POST');

                             if (datosFacturaCredito[0] == 'ok') {
                                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos CREDITO eliminados correctamente', life: 3000 });
                             }


                            }

                         }
      }

      // Enviar correo de alerta antes de eliminar
      await enviarCorreoEliminacionFactura(facturaObjet);

      const datosFactura = await peticionesFetch(`${link.value}${api.value}`,`borrarporcampo/facturas`,{campo:'no_factura',valor:factura},tokenCifrado.value,'POST');

      if (datosFactura[0]=='ok') {

           toast.add({ severity: 'success', summary: 'Éxito', detail: 'Factura eliminada correctamente', life: 3000 });
           await fetchAndSetupDataFacturas()
      }else{
          toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar la Factura', life: 3000 });
      }

      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  });
}
/******************************************************/
const itemsFacturas = ref([]);

const toggleFacturas = (event, rowData) => {
    currentRowData.value = rowData;
    itemsFacturas.value = [
        { label: 'Editar', icon: 'pi pi-pencil', command: () => { editRow(currentRowData.value) } },
{ 
  label: 'Imprimir', 
  icon: 'pi pi-print', 
  command: () => {

    Swal.fire({
      title: 'Selecciona el tipo de impresión',
      icon: 'question',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Térmica',
      denyButtonText: 'Normal',
      showDenyButton: true,
    }).then(async(result) => {
      let impresionpagina;

      if (result.isConfirmed) { 
       // impresionpagina = link.value + '/vista/impresoratermica.php?factura=' + rowData.no_factura;
        //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true, false);
         const factura = rowData.no_factura;
/*         const datosEmpresa = JSON.stringify(enviarDatosLocalStorage() )
        window.electron.ipcRenderer.invoke('ticket',factura,datosEmpresa);*/


     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
         const datosFactura = rowData
         const datosCliente = await peticionesFetch(
            `${link.value}${api.value}`,
            `datoscampo/clientes/codigo/${rowData.cod_cliente}`,
            {},
            tokenCifrado.value,
            'GET'
          )

     const envio = await window.electron.ipcRenderer.invoke('ticket', JSON.stringify(datosFactura),JSON.stringify(datosCliente), datosEmpresa1);






      } else if (result.isDenied) {
        impresionpagina = link.value + '/receipt/factura.php?factura=' + rowData.no_factura;
/*        window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', false, true);*/
  if(window.electron){
          //window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url',false,true,false)

/*
     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
     const envio = await window.electron.ipcRenderer.invoke('facturaPDF', rowData.no_factura, datosEmpresa1,null);*/

     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
         const datosFactura = rowData
         const datosCliente = await peticionesFetch(
            `${link.value}${api.value}`,
            `datoscampo/clientes/codigo/${rowData.cod_cliente}`,
            {},
            tokenCifrado.value,
            'GET'
          )

     const envio = await window.electron.ipcRenderer.invoke('facturaPDF', JSON.stringify(datosFactura),JSON.stringify(datosCliente), datosEmpresa1,null);


  }else{
      router.push({ path: `/factura/${rowData.no_factura}` });
    }

      }

    });

  } 
},
        { label: 'Whatsapp', icon: 'pi pi-whatsapp', command: () => {
          const mensajaeEnviar = `Hola *${rowData.nombre_cliente}* Aquí tiene un enlace para ver o descargar su *Factura* ${datosConfiguracion.value.urlsitio}receipt/factura?factura=${rowData.no_factura}`;
          datosWhatsApp.value.nombre = rowData.nombre_cliente
          datosWhatsApp.value.numero = rowData.telefono_cliente
          datosWhatsApp.value.texto = mensajaeEnviar
         showWhatsAppModal()

         } },
        { label: 'Estado', icon: 'pi pi-eye', command: () => { editRow(currentRowData.value) } },
        { label: 'PDF', icon: 'pi pi-file-pdf', command: () => {
            var impresionpagina = link.value+'/receipt/factura.php?factura='+rowData.no_factura;
            window.electron.ipcRenderer.invoke('open-new-window', impresionpagina,'url')
         } },
        { label: 'Eliminar', icon: 'pi pi-trash', command: async() => {


           await eliminarFactura(currentRowData.value)



         } },
    ];
    menu.value.toggle(event);
};

/******************************************************/
async function funcionActualizarProducto(producto) {
  const url = link.value+api.value+"/actualizarcampos/productos";
  if (!producto.nombre) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
}
if (producto.hasOwnProperty('created_at')) {
      producto.updated_at = nfecha('timestamp')
}
//const envioDatos = await enviarDatosPorPost(url, producto,tokenCifrado.value);
const envioDatos = await peticionesFetchOffline('updateData','productos', JSON.stringify(producto));

  if (envioDatos[0] == 'ok') {
     await fetchAndSetupDataProductos();
     await cargarDashboardHome();
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
}else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/******************************************************/
watch(visibleModificarStock,(evento)=>{
  if(evento){
   productoSelected.value = {};

      productoBuscado.value.nombre = ''
      productoBuscado.value.stock = '0'
      productoBuscado.value.precio_compra = ''
      productoBuscado.value.ganancia = ''
      productoBuscado.value.impuesto = ''
      productoBuscado.value.precio_venta = ''
      productoBuscado.value.precio_min = ''
      productoBuscado.value.precio_xmayor = ''
      productoBuscado.value.imeiLista = ''
      productoBuscado.value.impuesto_venta = ''
      productoBuscado.value.precio_final = ''
      productoBuscado.value.nStock = '0'


  }else{
   productoSelected.value = null;

  }
})
/******************************************************/
const fnAwesomplete = ()=>{

}
const handleSelectComplete = async(selected)=>{

   const producto = dataProductos.value.find(prod =>
    prod.nombre === selected.value ||
    prod.codigo === selected.value ||
    prod.codigoBarra === selected.value
  );


    if (producto) {
        productoSelected.value = producto

      if (producto.categoria =='CELULARES') {
          imeiShow.value = true;
          await fechDataIMEI()
        }else{
          imeiShow.value = false
        }

      productoBuscado.value.nombre = producto.nombre
      productoBuscado.value.stock = producto.stock
      productoBuscado.value.precio_compra = producto.precio_compra
      productoBuscado.value.ganancia = producto.ganancia
      productoBuscado.value.impuesto = producto.impuestos
      productoBuscado.value.precio_venta = producto.precio_venta
      productoBuscado.value.precio_min = producto.precio_min
      productoBuscado.value.precio_xmayor = producto.precio_xmayor
      productoBuscado.value.imei = ''
      productoBuscado.value.impuesto_venta = producto.impuesto_venta
      productoBuscado.value.precio_final = producto.precio_final
      productoBuscado.value.nStock = '0'

    }else{
       toast.add({ severity: 'error', summary: 'Error', detail: 'No se Encuentra el Producto', life: 3000 });
    }

}
/******************************************************/
const fnSumarStock = async()=>{
   const suma = (Number(productoBuscado.value.stock) + Number(productoBuscado.value.nStock));
   if (productoSelected.value) {
    productoSelected.value.stock = suma
     await funcionActualizarProducto(productoSelected.value);
     productoBuscado.value.stock = suma
     productoBuscado.value.nStock = '0'
   }
}
/******************************************************/
const fnAgregarIMEI = async()=>{

    const verificaIMEI = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/imei/imei/${productoBuscado.value.imei}`,{},tokenCifrado.value,'GET');

  if (verificaIMEI) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'ESTE IMEI YA ESTA REGISTRADO', life: 3000 });
      productoBuscado.value.imei = ''
      return
  }

   const datoscamposImei = await arrayToObjetoFromTabla(link.value+api.value,tokenCifrado.value,'imei',true);
   datoscamposImei.imei = productoBuscado.value.imei;
   datoscamposImei.equipo = productoSelected.value.nombre;
   datoscamposImei.id_equi = productoSelected.value.id;
   datoscamposImei.estado = 'DISPONIBLE';
   datoscamposImei.fecha = nfecha('fecha');
   datoscamposImei.detalles = `ALMACENAMIENTO:
BATERIA TESTEADA: si
BATERIA QUE MARCA: original
DETALLES ESTETICOS: Ninguno
DETALLES INTERNOS: Ninguno
BATERIA MARCA: 100%`;

  const url = link.value+api.value+"/insertar/imei";
  if (datoscamposImei.hasOwnProperty('created_at')) {
     datoscamposImei.created_at = nfecha('timestamp')
     datoscamposImei.updated_at = nfecha('timestamp')
    }
/*  const envioDatos = await enviarDatosPorPost(url, datoscamposImei,tokenCifrado.value);
*/  const envioDatos = await peticionesFetchOffline('updateData','imei', JSON.stringify(datoscamposImei));
  if (envioDatos[0] == 'ok') {
     productoBuscado.value.nStock = '1'
     await fnSumarStock();

     toast.add({ severity: 'success', summary: 'Éxito', detail: 'IMEI Agregado', life: 3000 });
     productoBuscado.value.imei = ''

    await fetchIMEI();
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar el IMEI.', life: 3000 });
}



}
/******************************************************/
const fechDataIMEI = async()=>{
    //imeiList
    const response = await enviarDatosPorPost(`${link.value+api.value}/datosarraydoblecondicion/imei`,{campo1:'id_equi',valor1:productoSelected.value.id,campo2:'estado',valor2:'DISPONIBLE'},tokenCifrado.value);
    const jsonData = response;
    productoBuscado.value.stock = jsonData.length;
    await fnSumarStock();
}
/******************************************************/
const fnImprimirProducto = ()=>{
  if (productoSelected.value.id) {
      var impresionpagina = link.value+'/vista/imprimirproductoticket.php?id='+productoSelected.value.id;
      window.electron.ipcRenderer.invoke('open-new-window', impresionpagina, 'url', true,false);
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debes seleccionar un Producto', life: 3000 });
  }
}
/******************************************************/
const fnEditarProducto = ()=>{
  if (productoSelected.value.id) {
      router.push({ path: `/editarproductos/${productoSelected.value.id}` });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debes seleccionar un Producto', life: 3000 });
  }
}
/******************************************************/
const fnBarcode = ()=>{

}
/******************************************************/
const fnvenderProducto = () => {
    // Obtener productos agregados del localStorage
    let productosAgregados = JSON.parse(window.localStorage.getItem('productosVenta')) || [];

    // Asegurar que productoSelected tiene un valor
    if (productoSelected.value) {
        // Buscar si el producto ya existe en la lista de productos agregados
        const productoExistente = productosAgregados.find(prod => prod.codigo === productoSelected.value.codigo);

        // Si el producto ya existe, incrementar la cantidad
        if (productoExistente) {
            productoExistente.cantidad += 1;
        } else {
            // Si el producto no existe, establecer cantidad y descuento, y agregarlo a la lista
            productoSelected.value.cantidad = 1;
            productoSelected.value.descuento = 0.00;
            productosAgregados.push(productoSelected.value);
        }

        // Mostrar notificación de éxito
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto Agregado', life: 3000 });

        // Actualizar el localStorage con la lista de productos actualizada
        window.localStorage.setItem('productosVenta', JSON.stringify(productosAgregados));

        // Redirigir al usuario a la ruta /vender
        router.push({ path: `/vender` });
    } else {
        // Manejar el caso donde productoSelected no tiene valor
        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay producto seleccionado', life: 3000 });
    }
}

/******************************************************/
const datosIMEI = ref({})
/******************************************************/
const fnagregarImei = async()=>{
  //event.stopImmediatePropagation()
  const imeiArrayLocalStorage = JSON.parse(window.localStorage.getItem('arrayIMEI')) || [];
 let productosVenta = ref(JSON.parse(window.localStorage.getItem('productosVenta')) || []);

 const verifica = imeiArrayLocalStorage.find(equipo=>equipo.imei == datosIMEI.value.imei)
 if (verifica) {
  toast.add({ severity: 'error', summary: 'Upps', detail: `Equipo ${datosIMEI.value.equipo} Encontrado en la Lista, No se puede agregar 2 veces`, life: 3000 });
  return
 }

 const datosEquipo = await peticionesFetch(`${link.value}${api.value}`,`datoscampo/productos/id/${datosIMEI.value.id_equi}`,{},tokenCifrado.value,'GET');
 //const datosEquipo = productosArray.value.find(prod=>prod.id == datosIMEI.value.id_equi)
 if (datosEquipo) {
  toast.add({ severity: 'success', summary: 'Encontrado', detail: `Equipo ${datosEquipo.nombre} agregado`, life: 3000 });
      imeiArrayLocalStorage.push({imei:datosIMEI.value.imei,id_equi:datosIMEI.value.id_equi});

    const productoExistente = productosVenta.value.find(prod => prod.codigo === datosEquipo.codigo);
    if (productoExistente) {

      if (!datosEquipo.lista_imei) {
       const imeiLista = stringParentesis(productoExistente.nombre);
       productoExistente.lista_imei = imeiLista;
      }
       const listaImei = productoExistente.lista_imei.split(',')
       listaImei.push(datosIMEI.value.imei)

      datosEquipo.nombre = datosEquipo.nombre + ` (${listaImei.join(',')})`
      datosEquipo.lista_imei = listaImei.join(',')

      productoExistente.nombre = datosEquipo.nombre
      productoExistente.lista_imei = datosEquipo.lista_imei
      productoExistente.cantidad += 1;
    } else {
      datosEquipo.cantidad = 1
      datosEquipo.descuento = 0.00
      datosEquipo.nombre = datosEquipo.nombre + ` (${datosIMEI.value.imei})`
      datosEquipo.lista_imei = datosIMEI.value.imei

      productosVenta.value.push(datosEquipo);
    }
    window.localStorage.setItem('productosVenta',JSON.stringify(productosVenta.value))
    window.localStorage.setItem('arrayIMEI',JSON.stringify(imeiArrayLocalStorage))
    router.push({ path: `/vender` });

 }


}
/******************************************************/
const fnBuscarIMEIlocal = async () => {
  visibleIMEI.value = false;
  const imei = imeiModal.value;
  const response = await peticionesFetch(
    `${link.value}${api.value}`,
    `datoscampo/imei/imei/${imei}`,
    {},
    tokenCifrado.value,
    'GET'
  );

  if (response) {
    toast.add({
      severity: 'success',
      summary: 'OK',
      detail: 'Datos encontrados',
      life: 3000,
    });
     datosIMEI.value = response
    const responseProducto = dataProductos.value.find(
      (prod) => prod.id == response.id_equi
    );

    if (responseProducto) {
      const estado = response.estado; // Assuming 'estado' is the property name
      const estadoStyle = estado === 'DISPONIBLE' ? 'color: green;' : 'color: red;';
      const estadoText = `<span style="${estadoStyle}">${estado}</span>`;

      let additionalDetails = '';
      if (estado === 'VENDIDO') {
        additionalDetails = `
          <p><strong>Fecha de Venta:</strong> ${response.fecha_venta}</p>
          <p><strong>Comprador:</strong> ${response.comprador}</p>
        `;
      }

      Swal.fire({
        title: 'Detalles del Celular',
        html: `
          <p><strong>Estado:</strong> ${estadoText}</p>
          <p><strong>Precio Compra:</strong> ${responseProducto.precio_compra}</p>
          <p><strong>Precio Venta:</strong> ${responseProducto.precio_venta}</p>
          <p><strong>Precio Mínimo:</strong> ${responseProducto.precio_min}</p>
          <p><strong>Precio por Mayor:</strong> ${responseProducto.precio_xmayor}</p>
          ${additionalDetails}
        `,
        icon: 'info',
        showCancelButton: estado === 'DISPONIBLE',
        confirmButtonText: 'Cerrar',
        cancelButtonText: 'Vender'
      }).then(async(result) => {
        if (estado === 'DISPONIBLE' && result.dismiss === Swal.DismissReason.cancel) {
          await fnagregarImei()
        }
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el producto asociado',
        life: 3000,
      });
    }
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se encuentra el IMEI',
      life: 3000,
    });
  }
};


const fnBuscarIMEIgeneral = async()=>{
if (!imeiModal.value || imeiModal.value =='') {
  toast.add({ severity: 'error', summary: 'Error', detail: 'Escriba un IMEI valido', life: 3000 });
  return
}

/*  const datos =
{
  "service": '0',
  "imei": imeiModal.value,
  //"key": "WLZ-OJ2-7HJ-0XH-DJ6-AVZ-OXU-1XB"
  "key": "JKD-QC9-9L9-9C6-GT7-J2I-LIV-U3M"
}*/

    const datosJSON = await envioElectron('datosarchivo');
    const datos = {
      service: '0',
      imei: imeiModal.value,
      key: datosJSON.VITE_IFREEICLOUD_KEY || ''
    };


    try {

    const responseIMEI = await fetch("https://api.ifreeicloud.co.uk", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(datos).toString()
    });

    if (!responseIMEI.ok) {
      throw new Error(`Error HTTP al consultar IMEI: ${responseIMEI.status}`);
    }

     const prueba = await responseIMEI.json();

       // const prueba = await enviarDatosPorPost('https://api.ifreeicloud.co.uk', datos,tokenCifrado.value);

        if (prueba.success) {
          visibleIMEI.value = false
          const formattedData = Object.entries(prueba.object)
            .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
            .join('');

          // Mostrar prueba.object con SweetAlert2
          Swal.fire({
            title: 'Datos del IMEI',
            html: `<ul>${formattedData}</ul>`,
            icon: 'success',
            confirmButtonText: 'Cerrar'
          });

        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se encuentran Datos', life: 3000 });
        }
    } catch (error) {
         toast.add({ severity: 'error', summary: 'Error', detail: 'Error de peticion', life: 3000 });
    }
}
/******************************************************/

/******************************************************/
</script>
<template>
  <!-- Main content -->
  <main class="home-wrapper">
      <div class="home-container">
        <div class="containerS mx-auto px-4 ">

          <!-- Header Hero Section -->
<!--           <div class="hero-header">
            <div class="hero-content">
              <div class="hero-icon-wrapper">
                <i class="pi pi-building text-white text-4xl"></i>
              </div>
              <div class="hero-text">
                <h1 class="hero-title">{{ datosEmpresa.empresa.nombre }}</h1>
                <p class="hero-subtitle">Dashboard de Gestión Empresarial</p>
              </div>
            </div>
            <div class="hero-date">
              <i class="pi pi-calendar text-white mr-2"></i>
              <span>{{ fechaHoy }}</span>
            </div>
          </div> -->

          <section class="home-visibility-panel">
            <div class="home-visibility-head">
              <div>
                <span>Personalizacion del home</span>
                <strong>Mostrar u ocultar cards</strong>
              </div>
              <Button label="Mostrar todo" icon="pi pi-eye" size="small" outlined @click="mostrarTodosLosCardsHome" />
            </div>
            <div class="home-visibility-grid">
              <label v-for="toggle in homeDisplayToggles" :key="toggle.key" class="home-display-toggle">
                <span>{{ toggle.label }}</span>
                <InputSwitch v-model="toggle.model.value" />
              </label>
              <label class="home-display-toggle">
                <span>Analisis semanal</span>
                <InputSwitch v-model="mostrarAnalisisFinancieroSemanal" />
              </label>
            </div>
          </section>

            <section v-if="mostrarHomeBoard" class="home-board">
              <section class="home-board-hero">
                <div>
                  <span class="home-board-kicker">Dashboard central</span>
                  <h2 class="text-white">{{ datosEmpresa.empresa.nombre }}</h2>
                  <p>Ventas, caja, inventario, taller y cobranza presentados con claridad ejecutiva.</p>
                </div>
                <div class="home-board-status" :class="dashboardResumen.cajaAbierta ? 'is-open' : 'is-closed'">
                  <span>Caja</span>
                  <strong>{{ dashboardResumen.cajaEstado }}</strong>
                </div>
              </section>

              <section v-if="mostrarHomeResumen" class="home-board-summary">
                <article class="home-board-card home-board-card-primary">
                  <span>Ventas del día</span>
                  <strong>{{ formatearMonedaDashboard(datosDelDia.venta) }}</strong>
                  <small>{{ cantidadFacturasHoy }} facturas emitidas hoy</small>
                </article>
                <article class="home-board-card">
                  <span>Ganancias</span>
                  <strong>{{ formatearMonedaDashboard(datosDelDia.ganancia) }}</strong>
                  <small>Resultado neto acumulado</small>
                </article>
                <article class="home-board-card">
                  <span>Cuentas por cobrar</span>
                  <strong>{{ formatearMonedaDashboard(dashboardResumen.montoCuentasPorCobrar) }}</strong>
                  <small>{{ dashboardResumen.cuentasPorCobrar }} pendientes</small>
                </article>
                <article class="home-board-card">
                  <span>Stock bajo</span>
                  <strong>{{ dashboardResumen.alertasStock }}</strong>
                  <small>Productos en nivel crítico</small>
                </article>
              </section>

              <section class="home-board-analytics">
                <article v-if="false" class="home-board-panel home-board-panel-wide">
                  <div class="home-board-panel-head">
                    <div>
                      <span class="home-board-section">Análisis financiero</span>
                      <h3>Ventas, ganancias, gastos y cuentas por cobrar</h3>
                    </div>
                    <span class="home-board-pill">Hoy</span>
                  </div>
                  <Chart
                    v-if="dashboardResumenFinancieroChart && dashboardResumenFinancieroOptions"
                    type="bar"
                    :data="dashboardResumenFinancieroChart"
                    :options="dashboardResumenFinancieroOptions"
                    class="home-board-chart home-board-chart-bar"
                  />
                </article>

                <article v-if="!ocultarAnalisisFinancieroSemanal" class="home-board-panel home-board-panel-wide home-board-panel-full">
                  <div class="home-board-panel-head">
                    <div>
                      <span class="home-board-section">AnÃ¡lisis financiero semanal</span>
                      <h3>Semana actual por dia: ventas, ganancias, gastos y abonos</h3>
                    </div>
                    <span class="home-board-pill">Semana actual</span>
                  </div>

                  <div class="home-board-mini-grid">
                    <div class="home-board-mini-card">
                      <span>Ventas</span>
                      <strong>{{ formatearMonedaDashboard(datosSemanaActual.venta) }}</strong>
                    </div>
                    <div class="home-board-mini-card">
                      <span>Facturas</span>
                      <strong>{{ cantidadFacturasSemanaActual }}</strong>
                    </div>
                    <div class="home-board-mini-card">
                      <span>Gastos</span>
                      <strong>{{ formatearMonedaDashboard(datosSemanaActual.gastos) }}</strong>
                    </div>
                    <div class="home-board-mini-card">
                      <span>Utilidad neta</span>
                      <strong>{{ formatearMonedaDashboard(dashboardUtilidadNetaSemanaActual) }}</strong>
                    </div>
                  </div>

                  <Chart
                    v-if="dashboardResumenFinancieroSemanaChart && dashboardResumenFinancieroSemanaOptions"
                    type="bar"
                    :data="dashboardResumenFinancieroSemanaChart"
                    :options="dashboardResumenFinancieroSemanaOptions"
                    class="home-board-chart home-board-chart-bar"
                  />
                </article>

                <article v-if="false" class="home-board-panel">
                  <div class="home-board-panel-head">
                    <div>
                      <span class="home-board-section">Ingresos</span>
                      <h3>Composición por método de pago</h3>
                    </div>
                    <span class="home-board-pill">Mix</span>
                  </div>

                  <div class="home-board-mini-grid">
                    <div class="home-board-mini-card">
                      <span>Efectivo</span>
                      <strong>{{ formatearMonedaDashboard(datosDelDia.efectivo) }}</strong>
                    </div>
                    <div class="home-board-mini-card">
                      <span>Tarjeta</span>
                      <strong>{{ formatearMonedaDashboard(datosDelDia.tarjeta) }}</strong>
                    </div>
                    <div class="home-board-mini-card">
                      <span>Transferencia</span>
                      <strong>{{ formatearMonedaDashboard(datosDelDia.transferencia) }}</strong>
                    </div>
                    <div class="home-board-mini-card">
                      <span>Utilidad neta</span>
                      <strong>{{ formatearMonedaDashboard(dashboardUtilidadNeta) }}</strong>
                    </div>
                  </div>

                  <Chart
                    v-if="dashboardMetodosPagoChart && dashboardMetodosPagoOptions"
                    type="doughnut"
                    :data="dashboardMetodosPagoChart"
                    :options="dashboardMetodosPagoOptions"
                    class="home-board-chart home-board-chart-donut"
                  />
                </article>
              </section>

              <section v-if="mostrarHomeTallerCards" class="home-board-strip">
                <article class="home-board-strip-card">
                  <span>Reparaciones pendientes</span>
                  <strong>{{ dashboardResumen.reparacionesPendientes }}</strong>
                  <small>Equipos en cola de servicio</small>
                </article>
                <article class="home-board-strip-card">
                  <span>Equipos entregados</span>
                  <strong>{{ dashboardResumen.equiposEntregados }}</strong>
                  <small>Procesos cerrados correctamente</small>
                </article>
                <article class="home-board-strip-card">
                  <span>No entregados</span>
                  <strong>{{ dashboardResumen.equiposNoEntregados }}</strong>
                  <small>Equipos listos o pendientes de retiro</small>
                </article>
                <article class="home-board-strip-card">
                  <span>Equipos en garantia</span>
                  <strong>{{ dashboardResumen.equiposGarantia }}</strong>
                  <small>Seguimientos activos en postventa</small>
                </article>
              </section>
            </section>

          <section v-if="false" class="dashboard-overview">
            <div class="dashboard-grid">
              <article class="dashboard-card dashboard-card-strong">
                <div class="dashboard-card-head">
                  <span class="dashboard-kicker">Resumen de ventas del día</span>
                  <i class="pi pi-chart-line"></i>
                </div>
                <div class="dashboard-amount">{{ formatearMonedaDashboard(datosDelDia.venta) }}</div>
                <div class="dashboard-meta-row">
                  <span>{{ cantidadFacturasHoy }} facturas hoy</span>
                  <span>{{ formatearMonedaDashboard(datosDelDia.efectivo) }} en efectivo</span>
                </div>
              </article>

              <article class="dashboard-card">
                <div class="dashboard-card-head">
                  <span class="dashboard-kicker">Ganancias</span>
                  <i class="pi pi-wallet"></i>
                </div>
                <div class="dashboard-mini-value">{{ formatearMonedaDashboard(datosDelDia.ganancia) }}</div>
                <p class="dashboard-note">Rentabilidad acumulada del día.</p>
              </article>

              <article class="dashboard-card">
                <div class="dashboard-card-head">
                  <span class="dashboard-kicker">Gastos del día</span>
                  <i class="pi pi-receipt"></i>
                </div>
                <div class="dashboard-mini-value">{{ formatearMonedaDashboard(datosDelDia.gastos) }}</div>
                <p class="dashboard-note">Salida registrada en caja y bancos.</p>
              </article>

              <article class="dashboard-card">
                <div class="dashboard-card-head">
                  <span class="dashboard-kicker">Caja</span>
                  <i class="pi pi-inbox"></i>
                </div>
                <div class="dashboard-status" :class="dashboardResumen.cajaAbierta ? 'is-open' : 'is-closed'">
                  {{ dashboardResumen.cajaEstado }}
                </div>
                <p class="dashboard-note">Estado actual de caja para la fecha seleccionada.</p>
              </article>
            </div>

            <div class="dashboard-panels">
              <article class="dashboard-panel">
                <div class="dashboard-panel-title">
                  <h3>Productos más vendidos</h3>
                  <span>Top del día</span>
                </div>

                <div v-if="dashboardTopProductos.length" class="dashboard-list">
                  <div
                    v-for="(producto, index) in dashboardTopProductos"
                    :key="`${producto.nombre}-${index}`"
                    class="dashboard-list-item"
                  >
                    <div>
                      <strong>{{ producto.nombre }}</strong>
                      <small>{{ producto.cantidad }} unidad(es)</small>
                    </div>
                    <span>{{ formatearMonedaDashboard(producto.total) }}</span>
                  </div>
                </div>
                <div v-else class="dashboard-empty">No hay ventas cargadas para hoy.</div>
              </article>

              <article class="dashboard-panel">
                <div class="dashboard-panel-title">
                  <h3>Operaciones del taller</h3>
                  <span>Resumen rápido</span>
                </div>

                <div class="dashboard-metrics">
                  <div class="dashboard-metric">
                    <span>Reparaciones pendientes</span>
                    <strong>{{ dashboardResumen.reparacionesPendientes }}</strong>
                  </div>
                  <div class="dashboard-metric">
                    <span>Equipos entregados</span>
                    <strong>{{ dashboardResumen.equiposEntregados }}</strong>
                  </div>
                  <div class="dashboard-metric">
                    <span>No entregados</span>
                    <strong>{{ dashboardResumen.equiposNoEntregados }}</strong>
                  </div>
                  <div class="dashboard-metric">
                    <span>Equipos en garantía</span>
                    <strong>{{ dashboardResumen.equiposGarantia }}</strong>
                  </div>
                </div>

                <div v-if="dashboardPendientesTaller.length" class="dashboard-sublist">
                  <div
                    v-for="equipo in dashboardPendientesTaller"
                    :key="equipo.id"
                    class="dashboard-sublist-item"
                  >
                    <div>
                      <strong>{{ equipo.nombre || equipo.equipo || 'Equipo sin nombre' }}</strong>
                      <small>{{ equipo.marca }} {{ equipo.modelo }}</small>
                    </div>
                    <span>{{ equipo.estado || 'Pendiente' }}</span>
                  </div>
                </div>
              </article>

              <article class="dashboard-panel">
                <div class="dashboard-panel-title">
                  <h3>Cuentas por cobrar</h3>
                  <span>Clientes pendientes</span>
                </div>

                <div class="dashboard-amount-sm">{{ formatearMonedaDashboard(dashboardResumen.montoCuentasPorCobrar) }}</div>
                <p class="dashboard-note">
                  {{ dashboardResumen.cuentasPorCobrar }} cuenta(s) con estatus pendiente.
                </p>

                <div class="dashboard-panel-title dashboard-panel-title-inline">
                  <h3>Alertas de stock bajo</h3>
                  <span>{{ dashboardResumen.alertasStock }} producto(s)</span>
                </div>

                <div v-if="dashboardAlertasStock.length" class="dashboard-sublist">
                  <div
                    v-for="producto in dashboardAlertasStock"
                    :key="producto.id"
                    class="dashboard-sublist-item"
                  >
                    <div>
                      <strong>{{ producto.nombre }}</strong>
                      <small>Alerta: {{ producto.alerta || 0 }}</small>
                    </div>
                    <span>Stock: {{ producto.stock || 0 }}</span>
                  </div>
                </div>
                <div v-else class="dashboard-empty">No hay alertas de stock bajo.</div>
              </article>
            </div>
          </section>

          <!-- Quick Actions Section -->
          <div v-if="mostrarAccionesRapidas" class="actions-section bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div class="section-header">
              <div class="section-header-title">
                <div class="section-icon-wrapper">
                  <i class="pi pi-bolt"></i>
                </div>
                <div>
                  <h2 class="section-title text-slate-800 dark:text-slate-100">{{ $t('Quick Actions') }}</h2>
                  <p class="section-subtitle text-slate-500 dark:text-slate-400">{{ $t('Direct access to main functions') }}</p>
                </div>
              </div>
              <div class="home-display-toggles">
                <label class="home-display-toggle">
                  <span>Ocultar analisis semanal</span>
                  <InputSwitch v-model="ocultarAnalisisFinancieroSemanal" />
                </label>
                <label class="home-display-toggle">
                  <span>Botones en tarjeta</span>
                  <InputSwitch v-model="botonesEnTarjeta" />
                </label>
              </div>
            </div>

            <div v-if="false" class="dashboard-v2-top mb-3">
              <article class="dashboard-v2-hero">
                <div class="dashboard-v2-hero-head">
                  <div>
                    <span class="dashboard-v2-eyebrow">Resumen ejecutivo</span>
                    <h2>Control diario del negocio</h2>
                    <p>Ventas, caja, servicio técnico, inventario y cobranza en una sola vista.</p>
                  </div>
                  <div class="dashboard-v2-status" :class="dashboardResumen.cajaAbierta ? 'is-open' : 'is-closed'">
                    <span>Caja</span>
                    <strong>{{ dashboardResumen.cajaEstado }}</strong>
                  </div>
                </div>

                <div class="dashboard-v2-total-wrap">
                  <div>
                    <span class="dashboard-v2-label">Ventas del día</span>
                    <div class="dashboard-v2-total">{{ formatearMonedaDashboard(datosDelDia.venta) }}</div>
                  </div>
                  <div class="dashboard-v2-breakdown">
                    <div class="dashboard-v2-chip">
                      <span>Facturas</span>
                      <strong>{{ cantidadFacturasHoy }}</strong>
                    </div>
                    <div class="dashboard-v2-chip">
                      <span>Efectivo</span>
                      <strong>{{ formatearMonedaDashboard(datosDelDia.efectivo) }}</strong>
                    </div>
                    <div class="dashboard-v2-chip">
                      <span>Tarjeta</span>
                      <strong>{{ formatearMonedaDashboard(datosDelDia.tarjeta) }}</strong>
                    </div>
                    <div class="dashboard-v2-chip">
                      <span>Transferencia</span>
                      <strong>{{ formatearMonedaDashboard(datosDelDia.transferencia) }}</strong>
                    </div>
                  </div>
                </div>
              </article>

              <div class="dashboard-v2-kpis">
                <article class="dashboard-v2-kpi">
                  <span>Ganancias</span>
                  <strong>{{ formatearMonedaDashboard(datosDelDia.ganancia) }}</strong>
                  <small>Resultado neto del día</small>
                </article>
                <article class="dashboard-v2-kpi">
                  <span>Gastos del día</span>
                  <strong>{{ formatearMonedaDashboard(datosDelDia.gastos) }}</strong>
                  <small>Salidas operativas registradas</small>
                </article>
                <article class="dashboard-v2-kpi">
                  <span>Cuentas por cobrar</span>
                  <strong>{{ formatearMonedaDashboard(dashboardResumen.montoCuentasPorCobrar) }}</strong>
                  <small>{{ dashboardResumen.cuentasPorCobrar }} cuenta(s) pendientes</small>
                </article>
                <article class="dashboard-v2-kpi">
                  <span>Stock bajo</span>
                  <strong>{{ dashboardResumen.alertasStock }}</strong>
                  <small>Productos en alerta</small>
                </article>
              </div>
            </div>

            <TabView v-if="!botonesEnTarjeta" class="actions-tabview">
              <TabPanel>
                <template #header>
                  <span class="action-tab-header">
                    <i class="pi pi-bolt"></i>
                    <span>Inicio rapido</span>
                  </span>
                </template>
                <div class="action-tab-intro">
                  <h3>Operaciones principales</h3>
                  <p>Accesos de uso diario para vender, facturar y atender clientes.</p>
                </div>
                <div class="action-tab-grid action-tab-grid-primary">
                  <Button :label="$t('POS')" raised outlined severity="secondary" as="router-link" to="/pos" icon="pi icon-th" iconPos="top" />
                  <Button :label="$t('Sell').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/vender" icon="pi icon-basket" iconPos="top" />
                  <Button label="Asistente IA" raised severity="success" as="router-link" to="/asistente-ia" icon="pi pi-bolt" iconPos="top" />
                  <Button :label="$t('Clients')" raised outlined severity="secondary" as="router-link" to="/clientes" icon="pi icon-users" iconPos="top" />
                  <Button label="Rutas Publicas" raised outlined severity="info" icon="pi pi-globe" iconPos="top" @click="visibleRutasPublicas = true" />
                </div>
              </TabPanel>
                   <!-- Tabs organizados por categorías -->
                       <!-- TAB: Ventas y Clientes -->
                       <TabPanel>
                         <template #header>
                           <i class="pi pi-users" style="margin-right: 8px;"></i>
                           <span>Ventas</span>
                         </template>
                         <div class="action-tab-grid">
                           <Button label="Fidelización" raised outlined severity="warning" as="router-link" to="/fidelizacion" icon="pi pi-heart" iconPos="top" />
                           <Button :label="$t('Appointments')" raised outlined severity="secondary" as="router-link" to="/citas" icon="pi pi-calendar" iconPos="top" />
                           <Button :label="`${$t('Invoices')} (${cantidadFacturas})`" raised outlined severity="secondary" as="router-link" to="/facturas" icon="pi icon-doc" iconPos="top" />
                         </div>
                       </TabPanel>

                       <!-- TAB: Inventario -->
                       <TabPanel>
                         <template #header>
                           <i class="pi pi-box" style="margin-right: 8px;"></i>
                           <span>Inventario</span>
                         </template>
                         <div class="action-tab-grid">
                           <Button :label="`${$t('Products')} (${cantidadProductos})`" raised outlined severity="secondary" as="router-link" to="/productos" icon="pi icon-barcode" iconPos="top" />
                           <Button :label="$t('Modify Stock')" @click="visibleModificarStock = true" raised outlined severity="secondary" icon="pi icon-th" iconPos="top" />
                           <Button :label="$t('Inventory')" raised outlined severity="secondary" as="router-link" to="/inventario" icon="pi icon-file-pdf" iconPos="top" />
                           <Button label="Almacenes" raised outlined severity="success" as="router-link" to="/almacenes" icon="pi pi-building" iconPos="top" />
                           <Button label="Productos Dañados" raised outlined severity="danger" as="router-link" to="/productos-danados" icon="pi pi-exclamation-triangle" iconPos="top" />
                           <Button label="Refurbished" raised outlined severity="help" as="router-link" to="/refurbished" icon="pi pi-cog" iconPos="top" />
                           <Button label="Uso Interno" raised outlined severity="info" as="router-link" to="/productos-uso-interno" icon="pi pi-box" iconPos="top" />
                           <Button label="Piezas" raised outlined severity="help" as="router-link" to="/piezas" icon="pi pi-wrench" iconPos="top" v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'" />
                           <Button label="Imprimir Etiquetas" raised outlined severity="info" as="router-link" to="/etiquetas" icon="pi pi-tag" iconPos="top" />
                         </div>
                       </TabPanel>

                       <!-- TAB: Compras -->
                       <TabPanel>
                         <template #header>
                           <i class="pi pi-shopping-cart" style="margin-right: 8px;"></i>
                           <span>Compras</span>
                         </template>
                         <div class="action-tab-grid">
                           <Button :label="$t('Purchases')" raised outlined severity="secondary" as="router-link" to="/compras" icon="pi icon-shopping-basket" iconPos="top" />
                           <Button :label="$t('Expenses')" @click="visiblegastos = true" raised outlined severity="secondary" icon="pi icon-sort-alt-down" iconPos="top" />
                         </div>
                       </TabPanel>

                       <!-- TAB: Finanzas -->
                       <TabPanel>
                         <template #header>
                           <i class="pi pi-wallet" style="margin-right: 8px;"></i>
                           <span>Finanzas</span>
                         </template>
                         <div class="action-tab-grid">
                           <Button :label="$t('Cash Register').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/caja" icon="pi icon-inbox" iconPos="top" />
                           <Button :label="$t('View Balance')" @click="visibleCuadre = true" raised outlined severity="secondary" icon="pi icon-wallet" iconPos="top" />
                           <Button :label="$t('Bank')" raised outlined severity="secondary" as="router-link" to="/banco" icon="pi icon-bank" iconPos="top" />
                           <Button :label="$t('Accounting')" raised outlined severity="secondary" as="router-link" to="/contabilidad" icon="pi icon-wallet" iconPos="top" />
                           <Button :label="$t('Make Payments')" raised outlined severity="secondary" as="router-link" to="/graficos" icon="pi icon-money-2" iconPos="top" />
                           <Button :label="$t('Accounts Receivable')" raised outlined severity="secondary" as="router-link" to="/cuentas_cobrar" icon="pi icon-money" iconPos="top" />
                           <Button :label="$t('Accounts Payable')" raised outlined severity="secondary" as="router-link" to="/cuentasxpagar" icon="pi icon-money" iconPos="top" />
                           <Button :label="$t('Transactions').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/transacciones" icon="pi pi-arrow-right-arrow-left" iconPos="top" />
                           <Button :label="$t('Petty Cash').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/caja-chica" icon="pi pi-arrow-right-arrow-left" iconPos="top" />
                         </div>
                       </TabPanel>

                       <!-- TAB: Reportes -->
                       <TabPanel>
                         <template #header>
                           <i class="pi pi-chart-bar" style="margin-right: 8px;"></i>
                           <span>Reportes</span>
                         </template>
                         <div class="action-tab-grid">
                           <Button :label="$t('Information')" raised outlined severity="secondary" as="router-link" to="/informes" icon="pi icon-chart-bar" iconPos="top" />
                           <Button :label="$t('Reports')" raised outlined severity="secondary" as="router-link" to="/reportes" icon="pi icon-chart-bar" iconPos="top" />
                           <Button label="Reportes y Analítica" raised outlined severity="success" as="router-link" to="/reportes-analitica" icon="pi pi-chart-line" iconPos="top" />
                         </div>
                       </TabPanel>

                       <!-- TAB: Taller (solo para modo CELULAR) -->
                       <TabPanel v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'">
                         <template #header>
                           <i class="pi pi-mobile" style="margin-right: 8px;"></i>
                           <span>Taller</span>
                         </template>
                         <div class="action-tab-grid">
                           <Button :label="$t('Workshop')" raised outlined severity="secondary" as="router-link" to="/taller" icon="pi icon-tools" iconPos="top" />
                           <Button :label="$t('Receive Equipment').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/recibirequipo" icon="pi icon-mobile" iconPos="top" />
                           <Button label="IMEI" @click="visibleIMEI = true" raised outlined severity="secondary" icon="pi icon-search" iconPos="top" />
                           <Button label="Diagnostico iPhone" @click="cargarDiagnosticoIphone" raised outlined severity="info" icon="pi pi-mobile" iconPos="top" />
                           <Button :label="$t('Phone Check').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/phone_check" icon="pi pi-cog" iconPos="top" />
                           <Button label="PHONE X IMEI" raised outlined severity="secondary" as="router-link" to="/barcode" icon="pi icon-plus" iconPos="top" />
                         </div>
                       </TabPanel>

                       <!-- TAB: Restaurante (solo para modo RESTAURANTE) -->
                       <TabPanel v-if="datosDefault.modo === 'RESTAURANTE'">
                         <template #header>
                           <i class="pi pi-table" style="margin-right: 8px;"></i>
                           <span>Restaurante</span>
                         </template>
                         <div class="action-tab-grid">
                           <Button :label="$t('Tables')" raised outlined severity="secondary" as="router-link" to="/tutoriales" icon="pi icon-mesa" iconPos="top" />
                         </div>
                       </TabPanel>

                       <!-- TAB: Herramientas -->
                       <TabPanel>
                         <template #header>
                           <i class="pi pi-wrench" style="margin-right: 8px;"></i>
                           <span>Herramientas</span>
                         </template>
                         <div class="action-tab-grid">
                           <Button :label="$t('Print')" @click="visibleimprimirfactura = true" raised outlined severity="secondary" icon="pi icon-print" iconPos="top" />
                           <Button :label="$t('Send')" @click="showWhatsAppModal" raised outlined severity="secondary" icon="pi icon-whatsapp" iconPos="top" />
                           <Button :label="$t('Send')" @click="abrirModalCorreo" raised outlined severity="secondary" icon="pi icon-paper-plane" iconPos="top" />
                           <Button :label="$t('Barcode')" raised outlined severity="secondary" as="router-link" to="/barcode" icon="pi icon-barcode" iconPos="top" />
                           <Button :label="$t('Import/Export Excel')" raised outlined severity="secondary" as="router-link" to="/backupexcel" icon="pi icon-loop-outline" iconPos="top" />
                           <Button :label="$t('Configuration')" raised outlined severity="secondary" as="router-link" to="/configuracion" icon="pi icon-cog" iconPos="top" />
                           <Button :label="$t('Tutorials')" raised outlined severity="secondary" as="router-link" to="/tutoriales" icon="pi icon-video" iconPos="top" />
                         </div>
                       </TabPanel>
                     </TabView>

                     <div v-else class="actions-card-view">
                       <div class="actions-grid">
                         <Button :label="$t('POS')" raised outlined severity="secondary" as="router-link" to="/pos" icon="pi icon-th" iconPos="top" />
                         <Button :label="$t('Sell').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/vender" icon="pi icon-basket" iconPos="top" />
                         <Button label="Asistente IA" raised severity="success" as="router-link" to="/asistente-ia" icon="pi pi-bolt" iconPos="top" />
                         <Button :label="$t('Clients')" raised outlined severity="secondary" as="router-link" to="/clientes" icon="pi icon-users" iconPos="top" />
                         <Button label="Rutas Publicas" raised outlined severity="info" icon="pi pi-globe" iconPos="top" @click="visibleRutasPublicas = true" />
                         <Button label="Fidelizacion" raised outlined severity="warning" as="router-link" to="/fidelizacion" icon="pi pi-heart" iconPos="top" />
                         <Button :label="$t('Appointments')" raised outlined severity="secondary" as="router-link" to="/citas" icon="pi pi-calendar" iconPos="top" />
                         <Button :label="`${$t('Invoices')} (${cantidadFacturas})`" raised outlined severity="secondary" as="router-link" to="/facturas" icon="pi icon-doc" iconPos="top" />
                         <Button :label="`${$t('Products')} (${cantidadProductos})`" raised outlined severity="secondary" as="router-link" to="/productos" icon="pi icon-barcode" iconPos="top" />
                         <Button :label="$t('Modify Stock')" @click="visibleModificarStock = true" raised outlined severity="secondary" icon="pi icon-th" iconPos="top" />
                         <Button :label="$t('Inventory')" raised outlined severity="secondary" as="router-link" to="/inventario" icon="pi icon-file-pdf" iconPos="top" />
                         <Button label="Almacenes" raised outlined severity="success" as="router-link" to="/almacenes" icon="pi pi-building" iconPos="top" />
                         <Button label="Productos Danados" raised outlined severity="danger" as="router-link" to="/productos-danados" icon="pi pi-exclamation-triangle" iconPos="top" />
                         <Button label="Refurbished" raised outlined severity="help" as="router-link" to="/refurbished" icon="pi pi-cog" iconPos="top" />
                         <Button label="Uso Interno" raised outlined severity="info" as="router-link" to="/productos-uso-interno" icon="pi pi-box" iconPos="top" />
                         <Button label="Piezas" raised outlined severity="help" as="router-link" to="/piezas" icon="pi pi-wrench" iconPos="top" v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'" />
                         <Button label="Imprimir Etiquetas" raised outlined severity="info" as="router-link" to="/etiquetas" icon="pi pi-tag" iconPos="top" />
                         <Button :label="$t('Purchases')" raised outlined severity="secondary" as="router-link" to="/compras" icon="pi icon-shopping-basket" iconPos="top" />
                         <Button :label="$t('Expenses')" @click="visiblegastos = true" raised outlined severity="secondary" icon="pi icon-sort-alt-down" iconPos="top" />
                         <Button :label="$t('Cash Register').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/caja" icon="pi icon-inbox" iconPos="top" />
                         <Button :label="$t('View Balance')" @click="visibleCuadre = true" raised outlined severity="secondary" icon="pi icon-wallet" iconPos="top" />
                         <Button :label="$t('Bank')" raised outlined severity="secondary" as="router-link" to="/banco" icon="pi icon-bank" iconPos="top" />
                         <Button :label="$t('Accounting')" raised outlined severity="secondary" as="router-link" to="/contabilidad" icon="pi icon-wallet" iconPos="top" />
                         <Button :label="$t('Make Payments')" raised outlined severity="secondary" as="router-link" to="/graficos" icon="pi icon-money-2" iconPos="top" />
                         <Button :label="$t('Accounts Receivable')" raised outlined severity="secondary" as="router-link" to="/cuentas_cobrar" icon="pi icon-money" iconPos="top" />
                         <Button :label="$t('Accounts Payable')" raised outlined severity="secondary" as="router-link" to="/cuentasxpagar" icon="pi icon-money" iconPos="top" />
                         <Button :label="$t('Transactions').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/transacciones" icon="pi pi-arrow-right-arrow-left" iconPos="top" />
                         <Button :label="$t('Petty Cash').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/caja-chica" icon="pi pi-arrow-right-arrow-left" iconPos="top" />
                         <Button :label="$t('Information')" raised outlined severity="secondary" as="router-link" to="/informes" icon="pi icon-chart-bar" iconPos="top" />
                         <Button :label="$t('Reports')" raised outlined severity="secondary" as="router-link" to="/reportes" icon="pi icon-chart-bar" iconPos="top" />
                         <Button label="Reportes y Analitica" raised outlined severity="success" as="router-link" to="/reportes-analitica" icon="pi pi-chart-line" iconPos="top" />
                         <Button :label="$t('Workshop')" raised outlined severity="secondary" as="router-link" to="/taller" icon="pi icon-tools" iconPos="top" v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'" />
                         <Button :label="$t('Receive Equipment').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/recibirequipo" icon="pi icon-mobile" iconPos="top" v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'" />
                         <Button label="IMEI" @click="visibleIMEI = true" raised outlined severity="secondary" icon="pi icon-search" iconPos="top" v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'" />
                         <Button label="Diagnostico iPhone" @click="cargarDiagnosticoIphone" raised outlined severity="info" icon="pi pi-mobile" iconPos="top" v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'" />
                         <Button :label="$t('Phone Check').toUpperCase()" raised outlined severity="secondary" as="router-link" to="/phone_check" icon="pi pi-cog" iconPos="top" v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'" />
                         <Button label="PHONE X IMEI" raised outlined severity="secondary" as="router-link" to="/barcode" icon="pi icon-plus" iconPos="top" v-if="datosDefault.modo === 'CELULAR' || datosDefault.modo === 'FULL'" />
                         <Button :label="$t('Tables')" raised outlined severity="secondary" as="router-link" to="/tutoriales" icon="pi icon-mesa" iconPos="top" v-if="datosDefault.modo === 'RESTAURANTE'" />
                         <Button :label="$t('Print')" @click="visibleimprimirfactura = true" raised outlined severity="secondary" icon="pi icon-print" iconPos="top" />
                         <Button :label="$t('Send')" @click="showWhatsAppModal" raised outlined severity="secondary" icon="pi icon-whatsapp" iconPos="top" />
                         <Button :label="$t('Send')" @click="abrirModalCorreo" raised outlined severity="secondary" icon="pi icon-paper-plane" iconPos="top" />
                         <Button :label="$t('Barcode')" raised outlined severity="secondary" as="router-link" to="/barcode" icon="pi icon-barcode" iconPos="top" />
                         <Button :label="$t('Import/Export Excel')" raised outlined severity="secondary" as="router-link" to="/backupexcel" icon="pi icon-loop-outline" iconPos="top" />
                         <Button :label="$t('Configuration')" raised outlined severity="secondary" as="router-link" to="/configuracion" icon="pi icon-cog" iconPos="top" />
                         <Button :label="$t('Tutorials')" raised outlined severity="secondary" as="router-link" to="/tutoriales" icon="pi icon-video" iconPos="top" />
                       </div>
                     </div>
 
            </div>

          <section v-if="mostrarDashboardDetalle" class="dashboard-v2">
            <div v-if="false" class="dashboard-v2-top">
              <article class="dashboard-v2-hero">
                <div class="dashboard-v2-hero-head">
                  <div>
                    <span class="dashboard-v2-eyebrow">Resumen ejecutivo</span>
                    <h2>Control diario del negocio</h2>
                    <p>Información financiera y operativa para tomar decisiones desde el primer vistazo.</p>
                  </div>
                  <div class="dashboard-v2-status" :class="dashboardResumen.cajaAbierta ? 'is-open' : 'is-closed'">
                    <span>Caja</span>
                    <strong>{{ dashboardResumen.cajaEstado }}</strong>
                  </div>
                </div>

                <div class="dashboard-v2-total-wrap">
                  <div>
                    <span class="dashboard-v2-label">Ventas del día</span>
                    <div class="dashboard-v2-total">{{ formatearMonedaDashboard(datosDelDia.venta) }}</div>
                    <div class="dashboard-v2-hero-metrics">
                      <div class="dashboard-v2-chip">
                        <span>Facturas</span>
                        <strong>{{ cantidadFacturasHoy }}</strong>
                      </div>
                      <div class="dashboard-v2-chip">
                        <span>Utilidad neta</span>
                        <strong>{{ formatearMonedaDashboard(dashboardUtilidadNeta) }}</strong>
                      </div>
                    </div>
                  </div>

                  <div class="dashboard-v2-chart-card">
                    <div class="dashboard-v2-chart-head">
                      <span>Mix de ingresos</span>
                    </div>
                    <Chart
                      v-if="dashboardMetodosPagoChart && dashboardMetodosPagoOptions"
                      type="doughnut"
                      :data="dashboardMetodosPagoChart"
                      :options="dashboardMetodosPagoOptions"
                      class="dashboard-v2-chart dashboard-v2-chart-donut"
                    />
                  </div>
                </div>
              </article>

              <div class="dashboard-v2-kpis">
                <article class="dashboard-v2-kpi">
                  <span>Ganancias</span>
                  <strong>{{ formatearMonedaDashboard(datosDelDia.ganancia) }}</strong>
                  <small>Resultado neto del día</small>
                </article>
                <article class="dashboard-v2-kpi">
                  <span>Gastos del día</span>
                  <strong>{{ formatearMonedaDashboard(datosDelDia.gastos) }}</strong>
                  <small>Salidas operativas registradas</small>
                </article>
                <article class="dashboard-v2-kpi">
                  <span>Cuentas por cobrar</span>
                  <strong>{{ formatearMonedaDashboard(dashboardResumen.montoCuentasPorCobrar) }}</strong>
                  <small>{{ dashboardResumen.cuentasPorCobrar }} cuenta(s) pendientes</small>
                </article>
                <article class="dashboard-v2-kpi">
                  <span>Stock bajo</span>
                  <strong>{{ dashboardResumen.alertasStock }}</strong>
                  <small>Productos en alerta</small>
                </article>
              </div>
            </div>

            <div v-if="false" class="dashboard-v2-analytics">
              <article class="dashboard-v2-panel dashboard-v2-panel-analytics">
                <div class="dashboard-v2-panel-head">
                  <div>
                    <span class="dashboard-v2-section">Análisis financiero</span>
                    <h3>Ventas, ganancias, gastos y cuentas por cobrar</h3>
                  </div>
                  <span class="dashboard-v2-pill">Hoy</span>
                </div>

                <Chart
                  v-if="dashboardResumenFinancieroChart && dashboardResumenFinancieroOptions"
                  type="bar"
                  :data="dashboardResumenFinancieroChart"
                  :options="dashboardResumenFinancieroOptions"
                  class="dashboard-v2-chart dashboard-v2-chart-bar"
                />
              </article>
            </div>


            <div class="dashboard-v2-grid">
              <article v-if="mostrarTopProductos" class="dashboard-v2-panel dashboard-v2-panel-wide">
                <div class="dashboard-v2-panel-head">
                  <div>
                    <span class="dashboard-v2-section">Comercial</span>
                    <h3>Productos más vendidos</h3>
                  </div>
                  <span class="dashboard-v2-pill">Top 5</span>
                </div>

                <div v-if="dashboardTopProductos.length" class="dashboard-v2-table">
                  <div class="dashboard-v2-row dashboard-v2-row-head">
                    <span>Rank</span>
                    <span>Producto</span>
                    <span>Unidades</span>
                    <span>Total</span>
                  </div>
                  <div
                    v-for="(producto, index) in dashboardTopProductos"
                    :key="`${producto.nombre}-${index}`"
                    class="dashboard-v2-row"
                  >
                    <span class="dashboard-v2-rank">#{{ index + 1 }}</span>
                    <div class="dashboard-v2-product-cell">
                      <strong>{{ producto.nombre }}</strong>
                      <div class="dashboard-v2-product-bar">
                        <span :style="{ width: obtenerAnchoTopProducto(producto.cantidad) }"></span>
                      </div>
                    </div>
                    <span>{{ producto.cantidad }}</span>
                    <span>{{ formatearMonedaDashboard(producto.total) }}</span>
                  </div>
                </div>
                <div v-else class="dashboard-v2-empty">No hay ventas registradas para hoy.</div>
              </article>

              <article v-if="mostrarPanelTaller" class="dashboard-v2-panel">
                <div class="dashboard-v2-panel-head">
                  <div>
                    <span class="dashboard-v2-section">Servicio técnico</span>
                    <h3>Taller y garantías</h3>
                  </div>
                  <span class="dashboard-v2-pill">Seguimiento</span>
                </div>

                <div class="dashboard-v2-metrics">
                  <div class="dashboard-v2-metric">
                    <span>Reparaciones pendientes</span>
                    <strong>{{ dashboardResumen.reparacionesPendientes }}</strong>
                  </div>
                  <div class="dashboard-v2-metric">
                    <span>Entregados</span>
                    <strong>{{ dashboardResumen.equiposEntregados }}</strong>
                  </div>
                  <div class="dashboard-v2-metric">
                    <span>No entregados</span>
                    <strong>{{ dashboardResumen.equiposNoEntregados }}</strong>
                  </div>
                  <div class="dashboard-v2-metric">
                    <span>En garantía</span>
                    <strong>{{ dashboardResumen.equiposGarantia }}</strong>
                  </div>
                </div>

                <div v-if="dashboardPendientesTaller.length" class="dashboard-v2-list">
                  <div
                    v-for="equipo in dashboardPendientesTaller"
                    :key="equipo.id"
                    class="dashboard-v2-list-item"
                  >
                    <div>
                      <strong>{{ equipo.nombre || equipo.equipo || 'Equipo sin nombre' }}</strong>
                      <small>{{ equipo.marca }} {{ equipo.modelo }}</small>
                    </div>
                    <span>{{ equipo.estado || 'Pendiente' }}</span>
                  </div>
                </div>
                <div v-else class="dashboard-v2-empty">No hay equipos pendientes en taller.</div>
              </article>

              <article v-if="mostrarPanelCobranza" class="dashboard-v2-panel">
                <div class="dashboard-v2-panel-head">
                  <div>
                    <span class="dashboard-v2-section">Cobranza</span>
                    <h3>Cuentas por cobrar</h3>
                  </div>
                  <span class="dashboard-v2-pill">{{ dashboardResumen.cuentasPorCobrar }} abiertas</span>
                </div>
                <div class="dashboard-v2-highlight">{{ formatearMonedaDashboard(dashboardResumen.montoCuentasPorCobrar) }}</div>
                <div class="dashboard-v2-metrics dashboard-v2-metrics-two">
                  <div class="dashboard-v2-metric">
                    <span>Cuentas activas</span>
                    <strong>{{ dashboardResumen.cuentasPorCobrar }}</strong>
                  </div>
                  <div class="dashboard-v2-metric">
                    <span>Promedio por cuenta</span>
                    <strong>{{ formatearMonedaDashboard(dashboardPromedioCuentaCobrar) }}</strong>
                  </div>
                </div>
                <p class="dashboard-v2-copy">Saldo consolidado pendiente del almacén actual.</p>
              </article>

              <article v-if="mostrarPanelInventario" class="dashboard-v2-panel dashboard-v2-panel-inventory">
                <div class="dashboard-v2-panel-head">
                  <div>
                    <span class="dashboard-v2-section">Inventario</span>
                    <h3>Alertas de stock bajo</h3>
                  </div>
                  <span class="dashboard-v2-pill">{{ dashboardResumen.alertasStock }} críticos</span>
                </div>
                <div v-if="dashboardAlertasStock.length" class="dashboard-v2-table dashboard-v2-table-inventory">
                  <div class="dashboard-v2-row dashboard-v2-row-head dashboard-v2-row-inventory">
                    <span>Producto</span>
                    <span>Stock actual</span>
                    <span>Nivel alerta</span>
                    <span>Diferencia</span>
                  </div>
                  <div
                    v-for="producto in dashboardAlertasStock"
                    :key="producto.id"
                    class="dashboard-v2-row dashboard-v2-row-inventory"
                  >
                    <strong>{{ producto.nombre }}</strong>
                    <span>{{ producto.stock || 0 }}</span>
                    <span>{{ producto.alerta || 0 }}</span>
                    <span>{{ Number(producto.stock || 0) - Number(producto.alerta || 0) }}</span>
                  </div>
                </div>
                <div v-else class="dashboard-v2-empty">No hay productos con stock bajo.</div>
              </article>
            </div>
          </section>

          <!-- Data Tables Section -->
          <div v-if="mostrarInfoSistema" class="tables-section">
            <div class="section-header">
              <div class="section-icon-wrapper">
                <i class="pi pi-database"></i>
              </div>
              <div>
                <h2 class="section-title">{{ $t('System Information') }}</h2>
                <p class="section-subtitle">{{ $t('Consult and manage your data') }}</p>
              </div>
            </div>

            <div class="modern-card">
              <TabView class="modern-tabview">
                  <TabPanel :header="$t('Invoices')">
                    <DataTable
                      :value="dataFacturas"
                      scrollable
                      scrollHeight="600px"
                      dataKey="id"
                      paginator
                      :rows="10"
                      selectionMode="single"
                      :rowsPerPageOptions="[5, 10, 20, 50]"
                      tableStyle="min-width: 50rem"
                    >
                      <Column :header="$t('Options')">
                        <template #body="slotProps">
                          <Button
                            icon="pi pi-cog"
                            @click="toggleFacturas($event, slotProps.data)"
                            aria-haspopup="true"
                            aria-controls="overlay_menu_factura"
                          />
                          <Menu
                            ref="menu"
                            id="overlay_menu_factura"
                            :model="itemsFacturas"
                            :popup="true"
                          />
                        </template>
                      </Column>
                      <Column field="no_factura" :header="$t('No')"></Column>
                      <Column field="nombre_cliente" :header="$t('Client')"></Column>
                      <Column field="telefono_cliente" :header="$t('Customer Phone')"></Column>
                      <Column field="vendedor" :header="$t('Seller')"></Column>
                      <Column field="fecha_emision" :header="$t('Issue Date')"></Column>
                      <Column field="hora" :header="$t('Time')"></Column>
                      <Column field="total" :header="$t('Total')"></Column>
                    </DataTable>
                  </TabPanel>

                  <TabPanel :header="$t('Purchases')">
                    <!-- <DataTable :options="options"  :data="dataCompras" class="display table dt-responsive" id="tablaCompras" /> -->
                  </TabPanel>

                  <TabPanel :header="$t('Quotes')">
                    <DataTable
                      :value="dataCotizaciones"
                      scrollable
                      scrollHeight="600px"
                      dataKey="id"
                      paginator
                      :rows="10"
                      selectionMode="single"
                      :rowsPerPageOptions="[5, 10, 20, 50]"
                      tableStyle="min-width: 50rem"
                    >
                      <Column :header="$t('Options')">
                        <template #body="slotProps">
                          <Button
                            icon="pi pi-cog"
                            @click="toggleCotizacion($event, slotProps.data)"
                            aria-haspopup="true"
                            aria-controls="overlay_menu"
                          />
                          <Menu
                            ref="menu"
                            id="overlay_menu"
                            :model="itemsCotizacion"
                            :popup="true"
                          />
                        </template>
                      </Column>
                      <Column field="no_cotizacion" :header="$t('No')"></Column>
                      <Column field="nombre_cliente" :header="$t('Client')"></Column>
                      <Column field="rnc_cliente" :header="$t('RNC Customer')"></Column>
                      <Column field="nombre_comercial" :header="$t('Trade Name')"></Column>
                      <Column field="fecha_emision" :header="$t('Issue Date')"></Column>
                      <Column field="hora" :header="$t('Time')"></Column>
                      <Column field="vencimiento" :header="$t('Expiration')"></Column>
                      <Column field="total" :header="$t('Total')"></Column>
                    </DataTable>
                  </TabPanel>

                  <TabPanel :header="$t('Stock Alert')">
                    <DataTable
                      :value="productosSinStock"
                      scrollable
                      scrollHeight="600px"
                      dataKey="id"
                      paginator
                      :rows="10"
                      selectionMode="single"
                      :rowsPerPageOptions="[5, 10, 20, 50]"
                      tableStyle="min-width: 50rem"
                      :rowClass="getRowClass"
                    >
                      <Column field="codigo" :header="$t('Cod')"></Column>
                      <Column field="nombre" :header="$t('Product')"></Column>
                      <Column field="categoria" :header="$t('Category')"></Column>
                      <Column field="precio_compra" :header="$t('Cost')"></Column>
                      <Column field="precio_venta" :header="$t('Sale Price')"></Column>
                      <Column field="empaque" :header="$t('Package')"></Column>
                      <Column field="stock" :header="$t('Stock')"></Column>
                    </DataTable>
                  </TabPanel>

                  <TabPanel :header="$t('Expired Products')">
                    <!-- <DataTable :options="options"  :data="dataVencidos" class="display table dt-responsive" id="tablaVencidos" /> -->
                  </TabPanel>
                </TabView>
            </div>
          </div>

        </div>
      </div>
  </main>

  <!-- Modals -->
  <Dialog
    v-model:visible="visibleRutasPublicas"
    modal
    header="Rutas Publicas"
    :style="{ width: '54rem' }"
    :breakpoints="{ '960px': '92vw', '640px': '96vw' }"
  >
    <div class="public-routes-dialog">
      <p class="public-routes-copy">
        Accesos disponibles sin pasar por el login.
      </p>

      <div class="public-routes-grid">
        <div
          v-for="ruta in rutasPublicas"
          :key="ruta.path"
          class="public-route-item"
        >
          <Button
            :label="ruta.label"
            :icon="ruta.icon"
            iconPos="top"
            outlined
            severity="secondary"
            as="router-link"
            :to="ruta.path"
            @click="visibleRutasPublicas = false"
          />
          <span class="public-route-url">{{ obtenerUrlCompletaRutaPublica(ruta.path) }}</span>
          <Button
            label="WhatsApp"
            icon="pi pi-whatsapp"
            severity="success"
            size="small"
            outlined
            @click="compartirRutaPublicaWhatsApp(ruta)"
          />
        </div>
      </div>
    </div>
  </Dialog>

   <Dialog
    v-model:visible="visiblegastos"
    modal
    :header="$t('Expenses')"
    :style="{ width: '50rem' }"
    :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
  >
    <!-- Header personalizado -->
    <template #header>
      <div class="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <i class="pi pi-wallet text-blue-500"></i>
        <span>{{ $t('Expense Registration') }}</span>
      </div>
    </template>

    <!-- Contenido -->
    <Fieldset :legend="$t('Expense data')" class="p-4 border rounded-lg shadow-sm">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Cantidad -->
        <div>
          <label for="cantidadAgregarDatos" class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('Amount') }}
          </label>
          <InputText
            id="cantidadAgregarDatos"
            v-model="camposGastos.cantidad"
            v-solonumeros
            v-numeroFocusinOut
            v-decimales
            :placeholder="$t('Ex: 2500.00')"
            class="w-full"
          />
        </div>

        <!-- Fecha -->
        <div>
          <label for="fechaAgregarDatos" class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('Date') }}
          </label>
          <InputText
            id="fechaAgregarDatos"
            v-model="camposGastos.fecha"
            :placeholder="$t('dd/mm/yyyy')"
            class="w-full"
          />
        </div>

        <!-- Hora -->
        <div>
          <label for="horaAgregarDatos" class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('Time') }}
          </label>
          <InputText
            id="horaAgregarDatos"
            v-model="camposGastos.hora"
            :placeholder="$t('hh:mm am/pm')"
            class="w-full"
          />
        </div>

        <!-- Método -->
        <div>
          <label for="metodoAgregarDatos" class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('Method') }}
          </label>
          <Dropdown
            id="metodoAgregarDatos"
            v-model="camposGastos.metodo"
            :options="['EFECTIVO', 'TRANSFERENCIA']"
            :placeholder="$t('Select method')"
            class="w-full"
          />
        </div>

        <!-- Descripción -->
        <div class="col-span-full">
          <label for="descripcionAgregarDatos" class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('Description') }}
          </label>
          <Textarea
            id="descripcionAgregarDatos"
            v-model="camposGastos.descripcion"
            autoResize
            rows="3"
            :placeholder="$t('Expense detail')"
            class="w-full"
          />
        </div>
      </div>
    </Fieldset>

    <div v-if="camposGastos.metodo === 'TRANSFERENCIA'" class="mt-4">
      <label for="bancoGasto" class="block text-sm font-medium text-gray-700 mb-1">
        Banco
      </label>
      <select id="bancoGasto" v-model="cuentaBancaria" class="w-full border rounded p-2">
        <option :value="null" disabled>Seleccione un banco</option>
        <option :value="banco" v-for="banco in bancoArray" :key="banco.id">{{ banco.nombre }}</option>
      </select>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex justify-between gap-3 w-full">
        <Button
          :label="$t('All Expenses')"
          icon="pi pi-list"
          outlined
          severity="info"
          @click="visiblegastos = false; router.push('/gastos')"
        />
        <div class="flex justify-end gap-3">
        <Button
          :label="`🧾 ${$t('Last')}`"
          icon="pi pi-print"
          outlined
          @click="imprimirUltimoGasto"
          class="!text-blue-600 hover:!bg-blue-50"
        />
        <Button
          :label="guardandoGasto ? $t('Saving...') : $t('Add Expense')"
          icon="pi pi-plus"
          outlined
          severity="success"
          :loading="guardandoGasto"
          :disabled="guardandoGasto"
          @click="agregarGasto"
        />
        <Button
          :label="$t('Close')"
          icon="pi pi-times"
          text
          severity="secondary"
          :disabled="guardandoGasto"
          @click="visiblegastos = false"
        />
        </div>
      </div>
    </template>
  </Dialog>
  <!-- Otros modals omiten por brevedad -->
  <Dialog v-model:visible="visibleimprimirfactura" modal :position="position" :header="$t('Print Invoice')" :style="{ width: '40rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">{{ $t('Print Invoice') }}</span>
    </div>
  </template>

      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">{{ $t('Print') }}</legend>
          <div class="grid grid-cols-12 gap-4">
            <div class="form-group col-span-6 md:col-span-4">
            <label for="ingresenumeroModifcarfactura">{{ $t('Enter Invoice #') }}</label>
              <InputGroup>
              <Dropdown v-model="campoFactura" @change="facturaSeleccionada" filter editable :options="dataFacturas" optionLabel="no_factura" :placeholder="$t('Select an Invoice')" class="w-full md:w-14rem" />
                <Button icon="pi pi-sync" @click="recargarFacturas" severity="success" />
            </InputGroup>
            </div>

            <div class="form-group col-span-6 md:col-span-8">
            <label for="elegirimpresora">{{ $t('Choose Printer') }}</label>

            <SelectButton v-model="impresoraSeleccionada" :options="['Impresora Normal','Impresora Ticket']" aria-labelledby="basic" :allowEmpty="false" />



            </div>

           <div class="col-span-12 md:col-span-12 form-group">
            <label for="elegircliente">{{ $t('Customer Name') }}</label><br>
            <InputText type="text" name="cliente" id="elegircliente" fluid v-model="campoNombreFactura" class="form-control" readonly />

           </div>




          </div>
      </fieldset>

  <template #footer>
    <Button :label="$t('Cancel')" text severity="secondary" @click="visibleimprimirfactura = false" autofocus />
    <Button :label="$t('Print')" outlined severity="secondary" @click="imprimirFactura" autofocus />
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleCuadre" modal :position="position" :header="$t('Balance')" :style="{ width: '40rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">{{ $t('Balance') }}</span>
    </div>
  </template>

      <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 mb-3">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('Balance Type') }}</label>
            <div class="mt-2">
              <SelectButton
                v-model="modoCuadre"
                @change="onModoCuadreChange"
                :options="['COMPLETO', 'USUARIO']"
                :allowEmpty="false"
                aria-labelledby="modo-cuadre"
              />
            </div>
          </div>

          <div class="col-span-12 md:col-span-6">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('Date') }}</label>
            <Calendar v-model="fechaHoy" @change="turnoFechaCambio" dateFormat="dd/mm/yy" class="w-full mt-2" />
          </div>

          <div class="col-span-12 md:col-span-6" v-if="modoCuadre === 'USUARIO'">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('Users') }}</label>
            <Dropdown
              v-model="usuarioHoy"
              @change="usuarioSeleccionado"
              filter
              editable
              :options="datosUsuarios"
              optionLabel="nombre"
              :placeholder="$t('Select user')"
              class="w-full mt-2"
            />
          </div>

          <div class="col-span-12" v-if="modoCuadre === 'COMPLETO'">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('Shifts') }}</label>
            <select name="turno" @change="cambioTuno" class="form-control mt-2" v-model="usuarioTuno">
              <option :value="turno.turno" v-for="turno in turnosXfecha" :key="turno.id || turno.turno">{{turno.turno}}</option>
            </select>
          </div>

          <div class="col-span-12 md:col-span-4" v-if="modoCuadre === 'COMPLETO'">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('Start Time') }}</label>
            <InputText type="text" class="w-full mt-2" v-model="turnoHoraInicio" readonly />
          </div>

          <div class="col-span-12 md:col-span-4" v-if="modoCuadre === 'COMPLETO'">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('End Time') }}</label>
            <InputText type="text" class="w-full mt-2" v-model="turnoHoraFin" readonly />
          </div>

          <div class="col-span-12 md:col-span-4" v-if="modoCuadre === 'COMPLETO'">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t('Shift') }}</label>
            <select name="turno-seleccionado" @change="cambioTurnoSelected" class="form-control mt-2" v-model="turnoUsuarioSelected">
              <option value="COMPLETO">{{ $t('COMPLETE') }}</option>
              <option :value="turno.turno" v-for="turno in turnosXfecha" :key="`sel-${turno.id || turno.turno}`">{{turno.turno}}</option>
            </select>
          </div>

          <div class="col-span-12">
            <div class="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
              Registros encontrados: <b>{{ turnosXfecha.length }}</b>
            </div>
          </div>

          <div class="col-span-12" v-if="turnosXfecha.length > 0">
            <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Detalle de registros del dia
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <tr>
                      <th class="text-left px-3 py-2">Turno</th>
                      <th class="text-left px-3 py-2">Usuario</th>
                      <th class="text-left px-3 py-2">Apertura</th>
                      <th class="text-left px-3 py-2">Cierre</th>
                      <th class="text-left px-3 py-2">Estado</th>
                      <th class="text-right px-3 py-2">Inicio Caja</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="turno in turnosXfecha"
                      :key="`detalle-${turno.id || turno.turno || turno.username}`"
                      class="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td class="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{{ turno.turno || 'N/A' }}</td>
                      <td class="px-3 py-2 text-slate-600 dark:text-slate-300">{{ turno.username || turno.usuario || 'N/A' }}</td>
                      <td class="px-3 py-2 text-slate-600 dark:text-slate-300">{{ (turno.created_at || '').split(' ')[1] || turno.hora_apertura || 'N/A' }}</td>
                      <td class="px-3 py-2 text-slate-600 dark:text-slate-300">{{ (turno.updated_at || '').split(' ')[1] || turno.hora_cierre || 'N/A' }}</td>
                      <td class="px-3 py-2">
                        <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                          :class="String(turno.estado || '').toUpperCase() === 'ABIERTO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'"
                        >
                          {{ turno.estado || 'N/A' }}
                        </span>
                      </td>
                      <td class="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">{{ datosConfiguracion.simbolo || 'RD$' }}{{ decimales(Number(turno.cant_inicio || 0)) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="col-span-12" v-if="turnosXfecha.length === 0">
            <div class="rounded-lg bg-amber-50 text-amber-700 px-3 py-2 text-sm">
              No hay registros en registrocaja para la fecha/filtro seleccionado.
            </div>
          </div>
        </div>
      </div>

  <template #footer>
    <Button :label="$t('View')" text severity="secondary" @click="fnVerCuadre" :disabled="turnosXfecha.length === 0" />
    <Button :label="$t('Cancel')" text severity="secondary" @click="visibleCuadre = false"  />
    <Button :label="$t('Print')" outlined severity="secondary" @click="imprimirCuadre" :disabled="turnosXfecha.length === 0" />
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog
  v-model:visible="visibleModificarStock"
  modal
  :position="position"
  :style="{ width: '75rem' }"
  class="modificar-stock-dialog"
>
  <template #header>
    <div class="flex items-center gap-4 w-full p-2">
      <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
        <i class="pi pi-box text-3xl text-white"></i>
      </div>
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 m-0">{{ $t('Stock Management') }}</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 m-0 mt-1">{{ $t('Modify inventory and product prices') }}</p>
      </div>
    </div>
  </template>

  <div class="modificar-stock-content">
    <!-- Búsqueda de Producto -->
    <Panel :header="$t('Search Product')" class="mb-4 search-panel">
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-search text-xl text-blue-600"></i>
          <span class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('Search Product') }}</span>
        </div>
      </template>

      <div class="flex items-center gap-3 p-2">
        <i class="pi pi-box text-gray-400 text-xl"></i>
        <awesomplete
          class="flex-1 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          v-model="productoBuscado.nombre"
          @change="fnAwesomplete"
          @selectComplete="handleSelectComplete"
          :list="listaBuscador"
          :placeholder="$t('Type product name...')"
        />
      </div>
    </Panel>

    <!-- Información del Producto -->
    <Panel :header="$t('Product Information')" class="mb-4 info-panel" toggleable>
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-info-circle text-xl text-indigo-600"></i>
          <span class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('Product Information') }}</span>
        </div>
      </template>

      <div class="grid grid-cols-12 gap-4">
        <!-- Stock Actual -->
        <div class="col-span-12 md:col-span-4">
          <FloatLabel>
            <InputText
              id="stockProducto"
              v-model="productoBuscado.stock"
              readonly
              class="w-full p-inputtext-lg border-2 bg-gray-50 dark:bg-gray-700"
            />
            <label for="stockProducto">
              <i class="pi pi-database text-blue-600 mr-2"></i>
              {{ $t('Current Stock') }}
            </label>
          </FloatLabel>
        </div>

        <!-- Precio Compra -->
        <div class="col-span-12 md:col-span-4">
          <FloatLabel>
            <InputText
              id="preciocompraProducto"
              v-model="productoBuscado.precio_compra"
              readonly
              class="w-full p-inputtext-lg border-2 bg-gray-50 dark:bg-gray-700"
            />
            <label for="preciocompraProducto">
              <i class="pi pi-dollar text-green-600 mr-2"></i>
              {{ $t('Purchase Price') }}
            </label>
          </FloatLabel>
        </div>

        <!-- Ganancia -->
        <div class="col-span-12 md:col-span-4">
          <FloatLabel>
            <InputText
              id="gananciaProducto"
              v-model="productoBuscado.ganancia"
              readonly
              class="w-full p-inputtext-lg border-2 bg-gray-50 dark:bg-gray-700"
            />
            <label for="gananciaProducto">
              <i class="pi pi-chart-line text-emerald-600 mr-2"></i>
              {{ $t('Profit') }}
            </label>
          </FloatLabel>
        </div>
      </div>
    </Panel>

    <!-- Precios -->
    <Panel :header="$t('Price Management')" class="mb-4 prices-panel" toggleable>
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-money-bill text-xl text-green-600"></i>
          <span class="font-semibold text-gray-800 dark:text-gray-100">{{ $t('Price Management') }}</span>
        </div>
      </template>

      <div class="grid grid-cols-12 gap-4">
        <!-- Impuesto -->
        <div class="col-span-12 md:col-span-3">
          <FloatLabel>
            <InputText
              id="impuestoProducto"
              v-model="productoBuscado.impuesto"
              readonly
              class="w-full p-inputtext-lg border-2 bg-gray-50 dark:bg-gray-700"
            />
            <label for="impuestoProducto">
              <i class="pi pi-percentage text-orange-600 mr-2"></i>
              {{ $t('Tax') }}
            </label>
          </FloatLabel>
        </div>

        <!-- Precio Venta -->
        <div class="col-span-12 md:col-span-3">
          <FloatLabel>
            <InputText
              id="precioventaProducto"
              v-model="productoBuscado.precio_venta"
              readonly
              class="w-full p-inputtext-lg border-2 bg-gray-50 dark:bg-gray-700"
            />
            <label for="precioventaProducto">
              <i class="pi pi-tag text-blue-600 mr-2"></i>
              {{ $t('Sale Price') }}
            </label>
          </FloatLabel>
        </div>

        <!-- Precio Mínimo -->
        <div class="col-span-12 md:col-span-3">
          <FloatLabel>
            <InputText
              id="preciominimoProducto"
              v-model="productoBuscado.precio_min"
              readonly
              class="w-full p-inputtext-lg border-2 bg-gray-50 dark:bg-gray-700"
            />
            <label for="preciominimoProducto">
              <i class="pi pi-arrow-down text-red-600 mr-2"></i>
              {{ $t('Minimum Price') }}
            </label>
          </FloatLabel>
        </div>

        <!-- Precio por Mayor -->
        <div class="col-span-12 md:col-span-3">
          <FloatLabel>
            <InputText
              id="xmayorProducto"
              v-model="productoBuscado.precio_xmayor"
              readonly
              class="w-full p-inputtext-lg border-2 bg-gray-50 dark:bg-gray-700"
            />
            <label for="xmayorProducto">
              <i class="pi pi-shopping-cart text-purple-600 mr-2"></i>
              {{ $t('Wholesale') }}
            </label>
          </FloatLabel>
        </div>

        <!-- Impuesto Venta -->
        <div class="col-span-12 md:col-span-6">
          <FloatLabel>
            <InputText
              id="impuestoventaProducto"
              v-model="productoBuscado.impuesto_venta"
              readonly
              class="w-full p-inputtext-lg border-2 bg-gray-50 dark:bg-gray-700"
            />
            <label for="impuestoventaProducto">
              <i class="pi pi-percentage text-amber-600 mr-2"></i>
              {{ $t('Sales Tax') }}
            </label>
          </FloatLabel>
        </div>

        <!-- Precio Final -->
        <div class="col-span-12 md:col-span-6">
          <FloatLabel>
            <InputText
              id="preciofinalProducto"
              v-model="productoBuscado.precio_final"
              readonly
              class="w-full p-inputtext-lg border-2 bg-blue-100 dark:bg-blue-900 font-bold text-blue-700 dark:text-blue-200"
            />
            <label for="preciofinalProducto">
              <i class="pi pi-dollar text-blue-700 mr-2"></i>
              Precio Final
            </label>
          </FloatLabel>
        </div>
      </div>
    </Panel>

    <!-- IMEI / Modificar Stock -->
    <Panel v-if="imeiShow || !imeiShow" header="Acciones" class="actions-panel" toggleable>
      <template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-cog text-xl text-purple-600"></i>
          <span class="font-semibold text-gray-800 dark:text-gray-100">Acciones sobre el Producto</span>
        </div>
      </template>

      <div class="grid grid-cols-12 gap-4">
        <!-- IMEI (conditional) -->
        <div class="col-span-12 md:col-span-6" v-if="imeiShow">
          <FloatLabel>
            <InputMask
              id="imei"
              @change="fnAgregarIMEI"
              v-model="productoBuscado.imei"
              mask="999999999999999"
              placeholder="000000000000000"
              class="w-full p-inputtext-lg border-2 border-purple-300 hover:border-purple-400 focus:border-purple-500 transition-all duration-300"
            />
            <label for="imei">
              <i class="pi pi-mobile text-purple-600 mr-2"></i>
              IMEI del Dispositivo
            </label>
          </FloatLabel>
        </div>

        <!-- Agregar Stock (conditional) -->
        <div class="col-span-12 md:col-span-6" v-if="!imeiShow">
          <FloatLabel>
            <InputText
              id="nstockProducto"
              type="text"
              @blur="fnSumarStock"
              v-model="productoBuscado.nStock"
              v-solonumeros
              v-numeroFocusinOut
              v-decimales
              min="0"
              class="w-full p-inputtext-lg border-2 border-green-300 hover:border-green-400 focus:border-green-500 transition-all duration-300 font-semibold text-green-700 dark:text-green-300"
            />
            <label for="nstockProducto">
              <i class="pi pi-plus-circle text-green-600 mr-2"></i>
              Agregar al Stock
            </label>
          </FloatLabel>
        </div>
      </div>
    </Panel>
  </div>

  <template #footer>
    <div class="flex flex-wrap gap-3 justify-end">
      <Button
        v-if="imeiShow"
        label="Sincronizar IMEI"
        icon="pi pi-sync"
        severity="info"
        class="px-5 py-3 shadow-md hover:shadow-lg transition-all duration-300"
        @click="fechDataIMEI"
      />
      <Button
        icon="pi pi-qrcode"
        severity="secondary"
        class="px-5 py-3 shadow-md hover:shadow-lg transition-all duration-300"
        v-tooltip.top="'Escanear código de barras'"
        @click="fnBarcode"
      />
      <Button
        v-if="!imeiShow"
        icon="pi pi-cart-plus"
        severity="success"
        class="px-5 py-3 shadow-md hover:shadow-lg transition-all duration-300"
        v-tooltip.top="'Vender producto'"
        @click="fnvenderProducto"
      />
      <Button
        icon="pi pi-print"
        severity="help"
        class="px-5 py-3 shadow-md hover:shadow-lg transition-all duration-300"
        v-tooltip.top="'Imprimir etiqueta'"
        @click="fnImprimirProducto"
      />
      <Button
        icon="pi pi-pencil"
        severity="warning"
        class="px-5 py-3 shadow-md hover:shadow-lg transition-all duration-300"
        v-tooltip.top="'Editar producto'"
        @click="fnEditarProducto"
      />
      <Button
        label="Cerrar"
        icon="pi pi-times"
        severity="secondary"
        class="px-5 py-3 shadow-md hover:shadow-lg transition-all duration-300"
        @click="visibleModificarStock = false"
        autofocus
      />
    </div>
  </template>
</Dialog>
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<EnviarWhatsApp ref="enviarWhatsAppRef" :initialDatosWhatsApp="datosWhatsApp" />
 <!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<Dialog v-model:visible="visibleIMEI" modal :position="position" header="Modal de Abono" :style="{ width: '40rem' }">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Modal de Abono</span>
    </div>
  </template>

      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">BUSCADOR DE IMEI</legend>
          <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 form-group">
                    <label for="fechaabono">IMEI</label> <br>
                   <InputMask id="imeiModal" v-model="imeiModal" class="form-control " mask="999999999999999" placeholder="00000000000000000" />
                  </div>
          </div>
      </fieldset>

  <template #footer>
    <Button label="Ir a IMEI" as="router-link" outlined severity="secondary" to="/imei"  />
    <Button label="INFO LOCAL" outlined severity="secondary" @click="fnBuscarIMEIlocal"  />
    <Button label="INFO GENERAL" outlined severity="secondary" @click="fnBuscarIMEIgeneral"  />
    <Button label="Cancel" outlined severity="secondary" @click="visibleIMEI = false" autofocus />
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<IphoneDeviceReport
  v-model:visible="visibleIphoneDiagnostic"
  :report="iphoneDiagnostic"
  :loading="loadingIphoneDiagnostic"
  :title="`${datosEmpresa?.empresa?.nombre || 'Empresa'} Device Report`"
  :subtitle="datosEmpresa?.empresa?.nombre || ''"
  @reload="cargarDiagnosticoIphone"
  @print-important="imprimirDiagnosticoIphone80mm"
  @screenshot="capturarScreenshotDiagnosticoIphone"
/>
<Dialog
  v-model:visible="visibleIphoneDiagnosticPdf"
  modal
  :draggable="false"
  :style="{ width: '42rem', maxWidth: '96vw' }"
  class="iphone-pdf-preview-dialog"
  @hide="cerrarPreviewDiagnosticoIphonePdf"
>
  <template #header>
    <div class="flex items-center gap-3">
      <i class="pi pi-file-pdf text-red-500 text-xl"></i>
      <div class="flex flex-column">
        <span class="font-semibold text-900">Vista previa PDF 80mm</span>
        <small class="text-600">{{ datosEmpresa?.empresa?.nombre || 'Empresa' }}</small>
      </div>
    </div>
  </template>

  <div class="iphone-pdf-preview-content">
    <embed
      v-if="iphoneDiagnosticPdfSrc"
      :src="iphoneDiagnosticPdfSrc"
      type="application/pdf"
      class="iphone-pdf-embed"
    />
    <div v-else class="iphone-pdf-empty">
      No hay PDF generado para mostrar.
    </div>
  </div>

  <template #footer>
    <div class="flex justify-content-end gap-2 w-full">
      <Button
        label="Imprimir"
        icon="pi pi-print"
        severity="info"
        @click="imprimirPreviewDiagnosticoIphonePdf"
      />
      <Button
        label="Cerrar"
        severity="secondary"
        outlined
        @click="cerrarPreviewDiagnosticoIphonePdf"
      />
    </div>
  </template>
</Dialog>
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->
<EmailModal ref="emailModal" :apiBase="`${link}${api}`" :token="tokenCifrado" />
<!-- ////////////////////////////////////////////////////////////////////////////////////////// -->

  <LoadingOverlay :visible="loading" />
  <Toast />
  </template>

<style scoped>

.home-board {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.home-board-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.6rem;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.18), transparent 24%),
    linear-gradient(135deg, #0f172a 0%, #1e293b 58%, #0f766e 100%);
  color: #fff;
}

.home-board-kicker,
.home-board-section {
  display: inline-block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  opacity: 0.72;
  margin-bottom: 0.55rem;
}

.home-board-hero h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 900;
}

.home-board-hero p {
  margin: 0.75rem 0 0;
  max-width: 52rem;
  color: rgba(255, 255, 255, 0.78);
}

.home-board-status {
  min-width: 9rem;
  padding: 0.8rem 1rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
}

.home-board-status span {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.7;
}

.home-board-status strong {
  display: block;
  margin-top: 0.2rem;
  font-size: 1.15rem;
  font-weight: 800;
}

.home-board-status.is-open {
  box-shadow: inset 0 0 0 1px rgba(74, 222, 128, 0.25);
}

.home-board-status.is-closed {
  box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.25);
}

.home-board-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.home-board-card,
.home-board-panel {
  border-radius: 24px;
  border: 1px solid #dbe3ee;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.05);
}

.home-board-panel-full {
  grid-column: 1 / -1;
}

.home-board-card {
  padding: 1.2rem;
}

.home-board-card-primary {
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
}

.home-board-card span {
  display: block;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
}

.home-board-card strong {
  display: block;
  margin-top: 0.65rem;
  font-size: 1.9rem;
  line-height: 1;
  color: #0f172a;
}

.home-board-card small {
  display: block;
  margin-top: 0.55rem;
  color: #64748b;
}

.home-board-analytics {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
  gap: 1rem;
}

.home-board-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.home-board-strip-card {
  padding: 1.1rem 1.15rem;
  border-radius: 22px;
  border: 1px solid #dbe3ee;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.05);
}

.home-board-strip-card span {
  display: block;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  color: #64748b;
}

.home-board-strip-card strong {
  display: block;
  margin-top: 0.55rem;
  font-size: 1.55rem;
  line-height: 1;
  color: #0f172a;
}

.home-board-strip-card small {
  display: block;
  margin-top: 0.45rem;
  color: #64748b;
}

.home-board-panel {
  padding: 1.25rem;
}

.home-board-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.home-board-panel-head h3 {
  margin: 0.22rem 0 0;
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 800;
}

.home-board-pill {
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.home-board-chart {
  width: 100%;
}

.home-board-chart-bar {
  height: 18rem;
}

.home-board-chart-donut {
  height: 16rem;
}

.home-board-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.home-board-mini-card {
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.home-board-mini-card span {
  display: block;
  color: #64748b;
  font-size: 0.82rem;
}

.home-board-mini-card strong {
  display: block;
  margin-top: 0.32rem;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 800;
}

.dashboard-v2 {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.dashboard-v2-top {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.95fr);
  gap: 1rem;
}

.dashboard-v2-hero,
.dashboard-v2-kpi,
.dashboard-v2-panel {
  border-radius: 24px;
  border: 1px solid #dbe3ee;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.05);
}

.dashboard-v2-hero {
  padding: 1.5rem;
  background:
    radial-gradient(circle at top right, rgba(30, 64, 175, 0.12), transparent 28%),
    linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1d4ed8 100%);
  color: #fff;
  border-color: transparent;
}

.dashboard-v2-hero-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.dashboard-v2-eyebrow {
  display: inline-block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  opacity: 0.72;
  margin-bottom: 0.5rem;
}

.dashboard-v2-hero h2 {
  margin: 0;
  font-size: 1.75rem;
  line-height: 1.1;
  font-weight: 800;
}

.dashboard-v2-hero p {
  margin: 0.55rem 0 0;
  max-width: 38rem;
  color: rgba(255, 255, 255, 0.72);
}

.dashboard-v2-status {
  min-width: 8.75rem;
  padding: 0.8rem 1rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
}

.dashboard-v2-status span {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.7;
}

.dashboard-v2-status strong {
  display: block;
  margin-top: 0.2rem;
  font-size: 1.15rem;
  font-weight: 800;
}

.dashboard-v2-status.is-open {
  box-shadow: inset 0 0 0 1px rgba(74, 222, 128, 0.25);
}

.dashboard-v2-status.is-closed {
  box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.25);
}

.dashboard-v2-total-wrap {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.95fr);
  gap: 1rem;
  align-items: end;
}

.dashboard-v2-label {
  display: block;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.72;
}

.dashboard-v2-total {
  margin-top: 0.45rem;
  font-size: clamp(2.2rem, 4vw, 3.6rem);
  line-height: 1;
  font-weight: 900;
}

.dashboard-v2-hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.dashboard-v2-breakdown {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.dashboard-v2-chip {
  padding: 0.9rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.09);
}

.dashboard-v2-chip span {
  display: block;
  font-size: 0.75rem;
  opacity: 0.72;
}

.dashboard-v2-chip strong {
  display: block;
  margin-top: 0.3rem;
  font-size: 1rem;
  font-weight: 800;
}

.dashboard-v2-kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.dashboard-v2-kpi {
  padding: 1.2rem;
}

.dashboard-v2-kpi span,
.dashboard-v2-section {
  display: block;
  font-size: 0.73rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
}

.dashboard-v2-kpi strong {
  display: block;
  margin-top: 0.65rem;
  color: #0f172a;
  font-size: 1.55rem;
  line-height: 1.05;
  font-weight: 800;
}

.dashboard-v2-kpi small,
.dashboard-v2-copy {
  display: block;
  margin-top: 0.45rem;
  color: #64748b;
  font-size: 0.88rem;
}

.dashboard-v2-analytics {
  display: grid;
  grid-template-columns: 1fr;
}

.dashboard-v2-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.dashboard-v2-panel {
  padding: 1.25rem;
}

.dashboard-v2-panel-analytics {
  min-height: 24rem;
}

.dashboard-v2-panel-wide {
  grid-column: span 2;
}

.dashboard-v2-panel-inventory {
  grid-column: span 2;
}

.dashboard-v2-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.dashboard-v2-panel-head h3 {
  margin: 0.22rem 0 0;
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 800;
}

.dashboard-v2-pill {
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.dashboard-v2-chart-card {
  min-height: 20rem;
  padding: 1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.dashboard-v2-chart-head {
  margin-bottom: 0.65rem;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.72);
}

.dashboard-v2-chart {
  width: 100%;
}

.dashboard-v2-chart-donut {
  height: 16rem;
}

.dashboard-v2-chart-bar {
  height: 18rem;
  margin-top: 0.75rem;
}

.dashboard-v2-table {
  margin-top: 1rem;
}

.dashboard-v2-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1.8fr) 110px 140px;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 0.15rem;
  border-bottom: 1px solid #e8eef5;
}

.dashboard-v2-row:last-child {
  border-bottom: 0;
}

.dashboard-v2-row strong,
.dashboard-v2-list-item strong {
  color: #0f172a;
  font-weight: 700;
}

.dashboard-v2-row span {
  color: #334155;
}

.dashboard-v2-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 2.2rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8 !important;
  font-weight: 800;
}

.dashboard-v2-product-cell {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.dashboard-v2-product-bar {
  height: 0.42rem;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.dashboard-v2-product-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #1d4ed8 0%, #0f766e 100%);
}

.dashboard-v2-row-head {
  padding-top: 0.1rem;
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dashboard-v2-row-head span {
  color: #64748b;
}

.dashboard-v2-row-inventory {
  grid-template-columns: minmax(0, 1.8fr) 140px 140px 140px;
}

.dashboard-v2-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.dashboard-v2-metrics-two {
  margin-top: 1rem;
}

.dashboard-v2-metric {
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.dashboard-v2-metric span {
  display: block;
  color: #64748b;
  font-size: 0.82rem;
}

.dashboard-v2-metric strong {
  display: block;
  margin-top: 0.32rem;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 800;
}

.dashboard-v2-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.dashboard-v2-list-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.dashboard-v2-list-item small {
  display: block;
  margin-top: 0.2rem;
  color: #64748b;
}

.dashboard-v2-list-item span {
  color: #1e40af;
  font-weight: 700;
}

.dashboard-v2-highlight {
  margin-top: 1rem;
  font-size: 2rem;
  line-height: 1;
  font-weight: 900;
  color: #0f172a;
}

.dashboard-v2-empty {
  margin-top: 1rem;
  padding: 1.1rem;
  border-radius: 18px;
  background: #f8fafc;
  color: #64748b;
  text-align: center;
}

@media (max-width: 1200px) {
  .home-board-summary,
  .home-board-analytics,
  .home-board-strip,
  .dashboard-v2-top,
  .dashboard-v2-total-wrap,
  .dashboard-v2-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-v2-panel-wide {
    grid-column: span 1;
  }

  .dashboard-v2-panel-inventory {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .home-board-hero {
    flex-direction: column;
  }

  .section-header,
  .section-header-title,
  .home-display-toggles {
    align-items: stretch;
    flex-direction: column;
  }

  .home-display-toggle {
    justify-content: space-between;
    width: 100%;
  }

  .actions-card-view {
    padding: 0.85rem;
  }

  .home-board-mini-grid,
  .home-board-strip,
  .dashboard-v2-kpis,
  .dashboard-v2-hero-metrics,
  .dashboard-v2-breakdown,
  .dashboard-v2-metrics {
    grid-template-columns: 1fr;
  }

  .dashboard-v2-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.35rem;
  }
}

:deep(.dark) .dashboard-v2-kpi,
:deep(.dark) .home-board-strip-card,
:deep(.dark) .home-board-card,
:deep(.dark) .home-board-panel,
:deep(.dark) .dashboard-v2-panel {
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  border-color: #334155;
}

:deep(.dark) .home-board-card strong,
:deep(.dark) .home-board-strip-card strong,
:deep(.dark) .home-board-panel-head h3,
:deep(.dark) .home-board-mini-card strong,
:deep(.dark) .dashboard-v2-kpi strong,
:deep(.dark) .dashboard-v2-panel-head h3,
:deep(.dark) .dashboard-v2-row strong,
:deep(.dark) .dashboard-v2-metric strong,
:deep(.dark) .dashboard-v2-highlight,
:deep(.dark) .dashboard-v2-list-item strong {
  color: #f8fafc;
}

:deep(.dark) .home-board-card small,
:deep(.dark) .home-board-card span,
:deep(.dark) .home-board-strip-card small,
:deep(.dark) .home-board-strip-card span,
:deep(.dark) .home-board-section,
:deep(.dark) .home-board-mini-card span,
:deep(.dark) .dashboard-v2-kpi small,
:deep(.dark) .dashboard-v2-section,
:deep(.dark) .dashboard-v2-kpi span,
:deep(.dark) .dashboard-v2-copy,
:deep(.dark) .dashboard-v2-row span,
:deep(.dark) .dashboard-v2-metric span,
:deep(.dark) .dashboard-v2-list-item small,
:deep(.dark) .dashboard-v2-empty {
  color: #94a3b8;
}

:deep(.dark) .home-board-pill {
  background: rgba(30, 64, 175, 0.16);
  color: #93c5fd;
}

:deep(.dark) .dashboard-v2-pill {
  background: rgba(30, 64, 175, 0.16);
  color: #93c5fd;
}

:deep(.dark) .dashboard-v2-rank {
  background: rgba(30, 64, 175, 0.2);
  color: #93c5fd !important;
}

:deep(.dark) .home-board-mini-card,
:deep(.dark) .dashboard-v2-product-bar,
:deep(.dark) .dashboard-v2-row,
:deep(.dark) .dashboard-v2-metric,
:deep(.dark) .dashboard-v2-list-item,
:deep(.dark) .dashboard-v2-empty {
  background: rgba(15, 23, 42, 0.72);
  border-color: #334155;
}

.dashboard-overview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.dashboard-card,
.dashboard-panel {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid #dbe7f3;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.dashboard-card {
  padding: 1.2rem;
}

.dashboard-card-strong {
  background: linear-gradient(135deg, #0f766e 0%, #14532d 100%);
  color: #ffffff;
  border-color: transparent;
}

.dashboard-card-head,
.dashboard-panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-kicker {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 700;
}

.dashboard-card-strong .dashboard-kicker,
.dashboard-card-strong .dashboard-meta-row,
.dashboard-card-strong .dashboard-card-head i {
  color: rgba(255, 255, 255, 0.88);
}

.dashboard-card-head i {
  font-size: 1.1rem;
  color: #0f766e;
}

.dashboard-amount {
  font-size: clamp(1.9rem, 4vw, 2.9rem);
  line-height: 1;
  font-weight: 800;
  margin: 0.85rem 0;
}

.dashboard-mini-value,
.dashboard-amount-sm {
  font-size: 1.7rem;
  line-height: 1.1;
  font-weight: 800;
  color: #0f172a;
  margin: 0.85rem 0 0.45rem;
}

.dashboard-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #475569;
}

.dashboard-note {
  margin: 0;
  color: #64748b;
  font-size: 0.92rem;
}

.dashboard-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  margin: 0.85rem 0 0.4rem;
}

.dashboard-status.is-open {
  background: #dcfce7;
  color: #166534;
}

.dashboard-status.is-closed {
  background: #fee2e2;
  color: #991b1b;
}

.dashboard-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.dashboard-panel {
  padding: 1.2rem;
}

.dashboard-panel-title h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.dashboard-panel-title span {
  font-size: 0.82rem;
  color: #64748b;
}

.dashboard-panel-title-inline {
  margin-top: 1.2rem;
}

.dashboard-list,
.dashboard-sublist {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 1rem;
}

.dashboard-list-item,
.dashboard-sublist-item,
.dashboard-metric {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 0.95rem;
  border-radius: 16px;
  background: rgba(241, 245, 249, 0.8);
}

.dashboard-list-item strong,
.dashboard-sublist-item strong {
  display: block;
  color: #0f172a;
}

.dashboard-list-item small,
.dashboard-sublist-item small {
  display: block;
  color: #64748b;
  margin-top: 0.2rem;
}

.dashboard-list-item span,
.dashboard-sublist-item span,
.dashboard-metric strong {
  color: #0f766e;
  font-weight: 700;
}

.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}

.dashboard-metric {
  flex-direction: column;
  align-items: flex-start;
}

.dashboard-metric span {
  color: #64748b;
  font-size: 0.85rem;
}

.dashboard-empty {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: #f8fafc;
  color: #64748b;
  text-align: center;
}

:deep(.dark) .dashboard-card,
:deep(.dark) .dashboard-panel {
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  border-color: #334155;
}

:deep(.dark) .dashboard-kicker,
:deep(.dark) .dashboard-note,
:deep(.dark) .dashboard-panel-title span,
:deep(.dark) .dashboard-list-item small,
:deep(.dark) .dashboard-sublist-item small,
:deep(.dark) .dashboard-metric span,
:deep(.dark) .dashboard-empty {
  color: #94a3b8;
}

:deep(.dark) .dashboard-mini-value,
:deep(.dark) .dashboard-amount-sm,
:deep(.dark) .dashboard-panel-title h3,
:deep(.dark) .dashboard-list-item strong,
:deep(.dark) .dashboard-sublist-item strong {
  color: #f8fafc;
}

:deep(.dark) .dashboard-list-item,
:deep(.dark) .dashboard-sublist-item,
:deep(.dark) .dashboard-metric,
:deep(.dark) .dashboard-empty {
  background: rgba(30, 41, 59, 0.9);
}

@media (max-width: 768px) {
  .dashboard-metrics {
    grid-template-columns: 1fr;
  }
}

.iphone-report-shell {
  background: linear-gradient(180deg, #edf4fb 0%, #edf3fa 100%);
  padding: 0.35rem;
}

.iphone-report-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.iphone-score-card,
.iphone-device-info,
.iphone-report-table-card,
.iphone-mini-card,
.iphone-report-main {
  background: #ffffff;
  border: 1px solid #dbe7f3;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(31, 77, 125, 0.08);
}

.iphone-score-card {
  padding: 1.2rem;
  text-align: center;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.iphone-score-chip {
  background: linear-gradient(90deg, #f6ebd7 0%, #c7f3f4 100%);
  border-radius: 14px;
  padding: 0.85rem 0.75rem;
  color: #56717f;
  font-size: 1rem;
  font-weight: 700;
}

.iphone-side-title,
.iphone-mini-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #35536f;
  margin-bottom: 0.85rem;
}

.iphone-score-value {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  color: #16a34a;
  margin: 1.2rem 0 0.65rem;
}

.iphone-score-stars {
  font-size: 1.6rem;
  letter-spacing: 0.1rem;
}

.iphone-device-info {
  padding: 1.2rem;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.iphone-side-row,
.iphone-mini-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(236, 242, 248, 0.8);
  font-size: 0.92rem;
}

.iphone-side-row:last-child,
.iphone-mini-row:last-child {
  border-bottom: 0;
}

.iphone-side-row span,
.iphone-mini-row span {
  color: #5f7488;
}

.iphone-side-row strong,
.iphone-mini-row strong {
  color: #22384d;
  text-align: right;
  word-break: break-word;
}

.iphone-report-main {
  padding: 0.2rem;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.iphone-report-banner {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  background: linear-gradient(90deg, #edfbe8 0%, #dff6de 100%);
  border: 1px solid #c9edc4;
  margin-bottom: 1rem;
}

.iphone-report-table-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #deebf5;
  border-radius: 18px;
}

.iphone-report-table-head,
.iphone-report-table-row {
  display: grid;
  grid-template-columns: 1.25fr 1.15fr 1.15fr 0.7fr;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1.1rem;
}

.iphone-report-table-head {
  background: #f7fafc;
  font-weight: 700;
  color: #30475e;
  border-bottom: 1px solid #e4edf5;
}

.iphone-report-table-row {
  border-bottom: 1px solid #eff4f8;
  color: #324a5f;
}

.iphone-report-table-row:last-child {
  border-bottom: 0;
}

.iphone-report-item-label {
  font-weight: 600;
  color: #203548;
}

.iphone-mini-card {
  padding: 1rem 1.1rem;
  min-height: 100%;
}

.iphone-mini-result {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: flex-end;
  text-align: right;
}

.iphone-result-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 991px) {
  .iphone-report-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .iphone-report-table-head,
  .iphone-report-table-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
}

/* ===================================
   MODERN HOME COMPONENT STYLES
   =================================== */

/* Main Wrapper */
.home-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow: hidden;
}

.home-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.1" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
  background-size: cover;
  animation: waveMove 20s ease-in-out infinite;
}

@keyframes waveMove {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-50px);
  }
}

.home-container {
  position: relative;
  z-index: 1;
}

/* Hero Header */
.hero-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2rem 2.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideDown 0.6s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.hero-icon-wrapper {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin: 0;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.5rem 0 0 0;
  font-weight: 500;
}

.hero-date {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Stat Cards */
.stat-card {
  position: relative;
  border-radius: 20px;
  padding: 1.5rem;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideUp 0.6s ease-out both;
  border: 1px solid rgba(255, 255, 255, 0.15);
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

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.stat-card-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card-orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card-cyan {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card-purple {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.stat-card-inner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon-bg {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon-bg {
  transform: rotate(10deg) scale(1.1);
}

.stat-icon {
  font-size: 2.5rem;
  color: white;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.stat-content {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: white;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.stat-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  backdrop-filter: blur(10px);
}

.stat-wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0.5;
  animation: wave 10s linear infinite;
}

@keyframes wave {
  0% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(-25%) translateY(-10px);
  }
  100% {
    transform: translateX(0) translateY(0);
  }
}

/* Actions Section */
.actions-section {
  background: transparent;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.6s ease-out 0.5s both;
}

:global(html.dark) .actions-section,
:global(.app-dark) .actions-section {
  background: #0f172a !important;
  box-shadow: 0 10px 40px rgba(2, 6, 23, 0.55) !important;
}

:global(html.dark) .home-wrapper .actions-section,
:global(.app-dark) .home-wrapper .actions-section {
  background: #0f172a !important;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.home-display-toggles {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.home-visibility-panel {
  margin-bottom: 1.25rem;
  padding: 1rem;
  border: 1px solid #dbe4ee;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}

.home-visibility-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.home-visibility-head span {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.home-visibility-head strong {
  display: block;
  color: #0f172a;
  font-size: 1.05rem;
}

.home-visibility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.75rem;
}

.home-display-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.2;
}

:global(html.dark) .home-display-toggle,
:global(.app-dark) .home-display-toggle {
  border-color: #334155;
  background: #111827;
  color: #e2e8f0;
}

:global(html.dark) .home-visibility-panel,
:global(.app-dark) .home-visibility-panel {
  border-color: #334155;
  background: rgba(15, 23, 42, 0.92);
}

:global(html.dark) .home-visibility-head strong,
:global(.app-dark) .home-visibility-head strong {
  color: #f8fafc;
}

.section-icon-wrapper {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.section-icon-wrapper i {
  font-size: 1.8rem;
  color: white;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
}

:global(html.dark) .section-title,
:global(.app-dark) .section-title {
  color: #e2e8f0 !important;
}

.section-subtitle {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
  font-weight: 500;
}

:global(html.dark) .section-subtitle,
:global(.app-dark) .section-subtitle {
  color: #94a3b8 !important;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.actions-card-view {
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

:global(html.dark) .actions-card-view,
:global(.app-dark) .actions-card-view {
  border-color: #334155;
  background: #0f172a;
}

.actions-grid :deep(.p-button) {
  height: 100%;
  min-height: 80px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
  background: white;
  color: #374151;
}

:global(html.dark) .actions-grid :deep(.p-button),
:global(.app-dark) .actions-grid :deep(.p-button) {
  border-color: #334155 !important;
  background: #111827 !important;
  color: #e2e8f0 !important;
}

:global(html.dark) .home-wrapper .actions-grid :deep(.p-button),
:global(.app-dark) .home-wrapper .actions-grid :deep(.p-button) {
  border-color: #334155 !important;
  background: #111827 !important;
  color: #e2e8f0 !important;
}

.actions-grid :deep(.p-button:hover) {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

:global(html.dark) .actions-grid :deep(.p-button:hover),
:global(.app-dark) .actions-grid :deep(.p-button:hover) {
  border-color: #6366f1 !important;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%) !important;
}

.actions-tabview {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
}

:global(html.dark) .actions-tabview,
:global(.app-dark) .actions-tabview {
  border-color: #334155;
  background: #0f172a;
}

.actions-tabview :deep(.p-tabview-nav) {
  display: flex;
  gap: 0.35rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 0;
  overflow-x: auto;
}

:global(html.dark) .actions-tabview :deep(.p-tabview-nav),
:global(.app-dark) .actions-tabview :deep(.p-tabview-nav) {
  background: #111827;
}

.actions-tabview :deep(.p-tabview-nav li) {
  flex: 0 0 auto;
}

.actions-tabview :deep(.p-tabview-nav-link) {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #475569;
  font-weight: 700;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.actions-tabview :deep(.p-tabview-nav-link:hover) {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #3730a3;
}

.actions-tabview :deep(.p-highlight .p-tabview-nav-link) {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(29, 78, 216, 0.24);
}

:global(html.dark) .actions-tabview :deep(.p-tabview-nav-link),
:global(.app-dark) .actions-tabview :deep(.p-tabview-nav-link) {
  color: #cbd5e1;
}

:global(html.dark) .actions-tabview :deep(.p-tabview-nav-link:hover),
:global(.app-dark) .actions-tabview :deep(.p-tabview-nav-link:hover) {
  background: #1e293b;
  border-color: #475569;
  color: #f8fafc;
}

:global(html.dark) .actions-tabview :deep(.p-highlight .p-tabview-nav-link),
:global(.app-dark) .actions-tabview :deep(.p-highlight .p-tabview-nav-link) {
  background: #2563eb;
  border-color: #60a5fa;
}

.actions-tabview :deep(.p-tabview-panels) {
  padding: 1.25rem;
  background: #ffffff;
}

:global(html.dark) .actions-tabview :deep(.p-tabview-panels),
:global(.app-dark) .actions-tabview :deep(.p-tabview-panels) {
  background: #0f172a;
}

.action-tab-header {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.action-tab-intro {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

:global(html.dark) .action-tab-intro,
:global(.app-dark) .action-tab-intro {
  border-bottom-color: #334155;
}

.action-tab-intro h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 800;
}

.action-tab-intro p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

:global(html.dark) .action-tab-intro h3,
:global(.app-dark) .action-tab-intro h3 {
  color: #f8fafc;
}

:global(html.dark) .action-tab-intro p,
:global(.app-dark) .action-tab-intro p {
  color: #94a3b8;
}

.action-tab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: 0.85rem;
}

.action-tab-grid-primary {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.action-tab-grid :deep(.p-button) {
  width: 100%;
  min-height: 86px;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  color: #334155;
  font-weight: 700;
  line-height: 1.2;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.action-tab-grid :deep(.p-button .p-button-label) {
  white-space: normal;
  word-break: break-word;
}

.action-tab-grid :deep(.p-button .p-button-icon) {
  font-size: 1.25rem;
}

.action-tab-grid :deep(.p-button:hover) {
  transform: translateY(-2px);
  border-color: #2563eb;
  background: #f8fafc;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.14);
}

.public-routes-dialog {
  display: grid;
  gap: 1rem;
}

.public-routes-copy {
  margin: 0;
  color: #64748b;
  font-size: .95rem;
}

.public-routes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .75rem;
}

.public-route-item {
  display: grid;
  gap: .5rem;
  min-width: 0;
  padding: .75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.public-route-item > :deep(.p-button:first-child) {
  min-height: 5.5rem;
  justify-content: center;
}

.public-route-item :deep(.p-button-label) {
  white-space: normal;
  line-height: 1.2;
}

.public-route-url {
  min-width: 0;
  color: #64748b;
  font-size: .78rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

:global(html.dark) .action-tab-grid :deep(.p-button),
:global(.app-dark) .action-tab-grid :deep(.p-button) {
  border-color: #334155;
  background: #111827;
  color: #e2e8f0;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.28);
}

:global(html.dark) .action-tab-grid :deep(.p-button:hover),
:global(.app-dark) .action-tab-grid :deep(.p-button:hover) {
  border-color: #60a5fa;
  background: #1e293b;
}

/* Tables Section */
.tables-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.6s ease-out 0.6s both;
}

:global(html.dark) .tables-section,
:global(.app-dark) .tables-section {
  background: #0f172a;
  box-shadow: 0 10px 40px rgba(2, 6, 23, 0.55);
}

.modern-card {
  border-radius: 16px;
  overflow: hidden;
}

.modern-tabview :deep(.p-tabview-nav) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px 12px 0 0;
  padding: 0.5rem;
}

.modern-tabview :deep(.p-tabview-nav-link) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.modern-tabview :deep(.p-tabview-nav-link:hover) {
  background: rgba(102, 126, 234, 0.1);
}

.modern-tabview :deep(.p-highlight .p-tabview-nav-link) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* DataTable Custom Styles */
.modern-tabview :deep(.p-datatable .p-datatable-thead > tr > th) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: #374151;
  font-weight: 700;
  padding: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.modern-tabview :deep(.p-datatable .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
}

.modern-tabview :deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: rgba(102, 126, 234, 0.05);
}

/* Row Colors */
.row-red {
  color: #ef4444 !important;
  font-weight: 600;
}

.row-yellow {
  color: #f59e0b !important;
  font-weight: 600;
}

.row-green {
  color: #10b981 !important;
  font-weight: 500;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .hero-header {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }

  .hero-title {
    font-size: 1.8rem;
  }

  .hero-icon-wrapper {
    width: 60px;
    height: 60px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .actions-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .public-routes-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-header,
  .section-header-title,
  .home-display-toggles {
    align-items: stretch;
    flex-direction: column;
  }

  .home-display-toggle {
    justify-content: space-between;
    width: 100%;
  }

  .actions-card-view {
    padding: 0.85rem;
  }

  .section-title {
    font-size: 1.25rem;
  }
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 10px;
}

/* ═══════════════════════════════════════════════════════════
   📦 MODAL MODIFICAR STOCK
   ═══════════════════════════════════════════════════════════ */

.modificar-stock-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
}

:deep(.dark) .modificar-stock-dialog :deep(.p-dialog-content) {
  background: linear-gradient(to bottom, #1f2937, #111827);
}

.modificar-stock-content {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Search Panel */
.search-panel {
  animation: slideInLeft 0.5s ease-out;
}

.search-panel :deep(.p-panel-header) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 0.75rem 0.75rem 0 0;
  padding: 1rem 1.5rem;
  border: none;
}

.search-panel :deep(.p-panel-content) {
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 0.75rem 0.75rem;
}

:deep(.dark) .search-panel :deep(.p-panel-content) {
  background: #374151;
  border-color: #4b5563;
}

/* Info Panel */
.info-panel {
  animation: slideInLeft 0.6s ease-out;
}

.info-panel :deep(.p-panel-header) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border-radius: 0.75rem 0.75rem 0 0;
  padding: 1rem 1.5rem;
  border: none;
}

.info-panel :deep(.p-panel-content) {
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 0.75rem 0.75rem;
}

:deep(.dark) .info-panel :deep(.p-panel-content) {
  background: #374151;
  border-color: #4b5563;
}

/* Prices Panel */
.prices-panel {
  animation: slideInLeft 0.7s ease-out;
}

.prices-panel :deep(.p-panel-header) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 0.75rem 0.75rem 0 0;
  padding: 1rem 1.5rem;
  border: none;
}

.prices-panel :deep(.p-panel-content) {
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 0.75rem 0.75rem;
}

:deep(.dark) .prices-panel :deep(.p-panel-content) {
  background: #374151;
  border-color: #4b5563;
}

/* Actions Panel */
.actions-panel {
  animation: slideInLeft 0.8s ease-out;
}

.actions-panel :deep(.p-panel-header) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border-radius: 0.75rem 0.75rem 0 0;
  padding: 1rem 1.5rem;
  border: none;
}

.actions-panel :deep(.p-panel-content) {
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 0.75rem 0.75rem;
}

:deep(.dark) .actions-panel :deep(.p-panel-content) {
  background: #374151;
  border-color: #4b5563;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* FloatLabel Styles */
.modificar-stock-content :deep(.p-float-label) {
  margin-top: 1rem;
}

.modificar-stock-content :deep(.p-float-label label) {
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
}

:deep(.dark) .modificar-stock-content :deep(.p-float-label label) {
  color: #9ca3af;
}

.modificar-stock-content :deep(.p-float-label label i) {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.modificar-stock-content :deep(.p-inputtext) {
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  color: #1f2937;
}

:deep(.dark) .modificar-stock-content :deep(.p-inputtext) {
  background: #1f2937;
  color: #f3f4f6;
  border-color: #4b5563;
}

.modificar-stock-content :deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.modificar-stock-content :deep(.p-inputtext[readonly]) {
  cursor: not-allowed;
  opacity: 0.8;
}

/* Footer Buttons */
.modificar-stock-dialog :deep(.p-dialog-footer) {
  padding: 1.5rem;
  background: linear-gradient(to top, #f9fafb, #ffffff);
  border-top: 2px solid #e5e7eb;
}

:deep(.dark) .modificar-stock-dialog :deep(.p-dialog-footer) {
  background: linear-gradient(to top, #1f2937, #111827);
  border-top-color: #4b5563;
}

.modificar-stock-dialog :deep(.p-dialog-footer .p-button) {
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.modificar-stock-dialog :deep(.p-dialog-footer .p-button::before) {
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

.modificar-stock-dialog :deep(.p-dialog-footer .p-button:active::before) {
  width: 300px;
  height: 300px;
}

.modificar-stock-dialog :deep(.p-dialog-footer .p-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Header Styling */
.modificar-stock-dialog :deep(.p-dialog-header) {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
  border-bottom: 3px solid #3b82f6;
}

:deep(.dark) .modificar-stock-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #1e293b 0%, #312e81 100%);
  border-bottom-color: #6366f1;
}

/* Responsive */
@media (max-width: 768px) {
  .modificar-stock-dialog :deep(.p-dialog) {
    width: 95vw !important;
    max-width: 95vw !important;
  }

  .modificar-stock-content :deep(.p-panel-header) {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
  }

  .modificar-stock-dialog :deep(.p-dialog-footer) {
    flex-direction: column;
  }

  .modificar-stock-dialog :deep(.p-dialog-footer .p-button) {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}

/* Custom Awesomplete Styles */
.modificar-stock-content awesomplete {
  width: 100%;
}

.modificar-stock-content awesomplete input {
  width: 100%;
  outline: none;
}

.modificar-stock-content awesomplete input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Animations */
.modificar-stock-dialog :deep(.p-panel) {
  transition: all 0.3s ease;
}

.modificar-stock-dialog :deep(.p-panel:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.iphone-pdf-preview-content {
  min-height: 70vh;
}

.iphone-pdf-embed {
  width: 100%;
  height: 70vh;
  border: 1px solid #dbe4ee;
  border-radius: 12px;
  background: #ffffff;
}

.iphone-pdf-empty {
  min-height: 24rem;
  display: grid;
  place-items: center;
  color: #64748b;
  font-weight: 500;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
}

</style>

<style>
/* SweetAlert z-index para que aparezca sobre modales de PrimeVue */
.swal-high-zindex {
  z-index: 9999 !important;
}
</style>
