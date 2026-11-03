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
  | 'pancreas-body'
  | 'spleen-parenchyma'
  | 'stomach-gastric-wall'
  | 'liver-glisson-capsule'
  | 'urinary-bladder-wall'
  | 'adnexa-ovary'
  | 'colon-distal-sigmoid';

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
    'spleen-parenchyma': Object.freeze({
      organ: 'spleen-parenchyma',
      organLabel: 'Spleen Parenchyma & Capsule (Kehr Sign Left)',
      fmaId: 'FMA:7196',
      afferentPathway: 'Left phrenic nerve afferents (C3-C5) and celiac plexus via greater splanchnic (T6-T8)',
      spinalSegments: Object.freeze(['C3', 'C4', 'C5', 'T6', 'T7', 'T8']),
      primaryCutaneousZones: Object.freeze([
        'left-shoulder-tip-acromion-kehr-sign',
        'left-hypochondrium',
        'left-supraclavicular-fossa',
      ]),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'stomach-gastric-wall': Object.freeze({
      organ: 'stomach-gastric-wall',
      organLabel: 'Stomach & Proximal Duodenum',
      fmaId: 'FMA:7148',
      afferentPathway: 'Greater splanchnic nerve via celiac ganglion (T5-T9)',
      spinalSegments: Object.freeze(['T5', 'T6', 'T7', 'T8', 'T9']),
      primaryCutaneousZones: Object.freeze([
        'epigastrium',
        'lower-retrosternal',
        'interscapular-posterior',
      ]),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'liver-glisson-capsule': Object.freeze({
      organ: 'liver-glisson-capsule',
      organLabel: 'Liver Parenchyma & Glisson Capsule',
      fmaId: 'FMA:7197',
      afferentPathway: 'Hepatic plexus via celiac ganglion (T7-T9) and right phrenic nerve twigs (C3-C5)',
      spinalSegments: Object.freeze(['C3', 'C4', 'C5', 'T7', 'T8', 'T9']),
      primaryCutaneousZones: Object.freeze([
        'right-hypochondrium',
        'right-shoulder-tip',
        'epigastrium',
      ]),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'urinary-bladder-wall': Object.freeze({
      organ: 'urinary-bladder-wall',
      organLabel: 'Urinary Bladder & Trigone',
      fmaId: 'FMA:15900',
      afferentPathway: 'Superior and inferior hypogastric plexuses (T11-L2) and pelvic splanchnic (S2-S4)',
      spinalSegments: Object.freeze(['T11', 'T12', 'L1', 'L2', 'S2', 'S3', 'S4']),
      primaryCutaneousZones: Object.freeze([
        'suprapubic',
        'perineum',
        'distal-urethral-meatus',
      ]),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'adnexa-ovary': Object.freeze({
      organ: 'adnexa-ovary',
      organLabel: 'Ovary & Uterine Adnexa',
      fmaId: 'FMA:18641',
      afferentPathway: 'Ovarian sympathetic plexus accompanying ovarian vessels to aorticorenal ganglion',
      spinalSegments: Object.freeze(['T10', 'T11']),
      primaryCutaneousZones: Object.freeze([
        'ipsilateral-iliac-fossa',
        'medial-upper-thigh',
      ]),
      source: DERMATOME_CONVERGENCE_SOURCE,
    }),
    'colon-distal-sigmoid': Object.freeze({
      organ: 'colon-distal-sigmoid',
      organLabel: 'Distal Colon & Sigmoid/Rectum',
      fmaId: 'FMA:14543',
      afferentPathway: 'Inferior mesenteric and lumbar splanchnic (L1-L2) and pelvic splanchnic (S2-S4)',
      spinalSegments: Object.freeze(['L1', 'L2', 'S2', 'S3', 'S4']),
      primaryCutaneousZones: Object.freeze([
        'hypogastrium',
        'sacral-perineal',
      ]),
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
  | 'source-not-verified'
  | 'empty-active-segments';

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

export interface DermatomeSpatialAnchor {
  readonly segment: string;
  readonly region: 'cervical' | 'thoracic' | 'lumbar' | 'sacral';
  readonly anteriorAnchor3D: readonly [number, number, number];
  readonly posteriorAnchor3D: readonly [number, number, number];
  readonly landmarkDescription: string;
}

function defAnchor(
  segment: string,
  region: 'cervical' | 'thoracic' | 'lumbar' | 'sacral',
  anteriorAnchor3D: readonly [number, number, number],
  posteriorAnchor3D: readonly [number, number, number],
  landmarkDescription: string,
): DermatomeSpatialAnchor {
  return Object.freeze({
    segment,
    region,
    anteriorAnchor3D,
    posteriorAnchor3D,
    landmarkDescription,
  });
}

const RAW_DERMATOME_SPATIAL_ANCHORS: Record<string, DermatomeSpatialAnchor> = {
  C1: defAnchor('C1', 'cervical', [0, 0.78, 0.04], [0, 0.78, -0.07], 'Vertex and suboccipital boundary (variable/rudimentary sensory root)'),
  C2: defAnchor('C2', 'cervical', [0, 0.72, 0.05], [0, 0.72, -0.08], 'Occipital protuberance and crown'),
  C3: defAnchor('C3', 'cervical', [0, 0.58, 0.12], [0, 0.58, -0.09], 'Supraclavicular fossa'),
  C4: defAnchor('C4', 'cervical', [0.16, 0.52, 0.10], [0.16, 0.52, -0.09], 'Acromioclavicular joint tip'),
  C5: defAnchor('C5', 'cervical', [0.28, 0.45, 0.08], [0.28, 0.45, -0.06], 'Lateral antecubital fossa'),
  C6: defAnchor('C6', 'cervical', [0.36, 0.32, 0.05], [0.36, 0.32, -0.04], 'Dorsal proximal phalanx of thumb'),
  C7: defAnchor('C7', 'cervical', [0.37, 0.22, 0.04], [0.37, 0.22, -0.03], 'Dorsal surface of middle finger'),
  C8: defAnchor('C8', 'cervical', [0.35, 0.23, 0.02], [0.35, 0.23, -0.02], 'Medial border of little finger'),
  T1: defAnchor('T1', 'thoracic', [0.24, 0.40, 0.05], [0.24, 0.40, -0.05], 'Medial antecubital fossa'),
  T2: defAnchor('T2', 'thoracic', [0.14, 0.46, 0.08], [0.14, 0.46, -0.08], 'Apex of axilla'),
  T3: defAnchor('T3', 'thoracic', [0, 0.42, 0.11], [0, 0.42, -0.10], '3rd intercostal space'),
  T4: defAnchor('T4', 'thoracic', [0, 0.38, 0.12], [0, 0.38, -0.10], '4th intercostal space (nipple line)'),
  T5: defAnchor('T5', 'thoracic', [0, 0.33, 0.12], [0, 0.33, -0.10], '5th intercostal space'),
  T6: defAnchor('T6', 'thoracic', [0, 0.28, 0.12], [0, 0.28, -0.10], 'Xiphoid process'),
  T7: defAnchor('T7', 'thoracic', [0, 0.24, 0.12], [0, 0.24, -0.10], 'Subcostal margin'),
  T8: defAnchor('T8', 'thoracic', [0, 0.20, 0.11], [0, 0.20, -0.10], 'Midpoint xiphoid to umbilicus'),
  T9: defAnchor('T9', 'thoracic', [0, 0.16, 0.11], [0, 0.16, -0.10], 'Upper umbilical border'),
  T10: defAnchor('T10', 'thoracic', [0, 0.12, 0.11], [0, 0.12, -0.10], 'Umbilicus level'),
  T11: defAnchor('T11', 'thoracic', [0, 0.07, 0.11], [0, 0.07, -0.10], 'Midway umbilicus to inguinal fold'),
  T12: defAnchor('T12', 'thoracic', [0, 0.02, 0.10], [0, 0.02, -0.10], 'Midpoint of inguinal ligament'),
  L1: defAnchor('L1', 'lumbar', [0.08, -0.06, 0.08], [0.08, -0.06, -0.08], 'Inguinal fold and upper groin'),
  L2: defAnchor('L2', 'lumbar', [0.08, -0.15, 0.08], [0.08, -0.15, -0.08], 'Anterior mid-thigh'),
  L3: defAnchor('L3', 'lumbar', [0.08, -0.28, 0.08], [0.08, -0.28, -0.08], 'Medial femoral condyle'),
  L4: defAnchor('L4', 'lumbar', [0.07, -0.42, 0.07], [0.07, -0.42, -0.06], 'Medial malleolus'),
  L5: defAnchor('L5', 'lumbar', [0.08, -0.56, 0.06], [0.08, -0.56, -0.05], 'Dorsum of foot at 3rd MTP joint'),
  S1: defAnchor('S1', 'sacral', [0.10, -0.58, 0.04], [0.10, -0.58, -0.05], 'Lateral calcaneus / heel'),
  S2: defAnchor('S2', 'sacral', [0.06, -0.32, 0.02], [0.06, -0.32, -0.08], 'Midline popliteal fossa'),
  S3: defAnchor('S3', 'sacral', [0.03, -0.05, 0.02], [0.03, -0.05, -0.09], 'Ischial tuberosity'),
  S4: defAnchor('S4', 'sacral', [0, -0.07, 0.01], [0, -0.07, -0.09], 'Perianal region (inner zone)'),
  S5: defAnchor('S5', 'sacral', [0, -0.08, 0.01], [0, -0.08, -0.09], 'Perianal mucocutaneous junction'),
};

export const DERMATOME_SPATIAL_ANCHORS: Readonly<Record<string, DermatomeSpatialAnchor>> =
  Object.freeze(RAW_DERMATOME_SPATIAL_ANCHORS);

export interface CalculateNociceptiveDriveInput {
  readonly organ: VisceralOrganKey | string;
  readonly activeDermatomes: Readonly<Record<string, number>>;
  readonly centralSensitizationCoeff?: number;
}

export interface NociceptiveConvergenceTelemetry {
  readonly ok: true;
  readonly organ: VisceralOrganKey;
  readonly organLabel: string;
  readonly totalNociceptiveDrive: number;
  readonly sensitizedDrive: number;
  readonly dorsalHornAmplificationFactor: number;
  readonly jaccardOverlap: number;
  readonly matchedSegments: readonly string[];
  readonly dominantCutaneousZone: string;
  readonly primaryCutaneousZones: readonly string[];
  readonly truthClass: 'reference';
  readonly label: typeof REFERRED_PAIN_DISCLAIMER;
}

export function calculateCentralSensitizationNociceptiveDrive(
  input: CalculateNociceptiveDriveInput,
): NociceptiveConvergenceTelemetry | ReferredPainFailure {
  if (
    !input ||
    !input.activeDermatomes ||
    typeof input.activeDermatomes !== 'object' ||
    Object.keys(input.activeDermatomes).length === 0
  ) {
    return Object.freeze({
      ok: false,
      reason: 'empty-active-segments',
      detail: 'At least one active dermatome segment is required for nociceptive drive computation.',
      truthClass: 'reference',
      label: REFERRED_PAIN_DISCLAIMER,
    });
  }

  const evalResult = evaluateViscerosomaticConvergence({
    organ: input.organ,
    activeCutaneousDermatomes: input.activeDermatomes,
  });

  if (!evalResult.ok) {
    return evalResult;
  }

  const gamma = typeof input.centralSensitizationCoeff === 'number' && Number.isFinite(input.centralSensitizationCoeff)
    ? Math.max(0, Math.min(1.5, input.centralSensitizationCoeff))
    : 0;

  let totalNociceptiveDrive = 0;
  for (const seg of evalResult.matchedDermatomeSegments) {
    totalNociceptiveDrive += input.activeDermatomes[seg] ?? 0;
  }

  const dorsalHornAmplificationFactor = 1 + gamma * evalResult.jaccardOverlap;
  const sensitizedDrive = Number((totalNociceptiveDrive * dorsalHornAmplificationFactor).toFixed(4));
  const dominantCutaneousZone = evalResult.primaryCutaneousZones[0] ?? 'unspecified-cutaneous-zone';

  return Object.freeze({
    ok: true,
    organ: evalResult.organ,
    organLabel: evalResult.organLabel,
    totalNociceptiveDrive: Number(totalNociceptiveDrive.toFixed(4)),
    sensitizedDrive,
    dorsalHornAmplificationFactor: Number(dorsalHornAmplificationFactor.toFixed(4)),
    jaccardOverlap: Number(evalResult.jaccardOverlap.toFixed(4)),
    matchedSegments: evalResult.matchedDermatomeSegments,
    dominantCutaneousZone,
    primaryCutaneousZones: evalResult.primaryCutaneousZones,
    truthClass: 'reference',
    label: REFERRED_PAIN_DISCLAIMER,
  });
}
