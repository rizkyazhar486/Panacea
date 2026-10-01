// Satu keadaan longitudinal untuk akun yang sedang masuk.
//
// Angka dan catatan tetap milik penyimpanan yang sudah ada (lab log, care,
// clinical, health profile). Modul ini tidak menafsirkan nilai, tidak menghitung
// usia biologis, dan tidak menerima daftar peristiwa dari klien. Revisi berubah
// hanya bila pemilik atau isi salah satu jalur berubah.
import { createHash } from 'node:crypto'
import type { LogLab } from './labLog.js'
import { KATALOG } from './healthMetrics.js'
import { bacaSelfVitalsLog, bacaVo2maxLog, bacaDiarySleep, bacaDiaryFoods, bacaDiaryWellness, bacaDiaryDihapus } from './catatanKesehatanDiri.js'

const KUNCI_METRIK = new Set<string>([...KATALOG.map((d) => d.kunci), 'sleepH'])
const MAKS_RIWAYAT = 90

export interface JalurLabLongitudinal {
  diperbaruiPada: string | null
  truthClass: 'patient-recorded'
  source: 'lab-log'
  method: 'patient-transcribed-lab-report'
  log: LogLab
}

export interface JalurCareLongitudinal {
  truthClass: 'server-stored'
  source: 'care-plans'
  plans: { plan: unknown; reports: unknown[] }[]
  reviews: unknown[]
}

export interface JalurKlinisLongitudinal {
  truthClass: 'server-stored'
  source: 'clinical'
  records: Record<string, unknown>
  vitals: Record<string, unknown[]>
  encounters: Record<string, unknown[]>
}

export interface CatatanSelfVitalServer {
  id: string
  at: string
  systolic: number
  diastolic: number
  heartRate: number
  spo2: number
  tempC: number
}

export interface CatatanVo2Server {
  id: string
  at: string
  value: number
  method: string
}

export interface JalurPerangkatLongitudinal {
  truthClass: 'patient-recorded'
  source: 'health-profile'
  method: 'device-sync' | 'manual-or-import'
  updatedAt: string | null
  lastDeviceSyncAt: string | null
  deviceSyncSource: string | null
  /** Hanya kunci metrik yang dikenal; bukan seluruh objek profil. */
  current: Record<string, number>
  history: { date: string; metrics: Record<string, number> }[]
  /** Hanya baris dengan kelima angka self-vital lengkap — tidak diisi nol. */
  selfVitals: CatatanSelfVitalServer[]
  /** VO₂max tersimpan dengan cap waktu; tanpa angka atau tanpa waktu = kosong. */
  vo2maxLog: CatatanVo2Server[]
}

export interface KeadaanLongitudinal {
  subjectId: string
  revision: string
  generatedAt: string
  lab: JalurLabLongitudinal
  care: JalurCareLongitudinal
  /** Hanya untuk peran pasien (rekam diri). Klinisi memakai /api/clinical. */
  clinical: JalurKlinisLongitudinal | null
  device: JalurPerangkatLongitudinal
  diary: {
    truthClass: 'patient-recorded'
    source: 'health-profile'
    sleep: ReturnType<typeof bacaDiarySleep>
    foods: ReturnType<typeof bacaDiaryFoods>
    wellness: ReturnType<typeof bacaDiaryWellness>
    removed: { foods: string[]; sleep: string[] }
  }
}

/** @deprecated Prefer susunKeadaanLongitudinal; kept for the lab-only tests. */
export interface KeadaanLongitudinalLab {
  subjectId: string
  revision: string
  generatedAt: string
  diperbaruiPada: string | null
  truthClass: 'patient-recorded'
  source: 'lab-log'
  method: 'patient-transcribed-lab-report'
  log: LogLab
}

function angkaDikenal(masukan: Record<string, unknown> | undefined): Record<string, number> {
  const keluar: Record<string, number> = {}
  if (!masukan) return keluar
  for (const [k, v] of Object.entries(masukan)) {
    if (!KUNCI_METRIK.has(k)) continue
    if (typeof v === 'number' && Number.isFinite(v)) keluar[k] = v
  }
  return keluar
}

