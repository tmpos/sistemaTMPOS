<script setup>
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
  <div class="info-list">
    <div class="info-title">{{ title }}</div>
    <div
      v-for="item in items"
      :key="item.label"
      class="info-row"
    >
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </div>
  </div>
</template>

<style scoped>
.info-list {
  padding: 0.2rem 0.15rem;
}

.info-title {
  font-size: 1rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.9rem;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: start;
  padding: 0.42rem 0;
}

.info-row span {
  color: #7b8da1;
  font-size: 0.92rem;
}

.info-row strong {
  color: #334155;
  font-size: 0.92rem;
  font-weight: 600;
  text-align: right;
}
</style>
