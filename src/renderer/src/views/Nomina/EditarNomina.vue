<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute(); 
import {
  nfecha,
  peticionesFetchOffline,
  envioElectron,
  generarCodigoUnico,
  encryptarPassword
} from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import Dialog from 'primevue/dialog';
import { useDatosEmpresa } from '@/stores';
import jsPDF from 'jspdf';

import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();
const basic = ref({ dateFormat: 'd/m/Y' });

const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const datosJSON = ref([]);

const datoscampos = ref({});
const todosLosnomina = ref([]);
const ajusteDialogVisible = ref(false);
const ajusteForm = ref({ tipo: 'INGRESO', concepto: '', monto: '' });
const nominaRegistroDialogVisible = ref(false);
const nominaRegistroForm = ref({
  comision: 0, hora_extra: 0, ingreso_sdss: 0,
  sf_salud: 0, svejez_discap: 0, desc_percapita: 0,
  base_isr: 0, imp_sobre_renta: 0, prestamos: 0
});
const editNominaDialogVisible = ref(false);
const editNominaIndex = ref(-1);
const editNominaForm = ref({
  comision: 0, hora_extra: 0, ingreso_sdss: 0,
  sf_salud: 0, svejez_discap: 0, desc_percapita: 0,
  base_isr: 0, imp_sobre_renta: 0, prestamos: 0,
  descripcion: ''
});
const deleteConfirmDialogVisible = ref(false);
const deleteNominaIndex = ref(-1);
const calcularFechaFinalNomina = (fechaInicio, tipo) => {
  if (!fechaInicio) return nfecha('fecha');
  const p = fechaInicio.split('/');
  const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  switch (tipo) {
    case 'SEMANAL': d.setDate(d.getDate() + 7); break;
    case 'QUINCENAL': d.setDate(d.getDate() + 15); break;
    case 'MENSUAL': d.setMonth(d.getMonth() + 1); break;
    case 'QUINCENA_15_30':
      if (d.getDate() <= 15) { d.setDate(15); }
      else { d.setMonth(d.getMonth() + 1); d.setDate(0); }
      break;
  }
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

watch([() => datoscampos.value.tipo_nomina, () => datoscampos.value.fecha_inicio], () => {
  if (datoscampos.value.fecha_inicio && datoscampos.value.tipo_nomina) {
    datoscampos.value.fecha_final = calcularFechaFinalNomina(datoscampos.value.fecha_inicio, datoscampos.value.tipo_nomina);
  }
});

const retencionAfpRate = ref(2.87);
const retencionSfsRate = ref(3.04);

const cargarRetencionesEmpleado = async () => {
  const cedula = datoscampos.value?.cedula;
  if (!cedula) return;
  const response = await peticionesFetchOffline('getDataAsArray', 'empleados');
  const empleado = (Array.isArray(response) ? response : []).find(e => e.cedula === cedula);
  if (empleado) {
    retencionAfpRate.value = parseFloat(empleado.retencion_afp) || 2.87;
    retencionSfsRate.value = parseFloat(empleado.retencion_sfs) || 3.04;
  }
};

const pagarDialogVisible = ref(false);
const cuentasList = ref([]);
const cuentaGastoSeleccionada = ref(null);
const cuentasCredito = ref([{ cuenta: null, monto: 0 }]);
const metodoPago = ref('EFECTIVO');

const totalNetoNomina = computed(() => parseFloat(datoscampos.value.total_neto_pagar || 0));

const totalCredito = computed(() =>
  cuentasCredito.value.reduce((s, l) => s + parseFloat(l.monto || 0), 0)
);

const creditosValidos = computed(() =>
  cuentasCredito.value.filter(l => l.cuenta && parseFloat(l.monto || 0) > 0)
);

const creditoValido = computed(() => {
  const total = totalNetoNomina.value;
  return total > 0 && Math.abs(totalCredito.value - total) < 0.01;
});

const agregarLineaCredito = () => {
  cuentasCredito.value.push({ cuenta: null, monto: 0 });
};

const eliminarLineaCredito = (index) => {
  if (cuentasCredito.value.length > 1) {
    cuentasCredito.value.splice(index, 1);
  }
};

const distribuirMonto = () => {
  const total = totalNetoNomina.value;
  const count = cuentasCredito.value.length;
  const monto = count > 0 ? total / count : 0;
  cuentasCredito.value.forEach(l => { l.monto = parseFloat(monto.toFixed(2)); });
  if (count > 0) {
    const suma = cuentasCredito.value.reduce((s, l) => s + parseFloat(l.monto || 0), 0);
    cuentasCredito.value[count - 1].monto = parseFloat((total - (suma - (cuentasCredito.value[count - 1].monto || 0))).toFixed(2));
  }
};

const retencionAFP = computed(() => {
  const s = parseFloat(datoscampos.value.sueldo || 0);
  return s * retencionAfpRate.value / 100;
});
const retencionSFS = computed(() => {
  const s = parseFloat(datoscampos.value.sueldo || 0);
  return s * retencionSfsRate.value / 100;
});

const calcularRetencionesLegales = () => {
  const sueldo = parseFloat(datoscampos.value.sueldo || 0);
  if (sueldo <= 0) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un sueldo base mayor a 0 primero.', life: 3000 });
    return;
  }
  const afp = sueldo * retencionAfpRate.value / 100;
  const sfs = sueldo * retencionSfsRate.value / 100;
  const nuevoRegistro = {
    comision: 0, hora_extra: 0, ingreso_sdss: 0,
    sf_salud: parseFloat(sfs.toFixed(2)),
    svejez_discap: parseFloat(afp.toFixed(2)),
    desc_percapita: 0, base_isr: 0, imp_sobre_renta: 0, prestamos: 0,
    descripcion: 'RETENCIONES LEGALES',
    total_ingresos: '0.00',
    total_deducciones: (afp + sfs).toFixed(2),
    total_neto: (-afp - sfs).toFixed(2)
  };
  const idx = datoscampos.value.nomina.findIndex(r => r.descripcion === 'RETENCIONES LEGALES');
  if (idx >= 0) {
    datoscampos.value.nomina[idx] = nuevoRegistro;
  } else {
    datoscampos.value.nomina.push(nuevoRegistro);
  }
  recalcTotales();
  toast.add({ severity: 'success', summary: 'Retenciones calculadas', detail: `AFP: RD$ ${afp.toFixed(2)} | SFS: RD$ ${sfs.toFixed(2)}`, life: 4000 });
};

