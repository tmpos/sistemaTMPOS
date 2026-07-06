<template>
  <main class="comanda-taller">
    <header class="comanda-header">
      <div>
        <span class="comanda-kicker">Taller</span>
        <h1>Comanda de Reparaciones</h1>
      </div>
      <div class="comanda-clock">
        <strong>{{ horaActual }}</strong>
        <span>{{ fechaActual }}</span>
      </div>
    </header>

    <section class="comanda-summary">
      <article v-for="estado in estadosComanda" :key="`resumen-${estado.key}`" class="summary-card" :class="estado.className">
        <span>{{ estado.label }}</span>
        <strong>{{ ordenesPorEstado[estado.key]?.length || 0 }}</strong>
      </article>
    </section>

    <section class="comanda-view-switch" aria-label="Modo de vista de la comanda">
      <button
        v-for="estado in estadosComanda"
        :key="`switch-${estado.key}`"
        type="button"
        :class="{ active: modoVista === estado.key }"
        @click="modoVista = estado.key"
      >
        <i :class="estado.icon"></i>
        {{ estado.label }}
      </button>
      <button
        type="button"
        :class="{ active: modoVista === 'todos' }"
        @click="modoVista = 'todos'"
      >
        <i class="pi pi-th-large"></i>
        Todos
      </button>
    </section>

    <section class="comanda-board">
      <article v-for="estado in estadosVisibles" :key="estado.key" class="status-lane" :class="estado.className">
        <div class="lane-head">
          <div>
            <span>{{ estado.label }}</span>
            <strong>{{ ordenesPorEstado[estado.key]?.length || 0 }}</strong>
          </div>
          <i :class="estado.icon"></i>
        </div>

        <div class="lane-list">
          <div v-if="!ordenesPorEstado[estado.key]?.length" class="empty-state">
            Sin ordenes
          </div>

          <article
            v-for="orden in ordenesPorEstado[estado.key]"
            :key="orden.id || orden.no_factura || `${orden.nombre}-${orden.imei}`"
            class="order-card"
          >
            <div class="order-top">
              <span class="order-number">{{ orden.no_factura || `#${orden.id || '-'}` }}</span>
              <span class="order-time">{{ obtenerTiempoOrden(orden) }}</span>
            </div>

            <h2>{{ obtenerEquipo(orden) }}</h2>
            <p class="order-client">{{ orden.nombre || 'Cliente sin nombre' }}</p>

            <div class="order-details">
              <span v-if="orden.imei"><i class="pi pi-mobile"></i>{{ orden.imei }}</span>
              <span v-if="orden.tecnico"><i class="pi pi-user"></i>{{ normalizarTecnico(orden.tecnico) }}</span>
              <span v-if="orden.telefono"><i class="pi pi-phone"></i>{{ orden.telefono }}</span>
              <span v-if="orden.fecha_entrega"><i class="pi pi-calendar"></i>{{ orden.fecha_entrega }}</span>
            </div>

            <div class="order-problem">
              <span>Falla</span>
              <p>{{ formatearFallas(orden.fallas || orden.observaciones || 'Sin detalle registrado') }}</p>
            </div>

            <div v-if="orden.reparacion || orden.piezas" class="order-work">
              <span v-if="orden.reparacion">{{ limpiarTexto(orden.reparacion) }}</span>
              <span v-if="orden.piezas">{{ limpiarTexto(orden.piezas) }}</span>
            </div>

            <div class="order-actions">
              <button
                type="button"
                class="order-status-btn"
                :class="`status-btn--${normalizarEstado(orden.estado)}`"
                @click="abrirMenuEstado(orden)"
              >
                <i class="pi pi-tag"></i>
                {{ getEstadoLabel(orden.estado) }}
                <i class="pi pi-chevron-down"></i>
              </button>

              <div
                v-if="ordenMenuAbierto === (orden.id || orden.no_factura)"
                class="order-status-menu"
              >
                <button
                  v-for="opcion in opcionesEstado"
                  :key="opcion.key"
                  type="button"
                  :class="{ active: normalizarEstado(orden.estado) === opcion.key }"
                  @click="cambiarEstado(orden, opcion.key)"
                >
                  <i :class="opcion.icon"></i>
                  {{ opcion.label }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { peticionesFetchOffline, nfecha } from '@/funciones/funciones.js';

const ordenes = ref([]);
const horaActual = ref('');
const fechaActual = ref('');
const modoVista = ref('revision');
const ordenMenuAbierto = ref(null);
let refrescarOrdenesInterval = null;
let relojInterval = null;

const estadosComanda = [
  { key: 'pendiente', label: 'Pendientes', icon: 'pi pi-clock', className: 'status-pending' },
  { key: 'revision', label: 'En Revision', icon: 'pi pi-search', className: 'status-review' },
  { key: 'reparado', label: 'Listos', icon: 'pi pi-check-circle', className: 'status-ready' },
  { key: 'garantia', label: 'Garantia', icon: 'pi pi-shield', className: 'status-warranty' },
  { key: 'sin_solucion', label: 'Sin Solucion', icon: 'pi pi-times-circle', className: 'status-blocked' },
  { key: 'entregado', label: 'Entregados', icon: 'pi pi-send', className: 'status-delivered' }
];

const opcionesEstado = [
  { key: 'pendiente', label: 'Pendiente', icon: 'pi pi-clock' },
  { key: 'revision', label: 'En Revision', icon: 'pi pi-search' },
  { key: 'reparado', label: 'Reparado', icon: 'pi pi-check-circle' },
  { key: 'garantia', label: 'Garantia', icon: 'pi pi-shield' },
  { key: 'sin_solucion', label: 'Sin Solucion', icon: 'pi pi-times-circle' },
  { key: 'entregado', label: 'Entregado', icon: 'pi pi-send' },
  { key: 'devolucion', label: 'Devolucion', icon: 'pi pi-undo' }
];

const getEstadoLabel = (estado = '') => {
  const normalizado = normalizarEstado(estado);
  const encontrado = opcionesEstado.find((o) => o.key === normalizado);
  return encontrado ? encontrado.label : 'Sin estado';
};

const abrirMenuEstado = (orden) => {
  const key = orden.id || orden.no_factura;
  ordenMenuAbierto.value = ordenMenuAbierto.value === key ? null : key;
};

const cambiarEstado = async (orden, nuevoEstado) => {
  try {
    const datosActualizados = {
      ...orden,
      estado: nuevoEstado === 'devolucion' ? 'Devolucion' : nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1).replace('_solucion', '_solucion').replace('_', ' ')
    };
    if (nuevoEstado === 'sin_solucion') datosActualizados.estado = 'Sin Solucion';
    if (nuevoEstado === 'garantia') datosActualizados.estado = 'Garantia';
    if (nuevoEstado === 'devolucion') datosActualizados.estado = 'Devolucion';

    await peticionesFetchOffline('updateData', 'taller', JSON.stringify(datosActualizados));
    ordenMenuAbierto.value = null;
    await cargarOrdenes();
  } catch (error) {
    console.error('Error al cambiar estado:', error);
  }
};

