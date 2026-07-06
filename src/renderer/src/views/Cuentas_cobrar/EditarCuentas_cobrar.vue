<script setup>
import { ref, onMounted, computed, watch, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
import { peticionesFetchOffline, nfecha, envioElectron, encryptarPassword, enviarDatosLocalStorage, crearTransferencia } from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
const toast = useToast();
import * as XLSX from 'xlsx';
/************************************************************************/
import SelectButton from 'primevue/selectbutton';
/************************************************************************/
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
/************************************************************************/
import FacturaPDFprint from '@/components/facturaPDFprint.vue';
import Ticketpdfprint from '@/components/ticketpdfprint.vue';
import CuentasCobrarPDFprint from '@/components/CuentasCobrarPDFprint.vue';
import CuentasCobrarTicketprint from '@/components/CuentasCobrarTicketprint.vue';
/************************************************************************/
import { useDatosEmpresa } from '@/stores';
const datosEmpresa = useDatosEmpresa();
const link = ref('');
const api = ref('');
const token = ref('');
const tokenCorto = ref('');
const tokenCifrado = ref('');
const usuarioLocal = ref({});
/************************************************************************/
const todasLasCuentas = ref([]);
const datoscampos = ref({});
const pagosArray = ref([]);
const productosArray = ref([]);
const facturaTotal = ref(0);
/************************************************************************/
const visibleAbono = ref(false);
const visibleEditarAbono = ref(false);
const guardandoAbono = ref(false);
const guardandoEdicionAbono = ref(false);
const abonoEditando = ref({});
const abonoEditandoIndex = ref(-1);
const visiblePrintFactura = ref(false);
const visiblePrintCxc = ref(false);
const visibleEditarTodo = ref(false);
const datosEditarTodo = ref({});
const nuevoAbono = ref({
  cantidad: 0,
  metodo: 'EFECTIVO',
  fecha: new Date(),
  banco: null
});
/************************************************************************/
const bancoArray = ref([]);
const cuentaBancaria = ref(null);
/************************************************************************/
const facturaPdfPrintRef = ref(null);
const ticketPdfPrintRef = ref(null);
const cxcPdfPrintRef = ref(null);
const cxcTicketPrintRef = ref(null);
/************************************************************************/
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
/************************************************************************/
const fetchAllData = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'cuentas_cobrar');
  todasLasCuentas.value = response;
  const cuentaEncontrada = response.find(datos => datos.id == route.params.id);
  if (cuentaEncontrada) {
    datoscampos.value = { ...cuentaEncontrada };
    pagosArray.value = JSON.parse(datoscampos.value.pagos || '[]');

    // Cargar productos de la factura
    const facturas = await peticionesFetchOffline('getDataAsArray', 'facturas');
    const datosFact = facturas.find(fact => fact.no_factura == datoscampos.value.no_factura);
    if (datosFact) {
      productosArray.value = JSON.parse(datosFact.productos || '[]');
      facturaTotal.value = parseFloat(datosFact.total || 0);
    } else {
      facturaTotal.value = 0;
    }
  }
};
/************************************************************************/
const navigate = (action) => {
  const currentIndex = todasLasCuentas.value.findIndex(cuenta => cuenta.id == route.params.id);
  if (currentIndex === -1) return;

  let newIndex;
  switch (action) {
    case 'primero': newIndex = 0; break;
    case 'anterior': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
    case 'siguiente': newIndex = currentIndex + 1 < todasLasCuentas.value.length ? currentIndex + 1 : currentIndex; break;
    case 'ultimo': newIndex = todasLasCuentas.value.length - 1; break;
    default: return;
  }

  router.push({ path: `/editarcuentas_cobrar/${todasLasCuentas.value[newIndex].id}` });
};
/************************************************************************/
const indiceActual = computed(() => {
  return todasLasCuentas.value.findIndex(c => c.id == route.params.id);
});

