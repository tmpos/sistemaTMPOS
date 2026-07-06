<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  nfecha,
  encryptarPassword,
  envioElectron,
  obtenerIdsSeleccionados,
  peticionesFetchOffline,
  arrayToObjetoFromTablaOffline,
  crearTablaSiNoExisteOffline
} from '../../funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from 'primevue/usetoast';
import Awesomplete from '../../components/Awesomplete.vue';
import { useDatosEmpresa } from '../../stores';

const router = useRouter();
const toast = useToast();
const datosEmpresa = useDatosEmpresa();

/************************************************************************/
const link        = ref('');
const api         = ref('');
const token       = ref('');
const tokenCorto  = ref('');
const tokenCifrado = ref('');
const usuarioLocal = ref({});

const camposArray = ['numero', 'fecha', 'hora', 'asiento', 'descripcion', 'usuario'];

/************************************************************************/
const data             = ref([]);
const selectedItems    = ref([]);
const searchQuery      = ref('');
const loading          = ref(false);
const cuentasArray     = ref([]);
const cuentasNombres   = ref([]);
const ultimoRegistro   = ref('00000001');

// dialogs
const visible       = ref(false);
const visiblecrear  = ref(false);
const visiblePdf    = ref(false);
const pdfBlobUrl    = ref('');

const datoscampos                = ref({});
const datoscamposAsientodiario   = ref({});
const asientosTemp               = ref([]);

/************************************************************************/
// Computed
const totalDebito = computed(() =>
  asientosTemp.value.reduce((s, i) => s + parseFloat(i.cantidadDebito || 0), 0)
);
const totalCredito = computed(() =>
  asientosTemp.value.reduce((s, i) => s + parseFloat(i.cantidadCredito || 0), 0)
);
const diferencia = computed(() => totalDebito.value - totalCredito.value);
const estaBalanceado = computed(() => Math.abs(diferencia.value) < 0.01);

const filteredData = computed(() => {
  if (!searchQuery.value) return data.value;
  return data.value.filter(row =>
    Object.values(row).some(v =>
      String(v).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});

/************************************************************************/
const parsearAsiento = (json) => {
  try { return JSON.parse(json); } catch { return []; }
};

/************************************************************************/
const fetchAndSetupData = async () => {
  loading.value = true;
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'asientodiario');
    if (Array.isArray(response) && response.length > 0) {
      data.value = [...response].reverse();
      const lastNum = parseFloat(response[response.length - 1].numero) + 1 || 1;
      ultimoRegistro.value = String(lastNum).padStart(8, '0');
    } else {
      data.value = [];
      ultimoRegistro.value = '00000001';
    }
  } catch (e) {
    console.error(e);
    data.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchCuentas = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
  cuentasArray.value = response || [];
  cuentasNombres.value = (response || []).map(c => c.nombre);
};

/************************************************************************/
onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value       = datosJSON.VITE_LINKURL;
    api.value        = datosJSON.VITE_LINK_API;
    token.value      = datosJSON.VITE_TOKEN;
    tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
    tokenCifrado.value = await encryptarPassword(token.value, 10);
    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal') || '[]')[0] || {};
    await crearTablaSiNoExisteOffline('asientodiario', camposArray, toast);
    await fetchAndSetupData();
    await fetchCuentas();
  } catch (e) {
    console.error(e);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al inicializar', life: 3000 });
  }
});

/************************************************************************/
const inicializarCrear = () => {
  datoscamposAsientodiario.value = {
    numero:          ultimoRegistro.value,
    fecha:           nfecha('fecha'),
    hora:            nfecha('hora'),
    descripcion:     'REGISTRO DE ASIENTO',
    debito:          '',
    credito:         '',
    cantidadDebito:  '0.00',
    cantidadCredito: '0.00',
    usuario:         usuarioLocal.value.usuario || 'Sistema',
  };
  asientosTemp.value = [];
};

const abrirModalCrear = () => {
  inicializarCrear();
  visiblecrear.value = true;
};

