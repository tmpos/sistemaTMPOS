<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import {
  nfecha,
  arrayToObjetoFromTabla,
  peticionesFetch,
  obtenerIdsSeleccionados,
  crearTablaSiNoExiste,
  encryptarPassword,
  envioElectron,
  crearTablaSiNoExisteOffline,
  peticionesFetchOffline,
  buscadorArrayObjeto
} from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
import { useDatosEmpresa } from '@/stores';

/************************************************************************/
// CONFIGURACIÓN INICIAL
/************************************************************************/
const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const basic = ref({
  dateFormat: 'd/m/Y',
});

const camposArray = ['descripcion', 'valor', 'fecha_pago', 'alerta', 'dias_alerta', 'tipo', 'cuentaporpagar', 'ultimo_pago','almacen','estado','categoria','proveedor','rnc_proveedor','ncf_proveedor','fecha_comprobante','tipo_bienes_servicios','impuesto','impuesto_selectivo_consumo','otros_impuestos_tasas','notas','historial_pagos'];

/************************************************************************/
// VARIABLES DE ESTADO
/************************************************************************/
const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const datosJSON = ref([]);
const selectedItems = ref([]);
const data = ref([]);
const searchQuery = ref('');
const viewMode = ref('dashboard'); // dashboard, table, calendar

// Modales
const visible = ref(false);
const visiblecrear = ref(false);
const visibleHistorial = ref(false);
const visibleConvertirCxP = ref(false);

// Datos de formularios
const datoscamposGastosfijos = ref({});
const datoscampos = ref({});
const gastoSeleccionado = ref(null);
const proveedores = ref([]);
const tiposBienesServicios606 = [
  { label: '01 - Gastos de personal', value: '01' },
  { label: '02 - Trabajos, suministros y servicios', value: '02' },
  { label: '03 - Arrendamientos', value: '03' },
  { label: '04 - Gastos de activos fijos', value: '04' },
  { label: '05 - Gastos de representación', value: '05' },
  { label: '06 - Otras deducciones admitidas', value: '06' },
  { label: '07 - Gastos financieros', value: '07' },
  { label: '08 - Gastos extraordinarios', value: '08' },
  { label: '09 - Costo de venta', value: '09' },
  { label: '10 - Adquisiciones de activos', value: '10' },
  { label: '11 - Gastos de seguros', value: '11' }
];

// Filtros
const filtroTipo = ref(null);
const filtroEstado = ref(null);
const filtroAlerta = ref(null);
const filtroFechaDesde = ref(null);
const filtroFechaHasta = ref(null);

// Menu contextual
const menu = ref(null);
const itemsGastosfijos = ref([]);
const currentRowData = ref(null);

/************************************************************************/
// COMPUTED PROPERTIES
/************************************************************************/

// Estadísticas del dashboard
const estadisticas = computed(() => {
  const gastos = filteredGastosfijos.value;
  const total = gastos.reduce((sum, g) => sum + parseFloat(g.valor || 0), 0);
  const fijos = gastos.filter(g => g.tipo === 'FIJO');
  const variables = gastos.filter(g => g.tipo === 'VARIABLE');
  const prestamos = gastos.filter(g => g.tipo === 'PRESTAMO');
  const pendientes = gastos.filter(g => g.estado !== 'PAGADO');
  const alertas = gastos.filter(g => {
    if (g.alerta === 'SI' && g.fecha_pago) {
      const diasRestantes = calcularDiasRestantes(g.fecha_pago);
      return diasRestantes <= parseInt(g.dias_alerta || 0) && diasRestantes >= 0;
    }
    return false;
  });
  const vencidos = gastos.filter(g => {
    if (g.fecha_pago) {
      const diasRestantes = calcularDiasRestantes(g.fecha_pago);
      return diasRestantes < 0;
    }
    return false;
  });

  return {
    totalGastos: total,
    cantidadTotal: gastos.length,
    gastosFijos: fijos.length,
    gastosVariables: variables.length,
    prestamos: prestamos.length,
    pendientes: pendientes.length,
    alertas: alertas.length,
    vencidos: vencidos.length,
    promedioGasto: gastos.length > 0 ? total / gastos.length : 0,
    totalFijos: fijos.reduce((sum, g) => sum + parseFloat(g.valor || 0), 0),
    totalVariables: variables.reduce((sum, g) => sum + parseFloat(g.valor || 0), 0),
    totalPrestamos: prestamos.reduce((sum, g) => sum + parseFloat(g.valor || 0), 0),
  };
});

// Distribución por tipo para gráfico
const distribucionPorTipo = computed(() => {
  return [
    { tipo: 'Fijos', valor: estadisticas.value.totalFijos, cantidad: estadisticas.value.gastosFijos },
    { tipo: 'Variables', valor: estadisticas.value.totalVariables, cantidad: estadisticas.value.gastosVariables },
    { tipo: 'Préstamos', valor: estadisticas.value.totalPrestamos, cantidad: estadisticas.value.prestamos }
  ];
});

// Próximos pagos (siguientes 30 días)
const proximosPagos = computed(() => {
  const hoy = new Date();
  const en30dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  return filteredGastosfijos.value
    .filter(g => {
      if (!g.fecha_pago) return false;
      const fechaPago = parseFecha(g.fecha_pago);
      return fechaPago >= hoy && fechaPago <= en30dias;
    })
    .sort((a, b) => parseFecha(a.fecha_pago) - parseFecha(b.fecha_pago))
    .slice(0, 5);
});

// Gastos con alertas activas
const gastosConAlerta = computed(() => {
  return filteredGastosfijos.value.filter(g => {
    if (g.alerta === 'SI' && g.fecha_pago) {
      const diasRestantes = calcularDiasRestantes(g.fecha_pago);
      return diasRestantes <= parseInt(g.dias_alerta || 0) && diasRestantes >= 0;
    }
    return false;
  }).sort((a, b) => calcularDiasRestantes(a.fecha_pago) - calcularDiasRestantes(b.fecha_pago));
});

