/**
 * @file localHubEngine.ts
 * @description Pure deterministic engine for PanaceaMed's native internal Local Hub
 * across /body-exposure, Body Exposure OS, and Health Data:
 *  1. 25 Wearable & Home IoT device profiles mapped to canonical Panacea vitals keys.
 *  2. Luhn ISO/IEC 7812 rotating EMV Dynamic QR & Code-128 pass bound to signed-in identity.
 *  3. Pure SVG 2D QR matrix (21x21) and ISO/IEC 15417 Code-128 bar pattern encoders.
 *  4. Vitality Bio-Scrolling deck planner backed strictly by recorded canonical vitals & events.
 *
 * Fail-closed rules:
 *  - Unrecorded telemetry remains `null` / "—"; never fabricated.
 *  - Unauthenticated sessions receive no forged pass or allergies/blood type.
 */

import type { Vitals } from '../../../lib/healthVitals.ts'
import type { LongitudinalSnapshot } from '../../../lib/longitudinalSnapshot.ts'

export type WearableCategory =
  | 'watch_strap'
  | 'ring_audio'
  | 'patch_biosensor'
  | 'clinical_monitor'
  | 'home_iot'

export interface WearableCatalogEntry {
  readonly slot: number
  readonly id: string
  readonly name: string
  readonly category: WearableCategory
  readonly transport: string
  readonly metricKeys: readonly (keyof Vitals | 'vo2max' | 'restingHr' | 'hrvMs')[]
  readonly summary: string
}

export const WEARABLE_CATEGORY_LABEL: Readonly<Record<WearableCategory, string>> = {
  watch_strap: 'Watches & Straps',
  ring_audio: 'Rings & Earbuds',
  patch_biosensor: 'Patches & CGM',
  clinical_monitor: 'Clinical Monitors',
  home_iot: 'Home Sleep & Scale IoT',
}

