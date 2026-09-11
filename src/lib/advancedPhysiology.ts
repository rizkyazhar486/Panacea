export type AdvancedPhysiologySystemKey = 'endocrine' | 'hepatic-metabolic' | 'hematology-immune' | 'autonomic' | 'reproductive'
export type AdvancedPhysiologyStateKey = 'rest' | 'exercise' | 'recovery' | 'sleep'
export type AdvancedPhysiologyProvenance = 'measured' | 'derived' | 'educational' | 'unavailable'
export type AdvancedLayerKey = 'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'

export interface AdvancedPhysiologySystem {
  key: AdvancedPhysiologySystemKey
  label: string
  subtitle: string
  layers: AdvancedLayerKey[]
  focusKeywords: string[]
  phases: string[]
  explanation: string
  formulae: Array<{ name: string; formula: string; meaning: string }>
  requiredMeasurements: string[]
}

export interface SystemicCouplingRow {
  label: string
  rest: string
  exercise: string
  recovery: string
  sleep: string
}

export const ADVANCED_PHYSIOLOGY_SYSTEMS: AdvancedPhysiologySystem[] = [
  {
    key: 'endocrine',
    label: 'Endocrine',
    subtitle: 'Sensor → hypothalamus/pituitary → gland → target → feedback',
    layers: ['nervous', 'visceral', 'cardiovascular'],
    focusKeywords: ['hypothalam', 'pituitary', 'thyroid', 'parathyroid', 'adrenal', 'pancreas'],
    phases: ['Physiological sensing', 'Hypothalamic / pituitary integration', 'Hormone secretion', 'Target-organ response', 'Negative / positive feedback'],
    explanation: 'The endocrine view shows control architecture and target anatomy. It does not infer cortisol, thyroid hormone, insulin, growth hormone or sex-steroid concentrations from wearable data.',
    formulae: [
      { name: 'HOMA-IR (educational)', formula: 'fasting glucose (mg/dL) × fasting insulin (µU/mL) / 405', meaning: 'Requires fasting laboratory glucose and insulin. Panacea does not calculate a value when those measurements are absent.' },
      { name: 'Feedback control', formula: 'output(t) = controller(error) → effector → feedback', meaning: 'Conceptual control-loop representation, not a patient-specific endocrine dynamic model.' },
    ],
    requiredMeasurements: ['fasting glucose', 'fasting insulin', 'TSH / free T4 when relevant', 'cortisol when clinically indicated'],
  },
  {
    key: 'hepatic-metabolic',
    label: 'Hepatic & metabolic',
    subtitle: 'Portal inflow → substrate handling → synthesis → bile / export',
    layers: ['visceral', 'cardiovascular'],
    focusKeywords: ['liver', 'hepatic', 'portal', 'gallbladder', 'pancreas', 'intestin'],
    phases: ['Portal substrate delivery', 'Glucose / glycogen handling', 'Lipid and amino-acid metabolism', 'Protein / lipoprotein synthesis', 'Bile formation and export'],
    explanation: 'Metabolic fluxes are represented as pathways. Glycogen content, hepatic glucose output, beta-oxidation and bile flow are not assigned patient numbers without tracer, laboratory or validated metabolic data.',
    formulae: [
      { name: 'Energy balance', formula: 'ΔE = energy intake − energy expenditure', meaning: 'A bookkeeping relation; body-composition change is not predicted from a single day of energy data.' },
      { name: 'Respiratory exchange ratio', formula: 'RER = V̇CO₂ / V̇O₂', meaning: 'Requires measured respiratory gas exchange; it is not inferred from heart rate.' },
    ],
    requiredMeasurements: ['indirect calorimetry for RER', 'glucose / lactate as relevant', 'liver tests for clinical interpretation'],
  },
  {
    key: 'hematology-immune',
    label: 'Hematology & immune',
    subtitle: 'Hematopoiesis → circulation → hemostasis → immune response → lymph return',
    layers: ['cardiovascular', 'lymphoid', 'skeletal', 'visceral'],
    focusKeywords: ['bone marrow', 'spleen', 'lymph', 'thymus', 'blood', 'vein', 'artery'],
    phases: ['Hematopoietic production', 'Blood-cell circulation', 'Hemostasis / coagulation', 'Innate immune recognition', 'Adaptive response and lymphatic return'],
    explanation: 'Blood cells and immune trafficking are process maps. CBC, coagulation, inflammatory markers and immune-cell counts remain unavailable unless real laboratory data are connected.',
    formulae: [
      { name: 'Arterial O₂ content', formula: 'CaO₂ ≈ 1.34 × Hb × SaO₂ + 0.003 × PaO₂', meaning: 'Requires hemoglobin, arterial oxygen saturation and PaO₂; pulse-oximeter SpO₂ alone is insufficient for full oxygen-content calculation.' },
      { name: 'Absolute neutrophil count', formula: 'ANC = WBC × (neutrophils + bands fraction)', meaning: 'Requires a measured CBC differential.' },
    ],
    requiredMeasurements: ['CBC with differential', 'hemoglobin', 'platelets', 'coagulation tests when relevant'],
  },
  {
    key: 'autonomic',
    label: 'Autonomic & neurophysiology',
    subtitle: 'Afferent sensing → central integration → sympathetic / parasympathetic output',
    layers: ['nervous', 'cardiovascular', 'visceral'],
    focusKeywords: ['brainstem', 'medulla', 'vagus', 'sympathetic', 'spinal', 'heart', 'artery'],
    phases: ['Visceral / baroreceptor sensing', 'Brainstem integration', 'Sympathetic efferent response', 'Parasympathetic efferent response', 'Target-organ feedback'],
    explanation: 'HR, HRV and blood pressure can provide observable context, but Panacea does not convert them into a fabricated sympathetic/parasympathetic percentage. Autonomic tone is multidimensional and protocol-dependent.',
    formulae: [
      { name: 'Rate-pressure product', formula: 'RPP = HR × SBP', meaning: 'A simple derived cardiovascular workload index, not a direct measure of autonomic tone.' },
      { name: 'Baroreflex concept', formula: 'Δefferent response / Δarterial pressure', meaning: 'True baroreflex sensitivity requires an appropriate beat-to-beat protocol and signal analysis.' },
    ],
    requiredMeasurements: ['beat-to-beat ECG / pulse timing', 'beat-to-beat pressure for formal baroreflex testing'],
  },
  {
    key: 'reproductive',
    label: 'Reproductive',
    subtitle: 'HPG axis → gonadal function → gametogenesis / cycle physiology → feedback',
    layers: ['nervous', 'visceral', 'cardiovascular'],
    focusKeywords: ['hypothalam', 'pituitary', 'ovary', 'uterus', 'testis', 'prostate'],
    phases: ['GnRH pulsatile control', 'LH / FSH signaling', 'Gonadal steroidogenesis', 'Gametogenesis / reproductive tissue response', 'Hypothalamic-pituitary-gonadal feedback'],
    explanation: 'The model is sex-agnostic until relevant user or clinical context is explicitly supplied. It does not infer ovulation, fertility, testosterone, estradiol, progesterone or pregnancy from unrelated wearable metrics.',
    formulae: [
      { name: 'Endocrine feedback', formula: 'GnRH → LH/FSH → gonad → sex steroids/inhibin ⟲ feedback', meaning: 'Qualitative HPG-axis map; pulse frequency and hormone concentrations require dedicated measurements.' },
    ],
    requiredMeasurements: ['cycle / reproductive context when relevant', 'LH / FSH / sex steroids when clinically indicated'],
  },
]

