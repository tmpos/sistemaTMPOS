<script setup>
import { ref, onMounted, nextTick, watchEffect,watch,computed } from 'vue';
import { useToast } from "primevue/usetoast";
import EnviarWhatsApp from '@/components/WhatsappModal.vue';
import Patron from '../Patron/Patron.vue';
import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, enviarSolicitudGet, generarCodigoUnico, peticionesFetchOffline, mensajetoast, arrayToObjetoFromTablaOffline, enviarDatosLocalStorage, generarTablaFromStringJSON, convertirStringAArrayDeObjetos, variableEnString, generadorCodigo, cajeroACtivo, peticiones, lasMayusculas, crearTablaSiNoExisteOffline } from '@/funciones/funciones.js';

import { facturaNueva,cotizacionNueva,facturaActualizar,restarStock } from '@/funciones/funcionesVentas.js';

import Swal from 'sweetalert2'
const toast = useToast();
/************************************************************************/
import { useVueToPrint } from "vue-to-print";
/************************************************************************/
import jsPDF from 'jspdf';
/************************************************************************/
import ImpresoraTaller from '@/components/ImpresoraTaller.vue';
import LoadingOverlay from '../../Loading/LoadingOverlay.vue';
//import config from '../../../../../resources/config.json';
/************************************************************************/
import {useDatosEmpresa} from '@/stores'
import { notifyCompanyPayment } from '@/funciones/notificacionesAbonos.js';
const datosEmpresa = useDatosEmpresa();
//const production = config.VITE_PRODUCTION;
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref(null);
const loading = ref(false)
/************************************************************************/
const visibleIA = ref(false);
const datoscamposIa = ref({});
const visibleAverias = ref(false);
const visibleAccesorios = ref(false);
const visibleCostoPiezas = ref(false);
const visibleCostoReparacion = ref(false);
const costoPieza = ref(0);
const formularioCostoReparacion = ref({
  total: 0,
  manodeobra: 0,
  preciopiezas: 0
});
const totalCostoReparacion = computed(() => {
  return Number(formularioCostoReparacion.value.total || 0);
});

// Flag para controlar cálculos del modal de costo de reparación
const calculandoModalCostoReparacion = ref(false);

// Watcher para calcular mano de obra cuando cambia el total en el modal
watch(() => formularioCostoReparacion.value.total, (nuevoTotal) => {
  if (calculandoModalCostoReparacion.value) return;

  calculandoModalCostoReparacion.value = true;

  const total = parseFloat(nuevoTotal) || 0;
  const preciopiezas = parseFloat(formularioCostoReparacion.value.preciopiezas) || 0;

  if (preciopiezas > 0) {
    formularioCostoReparacion.value.manodeobra = Math.max(0, total - preciopiezas).toFixed(2);
  } else {
    formularioCostoReparacion.value.manodeobra = total.toFixed(2);
  }

  calculandoModalCostoReparacion.value = false;
});

// Watcher para calcular total cuando cambia la mano de obra en el modal
watch(() => formularioCostoReparacion.value.manodeobra, (nuevaManoDeObra) => {
  if (calculandoModalCostoReparacion.value) return;

  calculandoModalCostoReparacion.value = true;

  const manodeobra = parseFloat(nuevaManoDeObra) || 0;
  const preciopiezas = parseFloat(formularioCostoReparacion.value.preciopiezas) || 0;

  formularioCostoReparacion.value.total = (manodeobra + preciopiezas).toFixed(2);

  calculandoModalCostoReparacion.value = false;
});

// Watcher para recalcular cuando cambia el costo de piezas en el modal
watch(() => formularioCostoReparacion.value.preciopiezas, (nuevoPrecioPiezas) => {
  if (calculandoModalCostoReparacion.value) return;

  calculandoModalCostoReparacion.value = true;

  const preciopiezas = parseFloat(nuevoPrecioPiezas) || 0;
  const total = parseFloat(formularioCostoReparacion.value.total) || 0;

  // Siempre calcular mano de obra restando pieza del total, SIN cambiar el total
  formularioCostoReparacion.value.manodeobra = Math.max(0, total - preciopiezas).toFixed(2);

  calculandoModalCostoReparacion.value = false;
});
const fallasChips = ref([]);
const accesoriosChips = ref([]);
const datosProductoBuscado = ref({})
/************************************************************************/
const visiblePiezas = ref(false);
const visiblePedidos = ref(false);
const visiblePedidoIndividual = ref(false);
const datoscamposPedido = ref({});
const proveedorWhatsapp = ref({});
const proveedorWhatsappIndividual = ref({});
const visibleAbonarModal = ref(false);
const nuevoAbonoTaller = ref({
  abono: 0,
  metodo_pago: 'EFECTIVO'
});
const visibleEditarAbono = ref(false);
const abonoEditando = ref({});
const abonoEditandoIndex = ref(-1);
const pdfUrlMicrosoldadura = ref('');
const pdfDialogMicrosoldadura = ref(false);
const visibleImpresoraTaller = ref(false);
const formatoImpresion = ref('80mm');
const ordenParaImprimir = ref({});
/************************************************************************/
const datosUsuarioLocal = ref({})
const notificarAbonoTaller = (orden, pago, origen = 'Taller') => {
  void notifyCompanyPayment({
    type: 'taller',
    reference: orden?.no_factura,
    client: orden?.nombre || orden?.cliente,
    amount: pago?.abono,
    balance: pago?.saldo ?? orden?.saldo,
    method: pago?.metodo_pago,
    cashier: pago?.cajero || datosUsuarioLocal.value?.nombre || datosUsuarioLocal.value?.email,
    date: pago?.fecha,
    time: pago?.hora,
    source: origen,
    company: datosEmpresa.empresa
  });
};
const productosArray = ref([])
const menuModel = ref('')
const selectedProduct = ref(null);
const cm = ref(null);
  const columns = [
    { field: 'codigo', header: 'Código' },
    { field: 'nombre', header: 'Nombre' },
    { field: 'stock', header: 'Stock' },
    { field: 'precio_venta', header: 'Precio' },
  ];
/************************************************************************/
const searchQuery = ref('')
/************************************************************************/
const datoscampos = ref({})
const obtenerHistorialOrden = (ordenData) => {
  try {
    const historial = JSON.parse(ordenData?.historial_orden || '[]')
    return Array.isArray(historial) ? historial : []
  } catch (error) {
    return []
  }
}

const registrarEventoOrden = (ordenData, { tipo = 'actualizacion', titulo = 'Actualizacion', detalle = '' } = {}) => {
  const historial = obtenerHistorialOrden(ordenData)
  historial.unshift({
    tipo,
    titulo,
    detalle,
    usuario: datosUsuarioLocal.value?.nombre || datosUsuarioLocal.value?.email || datosUsuarioLocal.value?.usuario || 'Sistema',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    timestamp: nfecha('timestamp')
  })
  ordenData.historial_orden = JSON.stringify(historial)
  return ordenData
}

const obtenerPiezasUsadasOrden = () => {
  try {
    const piezas = JSON.parse(datoscampos.value?.piezas_usadas || '[]')
    return Array.isArray(piezas) ? piezas : []
  } catch (error) {
    return []
  }
}

const piezasUsadasOrden = computed(() => obtenerPiezasUsadasOrden())

const totalPiezasUsadasOrden = computed(() =>
  piezasUsadasOrden.value.reduce((total, pieza) => total + Number(pieza.total || 0), 0).toFixed(2)
)

const agregarPiezaUsadaOrden = (pieza, cantidad = 1) => {
  const piezas = obtenerPiezasUsadasOrden()
  const codigo = String(pieza.codigo || pieza.id || pieza.nombre || '').trim()
  const existente = piezas.find((item) => String(item.codigo || item.id || item.nombre || '').trim() === codigo)
  if (existente) {
    existente.cantidad = Number(existente.cantidad || 0) + cantidad
    existente.total = (Number(existente.cantidad || 0) * Number(existente.costo || 0)).toFixed(2)
  } else {
    piezas.push({
      id: pieza.id || '',
      codigo: pieza.codigo || '',
      nombre: pieza.nombre || '',
      cantidad,
      costo: Number(pieza.costo || 0).toFixed(2),
      total: (cantidad * Number(pieza.costo || 0)).toFixed(2),
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      usuario: datosUsuarioLocal.value?.nombre || datosUsuarioLocal.value?.email || 'Sistema'
    })
  }
  datoscampos.value.piezas_usadas = JSON.stringify(piezas)
}

const obtenerAbonosOrden = () => {
  try {
    const abonos = JSON.parse(datoscampos.value?.abono || '[]')
    return Array.isArray(abonos) ? abonos : []
  } catch (error) {
    return []
  }
}

const asegurarAbonoBaseOrden = (abonos = []) => {
  if (abonos.length > 0) return abonos

  return [{
    abono: '0.00',
    prioridad: prioridad.value || '3',
    recibidopor: datosUsuarioLocal.value?.nombre || datosUsuarioLocal.value?.email || 'Sistema',
    turno: '',
    cajero: datosUsuarioLocal.value?.email || datosUsuarioLocal.value?.usuario || 'Sistema',
    metodo_pago: datoscampos.value?.metodopago || datoscampos.value?.metodo_pago || 'EFECTIVO',
    hora: nfecha('hora'),
    fecha: nfecha('fecha')
  }]
}

const codigoUnico = ref(generarCodigoUnico());
const fecha = ref(nfecha('fecha'));
const todosLosTaller = ref([]);
const arrayIMGTaller = ref([]);
/************************************************************************/
const getRutaImagenTaller = () => `../vista/img/taller/${datoscampos.value.imagen}`;

const asegurarImagenTaller = async () => {
  if (!datoscampos.value) return;
  if (!datoscampos.value.imagen) {
    datoscampos.value.imagen = generarCodigoUnico();
    await peticionesFetchOffline('updateData', 'taller', JSON.stringify(datoscampos.value));
  }
};

const cargarImagenesTaller = async () => {
  await asegurarImagenTaller();
  if (!datoscampos.value?.imagen) {
    arrayIMGTaller.value = [];
    return;
  }

  try {
    const rutaCompleta = getRutaImagenTaller();
    const verificaDir = await peticiones(link.value + api.value + '/verificadirectorio', { ruta: rutaCompleta }, 'POST', tokenCifrado.value);

    if (verificaDir?.[0] === 'error') {
      await peticiones(link.value + api.value + '/creardirectorio', { ruta: rutaCompleta }, 'POST', tokenCifrado.value);
      arrayIMGTaller.value = [];
      return;
    }

    const archivosNombres = await peticiones(link.value + api.value + '/peticionimagenes', { origen: rutaCompleta }, 'POST', tokenCifrado.value);
    arrayIMGTaller.value = Array.isArray(archivosNombres) && archivosNombres[0] !== 'error' ? archivosNombres : [];
  } catch (error) {
    console.error('[TallerImagen] Error cargando imagenes:', error);
    arrayIMGTaller.value = [];
  }
};

const getImagenTallerSrc = (imagen) => {
  if (!imagen) return '';
  if (typeof imagen === 'object') {
    if (imagen.url && !String(imagen.url).startsWith('file:')) return imagen.url;
    if (imagen.nombre) return `${link.value}/vista/img/taller/${datoscampos.value.imagen}/${imagen.nombre}`;
  }
  if (/^(https?:|data:|blob:)/.test(String(imagen))) return imagen;
  return `${link.value}/vista/img/taller/${datoscampos.value.imagen}/${imagen}`;
};

const obtenerNombreImagenTaller = (imagen) => {
  if (!imagen) return '';
  if (typeof imagen === 'object') return imagen.nombre || imagen.name || '';
  return String(imagen).split(/[\\/]/).pop();
};

const handleUploadImagenTaller = async (event) => {
  await asegurarImagenTaller();
  const archivos = event.files || [];
  const ruta = getRutaImagenTaller();

  for (const archivo of archivos) {
    const formData = new FormData();
    formData.append('imagen[]', archivo);
    formData.append('ruta', ruta);

    try {
      const response = await fetch(link.value + api.value + '/subirunaimagen2', {
        method: 'POST',
        headers: { Authorization: tokenCifrado.value },
        body: formData
      });
      const resultado = await response.json();

      if (resultado?.[0]?.status === 'ok' || resultado?.[0]?.status === true) {
        await cargarImagenesTaller();
        toast.add({ severity: 'success', summary: 'Exito', detail: 'Imagen subida', life: 3000 });
      } else {
        console.error('[TallerImagen] Error subiendo imagen:', resultado);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al subir la imagen.', life: 3000 });
      }
    } catch (error) {
      console.error('[TallerImagen] Error subiendo imagen:', error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al subir la imagen.', life: 3000 });
    }
  }
};

const deleteImagenTaller = async (imagen) => {
  const nombreArchivo = obtenerNombreImagenTaller(imagen);
  if (!nombreArchivo || !datoscampos.value?.imagen) return;

  const envioDatos = await enviarDatosPorPost(
    link.value + api.value + '/borrararchivo',
    { ruta: getRutaImagenTaller(), archivo: nombreArchivo },
    tokenCifrado.value
  );

  if (envioDatos?.success || envioDatos?.[0] === 'ok') {
    await cargarImagenesTaller();
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Imagen borrada', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar la imagen.', life: 3000 });
  }
};
/************************************************************************/
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

const abrirWhatsapp = ()=>{
     showWhatsAppModal()
}

const obtenerUrlFirmaEntrega = () => {
  const baseUrl = window.location.origin || ''
  return `${baseUrl}/firma-entrega-taller/${encodeURIComponent(datoscampos.value?.no_factura || '')}`
}

const enviarFirmaEntregaWhatsapp = () => {
  if (!datoscampos.value?.no_factura) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'La orden no tiene numero para generar enlace.', life: 3000 });
    return
  }

  datosWhatsApp.value.nombre = datoscampos.value.nombre || 'Cliente'
  datosWhatsApp.value.numero = datoscampos.value.whatsapp || datoscampos.value.telefono || ''
  datosWhatsApp.value.texto = `Hola ${datoscampos.value.nombre || ''}, para completar la entrega de su equipo ${datoscampos.value.equipo || ''} ${datoscampos.value.marca || ''} ${datoscampos.value.modelo || ''}, firme aqui: ${obtenerUrlFirmaEntrega()}`
  showWhatsAppModal()
}

/***************************************************** */
const mensaje = ref('')
const showWhatsapp = ref(false);
const closeWhatsapp = () => {
    showWhatsapp.value = false;
};

/****************************************************** */
// Sistema de Ganancias y Pagos
/****************************************************** */
const visiblePagoTecnico = ref(false);
const datosPago = ref({
  fecha_pago: nfecha('fecha'),
  monto_pagado: '0.00',
  metodo_pago: 'EFECTIVO',
  notas: '',
  pagado_por: ''
});
const historialPagos = ref([]);