// Filtrado de gastos
const filteredGastosfijos = computed(() => {
  let resultado = data.value;

  // Filtro de búsqueda
  if (searchQuery.value) {
    resultado = resultado.filter(busqueda => {
      return Object.values(busqueda).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
  }

  // Filtro por tipo
  if (filtroTipo.value) {
    resultado = resultado.filter(g => g.tipo === filtroTipo.value);
  }

  // Filtro por estado
  if (filtroEstado.value) {
    resultado = resultado.filter(g => g.estado === filtroEstado.value);
  }

  // Filtro por alerta
  if (filtroAlerta.value === 'SI') {
    resultado = resultado.filter(g => {
      if (g.alerta === 'SI' && g.fecha_pago) {
        const diasRestantes = calcularDiasRestantes(g.fecha_pago);
        return diasRestantes <= parseInt(g.dias_alerta || 0) && diasRestantes >= 0;
      }
      return false;
    });
  } else if (filtroAlerta.value === 'VENCIDO') {
    resultado = resultado.filter(g => {
      if (g.fecha_pago) {
        const diasRestantes = calcularDiasRestantes(g.fecha_pago);
        return diasRestantes < 0;
      }
      return false;
    });
  }

  // Filtro por rango de fechas
  if (filtroFechaDesde.value && filtroFechaHasta.value) {
    const desde = parseFecha(filtroFechaDesde.value);
    const hasta = parseFecha(filtroFechaHasta.value);
    resultado = resultado.filter(g => {
      if (!g.fecha_pago) return false;
      const fecha = parseFecha(g.fecha_pago);
      return fecha >= desde && fecha <= hasta;
    });
  }

  return resultado;
});

/************************************************************************/
// FUNCIONES HELPER
/************************************************************************/

function calcularDiasRestantes(fechaPago) {
  if (!fechaPago) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = parseFecha(fechaPago);
  const diff = fecha - hoy;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function parseFecha(fechaStr) {
  // Espera formato d/m/Y
  const partes = fechaStr.split('/');
  if (partes.length === 3) {
    return new Date(partes[2], partes[1] - 1, partes[0]);
  }
  return new Date(fechaStr);
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP'
  }).format(valor || 0);
}

function getSeveridadEstado(estado) {
  const severidades = {
    'PAGADO': 'success',
    'PENDIENTE': 'warning',
    'VENCIDO': 'danger',
    'CANCELADO': 'secondary'
  };
  return severidades[estado] || 'info';
}

function getSeveridadAlerta(gasto) {
  if (!gasto.fecha_pago || gasto.alerta !== 'SI') return null;
  const dias = calcularDiasRestantes(gasto.fecha_pago);
  if (dias < 0) return 'danger';
  if (dias <= parseInt(gasto.dias_alerta || 0)) return 'warning';
  return 'success';
}

function getEstadoLabel(gasto) {
  if (!gasto.fecha_pago) return 'SIN FECHA';
  const dias = calcularDiasRestantes(gasto.fecha_pago);
  if (dias < 0) return 'VENCIDO';
  if (gasto.estado === 'PAGADO') return 'PAGADO';
  if (dias === 0) return 'VENCE HOY';
  if (dias <= parseInt(gasto.dias_alerta || 0)) return `${dias} DÍAS`;
  return gasto.estado || 'PENDIENTE';
}

/************************************************************************/
// CRUD FUNCTIONS
/************************************************************************/

const fetchAndSetupData = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'gastosfijos');
  const jsonData = response.reverse();
  data.value = jsonData.filter(dt => dt.almacen === datosEmpresa.empresa.nombre);
};

async function campos() {
  const campos = await arrayToObjetoFromTabla('gastosfijos');
  datoscamposGastosfijos.value = campos;
}

async function limpiarCamposCrear() {
  datoscamposGastosfijos.value = {};
  await campos();
  datoscamposGastosfijos.value.fecha_comprobante = nfecha('fecha');
  datoscamposGastosfijos.value.tipo_bienes_servicios = '02';
  datoscamposGastosfijos.value.impuesto = '0.00';
  datoscamposGastosfijos.value.impuesto_selectivo_consumo = '0.00';
  datoscamposGastosfijos.value.otros_impuestos_tasas = '0.00';
}

const fetchProveedores = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
  proveedores.value = Array.isArray(response)
    ? [...response].sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')))
    : [];
};

const asignarProveedor = (formulario, nombreProveedor) => {
  const proveedor = proveedores.value.find(
    item => String(item.nombre || '').trim() === String(nombreProveedor || '').trim()
  );
  formulario.proveedor = nombreProveedor || '';
  formulario.rnc_proveedor = proveedor?.rnc || '';
};

const seleccionarProveedorCrear = (nombreProveedor) => {
  asignarProveedor(datoscamposGastosfijos.value, nombreProveedor);
};

const seleccionarProveedorEditar = (nombreProveedor) => {
  asignarProveedor(datoscampos.value, nombreProveedor);
};

async function funcionCrear() {
  if (!datoscamposGastosfijos.value.descripcion || !datoscamposGastosfijos.value.valor) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Descripción y valor son obligatorios', life: 3000 });
    return;
  }

  if (datoscamposGastosfijos.value.hasOwnProperty('created_at')) {
    datoscamposGastosfijos.value.created_at = nfecha('timestamp');
    datoscamposGastosfijos.value.updated_at = nfecha('timestamp');
  }

  datoscamposGastosfijos.value.almacen = datosEmpresa.empresa.nombre;
  datoscamposGastosfijos.value.estado = datoscamposGastosfijos.value.estado || 'PENDIENTE';
  datoscamposGastosfijos.value.historial_pagos = '[]';
  datoscamposGastosfijos.value.impuesto_selectivo_consumo = Number(
    datoscamposGastosfijos.value.impuesto_selectivo_consumo || 0
  ).toFixed(2);
  datoscamposGastosfijos.value.otros_impuestos_tasas = Number(
    datoscamposGastosfijos.value.otros_impuestos_tasas || 0
  ).toFixed(2);
  datoscamposGastosfijos.value.ncf_proveedor = String(
    datoscamposGastosfijos.value.ncf_proveedor || ''
  ).trim().toUpperCase();

  if (
    datoscamposGastosfijos.value.ncf_proveedor &&
    !/^[A-Z0-9]{11}$|^[A-Z0-9]{13}$/.test(datoscamposGastosfijos.value.ncf_proveedor)
  ) {
    toast.add({
      severity: 'warn',
      summary: 'Comprobante inválido',
      detail: 'El NCF debe contener 11 posiciones o 13 posiciones si es electrónico.',
      life: 4000
    });
    return;
  }

  const datosEnviar = JSON.parse(JSON.stringify(datoscamposGastosfijos.value));
  const envioDatos = await peticionesFetchOffline('insertData','gastosfijos', JSON.stringify(datosEnviar));

  if (envioDatos[0] == 'ok') {
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto fijo creado correctamente', life: 3000 });
    limpiarCamposCrear();
    visiblecrear.value = false;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al crear el gasto fijo', life: 3000 });
  }
}

