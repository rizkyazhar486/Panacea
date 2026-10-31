/** PanaceaMed - VisitOS & Single Golden Journey UI Bridge */
import React, { useState } from 'react';
import { initializeGoldenJourney, advanceEncounterStage, ClinicalJourneyState } from './singleGoldenJourneyOrchestrator';

export const VisitOSJourneyBridge: React.FC = () => {
  const [journey, setJourney] = useState<ClinicalJourneyState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startEncounter = () => {
    try {
      const initial = initializeGoldenJourney('PAT-SYNTH-001', 'ENC-2026-001', 'Severe Fatigue', 'DOC-DR-ARIEF');
      setJourney(initial);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const advanceStage = (targetStage: any, extraPayload?: any) => {
    if (!journey) return;
    try {
      const updated = advanceEncounterStage(
        journey,
        targetStage,
        'DOC-DR-ARIEF',
        'PAT-SYNTH-001',
        'ENC-2026-001',
        extraPayload?.signature,
        extraPayload?.labs,
        extraPayload?.tasks,
        journey.version
      );
      setJourney(updated);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', maxWidth: '800px', margin: '0 auto', background: '#0b0f19', color: '#f3f4f6', borderRadius: '12px', border: '1px solid #1f2937' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>PanaceaMed VisitOS — Single Golden Journey</h2>
      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>Longitudinal Outpatient Encounter Orchestrator & Clinical Trust Boundary Bridge</p>

      {!journey ? (
        <button onClick={startEncounter} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
          Initialize Synthetic Encounter (Fatigue Presentation)
        </button>
      ) : (
        <div>
          <div style={{ background: '#111827', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #374151' }}>
            <p><strong>Patient ID:</strong> {journey.patientId}</p>
            <p><strong>Encounter ID:</strong> {journey.encounterId}</p>
            <p><strong>Current Stage:</strong> <span style={{ color: '#60a5fa', textTransform: 'uppercase' }}>{journey.currentStage}</span></p>
            <p><strong>Version:</strong> {journey.version}</p>
            <p><strong>Active Clinician:</strong> {journey.authorizedClinicianId}</p>
          </div>

          {errorMsg && (
            <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
              <strong>Clinical Safety Block / Error:</strong> {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {journey.currentStage === 'arrival' && (
              <button onClick={() => advanceStage('visit_os_active', { tasks: [{ id: 'task-history', status: 'completed' }] })} style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                1. Enter VisitOS & Complete History
              </button>
            )}

            {journey.currentStage === 'visit_os_active' && (
              <button onClick={() => advanceStage('lab_ordered')} style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                2. Order Diagnostic Lab Panel
              </button>
            )}

            {journey.currentStage === 'lab_ordered' && (
              <button onClick={() => advanceStage('lab_reconciled', { labs: [{ resultId: 'RES-01', orderId: 'ORD-01', patientId: 'PAT-SYNTH-001', encounterId: 'ENC-2026-001', units: 'g/dL', value: 13.2, isReviewedByClinician: true, sourceProvenance: 'SILOAM-LIS' }] })} style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                3. Reconcile & Review Lab Results
              </button>
            )}

            {journey.currentStage === 'lab_reconciled' && (
              <button onClick={() => advanceStage('signed_plan', { signature: { signerId: 'DOC-DR-ARIEF', signerRole: 'Attending Physician', timestamp: new Date().toISOString(), provenanceHash: 'sig-hash-valid-abc', isCryptographicallyVerified: true } })} style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                4. Sign Management Plan (Cryptographic Auth)
              </button>
            )}

            {journey.currentStage === 'signed_plan' && (
              <button onClick={() => advanceStage('patient_explained')} style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                5. Present Patient-Friendly Explanation
              </button>
            )}

            {journey.currentStage === 'patient_explained' && (
              <button onClick={() => advanceStage('follow_up_closed')} style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                6. Close Episode & Schedule Follow-up
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
