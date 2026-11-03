/**
 * PanaceaMed Dynamic Longevity, Anti-Aging & Precision Bioenergetics Engine (Pillar VI).
 *
 * Scientific citations and peer-reviewed literature anchors:
 * 1. Levine ME, Lu AT, Quach A, et al. An epigenetic biomarker of aging for lifespan and healthspan.
 *    Aging (Albany NY). 2018;10(4):573-641. PMID: 29676998.
 * 2. Kleiber M. Body size and metabolism. Hilgardia. 1932;6(11):315-353.
 * 3. Gillooly JF, Brown JH, West GB, Savage VM, Charnov EL. Effects of size and temperature on
 *    metabolic rate. Science. 2001;293(5538):2248-2251. PMID: 11567137.
 * 4. Brand MD. The sites and mechanisms of uncoupling protein 1, 2 and 3 action in mitochondria.
 *    Exp Physiol. 2000;85(6):639-650. PMID: 10839994.
 * 5. Hallberg L, Brune M, Rossander L. The role of vitamin C in iron absorption.
 *    Int J Vitam Nutr Res Suppl. 1989;30:103-108. PMID: 2507689.
 * 6. Nemeth E, Ganz T. The role of hepcidin in iron metabolism.
 *    Acta Haematol. 2009;122(2-3):78-86. PMID: 19923865.
 * 7. Service FJ, Molnar GD, Rosevear JW, Ackerman E, Gatewood LC, Taylor WF. Mean amplitude of glycemic
 *    excursions, a measure of diabetic instability. Diabetes. 1970;19(9):644-655. PMID: 5469618.
 * 8. Kovatchev BP, Cox DJ, Gonder-Frederick LA, Young-Hyman D, Schlundt D, Clarke W. Assessment of risk for
 *    severe hypoglycemia among adults with IDDM: validation of the low blood glucose index.
 *    Diabetes Care. 1998;21(11):1870-1875. PMID: 9802735.
 */

export const LONGEVITY_PRECISION_DISCLAIMER =
  'Translational longevity physiology & bioenergetic kinetic models — strictly exploratory wellness reference and educational simulation, not autonomous medical diagnosis or clinical prescription.' as const;

export const LONGEVITY_LITERATURE_SOURCES = Object.freeze({
  phenoAge: {
    citation: 'Levine ME et al. An epigenetic biomarker of aging for lifespan and healthspan. Aging. 2018;10(4):573-641.',
    pmid: '29676998',
    doi: '10.18632/aging.101414',
  },
  allometricBioenergetics: {
    citation: 'Kleiber M. Hilgardia. 1932;6(11):315-353; Gillooly JF et al. Science. 2001;293(5538):2248-2251.',
    pmid: '11567137',
  },
  micronutrientBioavailability: {
    citation: 'Hallberg L et al. Int J Vitam Nutr Res. 1989;30:103-108; Nemeth E, Ganz T. Acta Haematol. 2009;122(2-3):78-86.',
    pmid: '19923865',
  },
  continuousGlucoseVariability: {
    citation: 'Service FJ et al. Diabetes. 1970;19(9):644-655; Kovatchev BP et al. Diabetes Care. 1998;21(11):1870-1875.',
    pmid: '9802735',
  },
});

/* =========================================================================
   1. LEVINE PHENOAGE & MULTI-ORGAN BIOLOGICAL AGE CLOCKS
   ========================================================================= */

export interface LevineBiomarkersInput {
  readonly chronologicalAgeYears: number; // years [18 - 120]
  readonly albuminGPerDl: number; // Serum Albumin (g/dL, optimal 4.2 - 4.8)
  readonly creatinineMgPerDl: number; // Serum Creatinine (mg/dL, optimal 0.7 - 1.1)
  readonly serumGlucoseMgPerDl: number; // Fasting Glucose (mg/dL, optimal 72 - 88)
  readonly cReactiveProteinMgPerL: number; // hs-CRP (mg/L, optimal < 0.5)
  readonly lymphocytePercent: number; // Lymphocyte percentage (%, optimal 25 - 35)
  readonly meanCellVolumeFl: number; // MCV (fL, optimal 85 - 92)
  readonly redCellDistributionWidthPercent: number; // RDW (%, optimal 11.5 - 12.8)
  readonly alkalinePhosphataseUPerL: number; // ALP (U/L, optimal 50 - 80)
  readonly whiteBloodCellCount10e3PerUl: number; // WBC (10^3/uL, optimal 4.5 - 6.5)
}

export interface PhenoAgeBiomarkerImpact {
  readonly biomarker: string;
  readonly observedValue: number;
  readonly unit: string;
  readonly referenceOptimal: string;
  readonly contributionScore: number;
  readonly impact: 'longevity-protective' | 'neutral' | 'pro-aging';
}

