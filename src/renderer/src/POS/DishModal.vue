<template>
  <!-- Backdrop con z-index alto -->
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" @click.self="close">
    <div class="w-full max-w-2xl">
      <div
        class="bg-white rounded-xl shadow-xl overflow-hidden animate-fade-in"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center p-4 border-b">
          <h5 class="text-lg font-bold text-white">
            {{ dish.nombre }}
          </h5>
          <button
            type="button"
            class="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
            @click="close"
            title="Cerrar"
          >
            ×
          </button>
        </div>

        <!-- Body con scroll -->
        <div class="p-5 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Imagen -->
            <div class="relative">
              <img
                :src="dish.imagen"
                :alt="dish.nombre"
                class="w-full h-64 md:h-80 rounded-lg shadow-md object-cover border-2 border-gray-100"
                @error="$event.target.src = 'https://via.placeholder.com/400x400?text=Sin+Imagen'"
              />
              <!-- Badge de precio base -->
              <div class="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full shadow-lg">
                <span class="text-sm font-bold">RD$ {{ parseFloat(dish.precio_venta || 0).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Info -->
            <div>
              <p class="text-gray-700 mb-3">
                {{ dish.descripcion || dish.caracteristica || 'Sin descripción disponible.' }}
              </p>

              <!-- Precio total -->
              <p class="text-lg font-bold text-green-600 mt-2 transition-all duration-300">
                Total: RD$ {{ totalPrice.toFixed(2) }}
              </p>

              <!-- ✅ Addons -->
              <div v-if="addons.length > 0" class="mt-4">
                <label class="font-semibold text-gray-700 mb-1 block">Extras:</label>
                <div class="space-y-2">
                  <div
                    v-for="addon in addons"
                    :key="addon.clave"
                    class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition"
                  >
                    <input
                      type="checkbox"
                      class="form-check-input accent-blue-600 w-4 h-4"
                      :id="addon.clave"
                      :value="addon.valor"
                      v-model="selectedAddons"
                    />
                    <label
                      :for="addon.clave"
                      class="cursor-pointer select-none text-gray-700"
                    >
                      {{ addon.clave }}
                      <span class="text-sm text-gray-500"
                        >+RD$ {{ parseFloat(addon.valor || 0).toFixed(2) }}</span
                      >
                    </label>
                  </div>
                </div>
              </div>

              <!-- 🔢 Cantidad -->
              <div class="flex items-center gap-3 mt-6">
                <button
                  class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="decreaseQuantity"
                  :disabled="quantity <= 1"
                >
                  -
                </button>
                <input
                  type="number"
                  v-model.number="quantity"
                  @keydown.enter="addToCart"
                  min="1"
                  max="999"
                  class="border rounded text-center w-20 py-1 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="increaseQuantity"
                  :disabled="quantity >= 999"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center gap-3 border-t border-gray-200 bg-gray-50 p-4">
          <!-- Total destacado -->
          <div class="flex flex-col">
            <span class="text-xs text-gray-500">Total</span>
            <span class="text-2xl font-bold text-green-600">RD$ {{ totalPrice.toFixed(2) }}</span>
          </div>

          <!-- Botones -->
          <div class="flex gap-2">
            <button
              type="button"
              class="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-all"
              @click="close"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all shadow-md hover:shadow-lg"
              @click="addToCart"
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  dish: { type: Object, required: true },
});
const emit = defineEmits(['close', 'addToCart']);

// Cerrar modal con tecla ESC
const handleEscape = (e) => {
  if (e.key === 'Escape') {
    close();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
  // Prevenir scroll del body
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  // Restaurar scroll del body
  document.body.style.overflow = '';
});

// 🧩 Estado
const quantity = ref(1);
const selectedAddons = ref([]);

// 🧾 Cargar addons desde el JSON de características
const addons = ref([]);
watch(
  () => props.dish,
  () => {
    try {
      const parsed = JSON.parse(props.dish.caracteristicas || '[]');
      addons.value = Array.isArray(parsed) ? parsed : [];
    } catch {
      addons.value = [];
    }
  },
  { immediate: true }
);

// 💰 Calcular precio dinámico
const basePrice = computed(() =>
  parseFloat(props.dish.precio_final || props.dish.precio_venta || 0)
);

const totalPrice = computed(() => {
  const addonsTotal = selectedAddons.value.reduce(
    (sum, val) => sum + parseFloat(val || 0),
    0
  );
  return (basePrice.value + addonsTotal) * quantity.value;
});

// 🔽 Control cantidad con validaciones
const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const increaseQuantity = () => {
  if (quantity.value < 999) {
    quantity.value++;
  }
};

// 🛒 Agregar al carrito con validaciones
const addToCart = () => {
  if (!props.dish) {
    console.error('No hay producto seleccionado');
    return;
  }

  if (quantity.value < 1 || quantity.value > 999) {
    console.error('Cantidad inválida');
    return;
  }

  const selectedLabels = addons.value
    .filter(a => selectedAddons.value.includes(a.valor))
    .map(a => a.clave);

  const item = {
    ...props.dish,
    nombre:
      props.dish.nombre +
      (selectedLabels.length ? ' + ' + selectedLabels.join(' + ') : ''),
    quantity: quantity.value,
    cantidad: quantity.value,
    selectedAddons: addons.value.filter(a => selectedAddons.value.includes(a.valor)),
    total: totalPrice.value.toFixed(2),
    precio_venta: totalPrice.value.toFixed(2),
    precio_final: totalPrice.value.toFixed(2)
  };

  emit('addToCart', item);

  // Resetear valores después de agregar
  quantity.value = 1;
  selectedAddons.value = [];
};


// ❌ Cerrar modal
const close = () => emit('close');
</script>

<style scoped>
/* 🔹 Animación suave del modal */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Asegurar que el modal esté por encima de todo */
.z-50 {
  z-index: 9999 !important;
}

/* Scrollbar personalizado para el body del modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Firefox scrollbar */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}
</style>
