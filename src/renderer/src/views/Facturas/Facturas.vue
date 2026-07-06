<script setup>
import { ref, onMounted, nextTick, watchEffect, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
import axios from 'axios';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast,generadorCodigo,generarTablaFromStringJSON, crearTablaSiNoExiste,crearTablaSiNoExisteOffline, peticiones,formatearFecha, lasMayusculas,enviarDatosLocalStorage,transformarFechaTimestamp,peticionesFetchOffline,extraerNumerosEntreParentesis,arrayToObjetoFromTablaOffline,formatoMonedaRD } from '@/funciones/funciones.js';
import Swal from 'sweetalert2'
import { useToast } from "primevue/usetoast";
const toast = useToast();
/************************************************************************/
import EnviarWhatsApp from '@/components/WhatsappModal.vue';
import FacturaPdfPrint from '@/components/FacturaPdfPrint.vue';
/************************************************************************/
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
/************************************************************************/
const usuarioLocal = ref({})
/************************************************************************/
const camposArray = ["no_factura","tipo_factura","comprobante","cod_cliente","nombre_cliente","telefono_cliente","productos","vendedor","metodo_pago","tarjeta","transferencia","efectivo","cheque","canal_venta","fecha_emision","impuesto","descuento","subtotal","total","ganancia","financiera","estado_factura","fecha_estado","mes","year","hora","otro","nota","cajero","token","almacen","usuario","total_institucion","total_cliente"];
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
const datosConfiguracion = ref({});
/************************************************************************/
const confiscalData = ref([]);
const selectedItems = ref([]);
const datoscamposComprobantes = ref({});
const selectedComprobante = ref({ label: 'TODAS', value: '' });
const selectedMetodoPago = ref({ label: 'TODOS', value: '' });
const selectedRangoFecha = ref({ label: 'TODAS', value: 'todas' });
const visibleAsignacionMasiva = ref(false);
const usuariosData = ref([]);
const asignacionMasiva = ref({
  vendedor: null,
  cajero: null
});

/************************************************************************/
const fechaInteligente = ref(false)
const showWhatsapp = ref(false);
/************************************************************************/
const visibleAbonosInteligentes = ref(false)
const datosAbonosInteligentes = ref([])
/************************************************************************/
const productosArray = ref([])
/************************************************************************/
const menuInteligente = ref();
const buscadorFechaInteligente = ref()
/************************************************************************/
const bancoArray = ref([])
/************************************************************************/
const comprobantesOptions = [
  { label: 'TODAS', value: '' },
  { label: 'SIN COMPROBANTE', value: 'SIN COMPROBANTE' },
  { label: 'COMPROBANTE CON VALOR FISCAL', value: 'COMPROBANTE CON VALOR FISCAL' },
  { label: 'CONSUMIDOR FINAL', value: 'CONSUMIDOR FINAL' },
  { label: 'REGIMEN ESPECIAL', value: 'REGIMEN ESPECIAL' },
  { label: 'COMPROBANTE GUBERNAMENTAL', value: 'COMPROBANTE GUBERNAMENTAL' }
];

const metodoPagoOptions = [
  { label: 'TODOS', value: '' },
  { label: 'EFECTIVO', value: 'EFECTIVO' },
  { label: 'TRANSFERENCIA', value: 'TRANSFERENCIA' },
  { label: 'TARJETA', value: 'TARJETA' },
  { label: 'CREDITO', value: 'CREDITO' },
  { label: 'CHEQUE', value: 'CHEQUE' }
];

const rangoFechaOptions = [
  { label: 'TODAS', value: 'todas' },
  { label: 'Esta Semana', value: 'esta_semana' },
  { label: 'Este Mes', value: 'este_mes' },
  { label: 'Mes Pasado', value: 'mes_pasado' },
  { label: 'Últimos 7 Días', value: 'ultimos_7_dias' },
  { label: 'Últimos 30 Días', value: 'ultimos_30_dias' }
];


/************************************************************************/
const position = ref('top');
const openPosition = (pos) => {
    position.value = pos;
    visible.value = true;
}
/************************************************************************/
const enviarWhatsAppRef = ref(null);
const facturaPdfPrintRef = ref(null);
const datosWhatsApp = ref({
  nombre: 'John Doe',
  numero: '123456789',
  texto: 'Hola, este es un mensaje predefinido.'
});

const showWhatsAppModal = async () => {
  if (enviarWhatsAppRef.value) {
      try {

          const datosFactura = currentRowData.value

       const mensajaeEnviar = `Hola *${datosFactura.nombre_cliente}* Aquí tiene un enlace para ver o descargar su *Factura* ${datosConfiguracion.value.urlsitio}receipt/factura?factura=${datosFactura.no_factura}`;

          datosWhatsApp.value.nombre = datosFactura.nombre_cliente;
          datosWhatsApp.value.numero = datosFactura.telefono_cliente;
          datosWhatsApp.value.texto = mensajaeEnviar;
          enviarWhatsAppRef.value.updateDatosWhatsApp(datosWhatsApp.value);
          enviarWhatsAppRef.value.visible = true;

      } catch (error) {
        console.error('Error fetching datosFactura:', error);
      }

  }
};
/************************************************************************/
const visible = ref(false);
const visibleComprobantes = ref(false);
const visiblePrint = ref(false);
const visiblecrear = ref(false);
const visibleProductos = ref(false);
const productosFactura = ref([]);
const value = ref(null);
const id = ref(null);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const FacturasEditar = ref(null);
const FACTURAS_LAZY_LIMIT = 10;
const facturasBuscando = ref(false);
const totalRecords = ref(0);
const first = ref(0);
const rows = ref(FACTURAS_LAZY_LIMIT);
let facturasSearchToken = 0;
let facturasSearchTimeout = null;
const date = ref(null);
const clearDate = () => {
  date.value = null;
};

