<template>
  <div class="w-full min-h-screen bg-gray-50 p-4">
    <div class="grid grid-cols-12 gap-4">
      <!-- Listado de Mesas -->
      <div class="col-span-12 md:col-span-4">
        <div class="bg-white shadow-md rounded-xl p-3 h-full flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <button class="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" @click="goPos">← POS</button>
              <h3 class="text-base font-semibold text-gray-800">Mesas</h3>
            </div>
            <button
              class="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
              @click="loadMesas"
              :disabled="loading"
            >
              Recargar
            </button>
          </div>
          <div class="flex-1 overflow-y-auto space-y-2">
            <template v-if="mesas.length">
              <button
                v-for="m in mesas"
                :key="m.id ?? m.nombre"
                @click="selectMesa(m)"
                :class="[
                  'w-full text-left p-3 rounded-lg border transition flex items-center justify-between',
                  selectedMesa && selectedMesa.nombre === m.nombre
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                ]"
              >
                <div class="truncate">
                  <div class="font-medium text-gray-800 truncate">{{ m.nombre }}</div>
                  <div class="text-xs text-gray-500 truncate">Cliente: {{ m.cliente || '—' }}</div>
                  <div class="mt-1">
                    <span
                      :class="[
                        'text-[10px] px-2 py-0.5 rounded-full border',
                        (m.estado || estadoFromMesa(m)) === 'OCUPADA'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      ]"
                    >
                      {{ (m.estado || estadoFromMesa(m)) }}
                    </span>
                  </div>
                </div>
                <div class="text-sm font-semibold text-gray-700">RD$ {{ toMoney(m.total) }}</div>
              </button>
            </template>
            <div v-else class="text-sm text-gray-500 text-center py-6">
              No hay mesas registradas
            </div>
          </div>
        </div>
      </div>

      <!-- Detalle Mesa -->
      <div class="col-span-12 md:col-span-8">
        <div class="bg-white shadow-md rounded-xl p-3 h-full">
          <template v-if="selectedMesa">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base font-semibold text-gray-800">
                {{ selectedMesa.nombre }}
              </h3>
              <div class="flex gap-2">
                <button class="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700" @click="clearMesa" :disabled="loading">Limpiar</button>
                <button class="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white" @click="fnCobrarMesa" :disabled="loading || !items.length">Cobrar</button>
                <button class="px-3 py-1.5 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white" @click="saveMesa" :disabled="loading">Guardar</button>
              </div>
            </div>

            <!-- Cliente/Mesero -->
            <div class="grid grid-cols-12 gap-2 mb-3">
              <div class="col-span-12 md:col-span-6">
                <label class="block text-xs text-gray-600 mb-1">Cliente</label>
                <input
                  ref="clienteInputEl"
                  v-model="clienteNombre"
                  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar cliente"
                />
              </div>
              <div class="col-span-12 md:col-span-6">
                <label class="block text-xs text-gray-600 mb-1">Mesero</label>
                <input v-model="mesero" class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mesero" />
              </div>
            </div>

            <!-- Buscador de productos -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
              <div class="flex items-center gap-2">
                <input
                  ref="prodInputEl"
                  v-model="prodQuery"
                  class="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :placeholder="prodMode === 'nombre' ? 'Buscar producto por nombre' : 'Buscar producto por código'"
                  @keydown.enter.prevent="onProductEnter"
                />
                <button @click="setProdMode('nombre')" :class="prodMode==='nombre' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'" class="px-3 py-2 rounded-md text-sm">Nombre</button>
                <button @click="setProdMode('codigo')" :class="prodMode==='codigo' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'" class="px-3 py-2 rounded-md text-sm">Código</button>
                <button @click="addSelectedProduct" class="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">Agregar</button>
              </div>
            </div>

            <!-- Productos en mesa -->
            <div class="border rounded-lg overflow-hidden">
              <div class="grid grid-cols-12 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-600">
                <div class="col-span-6">Producto</div>
                <div class="col-span-2 text-center">Cant</div>
                <div class="col-span-2 text-right">Precio</div>
                <div class="col-span-2 text-right">Total</div>
              </div>
              <div class="divide-y">
                <div v-for="(it, idx) in items" :key="idx" class="grid grid-cols-12 items-center px-2 py-2 text-sm">
                  <div class="col-span-6 truncate">{{ it.nombre }}</div>
                  <div class="col-span-2 flex items-center justify-center gap-2">
                    <button class="px-2 py-1 bg-gray-100 rounded" @click="decQty(idx)" :disabled="it.quantity<=1">-</button>
                    <input type="number" v-model.number="it.quantity" min="1" class="w-14 text-center border rounded" @change="recalcRow(idx)" />
                    <button class="px-2 py-1 bg-gray-100 rounded" @click="incQty(idx)">+</button>
                  </div>
                  <div class="col-span-2 text-right">{{ toMoney(unitPrice(it)) }}</div>
                  <div class="col-span-2 text-right">{{ toMoney(rowTotal(it)) }}</div>
                </div>
                <div v-if="!items.length" class="px-3 py-6 text-center text-gray-400">Sin productos</div>
              </div>
              <div class="flex justify-between px-3 py-2 border-t font-semibold">
                <div>Subtotal</div>
                <div>RD$ {{ toMoney(subtotal) }}</div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="h-full flex items-center justify-center text-gray-500">
              Selecciona una mesa para comenzar
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Awesomplete from 'awesomplete'
import 'awesomplete/awesomplete.css'
import Swal from 'sweetalert2'
import { peticionesFetchOffline, envioElectron, encryptarPassword } from '../funciones/funciones.js'
import { useDatosEmpresa } from '../stores'

