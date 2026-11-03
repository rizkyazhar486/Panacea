import React, { useState, useMemo } from 'react';
import {
  evaluatePantheonClinicalConsensus,
  type BedsideCdsOrchestrationInput,
  type PantheonConsensusEvaluation,
} from '../model/pantheonClinicalConsensusEngine.ts';

const PRESETS: Record<string, { label: string; description: string; input: BedsideCdsOrchestrationInput }> = {
  'cardio-sepsis': {
    label: 'Septic Shock + HFrEF (Cardio-Sepsis Conflict)',
    description: 'Hypotension + hyperlactatemia with severe systolic dysfunction (LVEF 25%). Risk of fatal pulmonary edema if full 30 mL/kg given.',
    input: {
      patientId: 'PT-ICU-CARDIO-01',
      weightKg: 70,
      meanArterialPressureMmHg: 56,
      systolicBpMmHg: 82,
      heartRateBpm: 118,
      respiratoryRateBpm: 26,
      lactateMmolL: 4.4,
      repeatLactateMmolL: null,
      serumCreatinineMgDl: 1.9,
      eGfrOrCrClMlMin: 38,
      lvefPercentage: 25,
      activeInfectionSource: 'Right lower lobe pneumonia / sepsis',
      prescribedAntimicrobial: 'Cefepime 2g IV',
      concomitantNephrotoxins: [],
      triageTimeZeroIso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      evaluationTimeIso: new Date().toISOString(),
      actionRecords: [
        { element: 'LACTATE_MEASUREMENT', performedAtIso: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
        { element: 'BLOOD_CULTURES_PRIOR_ANTIBIOTICS', performedAtIso: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      ],
    },
  },
  'renal-synergy': {
    label: 'Renal Sepsis (Vancomycin + Pip-Tazo AKI Synergy)',
    description: 'Septic patient receiving dual nephrotoxic combination with underlying CKD stage 3b (CrCl 28 mL/min).',
    input: {
      patientId: 'PT-ICU-RENAL-02',
      weightKg: 80,
      meanArterialPressureMmHg: 68,
      systolicBpMmHg: 102,
      heartRateBpm: 94,
      respiratoryRateBpm: 20,
      lactateMmolL: 2.6,
      serumCreatinineMgDl: 2.5,
      eGfrOrCrClMlMin: 28,
      lvefPercentage: 55,
      activeInfectionSource: 'Complicated intra-abdominal sepsis',
      prescribedAntimicrobial: 'Vancomycin + Piperacillin-Tazobactam',
      concomitantNephrotoxins: ['Piperacillin-Tazobactam', 'IV Contrast (recent)'],
      triageTimeZeroIso: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      evaluationTimeIso: new Date().toISOString(),
      actionRecords: [
        { element: 'LACTATE_MEASUREMENT', performedAtIso: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
      ],
    },
  },
  'standard-shock': {
    label: 'Standard Septic Shock (Normal LV Function)',
    description: 'Classic septic shock requiring aggressive 30 mL/kg fluid resuscitation and early Norepinephrine titration.',
    input: {
      patientId: 'PT-ICU-SHOCK-03',
      weightKg: 65,
      meanArterialPressureMmHg: 52,
      systolicBpMmHg: 78,
      heartRateBpm: 124,
      respiratoryRateBpm: 28,
      lactateMmolL: 5.1,
      serumCreatinineMgDl: 1.2,
      eGfrOrCrClMlMin: 75,
      lvefPercentage: 60,
      activeInfectionSource: 'Urosepsis with bacteremia',
      prescribedAntimicrobial: 'Meropenem 1g IV',
      concomitantNephrotoxins: [],
      triageTimeZeroIso: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      evaluationTimeIso: new Date().toISOString(),
      actionRecords: [],
    },
  },
  'hfref-outpatient': {
    label: 'HFrEF Outpatient GDMT Optimization',
    description: 'Compensated heart failure with reduced ejection fraction for 4-pillar GDMT titration evaluation.',
    input: {
      patientId: 'PT-CLIN-HF-04',
      weightKg: 72,
      meanArterialPressureMmHg: 84,
      systolicBpMmHg: 118,
      heartRateBpm: 68,
      respiratoryRateBpm: 16,
      lactateMmolL: null,
      serumCreatinineMgDl: 1.1,
      eGfrOrCrClMlMin: 68,
      lvefPercentage: 32,
      triageTimeZeroIso: new Date().toISOString(),
      evaluationTimeIso: new Date().toISOString(),
    },
  },
};

export function PantheonClinicalDecisionSupportConsole() {
  const [activeKey, setActiveKey] = useState<string>('cardio-sepsis');
  const activePreset = PRESETS[activeKey] ?? PRESETS['cardio-sepsis'];

  const evaluation: PantheonConsensusEvaluation = useMemo(() => {
    return evaluatePantheonClinicalConsensus(activePreset.input);
  }, [activePreset]);

  const triageBadgeStyle = useMemo(() => {
    switch (evaluation.overallTriageTier) {
      case 'HIGH_RISK_ICU_ALERT':
        return { background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5' };
      case 'MODERATE_ACUITY':
        return { background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.5)', color: '#fcd34d' };
      default:
        return { background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#6ee7b7' };
    }
  }, [evaluation.overallTriageTier]);

  return (
    <section
      data-testid="pantheon-cds-console"
      aria-label="Pantheon Multi-Agent Clinical Consensus Console"
      style={{
        background: '#0a0f1d',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '20px',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header & Scenario Selection */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#38bdf8' }}>
              ICU Bedside CDS · Pantheon Arbiter
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, ...triageBadgeStyle }}>
              {evaluation.overallTriageTier.replace(/_/g, ' ')}
            </span>
          </div>
          <h2 style={{ margin: '6px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
            Multi-Agent Cross-Specialty Clinical Consensus
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
            Surviving Sepsis Campaign (2021) · AHA/ACC HFSA (2022) · KDIGO AKI (2024)
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Consensus Alignment</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: evaluation.consensusScorePct >= 70 ? '#34d399' : '#f87171' }}>
            {evaluation.consensusScorePct}%
          </div>
        </div>
      </div>

      {/* Preset Scenario Selector Buttons */}
      <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {Object.entries(PRESETS).map(([key, scenario]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveKey(key)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeKey === key ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              background: activeKey === key ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
              color: activeKey === key ? '#ffffff' : 'rgba(255,255,255,0.7)',
            }}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
        Scenario Context: {activePreset.description}
      </div>

      {/* Guideline Conflict Alerts Banner */}
      {evaluation.detectedGuidelineConflicts.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {evaluation.detectedGuidelineConflicts.map((c) => (
            <div
              key={c.conflictId}
              style={{
                borderRadius: '10px',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                background: 'rgba(245, 158, 11, 0.08)',
                padding: '12px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                  Guideline Contradiction Arbiter Alert
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                  {c.competingGuidelines[0]} vs. {c.competingGuidelines[1]}
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                {c.conflictDescription}
              </p>
              <div style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#a7f3d0' }}>
                <strong>Consensus Resolution:</strong> {c.arbiterResolutionStrategy}
              </div>
              <div style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#93c5fd' }}>
                <strong>Recommended Action:</strong> {c.clinicalAction}
              </div>
              {c.contraindicatedActions.length > 0 && (
                <div style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#fca5a5' }}>
                  <strong>Contraindicated:</strong> {c.contraindicatedActions.join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: SSC 1-Hour Bundle & Specialist Voting Matrix */}
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Surviving Sepsis 1-Hour Bundle */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
              Surviving Sepsis 1-Hour Bundle
            </h3>
            {evaluation.sepsisBundleStatus && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: evaluation.sepsisBundleStatus.bundleMetOnTime ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)', color: evaluation.sepsisBundleStatus.bundleMetOnTime ? '#34d399' : '#f87171' }}>
                {evaluation.sepsisBundleStatus.bundleMetOnTime ? 'Compliant' : 'Intervention Needed'}
              </span>
            )}
          </div>

          {evaluation.sepsisBundleStatus ? (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.values(evaluation.sepsisBundleStatus.elementEvaluations).map((elem) => (
                <div
                  key={elem.element}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    fontSize: '12px',
                    borderLeft: elem.status === 'COMPLETED_ON_TIME' ? '3px solid #34d399' : elem.status === 'OVERDUE_BREACH' ? '3px solid #f87171' : elem.status === 'CONTRAINDICATED_OR_EXCLUDED' ? '3px solid #fbbf24' : '3px solid #38bdf8',
                  }}
                >
                  <span style={{ color: '#ffffff', fontWeight: 500 }}>
                    {elem.element.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: elem.status === 'COMPLETED_ON_TIME' ? '#34d399' : elem.status === 'OVERDUE_BREACH' ? '#f87171' : 'rgba(255,255,255,0.7)' }}>
                    {elem.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}

              {evaluation.sepsisBundleStatus.sequenceBreachWarnings.length > 0 && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                  ⚠️ {evaluation.sepsisBundleStatus.sequenceBreachWarnings[0]}
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Patient does not meet acute sepsis criteria (normal hemodynamics & no active infection source).
            </div>
          )}
        </div>

        {/* Multi-Agent Specialist Voting Matrix */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
            Specialist Council Votes
          </h3>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {evaluation.agentVotes.map((vote) => (
              <div
                key={vote.specialty}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                    {vote.agentName}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: vote.urgencyTier === 'CRITICAL_ACTION_REQUIRED' ? '#f87171' : vote.urgencyTier === 'ELEVATED' ? '#fbbf24' : '#34d399' }}>
                    {vote.urgencyTier} ({vote.voteScorePct}%)
                  </span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>
                  <strong>Concern:</strong> {vote.primaryConcern}
                </div>
                <div style={{ marginTop: '2px', fontSize: '11px', color: '#6ee7b7' }}>
                  <strong>Rec:</strong> {vote.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unified Action Checklist */}
      <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
          Synthesized Bedside Action Protocol
        </h3>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {evaluation.unifiedActionChecklist.map((act) => (
            <div
              key={act.priority}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#38bdf8', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                {act.priority}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>[{act.category}]</span>{' '}
                <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>{act.instruction}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#38bdf8', whiteSpace: 'nowrap' }}>
                {act.timingWindow}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Governance & Truth Class Footer */}
      <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div>
          <span>Truth Class: <code>{evaluation.truthClass}</code></span> ·{' '}
          <span style={{ color: '#fcd34d' }}>Physician Sign-Off Required</span> ·{' '}
          <span>clinically_reviewed: false</span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
          SHA-256 Digest: {evaluation.auditDigestSha256.slice(0, 16)}...
        </div>
      </div>
    </section>
  );
}

export default PantheonClinicalDecisionSupportConsole;
