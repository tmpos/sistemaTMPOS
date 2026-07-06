const { app, BrowserWindow, ipcMain } = require('electron')
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const fs = require('fs/promises')
const path = require('path')

let client
let whatsappWindow // Ventana oculta de WhatsApp

/*******************************************************
 * Crear ventana oculta de WhatsApp Web
 *******************************************************/
function createWhatsAppWindow() {
  whatsappWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false, // No se muestra la ventana
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: join(__dirname, '../../../../preload/index.js')
    }
  })

  whatsappWindow.loadURL('https://web.whatsapp.com') // Carga WhatsApp Web
  whatsappWindow.on('closed', () => {
    whatsappWindow = null
  })
}

/*******************************************************
 * Inicializa el cliente de WhatsApp
 *******************************************************/
function initializeClient() {
  client = new Client({
    authStrategy: new LocalAuth()
  })

  client.on('qr', async (qr) => {
    if (whatsappWindow) {
      whatsappWindow.webContents.send('qr', qr)
    }
  })

  client.on('ready', () => {
    console.log('Client is ready!')
    if (whatsappWindow) {
      whatsappWindow.webContents.send('ready', 'ok')
    }
  })

  client.on('message', (msg) => {
    if (msg.body === '!ping') {
      msg.reply('pong')
    }
  })

  client.initialize()
}

/*******************************************************
 * Enviar mensaje a un número
 *******************************************************/
async function sendMessage(phoneNumber, message) {
  try {
    const contactId = `${phoneNumber}@c.us`
    const chat = await client.getChatById(contactId)
    await chat.sendMessage(message)
    return { success: true }
  } catch (error) {
    console.error('Error en sendMessage:', error)
    return { error: error.message }
  }
}

/*******************************************************
 * Obtener chats
 *******************************************************/
async function getChats() {
  try {
    return await client.getChats()
  } catch (error) {
    console.error('Error en getChats:', error)
    return { error: error.message }
  }
}

/*******************************************************
 * Obtener contactos
 *******************************************************/
async function getContacts() {
  try {
    return await client.getContacts()
  } catch (error) {
    console.error('Error en getContacts:', error)
    return { error: error.message }
  }
}

/*******************************************************
 * Enviar un PDF como mensaje
 *******************************************************/
async function sendPDF(phoneNumber, base64Data) {
  try {
    const formattedPhoneNumber = `${phoneNumber}@c.us`
    const media = new MessageMedia('application/pdf', base64Data, 'document.pdf')
    const chat = await client.getChatById(formattedPhoneNumber)
    await chat.sendMessage(media)
    return { success: true }
  } catch (error) {
    console.error('Error en sendPDF:', error)
    return { error: error.message }
  }
}

/*******************************************************
 * Cerrar sesión y reiniciar el cliente
 *******************************************************/
async function logout() {
  try {
    await client.logout()
    console.log('Logged out successfully')

    // Eliminar la sesión de LocalAuth
    const authPath = path.join(app.getPath('userData'), 'session')
    try {
      await fs.rm(authPath, { recursive: true, force: true })
      console.log('Session folder deleted')
    } catch (err) {
      console.error('Error deleting session folder:', err)
    }

    // Destruir el cliente y reiniciar
    await client.destroy()
    console.log('Client destroyed')

    client = new Client({
      authStrategy: new LocalAuth()
    })

    await client.initialize()
    console.log('Client reinitialized')

    return { success: true }
  } catch (error) {
    console.error('Error logging out:', error)
    return { error: error.message }
  }
}

// Exportamos las funciones
module.exports = {
  createWhatsAppWindow,
  initializeClient,
  sendMessage,
  getChats,
  getContacts,
  sendPDF,
  logout
}
