/** Directive 001A: Robust Single Golden Longitudinal Clinical Journey Orchestrator */

export type EncounterStage = 
  | 'arrival' 
  | 'visit_os_active' 
  | 'lab_ordered' 
  | 'lab_reconciled' 
  | 'signed_plan' 
  | 'patient_explained' 
  | 'follow_up_closed';

export interface ClinicalObligation {
  id: string;
  description: string;
  isResolved: boolean;
  requiredForClosure: boolean;
}

export interface ClinicalSignatureRecord {
  signerId: string;
  signerRole: string;
  timestamp: string;
  provenanceHash: string;
  isVerified: boolean;
}

export interface ClinicalJourneyState {
  patientId: string;
  encounterId: string;
  presentingComplaint: string;
  currentStage: EncounterStage;
  authorizedClinicianId: string;
  signatureRecord?: ClinicalSignatureRecord;
  obligations: ClinicalObligation[];
  labResultsReconciled: boolean;
  version: number;
}

const ALLOWED_TRANSITIONS: Record<EncounterStage, EncounterStage[]> = {
  arrival: ['visit_os_active'],
  visit_os_active: ['lab_ordered'],
  lab_ordered: ['lab_reconciled'],
  lab_reconciled: ['signed_plan'],
  signed_plan: ['patient_explained'],
  patient_explained: ['follow_up_closed'],
  follow_up_closed: []
};

export function initializeGoldenJourney(
  patientId: string, 
  encounterId: string, 
  presentingComplaint: string, 
  clinicianId: string
): ClinicalJourneyState {
  if (!patientId || !encounterId || !clinicianId) {
    throw new Error('Clinical Security Error: Patient ID, Encounter ID, and Clinician ID are mandatory.');
  }
  return {
    patientId,
    encounterId,
    presentingComplaint,
    currentStage: 'arrival',
    authorizedClinicianId: clinicianId,
    obligations: [
      { id: 'obs-1', description: 'Review vital signs and history', isResolved: false, requiredForClosure: true },
      { id: 'obs-2', description: 'Reconcile laboratory results', isResolved: false, requiredForClosure: true },
      { id: 'obs-3', description: 'Clinician signed management plan', isResolved: false, requiredForClosure: true }
    ],
    labResultsReconciled: false,
    version: 1
  };
}

export function advanceEncounterStage(
  currentState: ClinicalJourneyState,
  targetStage: EncounterStage,
  actorClinicianId: string,
  requestingPatientId: string,
  requestingEncounterId: string,
  signature?: ClinicalSignatureRecord,
  obligationUpdates?: { id: string; isResolved: boolean }[],
  expectedVersion?: number
): ClinicalJourneyState {
  // 1. Concurrency & Version Check
  if (expectedVersion !== undefined && currentState.version !== expectedVersion) {
    throw new Error('Clinical Concurrency Error: Stale encounter version detected.');
  }

  // 2. Identity & Context Integrity Checks
  if (currentState.patientId !== requestingPatientId || currentState.encounterId !== requestingEncounterId) {
    throw new Error('Clinical Security Error: Patient or Encounter identity mismatch.');
  }
  if (currentState.authorizedClinicianId !== actorClinicianId) {
    throw new Error('Clinical Authorization Error: Actor clinician is not authorized for this encounter.');
  }

  // 3. Validate Stage Transition Path
  const allowedNextStages = ALLOWED_TRANSITIONS[currentState.currentStage] || [];
  if (!allowedNextStages.includes(targetStage)) {
    throw new Error(`Clinical Workflow Error: Invalid transition from '${currentState.currentStage}' to '${targetStage}'.`);
  }

  // 4. Update Obligations if provided
  let updatedObligations = [...currentState.obligations];
  if (obligationUpdates) {
    updatedObligations = updatedObligations.map(obs => {
      const match = obligationUpdates.find(u => u.id === obs.id);
      return match ? { ...obs, isResolved: match.isResolved } : obs;
    });
  }

  // 5. Specific Stage Guardrails & Negative Controls
  if (targetStage === 'follow_up_closed') {
    const unresolvedMandatory = updatedObligations.filter(o => o.requiredForClosure && !o.isResolved);
    if (unresolvedMandatory.length > 0) {
      throw new Error(`Clinical Safety Block: Cannot close episode. Unresolved mandatory obligations: ${unresolvedMandatory.map(o => o.description).join(', ')}`);
    }
  }

  if (targetStage === 'signed_plan') {
    if (!signature || !signature.isVerified || signature.signerId !== actorClinicianId || !signature.provenanceHash) {
      throw new Error('Clinical Authority Error: Valid verified clinician signature with provenance hash is strictly required to sign the plan.');
    }
  }

  return {
    ...currentState,
    currentStage: targetStage,
    obligations: updatedObligations,
    signatureRecord: signature || currentState.signatureRecord,
    labResultsReconciled: targetStage === 'lab_reconciled' ? true : currentState.labResultsReconciled,
    version: currentState.version + 1
  };
}