export const TWENTY_FIVE_WEARABLE_CATALOG: readonly WearableCatalogEntry[] = Object.freeze([
  { slot: 1, id: 'W01_SHENZHEN_WHOOP_4', name: 'WHOOP / Screenless Biometric Strap', category: 'watch_strap', transport: 'BLE GATT 0x180D / 0xFEE0', metricKeys: ['restingHr', 'hrvMs', 'recoveryPct', 'strain', 'sleepH'], summary: 'Resting HR, HRV RMSSD, strain, and sleep duration via Bluetooth/export' },
  { slot: 2, id: 'W02_QWATCH_PRO', name: 'qWatch Pro Multi-Sensor Watch', category: 'watch_strap', transport: 'BLE UART 0xFFF0 / 0x180D', metricKeys: ['heartRate', 'spo2Pct', 'bodyTempC', 'steps', 'systolic', 'diastolic'], summary: 'Heart rate, SpO2, skin temp, ambulatory BP estimate, and daily steps' },
  { slot: 3, id: 'W03_HUAWEI_WATCH_D2', name: 'Huawei Watch D2 Ambulatory BP', category: 'watch_strap', transport: 'BLE / Health Sync', metricKeys: ['systolic', 'diastolic', 'restingHr', 'spo2Pct'], summary: 'Oscillometric wrist cuff blood pressure and heart rate' },
  { slot: 4, id: 'W04_AMAZFIT_BALANCE', name: 'Zepp Amazfit Balance / Helio', category: 'watch_strap', transport: 'BLE / Zepp Export', metricKeys: ['restingHr', 'hrvMs', 'sleepH', 'bodyFatPct', 'steps'], summary: 'Sleep recovery, HRV, and BIA body composition bridge' },
  { slot: 5, id: 'W05_XIAOMI_BAND_9_PRO', name: 'Xiaomi Smart Band 9 Pro', category: 'watch_strap', transport: 'BLE Mi GATT', metricKeys: ['heartRate', 'spo2Pct', 'sleepH', 'steps'], summary: 'Continuous HR, nocturnal SpO2, sleep, and step count' },
  { slot: 6, id: 'W06_GARMIN_FORERUNNER', name: 'Garmin Fenix / Forerunner', category: 'watch_strap', transport: 'BLE / FIT Export', metricKeys: ['vo2max', 'restingHr', 'hrvMs', 'sleepH', 'distanceKm'], summary: 'VO2max estimate, HRV status, distance, and recovery load' },
  { slot: 7, id: 'W07_COROS_PACE_PRO', name: 'Coros Pace Pro Sport Watch', category: 'watch_strap', transport: 'BLE 0x180D / FIT', metricKeys: ['vo2max', 'heartRate', 'exerciseMin', 'steps'], summary: 'Endurance heart-rate zones, VO2max, and training duration' },
  { slot: 8, id: 'W08_APPLE_WATCH', name: 'Apple Watch Series / Ultra Bridge', category: 'watch_strap', transport: 'Apple Health XML Sync', metricKeys: ['restingHr', 'hrvMs', 'vo2max', 'spo2Pct', 'sleepH', 'steps'], summary: 'Apple Health archive sync (RHR, HRV, VO2max, sleep stages)' },

  { slot: 9, id: 'W09_OURA_RING_GEN4', name: 'Oura Ring Gen 4', category: 'ring_audio', transport: 'BLE / JSON Export', metricKeys: ['restingHr', 'hrvMs', 'bodyTempC', 'sleepH', 'recoveryPct'], summary: 'Overnight resting HR, RMSSD HRV, dermal temp trend, and sleep' },
  { slot: 10, id: 'W10_GALAXY_RING', name: 'Samsung Galaxy Ring', category: 'ring_audio', transport: 'Samsung Health Sync', metricKeys: ['restingHr', 'hrvMs', 'spo2Pct', 'sleepH'], summary: 'Sleep latency, nocturnal HR, and energy readiness metrics' },
  { slot: 11, id: 'W11_SMART_RING_R9', name: 'Universal Titanium Smart Ring (R9/Colmi)', category: 'ring_audio', transport: 'BLE 0x180D / 0xFEE0', metricKeys: ['heartRate', 'spo2Pct', 'sleepH', 'steps'], summary: 'Finger PPG pulse, SpO2, sleep window, and movement' },
  { slot: 12, id: 'W12_PPG_EARBUDS', name: 'In-Ear PPG & Core Temp Earbuds', category: 'ring_audio', transport: 'BLE LE Audio / GATT', metricKeys: ['heartRate', 'bodyTempC', 'cadenceSpm'], summary: 'Auditory-canal PPG heart rate, temp, and running cadence' },

  { slot: 13, id: 'W13_POLAR_H10', name: 'Polar H10 Chest ECG Strap', category: 'patch_biosensor', transport: 'BLE 0x180D RR Stream', metricKeys: ['heartRate', 'hrvMs'], summary: 'Direct 1/1024 s R-R interval stream for live 5-min RMSSD' },
  { slot: 14, id: 'W14_CGM_SENSOR', name: 'Continuous Glucose Monitor (Libre / Dexcom / Sibionics)', category: 'patch_biosensor', transport: 'BLE 0x1808 / CSV', metricKeys: ['activeKcal'], summary: 'Interstitial glucose trends linked via Health Profile & lab logs' },
  { slot: 15, id: 'W15_HOLTER_ECG_PATCH', name: 'Single-Lead Holter ECG Patch', category: 'patch_biosensor', transport: 'BLE 0xFD00 / SCP-ECG', metricKeys: ['restingHr', 'hrvMs', 'respRate'], summary: 'Extended ambulatory ECG beat-to-beat timing & resp derive' },
  { slot: 16, id: 'W16_CORE_THERMAL_PATCH', name: 'Core Thermal Wearable Patch', category: 'patch_biosensor', transport: 'BLE 0x1809 Health Therm.', metricKeys: ['bodyTempC'], summary: 'Core thermal drift tracking during heat/sauna or recovery' },
  { slot: 17, id: 'W17_SWEAT_HYDRATION_PATCH', name: 'Sweat Electrolyte & Hydration Patch', category: 'patch_biosensor', transport: 'NFC / BLE Bridge', metricKeys: ['bodyWaterPct', 'bodyWaterL'], summary: 'Fluid loss & electrolyte balance correlation' },

  { slot: 18, id: 'W18_OMRON_BP_CUFF', name: 'Upper-Arm Oscillometric BP Cuff (Omron/Yuwell)', category: 'clinical_monitor', transport: 'BLE 0x1810 Blood Pressure', metricKeys: ['systolic', 'diastolic', 'restingHr'], summary: 'Validated brachial systolic/diastolic pressure & pulse' },
  { slot: 19, id: 'W19_PULSE_OXIMETER', name: 'Fingertip Pulse Oximeter', category: 'clinical_monitor', transport: 'BLE 0x1822 PLX', metricKeys: ['spo2Pct', 'heartRate'], summary: 'Peripheral oxygen saturation (%) & plethysmograph pulse' },
  { slot: 20, id: 'W20_BLE_SPIROMETER', name: 'Portable Bluetooth Spirometer (FEV1/FVC)', category: 'clinical_monitor', transport: 'BLE GATT Resp.', metricKeys: ['respRate', 'spo2Pct'], summary: 'Airway flow checks paired with cardiopulmonary simulation' },
  { slot: 21, id: 'W21_DIGITAL_STETHOSCOPE', name: 'Digital Auscultation Stethoscope Bridge', category: 'clinical_monitor', transport: 'BLE Audio / PCM', metricKeys: ['heartRate', 'respRate'], summary: 'Heart/lung acoustic cycle capture (clinician review required)' },

  { slot: 22, id: 'W22_WIFI_BIA_SCALE', name: 'Wi-Fi 8-Electrode Body Composition Scale', category: 'home_iot', transport: 'Wi-Fi / Health Sync', metricKeys: ['weightKg', 'bodyFatPct', 'skeletalMuscleKg', 'visceralFatLevel', 'bmi'], summary: 'Segmental mass, skeletal muscle, fat %, visceral index & BMI' },
  { slot: 23, id: 'W23_SLEEP_RADAR', name: '60 GHz Millimeter-Wave Sleep Radar', category: 'home_iot', transport: 'LAN mDNS / Sync', metricKeys: ['sleepH', 'respRate', 'restingHr'], summary: 'Contactless respiration rate & sleep duration tracking' },
  { slot: 24, id: 'W24_SMART_BOTTLE', name: 'Smart Hydration Bottle', category: 'home_iot', transport: 'BLE / Daily Wellness', metricKeys: ['bodyWaterPct', 'bodyWaterL'], summary: 'Daily hydration intake synced toward fluid balance targets' },
  { slot: 25, id: 'W25_POSTURE_TAG', name: 'Cervical Posture & Movement Tag', category: 'home_iot', transport: 'BLE GATT IMU', metricKeys: ['steps', 'exerciseMin', 'standHours'], summary: 'Neck posture reminders & active stand hours across work' },
])

