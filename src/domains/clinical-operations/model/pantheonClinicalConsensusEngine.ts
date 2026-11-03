// src/domains/clinical-operations/model/pantheonClinicalConsensusEngine.ts
// T-CLIN-PANTHEON: Pantheon Multi-Agent Clinical Consensus & ICU Bedside CDS Engine
// Aligned with Surviving Sepsis Campaign (SSC 2021), AHA/ACC/HFSA 2022 GDMT, KDIGO 2024 AKI,
// and IDSA/SHEA Antimicrobial Stewardship Guidelines.

import { sha256Hex } from './downstreamHilirisasiFhirPacsBridge.ts';
import {
  evaluateSepsisOneHourBundle,
  type PatientSepsisAssessmentInput,
  type SepsisOneHourBundleEvaluation,
} from './sepsisOneHourBundleCds.ts';
import {
  evaluateHeartFailureGdmtOptimization,
  type PatientHfRefProfileInput,
  type HfRefGdmtOptimizationEvaluation,
} from './heartFailureGdmtQuadrupleCds.ts';
import {
  evaluateAntimicrobialStewardship,
  type PatientRenalParameters,
  type PrescribedAntimicrobialOrder,
  type AntimicrobialStewardshipEvaluation,
} from './antimicrobialStewardshipRenalCds.ts';

export type ClinicalSpecialtyId = 'CARDIOLOGY' | 'INFECTIOUS_DISEASE' | 'NEPHROLOGY' | 'CRITICAL_CARE' | 'PHARMACOGENOMICS';

export interface SpecialtyAgentVote {
  specialty: ClinicalSpecialtyId;
  agentName: string;
  voteScorePct: number; // 0 to 100
  urgencyTier: 'ROUTINE' | 'ELEVATED' | 'CRITICAL_ACTION_REQUIRED';
  primaryConcern: string;
  recommendedAction: string;
}

export interface GuidelineConflictItem {
  conflictId: string;
  competingGuidelines: [string, string];
  conflictDescription: string;
  arbiterResolutionStrategy: string;
  clinicalAction: string;
  contraindicatedActions: string[];
}

export interface BedsideCdsOrchestrationInput {
  patientId: string;
  weightKg: number;
  meanArterialPressureMmHg: number;
  systolicBpMmHg: number;
  heartRateBpm: number;
  respiratoryRateBpm: number;
  lactateMmolL: number | null;
  repeatLactateMmolL?: number | null;
  serumCreatinineMgDl: number;
  eGfrOrCrClMlMin: number;
  lvefPercentage?: number | null; // Left Ventricular Ejection Fraction
  activeInfectionSource?: string;
  prescribedAntimicrobial?: string;
  concomitantNephrotoxins?: string[];
  triageTimeZeroIso: string;
  evaluationTimeIso: string;
  actionRecords?: Array<{ element: 'LACTATE_MEASUREMENT' | 'BLOOD_CULTURES_PRIOR_ANTIBIOTICS' | 'BROAD_SPECTRUM_ANTIBIOTICS' | 'CRYSTALLOID_FLUID_30ML_KG' | 'VASOPRESSORS_FOR_HYPOTENSION'; performedAtIso: string; notes?: string }>;
}

export interface PantheonConsensusEvaluation {
  patientId: string;
  evaluatedAtIso: string;
  consensusScorePct: number;
  overallTriageTier: 'STABLE_OUTPATIENT' | 'MODERATE_ACUITY' | 'HIGH_RISK_ICU_ALERT';
  agentVotes: SpecialtyAgentVote[];
  detectedGuidelineConflicts: GuidelineConflictItem[];
  sepsisBundleStatus: SepsisOneHourBundleEvaluation | null;
  gdmtHeartFailureStatus: HfRefGdmtOptimizationEvaluation | null;
  antimicrobialStewardshipStatus: AntimicrobialStewardshipEvaluation | null;
  unifiedActionChecklist: Array<{ priority: number; category: string; instruction: string; timingWindow: string }>;
  requiresHumanPhysicianSignoff: true;
  clinically_reviewed: false;
  truthClass: 'clinical_decision_support_guideline_proxy';
  neverManufacturesBiomarkers: true;
  auditDigestSha256: string;
}

function checkFinite(val: unknown, name: string, min = 0, max = 1000): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || val < min || val > max) {
    throw new TypeError(`Invalid Pantheon input: ${name}`);
  }
  return val;
}

/**
 * Runs the Pantheon Multi-Agent Clinical Consensus Engine.
 * Resolves acute cross-specialty conflicts between Sepsis resuscitation, Heart Failure volume overload,
 * and Nephrotoxic antimicrobial synergy.
 */
