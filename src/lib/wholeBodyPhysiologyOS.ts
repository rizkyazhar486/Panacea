export type WholeBodySystemId =
  | 'cardiovascular'
  | 'respiratory'
  | 'nervous'
  | 'renal'
  | 'endocrine'
  | 'digestive'
  | 'hepatic-metabolic'
  | 'immune-lymphatic'
  | 'musculoskeletal'
  | 'integumentary'
  | 'reproductive'

export interface WholeBodySystemModel {
  id: WholeBodySystemId
  label: string
  shortLabel: string
  primaryRole: string
  anatomyAnchors: readonly string[]
  physiologyAnchors: readonly string[]
  couplingTargets: readonly WholeBodySystemId[]
  equation: string
  equationNote: string
}

export interface WholeBodyCouplingLoop {
  id: string
  label: string
  path: readonly WholeBodySystemId[]
  teachingPoint: string
}

export interface SyntheticPerturbationInput {
  activity: number
  altitude: number
  dehydration: number
  inflammation: number
}

export interface SyntheticHomeostasisState {
  oxygenDemand: number
  ventilatoryDrive: number
  circulatoryDrive: number
  renalConservation: number
  thermalLoad: number
  immuneSignal: number
  metabolicDemand: number
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export const WHOLE_BODY_PHYSIOLOGY_SYSTEMS: readonly WholeBodySystemModel[] = [
  {
    id: 'cardiovascular',
    label: 'Cardiovascular circulation',
    shortLabel: 'Circulation',
    primaryRole: 'Distribute oxygen, nutrients, hormones and heat while returning venous blood to the heart.',
    anatomyAnchors: ['heart', 'arteries', 'veins', 'microcirculation'],
    physiologyAnchors: ['cardiac output', 'vascular resistance', 'venous return', 'tissue perfusion'],
    couplingTargets: ['respiratory', 'renal', 'nervous', 'endocrine', 'musculoskeletal'],
    equation: 'CO = HR × SV',
    equationNote: 'Canonical cardiac-output identity for teaching relationships; no patient values are calculated here.',
  },
  {
    id: 'respiratory',
    label: 'Respiratory gas exchange',
    shortLabel: 'Respiration',
    primaryRole: 'Move air, exchange O₂/CO₂ and couple pulmonary ventilation to circulation.',
    anatomyAnchors: ['airway', 'lungs', 'alveoli', 'diaphragm', 'pulmonary circulation'],
    physiologyAnchors: ['alveolar ventilation', 'diffusion', 'ventilation-perfusion matching', 'respiratory drive'],
    couplingTargets: ['cardiovascular', 'nervous', 'musculoskeletal', 'renal'],
    equation: 'V̇A = (VT − VD) × f',
    equationNote: 'Alveolar-ventilation identity shown conceptually; the simulator uses normalized synthetic signals only.',
  },
  {
    id: 'nervous',
    label: 'Central, peripheral and autonomic control',
    shortLabel: 'Neural control',
    primaryRole: 'Coordinate sensation, motor output, autonomic tone and rapid multisystem control.',
    anatomyAnchors: ['brain', 'spinal cord', 'autonomic pathways', 'peripheral nerves'],
    physiologyAnchors: ['baroreflex', 'chemoreflex', 'motor control', 'thermoregulation', 'interoception'],
    couplingTargets: ['cardiovascular', 'respiratory', 'endocrine', 'musculoskeletal', 'integumentary'],
    equation: 'Δresponse ∝ integrated sensory error × controller gain',
    equationNote: 'Control-systems abstraction only; it is not a validated patient autonomic model.',
  },
  {
    id: 'renal',
    label: 'Renal fluid and electrolyte regulation',
    shortLabel: 'Renal',
    primaryRole: 'Regulate water, electrolytes, acid-base balance and long-timescale blood-pressure support.',
    anatomyAnchors: ['kidneys', 'nephrons', 'glomeruli', 'tubules', 'collecting ducts'],
    physiologyAnchors: ['filtration', 'reabsorption', 'secretion', 'RAAS', 'acid-base regulation'],
    couplingTargets: ['cardiovascular', 'endocrine', 'respiratory'],
    equation: 'Excretion = Filtration − Reabsorption + Secretion',
    equationNote: 'Mass-balance teaching identity; this page does not estimate GFR or electrolyte status.',
  },
  {
    id: 'endocrine',
    label: 'Endocrine network control',
    shortLabel: 'Endocrine',
    primaryRole: 'Coordinate slower hormonal regulation across metabolism, volume, growth, stress and reproduction.',
    anatomyAnchors: ['hypothalamus', 'pituitary', 'thyroid', 'adrenals', 'pancreatic islets', 'gonads'],
    physiologyAnchors: ['feedback loops', 'glucose regulation', 'stress response', 'volume regulation'],
    couplingTargets: ['renal', 'cardiovascular', 'digestive', 'reproductive', 'hepatic-metabolic'],
    equation: 'regulated output = drive − feedback inhibition',
    equationNote: 'Qualitative negative-feedback abstraction, not an endocrine diagnostic model.',
  },
  {
    id: 'digestive',
    label: 'Digestive absorption and enteric control',
    shortLabel: 'Digestive',
    primaryRole: 'Process intake, absorb nutrients and coordinate motility, secretion and enteric signaling.',
    anatomyAnchors: ['esophagus', 'stomach', 'small bowel', 'colon', 'pancreas'],
    physiologyAnchors: ['motility', 'secretion', 'digestion', 'absorption', 'enteric control'],
    couplingTargets: ['hepatic-metabolic', 'endocrine', 'immune-lymphatic', 'cardiovascular'],
    equation: 'net uptake = absorbed load − luminal loss',
    equationNote: 'Conceptual mass-balance relationship; no individual absorption is inferred.',
  },
  {
    id: 'hepatic-metabolic',
    label: 'Hepatic and whole-body metabolism',
    shortLabel: 'Metabolism',
    primaryRole: 'Buffer fuels, transform substrates and coordinate energy availability across tissues.',
    anatomyAnchors: ['liver', 'portal circulation', 'adipose tissue', 'skeletal muscle'],
    physiologyAnchors: ['glycogen turnover', 'gluconeogenesis', 'lipid handling', 'detoxification', 'protein metabolism'],
    couplingTargets: ['digestive', 'endocrine', 'musculoskeletal', 'immune-lymphatic'],
    equation: 'energy balance = intake − expenditure − storage change',
    equationNote: 'Teaching-level energy conservation only; no caloric prescription or metabolic diagnosis is produced.',
  },
  {
    id: 'immune-lymphatic',
    label: 'Immune and lymphatic surveillance',
    shortLabel: 'Immune',
    primaryRole: 'Coordinate barrier defense, immune surveillance, cell trafficking and lymphatic return.',
    anatomyAnchors: ['bone marrow', 'thymus', 'spleen', 'lymph nodes', 'lymphatic vessels'],
    physiologyAnchors: ['innate signaling', 'adaptive response', 'lymph flow', 'inflammatory coordination'],
    couplingTargets: ['integumentary', 'digestive', 'cardiovascular', 'hepatic-metabolic'],
    equation: 'signal load = activation − resolution',
    equationNote: 'Normalized teaching abstraction; not a cytokine panel or immune-status estimate.',
  },
  {
    id: 'musculoskeletal',
    label: 'Musculoskeletal force and movement',
    shortLabel: 'Movement',
    primaryRole: 'Generate force, protect organs, maintain posture and provide a major metabolic sink during activity.',
    anatomyAnchors: ['bone', 'skeletal muscle', 'joints', 'tendons', 'ligaments'],
    physiologyAnchors: ['motor units', 'force-length relation', 'ATP turnover', 'mechanical work'],
    couplingTargets: ['nervous', 'cardiovascular', 'respiratory', 'hepatic-metabolic'],
    equation: 'mechanical power = force × velocity',
    equationNote: 'Fundamental mechanics teaching relationship; the workbench does not estimate patient-specific or personal performance.',
  },
  {
    id: 'integumentary',
    label: 'Integumentary barrier and heat exchange',
    shortLabel: 'Skin',
    primaryRole: 'Provide barrier function, sensation and a controllable surface for heat exchange.',
    anatomyAnchors: ['skin', 'cutaneous vessels', 'sweat glands', 'sensory endings'],
    physiologyAnchors: ['barrier function', 'cutaneous blood flow', 'sweating', 'thermal exchange'],
    couplingTargets: ['nervous', 'cardiovascular', 'immune-lymphatic'],
    equation: 'heat storage = production − external heat loss',
    equationNote: 'Heat-balance concept only; no body-temperature prediction is generated.',
  },
  {
    id: 'reproductive',
    label: 'Reproductive and developmental physiology',
    shortLabel: 'Reproductive',
    primaryRole: 'Coordinate gametogenesis, reproductive tract function and endocrine-linked developmental biology.',
    anatomyAnchors: ['gonads', 'reproductive tract', 'placenta context'],
    physiologyAnchors: ['HPG axis', 'gametogenesis', 'cycle regulation', 'developmental signaling'],
    couplingTargets: ['endocrine', 'cardiovascular', 'renal'],
    equation: 'axis output = pulsatile drive × target responsiveness',
    equationNote: 'Conceptual systems relationship only; no fertility or pregnancy inference is made.',
  },
]

export const WHOLE_BODY_COUPLING_LOOPS: readonly WholeBodyCouplingLoop[] = [
  { id: 'oxygen-transport', label: 'Oxygen transport loop', path: ['respiratory', 'cardiovascular', 'musculoskeletal'], teachingPoint: 'Ventilation, pulmonary exchange, blood flow and tissue demand must stay coupled during activity.' },
  { id: 'volume-pressure', label: 'Volume-pressure loop', path: ['renal', 'endocrine', 'cardiovascular'], teachingPoint: 'Renal sodium-water handling and endocrine feedback influence circulating volume and vascular support over time.' },
  { id: 'acid-base', label: 'Acid-base loop', path: ['respiratory', 'renal', 'cardiovascular'], teachingPoint: 'CO₂ handling and renal acid-base processes operate on different timescales but converge on extracellular chemistry.' },
  { id: 'fuel-flow', label: 'Fuel-flow loop', path: ['digestive', 'hepatic-metabolic', 'endocrine', 'musculoskeletal'], teachingPoint: 'Absorption, hepatic buffering, hormonal control and tissue use redistribute fuels across fed, fasting and active states.' },
  { id: 'heat-control', label: 'Heat-control loop', path: ['musculoskeletal', 'cardiovascular', 'integumentary', 'nervous'], teachingPoint: 'Metabolic heat production is balanced by blood redistribution, skin heat exchange and neural control.' },
  { id: 'host-defense', label: 'Host-defense loop', path: ['integumentary', 'immune-lymphatic', 'cardiovascular', 'hepatic-metabolic'], teachingPoint: 'Barrier integrity, immune activation, circulation and substrate allocation form a whole-body defense network.' },
  { id: 'stress-control', label: 'Stress-control loop', path: ['nervous', 'endocrine', 'cardiovascular', 'hepatic-metabolic'], teachingPoint: 'Fast neural responses and slower endocrine responses coordinate perfusion and substrate availability.' },
  { id: 'reproductive-axis', label: 'Reproductive-endocrine loop', path: ['nervous', 'endocrine', 'reproductive'], teachingPoint: 'Hypothalamic-pituitary-gonadal signaling is a feedback network rather than an isolated organ pathway.' },
]

export const WHOLE_BODY_PHYSIOLOGY_BOUNDARY =
  'Educational systems physiology only. Slider outputs are dimensionless synthetic teaching signals, not measurements, predictions, diagnoses, treatment guidance, fitness prescriptions or patient-specific physiology.'

export function simulateSyntheticHomeostasis(input: SyntheticPerturbationInput): SyntheticHomeostasisState {
  const activity = clamp01(input.activity)
  const altitude = clamp01(input.altitude)
  const dehydration = clamp01(input.dehydration)
  const inflammation = clamp01(input.inflammation)

  return {
    oxygenDemand: clamp01(0.12 + activity * 0.68 + inflammation * 0.16),
    ventilatoryDrive: clamp01(0.10 + activity * 0.48 + altitude * 0.34 + inflammation * 0.08),
    circulatoryDrive: clamp01(0.14 + activity * 0.50 + dehydration * 0.18 + inflammation * 0.10),
    renalConservation: clamp01(0.10 + dehydration * 0.72 + activity * 0.08),
    thermalLoad: clamp01(0.08 + activity * 0.64 + inflammation * 0.20),
    immuneSignal: clamp01(0.06 + inflammation * 0.82 + activity * 0.06),
    metabolicDemand: clamp01(0.14 + activity * 0.62 + inflammation * 0.10),
  }
}

export function getWholeBodySystem(id: WholeBodySystemId): WholeBodySystemModel {
  const system = WHOLE_BODY_PHYSIOLOGY_SYSTEMS.find((item) => item.id === id)
  if (!system) throw new Error(`Unknown whole-body physiology system: ${id}`)
  return system
}
