export type ClinicalClaimMaturity =
  | 'technically-working'
  | 'clinician-reviewed'
  | 'clinically-validated'

export interface ClinicalClaimEvidence {
  clinicianReviewed?: boolean
  externalValidation?: boolean
  validationEvidenceIds?: readonly string[]
}

function normalizedEvidenceIds(values: readonly string[] = []) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

/**
 * Clinical maturity is fail-closed.
 *
 * Formula:
 * clinicallyValidated =
 *   clinicianReviewed
 *   AND externalValidation
 *   AND validationEvidenceIds.length > 0
 *
 * Human review alone never upgrades a technical output into a clinically
 * validated capability.
 */
export function clinicalClaimMaturity(
  evidence: ClinicalClaimEvidence = {},
): ClinicalClaimMaturity {
  const validationEvidenceIds = normalizedEvidenceIds(evidence.validationEvidenceIds)
  if (
    evidence.clinicianReviewed === true
    && evidence.externalValidation === true
    && validationEvidenceIds.length > 0
  ) {
    return 'clinically-validated'
  }
  if (evidence.clinicianReviewed === true) return 'clinician-reviewed'
  return 'technically-working'
}

export function clinicalClaimLabel(maturity: ClinicalClaimMaturity) {
  switch (maturity) {
    case 'technically-working':
      return 'Technical output'
    case 'clinician-reviewed':
      return 'Clinician-reviewed'
    case 'clinically-validated':
      return 'Clinically validated'
  }
}

export function clinicalClaimDisclosure(maturity: ClinicalClaimMaturity) {
  switch (maturity) {
    case 'technically-working':
      return 'Not clinician-reviewed or clinically validated.'
    case 'clinician-reviewed':
      return 'Human review recorded; clinical validation is a separate capability-level claim.'
    case 'clinically-validated':
      return 'Clinical validation evidence is explicitly linked to this capability.'
  }
}