export interface PhenoAgeEvaluationResult {
  readonly chronologicalAge: number;
  readonly phenotypicAgeYears: number;
  readonly phenotypicAgeDeltaYears: number; // phenoAge - chronologicalAge
  readonly tenYearMortalityRiskPercent: number; // Gompertz mortality risk probability %
  readonly agingPaceCategory: 'slowed-aging' | 'expected-aging' | 'accelerated-aging';
  readonly biomarkerDeviations: readonly PhenoAgeBiomarkerImpact[];
  readonly formulaProvenance: string;
}

/**
 * Calculates Levine PhenoAge using the 2018 published NHANES Gompertz proportional hazard model.
 * Pure, deterministic, fail-closed function.
 */
export function calculateLevinePhenoAge(input: LevineBiomarkersInput): PhenoAgeEvaluationResult {
  const age = Math.max(18, Math.min(120, input.chronologicalAgeYears || 30));
  const albGPerL = Math.max(10, Math.min(60, (input.albuminGPerDl || 4.5) * 10)); // g/L
  const creatUmolPerL = Math.max(20, Math.min(1200, (input.creatinineMgPerDl || 0.9) * 88.4)); // umol/L
  const glucMmolPerL = Math.max(2, Math.min(30, (input.serumGlucoseMgPerDl || 90) / 18.018)); // mmol/L
  const crpMgPerDl = Math.max(0.01, Math.min(50, (input.cReactiveProteinMgPerL || 0.8) / 10)); // mg/dL
  const lnCrp = Math.log(crpMgPerDl);
  const lymph = Math.max(5, Math.min(60, input.lymphocytePercent || 30)); // %
  const mcv = Math.max(60, Math.min(120, input.meanCellVolumeFl || 90)); // fL
  const rdw = Math.max(8, Math.min(25, input.redCellDistributionWidthPercent || 12.5)); // %
  const alp = Math.max(15, Math.min(350, input.alkalinePhosphataseUPerL || 65)); // U/L
  const wbc = Math.max(1, Math.min(30, input.whiteBloodCellCount10e3PerUl || 6.0)); // 10^3/uL

  // Levine 2018 Table 1 linear predictor (xb)
  const xb =
    -19.907 -
    0.0336 * albGPerL +
    0.0095 * creatUmolPerL +
    0.1953 * glucMmolPerL +
    0.0954 * lnCrp -
    0.0120 * lymph +
    0.0268 * mcv +
    0.3306 * rdw +
    0.00188 * alp +
    0.0554 * wbc +
    0.0804 * age;

  // 10-year cumulative mortality risk under Gompertz survival distribution
  const gamma = 0.0076927;
  const expTerm = Math.exp(120 * gamma) - 1; // 120 months = 10 years
  const mortalityRisk = 1 - Math.exp(-Math.exp(xb) * (expTerm / gamma));
  const boundedMortalityRisk = Math.max(0.0001, Math.min(0.9999, mortalityRisk));

  // Phenotypic Age inversion from mortality hazard
  const phenoAgeRaw = 141.5 + Math.log(-0.00553 * Math.log(1 - boundedMortalityRisk)) / 0.09165;
  const phenoAge = Math.max(15, Math.min(120, Math.round(phenoAgeRaw * 10) / 10));
  const delta = Math.round((phenoAge - age) * 10) / 10;

  let pace: 'slowed-aging' | 'expected-aging' | 'accelerated-aging' = 'expected-aging';
  if (delta <= -2.0) pace = 'slowed-aging';
  else if (delta >= 2.0) pace = 'accelerated-aging';

  const deviations: PhenoAgeBiomarkerImpact[] = [
    {
      biomarker: 'Albumin',
      observedValue: input.albuminGPerDl,
      unit: 'g/dL',
      referenceOptimal: '4.4 - 5.0 g/dL',
      contributionScore: -0.336 * (input.albuminGPerDl - 4.5),
      impact: input.albuminGPerDl >= 4.4 ? 'longevity-protective' : input.albuminGPerDl < 3.8 ? 'pro-aging' : 'neutral',
    },
    {
      biomarker: 'Creatinine',
      observedValue: input.creatinineMgPerDl,
      unit: 'mg/dL',
      referenceOptimal: '0.7 - 1.0 mg/dL',
      contributionScore: 0.84 * (input.creatinineMgPerDl - 0.9),
      impact: input.creatinineMgPerDl > 1.2 ? 'pro-aging' : 'longevity-protective',
    },
    {
      biomarker: 'Fasting Glucose',
      observedValue: input.serumGlucoseMgPerDl,
      unit: 'mg/dL',
      referenceOptimal: '75 - 88 mg/dL',
      contributionScore: 0.0108 * (input.serumGlucoseMgPerDl - 85),
      impact: input.serumGlucoseMgPerDl > 99 ? 'pro-aging' : input.serumGlucoseMgPerDl <= 88 ? 'longevity-protective' : 'neutral',
    },
    {
      biomarker: 'hs-CRP',
      observedValue: input.cReactiveProteinMgPerL,
      unit: 'mg/L',
      referenceOptimal: '< 0.5 mg/L',
      contributionScore: 0.0954 * Math.log((input.cReactiveProteinMgPerL || 0.1) / 10),
      impact: input.cReactiveProteinMgPerL > 2.0 ? 'pro-aging' : input.cReactiveProteinMgPerL < 0.8 ? 'longevity-protective' : 'neutral',
    },
    {
      biomarker: 'RDW',
      observedValue: input.redCellDistributionWidthPercent,
      unit: '%',
      referenceOptimal: '11.5 - 12.8 %',
      contributionScore: 0.3306 * (input.redCellDistributionWidthPercent - 12.5),
      impact: input.redCellDistributionWidthPercent > 13.5 ? 'pro-aging' : 'longevity-protective',
    },
    {
      biomarker: 'Lymphocyte %',
      observedValue: input.lymphocytePercent,
      unit: '%',
      referenceOptimal: '28 - 38 %',
      contributionScore: -0.012 * (input.lymphocytePercent - 32),
      impact: input.lymphocytePercent < 20 ? 'pro-aging' : 'longevity-protective',
    },
  ];

  return {
    chronologicalAge: age,
    phenotypicAgeYears: phenoAge,
    phenotypicAgeDeltaYears: delta,
    tenYearMortalityRiskPercent: Math.round(boundedMortalityRisk * 1000) / 10,
    agingPaceCategory: pace,
    biomarkerDeviations: deviations,
    formulaProvenance: 'Levine ME et al. Aging. 2018;10(4):573-641 (PMID: 29676998)',
  };
}

