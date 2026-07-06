<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useDatosEmpresa } from '@/stores';
import {
  encryptarPassword,
  envioElectron,
  nfecha,
  peticionesFetchOffline,
  arrayToObjetoFromTablaOffline
} from '../../funciones/funciones.js';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const link     = ref('');
const api      = ref('');
const token    = ref('');
const tokenCifrado = ref(null);

const accounts       = ref([]);
const fromAccount    = ref(null);
const toAccount      = ref(null);
const amount         = ref(0);
const description    = ref('');
const transactions   = ref([]);
const loading        = ref(false);
const usuarioLocal   = ref({});

// ── cuentas filtradas (excluir la cuenta origen) ────────────────────────
const filteredAccounts = computed(() =>
  accounts.value.filter(a => a.id !== fromAccount.value?.id)
);

const fromBalance = computed(() =>
  fromAccount.value ? Number(fromAccount.value.saldo) : null
);
const toBalance = computed(() =>
  toAccount.value ? Number(toAccount.value.saldo) : null
);
const balanceTrasTransfer = computed(() => {
  if (fromBalance.value === null || !amount.value) return null;
  return fromBalance.value - amount.value;
});

// ── carga de cuentas (banco + cuentas) ──────────────────────────────────
const fetchCuentas = async () => {
  const banco   = await peticionesFetchOffline('getDataArrayByCondition', 'banco',   'almacen', datosEmpresa.empresa.nombre) || [];
  const cuentas = await peticionesFetchOffline('getDataAsArray', 'cuentas') || [];
  accounts.value = [
    ...banco.map(b => ({ ...b, _tabla: 'banco' })),
    ...cuentas.map(c => ({ ...c, _tabla: 'cuentas' }))
  ];
};

// ── carga historial de transacciones ────────────────────────────────────
const fetchHistorial = async () => {
  const all = await peticionesFetchOffline('getDataAsArray', 'transaccionesbancarias') || [];
  transactions.value = all
    .filter(t => t.tipo === 'TRANSFERENCIA')
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
};

onMounted(async () => {
  const datosJSON = await envioElectron('datosarchivo');
  link.value  = datosJSON.VITE_LINKURL;
  api.value   = datosJSON.VITE_LINK_API;
  token.value = datosJSON.VITE_TOKEN;
  tokenCifrado.value = await encryptarPassword(token.value, 10);
  usuarioLocal.value = JSON.parse(window.localStorage.getItem('usuarioLocal') || '[]')[0] || {};
  await fetchCuentas();
  await fetchHistorial();
});

