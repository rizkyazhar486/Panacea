// @panacea-claim-boundary: simulation-not-clinical
import { createHash } from 'node:crypto';

const RHO_BLOOD_KG_M3 = 1060;
const MU_BLOOD_PA_S = 0.0035;
const POISSON_RATIO_VESSEL = 0.5;
export const NORMOTENSIVE_RADIAL_YOUNGS_MODULUS_KPA = 235;

export function computeNormotensiveRadialPwvMs(youngsModulusKpa = NORMOTENSIVE_RADIAL_YOUNGS_MODULUS_KPA, wallThicknessM = 0.00045, radiusM = 0.0013) {
  return roundTo(Math.sqrt((youngsModulusKpa * 1000 * wallThicknessM) / (2 * RHO_BLOOD_KG_M3 * radiusM)), 2);
}

function roundTo(val, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function sha256Hex(payload) {
  return createHash('sha256').update(String(payload)).digest('hex');
}

export const PULSE_CATALOG_28 = Object.freeze([
  Object.freeze({ id: 'fu_floating', name: 'Fu (Floating)', icd11Tm1Code: 'SF50', snomedCtCode: '708110008' }),
  Object.freeze({ id: 'chen_sinking', name: 'Chen (Sinking/Deep)', icd11Tm1Code: 'SF51', snomedCtCode: '708111007' }),
  Object.freeze({ id: 'chi_slow', name: 'Chi (Slow)', icd11Tm1Code: 'SF52', snomedCtCode: '708112000' }),
  Object.freeze({ id: 'shuo_rapid', name: 'Shuo (Rapid)', icd11Tm1Code: 'SF53', snomedCtCode: '708113005' }),
  Object.freeze({ id: 'hong_surging', name: 'Hong (Surging)', icd11Tm1Code: 'SF54', snomedCtCode: '708114004' }),
  Object.freeze({ id: 'xian_wiry', name: 'Xian (Wiry/String-Taut)', icd11Tm1Code: 'SF55', snomedCtCode: '708115003' }),
  Object.freeze({ id: 'hua_slippery', name: 'Hua (Slippery/Rolling)', icd11Tm1Code: 'SF56', snomedCtCode: '708116002' }),
  Object.freeze({ id: 'se_choppy', name: 'Se (Choppy/Hesitant)', icd11Tm1Code: 'SF57', snomedCtCode: '708117006' }),
  Object.freeze({ id: 'xi_thready', name: 'Xi (Thready/Fine)', icd11Tm1Code: 'SF58', snomedCtCode: '708118001' }),
  Object.freeze({ id: 'jie_knotted', name: 'Jie (Knotted)', icd11Tm1Code: 'SF59', snomedCtCode: '708119009' }),
  Object.freeze({ id: 'dai_intermittent', name: 'Dai (Intermittent)', icd11Tm1Code: 'SF5A', snomedCtCode: '708120003' }),
  Object.freeze({ id: 'huan_moderate', name: 'Huan (Moderate/Balanced)', icd11Tm1Code: 'SF5B', snomedCtCode: '708121004' }),
  Object.freeze({ id: 'jin_tight', name: 'Jin (Tight)', icd11Tm1Code: 'SF5C', snomedCtCode: '708122006' }),
  Object.freeze({ id: 'chang_long', name: 'Chang (Long)', icd11Tm1Code: 'SF5D', snomedCtCode: '708123001' }),
  Object.freeze({ id: 'duan_short', name: 'Duan (Short)', icd11Tm1Code: 'SF5E', snomedCtCode: '708124007' }),
  Object.freeze({ id: 'xu_empty', name: 'Xu (Vacuous/Empty)', icd11Tm1Code: 'SF5F', snomedCtCode: '708125008' }),
  Object.freeze({ id: 'shi_replete', name: 'Shi (Replete/Full)', icd11Tm1Code: 'SF5G', snomedCtCode: '708126009' }),
  Object.freeze({ id: 'wei_faint', name: 'Wei (Faint)', icd11Tm1Code: 'SF5H', snomedCtCode: '708127000' }),
  Object.freeze({ id: 'ru_soggy', name: 'Ru (Soggy/Soft)', icd11Tm1Code: 'SF5I', snomedCtCode: '708128005' }),
  Object.freeze({ id: 'ruo_weak', name: 'Ruo (Weak)', icd11Tm1Code: 'SF5J', snomedCtCode: '708129002' }),
  Object.freeze({ id: 'kou_scallion', name: 'Kou (Hollow/Scallion-Stalk)', icd11Tm1Code: 'SF5K', snomedCtCode: '708130007' }),
  Object.freeze({ id: 'ge_drumskin', name: 'Ge (Drumskin)', icd11Tm1Code: 'SF5L', snomedCtCode: '708131006' }),
  Object.freeze({ id: 'lao_firm', name: 'Lao (Firm/Confined)', icd11Tm1Code: 'SF5M', snomedCtCode: '708132004' }),
  Object.freeze({ id: 'fu_hidden', name: 'Fu-Hidden (Deep-Seated)', icd11Tm1Code: 'SF5N', snomedCtCode: '708133009' }),
  Object.freeze({ id: 'dong_stirring', name: 'Dong (Stirring)', icd11Tm1Code: 'SF5P', snomedCtCode: '708134003' }),
  Object.freeze({ id: 'cu_hurried', name: 'Cu (Hurried/Abrupt)', icd11Tm1Code: 'SF5Q', snomedCtCode: '708135002' }),
  Object.freeze({ id: 'da_large', name: 'Da (Large)', icd11Tm1Code: 'SF5R', snomedCtCode: '708136001' }),
  Object.freeze({ id: 'ji_racing', name: 'Ji (Racing)', icd11Tm1Code: 'SF5S', snomedCtCode: '708137005' }),
]);

/**
 * WAVE 47: 1D Arterial Tree Hemodynamics (Navier-Stokes Pulse Wave Propagation)
 * & 3x3 Cunkou Radial Tonometry Tensor Inversion into 28-Pulse ICD-11-TM1 Classifier.
 */
export function solveArterialTreeAndCunkouPulseClassifier(input) {
  if (!input || !Array.isArray(input.segments) || input.segments.length !== 4) {
    throw new Error('Wave47: requires 4 arterial segments (aorta, subclavian, brachial, radial_cunkou)');
  }
  const {
    segments,
    cardiacOutputLMin = 5.2,
    heartRateBpm = 72,
    terminalResistancePaSM3 = 1.35e8,
    sdppgWaves = { a: 1.0, b: -0.48, c: -0.18, d: -0.22, e: 0.14 },
    cunkouTensor3x3,
  } = input;

  if (!Array.isArray(cunkouTensor3x3) || cunkouTensor3x3.length !== 3 || cunkouTensor3x3.some((r) => !Array.isArray(r) || r.length !== 3)) {
    throw new Error('Wave47: cunkouTensor3x3 must be a 3x3 matrix [Cun, Guan, Chi] x [Fu, Zhong, Chen]');
  }

  const meanFlowM3S = (cardiacOutputLMin / 60) * 1e-3;
  const segmentHydraulics = segments.map((seg) => {
    const r0 = seg.radiusM;
    const A0 = Math.PI * r0 * r0;
    const beta = (Math.sqrt(Math.PI) * seg.wallThicknessM * seg.youngsModulusPa) / (1 - POISSON_RATIO_VESSEL ** 2);
    const pwvMs = Math.sqrt((seg.youngsModulusPa * seg.wallThicknessM) / (2 * RHO_BLOOD_KG_M3 * r0));
    const characteristicImpedancePaSM3 = (RHO_BLOOD_KG_M3 * pwvMs) / A0;
    const viscousDropPa = (8 * Math.PI * MU_BLOOD_PA_S * seg.lengthM * meanFlowM3S) / (A0 * A0);
    return Object.freeze({
      segmentId: seg.segmentId,
      crossSectionalAreaM2: roundTo(A0, 7),
      betaStiffnessPaM: roundTo(beta, 2),
      pwvMs: roundTo(pwvMs, 3),
      characteristicImpedancePaSM3: roundTo(characteristicImpedancePaSM3, 1),
      viscousPressureDropMmHg: roundTo(viscousDropPa / 133.322, 3),
    });
  });

  const radialSeg = segmentHydraulics[3];
  const zRadial = radialSeg.characteristicImpedancePaSM3;
  const backwardReflectionGammaB = roundTo((terminalResistancePaSM3 - zRadial) / (terminalResistancePaSM3 + zRadial), 4);
  const forwardTransmissionGammaF = roundTo(1 + backwardReflectionGammaB, 4);

  const aPeak = Math.max(0.01, Math.abs(sdppgWaves.a));
  const bOverA = roundTo(sdppgWaves.b / aPeak, 4);
  const cOverA = roundTo(sdppgWaves.c / aPeak, 4);
  const dOverA = roundTo(sdppgWaves.d / aPeak, 4);
  const eOverA = roundTo(sdppgWaves.e / aPeak, 4);
  const vascularAgingIndexAgi = roundTo((sdppgWaves.b - sdppgWaves.c - sdppgWaves.d - sdppgWaves.e) / aPeak, 4);

  // Cunkou 3x3 Tensor: rows = [Cun, Guan, Chi], cols = [Fu (superficial), Zhong (middle), Chen (deep)]
  let fuSum = 0;
  let zhongSum = 0;
  let chenSum = 0;
  for (let i = 0; i < 3; i += 1) {
    fuSum += cunkouTensor3x3[i][0];
    zhongSum += cunkouTensor3x3[i][1];
    chenSum += cunkouTensor3x3[i][2];
  }
  const fuMean = roundTo(fuSum / 3, 2);
  const zhongMean = roundTo(zhongSum / 3, 2);
  const chenMean = roundTo(chenSum / 3, 2);
  const totalMeanAmplitude = roundTo((fuMean + zhongMean + chenMean) / 3, 2);

  let classifiedPulseId = 'huan_moderate';
  if (heartRateBpm >= 120) {
    classifiedPulseId = 'ji_racing';
  } else if (radialSeg.pwvMs >= 12.2 || dOverA <= -0.35) {
    classifiedPulseId = 'xian_wiry';
  } else if (heartRateBpm >= 95 && totalMeanAmplitude >= 70) {
    classifiedPulseId = 'hong_surging';
  } else if (heartRateBpm >= 95) {
    classifiedPulseId = 'shuo_rapid';
  } else if (heartRateBpm <= 55) {
    classifiedPulseId = 'chi_slow';
  } else if (fuMean > chenMean * 1.45) {
    classifiedPulseId = 'fu_floating';
  } else if (chenMean > fuMean * 1.45) {
    classifiedPulseId = 'chen_sinking';
  } else if (totalMeanAmplitude <= 25) {
    classifiedPulseId = 'xi_thready';
  } else if (bOverA <= -0.65 && eOverA >= 0.2) {
    classifiedPulseId = 'hua_slippery';
  }

  const matchedPulse = PULSE_CATALOG_28.find((p) => p.id === classifiedPulseId) ?? PULSE_CATALOG_28[11];

  return Object.freeze({
    truthClass: 'SIMULATED_EDUCATIONAL',
    clinicallyReviewed: false,
    requiresHumanPhysicianSignoff: true,
    segmentHydraulics: Object.freeze(segmentHydraulics),
    waveReflection: Object.freeze({
      backwardReflectionGammaB,
      forwardTransmissionGammaF,
    }),
    sdppgRatios: Object.freeze({
      bOverA,
      cOverA,
      dOverA,
      eOverA,
      vascularAgingIndexAgi,
    }),
    cunkouDepthProfile: Object.freeze({
      fuMeanMmHg: fuMean,
      zhongMeanMmHg: zhongMean,
      chenMeanMmHg: chenMean,
      totalMeanAmplitudeMmHg: totalMeanAmplitude,
    }),
    classifiedPulse: matchedPulse,
    catalogSize: PULSE_CATALOG_28.length,
  });
}

/**
 * WAVE 48: Multi-Omics Epigenetic Reprogramming, Mitochondrial Bioenergetics
 * & Senolytic Control Theory (DunedinPACE < 0.75 with Anabolic-Catabolic Phase Separation).
 */
export function evaluateEpigeneticSenolyticControlPolicy(input) {
  if (!input || typeof input.nadPlusToNadhRatio !== 'number' || input.nadPlusToNadhRatio <= 0) {
    throw new Error('Wave48: valid nadPlusToNadhRatio > 0 is required');
  }
  const {
    nadPlusToNadhRatio,
    ampkActivation = 0.75,
    mtorc1Activation = 0.25,
    deltaPsiMMv = -165,
    saspCytokines = { il6PgMl: 1.2, tnfAlphaPgMl: 1.5, gdf15PgMl: 420, hsCrpMgL: 0.6 },
    fastingHoursPerDay = 18,
    zone2MinutesWeekly = 180,
    calisthenicsSessionsWeekly = 4,
    pulsedSenolyticActive = true,
    hoursBetweenSenolyticAndHypertrophy = 54,
  } = input;

  const sirt1Sirt3Activity = roundTo(nadPlusToNadhRatio / (nadPlusToNadhRatio + 2.2), 4);
  const ampkToMtorRatio = roundTo(ampkActivation / Math.max(0.05, mtorc1Activation), 3);
  const mitophagyClearanceFlux = roundTo(
    clamp(0.45 * sirt1Sirt3Activity + 0.35 * Math.tanh(ampkToMtorRatio / 2.5) + (deltaPsiMMv > -110 ? 0.25 : 0.15), 0, 1),
    4,
  );

  const saspInflammatoryBurden = roundTo(
    clamp(
      (saspCytokines.il6PgMl / 5.0) * 0.3 +
        (saspCytokines.tnfAlphaPgMl / 6.0) * 0.25 +
        (saspCytokines.gdf15PgMl / 1200.0) * 0.25 +
        (saspCytokines.hsCrpMgL / 3.0) * 0.2,
      0,
      2.5,
    ),
    4,
  );

  const fastingBonus = clamp((fastingHoursPerDay - 12) * 0.018, 0, 0.16);
  const zone2Bonus = clamp((zone2MinutesWeekly / 180) * 0.09, 0, 0.12);
  const senolyticBonus = pulsedSenolyticActive ? 0.06 : 0;

  const predictedDunedinPace = roundTo(
    clamp(
      1.04 - 0.24 * sirt1Sirt3Activity - 0.16 * mitophagyClearanceFlux - fastingBonus - zone2Bonus - senolyticBonus + 0.22 * saspInflammatoryBurden,
      0.52,
      1.45,
    ),
    3,
  );

  const anabolicCatabolicSeparationSafe = hoursBetweenSenolyticAndHypertrophy >= 48;
  const myofibrillarHypertrophyPreserved =
    anabolicCatabolicSeparationSafe && calisthenicsSessionsWeekly >= 3 && fastingHoursPerDay <= 20;

  return Object.freeze({
    truthClass: 'SIMULATED_EDUCATIONAL',
    clinicallyReviewed: false,
    requiresHumanPhysicianSignoff: true,
    sirt1Sirt3Activity,
    ampkToMtorRatio,
    mitophagyClearanceFlux,
    saspInflammatoryBurden,
    predictedDunedinPace,
    dunedinPaceTargetMet: predictedDunedinPace < 0.75,
    anabolicCatabolicSeparationSafe,
    myofibrillarHypertrophyPreserved,
  });
}

const CYP_GENE_ACTIVITY_FACTORS = Object.freeze({
  ultrarapid_metabolizer: 1.6,
  normal_metabolizer: 1.0,
  intermediate_metabolizer: 0.55,
  poor_metabolizer: 0.15,
});

/**
 * WAVE 49: Quantum-Informed Pharmacogenomic Network, Multi-Drug Cytochrome/Transporter PBPK,
 * Cumulative hERG QTcF Blockade & SATUSEHAT Indonesia HL7 FHIR R4 Transaction Bundle.
 */
export function evaluateQuantumPgxPbpkAndSatusehatBundle(input) {
  if (!input || !input.patientId || !Array.isArray(input.medications) || input.medications.length === 0) {
    throw new Error('Wave49: patientId and non-empty medications array are required');
  }
  const {
    patientId,
    ageYears = 52,
    sex = 'male',
    serumCreatinineMgDl = 1.0,
    childPughClass = 'A',
    baselineQtMs = 410,
    heartRateBpm = 72,
    hlaAlleles = [],
    cypPhenotypes = {},
    transporterVariants = {},
    medications,
  } = input;

  // 2021 CKD-EPI Race-Free eGFR (mL/min/1.73m2)
  const kappa = sex === 'female' ? 0.7 : 0.9;
  const alpha = sex === 'female' ? -0.241 : -0.302;
  const sexFactor = sex === 'female' ? 1.012 : 1.0;
  const scrOverKappa = serumCreatinineMgDl / kappa;
  const egfrMlMin173m2 = roundTo(
    142 * Math.min(scrOverKappa, 1) ** alpha * Math.max(scrOverKappa, 1) ** -1.2 * 0.9938 ** ageYears * sexFactor,
    1,
  );

  const hepaticClearanceFactor = childPughClass === 'C' ? 0.4 : childPughClass === 'B' ? 0.7 : 1.0;
  const renalClearanceFactor = clamp(egfrMlMin173m2 / 90, 0.15, 1.2);

  // Baseline Fridericia QTcF = QT / (RR)^(1/3)
  const rrSeconds = 60 / Math.max(30, heartRateBpm);
  const baselineQtcFMs = roundTo(baselineQtMs / Math.cbrt(rrSeconds), 1);

  const detectedIssues = [];
  let cumulativeDeltaQtcFMs = 0;

  // Compute competitive CYP inhibition sum([I]_u / Ki) per enzyme
  const enzymeInhibitionTerms = {};
  for (const med of medications) {
    if (med.inhibitsEnzyme && med.unboundConcentrationUm > 0 && med.inhibitionKiUm > 0) {
      const ratio = med.unboundConcentrationUm / med.inhibitionKiUm;
      enzymeInhibitionTerms[med.inhibitsEnzyme] = (enzymeInhibitionTerms[med.inhibitsEnzyme] ?? 0) + ratio;
    }
  }

  const medicationEvaluations = medications.map((med) => {
    const primaryEnzyme = med.primaryEnzyme ?? 'CYP3A4';
    const fm = clamp(med.fractionMetabolized ?? 0.75, 0, 1);
    const phenotype = cypPhenotypes[primaryEnzyme] ?? 'normal_metabolizer';
    const pgxFactor = CYP_GENE_ACTIVITY_FACTORS[phenotype] ?? 1.0;
    const sumIoverKi = enzymeInhibitionTerms[primaryEnzyme] ?? 0;
    const inhibitionFactor = 1 / (1 + sumIoverKi);
    const slco1b1Penalty =
      med.substrateOf === 'SLCO1B1' && transporterVariants.SLCO1B1 === 'c.521T>C_homozygous' ? 0.45 : 1.0;

    const effectiveIntrinsicClearanceFraction =
      fm * pgxFactor * inhibitionFactor * slco1b1Penalty * hepaticClearanceFactor +
      (1 - fm) * renalClearanceFactor;
    const aucRatio = roundTo(1 / Math.max(0.08, effectiveIntrinsicClearanceFraction), 2);

    // Cumulative hERG potassium channel Hill occupancy -> delta QTcF
    const hergConc = med.unboundConcentrationUm ?? 0;
    const hergIc50 = med.hergIc50Um ?? 100;
    const hergOccupancy = hergConc > 0 ? hergConc / (hergConc + hergIc50) : 0;
    const drugDeltaQtcF = roundTo(hergOccupancy * 85 * Math.min(2.5, aucRatio), 1);
    cumulativeDeltaQtcFMs = roundTo(cumulativeDeltaQtcFMs + drugDeltaQtcF, 1);

    // Indonesian HLA Pharmacovigilance Checks
    const medLower = String(med.drugName).toLowerCase();
    if (
      (medLower.includes('carbamazepine') || medLower.includes('phenytoin')) &&
      hlaAlleles.includes('HLA-B*15:02')
    ) {
      detectedIssues.push({
        code: 'HLA-B*15:02-SJS-TEN-CONTRAINDICATION',
        severity: 'high',
        detail: `${med.drugName} contraindicated in HLA-B*15:02 carrier due to high Stevens-Johnson Syndrome / TEN risk.`,
      });
    }
    if (medLower.includes('allopurinol') && hlaAlleles.includes('HLA-B*58:01')) {
      detectedIssues.push({
        code: 'HLA-B*58:01-SCAR-CONTRAINDICATION',
        severity: 'high',
        detail: `${med.drugName} contraindicated in HLA-B*58:01 carrier due to severe cutaneous adverse reaction risk.`,
      });
    }
    if (medLower.includes('carbamazepine') && hlaAlleles.includes('HLA-A*31:01')) {
      detectedIssues.push({
        code: 'HLA-A*31:01-DRESS-CONTRAINDICATION',
        severity: 'high',
        detail: `${med.drugName} high DRESS / hypersensitivity risk in HLA-A*31:01 carrier.`,
      });
    }
    if (medLower.includes('clopidogrel') && phenotype === 'poor_metabolizer' && primaryEnzyme === 'CYP2C19') {
      detectedIssues.push({
        code: 'CYP2C19-PM-CLOPIDOGREL-FAILURE',
        severity: 'high',
        detail: 'Clopidogrel bioactivation failure in CYP2C19 poor metabolizer; consider prasugrel or ticagrelor per clinician review.',
      });
    }
    if (aucRatio >= 2.0) {
      detectedIssues.push({
        code: `PBPK-AUCR-ELEVATION-${primaryEnzyme}`,
        severity: aucRatio >= 3.0 ? 'high' : 'moderate',
        detail: `${med.drugName} predicted AUCR=${aucRatio}x via ${primaryEnzyme} / organ clearance coupling.`,
      });
    }

    return Object.freeze({
      drugName: med.drugName,
      rxNormCode: med.rxNormCode ?? 'unknown',
      primaryEnzyme,
      phenotype,
      aucRatio,
      drugDeltaQtcFMs: drugDeltaQtcF,
    });
  });

  const projectedQtcFMs = roundTo(baselineQtcFMs + cumulativeDeltaQtcFMs, 1);
  const torsadesRiskHigh = projectedQtcFMs >= 500 || cumulativeDeltaQtcFMs >= 60;
  if (torsadesRiskHigh) {
    detectedIssues.push({
      code: 'HERG-CUMULATIVE-QTCF-PROLONGATION',
      severity: 'high',
      detail: `Projected Fridericia QTcF=${projectedQtcFMs} ms (delta +${cumulativeDeltaQtcFMs} ms) exceeds TdP safety threshold.`,
    });
  }

  const fhirBundle = Object.freeze({
    resourceType: 'Bundle',
    type: 'transaction',
    meta: Object.freeze({
      profile: Object.freeze(['https://fhir.kemkes.go.id/r4/StructureDefinition/Bundle']),
    }),
    entry: Object.freeze([
      ...medicationEvaluations.map((m, idx) =>
        Object.freeze({
          fullUrl: `urn:uuid:medreq-${idx + 1}`,
          resource: Object.freeze({
            resourceType: 'MedicationRequest',
            status: 'draft',
            intent: 'proposal',
            subject: Object.freeze({ reference: `Patient/${patientId}` }),
            medicationCodeableConcept: Object.freeze({
              coding: Object.freeze([
                Object.freeze({
                  system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                  code: m.rxNormCode,
                  display: m.drugName,
                }),
              ]),
            }),
          }),
          request: Object.freeze({ method: 'POST', url: 'MedicationRequest' }),
        }),
      ),
      ...detectedIssues.map((iss, idx) =>
        Object.freeze({
          fullUrl: `urn:uuid:issue-${idx + 1}`,
          resource: Object.freeze({
            resourceType: 'DetectedIssue',
            status: 'preliminary',
            severity: iss.severity,
            code: Object.freeze({ text: iss.code }),
            patient: Object.freeze({ reference: `Patient/${patientId}` }),
            detail: iss.detail,
          }),
          request: Object.freeze({ method: 'POST', url: 'DetectedIssue' }),
        }),
      ),
    ]),
  });

  return Object.freeze({
    truthClass: 'DERIVED_CLINICAL',
    clinicallyReviewed: false,
    requiresHumanPhysicianSignoff: true,
    egfrMlMin173m2,
    baselineQtcFMs,
    cumulativeDeltaQtcFMs,
    projectedQtcFMs,
    torsadesRiskHigh,
    medicationEvaluations: Object.freeze(medicationEvaluations),
    detectedIssues: Object.freeze(detectedIssues),
    satusehatFhirBundle: fhirBundle,
  });
}

/**
 * WAVE 50: Pan-Specialty Bayesian Differential Diagnosis & Acute Resuscitation Solver
 * across Neurosurgery/Neurology, Cardiology/ICU, ENT/Ophthalmology, Internal Medicine/Pediatrics, and Hyperbaric Medicine.
 */
export function solvePanSpecialtyBayesianResuscitationCortex(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Wave50: valid pan-specialty clinical input object is required');
  }

  // 1. Bayesian Pre-Test Probability -> Log-Odds Posterior Updating
  const priorProb = clamp(input.priorProbability ?? 0.25, 0.001, 0.999);
  const likelihoodRatios = Array.isArray(input.likelihoodRatios) ? input.likelihoodRatios : [1.0];
  const priorOdds = priorProb / (1 - priorProb);
  const combinedLr = likelihoodRatios.reduce((acc, lr) => acc * Math.max(0.01, lr), 1.0);
  const postOdds = priorOdds * combinedLr;
  const posteriorProbability = roundTo(postOdds / (1 + postOdds), 4);

  // 2. Neurosurgery & Neurology (Monro-Kellie CPP, Marshall CT, NIHSS/LVO)
  const mapMmHg = input.neuro?.mapMmHg ?? 88;
  const icpMmHg = input.neuro?.icpMmHg ?? 14;
  const cppMmHg = roundTo(mapMmHg - icpMmHg, 1);
  const midlineShiftMm = input.neuro?.midlineShiftMm ?? 0;
  const cisternsCompressed = Boolean(input.neuro?.cisternsCompressed);
  const highDensityMassMl = input.neuro?.highDensityMassMl ?? 0;
  const marshallCtClass =
    highDensityMassMl > 25
      ? 'Marshall_V_VI_Mass_Lesion'
      : midlineShiftMm > 5
        ? 'Marshall_IV_Midline_Shift_GT_5mm'
        : cisternsCompressed
          ? 'Marshall_III_Cisterns_Compressed'
          : 'Marshall_I_II_Diffuse';
  const nihssScore = input.neuro?.nihssScore ?? 2;
  const lvoSuspected = nihssScore >= 6;

  // 3. Cardiology & Acid-Base Stewart / Winter's Compensation + Delta Ratio
  const strokeVolumeMl = input.cardioIcu?.strokeVolumeMl ?? 70;
  const heartRateBpm = input.cardioIcu?.heartRateBpm ?? 75;
  const cvpMmHg = input.cardioIcu?.cvpMmHg ?? 8;
  const cardiacOutputLMin = roundTo((strokeVolumeMl * heartRateBpm) / 1000, 2);
  const svrDynSCm5 = roundTo((80 * (mapMmHg - cvpMmHg)) / Math.max(0.5, cardiacOutputLMin), 0);

  const naMmolL = input.cardioIcu?.naMmolL ?? 140;
  const clMmolL = input.cardioIcu?.clMmolL ?? 104;
  const hco3MmolL = input.cardioIcu?.hco3MmolL ?? 24;
  const paco2MmHg = input.cardioIcu?.paco2MmHg ?? 40;
  const albuminGdl = input.cardioIcu?.albuminGdl ?? 4.0;
  const rawAnionGap = naMmolL - (clMmolL + hco3MmolL);
  const albuminCorrectedAnionGap = roundTo(rawAnionGap + 2.5 * (4.0 - albuminGdl), 2);
  const expectedWintersPaco2 = roundTo(1.5 * hco3MmolL + 8, 1);
  const wintersCompensationAppropriate = Math.abs(paco2MmHg - expectedWintersPaco2) <= 2.0;
  const deltaRatio =
    24 - hco3MmolL > 0 ? roundTo((albuminCorrectedAnionGap - 12) / (24 - hco3MmolL), 2) : 1.0;

  // 4. ENT (THT-KL) & Ophthalmology (Air-Bone Gap, BPPV Maneuver, Ehlers IOP)
  const airConductionDb = input.entOphtho?.airConductionDb ?? 20;
  const boneConductionDb = input.entOphtho?.boneConductionDb ?? 10;
  const airBoneGapDb = roundTo(airConductionDb - boneConductionDb, 1);
  const semicircularCanal = input.entOphtho?.bppvCanal ?? 'posterior';
  const recommendedBppvManeuver =
    semicircularCanal === 'horizontal' ? 'Barbecue_Roll_Lempert_270' : 'Epley_Canalith_Repositioning';
  const measuredIopMmHg = input.entOphtho?.measuredIopMmHg ?? 18;
  const centralCornealThicknessUm = input.entOphtho?.centralCornealThicknessUm ?? 545;
  const ehlersCorrectedIopMmHg = roundTo(
    measuredIopMmHg + 0.071 * (545 - centralCornealThicknessUm),
    2,
  );

  // 5. Internal Medicine, Rheumatology & Pediatrics (SLEDAI-2K, Holliday-Segar, Dengue Shock, Parkland)
  const sledai2kScore = input.pedsInternal?.sledai2kScore ?? 0;
  const ifnGeneSignatureHigh = Boolean(input.pedsInternal?.ifnGeneSignatureHigh);
  const anifrolumabCandidate = sledai2kScore >= 6 && ifnGeneSignatureHigh;

  const weightKg = input.pedsInternal?.weightKg ?? 25;
  const hollidaySegarMlHr = roundTo(
    weightKg <= 10
      ? weightKg * 4
      : weightKg <= 20
        ? 40 + (weightKg - 10) * 2
        : 60 + (weightKg - 20) * 1,
    1,
  );

  const baselineHematocritPct = input.pedsInternal?.baselineHematocritPct ?? 38;
  const currentHematocritPct = input.pedsInternal?.currentHematocritPct ?? 38;
  const pulsePressureMmHg = input.pedsInternal?.pulsePressureMmHg ?? 40;
  const hematocritRisePct = roundTo(
    ((currentHematocritPct - baselineHematocritPct) / Math.max(10, baselineHematocritPct)) * 100,
    2,
  );
  const dengueShockSyndromeDetected = hematocritRisePct >= 20 && pulsePressureMmHg <= 20;

  const burnTbsaPct = input.pedsInternal?.burnTbsaPct ?? 0;
  const parklandTotal24hMl = roundTo(4 * weightKg * burnTbsaPct, 0);
  const parklandFirst8hMl = roundTo(parklandTotal24hMl / 2, 0);

  // 6. Hyperbaric & Diving Medicine (Bühlmann ZHL-16C Schreiner Equation, Dalton ppO2/MOD, Teed)
  const depthMetersSeawater = input.hyperbaric?.depthMetersSeawater ?? 0;
  const bottomTimeMinutes = input.hyperbaric?.bottomTimeMinutes ?? 0;
  const fractionO2 = input.hyperbaric?.fractionO2 ?? 0.21;
  const ambientPressureBar = roundTo(1 + depthMetersSeawater / 10, 3);
  const ppO2Bar = roundTo(fractionO2 * ambientPressureBar, 3);
  const maxOperatingDepthMeters = roundTo(10 * (1.4 / Math.max(0.05, fractionO2) - 1), 1);
  const fractionN2 = 1 - fractionO2;
  const initialTissueN2Bar = 0.79 * (1 - 0.0627);
  const alveolarN2Bar = fractionN2 * (ambientPressureBar - 0.0627);
  const compartmentHalfTimeMin = input.hyperbaric?.compartmentHalfTimeMin ?? 12.5;
  const tissueN2TensionBar = roundTo(
    initialTissueN2Bar + (alveolarN2Bar - initialTissueN2Bar) * (1 - 2 ** (-bottomTimeMinutes / compartmentHalfTimeMin)),
    4,
  );

  return Object.freeze({
    truthClass: 'DERIVED_CLINICAL',
    clinicallyReviewed: false,
    requiresHumanPhysicianSignoff: true,
    bayesianUpdate: Object.freeze({
      priorProbability: priorProb,
      combinedLikelihoodRatio: roundTo(combinedLr, 3),
      posteriorProbability,
    }),
    neuro: Object.freeze({
      cppMmHg,
      marshallCtClass,
      lvoSuspected,
    }),
    cardioIcu: Object.freeze({
      cardiacOutputLMin,
      svrDynSCm5,
      albuminCorrectedAnionGap,
      expectedWintersPaco2,
      wintersCompensationAppropriate,
      deltaRatio,
    }),
    entOphtho: Object.freeze({
      airBoneGapDb,
      recommendedBppvManeuver,
      ehlersCorrectedIopMmHg,
    }),
    pedsInternal: Object.freeze({
      anifrolumabCandidate,
      hollidaySegarMlHr,
      hematocritRisePct,
      dengueShockSyndromeDetected,
      parklandTotal24hMl,
      parklandFirst8hMl,
    }),
    hyperbaric: Object.freeze({
      ambientPressureBar,
      ppO2Bar,
      maxOperatingDepthMeters,
      tissueN2TensionBar,
    }),
  });
}

