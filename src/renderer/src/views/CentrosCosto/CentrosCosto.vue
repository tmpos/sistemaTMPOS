<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { crearTablaSiNoExisteOffline, peticionesFetchOffline } from '../../funciones/funciones.js'
import { useDatosEmpresa } from '../../stores'
import { construirComparativo, filtrarComparativo, resumirComparativo, validarCentro, validarPresupuesto } from './centrosCostoCore.js'

const toast = useToast()
const datosEmpresa = useDatosEmpresa()
const cargando = ref(false)
const guardando = ref(false)
const centros = ref([])
const presupuestos = ref([])
const asientos = ref([])
const cuentas = ref([])
const vista = ref('comparativo')
const tipoPeriodo = ref('MENSUAL')
const periodoMensual = ref(new Date().toISOString().slice(0, 7))
const periodoAnual = ref(String(new Date().getFullYear()))
const filtroCentro = ref('')
const filtroEstado = ref('')
const buscar = ref('')
const mostrarCentro = ref(false)
const mostrarPresupuesto = ref(false)
const mostrarDetalle = ref(false)
const detalle = ref(null)
const centroForm = ref({ codigo: '', nombre: '', tipo: 'DEPARTAMENTO', sucursal: '', responsable: '', descripcion: '', estado: 'ACTIVO' })
const presupuestoForm = ref({ centro_costo_id: '', centro_codigo: '', tipo_periodo: 'MENSUAL', periodo: '', cuenta: '', categoria: '', monto: null, nota: '' })

const camposCentro = ['codigo', 'nombre', 'tipo', 'sucursal', 'responsable', 'descripcion', 'estado']
const camposPresupuesto = ['centro_costo_id', 'centro_codigo', 'tipo_periodo', 'periodo', 'cuenta', 'categoria', 'monto', 'nota', 'usuario']
const periodoActivo = computed(() => tipoPeriodo.value === 'ANUAL' ? periodoAnual.value : periodoMensual.value)
const centrosActivos = computed(() => centros.value.filter((item) => String(item.estado || 'ACTIVO').toUpperCase() === 'ACTIVO'))
const opcionesCentro = computed(() => centrosActivos.value.map((item) => ({ label: `${item.codigo} · ${item.nombre}`, value: item.id || item.codigo })))
const opcionesCuenta = computed(() => cuentas.value.map((item) => item.nombre).filter(Boolean).sort())
const comparativo = computed(() => construirComparativo({ presupuestos: presupuestos.value, asientos: asientos.value, centros: centros.value, tipoPeriodo: tipoPeriodo.value, periodo: periodoActivo.value }))
const filtrado = computed(() => filtrarComparativo(comparativo.value, { centro: filtroCentro.value, estado: filtroEstado.value, buscar: buscar.value }))
const resumen = computed(() => resumirComparativo(filtrado.value))
const usuarioActual = computed(() => datosEmpresa.usuario?.nombre || datosEmpresa.usuario?.usuario || 'Sistema')
const moneda = (valor) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(valor) || 0)
const numero = (valor) => new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(Number(valor) || 0)
const fecha = (valor) => valor ? new Intl.DateTimeFormat('es-DO').format(new Date(valor)) : '—'

const leerTabla = async (tabla) => {
  try { const datos = await peticionesFetchOffline('getDataAsArray', tabla, ''); return Array.isArray(datos) ? datos : [] }
  catch (error) { console.warn(`[Centros de costo] No se pudo leer ${tabla}`, error); return [] }
}
const cargar = async () => {
  cargando.value = true
  try {
    await crearTablaSiNoExisteOffline('centros_costo', camposCentro, toast)
    await crearTablaSiNoExisteOffline('presupuestos_centro_costo', camposPresupuesto, toast)
    ;[centros.value, presupuestos.value, asientos.value, cuentas.value] = await Promise.all([
      leerTabla('centros_costo'), leerTabla('presupuestos_centro_costo'), leerTabla('asientodiario'), leerTabla('cuentas')
    ])
  } catch (error) { toast.add({ severity: 'error', summary: 'Error al cargar', detail: error.message, life: 4500 }) }
  finally { cargando.value = false }
}

