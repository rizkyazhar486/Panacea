export type MicroScale = 'organ' | 'tissue' | 'cell' | 'organelle' | 'molecular' | 'gene'

export interface MicroLayer {
  id: string
  label: string
  scale: MicroScale
  entities: readonly string[]
  interactions: readonly string[]
  visualModes: readonly string[]
}

export interface OrganMicroWorld {
  id: string
  label: string
  layers: readonly MicroLayer[]
}

const layer = (
  id: string,
  label: string,
  scale: MicroScale,
  entities: readonly string[],
  interactions: readonly string[],
  visualModes: readonly string[] = ['orbit', 'explode', 'focus', 'trace', 'compare'],
): MicroLayer => ({ id, label, scale, entities, interactions, visualModes })

export const BODY_MICRO_WORLDS: readonly OrganMicroWorld[] = [
  {
    id: 'heart', label: 'Heart', layers: [
      layer('heart-organ', 'Chambers & great vessels', 'organ', ['atria', 'ventricles', 'valves', 'aorta', 'pulmonary trunk', 'coronary arteries'], ['fill', 'eject', 'conduct', 'perfuse']),
      layer('heart-tissue', 'Cardiac tissue architecture', 'tissue', ['myocardium', 'endocardium', 'epicardium', 'fibrous skeleton', 'conduction tissue'], ['contract', 'insulate', 'conduct', 'support']),
      layer('heart-cell', 'Cardiac cell neighborhood', 'cell', ['cardiomyocyte', 'fibroblast', 'endothelial cell', 'pacemaker cell', 'immune cell'], ['electrical coupling', 'mechanical coupling', 'matrix remodeling', 'paracrine signaling']),
      layer('heart-organelle', 'Cardiomyocyte organelles', 'organelle', ['mitochondria', 'sarcoplasmic reticulum', 'myofibrils', 'nucleus', 'T-tubules'], ['ATP supply', 'calcium cycling', 'force generation', 'gene expression']),
      layer('heart-molecular', 'Excitation-contraction molecules', 'molecular', ['actin', 'myosin', 'troponin', 'calcium channels', 'ryanodine receptor', 'SERCA'], ['calcium entry', 'calcium release', 'cross-bridge cycling', 'calcium reuptake']),
      layer('heart-gene', 'Cardiac gene programs', 'gene', ['sarcomeric genes', 'ion-channel genes', 'mitochondrial genes', 'matrix genes'], ['transcription', 'translation', 'stress response', 'remodeling']),
    ],
  },
  {
    id: 'brain', label: 'Brain', layers: [
      layer('brain-organ', 'Brain regions', 'organ', ['cortex', 'basal ganglia', 'thalamus', 'brainstem', 'cerebellum', 'white matter'], ['sense', 'integrate', 'plan', 'execute', 'regulate']),
      layer('brain-tissue', 'Neural tissue', 'tissue', ['gray matter', 'white matter', 'meninges', 'microvasculature', 'CSF interfaces'], ['network signaling', 'conduction', 'barrier exchange', 'fluid circulation']),
      layer('brain-cell', 'Neural cell neighborhood', 'cell', ['neuron', 'astrocyte', 'oligodendrocyte', 'microglia', 'endothelial cell', 'pericyte'], ['synaptic signaling', 'myelination', 'metabolic support', 'immune surveillance']),
      layer('brain-organelle', 'Neuronal organelles', 'organelle', ['synaptic vesicle', 'mitochondria', 'ER', 'Golgi', 'nucleus', 'cytoskeleton'], ['vesicle cycling', 'ATP supply', 'protein trafficking', 'axonal transport']),
      layer('brain-molecular', 'Synaptic molecules', 'molecular', ['glutamate receptors', 'GABA receptors', 'sodium channels', 'calcium channels', 'SNARE proteins'], ['depolarization', 'release', 'receptor activation', 'plasticity']),
      layer('brain-gene', 'Neural gene programs', 'gene', ['synaptic genes', 'myelin genes', 'ion-channel genes', 'plasticity genes'], ['activity-dependent transcription', 'protein synthesis', 'network adaptation']),
    ],
  },
  {
    id: 'lung', label: 'Lung', layers: [
      layer('lung-organ', 'Airway & lobar anatomy', 'organ', ['trachea', 'bronchi', 'lobes', 'segments', 'pleura', 'pulmonary vessels'], ['ventilate', 'distribute', 'perfuse', 'exchange']),
      layer('lung-tissue', 'Alveolar-interstitial unit', 'tissue', ['alveoli', 'interstitium', 'capillary bed', 'small airway', 'pleural surface'], ['gas diffusion', 'surface tension control', 'barrier defense']),
      layer('lung-cell', 'Pulmonary cell neighborhood', 'cell', ['type I pneumocyte', 'type II pneumocyte', 'alveolar macrophage', 'endothelial cell', 'club cell', 'ciliated cell'], ['gas exchange', 'surfactant production', 'clearance', 'mucociliary transport']),
      layer('lung-organelle', 'Pulmonary organelles', 'organelle', ['lamellar body', 'mitochondria', 'cilia', 'ER', 'nucleus'], ['surfactant storage', 'energy production', 'mucus transport', 'protein synthesis']),
      layer('lung-molecular', 'Gas-exchange molecular layer', 'molecular', ['surfactant proteins', 'aquaporins', 'ion channels', 'hemoglobin interface', 'tight-junction proteins'], ['surface stabilization', 'fluid transport', 'barrier integrity', 'oxygen transfer']),
      layer('lung-gene', 'Pulmonary gene programs', 'gene', ['surfactant genes', 'ciliogenesis genes', 'barrier genes', 'immune-response genes'], ['differentiation', 'repair', 'host defense']),
    ],
  },
  {
    id: 'liver', label: 'Liver', layers: [
      layer('liver-organ', 'Hepatic macroanatomy', 'organ', ['lobes', 'segments', 'portal vein', 'hepatic artery', 'hepatic veins', 'bile ducts'], ['receive', 'process', 'drain', 'secrete']),
      layer('liver-tissue', 'Lobular architecture', 'tissue', ['lobule', 'portal triad', 'sinusoids', 'space of Disse', 'bile canaliculi'], ['perfuse', 'exchange', 'detoxify', 'produce bile']),
      layer('liver-cell', 'Hepatic cell neighborhood', 'cell', ['hepatocyte', 'Kupffer cell', 'stellate cell', 'sinusoidal endothelial cell', 'cholangiocyte'], ['metabolism', 'immune surveillance', 'matrix regulation', 'bile transport']),
      layer('liver-organelle', 'Hepatocyte organelles', 'organelle', ['smooth ER', 'rough ER', 'mitochondria', 'peroxisome', 'Golgi', 'nucleus'], ['detoxification', 'protein synthesis', 'beta oxidation', 'energy production']),
      layer('liver-molecular', 'Hepatic metabolic network', 'molecular', ['cytochrome enzymes', 'albumin machinery', 'urea-cycle enzymes', 'lipid enzymes', 'bile transporters'], ['biotransformation', 'protein synthesis', 'nitrogen disposal', 'lipid handling']),
      layer('liver-gene', 'Hepatic gene programs', 'gene', ['metabolic genes', 'transport genes', 'acute-phase genes', 'fibrosis genes'], ['metabolic adaptation', 'secretory response', 'injury response']),
    ],
  },
  {
    id: 'kidney', label: 'Kidney', layers: [
      layer('kidney-organ', 'Renal macroanatomy', 'organ', ['cortex', 'medulla', 'pyramids', 'calyces', 'pelvis', 'renal vessels'], ['filter', 'concentrate', 'drain', 'regulate']),
      layer('kidney-tissue', 'Nephron landscape', 'tissue', ['glomerulus', 'proximal tubule', 'loop of Henle', 'distal tubule', 'collecting duct'], ['filter', 'reabsorb', 'secrete', 'concentrate']),
      layer('kidney-cell', 'Renal cell neighborhood', 'cell', ['podocyte', 'proximal tubular cell', 'macula densa cell', 'principal cell', 'intercalated cell', 'endothelial cell'], ['filtration', 'transport', 'sensing', 'water balance', 'acid-base control']),
      layer('kidney-organelle', 'Tubular transport organelles', 'organelle', ['mitochondria', 'apical membrane', 'basolateral membrane', 'endosome', 'nucleus'], ['ATP supply', 'solute transport', 'receptor recycling', 'gene regulation']),
      layer('kidney-molecular', 'Renal transport network', 'molecular', ['Na/K ATPase', 'aquaporins', 'NKCC', 'NCC', 'ENaC', 'H+ pumps'], ['sodium transport', 'water transport', 'acid secretion', 'electrolyte balance']),
      layer('kidney-gene', 'Renal gene programs', 'gene', ['transport genes', 'podocyte genes', 'RAAS-related genes', 'acid-base genes'], ['segment identity', 'homeostatic adaptation', 'injury response']),
    ],
  },
  {
    id: 'gut', label: 'Gastrointestinal Tract', layers: [
      layer('gut-organ', 'Luminal GI anatomy', 'organ', ['esophagus', 'stomach', 'duodenum', 'jejunum', 'ileum', 'colon', 'rectum'], ['propel', 'digest', 'absorb', 'store']),
      layer('gut-tissue', 'GI wall layers', 'tissue', ['mucosa', 'submucosa', 'muscularis propria', 'serosa', 'enteric plexuses'], ['secrete', 'absorb', 'contract', 'sense']),
      layer('gut-cell', 'Intestinal cell neighborhood', 'cell', ['enterocyte', 'goblet cell', 'Paneth cell', 'enteroendocrine cell', 'immune cell', 'smooth muscle cell'], ['absorb', 'secrete mucus', 'host defense', 'signal', 'motility']),
      layer('gut-organelle', 'Enterocyte organelles', 'organelle', ['microvilli', 'mitochondria', 'ER', 'Golgi', 'tight junction complex'], ['surface expansion', 'transport', 'protein processing', 'barrier maintenance']),
      layer('gut-molecular', 'Absorption network', 'molecular', ['nutrient transporters', 'ion channels', 'digestive enzymes', 'tight-junction proteins', 'hormone receptors'], ['uptake', 'secretion', 'barrier regulation', 'signaling']),
      layer('gut-gene', 'GI epithelial programs', 'gene', ['barrier genes', 'transport genes', 'secretory genes', 'immune-response genes'], ['renewal', 'specialization', 'repair', 'defense']),
    ],
  },
  {
    id: 'skin', label: 'Skin', layers: [
      layer('skin-organ', 'Surface map', 'organ', ['epidermal surface', 'appendages', 'regional thickness zones', 'vascular territories'], ['protect', 'sense', 'thermoregulate', 'signal']),
      layer('skin-tissue', 'Cutaneous layers', 'tissue', ['epidermis', 'dermis', 'subcutis', 'hair follicle', 'sweat gland', 'sebaceous gland'], ['barrier formation', 'matrix support', 'temperature control', 'secretion']),
      layer('skin-cell', 'Cutaneous cell neighborhood', 'cell', ['keratinocyte', 'melanocyte', 'Langerhans cell', 'fibroblast', 'endothelial cell', 'sensory cell'], ['keratinization', 'pigmentation', 'immune surveillance', 'matrix production']),
      layer('skin-organelle', 'Skin organelles', 'organelle', ['melanosome', 'keratin network', 'mitochondria', 'ER', 'nucleus'], ['pigment transfer', 'structural support', 'energy production', 'protein synthesis']),
      layer('skin-molecular', 'Barrier & pigment molecules', 'molecular', ['keratins', 'filaggrin', 'ceramides', 'melanin pathway enzymes', 'collagen'], ['barrier assembly', 'hydration', 'pigment synthesis', 'matrix mechanics']),
      layer('skin-gene', 'Cutaneous gene programs', 'gene', ['barrier genes', 'pigment genes', 'matrix genes', 'immune genes'], ['differentiation', 'pigmentation', 'repair', 'host defense']),
    ],
  },
  {
    id: 'eye', label: 'Eye', layers: [
      layer('eye-organ', 'Ocular anatomy', 'organ', ['cornea', 'anterior chamber', 'iris', 'lens', 'vitreous', 'retina', 'optic nerve'], ['refract', 'focus', 'transmit', 'transduce']),
      layer('eye-tissue', 'Ocular tissue layers', 'tissue', ['corneal layers', 'uvea', 'lens capsule', 'retinal layers', 'optic nerve head'], ['maintain transparency', 'regulate light', 'focus', 'transduce photons']),
      layer('eye-cell', 'Ocular cell neighborhood', 'cell', ['corneal epithelial cell', 'keratocyte', 'endothelial cell', 'photoreceptor', 'bipolar cell', 'ganglion cell', 'RPE cell'], ['barrier function', 'optics', 'phototransduction', 'signal relay', 'phagocytosis']),
      layer('eye-organelle', 'Photoreceptor organelles', 'organelle', ['outer segment discs', 'connecting cilium', 'mitochondria', 'synaptic terminal', 'nucleus'], ['photon capture', 'energy supply', 'protein trafficking', 'synaptic release']),
      layer('eye-molecular', 'Phototransduction network', 'molecular', ['opsins', 'transducin', 'cGMP pathway', 'ion channels', 'retinoid cycle molecules'], ['photon sensing', 'second-messenger signaling', 'membrane polarization', 'visual pigment recycling']),
      layer('eye-gene', 'Ocular gene programs', 'gene', ['photoreceptor genes', 'ciliary genes', 'matrix genes', 'angiogenesis genes'], ['retinal identity', 'outer-segment maintenance', 'barrier integrity', 'vascular regulation']),
    ],
  },
  {
    id: 'bone-muscle', label: 'Musculoskeletal Unit', layers: [
      layer('msk-organ', 'Bone-muscle-joint complex', 'organ', ['bone', 'muscle', 'tendon', 'ligament', 'cartilage', 'joint capsule'], ['support', 'move', 'stabilize', 'transmit load']),
      layer('msk-tissue', 'Mechanical tissues', 'tissue', ['cortical bone', 'trabecular bone', 'skeletal muscle', 'tendon', 'hyaline cartilage'], ['resist load', 'contract', 'transfer force', 'reduce friction']),
      layer('msk-cell', 'MSK cell neighborhood', 'cell', ['osteocyte', 'osteoblast', 'osteoclast', 'myocyte', 'tenocyte', 'chondrocyte'], ['sense load', 'form matrix', 'resorb matrix', 'contract', 'maintain tissue']),
      layer('msk-organelle', 'Contractile & matrix organelles', 'organelle', ['sarcomere', 'sarcoplasmic reticulum', 'mitochondria', 'nucleus', 'secretory apparatus'], ['force generation', 'calcium cycling', 'energy supply', 'matrix synthesis']),
      layer('msk-molecular', 'Mechanical molecular network', 'molecular', ['actin', 'myosin', 'titin', 'collagen', 'proteoglycans', 'calcium-handling proteins'], ['contract', 'store elastic energy', 'bear tension', 'resist compression']),
      layer('msk-gene', 'Mechanical tissue gene programs', 'gene', ['sarcomeric genes', 'collagen genes', 'matrix genes', 'bone-remodeling genes'], ['adaptation', 'repair', 'remodeling', 'load response']),
    ],
  },
  {
    id: 'immune', label: 'Immune & Lymphatic System', layers: [
      layer('immune-organ', 'Immune organs', 'organ', ['bone marrow', 'thymus', 'lymph nodes', 'spleen', 'mucosal lymphoid tissue'], ['produce', 'educate', 'filter', 'activate']),
      layer('immune-tissue', 'Immune microarchitecture', 'tissue', ['follicle', 'paracortex', 'sinus', 'red pulp', 'white pulp'], ['traffic', 'present antigen', 'expand clones', 'filter blood']),
      layer('immune-cell', 'Immune cell neighborhood', 'cell', ['neutrophil', 'macrophage', 'dendritic cell', 'T cell', 'B cell', 'plasma cell', 'NK cell'], ['recognize', 'engulf', 'present', 'kill', 'produce antibody', 'regulate']),
      layer('immune-organelle', 'Immune organelles', 'organelle', ['phagosome', 'lysosome', 'ER', 'Golgi', 'secretory vesicle', 'nucleus'], ['engulf', 'digest', 'present antigen', 'secrete', 'reprogram']),
      layer('immune-molecular', 'Immune signaling network', 'molecular', ['antibodies', 'TCR', 'BCR', 'cytokines', 'complement', 'pattern-recognition receptors'], ['bind', 'signal', 'amplify', 'opsonize', 'activate']),
      layer('immune-gene', 'Immune gene programs', 'gene', ['receptor rearrangement genes', 'cytokine genes', 'interferon-response genes', 'effector genes'], ['diversify receptors', 'activate', 'differentiate', 'form memory']),
    ],
  },
  {
    id: 'endocrine', label: 'Endocrine Network', layers: [
      layer('endo-organ', 'Endocrine organs', 'organ', ['hypothalamus', 'pituitary', 'thyroid', 'parathyroids', 'adrenals', 'pancreatic islets', 'gonads'], ['sense', 'secrete', 'feedback', 'coordinate']),
      layer('endo-tissue', 'Endocrine tissue architecture', 'tissue', ['follicles', 'islets', 'cortical zones', 'medulla', 'pituitary cell clusters'], ['synthesize hormone', 'store', 'release', 'respond to trophic signals']),
      layer('endo-cell', 'Endocrine cell neighborhood', 'cell', ['thyrocyte', 'parathyroid chief cell', 'adrenal cortical cell', 'chromaffin cell', 'beta cell', 'alpha cell'], ['synthesize', 'sense substrate', 'secrete', 'feedback']),
      layer('endo-organelle', 'Secretory organelles', 'organelle', ['secretory granule', 'ER', 'Golgi', 'mitochondria', 'nucleus'], ['synthesize peptide', 'process hormone', 'store', 'release', 'steroidogenesis']),
      layer('endo-molecular', 'Hormone signaling network', 'molecular', ['peptide hormones', 'steroid hormones', 'GPCRs', 'nuclear receptors', 'second messengers'], ['bind receptor', 'signal', 'transcribe', 'feedback']),
      layer('endo-gene', 'Endocrine gene programs', 'gene', ['hormone synthesis genes', 'receptor genes', 'steroidogenic genes', 'feedback-response genes'], ['differentiate', 'synthesize', 'respond', 'adapt']),
    ],
  },
] as const