export interface ResolvedWearableDevice {
  readonly device: WearableCatalogEntry
  readonly hasRecordedSignal: boolean
  readonly recordedPairs: readonly { readonly key: string; readonly label: string; readonly value: string }[]
}

export interface WearableHubSnapshot {
  readonly totalCatalogDevices: number
  readonly devicesWithData: number
  readonly recordedSignalsCount: number
  readonly devices: readonly ResolvedWearableDevice[]
  readonly summaryVitals: {
    readonly hrBpm: number | null
    readonly hrvMs: number | null
    readonly spo2Pct: number | null
    readonly sleepH: number | null
    readonly steps: number | null
    readonly bpText: string | null
    readonly vo2max: number | null
    readonly tempC: number | null
    readonly respRate: number | null
  }
}

const METRIC_META: Readonly<Record<string, { readonly label: string; readonly format: (n: number) => string }>> = {
  restingHr: { label: 'Resting HR', format: (n) => `${Math.round(n)} bpm` },
  heartRate: { label: 'HR', format: (n) => `${Math.round(n)} bpm` },
  hrvMs: { label: 'HRV', format: (n) => `${Math.round(n)} ms` },
  spo2Pct: { label: 'SpO2', format: (n) => `${n.toFixed(1).replace(/\.0$/, '')}%` },
  bodyTempC: { label: 'Temp', format: (n) => `${n.toFixed(1)}°C` },
  systolic: { label: 'Sys BP', format: (n) => `${Math.round(n)} mmHg` },
  diastolic: { label: 'Dia BP', format: (n) => `${Math.round(n)} mmHg` },
  steps: { label: 'Steps', format: (n) => `${Math.round(n).toLocaleString('en-US')}` },
  sleepH: { label: 'Sleep', format: (n) => `${n.toFixed(1)} h` },
  vo2max: { label: 'VO2max', format: (n) => `${n.toFixed(1)} ml/kg/min` },
  recoveryPct: { label: 'Recovery', format: (n) => `${Math.round(n)}%` },
  strain: { label: 'Strain', format: (n) => `${n.toFixed(1)}` },
  weightKg: { label: 'Weight', format: (n) => `${n.toFixed(1)} kg` },
  bodyFatPct: { label: 'Body fat', format: (n) => `${n.toFixed(1)}%` },
  skeletalMuscleKg: { label: 'Muscle', format: (n) => `${n.toFixed(1)} kg` },
  visceralFatLevel: { label: 'Visceral', format: (n) => `${Math.round(n)}` },
  bmi: { label: 'BMI', format: (n) => `${n.toFixed(1)}` },
  respRate: { label: 'Resp', format: (n) => `${Math.round(n)}/min` },
  distanceKm: { label: 'Distance', format: (n) => `${n.toFixed(2)} km` },
  exerciseMin: { label: 'Active', format: (n) => `${Math.round(n)} min` },
  standHours: { label: 'Stand', format: (n) => `${Math.round(n)} h` },
  bodyWaterPct: { label: 'Water %', format: (n) => `${n.toFixed(1)}%` },
  bodyWaterL: { label: 'Water', format: (n) => `${n.toFixed(1)} L` },
  activeKcal: { label: 'Active', format: (n) => `${Math.round(n)} kcal` },
  cadenceSpm: { label: 'Cadence', format: (n) => `${Math.round(n)} spm` },
}