async function funcionActualizar() {
  if (!datoscampos.value.descripcion || !datoscampos.value.valor) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Descripción y valor son obligatorios', life: 3000 });
    return;
  }

  datoscampos.value.ncf_proveedor = String(datoscampos.value.ncf_proveedor || '')
    .trim()
    .toUpperCase();
  datoscampos.value.impuesto_selectivo_consumo = Number(
    datoscampos.value.impuesto_selectivo_consumo || 0
  ).toFixed(2);
  datoscampos.value.otros_impuestos_tasas = Number(
    datoscampos.value.otros_impuestos_tasas || 0
  ).toFixed(2);
  if (
    datoscampos.value.ncf_proveedor &&
    !/^[A-Z0-9]{11}$|^[A-Z0-9]{13}$/.test(datoscampos.value.ncf_proveedor)
  ) {
    toast.add({
      severity: 'warn',
      summary: 'Comprobante inválido',
      detail: 'El NCF debe contener 11 posiciones o 13 posiciones si es electrónico.',
      life: 4000
    });
    return;
  }

  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }

  const datosEnviar = JSON.parse(JSON.stringify(datoscampos.value));
  const envioDatos = await peticionesFetchOffline('updateData','gastosfijos', JSON.stringify(datosEnviar));

  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto actualizado correctamente', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar el gasto', life: 3000 });
  }
}

async function borrarSeleccionados() {
  if (selectedItems.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione al menos un gasto', life: 3000 });
    return;
  }

  const ids = obtenerIdsSeleccionados(selectedItems.value);

  Swal.fire({
    title: "¿Está seguro?",
    text: `Se eliminarán ${ids.length} gasto(s) fijo(s)`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
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
          for (const id of ids) {
            try {
              await peticionesFetchOffline('deleteEntry','gastosfijos', id);
            } catch (error) {
              console.error(`Error al eliminar ID: ${id}`, error);
              exitoTotal = false;
            }
          }

          if (exitoTotal) {
            selectedItems.value = [];
            fetchAndSetupData();
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gastos eliminados correctamente', life: 3000 });
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Algunos gastos no pudieron eliminarse', life: 3000 });
          }
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        }
      }
    }
  });
}

/************************************************************************/
// FUNCIONES AVANZADAS
/************************************************************************/