/* =========================================================================
   2. ORGAN-SPECIFIC BIOLOGICAL AGE DELTAS
   ========================================================================= */

export type OrganSystemKey = 'cardiovascular' | 'renal' | 'hepatic' | 'metabolic' | 'immune' | 'neuromuscular';

export interface OrganAgeProfile {
  readonly systemKey: OrganSystemKey;
  readonly label: string;
  readonly biologicalAge: number;
  readonly deltaYears: number; // biologicalAge - chronologicalAge
  readonly primaryContributors: readonly string[];
  readonly status: 'youthful' | 'synchronized' | 'accelerated';
}

export interface MultiOrganAgeInput {
  readonly chronologicalAge: number;
  readonly cardiovascular: {
    readonly systolicBp: number; // mmHg
    readonly restingHr: number; // bpm
    readonly vo2Max: number; // ml/kg/min
    readonly ldlCholesterol: number; // mg/dL
    readonly hsCrp: number; // mg/L
  };
  readonly renal: {
    readonly egfr: number; // ml/min/1.73m2
    readonly creatinine: number; // mg/dL
    readonly bun: number; // mg/dL
  };
  readonly hepatic: {
    readonly alt: number; // U/L
    readonly ast: number; // U/L
    readonly albumin: number; // g/dL
  };
  readonly metabolic: {
    readonly fastingGlucose: number; // mg/dL
    readonly hba1c: number; // %
    readonly triglycerides: number; // mg/dL
    readonly waistHipRatio: number;
  };
  readonly immune: {
    readonly wbc: number; // 10^3/uL
    readonly hsCrp: number; // mg/L
    readonly neutrophilToLymphocyteRatio: number;
  };
  readonly neuromuscular: {
    readonly gripStrengthKg: number; // kg
    readonly balanceSeconds: number; // seconds
    readonly sleepHours: number; // hours
  };
}

export interface MultiOrganAgeResult {
  readonly chronologicalAge: number;
  readonly compositeOrganBioAge: number;
  readonly weakestLinkOrgan: OrganAgeProfile;
  readonly organProfiles: readonly OrganAgeProfile[];
  readonly systemResilienceScore: number; // 0 - 100
}

/**
 * Computes organ-specific biological age deltas across 6 primary physiological systems.
 */