const limpiarFiltros = () => {
  date.value = null;
  selectedComprobante.value = { label: 'TODAS', value: '' };
  selectedMetodoPago.value = { label: 'TODOS', value: '' };
  selectedRangoFecha.value = { label: 'TODAS', value: 'todas' };
  buscadorFechaInteligente.value = null;
  searchQuery.value = '';

  toast.add({
    severity: 'success',
    summary: 'Filtros limpiados',
    detail: 'Todos los filtros han sido reseteados',
    life: 2000
  });
};
/************************************************************************/
async function limpiarCamposCrear() {
datoscamposFacturas.value = {}
await campos();
}
/************************************************************************/
watchEffect(() => {
  if (visiblecrear.value) {
  }
});
/************************************************************************/
const cargarFacturasLazy = async ({ search = '', limit = rows.value, offset = first.value } = {}) => {
  const token = ++facturasSearchToken;
  facturasBuscando.value = true;

  try {
    // Detectar si hay un filtro de rango activo
    const tieneRangoPredefinido = selectedRangoFecha.value.value !== 'todas';
    const tieneRangoPersonalizado = buscadorFechaInteligente.value !== null && buscadorFechaInteligente.value !== '';
    const usarTodosLosDatos = tieneRangoPredefinido || tieneRangoPersonalizado;

    let response;

    if (usarTodosLosDatos) {
      // Si hay rango de fechas, obtener TODOS los datos
      const respuestaDatos = await peticionesFetchOffline('getDataAsArray', 'facturas');

      // Normalizar la respuesta (puede ser array directo o {data: array})
      let todosLosDatos = Array.isArray(respuestaDatos) ? respuestaDatos : (respuestaDatos?.data || []);

      if (!Array.isArray(todosLosDatos)) {
        console.error('[Facturas] Los datos no son un array:', todosLosDatos);
        todosLosDatos = [];
      }

      // Filtrar por almacén
      let datosFiltrados = todosLosDatos.filter(item => item.almacen === datosEmpresa.empresa.nombre);

      // Filtrar por búsqueda si existe
      if (search) {
        const searchLower = search.toLowerCase();
        datosFiltrados = datosFiltrados.filter(item => {
          return (
            String(item.no_factura || '').toLowerCase().includes(searchLower) ||
            String(item.tipo_factura || '').toLowerCase().includes(searchLower) ||
            String(item.comprobante || '').toLowerCase().includes(searchLower) ||
            String(item.cod_cliente || '').toLowerCase().includes(searchLower) ||
            String(item.nombre_cliente || '').toLowerCase().includes(searchLower) ||
            String(item.telefono_cliente || '').toLowerCase().includes(searchLower) ||
            String(item.vendedor || '').toLowerCase().includes(searchLower) ||
            String(item.metodo_pago || '').toLowerCase().includes(searchLower) ||
            String(item.estado_factura || '').toLowerCase().includes(searchLower) ||
            String(item.canal_venta || '').toLowerCase().includes(searchLower) ||
            String(item.nota || '').toLowerCase().includes(searchLower) ||
            String(item.usuario || '').toLowerCase().includes(searchLower) ||
            String(item.total || '').toLowerCase().includes(searchLower)
          );
        });
      }

      // Filtrar por rango de fechas predefinido
      if (tieneRangoPredefinido) {
        const rango = calcularRangoFechas(selectedRangoFecha.value.value);
        if (rango) {
          const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(rango.fechaInicio, false) + ' 00:00:01');
          const fechaFinTimeStamp = new Date(transformarFechaTimestamp(rango.fechaFin, false) + ' 23:59:59');

          datosFiltrados = datosFiltrados.filter(item => {
            const fechaUpdated = new Date(item.updated_at);
            return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
          });
        }
      }

      // Filtrar por rango de fechas personalizado
      if (tieneRangoPersonalizado) {
        let fechaInicio, fechaFin;

        if (typeof buscadorFechaInteligente.value === 'string') {
          const fechas = buscadorFechaInteligente.value.split(' - ');
          fechaInicio = fechas[0];
          fechaFin = fechas[1] || fechas[0];
        } else if (Array.isArray(buscadorFechaInteligente.value)) {
          fechaInicio = formatearFecha(buscadorFechaInteligente.value[0]);
          fechaFin = buscadorFechaInteligente.value[1]
            ? formatearFecha(buscadorFechaInteligente.value[1])
            : formatearFecha(buscadorFechaInteligente.value[0]);
        }

        if (fechaInicio && fechaFin) {
          const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(fechaInicio, false) + ' 00:00:01');
          const fechaFinTimeStamp = new Date(transformarFechaTimestamp(fechaFin, false) + ' 23:59:59');

          datosFiltrados = datosFiltrados.filter(item => {
            const fechaUpdated = new Date(item.updated_at);
            return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
          });
        }
      }

      // Ordenar por ID descendente
      datosFiltrados.sort((a, b) => b.id - a.id);

      // Simular paginación
      const total = datosFiltrados.length;
      const datosPaginados = datosFiltrados.slice(offset, offset + limit);

      response = {
        data: datosPaginados,
        total: total
      };
    } else {
      // Sin filtro de rango, usar paginación normal con lazy loading
      response = await peticionesFetchOffline('getDataAsArrayLazy', 'facturas', {
        limit,
        offset,
        search,
        searchFields: [
          'no_factura',
          'tipo_factura',
          'comprobante',
          'cod_cliente',
          'nombre_cliente',
          'telefono_cliente',
          'vendedor',
          'metodo_pago',
          'estado_factura',
          'canal_venta',
          'nota',
          'usuario',
          'total'
        ],
        orderBy: 'id',
        orderDir: 'DESC',
        filtroCampo: 'almacen',
        filtroValor: datosEmpresa.empresa.nombre
      });
    }

    if (token === facturasSearchToken) {
      data.value = Array.isArray(response?.data) ? response.data : [];
      totalRecords.value = Number(response?.total || 0);
    }
  } catch (error) {
    if (token === facturasSearchToken) {
      data.value = [];
      totalRecords.value = 0;
    }
    throw error;
  } finally {
    if (token === facturasSearchToken) {
      facturasBuscando.value = false;
    }
  }
};

const fetchAndSetupData = async (event = null) => {
  if (event) {
    first.value = event.first;
    rows.value = event.rows;
  }

  await cargarFacturasLazy({
    search: String(searchQuery.value || '').trim(),
    limit: rows.value,
    offset: first.value
  });
};

const onPage = async (event) => {
  await fetchAndSetupData(event);
};

watch(searchQuery, (valor) => {
  if (facturasSearchTimeout) {
    clearTimeout(facturasSearchTimeout);
  }

  facturasSearchTimeout = setTimeout(async () => {
    first.value = 0;
    await cargarFacturasLazy({
      search: String(valor || '').trim(),
      limit: rows.value,
      offset: first.value
    });
  }, 250);
});

// Resetear rango personalizado cuando se selecciona un rango predefinido
watch(selectedRangoFecha, async (newVal) => {
  if (newVal.value !== 'todas') {
    buscadorFechaInteligente.value = null;
  }
  // Recargar datos cuando cambia el rango predefinido
  first.value = 0;
  await cargarFacturasLazy({
    search: String(searchQuery.value || '').trim(),
    limit: rows.value,
    offset: 0
  });
});

// Resetear rango predefinido cuando se selecciona un rango personalizado
watch(buscadorFechaInteligente, async (newVal) => {
  if (newVal) {
    selectedRangoFecha.value = { label: 'TODAS', value: 'todas' };
  }
  // Recargar datos cuando cambia el rango personalizado
  if (newVal) {
    first.value = 0;
    await cargarFacturasLazy({
      search: String(searchQuery.value || '').trim(),
      limit: rows.value,
      offset: 0
    });
  }
});

onBeforeUnmount(() => {
  if (facturasSearchTimeout) {
    clearTimeout(facturasSearchTimeout);
  }
});
/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('facturas');
  datoscamposFacturas.value = campos;
}
/************************************************************************/

const fetchConfiscal = async () => {
  try {
/*    const response = await peticionesFetchOffline('getDataAsArray', 'confiscal');*/
    const response = await peticionesFetchOffline('getDataAsArray', 'confiscal');
    confiscalData.value = response;
    //confiscalDataNames.value = response.map(confiscal=>confiscal.name);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from confiscal',
      life: 3000
    });
  }
};

