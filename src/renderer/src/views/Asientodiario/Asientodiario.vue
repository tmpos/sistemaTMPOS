<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { enviarDatosPorPost, eliminarDatos, obtenerIdsSeleccionados, borrarTodoslosDatos, lenguajeDataTable, nfecha, arrayToObjetoFromTabla, peticionesFetch, encryptarPassword, envioElectron, mensajetoast, crearTablaSiNoExiste, peticiones, lasMayusculas, generarTablaFromStringJSON, peticionesFetchOffline, arrayToObjetoFromTablaOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
import Awesomplete from '../../components/Awesomplete.vue';

const router = useRouter();
const toast = useToast();

/************************************************************************/
const usuarioLocal = ref({});
const camposArray = ["numero", "fecha", "hora", "asiento", "descripcion", "usuario"];

/************************************************************************/
import { useDatosEmpresa } from '../../stores';
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
const datoscamposAsientodiario = ref({});
const visible = ref(false);
const visiblecrear = ref(false);
const datoscampos = ref({});
const data = ref([]);
const searchQuery = ref('');
const fechaDesde  = ref('');
const fechaHasta  = ref('');
const cuentasArray = ref([]);
const cuentasNombres = ref([]);
const ultimoRegistro = ref(null);
const asientosTemp = ref([]);
const loading = ref(false);

/************************************************************************/
// Computed properties
const totalDebito = computed(() => {
  return asientosTemp.value.reduce((sum, item) => sum + parseFloat(item.cantidadDebito || 0), 0);
});

const totalCredito = computed(() => {
  return asientosTemp.value.reduce((sum, item) => sum + parseFloat(item.cantidadCredito || 0), 0);
});

const diferencia = computed(() => {
  return totalDebito.value - totalCredito.value;
});

const estaBalanceado = computed(() => {
  return Math.abs(diferencia.value) < 0.01; // Permitir pequeña diferencia por redondeo
});

const filteredAsientodiario = computed(() => {
  return data.value.filter(row => {
    // Filtro por texto
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchText = Object.values(row).some(v => String(v).toLowerCase().includes(q));
      if (!matchText) return false;
    }
    // Filtro por rango de fechas (formato YYYY-MM-DD)
    if (fechaDesde.value && row.fecha < fechaDesde.value) return false;
    if (fechaHasta.value && row.fecha > fechaHasta.value) return false;
    return true;
  });
});

const limpiarFiltros = () => {
  searchQuery.value = '';
  fechaDesde.value  = '';
  fechaHasta.value  = '';
};

/************************************************************************/
async function limpiarCamposCrear() {
  datoscamposAsientodiario.value = {};
  asientosTemp.value = [];
  await campos();
  inicializarCamposCrear();
}

/************************************************************************/
const inicializarCamposCrear = () => {
  datoscamposAsientodiario.value.numero = ultimoRegistro.value;
  datoscamposAsientodiario.value.fecha = nfecha('fecha');
  datoscamposAsientodiario.value.hora = nfecha('hora');
  datoscamposAsientodiario.value.descripcion = 'REGISTRO DE ASIENTO';
  datoscamposAsientodiario.value.debito = '';
  datoscamposAsientodiario.value.credito = '';
  datoscamposAsientodiario.value.cantidadDebito = '0.00';
  datoscamposAsientodiario.value.cantidadCredito = '0.00';
  datoscamposAsientodiario.value.usuario = usuarioLocal.value.usuario || 'Sistema';
};

/************************************************************************/
const fetchAndSetupData = async () => {
  try {
    loading.value = true;
    const response = await peticionesFetchOffline('getDataAsArray', 'asientodiario');
    const jsonData = response;

    if (Array.isArray(jsonData) && jsonData.length > 0) {
      data.value = jsonData.reverse(); // Mostrar los más recientes primero
      const lastNumber = parseFloat(jsonData[0].numero) + 1 || 1;
      ultimoRegistro.value = lastNumber.toString().padStart(8, '0');
    } else {
      data.value = [];
      ultimoRegistro.value = '00000001';
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar asientos', life: 3000 });
    data.value = [];
    ultimoRegistro.value = '00000001';
  } finally {
    loading.value = false;
  }
};

/************************************************************************/
const fetchCuentas = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
    cuentasArray.value = response || [];
    cuentasNombres.value = response.map(cuenta => cuenta.nombre);
  } catch (error) {
    console.error('Error fetching cuentas:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar cuentas', life: 3000 });
  }
};

