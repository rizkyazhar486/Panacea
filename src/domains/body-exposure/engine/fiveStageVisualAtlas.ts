import type { BodySemanticScale } from '../../../lib/bodySemanticZoom'
import type { BodySystemId } from '../../../lib/bodySystemSourceWave'

export type VisualAtlasStageId =
  | 'macro-body'
  | 'organ-conduit'
  | 'tissue-microvasculature'
  | 'cellular-architecture'
  | 'subcellular-molecular'

export type AtlasSimulationDomainTarget =
  | 'anatomy'
  | 'physiology'
  | 'cell'
  | 'genome'

export interface AtlasLiteratureSource {
  readonly id: string
  readonly authors: string
  readonly title: string
  readonly publication: string
  readonly year: number
  readonly pmidOrDoi: string
  readonly url: string
  readonly quantitativeLaw: string
  readonly equation: string
}

export interface VisualAtlasStageSpec {
  readonly index: 1 | 2 | 3 | 4 | 5
  readonly id: VisualAtlasStageId
  readonly shortLabel: string
  readonly title: string
  readonly scaleRangeLabel: string
  readonly characteristicLengthM: number
  readonly relativeZoomStop: number
  readonly semanticScale: BodySemanticScale
  readonly domainTarget: AtlasSimulationDomainTarget
  readonly depthRange01: readonly [number, number]
  readonly summary: string
  readonly primaryLaw: string
  readonly primaryEquation: string
  readonly sourceIds: readonly string[]
}

export interface SystemFiveStageProfile {
  readonly systemId: BodySystemId
  readonly systemLabel: string
  readonly restingFlowSharePct: number
  readonly conduitName: string
  readonly conduitThroughputUnit: string
  readonly restingConduitThroughput: number
  readonly restingDrivingPressureMmHg: number
  readonly tissueBarrierName: string
  readonly barrierThicknessUm: number
  readonly kroghIntercapillaryRadiusUm: number
  readonly basalTissueO2ConsumptionMlMin100g: number
  readonly dominantCellType: string
  readonly restingMembranePotentialMv: number
  readonly basalExcitationHz: number
  readonly subcellularAnchorName: string
  readonly keyGeneOrProteinSymbol: string
  readonly uniprotOrHgncId: string
  readonly pubchemAnchorCid: number
  readonly pubchemAnchorName: string
  readonly stageNarratives: Readonly<Record<VisualAtlasStageId, string>>
  readonly stageLandmarks: Readonly<Record<VisualAtlasStageId, readonly string[]>>
}

export interface FiveStageSimulationInput {
  readonly depth01: number
  readonly metabolicDriveFold: number
  readonly oxygenFraction: number
}

export interface FiveStageScrollResolution {
  readonly depth01: number
  readonly activeStageIndex: number
  readonly activeStageId: VisualAtlasStageId
  readonly activeStage: VisualAtlasStageSpec
  readonly stageLocalProgress01: number
  readonly effectiveRelativeZoom: number
  readonly characteristicLengthLabel: string
  readonly semanticScale: BodySemanticScale
  readonly domainTarget: AtlasSimulationDomainTarget
}

export interface FiveStagePhysiologyMetrics {
  readonly stage1Macro: {
    readonly cardiacOutputLMin: number
    readonly systemFlowSharePct: number
    readonly systemPerfusionMlMin: number
    readonly autonomicSympatheticIndex: number
  }
  readonly stage2Organ: {
    readonly conduitName: string
    readonly drivingPressureMmHg: number
    readonly organThroughputValue: number
    readonly organThroughputUnit: string
    readonly conduitReserveIndex: number
  }
  readonly stage3Tissue: {
    readonly tissueBarrierName: string
    readonly barrierThicknessUm: number
    readonly kroghArterialPo2MmHg: number
    readonly kroghVenousPo2MmHg: number
    readonly kroghMinTissuePo2MmHg: number
    readonly effectiveDiffusionRadiusUm: number
    readonly starlingNetFiltrationMmHg: number
  }
  readonly stage4Cellular: {
    readonly dominantCellType: string
    readonly restingMembranePotentialMv: number
    readonly cytosolicCalciumUm: number
    readonly excitationFrequencyHz: number
    readonly naKAtpasePumpLoadPct: number
  }
  readonly stage5Molecular: {
    readonly subcellularAnchorName: string
    readonly protonMotiveForceMv: number
    readonly atpTurnoverMmolKgMin: number
    readonly nadhToNadRatio: number
    readonly keyGeneOrProteinSymbol: string
    readonly uniprotOrHgncId: string
    readonly pubchemAnchorCid: number
    readonly pubchemAnchorName: string
  }
}

export type FiveStageEvaluationResult =
  | {
      readonly ok: true
      readonly system: SystemFiveStageProfile
      readonly scroll: FiveStageScrollResolution
      readonly metrics: FiveStagePhysiologyMetrics
      readonly activeSources: readonly AtlasLiteratureSource[]
      readonly boundaryNote: string
    }
  | {
      readonly ok: false
      readonly reason: 'non-finite-input' | 'depth-out-of-range' | 'metabolic-drive-out-of-range' | 'oxygen-fraction-out-of-range'
      readonly detail: string
    }

export const FIVE_STAGE_DEFAULTS: FiveStageSimulationInput = {
  depth01: 0,
  metabolicDriveFold: 1.0,
  oxygenFraction: 0.21,
}

export const FIVE_STAGE_BOUNDARY_NOTE =
  'Reference educational physiology model synthesized from peer-reviewed textbooks and journals. Deterministic equations illustrate multi-scale coupling and are not patient-specific clinical measurements or diagnostic predictions.'

