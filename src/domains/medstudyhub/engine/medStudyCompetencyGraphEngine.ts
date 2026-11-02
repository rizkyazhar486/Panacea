/**
 * MedStudyHub × Prometheus Multiscale Medical Competency & Curriculum DAG Engine (EDU-1).
 *
 * Unifies:
 * 1. L0..L8 Body Exposure biological hierarchy (Whole Body -> Organ System -> Organ ->
 *    Substructure -> Tissue -> Cell -> Organelle -> Molecular Pathway -> Gene/RNA/DNA).
 * 2. Canonical anatomical & genomic ontologies (FMA, UBERON, HGNC, ICD-10).
 * 3. Indonesian Medical Competency Standard (SKDI / Standar Kompetensi Dokter Indonesia
 *    levels 1, 2, 3A, 3B, 4A) & Bloom's Revised Cognitive Taxonomy.
 * 4. Deterministic DAG validation (Kahn topological ordering, DFS cycle detection,
 *    missing prerequisite detection, and learner mastery readiness gating).
 */

export type BiologicalScaleLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8';
export type SkdiCompetencyLevel = '1' | '2' | '3A' | '3B' | '4A';
export type BloomCognitiveLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export const MEDSTUDY_COMPETENCY_DISCLAIMER =
  'Educational curriculum & SKDI competency graph — not a medical licensing certificate or clinical order' as const;

export interface MultiscaleBiologicalAnchor {
  readonly scaleLevel: BiologicalScaleLevel;
  readonly fmaId: string;
  readonly uberonId: string;
  readonly hgncGenes: readonly string[];
  readonly l0WholeBody: string;
  readonly l1System: string;
  readonly l2Organ: string;
  readonly l3Substructure: string;
  readonly l4Tissue: string;
  readonly l5Cell: string;
  readonly l6Organelle: string;
  readonly l7Pathway: string;
  readonly l8GenomeRegulation: string;
}

export interface MedStudyConceptNode {
  readonly conceptId: string;
  readonly title: string;
  readonly discipline:
    | 'anatomy'
    | 'physiology'
    | 'pathophysiology'
    | 'pharmacology'
    | 'internal-medicine'
    | 'cardiology'
    | 'pulmonology'
    | 'nephrology'
    | 'neurology'
    | 'emergency-medicine';
  readonly skdiLevel: SkdiCompetencyLevel;
  readonly bloomLevel: BloomCognitiveLevel;
  readonly prerequisiteIds: readonly string[];
  readonly masteryThresholdScore: number;
  readonly estimatedStudyMinutes: number;
  readonly biologicalAnchor: MultiscaleBiologicalAnchor;
  readonly sourceCitation: string;
  readonly pmid: string;
}

