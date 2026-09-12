import type { KnowledgeScale } from './multisystemKnowledgeGraph.ts'

export type PhysiologyRepresentation =
  | 'anatomy-overlay'
  | 'flow-field'
  | 'cross-section'
  | 'histology'
  | 'cellular'
  | 'network'
  | 'timeline'

export interface PhysiologyMechanismStep {
  id: string
  order: number
  scale: KnowledgeScale
  title: string
  structures: readonly string[]
  mechanism: string
  representation: PhysiologyRepresentation
}

export interface PathophysiologyAtlasModule {
  id: string
  label: string
  domainIds: readonly string[]
  summary: string
  steps: readonly PhysiologyMechanismStep[]
  educationalOnly: true
  patientSpecificInference: false
  diagnosisOrTreatment: false
  academicAccuracyGateRequiredForClinicalUse: true
  qualifiedHumanReviewRequired: true
}

const boundary = {
  educationalOnly: true,
  patientSpecificInference: false,
  diagnosisOrTreatment: false,
  academicAccuracyGateRequiredForClinicalUse: true,
  qualifiedHumanReviewRequired: true,
} as const

export const BODY_PHYSIOLOGY_PATHOPHYSIOLOGY_ATLAS: readonly PathophysiologyAtlasModule[] = [
  {
    id: 'atherosclerosis',
    label: 'Atherosclerosis',
    domainIds: ['cardiovascular', 'hematologic-immune-lymphatic', 'cell-molecular-genomics'],
    summary: 'Educational artery-wall sequence from local flow context through endothelial dysfunction, apoB-particle retention, inflammation, plaque remodeling, and possible thrombosis.',
    steps: [
      { id: 'athero-flow', order: 1, scale: 'organ', title: 'Local arterial flow context', structures: ['arterial lumen', 'branch point'], mechanism: 'Complex flow and wall-shear context can influence endothelial biology; atlas streamlines remain illustrative rather than patient measurements.', representation: 'flow-field' },
      { id: 'athero-endothelium', order: 2, scale: 'cell', title: 'Endothelial dysfunction', structures: ['endothelium', 'glycocalyx'], mechanism: 'Barrier and signaling changes can favor leukocyte adhesion and lipoprotein entry into the arterial wall.', representation: 'cellular' },
      { id: 'athero-intima', order: 3, scale: 'molecular-pathway', title: 'Intimal lipid retention and inflammation', structures: ['tunica intima', 'apoB-containing lipoproteins', 'macrophages'], mechanism: 'Retained atherogenic particles and inflammatory signaling contribute to foam-cell formation and plaque growth.', representation: 'cross-section' },
      { id: 'athero-thrombosis', order: 4, scale: 'molecular-pathway', title: 'Plaque disruption and thrombosis', structures: ['plaque surface', 'platelets', 'fibrin'], mechanism: 'Exposure of thrombogenic plaque material can trigger platelet activation and coagulation with downstream ischemic consequences.', representation: 'timeline' },
    ],
    ...boundary,
  },
  {
    id: 'ischemic-stroke',
    label: 'Ischemic stroke',
    domainIds: ['nervous-system', 'cardiovascular', 'hematologic-immune-lymphatic'],
    summary: 'Educational neurovascular chain from arterial occlusion through collateral-dependent perfusion loss, cellular energy failure, and evolving tissue injury.',
    steps: [
      { id: 'stroke-occlusion', order: 1, scale: 'organ', title: 'Arterial occlusion', structures: ['intracranial artery', 'thrombus'], mechanism: 'Arterial obstruction can reduce downstream cerebral perfusion; a generic atlas must not infer an individual patient deficit.', representation: 'anatomy-overlay' },
      { id: 'stroke-collateral', order: 2, scale: 'tissue', title: 'Collateral perfusion context', structures: ['circle of Willis', 'leptomeningeal collaterals', 'microcirculation'], mechanism: 'Collateral pathways may partially sustain threatened tissue, but atlas appearance is not a perfusion measurement.', representation: 'flow-field' },
      { id: 'stroke-energy', order: 3, scale: 'organelle', title: 'Energy failure', structures: ['neuron', 'astrocyte', 'mitochondrion'], mechanism: 'Reduced oxygen and substrate delivery can impair oxidative phosphorylation and ionic homeostasis.', representation: 'cellular' },
      { id: 'stroke-injury', order: 4, scale: 'molecular-pathway', title: 'Excitotoxic and inflammatory injury', structures: ['synapse', 'calcium signaling', 'neurovascular unit'], mechanism: 'Excitotoxic, oxidative, inflammatory, and barrier processes can interact during evolving ischemic injury.', representation: 'network' },
    ],
    ...boundary,
  },
  {
    id: 'intracerebral-hemorrhage',
    label: 'Intracerebral hemorrhage',
    domainIds: ['nervous-system', 'cardiovascular'],
    summary: 'Educational sequence from vessel-wall failure to hematoma formation, local mass effect, perihematomal injury, edema, and altered intracranial pressure.',
    steps: [
      { id: 'ich-rupture', order: 1, scale: 'tissue', title: 'Vessel-wall failure', structures: ['cerebral vessel wall', 'perivascular tissue'], mechanism: 'Loss of vascular integrity allows blood to enter brain parenchyma.', representation: 'cross-section' },
      { id: 'ich-hematoma', order: 2, scale: 'tissue', title: 'Hematoma and displacement', structures: ['hematoma', 'brain parenchyma'], mechanism: 'Extravasated blood occupies intracranial volume and can displace adjacent tissue.', representation: 'timeline' },
      { id: 'ich-secondary', order: 3, scale: 'cell', title: 'Secondary tissue injury', structures: ['microvessels', 'glia', 'neurons'], mechanism: 'Compression, blood products, inflammation, and edema may contribute to perihematomal injury.', representation: 'cellular' },
      { id: 'ich-pressure', order: 4, scale: 'organ', title: 'Intracranial pressure context', structures: ['cranial vault', 'brain', 'CSF spaces'], mechanism: 'Increasing intracranial volume can alter pressure and cerebral perfusion; atlas visualization is not a patient-specific pressure estimate.', representation: 'anatomy-overlay' },
    ],
    ...boundary,
  },
  {
    id: 'heart-failure',
    label: 'Heart failure',
    domainIds: ['cardiovascular', 'respiratory', 'renal-urinary', 'endocrine'],
    summary: 'Educational multiorgan chain linking impaired ventricular performance or filling to congestion, altered perfusion, renal responses, and neurohumoral remodeling.',
    steps: [
      { id: 'hf-pump', order: 1, scale: 'organ', title: 'Pump or filling impairment', structures: ['ventricle', 'myocardium', 'valves'], mechanism: 'Impaired contraction, filling, loading, or combinations can reduce effective cardiac performance.', representation: 'anatomy-overlay' },
      { id: 'hf-congestion', order: 2, scale: 'system', title: 'Pressure redistribution and congestion', structures: ['atria', 'pulmonary veins', 'systemic veins'], mechanism: 'Elevated filling pressures can transmit upstream into pulmonary or systemic venous compartments.', representation: 'flow-field' },
      { id: 'hf-pulmonary', order: 3, scale: 'tissue', title: 'Pulmonary fluid accumulation', structures: ['pulmonary capillary', 'interstitium', 'alveolus'], mechanism: 'Elevated pulmonary microvascular hydrostatic pressure can favor interstitial and alveolar fluid accumulation.', representation: 'cross-section' },
      { id: 'hf-neurohumoral', order: 4, scale: 'endocrine-signal', title: 'Neurohumoral responses', structures: ['autonomic pathways', 'kidney', 'RAAS signaling'], mechanism: 'Compensatory sympathetic and renin-angiotensin-aldosterone signaling may support short-term perfusion while contributing to chronic remodeling.', representation: 'network' },
    ],
    ...boundary,
  },
  {
    id: 'deep-vein-thrombosis',
    label: 'Deep vein thrombosis',
    domainIds: ['cardiovascular', 'hematologic-immune-lymphatic'],
    summary: 'Educational venous thrombosis model organized around stasis, endothelial/vessel-wall context, hypercoagulability, clot propagation, and possible embolization.',
    steps: [
      { id: 'dvt-stasis', order: 1, scale: 'organ', title: 'Venous stasis', structures: ['deep vein', 'venous valve'], mechanism: 'Reduced venous flow can favor local thrombus formation in susceptible contexts.', representation: 'flow-field' },
      { id: 'dvt-coagulation', order: 2, scale: 'molecular-pathway', title: 'Coagulation and thrombus growth', structures: ['coagulation network', 'fibrin', 'blood cells'], mechanism: 'Procoagulant conditions can shift thrombin and fibrin generation toward clot propagation.', representation: 'network' },
      { id: 'dvt-propagation', order: 3, scale: 'tissue', title: 'Venous thrombus propagation', structures: ['venous lumen', 'thrombus'], mechanism: 'A venous thrombus may extend along the vessel; the model is educational and not a prediction for an individual patient.', representation: 'timeline' },
      { id: 'dvt-embolization', order: 4, scale: 'system', title: 'Potential embolic pathway', structures: ['vena cava', 'right heart', 'pulmonary arteries'], mechanism: 'Detached thrombotic material can travel through the right heart toward the pulmonary circulation.', representation: 'anatomy-overlay' },
    ],
    ...boundary,
  },
  {
    id: 'coronary-artery-disease',
    label: 'Coronary artery disease',
    domainIds: ['cardiovascular', 'cell-molecular-genomics'],
    summary: 'Educational coronary chain from epicardial atherosclerotic disease and flow limitation through myocardial oxygen supply-demand imbalance and cellular energy stress.',
    steps: [
      { id: 'cad-coronary', order: 1, scale: 'organ', title: 'Coronary arterial disease', structures: ['coronary artery', 'atherosclerotic plaque'], mechanism: 'Atherosclerotic plaque can alter coronary lumen geometry and vasomotor behavior.', representation: 'anatomy-overlay' },
      { id: 'cad-flow', order: 2, scale: 'system', title: 'Coronary flow limitation', structures: ['epicardial coronary artery', 'microcirculation'], mechanism: 'Flow reserve can become inadequate relative to myocardial demand; atlas flow is conceptual rather than measured.', representation: 'flow-field' },
      { id: 'cad-myocardium', order: 3, scale: 'tissue', title: 'Myocardial oxygen imbalance', structures: ['myocardium', 'capillary bed'], mechanism: 'Insufficient oxygen delivery relative to demand can produce reversible or irreversible myocardial injury depending on severity and duration.', representation: 'cross-section' },
      { id: 'cad-cell', order: 4, scale: 'organelle', title: 'Cardiomyocyte energy stress', structures: ['cardiomyocyte', 'mitochondrion'], mechanism: 'Reduced oxidative metabolism can impair ATP-dependent cellular processes and contractile performance.', representation: 'cellular' },
    ],
    ...boundary,
  },
] as const

export function getBodyPathophysiologyModule(id: string) {
  return BODY_PHYSIOLOGY_PATHOPHYSIOLOGY_ATLAS.find((module) => module.id === id)
}
