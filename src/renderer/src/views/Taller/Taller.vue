<script setup>
import { ref, onMounted, nextTick, watchEffect, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import EnviarWhatsApp from '@/components/WhatsappModal.vue';
import LoadingOverlay from '@/Loading/LoadingOverlay.vue';
import ImpresoraTaller from '@/components/ImpresoraTaller.vue';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste,
peticiones,enviarDatosLocalStorage,
peticionesFetchOffline,
arrayToObjetoFromTablaOffline,
crearTablaSiNoExisteOffline,
generarTablaFromStringJSON, lasMayusculas,formatearFecha,transformarFechaTimestamp,
ultimoRegistro,
generadorCodigo } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
import * as XLSX from 'xlsx';

/************************************************************************/
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Importa la extensión autoTable
/************************************************************************/
const currentRowData = ref(null);
const showWhatsapp = ref(false);
const visibleNomina = ref(false);
const datosTallerN = ref([]);
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
// Variables para el PDF de Reporte
const pdfDialogVisible = ref(false);
const pdfUrl = ref('');
const pdfReporteData = ref(null);
/************************************************************************/
const camposArray = ["nombre","cedula","direccion","telefono","whatsapp","email","equipo","marca","modelo","serial","imei","clave","accesorios","observaciones","fallas","reparacion","piezas","tecnico","metodopago","fecha_entrada","fecha_entrega","no_factura","estado","preciopiezas","pago_tecnico",
"beneficio_tecnico",
"porcentaje_tecnico",
"beneficio_empresa","manodeobra","abono","saldo","total","imagen","usuario","almacen","historial_pagos","historial_orden","piezas_usadas","firma_entrega","firma_entrega_nombre","firma_entrega_fecha","firma_entrega_documento","firma_entrega_token"];
/************************************************************************/
import { useDatosEmpresa } from '@/stores'
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
const selectedItems = ref([]);
const visibleCostoPiezas = ref(false);
const costoPieza = ref(0);
const visibleCostoReparacion = ref(false);
const formularioCostoReparacion = ref({
  total: 0,
  manodeobra: 0,
  preciopiezas: 0
});
const totalCostoReparacion = computed(() => {
  const manodeobra = Number(formularioCostoReparacion.value.manodeobra || 0);
  const preciopiezas = Number(formularioCostoReparacion.value.preciopiezas || 0);
  return manodeobra + preciopiezas;
});
/************************************************************************/
const visibleEtiquetaModal = ref(false);
const etiquetaOrdenData = ref({});
const listaImpresorasEtiqueta = ref([]);
const cargandoImpresorasEtiqueta = ref(false);
const visibleHistorialOrden = ref(false);
const ordenHistorialSeleccionada = ref(null);
const etiquetaOpciones = ref({
  incluirCabecera: false,
  incluirCodigo: true,
  incluirTexto: true,
  incluirPrecio: true,
  cantidad: 1,
  labelUnit: 'mm',
  labelWidthMm: 50.8,
  labelHeightMm: 76.2,
  printerName: ''
});
/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const fechaInteligente = ref(false)
const visibleAbonosInteligentes = ref(false)
const datosAbonosInteligentes = ref([])
/************************************************************************/
const menuInteligente = ref();
const buscadorFechaInteligente = ref()
/************************************************************************/
const visiblePedidoIndividual = ref(false)
const proveedorWhatsapp = ref({});
const proveedoresData = ref([])
const piezasPedido = ref([])
/************************************************************************/
const visible = ref(false);
const visiblecrear = ref(false);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const TallerEditar = ref(null);
/************************************************************************/
const almacenFiltro = ref('');
const almacenesDisponibles = ref([]);
/************************************************************************/
const date = ref(new Date());
const clearDate = () => {
  date.value = null;
};
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposTaller.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }

  if (showWhatsapp.value) {
    datosWhatsApp.value.nombre = currentRowData.value.nombre;
    datosWhatsApp.value.numero = currentRowData.value.whatsapp || currentRowData.value.telefono
    datosWhatsApp.value.texto = `Hola ${currentRowData.value.nombre} le escribimos de  *${datosEmpresa.empresa.nombre}* para informarle que su equipo se encuentra *${currentRowData.value.estado}*`;
    showWhatsAppModal()
  }

});
/************************************************************************/
const fetchAndSetupData = async () => {
const response = await peticionesFetchOffline('getDataAsArray', 'taller');
    const jsonData = response.reverse();
    data.value = jsonData;
};
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('taller');
  datoscamposTaller.value = campos;
}
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
/************************************************************************/
const datosBarcode = ref({})
const obtenerImpresoraLabelDefault = () =>
  datosBarcode.value?.impresoraLabel?.printerName || datosBarcode.value?.impresora || ''
const obtenerImpresoraEtiquetaDisponible = () => {
  const impresoraConfigurada = obtenerImpresoraLabelDefault()
  if (impresoraConfigurada && listaImpresorasEtiqueta.value.includes(impresoraConfigurada)) {
    return impresoraConfigurada
  }
  return listaImpresorasEtiqueta.value[0] || impresoraConfigurada || ''
}
const obtenerNumeroEtiqueta = (valor, fallback) => {
  const numero = Number.parseInt(valor, 10)
  return Number.isFinite(numero) ? numero : fallback
}
const obtenerDecimalEtiqueta = (valor, fallback) => {
  const numero = Number.parseFloat(valor)
  return Number.isFinite(numero) ? numero : fallback
}
const pxToMm = (pixeles) => Number(((Number(pixeles) || 0) * 25.4 / 96).toFixed(1))
const mmToPx = (milimetros) => Math.max(1, Math.round((Number(milimetros) || 0) * 96 / 25.4))
const mmToIn = (milimetros) => Number(((Number(milimetros) || 0) / 25.4).toFixed(2))
const inToMm = (pulgadas) => Number(((Number(pulgadas) || 0) * 25.4).toFixed(1))
const cambiarUnidadEtiqueta = (unidad) => {
  if (etiquetaOpciones.value.labelUnit === unidad) return
  if (unidad === 'in') {
    etiquetaOpciones.value.labelWidthMm = mmToIn(etiquetaOpciones.value.labelWidthMm)
    etiquetaOpciones.value.labelHeightMm = mmToIn(etiquetaOpciones.value.labelHeightMm)
  } else {
    etiquetaOpciones.value.labelWidthMm = inToMm(etiquetaOpciones.value.labelWidthMm)
    etiquetaOpciones.value.labelHeightMm = inToMm(etiquetaOpciones.value.labelHeightMm)
  }
  etiquetaOpciones.value.labelUnit = unidad
}
const obtenerTamanoEtiquetaDefault = () => {
  const anchoMicras = Number(datosBarcode.value?.impresoraLabel?.width)
  const altoMicras = Number(datosBarcode.value?.impresoraLabel?.height)
  const unidad = datosBarcode.value?.impresoraLabel?.unit === 'in' ? 'in' : 'mm'
  const anchoMm = anchoMicras > 0
    ? Number((anchoMicras / 1000).toFixed(1))
    : pxToMm(obtenerNumeroEtiqueta(datosBarcode.value.labelwidth, 100))
  const altoMm = altoMicras > 0
    ? Number((altoMicras / 1000).toFixed(1))
    : pxToMm(obtenerNumeroEtiqueta(datosBarcode.value.labelheight, 65))
  return {
    labelUnit: unidad,
    labelWidthMm: unidad === 'in' ? mmToIn(anchoMm) : anchoMm,
    labelHeightMm: unidad === 'in' ? mmToIn(altoMm) : altoMm
  }
}
/************************************************************************/
const fetchDataBarcode = async () => {
const [response, configArchivo] = await Promise.all([
  peticionesFetchOffline('getDataAsArray', 'barcode'),
  envioElectron('datosarchivo')
]);
    const jsonData = response[0] || {};
    datosBarcode.value = {
      ...jsonData,
      impresoraLabel: configArchivo?.impresoraLabel
    };
};
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
onMounted(async () => {
const datosJSON = await envioElectron('datosarchivo');
link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

  tokenCifrado.value = await encryptarPassword(token.value, 10);
  await crearTablaSiNoExisteOffline('taller', camposArray,toast);
  await asegurarCamposProfesionalesTaller();
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
  const empresas = await peticionesFetchOffline('getDataAsArray', 'empresa');
  almacenesDisponibles.value = (empresas || []).map(item => item.nombre).filter(Boolean);
  almacenFiltro.value = datosEmpresa.empresa.nombre;
  await fetchAndSetupData();
  await fetchDataBarcode();
  await fetchProveedores();
  await fetchUsuariosData();
await fetchClientesData();
});
/************************************************************************/
  async function borrarTodo() {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Se borrarán los datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo",
        cancelButtonText: "No, cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
               if (password === token.value || password === tokenCorto.value) {
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'taller');
                    if (envioDatos[0] == 'ok') {
                        fetchAndSetupData();
                        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos borrados', life: 3000 });
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos.', life: 3000 });
                   }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos seguros', life: 3000 });
        }
    });
}
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
/************************************************************************/
const parsedFallas = computed(() => {
  return JSON.parse(currentRowData.value.fallas);
});
/************************************************************************/
async function funcionActualizar() {
  const url = link.value+api.value+"/actualizarcampos/taller";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData','taller', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function funcionCrear() {
  const url = link.value+api.value+"/insertar/taller";
  if (datoscamposTaller.value.hasOwnProperty('created_at')) {
    datoscamposTaller.value.created_at = nfecha('timestamp');
    datoscamposTaller.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('insertData','taller', JSON.stringify(datoscamposTaller.value));
  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Agregados', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Agregar los datos.', life: 3000 });
  }
}
/************************************************************************/
async function borrarSeleccionados() {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
    Swal.fire({
        title: "¿Estas Seguro?",
        text: "Se Borraran los Datos!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, de acuerdo!",
        cancelButtonText: "No, cancelar!",
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { value: password } = await Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });
            if (password) {
                if (password === token.value || password === tokenCorto.value) {
                    let exitoTotal = true;
                    if (ids.length > 0) {
                        for (const id of ids) {
                            try {
                                const envioDatos = await peticionesFetchOfflineRED('deleteEntry','taller', id);
                            } catch (error) {
                                console.error(`Error al eliminar datos para ID: ${id}`, error);
                                exitoTotal = false;
                            }
                        }
                        if (exitoTotal) {
                            fetchAndSetupData();
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Borrados', life: 3000 });
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al Borrar los datos.', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'No hay datos para borrar', life: 3000 });
                    }
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                }
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            toast.add({ severity: 'success', summary: 'No te preocupes', detail: 'Datos Seguros', life: 3000 });
        }
    });
}
/************************************************************************/
const obtenerTextoEtiqueta = (ordenData) => {
 let fallasN = "";
try {
    const fallasArray = JSON.parse(ordenData?.fallas || '[]');
    if (Array.isArray(fallasArray)) {
        fallasN = fallasArray.map(fl => fl.propiedad).join(',');
    }
} catch (error) {
    console.error("Error al parsear fallas:", error);
}
return fallasN;
};

const obtenerHistorialOrden = (ordenData) => {
try {
  const historial = JSON.parse(ordenData?.historial_orden || '[]');
  return Array.isArray(historial) ? historial : [];
} catch (error) {
  return [];
}
};

const historialOrdenActual = computed(() => obtenerHistorialOrden(ordenHistorialSeleccionada.value));

const registrarEventoOrden = (ordenData, { tipo = 'actualizacion', titulo = 'Actualización', detalle = '' } = {}) => {
  const historial = obtenerHistorialOrden(ordenData);
  historial.unshift({
    tipo,
    titulo,
    detalle,
    usuario: usuarioLocal.value?.nombre || usuarioLocal.value?.email || 'Sistema',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    timestamp: nfecha('timestamp')
  });
  ordenData.historial_orden = JSON.stringify(historial);
  return ordenData;
};

const obtenerUrlFirmaEntrega = (ordenData) => {
  const baseUrl = window.location.origin || ''
  return `${baseUrl}/firma-entrega-taller/${encodeURIComponent(ordenData?.no_factura || '')}`
}

const enviarFirmaEntregaWhatsapp = (ordenData) => {
  if (!ordenData?.no_factura) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'La orden no tiene numero para generar enlace.', life: 3000 });
    return
  }

  const numero = String(ordenData.whatsapp || ordenData.telefono || '').replace(/\D/g, '')
  const urlFirma = obtenerUrlFirmaEntrega(ordenData)
  const mensaje = encodeURIComponent(`Hola ${ordenData.nombre || ''}, para completar la entrega de su equipo ${ordenData.equipo || ''} ${ordenData.marca || ''} ${ordenData.modelo || ''}, firme aqui: ${urlFirma}`)
  const destino = numero ? `https://wa.me/${numero}?text=${mensaje}` : `https://wa.me/?text=${mensaje}`
  window.open(destino, '_blank')
}

const abrirHistorialOrden = (ordenData) => {
ordenHistorialSeleccionada.value = ordenData || null;
visibleHistorialOrden.value = true;
};

const obtenerTotalAbonosOrden = (ordenData) => {
try {
  const abonos = JSON.parse(ordenData?.abono || '[]');
  if (!Array.isArray(abonos)) {
    return 0;
  }
  return abonos.reduce((total, item) => total + (Number(item?.abono) || 0), 0);
} catch (error) {
  return 0;
}
};

