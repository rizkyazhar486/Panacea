/**
 * Pure deterministic BodyExposure Unified 5-Scale Graph Engine.
 *
 * Connects the 10 flagship anatomical regions in 3D BodyExposure deterministically to:
 * 1) 5-Scale Zoom Contract (Macro 3D 1.7m -> Organ -> Tissue/Fascia/CAD-CAE -> Cell/EP -> Molecular/CPIC 2nm)
 * 2) Synchronized Hippocratic Dual-Lens Education (plain_universal / patient_partner / clinician_brief)
 * 3) 3-Phase Health Continuum Binding (before_illness / during_illness / after_illness)
 *
 * Domain Purity Invariant:
 * - Zero DOM, Three.js WebGL context, storage, clock, RNG, or network calls.
 * - Explicit `truthClass` and `clinicallyReviewed: false`.
 */
import type { BodySystemId } from './data/bodySystems.ts'
import {
  translateHippocraticBridge,
  type HippocraticBridgeResult,
} from '../education/hippocraticBridgeEngine.ts'

export type UnifiedBodyRegionId =
  | 'brain'
  | 'heart'
  | 'lungs'
  | 'liver'
  | 'kidneys'
  | 'musculoskeletal'
  | 'fascia_feet_to_face'
  | 'skin_face'
  | 'gut_metabolic'
  | 'vascular'

export interface ScaleZoomStop {
  readonly scaleId: 'macro_3d' | 'organ' | 'tissue_cae' | 'cellular_ep' | 'molecular_cpic'
  readonly label: string
  readonly scaleMeters: string
  readonly headline: string
  readonly engineRef: string
}

export interface UnifiedRegionGraphSpec {
  readonly id: UnifiedBodyRegionId
  readonly label: string
  readonly bodySystemId: BodySystemId
  readonly icd10Anchor: string
  readonly icd11Anchor: string
  readonly loincAnchors: readonly string[]
  readonly defaultTopicTitle: string
  readonly tissueEngineRef: string
  readonly cellEngineRef: string
  readonly molecularRef: string
  readonly beforeHook: string
  readonly duringHook: string
  readonly afterHook: string
}

export interface UnifiedBodyRegionResolution {
  readonly ok: true
  readonly region: UnifiedRegionGraphSpec
  readonly scales: readonly [ScaleZoomStop, ScaleZoomStop, ScaleZoomStop, ScaleZoomStop, ScaleZoomStop]
  readonly lenses: HippocraticBridgeResult
  readonly continuum: {
    readonly before_illness: string
    readonly during_illness: string
    readonly after_illness: string
  }
  readonly truthClass: 'measured' | 'estimated' | 'curated_physiology'
  readonly clinicallyReviewed: false
  readonly epistemicNotice: string
}

export type UnifiedBodyRegionResult =
  | UnifiedBodyRegionResolution
  | { readonly ok: false; readonly error: string }

