/**
 * Pra-skrining kelayakan donor darah (kriteria generik layanan darah nasional/WHO/PMI): usia, berat, jeda sejak donor terakhir
 * (12 minggu), dan penanda penundaan. Ambang dan teks alasan dipindahkan dari halaman tanpa perubahan; ini BUKAN skrining di tempat
 * (hemoglobin dan wawancara kesehatan oleh bank darah tetap berlaku). Yang baru: usia dan berat diperiksa rentangnya dan "belum
 * diisi" dipisahkan dari "di luar rentang". Dulu halaman terbuka dengan usia 30 dan berat 60 kg bawaan dan langsung menampilkan
 * "Likely eligible", dan usia kosong terbaca 0 sehingga dinyatakan "Below the typical minimum donation age". Tanggal donor terakhir
 * divalidasi (format, tidak di masa depan); waktu sekarang disuntikkan. Rentang = batas kewajaran masukan, BUKAN ambang klinis.
 */
import { inRange } from './inputs'

export const DONATION_INTERVAL_WEEKS = 12
export const DONATION_RANGES = {
  age: { min: 5, max: 120, name: 'age', unit: ' years' },
  weightKg: { min: 20, max: 250, name: 'weight', unit: ' kg' },
} as const

const DAY_MS = 86_400_000

export type DonationInput = Readonly<{
  age: number
  weightKg: number
  /** 'YYYY-MM-DD'; kosong = belum pernah/tidak berlaku. */
  lastDonation: string
  /** Waktu sekarang (ISO 8601), disuntikkan. */
  now: string
  pregnant: boolean
  recentIllness: boolean
  recentTattoo: boolean
  chronicCondition: boolean
}>
export type DonationResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  likelyEligible: boolean | null
  blockers: readonly string[]
  nextEligibleDate: string | null
  daysUntilEligible: number | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function bloodDonationScreen(input: DonationInput): DonationResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<'age' | 'weightKg', number>> = {}
  for (const k of ['age', 'weightKg'] as const) {
    const { min, max, name, unit } = DONATION_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  const nowMs = typeof input.now === 'string' ? Date.parse(input.now) : Number.NaN
  if (!Number.isFinite(nowMs)) invalid.push('current time is invalid')
  let nextMs: number | null = null
  if (typeof input.lastDonation !== 'string') invalid.push('last donation date must be text')
  else if (input.lastDonation !== '') {
    // Bolak-balik: Date.parse('2026-02-30') tidak gagal tetapi bergeser ke 2 Maret, jadi tanggal kalender mustahil harus ditolak.
    const parsed = Date.parse(input.lastDonation)
    const t = Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === input.lastDonation ? parsed : Number.NaN
    if (!Number.isFinite(t)) invalid.push('last donation date must be a valid YYYY-MM-DD date')
    else if (Number.isFinite(nowMs) && t > nowMs) invalid.push('last donation date cannot be in the future')
    else nextMs = t + DONATION_INTERVAL_WEEKS * 7 * DAY_MS
  }
  for (const k of ['pregnant', 'recentIllness', 'recentTattoo', 'chronicCondition'] as const) if (typeof input[k] !== 'boolean') invalid.push(`${k} must be yes or no`)
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, likelyEligible: null, blockers: [], nextEligibleDate: null, daysUntilEligible: null }

  const age = ok.age as number
  const weightKg = ok.weightKg as number
  // `+ 0` normaliza -0 (Math.ceil(-0.5)) menjadi 0.
  const daysUntilEligible = nextMs === null ? 0 : Math.ceil((nextMs - nowMs) / DAY_MS) + 0
  const intervalOk = nextMs === null || daysUntilEligible <= 0
  const blockers: string[] = []
  if (age < 17) blockers.push('Below the typical minimum donation age (17).')
  if (age > 65) blockers.push('Above the typical routine maximum age (65) — some blood banks still accept regular repeat donors older than this with a doctor\'s clearance.')
  if (weightKg < 50) blockers.push('Below the typical minimum weight (50 kg).')
  if (!intervalOk) blockers.push(`Too soon since your last donation — typically ${DONATION_INTERVAL_WEEKS} weeks are required between whole-blood donations.`)
  if (input.pregnant) blockers.push('Currently pregnant or recently gave birth — donation is deferred during and for some months after pregnancy.')
  if (input.recentIllness) blockers.push('Currently feeling unwell, feverish, or on antibiotics — wait until fully recovered.')
  if (input.recentTattoo) blockers.push('Recent tattoo, piercing, or acupuncture (commonly a 3-6 month deferral, depending on local rules and whether it was done at a licensed/sterile facility).')
  if (input.chronicCondition) blockers.push('An uncontrolled chronic condition or one your clinician hasn\'t cleared you for — check with them first.')
  return {
    missing, invalid, likelyEligible: blockers.length === 0, blockers,
    nextEligibleDate: nextMs === null ? null : new Date(nextMs).toISOString().slice(0, 10),
    daysUntilEligible: nextMs === null ? null : daysUntilEligible,
  }
}
