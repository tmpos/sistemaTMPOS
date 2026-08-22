<template>
  <main class="approval-page">
    <header class="page-header">
      <div><span class="eyebrow">CONTROL INTERNO</span><h1>Centro de aprobaciones</h1><p>Revisa operaciones sensibles antes de que afecten el sistema.</p></div>
      <div class="header-actions"><Button label="Actualizar" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="cargar" /><Button label="Nueva solicitud" icon="pi pi-plus" @click="abrirNueva" /></div>
    </header>

    <section class="stats">
      <article><i class="pi pi-inbox blue"></i><div><span>Total solicitudes</span><strong>{{ resumen.total }}</strong></div></article>
      <article><i class="pi pi-clock orange"></i><div><span>Pendientes</span><strong>{{ resumen.pendiente }}</strong></div></article>
      <article><i class="pi pi-check-circle green"></i><div><span>Aprobadas</span><strong>{{ resumen.aprobada }}</strong></div></article>
      <article><i class="pi pi-wallet purple"></i><div><span>Monto pendiente</span><strong>{{ moneda(resumen.montoPendiente) }}</strong></div></article>
    </section>

    <Card>
      <template #content>
        <div class="filters">
          <span class="search"><i class="pi pi-search"></i><InputText v-model="busqueda" placeholder="Código, motivo o usuario..." /></span>
          <Select v-model="tipoFiltro" :options="TIPOS_APROBACION" optionLabel="label" optionValue="value" placeholder="Todos los tipos" showClear />
          <Select v-model="estadoFiltro" :options="estadosFiltro" optionLabel="label" optionValue="value" placeholder="Todos los estados" showClear />
        </div>
        <DataTable :value="filtradas" :loading="loading" paginator :rows="10" :rowsPerPageOptions="[10,25,50]" dataKey="id" stripedRows responsiveLayout="scroll">
          <template #empty><div class="empty"><i class="pi pi-inbox"></i><p>No hay solicitudes de aprobación.</p></div></template>
          <Column field="codigo" header="Solicitud" sortable><template #body="{ data }"><button class="code" @click="verDetalle(data)">{{ data.codigo }}</button><small>Nivel {{ data.nivel }}</small></template></Column>
          <Column field="tipo" header="Tipo" sortable><template #body="{ data }"><span class="type"><i :class="iconoTipo(data.tipo)"></i>{{ etiquetaTipo(data.tipo) }}</span></template></Column>
          <Column field="monto" header="Monto" sortable><template #body="{ data }"><strong>{{ moneda(data.monto, data.moneda) }}</strong></template></Column>
          <Column field="solicitante" header="Solicitante" sortable><template #body="{ data }"><span>{{ data.solicitante }}</span><small>{{ fecha(data.solicitado_at) }}</small></template></Column>
          <Column field="estado" header="Estado" sortable><template #body="{ data }"><Tag :value="etiquetaEstado(data.estado)" :severity="severidad(data.estado)" /></template></Column>
          <Column header="Acciones" :exportable="false">
            <template #body="{ data }"><div class="actions">
              <Button icon="pi pi-eye" text rounded v-tooltip.top="'Ver detalle'" @click="verDetalle(data)" />
              <Button v-if="data.estado === 'PENDIENTE'" icon="pi pi-check" severity="success" text rounded v-tooltip.top="'Aprobar'" :disabled="esPropia(data)" @click="decidir(data, 'APROBADA')" />
              <Button v-if="data.estado === 'PENDIENTE'" icon="pi pi-times" severity="danger" text rounded v-tooltip.top="'Rechazar'" @click="decidir(data, 'RECHAZADA')" />
              <Button v-if="data.estado === 'PENDIENTE' && esPropia(data)" icon="pi pi-ban" severity="secondary" text rounded v-tooltip.top="'Cancelar solicitud'" @click="decidir(data, 'CANCELADA')" />
            </div></template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="dialogoNueva" modal header="Nueva solicitud de aprobación" :style="{ width:'720px', maxWidth:'96vw' }">
      <div class="form-grid">
        <label>Tipo de operación<Select v-model="form.tipo" :options="TIPOS_APROBACION" optionLabel="label" optionValue="value" placeholder="Seleccione" fluid /></label>
        <label>Nivel requerido<Select v-model="form.nivel" :options="niveles" optionLabel="label" optionValue="value" fluid /></label>
        <label>Monto<InputNumber v-model="form.monto" mode="currency" currency="DOP" locale="es-DO" :min="0" fluid /></label>
        <label>Moneda<Select v-model="form.moneda" :options="['DOP','USD','EUR']" fluid /></label>
        <label class="full">Motivo<Textarea v-model="form.motivo" rows="3" fluid placeholder="Explique por qué necesita autorización" /></label>
        <label class="full">Datos relacionados (JSON)<Textarea v-model="form.datos" rows="5" fluid class="json-input" placeholder='{"facturaId": 123, "referencia": "..."}' /></label>
      </div>
      <Message v-if="errores.length" severity="error" :closable="false"><ul><li v-for="error in errores" :key="error">{{ error }}</li></ul></Message>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="dialogoNueva=false" /><Button label="Enviar solicitud" icon="pi pi-send" :loading="guardando" @click="guardar" /></template>
    </Dialog>

    <Dialog v-model:visible="dialogoDetalle" modal header="Detalle de aprobación" :style="{ width:'800px', maxWidth:'96vw' }">
      <template v-if="seleccionada">
        <div class="detail-header"><div><small>SOLICITUD</small><strong>{{ seleccionada.codigo }}</strong></div><Tag :value="etiquetaEstado(seleccionada.estado)" :severity="severidad(seleccionada.estado)" /></div>
        <div class="detail-grid">
          <div><small>Tipo</small><strong>{{ etiquetaTipo(seleccionada.tipo) }}</strong></div><div><small>Nivel</small><strong>Nivel {{ seleccionada.nivel }}</strong></div>
          <div><small>Monto</small><strong>{{ moneda(seleccionada.monto, seleccionada.moneda) }}</strong></div><div><small>Solicitante</small><strong>{{ seleccionada.solicitante }}</strong></div>
          <div class="full"><small>Motivo</small><p>{{ seleccionada.motivo }}</p></div><div v-if="seleccionada.respuesta" class="full"><small>Respuesta del revisor</small><p>{{ seleccionada.respuesta }}</p></div>
        </div>
        <h3>Datos relacionados</h3><pre>{{ jsonBonito(seleccionada.datos) }}</pre>
        <h3>Historial</h3><div class="timeline"><div v-for="(evento,index) in historial" :key="index" class="event"><span></span><div><strong>{{ etiquetaEstado(evento.estado) }}</strong><p>{{ evento.usuario }} · {{ fecha(evento.fecha) }}</p><small>{{ evento.comentario }}</small></div></div></div>
      </template>
      <template #footer><Button label="Cerrar" severity="secondary" @click="dialogoDetalle=false" /></template>
    </Dialog>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { nfecha, peticionesFetchOffline } from '@/funciones/funciones.js'
