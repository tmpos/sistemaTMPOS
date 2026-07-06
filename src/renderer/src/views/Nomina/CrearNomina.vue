<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router';
const router = useRouter();
import {
  nfecha,
  arrayToObjetoFromTabla,
  peticionesFetchOffline,
  envioElectron,
  agregarDiasalaFechaActual,
  generarCodigoUnico,
  encryptarPassword
} from '@/funciones/funciones.js';
import Swal from 'sweetalert2';
import { useDatosEmpresa } from '@/stores';
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';

const toast = useToast();
const datosEmpresa = useDatosEmpresa();

const link = ref('');
const api = ref('');
const token = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
const datosJSON = ref([]);

const empleadosArray = ref([]);
const empleadoSeleccionado = ref(null);
const retencionAfpRate = ref(2.87);
const retencionSfsRate = ref(3.04);

const datoscamposNomina = ref({});

const basic = ref({ dateFormat: 'd/m/Y' });

const estadosDisponibles = ['ACTIVA', 'PAGADA', 'CANCELADA'];
const tiposNomina = ['SEMANAL', 'QUINCENAL', 'MENSUAL', 'QUINCENA_15_30'];

const empleadosActivos = computed(() =>
  (empleadosArray.value || []).filter((empleado) => {
    const estado = `${empleado?.estado || ''}`.toUpperCase();
    return !estado || estado === 'ACTIVO';
  })
);

const inicializarCampos = async () => {
  const campos = await arrayToObjetoFromTabla('nomina');
  datoscamposNomina.value = campos;
  datoscamposNomina.value.no_nomina = generarCodigoUnico();
  datoscamposNomina.value.fecha_inicio = nfecha('fecha');
  datoscamposNomina.value.fecha_final = agregarDiasalaFechaActual(15);
  datoscamposNomina.value.estado = 'ACTIVA';
  datoscamposNomina.value.sueldo = '0.00';
  datoscamposNomina.value.total_deducciones = '0.00';
  datoscamposNomina.value.total_neto_pagar = '0.00';
  datoscamposNomina.value.nomina = [];
  datoscamposNomina.value.almacen = datosEmpresa.empresa.nombre;
  datoscamposNomina.value.cedula = '';
  datoscamposNomina.value.nombre = '';
  datoscamposNomina.value.tipo_nomina = 'SEMANAL';
  datoscamposNomina.value.cargo = '';
  empleadoSeleccionado.value = null;
};

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

watch([() => datoscamposNomina.value.tipo_nomina, () => datoscamposNomina.value.fecha_inicio], () => {
  if (datoscamposNomina.value.fecha_inicio) {
    datoscamposNomina.value.fecha_final = calcularFechaFinalNomina(datoscamposNomina.value.fecha_inicio, datoscamposNomina.value.tipo_nomina);
  }
});

const colorTipo = (tipo) => {
  const colores = { SEMANAL: '#3b82f6', QUINCENAL: '#f59e0b', MENSUAL: '#10b981', QUINCENA_15_30: '#8b5cf6' };
  return colores[tipo] || '#64748b';
};

const datosConfig = async () => {
  const response = await envioElectron('datosarchivo');
  datosJSON.value = response;
  link.value = datosJSON.value.VITE_LINKURL;
  api.value = datosJSON.value.VITE_LINK_API;
  token.value = datosJSON.value.VITE_TOKEN;
  tokenCorto.value = datosJSON.value.VITE_TOKEN_CORTO;
};

const fetchEmpleados = async () => {
  const response = await peticionesFetchOffline('getDataAsArray', 'empleados');
  empleadosArray.value = response.reverse();
};

onMounted(async () => {
  await datosConfig();
  tokenCifrado.value = await encryptarPassword(token.value, 10);
  await fetchEmpleados();
  await inicializarCampos();
});

