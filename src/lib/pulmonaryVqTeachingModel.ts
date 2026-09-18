export type PulmonaryVqTeachingInputs = {
  regionalVentilation: number
  regionalPerfusion: number
  alveolarOxygenation: number
  vascularResponsiveness: number
}

export type PulmonaryVqTeachingState = {
  matching: number
  mismatch: number
  hypoxicVasoconstriction: number
  perfusionDiversion: number
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))

/** Synthetic, dimensionless educational relationships only; not V/Q ratio, PaO2, shunt fraction, PVR, PAP, or a clinical equation. */
export function derivePulmonaryVqTeachingState(input: PulmonaryVqTeachingInputs): PulmonaryVqTeachingState {
  const ventilation = clamp01(input.regionalVentilation)
  const perfusion = clamp01(input.regionalPerfusion)
  const oxygenation = clamp01(input.alveolarOxygenation)
  const responsiveness = clamp01(input.vascularResponsiveness)
  const mismatch = clamp01(Math.abs(ventilation - perfusion))
  const matching = clamp01(1 - mismatch)
  const hypoxicVasoconstriction = clamp01((1 - oxygenation) * responsiveness)
  const perfusionDiversion = clamp01(hypoxicVasoconstriction * mismatch)
  return { matching, mismatch, hypoxicVasoconstriction, perfusionDiversion }
}

export const PULMONARY_VQ_EDUCATION_MODEL = {
  systemId: 'respiratory',
  title: 'Regional ventilation, perfusion & hypoxic pulmonary vasoconstriction',
  relationships: [
    'Regional gas exchange depends on the relationship between alveolar ventilation and pulmonary perfusion rather than either flow alone.',
    'Alveolar hypoxia can constrict nearby pulmonary vessels and divert blood toward better-oxygenated lung regions, supporting ventilation-perfusion matching.',
    'When hypoxia is widespread rather than regional, hypoxic pulmonary vasoconstriction can increase pulmonary vascular resistance and pulmonary arterial pressure instead of simply improving regional matching.',
  ],
  evidence: [
    { pmid: '27645688', role: 'Review linking alveolar hypoxia, pulmonary vasoconstriction, perfusion diversion, ventilation-perfusion matching, and global-hypoxia pulmonary vascular effects.', source: 'PubMed' },
    { pmid: '37816344', role: 'Review of pulmonary vascular physiology, local hypoxic regulation, perfusion redistribution, and ventilation-perfusion matching.', source: 'PubMed' },
  ],
  provenance: { state: 'reference-and-simulated', modelVersion: '1.0.0', evidenceCheckedOn: '2026-09-19' },
  boundary: 'Educational reference relationships plus synthetic dimensionless signals; not patient-specific anatomy, V/Q measurement, blood-gas interpretation, diagnosis, prognosis, imaging interpretation, ventilator setting, oxygen prescription, drug selection, or treatment guidance.',
} as const
