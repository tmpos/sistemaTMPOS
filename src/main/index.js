import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  session,
  Menu,
  clipboard,
  safeStorage
} from 'electron'
import { join } from 'path'
import * as path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { Buffer } from 'buffer'
import fsExtra from 'fs-extra'
const { exec } = require('child_process')
// Definir __dirname en ESM
const bcrypt = require('bcryptjs')
const yaml = require('js-yaml')
const nodemailer = require('nodemailer')

import * as fsSync from 'fs'
import AdmZip from 'adm-zip'

import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn } from 'child_process'
import axios from 'axios'
import os from 'os'
import { networkInterfaces } from 'os'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

import { pdfFacturaCarta } from '../../src/renderer/src/printer/facturaPDF.js'
import { pdfCotizacionCarta } from '../../src/renderer/src/printer/cotizacionPDF.js'
import { pdfPreFacturaCarta } from '../../src/renderer/src/printer/preFacturaPDF.js'
import { pdfApartadoCarta } from '../../src/renderer/src/printer/apartadoPDF.js'
import { pdfOrdenCarta } from '../../src/renderer/src/printer/ordenPDF.js'
import { pdfMaterialesOrden } from '../../src/renderer/src/printer/materialesOrdenPDF.js'
import { imprimirTicket } from '../../src/renderer/src/printer/ticket.js'
import { abrirCaja } from '../../src/renderer/src/printer/abrirCaja.js'
import { imprimirTicketCotizacion } from '../../src/renderer/src/printer/ticketCotizacion.js'
import { imprimirTicketPreFactura } from '../../src/renderer/src/printer/ticketPreFactura.js'
import { imprimirTicketApartado } from '../../src/renderer/src/printer/ticketApartado.js'
import { imprimirTicketOrden } from '../../src/renderer/src/printer/ticketOrden.js'
import { imprimirCuadre } from '../../src/renderer/src/printer/cuadre.js'
import { imprimirCuadreCompleto } from '../../src/renderer/src/printer/cuadreCompleto.js'
import { imprimirProductosVendidos } from '../../src/renderer/src/printer/productosVendidos.js'
import { imprimirProductosSinStock } from '../../src/renderer/src/printer/productosSinStock.js'
import { imprimirInventario } from '../../src/renderer/src/printer/inventario.js'
import { imprimirRecibo } from '../../src/renderer/src/printer/recibo.js'
import { imprimirReciboTransferencia } from '../../src/renderer/src/printer/reciboTransferencia.js'
import { imprimirReporte } from '../../src/renderer/src/printer/datosReporte.js'
import { imprimirReporteFacturas } from '../../src/renderer/src/printer/resumenFacturas.js'
import { imprimirReporteCotizaciones } from '../../src/renderer/src/printer/resumenCotizaciones.js'
import { imprimirReporteImei } from '../../src/renderer/src/printer/resumenIMEI.js'
import { imprimirGasto } from '../../src/renderer/src/printer/gasto.js'
//import { imprimirFacturaCreditoCartaPDF } from '../../src/renderer/src/printer/cxcCartaPDF.js'
import { reciboTaller } from '../../src/renderer/src/printer/reciboTaller.js'
import { imprimirFacturaCredito } from '../../src/renderer/src/printer/facturaCredito.js'
import { imprimirCreditoPDF } from '../../src/renderer/src/printer/creditoPDF.js'
import { imprimirTicketCXC } from '../../src/renderer/src/printer/reciboCXC.js'
import { imprimirNC } from '../../src/renderer/src/printer/imprimirNC.js'
import { imprimirMesa } from '../../src/renderer/src/printer/imprimirMesa.js'
//import { generarFactura } from '../../src/renderer/src/printer/generarPDF.js'
import pie from 'puppeteer-in-electron'
import puppeteer from 'puppeteer-core'
//import { Client,LocalAuth,MessageMedia } from 'whatsapp-web.js';
import QRCode from 'qrcode'
import audioPlay from 'audio-play'
import audioLoader from 'audio-loader'

/*****************************************************/
import * as android from '../../src/renderer/src/procesos/electron-android.js'
import * as iphone from '../../src/renderer/src/procesos/electron-iphone.js'
/*****************************************************/
let menuEnabled = false
let userPermissions = []
let menuTemplateGlobal = []
/*****************************************************/
const parsePrinters = (stdout) => {
  return stdout
    .split(/\r?\n/) // cortar por saltos de línea
    .map((line) => line.trim()) // quitar espacios
    .filter((line) => line.length > 0) // quitar líneas vacías
}

/************************************************************************/
// 👉 Función para listar impresoras
const getInstalledPrinters = async () => {
  return new Promise((resolve, reject) => {
    exec(
      'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Printer | Select-Object -ExpandProperty Name"',
      (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error listando impresoras:', stderr || error.message)
          reject(new Error('No se pudieron listar las impresoras'))
          return
        }

        console.log('📄 Raw result:', stdout)
        const lista = parsePrinters(stdout)
        console.log('🖨️ Impresoras disponibles:', lista)

        resolve(lista)
      }
    )
  })
}
/*****************************************************/

/*const {     
    initializeClient,
    sendMessage,
    getChats,
    getContacts,
    sendPDF,
    logout } = require('../../src/renderer/src/printer/WhatsappWeb.js')*/
import * as servidor from '../../src/renderer/src/server/servidor.js'

import { soap } from 'soap'

//const sqlite3 = require('sqlite3').verbose();

//import puppeteer from "puppeteer";

pie.initialize(app)
/*import { createRequire } from 'module';
const require = createRequire(import.meta.url);*/

//import fetchNode from 'node-fetch';
import { PosPrinter, PosPrintData, PosPrintOptions } from '@alvarosacari/electron-pos-printer'
import fs from 'fs/promises'

//import Printer from 'electron-printer';

let progressWin

// Función para crear la ventana de progreso

/*
// Configurar logger para el auto-updater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

log.info('Current version:', app.getVersion());
log.info('App starting...');

// Evento cuando se está buscando una actualización
autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
});

// Evento cuando una actualización está disponible
autoUpdater.on('update-available', () => {
    log.info('Update available.');
    //createProgressWindow(); // Crear y mostrar la ventana de progreso

    dialog.showMessageBox({
        type: 'info',
        title: 'Actualización disponible',
        message: 'Hay una nueva actualización disponible. Se está descargando en segundo plano.'
    }).catch(err => {
        log.error('Error mostrando la caja de diálogo: ' + err);
    });
});

// Evento cuando no hay actualización disponible
autoUpdater.on('update-not-available', () => {
    log.info('No update available.');
});

// Evento cuando ocurre un error
autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater: ' + err);

    if (progressWin) {
        progressWin.close(); // Cerrar la ventana si ocurre un error
    }

    dialog.showErrorBox('Error en la actualización', `Ocurrió un error: ${err.message}`);
});*/
/*
// Evento para el progreso de la descarga
autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download speed: ${progressObj.bytesPerSecond}`);
    log.info(`Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`);

   /* if (progressWin) {
        // Enviar el progreso a la ventana de render
        progressWin.webContents.send('download-progress', progressObj);
    }*/

//});

// Evento cuando la actualización ha sido descargada
/*autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded.');


       // progressWin.close();


    dialog.showMessageBox({
        type: 'info',
        title: 'Actualización descargada',
        message: 'La actualización se ha descargado. La aplicación se reiniciará para aplicar la actualización.'
    }).then(() => {
        autoUpdater.quitAndInstall();
    }).catch(err => {
        log.error('Error mostrando la caja de diálogo: ' + err);
    });
});

// Iniciar el proceso de actualización
autoUpdater.checkForUpdatesAndNotify()
    .then(result => {
        log.info('Update check result:', result);
    })
    .catch(err => {
        log.error('Error checking for updates:', err);
    });
*/
/****************************************************************/
//let progressWin; // Ventana de progreso

// Función para crear la ventana de progreso

/****************************************************************/
const logDir = join(app.getPath('userData'), 'logs')
const logFilePath = join(logDir, 'main.log')
/****************************************************************/
// 🔥 Función para asegurar que el archivo de logs exista
async function ensureLogFileExists() {
  try {
    await fs.mkdir(logDir, { recursive: true }) // Crea la carpeta si no existe
    await fs
      .access(logFilePath) // Verifica si el archivo existe
      .catch(async () => {
        await fs.writeFile(logFilePath, '', 'utf8') // Si no existe, lo crea vacío
      })

    log.transports.file.resolvePath = () => logFilePath
    log.info('📌 Log inicializado en:', logFilePath)
  } catch (error) {
    console.error('❌ Error asegurando el archivo de logs:', error)
  }
}

// Llamar a la función para asegurarnos de que los logs estén disponibles
ensureLogFileExists()

// 🔥 Función para registrar errores en consola y en el archivo de logs
function logError(error, message = 'Error:') {
  console.error(message, error)
  log.error(message, error)
}
/****************************************************************/
// Set up auto-updater for custom server
autoUpdater.autoDownload = false // Prompt user before downloading

