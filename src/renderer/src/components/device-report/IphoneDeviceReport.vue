<script setup>
import { computed, ref } from 'vue'
import Checkbox from 'primevue/checkbox'
import DeviceReportInfoList from './DeviceReportInfoList.vue'
import DeviceReportMiniCard from './DeviceReportMiniCard.vue'
import DeviceReportScoreCard from './DeviceReportScoreCard.vue'
import DeviceReportTestTable from './DeviceReportTestTable.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  report: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Reporte de Dispositivo'
  },
  subtitle: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'reload', 'close', 'screenshot', 'print-important'])
const hideSerialNumber = ref(false)

function safe(value, fallback = 'Unknown') {
  const normalized = typeof value === 'string' ? value.trim() : value
  return normalized || fallback
}

function maskIfNeeded(value, forceMask = false) {
  const normalized = safe(value, 'No disponible')
  if (
    normalized === 'No disponible' ||
    normalized === 'Unknown' ||
    normalized === 'No testing' ||
    normalized === 'Pending Inspection' ||
    normalized === 'Tap to Check' ||
    normalized === 'How to determine...?'
  ) {
    return normalized
  }

  if (!(hideSerialNumber.value || forceMask) || normalized.length <= 4) {
    return normalized
  }

  return `${normalized.slice(0, 2)}***${normalized.slice(-3)}`
}

function scoreFromReport(report) {
  const items = report?.reportItems || []
  if (!items.length) return 98

  let score = 100
  for (const item of items) {
    if (item.status === 'Revisar') score -= 12
    else if (String(item.status).toLowerCase().includes('pending')) score -= 5
    else if (item.status === 'Referencia') score -= 2
  }

  return Math.max(0, Math.min(100, score))
}

function summaryFromReport(report) {
  const items = report?.reportItems || []
  if (!items.length) return 'No issues found.'
  if (items.some((item) => item.status === 'Revisar')) return 'Potential issues found.'
  if (items.some((item) => String(item.status).toLowerCase().includes('pending'))) {
    return 'Inspection in progress.'
  }

  return 'No issues found.'
}

