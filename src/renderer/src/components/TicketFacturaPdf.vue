<template>
  <div class="pdf-container">
    <div ref="ticketRef" class="ticket">
      <div class="header">
        <div v-if="empresa.logoprinter" class="logo">
          <img :src="empresa.logoprinter" alt="Logo" />
        </div>
        <div v-else class="empresa-nombre">{{ empresa.nombre || '' }}</div>
        <div class="empresa-info">
          <div>{{ empresa.direccion || '' }}</div>
          <div v-if="empresa.telefono || empresa.email">
            {{ empresa.telefono || '' }}{{ empresa.email ? ' / ' + empresa.email : '' }}
          </div>
          <div v-if="empresa.rnc">RNC: {{ empresa.rnc }}</div>
        </div>
      </div>

      <div class="info">
        <div><strong>DOC:</strong> #{{ factura.no_factura || '' }}</div>
        <div><strong>NCF:</strong> {{ factura.comprobante || '' }}</div>
        <div><strong>CLIENTE:</strong> {{ cliente.nombre || 'SIN REGISTRO' }}</div>
        <div><strong>RNC:</strong> {{ cliente.rnc || cliente.cedula || 'N/A' }}</div>
        <div><strong>TELEFONO:</strong> {{ cliente.telefono || 'N/A' }}</div>
        <div><strong>DIRECCION:</strong> {{ cliente.direccion || 'N/A' }}</div>
        <div><strong>CAJERO:</strong> {{ factura.cajero || '' }}</div>
        <div><strong>MESERO:</strong> {{ factura.mesero || '' }}</div>
        <div><strong>MESA:</strong> {{ factura.mesa || '' }}</div>
        <div><strong>METODO:</strong> {{ factura.metodo_pago || '' }}</div>
        <div><strong>FECHA:</strong> {{ factura.fecha_emision || factura.created_at || '' }}</div>
        <div><strong>HORA:</strong> {{ factura.hora || '' }}</div>
      </div>

      <div v-if="factura.tipo_factura" class="tipo-factura">{{ factura.tipo_factura }}</div>

      <table class="productos">
        <thead>
          <tr>
            <th class="left">PROD</th>
            <th class="center">CANT</th>
            <th class="right">PRECIO</th>
            <th class="right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="productos.length === 0">
            <td colspan="4" class="center empty">Sin productos</td>
          </tr>
          <tr v-for="(prod, idx) in productos" :key="idx">
            <td class="left">{{ prod.nombre || prod.producto || 'N/A' }}</td>
            <td class="center">{{ prod.cantidad || prod.quantity || 1 }}</td>
            <td class="right">RD$ {{ toFixed(prod.precio_unitario || prod.precio_venta || 0) }}</td>
            <td class="right">RD$ {{ toFixed(prod.subtotal || prod.total || 0) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="totales">
        <div class="row">
          <span>Subtotal</span>
          <span>RD$ {{ toFixed(subtotal) }}</span>
        </div>
        <div class="row" v-if="Number(factura.descuento || 0) > 0">
          <span>Descuento</span>
          <span>RD$ {{ toFixed(factura.descuento || 0) }}</span>
        </div>
        <div class="row" v-if="Number(factura.impuesto || 0) > 0">
          <span>Impuesto</span>
          <span>RD$ {{ toFixed(factura.impuesto || 0) }}</span>
        </div>
        <div class="row total">
          <span>Total</span>
          <span>RD$ {{ toFixed(factura.total || 0) }}</span>
        </div>
      </div>

      <div class="pago">
        <div class="row">
          <span>Pago con</span>
          <span>RD$ {{ toFixed(factura.paga_con || factura.pagocon || 0) }}</span>
        </div>
        <div class="row">
          <span>Cambio</span>
          <span>RD$ {{ toFixed(factura.cambio || factura.sucambio || 0) }}</span>
        </div>
      </div>

      <div v-if="factura.nota" class="nota">
        <strong>Nota:</strong> {{ factura.nota }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const ticketRef = ref(null)

const empresa = ref({})
const factura = ref({})
const cliente = ref({})
const productos = ref([])
const subtotal = ref(0)

const toFixed = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(2) : '0.00'
}

const parseProductos = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const hydrate = ({ facturaData, clienteData, empresaData }) => {
  const productosLocal = parseProductos(facturaData?.productos || facturaData?.productosArray)
  const totalImpuesto = Number(facturaData?.impuesto || 0)
  const totalDescuento = Number(facturaData?.descuento || 0)
  const totalFactura = Number(facturaData?.total || 0)

  empresa.value = empresaData?.empresa || empresaData || {}
  factura.value = facturaData || {}
  cliente.value = clienteData || {}
  productos.value = productosLocal
  subtotal.value = Math.max(0, totalFactura + totalDescuento - totalImpuesto)
}

const generatePdfBlobUrl = async ({ factura: facturaData, cliente: clienteData, datosEmpresa }) => {
  hydrate({ facturaData, clienteData, empresaData: datosEmpresa })
  await nextTick()

  const element = ticketRef.value
  if (!element) return null

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true
  })

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = 80
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [imgWidth, imgHeight]
  })

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  const pdfBlob = pdf.output('blob')
  const url = URL.createObjectURL(pdfBlob)
  return {
    url,
    revoke: () => URL.revokeObjectURL(url)
  }
}

defineExpose({ generatePdfBlobUrl })
</script>

<style scoped>
.pdf-container {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 80mm;
}

.ticket {
  width: 80mm;
  padding: 6mm 4mm;
  font-family: Arial, sans-serif;
  font-size: 10px;
  color: #111827;
  background: #ffffff;
}

.header {
  text-align: center;
  margin-bottom: 4mm;
}

.logo img {
  max-width: 30mm;
  margin-bottom: 2mm;
}

.empresa-nombre {
  font-size: 14px;
  font-weight: bold;
}

.empresa-info {
  font-size: 9px;
  line-height: 1.3;
}

.info {
  font-size: 9px;
  line-height: 1.4;
  margin-bottom: 3mm;
}

.tipo-factura {
  text-align: center;
  font-weight: bold;
  background: #111827;
  color: #ffffff;
  padding: 2mm 0;
  margin-bottom: 3mm;
}

.productos {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
  margin-bottom: 3mm;
}

.productos th {
  border-bottom: 1px solid #111827;
  padding-bottom: 1mm;
}

.productos td {
  padding: 1mm 0;
  border-bottom: 1px dashed #e5e7eb;
}

.left {
  text-align: left;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}

.empty {
  padding: 4mm 0;
  color: #6b7280;
}

.totales,
.pago {
  font-size: 10px;
  margin-bottom: 2mm;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 1mm 0;
}

.total {
  font-weight: bold;
  border-top: 1px solid #111827;
  margin-top: 2mm;
  padding-top: 2mm;
}

.nota {
  margin-top: 2mm;
  font-size: 9px;
}
</style>
