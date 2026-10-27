/** Directive 001B: Authoritative Clinical Trust Boundaries & Longitudinal Orchestrator */

export type EncounterStage = 
  | 'arrival' 
  | 'visit_os_active' 
  | 'lab_ordered' 
  | 'lab_reconciled' 
  | 'signed_plan' 
  | 'patient_explained' 
  | 'follow_up_closed';

export interface ClinicalTask {
  id: string;
  description: string;
  status: 'pending' | 'completed';
  requiredForClosure: boolean;
}

export interface VerifiedSignatureRegistryRecord {
  signerId: string;
  signerRole: string;
  timestamp: string;
  provenanceHash: string;
  isCryptographicallyVerified: boolean;
}

export interface LabResultRecord {
  resultId: string;
  orderId: string;
  patientId: string;
  encounterId: string;
  units: string;
  value: number;
  isReviewedByClinician: boolean;
  sourceProvenance: string;
}

export interface ClinicalJourneyState {
  patientId: string;
  encounterId: string;
  presentingComplaint: string;
  currentStage: EncounterStage;
  authorizedClinicianId: string;
  signatureRecord?: VerifiedSignatureRegistryRecord;
  tasks: ClinicalTask[];
  labResults: LabResultRecord[];
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
    tasks: [
      { id: 'task-history', description: 'Comprehensive clinical history documented', status: 'pending', requiredForClosure: true },
      { id: 'task-lab-review', description: 'Laboratory results verified and reconciled', status: 'pending', requiredForClosure: true },
      { id: 'task-signed-plan', description: 'Authorized clinical management plan signed', status: 'pending', requiredForClosure: true }
    ],
    labResults: [],
    version: 1
  };
}

export function advanceEncounterStage(
  currentState: ClinicalJourneyState,
  targetStage: EncounterStage,
  actorClinicianId: string,
  requestingPatientId: string,
  requestingEncounterId: string,
  signatureRegistry?: VerifiedSignatureRegistryRecord,
  incomingLabResults?: LabResultRecord[],
  taskCompletions?: { id: string; status: 'completed' }[],
  expectedVersion?: number
): ClinicalJourneyState {
  // 1. Atomic Compare-And-Swap Concurrency Check
  if (expectedVersion !== undefined && currentState.version !== expectedVersion) {
    throw new Error('Clinical Concurrency Error: Stale encounter version detected. Atomic CAS failed.');
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

  // 4. Update Tasks Authoritatively
  let updatedTasks = [...currentState.tasks];
  if (taskCompletions) {
    updatedTasks = updatedTasks.map(t => {
      const match = taskCompletions.find(u => u.id === t.id);
      return match ? { ...t, status: match.status } : t;
    });
  }

  // 5. Integrate & Validate Lab Results Authoritatively
  let updatedLabs = [...currentState.labResults];
  if (incomingLabResults && incomingLabResults.length > 0) {
    for (const lab of incomingLabResults) {
      if (lab.patientId !== requestingPatientId || lab.encounterId !== requestingEncounterId) {
        throw new Error('Laboratory Reconciliation Error: Lab result patient or encounter ID mismatch.');
      }
      if (!lab.sourceProvenance || !lab.units) {
        throw new Error('Laboratory Reconciliation Error: Missing source provenance or units in lab result.');
      }
      updatedLabs.push(lab);
    }
  }

  // 6. Strict Stage Guardrails & Negative Controls
  if (targetStage === 'lab_reconciled') {
    const unreviewedLabs = updatedLabs.filter(l => !l.isReviewedByClinician);
    if (updatedLabs.length === 0 || unreviewedLabs.length > 0) {
      throw new Error('Laboratory Safety Block: Cannot proceed without reviewed, order-linked laboratory results.');
    }
    updatedTasks = updatedTasks.map(t => t.id === 'task-lab-review' ? { ...t, status: 'completed' } : t);
  }

  if (targetStage === 'signed_plan') {
    if (!signatureRegistry || !signatureRegistry.isCryptographicallyVerified || signatureRegistry.signerId !== actorClinicianId || !signatureRegistry.provenanceHash) {
      throw new Error('Clinical Authority Error: Valid cryptographic signature verification from authenticated source required.');
    }
    updatedTasks = updatedTasks.map(t => t.id === 'task-signed-plan' ? { ...t, status: 'completed' } : t);
  }

  if (targetStage === 'visit_os_active') {
    updatedTasks = updatedTasks.map(t => t.id === 'task-history' ? { ...t, status: 'completed' } : t);
  }

  if (targetStage === 'follow_up_closed') {
    const unresolvedMandatory = updatedTasks.filter(t => t.requiredForClosure && t.status !== 'completed');
    if (unresolvedMandatory.length > 0) {
      throw new Error(`Clinical Safety Block: Cannot close episode. Unresolved canonical tasks: ${unresolvedMandatory.map(t => t.description).join(', ')}`);
    }
  }

  return {
    ...currentState,
    currentStage: targetStage,
    tasks: updatedTasks,
    labResults: updatedLabs,
    signatureRecord: signatureRegistry || currentState.signatureRecord,
    version: currentState.version + 1
  };
}
