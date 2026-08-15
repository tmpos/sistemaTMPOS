<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { peticionesFetchOffline, crearTablaSiNoExisteOffline, nfecha } from '../../funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const data = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const selectedLog = ref(null);
const visibleDetalle = ref(false);

const tabla = 'facturacion_electronica_log';
const camposArray = [
  'no_factura', 'encf', 'tipo_ecf', 'ambiente',
  'id_factura_local', 'alanube_id', 'status', 'legal_status',
  'document_number', 'security_code', 'signature_date',
  'sequence_consumed',
  'document_stamp_url', 'pdf_url', 'xml_url', 'resume_xml_url',
  'government_response', 'raw_response', 'usuario', 'almacen'
];

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await peticionesFetchOffline('getDataAsArray', tabla);
    data.value = Array.isArray(response) ? response.reverse() : [];
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los logs', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const filteredData = computed(() => {
  if (!searchQuery.value) return data.value;
  const q = searchQuery.value.toLowerCase();
  return data.value.filter((item) =>
    String(item.encf || '').toLowerCase().includes(q) ||
    String(item.no_factura || '').toLowerCase().includes(q) ||
    String(item.alanube_id || '').toLowerCase().includes(q) ||
    String(item.document_number || '').toLowerCase().includes(q) ||
    String(item.status || '').toLowerCase().includes(q) ||
    String(item.legal_status || '').toLowerCase().includes(q) ||
    String(item.tipo_ecf || '').toLowerCase().includes(q)
  );
});

const abrirDetalle = (row) => {
  selectedLog.value = row;
  visibleDetalle.value = true;
};

const getStatusSeverity = (status) => {
  const map = {
    REGISTERED: 'info',
    ACCEPTED: 'success',
    ACCEPTED_WITH_OBSERVATIONS: 'warn',
    REJECTED: 'danger',
    PENDING: 'warning'
  };
  return map[String(status).toUpperCase()] || 'secondary';
};

const parseJson = (str) => {
  try { return JSON.parse(str); } catch { return str; }
};

onMounted(async () => {
  await crearTablaSiNoExisteOffline(tabla, camposArray, toast);
  await fetchData();
});
</script>

