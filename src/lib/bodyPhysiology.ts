export type PhysiologySystemKey = 'cardiovascular' | 'respiratory' | 'neuromuscular' | 'gastrointestinal' | 'renal' | 'thermoregulation'
export type PhysiologyStateKey = 'rest' | 'exercise' | 'recovery' | 'sleep'
export type PhysiologyProvenance = 'measured' | 'derived' | 'educational' | 'unavailable'

export interface PhysiologyState {
  key: PhysiologyStateKey
  label: string
  note: string
  heartRate: number
  respRate: number
  systolic: number
  diastolic: number
  strokeVolumeMl: number
  tidalVolumeMl: number
  bodyTempC: number
  contractionRate: number
  peristalsisRate: number
}

export interface PhysiologySystem {
  key: PhysiologySystemKey
  label: string
  subtitle: string
  layers: Array<'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'>
  focusKeywords: string[]
  phases: string[]
  explanation: string
  formulae: Array<{ name: string; formula: string; meaning: string }>
}

export const PHYSIOLOGY_STATES: PhysiologyState[] = [
  {
    key: 'rest',
    label: 'Rest',
    note: 'Educational adult resting reference state. Connected measurements override only the metrics they actually provide.',
    heartRate: 70,
    respRate: 14,
    systolic: 118,
    diastolic: 76,
    strokeVolumeMl: 70,
    tidalVolumeMl: 500,
    bodyTempC: 36.8,
    contractionRate: 0,
    peristalsisRate: 8,
  },
  {
    key: 'exercise',
    label: 'Exercise',
    note: 'Illustrative moderate-to-vigorous exercise state; not a prescription and not a prediction for an individual.',
    heartRate: 155,
    respRate: 36,
    systolic: 168,
    diastolic: 76,
    strokeVolumeMl: 105,
    tidalVolumeMl: 1700,
    bodyTempC: 38.0,
    contractionRate: 30,
    peristalsisRate: 3,
  },
  {
    key: 'recovery',
    label: 'Recovery',
    note: 'Illustrative early post-exercise recovery state.',
    heartRate: 92,
    respRate: 20,
    systolic: 126,
    diastolic: 74,
    strokeVolumeMl: 80,
    tidalVolumeMl: 750,
    bodyTempC: 37.4,
    contractionRate: 0,
    peristalsisRate: 5,
  },
  {
    key: 'sleep',
    label: 'Sleep',
    note: 'Illustrative quiet-sleep physiology. Sleep stage and individual variation are not inferred here.',
    heartRate: 56,
    respRate: 12,
    systolic: 104,
    diastolic: 64,
    strokeVolumeMl: 68,
    tidalVolumeMl: 450,
    bodyTempC: 36.4,
    contractionRate: 0,
    peristalsisRate: 6,
  },
]