const datosEmpresa = useDatosEmpresa()

const loading = ref(false)
const mesas = ref([])
const selectedMesa = ref(null)

// Cliente y mesero
const clienteNombre = ref('')
const codCliente = ref('')
const mesero = ref('')
const clienteInputEl = ref(null)
let awCliente = null

// Productos
const products = ref([])
const items = ref([])
const prodInputEl = ref(null)
const prodQuery = ref('')
const prodMode = ref('nombre') // 'nombre' | 'codigo'
let awProd = null
const router = useRouter()

const toMoney = (n) => {
  const v = parseFloat(n || 0)
  return v.toFixed(2)
}

const unitPrice = (it) => {
  const qty = it.quantity || 1
  const total = parseFloat(it.precio_venta || it.precio_final || 0)
  // si precio_venta ya es total, derive unitario
  return total / qty
}

const rowTotal = (it) => {
  return unitPrice(it) * (it.quantity || 1)
}

const subtotal = computed(() => {
  return items.value.reduce((s, it) => s + rowTotal(it), 0)
})

const estadoFromMesa = (m) => {
  try {
    const prods = typeof m?.productos === 'string' ? JSON.parse(m.productos || '[]') : (m?.productos || [])
    if (Array.isArray(prods) && prods.length > 0) return 'OCUPADA'
  } catch {}
  const t = parseFloat(m?.total || 0)
  return t > 0 ? 'OCUPADA' : 'LIBRE'
}

const loadMesas = async () => {
  loading.value = true
  try {
    const arr = await peticionesFetchOffline('getDataAsArray', 'mesas')
    mesas.value = Array.isArray(arr) ? arr.map(m => ({
      ...m,
      estado: m.estado || estadoFromMesa(m)
    })) : []
  } catch (e) {
    mesas.value = []
  } finally {
    loading.value = false
  }
}

const selectMesa = (m) => {
  selectedMesa.value = m
  // cargar datos de mesa
  try {
    const prods = typeof m.productos === 'string' ? JSON.parse(m.productos || '[]') : (m.productos || [])
    items.value = (Array.isArray(prods) ? prods : []).map(p => ({
      ...p,
      quantity: Number(p.quantity || p.cantidad || 1),
      precio_venta: String(p.precio_venta || p.total || 0),
      precio_final: String(p.precio_final || p.total || 0)
    }))
  } catch {
    items.value = []
  }
  clienteNombre.value = m.cliente || ''
  codCliente.value = m.cod_cliente || ''
  mesero.value = m.mesero || ''
}

const clearMesa = () => {
  items.value = []
}

const setProdMode = (mode) => {
  prodMode.value = mode
  prodQuery.value = ''
  buildAwesompleteProd()
  if (prodInputEl.value) prodInputEl.value.focus()
}

