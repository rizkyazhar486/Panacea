// Educational haemodynamic model bound to a concept id. Equation: CO (L/min) = HR (beats/min) × SV (mL/beat) / 1000; CI = CO / BSA.
// Source: standard physiology (e.g. OpenStax A&P 2e, ch. 19 "Cardiac physiology"). Educational, not diagnostic; NOT clinically reviewed.
// Inputs outside the educational domain are rejected, never clamped. A single value never implies disease.
export const CARDIAC_OUTPUT_MODEL = Object.freeze({
  id: 'physio:cardiac-output', version: '1.0.0', conceptId: 'pcg:left_ventricle', referenceId: 'ref:openstax-ap2e', clinicallyReviewed: false,
  domain: { hrBpm: { min: 20, max: 300 }, svMl: { min: 5, max: 250 }, bsaM2: { min: 0.2, max: 3.5 } },
  units: { hr: 'beats/min', sv: 'mL/beat', co: 'L/min', ci: 'L/min/m²' },
  boundary: 'Illustrative educational calculation. Does not diagnose; no reference range is applied because none is validated here.',
})

export type CardiacOutputResult =
  | { ok: true; coLMin: number; ciLMinM2: number | null; explanation: string; modelId: string; clinicallyReviewed: false }
  | { ok: false; reason: 'non_finite' | 'hr_out_of_domain' | 'sv_out_of_domain' | 'bsa_out_of_domain'; field: 'hrBpm' | 'svMl' | 'bsaM2' }

export function computeCardiacOutput(input: { hrBpm: number; svMl: number; bsaM2?: number }): CardiacOutputResult {
  const d = CARDIAC_OUTPUT_MODEL.domain
  const { hrBpm, svMl, bsaM2 } = input
  if (!Number.isFinite(hrBpm)) return { ok: false, reason: 'non_finite', field: 'hrBpm' }
  if (!Number.isFinite(svMl)) return { ok: false, reason: 'non_finite', field: 'svMl' }
  if (hrBpm < d.hrBpm.min || hrBpm > d.hrBpm.max) return { ok: false, reason: 'hr_out_of_domain', field: 'hrBpm' }
  if (svMl < d.svMl.min || svMl > d.svMl.max) return { ok: false, reason: 'sv_out_of_domain', field: 'svMl' }
  if (bsaM2 !== undefined) {
    if (!Number.isFinite(bsaM2)) return { ok: false, reason: 'non_finite', field: 'bsaM2' }
    if (bsaM2 < d.bsaM2.min || bsaM2 > d.bsaM2.max) return { ok: false, reason: 'bsa_out_of_domain', field: 'bsaM2' }
  }
  const co = (hrBpm * svMl) / 1000
  return {
    ok: true, coLMin: co, ciLMinM2: bsaM2 === undefined ? null : co / bsaM2, modelId: CARDIAC_OUTPUT_MODEL.id, clinicallyReviewed: false,
    explanation: `CO = HR × SV / 1000 = ${hrBpm} × ${svMl} / 1000 = ${co} L/min. Cardiac index is unknown (not zero) unless body surface area is supplied.`,
  }
}
