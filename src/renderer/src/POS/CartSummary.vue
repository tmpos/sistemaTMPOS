<template>
  <div class="bg-white rounded-xl shadow-md flex flex-col h-full max-h-[80vh]">
    <!-- Header -->
    <div class="flex justify-between items-center border-b px-4 py-2 text-sm md:text-base">
      <div class="font-semibold text-gray-700">Table 01</div>
      <div class="text-gray-500">Order: <strong>#0029</strong></div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b text-sm">
      <button
        class="flex-1 py-2 text-center font-medium transition-all"
        :class="activeTab === 'current'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-blue-500'"
        @click="setActiveTab('current')"
      >
        New Order ({{ cart.length }})
      </button>
      <button
        class="flex-1 py-2 text-center font-medium transition-all"
        :class="activeTab === 'history'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-blue-500'"
        @click="setActiveTab('history')"
      >
        Order History (0)
      </button>
    </div>

    <!-- Body -->
    <div class="flex-grow overflow-y-auto p-2">
      <div v-if="activeTab === 'current'">
        <!-- Estado vacío -->
        <div v-if="!cart || cart.length === 0" class="flex flex-col items-center justify-center h-full py-10 text-gray-400">
          <svg class="w-20 h-20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <p class="text-lg font-medium">Carrito vacío</p>
          <p class="text-sm">Agrega productos para comenzar</p>
        </div>

        <!-- Producto -->
        <div
          v-else
          v-for="(item, index) in cart"
          :key="index"
          class="grid grid-cols-12 border-b pb-2 mb-2 gap-2 items-center"
        >
          <!-- Info + controles -->
          <div class="col-span-12 flex flex-col">
            <div class="font-semibold text-gray-800 text-sm md:text-base leading-tight">
              {{ item.nombre }}
            </div>
            <div v-if="item.selectedAddons?.length" class="text-xs text-gray-500 mb-1">
              Extras:
              <span v-for="(addon, i) in item.selectedAddons" :key="i">
                {{ addon.clave }} (+{{ addon.valor }})
                <span v-if="i < item.selectedAddons.length - 1">, </span>
              </span>
            </div>


            <!-- Controles -->
            <div class="grid grid-cols-12 w-full items-center gap-2 ">
              <!-- Grupo cantidad -->
              <div class="col-span-12 sm:col-span-4 md:col-span-12 lg:col-span-8 flex items-center justify-between border rounded-lg overflow-hidden shadow-sm">
                <button
                  class="bg-gray-200 text-gray-700 hover:bg-gray-300 flex-shrink-0 px-3 md:px-4 py-2 text-sm md:text-base font-bold transition-colors"
                  @click="decreaseQuantity(index)"
                >
                  −
                </button>
                <input
                  type="text"
                  v-model="item.quantity"
                  readonly
                  class="text-center border-x border-gray-300 text-sm md:text-base font-semibold select-none w-10 sm:w-12 md:w-14 flex-shrink-0"
                />
                <button
                  class="bg-gray-200 text-gray-700 hover:bg-gray-300 flex-shrink-0 px-3 md:px-4 py-2 text-sm md:text-base font-bold transition-colors"
                  @click="increaseQuantity(index)"
                >
                  +
                </button>
              </div>

              <!-- Botón eliminar -->
              <div class="col-span-12 sm:col-span-8 md:col-span-6 lg:col-span-4 flex justify-end">
                <button
                  class="text-red-500 hover:text-red-700 text-xl md:text-2xl transform transition-transform hover:scale-110"
                  @click="removeFromCart(index)"
                  title="Eliminar"
                >
                  🗑
                </button>
              </div>
            <!-- Precio -->
            <div class="col-span-12 md:col-span-6 lg:col-span-12 text-right text-sm md:text-base font-semibold text-gray-700">
              {{ (parseFloat(item.precio_venta)).toFixed(2) }}
            </div>

            </div>
          </div>

        </div>
      </div>

      <!-- Historial -->
      <div v-else class="text-gray-500 text-center py-10">
        Order history content goes here...
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t p-3 text-sm md:text-base">
<!--       <div class="flex justify-between mb-1">
        <span>Subtotal</span>
        <span>{{ subtotal }}</span>
      </div> -->
