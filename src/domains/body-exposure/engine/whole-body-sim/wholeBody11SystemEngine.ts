// Whole-body 11-system interactive mechanistic physiology simulator for Body Exposure.
// Pure module: zero DOM, zero clock, zero randomness, zero network I/O.
// Every system emits deterministic physiological readouts, 2D oscilloscope/phase curves,
// cross-system coupling deltas, ledger-verified PubMed citations, truthClass: 'simulated',
// and explicit VERTICAL GAP - NOT YET MODELED boundaries.

import type { BodySystemId } from '../../data/bodySystems.ts'

export type SimulationTruthClass = 'simulated'
export type PhysiologyStateBand = 'homeostatic' | 'compensating' | 'strained'
export type CouplingDirection = 'up' | 'down' | 'steady'

export type WholeBodyPresetId =
  | 'rest'
  | 'exercise'
  | 'altitude'
  | 'dehydration'
  | 'heat'
  | 'vagal'

export interface WholeBodyPreset {
  readonly id: WholeBodyPresetId
  readonly label: string
  readonly short: string
  readonly cue: string
  readonly params: Readonly<Record<BodySystemId, Readonly<Record<string, number>>>>
}

export interface SystemParamSpec {
  readonly key: string
  readonly label: string
  readonly unit: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly defaultValue: number
}

export interface SystemMetricReadout {
  readonly id: string
  readonly label: string
  readonly value: number
  readonly unit: string
  readonly refRange: string
  readonly band: PhysiologyStateBand
}

export interface CurvePoint {
  readonly x: number
  readonly y: number
}

export interface SystemCurveSeries {
  readonly id: string
  readonly label: string
  readonly color: string
  readonly points: readonly CurvePoint[]
  readonly closed?: boolean
}

export interface SystemCouplingEffect {
  readonly targetSystemId: BodySystemId
  readonly targetLabel: string
  readonly direction: CouplingDirection
  readonly mechanism: string
}

export interface SystemSimSpec {
  readonly systemId: BodySystemId
  readonly label: string
  readonly shortLabel: string
  readonly simLabel: string
  readonly accent: string
  readonly equationName: string
  readonly equationFormula: string
  readonly xAxisLabel: string
  readonly yAxisLabel: string
  readonly pmid: string
  readonly citationNote: string
  readonly verticalGapNote: string
  readonly params: readonly SystemParamSpec[]
}

export interface WholeBodySystemSimulationResult {
  readonly ok: true
  readonly systemId: BodySystemId
  readonly label: string
  readonly truthClass: SimulationTruthClass
  readonly clinicallyReviewed: false
  readonly presetHint: string
  readonly equationName: string
  readonly equationFormula: string
  readonly pmid: string
  readonly citationUrl: string
  readonly citationNote: string
  readonly verticalGapNote: string
  readonly inputs: Readonly<Record<string, number>>
  readonly metrics: readonly SystemMetricReadout[]
  readonly overallBand: PhysiologyStateBand
  readonly xAxisLabel: string
  readonly yAxisLabel: string
  readonly xDomain: readonly [number, number]
  readonly yDomain: readonly [number, number]
  readonly operatingPoint: CurvePoint
  readonly series: readonly SystemCurveSeries[]
  readonly couplings: readonly SystemCouplingEffect[]
}

export type WholeBodySimEvaluation =
  | WholeBodySystemSimulationResult
  | { readonly ok: false; readonly reason: string }

export const VERTICAL_GAP_MARKER = 'VERTICAL GAP - NOT YET MODELED' as const