const nuevoCentro = () => {
  centroForm.value = { codigo: `CC-${String(centros.value.length + 1).padStart(3, '0')}`, nombre: '', tipo: 'DEPARTAMENTO', sucursal: datosEmpresa.empresa?.nombre || '', responsable: '', descripcion: '', estado: 'ACTIVO' }
  mostrarCentro.value = true
}
const nuevoPresupuesto = () => {
  presupuestoForm.value = { centro_costo_id: filtroCentro.value || '', centro_codigo: '', tipo_periodo: tipoPeriodo.value, periodo: periodoActivo.value, cuenta: '', categoria: '', monto: null, nota: '', usuario: usuarioActual.value }
  mostrarPresupuesto.value = true
}
const guardarCentro = async () => {
  const validacion = validarCentro(centroForm.value, centros.value)
  if (!validacion.valido) return toast.add({ severity: 'warn', summary: 'Revise el centro', detail: validacion.errores.join(' '), life: 4500 })
  guardando.value = true
  try {
    await peticionesFetchOffline(centroForm.value.id ? 'updateData' : 'insertData', 'centros_costo', JSON.stringify(centroForm.value))
    mostrarCentro.value = false; await cargar()
    toast.add({ severity: 'success', summary: 'Centro guardado', life: 3000 })
  } catch (error) { toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: error.message, life: 4500 }) }
  finally { guardando.value = false }
}
const guardarPresupuesto = async () => {
  const centro = centros.value.find((item) => String(item.id || item.codigo) === String(presupuestoForm.value.centro_costo_id))
  presupuestoForm.value.centro_codigo = centro?.codigo || ''
  const validacion = validarPresupuesto(presupuestoForm.value)
  if (!validacion.valido) return toast.add({ severity: 'warn', summary: 'Revise el presupuesto', detail: validacion.errores.join(' '), life: 4500 })
  guardando.value = true
  try {
    await peticionesFetchOffline('insertData', 'presupuestos_centro_costo', JSON.stringify(presupuestoForm.value))
    mostrarPresupuesto.value = false; await cargar()
    toast.add({ severity: 'success', summary: 'Presupuesto registrado', life: 3000 })
  } catch (error) { toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: error.message, life: 4500 }) }
  finally { guardando.value = false }
}
const editarCentro = (centro) => { centroForm.value = { ...centro }; mostrarCentro.value = true }
const abrirDetalle = (fila) => { detalle.value = fila; mostrarDetalle.value = true }
onMounted(cargar)
</script>