watch(() => datoscampos.value.sueldo, () => {
  if (parseFloat(datoscampos.value.sueldo || 0) > 0) {
    const afp = parseFloat(datoscampos.value.sueldo || 0) * retencionAfpRate.value / 100;
    const sfs = parseFloat(datoscampos.value.sueldo || 0) * retencionSfsRate.value / 100;
    const idx = datoscampos.value.nomina?.findIndex?.(r => r.descripcion === 'RETENCIONES LEGALES') ?? -1;
    if (idx >= 0) {
      datoscampos.value.nomina[idx].sf_salud = parseFloat(sfs.toFixed(2));
      datoscampos.value.nomina[idx].svejez_discap = parseFloat(afp.toFixed(2));
      datoscampos.value.nomina[idx].total_deducciones = (afp + sfs).toFixed(2);
      datoscampos.value.nomina[idx].total_neto = (-afp - sfs).toFixed(2);
      recalcTotales();
    }
  }
});

const asientoDialogVisible = ref(false);
const asientoDetalle = ref(null);

const verAsientoContable = async () => {
  if (!datoscampos.value.asiento_id) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Esta nómina no tiene asiento contable.', life: 3000 });
    return;
  }
  const response = await peticionesFetchOffline('getDataAsArray', 'asientodiario');
  const encontrado = response.find(a => a.numero === datoscampos.value.asiento_id || a.id == datoscampos.value.asiento_id);
  if (encontrado) {
    try {
      asientoDetalle.value = {
        ...encontrado,
        lineas: JSON.parse(encontrado.asiento || '{}').lineas || []
      };
    } catch (e) {
      asientoDetalle.value = { ...encontrado, lineas: [] };
    }
    asientoDialogVisible.value = true;
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el asiento contable.', life: 4000 });
  }
};

const cargarDatos = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'nomina');
  todosLosnomina.value = response;
  const encontrado = response.find((n) => n.id == route.params.id) || {};
  datoscampos.value = { ...encontrado, nomina: JSON.parse(encontrado.nomina || '[]') };
  await cargarRetencionesEmpleado();
};

const datosConfig = async () => {
  const response = await envioElectron('datosarchivo');
  datosJSON.value = response;
  link.value = datosJSON.value.VITE_LINKURL;
  api.value = datosJSON.value.VITE_LINK_API;
  token.value = datosJSON.value.VITE_TOKEN;
  tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
};

onMounted(async () => {
  await datosConfig();
  tokenCifrado.value = await encryptarPassword(token.value, 10);
  await cargarDatos();
});

const recalcTotales = () => {
  const sumIngresos = datoscampos.value.nomina.reduce(
    (sum, n) => sum + parseFloat(n.total_ingresos || 0),
    0
  );

  const sumDeducciones = datoscampos.value.nomina.reduce(
    (sum, n) => sum + parseFloat(n.total_deducciones || 0),
    0
  );

  const sueldoBase = parseFloat(datoscampos.value.sueldo || 0);

  datoscampos.value.total_deducciones = sumDeducciones.toFixed(2);

  datoscampos.value.total_neto_pagar = (
    sueldoBase + sumIngresos - sumDeducciones
  ).toFixed(2);
};

const navigate = (action) => {
  const currentIndex = todosLosnomina.value.findIndex(n => n.id == route.params.id);
  if (currentIndex === -1) return;
  let newIndex;
  switch (action) {
    case 'primero': newIndex = 0; break;
    case 'anterior': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
    case 'siguiente': newIndex = currentIndex + 1 < todosLosnomina.value.length ? currentIndex + 1 : currentIndex; break;
    case 'ultimo': newIndex = todosLosnomina.value.length - 1; break;
    default: return;
  }
  const nuevo = todosLosnomina.value[newIndex];
  router.push({ path: `/editarnomina/${nuevo.id}` });
  datoscampos.value = { ...nuevo, nomina: JSON.parse(nuevo.nomina || '[]') };
};

async function funcionActualizar(e) {
  if (e?.preventDefault) e.preventDefault();
  if (!datoscampos.value) return;
  if (datoscampos.value.hasOwnProperty('created_at')) {
    datoscampos.value.updated_at = nfecha('timestamp');
  }
  const payload = { ...datoscampos.value, nomina: JSON.stringify(datoscampos.value.nomina) };
  const envioDatos = await peticionesFetchOffline('updateData', 'nomina', JSON.stringify(payload));
  if (envioDatos[0] == 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar los datos.', life: 3000 });
  }
}

const onRowClickNomina = (event) => {
  abrirEditNominaDialog(event.index, event.data);
};

const abrirEditNominaDialog = (index, datos) => {
  editNominaIndex.value = index;
  editNominaForm.value = {
    comision: parseFloat(datos.comision || 0),
    hora_extra: parseFloat(datos.hora_extra || 0),
    ingreso_sdss: parseFloat(datos.ingreso_sdss || 0),
    sf_salud: parseFloat(datos.sf_salud || 0),
    svejez_discap: parseFloat(datos.svejez_discap || 0),
    desc_percapita: parseFloat(datos.desc_percapita || 0),
    base_isr: parseFloat(datos.base_isr || 0),
    imp_sobre_renta: parseFloat(datos.imp_sobre_renta || 0),
    prestamos: parseFloat(datos.prestamos || 0),
    descripcion: datos.descripcion || '',
  };
  editNominaDialogVisible.value = true;
};

