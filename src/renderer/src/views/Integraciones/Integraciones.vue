<script setup>
import { computed, ref } from 'vue'

const resumen = ref({
  conectoresActivos: 4,
  automatizaciones: 12,
  trabajosPendientes: 18,
  erroresUltimas24h: 3
})

const conectores = ref([
  {
    id: 1,
    nombre: 'WooCommerce',
    categoria: 'E-commerce',
    estado: 'Activo',
    descripcion: 'Sincroniza productos, stock, precios y pedidos web.',
    salud: 96,
    ultimaSync: 'Hace 4 min'
  },
  {
    id: 2,
    nombre: 'Mercado Libre',
    categoria: 'Marketplace',
    estado: 'Configuración',
    descripcion: 'Publicaciones, stock por canal y órdenes pendientes.',
    salud: 68,
    ultimaSync: 'Pendiente'
  },
  {
    id: 3,
    nombre: 'WhatsApp API',
    categoria: 'Mensajería',
    estado: 'Activo',
    descripcion: 'Mensajes automáticos postventa, cobranza y taller.',
    salud: 92,
    ultimaSync: 'Hace 1 min'
  },
  {
    id: 4,
    nombre: 'Courier / Envíos',
    categoria: 'Logística',
    estado: 'Inactivo',
    descripcion: 'Generación de guías, tracking y actualización de entregas.',
    salud: 21,
    ultimaSync: 'Sin conexión'
  }
])

const automatizaciones = ref([
  {
    id: 1,
    nombre: 'Venta a crédito -> CxC',
    disparador: 'Factura con método crédito',
    accion: 'Crear cuenta por cobrar y aviso al cliente',
    estado: 'Activo'
  },
  {
    id: 2,
    nombre: 'Taller -> aviso de entrega',
    disparador: 'Estado cambia a Reparado',
    accion: 'Enviar WhatsApp y marcar listo para entrega',
    estado: 'Activo'
  },
  {
    id: 3,
    nombre: 'Stock crítico',
    disparador: 'Producto cae por debajo de alerta',
    accion: 'Crear alerta y enviar resumen al responsable',
    estado: 'Activo'
  },
  {
    id: 4,
    nombre: 'Pedido online',
    disparador: 'Webhook de nueva orden',
    accion: 'Reservar stock, crear factura borrador y asignar delivery',
    estado: 'Borrador'
  }
])

const colaTrabajos = ref([
  {
    id: 'JOB-1082',
    tipo: 'Sync de inventario',
    origen: 'WooCommerce',
    estado: 'Procesando',
    detalle: '342 productos en actualización',
    fecha: '09:42 AM'
  },
  {
    id: 'JOB-1081',
    tipo: 'Webhook entrante',
    origen: 'WhatsApp API',
    estado: 'Completado',
    detalle: '3 eventos procesados correctamente',
    fecha: '09:38 AM'
  },
  {
    id: 'JOB-1080',
    tipo: 'Importación de pedidos',
    origen: 'Mercado Libre',
    estado: 'Error',
    detalle: 'Token expirado en canal marketplace',
    fecha: '09:21 AM'
  },
  {
    id: 'JOB-1079',
    tipo: 'Generación de guía',
    origen: 'Courier / Envíos',
    estado: 'En cola',
    detalle: 'Esperando confirmación de dirección',
    fecha: '09:10 AM'
  }
])

const logs = ref([
  {
    id: 1,
    nivel: 'warning',
    titulo: 'Token de Mercado Libre próximo a vencer',
    detalle: 'Renovar credenciales para evitar interrupción de publicaciones.',
    fecha: 'Hoy 09:18 AM'
  },
  {
    id: 2,
    nivel: 'success',
    titulo: 'Sincronización de stock completada',
    detalle: 'WooCommerce actualizó 342 productos sin conflictos.',
    fecha: 'Hoy 09:12 AM'
  },
  {
    id: 3,
    nivel: 'info',
    titulo: 'Nueva automatización disponible',
    detalle: 'Se puede activar el flujo de recuperación de carritos.',
    fecha: 'Hoy 08:50 AM'
  }
])

