<!-- Factura80mm.vue -->
<template>
  <div ref="invoice" class="ticket">
    <!-- Contenido de la factura aquí -->
    <center id="top">
      <div class="logos">
        <h1 style="font-size:38px">{{ empresa.nombre }}</h1>
      </div>
      <div class="info">
        <p>
          {{ empresa.direccion }}<br>
          {{ empresa.telefono }} / {{ empresa.email }}<br>
          RNC: {{ empresa.rnc }}
        </p>
      </div>
    </center>

    <div id="mid">
      <div class="info">
        <p>
          Hora: {{ factura.hora }}<br>
          NCF: {{ factura.ncf }}<br>
          DOC: <b>#{{ factura.no_factura }}</b><br>
          CLIENTE: {{ cliente.nombre }}<br>
          CEDULA/RNC: {{ cliente.rnc }}<br>
          TELEFONO: {{ cliente.telefono }}<br>
          DIRECCION: {{ cliente.direccion }}<br>
          CAJERO: {{ factura.cajero }}<br>
          DELIVERY: {{ factura.delivery }}<br>
          METODO DE PAGO: {{ factura.metodo_pago }}
        </p>
      </div>
    </div>

    <div style="text-align:center;">
      <div class="date text-danger" style="width: 100%; background-color: black; color: white; padding: 5px 0;">
        <b>{{ factura.tipo_comprobante }}</b>
      </div>
    </div>

    <table cellspacing="0" cellpadding="0">
      <thead class="linea">
        <tr>
          <th style="text-align:left;">CANT</th>
          <th style="text-align:left;">UNIDAD</th>
          <th style="text-align:left;">PRECIO</th>
          <th style="text-align:right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(producto, index) in factura.productos" :key="index">
          <td colspan="4" style="overflow-wrap: break-word;">{{ producto.descripcion }}</td>
        </tr>
        <tr v-for="(producto, index) in factura.productos" :key="`detalle-${index}`">
          <td style="padding-left:20px;">{{ producto.cantidad }}</td>
          <td>{{ producto.unidad }}</td>
          <td>{{ producto.precio }}</td>
          <td style="text-align:right;"><b>{{ producto.total }}</b></td>
        </tr>
      </tbody>
    </table>

    <div class="linea" style="margin-top: 30px;">
      <div id="subtotal" style="font-weight: bold;">
        <table>
          <tr>
            <td>SUBTOTAL:</td>
            <td style="text-align:right;">{{ factura.subtotal }}</td>
          </tr>
        </table>
      </div>

      <div id="total" style="font-weight: bold;">
        <table>
          <tr>
            <td>TOTAL:</td>
            <td style="text-align:right;">{{ factura.total }}</td>
          </tr>
        </table>
      </div>

      <div id="pagocon" style="font-weight: bold;">
        <table>
          <tr>
            <td>PAGO CON:</td>
            <td style="text-align:right;">{{ factura.pagocon }}</td>
          </tr>
        </table>
      </div>

      <div id="sucambio" style="font-weight: bold;">
        <table>
          <tr>
            <td>SU CAMBIO:</td>
            <td style="text-align:right;">{{ factura.sucambio }}</td>
          </tr>
        </table>
      </div>
    </div>

    <div style="text-align: center;">
      <img :src="factura.qr_url" alt="QR Code" style="width: 200px; position: relative;">
    </div>

    <div id="legalcopy" style="width: 500px;">
      <p class="legal">
        <strong>NOTA</strong><br>
        Gracias por Preferirnos!<br>{{ factura.nota }}
      </p>
    </div>

    <button @click="generatePDF">Generar PDF</button>
  </div>
</template>

<script>
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default {
  name: 'Factura80mm',
  props: {
    empresa: {
      type: Object,
      required: true,
      default: () => ({
        nombre: 'TM POS SRL',
        direccion: 'Ave. Imbert #36, Santiago, Rep. Dom.',
        telefono: '+1(829) 784-2912',
        email: 'info@tmposrd.com',
        rnc: '133023539'
      })
    },
    factura: {
      type: Object,
      required: true,
      default: () => ({
        hora: '4:29:14 pm',
        ncf: 'NO APLICA',
        no_factura: '0000015',
        tipo_comprobante: 'SIN COMPROBANTE',
        cajero: 'soporte@versatframework.com',
        delivery: 'Ninguno',
        metodo_pago: 'EFECTIVO',
        productos: [
          {
            descripcion: 'CAJEBOLA CENTRO CLOCHE CG GAT0',
            cantidad: 1,
            unidad: 'UNIDAD',
            precio: 70,
            total: 70
          }
        ],
        subtotal: 70,
        total: 70,
        pagocon: 70,
        sucambio: 0,
        qr_url: 'temp/QR8799827c9418434cc47d7b6485e391f6.png',
        nota: 'Factura devuelta en su Totalidad (06/05/2024 4:29:14 pm)'
      })
    },
    cliente: {
      type: Object,
      required: true,
      default: () => ({
        nombre: 'SIN REGISTRO',
        rnc: '000-0000000-0',
        telefono: '+1(809) 123-4567',
        direccion: 'SIN REGISTRO'
      })
    }
  },
  methods: {
    async generatePDF() {
      const invoiceElement = this.$refs.invoice;
      const canvas = await html2canvas(invoiceElement);
      const imageData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297]  // Formato 80mm x longitud
      });

      pdf.addImage(imageData, 'PNG', 0, 0);
      pdf.save('factura.pdf');
    }
  }
}
</script>

<style scoped>
* {
  font-size: 18px;
  font-family: 'Arial';
}



#invoice{
    padding: 30px;
}

.invoice {
    position: relative;
    background-color: #FFF;
    min-height: 680px;
    padding: 15px
}

.invoice header {
    padding: 10px 0;
    margin-bottom: 20px;
    border-bottom: 1px solid #3989c6
}

.invoice .company-details {
    text-align: right
}

.invoice .company-details .name {
    margin-top: 0;
    margin-bottom: 0
}

.invoice .contacts {
    margin-bottom: 20px
}

.invoice .invoice-to {
    text-align: left
}

.invoice .invoice-to .to {
    margin-top: 0;
    margin-bottom: 0
}

.invoice .invoice-details {
    text-align: right
}

.invoice .invoice-details .invoice-id {
    margin-top: 0;
    color: #3989c6
}

.invoice main {
    padding-bottom: 50px
}

.invoice main .thanks {
    margin-top: -100px;
    font-size: 16px;
    margin-bottom: 50px
}

.invoice main .notices {
    padding-left: 6px;
    border-left: 6px solid #3989c6
}

.invoice main .notices .notice {
    font-size: 16px;
}


#tabla {
            border: 0.5pt solid darkblue;
            border-collapse: collapse;
            border-spacing: 0;
            box-sizing: border-box;
            clear: both;
            margin: 2mm 0mm;
            height: 100mm;
            width: 100%;
        }
        #tabla th, td { border-left: 1px solid darkblue; }
        #tabla th:first-child, td:first-child { border-left: none; }
        #tabla th { border-bottom: 1px solid darkblue; }
        #tabla td { vertical-align: top; font-size: 8pt; }
        th { text-align: center; font-weight: normal; }
        .amount { text-align: right; }
        .invoice_line { height: 6mm; }
        .invoice_line td, .invoice_line th { padding: 1mm; }

@media print {


  

  
  /* Evita que los elementos se corten en dos páginas */

    .invoice footer {
        position: absolute;
        bottom: 10px;
        /*page-break-after: always*/
    }


    .no-print{
        display: none;
    }
}
</style>