// ── ejecutar transferencia ───────────────────────────────────────────────
const addTransaction = async () => {
  if (!fromAccount.value || !toAccount.value) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Selecciona ambas cuentas', life: 3000 });
    return;
  }
  if (!amount.value || amount.value <= 0) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Ingresa un monto válido', life: 3000 });
    return;
  }
  if (fromAccount.value.id === toAccount.value.id) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Las cuentas no pueden ser iguales', life: 3000 });
    return;
  }
  if (Number(fromAccount.value.saldo) < amount.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fondos insuficientes en la cuenta origen', life: 3000 });
    return;
  }

  loading.value = true;
  try {
    const monto         = Number(amount.value);
    const balAnteriorOrig = Number(fromAccount.value.saldo);
    const balAnteriorDest = Number(toAccount.value.saldo);
    const balActualOrig   = balAnteriorOrig - monto;
    const balActualDest   = balAnteriorDest + monto;

    // 1. Actualizar cuenta origen
    const orig = { ...fromAccount.value, saldo: balActualOrig.toFixed(2), updated_at: nfecha('timestamp') };
    delete orig._tabla;
    await peticionesFetchOffline('updateData', fromAccount.value._tabla, JSON.stringify(orig));

    // 2. Actualizar cuenta destino
    const dest = { ...toAccount.value, saldo: balActualDest.toFixed(2), updated_at: nfecha('timestamp') };
    delete dest._tabla;
    await peticionesFetchOffline('updateData', toAccount.value._tabla, JSON.stringify(dest));

    // 3. Registrar en transaccionesbancarias
    const transaccion = await arrayToObjetoFromTablaOffline('transaccionesbancarias');
    transaccion.tipo            = 'TRANSFERENCIA';
    transaccion.fecha           = nfecha('fecha');
    transaccion.hora            = nfecha('hora');
    transaccion.estado          = 'COMPLETADA';
    transaccion.cuenta_origen   = fromAccount.value.nombre;
    transaccion.cuenta_destino  = toAccount.value.nombre;
    transaccion.monto           = monto.toFixed(2);
    transaccion.metodo          = 'TRANSFERENCIA';
    transaccion.balance_anterior = balAnteriorOrig.toFixed(2);
    transaccion.balance_actual   = balActualOrig.toFixed(2);
    transaccion.descripcion     = description.value || 'Transferencia entre cuentas';
    transaccion.depositante     = fromAccount.value.nombre;
    transaccion.beneficiario    = toAccount.value.nombre;
    if ('almacen'    in transaccion) transaccion.almacen    = datosEmpresa.empresa.nombre;
    if ('usuario'    in transaccion) transaccion.usuario    = usuarioLocal.value?.usuario || '';
    if ('created_at' in transaccion) {
      transaccion.created_at = nfecha('timestamp');
      transaccion.updated_at = nfecha('timestamp');
    }
    await peticionesFetchOffline('insertData', 'transaccionesbancarias', JSON.stringify(transaccion));

    toast.add({ severity: 'success', summary: 'Transferencia realizada', detail: `$${monto.toFixed(2)} transferidos correctamente`, life: 3000 });
    resetForm();
    await fetchCuentas();
    await fetchHistorial();
  } catch (err) {
    console.error(err);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar la transferencia', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  fromAccount.value  = null;
  toAccount.value    = null;
  amount.value       = 0;
  description.value  = '';
};

const formatCurrency = (v) => `$${Number(v || 0).toFixed(2)}`;
</script>