export const ATLAS_LITERATURE_SOURCES: readonly AtlasLiteratureSource[] = [
  {
    id: 'guyton-hall-14e',
    authors: 'Hall JE, Hall ME',
    title: 'Guyton and Hall Textbook of Medical Physiology (14th ed.)',
    publication: 'Elsevier',
    year: 2021,
    pmidOrDoi: 'ISBN: 978-0323597128',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK537171/',
    quantitativeLaw: 'Whole-body cardiac output partitioning & Starling transcapillary balance',
    equation: 'CO = HR × SV; Jv = Kf × [(Pc − Pi) − σ(πc − πi)]',
  },
  {
    id: 'boron-boulpaep-3e',
    authors: 'Boron WF, Boulpaep EL',
    title: 'Medical Physiology (3rd ed.)',
    publication: 'Elsevier',
    year: 2017,
    pmidOrDoi: 'ISBN: 978-1455743773',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK541062/',
    quantitativeLaw: 'Hemodynamic Poiseuille conductance & Nernst/Goldman-Hodgkin-Katz electrophysiology',
    equation: 'Q = ΔP / R; Vm = (RT/F) ln((P_K[K+]o + P_Na[Na+]o + P_Cl[Cl-]i) / (P_K[K+]i + P_Na[Na+]i + P_Cl[Cl-]o))',
  },
  {
    id: 'grays-anatomy-42e',
    authors: 'Standring S (ed.)',
    title: "Gray's Anatomy: The Anatomical Basis of Clinical Practice (42nd ed.)",
    publication: 'Elsevier',
    year: 2020,
    pmidOrDoi: 'ISBN: 978-0702077050',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK554569/',
    quantitativeLaw: 'Hierarchical anatomical continuity from gross somatic planes to histological laminae',
    equation: 'Whole body (1.7 m) → Organ system (10⁻¹ m) → Histological unit (10⁻⁴ m)',
  },
  {
    id: 'krogh-1919-capillary',
    authors: 'Krogh A',
    title: 'The number and distribution of capillaries in muscles with calculations of the oxygen pressure head necessary for supplying the tissue',
    publication: 'J Physiol. 1919;52(6):409-415',
    year: 1919,
    pmidOrDoi: 'PMID: 16993405 · DOI: 10.1113/jphysiol.1919.sp001839',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1402719/',
    quantitativeLaw: 'Krogh-Erlang radial oxygen diffusion cylinder in microvascular tissue beds',
    equation: 'PO2(R) = Pcap − (M / 4K) × [R² ln((R/Rc)²) − (R² − Rc²)]',
  },
  {
    id: 'weibel-west-morphometry',
    authors: 'Weibel ER; West JB, Luks AM',
    title: 'Morphometry of the Human Lung & West’s Respiratory Physiology (11th ed.)',
    publication: 'Academic Press / Wolters Kluwer',
    year: 2021,
    pmidOrDoi: 'PMID: 13999517 · PMC6269087',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6269087/',
    quantitativeLaw: 'Fick diffusive flux across ultrathin blood-tissue barriers',
    equation: 'V_gas = (A / T) × D × (P1 − P2)',
  },
  {
    id: 'hodgkin-huxley-bers',
    authors: 'Hodgkin AL, Huxley AF; Bers DM',
    title: 'Membrane current excitation & Cardiac excitation-contraction coupling',
    publication: 'J Physiol. 1952;117:500-544 & Nature. 2002;415:198-205',
    year: 2002,
    pmidOrDoi: 'PMID: 12991237 · PMID: 11805843',
    url: 'https://pubmed.ncbi.nlm.nih.gov/11805843/',
    quantitativeLaw: 'Voltage-gated ion conductance and Ca²⁺-induced Ca²⁺ release (CICR)',
    equation: 'C_m (dVm/dt) = −(I_Na + I_K + I_CaL + I_leak); [Ca²⁺]_i ↔ SERCA2a / RyR2',
  },
  {
    id: 'mitchell-alberts-opencell',
    authors: 'Mitchell P; Alberts B et al.; Cho NH et al.',
    title: 'Chemiosmotic ATP coupling, Molecular Biology of the Cell (7th ed.), & OpenCell',
    publication: 'Nature 1961;191:144-148 · W.W. Norton 2022 · Science 2022;375:eabi6983',
    year: 2022,
    pmidOrDoi: 'PMID: 13771349 · PMID: 35271311',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9295688/',
    quantitativeLaw: 'Proton-motive force (Δp) driving F₁F₀-ATP synthase rotary catalysis',
    equation: 'Δp = ΔΨm − (2.303 RT / F) ΔpH ≈ 180–220 mV',
  },
] as const

export const VISUAL_ATLAS_STAGES: readonly VisualAtlasStageSpec[] = [
  {
    index: 1,
    id: 'macro-body',
    shortLabel: 'Whole Body',
    title: 'Whole Human Body · Organismal Homeostasis',
    scaleRangeLabel: '1.7 m → 25 cm · 1.0×',
    characteristicLengthM: 1.7,
    relativeZoomStop: 1.0,
    semanticScale: 'whole-body',
    domainTarget: 'anatomy',
    depthRange01: [0.0, 0.2],
    summary: 'Whole-body autonomic regulation and cardiac output distribution across all 11 coupled organ systems.',
    primaryLaw: 'Fick Principle & Systemic Flow Partitioning',
    primaryEquation: 'CO = VO₂ / (CaO₂ − CvO₂); Q_sys = CO × f_sys',
    sourceIds: ['guyton-hall-14e', 'grays-anatomy-42e'],
  },
  {
    index: 2,
    id: 'organ-conduit',
    shortLabel: 'Organ System',
    title: 'Organ & Conduit Mechanics · Regional Function',
    scaleRangeLabel: '25 cm → 2 mm · 3.5×',
    characteristicLengthM: 0.08,
    relativeZoomStop: 3.5,
    semanticScale: 'organ',
    domainTarget: 'physiology',
    depthRange01: [0.2, 0.4],
    summary: 'Macro-to-meso organ architecture, pressure-flow conduits, valve/pump work, and neural-endocrine routing.',
    primaryLaw: 'Darcy-Poiseuille Conduit Conductance',
    primaryEquation: 'Q_organ = ΔP / R_organ = (π ΔP r⁴) / (8 η L)',
    sourceIds: ['boron-boulpaep-3e', 'grays-anatomy-42e'],
  },
  {
    index: 3,
    id: 'tissue-microvasculature',
    shortLabel: 'Tissue & Microvessel',
    title: 'Histological Laminae & Krogh Microvasculature',
    scaleRangeLabel: '500 µm → 10 µm · 10×',
    characteristicLengthM: 0.00012,
    relativeZoomStop: 10.0,
    semanticScale: 'tissue',
    domainTarget: 'physiology',
    depthRange01: [0.4, 0.6],
    summary: 'Capillary bed O₂ diffusion cylinders, Starling transcapillary filtration, and specialized basement membranes.',
    primaryLaw: 'Krogh-Erlang Radial Diffusion & Starling Filtration',
    primaryEquation: 'PO₂(r) = P_cap − (M/4D)(r² − R_c²) + (M R_t² / 2D) ln(r / R_c)',
    sourceIds: ['krogh-1919-capillary', 'weibel-west-morphometry', 'guyton-hall-14e'],
  },
  {
    index: 4,
    id: 'cellular-architecture',
    shortLabel: 'Cellular',
    title: 'Single-Cell Electrophysiology & Compartments',
    scaleRangeLabel: '25 µm → 1 µm · 25×',
    characteristicLengthM: 0.000015,
    relativeZoomStop: 25.0,
    semanticScale: 'cell',
    domainTarget: 'cell',
    depthRange01: [0.6, 0.8],
    summary: 'Specialized human cell membrane potential, voltage-gated ion flux, Ca²⁺ transients, and organelle topology.',
    primaryLaw: 'Goldman-Hodgkin-Katz & Ca²⁺ Cycling Kinetics',
    primaryEquation: 'C_m (dVm/dt) = −Σ I_ion; [Ca²⁺]_cyt ↔ RyR / IP₃R / SERCA',
    sourceIds: ['hodgkin-huxley-bers', 'boron-boulpaep-3e'],
  },
  {
    index: 5,
    id: 'subcellular-molecular',
    shortLabel: 'Molecular & Gene',
    title: 'Subcellular Bioenergetics, Proteins & Genome',
    scaleRangeLabel: '500 nm → 2 nm · 95×',
    characteristicLengthM: 0.000000008,
    relativeZoomStop: 95.0,
    semanticScale: 'molecule',
    domainTarget: 'genome',
    depthRange01: [0.8, 1.0],
    summary: 'Mitochondrial cristae ΔΨm proton-motive force, F₁F₀-ATP synthase catalysis, and locus-specific gene expression.',
    primaryLaw: 'Mitchell Chemiosmotic Coupling & Enzyme Kinetics',
    primaryEquation: 'Δp = ΔΨm − 61.5 ΔpH; ADP + Pi + 3.3 H⁺_out ⇌ ATP + H₂O + 3.3 H⁺_in',
    sourceIds: ['mitchell-alberts-opencell'],
  },
] as const

