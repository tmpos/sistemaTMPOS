<script setup>
import QRCode from 'qrcode'
import { envioElectron } from '@/funciones/funciones.js'

const DEFAULT_PRINTER_CONFIG = {
  fontSize: '10',
  fontFamily: 'arial',
  pageWidth: '300',
  bodyWidth: '250',
  ticketWidth: '240',
  logoWidth: '100',
  pageSizeWidth: '80000',
  pageSizeHeight: '295000',
  copies: '1',
  margin: '5',
  espacio: '0'
}

const parseJson = (value, fallback) => {
  if (value == null) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const printHtml = async (htmlContent) => {
  if (window.electron?.ipcRenderer) {
    await window.electron.ipcRenderer.invoke('print-ticket', htmlContent)
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const buildTicketHtml = ({
  taller,
  datosLocalStorage,
  printerConfig,
  configuracionfactura,
  qrCodeData,
  fallas,
  totalAbonos,
  primerDato
}) => {
  const empresa = datosLocalStorage?.empresa || {}

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            * { font-size: ${printerConfig.fontSize}px; font-family: '${printerConfig.fontFamily}'; }
            @page { size: ${printerConfig.pageWidth}px auto; margin: ${printerConfig.margin || 5}px; }
            body { width: ${printerConfig.bodyWidth}px; margin: 5px; padding: 5px; }
            th { text-align: left; padding: 5px; border-bottom: 1px solid #000; }
            th.centrado { text-align: center; }
            th.precio { text-align: right; }
            .ticket {
                width: ${printerConfig.ticketWidth}px;
                padding-top:10px;
                padding-bottom:10px;
              }
            thead { border-bottom: 2px solid #000; }
            table { width: 100%; border-collapse: collapse; border-spacing: 0 !important; }
            td, th { width: ${printerConfig.ticketWidth}px;}
            .bordeado2 {border:1px solid #000000; border-radius:5px; padding:3px;max-width:150px;margin-top:5px;}
            .centrado { text-align: center; align-content: center; }
            .derecha { text-align: right; }
            .linea { width: 100%; border-top: 1px solid #000; padding-top: 5px; padding-bottom: 5px; margin-bottom: 5px; padding-right: 10px; }
            .bordeado { border:1px solid #000000; border-radius:5px; padding-left:5px; }
            .contenedor {
                border: 2px solid #000;
                border-radius: 5px;
                box-sizing: border-box;
                padding: 10px;
                width: 100%;
            }
        .fila {
            display: flex;
            width: 100%;
            box-sizing: border-box;
        }

        .columna {
            flex: 1;
            padding: 10px;
            border-right: 1px solid #000;
            box-sizing: border-box;
        }

        .fila .columna:last-child {
            border-right: none;
        }

        .right-align {
            text-align: left;
        }
        .fallas {
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        </style>
    </head>
    <body>
        <div class="ticket">
            <center id="top">
                <div class="logos" style="text-align: center;">
                 ${configuracionfactura.logo ?
                    `<img src="${empresa.logoprinter || ''}" alt="Logo" style="max-width: ${printerConfig.logoWidth}px">` :
                    `<div style="font-size:${Number(printerConfig.fontSize) + 8}px !important;font-weight:bold">${empresa.nombre || ''}</div>`
                  }
                </div>
                <div class="info">
                    <p>${configuracionfactura.direccion ? empresa.direccion || '' : ''}<br>${configuracionfactura.telefono ? empresa.telefono || '' : ''}  ${configuracionfactura.email ? '/ '+ (empresa.email || '') : ''}<br>${configuracionfactura.legal ? empresa.legal || '' : ''}</p>
                </div>
            </center>


        <div class="contenedorA">

    <div id="mid">
            <div class="info bordeado">
                <p>
                    Fecha : ${taller.fecha_entrada || ''}</br>
                    DOC   : ${taller.no_factura || ''}</br>
                    CLIENTE   : ${taller.nombre || ''}<br>
                    CEDULA   : ${taller.cedula || ''}</br>
                </p>
            </div>

    </div>

            <div  class="bordeado" style="text-align:center;padding:3px;margin-bottom:5px;margin-top:5px">
                 RESUMEN DE LA ORDEN
            </div>

 <table style="margin-bottom: 10px;" class="contenedor">
        <tr>
            <td class="cantidad" width="20">EQUIPO:</td>
            <td class="cantidad2" width="20">${taller.equipo || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">MARCA:</td>
            <td class="cantidad2" width="20">${taller.marca || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">MODELO:</td>
            <td class="cantidad2" width="20">${taller.modelo || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">IMEI:</td>
            <td class="cantidad2" width="20">${taller.imei || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">SERIAL:</td>
            <td class="cantidad2" width="20">${taller.serial || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">CLAVE:</td>
            <td class="cantidad2" width="20">NO SE REVELA</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">ACCESORIOS:</td>
            <td class="cantidad2" width="20">${taller.accesorios || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">OBSERVACIONES:</td>
            <td class="cantidad2" width="20">${taller.observaciones || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">FALLAS:</td>
            <td class="cantidad2 fallas" width="20">${fallas}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">PIEZAS CAMBIADAS:</td>
            <td class="cantidad2" width="20">${taller.piezas || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">TECNICO ASIGNADO:</td>
            <td class="cantidad2" width="20">${taller.tecnico || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">RECIBIDO POR:</td>
            <td class="cantidad2" width="20">${primerDato.recibidopor || 'N/A'}</td>
        </tr>

            <tr>
                <td class="cantidad" width="20">ENTREGADO POR:</td>
                <td class="cantidad2" width="20">${taller.entregadopor || ''}</td>
            </tr>

        <tr>
            <td class="cantidad" width="20">FECHA ENTRADA:</td>
            <td class="cantidad2" width="20">${taller.fecha_entrada || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">FECHA ENTREGA:</td>
            <td class="cantidad2" width="20">${taller.fecha_entrega || ''}</td>
        </tr>
        <tr>
            <td class="cantidad" width="20">ESTADO:</td>
            <td class="cantidad2" width="20"><b>${taller.estado || ''}</b></td>
        </tr>
    </table>

    <div class="linea0" style="margin-bottom: 10px;">


        <div id="subtotal" style="text-align: right;font-weight: bold;padding-right: 10px;">
            <span>TOTAL: </span>
            <span>${taller.total || '0.00'}</span>
        </div>

            <div id="impuesto" style="text-align: right;font-weight: bold;padding-right: 10px;">
                <span>ABONADO: </span>

                <span>${totalAbonos}</span>
            </div>

        <div id="descuento" style="text-align: right;font-weight: bold;padding-right: 10px;">
            <span>PENDIENTE: </span>
            <span>${taller.saldo || '0.00'}</span>
        </div>
    </div>


        <div class="" style="text-align: center;">
            <img src="${qrCodeData}" alt="" style="width: 150px;position: relative;">
        </div>

        </div>
            </div>



        </div>
    </body>
    </html>
    `
}

const convertToBoolean = obj => {
  const newObj = {}
  for (let key in obj) {
    if (typeof obj[key] === "string") {
      newObj[key] = obj[key] === "True"
    } else {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

const printTicket = async ({ taller, datosEmpresa }) => {
  const tallerData = parseJson(taller, {})
  const datosLocalStorage = parseJson(datosEmpresa, {})

  const datosJSON = await envioElectron('datosarchivo')
  const printerConfig = {
    ...DEFAULT_PRINTER_CONFIG,
    ...(parseJson(datosJSON?.impresora, {}) || {})
  }

  const configuracionfactura = convertToBoolean(datosLocalStorage?.configuracionfactura || {})
  const empresa = datosLocalStorage?.empresa || {}
  const link = datosJSON?.VITE_LINKURL || ''

  // Procesar abonos
  const datosAbono = parseJson(tallerData?.abono, [])
  const primerDato = datosAbono[0] ? datosAbono[0] : { recibidopor: 'N/A' }
  const totalAbonos = datosAbono.map(ab => ab.abono).reduce((sum, abono) => sum + Number(abono || 0), 0)

  // Procesar fallas
  const fallasArray = parseJson(tallerData?.fallas, [])
  const fallas = fallasArray.map(f => f.propiedad).join(', ')

  // Generar QR
  let qrCodeData = ''
  if (link && tallerData?.no_factura) {
    try {
      qrCodeData = await QRCode.toDataURL(
        `${link}/vista/tallertermica?factura=${tallerData.no_factura}`
      )
    } catch (error) {
      console.error('Error generando QR:', error?.message || error)
    }
  }

  const htmlContent = buildTicketHtml({
    taller: tallerData,
    datosLocalStorage: datosLocalStorage || {},
    printerConfig,
    configuracionfactura,
    qrCodeData,
    fallas,
    totalAbonos,
    primerDato
  })

  await printHtml(htmlContent)
}

defineExpose({ printTicket })
</script>

<template>
  <div style="display: none"></div>
</template>
