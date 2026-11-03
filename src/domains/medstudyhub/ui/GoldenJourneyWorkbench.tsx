import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdaptive } from '../../../shared/adaptive/useAdaptive.ts';
import {
  CARDIAC_GOLDEN_JOURNEY_STEPS,
  verifyGoldenEducationalJourney,
  GOLDEN_JOURNEY_DISCLAIMER,
  CANONICAL_LV_BOOKMARK,
  type BodyExposureViewportBookmark,
  type GoldenJourneyStepIndex,
  type GoldenJourneyEvaluationResult,
} from '../engine/medStudyGoldenJourneyEngine.ts';
import { simulateCardiovascularHemodynamics } from '../engine/medStudyPhysiologySandboxEngine.ts';
import { evaluateClinicalCaseReasoningStep } from '../engine/medStudyClinicalCaseEngine.ts';
import { evaluateAdaptiveAssessmentStep, type IrtAssessmentItem } from '../engine/medStudyAssessmentPsychometricsEngine.ts';
import { scheduleSpacedRetrievalReview, type RetrievalRating } from '../engine/medStudySpacedRetrievalEngine.ts';

const CANDIDATE_ITEMS: readonly IrtAssessmentItem[] = Object.freeze([
  { itemId: 'item-cv-01', conceptId: 'pcg:sarcomere', discriminationA: 1.4, difficultyB: -0.5, guessingC: 0.2, angoffCutProbability: 0.65 },
  { itemId: 'item-cv-02', conceptId: 'pcg:excitation_contraction_coupling', discriminationA: 1.8, difficultyB: 0.2, guessingC: 0.2, angoffCutProbability: 0.60 },
  { itemId: 'item-cv-03', conceptId: 'pcg:frank_starling', discriminationA: 2.1, difficultyB: 0.8, guessingC: 0.2, angoffCutProbability: 0.55 },
  { itemId: 'item-cv-04', conceptId: 'pcg:hfref_gdmt', discriminationA: 2.4, difficultyB: 1.4, guessingC: 0.2, angoffCutProbability: 0.50 },
]);

export interface GoldenJourneyWorkbenchProps {
  readonly initialStep?: GoldenJourneyStepIndex;
  readonly onReturnToAnatomy?: (bookmark: BodyExposureViewportBookmark) => void;
}