/************************************************************************/
const fnigualarCantidad = () => {
  datoscamposAsientodiario.value.cantidadCredito = datoscamposAsientodiario.value.cantidadDebito;
};

const handleSelectCompleteDebito  = (v) => { datoscamposAsientodiario.value.debito  = v; };
const handleSelectCompleteCredito = (v) => { datoscamposAsientodiario.value.credito = v; };

const fnAgregarAsiento = () => {
  const { debito, credito, cantidadDebito, cantidadCredito } = datoscamposAsientodiario.value;
  if (!debito || !credito) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona las cuentas de débito y crédito', life: 3000 });
    return;
  }
  const d = parseFloat(cantidadDebito)  || 0;
  const c = parseFloat(cantidadCredito) || 0;
  if (d <= 0 || c <= 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Las cantidades deben ser mayores a 0', life: 3000 });
    return;
  }
  if (d !== c) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Las cantidades deben ser iguales', life: 3000 });
    return;
  }
  asientosTemp.value.push({ debito, cantidadDebito: d, credito, cantidadCredito: c });
  datoscamposAsientodiario.value.debito          = '';
  datoscamposAsientodiario.value.credito         = '';
  datoscamposAsientodiario.value.cantidadDebito  = '0.00';
  datoscamposAsientodiario.value.cantidadCredito = '0.00';
  toast.add({ severity: 'success', summary: 'Agregado', detail: 'Movimiento agregado', life: 2000 });
};

const eliminarItemAsiento = (index) => {
  asientosTemp.value.splice(index, 1);
};

/************************************************************************/
const funcionCrear = async () => {
  if (!datoscamposAsientodiario.value.descripcion?.trim()) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'La descripción es requerida', life: 3000 });
    return;
  }
  if (asientosTemp.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Agrega al menos un movimiento', life: 3000 });
    return;
  }
  if (!estaBalanceado.value) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El asiento debe estar balanceado', life: 3000 });
    return;
  }
  loading.value = true;
  try {
    const data = {
      numero:      datoscamposAsientodiario.value.numero,
      fecha:       datoscamposAsientodiario.value.fecha,
      hora:        datoscamposAsientodiario.value.hora,
      descripcion: datoscamposAsientodiario.value.descripcion,
      asiento:     JSON.stringify(asientosTemp.value),
      usuario:     datoscamposAsientodiario.value.usuario,
      created_at:  nfecha('timestamp'),
      updated_at:  nfecha('timestamp'),
    };
    const res = await peticionesFetchOffline('insertData', 'asientodiario', JSON.stringify(data));
    if (res[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asiento creado', life: 3000 });
      visiblecrear.value = false;
      await fetchAndSetupData();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al crear el asiento', life: 3000 });
    }
  } finally {
    loading.value = false;
  }
};

const funcionActualizar = async () => {
  if (datoscampos.value.hasOwnProperty('updated_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const res = await peticionesFetchOffline('updateData', 'asientodiario', JSON.stringify(datoscampos.value));
  if (res[0] === 'ok') {
    visible.value = false;
    await fetchAndSetupData();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asiento actualizado', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar', life: 3000 });
  }
};

/************************************************************************/
const eliminarAsiento = async (rowData) => {
  const result = await Swal.fire({
    title: 'Introduce la contraseña',
    input: 'password',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
  });
  if (result.isConfirmed) {
    if (result.value === token.value || result.value === tokenCorto.value) {
      const res = await peticionesFetchOffline('deleteEntry', 'asientodiario', rowData.id);
      if (res[0] === 'ok') {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asiento eliminado', life: 3000 });
        await fetchAndSetupData();
      }
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    }
  }
};