const seleccionarEmpleado = (empleado) => {
  if (!empleado) {
    datoscamposNomina.value.cedula = '';
    datoscamposNomina.value.nombre = '';
    datoscamposNomina.value.cargo = '';
    datoscamposNomina.value.sueldo = '0.00';
    recalcularTotales();
    return;
  }

  datoscamposNomina.value.cedula = empleado.cedula || '';
  datoscamposNomina.value.nombre = empleado.nombre || '';
  datoscamposNomina.value.cargo = empleado.cargo || '';
  datoscamposNomina.value.sueldo = empleado.sueldo_base || empleado.sueldo || '0.00';
  retencionAfpRate.value = parseFloat(empleado.retencion_afp) || 2.87;
  retencionSfsRate.value = parseFloat(empleado.retencion_sfs) || 3.04;
  recalcularTotales();
};

const recalcularTotales = () => {
  const sumIngresos = datoscamposNomina.value.nomina.reduce(
    (sum, n) => sum + parseFloat(n.total_ingresos || 0),
    0
  );

  const sumDeducciones = datoscamposNomina.value.nomina.reduce(
    (sum, n) => sum + parseFloat(n.total_deducciones || 0),
    0
  );

  const sueldoBase = parseFloat(datoscamposNomina.value.sueldo || 0);

  datoscamposNomina.value.total_deducciones = sumDeducciones.toFixed(2);

  datoscamposNomina.value.total_neto_pagar = (
    sueldoBase + sumIngresos - sumDeducciones
  ).toFixed(2);
};

const retencionCalcAFP = computed(() => {
  const s = parseFloat(datoscamposNomina.value.sueldo || 0);
  return s * retencionAfpRate.value / 100;
});
const retencionCalcSFS = computed(() => {
  const s = parseFloat(datoscamposNomina.value.sueldo || 0);
  return s * retencionSfsRate.value / 100;
});

const calcularRetencionesLegales = () => {
  const sueldo = parseFloat(datoscamposNomina.value.sueldo || 0);
  if (sueldo <= 0) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'El empleado debe tener un sueldo base mayor a 0.', life: 3000 });
    return;
  }
  const afp = sueldo * retencionAfpRate.value / 100;
  const sfs = sueldo * retencionSfsRate.value / 100;
  const nuevo = {
    comision: 0, hora_extra: 0, ingreso_sdss: 0,
    sf_salud: parseFloat(sfs.toFixed(2)),
    svejez_discap: parseFloat(afp.toFixed(2)),
    desc_percapita: 0, base_isr: 0, imp_sobre_renta: 0, prestamos: 0,
    descripcion: 'RETENCIONES LEGALES',
    total_ingresos: '0.00',
    total_deducciones: (afp + sfs).toFixed(2),
    total_neto: (-afp - sfs).toFixed(2)
  };
  const idx = datoscamposNomina.value.nomina.findIndex(r => r.descripcion === 'RETENCIONES LEGALES');
  if (idx >= 0) datoscamposNomina.value.nomina[idx] = nuevo;
  else datoscamposNomina.value.nomina.push(nuevo);
  recalcularTotales();
  toast.add({ severity: 'success', summary: 'Retenciones calculadas', detail: `AFP: ${retencionAfpRate.value}% (RD$ ${afp.toFixed(2)}) | SFS: ${retencionSfsRate.value}% (RD$ ${sfs.toFixed(2)})`, life: 4000 });
};

async function enviarDatos(event) {
  event.preventDefault();
  if (!datoscamposNomina.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Datos incompletos, no se puede enviar.', life: 3000 });
    return;
  }
  if (datoscamposNomina.value.hasOwnProperty('created_at')) {
    datoscamposNomina.value.created_at = nfecha('timestamp');
    datoscamposNomina.value.updated_at = nfecha('timestamp');
  }

  const datosEnviar = JSON.parse(JSON.stringify({
    ...datoscamposNomina.value,
    nombre: datoscamposNomina.value.nombre?.nombre || datoscamposNomina.value.nombre || '',
    cargo: datoscamposNomina.value.cargo?.nombre || datoscamposNomina.value.cargo || '',
    nomina: JSON.stringify(datoscamposNomina.value.nomina)
  }));
  const envioDatos = await peticionesFetchOffline('insertData', 'nomina', JSON.stringify(datosEnviar));
  if (envioDatos[0] == 'ok') {
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos agregados con éxito.', life: 3000 });

    Swal.fire({
      title: "Datos agregados",
      text: "¿Qué hacemos ahora?",
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "Agregar otro",
      cancelButtonText: "Volver a listado"
    }).then(async (result) => {
      if (result.isConfirmed) {
        await inicializarCampos();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        router.push({ path: `/nomina` });
      }
    });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Fallo al agregar los datos.', life: 3000 });
  }
}