<!--       <div class="flex justify-between mb-1">
        <span>Taxes (18%)</span>
        <span>{{ taxes }}</span>
      </div> -->
      <div class="flex justify-between font-semibold border-t pt-2">
        <span>Total</span>
        <span>{{ total }}</span>
      </div>

      <div class="mt-3 flex gap-2">
        <button
          @click="onClearCart"
          :disabled="!cart || cart.length === 0 || loading"
          class="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md py-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Vaciar
        </button>
        <button
          @click="fnGuardarServicio"
          :disabled="!cart || cart.length === 0 || loading"
          class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md py-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Service
        </button>
        <button
          @click="fnMostrarPreCuenta"
          :disabled="!cart || cart.length === 0 || loading"
          class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md py-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Bill
        </button>
        <button
          @click="fnCompletar"
          :disabled="!cart || cart.length === 0 || loading"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {{ loading ? 'Procesando...' : 'Submit' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed,onMounted } from 'vue'
import Swal from 'sweetalert2'
import Awesomplete from 'awesomplete'
import 'awesomplete/awesomplete.css'
import {enviarDatosPorPost,
  eliminarDatos,
  obtenerIdsSeleccionados,
  borrarTodoslosDatos,
  lenguajeDataTable,
  nfecha,
  asientoDiario,
  decimales,
  transformarFechaTimestamp,
  peticiones,
  formatearFecha,
  generadorCodigo,
  arrayToObjetoFromTabla,
  peticionesFetch,
  encryptarPassword,
  permisosPagina,
  envioElectron,
  convertirAFechaTimestamp,
  arrayToObjetoFromTablaOffline,
    esFechaEnRango,
  mensajetoast,
  generarCodigoUnico,
  peticionesFetchOffline,
  enviarDatosLocalStorage,
  verificaAutentificado,
  lasMayusculas} from '@/funciones/funciones.js';
import { facturaNueva,facturaActualizar,restarStock } from '@/funciones/funcionesVentas.js';
/*********************************************************/
import {useDatosEmpresa} from '@/stores'
const datosEmpresa = useDatosEmpresa();
/*********************************************************/
const cuadre = ref({})
/*********************************************************/
const props = defineProps(['cart'])
const emit = defineEmits(['removeFromCart', 'updateCartItem', 'clearCart'])

const activeTab = ref('current')
const noFacturaFN = ref('')
const loading = ref(false)

const setActiveTab = (tab) => (activeTab.value = tab)

const decreaseQuantity = (index) => {
  if (!props.cart[index] || props.cart[index].quantity <= 1) return;

  const item = props.cart[index];
  item.quantity--;

  // Recalcular precio total del item
  const precioUnitario = calcularPrecioUnitario(item);
  item.precio_venta = (precioUnitario * item.quantity).toFixed(2);
  item.precio_final = item.precio_venta;
  item.total = item.precio_venta;

  emit('updateCartItem', item, index);
};

const increaseQuantity = (index) => {
  if (!props.cart[index]) return;

  const item = props.cart[index];
  item.quantity++;

  // Recalcular precio total del item
  const precioUnitario = calcularPrecioUnitario(item);
  item.precio_venta = (precioUnitario * item.quantity).toFixed(2);
  item.precio_final = item.precio_venta;
  item.total = item.precio_venta;

  emit('updateCartItem', item, index);
};

const removeFromCart = (index) => {
  if (!props.cart[index]) return;
  emit('removeFromCart', index);
};

const subtotal = computed(() => {
  if (!props.cart || props.cart.length === 0) return '0.00';
  return props.cart.reduce((sum, item) => {
    const itemTotal = parseFloat(item.precio_venta || 0);
    return sum + itemTotal;
  }, 0).toFixed(2);
});

const taxes = computed(() => (parseFloat(subtotal.value) * 0.18).toFixed(2));
const total = computed(() => parseFloat(subtotal.value).toFixed(2));

const onClearCart = async () => {
  if (!props.cart || props.cart.length === 0) return;
  const res = await Swal.fire({
    icon: 'warning',
    title: 'Vaciar carrito',
    text: '¿Deseas eliminar todos los productos del carrito?',
    showCancelButton: true,
    confirmButtonText: 'Sí, vaciar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  });
  if (res.isConfirmed) emit('clearCart');
};


/***************************************************************/
const comprobanteFN = ref('')
const comprobante = ref('NORMAL')
/***************************************************************/
const mensajeComprobantes = ref({
  'NORMAL':'SIN COMPROBANTE',
  'FISCAL':'COMPROBANTE CON VALOR FISCAL',
  'FINAL':'CONSUMIDOR FINAL',
  'REGIMEN ESPECIAL':'REGIMEN ESPECIAL',
  'GUBERNAMENTAL':'COMPROBANTE GUBERNAMENTAL',
})
/***************************************************************/
const vendedor = ref(datosEmpresa.usuario.nombre)
const cajero = ref(datosEmpresa.usuario.nombre)
const instaladorFN = ref('')
const meseroFN = ref('')
const mesaFN = ref('')
const noCheque = ref('')
const bancoCheque = ref('')
const chequeFN = ref('')
const deliveryFN = ref('')
const descuento = ref('0.00')
/***************************************************************/
const link = ref('');
const api = ref('');
const token = ref('');
const patronTelefono = ref('');
const linkImpresora = ref('');
const patroncedula = ref('');
const tokenCifrado = ref('');
const tokenCorto = ref('');
/***************************************************************/
  // 🔹 Lista de clientes (puedes traerla desde tu base local)
  const listaClientes = ref([
    { nombre: 'AL CONTADO', telefono: '' },
    { nombre: 'PEDRO GÓMEZ', telefono: '18095550101' },
    { nombre: 'JUAN PÉREZ', telefono: '18095550202' },
    { nombre: 'MARÍA REYES', telefono: '18095550303' },
    { nombre: 'SUPERMERCADO DONA ANA', telefono: '18095550404' },
    { nombre: 'FRANKLIN GALLARDO', telefono: '18095550505' },
    { nombre: 'LAST STOP APPLIANCE', telefono: '18095550606' }
  ]);
/************************************************************************/
  const fetchClientes = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'clientes');
    listaClientes.value = response;

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch data from empresa',
      life: 3000
    });
  }
};
/************************************************************************/
onMounted(async () => {
const datosJSON = await envioElectron('datosarchivo');

link.value = datosJSON.VITE_LINKURL;
api.value = datosJSON.VITE_LINK_API;
token.value = datosJSON.VITE_TOKEN;
patronTelefono.value = datosJSON.VITE_PATRON_TELEFONO;
linkImpresora.value = datosJSON.VITE_IMPRESORA_LOCAL;
tokenCorto.value = datosJSON.VITE_TOKEN_CORTO;
patroncedula.value = datosJSON.VITE_PATRON_CEDULA;

tokenCifrado.value = await encryptarPassword(token.value, 10);

await fetchClientes()

})
/***************************************************************/