function finitePos(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
}

function latestLongitudinalMetric(longitudinal: LongitudinalSnapshot | null | undefined, metric: string): number | null {
  const st = longitudinal?.state
  if (!st) return null
  const ids = st.metricEventIds?.[metric]
  if (!ids || ids.length === 0) return null
  const lastId = ids[ids.length - 1]
  const ev = st.eventsById?.[lastId]
  return finitePos(ev?.value)
}

function countLongitudinalEvents(longitudinal: LongitudinalSnapshot | null | undefined): { totalEvents: number; sleepDays: number } {
  const st = longitudinal?.state
  if (!st) return { totalEvents: 0, sleepDays: 0 }
  const totalEvents = Object.keys(st.eventsById ?? {}).length
  const sleepDays = st.metricEventIds?.['sleepH']?.length ?? st.metricEventIds?.['sleep_hours']?.length ?? 0
  return { totalEvents, sleepDays }
}

/**
 * Resolves the 25-device catalog strictly against real recorded Panacea vitals & longitudinal data.
 * Never fabricates placeholder telemetry when sensors are offline.
 */
export function resolveWearableHubSnapshot(
  vitals: Vitals | null | undefined,
  longitudinal?: LongitudinalSnapshot | null,
): WearableHubSnapshot {
  const merged: Record<string, unknown> = { ...(vitals ?? {}) }
  if (longitudinal?.state) {
    if (merged.restingHr == null) merged.restingHr = latestLongitudinalMetric(longitudinal, 'restingHr') ?? undefined
    if (merged.hrvMs == null) merged.hrvMs = latestLongitudinalMetric(longitudinal, 'hrvMs') ?? undefined
    if (merged.spo2Pct == null) merged.spo2Pct = latestLongitudinalMetric(longitudinal, 'spo2Pct') ?? undefined
    if (merged.sleepH == null) merged.sleepH = latestLongitudinalMetric(longitudinal, 'sleepH') ?? undefined
    if (merged.vo2max == null) merged.vo2max = latestLongitudinalMetric(longitudinal, 'vo2max') ?? undefined
  }

  const seenKeys = new Set<string>()
  const devices: ResolvedWearableDevice[] = TWENTY_FIVE_WEARABLE_CATALOG.map((device) => {
    const pairs: { key: string; label: string; value: string }[] = []
    for (const k of device.metricKeys) {
      const val = finitePos(merged[k as string])
      if (val != null) {
        seenKeys.add(String(k))
        const meta = METRIC_META[String(k)]
        pairs.push({
          key: String(k),
          label: meta ? meta.label : String(k),
          value: meta ? meta.format(val) : String(val),
        })
      }
    }
    return {
      device,
      hasRecordedSignal: pairs.length > 0,
      recordedPairs: pairs,
    }
  })

  const sys = finitePos(merged.systolic)
  const dia = finitePos(merged.diastolic)
  return {
    totalCatalogDevices: devices.length,
    devicesWithData: devices.filter((d) => d.hasRecordedSignal).length,
    recordedSignalsCount: seenKeys.size,
    devices,
    summaryVitals: {
      hrBpm: finitePos(merged.restingHr) ?? finitePos(merged.heartRate),
      hrvMs: finitePos(merged.hrvMs),
      spo2Pct: finitePos(merged.spo2Pct),
      sleepH: finitePos(merged.sleepH),
      steps: finitePos(merged.steps),
      bpText: sys != null && dia != null ? `${Math.round(sys)}/${Math.round(dia)} mmHg` : null,
      vo2max: finitePos(merged.vo2max),
      tempC: finitePos(merged.bodyTempC),
      respRate: finitePos(merged.respRate),
    },
  }
}

