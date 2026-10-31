/**
 * BX-2 — peta teritori vaskular koroner pada model miokardium AHA 17 segmen (rujukan populasi, BUKAN anatomi pasien).
 *
 * SUMBER (teks penuh dibaca 2026-10-31): Malkasian dkk., Eur Radiol 2020, PMID 32072257 / PMC7416454, bagian Methods, menyatakan bahwa
 * pada model AHA 17 segmen "segmen 1, 2, 5, 6, 7, 8, 11, 12, 13, 14, dan 17" membentuk teritori LCA dan "segmen 3, 4, 9, 10, dan 15"
 * teritori RCA, mengacu pada Cerqueira dkk., Circulation 2002, PMID 11815441 (makalah asli: tanpa abstrak dan teks penuh tertutup, TIDAK
 * dibaca). Segmen 16 tidak tercantum pada daftar sumber itu, jadi di sini TIDAK ditetapkan.
 * Sumber yang sama menyatakan model AHA: dihitung dari rata-rata anatomi 102 subjek sehat; salah menetapkan teritori pada sirkulasi
 * dominan-kanan vs dominan-kiri dan pada ramus intermedius; melebih-lebihkan teritori RCA; validasi pembandingnya pada babi, bukan manusia.
 * Pemisahan LAD vs LCx per segmen TIDAK ada pada teks itu, sehingga TIDAK disediakan di sini (tidak diisi dari ingatan).
 */
export type CoronaryTrunk = 'LCA' | 'RCA'
export type Dominance = 'right' | 'left' | 'codominant' | 'unknown'

export const AHA17_SEGMENT_COUNT = 17
export const AHA17_SOURCE = Object.freeze({
  pmid: '32072257', pmcid: 'PMC7416454', originalPmid: '11815441', verifiedFrom: 'full-text-secondary-source' as const,
  originalVerified: false as const, referenceStandardSpecies: 'swine' as const,
})
const LCA_SEGMENTS: readonly number[] = Object.freeze([1, 2, 5, 6, 7, 8, 11, 12, 13, 14, 17])
const RCA_SEGMENTS: readonly number[] = Object.freeze([3, 4, 9, 10, 15])

export const AHA17_LIMITATIONS: readonly string[] = Object.freeze([
  "Population-average reference territories (102 healthy subjects); not the patient's coronary anatomy.",
  'The model misassigns territories in right- vs left-dominant circulations and with a ramus intermedius, and over-estimates the RCA territory (PMC7416454).',
  'Branch level (LAD vs LCx) is not available from the verified source and is not shown.',
  'The comparison study used a swine reference standard; human validation was not part of it.',
  'Educational projection on an atlas; not a basis for diagnosis or procedural targeting.',
])

export type TerritoryResult =
  | { ok: true; trunk: CoronaryTrunk; segments: readonly number[]; dominance: Dominance; dominanceAdjusted: false; variantTablesAvailable: false; truthClass: 'reference'; label: 'Atlas reference — not patient-specific'; source: typeof AHA17_SOURCE; limitations: readonly string[] }
  | { ok: false; reason: 'invalid-artery' | 'invalid-dominance' | 'branch-level-not-verified'; detail: string }

const DOMINANCE: readonly string[] = ['right', 'left', 'codominant', 'unknown']

/** Segmen AHA yang dipetakan ke satu batang koroner. Dominansi tidak mengubah tabel (tidak ada tabel varian terverifikasi) dan dilaporkan apa adanya. */
export function territoryForArtery(artery: unknown, dominance: unknown = 'unknown'): TerritoryResult {
  if (typeof dominance !== 'string' || !DOMINANCE.includes(dominance)) return { ok: false, reason: 'invalid-dominance', detail: 'Dominance must be right, left, codominant or unknown.' }
  if (artery === 'LAD' || artery === 'LCx') return { ok: false, reason: 'branch-level-not-verified', detail: 'The verified source assigns segments to LCA and RCA only; the LAD/LCx split is not available and is not filled in.' }
  if (artery !== 'LCA' && artery !== 'RCA') return { ok: false, reason: 'invalid-artery', detail: 'Artery must be LCA or RCA.' }
  return { ok: true, trunk: artery, segments: artery === 'LCA' ? LCA_SEGMENTS : RCA_SEGMENTS, dominance: dominance as Dominance, dominanceAdjusted: false, variantTablesAvailable: false, truthClass: 'reference', label: 'Atlas reference — not patient-specific', source: AHA17_SOURCE, limitations: AHA17_LIMITATIONS }
}

export type SegmentResult =
  | { ok: true; segment: number; trunk: CoronaryTrunk | null; assignedBySource: boolean; truthClass: 'reference'; limitations: readonly string[] }
  | { ok: false; reason: 'invalid-segment'; detail: string }

/** Kebalikannya. Segmen 16 mengembalikan trunk null dan assignedBySource=false: sumber tidak menetapkannya, mesin tidak menebak. */
export function trunkForSegment(segment: unknown): SegmentResult {
  if (typeof segment !== 'number' || !Number.isInteger(segment) || segment < 1 || segment > AHA17_SEGMENT_COUNT) return { ok: false, reason: 'invalid-segment', detail: 'Segment must be an integer from 1 to 17.' }
  const trunk = LCA_SEGMENTS.includes(segment) ? 'LCA' : RCA_SEGMENTS.includes(segment) ? 'RCA' : null
  return { ok: true, segment, trunk, assignedBySource: trunk !== null, truthClass: 'reference', limitations: AHA17_LIMITATIONS }
}