/************************************************************************/
async function campos() {
  const campos = await arrayToObjetoFromTablaOffline('asientodiario');
  datoscamposAsientodiario.value = campos;
}

/************************************************************************/
onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
    linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
    patroncedula.value = datosJSON.VITE_PATRON_CEDULA;
    tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;

    tokenCifrado.value = await encryptarPassword(token.value, 10);
    await crearTablaSiNoExisteOffline('asientodiario', camposArray, toast);

    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))?.[0] || {};

    await campos();
    await fetchAndSetupData();
    await fetchCuentas();
  } catch (error) {
    console.error('Error en onMounted:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al inicializar', life: 3000 });
  }
});

/************************************************************************/
async function borrarTodo() {
  Swal.fire({
    title: "¿Estás seguro?",
    text: "¡Se borrarán todos los asientos!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, borrar todo",
    cancelButtonText: "Cancelar"
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
          const envioDatos = await peticionesFetchOffline('deleteAll', 'asientodiario');
          if (envioDatos[0] == 'ok') {
            fetchAndSetupData();
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Todos los datos fueron borrados', life: 3000 });
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al borrar datos', life: 3000 });
          }
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        }
      }
    }
  });
}

/************************************************************************/
async function funcionActualizar() {
  if (!datoscampos.value) {
    console.error("Datos incompletos, no se puede actualizar.");
    return;
  }

  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }

  const envioDatos = await peticionesFetchOffline('updateData', 'asientodiario', JSON.stringify(datoscampos.value));
  if (envioDatos[0] == 'ok') {
    visible.value = false;
    fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asiento actualizado', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar', life: 3000 });
  }
}

/************************************************************************/
async function funcionCrear() {
  // Validaciones
  if (!datoscamposAsientodiario.value.descripcion || datoscamposAsientodiario.value.descripcion.trim() === '') {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'La descripción es requerida', life: 3000 });
    return;
  }

  if (asientosTemp.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Debes agregar al menos un movimiento', life: 3000 });
    return;
  }

  if (!estaBalanceado.value) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El asiento debe estar balanceado (Débito = Crédito)', life: 3000 });
    return;
  }

  try {
    loading.value = true;

    const asientoData = {
      numero: datoscamposAsientodiario.value.numero,
      fecha: datoscamposAsientodiario.value.fecha,
      hora: datoscamposAsientodiario.value.hora,
      descripcion: datoscamposAsientodiario.value.descripcion,
      asiento: JSON.stringify(asientosTemp.value),
      usuario: datoscamposAsientodiario.value.usuario,
      created_at: nfecha('timestamp'),
      updated_at: nfecha('timestamp')
    };

    const envioDatos = await peticionesFetchOffline('insertData', 'asientodiario', JSON.stringify(asientoData));

    if (envioDatos[0] == 'ok') {
      await fetchAndSetupData();
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asiento creado exitosamente', life: 3000 });
      limpiarCamposCrear();
      visiblecrear.value = false;
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al crear el asiento', life: 3000 });
    }
  } catch (error) {
    console.error('Error al crear asiento:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al crear el asiento', life: 3000 });
  } finally {
    loading.value = false;
  }
}

/************************************************************************/
async function borrarSeleccionados() {
  const ids = obtenerIdsSeleccionados(selectedItems.value);

  if (ids.length === 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay elementos seleccionados', life: 3000 });
    return;
  }

  Swal.fire({
    title: "¿Estás seguro?",
    text: `Se borrarán ${ids.length} asiento(s)`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, borrar",
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
              await peticionesFetchOffline('deleteEntry', 'asientodiario', id);
            } catch (error) {
              console.error(`Error al eliminar ID: ${id}`, error);
              exitoTotal = false;
            }
          }

          if (exitoTotal) {
            fetchAndSetupData();
            selectedItems.value = [];
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asientos eliminados', life: 3000 });
          } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Algunos asientos no pudieron eliminarse', life: 3000 });
          }
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
        }
      }
    }
  });
}

/************************************************************************/
const itemsAsientodiario = ref([]);
const menu = ref(null);
const currentRowData = ref(null);