const integracionesChart = computed(() => ({
  labels: ['Activos', 'Configuración', 'Inactivos'],
  datasets: [
    {
      data: [
        conectores.value.filter((item) => item.estado === 'Activo').length,
        conectores.value.filter((item) => item.estado === 'Configuración').length,
        conectores.value.filter((item) => item.estado === 'Inactivo').length
      ],
      backgroundColor: ['#0f766e', '#d97706', '#475569'],
      hoverBackgroundColor: ['#14b8a6', '#f59e0b', '#64748b'],
      borderWidth: 0
    }
  ]
}))

const integracionesChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true
      }
    }
  }
}))

const getEstadoClass = (estado) => {
  const normalizado = String(estado || '').toLowerCase()
  if (normalizado === 'activo' || normalizado === 'completado') return 'is-success'
  if (normalizado === 'procesando' || normalizado === 'configuración' || normalizado === 'configuracion') return 'is-warning'
  if (normalizado === 'error' || normalizado === 'inactivo') return 'is-danger'
  return 'is-muted'
}

const getNivelClass = (nivel) => {
  if (nivel === 'success') return 'is-success'
  if (nivel === 'warning') return 'is-warning'
  if (nivel === 'info') return 'is-info'
  return 'is-muted'
}
</script>

<template>
  <div class="integrations-shell">
    <section class="integrations-hero">
      <div>
        <span class="hero-kicker">Nuevo módulo</span>
        <h1>Integraciones y Automatizaciones</h1>
        <p>
          Centro para conectar canales externos, automatizar procesos clave y monitorear sincronizaciones
          del sistema en tiempo real.
        </p>
      </div>
      <div class="hero-actions">
        <Button label="Nuevo conector" icon="pi pi-plug" />
        <Button label="Nueva automatización" icon="pi pi-bolt" outlined />
      </div>
    </section>

    <section class="integrations-summary">
      <article class="summary-card">
        <span>Conectores activos</span>
        <strong>{{ resumen.conectoresActivos }}</strong>
        <small>Canales conectados y respondiendo</small>
      </article>
      <article class="summary-card">
        <span>Automatizaciones</span>
        <strong>{{ resumen.automatizaciones }}</strong>
        <small>Flujos configurados en operación</small>
      </article>
      <article class="summary-card">
        <span>Trabajos pendientes</span>
        <strong>{{ resumen.trabajosPendientes }}</strong>
        <small>Eventos en cola o reintento</small>
      </article>
      <article class="summary-card">
        <span>Errores 24h</span>
        <strong>{{ resumen.erroresUltimas24h }}</strong>
        <small>Incidentes que requieren revisión</small>
      </article>
    </section>

    <section class="integrations-grid">
      <article class="panel panel-wide">
        <div class="panel-head">
          <div>
            <span class="panel-kicker">Conectores</span>
            <h2>Estado general de integraciones</h2>
          </div>
        </div>

        <div class="connectors-layout">
          <div class="connectors-list">
            <article v-for="conector in conectores" :key="conector.id" class="connector-card">
              <div class="connector-top">
                <div>
                  <h3>{{ conector.nombre }}</h3>
                  <small>{{ conector.categoria }}</small>
                </div>
                <span class="status-pill" :class="getEstadoClass(conector.estado)">{{ conector.estado }}</span>
              </div>

              <p>{{ conector.descripcion }}</p>

              <div class="connector-meta">
                <span>Salud {{ conector.salud }}%</span>
                <span>{{ conector.ultimaSync }}</span>
              </div>

              <div class="progress-track">
                <div class="progress-bar" :style="{ width: `${conector.salud}%` }"></div>
              </div>
            </article>
          </div>

          <div class="chart-panel">
            <div class="chart-head">
              <span>Distribución de conectores</span>
            </div>
            <Chart type="doughnut" :data="integracionesChart" :options="integracionesChartOptions" class="integration-chart" />
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="panel-kicker">Automatizaciones</span>
            <h2>Flujos configurados</h2>
          </div>
        </div>

        <div class="stack-list">
          <div v-for="flujo in automatizaciones" :key="flujo.id" class="stack-item">
            <div class="stack-item-top">
              <strong>{{ flujo.nombre }}</strong>
              <span class="status-pill" :class="getEstadoClass(flujo.estado)">{{ flujo.estado }}</span>
            </div>
            <small>Disparador: {{ flujo.disparador }}</small>
            <p>{{ flujo.accion }}</p>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="panel-kicker">Cola</span>
            <h2>Trabajos de sincronización</h2>
          </div>
        </div>

        <div class="stack-list">
          <div v-for="job in colaTrabajos" :key="job.id" class="stack-item">
            <div class="stack-item-top">
              <strong>{{ job.tipo }}</strong>
              <span class="status-pill" :class="getEstadoClass(job.estado)">{{ job.estado }}</span>
            </div>
            <small>{{ job.id }} · {{ job.origen }} · {{ job.fecha }}</small>
            <p>{{ job.detalle }}</p>
          </div>
        </div>
      </article>

      <article class="panel panel-wide">
        <div class="panel-head">
          <div>
            <span class="panel-kicker">Observabilidad</span>
            <h2>Logs y eventos recientes</h2>
          </div>
        </div>

        <div class="logs-list">
          <div v-for="log in logs" :key="log.id" class="log-row">
            <span class="log-badge" :class="getNivelClass(log.nivel)">{{ log.nivel }}</span>
            <div class="log-content">
              <strong>{{ log.titulo }}</strong>
              <p>{{ log.detalle }}</p>
            </div>
            <small>{{ log.fecha }}</small>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.integrations-shell {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.integrations-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.6rem;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.18), transparent 24%),
    linear-gradient(135deg, #0f172a 0%, #1e293b 58%, #0f766e 100%);
  color: #fff;
}