const abrirModalCostoReparacion = (ordenData) => {
if (!ordenData) {
  Swal.fire("Error", "No hay una orden seleccionada", "error");
  return;
}

currentRowData.value = ordenData;
const totalActual = Number(ordenData.total || 0);
const manodeobraActual = Number(ordenData.manodeobra || 0);
const preciopiezasActual = Number(ordenData.preciopiezas || 0);
const tieneDesglose = manodeobraActual > 0 || preciopiezasActual > 0;
formularioCostoReparacion.value = {
  total: totalActual,
  manodeobra: tieneDesglose ? manodeobraActual : totalActual,
  preciopiezas: preciopiezasActual
};
visibleCostoReparacion.value = true;
};

const aplicarCostoReparacion = async() => {
const data = currentRowData.value;
if (!data) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'No hay una orden seleccionada', life: 3000 });
  return;
}

const manodeobra = Number(formularioCostoReparacion.value.manodeobra || 0);
const preciopiezas = Number(formularioCostoReparacion.value.preciopiezas || 0);
const total = Number(totalCostoReparacion.value || 0);

if (!Number.isFinite(total) || total <= 0) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'El costo total debe ser mayor a 0.00', life: 3000 });
  return;
}

if (!Number.isFinite(manodeobra) || manodeobra < 0) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'La mano de obra debe ser 0.00 o mayor', life: 3000 });
  return;
}

if (!Number.isFinite(preciopiezas) || preciopiezas < 0) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'El costo de piezas debe ser 0.00 o mayor', life: 3000 });
  return;
}

if (preciopiezas > total) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'El costo de piezas no puede superar el costo total', life: 3000 });
  return;
}

const porcentajeTecnico = Number(data.porcentaje_tecnico || 0);
const gananciaNeta = total - preciopiezas;
const beneficioTecnico = (gananciaNeta * (porcentajeTecnico / 100)).toFixed(2);
const beneficioEmpresa = (gananciaNeta - Number(beneficioTecnico)).toFixed(2);
const totalAbonado = obtenerTotalAbonosOrden(data);
const saldo = Math.max(0, total - totalAbonado).toFixed(2);

data.total = total.toFixed(2);
data.manodeobra = manodeobra.toFixed(2);
data.preciopiezas = preciopiezas.toFixed(2);
data.saldo = saldo;
data.beneficio_empresa = beneficioEmpresa;
data.beneficio_tecnico = beneficioTecnico;

registrarEventoOrden(data, {
  tipo: 'costo-reparacion',
  titulo: 'Costo de reparacion actualizado',
  detalle: `Total: $${total.toFixed(2)}. Mano de obra: $${manodeobra.toFixed(2)}. Piezas: $${preciopiezas.toFixed(2)}.`
});

if (data.hasOwnProperty('created_at')) {
  data.updated_at = nfecha('timestamp');
}

const envioDatos = await peticionesFetchOffline('updateData','taller', JSON.stringify(data));
if (envioDatos[0] == 'ok') {
  visibleCostoReparacion.value = false;
  toast.add({ severity: 'success', summary: 'Exito', detail: 'Costo de reparacion actualizado', life: 3000 });
  await fetchAndSetupData();
} else {
  toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
}
};

const cargarImpresorasEtiqueta = async() => {
cargandoImpresorasEtiqueta.value = true;
try {
  const impresorasDisponibles = await window.electron.ipcRenderer.invoke('get-printers');
  listaImpresorasEtiqueta.value = impresorasDisponibles || [];
} catch (error) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener la lista de impresoras.', life: 3000 });
  listaImpresorasEtiqueta.value = [];
} finally {
  cargandoImpresorasEtiqueta.value = false;
}
};

const abrirModalEtiqueta = async(ordenData) => {
etiquetaOrdenData.value = ordenData || {};
await cargarImpresorasEtiqueta();
const impresoraDefault = obtenerImpresoraEtiquetaDisponible();
const tamanoEtiqueta = obtenerTamanoEtiquetaDefault();
etiquetaOpciones.value = {
  incluirCabecera: false,
  incluirCodigo: true,
  incluirTexto: true,
  incluirPrecio: true,
  cantidad: 1,
  labelUnit: tamanoEtiqueta.labelUnit,
  labelWidthMm: tamanoEtiqueta.labelWidthMm,
  labelHeightMm: tamanoEtiqueta.labelHeightMm,
  printerName: impresoraDefault
};
visibleEtiquetaModal.value = true;
};

const printBarcode = async(ordenData,opciones = {}) => {
const barcode = ordenData?.no_factura;
if (!barcode) {
  toast.add({ severity: 'error', summary: 'Error', detail: 'La orden no tiene número para imprimir la etiqueta', life: 3000 });
  return;
}

const fallasN = obtenerTextoEtiqueta(ordenData);
const margenSuperior = obtenerNumeroEtiqueta(datosBarcode.value.margen_sup, 0);
const margenDerecho = obtenerNumeroEtiqueta(datosBarcode.value.margen_der, 0);
const margenInferior = obtenerNumeroEtiqueta(datosBarcode.value.margen_inf, 0);
const margenIzquierdo = obtenerNumeroEtiqueta(datosBarcode.value.margen_izq, 0);
const barWidth = obtenerNumeroEtiqueta(datosBarcode.value.barwidth, 2);
const barHeight = obtenerNumeroEtiqueta(datosBarcode.value.barheight, 30);
const barcodeType = datosBarcode.value.barcodetype || 'CODE128';
const opcionesEtiqueta = {
  incluirCabecera: false,
  incluirTexto: true,
  incluirCodigo: true,
  incluirPrecio: true,
  cantidad: 1,
  labelUnit: 'mm',
  ...obtenerTamanoEtiquetaDefault(),
  printerName: obtenerImpresoraEtiquetaDisponible(),
  ...opciones
};

if (!opcionesEtiqueta.printerName) {
  toast.add({ severity: 'warn', summary: 'Impresora requerida', detail: 'Selecciona una impresora para continuar', life: 3000 });
  return;
}

const labelUnit = opcionesEtiqueta.labelUnit === 'in' ? 'in' : 'mm';
const labelWidthRaw = obtenerDecimalEtiqueta(opcionesEtiqueta.labelWidthMm, labelUnit === 'in' ? 2 : 50.8);
const labelHeightRaw = obtenerDecimalEtiqueta(opcionesEtiqueta.labelHeightMm, labelUnit === 'in' ? 3 : 76.2);
const labelWidthMm = labelUnit === 'in' ? inToMm(labelWidthRaw) : labelWidthRaw;
const labelHeightMm = labelUnit === 'in' ? inToMm(labelHeightRaw) : labelHeightRaw;
if (labelWidthMm <= 0 || labelHeightMm <= 0) {
  toast.add({ severity: 'warn', summary: 'Tamano requerido', detail: 'Define un ancho y alto valido para la etiqueta', life: 3000 });
  return false;
}
const labelWidthPx = mmToPx(labelWidthMm);
const labelHeightPx = mmToPx(labelHeightMm);

    const content = {
        barcodeData: {
            barcodetype: barcodeType,
            barwidth: barWidth,
            barheight: barHeight,
            labelwidth: labelWidthPx,
            labelheight: labelHeightPx,
            fontsize: obtenerNumeroEtiqueta(datosBarcode.value.fontsize, 8),
            margen_izq: margenIzquierdo,
            margen_der: margenDerecho,
            margen_sup: margenSuperior,
            margen_inf: margenInferior,
            codigo: barcode,
        },
        labelWidth: labelWidthPx,
        labelHeight: labelHeightPx,
        margins: {
            top: margenSuperior,
            right: margenDerecho,
            bottom: margenInferior,
            left: margenIzquierdo
        },
        incluirCabecera:opcionesEtiqueta.incluirCabecera,
        incluirTexto:opcionesEtiqueta.incluirTexto,
        incluirCodigo:opcionesEtiqueta.incluirCodigo,
        incluirOtro:false,
        incluirPrecio:opcionesEtiqueta.incluirPrecio,
        headerText: datosEmpresa.empresa?.nombre || '',
        code: barcode,
        precio: `${ordenData?.nombre || ''} - ${ordenData?.telefono || ''}`,
        text: fallasN,
        width: barWidth,
        height: barHeight,
        fontSize: 8,
        cantidad: parseInt(opcionesEtiqueta.cantidad) || 1,
        tipo: barcodeType,
        printerName: opcionesEtiqueta.printerName
    };
    try {
      const respuesta = await window.electron.ipcRenderer.invoke('print-barcode', content);
      if (!respuesta?.success) {
        toast.add({
          severity: 'error',
          summary: 'Error de impresion',
          detail: respuesta?.error || 'No se pudo imprimir la etiqueta',
          life: 4000
        });
        return false;
      }
      toast.add({ severity: 'success', summary: 'Imprimiendo', detail: 'Etiqueta enviada a la impresora', life: 2500 });
      return true;
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error de impresion',
        detail: error?.message || 'No se pudo imprimir la etiqueta',
        life: 4000
      });
      return false;
    }

};

const confirmarImpresionEtiqueta = async() => {
const impresa = await printBarcode(etiquetaOrdenData.value,etiquetaOpciones.value);
if (impresa) {
  visibleEtiquetaModal.value = false;
}
};

const cerrarImpresoraTaller = async() => {
visibleImpresoraTaller.value = false;

if (ordenPendienteEtiqueta.value) {
  const ordenEtiqueta = ordenPendienteEtiqueta.value;
  ordenPendienteEtiqueta.value = null;
  await abrirModalEtiqueta(ordenEtiqueta);
}
};
/************************************************************************/
const itemsTaller = ref([]);
const menu = ref(null);
const toggleTaller = (event, rowData) => {
currentRowData.value = rowData;
itemsTaller.value = [
{ label: 'Whatsapp', icon: 'pi pi-whatsapp', command: () => { showWhatsapp.value = true} },
{ label: 'Enviar firma de entrega', icon: 'pi pi-pencil', command: () => enviarFirmaEntregaWhatsapp(currentRowData.value) },
{ label: 'Correo', icon: 'pi pi-envelope', command: () => { } },
{ label: 'Editar', icon: 'pi pi-pencil', command: () => { 
     router.push({ path: `/editartaller/${currentRowData.value.id}` });
} },
{ label: 'Historial', icon: 'pi pi-history', command: () => {
     abrirHistorialOrden(currentRowData.value);
} },
{ label: 'Imprimir', icon: 'pi pi-print', command: async() => {
  ordenParaImprimir.value = currentRowData.value;
  formatoImpresion.value = '80mm'; // Por defecto térmico
  visibleImpresoraTaller.value = true;
} },

{ label: 'Nómina', icon: 'pi pi-dollar', command: () => { 
   datosTallerN.value = datosTallerN.value.filter(orden=> orden.no_orden === currentRowData.value.no_factura )
   visibleNomina.value = true;
} },

{ label: 'Costo Reparación', icon: 'pi pi-money-bill', command: () => abrirModalCostoReparacion(currentRowData.value) },

{ label: 'Costo Piezas', icon: 'pi pi-money-bill', command: () => { 

   const precioPieza = Number(currentRowData.value.preciopiezas);
  if(Number(currentRowData.value.preciopiezas) > 0){
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ya Tiene precio establecido', life: 3000 });
    return
  }

visibleCostoPiezas.value = true;

} },

{ label: 'Pedir Piezas', icon: 'pi pi-whatsapp', command: () => { 

visiblePedidoIndividual.value = true

} },

{ label: 'Etiqueta', icon: 'pi pi-print', command: async() => { 

   abrirModalEtiqueta(currentRowData.value)
  //window.electron.ipcRenderer.invoke('open-new-window', link.value+'/vista/impresoraequipo?factura='+currentRowData.value.no_factura,'url', true,false)
} },

{ label: 'Entregar', icon: 'pi pi-arrow-right', command: async() => { 
const facturaTaller = currentRowData.value;
 let manoDeObra = Number(facturaTaller?.manodeobra ?? 0);

  if (!Number.isFinite(manoDeObra) || manoDeObra <= 0) {
    const { value: precioReparacion } = await Swal.fire({
      title: "Ingrese el costo de reparación",
      input: "number",
      inputAttributes: {
        min: 0,
        step: "any",
      },
      showCancelButton: true,
      confirmButtonText: "Aceptar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || isNaN(value) || value <= 0) {
          return "Debe ingresar un número válido";
        }
      },
    });

    if (!precioReparacion) {
      return;
    }

    facturaTaller.total = parseFloat(precioReparacion);
    facturaTaller.manodeobra = parseFloat(precioReparacion);
    facturaTaller.saldo = parseFloat(precioReparacion);
    registrarEventoOrden(facturaTaller, {
      tipo: 'costo-reparacion',
      titulo: 'Costo de reparación actualizado',
      detalle: `Nuevo costo de reparación: $${parseFloat(precioReparacion).toFixed(2)}`
    });

    const actualizacionCosto = await peticionesFetchOffline('updateData','taller', JSON.stringify(facturaTaller));
    if (actualizacionCosto[0] !== 'ok') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el costo de reparación.', life: 3000 });
      return;
    }

    manoDeObra = Number(facturaTaller.manodeobra ?? 0);
  }

 const url = link.value+api.value+"/actualizarcampos/taller";
  if (!facturaTaller) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (facturaTaller.hasOwnProperty('created_at')) {
      facturaTaller.updated_at = nfecha('timestamp')
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
  facturaTaller.estado = 'Entregado';
  
  // Parsear el JSON del abono existente
  const abonoJSON = JSON.parse(facturaTaller.abono);
  
  // Agregar el nuevo abono con el método de pago seleccionado
  abonoJSON.push({
    "abono": facturaTaller.saldo,
    "turno": usuarioLocal.value.token,
    "cajero": usuarioLocal.value.email,
    "metodo_pago": metodoPago,  // Método de pago seleccionado
    "hora": nfecha('hora'),
    "fecha": nfecha('fecha')
  });

  // Convertir el abono actualizado a una cadena JSON
  facturaTaller.abono = JSON.stringify(abonoJSON);
  facturaTaller.saldo = '0.00';
  facturaTaller.fecha_entrega = nfecha('fecha');
  registrarEventoOrden(facturaTaller, {
    tipo: 'entrega',
    titulo: 'Orden entregada',
    detalle: `Entrega registrada con pago por ${metodoPago}.`
  });


  const envioDatos = await peticionesFetchOffline('updateData','taller', JSON.stringify(facturaTaller));
  if (envioDatos[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
     fetchAndSetupData();
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }

} },

{ label: 'Eliminar', icon: 'pi pi-trash', command: () => {
            Swal.fire({
                title: 'Introduce la contraseña',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const contrasenaIngresada = result.value;
                    if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
                        const datosFactura = await peticionesFetchOffline('deleteEntry','taller', rowData.id);
                        if (datosFactura[0] == 'ok') {
                            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos eliminados correctamente', life: 3000 });
                            await fetchAndSetupData()
                        } else {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar los datos', life: 3000 });
                        }
                    } else {
                        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
                    }
                }
            });
        } 
    },
];
menu.value.toggle(event);
};
/************************************************************************/

