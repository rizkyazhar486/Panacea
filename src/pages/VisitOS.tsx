/** PanaceaMed - Canonical VisitOS Page with Longitudinal Clinical Journey Integration */
import React, { useState } from 'react';
import { initializeGoldenJourney, advanceEncounterStage, ClinicalJourneyState } from '../domains/clinical-operations/journey/singleGoldenJourneyOrchestrator';

export const VisitOS: React.FC = () => {
  const [journey, setJourney] = useState<ClinicalJourneyState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startEncounter = () => {
    try {
      const initial = initializeGoldenJourney('PAT-SYNTH-001', 'ENC-2026-001', 'Severe Fatigue Presentation', 'DOC-DR-ARIEF');
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
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f3f4f6', padding: '32px 16px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '950px', margin: '0 auto' }}>
        <header style={{ marginBottom: '28px', textAlign: 'center', borderBottom: '1px solid #1f2937', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#f9fafb', marginBottom: '8px' }}>PanaceaMed VisitOS — Canonical Care Operating System</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Authorized Longitudinal Outpatient Encounter & Cryptographically Secured Clinical Decision Support</p>
        </header>

        <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#60a5fa', marginBottom: '12px' }}>Single Golden Longitudinal Patient Journey</h3>
          
          {!journey ? (
            <div>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                Initialize a secure, authenticated outpatient encounter with strict trust boundaries, concurrency checks, and verified lab reconciliation.
              </p>
              <button onClick={startEncounter} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                Initialize Synthetic Encounter (PAT-SYNTH-001)
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px', background: '#1f2937', padding: '16px', borderRadius: '8px' }}>
                <div><span style={{ color: '#9ca3af', fontSize: '12px' }}>Patient ID:</span><div style={{ fontWeight: 600 }}>{journey.patientId}</div></div>
                <div><span style={{ color: '#9ca3af', fontSize: '12px' }}>Encounter ID:</span><div style={{ fontWeight: 600 }}>{journey.encounterId}</div></div>
                <div><span style={{ color: '#9ca3af', fontSize: '12px' }}>Current Stage:</span><div style={{ fontWeight: 600, color: '#34d399', textTransform: 'uppercase' }}>{journey.currentStage}</div></div>
                <div><span style={{ color: '#9ca3af', fontSize: '12px' }}>Encounter Version (CAS):</span><div style={{ fontWeight: 600 }}>v{journey.version}</div></div>
              </div>

              {errorMsg && (
                <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', border: '1px solid #991b1b' }}>
                  <strong>Clinical Safety Block / Guardrail:</strong> {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {journey.currentStage === 'arrival' && (
                  <button onClick={() => advanceStage('visit_os_active', { tasks: [{ id: 'task-history', status: 'completed' }] })} style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                    1. Enter VisitOS & Document History
                  </button>
                )}

                {journey.currentStage === 'visit_os_active' && (
                  <button onClick={() => advanceStage('lab_ordered')} style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                    2. Order Diagnostic Laboratory Panel
                  </button>
                )}

                {journey.currentStage === 'lab_ordered' && (
                  <button onClick={() => advanceStage('lab_reconciled', { labs: [{ resultId: 'RES-01', orderId: 'ORD-01', patientId: 'PAT-SYNTH-001', encounterId: 'ENC-2026-001', units: 'g/dL', value: 13.2, isReviewedByClinician: true, sourceProvenance: 'SILOAM-LIS-ADAPTER' }] })} style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                    3. Reconcile & Review Verified Lab Results
                  </button>
                )}

                {journey.currentStage === 'lab_reconciled' && (
                  <button onClick={() => advanceStage('signed_plan', { signature: { signerId: 'DOC-DR-ARIEF', signerRole: 'Attending Physician', timestamp: new Date().toISOString(), provenanceHash: 'sha256-cryptographic-auth-sig-xyz', isCryptographicallyVerified: true } })} style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                    4. Authorize & Cryptographically Sign Plan
                  </button>
                )}

                {journey.currentStage === 'signed_plan' && (
                  <button onClick={() => advanceStage('patient_explained')} style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                    5. Present Plain-Language Patient Explanation
                  </button>
                )}

                {journey.currentStage === 'patient_explained' && (
                  <button onClick={() => advanceStage('follow_up_closed')} style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                    6. Safe Episode Closure & Schedule Follow-up
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitOS;