const toggleAsientodiario = (event, rowData) => {
  currentRowData.value = rowData;
  itemsAsientodiario.value = [
    {
      label: 'Ver Detalles',
      icon: 'pi pi-eye',
      command: () => {
        visible.value = true;
        datoscampos.value = currentRowData.value;
      }
    },
    {
      label: 'Generar PDF',
      icon: 'pi pi-file-pdf',
      command: () => generarPDF(currentRowData.value)
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      command: () => eliminarAsiento(rowData)
    },
  ];
  menu.value.toggle(event);
};

const eliminarAsiento = async (rowData) => {
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
      const datosFactura = await peticionesFetchOffline('deleteEntry', 'asientodiario', rowData.id);
      if (datosFactura[0] == 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asiento eliminado', life: 3000 });
        await fetchAndSetupData();
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar', life: 3000 });
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    }
  }
};

/************************************************************************/
const fnAwesomplete = () => {};

const handleSelectCompleteDebito = async (selected) => {
  datoscamposAsientodiario.value.debito = selected;
};

const handleSelectCompleteCredito = async (selected) => {
  datoscamposAsientodiario.value.credito = selected;
};

/************************************************************************/
const fnAgregarAsiento = () => {
  // Validaciones
  if (!datoscamposAsientodiario.value.debito || !datoscamposAsientodiario.value.credito) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona las cuentas de débito y crédito', life: 3000 });
    return;
  }

  const debito = parseFloat(datoscamposAsientodiario.value.cantidadDebito) || 0;
  const credito = parseFloat(datoscamposAsientodiario.value.cantidadCredito) || 0;

  if (debito <= 0 || credito <= 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Las cantidades deben ser mayores a 0', life: 3000 });
    return;
  }

  if (debito !== credito) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Las cantidades deben ser iguales', life: 3000 });
    return;
  }

  const asiento = {
    debito: datoscamposAsientodiario.value.debito,
    cantidadDebito: debito,
    credito: datoscamposAsientodiario.value.credito,
    cantidadCredito: credito,
  };

  asientosTemp.value.push(asiento);

  // Limpiar campos
  datoscamposAsientodiario.value.debito = '';
  datoscamposAsientodiario.value.credito = '';
  datoscamposAsientodiario.value.cantidadDebito = '0.00';
  datoscamposAsientodiario.value.cantidadCredito = '0.00';

  toast.add({ severity: 'success', summary: 'Agregado', detail: 'Movimiento agregado al asiento', life: 2000 });
};

/************************************************************************/
const fnigualarCantidad = () => {
  datoscamposAsientodiario.value.cantidadCredito = datoscamposAsientodiario.value.cantidadDebito;
};

/************************************************************************/
const eliminarItemAsiento = (index) => {
  asientosTemp.value.splice(index, 1);
  toast.add({ severity: 'info', summary: 'Eliminado', detail: 'Movimiento eliminado', life: 2000 });
};

/************************************************************************/
const abrirModalCrear = () => {
  limpiarCamposCrear();
  visiblecrear.value = true;
};

/************************************************************************/
const parsearAsiento = (asientoJSON) => {
  try {
    return JSON.parse(asientoJSON);
  } catch {
    return [];
  }
};

/************************************************************************/
// PDF embebido
const visiblePdf = ref(false);
const pdfBlobUrl = ref('');