/************************************************************************/
const fetchBanco = async () => {
  try {
/*   const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'banco'},tokenCifrado.value,'POST');*/
   const response = await peticionesFetchOffline('getDataAsArray', 'banco');
       bancoArray.value = response;
      /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};
/************************************************************************/
const fetchProductos = async () => {
  try {
   /*const response = await peticionesFetch(`${link.value}${api.value}`,'datosarraypost',{'tabla':'productos'},tokenCifrado.value,'POST');*/
    const response = await peticionesFetchOffline('getDataAsArray', 'productos');
       productosArray.value = response;
      /*********************************************/
  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
  }
};
/************************************************************************/
const fetchUsuarios = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'usuarios');
    usuariosData.value = response;
  } catch (error) {
    console.error('Error fetching usuarios', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios', life: 3000 });
  }
};
/************************************************************************/
const fetchDataConfiguracion = async () => {
  try {

   const verificaLocalStorage = JSON.parse(window.localStorage.getItem('configuracion')) || [];

   if (verificaLocalStorage.length > 0) {
      datosConfiguracion.value = verificaLocalStorage;
   }else{

    const response = await peticionesFetchOffline('getDataByField', 'configuracion','id',1);
    datosConfiguracion.value = response;
    localStorage.setItem('configuracion', JSON.stringify(response));
   }

  } catch (error) {
    console.error('Error fetching data', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data Configuracion', life: 3000 });
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
await crearTablaSiNoExisteOffline('facturas', camposArray, toast);
usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};
await fetchAndSetupData();
await fetchDataConfiguracion()
await fetchProductos()
await fetchConfiscal()
await fetchBanco()
await fetchUsuarios()
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
                    const envioDatos = await peticionesFetchOffline('deleteAll', 'facturas');
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
async function funcionActualizar() {
  const url = link.value+api.value+"/actualizarcampos/facturas";
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  //const envioDatos = await peticionesFetchOffline('updateData', 'facturas', JSON.stringify(datoscampos.value));
    const envioDatos = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datoscampos.value));
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
  const url = link.value+api.value+"/insertar/facturas";
  if (datoscamposFacturas.value.hasOwnProperty('created_at')) {
    datoscamposFacturas.value.created_at = nfecha('timestamp');
    datoscamposFacturas.value.updated_at = nfecha('timestamp');
  }
  const envioDatos = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datoscamposFacturas.value));
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
                                // Obtener datos completos de la factura antes de eliminar
                                const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'id', id);

                                if (datosFactura) {
                                    // Enviar correo de alerta antes de eliminar
                                    await enviarCorreoEliminacionFactura(datosFactura);
                                }

                                const envioDatos = await peticionesFetchOffline('deleteEntry','facturas', id);
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
const abrirAsignacionMasiva = () => {
  if (!selectedItems.value.length) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Selecciona al menos una factura', life: 3000 });
    return;
  }

  asignacionMasiva.value = {
    vendedor: null,
    cajero: null
  };
  visibleAsignacionMasiva.value = true;
}
/************************************************************************/
const aplicarAsignacionMasiva = async () => {
  if (!selectedItems.value.length) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Selecciona al menos una factura', life: 3000 });
    return;
  }

  const vendedorSeleccionado = asignacionMasiva.value.vendedor?.nombre || '';
  const cajeroSeleccionado = asignacionMasiva.value.cajero?.nombre || '';

  if (!vendedorSeleccionado && !cajeroSeleccionado) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Debes seleccionar un vendedor, un cajero o ambos', life: 3000 });
    return;
  }

  facturasBuscando.value = true;

  try {
    let actualizados = 0;

    for (const factura of selectedItems.value) {
      const facturaActualizada = { ...factura };

      if (vendedorSeleccionado) {
        facturaActualizada.vendedor = vendedorSeleccionado;
      }

      if (cajeroSeleccionado) {
        facturaActualizada.cajero = cajeroSeleccionado;
      }

      if (facturaActualizada.hasOwnProperty('updated_at')) {
        facturaActualizada.updated_at = nfecha('timestamp');
      }

      const envioDatos = await peticionesFetchOffline('updateData', 'facturas', JSON.stringify(facturaActualizada));
      if (envioDatos[0] === 'ok') {
        actualizados++;
      }
    }

    if (actualizados === selectedItems.value.length) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `${actualizados} factura(s) actualizadas correctamente`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Parcial',
        detail: `Se actualizaron ${actualizados} de ${selectedItems.value.length} factura(s)`,
        life: 3000
      });
    }

    visibleAsignacionMasiva.value = false;
    selectedItems.value = [];
    await fetchAndSetupData();
  } catch (error) {
    console.error('Error asignando vendedor/cajero:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo aplicar la asignación masiva', life: 3000 });
  } finally {
    facturasBuscando.value = false;
  }
}
/************************************************************************/
async function ejecutarFuncionTarjeta() {
    const { value: bancoSeleccionado } = await Swal.fire({
        title: 'Seleccione el banco para Tarjeta',
        input: 'select',
        inputOptions: bancoArray.value.reduce((options, banco) => {
            options[banco.id] = `${banco.nombre} - Cuenta: ${banco.cuenta}`;
            return options;
        }, {}),
        inputPlaceholder: 'Seleccionar banco',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe seleccionar un banco';
            }
        }
    });

    if (!bancoSeleccionado) return;

    const banco = bancoArray.value.find(b => b.id == bancoSeleccionado);
    if (!banco) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Banco no encontrado', life: 3000 });
        return;
    }

    const nuevoSaldo = Number(banco.saldo) + Number(currentRowData.value.total);

    const urlBanco = `${link.value}${api.value}/actualizarcampos/banco`;
    const datosBanco = { ...banco, saldo: nuevoSaldo, updated_at: nfecha('timestamp') };

    const envioDatosBanco = await peticionesFetchOffline('updateData','banco', JSON.stringify(datosBanco));

    if (envioDatosBanco[0] === 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: `Saldo actualizado en ${banco.nombre}`, life: 3000 });
        await fetchBanco(); // Actualizar la lista de bancos
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el saldo', life: 3000 });
    }
}

async function ejecutarFuncionTransferencia() {
    const { value: bancoSeleccionado } = await Swal.fire({
        title: 'Seleccione el banco para Transferencia',
        input: 'select',
        inputOptions: bancoArray.value.reduce((options, banco) => {
            options[banco.id] = `${banco.nombre} - Cuenta: ${banco.cuenta}`;
            return options;
        }, {}),
        inputPlaceholder: 'Seleccionar banco',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe seleccionar un banco';
            }
        }
    });

    if (!bancoSeleccionado) return;

    const banco = bancoArray.value.find(b => b.id == bancoSeleccionado);
    if (!banco) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Banco no encontrado', life: 3000 });
        return;
    }

    const nuevoSaldo = Number(banco.saldo) + Number(currentRowData.value.total);

    const urlBanco = `${link.value}${api.value}/actualizarcampos/banco`;
    const datosBanco = { ...banco, saldo: nuevoSaldo, updated_at: nfecha('timestamp') };

    const envioDatosBanco = await peticionesFetchOffline('updateData','banco', JSON.stringify(datosBanco));

    if (envioDatosBanco[0] === 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: `Saldo actualizado en ${banco.nombre}`, life: 3000 });
        await fetchBanco(); // Actualizar la lista de bancos
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el saldo', life: 3000 });
    }
}

/************************************************************************/
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

/************************************************************************/
const fnActualizarInventario = async (producto) => {
    const url = link.value + api.value + "/actualizarcampos/productos";
    const datosPro = productosArray.value.find(prod => prod.id === producto.id);

    if (datosPro) {
        if (datosPro.hasOwnProperty('created_at')) {
            datosPro.updated_at = nfecha('timestamp');
        }

        if (datosPro.categoria === 'CELULARES') {
            let listaImei = [];

            if (producto.lista_imei) {
                listaImei = producto.lista_imei.split(',');
            } else {
                const imei = extractIMEIs(producto.nombre);
                listaImei = imei;
            }

            if(listaImei.length > 0){
                for(let imei of listaImei){
               const datosImei = await peticionesFetchOffline('getDataByField', 'imei','imei',imei);
                if(datosImei){
                    const urlImei = link.value+api.value+"/actualizarcampos/imei";
                    if (datosImei.hasOwnProperty('created_at')) {
                     datosImei.updated_at = nfecha('timestamp');
                       }
                       datosImei.estado = 'DISPONIBLE';
                   const envioDatos = await peticionesFetchOffline('updateData','imei', JSON.stringify(datosImei));
                  }
                }

            }


        }

        datosPro.stock = (Number(datosPro.stock) + Number(producto.cantidad));
        const envioDatos = await peticionesFetchOffline('updateData','productos', JSON.stringify(datosPro));
    }
};

/************************************************************************/
const itemsFacturas = ref([]);
const menu = ref(null);
const currentRowData = ref(null);
const toggleFacturas = (event, rowData) => {
currentRowData.value = rowData;
itemsFacturas.value = [
{ label: 'Ver', icon: 'pi pi-eye', command: async() => {

  if(window.electron){

     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
         const datosFactura = currentRowData.value
         const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes','codigo',currentRowData.value.cod_cliente);

     const envio = await window.electron.ipcRenderer.invoke('facturaPDF', JSON.stringify(datosFactura),JSON.stringify(datosCliente), datosEmpresa1,null);

  }else{
      router.push({ path: `/factura/${currentRowData.value.no_factura}/facturas` });
    }

} },
{ label: 'Editar', icon: 'pi pi-pencil', command: () => {
  router.push({ path: `/editarfacturas/${currentRowData.value.id}` });
} },
{ label: 'Comprobante', icon: 'pi icon-balance-scale', command: () => {
   visibleComprobantes.value = true
}},
{
    label: 'Cambiar Método de Pago',
    icon: 'pi pi-dollar',
    command: async () => {
        const { value: metodoPago } = await Swal.fire({
            title: 'Selecciona el método de pago',
            input: 'select',
            inputOptions: {
                EFECTIVO: 'Efectivo',
                TRANSFERENCIA: 'Transferencia',
                TARJETA: 'Tarjeta'
            },
            inputPlaceholder: 'Seleccionar método',
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debe seleccionar un método de pago';
                }
            }
        });

        if (!metodoPago) return;

        // Pedir contraseña antes de confirmar el cambio
        const { value: password } = await Swal.fire({
            title: 'Ingrese la contraseña',
            input: 'password',
            inputPlaceholder: 'Contraseña',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar'
        });

        if (!password || (password !== token.value && password !== tokenCorto.value)) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
            return;
        }

        // Obtener el total de la factura
        const totalFactura = Number(currentRowData.value.total);

        // Determinar el nuevo valor del método de pago y resetear los otros
        switch (metodoPago) {
            case 'EFECTIVO':
                currentRowData.value.efectivo = totalFactura;
                currentRowData.value.tarjeta = 0;
                currentRowData.value.transferencia = 0;
                break;
            case 'TRANSFERENCIA':
                currentRowData.value.transferencia = totalFactura;
                currentRowData.value.efectivo = 0;
                currentRowData.value.tarjeta = 0;
                ejecutarFuncionTransferencia(); // Ejecuta función adicional
                break;
            case 'TARJETA':
                currentRowData.value.tarjeta = totalFactura;
                currentRowData.value.efectivo = 0;
                currentRowData.value.transferencia = 0;
                ejecutarFuncionTarjeta(); // Ejecuta función adicional
                break;
        }

        // Actualizar en la base de datos
        currentRowData.value.metodo_pago = metodoPago;
        currentRowData.value.updated_at = nfecha('timestamp');

        const urlFactura = `${link.value}${api.value}/actualizarcampos/facturas`;
        const envioDatos = await peticionesFetchOffline('updateData','facturas', JSON.stringify(currentRowData.value));

        if (envioDatos[0] == 'ok') {
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Método de pago actualizado', life: 3000 });
            await fetchAndSetupData();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el método de pago', life: 3000 });
        }
    }
},