import { useDatosEmpresa } from '@/stores'
import { TIPOS_APROBACION, TABLA_APROBACIONES, asegurarTablaAprobaciones, crearCodigoAprobacion,
  crearSolicitudAprobacion, filtrarSolicitudes, leerJson, mismoUsuario, resolverSolicitudAprobacion,
  resumenSolicitudes, validarSolicitud } from './centroAprobacionesCore.js'

const toast = useToast()
const datosEmpresa = useDatosEmpresa()
const solicitudes = ref([])
const loading = ref(false)
const guardando = ref(false)
const busqueda = ref('')
const tipoFiltro = ref(null)
const estadoFiltro = ref(null)
const dialogoNueva = ref(false)
const dialogoDetalle = ref(false)
const seleccionada = ref(null)
const errores = ref([])
const form = ref(nuevoForm())
const niveles = [{ label:'Nivel 1 · Supervisor', value:1 }, { label:'Nivel 2 · Gerencia', value:2 }, { label:'Nivel 3 · Administración', value:3 }]
const estadosFiltro = [{label:'Pendientes',value:'PENDIENTE'},{label:'Aprobadas',value:'APROBADA'},{label:'Rechazadas',value:'RECHAZADA'},{label:'Canceladas',value:'CANCELADA'}]
const filtradas = computed(() => filtrarSolicitudes(solicitudes.value, { busqueda:busqueda.value, tipo:tipoFiltro.value, estado:estadoFiltro.value }))
const resumen = computed(() => resumenSolicitudes(solicitudes.value))
const historial = computed(() => leerJson(seleccionada.value?.historial, []))