export const CANONICAL_MEDSTUDY_CURRICULUM_NODES: Readonly<Record<string, MedStudyConceptNode>> =
  Object.freeze({
    'med-cv-01-sarcomere-ultrastructure': Object.freeze({
      conceptId: 'med-cv-01-sarcomere-ultrastructure',
      title: 'Cardiomyocyte Sarcomere Ultrastructure & Myofilament Organization',
      discipline: 'anatomy',
      skdiLevel: '4A',
      bloomLevel: 'understand',
      prerequisiteIds: Object.freeze([]),
      masteryThresholdScore: 0.75,
      estimatedStudyMinutes: 20,
      biologicalAnchor: Object.freeze({
        scaleLevel: 'L5',
        fmaId: 'FMA:7101',
        uberonId: 'UBERON:0002084',
        hgncGenes: Object.freeze(['MYH7', 'TNNT2', 'TNNI3', 'ACTC1']),
        l0WholeBody: 'human-body',
        l1System: 'cardiovascular-system',
        l2Organ: 'heart',
        l3Substructure: 'left-ventricle-wall',
        l4Tissue: 'working-ventricular-myocardium',
        l5Cell: 'ventricular-cardiomyocyte',
        l6Organelle: 'myofibril-sarcomere-and-sarcoplasmic-reticulum',
        l7Pathway: 'actin-myosin-cross-bridge-cycling',
        l8GenomeRegulation: 'MYH7-beta-myosin-heavy-chain-transcription',
      }),
      sourceCitation: 'Bers DM. Cardiac excitation-contraction coupling. Nature. 2002;415(6868):198-205.',
      pmid: '11805843',
    }),
    'med-cv-02-excitation-contraction-cicr': Object.freeze({
      conceptId: 'med-cv-02-excitation-contraction-cicr',
      title: 'Cav1.2 L-Type Calcium Channels & RyR2 Calcium-Induced Calcium Release',
      discipline: 'physiology',
      skdiLevel: '4A',
      bloomLevel: 'analyze',
      prerequisiteIds: Object.freeze(['med-cv-01-sarcomere-ultrastructure']),
      masteryThresholdScore: 0.8,
      estimatedStudyMinutes: 25,
      biologicalAnchor: Object.freeze({
        scaleLevel: 'L7',
        fmaId: 'FMA:7101',
        uberonId: 'UBERON:0002084',
        hgncGenes: Object.freeze(['CACNA1C', 'RYR2', 'ATP2A2', 'PLN']),
        l0WholeBody: 'human-body',
        l1System: 'cardiovascular-system',
        l2Organ: 'heart',
        l3Substructure: 'left-ventricle-wall',
        l4Tissue: 'working-ventricular-myocardium',
        l5Cell: 'ventricular-cardiomyocyte',
        l6Organelle: 'dyadic-cleft-t-tubule-junctional-sr',
        l7Pathway: 'calcium-induced-calcium-release-and-serca2a-reuptake',
        l8GenomeRegulation: 'CACNA1C-RYR2-ATP2A2-phospholamban-axis',
      }),
      sourceCitation: 'Bers DM. Cardiac excitation-contraction coupling. Nature. 2002;415(6868):198-205.',
      pmid: '11805843',
    }),
    'med-cv-03-frank-starling-pv-loop': Object.freeze({
      conceptId: 'med-cv-03-frank-starling-pv-loop',
      title: 'Frank-Starling Law, Ventricular Pressure-Volume Loops & Afterload Coupling',
      discipline: 'physiology',
      skdiLevel: '4A',
      bloomLevel: 'evaluate',
      prerequisiteIds: Object.freeze(['med-cv-02-excitation-contraction-cicr']),
      masteryThresholdScore: 0.8,
      estimatedStudyMinutes: 30,
      biologicalAnchor: Object.freeze({
        scaleLevel: 'L2',
        fmaId: 'FMA:7101',
        uberonId: 'UBERON:0002084',
        hgncGenes: Object.freeze(['TTN', 'TNNT2']),
        l0WholeBody: 'human-body',
        l1System: 'cardiovascular-system',
        l2Organ: 'heart',
        l3Substructure: 'left-ventricular-chamber-and-aortic-outflow',
        l4Tissue: 'ventricular-myocardium',
        l5Cell: 'ventricular-cardiomyocyte',
        l6Organelle: 'titin-sarcomere-mechanosensor',
        l7Pathway: 'length-dependent-myofilament-calcium-sensitivity',
        l8GenomeRegulation: 'TTN-isoform-splicing-compliance',
      }),
      sourceCitation: 'Sequeira V, van der Velden J. Historical perspective on heart function: the Frank-Starling Law. Biophys Rev. 2015;7(4):421-447.',
      pmid: '28510104',
    }),
    'med-cv-04-acute-hfref-management': Object.freeze({
      conceptId: 'med-cv-04-acute-hfref-management',
      title: 'Acute Decompensated Heart Failure (SKDI 3B) Pathophysiology & Initial Stabilization',
      discipline: 'cardiology',
      skdiLevel: '3B',
      bloomLevel: 'evaluate',
      prerequisiteIds: Object.freeze([
        'med-cv-02-excitation-contraction-cicr',
        'med-cv-03-frank-starling-pv-loop',
      ]),
      masteryThresholdScore: 0.85,
      estimatedStudyMinutes: 35,
      biologicalAnchor: Object.freeze({
        scaleLevel: 'L1',
        fmaId: 'FMA:7088',
        uberonId: 'UBERON:0000948',
        hgncGenes: Object.freeze(['ADRB1', 'NPPA', 'NPPB', 'ACE']),
        l0WholeBody: 'human-body',
        l1System: 'cardiovascular-system',
        l2Organ: 'heart',
        l3Substructure: 'biventricular-myocardium-and-pulmonary-venous-bed',
        l4Tissue: 'myocardium-and-alveolar-capillary-membrane',
        l5Cell: 'cardiomyocyte-and-juxtaglomerular-cell',
        l6Organelle: 'sarcoplasmic-reticulum-and-natriuretic-granules',
        l7Pathway: 'raas-sympathetic-overactivation-and-bnp-counterregulation',
        l8GenomeRegulation: 'NPPB-ventricular-wall-stress-induction',
      }),
      sourceCitation: 'McDonagh TA, Metra M, Adamo M, et al. 2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure. Eur Heart J. 2021;42(36):3599-3726.',
      pmid: '34447992',
    }),
  });

