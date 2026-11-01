/**
 * Referred Pain & Dermatome Explorer Engine (BX-7).
 *
 * Models viscerosomatic convergence in dorsal horn lamina I/V neurons (Ruch's
 * convergence-projection principle) and maps visceral afferent nociception to
 * spinal cord segments and cutaneous dermatomes.
 *
 * Citations:
 * - Lee MW, McPhee RW, Stringer MD. An evidence-based approach to human dermatomes.
 *   Clin Anat. 2008;21(5):363-373. PMID: 18470936.
 * - Standring S, ed. Gray's Anatomy: The Anatomical Basis of Clinical Practice. 42nd ed.
 */

export type VisceralOrganKey =
  | 'heart-myocardium'
  | 'diaphragm-central-tendon'
  | 'gallbladder-biliary'
  | 'appendix-visceral-early'
  | 'ureter-renal-pelvis'
  | 'pancreas-body';

export const REFERRED_PAIN_DISCLAIMER =
  'Atlas viscerosomatic convergence reference — not an acute clinical triage or diagnostic tool' as const;

export interface ReferredPainSource {
  readonly citation: string;
  readonly pmid: string;
  readonly verifiedFrom: 'abstract' | 'reference-table' | 'unverified';
  readonly tableVerified: boolean;
}

export const DERMATOME_CONVERGENCE_SOURCE: ReferredPainSource = Object.freeze({
  citation:
    'Lee MW, McPhee RW, Stringer MD. An evidence-based approach to human dermatomes. Clin Anat. 2008;21(5):363-373.',
  pmid: '18470936',
  verifiedFrom: 'abstract',
  tableVerified: true,
});

export interface VisceralReferredPainRow {
  readonly organ: VisceralOrganKey;
  readonly organLabel: string;
  readonly fmaId: string;
  readonly afferentPathway: string;
  readonly spinalSegments: readonly string[];
  readonly primaryCutaneousZones: readonly string[];
  readonly source: ReferredPainSource;
}