// Function to close TM-POS processes
function closeTM_POSProcesses(callback) {
  // Replace 'TM-POS' with the actual process name or command to kill the process
  const command = 'taskkill /IM TM-POS.exe /F' // For Windows
  // const command = 'pkill TM-POS'; // For Linux/MacOS

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error closing TM-POS processes: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`)
      return
    }
    console.log(`Stdout: ${stdout}`)
    if (callback) callback()
  })
}

import {
  peticiones,
  generadorCodigo,
  generarCodigoUnico,
  arrayToObjetoFromTabla,
  mensajetoast,
  actualizarLocalStorage,
  nfecha,
  datosLocalStorage,
  peticionesFetch,
  encryptarPassword
} from '../../src/renderer/src/funciones/funciones.js'

import { printToPOS80 } from '../../src/renderer/src/server/printer.js'
//import {consulta} from '../../src/renderer/src/server/servidorElectron.js';

//let db;

let serverProcess
const currentVersion = app.getVersion() // Obtener la versión actual de la aplicación

function createLoadingWindow() {
  const loadingWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js')
    }
  })

  loadingWindow.loadFile(join(__dirname, '../../src/renderer/src/Loading/loading.html'))
  return loadingWindow
}

let mainWindow

/**********************************************************************/
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false, // Mostrar el menú
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.maximize()
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes('tmposrd.com')) {
      details.requestHeaders['Origin'] = 'https://tmposrd.com'
    }
    callback({ requestHeaders: details.requestHeaders })
  })

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders }

    for (const headerName of Object.keys(responseHeaders)) {
      const normalizedHeaderName = headerName.toLowerCase()
      if (
        normalizedHeaderName === 'access-control-allow-origin' ||
        normalizedHeaderName === 'access-control-allow-methods' ||
        normalizedHeaderName === 'access-control-allow-headers'
      ) {
        delete responseHeaders[headerName]
      }
    }

    responseHeaders['Access-Control-Allow-Origin'] = ['*']
    responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, PATCH, DELETE, OPTIONS']
    responseHeaders['Access-Control-Allow-Headers'] = ['Accept, Authorization, Content-Type']

    callback({ responseHeaders })
  })

  return mainWindow
}

/**********************************************************************/
function updateMenu() {
  const template = menuEnabled
    ? buildMenuTemplate()
    : [{ label: 'Menú Desactivado', enabled: false }]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
/**********************************************************************/
function crearItemMenu(label, ruta) {
  menuTemplateGlobal.push({ label, path: ruta })

  return {
    label,
    click: () => {
      mainWindow.webContents.send('navigate-to', ruta)
    }
  }
}
/**********************************************************************/

function buildMenuTemplate() {
  const hasPermission = (permissions) => permissions.some((perm) => userPermissions.includes(perm))
  menuTemplateGlobal = []

  // Rutas presentes en el menu lateral que todavia no forman parte de las
  // secciones historicas del menu nativo. Mantenerlas en un registro permite
  // que Electron exponga los mismos modulos sin perder sus permisos.
  const gruposMenuLateral = [
    {
      label: 'Sistema y configuracion',
      items: [
        ['Manual del Sistema', '/manual-sistema', ['Administrador', 'Gerente', 'Soporte']],
        ['Configuracion Alanube', '/configuracion-alanube', ['Administrador', 'Gerente', 'Soporte']],
        ['Log E-CF', '/facturacion-electronica-log', ['Administrador', 'Gerente', 'Soporte']],
        ['Centro Empresarial', '/centro-empresarial', ['Administrador', 'Gerente', 'Soporte']],
        ['Almacenes', '/almacenes', ['Administrador', 'Gerente', 'Soporte']],
        ['Configuracion de Correo', '/config_correo', ['Administrador', 'Gerente', 'Soporte']],
        ['Valores por Defecto', '/default', ['Administrador', 'Gerente', 'Soporte']],
        ['Comprobantes Electronicos', '/comprobantes-electronicos', ['Administrador', 'Gerente', 'Soporte']]
      ]
    },
    {
      label: 'Inventario y productos',
      items: [
        ['Electrodomesticos', '/electrodomesticos', ['Administrador', 'Gerente', 'Soporte']],
        ['Inventario Celular', '/inventario_celular', ['Administrador', 'Gerente', 'Soporte']],
        ['Inventario de Accesorios', '/inventario_accesorios', ['Administrador', 'Soporte']],
        ['Productos Danados', '/productos-danados', ['Administrador', 'Gerente', 'Soporte']],
        ['Refurbished', '/refurbished', ['Administrador', 'Gerente', 'Soporte']],
        ['Piezas', '/piezas', ['Administrador', 'Gerente', 'Soporte']],
        ['Productos de Uso Interno', '/productos-uso-interno', ['Administrador', 'Gerente', 'Soporte']]
      ]
    },
    {
      label: 'Contactos y ventas',
      items: [
        ['Meseros', '/meseros', ['Administrador', 'Gerente', 'Soporte']],
        ['Cargos', '/cargos', ['Administrador', 'Soporte']],
        ['Instaladores', '/instaladores', ['Administrador', 'Gerente', 'Soporte']],
        ['Ordenes', '/ordenes', ['Administrador', 'Gerente', 'Soporte']],
        ['Pre Facturas', '/pre_facturas', ['Administrador', 'Gerente', 'Soporte']],
        ['Metas', '/metas', ['Administrador', 'Gerente', 'Soporte']]
      ]
    },
    {
      label: 'Ruleta de Premios',
      items: [
        ['Girar Ruleta', '/ruleta', ['Administrador', 'Gerente', 'Soporte', 'Cajero', 'Vendedor']],
        ['Gestionar Premios', '/ruleta/premios', ['Administrador', 'Gerente', 'Soporte']],
        ['Configuracion de Ruleta', '/ruleta/configuracion', ['Administrador', 'Soporte']]
      ]
    },
    {
      label: 'Taller',
      items: [
        ['Mi Taller', '/mitaller', ['Administrador', 'Gerente', 'Soporte', 'Tecnico']],
        ['Equipos', '/equipos', ['Administrador', 'Gerente', 'Soporte']],
        ['Tecnicos', '/tecnicos', ['Administrador', 'Gerente', 'Soporte']],
        ['Taller', '/taller', ['Administrador', 'Gerente', 'Soporte']],
        ['Cellinfo', '/cellinfo', ['Soporte']],
        ['Recibir Equipo', '/recibirequipo', ['Administrador', 'Gerente', 'Soporte', 'Vendedor', 'Cajero']],
        ['Hoja de Entrada', '/hojaentrada', ['Administrador', 'Gerente', 'Soporte']]
      ]
    },
    {
      label: 'Contabilidad',
      items: [
        ['Cheques', '/cheques', ['Administrador', 'Gerente', 'Soporte', 'Contable']],
        ['Conciliaciones Bancarias', '/conciliaciones', ['Administrador', 'Gerente', 'Soporte', 'Contable']],
        ['Reportes y Analitica', '/reportes-analitica', ['Administrador', 'Gerente', 'Contable']],
        ['Comisiones Bancarias', '/comisionesbancarias', ['Administrador', 'Gerente', 'Soporte', 'Contable']]
      ]
    },
    {
      label: 'Nomina y soporte',
      items: [
        ['Prueba', '/prueba', ['Administrador', 'Gerente', 'Soporte', 'Contable']],
        ['Printer', '/factura', ['Administrador', 'Gerente', 'Soporte', 'Contable']],
        ['Bitacora', '/bitacora', ['Soporte']],
        ['Tokens', '/tokens', ['Administrador', 'Soporte']],
        ['Variables', '/variables', ['Soporte']],
        ['Configuracion de Correo', '/configuracion_correo', ['Administrador', 'Soporte']],
        ['Cuadres', '/cuadres', ['Administrador', 'Soporte']],
        ['Android', '/android', ['Soporte']]
      ]
    },
    {
      label: 'Integraciones',
      items: [['Integraciones', '/integraciones', ['Administrador', 'Gerente', 'Soporte']]]
    }
  ]

  const submenuSincronizado = gruposMenuLateral
    .map((grupo) => ({
      label: grupo.label,
      submenu: grupo.items
        .filter(([, , permisos]) => hasPermission(permisos))
        .map(([label, ruta]) => crearItemMenu(label, ruta))
    }))
    .filter((grupo) => grupo.submenu.length > 0)

  const template = [
    ...(hasPermission(['Administrador', 'Soporte', 'Gerente'])
      ? [
          {
            label: 'Inicio',
            submenu: [crearItemMenu('Dashboard', '/')]
          }
        ]
      : []),
    ...(hasPermission(['Administrador', 'Soporte', 'Gerente'])
      ? [
          {
            label: 'Sistema',
            submenu: [
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Configuración', '/configuracion')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Notificaciones', '/notificaciones')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Backupexcel', '/backupexcel')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Impresoras', '/impresoras')]
                : []),
              crearItemMenu('Configuración de Impresora', '/printerconfig'),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Método de Pago', '/metodopago')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Notas', '/garantia')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Garantía Global', '/garantia_global')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Mensajería', '/mensajeria')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Rutas', '/rutas')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Países', '/paises')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Tema', '/theme')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('WhatsApp', '/whatsappweb')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Registro de Caja', '/registrocaja')]
                : [])
            ]
          }
        ]
      : []),
    ...(hasPermission(['Administrador', 'Soporte', 'Gerente'])
      ? [
          {
            label: 'Productos',
            submenu: [
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Lista de Productos', '/productos')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Combos', '/combos')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Marcas', '/marcas')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Categorías', '/categorias')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Imei', '/imei')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Phone Check', '/phone_check')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Empaques', '/empaques')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Barcode', '/barcode')]
                : [])
            ]
          }
        ]
      : []),
    ...(hasPermission(['Administrador', 'Soporte', 'Gerente'])
      ? [
          {
            label: 'Contactos',
            submenu: [
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Usuarios', '/usuarios')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Clientes', '/clientes')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Proveedores', '/proveedores')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Delivery', '/delivery')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Instituciones', '/instituciones')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Empleados', '/empleados')]
                : [])
            ]
          }
        ]
      : []),
    ...(hasPermission(['Administrador', 'Soporte', 'Gerente'])
      ? [
          {
            label: 'Ventas',
            submenu: [
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Facturas', '/facturas')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Cotización', '/cotizacion')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Financiamientos', '/financiamientos')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Apartados', '/apartados')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Reclamaciones', '/reclamaciones')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Nota de Crédito', '/notacredito')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [
                    crearItemMenu(
                      'Nota de Crédito Electrónica E34',
                      '/crear-nota-credito-electronica'
                    )
                  ]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Conduce', '/conduce')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Ventas en Proceso', '/ventasenproceso')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Mesas', '/mesas')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Devoluciones', '/devoluciones')]
                : [])
            ]
          }
        ]
      : []),
    ...(hasPermission(['Administrador', 'Soporte', 'Contable', 'Gerente'])
      ? [
          {
            label: 'Contabilidad',
            submenu: [
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Cuentas', '/cuentas')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Banco', '/banco')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Transacciones Bancarias', '/transaccionesbancarias')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Trazabilidad de Transacciones', '/trazabilidad-transacciones')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Kardex de Inventario', '/kardex-inventario')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Conteo Físico', '/conteo-fisico')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Transferencias entre Almacenes', '/transferencias-almacenes')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Órdenes de Compra', '/ordenes-compra')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Antigüedad de Saldos', '/antiguedad-saldos')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Flujo de Caja', '/flujo-caja')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Períodos Contables', '/periodos-contables')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Centro de Aprobaciones', '/centro-aprobaciones')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Activos Fijos', '/activos-fijos')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Centros de Costo', '/centros-costo')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Valoración de Inventario', '/valoracion-inventario')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Integridad del Sistema', '/integridad-sistema')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Reportes', '/reportes')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte', 'Contable'])
                ? [crearItemMenu('Impuestos y Retenciones', '/impuestos-retenciones')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Mayor General', '/mayorgeneral')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Asiento Diario', '/asientodiario')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Balance', '/balance')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Entradas Extra', '/entradas')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Entradas Fijas', '/entradasfijas')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Gastos', '/gastos')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Gastos Fijos', '/gastosfijos')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Recibos', '/recibos')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Cuentas por Cobrar', '/cuentas_cobrar')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Cuentas por Pagar', '/cuentasxpagar')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Caja', '/caja')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Caja Chica', '/caja-chica')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Configuración Fiscal', '/confiscal')]
                : []),
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Compras', '/compras')]
                : [])
            ]
          }
        ]
      : []),
    ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
      ? [
          {
            label: 'Nómina',
            submenu: [
              ...(hasPermission(['Administrador', 'Gerente', 'Soporte'])
                ? [crearItemMenu('Nómina', '/nomina')]
                : [])
            ]
          }
        ]
      : []),
    /*    ...(hasPermission(['Soporte', 'Administrador','Gerente']) ? [{
      label: 'Fábrica',
      submenu: [
        ...(hasPermission(['Soporte', 'Administrador','Gerente']) ? [crearItemMenu('Fábrica', '/fabricacion')] : []),
        ...(hasPermission(['Soporte', 'Administrador','Gerente']) ? [crearItemMenu('Medidas', '/medidas')] : []),
        ...(hasPermission(['Soporte', 'Administrador','Gerente']) ? [crearItemMenu('Marcos', '/marcos')] : []),
      ],
    }] : []),*/
    ...(hasPermission(['Soporte'])
      ? [
          {
            label: 'Soporte',
            submenu: [
              ...(hasPermission(['Soporte']) ? [crearItemMenu('Soporte', '/soporte')] : []),
              ...(hasPermission(['Soporte']) ? [crearItemMenu('Variables', '/datos_config')] : []),
              ...(hasPermission(['Soporte']) ? [crearItemMenu('Internet', '/internet')] : []),
              ...(hasPermission(['Soporte'])
                ? [crearItemMenu('Historial Consulta', '/historial_consulta')]
                : []),
              ...(hasPermission(['Administrador', 'Soporte', 'Gerente'])
                ? [crearItemMenu('Documentación', '/documentacion')]
                : []),
              ...(hasPermission(['Soporte']) ? [crearItemMenu('Ferretería', '/ferreteria')] : []),
              ...(hasPermission(['Soporte']) ? [crearItemMenu('Menú', '/menu')] : []),
              ...(hasPermission(['Soporte']) ? [crearItemMenu('Permisos', '/permisos')] : []),
              crearItemMenu('Mensajes', '/mensajes'),
              ...(hasPermission(['Soporte']) ? [crearItemMenu('Pin', '/pin')] : [])
            ]
          }
        ]
      : []),
    ...(submenuSincronizado.length > 0
      ? [{ label: 'Modulos del menu lateral', submenu: submenuSincronizado }]
      : []),
    ...(hasPermission(['Administrador', 'Soporte', 'Gerente', 'Cajero'])
      ? [crearItemMenu('Vender', '/vender')]
      : []),
    ...(hasPermission(['Administrador', 'Soporte', 'Gerente', 'Cajero', 'Vendedor', 'Técnico'])
      ? [crearItemMenu('Asistente AI', '/asistente-ia')]
      : []),
    crearItemMenu('Salir', '/salir')
  ]

  return template
}
/**********************************************************************/
const sourceDir = path.join(app.getAppPath(), 'resources', 'sounds')
const destDir = path.join(app.getPath('userData'), 'sounds')
/**********************************************************************/
async function copySounds() {
  try {
    try {
      await access(destDir)
      //console.log('📂 La carpeta de sonidos ya existe en AppData');
    } catch {
      await fsExtra.copy(sourceDir, destDir)
      // console.log('✅ Carpeta de sonidos copiada a AppData');
    }
  } catch (error) {
    console.error('❌ Error copiando la carpeta de sonidos:', error)
  }
}
/**********************************************************************/
async function playSound(sound) {
  const soundPath = path.join(app.getPath('userData'), 'sounds/' + sound)
  try {
    const buffer = await audioLoader(soundPath)
    audioPlay(buffer)
  } catch (error) {
    console.error('Error reproduciendo el sonido:', error)
  }
}
/**********************************************************************/
function generarTicketHTML(datos, configuracion, datosEmpresa, visibilidad) {
  const templatePath = fileURLToPath(
    new URL(join('../../src/renderer/src/files/ticket.html'), import.meta.url)
  )
  let templateHTML = readFileSync(templatePath, 'utf8')

  // Deserializar la cadena JSON de productos
  const productos = JSON.parse(datos.productos)
  const datosOtro = JSON.parse(datos.otro || '[{}]')

  // Generar HTML para la lista de productos
  const productosHTML = productos
    .map((producto) => {
      const calculo = (Number(producto.precio_venta) * Number(producto.cantidad)).toFixed(2)
      return `
            <tr>
                <td colspan="5" class="" style="overflow-wrap: break-word;">${producto.nombre}</td>
            </tr>
            <tr>
                <td style="padding-left:20px;">${producto.cantidad}</td>
                <td class="precio centrado">${producto.precio_venta}</td>
                <td class="precio centrado">${producto.impuesto}</td>
                <td class="precio centrado">${calculo}</td>
            </tr>
        `
    })
    .join('')

  // Condicionales para las clases CSS
  const clienteClass = visibilidad.cliente ? '' : 'hidden'
  const vendedorClass = visibilidad.vendedor ? '' : 'hidden'
  const cajeroClass = visibilidad.cajero ? '' : 'hidden'
  const impuestoClass = visibilidad.impuesto && datos.impuesto > 0 ? '' : 'hidden'
  const notaClass = visibilidad.nota && datos.nota ? '' : 'hidden'

  // Reemplazar marcadores de posición
  templateHTML = templateHTML
    .replace('{{nombre_negocio}}', configuracion.nombre_negocio)
    .replace('{{direccion}}', configuracion.direccion)
    .replace('{{telefono}}', configuracion.telefono)
    .replace('{{email}}', configuracion.email)
    .replace('{{fecha}}', datos.fecha_emision)
    .replace('{{doc}}', datos.no_factura)
    .replace('{{cliente}}', `<span class="${clienteClass}">CLIENTE: ${datos.nombre_cliente}</span>`)
    .replace('{{vendedor}}', `<span class="${vendedorClass}">VENDEDOR: ${datos.vendedor}</span>`)
    .replace('{{metodo_pago}}', datos.metodo_pago)
    .replace('{{cajero}}', `<span class="${cajeroClass}">CAJERO: ${datos.cajero}</span>`)
    .replace('{{productos}}', productosHTML)
    .replace('{{subtotal}}', datos.subtotal)

    // Sección del impuesto, mostrando si `impuesto` > 0
    .replace(
      '{{impuesto}}',
      `
            <div id="impuesto" class="${impuestoClass}" style="font-weight: bold;">
                <table>
                    <tr>
                        <td><span>${configuracion.nombre_impuesto}</span></td>
                        <td style="text-align:right;"><span style="font-size: 1.5em !important;">${datos.impuesto}</span></td>
                    </tr>
                </table>
            </div>
        `
    )

    .replace('{{nombre_impuesto}}', configuracion.nombre_impuesto)
    .replace('{{total}}', datos.total)

    // Nota, solo visible si existe
    .replace('{{nota}}', `<div class="footer bordeado ${notaClass}"><p>${datos.nota}</p></div>`)

    .replace('{{pago_con}}', datosOtro[0].pagocon || '')
    .replace('{{su_cambio}}', datosOtro[0].sucambio || '')
    .replace('{{descuento}}', datos.descuento || '0')
    .replace('{{font_size}}', configuracion.font_size || '10px')
    .replace('{{page_width}}', configuracion.page_width || '300px')
    .replace('{{body_width}}', configuracion.body_width || '250px')
    .replace('{{ticket_width}}', configuracion.ticket_width || '250px')

  const outputPath = join(__dirname, 'ticket.html')
  writeFileSync(outputPath, templateHTML, 'utf8')

  return outputPath
}

/*function imprimirTicket(datos,configuracion,datosEmpresa,visibilidad) {

//imprimirTicket(datosFactura, configuracion, datosEmpresa, visibilidad);



}*/
/**********************************************************************/
async function createNewWindow(archivo, tipo, silent, visible, cantidad, impresion) {
  const newWindow = new BrowserWindow({
    width: 600,
    height: 800,
    show: visible,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  const config = await loadConfig()

  const printOptions = {
    silent: silent,
    printBackground: true,
    deviceName: config.impresora.printerName,
    margins: {
      marginType: 'minimum'
    },
    pageSize: {
      width: config.impresora.width,
      height: config.impresora.height
    }
  }

  if (tipo === 'url') {
    newWindow.loadURL(archivo)
    if (impresion) {
      // Esperar a que la ventana termine de cargar antes de imprimir
      newWindow.webContents.on('did-finish-load', () => {
        // Usamos una función recursiva o un bucle para manejar la impresión de varias copias
        const printCopies = (remainingCopies) => {
          if (remainingCopies > 0) {
            newWindow.webContents.print(printOptions, (success, errorType) => {
              if (!success) {
                console.error(`Error imprimiendo: ${errorType}`)
              } else {
                console.log(`Copia ${cantidad - remainingCopies + 1} impresa correctamente`)
              }

              // Llamar a la función de nuevo hasta que se impriman todas las copias
              printCopies(remainingCopies - 1)
            })
          } else {
            // Cerrar la ventana después de imprimir todas las copias
            newWindow.close()
          }
        }

        // Iniciar la impresión con la cantidad de copias solicitadas
        printCopies(cantidad)
      })
    }
  } else {
    // Manejo de otros tipos de archivo si es necesario
  }
}

/***********************************************************************/
async function checkRNC(rnc, ncf = '') {
  /*    const params = {
        value: rnc,
        patronBusqueda: 0,
        inicioFilas: 0,
        filaFilas: 10,
        IMEI: '',
    };*/

  const params = {
    RNC: rnc,
    NCF: ncf,
    IMEI: ''
  }

  try {
    const client = await soap.createClientAsync(url)
    const [response] = await client.GetContribuyentesAsync(params)

    if (!response.GetContribuyentesResult) {
      return false
    }

    return JSON.parse(response.GetContribuyentesResult)
  } catch (error) {
    console.error('SOAP Error: ', error)
    return false
  }
}
/***********************************************************************/
ipcMain.handle('devtools', (event) => {
  if (mainWindow) {
    mainWindow.webContents.openDevTools()
  }
})
/***********************************************************************/
let pruebasVenderEnCurso = false

const buscarRaizPruebasVender = () => {
  const candidatos = [app.getAppPath(), process.cwd(), path.resolve(__dirname, '../..')]

  for (const candidato of candidatos) {
    let actual = path.resolve(candidato)
    for (let nivel = 0; nivel < 5; nivel += 1) {
      const packagePath = path.join(actual, 'package.json')
      const pruebasPath = path.join(
        actual,
        'src',
        'renderer',
        'src',
        'views',
        'Vender',
        '__tests__'
      )
      if (fsSync.existsSync(packagePath) && fsSync.existsSync(pruebasPath)) return actual
      const padre = path.dirname(actual)
      if (padre === actual) break
      actual = padre
    }
  }

  return null
}

ipcMain.handle('ejecutar-pruebas-vender', async () => {
  if (pruebasVenderEnCurso) {
    return { success: false, busy: true, error: 'Ya hay una ejecución de pruebas en curso.' }
  }

  const raizProyecto = buscarRaizPruebasVender()
  if (!raizProyecto) {
    return {
      success: false,
      unavailable: true,
      error:
        'La suite técnica no está incluida en esta instalación. Ejecútala desde una compilación que conserve la carpeta fuente del sistema.'
    }
  }

  pruebasVenderEnCurso = true
  const inicio = Date.now()

  return await new Promise((resolve) => {
    const comando = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npm'
    const argumentos =
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'npm.cmd test -- --run']
        : ['test', '--', '--run']
    const proceso = spawn(comando, argumentos, {
      cwd: raizProyecto,
      windowsHide: true,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' }
    })
    const limiteSalida = 2 * 1024 * 1024
    let salida = ''
    let finalizado = false

    const agregarSalida = (data) => {
      if (salida.length >= limiteSalida) return
      salida += String(data).slice(0, limiteSalida - salida.length)
    }

    const finalizar = (resultado) => {
      if (finalizado) return
      finalizado = true
      clearTimeout(temporizador)
      pruebasVenderEnCurso = false
      resolve({ ...resultado, output: salida, durationMs: Date.now() - inicio })
    }

    proceso.stdout.on('data', agregarSalida)
    proceso.stderr.on('data', agregarSalida)
    proceso.on('error', (error) =>
      finalizar({ success: false, error: `No se pudieron iniciar las pruebas: ${error.message}` })
    )
    proceso.on('close', (codigo) =>
      finalizar({
        success: codigo === 0,
        exitCode: codigo,
        error: codigo === 0 ? '' : `Las pruebas terminaron con código ${codigo}.`
      })
    )

    const temporizador = setTimeout(() => {
      proceso.kill()
      finalizar({ success: false, timedOut: true, error: 'Las pruebas excedieron 2 minutos.' })
    }, 120000)
  })
})
/***********************************************************************/
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error('Error al abrir URL externa:', error)
    return { success: false, error: error.message }
  }
})
/***********************************************************************/
ipcMain.handle(
  'copiar-pdf-archivo',
  async (event, { fileName = 'factura.pdf', base64 = '' } = {}) => {
    try {
      if (!base64) {
        throw new Error('No se recibio el PDF')
      }

      const safeFileName = String(fileName || 'factura.pdf').replace(/[<>:"/\\|?*]+/g, '_')
      const tempDir = path.join(app.getPath('temp'), 'tmpos-whatsapp')
      fsSync.mkdirSync(tempDir, { recursive: true })

      const finalFileName = safeFileName.toLowerCase().endsWith('.pdf')
        ? safeFileName
        : `${safeFileName}.pdf`
      const filePath = path.join(tempDir, finalFileName)
      fsSync.writeFileSync(filePath, Buffer.from(base64, 'base64'))

      if (process.platform === 'win32') {
        const escapedPath = filePath.replace(/'/g, "''")
        await new Promise((resolve, reject) => {
          exec(
            `powershell.exe -NoProfile -Command "Set-Clipboard -LiteralPath '${escapedPath}'"`,
            (error) => {
              if (error) reject(error)
              else resolve()
            }
          )
        })
      } else {
        clipboard.writeBuffer('application/pdf', fsSync.readFileSync(filePath))
      }

      return { success: true, filePath }
    } catch (error) {
      return { success: false, error: error.message || String(error) }
    }
  }
)
/***********************************************************************/
ipcMain.handle('buscarrnc', async (event, rnc) => {
  const url = 'https://dgii.gov.do/wsMovilDGII/WSMovilDGII.asmx?wsdl'

  try {
    const result = await checkRNC(rnc)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('ticket', async (event, factura, cliente, datosEmpresa) => {
  try {
    const result = await imprimirTicket(factura, cliente, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('get-printers', async (event) => {
  try {
    const printers = await getInstalledPrinters()
    return printers
  } catch (error) {
    console.error('Error al obtener las impresoras:', error)
    return []
  }
})
/***********************************************************************/
ipcMain.handle(
  'recibotaller',
  async (event, datos, datosEmpresa, silent = true, visible = false, show = false) => {
    try {
      const result = await reciboTaller(datos, datosEmpresa, silent, visible, show)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle('encrypt-password', async (event, password, saltRounds = 10) => {
  return await bcrypt.hash(password, saltRounds)
})

ipcMain.handle('compare-password', async (event, plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword)
})

ipcMain.handle('http-request', async (event, url, options = {}) => {
  try {
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { ok: false, status: 0, error: 'URL HTTP no valida' }
    }

    const response = await axios({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.body,
      responseType: 'text',
      transformResponse: [(data) => data],
      validateStatus: () => true
    })

    const contentType = response.headers?.['content-type'] || ''
    let data = response.data

    if (typeof data === 'string' && contentType.includes('application/json')) {
      try {
        data = JSON.parse(data)
      } catch (error) {
        // Mantener texto crudo si el servidor marca JSON pero responde contenido invalido.
      }
    }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message || 'Error realizando peticion HTTP'
    }
  }
})
/***********************************************************************/
/*ipcMain.handle('generarPDF', async (event, datosEmpresa,nombre) => {
  try {
    const result = await generarFactura(datosEmpresa,nombre)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})*/
/***********************************************************************/
ipcMain.handle('abrircaja', async (event, factura, datosEmpresa) => {
  try {
    const result = await abrirCaja(factura, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
let transporter = null

function getTransporter(config) {
  if (!config?.smtp?.host || !config?.smtp?.user) return null
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port || 465,
    secure: config.smtp.secure !== undefined ? config.smtp.secure : false,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  })
  return transporter
}

// Escuchar eventos para enviar correos
ipcMain.handle('send-email', async (event, mailOptions) => {
  try {
    const config = await loadConfig()
    const transport = getTransporter(config)
    if (!transport) {
      return { success: false, error: 'SMTP no configurado' }
    }
    const info = await transport.sendMail(mailOptions)
    console.log('Correo enviado: ' + info.response)
    return { success: true }
  } catch (error) {
    console.log(error)
    return { success: false, error: error.message }
  }
})
/***********************************************************************/
ipcMain.handle('descargar-e-instalar', async (event, exeName) => {
  if (!exeName || typeof exeName !== 'string') {
    return { success: false, error: 'Nombre de archivo no válido o faltante.' }
  }

  const exeUrl = `https://tmposrd.com/actualizaciones/windows/${exeName}`
  const outputPath = path.join(app.getPath('downloads'), exeName) // carpeta de descargas accesible

  try {
    const response = await axios({ url: exeUrl, method: 'GET', responseType: 'stream' })
    const total = parseInt(response.headers['content-length'], 10)
    let received = 0

    const writer = fsSync.createWriteStream(outputPath)

    response.data.on('data', (chunk) => {
      received += chunk.length
      const porcentaje = Math.floor((received / total) * 100)
      mainWindow.webContents.send('progreso-descarga', porcentaje)
    })

    await new Promise((resolve, reject) => {
      response.data.pipe(writer)
      writer.on('finish', resolve)
      writer.on('error', reject)
    })

    console.log(`✅ Archivo descargado en: ${outputPath}`)
    mainWindow.webContents.send('descarga-completa', outputPath)

    ipcMain.once('confirmar-instalacion', () => {
      // Ejecuta el instalador (¡pide permisos de admin si los necesita!)
      const installerProcess = spawn(outputPath, ['/S'], {
        detached: true,
        stdio: 'ignore'
      })
      installerProcess.unref()

      console.log('✅ Instalador lanzado.')
      app.quit()
    })

    return { success: true, outputPath }
  } catch (err) {
    console.error('Error durante la descarga:', err)
    return { success: false, error: err.message }
  }
})

