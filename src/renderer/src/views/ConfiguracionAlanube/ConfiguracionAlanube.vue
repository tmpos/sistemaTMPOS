<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import {
  agregarDiasalaFechaActual,
  arrayToObjetoFromTablaOffline,
  crearTablaSiNoExisteOffline,
  envioElectron,
  nfecha,
  peticionesFetchOffline
} from '../../funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import axios from 'axios';

const toast = useToast();
const router = useRouter();
const datosEmpresa = useDatosEmpresa();

const tabla = 'comprobantes_electronicos';
const camposArray = [
  'nombre', 'prefijo', 'tipo_ecf', 'descripcion',
  'secuencia_inicial', 'secuencia_final', 'secuencia_actual', 'secuencia',
  'aprobados', 'contador', 'fecha', 'fecha_autorizacion', 'expiracion',
  'estado', 'activo', 'ambiente', 'link', 'id_compania', 'rnc_emisor',
  'almacen', 'usuario', 'observaciones'
];

const tablaConfig = 'configuracion_alanube';
const camposConfigArray = [
  'id_compania', 'rnc_emisor', 'nombre_empresa', 'ambiente',
  'token_api', 'usuario', 'almacen'
];

const tiposElectronicos = [
  { label: 'E31 - Crédito Fiscal', value: 'E31', nombre: 'Factura de Crédito Fiscal Electrónica' },
  { label: 'E32 - Consumo', value: 'E32', nombre: 'Factura de Consumo Electrónica' },
  { label: 'E33 - Débito', value: 'E33', nombre: 'Nota de Débito Electrónica' },
  { label: 'E34 - Crédito', value: 'E34', nombre: 'Nota de Crédito Electrónica' },
  { label: 'E41 - Compras', value: 'E41', nombre: 'Comprobante de Compras Electrónico' },
  { label: 'E43 - Gastos Menores', value: 'E43', nombre: 'Gastos Menores Electrónico' },
  { label: 'E44 - Regímenes Especiales', value: 'E44', nombre: 'Regímenes Especiales Electrónico' },
  { label: 'E45 - Gubernamental', value: 'E45', nombre: 'Comprobante Gubernamental Electrónico' }
];

const endpointsAlanube = {
  sandbox: {
    E31: 'https://sandbox.alanube.co/dom/v1/fiscal-invoices',
    E32: 'https://sandbox.alanube.co/dom/v1/invoices',
    E33: 'https://sandbox.alanube.co/dom/v1/debit-notes',
    E34: 'https://sandbox.alanube.co/dom/v1/credit-notes',
    E41: 'https://sandbox.alanube.co/dom/v1/purchase-invoices',
    E43: 'https://sandbox.alanube.co/dom/v1/minor-expenses',
    E44: 'https://sandbox.alanube.co/dom/v1/special-regime-invoices',
    E45: 'https://sandbox.alanube.co/dom/v1/government-invoices'
  },
  production: {
    E31: 'https://api.alanube.co/dom/v1/fiscal-invoices',
    E32: 'https://api.alanube.co/dom/v1/invoices',
    E33: 'https://api.alanube.co/dom/v1/debit-notes',
    E34: 'https://api.alanube.co/dom/v1/credit-notes',
    E41: 'https://api.alanube.co/dom/v1/purchase-invoices',
    E43: 'https://api.alanube.co/dom/v1/minor-expenses',
    E44: 'https://api.alanube.co/dom/v1/special-regime-invoices',
    E45: 'https://api.alanube.co/dom/v1/government-invoices'
  }
};

const usuarioLocal = ref({});
const data = ref([]);
const searchQuery = ref('');
const visibleCrear = ref(false);
const visibleEditar = ref(false);
const datoscampos = ref({});
const datoscamposCrear = ref({});
const loading = ref(false);
const probandoConexion = ref(false);
const resultadoPrueba = ref(null);
const guardandoConfigGlobal = ref(false);

// Configuracion global Alanube (se guarda por ambiente: sandbox | production)
const configGlobal = ref({
  id_compania: '',
  rnc_emisor: '',
  nombre_empresa: '',
  ambiente: 'sandbox',
  token_api: ''
});

const getStorageKey = () => {
  const amb = configGlobal.value.ambiente || 'sandbox';
  return `alanube_config_${amb}`;
};

const persistirConfigGlobal = () => {
  window.localStorage.setItem(getStorageKey(), JSON.stringify(configGlobal.value));
};