const cerrarMenuAlHacerClickFuera = (evento) => {
  if (ordenMenuAbierto.value && !evento.target.closest('.order-actions')) {
    ordenMenuAbierto.value = null;
  }
};

const actualizarReloj = () => {
  const ahora = new Date();
  horaActual.value = ahora.toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit'
  });
  fechaActual.value = ahora.toLocaleDateString('es-DO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  });
};

const normalizarEstado = (estado = '') => {
  const texto = String(estado || 'Pendiente').trim().toLowerCase();
  if (texto.includes('entregado')) return 'entregado';
  if (texto.includes('reparado') || texto.includes('listo')) return 'reparado';
  if (texto.includes('revision') || texto.includes('revisi')) return 'revision';
  if (texto.includes('garantia') || texto.includes('garant')) return 'garantia';
  if (texto.includes('sin solucion') || texto.includes('sin soluci')) return 'sin_solucion';
  if (texto.includes('devolucion') || texto.includes('devolu')) return 'devolucion';
  return 'pendiente';
};

const ordenesPorEstado = computed(() => {
  const grupos = estadosComanda.reduce((acc, estado) => {
    acc[estado.key] = [];
    return acc;
  }, {});

  ordenes.value.forEach((orden) => {
    const estado = normalizarEstado(orden.estado);
    grupos[estado].push(orden);
  });

  return grupos;
});