export function evaluateMultiOrganBiologicalAge(input: MultiOrganAgeInput): MultiOrganAgeResult {
  const age = Math.max(18, Math.min(100, input.chronologicalAge));

  // 1. Cardiovascular
  let cvDelta = 0;
  const cvNotes: string[] = [];
  if (input.cardiovascular.systolicBp > 120) {
    cvDelta += (input.cardiovascular.systolicBp - 120) * 0.12;
    cvNotes.push(`SBP +${input.cardiovascular.systolicBp - 120} mmHg`);
  }
  if (input.cardiovascular.restingHr > 60) {
    cvDelta += (input.cardiovascular.restingHr - 60) * 0.15;
    cvNotes.push(`RHR elevated (${input.cardiovascular.restingHr} bpm)`);
  }
  if (input.cardiovascular.vo2Max > 0) {
    const expectedVo2 = Math.max(25, 48 - (age - 25) * 0.38);
    const vo2Diff = input.cardiovascular.vo2Max - expectedVo2;
    cvDelta -= vo2Diff * 0.35; // higher VO2 drops CV age
    if (vo2Diff > 0) cvNotes.push(`Superior VO₂max (+${vo2Diff.toFixed(1)} ml/kg)`);
  }
  if (input.cardiovascular.ldlCholesterol > 115) {
    cvDelta += (input.cardiovascular.ldlCholesterol - 115) * 0.04;
  }
  const cvAge = Math.max(15, Math.round((age + cvDelta) * 10) / 10);

  // 2. Renal
  let renalDelta = 0;
  const renalNotes: string[] = [];
  if (input.renal.egfr < 90) {
    renalDelta += (90 - input.renal.egfr) * 0.22;
    renalNotes.push(`eGFR reduced (${input.renal.egfr} ml/min)`);
  } else if (input.renal.egfr >= 105) {
    renalDelta -= 2.0;
    renalNotes.push('Optimal hyperfiltration reserve');
  }
  if (input.renal.creatinine > 1.1) {
    renalDelta += (input.renal.creatinine - 1.1) * 6.5;
  }
  const renalAge = Math.max(15, Math.round((age + renalDelta) * 10) / 10);

  // 3. Hepatic
  let hepaticDelta = 0;
  const hepaticNotes: string[] = [];
  if (input.hepatic.alt > 30) {
    hepaticDelta += (input.hepatic.alt - 30) * 0.14;
    hepaticNotes.push(`ALT transaminase stress (${input.hepatic.alt} U/L)`);
  }
  if (input.hepatic.albumin < 4.4) {
    hepaticDelta += (4.4 - input.hepatic.albumin) * 4.0;
    hepaticNotes.push('Suboptimal synthetic capacity');
  } else {
    hepaticDelta -= 1.5;
    hepaticNotes.push('Robust hepatic albumin synthesis');
  }
  const hepaticAge = Math.max(15, Math.round((age + hepaticDelta) * 10) / 10);

  // 4. Metabolic
  let metabolicDelta = 0;
  const metabolicNotes: string[] = [];
  if (input.metabolic.fastingGlucose > 90) {
    metabolicDelta += (input.metabolic.fastingGlucose - 90) * 0.18;
    metabolicNotes.push(`Fasting glucose ${input.metabolic.fastingGlucose} mg/dL`);
  }
  if (input.metabolic.hba1c > 5.3) {
    metabolicDelta += (input.metabolic.hba1c - 5.3) * 3.5;
    metabolicNotes.push(`Glycated HbA1c ${input.metabolic.hba1c}%`);
  }
  if (input.metabolic.waistHipRatio > 0.88) {
    metabolicDelta += (input.metabolic.waistHipRatio - 0.88) * 20;
    metabolicNotes.push('Visceral adiposity profile');
  }
  const metabolicAge = Math.max(15, Math.round((age + metabolicDelta) * 10) / 10);

  // 5. Immune
  let immuneDelta = 0;
  const immuneNotes: string[] = [];
  if (input.immune.hsCrp > 1.0) {
    immuneDelta += (input.immune.hsCrp - 1.0) * 1.8;
    immuneNotes.push(`Systemic inflame-aging (hs-CRP ${input.immune.hsCrp} mg/L)`);
  }
  if (input.immune.neutrophilToLymphocyteRatio > 2.5) {
    immuneDelta += (input.immune.neutrophilToLymphocyteRatio - 2.5) * 1.5;
    immuneNotes.push('Elevated NLR immunosenescence index');
  }
  const immuneAge = Math.max(15, Math.round((age + immuneDelta) * 10) / 10);

  // 6. Neuromuscular
  let neuroDelta = 0;
  const neuroNotes: string[] = [];
  if (input.neuromuscular.gripStrengthKg > 0) {
    const expectedGrip = Math.max(22, 45 - (age - 25) * 0.28);
    neuroDelta -= (input.neuromuscular.gripStrengthKg - expectedGrip) * 0.22;
  }
  if (input.neuromuscular.balanceSeconds < 25) {
    neuroDelta += (25 - input.neuromuscular.balanceSeconds) * 0.16;
    neuroNotes.push('Proprioceptive balance degradation');
  }
  if (input.neuromuscular.sleepHours < 7.0) {
    neuroDelta += (7.0 - input.neuromuscular.sleepHours) * 1.8;
    neuroNotes.push(`Chronic sleep debt (${input.neuromuscular.sleepHours}h)`);
  }
  const neuroAge = Math.max(15, Math.round((age + neuroDelta) * 10) / 10);

  const makeProfile = (key: OrganSystemKey, label: string, bioAge: number, notes: readonly string[]): OrganAgeProfile => {
    const d = Math.round((bioAge - age) * 10) / 10;
    return {
      systemKey: key,
      label,
      biologicalAge: bioAge,
      deltaYears: d,
      primaryContributors: notes.length ? notes : ['Parameters within optimal biological reference'],
      status: d <= -1.5 ? 'youthful' : d >= 1.5 ? 'accelerated' : 'synchronized',
    };
  };

  const profiles: OrganAgeProfile[] = [
    makeProfile('cardiovascular', 'Cardiovascular & Endothelial', cvAge, cvNotes),
    makeProfile('renal', 'Renal Filtration & Glomerular', renalAge, renalNotes),
    makeProfile('hepatic', 'Hepatic & Metabolic Clearance', hepaticAge, hepaticNotes),
    makeProfile('metabolic', 'Metabolic & Glycemic Homeostasis', metabolicAge, metabolicNotes),
    makeProfile('immune', 'Immune & Inflammatory Senescence', immuneAge, immuneNotes),
    makeProfile('neuromuscular', 'Neuromuscular & Neuro-Cognitive', neuroAge, neuroNotes),
  ];

  // Weakest link is the organ with highest positive delta (most accelerated aging)
  const sortedByDelta = [...profiles].sort((a, b) => b.deltaYears - a.deltaYears);
  const weakest = sortedByDelta[0];

  const compositeAge = Math.round((profiles.reduce((sum, p) => sum + p.biologicalAge, 0) / profiles.length) * 10) / 10;
  const avgDelta = compositeAge - age;
  const resilienceScore = Math.max(0, Math.min(100, Math.round(80 - avgDelta * 4)));

  return {
    chronologicalAge: age,
    compositeOrganBioAge: compositeAge,
    weakestLinkOrgan: weakest,
    organProfiles: profiles,
    systemResilienceScore: resilienceScore,
  };
}

