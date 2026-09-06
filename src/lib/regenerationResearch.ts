export type EvidenceLevel = 'reference-biology' | 'preclinical' | 'clinical-research' | 'speculative'

export interface AgingHallmark {
  id: string
  label: string
  description: string
  readouts: string[]
  pathways: string[]
}

export interface OrganAgingProfile {
  id: string
  label: string
  subtitle: string
  focusKeywords: string[]
  layerHints: Array<'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'>
  hallmarkIds: string[]
  cellTypes: string[]
  functionReadouts: string[]
  note: string
}

export interface RegenerationHypothesis {
  id: string
  label: string
  evidence: EvidenceLevel
  mechanism: string
  hallmarkIds: string[]
  compatibleOrgans: string[]
  targetSystems: string[]
  safetyGate: string
  mechanismSteps: string[]
}

export interface FourDPhase {
  id: string
  label: string
  hallmarkBurden: number
  cellularStress: number
  functionIndex: number
  heartRate: number
  respRate: number
  note: string
}

/**
 * The 12 hallmarks follow López-Otín et al., Cell 2023 (PMID: 36599349).
 * They are used as an educational/research ontology, never as a diagnosis.
 */
export const AGING_HALLMARKS: AgingHallmark[] = [
  {
    id: 'genomic-instability',
    label: 'Genomic instability',
    description: 'Accumulation of DNA lesions, replication errors and chromosome-level damage.',
    readouts: ['DNA-damage markers', 'somatic variant burden', 'chromosomal instability'],
    pathways: ['DNA damage response', 'repair pathways', 'replication stress'],
  },
  {
    id: 'telomere-attrition',
    label: 'Telomere attrition',
    description: 'Progressive telomere dysfunction that can constrain cellular renewal and promote stress responses.',
    readouts: ['telomere-length distributions', 'telomere dysfunction signals'],
    pathways: ['telomere maintenance', 'DNA damage response'],
  },
  {
    id: 'epigenetic-alterations',
    label: 'Epigenetic alterations',
    description: 'Age-associated drift in chromatin state, DNA methylation and transcriptional regulation.',
    readouts: ['methylation patterns', 'chromatin accessibility', 'transcriptomic state'],
    pathways: ['chromatin remodeling', 'transcriptional control'],
  },
  {
    id: 'loss-proteostasis',
    label: 'Loss of proteostasis',
    description: 'Reduced ability to fold, traffic and clear damaged proteins.',
    readouts: ['protein aggregation', 'proteasome activity', 'stress-response markers'],
    pathways: ['proteasome', 'unfolded protein response', 'chaperone systems'],
  },
  {
    id: 'disabled-macroautophagy',
    label: 'Disabled macroautophagy',
    description: 'Impaired autophagic recycling and quality control of cellular components.',
    readouts: ['autophagic flux', 'lysosomal state', 'organelle turnover'],
    pathways: ['autophagy', 'lysosome', 'mTOR-AMPK axis'],
  },
  {
    id: 'deregulated-nutrient-sensing',
    label: 'Deregulated nutrient sensing',
    description: 'Altered sensing of energetic and nutrient status that shifts repair, growth and maintenance programs.',
    readouts: ['metabolic signaling', 'insulin/IGF-related state', 'AMPK-mTOR activity'],
    pathways: ['AMPK', 'mTOR', 'sirtuin-related signaling'],
  },
  {
    id: 'mitochondrial-dysfunction',
    label: 'Mitochondrial dysfunction',
    description: 'Declining mitochondrial energy handling, quality control and stress signaling.',
    readouts: ['ATP-linked respiration', 'membrane potential', 'ROS balance', 'mtDNA state'],
    pathways: ['mitophagy', 'oxidative phosphorylation', 'mitochondrial stress response'],
  },
  {
    id: 'cellular-senescence',
    label: 'Cellular senescence',
    description: 'Persistent cell-cycle arrest with context-dependent secretory and tissue effects.',
    readouts: ['senescence markers', 'SASP-related signals', 'cell-cycle state'],
    pathways: ['cell-cycle checkpoints', 'senescence-associated signaling'],
  },
  {
    id: 'stem-cell-exhaustion',
    label: 'Stem-cell exhaustion',
    description: 'Reduced regenerative reserve and altered progenitor-cell function.',
    readouts: ['progenitor abundance', 'clonal dynamics', 'differentiation capacity'],
    pathways: ['self-renewal', 'lineage commitment', 'niche signaling'],
  },
  {
    id: 'altered-intercellular-communication',
    label: 'Altered intercellular communication',
    description: 'Disrupted endocrine, neural, immune and paracrine coordination across tissues.',
    readouts: ['cytokine networks', 'cell-cell ligand-receptor pairs', 'neuroendocrine signals'],
    pathways: ['ligand-receptor signaling', 'immune-neural communication'],
  },
  {
    id: 'chronic-inflammation',
    label: 'Chronic inflammation',
    description: 'Persistent low-grade inflammatory signaling that can amplify tissue dysfunction.',
    readouts: ['inflammatory mediators', 'immune-cell state', 'tissue inflammatory signatures'],
    pathways: ['innate immune signaling', 'cytokine signaling'],
  },
  {
    id: 'dysbiosis',
    label: 'Dysbiosis',
    description: 'Age-associated changes in host-microbiome ecology and metabolite signaling.',
    readouts: ['microbiome composition', 'microbial metabolites', 'barrier-related signals'],
    pathways: ['host-microbe signaling', 'barrier homeostasis'],
  },
]

