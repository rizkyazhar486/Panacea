import type { KnowledgeScale } from './multisystemKnowledgeGraph.ts'

export type PhysiologyLayer =
  | 'whole-body'
  | 'organ-system'
  | 'vascular-territory'
  | 'named-vessel'
  | 'lumen-blood'
  | 'endothelium'
  | 'tunica-intima'
  | 'tunica-media'
  | 'tunica-adventitia'
  | 'microcirculation'
  | 'tissue'
  | 'cell'
  | 'organelle'
  | 'molecular-pathway'

export type MechanismKind =
  | 'flow'
  | 'pressure'
  | 'shear'
  | 'oxygen-delivery'
  | 'barrier'
  | 'inflammation'
  | 'lipid-retention'
  | 'coagulation'
  | 'platelet-activation'
  | 'embolization'
  | 'ischemia'
  | 'cell-injury'
  | 'remodeling'
  | 'neurohumoral'
  | 'edema'
  | 'hemorrhage'

export interface AtlasMechanismStep {
  id: string
  order: number
  layer: PhysiologyLayer
  scale: KnowledgeScale
  title: string
  explanation: string
  structures: readonly string[]
  mechanisms: readonly MechanismKind[]
  upstream?: readonly string[]
  downstream?: readonly string[]
  visualization: {
    mode: 'anatomy-overlay' | 'flow-field' | 'cross-section' | 'histology' | 'cellular' | 'network' | 'timeline'
    animate: boolean
    quantitativeLabel?: string
  }
}

export interface PathophysiologyModule {
  id: string
  label: string
  domainIds: readonly string[]
  territory: string
  summary: string
  steps: readonly AtlasMechanismStep[]
  clinicalConsequences: readonly string[]
  interpretationBoundary: {
    educationalOnly: true
    patientSpecificInference: false
    diagnosisOrTreatment: false
    academicAccuracyGateRequiredForClinicalUse: true
    qualifiedHumanReviewRequired: true
  }
}

const safeBoundary = {
  educationalOnly: true,
  patientSpecificInference: false,
  diagnosisOrTreatment: false,
  academicAccuracyGateRequiredForClinicalUse: true,
  qualifiedHumanReviewRequired: true,
} as const

const step = (value: AtlasMechanismStep): AtlasMechanismStep => value