// Computed para el dashboard de ganancias
const dashboardGanancias = computed(() => {
  const total = parseFloat(datoscampos.value?.total) || 0;
  const preciopiezas = parseFloat(datoscampos.value?.preciopiezas) || 0;
  const beneficioTecnico = parseFloat(datoscampos.value?.beneficio_tecnico) || 0;
  const beneficioEmpresa = parseFloat(datoscampos.value?.beneficio_empresa) || 0;
  const gananciaNetat = total - preciopiezas;
  const porcentajeTecnico = parseFloat(datoscampos.value?.porcentaje_tecnico) || 0;
  const porcentajeEmpresa = 100 - porcentajeTecnico;

  return {
    total: total.toFixed(2),
    preciopiezas: preciopiezas.toFixed(2),
    gananciaNeta: gananciaNetat.toFixed(2),
    beneficioTecnico: beneficioTecnico,
    beneficioEmpresa: beneficioEmpresa,
    porcentajeTecnico: porcentajeTecnico.toFixed(0),
    porcentajeEmpresa: porcentajeEmpresa.toFixed(0),
    // Para el gráfico de pastel
    chartData: {
      labels: ['Empresa', 'Técnico', 'Costo Piezas'],
      datasets: [{
        data: [beneficioEmpresa, beneficioTecnico, preciopiezas],
        backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#2563eb', '#dc2626']
      }]
    },
    chartOptions: {
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  };
});
watchEffect(() => {
  if (showWhatsapp.value) {
    datosWhatsApp.value.nombre = datoscampos.value.nombre;
    datosWhatsApp.value.numero = datoscampos.value.whatsapp || datoscampos.value.telefono
    datosWhatsApp.value.texto = `Hola ${datoscampos.value.nombre} le escribimos de  *${datosEmpresa.empresa.nombre}* para informarle que su equipo se encuentra *${datoscampos.value.estado}*`;
    showWhatsAppModal()
  }
});
/************************************************************************/
const abono = ref('0.00');
const prioridad = ref('3');
/************************************************************************/
// Flag para controlar qué campo está siendo editado y evitar loops infinitos
const calculandoEditarTaller = ref(false);

// Watcher para calcular automáticamente cuando cambia el total
watch(() => datoscampos.value?.total, (nuevoTotal) => {
  if (calculandoEditarTaller.value || !datoscampos.value) return;

  calculandoEditarTaller.value = true;

  const total = parseFloat(nuevoTotal) || 0;
  const preciopiezas = parseFloat(datoscampos.value.preciopiezas) || 0;

  // Si se ingresa total y hay piezas, calcular mano de obra
  if (preciopiezas > 0) {
    datoscampos.value.manodeobra = Math.max(0, total - preciopiezas).toFixed(2);
  } else {
    // Si no hay piezas, la mano de obra es igual al total
    datoscampos.value.manodeobra = total.toFixed(2);
  }

  // Recalcular saldo
  const abonoTotal = parseFloat(abono.value) || 0;
  datoscampos.value.saldo = (total - abonoTotal).toFixed(2);

  calculandoEditarTaller.value = false;
});

// Watcher para calcular el total cuando cambia la mano de obra
watch(() => datoscampos.value?.manodeobra, (nuevaManoDeObra) => {
  if (calculandoEditarTaller.value || !datoscampos.value) return;

  calculandoEditarTaller.value = true;

  const manodeobra = parseFloat(nuevaManoDeObra) || 0;
  const preciopiezas = parseFloat(datoscampos.value.preciopiezas) || 0;

  // Calcular total sumando mano de obra + piezas
  const total = manodeobra + preciopiezas;
  datoscampos.value.total = total.toFixed(2);

  // Recalcular saldo
  const abonoTotal = parseFloat(abono.value) || 0;
  datoscampos.value.saldo = (total - abonoTotal).toFixed(2);

  calculandoEditarTaller.value = false;
});

// Watcher para recalcular cuando cambia el costo de piezas
watch(() => datoscampos.value?.preciopiezas, (nuevoPrecioPiezas) => {
  if (calculandoEditarTaller.value || !datoscampos.value) return;

  calculandoEditarTaller.value = true;

  const preciopiezas = parseFloat(nuevoPrecioPiezas) || 0;
  const total = parseFloat(datoscampos.value.total) || 0;

  // Siempre calcular mano de obra restando pieza del total, SIN cambiar el total
  datoscampos.value.manodeobra = Math.max(0, total - preciopiezas).toFixed(2);

  calculandoEditarTaller.value = false;
});

// Watcher para recalcular saldo cuando cambia el abono
watch(() => abono.value, (nuevoAbono) => {
  if (calculandoEditarTaller.value || !datoscampos.value) return;

  const total = parseFloat(datoscampos.value.total) || 0;
  const abonoTotal = parseFloat(nuevoAbono) || 0;
  datoscampos.value.saldo = (total - abonoTotal).toFixed(2);
});

/************************************************************************/
const fetchAllData = async () => {
    const response = await peticionesFetchOffline('getDataAsArray', 'taller');
    const jsonData = response;
    todosLosTaller.value = jsonData;
    datoscampos.value = jsonData.find(datos=>datos.id == route.params.id)

    // Inicializar accesorios si no es un JSON válido
    if (!datoscampos.value.accesorios || datoscampos.value.accesorios === '') {
        datoscampos.value.accesorios = '[]';
    }
    try {
        JSON.parse(datoscampos.value.accesorios);
    } catch (e) {
        datoscampos.value.accesorios = '[]';
    }

    const datosJSON = obtenerAbonosOrden()
    abono.value = datosJSON.reduce((total, item) => {
    return total + parseFloat(item.abono || '0.00');
}, 0).toFixed(2);
    prioridad.value = datosJSON[0]?.prioridad || '3';

    // Cargar historial de pagos al técnico
    cargarHistorialPagos();
    await cargarImagenesTaller();
};
/************************************************************************/
/************************************************************************/
async function navigate(action) {
    const currentIndex = todosLosTaller.value.findIndex(taller => taller.id == route.params.id);
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
            newIndex = currentIndex + 1 < todosLosTaller.value.length ? currentIndex + 1 : currentIndex;
            break;
        case 'ultimo':
            newIndex = todosLosTaller.value.length - 1;
            break;
        default:
            return;
    }
    datoscampos.value = todosLosTaller.value[newIndex];

    // Inicializar accesorios si no es un JSON válido
    if (!datoscampos.value.accesorios || datoscampos.value.accesorios === '') {
        datoscampos.value.accesorios = '[]';
    }
    try {
        JSON.parse(datoscampos.value.accesorios);
    } catch (e) {
        datoscampos.value.accesorios = '[]';
    }

    const datosJSON = obtenerAbonosOrden()
    abono.value = datosJSON.reduce((total, item) => {
    return total + parseFloat(item.abono || '0.00');
}, 0).toFixed(2);
    router.push({ path: `/editartaller/${todosLosTaller.value[newIndex].id}` });
    await cargarImagenesTaller();
}
/************************************************************************/
const fallas = ref([])
const proveedoresData = ref([])
/************************************************************************/

const fetchProveedores = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
    proveedoresData.value = response;
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to fetch data from proveedores', 
      life: 3000 
    });
  }
};

/************************************************************************/
const datosBarcode = ref({})
/************************************************************************/
const fetchDataBarcode = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'barcode');
    const jsonData = response[0];
    datosBarcode.value = jsonData;
};
/************************************************************************/

const fetchProductosDatosarraypost = async () => {
  try {
    await crearTablaSiNoExisteOffline('piezas_celulares', [
      'id',
      'created_at',
      'updated_at',
      'codigo',
      'nombre',
      'categoria',
      'modelo_compatible',
      'stock',
      'stock_minimo',
      'costo',
      'precio_venta',
      'ubicacion',
      'suplidor',
      'observaciones',
      'estado',
      'usuario'
    ], toast);
    const response = await peticionesFetchOffline('getDataAsArray', 'piezas_celulares', '');
    productosArray.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error cargando piezas disponibles:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las piezas disponibles',
      life: 3000
    });
  }
};

/************************************************************************/
const asegurarCamposProfesionalesTaller = async () => {
  try {
    const columnas = await peticionesFetchOffline('getTableColumns', 'taller');
    const actuales = Array.isArray(columnas) ? columnas : [];
    for (const campo of ['piezas_usadas','firma_entrega','firma_entrega_nombre','firma_entrega_fecha','firma_entrega_documento','firma_entrega_token']) {
      if (!actuales.includes(campo)) {
        await peticionesFetchOffline('addColumnToTable', { tabla: 'taller', campo });
      }
    }
  } catch (error) {
    console.warn('No se pudieron asegurar los campos profesionales de taller:', error);
  }
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
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

datosUsuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0];

await crearTablaSiNoExisteOffline('taller', ['historial_orden','imagen','piezas_usadas','firma_entrega','firma_entrega_nombre','firma_entrega_fecha','firma_entrega_documento','firma_entrega_token'], toast)
await asegurarCamposProfesionalesTaller()
await fetchAllData()
await fetchProveedores()
await fetchDataBarcode()
await fetchProductosDatosarraypost()


});
/************************************************************************/
const funcionActualizar = async (evento = null)=> {
  const url = link.value+api.value+"/actualizarcampos/taller";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return false;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp')
    }

  const datosJSON = asegurarAbonoBaseOrden(obtenerAbonosOrden())
  datosJSON[0].prioridad = prioridad.value

 //prioridad

 datoscampos.value.abono = JSON.stringify(datosJSON)
  registrarEventoOrden(datoscampos.value, evento || {
    tipo: 'actualizacion',
    titulo: 'Datos actualizados',
    detalle: 'Se guardaron cambios generales desde la vista de edicion.'
  })
  
  const envioDatos = await peticionesFetchOffline('updateData','taller', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
     return true;
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
    return false;
  }
}
/************************************************************************/
const calcularTotalYSaldo = () => {
  if (!datoscampos.value) return;
  const manoDeObra = parseFloat(datoscampos.value.manodeobra) || 0;
  const precioPiezas = parseFloat(datoscampos.value.preciopiezas) || 0;
  const abono2 = parseFloat(abono.value) || 0;

  const total = manoDeObra + precioPiezas;
  const saldo = total - abono2;

  datoscampos.value.total = total.toFixed(2);
  datoscampos.value.saldo = saldo.toFixed(2);
/*  const datos = {"abono":abono.value,"prioridad":prioridad.value,"recibidopor":"Soporte","turno":"280420241514073","cajero":"soporte@versatframework.com","metodo_pago":datoscampos.value.metodopago,"hora":nfecha('hora'),"fecha":nfecha('fecha')};
  datoscampos.value.abono = JSON.stringify([datos]);*/


};
watch(
  () => [datoscampos.value?.manodeobra, datoscampos.value?.preciopiezas, abono.value],
  () => {
    calcularTotalYSaldo();
  }
);
/************************************************************************/
const completar = async ()=>{
   datoscampos.value.estado = 'Reparado';
   await funcionActualizar();
   showWhatsapp.value = true;
}
/************************************************************************/
const fnAbonar = async () => {
  const saldoTotal = Number(datoscampos.value.saldo);

  if (saldoTotal === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe agregar Costo de Reparación.', life: 3000 });
    return;
  }

  nuevoAbonoTaller.value = {
    abono: saldoTotal,
    metodo_pago: 'EFECTIVO'
  };
  visibleAbonarModal.value = true;
};

const guardarNuevoAbonoTaller = async (pagarCompleto = false) => {
  const saldoTotal = Number(datoscampos.value.saldo || 0);
  let cantidadAbono = pagarCompleto ? saldoTotal : Number(nuevoAbonoTaller.value.abono || 0);
  const metodoPago = nuevoAbonoTaller.value.metodo_pago || 'EFECTIVO';

  if (saldoTotal <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No hay saldo disponible para abonar', life: 3000 });
    return;
  }

  if (cantidadAbono <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debes ingresar una cantidad válida de abono', life: 3000 });
    return;
  }

  const abonoJSON = JSON.parse(datoscampos.value.abono || '[]');
  const nuevoAbono = {
    abono: cantidadAbono,
    turno: datosUsuarioLocal.value.token,
    cajero: datosUsuarioLocal.value.email,
    recibidopor: datosUsuarioLocal.value.email,
    prioridad: 3,
    metodo_pago: metodoPago,
    hora: nfecha('hora'),
    fecha: nfecha('fecha'),
    created_at: nfecha('timestamp'),
    saldo: Math.max(saldoTotal - cantidadAbono, 0).toFixed(2)
  };
  abonoJSON.push(nuevoAbono);

  datoscampos.value.abono = JSON.stringify(abonoJSON);
  recalcularAbonosTaller();
  visibleAbonarModal.value = false;

  const tallerActualizado = await funcionActualizar({
    tipo: 'abono',
    titulo: pagarCompleto ? 'Pago completo registrado' : 'Abono registrado',
    detalle: `Se registro un ${pagarCompleto ? 'pago completo' : 'abono'} de RD$ ${cantidadAbono.toFixed(2)} con ${metodoPago}.`
  });
  if (!tallerActualizado) return;
  notificarAbonoTaller(datoscampos.value, nuevoAbono);
  imrpimirOrden();

  toast.add({
    severity: 'success',
    summary: 'Abono',
    detail: `Abono de RD$ ${cantidadAbono.toFixed(2)} realizado correctamente con ${metodoPago}`,
    life: 3000
  });
};

/************************************************************************/
const fnCostoreparacion = () => {
  const facturaTaller = datoscampos.value;
  if (!facturaTaller) {
    Swal.fire("Error", "No hay una orden seleccionada", "error");
    return;
  }

  const totalActual = Number(facturaTaller.total || 0);
  const manodeobraActual = Number(facturaTaller.manodeobra || 0);
  const preciopiezasActual = Number(facturaTaller.preciopiezas || 0);
  const tieneDesglose = manodeobraActual > 0 || preciopiezasActual > 0;

  formularioCostoReparacion.value = {
    total: totalActual,
    manodeobra: tieneDesglose ? manodeobraActual : totalActual,
    preciopiezas: preciopiezasActual
  };
  visibleCostoReparacion.value = true;
};

const aplicarCostoReparacion = async() => {
  if (!datoscampos.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No hay una orden seleccionada', life: 3000 });
    return;
  }

  const manodeobra = Number(formularioCostoReparacion.value.manodeobra || 0);
  const preciopiezas = Number(formularioCostoReparacion.value.preciopiezas || 0);
  const total = Number(totalCostoReparacion.value || 0);

  if (!Number.isFinite(manodeobra) || manodeobra < 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'La mano de obra debe ser 0.00 o mayor', life: 3000 });
    return;
  }

  if (!Number.isFinite(preciopiezas) || preciopiezas < 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El costo de piezas debe ser 0.00 o mayor', life: 3000 });
    return;
  }

  if (!Number.isFinite(total) || total <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El costo total debe ser mayor a 0.00', life: 3000 });
    return;
  }

  const porcentajeTecnico = Number(datoscampos.value.porcentaje_tecnico || 0);
  const gananciaNeta = total - preciopiezas;
  const beneficioTecnico = (gananciaNeta * (porcentajeTecnico / 100)).toFixed(2);
  const beneficioEmpresa = (gananciaNeta - Number(beneficioTecnico)).toFixed(2);
  const totalAbonado = Number(abono.value || 0);

  datoscampos.value.manodeobra = manodeobra.toFixed(2);
  datoscampos.value.preciopiezas = preciopiezas.toFixed(2);
  datoscampos.value.total = total.toFixed(2);
  datoscampos.value.saldo = Math.max(0, total - totalAbonado).toFixed(2);
  datoscampos.value.beneficio_tecnico = beneficioTecnico;
  datoscampos.value.beneficio_empresa = beneficioEmpresa;

  visibleCostoReparacion.value = false;
  await funcionActualizar({
    tipo: 'costo-reparacion',
    titulo: 'Costo de reparacion actualizado',
    detalle: `Mano de obra: RD$ ${manodeobra.toFixed(2)} | Piezas: RD$ ${preciopiezas.toFixed(2)} | Total: RD$ ${total.toFixed(2)}.`
  });
};
/************************************************************************/
const entregar = async () => {

   if(Number(datoscampos.value.total) === 0){
     toast.add({ severity: 'error', summary: 'Error', detail: 'Debe agregar Costo de Reparación.', life: 3000 });
    return
   }

  // Mostrar SweetAlert para seleccionar el método de pago antes de proceder
  const { value: metodoPago } = await Swal.fire({
    title: 'Selecciona el método de pago',
    input: 'select',
    inputOptions: {
      'EFECTIVO': 'Efectivo',
      'TARJETA': 'Tarjeta',
      'TRANSFERENCIA': 'Transferencia'
    },
    inputPlaceholder: 'Selecciona el método de pago',
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Debes seleccionar un método de pago';
      }
    }
  });

  if (!metodoPago) {
    // Si el usuario cancela, no hacemos nada
    Swal.fire('Cancelado', 'No se realizó la entrega', 'error');
    return;
  }

  // Si el método de pago fue seleccionado correctamente, procedemos
  datoscampos.value.estado = 'Entregado';
  
  // Parsear el JSON del abono existente
  const abonoJSON = JSON.parse(datoscampos.value.abono);
  
  // Agregar el nuevo abono con el método de pago seleccionado
  const nuevoAbono = {
    "abono": datoscampos.value.saldo,
    "turno": datosUsuarioLocal.value.token,
    "cajero": datosUsuarioLocal.value.email,
    "metodo_pago": metodoPago,  // Método de pago seleccionado
    "hora": nfecha('hora'),
    "fecha": nfecha('fecha'),
    "created_at": nfecha('timestamp'),
    "saldo": '0.00'
  };
  abonoJSON.push(nuevoAbono);

  // Convertir el abono actualizado a una cadena JSON
  datoscampos.value.abono = JSON.stringify(abonoJSON);
  datoscampos.value.saldo = '0.00';
  datoscampos.value.fecha_entrega = nfecha('fecha');

  // Llamar a la función de actualización y luego imprimir la orden
  const tallerActualizado = await funcionActualizar({
    tipo: 'entrega',
    titulo: 'Orden entregada',
    detalle: `Entrega registrada con pago por ${metodoPago}.`
  });
  if (!tallerActualizado) return;
  notificarAbonoTaller(datoscampos.value, nuevoAbono, 'Taller - entrega de orden');
  imrpimirOrden();
  
  // Mostrar confirmación de que se ha realizado la entrega
  Swal.fire({
    title: 'Entregado',
    text: `La entrega se ha realizado con éxito mediante ${metodoPago}.`,
    icon: 'success'
  });
};