const puedeIrAnterior = computed(() => indiceActual.value > 0);
const puedeIrSiguiente = computed(() => indiceActual.value < todasLasCuentas.value.length - 1);
/************************************************************************/
const actualizar = async () => {
  datoscampos.value.updated_at = nfecha('timestamp');
  const resultado = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(datoscampos.value));

  if (resultado[0] === 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos Actualizados', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al actualizar', life: 3000 });
  }
};
/************************************************************************/
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
};
/************************************************************************/
const requiereBanco = (metodo) => ['TRANSFERENCIA', 'TARJETA'].includes(String(metodo || '').toUpperCase());
/************************************************************************/
const registrarMovimientoBanco = async (abono) => {
  if (!requiereBanco(abono?.metodo)) {
    return true;
  }

  const bancoSeleccionado = abono?.banco || cuentaBancaria.value;
  if (!bancoSeleccionado?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return false;
  }

  await crearTransferencia(
    link.value,
    api.value,
    tokenCifrado.value,
    toast,
    datoscampos.value.no_factura,
    round2(abono.cantidad).toFixed(2),
    bancoSeleccionado,
    datoscampos.value.nombre_cliente,
    datosEmpresa.empresa.nombre
  );

  await fetchBanco();
  return true;
};
/************************************************************************/
const abrirDialogoAbono = () => {
  nuevoAbono.value = {
    cantidad: round2(datoscampos.value.saldo),
    metodo: 'EFECTIVO',
    fecha: new Date(),
    banco: cuentaBancaria.value
  };
  visibleAbono.value = true;
};
/************************************************************************/
const registrarAbono = async () => {
  if (guardandoAbono.value) {
    return;
  }

  guardandoAbono.value = true;

  try {
  const cantidadAbono = round2(nuevoAbono.value.cantidad);
  const saldoActual = round2(datoscampos.value.saldo);

  if (cantidadAbono <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El monto debe ser mayor a 0', life: 3000 });
    return;
  }

  if (cantidadAbono > saldoActual) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El monto no puede ser mayor al saldo', life: 3000 });
    return;
  }

  if (requiereBanco(nuevoAbono.value.metodo) && !nuevoAbono.value.banco?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }

  const numeroPago = pagosArray.value.length + 1;
  const npago = {
    "nopago": numeroPago,
    "cantidad": cantidadAbono.toFixed(2),
    "metodo": nuevoAbono.value.metodo,
    "fecha": nuevoAbono.value.fecha instanceof Date
      ? nuevoAbono.value.fecha.toISOString().split('T')[0]
      : nuevoAbono.value.fecha,
    "hora": nfecha('hora'),
    "timestamp": nfecha('timestamp'),
    "turno": '',
    "cajero": usuarioLocal.value.usuario || 'SISTEMA',
    "banco": nuevoAbono.value.banco?.nombre || '',
    "saldo": 0
  };

  pagosArray.value.push(npago);

  // Recalcular todo desde cero
  const montoCredito = round2(datoscampos.value.monto_credito);
  const sumaAbono = pagosArray.value.reduce((acc, p) => round2(acc + round2(p.cantidad)), 0);
  const nuevoSaldo = round2(montoCredito - sumaAbono);

  recalcularSaldos();

  const estado = nuevoSaldo <= 0 ? 'SALDADO' : 'PENDIENTE';

  datoscampos.value.pagos = JSON.stringify(pagosArray.value);
  datoscampos.value.estatus = estado;
  datoscampos.value.abonado = sumaAbono.toFixed(2);
  datoscampos.value.saldo = nuevoSaldo.toFixed(2);
  datoscampos.value.updated_at = nfecha('timestamp');

  const peticion = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(datoscampos.value));

  if (peticion[0] === 'ok') {
    const movimientoBancoOk = await registrarMovimientoBanco(nuevoAbono.value);
    if (!movimientoBancoOk) {
      return;
    }

    toast.add({ severity: 'success', summary: 'Abono Registrado', detail: `$${nuevoAbono.value.cantidad} abonado correctamente`, life: 4000 });

    // Imprimir recibo
    if (window.electron) {
      const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage());
      const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', datoscampos.value.no_factura);
      await window.electron.ipcRenderer.invoke('facturaCredito', JSON.stringify(datoscampos.value), JSON.stringify(datosFactura), datosEmpresaA);
    }

    visibleAbono.value = false;
    await fetchAllData();

    if (estado === 'SALDADO') {
      Swal.fire({
        title: '¡Cuenta Saldada!',
        text: 'La cuenta ha sido pagada completamente',
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
    }
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al registrar abono', life: 3000 });
  }
  } finally {
    guardandoAbono.value = false;
  }
};
/************************************************************************/
const saldar = async () => {
  nuevoAbono.value = {
    cantidad: round2(datoscampos.value.saldo),
    metodo: 'EFECTIVO',
    fecha: new Date(),
    banco: cuentaBancaria.value
  };

  visibleAbono.value = true;
};
/************************************************************************/
const eliminarPago = async (index) => {
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
        const pagoEliminado = pagosArray.value[index];
        pagosArray.value.splice(index, 1);

        // Renumerar los pagos después de eliminar
        pagosArray.value.forEach((pago, i) => {
          pago.nopago = i + 1;
        });

        // Recalcular todo desde cero
        const montoCredito = round2(datoscampos.value.monto_credito);
        const sumaAbono = pagosArray.value.reduce((acc, p) => round2(acc + round2(p.cantidad)), 0);
        const nuevoSaldo = round2(montoCredito - sumaAbono);

        recalcularSaldos();

        const estado = nuevoSaldo > 0 ? 'PENDIENTE' : 'SALDADO';

        datoscampos.value.pagos = JSON.stringify(pagosArray.value);
        datoscampos.value.estatus = estado;
        datoscampos.value.abonado = sumaAbono.toFixed(2);
        datoscampos.value.saldo = nuevoSaldo.toFixed(2);
        datoscampos.value.updated_at = nfecha('timestamp');

        const peticion = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(datoscampos.value));

        if (peticion[0] === 'ok') {
          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pago eliminado', life: 3000 });
          await fetchAllData();
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar pago', life: 3000 });
        }
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  });
};
/************************************************************************/
const recalcularSaldos = () => {
  let saldoAcumulado = round2(datoscampos.value.monto_credito);
  pagosArray.value.forEach((pago, i) => {
    saldoAcumulado = round2(saldoAcumulado - round2(pago.cantidad));
    pagosArray.value[i].saldo = saldoAcumulado.toFixed(2);
  });
};
/************************************************************************/
const abrirEditarAbono = (abono, index) => {
  abonoEditando.value = {
    ...abono,
    banco: bancoArray.value.find(banco => banco.nombre === abono.banco) || cuentaBancaria.value
  };
  abonoEditandoIndex.value = index;
  visibleEditarAbono.value = true;
};
/************************************************************************/
const guardarEdicionAbono = async () => {
  if (guardandoEdicionAbono.value) {
    return;
  }

  guardandoEdicionAbono.value = true;

  try {
  const cantidadEditada = round2(abonoEditando.value.cantidad);

  if (cantidadEditada <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El monto debe ser mayor a 0', life: 3000 });
    return;
  }

  if (requiereBanco(abonoEditando.value.metodo) && !abonoEditando.value.banco?.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un banco', life: 3000 });
    return;
  }

  // Actualizar el abono editado
  pagosArray.value[abonoEditandoIndex.value] = {
    ...pagosArray.value[abonoEditandoIndex.value],
    cantidad: cantidadEditada.toFixed(2),
    metodo: abonoEditando.value.metodo,
    banco: abonoEditando.value.banco?.nombre || '',
    fecha: abonoEditando.value.fecha instanceof Date
      ? abonoEditando.value.fecha.toISOString().split('T')[0]
      : abonoEditando.value.fecha,
  };

  // Recalcular todo desde cero
  const montoCredito = round2(datoscampos.value.monto_credito);
  const sumaAbono = pagosArray.value.reduce((acc, p) => round2(acc + round2(p.cantidad)), 0);
  const nuevoSaldo = round2(montoCredito - sumaAbono);

  recalcularSaldos();

  const estado = nuevoSaldo <= 0 ? 'SALDADO' : 'PENDIENTE';

  datoscampos.value.pagos = JSON.stringify(pagosArray.value);
  datoscampos.value.abonado = sumaAbono.toFixed(2);
  datoscampos.value.saldo = nuevoSaldo.toFixed(2);
  datoscampos.value.estatus = estado;
  datoscampos.value.updated_at = nfecha('timestamp');

  const peticion = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(datoscampos.value));

  if (peticion[0] === 'ok') {
    await registrarMovimientoBanco(abonoEditando.value);
    toast.add({ severity: 'success', summary: 'Exito', detail: 'Abono actualizado', life: 3000 });
    visibleEditarAbono.value = false;
    await fetchAllData();
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar abono', life: 3000 });
  }
  } finally {
    guardandoEdicionAbono.value = false;
  }
};
/************************************************************************/
const abrirEditarTodo = () => {
  datosEditarTodo.value = { ...datoscampos.value };
  visibleEditarTodo.value = true;
};
/************************************************************************/
const guardarEditarTodo = async () => {
  // RECALCULAR TODO desde cero con los valores modificados
  // 1. Si se cambió el array de pagos, recalcular
  if (datosEditarTodo.value.pagos) {
    try {
      const pagosTemp = typeof datosEditarTodo.value.pagos === 'string'
        ? JSON.parse(datosEditarTodo.value.pagos)
        : datosEditarTodo.value.pagos;

      // Sumar todos los abonos
      const sumaAbono = pagosTemp.reduce((acc, p) => round2(acc + round2(p.cantidad)), 0);

      // Calcular el nuevo saldo total
      const montoCredito = round2(datosEditarTodo.value.monto_credito);
      const nuevoSaldo = round2(montoCredito - sumaAbono);

      // Actualizar valores calculados
      datosEditarTodo.value.abonado = sumaAbono.toFixed(2);
      datosEditarTodo.value.saldo = nuevoSaldo.toFixed(2);
      datosEditarTodo.value.estatus = nuevoSaldo <= 0 ? 'SALDADO' : 'PENDIENTE';
    } catch (error) {
      console.error('Error al procesar pagos:', error);
    }
  }

  datosEditarTodo.value.updated_at = nfecha('timestamp');

  const peticion = await peticionesFetchOffline('updateData', 'cuentas_cobrar', JSON.stringify(datosEditarTodo.value));

  if (peticion[0] === 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta actualizada correctamente', life: 3000 });
    visibleEditarTodo.value = false;
    await fetchAllData();
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar la cuenta', life: 3000 });
  }
};
/************************************************************************/
const imprimirCuenta = async (tipo) => {
  try {
    const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datoscampos.value.cod_cliente);
    const datosEmpresaLocal = enviarDatosLocalStorage();
    const facturas = [datoscampos.value];

    if (tipo === 'CARTA') {
      if (cxcPdfPrintRef.value?.printCuentas) {
        await cxcPdfPrintRef.value.printCuentas({
          facturas,
          cliente: datosCliente,
          datosEmpresa: datosEmpresaLocal
        });
      } else {
        toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente carta CxC no disponible', life: 3000 });
      }
      return;
    }

    if (cxcTicketPrintRef.value?.printCuentasTicket) {
      await cxcTicketPrintRef.value.printCuentasTicket({
        facturas,
        cliente: datosCliente,
        datosEmpresa: datosEmpresaLocal
      });
    } else {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente ticket CxC no disponible', life: 3000 });
    }
  } catch (error) {
    console.error('Error al imprimir cuenta:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar la impresión', life: 3000 });
  }
};
/************************************************************************/const imprimirFacturaOriginal = async () => {
  if (!window.electron) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Función disponible solo en Electron', life: 3000 });
    return;
  }

  const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', datoscampos.value.no_factura);
  const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datosFactura.cod_cliente);
  const datosEmpresa1 = JSON.stringify(enviarDatosLocalStorage());

  await window.electron.ipcRenderer.invoke('facturaPDF', JSON.stringify(datosFactura), JSON.stringify(datosCliente), datosEmpresa1, null);
};
/************************************************************************/
const exportarExcel = () => {
  const cuentaData = [
    ["Cuenta por Cobrar - Detalle"],
    [],
    ["Cliente", datoscampos.value.nombre_cliente],
    ["Cédula", datoscampos.value.cedula_cliente],
    ["Teléfono", datoscampos.value.telefono_cliente],
    ["No. Factura", datoscampos.value.no_factura],
    ["Fecha Emisión", datoscampos.value.fecha_emision],
    ["Fecha Vencimiento", datoscampos.value.fecha_vencimiento],
    ["Monto Total", `$${parseFloat(datoscampos.value.monto_credito).toFixed(2)}`],
    ["Abonado", `$${parseFloat(datoscampos.value.abonado || 0).toFixed(2)}`],
    ["Saldo", `$${parseFloat(datoscampos.value.saldo).toFixed(2)}`],
    ["Estado", datoscampos.value.estatus],
    [],
    ["Historial de Abonos"],
    ["#", "Monto", "Método", "Fecha", "Hora", "Cajero", "Saldo Restante"],
    ...pagosArray.value.map((pago, index) => [
      index + 1,
      `$${parseFloat(pago.cantidad).toFixed(2)}`,
      pago.metodo,
      pago.fecha,
      pago.hora,
      pago.cajero,
      `$${parseFloat(pago.saldo).toFixed(2)}`
    ]),
    [],
    ["Productos"],
    ["Código", "Nombre", "Cantidad", "Precio", "Subtotal"],
    ...productosArray.value.map(producto => [
      producto.codigo,
      producto.nombre,
      producto.cantidad,
      `$${parseFloat(producto.precio).toFixed(2)}`,
      `$${(parseFloat(producto.cantidad) * parseFloat(producto.precio)).toFixed(2)}`
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(cuentaData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cuenta por Cobrar");
  XLSX.writeFile(workbook, `Cuenta_Cobrar_${datoscampos.value.no_factura}_${datoscampos.value.id}.xlsx`);
};
/************************************************************************/
const eliminarCuenta = async () => {
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
        const resultado = await peticionesFetchOffline('deleteEntry', 'cuentas_cobrar', datoscampos.value.id);

        if (resultado[0] == 'ok') {
          toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta eliminada', life: 3000 });

          const currentIndex = todasLasCuentas.value.findIndex(cuenta => cuenta.id == route.params.id);
          todasLasCuentas.value.splice(currentIndex, 1);

          if (todasLasCuentas.value.length === 0) {
            router.push({ path: '/cuentas_cobrar' });
          } else {
            let newIndex = currentIndex;
            if (currentIndex >= todasLasCuentas.value.length) {
              newIndex = todasLasCuentas.value.length - 1;
            }
            router.push({ path: `/editarcuentas_cobrar/${todasLasCuentas.value[newIndex].id}` });
          }
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar', life: 3000 });
        }
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  });
};
/************************************************************************/
const hayErrorFacturaTotal = computed(() => {
  const totalFact = facturaTotal.value;
  const montoCredito = parseFloat(datoscampos.value.monto_credito || 0);
  return totalFact > 0 && Math.abs(totalFact - montoCredito) > 0.01;
});
/************************************************************************/
const btnAbono1 = computed(() => (parseFloat(datoscampos.value.saldo) / 4).toFixed(2));
const btnAbono2 = computed(() => (parseFloat(datoscampos.value.saldo) / 2).toFixed(2));
const btnAbono3 = computed(() => parseFloat(datoscampos.value.saldo).toFixed(2));
/************************************************************************/
const calcularImpuesto = (producto) => {
  const base = parseFloat(producto.cantidad || 0) * parseFloat(producto.precio || 0);
  const tasa = parseFloat(producto.impuestos || 0);
  return (base * tasa / 100).toFixed(2);
};

const calcularTotal = (producto) => {
  const base = parseFloat(producto.cantidad || 0) * parseFloat(producto.precio || 0);
  const impuesto = parseFloat(calcularImpuesto(producto));
  return (base + impuesto).toFixed(2);
};
/************************************************************************/
const arreglarMontoCredito = async () => {
  const nuevoMonto = facturaTotal.value;
  const montoActual = parseFloat(datoscampos.value.monto_credito || 0);
  const diferencia = nuevoMonto - montoActual;

  // Verificar si el primer pago cubre la diferencia
  const primerPago = pagosArray.value[0];
  const montoPrimerPago = parseFloat(primerPago?.cantidad || 0);

  if (diferencia > 0 && Math.abs(montoPrimerPago - diferencia) > 0.01) {
    const { value: confirmar } = await Swal.fire({
      title: 'Agregar pago inicial',
      html: `
        <p style="margin-bottom:12px;color:#475569;">
          La diferencia entre factura (RD$ <strong>${nuevoMonto.toFixed(2)}</strong>)
          y cr&eacute;dito (RD$ <strong>${montoActual.toFixed(2)}</strong>)
          es de <strong>RD$ ${diferencia.toFixed(2)}</strong>.
        </p>
        <p style="color:#475569;">¿Deseas agregar este monto como primer pago?</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981'
    });
    if (!confirmar) return;

    const nuevoPago = {
      nopago: 0,
      cantidad: diferencia.toFixed(2),
      metodo: 'EFECTIVO',
      fecha: nfecha('fecha'),
      hora: nfecha('hora'),
      timestamp: nfecha('timestamp'),
      turno: '',
      cajero: usuarioLocal.value.usuario || 'SISTEMA',
      banco: '',
      saldo: ''
    };

    pagosArray.value.unshift(nuevoPago);
  }

  let resto = nuevoMonto;
  const pagosCorregidos = pagosArray.value.map((pago, idx) => {
    const montoPago = parseFloat(p.cantidad || 0);
    resto -= montoPago;
    return { ...pago, nopago: idx + 1, saldo: Math.max(resto, 0).toFixed(2) };
  });

  const sumaAbono = pagosCorregidos.reduce((s, p) => s + parseFloat(p.cantidad || 0), 0);
  const nuevoSaldo = Math.max(nuevoMonto - sumaAbono, 0);

  datoscampos.value.monto_credito = nuevoMonto.toFixed(2);
  datoscampos.value.abonado = sumaAbono.toFixed(2);
  datoscampos.value.saldo = nuevoSaldo.toFixed(2);
  datoscampos.value.pagos = JSON.stringify(pagosCorregidos);
  pagosArray.value = pagosCorregidos;

  await actualizar();

  toast.add({
    severity: 'success',
    summary: 'Corregido',
    detail: `Monto cr\u00e9dito actualizado a RD$ ${nuevoMonto.toFixed(2)} y saldos de pagos recalculados.`,
    life: 5000
  });
};
/************************************************************************/
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value = datosJSON.VITE_LINKURL;
  api.value = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
  tokenCifrado.value = await encryptarPassword(datosJSON.VITE_TOKEN, 10);
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};

  await fetchBanco();
  await fetchAllData();
});
/************************************************************************/
watch(() => route.params.id, async () => {
  if (route.params.id) {
    await fetchAllData();
  }
});
/************************************************************************/
watch(() => nuevoAbono.value.metodo, (metodo) => {
  if (requiereBanco(metodo) && !nuevoAbono.value.banco) {
    nuevoAbono.value.banco = cuentaBancaria.value;
  }
});
/************************************************************************/
watch(() => abonoEditando.value.metodo, (metodo) => {
  if (requiereBanco(metodo) && !abonoEditando.value.banco) {
    abonoEditando.value.banco = cuentaBancaria.value;
  }
});
/************************************************************************/
// Función para evitar errores al parsear JSON
const parseSeguro = (str, fallback = []) => {
  try {
    if (!str) return fallback;
    if (typeof str !== "string") return str;
    return JSON.parse(str);
  } catch (e) {
    console.warn("⚠ JSON corrupto detectado");
    return fallback;
  }
};

const fnResumenPagosPDF = () => {
  const doc = new jsPDF("p", "mm", "a4");

  // ==========================================
  //   DATOS DE LA EMPRESA (VIENEN DEL STORE)
  // ==========================================
  const empresa = datosEmpresa.empresa || {
    nombre: "NOMBRE DE LA EMPRESA",
    direccion: "Dirección no disponible",
    telefono: "Teléfono no disponible",
    email: "Correo no disponible",
    rnc: "RNC no disponible",
    logoprinter: null
  };

  // ==========================================
  //   ENCABEZADO ESTILO PROFESIONAL
  // ==========================================
    doc.setFontSize(22);
    doc.text(empresa.nombre, 105, 20, { align: "center" });

  doc.setFontSize(11);
  doc.text(empresa.direccion || "", 105, 28, { align: "center" });
  doc.text(`Tel: ${empresa.telefono || ""}`, 105, 34, { align: "center" });
  doc.text(`Email: ${empresa.email || ""}`, 105, 40, { align: "center" });
  doc.text(`RNC: ${empresa.rnc || ""}`, 105, 46, { align: "center" });

  // Separador visual
  doc.setLineWidth(0.5);
  doc.line(10, 52, 200,52);

  let yActual = 60;

  // =============================
  // DATOS DEL CLIENTE
  // =============================
  doc.setFontSize(14);
  doc.text("Resumen de Cuenta por Cobrar", 14, yActual);
  yActual += 10;

  doc.setFontSize(12);
  doc.text(`Cliente: ${datoscampos.value.nombre_cliente}`, 14, yActual); yActual += 7;
  doc.text(`Factura: ${datoscampos.value.no_factura}`, 14, yActual); yActual += 7;
  doc.text(`Total: $${parseFloat(datoscampos.value.monto_credito).toFixed(2)}`, 14, yActual); yActual += 7;
  doc.text(`Saldo: $${parseFloat(datoscampos.value.saldo).toFixed(2)}`, 14, yActual);
  yActual += 15;

  // =============================
  //  TÍTULO: PRODUCTOS
  // =============================
  doc.setFontSize(15);
  doc.text("PRODUCTOS", 14, yActual);
  yActual += 5;

  autoTable(doc, {
    startY: yActual,
    head: [["Código", "Nombre", "Cantidad", "Precio", "Subtotal"]],
    body: productosArray.value.map(prod => [
      prod.codigo,
      prod.nombre,
      prod.cantidad,
      `$${parseFloat(prod.precio).toFixed(2)}`,
      `$${(parseFloat(prod.cantidad) * parseFloat(prod.precio)).toFixed(2)}`
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 133, 244] }
  });

  yActual = doc.lastAutoTable.finalY + 15;

  // =============================
  //  TÍTULO: PAGOS REALIZADOS
  // =============================
  doc.setFontSize(15);
  doc.text("PAGOS REALIZADOS", 14, yActual);
  yActual += 5;

  const pagos = parseSeguro(datoscampos.value.pagos, []);

  autoTable(doc, {
    startY: yActual,
    head: [["#", "Monto", "Método", "Fecha", "Hora", "Cajero", "Saldo"]],
    body: pagos.map(p => [
      p.nopago,
      `$${parseFloat(p.cantidad).toFixed(2)}`,
      p.metodo,
      p.fecha,
      p.hora,
      p.cajero,
      `$${parseFloat(p.saldo).toFixed(2)}`
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 167, 69] }
  });

  // =============================
  //  PDF EMBEDIDO EN SWAL
  // =============================
  const pdfBlob = doc.output("blob");
  const pdfURL = URL.createObjectURL(pdfBlob);

  Swal.fire({
    title: "Resumen en PDF",
    width: "900px",
    html: `
      <iframe src="${pdfURL}" style="width:100%;height:600px;border:none;"></iframe>
    `,
    showCloseButton: true,
    confirmButtonText: "Cerrar"
  });
};
/************************************************************************/
const fnImprimirFactura = async () => {
  visiblePrintFactura.value = true;
}
/************************************************************************/
const fnImprimirFacturaCarta = async () => {
  try {
    const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', datoscampos.value.no_factura);
    const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datosFactura.cod_cliente);
    const datosEmpresaLocal = enviarDatosLocalStorage();

    if (facturaPdfPrintRef.value?.printFactura) {
      await facturaPdfPrintRef.value.printFactura({
        factura: datosFactura,
        cliente: datosCliente,
        datosEmpresa: datosEmpresaLocal,
        creditoData: datoscampos.value
      });
    } else {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente de carta no disponible', life: 3000 });
    }
  } catch (error) {
    console.error('Error imprimiendo factura carta:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo imprimir la factura', life: 3000 });
  } finally {
    visiblePrintFactura.value = false;
  }
}
/************************************************************************/
const fnImprimirFacturaTicket = async () => {
  try {
    const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', datoscampos.value.no_factura);
    const datosCliente = await peticionesFetchOffline('getDataByField', 'clientes', 'codigo', datosFactura.cod_cliente);
    const datosEmpresaLocal = enviarDatosLocalStorage();

    if (ticketPdfPrintRef.value?.printTicket) {
      await ticketPdfPrintRef.value.printTicket({
        factura: datosFactura,
        cliente: datosCliente,
        datosEmpresa: datosEmpresaLocal
      });
    } else {
      toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Componente de ticket no disponible', life: 3000 });
    }
  } catch (error) {
    console.error('Error imprimiendo factura ticket:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo imprimir la factura', life: 3000 });
  } finally {
    visiblePrintFactura.value = false;
  }
}
/************************************************************************//************************************************************************/
const generarPDFCuentaCobrar = async () => {
  try {
    const cuenta = datoscampos.value || {};
    const productos = productosArray.value || [];
    const pagos = pagosArray.value || [];
    const empresa = datosEmpresa.empresa || {}; // tu store Pinia

    const doc = new jsPDF("p", "mm", "a4");
    doc.setFont("helvetica");

    /* ============================
          ENCABEZADO EMPRESA
       ============================ */
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(empresa.nombre || "NOMBRE DE LA EMPRESA", 15, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (empresa.telefono) doc.text(empresa.telefono, 15, 22);
    if (empresa.direccion) doc.text(empresa.direccion, 15, 27);
    if (empresa.email) doc.text(empresa.email, 15, 32);

    // Caja derecha (info factura)
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(140, 10, 60, 30, 3, 3, "F");

    doc.text(`Fecha: ${cuenta.fecha_emision || "-"}`, 145, 17);
    doc.text(`Factura: ${cuenta.no_factura || "-"}`, 145, 23);
    doc.text(`Estado: ${cuenta.estatus || "-"}`, 145, 29);

    /* ============================
            PRODUCTOS
       ============================ */
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PRODUCTOS", 14, 50);

    autoTable(doc, {
      startY: 55,
      head: [["Código", "Descripción", "Cant.", "Precio", "Subtotal"]],
      body: productos.map(p => [
        p.codigo || "",
        p.nombre || "",
        p.cantidad || "",
        p.precio ? `$${parseFloat(p.precio).toFixed(2)}` : "$0.00",
        p.precio && p.cantidad
          ? `$${(parseFloat(p.precio) * parseFloat(p.cantidad)).toFixed(2)}`
          : "$0.00"
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [240, 240, 240], textColor: 20 },
      theme: "grid"
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    /* ============================
            PAGOS REALIZADOS
       ============================ */
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PAGOS REALIZADOS", 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [["#", "Monto", "Método", "Fecha", "Hora", "Cajero", "Saldo"]],
      body: pagos.map((p, i) => [
        i + 1,
        p.cantidad ? `$${parseFloat(p.cantidad).toFixed(2)}` : "$0.00",
        p.metodo || "",
        p.fecha || "",
        p.hora || "",
        p.cajero || "",
        p.saldo ? `$${parseFloat(p.saldo).toFixed(2)}` : "$0.00"
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [240, 240, 240], textColor: 20 },
      theme: "grid"
    });

    let finalY2 = doc.lastAutoTable.finalY + 10;

    /* ============================
              RESUMEN FINAL
       ============================ */
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN", 14, finalY2);

    doc.setFont("helvetica", "normal");
    doc.text(
      `Monto Total: $${parseFloat(cuenta.monto_credito || 0).toFixed(2)}`,
      14,
      finalY2 + 7
    );
    doc.text(
      `Abonado: $${parseFloat(cuenta.abonado || 0).toFixed(2)}`,
      14,
      finalY2 + 14
    );
    doc.text(
      `Saldo Pendiente: $${parseFloat(cuenta.saldo || 0).toFixed(2)}`,
      14,
      finalY2 + 21
    );

    /* ============================
            MOSTRAR EN SWEETALERT
       ============================ */
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    Swal.fire({
      title: "Resumen de Cuenta por Cobrar",
      width: "90%",
      html: `
        <iframe src="${pdfUrl}" style="width:100%;height:80vh;border:1px solid #ddd;border-radius:8px"></iframe>
      `,
      showCancelButton: true,
      confirmButtonText: "Descargar PDF",
      cancelButtonText: "Cerrar",
      preConfirm: () => {
        doc.save(`Cuenta_${cuenta.no_factura || "documento"}.pdf`);
      }
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    Swal.fire("Error", "No se pudo generar el PDF", "error");
  }
};


/************************************************************************/
const urlToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error convirtiendo URL a Base64:", error);
    return null;
  }
};

/************************************************************************/
const generarCartaDeSaldo = async () => {
  try {
    if (datoscampos.value.estatus !== "SALDADO") {
      Swal.fire("Aviso", "La cuenta aún no está saldada.", "warning");
      return;
    }

    const empresa = datosEmpresa.empresa || {};
    const cuenta = datoscampos.value;
    const pagos = pagosArray.value || [];

    // Convertir logo URL → Base64
    let logoBase64 = null;
    if (empresa.imagen) {
      logoBase64 = await urlToBase64(empresa.imagen);
    }

    // Firma / sello / marca de agua si las usas en Base64
    const firma = empresa.firmaBase64 || null;
    const sello = empresa.selloBase64 || null;
    const marcaAgua = empresa.marcaAguaBase64 || null;

    const doc = new jsPDF("p", "mm", "a4");
    doc.setFont("helvetica");

    /* ===========================
        MARCA DE AGUA
       =========================== */
    if (marcaAgua) {
      doc.setGState(new doc.GState({ opacity: 0.12 }));
      doc.addImage(marcaAgua, "PNG", 25, 60, 160, 160);
      doc.setGState(new doc.GState({ opacity: 1 }));
    }

    /* ===========================
        LOGO SUPERIOR (URL)
       =========================== */
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 88, 10, 35, 35);
    }

    /* ===========================
        ENCABEZADO
       =========================== */
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(empresa.nombre || "NOMBRE DE LA EMPRESA", 105, 55, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    if (empresa.direccion) doc.text(empresa.direccion, 105, 62, { align: "center" });
    if (empresa.telefono) doc.text(`Tel: ${empresa.telefono}`, 105, 68, { align: "center" });
    if (empresa.email) doc.text(`Email: ${empresa.email}`, 105, 74, { align: "center" });

    // RNC legal destacado
    doc.setFont("helvetica", "bold");
    doc.text(`RNC: ${empresa.legal || "N/D"}`, 105, 82, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(15, 87, 195, 87);

    /* ===========================
        TÍTULO PRINCIPAL
       =========================== */
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CARTA DE SALDO", 105, 105, { align: "center" });

    /* ===========================
        CUERPO
       =========================== */
    let y = 125;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text(`Santo Domingo, República Dominicana`, 15, y);
    y += 12;

    doc.text(`A quien pueda interesar:`, 15, y);
    y += 15;

    const texto1 =
      `Certificamos que el(la) señor(a) ${cuenta.nombre_cliente}, portador(a) de la cédula ` +
      `${cuenta.cedula_cliente || "N/D"}, ha saldado en su totalidad la obligación correspondiente ` +
      `a la factura No. ${cuenta.no_factura}, emitida en fecha ${cuenta.fecha_emision}.`;

    doc.text(texto1, 15, y, { maxWidth: 180, lineHeightFactor: 1.5 });
    y += 40;

    const texto2 =
      `La deuda ascendía a un monto total de $${parseFloat(cuenta.monto_credito).toFixed(2)}, ` +
      `el cual fue pagado completamente, quedando un saldo final de $0.00.`;

    doc.text(texto2, 15, y, { maxWidth: 180, lineHeightFactor: 1.5 });
    y += 30;

    /* ===========================
        TABLA de PAGOS
       =========================== */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Detalle de Pagos Realizados", 15, y);

    autoTable(doc, {
      startY: y + 5,
      head: [["#", "Monto", "Método", "Fecha", "Hora"]],
      body: pagos.map((p, i) => [
        i + 1,
        `$${parseFloat(p.cantidad).toFixed(2)}`,
        p.metodo,
        p.fecha,
        p.hora
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 144, 255] },
      theme: "grid"
    });

    let finalY = doc.lastAutoTable.finalY + 20;

    /* ===========================
        FIRMA Y SELLO
       =========================== */
    if (firma) {
      doc.addImage(firma, "PNG", 20, finalY - 5, 55, 30);
    }

    if (sello) {
      doc.addImage(sello, "PNG", 130, finalY - 35, 55, 55);
    }

    doc.setFont("helvetica", "bold");
    doc.text(empresa.nombre || "NOMBRE DE LA EMPRESA", 20, finalY + 35);

    doc.setFont("helvetica", "normal");
    doc.text(`RNC ${empresa.rnc || "N/D"}`, 20, finalY + 42);

    /* ===========================
        MOSTRAR EN SWEETALERT
       =========================== */
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    Swal.fire({
      title: "Carta de Saldo",
      width: "90%",
      html: `
        <iframe src="${pdfUrl}" style="width:100%;height:80vh;border:1px solid #ddd;border-radius:8px"></iframe>
      `,
      showCancelButton: true,
      confirmButtonText: "Descargar PDF",
      cancelButtonText: "Cerrar",
      preConfirm: () => {
        doc.save(`CartaSaldo_${cuenta.no_factura}.pdf`);
      }
    });

  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo generar la carta de saldo", "error");
  }
};


/************************************************************************/
</script>

<template>
<main class="editar-cuenta-wrapper">
  <FacturaPDFprint ref="facturaPdfPrintRef" />
  <Ticketpdfprint ref="ticketPdfPrintRef" />
  <CuentasCobrarPDFprint ref="cxcPdfPrintRef" />
  <CuentasCobrarTicketprint ref="cxcTicketPrintRef" />
  <div class="container-cuenta mx-auto px-4 py-6">

    <!-- Header Section with Navigation -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Editar Cuenta por Cobrar</h1>
          <p class="text-gray-600">Cuenta #{{ datoscampos.id }} - {{ datoscampos.nombre_cliente }}</p>
        </div>
        <Button
          icon="pi pi-arrow-left"
          label="Volver"
          severity="secondary"
          outlined
          @click="router.push('/cuentas_cobrar')"
          class="nav-btn"
        />
      </div>

      <!-- Navigation Buttons -->
      <div class="navigation-bar">
        <div class="flex gap-2">
          <Button
            icon="pi pi-angle-double-left"
            @click="navigate('primero')"
            :disabled="!puedeIrAnterior"
            severity="secondary"
            outlined
            rounded
            v-tooltip.top="'Primera cuenta'"
          />
          <Button
            icon="pi pi-angle-left"
            @click="navigate('anterior')"
            :disabled="!puedeIrAnterior"
            severity="secondary"
            outlined
            rounded
            v-tooltip.top="'Anterior'"
          />
          <Button
            icon="pi pi-angle-right"
            @click="navigate('siguiente')"
            :disabled="!puedeIrSiguiente"
            severity="secondary"
            outlined
            rounded
            v-tooltip.top="'Siguiente'"
          />
          <Button
            icon="pi pi-angle-double-right"
            @click="navigate('ultimo')"
            :disabled="!puedeIrSiguiente"
            severity="secondary"
            outlined
            rounded
            v-tooltip.top="'Última cuenta'"
          />
        </div>

        <div class="flex gap-2">
          <Button
            icon="pi pi-money-bill"
            label="Abonar"
            @click="abrirDialogoAbono"
            :disabled="datoscampos.estatus === 'SALDADO'"
            severity="success"
            class="action-btn-nav"
          />
          <Button
            icon="pi pi-check-circle"
            label="Saldar"
            @click="saldar"
            :disabled="datoscampos.estatus === 'SALDADO'"
            severity="success"
            class="action-btn-nav"
          />

          <!-- Botón solo para Soporte -->
          <Button
            v-if="usuarioLocal.usuario === 'Soporte'"
            icon="pi pi-cog"
            label="Editar Todo (Soporte)"
            @click="abrirEditarTodo"
            severity="warning"
            class="action-btn-nav"
            v-tooltip.bottom="'Modificar todos los campos directamente'"
          />

          <Button
            icon="pi pi-file-pdf"
            label="Resumen PDF"
            severity="danger"
            outlined
            class="action-btn"
            @click="generarPDFCuentaCobrar"
          />


          <Button
            icon="pi pi-print"
            label="Imprimir Factura"
            @click="fnImprimirFactura"
            severity="warning"
            outlined
            class="action-btn-nav"
          />

          <Button
            icon="pi pi-print"
            label="Imprimir"
            @click="visiblePrintCxc = true"
            severity="warning"
            outlined
            class="action-btn-nav"
          />
          
<!--           <Button
            icon="pi pi-print"
            label="Imprimir Grande"
            @click="() => imprimirCuenta('CARTA')"
            severity="warning"
            outlined
            class="action-btn-nav"
          /> -->

          <Button
            icon="pi pi-file-excel"
            label="Excel"
            @click="exportarExcel"
            severity="success"
            outlined
            class="action-btn-nav"
          />
          <Button
          icon="pi pi-file-pdf"
          label="Carta de Saldo"
          v-if="datoscampos.estatus === 'SALDADO'"
          @click="generarCartaDeSaldo"
          severity="success"
          outlined
        />

        </div>
      </div>
    </div>

    <!-- Alerta: total factura vs monto credito -->
    <div v-if="facturaTotal > 0" class="mb-6 p-4 rounded-xl flex items-start gap-3" :class="hayErrorFacturaTotal ? 'bg-red-50 border-2 border-red-400' : 'bg-green-50 border-2 border-green-400'">
      <i :class="['text-2xl mt-1', hayErrorFacturaTotal ? 'pi pi-exclamation-triangle text-red-600' : 'pi pi-check-circle text-green-600']"></i>
      <div class="flex-1">
        <p class="font-bold text-sm uppercase tracking-wide" :class="hayErrorFacturaTotal ? 'text-red-800' : 'text-green-800'">
          {{ hayErrorFacturaTotal ? 'Error: Total de factura no coincide' : 'Montos correctos' }}
        </p>
        <p class="text-sm" :class="hayErrorFacturaTotal ? 'text-red-700' : 'text-green-700'">
          Total factura: <strong>RD$ {{ facturaTotal.toFixed(2) }}</strong>
          &mdash; Monto cr&eacute;dito: <strong>RD$ {{ parseFloat(datoscampos.monto_credito || 0).toFixed(2) }}</strong>
        </p>
      </div>
      <Button label="Sincronizar" icon="pi pi-wrench" :severity="hayErrorFacturaTotal ? 'danger' : 'success'" @click="arreglarMontoCredito" class="flex-shrink-0" />
    </div>

    <!-- Info Card -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header info-header">
          <i class="pi pi-info-circle text-2xl mr-3"></i>
          <div class="flex-1">
            <h2 class="text-xl font-bold">Información del Cliente</h2>
            <p class="text-sm opacity-90">Datos generales de la cuenta</p>
          </div>
          <Tag
            :value="datoscampos.estatus"
            :severity="datoscampos.estatus === 'SALDADO' ? 'success' : 'danger'"
            class="text-lg px-4"
          />
        </div>
      </template>

      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-user mr-2"></i>Cliente
            </label>
            <div class="info-value">{{ datoscampos.nombre_cliente }}</div>
          </div>

          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-id-card mr-2"></i>Cédula
            </label>
            <div class="info-value">{{ datoscampos.cedula_cliente }}</div>
          </div>

          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-phone mr-2"></i>Teléfono
            </label>
            <div class="info-value">{{ datoscampos.telefono_cliente }}</div>
          </div>

          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-file mr-2"></i>No. Factura
            </label>
            <div class="info-value font-mono">{{ datoscampos.no_factura }}</div>
          </div>

          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-calendar mr-2"></i>Fecha Emisión
            </label>
            <div class="info-value">{{ datoscampos.fecha_emision }}</div>
          </div>

          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-calendar-times mr-2"></i>Fecha Vencimiento
            </label>
            <div class="info-value">{{ datoscampos.fecha_vencimiento }}</div>
          </div>

        </div>
      </template>
    </Card>

    <!-- Montos Card -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header montos-header">
          <i class="pi pi-dollar text-2xl mr-3"></i>
          <div>
            <h2 class="text-xl font-bold">Montos y Estado de Pago</h2>
            <p class="text-sm opacity-90">Resumen financiero</p>
          </div>
        </div>
      </template>

      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div class="monto-card total-card">
            <div class="monto-icon">
              <i class="pi pi-money-bill"></i>
            </div>
            <div>
              <div class="monto-label">Monto Total</div>
              <div class="monto-value">${{ parseFloat(datoscampos.monto_credito || 0).toFixed(2) }}</div>
            </div>
          </div>

          <div class="monto-card abonado-card">
            <div class="monto-icon">
              <i class="pi pi-wallet"></i>
            </div>
            <div>
              <div class="monto-label">Abonado</div>
              <div class="monto-value">${{ parseFloat(datoscampos.abonado || 0).toFixed(2) }}</div>
            </div>
          </div>

          <div class="monto-card saldo-card" :class="parseFloat(datoscampos.saldo) > 0 ? 'saldo-pendiente' : 'saldo-pagado'">
            <div class="monto-icon">
              <i class="pi pi-chart-line"></i>
            </div>
            <div>
              <div class="monto-label">Saldo Pendiente</div>
              <div class="monto-value">${{ parseFloat(datoscampos.saldo || 0).toFixed(2) }}</div>
            </div>
          </div>

        </div>
      </template>
    </Card>

    <!-- Historial de Abonos -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header pagos-header">
          <i class="pi pi-list text-2xl mr-3"></i>
          <div>
            <h2 class="text-xl font-bold">Historial de Abonos</h2>
            <p class="text-sm opacity-90">{{ pagosArray.length }} abono(s) registrado(s)</p>
          </div>
        </div>
      </template>

      <template #content>
        <div v-if="pagosArray.length === 0" class="empty-state">
          <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-500 text-lg">No hay abonos registrados</p>
          <Button
            label="Registrar Primer Abono"
            icon="pi pi-plus"
            @click="abrirDialogoAbono"
            severity="success"
            class="mt-4"
          />
        </div>

        <DataTable
          v-else
          :value="pagosArray"
          class="pagos-datatable"
          stripedRows
        >
          <Column field="nopago" header="#" :style="{width: '60px'}">
            <template #body="slotProps">
              <Tag :value="slotProps.data.nopago" severity="secondary" />
            </template>
          </Column>

          <Column field="cantidad" header="Monto">
            <template #body="slotProps">
              <div class="font-bold text-green-600 text-lg">
                ${{ parseFloat(slotProps.data.cantidad).toFixed(2) }}
              </div>
            </template>
          </Column>

          <Column field="metodo" header="Método">
            <template #body="slotProps">
              <Tag
                :value="slotProps.data.metodo"
                :severity="slotProps.data.metodo === 'EFECTIVO' ? 'success' : 'info'"
              />
            </template>
          </Column>

          <Column field="fecha" header="Fecha">
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-calendar text-gray-400"></i>
                {{ slotProps.data.fecha }}
              </div>
            </template>
          </Column>

          <Column field="hora" header="Hora">
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-clock text-gray-400"></i>
                {{ slotProps.data.hora }}
              </div>
            </template>
          </Column>

          <Column field="cajero" header="Cajero">
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-gray-400"></i>
                {{ slotProps.data.cajero }}
              </div>
            </template>
          </Column>

          <Column field="saldo" header="Saldo Restante">
            <template #body="slotProps">
              <div class="text-red-600 font-semibold">
                ${{ parseFloat(slotProps.data.saldo).toFixed(2) }}
              </div>
            </template>
          </Column>

          <Column header="Acciones" :style="{width: '130px'}">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  @click="abrirEditarAbono(slotProps.data, slotProps.index)"
                  severity="info"
                  size="small"
                  outlined
                  rounded
                  v-tooltip.top="'Editar abono'"
                />
                <Button
                  icon="pi pi-trash"
                  @click="eliminarPago(slotProps.index)"
                  severity="danger"
                  size="small"
                  outlined
                  rounded
                  v-tooltip.top="'Eliminar abono'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Productos Card -->
    <Card class="cuenta-section mb-6" v-if="productosArray.length > 0">
      <template #header>
        <div class="section-header productos-header">
          <i class="pi pi-shopping-cart text-2xl mr-3"></i>
          <div>
            <h2 class="text-xl font-bold">Productos de la Factura</h2>
            <p class="text-sm opacity-90">{{ productosArray.length }} producto(s)</p>
          </div>
        </div>
      </template>

      <template #content>
        <DataTable
          :value="productosArray"
          class="productos-datatable"
          stripedRows
        >
          <Column field="codigo" header="Código" :style="{minWidth: '120px'}"></Column>
          <Column field="nombre" header="Nombre" :style="{minWidth: '200px'}"></Column>
          <Column field="cantidad" header="Cantidad" :style="{minWidth: '100px'}">
            <template #body="slotProps">
              <Tag :value="slotProps.data.cantidad" severity="secondary" />
            </template>
          </Column>
          <Column field="precio" header="Precio" :style="{minWidth: '120px'}">
            <template #body="slotProps">
              <div class="text-blue-600 font-semibold">
                ${{ parseFloat(slotProps.data.precio).toFixed(2) }}
              </div>
            </template>
          </Column>
          <Column header="Impuestos" :style="{minWidth: '120px'}">
            <template #body="slotProps">
              <div class="text-orange-500 font-semibold">
                ${{ calcularImpuesto(slotProps.data) }}
              </div>
            </template>
          </Column>
          <Column header="Subtotal" :style="{minWidth: '140px'}">
            <template #body="slotProps">
              <div class="font-bold text-green-600 text-lg">
                ${{ calcularTotal(slotProps.data) }}
              </div>
            </template>
          </Column>

          <template #footer>
            <div class="flex justify-end px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div class="text-right">
                <span class="text-sm text-gray-500 font-medium">Total Factura: </span>
                <span class="text-xl font-bold text-gray-800 ml-2">RD$ {{ facturaTotal.toFixed(2) }}</span>
              </div>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <Button
        @click="eliminarCuenta"
        icon="pi pi-trash"
        label="Eliminar Cuenta"
        severity="danger"
        outlined
        class="action-btn"
      />
      <Button
        @click="fnImprimirFactura"
        icon="pi pi-print"
        label="Imprimir Factura Original"
        severity="info"
        outlined
        class="action-btn"
      />
      <Button
        @click="actualizar"
        icon="pi pi-save"
        label="Guardar Cambios"
        severity="success"
        class="action-btn"
      />
    </div>

    <!-- Dialog: Imprimir Factura -->
    <Dialog v-model:visible="visiblePrintFactura" modal header="Imprimir Factura" :style="{ width: '30rem' }">
      <div class="flex flex-wrap gap-4 justify-center p-6">
        <Button label="Carta" icon="pi pi-file" @click="fnImprimirFacturaCarta" iconPos="bottom" severity="info" class="p-4" />
        <Button label="Ticket" icon="pi pi-ticket" @click="fnImprimirFacturaTicket" iconPos="bottom" severity="success" class="p-4" />
      </div>
      <template #footer>
        <Button label="Cancelar" @click="visiblePrintFactura = false" severity="secondary" outlined />
      </template>
    </Dialog>

    <!-- Dialog: Imprimir CxC -->
    <Dialog v-model:visible="visiblePrintCxc" modal header="Tipo de Impresión" :style="{ width: '30rem' }">
      <div class="flex flex-wrap gap-4 justify-center p-6">
        <Button label="Impresora Grande" icon="pi pi-print" @click="() => { visiblePrintCxc = false; imprimirCuenta('CARTA'); }" iconPos="bottom" severity="info" class="p-4" />
        <Button label="Impresora Térmica" icon="pi pi-print" @click="() => { visiblePrintCxc = false; imprimirCuenta('80MM'); }" iconPos="bottom" severity="success" class="p-4" />
      </div>
      <template #footer>
        <Button label="Cancelar" @click="visiblePrintCxc = false" severity="secondary" outlined />
      </template>
    </Dialog>
    <!-- Dialog: Registrar Abono -->
    <Dialog
      v-model:visible="visibleAbono"
      modal
      header="Registrar Abono"
      :style="{ width: '500px' }"
    >
      <div class="grid grid-cols-1 gap-4">

        <div class="mb-3">
          <Button :label="`1/4: $${btnAbono1}`" @click="nuevoAbono.cantidad = parseFloat(btnAbono1)" severity="secondary" outlined class="mr-2" />
          <Button :label="`1/2: $${btnAbono2}`" @click="nuevoAbono.cantidad = parseFloat(btnAbono2)" severity="secondary" outlined class="mr-2" />
          <Button :label="`Todo: $${btnAbono3}`" @click="nuevoAbono.cantidad = parseFloat(btnAbono3)" severity="success" outlined />
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-money-bill mr-2"></i>Monto a Abonar
          </label>
          <InputNumber
            v-model="nuevoAbono.cantidad"
            mode="currency"
            currency="USD"
            locale="en-US"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :max="parseFloat(datoscampos.saldo)"
            placeholder="0.00"
            class="modern-input-number w-full"
          />
          <small class="field-hint">Saldo disponible: ${{ parseFloat(datoscampos.saldo).toFixed(2) }}</small>
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-credit-card mr-2"></i>Método de Pago
          </label>
          <SelectButton
          :allowEmpty="false"
            v-model="nuevoAbono.metodo"
            :options="['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE']"
            class="metodo-selector"
          />
        </div>

        <div v-if="requiereBanco(nuevoAbono.metodo)" class="form-field">
          <label class="field-label">
            <i class="pi pi-building-columns mr-2"></i>Banco
          </label>
          <select v-model="nuevoAbono.banco" class="w-full border rounded p-3">
            <option :value="null" disabled>Seleccione un banco</option>
            <option :value="banco" v-for="banco in bancoArray" :key="banco.id">{{ banco.nombre }}</option>
          </select>
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-calendar mr-2"></i>Fecha de Abono
          </label>
          <Calendar
            v-model="nuevoAbono.fecha"
            dateFormat="yy-mm-dd"
            showIcon
            class="modern-calendar w-full"
          />
        </div>

      </div>

      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="visibleAbono = false"
          severity="secondary"
          outlined
          :disabled="guardandoAbono"
        />
        <Button
          :label="guardandoAbono ? 'Registrando...' : 'Registrar Abono'"
          icon="pi pi-check"
          :loading="guardandoAbono"
          :disabled="guardandoAbono"
          @click="registrarAbono"
          severity="success"
        />
      </template>
    </Dialog>

    <!-- Dialog: Editar Abono -->
    <Dialog
      v-model:visible="visibleEditarAbono"
      modal
      header="Editar Abono"
      :style="{ width: '500px' }"
    >
      <div class="grid grid-cols-1 gap-4">

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-money-bill mr-2"></i>Monto
          </label>
          <InputNumber
            v-model="abonoEditando.cantidad"
            mode="currency"
            currency="USD"
            locale="en-US"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            placeholder="0.00"
            class="modern-input-number w-full"
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-credit-card mr-2"></i>Metodo de Pago
          </label>
          <SelectButton
            :allowEmpty="false"
            v-model="abonoEditando.metodo"
            :options="['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE']"
            class="metodo-selector"
          />
        </div>

        <div v-if="requiereBanco(abonoEditando.metodo)" class="form-field">
          <label class="field-label">
            <i class="pi pi-building-columns mr-2"></i>Banco
          </label>
          <select v-model="abonoEditando.banco" class="w-full border rounded p-3">
            <option :value="null" disabled>Seleccione un banco</option>
            <option :value="banco" v-for="banco in bancoArray" :key="banco.id">{{ banco.nombre }}</option>
          </select>
        </div>

        <div class="form-field">
          <label class="field-label">
            <i class="pi pi-calendar mr-2"></i>Fecha de Abono
          </label>
          <Calendar
            v-model="abonoEditando.fecha"
            dateFormat="yy-mm-dd"
            showIcon
            class="modern-calendar w-full"
          />
        </div>

      </div>

      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="visibleEditarAbono = false"
          severity="secondary"
          outlined
          :disabled="guardandoEdicionAbono"
        />
        <Button
          :label="guardandoEdicionAbono ? 'Guardando...' : 'Guardar'"
          icon="pi pi-check"
          :loading="guardandoEdicionAbono"
          :disabled="guardandoEdicionAbono"
          @click="guardarEdicionAbono"
          severity="success"
        />
      </template>
    </Dialog>

    <!-- Dialog: Editar Todo (Solo Soporte) -->
    <Dialog
      v-model:visible="visibleEditarTodo"
      modal
      header="?? Editar Todos los Campos (Modo Soporte)"
      :style="{ width: '900px' }"
      :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">

        <!-- Cliente -->
        <div class="form-field">
          <label class="field-label">Cliente</label>
          <InputText v-model="datosEditarTodo.nombre_cliente" class="w-full" />
        </div>

        <!-- Código Cliente -->
        <div class="form-field">
          <label class="field-label">Código Cliente</label>
          <InputText v-model="datosEditarTodo.cod_cliente" class="w-full" />
        </div>

        <!-- Número de Factura -->
        <div class="form-field">
          <label class="field-label">No. Factura</label>
          <InputText v-model="datosEditarTodo.no_factura" class="w-full" />
        </div>

        <!-- NCF -->
        <div class="form-field">
          <label class="field-label">NCF</label>
          <InputText v-model="datosEditarTodo.ncf" class="w-full" />
        </div>

        <!-- Fecha -->
        <div class="form-field">
          <label class="field-label">Fecha</label>
          <Calendar
            v-model="datosEditarTodo.fecha"
            dateFormat="yy-mm-dd"
            showIcon
            class="w-full"
          />
        </div>

        <!-- Fecha de Vencimiento -->
        <div class="form-field">
          <label class="field-label">Fecha Vencimiento</label>
          <Calendar
            v-model="datosEditarTodo.fecha_vencimiento"
            dateFormat="yy-mm-dd"
            showIcon
            class="w-full"
          />
        </div>

        <!-- Monto Crédito -->
        <div class="form-field">
          <label class="field-label">Monto Crédito</label>
          <InputNumber
            v-model="datosEditarTodo.monto_credito"
            mode="currency"
            currency="USD"
            locale="en-US"
            :minFractionDigits="2"
            class="w-full"
          />
        </div>

        <!-- Abonado -->
        <div class="form-field">
          <label class="field-label">Abonado</label>
          <InputNumber
            v-model="datosEditarTodo.abonado"
            mode="currency"
            currency="USD"
            locale="en-US"
            :minFractionDigits="2"
            class="w-full"
          />
        </div>

        <!-- Saldo -->
        <div class="form-field">
          <label class="field-label">Saldo</label>
          <InputNumber
            v-model="datosEditarTodo.saldo"
            mode="currency"
            currency="USD"
            locale="en-US"
            :minFractionDigits="2"
            class="w-full"
          />
        </div>

        <!-- Estado -->
        <div class="form-field">
          <label class="field-label">Estado</label>
          <SelectButton
            v-model="datosEditarTodo.estatus"
            :options="['PENDIENTE', 'SALDADO']"
            class="w-full"
          />
        </div>

        <!-- Teléfono -->
        <div class="form-field">
          <label class="field-label">Teléfono</label>
          <InputText v-model="datosEditarTodo.telefono" class="w-full" />
        </div>

        <!-- Dirección -->
        <div class="form-field">
          <label class="field-label">Dirección</label>
          <InputText v-model="datosEditarTodo.direccion" class="w-full" />
        </div>

        <!-- Almacén -->
        <div class="form-field">
          <label class="field-label">Almacén</label>
          <InputText v-model="datosEditarTodo.almacen" class="w-full" />
        </div>

        <!-- Usuario -->
        <div class="form-field">
          <label class="field-label">Usuario</label>
          <InputText v-model="datosEditarTodo.usuario" class="w-full" />
        </div>

        <!-- Nota -->
        <div class="form-field md:col-span-2">
          <label class="field-label">Nota</label>
          <Textarea v-model="datosEditarTodo.nota" rows="3" class="w-full" />
        </div>

        <!-- Pagos (JSON) -->
        <div class="form-field md:col-span-2">
          <label class="field-label">Pagos (JSON)</label>
          <Textarea
            v-model="datosEditarTodo.pagos"
            rows="5"
            class="w-full font-mono text-xs"
            placeholder='[{"nopago":1,"cantidad":"100.00","metodo":"EFECTIVO",...}]'
          />
          <small class="text-orange-500">Modificar con cuidado. Formato JSON válido requerido.</small>
        </div>

        <!-- Productos (JSON) -->
        <div class="form-field md:col-span-2">
          <label class="field-label">Productos (JSON)</label>
          <Textarea
            v-model="datosEditarTodo.productos"
            rows="5"
            class="w-full font-mono text-xs"
            placeholder='[{"nombre":"Producto 1","cantidad":1,"precio":100}]'
          />
          <small class="text-orange-500">Modificar con cuidado. Formato JSON válido requerido.</small>
        </div>

      </div>

      <template #footer>
        <div class="flex justify-between items-center w-full">
          <small class="text-gray-500">
            <i class="pi pi-exclamation-triangle mr-1"></i>
            Los cambios se guardarán inmediatamente
          </small>
          <div class="flex gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              @click="visibleEditarTodo = false"
              severity="secondary"
              outlined
            />
            <Button
              label="Guardar Cambios"
              icon="pi pi-save"
              @click="guardarEditarTodo"
              severity="warning"
            />
          </div>
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</main>
</template>

<style scoped>
/* ===================================
   EDITAR CUENTA X COBRAR STYLES
   =================================== */

.editar-cuenta-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.3) 0%, rgba(209, 250, 229, 0.2) 100%);
}

.container-cuenta {
  max-width: 1400px;
}

/* Navigation */
.nav-btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  transform: translateX(-4px);
}

.navigation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.action-btn-nav {
  font-weight: 600;
  padding: 0.625rem 1.25rem;
}

/* Section Cards */
.cuenta-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(229, 231, 235, 0.8);
  transition: all 0.3s ease;
  animation: slideIn 0.4s ease-out;
}

.cuenta-section:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
}

/* Section Headers */
.section-header {
  padding: 1.5rem;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  color: white;
  font-weight: 600;
}

.info-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.montos-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.pagos-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.productos-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

/* Info Fields */
.info-field {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* Monto Cards */
.monto-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid;
  transition: all 0.3s ease;
}

.monto-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.total-card {
  background: rgba(59, 130, 246, 0.05);
  border-color: #3b82f6;
}

.abonado-card {
  background: rgba(16, 185, 129, 0.05);
  border-color: #10b981;
}

.saldo-card {
  border-color: #dc2626;
}

.saldo-pendiente {
  background: rgba(220, 38, 38, 0.05);
}

.saldo-pagado {
  background: rgba(16, 185, 129, 0.05);
  border-color: #10b981;
}

.monto-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.total-card .monto-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.abonado-card .monto-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.saldo-pendiente .monto-icon {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
}

.saldo-pagado .monto-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.monto-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.monto-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1f2937;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

/* DataTable */
.pagos-datatable,
.productos-datatable {
  font-size: 0.95rem;
}

.pagos-datatable :deep(.p-datatable-tbody > tr:hover),
.productos-datatable :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(16, 185, 129, 0.05);
}

/* Form Fields */
.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
}

.field-hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.375rem;
  font-style: italic;
}

/* Modern Inputs */
.modern-input-number :deep(.p-inputnumber-input) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.modern-input-number :deep(.p-inputnumber-input:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Calendar Custom */
.modern-calendar :deep(.p-inputtext) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
}

.modern-calendar :deep(.p-inputtext:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Metodo Selector */
.metodo-selector :deep(.p-button) {
  padding: 0.625rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.action-btn {
  padding: 0.875rem 2rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* PrimeVue Card Override */
.cuenta-section :deep(.p-card-header) {
  padding: 0;
}

.cuenta-section :deep(.p-card-content) {
  padding: 1.5rem;
}

.cuenta-section :deep(.p-card-body) {
  padding: 0;
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .navigation-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .section-header {
    padding: 1rem;
  }

  .cuenta-section :deep(.p-card-content) {
    padding: 1rem;
  }

  .monto-card {
    padding: 1rem;
  }

  .monto-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .monto-value {
    font-size: 1.5rem;
  }
}
</style>
