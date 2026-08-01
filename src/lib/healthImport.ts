// Parse health-app export files into the fields our Health Profile uses.
// Supports Apple Health (export.xml), WHOOP (physiological_cycles.csv or a
// JSON export), and Garmin Connect (JSON export — "Export Your Data" from
// Garmin Connect, or any third-party Garmin JSON dump). Garmin and WHOOP
// don't offer a live auto-sync webhook the way Apple's Health Auto Export
// app does, so for those two the flow is: export from the app, upload the
// file here. Everything runs client-side — no file ever leaves the device
// during parsing.

export interface ImportResult {
  vo2max?: number
  restingHr?: number
  hrvMs?: number
  recoveryPct?: number
  strain?: number
  sleepH?: number
  weightKg?: number
  bodyFatPct?: number
  // Widened so the whole vitals set a watch produces reaches the rest of the
  // app, not just the five fields the Health Profile form happened to show.
  heartRate?: number
  spo2Pct?: number
  respRate?: number
  systolic?: number
  diastolic?: number
  steps?: number
  activeKcal?: number
  leanMassKg?: number
  bodyTempC?: number
  exerciseMin?: number
  distanceKm?: number
  // Body composition beyond weight/fat — InBody and smart scales report these.
  bmi?: number
  heightCm?: number
  skeletalMuscleKg?: number
  bodyWaterL?: number
  visceralFatLevel?: number
  waistHipRatio?: number
  bmrKcal?: number
  // Smart-scale / BIA reports (MovingLife, Xiaomi-class scales) publish these
  // as percentages of body mass rather than absolute kilograms.
  bodyWaterPct?: number
  proteinPct?: number
  bonePct?: number
  musclePct?: number
  subcutaneousFatKg?: number
  boneMassKg?: number
  bodyAge?: number
  amrKcal?: number
  visceralFatIndex?: number
  // Sleep architecture. Total sleep alone hides the thing that actually
  // matters after night shifts: whether deep and REM were reached at all.
  sleepDeepH?: number
  sleepRemH?: number
  sleepCoreH?: number
  sleepAwakeH?: number
  // Gait quality — Apple derives these from the phone in a pocket. Asymmetry
  // and double-support are the two the app never read despite being the ones
  // that speak to posture and fall risk.
  walkingSpeedKmh?: number
  walkingAsymmetryPct?: number
  walkingDoubleSupportPct?: number
  walkingStepLengthCm?: number
  stairSpeedUpMs?: number
  stairSpeedDownMs?: number
  sixMinWalkM?: number
  // Running form.
  runningPowerW?: number
  runningSpeedKmh?: number
  runningStrideLengthM?: number
  runningGroundContactMs?: number
  runningVerticalOscCm?: number
  // Other daily signals.
  cardioRecoveryBpm?: number
  flightsClimbed?: number
  standHours?: number
  daylightMin?: number
  audioExposureDb?: number
  headphoneAudioDb?: number
  basalKcal?: number
  measuredAt?: string
  source?: string
}