const confirmarEditNomina = async () => {
  const index = editNominaIndex.value;
  const f = editNominaForm.value;
  editNominaDialogVisible.value = false;

  const totalIngresos = (parseFloat(f.comision) || 0) + (parseFloat(f.hora_extra) || 0) + (parseFloat(f.ingreso_sdss) || 0);
  const totalDeducciones = (parseFloat(f.sf_salud) || 0) + (parseFloat(f.svejez_discap) || 0) +
    (parseFloat(f.desc_percapita) || 0) + (parseFloat(f.base_isr) || 0) + (parseFloat(f.imp_sobre_renta) || 0) + (parseFloat(f.prestamos) || 0);
  const totalNeto = totalIngresos - totalDeducciones;

  datoscampos.value.nomina[index] = {
    comision: parseFloat(f.comision) || 0,
    hora_extra: parseFloat(f.hora_extra) || 0,
    ingreso_sdss: parseFloat(f.ingreso_sdss) || 0,
    sf_salud: parseFloat(f.sf_salud) || 0,
    svejez_discap: parseFloat(f.svejez_discap) || 0,
    desc_percapita: parseFloat(f.desc_percapita) || 0,
    base_isr: parseFloat(f.base_isr) || 0,
    imp_sobre_renta: parseFloat(f.imp_sobre_renta) || 0,
    prestamos: parseFloat(f.prestamos) || 0,
    descripcion: f.descripcion || '',
    total_ingresos: totalIngresos.toFixed(2),
    total_deducciones: totalDeducciones.toFixed(2),
    total_neto: totalNeto.toFixed(2),
  };

  recalcTotales();
  await funcionActualizar(new Event('submit'));
  toast.add({ severity: 'success', summary: 'Editado', detail: `Registro #${index + 1} actualizado.`, life: 3000 });
};

const abrirDeleteConfirm = (index) => {
  deleteNominaIndex.value = index;
  deleteConfirmDialogVisible.value = true;
};

const confirmarEliminarNomina = async () => {
  deleteConfirmDialogVisible.value = false;
  datoscampos.value.nomina.splice(deleteNominaIndex.value, 1);
  recalcTotales();
  await funcionActualizar();
  toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Registro eliminado.', life: 3000 });
};

/*******************************************************************/
const abrirAjusteDialog = () => {
  ajusteForm.value = { tipo: 'INGRESO', concepto: '', monto: '' };
  ajusteDialogVisible.value = true;
};

const confirmarAjusteIndividual = async () => {
  if (!ajusteForm.value.concepto || !ajusteForm.value.monto || parseFloat(ajusteForm.value.monto) <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Concepto y monto v\u00e1lido son requeridos.', life: 3000 });
    return;
  }

  ajusteDialogVisible.value = false;
  const esIngreso = ajusteForm.value.tipo === 'INGRESO';
  const monto = parseFloat(ajusteForm.value.monto);

  const newEntry = {
    comision: 0,
    hora_extra: 0,
    ingreso_sdss: esIngreso ? monto : 0,
    sf_salud: 0,
    svejez_discap: 0,
    desc_percapita: esIngreso ? 0 : monto,
    base_isr: 0,
    imp_sobre_renta: 0,
    prestamos: 0,
    descripcion: ajusteForm.value.concepto,
    total_ingresos: esIngreso ? monto.toFixed(2) : '0.00',
    total_deducciones: esIngreso ? '0.00' : monto.toFixed(2),
    total_neto: esIngreso ? monto.toFixed(2) : (-monto).toFixed(2)
  };

  datoscampos.value.nomina.push(newEntry);
  recalcTotales();
  await funcionActualizar(new Event('submit'));
  toast.add({ severity: 'success', summary: 'Agregado', detail: `Ajuste "${ajusteForm.value.concepto}" agregado correctamente.`, life: 3500 });
};
/*******************************************************************/
const abrirNominaRegistroDialog = () => {
  nominaRegistroForm.value = {
    comision: 0, hora_extra: 0, ingreso_sdss: 0,
    sf_salud: 0, svejez_discap: 0, desc_percapita: 0,
    base_isr: 0, imp_sobre_renta: 0, prestamos: 0
  };
  nominaRegistroDialogVisible.value = true;
};

const confirmarNominaRegistro = async () => {
  nominaRegistroDialogVisible.value = false;
  const f = nominaRegistroForm.value;

  const totalIngresos = (parseFloat(f.comision) || 0) + (parseFloat(f.hora_extra) || 0) + (parseFloat(f.ingreso_sdss) || 0);
  const totalDeducciones = (parseFloat(f.sf_salud) || 0) + (parseFloat(f.svejez_discap) || 0) +
    (parseFloat(f.desc_percapita) || 0) + (parseFloat(f.base_isr) || 0) + (parseFloat(f.imp_sobre_renta) || 0) + (parseFloat(f.prestamos) || 0);
  const totalNeto = totalIngresos - totalDeducciones;

  const nuevoRegistro = {
    comision: parseFloat(f.comision) || 0,
    hora_extra: parseFloat(f.hora_extra) || 0,
    ingreso_sdss: parseFloat(f.ingreso_sdss) || 0,
    sf_salud: parseFloat(f.sf_salud) || 0,
    svejez_discap: parseFloat(f.svejez_discap) || 0,
    desc_percapita: parseFloat(f.desc_percapita) || 0,
    base_isr: parseFloat(f.base_isr) || 0,
    imp_sobre_renta: parseFloat(f.imp_sobre_renta) || 0,
    prestamos: parseFloat(f.prestamos) || 0,
    total_ingresos: totalIngresos.toFixed(2),
    total_deducciones: totalDeducciones.toFixed(2),
    total_neto: totalNeto.toFixed(2),
  };

  datoscampos.value.nomina.push(nuevoRegistro);
  recalcTotales();
  await funcionActualizar(new Event('submit'));
  toast.add({ severity: 'success', summary: 'Agregado', detail: 'Registro agregado correctamente.', life: 3500 });
};


