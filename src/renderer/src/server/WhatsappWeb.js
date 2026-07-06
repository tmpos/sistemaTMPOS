import { BrowserWindow, app } from 'electron'
const { Client } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const client = new Client()

export async function WhatsappWeb() {
  const win = new BrowserWindow({ width: 300, height: 600, show: false })

  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true })
    if (win) {
      win.webContents.send('qr-code', qr)
    }
  })

  client.on('ready', () => {
    console.log('Client is ready!')
    if (win) {
      win.webContents.send('client-ready')
    }
  })

  client.on('message', (msg) => {
    if (win) {
      win.webContents.send('new-message', msg)
    }
  })

  client.initialize()
}

export function sendMessage(chat, message) {
  client.sendMessage(chat, message)
}