const generarPDF = (asiento) => {
  const movimientos = parsearAsiento(asiento.asiento);
  const empresa = datosEmpresa?.empresa?.nombre || '';

  // Detectar formato de movimientos ({debito/credito} vs {cuenta/cantidadDebito/cantidadCredito})
  const filas = movimientos.map(m => {
    if (m.debito !== undefined || m.credito !== undefined) {
      // Formato clásico: una fila = un par débito/crédito
      return {
        cuentaDebito:  m.debito  || '—',
        montoDebito:   parseFloat(m.cantidadDebito  || 0).toFixed(2),
        cuentaCredito: m.credito || '—',
        montoCredito:  parseFloat(m.cantidadCredito || 0).toFixed(2),
      };
    } else {
      // Formato compacto: una línea con debito o crédito
      const esDebito = parseFloat(m.cantidadDebito || 0) > 0;
      return {
        cuentaDebito:  esDebito ? (m.cuenta || '—') : '',
        montoDebito:   esDebito ? parseFloat(m.cantidadDebito || 0).toFixed(2) : '',
        cuentaCredito: !esDebito ? (m.cuenta || '—') : '',
        montoCredito:  !esDebito ? parseFloat(m.cantidadCredito || 0).toFixed(2) : '',
      };
    }
  });

  const totalDebito  = movimientos.reduce((s, m) => s + parseFloat(m.cantidadDebito  || 0), 0);
  const totalCredito = movimientos.reduce((s, m) => s + parseFloat(m.cantidadCredito || 0), 0);

  const filasHtml = filas.map(f => `
    <tr>
      <td class="cuenta">${f.cuentaDebito}</td>
      <td class="monto debito">${f.montoDebito ? 'RD$ ' + f.montoDebito : ''}</td>
      <td class="cuenta">${f.cuentaCredito}</td>
      <td class="monto credito">${f.montoCredito ? 'RD$ ' + f.montoCredito : ''}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Asiento Diario No. ${asiento.numero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a1a; padding: 32px; }
    .header { text-align: center; margin-bottom: 28px; border-bottom: 3px double #1d4ed8; padding-bottom: 16px; }
    .empresa { font-size: 20px; font-weight: 700; color: #1d4ed8; letter-spacing: .5px; }
    .titulo  { font-size: 15px; font-weight: 600; color: #374151; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .meta-box { background: #f3f4f6; border-radius: 8px; padding: 10px 14px; }
    .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: .04em; }
    .meta-value { font-size: 14px; font-weight: 600; color: #111827; margin-top: 2px; }
    .desc-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px 14px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
    .desc-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #1d4ed8; }
    .desc-value { font-size: 13px; color: #1e3a8a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #1d4ed8; color: #fff; }
    thead th { padding: 9px 12px; text-align: left; font-weight: 600; font-size: 12px; }
    thead th.right { text-align: right; }
    tbody tr { border-bottom: 1px solid #e5e7eb; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    td { padding: 8px 12px; vertical-align: middle; }
    td.cuenta { color: #1f2937; }
    td.monto  { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
    td.debito  { color: #15803d; }
    td.credito { color: #b91c1c; }
    tfoot tr { background: #1e3a8a; color: #fff; font-weight: 700; }
    tfoot td { padding: 9px 12px; }
    tfoot td.monto { text-align: right; }
    .balance-ok  { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px 14px; margin-top: 16px; color: #166534; font-size: 13px; font-weight: 600; }
    .balance-bad { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 10px 14px; margin-top: 16px; color: #991b1b; font-size: 13px; font-weight: 600; }
    .footer { margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print { body { padding: 16px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="empresa">${empresa}</div>
    <div class="titulo">Asiento Diario</div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">Número</div>
      <div class="meta-value">${asiento.numero}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Fecha</div>
      <div class="meta-value">${asiento.fecha || '—'}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Hora</div>
      <div class="meta-value">${asiento.hora || '—'}</div>
    </div>
  </div>

  <div class="meta-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 20px;">
    <div class="meta-box">
      <div class="meta-label">Usuario</div>
      <div class="meta-value">${asiento.usuario || '—'}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Movimientos</div>
      <div class="meta-value">${movimientos.length}</div>
    </div>
  </div>

  <div class="desc-box">
    <div class="desc-label">Descripción</div>
    <div class="desc-value">${asiento.descripcion || '—'}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Cuenta Débito</th>
        <th class="right">Monto Débito</th>
        <th>Cuenta Crédito</th>
        <th class="right">Monto Crédito</th>
      </tr>
    </thead>
    <tbody>${filasHtml}</tbody>
    <tfoot>
      <tr>
        <td>TOTALES</td>
        <td class="monto">RD$ ${totalDebito.toFixed(2)}</td>
        <td></td>
        <td class="monto">RD$ ${totalCredito.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  ${Math.abs(totalDebito - totalCredito) < 0.01
    ? '<div class="balance-ok">✔ Asiento balanceado — Débito = Crédito</div>'
    : `<div class="balance-bad">⚠ Asiento desbalanceado — Diferencia: RD$ ${Math.abs(totalDebito - totalCredito).toFixed(2)}</div>`
  }

  <div class="footer">Generado el ${new Date().toLocaleString('es-DO')} · ${empresa}</div>
</body>
</html>`;

  // Liberar URL anterior para no acumular blobs en memoria
  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value);

  const blob = new Blob([html], { type: 'text/html' });
  pdfBlobUrl.value = URL.createObjectURL(blob);
  visiblePdf.value = true;
};

