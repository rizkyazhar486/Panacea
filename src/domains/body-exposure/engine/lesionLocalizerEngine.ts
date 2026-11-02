/**
 * Neurological Lesion Localizer Engine (BX-1).
 *
 * Maps upper motor neuron (UMN), lower motor neuron (LMN), cranial nerve, and
 * dissociated sensory tract deficits across neuroanatomical decussations to
 * canonical brainstem, cerebral, and spinal cord syndromes.
 *
 * Clinical & Scientific Provenance:
 * - Brazis PW, Masdeu JC, Biller J. Localization in Clinical Neurology. 8th ed.
 * - DeMyer WE. Technique of the Neurologic Examination. 6th ed.
 */

export type Laterality = 'left' | 'right' | 'bilateral';
export type MotorNeuronPattern = 'umn' | 'lmn';
export type SensoryModality = 'pain-temperature' | 'vibration-proprioception';
export type CranialNerveId = 'CN_III' | 'CN_VI' | 'CN_VII_LMN' | 'CN_IX_X' | 'CN_XII';

export const LESION_ATLAS_DISCLAIMER =
  'Atlas neuroanatomical localization reference — not an autonomous clinical diagnosis' as const;

export interface LesionSourceReference {
  readonly citation: string;
  readonly section: string;
  readonly verifiedFrom: 'reference-table' | 'abstract' | 'unverified';
  readonly tableVerified: boolean;
}

export const LESION_LOCALIZER_SOURCE: LesionSourceReference = Object.freeze({
  citation:
    'Brazis PW, Masdeu JC, Biller J. Localization in Clinical Neurology. 8th ed. Wolters Kluwer; 2022.',
  section: 'Chapters 6-14: Corticospinal, Spinothalamic, Dorsal Column Decussations & Brainstem Syndromes',
  verifiedFrom: 'reference-table',
  tableVerified: true,
});

export interface LimbMotorFinding {
  readonly region: 'upper-limb' | 'lower-limb' | 'hemicorpus';
  readonly side: 'left' | 'right';
  readonly tone: 'spastic' | 'flaccid' | 'normal';
  readonly reflexes: 'hyperreflexia' | 'areflexia' | 'normoreflexia';
  readonly babinski?: boolean;
  readonly fasciculations?: boolean;
}

export interface CranialNerveFinding {
  readonly nerve: CranialNerveId;
  readonly side: 'left' | 'right';
}

export interface SensoryTractFinding {
  readonly modality: SensoryModality;
  readonly distribution: 'face' | 'hemicorpus-below-neck' | 'dermatomal-below-level' | 'saddle-s3-s5';
  readonly side: 'left' | 'right' | 'bilateral';
}

export interface LesionLocalizationInput {
  readonly motorFindings: readonly LimbMotorFinding[];
  readonly cranialNerveFindings?: readonly CranialNerveFinding[];
  readonly sensoryFindings?: readonly SensoryTractFinding[];
  readonly hornerSyndromeSide?: 'left' | 'right' | null;
  readonly sourceOverride?: LesionSourceReference;
}

export interface NeuroSyndromeDefinition {
  readonly syndromeId:
    | 'weber-midbrain-syndrome'
    | 'millard-gubler-pontine-syndrome'
    | 'wallenberg-lateral-medullary-syndrome'
    | 'brown-sequard-spinal-hemisection'
    | 'internal-capsule-pure-motor'
    | 'cauda-equina-lmn-syndrome';
  readonly title: string;
  readonly anatomicalStructure: string;
  readonly fmaId: string;
  readonly vascularSupply: string;
  readonly tractsInvolved: readonly string[];
}