const fnGuardarServicio = async () => {
  // Validar que hay items en el carrito
  if (!props.cart || props.cart.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Carrito vacío',
      text: 'Agrega productos antes de guardar el servicio',
      confirmButtonColor: '#2563eb'
    });
    return;
  }

  loading.value = true;

  try {
    // 🔹 Ejemplo de mesas (puedes usar tu array real)
    const mesas = [
      { id: 1, nombre: "Mesa 01", cliente: "", total: 0 },
      { id: 2, nombre: "Mesa 02", cliente: "", total: 0 },
      { id: 3, nombre: "Mesa 03", cliente: "", total: 0 },
      { id: 4, nombre: "Mesa 04", cliente: "", total: 0 },
      { id: 5, nombre: "Barra 01", cliente: "", total: 0 },
      { id: 6, nombre: "Barra 02", cliente: "", total: 0 },
    ];

  const htmlMesas = mesas.map(
    (m) => `
    <button
      class="mesa-btn w-full h-16 bg-gray-100 hover:bg-blue-100 text-gray-800 font-semibold rounded-lg border border-gray-300 shadow-sm transition-all duration-200"
      data-id="${m.id}"
    >
      🍽️ ${m.nombre}
    </button>
  `
  ).join("");

  const { value: mesaSeleccionada } = await Swal.fire({
    title: "Selecciona una Mesa",
    html: `
      <div class="mb-2 text-center">
        <span id="textoSeleccion" class="text-sm text-gray-600 italic">Ninguna mesa seleccionada</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">${htmlMesas}</div>
    `,
    width: "500px",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    confirmButtonText: "Confirmar",
    confirmButtonColor: "#2563eb",
    focusConfirm: false,
    didOpen: () => {
      const totalInput = Swal.getPopup().querySelector('#total')
      let impuestoAplicado = false
      let impuestoPorcentaje = 18
      let impuestoValor = 0

      const popup = Swal.getPopup();
      const botones = popup.querySelectorAll(".mesa-btn");
      const textoSeleccion = popup.querySelector("#textoSeleccion");
      let seleccionada = null;

      botones.forEach((btn) => {
        btn.addEventListener("click", () => {
          // 🔹 Remover selección previa
          botones.forEach((b) =>
            b.classList.remove(
              "!bg-blue-600",
              "!text-white",
              "!border-blue-600",
              "scale-105"
            )
          );

          // 🔹 Marcar nueva mesa seleccionada
          btn.classList.add(
            "!bg-blue-600",
            "!text-white",
            "!border-blue-600",
            "scale-105"
          );

          seleccionada = btn.dataset.id;

          // 🔹 Buscar el nombre de la mesa seleccionada
          const mesa = mesas.find((m) => m.id == seleccionada);

          // 🔹 Actualizar el texto directamente (sin Swal.update)
          if (textoSeleccion) {
            textoSeleccion.textContent = `Mesa seleccionada: ${mesa.nombre}`;
            textoSeleccion.classList.remove("text-gray-600", "italic");
            textoSeleccion.classList.add("text-blue-600", "font-semibold");
          }

          // 🔹 Guardamos el ID en el confirmButton
          Swal.getConfirmButton().setAttribute("data-id", seleccionada);
        });
      });
    },
    preConfirm: () => {
      const idSeleccionado = Swal.getConfirmButton().getAttribute("data-id");
      if (!idSeleccionado) {
        Swal.showValidationMessage(
          "⚠️ Debes seleccionar una mesa antes de continuar."
        );
        return false;
      }
      return mesas.find((m) => m.id == idSeleccionado);
    },
  });

  if (!mesaSeleccionada) return;

  // 🔹 Crear pedido
  const pedido = {
    mesa_id: mesaSeleccionada.id,
    mesa_nombre: mesaSeleccionada.nombre,
    cliente: mesaSeleccionada.cliente || "Pendiente",
    productos: props.cart,
    subtotal: subtotal.value,
    total: total.value,
    estado: "EN SERVICIO",
    fecha: new Date().toISOString(),
  };

  // 🔹 Guardar localmente
  await peticionesFetchOffline("insertData", "mesas", JSON.stringify(pedido));

  // 🔹 Confirmación visual
  Swal.fire({
    iconHtml: "👨‍🍳",
    title: "Pedido Enviado",
    html: `
      <p class="text-gray-700">El pedido fue asignado a <strong>${mesaSeleccionada.nombre}</strong>.</p>
      <p class="text-green-600 font-semibold mt-2">¡Enviado a cocina con éxito!</p>
    `,
    showConfirmButton: false,
    timer: 2500,
    background: "#f9fafb",
    color: "#111827",
    backdrop: `
      rgba(0,0,0,0.4)
      url("https://cdn-icons-png.flaticon.com/512/1046/1046857.png")
      no-repeat center top
    `,
  });

  // 🔹 Limpiar carrito
  props.cart.splice(0, props.cart.length);
  } catch (error) {
    console.error('Error al guardar servicio:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar el servicio. Intenta nuevamente.',
      confirmButtonColor: '#2563eb'
    });
  } finally {
    loading.value = false;
  }
};