function angkaPositif(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
}

/** Self-vital hanya bila kelima angka ada. restingHr/spo2Pct/bodyTempC = alias kunci katalog. */
export function turunkanSelfVital(metrics: Record<string, number>, at: string, id: string): CatatanSelfVitalServer | null {
  if (!Number.isFinite(Date.parse(at))) return null
  const systolic = angkaPositif(metrics.systolic)
  const diastolic = angkaPositif(metrics.diastolic)
  const heartRate = angkaPositif(metrics.heartRate) ?? angkaPositif(metrics.restingHr)
  const spo2 = angkaPositif(metrics.spo2) ?? angkaPositif(metrics.spo2Pct)
  const tempC = angkaPositif(metrics.tempC) ?? angkaPositif(metrics.bodyTempC)
  if (systolic == null || diastolic == null || heartRate == null || spo2 == null || tempC == null) return null
  return { id, at, systolic, diastolic, heartRate, spo2, tempC }
}

export function turunkanVo2(metrics: Record<string, number>, at: string | null, method: string, id: string): CatatanVo2Server | null {
  if (!at || !Number.isFinite(Date.parse(at))) return null
  const value = angkaPositif(metrics.vo2max)
  if (value == null) return null
  return { id, at, value, method: method.slice(0, 80) || 'Health profile' }
}

/** Ambil gambar perangkat dari profil kesehatan tersimpan; kunci asing dibuang. */
export function pilihProfilPerangkat(profil: Record<string, unknown> | undefined | null): Omit<JalurPerangkatLongitudinal, 'truthClass' | 'source'> {
  const p = profil && typeof profil === 'object' && !Array.isArray(profil) ? profil : {}
  const syncAt = typeof p.lastDeviceSyncAt === 'string' && Number.isFinite(Date.parse(p.lastDeviceSyncAt)) ? p.lastDeviceSyncAt : null
  const updatedAt = typeof p.updatedAt === 'string' && Number.isFinite(Date.parse(p.updatedAt)) ? p.updatedAt : null
  const deviceSyncSource = typeof p.deviceSyncSource === 'string' && p.deviceSyncSource.trim() ? p.deviceSyncSource.trim().slice(0, 64) : null
  const history: { date: string; metrics: Record<string, number> }[] = []
  if (Array.isArray(p.history)) {
    for (const baris of p.history) {
      if (!baris || typeof baris !== 'object' || Array.isArray(baris)) continue
      const row = baris as Record<string, unknown>
      if (typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) continue
      history.push({ date: row.date, metrics: angkaDikenal(row) })
    }
  }
  history.sort((a, b) => a.date.localeCompare(b.date))
  const current = angkaDikenal(p as Record<string, unknown>)
  const methodLabel = deviceSyncSource || (syncAt ? 'Device sync' : 'Health profile')
  const waktuUtama = syncAt || updatedAt
  const selfVitals: CatatanSelfVitalServer[] = []
  for (const h of history) {
    const row = turunkanSelfVital(h.metrics, `${h.date}T12:00:00.000Z`, `health-profile:${h.date}`)
    if (row) selfVitals.push(row)
  }
  const currentSelf = waktuUtama ? turunkanSelfVital(current, waktuUtama, 'health-profile:current') : null
  if (currentSelf && !selfVitals.some((s) => s.id === currentSelf.id)) selfVitals.push(currentSelf)

  const vo2maxLog: CatatanVo2Server[] = []
  for (const h of history) {
    const row = turunkanVo2(h.metrics, `${h.date}T12:00:00.000Z`, methodLabel, `health-profile-vo2:${h.date}`)
    if (row) vo2maxLog.push(row)
  }
  const currentVo2 = turunkanVo2(current, waktuUtama, methodLabel, 'health-profile-vo2:current')
  if (currentVo2 && !vo2maxLog.some((v) => v.id === currentVo2.id)) vo2maxLog.push(currentVo2)

  // Explicit AppState syncs win over metric-derived rows with the same id.
  for (const row of bacaSelfVitalsLog(p as Record<string, unknown>)) {
    const i = selfVitals.findIndex((s) => s.id === row.id)
    if (i >= 0) selfVitals[i] = row
    else selfVitals.push(row)
  }
  for (const row of bacaVo2maxLog(p as Record<string, unknown>)) {
    const i = vo2maxLog.findIndex((s) => s.id === row.id)
    if (i >= 0) vo2maxLog[i] = row
    else vo2maxLog.push(row)
  }
  selfVitals.sort((a, b) => b.at.localeCompare(a.at))
  vo2maxLog.sort((a, b) => b.at.localeCompare(a.at))

  return {
    method: syncAt ? 'device-sync' : 'manual-or-import',
    updatedAt,
    lastDeviceSyncAt: syncAt,
    deviceSyncSource,
    current,
    history: history.slice(-MAKS_RIWAYAT),
    selfVitals: selfVitals.slice(0, 50),
    vo2maxLog: vo2maxLog.slice(0, 50),
  }
}

