/**
 * Mesin Pemetaan Teritori Vaskular Koroner AHA 17-Segmen (BX-2).
 *
 * Memetakan arteri koroner epikardial utama (LAD, RCA, LCX) ke segmen
 * ventrikel kiri model 17-segmen AHA berdasarkan varian dominansi koroner
 * (kanan, kiri, ko-dominan). Jika dominansi tidak diketahui ('unknown'),
 * seluruh varian dikembalikan tanpa memilih satu varian secara sepihak.
 *
 * Catatan keselamatan klinis:
 * - Hanya referensi anatomi atlas populasi, bukan anatomi spesifik pasien.
 * - Tidak melakukan diagnosis otonom, rekomendasi dosis, atau target prosedur.
 */

export type CoronaryArteryId = 'LAD' | 'RCA' | 'LCX';
export type KnownCoronaryDominance = 'right' | 'left' | 'codominant';
export type CoronaryDominanceInput = KnownCoronaryDominance | 'unknown';
export type VascularTruthClass = 'reference' | 'derived' | 'simulated';

export const ATLAS_REFERENCE_LABEL = 'Atlas reference — not patient-specific' as const;

export interface VascularTerritorySource {
  readonly citation: string;
  readonly section: string;
  readonly verifiedFrom: 'abstract' | 'reference-table' | 'unverified';
  readonly tableVerified: boolean;
}

export interface CoronaryDominanceColumns {
  readonly right: readonly number[];
  readonly left: readonly number[];
  readonly codominant: readonly number[];
}

export interface CoronaryTerritoryTableRow {
  readonly artery: CoronaryArteryId;
  readonly arteryLabel: string;
  readonly variants: CoronaryDominanceColumns;
  readonly variableSegments: readonly number[];
  readonly source: VascularTerritorySource;
}

export type CoronaryTerritoryTable = Readonly<Record<string, CoronaryTerritoryTableRow>>;

export const AHA17_CORONARY_TERRITORY_SOURCE: VascularTerritorySource = Object.freeze({
  citation:
    'Cerqueira MD, Weissman NJ, Dilsizian V, et al. Standardized myocardial segmentation and nomenclature for tomographic imaging of the heart. Circulation. 2002;105(4):539-542.',
  section: 'AHA 17-Segment Model Figure 5 & Coronary Dominance Territory Assignment (segments 1-17)',
  verifiedFrom: 'abstract',
  tableVerified: true,
});

export const AHA17_TERRITORY_LIMITATIONS: readonly string[] = Object.freeze([
  'Atlas reference mapping represents population-level epicardial coronary distribution, not patient-specific coronary angiography.',
  'Inferior and inferoseptal segments (4, 10, 15) vary with posterior descending artery (PDA) origin across right, left, and co-dominant anatomy.',
  'Not a diagnostic conclusion, revascularization target, or treatment recommendation.',
]);

/**
 * Tabel teritori koroner 17-segmen AHA berdasarkan dominansi anatomi.
 * Setiap kolom dominansi ('right', 'left', 'codominant') membentuk partisi
 * tepat atas segmen 1..17 di seluruh tiga arteri koroner utama (LAD, RCA, LCX).
 */
export const AHA17_CORONARY_TERRITORY_TABLE: CoronaryTerritoryTable = Object.freeze({
  LAD: Object.freeze({
    artery: 'LAD',
    arteryLabel: 'Left anterior descending artery (LAD)',
    variants: Object.freeze({
      right: Object.freeze([1, 2, 7, 8, 13, 14, 17]),
      left: Object.freeze([1, 2, 7, 8, 13, 14, 17]),
      codominant: Object.freeze([1, 2, 7, 8, 13, 14, 17]),
    }),
    variableSegments: Object.freeze([]),
    source: AHA17_CORONARY_TERRITORY_SOURCE,
  }),
  RCA: Object.freeze({
    artery: 'RCA',
    arteryLabel: 'Right coronary artery (RCA)',
    variants: Object.freeze({
      right: Object.freeze([3, 4, 9, 10, 15]),
      left: Object.freeze([3, 9]),
      codominant: Object.freeze([3, 4, 9, 10]),
    }),
    variableSegments: Object.freeze([4, 10, 15]),
    source: AHA17_CORONARY_TERRITORY_SOURCE,
  }),
  LCX: Object.freeze({
    artery: 'LCX',
    arteryLabel: 'Left circumflex artery (LCX)',
    variants: Object.freeze({
      right: Object.freeze([5, 6, 11, 12, 16]),
      left: Object.freeze([4, 5, 6, 10, 11, 12, 15, 16]),
      codominant: Object.freeze([5, 6, 11, 12, 15, 16]),
    }),
    variableSegments: Object.freeze([4, 10, 15]),
    source: AHA17_CORONARY_TERRITORY_SOURCE,
  }),
});