const imprimirPdf = () => {
  const iframe = document.getElementById('asiento-pdf-iframe');
  if (iframe) iframe.contentWindow.print();
};

const generarPDFReporte = () => {
  const empresa = datosEmpresa?.empresa?.nombre || '';
  const lista   = filteredAsientodiario.value;

  const filasHtml = lista.map(a => {
    const movs = parsearAsiento(a.asiento);
    const totD = movs.reduce((s, m) => s + parseFloat(m.cantidadDebito  || 0), 0);
    const totC = movs.reduce((s, m) => s + parseFloat(m.cantidadCredito || 0), 0);
    return `<tr>
      <td>${a.numero}</td>
      <td>${a.fecha || '—'}</td>
      <td>${a.hora  || '—'}</td>
      <td>${a.descripcion || '—'}</td>
      <td class="r">${movs.length}</td>
      <td class="r deb">RD$ ${totD.toFixed(2)}</td>
      <td class="r cre">RD$ ${totC.toFixed(2)}</td>
      <td>${a.usuario || '—'}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Reporte Asiento Diario</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;padding:28px}
  .hdr{text-align:center;border-bottom:3px double #1d4ed8;padding-bottom:14px;margin-bottom:20px}
  .empresa{font-size:20px;font-weight:700;color:#1d4ed8}
  .titulo{font-size:14px;font-weight:600;color:#374151;margin-top:4px}
  .fecha-gen{font-size:11px;color:#6b7280;margin-top:4px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead tr{background:#1d4ed8;color:#fff}
  thead th{padding:8px 10px;text-align:left;font-size:11px;font-weight:600}
  thead th.r{text-align:right}
  tbody tr{border-bottom:1px solid #e5e7eb}
  tbody tr:nth-child(even){background:#f9fafb}
  td{padding:7px 10px;vertical-align:middle}
  td.r{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
  td.deb{color:#15803d}
  td.cre{color:#b91c1c}
  tfoot tr{background:#1e3a8a;color:#fff;font-weight:700}
  tfoot td{padding:8px 10px}
  tfoot td.r{text-align:right}
  .ftr{margin-top:24px;border-top:1px solid #e5e7eb;padding-top:10px;font-size:11px;color:#9ca3af;text-align:center}
  @media print{body{padding:12px}}
</style>
</head>
<body>
  <div class="hdr">
    <div class="empresa">${empresa}</div>
    <div class="titulo">Reporte — Asiento Diario</div>
    <div class="fecha-gen">Generado el ${new Date().toLocaleString('es-DO')} · ${lista.length} registro(s)</div>
  </div>
  <table>
    <thead><tr>
      <th>Número</th><th>Fecha</th><th>Hora</th>
      <th>Descripción</th>
      <th class="r">Movim.</th>
      <th class="r">Total Débito</th>
      <th class="r">Total Crédito</th>
      <th>Usuario</th>
    </tr></thead>
    <tbody>${filasHtml}</tbody>
  </table>
  <div class="ftr">${empresa} · Asiento Diario · ${new Date().toLocaleDateString('es-DO')}</div>
</body></html>`;

  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value);
  const blob = new Blob([html], { type: 'text/html' });
  pdfBlobUrl.value = URL.createObjectURL(blob);
  visiblePdf.value = true;
};
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Asiento Diario</h1>
        <p class="text-gray-600">Registra y consulta los asientos contables del diario</p>
      </div>

      <!-- Acciones -->
      <Card class="mb-4">
        <template #content>
          <div class="flex flex-wrap gap-2">
            <Button
              label="Nuevo Asiento"
              icon="pi pi-plus"
              severity="success"
              @click="abrirModalCrear"
            />
            <Button
              label="Generar PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              @click="generarPDFReporte"
            />
            <Button
              label="Actualizar"
              icon="pi pi-refresh"
              severity="info"
              outlined
              @click="fetchAndSetupData"
            />
            <Button
              label="Eliminar Seleccionados"
              icon="pi pi-trash"
              severity="danger"
              outlined
              @click="borrarSeleccionados"
              :disabled="selectedItems.length === 0"
            />
            <Button
              label="Mayor General"
              icon="pi pi-book"
              severity="contrast"
              outlined
              @click="$router.push('/mayorgeneral')"
            />
            <Button
              label="Balance"
              icon="pi icon-balance-scale"
              severity="contrast"
              outlined
              @click="$router.push('/balance')"
            />
            <Button
              v-if="usuarioLocal.usuario == 'Soporte'"
              label="Borrar Todo"
              icon="pi pi-trash"
              severity="danger"
              class="ml-auto"
              @click="borrarTodo"
            />
          </div>
        </template>
      </Card>

      <!-- Buscador + Rango de fechas -->
      <Card class="mb-4">
        <template #content>
          <div class="filtros-grid">
            <!-- Búsqueda por texto -->
            <div class="filtro-search">
              <i class="pi pi-search filtro-icon"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por número, descripción, usuario..."
                class="filtro-input"
              />
            </div>
            <!-- Desde -->
            <div class="filtro-field">
              <label class="filtro-label">Desde</label>
              <input
                v-model="fechaDesde"
                type="date"
                class="filtro-input"
              />
            </div>
            <!-- Hasta -->
            <div class="filtro-field">
              <label class="filtro-label">Hasta</label>
              <input
                v-model="fechaHasta"
                type="date"
                class="filtro-input"
              />
            </div>
            <!-- Limpiar -->
            <div class="filtro-action">
              <Button
                icon="pi pi-times"
                label="Limpiar"
                severity="secondary"
                outlined
                @click="limpiarFiltros"
              />
            </div>
          </div>
          <!-- Badge resultados -->
          <div v-if="fechaDesde || fechaHasta || searchQuery" class="filtro-badge">
            <i class="pi pi-filter-fill"></i>
            Mostrando <strong>{{ filteredAsientodiario.length }}</strong> de {{ data.length }} asientos
            <span v-if="fechaDesde || fechaHasta">
              · Período:
              <strong>{{ fechaDesde || '...' }}</strong> → <strong>{{ fechaHasta || '...' }}</strong>
            </span>
          </div>
        </template>
      </Card>

      <!-- Tabla de Asientos -->
      <Card>
        <template #content>
          <DataTable
            :value="filteredAsientodiario"
            v-model:selection="selectedItems"
            dataKey="id"
            paginator
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            scrollable
            scrollHeight="600px"
            :loading="loading"
            class="p-datatable-sm"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column header="Acciones" style="width: 120px">
              <template #body="slotProps">
                <div style="display:flex;gap:4px;align-items:center;">
                  <Button
                    icon="pi pi-cog"
                    size="small"
                    text
                    rounded
                    @click="toggleAsientodiario($event, slotProps.data)"
                    v-tooltip.top="'Opciones'"
                  />
                  <Button
                    icon="pi pi-file-pdf"
                    size="small"
                    text
                    rounded
                    severity="danger"
                    @click="generarPDF(slotProps.data)"
                    v-tooltip.top="'Generar PDF'"
                  />
                </div>
                <Menu ref="menu" :model="itemsAsientodiario" :popup="true" />
              </template>
            </Column>
            <Column field="numero" header="Número" sortable style="min-width: 120px"></Column>
            <Column field="fecha" header="Fecha" sortable style="min-width: 120px"></Column>
            <Column field="hora" header="Hora" sortable style="min-width: 100px"></Column>
            <Column field="descripcion" header="Descripción" sortable style="min-width: 250px"></Column>
            <Column header="Movimientos" style="min-width: 100px">
              <template #body="slotProps">
                <Tag :value="parsearAsiento(slotProps.data.asiento).length + ' items'" severity="info" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Modal Ver/Editar -->
    <Dialog
      v-model:visible="visible"
      modal
      header="Detalles del Asiento"
      :style="{ width: '800px' }"
      :breakpoints="{ '960px': '90vw' }"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              type="text"
              v-model="datoscampos.numero"
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="text"
              v-model="datoscampos.fecha"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hora</label>
            <input
              type="text"
              v-model="datoscampos.hora"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <input
            type="text"
            v-model="datoscampos.descripcion"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Movimientos del Asiento</label>
          <div class="overflow-x-auto border rounded-lg">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Cuenta Débito</th>
                  <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600">Monto Débito</th>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Cuenta Crédito</th>
                  <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600">Monto Crédito</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in parsearAsiento(datoscampos.asiento)"
                  :key="index"
                  class="border-t hover:bg-gray-50"
                >
                  <td class="px-4 py-2 text-sm">{{ item.debito }}</td>
                  <td class="px-4 py-2 text-sm text-right font-medium text-green-600">
                    RD$ {{ parseFloat(item.cantidadDebito).toFixed(2) }}
                  </td>
                  <td class="px-4 py-2 text-sm">{{ item.credito }}</td>
                  <td class="px-4 py-2 text-sm text-right font-medium text-red-600">
                    RD$ {{ parseFloat(item.cantidadCredito).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cerrar" severity="secondary" outlined @click="visible = false" />
        <Button label="Generar PDF" icon="pi pi-file-pdf" severity="danger" outlined @click="generarPDF(datoscampos)" />
        <Button label="Actualizar" severity="primary" @click="funcionActualizar" />
      </template>
    </Dialog>

    <!-- Modal Crear -->
    <Dialog
      v-model:visible="visiblecrear"
      modal
      header="Crear Nuevo Asiento"
      :style="{ width: '1000px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div class="space-y-4">
        <!-- Información del asiento -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-blue-600"></i>
              <span class="text-base">Información del Asiento</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  v-model="datoscamposAsientodiario.numero"
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="text"
                  v-model="datoscamposAsientodiario.fecha"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input
                  type="text"
                  v-model="datoscamposAsientodiario.hora"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <input
                type="text"
                v-model="datoscamposAsientodiario.descripcion"
                placeholder="Ej: Registro de venta, Pago de nómina, etc."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </template>
        </Card>

        <!-- Agregar movimientos -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-plus-circle text-green-600"></i>
              <span class="text-base">Agregar Movimiento</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">Cuenta Débito *</label>
                <awesomplete
                  v-model="datoscamposAsientodiario.debito"
                  @selectComplete="handleSelectCompleteDebito"
                  :list="cuentasNombres"
                  class="w-full"
                />
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  v-model="datoscamposAsientodiario.cantidadDebito"
                  @keyup="fnigualarCantidad"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="col-span-5">
                <label class="block text-sm font-medium text-gray-700 mb-1">Cuenta Crédito *</label>
                <awesomplete
                  v-model="datoscamposAsientodiario.credito"
                  @selectComplete="handleSelectCompleteCredito"
                  :list="cuentasNombres"
                  class="w-full"
                />
              </div>
              <!-- <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  v-model="datoscamposAsientodiario.cantidadCredito"
                  step="0.01"
                  min="0"
                  readonly
                  placeholder="0.00"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div> -->
            </div>

            <div class="mt-4">
              <Button
                label="Agregar Movimiento"
                icon="pi pi-plus"
                severity="success"
                @click="fnAgregarAsiento"
                class="w-full"
              />
            </div>
          </template>
        </Card>

        <!-- Listado de movimientos -->
        <Card v-if="asientosTemp.length > 0">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-list text-blue-600"></i>
                <span class="text-base">Movimientos del Asiento ({{ asientosTemp.length }})</span>
              </div>
              <div class="flex gap-4 text-sm">
                <span class="font-semibold">
                  Total Débito: <span class="text-green-600">RD$ {{ totalDebito.toFixed(2) }}</span>
                </span>
                <span class="font-semibold">
                  Total Crédito: <span class="text-red-600">RD$ {{ totalCredito.toFixed(2) }}</span>
                </span>
                <span class="font-semibold" :class="estaBalanceado ? 'text-green-600' : 'text-orange-600'">
                  Diferencia: RD$ {{ Math.abs(diferencia).toFixed(2) }}
                </span>
              </div>
            </div>
          </template>
          <template #content>
            <div class="overflow-x-auto border rounded-lg">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Cuenta Débito</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600">Monto Débito</th>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Cuenta Crédito</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600">Monto Crédito</th>
                    <th class="px-4 py-2 text-center text-xs font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in asientosTemp"
                    :key="index"
                    class="border-t hover:bg-gray-50"
                  >
                    <td class="px-4 py-2 text-sm">{{ item.debito }}</td>
                    <td class="px-4 py-2 text-sm text-right font-medium text-green-600">
                      RD$ {{ parseFloat(item.cantidadDebito).toFixed(2) }}
                    </td>
                    <td class="px-4 py-2 text-sm">{{ item.credito }}</td>
                    <td class="px-4 py-2 text-sm text-right font-medium text-red-600">
                      RD$ {{ parseFloat(item.cantidadCredito).toFixed(2) }}
                    </td>
                    <td class="px-4 py-2 text-center">
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        text
                        rounded
                        severity="danger"
                        @click="eliminarItemAsiento(index)"
                      />
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-100 font-bold">
                  <tr>
                    <td class="px-4 py-2 text-sm text-right">TOTAL:</td>
                    <td class="px-4 py-2 text-sm text-right text-green-600">
                      RD$ {{ totalDebito.toFixed(2) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-right">TOTAL:</td>
                    <td class="px-4 py-2 text-sm text-right text-red-600">
                      RD$ {{ totalCredito.toFixed(2) }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div v-if="!estaBalanceado" class="mt-3 p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
              <div class="flex items-center gap-2">
                <i class="pi pi-exclamation-triangle text-orange-600"></i>
                <p class="text-sm text-orange-800">
                  <strong>Advertencia:</strong> El asiento no está balanceado. La diferencia debe ser RD$ 0.00
                </p>
              </div>
            </div>

            <div v-else class="mt-3 p-3 bg-green-50 border-l-4 border-green-400 rounded">
              <div class="flex items-center gap-2">
                <i class="pi pi-check-circle text-green-600"></i>
                <p class="text-sm text-green-800">
                  <strong>Perfecto:</strong> El asiento está balanceado y listo para guardar
                </p>
              </div>
            </div>
          </template>
        </Card>

        <div v-else class="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <i class="pi pi-inbox text-5xl text-gray-400 mb-3"></i>
          <p class="text-gray-600">No hay movimientos agregados. Usa el formulario de arriba para agregar movimientos al asiento.</p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" outlined @click="visiblecrear = false" />
        <Button
          label="Guardar Asiento"
          severity="success"
          icon="pi pi-save"
          @click="funcionCrear"
          :disabled="!estaBalanceado || asientosTemp.length === 0"
        />
      </template>
    </Dialog>

    <!-- Dialog visor PDF embebido -->
    <Dialog
      v-model:visible="visiblePdf"
      modal
      header="Vista previa del Asiento"
      :style="{ width: '860px', maxWidth: '96vw' }"
      @hide="() => { if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); pdfBlobUrl = ''; } }"
    >
      <iframe
        id="asiento-pdf-iframe"
        :src="pdfBlobUrl"
        style="width: 100%; height: 72vh; border: none; border-radius: 8px;"
      />
      <template #footer>
        <Button label="Cerrar" icon="pi pi-times" severity="secondary" text @click="visiblePdf = false" />
        <Button label="Imprimir / Guardar PDF" icon="pi pi-print" severity="danger" @click="imprimirPdf" />
      </template>
    </Dialog>

    <Toast />
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}

/* ── Filtros ────────────────────────────────────── */
.filtros-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}
.filtro-search {
  flex: 1 1 260px;
  position: relative;
  display: flex;
  align-items: center;
}
.filtro-icon {
  position: absolute;
  left: 0.75rem;
  color: #9ca3af;
  font-size: 0.9rem;
}
.filtro-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 155px;
}
.filtro-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.filtro-input {
  width: 100%;
  padding: 0.5rem 0.85rem 0.5rem 2.2rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
  color: #1f2937;
  transition: border-color .2s, box-shadow .2s;
  outline: none;
}
.filtro-field .filtro-input {
  padding-left: 0.85rem;
}
.filtro-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,.12);
}
.filtro-action {
  display: flex;
  align-items: flex-end;
}
.filtro-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.6rem;
  padding: 0.4rem 0.75rem;
  background: #eff6ff;
  border-radius: 8px;
  font-size: 0.82rem;
  color: #1d4ed8;
}
.filtro-badge i { font-size: 0.8rem; }
</style>