// ── Health Auto Export (iOS app) ─────────────────────────────────────────────
// The app most people use to get Apple Watch data out of Apple Health. Its JSON
// puts the METRIC NAME IN A VALUE, not a key:
//
//   {"data":{"metrics":[{"name":"resting_heart_rate","data":[{"qty":54}]}]}}
//
// The generic flattener could never read this: flattening collapses every
// metric to the same handful of leaf keys (qty/Avg/Min/Max), so the name — the
// only thing identifying what the number means — was thrown away and every
// lookup returned undefined. That is why Health Auto Export files imported as
// "no recognizable data". This parser walks `metrics` by name instead.
const HAE_FIELD: Record<string, keyof ImportResult> = {
  vo2_max: 'vo2max',
  resting_heart_rate: 'restingHr',
  heart_rate_variability: 'hrvMs',
  heart_rate_variability_sdnn: 'hrvMs',
  heart_rate: 'heartRate',
  walking_heart_rate_average: 'heartRate',
  blood_oxygen_saturation: 'spo2Pct',
  oxygen_saturation: 'spo2Pct',
  respiratory_rate: 'respRate',
  blood_pressure_systolic: 'systolic',
  blood_pressure_diastolic: 'diastolic',
  step_count: 'steps',
  active_energy: 'activeKcal',
  basal_energy_burned: 'basalKcal',
  apple_exercise_time: 'exerciseMin',
  distance_walking_running: 'distanceKm',
  // The export actually written by current Health Auto Export versions uses
  // this word order. Only the reversed spelling was mapped, so walking and
  // running distance silently never imported from a real file.
  walking_running_distance: 'distanceKm',
  body_mass_index: 'bmi',
  height: 'heightCm',
  walking_speed: 'walkingSpeedKmh',
  walking_asymmetry_percentage: 'walkingAsymmetryPct',
  walking_double_support_percentage: 'walkingDoubleSupportPct',
  walking_step_length: 'walkingStepLengthCm',
  stair_speed_up: 'stairSpeedUpMs',
  stair_speed_down: 'stairSpeedDownMs',
  six_minute_walking_test_distance: 'sixMinWalkM',
  running_power: 'runningPowerW',
  running_speed: 'runningSpeedKmh',
  running_stride_length: 'runningStrideLengthM',
  running_ground_contact_time: 'runningGroundContactMs',
  running_vertical_oscillation: 'runningVerticalOscCm',
  cardio_recovery: 'cardioRecoveryBpm',
  flights_climbed: 'flightsClimbed',
  apple_stand_hour: 'standHours',
  time_in_daylight: 'daylightMin',
  environmental_audio_exposure: 'audioExposureDb',
  headphone_audio_exposure: 'headphoneAudioDb',
  weight_body_mass: 'weightKg',
  body_mass: 'weightKg',
  body_fat_percentage: 'bodyFatPct',
  lean_body_mass: 'leanMassKg',
  body_temperature: 'bodyTempC',
  apple_sleeping_wrist_temperature: 'bodyTempC',
}

/** Reads the numeric value of one Health Auto Export sample. */
function haeValue(sample: Record<string, unknown>): number | undefined {
  // `qty` for cumulative/instant metrics; Avg (then Max, then Min) for the
  // averaged ones. Key case varies between app versions, so match case-insensitively.
  const pick = (want: string): number | undefined => {
    for (const [k, v] of Object.entries(sample)) {
      if (k.toLowerCase() === want && typeof v === 'number' && Number.isFinite(v)) return v
    }
    return undefined
  }
  return pick('qty') ?? pick('avg') ?? pick('max') ?? pick('min')
}