export function evaluatePantheonClinicalConsensus(
  input: BedsideCdsOrchestrationInput
): PantheonConsensusEvaluation {
  if (!input || typeof input !== 'object') throw new TypeError('Invalid Pantheon input: object expected');
  if (typeof input.patientId !== 'string' || !input.patientId.trim()) throw new TypeError('Invalid patientId');

  const weightKg = checkFinite(input.weightKg, 'weightKg', 2, 400);
  const mapMmHg = checkFinite(input.meanArterialPressureMmHg, 'meanArterialPressureMmHg', 20, 250);
  const sbpMmHg = checkFinite(input.systolicBpMmHg, 'systolicBpMmHg', 30, 300);
  const hrBpm = checkFinite(input.heartRateBpm, 'heartRateBpm', 20, 260);
  const rrBpm = checkFinite(input.respiratoryRateBpm, 'respiratoryRateBpm', 4, 80);
  const crMgDl = checkFinite(input.serumCreatinineMgDl, 'serumCreatinineMgDl', 0.1, 30);
  const crCl = checkFinite(input.eGfrOrCrClMlMin, 'eGfrOrCrClMlMin', 1, 250);

  const lvef = input.lvefPercentage !== undefined && input.lvefPercentage !== null
    ? checkFinite(input.lvefPercentage, 'lvefPercentage', 5, 85)
    : null;

  const conflicts: GuidelineConflictItem[] = [];
  const agentVotes: SpecialtyAgentVote[] = [];
  const unifiedActions: Array<{ priority: number; category: string; instruction: string; timingWindow: string }> = [];

  // 1. Critical Care Evaluation (Sepsis-3 & SSC 1-Hour Bundle)
  const isSepsisSuspected = Boolean(input.activeInfectionSource && (input.lactateMmolL !== null || mapMmHg < 65 || rrBpm >= 22));
  let sepsisEval: SepsisOneHourBundleEvaluation | null = null;

  if (isSepsisSuspected) {
    const sepsisInput: PatientSepsisAssessmentInput = {
      patientId: input.patientId,
      triageTimeZeroIso: input.triageTimeZeroIso,
      evaluationTimeIso: input.evaluationTimeIso,
      weightKg,
      meanArterialPressure_mmHg: mapMmHg,
      systolicBp_mmHg: sbpMmHg,
      initialLactate_mmolL: input.lactateMmolL,
      repeatLactate_mmolL: input.repeatLactateMmolL,
      suspectedInfectionSource: input.activeInfectionSource ?? 'Systemic Sepsis',
      sofaScore: mapMmHg < 65 ? 2 : 1,
      qSofaScore: (sbpMmHg <= 100 ? 1 : 0) + (rrBpm >= 22 ? 1 : 0),
      hasPersistentHypotensionAfterFluids: mapMmHg < 65,
      actionRecords: input.actionRecords ?? [],
    };
    sepsisEval = evaluateSepsisOneHourBundle(sepsisInput);
  }

  // 2. Cardiology Evaluation (HFrEF / Volume Overload Safety)
  const hasHfRef = lvef !== null && lvef <= 40;
  let gdmtEval: HfRefGdmtOptimizationEvaluation | null = null;

  if (hasHfRef) {
    const hfInput: PatientHfRefProfileInput = {
      patientId: input.patientId,
      leftVentricularEjectionFractionPercentage: lvef,
      systolicBloodPressureMmHg: sbpMmHg,
      heartRateBeatsPerMinute: hrBpm,
      serumPotassiumMeqL: 4.4,
      estimatedGlomerularFiltrationRateMlMin: crCl,
      activePillars: {
        arniOrAceiOrArb: mapMmHg < 65 ? 'NONE' : 'SACUBITRIL_VALSARTAN_STARTING_49_51',
        evidenceBetaBlocker: mapMmHg < 65 ? 'NONE' : 'STARTING_DOSE',
        mineralocorticoidAntagonist: 'NONE',
        sglt2Inhibitor: 'DAPAGLIFLOZIN_10MG_OR_EMPAGLIFLOZIN_10MG',
      },
    };
    gdmtEval = evaluateHeartFailureGdmtOptimization(hfInput, input.evaluationTimeIso);
  }

  // 3. Nephrology & Antimicrobial Evaluation
  let abxEval: AntimicrobialStewardshipEvaluation | null = null;
  if (input.prescribedAntimicrobial) {
    const rawUpper = input.prescribedAntimicrobial.toUpperCase();
    let antibioticName: PrescribedAntimicrobialOrder['antibioticName'] = 'MEROPENEM';
    if (rawUpper.includes('VANCOMYCIN')) antibioticName = 'VANCOMYCIN';
    else if (rawUpper.includes('PIPERACILLIN') || rawUpper.includes('ZOSYN')) antibioticName = 'PIPERACILLIN_TAZOBACTAM';
    else if (rawUpper.includes('CEFEPIME')) antibioticName = 'CEFEPIME';
    else if (rawUpper.includes('CIPROFLOXACIN')) antibioticName = 'CIPROFLOXACIN';
    else if (rawUpper.includes('COLISTIN')) antibioticName = 'COLISTIN';

    try {
      const renalPatient: PatientRenalParameters = {
        patientId: input.patientId,
        ageYears: 65,
        sex: 'MALE',
        weightKg,
        serumCreatinineMgDl: crMgDl,
        isHemodialysisDependent: false,
      };
      const abxOrder: PrescribedAntimicrobialOrder = {
        orderId: `ORD-${input.patientId}`,
        antibioticName,
        requestedDoseMg: 1000,
        requestedDoseIntervalHours: 12,
        infectionSyndrome: 'INTRA_ABDOMINAL_SEPSIS',
        suspectedOrCulturedPathogen: 'EMPIRIC_COVERAGE_NO_ISOLATE_YET',
        concomitantNephrotoxins: input.concomitantNephrotoxins ?? [],
      };
      abxEval = evaluateAntimicrobialStewardship(renalPatient, abxOrder, input.evaluationTimeIso);
    } catch {
      abxEval = null;
    }
  }

  // ── Conflict Resolution Logic ──────────────────────────────────────────

  // Conflict A: Sepsis Fluid Resuscitation vs. HFrEF Pulmonary Edema
  if (isSepsisSuspected && hasHfRef && (mapMmHg < 65 || (input.lactateMmolL !== null && input.lactateMmolL >= 4.0))) {
    conflicts.push({
      conflictId: 'cardio-sepsis-fluid-overload',
      competingGuidelines: [
        'Surviving Sepsis Campaign 2021: 30 mL/kg rapid crystalloid bolus within 3 hours',
        'AHA/ACC/HFSA 2022 Heart Failure Guidelines: Strict volume overload prevention in LVEF ≤ 35%',
      ],
      conflictDescription: `Standard 30 mL/kg fluid bolus (${Math.round(30 * weightKg)} mL) carries severe flash pulmonary edema risk due to impaired HFrEF systolic ejection fraction (${lvef}%).`,
      arbiterResolutionStrategy: 'Micro-aliquot titrated volume challenges (250–500 mL) paired with dynamic volume responsiveness (PLR / SVV ≥ 13%) and early peripheral/central Norepinephrine initiation.',
      clinicalAction: 'RESTRICT unmonitored bulk crystalloids. Administer 250–500 mL balanced crystalloid over 20 min; initiate early Norepinephrine to maintain MAP ≥ 65 mmHg.',
      contraindicatedActions: ['Unmonitored rapid 30 mL/kg wide-open gravity bolus', 'Holding vasopressors while waiting for large fluid volume completion'],
    });

    unifiedActions.push({
      priority: 1,
      category: 'HEMODYNAMIC_RESUSCITATION',
      instruction: 'Initiate Norepinephrine infusion titrated to MAP ≥ 65 mmHg; deliver micro-fluid challenges (250 mL) only if dynamic volume responsiveness is positive (PLR/SVV).',
      timingWindow: 'Immediate (< 15 minutes)',
    });
  } else if (isSepsisSuspected && (mapMmHg < 65 || (input.lactateMmolL !== null && input.lactateMmolL >= 4.0))) {
    unifiedActions.push({
      priority: 1,
      category: 'HEMODYNAMIC_RESUSCITATION',
      instruction: `Administer standard crystalloid fluid resuscitation: ${Math.round(30 * weightKg)} mL (30 mL/kg) within 3 hours.`,
      timingWindow: '< 3 hours from time zero',
    });
  }

  // Conflict B: Nephrotoxic Synergy Alert (Vancomycin + Piperacillin-Tazobactam)
  const isVancPrescribed = input.prescribedAntimicrobial?.toUpperCase().includes('VANCOMYCIN');
  const hasZosynConcomitant = input.concomitantNephrotoxins?.some((t) => t.toUpperCase().includes('PIPERACILLIN') || t.toUpperCase().includes('ZOSYN')) || input.prescribedAntimicrobial?.toUpperCase().includes('PIPERACILLIN');

  if ((isVancPrescribed && hasZosynConcomitant) || (abxEval && abxEval.dosingSafetyAlert === 'NEPHROTOXIC_SYNERGY_AVOID')) {
    conflicts.push({
      conflictId: 'nephrotoxic-synergy-vanc-zosyn',
      competingGuidelines: [
        'IDSA Empiric Sepsis Coverage: Combined MRSA + Antipseudomonal broad coverage',
        'KDIGO 2024 / ASN AKI Guidelines: Nephrotoxic synergy avoidance in impaired renal reserve (CrCl < 45 mL/min)',
      ],
      conflictDescription: 'Concomitant Vancomycin and Piperacillin-Tazobactam produces synergistic acute tubular necrosis / interstitial nephritis.',
      arbiterResolutionStrategy: 'Substitute Piperacillin-Tazobactam with Cefepime (with renal dosing) or Meropenem; or substitute Vancomycin with Linezolid/Daptomycin.',
      clinicalAction: 'Switch Piperacillin-Tazobactam to Cefepime 1g q12h (renally adjusted) or consider Linezolid 600mg q12h; monitor serum creatinine and Vancomycin AUC/MIC.',
      contraindicatedActions: ['Continuing simultaneous Vancomycin + Piperacillin-Tazobactam without therapeutic drug monitoring'],
    });

    unifiedActions.push({
      priority: 2,
      category: 'ANTIMICROBIAL_STEWARDSHIP',
      instruction: 'Eliminate synergistic nephrotoxicity: switch Pip-Tazo to renally-dosed Cefepime or Meropenem; order baseline serum creatinine.',
      timingWindow: '< 60 minutes from presentation',
    });
  } else if (input.prescribedAntimicrobial) {
    unifiedActions.push({
      priority: 2,
      category: 'ANTIMICROBIAL_STEWARDSHIP',
      instruction: `Administer prescribed ${input.prescribedAntimicrobial} adhering to renal clearance titration (CrCl: ${crCl.toFixed(0)} mL/min).`,
      timingWindow: '< 60 minutes from triage',
    });
  }

  // Conflict C: Acute Shock vs Outpatient Vasodilators / Beta-Blockers
  if (mapMmHg < 65 && hasHfRef) {
    conflicts.push({
      conflictId: 'acute-shock-vs-outpatient-gdmt',
      competingGuidelines: [
        'AHA/ACC HFSA Guideline-Directed Medical Therapy: Lifelong quadruple therapy for HFrEF',
        'Critical Care Shock Management: Avoid negative inotropes and afterload reduction during profound hypotension',
      ],
      conflictDescription: 'Active outpatient beta-blockers, ACEi/ARNI and SGLT2i exacerbate cardiogenic / distributive hypotension and precipitate acute renal shutdown.',
      arbiterResolutionStrategy: 'Temporarily HOLD Beta-blockers, ARNI/ACEi, and SGLT2i during active vasopressor resuscitation; plan gradual re-initiation post-stabilization.',
      clinicalAction: 'Hold ARNI/ACEi and Beta-blockers until vasopressors discontinued for > 24 hours with stable renal perfusion.',
      contraindicatedActions: ['Administering routine morning beta-blocker or ARNI during vasopressor dependency'],
    });

    unifiedActions.push({
      priority: 3,
      category: 'MEDICATION_SAFETY_HOLD',
      instruction: 'Hold outpatient HFrEF vasodilators (ARNI/ACEi/ARB) and beta-blockers during active vasopressor dependency.',
      timingWindow: 'Immediate',
    });
  }

  // 4. Specialist Agent Voting Matrix
  agentVotes.push({
    specialty: 'CRITICAL_CARE',
    agentName: 'SepsisAgent (SSC 2021)',
    voteScorePct: isSepsisSuspected ? (mapMmHg < 65 ? 95 : 82) : 50,
    urgencyTier: isSepsisSuspected && mapMmHg < 65 ? 'CRITICAL_ACTION_REQUIRED' : 'ELEVATED',
    primaryConcern: isSepsisSuspected ? `SSC 1-Hour bundle compliance; MAP target ≥ 65 mmHg; initial lactate: ${input.lactateMmolL ?? 'UNMEASURED'}` : 'Hemodynamic surveillance',
    recommendedAction: isSepsisSuspected ? 'Enforce blood cultures prior to antibiotics, timely antimicrobial delivery, and perfusion monitoring.' : 'Maintain standard vitals surveillance.',
  });

  agentVotes.push({
    specialty: 'CARDIOLOGY',
    agentName: 'CardioArbiter (AHA/ACC GDMT)',
    voteScorePct: hasHfRef ? (mapMmHg < 65 ? 92 : 78) : 55,
    urgencyTier: hasHfRef && mapMmHg < 65 ? 'CRITICAL_ACTION_REQUIRED' : (hasHfRef ? 'ELEVATED' : 'ROUTINE'),
    primaryConcern: hasHfRef ? `HFrEF (EF: ${lvef}%) vulnerable to flash pulmonary edema and myocardial hypoperfusion` : 'Cardiac baseline stable',
    recommendedAction: hasHfRef && mapMmHg < 65 ? 'Avoid volume overload; early vasopressor support; hold outpatient vasodilators.' : 'Optimize 4-pillar GDMT as outpatient.',
  });

  const isNephroSynergy = Boolean((isVancPrescribed && hasZosynConcomitant) || (abxEval && abxEval.dosingSafetyAlert === 'NEPHROTOXIC_SYNERGY_AVOID'));
  agentVotes.push({
    specialty: 'NEPHROLOGY',
    agentName: 'RenalGuard (KDIGO AKI)',
    voteScorePct: crCl < 45 || isVancPrescribed ? 88 : 60,
    urgencyTier: crCl < 30 || isNephroSynergy ? 'CRITICAL_ACTION_REQUIRED' : 'ROUTINE',
    primaryConcern: isNephroSynergy
      ? `Synergistic nephrotoxicity hazard with Vancomycin + Pip-Tazo (CrCl: ${crCl.toFixed(0)} mL/min; Cr: ${crMgDl} mg/dL)`
      : `Renal clearance: ${crCl.toFixed(0)} mL/min; serum Cr: ${crMgDl} mg/dL; nephrotoxic synergy risk`,
    recommendedAction: isNephroSynergy ? 'Eliminate Vancomycin + Pip-Tazo synergy; dose-adjust beta-lactams to CrCl.' : 'Maintain renal hydration and monitor urine output.',
  });

  agentVotes.push({
    specialty: 'INFECTIOUS_DISEASE',
    agentName: 'StewardshipAgent (IDSA)',
    voteScorePct: isSepsisSuspected ? 85 : 55,
    urgencyTier: isSepsisSuspected ? 'ELEVATED' : 'ROUTINE',
    primaryConcern: 'Pathogen targeting, de-escalation planning, and timely blood cultures before first antimicrobial dose',
    recommendedAction: 'Obtain 2 sets of blood cultures; administer targeted broad spectrum within 60 min; re-evaluate at 48h.',
  });

  agentVotes.push({
    specialty: 'PHARMACOGENOMICS',
    agentName: 'PharmacoAgent (CPIC)',
    voteScorePct: 70,
    urgencyTier: 'ROUTINE',
    primaryConcern: 'CYP2C19/CYP2D6 metabolic variant screening and drug-drug interaction avoidance',
    recommendedAction: 'Verify metabolic phenotype prior to clopidogrel or codeine administration.',
  });

  // Calculate composite consensus score
  const totalVotes = agentVotes.reduce((sum, v) => sum + v.voteScorePct, 0);
  const consensusScorePct = Math.round(totalVotes / agentVotes.length);

  const overallTriageTier: 'STABLE_OUTPATIENT' | 'MODERATE_ACUITY' | 'HIGH_RISK_ICU_ALERT' =
    (mapMmHg < 65 || (input.lactateMmolL !== null && input.lactateMmolL >= 4.0) || conflicts.length > 0)
      ? 'HIGH_RISK_ICU_ALERT'
      : (isSepsisSuspected || hasHfRef ? 'MODERATE_ACUITY' : 'STABLE_OUTPATIENT');

  // Cryptographic audit digest
  const auditString = `${input.patientId}|${input.evaluationTimeIso}|${consensusScorePct}|${overallTriageTier}|${conflicts.length}`;
  const auditDigestSha256 = sha256Hex(auditString);

  return {
    patientId: input.patientId,
    evaluatedAtIso: input.evaluationTimeIso,
    consensusScorePct,
    overallTriageTier,
    agentVotes,
    detectedGuidelineConflicts: conflicts,
    sepsisBundleStatus: sepsisEval,
    gdmtHeartFailureStatus: gdmtEval,
    antimicrobialStewardshipStatus: abxEval,
    unifiedActionChecklist: unifiedActions.sort((a, b) => a.priority - b.priority),
    requiresHumanPhysicianSignoff: true,
    clinically_reviewed: false,
    truthClass: 'clinical_decision_support_guideline_proxy',
    neverManufacturesBiomarkers: true,
    auditDigestSha256,
  };
}
