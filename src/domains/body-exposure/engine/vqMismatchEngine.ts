/**
 * BX-4 V/Q Mismatch Lab Engine
 * Menghitung gradien A-a dan mengevaluasi status shunt / dead space / normal.
 * Sesuai Directive D-101: Input outside physiological range -> rejected, output labeled derived/simulated.
 */
export interface VQResult {
  status: 'normal' | 'shunt' | 'dead-space' | 'rejected';
  aAGradient: number;
  truthClass: 'derived' | 'simulated';
}

export function evaluateVQmismatch(paO2: number, paCO2: number, fio2: number): VQResult {
  // Validasi rentang fisiologis
  if (paO2 < 0 || paO2 > 700 || paCO2 < 0 || paCO2 > 120 || fio2 < 0.21 || fio2 > 1.0) {
    return {
      status: 'rejected',
      aAGradient: NaN,
      truthClass: 'derived'
    };
  }

  // Estimasi tekanan alveolar oksigen (PAO2) dengan konstanta sea-level standar (713 * FiO2 - PaCO2 / 0.8)
  const paO2Ideal = (713 * fio2) - (paCO2 / 0.8);
  const aAGradient = Number((paO2Ideal - paO2).toFixed(1));

  let status: 'normal' | 'shunt' | 'dead-space' = 'normal';
  if (aAGradient > 20) {
    status = 'shunt'; // Peningkatan gradien A-a khas gangguan difusi / shunt
  }

  return {
    status,
    aAGradient,
    truthClass: 'derived'
  };
}