const estadoFiltro = ref('En Revision'); // Estado seleccionado por defecto

const filteredTaller = computed(() => {
  // Si no hay búsqueda, fecha ni filtro de estado, retornar todos los datos
  if (!searchQuery.value && !date.value && !estadoFiltro.value && !buscadorFechaInteligente.value && !almacenFiltro.value) return data.value;

  let filteredData = data.value.filter(busqueda => {
    const fechaEmision = busqueda.fecha_entrada;
    const fechaFiltrada = date.value ? formatearFecha(date.value) : null;

    // Filtro por fecha (solo si se selecciona una fecha)
    const cumpleFecha = fechaFiltrada ? fechaEmision === fechaFiltrada : true;

    // Filtro por búsqueda (solo si se ingresa una búsqueda)
    const cumpleBusqueda = searchQuery.value
      ? Object.values(busqueda).some(value =>
          String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      : true;

    // Filtro por estado (solo si se selecciona un estado)
    const cumpleEstado = estadoFiltro.value
      ? busqueda.estado === estadoFiltro.value
      : true;

    const cumpleAlmacen = almacenFiltro.value
      ? busqueda.almacen === almacenFiltro.value
      : true;

    // Retornar si todos los filtros aplican (búsqueda, fecha, y estado)
    return cumpleFecha && cumpleBusqueda && cumpleEstado && cumpleAlmacen;
  });

  if (buscadorFechaInteligente.value) {
    let fechas;
    let fechaInicio;
    let fechaFin;
    if (typeof buscadorFechaInteligente.value === 'string') {
      fechas = buscadorFechaInteligente.value.split(' - ');
      fechaInicio = fechas[0];
      fechaFin = fechas[1];
    } else {
      fechas = buscadorFechaInteligente.value;
      fechaInicio = formatearFecha(fechas[0]);
      fechaFin = formatearFecha(fechas[1]);
    }

    if (fechaInicio && fechaFin) {
      const fechaAmericanaInicio = transformarFechaTimestamp(fechaInicio, false);
      const fechaAmericanaFin = transformarFechaTimestamp(fechaFin, false);
      const fechaInicioTimeStamp = new Date(fechaAmericanaInicio + ' 00:00:01');
      const fechaFinTimeStamp = new Date(fechaAmericanaFin + ' 23:59:59');
      filteredData = filteredData.filter(item => {
        const fechaUpdated = new Date(item.updated_at);
        return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
      });
    }
  }

if (filteredData.length > 0) {
  fechaInteligente.value = true;
  const nuevasFacturas = filteredData
    .filter(factura => factura.pago_tecnico !== 'COBRADO')
    .map(factura => ({
      no_orden: factura.no_factura,
      fecha: factura.fecha_entrada,
      equipo: `${factura.equipo} ${factura.marca} ${factura.modelo}`,
      monto_cobrado: factura.total,
      costo_piezas: factura.preciopiezas,
      porcentaje_tecnico: factura.porcentaje_tecnico,
      beneficio_tecnico: factura.beneficio_tecnico,
      beneficio_empresa: factura.beneficio_empresa,
      estado: factura.estado,
      pago_tecnico: factura.pago_tecnico
    }));
  
  // Se añaden todos los objetos resultantes al array reactivo
  datosTallerN.value = nuevasFacturas;
}



  return filteredData;
});


/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const fnRouter = (ruta) => {
  router.push(ruta);
};
/************************************************************************/
const onRowSelect = (selected) => {
router.push({ path: `/editartaller/${selected.data.id}` });
}
/************************************************************************/
const fnPedidoIndividual = async()=>{
    const proveedor = proveedorWhatsapp.value;

    if (!proveedor || !proveedor.nombre || !proveedor.telefono) {
        console.error('Datos del proveedor no válidos');
        toast.add({ severity: 'error', summary: 'Error', detail: 'Datos del proveedor no válidos', life: 3000 });
        return;
    }

    if (!currentRowData.value.equipo || !currentRowData.value.marca || !currentRowData.value.modelo) {
        console.error('Datos del equipo no válidos');
         toast.add({ severity: 'error', summary: 'Error', detail: 'Datos del equipo no válidos', life: 3000 });
        return;
    }


    datosWhatsApp.value.nombre = proveedor.nombre;
    datosWhatsApp.value.numero = proveedor.telefono;
    datosWhatsApp.value.texto = `Hola, quiero cotizar las siguientes piezas para un *${currentRowData.value.equipo}, ${currentRowData.value.marca}, ${currentRowData.value.modelo}*: ${piezasPedido.value.join(', ')}`;

    showWhatsAppModal();
}
/************************************************************************/
const handleInteligenteSelect = (event) => {
  const selectedItem = event.item;
  buscadorFechaInteligente.value = selectedItem.value.fechainicio+' - '+selectedItem.value.fechafin
  console.log("Selected item:", selectedItem.value);
  // Aquí puedes agregar cualquier lógica adicional que necesites
};
/************************************************************************/

const itemsInteligente = ref([  
  { label: 'Hoy', command: handleInteligenteSelect,value:nfecha('rangohoy') },
  { label: 'Ayer', command: handleInteligenteSelect,value:nfecha('rangoayer') },
  { label: 'Esta Semana', command: handleInteligenteSelect,value:nfecha('rangosemana')},
  { label: 'Hace 7 dias', command: handleInteligenteSelect,value:nfecha('rango7dias')},
  { label: 'Este mes', command: handleInteligenteSelect,value:nfecha('rangomes')},
])

const toggleInteligente = (event)=>{
  menuInteligente.value.toggle(event);

}
/************************************************************************/
/************************************************************************/
const fechaInteligenteSeleccionada = (fechas) => {
  if (fechas) {
    const fechainicio = formatearFecha(fechas[0]);
    const fechafin = formatearFecha(fechas[1]);
    if (fechainicio === null || fechafin === null || fechainicio === '31/12/1969' || fechafin === '31/12/1969') {
      toast.add({ severity: 'warn', summary: 'Error', detail: 'Seleccione ambas fechas', life: 3000 });
      return false;
    }

    const fechaAmericanaInicio = transformarFechaTimestamp(fechainicio, false);
    const fechaAmericanaFin = transformarFechaTimestamp(fechafin, false);
    const fechaInicioTimeStamp = new Date(fechaAmericanaInicio + ' 00:00:01');
    const fechaFinTimeStamp = new Date(fechaAmericanaFin + ' 23:59:59');

    return (item) => {
      const fechaUpdated = new Date(item.updated_at);
      return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
    };
  }
  return true;
};
/************************************************************************/
const  fnAbonosFechaInteligente = ()=>{
  visibleAbonosInteligentes.value = true
}
/************************************************************************/
const fnDescargarData = () => {
    if (filteredTaller.value.length > 0) {
        const data = filteredTaller.value.map(item => {
            const total = Number(item.total) || 0;
            const saldo = Number(item.saldo) || 0;
            const abono = total - saldo;
            const fallas = JSON.parse(item.fallas).map(falla => falla.propiedad).join(', ');

            return {
                fecha: item.fecha_entrada,
                fecha_entrega: item.fecha_entrega,
                no_orden: item.no_factura,
                cliente: item.nombre,
                equipo: item.equipo,
                marca: item.marca,
                serial: item.serial,
                fallas: fallas,
                imei: item.imei,
                precio_piezas: item.preciopiezas,
                beneficio_empresa: item.beneficio_empresa,
                beneficio_tecnico: item.beneficio_tecnico,
                tecnico: item.tecnico,
                pago_tecnico: item.pago_tecnico,
                observaciones: item.observaciones,
                abono: abono, // The calculated abono value
                saldo: item.saldo,
                total: item.total,
                estado: item.estado
            };
        });

        // Create a worksheet and then an Excel workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Taller');

        // Generate a binary Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Create a Blob from the binary data and download the file
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'taller.xlsx';
        link.click();
    } else {
        toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay datos para descargar', life: 3000 });
    }
};

/************************************************************************/
const fnAplicarPrecioPieza = async()=>{
   const data = currentRowData.value;
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
    detalle: `Costo de piezas: $${preciopiezas.toFixed(2)}. Beneficio técnico: $${beneficioTecnico}.`
   });

  const url = link.value+api.value+"/actualizarcampos/taller";
  if (!data) {
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
const edittaller = async (index, dataTabla, idTabla) => {
  // Se busca en el arreglo de datos la orden cuyo número de factura coincida con dataTabla.no_orden.
  currentRowData.value = data.value.find(orden => orden.no_factura === dataTabla.no_orden);
  
  visibleNomina.value = false;
  
  // Verificar si se encontró la orden
  if (!currentRowData.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se ha seleccionado ninguna orden',
      life: 3000
    });
    return; // Se sale si no se encontró la orden
  }

  // Solicitar contraseña y validar con SweetAlert2
  const { value: password } = await Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    preConfirm: (value) => {
      if (value !== token.value && value !== tokenCorto.value) {
        Swal.showValidationMessage('Contraseña incorrecta');
      }
      return value;
    }
  });
  
  if (password) {
    // Actualizamos la orden marcándola como "COBRADO"
    currentRowData.value.pago_tecnico = 'COBRADO';
    currentRowData.value.updated_at = nfecha('timestamp'); // Actualiza la fecha de modificación
    registrarEventoOrden(currentRowData.value, {
      tipo: 'nomina',
      titulo: 'Pago técnico marcado como cobrado',
      detalle: 'La orden fue marcada como COBRADO en nómina.'
    });
    
    const url = link.value + api.value + "/actualizarcampos/taller";
    const envioDatos = await peticionesFetchOffline('updateData','taller', JSON.stringify(currentRowData.value));
    
    if (envioDatos[0] === 'ok') {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Orden marcada como COBRADO',
        life: 3000
      });
      // Actualizamos los datos y forzamos la re-evaluación de la propiedad computada
      await fetchAndSetupData();
      await nextTick();
      visibleNomina.value = true;
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al actualizar la orden',
        life: 3000
      });
    }
  }
};

/************************************************************************/
const facturasPagadas = ref([]);
/************************************************************************/
const visibleImpresoraTaller = ref(false);
const ordenParaImprimir = ref({});
const formatoImpresion = ref('80mm'); // '80mm' o 'carta'
const ordenPendienteEtiqueta = ref(null);
/************************************************************************/
const usuariosData = ref([]);
const clientes = ref([]);
const loading = ref(false);
const visibleOrdenRapida = ref(false);
const incluyeCostoPieza = ref(false); // false = separado, true = incluido
const fallasRapidas = [
  'Pantalla',
  'Batería',
  'No enciende',
  'Puerto de carga',
  'Cambio de mica',
  'Software',
  'Se moja',
  'No carga'
];
const ordenRapida = ref({
  cedula: '',
  nombre: '',
  telefono: '',
  imei: '',
  marca: '',
  modelo: '',
  equipo: 'CELULAR',
  falla: '',
  clave: '',
  tecnico: null,
  manodeobra: '0.00',
  preciopiezas: '0.00',
  total: '0.00',
  fecha_entrega: nfecha('fechaManana')
});

// Flag para controlar qué campo está siendo editado y evitar loops infinitos
const calculandoOrdenRapida = ref(false);

