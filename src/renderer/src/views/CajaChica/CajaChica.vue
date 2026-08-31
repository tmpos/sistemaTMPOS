<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from "primevue/usetoast";
import {
  envioElectron,
  encryptarPassword,
  nfecha,
  formatearFecha,
  crearTablaSiNoExiste,
  crearTablaSiNoExisteOffline,
  peticionesFetchOffline
} from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const toast = useToast();
const router = useRouter();
const datosEmpresa = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref(null);
const loading = ref(false);
const usuarioLocal = ref({});

const camposArray = ["tipo", "monto", "descripcion", "categoria", "metodo_pago", "referencia", "fecha", "hora", "cajero", "turno", "mes", "year", "usuario", "cuenta_contable", "beneficiario", "documento", "estado", "asiento_id"];

const transacciones = ref([]);
const cuentasContables = ref([]);
const cuentaActiva = ref(null);
const proveedores = ref([]);
const cuentasPagar = ref([]);
const gastosFijos = ref([]);
const visiblePagoGastoFijo = ref(false);
const gastoFijoSeleccionado = ref(null);
const montoPagoGastoFijo = ref(0);

const saldoMinimo = ref(0);
const visibleConfigAlerta = ref(false);
const visibleReposicion = ref(false);
const nuevaReposicion = ref({ monto: 0, descripcion: '', referencia: '' });
const presupuestoMensual = ref(0);
const visibleConfigPresupuesto = ref(false);

const rangoFecha = ref([]);
const busqueda = ref('');
const tipoFilter = ref('');
const categoriaFilter = ref('');
const metodoPagoFilter = ref('');
const estadoFilter = ref('');
const cuentaFilter = ref('');

const visibleNuevaTransaccion = ref(false);
const visibleNuevoPago = ref(false);
const visibleNuevaCompra = ref(false);
const visibleNuevoProveedorCompra = ref(false);
const guardandoProveedorCompra = ref(false);
const visibleDetalle = ref(false);
const detalleTransaccion = ref(null);
const activeTab = ref(0);
const dataLoaded = ref(false);

const nuevaTransaccion = ref({
  tipo: 'EGRESO',
  monto: 0,
  descripcion: '',
  categoria: 'GASTOS_OPERATIVOS',
  metodo_pago: 'EFECTIVO',
  referencia: '',
  fecha: nfecha('fecha'),
  hora: nfecha('hora'),
  cajero: '',
  turno: '',
  mes: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  usuario: '',
  cuenta_contable: '',
  beneficiario: '',
  documento: '',
  estado: 'APROBADO',
  asiento_id: ''
});

const nuevoPago = ref({
  proveedor: '',
  monto: 0,
  concepto: '',
  metodo_pago: 'EFECTIVO',
  referencia: '',
  factura_ref: '',
  fecha: nfecha('fecha'),
  hora: nfecha('hora'),
  cuenta_contable: '',
  cajero: '',
  turno: '',
  mes: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  usuario: '',
  estado: 'APROBADO'
});

const nuevaCompra = ref({
  proveedor: '',
  items: [],
  total: 0,
  metodo_pago: 'EFECTIVO',
  referencia: '',
  factura_ref: '',
  fecha: nfecha('fecha'),
  hora: nfecha('hora'),
  cuenta_contable: '',
  cajero: '',
  turno: '',
  mes: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  usuario: '',
  estado: 'APROBADO'
});

const nuevoProveedorCompra = ref({
  nombre: '',
  rnc: '',
  telefono: '',
  email: '',
  encargado: '',
  cuenta_bancaria: '',
  direccion: ''
});

const nuevoItem = ref({
  descripcion: '',
  cantidad: 1,
  precio_unitario: 0,
  total: 0
});

const tiposTransaccion = [
  { label: 'Ingreso', value: 'INGRESO', icon: 'pi-arrow-up', color: 'success' },
  { label: 'Egreso', value: 'EGRESO', icon: 'pi-arrow-down', color: 'danger' }
];

const categorias = [
  { label: 'Gastos Operativos', value: 'GASTOS_OPERATIVOS', tipo: 'EGRESO' },
  { label: 'Compras Menores', value: 'COMPRAS_MENORES', tipo: 'EGRESO' },
  { label: 'Pagos a Proveedores', value: 'PAGOS_PROVEEDORES', tipo: 'EGRESO' },
  { label: 'Servicios Públicos', value: 'SERVICIOS_PUBLICOS', tipo: 'EGRESO' },
  { label: 'Mantenimiento', value: 'MANTENIMIENTO', tipo: 'EGRESO' },
  { label: 'Papelería', value: 'PAPELERIA', tipo: 'EGRESO' },
  { label: 'Transporte', value: 'TRANSPORTE', tipo: 'EGRESO' },
  { label: 'Alimentación', value: 'ALIMENTACION', tipo: 'EGRESO' },
  { label: 'Combustible', value: 'COMBUSTIBLE', tipo: 'EGRESO' },
  { label: 'Gastos Fijos', value: 'GASTOS_FIJOS', tipo: 'EGRESO' },
  { label: 'Otros Gastos', value: 'OTROS_GASTOS', tipo: 'EGRESO' },
  { label: 'Reembolsos', value: 'REEMBOLSOS', tipo: 'INGRESO' },
  { label: 'Depósito Inicial', value: 'DEPOSITO_INICIAL', tipo: 'INGRESO' },
  { label: 'Transferencia Caja Principal', value: 'TRANSFERENCIA_CAJA', tipo: 'INGRESO' },
  { label: 'Reposición de Fondos', value: 'REPOSICION_FONDOS', tipo: 'INGRESO' },
  { label: 'Otros Ingresos', value: 'OTROS_INGRESOS', tipo: 'INGRESO' }
];

const metodosPago = [
  { label: 'Efectivo', value: 'EFECTIVO' },
  { label: 'Transferencia', value: 'TRANSFERENCIA' },
  { label: 'Tarjeta Débito/Crédito', value: 'TARJETA' },
  { label: 'Cheque', value: 'CHEQUE' }
];

const estadosTransaccion = [
  { label: 'Pendiente', value: 'PENDIENTE', severity: 'warn' },
  { label: 'Aprobado', value: 'APROBADO', severity: 'success' },
  { label: 'Rechazado', value: 'RECHAZADO', severity: 'danger' },
  { label: 'Anulado', value: 'ANULADO', severity: 'secondary' }
];

const categoriasFiltradas = computed(() => {
  return categorias.filter(c => c.tipo === nuevaTransaccion.value.tipo);
});

const cuentasActivos = computed(() => {
  return cuentasContables.value.filter(c =>
    c.categoria === 'ACTIVOS'
  );
});

const transaccionesDeCuentaActiva = computed(() => {
  if (!cuentaActiva.value) return [];
  return transacciones.value.filter(t =>
    t.cuenta_contable === cuentaActiva.value.nombre
  );
});

const transaccionesFiltradas = computed(() => {
  const data = transaccionesDeCuentaActiva.value;
  if (!data || data.length === 0) return [];

  let filtered = [...data];

  if (rangoFecha.value && rangoFecha.value.length === 2) {
    const fechaInicio = new Date(rangoFecha.value[0]);
    const fechaFin = new Date(rangoFecha.value[1]);
    fechaFin.setHours(23, 59, 59, 999);
    filtered = filtered.filter(t => {
      const f = new Date(t.fecha);
      return f >= fechaInicio && f <= fechaFin;
    });
  }

  if (tipoFilter.value) filtered = filtered.filter(t => t.tipo === tipoFilter.value);
  if (categoriaFilter.value) filtered = filtered.filter(t => t.categoria === categoriaFilter.value);
  if (metodoPagoFilter.value) filtered = filtered.filter(t => t.metodo_pago === metodoPagoFilter.value);
  if (estadoFilter.value) filtered = filtered.filter(t => t.estado === estadoFilter.value);

  if (busqueda.value) {
    const q = busqueda.value.toLowerCase();
    filtered = filtered.filter(t =>
      (t.descripcion || '').toLowerCase().includes(q) ||
      (t.referencia || '').toLowerCase().includes(q) ||
      (t.categoria || '').toLowerCase().includes(q) ||
      (t.beneficiario || '').toLowerCase().includes(q)
    );
  }

  return filtered.sort((a, b) => new Date(b.fecha + ' ' + b.hora) - new Date(a.fecha + ' ' + a.hora));
});

const saldoEnCuenta = computed(() => {
  if (!cuentaActiva.value) return 0;
  return parseFloat(cuentaActiva.value.saldo || 0);
});

const totalIngresosCuenta = computed(() => {
  return transaccionesDeCuentaActiva.value
    .filter(t => t.tipo === 'INGRESO')
    .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
});

const totalEgresosCuenta = computed(() => {
  return transaccionesDeCuentaActiva.value
    .filter(t => t.tipo === 'EGRESO')
    .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
});

const saldoCalculado = computed(() => {
  if (!cuentaActiva.value) return 0;
  const inicial = parseFloat(cuentaActiva.value.saldo || 0);
  const ingresos = transacciones.value
    .filter(t => t.tipo === 'INGRESO' && t.cuenta_contable === cuentaActiva.value.nombre)
    .reduce((s, t) => s + parseFloat(t.monto || 0), 0);
  const egresos = transacciones.value
    .filter(t => t.tipo === 'EGRESO' && t.cuenta_contable === cuentaActiva.value.nombre)
    .reduce((s, t) => s + parseFloat(t.monto || 0), 0);
  return inicial + ingresos - egresos;
});

const gastosPorCategoria = computed(() => {
  const gastos = transaccionesFiltradas.value.filter(t => t.tipo === 'EGRESO');
  const resumen = {};
  gastos.forEach(t => {
    const cat = t.categoria || 'OTROS_GASTOS';
    if (!resumen[cat]) resumen[cat] = 0;
    resumen[cat] += parseFloat(t.monto || 0);
  });
  return Object.entries(resumen)
    .map(([categoria, total]) => ({ categoria, total: total.toFixed(2) }))
    .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
});

const totalTransacciones = computed(() => transaccionesFiltradas.value.length);
const totalTransaccionesCuenta = computed(() => transaccionesDeCuentaActiva.value.length);

const pagosDelMes = computed(() => {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const yearActual = hoy.getFullYear();
  return transaccionesDeCuentaActiva.value.filter(t =>
    t.tipo === 'EGRESO' &&
    t.categoria === 'PAGOS_PROVEEDORES' &&
    parseInt(t.mes) === mesActual &&
    parseInt(t.year) === yearActual
  );
});

const totalPagosMes = computed(() =>
  pagosDelMes.value.reduce((sum, t) => sum + parseFloat(t.monto || 0), 0)
);

const comprasDelMes = computed(() => {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const yearActual = hoy.getFullYear();
  return transaccionesDeCuentaActiva.value.filter(t =>
    t.tipo === 'EGRESO' &&
    t.categoria === 'COMPRAS_MENORES' &&
    parseInt(t.mes) === mesActual &&
    parseInt(t.year) === yearActual
  );
});

const totalComprasMes = computed(() =>
  comprasDelMes.value.reduce((sum, t) => sum + parseFloat(t.monto || 0), 0)
);

const gastosFijosPendientes = computed(() =>
  gastosFijos.value.filter(g => g.saldo > 0)
);

const totalGastosFijosPendientes = computed(() =>
  gastosFijosPendientes.value.reduce((sum, g) => sum + g.saldo, 0)
);

