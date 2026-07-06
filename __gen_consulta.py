import os
path = r'C:\Users\Tomas Taveras\Desktop\Sistemas\Pollera\src\renderer\src\views\Taller\ConsultarTaller.vue'
parts = []
parts.append('''<template>
  <main class="consulta-taller">
    <section class="consulta-hero">
      <div class="consulta-hero-content">
        <span class="consulta-badge">Taller</span>
        <h1>Consulta tu orden</h1>
        <p class="consulta-desc">Ingresa tu numero de factura para ver el estado de tu reparacion</p>
        <form class="consulta-form" @submit.prevent="buscarOrden">
          <div class="consulta-input-group">
            <input ref="inputBusqueda" v-model="noFactura" type="text" inputmode="numeric"
              placeholder="N\u00b0 de factura" autocomplete="off" @input="handleInput" />
            <button type="submit" :disabled="buscando || !noFactura.trim()">
              <i class="pi pi-search"></i> {{ buscando ? 'Buscando...' : 'Consultar' }}
            </button>
          </div>
          <p v-if="errorMsg" class="consulta-error">{{ errorMsg }}</p>
        </form>
      </div>
    </section>

    <transition name="fade" mode="out-in">
      <section v-if="orden" class="consulta-results" key="result">
        <div class="consulta-results-inner">
          <header class="result-header">
            <div>
              <h2>Orden #{{ orden.no_factura }}</h2>
              <span class="result-date">Recibido: {{ orden.fecha_entrada || '\u2014' }}</span>
            </div>
            <span class="result-status" :class="'status--' + estadoNormalizado">
              <i :class="iconoEstado"></i> {{ etiquetaEstado }}
            </span>
          </header>
          <div class="result-grid">
            <div class="result-card"><span class="card-label">Cliente</span><p>{{ orden.nombre || '\u2014' }}</p></div>
            <div class="result-card"><span class="card-label">Contacto</span><p>{{ orden.telefono || orden.whatsapp || '\u2014' }}</p></div>
            <div class="result-card"><span class="card-label">Equipo</span><p>{{ equipoCompleto }}</p></div>
            <div v-if="orden.imei" class="result-card"><span class="card-label">IMEI / Serial</span><p>{{ orden.imei }}</p></div>
            <div v-if="orden.metodopago" class="result-card"><span class="card-label">Metodo de pago</span><p>{{ orden.metodopago }}</p></div>
          </div>
          <div v-if="fallasFormateadas" class="info-section">
            <span class="info-label">Falla(s) reportada(s)</span>
            <p>{{ fallasFormateadas }}</p>
          </div>
          <div v-if="orden.reparacion || orden.piezas" class="info-section">
            <span class="info-label">Trabajo realizado</span>
            <p v-if="orden.reparacion">{{ limpiarTexto(orden.reparacion) }}</p>
            <p v-if="orden.piezas">Piezas: {{ limpiarTexto(orden.piezas) }}</p>
          </div>
          <div v-if="orden.total" class="costos">
            <span class="info-label">Costo</span>
            <table class="costos-tabla">
              <tr><td>Mano de obra</td><td>{{ orden.manodeobra || '0' }}</td></tr>
              <tr><td>Piezas</td><td>{{ orden.preciopiezas || '0' }}</td></tr>
              <tr class="row-total"><td>Total</td><td>{{ orden.total }}</td></tr>
              <tr v-if="Number(orden.abonado || 0) > 0"><td>Abonado</td><td>{{ orden.abonado }}</td></tr>
              <tr v-if="Number(orden.saldo || 0) > 0" class="row-saldo"><td>Pendiente</td><td>{{ orden.saldo }}</td></tr>
              <tr v-if="Number(orden.abonado || 0) > 0 && orden.abono"><td>Metodo Pago</td><td>{{ metodo_general }}</td></tr>
            </table>
          </div>
          <div v-if="imagenes.length" class="images-section">
            <span class="info-label">Imagen(es)</span>
            <div class="images-grid">
              <div v-for="(img, i) in imagenes" :key="i" class="image-item" @click="imagenAmpliada = img">
                <img :src="img.url" :alt="obtenerImgNombre(img)" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section v-else-if="buscado && !buscando" class="consulta-empty" key="empty">
        <i class="pi pi-search"></i>
        <p>No encontramos ninguna orden con ese numero.<br />Verifica e intenta de nuevo.</p>
      </section>
    </transition>
    <div v-if="imagenAmpliada" class="overlay" @click="imagenAmpliada = null">
      <button class="overlay-close" @click="imagenAmpliada = null"><i class="pi pi-times"></i></button>
      <img :src="imagenAmpliada.url" :alt="obtenerImgNombre(imagenAmpliada)" @click.stop />
    </div>
  </main>
</template>''')