<template>
  <div class="space-y-4 p-4 md:p-6">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="m-0 text-sm font-semibold text-blue-600 dark:text-blue-400">FACTURACIÓN ELECTRÓNICA</p>
        <h2 class="m-0 text-2xl font-bold text-slate-800 dark:text-slate-100">Log de Facturación Electrónica</h2>
        <p class="m-0 text-sm text-slate-500">Historial de envíos a DGII vía Alanube</p>
      </div>
      <div class="flex gap-2">
        <IconField>
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar..." />
        </IconField>
        <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="fetchData" />
        <Button label="Volver a Vender" icon="pi pi-arrow-left" severity="info" outlined @click="$router.push('/vender')" />
      </div>
    </div>

    <DataTable
      :value="filteredData"
      :loading="loading"
      scrollable
      scrollHeight="calc(100vh - 220px)"
      size="small"
      stripedRows
      :rows="25"
      paginator
      sortField="id"
      :sortOrder="-1"
    >
      <Column field="created_at" header="FECHA" style="min-width: 140px">
        <template #body="slotProps">
          <span class="text-xs">{{ slotProps.data.created_at || nfecha('fecha') }}</span>
        </template>
      </Column>
      <Column field="tipo_ecf" header="TIPO" style="min-width: 60px">
        <template #body="slotProps">
          <Tag :value="slotProps.data.tipo_ecf" :severity="slotProps.data.tipo_ecf === 'E31' ? 'info' : 'success'" />
        </template>
      </Column>
      <Column field="encf" header="e-NCF" style="min-width: 140px">
        <template #body="slotProps">
          <span class="font-mono text-xs">{{ slotProps.data.encf }}</span>
        </template>
      </Column>
      <Column field="no_factura" header="No. FACTURA" style="min-width: 120px">
        <template #body="slotProps">
          <span class="font-mono text-xs">{{ slotProps.data.no_factura }}</span>
        </template>
      </Column>
      <Column field="status" header="STATUS" style="min-width: 120px">
        <template #body="slotProps">
          <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
        </template>
      </Column>
      <Column field="legal_status" header="DGII" style="min-width: 150px">
        <template #body="slotProps">
          <Tag :value="slotProps.data.legal_status || '—'" :severity="getStatusSeverity(slotProps.data.legal_status)" />
        </template>
      </Column>
      <Column field="ambiente" header="AMB" style="min-width: 70px">
        <template #body="slotProps">
          <Tag :value="slotProps.data.ambiente" :severity="slotProps.data.ambiente === 'production' ? 'danger' : 'info'" />
        </template>
      </Column>
      <Column field="document_number" header="DOC" style="min-width: 100px">
        <template #body="slotProps">
          <span class="text-xs font-mono">{{ slotProps.data.document_number || '—' }}</span>
        </template>
      </Column>
      <Column field="security_code" header="SEGURIDAD" style="min-width: 90px">
        <template #body="slotProps">
          <span class="font-mono text-xs">{{ slotProps.data.security_code || '—' }}</span>
        </template>
      </Column>
      <Column header="ACCIONES" style="min-width: 100px">
        <template #body="slotProps">
          <div class="flex gap-1">
            <Button icon="pi pi-eye" size="small" text rounded severity="info" @click="abrirDetalle(slotProps.data)" v-tooltip.top="'Ver detalle'" />
            <a :href="slotProps.data.pdf_url" target="_blank" rel="noopener" v-if="slotProps.data.pdf_url" class="no-underline"><Button icon="pi pi-file-pdf" size="small" text rounded severity="danger" v-tooltip.top="'Ver PDF'" /></a>
            <a :href="slotProps.data.xml_url" target="_blank" rel="noopener" v-if="slotProps.data.xml_url" class="no-underline"><Button icon="pi pi-code" size="small" text rounded severity="warning" v-tooltip.top="'Ver XML'" /></a>
          </div>
        </template>
      </Column>
      <template #empty>
        <div class="py-8 text-center text-slate-500">
          <i class="pi pi-inbox text-4xl mb-3 block text-slate-300"></i>
          <p class="m-0">No hay registros de facturación electrónica</p>
        </div>
      </template>
    </DataTable>

    <Dialog v-model:visible="visibleDetalle" modal header="Detalle de Facturación Electrónica" :style="{ width: '50rem', maxWidth: '95vw' }">
      <div v-if="selectedLog" class="space-y-3">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><strong>ID Alanube:</strong> {{ selectedLog.alanube_id }}</div>
          <div><strong>e-NCF:</strong> {{ selectedLog.encf }}</div>
          <div><strong>No. Factura:</strong> {{ selectedLog.no_factura }}</div>
          <div><strong>Tipo:</strong> {{ selectedLog.tipo_ecf }}</div>
          <div><strong>Ambiente:</strong> {{ selectedLog.ambiente }}</div>
          <div><strong>Status:</strong> {{ selectedLog.status }}</div>
          <div><strong>DGII:</strong> {{ selectedLog.legal_status }}</div>
          <div><strong>Doc. Number:</strong> {{ selectedLog.document_number }}</div>
          <div><strong>Código Seguridad:</strong> {{ selectedLog.security_code }}</div>
          <div><strong>Fecha Firma:</strong> {{ selectedLog.signature_date }}</div>
          <div><strong>Secuencia consumida:</strong> {{ selectedLog.sequence_consumed || 'NO' }}</div>
        </div>

        <div v-if="selectedLog.document_stamp_url" class="flex gap-2 flex-wrap">
          <a :href="selectedLog.document_stamp_url" target="_blank" rel="noopener" class="no-underline"><Button label="Ver Sello DGII" icon="pi pi-external-link" severity="info" /></a>
          <a :href="selectedLog.pdf_url" target="_blank" rel="noopener" class="no-underline" v-if="selectedLog.pdf_url"><Button label="PDF" icon="pi pi-file-pdf" severity="danger" /></a>
          <a :href="selectedLog.xml_url" target="_blank" rel="noopener" class="no-underline" v-if="selectedLog.xml_url"><Button label="XML" icon="pi pi-code" severity="warning" /></a>
          <a :href="selectedLog.resume_xml_url" target="_blank" rel="noopener" class="no-underline" v-if="selectedLog.resume_xml_url"><Button label="XML Resumen" icon="pi pi-file" severity="secondary" /></a>
        </div>

        <div v-if="selectedLog.government_response && selectedLog.government_response !== '{}'">
          <h4 class="text-sm font-bold mb-1">Respuesta del Gobierno (DGII)</h4>
          <pre class="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-auto max-h-40">{{ parseJson(selectedLog.government_response) }}</pre>
        </div>

        <div>
          <h4 class="text-sm font-bold mb-1">Respuesta Completa (Alanube)</h4>
          <pre class="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-auto max-h-60">{{ parseJson(selectedLog.raw_response) }}</pre>
        </div>
      </div>
      <template #footer>
        <Button label="Cerrar" severity="secondary" outlined @click="visibleDetalle = false" />
      </template>
    </Dialog>
  </div>
</template>