const borrarSeleccionados = async () => {
  const ids = obtenerIdsSeleccionados(selectedItems.value);
  if (!ids.length) return;
  const r = await Swal.fire({
    title: '¿Estás seguro?',
    text: `Se borrarán ${ids.length} asiento(s)`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrar',
    cancelButtonText: 'Cancelar',
  });
  if (!r.isConfirmed) return;
  const pw = await Swal.fire({ title: 'Introduce la contraseña', input: 'password', showCancelButton: true });
  if (!pw.isConfirmed) return;
  if (pw.value !== token.value && pw.value !== tokenCorto.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
    return;
  }
  for (const id of ids) await peticionesFetchOffline('deleteEntry', 'asientodiario', id);
  selectedItems.value = [];
  await fetchAndSetupData();
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Asientos eliminados', life: 3000 });
};

/************************************************************************/
// Menú por fila
const itemsMenu    = ref([]);
const menu         = ref(null);
const currentRowData = ref(null);

const toggleMenu = (event, rowData) => {
  currentRowData.value = rowData;
  itemsMenu.value = [
    {
      label: 'Ver Detalles',
      icon: 'pi pi-eye',
      command: () => { datoscampos.value = { ...currentRowData.value }; visible.value = true; },
    },
    {
      label: 'Generar PDF',
      icon: 'pi pi-file-pdf',
      command: () => generarPDF(currentRowData.value),
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      command: () => eliminarAsiento(currentRowData.value),
    },
  ];
  menu.value.toggle(event);
};

