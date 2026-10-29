/**
 * PanaceaMed Directive 027 — Scientific Integrity & Clinical Governance Core
 * Enforces strict scientific boundaries on advanced molecular discovery engines (e.g., ctDNA MRD),
 * ensuring synthetic variant fractions do not trigger unverified automated treatment escalations.
 */

export interface MrdAnalysisInput {
  patientId: string;
  variantAlleleFraction: number; // VAF %
  pbmcSequencingPerformed: boolean;
  assayDepthX: number;
}

export interface AuditedMrdResult {
  analysisId: string;
  patientId: string;
  vafDetected: number;
  clinicalInterpretationStatus: 'REQUIRES_PHYSICIAN_REVIEW' | 'REJECTED_UNVERIFIED_CHIP';
  uncertaintyMargin: number;
  falsifiableTestRequired: string;
  isAutomatedEscalationPermitted: false; // Absolute clinical governance invariant
  auditMessage: string;
}

export function auditCtDnaLiquidBiopsyMrd(input: MrdAnalysisInput): AuditedMrdResult {
  // Scientific Integrity Check: Presence of PBMC sequencing does not automatically exclude CHIP without filtering
  if (!input.pbmcSequencingPerformed || input.assayDepthX < 1000) {
    return {
      analysisId: `MRD-AUDIT-${Date.now()}`,
      patientId: input.patientId,
      vafDetected: input.variantAlleleFraction,
      clinicalInterpretationStatus: 'REJECTED_UNVERIFIED_CHIP',
      uncertaintyMargin: 0.15,
      falsifiableTestRequired: 'Matched leukocyte germline DNA sequencing required to rule out Clonal Hematopoiesis of Indeterminate Potential (CHIP).',
      isAutomatedEscalationPermitted: false,
      auditMessage: 'SAFETY LOCK: VAF cannot be attributed solely to tumor recurrence without matched WBC control and deep sequencing depth.'
    };
  }

  return {
    analysisId: `MRD-AUDIT-${Date.now()}`,
    patientId: input.patientId,
    vafDetected: input.variantAlleleFraction,
    clinicalInterpretationStatus: 'REQUIRES_PHYSICIAN_REVIEW',
    uncertaintyMargin: 0.05,
    falsifiableTestRequired: 'Serial volumetric imaging and multidisciplinary oncology review.',
    isAutomatedEscalationPermitted: false,
    auditMessage: 'Analyzed with uncertainty bounds. Detection of VAF is an untrusted research indicator and does NOT mandate automatic chemotherapy escalation.'
  };
}