<template>
  <div class="trans-wrapper">

    <!-- ── HEADER ─────────────────────────────────────────── -->
    <div class="trans-header">
      <div class="trans-header-icon">
        <i class="pi pi-arrows-h"></i>
      </div>
      <div>
        <h1 class="trans-title">Transferencia entre Cuentas</h1>
        <p class="trans-subtitle">Mueve fondos de una cuenta a otra de forma inmediata</p>
      </div>
    </div>

    <!-- ── FORMULARIO ─────────────────────────────────────── -->
    <div class="trans-card">

      <div class="trans-form-grid">

        <!-- CUENTA ORIGEN -->
        <div class="trans-account-block origin">
          <div class="account-block-label">
            <i class="pi pi-arrow-up-right"></i> Cuenta Origen
          </div>
          <Dropdown
            v-model="fromAccount"
            :options="accounts"
            optionLabel="nombre"
            placeholder="Selecciona la cuenta"
            filter
            class="w-full"
          >
            <template #option="s">
              <div class="acct-option">
                <span class="acct-name">{{ s.option.nombre }}</span>
                <Tag :value="formatCurrency(s.option.saldo)" severity="info" />
              </div>
            </template>
            <template #value="s">
              <span v-if="s.value">{{ s.value.nombre }}</span>
              <span v-else class="placeholder-text">{{ s.placeholder }}</span>
            </template>
          </Dropdown>
          <div v-if="fromAccount" class="balance-display origin-balance">
            <i class="pi pi-wallet"></i>
            <span>Saldo disponible: <strong>{{ formatCurrency(fromAccount.saldo) }}</strong></span>
          </div>
        </div>

        <!-- FLECHA CENTRAL -->
        <div class="trans-arrow">
          <div class="arrow-circle">
            <i class="pi pi-arrow-right"></i>
          </div>
          <div v-if="amount > 0" class="arrow-amount">{{ formatCurrency(amount) }}</div>
        </div>

        <!-- CUENTA DESTINO -->
        <div class="trans-account-block dest">
          <div class="account-block-label">
            <i class="pi pi-arrow-down-left"></i> Cuenta Destino
          </div>
          <Dropdown
            v-model="toAccount"
            :options="filteredAccounts"
            optionLabel="nombre"
            placeholder="Selecciona la cuenta"
            filter
            class="w-full"
          >
            <template #option="s">
              <div class="acct-option">
                <span class="acct-name">{{ s.option.nombre }}</span>
                <Tag :value="formatCurrency(s.option.saldo)" severity="info" />
              </div>
            </template>
            <template #value="s">
              <span v-if="s.value">{{ s.value.nombre }}</span>
              <span v-else class="placeholder-text">{{ s.placeholder }}</span>
            </template>
          </Dropdown>
          <div v-if="toAccount" class="balance-display dest-balance">
            <i class="pi pi-wallet"></i>
            <span>Saldo actual: <strong>{{ formatCurrency(toAccount.saldo) }}</strong></span>
          </div>
        </div>

      </div>

      <!-- MONTO + DESCRIPCIÓN -->
      <div class="trans-detail-row">
        <div class="trans-field">
          <label>Monto a transferir *</label>
          <InputNumber
            v-model="amount"
            mode="currency"
            currency="DOP"
            locale="es-DO"
            class="w-full"
          />
          <!-- preview del balance tras transferencia -->
          <div v-if="balanceTrasTransfer !== null" class="balance-preview"
               :class="balanceTrasTransfer < 0 ? 'preview-danger' : 'preview-ok'">
            <i :class="balanceTrasTransfer < 0 ? 'pi pi-times-circle' : 'pi pi-check-circle'"></i>
            Saldo origen tras transferencia:
            <strong>{{ formatCurrency(balanceTrasTransfer) }}</strong>
          </div>
        </div>
        <div class="trans-field">
          <label>Descripción (opcional)</label>
          <InputText v-model="description" placeholder="Ej: Pago de gastos operativos" class="w-full" />
        </div>
      </div>

      <!-- BOTÓN -->
      <div class="trans-submit">
        <Button
          label="Transferir"
          icon="pi pi-send"
          :loading="loading"
          :disabled="!fromAccount || !toAccount || !amount || amount <= 0"
          @click="addTransaction"
          class="trans-btn"
        />
      </div>

    </div>

    <!-- ── HISTORIAL ───────────────────────────────────────── -->
    <div class="trans-card" style="margin-top: 1.5rem;">
      <div class="hist-header">
        <div class="hist-title">
          <i class="pi pi-history"></i>
          <span>Historial de Transferencias</span>
        </div>
        <Button icon="pi pi-refresh" severity="secondary" text rounded @click="fetchHistorial" />
      </div>

      <div v-if="transactions.length === 0" class="hist-empty">
        <i class="pi pi-inbox"></i>
        <span>No hay transferencias registradas</span>
      </div>

      <div v-else class="hist-list">
        <div v-for="tx in transactions" :key="tx.id" class="hist-item">

          <!-- Ícono -->
          <div class="hist-icon">
            <i class="pi pi-arrows-h"></i>
          </div>

          <!-- Cuentas -->
          <div class="hist-accounts">
            <div class="hist-route">
              <span class="hist-cuenta-orig">{{ tx.cuenta_origen }}</span>
              <i class="pi pi-arrow-right hist-arrow-small"></i>
              <span class="hist-cuenta-dest">{{ tx.cuenta_destino }}</span>
            </div>
            <div class="hist-desc">{{ tx.descripcion || '—' }}</div>
          </div>

          <!-- Monto -->
          <div class="hist-amount">
            {{ formatCurrency(tx.monto) }}
          </div>

          <!-- Fecha / Hora / Usuario -->
          <div class="hist-meta">
            <div class="hist-meta-row">
              <i class="pi pi-calendar"></i>
              <span>{{ tx.fecha || '—' }}</span>
            </div>
            <div class="hist-meta-row">
              <i class="pi pi-clock"></i>
              <span>{{ tx.hora || '—' }}</span>
            </div>
            <div class="hist-meta-row">
              <i class="pi pi-user"></i>
              <span>{{ tx.usuario || '—' }}</span>
            </div>
          </div>

          <!-- Estado -->
          <Tag :value="tx.estado" severity="success" class="hist-tag" />

        </div>
      </div>
    </div>

    <Toast />
  </div>