/************************************************************************/
const imrpimirOrden = async ()=>{
 //window.electron.ipcRenderer.invoke('open-new-window', link.value+'/vista/tallertermica?factura='+datoscampos.value.no_factura,'url',false,true)
 const datosEmpresa = JSON.stringify(enviarDatosLocalStorage())
 const datos = JSON.stringify(datoscampos.value)
await window.electron.ipcRenderer.invoke('recibotaller',datos,datosEmpresa,false,true,true);
}
/************************************************************************/
const printBarcode = (barcode,texto) => {
    const content = {
        barcodeData: {
            barcodetype: datosBarcode.value.barcodetype,
            barwidth: parseInt(datosBarcode.value.barwidth),
            barheight: parseInt(datosBarcode.value.barheight),
            labelwidth: parseInt(datosBarcode.value.labelwidth),
            labelheight: parseInt(datosBarcode.value.labelheight),
            fontsize: parseInt(datosBarcode.value.fontsize),
            margen_izq: parseInt(datosBarcode.value.margen_izq),
            margen_der: parseInt(datosBarcode.value.margen_der),
            margen_sup: parseInt(datosBarcode.value.margen_sup),
            margen_inf: parseInt(datosBarcode.value.margen_inf),
            codigo: barcode,
        },
        labelWidth: parseInt(datosBarcode.value.labelwidth),
        labelHeight: parseInt(datosBarcode.value.labelheight),
        margins: {
            top: parseInt(datosBarcode.value.margen_sup),
            right: parseInt(datosBarcode.value.margen_der),
            bottom: parseInt(datosBarcode.value.margen_inf),
            left: parseInt(datosBarcode.value.margen_izq)
        },
        incluirCabecera:true,
        incluirTexto:true,
        incluirCodigo:false,
        incluirOtro:false,
        incluirPrecio:false,
        headerText: datosEmpresa.empresa.nombre,
        code: barcode,
        text: texto,
        precio: '',
        width: parseInt(datosBarcode.value.barwidth),
        height: parseInt(datosBarcode.value.barheight),
        fontSize: parseInt(datosBarcode.value.fontsize),
        cantidad: 1,
        tipo: datosBarcode.value.barcodetype,
        printerName: 'Zebra'
    };
    window.electron.ipcRenderer.invoke('print-barcode', content);

};
/************************************************************************/
const imrpimirEtiqueta = async ()=>{

await printBarcode(datoscampos.value.no_factura,datoscampos.value.nombre)

/* window.electron.ipcRenderer.invoke('open-new-window', link.value+'/vista/impresoraequipo?factura='+datoscampos.value.no_factura,'url',true,false)*/
}
/************************************************************************/
const imprimirMicrosoldadura = async () => {
   const datosMicroSoldadura = await peticionesFetchOffline('getDataArrayByCondition', 'documentos', 'nombre', 'MICRO SOLDADURA');

   if (!datosMicroSoldadura || datosMicroSoldadura.length === 0) {
      toast.add({
         severity: 'error',
         summary: 'Error',
         detail: 'No se encontró el documento MICRO SOLDADURA',
         life: 3000
      });
      return;
   }

   const id = datoscampos.value.id;
   const cedula = datoscampos.value.cedula;
   const datosOrden = datoscampos.value;
   const equipo = `[${datosOrden.equipo}, Marca: ${datosOrden.marca}, Modelo: ${datosOrden.modelo}, Serial: ${datosOrden.serial}]`;
   const datosCliente = await peticionesFetchOffline('getDataArrayByCondition', 'clientes', 'cedula', cedula);

   let nombreCliente = datosOrden.nombre || 'N/A';
   let direccionCliente = datosOrden.direccion || 'N/A';

   if (datosCliente && datosCliente.length > 0) {
      nombreCliente = datosCliente[0].nombre || nombreCliente;
      direccionCliente = datosCliente[0].direccion || direccionCliente;
   }

   const mensaje = variableEnString(datosMicroSoldadura[0].cuerpo, {
      fecha: nfecha('fecha'),
      cliente: nombreCliente,
      cedula,
      direccion: direccionCliente,
      empresa: datosEmpresa.empresa.nombre,
      equipo
   });

   const htmlToPlainText = (html) => {
      let result = html
         .replace(/<br\s*\/?>/gi, '\n')
         .replace(/<\/p>/gi, '\n\n')
         .replace(/<p>/gi, '');

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = result;
      return tempDiv.textContent || tempDiv.innerText || '';
   };

   const textoLimpio = htmlToPlainText(mensaje);
   const doc = new jsPDF({ unit: 'mm', format: 'a4' });
   const pageWidth = doc.internal.pageSize.getWidth();
   const pageHeight = doc.internal.pageSize.getHeight();
   const margin = 16;
   const maxWidth = pageWidth - (margin * 2);
   const empresaNombre = datosEmpresa.empresa.nombre || 'TALLER';
   const empresaDireccion = datosEmpresa.empresa.direccion || '';
   const empresaTelefono = datosEmpresa.empresa.telefono || '';
   const fechaDocumento = nfecha('fecha');
   const numeroOrden = datosOrden.no_factura || id;
   let currentY = margin;

   const drawFooter = () => {
      doc.setDrawColor(210, 214, 220);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Orden #${numeroOrden}`, margin, pageHeight - 7);
      doc.text(`Emitido el ${fechaDocumento}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      doc.setTextColor(15, 23, 42);
   };

   const drawField = (label, value, x, y, width) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(label, x, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(value || 'N/A', width);
      doc.text(lines, x, y + 5);
      return y + 5 + (lines.length * 4.5);
   };

   const addParagraph = (text) => {
      doc.setFont('times', 'normal');
      doc.setFontSize(10.5);
      const lines = doc.splitTextToSize(text, maxWidth);

      lines.forEach((line) => {
         if (currentY + 5.2 > pageHeight - 24) {
            drawFooter();
            doc.addPage();
            currentY = margin;
         }
         doc.text(line, margin, currentY, { maxWidth, align: 'justify' });
         currentY += 5.2;
      });

      currentY += 2;
   };

   const headerLeftWidth = maxWidth * 0.46;
   const headerRightWidth = maxWidth * 0.44;
   const empresaNombreLines = doc.splitTextToSize(empresaNombre.toUpperCase(), headerLeftWidth);
   const empresaInfoLines = doc.splitTextToSize(
      [empresaDireccion, empresaTelefono].filter(Boolean).join(' | ') || 'Servicio técnico especializado',
      headerLeftWidth
   );
   const tituloLines = doc.splitTextToSize('CONTRATO DE SERVICIO DE MICRO SOLDADURA', headerRightWidth);
   const headerContentHeight = Math.max(
      10 + (empresaNombreLines.length * 6) + (empresaInfoLines.length * 4.5),
      10 + (tituloLines.length * 5) + 10
   );
   const headerHeight = Math.max(30, headerContentHeight);

   doc.setFillColor(15, 23, 42);
   doc.roundedRect(margin, currentY, maxWidth, headerHeight, 3, 3, 'F');
   doc.setTextColor(255, 255, 255);

   doc.setFont('helvetica', 'bold');
   doc.setFontSize(18);
   doc.text(empresaNombreLines, margin + 6, currentY + 10);

   doc.setFont('helvetica', 'normal');
   doc.setFontSize(10);
   doc.text(empresaInfoLines, margin + 6, currentY + 10 + (empresaNombreLines.length * 6));

   doc.setFont('helvetica', 'bold');
   doc.setFontSize(12);
   doc.text(tituloLines, pageWidth - margin - 6, currentY + 10, { align: 'right' });

   doc.setFont('helvetica', 'normal');
   doc.setFontSize(9.5);
   const rightMetaY = currentY + 10 + (tituloLines.length * 5) + 3;
   doc.text(`Fecha: ${fechaDocumento}`, pageWidth - margin - 6, rightMetaY, { align: 'right' });
   doc.text(`Orden: ${numeroOrden}`, pageWidth - margin - 6, rightMetaY + 5, { align: 'right' });

   currentY += headerHeight + 8;

   doc.setDrawColor(203, 213, 225);
   doc.setFillColor(248, 250, 252);
   doc.roundedRect(margin, currentY, maxWidth, 34, 2, 2, 'FD');

   const leftBottom = Math.max(
      drawField('Cliente', nombreCliente, margin + 5, currentY + 7, (maxWidth / 2) - 8),
      drawField('Cédula', cedula || 'N/A', margin + 5, currentY + 21, (maxWidth / 2) - 8)
   );

   const rightBottom = Math.max(
      drawField('Dirección', direccionCliente, margin + (maxWidth / 2) + 2, currentY + 7, (maxWidth / 2) - 8),
      drawField('Equipo', equipo, margin + (maxWidth / 2) + 2, currentY + 21, (maxWidth / 2) - 8)
   );

   currentY = Math.max(leftBottom, rightBottom) + 6;

   doc.setFont('helvetica', 'bold');
   doc.setFontSize(11);
   doc.setTextColor(15, 23, 42);
   doc.text('Términos del servicio', margin, currentY);
   currentY += 6;

   textoLimpio
      .split(/\n\s*\n/)
      .map(parrafo => parrafo.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .forEach(addParagraph);

   if (currentY + 28 > pageHeight - 20) {
      drawFooter();
      doc.addPage();
      currentY = margin;
   } else {
      currentY += 10;
   }

   doc.setDrawColor(30, 41, 59);
   doc.line(margin + 5, currentY, margin + 70, currentY);
   doc.line(pageWidth - margin - 70, currentY, pageWidth - margin - 5, currentY);
   doc.setFont('helvetica', 'bold');
   doc.setFontSize(9);
   doc.text('Firma del cliente', margin + 37.5, currentY + 6, { align: 'center' });
   doc.text('Recibido por la empresa', pageWidth - margin - 37.5, currentY + 6, { align: 'center' });

   drawFooter();

   if (pdfUrlMicrosoldadura.value) {
      URL.revokeObjectURL(pdfUrlMicrosoldadura.value);
   }

   const pdfBlob = doc.output('blob');
   const url = URL.createObjectURL(pdfBlob);
   pdfUrlMicrosoldadura.value = url;
   pdfDialogMicrosoldadura.value = true;

   toast.add({
      severity: 'success',
      summary: 'PDF Generado',
      detail: 'Contrato de Micro Soldadura listo',
      life: 3000
   });
}
/************************************************************************/
const generarPdfOrdenTaller = async () => {
   const orden = datoscampos.value || {};
   if (!orden.id && !orden.no_factura) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No hay orden disponible para imprimir', life: 3000 });
      return;
   }

   const result = await Swal.fire({
      title: 'Imprimir Orden',
      text: 'Seleccione el formato para la orden de taller',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Térmico 80mm',
      denyButtonText: 'Carta (Letter)',
      cancelButtonText: 'Cancelar'
   });

   if (result.isConfirmed) {
      ordenParaImprimir.value = { ...orden };
      formatoImpresion.value = '80mm';
      visibleImpresoraTaller.value = true;
   } else if (result.isDenied) {
      ordenParaImprimir.value = { ...orden };
      formatoImpresion.value = 'carta';
      visibleImpresoraTaller.value = true;
   }
};
/************************************************************************/

const fnEditarAbono = (index, item, tableId) => {
  if (tableId === 'abonosTable') {
    abonoEditandoIndex.value = index;
    abonoEditando.value = {
      abono: Number(item.abono || 0),
      metodo_pago: item.metodo_pago || 'EFECTIVO',
      fecha: item.fecha || nfecha('fecha'),
      hora: item.hora || nfecha('hora'),
      recibidopor: item.recibidopor || datosUsuarioLocal.value.email || '',
      cajero: item.cajero || datosUsuarioLocal.value.email || '',
      turno: item.turno || datosUsuarioLocal.value.token || '',
      prioridad: item.prioridad || 3,
      created_at: item.created_at || nfecha('timestamp')
    };
    visibleEditarAbono.value = true;
  }
};

const recalcularAbonosTaller = () => {
  const abonoJSON = JSON.parse(datoscampos.value.abono || '[]');
  const sumaAbonos = abonoJSON.reduce((acumulador, objeto) => acumulador + (parseFloat(objeto.abono) || 0), 0);
  abono.value = sumaAbonos.toFixed(2);
  datoscampos.value.saldo = (Number(datoscampos.value.total || 0) - sumaAbonos).toFixed(2);
  datoscampos.value.abono = JSON.stringify(abonoJSON);
};

const guardarEdicionAbono = async () => {
  if (abonoEditandoIndex.value < 0) return;

  const montoAbono = Number(abonoEditando.value.abono || 0);
  if (montoAbono <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe ingresar un monto válido', life: 3000 });
    return;
  }

  const abonoJSON = JSON.parse(datoscampos.value.abono || '[]');
  if (!abonoJSON[abonoEditandoIndex.value]) return;

  abonoJSON[abonoEditandoIndex.value] = {
    ...abonoJSON[abonoEditandoIndex.value],
    ...abonoEditando.value,
    abono: montoAbono,
    updated_at: nfecha('timestamp')
  };

  datoscampos.value.abono = JSON.stringify(abonoJSON);
  recalcularAbonosTaller();
  visibleEditarAbono.value = false;
  await funcionActualizar({
    tipo: 'abono-edicion',
    titulo: 'Abono editado',
    detalle: `Se modifico un abono a RD$ ${montoAbono.toFixed(2)}.`
  });
};



const fnBorrarAbono = (index,tableId)=>{
  console.log("index", index);
  if (tableId === 'abonosTable') {
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

       if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value ) {
          //const index = event;
          const abonoJSON = JSON.parse(datoscampos.value.abono)
          const nuevoAbono = abonoJSON.filter((abono,i)=> i !== index)
          datoscampos.value.abono = JSON.stringify(nuevoAbono);
          recalcularAbonosTaller();
          await funcionActualizar();
         } else {
         toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        }
      
    }
  })
}
}
/************************************************************************/
const fnAgregarFalla = async()=>{

  const fallasArray = JSON.parse(datoscampos.value.fallas)
  const fallasN = convertirStringAArrayDeObjetos(fallasChips.value)
  const nuevasFallas = fallasArray.concat(fallasN)
  datoscampos.value.fallas = JSON.stringify(nuevasFallas)
toast.add({ severity: 'success', summary: 'OK', detail: 'Fallas Agregadas', life: 3000 });
fallasChips.value = []
visibleAverias.value = false
await funcionActualizar();
}
/************************************************************************/
const fnEditarFalla = (index, item, tableId) => {
  if (tableId === 'fallasTable') {
    // Lógica para editar fallas
    console.log("Editar falla en índice:", index, "Item:", item);
   datoscamposPedido.value.pieza_pedido = item.propiedad
   visiblePedidoIndividual.value = true

  }
};


const fnBorrarFalla = (index, tableId) => {
  if (tableId === 'fallasTable') {
    Swal.fire({
      title: 'Introduce la contraseña',
      input: 'password',
      inputPlaceholder: 'Contraseña',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      preConfirm: (password) => {
        // Aquí puedes agregar la lógica para verificar la contraseña
        // Por ejemplo, puedes comparar la contraseña ingresada con una contraseña almacenada
        const correctPassword = '1234'; // Reemplaza esto con tu lógica de verificación de contraseña
        if (password === correctPassword) {
          return true;
        } else {
          Swal.showValidationMessage('Contraseña incorrecta');
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Lógica para borrar fallas
        console.log("Borrar falla en índice:", index);
        // Aquí puedes agregar la lógica para eliminar la falla del array de datos
        // Por ejemplo:
        const fallasArray = JSON.parse(datoscampos.value.fallas);
        const nuevoAbono = fallasArray.filter((falla, i) => i !== index);
        datoscampos.value.fallas = JSON.stringify(nuevoAbono);
        // Llamar a la función de actualización si es necesario
        funcionActualizar();
      }
    });
  }
};

/************************************************************************/
// Funciones para Accesorios
/************************************************************************/
const fnAgregarAccesorio = async()=>{
  const accesoriosArray = JSON.parse(datoscampos.value.accesorios || '[]')
  const accesoriosN = convertirStringAArrayDeObjetos(accesoriosChips.value)
  const nuevosAccesorios = accesoriosArray.concat(accesoriosN)
  datoscampos.value.accesorios = JSON.stringify(nuevosAccesorios)
  toast.add({ severity: 'success', summary: 'OK', detail: 'Accesorios Agregados', life: 3000 });
  accesoriosChips.value = []
  visibleAccesorios.value = false
  await funcionActualizar();
  await nextTick(); // Forzar actualización del DOM
}

const fnEditarAccesorio = (index, item, tableId) => {
  console.log("fnEditarAccesorio llamada - Index:", index, "Item:", item, "TableId:", tableId);

  if (tableId === 'accesoriosTable') {
    Swal.fire({
      title: 'Editar Accesorio',
      input: 'text',
      inputValue: item.propiedad,
      inputPlaceholder: 'Nombre del accesorio',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const accesoriosArray = JSON.parse(datoscampos.value.accesorios || '[]');
        accesoriosArray[index].propiedad = result.value;
        datoscampos.value.accesorios = JSON.stringify(accesoriosArray);
        await funcionActualizar();
        await nextTick();
        toast.add({ severity: 'success', summary: 'OK', detail: 'Accesorio actualizado', life: 3000 });
      }
    });
  }
};

const fnBorrarAccesorio = (index, tableId) => {
  console.log("fnBorrarAccesorio llamada - Index:", index, "TableId:", tableId);

  if (tableId === 'accesoriosTable') {
    Swal.fire({
      title: '¿Eliminar accesorio?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    }).then(async (result) => {
      if (result.isConfirmed) {
        const accesoriosArray = JSON.parse(datoscampos.value.accesorios || '[]');
        const nuevosAccesorios = accesoriosArray.filter((accesorio, i) => i !== index);
        datoscampos.value.accesorios = JSON.stringify(nuevosAccesorios);
        await funcionActualizar();
        await nextTick();
        toast.add({ severity: 'success', summary: 'OK', detail: 'Accesorio eliminado', life: 3000 });
      }
    });
  }
};

/************************************************************************/
const parsedFallas = computed(() => {
  return JSON.parse(datoscampos.value.fallas);
});
/************************************************************************/
const piezasPedido = ref([])
const fnRealizarPedido = () => {
    const proveedor = proveedorWhatsapp.value;

    if (!proveedor || !proveedor.nombre || !proveedor.telefono) {
        console.error('Datos del proveedor no válidos');
        toast.add({ severity: 'error', summary: 'Error', detail: 'Datos del proveedor no válidos', life: 3000 });
        return;
    }

    if (!datoscampos.value.equipo || !datoscampos.value.marca || !datoscampos.value.modelo) {
        console.error('Datos del equipo no válidos');
        toast.add({ severity: 'error', summary: 'Error', detail: 'Datos del equipo no válidos', life: 3000 });
        return;
    }

    if (piezasPedido.value.length === 0) {
        console.error('No hay piezas seleccionadas');
        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay piezas seleccionadas', life: 3000 });
        return;
    }

    datosWhatsApp.value.nombre = proveedor.nombre;
    datosWhatsApp.value.numero = proveedor.telefono;
    datosWhatsApp.value.texto = `Hola, quiero cotizar las siguientes piezas para un *${datoscampos.value.equipo}, ${datoscampos.value.marca}, ${datoscampos.value.modelo}*: ${piezasPedido.value.join(', ')}`;

    showWhatsAppModal();
};
/************************************************************************/
const fnPedidoIndividual = async()=>{
    const proveedor = proveedorWhatsappIndividual.value;

    if (!proveedor || !proveedor.nombre || !proveedor.telefono) {
        console.error('Datos del proveedor no válidos');
        toast.add({ severity: 'error', summary: 'Error', detail: 'Datos del proveedor no válidos', life: 3000 });
        return;
    }

    if (!datoscampos.value.equipo || !datoscampos.value.marca || !datoscampos.value.modelo) {
        console.error('Datos del equipo no válidos');
         toast.add({ severity: 'error', summary: 'Error', detail: 'Datos del equipo no válidos', life: 3000 });
        return;
    }


    datosWhatsApp.value.nombre = proveedor.nombre;
    datosWhatsApp.value.numero = proveedor.telefono;
    datosWhatsApp.value.texto = `Hola, quiero cotizar las siguientes piezas para un *${datoscampos.value.equipo}, ${datoscampos.value.marca}, ${datoscampos.value.modelo}*: ${datoscamposPedido.value.pieza_pedido}`;

    showWhatsAppModal();
}
/************************************************************************/
const messages = ref([
  { sender: 'ia', text: 'Hola, ¿en qué puedo ayudarte hoy?' }
]);
const newMessage = ref('');
const chatMessages = ref(null);

/************************************************************************/
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
};
/************************************************************************/
const fnConsultaIA = async()=>{
  visiblePedidoIndividual.value = false
  loading.value = true
  const falla = datoscamposPedido.value.pieza_pedido;
  const consulta = `Tengo un ${datoscampos.value.equipo} ${datoscampos.value.marca} ${datoscampos.value.modelo} con la falla de ${falla}`;
    messages.value.push({ sender: 'user', text: consulta });
    try {
    const result = await window.electron.ipcRenderer.invoke('chatGpt',consulta);
    loading.value = false
     toast.add({ severity: 'success', summary: 'Ok', detail: 'Respuesta del Bot', life: 3000 });
    datoscamposIa.value.contexto = result
    messages.value.push({ sender: 'ia', text: result });
    visibleIA.value = true;
     scrollToBottom();

  } catch (error) {
    loading.value = false
     toast.add({ severity: 'error', summary: 'Error', detail: 'Error de consulta', life: 3000 });
  }
}
/************************************************************************/
const fnEnvioIA = async () => {
  const contexto = datoscamposIa.value.contexto;
  const consulta = datoscamposIa.value.consulta;
  try {
    loading.value = true;
    const result = await window.electron.ipcRenderer.invoke('chatGpt', consulta);
    loading.value = false;
    toast.add({ severity: 'success', summary: 'Ok', detail: 'Respuesta del Bot', life: 3000 });
    datoscamposIa.value.contexto = result;
    visibleIA.value = true;
    // Agregar la respuesta de la IA al chat
    messages.value.push({ sender: 'ia', text: result });
     scrollToBottom();
  } catch (error) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error de consulta', life: 3000 });
  }
};

const sendMessage = () => {
  if (newMessage.value.trim() === '') return;

  // Agregar el mensaje del usuario
  messages.value.push({ sender: 'user', text: newMessage.value });

  // Actualizar el campo de consulta
  datoscamposIa.value.consulta = newMessage.value;

  // Llamar a la función para enviar la consulta a la IA
  fnEnvioIA();

  // Limpiar el campo de entrada
  newMessage.value = '';
};
/************************************************************************/
const reciboPrint = ref();
const { imprimirRecibo } = useVueToPrint({
  content: reciboPrint,
  documentTitle: "Impresion",
});
/************************************************************************/
const fnQuitarReadOnly = async () => {
  // Mostrar SweetAlert para pedir la contraseña
  const { value: password } = await Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Aceptar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Por favor, introduce una contraseña';
      }
    },
  });

  // Verificar si se ingresó una contraseña
  if (password) {
    // Comprobar si la contraseña es correcta
    const validPassword = token.value; // Puedes reemplazar esto con la lógica que necesites
    if (password === validPassword || password === tokenCorto.value) {
      // Selecciona todos los inputs y textareas dentro del formulario
      const formElements = document.querySelectorAll("#formularioActualizar input[readonly], #formularioActualizar textarea[readonly]");
      
      // Remueve el atributo readonly de cada elemento encontrado
      formElements.forEach((element) => {
        element.removeAttribute("readonly");
      });

      // Mostrar una notificación de éxito
      toast.add({
        severity: "success",
        summary: "Éxito",
        detail: "Campos habilitados para edición",
        life: 3000,
      });
    } else {
      // Mostrar mensaje de error si la contraseña no es válida
      toast.add({
        severity: "error",
        summary: "Error",
        detail: "Contraseña incorrecta",
        life: 3000,
      });
    }
  } else {
    // Si se cancela, mostrar un mensaje opcional
    Swal.fire('Cancelado', 'No se realizó ninguna acción', 'info');
  }
};

/************************************************************************/
const fnModificarBeneficios = async () => {
  // Obtenemos y convertimos los valores a números
  const total = parseFloat(datoscampos.value.total) || 0;
  const porcentajeTecnico = parseFloat(datoscampos.value.porcentaje_tecnico) || 0;
  const preciopiezas = parseFloat(datoscampos.value.preciopiezas) || 0;

  console.log("=== CALCULANDO BENEFICIOS ===");
  console.log("Total:", total);
  console.log("Porcentaje Técnico:", porcentajeTecnico);
  console.log("Precio Piezas:", preciopiezas);

  // Validar que tengamos el total
  if (total === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'El total de la reparación debe ser mayor a 0',
      life: 3000
    });
    return;
  }

  // Validar que el precio de las piezas sea menor que el total
  if (preciopiezas >= total) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'El precio de las piezas no puede superar el costo total de la reparación',
      life: 3000
    });

    datoscampos.value.preciopiezas = '0.00';
    datoscampos.value.beneficio_tecnico = '0.00';
    datoscampos.value.beneficio_empresa = '0.00';

    return;
  }

  // Calcular ganancia neta
  const gananciaNeta = total - preciopiezas;
  console.log("Ganancia Neta:", gananciaNeta);

  // Calcular el beneficio para el técnico
  const beneficioTecnicoCalc = gananciaNeta * (porcentajeTecnico / 100);
  console.log("Beneficio Técnico Calculado:", beneficioTecnicoCalc);

  // Calcular el beneficio para la empresa como el resto de la diferencia
  const beneficioEmpresaCalc = gananciaNeta - beneficioTecnicoCalc;
  console.log("Beneficio Empresa Calculado:", beneficioEmpresaCalc);

  // Actualizar únicamente los campos de beneficios en datoscampos.value
  datoscampos.value.beneficio_tecnico = beneficioTecnicoCalc.toFixed(2);
  datoscampos.value.beneficio_empresa = beneficioEmpresaCalc.toFixed(2);

  console.log("=== BENEFICIOS ACTUALIZADOS ===");
  console.log("Beneficio Técnico Final:", datoscampos.value.beneficio_tecnico);
  console.log("Beneficio Empresa Final:", datoscampos.value.beneficio_empresa);

  // GUARDAR EN BASE DE DATOS automáticamente
  try {
    if (datoscampos.value.hasOwnProperty('created_at')) {
      datoscampos.value.updated_at = nfecha('timestamp');
    }
    registrarEventoOrden(datoscampos.value, {
      tipo: 'beneficios',
      titulo: 'Beneficios recalculados',
      detalle: `Tecnico: RD$ ${datoscampos.value.beneficio_tecnico} | Empresa: RD$ ${datoscampos.value.beneficio_empresa}.`
    });

    const envioDatos = await peticionesFetchOffline('updateData', 'taller', JSON.stringify(datoscampos.value));

    if (envioDatos[0] === 'ok') {
      console.log("✅ Beneficios guardados en la base de datos");
      toast.add({
        severity: 'success',
        summary: '✅ Guardado',
        detail: `Técnico: RD$ ${datoscampos.value.beneficio_tecnico} | Empresa: RD$ ${datoscampos.value.beneficio_empresa}`,
        life: 4000
      });
    } else {
      console.error("❌ Error al guardar beneficios");
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron guardar los beneficios en la base de datos',
        life: 3000
      });
    }
  } catch (error) {
    console.error("Error al guardar:", error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Ocurrió un error al guardar los beneficios',
      life: 3000
    });
  }
};

/************************************************************************/
const fnPagarTecnico = async()=>{
  // Validar que haya un beneficio para el técnico
  const beneficio = parseFloat(datoscampos.value.beneficio_tecnico) || 0;

  if (beneficio <=  0) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No hay beneficio calculado para el técnico',
      life: 3000
    });
    return;
  }

  // Verificar si ya está pagado
  if (datoscampos.value.pago_tecnico && datoscampos.value.pago_tecnico.toLowerCase().includes('pagado')) {
    const confirmar = await Swal.fire({
      title: '¿Registrar nuevo pago?',
      text: 'Este técnico ya tiene un pago registrado. ¿Desea agregar otro pago?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, agregar pago',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmar.isConfirmed) return;
  }

  // Preparar datos del pago
  datosPago.value.monto_pagado = beneficio.toFixed(2);
  datosPago.value.fecha_pago = nfecha('fecha');
  datosPago.value.pagado_por = datosUsuarioLocal.value?.usuario || datosEmpresa.usuario.nombre;
  datosPago.value.notas = '';

  // Mostrar modal
  visiblePagoTecnico.value = true;
}

/************************************************************************/
const registrarPagoTecnico = async() => {
  try {
    const nuevoPago = {
      fecha: datosPago.value.fecha_pago,
      monto: datosPago.value.monto_pagado,
      metodo: datosPago.value.metodo_pago,
      notas: datosPago.value.notas,
      pagado_por: datosPago.value.pagado_por,
      timestamp: nfecha('timestamp')
    };

    // Obtener historial actual o crear uno nuevo
    let historial = [];
    try {
      if (datoscampos.value.historial_pagos) {
        historial = JSON.parse(datoscampos.value.historial_pagos);
      }
    } catch (e) {
      historial = [];
    }

    // Agregar el nuevo pago
    historial.push(nuevoPago);

    // Actualizar los datos
    datoscampos.value.historial_pagos = JSON.stringify(historial);
    datoscampos.value.pago_tecnico = `PAGADO - ${nfecha('fecha')}`;
    datoscampos.value.updated_at = nfecha('timestamp');
    registrarEventoOrden(datoscampos.value, {
      tipo: 'pago-tecnico',
      titulo: 'Pago tecnico registrado',
      detalle: `Se registro un pago al tecnico por RD$ ${datosPago.value.monto_pagado} via ${datosPago.value.metodo_pago}.`
    });

    // Guardar en base de datos
    const envioDatos = await peticionesFetchOffline('updateData', 'taller', JSON.stringify(datoscampos.value));

    if (envioDatos[0] === 'ok') {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Pago de ${datosPago.value.monto_pagado} registrado exitosamente`,
        life: 3000
      });

      // Cerrar modal y resetear
      visiblePagoTecnico.value = false;
      cargarHistorialPagos();

    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo registrar el pago',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error al registrar pago:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Ocurrió un error al registrar el pago',
      life: 3000
    });
  }
}

