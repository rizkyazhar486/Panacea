// Skenario what-if untuk rantai jantung -> tekanan arteri rata-rata -> tekanan perfusi serebral.
// Murni: tanpa DOM/jaringan. Semua masukan kosong sampai diisi; tidak ada nilai bawaan, rentang normal, atau status klinis.
import { curahJantung, isiSekuncup } from '../../../lib/hemodinamik'
import { deriveCerebralPerfusionPressure } from '../../../lib/physiology/cerebralPerfusionCoupling'
import { deriveMeanArterialPressure } from '../../../lib/physiology/pressureFlowCoupling'

/** Kolom kosong atau spasi menjadi NaN (bukan 0), sehingga "belum diisi" tidak pernah terbaca sebagai nilai sah. */
function parseNumberField(text: string): number {
  return text.trim() === '' ? Number.NaN : Number(text)
}

export type ScenarioFieldId = 'hr' | 'edv' | 'esv' | 'svr' | 'cvp' | 'icp'
export type ScenarioText = Record<ScenarioFieldId, string>

export const EMPTY_SCENARIO: ScenarioText = { hr: '', edv: '', esv: '', svr: '', cvp: '', icp: '' }

export interface PerfusionScenarioResult {
  strokeVolumeMl: number
  cardiacOutputLMin: number
  meanArterialPressureMmHg: number
  cerebralPerfusionPressureMmHg: number
  /** Selisih tekanan positif = ada gradien dari arteri ke intrakranial; bukan aliran darah serebral. */
  gradient: 'arterial-to-intracranial' | 'non-positive'
}

export type PerfusionScenario =
  | { status: 'incomplete'; missing: ScenarioFieldId[] }
  | { status: 'invalid'; reason: string }
  | { status: 'ok'; result: PerfusionScenarioResult }

const ORDER: readonly ScenarioFieldId[] = ['hr', 'edv', 'esv', 'svr', 'cvp', 'icp']

export const SCENARIO_LABEL: Record<ScenarioFieldId, { label: string; unit: string }> = {
  hr: { label: 'Heart rate', unit: 'bpm' },
  edv: { label: 'End-diastolic volume', unit: 'mL' },
  esv: { label: 'End-systolic volume', unit: 'mL' },
  svr: { label: 'Systemic vascular resistance', unit: 'dyn·s/cm⁵' },
  cvp: { label: 'Central venous pressure', unit: 'mmHg' },
  icp: { label: 'Intracranial pressure', unit: 'mmHg' },
}

export function evaluatePerfusionScenario(text: ScenarioText): PerfusionScenario {
  const values = {} as Record<ScenarioFieldId, number>
  const missing: ScenarioFieldId[] = []
  for (const id of ORDER) {
    const raw = text[id]
    if (typeof raw !== 'string' || raw.trim() === '') { missing.push(id); continue }
    const value = parseNumberField(raw)
    if (!Number.isFinite(value)) return { status: 'invalid', reason: `${SCENARIO_LABEL[id].label} is not a valid number.` }
    values[id] = value
  }
  if (missing.length) return { status: 'incomplete', missing }

  const { hr, edv, esv, svr, cvp, icp } = values
  if (!(hr > 0)) return { status: 'invalid', reason: 'Heart rate must be greater than 0.' }
  if (!(edv > 0)) return { status: 'invalid', reason: 'End-diastolic volume must be greater than 0.' }
  if (esv < 0 || esv > edv) return { status: 'invalid', reason: 'End-systolic volume must be between 0 and the end-diastolic volume.' }
  if (!(svr > 0)) return { status: 'invalid', reason: 'Systemic vascular resistance must be greater than 0.' }
  if (icp < 0) return { status: 'invalid', reason: 'Intracranial pressure cannot be negative.' }

  try {
    const strokeVolumeMl = isiSekuncup(edv, esv)
    const cardiacOutputLMin = curahJantung(hr, strokeVolumeMl)
    const meanArterialPressureMmHg = deriveMeanArterialPressure(cardiacOutputLMin, svr, cvp)
    const cerebral = deriveCerebralPerfusionPressure({ meanArterialPressureMmHg, intracranialPressureMmHg: icp })
    return {
      status: 'ok',
      result: {
        strokeVolumeMl,
        cardiacOutputLMin,
        meanArterialPressureMmHg,
        cerebralPerfusionPressureMmHg: cerebral.cerebralPerfusionPressureMmHg,
        gradient: cerebral.pressureGradientDirection,
      },
    }
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'These values cannot be combined.' }
  }
}

/** Skala sumbu tampilan saja (bukan rentang acuan): menjaga panjang batang tetap terbatas. */
export const DISPLAY_SCALE = { cardiacOutputLMin: 15, pressureMmHg: 200 } as const

export function barFraction(value: number, scaleMax: number): number {
  if (!Number.isFinite(value) || !(scaleMax > 0)) return 0
  return Math.min(1, Math.max(0, value / scaleMax))
}