/************************************************************************/
// Generador de PDF embebido
const generarPDF = (asiento) => {
  const movimientos = parsearAsiento(asiento.asiento);
  const empresa = datosEmpresa?.empresa?.nombre || '';

  const filas = movimientos.map(m => {
    if (m.debito !== undefined || m.credito !== undefined) {
      return {
        cuentaDebito:  m.debito  || '—',
        montoDebito:   parseFloat(m.cantidadDebito  || 0).toFixed(2),
        cuentaCredito: m.credito || '—',
        montoCredito:  parseFloat(m.cantidadCredito || 0).toFixed(2),
      };
    }
    const esDebito = parseFloat(m.cantidadDebito || 0) > 0;
    return {
      cuentaDebito:  esDebito ? (m.cuenta || '—') : '',
      montoDebito:   esDebito ? parseFloat(m.cantidadDebito  || 0).toFixed(2) : '',
      cuentaCredito: !esDebito ? (m.cuenta || '—') : '',
      montoCredito:  !esDebito ? parseFloat(m.cantidadCredito || 0).toFixed(2) : '',
    };
  });

  const totD = movimientos.reduce((s, m) => s + parseFloat(m.cantidadDebito  || 0), 0);
  const totC = movimientos.reduce((s, m) => s + parseFloat(m.cantidadCredito || 0), 0);

  const filasHtml = filas.map(f => `
    <tr>
      <td class="cuenta">${f.cuentaDebito}</td>
      <td class="monto deb">${f.montoDebito  ? 'RD$ ' + f.montoDebito  : ''}</td>
      <td class="cuenta">${f.cuentaCredito}</td>
      <td class="monto cre">${f.montoCredito ? 'RD$ ' + f.montoCredito : ''}</td>
    </tr>`).join('');

  const balMsg = Math.abs(totD - totC) < 0.01
    ? '<div class="bal-ok">✔ Asiento balanceado — Débito = Crédito</div>'
    : `<div class="bal-bad">⚠ Desbalanceado — Diferencia: RD$ ${Math.abs(totD - totC).toFixed(2)}</div>`;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Asiento No. ${asiento.numero}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;padding:32px}
  .hdr{text-align:center;border-bottom:3px double #1d4ed8;padding-bottom:16px;margin-bottom:24px}
  .empresa{font-size:20px;font-weight:700;color:#1d4ed8}
  .titulo{font-size:14px;font-weight:600;color:#374151;margin-top:4px}
  .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
  .meta2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
  .box{background:#f3f4f6;border-radius:8px;padding:10px 14px}
  .lbl{font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.04em}
  .val{font-size:14px;font-weight:600;color:#111827;margin-top:2px}
  .desc-box{background:#eff6ff;border-left:4px solid #3b82f6;padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:20px}
  .desc-lbl{font-size:10px;font-weight:700;text-transform:uppercase;color:#1d4ed8}
  .desc-val{font-size:13px;color:#1e3a8a;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  thead tr{background:#1d4ed8;color:#fff}
  thead th{padding:9px 12px;text-align:left;font-size:12px;font-weight:600}
  thead th.r{text-align:right}
  tbody tr{border-bottom:1px solid #e5e7eb}
  tbody tr:nth-child(even){background:#f9fafb}
  td{padding:8px 12px;vertical-align:middle}
  td.cuenta{color:#1f2937}
  td.monto{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
  td.deb{color:#15803d}
  td.cre{color:#b91c1c}
  tfoot tr{background:#1e3a8a;color:#fff;font-weight:700}
  tfoot td{padding:9px 12px}
  tfoot td.monto{text-align:right}
  .bal-ok{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;margin-top:16px;color:#166534;font-size:13px;font-weight:600}
  .bal-bad{background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;margin-top:16px;color:#991b1b;font-size:13px;font-weight:600}
  .ftr{margin-top:32px;border-top:1px solid #e5e7eb;padding-top:10px;font-size:11px;color:#9ca3af;text-align:center}
  @media print{body{padding:16px}}
</style>
</head>
<body>
  <div class="hdr">
    <div class="empresa">${empresa}</div>
    <div class="titulo">Asiento Diario</div>
  </div>
  <div class="meta">
    <div class="box"><div class="lbl">Número</div><div class="val">${asiento.numero}</div></div>
    <div class="box"><div class="lbl">Fecha</div><div class="val">${asiento.fecha || '—'}</div></div>
    <div class="box"><div class="lbl">Hora</div><div class="val">${asiento.hora || '—'}</div></div>
  </div>
  <div class="meta2">
    <div class="box"><div class="lbl">Usuario</div><div class="val">${asiento.usuario || '—'}</div></div>
    <div class="box"><div class="lbl">Movimientos</div><div class="val">${movimientos.length}</div></div>
  </div>
  <div class="desc-box">
    <div class="desc-lbl">Descripción</div>
    <div class="desc-val">${asiento.descripcion || '—'}</div>
  </div>
  <table>
    <thead><tr>
      <th>Cuenta Débito</th><th class="r">Monto Débito</th>
      <th>Cuenta Crédito</th><th class="r">Monto Crédito</th>
    </tr></thead>
    <tbody>${filasHtml}</tbody>
    <tfoot><tr>
      <td>TOTALES</td>
      <td class="monto">RD$ ${totD.toFixed(2)}</td>
      <td></td>
      <td class="monto">RD$ ${totC.toFixed(2)}</td>
    </tr></tfoot>
  </table>
  ${balMsg}
  <div class="ftr">Generado el ${new Date().toLocaleString('es-DO')} · ${empresa}</div>
</body></html>`;

  if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value);
  const blob = new Blob([html], { type: 'text/html' });
  pdfBlobUrl.value = URL.createObjectURL(blob);
  visiblePdf.value = true;
};

const imprimirPdf = () => {
  const iframe = document.getElementById('ad2-pdf-iframe');
  if (iframe) iframe.contentWindow.print();
};
</script>

<template>
  <main class="ad2-wrapper">
    <div class="ad2-inner">

      <!-- Header -->
      <div class="ad2-page-header">
        <div class="ad2-header-icon">
          <i class="pi pi-book"></i>
        </div>
        <div>
          <h1 class="ad2-title">Asiento Diario</h1>
          <p class="ad2-subtitle">Registra y consulta los asientos contables</p>
        </div>
      </div>

      <!-- Acciones -->
      <Card class="ad2-card mb-4">
        <template #content>
          <div class="flex flex-wrap gap-2 items-center">
            <Button label="Nuevo Asiento" icon="pi pi-plus"       severity="success" @click="abrirModalCrear" />
            <Button label="Actualizar"    icon="pi pi-refresh"    severity="info"    outlined @click="fetchAndSetupData" />
            <Button label="Eliminar Seleccionados" icon="pi pi-trash" severity="danger" outlined
                    :disabled="selectedItems.length === 0" @click="borrarSeleccionados" />
            <Button label="Mayor General" icon="pi pi-book"       severity="contrast" outlined @click="$router.push('/mayorgeneral')" />
            <Button label="Balance"       icon="pi pi-chart-bar"  severity="contrast" outlined @click="$router.push('/balance')" />
          </div>
        </template>
      </Card>

      <!-- Buscador -->
      <Card class="ad2-card mb-4">
        <template #content>
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Buscar por número, fecha, descripción..." class="w-full" />
          </IconField>
        </template>
      </Card>

      <!-- Tabla -->
      <Card class="ad2-card">
        <template #content>
          <DataTable
            :value="filteredData"
            v-model:selection="selectedItems"
            dataKey="id"
            paginator
            :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            scrollable
            scrollHeight="560px"
            :loading="loading"
            class="p-datatable-sm"
          >
            <Column selectionMode="multiple" headerStyle="width:3rem" />

            <Column header="Acciones" style="width:110px">
              <template #body="slotProps">
                <div style="display:flex;gap:4px;align-items:center;">
                  <Button
                    icon="pi pi-cog"
                    size="small" text rounded
                    v-tooltip.top="'Opciones'"
                    @click="toggleMenu($event, slotProps.data)"
                  />
                  <Button
                    icon="pi pi-file-pdf"
                    size="small" text rounded
                    severity="danger"
                    v-tooltip.top="'Generar PDF'"
                    @click="generarPDF(slotProps.data)"
                  />
                </div>
                <Menu ref="menu" :model="itemsMenu" :popup="true" />
              </template>
            </Column>

            <Column field="numero"      header="Número"      sortable style="min-width:120px" />
            <Column field="fecha"       header="Fecha"       sortable style="min-width:120px" />
            <Column field="hora"        header="Hora"        sortable style="min-width:100px" />
            <Column field="descripcion" header="Descripción" sortable style="min-width:260px" />
            <Column field="usuario"     header="Usuario"     sortable style="min-width:120px" />
            <Column header="Movimientos" style="min-width:110px">
              <template #body="slotProps">
                <Tag :value="parsearAsiento(slotProps.data.asiento).length + ' items'" severity="info" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

    </div>

    <!-- Dialog: Ver / Editar -->
    <Dialog v-model:visible="visible" modal header="Detalles del Asiento"
            :style="{ width: '800px' }" :breakpoints="{ '960px': '90vw' }">
      <div class="space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="ad2-label">Número</label>
            <InputText v-model="datoscampos.numero" readonly class="w-full" />
          </div>
          <div>
            <label class="ad2-label">Fecha</label>
            <InputText v-model="datoscampos.fecha" class="w-full" />
          </div>
          <div>
            <label class="ad2-label">Hora</label>
            <InputText v-model="datoscampos.hora" class="w-full" />
          </div>
        </div>
        <div>
          <label class="ad2-label">Descripción</label>
          <InputText v-model="datoscampos.descripcion" class="w-full" />
        </div>
        <div>
          <label class="ad2-label">Movimientos</label>
          <div class="overflow-x-auto border rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left font-semibold text-gray-600">Cuenta Débito</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-600">Monto Débito</th>
                  <th class="px-4 py-2 text-left font-semibold text-gray-600">Cuenta Crédito</th>
                  <th class="px-4 py-2 text-right font-semibold text-gray-600">Monto Crédito</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in parsearAsiento(datoscampos.asiento)" :key="i" class="border-t hover:bg-gray-50">
                  <td class="px-4 py-2">{{ item.debito || item.cuenta }}</td>
                  <td class="px-4 py-2 text-right font-semibold text-green-600">RD$ {{ parseFloat(item.cantidadDebito || 0).toFixed(2) }}</td>
                  <td class="px-4 py-2">{{ item.credito || '' }}</td>
                  <td class="px-4 py-2 text-right font-semibold text-red-600">RD$ {{ parseFloat(item.cantidadCredito || 0).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cerrar"       severity="secondary" outlined @click="visible = false" />
        <Button label="Generar PDF"  icon="pi pi-file-pdf" severity="danger" outlined @click="generarPDF(datoscampos)" />
        <Button label="Actualizar"   severity="primary"   @click="funcionActualizar" />
      </template>
    </Dialog>

    <!-- Dialog: Crear -->
    <Dialog v-model:visible="visiblecrear" modal header="Crear Nuevo Asiento"
            :style="{ width: '1000px' }" :breakpoints="{ '960px': '95vw' }">
      <div class="space-y-4">

        <!-- Info del asiento -->
        <Card>
          <template #content>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="ad2-label">Número</label>
                <InputText v-model="datoscamposAsientodiario.numero" readonly class="w-full bg-gray-50" />
              </div>
              <div>
                <label class="ad2-label">Fecha</label>
                <InputText v-model="datoscamposAsientodiario.fecha" class="w-full" />
              </div>
              <div>
                <label class="ad2-label">Hora</label>
                <InputText v-model="datoscamposAsientodiario.hora" class="w-full" />
              </div>
            </div>
            <div class="mt-4">
              <label class="ad2-label">Descripción *</label>
              <InputText v-model="datoscamposAsientodiario.descripcion"
                         placeholder="Ej: Registro de venta, Pago de nómina..." class="w-full" />
            </div>
          </template>
        </Card>

        <!-- Agregar movimiento -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2 text-base">
              <i class="pi pi-plus-circle text-green-600"></i> Agregar Movimiento
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-5">
                <label class="ad2-label">Cuenta Débito *</label>
                <Awesomplete v-model="datoscamposAsientodiario.debito"
                             @selectComplete="handleSelectCompleteDebito"
                             :list="cuentasNombres" class="w-full" />
              </div>
              <div class="col-span-2">
                <label class="ad2-label">Monto *</label>
                <input type="number" v-model="datoscamposAsientodiario.cantidadDebito"
                       @keyup="fnigualarCantidad" step="0.01" min="0" placeholder="0.00"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
              </div>
              <div class="col-span-5">
                <label class="ad2-label">Cuenta Crédito *</label>
                <Awesomplete v-model="datoscamposAsientodiario.credito"
                             @selectComplete="handleSelectCompleteCredito"
                             :list="cuentasNombres" class="w-full" />
              </div>
            </div>
            <div class="mt-4">
              <Button label="Agregar Movimiento" icon="pi pi-plus" severity="success"
                      class="w-full" @click="fnAgregarAsiento" />
            </div>
          </template>
        </Card>

        <!-- Listado de movimientos -->
        <Card v-if="asientosTemp.length > 0">
          <template #title>
            <div class="flex items-center justify-between text-base">
              <div class="flex items-center gap-2">
                <i class="pi pi-list text-blue-600"></i>
                Movimientos ({{ asientosTemp.length }})
              </div>
              <div class="flex gap-4 text-sm font-semibold">
                <span>Débito: <span class="text-green-600">RD$ {{ totalDebito.toFixed(2) }}</span></span>
                <span>Crédito: <span class="text-red-600">RD$ {{ totalCredito.toFixed(2) }}</span></span>
                <span :class="estaBalanceado ? 'text-green-600' : 'text-orange-600'">
                  Dif: RD$ {{ Math.abs(diferencia).toFixed(2) }}
                </span>
              </div>
            </div>
          </template>
          <template #content>
            <div class="overflow-x-auto border rounded-lg">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left font-semibold text-gray-600">Cuenta Débito</th>
                    <th class="px-4 py-2 text-right font-semibold text-gray-600">Monto Débito</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-600">Cuenta Crédito</th>
                    <th class="px-4 py-2 text-right font-semibold text-gray-600">Monto Crédito</th>
                    <th class="px-4 py-2 text-center font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in asientosTemp" :key="i" class="border-t hover:bg-gray-50">
                    <td class="px-4 py-2">{{ item.debito }}</td>
                    <td class="px-4 py-2 text-right font-semibold text-green-600">RD$ {{ parseFloat(item.cantidadDebito).toFixed(2) }}</td>
                    <td class="px-4 py-2">{{ item.credito }}</td>
                    <td class="px-4 py-2 text-right font-semibold text-red-600">RD$ {{ parseFloat(item.cantidadCredito).toFixed(2) }}</td>
                    <td class="px-4 py-2 text-center">
                      <Button icon="pi pi-trash" size="small" text rounded severity="danger"
                              @click="eliminarItemAsiento(i)" />
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-100 font-bold">
                  <tr>
                    <td class="px-4 py-2 text-right">TOTAL:</td>
                    <td class="px-4 py-2 text-right text-green-600">RD$ {{ totalDebito.toFixed(2) }}</td>
                    <td class="px-4 py-2 text-right">TOTAL:</td>
                    <td class="px-4 py-2 text-right text-red-600">RD$ {{ totalCredito.toFixed(2) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div v-if="!estaBalanceado" class="mt-3 p-3 bg-orange-50 border-l-4 border-orange-400 rounded flex gap-2 items-center">
              <i class="pi pi-exclamation-triangle text-orange-600"></i>
              <span class="text-sm text-orange-800"><strong>Advertencia:</strong> El asiento no está balanceado.</span>
            </div>
            <div v-else class="mt-3 p-3 bg-green-50 border-l-4 border-green-400 rounded flex gap-2 items-center">
              <i class="pi pi-check-circle text-green-600"></i>
              <span class="text-sm text-green-800"><strong>Perfecto:</strong> El asiento está balanceado y listo para guardar.</span>
            </div>
          </template>
        </Card>

        <div v-else class="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <i class="pi pi-inbox text-5xl text-gray-400 mb-3 block"></i>
          <p class="text-gray-600">Agrega movimientos usando el formulario de arriba.</p>
        </div>

      </div>
      <template #footer>
        <Button label="Cancelar"       severity="secondary" outlined @click="visiblecrear = false" />
        <Button label="Guardar Asiento" severity="success"  icon="pi pi-save"
                :disabled="!estaBalanceado || asientosTemp.length === 0"
                @click="funcionCrear" />
      </template>
    </Dialog>

    <!-- Dialog: Visor PDF embebido -->
    <Dialog
      v-model:visible="visiblePdf"
      modal
      header="Vista previa del Asiento"
      :style="{ width: '860px', maxWidth: '96vw' }"
      @hide="() => { if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); pdfBlobUrl = ''; } }"
    >
      <iframe
        id="ad2-pdf-iframe"
        :src="pdfBlobUrl"
        style="width:100%; height:72vh; border:none; border-radius:8px;"
      />
      <template #footer>
        <Button label="Cerrar"                icon="pi pi-times"  severity="secondary" text @click="visiblePdf = false" />
        <Button label="Imprimir / Guardar PDF" icon="pi pi-print" severity="danger"        @click="imprimirPdf" />
      </template>
    </Dialog>

    <Toast />
  </main>
</template>

<style scoped>
.ad2-wrapper {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}
.ad2-inner {
  max-width: 1300px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}
.ad2-page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.ad2-header-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(59,130,246,.35);
  flex-shrink: 0;
}
.ad2-header-icon i { color: #fff; font-size: 1.4rem; }
.ad2-title    { font-size: 1.6rem; font-weight: 800; color: #1f2937; margin: 0; }
.ad2-subtitle { font-size: 0.875rem; color: #6b7280; margin: 0; }
.ad2-card     { border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,.07); }
.ad2-label    { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 4px; }
</style>