export function keadaanLongitudinalLab(
  subjectId: string,
  log: LogLab | undefined,
  generatedAt: string,
  diperbaruiPada: string | null,
): KeadaanLongitudinalLab {
  const penuh = susunKeadaanLongitudinal({
    subjectId,
    generatedAt,
    lab: { log, diperbaruiPada },
    care: { plans: [], reviews: [] },
    clinical: null,
    device: null,
  })
  return {
    subjectId: penuh.subjectId,
    revision: penuh.revision,
    generatedAt: penuh.generatedAt,
    diperbaruiPada: penuh.lab.diperbaruiPada,
    truthClass: penuh.lab.truthClass,
    source: penuh.lab.source,
    method: penuh.lab.method,
    log: penuh.lab.log,
  }
}

export function susunKeadaanLongitudinal(input: {
  subjectId: string
  generatedAt: string
  lab: { log?: LogLab; diperbaruiPada: string | null }
  care: { plans: { plan: unknown; reports: unknown[] }[]; reviews: unknown[] }
  clinical: { records: Record<string, unknown>; vitals: Record<string, unknown[]>; encounters: Record<string, unknown[]> } | null
  device?: Record<string, unknown> | null
}): KeadaanLongitudinal {
  const lab: JalurLabLongitudinal = {
    diperbaruiPada: input.lab.diperbaruiPada,
    truthClass: 'patient-recorded',
    source: 'lab-log',
    method: 'patient-transcribed-lab-report',
    log: input.lab.log ?? {},
  }
  const care: JalurCareLongitudinal = {
    truthClass: 'server-stored',
    source: 'care-plans',
    plans: input.care.plans,
    reviews: input.care.reviews,
  }
  const clinical: JalurKlinisLongitudinal | null = input.clinical
    ? {
        truthClass: 'server-stored',
        source: 'clinical',
        records: input.clinical.records,
        vitals: input.clinical.vitals,
        encounters: input.clinical.encounters,
      }
    : null
  const dipilih = pilihProfilPerangkat(input.device)
  const device: JalurPerangkatLongitudinal = {
    truthClass: 'patient-recorded',
    source: 'health-profile',
    ...dipilih,
  }
  const diary = {
    truthClass: 'patient-recorded' as const,
    source: 'health-profile' as const,
    sleep: bacaDiarySleep(input.device as Record<string, unknown> | null),
    foods: bacaDiaryFoods(input.device as Record<string, unknown> | null),
    wellness: bacaDiaryWellness(input.device as Record<string, unknown> | null),
    removed: bacaDiaryDihapus(input.device as Record<string, unknown> | null),
  }
  const isi = JSON.stringify({
    lab: lab.log,
    care: { plans: care.plans, reviews: care.reviews },
    clinical,
    device: {
      current: device.current,
      history: device.history,
      updatedAt: device.updatedAt,
      lastDeviceSyncAt: device.lastDeviceSyncAt,
      selfVitals: device.selfVitals,
      vo2maxLog: device.vo2maxLog,
    },
    diary,
  })
  const revision = createHash('sha256').update(`${input.subjectId}\n${isi}`).digest('hex').slice(0, 16)
  return { subjectId: input.subjectId, revision, generatedAt: input.generatedAt, lab, care, clinical, device, diary }
}