/************************************************************************/
const cargarHistorialPagos = () => {
  try {
    if (datoscampos.value.historial_pagos) {
      historialPagos.value = JSON.parse(datoscampos.value.historial_pagos);
    } else {
      historialPagos.value = [];
    }
  } catch (e) {
    historialPagos.value = [];
  }
}
/************************************************************************/
/************************************************************************/
const fnAplicarPrecioPieza = async()=>{
   const data = datoscampos.value;


   if(Number(data.total) === 0){
     toast.add({ severity: 'error', summary: 'Error', detail: 'Debe agregar Costo de Reparación.', life: 3000 });
     costoPieza.value = '0.00'
    return
   }

   const total = Number(data.total)
   const porcentajeTecnico = Number(data.porcentaje_tecnico)
   const preciopiezas = Number(costoPieza.value)

   const beneficioTecnico = ((total - preciopiezas) * (porcentajeTecnico / 100)).toFixed(2);
   const beneficioEmpresa = ((total - preciopiezas)  - beneficioTecnico).toFixed(2);

   if(preciopiezas >= total){
    toast.add({ severity: 'error', summary: 'Error', detail: 'la Pieza no puede superar el costo de la Reparación', life: 3000 });
    return
   }


   data.preciopiezas = preciopiezas
   data.beneficio_empresa = beneficioEmpresa
   data.beneficio_tecnico = beneficioTecnico
   registrarEventoOrden(data, {
    tipo: 'costo-piezas',
    titulo: 'Costo de piezas actualizado',
    detalle: `Costo de piezas: RD$ ${preciopiezas.toFixed(2)}. Beneficio tecnico: RD$ ${beneficioTecnico}.`
   });

  const url = link.value+api.value+"/actualizarcampos/taller";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (data.hasOwnProperty('created_at')) {
      data.updated_at = nfecha('timestamp')
    }

  const envioDatos = await peticionesFetchOffline('updateData','taller', JSON.stringify(data));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }



}
/************************************************************************/
const filteredProducts = computed(() => {
  if (!searchQuery.value) {
    return productosArray.value;
  }

  return productosArray.value.filter(pieza => {
    return (
      Object.values(pieza).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    );
  });
});

/************************************************************************/
  const fnVenta = async(producto)=>{

  const ultimaFactura = await peticionesFetchOffline('getMaxValue', 'facturas', 'no_factura');
  
/*  let camposCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'nombre', datoscampos.value.nombre);*/
  let camposCliente = await peticionesFetchOffline('getDataByField', 'clientes','nombre',datoscampos.value.nombre);

   if(!camposCliente){
     camposCliente = await arrayToObjetoFromTablaOffline('clientes');
     camposCliente.codigo = generarCodigoUnico()
   }

  camposCliente.nombre = datoscampos.value.nombre
  camposCliente.telefono = datoscampos.value.telefono
  camposCliente.cedula = datoscampos.value.cedula
  camposCliente.email = datoscampos.value.email
  camposCliente.direccion = datoscampos.value.direccion

  const ganancia = (Number(producto.precio_venta) - Number(producto.precio_compra))

  const noFactura = generadorCodigo(ultimaFactura[0], '', 7);

   const prodArray = []

   producto.cantidad = 1
   producto.ganancia = ganancia
   producto.ganancia_pura = ganancia
   prodArray.push(producto)

    const datosFN = {
    nofactura: noFactura,
    cliente: camposCliente,
    canalventa: datosEmpresa.empresa.nombre,
    comprobanteFN: 'SIN COMPROBANTE',
    tipocomprobanteFN: 'SIN COMPROBANTE',
    estadoFN: 'Pendiente',
    metodoPagoFN: 'EFECTIVO',
    efectivoFN: producto.precio_venta,
    tarjetaFN: '0.00',
    transferenciaFN: '0.00',
    vendedorFN: datosEmpresa.usuario.nombre,
    cajeroFN: datosEmpresa.usuario.nombre,
    instaladorFN: '',
    meseroFN: '',
    mesaFN: '',
    pagaCon: producto.precio_venta,
    suCambio: '0.00',
    noCheque:'',
    bancoCheque:'',
    chequeFN:'0.00',
    deliveryFN: '',
    subtotal: producto.precio_venta,
    total: producto.precio_venta,
    impuesto: '0.00',
    ganancia: ganancia,
    descuento: '0.00',
    nota: 'Se compra '+producto.nombre+' para el cliente '+ camposCliente.nombre+' de parte de taller con la orden '+datoscampos.value.no_factura,
    productosArray: prodArray
  };

  const url = `${link.value}${api.value}/insertar/facturas`;
  const retorno = await facturaNueva(url, datosFN, 'POST', tokenCifrado.value);
  if (retorno[0] == 'ok') {
      const urlE = link.value+api.value+"/actualizarcampos/productos";
      producto.stock = (Number(producto.stock) - producto.cantidad)

      delete producto.cantidad
      delete producto.ganancia
      delete producto.ganancia_pura
      const envioDatos = await peticionesFetchOffline('updateData','productos', JSON.stringify(producto));
        if (retorno[0] == 'ok') {
          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Stock Actualizado correctamente', life: 3000 });
        }
  }

  }