export const NEURO_SYNDROME_CATALOG: Readonly<Record<string, NeuroSyndromeDefinition>> = Object.freeze({
  'weber-midbrain-syndrome': Object.freeze({
    syndromeId: 'weber-midbrain-syndrome',
    title: 'Weber Ventral Midbrain Syndrome',
    anatomicalStructure: 'Cerebral peduncle & oculomotor fascicle (midbrain)',
    fmaId: 'FMA:62395',
    vascularSupply: 'Paramedian branches of posterior cerebral artery (PCA)',
    tractsInvolved: Object.freeze(['corticospinal-tract-pre-decussation', 'oculomotor-nerve-fascicle-cn3']),
  }),
  'millard-gubler-pontine-syndrome': Object.freeze({
    syndromeId: 'millard-gubler-pontine-syndrome',
    title: 'Millard-Gubler Ventral Pontine Syndrome',
    anatomicalStructure: 'Basis pontis & facial/abducens fascicles (caudal pons)',
    fmaId: 'FMA:67943',
    vascularSupply: 'Paramedian & short circumferential branches of basilar artery',
    tractsInvolved: Object.freeze([
      'corticospinal-tract-pre-decussation',
      'abducens-fascicle-cn6',
      'facial-fascicle-cn7',
    ]),
  }),
  'wallenberg-lateral-medullary-syndrome': Object.freeze({
    syndromeId: 'wallenberg-lateral-medullary-syndrome',
    title: 'Wallenberg Lateral Medullary Syndrome',
    anatomicalStructure: 'Posterolateral medulla oblongata',
    fmaId: 'FMA:62004',
    vascularSupply: 'Posterior inferior cerebellar artery (PICA) or vertebral artery',
    tractsInvolved: Object.freeze([
      'spinal-trigeminal-tract-and-nucleus',
      'spinothalamic-tract',
      'descending-sympathetic-fibers',
      'nucleus-ambiguus-cn9-cn10',
    ]),
  }),
  'brown-sequard-spinal-hemisection': Object.freeze({
    syndromeId: 'brown-sequard-spinal-hemisection',
    title: 'Brown-Sequard Spinal Cord Hemisection Syndrome',
    anatomicalStructure: 'Unilateral hemicord (lateral corticospinal, dorsal column, spinothalamic)',
    fmaId: 'FMA:7647',
    vascularSupply: 'Sulcal branch of anterior spinal artery / penetrating radicular arteries',
    tractsInvolved: Object.freeze([
      'lateral-corticospinal-tract-post-decussation',
      'dorsal-column-gracile-cuneate-fasciculi',
      'contralateral-crossed-spinothalamic-tract',
    ]),
  }),
  'internal-capsule-pure-motor': Object.freeze({
    syndromeId: 'internal-capsule-pure-motor',
    title: 'Posterior Limb Internal Capsule Pure Motor Syndrome',
    anatomicalStructure: 'Posterior limb of internal capsule',
    fmaId: 'FMA:61955',
    vascularSupply: 'Lenticulostriate perforating branches of middle cerebral artery (MCA)',
    tractsInvolved: Object.freeze(['corticospinal-and-corticobulbar-tracts']),
  }),
  'cauda-equina-lmn-syndrome': Object.freeze({
    syndromeId: 'cauda-equina-lmn-syndrome',
    title: 'Cauda Equina Polyradicular LMN Syndrome',
    anatomicalStructure: 'Lumbosacral nerve roots (L2-S5) within dural sac',
    fmaId: 'FMA:71134',
    vascularSupply: 'Lumbosacral radicular arteries',
    tractsInvolved: Object.freeze(['lumbosacral-ventral-motor-roots', 'sacral-dorsal-sensory-roots-s3-s5']),
  }),
});

export type LesionFailureReason =
  | 'invalid-input'
  | 'empty-findings'
  | 'contradictory-neurological-signs'
  | 'source-not-verified';

export interface LesionCandidateMatch {
  readonly syndrome: NeuroSyndromeDefinition;
  readonly lesionSide: Laterality;
  readonly confidenceWeight: number;
  readonly matchedEvidence: readonly string[];
}

export interface LesionLocalizationSuccess {
  readonly ok: true;
  readonly chosenSyndrome: LesionCandidateMatch | null;
  readonly candidateLoci: readonly LesionCandidateMatch[];
  readonly neuronClassificaciones: Readonly<Record<string, MotorNeuronPattern>>;
  readonly truthClass: 'reference';
  readonly label: typeof LESION_ATLAS_DISCLAIMER;
  readonly source: LesionSourceReference;
}

export interface LesionLocalizationFailure {
  readonly ok: false;
  readonly reason: LesionFailureReason;
  readonly detail: string;
  readonly truthClass: 'reference';
  readonly label: typeof LESION_ATLAS_DISCLAIMER;
}

export type LesionLocalizationResult = LesionLocalizationSuccess | LesionLocalizationFailure;

function oppositeSide(side: 'left' | 'right'): 'left' | 'right' {
  return side === 'left' ? 'right' : 'left';
}