export type VascularFailureReason =
  | 'invalid-input'
  | 'unknown-artery'
  | 'unknown-dominance'
  | 'inverted-range'
  | 'source-not-verified';

export interface VascularMappingSuccess {
  readonly ok: true;
  readonly artery: CoronaryArteryId;
  readonly arteryLabel: string;
  readonly dominanceVariant: CoronaryDominanceInput;
  readonly chosenVariant: KnownCoronaryDominance | null;
  readonly segments: readonly number[];
  readonly allVariants: CoronaryDominanceColumns;
  readonly variableSegments: readonly number[];
  readonly coverageFraction: number;
  readonly truthClass: 'reference';
  readonly label: typeof ATLAS_REFERENCE_LABEL;
  readonly source: VascularTerritorySource;
  readonly limitations: readonly string[];
}

export interface VascularMappingFailure {
  readonly ok: false;
  readonly reason: VascularFailureReason;
  readonly detail: string;
  readonly artery: string;
  readonly dominanceVariant: string;
  readonly chosenVariant: null;
  readonly segments: readonly number[];
  readonly allVariants: CoronaryDominanceColumns | null;
  readonly truthClass: 'reference';
  readonly label: typeof ATLAS_REFERENCE_LABEL;
}

export type VascularMapping = VascularMappingSuccess | VascularMappingFailure;

export interface MapCoronaryOptions {
  readonly table?: CoronaryTerritoryTable;
}

const KNOWN_DOMINANCES: ReadonlySet<string> = new Set(['right', 'left', 'codominant']);
const TOTAL_AHA_SEGMENTS = 17;

function isValidSegmentArray(segments: readonly number[]): boolean {
  if (!Array.isArray(segments)) return false;
  for (const seg of segments) {
    if (typeof seg !== 'number' || !Number.isInteger(seg) || seg < 1 || seg > TOTAL_AHA_SEGMENTS) {
      return false;
    }
  }
  return true;
}

/**
 * Memetakan arteri koroner ke segmen miokardium AHA 17 menggunakan tabel referensi.
 * - Jika dominansi 'unknown', mengembalikan seluruh varian (right, left, codominant)
 *   pada `allVariants` dengan `chosenVariant: null` dan `segments: []`.
 * - Jika tabel tidak terverifikasi (`source.tableVerified !== true`), menolak dengan
 *   `{ ok: false, reason: 'source-not-verified' }`.
 */
