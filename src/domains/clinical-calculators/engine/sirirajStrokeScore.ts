/**
 * Skor stroke Siriraj (Poungvarin et al., BMJ 1991;302:1565-7): 2.5 × kesadaran + 2 × muntah + 2 × nyeri kepala
 * + 0.1 × TD diastolik − 3 × penanda ateroma − 12. Ekspresi, ambang (> +1 hemoragik, < −1 iskemik, di antaranya
 * tidak tentu) dan label dipindahkan dari halaman tanpa perubahan; yang baru hanya penolakan masukan. Halaman lama
 * membaca TD diastolik kosong sebagai 0 (Number(...) || 0), sehingga skor bergeser −9 poin dan condong "iskemik".
 * Bukan pengganti CT scan; tampilan pendukung keputusan.
 */
import { DIASTOLIC_MMHG } from './meanArterialPressure'
import { inRange } from './inputs'

export type SirirajTone = 'critical' | 'low' | 'high'
export type SirirajResult =
  | { ok: true; data: { score: number; rounded: number; diastolicMmHg: number; label: string; tone: SirirajTone } }
  | { ok: false; reason: string }

export interface SirirajInput {
  /** 0 sadar, 1 mengantuk/stupor, 2 semikoma/koma */
  readonly consciousness: number
  readonly vomiting: number
  readonly headache: number
  readonly diastolicMmHg: number
  /** DM, angina atau klaudikasio intermiten: salah satu dihitung */
  readonly atheroma: number
}

const oneOf = (x: unknown, allowed: readonly number[]): x is number => typeof x === 'number' && allowed.includes(x)

export function sirirajStrokeScore(input: SirirajInput): SirirajResult {
  const { consciousness, vomiting, headache, diastolicMmHg, atheroma } = input ?? ({} as SirirajInput)
  if (!oneOf(consciousness, [0, 1, 2])) return { ok: false, reason: 'Consciousness must be alert (0), drowsy/stupor (1) or semicoma/coma (2)' }
  if (!oneOf(vomiting, [0, 1])) return { ok: false, reason: 'Vomiting must be no (0) or yes (1)' }
  if (!oneOf(headache, [0, 1])) return { ok: false, reason: 'Headache must be no (0) or yes (1)' }
  if (!inRange(diastolicMmHg, DIASTOLIC_MMHG.min, DIASTOLIC_MMHG.max)) return { ok: false, reason: `Diastolic pressure must be ${DIASTOLIC_MMHG.min}–${DIASTOLIC_MMHG.max} mmHg` }
  if (!oneOf(atheroma, [0, 1])) return { ok: false, reason: 'Atheroma markers must be none (0) or one or more (1)' }
  const score = 2.5 * consciousness + 2 * vomiting + 2 * headache + 0.1 * diastolicMmHg - 3 * atheroma - 12
  const rounded = Math.round(score * 100) / 100
  const verdict: { label: string; tone: SirirajTone } =
    score > 1 ? { label: 'Suggests HAEMORRHAGIC stroke', tone: 'critical' }
    : score < -1 ? { label: 'Suggests ISCHAEMIC stroke', tone: 'low' }
    : { label: 'Indeterminate — imaging required', tone: 'high' }
  return { ok: true, data: { score, rounded, diastolicMmHg, ...verdict } }
}
