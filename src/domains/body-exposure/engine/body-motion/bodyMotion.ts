// Menerjemahkan keadaan simulator faal seluruh tubuh (lib/bodySim) menjadi GERAK pada tubuh 3D: jantung berdenyut
// mengikuti denyut nadi dan isi sekuncup, paru mengembang mengikuti laju napas dan volume tidal, pembuluh berdenyut
// sesuai curah jantung, ginjal bercahaya sesuai perfusinya.
//
// Ini lapisan penghubung, BUKAN simulator baru. Setiap angka fisiologi berasal dari simulate() (persamaan baku yang
// didokumentasikan di lib/bodySim.ts) dan dari cardiacStateAt() (siklus Wiggers prosedural). Satu-satunya konstanta
// yang ditulis di sini adalah PENGUAT VISUAL (seberapa besar skala mesh berubah di layar); itu keputusan tampilan,
// bukan besaran tubuh, dan tidak pernah ditampilkan sebagai angka.
//
// Kelas kebenaran: 'simulated'. Model keadaan tunak untuk pengajaran arah dan besaran, bukan model pasien.
// Murni & deterministik: waktu disuntikkan pemanggil. Gagal tertutup: masukan atau keluaran tak sah → tanpa gerak.

import { NORMAL, SKENARIO, simulate, type SimInput, type SimOutput } from '../../../../lib/bodySim.ts'
import { DEFAULT_PARAMS, HR_MAX, HR_MIN, cardiacStateAt, phaseDurations, type CardiacPhase } from '../cardiacCycle.ts'

/** Penguat visual (tampilan saja). Jantung & paru: perubahan skala maksimum relatif ukuran atlas. */
const HEART_VISUAL_GAIN = 0.08
const LUNG_VISUAL_GAIN = 0.06
/** Batas rasio terhadap keadaan istirahat agar mesh tidak "meledak"; hanya membatasi tampilan, angka tetap apa adanya. */
const VISUAL_RATIO_CAP = 3
/** Inspirasi : ekspirasi 1 : 2 pada napas tenang (konvensi buku teks fisiologi pernapasan). */
const INSPIRATION_FRACTION = 1 / 3

export interface BodyMotionReadout {
  readonly cardiacOutputLMin: number
  readonly mapMmHg: number
  readonly sao2Pct: number
  readonly urineMlPerHour: number
}

export interface BodyMotionPlan {
  readonly ok: true
  readonly truthClass: 'simulated'
  readonly scenarioKey: string
  readonly heartRateBpm: number
  readonly respRatePerMin: number
  readonly tidalVolumeMl: number
  readonly strokeVolumeMl: number
  readonly readout: BodyMotionReadout
  /** Rasio terhadap keadaan "Healthy at rest" dari model yang sama (1 = istirahat). */
  readonly relative: { readonly cardiacOutput: number; readonly ventilation: number; readonly renalPerfusion: number }
}

export type BodyMotionResult = BodyMotionPlan | { readonly ok: false; readonly reason: string }