const generarAsientoContableNomina = async (nomina, cuentasCreditoArray, cuentaDebito, metodoPago) => {
  const sueldo = parseFloat(nomina.sueldo || 0);
  let nominaArray = [];
  try { nominaArray = JSON.parse(nomina.nomina || '[]'); } catch (e) { nominaArray = []; }

  let ingresosExtra = 0;
  let afp = 0, sfs = 0, isr = 0;

  for (const item of nominaArray) {
    ingresosExtra += parseFloat(item.comision || 0) + parseFloat(item.hora_extra || 0) + parseFloat(item.ingreso_sdss || 0);
    afp += parseFloat(item.svejez_discap || 0);
    sfs += parseFloat(item.sf_salud || 0);
    isr += parseFloat(item.imp_sobre_renta || 0) + parseFloat(item.base_isr || 0);
  }

  const totalBruto = sueldo + ingresosExtra;
  const totalNeto = parseFloat(nomina.total_neto_pagar || 0);

  const lineas = [
    { cuenta: cuentaDebito.nombre, debe: totalBruto, haber: 0 }
  ];
  for (const l of cuentasCreditoArray) {
    if (l.cuenta && parseFloat(l.monto || 0) > 0) {
      lineas.push({ cuenta: l.cuenta.nombre, debe: 0, haber: parseFloat(l.monto) });
    }
  }
  if (afp > 0) lineas.push({ cuenta: 'RETENCIONES AFP POR PAGAR', debe: 0, haber: afp });
  if (sfs > 0) lineas.push({ cuenta: 'RETENCIONES SFS POR PAGAR', debe: 0, haber: sfs });
  if (isr > 0) lineas.push({ cuenta: 'ISR POR PAGAR', debe: 0, haber: isr });

  const asiento = {
    numero: `NOM-${Date.now()}`,
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    asiento: JSON.stringify({
      descripcion: `Pago de nómina - ${nomina.nombre || ''} - No. ${nomina.no_nomina || ''}`,
      lineas,
      metodo_pago: metodoPago,
      origen: 'NOMINA',
      origen_id: nomina.no_nomina || ''
    }),
    usuario: datosEmpresa.usuario?.nombre || 'SISTEMA'
  };

  await peticionesFetchOffline('insertData', 'asientodiario', JSON.stringify(asiento));
  return asiento.numero;
};

const abrirPagarDialog = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
  cuentasList.value = Array.isArray(response) ? response : [];
  cuentaGastoSeleccionada.value = null;
  cuentasCredito.value = [{ cuenta: null, monto: 0 }];
  metodoPago.value = 'EFECTIVO';
  pagarDialogVisible.value = true;
};

const confirmarPagarNomina = async () => {
  if (!cuentaGastoSeleccionada.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione la cuenta de gasto (débito).', life: 3000 });
    return;
  }
  if (creditosValidos.value.length === 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Agregue al menos una cuenta de crédito con monto mayor a 0.', life: 3000 });
    return;
  }
  if (!creditoValido.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: `La suma de créditos (RD$ ${totalCredito.value.toFixed(2)}) no coincide con el total neto (RD$ ${totalNetoNomina.value.toFixed(2)}).`, life: 5000 });
    return;
  }
  if (!metodoPago.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Seleccione un método de pago.', life: 3000 });
    return;
  }

  pagarDialogVisible.value = false;
  const nomina = datoscampos.value;
  const monto = parseFloat(nomina.total_neto_pagar || 0);
  const usuario = datosEmpresa.usuario?.email || datosEmpresa.usuario?.nombre || 'SISTEMA';
  const almacen = datosEmpresa.empresa?.nombre || '';

  // Generar asiento contable con débito/crédito
  let asientoNumero = '';
  try {
    asientoNumero = await generarAsientoContableNomina(
      nomina,
      creditosValidos.value,
      cuentaGastoSeleccionada.value,
      metodoPago.value
    );
  } catch (error) {
    console.error('Error generando asiento contable:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el asiento contable', life: 4000 });
    return;
  }

  const gasto = {
    cajero: usuario,
    cantidad: monto.toFixed(2),
    fecha: nfecha('fecha'),
    hora: nfecha('hora'),
    turno: 'DIA',
    metodo: metodoPago.value,
    descripcion: `PAGO NÓMINA No. ${nomina.no_nomina} - ${nomina.nombre || ''}`,
    mes: nfecha('mes'),
    year: nfecha('year'),
    usuario: usuario,
    almacen: almacen,
    created_at: nfecha('timestamp'),
    updated_at: nfecha('timestamp')
  };

  try {
    const envioDatos = await peticionesFetchOffline('insertData', 'gastos', JSON.stringify(gasto));
    if (envioDatos[0] === 'ok') {
      datoscampos.value.estado = 'PAGADA';
      datoscampos.value.asiento_id = asientoNumero;
      await funcionActualizar(new Event('submit'));
      toast.add({ severity: 'success', summary: 'Pagada', detail: `Nómina pagada — Asiento No. ${asientoNumero}`, life: 6000 });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al registrar el pago.', life: 5000 });
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el pago.', life: 5000 });
  }
};