const cargarConfigGlobal = async () => {
  try {
    // Intentar cargar del ambiente actual desde la DB primero
    const rows = await peticionesFetchOffline('getDataAsArray', tablaConfig);
    const rowsArray = Array.isArray(rows) ? rows : [];
    console.log('🗄️ configuracion_alanube DB rows:', rowsArray.map(r => ({ id: r.id, ambiente: r.ambiente, id_compania: r.id_compania, rnc_emisor: r.rnc_emisor, nombre_empresa: r.nombre_empresa, token_api: r.token_api ? r.token_api.slice(0, 30) + '...' : '' })));
    const ambienteActual = configGlobal.value.ambiente || 'sandbox';
    const dbRow = rowsArray.find(r => r.ambiente === ambienteActual);
    if (dbRow) {
      configGlobal.value = {
        ...configGlobal.value,
        id_compania: dbRow.id_compania || '',
        rnc_emisor: dbRow.rnc_emisor || '',
        nombre_empresa: dbRow.nombre_empresa || '',
        ambiente: dbRow.ambiente || ambienteActual,
        token_api: dbRow.token_api || ''
      };
      // Sync to localStorage
      persistirConfigGlobal();
      return;
    }

    // Fallback: cargar de localStorage
    const key = ambienteActual === 'production' ? 'alanube_config_production' : 'alanube_config_sandbox';
    const saved = JSON.parse(window.localStorage.getItem(key) || '{}');
    if (saved && (saved.id_compania || saved.rnc_emisor)) {
      configGlobal.value = {
        ...configGlobal.value,
        ...saved
      };
    }
  } catch {
    // usar defaults
  }
};

const cambiarAmbiente = async () => {
  // Guardar la preferencia de ambiente
  window.localStorage.setItem('alanube_last_ambiente', configGlobal.value.ambiente);
  // Al cambiar ambiente, cargar la config guardada para ese ambiente
  await cargarConfigGlobal();
};

const guardarConfigGlobal = async () => {
  guardandoConfigGlobal.value = true;
  try {
    // Guardar en DB (upsert por ambiente)
    const rows = await peticionesFetchOffline('getDataAsArray', tablaConfig);
    const rowsArray = Array.isArray(rows) ? rows : [];
    const ambienteActual = configGlobal.value.ambiente || 'sandbox';
    const dbRow = rowsArray.find(r => r.ambiente === ambienteActual);
    const payload = {
      ...(dbRow || {}),
      id_compania: configGlobal.value.id_compania || '',
      rnc_emisor: configGlobal.value.rnc_emisor || '',
      nombre_empresa: configGlobal.value.nombre_empresa || '',
      ambiente: ambienteActual,
      token_api: configGlobal.value.token_api || '',
      usuario: usuarioLocal.value.usuario || '',
      almacen: datosEmpresa?.empresa?.nombre || ''
    };
    if (dbRow) {
      await peticionesFetchOffline('updateData', tablaConfig, JSON.stringify(payload));
    } else {
      await peticionesFetchOffline('insertData', tablaConfig, JSON.stringify(payload));
    }
    // Sync to localStorage
    persistirConfigGlobal();

    // Actualizar todos los registros existentes con los datos globales
    if (configGlobal.value.id_compania || configGlobal.value.rnc_emisor) {
      const registros = [...data.value];
      for (const reg of registros) {
        const cambiado = {};
        if (configGlobal.value.id_compania && (!reg.id_compania || reg.id_compania !== configGlobal.value.id_compania)) {
          cambiado.id_compania = configGlobal.value.id_compania;
        }
        if (configGlobal.value.rnc_emisor && (!reg.rnc_emisor || reg.rnc_emisor !== configGlobal.value.rnc_emisor)) {
          cambiado.rnc_emisor = configGlobal.value.rnc_emisor;
        }
        if (Object.keys(cambiado).length > 0) {
          await peticionesFetchOffline('updateData', tabla, JSON.stringify({ ...reg, ...cambiado }));
        }
      }
    }

    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración global actualizada', life: 3000 });
    await fetchData();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
  } finally {
    guardandoConfigGlobal.value = false;
  }
};