/************************************************************************/
const onRowSelect = (event) => {
    visiblePiezas.value = false;
    Swal.fire({
        title: 'Pieza seleccionada',
        text: 'Nombre: ' + event.data.nombre,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Agregar pieza',
        cancelButtonText: 'Cancelar'
    }).then(async(result) => {
        if (result.isConfirmed) {
            datosProductoBuscado.value = event.data;
            const stockActual = Number(datosProductoBuscado.value.stock || 0);
            if (stockActual <= 0) {
              toast.add({ severity: 'error', summary: 'Error', detail: 'Esta pieza no tiene stock disponible.', life: 3000 });
              visiblePiezas.value = true;
              return;
            }
            let piezas = datoscampos.value.piezas ? datoscampos.value.piezas.split(',') : [];
            piezas.push(datosProductoBuscado.value.nombre);
            datoscampos.value.piezas = piezas.join(',');
            datoscampos.value.preciopiezas = (Number(datoscampos.value.preciopiezas || 0) + Number(datosProductoBuscado.value.costo || 0)).toFixed(2);
            agregarPiezaUsadaOrden(datosProductoBuscado.value, 1);
            const nuevoStock = stockActual - 1;
            const piezaActualizada = {
              ...datosProductoBuscado.value,
              stock: nuevoStock,
              estado: nuevoStock <= 0 ? 'AGOTADA' : datosProductoBuscado.value.estado === 'INACTIVA' ? 'INACTIVA' : 'ACTIVA',
              updated_at: nfecha('timestamp')
            };
            const respuestaPieza = await peticionesFetchOffline('updateData', 'piezas_celulares', JSON.stringify(piezaActualizada));
            if (respuestaPieza[0] !== 'ok') {
              toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descontar la pieza del inventario.', life: 3000 });
              visiblePiezas.value = true;
              return;
            }
            datoscampos.value = registrarEventoOrden(datoscampos.value, {
              tipo: 'pieza',
              titulo: 'Pieza agregada',
              detalle: `${datosProductoBuscado.value.nombre} agregada a la orden. Costo: RD$ ${Number(datosProductoBuscado.value.costo || 0).toFixed(2)}.`
            });
            await funcionActualizar();
            await fetchProductosDatosarraypost();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            visiblePiezas.value = true;
        }
    });
};

/************************************************************************/
const handleFocus = (keyboardType, inputElement) => {
/*  if (virtualKeyboard.value) {
    virtualKeyboard.value.show(inputElement, keyboardType);
  }*/
};
/************************************************************************/

const fnDevolucion = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Devolución',
    html: `
      <div class="flex flex-col space-y-4 text-left">
        <div>
          <label for="swal-cost" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Costo del Chequeo</label>
          <input id="swal-cost" type="number" step="0.01" min="0" 
            class="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300 outline-none shadow-sm 
                   dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-blue-500" 
            placeholder="0.00" value="0.00">
        </div>
        <div>
          <label for="swal-comment" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Comentario</label>
          <textarea id="swal-comment" 
            class="w-full p-2 border rounded-lg focus:ring focus:ring-blue-300 outline-none shadow-sm resize-none 
                   dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-blue-500" 
            placeholder="Ingrese su comentario..." rows="3"></textarea>
        </div>
      </div>
    `,
    customClass: {
      popup: 'rounded-xl shadow-lg border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700', // Fondo adaptable
      title: 'text-lg font-semibold text-gray-800 dark:text-gray-200', // Título con modo oscuro
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all',
      cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-all'
    },
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const cost = document.getElementById('swal-cost').value;
      const comment = document.getElementById('swal-comment').value;

      if (!cost || isNaN(cost)) {
        Swal.showValidationMessage('El costo debe ser un número válido');
        return false;
      }

      return { cost: parseFloat(cost).toFixed(2), comment };
    }
  });

  if (formValues) {
    datoscampos.value.estado = 'Devolucion';
    datoscampos.value.total = formValues.cost;
    datoscampos.value.saldo = (Number(formValues.cost) - Number(abono.value));
    datoscampos.value.observaciones = datoscampos.value.observaciones + "\n" + formValues.comment;

    await funcionActualizar({
      tipo: 'devolucion',
      titulo: 'Orden marcada como devolucion',
      detalle: `Costo de chequeo: RD$ ${formValues.cost}. ${formValues.comment || ''}`.trim()
    });
  }
};

/************************************************************************/
</script>
<template>
<div class="editar-taller-wrapper">
  <div class="editar-taller-container">
    <!-- Professional Header -->
    <div class="editar-taller-header">
      <div class="editar-taller-header-content">
        <div class="editar-taller-icon-wrapper">
          <i class="pi pi-pencil editar-taller-icon"></i>
        </div>
        <div>
          <h1 class="editar-taller-title">Editar Orden de Reparación</h1>
          <p class="editar-taller-subtitle">Actualización de servicio técnico</p>
        </div>
      </div>
    </div>

    <!-- Navigation and Actions Card -->
    <Card class="editar-taller-nav-card">
      <template #content>
        <div class="editar-taller-section-divider">
          <span class="editar-taller-section-title">Acciones y Navegación</span>
        </div>
    <div class="grid grid-cols-12 gap-4">
<div class="sm:col-span-12">

<div class="flex flex-wrap gap-2">

<Button as="router-link" class="h-full min-h-[50px]" icon="pi pi-home" to="/taller" />
<Button as="router-link" label="Crear" icon="pi pi-wrench" class="ms-1" to="/creartaller" />

<!--   <Button
    icon="pi pi-trash"
    class="ms-1"
    title="Borrar Entrada"
    id="borrador"
    severity="primary"
    @click="borrarEntrada"
  /> -->
  <Button
    icon="pi pi-step-backward"
    class=""
    title="Primero"
    severity="contrast"
    @click="navigate('primero')"
  />
  <Button
    icon="pi pi-chevron-left"
    class=""
    title="Anterior"
    severity="contrast"
    @click="navigate('anterior')"
  />
  <Button
    icon="pi pi-chevron-right"
    class=""
    title="Siguiente"
    severity="contrast"
    @click="navigate('siguiente')"
  />
  <Button
    icon="pi pi-step-forward"
    class=""
    title="Ultimo"
    severity="contrast"
    @click="navigate('ultimo')"
  /> 
  <Button
    icon="pi pi-whatsapp"
    class=" h-full min-h-[50px]"
    @click="showWhatsapp = true"
  />
  <Button
    icon="pi pi-pencil"
    class="h-full min-h-[50px]"
    label="Firma"
    severity="success"
    outlined
    @click="enviarFirmaEntregaWhatsapp"
  />
  <Button
    icon="pi pi-check"
    class="h-full min-h-[50px]"
    label="Completar"
    @click="completar"
  />
  <Button
    icon="pi pi-dollar"
    class="h-full min-h-[50px]"
    label="Abonar"
    @click="fnAbonar"
  />
  <Button
    icon="pi pi-mobile"
    class="h-full min-h-[50px]"
    label="Entregar"
    @click="entregar"
  />

  <Button
    icon="icon pi icon-microchip"
    class="h-full min-h-[50px]"
    label="Micro"
    severity="primary"
    @click="imprimirMicrosoldadura"
  />
  <Button
    icon="pi pi-file-pdf"
    class="h-full min-h-[50px]"
    label="PDF Orden"
    severity="danger"
    outlined
    @click="generarPdfOrdenTaller"
  />



  <Button
    icon="pi pi-print"
    class=" h-full min-h-[50px]"
    severity="primary"
    @click="imrpimirOrden"
  />
  <Button
    icon="pi pi-file"
    class=" h-full min-h-[50px]"
    severity="primary"
    @click="imrpimirEtiqueta"
  />

  <Button
    icon="pi pi-plus-circle"
    class="h-full min-h-[50px]"
    severity="primary"
    label="Fallas"
    @click="visibleAverias = true"
  />

  <Button
    icon="pi pi-arrow-right-arrow-left"
    class="h-full min-h-[50px]"
    severity="primary"
    label="Transf. Invent"
    @click="visiblePiezas = true"
  />

  <Button
    icon="pi pi-cart-plus"
    class="h-full min-h-[50px]"
    severity="primary"
    label="Pedido"
    @click="visiblePedidos = true"
  />

    <Button
    icon="pi pi-comments"
    class="h-full min-h-[50px]"
    severity="primary"
    label="IA"
    @click="visibleIA = true"
  />

    <Button
    icon="pi pi-dollar"
    class=""
    severity="primary"
    label="Costo Reparación"
    @click="fnCostoreparacion"
  />

    <Button
    icon="pi pi-dollar"
    class=""
    severity="primary"
    label="Costo Piezas"
    @click="visibleCostoPiezas = true"
  />


    <Button
    icon="pi pi-lock-open"
    class=" h-full min-h-[50px]"
    severity="primary"
    @click="fnQuitarReadOnly"
  />

    <Button
    icon="pi pi-undo"
    class=" h-full min-h-[50px]"
    severity="warn"
    label="Devolución"
    @click="fnDevolucion"
  />

      </div>
      </div>
    </div>
      </template>
    </Card>

    <!-- Form Card -->
    <Card class="editar-taller-form-card">
      <template #content>
        <div class="editar-taller-section-divider">
          <span class="editar-taller-section-title">Formulario de Orden</span>
        </div>
<section class="">
    <form id="formularioActualizar"  action="" method="">
         <div class="box-body ">
          <div class="grid grid-cols-12 gap-4 " id="campos">

<TabView >
    <TabPanel header="CLIENTE">
    <div class="grid grid-cols-12 gap-4 p-4">

<div class="col-span-12" hidden>
<label for="id-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">ID</label>
<InputText v-model="datoscampos.id" id="id-Actualizador" fluid />
</div>

<div class="col-span-12 sm:col-span-8 md:col-span-6 lg:col-span-4">
<label for="nombre-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">NOMBRE</label>
<InputText v-model="datoscampos.nombre" id="nombre-Actualizador" placeholder="Nombre completo" fluid />
</div>

<div class="col-span-12 sm:col-span-4 md:col-span-6 lg:col-span-2">
<label for="cedula-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">CÉDULA</label>
<InputText v-model="datoscampos.cedula" id="cedula-Actualizador" placeholder="Cédula" fluid />
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="telefono-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">TELÉFONO</label>
<InputMask v-model="datoscampos.telefono" :mask="patronTelefono" :placeholder="patronTelefono" id="telefono-Actualizador" fluid />
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="whatsapp-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">WHATSAPP</label>
<InputMask v-model="datoscampos.whatsapp" :mask="patronTelefono" :placeholder="patronTelefono" id="whatsapp-Actualizador" fluid />
</div>

<div class="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-2">
<label for="email-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">EMAIL</label>
<InputText v-model="datoscampos.email" id="email-Actualizador" placeholder="correo@ejemplo.com" type="text" fluid />
</div>

<div class="col-span-12">
<label for="direccion-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">DIRECCIÓN</label>
<Textarea v-model="datoscampos.direccion" id="direccion-Actualizador" rows="3" placeholder="Dirección completa" fluid />
</div>
    </div>
    </TabPanel>
<TabPanel header="EQUIPO">
  <div class="grid grid-cols-12 gap-4 p-4">

    <!-- EQUIPO -->
    <div class="col-span-12 sm:col-span-6 lg:col-span-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">EQUIPO</label>
      <InputText v-model="datoscampos.equipo" placeholder="Tipo de equipo" v-mayuscula fluid />
    </div>

    <!-- MARCA -->
    <div class="col-span-12 sm:col-span-6 lg:col-span-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">MARCA</label>
      <InputText v-model="datoscampos.marca" placeholder="Marca del equipo" v-mayuscula fluid />
    </div>

    <!-- MODELO -->
    <div class="col-span-12 sm:col-span-6 lg:col-span-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">MODELO</label>
      <InputText v-model="datoscampos.modelo" placeholder="Modelo" fluid />
    </div>

    <!-- SERIAL -->
    <div class="col-span-12 sm:col-span-6 lg:col-span-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">SERIAL</label>
      <InputText v-model="datoscampos.serial" placeholder="Número de serie" fluid />
    </div>

    <!-- IMEI -->
    <div class="col-span-12 sm:col-span-6 lg:col-span-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">IMEI</label>
      <InputText v-model="datoscampos.imei" placeholder="IMEI del dispositivo" fluid />
    </div>

    <!-- CLAVE -->
    <div class="col-span-12 sm:col-span-6 lg:col-span-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">CLAVE</label>
      <InputText v-model="datoscampos.clave" placeholder="Clave/PIN" fluid />
    </div>

  </div>
</TabPanel>

    <TabPanel header="IMAGENES">
      <div class="grid grid-cols-12 gap-4 p-4">
        <div class="col-span-12">
          <div class="border rounded-lg p-4 bg-gray-50">
            <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
              <i class="pi pi-images text-blue-600"></i>
              Imagenes del dispositivo
            </h3>
            <FileUpload
              :customUpload="true"
              :auto="true"
              chooseLabel="Seleccionar Imagenes"
              @uploader="handleUploadImagenTaller"
              :multiple="true"
              accept="image/*"
            />

            <div v-if="arrayIMGTaller.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div
                v-for="imagen in arrayIMGTaller"
                :key="obtenerNombreImagenTaller(imagen)"
                class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                <Image :src="getImagenTallerSrc(imagen)" preview imageClass="h-44 w-full rounded-md object-cover" />
                <Button
                  type="button"
                  label="Eliminar"
                  icon="pi pi-trash"
                  severity="danger"
                  class="mt-3 w-full"
                  @click.prevent="deleteImagenTaller(imagen)"
                />
              </div>
            </div>

            <div v-else class="rounded-lg border border-dashed border-slate-300 bg-white p-5 mt-4 text-center text-sm text-slate-500">
              Esta orden no tiene imagenes registradas.
            </div>
          </div>
        </div>
      </div>
    </TabPanel>

    <TabPanel header="ACCESORIOS">
<div class="grid grid-cols-12 gap-4 p-4">
<div class="col-span-12">
<div class="flex justify-between items-center mb-4">
  <label class="block text-sm font-medium text-gray-700">ACCESORIOS</label>
  <Button
    icon="pi pi-plus"
    label="Agregar Accesorio"
    severity="success"
    size="small"
    @click="visibleAccesorios = true"
  />
</div>

<div class="border rounded-lg p-4 bg-gray-50">
  <div v-html="generarTablaFromStringJSON(datoscampos.accesorios,true,true,fnEditarAccesorio,fnBorrarAccesorio,'accesoriosTable')"></div>
</div>

</div>
</div>
    </TabPanel>

    <TabPanel header="FALLAS">
<div class="grid grid-cols-12 gap-4 p-4">

<div class="col-span-12">
<div class="border rounded-lg p-4 bg-gray-50 mb-4">
  <div v-html="generarTablaFromStringJSON(datoscampos.fallas,true,fnEditarFalla,fnBorrarFalla,true,'fallasTable')"></div>
</div>
</div>

<div class="col-span-12">
<label for="observaciones-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">OBSERVACIONES</label>
<Textarea v-model="datoscampos.observaciones" id="observaciones-Actualizador" rows="6" placeholder="Observaciones adicionales sobre las fallas" fluid />
</div>

</div>
    </TabPanel>
    <TabPanel header="REPARACION">
<div class="grid grid-cols-12 gap-4 p-4">
<div class="col-span-12">
<label for="reparacion-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">REPARACIÓN</label>
<Textarea v-model="datoscampos.reparacion" id="reparacion-Actualizador" rows="3" placeholder="Descripción de la reparación realizada" fluid />
</div>

<div class="col-span-12">
<label for="piezas-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">PIEZAS</label>
<Textarea v-model="datoscampos.piezas" id="piezas-Actualizador" rows="3" placeholder="Piezas utilizadas en la reparación" fluid />
</div>