{ label: 'Imprimir', icon: 'pi pi-print', command: () => {

visiblePrint.value = true

}},
{ label: 'Whatsapp', icon: 'pi pi-whatsapp', command: async() => {

await showWhatsAppModal();

}},
{ label: 'Productos', icon: 'pi pi-box', command: () => {
  visibleProductos.value = true;
  productosFactura.value = JSON.parse(currentRowData.value.productos)
}},
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
                        const productosVendidos = JSON.parse(rowData.productos)
                            for(let prod of productosVendidos){
                              await fnActualizarInventario(prod)
                            }

                         if(rowData.metodo_pago === 'CREDITO'){
                             const datosCredito = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar','no_factura',rowData.no_factura);
                            if(datosCredito){


                                const datosFacturaCredito = await peticionesFetchOffline('deleteEntry','cuentas_cobrar', datosCredito.id);

                             if (datosFacturaCredito[0] == 'ok') {
                                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos CREDITO eliminados correctamente', life: 3000 });
                             }


                            }

                         }

                        // Enviar correo de alerta antes de eliminar
                        await enviarCorreoEliminacionFactura(rowData);

                        const datosFactura = await peticionesFetchOffline('deleteEntry','facturas', rowData.id);

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
const calcularRangoFechas = (tipoRango) => {
  const hoy = new Date();
  let fechaInicio, fechaFin;

  switch(tipoRango) {
    case 'esta_semana':
      const primerDiaSemana = new Date(hoy);
      primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
      fechaInicio = formatearFecha(primerDiaSemana);
      fechaFin = formatearFecha(hoy);
      break;

    case 'este_mes':
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fechaInicio = formatearFecha(primerDiaMes);
      fechaFin = formatearFecha(hoy);
      break;

    case 'mes_pasado':
      const primerDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const ultimoDiaMesPasado = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      fechaInicio = formatearFecha(primerDiaMesPasado);
      fechaFin = formatearFecha(ultimoDiaMesPasado);
      break;

    case 'ultimos_7_dias':
      const hace7Dias = new Date(hoy);
      hace7Dias.setDate(hoy.getDate() - 7);
      fechaInicio = formatearFecha(hace7Dias);
      fechaFin = formatearFecha(hoy);
      break;

    case 'ultimos_30_dias':
      const hace30Dias = new Date(hoy);
      hace30Dias.setDate(hoy.getDate() - 30);
      fechaInicio = formatearFecha(hace30Dias);
      fechaFin = formatearFecha(hoy);
      break;

    default:
      return null;
  }

  return { fechaInicio, fechaFin };
};

/************************************************************************/
const filteredFacturas = computed(() => {
  let filteredData = data.value.filter(busqueda => {
    const fechaEmision = busqueda.fecha_emision;
    const fechaFiltrada = date.value ? formatearFecha(date.value) : null;

    const cumpleFecha = fechaFiltrada ? fechaEmision === fechaFiltrada : true;
    const cumpleBusqueda = searchQuery.value
      ? Object.values(busqueda).some(value =>
          String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      : true;
    const cumpleComprobante = selectedComprobante.value.value === ''
      ? true
      : busqueda.tipo_factura === selectedComprobante.value.value;

    const cumpleMetodoPago = selectedMetodoPago.value.value === ''
      ? true
      : busqueda.metodo_pago === selectedMetodoPago.value.value;

    return cumpleFecha && cumpleBusqueda && cumpleComprobante && cumpleMetodoPago;
  });

  // Aplicar filtro de rango de fechas predefinido
  if (selectedRangoFecha.value.value !== 'todas') {
    const rango = calcularRangoFechas(selectedRangoFecha.value.value);
    if (rango) {
      const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(rango.fechaInicio, false) + ' 00:00:01');
      const fechaFinTimeStamp = new Date(transformarFechaTimestamp(rango.fechaFin, false) + ' 23:59:59');

      filteredData = filteredData.filter(item => {
        const fechaUpdated = new Date(item.updated_at);
        return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
      });
    }
  }

  // Aplicar el filtro inteligente si existe una fecha seleccionada en el buscador inteligente
  if (buscadorFechaInteligente.value) {
    let fechaInicio, fechaFin;

    if (typeof buscadorFechaInteligente.value === 'string') {
      const fechas = buscadorFechaInteligente.value.split(' - ');
      fechaInicio = fechas[0] ? formatearFecha(fechas[0]) : null;
      fechaFin = fechas[1] ? formatearFecha(fechas[1]) : null;
    } else {
      fechaInicio = formatearFecha(buscadorFechaInteligente.value[0]);
      fechaFin = formatearFecha(buscadorFechaInteligente.value[1]);
    }

    if (fechaInicio && fechaFin) {
      const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(fechaInicio, false) + ' 00:00:01');
      const fechaFinTimeStamp = new Date(transformarFechaTimestamp(fechaFin, false) + ' 23:59:59');

      filteredData = filteredData.filter(item => {
        const fechaUpdated = new Date(item.updated_at);
        return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
      });

      fechaInteligente.value = filteredData.length > 0;
    }
  }

  return filteredData;
});

/************************************************************************/
const fnAwesomplete = ()=>{
}
const handleSelectComplete = async(selected)=>{
}
/************************************************************************/
const getRowClass = (data) => {
  if (data.estado_factura === 'Cobrado') {
    return 'cobrado';
  } else if (data.estado_factura === 'Pendiente') {
    return 'pendiente';
  }
  return '';
};
/************************************************************************/
const colorEstado = (data) => {
    switch (data.estado_factura) {
        case 'Cobrado':
            return 'success';
        case 'Pendiente':
            return 'warn'; // Amarillo
        case 'Devolucion':
            return 'contrast';
        default:
            return 'secondary'; // Gris por defecto
    }
};
/************************************************************************/
const calcularSubtotal = (producto) => {
  return producto.total;
};

const calcularTotal = computed(() => {
  return productosFactura.value.reduce((total, producto) => total + parseFloat(producto.total), 0);
});
/************************************************************************/
const onRowSelect = (selected) => {
router.push({ path: `/editarfacturas/${selected.data.id}` });
}
/************************************************************************/
/************************************************************************/
const fnImpresoraGrande = async()=>{
  visiblePrint.value = false

  if (!currentRowData.value?.no_factura) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar una factura para imprimir', life: 3000 });
    return
  }

  if (!facturaPdfPrintRef.value?.printFactura) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El componente FacturaPdfPrint no esta disponible', life: 3000 });
    return
  }

  const datosFactura = currentRowData.value
  let datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datosFactura.cod_cliente)
  if (Array.isArray(datosCliente)) datosCliente = datosCliente[0] || null

  let creditoData = null
  if (String(datosFactura?.metodo_pago || '').toUpperCase() === 'CREDITO') {
    const datosCxC = await peticionesFetchOffline('getDataByField', 'cuentas_cobrar', 'no_factura', datosFactura.no_factura)
    creditoData = Array.isArray(datosCxC) ? datosCxC[0] || null : datosCxC
  }

  await facturaPdfPrintRef.value.printFactura({
    factura: datosFactura,
    cliente: datosCliente,
    datosEmpresa: enviarDatosLocalStorage(),
    creditoData
  })

}