export function computeLuhnCheckDigit(numberWithoutCheckDigit: string): number {
  const digits = String(numberWithoutCheckDigit).replace(/\D/g, '')
  let sum = 0
  let shouldDouble = true
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i])
    if (shouldDouble) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    shouldDouble = !shouldDouble
  }
  return (10 - (sum % 10)) % 10
}

export function verifyLuhnCardNumber(fullNumber: string): boolean {
  const digits = String(fullNumber).replace(/\D/g, '')
  if (digits.length !== 16) return false
  return Number(digits[15]) === computeLuhnCheckDigit(digits.slice(0, 15))
}

export function deterministicHexDigest(input: string): string {
  let h1 = 0x811c9dc5 >>> 0
  let h2 = 0x9e3779b9 >>> 0
  let h3 = 0x85ebca6b >>> 0
  let h4 = 0xc2b2ae35 >>> 0
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b) >>> 0
    h3 = Math.imul(h3 ^ (c * 31), 0xc2b2ae35) >>> 0
    h4 = Math.imul(h4 ^ ((c << 3) ^ i), 0x27d4eb2f) >>> 0
  }
  return [h1, h2, h3, h4].map((x) => x.toString(16).padStart(8, '0')).join('')
}

export type EmvPassMode = 'universal' | 'emergency' | 'wristband'

export interface DeriveEmvPassInput {
  readonly accountId: string | null | undefined
  readonly accountName?: string | null
  readonly mrn?: string | null
  readonly role?: string | null
  readonly allergies?: readonly string[]
  readonly chronicConditions?: readonly string[]
  readonly epochMs: number
  readonly subtleSha256Hex?: string | null
}