/***************************************************************/
const fnMostrarPreCuenta = () => {
  // Validar que hay items en el carrito
  if (!props.cart || props.cart.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Carrito vacío',
      text: 'Agrega productos antes de generar la pre-cuenta',
      confirmButtonColor: '#2563eb'
    });
    return;
  }

  const htmlItems = props.cart.map(item =>
    `<tr>
      <td>${item.nombre}</td>
      <td>${item.quantity}</td>
      <td class="text-right">${parseFloat(item.precio_venta).toFixed(2)}</td>
      <td class="text-right">${(item.quantity * parseFloat(item.precio_venta)).toFixed(2)}</td>
    </tr>`
  ).join('')

  Swal.fire({
    title: '🧾 Pre-Cuenta',
    html: `
      <table class="w-full text-sm text-gray-700 border-collapse">
        <thead>
          <tr class="border-b border-gray-300">
            <th class="text-left">Producto</th>
            <th class="text-left">Cant</th>
            <th class="text-right">Precio</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>${htmlItems}</tbody>
      </table>
      <div class="text-right mt-3 font-semibold">
        Subtotal: ${subtotal.value}<br/>
        ITBIS (18%): ${taxes.value}<br/>
        Total: ${total.value}
      </div>
    `,
    width: 600,
    confirmButtonText: 'Imprimir o Enviar',
    confirmButtonColor: '#2563eb'
  }).then(res => {
    if (res.isConfirmed) {
      // Puedes llamar a tu fnCompletar() aquí directamente:
      fnCompletar()
    }
  })
}

