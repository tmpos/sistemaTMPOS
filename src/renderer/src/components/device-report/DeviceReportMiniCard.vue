<script setup>
import DeviceReportStatusBadge from './DeviceReportStatusBadge.vue'

defineProps({
  title: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <div class="mini-card">
    <div class="mini-title">{{ title }}</div>

    <div
      v-for="item in items"
      :key="item.label"
      class="mini-row"
    >
      <span>{{ item.label }}</span>
      <div class="mini-value">
        <strong>{{ item.value }}</strong>
        <DeviceReportStatusBadge :value="item.result" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1rem 1.15rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  height: 100%;
}

.mini-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.85rem;
}

.mini-row {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 1rem;
  align-items: center;
  padding: 0.58rem 0;
  border-top: 1px solid #eef2f7;
}

.mini-row:first-of-type {
  border-top: 0;
}

.mini-row span {
  color: #475569;
  font-size: 0.9rem;
}

.mini-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.mini-value strong {
  color: #334155;
  font-size: 0.9rem;
  font-weight: 500;
  word-break: break-word;
}

@media (max-width: 991px) {
  .mini-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .mini-value {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