const fnGenerarPDF = async () => {
  try {
    // 1️⃣ Pedir formato de impresión
    const { value: formato } = await Swal.fire({
      title: "Selecciona formato de impresión",
      input: "radio",
      inputOptions: {
        '80mm': 'Térmica (80 mm)',
        'carta': 'Carta (8.5" × 11")'
      },
      inputValue: 'carta',
      confirmButtonText: "Generar PDF",
      showCancelButton: true,
      cancelButtonText: "Cancelar"
    });

    if (!formato) return;

    // 2️⃣ Crear el PDF dinámicamente
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: formato === "80mm" ? [80, 200] : "letter"
    });

    const nomina = datoscampos.value;
    const ancho = doc.internal.pageSize.getWidth();

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("NÓMINA DE EMPLEADO", ancho / 2, 10, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`No. Nómina: ${nomina.no_nomina || ''}`, 10, 20);
    doc.text(`Fecha inicio: ${nomina.fecha_inicio || ''}`, 10, 25);
    doc.text(`Fecha final: ${nomina.fecha_final || ''}`, 10, 30);
    doc.text(`Estado: ${nomina.estado || ''}`, 10, 35);

    // Datos del empleado
    doc.setFont("helvetica", "bold");
    doc.text("Empleado:", 10, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`${nomina.nombre || ''}`, 35, 45);
    doc.text(`Cédula: ${nomina.cedula || ''}`, 10, 50);
    doc.text(`Cargo: ${nomina.cargo || ''}`, 10, 55);
    doc.text(`Sueldo Base: RD$ ${(nomina.sueldo || 0).toLocaleString()}`, 10, 60);

    // Tabla de detalles de nómina
    let y = 70;
    doc.setFont("helvetica", "bold");
    doc.text("Concepto", 10, y);
    doc.text("Monto (RD$)", ancho - 20, y, { align: "right" });
    y += 5;
    doc.setFont("helvetica", "normal");

    const conceptos = [
      { nombre: "Comisión", valor: nomina.nomina?.reduce((a, n) => a + parseFloat(n.comision || 0), 0) },
      { nombre: "Horas extra", valor: nomina.nomina?.reduce((a, n) => a + parseFloat(n.hora_extra || 0), 0) },
      { nombre: "Ingreso SDSS", valor: nomina.nomina?.reduce((a, n) => a + parseFloat(n.ingreso_sdss || 0), 0) },
      { nombre: "Seguro Salud", valor: nomina.nomina?.reduce((a, n) => a + parseFloat(n.sf_salud || 0), 0) },
      { nombre: "Seguro Vejez/Discap.", valor: nomina.nomina?.reduce((a, n) => a + parseFloat(n.svejez_discap || 0), 0) },
      { nombre: "Desc. per cápita", valor: nomina.nomina?.reduce((a, n) => a + parseFloat(n.desc_percapita || 0), 0) },
      { nombre: "Base ISR", valor: nomina.nomina?.reduce((a, n) => a + parseFloat(n.base_isr || 0), 0) },
      { nombre: "Imp. sobre renta", valor: nomina.nomina?.reduce((a, n) => a + parseFloat(n.imp_sobre_renta || 0), 0) },
      { nombre: "Préstamos", valor: nomina.nomina?.reduce((a, n) => a + parseFloat(n.prestamos || 0), 0) }
    ];

    conceptos.forEach(c => {
      doc.text(c.nombre, 10, y);
      doc.text(c.valor.toFixed(2), ancho - 20, y, { align: "right" });
      y += 5;
    });

    // Totales
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Total Deducciones:", 10, y);
    doc.text(`RD$ ${(nomina.total_deducciones || 0).toLocaleString()}`, ancho - 20, y, { align: "right" });
    y += 6;
    doc.text("Total Neto a Pagar:", 10, y);
    doc.text(`RD$ ${(nomina.total_neto_pagar || 0).toLocaleString()}`, ancho - 20, y, { align: "right" });

    y += 20;
    doc.setFont("helvetica", "normal");
    doc.text("_________________________________________", ancho / 2, y, { align: "center" });
    doc.text("Firma del Empleado", ancho / 2, y + 5, { align: "center" });

    // 3️⃣ Convertir a Blob y mostrar en SweetAlert
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    await Swal.fire({
      title: `Vista previa (${formato === "80mm" ? "Térmica" : "Carta"})`,
      html: `
        <iframe src="${pdfUrl}" width="100%" height="500px" style="border:none;border-radius:8px;"></iframe>
      `,
      width: "80%",
      showConfirmButton: true,
      confirmButtonText: "Descargar PDF",
      showCancelButton: true,
      cancelButtonText: "Cerrar",
      preConfirm: () => {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `nomina_${nomina.no_nomina || "empleado"}.pdf`;
        link.click();
      }
    });

  } catch (err) {
    console.error("Error generando PDF:", err);
    Swal.fire("Error", "No se pudo generar el PDF correctamente.", "error");
  }
};

const colorTipo = (tipo) => {
  const colores = { SEMANAL: '#3b82f6', QUINCENAL: '#f59e0b', MENSUAL: '#10b981', QUINCENA_15_30: '#8b5cf6' };
  return colores[tipo] || '#64748b';
};
</script>