export const ORGAN_AGING_PROFILES: OrganAgingProfile[] = [
  {
    id: 'brain',
    label: 'Brain & neurovascular unit',
    subtitle: 'Neurons · glia · BBB · microvasculature',
    focusKeywords: ['brain', 'cerebr', 'artery', 'carotid'],
    layerHints: ['nervous', 'cardiovascular', 'visceral'],
    hallmarkIds: ['mitochondrial-dysfunction', 'loss-proteostasis', 'chronic-inflammation', 'altered-intercellular-communication', 'cellular-senescence'],
    cellTypes: ['neuron', 'astrocyte', 'microglia', 'oligodendrocyte', 'brain endothelial cell', 'pericyte'],
    functionReadouts: ['network function', 'neurovascular coupling', 'barrier integrity', 'cerebral perfusion'],
    note: 'The neurovascular unit couples neural activity, endothelial function, glial signaling and perfusion; a single “brain age” value cannot represent all of these compartments.',
  },
  {
    id: 'eye',
    label: 'Eye, retina & optic pathway',
    subtitle: 'Retina · RPE · optic nerve · microvasculature',
    focusKeywords: ['eye', 'optic', 'retina'],
    layerHints: ['nervous', 'cardiovascular', 'visceral'],
    hallmarkIds: ['mitochondrial-dysfunction', 'loss-proteostasis', 'chronic-inflammation', 'cellular-senescence', 'epigenetic-alterations'],
    cellTypes: ['photoreceptor', 'retinal ganglion cell', 'RPE cell', 'Müller glia', 'retinal endothelial cell'],
    functionReadouts: ['visual function', 'retinal structure', 'optic-nerve integrity', 'retinal perfusion'],
    note: 'Retina and optic nerve are neural tissues with unusually high metabolic demand; ocular rejuvenation must be modeled at multiple cell types rather than as a cosmetic surface change.',
  },
  {
    id: 'heart',
    label: 'Heart & coronary circulation',
    subtitle: 'Cardiomyocyte · conduction · microvasculature',
    focusKeywords: ['heart', 'ventricle', 'atrium', 'coronary'],
    layerHints: ['cardiovascular', 'visceral'],
    hallmarkIds: ['mitochondrial-dysfunction', 'cellular-senescence', 'chronic-inflammation', 'loss-proteostasis', 'stem-cell-exhaustion'],
    cellTypes: ['cardiomyocyte', 'fibroblast', 'endothelial cell', 'vascular smooth-muscle cell'],
    functionReadouts: ['contractile function', 'electrophysiology', 'coronary perfusion', 'fibrotic burden'],
    note: 'Cardiac regeneration is constrained by limited cardiomyocyte turnover and by coupled electrical, mechanical and vascular requirements.',
  },
  {
    id: 'kidney',
    label: 'Kidney',
    subtitle: 'Glomerulus · tubule · interstitium · vasculature',
    focusKeywords: ['kidney', 'renal'],
    layerHints: ['visceral', 'cardiovascular'],
    hallmarkIds: ['cellular-senescence', 'mitochondrial-dysfunction', 'chronic-inflammation', 'stem-cell-exhaustion', 'altered-intercellular-communication'],
    cellTypes: ['podocyte', 'tubular epithelial cell', 'mesangial cell', 'renal endothelial cell'],
    functionReadouts: ['filtration', 'tubular transport', 'microvascular integrity', 'fibrotic burden'],
    note: 'Kidney aging combines vascular, epithelial and interstitial processes, so a universal intervention can improve one compartment while worsening another.',
  },
  {
    id: 'liver',
    label: 'Liver',
    subtitle: 'Hepatocyte · sinusoid · stellate · immune niche',
    focusKeywords: ['liver', 'hepatic'],
    layerHints: ['visceral', 'cardiovascular'],
    hallmarkIds: ['deregulated-nutrient-sensing', 'mitochondrial-dysfunction', 'cellular-senescence', 'chronic-inflammation', 'disabled-macroautophagy'],
    cellTypes: ['hepatocyte', 'Kupffer cell', 'stellate cell', 'sinusoidal endothelial cell'],
    functionReadouts: ['metabolic function', 'synthetic function', 'sinusoidal perfusion', 'fibrotic burden'],
    note: 'Liver has substantial regenerative capacity, but metabolic, inflammatory and fibrotic states strongly modify that capacity.',
  },
  {
    id: 'muscle',
    label: 'Skeletal muscle',
    subtitle: 'Myofiber · satellite cell · motor unit · capillary',
    focusKeywords: ['muscle', 'quadriceps', 'biceps'],
    layerHints: ['muscular', 'nervous', 'cardiovascular'],
    hallmarkIds: ['mitochondrial-dysfunction', 'stem-cell-exhaustion', 'deregulated-nutrient-sensing', 'chronic-inflammation', 'loss-proteostasis'],
    cellTypes: ['myofiber', 'satellite cell', 'motor neuron', 'endothelial cell'],
    functionReadouts: ['force', 'fatigue resistance', 'motor-unit integrity', 'capillary supply'],
    note: 'Muscle aging is a systems problem spanning muscle fibers, innervation, mitochondria, vasculature and stem-cell niches.',
  },
  {
    id: 'immune',
    label: 'Immune & hematopoietic system',
    subtitle: 'Bone marrow · lymphoid · innate/adaptive cells',
    focusKeywords: ['bone marrow', 'spleen', 'thymus', 'lymph'],
    layerHints: ['lymphoid', 'skeletal', 'cardiovascular'],
    hallmarkIds: ['stem-cell-exhaustion', 'chronic-inflammation', 'altered-intercellular-communication', 'epigenetic-alterations', 'genomic-instability'],
    cellTypes: ['hematopoietic stem cell', 'T cell', 'B cell', 'monocyte/macrophage', 'NK cell'],
    functionReadouts: ['immune repertoire', 'hematopoietic output', 'inflammatory tone', 'vaccine responsiveness'],
    note: 'Immune aging affects nearly every organ and is strongly shaped by clonal, inflammatory and stromal processes.',
  },
  {
    id: 'skin',
    label: 'Skin',
    subtitle: 'Epidermis · dermis · appendages · microvasculature',
    focusKeywords: ['skin'],
    layerHints: ['surface', 'cardiovascular', 'nervous'],
    hallmarkIds: ['stem-cell-exhaustion', 'cellular-senescence', 'epigenetic-alterations', 'loss-proteostasis', 'chronic-inflammation'],
    cellTypes: ['keratinocyte', 'fibroblast', 'melanocyte', 'endothelial cell'],
    functionReadouts: ['barrier function', 'wound healing', 'matrix integrity', 'pigment homeostasis'],
    note: 'Skin is accessible for longitudinal measurement but should not be treated as a proxy for every internal organ.',
  },
]

