<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
import { peticionesFetchOffline, nfecha, envioElectron, peticiones } from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import { useToast } from "primevue/usetoast";
const toast = useToast();
import * as XLSX from "xlsx";
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
/************************************************************************/
import { useDatosEmpresa } from '@/stores';
const datosEmpresa = useDatosEmpresa();
const token = ref('');
const tokenCorto = ref('');
const usuarioLocal = ref({});
/************************************************************************/
const todasLasCuentas = ref([]);
const cuenta = ref({
  proveedor: '',
  rnc_proveedor: '',
  no_factura: '',
  ncf_proveedor: '',
  fecha_compra: '',
  fecha_vencimiento: '',
  total: 0,
  abono: 0,
  saldo: 0,
  estado: 'PENDIENTE',
  recordatorio: false,
  nota: '',
  pagos: '[]'
});
/************************************************************************/
const historialPagos = ref([]);
const visiblePago = ref(false);
const loadingPago = ref(false);
const catalogoCuentas = ref([]);
const nuevoPago = ref({
  monto: 0,
  metodo: 'EFECTIVO',
  fecha: new Date(),
  nota: '',
  cuentaContable: null
});
const formasPago = ref(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA']);
/************************************************************************/
const fetchAndSetupData = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'cuentasxpagar');
  todasLasCuentas.value = response.reverse();

  const cuentaEncontrada = todasLasCuentas.value.find(c => c.id == route.params.id);
  if (cuentaEncontrada) {
    cuenta.value = { ...cuentaEncontrada };
    cuenta.value.recordatorio = Boolean(cuenta.value.recordatorio);
    cuenta.value.total = parseFloat(cuenta.value.total) || 0;
    cuenta.value.abono = parseFloat(cuenta.value.abono) || 0;
    cuenta.value.saldo = parseFloat(cuenta.value.saldo) || 0;

    try {
      historialPagos.value = JSON.parse(cuenta.value.pagos || '[]');
    } catch (error) {
      historialPagos.value = [];
    }
  }
};
/************************************************************************/
const fetchCatalogoCuentas = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'cuentas');
    catalogoCuentas.value = response || [];
  } catch (error) {
    console.error('Error al cargar catálogo de cuentas:', error);
    catalogoCuentas.value = [];
  }
};
/************************************************************************/
const navigate = (direction) => {
  const currentIndex = todasLasCuentas.value.findIndex(c => c.id == route.params.id);
  if (currentIndex === -1) return;

  let newIndex;
  switch (direction) {
    case 'first': newIndex = 0; break;
    case 'prev': newIndex = currentIndex > 0 ? currentIndex - 1 : 0; break;
    case 'next': newIndex = currentIndex < todasLasCuentas.value.length - 1 ? currentIndex + 1 : currentIndex; break;
    case 'last': newIndex = todasLasCuentas.value.length - 1; break;
    default: return;
  }

  router.push({ path: `/editarcuentasxpagar/${todasLasCuentas.value[newIndex].id}` });
};
/************************************************************************/
const indiceActual = computed(() => {
  return todasLasCuentas.value.findIndex(c => c.id == route.params.id);
});