// Watcher para calcular automáticamente cuando cambia el total
watch(() => ordenRapida.value.total, (nuevoTotal) => {
  if (calculandoOrdenRapida.value) return;

  calculandoOrdenRapida.value = true;

  const total = parseFloat(nuevoTotal) || 0;
  const preciopiezas = parseFloat(ordenRapida.value.preciopiezas) || 0;

  // Si se ingresa total y hay piezas, calcular mano de obra
  if (preciopiezas > 0) {
    ordenRapida.value.manodeobra = Math.max(0, total - preciopiezas).toFixed(2);
  } else {
    // Si no hay piezas, la mano de obra es igual al total
    ordenRapida.value.manodeobra = total.toFixed(2);
  }

  calculandoOrdenRapida.value = false;
});

// Watcher para calcular el total cuando cambia la mano de obra
watch(() => ordenRapida.value.manodeobra, (nuevaManoDeObra) => {
  if (calculandoOrdenRapida.value) return;

  calculandoOrdenRapida.value = true;

  const manodeobra = parseFloat(nuevaManoDeObra) || 0;
  const preciopiezas = parseFloat(ordenRapida.value.preciopiezas) || 0;

  // Calcular total sumando mano de obra + piezas
  ordenRapida.value.total = (manodeobra + preciopiezas).toFixed(2);

  calculandoOrdenRapida.value = false;
});

// Watcher para recalcular cuando cambia el costo de piezas
watch(() => ordenRapida.value.preciopiezas, (nuevoPrecioPiezas) => {
  if (calculandoOrdenRapida.value) return;

  calculandoOrdenRapida.value = true;

  const preciopiezas = parseFloat(nuevoPrecioPiezas) || 0;
  const total = parseFloat(ordenRapida.value.total) || 0;

  // Siempre calcular mano de obra restando pieza del total, SIN cambiar el total
  ordenRapida.value.manodeobra = Math.max(0, total - preciopiezas).toFixed(2);

  calculandoOrdenRapida.value = false;
});

// Watcher para cuando cambia el modo de incluir/separar costo de pieza
watch(incluyeCostoPieza, (nuevoValor) => {
  if (nuevoValor) {
    // Modo: costo incluye pieza
    // Resetear piezas a 0 y recalcular
    ordenRapida.value.preciopiezas = '0.00';
    ordenRapida.value.total = ordenRapida.value.manodeobra;
  } else {
    // Modo: costo separado
    // Recalcular total sumando mano de obra + piezas
    const manodeobra = parseFloat(ordenRapida.value.manodeobra) || 0;
    const preciopiezas = parseFloat(ordenRapida.value.preciopiezas) || 0;
    ordenRapida.value.total = (manodeobra + preciopiezas).toFixed(2);
  }
});

/************************************************************************/
const normalizarNombreOrdenRapida = (valor) => {
  ordenRapida.value.nombre = String(valor || '').toUpperCase();
};
/************************************************************************/
const agregarFallaRapida = (falla) => {
  const fallaActual = (ordenRapida.value.falla || '').trim();
  if (!fallaActual) {
    ordenRapida.value.falla = falla;
    return;
  }

  const fallasSeparadas = fallaActual
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  if (fallasSeparadas.includes(falla.toLowerCase())) {
    return;
  }

  ordenRapida.value.falla = `${fallaActual}, ${falla}`;
};
/************************************************************************/
const fetchUsuariosData = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    usuariosData.value = response;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from usuarios',
      life: 3000
    });
  }
};
/************************************************************************/
const fetchClientesData = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    clientes.value = response;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from clientes',
      life: 3000
    });
  }
};
/************************************************************************/
const buscarClientePorCedula = async() => {
  if (!ordenRapida.value.cedula || ordenRapida.value.cedula.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ingrese una cédula válida', life: 3000 });
    return;
  }

  loading.value = true;

  try {
    // Primero buscar en la base de datos local
    const clienteLocal = await peticionesFetchOffline('getDataByField', 'clientes', 'cedula', ordenRapida.value.cedula);

    if (clienteLocal) {
      normalizarNombreOrdenRapida(clienteLocal.nombre);
      ordenRapida.value.telefono = clienteLocal.telefono || '';
      loading.value = false;
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente encontrado', life: 3000 });
      return;
    }

    // Si no existe localmente, buscar en la API
    const response = await peticionesFetch(
      'https://demo.tmposrd.com/api2',
      'buscarcedula',
      { cedula: ordenRapida.value.cedula },
      tokenCifrado.value,
      'POST'
    );

    if (response && response.datos) {
      normalizarNombreOrdenRapida(response.datos.name);
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente encontrado en API', life: 3000 });
    } else {
      toast.add({ severity: 'warning', summary: 'Aviso', detail: 'Cliente no encontrado, puede crear uno nuevo', life: 3000 });
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar cliente', life: 3000 });
  }
};
/************************************************************************/
const buscarEquipoPorIMEI = async() => {
  if (!ordenRapida.value.imei || ordenRapida.value.imei.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Ingrese un IMEI válido', life: 3000 });
    return;
  }

  loading.value = true;

  const datos = {
    servicio: "0",
    imei: ordenRapida.value.imei.trim()
  };

  try {
    const consulta = await enviarDatosPorPost(
      'https://demo.tmposrd.com/api2/consultaimei',
      datos,
      tokenCifrado.value
    );

    const ok = consulta?.response?.success === true;

    if (ok) {
      const obj = consulta.response.object || {};
      ordenRapida.value.marca = obj.brand || '';
      ordenRapida.value.modelo = obj.modelName || '';
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Equipo encontrado: ${obj.modelName || 'N/A'}`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: consulta?.response?.status || 'No se encuentran datos del IMEI',
        life: 3000
      });
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al consultar IMEI', life: 3000 });
  }
};
/************************************************************************/
const crearOrdenRapida = async() => {
  normalizarNombreOrdenRapida(ordenRapida.value.nombre);

  // Validaciones
  if (!ordenRapida.value.nombre || ordenRapida.value.nombre.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El nombre del cliente es obligatorio', life: 3000 });
    return;
  }

  if (!ordenRapida.value.falla || ordenRapida.value.falla.trim() === '') {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe especificar la falla del equipo', life: 3000 });
    return;
  }

  const manoDeObra = Number(ordenRapida.value.manodeobra ?? 0);
  const costoPiezasNormalizado = Number(ordenRapida.value.preciopiezas ?? 0);

  if (Number.isNaN(manoDeObra) || manoDeObra < 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'La mano de obra debe ser 0.00 o mayor', life: 3000 });
    return;
  }

  if (Number.isNaN(costoPiezasNormalizado) || costoPiezasNormalizado < 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El costo de piezas debe ser 0.00 o mayor', life: 3000 });
    return;
  }

  loading.value = true;

  try {
    // Obtener el último registro para generar el número de factura
    const ultimoReg = await ultimoRegistro(link.value + api.value, 'taller');
    let noFactura = '0000001';

    if (ultimoReg.length > 0) {
      noFactura = generadorCodigo(ultimoReg[0].no_factura, '', 7);
    }

    // Calcular valores según si incluye pieza o no
    const costoPiezas = incluyeCostoPieza.value ? 0 : costoPiezasNormalizado;
    const totalOrden = incluyeCostoPieza.value ? manoDeObra : (manoDeObra + costoPiezas);

    // Preparar datos de la orden
    const nuevaOrden = {
      no_factura: noFactura,
      nombre: ordenRapida.value.nombre,
      cedula: ordenRapida.value.cedula || '',
      telefono: ordenRapida.value.telefono || '',
      whatsapp: ordenRapida.value.telefono || '',
      email: '',
      direccion: '',
      equipo: ordenRapida.value.equipo,
      marca: ordenRapida.value.marca || 'N/A',
      modelo: ordenRapida.value.modelo || 'N/A',
      imei: ordenRapida.value.imei || '',
      serial: '',
      clave: ordenRapida.value.clave || 'N/A',
      fallas: JSON.stringify([{ propiedad: ordenRapida.value.falla }]),
      accesorios: JSON.stringify([]),
      observaciones: incluyeCostoPieza.value ? 'Costo incluye pieza' : '',
      reparacion: '',
      piezas: '',
      tecnico: ordenRapida.value.tecnico?.nombre || usuarioLocal.value.nombre,
      estado: 'En Revision',
      metodopago: 'EFECTIVO',
      manodeobra: manoDeObra.toFixed(2),
      preciopiezas: costoPiezas.toFixed(2),
      total: totalOrden.toFixed(2),
      saldo: totalOrden.toFixed(2),
      abono: JSON.stringify([]),
      fecha_entrada: nfecha('fecha'),
      fecha_entrega: ordenRapida.value.fecha_entrega,
      almacen: datosEmpresa.empresa.nombre,
      usuario: usuarioLocal.value.nombre,
      pago_tecnico: 'NO COBRADO',
      beneficio_tecnico: '0.00',
      beneficio_empresa: '0.00',
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    // Agregar porcentaje del técnico
    const datosTecnico = usuariosData.value.find(t => t.nombre === nuevaOrden.tecnico);
    nuevaOrden.porcentaje_tecnico = datosTecnico?.porcentaje || '0.00';
    nuevaOrden.historial_orden = JSON.stringify([{
      tipo: 'creacion',
      titulo: 'Orden creada',
      detalle: `Orden rápida creada para ${nuevaOrden.nombre} con equipo ${nuevaOrden.equipo}.`,
      usuario: usuarioLocal.value?.nombre || usuarioLocal.value?.email || 'Sistema',
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      timestamp: nfecha('timestamp')
    }]);

    // Guardar en la base de datos
    const envioDatos = await peticionesFetchOffline('insertData', 'taller', JSON.stringify(nuevaOrden));

    if (envioDatos[0] === 'ok') {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Orden #${noFactura} creada exitosamente`,
        life: 3000
      });

      // Limpiar formulario
      incluyeCostoPieza.value = false; // Reset switch
      ordenRapida.value = {
        cedula: '',
        nombre: '',
        telefono: '',
        imei: '',
        marca: '',
        modelo: '',
        equipo: 'CELULAR',
        falla: '',
        clave: '',
        tecnico: null,
        manodeobra: '0.00',
        preciopiezas: '0.00',
        total: '0.00',
        fecha_entrega: nfecha('fechaManana')
      };

      visibleOrdenRapida.value = false;

      // Actualizar datos
      await fetchAndSetupData();

      // Preguntar si desea imprimir
      Swal.fire({
        title: "Orden Creada",
        text: "¿Desea imprimir el recibo?",
        icon: "success",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Térmico 80mm",
        denyButtonText: "Carta (Letter)",
        cancelButtonText: "No Imprimir"
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Imprimir en formato térmico
          ordenParaImprimir.value = nuevaOrden;
          formatoImpresion.value = '80mm';
          ordenPendienteEtiqueta.value = nuevaOrden;
          visibleImpresoraTaller.value = true;
        } else if (result.isDenied) {
          // Imprimir en formato carta
          ordenParaImprimir.value = nuevaOrden;
          formatoImpresion.value = 'carta';
          ordenPendienteEtiqueta.value = nuevaOrden;
          visibleImpresoraTaller.value = true;
        }
      });

    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la orden', life: 3000 });
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
    console.error('Error al crear orden:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la orden', life: 3000 });
  }
};
/************************************************************************/
const abrirOrdenRapida = () => {
  incluyeCostoPieza.value = false; // Reset al modo separado
  ordenRapida.value = {
    cedula: '',
    nombre: '',
    telefono: '',
    imei: '',
    marca: '',
    modelo: '',
    equipo: 'CELULAR',
    falla: '',
    clave: '',
    tecnico: usuariosData.value.find(u => u.nivel_seguridad === 'Tecnico') || null,
    manodeobra: '0.00',
    preciopiezas: '0.00',
    total: '0.00',
    fecha_entrega: nfecha('fechaManana')
  };
  visibleOrdenRapida.value = true;
};