const addSelectedProduct = () => {
  const val = String(prodQuery.value || '').trim().toLowerCase()
  if (!val) return
  let match = null
  if (prodMode.value === 'codigo') {
    match = products.value.find(p => String(p.codigo || '').toLowerCase() === val)
         || products.value.find(p => String(p.codigo || '').toLowerCase().startsWith(val))
  } else {
    match = products.value.find(p => String(p.nombre || '').toLowerCase() === val)
         || products.value.find(p => String(p.nombre || '').toLowerCase().startsWith(val))
  }
  if (!match) {
    Swal.fire({ icon: 'warning', title: 'Sin resultados', text: 'No se encontró el producto' })
    return
  }
  // construir item básico
  const nuevo = {
    id: match.id,
    codigo: match.codigo,
    nombre: match.nombre,
    quantity: 1,
    precio_venta: String(parseFloat(match.precio_final || match.precio_venta || 0).toFixed(2)),
    precio_final: String(parseFloat(match.precio_final || match.precio_venta || 0).toFixed(2)),
    total: String(parseFloat(match.precio_final || match.precio_venta || 0).toFixed(2)),
  }

  // merge si existe mismo id y sin addons
  const idx = items.value.findIndex(it => it.id === nuevo.id)
  if (idx >= 0) {
    const curr = items.value[idx]
    const unit = unitPrice(curr)
    const newQty = (curr.quantity || 0) + 1
    const newTotal = (unit * newQty).toFixed(2)
    items.value.splice(idx, 1, { ...curr, quantity: newQty, precio_venta: newTotal, precio_final: newTotal, total: newTotal })
  } else {
    items.value.push(nuevo)
  }
  prodQuery.value = ''
  if (awProd) awProd.close()
}

const onProductEnter = () => addSelectedProduct()

const incQty = (idx) => {
  const it = items.value[idx]
  const unit = unitPrice(it)
  const newQty = (it.quantity || 0) + 1
  const newTotal = (unit * newQty).toFixed(2)
  items.value.splice(idx, 1, { ...it, quantity: newQty, precio_venta: newTotal, precio_final: newTotal, total: newTotal })
}

const decQty = (idx) => {
  const it = items.value[idx]
  if (!it || (it.quantity || 1) <= 1) return
  const unit = unitPrice(it)
  const newQty = (it.quantity || 1) - 1
  const newTotal = (unit * newQty).toFixed(2)
  items.value.splice(idx, 1, { ...it, quantity: newQty, precio_venta: newTotal, precio_final: newTotal, total: newTotal })
}

const recalcRow = (idx) => {
  const it = items.value[idx]
  if (!it || (it.quantity || 0) < 1) it.quantity = 1
  const unit = unitPrice(it)
  const newTotal = (unit * (it.quantity || 1)).toFixed(2)
  items.value.splice(idx, 1, { ...it, precio_venta: newTotal, precio_final: newTotal, total: newTotal })
}

const saveMesa = async () => {
  if (!selectedMesa.value) return
  loading.value = true
  try {
    const now = new Date()
    const payload = {
      id: selectedMesa.value.id || undefined,
      nombre: selectedMesa.value.nombre,
      cliente: clienteNombre.value || '',
      mesero: mesero.value || '',
      total: parseFloat(subtotal.value).toFixed(2),
      fecha: now.toISOString().slice(0,10),
      hora: now.toTimeString().slice(0,8),
      productos: JSON.stringify(items.value),
      usuario: datosEmpresa?.usuario?.nombre || '',
      cod_cliente: codCliente.value || '',
      turno: datosEmpresa?.usuario?.token || '',
      token: datosEmpresa?.usuario?.token || '',
      identificadordb: datosEmpresa?.empresa?.identificador || '',
      almacen: datosEmpresa?.almacen?.id || '',
      estado: items.value.length ? 'OCUPADA' : 'LIBRE',
      updated_at: now.toISOString(),
      created_at: selectedMesa.value.created_at || now.toISOString(),
    }

    // Determinar si existe por id o por nombre
    let existing = null
    if (payload.id) {
      existing = selectedMesa.value
    } else {
      existing = await peticionesFetchOffline('getDataByField','mesas','nombre', payload.nombre)
      if (Array.isArray(existing) && existing.length) {
        payload.id = existing[0].id
      }
    }

    if (payload.id) {
      await peticionesFetchOffline('updateData','mesas', JSON.stringify(payload))
    } else {
      await peticionesFetchOffline('insertData','mesas', JSON.stringify(payload))
    }

    await loadMesas()
    const updated = mesas.value.find(x => x.nombre === payload.nombre) || payload
    selectMesa(updated)
    Swal.fire({ icon: 'success', title: 'Mesa guardada', timer: 1200, showConfirmButton: false })
  } catch (e) {
    console.error('Error guardando mesa', e)
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la mesa' })
  } finally {
    loading.value = false
  }
}