</template>

<style scoped>
/* ─── WRAPPER ─────────────────────────────────────────────── */
.trans-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

/* ─── HEADER ──────────────────────────────────────────────── */
.trans-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.trans-header-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(59,130,246,.35);
}
.trans-header-icon i {
  color: #fff;
  font-size: 1.4rem;
}
.trans-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
}
.trans-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* ─── CARD ────────────────────────────────────────────────── */
.trans-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,.07);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
}

/* ─── FORM GRID (origen / flecha / destino) ───────────────── */
.trans-form-grid {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  gap: 1rem;
  align-items: start;
  margin-bottom: 1.25rem;
}
@media (max-width: 640px) {
  .trans-form-grid {
    grid-template-columns: 1fr;
  }
  .trans-arrow { flex-direction: row; }
}

.trans-account-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.account-block-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.origin .account-block-label { color: #2563eb; }
.dest   .account-block-label { color: #059669; }

.balance-display {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
}
.origin-balance { background: #eff6ff; color: #1d4ed8; }
.dest-balance   { background: #f0fdf4; color: #166534; }

/* ─── FLECHA CENTRAL ──────────────────────────────────────── */
.trans-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 1.75rem;
  gap: 0.4rem;
}
.arrow-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(59,130,246,.4);
}
.arrow-circle i { color: #fff; font-size: 1.1rem; }
.arrow-amount {
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
}

/* ─── MONTO + DESC ────────────────────────────────────────── */
.trans-detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
@media (max-width: 640px) {
  .trans-detail-row { grid-template-columns: 1fr; }
}
.trans-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.trans-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}
.balance-preview {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
}
.preview-ok     { background: #f0fdf4; color: #166534; }
.preview-danger { background: #fef2f2; color: #991b1b; }

/* ─── BOTÓN ───────────────────────────────────────────────── */
.trans-submit { display: flex; justify-content: flex-end; }
.trans-btn {
  padding: 0.75rem 2rem;
  font-weight: 700;
  border-radius: 12px;
  font-size: 1rem;
}

/* ─── HISTORIAL ───────────────────────────────────────────── */
.hist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.hist-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}
.hist-title i { color: #6b7280; }

.hist-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem;
  color: #9ca3af;
  font-size: 0.95rem;
}
.hist-empty i { font-size: 2rem; }

.hist-list { display: flex; flex-direction: column; gap: 0.75rem; }

.hist-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: box-shadow .2s;
}
.hist-item:hover { box-shadow: 0 2px 10px rgba(0,0,0,.07); }

.hist-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hist-icon i { color: #fff; font-size: 1rem; }

.hist-accounts { flex: 1; min-width: 0; }
.hist-route {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  flex-wrap: wrap;
}
.hist-cuenta-orig { color: #2563eb; }
.hist-cuenta-dest { color: #059669; }
.hist-arrow-small { color: #9ca3af; font-size: 0.75rem; }
.hist-desc { font-size: 0.78rem; color: #6b7280; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.hist-amount {
  font-size: 1rem;
  font-weight: 800;
  color: #7c3aed;
  white-space: nowrap;
  min-width: 90px;
  text-align: right;
}

.hist-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 130px;
}
.hist-meta-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #6b7280;
}
.hist-meta-row i { font-size: 0.72rem; color: #9ca3af; }

.hist-tag { flex-shrink: 0; }

/* ─── DROPDOWN OPTIONS ────────────────────────────────────── */
.acct-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}
.acct-name { font-weight: 600; }
.placeholder-text { color: #9ca3af; }
</style>
