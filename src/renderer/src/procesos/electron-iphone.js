import { exec, execFile } from 'child_process'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { fileURLToPath } from 'url'

const execAsync = util.promisify(exec)
const execFileAsync = util.promisify(execFile)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function safeTrim(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function formatBytesToReadable(value) {
  const raw = safeTrim(value)
  if (!raw || !/^\d+$/.test(raw)) return raw

  const bytes = Number(raw)
  if (!Number.isFinite(bytes) || bytes <= 0) return raw

  const gb = bytes / 1024 / 1024 / 1024
  if (gb >= 1) return `${gb.toFixed(gb >= 100 ? 0 : gb >= 10 ? 1 : 2)} GB`

  const mb = bytes / 1024 / 1024
  if (mb >= 1) return `${mb.toFixed(0)} MB`

  return `${bytes} B`
}

function normalizeModelNumber(value) {
  return safeTrim(value).toUpperCase().replace(/\/A$/, '').replace(/\s+/g, '')
}

function resolveStorageFallback(deviceInfo = {}) {
  const normalizedModelNumber = normalizeModelNumber(deviceInfo.ModelNumber)
  const knownCapacitiesByModelNumber = {
    MT5K2: '64 GB'
  }

  return knownCapacitiesByModelNumber[normalizedModelNumber] || ''
}

function readFirstField(source = {}, keys = []) {
  for (const key of keys) {
    const value = safeTrim(source?.[key])
    if (value) return value
  }

  return ''
}

function formatBatteryValue(deviceInfo = {}) {
  const percent = readFirstField(deviceInfo, [
    'Live_BatteryCurrentCapacityPercent',
    'Live_BatteryCurrentCapacity',
    'Live_CurrentCapacity',
    'Live_AppleRawCurrentCapacity',
    'Live_MaximumCapacityPercent',
    'BatteryCurrentCapacityPercent',
    'BatteryCurrentCapacity',
    'CurrentCapacity',
    'AppleRawCurrentCapacity',
    'MaximumCapacityPercent'
  ])

  if (percent && /^\d+(\.\d+)?$/.test(percent)) {
    return `${Number(percent).toFixed(percent.includes('.') ? 1 : 0)}%`
  }

  const fullCharge = readFirstField(deviceInfo, [
    'Live_FullChargeCapacity',
    'Live_NominalChargeCapacity',
    'FullChargeCapacity',
    'NominalChargeCapacity'
  ])
  if (fullCharge && /^\d+(\.\d+)?$/.test(fullCharge)) {
    return `${Number(fullCharge).toFixed(0)} mAh`
  }

  return ''
}

async function commandExists(command) {
  try {
    await execAsync(`where ${command}`)
    return true
  } catch {
    return false
  }
}

async function getWindowsServiceStatus(serviceName) {
  try {
    const { stdout } = await execAsync(`sc query "${serviceName}"`)
    const raw = safeTrim(stdout)

    if (!raw) {
      return { installed: false, running: false, status: 'No encontrado' }
    }

    const isRunning = /STATE\s*:\s*\d+\s+RUNNING/i.test(raw)
    return {
      installed: true,
      running: isRunning,
      status: isRunning ? 'RUNNING' : 'STOPPED'
    }
  } catch {
    return { installed: false, running: false, status: 'No encontrado' }
  }
}

async function runPowerShell(command) {
  const escaped = command.replace(/"/g, '\\"')
  const { stdout } = await execAsync(
    `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${escaped}"`
  )
  return stdout
}

function resolveHelperExecutablePath(options = {}) {
  const userDataPath = safeTrim(options?.userDataPath)
  const explicitHelperPath = safeTrim(options?.helperPath)
  const appDataPath = process.env.APPDATA || ''
  const candidatePaths = [
    explicitHelperPath,
    userDataPath ? path.resolve(userDataPath, 'IPhoneReaderHelper.exe') : '',
    userDataPath ? path.resolve(userDataPath, 'IPhoneReaderHelper') : '',
    userDataPath ? path.resolve(userDataPath, 'resources/iphone-helper/IPhoneReaderHelper.exe') : '',
    path.resolve(appDataPath, 'tm-pos/IPhoneReaderHelper.exe'),
    path.resolve(appDataPath, 'tm-pos/resources/iphone-helper/IPhoneReaderHelper.exe'),
    path.resolve(
      __dirname,
      '../../../../resources/iphone-helper/bin/Release/net8.0/win-x64/publish/IPhoneReaderHelper.exe'
    ),
    path.resolve(
      __dirname,
      '../../../../resources/iphone-helper/bin/Debug/net8.0/win-x64/publish/IPhoneReaderHelper.exe'
    ),
    path.resolve(
      process.cwd(),
      'resources/iphone-helper/bin/Release/net8.0/win-x64/publish/IPhoneReaderHelper.exe'
    ),
    path.resolve(
      process.cwd(),
      'resources/iphone-helper/bin/Debug/net8.0/win-x64/publish/IPhoneReaderHelper.exe'
    ),
    path.resolve(process.resourcesPath || '', 'resources/iphone-helper/IPhoneReaderHelper.exe')
  ]

  return candidatePaths.find((candidate) => candidate && fs.existsSync(candidate)) || ''
}

async function readWithCSharpHelper(options = {}) {
  const helperPath = resolveHelperExecutablePath(options)
  console.log('[iphone-helper] options:', options)
  console.log('[iphone-helper] resolved path:', helperPath)
  if (!helperPath) return null

  try {
    const helperDir = path.dirname(helperPath)
    const { stdout, stderr } = await execFileAsync(helperPath, [], {
      cwd: helperDir,
      windowsHide: true
    })
    const raw = safeTrim(stdout)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return {
      helperPath,
      parsed,
      stderr: safeTrim(stderr)
    }
  } catch (error) {
    console.error('[iphone-helper] exec error:', error?.message || error)
    const stdout = safeTrim(error?.stdout || '')
    const stderr = safeTrim(error?.stderr || '')
    console.error('[iphone-helper] exec stdout:', stdout)
    console.error('[iphone-helper] exec stderr:', stderr)

    if (stdout) {
      try {
        return {
          helperPath,
          parsed: JSON.parse(stdout),
          stderr,
          executionError: error?.message || ''
        }
      } catch {
        // continue to structured error result below
      }
    }

    return {
      helperPath,
      parsed: {
        success: false,
        source: 'csharp-helper-exec-error',
        connected: false,
        error: error?.message || 'No se pudo ejecutar el helper.',
        environment: {
          helperExecStdout: stdout,
          helperExecStderr: stderr
        }
      },
      stderr,
      executionError: error?.message || ''
    }
  }
}

async function detectWindowsAppleDevice() {
  const psCommand = `
    $devices = Get-PnpDevice |
      Where-Object {
        $_.Present -eq $true -and (
          $_.FriendlyName -match 'iPhone|Apple|iPad|Mobile Device' -or
          $_.InstanceId -match 'USB\\\\VID_05AC'
        )
      } |
      Select-Object Status, FriendlyName, InstanceId, Class, Present;
    $devices | ConvertTo-Json -Compress
  `

  try {
    const raw = await runPowerShell(psCommand)
    if (!safeTrim(raw)) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return []
  }
}

function parseKeyValueOutput(raw) {
  const result = {}
  for (const line of String(raw || '').split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) continue
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    if (key) {
      result[key] = value
    }
  }
  return result
}

function buildChecklist(deviceInfo = {}, hasAutomatedData = false) {
  const batteryHealth = readFirstField(deviceInfo, [
    'Live_BatteryCurrentCapacityPercent',
    'Live_BatteryCurrentCapacity',
    'Live_MaximumCapacityPercent',
    'Live_BatteryIsCharging',
    'BatteryCurrentCapacityPercent',
    'BatteryCurrentCapacity',
    'MaximumCapacityPercent',
    'BatteryIsCharging'
  ])

  const batteryStatus =
    batteryHealth && batteryHealth !== 'Desconocido' ? 'Automatica' : 'Pendiente'

  return [
    {
      key: 'battery',
      label: 'Bateria',
      status: batteryStatus,
      detail: batteryHealth || 'Revisar salud, ciclos y carga.'
    },
    {
      key: 'speakers',
      label: 'Bocinas',
      status: 'Pendiente',
      detail: 'Probar auricular, altavoz principal y sonido multimedia.'
    },
    {
      key: 'microphones',
      label: 'Microfonos',
      status: 'Pendiente',
      detail: 'Validar llamadas, notas de voz y reduccion de ruido.'
    },
    {
      key: 'front_camera',
      label: 'Camara frontal',
      status: 'Pendiente',
      detail: 'Confirmar enfoque, nitidez y funcionamiento.'
    },
    {
      key: 'rear_camera',
      label: 'Camara trasera',
      status: 'Pendiente',
      detail: 'Probar sensores, flash, enfoque y video.'
    },
    {
      key: 'face_id',
      label: 'Face ID',
      status: 'Pendiente',
      detail: 'Revisar enrolamiento y desbloqueo.'
    },
    {
      key: 'screen',
      label: 'Pantalla y touch',
      status: 'Pendiente',
      detail: 'Validar brillo, color, pixeles, multitouch y ghost touch.'
    },
    {
      key: 'buttons',
      label: 'Botones',
      status: 'Pendiente',
      detail: 'Power, volumen, silencio y respuesta fisica.'
    },
    {
      key: 'connectivity',
      label: 'Conectividad',
      status: hasAutomatedData ? 'Parcial' : 'Pendiente',
      detail: 'Wi-Fi, Bluetooth, red movil, SIM y carga por cable.'
    },
    {
      key: 'sensors',
      label: 'Sensores',
      status: 'Pendiente',
      detail: 'Proximidad, vibracion, giroscopio y tactil.'
    }
  ]
}

function normalizeComparison(value) {
  return safeTrim(value).toLowerCase().replace(/\s+/g, '').replace(/[()\-:/]/g, '')
}

function buildReportItems(deviceInfo = {}) {
  const resolveFactory = (keys) =>
    readFirstField(
      deviceInfo,
      keys.map((key) => `Factory_${key}`)
    )

  const resolveRead = (keys) =>
    readFirstField(
      deviceInfo,
      keys.flatMap((key) => [`Live_${key}`, key])
    )

  const resolveStorage = () =>
    formatBytesToReadable(
      readFirstField(deviceInfo, [
        'Live_TotalDiskCapacity',
        'Live_TotalDataCapacity',
        'Live_NANDTotalBytes',
        'TotalDiskCapacity',
        'TotalDataCapacity',
        'NANDTotalBytes',
        'DeviceCapacity'
      ])
    ) || resolveStorageFallback(deviceInfo)

  const resolveBatteryLife = () =>
    readFirstField(deviceInfo, [
      'Live_MaximumCapacityPercent',
      'Live_BatteryCurrentCapacityPercent',
      'MaximumCapacityPercent',
      'BatteryCurrentCapacityPercent',
      'BatteryLife'
    ])

  const rows = [
    { label: 'Modelo', factoryKeys: ['ProductName', 'ProductType'], readKeys: ['ProductName', 'ProductType'] },
    { label: 'Color', factoryKeys: ['DeviceColor'], readKeys: ['DeviceColor'] },
    { label: 'Capacidad', customFactory: resolveStorage, customRead: resolveStorage, compare: false },
    { label: 'Model Number', factoryKeys: ['ModelNumber'], readKeys: ['ModelNumber'] },
    { label: 'Region', factoryKeys: ['RegionInfo'], readKeys: ['RegionInfo'] },
    { label: 'Serial Number', factoryKeys: ['SerialNumber'], readKeys: ['SerialNumber'] },
    { label: 'Logic Board SN', factoryKeys: ['LogicBoardSN', 'MLBSerialNumber'], readKeys: ['LogicBoardSN', 'MLBSerialNumber'] },
    { label: 'Battery SN', factoryKeys: ['BatterySN', 'BatterySerialNumber'], readKeys: ['BatterySN', 'BatterySerialNumber'] },
    { label: 'Battery Life', customFactory: resolveBatteryLife, customRead: resolveBatteryLife, compare: false },
    { label: 'Charge Cycles', factoryKeys: ['ChargeCycles', 'CycleCount'], readKeys: ['ChargeCycles', 'CycleCount'], compare: false },
    { label: 'Front Camera', factoryKeys: ['FrontCameraSerialNumber', 'FrontCamera', 'FCMS'], readKeys: ['FrontCameraSerialNumber', 'FrontCamera', 'FCMS'] },
    { label: 'Rear Camera', factoryKeys: ['RearCameraSerialNumber', 'RearCamera', 'BCMS'], readKeys: ['RearCameraSerialNumber', 'RearCamera', 'BCMS'] },
    { label: 'Screen SN', factoryKeys: ['ScreenSN', 'ScreenSerialNumber', 'LCDSerialNumber'], readKeys: ['ScreenSN', 'ScreenSerialNumber', 'LCDSerialNumber'] },
    { label: 'Infrared Camera', factoryKeys: ['InfraredCamera', 'InfraredCameraSerialNumber'], readKeys: ['InfraredCamera', 'InfraredCameraSerialNumber'] },
    { label: 'Dot Projector', factoryKeys: ['DotProjector', 'DotProjectorSerialNumber'], readKeys: ['DotProjector', 'DotProjectorSerialNumber'] },
    { label: 'Distance Sensor', factoryKeys: ['DistanceSensor', 'DistanceSensorSerialNumber'], readKeys: ['DistanceSensor', 'DistanceSensorSerialNumber'] },
    { label: 'SN Match', factoryKeys: ['SNMatch'], readKeys: ['SNMatch'], compare: false },
    { label: '5-Code Match', factoryKeys: ['5CodeMatch', 'FiveCodeMatch'], readKeys: ['5CodeMatch', 'FiveCodeMatch'], compare: false }
  ]

  return rows.map((row) => {
    const factoryValue = row.customFactory ? row.customFactory() : resolveFactory(row.factoryKeys || [])
    const readValue = row.customRead ? row.customRead() : resolveRead(row.readKeys || [])

    let status = 'Pendiente'
    if (factoryValue && readValue) {
      if (row.compare === false) {
        status = 'Leido'
      } else if (normalizeComparison(factoryValue) === normalizeComparison(readValue)) {
        status = 'Normal'
      } else {
        status = 'Revisar'
      }
    } else if (readValue) {
      status = 'Leido'
    } else if (factoryValue) {
      status = 'Referencia'
    }

    return {
      key: row.label,
      label: row.label,
      factoryValue: factoryValue || 'No disponible',
      readValue: readValue || 'No disponible',
      status
    }
  })
}

function mapDiagnosticData({
  connected,
  source,
  deviceInfo = {},
  pnpDevice = null,
  error = '',
  environment = {}
}) {
  const deviceName =
    safeTrim(deviceInfo.DeviceName) ||
    safeTrim(deviceInfo.ProductType) ||
    safeTrim(deviceInfo.ProductName) ||
    safeTrim(pnpDevice?.FriendlyName) ||
    'iPhone'

  const iosVersion =
    safeTrim(deviceInfo.ProductVersion) || safeTrim(deviceInfo.BuildVersion) || 'No disponible'

  const batteryCapacity = formatBatteryValue(deviceInfo)
  const storageCapacity = formatBytesToReadable(
    deviceInfo.TotalDiskCapacity ||
      deviceInfo.TotalDataCapacity ||
      deviceInfo.NANDTotalBytes ||
      deviceInfo.DeviceCapacity
  )
  const storageFallback = resolveStorageFallback(deviceInfo)
  const normalizedSource = String(source || '').toLowerCase()
  const hasAutomatedData =
    normalizedSource.includes('ideviceinfo') ||
    normalizedSource.includes('lockdownd-wrapper') ||
    normalizedSource.includes('mobiledevice')

  return {
    connected,
    source,
    generatedAt: new Date().toISOString(),
    environment,
    rawInfo: Object.entries(deviceInfo || {})
      .filter(([, value]) => safeTrim(value))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        key,
        value: String(value)
      })),
    device: {
      name: deviceName,
      model: safeTrim(deviceInfo.ProductType) || 'No disponible',
      modelNumber: safeTrim(deviceInfo.ModelNumber) || 'No disponible',
      productName: safeTrim(deviceInfo.ProductName) || 'No disponible',
      buildVersion: safeTrim(deviceInfo.BuildVersion) || 'No disponible',
      iosVersion,
      serial: safeTrim(deviceInfo.SerialNumber) || 'No disponible',
      mlbSerial: safeTrim(deviceInfo.MLBSerialNumber) || 'No disponible',
      basebandSerial: safeTrim(deviceInfo.BasebandSerialNumber) || 'No disponible',
      udid: safeTrim(deviceInfo.UniqueDeviceID) || 'No disponible',
      chipId: safeTrim(deviceInfo.ChipID) || 'No disponible',
      uniqueChipId: safeTrim(deviceInfo.UniqueChipID) || 'No disponible',
      imei:
        safeTrim(deviceInfo.InternationalMobileEquipmentIdentity) ||
        safeTrim(deviceInfo.MobileEquipmentIdentifier) ||
        'No disponible',
      imei2: safeTrim(deviceInfo.InternationalMobileEquipmentIdentity2) || 'No disponible',
      meid: safeTrim(deviceInfo.MobileEquipmentIdentifier) || 'No disponible',
      iccid: safeTrim(deviceInfo.IntegratedCircuitCardIdentity) || 'No disponible',
      imsi: safeTrim(deviceInfo.InternationalMobileSubscriberIdentity) || 'No disponible',
      phoneNumber: safeTrim(deviceInfo.PhoneNumber) || 'No disponible',
      battery: batteryCapacity || 'No disponible',
      batteryHealth:
        safeTrim(deviceInfo.MaximumCapacityPercent) ||
        safeTrim(deviceInfo.BatteryCurrentCapacityPercent) ||
        safeTrim(deviceInfo.BatteryIsCharging) ||
        safeTrim(deviceInfo.BatteryCurrentCapacity) ||
        'No disponible',
      storage: storageCapacity || storageFallback || 'No disponible',
      color: safeTrim(deviceInfo.DeviceColor) || 'No disponible',
      region: safeTrim(deviceInfo.RegionInfo) || 'No disponible',
      activationState: safeTrim(deviceInfo.ActivationState) || 'No disponible',
      simStatus: safeTrim(deviceInfo.SIMStatus) || 'No disponible',
      simTrayStatus: safeTrim(deviceInfo.SIMTrayStatus) || 'No disponible',
      carrier: safeTrim(deviceInfo.MobileSubscriberNetworkCode) || 'No disponible',
      countryCode: safeTrim(deviceInfo.MobileSubscriberCountryCode) || 'No disponible',
      basebandVersion: safeTrim(deviceInfo.BasebandVersion) || 'No disponible',
      firmwareVersion: safeTrim(deviceInfo.FirmwareVersion) || 'No disponible',
      humanVersion: safeTrim(deviceInfo.HumanReadableProductVersionString) || 'No disponible',
      hardwareModel: safeTrim(deviceInfo.HardwareModel) || 'No disponible',
      hardwarePlatform: safeTrim(deviceInfo.HardwarePlatform) || 'No disponible',
      cpuArchitecture: safeTrim(deviceInfo.CPUArchitecture) || 'No disponible',
      bluetoothAddress: safeTrim(deviceInfo.BluetoothAddress) || 'No disponible',
      wifiAddress: safeTrim(deviceInfo.WiFiAddress) || 'No disponible',
      ethernetAddress: safeTrim(deviceInfo.EthernetAddress) || 'No disponible',
      class: safeTrim(pnpDevice?.Class) || 'No disponible',
      connectionStatus: safeTrim(pnpDevice?.Status) || (connected ? 'Conectado' : 'No detectado')
    },
    reportItems: buildReportItems(deviceInfo),
    checklist: buildChecklist(deviceInfo, hasAutomatedData),
    notes: connected
      ? hasAutomatedData
        ? 'Se detecto el iPhone y se cargaron datos automaticos disponibles.'
        : 'Se detecto un dispositivo Apple por Windows. Complete las pruebas manuales para el diagnostico final.'
      : /password protected|passcode is set/i.test(String(error || '')) ||
            /password protected|passcode is set/i.test(
              String(
                environment.ideviceInfoStdErr ||
                  environment.IdeviceInfoStdErr ||
                  environment.ideviceDiagnosticsStdErr ||
                  environment.IdeviceDiagnosticsStdErr ||
                  environment.ideviceDiagnosticsStdOut ||
                  environment.IdeviceDiagnosticsStdOut ||
                  ''
              )
            )
        ? 'El iPhone esta bloqueado con codigo. Desbloquealo y mantenlo confiado para intentar leer bateria y capacidad real.'
        : environment.appleMobileDeviceService?.installed === true &&
          environment.appleMobileDeviceService?.running === false
        ? 'Apple Mobile Device Service esta instalado pero detenido. Inicielo para intentar leer el iPhone.'
      : environment.appleMobileDeviceService?.installed === false
        ? 'No se detecto el servicio Apple Mobile Device Service. Sin ese driver no es posible leer el iPhone como 3uTools.'
        : environment.ideviceinfo === false || environment.ideviceId === false
          ? 'Faltan utilidades de lectura iPhone por cable. Instale Apple Mobile Device Support y libimobiledevice.'
          : 'No se detecto un iPhone conectado por cable.',
    error: safeTrim(error)
  }
}