<template>
  <main class="cost-page">
    <Toast />
    <section class="header"><div><span class="eyebrow">CONTABILIDAD GERENCIAL</span><h1>Centros de costo y presupuestos</h1><p>Compara el presupuesto de cada sucursal, departamento o proyecto contra su ejecución contable real.</p></div><div class="header-actions"><Button label="Nuevo centro" icon="pi pi-building" outlined @click="nuevoCentro" /><Button label="Nuevo presupuesto" icon="pi pi-wallet" @click="nuevoPresupuesto" /><Button icon="pi pi-refresh" outlined :loading="cargando" @click="cargar" /></div></section>
    <nav class="view-tabs"><Button label="Presupuesto vs. real" icon="pi pi-chart-bar" :outlined="vista !== 'comparativo'" @click="vista='comparativo'" /><Button label="Centros de costo" icon="pi pi-sitemap" :outlined="vista !== 'centros'" @click="vista='centros'" /></nav>

    <template v-if="vista === 'comparativo'">
      <section class="filters"><SelectButton v-model="tipoPeriodo" :options="[{label:'Mensual',value:'MENSUAL'},{label:'Anual',value:'ANUAL'}]" optionLabel="label" optionValue="value" :allowEmpty="false" /><InputText v-if="tipoPeriodo==='MENSUAL'" v-model="periodoMensual" type="month" /><InputNumber v-else v-model="periodoAnual" :useGrouping="false" :min="2000" :max="2200" /><Dropdown v-model="filtroCentro" :options="opcionesCentro" optionLabel="label" optionValue="value" placeholder="Todos los centros" filter showClear /><Dropdown v-model="filtroEstado" :options="[{label:'Con sobreejecución',value:'SOBREEJECUTADO'},{label:'Dentro del presupuesto',value:'DENTRO'}]" optionLabel="label" optionValue="value" placeholder="Todos los estados" showClear /><IconField><InputIcon class="pi pi-search" /><InputText v-model="buscar" placeholder="Cuenta, categoría o centro..." /></IconField></section>
      <section class="summary"><article><span>Presupuesto</span><strong>{{ moneda(resumen.presupuesto) }}</strong></article><article><span>Ejecución real</span><strong>{{ moneda(resumen.real) }}</strong><small>{{ numero(resumen.porcentaje) }}% consumido</small></article><article :class="{negative:resumen.variacion<0}"><span>Disponible / variación</span><strong>{{ moneda(resumen.variacion) }}</strong></article><article :class="{alert:resumen.alertas}"><span>Alertas</span><strong>{{ resumen.alertas }}</strong><small>de {{ resumen.partidas }} partidas</small></article></section>
      <Message v-if="resumen.alertas" severity="warn" :closable="false"><strong>{{ resumen.alertas }} partida(s) excedieron el presupuesto.</strong> Revise las filas marcadas antes de aprobar nuevos gastos.</Message>
      <section class="table-card"><DataTable :value="filtrado" :loading="cargando" paginator :rows="15" stripedRows dataKey="idsPresupuesto" responsiveLayout="scroll"><template #empty><div class="empty"><i class="pi pi-chart-bar" /><strong>Sin presupuestos para este período</strong><span>Cree una partida presupuestaria para comenzar la comparación.</span></div></template><Column field="centroNombre" header="Centro" sortable><template #body="{data}"><strong>{{ data.centroNombre || data.centroCodigo }}</strong><small class="block">{{ data.centroCodigo }}</small></template></Column><Column header="Cuenta / categoría" sortable sortField="cuenta"><template #body="{data}"><strong>{{ data.cuenta || data.categoria }}</strong><small class="block">{{ data.cuenta ? 'Cuenta contable' : 'Categoría' }}</small></template></Column><Column field="presupuesto" header="Presupuesto" sortable><template #body="{data}">{{ moneda(data.presupuesto) }}</template></Column><Column field="real" header="Real" sortable><template #body="{data}"><strong>{{ moneda(data.real) }}</strong></template></Column><Column field="variacion" header="Variación" sortable><template #body="{data}"><span :class="data.variacion < 0 ? 'over' : 'available'">{{ moneda(data.variacion) }}</span></template></Column><Column field="porcentaje" header="Ejecución" sortable style="min-width:190px"><template #body="{data}"><div class="progress-label"><span>{{ numero(data.porcentaje) }}%</span><Tag :value="data.sobreejecutado ? 'Excedido' : 'En presupuesto'" :severity="data.sobreejecutado ? 'danger' : 'success'" /></div><ProgressBar :value="Math.min(Math.max(data.porcentaje,0),100)" :showValue="false" :class="{overrun:data.sobreejecutado}" /></template></Column><Column header="Detalle"><template #body="{data}"><Button icon="pi pi-eye" rounded text @click="abrirDetalle(data)" /></template></Column></DataTable></section>
    </template>

    <section v-else class="table-card"><DataTable :value="centros" :loading="cargando" paginator :rows="15" stripedRows><template #empty><div class="empty">No hay centros de costo registrados.</div></template><Column field="codigo" header="Código" sortable /><Column field="nombre" header="Nombre" sortable /><Column field="tipo" header="Tipo" sortable><template #body="{data}"><Tag :value="data.tipo" /></template></Column><Column field="sucursal" header="Sucursal" sortable /><Column field="responsable" header="Responsable" /><Column field="estado" header="Estado"><template #body="{data}"><Tag :value="data.estado || 'ACTIVO'" :severity="data.estado === 'INACTIVO' ? 'secondary' : 'success'" /></template></Column><Column header=""><template #body="{data}"><Button icon="pi pi-pencil" rounded text @click="editarCentro(data)" /></template></Column></DataTable></section>

    <Dialog v-model:visible="mostrarCentro" modal :header="centroForm.id ? 'Editar centro de costo' : 'Nuevo centro de costo'" :style="{width:'min(650px,95vw)'}"><div class="form-grid"><label>Código<InputText v-model="centroForm.codigo" /></label><label>Nombre<InputText v-model="centroForm.nombre" /></label><label>Tipo<Dropdown v-model="centroForm.tipo" :options="['SUCURSAL','DEPARTAMENTO','PROYECTO']" /></label><label>Sucursal<InputText v-model="centroForm.sucursal" /></label><label>Responsable<InputText v-model="centroForm.responsable" /></label><label>Estado<Dropdown v-model="centroForm.estado" :options="['ACTIVO','INACTIVO']" /></label><label class="wide">Descripción<Textarea v-model="centroForm.descripcion" rows="3" autoResize /></label></div><template #footer><Button label="Cancelar" text severity="secondary" @click="mostrarCentro=false" /><Button label="Guardar centro" icon="pi pi-save" :loading="guardando" @click="guardarCentro" /></template></Dialog>
    <Dialog v-model:visible="mostrarPresupuesto" modal header="Nueva partida presupuestaria" :style="{width:'min(650px,95vw)'}"><div class="form-grid"><label class="wide">Centro de costo<Dropdown v-model="presupuestoForm.centro_costo_id" :options="opcionesCentro" optionLabel="label" optionValue="value" filter /></label><label>Tipo de período<Dropdown v-model="presupuestoForm.tipo_periodo" :options="['MENSUAL','ANUAL']" @change="presupuestoForm.periodo = presupuestoForm.tipo_periodo === tipoPeriodo ? periodoActivo : ''" /></label><label>Período<InputText v-model="presupuestoForm.periodo" :type="presupuestoForm.tipo_periodo==='MENSUAL' ? 'month' : 'number'" /></label><label>Cuenta contable<Dropdown v-model="presupuestoForm.cuenta" :options="opcionesCuenta" filter showClear placeholder="Opcional si usa categoría" /></label><label>Categoría<InputText v-model="presupuestoForm.categoria" placeholder="Ej. Mercadeo, Operaciones" /></label><label>Monto<InputNumber v-model="presupuestoForm.monto" mode="currency" currency="DOP" locale="es-DO" :min="0" /></label><label class="wide">Nota<Textarea v-model="presupuestoForm.nota" rows="2" /></label></div><template #footer><Button label="Cancelar" text severity="secondary" @click="mostrarPresupuesto=false" /><Button label="Guardar presupuesto" icon="pi pi-save" :loading="guardando" @click="guardarPresupuesto" /></template></Dialog>
    <Dialog v-model:visible="mostrarDetalle" modal header="Ejecución contable de la partida" :style="{width:'min(900px,96vw)'}"><div v-if="detalle" class="detail-head"><div><small>Centro</small><strong>{{ detalle.centroNombre }}</strong></div><div><small>Partida</small><strong>{{ detalle.cuenta || detalle.categoria }}</strong></div><div><small>Presupuesto</small><strong>{{ moneda(detalle.presupuesto) }}</strong></div><div><small>Real</small><strong>{{ moneda(detalle.real) }}</strong></div></div><DataTable v-if="detalle" :value="detalle.movimientos" paginator :rows="10" size="small"><template #empty>La partida no tiene movimientos contables asociados.</template><Column field="fechaTexto" header="Fecha"><template #body="{data}">{{ fecha(data.fecha) }}</template></Column><Column field="numero" header="Asiento" /><Column field="cuenta" header="Cuenta" /><Column field="descripcion" header="Descripción" /><Column field="usuario" header="Usuario" /><Column field="real" header="Importe"><template #body="{data}">{{ moneda(data.real) }}</template></Column></DataTable><template #footer><Button label="Cerrar" severity="secondary" @click="mostrarDetalle=false" /></template></Dialog>
  </main>