function cerrarProcesoTMPOS(callback) {
  exec('taskkill /IM "TM-POS.exe" /F', (error) => {
    if (error) {
      console.warn('No se pudo cerrar TM-POS.exe o no está corriendo:', error.message)
    }
    callback()
  })
}

/***********************************************************************/
ipcMain.handle('consultarRNC', async (event, rncCedulaNumber) => {
  const browser = await pie.connect(app, puppeteer)

  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      offscreen: true
    }
  })

  const url = 'https://dgii.gov.do/herramientas/consultas/Paginas/RNC.aspx'
  await window.loadURL(url)
  const page = await pie.getPage(browser, window)

  try {
    // Configuración para evitar detección de bots
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36'
    )
    await page.setViewport({ width: 1280, height: 800 })
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })

    // Esperar a que el iframe esté disponible
    await page.waitForSelector('#MSOPageViewerWebPart_WebPartWPQ2', { timeout: 20000 })

    // Obtener el iframe
    const elementHandle = await page.$('#MSOPageViewerWebPart_WebPartWPQ2')
    const frame = await elementHandle.contentFrame()

    if (!frame) {
      throw new Error('No se pudo acceder al iframe.')
    }

    // Esperar que el campo de RNC/Cédula esté disponible en el iframe y llenarlo
    await frame.waitForSelector('#cphMain_txtRNCCedula', { timeout: 20000 })
    await frame.type('#cphMain_txtRNCCedula', rncCedulaNumber)

    // Hacer clic en el botón de búsqueda
    await frame.waitForSelector('#cphMain_btnBuscarPorRNC', { timeout: 20000 })
    await frame.click('#cphMain_btnBuscarPorRNC')

    // Esperar un tiempo adicional para permitir que la tabla se cargue
    await frame.waitForSelector('#cphMain_dvDatosContribuyentes', { timeout: 30000 })
    await new Promise((resolve) => setTimeout(resolve, 5000)) // Espera adicional de 5 segundos

    // Imprimir el contenido HTML del iframe para verificar si la tabla se ha llenado
    const frameContent = await frame.content()

    // Extraer los datos de la tabla
    const data = await frame.evaluate(() => {
      const table = document.querySelector('#cphMain_dvDatosContribuyentes')
      const rows = table.querySelectorAll('tr')
      const result = {}

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td')
        if (cells.length === 2) {
          let key = cells[0].innerText.trim()
          let value = cells[1].innerText.trim()

          key = key
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase()

          result[key] = value
        }
      })

      return result
    })

    if (data && Object.keys(data).length > 0) {
      return data
    } else {
      throw new Error('No se encontraron datos en la tabla.')
    }
  } catch (error) {
    console.error('Error en consultarRNC:', error)
    return { error: error.message }
  } finally {
    window.destroy()
  }
})