/************************************************************************/
const fnPagarTodo = async () => {
  // Ocultamos el modal de nómina (u otro modal que esté abierto)
  visibleNomina.value = false;
  
  // Solicitar contraseña mediante SweetAlert2
  const { value: password } = await Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    inputPlaceholder: 'Contraseña',
    showCancelButton: true,
    confirmButtonText: 'Pagar Todo',
    cancelButtonText: 'Cancelar',
    preConfirm: (value) => {
      if (value !== token.value && value !== tokenCorto.value) {
        Swal.showValidationMessage('Contraseña incorrecta');
      }
      return value;
    }
  });
  
  if (password) {
    let allSuccess = true;
    
    // Recorremos cada orden en datosTallerN y, si aún no está marcada como COBRADO, la actualizamos.
    for (const order of datosTallerN.value) {
      // Buscamos la orden completa en el array principal "data" usando el identificador
      currentRowData.value = data.value.find(orden => orden.no_factura === order.no_orden);
      
      // Si la orden ya está cobrada, la saltamos.
      if (currentRowData.value.pago_tecnico === 'COBRADO') continue;
      
      // Actualizamos localmente la orden.
      currentRowData.value.pago_tecnico = 'COBRADO';
      currentRowData.value.updated_at = nfecha('timestamp');
      
      // Enviamos la actualización al servidor.
      const url = link.value + api.value + "/actualizarcampos/taller";
      const envioDatos = await peticionesFetchOffline('updateData','taller', JSON.stringify(currentRowData.value));
      
      if (envioDatos[0] !== 'ok') {
        allSuccess = false;
        break;
      } else {
        // Agregamos la orden actualizada al array de facturas pagadas.
        facturasPagadas.value.push(currentRowData.value);
      }
    }
    
    if (allSuccess) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Todas las órdenes han sido marcadas como COBRADO',
        life: 3000
      });
      
      // Refrescamos la data principal y esperamos a que Vue actualice las dependencias.
      await fetchAndSetupData();
      await nextTick();
      
      // Calculamos el total pagado al técnico.
      // Se asume que cada orden en datosTallerN tiene el campo "beneficio_tecnico"
      let totalPagoTecnico = facturasPagadas.value.reduce((acc, order) => {
          return acc + (Number(order.beneficio_tecnico) || 0);

      }, 0);
      
      // --- Generar PDF usando jsPDF con formato 80mm de ancho ---
      // Se define el formato en mm: [80, 210] (80mm de ancho, 210mm de alto)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 210]
      });
      
      // Debido a que el ancho es 80mm, el centro es 40mm.
      // Encabezado con datos de la empresa.
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(datosEmpresa.empresa.nombre || "Nombre de la Empresa", 40, 10, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(datosEmpresa.empresa.direccion || "Dirección de la Empresa", 40, 15, { align: "center" });
      doc.text("Tel: " + (datosEmpresa.empresa.telefono || "Teléfono"), 40, 20, { align: "center" });
      
      // Línea separadora
      doc.line(10, 25, 70, 25);
      
      // Título del recibo
      doc.setFontSize(14);
      doc.text("Recibo de Pago al Técnico", 40, 30, { align: "center" });
      
      doc.setFontSize(12);
      doc.text("Fecha: " + new Date().toLocaleDateString(), 40, 35, { align: "center" });
      
      // Agregar la tabla de órdenes pagadas.
      if (facturasPagadas.value.length > 0) {
        // Definimos los encabezados y filas para la tabla.
        const head = [['Orden', 'Equipo', 'F. Entrega', 'Total']];
        const body = facturasPagadas.value.map(order => [
          order.no_factura,
          order.equipo+' '+order.marca+' '+order.modelo,
          order.fecha_entrega,
          "$" + Number(order.beneficio_tecnico).toFixed(2)
        ]);
        
        // Usamos autoTable para agregar la tabla. Se inicia en Y=55.
        doc.autoTable({
          head: head,
          body: body,
          startY: 40,
          theme: 'grid',
          headStyles: { fillColor: [220, 220, 220], fontSize: 8 },
          styles: { fontSize: 8, cellPadding: 1 },
          margin: { left: 5, right: 5 }
        });
      }

      doc.line(10, doc.lastAutoTable.finalY + 5, 70, doc.lastAutoTable.finalY + 5);

      // Total pagado
      doc.setFontSize(16);
      doc.text("Total Pagado: $" + totalPagoTecnico.toFixed(2), 40, doc.lastAutoTable.finalY + 10, { align: "center" });
      // Pie de página opcional.
      doc.setFontSize(10);
      // Si se generó una tabla, doc.lastAutoTable.finalY tiene la posición final; si no, se usa 60.
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 60;
      doc.text("¡Gracias por su confianza!", 40, finalY, { align: "center" });
      
      // Convertir el PDF a Blob y crear un URL para el iframe.
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Mostrar el PDF embebido en un SweetAlert2 mediante un iframe.
      Swal.fire({
        title: 'Recibo de Pago',
        html: `<iframe src="${pdfUrl}" width="100%" height="600px" style="border:none;"></iframe>`,
        width: '800px',
        showCloseButton: true,
        confirmButtonText: 'Imprimir'
      }).then((result) => {
        if (result.isConfirmed) {
          const iframe = document.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        }
        // Limpiar el array de facturas pagadas para la siguiente operación.
        facturasPagadas.value = [];
      });
      
    } else {
      visibleNomina.value = true;
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al actualizar algunas órdenes',
        life: 3000
      });
    }
  }
};
/************************************************************************/
const getRowClass = (data) => {
  if (data.estado === 'Devolucion') {
    return 'devolucion';
  } else if (data.estado === 'Pendiente') {
    return 'pendiente';
  } else if (data.estado === 'En Revisión' || data.estado === 'En Revision') {
    return 'revision';
  } else if (data.estado === 'Reparado') {
    return 'reparado';
  } else if (data.estado === 'Entregado') {
    return 'entregado';
  }
  return '';
};
/************************************************************************/
const colorEstado = (data) => {
    switch (data.estado) {
        case 'Devolucion':
            return 'danger'; // Rojo
        case 'Pendiente':
            return 'warn'; // Amarillo
        case 'En Revisión':
        case 'En Revision':
            return 'warn'; // Azul claro
        case 'Reparado':
            return 'primary'; // Azul
        case 'Entregado':
            return 'success'; // Verde
        default:
            return 'secondary'; // Gris por defecto
    }
};