export const UNIFIED_BODY_REGIONS: readonly UnifiedRegionGraphSpec[] = Object.freeze([
  {
    id: 'brain',
    label: 'Brain & Neuro',
    bodySystemId: 'nervous',
    icd10Anchor: 'G47.33 / F06',
    icd11Anchor: '7A41 / 8E7Y',
    loincAnchors: ['93832-4', '72107-6'],
    defaultTopicTitle: 'Cerebral Cortex & Sleep Airway Regulation',
    tissueEngineRef: 'Neural tract localization & airway caliber',
    cellEngineRef: 'qEEG spectral power & action-potential excitability',
    molecularRef: 'BDNF neuroplasticity & CYP2C19 CNS pharmacogenomics',
    beforeHook: 'Protect 7.5–8.5h sleep consistency & monitor morning alertness.',
    duringHook: 'FAST stroke signs or SpO2 < 90% triggers urgent ER/PSG escalation.',
    afterHook: 'Track cognitive reaction recovery & nocturnal AHI improvement.',
  },
  {
    id: 'heart',
    label: 'Heart',
    bodySystemId: 'cardiovascular',
    icd10Anchor: 'I10 / I49',
    icd11Anchor: 'BA00 / BC81',
    loincAnchors: ['8867-4', '80404-7', '8480-6'],
    defaultTopicTitle: 'Cardiac Pump & Autonomic HRV Balance',
    tissueEngineRef: 'Wiggers ventricular pressure-volume & AHA-17 coronary territory',
    cellEngineRef: 'Myocyte electrophysiology & depolarization timing',
    molecularRef: 'CYP2C19 clopidogrel & SLCO1B1 statin safety (CPIC)',
    beforeHook: 'Zone-2 endurance & resting HR / HRV baseline trend.',
    duringHook: 'Chest pain or SBP >= 180 mmHg triggers Ke IGD Sekarang alert.',
    afterHook: 'Gradual post-episode HRR-1 stabilization & clinician follow-up.',
  },
  {
    id: 'lungs',
    label: 'Lungs',
    bodySystemId: 'respiratory',
    icd10Anchor: 'J45 / J18',
    icd11Anchor: 'CA23 / CA40',
    loincAnchors: ['2708-6', '19926-5'],
    defaultTopicTitle: 'Alveolar Oxygen Exchange & Ventilation',
    tissueEngineRef: 'Bronchial tree ventilation & thoracic cage recoil',
    cellEngineRef: 'Alveolar-capillary Krogh O2 diffusion & surfactant barrier',
    molecularRef: 'Beta-2 adrenergic receptor & leukotriene inflammation signaling',
    beforeHook: 'VO2max reserve & clean air exposure tracking.',
    duringHook: 'SpO2 < 90% or severe dyspnea requires immediate ER triage.',
    afterHook: 'Progressive walking tolerance & nocturnal SpO2 normalization.',
  },
  {
    id: 'liver',
    label: 'Liver',
    bodySystemId: 'digestive',
    icd10Anchor: 'K76.0',
    icd11Anchor: 'DB92',
    loincAnchors: ['1742-6', '1920-8'],
    defaultTopicTitle: 'Hepatic Metabolic Clearance & Bile Synthesis',
    tissueEngineRef: 'Portal-biliary vascular architecture & Couinaud segments',
    cellEngineRef: 'Hepatocyte mitochondria beta-oxidation & autophagy',
    molecularRef: 'CYP450 Phase I/II enzyme pathways (CPIC gene-drug clearance)',
    beforeHook: 'Balanced nutrition, waist-to-height control, & low alcohol load.',
    duringHook: 'Review AST/ALT trends and avoid hepatotoxic unprescribed herbs.',
    afterHook: 'Track liver enzyme normalization and metabolic insulin sensitivity.',
  },
  {
    id: 'kidneys',
    label: 'Kidneys',
    bodySystemId: 'urinary',
    icd10Anchor: 'N18',
    icd11Anchor: 'GB61',
    loincAnchors: ['2160-0', '33914-3'],
    defaultTopicTitle: 'Renal Filtration & Fluid-Electrolyte Balance',
    tissueEngineRef: 'Renal autoregulation & medullary vascular flow',
    cellEngineRef: 'Nephron glomerular filtration barrier & tubular reabsorption',
    molecularRef: 'RAAS electrolyte signaling & renal transporter kinetics',
    beforeHook: 'Steady hydration & home blood pressure control.',
    duringHook: 'Avoid unsupervised NSAIDs when creatinine/eGFR is abnormal.',
    afterHook: 'Repeat eGFR / urine albumin checks with physician review.',
  },
  {
    id: 'musculoskeletal',
    label: 'Muscles & Joints',
    bodySystemId: 'musculoskeletal',
    icd10Anchor: 'M54 / M25',
    icd11Anchor: 'ME84',
    loincAnchors: ['41950-7', '55423-8'],
    defaultTopicTitle: 'Skeletal Muscle Mass & Joint Load Mechanics',
    tissueEngineRef: 'Parametric CAD proportions & CAE knee/hip compressive load',
    cellEngineRef: 'Sarcomere protein turnover & mitochondrial oxidative capacity',
    molecularRef: 'mTOR / AMPK resistance adaptation & collagen remodeling',
    beforeHook: 'Progressive 2x/week strength training & bilateral symmetry.',
    duringHook: 'Use Ottawa/joint rules to separate sprain from urgent fracture.',
    afterHook: 'Track bilateral recovery & Repeated-Measures ANOVA gains.',
  },
  {
    id: 'fascia_feet_to_face',
    label: 'Fascia Chain',
    bodySystemId: 'musculoskeletal',
    icd10Anchor: 'M62.8',
    icd11Anchor: 'FB54',
    loincAnchors: ['89576-3'],
    defaultTopicTitle: 'Feet-to-Face Myofascial Posture & Soft-Tissue Tension',
    tissueEngineRef: '7-node Superficial Front Line + Plantar Windlass Tripod',
    cellEngineRef: 'Fibroblast mechanotransduction & extracellular matrix glide',
    molecularRef: 'Collagen cross-link hydration (soft tissue only, non-osteogenic)',
    beforeHook: 'Daily barefoot arch grounding, thoracic rotation & nasal breathing.',
    duringHook: 'Address acute neck/jaw myofascial overload calmly without force.',
    afterHook: 'Measure posture alignment % progression safely over weeks.',
  },
  {
    id: 'skin_face',
    label: 'Skin',
    bodySystemId: 'integumentary-surface',
    icd10Anchor: 'L81 / L98',
    icd11Anchor: 'ED60',
    loincAnchors: ['72853-5'],
    defaultTopicTitle: 'Integument Barrier & Visible Surface Uniformity',
    tissueEngineRef: 'Optical luminance/texture surface proxy (visible facts only)',
    cellEngineRef: 'Epidermal keratinocyte turnover & lipid barrier cohesion',
    molecularRef: 'Melanin/collagen photoprotection & systemic hs-CRP modulation',
    beforeHook: 'Daily UV protection, barrier hydration & restorative sleep.',
    duringHook: 'Any asymmetrical/changing lesion requires direct dermatologist exam.',
    afterHook: 'Compare consistent lighting ROI tone/barrier scores over months.',
  },
  {
    id: 'gut_metabolic',
    label: 'Gut & Metabolism',
    bodySystemId: 'endocrine',
    icd10Anchor: 'E11 / E78',
    icd11Anchor: '5A11 / 5C80',
    loincAnchors: ['4548-4', '1558-6'],
    defaultTopicTitle: 'Glycemic Regulation & Cardiometabolic Reserve',
    tissueEngineRef: 'Visceral adipose distribution & postprandial enterohepatic flow',
    cellEngineRef: 'Beta-cell insulin secretion & skeletal GLUT4 uptake',
    molecularRef: 'AMPK sensitivity, HbA1c glycation & systemic inflammation',
    beforeHook: 'Protein-first balanced meals & post-meal 15-minute walks.',
    duringHook: 'Monitor fasting glucose/HbA1c calmly with physician plan.',
    afterHook: 'Track waist-to-height & metabolic risk counterfactual improvement.',
  },
  {
    id: 'vascular',
    label: 'Blood Vessels',
    bodySystemId: 'cardiovascular',
    icd10Anchor: 'I10 / I70',
    icd11Anchor: 'BA00 / BD40',
    loincAnchors: ['8480-6', '8462-4', '30522-7'],
    defaultTopicTitle: 'Arterial Compliance & Endothelial Wall Shear',
    tissueEngineRef: 'Pulse-wave arterial compliance & Poiseuille wall shear proxy',
    cellEngineRef: 'Vascular endothelial nitric-oxide mechanosensing',
    molecularRef: 'hs-CRP vascular inflammation & ApoB lipid deposition balance',
    beforeHook: 'Aerobic Zone-2 sessions keep arterial wall shear adaptive.',
    duringHook: 'Systolic >= 180 mmHg or neuro deficit escalates to ER now.',
    afterHook: 'Sustain blood pressure log & clinician lipid/CRP review.',
  },
])