/***************************************************************/
const fnCompletar = async () => {
  // Validar que hay items en el carrito
  if (!props.cart || props.cart.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Carrito vacío',
      text: 'Agrega productos antes de completar la venta',
      confirmButtonColor: '#2563eb'
    });
    return;
  }

  loading.value = true;

  // Asegurar alcance de resultadoFinal en toda la función
  let resultadoFinal = null;

  try {
    const totalVenta = parseFloat(total.value);

    if (isNaN(totalVenta) || totalVenta <= 0) {
      throw new Error('Total inválido');
    }

// 🔹 Valores comunes de billetes / montos sugeridos
const escalones = [1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];

// 🔹 Función para calcular el próximo escalón igual o superior
function siguienteEscalon(valor) {
  for (let i = 0; i < escalones.length; i++) {
    if (valor <= escalones[i]) return escalones[i];
  }
  // Si es mayor que todos, seguir sumando en múltiplos de 1000
  return Math.ceil(valor / 1000) * 1000;
}

// 🔹 Calculamos hasta 5 sugeridos
const sugeridoBase = siguienteEscalon(totalVenta);
const index = escalones.indexOf(sugeridoBase);

const sugeridos = [
  sugeridoBase,
  escalones[index + 1] || sugeridoBase * 2,
  escalones[index + 2] || sugeridoBase * 4,
  escalones[index + 3] || sugeridoBase * 6,
  escalones[index + 4] || sugeridoBase * 8
];


  // 🔹 PRIMERA MODAL
  const { value: datos } = await Swal.fire({
    title: 'Finalizar Venta',
html: `
  <div class="grid grid-cols-12 gap-3 text-left w-full max-w-lg mx-auto">

<!-- Cliente con botones -->
<div class="col-span-12">
  <label class="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
  <div class="flex items-center gap-2">
    <div class="flex-1 relative">
      <input id="cliente" type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700 placeholder-gray-400 pr-16"
        value="AL CONTADO" />
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        <button id="btn-limpiar" class="p-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 text-xs" title="Limpiar">
          <i class="pi pi-eraser"></i>
        </button>
        <button id="btn-default" class="p-2 bg-blue-100 hover:bg-blue-200 rounded-md text-blue-700 text-xs" title="Cliente por defecto">
          <i class="pi pi-user"></i>
        </button>
      </div>
    </div>
  </div>
</div>



    <!-- WhatsApp -->
    <div class="col-span-12 sm:col-span-6">
      <label class="block text-sm font-semibold text-gray-700 mb-1">Número de WhatsApp</label>
      <input id="numeroWA" type="tel"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-700 placeholder-gray-400"
        placeholder="Ej: 18095551234" />
    </div>

    <!-- Tipo de pago -->
    <div class="col-span-6 sm:col-span-3">
      <label class="block text-sm font-semibold text-gray-700 mb-1">Tipo de Pago</label>
      <select id="tipoPago"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700">
        <option value="EFECTIVO">EFECTIVO</option>
        <option value="TARJETA">TARJETA</option>
        <option value="TRANSFERENCIA">TRANSFERENCIA</option>
        <option value="MIXTO">MIXTO</option>
      </select>
    </div>

    <!-- Total -->
    <div class="col-span-6 sm:col-span-3">
      <label class="block text-sm font-semibold text-gray-700 mb-1">Total a Pagar</label>
      <input id="total" type="number"
        class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-800"
        value="${totalVenta.toFixed(2)}" readonly />
    </div>

    <!-- Monto recibido -->
    <div class="col-span-6 sm:col-span-3">
      <label class="block text-sm font-semibold text-gray-700 mb-1">Monto Recibido</label>
      <input id="pagado" type="number"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700"
        value="${totalVenta.toFixed(2)}" />
    </div>

    <!-- Cambio -->
    <div class="col-span-6 sm:col-span-3">
      <label class="block text-sm font-semibold text-gray-700 mb-1">Cambio</label>
      <input id="cambio" type="number"
        class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-800"
        value="0.00" readonly />
    </div>

<!-- Botones rápidos -->
<div class="col-span-12 grid grid-cols-3 gap-2 mt-1">
  <button id="btn-total"
    class="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-md font-semibold transition">
    ${totalVenta.toFixed(2)}
  </button>
  ${sugeridos
    .slice(0, 2)
    .map(
      (s, i) => `
      <button id="btn-sugerido${i + 1}"
        class="bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-md font-semibold transition">
        ${s.toFixed(2)}
      </button>`
    )
    .join('')}
</div>

<div class="col-span-12 grid grid-cols-3 gap-2 mt-1">
  ${sugeridos
    .slice(2)
    .map(
      (s, i) => `
      <button id="btn-sugerido${i + 3}"
        class="bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-md font-semibold transition">
        ${s.toFixed(2)}
      </button>`
    )
    .join('')}
</div>


  <!-- Impuesto -->
  <div class="col-span-12 mt-2">
    <button id="btn-impuesto" class="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">
      Agregar impuesto
    </button>
  </div>
    <!-- Observación -->
    <div class="col-span-12 mt-2">
      <label class="block text-sm font-semibold text-gray-700 mb-1">Observación (opcional)</label>
      <textarea id="observacion"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700 placeholder-gray-400 resize-none"
        rows="2" placeholder="Ej. mesa 3, cliente frecuente..."></textarea>
    </div>
  </div>
`,

    focusConfirm: false,
    width: '600px',
    showCancelButton: true,
    confirmButtonText: '💾 Confirmar Venta',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#2563eb',
    didOpen: () => {
      const totalInput = Swal.getPopup().querySelector('#total')
      let impuestoAplicado = false
      let impuestoPorcentaje = 18
      let impuestoValor = 0
      const pagadoInput = Swal.getPopup().querySelector('#pagado')
      const cambioInput = Swal.getPopup().querySelector('#cambio')


      const clienteInput = Swal.getPopup().querySelector('#cliente')
      const numeroWAInput = Swal.getPopup().querySelector('#numeroWA');

     const nombres = listaClientes.value.map(c => c.nombre);
      const awesomplete = new Awesomplete(clienteInput, {
        list: nombres,
        minChars: 1,
        autoFirst: true,
        maxItems: 8
      });



const btnLimpiar = Swal.getPopup().querySelector('#btn-limpiar');
const btnDefault = Swal.getPopup().querySelector('#btn-default');

btnLimpiar.addEventListener('click', () => {
  clienteInput.value = '';
  numeroWAInput.value = '';
  clienteInput.focus();
});

btnDefault.addEventListener('click', () => {
  clienteInput.value = 'AL CONTADO';
  numeroWAInput.value = '';
  clienteInput.focus();
});




  // Cuando cambia el cliente, actualizar el teléfono
  clienteInput.addEventListener('awesomplete-selectcomplete', (e) => {
    const seleccionado = listaClientes.value.find(c => c.nombre === e.text.value);
    numeroWAInput.value = seleccionado ? seleccionado.telefono : '';
  });

  // Si escribe manualmente, buscar coincidencias parciales
  clienteInput.addEventListener('input', () => {
    const encontrado = listaClientes.value.find(c => c.nombre.toLowerCase() === clienteInput.value.toLowerCase());
    numeroWAInput.value = encontrado ? encontrado.telefono : '';
  });


      const recalcularCambio = () => {
        const pagado = parseFloat(pagadoInput.value) || 0
        const totalInput = Swal.getPopup().querySelector('#total'); const baseTotal = parseFloat(totalInput && totalInput.value ? totalInput.value : totalVenta.toFixed(2)); const cambio = pagado - baseTotal
        cambioInput.value = cambio >= 0 ? cambio.toFixed(2) : '0.00'
      }

      pagadoInput.addEventListener('input', recalcularCambio)
      Swal.getPopup().querySelector('#btn-total').addEventListener('click', () => { pagadoInput.value = totalVenta.toFixed(2); recalcularCambio() })

// 🔹 Listeners para los 5 sugeridos
  sugeridos.forEach((s, i) => {
    const btn = Swal.getPopup().querySelector(`#btn-sugerido${i + 1}`);
    if (btn) {
      btn.addEventListener('click', () => {
        pagadoInput.value = s.toFixed(2);
        recalcularCambio();
      });
    }
  });


      // Botón impuesto: toggle 18%
      const btnImpuesto = Swal.getPopup().querySelector('#btn-impuesto');
      if (btnImpuesto) {
        btnImpuesto.addEventListener('click', () => {
          impuestoAplicado = !impuestoAplicado;
          impuestoValor = impuestoAplicado ? (totalVenta * (impuestoPorcentaje / 100)) : 0;
          const nuevoTotal = (totalVenta + impuestoValor).toFixed(2);
          if (totalInput) totalInput.value = nuevoTotal;
          btnImpuesto.textContent = impuestoAplicado ? 'Quitar impuesto' : 'Agregar impuesto';
          recalcularCambio();
        });
      }

    },
    preConfirm: () => {
      const cliente = Swal.getPopup().querySelector('#cliente').value.trim()
      const tipoPago = Swal.getPopup().querySelector('#tipoPago').value
      const pagado = parseFloat(Swal.getPopup().querySelector('#pagado').value || 0)
      const cambio = parseFloat(Swal.getPopup().querySelector('#cambio').value || 0)
      const observacion = Swal.getPopup().querySelector('#observacion').value.trim()
      const totalInput = Swal.getPopup().querySelector('#total')
      const totalFinal = parseFloat(totalInput && totalInput.value ? totalInput.value : totalVenta)

      //return { cliente, tipoPago, pagado, cambio, observacion }
    const clienteObj = listaClientes.value.find(c => c.nombre.toLowerCase() === cliente.toLowerCase()) || { nombre: cliente, telefono: '' }
    console.log("clienteObj", clienteObj);

    return { clienteObj, tipoPago, pagado, cambio, observacion, totalFinal, impuesto: Math.max(0, totalFinal - totalVenta) }

    }
  })

  if (!datos) return

  let efectivo = 0, tarjeta = 0, transferencia = 0

  // 🔹 SI ES MIXTO
  if (datos.tipoPago === 'MIXTO') {
    const { value: mix } = await Swal.fire({
      title: 'Pago Mixto',
      html: `
        <div class="grid grid-cols-12 gap-3 text-left w-full max-w-lg mx-auto">
          <div class="col-span-12">
            <label class="block text-sm font-semibold text-gray-700 mb-1">Selecciona combinación</label>
            <select id="combo" class="swal2-select !w-full">
              <option value="EFECTIVO_TARJETA">Efectivo + Tarjeta</option>
              <option value="EFECTIVO_TRANSFERENCIA">Efectivo + Transferencia</option>
              <option value="TARJETA_TRANSFERENCIA">Tarjeta + Transferencia</option>
              <option value="EFECTIVO_TARJETA_TRANSFERENCIA">Efectivo + Tarjeta + Transferencia</option>
            </select>
          </div>
          <div id="montos-container" class="col-span-12 mt-3"></div>
        </div>
      `,
      focusConfirm: false,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: '✅ Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      didOpen: () => {
      const totalInput = Swal.getPopup().querySelector('#total')
      let impuestoAplicado = false
      let impuestoPorcentaje = 18
      let impuestoValor = 0

        const container = Swal.getPopup().querySelector('#montos-container')
        const combo = Swal.getPopup().querySelector('#combo')

        const renderCampos = () => {
          const seleccion = combo.value.split('_')
          const partes = seleccion.length
          const montoInicial = (totalVenta / partes).toFixed(2)

          container.innerHTML = seleccion.map(
            (tipo) => `
              <div class="flex items-center justify-between gap-2 mb-2">
                <label class="w-32 text-sm font-semibold text-gray-700">${tipo}</label>
                <input type="number" id="${tipo}" value="${montoInicial}" class="swal2-input !w-40 text-right" />
              </div>
            `
          ).join('')

          const inputs = seleccion.map((t) => Swal.getPopup().querySelector(`#${t}`))
          inputs.forEach((input, index) => {
            input.addEventListener('input', () => {
              const current = parseFloat(input.value) || 0
              const others = inputs.filter((_, i) => i !== index)
              const sumOthers = others.reduce((sum, el) => sum + parseFloat(el.value) || 0, 0)
              const totalActual = current + sumOthers

              if (Math.abs(totalActual - totalVenta) > 0.01) {
                const diferencia = totalVenta - current
                const nuevoValor = diferencia / others.length
                others.forEach((el) => {
                  el.value = nuevoValor >= 0 ? nuevoValor.toFixed(2) : 0
                })
              }
            })
          })
        }

        combo.addEventListener('change', renderCampos)
        renderCampos()
      },
      preConfirm: () => {
        const combo = Swal.getPopup().querySelector('#combo').value.split('_')
        const montos = {}
        let suma = 0
        combo.forEach((tipo) => {
          const val = parseFloat(Swal.getPopup().querySelector(`#${tipo}`).value || 0)
          montos[tipo] = val
          suma += val
        })

        if (Math.abs(suma - totalVenta) > 0.01) {
          Swal.showValidationMessage('⚠️ La suma de los montos debe ser igual al total.')
          return false
        }

        return montos
      }
    })

    if (mix) {
      efectivo = mix.EFECTIVO || 0
      tarjeta = mix.TARJETA || 0
      transferencia = mix.TRANSFERENCIA || 0
    }
  } else {
    // 🔹 Si no es mixto, asignar según el tipo
    if (datos.tipoPago === 'EFECTIVO') efectivo = (typeof datos.totalFinal !== 'undefined' ? datos.totalFinal : totalVenta)
    if (datos.tipoPago === 'TARJETA') tarjeta = (typeof datos.totalFinal !== 'undefined' ? datos.totalFinal : totalVenta)
    if (datos.tipoPago === 'TRANSFERENCIA') transferencia = (typeof datos.totalFinal !== 'undefined' ? datos.totalFinal : totalVenta)
  }

  // 🔹 Resultado unificado