export function parseHealthAutoExport(text: string): ImportResult {
  let root: unknown
  try { root = JSON.parse(text) } catch { return {} }
  const data = (root as { data?: unknown })?.data ?? root
  const metrics = (data as { metrics?: unknown })?.metrics
  if (!Array.isArray(metrics)) return {}

  const out: ImportResult = { source: 'Apple Watch' }
  let newest = -Infinity

  for (const m of metrics as Record<string, unknown>[]) {
    const name = typeof m?.name === 'string' ? m.name.toLowerCase() : ''
    const samples = Array.isArray(m?.data) ? (m.data as Record<string, unknown>[]) : []
    if (!name || !samples.length) continue

    // Most recent sample wins; the app writes oldest-first but don't rely on it.
    let best: Record<string, unknown> | undefined
    let bestT = -Infinity
    for (const s of samples) {
      const t = typeof s?.date === 'string' ? Date.parse(s.date.replace(' +', '+')) : NaN
      const key = Number.isNaN(t) ? bestT : t
      if (!best || key >= bestT) { bestT = key; best = s }
    }
    if (!best) continue
    if (Number.isFinite(bestT) && bestT > newest) newest = bestT

    // Sleep carries its own field names rather than qty/Avg, AND its unit
    // varies between app versions — hours on some, minutes on others. Trust the
    // declared `units`, then fall back to magnitude, because nobody sleeps more
    // than 24 hours. The server-side webhook parser applies the identical rule
    // so the same night yields the same number by either delivery path.
    if (name.startsWith('sleep')) {
      // Treat 0 as "not recorded", not as a value: current exports write
      // asleep:0 alongside a real totalSleep, and `??` would have accepted the
      // zero and thrown the actual night away.
      const num = (k: string) => {
        const v = best![k]
        return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined
      }
      const raw = num('asleep') ?? num('totalSleep') ?? num('core')
      const units = typeof m?.units === 'string' ? m.units.toLowerCase() : ''
      const toH = (v: number) =>
        units.startsWith('hr') || units.startsWith('hour') ? +v.toFixed(1)
          : units.startsWith('min') ? +(v / 60).toFixed(1)
          : +(v > 24 ? v / 60 : v).toFixed(1)
      if (raw != null) out.sleepH = toH(raw)
      // Stages, when the watch recorded them. Total hours alone hides the
      // thing that actually matters after night shifts — whether deep and REM
      // were reached at all — so keep them rather than collapsing to one number.
      const deep = num('deep'); if (deep != null) out.sleepDeepH = toH(deep)
      const rem = num('rem'); if (rem != null) out.sleepRemH = toH(rem)
      const core = num('core'); if (core != null) out.sleepCoreH = toH(core)
      const awake = num('awake'); if (awake != null) out.sleepAwakeH = toH(awake)
      continue
    }

    const field = HAE_FIELD[name]
    if (!field) continue
    let raw = haeValue(best)
    if (raw == null) continue

    // UNITS ARE NOT FIXED. Apple exports energy in kilojoules on a metric
    // locale and kilocalories elsewhere, and height in metres. Storing the raw
    // number meant a 931 kJ run was recorded as 931 kcal — more than four times
    // the real figure. Trust the declared `units` rather than the field name.
    const units = typeof m?.units === 'string' ? m.units.toLowerCase() : ''
    if ((field === 'activeKcal' || field === 'basalKcal') && units.startsWith('kj')) raw = raw / 4.184
    if (field === 'heightCm' && (units === 'm' || units.startsWith('metre') || units.startsWith('meter'))) raw = raw * 100
    if (field === 'distanceKm' && units === 'm') raw = raw / 1000

    // Apple stores proportions (0.98 = 98%) for saturation and body fat.
    if (field === 'spo2Pct' || field === 'bodyFatPct') out[field] = pct(raw) as never
    else if (field === 'hrvMs' || field === 'restingHr' || field === 'heartRate' || field === 'systolic'
      || field === 'diastolic' || field === 'steps' || field === 'activeKcal' || field === 'basalKcal'
      || field === 'exerciseMin' || field === 'heightCm' || field === 'flightsClimbed' || field === 'standHours'
      || field === 'daylightMin' || field === 'sixMinWalkM' || field === 'cardioRecoveryBpm'
      || field === 'runningPowerW' || field === 'runningGroundContactMs') {
      out[field] = round(raw) as never
    } else out[field] = (+raw.toFixed(2)) as never
  }

  if (Number.isFinite(newest) && newest > 0) out.measuredAt = new Date(newest).toISOString()
  return prune(out)
}

// Apple Health export.xml — records are written chronologically, so the LAST
// match of each type is the most recent value. We regex instead of DOM-parsing
// so multi-MB exports don't blow up memory.
export function parseAppleHealth(xml: string): ImportResult {
  // Pick the record with the greatest startDate rather than trusting file order —
  // Apple exports interleave sources and aren't reliably chronological. Falls back
  // to the last match when a record has no parseable date.
  const latest = (type: string): number | undefined => {
    const re = new RegExp(`type="${type}"[^>]*?(?:startDate="([^"]*)"[^>]*?)?value="([\\d.]+)"`, 'g')
    let m: RegExpExecArray | null
    let v: number | undefined
    let best = -Infinity
    while ((m = re.exec(xml))) {
      const t = m[1] ? Date.parse(m[1]) : NaN
      const key = Number.isNaN(t) ? best : t // undated records: keep last-seen ordering
      if (key >= best) { best = key; v = parseFloat(m[2]) }
    }
    return Number.isFinite(v) ? v : undefined
  }
  const out: ImportResult = { source: 'Apple Watch' }
  out.vo2max = latest('HKQuantityTypeIdentifierVO2Max')
  out.restingHr = round(latest('HKQuantityTypeIdentifierRestingHeartRate'))
  out.hrvMs = round(latest('HKQuantityTypeIdentifierHeartRateVariabilitySDNN'))
  out.weightKg = latest('HKQuantityTypeIdentifierBodyMass')
  out.bodyFatPct = pct(latest('HKQuantityTypeIdentifierBodyFatPercentage'))
  // The watch records far more than the five fields the form used to show;
  // pull the rest so downstream pages can prefill instead of guessing.
  out.heartRate = round(latest('HKQuantityTypeIdentifierHeartRate'))
  out.spo2Pct = pct(latest('HKQuantityTypeIdentifierOxygenSaturation'))
  out.respRate = latest('HKQuantityTypeIdentifierRespiratoryRate')
  out.systolic = round(latest('HKQuantityTypeIdentifierBloodPressureSystolic'))
  out.diastolic = round(latest('HKQuantityTypeIdentifierBloodPressureDiastolic'))
  out.steps = round(latest('HKQuantityTypeIdentifierStepCount'))
  out.activeKcal = round(latest('HKQuantityTypeIdentifierActiveEnergyBurned'))
  out.exerciseMin = round(latest('HKQuantityTypeIdentifierAppleExerciseTime'))
  out.leanMassKg = latest('HKQuantityTypeIdentifierLeanBodyMass')
  out.bodyTempC = latest('HKQuantityTypeIdentifierBodyTemperature')
  out.distanceKm = latest('HKQuantityTypeIdentifierDistanceWalkingRunning')
  return prune(out)
}