const saldoBajo = computed(() => {
  return saldoMinimo.value > 0 && saldoEnCuenta.value < saldoMinimo.value;
});

const gastosDelMesActual = computed(() => {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const year = hoy.getFullYear();
  return transaccionesDeCuentaActiva.value
    .filter(t => t.tipo === 'EGRESO' && parseInt(t.mes) === mes && parseInt(t.year) === year && t.estado !== 'ANULADO')
    .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
});

const porcentajePresupuesto = computed(() => {
  if (!presupuestoMensual.value || presupuestoMensual.value <= 0) return 0;
  return Math.min(100, (gastosDelMesActual.value / presupuestoMensual.value) * 100);
});

const presupuestoExcedido = computed(() => {
  return presupuestoMensual.value > 0 && gastosDelMesActual.value > presupuestoMensual.value;
});

document.body.classList.add('sidebar-close');

onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    link.value = datosJSON.VITE_LINKURL;
    api.value = datosJSON.VITE_LINK_API;
    token.value = datosJSON.VITE_TOKEN;
    tokenCifrado.value = await encryptarPassword(token.value, 10);

    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(link.value + api.value);
    }

    try {
      await crearTablaSiNoExiste(link.value, api.value, 'caja_chica', camposArray, tokenCifrado.value, toast);
    } catch (e) { console.warn('Online table creation skipped:', e); }
    try {
      await crearTablaSiNoExisteOffline('caja_chica', camposArray, toast);
    } catch (e) { console.warn('Offline table creation skipped:', e); }
    try {
      await crearTablaSiNoExiste(link.value, api.value, 'datos_config', ["id", "nombre", "valor", "created_at", "updated_at"], tokenCifrado.value, toast);
    } catch (e) { console.warn('Online datos_config creation skipped:', e); }
    try {
      await crearTablaSiNoExisteOffline('datos_config', ["id", "nombre", "valor", "created_at", "updated_at"], toast);
    } catch (e) { console.warn('Offline datos_config creation skipped:', e); }
    try {
      await crearTablaSiNoExiste(link.value, api.value, 'gastosfijos', ["descripcion", "valor", "saldo", "fecha_pago", "alerta", "dias_alerta", "tipo", "cuentaporpagar", "ultimo_pago", "almacen", "estado", "categoria", "proveedor", "impuesto_selectivo_consumo", "otros_impuestos_tasas", "notas", "historial_pagos", "usuario"], tokenCifrado.value, toast);
    } catch (e) { console.warn('Online gastosfijos creation skipped:', e); }
    try {
      await crearTablaSiNoExisteOffline('gastosfijos', ["descripcion", "valor", "saldo", "fecha_pago", "alerta", "dias_alerta", "tipo", "cuentaporpagar", "ultimo_pago", "almacen", "estado", "categoria", "proveedor", "impuesto_selectivo_consumo", "otros_impuestos_tasas", "notas", "historial_pagos", "usuario"], toast);
    } catch (e) { console.warn('Offline gastosfijos creation skipped:', e); }

    usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))?.[0] || {};
    const userInfo = {
      cajero: usuarioLocal.value.nombre || '',
      turno: usuarioLocal.value.token || '',
      usuario: usuarioLocal.value.nombre || ''
    };
    Object.assign(nuevaTransaccion.value, userInfo);
    Object.assign(nuevoPago.value, userInfo);
    Object.assign(nuevaCompra.value, userInfo);

    rangoFecha.value = [];

    await Promise.all([
      cargarTransacciones().catch(e => console.warn('Error cargando transacciones:', e)),
      cargarCuentasContables().catch(e => console.warn('Error cargando cuentas:', e)),
      cargarProveedores().catch(e => console.warn('Error cargando proveedores:', e)),
      cargarCuentasPagar().catch(e => console.warn('Error cargando cuentas x pagar:', e)),
      cargarGastosFijos().catch(e => console.warn('Error cargando gastos fijos:', e))
    ]);

    dataLoaded.value = true;
  } catch (error) {
    console.error('Error al inicializar:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar configuración', life: 3000 });
  }
});

const CONFIG_KEY = 'caja_chica_cuenta_activa_id';

const guardarCuentaActivaEnDB = async (cuentaId) => {
  try {
    const existente = await peticionesFetchOffline('getDataByField', 'datos_config', 'nombre', CONFIG_KEY);
    const payload = JSON.stringify({ nombre: CONFIG_KEY, valor: String(cuentaId) });
    if (existente && Array.isArray(existente) && existente.length > 0) {
      await peticionesFetchOffline('updateData', 'datos_config', JSON.stringify({ id: existente[0].id, valor: String(cuentaId) }));
    } else {
      await peticionesFetchOffline('insertData', 'datos_config', payload);
    }
  } catch (e) {
    console.warn('Error guardando cuenta activa en DB:', e);
  }
};

const cargarCuentaActivaDeDB = async () => {
  try {
    const response = await peticionesFetchOffline('getDataByField', 'datos_config', 'nombre', CONFIG_KEY);
    if (response && Array.isArray(response) && response.length > 0) {
      return response[0].valor;
    }
  } catch (e) {
    console.warn('Error cargando cuenta activa de DB:', e);
  }
  return null;
};

const actualizarSaldoCuenta = async (monto, esIngreso) => {
  if (!cuentaActiva.value || !cuentaActiva.value.id) return;
  try {
    const saldoActual = parseFloat(cuentaActiva.value.saldo || 0);
    const nuevoSaldo = esIngreso ? saldoActual + parseFloat(monto) : saldoActual - parseFloat(monto);
    await peticionesFetchOffline('updateData', 'cuentas', JSON.stringify({ id: cuentaActiva.value.id, saldo: Math.max(0, nuevoSaldo) }));
    cuentaActiva.value = { ...cuentaActiva.value, saldo: Math.max(0, nuevoSaldo) };
  } catch (e) {
    console.warn('Error actualizando saldo de cuenta:', e);
  }
};

watch(cuentaActiva, async (nuevaCuenta) => {
  if (nuevaCuenta && nuevaCuenta.id) {
    localStorage.setItem(CONFIG_KEY, nuevaCuenta.id);
    await guardarCuentaActivaEnDB(nuevaCuenta.id);
    nuevaTransaccion.value.cuenta_contable = nuevaCuenta.nombre;
    nuevoPago.value.cuenta_contable = nuevaCuenta.nombre;
    nuevaCompra.value.cuenta_contable = nuevaCuenta.nombre;
  }
});

watch(cuentasActivos, async (lista) => {
  if (lista.length > 0 && !cuentaActiva.value) {
    let guardada = localStorage.getItem(CONFIG_KEY);
    if (!guardada) {
      guardada = await cargarCuentaActivaDeDB();
    }
    if (guardada) {
      const encontrada = lista.find(c => String(c.id) === String(guardada));
      if (encontrada) { cuentaActiva.value = encontrada; return; }
    }
    cuentaActiva.value = lista[0];
  }
});

watch(cuentaActiva, async (nueva) => {
  if (nueva && nueva.id) {
    await Promise.all([
      cargarConfigAlertas().catch(() => {}),
      cargarPresupuesto().catch(() => {})
    ]);
  }
}, { immediate: true });

const cargarTransacciones = async () => {
  loading.value = true;
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'caja_chica');
    transacciones.value = response || [];
  } catch (error) {
    console.error('Error al cargar transacciones:', error);
  } finally {
    loading.value = false;
  }
};

const cargarCuentasContables = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
    cuentasContables.value = response || [];
  } catch (error) {
    console.error('Error al cargar cuentas:', error);
  }
};

const cargarProveedores = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'proveedores');
    proveedores.value = response || [];
  } catch (error) {
    console.error('Error al cargar proveedores:', error);
  }
};

const abrirNuevoProveedorCompra = () => {
  nuevoProveedorCompra.value = {
    nombre: '',
    rnc: '',
    telefono: '',
    email: '',
    encargado: '',
    cuenta_bancaria: '',
    direccion: ''
  };
  visibleNuevoProveedorCompra.value = true;
};

const guardarNuevoProveedorCompra = async () => {
  const nombre = String(nuevoProveedorCompra.value.nombre || '').trim();
  const rnc = String(nuevoProveedorCompra.value.rnc || '').trim();

  if (!nombre) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Ingrese el nombre del proveedor', life: 3000 });
    return;
  }

  const proveedorDuplicado = proveedores.value.some((proveedor) => {
    const mismoNombre = String(proveedor.nombre || '').trim().toLocaleUpperCase() === nombre.toLocaleUpperCase();
    const mismoRnc = rnc && String(proveedor.rnc || '').trim() === rnc;
    return mismoNombre || mismoRnc;
  });

  if (proveedorDuplicado) {
    toast.add({ severity: 'warn', summary: 'Proveedor existente', detail: 'Ya existe un proveedor con ese nombre o RNC', life: 3000 });
    return;
  }

  guardandoProveedorCompra.value = true;
  try {
    const proveedor = {
      nombre,
      rnc,
      telefono: String(nuevoProveedorCompra.value.telefono || '').trim(),
      email: String(nuevoProveedorCompra.value.email || '').trim(),
      encargado: String(nuevoProveedorCompra.value.encargado || '').trim(),
      cuenta_bancaria: String(nuevoProveedorCompra.value.cuenta_bancaria || '').trim(),
      direccion: String(nuevoProveedorCompra.value.direccion || '').trim(),
      usuario: usuarioLocal.value.nombre || usuarioLocal.value.usuario || ''
    };

    const respuesta = await peticionesFetchOffline('insertData', 'proveedores', JSON.stringify(proveedor));
    if (!Array.isArray(respuesta) || respuesta[0] !== 'ok') {
      throw new Error('La base de datos no confirmó el registro del proveedor');
    }

    await cargarProveedores();
    nuevaCompra.value.proveedor = nombre;
    visibleNuevoProveedorCompra.value = false;
    toast.add({ severity: 'success', summary: 'Proveedor agregado', detail: `${nombre} quedó seleccionado en la compra`, life: 3000 });
  } catch (error) {
    console.error('Error al guardar proveedor desde compra menor:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el proveedor', life: 3000 });
  } finally {
    guardandoProveedorCompra.value = false;
  }
};

const cargarCuentasPagar = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'cuentasxpagar');
    cuentasPagar.value = (response || []).filter(c =>
      parseFloat(c.saldo || 0) > 0 &&
      c.estado !== 'PAGADA' &&
      c.estado !== 'ANULADA'
    );
  } catch (error) {
    console.error('Error al cargar cuentas x pagar:', error);
  }
};

const cargarGastosFijos = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'gastosfijos');
    console.log('[CajaChica] gastosfijos response:', response);
    gastosFijos.value = (response || []).map(g => {
      const saldoNum = parseFloat(g.saldo);
      const valorNum = parseFloat(g.valor);
      g.saldo = (!isNaN(saldoNum) && saldoNum > 0) ? saldoNum : (!isNaN(valorNum) ? valorNum : 0);
      return g;
    });
    console.log('[CajaChica] gastosFijos procesados:', gastosFijos.value.length);
  } catch (error) {
    console.error('Error al cargar gastos fijos:', error);
  }
};