export const REGENERATION_HYPOTHESES: RegenerationHypothesis[] = [
  {
    id: 'mitochondrial-quality',
    label: 'Mitochondrial quality-control restoration',
    evidence: 'clinical-research',
    mechanism: 'Prioritizes evidence around mitochondrial turnover, bioenergetic resilience and stress-response normalization.',
    hallmarkIds: ['mitochondrial-dysfunction', 'disabled-macroautophagy', 'deregulated-nutrient-sensing'],
    compatibleOrgans: ['brain', 'eye', 'heart', 'kidney', 'liver', 'muscle'],
    targetSystems: ['mitophagy', 'AMPK–mTOR signaling', 'NAD-related metabolism', 'oxidative phosphorylation'],
    safetyGate: 'Must distinguish improved stress resilience from pathologic proliferation or energetic overload.',
    mechanismSteps: ['energy/stress readout', 'mitochondrial quality-control network', 'cellular resilience', 'tissue function'],
  },
  {
    id: 'senescence-network',
    label: 'Senescence-network modulation',
    evidence: 'clinical-research',
    mechanism: 'Explores evidence for reducing harmful senescence-associated signaling while preserving context-dependent tumor-suppressive and wound-healing functions.',
    hallmarkIds: ['cellular-senescence', 'chronic-inflammation', 'altered-intercellular-communication'],
    compatibleOrgans: ['brain', 'eye', 'heart', 'kidney', 'liver', 'muscle', 'immune', 'skin'],
    targetSystems: ['senescence-associated signaling', 'SASP-related networks', 'immune clearance'],
    safetyGate: 'Senescence can be protective; blanket removal is biologically unsafe and therefore never represented as a universal reset.',
    mechanismSteps: ['senescent-cell state', 'secretory signaling', 'immune/tissue interaction', 'organ-level effect'],
  },
  {
    id: 'proteostasis-autophagy',
    label: 'Proteostasis & autophagy restoration',
    evidence: 'clinical-research',
    mechanism: 'Maps interventions that improve protein quality control, lysosomal recycling and organelle turnover.',
    hallmarkIds: ['loss-proteostasis', 'disabled-macroautophagy', 'mitochondrial-dysfunction'],
    compatibleOrgans: ['brain', 'eye', 'heart', 'liver', 'muscle'],
    targetSystems: ['autophagy-lysosome system', 'proteasome', 'unfolded-protein response'],
    safetyGate: 'The tool does not assume that globally increasing degradation pathways is beneficial in every tissue or disease.',
    mechanismSteps: ['damaged protein/organelle', 'quality-control machinery', 'clearance/recycling', 'cell-state stabilization'],
  },
  {
    id: 'epigenetic-state',
    label: 'Epigenetic state restoration',
    evidence: 'preclinical',
    mechanism: 'Compares age-associated chromatin/transcriptional states with evidence for partial restoration of youthful regulatory programs.',
    hallmarkIds: ['epigenetic-alterations', 'stem-cell-exhaustion', 'altered-intercellular-communication'],
    compatibleOrgans: ['brain', 'eye', 'heart', 'kidney', 'liver', 'muscle', 'immune', 'skin'],
    targetSystems: ['chromatin state', 'DNA methylation', 'transcriptional networks'],
    safetyGate: 'No reprogramming factors, sequences, delivery recipes or human-use protocol are generated. Loss of cell identity and tumor risk must remain explicit.',
    mechanismSteps: ['age-shifted epigenome', 'regulatory-state perturbation', 'cell-identity checkpoint', 'functional-state hypothesis'],
  },
  {
    id: 'stem-niche',
    label: 'Stem/progenitor niche restoration',
    evidence: 'preclinical',
    mechanism: 'Focuses on tissue-specific progenitor reserve, niche signaling and differentiation quality rather than forcing global proliferation.',
    hallmarkIds: ['stem-cell-exhaustion', 'altered-intercellular-communication', 'chronic-inflammation'],
    compatibleOrgans: ['kidney', 'liver', 'muscle', 'immune', 'skin'],
    targetSystems: ['stem-cell niche', 'lineage signaling', 'matrix-cell interactions'],
    safetyGate: 'Any regenerative hypothesis must account for dysplasia, fibrosis and cancer risk from inappropriate proliferation.',
    mechanismSteps: ['niche state', 'progenitor competence', 'lineage commitment', 'tissue renewal'],
  },
  {
    id: 'genome-maintenance',
    label: 'Genome-maintenance research',
    evidence: 'preclinical',
    mechanism: 'Ranks evidence around DNA repair fidelity, replication stress and mutation burden without proposing germline or somatic editing instructions.',
    hallmarkIds: ['genomic-instability', 'telomere-attrition'],
    compatibleOrgans: ['brain', 'eye', 'heart', 'kidney', 'liver', 'muscle', 'immune', 'skin'],
    targetSystems: ['DNA repair', 'replication stress', 'telomere maintenance'],
    safetyGate: 'The sandbox can annotate sequencing results and target evidence but does not design DNA-editing sequences, vectors or delivery protocols.',
    mechanismSteps: ['sequence/lesion evidence', 'repair pathway', 'genome-stability state', 'cell/tissue consequence'],
  },
]