const deviceReport = computed(() => {
  const report = props.report || {}
  const reportItems = Array.isArray(report.reportItems) ? report.reportItems : []
  const rawInfoMap = Object.fromEntries(
    Array.isArray(report.rawInfo) ? report.rawInfo.map((item) => [item.key, item.value]) : []
  )

  const findItem = (label) => reportItems.find((item) => item.label === label) || {}
  const rawValue = (...keys) => {
    for (const key of keys) {
      const value = safe(rawInfoMap[key], '')
      if (value) return value
    }

    return ''
  }

  const directValue = (...values) => {
    for (const value of values) {
      const normalized = safe(value, '')
      if (normalized) return normalized
    }

    return ''
  }

  return {
    score: scoreFromReport(report),
    statusMessage: summaryFromReport(report),
    reportDate: report.generatedAt ? new Date(report.generatedAt).toLocaleString() : '',
    deviceInformation: {
      modelIdentifier: safe(report?.device?.model, 'No disponible'),
      iosVersion: safe(report?.device?.iosVersion, 'No disponible'),
      activation: safe(report?.device?.activationState, 'No disponible'),
      jailbreak: 'No',
      snMatch: safe(findItem('SN Match').readValue, 'No testing'),
      fiveCodeMatch: safe(findItem('5-Code Match').readValue, 'No testing'),
      simLock: safe(report?.device?.simStatus, 'No testing'),
      mfgDate: 'Unknown',
      warrantyPeriod: 'Unknown',
      idLock: 'Off',
      batteryLife: safe(findItem('Battery Life').readValue || report?.device?.batteryHealth, 'No disponible'),
      chargeCycles: safe(findItem('Charge Cycles').readValue, 'No disponible')
    },
    testItems: [
      { label: 'Model Name', exFactoryValue: safe(findItem('Modelo').factoryValue || rawValue('Factory_ProductName', 'Factory_ProductType'), 'No disponible'), readValue: safe(findItem('Modelo').readValue || report?.device?.name || rawValue('Live_ProductName', 'Live_ProductType', 'ProductName', 'ProductType'), 'No disponible'), result: findItem('Modelo').status || 'Normal' },
      { label: 'Device Color', exFactoryValue: safe(findItem('Color').factoryValue || rawValue('Factory_DeviceColor'), 'No disponible'), readValue: safe(findItem('Color').readValue || report?.device?.color || rawValue('Live_DeviceColor', 'DeviceColor'), 'No disponible'), result: findItem('Color').status || 'Normal' },
      { label: 'Capacity', exFactoryValue: safe(findItem('Capacidad').factoryValue, 'No disponible'), readValue: safe(findItem('Capacidad').readValue || report?.device?.storage, 'No disponible'), result: findItem('Capacidad').status || 'Normal' },
      { label: 'Model Number', exFactoryValue: safe(findItem('Model Number').factoryValue || rawValue('Factory_ModelNumber', 'Factory_Model'), 'No disponible'), readValue: safe(findItem('Model Number').readValue || report?.device?.modelNumber || rawValue('Live_ModelNumber', 'ModelNumber'), 'No disponible'), result: findItem('Model Number').status || 'Normal' },
      { label: 'Sales Region', exFactoryValue: safe(findItem('Region').factoryValue || rawValue('Factory_RegionInfo'), 'No disponible'), readValue: safe(findItem('Region').readValue || report?.device?.region || rawValue('Live_RegionInfo', 'RegionInfo'), 'No disponible'), result: findItem('Region').status || 'Normal' },
      { label: 'Regulatory Model', exFactoryValue: safe(findItem('Regulatory Model').factoryValue || rawValue('Factory_RegulatoryModelNumber', 'Factory_RegulatoryModel'), 'No disponible'), readValue: safe(findItem('Regulatory Model').readValue || rawValue('Live_RegulatoryModelNumber', 'Live_RegulatoryModel', 'RegulatoryModelNumber', 'RegulatoryModel'), 'No disponible'), result: findItem('Regulatory Model').status || 'Pending Inspection' },
      { label: 'Serial Number', exFactoryValue: maskIfNeeded(findItem('Serial Number').factoryValue || rawValue('Factory_SerialNumber')), readValue: maskIfNeeded(findItem('Serial Number').readValue || report?.device?.serial || rawValue('Live_SerialNumber', 'SerialNumber')), result: findItem('Serial Number').status || 'Normal' },
      { label: 'Logic Board SN', exFactoryValue: maskIfNeeded(findItem('Logic Board SN').factoryValue || rawValue('Factory_LogicBoardSN', 'Factory_MLBSerialNumber')), readValue: maskIfNeeded(findItem('Logic Board SN').readValue || report?.device?.mlbSerial || rawValue('Live_LogicBoardSN', 'Live_MLBSerialNumber', 'MLBSerialNumber')), result: findItem('Logic Board SN').status || 'Normal' },
      { label: 'Battery SN', exFactoryValue: maskIfNeeded(findItem('Battery SN').factoryValue), readValue: maskIfNeeded(findItem('Battery SN').readValue), result: findItem('Battery SN').status || 'Pending Inspection' },
      { label: 'Front Camera', exFactoryValue: maskIfNeeded(findItem('Front Camera').factoryValue), readValue: maskIfNeeded(findItem('Front Camera').readValue), result: findItem('Front Camera').status || 'Pending Inspection' },
      { label: 'Rear Camera', exFactoryValue: maskIfNeeded(findItem('Rear Camera').factoryValue), readValue: maskIfNeeded(findItem('Rear Camera').readValue), result: findItem('Rear Camera').status || 'Pending Inspection' },
      { label: 'Screen SN', exFactoryValue: maskIfNeeded(findItem('Screen SN').factoryValue), readValue: maskIfNeeded(findItem('Screen SN').readValue), result: findItem('Screen SN').status || 'How to determine...?' }
    ],
    connectivityItems: [
      { label: 'LiDAR', value: safe(findItem('LiDAR').readValue, 'Empty'), result: findItem('LiDAR').status || 'Normal' },
      { label: 'Bluetooth', value: safe(report?.device?.bluetoothAddress, 'No disponible'), result: 'Normal' },
      { label: 'Cellular Address', value: safe(report?.device?.imei, 'No disponible'), result: 'Normal' },
      { label: 'Wi-Fi Address', value: safe(report?.device?.wifiAddress, 'No disponible'), result: 'Normal' }
    ],
    sensorItems: [
      { label: 'Face ID', value: 'Tap to Check', result: 'Tap to Check' },
      { label: 'Infrared Camera', value: maskIfNeeded(findItem('Infrared Camera').readValue), result: findItem('Infrared Camera').status || 'Pending Inspection' },
      { label: 'Dot Projector', value: maskIfNeeded(findItem('Dot Projector').readValue), result: findItem('Dot Projector').status || 'Pending Inspection' },
      { label: 'Distance Sensor', value: maskIfNeeded(findItem('Distance Sensor').readValue), result: findItem('Distance Sensor').status || 'Pending Inspection' }
    ],
    keyFacts: [
      { label: 'Device Name', value: directValue(report?.device?.name, rawValue('DeviceName', 'ProductName')) || 'No disponible' },
      { label: 'Model Identifier', value: directValue(report?.device?.model, rawValue('ProductType')) || 'No disponible' },
      { label: 'Model Number', value: directValue(report?.device?.modelNumber, rawValue('ModelNumber')) || 'No disponible' },
      { label: 'Serial Number', value: maskIfNeeded(directValue(report?.device?.serial, rawValue('SerialNumber'))) },
      { label: 'IMEI', value: directValue(report?.device?.imei, rawValue('InternationalMobileEquipmentIdentity', 'MobileEquipmentIdentifier')) || 'No disponible' },
      { label: 'IMEI 2', value: directValue(report?.device?.imei2, rawValue('InternationalMobileEquipmentIdentity2')) || 'No disponible' },
      { label: 'Color', value: directValue(report?.device?.color, rawValue('DeviceColor')) || 'No disponible' },
      { label: 'Sales Region', value: directValue(report?.device?.region, rawValue('RegionInfo')) || 'No disponible' },
      { label: 'Phone Number', value: directValue(report?.device?.phoneNumber, rawValue('PhoneNumber')) || 'No disponible' },
      { label: 'UDID', value: directValue(report?.device?.udid, rawValue('UniqueDeviceID')) || 'No disponible' },
      { label: 'Build Version', value: directValue(report?.device?.buildVersion, rawValue('BuildVersion')) || 'No disponible' },
      { label: 'Baseband Version', value: directValue(report?.device?.basebandVersion, rawValue('BasebandVersion')) || 'No disponible' }
    ],
    importantData: [
      { label: 'IMEI', value: directValue(report?.device?.imei, rawValue('InternationalMobileEquipmentIdentity', 'MobileEquipmentIdentifier')) || 'No disponible' },
      { label: 'IMEI 2', value: directValue(report?.device?.imei2, rawValue('InternationalMobileEquipmentIdentity2')) || 'No disponible' },
      { label: 'UDID', value: directValue(report?.device?.udid, rawValue('UniqueDeviceID')) || 'No disponible' },
      { label: 'ICCID', value: directValue(report?.device?.iccid, rawValue('IntegratedCircuitCardIdentity')) || 'No disponible' },
      { label: 'IMSI', value: directValue(report?.device?.imsi, rawValue('InternationalMobileSubscriberIdentity')) || 'No disponible' },
      { label: 'Phone Number', value: directValue(report?.device?.phoneNumber, rawValue('PhoneNumber')) || 'No disponible' },
      { label: 'Build Version', value: directValue(report?.device?.buildVersion, rawValue('BuildVersion')) || 'No disponible' },
      { label: 'Baseband Version', value: directValue(report?.device?.basebandVersion, rawValue('BasebandVersion')) || 'No disponible' },
      { label: 'Firmware Version', value: directValue(report?.device?.firmwareVersion, rawValue('FirmwareVersion')) || 'No disponible' },
      { label: 'Hardware Model', value: directValue(report?.device?.hardwareModel, rawValue('HardwareModel')) || 'No disponible' },
      { label: 'Hardware Platform', value: directValue(report?.device?.hardwarePlatform, rawValue('HardwarePlatform')) || 'No disponible' },
      { label: 'CPU Architecture', value: directValue(report?.device?.cpuArchitecture, rawValue('CPUArchitecture')) || 'No disponible' }
    ]
  }
})