/************************************************************************/
const getEquipoInfo = (data) => {
  const parts = [data.equipo, data.marca, data.modelo];
  const validParts = parts.filter(part => part && part.trim() !== "" && part !== "N/A");
  return validParts.join(" - ");
};
/************************************************************************/
const exportToExcel = () => {
  // Obtener los datos filtrados que se muestran en la tabla
  const filteredData = filteredTaller.value;

  // Crear una hoja de trabajo de Excel
  const worksheet = XLSX.utils.json_to_sheet(filteredData);

  // Crear un libro de trabajo de Excel y agregar la hoja de trabajo
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

  // Generar un archivo Excel y descargarlo
  XLSX.writeFile(workbook, "Datos_Taller"+nfecha('fecha')+".xlsx");
};
/************************************************************************/
const generarReportePDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Datos filtrados
  const datosReporte = filteredTaller.value;

  // Calcular totales y ganancias
  let totalReparaciones = 0;
  let totalPiezas = 0;
  let totalGananciaEmpresa = 0;
  let totalGananciaTecnicos = 0;
  let totalPendiente = 0;

  const resumenPorTecnico = {};

  datosReporte.forEach(orden => {
    const total = parseFloat(orden.total) || 0;
    const piezas = parseFloat(orden.preciopiezas) || 0;
    const beneficioEmpresa = parseFloat(orden.beneficio_empresa) || 0;
    const beneficioTecnico = parseFloat(orden.beneficio_tecnico) || 0;
    const saldo = parseFloat(orden.saldo) || 0;

    totalReparaciones += total;
    totalPiezas += piezas;
    totalGananciaEmpresa += beneficioEmpresa;
    totalGananciaTecnicos += beneficioTecnico;
    totalPendiente += saldo;

    // Resumen por técnico
    const tecnico = orden.tecnico || 'Sin asignar';
    if (!resumenPorTecnico[tecnico]) {
      resumenPorTecnico[tecnico] = {
        ordenes: 0,
        ganancia: 0,
        pendiente: 0
      };
    }
    resumenPorTecnico[tecnico].ordenes++;
    resumenPorTecnico[tecnico].ganancia += beneficioTecnico;
    // Solo contar pendiente si el pago al técnico no está marcado como pagado
    if (!orden.pago_tecnico || !orden.pago_tecnico.toLowerCase().includes('pagado')) {
      resumenPorTecnico[tecnico].pendiente += beneficioTecnico;
    }
  });

  const gananciaNetaTotal = totalReparaciones - totalPiezas;

  // ENCABEZADO PROFESIONAL
  // Fondo del encabezado
  doc.setFillColor(41, 128, 185); // Azul profesional
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo/Icono (simulado con texto)
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(datosEmpresa.empresa.nombre || 'TALLER', pageWidth / 2, 15, { align: 'center' });

  // Subtítulo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Ganancias y Pagos', pageWidth / 2, 25, { align: 'center' });

  // Fecha del reporte
  doc.setFontSize(9);
  doc.text(`Fecha de generación: ${nfecha('fecha')}`, pageWidth / 2, 35, { align: 'center' });

  // Línea decorativa
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(20, 40, pageWidth - 20, 40);

  // RESUMEN EJECUTIVO
  let yPos = 55;

  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN EJECUTIVO', 14, yPos);

  yPos += 10;

  // Tabla de resumen principal
  doc.autoTable({
    startY: yPos,
    head: [['Concepto', 'Monto (RD$)']],
    body: [
      ['Total en Reparaciones', `$ ${totalReparaciones.toFixed(2)}`],
      ['Costo Total de Piezas', `$ ${totalPiezas.toFixed(2)}`],
      ['Ganancia Neta Total', `$ ${gananciaNetaTotal.toFixed(2)}`],
      ['', ''],
      ['GANANCIA EMPRESA', `$ ${totalGananciaEmpresa.toFixed(2)}`],
      ['GANANCIA TÉCNICOS', `$ ${totalGananciaTecnicos.toFixed(2)}`],
      ['', ''],
      ['Saldo Pendiente de Cobro', `$ ${totalPendiente.toFixed(2)}`]
    ],
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 60, halign: 'right', fontStyle: 'bold', textColor: [0, 100, 0] }
    },
    margin: { left: 14, right: 14 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // RESUMEN POR TÉCNICO
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN POR TÉCNICO', 14, yPos);

  yPos += 7;

  const bodyTecnicos = Object.entries(resumenPorTecnico).map(([tecnico, datos]) => [
    tecnico,
    datos.ordenes,
    `$ ${datos.ganancia.toFixed(2)}`,
    `$ ${datos.pendiente.toFixed(2)}`,
    datos.pendiente > 0 ? 'PENDIENTE' : 'PAGADO'
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Técnico', 'Órdenes', 'Ganancia Total', 'Por Pagar', 'Estado']],
    body: bodyTecnicos,
    headStyles: {
      fillColor: [52, 152, 219],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 40, halign: 'right', textColor: [0, 128, 0] },
      3: { cellWidth: 40, halign: 'right', textColor: [255, 140, 0] },
      4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // DETALLE DE ÓRDENES
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE ÓRDENES', 14, yPos);

  yPos += 7;

  const bodyOrdenes = datosReporte.map(orden => [
    orden.no_factura || '',
    orden.fecha_entrada || '',
    orden.nombre || '',
    `$ ${(parseFloat(orden.total) || 0).toFixed(2)}`,
    `$ ${(parseFloat(orden.preciopiezas) || 0).toFixed(2)}`,
    `$ ${(parseFloat(orden.beneficio_empresa) || 0).toFixed(2)}`,
    `$ ${(parseFloat(orden.beneficio_tecnico) || 0).toFixed(2)}`,
    orden.tecnico || '',
    orden.estado || ''
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Orden', 'Fecha', 'Cliente', 'Total', 'Piezas', 'B.Emp', 'B.Tec', 'Técnico', 'Estado']],
    body: bodyOrdenes,
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7
    },
    bodyStyles: {
      fontSize: 6
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 20 },
      2: { cellWidth: 30 },
      3: { cellWidth: 20, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 25 },
      8: { cellWidth: 18, fontSize: 6 }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer en cada página
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Página ${doc.internal.getCurrentPageInfo().pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });

  // NOTAS FINALES
  yPos = doc.lastAutoTable.finalY + 10;

  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos, pageWidth - 28, 25, 'F');

  yPos += 7;

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont('helvetica', 'italic');
  doc.text('NOTAS:', 18, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`• Este reporte incluye ${datosReporte.length} órdenes.`, 18, yPos);
  yPos += 4;
  doc.text(`• Los montos pendientes de pago a técnicos deben ser liquidados según política interna.`, 18, yPos);
  yPos += 4;
  doc.text(`• Generado por: ${usuarioLocal.value?.usuario || 'Sistema'}`, 18, yPos);

  // Convertir PDF a blob URL
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  pdfUrl.value = url;
  pdfDialogVisible.value = true;

  // Guardar datos del reporte para descarga
  pdfReporteData.value = doc;
};

/************************************************************************/
const descargarPDF = () => {
  if (pdfReporteData.value) {
    pdfReporteData.value.save(`Reporte_Taller_${nfecha('fecha')}.pdf`);
  }
};
/************************************************************************/
</script>
<template>
<div class="taller-wrapper">
  <div class="taller-container">

    <!-- Modern Header with Tech Theme -->
    <div class="taller-header">
      <div class="taller-header-content">
        <div class="taller-icon-wrapper">
          <i class="pi pi-mobile taller-icon"></i>
        </div>
        <div>
          <h1 class="taller-title">Taller de Reparación de Celulares</h1>
          <p class="taller-subtitle">Gestión profesional de órdenes de servicio</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="taller-stats-grid">
      <Card class="taller-stat-card">
        <template #content>
          <div class="taller-stat-content">
            <div class="taller-stat-icon-wrapper taller-stat-blue">
              <i class="pi pi-list"></i>
            </div>
            <div class="taller-stat-info">
              <p class="taller-stat-label">Total Órdenes</p>
              <p class="taller-stat-value">{{ filteredTaller.length }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="taller-stat-card">
        <template #content>
          <div class="taller-stat-content">
            <div class="taller-stat-icon-wrapper taller-stat-orange">
              <i class="pi pi-clock"></i>
            </div>
            <div class="taller-stat-info">
              <p class="taller-stat-label">Pendientes</p>
              <p class="taller-stat-value">{{ filteredTaller.filter(t => t.estado === 'Pendiente').length }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="taller-stat-card">
        <template #content>
          <div class="taller-stat-content">
            <div class="taller-stat-icon-wrapper taller-stat-green">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="taller-stat-info">
              <p class="taller-stat-label">Reparados</p>
              <p class="taller-stat-value">{{ filteredTaller.filter(t => t.estado === 'Reparado').length }}</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="taller-stat-card">
        <template #content>
          <div class="taller-stat-content">
            <div class="taller-stat-icon-wrapper taller-stat-cyan">
              <i class="pi pi-box"></i>
            </div>
            <div class="taller-stat-info">
              <p class="taller-stat-label">Entregados</p>
              <p class="taller-stat-value">{{ filteredTaller.filter(t => t.estado === 'Entregado').length }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Actions Card -->
    <Card class="taller-actions-card">
      <template #content>
        <div class="taller-actions-content">
          <h3 class="taller-actions-title"><i class="pi pi-cog"></i> Acciones Rápidas</h3>
          <div class="taller-actions-grid">
            <Button icon="pi pi-refresh" label="Recargar" severity="warning" @click="fetchAndSetupData" />

            <router-link to="/creartaller">
              <Button icon="pi pi-plus" label="Nueva Orden" severity="success" />
            </router-link>

            <Button icon="pi pi-bolt" label="Orden Rápida" severity="warning" @click="abrirOrdenRapida" />

            <Button icon="pi pi-trash" label="Eliminar" severity="danger" @click="borrarSeleccionados" />

            <Button icon="pi pi-file-excel" label="Excel" severity="help" @click="exportToExcel" />

            <Button icon="pi pi-file-pdf" label="Reporte PDF" severity="danger" @click="generarReportePDF" />

            <Button v-if="fechaInteligente" icon="pi pi-download" label="Descargar Data" @click="fnDescargarData" />

            <Button v-if="fechaInteligente" icon="pi pi-eye" label="Nómina" severity="info" @click="visibleNomina = true" />

            <Button v-if="usuarioLocal.usuario === 'Soporte'" icon="pi pi-trash" label="Borrar Todo" severity="danger" outlined @click="borrarTodo" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Filters Card -->
    <Card class="taller-filters-card">
      <template #content>
        <h3 class="taller-filters-title"><i class="pi pi-filter"></i> Filtros de Búsqueda</h3>
        <div class="taller-filters-grid">
          <!-- Filtro por Fecha -->
          <div class="taller-filter-group">
            <label class="taller-filter-label">Fecha Específica</label>
            <div class="taller-filter-input-group">
              <Calendar v-model="date" dateFormat="dd/mm/yy" showButtonBar placeholder="Seleccionar fecha" class="taller-filter-input" />
              <Button icon="pi pi-times" @click="clearDate" text severity="secondary" />
            </div>
          </div>

          <!-- Filtro por Estado -->
          <div class="taller-filter-group">
            <label class="taller-filter-label">Estado</label>
            <Select v-model="estadoFiltro" :options="['','Entregado','Reparado','Pendiente','En Revision','Sin Solucion','Garantia']" placeholder="Todos los estados" class="taller-filter-input" />
          </div>

          <!-- Filtro por Almacén -->
          <div class="taller-filter-group">
            <label class="taller-filter-label">Almacén</label>
            <Select v-model="almacenFiltro" :options="almacenesDisponibles" placeholder="Todos los almacenes" class="taller-filter-input" />
          </div>

          <!-- Buscador Inteligente -->
          <div class="taller-filter-group">
            <label class="taller-filter-label">Rango de Fechas</label>
            <div class="taller-filter-input-group">
              <DatePicker dateFormat="dd/mm/yy" selectionMode="range" :showButtonBar="true" @value-change="fechaInteligenteSeleccionada" v-model="buscadorFechaInteligente" placeholder="Rango de fechas" class="taller-filter-input" />
              <Button icon="pi pi-search" @click="toggleInteligente" text severity="secondary" />
            </div>
            <Menu ref="menuInteligente" :model="itemsInteligente" popup />
          </div>

          <!-- Búsqueda General -->
          <div class="taller-filter-group">
            <label class="taller-filter-label">Búsqueda General</label>
            <div class="taller-search-wrapper">
              <i class="pi pi-search taller-search-icon"></i>
              <InputText v-model="searchQuery" placeholder="Buscar por nombre, teléfono, orden..." class="taller-search-input" />
            </div>
          </div>
        </div>

        <!-- Badge de Estado Actual -->
        <div v-if="estadoFiltro" class="taller-filter-badge">
          <span class="taller-badge-text">Filtrando por:</span>
          <Chip :label="estadoFiltro" removable @remove="estadoFiltro = ''" />
        </div>
      </template>
    </Card>

    <!-- Main Table Card -->
    <Card class="taller-table-card">
      <template #content>
        <DataTable
          :value="filteredTaller"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="10"
          size="small"
          resizableColumns
          columnResizeMode="fit"
          stripedRows
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          @rowSelect="onRowSelect"
          v-model:selection="selectedItems"
          :rowClass="getRowClass"
          selectionMode="multiple"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          tableStyle="min-width: 50rem"
          class="rounded-md overflow-hidden shadow-sm">
            <template #paginatorstart>
                <Button type="button" icon="pi pi-refresh" text />
            </template>
            <template #paginatorend>
                <Button type="button" icon="pi pi-download" text />
            </template>
            
    <Column selectionMode="multiple" headerStyle="width: 3rem">
        <template #body="{ data }">
            <div @click.stop>
                <Checkbox v-model="selectedItems" :value="data" />
            </div>
        </template>
    </Column>
    <Column header="Options">
        <template #body="slotProps">
            <Button 
                icon="pi pi-cog" 
                @click="toggleTaller($event, slotProps.data)"
                aria-haspopup="true"
                aria-controls="overlay_menu_factura"
            />
            <Menu 
                ref="menu" 
                id="overlay_menu_Taller" 
                :model="itemsTaller" 
                :popup="true"
            />
        </template>
    </Column>
<Column field="estado" header="Estado">
            <template #body="slotProps">
            <Badge :value="slotProps.data.estado" :severity="colorEstado(slotProps.data)" />
        </template>
</Column>
<Column field="fecha_entrada" header="Fecha_entrada"></Column>
<Column field="no_factura" header="No_Orden"></Column>
<!-- <Column field="equipo" header="Equipo"></Column> -->
<Column header="Equipo Info">
      <template #body="slotProps">
        {{ getEquipoInfo(slotProps.data) }}
      </template>
    </Column>
<!-- <Column field="marca" header="Marca"></Column>
<Column field="modelo" header="Modelo"></Column> -->
<Column field="nombre" header="Nombre"></Column>
<Column field="telefono" header="Telefono"></Column>
<!-- <Column field="fallas" header="Fallas"></Column> -->
<Column field="preciopiezas" header="Preciopiezas"></Column>
<Column field="saldo" header="Saldo"></Column>
<Column field="total" header="Total">
    <template #body="slotProps">
        <Badge :value="slotProps.data.total" severity="warn" />
   </template>
</Column>
<Column field="cedula" header="Cedula"></Column>
<Column field="direccion" header="Direccion"></Column>
<Column field="whatsapp" header="Whatsapp"></Column>
<Column field="email" header="Email"></Column>
<Column field="serial" header="Serial"></Column>
<Column field="imei" header="Imei"></Column>
<Column field="clave" header="Clave"></Column>
<Column field="accesorios" header="Accesorios"></Column>
<!-- <Column field="observaciones" header="Observaciones"></Column> -->
<Column field="reparacion" header="Reparacion"></Column>
<Column field="piezas" header="Piezas"></Column>
<Column field="tecnico" header="Tecnico"></Column>
<Column field="metodopago" header="Metodopago"></Column>
<Column field="fecha_entrega" header="Fecha_entrega"></Column>
<Column field="manodeobra" header="Manodeobra"></Column>
<!-- <Column field="abono" header="Abono"></Column> -->
<Column field="usuario" header="Usuario"></Column>

</DataTable>
      </template>
    </Card>

    <!-- Toast Notifications -->
    <Toast />

    <!-- WhatsApp Modal Component -->
    <EnviarWhatsApp ref="enviarWhatsAppRef" :initialDatosWhatsApp="datosWhatsApp" />
</div>
</div>

<Dialog v-model:visible="visibleHistorialOrden" position="top" modal :style="{ width: '42rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
        <i class="pi pi-history text-indigo-600 text-xl"></i>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-neutral-900">Historial de la Orden</h3>
        <p class="text-sm text-neutral-500">
          {{ ordenHistorialSeleccionada?.no_factura ? `Orden #${ordenHistorialSeleccionada.no_factura}` : 'Sin orden seleccionada' }}
        </p>
      </div>
    </div>
  </template>

  <div class="space-y-3">
    <div v-if="historialOrdenActual.length === 0" class="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm text-neutral-600">
      Esta orden todavía no tiene eventos registrados.
    </div>

    <div
      v-for="(evento, index) in historialOrdenActual"
      :key="`${evento.timestamp || evento.fecha || 'evento'}-${index}`"
      class="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-neutral-900">{{ evento.titulo || 'Evento' }}</p>
          <p v-if="evento.detalle" class="text-sm text-neutral-600 mt-1">{{ evento.detalle }}</p>
        </div>
        <Badge :value="evento.tipo || 'actualizacion'" severity="info" />
      </div>
      <div class="mt-3 text-xs text-neutral-500 flex flex-wrap gap-3">
        <span>Usuario: {{ evento.usuario || 'Sistema' }}</span>
        <span>Fecha: {{ evento.fecha || '-' }}</span>
        <span>Hora: {{ evento.hora || '-' }}</span>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end">
      <Button
        label="Cerrar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="visibleHistorialOrden = false"
      />
    </div>
  </template>
</Dialog>

<!-- Modal: Pedido Individual -->
<Dialog v-model:visible="visiblePedidoIndividual" position="top" modal :style="{ width: '30rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
        <i class="pi pi-shopping-cart text-primary-600 text-xl"></i>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-neutral-900">Pedido de Piezas</h3>
        <p class="text-sm text-neutral-500">Selecciona las piezas a solicitar</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <!-- Sección de Piezas -->
    <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
      <h4 class="text-sm font-semibold text-neutral-700 mb-3">Piezas a Solicitar</h4>
      <div class="space-y-2 max-h-60 overflow-y-auto">
        <div
          v-for="category in parsedFallas"
          :key="category.key"
          class="flex items-center gap-3 p-2 hover:bg-white rounded-md transition-colors"
        >
          <Checkbox
            v-model="piezasPedido"
            :inputId="category.key"
            name="category"
            :value="category.propiedad"
          />
          <label :for="category.key" class="text-sm text-neutral-700 cursor-pointer flex-1">
            {{ category.propiedad }}
          </label>
        </div>
      </div>
    </div>

    <!-- Selección de Proveedor -->
    <div>
      <label class="block text-sm font-medium text-neutral-700 mb-2">Proveedor</label>
      <Select
        name="proveedor"
        v-model="proveedorWhatsapp"
        :options="proveedoresData"
        optionLabel="nombre"
        placeholder="Selecciona un proveedor"
        fluid
        class="w-full"
      />
    </div>
  </div>

  <template #footer>
    <div class="flex gap-2 justify-end">
      <button
        @click="visiblePedidoIndividual = false"
        class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="fnPedidoIndividual"
        class="px-4 py-2 text-sm font-medium text-white bg-success-600 rounded-md hover:bg-success-700 transition-colors flex items-center gap-2"
      >
        <i class="pi pi-whatsapp"></i>
        Realizar Pedido
      </button>
    </div>
  </template>
</Dialog>



<!-- Modal: Costo de Reparacion -->
<Dialog v-model:visible="visibleCostoReparacion" position="top" modal :style="{ width: '34rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
        <i class="pi pi-money-bill text-green-600 text-xl"></i>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-neutral-900">Costo de Reparacion</h3>
        <p class="text-sm text-neutral-500">Define la mano de obra y las piezas; el total se calcula automaticamente</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
        <label for="costoReparacionManoObra" class="block text-sm font-semibold text-neutral-700 mb-2">
          Mano de Obra
        </label>
        <InputNumber
          id="costoReparacionManoObra"
          v-model="formularioCostoReparacion.manodeobra"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          fluid
        />
      </div>

      <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
        <label for="costoReparacionPiezas" class="block text-sm font-semibold text-neutral-700 mb-2">
          Costo Piezas
        </label>
        <InputNumber
          id="costoReparacionPiezas"
          v-model="formularioCostoReparacion.preciopiezas"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          fluid
        />
      </div>

      <div class="bg-green-50 rounded-lg p-4 border border-green-200">
        <label for="costoReparacionTotal" class="block text-sm font-semibold text-green-800 mb-2">
          Total
        </label>
        <InputNumber
          id="costoReparacionTotal"
          :modelValue="totalCostoReparacion"
          mode="currency"
          currency="USD"
          locale="en-US"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          disabled
          fluid
        />
      </div>
    </div>

    <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      Total = mano de obra + costo de piezas. El saldo se recalcula usando ese total menos los abonos ya registrados.
    </div>
  </div>

  <template #footer>
    <div class="flex gap-2 justify-end">
      <button
        @click="visibleCostoReparacion = false"
        class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="aplicarCostoReparacion"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <i class="pi pi-check"></i>
        Aplicar Costo
      </button>
    </div>
  </template>
</Dialog>
<!-- /********************************************************************************************/ -->




<!-- Modal: Costo de Piezas -->
<Dialog v-model:visible="visibleCostoPiezas" position="top" modal :style="{ width: '28rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 bg-warning-100 rounded-lg">
        <i class="pi pi-money-bill text-warning-600 text-xl"></i>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-neutral-900">Costo de Piezas</h3>
        <p class="text-sm text-neutral-500">Ingresa el costo de las piezas</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
      <label for="costoPieza" class="block text-sm font-semibold text-neutral-700 mb-2">
        Costo de la Pieza
      </label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
        <InputText
          id="costoPieza"
          v-model="costoPieza"
          fluid
          @change="fnAplicarPrecioPieza"
          v-solonumeros
          v-focus-in-focus-out
          placeholder="0.00"
          class="pl-8 w-full text-lg font-semibold"
        />
      </div>
      <p class="text-xs text-neutral-500 mt-2">
        Este monto se utilizará para calcular el beneficio del técnico y la empresa
      </p>
    </div>
  </div>

  <template #footer>
    <div class="flex gap-2 justify-end">
      <button
        @click="visibleCostoPiezas = false"
        class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="fnAplicarPrecioPieza"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <i class="pi pi-check"></i>
        Aplicar Precio
      </button>
    </div>
  </template>
</Dialog>
<!-- /********************************************************************************************/ -->

<!-- Modal: PDF Reporte de Ganancias -->
<Dialog v-model:visible="pdfDialogVisible" modal header="Reporte de Ganancias y Pagos" :style="{ width: '90vw', height: '90vh' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="p-3 bg-red-100 dark:bg-red-900 rounded-full">
        <i class="pi pi-file-pdf text-2xl text-red-600 dark:text-red-300"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-800 dark:text-white">Reporte de Ganancias y Pagos</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">Vista previa del documento PDF generado</p>
      </div>
    </div>
  </template>

  <div class="pdf-viewer-container" style="width: 100%; height: calc(90vh - 180px);">
    <iframe
      v-if="pdfUrl"
      :src="pdfUrl"
      style="width: 100%; height: 100%; border: none; border-radius: 8px;"
      title="Vista previa del reporte PDF"
    ></iframe>
  </div>

  <template #footer>
    <div class="flex justify-between items-center w-full">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <i class="pi pi-info-circle mr-1"></i>
        El reporte incluye todas las órdenes filtradas
      </div>
      <div class="flex gap-2">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          @click="pdfDialogVisible = false"
          severity="secondary"
          outlined
        />
        <Button
          label="Descargar PDF"
          icon="pi pi-download"
          @click="descargarPDF"
          severity="success"
        />
      </div>
    </div>
  </template>
</Dialog>

<!-- Modal: Nómina -->
<Dialog v-model:visible="visibleNomina" position="top" modal :style="{ width: '70rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-12 h-12 bg-success-100 rounded-lg">
        <i class="pi pi-dollar text-success-600 text-2xl"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-neutral-900">Nómina de Técnicos</h3>
        <p class="text-sm text-neutral-500">Gestión de pagos y beneficios</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <!-- Tabla de Nómina -->
    <div class="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div class="overflow-x-auto">
        <div
          v-html="generarTablaFromStringJSON(datosTallerN, false, true, edittaller, null, 'tablaTaller', undefined, rowColorCallback)"
          class="min-w-full"
        ></div>
      </div>
    </div>

    <!-- Resumen de Totales -->
    <div class="bg-gradient-to-r from-success-50 to-success-100 rounded-lg p-4 border border-success-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <i class="pi pi-info-circle text-success-600 text-xl"></i>
          <span class="text-sm font-medium text-success-800">
            Total de órdenes: {{ datosTallerN.length }}
          </span>
        </div>
        <button
          @click="fnPagarTodo"
          class="px-5 py-2.5 bg-success-600 hover:bg-success-700 text-white rounded-md font-semibold transition-all duration-150 shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <i class="pi pi-check-circle"></i>
          Pagar Todo
        </button>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex gap-2 justify-end">
      <button
        @click="visibleNomina = false"
        class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
      >
        Cerrar
      </button>
    </div>
  </template>
</Dialog>


<!-- /********************************************************************************************/ -->

<!-- Dialog: Orden Rápida -->
<Dialog v-model:visible="visibleOrdenRapida" modal :style="{ width: '95vw', maxWidth: '50rem' }" :dismissableMask="false">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="bg-orange-500 rounded-full p-2">
        <i class="pi pi-bolt text-white text-xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-800 m-0">Orden Rápida</h2>
        <p class="text-sm text-gray-500 m-0">Crear orden de taller con campos mínimos</p>
      </div>
    </div>
  </template>

  <div class="space-y-4 overflow-hidden">
    <!-- Sección Cliente -->
    <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 overflow-hidden">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">
        <i class="pi pi-user mr-2"></i>Datos del Cliente
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="cedulaRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Cédula
          </label>
          <InputGroup>
            <InputMask
              id="cedulaRapida"
              v-model="ordenRapida.cedula"
              mask="999-9999999-9"
              placeholder="000-0000000-0"
              class="w-full"
              @focus="$event.target.select()"
            />
            <Button
              icon="pi pi-search"
              severity="info"
              @click="buscarClientePorCedula"
              v-tooltip.top="'Buscar cliente'"
            />
          </InputGroup>
        </div>

        <div>
          <label for="nombreRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            id="nombreRapida"
            v-model="ordenRapida.nombre"
            @update:modelValue="normalizarNombreOrdenRapida"
            placeholder="Nombre del cliente"
            class="w-full uppercase"
            @focus="$event.target.select()"
          />
        </div>

        <div>
          <label for="telefonoRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <InputMask
            id="telefonoRapida"
            v-model="ordenRapida.telefono"
            mask="(999) 999-9999"
            placeholder="(000) 000-0000"
            class="w-full"
            @focus="$event.target.select()"
          />
        </div>
      </div>
    </div>

    <!-- Sección Equipo -->
    <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 overflow-hidden">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">
        <i class="pi pi-mobile mr-2"></i>Datos del Equipo
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="imeiRapida" class="block text-sm font-medium text-gray-700 mb-2">
            IMEI
          </label>
          <InputGroup>
            <InputMask
              id="imeiRapida"
              v-model="ordenRapida.imei"
              mask="999999999999999"
              placeholder="000000000000000"
              class="w-full"
              @focus="$event.target.select()"
            />
            <Button
              icon="pi pi-search"
              severity="help"
              @click="buscarEquipoPorIMEI"
              v-tooltip.top="'Consultar IMEI'"
            />
          </InputGroup>
        </div>

        <div>
          <label for="equipoRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Equipo
          </label>
          <Select
            id="equipoRapida"
            v-model="ordenRapida.equipo"
            :options="['CELULAR', 'TABLET', 'LAPTOP', 'PC']"
            placeholder="Seleccione tipo"
            class="w-full"
          />
        </div>

        <div>
          <label for="marcaRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Marca
          </label>
          <InputText
            id="marcaRapida"
            v-model="ordenRapida.marca"
            placeholder="Marca del equipo"
            class="w-full"
            @focus="$event.target.select()"
          />
        </div>

        <div>
          <label for="modeloRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Modelo
          </label>
          <InputText
            id="modeloRapida"
            v-model="ordenRapida.modelo"
            placeholder="Modelo del equipo"
            @focus="$event.target.select()"
            class="w-full"
          />
        </div>

        <div>
          <label for="claveRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Clave/PIN
          </label>
          <InputText
            id="claveRapida"
            v-model="ordenRapida.clave"
            placeholder="Clave del dispositivo"
            class="w-full"
            @focus="$event.target.select()"
          />
        </div>
      </div>
    </div>

    <!-- Sección Reparación -->
    <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 overflow-hidden">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">
        <i class="pi pi-wrench mr-2"></i>Datos de la Reparación
      </h3>

      <!-- Switch para incluir/separar costo de pieza -->
      <div class="mb-4 p-3 bg-white rounded-lg border border-green-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="pi pi-cog text-green-600"></i>
            <label for="switchCostoPieza" class="text-sm font-semibold text-gray-700">
              {{ incluyeCostoPieza ? 'Costo incluye pieza' : 'Costo de pieza separado' }}
            </label>
          </div>
          <ToggleSwitch
            v-model="incluyeCostoPieza"
            inputId="switchCostoPieza"
          />
        </div>
        <p class="text-xs text-gray-500 mt-1 ml-6">
          {{ incluyeCostoPieza ? 'La mano de obra ya incluye el costo de las piezas' : 'El costo de las piezas se suma a la mano de obra' }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label for="fallaRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Falla Reportada <span class="text-red-500">*</span>
          </label>
          <Textarea
            id="fallaRapida"
            v-model="ordenRapida.falla"
            rows="3"
            placeholder="Describa la falla del equipo..."
            class="w-full"
            @focus="$event.target.select()"
          />
          <div class="mt-3">
            <p class="text-xs font-medium text-gray-500 mb-2">Fallas frecuentes</p>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="fallaComun in fallasRapidas"
                :key="fallaComun"
                :label="fallaComun"
                size="small"
                severity="secondary"
                outlined
                @click="agregarFallaRapida(fallaComun)"
              />
            </div>
          </div>
        </div>

        <div>
          <label for="tecnicoRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Técnico Asignado
          </label>
          <Select
            id="tecnicoRapida"
            v-model="ordenRapida.tecnico"
            :options="usuariosData.filter(u => u.nivel_seguridad === 'Tecnico')"
            optionLabel="nombre"
            placeholder="Seleccione técnico"
            class="w-full"
          />
        </div>

        <div>
          <label for="fechaEntregaRapida" class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Entrega
          </label>
          <InputText
            id="fechaEntregaRapida"
            v-model="ordenRapida.fecha_entrega"
            type="date"
            class="w-full"
            @focus="$event.target.select()"
          />
        </div>

      </div>

      <!-- Sección de Costos Mejorada -->
      <div class="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 overflow-hidden">
        <h4 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <i class="pi pi-dollar text-green-600 text-sm"></i>
          Cálculo de Costos
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <!-- Total (Campo Principal) -->
          <div class="bg-white p-3 rounded-lg shadow-sm border-2 border-green-400 overflow-hidden">
            <label for="totalRapida" class="block text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
              <i class="pi pi-calculator text-xs"></i>
              Total a Cobrar
            </label>
            <InputNumber
              id="totalRapida"
              v-model="ordenRapida.total"
              fluid
              mode="currency"
              currency="USD"
              locale="en-US"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="$0.00"
              class="w-full"
              inputClass="font-bold text-green-700"
              @focus="$event.target.select()"
            />
            <p class="text-[10px] text-gray-500 mt-1 leading-tight">
              <i class="pi pi-info-circle text-[9px]"></i> Ingresa el total o calcula automáticamente
            </p>
          </div>

          <!-- Costo de Piezas -->
          <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-300 overflow-hidden" v-if="!incluyeCostoPieza">
            <label for="piezasRapida" class="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <i class="pi pi-box text-xs"></i>
              Costo de Piezas
            </label>
            <InputNumber
              id="piezasRapida"
              v-model="ordenRapida.preciopiezas"
              mode="currency"
              currency="USD"
              locale="en-US"
              fluid
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="$0.00"
              class="w-full"
              @focus="$event.target.select()"
            />
            <p class="text-[10px] text-gray-500 mt-1 leading-tight">
              <i class="pi pi-wrench text-[9px]"></i> Se restará del total
            </p>
          </div>

          <!-- Mano de Obra -->
          <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-300 overflow-hidden">
            <label for="manoobraRapida" class="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <i class="pi pi-users text-xs"></i>
              {{ incluyeCostoPieza ? 'Costo Total (incluye pieza)' : 'Mano de Obra' }}
            </label>
            <InputNumber
              id="manoobraRapida"
              v-model="ordenRapida.manodeobra"
              mode="currency"
              currency="USD"
              locale="en-US"
              fluid
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="$0.00"
              class="w-full"
              @focus="$event.target.select()"
            />
            <p class="text-[10px] text-gray-500 mt-1 leading-tight">
              <i class="pi pi-calculator text-[9px]"></i> Se calcula automáticamente
            </p>
          </div>
        </div>

        <!-- Resumen Visual -->
        <div class="mt-3 p-3 bg-white rounded-lg border-2 border-green-500 shadow-md overflow-hidden">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div class="flex-1">
              <p class="text-[10px] text-gray-500 mb-1 uppercase font-semibold">Desglose:</p>
              <p v-if="!incluyeCostoPieza" class="text-xs text-gray-700 break-words">
                <span class="font-semibold">M.O.:</span> ${{ parseFloat(ordenRapida.manodeobra || 0).toFixed(2) }}
                <span class="mx-1">+</span>
                <span class="font-semibold">Piezas:</span> ${{ parseFloat(ordenRapida.preciopiezas || 0).toFixed(2) }}
              </p>
              <p v-else class="text-xs text-gray-700">
                <i class="pi pi-check-circle text-green-600 text-xs"></i>
                <span class="font-semibold ml-1">Costo incluye pieza</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-gray-500 mb-1 uppercase font-semibold">Total:</p>
              <p class="text-2xl md:text-3xl font-bold text-green-600 break-all">
                ${{ parseFloat(ordenRapida.total || 0).toFixed(2) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Ayuda de uso -->
        <div class="mt-3 p-2 bg-blue-50 rounded border border-blue-200 overflow-hidden">
          <p class="text-[10px] text-blue-700 flex items-start gap-1.5 leading-tight">
            <i class="pi pi-lightbulb mt-0.5 text-xs flex-shrink-0"></i>
            <span>
              <strong>Cómo usar:</strong> Ingresa el <strong>Total</strong> y el <strong>Costo de Piezas</strong> (si aplica) y la <strong>Mano de Obra</strong> se calculará automáticamente.
              También puedes ingresar la <strong>Mano de Obra</strong> y el <strong>Total</strong> se calculará sumando las piezas.
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="visibleOrdenRapida = false"
      />
      <Button
        label="Crear Orden"
        icon="pi pi-check"
        severity="success"
        @click="crearOrdenRapida"
      />
    </div>
  </template>
</Dialog>

<Dialog v-model:visible="visibleEtiquetaModal" position="top" modal :style="{ width: '32rem' }">
  <template #header>
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
        <i class="pi pi-ticket text-blue-600 text-xl"></i>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-neutral-900">Configurar Etiqueta</h3>
        <p class="text-sm text-neutral-500">Selecciona qué datos quieres imprimir</p>
      </div>
    </div>
  </template>

  <div class="space-y-4">
    <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
      <div class="grid grid-cols-1 gap-3">
        <div class="flex items-center gap-3">
          <Checkbox v-model="etiquetaOpciones.incluirCabecera" inputId="etiquetaCabecera" binary />
          <label for="etiquetaCabecera" class="text-sm text-neutral-700 cursor-pointer">Mostrar cabecera del negocio</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox v-model="etiquetaOpciones.incluirCodigo" inputId="etiquetaCodigo" binary />
          <label for="etiquetaCodigo" class="text-sm text-neutral-700 cursor-pointer">Mostrar código de la orden</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox v-model="etiquetaOpciones.incluirTexto" inputId="etiquetaTexto" binary />
          <label for="etiquetaTexto" class="text-sm text-neutral-700 cursor-pointer">Mostrar fallas o descripción</label>
        </div>
        <div class="flex items-center gap-3">
          <Checkbox v-model="etiquetaOpciones.incluirPrecio" inputId="etiquetaCliente" binary />
          <label for="etiquetaCliente" class="text-sm text-neutral-700 cursor-pointer">Mostrar cliente y teléfono</label>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg p-4 border border-neutral-200">
      <label class="block text-sm font-medium text-neutral-700 mb-2">Impresora</label>
      <Select
        v-model="etiquetaOpciones.printerName"
        :options="listaImpresorasEtiqueta"
        placeholder="Selecciona una impresora"
        class="w-full"
        :loading="cargandoImpresorasEtiqueta"
      />
      <small v-if="etiquetaOpciones.printerName" class="text-neutral-500 block mt-2">
        Impresora seleccionada: {{ etiquetaOpciones.printerName }}
      </small>
      <small v-else class="text-amber-600 block mt-2">
        Debes seleccionar una impresora para imprimir la etiqueta.
      </small>
    </div>

    <div class="bg-white rounded-lg p-4 border border-neutral-200">
      <label for="cantidadEtiquetas" class="block text-sm font-medium text-neutral-700 mb-2">Cantidad de etiquetas</label>
      <InputNumber
        v-model="etiquetaOpciones.cantidad"
        inputId="cantidadEtiquetas"
        :min="1"
        :max="20"
        showButtons
        fluid
      />
    </div>

    <div class="bg-white rounded-lg p-4 border border-neutral-200">
      <label class="block text-sm font-medium text-neutral-700 mb-3">Tamano de etiqueta</label>
      <div class="flex gap-2 mb-3">
        <Button
          label="mm"
          size="small"
          :outlined="etiquetaOpciones.labelUnit !== 'mm'"
          @click="cambiarUnidadEtiqueta('mm')"
        />
        <Button
          label="in"
          size="small"
          :outlined="etiquetaOpciones.labelUnit !== 'in'"
          @click="cambiarUnidadEtiqueta('in')"
        />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="anchoEtiquetaMm" class="block text-xs font-medium text-neutral-600 mb-1">
            Ancho ({{ etiquetaOpciones.labelUnit }})
          </label>
          <InputNumber
            v-model="etiquetaOpciones.labelWidthMm"
            inputId="anchoEtiquetaMm"
            :min="etiquetaOpciones.labelUnit === 'in' ? 0.4 : 10"
            :max="etiquetaOpciones.labelUnit === 'in' ? 6 : 150"
            :minFractionDigits="etiquetaOpciones.labelUnit === 'in' ? 2 : 1"
            :maxFractionDigits="etiquetaOpciones.labelUnit === 'in' ? 2 : 1"
            :suffix="` ${etiquetaOpciones.labelUnit}`"
            fluid
          />
        </div>
        <div>
          <label for="altoEtiquetaMm" class="block text-xs font-medium text-neutral-600 mb-1">
            Alto ({{ etiquetaOpciones.labelUnit }})
          </label>
          <InputNumber
            v-model="etiquetaOpciones.labelHeightMm"
            inputId="altoEtiquetaMm"
            :min="etiquetaOpciones.labelUnit === 'in' ? 0.4 : 10"
            :max="etiquetaOpciones.labelUnit === 'in' ? 8 : 200"
            :minFractionDigits="etiquetaOpciones.labelUnit === 'in' ? 2 : 1"
            :maxFractionDigits="etiquetaOpciones.labelUnit === 'in' ? 2 : 1"
            :suffix="` ${etiquetaOpciones.labelUnit}`"
            fluid
          />
        </div>
      </div>
    </div>

    <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <h4 class="text-sm font-semibold text-blue-900 mb-3">Vista previa</h4>
      <div class="space-y-2 text-sm text-neutral-700">
        <p><span class="font-medium">Tamano:</span> {{ etiquetaOpciones.labelWidthMm }}{{ etiquetaOpciones.labelUnit }} x {{ etiquetaOpciones.labelHeightMm }}{{ etiquetaOpciones.labelUnit }}</p>
        <p v-if="etiquetaOpciones.incluirCabecera">{{ datosEmpresa.empresa.nombre }}</p>
        <p v-if="etiquetaOpciones.incluirCodigo"><span class="font-medium">Código:</span> {{ etiquetaOrdenData.no_factura }}</p>
        <p v-if="etiquetaOpciones.incluirPrecio"><span class="font-medium">Cliente:</span> {{ etiquetaOrdenData.nombre }} - {{ etiquetaOrdenData.telefono }}</p>
        <p v-if="etiquetaOpciones.incluirTexto"><span class="font-medium">Fallas:</span> {{ obtenerTextoEtiqueta(etiquetaOrdenData) || 'Sin descripción' }}</p>
      </div>
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="visibleEtiquetaModal = false"
      />
      <Button
        label="Imprimir"
        icon="pi pi-print"
        severity="success"
        @click="confirmarImpresionEtiqueta"
      />
    </div>
  </template>
</Dialog>

<!-- Loading Overlay -->
<LoadingOverlay :visible="loading" />

<!-- Impresora de Taller -->
<ImpresoraTaller
  v-model:visible="visibleImpresoraTaller"
  :ordenData="ordenParaImprimir"
  :empresaData="datosEmpresa.empresa"
  :formatoImpresion="formatoImpresion"
  @close="cerrarImpresoraTaller"
/>

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

/* Main Wrapper */
.taller-wrapper {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.16), transparent 24%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 22%),
    linear-gradient(180deg, #f7fafc 0%, #eef6ff 52%, #f4f8fb 100%);
  padding: 2rem;
}

.taller-container {
  max-width: 1600px;
  margin: 0 auto;
  animation: slideIn 0.5s ease-out;
}

/* Header */
.taller-header {
  background:
    radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.16), transparent 18%),
    linear-gradient(135deg, #0f172a 0%, #0f766e 48%, #14b8a6 100%);
  border-radius: 28px;
  padding: 2.2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
}

.taller-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.taller-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.taller-icon {
  font-size: 2.5rem;
  color: white;
}

.taller-title {
  font-size: clamp(1.8rem, 3vw, 2.45rem);
  font-weight: 800;
  color: white;
  margin: 0;
  letter-spacing: -0.03em;
}

.taller-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.82);
  margin: 0.45rem 0 0 0;
}

/* Stats Grid */
.taller-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.taller-stat-card {
  border-radius: 22px;
  border: 1px solid #d9e7ef;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
}

.taller-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.2);
}

.taller-stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
}

