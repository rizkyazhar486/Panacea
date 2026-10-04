import {
  assessVerticalLineage,
  validateVerticalBiologicalGraph,
  type BiologicalScale,
  type VerticalBiologicalGraph,
} from './verticalBiologyGraph.ts'

export type VerticalDepthEvidenceKind =
  | 'real-input'
  | 'integration'
  | 'validation'
  | 'projection'
  | 'outcome-feedback'

export type VerticalDepthEvidenceLevel = 'repository' | 'workflow' | 'field' | 'external'

export interface VerticalDepthEvidence {
  kind: VerticalDepthEvidenceKind
  sourceId: string
  level: VerticalDepthEvidenceLevel
}

export interface VerticalDepthAssessmentInput {
  graph: VerticalBiologicalGraph
  evidence: readonly VerticalDepthEvidence[]
}

export interface VerticalDepthLineageAssessment {
  lineageId: string
  completeness: number
  implemented: number
  gaps: number
  notApplicable: number
  unresolvedGapScales: BiologicalScale[]
}

export interface VerticalDepthAssessment {
  state: 'invalid' | 'partial' | 'technically-coherent' | 'externally-validated-for-declared-scope'
  graphId: string
  lineages: VerticalDepthLineageAssessment[]
  minimumLineageCompleteness: number
  unresolvedGapCount: number
  missingEvidenceKinds: VerticalDepthEvidenceKind[]
  externalValidationPresent: boolean
  tenOfTenEligible: boolean
  boundary: {
    clinicalCorrectnessProven: false
    universalPopulationValidityProven: false
    patientSpecificMolecularTruthInferred: false
  }
}

const REQUIRED_EVIDENCE_KINDS: readonly VerticalDepthEvidenceKind[] = [
  'real-input',
  'integration',
  'validation',
  'projection',
  'outcome-feedback',
]

function nonEmpty(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Evidence-gated vertical-depth acceptance contract.
 *
 * This does not create biological depth. It evaluates whether a declared graph
 * has hidden scale gaps and whether the software evidence chain has progressed
 * from real input through integration, projection, validation and outcome
 * feedback. A 10/10-eligible result is intentionally difficult: all declared
 * lineages must be gap-free and the full evidence chain must include external
 * validation for the declared scope.
 */
export function assessVerticalDepth(
  input: VerticalDepthAssessmentInput,
): VerticalDepthAssessment {
  const graphErrors = validateVerticalBiologicalGraph(input.graph)
  const evidenceErrors = input.evidence.filter((entry) => !nonEmpty(entry.sourceId))

  if (graphErrors.length || evidenceErrors.length) {
    return {
      state: 'invalid',
      graphId: input.graph.id,
      lineages: [],
      minimumLineageCompleteness: 0,
      unresolvedGapCount: 0,
      missingEvidenceKinds: [...REQUIRED_EVIDENCE_KINDS],
      externalValidationPresent: false,
      tenOfTenEligible: false,
      boundary: {
        clinicalCorrectnessProven: false,
        universalPopulationValidityProven: false,
        patientSpecificMolecularTruthInferred: false,
      },
    }
  }

  const lineages = input.graph.lineages.map((lineage) => {
    const coverage = assessVerticalLineage(lineage)
    return {
      lineageId: lineage.id,
      completeness: coverage.completeness,
      implemented: coverage.implemented,
      gaps: coverage.gaps,
      notApplicable: coverage.notApplicable,
      unresolvedGapScales: lineage.steps
        .filter((step) => step.status === 'gap')
        .map((step) => step.scale),
    }
  })

  const minimumLineageCompleteness = lineages.length
    ? Math.min(...lineages.map((lineage) => lineage.completeness))
    : 0
  const unresolvedGapCount = lineages.reduce((sum, lineage) => sum + lineage.gaps, 0)

  const kinds = new Set(input.evidence.map((entry) => entry.kind))
  const missingEvidenceKinds = REQUIRED_EVIDENCE_KINDS.filter((kind) => !kinds.has(kind))
  const externalValidationPresent = input.evidence.some(
    (entry) => entry.kind === 'validation' && entry.level === 'external',
  )
  const externalOutcomeFeedbackPresent = input.evidence.some(
    (entry) => entry.kind === 'outcome-feedback' && entry.level === 'external',
  )

  const tenOfTenEligible =
    lineages.length > 0
    && unresolvedGapCount === 0
    && minimumLineageCompleteness === 1
    && missingEvidenceKinds.length === 0
    && externalValidationPresent
    && externalOutcomeFeedbackPresent

  let state: VerticalDepthAssessment['state'] = 'partial'
  if (tenOfTenEligible) state = 'externally-validated-for-declared-scope'
  else if (unresolvedGapCount === 0 && missingEvidenceKinds.length === 0) state = 'technically-coherent'

  return {
    state,
    graphId: input.graph.id,
    lineages,
    minimumLineageCompleteness,
    unresolvedGapCount,
    missingEvidenceKinds,
    externalValidationPresent,
    tenOfTenEligible,
    boundary: {
      clinicalCorrectnessProven: false,
      universalPopulationValidityProven: false,
      patientSpecificMolecularTruthInferred: false,
    },
  }
}