const fnImpresoraChica = async()=>{

  if(window.electron){

     const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());
         const datosFactura = currentRowData.value
         const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes','codigo',currentRowData.value.cod_cliente);

     const envio = await window.electron.ipcRenderer.invoke('ticket', JSON.stringify(datosFactura),JSON.stringify(datosCliente), datosEmpresa1);

  }else{
      router.push({ path: `/factura/${currentRowData.value.no_factura}` });
    }

}
/************************************************************************/
const mensajeComprobantes = ref({
  'NORMAL':'SIN COMPROBANTE',
  'B01':'COMPROBANTE CON VALOR FISCAL',
  'B02':'CONSUMIDOR FINAL',
  'B14':'REGIMEN ESPECIAL',
  'B15':'COMPROBANTE GUBERNAMENTAL',
})
/************************************************************************/

/************************************************************************/
const fnAplicarComprobante = async()=>{
    const comprobante = datoscamposComprobantes.value.nfc

  const url = link.value+api.value+"/actualizarcampos/confiscal";
  if (!comprobante) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }
  if (comprobante.hasOwnProperty('created_at')) {
    comprobante.updated_at = nfecha('timestamp');
  }

  const datosFactura = currentRowData.value;

  const urlFactura = link.value+api.value+"/actualizarcampos/facturas";
  if (!datosFactura) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

   if(datosFactura.tipo_factura != 'SIN COMPROBANTE'){
       toast.add({ severity: 'error', summary: 'Error', detail: 'Esta Factura ya tiene un Comprobante.', life: 3000 });
     return
   }

  if (datosFactura.hasOwnProperty('created_at')) {
      datosFactura.updated_at = nfecha('timestamp')
    }

  const tipoComprobante = mensajeComprobantes.value[comprobante.prefijo];

   if(!tipoComprobante){
    toast.add({ severity: 'error', summary: 'Error', detail: 'Este tipo de Comporbante de no se puede aplicar a esta Factura.', life: 3000 });
    return
   }
  const elComprobante = generadorCodigo(comprobante.contador, comprobante.prefijo, 8);

    let passwordCorrect = false;
    visibleComprobantes.value = false;
  while (!passwordCorrect) {
    const { value: password } = await Swal.fire({
      title: 'Ingrese la contraseña',
      input: 'password',
      inputLabel: 'Contraseña',
      inputPlaceholder: 'Ingrese la contraseña',
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      inputAttributes: {
        autocapitalize: 'off'
      },
      preConfirm: (password) => {
        if (!password) {
          Swal.showValidationMessage(`Por favor, ingrese la contraseña`);
        }
      }
    });

    if (password) {
      if (password === token.value || password === tokenCorto.value) {
        passwordCorrect = true;
      } else {
        toast.add({ severity: 'error', summary: 'Éxito', detail: 'Contraseña incorrecta', life: 3000 });
      }
    } else {
        return;
    }
  }


  datosFactura.tipo_factura = tipoComprobante;
  datosFactura.comprobante = elComprobante;

  const envioDatosFactura = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datosFactura));



  if (envioDatosFactura[0] == 'ok') {
     toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comprobante Aplicado con éxito', life: 3000 });
   comprobante.contador = (Number(comprobante.contador) + 1)
   comprobante.secuencia = elComprobante

  const envioDatos = await peticionesFetchOffline('updateData','confiscal', JSON.stringify(comprobante));

  if (envioDatos[0] == 'ok') {
    visibleComprobantes.value = false;
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
     currentRowData.value = ''
     await fetchAndSetupData()
  }else{
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }

}
/************************************************************************/
const fnEliminarComprobante = async () => {
    visibleComprobantes.value = false
    const datosFactura = currentRowData.value;
    if (!datosFactura || datosFactura.tipo_factura === 'SIN COMPROBANTE') {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Esta factura no contiene comprobante.', life: 3000 });
        return;
    }

    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Se eliminará el comprobante de la factura',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    const passwordResponse = await Swal.fire({
        title: 'Ingrese la contraseña',
        input: 'password',
        inputPlaceholder: 'Contraseña',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
    });

    if (!passwordResponse.value || (passwordResponse.value !== token.value && passwordResponse.value !== tokenCorto.value)) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        return;
    }

    datosFactura.tipo_factura = 'SIN COMPROBANTE';
    datosFactura.comprobante = 'SIN COMPROBANTE';

    const urlFactura = `${link.value}${api.value}/actualizarcampos/facturas`;
      const envioDatosFactura = await peticionesFetchOffline('updateData','facturas', JSON.stringify(datosFactura));
    if (envioDatosFactura[0] == 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Comprobante eliminado', life: 3000 });
        await fetchAndSetupData();
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el comprobante', life: 3000 });
    }
};