/** Healthcare numbers a buyer can mistake for a clinical decision. */
export const PERMUKAAN_KLAIM_KESEHATAN = [  'longevity.biological-age',
  'longevity.score',
  'longevity.body-composition',
  'longevity.organ-vitality',
  'lab.phenoage',
  'lab.blood-trend',
  'calculators.risk',
  'calculators.clinical',
  'screening.mental',
  'screening.epworth',
  'screening.substance',
  'screening.findrisc',
  'screening.chronotype',
  'care.cdss',
  'calculators.published-score',
  'longevity.health-simulator',
  'screening.family-history',
  'clinical.dermatology-mapper',
  'care.second-opinion',
  'longevity.supplements',
  'clinical.drug-info',
  'performance.fitness-test',
  'longevity.shape-forming',
  'clinical.empiric-therapy',
  'clinical.neonatal-resus',
  'clinical.first-aid',
  'lab.decoder',
  'care.ai-chat',
  'genomics.gene-info',
  'environment.air-quality',
  'care.emergency-card',
  'wellness.sleep-debt',
  'wellness.sleep-score',
  'wellness.recovery',
  'performance.readiness',
  'wellness.body-battery',
  'longevity.aesthetic-vitality',
  'wellness.vocal-biomarkers',
  'wellness.self-assessment',
  'wellness.rppg-heart-rate',
  'wellness.alcohol-bac',
  'wellness.caffeine-sleep',
  'wellness.hydration',
  'pediatrics.child-growth',
  'genomics.snp-profiler',
  'wellness.vaccine-tracker',
  'wellness.allergy-tracker',
  'wellness.pain-diary',
  'wellness.sun-exposure',
  'wellness.thermal-therapy',
  'wellness.sleep-toolkit',
  'wellness.sleep-pattern',
  'longevity.movement-toolkit',
  'longevity.mind-toolkit',
  'longevity.predictive-models',
  'longevity.body-toolkit',
  'longevity.nutrition-toolkit',
  'performance.athlete',
  'wellness.phone-health-scan',
  'clinical.trackers',
  'clinical.initial-assessment',
  'clinical.psychiatric-mse',
  'care.mental-safety-plan',
  'genomics.genome-lab',
  'wellness.heart-rate-log',
  'care.organ-donor',
  'wellness.sexual-health',
  'longevity.realistic-health',
  'performance.analisis-pro',
  'longevity.science-explainers',
  'longevity.game-center',
  'wellness.toxin-checklist',
  'wellness.blood-donation',
  'performance.gait-analysis',
  'wellness.fasting-timer',
  'wellness.breathwork',
  'longevity.bio-simulators',
  'care.medication-reminders',
  'wellness.posture-breaks',
  'care.consult-triage',
  'longevity.nutrition-score',
  'performance.athlete-science',
  'lab.data-lab',
  'calculators.hub',
  'clinical.electrophysiology',
  'performance.endurance-tools',
  'performance.health-league',
  'care.episode',
  'wellness.macro-lab',
  'longevity.curriculum',
  'care.cdss-architecture',
  'care.clinical-evidence',
  'care.dashboard-insights',
  'lab.clinician-shared-view',
  'lab.patient-share',
  'lab.what-changed',
  'lab.import-draft',
  'lab.number-rules',
  'wellness.health-profile',
  'wellness.health-sync',
  'performance.multi-sport',
  'performance.strength-log',
  'performance.training-physiology',
  'care.pricing',
  'wellness.hub',
  'clinical.hub',
  'wellness.home-brief',
  'wellness.health-trends',
  'wellness.home-instruments',
  'longevity.nutrition-checklist',
  'performance.lab',
  'performance.sports-lab',
  'wellness.gap-navigator',
  'care.frontier-os',
  'wellness.health-snapshot',
  'body.workspace',
  'care.ai-emr',
  'care.visit-os',
  'wellness.vitapulse',
  'wellness.home-command',
  'wellness.home-overview',
  'wellness.body-energy-card',
  'wellness.sleep-recovery-card',
  'wellness.device-data-card',
  'clinical.body-twin',
  'clinical.manual-flowsheet',
  'wellness.daily-checkin',
  'care.emr-timeline',
  'care.profile',
  'body.exposure-os',
  'body.patient-overlay',
  'body.personal-signals',
  'body.personal-surface',
  'body.pusat-tubuh',
  'body.status-bar',
  'care.doctor-daily-plan',
  'care.hospitals',
  'care.kunjungan-emr',
  'care.lay-education',
  'care.learn',
  'care.learn-workspace',
  'care.patient-education',
  'care.pusat-catatan',
  'care.visit-command',
  'care.visit-prep',
  'clinical.angka-klinis',
  'clinical.diagnosis-notify',
  'clinical.drug-by-complaint',
  'clinical.drug-chain',
  'clinical.ecmo-panel',
  'clinical.evidence-explorer',
  'clinical.lesion-morphology',
  'clinical.library-workbench',
  'clinical.med-study',
  'clinical.medical-3d-lab',
  'clinical.medical-news',
  'clinical.mental-research-lab',
  'clinical.osce',
  'clinical.pharmacy',
  'clinical.pusat-rujukan',
  'clinical.radiology',
  'clinical.sync-status',
  'clinical.trials',
  'clinical.validation-study',
  'longevity.carbon-diet',
  'longevity.nutrition-data-controls',
  'longevity.pusat-gizi',
  'longevity.reality-check',
  'pediatrics.growth-chart',
  'performance.athlete-board',
  'performance.base-training',
  'performance.crossfit',
  'performance.diving',
  'performance.fitness-science-panel',
  'performance.gym-equipment',
  'performance.nutrition-coach',
  'performance.progress-coach',
  'performance.pusat-latihan',
  'performance.recomposition',
  'performance.running-form',
  'performance.session-cockpit',
  'performance.session-organizer',
  'performance.sports-science',
  'performance.sports-scores',
  'performance.stretching',
  'performance.training-analytics',
  'performance.training-plan',
  'performance.workout',
  'performance.workout-history',
  'wellness.change-log',
  'wellness.daily-hub',
  'wellness.daily-notes',
  'wellness.health-alerts',
  'wellness.home',
  'wellness.literacy-coach',
  'wellness.number-panel',
  'wellness.pusat-jiwa',
  'wellness.score-tile',
  'wellness.score-trend',
  'wellness.sleep-nutrition-tile',
  'wellness.tdee-tile',
  'body.explorer',
  'body.multiscale-coupling',
  'care.consult-chat',
  'care.innovation-lab',
  'care.knowledge-bridge',
  'care.landing',
  'care.learn-base',
  'care.login',
  'care.practice-record-link',
  'environment.home-tile',
  'genomics.central-dogma-sim',
  'longevity.food-tile',
  'longevity.ubiquitin-panel',
  'performance.activity-share',
  'performance.fitness-meaning',
  'wellness.daily-plus-tile',
  'wellness.daily-ring-tile',
  'wellness.device-tile',
  'wellness.home-interactive-rail',
  'wellness.home-live-rail',
  'wellness.home-widget',
  'wellness.measure-tile',
  'wellness.monitor-tile',
  'wellness.overview',
  'wellness.share-stat',
] as const

export type PermukaanKlaimKesehatan = (typeof PERMUKAAN_KLAIM_KESEHATAN)[number]

/** Unknown surfaces and missing evidence stay technically working. */
export function klaimPermukaanKesehatan(
  permukaan: string,
  evidence: ClinicalClaimEvidence = {},
): ClinicalClaimMaturity {
  if (!(PERMUKAAN_KLAIM_KESEHATAN as readonly string[]).includes(permukaan)) return 'technically-working'
  return clinicalClaimMaturity(evidence)
}
