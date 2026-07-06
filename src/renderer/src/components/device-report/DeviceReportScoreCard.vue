<script setup>
defineProps({
  score: {
    type: Number,
    default: 98
  }
})
</script>

<template>
  <div class="score-card">
    <div class="score-chip">Check Score</div>
    <div class="score-value">{{ score }}</div>
    <div class="score-stars">
      <span v-for="star in 5" :key="star">★</span>
    </div>
  </div>
</template>

<style scoped>
.score-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.1rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  text-align: center;
}

.score-chip {
  background: linear-gradient(90deg, #f5ecd9 0%, #cbf3f4 100%);
  border-radius: 14px;
  padding: 0.9rem 0.75rem;
  color: #51697c;
  font-size: 0.98rem;
  font-weight: 700;
}

.score-value {
  margin-top: 1.15rem;
  color: #16a34a;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.score-stars {
  margin-top: 0.7rem;
  color: #16a34a;
  font-size: 1.55rem;
  letter-spacing: 0.08rem;
}
</style>