/************************************************************************/
const handleInteligenteSelect = (event) => {
  const selectedItem = event.item;
  buscadorFechaInteligente.value = selectedItem.value.fechainicio+' - '+selectedItem.value.fechafin
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
const fechaInteligenteSeleccionada = (fechas)=>{
    if(fechas){
        const fechainicio = formatearFecha(fechas[0])
        const fechafin = formatearFecha(fechas[1])
         if(fechainicio === null || fechafin === null || fechainicio ==='31/12/1969' || fechafin ==='31/12/1969'){
          toast.add({ severity: 'warn', summary: 'Error', detail: 'Seleccione ambas fechas', life: 3000 });
          return
         }

         const retorno = {fechainicio,fechafin}
         return retorno

    }

}
/************************************************************************/
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
/************************************************************************/
const fnExportarExcel = () => {
  const filteredData = filteredFacturas.value;

  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();

  // Convertir los datos filtrados a una hoja de cálculo
  const ws = XLSX.utils.json_to_sheet(filteredData);

  // Añadir la hoja de cálculo al libro de trabajo
  XLSX.utils.book_append_sheet(wb, ws, 'Facturas');

  // Generar el archivo Excel
  XLSX.writeFile(wb, 'Facturas.xlsx');
};
/************************************************************************/
const obtenerFacturasParaExportar = async () => {
  const response = await peticionesFetchOffline('getDataAsArrayLazy', 'facturas', {
    limit: 999999,
    offset: 0,
    search: String(searchQuery.value || '').trim(),
    searchFields: [
      'no_factura',
      'tipo_factura',
      'comprobante',
      'cod_cliente',
      'nombre_cliente',
      'telefono_cliente',
      'vendedor',
      'metodo_pago',
      'estado_factura',
      'canal_venta',
      'nota',
      'usuario',
      'total'
    ],
    orderBy: 'id',
    orderDir: 'DESC',
    filtroCampo: 'almacen',
    filtroValor: datosEmpresa.empresa.nombre
  });

  let facturasExportar = Array.isArray(response?.data) ? response.data : [];

  if (date.value) {
    const fechaFiltrada = formatearFecha(date.value);
    facturasExportar = facturasExportar.filter(f => f.fecha_emision === fechaFiltrada);
  }

  if (selectedComprobante.value.value !== '') {
    facturasExportar = facturasExportar.filter(f => f.tipo_factura === selectedComprobante.value.value);
  }

  if (selectedMetodoPago.value.value !== '') {
    facturasExportar = facturasExportar.filter(f => f.metodo_pago === selectedMetodoPago.value.value);
  }

  if (selectedRangoFecha.value.value !== 'todas') {
    const rango = calcularRangoFechas(selectedRangoFecha.value.value);
    if (rango) {
      const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(rango.fechaInicio, false) + ' 00:00:01');
      const fechaFinTimeStamp = new Date(transformarFechaTimestamp(rango.fechaFin, false) + ' 23:59:59');

      facturasExportar = facturasExportar.filter(item => {
        const fechaUpdated = new Date(item.updated_at);
        return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
      });
    }
  }

  if (buscadorFechaInteligente.value) {
    let fechaInicio, fechaFin;

    if (typeof buscadorFechaInteligente.value === 'string') {
      const fechas = buscadorFechaInteligente.value.split(' - ');
      fechaInicio = fechas[0] ? formatearFecha(fechas[0]) : null;
      fechaFin = fechas[1] ? formatearFecha(fechas[1]) : null;
    } else {
      fechaInicio = formatearFecha(buscadorFechaInteligente.value[0]);
      fechaFin = formatearFecha(buscadorFechaInteligente.value[1]);
    }

    if (fechaInicio && fechaFin) {
      const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(fechaInicio, false) + ' 00:00:01');
      const fechaFinTimeStamp = new Date(transformarFechaTimestamp(fechaFin, false) + ' 23:59:59');

      facturasExportar = facturasExportar.filter(item => {
        const fechaUpdated = new Date(item.updated_at);
        return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
      });
    }
  }

  return facturasExportar;
};
/************************************************************************/
const fnExportarExcelCompleto = async () => {
  try {
    facturasBuscando.value = true;
    const facturasExportar = await obtenerFacturasParaExportar();

    if (!facturasExportar.length) {
      toast.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'No hay facturas para exportar',
        life: 3000
      });
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(facturasExportar);
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas');
    XLSX.writeFile(wb, 'Facturas.xlsx');
  } finally {
    facturasBuscando.value = false;
  }
};
/************************************************************************/
const fnExportarPDFSeleccionados = async () => {
  try {
    // Mostrar indicador de carga
    facturasBuscando.value = true;

    // Obtener TODOS los datos filtrados (sin límite de paginación)
    const response = await peticionesFetchOffline('getDataAsArrayLazy', 'facturas', {
      limit: 999999, // Sin límite para obtener todos los registros
      offset: 0,
      search: String(searchQuery.value || '').trim(),
      searchFields: [
        'no_factura',
        'tipo_factura',
        'comprobante',
        'cod_cliente',
        'nombre_cliente',
        'telefono_cliente',
        'vendedor',
        'metodo_pago',
        'estado_factura',
        'canal_venta',
        'nota',
        'usuario',
        'total'
      ],
      orderBy: 'id',
      orderDir: 'DESC',
      filtroCampo: 'almacen',
      filtroValor: datosEmpresa.empresa.nombre
    });

    let facturasExportar = Array.isArray(response?.data) ? response.data : [];

    // Aplicar filtros adicionales (fecha, comprobante, etc.)
    if (date.value) {
      const fechaFiltrada = formatearFecha(date.value);
      facturasExportar = facturasExportar.filter(f => f.fecha_emision === fechaFiltrada);
    }

    if (selectedComprobante.value.value !== '') {
      facturasExportar = facturasExportar.filter(f => f.tipo_factura === selectedComprobante.value.value);
    }

    if (selectedMetodoPago.value.value !== '') {
      facturasExportar = facturasExportar.filter(f => f.metodo_pago === selectedMetodoPago.value.value);
    }

    // Aplicar filtro de rango de fechas predefinido
    if (selectedRangoFecha.value.value !== 'todas') {
      const rango = calcularRangoFechas(selectedRangoFecha.value.value);
      if (rango) {
        const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(rango.fechaInicio, false) + ' 00:00:01');
        const fechaFinTimeStamp = new Date(transformarFechaTimestamp(rango.fechaFin, false) + ' 23:59:59');

        facturasExportar = facturasExportar.filter(item => {
          const fechaUpdated = new Date(item.updated_at);
          return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
        });
      }
    }

    // Aplicar filtro de rango de fechas inteligente
    if (buscadorFechaInteligente.value) {
      let fechaInicio, fechaFin;

      if (typeof buscadorFechaInteligente.value === 'string') {
        const fechas = buscadorFechaInteligente.value.split(' - ');
        fechaInicio = fechas[0] ? formatearFecha(fechas[0]) : null;
        fechaFin = fechas[1] ? formatearFecha(fechas[1]) : null;
      } else {
        fechaInicio = formatearFecha(buscadorFechaInteligente.value[0]);
        fechaFin = formatearFecha(buscadorFechaInteligente.value[1]);
      }

      if (fechaInicio && fechaFin) {
        const fechaInicioTimeStamp = new Date(transformarFechaTimestamp(fechaInicio, false) + ' 00:00:01');
        const fechaFinTimeStamp = new Date(transformarFechaTimestamp(fechaFin, false) + ' 23:59:59');

        facturasExportar = facturasExportar.filter(item => {
          const fechaUpdated = new Date(item.updated_at);
          return fechaUpdated >= fechaInicioTimeStamp && fechaUpdated <= fechaFinTimeStamp;
        });
      }
    }

    facturasBuscando.value = false;

    if (!facturasExportar || facturasExportar.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'No hay facturas para exportar',
        life: 3000
      });
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // Orientación horizontal
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Facturas', pageWidth / 2, 15, { align: 'center' });

    // Información general
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${nfecha('fecha')}`, 14, 25);
    doc.text(`Total de facturas: ${facturasExportar.length}`, 14, 30);

    // Calcular totales
    const totalGeneral = facturasExportar.reduce((sum, f) => sum + Number(f.total || 0), 0);
    const gananciaTotal = facturasExportar.reduce((sum, f) => sum + Number(f.ganancia || 0), 0);

    doc.text(`Total general: ${formatoMonedaRD(totalGeneral)}`, 14, 35);
    doc.text(`Ganancia total: ${formatoMonedaRD(gananciaTotal)}`, 14, 40);

    // Preparar datos para la tabla
    const tableData = facturasExportar.map(factura => [
      factura.no_factura || '',
      factura.fecha_emision || '',
      factura.nombre_cliente || '',
      factura.tipo_factura || '',
      factura.comprobante || '',
      factura.metodo_pago || '',
      formatoMonedaRD(factura.total || 0),
      formatoMonedaRD(factura.ganancia || 0),
      factura.estado_factura || '',
      factura.vendedor || ''
    ]);

    // Crear tabla
    doc.autoTable({
      startY: 45,
      head: [['No. Factura', 'Fecha', 'Cliente', 'Tipo', 'Comprobante', 'Método Pago', 'Total', 'Ganancia', 'Estado', 'Vendedor']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249]
      },
      margin: { top: 45, left: 14, right: 14 },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: { cellWidth: 22 }, // No. Factura
        1: { cellWidth: 22 }, // Fecha
        2: { cellWidth: 40 }, // Cliente
        3: { cellWidth: 25 }, // Tipo
        4: { cellWidth: 30 }, // Comprobante
        5: { cellWidth: 20 }, // Método Pago
        6: { cellWidth: 20, halign: 'right' }, // Total
        7: { cellWidth: 20, halign: 'right' }, // Ganancia
        8: { cellWidth: 18 }, // Estado
        9: { cellWidth: 25 }  // Vendedor
      },
      didDrawPage: (data) => {
        // Footer
        const footerY = pageHeight - 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${data.pageNumber} de ${doc.internal.getNumberOfPages()}`,
          pageWidth / 2,
          footerY,
          { align: 'center' }
        );
      }
    });

    // Generar PDF como data URI
    const pdfDataUri = doc.output('datauristring');

    // Mostrar PDF embebido en SweetAlert2
    Swal.fire({
      title: `Reporte de Facturas (${facturasExportar.length})`,
      html: `
        <div style="margin-top: 20px;">
          <iframe
            src="${pdfDataUri}"
            style="width: 100%; height: 70vh; border: none; border-radius: 8px;"
            type="application/pdf">
          </iframe>
        </div>
      `,
      width: '90%',
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar PDF',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'swal-pdf-popup',
        confirmButton: 'swal-pdf-confirm',
        cancelButton: 'swal-pdf-cancel'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Descargar el PDF
        doc.save(`Reporte_Facturas_${nfecha('fecha')}.pdf`);
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'PDF descargado correctamente',
          life: 3000
        });
      }
    });

  } catch (error) {
    console.error('Error al generar PDF:', error);
    facturasBuscando.value = false;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo generar el PDF',
      life: 3000
    });
  }
};
/************************************************************************/
// Stats Computation
const statsData = computed(() => {
  const facturas = filteredFacturas.value;
  const total = facturas.length;
  const totalVentas = facturas.reduce((sum, f) => sum + Number(f.total || 0), 0);
  const cobradas = facturas.filter(f => f.estado_factura === 'Cobrado').length;
  const pendientes = facturas.filter(f => f.estado_factura === 'Pendiente').length;
  const efectivo = facturas.reduce((sum, f) => sum + Number(f.efectivo || 0), 0);
  const tarjeta = facturas.reduce((sum, f) => sum + Number(f.tarjeta || 0), 0);
  const transferencia = facturas.reduce((sum, f) => sum + Number(f.transferencia || 0), 0);
  const gananciaTotal = facturas.reduce((sum, f) => sum + Number(f.ganancia || 0), 0);

  return {
    total,
    totalVentas: totalVentas.toFixed(2),
    cobradas,
    pendientes,
    efectivo: efectivo.toFixed(2),
    tarjeta: tarjeta.toFixed(2),
    transferencia: transferencia.toFixed(2),
    gananciaTotal: gananciaTotal.toFixed(2)
  };
});
</script>
<template>
<main class="content-wrapper facturas-container">
  <div class="w-full px-4 mt-5">

    <!-- Modern Header -->
    <div class="facturas-header">
      <div class="facturas-header-content">
        <div class="facturas-icon-wrapper">
          <i class="pi pi-file facturas-icon"></i>
        </div>
        <div>
          <h1 class="facturas-title">Gestión de Facturas</h1>
          <p class="facturas-subtitle">Administra tus facturas y ventas</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="facturas-stats-grid">
      <Card class="facturas-stat-card facturas-stat-total">
        <template #content>
          <div class="facturas-stat-content">
            <div>
              <p class="facturas-stat-label">Total Facturas</p>
              <p class="facturas-stat-value">{{ statsData.total }}</p>
            </div>
            <div class="facturas-stat-icon-circle facturas-stat-icon-total">
              <i class="pi pi-file"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="facturas-stat-card facturas-stat-cobradas">
        <template #content>
          <div class="facturas-stat-content">
            <div>
              <p class="facturas-stat-label">Cobradas</p>
              <p class="facturas-stat-value">{{ statsData.cobradas }}</p>
            </div>
            <div class="facturas-stat-icon-circle facturas-stat-icon-cobradas">
              <i class="pi pi-check-circle"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="facturas-stat-card facturas-stat-pendientes">
        <template #content>
          <div class="facturas-stat-content">
            <div>
              <p class="facturas-stat-label">Pendientes</p>
              <p class="facturas-stat-value">{{ statsData.pendientes }}</p>
            </div>
            <div class="facturas-stat-icon-circle facturas-stat-icon-pendientes">
              <i class="pi pi-clock"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="facturas-stat-card facturas-stat-ventas">
        <template #content>
          <div class="facturas-stat-content">
            <div>
              <p class="facturas-stat-label">Total Ventas</p>
              <p class="facturas-stat-value">${{ statsData.totalVentas }}</p>
            </div>
            <div class="facturas-stat-icon-circle facturas-stat-icon-ventas">
              <i class="pi pi-dollar"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card class="facturas-stat-card facturas-stat-ganancia">
        <template #content>
          <div class="facturas-stat-content">
            <div>
              <p class="facturas-stat-label">Ganancia Total</p>
              <p class="facturas-stat-value">${{ statsData.gananciaTotal }}</p>
            </div>
            <div class="facturas-stat-icon-circle facturas-stat-icon-ganancia">
              <i class="pi pi-chart-line"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Section Divider -->
    <div class="facturas-section-divider">
      <div class="facturas-divider-line"></div>
      <div class="facturas-divider-content">
        <i class="pi pi-filter"></i>
        <span>Acciones y Filtros</span>
      </div>
      <div class="facturas-divider-line"></div>
    </div>

    <!-- Actions Card -->
    <Card class="facturas-actions-card">
      <template #content>
        <div class="facturas-actions-grid">
          <Button icon="pi pi-refresh" label="Recargar" severity="warning" @click="fetchAndSetupData" />
          <Button icon="pi pi-filter-slash" label="Limpiar Filtros" severity="secondary" @click="limpiarFiltros" />
          <router-link to="/vender">
            <Button icon="pi pi-plus" label="Nueva Factura" severity="success" />
          </router-link>
          <Button
            v-if="selectedItems.length > 0"
            icon="pi pi-users"
            label="Asignar Vendedor/Cajero"
            severity="info"
            @click="abrirAsignacionMasiva"
          />
          <Button icon="pi pi-trash" label="Borrar Selección" severity="danger" @click="borrarSeleccionados" />
          <Button icon="pi pi-file-excel" label="Exportar Excel" severity="success" @click="fnExportarExcelCompleto" />
          <Button
            icon="pi pi-file-pdf"
            label="Ver PDF"
            severity="help"
            @click="fnExportarPDFSeleccionados"
          />
          <Button v-if="usuarioLocal.usuario == 'Soporte'" icon="pi pi-trash" label="Borrar Todo" severity="danger" @click="borrarTodo" />
        </div>
      </template>
    </Card>

    <!-- Filters Card -->
    <Card class="facturas-filters-card">
      <template #content>
        <div class="facturas-filters-grid">
          <div class="facturas-filter-group">
            <label class="facturas-filter-label">Fecha</label>
            <InputGroup>
              <Calendar v-model="date" dateFormat="yy-mm-dd" showButtonBar placeholder="Seleccionar fecha" class="facturas-filter-input" />
              <Button icon="pi pi-times" severity="secondary" @click="clearDate" />
            </InputGroup>
          </div>

          <div class="facturas-filter-group">
            <label class="facturas-filter-label">Rango Predefinido</label>
            <Dropdown v-model="selectedRangoFecha" :options="rangoFechaOptions" optionLabel="label" placeholder="Seleccionar rango" class="facturas-filter-input" />
          </div>

          <div class="facturas-filter-group">
            <label class="facturas-filter-label">Rango Personalizado</label>
            <InputGroup>
              <DatePicker dateFormat="yy-mm-dd" selectionMode="range" :showButtonBar="true" @value-change="fechaInteligenteSeleccionada" v-model="buscadorFechaInteligente" class="facturas-filter-input" />
              <Button icon="pi pi-search" severity="secondary" @click="toggleInteligente" />
            </InputGroup>
            <Menu ref="menuInteligente" :model="itemsInteligente" popup class="!min-w-fit" />
          </div>

          <div class="facturas-filter-group">
            <label class="facturas-filter-label">Comprobante</label>
            <Dropdown v-model="selectedComprobante" :options="comprobantesOptions" optionLabel="label" placeholder="Filtrar" class="facturas-filter-input" />
          </div>

          <div class="facturas-filter-group">
            <label class="facturas-filter-label">Método de Pago</label>
            <Dropdown v-model="selectedMetodoPago" :options="metodoPagoOptions" optionLabel="label" placeholder="Filtrar por método" class="facturas-filter-input" />
          </div>

          <div class="facturas-filter-group">
            <label class="facturas-filter-label">Buscar</label>
            <InputText v-model="searchQuery" placeholder="Buscar facturas..." class="facturas-filter-input" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Section Divider -->
    <div class="facturas-section-divider">
      <div class="facturas-divider-line"></div>
      <div class="facturas-divider-content">
        <i class="pi pi-list"></i>
        <span>Lista de Facturas</span>
      </div>
      <div class="facturas-divider-line"></div>
    </div>

    <!-- DataTable -->
    <Card class="facturas-table-card">
      <template #content>
        <DataTable
          :value="filteredFacturas"
          lazy
          :loading="facturasBuscando"
          :totalRecords="totalRecords"
          :first="first"
          scrollable
          scrollHeight="600px"
          dataKey="id"
          paginator
          :rows="rows"
          size="small"
          resizableColumns
          columnResizeMode="fit"
          :rowClass="getRowClass"
          @page="onPage"
          @rowSelect="onRowSelect"
          v-model:selection="selectedItems"
          selectionMode="single"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          tableStyle="min-width: 50rem">
          <Column selectionMode="multiple" headerStyle="width: 3rem">
            <template #body="{ data }">
              <div @click.stop>
                <Checkbox v-model="selectedItems" :value="data" />
              </div>
            </template>
          </Column>
          <Column header="Opciones">
            <template #body="slotProps">
              <Button icon="pi pi-cog" @click="toggleFacturas($event, slotProps.data)" aria-haspopup="true" aria-controls="overlay_menu_factura" />
              <Menu ref="menu" id="overlay_menu_Facturas" :model="itemsFacturas" :popup="true" />
            </template>
          </Column>

          <Column field="estado_factura" header="Estado">
            <template #body="slotProps">
              <Badge :value="slotProps.data.estado_factura" :severity="colorEstado(slotProps.data)" />
            </template>
          </Column>

          <Column field="fecha_emision" header="Fecha"></Column>
          <Column field="no_factura" header="No. Factura"></Column>
          <Column field="tipo_factura" header="Tipo"></Column>
          <Column field="comprobante" header="Comprobante"></Column>
          <Column field="cod_cliente" header="Código"></Column>
          <Column field="nombre_cliente" header="Cliente"></Column>
          <Column field="metodo_pago" header="Método Pago"></Column>

          <Column field="total" header="Total">
            <template #body="slotProps">
              <Badge :value="slotProps.data.total" severity="warn" />
            </template>
          </Column>

          <Column field="tarjeta" header="Tarjeta"></Column>
          <Column field="transferencia" header="Transferencia"></Column>
          <Column field="efectivo" header="Efectivo"></Column>
          <Column field="vendedor" header="Vendedor"></Column>
          <Column field="canal_venta" header="Canal"></Column>
          <Column field="impuesto" header="Impuesto"></Column>
          <Column field="descuento" header="Descuento"></Column>
          <Column field="subtotal" header="Subtotal"></Column>
          <Column field="ganancia" header="Ganancia"></Column>
        </DataTable>
      </template>
    </Card>
  </div>

