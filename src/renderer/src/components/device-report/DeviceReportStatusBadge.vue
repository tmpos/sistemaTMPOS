<script setup>
const props = defineProps({
  value: {
    type: String,
    default: 'Pending Inspection'
  }
})

const normalized = (props.value || '').toLowerCase()

const iconClass = normalized.includes('normal')
  ? 'pi pi-check-circle text-green-500'
  : normalized.includes('tap to check')
    ? 'pi pi-info-circle text-sky-500'
    : normalized.includes('how to determine')
      ? 'pi pi-question-circle text-slate-400'
      : normalized.includes('pending')
        ? 'pi pi-clock text-slate-400'
        : normalized.includes('revisar')
          ? 'pi pi-exclamation-circle text-orange-500'
          : 'pi pi-info-circle text-slate-400'

const badgeClass = normalized.includes('normal')
  ? 'report-badge ok'
  : normalized.includes('tap to check')
    ? 'report-badge info'
    : normalized.includes('how to determine')
      ? 'report-badge muted'
      : normalized.includes('pending')
        ? 'report-badge muted'
        : normalized.includes('revisar')
          ? 'report-badge warn'
          : 'report-badge muted'
</script>

<template>
  <span :class="badgeClass">
    <i :class="iconClass"></i>
    <span>{{ value }}</span>
  </span>
</template>

<style scoped>
.report-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}

.report-badge.ok {
  color: #16a34a;
}

.report-badge.info {
  color: #0284c7;
}

.report-badge.warn {
  color: #f59e0b;
}

.report-badge.muted {
  color: #94a3b8;
}
</style>