resultadoFinal = {
  cliente: datos.clienteObj.nombre,
  clienteData: datos.clienteObj,
  tipoPago: datos.tipoPago,
  observacion: datos.observacion,
  impuesto: (typeof datos.impuesto !== 'undefined' ? parseFloat(datos.impuesto) : 0),
  total: (typeof datos.totalFinal !== 'undefined' ? datos.totalFinal : totalVenta),
  pagado: datos.pagado,
  cambio: datos.cambio,
  efectivo,
  tarjeta,
  transferencia,
  fecha: new Date().toISOString(),
  // 🧾 Productos del carrito (con datos relevantes)
  productos: props.cart.map(item => ({
    id: item.id || null,
    nombre: item.nombre,
    cantidad: item.quantity,
    precio_unitario: parseFloat(item.precio_venta),
    subtotal: (parseFloat(item.precio_venta) * item.quantity).toFixed(2),
    caracteristica: item.caracteristica || '',
    size: item.selectedSize?.label || '',
    imagen: item.imagen || ''
  }))
}

  console.log('✅ DATOS FINALES DE LA VENTA:', resultadoFinal)

  /**********************************************/
  /*************AQUI VA LA VENTA ***************/
noFacturaFN.value = generarCodigoUnico()

const datosFN = {
  nofactura: noFacturaFN.value,
  cliente: resultadoFinal.clienteData,
  canalventa: datosEmpresa.empresa?.nombre || "Local",
  entidad_financiera: resultadoFinal.tipoPago || "EFECTIVO",
  comprobanteFN: comprobanteFN?.value || "",
  tipocomprobanteFN: mensajeComprobantes?.value?.[comprobante?.value] || "",
  estadoFN: "COMPLETADA",
  metodoPagoFN: resultadoFinal.tipoPago,
  efectivoFN: resultadoFinal.efectivo || 0,
  tarjetaFN: resultadoFinal.tarjeta || 0,
  transferenciaFN: resultadoFinal.transferencia || 0,
  vendedorFN: vendedor?.value || "DESCONOCIDO",
  cajeroFN: cajero?.value || "CAJA 1",
  instaladorFN: instaladorFN?.value || "",
  meseroFN: meseroFN?.value || "",
  mesaFN: mesaFN?.value || "",
  pagaCon: resultadoFinal.pagado || total.value,
  suCambio: resultadoFinal.cambio || 0,
  noCheque: noCheque?.value || "",
  bancoCheque: bancoCheque?.value || "",
  chequeFN: chequeFN?.value || "",
  deliveryFN: deliveryFN?.value || "",
  subtotal: subtotal.value,
  total: total.value,
  impuesto: taxes.value || 0,
  ganancia: 0, // puedes calcularla si tienes costo unitario
  descuento: descuento?.value || 0,
  nota: resultadoFinal.observacion || "",
  almacen: datosEmpresa.empresa?.nombre || "Tienda Principal",

  // 🧾 Productos detallados
  productosArray: props.cart,

  // 🕒 Fechas y sincronización
  created_at: nfecha('timestamp'),
  updated_at: nfecha('timestamp'),
  sincronizado: 0
};