const registroBase = (registro = {}) => ({
  ...registro,
  nombre: registro.nombre || '',
  prefijo: String(registro.prefijo || '').toUpperCase(),
  tipo_ecf: registro.tipo_ecf || String(registro.prefijo || '').toUpperCase(),
  descripcion: registro.descripcion || '',
  secuencia_inicial: String(registro.secuencia_inicial || '1'),
  secuencia_final: String(registro.secuencia_final || ''),
  secuencia_actual: String(registro.secuencia_actual || registro.secuencia || registro.secuencia_inicial || '1'),
  secuencia: String(registro.secuencia || registro.secuencia_actual || registro.secuencia_inicial || '1'),
  aprobados: Number(registro.aprobados || 0),
  contador: Number(registro.contador || 0),
  fecha: registro.fecha || nfecha('fecha'),
  fecha_autorizacion: registro.fecha_autorizacion || registro.fecha || nfecha('fecha'),
  expiracion: registro.expiracion || agregarDiasalaFechaActual(365),
  estado: registro.estado || 'ACTIVO',
  activo: registro.activo || 'SI',
  ambiente: registro.ambiente || 'sandbox',
  link: registro.link || '',
  id_compania: registro.id_compania || '',
  rnc_emisor: registro.rnc_emisor || '',
  almacen: registro.almacen || datosEmpresa?.empresa?.nombre || '',
  usuario: registro.usuario || usuarioLocal.value.usuario || '',
  observaciones: registro.observaciones || ''
});