const estadosVisibles = computed(() => {
  if (modoVista.value !== 'todos') {
    return estadosComanda.filter((estado) => estado.key === modoVista.value);
  }

  return estadosComanda;
});

const cargarOrdenes = async () => {
  try {
    const response = await peticionesFetchOffline('getDataAsArray', 'taller');
    const registros = Array.isArray(response) ? response : [];
    ordenes.value = registros
      .filter((orden) => orden && orden.estado)
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  } catch (error) {
    console.error('Error cargando comanda de taller:', error);
    ordenes.value = [];
  }
};

const limpiarTexto = (texto = '') => String(texto || '').replace(/\s+/g, ' ').trim();

const intentarParsearJSON = (valor) => {
  if (typeof valor !== 'string') return valor;
  const texto = valor.trim();
  if (!texto) return '';
  if (!['[', '{'].includes(texto[0])) return texto;

  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
};

const extraerTextosAnidados = (valor, acumulador = []) => {
  const dato = intentarParsearJSON(valor);

  if (Array.isArray(dato)) {
    dato.forEach((item) => extraerTextosAnidados(item, acumulador));
    return acumulador;
  }

  if (dato && typeof dato === 'object') {
    if (dato.propiedad !== undefined) {
      extraerTextosAnidados(dato.propiedad, acumulador);
      return acumulador;
    }

    Object.values(dato).forEach((item) => extraerTextosAnidados(item, acumulador));
    return acumulador;
  }

  const texto = limpiarTexto(dato);
  if (texto && !['[]', '{}'].includes(texto)) {
    acumulador.push(texto);
  }

  return acumulador;
};

const formatearFallas = (valor) => {
  const textos = extraerTextosAnidados(valor)
    .map((texto) => limpiarTexto(texto))
    .filter(Boolean);
  const unicos = [...new Set(textos)];
  return unicos.length ? unicos.join(', ') : 'Sin detalle registrado';
};

const normalizarTecnico = (tecnico = '') => {
  if (typeof tecnico === 'object' && tecnico?.nombre) return tecnico.nombre;
  return limpiarTexto(tecnico || 'Sin tecnico');
};

const obtenerEquipo = (orden) => {
  const partes = [orden.equipo, orden.marca, orden.modelo]
    .map((item) => limpiarTexto(item))
    .filter(Boolean);
  return partes.length ? partes.join(' ') : 'Equipo sin detalle';
};

const obtenerTiempoOrden = (orden) => {
  if (orden.hora) return orden.hora;
  if (orden.created_at) return String(orden.created_at).split(' ')[1] || '';
  return orden.fecha_entrada || nfecha('hora');
};

onMounted(async () => {
  actualizarReloj();
  await cargarOrdenes();
  relojInterval = window.setInterval(actualizarReloj, 1000);
  refrescarOrdenesInterval = window.setInterval(cargarOrdenes, 15000);
  window.addEventListener('click', cerrarMenuAlHacerClickFuera);
});

onBeforeUnmount(() => {
  if (relojInterval) window.clearInterval(relojInterval);
  if (refrescarOrdenesInterval) window.clearInterval(refrescarOrdenesInterval);
  window.removeEventListener('click', cerrarMenuAlHacerClickFuera);
});
</script>

<style scoped>
.comanda-taller {
  min-height: 100vh;
  padding: 1.5rem;
  background:
    linear-gradient(135deg, rgba(16, 24, 39, 0.94), rgba(24, 24, 27, 0.96)),
    radial-gradient(circle at top left, rgba(250, 204, 21, 0.22), transparent 28%);
  color: #f8fafc;
  overflow-x: hidden;
}

.comanda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
}

.comanda-kicker {
  display: block;
  color: #facc15;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
}

.comanda-header h1 {
  margin: 0.2rem 0 0;
  font-size: 2rem;
  font-weight: 950;
}

.comanda-clock {
  min-width: 10rem;
  text-align: right;
}

.comanda-clock strong {
  display: block;
  color: #facc15;
  font-size: 2rem;
  line-height: 1;
}

.comanda-clock span {
  display: block;
  margin-top: 0.25rem;
  color: #cbd5e1;
  text-transform: capitalize;
}