const puedeIrAnterior = computed(() => indiceActual.value > 0);
const puedeIrSiguiente = computed(() => indiceActual.value < todasLasCuentas.value.length - 1);
/************************************************************************/
const guardarCambios = async () => {
  try {
    const datosCuenta = {
      ...cuenta.value,
      total: cuenta.value.total.toString(),
      abono: cuenta.value.abono.toString(),
      saldo: cuenta.value.saldo.toString(),
      recordatorio: cuenta.value.recordatorio ? 1 : 0,
      pagos: JSON.stringify(historialPagos.value),
      updated_at: nfecha('timestamp')
    };

    const resultado = await peticionesFetchOffline('updateData', 'cuentasxpagar', JSON.stringify(datosCuenta));

    if (resultado[0] === 'ok') {
      // Actualizar la compra relacionada
      const compraRelacionada = await peticionesFetchOffline('getDataByField', 'compras', 'no_factura', cuenta.value.no_factura);
      if (compraRelacionada) {
        compraRelacionada.abono = cuenta.value.abono.toString();
        compraRelacionada.saldo = cuenta.value.saldo.toString();
        compraRelacionada.estado = cuenta.value.estado;
        await peticionesFetchOffline('updateData', 'compras', JSON.stringify(compraRelacionada));
      }

      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta actualizada', life: 3000 });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar', life: 3000 });
    }
  } catch (error) {
    console.error('Error al guardar:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar', life: 3000 });
  }
};
/************************************************************************/
const abrirDialogoPago = () => {
  loadingPago.value = false;

  // Buscar cuenta de Caja Chica y establecerla por defecto
  const cajaChica = catalogoCuentas.value.find(c =>
    c.nombre && c.nombre.toLowerCase().includes('caja chica')
  );

  nuevoPago.value = {
    monto: parseFloat(cuenta.value.saldo),
    metodo: 'EFECTIVO',
    fecha: new Date(),
    nota: '',
    cuentaContable: cajaChica || null
  };
  visiblePago.value = true;
};
/************************************************************************/
const registrarPago = async () => {
  // Validaciones
  if (!nuevoPago.value.cuentaContable) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Debes seleccionar una cuenta contable',
      life: 3000
    });
    return;
  }

  if (parseFloat(nuevoPago.value.monto) <= 0) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El monto debe ser mayor a 0', life: 3000 });
    return;
  }

  if (parseFloat(nuevoPago.value.monto) > parseFloat(cuenta.value.saldo)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El monto no puede ser mayor al saldo', life: 3000 });
    return;
  }

  loadingPago.value = true;

  try {
    const pago = {
      id: historialPagos.value.length + 1,
      monto: parseFloat(nuevoPago.value.monto).toFixed(2),
      metodo: nuevoPago.value.metodo,
      fecha: nuevoPago.value.fecha instanceof Date
        ? nuevoPago.value.fecha.toISOString().split('T')[0]
        : nuevoPago.value.fecha,
      hora: nfecha('hora'),
      nota: nuevoPago.value.nota,
      usuario: usuarioLocal.value.usuario || 'SISTEMA',
      cuenta_contable: nuevoPago.value.cuentaContable.nombre,
      cuenta_contable_id: nuevoPago.value.cuentaContable.id
    };

    historialPagos.value.push(pago);

    const nuevoAbono = parseFloat(cuenta.value.abono) + parseFloat(nuevoPago.value.monto);
    const nuevoSaldo = parseFloat(cuenta.value.total) - nuevoAbono;

    cuenta.value.abono = parseFloat(nuevoAbono.toFixed(2));
    cuenta.value.saldo = parseFloat(nuevoSaldo.toFixed(2));

    if (nuevoSaldo <= 0) {
      cuenta.value.estado = 'PAGADO';
    } else if (nuevoAbono > 0) {
      cuenta.value.estado = 'PARCIAL';
    }

    // Actualizar cuenta contable
    const cuentaContable = nuevoPago.value.cuentaContable;
    if (cuentaContable) {
      const nuevoSaldoCuenta = parseFloat(cuentaContable.saldo || 0) - parseFloat(nuevoPago.value.monto);
      const cuentaContableActualizada = {
        ...cuentaContable,
        saldo: nuevoSaldoCuenta.toFixed(2)
      };
      await peticionesFetchOffline('updateData', 'cuentas', JSON.stringify(cuentaContableActualizada));
    }

    await guardarCambios();
    await fetchCatalogoCuentas();

    toast.add({
      severity: 'success',
      summary: 'Pago Registrado',
      detail: `$${parseFloat(nuevoPago.value.monto).toFixed(2)} abonado correctamente. Cuenta ${cuentaContable?.nombre || ''} afectada.`,
      life: 4000
    });

    if (nuevoSaldo <= 0) {
      Swal.fire({
        title: '¡Cuenta Saldada!',
        text: 'La cuenta ha sido pagada completamente',
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
    }

    visiblePago.value = false;
  } catch (error) {
    console.error('Error al procesar pago:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el pago', life: 3000 });
  } finally {
    loadingPago.value = false;
  }
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
        const pagoEliminado = historialPagos.value[index];
        historialPagos.value.splice(index, 1);

        const nuevoAbono = parseFloat(cuenta.value.abono) - parseFloat(pagoEliminado.monto);
        const nuevoSaldo = parseFloat(cuenta.value.total) - nuevoAbono;

        cuenta.value.abono = parseFloat(nuevoAbono.toFixed(2));
        cuenta.value.saldo = parseFloat(nuevoSaldo.toFixed(2));

        if (nuevoSaldo > 0) {
          cuenta.value.estado = nuevoAbono > 0 ? 'PARCIAL' : 'PENDIENTE';
        }

        await guardarCambios();
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pago eliminado', life: 3000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña incorrecta', life: 3000 });
      }
    }
  });
};
/************************************************************************/
const pagarTotal = async () => {
  if (parseFloat(cuenta.value.saldo) <= 0) {
    toast.add({ severity: 'info', summary: 'Info', detail: 'La cuenta ya está saldada', life: 3000 });
    return;
  }

  Swal.fire({
    title: 'Pagar Total',
    html: `¿Deseas pagar el saldo completo de <strong>$${parseFloat(cuenta.value.saldo).toFixed(2)}</strong>?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, Pagar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10b981'
  }).then((result) => {
    if (result.isConfirmed) {
      nuevoPago.value = {
        monto: parseFloat(cuenta.value.saldo),
        metodo: 'EFECTIVO',
        fecha: new Date(),
        nota: 'Pago total de saldo'
      };
      registrarPago();
    }
  });
};
/************************************************************************/
const exportarExcel = () => {
  const cuentaData = [
    ["Cuenta por Pagar - Detalle"],
    [],
    ["Proveedor", cuenta.value.proveedor],
    ["RNC", cuenta.value.rnc_proveedor],
    ["No. Factura", cuenta.value.no_factura],
    ["NCF", cuenta.value.ncf_proveedor],
    ["Fecha Compra", cuenta.value.fecha_compra],
    ["Fecha Vencimiento", cuenta.value.fecha_vencimiento],
    ["Estado", cuenta.value.estado],
    ["Total", `$${parseFloat(cuenta.value.total).toFixed(2)}`],
    ["Abonado", `$${parseFloat(cuenta.value.abono).toFixed(2)}`],
    ["Saldo", `$${parseFloat(cuenta.value.saldo).toFixed(2)}`],
    [],
    ["Historial de Pagos"],
    ["#", "Monto", "Método", "Fecha", "Hora", "Usuario", "Nota"],
    ...historialPagos.value.map((pago, index) => [
      index + 1,
      `$${parseFloat(pago.monto).toFixed(2)}`,
      pago.metodo,
      pago.fecha,
      pago.hora,
      pago.usuario,
      pago.nota || '-'
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(cuentaData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cuenta por Pagar");
  XLSX.writeFile(workbook, `CuentaxPagar_${cuenta.value.no_factura}_${cuenta.value.id}.xlsx`);
};
/************************************************************************/
const hayErrorMontos = computed(() => {
  const sumaPagos = historialPagos.value.reduce((s, p) => s + parseFloat(p.monto || 0), 0);
  const totalValor = parseFloat(cuenta.value.total || 0);
  return Math.abs(sumaPagos - totalValor) > 0.01;
});
/************************************************************************/
const diasHastaVencimiento = computed(() => {
  if (!cuenta.value.fecha_vencimiento) return null;

  const hoy = new Date();
  const vencimiento = new Date(cuenta.value.fecha_vencimiento);
  hoy.setHours(0, 0, 0, 0);
  vencimiento.setHours(0, 0, 0, 0);

  return Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24));
});
/************************************************************************/
const estadoVencimiento = computed(() => {
  const dias = diasHastaVencimiento.value;
  if (dias === null) return '';
  if (dias < 0) return 'danger';
  if (dias <= 3) return 'warning';
  if (dias <= 7) return 'info';
  return 'success';
});
/************************************************************************/
onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  token.value = datosJSON.VITE_TOKEN;
  tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal'))[0] || {};

  await fetchAndSetupData();
  await fetchCatalogoCuentas();
});
/************************************************************************/
watch(() => route.params.id, async () => {
  if (route.params.id) {
    await fetchAndSetupData();
  }
});
/************************************************************************/
</script>

<template>
<main class="editar-cuenta-wrapper">
  <div class="container-cuenta mx-auto px-4 py-6">

    <!-- Header Section with Navigation -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Editar Cuenta por Pagar</h1>
          <p class="text-gray-600">Cuenta #{{ cuenta.id }} - {{ cuenta.proveedor }}</p>
        </div>
        <Button
          icon="pi pi-arrow-left"
          label="Volver"
          severity="secondary"
          outlined
          @click="router.push('/cuentasxpagar')"
          class="nav-btn"
        />
      </div>

      <!-- Navigation Buttons -->
      <div class="navigation-bar">
        <div class="flex gap-2">
          <Button
            icon="pi pi-angle-double-left"
            @click="navigate('first')"
            :disabled="!puedeIrAnterior"
            severity="secondary"
            outlined
            rounded
            v-tooltip.top="'Primera cuenta'"
          />
          <Button
            icon="pi pi-angle-left"
            @click="navigate('prev')"
            :disabled="!puedeIrAnterior"
            severity="secondary"
            outlined
            rounded
            v-tooltip.top="'Anterior'"
          />
          <Button
            icon="pi pi-angle-right"
            @click="navigate('next')"
            :disabled="!puedeIrSiguiente"
            severity="secondary"
            outlined
            rounded
            v-tooltip.top="'Siguiente'"
          />
          <Button
            icon="pi pi-angle-double-right"
            @click="navigate('last')"
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
            label="Realizar Pago"
            @click="abrirDialogoPago"
            :disabled="cuenta.estado === 'PAGADO'"
            severity="success"
            class="action-btn-nav"
          />
          <Button
            icon="pi pi-check-circle"
            label="Pagar Todo"
            @click="pagarTotal"
            :disabled="cuenta.estado === 'PAGADO'"
            severity="success"
            class="action-btn-nav"
          />
          <Button
            icon="pi pi-file-excel"
            label="Exportar"
            @click="exportarExcel"
            severity="warning"
            outlined
            class="action-btn-nav"
          />
        </div>
      </div>
    </div>

    <!-- Info Card -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header info-header">
          <i class="pi pi-info-circle text-2xl mr-3"></i>
          <div class="flex-1">
            <h2 class="text-xl font-bold">Información de la Cuenta</h2>
            <p class="text-sm opacity-90">Datos generales y estado</p>
          </div>
          <Tag
            :value="cuenta.estado"
            :severity="cuenta.estado === 'PAGADO' ? 'success' : cuenta.estado === 'VENCIDO' ? 'danger' : cuenta.estado === 'PARCIAL' ? 'warning' : 'info'"
            class="text-lg px-4"
          />
        </div>
      </template>

      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <!-- Proveedor -->
          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-building mr-2"></i>Proveedor
            </label>
            <div class="info-value">{{ cuenta.proveedor }}</div>
          </div>

          <!-- RNC -->
          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-id-card mr-2"></i>RNC
            </label>
            <div class="info-value">{{ cuenta.rnc_proveedor }}</div>
          </div>

          <!-- No. Factura -->
          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-file mr-2"></i>No. Factura
            </label>
            <div class="info-value font-mono">{{ cuenta.no_factura }}</div>
          </div>

          <!-- NCF -->
          <div class="info-field" v-if="cuenta.ncf_proveedor">
            <label class="info-label">
              <i class="pi pi-hashtag mr-2"></i>NCF
            </label>
            <div class="info-value font-mono">{{ cuenta.ncf_proveedor }}</div>
          </div>

          <!-- Fecha Compra -->
          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-calendar mr-2"></i>Fecha Compra
            </label>
            <div class="info-value">{{ cuenta.fecha_compra }}</div>
          </div>

          <!-- Fecha Vencimiento -->
          <div class="info-field">
            <label class="info-label">
              <i class="pi pi-calendar-times mr-2"></i>Fecha Vencimiento
            </label>
            <div class="flex items-center gap-2">
              <div class="info-value">{{ cuenta.fecha_vencimiento }}</div>
              <Tag
                v-if="diasHastaVencimiento !== null"
                :value="diasHastaVencimiento < 0
                  ? `Vencida (${Math.abs(diasHastaVencimiento)}d)`
                  : diasHastaVencimiento === 0
                    ? 'Vence hoy'
                    : `${diasHastaVencimiento} días`"
                :severity="estadoVencimiento"
                class="text-xs"
              />
            </div>
          </div>

        </div>

        <!-- Recordatorio -->
        <!-- Alerta de error en montos -->
        <div v-if="hayErrorMontos" class="mt-4 p-4 bg-red-50 border-2 border-red-400 rounded-xl flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-red-600 text-2xl"></i>
          <div>
            <p class="font-bold text-red-800 text-sm uppercase tracking-wide">Error en montos</p>
            <p class="text-red-700 text-sm">
              La suma de los pagos (RD$ {{ historialPagos.reduce((s, p) => s + parseFloat(p.monto || 0), 0).toFixed(2) }}) 
              no coincide con el total de la factura (RD$ {{ parseFloat(cuenta.total).toFixed(2) }}).
            </p>
          </div>
        </div>

        <div class="mt-6 flex items-center">
          <Checkbox
            v-model="cuenta.recordatorio"
            inputId="recordatorio"
            :binary="true"
            class="mr-3"
          />
          <label for="recordatorio" class="info-label mb-0 cursor-pointer">
            <i class="pi pi-bell mr-2"></i>Recordatorio de pago activado
          </label>
        </div>
      </template>
    </Card>

    <!-- Montos Card -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header montos-header">
          <i class="pi pi-dollar text-2xl mr-3"></i>
          <div>
            <h2 class="text-xl font-bold">Montos y Pagos</h2>
            <p class="text-sm opacity-90">Estado financiero de la cuenta</p>
          </div>
        </div>
      </template>

      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- Total -->
          <div class="monto-card total-card">
            <div class="monto-icon">
              <i class="pi pi-money-bill"></i>
            </div>
            <div>
              <div class="monto-label">Total</div>
              <div class="monto-value">${{ parseFloat(cuenta.total).toFixed(2) }}</div>
            </div>
          </div>

          <!-- Abonado -->
          <div class="monto-card abonado-card">
            <div class="monto-icon">
              <i class="pi pi-wallet"></i>
            </div>
            <div>
              <div class="monto-label">Abonado</div>
              <div class="monto-value">${{ parseFloat(cuenta.abono).toFixed(2) }}</div>
            </div>
          </div>

          <!-- Saldo -->
          <div class="monto-card saldo-card" :class="parseFloat(cuenta.saldo) > 0 ? 'saldo-pendiente' : 'saldo-pagado'">
            <div class="monto-icon">
              <i class="pi pi-chart-line"></i>
            </div>
            <div>
              <div class="monto-label">Saldo</div>
              <div class="monto-value">${{ parseFloat(cuenta.saldo).toFixed(2) }}</div>
            </div>
          </div>

        </div>
      </template>
    </Card>

    <!-- Historial de Pagos -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header pagos-header">
          <i class="pi pi-list text-2xl mr-3"></i>
          <div>
            <h2 class="text-xl font-bold">Historial de Pagos</h2>
            <p class="text-sm opacity-90">{{ historialPagos.length }} pago(s) registrado(s)</p>
          </div>
        </div>
      </template>

      <template #content>
        <div v-if="historialPagos.length === 0" class="empty-state">
          <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-500 text-lg">No hay pagos registrados</p>
          <Button
            label="Registrar Primer Pago"
            icon="pi pi-plus"
            @click="abrirDialogoPago"
            severity="success"
            class="mt-4"
          />
        </div>

        <DataTable
          v-else
          :value="historialPagos"
          class="pagos-datatable"
          stripedRows
        >
          <Column field="id" header="#" :style="{width: '60px'}">
            <template #body="slotProps">
              <Tag :value="slotProps.data.id" severity="secondary" />
            </template>
          </Column>

          <Column field="monto" header="Monto">
            <template #body="slotProps">
              <div class="font-bold text-green-600 text-lg">
                ${{ parseFloat(slotProps.data.monto).toFixed(2) }}
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

          <Column field="usuario" header="Usuario">
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-gray-400"></i>
                {{ slotProps.data.usuario }}
              </div>
            </template>
          </Column>

          <Column field="nota" header="Nota">
            <template #body="slotProps">
              <div class="text-sm text-gray-600">{{ slotProps.data.nota || '-' }}</div>
            </template>
          </Column>

          <Column header="Acciones" :style="{width: '100px'}">
            <template #body="slotProps">
              <Button
                icon="pi pi-trash"
                @click="eliminarPago(slotProps.index)"
                severity="danger"
                size="small"
                outlined
                rounded
                v-tooltip.top="'Eliminar pago'"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Nota -->
    <Card class="cuenta-section mb-6">
      <template #header>
        <div class="section-header nota-header">
          <i class="pi pi-comment text-2xl mr-3"></i>
          <div>
            <h2 class="text-xl font-bold">Notas</h2>
            <p class="text-sm opacity-90">Información adicional</p>
          </div>
        </div>
      </template>

      <template #content>
        <Textarea
          v-model="cuenta.nota"
          rows="4"
          placeholder="Ingrese notas adicionales sobre esta cuenta..."
          class="modern-textarea w-full"
        />
      </template>
    </Card>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <Button
        @click="router.push('/cuentasxpagar')"
        icon="pi pi-times"
        label="Cancelar"
        severity="secondary"
        outlined
        class="action-btn"
      />
      <Button
        @click="guardarCambios"
        icon="pi pi-save"
        label="Guardar Cambios"
        severity="success"
        class="action-btn"
      />
    </div>

    <!-- Dialog: Registrar Pago con Cuenta Contable -->
    <Dialog
      v-model:visible="visiblePago"
      modal
      :closable="true"
      :style="{ width: '650px' }"
      :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <i class="pi pi-money-bill text-green-600 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Registrar Pago</h2>
            <p class="text-sm text-gray-500">{{ cuenta.proveedor }}</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <!-- Información de la Cuenta -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Factura</p>
              <p class="text-base font-bold text-gray-800">{{ cuenta.no_factura }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total</p>
              <p class="text-base font-bold text-blue-600">${{ parseFloat(cuenta.total).toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Abonado</p>
              <p class="text-base font-bold text-green-600">${{ parseFloat(cuenta.abono).toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Saldo Pendiente</p>
              <p class="text-lg font-black text-red-600">${{ parseFloat(cuenta.saldo).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Formulario -->
        <div class="space-y-5">
          <!-- Cuenta Contable -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="pi pi-wallet mr-2 text-green-600"></i>
              Cuenta Contable a Afectar
            </label>
            <Dropdown
              v-model="nuevoPago.cuentaContable"
              :options="catalogoCuentas"
              optionLabel="nombre"
              placeholder="Seleccionar cuenta contable"
              class="w-full"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-wallet text-green-600"></i>
                    <span class="font-semibold">{{ slotProps.value.nombre }}</span>
                  </div>
                  <span class="text-sm text-gray-600">
                    Saldo: ${{ parseFloat(slotProps.value.saldo || 0).toFixed(2) }}
                  </span>
                </div>
                <span v-else class="text-gray-400">{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-wallet text-green-600"></i>
                    <span class="font-semibold">{{ slotProps.option.nombre }}</span>
                  </div>
                  <span class="text-sm font-bold" :class="parseFloat(slotProps.option.saldo || 0) > 0 ? 'text-green-600' : 'text-red-600'">
                    ${{ parseFloat(slotProps.option.saldo || 0).toFixed(2) }}
                  </span>
                </div>
              </template>
            </Dropdown>
            <p class="text-xs text-gray-500 mt-1">
              <i class="pi pi-info-circle mr-1"></i>
              El saldo de esta cuenta se reducirá según el monto del pago
            </p>
          </div>

          <!-- Monto -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="pi pi-dollar mr-2 text-blue-600"></i>
              Monto a Pagar
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
              <InputNumber
                v-model="nuevoPago.monto"
                mode="decimal"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                :min="0.01"
                :max="parseFloat(cuenta.saldo)"
                placeholder="0.00"
                class="w-full"
                inputClass="w-full pl-8 pr-4 py-3 text-lg font-semibold"
              />
            </div>
            <div class="flex items-center justify-between mt-2">
              <p class="text-xs text-gray-500">
                <i class="pi pi-info-circle mr-1"></i>
                Máximo: ${{ parseFloat(cuenta.saldo).toFixed(2) }}
              </p>
              <Button
                @click="nuevoPago.monto = parseFloat(cuenta.saldo)"
                label="Pagar todo"
                size="small"
                text
                severity="success"
                class="text-xs"
              />
            </div>
          </div>

          <!-- Forma de Pago -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="pi pi-credit-card mr-2 text-indigo-600"></i>
              Forma de Pago
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="forma in formasPago"
                :key="forma"
                @click="nuevoPago.metodo = forma"
                :class="[
                  'p-3 rounded-lg border-2 cursor-pointer transition-all duration-200',
                  nuevoPago.metodo === forma
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                ]"
              >
                <div class="flex items-center gap-2">
                  <i
                    :class="[
                      'text-lg',
                      forma === 'EFECTIVO' ? 'pi pi-money-bill' : '',
                      forma === 'TRANSFERENCIA' ? 'pi pi-send' : '',
                      forma === 'CHEQUE' ? 'pi pi-book' : '',
                      forma === 'TARJETA' ? 'pi pi-credit-card' : '',
                      nuevoPago.metodo === forma ? 'text-indigo-600' : 'text-gray-500'
                    ]"
                  ></i>
                  <span
                    :class="[
                      'font-semibold text-sm',
                      nuevoPago.metodo === forma ? 'text-indigo-700' : 'text-gray-700'
                    ]"
                  >
                    {{ forma }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Nota -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="pi pi-file-edit mr-2 text-purple-600"></i>
              Nota del Pago (Opcional)
            </label>
            <Textarea
              v-model="nuevoPago.nota"
              rows="3"
              placeholder="Agregar comentarios sobre este pago..."
              class="w-full resize-none"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            @click="visiblePago = false"
            icon="pi pi-times"
            class="px-6"
            :disabled="loadingPago"
          />
          <Button
            :label="loadingPago ? 'Procesando...' : 'Registrar Pago'"
            severity="success"
            @click="registrarPago"
            :icon="loadingPago ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            class="px-6"
            :loading="loadingPago"
            :disabled="loadingPago"
          />
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</main>
</template>

<style scoped>
/* ===================================
   EDITAR CUENTA X PAGAR STYLES
   =================================== */

.editar-cuenta-wrapper {
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.3) 0%, rgba(254, 226, 226, 0.2) 100%);
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
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.montos-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.pagos-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.nota-header {
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
.pagos-datatable {
  font-size: 0.95rem;
}

.pagos-datatable :deep(.p-datatable-tbody > tr:hover) {
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
.modern-textarea {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.modern-textarea:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  outline: none;
}

/* InputNumber Custom */
.modern-input-number :deep(.p-inputnumber-input) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.modern-input-number :deep(.p-inputnumber-input:focus) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Calendar Custom */
.modern-calendar :deep(.p-inputtext) {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.75rem;
}

.modern-calendar :deep(.p-inputtext:focus) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
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