export const BODY_MICRO_WORLD_COUNT = BODY_MICRO_WORLDS.length
export const BODY_MICRO_LAYER_COUNT = BODY_MICRO_WORLDS.reduce((sum, world) => sum + world.layers.length, 0)
export const BODY_MICRO_ENTITY_COUNT = BODY_MICRO_WORLDS.reduce((sum, world) => sum + world.layers.reduce((inner, item) => inner + item.entities.length, 0), 0)

export function microWorld(id: string) {
  return BODY_MICRO_WORLDS.find((world) => world.id === id)
}

export function microLayer(worldId: string, layerId: string) {
  return microWorld(worldId)?.layers.find((item) => item.id === layerId)
}

export function microWorldPath(worldId: string) {
  const world = microWorld(worldId)
  if (!world) return []
  const order: readonly MicroScale[] = ['organ', 'tissue', 'cell', 'organelle', 'molecular', 'gene']
  return order.map((scale) => world.layers.find((item) => item.scale === scale)).filter((value): value is MicroLayer => Boolean(value))
}

export function searchMicroWorlds(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return BODY_MICRO_WORLDS
  return BODY_MICRO_WORLDS.filter((world) => [world.label, ...world.layers.flatMap((item) => [item.label, ...item.entities, ...item.interactions])].join(' ').toLowerCase().includes(normalized))
}

export const BODY_MICRO_WORLD_RULES = {
  visualScaleTransitionsAreIllustrative: true,
  patientSpecific: false,
  sourceBackedGeometryPreferred: true,
  molecularScenesMayBeSchematic: true,
  goal: 'continuous organ-to-gene spatial learning without pretending molecular schematics are literal scale replicas',
} as const