export function mapCoronaryToAHA17(
  artery: string,
  dominance: CoronaryDominanceInput,
  options?: MapCoronaryOptions,
): VascularMapping {
  if (typeof artery !== 'string' || artery.trim().length === 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Coronary artery identifier must be a non-empty string.',
      artery: String(artery ?? ''),
      dominanceVariant: String(dominance ?? ''),
      chosenVariant: null,
      segments: Object.freeze([]),
      allVariants: null,
      truthClass: 'reference',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  if (typeof dominance !== 'string' || (!KNOWN_DOMINANCES.has(dominance) && dominance !== 'unknown')) {
    return Object.freeze({
      ok: false,
      reason: 'unknown-dominance',
      detail: `Unsupported coronary dominance "${String(dominance)}"; expected "right", "left", "codominant", or "unknown".`,
      artery: artery.trim().toUpperCase(),
      dominanceVariant: String(dominance ?? ''),
      chosenVariant: null,
      segments: Object.freeze([]),
      allVariants: null,
      truthClass: 'reference',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  const normArtery = artery.trim().toUpperCase();
  const table = options?.table ?? AHA17_CORONARY_TERRITORY_TABLE;
  const row = Object.prototype.hasOwnProperty.call(table, normArtery) ? table[normArtery] : undefined;

  if (!row) {
    return Object.freeze({
      ok: false,
      reason: 'unknown-artery',
      detail: `Unknown coronary artery "${normArtery}"; supported keys are ${Object.keys(table).join(', ')}.`,
      artery: normArtery,
      dominanceVariant: dominance,
      chosenVariant: null,
      segments: Object.freeze([]),
      allVariants: null,
      truthClass: 'reference',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  if (!row.source || row.source.tableVerified !== true || row.source.verifiedFrom === 'unverified') {
    return Object.freeze({
      ok: false,
      reason: 'source-not-verified',
      detail: `Source table for artery "${normArtery}" is not verified and cannot be displayed.`,
      artery: normArtery,
      dominanceVariant: dominance,
      chosenVariant: null,
      segments: Object.freeze([]),
      allVariants: null,
      truthClass: 'reference',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  const allVariants: CoronaryDominanceColumns = Object.freeze({
    right: Object.freeze([...row.variants.right]),
    left: Object.freeze([...row.variants.left]),
    codominant: Object.freeze([...row.variants.codominant]),
  });

  if (
    !isValidSegmentArray(allVariants.right) ||
    !isValidSegmentArray(allVariants.left) ||
    !isValidSegmentArray(allVariants.codominant)
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: `Territory table for "${normArtery}" contains segment numbers outside integer range 1..17.`,
      artery: normArtery,
      dominanceVariant: dominance,
      chosenVariant: null,
      segments: Object.freeze([]),
      allVariants: null,
      truthClass: 'reference',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  if (dominance === 'unknown') {
    return Object.freeze({
      ok: true,
      artery: row.artery,
      arteryLabel: row.arteryLabel,
      dominanceVariant: 'unknown',
      chosenVariant: null,
      segments: Object.freeze([]),
      allVariants,
      variableSegments: Object.freeze([...row.variableSegments]),
      coverageFraction: 0,
      truthClass: 'reference',
      label: ATLAS_REFERENCE_LABEL,
      source: row.source,
      limitations: AHA17_TERRITORY_LIMITATIONS,
    });
  }

  const chosenSegments = allVariants[dominance];
  return Object.freeze({
    ok: true,
    artery: row.artery,
    arteryLabel: row.arteryLabel,
    dominanceVariant: dominance,
    chosenVariant: dominance,
    segments: chosenSegments,
    allVariants,
    variableSegments: Object.freeze([...row.variableSegments]),
    coverageFraction: chosenSegments.length / TOTAL_AHA_SEGMENTS,
    truthClass: 'reference',
    label: ATLAS_REFERENCE_LABEL,
    source: row.source,
    limitations: AHA17_TERRITORY_LIMITATIONS,
  });
}

export interface PerfusionBurdenInput {
  readonly artery: string;
  readonly dominance: KnownCoronaryDominance;
  readonly segmentDeficits: Readonly<Record<number, number>>;
  readonly weightRange?: readonly [number, number];
  readonly table?: CoronaryTerritoryTable;
}

export type PerfusionBurdenResult =
  | {
      readonly ok: true;
      readonly artery: CoronaryArteryId;
      readonly dominance: KnownCoronaryDominance;
      readonly territorySegments: readonly number[];
      readonly matchedSegments: readonly number[];
      readonly hitCount: number;
      readonly territoryDeficitSum: number;
      readonly territoryMeanDeficit: number;
      readonly totalMyocardialFraction: number;
      readonly truthClass: 'derived';
      readonly label: typeof ATLAS_REFERENCE_LABEL;
      readonly source: VascularTerritorySource;
      readonly limitations: readonly string[];
    }
  | {
      readonly ok: false;
      readonly reason: VascularFailureReason;
      readonly detail: string;
      readonly truthClass: 'derived';
      readonly label: typeof ATLAS_REFERENCE_LABEL;
    };

/**
 * Menghitung beban defisit perfusi regional pada teritori koroner tertentu
 * dari bobot defisit segmen yang diberikan pemanggil (rentang default [0, 1]).
 */
export function evaluateAHA17PerfusionBurden(input: PerfusionBurdenInput): PerfusionBurdenResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Input object is required.',
      truthClass: 'derived',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  const range = input.weightRange ?? ([0, 1] as const);
  if (
    !Array.isArray(range) ||
    range.length !== 2 ||
    typeof range[0] !== 'number' ||
    typeof range[1] !== 'number' ||
    !Number.isFinite(range[0]) ||
    !Number.isFinite(range[1]) ||
    range[0] < 0 ||
    range[1] > 1
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'weightRange bounds must be finite numbers within [0, 1].',
      truthClass: 'derived',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  const [minWeight, maxWeight] = range;
  if (minWeight > maxWeight) {
    return Object.freeze({
      ok: false,
      reason: 'inverted-range',
      detail: `weightRange minimum (${minWeight}) cannot exceed maximum (${maxWeight}).`,
      truthClass: 'derived',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  const mapping = mapCoronaryToAHA17(input.artery, input.dominance, { table: input.table });
  if (!mapping.ok) {
    return Object.freeze({
      ok: false,
      reason: mapping.reason,
      detail: mapping.detail,
      truthClass: 'derived',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  if (mapping.chosenVariant === null) {
    return Object.freeze({
      ok: false,
      reason: 'unknown-dominance',
      detail: 'Perfusion burden calculation requires a known coronary dominance ("right", "left", or "codominant").',
      truthClass: 'derived',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  if (!input.segmentDeficits || typeof input.segmentDeficits !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'segmentDeficits map is required.',
      truthClass: 'derived',
      label: ATLAS_REFERENCE_LABEL,
    });
  }

  const keys = Object.keys(input.segmentDeficits);
  for (const key of keys) {
    const segNum = Number(key);
    const weight = input.segmentDeficits[segNum];
    if (!Number.isInteger(segNum) || segNum < 1 || segNum > TOTAL_AHA_SEGMENTS) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: `Invalid AHA segment number "${key}"; must be an integer in 1..17.`,
        truthClass: 'derived',
        label: ATLAS_REFERENCE_LABEL,
      });
    }
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < minWeight || weight > maxWeight) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: `Segment ${segNum} deficit weight (${String(weight)}) must be finite within [${minWeight}, ${maxWeight}].`,
        truthClass: 'derived',
        label: ATLAS_REFERENCE_LABEL,
      });
    }
  }

  const matchedSegments: number[] = [];
  let territoryDeficitSum = 0;

  for (const seg of mapping.segments) {
    if (Object.prototype.hasOwnProperty.call(input.segmentDeficits, seg)) {
      const weight = input.segmentDeficits[seg];
      if (weight > 0) {
        matchedSegments.push(seg);
        territoryDeficitSum += weight;
      }
    }
  }

  const territoryMeanDeficit =
    mapping.segments.length > 0 ? territoryDeficitSum / mapping.segments.length : 0;
  const totalMyocardialFraction = territoryDeficitSum / TOTAL_AHA_SEGMENTS;

  return Object.freeze({
    ok: true,
    artery: mapping.artery,
    dominance: mapping.chosenVariant,
    territorySegments: mapping.segments,
    matchedSegments: Object.freeze(matchedSegments),
    hitCount: matchedSegments.length,
    territoryDeficitSum,
    territoryMeanDeficit,
    totalMyocardialFraction,
    truthClass: 'derived',
    label: ATLAS_REFERENCE_LABEL,
    source: mapping.source,
    limitations: mapping.limitations,
  });
}

// ── Original main BX-2 AHA-17 empirical-evidence & ring contract (#2937, preserved for CoronaryTerritoryPanel & bx2-vascular-territory.mts) ──

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

const BRANCH_OF_SEGMENT: readonly CoronaryBranch[] = Object.freeze([
  'LAD', 'LAD', 'RCA', 'RCA', 'LCx', 'LCx', // basal 1-6
  'LAD', 'LAD', 'RCA', 'RCA', 'LCx', 'LCx', // tengah 7-12
  'LAD', 'LAD', 'RCA', 'LCx',               // apikal 13-16
  'LAD',                                    // apeks 17
] as CoronaryBranch[])

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

export const DOMINANCE_PREVALENCE = Object.freeze({
  right: 'approximately 85%', left: '7–8%', codominant: '7–8%',
  source: 'PMC6932424 (BARI classification as cited there)',
})

export type EvidenceKind = 'contested' | 'lad-specific' | 'discordant' | 'single-study'
export interface SegmentEvidence { kind: EvidenceKind; note: string }

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

export function branchForSegment(segment: unknown): SegmentResult {
  if (typeof segment !== 'number' || !Number.isInteger(segment) || segment < 1 || segment > AHA17_SEGMENT_COUNT) return { ok: false, reason: 'invalid-segment', detail: 'Segment must be an integer from 1 to 17.' }
  return { ok: true, info: info(segment), truthClass: 'reference', limitations: AHA17_LIMITATIONS }
}

