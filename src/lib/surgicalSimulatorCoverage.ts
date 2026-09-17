import { SPECIALTY_ATLAS_MODULES } from './wholeBodyAtlasBlueprint.ts'

export type SurgicalSimulationDomain =
  | 'general-surgery'
  | 'digestive-surgery'
  | 'cardiovascular-surgery'
  | 'thoracic-surgery'
  | 'surgical-oncology'
  | 'pediatric-surgery'
  | 'urology'
  | 'plastic-reconstructive'
  | 'orthopedic'
  | 'neurosurgery'
  | 'ent-head-neck'
  | 'ophthalmology'
  | 'dermatologic-surgery'
  | 'spine-surgery'
  | 'hand-surgery'
  | 'trauma-surgery'
  | 'laparoscopic-surgery'
  | 'obgyn-surgery'

export interface SurgicalSimulationTarget {
  domain: SurgicalSimulationDomain
  label: string
  representativeSkills: readonly string[]
  fidelityLayers: readonly ('orientation' | 'layering' | 'danger-zones' | 'instrument-path' | 'decision-points' | 'complication-recognition')[]
  patientSpecificPlanningAllowed: false
  autonomousProcedureGuidanceAllowed: false
}

export const SURGICAL_SIMULATION_TARGETS: readonly SurgicalSimulationTarget[] = [
  { domain: 'general-surgery', label: 'General surgery', representativeSkills: ['abdominal-entry','wound-closure','drain-orientation'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'digestive-surgery', label: 'Digestive surgery', representativeSkills: ['bowel-orientation','anastomosis-concept','hepatobiliary-corridor'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','decision-points','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'cardiovascular-surgery', label: 'Cardiovascular surgery', representativeSkills: ['sternotomy-orientation','great-vessel-orientation','bypass-cannulation-concept'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','decision-points','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'thoracic-surgery', label: 'Thoracic surgery', representativeSkills: ['thoracic-entry','lung-hilum-orientation','chest-drain-corridor'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'surgical-oncology', label: 'Surgical oncology', representativeSkills: ['margin-concept','nodal-basin-orientation','resection-plane-concept'], fidelityLayers: ['orientation','layering','danger-zones','decision-points','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'pediatric-surgery', label: 'Pediatric surgery', representativeSkills: ['age-scaled-orientation','congenital-anatomy-context','pediatric-access-concept'], fidelityLayers: ['orientation','layering','danger-zones','decision-points'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'urology', label: 'Urology', representativeSkills: ['retroperitoneal-orientation','urinary-tract-corridor','endoscopic-path-concept'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'plastic-reconstructive', label: 'Plastic & reconstructive surgery', representativeSkills: ['flap-plane-orientation','facial-layering','reconstructive-ladder-concept'], fidelityLayers: ['orientation','layering','danger-zones','decision-points'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'orthopedic', label: 'Orthopedic surgery', representativeSkills: ['joint-approach-orientation','fracture-fixation-concept','arthroplasty-corridor'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','decision-points','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'neurosurgery', label: 'Neurosurgery', representativeSkills: ['cranial-corridor-orientation','spine-neural-orientation','neurovascular-danger-zones'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','decision-points','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'ent-head-neck', label: 'ENT & head-neck surgery', representativeSkills: ['airway-orientation','sinonasal-corridor','neck-dissection-zones'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'ophthalmology', label: 'Ophthalmic surgery', representativeSkills: ['orbit-globe-orientation','anterior-segment-path','extraocular-muscle-context'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'dermatologic-surgery', label: 'Dermatologic surgery', representativeSkills: ['skin-layer-orientation','excision-closure-concept','local-flap-context'], fidelityLayers: ['orientation','layering','danger-zones'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'spine-surgery', label: 'Spine surgery', representativeSkills: ['posterior-spine-corridor','nerve-root-orientation','instrument-trajectory-concept'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'hand-surgery', label: 'Hand surgery', representativeSkills: ['tendon-zone-orientation','carpal-tunnel-corridor','digital-neurovascular-context'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'trauma-surgery', label: 'Trauma surgery', representativeSkills: ['damage-control-orientation','hemorrhage-source-context','emergency-access-concept'], fidelityLayers: ['orientation','danger-zones','decision-points','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'laparoscopic-surgery', label: 'Laparoscopic surgery', representativeSkills: ['camera-navigation','port-geometry-concept','triangulation-concept'], fidelityLayers: ['orientation','danger-zones','instrument-path','decision-points'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
  { domain: 'obgyn-surgery', label: 'Obstetric & gynecologic surgery', representativeSkills: ['pelvic-orientation','cesarean-layering','gynecologic-corridor'], fidelityLayers: ['orientation','layering','danger-zones','instrument-path','complication-recognition'], patientSpecificPlanningAllowed: false, autonomousProcedureGuidanceAllowed: false },
]

const EXISTING_SPECIALTY_TO_TARGET: Readonly<Record<string, SurgicalSimulationDomain>> = {
  'general-surgery': 'general-surgery',
  orthopedic: 'orthopedic',
  plastic: 'plastic-reconstructive',
  neurosurgery: 'neurosurgery',
  cardiothoracic: 'cardiovascular-surgery',
  ENT: 'ent-head-neck',
  ophthalmology: 'ophthalmology',
  urology: 'urology',
  obgyn: 'obgyn-surgery',
}

/**
 * BreadthCoverage = target surgical domains with at least one repository atlas
 * module / total target domains. It measures simulator breadth only, not
 * procedural fidelity, training efficacy, competence, or clinical readiness.
 */
export function auditSurgicalSimulatorCoverage() {
  const coveredDomains = new Set<SurgicalSimulationDomain>()
  for (const module of SPECIALTY_ATLAS_MODULES) {
    const mapped = EXISTING_SPECIALTY_TO_TARGET[module.specialty]
    if (mapped) coveredDomains.add(mapped)
  }

  const targets = SURGICAL_SIMULATION_TARGETS.map((target) => ({
    ...target,
    coveredByExistingAtlasModule: coveredDomains.has(target.domain),
  }))
  const covered = targets.filter((target) => target.coveredByExistingAtlasModule).length
  return {
    targets,
    targetDomainCount: targets.length,
    coveredDomainCount: covered,
    breadthCoverageFraction: targets.length ? covered / targets.length : 0,
    backlog: targets.filter((target) => !target.coveredByExistingAtlasModule).map((target) => ({
      domain: target.domain,
      label: target.label,
      representativeSkills: target.representativeSkills,
      preserveExistingModules: true as const,
      requiresQualifiedReviewBeforeClinicalTrainingClaim: true as const,
    })),
    boundary: {
      educationalSimulationOnly: true as const,
      patientSpecificPlanningAllowed: false as const,
      autonomousProcedureGuidanceAllowed: false as const,
      competenceCertificationClaimAllowed: false as const,
    },
  }
}
