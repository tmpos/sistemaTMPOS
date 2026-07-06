const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { join } = require('path')
const sqlite = require('sqlite-electron')

function getDatabasePath() {
  // En producción, `app.getPath('exe')` devuelve la ruta completa al ejecutable.
  const exePath = app.isPackaged ? path.dirname(app.getPath('exe')) : __dirname
  return path.resolve(exePath, 'database.db')
}

async function conexion() {
  //let dbPath = await getDatabasePath();
  // await sqlite.setdbPath('./database.db');
  let dbPath = path.join(__dirname, '../../../../resourses/database.db')
  await sqlite.setdbPath(dbPath)
}

export async function dataBase(query, values) {
  return await sqlite.executeQuery(query, values)
}

export async function consulta() {
  await conexion()
  const selectQuery = `
  SELECT * FROM comisiones
`

  return await dataBase(selectQuery, [])
}