export const FOUR_D_PHASES: FourDPhase[] = [
  { id: 'baseline', label: 'Reference baseline', hallmarkBurden: 0.25, cellularStress: 0.20, functionIndex: 0.88, heartRate: 70, respRate: 14, note: 'Reference physiology; not a measured patient baseline.' },
  { id: 'aging', label: 'Accumulated aging burden', hallmarkBurden: 0.72, cellularStress: 0.70, functionIndex: 0.58, heartRate: 78, respRate: 16, note: 'Schematic multi-hallmark deterioration state.' },
  { id: 'perturbation', label: 'Research intervention hypothesis', hallmarkBurden: 0.55, cellularStress: 0.48, functionIndex: 0.66, heartRate: 74, respRate: 15, note: 'Directional hypothesis only; not a treatment prediction.' },
  { id: 'recovery', label: 'Recovery hypothesis', hallmarkBurden: 0.38, cellularStress: 0.32, functionIndex: 0.78, heartRate: 72, respRate: 14, note: 'Illustrates what a successful multi-scale response would look like if validated.' },
]

export const DISCOVERY_EVIDENCE_SOURCES = [
  { name: 'Open Targets', purpose: 'Target–disease evidence and prioritisation.' },
  { name: 'ChEMBL', purpose: 'Curated bioactivity and drug-like molecule evidence.' },
  { name: 'PubChem', purpose: 'Chemical structures, properties, bioactivity, safety and identifiers.' },
  { name: 'ClinVar / Ensembl', purpose: 'Variant and genomic annotation.' },
  { name: 'Reactome / UniProt', purpose: 'Pathway and protein mechanism mapping.' },
]