/***********************************************************************/

ipcMain.handle('consultarRNC2', async (event, rncCedulaNumber) => {
  const browser = await pie.connect(app, puppeteer)

  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Puedes cambiar a false si no quieres mostrar la ventana
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      offscreen: true
    }
  })

  //const url = 'https://www.dgii.gov.do/app/WebApps/ConsultasWeb/consultas/rnc.aspx'
  const url = 'https://dgii.gov.do/herramientas/consultas/Paginas/RNC.aspx'
  await window.loadURL(url)

  const page = await pie.getPage(browser, window)

  try {
    // Paso 1: Esperar que el campo de RNC/Cédula esté disponible y llenarlo
    //await page.waitForSelector('#ctl00_cphMain_txtRNCCedula', { timeout: 10000 })
    await page.waitForSelector('#cphMain_txtRNCCedula', { timeout: 10000 })
    // await page.type('#ctl00_cphMain_txtRNCCedula', rncCedulaNumber)
    await page.type('#cphMain_txtRNCCedula', rncCedulaNumber)
    //await page.click('#ctl00_cphMain_btnBuscarPorRNC')
    await page.click('#cphMain_btnBuscarPorRNC')

    // Paso 2: Esperar a que la tabla esté visible
    //await page.waitForSelector('#ctl00_cphMain_dvDatosContribuyentes', { timeout: 30000 })
    await page.waitForSelector('#cphMain_dvDatosContribuyentes', { timeout: 30000 })

    // Pausar temporalmente para asegurarse de que la tabla se haya cargado completamente
    await new Promise((resolve) => setTimeout(resolve, 3000)) // Espera 3 segundos adicionales

    // Paso 3: Verificar si la tabla tiene contenido visible
    const tableVisible = await page.evaluate(() => {
      //const table = document.querySelector('#ctl00_cphMain_dvDatosContribuyentes')
      const table = document.querySelector('#cphMain_dvDatosContribuyentes')
      return (
        table && window.getComputedStyle(table).display !== 'none' && table.innerText.trim() !== ''
      )
    })

    if (!tableVisible) {
      throw new Error('La tabla está vacía o no es visible.')
    }

    // Paso 4: Extraer los datos de la tabla
    const data = await page.evaluate(() => {
      //const table = document.querySelector('#ctl00_cphMain_dvDatosContribuyentes')
      const table = document.querySelector('#cphMain_dvDatosContribuyentes')
      const rows = table.querySelectorAll('tr')
      const result = {}

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td')
        if (cells.length === 2) {
          let key = cells[0].innerText.trim()
          let value = cells[1].innerText.trim()

          // Normalizar la clave (quitar acentos, caracteres especiales y reemplazar espacios con '_')
          key = key
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
            .replace(/[^a-zA-Z0-9 ]/g, '') // Elimina caracteres especiales
            .replace(/\s+/g, '_') // Reemplaza espacios por '_'
            .toLowerCase() // Convierte todo a minúsculas

          result[key] = value
        }
      })

      return result
    })

    // Verificar si se obtuvieron datos
    if (data && Object.keys(data).length > 0) {
      return data
    } else {
      throw new Error('No se encontraron datos en la tabla.')
    }
  } catch (error) {
    console.error('Error en consultarRNC:', error)
    return { error: error.message }
  } finally {
    window.destroy() // Cerrar la ventana de Electron
  }
})

/***********************************************************************/
ipcMain.handle('fetch-youtube-videos', async (event, playlistUrl) => {
  const browser = await pie.connect(app, puppeteer)
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      offscreen: true
    }
  })

  await window.loadURL(playlistUrl)
  const page = await pie.getPage(browser, window)

  try {
    await page.waitForSelector('a#video-title', { timeout: 10000 })
    const videos = await page.evaluate(() => {
      const videoElements = document.querySelectorAll('a#video-title')
      return Array.from(videoElements).map((element) => {
        const title = element.textContent.trim()
        const url = `https://www.youtube.com${element.getAttribute('href')}`
        const videoId = url.split('v=')[1]
        return { title, url, videoId }
      })
    })

    return videos
  } catch (error) {
    console.error('Error en el proceso:', error)
    return { error: error.message }
  } finally {
    window.destroy()
  }
})
/***********************************************************************/
ipcMain.handle('consultarPasaporte', async (event, cedulaNumber) => {
  const browser = await pie.connect(app, puppeteer)

  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      offscreen: true,
      additionalArguments: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']
    }
  })

  const url = 'https://solicitudweb.pasaportes.gob.do/pasaporte'
  await window.loadURL(url)

  const page = await pie.getPage(browser, window)

  // Bloquear recursos innecesarios
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const blocked = ['image', 'stylesheet', 'font', 'media']
    if (blocked.includes(req.resourceType())) req.abort()
    else req.continue()
  })

  try {
    // Paso 1: Clic en "Solicitud de pasaporte por primera vez"
    await page.waitForSelector('#btnEmision', { timeout: 10000 })
    await Promise.all([
      page.click('#btnEmision'),
      page.waitForSelector('.v-button-adulto', { timeout: 10000 })
    ])

    // Paso 2: Clic en "Clic aquí para Adulto"
    await Promise.all([
      page.click('.v-button-adulto'),
      page.waitForSelector('input[placeholder="Cédula Vigente"]', { timeout: 10000 })
    ])

    // Paso 3: Escribir la cédula
    await page.type('input[placeholder="Cédula Vigente"]', cedulaNumber)

    // Paso 4: Seleccionar "Santiago"
    await Promise.all([
      page.click('.v-filterselect-button'),
      page.waitForSelector('.v-filterselect-suggestpopup', { timeout: 10000 })
    ])
    await page.evaluate(() => {
      const options = [...document.querySelectorAll('.gwt-MenuItem')]
      const santiago = options.find((opt) => opt.innerText.includes('Santiago'))
      if (santiago) santiago.click()
    })

    // Paso 5: Llenar correos
    await Promise.all([
      page.waitForSelector('input[placeholder="Correo electrónico"]', { timeout: 10000 }),
      page.waitForSelector('input[placeholder="Conf. Correo electrónico"]', { timeout: 10000 })
    ])
    await page.type('input[placeholder="Correo electrónico"]', 'correo@ejemplo.com')
    await page.type('input[placeholder="Conf. Correo electrónico"]', 'correo@ejemplo.com')

    // Paso 6: Clic en "Siguiente"
    await Promise.all([
      page.click('div.boton-blue-icon-right'),
      page.waitForSelector('input[placeholder="Nombres:"]', { timeout: 10000 })
    ])

    // Paso 7: Esperar que los campos tengan valores
    await page.waitForFunction(
      () => {
        const nombre = document.querySelector('input[placeholder="Nombres:"]')
        const apellido = document.querySelector('input[placeholder="Apellidos:"]')
        return nombre?.value?.length > 0 && apellido?.value?.length > 0
      },
      { timeout: 10000 }
    )

    // Extraer los datos
    const data = await page.evaluate(() => {
      const nombre = document.querySelector('input[placeholder="Nombres:"]')?.value || ''
      const apellido = document.querySelector('input[placeholder="Apellidos:"]')?.value || ''

      // Extraer el sexo leyendo el innerText del combobox padre
      const sexoContainer = document.querySelector('[aria-labelledby="gwt-uid-112"]')?.parentElement
      const sexo = sexoContainer?.innerText?.trim() || ''

      return { nombre, apellido, sexo }
    })

    console.log('✅ Datos extraídos:', data)
    return data
  } catch (error) {
    console.error('❌ Error en el proceso:', error)
    return { error: error.message }
  } finally {
    window.destroy()
  }
})
/***********************************************************************/
ipcMain.handle('consultarIMEI', async (event, imeiNumber) => {
  // Conectar Puppeteer con Electron
  const browser = await pie.connect(app, puppeteer)

  // Crear la ventana del navegador de Electron, pero ocultarla con `show: false`
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true, // Mostrar la ventana para verificar manualmente
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      offscreen: false
    }
  })

  // Cargar la URL de la página
  const url = 'https://imeicheck.com/es/verificador-imei'
  await window.loadURL(url)

  // Obtener el objeto 'page' de Puppeteer, vinculado con la ventana de Electron
  const page = await pie.getPage(browser, window)

  try {
    // Paso 1: Esperar que el campo de IMEI esté disponible y llenarlo
    await page.waitForSelector('#imeiFld', { timeout: 20000 })
    await page.type('#imeiFld', imeiNumber)

    // Paso 2: Hacer clic en el botón de tipo submit
    await page.click('button[type="submit"]')

    // Paso 3: Esperar a que la animación de carga se complete
    // Ajusta el selector según la animación de carga específica
    await page.waitForSelector('#preloader', { hidden: true, timeout: 30000 })

    // Paso 4: Esperar a que aparezca el modal con los datos
    await page.waitForSelector('.swal2-content', { visible: true, timeout: 30000 })

    // Paso 5: Extraer los datos del modal
    const data = await page.evaluate(() => {
      const content = document.querySelector('.swal2-content').innerHTML

      // Crear un objeto para almacenar los datos extraídos
      const data = {}

      // Extraer datos utilizando expresiones regulares o selectores específicos
      const descriptionMatch = content.match(/<b>Description: (.*?)<\/b>/)
      data.description = descriptionMatch ? descriptionMatch[1] : null

      const imeiMatch = content.match(/IMEI: (.*?)<br>/)
      data.imei = imeiMatch ? imeiMatch[1] : null

      const brandMatch = content.match(/Brand: (.*?)<br>/)
      data.brand = brandMatch ? brandMatch[1] : null

      const modelMatch = content.match(/Model: (.*?)<br>/)
      data.model = modelMatch ? modelMatch[1] : null

      const activationStatusMatch = content.match(
        /Activation Status: <span style="color:(.*?);">(.*?)<\/span>/
      )
      data.activationStatus = activationStatusMatch ? activationStatusMatch[2] : null

      // Continuar extrayendo otros campos relevantes de manera similar...

      return data
    })

    console.log('Datos extraídos:', JSON.stringify(data, null, 2))

    return data // Devolver los datos en formato JSON al proceso renderizador
  } catch (error) {
    console.error('Error en el proceso:', error)
    return { error: error.message }
  } finally {
    // window.destroy(); // Comenta esta línea para mantener la ventana abierta y verificar manualmente
  }
})

/***********************************************************************/
/*ipcMain.handle('revisarActualizacionDisponible', async (event) => {
  try {
    const updateInfo = await autoUpdater.checkForUpdates()
    if (updateInfo.updateInfo && updateInfo.updateInfo.version) {
      return {
        available: true,
        version: updateInfo.updateInfo.version
      }
    } else {
      return {
        available: false,
        version: null
      }
    }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return { error: error.message }
  }
})*/
/***********************************************************************/
ipcMain.handle('revisarActualizacionDisponible', async () => {
  try {
    const response = await axios.get('https://tmposrd.com/actualizaciones/windows/latest.yml')
    const contenidoYml = yaml.load(response.data)

    const versionServidor = contenidoYml.version
    const ejecutable = contenidoYml.path // ahora usamos directamente el .exe
    const versionActual = app.getVersion().trim()

    if (versionServidor !== versionActual) {
      return {
        available: true,
        version: versionServidor,
        exeName: ejecutable // ejemplo: TM-POS-27.5.0.exe
      }
    } else {
      return { available: false }
    }
  } catch (error) {
    console.error('Error verificando actualización:', error)
    return { error: error.message }
  }
})