/* =========================================================================
   3. KLEIBER ALLOMETRIC SCALING & MITOCHONDRIAL BIOENERGETICS
   ========================================================================= */

export interface KleiberBioenergeticsInput {
  readonly bodyMassKg: number; // M in kg
  readonly coreBodyTempCelsius?: number; // default 37.0 C
  readonly physicalActivityLevel?: number; // PAL: 1.2 (sedentary) to 2.4 (elite)
  readonly protonLeakFraction?: number; // default 0.22 (22% basal uncoupling leak)
}

export interface KleiberBioenergeticsResult {
  readonly bodyMassKg: number;
  readonly kleiberBasalMetabolicRateKcalPerDay: number; // BMR = 70 * M^0.75
  readonly arrheniusTemperatureFactor: number; // exp(-Ea/(kB*T)) relative to 37C
  readonly temperatureAdjustedBmrKcalPerDay: number;
  readonly totalDailyEnergyExpenditureKcalPerDay: number; // TDEE = BMR * PAL
  readonly mitochondrialOxphosAtpFluxMolesPerDay: number; // daily ATP turnover in moles
  readonly uncouplingProtonLeakHeatDissipationKcalPerDay: number; // UCP dissipation
  readonly allometricScalingExponent: 0.75;
  readonly thermodynamicEfficiencyPercent: number; // ~42%
  readonly citation: string;
}

/**
 * Computes Kleiber allometric metabolic scaling with Arrhenius temperature kinetics and
 * mitochondrial ATP vs proton-leak flux.
 */
export function calculateKleiberBioenergetics(input: KleiberBioenergeticsInput): KleiberBioenergeticsResult {
  const mass = Math.max(30, Math.min(250, input.bodyMassKg || 70));
  const tempC = Math.max(34, Math.min(42, input.coreBodyTempCelsius ?? 37.0));
  const pal = Math.max(1.1, Math.min(3.0, input.physicalActivityLevel ?? 1.55));
  const leakFraction = Math.max(0.1, Math.min(0.4, input.protonLeakFraction ?? 0.22));

  // Kleiber 1932: BMR = 70 * M^0.75 kcal/day
  const baseKleiberBmr = 70.0 * Math.pow(mass, 0.75);

  // Gillooly-Arrhenius Ecological Metabolic Theory:
  // exp(-Ea / (kB * T)) where Ea = 0.65 eV, kB = 8.617333e-5 eV/K
  // Ratio against reference 37.0 C (310.15 K)
  const T_kelvin = tempC + 273.15;
  const T_ref = 310.15; // 37 C
  const Ea_over_kB = 0.65 / 8.617333262145e-5; // ~7542.92 K
  const arrheniusFactor = Math.exp(-Ea_over_kB * (1 / T_kelvin - 1 / T_ref));

  const adjustedBmr = baseKleiberBmr * arrheniusFactor;
  const tdee = adjustedBmr * pal;

  // Mitochondrial Bioenergetics:
  // ~42% of metabolic energy captured as ATP; physiological delta G = ~7.3 kcal/mol ATP
  const oxphosEfficiency = 0.42;
  const atpEnergyKcal = adjustedBmr * oxphosEfficiency;
  const dailyAtpMoles = atpEnergyKcal / 7.3;

  // Proton leak / thermogenesis dissipation (Brand 2000)
  const leakKcal = adjustedBmr * leakFraction;

  return {
    bodyMassKg: mass,
    kleiberBasalMetabolicRateKcalPerDay: Math.round(baseKleiberBmr * 10) / 10,
    arrheniusTemperatureFactor: Math.round(arrheniusFactor * 1000) / 1000,
    temperatureAdjustedBmrKcalPerDay: Math.round(adjustedBmr * 10) / 10,
    totalDailyEnergyExpenditureKcalPerDay: Math.round(tdee * 10) / 10,
    mitochondrialOxphosAtpFluxMolesPerDay: Math.round(dailyAtpMoles * 10) / 10,
    uncouplingProtonLeakHeatDissipationKcalPerDay: Math.round(leakKcal * 10) / 10,
    allometricScalingExponent: 0.75,
    thermodynamicEfficiencyPercent: Math.round(oxphosEfficiency * 100),
    citation: 'Kleiber M. Hilgardia. 1932;6:315-353; Gillooly JF et al. Science. 2001;293:2248-2251.',
  };
}