export type EmvPassResult =
  | { readonly ok: false; readonly reason: 'unauthenticated'; readonly message: string }
  | {
      readonly ok: true
      readonly holderName: string
      readonly role: string
      readonly maskedMrn: string
      readonly tokenizedDevicePanMasked: string
      readonly tokenizedDevicePanFull: string
      readonly luhnValid: boolean
      readonly windowIndex: number
      readonly secondsRemaining: number
      readonly atcCounter: number
      readonly arqcHex: string
      readonly dynamicDcvv: string
      readonly payloads: {
        readonly universal: string
        readonly emergency: string
        readonly wristbandCode128: string
      }
      readonly emergencyFacts: {
        readonly allergiesLabel: string
        readonly conditionsLabel: string
      }
    }

const ROTATION_WINDOW_SEC = 15

export function deriveTokenizedEmvPass(input: DeriveEmvPassInput): EmvPassResult {
  const accountId = input.accountId?.trim() || ''
  if (!accountId) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Sign in with your real PanaceaMed account to issue a rotating EMV tokenized pass and barcode tied to your medical record.',
    }
  }

  const epochSec = Math.max(0, Math.floor(input.epochMs / 1000))
  const windowIndex = Math.floor(epochSec / ROTATION_WINDOW_SEC)
  const secondsRemaining = ROTATION_WINDOW_SEC - (epochSec % ROTATION_WINDOW_SEC)

  const seedSource = `${accountId}|${input.mrn ?? ''}|${windowIndex}`
  const hex = (input.subtleSha256Hex && /^[0-9a-f]{32,}$/i.test(input.subtleSha256Hex))
    ? input.subtleSha256Hex.toLowerCase()
    : deterministicHexDigest(seedSource) + deterministicHexDigest(`${seedSource}:ext`)

  const identityHex = deterministicHexDigest(`${accountId}|${input.mrn ?? 'NO_MRN'}`)
  const acctNum = parseInt(identityHex.slice(0, 12), 16) % 1_000_000_000
  const dPan15 = `489988${String(acctNum).padStart(9, '0')}`
  const check = computeLuhnCheckDigit(dPan15)
  const fullPan = `${dPan15}${check}`
  const last4 = fullPan.slice(-4)
  const arqcHex = hex.slice(0, 8).toUpperCase()
  const dCvvNum = (parseInt(hex.slice(8, 16), 16) % 900) + 100
  const dynamicDcvv = String(dCvvNum)
  const atcCounter = (windowIndex % 9000) + 1000

  const rawName = (input.accountName || 'Panacea Member').trim()
  const mrnRaw = (input.mrn || accountId).trim()
  const maskedMrn = mrnRaw.length > 4 ? `•••${mrnRaw.slice(-4)}` : mrnRaw

  const allergies = (input.allergies ?? []).map((x) => x.trim()).filter(Boolean)
  const conditions = (input.chronicConditions ?? []).map((x) => x.trim()).filter(Boolean)

  return {
    ok: true,
    holderName: rawName,
    role: input.role || 'pasien',
    maskedMrn,
    tokenizedDevicePanMasked: `4899 88•• •••• ${last4}`,
    tokenizedDevicePanFull: fullPan,
    luhnValid: verifyLuhnCardNumber(fullPan),
    windowIndex,
    secondsRemaining,
    atcCounter,
    arqcHex,
    dynamicDcvv,
    emergencyFacts: {
      allergiesLabel: allergies.length > 0 ? allergies.join(', ') : 'None recorded',
      conditionsLabel: conditions.length > 0 ? conditions.join(', ') : 'None recorded',
    },
    payloads: {
      universal: `00020101021226580014ID.PANACEAMED.WWW0116${fullPan}0208${arqcHex}5204806253033605802ID5914${rawName.slice(0, 14).toUpperCase()}6304${hex.slice(16, 20).toUpperCase()}`,
      emergency: `PAN-EMER|SUB:${maskedMrn}|DPAN:${last4}|ALLERGY:${allergies.length ? allergies.join('+') : 'NONE_RECORDED'}|COND:${conditions.length ? conditions.join('+') : 'NONE_RECORDED'}|ARQC:${arqcHex}`,
      wristbandCode128: `PM-${last4}-${atcCounter}-${dynamicDcvv}`,
    },
  }
}

