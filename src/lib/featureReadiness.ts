export type FeatureReadinessStatus =
  | 'PRODUCTION'
  | 'FUNCTIONAL-BUT-INCOMPLETE'
  | 'SCAFFOLD'
  | 'EXTERNAL-ADAPTER-REQUIRED'
  | 'RESEARCH-ONLY'
  | 'DEPRECATED'
  | 'BROKEN'

export interface FeatureReadiness {
  id: string
  label: string
  status: FeatureReadinessStatus
  route: string
  requiresExternalAdapter: boolean
  requiresPatientData: boolean
  requiresWebGL: boolean
  productionReady: boolean
  lastValidated: string
  notes: string
}

const LAST_VALIDATED = '2026-09-08'

/**
 * Product-readiness registry.
 *
 * This is deliberately conservative: the existence of a page, card, type,
 * animation, mock dataset, or execution contract does not make a feature
 * production-ready. A feature can only move to PRODUCTION after its applicable
 * data, state, provenance, error/unsupported handling, mobile behavior, tests,
 * and integration have been verified.
 */
export const FEATURE_READINESS: readonly FeatureReadiness[] = [
  {
    id: 'home',
    label: 'Home',
    status: 'PRODUCTION',
    route: '/',
    requiresExternalAdapter: false,
    requiresPatientData: false,
    requiresWebGL: false,
    productionReady: true,
    lastValidated: LAST_VALIDATED,
    notes: 'Established dashboard surface. Freeze against redesign; only objective bug, accessibility, performance, and missing-widget fixes are allowed during stabilization.',
  },
  {
    id: 'body-explorer',
    label: 'Body Explorer',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/body-explorer',
    requiresExternalAdapter: false,
    requiresPatientData: false,
    requiresWebGL: true,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Real source anatomy, named mesh selection, lazy labs, and radiology teaching modes exist. Source-mesh physiology deformation and mobile/render lifecycle still require stabilization.',
  },
  {
    id: 'whole-body-precision',
    label: 'Whole-Body Precision Lab',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/body-explorer',
    requiresExternalAdapter: false,
    requiresPatientData: false,
    requiresWebGL: true,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Mounted as a lazy Body Explorer lab. Exact shared-camera binding, structure resolution, provenance, dissection/explode behavior, and mobile completion remain acceptance requirements.',
  },
  {
    id: 'biomedical-engine',
    label: 'Biomedical Engine',
    status: 'SCAFFOLD',
    route: '/body-explorer',
    requiresExternalAdapter: true,
    requiresPatientData: false,
    requiresWebGL: true,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Treat as an orchestrator over functional domain modules. Decorative engine-map presence is not production completion.',
  },
  {
    id: 'genomics-lab',
    label: 'Genomics Lab',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/body-explorer',
    requiresExternalAdapter: true,
    requiresPatientData: false,
    requiresWebGL: true,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Educational/import workflow exists. Production-scale FASTQ/VCF/BAM/CRAM/POD5 handling, provenance, workers, cancellation, and external pipeline boundaries remain to verify.',
  },
  {
    id: 'cell-lab',
    label: 'Cell & Metabolism Lab',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/body-explorer',
    requiresExternalAdapter: false,
    requiresPatientData: false,
    requiresWebGL: true,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Cell/metabolism teaching surface exists; tissue-specific realistic cell architectures and macro-to-micro provenance/scale semantics remain incomplete.',
  },
  {
    id: 'surgical-lab',
    label: 'Surgical Education',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/body-explorer',
    requiresExternalAdapter: false,
    requiresPatientData: false,
    requiresWebGL: true,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Surgical layer lab is mounted. Procedure coverage, shared Body Explorer state, structures-at-risk, provenance, and patient-specific data gates remain incomplete.',
  },
  {
    id: 'workout-biomechanics',
    label: 'Workout & Biomechanics',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/body-explorer',
    requiresExternalAdapter: false,
    requiresPatientData: false,
    requiresWebGL: true,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Workout simulation is present, but measured motion must remain distinct from kinematic teaching and source anatomy must not deform to imply physiology.',
  },
  {
    id: 'radiology',
    label: 'Radiology',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/radiology',
    requiresExternalAdapter: true,
    requiresPatientData: true,
    requiresWebGL: true,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Route exists. Patient-specific DICOM, segmentation provenance, synchronized MPR, and reconstruction verification remain separate from educational source anatomy.',
  },
  {
    id: 'frontier-health-os',
    label: 'Frontier Health OS',
    status: 'RESEARCH-ONLY',
    route: '/frontier-health',
    requiresExternalAdapter: true,
    requiresPatientData: true,
    requiresWebGL: false,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Research and integration-stage systems must preserve explicit readiness labels and may not masquerade as validated clinical functionality.',
  },
  {
    id: 'knowledge-bridge',
    label: 'Knowledge Bridge',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/knowledge-bridge',
    requiresExternalAdapter: true,
    requiresPatientData: true,
    requiresWebGL: false,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Route exists; care-episode unification, teach-back persistence, evidence linkage, export, and FHIR/EMR integration remain end-to-end completion criteria.',
  },
  {
    id: 'clinical-hub',
    label: 'Clinical Hub',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/clinical-hub',
    requiresExternalAdapter: true,
    requiresPatientData: true,
    requiresWebGL: false,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Clinical workspace is routed and must retain human review, source provenance, missing-data handling, and non-fabrication boundaries.',
  },
  {
    id: 'med-study-hub',
    label: 'Med Study Hub',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/med-study',
    requiresExternalAdapter: false,
    requiresPatientData: false,
    requiresWebGL: false,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Study hub is routed. Dataset completeness, discoverability, simplified learning flows, and audience-depth modes remain product work rather than stability blockers.',
  },
  {
    id: 'emr',
    label: 'EMR',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/emr',
    requiresExternalAdapter: true,
    requiresPatientData: true,
    requiresWebGL: false,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Existing clinical data surface. External interoperability, consent, provenance, and production data contracts require validation before broader orchestration.',
  },
  {
    id: 'care-episode',
    label: 'Care Episode',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/care-episode',
    requiresExternalAdapter: true,
    requiresPatientData: true,
    requiresWebGL: false,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Use as the shared longitudinal object for Knowledge Bridge and care workflows rather than duplicating patient state.',
  },
  {
    id: 'planning',
    label: 'Planning',
    status: 'FUNCTIONAL-BUT-INCOMPLETE',
    route: '/planning',
    requiresExternalAdapter: false,
    requiresPatientData: false,
    requiresWebGL: false,
    productionReady: false,
    lastValidated: LAST_VALIDATED,
    notes: 'Existing planning surface; orchestration work must reuse it instead of creating another independent task/calendar state.',
  },
] as const

export function getFeatureReadiness(id: string): FeatureReadiness | undefined {
  return FEATURE_READINESS.find((feature) => feature.id === id)
}

export function productionFeatures(): readonly FeatureReadiness[] {
  return FEATURE_READINESS.filter((feature) => feature.productionReady)
}

export function nonProductionFeatures(): readonly FeatureReadiness[] {
  return FEATURE_READINESS.filter((feature) => !feature.productionReady)
}