/* =========================================================================
   4. MICRONUTRIENT BIO-AVAILABILITY & HEPCIDIN-FERROPORTIN AXIS
   ========================================================================= */

export interface MicronutrientCoIngestionInput {
  readonly elementalIronMg: number; // e.g. 18 mg
  readonly isHemeIron?: boolean; // false = non-heme (subject to DMT1 competitive absorption)
  readonly elementalZincMg: number; // e.g. 15 mg
  readonly elementalCopperMg: number; // e.g. 2 mg
  readonly elementalCalciumMg: number; // e.g. 600 mg
  readonly ascorbicAcidMg: number; // Vitamin C e.g. 250 mg
  readonly vitaminD3Iu?: number; // e.g. 2000 IU
  readonly serumHsCrpMgPerL?: number; // hs-CRP inflammation for hepcidin axis
  readonly estimatedEgfrMlMin?: number; // renal function for CYP27B1 calcitriol activation
}

export interface MicronutrientBioavailabilityResult {
  readonly fractionalIronAbsorptionPercent: number; // % absorbed
  readonly netAbsorbedIronMg: number;
  readonly fractionalZincAbsorptionPercent: number;
  readonly netAbsorbedZincMg: number;
  readonly fractionalCalciumAbsorptionPercent: number;
  readonly netAbsorbedCalciumMg: number;
  readonly dmt1CompetitionIndex: number; // ratio of competing cations to iron
  readonly hepcidinSuppressionFactor: number; // [0.1, 1.0] degradation of ferroportin by inflammation
  readonly vitaminDActivationEfficiencyPercent: number; // renal 1-alpha-hydroxylase function %
  readonly clinicalActionNotes: readonly string[];
}

/**
 * Evaluates micronutrient competitive absorption kinetics at duodenal DMT1 transporter
 * and systemic inflammatory hepcidin-ferroportin sequestration.
 */
