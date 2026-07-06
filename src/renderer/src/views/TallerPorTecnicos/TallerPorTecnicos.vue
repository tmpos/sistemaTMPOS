<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { peticionesFetchOffline, nfecha, envioElectron, transformarFechaTimestamp, agregarDiasalaFechaActual } from '@/funciones/funciones.js';
import { useDatosEmpresa } from '@/stores';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();
const loading = ref(false);

const fechaInicio = ref('');
const fechaFin = ref('');
const tecnicoFilter = ref('');
const trabajosPorTecnico = ref([]);

const totalTrabajos = computed(() => trabajosPorTecnico.value.reduce((sum, t) => sum + t.cantidad, 0));
const totalIngresos = computed(() => trabajosPorTecnico.value.reduce((sum, t) => sum + t.total, 0));
const trabajosPendientes = computed(() => trabajosPorTecnico.value.reduce((sum, t) => sum + t.pendientes, 0));

const cargarDatos = async () => {
  loading.value = true;
  try {
    const taller = await peticionesFetchOffline('getDataAsArray', 'taller') || [];

    const fechaInicioDate = new Date(fechaInicio.value);
    const fechaFinDate = new Date(fechaFin.value);

    const tallerFiltrado = taller.filter(t => {
      const fechaTrabajo = new Date(t.created_at);
      return fechaTrabajo >= fechaInicioDate && fechaTrabajo <= fechaFinDate;
    });

    const trabajosPorTecnicoMap = {};

    tallerFiltrado.forEach(trabajo => {
      const tecnico = trabajo.tecnico || 'Sin Asignar';
      const total = parseFloat(trabajo.total) || 0;
      const estado = trabajo.estado || 'Pendiente';

      if (!trabajosPorTecnicoMap[tecnico]) {
        trabajosPorTecnicoMap[tecnico] = {
          tecnico,
          cantidad: 0,
          total: 0,
          completados: 0,
          pendientes: 0,
          trabajos: []
        };
      }

      trabajosPorTecnicoMap[tecnico].cantidad++;
      trabajosPorTecnicoMap[tecnico].total += total;

      if (estado.toLowerCase().includes('completado') || estado.toLowerCase().includes('entregado')) {
        trabajosPorTecnicoMap[tecnico].completados++;
      } else {
        trabajosPorTecnicoMap[tecnico].pendientes++;
      }

      trabajosPorTecnicoMap[tecnico].trabajos.push(trabajo);
    });

    trabajosPorTecnico.value = Object.values(trabajosPorTecnicoMap).sort((a, b) => b.total - a.total);

    if (tecnicoFilter.value) {
      trabajosPorTecnico.value = trabajosPorTecnico.value.filter(t =>
        t.tecnico.toLowerCase().includes(tecnicoFilter.value.toLowerCase())
      );
    }

    toast.add({
      severity: 'success',
      summary: 'Datos Cargados',
      detail: `Se encontraron ${trabajosPorTecnico.value.length} técnicos`,
      life: 3000
    });

  } catch (error) {
    console.error('Error:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const exportarPDF = () => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('TALLER POR TÉCNICOS', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Período: ${fechaInicio.value} - ${fechaFin.value}`, pageWidth / 2, 30, { align: 'center' });

    const rows = trabajosPorTecnico.value.map(t => [
      t.tecnico,
      t.cantidad.toString(),
      t.completados.toString(),
      t.pendientes.toString(),
      `RD$ ${t.total.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 50,
      head: [['Técnico', 'Total', 'Completados', 'Pendientes', 'Ingresos']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    Swal.fire({
      title: '<strong>Taller por Técnicos</strong>',
      html: `<embed src="${pdfUrl}" type="application/pdf" width="100%" height="600px" />`,
      width: '90%',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: '<i class="pi pi-download"></i> Descargar',
      preConfirm: () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `TallerPorTecnicos_${nfecha('fechaAmericana')}.pdf`;
        link.click();
        return false;
      }
    }).then(() => {
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    });

  } catch (error) {
    console.error('Error:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF', life: 3000 });
  }
};

const exportarExcel = () => {
  try {
    const data = trabajosPorTecnico.value.map(t => ({
      Técnico: t.tecnico,
      'Total Trabajos': t.cantidad,
      Completados: t.completados,
      Pendientes: t.pendientes,
      'Total Ingresos': t.total.toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Taller por Técnicos');
    XLSX.writeFile(wb, `TallerPorTecnicos_${nfecha('fechaAmericana')}.xlsx`);

    toast.add({ severity: 'success', summary: 'Exportado', detail: 'Excel generado exitosamente', life: 3000 });
  } catch (error) {
    console.error('Error:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el Excel', life: 3000 });
  }
};

onMounted(async () => {
  try {
    const datosJSON = await envioElectron('datosarchivo');
    if (!datosEmpresa.empresa.nombre) {
      await datosEmpresa.inicializarDatosEmpresa(datosJSON.VITE_LINKURL + datosJSON.VITE_LINK_API);
    }
    fechaInicio.value = transformarFechaTimestamp(agregarDiasalaFechaActual(-30), false);
    fechaFin.value = nfecha('fechaAmericana');
    await cargarDatos();
  } catch (error) {
    console.error('Error:', error);
  }
});
</script>

<template>
  <main class="content-wrapper bg-gray-50 min-h-screen p-6">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="bg-orange-100 text-orange-700 rounded-full p-3">
            <i class="pi pi-wrench text-2xl"></i>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Taller por Técnicos</h1>
            <p class="text-gray-600">Análisis de desempeño de técnicos</p>
          </div>
        </div>
      </div>

      <Card class="mb-6">
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Fecha Inicio</label>
              <DatePicker v-model="fechaInicio" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Fecha Fin</label>
              <DatePicker v-model="fechaFin" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div>
              <label class="font-semibold text-gray-700 mb-2 block">Filtrar Técnico</label>
              <InputText v-model="tecnicoFilter" placeholder="Buscar técnico..." class="w-full" />
            </div>
            <div class="flex items-end gap-2">
              <Button label="Cargar" icon="pi pi-refresh" @click="cargarDatos" :loading="loading" />
              <Button label="PDF" icon="pi pi-file-pdf" @click="exportarPDF" severity="danger" />
              <Button label="Excel" icon="pi pi-file-excel" @click="exportarExcel" severity="success" />
            </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-dollar text-2xl text-green-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Ingresos</p>
                <p class="text-2xl font-bold text-green-600">RD$ {{ totalIngresos.toFixed(2) }}</p>
              </div>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-briefcase text-2xl text-blue-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Total Trabajos</p>
                <p class="text-2xl font-bold text-blue-600">{{ totalTrabajos }}</p>
              </div>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="pi pi-clock text-2xl text-orange-600"></i>
              </div>
              <div>
                <p class="text-sm text-gray-600">Trabajos Pendientes</p>
                <p class="text-2xl font-bold text-orange-600">{{ trabajosPendientes }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <Card>
        <template #title>Listado de Técnicos</template>
        <template #content>
          <DataTable :value="trabajosPorTecnico" :rows="10" :paginator="trabajosPorTecnico.length > 10" sortField="total" :sortOrder="-1">
            <Column field="tecnico" header="Técnico" sortable>
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <i class="pi pi-user text-orange-600"></i>
                  <span class="font-semibold">{{ data.tecnico }}</span>
                </div>
              </template>
            </Column>
            <Column field="cantidad" header="Total" sortable style="text-align: center">
              <template #body="{ data }">
                <Tag :value="data.cantidad" severity="info" />
              </template>
            </Column>
            <Column field="completados" header="Completados" sortable style="text-align: center">
              <template #body="{ data }">
                <Tag :value="data.completados" severity="success" />
              </template>
            </Column>
            <Column field="pendientes" header="Pendientes" sortable style="text-align: center">
              <template #body="{ data }">
                <Tag :value="data.pendientes" severity="warning" />
              </template>
            </Column>
            <Column field="total" header="Ingresos" sortable style="text-align: right">
              <template #body="{ data }">
                <span class="text-green-600 font-bold">RD$ {{ data.total.toFixed(2) }}</span>
              </template>
            </Column>
            <Column header="Efectividad" style="text-align: center">
              <template #body="{ data }">
                <Tag :value="`${((data.completados / data.cantidad) * 100).toFixed(0)}%`" :severity="data.completados / data.cantidad > 0.8 ? 'success' : 'warning'" />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </main>
  <Toast />
</template>

<style scoped>
.content-wrapper {
  min-height: calc(100vh - 60px);
}
</style>