export const SYSTEMIC_COUPLING: SystemicCouplingRow[] = [
  { label: 'Autonomic drive', rest: 'balanced baseline', exercise: 'sympathetic drive ↑', recovery: 'parasympathetic reactivation', sleep: 'state-dependent parasympathetic predominance' },
  { label: 'Hepatic fuel handling', rest: 'mixed substrate supply', exercise: 'hepatic glucose output ↑', recovery: 'glycogen restoration context', sleep: 'fasting-state regulation' },
  { label: 'Endocrine context', rest: 'homeostatic feedback', exercise: 'catecholamine / counter-regulatory response', recovery: 'anabolic restoration context', sleep: 'stage-dependent endocrine pulses' },
  { label: 'GI / renal redistribution', rest: 'baseline perfusion', exercise: 'relative splanchnic / renal flow ↓', recovery: 'perfusion normalizes', sleep: 'resting-state organ perfusion' },
  { label: 'Thermal response', rest: 'heat balance near steady state', exercise: 'metabolic heat production ↑', recovery: 'heat dissipation continues', sleep: 'core temperature trend ↓' },
  { label: 'Immune context', rest: 'baseline surveillance', exercise: 'intensity-dependent trafficking', recovery: 'post-exercise redistribution', sleep: 'sleep-dependent immune regulation' },
]

export function advancedPhysiologySystem(key: AdvancedPhysiologySystemKey) {
  return ADVANCED_PHYSIOLOGY_SYSTEMS.find((system) => system.key === key) ?? ADVANCED_PHYSIOLOGY_SYSTEMS[0]
}

export function ratePressureProduct(heartRate: number, systolic: number): number | undefined {
  if (!Number.isFinite(heartRate) || !Number.isFinite(systolic) || heartRate <= 0 || systolic <= 0) return undefined
  return heartRate * systolic
}

export function homaIr(glucoseMgDl: number, insulinMicroUml: number): number | undefined {
  if (!Number.isFinite(glucoseMgDl) || !Number.isFinite(insulinMicroUml) || glucoseMgDl <= 0 || insulinMicroUml <= 0) return undefined
  return (glucoseMgDl * insulinMicroUml) / 405
}

export function arterialOxygenContentMlDl(hbGdl: number, sao2Fraction: number, pao2MmHg: number): number | undefined {
  if (!Number.isFinite(hbGdl) || !Number.isFinite(sao2Fraction) || !Number.isFinite(pao2MmHg)) return undefined
  if (hbGdl <= 0 || sao2Fraction < 0 || sao2Fraction > 1 || pao2MmHg < 0) return undefined
  return 1.34 * hbGdl * sao2Fraction + 0.003 * pao2MmHg
}