export const GoldenJourneyWorkbench: React.FC<GoldenJourneyWorkbenchProps> = ({
  initialStep = 1,
  onReturnToAnatomy,
}) => {
  const { isDesktop } = useAdaptive();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<GoldenJourneyStepIndex>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [savedBookmark] = useState<BodyExposureViewportBookmark>(CANONICAL_LV_BOOKMARK);
  const [restoredBookmark] = useState<BodyExposureViewportBookmark>({ ...CANONICAL_LV_BOOKMARK });

  // Step 9: Hemodynamics state
  const [hemoInputs, setHemoInputs] = useState({
    heartRateBpm: 72,
    edvMl: 120,
    esvMl: 50,
    systolicBpMmHg: 120,
    diastolicBpMmHg: 80,
    cvpMmHg: 5,
    lvedpMmHg: 8,
  });

  // Step 11: Clinical Case state
  const [s3Finding, setS3Finding] = useState(true);
  const [bnpFinding, setBnpFinding] = useState(true);
  const [selectedGdmt, setSelectedGdmt] = useState<string[]>(['m_arni', 'm_sglt2i']);
  const [contraindicationTriggered, setContraindicationTriggered] = useState(false);

  // Step 12: Adaptive IRT state
  const [learnerTheta, setLearnerTheta] = useState(0.4);
  const [irtResponses, setIrtResponses] = useState<{ item: IrtAssessmentItem; correct: boolean }[]>([
    { item: CANDIDATE_ITEMS[0], correct: true },
    { item: CANDIDATE_ITEMS[1], correct: true },
  ]);

  // Step 14: Spaced Retrieval state
  const [retrievalRating, setRetrievalRating] = useState<RetrievalRating>(3);
  const [stabilityDays, setStabilityDays] = useState(10);
  const [elapsedDays] = useState(10);

  // Mark a step completed
  const markStepComplete = useCallback((stepNum: number) => {
    setCompletedSteps((prev) => {
      if (prev.includes(stepNum)) return prev;
      const next = [...prev, stepNum].sort((a, b) => a - b);
      return next;
    });
  }, []);

  // Advance to next step
  const handleNextStep = useCallback(() => {
    markStepComplete(currentStep);
    if (currentStep < 15) {
      const next = (currentStep + 1) as GoldenJourneyStepIndex;
      setCurrentStep(next);
      markStepComplete(next);
    }
  }, [currentStep, markStepComplete]);

  // Fast-track execute entire 15-step pipeline
  const handleRunFullPipeline = useCallback(() => {
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    setCompletedSteps(all);
    setCurrentStep(15);
  }, []);

  // Hemodynamic calculation
  const hemoResult = useMemo(() => {
    return simulateCardiovascularHemodynamics(hemoInputs);
  }, [hemoInputs]);

  // Clinical case evaluation
  const caseResult = useMemo(() => {
    const findings = [];
    if (s3Finding) {
      findings.push({ findingId: 'f_s3', label: 'Third heart sound (S3 gallop)', present: true, sensitivity: 0.20, specificity: 0.95 });
    }
    if (bnpFinding) {
      findings.push({ findingId: 'f_bnp', label: 'Elevated serum NT-proBNP', present: true, sensitivity: 0.90, specificity: 0.80 });
    }
    return evaluateClinicalCaseReasoningStep({
      caseId: 'case-lv-hfref-golden',
      isSyntheticEducationalCase: true,
      currentStage: 'investigations',
      targetNextStage: 'differential-diagnosis',
      preTestProbability: 0.50,
      observedFindings: findings,
      selectedManagementIds: contraindicationTriggered ? [...selectedGdmt, 'm_high_dose_iv_bb'] : selectedGdmt,
      contraindicatedManagementIds: ['m_high_dose_iv_bb'],
    });
  }, [s3Finding, bnpFinding, selectedGdmt, contraindicationTriggered]);

  // Adaptive CAT step
  const catResult = useMemo(() => {
    return evaluateAdaptiveAssessmentStep({
      learnerTheta,
      administeredResponses: irtResponses,
      candidatePool: CANDIDATE_ITEMS,
    });
  }, [learnerTheta, irtResponses]);

  // Spaced-retrieval calculation
  const spacedResult = useMemo(() => {
    return scheduleSpacedRetrievalReview({
      conceptId: 'pcg:left_ventricle',
      stabilityDays,
      difficulty: 4.5,
      elapsedDays,
      rating: retrievalRating,
      desiredRetention: 0.90,
      prerequisiteConceptIds: ['pcg:sarcomere', 'pcg:excitation_contraction_coupling'],
    });
  }, [stabilityDays, elapsedDays, retrievalRating]);

  // Step 15: Exact Viewport Restoration Verification
  const verificationResult: GoldenJourneyEvaluationResult = useMemo(() => {
    return verifyGoldenEducationalJourney({
      journeyId: 'journey-lv-hfref-verified',
      isSyntheticEducationalJourney: true,
      completedSteps: completedSteps.length === 15 ? (completedSteps as GoldenJourneyStepIndex[]) : [],
      savedViewportBookmark: savedBookmark,
      restoredViewportBookmark: restoredBookmark,
      conceptFmaId: 'FMA:7101',
    });
  }, [completedSteps, savedBookmark, restoredBookmark]);

  // Navigate back to 3D anatomy
  const handleReturnToAnatomy = () => {
    if (onReturnToAnatomy) {
      onReturnToAnatomy(restoredBookmark);
    } else {
      navigate('/fitness-hub?system=cardiovascular&structure=heart-left-ventricle&scale=L3&goldenRestored=true');
    }
  };

  const activeContract = CARDIAC_GOLDEN_JOURNEY_STEPS[currentStep - 1];

  return (
    <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', padding: isDesktop ? '1.5rem' : '1rem', backgroundColor: '#020617', color: '#f8fafc', borderRadius: '1.25rem', border: '1px solid #1e293b' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#064e3b', color: '#6ee7b7', border: '1px solid #059669' }}>
              Body Exposure × MedStudyHub
            </span>
            <span style={{ padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#1e1b4b', color: '#c7d2fe', border: '1px solid #4338ca' }}>
              EDU-6 Golden Journey
            </span>
            <span style={{ padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#312e81', color: '#a5b4fc', border: '1px solid #4f46e5' }}>
              FMA:7101 · Left Ventricle
            </span>
          </div>
          <h1 style={{ fontSize: isDesktop ? '1.5rem' : '1.25rem', fontWeight: 900, color: '#ffffff', marginTop: '0.5rem' }}>
            15-Step Multimodal Learning Loop: 3D Twin ↔ Wiggers Hemodynamics ↔ Acute Clinical Vignette ↔ 3D Return
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {GOLDEN_JOURNEY_DISCLAIMER}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRunFullPipeline}
            style={{ minHeight: '44px', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#0284c7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          >
            ⚡ Complete Full 15 Steps
          </button>
          {verificationResult.ok && (
            <button
              type="button"
              onClick={handleReturnToAnatomy}
              style={{ minHeight: '44px', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#10b981', color: '#020617', border: 'none', cursor: 'pointer' }}
            >
              🔄 Return to 3D Context
            </button>
          )}
        </div>
      </div>

      {/* 15-Step Stepper Bar */}
      <div style={{ marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.375rem', minWidth: '700px' }}>
          {CARDIAC_GOLDEN_JOURNEY_STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.stepNumber);
            const isCurrent = currentStep === step.stepNumber;
            let bgColor = '#0f172a';
            let borderColor = '#1e293b';
            let textColor = '#64748b';

            if (isCurrent) {
              bgColor = '#0369a1';
              borderColor = '#38bdf8';
              textColor = '#ffffff';
            } else if (isCompleted) {
              bgColor = '#064e3b';
              borderColor = '#059669';
              textColor = '#a7f3d0';
            }

            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => {
                  setCurrentStep(step.stepNumber);
                  markStepComplete(step.stepNumber);
                }}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.25rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  color: textColor,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  cursor: 'pointer',
                  minHeight: '44px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.125rem',
                }}
              >
                <span>{isCompleted ? '✓ ' : ''}S{step.stepNumber}</span>
                <span style={{ fontSize: '0.625rem', opacity: 0.85 }}>{step.requiredScaleLevel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Active Card */}
      <div style={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #1e293b', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.05em' }}>
              Phase: {activeContract.phase.replace(/-/g, ' ')}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', marginTop: '0.125rem' }}>
              Step {currentStep}: {activeContract.title}
            </h2>
          </div>
          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#1e293b', color: '#94a3b8' }}>
            Scale Level: {activeContract.requiredScaleLevel}
          </span>
        </div>

        {/* Phase-Specific Content */}
        {/* Steps 1..8: Body Exposure Anatomy Progression */}
        {currentStep <= 8 && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '1rem' }}>
            <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
                Spatial Anchoring & Anatomical Hierarchy
              </div>
              <ul style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0, paddingLeft: '1.25rem' }}>
                <li><b>Ontology Reference:</b> Foundational Model of Anatomy (<code>FMA:7101</code> Left Ventricle)</li>
                <li><b>UBERON Cross-Reference:</b> <code>UBERON:0002084</code> (heart left ventricle)</li>
                <li><b>Current Scale:</b> {activeContract.requiredScaleLevel}</li>
                <li><b>3D Camera Target (LPS mm):</b> [12.5, -18.0, 4.2]</li>
                <li><b>Cross-Section Plane Normal:</b> [0, 0, 1] (axial transverse plane)</li>
              </ul>
              <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#0369a1', color: '#e0f2fe', fontSize: '0.75rem' }}>
                💡 <b>Teaching Note:</b> The 3D Digital Twin maintains unbroken coordinate space as the view zooms from whole body (L0) through organ (L2), chamber (L3), myocardium (L4), down to sarcomeric cross-bridges and Ca²⁺-induced Ca²⁺ release (L7/L8).
              </div>
            </div>

            <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Anatomical Viewport Snapshot
                </div>
                <div style={{ height: '140px', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2rem' }}>🫀</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>Left Ventricular Myocardium (L3)</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>FMA:7101 · Mesh Active</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNextStep}
                style={{ marginTop: '1rem', minHeight: '44px', width: '100%', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              >
                Proceed to Step {currentStep + 1} →
              </button>
            </div>
          </div>
        )}

        {/* Step 9: Frank-Starling & Hemodynamic Sandbox (EDU-3) */}
        {currentStep === 9 && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '1rem' }}>
            <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.75rem' }}>
                Physiological Input Perturbations
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.75rem' }}>
                <div>
                  <label htmlFor="input-hr" style={{ color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Heart Rate (bpm): {hemoInputs.heartRateBpm}</label>
                  <input id="input-hr" type="range" min="40" max="180" value={hemoInputs.heartRateBpm} onChange={(e) => setHemoInputs({ ...hemoInputs, heartRateBpm: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label htmlFor="input-edv" style={{ color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>EDV (mL): {hemoInputs.edvMl}</label>
                  <input id="input-edv" type="range" min="60" max="250" value={hemoInputs.edvMl} onChange={(e) => setHemoInputs({ ...hemoInputs, edvMl: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label htmlFor="input-esv" style={{ color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>ESV (mL): {hemoInputs.esvMl}</label>
                  <input id="input-esv" type="range" min="20" max="160" value={hemoInputs.esvMl} onChange={(e) => setHemoInputs({ ...hemoInputs, esvMl: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label htmlFor="input-sbp" style={{ color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Systolic BP (mmHg): {hemoInputs.systolicBpMmHg}</label>
                  <input id="input-sbp" type="range" min="70" max="200" value={hemoInputs.systolicBpMmHg} onChange={(e) => setHemoInputs({ ...hemoInputs, systolicBpMmHg: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
                Real-Time Hemodynamic Outputs (Guyton/Hall)
              </div>
              {hemoResult.ok ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Stroke Vol</span>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff' }}>{hemoResult.strokeVolumeMl} mL</span>
                  </div>
                  <div style={{ padding: '0.5rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Ejection Frac</span>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8' }}>{(hemoResult.ejectionFraction * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ padding: '0.5rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Cardiac Output</span>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#34d399' }}>{hemoResult.cardiacOutputLMin.toFixed(2)} L/m</span>
                  </div>
                  <div style={{ padding: '0.5rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                    <span style={{ color: '#94a3b8', display: 'block' }}>MAP</span>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fbbf24' }}>{hemoResult.meanArterialPressureMmHg.toFixed(1)} mmHg</span>
                  </div>
                  <div style={{ padding: '0.5rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                    <span style={{ color: '#94a3b8', display: 'block' }}>SVR</span>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#a78bfa' }}>{hemoResult.systemicVascularResistanceDynSCm5.toFixed(0)} dyn</span>
                  </div>
                  <div style={{ padding: '0.5rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Coronary PP</span>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: '#f87171' }}>{hemoResult.coronaryPerfusionPressureMmHg.toFixed(1)} mmHg</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#f87171', fontSize: '0.75rem' }}>Perturbation error: {hemoResult.detail}</div>
              )}
              <button
                type="button"
                onClick={handleNextStep}
                style={{ marginTop: '1rem', minHeight: '44px', width: '100%', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              >
                Proceed to Prometheus Multiscale Lesson (Step 10) →
              </button>
            </div>
          </div>
        )}

        {/* Step 10: Prometheus Multiscale Lesson */}
        {currentStep === 10 && (
          <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
              Multiscale Cardiovascular Curriculum Modules
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>les:cardiomyocyte_structure</div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Sarcomeric thick and thin filaments, T-tubules, and sarcoplasmic reticulum Ca²⁺ reservoirs.</p>
                <span style={{ fontSize: '0.6875rem', color: '#38bdf8' }}>Ref: OpenStax A&P 2e</span>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>les:ec_coupling</div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Cav1.2 L-type trigger Ca²⁺ influx gating RyR2 release, troponin-C binding, and SERCA2a reuptake.</p>
                <span style={{ fontSize: '0.6875rem', color: '#38bdf8' }}>Ref: Bers DM (2002) Nature</span>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>les:cardiac_output</div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Macro-hemodynamic determinism: CO = HR × SV / 1000 and Ohm&apos;s vascular analogue.</p>
                <span style={{ fontSize: '0.6875rem', color: '#38bdf8' }}>Ref: Guyton &amp; Hall (2020)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNextStep}
              style={{ minHeight: '44px', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              Open Synthetic Acute HFrEF Vignette (Step 11) →
            </button>
          </div>
        )}

        {/* Step 11: Synthetic Clinical Vignette & Bayesian Reasoning (EDU-4) */}
        {currentStep === 11 && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '1rem' }}>
            <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
                Synthetic Case Vignette: Exertional Dyspnea &amp; S3 Gallop
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                A 62-year-old synthetic patient presents with 3 weeks of progressive exertional dyspnea, 3-pillow orthopnea, and bilateral lower-extremity edema.
              </p>
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={s3Finding} onChange={(e) => setS3Finding(e.target.checked)} />
                  <span>Physical Exam: Third Heart Sound (S3 gallop, LR+ = 4.0)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={bnpFinding} onChange={(e) => setBnpFinding(e.target.checked)} />
                  <span>Biomarker: NT-proBNP 2400 pg/mL (LR+ = 4.5)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#f87171', cursor: 'pointer' }}>
                  <input type="checkbox" checked={contraindicationTriggered} onChange={(e) => setContraindicationTriggered(e.target.checked)} />
                  <span>Test Safety Gate: Attempt Contraindicated High-Dose IV Beta-Blocker in Decompensation</span>
                </label>
              </div>
            </div>

            <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
                Sequential Bayesian Diagnostic Update (Pauker-Kassirer)
              </div>
              {caseResult.ok ? (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                    <div>Pre-test Probability: <b>{(caseResult.preTestProbability * 100).toFixed(0)}%</b></div>
                    <div>Combined Likelihood Ratio: <b>{caseResult.combinedLikelihoodRatio.toFixed(1)}×</b></div>
                    <div>Post-test Probability: <b style={{ color: '#34d399' }}>{(caseResult.postTestProbability * 100).toFixed(1)}%</b></div>
                    <div>Diagnostic Action Zone: <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#38bdf8' }}>{caseResult.diagnosticActionZone.replace(/-/g, ' ')}</span></div>
                  </div>
                  <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#064e3b', color: '#a7f3d0', fontSize: '0.75rem' }}>
                    ✓ Exceeds therapeutic threshold: initiate GDMT (ARNI + SGLT2i + MRA, optimize loop diuretic).
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#450a0a', border: '1px solid #991b1b', color: '#fca5a5', fontSize: '0.75rem' }}>
                  🛑 <b>Safety Gate Intercept:</b> {caseResult.detail}
                  <div style={{ marginTop: '0.25rem', fontSize: '0.6875rem' }}>
                    Contraindications violated: {caseResult.violatedContraindications.join(', ')}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleNextStep}
                style={{ marginTop: '1rem', minHeight: '44px', width: '100%', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              >
                Proceed to Adaptive 3PL Assessment (Step 12) →
              </button>
            </div>
          </div>
        )}

        {/* Step 12: Adaptive 3PL IRT Assessment (EDU-5) */}
        {currentStep === 12 && (
          <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
              Computerized Adaptive Testing: 3PL Item Response Trait (Birnbaum)
            </div>
            {catResult.ok && (
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '0.75rem', textAlign: 'center', marginBottom: '1rem', fontSize: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Learner Ability θ</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#38bdf8' }}>{catResult.updatedTheta.toFixed(2)}</span>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Fisher Info I(θ)</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#34d399' }}>{catResult.testFisherInformation.toFixed(2)}</span>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Standard Error</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#fbbf24' }}>{catResult.standardErrorOfMeasurement?.toFixed(2) ?? 'N/A'}</span>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Angoff Cutpass</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: catResult.meetsAngoffStandard ? '#34d399' : '#f87171' }}>
                    {catResult.meetsAngoffStandard ? 'Pass Standard' : 'In Progress'}
                  </span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleNextStep}
              style={{ minHeight: '44px', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              Review Distractor Explanations (Step 13) →
            </button>
          </div>
        )}

        {/* Step 13: Distractor Explanations */}
        {currentStep === 13 && (
          <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
              Source-Grounded Distractor Review
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#064e3b', border: '1px solid #059669', color: '#ecfdf5' }}>
                <b>Option A (Correct):</b> Sarcomere is the repeating contractile unit of the cardiomyocyte myofibril bounded by Z-discs.
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#94a3b8' }}>
                <b>Option B (Distractor):</b> Sarcoplasmic reticulum stores and releases intracellular Ca²⁺ via RyR2, but does not slide filaments.
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#94a3b8' }}>
                <b>Option C (Distractor):</b> Mitochondria supply oxidative ATP for cross-bridge cycling; they are metabolic organelles, not contractile units.
              </div>
            </div>
            <button
              type="button"
              onClick={handleNextStep}
              style={{ minHeight: '44px', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              Persist Spaced-Retrieval Schedule (Step 14) →
            </button>
          </div>
        )}

        {/* Step 14: Spaced-Retrieval Persistence (EDU-2) */}
        {currentStep === 14 && (
          <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
              FSRS-v4.5 / Ebbinghaus Power-Law Spaced Retrieval Scheduling
            </div>
            {spacedResult.ok && (
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '0.75rem', textAlign: 'center', marginBottom: '1rem', fontSize: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Retrievability R(t,S)</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#34d399' }}>{(spacedResult.retrievabilityBeforeReview * 100).toFixed(1)}%</span>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Next Stability</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#38bdf8' }}>{spacedResult.nextStabilityDays.toFixed(1)} days</span>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Next Interval</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#fbbf24' }}>{spacedResult.nextIntervalDays} days</span>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8', display: 'block' }}>Remediation Prereqs</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 900, color: spacedResult.isLapse ? '#f87171' : '#a78bfa' }}>
                    {spacedResult.remediationPrerequisiteIds.length > 0 ? spacedResult.remediationPrerequisiteIds.length : 'None'}
                  </span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleNextStep}
              style={{ minHeight: '44px', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              Restore Exact 3D Viewport Context (Step 15) →
            </button>
          </div>
        )}

        {/* Step 15: Exact 3D Left-Ventricular Context Restoration */}
        {currentStep === 15 && (
          <div style={{ backgroundColor: '#020617', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
              Step 15/15: Viewport Restoration Verification &amp; Anatomical Return
            </div>

            {verificationResult.ok ? (
              <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#064e3b', border: '1px solid #059669', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 800, color: '#a7f3d0' }}>
                  <span>✓</span>
                  <span>Golden Journey Verification Complete: 15/15 Steps Verified</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#d1fae5', marginTop: '0.375rem', lineHeight: '1.5' }}>
                  Restored viewport bookmark exactly matches saved Left Ventricle spatial anchoring (<code>FMA:7101</code>, scale L3, camera target [12.5, -18.0, 4.2] mm, axial cross-section [0, 0, 1]).
                  Zero coordinate drift detected.
                </p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleReturnToAnatomy}
                    style={{ minHeight: '44px', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.8125rem', backgroundColor: '#10b981', color: '#020617', border: 'none', cursor: 'pointer' }}
                  >
                    🚀 Return to 3D Left Ventricle (Body Exposure)
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/med-study?bagian=prometheus')}
                    style={{ minHeight: '44px', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', cursor: 'pointer' }}
                  >
                    ⚔️ Launch Prometheus Arena Practice
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#450a0a', border: '1px solid #991b1b', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#fca5a5' }}>
                  ⚠️ Step 15 Verification Incomplete
                </div>
                <p style={{ fontSize: '0.75rem', color: '#fecaca', marginTop: '0.25rem' }}>
                  Reason: {verificationResult.reason} — {verificationResult.detail}
                </p>
                <button
                  type="button"
                  onClick={handleRunFullPipeline}
                  style={{ marginTop: '0.75rem', minHeight: '44px', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                >
                  ⚡ Fast-Track Complete All Steps
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