</template>

<style scoped>
.cost-page{padding:1.6rem;min-height:100vh;background:#f5f7fb;color:#29364d}.header{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.eyebrow{font-size:.74rem;font-weight:800;letter-spacing:.08em;color:#4f46e5}.header h1{font-size:1.8rem;margin:.25rem 0}.header p{margin:0;color:#6d798e}.header-actions,.view-tabs{display:flex;gap:.55rem;flex-wrap:wrap}.view-tabs{margin:1.2rem 0}.filters{display:grid;grid-template-columns:auto 150px minmax(210px,1fr) minmax(210px,1fr) minmax(230px,1.3fr);gap:.7rem;background:white;border:1px solid #e5e9f1;border-radius:13px;padding:1rem}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:.8rem;margin:1rem 0}.summary article{background:white;border:1px solid #e5e9f1;border-radius:12px;padding:1rem}.summary span,.summary small{display:block;color:#748197;font-size:.78rem}.summary strong{font-size:1.28rem;display:block;margin:.25rem 0}.summary .negative strong,.summary .alert strong,.over{color:#dc2626;font-weight:800}.available{color:#059669;font-weight:700}.table-card{background:white;border:1px solid #e5e9f1;border-radius:14px;padding:.4rem;margin-top:1rem;overflow:hidden;box-shadow:0 4px 14px rgba(30,41,59,.05)}.block{display:block;color:#78859a;margin-top:.2rem}.progress-label{display:flex;align-items:center;justify-content:space-between;margin-bottom:.35rem}.progress-label>span{font-weight:800}.overrun :deep(.p-progressbar-value){background:#dc2626}.empty{padding:3rem;display:grid;gap:.4rem;justify-items:center;color:#748197}.empty i{font-size:2rem}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.form-grid label{display:grid;gap:.4rem;font-size:.8rem;font-weight:700;color:#536179}.form-grid .wide{grid-column:1/-1}.detail-head{display:grid;grid-template-columns:repeat(4,1fr);gap:.7rem;margin-bottom:1rem}.detail-head>div{padding:.8rem;background:#f8fafc;border-radius:9px}.detail-head small,.detail-head strong{display:block}.detail-head small{color:#748197}.detail-head strong{margin-top:.25rem}@media(max-width:1100px){.filters{grid-template-columns:repeat(2,1fr)}.summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.cost-page{padding:.8rem}.header{flex-direction:column}.filters,.summary,.form-grid,.detail-head{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}}
</style>
