export type RenalTeachingInputs = { filtrationDrive: number; tubularReabsorption: number; flowSensing: number; concentratingDrive: number }
export type RenalTeachingState = { filteredLoad: number; excretoryFraction: number; transportAdaptation: number; waterConservation: number }
const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))

/** Synthetic, dimensionless educational relationships only; not GFR, clearance, urine output, osmolality, clinical equations, or treatment targets. */
export function deriveRenalTeachingState(input: RenalTeachingInputs): RenalTeachingState {
  const filtrationDrive = clamp01(input.filtrationDrive)
  const tubularReabsorption = clamp01(input.tubularReabsorption)
  const flowSensing = clamp01(input.flowSensing)
  const concentratingDrive = clamp01(input.concentratingDrive)
  const filteredLoad = filtrationDrive
  const transportAdaptation = clamp01(0.6 * tubularReabsorption + 0.4 * flowSensing)
  const excretoryFraction = clamp01(filteredLoad * (1 - 0.7 * transportAdaptation))
  const waterConservation = clamp01(0.65 * concentratingDrive + 0.35 * tubularReabsorption)
  return { filteredLoad, excretoryFraction, transportAdaptation, waterConservation }
}

export const RENAL_EDUCATION_MODEL = {
  systemId: 'urinary',
  title: 'Renal filtration, tubular transport & water balance',
  relationships: [
    'Glomerular filtration delivers water and solutes into the nephron for subsequent tubular handling.',
    'Tubular reabsorption and secretion shape final urinary excretion rather than filtration alone determining output.',
    'Tubular-flow sensing participates in adjustment of electrolyte transport, while nephron segments coordinate water and electrolyte homeostasis.',
  ],
  evidence: [
    { pmid: '32127698', role: 'Review of tubular-flow sensing, renal electrolyte transport, reabsorption, and water-electrolyte homeostasis.', source: 'PubMed' },
    { pmid: '19864948', role: 'Review of renal homeostasis, tubuloglomerular feedback, autoregulation, and flow-dependent tubular reabsorption.', source: 'PubMed' },
  ],
  provenance: { state: 'reference-and-simulated', modelVersion: '1.0.0', evidenceCheckedOn: '2026-09-19' },
  boundary: 'Educational reference relationships plus synthetic dimensionless signals; not patient-specific anatomy, GFR/clearance measurement, diagnosis, prognosis, imaging interpretation, fluid prescription, drug dosing, or treatment guidance.',
} as const