const goPos = () => { router.push({ name: 'pos' }) }

// Cobrar mesa (finalizar venta con impuesto/propina opcional)
const fnCobrarMesa = async () => {
  if (!selectedMesa.value) return
  if (!items.value.length) {
    await Swal.fire({ icon: 'warning', title: 'Sin productos', text: 'La mesa no tiene productos' })
    return
  }

  const totalBase = parseFloat(subtotal.value)
  let impuestoAplicado = false, impuestoPorcentaje = 18, impuestoValor = 0
  let propinaPorcentaje = 10, propinaValor = 0
  let totalActual = totalBase

  const { value: datos } = await Swal.fire({
    title: 'Cobrar Mesa',
    html: `
      <div class="grid grid-cols-12 gap-2 text-left">
        <div class="col-span-6">
          <label class="text-sm font-semibold">Total</label>
          <input id="total" type="number" class="w-full px-3 py-2 border rounded bg-gray-100" value="${totalBase.toFixed(2)}" readonly />
        </div>
        <div class="col-span-6">
          <label class="text-sm font-semibold">Pagado</label>
          <input id="pagado" type="number" class="w-full px-3 py-2 border rounded" value="${totalBase.toFixed(2)}" />
        </div>
        <div class="col-span-6">
          <label class="text-sm font-semibold">Cambio</label>
          <input id="cambio" type="number" class="w-full px-3 py-2 border rounded bg-gray-100" value="0.00" readonly />
        </div>
        <div class="col-span-12 flex gap-2 mt-2">
          <button id="btn-impuesto" class="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Agregar impuesto</button>
          <button id="btn-propina" class="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Agregar propinas</button>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Confirmar pago',
    didOpen: () => {
      const totalInput = Swal.getPopup().querySelector('#total')
      const pagadoInput = Swal.getPopup().querySelector('#pagado')
      const cambioInput = Swal.getPopup().querySelector('#cambio')
      const updateTotalUI = () => {
        totalActual = parseFloat((totalBase + impuestoValor + propinaValor).toFixed(2))
        totalInput.value = totalActual.toFixed(2)
        const pag = parseFloat(pagadoInput.value||0)
        const camb = pag - totalActual
        cambioInput.value = camb >= 0 ? camb.toFixed(2) : '0.00'
      }
      pagadoInput.addEventListener('input', updateTotalUI)
      const btnImp = Swal.getPopup().querySelector('#btn-impuesto')
      if (btnImp) btnImp.addEventListener('click', () => {
        impuestoAplicado = !impuestoAplicado
        impuestoValor = impuestoAplicado ? (totalBase * (impuestoPorcentaje/100)) : 0
        btnImp.textContent = impuestoAplicado ? 'Quitar impuesto' : 'Agregar impuesto'
        updateTotalUI()
      })
      const btnProp = Swal.getPopup().querySelector('#btn-propina')
      if (btnProp) btnProp.addEventListener('click', async () => {
        const { value: pct } = await Swal.fire({
          title: 'Propina',
          html: `<div class='flex items-center gap-2 justify-center'><button id='tip-dec' class='px-3 py-2 bg-gray-100 rounded'>-</button><input id='tip-percent' type='number' class='w-24 text-center border rounded py-2' value='${propinaPorcentaje}' min='0' max='100' step='1' /><span>%</span><button id='tip-inc' class='px-3 py-2 bg-gray-100 rounded'>+</button></div><div class='mt-2 text-center text-sm text-gray-600'>Base: RD$ ${totalBase.toFixed(2)}</div>`,
          didOpen: () => { const input = Swal.getPopup().querySelector('#tip-percent'); const dec = Swal.getPopup().querySelector('#tip-dec'); const inc = Swal.getPopup().querySelector('#tip-inc'); const clamp = () => { let v = parseFloat(input.value)||0; if (v<0) v=0; if (v>100) v=100; input.value = v.toFixed(0) }; dec.addEventListener('click', () => { input.value = (parseFloat(input.value)||0)-1; clamp() }); inc.addEventListener('click', () => { input.value = (parseFloat(input.value)||0)+1; clamp() }) },
          preConfirm: () => { const v = parseFloat(Swal.getPopup().querySelector('#tip-percent').value); if (isNaN(v)||v<0||v>100) { Swal.showValidationMessage('Ingrese un porcentaje entre 0 y 100'); return false } return v },
          showCancelButton: true,
          confirmButtonText: 'Aplicar'
        })
        if (typeof pct !== 'undefined') { propinaPorcentaje = pct; propinaValor = totalBase * (propinaPorcentaje/100); updateTotalUI() }
      })
      updateTotalUI()
    },
    preConfirm: () => {
      const totalFinal = parseFloat(Swal.getPopup().querySelector('#total').value||totalBase)
      const pagado = parseFloat(Swal.getPopup().querySelector('#pagado').value||0)
      const cambio = parseFloat(Swal.getPopup().querySelector('#cambio').value||0)
      return { totalFinal, pagado, cambio, impuesto: impuestoValor, impuestoPorcentaje, propina: propinaValor, propinaPorcentaje }
    }
  })

  if (!datos) return

  // Finalizar: limpiar productos de la mesa y persistir
  try {
    const now = new Date()
    const payload = {
      ...selectedMesa.value,
      productos: JSON.stringify([]),
      total: '0.00',
      estado: 'LIBRE',
      updated_at: now.toISOString(),
    }
    await peticionesFetchOffline('updateData','mesas', JSON.stringify(payload))
    await loadMesas()
    const updated = mesas.value.find(x => x.id === selectedMesa.value.id) || payload
    selectMesa(updated)
    await Swal.fire({ icon: 'success', title: 'Pago registrado', text: `Total: RD$ ${datos.totalFinal.toFixed(2)}`, timer: 1500, showConfirmButton: false })
  } catch (e) {
    await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cerrar la mesa' })
  }
}

const buildAwesompleteProd = () => {
  if (!prodInputEl.value) return
  const list = prodMode.value === 'codigo'
    ? Array.from(new Set(products.value.map(p => p.codigo).filter(Boolean)))
    : Array.from(new Set(products.value.map(p => p.nombre).filter(Boolean)))
  if (!awProd) {
    awProd = new Awesomplete(prodInputEl.value, { list, minChars: 1, autoFirst: true, maxItems: 12 })
    prodInputEl.value.addEventListener('awesomplete-selectcomplete', (e) => {
      prodQuery.value = e.text.value || ''
      addSelectedProduct()
    })
  } else {
    awProd.list = list
  }
}

const buildAwesompleteCliente = () => {
  if (!clienteInputEl.value) return
  // cargar clientes
  peticionesFetchOffline('getDataAsArray','clientes').then(arr => {
    const list = Array.isArray(arr) ? arr : []
    const nombres = list.map(c => c.nombre).filter(Boolean)
    if (!awCliente) {
      awCliente = new Awesomplete(clienteInputEl.value, { list: nombres, minChars: 1, autoFirst: true, maxItems: 12 })
      clienteInputEl.value.addEventListener('awesomplete-selectcomplete', (e) => {
        const val = e.text.value || ''
        clienteNombre.value = val
        const found = list.find(c => (c.nombre || '').toLowerCase() === val.toLowerCase())
        codCliente.value = found?.codigo || ''
      })
    } else {
      awCliente.list = nombres
    }
  })
}

onMounted(async () => {
  // cargar productos
  try {
    const prods = await peticionesFetchOffline('getDataAsArray','productos')
    products.value = Array.isArray(prods) ? prods : []
  } catch { products.value = [] }

  await loadMesas()
  buildAwesompleteProd()
  buildAwesompleteCliente()
})

watch([prodMode, products], () => buildAwesompleteProd())

</script>

<style>
</style>