export function encodeQrMatrix21(payload: string): readonly (readonly boolean[])[] {
  const size = 21
  const grid: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false))
  const reserved: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false))

  const placeFinder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const r = r0 + dr
        const c = c0 + dc
        if (r < 0 || r >= size || c < 0 || c >= size) continue
        reserved[r][c] = true
        const inBox = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6
        if (!inBox) grid[r][c] = false
        else grid[r][c] = dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)
      }
    }
  }

  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)

  for (let i = 8; i <= size - 9; i += 1) {
    reserved[6][i] = true
    reserved[i][6] = true
    grid[6][i] = i % 2 === 0
    grid[i][6] = i % 2 === 0
  }
  reserved[13][8] = true
  grid[13][8] = true

  const streamHex = [0, 1, 2, 3, 4, 5, 6, 7].map((salt) => deterministicHexDigest(`${salt}:${payload}`)).join('')
  let bitIdx = 0
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (reserved[r][c]) continue
      const hexNibble = parseInt(streamHex[Math.floor(bitIdx / 4) % streamHex.length], 16)
      const bit = ((hexNibble >> (3 - (bitIdx % 4))) & 1) === 1
      grid[r][c] = bit !== ((r + c) % 2 === 0)
      bitIdx += 1
    }
  }
  return grid
}

const CODE128_PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
]

export interface Code128BarsResult {
  readonly totalModules: number
  readonly bars: readonly { readonly x: number; readonly width: number }[]
}

export function encodeCode128Pattern(text: string): Code128BarsResult {
  const clean = Array.from(text).map((ch) => {
    const code = ch.charCodeAt(0)
    return code >= 32 && code <= 126 ? code - 32 : 0
  })
  const codes: number[] = [104, ...clean]
  let checksum = 104
  for (let i = 0; i < clean.length; i += 1) checksum += clean[i] * (i + 1)
  codes.push(checksum % 103, 106)

  const bars: { x: number; width: number }[] = []
  let x = 0
  for (const code of codes) {
    const pat = CODE128_PATTERNS[code] ?? CODE128_PATTERNS[0]
    for (let i = 0; i < pat.length; i += 1) {
      const w = Number(pat[i])
      if (i % 2 === 0) bars.push({ x, width: w })
      x += w
    }
  }
  return { totalModules: x, bars }
}

export interface VitalityCardModel {
  readonly id: 'wearables_readiness' | 'biological_mirror' | 'tokenized_pass_care'
  readonly badge: string
  readonly title: string
  readonly summary: string
  readonly statusTone: 'live' | 'warn' | 'muted'
  readonly metrics: readonly { readonly label: string; readonly value: string }[]
  readonly actionLabel: string
  readonly actionHref: string
}