const fnEliminarDeNomina = async (index) => {
  const result = await Swal.fire({
    title: '¿Eliminar registro?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  datoscamposNomina.value.nomina.splice(index, 1);
  recalcularTotales();

  toast.add({
    severity: 'success',
    summary: 'Eliminado',
    detail: `Registro #${index + 1} eliminado correctamente.`,
    life: 2500
  });
};

const fnAgregarNomina = async () => {
  const { value: formValues } = await Swal.fire({
    title: "Agregar registro de nómina",
    html: `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;text-align:left;">
        
        <div>
          <label>Comisión (RD$)</label>
          <input id="swal-comision" type="number" class="swal2-input" value="0.00">
        </div>

        <div>
          <label>Horas extra (RD$)</label>
          <input id="swal-horaextra" type="number" class="swal2-input" value="0.00">
        </div>

        <div>
          <label>Ingreso SDSS (RD$)</label>
          <input id="swal-sdss" type="number" class="swal2-input" value="0.00">
        </div>

        <div>
          <label>Seguro de salud (RD$)</label>
          <input id="swal-salud" type="number" class="swal2-input" value="0.00">
        </div>

        <div>
          <label>Seguro vejez/discap. (RD$)</label>
          <input id="swal-vejez" type="number" class="swal2-input" value="0.00">
        </div>

        <div>
          <label>Desc. per cápita (RD$)</label>
          <input id="swal-desc" type="number" class="swal2-input" value="0.00">
        </div>

        <div>
          <label>Base ISR (RD$)</label>
          <input id="swal-baseisr" type="number" class="swal2-input" value="0.00">
        </div>

        <div>
          <label>Imp. sobre renta (RD$)</label>
          <input id="swal-isr" type="number" class="swal2-input" value="0.00">
        </div>

        <div>
          <label>Préstamos (RD$)</label>
          <input id="swal-prestamos" type="number" class="swal2-input" value="0.00">
        </div>

      </div>
    `,
    width: "700px",
    confirmButtonText: "Agregar",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const getValue = id => parseFloat(document.getElementById(id).value) || 0;
      return {
        comision: getValue("swal-comision"),
        hora_extra: getValue("swal-horaextra"),
        ingreso_sdss: getValue("swal-sdss"),
        sf_salud: getValue("swal-salud"),
        svejez_discap: getValue("swal-vejez"),
        desc_percapita: getValue("swal-desc"),
        base_isr: getValue("swal-baseisr"),
        imp_sobre_renta: getValue("swal-isr"),
        prestamos: getValue("swal-prestamos"),
      };
    }
  });

  if (!formValues) return;

  // 🟢 Cálculos automáticos
  const totalIngresos =
    formValues.comision +
    formValues.hora_extra +
    formValues.ingreso_sdss;

  const totalDeducciones =
    formValues.sf_salud +
    formValues.svejez_discap +
    formValues.desc_percapita +
    formValues.base_isr +
    formValues.imp_sobre_renta +
    formValues.prestamos;

  const totalNeto = totalIngresos - totalDeducciones;

  // 🧾 Crear registro para la tabla
  const nuevoRegistro = {
    ...formValues,
    total_ingresos: totalIngresos.toFixed(2),
    total_deducciones: totalDeducciones.toFixed(2),
    total_neto: totalNeto.toFixed(2),
  };

  // Agregar al array principal
  datoscamposNomina.value.nomina.push(nuevoRegistro);

  // 🔄 Recalcular totales generales
  const sumIngresos = datoscamposNomina.value.nomina.reduce(
    (sum, n) => sum + parseFloat(n.total_ingresos || 0),
    0
  );

  const sumDeducciones = datoscamposNomina.value.nomina.reduce(
    (sum, n) => sum + parseFloat(n.total_deducciones || 0),
    0
  );

  const sueldoBase = parseFloat(datoscamposNomina.value.sueldo || 0);

  datoscamposNomina.value.total_deducciones = (
    sumDeducciones
  ).toFixed(2);

  datoscamposNomina.value.total_neto_pagar = (
    sueldoBase + sumIngresos - sumDeducciones
  ).toFixed(2);

  toast.add({
    severity: "success",
    summary: "Agregado",
    detail: "Registro agregado correctamente.",
    life: 3500,
  });
};

</script>

<template>
  <main class="nomina-wrapper">
    <div class="w-full px-4 py-6 space-y-6">
      <section class="nomina-hero shadow-lg">
        <div class="nomina-hero__text">
          <p class="eyebrow">Nómina</p>
          <h1>Crear nómina</h1>
          <p>Define el periodo, agrega empleados y calcula ingresos/deducciones antes de guardar.</p>
          <div class="nomina-hero__meta">
            <span class="meta-pill">
              <i class="pi pi-hashtag"></i>
              No. {{ datoscamposNomina.no_nomina }}
            </span>
            <span class="meta-pill">
              <i class="pi pi-calendar"></i>
              Inicio: {{ datoscamposNomina.fecha_inicio }}
            </span>
            <span v-if="datoscamposNomina.tipo_nomina" class="meta-pill" :style="{ background: colorTipo(datoscamposNomina.tipo_nomina) + '22', borderColor: colorTipo(datoscamposNomina.tipo_nomina) + '44' }">
              <i class="pi pi-tag"></i>
              {{ datoscamposNomina.tipo_nomina }}
            </span>
        </div>
        <div class="nomina-hero__stats">
          <div class="stat-card">
            <span class="label">Registros</span>
            <span class="value">{{ datoscamposNomina.nomina?.length || 0 }}</span>
          </div>
          <div class="stat-card alt">
            <span class="label">Neto a pagar</span>
            <span class="value">{{ datoscamposNomina.total_neto_pagar }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Deducciones</span>
            <span class="value">{{ datoscamposNomina.total_deducciones }}</span>
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Datos principales</p>
            <h2>Configura la nómina</h2>
            <span class="helper-text">Completa los campos requeridos y luego agrega registros.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-save" label="Guardar nómina" severity="primary" @click="enviarDatos" />
            <router-link to="/nomina">
              <Button icon="pi pi-arrow-left" label="Volver al listado" severity="secondary" outlined />
            </router-link>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>No nómina</label>
            <InputText v-model="datoscamposNomina.no_nomina" readonly />
          </div>
          <div class="field">
            <label>Fecha inicio</label>
            <flat-pickr
              v-model="datoscamposNomina.fecha_inicio"
              class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid"
              :config="basic"
            />
          </div>
          <div class="field">
            <label>Fecha final</label>
            <flat-pickr
              v-model="datoscamposNomina.fecha_final"
              class="form-input w-full p-inputtext p-component p-filled p-inputtext-fluid"
              :config="basic"
            />
          </div>
          <div class="field">
            <label>Tipo de Nómina</label>
            <SelectButton v-model="datoscamposNomina.tipo_nomina" :options="tiposNomina" fluid :allowEmpty="false" />
          </div>
          <div class="field">
            <label>Estado</label>
            <Dropdown v-model="datoscamposNomina.estado" :options="estadosDisponibles" />
          </div>
          <div class="field field--wide">
            <label>Empleado</label>
            <Dropdown
              v-model="empleadoSeleccionado"
              :options="empleadosActivos"
              optionLabel="nombre"
              filter
              showClear
              fluid
              placeholder="Seleccione un empleado"
              @update:modelValue="seleccionarEmpleado"
            >
              <template #value="{ value, placeholder }">
                <div v-if="value" class="employee-option">
                  <span class="employee-option__name">{{ value.nombre }}</span>
                  <small>{{ value.codigo_empleado || 'Sin codigo' }} | {{ value.cargo || 'Sin cargo' }}</small>
                </div>
                <span v-else>{{ placeholder }}</span>
              </template>
              <template #option="{ option }">
                <div class="employee-option">
                  <span class="employee-option__name">{{ option.nombre }}</span>
                  <small>{{ option.codigo_empleado || 'Sin codigo' }} | {{ option.cargo || 'Sin cargo' }}</small>
                </div>
              </template>
            </Dropdown>
          </div>
          <div class="field">
            <label>Cedula</label>
            <InputText v-model="datoscamposNomina.cedula" readonly placeholder="Cedula del empleado" />
          </div>
          <div class="field">
            <label>Cargo</label>
            <InputText v-model="datoscamposNomina.cargo" readonly placeholder="Cargo asignado" />
          </div>
          <div class="field">
            <label>Sueldo base</label>
            <InputText v-model="datoscamposNomina.sueldo" placeholder="0.00" />
          </div>
          <div class="field">
            <label>Deducciones</label>
            <InputText v-model="datoscamposNomina.total_deducciones" readonly />
          </div>
          <div class="field">
            <label>Neto a pagar</label>
            <InputText v-model="datoscamposNomina.total_neto_pagar" readonly />
          </div>
        </div>

        <div v-if="empleadoSeleccionado" class="employee-summary">
          <div class="employee-summary__item">
            <span class="summary-label">Departamento</span>
            <strong>{{ empleadoSeleccionado.departamento || 'No definido' }}</strong>
          </div>
          <div class="employee-summary__item">
            <span class="summary-label">Tipo de pago</span>
            <strong>{{ empleadoSeleccionado.tipo_pago || 'No definido' }}</strong>
          </div>
          <div class="employee-summary__item">
            <span class="summary-label">Banco</span>
            <strong>{{ empleadoSeleccionado.banco || 'No definido' }}</strong>
          </div>
          <div class="employee-summary__item">
            <span class="summary-label">Cuenta</span>
            <strong>{{ empleadoSeleccionado.no_cuenta || 'No definida' }}</strong>
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Retenciones Legales</p>
            <h2>AFP y SFS</h2>
            <span class="helper-text">Cálculo basado en las tasas configuradas del empleado.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-calculator" label="Calcular Retenciones" severity="info" outlined @click="calcularRetencionesLegales" :disabled="!empleadoSeleccionado" />
          </div>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide">Sueldo Base</p>
              <p class="text-xl font-bold text-blue-700">RD$ {{ parseFloat(datoscamposNomina.sueldo || 0).toFixed(2) }}</p>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide">AFP ({{ retencionAfpRate }}%)</p>
              <p class="text-xl font-bold text-purple-700">RD$ {{ retencionCalcAFP.toFixed(2) }}</p>
            </div>
            <div class="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide">SFS ({{ retencionSfsRate }}%)</p>
              <p class="text-xl font-bold text-teal-700">RD$ {{ retencionCalcSFS.toFixed(2) }}</p>
            </div>
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p class="text-xs text-gray-500 uppercase tracking-wide">Total Retenciones</p>
              <p class="text-xl font-bold text-orange-700">RD$ {{ (retencionCalcAFP + retencionCalcSFS).toFixed(2) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="panel shadow-md">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Registros de nómina</p>
            <h2>Agregar ingresos/deducciones</h2>
            <span class="helper-text">Registra comisiones, otros ingresos o deducciones adicionales.</span>
          </div>
          <div class="actions-grid">
            <Button icon="pi pi-plus" label="Agregar registro" severity="success" outlined @click="fnAgregarNomina" />
          </div>
        </div>

        <div class="panel__body">
          <DataTable
            class="nomina-table"
            :value="datoscamposNomina.nomina"
            :rows="5"
            scrollable
            scrollHeight="300px"
            dataKey="id"
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
            <Column header="Acciones" style="width: 6rem">
              <template #body="{ index }">
                <Button icon="pi pi-trash" text severity="danger" @click="fnEliminarDeNomina(index)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </section>

      <Toast />
    </div>
  </main>
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 640px;
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

.field--wide {
  grid-column: span 2;
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

.employee-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.employee-option__name {
  font-weight: 700;
  color: #0f172a;
}

.employee-option small {
  color: #64748b;
}

.employee-summary {
  margin-top: 18px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #dbeafe;
  background: linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.employee-summary__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
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

  .field--wide {
    grid-column: span 1;
  }
}
</style>
