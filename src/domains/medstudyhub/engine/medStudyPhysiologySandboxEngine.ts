/**
 * MedStudyHub Interactive Multi-Organ Physiology Perturbation Sandbox Engine (EDU-3).
 *
 * Provides deterministic, unit-checked mathematical solvers for interactive
 * medical education laboratories across:
 * 1. Cardiovascular Hemodynamics (SV, EF, CO, MAP, SVR, CPP, LV Stroke Work).
 * 2. Acid-Base & Henderson-Hasselbalch / Winters' Compensation / Figge Albumin-Corrected Anion Gap.
 * 3. Renal Starling Glomerular Filtration (NFP, GFR) & Fractional Excretion of Sodium (FENa).
 *
 * Citations:
 * - Guyton AC, Hall JE. Textbook of Medical Physiology. 14th ed. Elsevier; 2020.
 * - Albert MS, Dell RB, Winters RW. Quantitative displacement of acid-base equilibrium
 *   in metabolic acidosis. Ann Intern Med. 1967;66(2):312-322. PMID: 6016545.
 * - Figge J, Jabor A, Kazda A, Fencl V. Anion gap and hypoalbuminemia.
 *   Crit Care Med. 1998;26(11):1807-1810. PMID: 9824071.
 */

export const PHYSIOLOGY_SANDBOX_DISCLAIMER =
  'Educational physiological perturbation model — not for patient ventilator, fluid, or pressor dosing' as const;

export interface HemodynamicSandboxInput {
  readonly heartRateBpm: number;
  readonly edvMl: number;
  readonly esvMl: number;
  readonly systolicBpMmHg: number;
  readonly diastolicBpMmHg: number;
  readonly cvpMmHg: number;
  readonly lvedpMmHg: number;
}

export interface AcidBaseSandboxInput {
  readonly paco2MmHg: number;
  readonly hco3MmolL: number;
  readonly naMmolL: number;
  readonly clMmolL: number;
  readonly albuminGdL?: number;
}

export interface RenalStarlingSandboxInput {
  readonly pgcMmHg: number; // Glomerular capillary hydrostatic pressure
  readonly pbsMmHg: number; // Bowman's space hydrostatic pressure
  readonly pigcMmHg: number; // Glomerular capillary oncotic pressure
  readonly pibsMmHg?: number; // Bowman's space oncotic pressure (default 0)
  readonly kfMlMinMmHg: number; // Ultrafiltration coefficient Kf
  readonly serumNaMmolL: number;
  readonly serumCrMgDl: number;
  readonly urineNaMmolL: number;
  readonly urineCrMgDl: number;
}

export type SandboxFailureReason =
  | 'invalid-input'
  | 'esv-exceeds-edv'
  | 'diastolic-exceeds-systolic'
  | 'cvp-exceeds-map'
  | 'acid-base-logarithm-domain-error';

export interface HemodynamicSandboxSuccess {
  readonly ok: true;
  readonly strokeVolumeMl: number;
  readonly ejectionFraction: number;
  readonly cardiacOutputLMin: number;
  readonly meanArterialPressureMmHg: number;
  readonly systemicVascularResistanceDynSCm5: number;
  readonly coronaryPerfusionPressureMmHg: number;
  readonly lvStrokeWorkGramMeters: number;
  readonly hemodynamicProfile:
    | 'normodynamic'
    | 'hypodynamic-low-output'
    | 'vasodilatory-hyperdynamic'
    | 'cardiogenic-shock-pattern';
  readonly truthClass: 'derived';
  readonly label: typeof PHYSIOLOGY_SANDBOX_DISCLAIMER;
}

export interface AcidBaseSandboxSuccess {
  readonly ok: true;
  readonly calculatedPh: number;
  readonly rawAnionGapMmolL: number;
  readonly albuminCorrectedAnionGapMmolL: number;
  readonly wintersExpectedPaco2RangeMmHg: readonly [number, number] | null;
  readonly deltaRatio: number | null;
  readonly primaryDisorder:
    | 'normal-acid-base'
    | 'metabolic-acidosis'
    | 'metabolic-alkalosis'
    | 'respiratory-acidosis'
    | 'respiratory-alkalosis';
  readonly truthClass: 'derived';
  readonly label: typeof PHYSIOLOGY_SANDBOX_DISCLAIMER;
}