export function resolveBodyExposureRegionNode(
  regionId: UnifiedBodyRegionId | string,
  options?: {
    readonly language?: 'id' | 'en'
    readonly spo2Pct?: number | null
    readonly systolicMmHg?: number | null
    readonly symptomSummary?: string
  },
): UnifiedBodyRegionResult {
  const region = UNIFIED_BODY_REGIONS.find((r) => r.id === regionId)
  if (!region) {
    return { ok: false, error: `Unknown BodyExposure unified region "${String(regionId)}".` }
  }

  const scales: readonly [ScaleZoomStop, ScaleZoomStop, ScaleZoomStop, ScaleZoomStop, ScaleZoomStop] = [
    {
      scaleId: 'macro_3d',
      label: 'Macro 3D',
      scaleMeters: '1.7 m',
      headline: `${region.label} position on full-body Z-Anatomy rig`,
      engineRef: `bodySystemId=${region.bodySystemId}`,
    },
    {
      scaleId: 'organ',
      label: 'Organ',
      scaleMeters: '10⁻¹ m',
      headline: region.defaultTopicTitle,
      engineRef: `${region.icd10Anchor} (${region.icd11Anchor})`,
    },
    {
      scaleId: 'tissue_cae',
      label: 'Tissue / CAE',
      scaleMeters: '10⁻³ m',
      headline: region.tissueEngineRef,
      engineRef: 'biomedicalCadCaeEngine / fasciaKineticChainEngine',
    },
    {
      scaleId: 'cellular_ep',
      label: 'Cellular',
      scaleMeters: '10⁻⁵ m',
      headline: region.cellEngineRef,
      engineRef: 'brainAndOsaEngine / multiscale physiology kernel',
    },
    {
      scaleId: 'molecular_cpic',
      label: 'Molecular / CPIC',
      scaleMeters: '2 nm',
      headline: region.molecularRef,
      engineRef: 'CPIC pharmacogenomics & inflammatory markers',
    },
  ]

  const lenses = translateHippocraticBridge({
    topicTitle: region.label,
    language: options?.language ?? 'id',
    symptomSummary: options?.symptomSummary,
    icd10: region.icd10Anchor,
    icd11: region.icd11Anchor,
    loincCodes: region.loincAnchors,
    carePlan: region.beforeHook,
    spo2Pct: options?.spo2Pct,
    systolicMmHg: options?.systolicMmHg,
    consentConfirmed: true,
    scopeId: `body-exposure:${region.id}`,
  })

  const hasMeasured =
    typeof options?.spo2Pct === 'number' || typeof options?.systolicMmHg === 'number'

  return {
    ok: true,
    region,
    scales,
    lenses,
    continuum: {
      before_illness: region.beforeHook,
      during_illness: region.duringHook,
      after_illness: region.afterHook,
    },
    truthClass: hasMeasured ? 'measured' : 'curated_physiology',
    clinicallyReviewed: false,
    epistemicNotice:
      'BodyExposure multiscale graph links anatomy, physiology, CAD/CAE proxies, and educational lenses (clinically_reviewed=false). Not a medical diagnosis.',
  }
}