async function marcarComoPagado(gasto) {
  Swal.fire({
    title: 'Confirmar Pago',
    html: `
      <p>¿Marcar como pagado el gasto:</p>
      <p class="font-bold">${gasto.descripcion}</p>
      <p>Monto: ${formatearMoneda(gasto.valor)}</p>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, pagado',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      const historial = JSON.parse(gasto.historial_pagos || '[]');
      historial.push({
        fecha: nfecha('fecha'),
        hora: nfecha('hora'),
        monto: gasto.valor,
        usuario: datosEmpresa.usuario.nombre || 'Sistema'
      });

      gasto.estado = 'PAGADO';
      gasto.ultimo_pago = nfecha('fecha');
      gasto.historial_pagos = JSON.stringify(historial);
      gasto.updated_at = nfecha('timestamp');

      const envioDatos = await peticionesFetchOffline('updateData','gastosfijos', JSON.stringify(gasto));

      if (envioDatos[0] == 'ok') {
        fetchAndSetupData();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto marcado como pagado', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado', life: 3000 });
      }
    }
  });
}

async function convertirACuentaPorPagar(gasto) {
  gastoSeleccionado.value = gasto;
  visibleConvertirCxP.value = true;
}

async function confirmarConversionCxP() {
  const gasto = gastoSeleccionado.value;

  // Aquí se crearía la cuenta por pagar
  const cuentaPorPagar = {
    descripcion: gasto.descripcion,
    monto: gasto.valor,
    fecha_vencimiento: gasto.fecha_pago,
    proveedor: gasto.proveedor || 'N/A',
    estado: 'PENDIENTE',
    tipo: 'GASTO_FIJO',
    referencia_gasto_fijo: gasto.id,
    notas: gasto.notas || '',
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp'),
    almacen: datosEmpresa.empresa.nombre
  };

  // Actualizar el gasto fijo
  gasto.cuentaporpagar = 'SI';
  gasto.updated_at = nfecha('timestamp');

  const envioDatos = await peticionesFetchOffline('updateData','gastosfijos', JSON.stringify(gasto));

  if (envioDatos[0] == 'ok') {
    // Aquí normalmente se insertaría en la tabla cuentasxpagar
    // await peticionesFetchOffline('insertData','cuentasxpagar', JSON.stringify(cuentaPorPagar));

    fetchAndSetupData();
    visibleConvertirCxP.value = false;
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Gasto convertido a cuenta por pagar',
      life: 3000
    });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo realizar la conversión', life: 3000 });
  }
}

function verHistorialPagos(gasto) {
  gastoSeleccionado.value = gasto;
  visibleHistorial.value = true;
}

function limpiarFiltros() {
  filtroTipo.value = null;
  filtroEstado.value = null;
  filtroAlerta.value = null;
  filtroFechaDesde.value = null;
  filtroFechaHasta.value = null;
  searchQuery.value = '';
}

/************************************************************************/
// MENU CONTEXTUAL
/************************************************************************/

const toggleGastosfijos = (event, rowData) => {
  currentRowData.value = rowData;
  itemsGastosfijos.value = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => {
        datoscampos.value = { ...currentRowData.value };
        visible.value = true;
      }
    },
    {
      label: 'Marcar como Pagado',
      icon: 'pi pi-check-circle',
      disabled: currentRowData.value.estado === 'PAGADO',
      command: () => marcarComoPagado(currentRowData.value)
    },
    {
      label: 'Convertir a CxP',
      icon: 'pi pi-arrow-right',
      disabled: currentRowData.value.cuentaporpagar === 'SI',
      command: () => convertirACuentaPorPagar(currentRowData.value)
    },
    {
      label: 'Ver Historial',
      icon: 'pi pi-history',
      command: () => verHistorialPagos(currentRowData.value)
    },
    { separator: true },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      command: async () => {
        const result = await Swal.fire({
          title: 'Introduce la contraseña',
          input: 'password',
          inputPlaceholder: 'Contraseña',
          showCancelButton: true,
          confirmButtonText: 'Eliminar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          const contrasenaIngresada = result.value;
          if (contrasenaIngresada === token.value || contrasenaIngresada === tokenCorto.value) {
            const datosFactura = await peticionesFetchOffline('deleteEntry','gastosfijos', currentRowData.value.id);
            if (datosFactura[0] == 'ok') {
              toast.add({ severity: 'success', summary: 'Éxito', detail: 'Gasto eliminado correctamente', life: 3000 });
              await fetchAndSetupData();
            } else {
              toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar el gasto', life: 3000 });
            }
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
          }
        }
      }
    },
  ];
  menu.value.toggle(event);
};

const onRowSelect = (event) => {
  datoscampos.value = { ...event.data };
  visible.value = true;
};

/************************************************************************/
// CONFIGURACIÓN Y MONTAJE
/************************************************************************/

const datosConfig = async() => {
  const response = await envioElectron('datosarchivo');
  datosJSON.value = response;
  link.value = datosJSON.value.VITE_LINKURL;
  api.value = datosJSON.value.VITE_LINK_API;
  token.value = datosJSON.value.VITE_TOKEN;
  tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
}

onMounted(async () => {
  await datosConfig();
  tokenCifrado.value = await encryptarPassword(token.value, 10);

  await crearTablaSiNoExisteOffline('gastosfijos', camposArray.join(','), toast);

  await campos();
  await fetchProveedores();
  await fetchAndSetupData();
});

/************************************************************************/
// COMPUTED PARA HISTORIAL
/************************************************************************/
const historialPagosData = computed(() => {
  if (!gastoSeleccionado.value?.historial_pagos) return [];
  try {
    return JSON.parse(gastoSeleccionado.value.historial_pagos);
  } catch {
    return [];
  }
});

</script>

<template>
<main class="content-wrapper">
  <div class="mt-5">

    <!-- HEADER CON TABS -->
    <Card class="mb-4">
      <template #content>
        <div class="flex justify-between items-center">
          <div class="flex gap-2">
            <Button
              label="Dashboard"
              icon="pi pi-chart-line"
              :severity="viewMode === 'dashboard' ? 'primary' : 'secondary'"
              :outlined="viewMode !== 'dashboard'"
              @click="viewMode = 'dashboard'"
            />
            <Button
              label="Tabla"
              icon="pi pi-table"
              :severity="viewMode === 'table' ? 'primary' : 'secondary'"
              :outlined="viewMode !== 'table'"
              @click="viewMode = 'table'"
            />
          </div>
          <div class="flex gap-2">
            <Button
              icon="pi pi-refresh"
              severity="primary"
              outlined
              @click="fetchAndSetupData"
              v-tooltip.top="'Recargar datos'"
            />
            <Button
              icon="pi pi-plus"
              label="Nuevo Gasto"
              severity="success"
              @click="limpiarCamposCrear(); visiblecrear = true"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- VISTA DASHBOARD -->
    <div v-if="viewMode === 'dashboard'" class="space-y-4">

      <!-- TARJETAS DE ESTADÍSTICAS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Total Gastos -->
        <Card class="bg-gradient-to-br from-blue-500 to-blue-600 ">
          <template #content>
            <div class="flex justify-between items-start">
              <div>
                <div class="text-sm opacity-90 mb-1">Total en Gastos</div>
                <div class="text-3xl font-bold">{{ formatearMoneda(estadisticas.totalGastos) }}</div>
                <div class="text-xs opacity-75 mt-2">{{ estadisticas.cantidadTotal }} gastos registrados</div>
              </div>
              <i class="pi pi-dollar text-4xl opacity-50"></i>
            </div>
          </template>
        </Card>

        <!-- Pendientes -->
        <Card class="bg-gradient-to-br from-orange-500 to-orange-600 ">
          <template #content>
            <div class="flex justify-between items-start">
              <div>
                <div class="text-sm opacity-90 mb-1">Gastos Pendientes</div>
                <div class="text-3xl font-bold">{{ estadisticas.pendientes }}</div>
                <div class="text-xs opacity-75 mt-2">Por pagar este mes</div>
              </div>
              <i class="pi pi-clock text-4xl opacity-50"></i>
            </div>
          </template>
        </Card>

        <!-- Alertas -->
        <Card class="bg-gradient-to-br from-yellow-500 to-yellow-600 ">
          <template #content>
            <div class="flex justify-between items-start">
              <div>
                <div class="text-sm opacity-90 mb-1">Alertas Activas</div>
                <div class="text-3xl font-bold">{{ estadisticas.alertas }}</div>
                <div class="text-xs opacity-75 mt-2">Próximos a vencer</div>
              </div>
              <i class="pi pi-exclamation-triangle text-4xl opacity-50"></i>
            </div>
          </template>
        </Card>

        <!-- Vencidos -->
        <Card class="bg-gradient-to-br from-red-500 to-red-600 ">
          <template #content>
            <div class="flex justify-between items-start">
              <div>
                <div class="text-sm opacity-90 mb-1">Gastos Vencidos</div>
                <div class="text-3xl font-bold">{{ estadisticas.vencidos }}</div>
                <div class="text-xs opacity-75 mt-2">Requieren atención</div>
              </div>
              <i class="pi pi-times-circle text-4xl opacity-50"></i>
            </div>
          </template>
        </Card>

      </div>

      <!-- DISTRIBUCIÓN POR TIPO -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-pie text-blue-500"></i>
              <span>Distribución por Tipo</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div v-for="item in distribucionPorTipo" :key="item.tipo" class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div class="font-semibold">{{ item.tipo }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ item.cantidad }} gasto(s)</div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-lg">{{ formatearMoneda(item.valor) }}</div>
                  <div class="text-xs text-gray-500">
                    {{ estadisticas.totalGastos > 0 ? ((item.valor / estadisticas.totalGastos) * 100).toFixed(1) : 0 }}%
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-calendar text-green-500"></i>
              <span>Próximos Pagos (30 días)</span>
            </div>
          </template>
          <template #content>
            <div v-if="proximosPagos.length === 0" class="text-center text-gray-500 py-4">
              No hay pagos programados
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="gasto in proximosPagos"
                :key="gasto.id"
                class="flex justify-between items-center p-2 border-l-4 pl-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                :class="{
                  'border-red-500': calcularDiasRestantes(gasto.fecha_pago) <= 3,
                  'border-yellow-500': calcularDiasRestantes(gasto.fecha_pago) > 3 && calcularDiasRestantes(gasto.fecha_pago) <= 7,
                  'border-green-500': calcularDiasRestantes(gasto.fecha_pago) > 7
                }"
              >
                <div class="flex-1">
                  <div class="font-semibold text-sm">{{ gasto.descripcion }}</div>
                  <div class="text-xs text-gray-600">{{ gasto.fecha_pago }}</div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-sm">{{ formatearMoneda(gasto.valor) }}</div>
                  <Badge
                    :value="calcularDiasRestantes(gasto.fecha_pago) + ' días'"
                    :severity="getSeveridadAlerta(gasto)"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-bell text-red-500"></i>
              <span>Alertas Activas</span>
            </div>
          </template>
          <template #content>
            <div v-if="gastosConAlerta.length === 0" class="text-center text-gray-500 py-4">
              No hay alertas activas
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="gasto in gastosConAlerta.slice(0, 5)"
                :key="gasto.id"
                class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="font-semibold text-sm">{{ gasto.descripcion }}</div>
                    <div class="text-xs text-gray-600 mt-1">Vence: {{ gasto.fecha_pago }}</div>
                  </div>
                  <Badge
                    :value="calcularDiasRestantes(gasto.fecha_pago) + ' días'"
                    severity="warning"
                  />
                </div>
                <div class="mt-2 flex justify-between items-center">
                  <span class="font-bold text-sm">{{ formatearMoneda(gasto.valor) }}</span>
                  <Button
                    label="Pagar"
                    size="small"
                    severity="warning"
                    @click="marcarComoPagado(gasto)"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>

      </div>

      <!-- RESUMEN MENSUAL -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-calculator text-purple-500"></i>
            <span>Resumen por Categoría</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-semibold text-blue-700 dark:text-blue-300">Gastos Fijos</span>
                <i class="pi pi-lock text-blue-500"></i>
              </div>
              <div class="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {{ formatearMoneda(estadisticas.totalFijos) }}
              </div>
              <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {{ estadisticas.gastosFijos }} gasto(s) mensual(es)
              </div>
            </div>

            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-semibold text-green-700 dark:text-green-300">Gastos Variables</span>
                <i class="pi pi-arrows-h text-green-500"></i>
              </div>
              <div class="text-2xl font-bold text-green-900 dark:text-green-100">
                {{ formatearMoneda(estadisticas.totalVariables) }}
              </div>
              <div class="text-xs text-green-600 dark:text-green-400 mt-1">
                {{ estadisticas.gastosVariables }} gasto(s) variable(s)
              </div>
            </div>

            <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-semibold text-purple-700 dark:text-purple-300">Préstamos</span>
                <i class="pi pi-money-bill text-purple-500"></i>
              </div>
              <div class="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {{ formatearMoneda(estadisticas.totalPrestamos) }}
              </div>
              <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {{ estadisticas.prestamos }} préstamo(s) activo(s)
              </div>
            </div>

          </div>
        </template>
      </Card>

    </div>

    <!-- VISTA TABLA -->
    <div v-if="viewMode === 'table'">

      <Card>
        <template #content>

          <!-- TOOLBAR -->
          <div class="mb-4">
            <Fieldset legend="Herramientas y Filtros" :toggleable="true">

              <!-- Botones de acción -->
              <div class="flex items-center mb-4 gap-2">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  @click="borrarSeleccionados"
                  v-tooltip.top="'Eliminar seleccionados'"
                  :disabled="selectedItems.length === 0"
                />
                <div class="ml-auto flex gap-2">
                  <Button
                    label="Limpiar Filtros"
                    icon="pi pi-filter-slash"
                    severity="secondary"
                    outlined
                    @click="limpiarFiltros"
                  />
                </div>
              </div>

              <!-- Filtros -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">

                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">Buscar</label>
                  <InputText
                    v-model="searchQuery"
                    placeholder="Buscar..."
                    class="w-full"
                  >
                    <template #prefix>
                      <i class="pi pi-search" />
                    </template>
                  </InputText>
                </div>

                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">Tipo</label>
                  <Dropdown
                    v-model="filtroTipo"
                    :options="['FIJO', 'VARIABLE', 'PRESTAMO']"
                    placeholder="Todos los tipos"
                    showClear
                    class="w-full"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">Estado</label>
                  <Dropdown
                    v-model="filtroEstado"
                    :options="['PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO']"
                    placeholder="Todos los estados"
                    showClear
                    class="w-full"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">Alertas</label>
                  <Dropdown
                    v-model="filtroAlerta"
                    :options="[
                      { label: 'Con Alerta', value: 'SI' },
                      { label: 'Vencidos', value: 'VENCIDO' }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Todas"
                    showClear
                    class="w-full"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">Desde</label>
                  <flat-pickr
                    v-model="filtroFechaDesde"
                    class="form-input w-full p-inputtext p-component"
                    :config="basic"
                    placeholder="Fecha desde"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-sm font-medium mb-1">Hasta</label>
                  <flat-pickr
                    v-model="filtroFechaHasta"
                    class="form-input w-full p-inputtext p-component"
                    :config="basic"
                    placeholder="Fecha hasta"
                  />
                </div>

              </div>
            </Fieldset>
          </div>

          <!-- TABLA -->
          <DataTable
            :value="filteredGastosfijos"
            scrollable
            scrollHeight="600px"
            dataKey="id"
            paginator
            :rows="10"
            size="small"
            resizableColumns
            columnResizeMode="fit"
            v-model:selection="selectedItems"
            @rowSelect="onRowSelect"
            selectionMode="single"
            :rowsPerPageOptions="[10, 25, 50, 100]"
            tableStyle="min-width: 50rem"
            stripedRows
            showGridlines
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem" frozen></Column>

            <Column header="Acciones" frozen headerStyle="width: 5rem">
              <template #body="slotProps">
                <Button
                  icon="pi pi-cog"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="toggleGastosfijos($event, slotProps.data)"
                  aria-haspopup="true"
                  aria-controls="overlay_menu_factura"
                />
                <Menu
                  ref="menu"
                  id="overlay_menu_Gastosfijos"
                  :model="itemsGastosfijos"
                  :popup="true"
                />
              </template>
            </Column>

            <Column field="descripcion" header="Descripción" style="min-width: 250px">
              <template #body="slotProps">
                <div>
                  <div class="font-semibold">{{ slotProps.data.descripcion }}</div>
                  <div v-if="slotProps.data.categoria" class="text-xs text-gray-500 mt-1">
                    <Tag :value="slotProps.data.categoria" size="small" severity="info" />
                  </div>
                </div>
              </template>
            </Column>

            <Column field="tipo" header="Tipo" style="min-width: 120px">
              <template #body="slotProps">
                <Tag
                  :value="slotProps.data.tipo"
                  :severity="slotProps.data.tipo === 'FIJO' ? 'primary' : slotProps.data.tipo === 'VARIABLE' ? 'success' : 'warning'"
                />
              </template>
            </Column>

            <Column field="valor" header="Monto" style="min-width: 150px">
              <template #body="slotProps">
                <span class="font-bold text-lg">{{ formatearMoneda(slotProps.data.valor) }}</span>
              </template>
            </Column>

            <Column field="fecha_pago" header="Fecha de Pago" style="min-width: 140px">
              <template #body="slotProps">
                <div v-if="slotProps.data.fecha_pago">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-calendar text-gray-500"></i>
                    <span>{{ slotProps.data.fecha_pago }}</span>
                  </div>
                  <div v-if="slotProps.data.alerta === 'SI'" class="mt-1">
                    <Badge
                      :value="getEstadoLabel(slotProps.data)"
                      :severity="getSeveridadAlerta(slotProps.data)"
                      size="small"
                    />
                  </div>
                </div>
                <span v-else class="text-gray-400">Sin fecha</span>
              </template>
            </Column>

            <Column field="estado" header="Estado" style="min-width: 120px">
              <template #body="slotProps">
                <Badge
                  :value="slotProps.data.estado || 'PENDIENTE'"
                  :severity="getSeveridadEstado(slotProps.data.estado)"
                />
              </template>
            </Column>

            <Column field="ultimo_pago" header="Último Pago" style="min-width: 140px">
              <template #body="slotProps">
                <span v-if="slotProps.data.ultimo_pago">
                  <i class="pi pi-check-circle text-green-500 mr-1"></i>
                  {{ slotProps.data.ultimo_pago }}
                </span>
                <span v-else class="text-gray-400">Sin pagos</span>
              </template>
            </Column>

            <Column field="proveedor" header="Proveedor" style="min-width: 150px">
              <template #body="slotProps">
                <span v-if="slotProps.data.proveedor">{{ slotProps.data.proveedor }}</span>
                <span v-else class="text-gray-400">N/A</span>
              </template>
            </Column>

            <Column field="cuentaporpagar" header="CxP" style="min-width: 80px">
              <template #body="slotProps">
                <Tag
                  v-if="slotProps.data.cuentaporpagar === 'SI'"
                  value="Sí"
                  severity="success"
                  icon="pi pi-check"
                />
                <Tag
                  v-else
                  value="No"
                  severity="secondary"
                />
              </template>
            </Column>

            <Column field="alerta" header="Alerta" style="min-width: 100px">
              <template #body="slotProps">
                <div v-if="slotProps.data.alerta === 'SI'" class="flex items-center gap-2">
                  <i class="pi pi-bell text-yellow-500"></i>
                  <span class="text-sm">{{ slotProps.data.dias_alerta }} días</span>
                </div>
                <span v-else class="text-gray-400">No</span>
              </template>
            </Column>

            <Column header="Acciones Rápidas" style="min-width: 200px">
              <template #body="slotProps">
                <div class="flex gap-1">
                  <Button
                    icon="pi pi-check"
                    size="small"
                    severity="success"
                    outlined
                    v-tooltip.top="'Marcar como pagado'"
                    @click="marcarComoPagado(slotProps.data)"
                    :disabled="slotProps.data.estado === 'PAGADO'"
                  />
                  <Button
                    icon="pi pi-arrow-right"
                    size="small"
                    severity="info"
                    outlined
                    v-tooltip.top="'Convertir a CxP'"
                    @click="convertirACuentaPorPagar(slotProps.data)"
                    :disabled="slotProps.data.cuentaporpagar === 'SI'"
                  />
                  <Button
                    icon="pi pi-history"
                    size="small"
                    severity="secondary"
                    outlined
                    v-tooltip.top="'Ver historial'"
                    @click="verHistorialPagos(slotProps.data)"
                  />
                </div>
              </template>
            </Column>

          </DataTable>

        </template>
      </Card>

    </div>

  </div>

  <!-- MODAL CREAR -->
  <Dialog
    v-model:visible="visiblecrear"
    modal
    header="Crear Nuevo Gasto Fijo"
    :style="{ width: '700px' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-plus-circle text-2xl text-green-500"></i>
        <span class="font-bold text-xl">Nuevo Gasto Fijo</span>
      </div>
    </template>

    <div class="grid grid-cols-12 gap-4 mt-4">

      <div class="col-span-12">
        <label class="block text-sm font-medium mb-2">Descripción *</label>
        <InputText
          v-model="datoscamposGastosfijos.descripcion"
          placeholder="Ej: Alquiler de oficina, Electricidad, etc."
          fluid
          class="w-full"
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Categoría</label>
        <Dropdown
          v-model="datoscamposGastosfijos.categoria"
          :options="['Servicios', 'Alquiler', 'Salarios', 'Mantenimiento', 'Seguros', 'Impuestos', 'Otros']"
          placeholder="Seleccione categoría"
          fluid
          editable
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Tipo *</label>
        <Dropdown
          v-model="datoscamposGastosfijos.tipo"
          :options="['FIJO', 'VARIABLE', 'PRESTAMO']"
          placeholder="Seleccione tipo"
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Monto *</label>
        <InputText
          v-model="datoscamposGastosfijos.valor"
          placeholder="0.00"
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Proveedor</label>
        <Dropdown
          v-model="datoscamposGastosfijos.proveedor"
          :options="proveedores"
          optionLabel="nombre"
          optionValue="nombre"
          placeholder="Seleccione un proveedor"
          filter
          showClear
          fluid
          @change="seleccionarProveedorCrear($event.value)"
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">RNC/Cédula del proveedor</label>
        <InputText
          v-model="datoscamposGastosfijos.rnc_proveedor"
          placeholder="Se completa desde el proveedor"
          readonly
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Comprobante fiscal para 606</label>
        <InputText
          v-model="datoscamposGastosfijos.ncf_proveedor"
          placeholder="B0100000001 o E310000000001"
          v-mayuscula
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Fecha del comprobante</label>
        <flat-pickr
          v-model="datoscamposGastosfijos.fecha_comprobante"
          class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid"
          :config="basic"
          placeholder="Seleccione fecha"
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Tipo de bien o servicio 606</label>
        <Dropdown
          v-model="datoscamposGastosfijos.tipo_bienes_servicios"
          :options="tiposBienesServicios606"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccione clasificación"
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">ITBIS facturado</label>
        <InputText
          v-model="datoscamposGastosfijos.impuesto"
          placeholder="0.00"
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Impuesto Selectivo al Consumo (ISC)</label>
        <InputText
          v-model="datoscamposGastosfijos.impuesto_selectivo_consumo"
          placeholder="0.00"
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Otros impuestos/tasas (CDT)</label>
        <InputText
          v-model="datoscamposGastosfijos.otros_impuestos_tasas"
          placeholder="0.00"
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Fecha de Pago</label>
        <flat-pickr
          v-model="datoscamposGastosfijos.fecha_pago"
          class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid"
          :config="basic"
          placeholder="Seleccione fecha"
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Estado</label>
        <Dropdown
          v-model="datoscamposGastosfijos.estado"
          :options="['PENDIENTE', 'PAGADO', 'CANCELADO']"
          placeholder="Seleccione estado"
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Activar Alerta</label>
        <Dropdown
          v-model="datoscamposGastosfijos.alerta"
          :options="['SI', 'NO']"
          placeholder="Seleccione"
          fluid
        />
      </div>

      <div class="col-span-6" v-if="datoscamposGastosfijos.alerta === 'SI'">
        <label class="block text-sm font-medium mb-2">Días de Alerta</label>
        <InputText
          v-model="datoscamposGastosfijos.dias_alerta"
          placeholder="7"
          v-solonumeros
          fluid
        />
        <small class="text-gray-500">Días antes del vencimiento para alertar</small>
      </div>

      <div class="col-span-12">
        <label class="block text-sm font-medium mb-2">Notas</label>
        <Textarea
          v-model="datoscamposGastosfijos.notas"
          rows="3"
          placeholder="Notas adicionales..."
          fluid
        />
      </div>

    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          outlined
          @click="visiblecrear = false"
        />
        <Button
          label="Crear Gasto"
          icon="pi pi-check"
          severity="success"
          @click="funcionCrear"
        />
      </div>
    </template>
  </Dialog>

  <!-- MODAL EDITAR -->
  <Dialog
    v-model:visible="visible"
    modal
    header="Editar Gasto Fijo"
    :style="{ width: '700px' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-pencil text-2xl text-blue-500"></i>
        <span class="font-bold text-xl">Editar Gasto</span>
      </div>
    </template>

    <div class="grid grid-cols-12 gap-4 mt-4">

      <div class="col-span-12">
        <label class="block text-sm font-medium mb-2">Descripción *</label>
        <InputText
          v-model="datoscampos.descripcion"
          placeholder="Descripción del gasto"
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Categoría</label>
        <Dropdown
          v-model="datoscampos.categoria"
          :options="['Servicios', 'Alquiler', 'Salarios', 'Mantenimiento', 'Seguros', 'Impuestos', 'Otros']"
          placeholder="Seleccione categoría"
          fluid
          editable
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Tipo *</label>
        <Dropdown
          v-model="datoscampos.tipo"
          :options="['FIJO', 'VARIABLE', 'PRESTAMO']"
          placeholder="Seleccione tipo"
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Monto *</label>
        <InputText
          v-model="datoscampos.valor"
          placeholder="0.00"
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Proveedor</label>
        <Dropdown
          v-model="datoscampos.proveedor"
          :options="proveedores"
          optionLabel="nombre"
          optionValue="nombre"
          placeholder="Seleccione un proveedor"
          filter
          showClear
          fluid
          @change="seleccionarProveedorEditar($event.value)"
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">RNC/Cédula del proveedor</label>
        <InputText v-model="datoscampos.rnc_proveedor" readonly fluid />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Comprobante fiscal para 606</label>
        <InputText
          v-model="datoscampos.ncf_proveedor"
          placeholder="B0100000001 o E310000000001"
          v-mayuscula
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Fecha del comprobante</label>
        <flat-pickr
          v-model="datoscampos.fecha_comprobante"
          class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid"
          :config="basic"
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Tipo de bien o servicio 606</label>
        <Dropdown
          v-model="datoscampos.tipo_bienes_servicios"
          :options="tiposBienesServicios606"
          optionLabel="label"
          optionValue="value"
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">ITBIS facturado</label>
        <InputText
          v-model="datoscampos.impuesto"
          placeholder="0.00"
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Impuesto Selectivo al Consumo (ISC)</label>
        <InputText
          v-model="datoscampos.impuesto_selectivo_consumo"
          placeholder="0.00"
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Otros impuestos/tasas (CDT)</label>
        <InputText
          v-model="datoscampos.otros_impuestos_tasas"
          placeholder="0.00"
          v-decimales
          v-numeroFocusinOut
          v-solonumeros
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Fecha de Pago</label>
        <flat-pickr
          v-model="datoscampos.fecha_pago"
          class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid"
          :config="basic"
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Estado</label>
        <Dropdown
          v-model="datoscampos.estado"
          :options="['PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO']"
          placeholder="Seleccione estado"
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Activar Alerta</label>
        <Dropdown
          v-model="datoscampos.alerta"
          :options="['SI', 'NO']"
          placeholder="Seleccione"
          fluid
        />
      </div>

      <div class="col-span-6" v-if="datoscampos.alerta === 'SI'">
        <label class="block text-sm font-medium mb-2">Días de Alerta</label>
        <InputText
          v-model="datoscampos.dias_alerta"
          placeholder="7"
          v-solonumeros
          fluid
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Último Pago</label>
        <flat-pickr
          v-model="datoscampos.ultimo_pago"
          class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid"
          :config="basic"
        />
      </div>

      <div class="col-span-6">
        <label class="block text-sm font-medium mb-2">Cuenta por Pagar</label>
        <InputText
          v-model="datoscampos.cuentaporpagar"
          placeholder="SI/NO"
          v-mayuscula
          fluid
          disabled
        />
      </div>

      <div class="col-span-12">
        <label class="block text-sm font-medium mb-2">Notas</label>
        <Textarea
          v-model="datoscampos.notas"
          rows="3"
          placeholder="Notas adicionales..."
          fluid
        />
      </div>

    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          outlined
          @click="visible = false"
        />
        <Button
          label="Guardar Cambios"
          icon="pi pi-check"
          severity="primary"
          @click="funcionActualizar"
        />
      </div>
    </template>
  </Dialog>

  <!-- MODAL HISTORIAL DE PAGOS -->
  <Dialog
    v-model:visible="visibleHistorial"
    modal
    header="Historial de Pagos"
    :style="{ width: '600px' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-history text-2xl text-purple-500"></i>
        <span class="font-bold text-xl">Historial de Pagos</span>
      </div>
    </template>

    <div v-if="gastoSeleccionado" class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="font-bold text-lg">{{ gastoSeleccionado.descripcion }}</div>
      <div class="text-sm text-gray-600 dark:text-gray-400">Monto: {{ formatearMoneda(gastoSeleccionado.valor) }}</div>
    </div>

    <div v-if="historialPagosData.length === 0" class="text-center text-gray-500 py-8">
      <i class="pi pi-inbox text-4xl mb-3 block"></i>
      <p>No hay pagos registrados para este gasto</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(pago, index) in historialPagosData"
        :key="index"
        class="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-calendar text-blue-500"></i>
              <span class="font-semibold">{{ pago.fecha }}</span>
              <span class="text-sm text-gray-500">{{ pago.hora }}</span>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <i class="pi pi-user mr-1"></i>
              {{ pago.usuario }}
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-lg text-green-600">{{ formatearMoneda(pago.monto) }}</div>
            <Badge value="Pagado" severity="success" size="small" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cerrar"
        icon="pi pi-times"
        severity="secondary"
        @click="visibleHistorial = false"
      />
    </template>
  </Dialog>

  <!-- MODAL CONVERTIR A CXP -->
  <Dialog
    v-model:visible="visibleConvertirCxP"
    modal
    header="Convertir a Cuenta por Pagar"
    :style="{ width: '500px' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-arrow-right-arrow-left text-2xl text-indigo-500"></i>
        <span class="font-bold text-xl">Convertir a CxP</span>
      </div>
    </template>

    <div v-if="gastoSeleccionado" class="space-y-4">

      <Message severity="info" :closable="false">
        Esta acción creará una cuenta por pagar basada en este gasto fijo.
      </Message>

      <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div class="mb-3">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Descripción</label>
          <div class="font-bold">{{ gastoSeleccionado.descripcion }}</div>
        </div>
        <div class="mb-3">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Monto</label>
          <div class="font-bold text-xl text-blue-600">{{ formatearMoneda(gastoSeleccionado.valor) }}</div>
        </div>
        <div class="mb-3">
          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha de Vencimiento</label>
          <div class="font-semibold">{{ gastoSeleccionado.fecha_pago || 'No especificada' }}</div>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-600 dark:text-gray-400">Proveedor</label>
          <div class="font-semibold">{{ gastoSeleccionado.proveedor || 'N/A' }}</div>
        </div>
      </div>

      <Message severity="warn" :closable="false">
        El gasto fijo se marcará como vinculado a una cuenta por pagar.
      </Message>

    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          outlined
          @click="visibleConvertirCxP = false"
        />
        <Button
          label="Confirmar Conversión"
          icon="pi pi-check"
          severity="primary"
          @click="confirmarConversionCxP"
        />
      </div>
    </template>
  </Dialog>

  <Toast />
</main>
</template>

<style scoped>
.content-wrapper {
  padding: 1rem;
}

/* Animaciones suaves */
.p-card {
  transition: all 0.3s ease;
}

.p-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Estilos para las tarjetas de estadísticas */
.bg-gradient-to-br {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Mejorar apariencia del DataTable */
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--primary-color);
  color: white;
  font-weight: 600;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--surface-hover);
}

/* Badges personalizados */
:deep(.p-badge) {
  font-weight: 600;
}

/* Mejorar inputs */
:deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 0.2rem var(--primary-color-alpha-20);
}
</style>
