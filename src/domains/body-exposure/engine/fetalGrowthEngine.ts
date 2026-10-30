/**
 * BX-5 Fetal Growth Trajectory Engine
 * Memetakan biometri janin terukur terhadap kurva referensi sentil.
 * Sesuai Directive D-101: Measured series from canonical record only, missing week = gap, out of range flagged.
 */
export interface FetalBiometryPoint {
  gestationalWeek: number;
  measuredValue: number | 'not available';
  status: 'normal' | 'out-of-range' | 'missing';
  truthClass: 'measured' | 'reference';
}

export function evaluateFetalTrajectory(canonicalSeries: { week: number; value: number }[], minAllowed: number, maxAllowed: number): FetalBiometryPoint[] {
  if (!Array.isArray(canonicalSeries)) return [];

  return canonicalSeries.map(item => {
    if (item.value === undefined || item.value === null || isNaN(item.value)) {
      return {
        gestationalWeek: item.week,
        measuredValue: 'not available',
        status: 'missing',
        truthClass: 'measured'
      };
    }

    const outOfRange = item.value < minAllowed || item.value > maxAllowed;
    return {
      gestationalWeek: item.week,
      measuredValue: item.value,
      status: outOfRange ? 'out-of-range' : 'normal',
      truthClass: 'measured'
    };
  });
}