const round1 = (v: number) => Math.round(v * 10) / 10
const round2 = (v: number) => Math.round(v * 100) / 100
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const pubmedUrl = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`

export const WHOLE_BODY_11_SPECS: readonly SystemSimSpec[] = [
  {
    systemId: 'cardiovascular',
    label: 'Cardiovascular',
    shortLabel: 'Cardio',
    simLabel: 'Systemic PV loop and baroreflex',
    accent: '#ff6b81',
    equationName: 'Frank–Starling & Ohm',
    equationFormula: 'CO = HR × (EDV − ESV),  MAP ≈ CO × SVR / 80 + CVP',
    xAxisLabel: 'LV Volume (mL)',
    yAxisLabel: 'LV Pressure (mmHg)',
    pmid: '11805843',
    citationNote: 'Bers (2002), Cardiac excitation-contraction coupling (PMID 11805843)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific ventricular geometry, regional scar, and valvular gradients are not measured here.`,
    params: [
      { key: 'hr', label: 'Heart rate', unit: 'bpm', min: 40, max: 180, step: 1, defaultValue: 70 },
      { key: 'edv', label: 'Preload (EDV)', unit: 'mL', min: 70, max: 180, step: 2, defaultValue: 120 },
      { key: 'svr', label: 'Systemic resistance', unit: 'dyn·s/cm⁵', min: 600, max: 2400, step: 25, defaultValue: 1150 },
      { key: 'ees', label: 'Contractility (Ees)', unit: 'mmHg/mL', min: 1.0, max: 4.0, step: 0.1, defaultValue: 2.3 },
    ],
  },
  {
    systemId: 'nervous',
    label: 'Nervous',
    shortLabel: 'Neuro',
    simLabel: 'Action potential and cerebral perfusion',
    accent: '#ffd166',
    equationName: 'Cerebral Perfusion & Axon Conduction',
    equationFormula: 'CPP = MAP − ICP,  v_cond ∝ myelin × excitability',
    xAxisLabel: 'Time (ms)',
    yAxisLabel: 'Membrane Vm (mV)',
    pmid: '30725956',
    citationNote: 'Mount & Das (2023), Cerebral Perfusion Pressure (PMID 30725956)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific regional cerebral blood flow, EEG waveform, and cranial nerve deficits are not measured here.`,
    params: [
      { key: 'map', label: 'Mean arterial pressure', unit: 'mmHg', min: 50, max: 150, step: 2, defaultValue: 92 },
      { key: 'icp', label: 'Intracranial pressure', unit: 'mmHg', min: 5, max: 40, step: 1, defaultValue: 10 },
      { key: 'stim', label: 'Membrane stimulus', unit: 'µA/cm²', min: 0, max: 100, step: 2, defaultValue: 42 },
      { key: 'myelin', label: 'Myelination factor', unit: '×', min: 0.3, max: 1.2, step: 0.05, defaultValue: 1.0 },
    ],
  },
  {
    systemId: 'respiratory',
    label: 'Respiratory',
    shortLabel: 'Resp',
    simLabel: 'Alveolar gas and V/Q shunt lab',
    accent: '#5cd6ff',
    equationName: 'Alveolar Gas Equation & V/Q Shunt',
    equationFormula: 'PAO₂ = FiO₂(Patm − 47) − PaCO₂ / 0.8,  V̇A = RR × (VT − VD)',
    xAxisLabel: 'Transpulmonary P (cmH₂O)',
    yAxisLabel: 'Lung Volume (L)',
    pmid: '37816345',
    citationNote: 'Petersson & Glenny (2024), Gas Exchange in the Lung (PMID 37816345)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific spirometry, regional CT ventilation, and arterial blood gas readings are not measured here.`,
    params: [
      { key: 'fio2', label: 'Inspired O₂ (FiO₂)', unit: '%', min: 21, max: 100, step: 1, defaultValue: 21 },
      { key: 'rr', label: 'Respiratory rate', unit: '/min', min: 6, max: 36, step: 1, defaultValue: 14 },
      { key: 'vt', label: 'Tidal volume', unit: 'mL', min: 300, max: 900, step: 10, defaultValue: 500 },
      { key: 'shunt', label: 'V/Q shunt fraction', unit: '%', min: 2, max: 40, step: 1, defaultValue: 4 },
    ],
  },
  {
    systemId: 'digestive',
    label: 'Digestive',
    shortLabel: 'Digest',
    simLabel: 'Gastric acid and portal flux lab',
    accent: '#ff9f43',
    equationName: 'Parietal H⁺/K⁺-ATPase & Portal Fick',
    equationFormula: 'H⁺_net = Drive × (1 − 0.72·Somatostatin),  CL_hep = Q_portal × E_h',
    xAxisLabel: 'Time post-meal (min)',
    yAxisLabel: 'Acid Output (mEq/h)',
    pmid: '21897223',
    citationNote: 'Schubert (2011), Gastric secretion (PMID 21897223)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific gastric pH, hepatic enzyme kinetics, and mucosal endoscopy findings are not measured here.`,
    params: [
      { key: 'drive', label: 'Vagal / gastrin drive', unit: '%', min: 5, max: 100, step: 5, defaultValue: 45 },
      { key: 'somatostatin', label: 'Somatostatin brake', unit: '%', min: 0, max: 100, step: 5, defaultValue: 30 },
      { key: 'portalFlow', label: 'Portal venous flow', unit: 'mL/min', min: 600, max: 1800, step: 50, defaultValue: 1100 },
    ],
  },
  {
    systemId: 'urinary',
    label: 'Urinary',
    shortLabel: 'Renal',
    simLabel: 'Glomerular Starling and TGF autoregulation',
    accent: '#48dbfb',
    equationName: 'Starling GFR & Tubuloglomerular Feedback',
    equationFormula: 'NFP = PGC − PBS − π_GC,  GFR = Kf × NFP (autoregulated 80–160 mmHg)',
    xAxisLabel: 'Renal Arterial P (mmHg)',
    yAxisLabel: 'GFR (mL/min)',
    pmid: '33833078',
    citationNote: 'Zehra, Cupples & Braam (2021), Tubuloglomerular Feedback Synchronization in Nephrovascular Networks (PMID 33833078)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific serum creatinine, eGFR, albuminuria, and nephron count are not measured here.`,
    params: [
      { key: 'rap', label: 'Renal arterial pressure', unit: 'mmHg', min: 60, max: 180, step: 2, defaultValue: 100 },
      { key: 'affTone', label: 'Afferent tone', unit: '×', min: 0.5, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { key: 'effTone', label: 'Efferent tone', unit: '×', min: 0.5, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { key: 'oncotic', label: 'Plasma oncotic π', unit: 'mmHg', min: 18, max: 34, step: 1, defaultValue: 25 },
    ],
  },
  {
    systemId: 'endocrine',
    label: 'Endocrine',
    shortLabel: 'Endo',
    simLabel: 'HPT and HPA negative-feedback axis',
    accent: '#c084fc',
    equationName: 'Hypothalamic–Pituitary Negative Feedback',
    equationFormula: 'Pituitary = Drive × Gain / (1 + k_fb × Target),  Target_ss ∝ Pituitary',
    xAxisLabel: 'Circadian Hour (h)',
    yAxisLabel: 'Hormone Ratio (norm)',
    pmid: '33549603',
    citationNote: 'Feldt-Rasmussen, Effraimidis & Klose (2021), The hypothalamus-pituitary-thyroid (HPT)-axis (PMID 33549603)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific serum TSH, fT4, cortisol assays, and receptor polymorphisms are not measured here.`,
    params: [
      { key: 'drive', label: 'Hypothalamic drive', unit: '×', min: 0.2, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { key: 'pitGain', label: 'Pituitary gain', unit: '×', min: 0.5, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { key: 'feedback', label: 'Negative feedback gain', unit: '×', min: 0.3, max: 2.5, step: 0.05, defaultValue: 1.0 },
    ],
  },
  {
    systemId: 'reproductive',
    label: 'Reproductive',
    shortLabel: 'Repro',
    simLabel: 'HPG axis and 28-day cycle dynamics',
    accent: '#f472b6',
    equationName: 'HPG Axis GnRH Pulsatility & Feedback',
    equationFormula: 'LH/FSH = f(GnRH_freq, CycleDay, EstrogenFeedback)',
    xAxisLabel: 'Cycle Day (1–28)',
    yAxisLabel: 'Relative Hormone Index',
    pmid: '29524268',
    citationNote: 'Acevedo-Rodriguez et al. (2018), Emerging insights into hypothalamic-pituitary-gonadal axis regulation (PMID 29524268)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: individual cycle variability, fertility biomarkers, and clinical endocrine testing are not measured here.`,
    params: [
      { key: 'cycleDay', label: 'Cycle day', unit: 'day', min: 1, max: 28, step: 1, defaultValue: 14 },
      { key: 'gnrhFreq', label: 'GnRH pulse frequency', unit: '/h', min: 0.4, max: 2.0, step: 0.1, defaultValue: 1.0 },
      { key: 'fbGain', label: 'Steroid feedback gain', unit: '×', min: 0.5, max: 1.5, step: 0.05, defaultValue: 1.0 },
    ],
  },
  {
    systemId: 'lymphatic-immune',
    label: 'Lymphatic / Immune',
    shortLabel: 'Lymph',
    simLabel: 'Starling filtration and lymphatic clearance',
    accent: '#34d399',
    equationName: 'Starling–Lymphatic Interstitial Balance',
    equationFormula: 'Jv = Kf[(Pc − Pi) − σ(πc − πi)],  Margin = Q_lymph_max − Jv',
    xAxisLabel: 'Capillary Pressure Pc (mmHg)',
    yAxisLabel: 'Fluid Flux (mL/min)',
    pmid: '32707093',
    citationNote: 'Oliver et al. (2020), The Lymphatic Vasculature in the 21(st) Century (PMID 32707093)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific lymphatic imaging, nodal biopsy, and immune cell subsets are not measured here.`,
    params: [
      { key: 'pc', label: 'Capillary hydrostatic Pc', unit: 'mmHg', min: 15, max: 40, step: 1, defaultValue: 22 },
      { key: 'pic', label: 'Plasma oncotic πc', unit: 'mmHg', min: 18, max: 32, step: 1, defaultValue: 26 },
      { key: 'pump', label: 'Lymphatic pump rate', unit: '×', min: 0.4, max: 2.5, step: 0.05, defaultValue: 1.0 },
    ],
  },
  {
    systemId: 'musculoskeletal',
    label: 'Musculoskeletal / Articular',
    shortLabel: 'Muscle',
    simLabel: 'Sarcomere length–tension and Hill curve',
    accent: '#fb7185',
    equationName: 'Gordon Sarcomere Overlap & Hill Force–Velocity',
    equationFormula: 'V = Vmax(1 − F/F₀) / (1 + 4·F/F₀),  Power = F × V',
    xAxisLabel: 'Sarcomere Length (µm)',
    yAxisLabel: 'Active Tension (% Fmax)',
    pmid: '28509964',
    citationNote: 'Calderón, Bolaños & Caputo (2014), The excitation-contraction coupling mechanism in skeletal muscle (PMID 28509964)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific muscle fiber composition, dynamometry, and bone mineral density are not measured here.`,
    params: [
      { key: 'sarcomere', label: 'Sarcomere length', unit: 'µm', min: 1.4, max: 3.6, step: 0.05, defaultValue: 2.15 },
      { key: 'loadPct', label: 'External load', unit: '% Fmax', min: 0, max: 100, step: 2, defaultValue: 32 },
      { key: 'freqHz', label: 'Motor neuron firing', unit: 'Hz', min: 5, max: 100, step: 5, defaultValue: 40 },
    ],
  },
  {
    systemId: 'sensory-ent',
    label: 'Sensory / ENT',
    shortLabel: 'Sensory',
    simLabel: 'Cochlear tonotopy and retinal adaptation',
    accent: '#38bdf8',
    equationName: 'Greenwood Cochlear Map & Phototransduction',
    equationFormula: 'f(x) = 165.4 × (10^(2.1·x) − 0.88),  Gain_OHC compresses SPL',
    xAxisLabel: 'Basilar Place (0=Apex · 1=Base)',
    yAxisLabel: 'Envelope Amplitude (norm)',
    pmid: '30661717',
    citationNote: 'Ó Maoiléidigh & Ricci (2019), Inner-Ear Hair-Cell Mechanotransduction (PMID 30661717)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific audiometry, visual acuity, and evoked potentials are not measured here.`,
    params: [
      { key: 'freqHz', label: 'Acoustic frequency', unit: 'Hz', min: 50, max: 16000, step: 50, defaultValue: 1000 },
      { key: 'spl', label: 'Sound pressure level', unit: 'dB SPL', min: 10, max: 110, step: 2, defaultValue: 55 },
      { key: 'luxLog', label: 'Retinal luminance', unit: 'log td', min: 0, max: 6, step: 0.2, defaultValue: 3.0 },
    ],
  },
  {
    systemId: 'integumentary-surface',
    label: 'Integumentary / Surface',
    shortLabel: 'Skin',
    simLabel: 'Stratum corneum TEWL and thermoregulation',
    accent: '#f59e0b',
    equationName: 'Fick Epidermal TEWL & Cutaneous Conductance',
    equationFormula: 'TEWL ∝ (1 − RH) / BarrierIntegrity,  Q_skin = f(ΔT_core, T_amb)',
    xAxisLabel: 'Ambient Temp (°C)',
    yAxisLabel: 'Cutaneous Flow / TEWL',
    pmid: '37717558',
    citationNote: 'Rajkumar et al. (2023), The Skin Barrier and Moisturization (PMID 37717558)',
    verticalGapNote: `${VERTICAL_GAP_MARKER}: patient-specific corneometry, dermatologic lesion histology, and core thermometry are not measured here.`,
    params: [
      { key: 'ambientC', label: 'Ambient temperature', unit: '°C', min: 5, max: 45, step: 1, defaultValue: 24 },
      { key: 'humidity', label: 'Relative humidity', unit: '%', min: 10, max: 95, step: 5, defaultValue: 55 },
      { key: 'barrier', label: 'Lipid barrier integrity', unit: '%', min: 25, max: 100, step: 5, defaultValue: 90 },
      { key: 'coreDelta', label: 'Core ΔTemp', unit: '°C', min: -1.0, max: 2.5, step: 0.1, defaultValue: 0.0 },
    ],
  },
]

const SPEC_MAP = new Map<BodySystemId, SystemSimSpec>(
  WHOLE_BODY_11_SPECS.map((spec) => [spec.systemId, spec] as const),
)

export function defaultParamsForSystem(systemId: BodySystemId): Record<string, number> {
  const spec = SPEC_MAP.get(systemId)
  if (!spec) return {}
  return Object.fromEntries(spec.params.map((p) => [p.key, p.defaultValue]))
}

const makePresetParams = (
  overrides: Partial<Record<BodySystemId, Record<string, number>>>,
): Record<BodySystemId, Record<string, number>> => {
  const out = {} as Record<BodySystemId, Record<string, number>>
  for (const spec of WHOLE_BODY_11_SPECS) {
    out[spec.systemId] = { ...defaultParamsForSystem(spec.systemId), ...(overrides[spec.systemId] ?? {}) }
  }
  return out
}

export const WHOLE_BODY_PRESETS: readonly WholeBodyPreset[] = [
  {
    id: 'rest',
    label: 'Rest Baseline',
    short: 'Rest',
    cue: 'Normative resting physiology across all 11 systems',
    params: makePresetParams({}),
  },
  {
    id: 'exercise',
    label: 'Endurance Exercise',
    short: 'Exercise',
    cue: 'High CO, ventilation, sarcomere power & cutaneous heat loss',
    params: makePresetParams({
      cardiovascular: { hr: 148, edv: 142, svr: 750, ees: 3.3 },
      nervous: { map: 108, icp: 10, stim: 68, myelin: 1.0 },
      respiratory: { fio2: 21, rr: 28, vt: 760, shunt: 3 },
      digestive: { drive: 20, somatostatin: 60, portalFlow: 750 },
      urinary: { rap: 108, affTone: 1.25, effTone: 1.15, oncotic: 26 },
      endocrine: { drive: 1.6, pitGain: 1.2, feedback: 0.9 },
      'lymphatic-immune': { pc: 28, pic: 26, pump: 1.85 },
      musculoskeletal: { sarcomere: 2.15, loadPct: 35, freqHz: 65 },
      'integumentary-surface': { ambientC: 26, humidity: 55, barrier: 90, coreDelta: 1.1 },
    }),
  },
  {
    id: 'altitude',
    label: 'High Altitude (3.5 km)',
    short: 'Altitude',
    cue: 'Hypobaric hypoxia with respiratory & cardiovascular compensation',
    params: makePresetParams({
      cardiovascular: { hr: 96, edv: 112, svr: 1320, ees: 2.5 },
      nervous: { map: 98, icp: 13, stim: 48, myelin: 1.0 },
      respiratory: { fio2: 21, rr: 22, vt: 620, shunt: 14 },
      urinary: { rap: 98, affTone: 1.05, effTone: 1.05, oncotic: 27 },
      endocrine: { drive: 1.4, pitGain: 1.1, feedback: 1.0 },
      'integumentary-surface': { ambientC: 10, humidity: 25, barrier: 80, coreDelta: -0.3 },
    }),
  },
  {
    id: 'dehydration',
    label: 'Acute Dehydration',
    short: 'Dehydrate',
    cue: 'Reduced preload, higher plasma oncotic pressure & renal conservation',
    params: makePresetParams({
      cardiovascular: { hr: 108, edv: 88, svr: 1650, ees: 2.6 },
      nervous: { map: 78, icp: 9, stim: 40, myelin: 1.0 },
      digestive: { drive: 25, somatostatin: 50, portalFlow: 800 },
      urinary: { rap: 78, affTone: 1.3, effTone: 1.35, oncotic: 31 },
      endocrine: { drive: 1.7, pitGain: 1.25, feedback: 1.0 },
      'lymphatic-immune': { pc: 18, pic: 31, pump: 0.8 },
      'integumentary-surface': { ambientC: 32, humidity: 30, barrier: 75, coreDelta: 0.6 },
    }),
  },
  {
    id: 'heat',
    label: 'Heat Stress (38 °C)',
    short: 'Heat',
    cue: 'Cutaneous vasodilation, elevated TEWL & hemodynamic redistribution',
    params: makePresetParams({
      cardiovascular: { hr: 118, edv: 104, svr: 820, ees: 2.7 },
      respiratory: { fio2: 21, rr: 20, vt: 560, shunt: 4 },
      urinary: { rap: 84, affTone: 1.2, effTone: 1.2, oncotic: 28 },
      'lymphatic-immune': { pc: 27, pic: 27, pump: 1.3 },
      'integumentary-surface': { ambientC: 38, humidity: 70, barrier: 85, coreDelta: 1.6 },
    }),
  },
  {
    id: 'vagal',
    label: 'Vagal Recovery',
    short: 'Vagal',
    cue: 'Parasympathetic dominance, resting bradycardia & digestive tone',
    params: makePresetParams({
      cardiovascular: { hr: 54, edv: 132, svr: 1050, ees: 2.2 },
      nervous: { map: 86, icp: 9, stim: 36, myelin: 1.0 },
      respiratory: { fio2: 21, rr: 10, vt: 540, shunt: 3 },
      digestive: { drive: 70, somatostatin: 20, portalFlow: 1350 },
      endocrine: { drive: 0.8, pitGain: 0.9, feedback: 1.15 },
      musculoskeletal: { sarcomere: 2.15, loadPct: 8, freqHz: 15 },
      'integumentary-surface': { ambientC: 22, humidity: 55, barrier: 95, coreDelta: -0.1 },
    }),
  },
]

function worstBand(metrics: readonly SystemMetricReadout[]): PhysiologyStateBand {
  if (metrics.some((m) => m.band === 'strained')) return 'strained'
  if (metrics.some((m) => m.band === 'compensating')) return 'compensating'
  return 'homeostatic'
}

export function evaluateWholeBodySystem(
  systemId: BodySystemId,
  rawInputs: Readonly<Record<string, number>> = {},
  presetHint = 'Custom',
): WholeBodySimEvaluation {
  const spec = SPEC_MAP.get(systemId)
  if (!spec) return { ok: false, reason: `unknown-body-system:${String(systemId)}` }

  const inputs: Record<string, number> = {}
  for (const p of spec.params) {
    const raw = rawInputs[p.key]
    if (raw !== undefined && !Number.isFinite(raw)) {
      return { ok: false, reason: `non-finite-input:${systemId}.${p.key}` }
    }
    inputs[p.key] = clamp(raw ?? p.defaultValue, p.min, p.max)
  }

  const base = {
    ok: true as const,
    systemId,
    label: spec.label,
    truthClass: 'simulated' as const,
    clinicallyReviewed: false as const,
    presetHint,
    equationName: spec.equationName,
    equationFormula: spec.equationFormula,
    pmid: spec.pmid,
    citationUrl: pubmedUrl(spec.pmid),
    citationNote: spec.citationNote,
    verticalGapNote: spec.verticalGapNote,
    inputs,
    xAxisLabel: spec.xAxisLabel,
    yAxisLabel: spec.yAxisLabel,
  }

  switch (systemId) {
    case 'cardiovascular': {
      const { hr, edv, svr, ees } = inputs
      const ea = (svr * hr) / 60000
      const v0 = 15
      const esv = clamp((ea * edv + ees * v0) / (ees + ea), 20, edv - 10)
      const sv = Math.max(10, edv - esv)
      const co = (hr * sv) / 1000
      const map = clamp((co * svr) / 80 + 5, 35, 190)
      const ef = (sv / edv) * 100
      const pes = clamp(ees * (esv - v0), 40, 220)
      const edp = clamp(4 + 0.00055 * (edv - 40) ** 2, 4, 34)
      const loop: CurvePoint[] = []
      for (let i = 0; i <= 12; i++) loop.push({ x: round1(edv), y: round1(edp + (pes * 0.72 - edp) * (i / 12)) })
      for (let i = 1; i <= 16; i++) {
        const t = i / 16
        const v = edv - sv * t
        const p = pes * (0.72 + 0.34 * Math.sin(Math.PI * t)) + (pes - pes * 0.72) * t
        loop.push({ x: round1(v), y: round1(clamp(p, 10, 220)) })
      }
      for (let i = 1; i <= 10; i++) loop.push({ x: round1(esv), y: round1(pes - (pes - edp * 0.7) * (i / 10)) })
      for (let i = 1; i <= 12; i++) {
        const t = i / 12
        const v = esv + sv * t
        loop.push({ x: round1(v), y: round1(edp * 0.7 + (edp - edp * 0.7) * t * t) })
      }
      const metrics: SystemMetricReadout[] = [
        { id: 'co', label: 'Cardiac Output', value: round2(co), unit: 'L/min', refRange: '4.0–6.5', band: co < 3.5 || co > 15 ? 'strained' : co < 4.0 || co > 8 ? 'compensating' : 'homeostatic' },
        { id: 'map', label: 'Mean Arterial P', value: round1(map), unit: 'mmHg', refRange: '70–105', band: map < 65 || map > 130 ? 'strained' : map < 70 || map > 110 ? 'compensating' : 'homeostatic' },
        { id: 'ef', label: 'Ejection Fraction', value: round1(ef), unit: '%', refRange: '55–70', band: ef < 45 ? 'strained' : ef < 55 ? 'compensating' : 'homeostatic' },
        { id: 'sv', label: 'Stroke Volume', value: round1(sv), unit: 'mL', refRange: '60–100', band: sv < 45 ? 'strained' : sv < 60 ? 'compensating' : 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [0, 200],
        yDomain: [0, 200],
        operatingPoint: { x: round1(esv), y: round1(pes) },
        series: [{ id: 'pv-loop', label: 'LV PV Loop', color: spec.accent, points: loop, closed: true }],
        couplings: [
          { targetSystemId: 'nervous', targetLabel: 'Nervous', direction: map < 70 ? 'down' : map > 115 ? 'up' : 'steady', mechanism: 'Baroreflex & cerebral perfusion drive' },
          { targetSystemId: 'urinary', targetLabel: 'Urinary', direction: map < 75 ? 'down' : 'steady', mechanism: 'Renal perfusion & TGF autoregulation' },
          { targetSystemId: 'respiratory', targetLabel: 'Respiratory', direction: co > 7.5 ? 'up' : 'steady', mechanism: 'Pulmonary blood flow & O₂ transport' },
        ],
      }
    }

    case 'nervous': {
      const { map, icp, stim, myelin } = inputs
      const cpp = map - icp
      const threshold = 24
      const fires = stim >= threshold
      const peakVm = fires ? round1(clamp(18 + (stim - threshold) * 0.28, 18, 38)) : round1(-70 + stim * 0.65)
      const condVel = round1(clamp((fires ? 52 : 0) * myelin * (cpp < 50 ? 0.65 : 1), 0, 80))
      const trace: CurvePoint[] = []
      for (let i = 0; i <= 50; i++) {
        const t = (i / 50) * 5
        let vm = -70
        if (fires) {
          if (t >= 0.7 && t < 1.35) vm = -70 + (peakVm + 70) * Math.sin(((t - 0.7) / 0.65) * (Math.PI / 2))
          else if (t >= 1.35 && t < 2.4) vm = peakVm - (peakVm + 82) * ((t - 1.35) / 1.05)
          else if (t >= 2.4) vm = -82 + 12 * (1 - Math.exp(-(t - 2.4) * 1.6))
        } else {
          vm = -70 + (peakVm + 70) * Math.exp(-((t - 1.0) ** 2) / 0.35)
        }
        trace.push({ x: round2(t), y: round1(vm) })
      }
      const autoregBand: PhysiologyStateBand = cpp < 55 || cpp > 130 ? 'strained' : cpp < 65 || cpp > 115 ? 'compensating' : 'homeostatic'
      const metrics: SystemMetricReadout[] = [
        { id: 'cpp', label: 'Cerebral Perfusion P', value: round1(cpp), unit: 'mmHg', refRange: '60–100', band: autoregBand },
        { id: 'vm', label: 'Peak Vm', value: peakVm, unit: 'mV', refRange: '+20 to +35 (AP)', band: fires ? 'homeostatic' : 'compensating' },
        { id: 'vel', label: 'Conduction Velocity', value: condVel, unit: 'm/s', refRange: '35–70', band: !fires || condVel < 25 ? 'strained' : condVel < 38 ? 'compensating' : 'homeostatic' },
        { id: 'icp', label: 'ICP Load', value: round1(icp), unit: 'mmHg', refRange: '5–15', band: icp > 22 ? 'strained' : icp > 15 ? 'compensating' : 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [0, 5],
        yDomain: [-90, 45],
        operatingPoint: { x: 1.35, y: peakVm },
        series: [{ id: 'vm-trace', label: 'Action Potential Vm(t)', color: spec.accent, points: trace }],
        couplings: [
          { targetSystemId: 'cardiovascular', targetLabel: 'Cardiovascular', direction: cpp < 60 ? 'up' : 'steady', mechanism: 'Sympathetic Cushing / baroreflex outflow' },
          { targetSystemId: 'musculoskeletal', targetLabel: 'Musculoskeletal', direction: fires ? 'up' : 'down', mechanism: 'Alpha motor neuron recruitment' },
          { targetSystemId: 'endocrine', targetLabel: 'Endocrine', direction: icp > 20 || cpp < 60 ? 'up' : 'steady', mechanism: 'Hypothalamic stress axis drive' },
        ],
      }
    }

    case 'respiratory': {
      const { fio2, rr, vt, shunt } = inputs
      const vd = 150
      const va = Math.max(0.8, (rr * Math.max(80, vt - vd)) / 1000)
      const paco2 = clamp(40 * (4.9 / va), 18, 85)
      const pao2Alv = clamp((fio2 / 100) * (760 - 47) - paco2 / 0.8, 35, 670)
      const aaGrad = clamp(6 + shunt * 2.4 + (fio2 - 21) * 0.25, 5, pao2Alv - 25)
      const pao2Art = clamp(pao2Alv - aaGrad, 25, 620)
      const sao2 = clamp(100 * (pao2Art ** 2.7) / (pao2Art ** 2.7 + 27 ** 2.7), 40, 100)
      const loop: CurvePoint[] = []
      const vtL = vt / 1000
      for (let i = 0; i <= 24; i++) {
        const f = i / 24
        const p = 5 + f * 18
        const v = 2.2 + vtL * (1 - Math.exp(-3.1 * f)) / (1 - Math.exp(-3.1))
        loop.push({ x: round2(p), y: round2(v) })
      }
      for (let i = 1; i <= 24; i++) {
        const f = 1 - i / 24
        const p = 5 + f * 18
        const v = 2.2 + vtL * (f ** 0.72)
        loop.push({ x: round2(p), y: round2(v) })
      }
      const metrics: SystemMetricReadout[] = [
        { id: 'va', label: 'Alveolar Ventilation', value: round2(va), unit: 'L/min', refRange: '4.0–6.0', band: va < 3.0 ? 'strained' : va < 4.0 || va > 10 ? 'compensating' : 'homeostatic' },
        { id: 'pao2', label: 'Est. Arterial PaO₂', value: round1(pao2Art), unit: 'mmHg', refRange: '80–100', band: pao2Art < 60 ? 'strained' : pao2Art < 75 ? 'compensating' : 'homeostatic' },
        { id: 'sao2', label: 'Hb O₂ Saturation', value: round1(sao2), unit: '%', refRange: '95–100', band: sao2 < 90 ? 'strained' : sao2 < 95 ? 'compensating' : 'homeostatic' },
        { id: 'paco2', label: 'Arterial PaCO₂', value: round1(paco2), unit: 'mmHg', refRange: '35–45', band: paco2 < 28 || paco2 > 52 ? 'strained' : paco2 < 35 || paco2 > 45 ? 'compensating' : 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [0, 28],
        yDomain: [2.0, 3.3],
        operatingPoint: { x: 23, y: round2(2.2 + vtL) },
        series: [{ id: 'lung-pv', label: 'Lung Compliance Loop', color: spec.accent, points: loop, closed: true }],
        couplings: [
          { targetSystemId: 'cardiovascular', targetLabel: 'Cardiovascular', direction: pao2Alv < 70 ? 'up' : 'steady', mechanism: 'Hypoxic pulmonary vasoconstriction & HR drive' },
          { targetSystemId: 'urinary', targetLabel: 'Urinary', direction: paco2 > 48 ? 'up' : paco2 < 32 ? 'down' : 'steady', mechanism: 'Renal HCO₃⁻ acid–base compensation' },
          { targetSystemId: 'nervous', targetLabel: 'Nervous', direction: paco2 > 50 ? 'up' : 'steady', mechanism: 'CO₂ cerebral vasodilation & chemoreceptor drive' },
        ],
      }
    }

    case 'digestive': {
      const { drive, somatostatin, portalFlow } = inputs
      const acidOut = clamp(0.45 * drive * (1 - 0.72 * (somatostatin / 100)), 0.5, 45)
      const ph = clamp(5.2 - 1.05 * Math.log10(acidOut + 1), 1.3, 5.5)
      const extraction = clamp(0.48 * (1100 / portalFlow) ** 0.25, 0.25, 0.72)
      const clearance = portalFlow * extraction
      const curve: CurvePoint[] = []
      for (let i = 0; i <= 40; i++) {
        const min = i * 3
        const wave = acidOut * (0.25 + 0.75 * Math.exp(-((min - 45) ** 2) / 1400))
        curve.push({ x: min, y: round2(wave) })
      }
      const metrics: SystemMetricReadout[] = [
        { id: 'acid', label: 'Peak Acid Output', value: round1(acidOut), unit: 'mEq/h', refRange: '5–22', band: acidOut > 32 ? 'strained' : acidOut > 24 || acidOut < 3 ? 'compensating' : 'homeostatic' },
        { id: 'ph', label: 'Gastric Luminal pH', value: round2(ph), unit: 'pH', refRange: '1.8–3.5', band: ph < 1.5 ? 'strained' : ph > 4.2 ? 'compensating' : 'homeostatic' },
        { id: 'cl', label: 'Hepatic Clearance', value: round1(clearance), unit: 'mL/min', refRange: '400–650', band: clearance < 340 ? 'strained' : clearance < 400 ? 'compensating' : 'homeostatic' },
        { id: 'eh', label: 'Portal Extraction', value: round1(extraction * 100), unit: '%', refRange: '38–58', band: 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [0, 120],
        yDomain: [0, 45],
        operatingPoint: { x: 45, y: round1(acidOut) },
        series: [{ id: 'acid-curve', label: 'Parietal Acid Curve', color: spec.accent, points: curve }],
        couplings: [
          { targetSystemId: 'lymphatic-immune', targetLabel: 'Lymphatic / Immune', direction: drive > 60 ? 'up' : 'steady', mechanism: 'Lacteal lipid transport & mucosal surveillance' },
          { targetSystemId: 'endocrine', targetLabel: 'Endocrine', direction: drive > 50 ? 'up' : 'steady', mechanism: 'Incretin, gastrin & somatostatin signalling' },
        ],
      }
    }

    case 'urinary': {
      const { rap, affTone, effTone, oncotic } = inputs
      const calcGfr = (p: number) => {
        const autoFactor = p >= 80 && p <= 160 ? 1 + (p - 100) * 0.0018 : p < 80 ? p / 80 : 1.11 + (p - 160) * 0.009
        const pgc = clamp(55 * autoFactor * (1 / Math.sqrt(affTone)) * Math.pow(effTone, 0.35), 25, 85)
        const nfp = Math.max(0, pgc - 15 - oncotic)
        return { pgc, nfp, gfr: clamp(nfp * 8.0, 0, 180) }
      }
      const now = calcGfr(rap)
      const rbf = clamp(1100 * (rap / 100) / ((affTone + effTone) / 2), 300, 1800)
      const ff = clamp((now.gfr / (rbf * 0.55)) * 100, 0, 45)
      const curve: CurvePoint[] = []
      for (let p = 60; p <= 180; p += 4) curve.push({ x: p, y: round1(calcGfr(p).gfr) })
      const metrics: SystemMetricReadout[] = [
        { id: 'gfr', label: 'Simulated GFR', value: round1(now.gfr), unit: 'mL/min', refRange: '90–130', band: now.gfr < 60 ? 'strained' : now.gfr < 85 || now.gfr > 140 ? 'compensating' : 'homeostatic' },
        { id: 'nfp', label: 'Net Filtration P', value: round1(now.nfp), unit: 'mmHg', refRange: '10–18', band: now.nfp < 6 ? 'strained' : now.nfp < 10 || now.nfp > 22 ? 'compensating' : 'homeostatic' },
        { id: 'pgc', label: 'Glomerular PGC', value: round1(now.pgc), unit: 'mmHg', refRange: '48–60', band: now.pgc < 40 || now.pgc > 70 ? 'strained' : 'homeostatic' },
        { id: 'ff', label: 'Filtration Fraction', value: round1(ff), unit: '%', refRange: '16–24', band: ff < 12 || ff > 30 ? 'compensating' : 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [60, 180],
        yDomain: [0, 180],
        operatingPoint: { x: rap, y: round1(now.gfr) },
        series: [{ id: 'tgf-curve', label: 'GFR Autoregulation', color: spec.accent, points: curve }],
        couplings: [
          { targetSystemId: 'cardiovascular', targetLabel: 'Cardiovascular', direction: now.gfr < 80 ? 'up' : 'steady', mechanism: 'RAAS volume & arterial tone feedback' },
          { targetSystemId: 'respiratory', targetLabel: 'Respiratory', direction: now.gfr < 65 ? 'up' : 'steady', mechanism: 'Renal–respiratory bicarbonate acid–base loop' },
        ],
      }
    }

    case 'endocrine': {
      const { drive, pitGain, feedback } = inputs
      const pitSs = clamp((drive * pitGain) / (0.45 + 0.55 * feedback), 0.1, 4.0)
      const targetSs = clamp(pitSs * (1.15 / (0.35 + 0.65 * feedback)), 0.15, 3.8)
      const damping = round2(clamp(0.4 + feedback * 0.45, 0.3, 1.8))
      const pitSeries: CurvePoint[] = []
      const tgtSeries: CurvePoint[] = []
      for (let i = 0; i <= 48; i++) {
        const h = (i / 48) * 24
        const circ = 1 + 0.28 * Math.cos(((h - 7) / 24) * 2 * Math.PI)
        const pulse = 0.14 * Math.sin(h * 1.6) / damping
        pitSeries.push({ x: round1(h), y: round2(clamp(pitSs * (circ + pulse), 0.05, 4.2)) })
        tgtSeries.push({ x: round1(h), y: round2(clamp(targetSs * (1 + 0.18 * Math.cos(((h - 9) / 24) * 2 * Math.PI)), 0.05, 4.2)) })
      }
      const metrics: SystemMetricReadout[] = [
        { id: 'pit', label: 'Pituitary Index', value: round2(pitSs), unit: '× ref', refRange: '0.7–1.4', band: pitSs < 0.4 || pitSs > 2.4 ? 'strained' : pitSs < 0.7 || pitSs > 1.5 ? 'compensating' : 'homeostatic' },
        { id: 'tgt', label: 'Target Hormone', value: round2(targetSs), unit: '× ref', refRange: '0.75–1.35', band: targetSs < 0.45 || targetSs > 2.2 ? 'strained' : targetSs < 0.75 || targetSs > 1.4 ? 'compensating' : 'homeostatic' },
        { id: 'damp', label: 'Feedback Damping', value: damping, unit: 'ratio', refRange: '0.7–1.2', band: damping < 0.55 ? 'compensating' : 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [0, 24],
        yDomain: [0, 4.2],
        operatingPoint: { x: 8, y: round2(targetSs) },
        series: [
          { id: 'pit', label: 'Pituitary (TSH/ACTH)', color: '#5cd6ff', points: pitSeries },
          { id: 'tgt', label: 'Target (fT4/Cortisol)', color: spec.accent, points: tgtSeries },
        ],
        couplings: [
          { targetSystemId: 'cardiovascular', targetLabel: 'Cardiovascular', direction: targetSs > 1.4 ? 'up' : targetSs < 0.7 ? 'down' : 'steady', mechanism: 'Beta-adrenergic & metabolic rate drive' },
          { targetSystemId: 'musculoskeletal', targetLabel: 'Musculoskeletal', direction: targetSs > 1.6 ? 'down' : 'steady', mechanism: 'Bone remodelling & protein turnover signalling' },
        ],
      }
    }

    case 'reproductive': {
      const { cycleDay, gnrhFreq, fbGain } = inputs
      const lhAt = (d: number) => clamp((0.7 + 4.4 * Math.exp(-((d - 14) ** 2) / 2.2) * gnrhFreq * fbGain), 0.2, 6.0)
      const e2At = (d: number) => clamp((0.8 + 2.6 * Math.exp(-((d - 13) ** 2) / 9) + 1.1 * Math.exp(-((d - 21) ** 2) / 14)) * fbGain, 0.2, 5.2)
      const p4At = (d: number) => clamp((0.25 + 3.4 * Math.exp(-((d - 21) ** 2) / 16)) * Math.min(1.3, gnrhFreq), 0.1, 4.8)
      const lhCurve: CurvePoint[] = []
      const e2Curve: CurvePoint[] = []
      const p4Curve: CurvePoint[] = []
      for (let d = 1; d <= 28; d++) {
        lhCurve.push({ x: d, y: round2(lhAt(d)) })
        e2Curve.push({ x: d, y: round2(e2At(d)) })
        p4Curve.push({ x: d, y: round2(p4At(d)) })
      }
      const lhNow = round2(lhAt(cycleDay))
      const e2Now = round2(e2At(cycleDay))
      const p4Now = round2(p4At(cycleDay))
      const phaseCode = cycleDay <= 5 ? 1 : cycleDay <= 13 ? 2 : cycleDay <= 15 ? 3 : 4
      const metrics: SystemMetricReadout[] = [
        { id: 'lh', label: 'LH Index', value: lhNow, unit: '× ref', refRange: '0.6–5.2', band: gnrhFreq < 0.6 ? 'compensating' : 'homeostatic' },
        { id: 'e2', label: 'Estradiol Index', value: e2Now, unit: '× ref', refRange: '0.6–3.8', band: e2Now < 0.4 ? 'compensating' : 'homeostatic' },
        { id: 'p4', label: 'Progesterone Index', value: p4Now, unit: '× ref', refRange: '0.2–3.8', band: 'homeostatic' },
        { id: 'phase', label: 'Cycle Phase (1–4)', value: phaseCode, unit: 'stage', refRange: '1=M · 2=F · 3=O · 4=L', band: 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [1, 28],
        yDomain: [0, 6.0],
        operatingPoint: { x: cycleDay, y: lhNow },
        series: [
          { id: 'lh', label: 'LH Surge', color: spec.accent, points: lhCurve },
          { id: 'e2', label: 'Estradiol', color: '#5cd6ff', points: e2Curve },
          { id: 'p4', label: 'Progesterone', color: '#5ff2a7', points: p4Curve },
        ],
        couplings: [
          { targetSystemId: 'endocrine', targetLabel: 'Endocrine', direction: gnrhFreq < 0.6 ? 'down' : 'steady', mechanism: 'Hypothalamic GnRH–HPA cross-talk' },
          { targetSystemId: 'musculoskeletal', targetLabel: 'Musculoskeletal', direction: e2Now < 0.5 ? 'down' : 'steady', mechanism: 'Sex-steroid bone remodelling balance' },
        ],
      }
    }

    case 'lymphatic-immune': {
      const { pc, pic, pump } = inputs
      const filtAt = (p: number) => clamp(0.18 * ((p - 1) - 0.85 * (pic - 8)), -1.0, 6.0)
      const jv = filtAt(pc)
      const cap = 2.6 * pump
      const margin = cap - Math.max(0, jv)
      const filtCurve: CurvePoint[] = []
      const capCurve: CurvePoint[] = []
      for (let p = 15; p <= 40; p++) {
        filtCurve.push({ x: p, y: round2(Math.max(0, filtAt(p))) })
        capCurve.push({ x: p, y: round2(cap) })
      }
      const metrics: SystemMetricReadout[] = [
        { id: 'jv', label: 'Capillary Filtration Jv', value: round2(Math.max(0, jv)), unit: 'mL/min', refRange: '0.5–2.2', band: jv > cap ? 'strained' : jv > cap * 0.8 ? 'compensating' : 'homeostatic' },
        { id: 'cap', label: 'Lymphatic Clearance', value: round2(cap), unit: 'mL/min', refRange: '2.0–4.5', band: cap < 1.5 ? 'strained' : 'homeostatic' },
        { id: 'margin', label: 'Edema Safety Margin', value: round2(margin), unit: 'mL/min', refRange: '> +0.5', band: margin < 0 ? 'strained' : margin < 0.5 ? 'compensating' : 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [15, 40],
        yDomain: [0, 6.5],
        operatingPoint: { x: pc, y: round2(Math.max(0, jv)) },
        series: [
          { id: 'jv', label: 'Starling Filtration Jv', color: '#ffb547', points: filtCurve },
          { id: 'lymph', label: 'Lymphatic Capacity', color: spec.accent, points: capCurve },
        ],
        couplings: [
          { targetSystemId: 'cardiovascular', targetLabel: 'Cardiovascular', direction: margin < 0 ? 'down' : 'steady', mechanism: 'Interstitial fluid sequestration vs plasma volume' },
          { targetSystemId: 'digestive', targetLabel: 'Digestive', direction: pump < 0.7 ? 'down' : 'steady', mechanism: 'Mesenteric chylomicron drainage' },
        ],
      }
    }

    case 'musculoskeletal': {
      const { sarcomere, loadPct, freqHz } = inputs
      const tensionAt = (L: number) => {
        if (L <= 1.27 || L >= 3.65) return 0
        if (L < 2.0) return clamp(((L - 1.27) / 0.73) * 100, 0, 100)
        if (L <= 2.25) return 100
        return clamp(((3.65 - L) / 1.4) * 100, 0, 100)
      }
      const tetany = clamp(1 - Math.exp(-freqHz / 22), 0.15, 1.0)
      const activeTension = round1(tensionAt(sarcomere) * tetany)
      const fRatio = loadPct / 100
      const velPct = round1(clamp(((1 - fRatio) / (1 + 4 * fRatio)) * 100, 0, 100))
      const powerIdx = round1((fRatio * velPct * (activeTension / 100)))
      const curve: CurvePoint[] = []
      for (let i = 0; i <= 44; i++) {
        const L = 1.4 + (i / 44) * 2.2
        curve.push({ x: round2(L), y: round1(tensionAt(L) * tetany) })
      }
      const metrics: SystemMetricReadout[] = [
        { id: 'tension', label: 'Active Tension', value: activeTension, unit: '% Fmax', refRange: '70–100 (optimal)', band: activeTension < 40 ? 'strained' : activeTension < 70 ? 'compensating' : 'homeostatic' },
        { id: 'vel', label: 'Hill Velocity', value: velPct, unit: '% Vmax', refRange: '20–75', band: 'homeostatic' },
        { id: 'power', label: 'Mechanical Power', value: powerIdx, unit: 'idx', refRange: 'Peak ~12–20', band: 'homeostatic' },
        { id: 'tetany', label: 'Ca²⁺ Summation', value: round1(tetany * 100), unit: '%', refRange: '60–100', band: 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [1.4, 3.6],
        yDomain: [0, 105],
        operatingPoint: { x: round2(sarcomere), y: activeTension },
        series: [{ id: 'len-tens', label: 'Sarcomere Length–Tension', color: spec.accent, points: curve }],
        couplings: [
          { targetSystemId: 'cardiovascular', targetLabel: 'Cardiovascular', direction: powerIdx > 10 ? 'up' : 'steady', mechanism: 'Exercise hyperemia & venous muscle pump' },
          { targetSystemId: 'respiratory', targetLabel: 'Respiratory', direction: powerIdx > 10 ? 'up' : 'steady', mechanism: 'Metabolic O₂ demand & CO₂ production' },
        ],
      }
    }

    case 'sensory-ent': {
      const { freqHz, spl, luxLog } = inputs
      // Greenwood inverse: x = log10(f / 165.4 + 0.88) / 2.1 (0=apex low freq, 1=base high freq)
      const place = clamp(Math.log10(freqHz / 165.4 + 0.88) / 2.1, 0.02, 0.98)
      const ohcGainDb = round1(clamp(45 * Math.exp(-Math.max(0, spl - 30) / 38), 4, 48))
      const retinalShift = round2(clamp(luxLog * 0.85, 0, 5.5))
      const envelope: CurvePoint[] = []
      for (let i = 0; i <= 50; i++) {
        const x = i / 50
        const sigma = x > place ? 0.045 : 0.11
        const amp = Math.exp(-((x - place) ** 2) / (2 * sigma * sigma)) * (0.35 + 0.65 * (spl / 110))
        envelope.push({ x: round2(x), y: round2(amp) })
      }
      const metrics: SystemMetricReadout[] = [
        { id: 'place', label: 'Cochlear Place', value: round1(place * 100), unit: '% base', refRange: '0=Apex · 100=Base', band: 'homeostatic' },
        { id: 'gain', label: 'Hair-Cell Gain', value: ohcGainDb, unit: 'dB', refRange: '10–45', band: spl > 95 ? 'strained' : spl > 85 ? 'compensating' : 'homeostatic' },
        { id: 'spl', label: 'Acoustic Load', value: round1(spl), unit: 'dB SPL', refRange: '< 80 safe', band: spl > 95 ? 'strained' : spl > 80 ? 'compensating' : 'homeostatic' },
        { id: 'ret', label: 'Retinal Adapt Shift', value: retinalShift, unit: 'log units', refRange: '0–5.2', band: 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [0, 1],
        yDomain: [0, 1.1],
        operatingPoint: { x: round2(place), y: round2(0.35 + 0.65 * (spl / 110)) },
        series: [{ id: 'cochlea', label: 'Basilar Traveling Wave', color: spec.accent, points: envelope }],
        couplings: [
          { targetSystemId: 'nervous', targetLabel: 'Nervous', direction: spl > 85 ? 'up' : 'steady', mechanism: 'CN VIII auditory & CN II visual cortical relay' },
        ],
      }
    }

    case 'integumentary-surface': {
      const { ambientC, humidity, barrier, coreDelta } = inputs
      const tewl = clamp((100 - humidity) * 0.24 * (100 / barrier), 2, 65)
      const skinFlowAt = (tAmb: number) => clamp(0.25 + Math.max(0, (tAmb - 22) * 0.085) + Math.max(0, coreDelta * 1.4), 0.12, 4.5)
      const skinFlow = skinFlowAt(ambientC)
      const evapW = round1(clamp((100 - humidity) * 1.6 * (0.4 + Math.max(0, coreDelta) * 1.1), 10, 320))
      const curve: CurvePoint[] = []
      for (let t = 5; t <= 45; t += 2) curve.push({ x: t, y: round2(skinFlowAt(t)) })
      const metrics: SystemMetricReadout[] = [
        { id: 'tewl', label: 'Epidermal TEWL', value: round1(tewl), unit: 'g/m²/h', refRange: '5–18 intact', band: tewl > 30 ? 'strained' : tewl > 20 ? 'compensating' : 'homeostatic' },
        { id: 'qskin', label: 'Cutaneous Blood Flow', value: round2(skinFlow), unit: 'L/min', refRange: '0.2–0.6 rest', band: skinFlow > 2.5 ? 'strained' : skinFlow > 1.2 ? 'compensating' : 'homeostatic' },
        { id: 'evap', label: 'Evaporative Cooling', value: evapW, unit: 'W', refRange: '20–240', band: ambientC > 36 && humidity > 75 ? 'strained' : 'homeostatic' },
        { id: 'bar', label: 'Barrier Integrity', value: round1(barrier), unit: '%', refRange: '80–100', band: barrier < 55 ? 'strained' : barrier < 75 ? 'compensating' : 'homeostatic' },
      ]
      return {
        ...base,
        metrics,
        overallBand: worstBand(metrics),
        xDomain: [5, 45],
        yDomain: [0, 4.6],
        operatingPoint: { x: ambientC, y: round2(skinFlow) },
        series: [{ id: 'skin-flow', label: 'Cutaneous Flow vs Temp', color: spec.accent, points: curve }],
        couplings: [
          { targetSystemId: 'cardiovascular', targetLabel: 'Cardiovascular', direction: skinFlow > 1.2 ? 'up' : 'steady', mechanism: 'Cutaneous vasodilation lowers SVR & shifts CO' },
          { targetSystemId: 'urinary', targetLabel: 'Urinary', direction: tewl > 22 ? 'down' : 'steady', mechanism: 'Insensible water loss triggers renal conservation' },
        ],
      }
    }
  }
}

export function evaluateAll11Systems(
  presetId: WholeBodyPresetId = 'rest',
): readonly WholeBodySystemSimulationResult[] {
  const preset = WHOLE_BODY_PRESETS.find((p) => p.id === presetId) ?? WHOLE_BODY_PRESETS[0]
  return WHOLE_BODY_11_SPECS.map((spec) => {
    const res = evaluateWholeBodySystem(spec.systemId, preset.params[spec.systemId], preset.label)
    if (!res.ok) throw new Error(`Preset evaluation failed for ${spec.systemId}: ${res.reason}`)
    return res
  })
}
