export type LymphaticTeachingInputs = { filtrationLoad: number; collectingPump: number; skeletalMotion: number; nodalTransit: number }
export type LymphaticTeachingState = { returnCapacity: number; interstitialBurden: number; immuneTransit: number }
const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))

/** Synthetic, dimensionless educational relationships only; not measurements, clinical equations, diagnostic probabilities, or treatment targets. */
export function deriveLymphaticTeachingState(input: LymphaticTeachingInputs): LymphaticTeachingState {
  const filtrationLoad = clamp01(input.filtrationLoad)
  const collectingPump = clamp01(input.collectingPump)
  const skeletalMotion = clamp01(input.skeletalMotion)
  const nodalTransit = clamp01(input.nodalTransit)
  const returnCapacity = clamp01(0.7 * collectingPump + 0.3 * skeletalMotion)
  const interstitialBurden = clamp01(0.5 + 0.5 * filtrationLoad - 0.5 * returnCapacity)
  const immuneTransit = clamp01(0.65 * nodalTransit + 0.35 * returnCapacity)
  return { returnCapacity, interstitialBurden, immuneTransit }
}

export const LYMPHATIC_EDUCATION_MODEL = {
  systemId: 'lymphatic',
  title: 'Lymphatic fluid return & immune trafficking',
  relationships: [
    'Interstitial fluid and macromolecular return depends on functioning lymphatic transport.',
    'Collecting-vessel propulsion and external movement can contribute to lymph transport.',
    'Lymphatic vessels participate in immune-cell trafficking through tissue and lymph-node pathways.',
  ],
  evidence: [
    { pmid: '9419570', role: 'Background review describing lymph transport, tissue-fluid/macromolecule return, propulsion, and impaired immune-cell trafficking in lymphatic failure.', source: 'PubMed' },
    { pmid: '24503053', role: 'Review describing lymphatic fluid drainage and immune-cell trafficking in a tissue-specific context.', source: 'PubMed' },
  ],
  provenance: { state: 'reference-and-simulated', modelVersion: '1.0.0', evidenceCheckedOn: '2026-09-18' },
  boundary: 'Educational reference relationships plus synthetic dimensionless signals; not patient-specific anatomy, measurement, diagnosis, prognosis, imaging interpretation, or treatment guidance.',
} as const