.comanda-summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.comanda-view-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 1rem;
  padding: 0.35rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
}

.comanda-view-switch button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 8.5rem;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 950;
  text-transform: uppercase;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.comanda-view-switch button.active {
  background: #facc15;
  color: #111827;
}

.comanda-view-switch button:not(.active):hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.summary-card {
  padding: 0.85rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
}

.summary-card span {
  display: block;
  color: #cbd5e1;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.summary-card strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 2rem;
  line-height: 1;
}

.comanda-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 0.75rem;
}

.status-lane {
  min-height: calc(100vh - 12rem);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(2, 6, 23, 0.72);
  overflow: hidden;
}

.lane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 4px solid currentColor;
  background: rgba(255, 255, 255, 0.08);
}

.lane-head span {
  display: block;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
}

.lane-head strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 1.75rem;
  line-height: 1;
}

.lane-head i {
  font-size: 1.8rem;
}

.lane-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 0.75rem;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 2rem 1rem;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  color: #94a3b8;
  text-align: center;
  font-weight: 800;
}

.order-card {
  padding: 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
  color: #111827;
  box-shadow: 0 16px 35px rgba(2, 6, 23, 0.28);
}

.order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.order-number {
  padding: 0.25rem 0.45rem;
  border-radius: 6px;
  background: #111827;
  color: #facc15;
  font-size: 0.8rem;
  font-weight: 950;
}

.order-time {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 800;
}

.order-card h2 {
  margin: 0.7rem 0 0;
  font-size: 1.12rem;
  line-height: 1.15;
  font-weight: 950;
}

.order-client {
  margin: 0.3rem 0 0;
  color: #334155;
  font-weight: 800;
}

.order-details {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.order-details span {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
}

.order-details i {
  color: #0f766e;
}

.order-problem {
  margin-top: 0.8rem;
  padding: 0.7rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.order-problem span {
  display: block;
  color: #ef4444;
  font-size: 0.72rem;
  font-weight: 950;
  text-transform: uppercase;
}

.order-problem p {
  margin: 0.25rem 0 0;
  color: #0f172a;
  font-size: 0.88rem;
  line-height: 1.35;
  font-weight: 700;
}

.order-work {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.7rem;
}

.order-work span {
  padding: 0.25rem 0.45rem;
  border-radius: 6px;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.75rem;
  font-weight: 800;
}

.order-actions {
  position: relative;
  margin-top: 0.75rem;
}

.order-status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  transition: background-color 0.15s ease;
}

.order-status-btn:hover {
  background: #e2e8f0;
}

.status-btn--pendiente {
  border-color: #facc15;
  color: #a16207;
}

.status-btn--revision {
  border-color: #38bdf8;
  color: #0369a1;
}

.status-btn--reparado {
  border-color: #22c55e;
  color: #15803d;
}

.status-btn--garantia {
  border-color: #a78bfa;
  color: #6d28d9;
}

.status-btn--sin_solucion {
  border-color: #fb7185;
  color: #be123c;
}

.status-btn--entregado {
  border-color: #94a3b8;
  color: #475569;
}

.order-status-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin-top: 0.25rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(2, 6, 23, 0.2);
  overflow: hidden;
}

.order-status-menu button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 0;
  background: transparent;
  color: #334155;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  text-align: left;
  transition: background-color 0.12s ease;
}

.order-status-menu button:hover {
  background: #f1f5f9;
}

.order-status-menu button.active {
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 950;
}

.order-status-menu button i {
  width: 1rem;
  text-align: center;
}

.status-pending {
  color: #facc15;
}

.status-review {
  color: #38bdf8;
}

.status-ready {
  color: #22c55e;
}

.status-warranty {
  color: #a78bfa;
}

.status-blocked {
  color: #fb7185;
}

.status-delivered {
  color: #94a3b8;
}

@media (max-width: 900px) {
  .comanda-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .comanda-clock {
    text-align: left;
  }

  .comanda-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .comanda-board {
    grid-template-columns: minmax(0, 1fr);
    overflow-x: visible;
  }

  .lane-list {
    grid-template-columns: 1fr;
  }

  .status-lane {
    min-height: auto;
  }
}
</style>