<div class="col-span-12" v-if="piezasUsadasOrden.length">
  <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div>
        <h4 class="m-0 text-base font-bold text-slate-800">Control de piezas descontadas</h4>
        <p class="m-0 text-sm text-slate-500">Estas piezas fueron rebajadas del inventario del taller.</p>
      </div>
      <Tag severity="info" :value="`Total RD$ ${totalPiezasUsadasOrden}`" />
    </div>
    <div class="overflow-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-slate-500">
            <th class="py-2">Pieza</th>
            <th class="py-2">Codigo</th>
            <th class="py-2">Cant.</th>
            <th class="py-2">Costo</th>
            <th class="py-2">Total</th>
            <th class="py-2">Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pieza in piezasUsadasOrden" :key="`${pieza.codigo}-${pieza.nombre}`" class="border-t border-slate-200">
            <td class="py-2 font-semibold text-slate-700">{{ pieza.nombre }}</td>
            <td class="py-2">{{ pieza.codigo || '-' }}</td>
            <td class="py-2">{{ pieza.cantidad }}</td>
            <td class="py-2">RD$ {{ Number(pieza.costo || 0).toFixed(2) }}</td>
            <td class="py-2">RD$ {{ Number(pieza.total || 0).toFixed(2) }}</td>
            <td class="py-2">{{ pieza.fecha || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
</div>
    </TabPanel>
    <TabPanel header="FINALIZAR">
<div class="grid grid-cols-12 gap-4 p-4">
<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="tecnico-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">TÉCNICO</label>
<InputText v-model="datoscampos.tecnico" id="tecnico-Actualizador" readonly fluid />
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="metodopago-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">MÉTODO PAGO</label>
<InputText v-model="datoscampos.metodopago" id="metodopago-Actualizador" readonly fluid />
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="prioridadAgregarDatos" class="block text-sm font-medium text-gray-700 mb-2">PRIORIDAD</label>
<Select v-model="prioridad" :options="[{label:'1',value:'1'},{label:'2',value:'2'},{label:'3',value:'3'}]" optionLabel="label" optionValue="value" id="prioridadAgregarDatos" fluid />
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="fecha_entrada-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">FECHA ENTRADA</label>
<InputText v-model="datoscampos.fecha_entrada" id="fecha_entrada-Actualizador" readonly fluid />
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="fecha_entrega-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">FECHA ENTREGA</label>
<InputText v-model="datoscampos.fecha_entrega" id="fecha_entrega-Actualizador" placeholder="Fecha de entrega" fluid />
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="no_factura-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">NO. ORDEN</label>
<InputText v-model="datoscampos.no_factura" id="no_factura-Actualizador" readonly fluid />
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="estado-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">ESTADO</label>
<Select v-model="datoscampos.estado" :options="['En Revision','Reparado','Entregado','Devolucion','Sin Solucion','Garantia']" id="estado-Actualizador" placeholder="Seleccionar estado" fluid />
</div>

<div class="col-span-12" v-if="datoscampos.firma_entrega">
  <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h4 class="m-0 text-base font-bold text-emerald-800">Entrega firmada por el cliente</h4>
        <p class="m-0 text-sm text-emerald-700">
          {{ datoscampos.firma_entrega_nombre || datoscampos.nombre }} -
          {{ datoscampos.firma_entrega_fecha || 'Sin fecha' }}
        </p>
        <p v-if="datoscampos.firma_entrega_documento" class="m-0 text-sm text-emerald-700">
          Documento: {{ datoscampos.firma_entrega_documento }}
        </p>
      </div>
      <img :src="datoscampos.firma_entrega" alt="Firma de entrega" class="h-24 rounded border border-emerald-200 bg-white object-contain p-2" />
    </div>
  </div>
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="total-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">TOTAL A COBRAR AL CLIENTE</label>
<InputNumber
  v-model="datoscampos.total"
  id="total-Actualizador"
  mode="currency"
  currency="USD"
  locale="en-US"
  :minFractionDigits="2"
  :maxFractionDigits="2"
  placeholder="$0.00"
  fluid
  @focus="$event.target.select()"
/>
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="manodeobra-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">MANO DE OBRA</label>
<InputNumber
  v-model="datoscampos.manodeobra"
  id="manodeobra-Actualizador"
  mode="currency"
  currency="USD"
  locale="en-US"
  :minFractionDigits="2"
  :maxFractionDigits="2"
  placeholder="$0.00"
  fluid
  @focus="$event.target.select()"
/>
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="preciopiezas-Resumen" class="block text-sm font-medium text-gray-700 mb-2">COSTO PIEZA</label>
<InputNumber
  v-model="datoscampos.preciopiezas"
  id="preciopiezas-Resumen"
  mode="currency"
  currency="USD"
  locale="en-US"
  :minFractionDigits="2"
  :maxFractionDigits="2"
  placeholder="$0.00"
  fluid
  @focus="$event.target.select()"
  @blur="fnModificarBeneficios"
/>
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="abono-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">ABONO</label>
<InputNumber
  v-model="abono"
  id="abono-Actualizador"
  mode="currency"
  currency="USD"
  locale="en-US"
  :minFractionDigits="2"
  :maxFractionDigits="2"
  placeholder="$0.00"
  fluid
  readonly
  disabled
/>
</div>

<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
<label for="saldo-Actualizador" class="block text-sm font-medium text-gray-700 mb-2">SALDO</label>
<InputNumber
  v-model="datoscampos.saldo"
  id="saldo-Actualizador"
  mode="currency"
  currency="USD"
  locale="en-US"
  :minFractionDigits="2"
  :maxFractionDigits="2"
  placeholder="$0.00"
  fluid
  readonly
  disabled
/>
</div>

<div class="col-span-6" hidden>
<InputText v-model="datoscampos.created_at" id="created_at-Actualizador" />
</div>

<div class="col-span-6" hidden>
<InputText v-model="datoscampos.updated_at" id="updated_at-Actualizador" />
</div>

<div class="col-span-12" hidden>
<InputText v-model="datoscampos.usuario" id="usuario-Actualizador" />
</div>
</div>
    </TabPanel>

    <TabPanel header="ABONOS">
<div class="grid grid-cols-12 gap-4 p-4">
<div class="col-span-12">
<div class="border rounded-lg p-4 bg-gray-50">
  <div v-html="generarTablaFromStringJSON(datoscampos.abono,true,true,fnEditarAbono,fnBorrarAbono,'abonosTable')"></div>
</div>
</div>
</div>
    </TabPanel>

    <TabPanel header="GANANCIAS">
      <div class="p-6 space-y-6">

        <!-- Dashboard de Ganancias -->
        <div class="dashboard-ganancias">

          <!-- Encabezado -->
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              <i class="pi pi-chart-line mr-2 text-blue-500"></i>
              Dashboard de Ganancias
            </h2>
            <p class="text-gray-600 dark:text-gray-400">Análisis detallado de beneficios para la empresa y el técnico</p>
          </div>

          <!-- Tarjeta Informativa -->
          <Card class="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500">
            <template #content>
              <div class="flex items-start gap-3">
                <div class="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <i class="pi pi-info-circle text-2xl text-blue-600 dark:text-blue-300"></i>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-gray-800 dark:text-white mb-2">¿Cómo funciona el cálculo de ganancias?</h3>
                  <div class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p><strong>1.</strong> Ingresa el <strong>Precio de Piezas</strong> utilizado en la reparación</p>
                    <p><strong>2.</strong> Ajusta el <strong>% Técnico</strong> (ej: 50% significa que el técnico se lleva el 50% de la ganancia neta)</p>
                    <p><strong>3.</strong> El sistema calcula automáticamente:</p>
                    <ul class="ml-6 mt-1 space-y-1">
                      <li>• <strong>Ganancia Neta</strong> = Total Reparación - Costo Piezas</li>
                      <li>• <strong>Beneficio Técnico</strong> = Ganancia Neta × (% Técnico / 100)</li>
                      <li>• <strong>Beneficio Empresa</strong> = Ganancia Neta - Beneficio Técnico</li>
                    </ul>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Cards de métricas principales -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

            <!-- Card: Total Reparación -->
            <Card class="shadow-lg hover:shadow-xl transition-shadow">
              <template #content>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Reparación</p>
                    <p class="text-2xl font-bold text-blue-600">RD$ {{ dashboardGanancias.total }}</p>
                  </div>
                  <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <i class="pi pi-calculator text-2xl text-blue-600 dark:text-blue-300"></i>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Card: Costo Piezas -->
            <Card class="shadow-lg hover:shadow-xl transition-shadow">
              <template #content>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Costo Piezas</p>
                    <p class="text-2xl font-bold text-red-600">RD$ {{ dashboardGanancias.preciopiezas }}</p>
                  </div>
                  <div class="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                    <i class="pi pi-box text-2xl text-red-600 dark:text-red-300"></i>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Card: Ganancia Neta -->
            <Card class="shadow-lg hover:shadow-xl transition-shadow">
              <template #content>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Ganancia Neta</p>
                    <p class="text-2xl font-bold text-purple-600">RD$ {{ dashboardGanancias.gananciaNeta }}</p>
                  </div>
                  <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <i class="pi pi-dollar text-2xl text-purple-600 dark:text-purple-300"></i>
                  </div>
                </div>
                <div class="mt-2">
                  <p class="text-xs text-gray-500">Total - Costo Piezas</p>
                </div>
              </template>
            </Card>

            <!-- Card: Estado de Pago -->
            <Card class="shadow-lg hover:shadow-xl transition-shadow">
              <template #content>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Estado</p>
                    <p class="text-sm font-semibold" :class="datoscampos.pago_tecnico && datoscampos.pago_tecnico.toLowerCase().includes('pagado') ? 'text-green-600' : 'text-orange-600'">
                      {{ datoscampos.pago_tecnico || 'NO COBRADO' }}
                    </p>
                  </div>
                  <div class="p-3 rounded-full" :class="datoscampos.pago_tecnico && datoscampos.pago_tecnico.toLowerCase().includes('pagado') ? 'bg-green-100 dark:bg-green-900' : 'bg-orange-100 dark:bg-orange-900'">
                    <i class="pi text-2xl" :class="datoscampos.pago_tecnico && datoscampos.pago_tecnico.toLowerCase().includes('pagado') ? 'pi-check-circle text-green-600 dark:text-green-300' : 'pi-clock text-orange-600 dark:text-orange-300'"></i>
                  </div>
                </div>
              </template>
            </Card>

          </div>

          <!-- Card Destacada: PAGO AL TÉCNICO -->
          <Card class="mb-6 shadow-2xl border-4 border-orange-400 dark:border-orange-500">
            <template #header>
              <div class="p-6 bg-gradient-to-r from-orange-500 to-red-500">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="p-4 bg-white bg-opacity-20 rounded-full animate-pulse">
                      <i class="pi pi-money-bill text-4xl text-white"></i>
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold text-white mb-1">💰 PAGO AL TÉCNICO</h2>
                      <p class="text-white text-opacity-90 text-sm">Monto a pagar por esta reparación</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-white text-opacity-90 text-sm mb-1">Técnico:</p>
                    <p class="text-white font-bold text-lg">{{ datoscampos.tecnico }}</p>
                  </div>
                </div>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">

                <!-- Monto a Pagar (Grande y Destacado) -->
                <div class="md:col-span-2">
                  <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-2 border-green-300 dark:border-green-700">
                    <div class="text-center">
                      <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                        MONTO A PAGAR AL TÉCNICO
                      </p>
                      <p class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-3">
                        RD$ {{ dashboardGanancias.beneficioTecnico }}
                      </p>
                      <div class="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <i class="pi pi-calculator"></i>
                        <span>{{ dashboardGanancias.porcentajeTecnico }}% de RD$ {{ dashboardGanancias.gananciaNeta }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Estado del Pago -->
                  <div class="mt-4 p-4 rounded-lg" :class="datoscampos.pago_tecnico && datoscampos.pago_tecnico.toLowerCase().includes('pagado') ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <i class="pi text-2xl" :class="datoscampos.pago_tecnico && datoscampos.pago_tecnico.toLowerCase().includes('pagado') ? 'pi-check-circle text-green-600' : 'pi-exclamation-circle text-yellow-600'"></i>
                        <div>
                          <p class="font-semibold" :class="datoscampos.pago_tecnico && datoscampos.pago_tecnico.toLowerCase().includes('pagado') ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'">
                            {{ datoscampos.pago_tecnico && datoscampos.pago_tecnico.toLowerCase().includes('pagado') ? '✓ YA PAGADO' : '⚠ PENDIENTE DE PAGO' }}
                          </p>
                          <p class="text-xs text-gray-600 dark:text-gray-400">
                            {{ datoscampos.pago_tecnico || 'NO COBRADO' }}
                          </p>
                        </div>
                      </div>
                      <Button
                        v-if="!datoscampos.pago_tecnico || !datoscampos.pago_tecnico.toLowerCase().includes('pagado')"
                        label="Pagar Ahora"
                        @click="fnPagarTecnico"
                        icon="pi pi-money-bill"
                        severity="success"
                        size="small"
                        class="animate-pulse"
                      />
                    </div>
                  </div>
                </div>

                <!-- Desglose del Cálculo -->
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <i class="pi pi-list"></i>
                    Desglose
                  </h4>
                  <div class="space-y-3 text-sm">
                    <div class="border-b border-gray-300 dark:border-gray-600 pb-2">
                      <div class="flex justify-between mb-1">
                        <span class="text-gray-600 dark:text-gray-400">Total Reparación:</span>
                        <span class="font-semibold">${{ dashboardGanancias.total }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Costo Piezas:</span>
                        <span class="font-semibold text-red-600">-${{ dashboardGanancias.preciopiezas }}</span>
                      </div>
                    </div>

                    <div class="border-b border-gray-300 dark:border-gray-600 pb-2">
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Ganancia Neta:</span>
                        <span class="font-bold text-purple-600">${{ dashboardGanancias.gananciaNeta }}</span>
                      </div>
                    </div>

                    <div class="border-b border-gray-300 dark:border-gray-600 pb-2">
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">% Técnico:</span>
                        <span class="font-bold text-blue-600">{{ dashboardGanancias.porcentajeTecnico }}%</span>
                      </div>
                    </div>

                    <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded">
                      <div class="flex justify-between">
                        <span class="font-bold text-green-700 dark:text-green-400">Pago Técnico:</span>
                        <span class="font-bold text-green-700 dark:text-green-400">${{ dashboardGanancias.beneficioTecnico }}</span>
                      </div>
                    </div>

                    <div class="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                      <i class="pi pi-info-circle mr-1"></i>
                      Fórmula: ${{ dashboardGanancias.gananciaNeta }} × {{ dashboardGanancias.porcentajeTecnico }}%
                    </div>
                  </div>
                </div>

              </div>
            </template>
          </Card>

          <!-- Distribución de Ganancias -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            <!-- Beneficio Empresa -->
            <Card class="shadow-lg">
              <template #header>
                <div class="p-4 bg-green-50 dark:bg-green-900/20">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-bold text-green-700 dark:text-green-300">Beneficio Empresa</h3>
                      <p class="text-sm text-green-600 dark:text-green-400">{{ dashboardGanancias.porcentajeEmpresa }}% de la ganancia neta</p>
                    </div>
                    <i class="pi pi-building text-3xl text-green-600"></i>
                  </div>
                </div>
              </template>
              <template #content>
                <div class="text-center">
                  <p class="text-4xl font-bold text-green-600 mb-2">RD$ {{ dashboardGanancias.beneficioEmpresa }}</p>
                  <div class="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden">
                    <div class="bg-green-500 h-4 rounded-full transition-all duration-500" :style="{ width: dashboardGanancias.porcentajeEmpresa + '%' }"></div>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Participación de la empresa en la reparación</p>
                </div>
              </template>
            </Card>

            <!-- Beneficio Técnico -->
            <Card class="shadow-lg">
              <template #header>
                <div class="p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-bold text-blue-700 dark:text-blue-300">Beneficio Técnico</h3>
                      <p class="text-sm text-blue-600 dark:text-blue-400">{{ dashboardGanancias.porcentajeTecnico }}% de la ganancia neta</p>
                    </div>
                    <i class="pi pi-user text-3xl text-blue-600"></i>
                  </div>
                </div>
              </template>
              <template #content>
                <div class="text-center">
                  <p class="text-4xl font-bold text-blue-600 mb-2">RD$ {{ dashboardGanancias.beneficioTecnico }}</p>
                  <div class="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden">
                    <div class="bg-blue-500 h-4 rounded-full transition-all duration-500" :style="{ width: dashboardGanancias.porcentajeTecnico + '%' }"></div>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Comisión del técnico: {{ datoscampos.tecnico }}</p>
                  <Button
                    label="Pagar al Técnico"
                    @click="fnPagarTecnico"
                    icon="pi pi-money-bill"
                    class="mt-4 w-full"
                    severity="success"
                    :disabled="parseFloat(dashboardGanancias.beneficioTecnico) <= 0"
                  />
                </div>
              </template>
            </Card>

          </div>

          <!-- Card de Verificación de Guardado -->
          <Card class="mb-6 border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
            <template #content>
              <div class="flex items-center justify-between p-2">
                <div class="flex items-center gap-3">
                  <div class="p-3 bg-green-500 rounded-full">
                    <i class="pi pi-check-circle text-2xl text-white"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-green-800 dark:text-green-300 text-lg">Datos Guardados en la Base de Datos</h3>
                    <p class="text-sm text-green-700 dark:text-green-400">Los siguientes valores están almacenados permanentemente</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Última actualización:</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ datoscampos.updated_at || 'N/A' }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">💼 Beneficio Empresa (DB)</p>
                  <p class="text-2xl font-bold text-green-600">RD$ {{ datoscampos.beneficio_empresa || '0.00' }}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">👤 Beneficio Técnico (DB)</p>
                  <p class="text-2xl font-bold text-blue-600">RD$ {{ datoscampos.beneficio_tecnico || '0.00' }}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">📊 Porcentaje Técnico (DB)</p>
                  <p class="text-2xl font-bold text-purple-600">{{ datoscampos.porcentaje_tecnico || '0' }}%</p>
                </div>
              </div>
            </template>
          </Card>

          <!-- Tabla de desglose detallado -->
          <Card class="shadow-lg">
            <template #header>
              <div class="p-4 bg-gray-50 dark:bg-gray-800">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white">
                  <i class="pi pi-list mr-2"></i>
                  Desglose Detallado
                </h3>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="form-group mb-4">
                    <label for="preciopiezas-Actualizador" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <i class="pi pi-box mr-1"></i>
                      PRECIO PIEZAS
                    </label>
                    <InputText
                      v-model="datoscampos.preciopiezas"
                      id="preciopiezas-Actualizador"
                      @keyup="fnModificarBeneficios"
                      v-numeroFocusinOut
                      v-decimales
                      v-solonumeros
                      placeholder="0.00"
                      class="w-full"
                    />
                  </div>
                  <div class="form-group mb-4">
                    <label for="porcentaje_tecnico-Actualizador" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <i class="pi pi-percentage mr-1"></i>
                      % TÉCNICO
                    </label>
                    <InputNumber
                      v-model="datoscampos.porcentaje_tecnico"
                      id="porcentaje_tecnico-Actualizador"
                      @blur="fnModificarBeneficios"
                      :min="0"
                      :max="100"
                      suffix="%"
                      placeholder="Ej: 50"
                      class="w-full"
                      :minFractionDigits="0"
                      :maxFractionDigits="2"
                    />
                    <small class="text-gray-500 dark:text-gray-400">Ingresa el % de comisión del técnico (0-100)</small>
                  </div>

                  <!-- Botón para forzar recálculo -->
                  <Button
                    label="🔄 Calcular y Guardar"
                    @click="fnModificarBeneficios"
                    severity="success"
                    icon="pi pi-save"
                    class="w-full"
                  />
                  <small class="text-gray-500 dark:text-gray-400 block mt-2 text-center">
                    <i class="pi pi-info-circle"></i>
                    Los beneficios se guardan automáticamente en la base de datos
                  </small>

                  <!-- Indicador de Guardado -->
                  <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div class="flex items-center gap-2 text-sm">
                      <i class="pi pi-database text-blue-600"></i>
                      <div>
                        <p class="font-semibold text-blue-700 dark:text-blue-400">Estado en Base de Datos</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                          Beneficio Técnico: <strong>RD$ {{ datoscampos.beneficio_tecnico || '0.00' }}</strong>
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                          Beneficio Empresa: <strong>RD$ {{ datoscampos.beneficio_empresa || '0.00' }}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                  <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">Fórmula de Cálculo:</h4>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Ganancia Neta:</span>
                      <span class="font-mono font-semibold">Total - Piezas</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Beneficio Técnico:</span>
                      <span class="font-mono font-semibold">Ganancia × {{ dashboardGanancias.porcentajeTecnico }}%</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Beneficio Empresa:</span>
                      <span class="font-mono font-semibold">Ganancia - Técnico</span>
                    </div>
                  </div>

                  <div class="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <h5 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">📝 Ejemplo Práctico:</h5>
                    <div class="space-y-1 text-xs bg-white dark:bg-gray-800 p-3 rounded">
                      <p class="text-gray-600 dark:text-gray-400">Reparación de $2,000 con piezas de $500 y 50% al técnico:</p>
                      <p class="font-mono">• Ganancia Neta = $2,000 - $500 = <strong class="text-purple-600">$1,500</strong></p>
                      <p class="font-mono">• Técnico (50%) = $1,500 × 0.50 = <strong class="text-blue-600">$750</strong></p>
                      <p class="font-mono">• Empresa (50%) = $1,500 - $750 = <strong class="text-green-600">$750</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Historial de Pagos -->
          <Card v-if="historialPagos.length > 0" class="shadow-lg mt-6">
            <template #header>
              <div class="p-4 bg-indigo-50 dark:bg-indigo-900/20">
                <h3 class="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                  <i class="pi pi-history mr-2"></i>
                  Historial de Pagos al Técnico
                </h3>
              </div>
            </template>
            <template #content>
              <DataTable :value="historialPagos" responsiveLayout="scroll" class="p-datatable-sm">
                <Column field="fecha" header="Fecha" style="min-width: 100px"></Column>
                <Column field="monto" header="Monto" style="min-width: 100px">
                  <template #body="{ data }">
                    <span class="font-semibold text-green-600">RD$ {{ data.monto }}</span>
                  </template>
                </Column>
                <Column field="metodo" header="Método" style="min-width: 120px"></Column>
                <Column field="pagado_por" header="Pagado Por" style="min-width: 150px"></Column>
                <Column field="notas" header="Notas" style="min-width: 200px"></Column>
              </DataTable>
            </template>
          </Card>

        </div>

      </div>
    </TabPanel>
<!-- /**************************************************************/ -->

</TabView>

<div class="col-span-12 mt-6 mb-4">
  <Button
    icon="pi pi-check"
    class="w-full"
    severity="primary"
    label="Actualizar Datos"
    size="large"
    @click="funcionActualizar"
  />
  </div>
  </div>
  </div>
   </form>
</section>
      </template>
    </Card>
  </div>
</div>
<Toast />

<EnviarWhatsApp ref="enviarWhatsAppRef" :initialDatosWhatsApp="datosWhatsApp" />

<!-- /**************************************************************************************/ -->

<!-- Modal: Pagar al Técnico -->
<Dialog v-model:visible="visiblePagoTecnico" modal header="Registrar Pago al Técnico" :style="{ width: '600px' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
        <i class="pi pi-money-bill text-2xl text-green-600 dark:text-green-300"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 dark:text-white">Registrar Pago al Técnico</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">Técnico: {{ datoscampos.tecnico }}</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">

    <!-- Resumen del pago -->
    <Card class="bg-blue-50 dark:bg-blue-900/20">
      <template #content>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Orden #</p>
            <p class="text-lg font-bold text-gray-800 dark:text-white">{{ datoscampos.no_factura }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Beneficio a Pagar</p>
            <p class="text-2xl font-bold text-green-600">RD$ {{ parseFloat(datoscampos.beneficio_tecnico || 0).toFixed(2) }}</p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Formulario de pago -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

      <!-- Fecha de pago -->
      <div class="form-group">
        <label for="fecha-pago" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-calendar mr-1"></i>
          Fecha de Pago
        </label>
        <InputText
          v-model="datosPago.fecha_pago"
          id="fecha-pago"
          type="date"
          class="w-full"
        />
      </div>

      <!-- Monto pagado -->
      <div class="form-group">
        <label for="monto-pagado" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-dollar mr-1"></i>
          Monto Pagado
        </label>
        <InputText
          v-model="datosPago.monto_pagado"
          id="monto-pagado"
          v-numeroFocusinOut
          v-decimales
          v-solonumeros
          placeholder="0.00"
          class="w-full"
        />
      </div>

      <!-- Método de pago -->
      <div class="form-group">
        <label for="metodo-pago" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-credit-card mr-1"></i>
          Método de Pago
        </label>
        <select v-model="datosPago.metodo_pago" id="metodo-pago" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
          <option value="EFECTIVO">EFECTIVO</option>
          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
          <option value="TARJETA">TARJETA</option>
          <option value="CHEQUE">CHEQUE</option>
        </select>
      </div>

      <!-- Pagado por -->
      <div class="form-group">
        <label for="pagado-por" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <i class="pi pi-user mr-1"></i>
          Pagado Por
        </label>
        <InputText
          v-model="datosPago.pagado_por"
          id="pagado-por"
          readonly
          class="w-full bg-gray-100 dark:bg-gray-700"
        />
      </div>

    </div>

    <!-- Notas -->
    <div class="form-group">
      <label for="notas-pago" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        <i class="pi pi-file-edit mr-1"></i>
        Notas (Opcional)
      </label>
      <textarea
        v-model="datosPago.notas"
        id="notas-pago"
        rows="3"
        class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
        placeholder="Agregar notas adicionales sobre este pago..."
      ></textarea>
    </div>

  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        @click="visiblePagoTecnico = false"
        severity="secondary"
        outlined
      />
      <Button
        label="Registrar Pago"
        icon="pi pi-check"
        @click="registrarPagoTecnico"
        severity="success"
      />
    </div>
  </template>
</Dialog>

<Dialog v-model:visible="visibleAverias" position="top" modal :style="{ width: '50rem' }" header="Averias">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Averias</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Averias</legend>
    <div class="grid grid-cols-1  gap-4">
      <div>
        <label>Las Fallas se agregan separadas por coma ( , )</label>
        <Chips v-model="fallasChips" class="w-full" separator="," :allowDuplicate="false"  />
      </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Agregar Falla" outlined severity="secondary" @click="fnAgregarFalla"  />
      <Button label="Cerrar" outlined severity="secondary" @click="visibletaller = false"  />
  </template>
</Dialog>
<!-- /**************************************************************************************/ -->

<Dialog v-model:visible="visibleAccesorios" position="top" modal :style="{ width: '50rem' }" header="Accesorios">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <i class="pi pi-box text-primary-600 text-xl"></i>
      <span class="font-bold white-space-nowrap">Agregar Accesorios</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Accesorios del Equipo</legend>
    <div class="grid grid-cols-1 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Los accesorios se agregan separados por coma ( , )</label>
        <Chips
          v-model="accesoriosChips"
          class="w-full"
          separator=","
          :allowDuplicate="false"
          placeholder="Ej: Cargador, Cable USB, Funda"
        />
        <small class="text-gray-500 mt-2 block">Ejemplos: Cargador, Cable, Audífonos, Funda, Batería, etc.</small>
      </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Agregar Accesorios" icon="pi pi-check" outlined severity="success" @click="fnAgregarAccesorio"  />
      <Button label="Cerrar" icon="pi pi-times" outlined severity="secondary" @click="visibleAccesorios = false"  />
  </template>
</Dialog>
<!-- /**************************************************************************************/ -->

<Dialog v-model:visible="visiblePedidos" position="top" modal :style="{ width: '50rem' }" header="Pedidos">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Pedidos</span>
    </div>
  </template>

    <fieldset class="border p-3 rounded mb-2">
      <legend class="float-none w-auto px-2">Pedidos</legend>
      <div class="grid grid-cols-1 gap-4">
        <div v-for="category in parsedFallas" :key="category.key" class="flex items-center gap-2">
          <Checkbox v-model="piezasPedido" :inputId="category.key" name="category" :value="category.propiedad" />
          <label :for="category.key">{{ category.propiedad }}</label>
        </div>

        <div>
          <Select name="proveedor" v-model="proveedorWhatsapp" :options="proveedoresData" optionLabel="nombre" placeholder="Selecciones proveedor" fluid />
        </div>
      </div>
    </fieldset>

  <template #footer>
      <Button label="Realizar Pedido" outlined severity="secondary" @click="fnRealizarPedido" />
      <Button label="Cerrar" outlined severity="secondary" @click="visibletaller = false" />
  </template>
</Dialog>


<!-- /**************************************************************************************/ -->


<Dialog v-model:visible="visiblePedidoIndividual" position="top" modal :style="{ width: '30rem' }" header="PedidoIndividual">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">PedidoIndividual</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">PedidoIndividual</legend>
    <div class="grid grid-cols-1 gap-4">
      <div>
        <label for="pieza_pedido" class="block text-sm font-medium text-gray-700 dark:text-gray-400">PIEZA_PEDIDO</label>
          <InputText type="text" class="form-input w-full "  v-model="datoscamposPedido.pieza_pedido" placeholder="pieza_pedido" name="crearpieza_pedido" id="pieza_pedido" readonly />
      </div>

        <div>
          <Select name="proveedor" :options="proveedoresData" v-model="proveedorWhatsappIndividual"  optionLabel="nombre" placeholder="Selecciones proveedor" fluid />
        </div>

    </div>
  </fieldset>

  <template #footer>
      <Button label="Realizar Pedido" outlined severity="secondary" @click="fnPedidoIndividual" autofocus />
      <Button label="Consulta IA" outlined severity="secondary" @click="fnConsultaIA"  />
      <Button label="Cerrar" outlined severity="secondary" @click="visiblePedidoIndividual = false" autofocus />
  </template>
</Dialog>




<!-- /**************************************************************************************/ -->

<Dialog v-model:visible="visibleIA" position="top" modal :style="{ width: '75rem' }" header="IA">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">IA</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">IA</legend>


<div class="chat-container p-4 bg-gray-100 h-screen flex flex-col">
  <!-- Mensajes del chat -->
  <div ref="chatMessages" class="chat-messages space-y-4 overflow-y-auto flex-1">
    <div v-for="(message, index) in messages" :key="index" class="message flex">
      <!-- Mensaje del usuario -->
      <template v-if="message.sender === 'user'">
        <div class="ml-auto bg-blue-500 text-white py-2 px-4 rounded-lg max-w-2xl shadow">
          <p class="text-lg">{{ message.text }}</p>
        </div>
      </template>
      <!-- Mensaje de la IA -->
      <template v-else>
        <div class="mr-auto bg-gray-300 text-gray-800 py-2 px-4 rounded-lg max-w-2xl shadow">
          <p class="text-lg">{{ message.text }}</p>
        </div>
      </template>
    </div>
  </div>

  <!-- Input del chat -->
  <div class="chat-input mt-4">
    <input
      type="text"
      v-model="newMessage"
      @keydown.enter="sendMessage"
      placeholder="Escribe tu mensaje..."
      class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</div>


  </fieldset>

  <template #footer>
      <Button label="Cerrar" outlined severity="secondary" @click="visibleIA = false" autofocus />
  </template>
</Dialog>


<!-- /**************************************************************************************/ -->
<Dialog v-model:visible="visibleCostoReparacion" position="top" modal :style="{ width: '42rem' }" header="Costo Reparacion">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <i class="pi pi-money-bill text-green-600"></i>
      <span class="font-bold white-space-nowrap">Costo de Reparacion</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">Costo de Reparacion</legend>
    <p class="text-sm text-gray-600 mb-4">
      <i class="pi pi-info-circle mr-1"></i>
      Ingresa el total a cobrar o la mano de obra. Los cálculos se realizan automáticamente.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <!-- Total a Cobrar -->
      <div class="bg-green-50 p-3 rounded-lg border-2 border-green-400 shadow-sm hover:shadow-md transition-shadow">
        <label for="costoReparacionEditarTotal" class="block text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
          <i class="pi pi-dollar text-sm"></i>
          TOTAL A COBRAR AL CLIENTE
        </label>
        <InputNumber
          id="costoReparacionEditarTotal"
          v-model="formularioCostoReparacion.total"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          placeholder="$0.00"
          fluid
          @focus="$event.target.select()"
        />
        <p class="text-[10px] text-green-600 mt-1 leading-tight">
          <i class="pi pi-info-circle text-[9px]"></i> Campo principal
        </p>
      </div>

      <!-- Mano de Obra -->
      <div class="bg-blue-50 p-3 rounded-lg border-2 border-blue-400 shadow-sm hover:shadow-md transition-shadow">
        <label for="costoReparacionEditarManoObra" class="block text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
          <i class="pi pi-users text-sm"></i>
          MANO DE OBRA
        </label>
        <InputNumber
          id="costoReparacionEditarManoObra"
          v-model="formularioCostoReparacion.manodeobra"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          placeholder="$0.00"
          fluid
          @focus="$event.target.select()"
        />
        <p class="text-[10px] text-blue-600 mt-1 leading-tight">
          <i class="pi pi-calculator text-[9px]"></i> Se calcula automáticamente
        </p>
      </div>

      <!-- Costo Pieza -->
      <div class="bg-purple-50 p-3 rounded-lg border-2 border-purple-400 shadow-sm hover:shadow-md transition-shadow">
        <label for="costoReparacionEditarPiezas" class="block text-xs font-bold text-purple-700 mb-2 flex items-center gap-1">
          <i class="pi pi-box text-sm"></i>
          COSTO PIEZA
        </label>
        <InputNumber
          id="costoReparacionEditarPiezas"
          v-model="formularioCostoReparacion.preciopiezas"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          placeholder="$0.00"
          fluid
          @focus="$event.target.select()"
        />
        <p class="text-[10px] text-purple-600 mt-1 leading-tight">
          <i class="pi pi-wrench text-[9px]"></i> Se resta del total
        </p>
      </div>
    </div>

    <!-- Resumen Visual -->
    <div class="mt-4 p-3 bg-white rounded-lg border-2 border-green-500 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-500 mb-1 uppercase font-semibold">Desglose:</p>
          <p class="text-sm text-gray-700">
            <span class="font-semibold">M.O.:</span> ${{ parseFloat(formularioCostoReparacion.manodeobra || 0).toFixed(2) }}
            <span class="mx-2">+</span>
            <span class="font-semibold">Piezas:</span> ${{ parseFloat(formularioCostoReparacion.preciopiezas || 0).toFixed(2) }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-500 mb-1 uppercase font-semibold">Total:</p>
          <p class="text-2xl font-bold text-green-600">
            ${{ parseFloat(formularioCostoReparacion.total || 0).toFixed(2) }}
          </p>
        </div>
      </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Aplicar Costo" severity="success" icon="pi pi-check" @click="aplicarCostoReparacion" />
      <Button label="Cerrar" outlined severity="secondary" icon="pi pi-times" @click="visibleCostoReparacion = false" />
  </template>
</Dialog>
<!-- /********************************************************************************************/ -->

<Dialog v-model:visible="visibleCostoPiezas" position="top" modal :style="{ width: '30rem' }" header="CostoPiezas">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">CostoPiezas</span>
    </div>
  </template>

  <fieldset class="border p-3 rounded mb-2">
    <legend class="float-none w-auto px-2">CostoPiezas</legend>
    <div class="grid grid-cols-1 gap-4">
      <div>
<div class="form-group " >
<label for="emailAgregarDatos">COSTO PIEZA</label><br>
     <InputText v-model="costoPieza" fluid @change="fnAplicarPrecioPieza" v-solonumeros v-focus-in-focus-out />
</div>
      </div>
    </div>
  </fieldset>

  <template #footer>
      <Button label="Aplicar Precio" outlined severity="secondary" @click="fnAplicarPrecioPieza"  />
      <Button label="Cerrar" outlined severity="secondary" @click="visibleCostoPiezas = false"  />
  </template>
</Dialog>
<!-- /********************************************************************************************/ -->

<Dialog v-model:visible="visiblePiezas" position="top" modal :style="{ width: '75rem' }" header="Piezas" @show="fetchProductosDatosarraypost">
  <template #header>
    <div class="inline-flex align-items-center justify-content-center gap-2">
      <span class="font-bold white-space-nowrap">Piezas</span>
    </div>
  </template>

      <fieldset class="border p-3 rounded mb-2">
        <legend class="float-none w-auto px-2">LISTADO DE PIEZAS DISPONIBLES</legend>
          <div class="card">
          <input v-model="searchQuery" placeholder="Buscar piezas..." class="p-inputtext p-component" style="margin-bottom: 10px;" />
          <Button label="Recargar piezas" icon="pi pi-refresh" severity="secondary" outlined class="mb-2 ml-2" @click="fetchProductosDatosarraypost" />
            <ContextMenu ref="cm" :model="menuModel" @hide="selectedProduct = null" />
            <DataTable :value="filteredProducts"  scrollable scrollHeight="600px" @rowSelect="onRowSelect" selectionMode="single" dataKey="id" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 70rem">
              <Column field="codigo" header="Código" sortable />
              <Column field="nombre" header="Pieza" sortable />
              <Column field="categoria" header="Categoría" sortable />
              <Column field="modelo_compatible" header="Compatible" sortable />
              <Column field="stock" header="Stock" sortable />
              <Column field="stock_minimo" header="Mínimo" sortable />
              <Column field="costo" header="Costo" sortable>
                <template #body="{ data }">
                  RD$ {{ Number(data.costo || 0).toFixed(2) }}
                </template>
              </Column>
              <Column field="precio_venta" header="Venta" sortable>
                <template #body="{ data }">
                  RD$ {{ Number(data.precio_venta || 0).toFixed(2) }}
                </template>
              </Column>
              <Column field="ubicacion" header="Ubicación" sortable />
              <Column field="estado" header="Estado" sortable />
            </DataTable>

          </div>
        </fieldset>

  <template #footer>
      <Button label="Cerrar" outlined severity="secondary" @click="visiblePiezas = false" autofocus />
  </template>
</Dialog>


<!-- /********************************************************************************************/ -->

<!-- Modal PDF Microsoldadura -->
<Dialog v-model:visible="pdfDialogMicrosoldadura" :modal="true" :style="{ width: '90vw', height: '90vh' }" header="Contrato de Servicio - Micro Soldadura">
  <div style="height: calc(90vh - 120px);">
    <iframe
      v-if="pdfUrlMicrosoldadura"
      :src="pdfUrlMicrosoldadura"
      style="width: 100%; height: 100%; border: none;"
      title="PDF Contrato Microsoldadura"
    ></iframe>
  </div>
  <template #footer>
    <Button label="Descargar PDF" icon="pi pi-download" @click="() => {
      const link = document.createElement('a');
      link.href = pdfUrlMicrosoldadura;
      link.download = `Contrato_Microsoldadura_${datoscampos.value.no_factura || datoscampos.value.id}.pdf`;
      link.click();
    }" severity="success" />
    <Button label="Imprimir" icon="pi pi-print" @click="() => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfUrlMicrosoldadura;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow.print();
      };
    }" severity="info" />
    <Button label="Cerrar" icon="pi pi-times" @click="pdfDialogMicrosoldadura = false" severity="secondary" outlined />
  </template>
</Dialog>

<Dialog v-model:visible="visibleAbonarModal" modal :style="{ width: '34rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
        <i class="pi pi-wallet text-green-600 text-lg"></i>
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-800">Registrar Abono</h3>
        <p class="text-sm text-gray-500">Aplicar pago parcial o saldar la orden</p>
      </div>
    </div>
  </template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Total Orden</p>
        <p class="text-xl font-bold text-slate-800">RD$ {{ Number(datoscampos.total || 0).toFixed(2) }}</p>
      </div>
      <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-1">Saldo Actual</p>
        <p class="text-xl font-bold text-emerald-700">RD$ {{ Number(datoscampos.saldo || 0).toFixed(2) }}</p>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Monto a abonar</label>
      <InputNumber
        v-model="nuevoAbonoTaller.abono"
        mode="currency"
        currency="DOP"
        locale="es-DO"
        :min="0"
        :max="Number(datoscampos.saldo || 0)"
        fluid
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
      <Select
        v-model="nuevoAbonoTaller.metodo_pago"
        :options="['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']"
        fluid
      />
    </div>
  </div>
  <template #footer>
    <Button label="Cancelar" severity="secondary" outlined @click="visibleAbonarModal = false" />
    <Button label="Pagar Completo" severity="contrast" icon="pi pi-check-circle" @click="guardarNuevoAbonoTaller(true)" />
    <Button label="Abonar" severity="success" icon="pi pi-save" @click="guardarNuevoAbonoTaller()" />
  </template>
</Dialog>

<Dialog v-model:visible="visibleEditarAbono" modal header="Editar Abono" :style="{ width: '32rem' }">
  <div class="grid grid-cols-1 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Monto</label>
      <InputNumber
        v-model="abonoEditando.abono"
        mode="currency"
        currency="DOP"
        locale="es-DO"
        :min="0"
        fluid
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
      <Select
        v-model="abonoEditando.metodo_pago"
        :options="['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']"
        fluid
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
      <InputText v-model="abonoEditando.fecha" fluid />
    </div>
  </div>
  <template #footer>
    <Button label="Cancelar" severity="secondary" outlined @click="visibleEditarAbono = false" />
    <Button label="Guardar" icon="pi pi-save" severity="success" @click="guardarEdicionAbono" />
  </template>
</Dialog>

<ImpresoraTaller
  v-model:visible="visibleImpresoraTaller"
  :ordenData="ordenParaImprimir"
  :empresaData="datosEmpresa.empresa"
  :formatoImpresion="formatoImpresion"
  @close="visibleImpresoraTaller = false"
/>

  <LoadingOverlay :visible="loading" />

</template>
<style scoped>
/* Professional Cell Phone Repair Shop Styling - Edit View */


#campos {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    display: block !important;  /* evita que limite altura por la grilla */
}


.editar-taller-wrapper {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 26%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 24%),
    linear-gradient(180deg, #f7fafc 0%, #eef6ff 52%, #f4f8fb 100%);
  padding: 2rem;
}

.editar-taller-container {
  max-width: 1480px;
  margin: 0 auto;
}

/* Header Styles */
.editar-taller-header {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.16), transparent 18%),
    linear-gradient(135deg, #0f172a 0%, #0f766e 48%, #14b8a6 100%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 2.2rem;
  margin-bottom: 2rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  animation: slideIn 0.5s ease-out;
}