export const SYSTEM_FIVE_STAGE_PROFILES: Readonly<Record<BodySystemId, SystemFiveStageProfile>> = {
  cardiovascular: {
    systemId: 'cardiovascular',
    systemLabel: 'Cardiovascular',
    restingFlowSharePct: 100,
    conduitName: 'Left Ventricle → Aortic Root & Coronary Tree',
    conduitThroughputUnit: 'L/min stroke output',
    restingConduitThroughput: 5.0,
    restingDrivingPressureMmHg: 93,
    tissueBarrierName: 'Coronary Capillary Endothelium & Myocardial Interstitium',
    barrierThicknessUm: 0.5,
    kroghIntercapillaryRadiusUm: 19,
    basalTissueO2ConsumptionMlMin100g: 8.5,
    dominantCellType: 'Ventricular Cardiomyocyte',
    restingMembranePotentialMv: -90,
    basalExcitationHz: 1.15,
    subcellularAnchorName: 'Sarcomere Actomyosin Cross-Bridge & Subsarcolemmal Mitochondria',
    keyGeneOrProteinSymbol: 'MYH7 / SERCA2a (ATP2A2)',
    uniprotOrHgncId: 'UniProt: P12883 · HGNC:7577',
    pubchemAnchorCid: 5957,
    pubchemAnchorName: 'Adenosine Triphosphate (ATP)',
    stageNarratives: {
      'macro-body': 'The heart pumps 5.0 L/min at rest across parallel systemic and pulmonary circuits to sustain whole-body oxygen delivery (DO₂ ≈ 1,000 mL O₂/min).',
      'organ-conduit': 'Left ventricular pressure-volume loop ejects blood across the aortic valve into the Windkessel elastic aorta while diastolic root pressure perfuses the left and right coronary arteries.',
      'tissue-microvasculature': 'Dense myocardial capillary network (~2,500–3,000 capillaries/mm², intercapillary half-distance ~19 µm) extracts 70–75% of arterial O₂ across the tunica intima.',
      'cellular-architecture': 'Ventricular cardiomyocytes (-90 mV resting potential) couple L-type CaV1.2 current to ryanodine receptor (RyR2) Ca²⁺-induced Ca²⁺ release across T-tubule dyads.',
      'subcellular-molecular': 'Mitochondrial F₁F₀-ATP synthase replenishes ATP consumed by β-myosin heavy chain (MYH7) power strokes and SERCA2a diastolic Ca²⁺ reuptake.',
    },
    stageLandmarks: {
      'macro-body': ['Left ventricle', 'Aortic arch', 'Superior & inferior venae cavae'],
      'organ-conduit': ['Aortic valve cusps', 'Left anterior descending artery', 'Sinus of Valsalva'],
      'tissue-microvasculature': ['Tunica intima endothelium', 'Internal elastic lamina', 'Tunica media & vasa vasorum'],
      'cellular-architecture': ['Transverse tubule (T-tubule)', 'Sarcoplasmic reticulum dyad', 'Intercalated disc (Cx43)'],
      'subcellular-molecular': ['β-Myosin heavy chain (MYH7)', 'Troponin C-I-T complex', 'Mitochondrial ATP synthase'],
    },
  },
  nervous: {
    systemId: 'nervous',
    systemLabel: 'Nervous',
    restingFlowSharePct: 14,
    conduitName: 'Circle of Willis & Corticospinal / Thalamocortical Tracts',
    conduitThroughputUnit: 'm/s axonal conduction',
    restingConduitThroughput: 65,
    restingDrivingPressureMmHg: 75,
    tissueBarrierName: 'Neurovascular Unit & Blood-Brain Barrier (BBB)',
    barrierThicknessUm: 0.4,
    kroghIntercapillaryRadiusUm: 24,
    basalTissueO2ConsumptionMlMin100g: 3.5,
    dominantCellType: 'Layer V Pyramidal Neuron & Astrocyte Syncytium',
    restingMembranePotentialMv: -70,
    basalExcitationHz: 18,
    subcellularAnchorName: 'Synaptic Vesicle SNARE Complex & Na⁺/K⁺-ATPase α3',
    keyGeneOrProteinSymbol: 'ATP1A3 / SCN1A (NaV1.1)',
    uniprotOrHgncId: 'UniProt: P13637 · HGNC:801',
    pubchemAnchorCid: 5793,
    pubchemAnchorName: 'D-Glucose (Obligate Cerebral Fuel)',
    stageNarratives: {
      'macro-body': 'Receives ~14% of cardiac output (~700 mL/min) and consumes ~20% of whole-body oxygen to coordinate somatic sensorimotor and autonomic homeostasis.',
      'organ-conduit': 'Cerebral autoregulation maintains constant perfusion across the Circle of Willis while myelinated tracts conduct saltatory action potentials up to 65–100 m/s.',
      'tissue-microvasculature': 'Endothelial tight junctions (claudin-5/occludin), pericytes, and astrocyte endfeet form the 0.4 µm blood-brain barrier regulating glucose (GLUT1) and O₂ flux.',
      'cellular-architecture': 'Pyramidal neurons (-70 mV) integrate dendritic EPSPs/IPSPs at the axon initial segment via Hodgkin-Huxley NaV/KV conductances.',
      'subcellular-molecular': 'Synaptic boutons dock glutamate vesicles via synaptotagmin-SNARE while Na⁺/K⁺-ATPase (ATP1A3) consumes ~50% of neuronal ATP to restore ion gradients.',
    },
    stageLandmarks: {
      'macro-body': ['Cerebral hemispheres', 'Brainstem & cranial nerves', 'Spinal cord & cauda equina'],
      'organ-conduit': ['Internal capsule', 'Corticospinal decussation', 'Circle of Willis'],
      'tissue-microvasculature': ['Cortical laminae I–VI', 'Blood-brain barrier tight junctions', 'Perivascular Virchow-Robin space'],
      'cellular-architecture': ['Axon initial segment', 'Nodes of Ranvier', 'Dendritic spine post-synaptic density'],
      'subcellular-molecular': ['Na⁺/K⁺-ATPase (ATP1A3)', 'AMPA/NMDA receptor tetramer', 'Synaptotagmin-1 Ca²⁺ sensor'],
    },
  },
  respiratory: {
    systemId: 'respiratory',
    systemLabel: 'Respiratory',
    restingFlowSharePct: 100,
    conduitName: 'Tracheobronchial Tree (Weibel Generations 0 → 23)',
    conduitThroughputUnit: 'L/min alveolar ventilation',
    restingConduitThroughput: 4.2,
    restingDrivingPressureMmHg: 14,
    tissueBarrierName: 'Alveolar-Capillary Blood-Gas Barrier',
    barrierThicknessUm: 0.3,
    kroghIntercapillaryRadiusUm: 14,
    basalTissueO2ConsumptionMlMin100g: 1.8,
    dominantCellType: 'Type I & Type II Alveolar Pneumocytes',
    restingMembranePotentialMv: -55,
    basalExcitationHz: 0.2,
    subcellularAnchorName: 'Lamellar Body Surfactant Complex & Hemoglobin-O₂ Tetramer',
    keyGeneOrProteinSymbol: 'SFTPC / HBB (β-Globin)',
    uniprotOrHgncId: 'UniProt: P11686 · HGNC:10802',
    pubchemAnchorCid: 5957,
    pubchemAnchorName: 'Adenosine Triphosphate (ATP)',
    stageNarratives: {
      'macro-body': 'Couples 4.2 L/min alveolar ventilation (V̇A) with 5.0 L/min pulmonary capillary perfusion (Q̇) to arterialize venous blood (PaO₂ ≈ 100 mmHg, PaCO₂ ≈ 40 mmHg).',
      'organ-conduit': 'Bifurcates through 23 Weibel airway generations from conductive cartilaginous bronchi to ~300 million acinar alveoli (~70–100 m² surface area).',
      'tissue-microvasculature': 'Oxygen diffuses across the 0.3 µm fused basal lamina between squamous Type I epithelium and pulmonary capillary endothelium within ~0.25 s transit time.',
      'cellular-architecture': 'Type II pneumocytes synthesize dipalmitoylphosphatidylcholine (DPPC) surfactant in lamellar bodies while ENaC channels clear alveolar fluid.',
      'subcellular-molecular': 'Surfactant protein C (SFTPC) stabilizes the air-liquid interface while erythrocyte hemoglobin (HBB) undergoes cooperative R↔T allosteric O₂ binding.',
    },
    stageLandmarks: {
      'macro-body': ['Right & left lungs', 'Trachea & carina', 'Thoracic diaphragm'],
      'organ-conduit': ['Segmental bronchi', 'Terminal bronchioles', 'Pulmonary arterial bed'],
      'tissue-microvasculature': ['Alveolar septum', 'Fused alveolar-capillary basement membrane', 'Pulmonary capillary sheet'],
      'cellular-architecture': ['Type I squamous pneumocyte', 'Type II cuboidal pneumocyte', 'Alveolar macrophage'],
      'subcellular-molecular': ['Surfactant Protein C (SFTPC)', 'ABCA3 lipid transporter', 'Hemoglobin α₂β₂ tetramer'],
    },
  },
  digestive: {
    systemId: 'digestive',
    systemLabel: 'Digestive',
    restingFlowSharePct: 24,
    conduitName: 'Splanchnic-Portal Conduit & Hepatic Sinusoidal Bed',
    conduitThroughputUnit: 'L/min portal-hepatic flow',
    restingConduitThroughput: 1.35,
    restingDrivingPressureMmHg: 9,
    tissueBarrierName: 'Intestinal Villus Brush Border & Hepatic Space of Disse',
    barrierThicknessUm: 1.2,
    kroghIntercapillaryRadiusUm: 28,
    basalTissueO2ConsumptionMlMin100g: 4.2,
    dominantCellType: 'Absorptive Enterocyte & Periportal Hepatocyte',
    restingMembranePotentialMv: -48,
    basalExcitationHz: 0.05,
    subcellularAnchorName: 'SGLT1 Cotransporter & Cytochrome P440 / TCA NAD⁺ Pool',
    keyGeneOrProteinSymbol: 'SLC5A1 (SGLT1) / GCK',
    uniprotOrHgncId: 'UniProt: P13866 · HGNC:11036',
    pubchemAnchorCid: 5793,
    pubchemAnchorName: 'D-Glucose (Enteric-Portal Substrate)',
    stageNarratives: {
      'macro-body': 'Splanchnic circulation receives ~24% of resting cardiac output (~1.35 L/min) via celiac, superior/inferior mesenteric arteries and the portal vein.',
      'organ-conduit': 'Peristaltic slow-wave motility propels chyme along the gastrointestinal lumen while portal venous blood traverses hepatic acinar zones 1 → 3.',
      'tissue-microvasculature': 'Intestinal villi amplify absorptive area ~600-fold; fenestrated hepatic sinusoids exchange solutes directly across the perisinusoidal Space of Disse.',
      'cellular-architecture': 'Polarized enterocytes drive secondary active Na⁺-glucose transport (SGLT1) across apical microvilli while hepatocytes regulate glycogenolysis and gluconeogenesis.',
      'subcellular-molecular': 'Mitochondrial pyruvate dehydrogenase and TCA enzymes reduce NAD⁺ to NADH to power hepatocyte biosynthetic and detoxification pathways.',
    },
    stageLandmarks: {
      'macro-body': ['Stomach & duodenum', 'Liver & biliary tree', 'Small & large intestine'],
      'organ-conduit': ['Portal vein & hepatic artery', 'Plicae circulares', 'Myenteric plexus (Auerbach)'],
      'tissue-microvasculature': ['Intestinal villus & crypt of Lieberkühn', 'Hepatic portal triad', 'Space of Disse'],
      'cellular-architecture': ['Apical microvillus brush border', 'Hepatocyte bile canaliculus', 'Enteroendocrine L-cell'],
      'subcellular-molecular': ['SGLT1 (SLC5A1) symporter', 'Glucokinase (GCK)', 'NAD⁺ / NADH redox couple'],
    },
  },
  urinary: {
    systemId: 'urinary',
    systemLabel: 'Urinary',
    restingFlowSharePct: 22,
    conduitName: 'Renal Artery → ~2 Million Nephron Tubulovascular Units',
    conduitThroughputUnit: 'mL/min GFR',
    restingConduitThroughput: 120,
    restingDrivingPressureMmHg: 60,
    tissueBarrierName: 'Glomerular Filtration Barrier & Peritubular Capillary Plexus',
    barrierThicknessUm: 0.35,
    kroghIntercapillaryRadiusUm: 22,
    basalTissueO2ConsumptionMlMin100g: 6.0,
    dominantCellType: 'Glomerular Podocyte & Proximal Convoluted Tubule Cell',
    restingMembranePotentialMv: -70,
    basalExcitationHz: 0.1,
    subcellularAnchorName: 'Slit Diaphragm Nephrin & Basolateral Na⁺/K⁺-ATPase',
    keyGeneOrProteinSymbol: 'NPHS1 / SLC12A1 (NKCC2)',
    uniprotOrHgncId: 'UniProt: O60500 · HGNC:7908',
    pubchemAnchorCid: 5957,
    pubchemAnchorName: 'Adenosine Triphosphate (ATP)',
    stageNarratives: {
      'macro-body': 'Kidneys receive ~22% of cardiac output (~1.1 L/min) to filter ~180 L/day of plasma and maintain extracellular volume, osmolarity, and acid-base balance.',
      'organ-conduit': 'Afferent and efferent arteriolar resistance regulates glomerular hydrostatic pressure (~60 mmHg) driving 120 mL/min glomerular filtration rate (GFR).',
      'tissue-microvasculature': 'Three-layer glomerular barrier (fenestrated endothelium, 300 nm GBM, podocyte slit diaphragm) filters water and small solutes while retaining albumin.',
      'cellular-architecture': 'Proximal tubule epithelial cells reabsorb ~65% of filtered Na⁺, water, glucose, and amino acids powered by dense basolateral mitochondrial palisades.',
      'subcellular-molecular': 'Nephrin (NPHS1) zippers the 40 nm podocyte slit diaphragm while NKCC2 (SLC12A1) and Na⁺/K⁺-ATPase establish the corticomedullary osmotic gradient.',
    },
    stageLandmarks: {
      'macro-body': ['Right & left kidneys', 'Renal cortex & medulla', 'Ureters & urinary bladder'],
      'organ-conduit': ['Afferent & efferent arterioles', 'Loop of Henle & vasa recta', 'Juxtaglomerular apparatus'],
      'tissue-microvasculature': ['Glomerular capillary tuft', 'Glomerular basement membrane', 'Proximal tubule brush border'],
      'cellular-architecture': ['Podocyte foot processes (pedicels)', 'Proximal tubule epithelial cell', 'Macula densa sensor cell'],
      'subcellular-molecular': ['Nephrin (NPHS1) slit complex', 'NKCC2 (SLC12A1) cotransporter', 'Aquaporin-2 (AQP2) channel'],
    },
  },
  endocrine: {
    systemId: 'endocrine',
    systemLabel: 'Endocrine',
    restingFlowSharePct: 5,
    conduitName: 'Hypothalamic-Pituitary Portal Axis & Islet-Adrenal Perfusion',
    conduitThroughputUnit: 'pmol/L pulsatile hormone flux',
    restingConduitThroughput: 140,
    restingDrivingPressureMmHg: 70,
    tissueBarrierName: 'Fenestrated Endocrine Sinusoids & Pericapillary Halo',
    barrierThicknessUm: 0.45,
    kroghIntercapillaryRadiusUm: 18,
    basalTissueO2ConsumptionMlMin100g: 5.1,
    dominantCellType: 'Pancreatic β-Cell & Anterior Pituitary / Adrenal Secretory Cell',
    restingMembranePotentialMv: -70,
    basalExcitationHz: 0.5,
    subcellularAnchorName: 'ATP-Sensitive K⁺ Channel (K_ATP) & Dense-Core Granule Exocytosis',
    keyGeneOrProteinSymbol: 'INS / KCNJ11 (Kir6.2)',
    uniprotOrHgncId: 'UniProt: P01308 · HGNC:6081',
    pubchemAnchorCid: 5793,
    pubchemAnchorName: 'D-Glucose (Metabolic Secretory Trigger)',
    stageNarratives: {
      'macro-body': 'Integrates whole-body metabolic homeostasis, stress response, and growth via pulsatile hormone signaling across pituitary, thyroid, adrenal, and islet axes.',
      'organ-conduit': 'High-permeability portal and sinusoidal vascular beds deliver picomolar hormone pulses rapidly into systemic venous drainage.',
      'tissue-microvasculature': 'Diaphragmed endothelial fenestrae (~60–80 nm) in pancreatic islets and thyroid follicles enable rapid bidirectional glucose sensing and hormone export.',
      'cellular-architecture': 'Pancreatic β-cells couple intracellular ATP/ADP ratio elevation to K_ATP channel closure, membrane depolarization, and CaV1.2-triggered insulin exocytosis.',
      'subcellular-molecular': 'Glucokinase (GCK) acts as the molecular glucose sensor driving mitochondrial NADH/ATP synthesis and Zn²⁺-hexameric insulin (INS) granule fusion.',
    },
    stageLandmarks: {
      'macro-body': ['Hypothalamus & pituitary gland', 'Thyroid & parathyroid glands', 'Adrenal glands & endocrine pancreas'],
      'organ-conduit': ['Hypophyseal portal system', 'Thyroid follicular plexus', 'Islet of Langerhans microcirculation'],
      'tissue-microvasculature': ['Fenestrated islet capillary', 'Thyroid colloid follicle', 'Adrenal zona fasciculata cords'],
      'cellular-architecture': ['Pancreatic β-cell', 'Thyrocyte follicular cell', 'Chromaffin neuroendocrine cell'],
      'subcellular-molecular': ['K_ATP channel (KCNJ11/ABCC8)', 'Preproinsulin → Insulin (INS)', 'Gsα / cAMP / PKA cascade'],
    },
  },
  reproductive: {
    systemId: 'reproductive',
    systemLabel: 'Reproductive',
    restingFlowSharePct: 3,
    conduitName: 'Gonadal-Uterine Vascular Plexus & Gamete Transport Conduits',
    conduitThroughputUnit: 'mL/min gonadal-pelvic flow',
    restingConduitThroughput: 150,
    restingDrivingPressureMmHg: 72,
    tissueBarrierName: 'Blood-Testis Sertoli Barrier & Endometrial Spiral Arteriolar Bed',
    barrierThicknessUm: 0.8,
    kroghIntercapillaryRadiusUm: 26,
    basalTissueO2ConsumptionMlMin100g: 2.8,
    dominantCellType: 'Sertoli/Leydig & Granulosa-Theca / Oocyte Unit',
    restingMembranePotentialMv: -60,
    basalExcitationHz: 0.08,
    subcellularAnchorName: 'Steroidogenic StAR Mitochondrial Complex & Meiotic Synaptonemal Axis',
    keyGeneOrProteinSymbol: 'STAR / CYP19A1 (Aromatase)',
    uniprotOrHgncId: 'UniProt: P49675 · HGNC:11359',
    pubchemAnchorCid: 439153,
    pubchemAnchorName: 'NADH / NADPH (Steroidogenic Cofactor)',
    stageNarratives: {
      'macro-body': 'Coordinates hypothalamic GnRH pulsatility, pituitary LH/FSH secretion, gonadal steroidogenesis, and reproductive tract physiology across male and female anatomy.',
      'organ-conduit': 'Pampiniform countercurrent heat exchanger and uterine-ovarian arterial arcades regulate temperature and cyclic vascular remodeling.',
      'tissue-microvasculature': 'Seminiferous tubule Sertoli tight junctions and ovarian follicular basement membranes partition specialized avascular microenvironments.',
      'cellular-architecture': 'Leydig and theca/granulosa cells convert cholesterol to testosterone and estradiol in response to LH/FSH G-protein receptor signaling.',
      'subcellular-molecular': 'Steroidogenic acute regulatory protein (STAR) transfers cholesterol across the mitochondrial outer membrane to CYP11A1 while aromatase (CYP19A1) catalyzes estrogen synthesis.',
    },
    stageLandmarks: {
      'macro-body': ['Testis, epididymis & prostate', 'Uterus, uterine tubes & ovaries', 'Vagina & external genitalia'],
      'organ-conduit': ['Seminiferous & efferent ducts', 'Ampulla of uterine tube', 'Uterine & ovarian arterial arcade'],
      'tissue-microvasculature': ['Seminiferous epithelium & blood-testis barrier', 'Graafian antral follicle', 'Endometrial stratum functionalis'],
      'cellular-architecture': ['Sertoli nurse cell & spermatocyte', 'Cumulus-oocyte complex', 'Steroidogenic Leydig / theca cell'],
      'subcellular-molecular': ['StAR mitochondrial cholesterol carrier', 'Aromatase (CYP19A1)', 'FSHR / LHCGR GPCR complex'],
    },
  },
  'lymphatic-immune': {
    systemId: 'lymphatic-immune',
    systemLabel: 'Lymphatic / Immune',
    restingFlowSharePct: 2,
    conduitName: 'Collecting Lymphatics, Lymph Nodes & Thoracic Duct',
    conduitThroughputUnit: 'mL/h lymph return',
    restingConduitThroughput: 125,
    restingDrivingPressureMmHg: 12,
    tissueBarrierName: 'Initial Lymphatic Oak-Leaf Button Junctions & High Endothelial Venules',
    barrierThicknessUm: 0.4,
    kroghIntercapillaryRadiusUm: 30,
    basalTissueO2ConsumptionMlMin100g: 2.2,
    dominantCellType: 'CD8⁺/CD4⁺ T Lymphocyte & Dendritic Antigen-Presenting Cell',
    restingMembranePotentialMv: -55,
    basalExcitationHz: 0.15,
    subcellularAnchorName: 'TCR-CD3 Immunological Synapse & MHC Class I/II Peptide Groove',
    keyGeneOrProteinSymbol: 'HLA-A / CD247 (TCR-ζ)',
    uniprotOrHgncId: 'UniProt: P04439 · HGNC:4931',
    pubchemAnchorCid: 5957,
    pubchemAnchorName: 'Adenosine Triphosphate (ATP)',
    stageNarratives: {
      'macro-body': 'Returns ~3 L/day of interstitial Starling filtrate to the venous angle via the thoracic duct while trafficking lymphocytes across spleen, thymus, and lymph nodes.',
      'organ-conduit': 'Intrinsic lymphangion smooth muscle contractions and bicuspid valves propel lymph unidirectionally through paracortical lymph node sinuses.',
      'tissue-microvasculature': 'VE-cadherin button junctions in initial lymphatic capillaries admit interstitial fluid and dendritic cells; lymphocytes extravasate across high endothelial venules (HEVs).',
      'cellular-architecture': 'Naive T cells scan peptide-MHC complexes on dendritic cells; antigen recognition triggers store-operated CRAC (ORAI1/STIM1) Ca²⁺ influx and clonal activation.',
      'subcellular-molecular': 'Phosphorylation of TCR-CD3 ITAM motifs by LCK recruits ZAP70, driving calcineurin-NFAT nuclear translocation and IL-2 transcription.',
    },
    stageLandmarks: {
      'macro-body': ['Thoracic duct & cisterna chyli', 'Spleen & thymus', 'Cervical, axillary & inguinal lymph nodes'],
      'organ-conduit': ['Valved collecting lymphangion', 'Subcapsular & medullary sinus', 'Splenic white & red pulp'],
      'tissue-microvasculature': ['High endothelial venule (HEV)', 'Lymphoid germinal center', 'Initial lymphatic button junction'],
      'cellular-architecture': ['CD4⁺ / CD8⁺ T lymphocyte', 'Follicular dendritic cell', 'Plasma B cell'],
      'subcellular-molecular': ['MHC Class I (HLA-A) peptide cleft', 'TCR-CD3-ZAP70 signalosome', 'ORAI1 / STIM1 Ca²⁺ channel'],
    },
  },
  musculoskeletal: {
    systemId: 'musculoskeletal',
    systemLabel: 'Musculoskeletal',
    restingFlowSharePct: 20,
    conduitName: 'Skeletal Muscle Fascicles, Tendon Levers & Cortical Osteons',
    conduitThroughputUnit: 'N·m joint torque capacity',
    restingConduitThroughput: 180,
    restingDrivingPressureMmHg: 85,
    tissueBarrierName: 'Endomysial Capillary Bed & Osteon Canalicular Network',
    barrierThicknessUm: 0.6,
    kroghIntercapillaryRadiusUm: 25,
    basalTissueO2ConsumptionMlMin100g: 1.5,
    dominantCellType: 'Skeletal Myofiber (Type I/IIa) & Osteocyte Mechanosensor',
    restingMembranePotentialMv: -90,
    basalExcitationHz: 25,
    subcellularAnchorName: 'Sarcomere Actomyosin Lattice (2.2 µm) & DHPR-RyR1 Triad',
    keyGeneOrProteinSymbol: 'ACTA1 / RYR1',
    uniprotOrHgncId: 'UniProt: P68133 · HGNC:10483',
    pubchemAnchorCid: 5957,
    pubchemAnchorName: 'Adenosine Triphosphate (ATP)',
    stageNarratives: {
      'macro-body': 'Accounts for ~40% of body mass; receives ~20% of resting cardiac output (~1.0 L/min) and scales up to >80% during maximal locomotion.',
      'organ-conduit': 'Pennate muscle bellies transmit contractile force across collagenous myotendinous junctions and synovial joint capsules to generate skeletal lever torque.',
      'tissue-microvasculature': 'Exercise recruits dormant endomysial capillaries, shrinking Krogh diffusion radius while fluid shear through bone canaliculi stimulates osteocyte remodeling.',
      'cellular-architecture': 'Multinucleated myofibers (-90 mV) propagate neuromuscular endplate action potentials down T-tubules to mechanically gated DHPR-RyR1 triads.',
      'subcellular-molecular': 'Ca²⁺ binding to troponin C shifts tropomyosin, enabling myosin II heads to hydrolyze ATP and slide α-actin (ACTA1) filaments across the Z-disc.',
    },
    stageLandmarks: {
      'macro-body': ['Axial & appendicular skeleton', 'Locomotor muscle groups', 'Synovial joints & intervertebral discs'],
      'organ-conduit': ['Muscle fascicle & perimysium', 'Myotendinous junction', 'Articular hyaline cartilage'],
      'tissue-microvasculature': ['Endomysial capillary plexus', 'Haversian osteon & Volkmann canal', 'Neuromuscular junction motor endplate'],
      'cellular-architecture': ['Skeletal myofiber triad', 'Lacunar-canalicular osteocyte', 'Satellite stem cell'],
      'subcellular-molecular': ['DHPR-RyR1 mechanical coupler', 'Sarcomere actomyosin cross-bridge', 'Hydroxyapatite-collagen I fibril'],
    },
  },
  'sensory-ent': {
    systemId: 'sensory-ent',
    systemLabel: 'Sensory / ENT',
    restingFlowSharePct: 1,
    conduitName: 'Ocular Refracting Media & Vestibulocochlear Transduction Conduit',
    conduitThroughputUnit: 'bits/s sensory bandwidth',
    restingConduitThroughput: 1000,
    restingDrivingPressureMmHg: 65,
    tissueBarrierName: 'Choriocapillaris-RPE Barrier & Cochlear Stria Vascularis',
    barrierThicknessUm: 0.5,
    kroghIntercapillaryRadiusUm: 16,
    basalTissueO2ConsumptionMlMin100g: 9.2,
    dominantCellType: 'Retinal Photoreceptor & Cochlear Inner Hair Cell',
    restingMembranePotentialMv: -40,
    basalExcitationHz: 45,
    subcellularAnchorName: 'Rhodopsin Outer-Segment Disc & Stereocilia Tip-Link Channel',
    keyGeneOrProteinSymbol: 'RHO / TMC1',
    uniprotOrHgncId: 'UniProt: P08100 · HGNC:10012',
    pubchemAnchorCid: 5893,
    pubchemAnchorName: 'NAD⁺ (Retinal Dehydrogenase Cofactor)',
    stageNarratives: {
      'macro-body': 'Transduces photon wavefronts and acoustic/inertial mechanical energy into high-bandwidth cranial nerve (CN II, CN VIII) spike trains.',
      'organ-conduit': 'Cornea (~43 D) and crystalline lens focus light onto the foveola; tympanic-ossicular lever amplifies sound pressure ~22× into cochlear perilymph.',
      'tissue-microvasculature': 'High-flow choriocapillaris supplies avascular outer retina across Bruch membrane while stria vascularis maintains +80 mV endocochlear potential.',
      'cellular-architecture': 'Photoreceptors hyperpolarize (-40 mV → -65 mV) when light arrests dark current; inner hair cells depolarize via nm-scale stereocilia deflection.',
      'subcellular-molecular': '11-cis-retinal photoisomerization in rhodopsin (RHO) activates transducin-PDE6B cGMP hydrolysis; tip-link protocadherin-15 gates TMC1 mechanotransduction channels.',
    },
    stageLandmarks: {
      'macro-body': ['Eye, orbit & extraocular muscles', 'External, middle & inner ear', 'Nasal cavity, pharynx & larynx'],
      'organ-conduit': ['Cornea, lens & retinal macula', 'Ossicular chain (malleus-incus-stapes)', 'Cochlear scala media & semicircular canals'],
      'tissue-microvasculature': ['Ten-layer neurosensory retina & RPE', 'Organ of Corti & basilar membrane', 'Choriocapillaris & stria vascularis'],
      'cellular-architecture': ['Rod & cone photoreceptor', 'Inner & outer cochlear hair cell', 'Retinal ganglion cell'],
      'subcellular-molecular': ['Rhodopsin (RHO) GPCR disc', 'TMC1 tip-link channel', 'Cyclic nucleotide-gated (CNG) channel'],
    },
  },
  'integumentary-surface': {
    systemId: 'integumentary-surface',
    systemLabel: 'Integumentary',
    restingFlowSharePct: 5,
    conduitName: 'Cutaneous Thermoregulatory Arteriovenous Plexus & Exocrine Ducts',
    conduitThroughputUnit: 'mL/min cutaneous perfusion',
    restingConduitThroughput: 250,
    restingDrivingPressureMmHg: 70,
    tissueBarrierName: 'Dermal Papillary Capillary Loop & Dermo-Epidermal Basement Membrane',
    barrierThicknessUm: 0.7,
    kroghIntercapillaryRadiusUm: 27,
    basalTissueO2ConsumptionMlMin100g: 1.2,
    dominantCellType: 'Epidermal Keratinocyte, Melanocyte & Eccrine/Mammary Secretory Cell',
    restingMembranePotentialMv: -50,
    basalExcitationHz: 0.1,
    subcellularAnchorName: 'Desmosome-Keratin Intermediate Filament & Filaggrin Lipid Envelope',
    keyGeneOrProteinSymbol: 'FLG / KRT14',
    uniprotOrHgncId: 'UniProt: P20930 · HGNC:3748',
    pubchemAnchorCid: 439153,
    pubchemAnchorName: 'NADH (Epidermal Redox & Barrier Synthesis)',
    stageNarratives: {
      'macro-body': 'Forms the 1.8 m² outer barrier regulating convective/evaporative heat exchange (250 mL/min at rest up to 6–8 L/min in hyperthermia), innate immunity, and tactile sensation.',
      'organ-conduit': 'Subpapillary vascular plexuses, glomus arteriovenous shunts, eccrine sweat coils, pilosebaceous units, nail matrices, and mammary lactiferous lobes.',
      'tissue-microvasculature': 'Dermal papillary capillary loops nourish avascular stratified epidermis across the hemidesmosomal lamina lucida and lamina densa.',
      'cellular-architecture': 'Basal stem keratinocytes (KRT5/KRT14) proliferate and differentiate upward through spinous and granular layers into corneocytes while melanocytes transfer melanosomes.',
      'subcellular-molecular': 'Profilaggrin (FLG) cleavage, loricrin cross-linking, and lamellar ceramide extrusion assemble the waterproof stratum corneum lipid-protein mortar.',
    },
    stageLandmarks: {
      'macro-body': ['Epidermis, dermis & subcutis', 'Nail apparatus & pilosebaceous units', 'Breast & nipple-areola complex'],
      'organ-conduit': ['Cutaneous arterial plexus', 'Eccrine sweat gland & duct', 'Lactiferous lobe & sinus'],
      'tissue-microvasculature': ['Stratum basale → stratum corneum', 'Dermal papilla & Meissner corpuscle', 'Dermo-epidermal junction'],
      'cellular-architecture': ['Basal & granular keratinocyte', 'Epidermal melanocyte & Langerhans cell', 'Sebocyte & myoepithelial cell'],
      'subcellular-molecular': ['Filaggrin (FLG) barrier matrix', 'Keratin 5/14 (KRT14) tonofilament', 'Desmoglein-desmoplakin plaque'],
    },
  },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatCharacteristicLength(lengthMeters: number): string {
  if (lengthMeters >= 0.5) return `${lengthMeters.toFixed(2)} m`
  if (lengthMeters >= 0.01) return `${(lengthMeters * 100).toFixed(1)} cm`
  if (lengthMeters >= 0.001) return `${(lengthMeters * 1000).toFixed(1)} mm`
  if (lengthMeters >= 0.000001) return `${Math.round(lengthMeters * 1_000_000)} µm`
  return `${Math.round(lengthMeters * 1_000_000_000)} nm`
}

export function depth01ForStageId(stageId: VisualAtlasStageId): number {
  const found = VISUAL_ATLAS_STAGES.find((stage) => stage.id === stageId)
  if (!found) return 0
  return round2((found.depthRange01[0] + found.depthRange01[1]) / 2)
}

export function stageIdForSemanticScale(scale: BodySemanticScale): VisualAtlasStageId {
  switch (scale) {
    case 'whole-body':
    case 'system':
      return 'macro-body'
    case 'organ':
      return 'organ-conduit'
    case 'tissue':
      return 'tissue-microvasculature'
    case 'cell':
    case 'organelle':
      return 'cellular-architecture'
    case 'molecule':
    case 'genome':
      return 'subcellular-molecular'
  }
}

export function resolveStageFromScrollDepth(depth01: number): FiveStageScrollResolution {
  const safeDepth = clamp(Number.isFinite(depth01) ? depth01 : 0, 0, 1)
  const rawIndex = Math.min(4, Math.floor(safeDepth * 5))
  const activeStage = VISUAL_ATLAS_STAGES[rawIndex] ?? VISUAL_ATLAS_STAGES[0]!
  const [start, end] = activeStage.depthRange01
  const span = Math.max(0.0001, end - start)
  const stageLocalProgress01 = round2(clamp((safeDepth - start) / span, 0, 1))

  const logStart = Math.log10(1.7)
  const logEnd = Math.log10(2e-9)
  const currentLengthM = Math.pow(10, logStart + (logEnd - logStart) * safeDepth)
  const characteristicLengthLabel = formatCharacteristicLength(currentLengthM)

  const effectiveRelativeZoom = round2(Math.pow(120, safeDepth))

  return {
    depth01: round2(safeDepth),
    activeStageIndex: rawIndex,
    activeStageId: activeStage.id,
    activeStage,
    stageLocalProgress01,
    effectiveRelativeZoom,
    characteristicLengthLabel,
    semanticScale: activeStage.semanticScale,
    domainTarget: activeStage.domainTarget,
  }
}

export function evaluateFiveStagePhysiology(
  systemId: BodySystemId,
  input: FiveStageSimulationInput = FIVE_STAGE_DEFAULTS,
): FiveStageEvaluationResult {
  const { depth01, metabolicDriveFold, oxygenFraction } = input
  if (
    !Number.isFinite(depth01) ||
    !Number.isFinite(metabolicDriveFold) ||
    !Number.isFinite(oxygenFraction)
  ) {
    return {
      ok: false,
      reason: 'non-finite-input',
      detail: 'All multi-scale simulation inputs (depth01, metabolicDriveFold, oxygenFraction) must be finite numbers.',
    }
  }
  if (depth01 < 0 || depth01 > 1) {
    return {
      ok: false,
      reason: 'depth-out-of-range',
      detail: `Atlas scroll depth (${depth01}) must remain within [0.0, 1.0].`,
    }
  }
  if (metabolicDriveFold < 0.5 || metabolicDriveFold > 3.0) {
    return {
      ok: false,
      reason: 'metabolic-drive-out-of-range',
      detail: `Metabolic drive (${metabolicDriveFold}×) is outside the bounded physiological teaching envelope [0.5×, 3.0×].`,
    }
  }
  if (oxygenFraction < 0.12 || oxygenFraction > 1.0) {
    return {
      ok: false,
      reason: 'oxygen-fraction-out-of-range',
      detail: `Inspired oxygen fraction (${oxygenFraction}) is outside the bounded physiological teaching envelope [0.12, 1.00].`,
    }
  }

  const profile = SYSTEM_FIVE_STAGE_PROFILES[systemId] ?? SYSTEM_FIVE_STAGE_PROFILES.cardiovascular
  const scroll = resolveStageFromScrollDepth(depth01)

  const cardiacOutputLMin = round2(5.0 * (0.4 + 0.6 * metabolicDriveFold))
  const systemDemandFactor =
    systemId === 'musculoskeletal'
      ? 0.35 + 0.65 * Math.pow(metabolicDriveFold, 1.35)
      : systemId === 'cardiovascular' || systemId === 'respiratory'
        ? 0.4 + 0.6 * metabolicDriveFold
        : systemId === 'nervous'
          ? 0.85 + 0.15 * metabolicDriveFold
          : 0.65 + 0.35 * metabolicDriveFold

  const rawPerfusionMlMin = (5000 * (profile.restingFlowSharePct / 100)) * systemDemandFactor
  const systemPerfusionMlMin = Math.round(rawPerfusionMlMin)
  const systemFlowSharePct =
    profile.restingFlowSharePct === 100
      ? 100
      : round2(clamp((systemPerfusionMlMin / (cardiacOutputLMin * 1000)) * 100, 0.5, 85))
  const autonomicSympatheticIndex = round2(clamp(0.25 + (metabolicDriveFold - 0.5) * 0.3, 0.1, 1.0))

  const drivingPressureMmHg = round2(
    profile.restingDrivingPressureMmHg * (0.88 + 0.12 * metabolicDriveFold),
  )
  const organThroughputValue = round2(profile.restingConduitThroughput * systemDemandFactor)
  const conduitReserveIndex = round2(clamp(3.2 / Math.max(0.5, systemDemandFactor), 1.0, 4.0))

  const barometricDryMmHg = 760 - 47
  const alveolarPo2MmHg = clamp(oxygenFraction * barometricDryMmHg - 40 / (0.8 * Math.sqrt(metabolicDriveFold)), 38, 650)
  const kroghArterialPo2MmHg = round2(clamp(alveolarPo2MmHg * 0.94, 35, 610))
  const capillaryRecruitment = clamp(1 - (metabolicDriveFold - 1) * 0.14, 0.68, 1.08)
  const effectiveDiffusionRadiusUm = round2(profile.kroghIntercapillaryRadiusUm * capillaryRecruitment)
  const radialDropMmHg =
    (profile.basalTissueO2ConsumptionMlMin100g * metabolicDriveFold * effectiveDiffusionRadiusUm) / 9.5
  const kroghVenousPo2MmHg = round2(clamp(kroghArterialPo2MmHg - radialDropMmHg * 1.45, 14, kroghArterialPo2MmHg - 8))
  const kroghMinTissuePo2MmHg = round2(clamp(kroghVenousPo2MmHg - radialDropMmHg * 0.55, 6, kroghVenousPo2MmHg - 2))
  const starlingNetFiltrationMmHg = round2(1.2 + (metabolicDriveFold - 1.0) * 1.65)

  const hypoxiaDepolarizationMv = kroghMinTissuePo2MmHg < 22 ? (22 - kroghMinTissuePo2MmHg) * 0.65 : 0
  const restingMembranePotentialMv = round2(profile.restingMembranePotentialMv + hypoxiaDepolarizationMv)
  const cytosolicCalciumUm = round2(clamp(0.12 + 0.38 * metabolicDriveFold, 0.08, 1.8))
  const excitationFrequencyHz = round2(profile.basalExcitationHz * (0.6 + 0.4 * metabolicDriveFold))
  const naKAtpasePumpLoadPct = round2(clamp(28 * metabolicDriveFold + hypoxiaDepolarizationMv * 1.2, 14, 96))

  const oxygenSaturationFactor = clamp(kroghMinTissuePo2MmHg / (kroghMinTissuePo2MmHg + 4.5), 0.35, 0.99)
  const protonMotiveForceMv = round2(clamp(195 * oxygenSaturationFactor - (metabolicDriveFold - 1) * 6, 110, 210))
  const atpTurnoverMmolKgMin = round2(
    (profile.basalTissueO2ConsumptionMlMin100g * 2.6 * metabolicDriveFold * oxygenSaturationFactor),
  )
  const nadhToNadRatio = round2(clamp(0.14 * (metabolicDriveFold / oxygenSaturationFactor), 0.06, 0.85))

  const activeSources = ATLAS_LITERATURE_SOURCES.filter((source) =>
    scroll.activeStage.sourceIds.includes(source.id),
  )

  return {
    ok: true,
    system: profile,
    scroll,
    metrics: {
      stage1Macro: {
        cardiacOutputLMin,
        systemFlowSharePct,
        systemPerfusionMlMin,
        autonomicSympatheticIndex,
      },
      stage2Organ: {
        conduitName: profile.conduitName,
        drivingPressureMmHg,
        organThroughputValue,
        organThroughputUnit: profile.conduitThroughputUnit,
        conduitReserveIndex,
      },
      stage3Tissue: {
        tissueBarrierName: profile.tissueBarrierName,
        barrierThicknessUm: profile.barrierThicknessUm,
        kroghArterialPo2MmHg,
        kroghVenousPo2MmHg,
        kroghMinTissuePo2MmHg,
        effectiveDiffusionRadiusUm,
        starlingNetFiltrationMmHg,
      },
      stage4Cellular: {
        dominantCellType: profile.dominantCellType,
        restingMembranePotentialMv,
        cytosolicCalciumUm,
        excitationFrequencyHz,
        naKAtpasePumpLoadPct,
      },
      stage5Molecular: {
        subcellularAnchorName: profile.subcellularAnchorName,
        protonMotiveForceMv,
        atpTurnoverMmolKgMin,
        nadhToNadRatio,
        keyGeneOrProteinSymbol: profile.keyGeneOrProteinSymbol,
        uniprotOrHgncId: profile.uniprotOrHgncId,
        pubchemAnchorCid: profile.pubchemAnchorCid,
        pubchemAnchorName: profile.pubchemAnchorName,
      },
    },
    activeSources,
    boundaryNote: FIVE_STAGE_BOUNDARY_NOTE,
  }
}
