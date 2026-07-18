// Shared, validated clinical risk models — a single source of truth reused by
// the Risk Calculators page and the What-If Health Simulator so both compute
// identical numbers. Each function implements a published equation with the
// citation noted inline.

// ── Framingham General CVD 10-year risk (D'Agostino et al., Circulation 2008)
// Sex-specific Cox model with published β coefficients, baseline survival, and
// mean. Returns 10-year risk as a percentage (0-100), or null if inputs invalid.
export function framinghamCVD(p: {
  age: number; sex: 'M' | 'F'; totChol: number; hdl: number; sbp: number
  treatedBP: boolean; smoker: boolean; diabetic: boolean
}): number | null {
  const { age, sex, totChol, hdl, sbp } = p
  if (!(age > 0 && totChol > 0 && hdl > 0 && sbp > 0)) return null
  const ln = Math.log
  let L: number, s0: number, mean: number
  if (sex === 'M') {
    L = 3.06117 * ln(age) + 1.12370 * ln(totChol) - 0.93263 * ln(hdl) +
      (p.treatedBP ? 1.99881 : 1.93303) * ln(sbp) +
      0.65451 * (p.smoker ? 1 : 0) + 0.57367 * (p.diabetic ? 1 : 0)
    s0 = 0.88936; mean = 23.9802
  } else {
    L = 2.32888 * ln(age) + 1.20904 * ln(totChol) - 0.70833 * ln(hdl) +
      (p.treatedBP ? 2.82263 : 2.76157) * ln(sbp) +
      0.52873 * (p.smoker ? 1 : 0) + 0.69154 * (p.diabetic ? 1 : 0)
    s0 = 0.95012; mean = 26.1931
  }
  const risk = 1 - Math.pow(s0, Math.exp(L - mean))
  return Math.max(0, Math.min(100, +(risk * 100).toFixed(1)))
}

export function cvdBand(pct: number): { label: string; tone: 'brand' | 'low' | 'critical' } {
  if (pct < 7.5) return { label: 'Low risk', tone: 'brand' }
  if (pct < 20) return { label: 'Intermediate risk', tone: 'low' }
  return { label: 'High risk', tone: 'critical' }
}