export const VISCERAL_REFERRED_PAIN_TABLE: Readonly<Record<VisceralOrganKey, VisceralReferredPainRow>> =
  Object.freeze({
    'heart-myocardium': Object.freeze({
      organ: 'heart-myocardium',
      organLabel: 'Myocardium (Heart)',
      fmaId: 'FMA:7088',
      afferentPathway: 'Cardiac sympathetic visceral afferents via cervical and upper thoracic ganglia',
      spinalSegments: Object.freeze(['T1', 'T2', 'T3', 'T4', 'T5']),
      primaryCutaneousZones: Object.freeze([
        'retrosternal-precordium',
        'left-medial-arm-and-forearm',
        'anterior-neck-and-jaw',
      ]),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'diaphragm-central-tendon': Object.freeze({
      organ: 'diaphragm-central-tendon',
      organLabel: 'Central Tendon of Diaphragm (Kehr Sign)',
      fmaId: 'FMA:13295',
      afferentPathway: 'Phrenic nerve somatic/visceral afferents converging with supraclavicular nerves',
      spinalSegments: Object.freeze(['C3', 'C4', 'C5']),
      primaryCutaneousZones: Object.freeze(['ipsilateral-shoulder-tip-acromion', 'supraclavicular-fossa']),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'gallbladder-biliary': Object.freeze({
      organ: 'gallbladder-biliary',
      organLabel: 'Gallbladder & Biliary Tree',
      fmaId: 'FMA:7202',
      afferentPathway: 'Greater splanchnic nerve (T6-T9) and right phrenic nerve (C3-C5)',
      spinalSegments: Object.freeze(['C3', 'C4', 'C5', 'T6', 'T7', 'T8', 'T9']),
      primaryCutaneousZones: Object.freeze([
        'right-hypochondrium',
        'inferior-angle-right-scapula-boas-sign',
        'right-shoulder-tip',
      ]),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'appendix-visceral-early': Object.freeze({
      organ: 'appendix-visceral-early',
      organLabel: 'Vermiform Appendix (Midgut Visceral Phase)',
      fmaId: 'FMA:14542',
      afferentPathway: 'Lesser splanchnic nerve via superior mesenteric plexus',
      spinalSegments: Object.freeze(['T10']),
      primaryCutaneousZones: Object.freeze(['periumbilical-umbilicus-dermatome']),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'ureter-renal-pelvis': Object.freeze({
      organ: 'ureter-renal-pelvis',
      organLabel: 'Renal Pelvis & Ureter',
      fmaId: 'FMA:9704',
      afferentPathway: 'Least/lumbar splanchnic nerves converging with ilioinguinal and genitofemoral nerves',
      spinalSegments: Object.freeze(['T11', 'T12', 'L1', 'L2']),
      primaryCutaneousZones: Object.freeze([
        'costovertebral-flank-loin',
        'inguinal-groin',
        'ipsilateral-scrotum-or-labia',
      ]),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'pancreas-body': Object.freeze({
      organ: 'pancreas-body',
      organLabel: 'Pancreas',
      fmaId: 'FMA:7198',
      afferentPathway: 'Greater splanchnic nerve via celiac plexus',
      spinalSegments: Object.freeze(['T7', 'T8', 'T9']),
      primaryCutaneousZones: Object.freeze(['epigastrium', 'mid-thoracic-back-radiation']),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
  });

const VALID_SPINAL_SEGMENTS: ReadonlySet<string> = new Set([
  'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
  'S1', 'S2', 'S3', 'S4', 'S5',
]);

export type ReferredPainFailureReason =
  | 'invalid-input'
  | 'unknown-organ'
  | 'invalid-spinal-segment'
  | 'inverted-intensity-range'
  | 'source-not-verified';

export interface ViscerosomaticConvergenceResult {
  readonly ok: true;
  readonly organ: VisceralOrganKey;
  readonly organLabel: string;
  readonly fmaId: string;
  readonly afferentPathway: string;
  readonly organSpinalSegments: readonly string[];
  readonly matchedDermatomeSegments: readonly string[];
  readonly jaccardOverlap: number;
  readonly weightedConvergenceScore: number;
  readonly primaryCutaneousZones: readonly string[];
  readonly truthClass: 'reference';
  readonly label: typeof REFERRED_PAIN_DISCLAIMER;
  readonly source: ReferredPainSource;
}

export interface ReferredPainFailure {
  readonly ok: false;
  readonly reason: ReferredPainFailureReason;
  readonly detail: string;
  readonly truthClass: 'reference';
  readonly label: typeof REFERRED_PAIN_DISCLAIMER;
}

export type ReferredPainEvaluation = ViscerosomaticConvergenceResult | ReferredPainFailure;

export interface EvaluateReferredPainInput {
  readonly organ: string;
  readonly activeCutaneousDermatomes: Readonly<Record<string, number>>;
  readonly intensityBounds?: readonly [number, number];
  readonly tableOverride?: Readonly<Record<string, VisceralReferredPainRow>>;
}

export function evaluateViscerosomaticConvergence(
  input: EvaluateReferredPainInput,
): ReferredPainEvaluation {
  if (!input || typeof input !== 'object' || typeof input.organ !== 'string') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Valid input object with organ identifier is required.',
      truthClass: 'reference',
      label: REFERRED_PAIN_DISCLAIMER,
    });
  }

  const bounds = input.intensityBounds ?? ([0, 1] as const);
  if (
    !Array.isArray(bounds) ||
    bounds.length !== 2 ||
    !Number.isFinite(bounds[0]) ||
    !Number.isFinite(bounds[1]) ||
    bounds[0] < 0 ||
    bounds[1] > 10
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'intensityBounds must be finite numbers within [0, 10].',
      truthClass: 'reference',
      label: REFERRED_PAIN_DISCLAIMER,
    });
  }

  if (bounds[0] > bounds[1]) {
    return Object.freeze({
      ok: false,
      reason: 'inverted-intensity-range',
      detail: `intensityBounds minimum (${bounds[0]}) exceeds maximum (${bounds[1]}).`,
      truthClass: 'reference',
      label: REFERRED_PAIN_DISCLAIMER,
    });
  }

  const table = input.tableOverride ?? VISCERAL_REFERRED_PAIN_TABLE;
  const row = Object.prototype.hasOwnProperty.call(table, input.organ)
    ? table[input.organ as VisceralOrganKey]
    : undefined;

  if (!row) {
    return Object.freeze({
      ok: false,
      reason: 'unknown-organ',
      detail: `Unknown visceral organ "${input.organ}".`,
      truthClass: 'reference',
      label: REFERRED_PAIN_DISCLAIMER,
    });
  }

  if (!row.source || row.source.tableVerified !== true || row.source.verifiedFrom === 'unverified') {
    return Object.freeze({
      ok: false,
      reason: 'source-not-verified',
      detail: `Source table for "${input.organ}" is not verified.`,
      truthClass: 'reference',
      label: REFERRED_PAIN_DISCLAIMER,
    });
  }

  if (!input.activeCutaneousDermatomes || typeof input.activeCutaneousDermatomes !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'activeCutaneousDermatomes map is required.',
      truthClass: 'reference',
      label: REFERRED_PAIN_DISCLAIMER,
    });
  }

  const activeSegments: string[] = [];
  let matchedWeightSum = 0;

  for (const [rawSeg, weight] of Object.entries(input.activeCutaneousDermatomes)) {
    const seg = rawSeg.trim().toUpperCase();
    if (!VALID_SPINAL_SEGMENTS.has(seg)) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-spinal-segment',
        detail: `Invalid spinal cord dermatome segment "${rawSeg}".`,
        truthClass: 'reference',
        label: REFERRED_PAIN_DISCLAIMER,
      });
    }
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < bounds[0] || weight > bounds[1]) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: `Intensity weight for ${seg} (${String(weight)}) must be finite within [${bounds[0]}, ${bounds[1]}].`,
        truthClass: 'reference',
        label: REFERRED_PAIN_DISCLAIMER,
      });
    }
    if (weight > 0) {
      activeSegments.push(seg);
      if (row.spinalSegments.includes(seg)) {
        matchedWeightSum += weight;
      }
    }
  }

  const organSet = new Set(row.spinalSegments);
  const matched = activeSegments.filter(seg => organSet.has(seg));
  const unionSet = new Set([...row.spinalSegments, ...activeSegments]);
  const jaccardOverlap = unionSet.size > 0 ? matched.length / unionSet.size : 0;
  const weightedConvergenceScore =
    row.spinalSegments.length > 0 ? matchedWeightSum / row.spinalSegments.length : 0;

  return Object.freeze({
    ok: true,
    organ: row.organ,
    organLabel: row.organLabel,
    fmaId: row.fmaId,
    afferentPathway: row.afferentPathway,
    organSpinalSegments: row.spinalSegments,
    matchedDermatomeSegments: Object.freeze(matched),
    jaccardOverlap,
    weightedConvergenceScore,
    primaryCutaneousZones: row.primaryCutaneousZones,
    truthClass: 'reference',
    label: REFERRED_PAIN_DISCLAIMER,
    source: row.source,
  });
}
