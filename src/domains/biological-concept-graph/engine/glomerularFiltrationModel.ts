// Pure, deterministic glomerular Starling filtration calculation.
// Model: Net Ultrafiltration Pressure (NUP) = (P_gc - P_bs) - (π_gc - π_bs)
//        Glomerular Filtration Rate (GFR) = Kf × NUP
// Source: Hall JE, Guyton and Hall Textbook of Medical Physiology 14e, ch. 26.
// Educational engine; not for diagnostic clinical dosing or patient staging.

export interface GlomerularStarlingInputs {
  /** Glomerular capillary hydrostatic pressure in mmHg. Typical ~60 mmHg. Range: 10..150. */
  P_gc_mmHg: number
  /** Bowman's space hydrostatic pressure in mmHg. Typical ~18 mmHg. Range: 0..80. */
  P_bs_mmHg: number
  /** Glomerular capillary colloid oncotic pressure in mmHg. Typical ~32 mmHg. Range: 5..80. */
  pi_gc_mmHg: number
  /** Bowman's space colloid oncotic pressure in mmHg. Normal ~0 mmHg (protein-free). Range: 0..40. */
  pi_bs_mmHg: number
  /** Glomerular capillary ultrafiltration coefficient in mL/min/mmHg. Normal ~12.5. Range: 0.1..50. */
  Kf_mL_min_mmHg: number
}

export interface GlomerularStarlingResult {
  /** Net ultrafiltration pressure in mmHg: (P_gc - P_bs) - (pi_gc - pi_bs). */
  netUltrafiltrationPressure_mmHg: number
  /** Calculated GFR in mL/min: Kf × NUP. */
  gfr_mL_per_min: number
  /** Daily filtered volume in L/day: GFR × 1440 / 1000. */
  dailyFilteredVolume_L_day: number
  /** Whether the filtration barrier has intact oncotic reflection (pi_bs < 1 mmHg). */
  barrierIntact: boolean
}

export function computeGlomerularFiltration(
  input: GlomerularStarlingInputs
): GlomerularStarlingResult {
  const { P_gc_mmHg, P_bs_mmHg, pi_gc_mmHg, pi_bs_mmHg, Kf_mL_min_mmHg } = input

  for (const [k, v] of Object.entries(input)) {
    if (!Number.isFinite(v)) {
      throw new TypeError(`GlomerularStarling input '${k}' must be a finite number; got ${v}`)
    }
  }

  if (P_gc_mmHg < 10 || P_gc_mmHg > 150) {
    throw new RangeError(`P_gc_mmHg must be in range 10..150; got ${P_gc_mmHg}`)
  }
  if (P_bs_mmHg < 0 || P_bs_mmHg > 80) {
    throw new RangeError(`P_bs_mmHg must be in range 0..80; got ${P_bs_mmHg}`)
  }
  if (pi_gc_mmHg < 5 || pi_gc_mmHg > 80) {
    throw new RangeError(`pi_gc_mmHg must be in range 5..80; got ${pi_gc_mmHg}`)
  }
  if (pi_bs_mmHg < 0 || pi_bs_mmHg > 40) {
    throw new RangeError(`pi_bs_mmHg must be in range 0..40; got ${pi_bs_mmHg}`)
  }
  if (Kf_mL_min_mmHg <= 0 || Kf_mL_min_mmHg > 50) {
    throw new RangeError(`Kf_mL_min_mmHg must be in range (0..50]; got ${Kf_mL_min_mmHg}`)
  }

  const hydrostaticGradient = P_gc_mmHg - P_bs_mmHg
  const oncoticGradient = pi_gc_mmHg - pi_bs_mmHg
  const nup = hydrostaticGradient - oncoticGradient
  const gfr = Math.max(0, Kf_mL_min_mmHg * nup)
  const dailyL = (gfr * 1440) / 1000

  return {
    netUltrafiltrationPressure_mmHg: Math.round(nup * 100) / 100,
    gfr_mL_per_min: Math.round(gfr * 10) / 10,
    dailyFilteredVolume_L_day: Math.round(dailyL * 10) / 10,
    barrierIntact: pi_bs_mmHg < 1.0,
  }
}