parts.append('''
<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { peticiones, peticionesFetchOffline } from '@/funciones/funciones.js'

const inputBusqueda = ref(null)
const noFactura = ref('')
const buscando = ref(false)
const buscado = ref(false)
const errorMsg = ref('')
const orden = ref(null)
const imagenes = ref([])
const imagenAmpliada = ref(null)
const link = ref('')
const api = ref('')
const tokenCifrado = ref(null)

const estadoMap = {
  pendiente: { label: 'Pendiente', icon: 'pi pi-clock' },
  revision: { label: 'En Revision', icon: 'pi pi-search' },
  reparado: { label: 'Reparado', icon: 'pi pi-check-circle' },
  garantia: { label: 'Garantia', icon: 'pi pi-shield' },
  sin_solucion: { label: 'Sin Solucion', icon: 'pi pi-times-circle' },
  entregado: { label: 'Entregado', icon: 'pi pi-send' },
  devolucion: { label: 'Devuelto', icon: 'pi pi-undo' }
}

const estadoNormalizado = computed(() => {
  const t = String(orden.value?.estado || '').toLowerCase()
  if (t.includes('entregado')) return 'entregado'
  if (t.includes('reparado') || t.includes('listo')) return 'reparado'
  if (t.includes('revision') || t.includes('revisi')) return 'revision'
  if (t.includes('garantia') || t.includes('garant')) return 'garantia'
  if (t.includes('sin solucion') || t.includes('sin soluci')) return 'sin_solucion'
  if (t.includes('devolucion') || t.includes('devolu')) return 'devolucion'
  return 'pendiente'
})

const iconoEstado = computed(() => estadoMap[estadoNormalizado.value]?.icon || 'pi pi-clock')
const etiquetaEstado = computed(() => estadoMap[estadoNormalizado.value]?.label || 'Pendiente')
const equipoCompleto = computed(() => [orden.value?.equipo, orden.value?.marca, orden.value?.modelo].filter(Boolean).join(' ') || 'Sin detalle')

const metodo_general = computed(() => {
  const v = orden.value?.abono
  if (!v) return '-'
  let arr = typeof v === 'string' ? (() => { try { return JSON.parse(v) } catch {} })() : v
  return Array.isArray(arr) && arr.length ? arr[0]?.metodo_pago || '-' : '-'
})

const limpiarTexto = (t = '') => String(t || '').replace(/\\s+/g, ' ').trim()

const fallasFormateadas = computed(() => {
  const val = orden.value?.fallas || orden.value?.observaciones
  if (!val) return ''
  let data = val
  if (typeof data === 'string') { try { data = JSON.parse(data) } catch { return data } }
  if (Array.isArray(data)) return data.map(i => typeof i === 'object' ? (i.propiedad || i.descripcion || JSON.stringify(i)) : String(i)).join(', ')
  return String(data)
})

const cargarConfig = async () => {
  try {
    const local = localStorage.getItem('DatosDeDB')
    const datosJSON = local ? JSON.parse(local) : await (await fetch('/DatosDeDB.json')).json()
    link.value = datosJSON.VITE_LINKURL || window.env?.VITE_LINKURL || ''
    api.value = datosJSON.VITE_API || window.env?.VITE_API || ''
    tokenCifrado.value = datosJSON.token_cifrado || null
  } catch {
    link.value = window.env?.VITE_LINKURL || ''; api.value = window.env?.VITE_API || ''
  }
}

const buscarOrden = async () => {
  if (!noFactura.value.trim()) return
  buscando.value = true; buscado.value = false
  errorMsg.value = ''; imagenes.value = []; orden.value = null
  try {
    let rows = null
    try { const b = api.value ? await peticiones(link.value + api.value + '/todas/taller', {}, 'GET', tokenCifrado.value) : null; rows = Array.isArray(b) ? b : null } catch {}
    if (!rows) { try { const r = await peticionesFetchOffline('getDataAsArray', 'taller'); rows = Array.isArray(r) ? r : null } catch {} }
    if (!rows) { buscado.value = true; errorMsg.value = 'No encontramos ninguna orden.'; return }
    const resultado = rows.find(r => String(r.no_factura || r.factura || '').trim() === noFactura.value.trim())
    if (!resultado) { buscado.value = true; errorMsg.value = 'No encontramos ninguna orden con ese numero.'; return }
    orden.value = resultado; buscado.value = true
    await cargarImagenes()
  } catch { errorMsg.value = 'Error al realizar la busqueda.' } finally { buscando.value = false }
}

const cargarImagenes = async () => {
  imagenes.value = []
  if (!orden.value?.imagen) return
  const folder = orden.value.imagen
  try {
    const archivos = await peticiones(link.value + api.value + '/peticionimagenes', { origen: '../vista/img/taller/' + folder }, 'POST', tokenCifrado.value)
    if (Array.isArray(archivos) && archivos[0] !== 'error') {
      archivos.forEach(f => imagenes.value.push({ nombre: typeof f === 'string' ? f : (f.nombre || ''), url: link.value + '/vista/img/taller/' + folder + '/' + (typeof f === 'string' ? f : f.nombre || '') }))
    }
  } catch {}
}

const obtenerImgNombre = (img) => typeof img === 'string' ? img.split(/[/\\\\]/).pop() || '' : img?.nombre || ''
const handleInput = () => { if (errorMsg.value) errorMsg.value = ''; if (buscado.value) { buscado.value = false; orden.value = null } }

onMounted(async () => { await cargarConfig(); nextTick(() => inputBusqueda.value?.focus()) })
</script>
''')