/*  const verificaFactura = await peticionesFetchOffline('getDataByField', 'facturas', 'no_factura', noFacturaFN.value);*/
  const verificaFactura = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',noFacturaFN.value);

  if (verificaFactura?.no_factura && verificaFactura?.no_factura == noFacturaFN.value) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Esta Factura Ya existe', life: 3000 });
    loading.value = false;
    return;
  }

  //const url = `${link.value}${api.value}/insertar/facturas`;
  const url = ``;
  const retorno = await facturaNueva(url, datosFN, 'POST', tokenCifrado.value);




  /**********************************************/

Swal.fire({
  icon: 'success',
  title: '✅ Venta Completada',
  html: `
    <div class="text-left space-y-1">
      <p><strong>Cliente:</strong> ${resultadoFinal.cliente}</p>
      <p><strong>Tipo de pago:</strong> ${resultadoFinal.tipoPago}</p>
      <p><strong>Efectivo:</strong> ${resultadoFinal.efectivo.toFixed(2)}</p>
      <p><strong>Tarjeta:</strong> ${resultadoFinal.tarjeta.toFixed(2)}</p>
      <p><strong>Transferencia:</strong> ${resultadoFinal.transferencia.toFixed(2)}</p>
      <p class="mt-1"><strong>Total:</strong> ${resultadoFinal.total.toFixed(2)}</p>
      <p><strong>Impuesto:</strong> ${resultadoFinal.impuesto.toFixed(2)}</p>
      <p><strong>Cambio:</strong> ${resultadoFinal.cambio.toFixed(2)}</p>
      <p class="mt-2"><strong>Productos:</strong> ${resultadoFinal.productos.length}</p>
    </div>

    <div class="grid grid-cols-3 gap-3 mt-4">
      <button id="btnCerrar" class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md">Cerrar</button>
      <button id="btnWhatsapp" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-md">WhatsApp</button>
      <button id="btnImprimir" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md">Imprimir</button>
    </div>
  `,
  showConfirmButton: false,
  width: '500px',
  didOpen: () => {
      const totalInput = Swal.getPopup().querySelector('#total')
      let impuestoAplicado = false
      let impuestoPorcentaje = 18
      let impuestoValor = 0

    // 🔹 Botón Cerrar
    Swal.getPopup().querySelector('#btnCerrar').addEventListener('click', () => Swal.close())

    // 🔹 Botón Imprimir
    Swal.getPopup().querySelector('#btnImprimir').addEventListener('click', async() => {
      const datosFactura = await peticionesFetchOffline('getDataByField', 'facturas','no_factura',datosFN.nofactura);
        const datosEmpresaA = JSON.stringify(enviarDatosLocalStorage() )
        window.electron.ipcRenderer.invoke('ticket',JSON.stringify(datosFactura),datosEmpresaA);
       fnImprimir(resultadoFinal)
    })

    // 🔹 Botón WhatsApp
    Swal.getPopup().querySelector('#btnWhatsapp').addEventListener('click', () => {
      fnEnviarWhatsApp(resultadoFinal)
    })
  }
})