export const REGENERATION_FORMULAS = [
  {
    name: 'Normalized hallmark burden',
    formula: 'H = (Σ wᵢxᵢ) / (Σ wᵢ)',
    meaning: 'Weighted aggregate of normalized hallmark measurements xᵢ. Research summary only; weights require external validation.',
  },
  {
    name: 'Evidence-weighted target score',
    formula: 'T = 100·clamp(0.30G + 0.25M + 0.20R + 0.15O + 0.10P − S, 0, 1)',
    meaning: 'G genetics, M mechanism, R replicated evidence, O organ relevance, P pharmacologic support, S safety penalty.',
  },
  {
    name: 'Research recovery index',
    formula: 'RRI = 100·clamp(0.35ΔH + 0.25F + 0.20C + 0.20E − S, 0, 1)',
    meaning: 'ΔH hallmark improvement, F organ-function evidence, C cell-state recovery, E evidence quality, S safety penalty. Not a clinical outcome predictor.',
  },
]

export function evidenceWeight(level: EvidenceLevel): number {
  if (level === 'clinical-research') return 0.85
  if (level === 'preclinical') return 0.65
  if (level === 'reference-biology') return 0.55
  return 0.35
}

export function hypothesisFitScore(hypothesis: RegenerationHypothesis, organId: string, hallmarkId: string): number {
  const organ = hypothesis.compatibleOrgans.includes(organId) ? 1 : 0.35
  const hallmark = hypothesis.hallmarkIds.includes(hallmarkId) ? 1 : 0.25
  const evidence = evidenceWeight(hypothesis.evidence)
  // Educational ranking formula; explicitly not a treatment recommendation.
  return Math.round(100 * Math.min(1, 0.4 * organ + 0.35 * hallmark + 0.25 * evidence))
}
