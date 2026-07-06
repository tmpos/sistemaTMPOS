<script setup>
import { ref } from 'vue'
import TicketFacturaPrint from '@/components/TicketFacturaPrint.vue'

const ticketPrintRef = ref(null)

const printTicket = async (payload) => {
  if (!ticketPrintRef.value?.printTicket) return
  await ticketPrintRef.value.printTicket(payload)
}

defineExpose({ printTicket })
</script>

<template>
  <TicketFacturaPrint ref="ticketPrintRef" />
</template>