// WHOOP export CSV (physiological_cycles.csv). Header names vary slightly by
// export version, so we match on fragments and read the most recent complete row.
export function parseWhoopCsv(text: string): ImportResult {
  const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/)
  if (lines.length < 2) return {}
  const header = splitCsv(lines[0]).map((h) => h.toLowerCase())
  // last non-empty row
  let row: string[] = []
  for (let i = lines.length - 1; i >= 1; i--) {
    const r = splitCsv(lines[i])
    if (r.some((c) => c.trim() !== '')) { row = r; break }
  }
  const val = (frag: string): number | undefined => {
    const i = header.findIndex((h) => h.includes(frag))
    if (i < 0) return undefined
    const n = parseFloat((row[i] || '').replace(',', '.'))
    return Number.isFinite(n) ? n : undefined
  }
  const out: ImportResult = { source: 'WHOOP' }
  out.recoveryPct = round(val('recovery score'))
  out.restingHr = round(val('resting heart rate'))
  out.hrvMs = round(val('heart rate variability'))
  out.strain = val('day strain') ?? val('strain')
  const asleepMin = val('asleep duration') ?? val('in bed duration')
  if (asleepMin) out.sleepH = +(asleepMin / 60).toFixed(1)
  return prune(out)
}

// Generic JSON export parser — used for both WHOOP and Garmin Connect JSON
// exports, whose exact schema varies by app version / export tool. Rather
// than hard-coding one schema, we flatten the whole JSON tree and match keys
// by a flexible pattern per field, so most real-world exports fill in
// *something* even if the shape isn't exactly what we tested against. The UI
// always shows exactly which fields were found ("Review, then press Save"),
// so a partial or unusual match is never silently wrong.
// Keys are normalized by stripping separators (_ - space) so "resting_heart_rate",
// "restingHeartRate", and "resting-heart-rate" all become "restingheartrate" and
// match one pattern — separator style varies a lot between export tools.
function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[_\-\s]/g, '')
}
function flattenJson(v: unknown, out: Record<string, number> = {}): Record<string, number> {
  if (v == null) return out
  if (typeof v === 'number' && Number.isFinite(v)) return out // bare numbers have no key context
  if (Array.isArray(v)) { for (const item of v) flattenJson(item, out); return out }
  if (typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'number' && Number.isFinite(val)) {
        out[normalizeKey(k)] = val // last occurrence wins — exports are usually chronological
      } else {
        flattenJson(val, out)
      }
    }
  }
  return out
}
function findKey(flat: Record<string, number>, patterns: RegExp[]): number | undefined {
  for (const [k, v] of Object.entries(flat)) {
    if (patterns.some((p) => p.test(k))) return v
  }
  return undefined
}
export function parseWearableJson(text: string, sourceHint?: 'WHOOP' | 'Garmin'): ImportResult {
  let data: unknown
  try { data = JSON.parse(text) } catch { return {} }
  const flat = flattenJson(data)
  const source = sourceHint
    ?? (/whoop/i.test(text) ? 'WHOOP' : /garmin|connectiq|summaryid|bodybattery/i.test(text) ? 'Garmin' : 'Other')
  const out: ImportResult = { source }
  out.vo2max = findKey(flat, [/vo2max/])
  out.restingHr = round(findKey(flat, [/restingheartrate/, /restinghr/]))
  out.hrvMs = round(findKey(flat, [/hrvrmssd/, /heartratevariability/, /hrvms/, /^hrv$/]))
  out.recoveryPct = round(findKey(flat, [/recoveryscore/, /bodybattery/]))
  out.strain = findKey(flat, [/daystrain/, /^strain$/])
  // Sleep duration units vary a lot by export — check the most specific
  // (unambiguous unit) patterns first so e.g. seconds and minutes never mix up.
  const sleepSec = findKey(flat, [/sleepdurationinseconds/, /totalsleepseconds/, /sleeptimeseconds/])
  const sleepMilli = findKey(flat, [/sleepdurationinmilli/, /sleeptimemilli/, /totalsleepmilli/])
  const sleepMin = findKey(flat, [/asleepduration/, /inbedduration/, /sleepminutes/, /sleepdurationminutes/])
  const sleepHrs = findKey(flat, [/^sleephours?$/, /^sleeph$/])
  if (typeof sleepSec === 'number') out.sleepH = +(sleepSec / 3600).toFixed(1)
  else if (typeof sleepMilli === 'number') out.sleepH = +(sleepMilli / 3600000).toFixed(1)
  else if (typeof sleepMin === 'number') out.sleepH = +(sleepMin / 60).toFixed(1)
  else if (typeof sleepHrs === 'number') out.sleepH = sleepHrs
  out.weightKg = findKey(flat, [/weightkg/, /weightinkilograms/, /^weight$/])
  out.bodyFatPct = pct(findKey(flat, [/bodyfatpercentage/, /bodyfat/]))
  // Body-composition scales (MovingLife and the Xiaomi-class devices behind it)
  // report proportions of body mass that no other source gives us.
  out.bodyWaterPct = findKey(flat, [/bodywaterpercentage/, /^bodywater$/, /totalbodywaterpct/])
  out.proteinPct = findKey(flat, [/proteinpercentage/, /^protein$/])
  out.bonePct = findKey(flat, [/bonepercentage/, /^bone$/])
  out.musclePct = findKey(flat, [/musclepercentage/, /^muscle$/])
  out.subcutaneousFatKg = findKey(flat, [/subcutaneousfat/])
  out.boneMassKg = findKey(flat, [/bonemass/, /bonemineralcontent/])
  out.bodyAge = findKey(flat, [/bodyage/, /metabolicage/])
  out.bmrKcal = out.bmrKcal ?? findKey(flat, [/^bmr$/, /basalmetabolicrate/])
  out.amrKcal = findKey(flat, [/^amr$/, /activemetabolicrate/])
  out.visceralFatIndex = findKey(flat, [/visceralfatindex/, /visceralfatlevel/])
  out.skeletalMuscleKg = findKey(flat, [/skeletalmusclemass/])
  out.leanMassKg = out.leanMassKg ?? findKey(flat, [/leanbodymass/])
  out.bmi = findKey(flat, [/^bmi$/, /bodymassindex/])
  return prune(out)
}


