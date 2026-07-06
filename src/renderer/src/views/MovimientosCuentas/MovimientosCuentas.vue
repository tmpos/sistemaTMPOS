<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from "primevue/usetoast";
import { nfecha, envioElectron, peticionesFetchOffline, crearTablaSiNoExisteOffline } from '../../funciones/funciones.js';
import { useDatosEmpresa } from '../../stores';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();
const loading = ref(false);
const datasource = ref([]);
const cuentas = ref([]);
const searchQuery = ref('');
const fechaDesde = ref('');
const fechaHasta = ref('');
const selectedAccount = ref(null);
const accountMovements = ref([]);
const visibleDetalle = ref(false);

const camposArrayCuentas = ['nombre', 'categoria', 'saldo'];
const camposArrayAsiento = ["numero", "fecha", "hora", "asiento", "descripcion", "usuario"];

const fetchData = async () => {
  loading.value = true;
  try {
    await crearTablaSiNoExisteOffline('cuentas', camposArrayCuentas, toast);
    await crearTablaSiNoExisteOffline('asientodiario', camposArrayAsiento, toast);

    const cuentasDB = await peticionesFetchOffline('getDataAsArray', 'cuentas');
    cuentas.value = cuentasDB || [];

    const asientos = await peticionesFetchOffline('getDataAsArray', 'asientodiario');
    datasource.value = asientos || [];
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num) => {
  return parseFloat(num || 0).toFixed(2);
};

const movimientosPorCuenta = computed(() => {
  const result = {};

  const filtered = datasource.value.filter(row => {
    if (fechaDesde.value && row.fecha < fechaDesde.value) return false;
    if (fechaHasta.value && row.fecha > fechaHasta.value) return false;
    return true;
  });

  filtered.forEach(entrada => {
    try {
      const asiento = JSON.parse(entrada.asiento);
      asiento.forEach(item => {
        const debito = parseFloat(item.cantidadDebito) || 0;
        const credito = parseFloat(item.cantidadCredito) || 0;
        const cuentaDebito = (item.debito || '').trim();
        const cuentaCredito = (item.credito || '').trim();

        if (cuentaDebito) {
          if (!result[cuentaDebito]) result[cuentaDebito] = { nombre: cuentaDebito, debitos: 0, creditos: 0, movimientos: [] };
          result[cuentaDebito].debitos += debito;
          result[cuentaDebito].movimientos.push({
            fecha: entrada.fecha,
            descripcion: entrada.descripcion,
            numero: entrada.numero,
            debito, credito: 0, tipo: 'DEBITO', cuenta: cuentaCredito
          });
        }
        if (cuentaCredito) {
          if (!result[cuentaCredito]) result[cuentaCredito] = { nombre: cuentaCredito, debitos: 0, creditos: 0, movimientos: [] };
          result[cuentaCredito].creditos += credito;
          result[cuentaCredito].movimientos.push({
            fecha: entrada.fecha,
            descripcion: entrada.descripcion,
            numero: entrada.numero,
            debito: 0, credito, tipo: 'CREDITO', cuenta: cuentaDebito
          });
        }
      });
    } catch (e) {}
  });

  return Object.values(result).map(c => ({
    ...c,
    saldo: c.debitos - c.creditos
  }));
});

const filteredMovimientos = computed(() => {
  let data = movimientosPorCuenta.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    data = data.filter(c => c.nombre.toLowerCase().includes(q));
  }
  return data.sort((a, b) => a.nombre.localeCompare(b.nombre));
});

const totalDebitos = computed(() => filteredMovimientos.value.reduce((s, c) => s + c.debitos, 0));
const totalCreditos = computed(() => filteredMovimientos.value.reduce((s, c) => s + c.creditos, 0));
const totalCuentas = computed(() => filteredMovimientos.value.length);

const verDetalle = (cuenta) => {
  selectedAccount.value = cuenta;
  accountMovements.value = cuenta.movimientos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  visibleDetalle.value = true;
};

const getSaldoClass = (saldo) => {
  if (saldo > 0) return 'text-green-600';
  if (saldo < 0) return 'text-red-600';
  return 'text-gray-600';
};

onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  if (!datosEmpresa.empresa.nombre) {
    await datosEmpresa.inicializarDatosEmpresa(datosJSON.VITE_LINKURL + datosJSON.VITE_LINK_API);
  }
  await fetchData();
});
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen">
    <div class="w-full px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Movimientos de Cuentas</h1>
          <p class="text-gray-600 mt-1">Detalle de movimientos por cuenta contable</p>
        </div>
        <Button icon="pi pi-refresh" label="Recargar" @click="fetchData" severity="warning" outlined />
      </div>

      <Card class="mb-6">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
              <input v-model="fechaDesde" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
              <input v-model="fechaHasta" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Buscar Cuenta</label>
              <input v-model="searchQuery" type="text" placeholder="Nombre de cuenta..." class="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div class="flex items-end">
              <Button label="Limpiar Filtros" icon="pi pi-filter-slash" severity="secondary" outlined @click="fechaDesde = ''; fechaHasta = ''; searchQuery = ''" class="w-full" />
          </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <div class="text-sm text-gray-500">Total Cuentas</div>
          <div class="text-2xl font-bold text-gray-800">{{ totalCuentas }}</div>
        </div>
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <div class="text-sm text-gray-500">Total Débitos</div>
          <div class="text-2xl font-bold text-green-600">${{ formatNumber(totalDebitos) }}</div>
        </div>
        <div class="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <div class="text-sm text-gray-500">Total Créditos</div>
          <div class="text-2xl font-bold text-red-600">${{ formatNumber(totalCreditos) }}</div>
        </div>
      </div>

      <Card>
        <template #content>
          <DataTable :value="filteredMovimientos" scrollable scrollHeight="500px" paginator :rows="15" :rowsPerPageOptions="[10, 15, 25, 50]" class="modern-datatable">
            <Column field="nombre" header="Cuenta Contable" sortable :style="{ minWidth: '250px' }">
              <template #body="slotProps">
                <div class="flex items-center gap-2">
                  <i class="pi pi-book text-blue-600"></i>
                  <span class="font-medium">{{ slotProps.data.nombre }}</span>
                </div>
              </template>
            </Column>
            <Column field="debitos" header="Débitos" sortable :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                <span class="text-green-600 font-semibold">${{ formatNumber(slotProps.data.debitos) }}</span>
              </template>
            </Column>
            <Column field="creditos" header="Créditos" sortable :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                <span class="text-red-600 font-semibold">${{ formatNumber(slotProps.data.creditos) }}</span>
              </template>
            </Column>
            <Column field="saldo" header="Saldo" sortable :style="{ minWidth: '150px' }">
              <template #body="slotProps">
                <span :class="'font-bold ' + getSaldoClass(slotProps.data.saldo)">
                  ${{ formatNumber(slotProps.data.saldo) }}
                </span>
              </template>
            </Column>
            <Column header="Acciones" :style="{ width: '100px' }">
              <template #body="slotProps">
                <Button icon="pi pi-search" @click="verDetalle(slotProps.data)" severity="info" size="small" rounded />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <Dialog v-model:visible="visibleDetalle" modal :header="'Movimientos - ' + (selectedAccount?.nombre || '')" :style="{ width: '800px' }" :breakpoints="{ '960px': '90vw' }">
      <div v-if="selectedAccount" class="space-y-4">
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="bg-blue-50 p-3 rounded-lg text-center">
            <div class="text-xs text-gray-500">Débitos</div>
            <div class="text-lg font-bold text-green-600">${{ formatNumber(selectedAccount.debitos) }}</div>
          </div>
          <div class="bg-red-50 p-3 rounded-lg text-center">
            <div class="text-xs text-gray-500">Créditos</div>
            <div class="text-lg font-bold text-red-600">${{ formatNumber(selectedAccount.creditos) }}</div>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg text-center">
            <div class="text-xs text-gray-500">Saldo</div>
            <div class="text-lg font-bold" :class="getSaldoClass(selectedAccount.saldo)">${{ formatNumber(selectedAccount.saldo) }}</div>
          </div>
        </div>

        <DataTable :value="accountMovements" scrollable scrollHeight="400px" class="modern-datatable">
          <Column field="fecha" header="Fecha" sortable :style="{ minWidth: '110px' }" />
          <Column field="numero" header="# Asiento" :style="{ minWidth: '100px' }" />
          <Column field="descripcion" header="Descripción" :style="{ minWidth: '200px' }" />
          <Column field="cuenta" header="Contraparte" :style="{ minWidth: '150px' }" />
          <Column field="debito" header="Débito" :style="{ minWidth: '120px' }">
            <template #body="slotProps">
              <span v-if="slotProps.data.debito > 0" class="text-green-600 font-semibold">${{ formatNumber(slotProps.data.debito) }}</span>
            </template>
          </Column>
          <Column field="credito" header="Crédito" :style="{ minWidth: '120px' }">
            <template #body="slotProps">
              <span v-if="slotProps.data.credito > 0" class="text-red-600 font-semibold">${{ formatNumber(slotProps.data.credito) }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>

    <Toast />
  </main>
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}
</style>
