/**
 * BX-2 — peta teritori vaskular koroner pada model miokardium AHA 17 segmen (rujukan populasi, BUKAN anatomi pasien).
 *
 * SUMBER (teks penuh dibaca 2026-10-31, keduanya open access):
 *  - Rinta-Kiikka dkk., Ann Noninvasive Electrocardiol 2014, PMID 25201553 / PMC6932424 (ulasan; bagian "The 17-Segment Model" dan
 *    "Correspondence between Left Ventricular 17 Myocardial Segments and Coronary Artery Occlusion"; teks dibaca ±45.000 dari ±130.000 karakter):
 *    penetapan kelompok kerja AHA (Cerqueira dkk., Circulation 2002, PMID 11815441): segmen 3,4,9,10,15 -> RCA dominan; 5,6,11,12,16 -> LCx;
 *    1,2,7,8,13,14,17 -> LAD. Ulasan yang sama melaporkan ketidakcocokan empiris, prevalensi dominansi (klasifikasi BARI) dan segmen 12 & 16 "kontroversial".
 *  - Malkasian dkk., Eur Radiol 2020, PMID 32072257 / PMC7416454 (silang-uji): LCA = 1,2,5,6,7,8,11,12,13,14,17 dan RCA = 3,4,9,10,15
 *    (daftar LCA-nya tidak memuat segmen 16); model AHA = rata-rata 102 subjek sehat; salah menetapkan teritori pada dominansi kiri/kanan dan
 *    ramus intermedius; melebih-lebihkan RCA; pembanding validasinya pada babi.
 * Makalah asli Cerqueira (PMID 11815441) tanpa abstrak dan teks penuh tertutup: TIDAK dibaca. Gambar dominansi pada ulasan (Fig. 1) tidak dapat dibaca,
 * jadi TIDAK ada tabel segmen per dominansi; tabel di sini tidak berubah menurut dominansi dan hasilnya mengatakan itu.
 */
export type CoronaryBranch = 'LAD' | 'LCx' | 'RCA'
export type CoronaryArtery = CoronaryBranch | 'LCA'
export type Dominance = 'right' | 'left' | 'codominant' | 'unknown'

export const AHA17_SEGMENT_COUNT = 17
export const AHA17_SOURCES = Object.freeze({
  assignment: Object.freeze({ pmid: '25201553', pmcid: 'PMC6932424', originalPmid: '11815441' }),
  crossCheck: Object.freeze({ pmid: '32072257', pmcid: 'PMC7416454' }),
  verifiedFrom: 'full-text-secondary-sources' as const,
  originalVerified: false as const,
})

/** Penetapan kelompok kerja AHA per cabang, sebagaimana dikutip PMC6932424. Tiap segmen tepat satu cabang. */
const BRANCH_OF_SEGMENT: readonly CoronaryBranch[] = Object.freeze([
  'LAD', 'LAD', 'RCA', 'RCA', 'LCx', 'LCx', // basal 1-6
  'LAD', 'LAD', 'RCA', 'RCA', 'LCx', 'LCx', // tengah 7-12
  'LAD', 'LAD', 'RCA', 'LCx',               // apikal 13-16
  'LAD',                                    // apeks 17
] as CoronaryBranch[])

/** Nama segmen sesuai urutan enumerasi pada PMC6932424 (kalimat Meléndez-Ramírez: segmen 1-17); nomor diturunkan dari urutan itu. */
export const AHA17_SEGMENT_NAMES: readonly string[] = Object.freeze([
  'basal anterior', 'basal anteroseptal', 'basal inferoseptal', 'basal inferior', 'basal inferolateral', 'basal anterolateral',
  'mid anterior', 'mid anteroseptal', 'mid inferoseptal', 'mid inferior', 'mid inferolateral', 'mid anterolateral',
  'apical anterior', 'apical septal', 'apical inferior', 'apical lateral', 'apex',
])
export const AHA17_RINGS = Object.freeze([
  Object.freeze({ id: 'basal', segments: Object.freeze([1, 2, 3, 4, 5, 6]) }),
  Object.freeze({ id: 'mid', segments: Object.freeze([7, 8, 9, 10, 11, 12]) }),
  Object.freeze({ id: 'apical', segments: Object.freeze([13, 14, 15, 16]) }),
  Object.freeze({ id: 'apex', segments: Object.freeze([17]) }),
])

/** Prevalensi dominansi dari klasifikasi BARI sebagaimana dikutip PMC6932424 (populasi umum, bukan pasien ini). */
export const DOMINANCE_PREVALENCE = Object.freeze({
  right: 'approximately 85%', left: '7–8%', codominant: '7–8%',
  source: 'PMC6932424 (BARI classification as cited there)',
})

export type EvidenceKind = 'contested' | 'lad-specific' | 'discordant' | 'single-study'
export interface SegmentEvidence { kind: EvidenceKind; note: string }