<Toast />

<!-- Productos Dialog -->
<Dialog v-model:visible="visibleProductos" :position="position" modal header="Productos de la Factura" :style="{ width: '50rem' }">
  <div class="facturas-productos-dialog">
    <table class="facturas-productos-table">
      <thead>
        <tr>
          <th>Cantidad</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Impuestos</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="producto in productosFactura" :key="producto.codigo">
          <td>{{ producto.cantidad }}</td>
          <td>{{ producto.nombre }}</td>
          <td>{{ producto.precio }}</td>
          <td>{{ producto.impuesto }}</td>
          <td>{{ calcularSubtotal(producto) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="facturas-productos-total">
      <strong>Total: ${{ calcularTotal }}</strong>
    </div>
  </div>
  <template #footer>
    <Button label="Cerrar" severity="secondary" @click="visibleProductos = false" />
  </template>
</Dialog>

<!-- Print Dialog -->
<Dialog v-model:visible="visiblePrint" :position="position" modal header="Opciones de Impresión" :style="{ width: '30rem' }">
  <div class="flex flex-wrap gap-4 justify-center p-4">
    <Button label="Impresora Grande" icon="pi pi-print" @click="fnImpresoraGrande" iconPos="bottom" severity="info" />
    <Button label="Impresora Térmica" icon="pi pi-print" @click="fnImpresoraChica" iconPos="bottom" severity="success" />
  </div>
  <template #footer>
    <Button label="Cerrar" severity="secondary" @click="visiblePrint = false" />
  </template>
</Dialog>

<Dialog v-model:visible="visibleAsignacionMasiva" position="top" modal :style="{ width: '34rem' }" header="Asignar Vendedor y Cajero">
  <div class="p-4 space-y-4">
    <p class="text-sm text-gray-600">
      Facturas seleccionadas: <strong>{{ selectedItems.length }}</strong>
    </p>

    <div>
      <label class="facturas-filter-label">Vendedor</label>
      <Dropdown
        v-model="asignacionMasiva.vendedor"
        :options="usuariosData"
        optionLabel="nombre"
        placeholder="Seleccionar vendedor"
        class="w-full mt-2"
        showClear
      />
    </div>

    <div>
      <label class="facturas-filter-label">Cajero</label>
      <Dropdown
        v-model="asignacionMasiva.cajero"
        :options="usuariosData"
        optionLabel="nombre"
        placeholder="Seleccionar cajero"
        class="w-full mt-2"
        showClear
      />
    </div>
  </div>
  <template #footer>
    <Button label="Cancelar" severity="secondary" outlined @click="visibleAsignacionMasiva = false" />
    <Button label="Aplicar" severity="success" icon="pi pi-check" @click="aplicarAsignacionMasiva" />
  </template>
</Dialog>

<FacturaPdfPrint ref="facturaPdfPrintRef" />

<!-- Comprobantes Dialog -->
<Dialog v-model:visible="visibleComprobantes" position="top" modal :style="{ width: '30rem' }" header="Comprobantes">
  <div class="p-4">
    <label class="facturas-filter-label">Seleccionar Comprobante</label>
    <Dropdown v-model="datoscamposComprobantes.nfc" :options="confiscalData" optionLabel="nombre" placeholder="Seleccione" class="w-full mt-2" />
  </div>
  <template #footer>
    <Button label="Aplicar" severity="success" @click="fnAplicarComprobante" />
    <Button label="Eliminar" severity="danger" @click="fnEliminarComprobante" />
    <Button label="Cerrar" severity="secondary" @click="visibleComprobantes = false" />
  </template>
</Dialog>

<!-- WhatsApp Component -->
<EnviarWhatsApp ref="enviarWhatsAppRef" :initialDatosWhatsApp="datosWhatsApp" />

</main>
</template>
<style scoped>
/* ===================================
   🎨 FACTURAS - MODERN STYLING
   =================================== */

/* Header */
.facturas-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
  animation: slideIn 0.6s ease-out;
}

.facturas-header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.facturas-icon-wrapper {
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

.facturas-icon {
  font-size: 2.5rem;
  color: white;
}

.facturas-title {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.facturas-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0.25rem 0 0 0;
}

/* Stats Grid */
.facturas-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.facturas-stat-card {
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.facturas-stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.facturas-stat-total { border-color: #d1fae5; background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
.facturas-stat-cobradas { border-color: #d1fae5; background: linear-gradient(135deg, #d1fae5, #6ee7b7); }
.facturas-stat-pendientes { border-color: #fed7aa; background: linear-gradient(135deg, #fed7aa, #fdba74); }
.facturas-stat-ventas { border-color: #ddd6fe; background: linear-gradient(135deg, #ddd6fe, #c4b5fd); }
.facturas-stat-ganancia { border-color: #fecaca; background: linear-gradient(135deg, #fecaca, #fca5a5); }

.facturas-stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.facturas-stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.facturas-stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.facturas-stat-icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.facturas-stat-icon-total { background: linear-gradient(135deg, #10b981, #059669); }
.facturas-stat-icon-cobradas { background: linear-gradient(135deg, #10b981, #047857); }
.facturas-stat-icon-pendientes { background: linear-gradient(135deg, #f59e0b, #d97706); }
.facturas-stat-icon-ventas { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.facturas-stat-icon-ganancia { background: linear-gradient(135deg, #ef4444, #dc2626); }

/* Section Divider */
.facturas-section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1.5rem 0;
}

.facturas-divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #10b981, transparent);
}

.facturas-divider-content {
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

/* Actions Card */
.facturas-actions-card {
  margin-bottom: 1.5rem;
  border-radius: 16px;
  border: 2px solid #d1fae5;
}

.facturas-actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Filters Card */
.facturas-filters-card {
  margin-bottom: 1.5rem;
  border-radius: 16px;
  border: 2px solid #d1fae5;
}

.facturas-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.facturas-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.facturas-filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.facturas-filter-input {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.facturas-filter-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Table Card */
.facturas-table-card {
  border-radius: 16px;
  border: 2px solid #d1fae5;
}

/* Row Colors */
.pendiente {
  color: #DC3545 !important;
}

.cobrado {
  color: #28A745 !important;
}

/* Productos Dialog */
.facturas-productos-dialog {
  padding: 1rem;
}

.facturas-productos-table {
  width: 100%;
  border-collapse: collapse;
}

.facturas-productos-table th,
.facturas-productos-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.facturas-productos-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  font-size: 0.875rem;
}

.facturas-productos-total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #10b981;
  text-align: right;
  font-size: 1.125rem;
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