export async function getDiagnosticSnapshot(options = {}) {
  try {
    const helperResult = await readWithCSharpHelper(options)
    console.log('[iphone-helper] helperResult:', helperResult)
    const parsedHelper = helperResult?.parsed || {}
    const helperSuccess = parsedHelper.success ?? parsedHelper.Success
    const helperConnected = parsedHelper.connected ?? parsedHelper.Connected
    const helperSource = parsedHelper.source ?? parsedHelper.Source
    const helperError = parsedHelper.error ?? parsedHelper.Error
    const helperDeviceInfo = parsedHelper.deviceInfo ?? parsedHelper.DeviceInfo ?? {}
    const helperPnpDevice = parsedHelper.pnpDevice ?? parsedHelper.PnpDevice ?? null
    const helperEnvironment =
      parsedHelper.environment ?? parsedHelper.Environment ?? {}

    if (helperSuccess) {
      return {
        success: true,
        data: mapDiagnosticData({
          connected: Boolean(helperConnected),
          source: helperSource || 'csharp-helper',
          deviceInfo: helperDeviceInfo,
          pnpDevice: helperPnpDevice,
          environment: {
            ideviceinfo: helperEnvironment.ideviceinfo ?? Boolean(helperEnvironment.IdeviceInfoPath),
            ideviceId: helperEnvironment.ideviceId ?? Boolean(helperEnvironment.IdeviceIdPath),
            appleMobileDeviceService:
              helperEnvironment.appleMobileDeviceService ||
              helperEnvironment.AppleMobileDeviceService ||
              null,
            helperPath: helperResult.helperPath,
            helperExecStderr: helperResult.stderr || helperEnvironment.helperExecStderr || '',
            helperExecError: helperResult.executionError || ''
          },
          error: helperError || ''
        })
      }
    }

    if (helperResult?.parsed && helperResult?.helperPath) {
      return {
        success: false,
        message: helperError || 'El helper de iPhone no devolvio una lectura valida.',
        error: helperResult.executionError || helperError || '',
        data: mapDiagnosticData({
          connected: Boolean(helperConnected),
          source: helperSource || 'csharp-helper-exec-error',
          deviceInfo: helperDeviceInfo,
          pnpDevice: helperPnpDevice,
          environment: {
            ideviceinfo: helperEnvironment.ideviceinfo ?? Boolean(helperEnvironment.IdeviceInfoPath),
            ideviceId: helperEnvironment.ideviceId ?? Boolean(helperEnvironment.IdeviceIdPath),
            appleMobileDeviceService:
              helperEnvironment.appleMobileDeviceService ||
              helperEnvironment.AppleMobileDeviceService ||
              null,
            helperPath: helperResult.helperPath,
            helperExecStderr: helperResult.stderr || helperEnvironment.helperExecStderr || '',
            helperExecError: helperResult.executionError || ''
          },
          error: helperError || helperResult.executionError || ''
        })
      }
    }

    const hasIdeviceInfo = await commandExists('ideviceinfo')
    const hasIdeviceId = await commandExists('idevice_id')
    const appleMobileDeviceService = await getWindowsServiceStatus('Apple Mobile Device Service')
    const environment = {
      ideviceinfo: hasIdeviceInfo,
      ideviceId: hasIdeviceId,
      appleMobileDeviceService
    }

    if (hasIdeviceInfo && hasIdeviceId) {
      const { stdout: idOutput } = await execAsync('idevice_id -l')
      const udid = safeTrim(idOutput).split(/\r?\n/).find(Boolean)

      if (udid) {
        const { stdout } = await execAsync(`ideviceinfo -u ${udid}`)
        const deviceInfo = parseKeyValueOutput(stdout)

        return {
          success: true,
          data: mapDiagnosticData({
            connected: true,
            source: 'ideviceinfo',
            deviceInfo,
            environment
          })
        }
      }
    }

    const devices = await detectWindowsAppleDevice()
    const pnpDevice = devices.find((device) =>
      /iphone|apple mobile device|ipad|apple/i.test(
        `${device?.FriendlyName || ''} ${device?.InstanceId || ''}`
      )
    )

    return {
      success: true,
      data: mapDiagnosticData({
        connected: Boolean(pnpDevice),
        source: pnpDevice ? 'windows-pnp' : 'fallback',
        pnpDevice,
        environment
      })
    }
  } catch (error) {
    return {
      success: false,
      message: 'No se pudo obtener el diagnostico del iPhone.',
      error: error.message,
      data: mapDiagnosticData({
        connected: false,
        source: 'error',
        error: error.message
      })
    }
  }
}