export type CompetencyGraphFailureReason =
  | 'invalid-input'
  | 'empty-catalog'
  | 'unknown-target-concept'
  | 'missing-prerequisite-node'
  | 'cyclic-prerequisite-graph'
  | 'invalid-mastery-threshold';

export interface LearnerCompetencyRecord {
  readonly conceptId: string;
  readonly highestScoreFraction: number;
  readonly verifiedAtIso: string;
}

export interface EvaluateCurriculumPathInput {
  readonly targetConceptId: string;
  readonly learnerRecords: readonly LearnerCompetencyRecord[];
  readonly catalogOverride?: Readonly<Record<string, MedStudyConceptNode>>;
}

export interface CurriculumPathEvaluationSuccess {
  readonly ok: true;
  readonly targetConcept: MedStudyConceptNode;
  readonly topologicalStudyOrder: readonly string[];
  readonly masteredConceptIds: readonly string[];
  readonly unlockedConceptIds: readonly string[];
  readonly blockedPrerequisiteIds: readonly string[];
  readonly isTargetUnlocked: boolean;
  readonly isTargetMastered: boolean;
  readonly remainingStudyMinutes: number;
  readonly truthClass: 'reference';
  readonly label: typeof MEDSTUDY_COMPETENCY_DISCLAIMER;
}

export interface CurriculumPathEvaluationFailure {
  readonly ok: false;
  readonly reason: CompetencyGraphFailureReason;
  readonly detail: string;
  readonly cyclePath: readonly string[];
  readonly truthClass: 'reference';
  readonly label: typeof MEDSTUDY_COMPETENCY_DISCLAIMER;
}

export type CurriculumPathEvaluationResult =
  | CurriculumPathEvaluationSuccess
  | CurriculumPathEvaluationFailure;

const VALID_ONTOLOGY_FMA = /^FMA:\d+$/;
const VALID_ONTOLOGY_UBERON = /^UBERON:\d{7}$/;

/**
 * Validates the integrity of the multiscale medical curriculum DAG, detects cycles,
 * computes the deterministic topological learning path for `targetConceptId`, and
 * evaluates learner mastery and prerequisite unlocking.
 */
