/** Directive 001: Single Golden Longitudinal Clinical Journey Orchestrator */
export interface ClinicalJourneyState {
  patientId: string;
  presentingComplaint: string;
  encounterStage: 'arrival' | 'visit_os_active' | 'lab_ordered' | 'lab_reconciled' | 'signed_plan' | 'patient_explained' | 'follow_up_closed';
  clinicianId: string;
  aiAssistanceUsed: boolean;
  clinicianSigned: boolean;
  unresolvedObligationsCount: number;
}

export function initializeGoldenJourney(patientId: string, presentingComplaint: string, clinicianId: string): ClinicalJourneyState {
  return {
    patientId,
    presentingComplaint,
    encounterStage: 'arrival',
    clinicianId,
    aiAssistanceUsed: false,
    clinicianSigned: false,
    unresolvedObligationsCount: 3
  };
}

export function advanceEncounterStage(
  state: ClinicalJourneyState, 
  nextStage: ClinicalJourneyState['encounterStage'], 
  clinicianSigned: boolean,
  hasUnresolvedTasks: boolean
): ClinicalJourneyState {
  if (nextStage === 'follow_up_closed' && hasUnresolvedTasks) {
    throw new Error('Clinical Safety Block: Cannot close episode while required clinical obligations remain unresolved.');
  }
  return {
    ...state,
    encounterStage: nextStage,
    clinicianSigned,
    unresolvedObligationsCount: hasUnresolvedTasks ? 1 : 0
  };
}