.editar-taller-header::after {
  content: '';
  position: absolute;
  right: -60px;
  bottom: -90px;
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  filter: blur(6px);
}

.editar-taller-header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
}

.editar-taller-icon-wrapper {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.editar-taller-icon {
  font-size: 2.5rem;
  color: white;
}

.editar-taller-title {
  font-size: clamp(1.85rem, 3vw, 2.45rem);
  font-weight: 800;
  color: white;
  margin: 0;
  letter-spacing: -0.03em;
}

.editar-taller-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.82);
  margin: 0.45rem 0 0 0;
  max-width: 680px;
}

/* Card Styles */
.editar-taller-nav-card,
.editar-taller-form-card {
  margin-bottom: 1.5rem;
  border-radius: 26px;
overflow: visible !important; 
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  border: 1px solid #d9e7ef;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  animation: slideIn 0.5s ease-out;
}

.editar-taller-nav-card {
  animation-delay: 0.1s;
}

.editar-taller-form-card {
  animation-delay: 0.2s;
}

/* Section Divider */
.editar-taller-section-divider {
  border-bottom: 1px solid #dbe7f0;
  padding-bottom: 0.95rem;
  margin-bottom: 1.5rem;
}

.editar-taller-section-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.editar-taller-section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 1.5rem;
  background: linear-gradient(180deg, #0f766e 0%, #14b8a6 100%);
  border-radius: 2px;
}