export interface RenalStarlingSandboxSuccess {
  readonly ok: true;
  readonly netFiltrationPressureMmHg: number;
  readonly estimatedGfrMlMin: number;
  readonly fractionalExcretionNaPercent: number;
  readonly azotemiaPattern: 'prerenal-sodium-avid' | 'intrinsic-tubular-injury' | 'intermediate-indeterminate';
  readonly truthClass: 'derived';
  readonly label: typeof PHYSIOLOGY_SANDBOX_DISCLAIMER;
}

export interface PhysiologySandboxFailure {
  readonly ok: false;
  readonly reason: SandboxFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof PHYSIOLOGY_SANDBOX_DISCLAIMER;
}

const isFin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function simulateCardiovascularHemodynamics(
  input: HemodynamicSandboxInput,
): HemodynamicSandboxSuccess | PhysiologySandboxFailure {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'HemodynamicSandboxInput object is required.',
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  const { heartRateBpm, edvMl, esvMl, systolicBpMmHg, diastolicBpMmHg, cvpMmHg, lvedpMmHg } = input;
  if (![heartRateBpm, edvMl, esvMl, systolicBpMmHg, diastolicBpMmHg, cvpMmHg, lvedpMmHg].every(isFin)) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'All hemodynamic parameters must be finite numbers.',
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  if (heartRateBpm <= 0 || edvMl <= 0 || esvMl < 0 || systolicBpMmHg <= 0 || diastolicBpMmHg <= 0 || cvpMmHg < 0 || lvedpMmHg < 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'HR, EDV, SBP, and DBP must be > 0; ESV, CVP, and LVEDP must be >= 0.',
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  if (esvMl >= edvMl) {
    return Object.freeze({
      ok: false,
      reason: 'esv-exceeds-edv',
      detail: `End-systolic volume (${esvMl} mL) must be strictly less than end-diastolic volume (${edvMl} mL).`,
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  if (diastolicBpMmHg >= systolicBpMmHg) {
    return Object.freeze({
      ok: false,
      reason: 'diastolic-exceeds-systolic',
      detail: `Diastolic BP (${diastolicBpMmHg} mmHg) must be strictly less than systolic BP (${systolicBpMmHg} mmHg).`,
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  const sv = Number((edvMl - esvMl).toFixed(4));
  const ef = Number((sv / edvMl).toFixed(4));
  const co = Number(((heartRateBpm * sv) / 1000).toFixed(4));
  const map = Number((diastolicBpMmHg + (systolicBpMmHg - diastolicBpMmHg) / 3).toFixed(4));

  if (cvpMmHg >= map) {
    return Object.freeze({
      ok: false,
      reason: 'cvp-exceeds-map',
      detail: `Central venous pressure (${cvpMmHg} mmHg) cannot equal or exceed MAP (${map} mmHg).`,
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  const svr = Number(((80 * (map - cvpMmHg)) / co).toFixed(2));
  const cpp = Number((diastolicBpMmHg - lvedpMmHg).toFixed(2));
  const lvStrokeWork = Number((sv * (map - lvedpMmHg) * 0.0136).toFixed(2));

  let profile: HemodynamicSandboxSuccess['hemodynamicProfile'] = 'normodynamic';
  if (co < 4.0 && lvedpMmHg > 18 && svr > 1400) {
    profile = 'cardiogenic-shock-pattern';
  } else if (co < 4.0) {
    profile = 'hypodynamic-low-output';
  } else if (co > 7.0 && svr < 800) {
    profile = 'vasodilatory-hyperdynamic';
  }

  return Object.freeze({
    ok: true,
    strokeVolumeMl: sv,
    ejectionFraction: ef,
    cardiacOutputLMin: co,
    meanArterialPressureMmHg: map,
    systemicVascularResistanceDynSCm5: svr,
    coronaryPerfusionPressureMmHg: cpp,
    lvStrokeWorkGramMeters: lvStrokeWork,
    hemodynamicProfile: profile,
    truthClass: 'derived',
    label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
  });
}

export function simulateAcidBaseEquilibrium(
  input: AcidBaseSandboxInput,
): AcidBaseSandboxSuccess | PhysiologySandboxFailure {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'AcidBaseSandboxInput object is required.',
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  const { paco2MmHg, hco3MmolL, naMmolL, clMmolL } = input;
  const albumin = input.albuminGdL ?? 4.0;
  if (![paco2MmHg, hco3MmolL, naMmolL, clMmolL, albumin].every(isFin)) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'PaCO2, HCO3-, Na+, Cl-, and albumin must be finite numbers.',
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  if (paco2MmHg <= 0 || hco3MmolL <= 0 || naMmolL <= 0 || clMmolL <= 0 || albumin <= 0) {
    return Object.freeze({
      ok: false,
      reason: 'acid-base-logarithm-domain-error',
      detail: 'PaCO2, HCO3-, electrolytes, and albumin must be strictly positive (> 0).',
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  const calculatedPh = Number((6.1 + Math.log10(hco3MmolL / (0.03 * paco2MmHg))).toFixed(4));
  const rawAg = Number((naMmolL - (clMmolL + hco3MmolL)).toFixed(2));
  const correctedAg = Number((rawAg + 2.5 * (4.0 - albumin)).toFixed(2));

  let primaryDisorder: AcidBaseSandboxSuccess['primaryDisorder'] = 'normal-acid-base';
  let wintersRange: readonly [number, number] | null = null;
  let deltaRatio: number | null = null;

  if (calculatedPh < 7.35) {
    if (hco3MmolL < 22) {
      primaryDisorder = 'metabolic-acidosis';
      const center = 1.5 * hco3MmolL + 8;
      wintersRange = Object.freeze([Number((center - 2).toFixed(2)), Number((center + 2).toFixed(2))]);
      if (24 - hco3MmolL > 0) {
        deltaRatio = Number(((correctedAg - 12) / (24 - hco3MmolL)).toFixed(4));
      }
    } else {
      primaryDisorder = 'respiratory-acidosis';
    }
  } else if (calculatedPh > 7.45) {
    if (hco3MmolL > 26) {
      primaryDisorder = 'metabolic-alkalosis';
    } else {
      primaryDisorder = 'respiratory-alkalosis';
    }
  }

  return Object.freeze({
    ok: true,
    calculatedPh,
    rawAnionGapMmolL: rawAg,
    albuminCorrectedAnionGapMmolL: correctedAg,
    wintersExpectedPaco2RangeMmHg: wintersRange,
    deltaRatio,
    primaryDisorder,
    truthClass: 'derived',
    label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
  });
}

export function simulateRenalStarlingFiltration(
  input: RenalStarlingSandboxInput,
): RenalStarlingSandboxSuccess | PhysiologySandboxFailure {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'RenalStarlingSandboxInput object is required.',
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  const pibs = input.pibsMmHg ?? 0;
  const vals = [
    input.pgcMmHg,
    input.pbsMmHg,
    input.pigcMmHg,
    pibs,
    input.kfMlMinMmHg,
    input.serumNaMmolL,
    input.serumCrMgDl,
    input.urineNaMmolL,
    input.urineCrMgDl,
  ];
  if (!vals.every(isFin) || input.kfMlMinMmHg <= 0 || input.serumNaMmolL <= 0 || input.serumCrMgDl <= 0 || input.urineNaMmolL < 0 || input.urineCrMgDl <= 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'All Starling pressures, Kf, and serum/urine electrolytes must be finite valid numbers.',
      truthClass: 'derived',
      label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
    });
  }

  const nfp = Number(((input.pgcMmHg - input.pbsMmHg) - (input.pigcMmHg - pibs)).toFixed(4));
  const gfr = Number(Math.max(0, input.kfMlMinMmHg * nfp).toFixed(2));
  const fena = Number(
    (((input.urineNaMmolL * input.serumCrMgDl) / (input.serumNaMmolL * input.urineCrMgDl)) * 100).toFixed(4),
  );

  const azotemiaPattern =
    fena < 1.0
      ? 'prerenal-sodium-avid'
      : fena > 2.0
        ? 'intrinsic-tubular-injury'
        : 'intermediate-indeterminate';

  return Object.freeze({
    ok: true,
    netFiltrationPressureMmHg: nfp,
    estimatedGfrMlMin: gfr,
    fractionalExcretionNaPercent: fena,
    azotemiaPattern,
    truthClass: 'derived',
    label: PHYSIOLOGY_SANDBOX_DISCLAIMER,
  });
}