props.cart.splice(0, props.cart.length);

  } catch (error) {
    console.error('Error al completar venta:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'No se pudo completar la venta. Intenta nuevamente.',
      confirmButtonColor: '#2563eb'
    });
  } finally {
    loading.value = false;
  }

  return resultadoFinal;
};

/* ===========================================================
   Funciones auxiliares (puedes personalizarlas)
   =========================================================== */

// 🖨️ Imprimir ticket o factura
async function fnImprimir(data) {
  console.log('🖨️ Imprimiendo venta...', data)
  Swal.fire({
    icon: 'info',
    title: '🖨️ Imprimiendo...',
    text: `Preparando impresión para ${data.cliente}`,
    timer: 1500,
    showConfirmButton: false
  })
}

// 💬 Enviar por WhatsApp
// 💬 Enviar por WhatsApp (optimizado)
async function fnEnviarWhatsApp(data) {
  // 🔍 Buscar el número del cliente en la lista
  const clienteEncontrado = listaClientes.find(
    c => c.nombre.toLowerCase() === data.cliente.toLowerCase()
  );
  let telefono = clienteEncontrado?.telefono || '';

  // Si no tiene número, mostrar modal para ingresarlo
  if (!telefono) {
    const { value: telefonoIngresado } = await Swal.fire({
      title: 'Enviar por WhatsApp',
      html: `
        <div class="text-left space-y-2">
          <label for="numeroWA" class="block text-sm font-semibold text-gray-700">
            Número de WhatsApp
          </label>
          <input
            id="numeroWA"
            type="tel"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-700 placeholder-gray-400"
            placeholder="Ej: 18095551234"
          />
        </div>
      `,
      focusConfirm: false,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
      confirmButtonColor: '#25D366',
      didOpen: () => {
      const totalInput = Swal.getPopup().querySelector('#total')
      let impuestoAplicado = false
      let impuestoPorcentaje = 18
      let impuestoValor = 0

        Swal.getPopup().querySelector('#numeroWA').focus();
      },
      preConfirm: () => {
        const input = Swal.getPopup().querySelector('#numeroWA').value.trim();
        if (!input.match(/^\d{10,13}$/)) {
          Swal.showValidationMessage('📱 Introduce un número válido (10-13 dígitos)');
          return false;
        }
        return input;
      },
    });

    if (!telefonoIngresado) return;
    telefono = telefonoIngresado;
  }

  // Crear mensaje
  const mensaje = encodeURIComponent(
    `🧾 *Factura de ${data.cliente}*\n` +
    `💵 *Total:* RD$${data.total.toFixed(2)}\n` +
    `💰 *Efectivo:* ${data.efectivo.toFixed(2)}\n` +
    `💳 *Tarjeta:* ${data.tarjeta.toFixed(2)}\n` +
    `🏦 *Transferencia:* ${data.transferencia.toFixed(2)}\n` +
    `🕒 *Fecha:* ${new Date(data.fecha).toLocaleString('es-DO')}\n\n` +
    `🙏 ¡Gracias por su compra!`
  );

  // Abrir WhatsApp
  const url = `https://wa.me/${telefono}?text=${mensaje}`;
  window.open(url, '_blank');

  Swal.fire({
    icon: 'success',
    title: '✅ Enviado a WhatsApp',
    text: `Mensaje preparado para ${telefono}`,
    timer: 2000,
    showConfirmButton: false,
  });
}

/**************************************************************/
// Calcular precio unitario (precio base + extras)
const calcularPrecioUnitario = (item) => {
  if (!item) return 0;

  // Si el item ya viene con precio_venta calculado y cantidad, obtener el unitario
  const precioActual = parseFloat(item.precio_venta || 0);
  const cantidad = item.quantity || 1;

  // Dividir para obtener el precio unitario
  return precioActual / cantidad;
};

// Calcular precio total del item (unitario * cantidad)
const calcularPrecioTotal = (item) => {
  if (!item) return 0;
  const precioUnitario = calcularPrecioUnitario(item);
  return precioUnitario * (item.quantity || 1);
};

/**************************************************************/

</script>

<style>
/* Scrollbar sutil */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.6);
  border-radius: 4px;
}
</style>






