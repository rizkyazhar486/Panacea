/**
 * V/Q Mismatch & Alveolar-Arterial Oxygenation Lab Engine (BX-4).
 *
 * Implements the alveolar gas equation, Alveolar-arterial (A-a) PO2 gradient,
 * age-adjusted reference limits, and regional West Lung Zone ventilation-perfusion
 * (VA/Q) ratio classification.
 *
 * Citations:
 * - Riley RL, Cournand A. 'Ideal' alveolar air and the analysis of ventilation-perfusion
 *   relationships in the lungs. J Appl Physiol. 1949;1(12):825-847. PMID: 18145478.
 */

export type VqPhysiologicalRegime =
  | 'true-shunt'
  | 'low-vq-venous-admixture'
  | 'physiologic-matched'
  | 'high-vq-dead-space'
  | 'alveolar-dead-space-zone1';

export const VQ_LAB_DISCLAIMER =
  'Derived physiological gas-exchange model — not a ventilator controller or diagnostic conclusion' as const;

export const VQ_EQUATION_SOURCE = Object.freeze({
  citation:
    'Riley RL, Cournand A. Ideal alveolar air and the analysis of ventilation-perfusion relationships in the lungs. J Appl Physiol. 1949;1(12):825-847.',
  pmid: '18145478',
  verifiedFrom: 'abstract' as const,
  formVerified: true as const,
});

export interface AlveolarGasInput {
  readonly fio2: number;
  readonly patmMmHg?: number;
  readonly ph2oMmHg?: number;
  readonly paco2MmHg: number;
  readonly pao2MmHg: number;
  readonly respiratoryQuotient?: number;
  readonly ageYears?: number;
  readonly alveolarVentilationLMin?: number;
  readonly pulmonaryPerfusionLMin?: number;
}

export type VqFailureReason =
  | 'invalid-input'
  | 'impossible-gas-tension'
  | 'negative-alveolar-po2';

export interface VqMismatchSuccess {
  readonly ok: true;
  readonly pao2AlveolarMmHg: number;
  readonly aaGradientMmHg: number;
  readonly ageExpectedUpperLimitMmHg: number | null;
  readonly isElevatedForAge: boolean | null;
  readonly vqRatio: number | null;
  readonly regime: VqPhysiologicalRegime;
  readonly formula: string;
  readonly truthClass: 'derived';
  readonly label: typeof VQ_LAB_DISCLAIMER;
  readonly source: typeof VQ_EQUATION_SOURCE;
}

export interface VqMismatchFailure {
  readonly ok: false;
  readonly reason: VqFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof VQ_LAB_DISCLAIMER;
}

export type VqMismatchResult = VqMismatchSuccess | VqMismatchFailure;

const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function evaluateVqAndAlveolarGradient(input: AlveolarGasInput): VqMismatchResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'AlveolarGasInput object is required.',
      truthClass: 'derived',
      label: VQ_LAB_DISCLAIMER,
    });
  }

  const fio2 = input.fio2;
  const patm = input.patmMmHg ?? 760;
  const ph2o = input.ph2oMmHg ?? 47;
  const paco2 = input.paco2MmHg;
  const pao2 = input.pao2MmHg;
  const rq = input.respiratoryQuotient ?? 0.8;

  if (
    !isFiniteNum(fio2) ||
    !isFiniteNum(patm) ||
    !isFiniteNum(ph2o) ||
    !isFiniteNum(paco2) ||
    !isFiniteNum(pao2) ||
    !isFiniteNum(rq)
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'All gas tensions, FiO2, and respiratory quotient must be finite numbers.',
      truthClass: 'derived',
      label: VQ_LAB_DISCLAIMER,
    });
  }

  if (fio2 < 0.21 || fio2 > 1.0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: `FiO2 (${fio2}) must be within [0.21, 1.0].`,
      truthClass: 'derived',
      label: VQ_LAB_DISCLAIMER,
    });
  }

  if (patm <= ph2o || ph2o < 0 || paco2 <= 0 || pao2 <= 0 || rq < 0.4 || rq > 1.5) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Patm must exceed PH2O, PaCO2 and PaO2 must be > 0, and RQ must be within [0.4, 1.5].',
      truthClass: 'derived',
      label: VQ_LAB_DISCLAIMER,
    });
  }

  const pao2Alveolar = Number((fio2 * (patm - ph2o) - paco2 / rq).toFixed(4));
  if (pao2Alveolar <= 0) {
    return Object.freeze({
      ok: false,
      reason: 'negative-alveolar-po2',
      detail: `Calculated alveolar PAO2 (${pao2Alveolar} mmHg) is non-positive.`,
      truthClass: 'derived',
      label: VQ_LAB_DISCLAIMER,
    });
  }

  if (pao2 > pao2Alveolar) {
    return Object.freeze({
      ok: false,
      reason: 'impossible-gas-tension',
      detail: `Arterial PaO2 (${pao2} mmHg) cannot exceed alveolar PAO2 (${pao2Alveolar} mmHg).`,
      truthClass: 'derived',
      label: VQ_LAB_DISCLAIMER,
    });
  }

  const aaGradient = Number((pao2Alveolar - pao2).toFixed(4));

  let ageExpectedUpperLimitMmHg: number | null = null;
  let isElevatedForAge: boolean | null = null;
  if (input.ageYears !== undefined) {
    if (!isFiniteNum(input.ageYears) || input.ageYears < 0 || input.ageYears > 130) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: `ageYears (${String(input.ageYears)}) must be within [0, 130].`,
        truthClass: 'derived',
        label: VQ_LAB_DISCLAIMER,
      });
    }
    ageExpectedUpperLimitMmHg = Number((input.ageYears / 4 + 4).toFixed(4));
    isElevatedForAge = aaGradient > ageExpectedUpperLimitMmHg;
  }

  let vqRatio: number | null = null;
  let regime: VqPhysiologicalRegime = aaGradient > 20 ? 'low-vq-venous-admixture' : 'physiologic-matched';

  if (input.alveolarVentilationLMin !== undefined || input.pulmonaryPerfusionLMin !== undefined) {
    const va = input.alveolarVentilationLMin;
    const q = input.pulmonaryPerfusionLMin;
    if (!isFiniteNum(va) || !isFiniteNum(q) || va < 0 || q < 0 || (va === 0 && q === 0)) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: 'alveolarVentilationLMin and pulmonaryPerfusionLMin must be finite non-negative numbers.',
        truthClass: 'derived',
        label: VQ_LAB_DISCLAIMER,
      });
    }

    if (va === 0 && q > 0) {
      vqRatio = 0;
      regime = 'true-shunt';
    } else if (q === 0 && va > 0) {
      vqRatio = null;
      regime = 'alveolar-dead-space-zone1';
    } else {
      vqRatio = Number((va / q).toFixed(4));
      if (vqRatio < 0.6) regime = 'low-vq-venous-admixture';
      else if (vqRatio <= 1.5) regime = 'physiologic-matched';
      else regime = 'high-vq-dead-space';
    }
  }

  return Object.freeze({
    ok: true,
    pao2AlveolarMmHg: pao2Alveolar,
    aaGradientMmHg: aaGradient,
    ageExpectedUpperLimitMmHg,
    isElevatedForAge,
    vqRatio,
    regime,
    formula: 'PAO2 = FiO2 * (Patm - PH2O) - (PaCO2 / R); A-a = PAO2 - PaO2',
    truthClass: 'derived',
    label: VQ_LAB_DISCLAIMER,
    source: VQ_EQUATION_SOURCE,
  });
}
