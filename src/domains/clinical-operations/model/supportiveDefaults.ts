// Supportive-care draft lines for an EMR note: fluid maintenance (Holliday–Segar), calories (25–30 kcal/kg/day) and the
// KDIGO 2012 urine-output threshold (0.5 mL/kg/h). Draft text for a clinician to review, never an order. Pure.

export function supportiveDefaults(weightKg: number) {
  // No recorded weight → no weight-based figure. A guessed 60 kg used to produce maintenance fluid, calorie and urine
  // output targets that read as this patient's own; the clinician now sees that weight is missing instead.
  if (!(Number.isFinite(weightKg) && weightKg > 0)) {
    const missing = 'Weight not recorded — enter the patient\u2019s weight to compute this.'
    return {
      resusitasi: 'Assess ABC; crystalloids (RL/NaCl 0.9%) per status; target MAP ≥65 mmHg.',
      balansCairan: missing,
      kebutuhanKalori: missing,
      urineOutput: missing,
    }
  }
  const w = weightKg
  const maint = w > 20 ? 1500 + 20 * (w - 20) : w > 10 ? 1000 + 50 * (w - 10) : 100 * w
  return {
    resusitasi: 'Assess ABC; crystalloids (RL/NaCl 0.9%) per status; target MAP ≥65 mmHg.',
    balansCairan: `Maintenance ±${Math.round(maint)} mL/24 h (${Math.round(maint / 24)} mL/h, Holliday-Segar); adjust for deficit/loss.`,
    kebutuhanKalori: `${Math.round(w * 25)}–${Math.round(w * 30)} kcal/day (25–30 kcal/kg).`,
    // Ambang 0,5 mL/kg/jam mengikuti kriteria KDIGO 2012 untuk cedera ginjal akut.
    urineOutput: `> ${(0.5 * w).toFixed(1)} mL/h (0.5 mL/kg/h, KDIGO 2012).`,
  }
}