const abrirModalNuevaTransaccion = () => {
  if (!cuentaActiva.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una cuenta contable primero', life: 3000 });
    return;
  }
  nuevaTransaccion.value = {
    tipo: 'EGRESO',
    monto: 0,
    descripcion: '',
    categoria: 'GASTOS_OPERATIVOS',
    metodo_pago: 'EFECTIVO',
    referencia: '',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    cajero: usuarioLocal.value.nombre || '',
    turno: usuarioLocal.value.token || '',
    mes: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    usuario: usuarioLocal.value.nombre || '',
    cuenta_contable: cuentaActiva.value.nombre,
    beneficiario: '',
    documento: '',
    estado: 'APROBADO',
    asiento_id: ''
  };
  visibleNuevaTransaccion.value = true;
};

const guardarTransaccion = async () => {
  if (!cuentaActiva.value || !nuevaTransaccion.value.monto || nuevaTransaccion.value.monto <= 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El monto debe ser mayor a 0', life: 3000 });
    return;
  }
  if (!nuevaTransaccion.value.descripcion) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'La descripción es requerida', life: 3000 });
    return;
  }

  loading.value = true;
  try {
    const payload = { ...nuevaTransaccion.value, cuenta_contable: cuentaActiva.value.nombre };
    if (payload.estado === 'APROBADO') {
      payload.asiento_id = await generarAsientoContable(payload);
    }
    await peticionesFetchOffline('insertData', 'caja_chica', JSON.stringify(payload));
    if (payload.estado === 'APROBADO') {
      await actualizarSaldoCuenta(payload.monto, payload.tipo === 'INGRESO');
    }
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Transacción registrada', life: 3000 });
    visibleNuevaTransaccion.value = false;
    await cargarTransacciones();
  } catch (error) {
    console.error('Error al guardar transacción:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const generarAsientoContable = async (transaccion) => {
  try {
    const cuentaNom = transaccion.cuenta_contable || 'CAJA CHICA';
    const asiento = {
      numero: `CC-${Date.now()}`,
      fecha: transaccion.fecha,
      hora: transaccion.hora,
      asiento: JSON.stringify({
        descripcion: transaccion.descripcion,
        tipo: transaccion.tipo,
        monto: transaccion.monto,
        categoria: transaccion.categoria,
        cuenta: cuentaNom,
        referencia: transaccion.referencia,
        origen: 'CAJA_CHICA',
        origen_id: null
      }),
      usuario: transaccion.usuario
    };
    await peticionesFetchOffline('insertData', 'asientodiario', JSON.stringify(asiento));
    return asiento.numero;
  } catch (error) {
    console.error('Error al generar asiento contable:', error);
    return '';
  }
};

const abrirModalNuevoPago = () => {
  if (!cuentaActiva.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una cuenta contable primero', life: 3000 });
    return;
  }
  nuevoPago.value = {
    proveedor: '',
    monto: 0,
    concepto: '',
    metodo_pago: 'EFECTIVO',
    referencia: '',
    factura_ref: '',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    cuenta_contable: cuentaActiva.value.nombre,
    cajero: usuarioLocal.value.nombre || '',
    turno: usuarioLocal.value.token || '',
    mes: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    usuario: usuarioLocal.value.nombre || '',
    estado: 'APROBADO'
  };
  visibleNuevoPago.value = true;
};

const guardarPago = async () => {
  if (!cuentaActiva.value || !nuevoPago.value.monto || nuevoPago.value.monto <= 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El monto debe ser mayor a 0', life: 3000 });
    return;
  }
  if (!nuevoPago.value.proveedor) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione un proveedor', life: 3000 });
    return;
  }

  loading.value = true;
  try {
    const transaccion = {
      tipo: 'EGRESO',
      monto: nuevoPago.value.monto,
      descripcion: `Pago a proveedor: ${nuevoPago.value.proveedor}${nuevoPago.value.concepto ? ' - ' + nuevoPago.value.concepto : ''}`,
      categoria: 'PAGOS_PROVEEDORES',
      metodo_pago: nuevoPago.value.metodo_pago,
      referencia: nuevoPago.value.referencia || nuevoPago.value.factura_ref,
      fecha: nuevoPago.value.fecha,
      hora: nuevoPago.value.hora,
      cajero: nuevoPago.value.cajero,
      turno: nuevoPago.value.turno,
      mes: nuevoPago.value.mes,
      year: nuevoPago.value.year,
      usuario: nuevoPago.value.usuario,
      cuenta_contable: cuentaActiva.value.nombre,
      beneficiario: nuevoPago.value.proveedor,
      documento: nuevoPago.value.factura_ref,
      estado: nuevoPago.value.estado,
      asiento_id: ''
    };

    if (transaccion.estado === 'APROBADO') {
      transaccion.asiento_id = await generarAsientoContable(transaccion);
    }

    await peticionesFetchOffline('insertData', 'caja_chica', JSON.stringify(transaccion));
    if (transaccion.estado === 'APROBADO') {
      await actualizarSaldoCuenta(transaccion.monto, false);
    }

    if (nuevoPago.value.factura_ref) {
      const factura = cuentasPagar.value.find(c =>
        c.no_factura === nuevoPago.value.factura_ref || c.id == nuevoPago.value.factura_ref
      );
      if (factura) {
        const saldoNuevo = Math.max(0, parseFloat(factura.saldo || 0) - parseFloat(nuevoPago.value.monto));
        await peticionesFetchOffline('updateData', 'cuentasxpagar', JSON.stringify({
          id: factura.id,
          saldo: saldoNuevo,
          estado: saldoNuevo <= 0 ? 'PAGADA' : 'PARCIAL'
        }));
      }
    }

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pago registrado', life: 3000 });
    visibleNuevoPago.value = false;
    await Promise.all([cargarTransacciones(), cargarCuentasPagar()]);
  } catch (error) {
    console.error('Error al guardar pago:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar pago', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const abrirModalNuevaCompra = () => {
  if (!cuentaActiva.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una cuenta contable primero', life: 3000 });
    return;
  }
  nuevaCompra.value = {
    proveedor: '',
    items: [],
    total: 0,
    metodo_pago: 'EFECTIVO',
    referencia: '',
    factura_ref: '',
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    cuenta_contable: cuentaActiva.value.nombre,
    cajero: usuarioLocal.value.nombre || '',
    turno: usuarioLocal.value.token || '',
    mes: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    usuario: usuarioLocal.value.nombre || '',
    estado: 'APROBADO'
  };
  nuevoItem.value = { descripcion: '', cantidad: 1, precio_unitario: 0, total: 0 };
  visibleNuevaCompra.value = true;
};

const guardarCompra = async () => {
  if (!cuentaActiva.value || nuevaCompra.value.items.length === 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Agregue al menos un item', life: 3000 });
    return;
  }
  if (nuevaCompra.value.total <= 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El total debe ser mayor a 0', life: 3000 });
    return;
  }

  loading.value = true;
  try {
    const detalleItems = nuevaCompra.value.items.map(i =>
      `${i.descripcion} x${i.cantidad} @ RD$ ${i.precio_unitario.toFixed(2)}`
    ).join('\n');

    const transaccion = {
      tipo: 'EGRESO',
      monto: nuevaCompra.value.total,
      descripcion: `Compra menor: ${nuevaCompra.value.proveedor || 'Varios'}\n${detalleItems}`,
      categoria: 'COMPRAS_MENORES',
      metodo_pago: nuevaCompra.value.metodo_pago,
      referencia: nuevaCompra.value.referencia || nuevaCompra.value.factura_ref,
      fecha: nuevaCompra.value.fecha,
      hora: nuevaCompra.value.hora,
      cajero: nuevaCompra.value.cajero,
      turno: nuevaCompra.value.turno,
      mes: nuevaCompra.value.mes,
      year: nuevaCompra.value.year,
      usuario: nuevaCompra.value.usuario,
      cuenta_contable: cuentaActiva.value.nombre,
      beneficiario: nuevaCompra.value.proveedor || 'Proveedor varios',
      documento: nuevaCompra.value.factura_ref,
      estado: nuevaCompra.value.estado,
      asiento_id: ''
    };

    if (transaccion.estado === 'APROBADO') {
      transaccion.asiento_id = await generarAsientoContable(transaccion);
    }

    await peticionesFetchOffline('insertData', 'caja_chica', JSON.stringify(transaccion));
    if (transaccion.estado === 'APROBADO') {
      await actualizarSaldoCuenta(transaccion.monto, false);
    }
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Compra registrada', life: 3000 });
    visibleNuevaCompra.value = false;
    await cargarTransacciones();
  } catch (error) {
    console.error('Error al guardar compra:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar compra', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const agregarItemCompra = () => {
  if (!nuevoItem.value.descripcion || nuevoItem.value.cantidad <= 0 || nuevoItem.value.precio_unitario <= 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'Complete todos los campos del item', life: 3000 });
    return;
  }
  nuevoItem.value.total = nuevoItem.value.cantidad * nuevoItem.value.precio_unitario;
  nuevaCompra.value.items.push({ ...nuevoItem.value });
  nuevaCompra.value.total = nuevaCompra.value.items.reduce((sum, item) => sum + item.total, 0);
  nuevoItem.value = { descripcion: '', cantidad: 1, precio_unitario: 0, total: 0 };
};

const eliminarItemCompra = (index) => {
  nuevaCompra.value.items.splice(index, 1);
  nuevaCompra.value.total = nuevaCompra.value.items.reduce((sum, item) => sum + item.total, 0);
};

const abrirModalPagoGastoFijo = (gasto) => {
  gastoFijoSeleccionado.value = gasto;
  montoPagoGastoFijo.value = gasto ? gasto.saldo : 0;
  visiblePagoGastoFijo.value = true;
};

const guardarPagoGastoFijo = async () => {
  if (!cuentaActiva.value || !gastoFijoSeleccionado.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una cuenta y un gasto fijo', life: 3000 });
    return;
  }
  const monto = parseFloat(montoPagoGastoFijo.value);
  if (!monto || monto <= 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El monto debe ser mayor a 0', life: 3000 });
    return;
  }

  loading.value = true;
  try {
    const gasto = gastoFijoSeleccionado.value;
    const saldoActual = gasto.saldo;
    const esCompleto = monto >= saldoActual;
    const montoReal = esCompleto ? saldoActual : monto;

    const transaccion = {
      tipo: 'EGRESO',
      monto: montoReal,
      descripcion: `Pago gasto fijo: ${gasto.descripcion}${esCompleto ? '' : ' (ABONO)'}`,
      categoria: 'GASTOS_FIJOS',
      metodo_pago: 'EFECTIVO',
      referencia: '',
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      cajero: usuarioLocal.value.nombre || '',
      turno: usuarioLocal.value.token || '',
      mes: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      usuario: usuarioLocal.value.nombre || '',
      cuenta_contable: cuentaActiva.value.nombre,
      beneficiario: gasto.proveedor || 'Gasto Fijo',
      documento: '',
      estado: 'APROBADO',
      asiento_id: ''
    };

    transaccion.asiento_id = await generarAsientoContable(transaccion);
    await peticionesFetchOffline('insertData', 'caja_chica', JSON.stringify(transaccion));
    await actualizarSaldoCuenta(montoReal, false);

    const nuevoSaldo = Math.max(0, saldoActual - montoReal);
    const historial = (() => { try { return JSON.parse(gasto.historial_pagos || '[]'); } catch { return []; } })();
    historial.push({
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      monto: montoReal,
      usuario: usuarioLocal.value.nombre || 'Sistema',
      tipo: esCompleto ? 'COMPLETO' : 'ABONO'
    });

    await peticionesFetchOffline('updateData', 'gastosfijos', JSON.stringify({
      id: gasto.id,
      saldo: nuevoSaldo,
      estado: nuevoSaldo <= 0 ? 'PAGADO' : 'PENDIENTE',
      ultimo_pago: nfecha('fecha'),
      historial_pagos: JSON.stringify(historial)
    }));

    toast.add({ severity: 'success', summary: 'Éxito', detail: esCompleto ? 'Gasto fijo pagado completamente' : 'Abono registrado', life: 3000 });
    visiblePagoGastoFijo.value = false;
    await Promise.all([cargarTransacciones(), cargarGastosFijos()]);
  } catch (error) {
    console.error('Error al pagar gasto fijo:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar pago', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const cargarConfigAlertas = async () => {
  try {
    if (!cuentaActiva.value) return;
    const key = `caja_chica_saldo_minimo_${cuentaActiva.value.id}`;
    const resp = await peticionesFetchOffline('getDataByField', 'datos_config', 'nombre', key);
    if (resp && Array.isArray(resp) && resp.length > 0) {
      saldoMinimo.value = parseFloat(resp[0].valor) || 0;
    }
  } catch (e) { console.warn('Error cargando config alerta:', e); }
};

const guardarConfigAlerta = async () => {
  try {
    if (!cuentaActiva.value) return;
    const key = `caja_chica_saldo_minimo_${cuentaActiva.value.id}`;
    const existente = await peticionesFetchOffline('getDataByField', 'datos_config', 'nombre', key);
    const payload = JSON.stringify({ nombre: key, valor: String(saldoMinimo.value) });
    if (existente && Array.isArray(existente) && existente.length > 0) {
      await peticionesFetchOffline('updateData', 'datos_config', JSON.stringify({ id: existente[0].id, valor: String(saldoMinimo.value) }));
    } else {
      await peticionesFetchOffline('insertData', 'datos_config', payload);
    }
    visibleConfigAlerta.value = false;
    toast.add({ severity: 'success', summary: 'Configuración guardada', life: 2000 });
  } catch (e) { console.warn('Error guardando config alerta:', e); }
};

const cargarPresupuesto = async () => {
  try {
    if (!cuentaActiva.value) return;
    const hoy = new Date();
    const key = `caja_chica_presupuesto_${cuentaActiva.value.id}_${hoy.getMonth() + 1}_${hoy.getFullYear()}`;
    const resp = await peticionesFetchOffline('getDataByField', 'datos_config', 'nombre', key);
    if (resp && Array.isArray(resp) && resp.length > 0) {
      presupuestoMensual.value = parseFloat(resp[0].valor) || 0;
    }
  } catch (e) { console.warn('Error cargando presupuesto:', e); }
};

const guardarPresupuesto = async () => {
  try {
    if (!cuentaActiva.value) return;
    const hoy = new Date();
    const key = `caja_chica_presupuesto_${cuentaActiva.value.id}_${hoy.getMonth() + 1}_${hoy.getFullYear()}`;
    const existente = await peticionesFetchOffline('getDataByField', 'datos_config', 'nombre', key);
    const payload = JSON.stringify({ nombre: key, valor: String(presupuestoMensual.value) });
    if (existente && Array.isArray(existente) && existente.length > 0) {
      await peticionesFetchOffline('updateData', 'datos_config', JSON.stringify({ id: existente[0].id, valor: String(presupuestoMensual.value) }));
    } else {
      await peticionesFetchOffline('insertData', 'datos_config', payload);
    }
    visibleConfigPresupuesto.value = false;
    toast.add({ severity: 'success', summary: 'Presupuesto guardado', life: 2000 });
  } catch (e) { console.warn('Error guardando presupuesto:', e); }
};

const guardarReposicion = async () => {
  if (!cuentaActiva.value || !nuevaReposicion.value.monto || nuevaReposicion.value.monto <= 0) {
    toast.add({ severity: 'warn', summary: 'Validación', detail: 'El monto debe ser mayor a 0', life: 3000 });
    return;
  }
  loading.value = true;
  try {
    const payload = {
      tipo: 'INGRESO',
      monto: nuevaReposicion.value.monto,
      descripcion: nuevaReposicion.value.descripcion || 'Reposición de fondos',
      categoria: 'REPOSICION_FONDOS',
      metodo_pago: 'TRANSFERENCIA',
      referencia: nuevaReposicion.value.referencia || '',
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      cajero: usuarioLocal.value.nombre || '',
      turno: usuarioLocal.value.token || '',
      mes: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      usuario: usuarioLocal.value.nombre || '',
      cuenta_contable: cuentaActiva.value.nombre,
      beneficiario: 'Reposición Caja Chica',
      documento: '',
      estado: 'APROBADO',
      asiento_id: ''
    };
    payload.asiento_id = await generarAsientoContable(payload);
    await peticionesFetchOffline('insertData', 'caja_chica', JSON.stringify(payload));
    await actualizarSaldoCuenta(payload.monto, true);
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Reposición registrada', life: 3000 });
    visibleReposicion.value = false;
    await cargarTransacciones();
  } catch (error) {
    console.error('Error al registrar reposición:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar reposición', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const cierreMensual = () => {
  if (!cuentaActiva.value) return toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una cuenta', life: 3000 });
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const year = hoy.getFullYear();
  const mesNombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][hoy.getMonth()];

  Swal.fire({
    title: `Cierre Mensual: ${mesNombre} ${year}`,
    html: `
      <div style="text-align:left">
        <p><strong>Cuenta:</strong> ${cuentaActiva.value.nombre}</p>
        <p><strong>Saldo Contable:</strong> RD$ ${formatMoney(saldoEnCuenta.value)}</p>
        <p><strong>Total Ingresos del mes:</strong> RD$ ${formatMoney(totalIngresosCuenta.value)}</p>
        <p><strong>Total Egresos del mes:</strong> RD$ ${formatMoney(totalEgresosCuenta.value)}</p>
        <p><strong>Saldo Operativo:</strong> RD$ ${formatMoney(saldoCalculado.value)}</p>
        <hr>
        <p>Se generará un reporte PDF con el resumen mensual.</p>
      </div>
    `,
    icon: 'info', showCancelButton: true, confirmButtonText: 'Generar Reporte', cancelButtonText: 'Cancelar'
  }).then((r) => {
    if (r.isConfirmed) {
      exportarPDF();
      toast.add({ severity: 'success', summary: 'Cierre Mensual', detail: `Reporte de ${mesNombre} ${year} generado`, life: 4000 });
    }
  });
};

const abrirDetalle = (t) => { detalleTransaccion.value = t; visibleDetalle.value = true; };

const cambiarEstado = async (t, nuevoEstado) => {
  Swal.fire({
    title: `¿${nuevoEstado === 'ANULADO' ? 'Anular' : 'Cambiar estado a'} transacción?`,
    text: t.descripcion, icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Sí, confirmar', cancelButtonText: 'Cancelar'
  }).then(async (r) => {
    if (r.isConfirmed) {
      await peticionesFetchOffline('updateData', 'caja_chica', JSON.stringify({ id: t.id, estado: nuevoEstado }));
      if (nuevoEstado === 'ANULADO' && t.estado === 'APROBADO') {
        await actualizarSaldoCuenta(t.monto, t.tipo !== 'INGRESO');
      } else if (t.estado === 'ANULADO' && nuevoEstado === 'APROBADO') {
        await actualizarSaldoCuenta(t.monto, t.tipo === 'INGRESO');
      }
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado', life: 3000 });
      await cargarTransacciones();
    }
  }).catch(() => toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar estado', life: 3000 }));
};

const eliminarTransaccion = async (t) => {
  Swal.fire({
    title: '¿Eliminar transacción?', text: t.descripcion, icon: 'warning',
    showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#d33'
  }).then(async (r) => {
    if (r.isConfirmed) {
      if (t.estado === 'APROBADO') {
        await actualizarSaldoCuenta(t.monto, t.tipo !== 'INGRESO');
      }
      await peticionesFetchOffline('delete', 'caja_chica', { id: t.id });
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Transacción eliminada', life: 3000 });
      await cargarTransacciones();
    }
  }).catch(() => toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar', life: 3000 }));
};

const exportarExcel = () => {
  if (transaccionesFiltradas.value.length === 0) return toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay datos', life: 3000 });
  const d = transaccionesFiltradas.value.map(i => ({
    'Fecha': formatearFecha(i.fecha), 'Hora': i.hora, 'Tipo': i.tipo, 'Categoría': obtenerNombreCategoria(i.categoria),
    'Descripción': i.descripcion, 'Monto': parseFloat(i.monto || 0).toFixed(2), 'Método': i.metodo_pago,
    'Cuenta Contable': i.cuenta_contable || '', 'Beneficiario': i.beneficiario || '', 'Documento': i.documento || '',
    'Referencia': i.referencia || '', 'Estado': i.estado || 'APROBADO', 'Cajero': i.cajero
  }));
  const ws = XLSX.utils.json_to_sheet(d);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Caja Chica');
  const nombreCuenta = (cuentaActiva.value?.nombre || 'general').replace(/\s+/g, '_');
  XLSX.writeFile(wb, `CajaChica_${nombreCuenta}.xlsx`);
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Excel exportado', life: 3000 });
};

const exportarPDF = () => {
  if (transaccionesFiltradas.value.length === 0) return toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'No hay datos', life: 3000 });
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`CAJA CHICA: ${cuentaActiva.value?.nombre || 'N/A'}`, 105, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Empresa: ${datosEmpresa.empresa.nombre || 'N/A'}`, 14, 25);
  doc.text(`Cuenta: ${cuentaActiva.value?.nombre || 'N/A'} (${cuentaActiva.value?.categoria || ''})`, 14, 30);
  if (rangoFecha.value.length === 2) doc.text(`Periodo: ${formatearFecha(rangoFecha.value[0])} - ${formatearFecha(rangoFecha.value[1])}`, 14, 35);
  doc.text(`Saldo en Cuenta: RD$ ${formatMoney(saldoEnCuenta.value)}`, 14, 40);
  doc.text(`Saldo Operativo Calculado: RD$ ${formatMoney(saldoCalculado.value)}`, 14, 45);
  const td = transaccionesFiltradas.value.map(i => [
    formatearFecha(i.fecha), i.tipo, obtenerNombreCategoria(i.categoria), (i.descripcion || '').substring(0, 50),
    i.tipo === 'INGRESO' ? `RD$${parseFloat(i.monto).toFixed(2)}` : '',
    i.tipo === 'EGRESO' ? `RD$${parseFloat(i.monto).toFixed(2)}` : '',
    i.estado || ''
  ]);
  doc.autoTable({ startY: 50, head: [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Ingreso', 'Egreso', 'Estado']], body: td, theme: 'grid', headStyles: { fillColor: [76, 175, 80] }, styles: { fontSize: 8 } });
  const fy = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold'); doc.text('RESUMEN:', 14, fy);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Ingresos: RD$ ${formatMoney(totalIngresosCuenta.value)}`, 14, fy + 5);
  doc.text(`Total Egresos: RD$ ${formatMoney(totalEgresosCuenta.value)}`, 14, fy + 10);
  doc.text(`Saldo: RD$ ${formatMoney(saldoCalculado.value)}`, 14, fy + 15);
  const nc = (cuentaActiva.value?.nombre || 'general').replace(/\s+/g, '_');
  doc.save(`CajaChica_${nc}.pdf`);
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'PDF generado', life: 3000 });
};

const getSeverityTipo = (t) => t === 'INGRESO' ? 'success' : 'danger';
const getSeverityEstado = (e) => { const x = estadosTransaccion.find(et => et.value === e); return x ? x.severity : 'info'; };
const obtenerNombreCategoria = (v) => { const c = categorias.find(ca => ca.value === v); return c ? c.label : v; };
const formatMoney = (v) => parseFloat(v || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 });

watch(() => nuevaTransaccion.value.tipo, (t) => {
  const c = categorias.find(ca => ca.tipo === t);
  if (c) nuevaTransaccion.value.categoria = c.value;
});
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <i class="pi pi-coins text-yellow-500"></i>
              Caja Chica
            </h1>
            <p class="text-gray-600 mt-1">Operaciones de caja chica vinculadas a cuentas contables</p>
          </div>
          <div class="flex gap-2 flex-wrap">
            <Button label="Nueva Transacción" icon="pi pi-plus" severity="primary" @click="abrirModalNuevaTransaccion" :disabled="!cuentaActiva" />
            <Button label="Nuevo Pago" icon="pi pi-credit-card" severity="info" @click="abrirModalNuevoPago" :disabled="!cuentaActiva" />
            <Button label="Nueva Compra" icon="pi pi-shopping-cart" severity="help" @click="abrirModalNuevaCompra" :disabled="!cuentaActiva" />
            <Button label="Pago Gasto Fijo" icon="pi pi-folder-open" severity="warning" @click="abrirModalPagoGastoFijo(null)" :disabled="!cuentaActiva" />
            <Button label="Reposición Fondos" icon="pi pi-refresh" severity="contrast" @click="visibleReposicion = true" :disabled="!cuentaActiva" />
            <Button label="Ir a Cuentas Contables" icon="pi pi-calculator" severity="success" text @click="router.push({ name: 'cuentas' })" />
          </div>
        </div>
      </div>

      <!-- Selector de cuenta contable (funciona como caja) -->
      <Card class="shadow-lg mb-4">
        <template #content>
          <div class="flex flex-wrap items-center gap-4 p-3">
            <div class="flex items-center gap-2">
              <i class="pi pi-calculator text-blue-600 text-xl"></i>
              <span class="font-semibold text-gray-700">Cuenta Contable (Caja):</span>
            </div>
            <Dropdown v-model="cuentaActiva" :options="cuentasActivos" optionLabel="nombre" placeholder="Seleccione cuenta de activos..." class="w-80" :filter="true">
              <template #value="s">
                <div v-if="s.value" class="flex items-center gap-2">
                  <i class="pi pi-circle-fill text-green-500"></i>
                  <span class="font-semibold">{{ s.value.nombre }}</span>
                  <span class="text-xs text-gray-400">(saldo: RD$ {{ formatMoney(s.value.saldo) }})</span>
                </div>
                <span v-else class="text-gray-400">Seleccione una cuenta de activos...</span>
              </template>
              <template #option="s">
                <div class="flex items-center gap-2">
                  <i class="pi pi-circle-fill text-green-500"></i>
                  <span>{{ s.option.nombre }}</span>
                  <Tag :value="s.option.categoria" severity="success" class="ml-2" />
                  <span class="text-xs text-gray-400 ml-auto">RD$ {{ formatMoney(s.option.saldo) }}</span>
                </div>
              </template>
            </Dropdown>
            <span v-if="cuentaActiva" class="text-xs text-gray-400">
              {{ cuentasActivos.length }} cuentas de activos disponibles
            </span>
          </div>
        </template>
      </Card>

      <!-- Dashboard Cards -->
      <div v-if="cuentaActiva" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card class="shadow-lg border-t-4 border-blue-500">
          <template #content>
             <div class="flex items-center justify-between p-1">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Saldo en Cuenta</p>
                <div class="flex items-center gap-2">
                  <p class="text-xl font-bold text-blue-700">RD$ {{ formatMoney(saldoEnCuenta) }}</p>
                  <Tag v-if="saldoBajo" value="Saldo Bajo" severity="danger" icon="pi pi-exclamation-triangle" />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button icon="pi pi-bell" severity="secondary" text rounded @click="visibleConfigAlerta = true" v-tooltip.top="'Configurar alerta de saldo mínimo'" />
                <div class="bg-blue-100 p-3 rounded-full"><i class="pi pi-wallet text-blue-600 text-2xl"></i></div>
              </div>
            </div>
          </template>
        </Card>
        <Card class="shadow-lg border-t-4 border-green-500">
          <template #content>
            <div class="flex items-center justify-between p-1">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Ingresos</p>
                <p class="text-xl font-bold text-green-700">RD$ {{ formatMoney(totalIngresosCuenta) }}</p>
              </div>
              <div class="bg-green-100 p-3 rounded-full"><i class="pi pi-arrow-up text-green-600 text-2xl"></i></div>
            </div>
          </template>
        </Card>
        <Card class="shadow-lg border-t-4 border-red-500">
          <template #content>
            <div class="flex items-center justify-between p-1">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Egresos</p>
                <p class="text-xl font-bold text-red-700">RD$ {{ formatMoney(totalEgresosCuenta) }}</p>
              </div>
              <div class="bg-red-100 p-3 rounded-full"><i class="pi pi-arrow-down text-red-600 text-2xl"></i></div>
            </div>
          </template>
        </Card>
        <Card class="shadow-lg border-t-4 border-purple-500">
          <template #content>
            <div class="flex items-center justify-between p-1">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Transacciones</p>
                <p class="text-xl font-bold text-purple-700">{{ totalTransacciones }}</p>
              </div>
              <div class="bg-purple-100 p-3 rounded-full"><i class="pi pi-list text-purple-600 text-2xl"></i></div>
            </div>
          </template>
        </Card>
      </div>
      <Card v-else class="shadow-lg mb-6 bg-yellow-50 border border-yellow-200">
        <template #content>
          <div class="text-center py-6 text-yellow-700">
            <i class="pi pi-info-circle text-3xl mb-2"></i>
            <p class="font-semibold">No hay cuenta de activos seleccionada</p>
            <p class="text-sm mt-1">Seleccione una cuenta contable de tipo ACTIVOS del listado superior</p>
            <p class="text-xs mt-2">Si no hay cuentas, vaya a <strong>Contabilidad → Catálogo de Cuentas</strong> y cree una cuenta de tipo ACTIVOS (ej: "CAJA CHICA OFICINA")</p>
          </div>
        </template>
      </Card>

      <!-- Filters -->
      <Card class="shadow-lg mb-4" v-if="cuentaActiva">
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-2">
            <div class="flex flex-col gap-1">
              <label class="font-semibold text-xs text-gray-700">Rango Fechas</label>
              <DatePicker v-model="rangoFecha" selectionMode="range" dateFormat="dd/mm/yy" :showIcon="true" placeholder="Todas" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-semibold text-xs text-gray-700">Tipo</label>
              <Dropdown v-model="tipoFilter" :options="[{ label: 'Todos', value: '' }, ...tiposTransaccion]" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-semibold text-xs text-gray-700">Categoría</label>
              <Dropdown v-model="categoriaFilter" :options="[{ label: 'Todas', value: '' }, ...categorias]" optionLabel="label" optionValue="value" placeholder="Todas" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-semibold text-xs text-gray-700">Método</label>
              <Dropdown v-model="metodoPagoFilter" :options="[{ label: 'Todos', value: '' }, ...metodosPago]" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-semibold text-xs text-gray-700">Estado</label>
              <Dropdown v-model="estadoFilter" :options="[{ label: 'Todos', value: '' }, ...estadosTransaccion]" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-semibold text-xs text-gray-700">Buscar</label>
              <InputText v-model="busqueda" placeholder="Buscar..." class="w-full" />
            </div>
          </div>
        </template>
      </Card>

      <!-- Tabs -->
      <Card class="shadow-lg mb-6" v-if="cuentaActiva">
        <template #content>
          <div class="border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div class="flex flex-wrap">
              <button @click="activeTab = 0" :class="['px-6 py-3 text-sm font-medium transition-colors focus:outline-none', activeTab === 0 ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100']"><i class="pi pi-list mr-2"></i>Transacciones</button>
              <button @click="activeTab = 1" :class="['px-6 py-3 text-sm font-medium transition-colors focus:outline-none', activeTab === 1 ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100']"><i class="pi pi-credit-card mr-2"></i>Pagos ({{ pagosDelMes.length }})</button>
              <button @click="activeTab = 2" :class="['px-6 py-3 text-sm font-medium transition-colors focus:outline-none', activeTab === 2 ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100']"><i class="pi pi-shopping-cart mr-2"></i>Compras ({{ comprasDelMes.length }})</button>
              <button @click="activeTab = 3" :class="['px-6 py-3 text-sm font-medium transition-colors focus:outline-none', activeTab === 3 ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100']"><i class="pi pi-folder-open mr-2"></i>Gastos Fijos ({{ gastosFijosPendientes.length }})</button>
              <button @click="activeTab = 4" :class="['px-6 py-3 text-sm font-medium transition-colors focus:outline-none', activeTab === 4 ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100']"><i class="pi pi-chart-bar mr-2"></i>Reportes</button>
              <div class="ml-auto flex items-center gap-2 px-4">
                <Button label="Excel" icon="pi pi-file-excel" severity="success" text size="small" @click="exportarExcel" :disabled="transaccionesFiltradas.length === 0" />
                <Button label="PDF" icon="pi pi-file-pdf" severity="danger" text size="small" @click="exportarPDF" :disabled="transaccionesFiltradas.length === 0" />
              </div>
            </div>
          </div>

          <!-- Tab 1 -->
          <div v-show="activeTab === 0" class="p-4">
            <DataTable :value="transaccionesFiltradas" :paginator="true" :rows="20" :loading="loading" stripedRows showGridlines
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              :rowsPerPageOptions="[10,20,50,100]" currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}">
              <template #empty>
                <div class="text-center py-8"><i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i><p class="text-gray-500">{{ dataLoaded ? 'No hay transacciones para esta cuenta' : 'Cargando...' }}</p></div>
              </template>
              <Column field="fecha" header="Fecha" :style="{ minWidth: '100px' }"><template #body="s">{{ formatearFecha(s.data.fecha) }}</template></Column>
              <Column field="hora" header="Hora" :style="{ width: '80px' }" />
              <Column field="tipo" header="Tipo" :style="{ width: '90px' }"><template #body="s"><Tag :value="s.data.tipo" :severity="getSeverityTipo(s.data.tipo)" /></template></Column>
              <Column field="categoria" header="Categoría" :style="{ minWidth: '150px' }"><template #body="s">{{ obtenerNombreCategoria(s.data.categoria) }}</template></Column>
              <Column field="descripcion" header="Descripción" :style="{ minWidth: '200px' }"><template #body="s"><span class="line-clamp-2">{{ s.data.descripcion }}</span></template></Column>
              <Column field="monto" header="Monto" :style="{ minWidth: '120px' }"><template #body="s"><span :class="['font-bold', s.data.tipo === 'INGRESO' ? 'text-green-700' : 'text-red-700']">RD$ {{ formatMoney(s.data.monto) }}</span></template></Column>
              <Column field="cuenta_contable" header="Cuenta" :style="{ minWidth: '130px' }" />
              <Column field="metodo_pago" header="Método" :style="{ minWidth: '100px' }" />
              <Column field="estado" header="Estado" :style="{ width: '110px' }"><template #body="s"><Tag :value="s.data.estado || 'APROBADO'" :severity="getSeverityEstado(s.data.estado)" /></template></Column>
              <Column field="beneficiario" header="Beneficiario" :style="{ minWidth: '130px' }" />
              <Column header="Acciones" :style="{ width: '120px' }"><template #body="s"><div class="flex gap-1"><Button icon="pi pi-eye" severity="info" text rounded @click="abrirDetalle(s.data)" /><Button icon="pi pi-ban" severity="warning" text rounded @click="cambiarEstado(s.data, 'ANULADO')" v-if="s.data.estado !== 'ANULADO'" /><Button icon="pi pi-trash" severity="danger" text rounded @click="eliminarTransaccion(s.data)" /></div></template></Column>
            </DataTable>
          </div>

          <!-- Tab 2: Pagos -->
          <div v-show="activeTab === 1" class="p-4">
            <div class="flex items-center justify-between mb-4">
              <div><h3 class="text-xl font-bold text-gray-800">Pagos a Proveedores</h3><p class="text-gray-500">Pagos del mes: RD$ {{ formatMoney(totalPagosMes) }} ({{ pagosDelMes.length }})</p></div>
              <Button label="Nuevo Pago" icon="pi pi-credit-card" severity="info" @click="abrirModalNuevoPago" />
            </div>
            <DataTable :value="transaccionesDeCuentaActiva.filter(t => t.categoria === 'PAGOS_PROVEEDORES')" :paginator="true" :rows="10" stripedRows showGridlines>
              <template #empty><div class="text-center py-8"><i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i><p class="text-gray-500">No hay pagos en esta cuenta</p></div></template>
              <Column field="fecha" header="Fecha"><template #body="s">{{ formatearFecha(s.data.fecha) }}</template></Column>
              <Column field="beneficiario" header="Proveedor" :style="{ minWidth: '180px' }" />
              <Column field="descripcion" header="Concepto" :style="{ minWidth: '200px' }" />
              <Column field="monto" header="Monto" :style="{ minWidth: '120px' }"><template #body="s"><span class="font-bold text-red-700">RD$ {{ formatMoney(s.data.monto) }}</span></template></Column>
              <Column field="metodo_pago" header="Método" /><Column field="documento" header="Factura Ref" />
              <Column field="estado" header="Estado"><template #body="s"><Tag :value="s.data.estado || 'APROBADO'" :severity="getSeverityEstado(s.data.estado)" /></template></Column>
              <Column header="Acc" :style="{ width: '80px' }"><template #body="s"><Button icon="pi pi-eye" severity="info" text rounded @click="abrirDetalle(s.data)" /></template></Column>
            </DataTable>
          </div>

          <!-- Tab 3: Compras -->
          <div v-show="activeTab === 2" class="p-4">
            <div class="flex items-center justify-between mb-4">
              <div><h3 class="text-xl font-bold text-gray-800">Compras Menores</h3><p class="text-gray-500">Compras del mes: RD$ {{ formatMoney(totalComprasMes) }} ({{ comprasDelMes.length }})</p></div>
              <Button label="Nueva Compra" icon="pi pi-shopping-cart" severity="help" @click="abrirModalNuevaCompra" />
            </div>
            <DataTable :value="transaccionesDeCuentaActiva.filter(t => t.categoria === 'COMPRAS_MENORES')" :paginator="true" :rows="10" stripedRows showGridlines>
              <template #empty><div class="text-center py-8"><i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i><p class="text-gray-500">No hay compras en esta cuenta</p></div></template>
              <Column field="fecha" header="Fecha"><template #body="s">{{ formatearFecha(s.data.fecha) }}</template></Column>
              <Column field="beneficiario" header="Proveedor" :style="{ minWidth: '180px' }" />
              <Column field="descripcion" header="Detalle" :style="{ minWidth: '250px' }" />
              <Column field="monto" header="Total" :style="{ minWidth: '120px' }"><template #body="s"><span class="font-bold text-red-700">RD$ {{ formatMoney(s.data.monto) }}</span></template></Column>
              <Column field="metodo_pago" header="Método" /><Column field="documento" header="Factura" />
              <Column field="estado" header="Estado"><template #body="s"><Tag :value="s.data.estado || 'APROBADO'" :severity="getSeverityEstado(s.data.estado)" /></template></Column>
              <Column header="Acc" :style="{ width: '80px' }"><template #body="s"><Button icon="pi pi-eye" severity="info" text rounded @click="abrirDetalle(s.data)" /></template></Column>
            </DataTable>
          </div>

          <!-- Tab 4: Gastos Fijos -->
          <div v-show="activeTab === 3" class="p-4">
            <div class="flex items-center justify-between mb-4">
              <div><h3 class="text-xl font-bold text-gray-800">Gastos Fijos Pendientes</h3><p class="text-gray-500">Total pendiente: RD$ {{ formatMoney(totalGastosFijosPendientes) }} ({{ gastosFijosPendientes.length }})</p></div>
              <Button label="Nuevo Pago Gasto Fijo" icon="pi pi-credit-card" severity="info" @click="abrirModalPagoGastoFijo(null)" />
            </div>
            <DataTable :value="gastosFijosPendientes" :paginator="true" :rows="10" stripedRows showGridlines>
              <template #empty><div class="text-center py-8"><i class="pi pi-inbox text-gray-400 text-5xl mb-3"></i><p class="text-gray-500">No hay gastos fijos pendientes</p></div></template>
              <Column field="descripcion" header="Descripción" :style="{ minWidth: '200px' }" />
              <Column field="proveedor" header="Proveedor" :style="{ minWidth: '150px' }" />
              <Column field="categoria" header="Categoría" :style="{ minWidth: '120px' }" />
              <Column field="tipo" header="Tipo" :style="{ width: '100px' }"><template #body="s"><Tag :value="s.data.tipo" :severity="s.data.tipo === 'FIJO' ? 'info' : 'warn'" /></template></Column>
              <Column field="valor" header="Valor Original" :style="{ minWidth: '120px' }"><template #body="s"><span class="font-bold">RD$ {{ formatMoney(s.data.valor) }}</span></template></Column>
              <Column field="saldo" header="Saldo" :style="{ minWidth: '120px' }"><template #body="s"><span class="font-bold text-red-700">RD$ {{ formatMoney(s.data.saldo) }}</span></template></Column>
              <Column field="fecha_pago" header="Vence" :style="{ width: '100px' }"><template #body="s">{{ formatearFecha(s.data.fecha_pago) }}</template></Column>
              <Column field="estado" header="Estado" :style="{ width: '100px' }"><template #body="s"><Tag :value="s.data.estado || 'PENDIENTE'" :severity="s.data.estado === 'PENDIENTE' ? 'warn' : 'success'" /></template></Column>
              <Column header="Acción" :style="{ width: '150px' }"><template #body="s"><Button label="Pagar" icon="pi pi-credit-card" severity="info" @click="abrirModalPagoGastoFijo(s.data)" :disabled="s.data.saldo <= 0" /></template></Column>
            </DataTable>
          </div>

          <!-- Tab 5: Reportes -->
          <div v-show="activeTab === 4" class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card><template #title><div class="flex items-center gap-2"><i class="pi pi-chart-pie text-blue-600"></i><span>Gastos por Categoría</span></div></template>
                <template #content>
                  <div v-if="gastosPorCategoria.length === 0" class="text-center py-4 text-gray-500">Sin gastos</div>
                  <div v-for="g in gastosPorCategoria" :key="g.categoria" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span class="text-gray-700">{{ obtenerNombreCategoria(g.categoria) }}</span><span class="font-bold text-red-600">RD$ {{ formatMoney(g.total) }}</span>
                  </div>
                  <Divider />
                  <div class="flex items-center justify-between font-bold text-lg"><span>Total</span><span class="text-red-700">RD$ {{ formatMoney(totalEgresosCuenta) }}</span></div>
                </template>
              </Card>
              <Card><template #title><div class="flex items-center gap-2"><i class="pi pi-chart-bar text-green-600"></i><span>{{ cuentaActiva.nombre }}</span></div></template>
                <template #content>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between py-2 border-b border-gray-100"><span class="text-gray-700">Saldo Contable</span><span class="font-bold">RD$ {{ formatMoney(saldoEnCuenta) }}</span></div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100"><span class="text-gray-700">Total Ingresos</span><span class="font-bold text-green-600">RD$ {{ formatMoney(totalIngresosCuenta) }}</span></div>
                    <div class="flex items-center justify-between py-2 border-b border-gray-100"><span class="text-gray-700">Total Egresos</span><span class="font-bold text-red-600">RD$ {{ formatMoney(totalEgresosCuenta) }}</span></div>
                    <Divider />
                    <div class="flex items-center justify-between text-lg"><span class="font-bold">Saldo Operativo</span><span class="font-bold text-blue-700">RD$ {{ formatMoney(saldoCalculado) }}</span></div>
                    <div class="flex items-center justify-between py-2"><span class="text-gray-700">Categoría</span><Tag :value="cuentaActiva.categoria" severity="success" /></div>
                  </div>
                </template>
              </Card>
              <Card><template #title><div class="flex items-center gap-2"><i class="pi pi-calculator text-yellow-600"></i><span>Presupuesto Mensual</span></div></template>
                <template #content>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-700">Presupuesto del Mes</span>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-lg">RD$ {{ formatMoney(presupuestoMensual) }}</span>
                        <Button icon="pi pi-pencil" severity="secondary" text rounded @click="visibleConfigPresupuesto = true" v-tooltip.top="'Configurar presupuesto'" />
                      </div>
                    </div>
                    <div v-if="presupuestoMensual > 0">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-sm text-gray-600">Gastado: RD$ {{ formatMoney(gastosDelMesActual) }}</span>
                        <span class="text-sm font-bold" :class="presupuestoExcedido ? 'text-red-600' : 'text-green-600'">{{ porcentajePresupuesto.toFixed(1) }}%</span>
                      </div>
                      <ProgressBar :value="porcentajePresupuesto" :class="presupuestoExcedido ? 'bg-red-200' : ''" :style="{ height: '24px' }">
                        <span v-if="presupuestoExcedido" class="text-xs font-bold">¡EXCEDIDO!</span>
                      </ProgressBar>
                      <div v-if="presupuestoExcedido" class="mt-2 text-red-600 text-sm flex items-center gap-1">
                        <i class="pi pi-exclamation-circle"></i>
                        <span>Ha excedido el presupuesto en RD$ {{ formatMoney(gastosDelMesActual - presupuestoMensual) }}</span>
                      </div>
                    </div>
                    <div v-else class="text-center py-4 text-gray-400">
                      <i class="pi pi-info-circle text-2xl mb-2"></i>
                      <p>No hay presupuesto configurado para este mes</p>
                      <Button label="Configurar Presupuesto" icon="pi pi-calculator" severity="contrast" class="mt-3" @click="visibleConfigPresupuesto = true" />
                    </div>
                    <Divider />
                    <div class="flex justify-center">
                      <Button label="Cierre Mensual" icon="pi pi-file-pdf" severity="danger" @click="cierreMensual" :disabled="transaccionesFiltradas.length === 0" />
                    </div>
                  </div>
                </template>
              </Card>
              <Card class="md:col-span-2"><template #title><div class="flex items-center gap-2"><i class="pi pi-download text-purple-600"></i><span>Exportar</span></div></template>
                <template #content><div class="flex gap-4 flex-wrap"><Button label="Excel" icon="pi pi-file-excel" severity="success" @click="exportarExcel" :disabled="transaccionesFiltradas.length===0" /><Button label="PDF" icon="pi pi-file-pdf" severity="danger" @click="exportarPDF" :disabled="transaccionesFiltradas.length===0" /></div></template>
              </Card>
            </div>
          </div>
        </template>
      </Card>

      <!-- Dialog: Nueva Transacción -->
      <Dialog v-model:visible="visibleNuevaTransaccion" modal header="Nueva Transacción" :style="{ width: '600px' }" :breakpoints="{ '960px':'75vw','640px':'90vw' }">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Tipo *</label><SelectButton v-model="nuevaTransaccion.tipo" :options="tiposTransaccion" optionLabel="label" optionValue="value" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Categoría *</label><Dropdown v-model="nuevaTransaccion.categoria" :options="categoriasFiltradas" optionLabel="label" optionValue="value" placeholder="Selecciona" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Monto *</label><InputNumber v-model="nuevaTransaccion.monto" mode="currency" currency="DOP" locale="es-DO" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Método *</label><Dropdown v-model="nuevaTransaccion.metodo_pago" :options="metodosPago" optionLabel="label" optionValue="value" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Beneficiario</label><InputText v-model="nuevaTransaccion.beneficiario" placeholder="Persona o entidad" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Documento/Ref</label><InputText v-model="nuevaTransaccion.documento" placeholder="N° factura" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Estado</label><Dropdown v-model="nuevaTransaccion.estado" :options="estadosTransaccion" optionLabel="label" optionValue="value" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Cuenta Contable</label><InputText :value="cuentaActiva?.nombre" disabled class="w-full" /></div>
          <div class="flex flex-col gap-2 md:col-span-2"><label class="font-semibold text-sm">Descripción *</label><Textarea v-model="nuevaTransaccion.descripcion" rows="3" placeholder="Describe la transacción" class="w-full" /></div>
          <div class="flex flex-col gap-2 md:col-span-2"><label class="font-semibold text-sm">Referencia</label><InputText v-model="nuevaTransaccion.referencia" placeholder="N° comprobante" class="w-full" /></div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2"><Button label="Cancelar" severity="secondary" outlined @click="visibleNuevaTransaccion=false" /><Button label="Guardar" severity="primary" icon="pi pi-check" @click="guardarTransaccion" :loading="loading" /></div>
        </template>
      </Dialog>

      <!-- Dialog: Nuevo Pago -->
      <Dialog v-model:visible="visibleNuevoPago" modal header="Nuevo Pago a Proveedor" :style="{ width: '600px' }" :breakpoints="{ '960px':'75vw','640px':'90vw' }">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div class="flex flex-col gap-2 md:col-span-2"><label class="font-semibold text-sm">Proveedor *</label><Dropdown v-model="nuevoPago.proveedor" :options="proveedores.map(p=>p.nombre)" :filter="true" placeholder="Seleccione o escriba" class="w-full" :editable="true" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Monto *</label><InputNumber v-model="nuevoPago.monto" mode="currency" currency="DOP" locale="es-DO" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Método *</label><Dropdown v-model="nuevoPago.metodo_pago" :options="metodosPago" optionLabel="label" optionValue="value" class="w-full" /></div>
          <div class="flex flex-col gap-2 md:col-span-2"><label class="font-semibold text-sm">Concepto</label><Textarea v-model="nuevoPago.concepto" rows="2" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Factura/Ref</label><InputText v-model="nuevoPago.factura_ref" placeholder="N° factura" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Ref. Pago</label><InputText v-model="nuevoPago.referencia" placeholder="N° transacción" class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Cuenta Contable</label><InputText :value="cuentaActiva?.nombre" disabled class="w-full" /></div>
          <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Estado</label><Dropdown v-model="nuevoPago.estado" :options="estadosTransaccion" optionLabel="label" optionValue="value" class="w-full" /></div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2"><Button label="Cancelar" severity="secondary" outlined @click="visibleNuevoPago=false" /><Button label="Registrar Pago" severity="info" icon="pi pi-credit-card" @click="guardarPago" :loading="loading" /></div>
        </template>
      </Dialog>

      <!-- Dialog: Nueva Compra -->
      <Dialog v-model:visible="visibleNuevaCompra" modal header="Nueva Compra Menor" :style="{ width: '700px' }" :breakpoints="{ '960px':'75vw','640px':'90vw' }">
        <div class="p-4">
          <div class="flex flex-col gap-2 mb-4">
            <label class="font-semibold text-sm">Proveedor/Vendedor</label>
            <div class="flex gap-2 items-center">
              <Dropdown
                v-model="nuevaCompra.proveedor"
                :options="proveedores"
                optionLabel="nombre"
                optionValue="nombre"
                placeholder="Seleccione un proveedor"
                filter
                showClear
                fluid
                class="flex-1"
              >
                <template #option="slotProps">
                  <div class="flex flex-col">
                    <span class="font-semibold">{{ slotProps.option.nombre }}</span>
                    <span v-if="slotProps.option.rnc" class="text-xs text-gray-500">
                      RNC: {{ slotProps.option.rnc }}
                    </span>
                  </div>
                </template>
              </Dropdown>
              <Button label="Agregar proveedor" icon="pi pi-plus" severity="success" outlined class="shrink-0" @click="abrirNuevoProveedorCompra" />
            </div>
          </div>
          <Divider /><h4 class="font-bold text-gray-700 mb-3">Items</h4>
          <div class="grid grid-cols-12 gap-2 mb-3 items-end">
            <div class="col-span-5"><label class="font-semibold text-xs text-gray-600">Descripción</label><InputText v-model="nuevoItem.descripcion" placeholder="Item" fluid class="w-full" /></div>
            <div class="col-span-2"><label class="font-semibold text-xs text-gray-600">Cant.</label><InputNumber v-model="nuevoItem.cantidad" :min="1" fluid class="w-full" /></div>
            <div class="col-span-2"><label class="font-semibold text-xs text-gray-600">Precio U.</label><InputNumber v-model="nuevoItem.precio_unitario" mode="currency" currency="DOP" locale="es-DO" fluid class="w-full" /></div>
            <div class="col-span-2"><label class="font-semibold text-xs text-gray-600">Total</label><InputNumber :value="nuevoItem.cantidad * nuevoItem.precio_unitario" mode="currency" currency="DOP" locale="es-DO" disabled fluid class="w-full" /></div>
            <div class="col-span-1"><Button icon="pi pi-plus" severity="success" text @click="agregarItemCompra" /></div>
          </div>
          <DataTable :value="nuevaCompra.items" class="mb-4"><template #empty><div class="text-center py-4 text-gray-400 text-sm">Sin items</div></template>
            <Column field="descripcion" header="Item" /><Column field="cantidad" header="Cant" :style="{width:'80px'}" /><Column field="precio_unitario" header="Precio Unit" :style="{width:'120px'}"><template #body="s">RD$ {{ s.data.precio_unitario.toFixed(2) }}</template></Column>
            <Column field="total" header="Total" :style="{width:'120px'}"><template #body="s"><span class="font-bold">RD$ {{ s.data.total.toFixed(2) }}</span></template></Column>
            <Column header="" :style="{width:'50px'}"><template #body="s"><Button icon="pi pi-trash" severity="danger" text rounded @click="eliminarItemCompra(s.index)" /></template></Column>
          </DataTable>
          <div class="flex justify-end mb-4"><div class="text-xl font-bold">Total: RD$ {{ nuevaCompra.total.toLocaleString('es-DO',{minimumFractionDigits:2}) }}</div></div>
          <Divider />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Método *</label><Dropdown v-model="nuevaCompra.metodo_pago" :options="metodosPago" optionLabel="label" optionValue="value" fluid class="w-full" /></div>
            <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Factura/Recibo</label><InputText v-model="nuevaCompra.factura_ref" placeholder="N° factura" fluid class="w-full" /></div>
            <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Cuenta Contable</label><InputText :value="cuentaActiva?.nombre" disabled fluid class="w-full" /></div>
            <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Estado</label><Dropdown v-model="nuevaCompra.estado" :options="estadosTransaccion" optionLabel="label" optionValue="value" fluid class="w-full" /></div>
          </div>
        </div>
        <template #footer><Button label="Cancelar" severity="secondary" outlined @click="visibleNuevaCompra=false" /><Button label="Registrar Compra" severity="help" icon="pi pi-shopping-cart" @click="guardarCompra" :loading="loading" /></template>
      </Dialog>

      <!-- Dialog: Nuevo Proveedor desde Compra Menor -->
      <Dialog v-model:visible="visibleNuevoProveedorCompra" modal header="Agregar proveedor" :style="{ width: '650px' }" :breakpoints="{ '960px':'75vw','640px':'92vw' }">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="font-semibold text-sm">Nombre *</label>
            <InputText v-model="nuevoProveedorCompra.nombre" placeholder="Nombre o razón social" fluid class="w-full" @keyup.enter="guardarNuevoProveedorCompra" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">RNC</label>
            <InputText v-model="nuevoProveedorCompra.rnc" placeholder="RNC o cédula" fluid class="w-full" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Teléfono</label>
            <InputText v-model="nuevoProveedorCompra.telefono" placeholder="Teléfono" fluid class="w-full" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Email</label>
            <InputText v-model="nuevoProveedorCompra.email" type="email" placeholder="correo@ejemplo.com" fluid class="w-full" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">Encargado</label>
            <InputText v-model="nuevoProveedorCompra.encargado" placeholder="Persona de contacto" fluid class="w-full" />
          </div>
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="font-semibold text-sm">Cuenta bancaria</label>
            <InputText v-model="nuevoProveedorCompra.cuenta_bancaria" placeholder="Número de cuenta" fluid class="w-full" />
          </div>
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="font-semibold text-sm">Dirección</label>
            <Textarea v-model="nuevoProveedorCompra.direccion" rows="2" placeholder="Dirección del proveedor" fluid class="w-full" />
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" outlined :disabled="guardandoProveedorCompra" @click="visibleNuevoProveedorCompra=false" />
            <Button label="Guardar proveedor" icon="pi pi-save" severity="success" :loading="guardandoProveedorCompra" @click="guardarNuevoProveedorCompra" />
          </div>
        </template>
      </Dialog>

      <!-- Dialog: Pago Gasto Fijo -->
      <Dialog v-model:visible="visiblePagoGastoFijo" modal :header="'Pagar Gasto Fijo — ' + gastosFijos.length + ' gastos cargados'" :style="{ width: '550px' }" :breakpoints="{ '960px':'75vw','640px':'90vw' }" @after-show="console.log('[CajaChica] gastosFijos en modal:', JSON.parse(JSON.stringify(gastosFijos)))">
        <div class="p-4">
          <div class="flex flex-col gap-2 mb-4">
            <label class="font-semibold text-sm">Seleccionar Gasto Fijo *</label>
            <div v-if="gastosFijos.length === 0" class="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-700 text-sm mb-2">
              <i class="pi pi-exclamation-triangle mr-2"></i>No hay gastos fijos cargados. Total registros en BD: {{ gastosFijos.length }}. Revisa la consola (F12).
            </div>
            <div class="flex gap-2">
              <Dropdown v-model="gastoFijoSeleccionado" :options="gastosFijos" optionLabel="descripcion" placeholder="Seleccione un gasto fijo..." class="flex-1" :filter="true" @change="gastoFijoSeleccionado && (montoPagoGastoFijo = gastoFijoSeleccionado.saldo)">
                <template #value="slotProps">
                  <div v-if="slotProps.value">{{ slotProps.value.descripcion }} — RD$ {{ formatMoney(slotProps.value.saldo) }}</div>
                  <span v-else class="text-gray-400">Seleccione un gasto fijo...</span>
                </template>
                <template #option="slotProps">
                  <div class="flex justify-between"><span>{{ slotProps.option.descripcion }}</span><span class="font-bold text-red-600">RD$ {{ formatMoney(slotProps.option.saldo) }}</span></div>
                </template>
              </Dropdown>
              <Button icon="pi pi-refresh" severity="secondary" text @click="cargarGastosFijos" v-tooltip.top="'Recargar gastos fijos'" />
            </div>
          </div>
          <div v-if="gastoFijoSeleccionado" class="bg-gray-50 rounded-lg p-4 mb-4">
            <div class="grid grid-cols-2 gap-3">
              <div><p class="text-gray-500 text-xs uppercase">Proveedor</p><p class="font-semibold">{{ gastoFijoSeleccionado.proveedor || 'N/A' }}</p></div>
              <div><p class="text-gray-500 text-xs uppercase">Categoría</p><p class="font-semibold">{{ gastoFijoSeleccionado.categoria || 'N/A' }}</p></div>
              <div><p class="text-gray-500 text-xs uppercase">Valor Original</p><p class="font-semibold">RD$ {{ formatMoney(gastoFijoSeleccionado.valor) }}</p></div>
              <div><p class="text-gray-500 text-xs uppercase">Saldo Pendiente</p><p class="font-bold text-red-700 text-lg">RD$ {{ formatMoney(gastoFijoSeleccionado.saldo) }}</p></div>
            </div>
          </div>
          <div v-if="gastoFijoSeleccionado" class="flex flex-col gap-3">
            <div class="flex flex-col gap-2"><label class="font-semibold text-sm">Monto a Pagar *</label><InputNumber v-model="montoPagoGastoFijo" mode="currency" currency="DOP" locale="es-DO" class="w-full" :min="0" :max="Math.max(0, gastoFijoSeleccionado.saldo)" /></div>
            <div class="flex gap-2">
              <Button label="Pagar Completo" icon="pi pi-check" severity="success" class="flex-1" @click="montoPagoGastoFijo = gastoFijoSeleccionado.saldo; guardarPagoGastoFijo()" :loading="loading" :disabled="gastoFijoSeleccionado.saldo <= 0" />
              <Button label="Abonar" icon="pi pi-arrow-right" severity="info" class="flex-1" @click="guardarPagoGastoFijo" :loading="loading" :disabled="!montoPagoGastoFijo || montoPagoGastoFijo <= 0 || !gastoFijoSeleccionado" />
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2"><Button label="Cancelar" severity="secondary" outlined @click="visiblePagoGastoFijo=false" /></div>
        </template>
      </Dialog>

      <!-- Dialog: Detalle -->
      <Dialog v-model:visible="visibleDetalle" modal header="Detalle de Transacción" :style="{ width: '550px' }">
        <div class="p-4" v-if="detalleTransaccion">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2"><Tag :value="detalleTransaccion.tipo" :severity="getSeverityTipo(detalleTransaccion.tipo)" class="mb-3" /><Tag :value="detalleTransaccion.estado || 'APROBADO'" :severity="getSeverityEstado(detalleTransaccion.estado)" class="mb-3 ml-2" /></div>
            <div><p class="text-gray-500 text-sm">Fecha</p><p class="font-semibold">{{ formatearFecha(detalleTransaccion.fecha) }} {{ detalleTransaccion.hora }}</p></div>
            <div><p class="text-gray-500 text-sm">Monto</p><p :class="['font-bold text-lg', detalleTransaccion.tipo === 'INGRESO' ? 'text-green-700' : 'text-red-700']">RD$ {{ formatMoney(detalleTransaccion.monto) }}</p></div>
            <div><p class="text-gray-500 text-sm">Categoría</p><p class="font-semibold">{{ obtenerNombreCategoria(detalleTransaccion.categoria) }}</p></div>
            <div><p class="text-gray-500 text-sm">Método</p><p class="font-semibold">{{ detalleTransaccion.metodo_pago }}</p></div>
            <div v-if="detalleTransaccion.cuenta_contable"><p class="text-gray-500 text-sm">Cuenta</p><p class="font-semibold">{{ detalleTransaccion.cuenta_contable }}</p></div>
            <div v-if="detalleTransaccion.beneficiario"><p class="text-gray-500 text-sm">Beneficiario</p><p class="font-semibold">{{ detalleTransaccion.beneficiario }}</p></div>
            <div v-if="detalleTransaccion.documento"><p class="text-gray-500 text-sm">Documento</p><p class="font-semibold">{{ detalleTransaccion.documento }}</p></div>
            <div v-if="detalleTransaccion.asiento_id"><p class="text-gray-500 text-sm">Asiento</p><p class="font-semibold">{{ detalleTransaccion.asiento_id }}</p></div>
            <div class="col-span-2"><p class="text-gray-500 text-sm">Descripción</p><p class="whitespace-pre-wrap">{{ detalleTransaccion.descripcion }}</p></div>
          </div>
        </div>
        <template #footer><Button label="Cerrar" severity="secondary" @click="visibleDetalle=false" /></template>
      </Dialog>

      <!-- Dialog: Configuración de Alerta de Saldo Mínimo -->
      <Dialog v-model:visible="visibleConfigAlerta" modal header="Configurar Alerta de Saldo Mínimo" :style="{ width: '450px' }" :breakpoints="{ '640px':'90vw' }">
        <div class="p-4">
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm">Saldo Mínimo (RD$)</label>
              <InputNumber v-model="saldoMinimo" mode="currency" currency="DOP" locale="es-DO" class="w-full" :min="0" />
              <small class="text-gray-500">Cuando el saldo de la cuenta esté por debajo de este monto, se mostrará una alerta visual en el dashboard.</small>
            </div>
            <div v-if="saldoMinimo > 0" class="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
              <i class="pi pi-info-circle mr-2"></i>
              <span>Alerta activa: se mostrará "Saldo Bajo" cuando el saldo sea menor a RD$ {{ formatMoney(saldoMinimo) }}</span>
            </div>
            <div v-else class="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-500">
              <i class="pi pi-info-circle mr-2"></i>
              <span>Alerta desactivada. Ingrese un monto mayor a 0 para activarla.</span>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" outlined @click="visibleConfigAlerta = false" />
            <Button label="Guardar" severity="primary" icon="pi pi-check" @click="guardarConfigAlerta" />
          </div>
        </template>
      </Dialog>

      <!-- Dialog: Reposición de Fondos -->
      <Dialog v-model:visible="visibleReposicion" modal header="Reposición de Fondos" :style="{ width: '500px' }" :breakpoints="{ '640px':'90vw' }">
        <div class="p-4">
          <div class="flex flex-col gap-4">
            <div class="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-700 flex items-start gap-2">
              <i class="pi pi-info-circle mt-0.5"></i>
              <span>Registra un ingreso por reposición de fondos a la caja chica. Se generará un asiento contable automático y se actualizará el saldo de la cuenta.</span>
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm">Monto a Reponer *</label>
              <InputNumber v-model="nuevaReposicion.monto" mode="currency" currency="DOP" locale="es-DO" class="w-full" :min="0" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm">Descripción</label>
              <Textarea v-model="nuevaReposicion.descripcion" rows="2" placeholder="Ej: Reposición de fondos para operaciones de Enero" class="w-full" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm">Referencia</label>
              <InputText v-model="nuevaReposicion.referencia" placeholder="N° comprobante o transferencia" class="w-full" />
            </div>
            <div class="bg-gray-50 rounded p-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Saldo actual:</span>
                <span class="font-bold" :class="saldoBajo ? 'text-red-600' : 'text-green-600'">RD$ {{ formatMoney(saldoEnCuenta) }}</span>
              </div>
              <div v-if="nuevaReposicion.monto > 0" class="flex items-center justify-between text-sm mt-2">
                <span class="text-gray-600">Saldo estimado después de reposición:</span>
                <span class="font-bold text-blue-600">RD$ {{ formatMoney(saldoEnCuenta + nuevaReposicion.monto) }}</span>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" outlined @click="visibleReposicion = false" />
            <Button label="Registrar Reposición" severity="contrast" icon="pi pi-refresh" @click="guardarReposicion" :loading="loading" />
          </div>
        </template>
      </Dialog>

      <!-- Dialog: Configuración de Presupuesto Mensual -->
      <Dialog v-model:visible="visibleConfigPresupuesto" modal header="Configurar Presupuesto Mensual" :style="{ width: '450px' }" :breakpoints="{ '640px':'90vw' }">
        <div class="p-4">
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-sm">Presupuesto del Mes (RD$)</label>
              <InputNumber v-model="presupuestoMensual" mode="currency" currency="DOP" locale="es-DO" class="w-full" :min="0" />
              <small class="text-gray-500">Límite de gasto para {{ ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][new Date().getMonth()] }} {{ new Date().getFullYear() }}.</small>
            </div>
            <div v-if="presupuestoMensual > 0" class="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
              <i class="pi pi-check-circle mr-2"></i>
              <span>Presupuesto configurado: RD$ {{ formatMoney(presupuestoMensual) }}</span>
            </div>
            <div v-else class="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-500">
              <i class="pi pi-info-circle mr-2"></i>
              <span>Sin presupuesto. Ingrese un monto mayor a 0 para activar el control presupuestario.</span>
            </div>
            <Divider />
            <div class="text-sm text-gray-600">
              <p class="font-semibold mb-1">Resumen del mes actual:</p>
              <div class="flex justify-between py-1"><span>Gastos registrados:</span><span class="font-bold text-red-600">RD$ {{ formatMoney(gastosDelMesActual) }}</span></div>
              <div class="flex justify-between py-1"><span>Presupuesto:</span><span class="font-bold">RD$ {{ formatMoney(presupuestoMensual) }}</span></div>
              <div v-if="presupuestoMensual > 0" class="flex justify-between py-1">
                <span>Disponible:</span>
                <span class="font-bold" :class="presupuestoExcedido ? 'text-red-600' : 'text-green-600'">RD$ {{ formatMoney(Math.max(0, presupuestoMensual - gastosDelMesActual)) }}</span>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancelar" severity="secondary" outlined @click="visibleConfigPresupuesto = false" />
            <Button label="Guardar" severity="primary" icon="pi pi-check" @click="guardarPresupuesto" />
          </div>
        </template>
      </Dialog>

      <Toast />
    </div>
  </main>
</template>

<style scoped>
.content-wrapper { min-height: calc(100vh - 60px); }
.content-wrapper :deep(.p-card .p-card-content) { padding: 0; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
