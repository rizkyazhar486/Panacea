import { initializeGoldenJourney, advanceEncounterStage } from './singleGoldenJourneyOrchestrator';

describe('Single Golden Longitudinal Clinical Journey Orchestrator - Negative Controls & Safety', () => {
  const pId = 'PAT-SYNTH-001';
  const encId = 'ENC-2026-001';
  const docId = 'DOC-DR-ARIEF';

  test('should initialize correctly', () => {
    const state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
    expect(state.currentStage).toBe('arrival');
    expect(state.version).toBe(1);
  });

  test('negative control: reject direct transition from arrival to closed', () => {
    const state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
    expect(() => {
      advanceEncounterStage(state, 'follow_up_closed', docId, pId, encId);
    }).toThrow();
  });

  test('negative control: reject closure when mandatory obligations are unresolved', () => {
    let state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
    state = advanceEncounterStage(state, 'visit_os_active', docId, pId, encId);
    state = advanceEncounterStage(state, 'lab_ordered', docId, pId, encId);
    state = advanceEncounterStage(state, 'lab_reconciled', docId, pId, encId);
    
    // Attempting to jump or skip signature to close should fail or be blocked by allowed transitions
    expect(() => {
      advanceEncounterStage(state, 'follow_up_closed', docId, pId, encId);
    }).toThrow();
  });

  test('negative control: reject unverified signature for signed_plan', () => {
    let state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
    state = advanceEncounterStage(state, 'visit_os_active', docId, pId, encId);
    state = advanceEncounterStage(state, 'lab_ordered', docId, pId, encId);
    state = advanceEncounterStage(state, 'lab_reconciled', docId, pId, encId);

    const invalidSig = {
      signerId: docId,
      signerRole: 'Attending Physician',
      timestamp: new Date().toISOString(),
      provenanceHash: 'abc',
      isVerified: false
    };

    expect(() => {
      advanceEncounterStage(state, 'signed_plan', docId, pId, encId, invalidSig);
    }).toThrow();
  });
});