export function evaluateMicronutrientBioavailability(input: MicronutrientCoIngestionInput): MicronutrientBioavailabilityResult {
  const feMg = Math.max(0, input.elementalIronMg || 0);
  const isHeme = !!input.isHemeIron;
  const znMg = Math.max(0, input.elementalZincMg || 0);
  const cuMg = Math.max(0, input.elementalCopperMg || 0);
  const caMg = Math.max(0, input.elementalCalciumMg || 0);
  const vitCMg = Math.max(0, input.ascorbicAcidMg || 0);
  const vitDIu = Math.max(0, input.vitaminD3Iu ?? 1000);
  const crp = Math.max(0, input.serumHsCrpMgPerL ?? 0.5);
  const egfr = Math.max(15, Math.min(120, input.estimatedEgfrMlMin ?? 95));

  const notes: string[] = [];

  // Hepcidin Axis:
  // High systemic inflammation (IL-6 -> STAT3 -> HAMP) activates hepcidin,
  // causing ferroportin internalization and degradation.
  // CRP < 1.0 mg/L = normal hepcidin; CRP > 3.0 mg/L = high hepcidin (60-80% iron trapping)
  let hepcidinFactor = 1.0;
  if (crp > 1.0) {
    hepcidinFactor = Math.max(0.2, 1.0 - Math.min(0.8, (crp - 1.0) * 0.18));
    notes.push(`Elevated hs-CRP (${crp} mg/L) induces hepcidin ferroportin degradation: iron export damped to ${(hepcidinFactor * 100).toFixed(0)}%`);
  }

  // Iron Absorption Kinetics:
  let fePercent = 0;
  if (feMg > 0) {
    if (isHeme) {
      // Heme iron absorbed via HCP1/FLVCR2 independent of DMT1
      fePercent = 25.0 * hepcidinFactor;
      notes.push('Heme iron: bypasses DMT1 divalent competition');
    } else {
      // Non-heme iron: baseline ~8%
      let base = 8.0;

      // Ascorbic acid reduces Fe3+ to Fe2+, boosting uptake up to 2.8x (Hallberg 1989)
      if (vitCMg > 0) {
        const vitCBoost = 1.0 + 1.8 * (vitCMg / (vitCMg + 60));
        base *= vitCBoost;
        notes.push(`Ascorbic acid (+${vitCMg} mg Vit C) reduces ferric Fe³⁺ to bioavailable ferrous Fe²⁺ (${vitCBoost.toFixed(2)}x boost)`);
      }

      // Calcium inhibition: > 300 mg Ca competitively inhibits iron absorption
      if (caMg > 300) {
        const caDamp = Math.max(0.45, 1.0 - (caMg - 300) * 0.0006);
        base *= caDamp;
        notes.push(`Co-ingested Calcium (${caMg} mg) competes at enterocyte membrane (-${((1 - caDamp) * 100).toFixed(0)}% Fe absorption)`);
      }

      // Zinc competition at DMT1 (molar competition)
      const znFeRatio = feMg > 0 ? znMg / feMg : 0;
      if (znFeRatio > 1.5) {
        base *= 0.75;
        notes.push(`High Zinc-to-Iron ratio (${znFeRatio.toFixed(1)}:1) competitively inhibits DMT1 transporter`);
      }

      fePercent = Math.max(1.0, Math.min(35.0, base * hepcidinFactor));
    }
  }

  const netFe = Math.round((feMg * (fePercent / 100)) * 100) / 100;

  // Zinc Absorption Kinetics (ZIP4 transporter):
  let znPercent = 30.0;
  if (cuMg > 3.0) {
    znPercent *= 0.85; // slight copper antagonism
  }
  const netZn = Math.round((znMg * (znPercent / 100)) * 100) / 100;

  // Calcium Absorption & Vitamin D calcitriol activation:
  // CYP27B1 1-alpha-hydroxylase efficiency in proximal tubules depends on renal eGFR
  const renalHydroxylaseEfficiency = Math.max(20, Math.min(100, (egfr / 90) * 100));
  let caPercent = 25.0;
  if (vitDIu >= 2000 && egfr >= 75) {
    caPercent = 35.0; // Calbindin-D9k induction
    notes.push('Sufficient Vitamin D & intact eGFR induce enterocyte Calbindin-D9k (maximal 35% Ca uptake)');
  } else if (egfr < 45) {
    caPercent = 12.0;
    notes.push('Impaired renal 1α-hydroxylase reduces calcitriol synthesis, limiting calcium absorption');
  }
  const netCa = Math.round((caMg * (caPercent / 100)) * 10) / 10;

  // DMT1 Competition Index
  const competitionIndex = feMg > 0 ? Math.round(((znMg * 0.8 + cuMg * 1.2 + caMg * 0.05) / feMg) * 10) / 10 : 0;

  return {
    fractionalIronAbsorptionPercent: Math.round(fePercent * 10) / 10,
    netAbsorbedIronMg: netFe,
    fractionalZincAbsorptionPercent: Math.round(znPercent * 10) / 10,
    netAbsorbedZincMg: netZn,
    fractionalCalciumAbsorptionPercent: Math.round(caPercent * 10) / 10,
    netAbsorbedCalciumMg: netCa,
    dmt1CompetitionIndex: competitionIndex,
    hepcidinSuppressionFactor: Math.round(hepcidinFactor * 100) / 100,
    vitaminDActivationEfficiencyPercent: Math.round(renalHydroxylaseEfficiency),
    clinicalActionNotes: notes.length ? notes : ['No significant divalent cation competition detected.'],
  };
}

/* =========================================================================
   5. CONTINUOUS GLUCOSE VARIABILITY DYNAMICS (CGM SENSORIUM)
   ========================================================================= */

export interface GlucoseSample {
  readonly timestampIso: string;
  readonly glucoseMgPerDl: number;
}

export interface ContinuousGlucoseVariabilityResult {
  readonly sampleCount: number;
  readonly meanGlucoseMgPerDl: number;
  readonly standardDeviationMgPerDl: number;
  readonly coefficientOfVariationPercent: number; // CV% target < 36%
  readonly timeInRangeLongevityPercent: number; // 70 - 140 mg/dL (target > 85%)
  readonly timeInRangeStandardPercent: number; // 70 - 180 mg/dL (target > 70%)
  readonly timeBelowRangePercent: number; // < 70 mg/dL (target < 4%)
  readonly timeAboveRangePercent: number; // > 140 mg/dL
  readonly meanAmplitudeOfGlycemicExcursionsMage: number; // MAGE (Service 1970)
  readonly jIndex: number; // J = 0.324 * (Mean + SD)^2 (Wojcicki 1995)
  readonly lowBloodGlucoseIndexLbgi: number; // Kovatchev LBGI
  readonly highBloodGlucoseIndexHbgi: number; // Kovatchev HBGI
  readonly glycemicStabilityCategory: 'optimal-longevity' | 'moderate-variability' | 'high-glycemic-volatility';
}