/** Catatan bukti empiris per segmen, hanya yang tertulis pada PMC6932424 (studi dikutip lewat ulasan itu, bukan dibaca langsung). */
const EVIDENCE: Readonly<Record<number, readonly SegmentEvidence[]>> = Object.freeze({
  2: [{ kind: 'lad-specific', note: '100% specific for LAD occlusion in 93 patients (Ortiz-Pérez, cited in PMC6932424).' }],
  6: [{ kind: 'single-study', note: 'Corresponded to the LCx in a 50-patient SPECT study, in which no segment could be exclusively attributed to the RCA (Pereztol-Valdés, cited in PMC6932424).' }],
  7: [{ kind: 'lad-specific', note: '100% specific for LAD occlusion in 93 patients (Ortiz-Pérez, cited in PMC6932424).' }],
  8: [{ kind: 'lad-specific', note: '100% specific for LAD occlusion in 93 patients (Ortiz-Pérez, cited in PMC6932424).' }],
  12: [
    { kind: 'contested', note: 'The review calls segments 12 and 16 controversial: overlapping LAD and LCx supply in the anterolateral region.' },
    { kind: 'discordant', note: 'In the cited CMR study the culprit lesion was in the LAD for all discordant segment-12 cases; an ex vivo CT study placed it in the LAD territory.' },
  ],
  13: [{ kind: 'lad-specific', note: '100% specific for LAD occlusion in 93 patients (Ortiz-Pérez, cited in PMC6932424).' }],
  15: [{ kind: 'discordant', note: 'Among the segments with maximal discordance from the model, supplied by the LAD in most cases of a cited CT-CMR study.' }],
  16: [
    { kind: 'contested', note: 'The review calls segments 12 and 16 controversial; in an ex vivo CT study the LAD and LCx contributed almost equally.' },
    { kind: 'discordant', note: 'Maximal discordance from the model in cited CMR studies; culprit lesion in the LAD in the discordant cases.' },
  ],
})

export const AHA17_LIMITATIONS: readonly string[] = Object.freeze([
  "Population-average reference territories (102 healthy subjects); not the patient's coronary anatomy.",
  'In the cited imaging studies 23% of segments with late enhancement differed from the model; no segment was 100% specific for the LCx or the RCA.',
  'The model misassigns territories in right- vs left-dominant circulations and with a ramus intermedius, and over-estimates the RCA territory.',
  'Dominance does not change this table: no verified per-dominance table was available (the source figure could not be read).',
  'The comparison study used a swine reference standard; human validation was not part of it.',
  'Educational projection on an atlas; not a basis for diagnosis or procedural targeting.',
])

export interface SegmentInfo { segment: number; name: string; branch: CoronaryBranch; evidence: readonly SegmentEvidence[]; contested: boolean }

const info = (segment: number): SegmentInfo => {
  const evidence = EVIDENCE[segment] ?? []
  return { segment, name: AHA17_SEGMENT_NAMES[segment - 1], branch: BRANCH_OF_SEGMENT[segment - 1], evidence, contested: evidence.some((e) => e.kind === 'contested') }
}

export type TerritoryResult =
  | { ok: true; artery: CoronaryArtery; segments: readonly SegmentInfo[]; dominance: Dominance; dominanceAdjusted: false; variantTablesAvailable: false; truthClass: 'reference'; label: 'Atlas reference — not patient-specific'; sources: typeof AHA17_SOURCES; limitations: readonly string[] }
  | { ok: false; reason: 'invalid-artery' | 'invalid-dominance'; detail: string }

const DOMINANCE: readonly string[] = ['right', 'left', 'codominant', 'unknown']
const ARTERIES: readonly string[] = ['LAD', 'LCx', 'RCA', 'LCA']

/** Segmen yang ditetapkan model AHA ke satu arteri. LCA = LAD + LCx. Dominansi tidak mengubah tabel dan dilaporkan apa adanya. */
export function territoryForArtery(artery: unknown, dominance: unknown = 'unknown'): TerritoryResult {
  if (typeof dominance !== 'string' || !DOMINANCE.includes(dominance)) return { ok: false, reason: 'invalid-dominance', detail: 'Dominance must be right, left, codominant or unknown.' }
  if (typeof artery !== 'string' || !ARTERIES.includes(artery)) return { ok: false, reason: 'invalid-artery', detail: 'Artery must be LAD, LCx, RCA or LCA.' }
  const wanted = (b: CoronaryBranch) => artery === 'LCA' ? b !== 'RCA' : b === artery
  const segments = Array.from({ length: AHA17_SEGMENT_COUNT }, (_, i) => info(i + 1)).filter((s) => wanted(s.branch))
  return { ok: true, artery: artery as CoronaryArtery, segments, dominance: dominance as Dominance, dominanceAdjusted: false, variantTablesAvailable: false, truthClass: 'reference', label: 'Atlas reference — not patient-specific', sources: AHA17_SOURCES, limitations: AHA17_LIMITATIONS }
}

export type SegmentResult =
  | { ok: true; info: SegmentInfo; truthClass: 'reference'; limitations: readonly string[] }
  | { ok: false; reason: 'invalid-segment'; detail: string }

/** Kebalikannya: cabang yang ditetapkan model AHA untuk satu segmen, beserta bukti empiris yang tertulis pada sumber. */
export function branchForSegment(segment: unknown): SegmentResult {
  if (typeof segment !== 'number' || !Number.isInteger(segment) || segment < 1 || segment > AHA17_SEGMENT_COUNT) return { ok: false, reason: 'invalid-segment', detail: 'Segment must be an integer from 1 to 17.' }
  return { ok: true, info: info(segment), truthClass: 'reference', limitations: AHA17_LIMITATIONS }
}
