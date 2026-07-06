<script setup>
import DeviceReportStatusBadge from './DeviceReportStatusBadge.vue'

defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <div class="report-table-card">
    <div class="report-table-head">
      <div>Test Items</div>
      <div>Ex-factory Value</div>
      <div>Read Value</div>
      <div>Results</div>
    </div>

    <div
      v-for="item in items"
      :key="item.label"
      class="report-table-row"
    >
      <div class="cell label-cell">{{ item.label }}</div>
      <div class="cell ellipsis-cell" :title="item.exFactoryValue">{{ item.exFactoryValue }}</div>
      <div class="cell ellipsis-cell" :title="item.readValue">{{ item.readValue }}</div>
      <div class="cell">
        <DeviceReportStatusBadge :value="item.result" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.report-table-head,
.report-table-row {
  display: grid;
  grid-template-columns: 1.05fr 1.1fr 1.1fr 0.65fr;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1.2rem;
}

.report-table-head {
  background: #f8fafc;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
}

.report-table-row {
  border-top: 1px solid #edf2f7;
}

.cell {
  font-size: 0.9rem;
  color: #475569;
}

.label-cell {
  font-weight: 600;
  color: #334155;
}

.ellipsis-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 991px) {
  .report-table-head,
  .report-table-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .report-table-head {
    display: none;
  }

  .report-table-row {
    padding: 1rem;
  }
}
</style>