export function localizeNeurologicalLesion(
  input: LesionLocalizationInput,
): LesionLocalizationResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Localization input object is required.',
      truthClass: 'reference',
      label: LESION_ATLAS_DISCLAIMER,
    });
  }

  const source = input.sourceOverride ?? LESION_LOCALIZER_SOURCE;
  if (!source || source.tableVerified !== true || source.verifiedFrom === 'unverified') {
    return Object.freeze({
      ok: false,
      reason: 'source-not-verified',
      detail: 'Neuroanatomical localization source table is not verified.',
      truthClass: 'reference',
      label: LESION_ATLAS_DISCLAIMER,
    });
  }

  const motor = Array.isArray(input.motorFindings) ? input.motorFindings : [];
  const cranial = Array.isArray(input.cranialNerveFindings) ? input.cranialNerveFindings : [];
  const sensory = Array.isArray(input.sensoryFindings) ? input.sensoryFindings : [];

  if (motor.length === 0 && cranial.length === 0 && sensory.length === 0 && !input.hornerSyndromeSide) {
    return Object.freeze({
      ok: false,
      reason: 'empty-findings',
      detail: 'At least one motor, cranial nerve, or sensory finding is required.',
      truthClass: 'reference',
      label: LESION_ATLAS_DISCLAIMER,
    });
  }

  const neuronMap: Record<string, MotorNeuronPattern> = {};
  const seenRegionSide = new Map<string, MotorNeuronPattern>();

  for (const m of motor) {
    if (!m || (m.side !== 'left' && m.side !== 'right')) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: 'Motor finding requires valid side ("left" or "right").',
        truthClass: 'reference',
        label: LESION_ATLAS_DISCLAIMER,
      });
    }

    const hasUmnFeature = m.tone === 'spastic' || m.reflexes === 'hyperreflexia' || m.babinski === true;
    const hasLmnFeature = m.tone === 'flaccid' || m.reflexes === 'areflexia' || m.fasciculations === true;

    if (hasUmnFeature && hasLmnFeature) {
      return Object.freeze({
        ok: false,
        reason: 'contradictory-neurological-signs',
        detail: `Contradictory UMN and LMN signs in ${m.side} ${m.region}.`,
        truthClass: 'reference',
        label: LESION_ATLAS_DISCLAIMER,
      });
    }

    const pattern: MotorNeuronPattern = hasLmnFeature ? 'lmn' : 'umn';
    const key = `${m.side}:${m.region}`;
    const existing = seenRegionSide.get(key);
    if (existing && existing !== pattern) {
      return Object.freeze({
        ok: false,
        reason: 'contradictory-neurological-signs',
        detail: `Conflicting motor neuron classifications (${existing} vs ${pattern}) recorded for ${key}.`,
        truthClass: 'reference',
        label: LESION_ATLAS_DISCLAIMER,
      });
    }
    seenRegionSide.set(key, pattern);
    neuronMap[key] = pattern;
  }

  const candidates: LesionCandidateMatch[] = [];

  for (const cn of cranial) {
    if (cn.nerve === 'CN_III') {
      const contraSide = oppositeSide(cn.side);
      const hasContraUmn = motor.some(
        m => m.side === contraSide && neuronMap[`${m.side}:${m.region}`] === 'umn',
      );
      if (hasContraUmn) {
        candidates.push(
          Object.freeze({
            syndrome: NEURO_SYNDROME_CATALOG['weber-midbrain-syndrome'],
            lesionSide: cn.side,
            confidenceWeight: 0.95,
            matchedEvidence: Object.freeze([
              `Ipsilateral (${cn.side}) CN_III palsy`,
              `Contralateral (${contraSide}) UMN corticospinal weakness`,
            ]),
          }),
        );
      }
    }

    if (cn.nerve === 'CN_VI' || cn.nerve === 'CN_VII_LMN') {
      const contraSide = oppositeSide(cn.side);
      const hasContraUmn = motor.some(
        m => m.side === contraSide && neuronMap[`${m.side}:${m.region}`] === 'umn',
      );
      if (hasContraUmn) {
        candidates.push(
          Object.freeze({
            syndrome: NEURO_SYNDROME_CATALOG['millard-gubler-pontine-syndrome'],
            lesionSide: cn.side,
            confidenceWeight: 0.93,
            matchedEvidence: Object.freeze([
              `Ipsilateral (${cn.side}) ${cn.nerve} palsy`,
              `Contralateral (${contraSide}) UMN corticospinal weakness`,
            ]),
          }),
        );
      }
    }
  }

  for (const sFace of sensory) {
    if (
      sFace.modality === 'pain-temperature' &&
      sFace.distribution === 'face' &&
      (sFace.side === 'left' || sFace.side === 'right')
    ) {
      const contraSide = oppositeSide(sFace.side);
      const hasContraBodySpinothalamic = sensory.some(
        sBody =>
          sBody.modality === 'pain-temperature' &&
          sBody.distribution !== 'face' &&
          sBody.side === contraSide,
      );
      if (hasContraBodySpinothalamic) {
        candidates.push(
          Object.freeze({
            syndrome: NEURO_SYNDROME_CATALOG['wallenberg-lateral-medullary-syndrome'],
            lesionSide: sFace.side,
            confidenceWeight: 0.96,
            matchedEvidence: Object.freeze([
              `Ipsilateral (${sFace.side}) facial pain-temperature loss`,
              `Contralateral (${contraSide}) body pain-temperature loss`,
            ]),
          }),
        );
      }
    }
  }

  for (const m of motor) {
    if (neuronMap[`${m.side}:${m.region}`] === 'umn') {
      const ipsiSide = m.side;
      const contraSide = oppositeSide(ipsiSide);
      const hasIpsiDorsalColumn = sensory.some(
        s => s.modality === 'vibration-proprioception' && s.side === ipsiSide,
      );
      const hasContraSpinothalamic = sensory.some(
        s => s.modality === 'pain-temperature' && s.distribution !== 'face' && s.side === contraSide,
      );
      if (hasIpsiDorsalColumn && hasContraSpinothalamic) {
        candidates.push(
          Object.freeze({
            syndrome: NEURO_SYNDROME_CATALOG['brown-sequard-spinal-hemisection'],
            lesionSide: ipsiSide,
            confidenceWeight: 0.94,
            matchedEvidence: Object.freeze([
              `Ipsilateral (${ipsiSide}) UMN corticospinal deficit`,
              `Ipsilateral (${ipsiSide}) dorsal column loss`,
              `Contralateral (${contraSide}) spinothalamic loss`,
            ]),
          }),
        );
      }
    }
  }

  const hasLowerLmn = motor.some(
    m => m.region === 'lower-limb' && neuronMap[`${m.side}:${m.region}`] === 'lmn',
  );
  const hasSaddleLoss = sensory.some(s => s.distribution === 'saddle-s3-s5');
  if (hasLowerLmn && hasSaddleLoss) {
    candidates.push(
      Object.freeze({
        syndrome: NEURO_SYNDROME_CATALOG['cauda-equina-lmn-syndrome'],
        lesionSide: 'bilateral',
        confidenceWeight: 0.91,
        matchedEvidence: Object.freeze([
          'Lower-limb flaccid/areflexic LMN radicular deficit',
          'Saddle S3-S5 perineal sensory loss',
        ]),
      }),
    );
  }

  if (candidates.length === 0 && cranial.length === 0 && sensory.length === 0) {
    const umnSides = new Set(
      motor.filter(m => neuronMap[`${m.side}:${m.region}`] === 'umn').map(m => m.side),
    );
    if (umnSides.size === 1) {
      const affectedSide = [...umnSides][0];
      const contraLesionSide = oppositeSide(affectedSide);
      candidates.push(
        Object.freeze({
          syndrome: NEURO_SYNDROME_CATALOG['internal-capsule-pure-motor'],
          lesionSide: contraLesionSide,
          confidenceWeight: 0.85,
          matchedEvidence: Object.freeze([
            `Isolated ${affectedSide} UMN deficit localizes to contralateral (${contraLesionSide}) internal capsule`,
          ]),
        }),
      );
    }
  }

  const chosenSyndrome = candidates.length === 1 ? candidates[0] : null;

  return Object.freeze({
    ok: true,
    chosenSyndrome,
    candidateLoci: Object.freeze(candidates),
    neuronClassificaciones: Object.freeze(neuronMap),
    truthClass: 'reference',
    label: LESION_ATLAS_DISCLAIMER,
    source: source,
  });
}