export interface BodyMotionFrame {
  readonly cardiacPhase: CardiacPhase
  /** Skala isotropik mesh jantung (1 = ukuran atlas). */
  readonly heartScale: number
  /** Skala isotropik mesh paru (1 = ukuran atlas, akhir ekspirasi). */
  readonly lungScale: number
  /** 0..1 posisi dalam satu napas, 0 = awal inspirasi. */
  readonly breath01: number
  /** 0..1 intensitas denyut pada pembuluh, puncak saat ejeksi, diskalakan curah jantung relatif. */
  readonly vesselPulse: number
  /** 0..1 intensitas cahaya ginjal dari perfusi ginjal relatif. */
  readonly renalGlow: number
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const cap = (x: number) => Math.min(Math.max(x, 0), VISUAL_RATIO_CAP)

function validateInput(inp: SimInput): string | null {
  if (!inp || typeof inp !== 'object') return 'simulation input is missing'
  for (const [k, v] of Object.entries(NORMAL)) {
    const value = (inp as unknown as Record<string, unknown>)[k]
    if (!finite(value)) return `${k} must be a finite number`
    if (typeof v === 'number' && value < 0) return `${k} cannot be negative`
  }
  if (inp.heartRate < HR_MIN || inp.heartRate > HR_MAX) return `heart rate must be ${HR_MIN}-${HR_MAX} bpm`
  if (inp.respRate <= 0) return 'respiratory rate must be above 0'
  if (inp.tidalVolume <= 0) return 'tidal volume must be above 0'
  return null
}

const READOUT_KEYS = ['strokeVolume', 'cardiacOutput', 'map', 'sao2', 'urineOutput', 'renalPerfusion'] as const
function validOutput(out: SimOutput): boolean {
  return READOUT_KEYS.every((k) => finite(out[k]) && out[k] >= 0) && out.strokeVolume > 0 && out.cardiacOutput > 0
}

let restCache: SimOutput | null = null
function restOutput(): SimOutput {
  if (!restCache) restCache = simulate(NORMAL)
  return restCache
}

export function planBodyMotion(input: SimInput, scenarioKey: string): BodyMotionResult {
  const err = validateInput(input)
  if (err) return { ok: false, reason: err }
  const out = simulate(input)
  if (!validOutput(out)) return { ok: false, reason: 'simulation produced no valid circulation for this state' }
  const rest = restOutput()
  return {
    ok: true,
    truthClass: 'simulated',
    scenarioKey,
    heartRateBpm: input.heartRate,
    respRatePerMin: input.respRate,
    tidalVolumeMl: input.tidalVolume,
    strokeVolumeMl: out.strokeVolume,
    readout: { cardiacOutputLMin: out.cardiacOutput, mapMmHg: out.map, sao2Pct: out.sao2, urineMlPerHour: out.urineOutput },
    relative: {
      cardiacOutput: out.cardiacOutput / rest.cardiacOutput,
      ventilation: (input.respRate * input.tidalVolume) / (NORMAL.respRate * NORMAL.tidalVolume),
      renalPerfusion: out.renalPerfusion / rest.renalPerfusion,
    },
  }
}

/** Skenario bawaan simulator (Healthy at rest, Hard exercise, Haemorrhage, …). Kunci tak dikenal → gagal tertutup. */
export function planScenarioMotion(scenarioKey: string): BodyMotionResult {
  const s = SKENARIO.find((x) => x.key === scenarioKey)
  if (!s) return { ok: false, reason: `unknown scenario: ${String(scenarioKey)}` }
  return planBodyMotion(s.input, s.key)
}

export const MOTION_SCENARIOS: readonly { readonly key: string; readonly label: string }[] =
  SKENARIO.map((s) => ({ key: s.key, label: s.label }))

/** Satu bingkai gerak pada waktu timeS (detik). Waktu tak sah → null (pemanggil menampilkan tubuh diam). */
export function bodyMotionFrame(plan: BodyMotionPlan, timeS: number): BodyMotionFrame | null {
  if (!finite(timeS)) return null
  // Isi sekuncup dari simulator; volume akhir sistol tetap pada nilai bawaan siklus prosedural.
  const esv = DEFAULT_PARAMS.esvMl
  const heart = cardiacStateAt({ ...DEFAULT_PARAMS, hrBpm: plan.heartRateBpm, esvMl: esv, edvMl: esv + plan.strokeVolumeMl }, timeS)
  const restEdv = esv + restOutput().strokeVolume
  // Skala jantung: ukuran ruang terhadap ukuran istirahat akhir-diastol, dibatasi agar tetap terbaca.
  const heartScale = 1 + HEART_VISUAL_GAIN * (Math.cbrt(Math.min(heart.ventricleMl / restEdv, VISUAL_RATIO_CAP)) - 1)

  const breathPeriod = 60 / plan.respRatePerMin
  const breath01 = (((timeS % breathPeriod) + breathPeriod) % breathPeriod) / breathPeriod
  const inflate = breath01 < INSPIRATION_FRACTION
    ? 0.5 - 0.5 * Math.cos(Math.PI * (breath01 / INSPIRATION_FRACTION))
    : 0.5 + 0.5 * Math.cos(Math.PI * ((breath01 - INSPIRATION_FRACTION) / (1 - INSPIRATION_FRACTION)))
  const tidalRatio = cap(plan.tidalVolumeMl / NORMAL.tidalVolume)
  const lungScale = 1 + LUNG_VISUAL_GAIN * inflate * (tidalRatio / VISUAL_RATIO_CAP)

  // Denyut pembuluh: setengah gelombang sinus selama fase ejeksi, tingginya sebanding curah jantung relatif.
  const dur = phaseDurations(plan.heartRateBpm)
  const tInBeat = heart.cycle01 * (60 / plan.heartRateBpm)
  const ejection01 = (tInBeat - dur.isovolumic_contraction) / dur.ejection
  const ejecting = heart.phase === 'ejection' ? Math.sin(Math.PI * Math.min(Math.max(ejection01, 0), 1)) : 0
  const vesselPulse = ejecting * (cap(plan.relative.cardiacOutput) / VISUAL_RATIO_CAP)
  const renalGlow = cap(plan.relative.renalPerfusion) / VISUAL_RATIO_CAP

  return { cardiacPhase: heart.phase, heartScale, lungScale, breath01, vesselPulse, renalGlow }
}