export function evaluateMedStudyCompetencyPath(
  input: EvaluateCurriculumPathInput,
): CurriculumPathEvaluationResult {
  if (!input || typeof input !== 'object' || typeof input.targetConceptId !== 'string') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Valid EvaluateCurriculumPathInput with targetConceptId is required.',
      cyclePath: Object.freeze([]),
      truthClass: 'reference',
      label: MEDSTUDY_COMPETENCY_DISCLAIMER,
    });
  }

  const catalog = input.catalogOverride ?? CANONICAL_MEDSTUDY_CURRICULUM_NODES;
  const nodeKeys = Object.keys(catalog);
  if (nodeKeys.length === 0) {
    return Object.freeze({
      ok: false,
      reason: 'empty-catalog',
      detail: 'Curriculum concept catalog cannot be empty.',
      cyclePath: Object.freeze([]),
      truthClass: 'reference',
      label: MEDSTUDY_COMPETENCY_DISCLAIMER,
    });
  }

  // Validate all nodes in catalog
  for (const key of nodeKeys) {
    const node = catalog[key];
    if (
      !node ||
      typeof node.masteryThresholdScore !== 'number' ||
      !Number.isFinite(node.masteryThresholdScore) ||
      node.masteryThresholdScore <= 0 ||
      node.masteryThresholdScore > 1
    ) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-mastery-threshold',
        detail: `Concept "${key}" has invalid masteryThresholdScore; must be in (0, 1].`,
        cyclePath: Object.freeze([]),
        truthClass: 'reference',
        label: MEDSTUDY_COMPETENCY_DISCLAIMER,
      });
    }

    if (
      !node.biologicalAnchor ||
      !VALID_ONTOLOGY_FMA.test(node.biologicalAnchor.fmaId) ||
      !VALID_ONTOLOGY_UBERON.test(node.biologicalAnchor.uberonId)
    ) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: `Concept "${key}" has invalid FMA or UBERON ontology anchor.`,
        cyclePath: Object.freeze([]),
        truthClass: 'reference',
        label: MEDSTUDY_COMPETENCY_DISCLAIMER,
      });
    }

    for (const prereqId of node.prerequisiteIds) {
      if (!Object.prototype.hasOwnProperty.call(catalog, prereqId)) {
        return Object.freeze({
          ok: false,
          reason: 'missing-prerequisite-node',
          detail: `Concept "${key}" references nonexistent prerequisite "${prereqId}".`,
          cyclePath: Object.freeze([]),
          truthClass: 'reference',
          label: MEDSTUDY_COMPETENCY_DISCLAIMER,
        });
      }
    }
  }

  if (!Object.prototype.hasOwnProperty.call(catalog, input.targetConceptId)) {
    return Object.freeze({
      ok: false,
      reason: 'unknown-target-concept',
      detail: `Target concept "${input.targetConceptId}" does not exist in catalog.`,
      cyclePath: Object.freeze([]),
      truthClass: 'reference',
      label: MEDSTUDY_COMPETENCY_DISCLAIMER,
    });
  }

  // DFS cycle detection & ancestor subgraph extraction for targetConceptId
  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];
  const topologicalOrder: string[] = [];

  function dfs(currentId: string): string[] | null {
    state.set(currentId, 'visiting');
    stack.push(currentId);

    const node = catalog[currentId];
    for (const prereqId of node.prerequisiteIds) {
      const prereqState = state.get(prereqId);
      if (prereqState === 'visiting') {
        const cycleStart = stack.indexOf(prereqId);
        return [...stack.slice(cycleStart), prereqId];
      }
      if (prereqState !== 'visited') {
        const cycle = dfs(prereqId);
        if (cycle) return cycle;
      }
    }

    stack.pop();
    state.set(currentId, 'visited');
    topologicalOrder.push(currentId);
    return null;
  }

  const cycleDetected = dfs(input.targetConceptId);
  if (cycleDetected) {
    return Object.freeze({
      ok: false,
      reason: 'cyclic-prerequisite-graph',
      detail: `Cyclic prerequisite dependency detected: ${cycleDetected.join(' -> ')}.`,
      cyclePath: Object.freeze(cycleDetected),
      truthClass: 'reference',
      label: MEDSTUDY_COMPETENCY_DISCLAIMER,
    });
  }

  if (!Array.isArray(input.learnerRecords)) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'learnerRecords must be an array.',
      cyclePath: Object.freeze([]),
      truthClass: 'reference',
      label: MEDSTUDY_COMPETENCY_DISCLAIMER,
    });
  }

  const scoreByConcept = new Map<string, number>();
  for (const rec of input.learnerRecords) {
    if (
      !rec ||
      typeof rec.conceptId !== 'string' ||
      typeof rec.highestScoreFraction !== 'number' ||
      !Number.isFinite(rec.highestScoreFraction) ||
      rec.highestScoreFraction < 0 ||
      rec.highestScoreFraction > 1
    ) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: 'Every learner competency record must have a finite highestScoreFraction in [0, 1].',
        cyclePath: Object.freeze([]),
        truthClass: 'reference',
        label: MEDSTUDY_COMPETENCY_DISCLAIMER,
      });
    }
    const prev = scoreByConcept.get(rec.conceptId) ?? 0;
    if (rec.highestScoreFraction > prev) {
      scoreByConcept.set(rec.conceptId, rec.highestScoreFraction);
    }
  }

  const masteredSet = new Set<string>();
  for (const cid of topologicalOrder) {
    const node = catalog[cid];
    const score = scoreByConcept.get(cid) ?? 0;
    const allPrereqsMastered = node.prerequisiteIds.every(pid => masteredSet.has(pid));
    if (allPrereqsMastered && score >= node.masteryThresholdScore) {
      masteredSet.add(cid);
    }
  }

  const unlockedConceptIds: string[] = [];
  const blockedPrerequisiteIds: string[] = [];
  let remainingStudyMinutes = 0;

  for (const cid of topologicalOrder) {
    const node = catalog[cid];
    const allPrereqsMastered = node.prerequisiteIds.every(pid => masteredSet.has(pid));
    if (allPrereqsMastered) {
      unlockedConceptIds.push(cid);
    }
    if (!masteredSet.has(cid)) {
      remainingStudyMinutes += node.estimatedStudyMinutes;
      if (cid !== input.targetConceptId) {
        blockedPrerequisiteIds.push(cid);
      }
    }
  }

  const targetNode = catalog[input.targetConceptId];
  const isTargetUnlocked = targetNode.prerequisiteIds.every(pid => masteredSet.has(pid));
  const isTargetMastered = masteredSet.has(input.targetConceptId);

  return Object.freeze({
    ok: true,
    targetConcept: targetNode,
    topologicalStudyOrder: Object.freeze(topologicalOrder),
    masteredConceptIds: Object.freeze([...masteredSet]),
    unlockedConceptIds: Object.freeze(unlockedConceptIds),
    blockedPrerequisiteIds: Object.freeze(blockedPrerequisiteIds),
    isTargetUnlocked,
    isTargetMastered,
    remainingStudyMinutes,
    truthClass: 'reference',
    label: MEDSTUDY_COMPETENCY_DISCLAIMER,
  });
}