.taller-stat-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.taller-stat-blue {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

.taller-stat-orange {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.taller-stat-green {
  background: linear-gradient(135deg, #4caf50, #388e3c);
}

.taller-stat-cyan {
  background: linear-gradient(135deg, #00bcd4, #0097a7);
}

.taller-stat-info {
  flex: 1;
}

.taller-stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  margin: 0;
}

.taller-stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1976d2;
  margin: 0;
}

/* Actions Card */
.taller-actions-card {
  margin-bottom: 2rem;
  border-radius: 24px;
  border: 1px solid #d9e7ef;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.taller-actions-content {
  padding: 0.5rem;
}

.taller-actions-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.taller-actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Filters Card */
.taller-filters-card {
  margin-bottom: 2rem;
  border-radius: 24px;
  border: 1px solid #d9e7ef;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.taller-filters-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.taller-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.taller-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.taller-filter-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.taller-filter-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.taller-filter-input {
  flex: 1;
}

.taller-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.taller-search-icon {
  position: absolute;
  left: 0.75rem;
  color: #999;
  pointer-events: none;
}

.taller-search-input {
  width: 100%;
  padding-left: 2.5rem;
}

.taller-actions-card :deep(.p-card-body),
.taller-filters-card :deep(.p-card-body),
.taller-table-card :deep(.p-card-body),
.taller-stat-card :deep(.p-card-body) {
  padding: 1.2rem;
}

.taller-actions-grid :deep(.p-button),
.taller-filters-card :deep(.p-button),
.taller-table-card :deep(.p-button) {
  border-radius: 16px;
  font-weight: 700;
}

.taller-actions-grid :deep(.p-button:not(.p-button-secondary):not(.p-button-outlined):not(.p-button-danger):not(.p-button-help):not(.p-button-warning):not(.p-button-success)),
.taller-filters-card :deep(.p-button:not(.p-button-secondary):not(.p-button-outlined)) {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  border: none;
  box-shadow: 0 16px 28px rgba(15, 118, 110, 0.16);
}

.taller-filters-card :deep(.p-inputtext),
.taller-filters-card :deep(.p-select),
.taller-filters-card :deep(.p-datepicker-input),
.taller-filters-card :deep(.p-calendar input),
.taller-filters-card :deep(.p-inputwrapper),
.taller-filters-card :deep(.taller-filter-input .p-inputtext) {
  border-radius: 16px;
}

.taller-table-card {
  border-radius: 24px;
  border: 1px solid #d9e7ef;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.08);
}

.taller-table-card :deep(.p-datatable-header),
.taller-table-card :deep(.p-datatable-thead > tr > th) {
  background: #f8fbfd;
}

.taller-table-card :deep(.p-datatable-wrapper) {
  border-radius: 18px;
  overflow: auto;
}

@media (max-width: 1200px) {
  .taller-container {
    max-width: 100%;
  }

  .taller-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .taller-wrapper {
    padding: 1.25rem;
  }

  .taller-header {
    padding: 1.7rem;
  }

  .taller-actions-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .taller-actions-grid > * {
    width: 100%;
  }

  .taller-actions-grid :deep(.p-button) {
    width: 100%;
    justify-content: center;
  }

  .taller-filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .taller-wrapper {
    padding: 1rem;
  }

  .taller-header {
    padding: 1.35rem;
    border-radius: 22px;
  }

  .taller-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .taller-icon-wrapper {
    width: 64px;
    height: 64px;
  }

  .taller-title {
    font-size: 1.6rem;
  }

  .taller-subtitle {
    font-size: 0.92rem;
  }

  .taller-stats-grid,
  .taller-filters-grid,
  .taller-actions-grid {
    grid-template-columns: 1fr;
  }

  .taller-actions-grid {
    display: grid;
  }

  .taller-filter-input-group {
    flex-wrap: wrap;
  }

  .taller-filter-input-group > * {
    width: 100%;
  }

  .taller-table-card :deep(.p-datatable-table) {
    min-width: 900px;
  }

  .taller-actions-card :deep(.p-card-body),
  .taller-filters-card :deep(.p-card-body),
  .taller-table-card :deep(.p-card-body),
  .taller-stat-card :deep(.p-card-body) {
    padding: 0.95rem;
  }
}

@media (max-width: 560px) {
  .taller-wrapper {
    padding: 0.75rem;
  }

  .taller-header {
    padding: 1.1rem;
    border-radius: 18px;
  }

  .taller-title {
    font-size: 1.4rem;
  }

  .taller-stat-content {
    padding: 0;
  }

  .taller-stat-value {
    font-size: 1.7rem;
  }
}

.taller-filter-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e3f2fd;
}

.taller-badge-text {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

/* Estado Colors */
.pendiente {
  color: #ff9800 !important;
}

.devolucion {
  color: #dc3545 !important;
}

.reparado {
  color: #2196f3 !important;
}

.entregado {
  color: #4caf50 !important;
}

.revision {
  color: #ffc107 !important;
}
</style>