export const PATHOPHYSIOLOGY_MODULES: readonly PathophysiologyModule[] = [
  {
    id: 'atherosclerosis',
    label: 'Atherosclerosis',
    domainIds: ['cardiovascular','hematologic-immune-lymphatic','cell-molecular-genomics'],
    territory: 'Systemic elastic and muscular arteries, with territory-specific consequences',
    summary: 'A layered artery-wall model connecting disturbed endothelial biology, apoB-containing lipoprotein retention, inflammatory cell recruitment, plaque growth, fibrous-cap remodeling and possible thrombosis after plaque disruption.',
    steps: [
      step({ id:'athero-flow', order:1, layer:'lumen-blood', scale:'organ', title:'Local flow and wall stress context', explanation:'Branch points and curved arterial segments can exhibit complex flow patterns. The atlas visualizes local flow as a context layer rather than claiming that visualized streamline geometry is a patient-specific measurement.', structures:['arterial lumen','branch point','blood column'], mechanisms:['flow','shear'], visualization:{mode:'flow-field',animate:true,quantitativeLabel:'illustrative relative flow field'} }),
      step({ id:'athero-endothelium', order:2, layer:'endothelium', scale:'cell', title:'Endothelial activation and barrier dysfunction', explanation:'Endothelial signaling can shift toward increased permeability, leukocyte adhesion and impaired vasoregulatory behavior. This is represented as a cellular boundary-layer process, separate from gross arterial geometry.', structures:['endothelial monolayer','junctions','glycocalyx'], mechanisms:['barrier','inflammation','shear'], upstream:['athero-flow'], visualization:{mode:'cellular',animate:false} }),
      step({ id:'athero-intima', order:3, layer:'tunica-intima', scale:'molecular-pathway', title:'Atherogenic lipoprotein retention and modification', explanation:'ApoB-containing particles retained within the intima can undergo modification and participate in inflammatory signaling. The visualization should show retention within the wall, not merely luminal narrowing.', structures:['tunica intima','extracellular matrix','apoB-containing lipoproteins'], mechanisms:['lipid-retention','inflammation'], upstream:['athero-endothelium'], visualization:{mode:'cross-section',animate:false} }),
      step({ id:'athero-immune', order:4, layer:'tunica-intima', scale:'cell', title:'Monocyte recruitment and foam-cell formation', explanation:'Adherent leukocytes enter the intima, differentiate, ingest modified lipid and contribute to a lipid-rich inflammatory lesion. The cell layer is explorable independently from the gross plaque surface.', structures:['monocytes','macrophages','foam cells','intima'], mechanisms:['inflammation','lipid-retention'], upstream:['athero-intima'], visualization:{mode:'histology',animate:false} }),
      step({ id:'athero-cap', order:5, layer:'tunica-media', scale:'tissue', title:'Smooth-muscle migration, matrix production and fibrous-cap remodeling', explanation:'Vascular smooth-muscle cells and extracellular matrix contribute to plaque architecture and cap formation while inflammatory processes can alter cap stability.', structures:['vascular smooth-muscle cells','fibrous cap','collagen matrix','media'], mechanisms:['remodeling','inflammation'], upstream:['athero-immune'], visualization:{mode:'cross-section',animate:false} }),
      step({ id:'athero-thrombus', order:6, layer:'lumen-blood', scale:'molecular-pathway', title:'Plaque disruption and superimposed thrombosis', explanation:'When thrombogenic plaque material becomes exposed to circulating blood, platelet activation and coagulation can rapidly produce a thrombus that reduces or interrupts downstream perfusion.', structures:['plaque surface','platelets','fibrin','arterial lumen'], mechanisms:['platelet-activation','coagulation','ischemia'], upstream:['athero-cap'], downstream:['ischemic-stroke-occlusion','cad-ischemia'], visualization:{mode:'timeline',animate:true} }),
    ],
    clinicalConsequences:['chronic flow limitation','acute arterial thrombosis','myocardial ischemia/infarction','ischemic stroke','peripheral arterial ischemia'],
    interpretationBoundary: safeBoundary,
  },
  {
    id: 'ischemic-stroke',
    label: 'Ischemic stroke: arterial occlusion to tissue injury',
    domainIds: ['nervous-system','cardiovascular','hematologic-immune-lymphatic'],
    territory: 'Cervical and intracranial arterial circulation, collateral network and downstream brain tissue',
    summary: 'A neurovascular chain from embolic or in-situ arterial obstruction through collateral-dependent perfusion loss, energy failure, excitotoxic injury, ionic edema and evolving infarction.',
    steps: [
      step({ id:'ischemic-stroke-source', order:1, layer:'named-vessel', scale:'organ', title:'Thromboembolic source and arterial route', explanation:'The atlas traces a clot from a plausible source compartment through named arterial segments without implying that a generic atlas predicts the source in an individual patient.', structures:['heart','aortic arch','carotid artery','vertebral artery','intracranial arteries'], mechanisms:['embolization','flow'], visualization:{mode:'anatomy-overlay',animate:true} }),
      step({ id:'ischemic-stroke-occlusion', order:2, layer:'named-vessel', scale:'organ', title:'Focal arterial occlusion', explanation:'Obstruction reduces forward perfusion in the affected arterial territory. The visible vessel segment is linked to a territory graph rather than equated with a fixed clinical deficit.', structures:['intracranial artery','arterial branch','thrombus'], mechanisms:['flow','ischemia'], upstream:['ischemic-stroke-source','athero-thrombus'], visualization:{mode:'flow-field',animate:true} }),
      step({ id:'ischemic-stroke-collateral', order:3, layer:'microcirculation', scale:'tissue', title:'Collateral flow and pressure redistribution', explanation:'Leptomeningeal and circle-of-Willis collateral routes can partially support threatened tissue. The atlas treats collateral adequacy as a concept layer, not a patient-specific perfusion estimate.', structures:['circle of Willis','leptomeningeal collaterals','arterioles','capillary bed'], mechanisms:['flow','pressure','oxygen-delivery'], upstream:['ischemic-stroke-occlusion'], visualization:{mode:'flow-field',animate:true} }),
      step({ id:'ischemic-stroke-energy', order:4, layer:'cell', scale:'organelle', title:'ATP depletion and ionic homeostasis failure', explanation:'Reduced oxygen and substrate delivery impairs oxidative phosphorylation, weakens ion-gradient maintenance and promotes membrane depolarization.', structures:['neuron','astrocyte','mitochondrion','cell membrane'], mechanisms:['oxygen-delivery','cell-injury'], upstream:['ischemic-stroke-collateral'], visualization:{mode:'cellular',animate:true} }),
      step({ id:'ischemic-stroke-excitotoxic', order:5, layer:'molecular-pathway', scale:'molecular-pathway', title:'Excitotoxic and calcium-dependent injury cascades', explanation:'Sustained depolarization and disrupted neurotransmitter handling can amplify intracellular calcium loading, enzymatic injury and oxidative stress. The network view presents interacting mechanisms rather than a single deterministic pathway.', structures:['synapse','glutamate handling','calcium signaling','reactive oxygen species pathways'], mechanisms:['cell-injury','inflammation'], upstream:['ischemic-stroke-energy'], visualization:{mode:'network',animate:false} }),
      step({ id:'ischemic-stroke-edema', order:6, layer:'tissue', scale:'tissue', title:'Cytotoxic edema and evolving tissue injury', explanation:'Cellular ionic imbalance drives water accumulation, while later barrier dysfunction and inflammation can add extracellular edema. Tissue fate varies with time, collateral supply and reperfusion.', structures:['gray matter','white matter','neurovascular unit','blood-brain barrier'], mechanisms:['edema','barrier','inflammation','cell-injury'], upstream:['ischemic-stroke-excitotoxic'], visualization:{mode:'timeline',animate:true} }),
    ],
    clinicalConsequences:['focal neurologic dysfunction','cerebral infarction','edema','secondary tissue injury'],
    interpretationBoundary: safeBoundary,
  },
  {
    id: 'hemorrhagic-stroke',
    label: 'Intracerebral hemorrhage: vessel failure to secondary injury',
    domainIds: ['nervous-system','cardiovascular'],
    territory: 'Cerebral vessel wall, parenchyma, microcirculation and intracranial compartment',
    summary: 'A layered model of vascular rupture, hematoma formation, local tissue displacement, perihematomal stress, edema and intracranial pressure effects.',
    steps: [
      step({ id:'ich-wall-failure', order:1, layer:'named-vessel', scale:'tissue', title:'Vessel-wall failure', explanation:'A cerebral vessel loses wall integrity and blood leaves the vascular compartment. The module shows the wall and surrounding tissue as separate layers.', structures:['cerebral arteriole','vessel wall','perivascular tissue'], mechanisms:['pressure','hemorrhage'], visualization:{mode:'cross-section',animate:true} }),
      step({ id:'ich-hematoma', order:2, layer:'tissue', scale:'tissue', title:'Hematoma expansion and tissue displacement', explanation:'Extravasated blood occupies intracranial volume and mechanically displaces adjacent tissue. Expansion is visualized as a time-dependent process, not a prediction for an individual case.', structures:['hematoma','brain parenchyma','ventricular system'], mechanisms:['hemorrhage','pressure'], upstream:['ich-wall-failure'], visualization:{mode:'timeline',animate:true} }),
      step({ id:'ich-secondary', order:3, layer:'microcirculation', scale:'cell', title:'Perihematomal microvascular and inflammatory injury', explanation:'Local compression, blood-product exposure, inflammatory signaling and edema can contribute to secondary injury around the hematoma.', structures:['perihematomal tissue','microvessels','glia','neurons'], mechanisms:['inflammation','edema','cell-injury'], upstream:['ich-hematoma'], visualization:{mode:'cellular',animate:false} }),
      step({ id:'ich-icp', order:4, layer:'whole-body', scale:'organ', title:'Intracranial pressure and perfusion consequences', explanation:'Increasing intracranial volume can raise intracranial pressure and alter cerebral perfusion. This relationship is educational and does not calculate a patient-specific pressure state from atlas appearance.', structures:['cranial vault','brain','CSF spaces','cerebral circulation'], mechanisms:['pressure','flow','oxygen-delivery'], upstream:['ich-hematoma'], visualization:{mode:'anatomy-overlay',animate:true} }),
    ],
    clinicalConsequences:['mass effect','neurologic dysfunction','edema','reduced cerebral perfusion','herniation risk in severe cases'],
    interpretationBoundary: safeBoundary,
  },
  {
    id: 'heart-failure',
    label: 'Heart failure: pump dysfunction to systemic congestion',
    domainIds: ['cardiovascular','respiratory','renal-urinary','endocrine'],
    territory: 'Heart, pulmonary circulation, systemic venous circulation, kidney and neurohumoral control',
    summary: 'A multiorgan physiology chain linking impaired ventricular performance or filling to pressure/volume redistribution, congestion, renal responses and neurohumoral remodeling.',
    steps: [
      step({ id:'hf-ventricle', order:1, layer:'organ-system', scale:'organ', title:'Ventricular pump or filling impairment', explanation:'Reduced effective forward output can arise from impaired contraction, impaired filling, abnormal loading conditions or combinations of these. The atlas exposes these as separate mechanisms.', structures:['left ventricle','right ventricle','myocardium','valves'], mechanisms:['pressure','flow'], visualization:{mode:'anatomy-overlay',animate:true} }),
      step({ id:'hf-filling-pressure', order:2, layer:'vascular-territory', scale:'system', title:'Upstream filling-pressure redistribution', explanation:'When ventricular filling pressures rise, pressure can be transmitted backward into pulmonary or systemic venous compartments depending on the dominant side and mechanism.', structures:['left atrium','pulmonary veins','right atrium','systemic veins'], mechanisms:['pressure','flow'], upstream:['hf-ventricle'], visualization:{mode:'flow-field',animate:true} }),
      step({ id:'hf-pulmonary-edema', order:3, layer:'microcirculation', scale:'tissue', title:'Pulmonary capillary filtration and interstitial/alveolar fluid accumulation', explanation:'Elevated pulmonary microvascular hydrostatic pressure can favor fluid movement into interstitial and, when severe, alveolar spaces, impairing gas exchange.', structures:['pulmonary capillary','interstitium','alveolus'], mechanisms:['pressure','edema','oxygen-delivery'], upstream:['hf-filling-pressure'], visualization:{mode:'cross-section',animate:true} }),
      step({ id:'hf-neurohumoral', order:4, layer:'molecular-pathway', scale:'endocrine-signal', title:'Compensatory neurohumoral activation', explanation:'Reduced effective perfusion can engage sympathetic, renin-angiotensin-aldosterone and other regulatory responses. Short-term compensation may increase vascular tone and fluid retention while chronic activation can contribute to adverse remodeling.', structures:['autonomic pathways','kidney','adrenal signaling','vasculature'], mechanisms:['neurohumoral','pressure','remodeling'], upstream:['hf-ventricle'], visualization:{mode:'network',animate:false} }),
      step({ id:'hf-remodeling', order:5, layer:'tissue', scale:'cell', title:'Myocardial remodeling', explanation:'Persistent loading and neurohumoral stress can alter cardiomyocyte geometry, extracellular matrix and chamber structure. The module keeps structural remodeling distinct from any patient-specific prognosis.', structures:['cardiomyocytes','extracellular matrix','ventricular wall'], mechanisms:['remodeling','inflammation'], upstream:['hf-neurohumoral'], visualization:{mode:'histology',animate:false} }),
    ],
    clinicalConsequences:['reduced exercise tolerance','pulmonary congestion','systemic venous congestion','organ hypoperfusion','progressive remodeling'],
    interpretationBoundary: safeBoundary,
  },
  {
    id: 'deep-vein-thrombosis',
    label: 'Deep vein thrombosis',
    domainIds: ['cardiovascular','hematologic-immune-lymphatic'],
    territory: 'Deep venous system, commonly lower-extremity venous segments, with pulmonary embolic pathway linkage',
    summary: 'A venous thrombosis model organized around stasis, vessel-wall/endothelial change and hypercoagulability, followed by clot propagation and potential embolization.',
    steps: [
      step({ id:'dvt-stasis', order:1, layer:'lumen-blood', scale:'organ', title:'Venous stasis and local flow reduction', explanation:'Reduced venous flow lowers washout and changes local transport of activated coagulation factors. The flow overlay is illustrative and not a patient-specific duplex measurement.', structures:['deep vein','venous valve pocket','blood column'], mechanisms:['flow','coagulation'], visualization:{mode:'flow-field',animate:true} }),
      step({ id:'dvt-endothelium', order:2, layer:'endothelium', scale:'cell', title:'Endothelial and inflammatory contribution', explanation:'Local endothelial activation or injury can shift the venous environment toward leukocyte adhesion and procoagulant signaling.', structures:['venous endothelium','valve sinus','leukocytes'], mechanisms:['barrier','inflammation','coagulation'], upstream:['dvt-stasis'], visualization:{mode:'cellular',animate:false} }),
      step({ id:'dvt-coagulation', order:3, layer:'lumen-blood', scale:'molecular-pathway', title:'Thrombin generation and fibrin-rich thrombus formation', explanation:'Coagulation amplification produces fibrin that stabilizes a red-cell-rich venous thrombus. The network layer is educational and does not infer an individual coagulation phenotype.', structures:['coagulation network','fibrin','erythrocytes','platelets'], mechanisms:['coagulation'], upstream:['dvt-endothelium'], visualization:{mode:'network',animate:true} }),
      step({ id:'dvt-propagation', order:4, layer:'named-vessel', scale:'organ', title:'Thrombus propagation', explanation:'Thrombus can extend along the venous lumen, affecting outflow and increasing embolic potential depending on anatomy and clot characteristics.', structures:['deep venous segment','thrombus','venous branches'], mechanisms:['coagulation','flow'], upstream:['dvt-coagulation'], visualization:{mode:'anatomy-overlay',animate:true} }),
      step({ id:'dvt-embolization', order:5, layer:'whole-body', scale:'system', title:'Embolization to pulmonary circulation', explanation:'A detached thrombus fragment can travel through the right heart into pulmonary arteries, converting a local venous event into a cardiopulmonary vascular obstruction.', structures:['inferior vena cava','right atrium','right ventricle','pulmonary arteries'], mechanisms:['embolization','flow','pressure','oxygen-delivery'], upstream:['dvt-propagation'], visualization:{mode:'anatomy-overlay',animate:true} }),
    ],
    clinicalConsequences:['venous obstruction','post-thrombotic venous dysfunction','pulmonary embolism'],
    interpretationBoundary: safeBoundary,
  },
  {
    id: 'coronary-artery-disease',
    label: 'Coronary artery disease and myocardial ischemia',
    domainIds: ['cardiovascular','cell-molecular-genomics'],
    territory: 'Epicardial coronary arteries, microcirculation and myocardium',
    summary: 'A coronary physiology chain connecting atherosclerotic plaque and dynamic supply-demand balance to myocardial oxygen deficit and cellular energetic injury.',
    steps: [
      step({ id:'cad-coronary', order:1, layer:'named-vessel', scale:'organ', title:'Epicardial coronary lumen and plaque burden', explanation:'Coronary plaque can alter lumen geometry and vasomotor reserve. Gross narrowing is linked to downstream physiology rather than treated as a complete measure of ischemia.', structures:['coronary artery','lumen','atherosclerotic plaque'], mechanisms:['flow','shear','lipid-retention'], upstream:['athero-cap'], visualization:{mode:'cross-section',animate:true} }),
      step({ id:'cad-reserve', order:2, layer:'microcirculation', scale:'tissue', title:'Coronary flow reserve and microvascular compensation', explanation:'Resistance vessels modulate regional flow to match myocardial metabolic demand. The atlas uses qualitative reserve states unless validated quantitative data are explicitly supplied.', structures:['coronary arterioles','capillary network','myocardium'], mechanisms:['flow','oxygen-delivery'], upstream:['cad-coronary'], visualization:{mode:'flow-field',animate:true} }),
      step({ id:'cad-ischemia', order:3, layer:'cell', scale:'organelle', title:'Myocardial oxygen supply-demand mismatch', explanation:'When oxygen delivery becomes insufficient for demand, mitochondrial ATP production falls and cardiomyocyte electrical and mechanical function becomes impaired.', structures:['cardiomyocyte','mitochondria','sarcomere'], mechanisms:['oxygen-delivery','ischemia','cell-injury'], upstream:['cad-reserve','athero-thrombus'], visualization:{mode:'cellular',animate:true} }),
      step({ id:'cad-necrosis', order:4, layer:'tissue', scale:'tissue', title:'Prolonged severe ischemia and irreversible injury', explanation:'Sustained severe ischemia can progress from reversible dysfunction to irreversible cardiomyocyte injury, inflammation and later scar formation.', structures:['ischemic myocardium','necrotic tissue','inflammatory cells','scar matrix'], mechanisms:['cell-injury','inflammation','remodeling'], upstream:['cad-ischemia'], visualization:{mode:'timeline',animate:true} }),
    ],
    clinicalConsequences:['myocardial ischemia','acute coronary thrombosis','myocardial infarction','ischemic ventricular dysfunction'],
    interpretationBoundary: safeBoundary,
  },
]

export function getPathophysiologyModule(id: string): PathophysiologyModule | undefined {
  return PATHOPHYSIOLOGY_MODULES.find((module) => module.id === id)
}

export function getPathophysiologyForDomain(domainId: string): readonly PathophysiologyModule[] {
  return PATHOPHYSIOLOGY_MODULES.filter((module) => module.domainIds.includes(domainId))
}

export function getMechanismStep(stepId: string): AtlasMechanismStep | undefined {
  for (const module of PATHOPHYSIOLOGY_MODULES) {
    const found = module.steps.find((candidate) => candidate.id === stepId)
    if (found) return found
  }
  return undefined
}

export const PHYSIOLOGY_ATLAS_BOUNDARY = {
  educationalOnly: true,
  genericAtlasGeometryOnly: true,
  patientSpecificInference: false,
  diagnosticDecisionSupport: false,
  treatmentRecommendation: false,
  validatedQuantitationRequiredBeforeDisplayingPatientMetrics: true,
  highRiskClinicalUseRequiresAcademicAccuracyGate: true,
  highRiskClinicalUseRequiresQualifiedHumanReview: true,
} as const