function nuevoForm() { return { tipo:'', nivel:1, monto:0, moneda:'DOP', motivo:'', datos:'{}' } }
function usuario() { return datosEmpresa.usuario?.nombre || datosEmpresa.usuario?.usuario || 'Usuario' }
function esOk(r) { return Array.isArray(r) ? r[0] === 'ok' : r?.success === true }
function etiquetaTipo(tipo) { return TIPOS_APROBACION.find((t) => t.value === tipo)?.label || tipo }
function etiquetaEstado(e) { return ({PENDIENTE:'Pendiente',APROBADA:'Aprobada',RECHAZADA:'Rechazada',CANCELADA:'Cancelada'})[e] || e }
function severidad(e) { return ({PENDIENTE:'warn',APROBADA:'success',RECHAZADA:'danger',CANCELADA:'secondary'})[e] || 'info' }
function iconoTipo(t) { return ({DESCUENTO:'pi pi-percentage',GASTO:'pi pi-wallet',COMPRA:'pi pi-shopping-cart',ANULACION:'pi pi-ban',AJUSTE_INVENTARIO:'pi pi-box',NOTA_CREDITO:'pi pi-file-edit',TRANSFERENCIA:'pi pi-arrow-right-arrow-left'})[t] || 'pi pi-file' }
function moneda(v, codigo='DOP') { return new Intl.NumberFormat('es-DO',{style:'currency',currency:codigo || 'DOP'}).format(Number(v)||0) }
function fecha(v) { if (!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : d.toLocaleString('es-DO') }
function jsonBonito(v) { return JSON.stringify(leerJson(v, {}), null, 2) }
function esPropia(s) { return mismoUsuario(s.solicitante, usuario()) }

async function asegurarTabla() {
  await asegurarTablaAprobaciones(peticionesFetchOffline)
}

async function cargar() {
  loading.value = true
  try { await asegurarTabla(); const r = await peticionesFetchOffline('getDataAsArray', TABLA_APROBACIONES, ''); solicitudes.value = (Array.isArray(r)?r:[]).sort((a,b)=>Number(b.id)-Number(a.id)) }
  catch (error) { console.error(error); toast.add({severity:'error',summary:'Error',detail:error.message || 'No se cargaron las aprobaciones.',life:4000}) }
  finally { loading.value = false }
}
function abrirNueva() { form.value=nuevoForm(); errores.value=[]; dialogoNueva.value=true }

async function guardar() {
  let datosJson
  try { datosJson = JSON.parse(form.value.datos || '{}') } catch { errores.value=['Los datos relacionados deben contener un JSON válido.']; return }
  const datos = { ...form.value, datos:datosJson, solicitante:usuario() }
  const validacion = validarSolicitud(datos); errores.value=validacion.errores; if(!validacion.valido) return
  guardando.value=true
  try {
    const consecutivo = solicitudes.value.reduce((m,s)=>Math.max(m,Number(String(s.codigo||'').split('-').pop())||0),0)+1
    await crearSolicitudAprobacion(peticionesFetchOffline, datos, { codigo:crearCodigoAprobacion(new Date(),consecutivo), ahora:nfecha('timestamp') })
    toast.add({severity:'success',summary:'Solicitud enviada',detail:'La operación quedó pendiente de revisión.',life:3500}); dialogoNueva.value=false; await cargar()
  } catch(error) { toast.add({severity:'error',summary:'Error',detail:error.message,life:4500}) }
  finally { guardando.value=false }
}

async function decidir(s, estado) {
  if (estado === 'APROBADA' && esPropia(s)) { toast.add({severity:'warn',summary:'Separación de funciones',detail:'No puede aprobar su propia solicitud.',life:4000}); return }
  let comentario=''
  if (estado === 'RECHAZADA') { comentario=window.prompt('Indique el motivo del rechazo:') || ''; if(!comentario.trim()) return }
  if (estado === 'APROBADA') comentario=window.prompt('Comentario de aprobación (opcional):') || ''
  if (estado === 'CANCELADA' && !window.confirm(`¿Cancelar ${s.codigo}?`)) return
  loading.value=true
  try { await resolverSolicitudAprobacion(peticionesFetchOffline,s,estado,usuario(),comentario,nfecha('timestamp')); toast.add({severity:'success',summary:'Solicitud actualizada',detail:`La solicitud fue ${etiquetaEstado(estado).toLowerCase()}.`,life:3500}); await cargar() }
  catch(error) { toast.add({severity:'error',summary:'No se actualizó',detail:error.message,life:4500}) }
  finally { loading.value=false }
}
function verDetalle(s) { seleccionada.value=s; dialogoDetalle.value=true }
onMounted(cargar)
</script>

<style scoped>
.approval-page{padding:1.5rem;min-height:100vh;background:#f5f7fb;color:#26334c}.page-header{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1.2rem}.eyebrow{font-size:.75rem;letter-spacing:.08em;font-weight:700;color:#4f46e5}.page-header h1{margin:.2rem 0;font-size:1.8rem}.page-header p{margin:0;color:#64748b}.header-actions,.filters,.actions{display:flex;align-items:center;gap:.7rem}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-bottom:1rem}.stats article{display:flex;align-items:center;gap:.9rem;background:#fff;border:1px solid #e4e9f2;border-radius:14px;padding:1rem;box-shadow:0 3px 14px #0f172a0b}.stats i{font-size:1.45rem;background:#f1f5f9;padding:.7rem;border-radius:12px}.stats span{display:block;font-size:.8rem;color:#64748b}.stats strong{font-size:1.25rem}.blue{color:#2563eb}.orange{color:#ea580c}.green{color:#16a34a}.purple{color:#7c3aed}.filters{margin-bottom:1rem;flex-wrap:wrap}.search{position:relative;display:flex;align-items:center;flex:1}.search i{position:absolute;left:.8rem;color:#94a3b8;z-index:1}.search input{padding-left:2.3rem;width:100%;min-width:250px}.code{display:block;border:0;background:none;padding:0;color:#4f46e5;font-weight:700;cursor:pointer}.code+small,.p-datatable td span+small{display:block;color:#64748b;margin-top:.2rem}.type{display:flex;align-items:center;gap:.5rem}.empty{text-align:center;padding:2.5rem;color:#64748b}.empty i{font-size:2rem}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.form-grid label{display:flex;flex-direction:column;gap:.4rem;font-weight:600}.form-grid .full{grid-column:1/-1}.json-input{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.detail-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}.detail-header small,.detail-header strong,.detail-grid small,.detail-grid strong{display:block}.detail-header strong{font-size:1.35rem}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;background:#f8fafc;border:1px solid #e2e8f0;padding:1rem;border-radius:12px}.detail-grid>div{background:white;border-radius:8px;padding:.7rem}.detail-grid .full{grid-column:1/-1}.detail-grid small{color:#64748b}.detail-grid p{margin:.35rem 0 0}h3{font-size:1rem;margin:1.2rem 0 .6rem}pre{background:#111827;color:#dbeafe;border-radius:10px;padding:1rem;max-height:230px;overflow:auto}.timeline{border-left:2px solid #c7d2fe;margin-left:.4rem;padding-left:1.2rem}.event{position:relative;padding-bottom:1rem}.event>span{position:absolute;left:-1.58rem;top:.25rem;width:.7rem;height:.7rem;border-radius:50%;background:#4f46e5}.event p{margin:.15rem 0;color:#64748b}.event small{color:#475569}@media(max-width:850px){.stats{grid-template-columns:repeat(2,1fr)}.page-header{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.approval-page{padding:.8rem}.stats,.form-grid{grid-template-columns:1fr}.form-grid .full{grid-column:auto}.header-actions{width:100%;flex-wrap:wrap}}
</style>