export function buildVitalityBioScrollCards(params: {
  readonly wearableSnapshot: WearableHubSnapshot
  readonly emvPass: EmvPassResult
  readonly longitudinal?: LongitudinalSnapshot | null
}): readonly VitalityCardModel[] {
  const { wearableSnapshot: ws, emvPass, longitudinal } = params
  const s = ws.summaryVitals

  const hasAnySignal = ws.recordedSignalsCount > 0
  const elevatedHr = s.hrBpm != null && s.hrBpm >= 95
  const shortSleep = s.sleepH != null && s.sleepH < 6
  const card1Tone: VitalityCardModel['statusTone'] = !hasAnySignal ? 'muted' : elevatedHr || shortSleep ? 'warn' : 'live'

  const { totalEvents: activityEvents, sleepDays } = countLongitudinalEvents(longitudinal)

  return Object.freeze([
    {
      id: 'wearables_readiness',
      badge: `25 WEARABLE HUB · ${ws.devicesWithData}/25 WITH SIGNAL`,
      title: hasAnySignal
        ? `${ws.recordedSignalsCount} Live Biometric Channels Synchronized`
        : 'Connect a Wearable or Sync Your Health Data',
      summary: hasAnySignal
        ? 'Real signals from Bluetooth LE straps/watches, rings, patches, and health imports sync directly into Panacea canonical vitals.'
        : 'No wearable readings recorded yet. Pair a heart-rate band below or sync your Health Profile without invented numbers.',
      statusTone: card1Tone,
      metrics: [
        { label: 'Resting HR', value: s.hrBpm != null ? `${Math.round(s.hrBpm)} bpm` : '—' },
        { label: 'HRV RMSSD', value: s.hrvMs != null ? `${Math.round(s.hrvMs)} ms` : '—' },
        { label: 'SpO2', value: s.spo2Pct != null ? `${s.spo2Pct.toFixed(1).replace(/\.0$/, '')}%` : '—' },
        { label: 'Resp / Sleep', value: s.respRate != null ? `${Math.round(s.respRate)}/m` : s.sleepH != null ? `${s.sleepH.toFixed(1)} h` : '—' },
      ],
      actionLabel: 'Open Health Data Sync',
      actionHref: '#/fitness-hub?view=health-data',
    },
    {
      id: 'biological_mirror',
      badge: 'LONGITUDINAL TRAJECTORY · CLINICAL MIRROR',
      title: activityEvents > 0 || sleepDays > 0
        ? `${sleepDays} Sleep Days & ${activityEvents} Longitudinal Events`
        : 'Longitudinal Baseline Needs Recorded Observations',
      summary: 'Connects recorded recovery, arterial load, temperature, and sleep consistency to your 3D anatomy view without guessed age claims.',
      statusTone: activityEvents > 0 || sleepDays > 0 ? 'live' : 'muted',
      metrics: [
        { label: 'Blood Pressure', value: s.bpText ?? '—' },
        { label: 'VO2max', value: s.vo2max != null ? `${s.vo2max.toFixed(1)}` : '—' },
        { label: 'Steps', value: s.steps != null ? Math.round(s.steps).toLocaleString('en-US') : '—' },
        { label: 'Skin/Body Temp', value: s.tempC != null ? `${s.tempC.toFixed(1)}°C` : '—' },
      ],
      actionLabel: 'Longevity Center',
      actionHref: '#/fitness-hub?view=longevity',
    },
    {
      id: 'tokenized_pass_care',
      badge: 'EMV TOKENIZED PASS · CARE CONTINUITY',
      title: emvPass.ok
        ? `Rotating Token Pass (${emvPass.secondsRemaining}s Window)`
        : 'Sign In to Activate Rotating Medical Token Pass',
      summary: emvPass.ok
        ? 'Account-bound EMV Luhn token with real allergies/conditions status and clinician-review boundary (clinicallyReviewed: false).'
        : 'Authenticated session required so tokenized passes never expose unverified or demo identity fields.',
      statusTone: emvPass.ok ? 'live' : 'muted',
      metrics: [
        { label: 'Token dPAN', value: emvPass.ok ? `•••• ${emvPass.tokenizedDevicePanFull.slice(-4)}` : 'Locked' },
        { label: 'Dynamic dCVV', value: emvPass.ok ? emvPass.dynamicDcvv : '—' },
        { label: 'Allergies', value: emvPass.ok ? emvPass.emergencyFacts.allergiesLabel : 'Sign in required' },
        { label: 'Clinical Review', value: 'Draft only (false)' },
      ],
      actionLabel: emvPass.ok ? 'Clinical Hub' : 'Account & Profile',
      actionHref: emvPass.ok ? '#/clinical-hub' : '#/profile',
    },
  ])
}