const leftInfoItems = computed(() => [
  { label: 'Model Identifier', value: deviceReport.value.deviceInformation.modelIdentifier },
  { label: 'iOS Version', value: deviceReport.value.deviceInformation.iosVersion },
  { label: 'Activation', value: deviceReport.value.deviceInformation.activation },
  { label: 'Jailbreak', value: deviceReport.value.deviceInformation.jailbreak },
  { label: 'SN Match', value: deviceReport.value.deviceInformation.snMatch },
  { label: '5-Code Match', value: deviceReport.value.deviceInformation.fiveCodeMatch },
  { label: 'SIM Lock', value: deviceReport.value.deviceInformation.simLock },
  { label: 'Mfg. Date', value: deviceReport.value.deviceInformation.mfgDate },
  { label: 'Warranty Period', value: deviceReport.value.deviceInformation.warrantyPeriod },
  { label: 'ID Lock', value: deviceReport.value.deviceInformation.idLock },
  { label: 'Battery Life', value: deviceReport.value.deviceInformation.batteryLife },
  { label: 'Charge Cycles', value: deviceReport.value.deviceInformation.chargeCycles }
])

function closeDialog() {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    maximizable
    :draggable="false"
    :closable="false"
    :style="{ width: '96rem', maxWidth: '98vw' }"
    class="iphone-device-report-dialog"
  >
    <template #container>
      <div class="device-report-view">
        <div class="device-report-header">
          <div class="header-left">
            <div class="header-logo">3</div>
            <div class="header-copy">
              <div class="header-title">{{ title }}</div>
              <div class="header-subtitle">{{ subtitle }}</div>
            </div>
          </div>
          <Button icon="pi pi-times" text rounded severity="secondary" @click="closeDialog" />
        </div>

        <div class="device-report-body">
          <div class="device-report-left">
            <DeviceReportScoreCard :score="deviceReport.score" />
            <DeviceReportInfoList title="Device Information" :items="leftInfoItems" />
          </div>

          <div class="device-report-right">
            <div class="status-banner">
              <div class="banner-main">
                <i class="pi pi-check-circle"></i>
                <span>{{ deviceReport.statusMessage }}</span>
              </div>
              <span class="banner-date">{{ deviceReport.reportDate }}</span>
            </div>

            <div class="key-facts-card">
              <div class="key-facts-grid">
                <div
                  v-for="item in deviceReport.keyFacts"
                  :key="item.label"
                  class="key-fact-item"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
            </div>

            <DeviceReportTestTable :items="deviceReport.testItems" />

            <div class="bottom-grid">
              <DeviceReportMiniCard title="Components / Connectivity" :items="deviceReport.connectivityItems" />
              <DeviceReportMiniCard title="Biometrics / Sensors" :items="deviceReport.sensorItems" />
            </div>

            <div class="important-data-card">
              <div class="important-data-title">Important Technical Data</div>
              <div class="important-data-grid">
                <div
                  v-for="item in deviceReport.importantData"
                  :key="item.label"
                  class="important-data-row"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
            </div>

            <div class="bottom-actions">
              <div class="action-left">
                <Checkbox v-model="hideSerialNumber" binary inputId="hideSerialNumber" />
                <label for="hideSerialNumber">Hide Serial Number</label>
              </div>

              <div class="action-right">
                <Button
                  label="Recargar"
                  icon="pi pi-refresh"
                  outlined
                  :loading="loading"
                  @click="$emit('reload')"
                />
                <Button
                  label="Imprimir 80mm"
                  icon="pi pi-print"
                  severity="contrast"
                  outlined
                  @click="$emit('print-important')"
                />
                <Button
                  label="Screenshot"
                  icon="pi pi-camera"
                  class="screenshot-btn"
                  @click="$emit('screenshot')"
                />
                <Button
                  label="Close"
                  severity="secondary"
                  @click="closeDialog"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.device-report-view {
  background: #eff5fb;
  width: min(96rem, 98vw);
  height: min(92vh, 980px);
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.device-report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f8fbfe;
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.header-logo {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.75rem;
  background: linear-gradient(180deg, #2478ff 0%, #5b8cff 100%);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  font-weight: 800;
}

.header-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e293b;
}

.header-subtitle {
  font-size: 0.9rem;
  color: #94a3b8;
}

.device-report-body {
  display: grid;
  grid-template-columns: 24% 76%;
  gap: 1.25rem;
  padding: 1.1rem;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.device-report-left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.device-report-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}

.status-banner {
  background: linear-gradient(90deg, #ebfae7 0%, #def5db 100%);
  border: 1px solid #caebc5;
  border-radius: 16px;
  padding: 0.95rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-main {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: #1f2937;
  font-weight: 600;
}

.banner-main i {
  color: #16a34a;
}

.banner-date {
  font-size: 0.9rem;
  color: #64748b;
}

.key-facts-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1rem 1.1rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.key-facts-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem 1rem;
}

.key-fact-item {
  min-width: 0;
}

.key-fact-item span {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  margin-bottom: 0.25rem;
}

.key-fact-item strong {
  display: block;
  color: #1f2937;
  font-size: 0.92rem;
  font-weight: 700;
  word-break: break-all;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.important-data-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1rem 1.1rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.important-data-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.9rem;
}

.important-data-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem 1rem;
}

.important-data-row {
  padding: 0.55rem 0;
  border-bottom: 1px solid #eef2f7;
}

.important-data-row span {
  display: block;
  color: #64748b;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.important-data-row strong {
  display: block;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
  word-break: break-all;
}

.bottom-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 0 0.15rem;
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(239, 245, 251, 0.2) 0%, #eff5fb 28%);
  backdrop-filter: blur(6px);
}

.action-left {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
  font-size: 0.92rem;
}

.action-right {
  display: inline-flex;
  gap: 0.75rem;
  align-items: center;
}

.screenshot-btn {
  background: #d8f5fb !important;
  border-color: #b9eaf4 !important;
  color: #0f766e !important;
}

@media (max-width: 1200px) {
  .device-report-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 991px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .key-facts-grid,
  .important-data-grid {
    grid-template-columns: 1fr;
  }

  .status-banner,
  .bottom-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-right {
    flex-wrap: wrap;
  }
}
</style>