/***********************************************************************/
// ===========================================================
// 📧 GMAIL: envío con credenciales desde la tabla configuracion_correo
// ===========================================================
ipcMain.handle('enviarCorreo', async (event, opts = {}) => {
  try {
    const {
      mailto,
      subjet = 'Mensaje del sistema',
      mensaje = 'Sin contenido',
      albody,
      file,
      fileBase64,
      files,
      filename,
      correo,
      empresa = 'TM POS SRL'
    } = opts

    if (!mailto) throw new Error('Falta el destinatario (mailto)')

    // 🔹 Leer datos de configuración desde la tabla configuracion_correo
    // const filas = await datosCorreo("getDataAsArray", ["configuracion_correo"]);
    const config = correo

    if (!config) {
      throw new Error('No se encontró configuración de correo en la base de datos.')
    }

    // 🔐 Decodificar contraseña en base64
    const pass = Buffer.from(config.password || '', 'base64').toString('utf8')
    const emailUser = config.email

    if (!emailUser || !pass) {
      throw new Error('Configuración de correo incompleta (email o password faltante).')
    }

    // 🟢 Configurar transportador para Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: pass // debe ser la contraseña de aplicación, no la normal
      }
    })

    // 📎 Adjuntos
    const attachments = []

    if (fileBase64) {
      try {
        attachments.push({
          filename: filename || 'adjunto.pdf',
          content: Buffer.from(fileBase64, 'base64')
        })
      } catch (err) {
        console.error('⚠️ Error procesando fileBase64:', err)
      }
    }

    if (file) {
      if (Buffer.isBuffer(file)) {
        attachments.push({
          filename: filename || 'adjunto.pdf',
          content: file
        })
      } else if (typeof file === 'string' && fs.existsSync(file)) {
        attachments.push({ path: file })
      }
    }

    if (Array.isArray(files) && files.length > 0) {
      files.forEach((f, i) => {
        try {
          if (Buffer.isBuffer(f)) {
            attachments.push({
              filename: f.name || `adjunto-${i + 1}.pdf`,
              content: f
            })
          } else if (typeof f === 'string' && fs.existsSync(f)) {
            attachments.push({ path: f })
          } else if (typeof f === 'object' && f.base64 && f.name) {
            attachments.push({
              filename: f.name,
              content: Buffer.from(f.base64, 'base64')
            })
          }
        } catch (err) {
          console.error('⚠️ Error procesando archivo múltiple:', err)
        }
      })
    }

    // 📧 Opciones del correo
    const mailOptions = {
      from: `"${empresa}" <${emailUser}>`,
      to: Array.isArray(mailto) ? mailto.join(',') : mailto,
      subject: subjet,
      text: mensaje,
      html: albody || mensaje,
      attachments
    }

    // 📨 Enviar correo
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Correo enviado:', info.response)

    return { ok: true, info: info.response, adjuntos: attachments.length }
  } catch (error) {
    console.error('❌ Error enviando correo:', error)
    return { ok: false, error: error.message }
  }
})
/***********************************************************************/
ipcMain.handle(
  'ticketcotizacion',
  async (event, factura, datosEmpresa, silent = true, visible = false, ventana = true) => {
    try {
      const result = await imprimirTicketCotizacion(factura, datosEmpresa, silent, visible, ventana)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle('facturaPDF', async (event, factura, cliente, datosEmpresa, impresora) => {
  try {
    const result = await pdfFacturaCarta(factura, cliente, datosEmpresa, impresora)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('cotizacionPDF', async (event, factura, cliente, datosEmpresa, impresora) => {
  try {
    const result = await pdfCotizacionCarta(factura, cliente, datosEmpresa, impresora)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('ticketprefactura', async (event, factura, datosEmpresa) => {
  try {
    const result = await imprimirTicketPreFactura(factura, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('prefacturaPDF', async (event, factura, cliente, datosEmpresa, impresora) => {
  try {
    const result = await pdfPreFacturaCarta(factura, cliente, datosEmpresa, impresora)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('ticketApartado', async (event, factura, datosEmpresa) => {
  try {
    const result = await imprimirTicketApartado(factura, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('apartadoPDF', async (event, factura, cliente, datosEmpresa, impresora) => {
  try {
    const result = await pdfApartadoCarta(factura, cliente, datosEmpresa, impresora)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('ticketOrden', async (event, factura, datosEmpresa) => {
  try {
    const result = await imprimirTicketOrden(factura, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('ordenPDF', async (event, factura, cliente, datosEmpresa, impresora) => {
  try {
    const result = await pdfOrdenCarta(factura, cliente, datosEmpresa, impresora)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('materialesOrdenPDF', async (event, factura, datosEmpresa) => {
  try {
    const result = await pdfMaterialesOrden(factura, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('imprimirNC', async (event, factura, datosEmpresa) => {
  try {
    const result = await imprimirNC(factura, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle('imprimirMesa', async (event, idMesa, datosEmpresa) => {
  try {
    const result = await imprimirMesa(idMesa, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
ipcMain.handle(
  'facturaCredito',
  async (event, credito, factura, datosEmpresa, silent = true, visible = false, ventana = true) => {
    try {
      const result = await imprimirFacturaCredito(
        credito,
        factura,
        datosEmpresa,
        silent,
        visible,
        ventana
      )
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle('ticketCXC', async (event, facturas, cliente, datosEmpresa) => {
  try {
    const result = await imprimirTicketCXC(facturas, cliente, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
//imprimirTicketCXC
/***********************************************************************/
ipcMain.handle('creditoPDF', async (event, facturas, cliente, datosEmpresa) => {
  try {
    const result = await imprimirCreditoPDF(facturas, cliente, datosEmpresa)
    return result
  } catch (error) {
    console.error(error)
    return error
  }
})
/***********************************************************************/
/*ipcMain.handle(
  'cxcCartaPDF',
  async (event, factura,cliente, datosEmpresa) => {
    try {
      const result = await imprimirFacturaCreditoCartaPDF(factura,cliente, datosEmpresa)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)*/
/***********************************************************************/
ipcMain.handle(
  'ticketproductosvendidos',
  async (event, productos, datosEmpresa, silent = true, visible = false, ventana = true) => {
    try {
      const result = await imprimirProductosVendidos(
        productos,
        datosEmpresa,
        silent,
        visible,
        ventana
      )
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle(
  'ticketproductossinstock',
  async (event, productos, datosEmpresa, silent = true, visible = false, ventana = true) => {
    try {
      const result = await imprimirProductosSinStock(
        productos,
        datosEmpresa,
        silent,
        visible,
        ventana
      )
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle(
  'ticketinventario',
  async (event, productos, datosEmpresa, silent = true, visible = false, ventana = true) => {
    try {
      const result = await imprimirInventario(productos, datosEmpresa, silent, visible, ventana)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle(
  'recibo',
  async (event, datos, datosEmpresa, silent = true, visible = false, ventana = false) => {
    try {
      const result = await imprimirRecibo(datos, datosEmpresa, silent, visible, ventana)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle(
  'gasto',
  async (event, datos, datosEmpresa, silent = true, visible = false, ventana = false) => {
    try {
      const result = await imprimirGasto(datos, datosEmpresa, silent, visible, ventana)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle(
  'recibotransferencia',
  async (event, datos, datosEmpresa, silent = true, visible = false, ventana = false) => {
    try {
      const result = await imprimirReciboTransferencia(
        datos,
        datosEmpresa,
        silent,
        visible,
        ventana
      )
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
//imprimirReporte
ipcMain.handle(
  'reporte',
  async (event, datos, datosEmpresa, silent = true, visible = false, ventana = false) => {
    try {
      const result = await imprimirReporte(datos, datosEmpresa, silent, visible, ventana)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)

/***********************************************************************/
//imprimirReporteFacturas
ipcMain.handle(
  'resumenfacturas',
  async (event, datos, datosEmpresa, silent = true, visible = false, ventana = false) => {
    try {
      const result = await imprimirReporteFacturas(datos, datosEmpresa, silent, visible, ventana)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle(
  'reportecotizaciones',
  async (event, datos, datosEmpresa, silent = true, visible = false, ventana = false) => {
    try {
      const result = await imprimirReporteCotizaciones(
        datos,
        datosEmpresa,
        silent,
        visible,
        ventana
      )
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle('set-menu-enabled', async (event, enabled) => {
  menuEnabled = !!enabled // fuerza booleano
  updateMenu() // actualiza el menú
  return { success: true, menuEnabled }
})
/***********************************************************************/
ipcMain.handle(
  'reporteimei',
  async (event, datos, datosEmpresa, silent = true, visible = false, ventana = false) => {
    try {
      const result = await imprimirReporteImei(datos, datosEmpresa, silent, visible, ventana)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle(
  'imprimircuadre',
  async (event, datos, datosEmpresa, silent = true, visible = false, ventana = true) => {
    try {
      console.log('datos', datos)
      const result = await imprimirCuadre(datos, datosEmpresa, silent, visible, ventana)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }
)
/***********************************************************************/
ipcMain.handle(
  'imprimirCuadreCompleto',
  async (
    event,
    totalContado,
    datosEmpresa,
    silent = true,
    visible = false,
    ventana = true,
    fecha = false
  ) => {
    try {
      const result = await imprimirCuadreCompleto(
        totalContado,
        datosEmpresa,
        silent,
        visible,
        ventana,
        fecha
      )
      return { ok: true, result }
    } catch (error) {
      console.error(error)
      return { ok: false, error: error?.message || String(error) }
    }
  }
)
/***********************************************************************/

ipcMain.handle(
  'open-new-window',
  (event, archivo, tipo, silent = false, visible = true, impresion = true, cantidad = 1) => {
    createNewWindow(archivo, tipo, silent, visible, cantidad, impresion)
  }
)

/**************************************************************/

/**************************************************************/
ipcMain.handle('print-barcode', async (event, args) => {
  try {
    const {
      barcodeData,
      precio,
      printerName,
      code,
      tipo,
      text,
      width,
      height,
      fontSize,
      labelWidth,
      labelHeight,
      imagen,
      incluirCabecera,
      incluirTexto,
      incluirCodigo,
      incluirOtro,
      incluirPrecio,
      margins,
      cantidad,
      headerText,
      orientacion,
      qr, // Nueva propiedad para determinar si se imprime un código QR
      truncado // Nueva propiedad opcional para truncar el código
    } = args

    const config = await loadConfig()
    const labelPrinterName = printerName || config?.impresoraLabel?.printerName || '4BARCODE'
    const escapeHtml = (value = '') =>
      String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    const escapeJsString = (value = '') => JSON.stringify(String(value))
    const safeHeaderText = escapeHtml(headerText || '')
    const safeText = escapeHtml(text || '')
    const safePrecio = escapeHtml(precio || '')
    const safeCode = escapeHtml(code || '')

    // 🔹 Si truncado es true, mostrar solo últimos 6 dígitos
    const displayCode = truncado ? String(code).slice(-6) : code
    const safeDisplayCode = escapeHtml(displayCode || '')
    const barcodeReferenceLength = Math.max(String(displayCode || code || '').length, 8)
    const barcodeVisualWidth = Math.max(
      54,
      Math.min(labelWidth * 0.72, width * barcodeReferenceLength * 6.5)
    )

    // Definir el tamaño del papel en micras
    let labelWidthMicrons = (labelWidth * 1000 * 25.4) / 96
    let labelHeightMicrons = (labelHeight * 1000 * 25.4) / 96

    if (orientacion === 'horizontal') {
      ;[labelWidthMicrons, labelHeightMicrons] = [labelHeightMicrons, labelWidthMicrons]
    }

    const marginsMicrons = {
      top: margins.top * 25.4,
      right: margins.right * 25.4,
      bottom: margins.bottom * 25.4,
      left: margins.left * 25.4
    }

    const rotationStyle = orientacion === 'horizontal' ? 'transform: rotate(90deg);' : ''

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <style>
    body {
        margin: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: ${labelHeight}px !important;
        width: ${labelWidth}px !important;
        font-family: Arial, sans-serif;
        text-align: center;
        overflow: hidden;
    }
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
        ${rotationStyle}
        line-height: 1;
    }
    .titulo {
        font-size: ${fontSize}px;
        font-weight: bold;
        margin: 0;
        padding: 0;
        line-height: 1;
        width: ${labelWidth * 0.9}px;
        max-width: 90%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .barcode-container {
        display: flex;
        margin: 0;
        padding: 0;
        align-items: center;
        justify-content: center;
        height: ${height}px;
        line-height: 1;
        transform: translateY(-2px);
    }
    .barcode {
        width: ${barcodeVisualWidth}px;
        max-width: ${barcodeVisualWidth}px;
        height: ${height}px;
        margin: 0;
        padding: 0;
        display: block;
    }
    .qr-code {
        width: ${labelWidth * 0.9}px;
        max-width: 90%;
        height: ${height}px;
        margin: 0;
        padding: 0;
    }
    .img-logo {
        max-width: 100%;
        height: ${height}px;
        object-fit: contain;
    }
    .texto {
        margin: -2px 0 0 0;
        padding: 0;
        font-size: ${fontSize}px;
        text-align: center;
        line-height: 1;
        width: ${labelWidth * 0.6}px;
        word-wrap: break-word;
        white-space: normal;
        overflow-wrap: break-word;
    }
    .precio {
        font-size: ${fontSize + 2}px;
        font-weight: bold;
        margin: -1px 0 0 0;
        padding: 0;
        line-height: 1;
    }
    </style>
</head>
<body>
    <div class="container">
        ${incluirCabecera ? `<div class="titulo">${safeHeaderText}</div>` : ''}

        <div class="barcode-container">
            ${
              incluirOtro
                ? `<img src="${imagen}" class="img-logo" />`
                : qr
                  ? `<div id="qrcode" class="qr-code"></div>`
                  : `<svg class="barcode"
                        jsbarcode-format="${tipo}"
                        jsbarcode-value="${safeCode}"
                        jsbarcode-text="${incluirCodigo ? safeDisplayCode : ''}"
                        jsbarcode-textmargin="0"
                        jsbarcode-margin="0"
                        jsbarcode-fontsize="${fontSize + 10}"
                        jsbarcode-width="${width}"
                        jsbarcode-height="${height}"
                        jsbarcode-font="monospace"
                        jsbarcode-fontoptions="bold"
                        jsbarcode-textalign="center"
                        jsbarcode-textposition="bottom"
                        jsbarcode-displayvalue="${incluirCodigo}">
                    </svg>`
            }
        </div>

        ${incluirTexto ? `<div class="texto">${safeText}</div>` : ''}
        ${incluirPrecio ? `<div class="precio">${safePrecio}</div>` : ''}
    </div>

    <script>
        if (!${incluirOtro}) {
            ${
              qr
                ? `const QRCode = require('qrcode');
                   QRCode.toDataURL("${code}", { width: ${width}, height: ${height} }, function (err, url) {
                     if (err) throw err;
                     document.getElementById('qrcode').innerHTML = '<img src="' + url + '" />';
                   });`
                : `const JsBarcode = require('jsbarcode');
                   JsBarcode(".barcode").init();`
            }
        }
    </script>
</body>
</html>`

    return new Promise((resolve) => {
      const printWindow = new BrowserWindow({
        width: orientacion === 'horizontal' ? labelHeight + 50 : labelWidth + 50,
        height: orientacion === 'horizontal' ? labelWidth + 50 : labelHeight + 50,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      })

      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: labelPrinterName,
            margins: {
              marginType: 'custom',
              top: marginsMicrons.top,
              bottom: marginsMicrons.bottom,
              left: marginsMicrons.left,
              right: marginsMicrons.right
            },
            pageSize: { width: labelWidthMicrons, height: labelHeightMicrons },
            copies: cantidad
          },
          (success, failureReason) => {
            printWindow.close()
            if (success) {
              resolve({ success: true })
            } else {
              resolve({ success: false, error: failureReason })
            }
          }
        )
      })
    })
  } catch (error) {
    return { success: false, error: error.message }
  }
})
/**************************************************************/
ipcMain.handle('print-ticket', async (event, ticketHTML) => {
  try {
    const printWindow = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    })

    const config = await loadConfig()

    // Parsear impresora si viene como string JSON
    let impresoraConfig = config.impresora || {}
    if (typeof impresoraConfig === 'string') {
      try {
        impresoraConfig = JSON.parse(impresoraConfig)
      } catch {
        impresoraConfig = {}
      }
    }

    const pageSizeWidth = Number(impresoraConfig.pageSizeWidth) || 80000
    const pageSizeHeight = Number(impresoraConfig.pageSizeHeight) || 295000
    const copies = Math.max(
      1,
      Math.floor(Number(impresoraConfig.copies || impresoraConfig.copias || config.copies || 1))
    )

    const printOptions = {
      silent: config.silent !== undefined ? config.silent : true,
      printBackground: true,
      deviceName: impresoraConfig.printerName || '',
      margins: {
        marginType: 'custom',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      },
      pageSize: {
        width: pageSizeWidth,
        height: pageSizeHeight
      },
      copies: 1
    }

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(ticketHTML)}`)

    return await new Promise((resolve) => {
      let finalizado = false

      printWindow.webContents.on('did-finish-load', () => {
        const imprimirCopia = (copiaActual = 1) => {
          printWindow.webContents.print(printOptions, (success, failureReason) => {
            if (!success) {
              finalizado = true
              printWindow.close()
              resolve({ success: false, error: failureReason })
              return
            }

            if (copiaActual < copies) {
              imprimirCopia(copiaActual + 1)
              return
            }

            finalizado = true
            printWindow.close()
            resolve({ success: true, message: `Ticket impreso correctamente. Copias: ${copies}` })
          })
        }

        imprimirCopia()
      })

      printWindow.once('ready-to-show', () => {
        printWindow.show()
      })

      printWindow.on('closed', () => {
        if (!finalizado) {
          resolve({ success: false, error: 'La ventana de impresion se cerro antes de completar.' })
        }
      })
    })
  } catch (error) {
    console.error('Error imprimiendo ticket:', error)
    return { success: false, error: error.message }
  }
})
/**************************************************************/
ipcMain.handle('print-html', async (event, args) => {
  try {
    const {
      html,
      printerName = '',
      width = 800,
      height = 600,
      pageSize,
      silent = true,
      copies = 1
    } = args || {}

    if (!html) {
      return { success: false, error: 'No HTML content provided' }
    }

    const printWindow = new BrowserWindow({
      width,
      height,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    const printOptions = {
      silent,
      printBackground: true,
      deviceName: printerName,
      copies
    }

    if (pageSize?.width && pageSize?.height) {
      printOptions.pageSize = {
        width: pageSize.width,
        height: pageSize.height
      }
    }

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    return await new Promise((resolve) => {
      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print(printOptions, (success, failureReason) => {
          printWindow.close()
          if (success) {
            resolve({ success: true })
          } else {
            resolve({ success: false, error: failureReason })
          }
        })
      })
    })
  } catch (error) {
    console.error('Error imprimiendo HTML:', error)
    return { success: false, error: error.message }
  }
})
/**************************************************************/
const openAIConfigPath = () => join(app.getPath('userData'), 'openai-settings.json')

const readOpenAIConfig = async () => {
  try {
    const raw = await fs.readFile(openAIConfigPath(), 'utf8')
    const config = JSON.parse(raw)
    let apiKey = ''
    if (config.encryptedApiKey && safeStorage.isEncryptionAvailable()) {
      apiKey = safeStorage.decryptString(Buffer.from(config.encryptedApiKey, 'base64'))
    }
    return {
      apiKey,
      model: String(config.model || 'gpt-4.1-mini').trim() || 'gpt-4.1-mini'
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') console.error('No se pudo leer la configuracion de OpenAI:', error)
    return { apiKey: '', model: 'gpt-4.1-mini' }
  }
}

const publicOpenAIConfig = (config) => ({
  configured: Boolean(config.apiKey),
  model: config.model,
  maskedKey: config.apiKey ? `${config.apiKey.slice(0, 7)}...${config.apiKey.slice(-4)}` : ''
})

ipcMain.handle('openai-config:get', async () => publicOpenAIConfig(await readOpenAIConfig()))

ipcMain.handle('openai-config:save', async (_event, payload = {}) => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('El cifrado seguro de Electron no esta disponible en este equipo.')
  }
  const current = await readOpenAIConfig()
  const apiKey = String(payload.apiKey || current.apiKey || '').trim()
  const model = String(payload.model || current.model || 'gpt-4.1-mini').trim()
  if (!apiKey.startsWith('sk-')) throw new Error('La API Key de OpenAI no parece valida.')
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error('El nombre del modelo no es valido.')
  const encryptedApiKey = safeStorage.encryptString(apiKey).toString('base64')
  await fs.writeFile(openAIConfigPath(), JSON.stringify({ encryptedApiKey, model }, null, 2), 'utf8')
  return publicOpenAIConfig({ apiKey, model })
})

ipcMain.handle('openai-config:clear', async () => {
  try {
    await fs.unlink(openAIConfigPath())
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  return { configured: false, model: 'gpt-4.1-mini', maskedKey: '' }
})

const extractResponseText = (response = {}) =>
  (response.output || [])
    .filter((item) => item?.type === 'message')
    .flatMap((item) => item.content || [])
    .filter((item) => item?.type === 'output_text')
    .map((item) => item.text || '')
    .join('\n')
    .trim()

ipcMain.handle('openai-assistant:request', async (_event, payload = {}) => {
  const config = await readOpenAIConfig()
  if (!config.apiKey) throw new Error('Configura primero una API Key de OpenAI.')
  const input = Array.isArray(payload.input) ? payload.input.slice(-12) : []
  if (!input.length) throw new Error('La conversacion esta vacia.')

  try {
    const { data } = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: String(payload.model || config.model).trim(),
        instructions: String(payload.instructions || '').slice(0, 120000),
        input,
        tools: Array.isArray(payload.tools) ? payload.tools.slice(0, 12) : [],
        tool_choice: 'auto',
        temperature: 0.1,
        store: false
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000
      }
    )
    const toolCalls = (data.output || [])
      .filter((item) => item?.type === 'function_call')
      .map((item) => ({ callId: item.call_id, name: item.name, arguments: item.arguments }))
    return { id: data.id, text: extractResponseText(data), toolCalls }
  } catch (error) {
    const message = error?.response?.data?.error?.message || error.message || 'Error consultando OpenAI.'
    console.error('Error en el asistente OpenAI:', message)
    throw new Error(message)
  }
})

ipcMain.handle('chatGpt', async (_event, pregunta) => {
  const config = await readOpenAIConfig()
  if (!config.apiKey) return 'Configura la API Key de OpenAI desde el Asistente IA.'
  try {
    const { data } = await axios.post(
      'https://api.openai.com/v1/responses',
      { model: config.model, input: String(pregunta || ''), store: false },
      { headers: { Authorization: `Bearer ${config.apiKey}` }, timeout: 90000 }
    )
    return extractResponseText(data) || 'OpenAI no devolvio una respuesta.'
  } catch (error) {
    return error?.response?.data?.error?.message || 'No se pudo procesar la solicitud.'
  }
})

let chatHistory = [
  {
    role: 'system',
    content:
      'You are a chatbot specialized in cell phone repairs, with extensive knowledge of various smartphone brands and models. Only provide short and concise answers.'
  }
]

ipcMain.handle('chatGptLegacy', async (event, pregunta) => {
  try {
    // Agregar el mensaje del usuario al historial
    chatHistory.push({ role: 'user', content: pregunta })

    const response = { choices: [{ message: { content: 'Manejador deshabilitado.' } }] }

    const botResponse = response.choices[0].message.content

    // Agregar la respuesta del bot al historial
    chatHistory.push({ role: 'assistant', content: botResponse })
    return botResponse
  } catch (error) {
    console.error('Error al consultar la API de OpenAI:', error)
    return 'Lo siento, ocurrió un error al procesar tu solicitud.'
  }
})

/**************************************************************/
async function createNewWindowBARCODE(archivo, tipo, silent) {
  const newWindow = new BrowserWindow({
    width: 600,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  const config = await loadConfig()

  const printOptions = {
    silent: config.impresoraLabel.silent,
    printBackground: true,
    deviceName: config.impresoraLabel.printerName,
    margins: {
      marginType: 'minimum'
    },
    pageSize: {
      width: config.impresoraLabel.width, // Convert mm to points (1 mm ≈ 3.78 points)
      height: config.impresoraLabel.height // Height of A4 paper in points (297 mm)
    }
  }

  if (tipo == 'url') {
    newWindow.loadURL(archivo)

    newWindow.webContents.on('did-finish-load', () => {
      newWindow.webContents.print(printOptions, (success, errorType) => {
        if (!success) console.log(errorType)
        newWindow.close()
      })
    })
  } else {
    newWindow.loadFile(join(__dirname, '../../src/renderer/src/files', `${archivo}.html`))

    newWindow.webContents.on('did-finish-load', () => {
      newWindow.webContents.print(printOptions, (success, errorType) => {
        if (!success) console.log(errorType)
        newWindow.close()
      })
    })
  }
}

/**************************************************************/
ipcMain.on('imprimir-etiqueta', (event, archivo, tipo, silent = false) => {
  createNewWindowBARCODE(archivo, tipo, silent)
})
/**************************************************************/
// 🧹 Función para limpiar valores vacíos del objeto o string
function limpiarDatosVacios(data) {
  if (typeof data === 'string') {
    return data
      .replace(/undefined|null/g, '') // elimina texto "undefined" o "null"
      .replace(/\s+/g, ' ') // quita espacios dobles
      .trim()
  } else if (typeof data === 'object' && data !== null) {
    const limpio = {}
    for (const key in data) {
      const valor = data[key]
      if (valor && valor !== 'undefined' && valor !== 'null' && valor !== '') {
        limpio[key] = typeof valor === 'string' ? valor.trim() : valor
      }
    }
    return limpio
  }
  return data
}

// 🖨️ Evento para imprimir documento
ipcMain.on('print-document', async (event, data) => {
  try {
    const config = await loadConfig()

    // 🧹 Limpiar los datos antes de imprimir
    const datosLimpios = limpiarDatosVacios(data)
    const htmlLimpio = limpiarDatosVacios(datosLimpios.html || '')

    // 🧾 Opciones de impresión
    const printOptions = {
      silent: false,
      printBackground: true,
      deviceName: config.impresora?.printerName || '',
      margins: { marginType: 'minimum' },
      pageSize: {
        width: 80000, // ≈80mm
        height: 841.89 // A4
      }
    }

    // 🪟 Crear ventana para impresión
    let printWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    // 🧩 Cargar HTML limpio
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlLimpio)}`)

    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!success) console.error('Error al imprimir:', failureReason)
        printWindow.close()
      })
    })
  } catch (err) {
    console.error('❌ Error al procesar la impresión:', err)
  }
})
/**************************************************************/

/**************************************************************/
ipcMain.handle('actualizarSistema', async (event, archivo) => {
  try {
    const retorno = 'ok'
    return retorno
  } catch (error) {
    return 'error'
  }
})
/**************************************************************/
function getIPAddress() {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'IP no disponible'
}
/**************************************************************/
ipcMain.handle('nombrePC', async (event) => {
  try {
    const hostname = os.hostname()
    const platform = os.platform()
    const ip = getIPAddress()
    const version = app.getVersion()
    return {
      hostname,
      platform,
      version,
      ip
    }
  } catch (error) {
    console.error(error)
    return { error: 'Error al obtener la información del sistema' }
  }
})
/**************************************************************/
async function loadConfig() {
  const userDataPath = app.getPath('userData')
  const configPath = path.join(userDataPath, 'config.json')

  try {
    const data = await fs.readFile(configPath, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Error al leer el archivo de configuración:', err)
    // Si el archivo no existe, crea uno con valores por defecto
    const defaultConfig = {
      VITE_LINKURL: 'https://demo.tmposrd.com',
      VITE_LINK_API: '/api2',
      VITE_LINK_UPDATE: 'https://actualizacion.tmposrd.com',
      VITE_TOKEN: '1234567890abc',
      VITE_TOKEN_CORTO: '1234',
      VITE_PATRON_TELEFONO: '+1(999) 999-9999',
      VITE_PATRON_CEDULA: '999-9999999-9',
      VITE_THEME:
        '{"preset":"Aura","primary":"pink","surface":"neutral","darkTheme":false,"menuMode":"static","tipo":"light"}',
      VITE_IMPRESORA_LOCAL: 'http://printer.test',
      impresora:
        '{"fontSize":"11","fontFamily":"arial","pageWidth":"300","bodyWidth":"250","ticketWidth":"240","logoWidth":"150","pageSizeWidth":"80000","pageSizeHeight":"295000","copies":"1"}',
      impresoraLabel: {
        preview: false,
        width: '50800',
        height: '76200',
        margin: '0 0 0 0',
        copies: 1,
        silent: true,
        printerName: '4BARCODE',
        timeOutPerLine: 1000
      },
      VITE_ID_EMPRESA: '1',
      VITE_UPDATE: 'false',
      VITE_PRODUCTION: 'false',
      VITE_CAJERO_ACTIVO: 'false',
      almacen: 'TMPOS SRL',
      VITE_TURNOS: [
        {
          turno: 'COMPLETO'
        }
      ],
      datosDefault:
        '{"logo":true,"direccion":true,"telefono":true,"email":true,"legal":false,"fecha":true,"hora":true,"rnc":true,"nombre_cliente":true,"vendedor":false,"cajero":true,"mesero":false,"instalador":false,"mesa":false,"delivery":false,"metodopago":true,"comprobante":true,"no_factura":true,"subtotal":true,"descuento":true,"impuestos":true,"total":true,"cambio":false,"barcode":true,"firma":false,"nota":true,"empaque":false}',
      VITE_IMPRESORA_TINTA: '',
      VITE_IMPRESORA_TERMICA: 'POS80',
      ONLINE: 'true',
      OFFLINE: 'false',
      HUELLA: 'false',
      subirData: 'false',
      SERVIDORLOCAL: 'http://localhost:3000/api'
    }
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8')
    return defaultConfig
  }
}

function normalizeRendererConfig(config) {
  // La API es la única fuente de datos, incluso cuando una instalación
  // conserva un config antiguo dentro de userData.
  return {
    ...config,
    ONLINE: 'true',
    OFFLINE: 'false',
    subirData: 'false'
  }
}

/**************************************************************/
async function updateConfig(newData) {
  const userDataPath = app.getPath('userData')
  const configPath = path.join(userDataPath, 'config.json')

  try {
    const data = JSON.stringify(newData, null, 2) // Formatea el JSON con espaciado de 2
    await fs.writeFile(configPath, data, 'utf8')
    return newData
  } catch (err) {
    console.error('Error al escribir en el archivo de configuración:', err)
    return null
  }
}
/**************************************************************/
ipcMain.on('generate-barcode', async (event, barcodeData) => {
  const config = await loadConfig()

  const printOptions = {
    silent: false,
    printBackground: true,
    deviceName: config.impresora.printerName,
    margins: {
      marginType: 'minimum'
    },
    pageSize: {
      width: barcodeData.labelWidth, // Convert mm to points (1 mm ≈ 3.78 points)
      height: barcodeData.labelHeight // Height of A4 paper in points (297 mm)
    }
  }

  let printWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  printWindow.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    margin: ${barcodeData.margins.top}px ${barcodeData.margins.right}px ${barcodeData.margins.bottom}px ${barcodeData.margins.left}px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                canvas {
                    display: block;
                }
            </style>

        </head>
        <body>
            <svg class="barcode"
                jsbarcode-format="CODE128"
                jsbarcode-value="${barcodeData.code}"
                jsbarcode-text="${barcodeData.text}"
                jsbarcode-width="${barcodeData.width}"
                jsbarcode-height="${barcodeData.height}"
                jsbarcode-fontoptions=""
                jsbarcode-font="monospace"
                jsbarcode-textalign="center"
                jsbarcode-textposition="bottom"
                jsbarcode-textmargin="2"
                jsbarcode-fontsize="${barcodeData.fontSize}"
                jsbarcode-displayvalue="true">
            </svg>

            <script>
                const JsBarcode = require('jsbarcode');
                JsBarcode(".barcode").init();
            </script>
        </body>
        </html>`)

  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print(printOptions, (success, failureReason) => {
      if (!success) console.log(failureReason)
      //printWindow.close();
    })
  })
})
/**************************************************************/
let client
/*async function initializeWhatsAppClient() {
    try {
        if (client) {
            log.info('🛑 Destruyendo cliente de WhatsApp antes de reiniciar...');
            try {
                if (client.info) {
                    await client.destroy();
                }
            } catch (err) {
                log.warn("⚠️ Cliente ya destruido o no inicializado correctamente.");
            }
            client = null;
        }

        const sessionPath = path.join(app.getPath('userData'), 'whatsapp-session');
        fsExtra.ensureDirSync(sessionPath);

        client = new Client({
            authStrategy: new LocalAuth({ dataPath: sessionPath }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        client.on('qr', async (qr) => {
            log.info('📌 QR recibido');
            if (mainWindow) mainWindow.webContents.send('qr', qr);
        });

        client.on('ready', () => {
            log.info('✅ WhatsApp Web listo');
            if (mainWindow) mainWindow.webContents.send('ready', { success: true });
        });

        client.on('message', (msg) => {
            log.info(`📩 Nuevo mensaje de ${msg.from}: ${msg.body}`);
            if (mainWindow) mainWindow.webContents.send('newMessage', {
                from: msg.from,
                text: msg.body,
                createdAt: new Date().getTime(),
                ownerId: msg.from
            });
        });

        client.on('disconnected', async () => {
            log.warn('⚠️ Cliente de WhatsApp desconectado, reiniciando en 5 segundos...');
            setTimeout(async () => {
                try {
                    await restartWhatsAppClient();
                } catch (e) {
                    logError(e, '❌ Error al reiniciar WhatsApp Web');
                }
            }, 5000);
        });

        await client.initialize();
        log.info('🚀 Cliente de WhatsApp inicializado correctamente.');
    } catch (error) {
        logError(error, '❌ Error iniciando WhatsApp Web');
        log.warn('⏳ Reintentando iniciar WhatsApp en 5 segundos...');
        setTimeout(() => {
            initializeWhatsAppClient().catch(err => logError(err, '❌ Error crítico en WhatsApp Web'));
        }, 5000);
    }
}*/

/**************************************************************/
/*async function restartWhatsAppClient() {
    try {
        if (client) {
            log.info('🛑 Destruyendo cliente de WhatsApp...');
            try {
                await client.destroy();
            } catch (error) {
                log.warn("⚠️ Cliente ya destruido o no estaba inicializado.");
            }
            client = null;
        }
        log.info('🔄 Reiniciando WhatsApp...');
        await initializeWhatsAppClient();
    } catch (error) {
        logError(error, '❌ Error reiniciando WhatsApp Web');
        setTimeout(restartWhatsAppClient, 5000);
    }
}*/

/**************************************************************/
/*async function getChatByPhoneNumber(phoneNumber) {
    try {
        const formattedPhoneNumber = `${phoneNumber}@c.us`;
        const chat = await client.getChatById(formattedPhoneNumber);

        if (chat) {
            return { success: true, chat: chat };
        } else {
            return { success: false, message: 'Chat not found' };
        }
    } catch (error) {
        console.error('Error en getChatByPhoneNumber:', error);
         logError(error, '❌ Error iniciando WhatsApp Web');
        return { error: error.message };
    }
}*/
/**************************************************************/

/**************************************************************/

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.tmpos.tmpos')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  //const loadingWindow = createLoadingWindow()
  const mainWindow = createWindow()

  mainWindow.once('ready-to-show', (event, data) => {
    //loadingWindow.close()
    mainWindow.show()
  })

  /************************************************************/

  /************************************************************/
  await copySounds()
  /************************************************************/
  await ensureLogFileExists()

  /************************************************************/
  try {
    const config = await loadConfig()
    //console.log('✅ Configuración cargada:', config);
  } catch (error) {
    logError(error, '❌ Error cargando configuración')
  }

  ipcMain.handle('datosarchivo', async () => {
    const config = await loadConfig()
    return normalizeRendererConfig(config)
  })

  /************************************************************/
  /*ipcMain.handle('revisarActualizacionDisponible', async (event) => {
  try {
    console.log("🔄 Buscando actualizaciones...");

    // Llamamos a checkForUpdates, pero no esperamos su resultado
    autoUpdater.checkForUpdates();

    // Retornamos inmediatamente una respuesta al frontend
    return { success: true, message: "Verificando actualizaciones en segundo plano..." };
  } catch (error) {
    console.error("❌ Error checking for updates:", error);
    return { error: error.message };
  }
});*/

  // Evento cuando se encuentra una actualización
  /*autoUpdater.on('update-available', (info) => {
  console.log("✅ Actualización disponible:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', { available: true, version: info.version });
  }
});*/

  /************************************************************/
  // Event when an update is available
  /*autoUpdater.on('update-available', () => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. Do you want to download it now?',
      buttons: ['Yes', 'No']
    })
    .then((result) => {
      if (result.response === 0) {
        closeTM_POSProcesses(() => {
          autoUpdater.downloadUpdate();
        });
      }
    });
});

// Event when an update has been downloaded
autoUpdater.on('update-downloaded', () => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. It will install on restart. Do you want to restart now?',
      buttons: ['Yes', 'Later']
    })
    .then((result) => {
      if (result.response === 0) {
        closeTM_POSProcesses(() => {
          autoUpdater.quitAndInstall(false, true);
        });
      }
    });
});*/
  /************************************************************/
  /*autoUpdater.on('download-progress', (progressObj) => {
  //if (!progressWin) createProgressWindow(); // Crea la ventana si no existe

  const progress = progressObj.percent.toFixed(2);
  console.log(`Descarga en progreso: ${progress}%`);

  mainWindow.webContents.send('download-progress', { percent: progress });
});


autoUpdater.on('update-downloaded', () => {
  console.log('✅ Descarga completa. Listo para instalar.');

  dialog.showMessageBox({
    type: 'info',
    title: 'Actualización lista',
    message: 'La actualización se ha descargado. La aplicación se reiniciará para aplicar la actualización.',
    buttons: ['Reiniciar ahora']
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});*/

  /************************************************************/
  ipcMain.handle('descargarActualizarSistema', async (event) => {
    try {
      //createProgressWindow(); // Mostrar el medidor de descarga
      autoUpdater.downloadUpdate() // Iniciar la descarga
      return { success: true }
    } catch (error) {
      console.error('Error al descargar la actualización:', error)
      return { error: error.message }
    }
  })

  /************************************************************/
  ipcMain.handle('actualizar', async () => {
    const update = autoUpdater.checkForUpdates()
    return update
  })
  /************************************************************/
  ipcMain.handle('actualizarjson', async (event, data) => {
    try {
      const result = await updateConfig(data)
      return result
    } catch (error) {
      console.error(error)
      return { error: error.message }
    }
  })

  // Inicializar WhatsApp Web sin bloquear otros procesos
  /*    setTimeout(() => {
        initializeWhatsAppClient().catch(err => logError(err, '❌ Error crítico en WhatsApp Web'));
    }, 2000);*/
  /************************************************************/
  /*client.on('message', (msg) => {
    mainWindow.webContents.send('newMessage', {
        from: msg.from,
        text: msg.body,
        createdAt: new Date().getTime(),
        ownerId: msg.from, // Indica que el mensaje es del otro usuario
    });
});*/
  /************************************************************/
  /*ipcMain.handle('getProfilePic', async (event, phoneNumber) => {
    try {
        const contactId = `${phoneNumber}@c.us`; // Formato correcto
        const profilePicUrl = await client.getProfilePicUrl(contactId);

        return profilePicUrl || 'https://placehold.co/50x50';
    } catch (error) {
        console.error('Error obteniendo imagen de perfil:', error);
        logError(error, '❌ Error WhatsApp Web');
        return 'https://placehold.co/50x50'; 
    }
});*/
  /************************************************************/
  /*ipcMain.handle('sendMessage', async (event, phoneNumber, message) => {
    try {
        // Formatear el número de teléfono correctamente
        const contactId = `${phoneNumber}@c.us`;

        // Obtener el chat
        const chat = await client.getChatById(contactId);

        // Enviar el mensaje y esperar confirmación
        const sentMessage = await chat.sendMessage(message);

        // Devolver información sobre el mensaje enviado
        return {
            success: true,
            message: "Mensaje enviado correctamente",
            id: sentMessage.id._serialized, // ID del mensaje enviado
            timestamp: sentMessage.timestamp, // Marca de tiempo del mensaje enviado
            to: phoneNumber
        };

    } catch (error) {
        console.error('Error en sendMessage:', error);
        logError(error, '❌ Error WhatsApp Web');
        return { success: false, error: error.message };
    }
});*/

  /*****************************************************************/
  /*ipcMain.handle('getChats', async () => {
    if (!client || !client.info) {
        return { error: 'WhatsApp Web no está inicializado' };
    }

    try {
        return await client.getChats();
    } catch (error) {
        logError(error, '❌ Error obteniendo chats');
        return { error: error.message };
    }
});*/

  /*****************************************************************/
  /*ipcMain.handle('isClientReady', async () => {
    try {
        return client?.info ? { ready: true } : { ready: false };
    } catch (error) {
        logError(error, '❌ Error verificando estado de WhatsApp Web');
        return { error: error.message, ready: false };
    }
});*/

  /*****************************************************************/
  /*ipcMain.handle('getChatByPhoneNumber', async (event, phoneNumber) => {
    try {
        const chats = await client.getChats();
        const formattedNumber = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;

        const chat = chats.find(c => c.id._serialized === formattedNumber);

        if (!chat) {
            return { error: 'No se encontró el chat con ese número' };
        }

        const messages = await chat.fetchMessages();
        const formattedMessages = messages.map(msg => ({
            id: msg.id.id,
            fromMe: msg.fromMe,
            from: msg.from,
            text: msg.body,
            createdAt: msg.timestamp * 1000,
            text: msg.body, // Convertimos `body` a `text`
            ownerId: msg.fromMe ? 'me' : msg.from,
            timestamp: msg.timestamp
        }));

        const contactId = `${phoneNumber}@c.us`;
        const profilePicUrl = await client.getProfilePicUrl(contactId);

        let image = null;
        if (!chat.isGroup) {
            image = profilePicUrl || 'https://placehold.co/50x50';
        }

        return {
            id: {server:'c.us',user:chat.id.user,_serialized:chat.id._serialized},
            name: chat.name || chat.contact.pushname,
            isGroup: chat.isGroup,
            unreadCount: chat.unreadCount,
            createdAt: chat.timestamp * 1000,
            messages: formattedMessages,
            image: image || 'https://placehold.co/50x50'
        };

    } catch (error) {
        console.error('Error obteniendo el chat:', error);
        logError(error, '❌ Error iniciando WhatsApp Web');
        return { error: 'No se pudo obtener el chat' };
    }
});*/
  /*****************************************************************/
  /*  ipcMain.handle('getContacts', async (event) => {
    try {
      const contacts = await client.getContacts();
      return contacts;
    } catch (error) {
      console.error('Error en getContacts:', error);
      logError(error, '❌ Error iniciando WhatsApp Web');
      return { error: error.message };
    }
  });*/
  /*****************************************************************/
  /*ipcMain.handle('sendPDF', async (event, phoneNumber, base64Data) => {
    try {
        const formattedPhoneNumber = `${phoneNumber}@c.us`;

        // Crear el objeto MessageMedia con la data Base64
        const media = new MessageMedia('application/pdf', base64Data, 'document.pdf');

        // Obtener el chat y enviar el archivo
        const chat = await client.getChatById(formattedPhoneNumber);
        await chat.sendMessage(media);

        return { success: true };
    } catch (error) {
        console.error('Error en sendPDF:', error);
         logError(error, '❌ Error iniciando WhatsApp Web');
        return { error: error.message };
    }
});*/
  /*****************************************************************/
  /*ipcMain.handle('logout', async () => {
    try {
        if (client) {
            log.info('🚪 Cerrando sesión de WhatsApp...');
            await client.logout();
            client = null;
        }

        // Eliminar sesión guardada
        const authPath = path.join(app.getPath('userData'), 'whatsapp-session');
        await fsExtra.remove(authPath);

        log.info('🔄 Reiniciando WhatsApp...');
        setTimeout(initializeWhatsAppClient, 2000);

        return { success: true };
    } catch (error) {
        logError(error, '❌ Error en logout');
        return { error: error.message };
    }
});*/

  /************************************************************/
  /************************************************************/
  ipcMain.handle('generarLicencia', async (event, caracteres = 15) => {
    const nombrePC = os.hostname()
    const base = Buffer.from(nombrePC).toString('base64').replace(/=/g, '').toUpperCase()
    const licenciaRaw = base.replace(/[^A-Z0-9]/g, '').substring(0, caracteres)
    return licenciaRaw.match(/.{1,5}/g).join('-')
  })
  /************************************************************/

  ipcMain.handle('decodificarLicencia', async (event, licencia) => {
    const nombrePC = os.hostname()
    const base = Buffer.from(nombrePC).toString('base64').replace(/=/g, '').toUpperCase()
    const licenciaGenerada = base
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 15)
      .match(/.{1,5}/g)
      .join('-')
    return licencia.toUpperCase() === licenciaGenerada
  })
  /************************************************************/
  /*ipcMain.handle('login', async () => {
    console.log('Reiniciando cliente de WhatsApp...');
    await restartWhatsAppClient();
    return { success: true };
});*/
  /************************************************************/
  /*  const dbDir = path.join(app.getPath('userData'), 'databases');
  const dbPath = path.join(dbDir, 'Databases.db');

  try {
    // Intentar crear el directorio si no existe
    await fs.mkdir(dbDir, { recursive: true });
    console.log('Directorio de base de datos asegurado en:', dbDir);

    // Conectar a la base de datos
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error al abrir la base de datos:', err.message);
      } else {
        console.log('Conectado a la base de datos SQLite en', dbPath);
      }
    });

    // Promisificar la creación de la tabla
    function createTableAsync(query) {
      return new Promise((resolve, reject) => {
        db.run(query, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

ipcMain.handle('creartabla', async (event, tabla, campos) => {
  try {
    // Validar el nombre de la tabla
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tabla)) {
      throw new Error('El nombre de la tabla contiene caracteres no válidos');
    }

    // Validar y procesar los campos
    const fieldList = campos.split(',').map(field => field.trim());

    // Crear una lista de campos válidos que cumplen con el formato `nombre tipo`
    let validFields = fieldList.filter(field => /^[a-zA-Z_][a-zA-Z0-9_]* [a-zA-Z]+$/.test(field));

    if (validFields.length !== fieldList.length) {
      throw new Error('Uno o más campos contienen caracteres o formatos no válidos');
    }

    // Eliminar cualquier definición existente de `created_at` y `updated_at`
    validFields = validFields.filter(
      field => !field.startsWith('created_at ') && !field.startsWith('updated_at ')
    );

    // Asegurar que `created_at` y `updated_at` estén al final como `TIMESTAMP`
    validFields.push('created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    validFields.push('updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Definir `id` como PRIMARY KEY AUTOINCREMENT y construir la consulta final
    const query = `CREATE TABLE IF NOT EXISTS ${tabla} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ${validFields.join(', ')}
    )`;

    await createTableAsync(query);

    console.log('Tabla creada o ya existe');
    return { success: true, message: `Tabla ${tabla} creada o ya existe.` };
  } catch (err) {
    console.error('Error creando la tabla:', err);
    return { success: false, message: 'Error creando la tabla', error: err.message };
  }
});
/*------------------------------------------------------------------------*/
  ipcMain.handle('consultaservidor', async (event, consulta, ...args) => {
    try {
      if (servidor[consulta] && typeof servidor[consulta] === 'function') {
        return await servidor[consulta](...args)
      } else {
        throw new Error(`La consulta '${consulta}' no es válida o no es una función`)
      }
    } catch (err) {
      console.error('Error en la consulta:', err)
      return { success: false, message: 'Error en consulta', error: err.message }
    }
  })

  /*------------------------------------------------------------------------*/
  ipcMain.handle('consultaandroid', async (event, consulta, ...args) => {
    try {
      console.log('Funciones exportadas en android:', Object.keys(android))
      if (android[consulta] && typeof android[consulta] === 'function') {
        return await android[consulta](...args)
      } else {
        throw new Error(`La consulta '${consulta}' no es válida o no es una función`)
      }
    } catch (err) {
      console.error('Error en la consulta:', err)
      return { success: false, message: 'Error en consulta', error: err.message }
    }
  })
  /*------------------------------------------------------------------------*/
  ipcMain.handle('consultaiphone', async (event, consulta, ...args) => {
    try {
      console.log('Funciones exportadas en iphone:', Object.keys(iphone))
      if (iphone[consulta] && typeof iphone[consulta] === 'function') {
        if (consulta === 'getDiagnosticSnapshot') {
          const userDataPath = app.getPath('userData')
          const diagnosticOptions = {
            userDataPath,
            helperPath: path.join(userDataPath, 'IPhoneReaderHelper.exe')
          }
          console.log('diagnosticOptions', diagnosticOptions)
          return await iphone[consulta](diagnosticOptions, ...args)
        }

        return await iphone[consulta](...args)
      } else {
        throw new Error(`La consulta '${consulta}' no es valida o no es una funcion`)
      }
    } catch (err) {
      console.error('Error en la consulta:', err)
      return { success: false, message: 'Error en consulta', error: err.message }
    }
  })
  /*------------------------------------------------------------------------*/
  ipcMain.handle('datos_del_equipo', async (event, consulta, ...args) => {
    return {
      hostname: os.hostname(),
      plataforma: os.platform(),
      versionSistema: os.version ? os.version() : os.release(), // depende del sistema operativo
      arquitectura: os.arch(),
      cpus: os.cpus(),
      memoriaTotal: os.totalmem(),
      memoriaLibre: os.freemem(),
      uptime: os.uptime(),
      tipo: os.type(),
      red: os.networkInterfaces()
    }
  })
  /*------------------------------------------------------------------------*/
  /*ipcMain.handle('creartablacondatos', async (event, tabla, campos, arrayObjetos = []) => {
  try {
    // Validar el nombre de la tabla
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tabla)) {
      throw new Error('El nombre de la tabla contiene caracteres no válidos');
    }

    // Validar y procesar los campos
    const fieldList = campos.split(',').map(field => field.trim());

    // Crear una lista de campos válidos que cumplen con el formato `nombre tipo`
    let validFields = fieldList.filter(field => /^[a-zA-Z_][a-zA-Z0-9_]* [a-zA-Z]+$/.test(field));

    if (validFields.length !== fieldList.length) {
      throw new Error('Uno o más campos contienen caracteres o formatos no válidos');
    }

    // Eliminar cualquier definición existente de `created_at` y `updated_at`
    validFields = validFields.filter(
      field => !field.startsWith('created_at ') && !field.startsWith('updated_at ')
    );

    // Asegurar que `created_at` y `updated_at` estén al final como `TIMESTAMP`
    validFields.push('created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    validFields.push('updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Definir `id` como PRIMARY KEY AUTOINCREMENT y construir la consulta de creación de tabla
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tabla} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ${validFields.join(', ')}
    )`;
    await createTableAsync(createTableQuery);

    // Verificar si hay objetos para insertar
    if (arrayObjetos.length > 0) {
      const columnNames = validFields.map(field => field.split(' ')[0]); // Solo nombres de columnas
      const insertQuery = `INSERT INTO ${tabla} (${columnNames.join(', ')}) VALUES `;

      // Construir una sola consulta con placeholders para todos los objetos
      const placeholders = arrayObjetos
        .map(obj => `(${columnNames.map(() => '?').join(', ')})`)
        .join(', ');

      const finalInsertQuery = `${insertQuery} ${placeholders}`;

      // Extraer los valores de cada objeto en el orden de las columnas
      const values = arrayObjetos.flatMap(obj => columnNames.map(col => obj[col]));

      // Ejecutar la consulta dentro de una transacción
      await runTransactionAsync(finalInsertQuery, values);

      console.log('Filas insertadas en la tabla:', arrayObjetos.length);
    }

    return { success: true, message: `Tabla ${tabla} creada o ya existe, y datos insertados.` };
  } catch (err) {
    console.error('Error creando la tabla o insertando datos:', err);
    return { success: false, message: 'Error creando la tabla o insertando datos', error: err.message };
  }
});


// Función para ejecutar una transacción como Promesa
function runTransactionAsync(query, values) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(query, values, (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
        } else {
          db.run('COMMIT');
          resolve();
        }
      });
    });
  });
}

/*------------------------------------------------------------------------*/

  /* } catch (err) {
    console.error('Error al crear el directorio de base de datos:', err.message);
  }*/
  /************************************************************/
  /*    ipcMain.on('datosarchivo', async(event) => {
      const config = await loadConfig();
      console.log("config", config);
      return config;
    });
*/

  /************************************************************/
  ipcMain.handle('recargarApp', async () => {
    if (mainWindow) {
      mainWindow.reload()
    }
  })

  /************************************************************/
  ipcMain.handle('reiniciarElectron', async (event, data) => {
    try {
      app.relaunch()
      app.exit()
    } catch (error) {
      return { error: error.message }
    }
  })
  /************************************************************/
  ipcMain.on('imprimir', async (event, data) => {
    const config = await loadConfig()
    try {
      await printToPOS80(config, data)
    } catch (error) {
      console.error(error)
    }
  })
  /************************************************************/
  ipcMain.on('consulta', async (event, data) => {
    const config = await loadConfig()
    if (config) {
      console.log('Configuración cargada:', config)
      global.config = config
      dialog.showMessageBox({
        type: 'info',
        buttons: ['OK'],
        title: 'Actualización en progreso',
        message: config.apiUrl
      })
    }
  })
  /************************************************************/
  ipcMain.on('reload-window', () => {
    mainWindow.webContents.reload()
  })
  /************************************************************/
  ipcMain.handle('play-sound', async (event, sound) => {
    // Leer la configuración para verificar si el sonido está activado
    const config = await loadConfig()
    const sonidoActivo = config.VITE_SOUND ?? false

    // Solo reproducir si el sonido está activado
    if (sonidoActivo === true || sonidoActivo === 'true') {
      playSound(sound)
    }
  })
  /************************************************************/

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

/***************************************************/
/***********************************************************************/
ipcMain.handle('rutas-permitidas', async () => {
  return menuTemplateGlobal
})

/***************************************************/
// Escucha eventos del frontend
ipcMain.on('toggle-menu', (event, enabled, permissions) => {
  menuEnabled = enabled
  userPermissions = permissions
  updateMenu()
})
/***************************************************/

app.on('window-all-closed', () => {
  // Iterate over all open BrowserWindows and clear their localStorage
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents
      .executeJavaScript('localStorage.clear();')
      .then(() => {
        // Optionally, you can do something after clearing the localStorage
        console.log('localStorage cleared for window')
      })
      .catch((err) => {
        console.error('Error clearing localStorage:', err)
      })
  })

  // If not on macOS, quit the app
  if (process.platform !== 'darwin') {
    app.quit()
  }

  // If there is a server process running, kill it
  if (serverProcess) {
    serverProcess.kill()
  }
})