<template>
  <main class="nomina-wrapper">
    <div class="w-full px-4 py-6 space-y-6">
      <section class="nomina-hero shadow-lg">
        <div class="nomina-hero__text">
          <p class="eyebrow">Nómina</p>
          <h1>Editar nómina</h1>
          <p>Revisa, ajusta registros y guarda los cambios de este periodo.</p>
          <div class="nomina-hero__meta">
            <span class="meta-pill">
              <i class="pi pi-hashtag"></i>
              No. {{ datoscampos.no_nomina || '--' }}
            </span>
            <span class="meta-pill">
              <i class="pi pi-calendar"></i>
              {{ datoscampos.fecha_inicio || '' }} - {{ datoscampos.fecha_final || '' }}
            </span>
            <span class="meta-pill">
              <i class="pi pi-wallet"></i>
              Neto: {{ datoscampos.total_neto_pagar || '0.00' }}
            </span>
            <span v-if="datoscampos.tipo_nomina" class="meta-pill" :style="{ background: colorTipo(datoscampos.tipo_nomina) + '22', borderColor: colorTipo(datoscampos.tipo_nomina) + '44' }">
              <i class="pi pi-tag"></i>
              {{ datoscampos.tipo_nomina }}
            </span>
            <span v-if="datoscampos.asiento_id" class="meta-pill" style="background:rgba(14,165,233,0.2);border-color:rgba(14,165,233,0.3)">
              <i class="pi pi-book"></i>
              Asiento: {{ datoscampos.asiento_id }}
            </span>
          </div>
        </div>
        <div class="nomina-hero__stats">
          <div class="stat-card">
            <span class="label">Registros</span>
            <span class="value">{{ datoscampos.nomina?.length || 0 }}</span>
          </div>
          <div class="stat-card alt">
            <span class="label">Deducciones</span>
            <span class="value">{{ datoscampos.total_deducciones || '0.00' }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Estado</span>
            <span class="value">{{ datoscampos.estado || '--' }}</span>
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Acciones</p>
            <h2>Administrar esta nómina</h2>
            <span class="helper-text">Navega entre nóminas, guarda o imprime.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-angle-double-left" label="Primero" text @click="navigate('primero')" />
            <Button icon="pi pi-angle-left" label="Anterior" text @click="navigate('anterior')" />
            <Button icon="pi pi-angle-right" label="Siguiente" text @click="navigate('siguiente')" />
            <Button icon="pi pi-angle-double-right" label="Último" text @click="navigate('ultimo')" />
            <Button icon="pi pi-save" label="Guardar" severity="primary" @click="funcionActualizar" />
            <Button icon="pi pi-dollar" label="Pagar" severity="success" @click="abrirPagarDialog" />
            <Button icon="pi pi-print" label="Imprimir" severity="info" outlined @click="fnGenerarPDF" />
            <router-link to="/nomina">
              <Button icon="pi pi-arrow-left" label="Volver" severity="secondary" outlined />
            </router-link>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>No nómina</label>
            <InputText v-model="datoscampos.no_nomina" readonly />
          </div>
          <div class="field">
            <label>Fecha inicio</label>
            <flat-pickr v-model="datoscampos.fecha_inicio" class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic" />
          </div>
          <div class="field">
            <label>Fecha final</label>
            <flat-pickr v-model="datoscampos.fecha_final" class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid" :config="basic" />
          </div>
          <div class="field md:col-span-2">
            <label>Tipo de Nómina</label>
            <SelectButton v-model="datoscampos.tipo_nomina" :options="['SEMANAL','QUINCENAL','MENSUAL','QUINCENA_15_30']" fluid :allowEmpty="false" />
          </div>
          <div class="field">
            <label>Estado</label>
            <Dropdown v-model="datoscampos.estado" :options="['ACTIVA','PAGADA','CANCELADA']" />
          </div>
          <div class="field">
            <label>Empleado</label>
            <InputText v-model="datoscampos.nombre" />
          </div>
          <div class="field">
            <label>Cargo</label>
            <InputText v-model="datoscampos.cargo" />
          </div>
          <div class="field">
            <label>Sueldo</label>
            <InputText v-model="datoscampos.sueldo" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Deducciones</label>
            <InputText v-model="datoscampos.total_deducciones" readonly />
          </div>
          <div class="field">
            <label>Neto a pagar</label>
            <InputText v-model="datoscampos.total_neto_pagar" readonly />
          </div>
          <div class="field" v-if="datoscampos.asiento_id">
            <label>Asiento Contable</label>
            <div class="flex gap-2 items-center">
              <InputText :value="datoscampos.asiento_id" readonly class="bg-blue-50 text-blue-700 font-semibold flex-1" />
              <Button icon="pi pi-eye" severity="info" text rounded @click="verAsientoContable" v-tooltip.top="'Ver detalle del asiento'" />
            </div>
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Retenciones Legales</p>
            <h2>AFP y SFS</h2>
            <span class="helper-text">Cálculo automático basado en el sueldo base.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-calculator" label="Calcular Retenciones" severity="info" outlined @click="calcularRetencionesLegales" />
          </div>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide">Sueldo Base</p>
              <p class="text-xl font-bold text-blue-700">RD$ {{ parseFloat(datoscampos.sueldo || 0).toFixed(2) }}</p>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide">AFP ({{ retencionAfpRate }}%)</p>
              <p class="text-xl font-bold text-purple-700">RD$ {{ retencionAFP.toFixed(2) }}</p>
            </div>
            <div class="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide">SFS ({{ retencionSfsRate }}%)</p>
              <p class="text-xl font-bold text-teal-700">RD$ {{ retencionSFS.toFixed(2) }}</p>
            </div>
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide">Total Retenciones</p>
              <p class="text-xl font-bold text-orange-700">RD$ {{ (retencionAFP + retencionSFS).toFixed(2) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Registros de nómina</p>
            <h2>Ingresos y deducciones</h2>
            <span class="helper-text">Agrega o elimina conceptos y recalcula automáticamente.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-plus" label="Agregar registro" severity="success" outlined @click="abrirNominaRegistroDialog" />
            <Button icon="pi pi-sliders-v" label="Ingreso / Deducción" severity="info" outlined @click="abrirAjusteDialog" />
          </div>
        </div>

        <div class="panel__body">
          <DataTable
            class="nomina-table"
            :value="datoscampos.nomina"
            :rows="5"
            scrollable
            scrollHeight="300px"
            dataKey="id"
            @row-click="onRowClickNomina"
          >
            <Column header="#" style="width: 3rem">
              <template #body="{ index }">
                {{ index + 1 }}
              </template>
            </Column>
            <Column field="comision" header="Comisión" />
            <Column field="otros_ingresos" header="Otros ingresos" />
            <Column field="total_ingresos" header="Total ingresos" />
            <Column field="total_deducciones" header="Deducciones" />
            <Column field="descripcion" header="Descripción" />
            <Column field="hora_extra" header="Hora extra" />
            <Column field="ingreso_sdss" header="Ingreso SDSS" />
            <Column field="sf_salud" header="Seguro salud" />
            <Column field="svejez_discap" header="Seguro vejez/discap." />
            <Column field="desc_percapita" header="Desc. per cápita" />
            <Column field="base_isr" header="Base ISR" />
            <Column field="imp_sobre_renta" header="Imp. renta" />
            <Column field="prestamos" header="Préstamos" />
            <Column field="total_neto" header="Total neto" />
            <Column header="Acciones" style="width: 8.5rem">
              <template #body="{ index, data }">
                <div class="flex gap-1">
                  <Button icon="pi pi-pencil" text severity="info" @click="abrirEditNominaDialog(index, data)" />
                  <Button icon="pi pi-trash" text severity="danger" @click="abrirDeleteConfirm(index)" />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

      <Toast />
    </div>
  </main>

  <Dialog v-model:visible="nominaRegistroDialogVisible" modal :closable="true" :style="{ width: '700px' }" :breakpoints="{ '640px': '95vw' }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
          <i class="pi pi-receipt text-teal-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Agregar registro de n&oacute;mina</h2>
          <p class="text-sm text-gray-500">Ingresa los valores para este concepto</p>
        </div>
      </div>
    </template>

    <div class="grid grid-cols-2 gap-4 p-2">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Comisi&oacute;n (RD$)</label>
        <InputText type="number" v-model="nominaRegistroForm.comision" placeholder="0.00" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Horas extra (RD$)</label>
        <InputText type="number" v-model="nominaRegistroForm.hora_extra" placeholder="0.00" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Ingreso SDSS (RD$)</label>
        <InputText type="number" v-model="nominaRegistroForm.ingreso_sdss" placeholder="0.00" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Seguro de salud (RD$)</label>
        <InputText type="number" v-model="nominaRegistroForm.sf_salud" placeholder="0.00" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Seguro vejez/discap. (RD$)</label>
        <InputText type="number" v-model="nominaRegistroForm.svejez_discap" placeholder="0.00" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Desc. per c&aacute;pita (RD$)</label>
        <InputText type="number" v-model="nominaRegistroForm.desc_percapita" placeholder="0.00" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Base ISR (RD$)</label>
        <InputText type="number" v-model="nominaRegistroForm.base_isr" placeholder="0.00" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Imp. sobre renta (RD$)</label>
        <InputText type="number" v-model="nominaRegistroForm.imp_sobre_renta" placeholder="0.00" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Pr&eacute;stamos (RD$)</label>
        <InputText type="number" v-model="nominaRegistroForm.prestamos" placeholder="0.00" fluid />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" outlined @click="nominaRegistroDialogVisible = false" />
        <Button label="Agregar" icon="pi pi-check" @click="confirmarNominaRegistro" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="ajusteDialogVisible" modal :closable="true" :style="{ width: '500px' }" :breakpoints="{ '640px': '95vw' }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
          <i class="pi pi-sliders-v text-indigo-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Agregar Ingreso / Deducci&oacute;n</h2>
          <p class="text-sm text-gray-500">Aplica un ajuste individual a esta n&oacute;mina</p>
        </div>
      </div>
    </template>

    <div class="space-y-4 p-2">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <SelectButton v-model="ajusteForm.tipo" :options="['INGRESO', 'DEDUCCION']" fluid />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
        <InputText v-model="ajusteForm.concepto" placeholder="Ej: Bono extra, Descuento" fluid />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Monto (RD$)</label>
        <InputText type="number" v-model="ajusteForm.monto" placeholder="0.00" fluid />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" outlined @click="ajusteDialogVisible = false" />
        <Button label="Agregar" icon="pi pi-check" @click="confirmarAjusteIndividual" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="editNominaDialogVisible" modal :closable="true" :style="{ width: '700px' }" :breakpoints="{ '640px': '95vw' }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <i class="pi pi-pencil text-amber-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Editar registro de n&oacute;mina</h2>
          <p class="text-sm text-gray-500">Modifica los valores de este concepto</p>
        </div>
      </div>
    </template>

    <div class="grid grid-cols-2 gap-4 p-2">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Comisi&oacute;n (RD$)</label>
        <InputText type="number" v-model="editNominaForm.comision" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Horas extra (RD$)</label>
        <InputText type="number" v-model="editNominaForm.hora_extra" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Ingreso SDSS (RD$)</label>
        <InputText type="number" v-model="editNominaForm.ingreso_sdss" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Seguro de salud (RD$)</label>
        <InputText type="number" v-model="editNominaForm.sf_salud" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Seguro vejez/discap. (RD$)</label>
        <InputText type="number" v-model="editNominaForm.svejez_discap" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Desc. per c&aacute;pita (RD$)</label>
        <InputText type="number" v-model="editNominaForm.desc_percapita" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Base ISR (RD$)</label>
        <InputText type="number" v-model="editNominaForm.base_isr" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Imp. sobre renta (RD$)</label>
        <InputText type="number" v-model="editNominaForm.imp_sobre_renta" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Pr&eacute;stamos (RD$)</label>
        <InputText type="number" v-model="editNominaForm.prestamos" fluid />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Descripci&oacute;n</label>
        <InputText v-model="editNominaForm.descripcion" placeholder="Ej: Bono, descuento" fluid />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" outlined @click="editNominaDialogVisible = false" />
        <Button label="Guardar cambios" icon="pi pi-check" @click="confirmarEditNomina" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="pagarDialogVisible" modal :closable="true" :style="{ width: '540px' }" :breakpoints="{ '640px': '95vw' }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <i class="pi pi-dollar text-green-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Pagar N&oacute;mina</h2>
          <p class="text-sm text-gray-500">Registra el pago con asiento contable d&eacute;bito/cr&eacute;dito</p>
        </div>
      </div>
    </template>

    <div class="space-y-4 p-2">
      <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
        <p><strong>Nómina No.:</strong> {{ datoscampos.no_nomina }}</p>
        <p><strong>Empleado:</strong> {{ datoscampos.nombre }}</p>
        <p><strong>Neto a pagar:</strong> RD$ {{ totalNetoNomina.toFixed(2) }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Cuenta de Gasto (Débito) *</label>
        <small class="text-gray-500 block mb-1">Cuenta donde se registrará el gasto por sueldos</small>
        <Select v-model="cuentaGastoSeleccionada" :options="cuentasList" optionLabel="nombre" placeholder="Seleccione cuenta de gasto..." filter fluid>
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <span>{{ slotProps.option.nombre }}</span>
              <Tag :value="slotProps.option.categoria" severity="info" />
            </div>
          </template>
        </Select>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-sm font-medium text-gray-700">Cuentas de Pago (Crédito) *</label>
          <div class="flex gap-1">
            <Button icon="pi pi-equals" severity="secondary" text rounded @click="distribuirMonto" v-tooltip.top="'Distribuir monto equitativamente'" />
            <Button icon="pi pi-plus" severity="info" text rounded @click="agregarLineaCredito" v-tooltip.top="'Agregar otra cuenta de crédito'" />
          </div>
        </div>
        <small class="text-gray-500 block mb-1">Banco(s) o caja(s) de donde saldrá el dinero</small>

        <div v-for="(linea, index) in cuentasCredito" :key="index" class="flex items-center gap-2 mb-2">
          <Select v-model="linea.cuenta" :options="cuentasList" optionLabel="nombre" placeholder="Seleccione cuenta..." filter class="flex-1">
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <span>{{ slotProps.option.nombre }}</span>
                <Tag :value="slotProps.option.categoria" severity="info" />
              </div>
            </template>
          </Select>
          <InputNumber v-model="linea.monto" mode="currency" currency="DOP" locale="es-DO" placeholder="Monto" class="w-36" :min="0" :max="totalNetoNomina" />
          <Button v-if="cuentasCredito.length > 1" icon="pi pi-trash" severity="danger" text rounded @click="eliminarLineaCredito(index)" />
        </div>

        <div class="flex items-center justify-between text-sm px-1">
          <span class="text-gray-500">Total asignado:</span>
          <span class="font-bold" :class="creditoValido ? 'text-green-600' : 'text-red-600'">RD$ {{ totalCredito.toFixed(2) }} / RD$ {{ totalNetoNomina.toFixed(2) }}</span>
        </div>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p class="font-semibold mb-1"><i class="pi pi-info-circle mr-1"></i>Asiento contable:</p>
        <p v-if="cuentaGastoSeleccionada && creditosValidos.length > 0">
          Débito: <strong>{{ cuentaGastoSeleccionada.nombre }}</strong> (sueldo bruto)<br/>
          <template v-for="(l, i) in creditosValidos" :key="i">
            Crédito: <strong>{{ l.cuenta.nombre }}</strong> por RD$ {{ parseFloat(l.monto).toFixed(2) }}<br/>
          </template>
          <span class="text-blue-600">+ Retenciones (AFP, SFS, ISR) como pasivo</span>
        </p>
        <p v-else class="text-blue-400">Seleccione las cuentas para ver el detalle</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
        <SelectButton v-model="metodoPago" :options="['EFECTIVO', 'TRANSFERENCIA', 'TARJETA']" fluid />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" outlined @click="pagarDialogVisible = false" />
        <Button label="Confirmar Pago y Contabilizar" icon="pi pi-check" severity="success" @click="confirmarPagarNomina" :disabled="!cuentaGastoSeleccionada || !creditoValido" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="deleteConfirmDialogVisible" modal :closable="true" :style="{ width: '420px' }" :breakpoints="{ '640px': '95vw' }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <i class="pi pi-exclamation-triangle text-red-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Eliminar registro</h2>
          <p class="text-sm text-gray-500">Esta acci&oacute;n no se puede deshacer</p>
        </div>
      </div>
    </template>

    <div class="p-4 text-center">
      <p class="text-gray-700 text-lg">¿Est&aacute;s seguro de eliminar este registro?</p>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" outlined @click="deleteConfirmDialogVisible = false" />
        <Button label="Sí, eliminar" icon="pi pi-trash" severity="danger" @click="confirmarEliminarNomina" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="asientoDialogVisible" modal :closable="true" :style="{ width: '600px' }" :breakpoints="{ '640px': '95vw' }">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <i class="pi pi-book text-blue-600 text-2xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Asiento Contable</h2>
          <p class="text-sm text-gray-500" v-if="asientoDetalle">No. {{ asientoDetalle.numero }} | {{ asientoDetalle.fecha }}</p>
        </div>
      </div>
    </template>

    <div class="p-2" v-if="asientoDetalle">
      <DataTable :value="asientoDetalle.lineas" class="nomina-table" :rows="10">
        <Column field="cuenta" header="Cuenta Contable">
          <template #body="slotProps">
            <span :class="slotProps.data.debe > 0 ? 'text-red-700 font-semibold' : 'text-green-700 font-semibold'">
              <i :class="slotProps.data.debe > 0 ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-left'" class="mr-1"></i>
              {{ slotProps.data.debe > 0 ? 'DÉBITO' : 'CRÉDITO' }}
            </span>
            <span class="ml-2">{{ slotProps.data.cuenta }}</span>
          </template>
        </Column>
        <Column field="debe" header="Débito">
          <template #body="slotProps">RD$ {{ slotProps.data.debe.toFixed(2) }}</template>
        </Column>
        <Column field="haber" header="Crédito">
          <template #body="slotProps">RD$ {{ slotProps.data.haber.toFixed(2) }}</template>
        </Column>
      </DataTable>
      <div class="flex items-center justify-end gap-4 mt-3 text-sm">
        <span class="text-gray-500">Total Débito: <strong class="text-red-700">RD$ {{ asientoDetalle.lineas.reduce((s, l) => s + (l.debe || 0), 0).toFixed(2) }}</strong></span>
        <span class="text-gray-500">Total Crédito: <strong class="text-green-700">RD$ {{ asientoDetalle.lineas.reduce((s, l) => s + (l.haber || 0), 0).toFixed(2) }}</strong></span>
      </div>
    </div>
    <div v-else class="p-4 text-center text-gray-500">Cargando detalle del asiento...</div>

    <template #footer>
      <Button label="Cerrar" severity="secondary" outlined @click="asientoDialogVisible = false" />
    </template>
  </Dialog>
</template>

<style scoped>
.nomina-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #ffffff 100%);
  color: #0f172a;
}

.nomina-hero {
  background: linear-gradient(135deg, #0f172a, #1e293b 45%, #0ea5e9);
  color: #e2e8f0;
  border-radius: 18px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.nomina-hero__text h1 {
  margin: 4px 0 8px;
  font-size: 1.8rem;
  font-weight: 800;
}

.nomina-hero__text p {
  margin: 0;
  color: #cbd5e1;
}

.nomina-hero__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(226, 232, 240, 0.12);
  color: #e2e8f0;
  padding: 8px 12px;
  border-radius: 9999px;
  font-size: 0.9rem;
  border: 1px solid rgba(226, 232, 240, 0.2);
}

.nomina-hero__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  align-items: center;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  padding: 14px;
  color: #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.stat-card.alt {
  background: rgba(14, 165, 233, 0.16);
}

.stat-card .label {
  display: block;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.stat-card .value {
  font-size: 1.6rem;
  font-weight: 800;
}

.panel {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
}

.panel__header h2 {
  margin: 2px 0 4px;
  font-size: 1.4rem;
  color: #0f172a;
}

.helper-text {
  color: #64748b;
  font-size: 0.95rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #0ea5e9;
  margin: 0;
  font-size: 0.85rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 900px;
}

:deep(.actions-grid .p-button) {
  width: 100%;
}

.panel__body {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.nomina-table {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

:deep(.nomina-table .p-datatable-thead > tr > th) {
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 700;
  border: 0;
  padding: 12px;
}

:deep(.nomina-table .p-datatable-tbody > tr > td) {
  padding: 10px 12px;
  border: 0;
  color: #1f2937;
}

:deep(.nomina-table .p-datatable-tbody > tr:hover) {
  background: #ecfeff;
}

@media (max-width: 768px) {
  .nomina-hero {
    padding: 18px;
  }

  .panel {
    padding: 16px;
  }

  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}
</style>