const filteredData = computed(() => {
  if (!searchQuery.value) return data.value;
  return data.value.filter((item) =>
    Object.values(item).some((value) =>
      String(value ?? '').toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});

const aplicarTipo = (target, prefijo) => {
  const tipo = tiposElectronicos.find((item) => item.value === prefijo);
  if (!tipo) return;
  target.prefijo = tipo.value;
  target.tipo_ecf = tipo.value;
  target.nombre = tipo.nombre;
};

const cargarCamposCrear = async () => {
  const base = await arrayToObjetoFromTablaOffline(tabla);
  datoscamposCrear.value = registroBase({
    ...base,
    id_compania: base.id_compania || configGlobal.value.id_compania,
    rnc_emisor: base.rnc_emisor || configGlobal.value.rnc_emisor,
    ambiente: base.ambiente || configGlobal.value.ambiente
  });
  visibleCrear.value = true;
};

const abrirCrear = async () => {
  await cargarCamposCrear();
  visibleCrear.value = true;
};

const abrirEditar = (registro) => {
  datoscampos.value = registroBase({ ...registro });
  visibleEditar.value = true;
};

const guardarNuevo = async () => {
  loading.value = true;
  try {
    const registro = registroBase({ ...datoscamposCrear.value });
    const resultado = await peticionesFetchOffline('insertData', tabla, JSON.stringify(registro));
    if (resultado?.[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Comprobante electrónico creado correctamente', life: 3000 });
      visibleCrear.value = false;
      await fetchData();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el comprobante', life: 3000 });
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
  } finally {
    loading.value = false;
  }
};

const guardarEdicion = async () => {
  loading.value = true;
  try {
    const resultado = await peticionesFetchOffline('updateData', tabla, JSON.stringify(datoscampos.value));
    if (resultado?.[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Comprobante actualizado correctamente', life: 3000 });
      visibleEditar.value = false;
      await fetchData();
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar', life: 3000 });
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
  } finally {
    loading.value = false;
  }
};

const eliminarRegistro = async (registro) => {
  if (!registro?.id) return;
  loading.value = true;
  try {
    const resultado = await peticionesFetchOffline('deleteEntry', tabla, registro.id);
    if (resultado?.[0] === 'ok') {
      toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Comprobante eliminado', life: 3000 });
      await fetchData();
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
  } finally {
    loading.value = false;
  }
};

const probarConexion = async (registro) => {
  probandoConexion.value = true;
  resultadoPrueba.value = null;
  try {
    const ambiente = registro.ambiente || configGlobal.value.ambiente || 'sandbox';
    const prefijo = String(registro.prefijo || 'E31').toUpperCase();
    const endpoint = registro.link || endpointsAlanube[ambiente]?.[prefijo] || endpointsAlanube.sandbox.E31;
    const idCompania = String(registro.id_compania || '').trim();

    const rncEmisor = String(registro.rnc_emisor || '').replace(/\D/g, '') || '133023539';
    const secuencia = String(registro.secuencia_actual || '1');

    const token = configGlobal.value.token_api || 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImU1ZTEzYzFiLTJiYTgtNGYzOC1hNWMxLTQ5NWEzMjk3ZjE4ZiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZTIwYTFlYi1kYjJkLTQ0YTMtOTM3ZC1hMTk1YWQ4M2NjMmQiLCJlbWFpbCI6InRtcG9zc3JsQGFsYW51YmUuY28iLCJzY29wZSI6ImMuci51OmFwaWRvbV9mdWxsX2FjY2VzcyBnZW5lcmljIiwibGFzdFVwZGF0ZWRQYXNzd29yZCI6IjIwMjYtMDMtMjYgMjI6Mzc6MDkiLCJpc3MiOiJzYW5kLWF1dGgtYXBpLmFsZWdyYS5jb20iLCJpYXQiOjE3NzQ1NjQ2MzgsImV4cCI6MTE3MTczNDAyMiwianRpIjoiZTY4N2FhMDMtODc2NS00YWVmLWE5NTgtZTkwMzQzM2FiNjM2In0.UXoIZIoyhbXUlUFC-e7zcPed503KPm04nkq75C71KXJAlIhvpHwUvUszTnMuWfLLmPj_SVjuqnIkI7PRHSJ0awNmNq5H7fajjQnigNviTEfhxVkN-XiAj2UvLY5DZtBKbcDMdVvRO1K8XAExy-oHH43zuj1Tzx6hOhdIqdOmvmOEUda6VZ-gjUnI2RPY0ha2AgfL56lxx2pZSTQ_CB0cTvNU-YgO5Z6PZNW7krGRGkWalVUaZykJOZd1cWYe_g1fB143nsqiWj7PZIN6McjBXzt5iKGDDFmZI7fD1FsK75frBgLmIgPKWLrABhb9V1NbTIrHxNoJSQunFaLC-3VmAQ';

    const fechaHoy = new Date().toISOString().split('T')[0];

    const payload = {
      company: idCompania ? { id: idCompania } : { rnc: rncEmisor, companyName: 'Test Company' },
      idDoc: {
        incomeType: 1,
        paymentType: 1,
        encf: `${prefijo}${secuencia.padStart(10, '0')}`,
        sequenceDueDate: agregarDiasalaFechaActual(365),
        paymentFormsTable: [{ paymentMethod: 1, paymentAmount: 1 }]
      },
      sender: {
        rnc: rncEmisor,
        companyName: 'Test Company',
        address: 'Test Address',
        stampDate: fechaHoy
      },
      totals: { totalTaxedAmount: 0.15, totalAmount: 1 },
      itemDetails: [{
        lineNumber: 1,
        billingIndicator: 1,
        itemName: 'Producto de prueba',
        itemDescription: 'Prueba de conexión Alanube',
        goodServiceIndicator: 1,
        quantityItem: 1,
        unitPriceItem: 1,
        itemAmount: 1
      }]
    };

    if (prefijo === 'E31') {
      payload.buyer = { rnc: rncEmisor, companyName: 'Test Buyer' };
    }

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    resultadoPrueba.value = { exito: true, data: response.data };
    toast.add({ severity: 'success', summary: 'Conexión Exitosa', detail: `Factura de prueba creada: ${response.data.encf || response.data.documentNumber}`, life: 5000 });
  } catch (error) {
    const errData = error.response?.data;
    resultadoPrueba.value = { exito: false, error: errData || error.message };
    toast.add({ severity: 'error', summary: 'Error de Conexión', detail: errData?.errors?.[0]?.message || error.message, life: 8000 });
  } finally {
    probandoConexion.value = false;
  }
};

const consultarCompaniaAlanube = async () => {
  guardandoConfigGlobal.value = true;
  resultadoPrueba.value = null;
  try {
    const ambiente = configGlobal.value.ambiente || 'sandbox';
    const baseUrl = ambiente === 'production'
      ? 'https://api.alanube.co/dom/v1/company'
      : 'https://sandbox.alanube.co/dom/v1/company';

    const token = configGlobal.value.token_api || 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImU1ZTEzYzFiLTJiYTgtNGYzOC1hNWMxLTQ5NWEzMjk3ZjE4ZiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZTIwYTFlYi1kYjJkLTQ0YTMtOTM3ZC1hMTk1YWQ4M2NjMmQiLCJlbWFpbCI6InRtcG9zc3JsQGFsYW51YmUuY28iLCJzY29wZSI6ImMuci51OmFwaWRvbV9mdWxsX2FjY2VzcyBnZW5lcmljIiwibGFzdFVwZGF0ZWRQYXNzd29yZCI6IjIwMjYtMDMtMjYgMjI6Mzc6MDkiLCJpc3MiOiJzYW5kLWF1dGgtYXBpLmFsZWdyYS5jb20iLCJpYXQiOjE3NzQ1NjQ2MzgsImV4cCI6MTE3MTczNDAyMiwianRpIjoiZTY4N2FhMDMtODc2NS00YWVmLWE5NTgtZTkwMzQzM2FiNjM2In0.UXoIZIoyhbXUlUFC-e7zcPed503KPm04nkq75C71KXJAlIhvpHwUvUszTnMuWfLLmPj_SVjuqnIkI7PRHSJ0awNmNq5H7fajjQnigNviTEfhxVkN-XiAj2UvLY5DZtBKbcDMdVvRO1K8XAExy-oHH43zuj1Tzx6hOhdIqdOmvmOEUda6VZ-gjUnI2RPY0ha2AgfL56lxx2pZSTQ_CB0cTvNU-YgO5Z6PZNW7krGRGkWalVUaZykJOZd1cWYe_g1fB143nsqiWj7PZIN6McjBXzt5iKGDDFmZI7fD1FsK75frBgLmIgPKWLrABhb9V1NbTIrHxNoJSQunFaLC-3VmAQ';

    const response = await axios.get(baseUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const company = response.data;
    resultadoPrueba.value = { exito: true, data: company };

    if (company.id) {
      configGlobal.value.id_compania = company.id;
    }
    if (company.companyName || company.name) {
      configGlobal.value.nombre_empresa = company.companyName || company.name;
    }
    if (company.companyIdentification || company.rnc) {
      configGlobal.value.rnc_emisor = String(company.companyIdentification || company.rnc || '').replace(/\D/g, '');
    }
    persistirConfigGlobal();

    toast.add({ severity: 'success', summary: 'Compañía Encontrada', detail: `ID: ${company.id} | ${company.companyName || company.name}`, life: 5000 });
  } catch (error) {
    resultadoPrueba.value = { exito: false, error: error.response?.data || error.message };
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.errors?.[0]?.message || error.message, life: 8000 });
  } finally {
    guardandoConfigGlobal.value = false;
  }
};

const fetchData = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', tabla);
    data.value = Array.isArray(response) ? response : [];
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los comprobantes', life: 3000 });
  }
};

const getEstadoSeverity = (estado) => {
  const map = { ACTIVO: 'success', INACTIVO: 'warn', VENCIDO: 'danger' };
  return map[estado] || 'secondary';
};

const getEndpointUrl = (registro) => {
  if (registro.link) return registro.link;
  const ambiente = registro.ambiente || configGlobal.value.ambiente || 'sandbox';
  const prefijo = String(registro.prefijo || 'E31').toUpperCase();
  return endpointsAlanube[ambiente]?.[prefijo] || endpointsAlanube.sandbox.E31;
};

const resetLink = (target) => {
  const ambiente = target.ambiente || configGlobal.value.ambiente || 'sandbox';
  const prefijo = String(target.prefijo || 'E31').toUpperCase();
  target.link = endpointsAlanube[ambiente]?.[prefijo] || endpointsAlanube.sandbox.E31;
};

const getAmbienteSeverity = (ambiente) => {
  return ambiente === 'production' ? 'danger' : 'info';
};

onMounted(async () => {
  usuarioLocal.value = datosEmpresa?.usuario || {};

  // Cargar el ultimo ambiente usado, o sandbox por defecto
  const lastAmbiente = window.localStorage.getItem('alanube_last_ambiente') || 'sandbox';
  configGlobal.value.ambiente = lastAmbiente;

  const datosJSON = await envioElectron('datosarchivo');

  await crearTablaSiNoExisteOffline(tabla, camposArray, toast);
  await crearTablaSiNoExisteOffline(tablaConfig, camposConfigArray, toast);
  // Cargar config desde DB, con fallback a localStorage
  await cargarConfigGlobal();
  await fetchData();
});
</script>

<template>
  <div class="space-y-6 p-4 md:p-6">
    <!-- Header -->
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="m-0 text-sm font-semibold text-blue-600 dark:text-blue-400">FACTURACIÓN ELECTRÓNICA</p>
        <h2 class="m-0 text-2xl font-bold text-slate-800 dark:text-slate-100">Configuración Alanube</h2>
        <p class="m-0 text-sm text-slate-500">Configure los comprobantes electrónicos para la DGII vía A La Nube (Alanube)</p>
      </div>
      <div class="flex gap-2">
        <Button label="Nuevo Comprobante" icon="pi pi-plus" severity="success" @click="abrirCrear" />
        <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" outlined @click="fetchData" />
        <Button
          label="Volver a Vender"
          icon="pi pi-arrow-left"
          severity="info"
          outlined
          @click="router.push('/vender')"
        />
      </div>
    </div>

    <!-- Configuración Global de la Compañía -->
    <div class="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/20">
      <div class="flex items-center gap-2 mb-4">
        <i class="pi pi-cog text-indigo-600 text-xl"></i>
        <h3 class="text-lg font-bold text-indigo-700 dark:text-indigo-400">Datos de la Compañía (Alanube)</h3>
        <Tag value="Global" severity="info" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div class="field">
          <label>ID Compañía</label>
          <InputText v-model="configGlobal.id_compania" placeholder="01KQA15JVY7KBGZRQS9B1C5DQR" fluid />
        </div>
        <div class="field">
          <label>RNC Emisor</label>
          <InputText v-model="configGlobal.rnc_emisor" placeholder="133023539" fluid />
        </div>
        <div class="field">
          <label>Nombre Empresa</label>
          <InputText v-model="configGlobal.nombre_empresa" placeholder="TM POS SRL" fluid />
        </div>
        <div class="field">
          <label>Ambiente</label>
          <Dropdown v-model="configGlobal.ambiente" :options="['sandbox', 'production']" fluid @change="cambiarAmbiente" />
        </div>
        <div class="field">
          <label>Token API</label>
          <InputText v-model="configGlobal.token_api" placeholder="eyJh..." fluid />
        </div>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <Button label="Guardar Configuración" icon="pi pi-save" severity="indigo" :loading="guardandoConfigGlobal" @click="guardarConfigGlobal" />
        <Button label="Cargar desde Alanube" icon="pi pi-cloud-download" severity="info" outlined :loading="guardandoConfigGlobal" @click="consultarCompaniaAlanube" />
        <small class="text-slate-400">Usa el token para obtener ID, RNC y nombre automáticamente</small>
      </div>
    </div>

    <!-- Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-server text-blue-600 text-xl"></i>
          <h3 class="font-bold text-blue-700 dark:text-blue-400">Endpoints</h3>
        </div>
        <p class="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
          <strong>Sandbox:</strong> sandbox.alanube.co/dom/v1/<br />
          <strong>Producción:</strong> api.alanube.co/dom/v1/<br />
          <span class="block mt-1 opacity-70">Fiscal: /fiscal-invoices | Consumo: /invoices</span>
        </p>
      </div>

      <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-id-card text-emerald-600 text-xl"></i>
          <h3 class="font-bold text-emerald-700 dark:text-emerald-400">ID Compañía</h3>
        </div>
        <p class="text-xs text-emerald-600 dark:text-emerald-300 leading-relaxed">
          El <strong>company.id</strong> es el identificador único de tu empresa en Alanube.<br />
          <span class="block mt-1 opacity-70">Ej: 01KMP4Q97TM26VRK0MZTEPT15M</span>
        </p>
      </div>

      <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-info-circle text-amber-600 text-xl"></i>
          <h3 class="font-bold text-amber-700 dark:text-amber-400">Requisitos DGII</h3>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-300 leading-relaxed">
          <strong>E31 (Fiscal):</strong> Requiere RNC del comprador<br />
          <strong>E32 (Consumo):</strong> No requiere comprador<br />
          <span class="block mt-1 opacity-70">Certificado digital debe estar delegado en DGII</span>
        </p>
      </div>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-2">
      <IconField iconPosition="left" class="flex-1">
        <InputIcon><i class="pi pi-search" /></InputIcon>
        <InputText v-model="searchQuery" placeholder="Buscar comprobante..." class="w-full" />
      </IconField>
      <Button v-if="searchQuery" icon="pi pi-times" severity="secondary" text rounded @click="searchQuery = ''" />
    </div>

    <!-- Data Table -->
    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <DataTable
        :value="filteredData"
        dataKey="id"
        :loading="loading"
        scrollable
        scrollHeight="500px"
        size="small"
        resizableColumns
        columnResizeMode="fit"
        :rows="20"
        paginator
      >
        <Column field="prefijo" header="TIPO" style="min-width: 80px">
          <template #body="slotProps">
            <Tag :value="slotProps.data.prefijo" :severity="slotProps.data.prefijo === 'E31' ? 'info' : 'success'" />
          </template>
        </Column>
        <Column field="nombre" header="NOMBRE" style="min-width: 180px" />
        <Column field="id_compania" header="ID COMPAÑÍA" style="min-width: 200px">
          <template #body="slotProps">
            <span class="font-mono text-xs">{{ slotProps.data.id_compania || '—' }}</span>
          </template>
        </Column>
        <Column field="link" header="ENDPOINT" style="min-width: 200px">
          <template #body="slotProps">
            <span class="text-xs font-mono truncate block max-w-[200px]" :title="getEndpointUrl(slotProps.data)">{{ getEndpointUrl(slotProps.data) }}</span>
          </template>
        </Column>
        <Column field="rnc_emisor" header="RNC" style="min-width: 120px" />
        <Column field="secuencia_actual" header="SECUENCIA" style="min-width: 120px">
          <template #body="slotProps">
            <span class="font-mono text-xs">{{ slotProps.data.prefijo }}{{ String(slotProps.data.secuencia_actual || '0').padStart(10, '0') }}</span>
          </template>
        </Column>
        <Column field="ambiente" header="AMBIENTE" style="min-width: 100px">
          <template #body="slotProps">
            <Tag :value="slotProps.data.ambiente" :severity="getAmbienteSeverity(slotProps.data.ambiente)" />
          </template>
        </Column>
        <Column field="estado" header="ESTADO" style="min-width: 100px">
          <template #body="slotProps">
            <Tag :value="slotProps.data.estado" :severity="getEstadoSeverity(slotProps.data.estado)" />
          </template>
        </Column>
        <Column field="contador" header="ENVIADOS" style="min-width: 90px" />
        <Column header="ACCIONES" style="min-width: 160px">
          <template #body="slotProps">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" size="small" text rounded severity="info" @click="abrirEditar(slotProps.data)" v-tooltip.top="'Editar'" />
              <Button icon="pi pi-send" size="small" text rounded severity="warning" :loading="probandoConexion" @click="probarConexion(slotProps.data)" v-tooltip.top="'Probar conexión'" />
              <Button icon="pi pi-trash" size="small" text rounded severity="danger" @click="eliminarRegistro(slotProps.data)" v-tooltip.top="'Eliminar'" />
            </div>
          </template>
        </Column>
        <template #empty>
          <div class="py-8 text-center text-slate-500">
            <i class="pi pi-inbox text-4xl mb-3 block text-slate-300"></i>
            <p class="m-0">No hay comprobantes configurados</p>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Resultado de prueba -->
    <div v-if="resultadoPrueba" class="rounded-xl border p-4" :class="resultadoPrueba.exito ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'">
      <div class="flex items-center gap-2 mb-2">
        <i :class="resultadoPrueba.exito ? 'pi pi-check-circle text-emerald-600' : 'pi pi-times-circle text-red-600'" class="text-xl"></i>
        <h3 class="font-bold" :class="resultadoPrueba.exito ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'">
          {{ resultadoPrueba.exito ? 'Prueba Exitosa' : 'Error en Prueba' }}
        </h3>
      </div>
      <pre class="text-xs overflow-auto max-h-60 p-3 rounded bg-white dark:bg-slate-800 border">{{ JSON.stringify(resultadoPrueba.data || resultadoPrueba.error, null, 2) }}</pre>
    </div>

    <!-- Modal Crear -->
    <Dialog v-model:visible="visibleCrear" modal header="Nuevo Comprobante Electrónico" :style="{ width: '44rem', maxWidth: '95vw' }">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="field">
          <label>Tipo de Comprobante</label>
          <Dropdown v-model="datoscamposCrear.prefijo" :options="tiposElectronicos" optionLabel="label" optionValue="value" placeholder="Seleccionar tipo" fluid @change="aplicarTipo(datoscamposCrear, $event.value)" />
        </div>
        <div class="field">
          <label>Descripción</label>
          <InputText v-model="datoscamposCrear.descripcion" fluid />
        </div>
        <div class="field">
          <label>ID Compañía (Alanube)</label>
          <InputText v-model="datoscamposCrear.id_compania" placeholder="01KMP4Q97TM26VRK0MZTEPT15M" fluid />
        </div>
        <div class="field">
          <label>RNC Emisor</label>
          <InputText v-model="datoscamposCrear.rnc_emisor" placeholder="133023539" fluid />
        </div>
        <div class="field">
          <label>Secuencia Inicial</label>
          <InputText v-model="datoscamposCrear.secuencia_inicial" placeholder="00000001" fluid />
        </div>
        <div class="field">
          <label>Secuencia Final</label>
          <InputText v-model="datoscamposCrear.secuencia_final" placeholder="00001000" fluid />
        </div>
        <div class="field">
          <label>Secuencia Actual</label>
          <InputText v-model="datoscamposCrear.secuencia_actual" placeholder="00000001" fluid />
        </div>
        <div class="field">
          <label>Aprobados</label>
          <InputNumber v-model="datoscamposCrear.aprobados" :useGrouping="false" fluid />
        </div>
        <div class="field">
          <label>Ambiente</label>
          <Dropdown v-model="datoscamposCrear.ambiente" :options="['sandbox', 'production']" fluid />
        </div>
        <div class="field">
          <label>Estado</label>
          <Dropdown v-model="datoscamposCrear.estado" :options="['ACTIVO', 'INACTIVO', 'VENCIDO']" fluid />
        </div>
        <div class="field">
          <label>Link Personalizado</label>
          <div class="flex gap-1">
            <InputText v-model="datoscamposCrear.link" placeholder="URL personalizada (opcional)" fluid class="flex-1" />
            <Button icon="pi pi-refresh" severity="warning" text rounded @click="resetLink(datoscamposCrear)" v-tooltip.top="'Restablecer endpoint por defecto'" />
          </div>
        </div>
        <div class="field">
          <label>Almacén</label>
          <InputText v-model="datoscamposCrear.almacen" fluid />
        </div>
        <div class="field md:col-span-2">
          <label>Observaciones</label>
          <Textarea v-model="datoscamposCrear.observaciones" rows="2" fluid />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" outlined @click="visibleCrear = false" />
        <Button label="Guardar" severity="success" icon="pi pi-check" :loading="loading" @click="guardarNuevo" />
      </template>
    </Dialog>

    <!-- Modal Editar -->
    <Dialog v-model:visible="visibleEditar" modal header="Editar Comprobante Electrónico" :style="{ width: '44rem', maxWidth: '95vw' }">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="field">
          <label>Tipo</label>
          <InputText :value="datoscampos.prefijo" readonly fluid />
        </div>
        <div class="field">
          <label>Descripción</label>
          <InputText v-model="datoscampos.descripcion" fluid />
        </div>
        <div class="field">
          <label>ID Compañía (Alanube)</label>
          <InputText v-model="datoscampos.id_compania" placeholder="01KMP4Q97TM26VRK0MZTEPT15M" fluid />
        </div>
        <div class="field">
          <label>RNC Emisor</label>
          <InputText v-model="datoscampos.rnc_emisor" fluid />
        </div>
        <div class="field">
          <label>Secuencia Inicial</label>
          <InputText v-model="datoscampos.secuencia_inicial" placeholder="00000001" fluid />
        </div>
        <div class="field">
          <label>Secuencia Final</label>
          <InputText v-model="datoscampos.secuencia_final" placeholder="00001000" fluid />
        </div>
        <div class="field">
          <label>Secuencia Actual</label>
          <InputText v-model="datoscampos.secuencia_actual" placeholder="00000001" fluid />
        </div>
        <div class="field">
          <label>Aprobados</label>
          <InputNumber v-model="datoscampos.aprobados" :useGrouping="false" fluid />
        </div>
        <div class="field">
          <label>Ambiente</label>
          <Dropdown v-model="datoscampos.ambiente" :options="['sandbox', 'production']" fluid />
        </div>
        <div class="field">
          <label>Estado</label>
          <Dropdown v-model="datoscampos.estado" :options="['ACTIVO', 'INACTIVO', 'VENCIDO']" fluid />
        </div>
        <div class="field">
          <label>Link Personalizado</label>
          <div class="flex gap-1">
            <InputText v-model="datoscampos.link" fluid class="flex-1" />
            <Button icon="pi pi-refresh" severity="warning" text rounded @click="resetLink(datoscampos)" v-tooltip.top="'Restablecer endpoint por defecto'" />
          </div>
        </div>
        <div class="field">
          <label>Almacén</label>
          <InputText v-model="datoscampos.almacen" fluid />
        </div>
        <div class="field">
          <label>Endpoint usado</label>
          <InputText :value="getEndpointUrl(datoscampos)" readonly fluid class="font-mono text-xs" />
        </div>
        <div class="field md:col-span-2">
          <label>Observaciones</label>
          <Textarea v-model="datoscampos.observaciones" rows="2" fluid />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" outlined @click="visibleEditar = false" />
        <Button label="Guardar" severity="success" icon="pi pi-check" :loading="loading" @click="guardarEdicion" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.field label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--p-text-color);
}
</style>