parts.append('''
<style scoped>
.consulta-taller { min-height: 100vh; background: linear-gradient(135deg, rgba(16,24,39,0.97), rgba(24,24,27,0.98)), radial-gradient(circle at top left, rgba(250,204,21,0.12), transparent 40%); color: #f8fafc; display: flex; flex-direction: column; align-items: center; }
.consulta-hero { width: 100%; display: flex; justify-content: center; padding: 4rem 1.5rem 2rem; }
.consulta-hero-content { width: 100%; max-width: 40rem; text-align: center; }
.consulta-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; background: rgba(250,204,21,0.15); color: #facc15; font-size: .75rem; font-weight: 900; text-transform: uppercase; }
.consulta-hero h1 { margin: .75rem 0 0; font-size: 2.5rem; font-weight: 950; line-height: 1.1; }
.consulta-desc { margin: .5rem 0 2rem; color: #94a3b8; font-weight: 600; }
.consulta-form { width: 100%; }
.consulta-input-group { display: flex; border: 2px solid rgba(255,255,255,.1); border-radius: 14px; overflow: hidden; background: rgba(255,255,255,.04); transition: border-color .2s; }
.consulta-input-group:focus-within { border-color: #facc15; }
.consulta-input-group input { flex: 1; padding: 1rem 1.25rem; border: 0; background: transparent; color: #f8fafc; font-size: 1.1rem; font-weight: 700; outline: none; }
.consulta-input-group input::placeholder { color: #64748b; font-weight: 600; }
.consulta-input-group button { display: flex; align-items: center; gap: .5rem; padding: 1rem 1.5rem; border: 0; background: #facc15; color: #111827; cursor: pointer; font-weight: 900; font-size: .9rem; transition: opacity .15s; white-space: nowrap; }
.consulta-input-group button:disabled { opacity: .5; cursor: not-allowed; }
.consulta-input-group button:hover:not(:disabled) { opacity: .85; }
.consulta-error { margin: .75rem 0 0; color: #fb7185; font-weight: 700; font-size: .85rem; }
.consulta-results { width: 100%; max-width: 48rem; padding: 0 1.5rem 4rem; }
.consulta-results-inner { border: 1px solid rgba(255,255,255,.08); border-radius: 16px; background: rgba(15,23,42,.6); backdrop-filter: blur(8px); padding: 1.5rem; }
.result-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,.06); }
.result-header h2 { margin: 0; font-size: 1.35rem; font-weight: 950; }
.result-date { display: block; margin-top: .15rem; color: #94a3b8; font-size: .82rem; font-weight: 600; }
.result-status { display: inline-flex; align-items: center; gap: .4rem; padding: .35rem .75rem; border-radius: 9999px; font-size: .8rem; font-weight: 900; text-transform: uppercase; white-space: nowrap; }
.status--pendiente { color: #facc15; background: rgba(250,204,21,.15); }
.status--revision { color: #38bdf8; background: rgba(56,189,248,.15); }
.status--reparado { color: #22c55e; background: rgba(34,197,94,.15); }
.status--garantia { color: #a78bfa; background: rgba(167,139,250,.15); }
.status--sin_solucion { color: #fb7185; background: rgba(251,113,133,.15); }
.status--entregado { color: #94a3b8; background: rgba(148,163,184,.15); }
.status--devolucion { color: #f59e0b; background: rgba(245,158,11,.15); }
.result-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: .75rem; margin-top: 1.25rem; }
.result-card { padding: .85rem; border-radius: 10px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); }
.card-label { display: block; color: #64748b; font-size: .72rem; font-weight: 900; text-transform: uppercase; }
.result-card p { margin: .35rem 0 0; font-weight: 800; }
.info-section { margin-top: 1.25rem; padding: 1rem; border-radius: 10px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); }
.info-section p { margin: .5rem 0 0; font-weight: 600; }
.info-label { display: block; color: #64748b; font-size: .72rem; font-weight: 900; text-transform: uppercase; margin-bottom: .5rem; }
.costos { margin-top: 1.25rem; padding: 1rem; border-radius: 10px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); }
.costos-tabla { width: 100%; border-collapse: collapse; }
.costos-tabla td { padding: .35rem .5rem; }
.costos-tabla td:last-child { text-align: right; font-weight: 800; }
.row-total td { border-top: 1px solid rgba(255,255,255,.1); font-weight: 950; color: #22c55e; }
.row-saldo td { color: #fb7185; font-weight: 700; }
.images-section { margin-top: 1.25rem; }
.images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); gap: .5rem; margin-top: .5rem; }
.image-item { aspect-ratio: 1; border-radius: 10px; overflow: hidden; cursor: pointer; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,.06); }
.image-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .2s; }
.image-item:hover img { transform: scale(1.08); }
.consulta-empty { width: 100%; max-width: 24rem; text-align: center; padding: 3rem 1.5rem; }
.consulta-empty i { font-size: 2.5rem; color: #64748b; }
.consulta-empty p { margin-top: 1rem; color: #94a3b8; font-weight: 600; }
.overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.85); display: flex; align-items: center; justify-content: center; padding: 2rem; cursor: pointer; }
.overlay img { max-width: 90%; max-height: 90%; border-radius: 8px; cursor: default; }
.overlay-close { position: absolute; top: 1rem; right: 1.5rem; background: transparent; border: 0; color: #fff; font-size: 2rem; cursor: pointer; opacity: .6; }
.overlay-close:hover { opacity: 1; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 600px) {
  .consulta-hero { padding: 2rem 1rem; }
  .consulta-hero h1 { font-size: 1.75rem; }
  .consulta-input-group { flex-direction: column; border-radius: 10px; }
  .consulta-input-group button { justify-content: center; }
  .consulta-results-inner { padding: 1rem; }
  .result-grid { grid-template-columns: 1fr; }
}
</style>
''')

# We need to handle the file properly
if os.path.exists(path):
    os.remove(path)
with open(path, 'w', encoding='utf-8') as f:
    f.write(parts[0].strip() + '\n')
    f.write(parts[1].strip() + '\n')
    f.write(parts[2].strip() + '\n')

print('File written OK')