.hero-kicker,
.panel-kicker {
  display: inline-block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  opacity: 0.72;
  margin-bottom: 0.55rem;
}

.integrations-hero h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 900;
}

.integrations-hero p {
  margin: 0.75rem 0 0;
  max-width: 52rem;
  color: rgba(255, 255, 255, 0.78);
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.integrations-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.summary-card,
.panel {
  border-radius: 24px;
  border: 1px solid #dbe3ee;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.05);
}

.summary-card {
  padding: 1.2rem;
}

.summary-card span {
  display: block;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
}

.summary-card strong {
  display: block;
  margin-top: 0.65rem;
  font-size: 1.9rem;
  line-height: 1;
  color: #0f172a;
}

.summary-card small {
  display: block;
  margin-top: 0.55rem;
  color: #64748b;
}

.integrations-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.panel {
  padding: 1.25rem;
}

.panel-wide {
  grid-column: span 2;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel-head h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.connectors-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 1rem;
}

.connectors-list,
.stack-list,
.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.connector-card,
.stack-item,
.log-row {
  padding: 1rem;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.connector-top,
.stack-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.connector-card h3,
.stack-item strong {
  margin: 0;
  color: #0f172a;
}

.connector-card small,
.stack-item small,
.connector-card p,
.stack-item p,
.log-content p {
  color: #64748b;
}

.connector-card p,
.stack-item p,
.log-content p {
  margin: 0.45rem 0 0;
}

.connector-meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.82rem;
  color: #475569;
  margin-top: 0.85rem;
}

.progress-track {
  margin-top: 0.6rem;
  height: 0.5rem;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f766e 0%, #1d4ed8 100%);
}

.chart-panel {
  padding: 1rem;
  border-radius: 22px;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
  border: 1px solid #dbeafe;
}

.chart-head {
  margin-bottom: 0.65rem;
  color: #475569;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.integration-chart {
  height: 18rem;
}

.status-pill,
.log-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
}

.is-success {
  background: #dcfce7;
  color: #166534;
}

.is-warning {
  background: #fef3c7;
  color: #92400e;
}

.is-danger {
  background: #fee2e2;
  color: #991b1b;
}

.is-info {
  background: #dbeafe;
  color: #1d4ed8;
}

.is-muted {
  background: #e2e8f0;
  color: #475569;
}

.log-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
}

.log-content strong {
  color: #0f172a;
}

.log-content p {
  margin: 0.25rem 0 0;
}

.log-row small {
  color: #64748b;
}

@media (max-width: 1100px) {
  .integrations-summary,
  .integrations-grid,
  .connectors-layout {
    grid-template-columns: 1fr;
  }

  .panel-wide {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .integrations-hero {
    flex-direction: column;
  }

  .log-row {
    grid-template-columns: 1fr;
  }
}
</style>