export const PHYSIOLOGY_SYSTEMS: PhysiologySystem[] = [
  {
    key: 'cardiovascular',
    label: 'Cardiovascular',
    subtitle: 'Filling → contraction → ejection → perfusion',
    layers: ['cardiovascular', 'visceral'],
    focusKeywords: ['heart', 'atrium', 'ventricle', 'aorta', 'artery', 'vein'],
    phases: ['Ventricular filling', 'Atrial systole', 'Isovolumetric contraction', 'Ventricular ejection', 'Isovolumetric relaxation'],
    explanation: 'The animation deforms the anatomical heart mesh only slightly to indicate timing. It does not claim chamber volumes, pressure curves or patient-specific hemodynamics.',
    formulae: [
      { name: 'Mean arterial pressure', formula: 'MAP ≈ DBP + (SBP − DBP) / 3', meaning: 'Common resting approximation; less accurate with marked tachycardia or unusual waveforms.' },
      { name: 'Pulse pressure', formula: 'PP = SBP − DBP', meaning: 'Difference between systolic and diastolic pressure.' },
      { name: 'Cardiac output', formula: 'CO = HR × SV', meaning: 'Displayed CO is model-derived unless stroke volume is actually measured.' },
    ],
  },
  {
    key: 'respiratory',
    label: 'Respiratory',
    subtitle: 'Ventilation → diffusion → perfusion matching',
    layers: ['visceral', 'cardiovascular'],
    focusKeywords: ['lung', 'bronch', 'trachea', 'diaphragm'],
    phases: ['Inspiration', 'Alveolar ventilation', 'Gas diffusion', 'Perfusion matching', 'Expiration'],
    explanation: 'Lung motion is a small respiratory deformation of the reference lung geometry. Gas exchange is explained as a process, not rendered as fabricated patient oxygen transport.',
    formulae: [
      { name: 'Minute ventilation', formula: 'V̇E = RR × VT', meaning: 'Respiratory rate multiplied by tidal volume.' },
      { name: 'Alveolar ventilation', formula: 'V̇A = RR × (VT − VD)', meaning: 'Requires dead-space volume; no patient value is fabricated when it is unavailable.' },
    ],
  },
  {
    key: 'neuromuscular',
    label: 'Neuromuscular',
    subtitle: 'Motor command → excitation → contraction → relaxation',
    layers: ['nervous', 'muscular', 'skeletal'],
    focusKeywords: ['spinal', 'nerve', 'muscle', 'tendon'],
    phases: ['Motor neuron action potential', 'Neuromuscular transmission', 'Ca²⁺ release', 'Actin–myosin cross-bridge cycling', 'Relaxation / Ca²⁺ reuptake'],
    explanation: 'The visual contraction is an educational motion cue. It is not EMG, force-plate data or a finite-element muscle model.',
    formulae: [
      { name: 'Joint torque', formula: 'τ = r × F', meaning: 'Rotational effect of a force around a joint.' },
      { name: 'Mechanical power', formula: 'P = F · v', meaning: 'Instantaneous mechanical power when force and velocity are known.' },
    ],
  },
  {
    key: 'gastrointestinal',
    label: 'Gastrointestinal',
    subtitle: 'Slow wave → contraction → propulsion → absorption',
    layers: ['visceral', 'nervous'],
    focusKeywords: ['stomach', 'duodenum', 'jejunum', 'ileum', 'colon', 'rectum'],
    phases: ['Enteric slow-wave activity', 'Segmental contraction', 'Peristaltic propagation', 'Luminal mixing', 'Absorptive transport'],
    explanation: 'Peristalsis propagates along gastrointestinal meshes instead of making the entire bowel pulse at once.',
    formulae: [
      { name: 'Fick principle', formula: 'V̇ = Q × (Cin − Cout)', meaning: 'General mass-balance relation used for transported substances when flow and concentrations are known.' },
    ],
  },
  {
    key: 'renal',
    label: 'Renal',
    subtitle: 'Perfusion → filtration → tubular handling → excretion',
    layers: ['visceral', 'cardiovascular'],
    focusKeywords: ['kidney', 'renal', 'ureter', 'bladder'],
    phases: ['Renal perfusion', 'Glomerular filtration', 'Tubular reabsorption', 'Tubular secretion', 'Urine excretion'],
    explanation: 'No eGFR is invented. Patient filtration requires creatinine/cystatin C plus the appropriate validated equation and clinical context.',
    formulae: [
      { name: 'Filtration fraction', formula: 'FF = GFR / RPF', meaning: 'Requires measured or clinically estimated GFR and renal plasma flow.' },
      { name: 'Clearance', formula: 'Cx = (Ux × V) / Px', meaning: 'Renal clearance requires urine concentration, urine flow and plasma concentration.' },
    ],
  },
  {
    key: 'thermoregulation',
    label: 'Thermoregulation & metabolism',
    subtitle: 'Heat production ↔ heat transfer ↔ hypothalamic control',
    layers: ['surface', 'cardiovascular', 'muscular', 'visceral'],
    focusKeywords: ['skin', 'artery', 'vein', 'muscle', 'liver'],
    phases: ['Thermal sensing', 'Hypothalamic integration', 'Cutaneous vasomotor response', 'Sweating / heat transfer', 'Metabolic heat balance'],
    explanation: 'Temperature may come from a connected source. Sweating and heat transfer remain explanatory until relevant environmental and physiological measurements are available.',
    formulae: [
      { name: 'Heat balance', formula: 'S = M − W ± R ± C ± K − E', meaning: 'Stored heat equals metabolic heat minus external work, with radiative, convective, conductive and evaporative exchange.' },
    ],
  },
]

export function meanArterialPressure(systolic: number, diastolic: number) {
  return diastolic + (systolic - diastolic) / 3
}

export function pulsePressure(systolic: number, diastolic: number) {
  return systolic - diastolic
}

export function cardiacOutputLMin(heartRate: number, strokeVolumeMl: number) {
  return (heartRate * strokeVolumeMl) / 1000
}

export function minuteVentilationLMin(respRate: number, tidalVolumeMl: number) {
  return (respRate * tidalVolumeMl) / 1000
}

export function physiologyState(key: PhysiologyStateKey) {
  return PHYSIOLOGY_STATES.find((state) => state.key === key) ?? PHYSIOLOGY_STATES[0]
}

export function physiologySystem(key: PhysiologySystemKey) {
  return PHYSIOLOGY_SYSTEMS.find((system) => system.key === key) ?? PHYSIOLOGY_SYSTEMS[0]
}