// InBody CSV (H30 and similar). One row per measurement, newest not guaranteed
// first, and unmeasured segments written as a bare "-" rather than left empty.
// Date is a bare timestamp: 20260710091228 = 2026-07-10 09:12:28.
//
// Worth parsing separately rather than through the generic CSV path because
// InBody is the only source here that measures body water and skeletal muscle
// directly instead of estimating them — so when it disagrees with a smart
// scale, InBody is the number to keep.
export function parseInBodyCsv(text: string): ImportResult {
  const lines = text.replace(/^\ufeff/, '').trim().split(/\r?\n/)
  if (lines.length < 2) return {}
  const header = splitCsv(lines[0]).map((h) => h.trim().toLowerCase())

  const rows = lines.slice(1).map(splitCsv).filter((r) => r.some((c) => c.trim() !== ''))
  if (!rows.length) return {}

  const dateIdx = header.findIndex((h) => h.startsWith('date'))
  const stamp = (r: string[]) => {
    const raw = (r[dateIdx] || '').trim()
    return /^\d{8,14}$/.test(raw) ? Number(raw) : 0
  }
  // Newest measurement wins regardless of file order.
  const row = rows.reduce((a, b) => (stamp(b) >= stamp(a) ? b : a))

  const val = (frag: string): number | undefined => {
    const i = header.findIndex((h) => h.includes(frag))
    if (i < 0) return undefined
    const cell = (row[i] || '').trim()
    if (!cell || cell === '-') return undefined // InBody writes "-" for segments it could not measure
    const n = parseFloat(cell.replace(',', '.'))
    return Number.isFinite(n) ? n : undefined
  }

  const out: ImportResult = { source: 'InBody' }
  out.weightKg = val('weight(')
  out.skeletalMuscleKg = val('skeletal muscle mass')
  out.bodyFatPct = val('percent body fat')
  out.bmi = val('bmi')
  out.bmrKcal = val('basal metabolic rate')
  out.bodyWaterL = val('total body water')
  out.visceralFatLevel = val('visceral fat level')
  out.waistHipRatio = val('waist hip ratio')
  // Soft lean mass is the closest InBody column to Apple's lean body mass.
  out.leanMassKg = val('soft lean mass')
  out.boneMassKg = val('bone mineral content')
  const tbw = val('total body water')
  const berat = out.weightKg
  // InBody gives body water in litres; the percentage is what scales report,
  // so derive it rather than leaving the two sources incomparable.
  if (tbw != null && berat != null && berat > 0) out.bodyWaterPct = +((tbw / berat) * 100).toFixed(1)
  const protein = val('protein(kg)')
  if (protein != null && berat != null && berat > 0) out.proteinPct = +((protein / berat) * 100).toFixed(1)
  if (out.skeletalMuscleKg != null && berat != null && berat > 0) {
    out.musclePct = +((out.skeletalMuscleKg / berat) * 100).toFixed(1)
  }

  const ts = (row[dateIdx] || '').trim()
  if (/^\d{14}$/.test(ts)) {
    const iso = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}`
    const t = Date.parse(iso)
    if (!Number.isNaN(t)) out.measuredAt = new Date(t).toISOString()
  }
  return prune(out)
}

// Dispatch by file name / content sniffing.
export function parseHealthFile(name: string, text: string): ImportResult {
  const lower = name.toLowerCase()
  if (lower.endsWith('.xml') || text.includes('<HealthData')) return parseAppleHealth(text)
  if (lower.endsWith('.json') || /^\s*[[{]/.test(text)) {
    // Health Auto Export first — its metric-name-in-a-value shape is invisible
    // to the generic flattener, so trying the generic path first would return
    // an empty result and the file would be reported as unrecognizable.
    const hae = parseHealthAutoExport(text)
    if (Object.keys(hae).filter((k) => k !== 'source').length) return hae
    return parseWearableJson(text)
  }
  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || text.includes(',')) {
    const head = text.slice(0, 2000).toLowerCase()
    // Route by what the header actually contains — filename alone is unreliable
    // because both apps export a plain .csv.
    if (head.includes('skeletal muscle mass') || head.includes('inbody score')) return parseInBodyCsv(text)
    return parseWhoopCsv(text)
  }
  return {}
}

function splitCsv(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (c === ',' && !q) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

function round(n?: number) { return n == null ? undefined : Math.round(n) }
// Apple stores body-fat as a fraction (0.18); normalize to percent.
function pct(n?: number) { return n == null ? undefined : n <= 1 ? +(n * 100).toFixed(1) : +n.toFixed(1) }
function prune(o: ImportResult): ImportResult {
  const out = { ...o }
  ;(Object.keys(out) as (keyof ImportResult)[]).forEach((k) => {
    const v = out[k]
    if (v === undefined || (typeof v === 'number' && (!Number.isFinite(v) || v <= 0))) delete out[k]
  })
  return out
}