/* Animation */
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

/* Form Visibility and Layout */
.editar-taller-form-card .p-card-content {
  padding: 0 !important;
}

.editar-taller-nav-card .p-card-content,
.editar-taller-form-card .p-card-content {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.editar-taller-nav-card :deep(.p-card-body),
.editar-taller-form-card :deep(.p-card-body) {
  padding: 1.35rem;
}

/* TabView Styles */
.editar-taller-form-card :deep(.p-tabview) {
  background: transparent;
}

.editar-taller-form-card :deep(.p-tabview-nav) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  padding: 0.7rem;
  border-radius: 22px;
  background: linear-gradient(180deg, #f9fbfc 0%, #edf4f7 100%);
  border: 1px solid #d8e3ee;
}

.editar-taller-form-card :deep(.p-tabview-nav li) {
  margin: 0;
}

.editar-taller-form-card :deep(.p-tabview-nav-link) {
  border: none !important;
  border-radius: 16px !important;
  background: transparent !important;
  color: #334155 !important;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.85rem 1rem !important;
}

.editar-taller-form-card :deep(.p-tabview-selected .p-tabview-nav-link) {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(20, 184, 166, 0.2)) !important;
  color: #0f172a !important;
  box-shadow: inset 0 0 0 1px rgba(20, 184, 166, 0.18);
}

.editar-taller-form-card :deep(.p-tabview-panels) {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%);
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

/* Label Styles */
.editar-taller-form-card label,
.editar-taller-nav-card label {
  display: block;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.45rem;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}

/* Input Styles */
.editar-taller-form-card :deep(.p-inputtext),
.editar-taller-form-card :deep(.p-textarea),
.editar-taller-form-card :deep(.p-select),
.editar-taller-form-card :deep(.p-dropdown),
.editar-taller-form-card :deep(.p-inputmask),
.editar-taller-form-card :deep(textarea),
.editar-taller-form-card :deep(select),
.editar-taller-form-card :deep(input:not([type='checkbox'])),
.editar-taller-form-card :deep(.p-autocomplete-input),
.editar-taller-form-card :deep(.p-inputnumber-input) {
  width: 100%;
  border-radius: 16px;
  border: 1px solid #d8e3ee;
  background: #f8fbfd;
  min-height: 48px;
  color: #0f172a;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.editar-taller-form-card :deep(textarea) {
  min-height: 110px;
  resize: vertical;
}

.editar-taller-form-card :deep(.p-inputtext:focus),
.editar-taller-form-card :deep(.p-dropdown:focus-within),
.editar-taller-form-card :deep(.p-inputmask:focus),
.editar-taller-form-card :deep(textarea:focus),
.editar-taller-form-card :deep(select:focus),
.editar-taller-form-card :deep(input:not([type='checkbox']):focus),
.editar-taller-form-card :deep(.p-autocomplete-input:focus),
.editar-taller-form-card :deep(.p-inputnumber-input:focus) {
  border-color: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14);
  outline: none;
}

.editar-taller-form-card :deep(.p-button),
.editar-taller-nav-card :deep(.p-button),
.editar-taller-form-card :deep(button.btn) {
  border-radius: 16px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.editar-taller-nav-card :deep(.p-button) {
  min-height: 48px;
}

.editar-taller-form-card :deep(.p-button:not(.p-button-secondary):not(.p-button-outlined)),
.editar-taller-nav-card :deep(.p-button:not(.p-button-secondary):not(.p-button-outlined):not(.p-button-contrast):not(.p-button-danger)),
.editar-taller-form-card :deep(button.btn) {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  border: none;
  box-shadow: 0 16px 28px rgba(15, 118, 110, 0.16);
}

.editar-taller-nav-card :deep(.p-button.p-button-contrast),
.editar-taller-form-card :deep(.p-button.p-button-secondary) {
  background: #eef2f7;
  color: #0f172a;
  border-color: #d8e3ee;
}

.editar-taller-form-card :deep(.p-chips-multiple-container) {
  border-radius: 16px;
  border: 1px solid #d8e3ee;
  background: #f8fbfd;
  min-height: 48px;
}

.editar-taller-form-card :deep(.p-chip) {
  background: #dcfce7;
  color: #166534;
  border-radius: 999px;
}

.editar-taller-form-card :deep(.p-checkbox-box) {
  border-radius: 10px;
}

.editar-taller-form-card :deep(.grid.grid-cols-12),
.editar-taller-nav-card :deep(.grid.grid-cols-12) {
  row-gap: 1rem;
}

.editar-taller-nav-card :deep(.flex.flex-wrap.gap-2) {
  gap: 0.75rem;
}

.editar-taller-form-card :deep(.p-card-content > section) {
  overflow: visible;
}

@media (max-width: 1200px) {
  .editar-taller-container {
    max-width: 100%;
  }

  .editar-taller-header-content {
    align-items: stretch;
  }

  .editar-taller-form-card :deep(.p-tabview-nav-link) {
    padding: 0.75rem 0.9rem !important;
    font-size: 0.82rem;
  }
}

@media (max-width: 1024px) {
  .editar-taller-wrapper {
    padding: 1.25rem;
  }

  .editar-taller-header {
    padding: 1.7rem;
  }

  .editar-taller-nav-card :deep(.flex.flex-wrap.gap-2) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .editar-taller-nav-card :deep(.p-button) {
    width: 100%;
    justify-content: center;
  }

  .editar-taller-form-card :deep(.grid.grid-cols-12 > [class*='md:col-span-']),
  .editar-taller-form-card :deep(.grid.grid-cols-12 > [class*='lg:col-span-']) {
    grid-column: span 6 / span 6;
  }

  .editar-taller-form-card :deep(.grid.grid-cols-12 > .col-span-12),
  .editar-taller-form-card :deep(.grid.grid-cols-12 > [class*='col-span-12']) {
    grid-column: 1 / -1 !important;
  }

  .editar-taller-form-card :deep(.p-tabview-nav) {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
}

@media (max-width: 768px) {
  .editar-taller-wrapper {
    padding: 1rem;
  }

  .editar-taller-header {
    padding: 1.35rem;
    border-radius: 22px;
  }

  .editar-taller-header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .editar-taller-title {
    font-size: 1.6rem;
  }

  .editar-taller-subtitle {
    font-size: 0.92rem;
  }

  .editar-taller-nav-card,
  .editar-taller-form-card {
    border-radius: 20px;
  }

  .editar-taller-nav-card :deep(.p-card-body),
  .editar-taller-form-card :deep(.p-card-body) {
    padding: 0.95rem;
  }

  .editar-taller-nav-card :deep(.flex.flex-wrap.gap-2) {
    grid-template-columns: 1fr;
  }

  .editar-taller-form-card :deep(.grid.grid-cols-12 > *) {
    grid-column: 1 / -1 !important;
  }

  .editar-taller-form-card :deep(.p-tabview-nav) {
    padding: 0.5rem;
    border-radius: 18px;
  }

  .editar-taller-form-card :deep(.p-tabview-panels) {
    padding: 0.75rem;
    border-radius: 18px;
  }

  .editar-taller-form-card :deep(.p-tabview-nav-link) {
    width: 100%;
    justify-content: center;
    text-align: center;
    font-size: 0.76rem;
  }
}

@media (max-width: 560px) {
  .editar-taller-wrapper {
    padding: 0.75rem;
  }

  .editar-taller-header {
    padding: 1.1rem;
    border-radius: 18px;
  }

  .editar-taller-icon-wrapper {
    padding: 1rem;
    border-radius: 18px;
  }

  .editar-taller-icon {
    font-size: 2rem;
  }

  .editar-taller-title {
    font-size: 1.4rem;
  }

  .editar-taller-form-card :deep(.p-tabview-nav-link) {
    padding: 0.65rem 0.8rem !important;
    font-size: 0.7rem;
  }

  .editar-taller-form-card :deep(.p-inputtext),
  .editar-taller-form-card :deep(.p-textarea),
  .editar-taller-form-card :deep(.p-select),
  .editar-taller-form-card :deep(.p-dropdown),
  .editar-taller-form-card :deep(.p-inputmask),
  .editar-taller-form-card :deep(textarea),
  .editar-taller-form-card :deep(select),
  .editar-taller-form-card :deep(input:not([type='checkbox'])),
  .editar-taller-form-card :deep(.p-autocomplete-input),
  .editar-taller-form-card :deep(.p-inputnumber-input) {
    min-height: 44px;
  }
}

/* Chat Styles (preserved for IA feature) */
.chat-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 50vh;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
}

.message {
  display: flex;
  justify-content: flex-start;
}

.user-message {
  background-color: #dcf8c6;
  border-radius: 8px;
  padding: 10px;
  max-width: 75%;
  align-self: flex-end;
}

.ia-message {
  background-color: #f1f0f0;
  border-radius: 8px;
  padding: 10px;
  max-width: 75%;
  align-self: flex-start;
}

</style>