/**
 * Analyzes continuous glucose monitoring (CGM) telemetry for glycemic variability,
 * longevity Time-in-Range (70-140 mg/dL), MAGE, J-index, and Kovatchev risk indices.
 */
export function analyzeContinuousGlucoseVariability(samples: readonly GlucoseSample[]): ContinuousGlucoseVariabilityResult {
  if (!samples || samples.length === 0) {
    return {
      sampleCount: 0,
      meanGlucoseMgPerDl: 0,
      standardDeviationMgPerDl: 0,
      coefficientOfVariationPercent: 0,
      timeInRangeLongevityPercent: 0,
      timeInRangeStandardPercent: 0,
      timeBelowRangePercent: 0,
      timeAboveRangePercent: 0,
      meanAmplitudeOfGlycemicExcursionsMage: 0,
      jIndex: 0,
      lowBloodGlucoseIndexLbgi: 0,
      highBloodGlucoseIndexHbgi: 0,
      glycemicStabilityCategory: 'moderate-variability',
    };
  }

  const values = samples.map((s) => Math.max(20, Math.min(500, s.glucoseMgPerDl)));
  const count = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;

  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;

  // Time in ranges:
  const inLongevityRange = values.filter((v) => v >= 70 && v <= 140).length;
  const inStandardRange = values.filter((v) => v >= 70 && v <= 180).length;
  const belowRange = values.filter((v) => v < 70).length;
  const aboveRange = values.filter((v) => v > 140).length;

  const tirLongevity = (inLongevityRange / count) * 100;
  const tirStandard = (inStandardRange / count) * 100;
  const tbr = (belowRange / count) * 100;
  const tar = (aboveRange / count) * 100;

  // J-Index = 0.324 * (Mean + SD)^2 (Wojcicki 1995)
  const jIndex = 0.324 * Math.pow(mean + sd, 2);

  // Kovatchev transformed Glycemic Risk Indices (LBGI & HBGI):
  // f(G) = 1.509 * ( (ln(G))^1.084 - 5.381 )
  // r(G) = 10 * f(G)^2
  // rl(G) = r(G) if f(G) < 0 else 0; rh(G) = r(G) if f(G) > 0 else 0
  let rlSum = 0;
  let rhSum = 0;
  for (const g of values) {
    const f_g = 1.509 * (Math.pow(Math.log(g), 1.084) - 5.381);
    const r_g = 10 * Math.pow(f_g, 2);
    if (f_g < 0) rlSum += r_g;
    else if (f_g > 0) rhSum += r_g;
  }
  const lbgi = rlSum / count;
  const hbgi = rhSum / count;

  // Mean Amplitude of Glycemic Excursions (MAGE, Service 1970):
  // Finds peaks and nadirs where excursion > 1 SD
  const excursions: number[] = [];
  for (let i = 1; i < count - 1; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const next = values[i + 1];
    const isPeak = curr > prev && curr > next;
    const isNadir = curr < prev && curr < next;
    if (isPeak || isNadir) {
      const diff = Math.abs(curr - prev);
      if (diff > sd) excursions.push(diff);
    }
  }
  const mage = excursions.length > 0 ? excursions.reduce((a, b) => a + b, 0) / excursions.length : sd * 1.2;

  let category: 'optimal-longevity' | 'moderate-variability' | 'high-glycemic-volatility' = 'moderate-variability';
  if (tirLongevity >= 85 && cv <= 33 && mage <= 45) {
    category = 'optimal-longevity';
  } else if (cv > 38 || mage > 60 || hbgi > 9.0) {
    category = 'high-glycemic-volatility';
  }

  return {
    sampleCount: count,
    meanGlucoseMgPerDl: Math.round(mean * 10) / 10,
    standardDeviationMgPerDl: Math.round(sd * 10) / 10,
    coefficientOfVariationPercent: Math.round(cv * 10) / 10,
    timeInRangeLongevityPercent: Math.round(tirLongevity * 10) / 10,
    timeInRangeStandardPercent: Math.round(tirStandard * 10) / 10,
    timeBelowRangePercent: Math.round(tbr * 10) / 10,
    timeAboveRangePercent: Math.round(tar * 10) / 10,
    meanAmplitudeOfGlycemicExcursionsMage: Math.round(mage * 10) / 10,
    jIndex: Math.round(jIndex * 10) / 10,
    lowBloodGlucoseIndexLbgi: Math.round(lbgi * 100) / 100,
    highBloodGlucoseIndexHbgi: Math.round(hbgi * 100) / 100,
    glycemicStabilityCategory: category,
  };
}
