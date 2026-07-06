const fs = require('fs')
const PDFDocument = require('pdfkit')
const niceInvoice = require('nice-invoice')

export function generarFactura(dEmpresa, nombreArchivo) {
  const datosEmpresa = JSON.parse(dEmpresa)
  const invoiceDetail = {
    shipping: {
      name: 'Micheal',
      address: '1234 Main Street',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      postal_code: 94111
    },
    items: [
      {
        item: 'Chair',
        description: 'Wooden chair',
        quantity: 1,
        price: 50.0,
        tax: '10%'
      },
      {
        item: 'Watch',
        description: 'Wall watch for office',
        quantity: 2,
        price: 30.0,
        tax: '10%'
      },
      {
        item: 'Water Glass Set',
        description: 'Water glass set for office',
        quantity: 1,
        price: 35.0,
        tax: ''
      }
    ],
    subtotal: 156,
    total: 156,
    order_number: 1234222,
    header: {
      company_name: datosEmpresa.empresa.nombre,
      company_logo: datosEmpresa.empresa.imagen,
      company_address: datosEmpresa.empresa.direccion
    },
    footer: {
      text: 'Gracias por su compra!'
    },
    currency_symbol: '$',
    date: {
      billing_date: '08 August 2020',
      due_date: '10 September 2020'
    }
  }

  niceInvoice(invoiceDetail, 'your-invoice-name.pdf')
}