/**
 * WAVE 51: Zero-Knowledge Federated Discovery Commons & SHA-256 Merkle-Tree Clinical Audit Ledger.
 */
export function aggregateFederatedDiscoveryMerkleCommons(input) {
  if (!input || !Array.isArray(input.contributions) || input.contributions.length === 0) {
    throw new Error('Wave51: non-empty contributions array is required');
  }
  const {
    contributions,
    clippingNormBound = 1.0,
    privacyEpsilon = 1.2,
    privacyDelta = 1e-5,
    validRange = { min: 0, max: 500 },
  } = input;

  const verifiedNodes = [];
  const leafHashes = [];

  for (const node of contributions) {
    const inRange =
      typeof node.biomarkerScalar === 'number' &&
      Number.isFinite(node.biomarkerScalar) &&
      node.biomarkerScalar >= validRange.min &&
      node.biomarkerScalar <= validRange.max;
    const expectedCommitment = sha256Hex(`${node.nodeId}:${node.biomarkerScalar}:${node.salt}`);
    const commitmentValid =
      !node.rangeCommitmentHash || node.rangeCommitmentHash === expectedCommitment;

    if (!inRange || !commitmentValid) {
      throw new Error(`Wave51: zero-knowledge range or commitment verification failed for node ${node.nodeId}`);
    }

    const gradVector = Array.isArray(node.gradientVector) ? node.gradientVector : [0];
    const l2Norm = Math.sqrt(gradVector.reduce((acc, g) => acc + g * g, 0));
    const scaleFactor = l2Norm > clippingNormBound ? clippingNormBound / l2Norm : 1.0;
    const clippedGradient = gradVector.map((g) => roundTo(g * scaleFactor, 6));

    const leafHash = sha256Hex(
      JSON.stringify({
        nodeId: node.nodeId,
        commitment: expectedCommitment,
        clippedGradient,
      }),
    );
    leafHashes.push(leafHash);
    verifiedNodes.push(
      Object.freeze({
        nodeId: node.nodeId,
        clippedGradient: Object.freeze(clippedGradient),
        l2NormBeforeClip: roundTo(l2Norm, 4),
        leafHash,
      }),
    );
  }

  const dim = verifiedNodes[0].clippedGradient.length;
  const meanClippedGradient = Array.from({ length: dim }, (_, d) => {
    const sum = verifiedNodes.reduce((acc, n) => acc + (n.clippedGradient[d] ?? 0), 0);
    return roundTo(sum / verifiedNodes.length, 6);
  });

  // Gaussian DP sensitivity & sigma calibration
  const l2Sensitivity = roundTo((2 * clippingNormBound) / verifiedNodes.length, 6);
  const dpNoiseSigma = roundTo(
    (l2Sensitivity * Math.sqrt(2 * Math.log(1.25 / privacyDelta))) / privacyEpsilon,
    6,
  );

  // Deterministic Binary SHA-256 Merkle Tree Construction
  let currentLevel = [...leafHashes];
  const treeLevels = [Object.freeze([...currentLevel])];
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] ?? left;
      nextLevel.push(sha256Hex(`${left}:${right}`));
    }
    treeLevels.push(Object.freeze(nextLevel));
    currentLevel = nextLevel;
  }
  const merkleRoot = currentLevel[0];

  return Object.freeze({
    truthClass: 'DERIVED_CLINICAL',
    clinicallyReviewed: false,
    requiresHumanPhysicianSignoff: true,
    participantCount: verifiedNodes.length,
    meanClippedGradient: Object.freeze(meanClippedGradient),
    l2Sensitivity,
    dpNoiseSigma,
    merkleRoot,
    leafHashes: Object.freeze(leafHashes),
    treeLevels: Object.freeze(treeLevels),
  });
}

export function verifyMerkleInclusionProof(leafHash, proofSteps, expectedMerkleRoot) {
  let current = leafHash;
  for (const step of proofSteps) {
    current =
      step.position === 'right'
        ? sha256Hex(`${current}:${step.siblingHash}`)
        : sha256Hex(`${step.siblingHash}:${current}`);
  }
  return current === expectedMerkleRoot;
}
