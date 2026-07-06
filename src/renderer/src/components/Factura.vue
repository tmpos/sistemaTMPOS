<template>
  <div ref="printSection" class="ticket">
    <div class="centrado">
      <div class="logos">
        <h1>{{ company.name }}</h1>
      </div>
      <div class="info">
        <p>
          {{ company.address }}<br />
          {{ company.contact }}<br />
          RNC: {{ company.rnc }}
        </p>
      </div>
    </div>

    <div id="mid">
      <div class="info">
        <p>
          Hora: {{ invoice.time }}<br />
          NCF: {{ invoice.ncf }}<br />
          DOC: <b>{{ invoice.doc }}</b><br />
          CLIENTE: {{ customer.name }}<br />
          CEDULA/RNC: {{ customer.id }}<br />
          TELEFONO: {{ customer.phone }}<br />
          DIRECCION: {{ customer.address }}<br />
          CAJERO: {{ invoice.cashier }}<br />
          DELIVERY: {{ invoice.delivery }}<br />
          METODO DE PAGO: {{ invoice.paymentMethod }}
        </p>
      </div>
    </div>

    <div style="text-align:center;">
      <div class="date text-danger" style="width: 100%; background-color: black; color: white; padding: 5px 0;">
        <b>SIN COMPROBANTE</b>
      </div>
    </div>

    <table cellspacing="0" cellpadding="0">
      <thead class="linea">
        <tr>
          <th style="text-align:left;padding-top: 5px;padding-bottom: 5px;">CANT</th>
          <th style="text-align:left;padding-top: 5px;padding-bottom: 5px;">UNIDAD</th>
          <th style="text-align:left;padding-top: 5px;padding-bottom: 5px;">PRECIO</th>
          <th class="centrado" style="text-align:right;padding-top: 5px;padding-bottom: 5px;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in invoice.items" :key="item.description">
          <td colspan="5" style="overflow-wrap: break-word;padding-top:5px;">{{ item.description }}</td>
        </tr>
        <tr v-for="item in invoice.items" :key="item.description">
          <td style="padding-left:20px;">{{ item.quantity }}</td>
          <td>{{ item.unit }}</td>
          <td>{{ item.price }}</td>
          <td class="centrado" style="text-align:right;"><b>{{ item.total }}</b></td>
        </tr>
      </tbody>
    </table>

    <div class="linea" style="margin-top: 30px;">
      <div id="subtotal" style="font-weight: bold;">
        <table>
          <tr>
            <td><span>SUBTOTAL:</span></td>
            <td style="text-align:right;"><span>{{ invoice.subtotal }}</span></td>
          </tr>
        </table>
      </div>

      <div id="total" style="font-weight: bold;padding-right: 10px;">
        <table>
          <tr>
            <td><span>TOTAL: </span></td>
            <td style="text-align:right;"><span>{{ invoice.total }}</span></td>
          </tr>
        </table>
      </div>

      <div id="pagocon" style="font-weight: bold;padding-right: 10px;">
        <table>
          <tr>
            <td><span>PAGO CON: </span></td>
            <td style="text-align:right;"><span>{{ invoice.payment }}</span></td>
          </tr>
        </table>
      </div>

      <div id="sucambio" style="font-weight: bold;padding-right: 10px;">
        <table>
          <tr>
            <td><span>SU CAMBIO: </span></td>
            <td style="text-align:right;"><span>{{ invoice.change }}</span></td>
          </tr>
        </table>
      </div>
    </div>

    <div style="text-align: center;">
      <img :src="invoice.qrCode" alt="QR Code" style="width: 200px;position: relative;" />
    </div>

    <div id="legalcopy" style="width: 500px;">
      <p class="legal"><strong>NOTA</strong><br />Gracias por Preferirnos!<br /></p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  company: Object,
  invoice: Object,
  customer: Object
})

const printSection = ref(null)

function printInvoice() {
  const printContents = printSection.value.innerHTML
  const originalContents = document.body.innerHTML

  document.body.innerHTML = printContents
  window.print()
  document.body.innerHTML = originalContents
  //window.location.reload()
}

onMounted(() => {
  printInvoice()
})
</script>

<style scoped>
* {
  font-size: 18px;
  font-family: 'Arial';
}

td,
table {
  width: 80mm;
}

.centrado {
  text-align: center;
  align-content: center;
}

.ticket {
  width: 80mm;
  max-width: 80mm;
}

img {
  max-width: inherit;
  width: inherit;
}

.derecha {
  text-align: right;
}

.linea {
  width: 100%;
  border-top: 1px dashed #000;
  border-bottom: 1px dashed #000;
  padding-top: 5px;
  padding-bottom: 5px;
  margin-bottom: 5px;
  padding-right: 10px;
}

table {
  border-spacing: 0 !important;
  border-collapse: collapse !important;
}

@media print {
  .oculto-impresion,
  .oculto-impresion * {
    display: none !important;
  }
}
</style>
