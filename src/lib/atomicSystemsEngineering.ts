export type AtomicScale = 'organism' | 'organ' | 'tissue' | 'cell' | 'organelle' | 'molecular' | 'atomic'

export type EvidenceState = 'established' | 'preclinical' | 'experimental' | 'hypothesis' | 'unsolved'

export interface AtomicChallenge {
  id: string
  title: string
  scale: AtomicScale
  problem: string
  mechanism: string
  interventions: string[]
  bottlenecks: string[]
  evidence: EvidenceState
  solved: boolean
}

export const ATOMIC_CHALLENGES: AtomicChallenge[] = [
  {
    id: 'dna-origami', title: 'DNA/RNA structural mechanics', scale: 'molecular',
    problem: 'Build addressable nanoscale carriers and logic without assuming atomic precision that has not been measured.',
    mechanism: 'Nucleic-acid hybridisation can encode geometry, aptamer locks and conditional conformational changes.',
    interventions: ['DNA-origami nanocage', 'aptamer-gated payload release', 'senescent-cell recognition logic'],
    bottlenecks: ['serum nuclease degradation', 'RES clearance', 'delivery', 'manufacturing yield', 'in-vivo structural uncertainty'],
    evidence: 'experimental', solved: false,
  },
  {
    id: 'de-novo-protein', title: 'De novo enzyme & protein architecture', scale: 'atomic',
    problem: 'Design catalytic structures that discriminate pathological molecular damage from native biomolecules.',
    mechanism: 'Structure-conditioned protein design can explore binding pockets, catalytic residues and conformational ensembles.',
    interventions: ['AGE/glucosepane-cleavage concept', 'synthetic DNA-repair complex', 'selective protein de-aggregator'],
    bottlenecks: ['catalytic selectivity', 'off-target cleavage', 'immunogenicity', 'folding dynamics', 'in-vivo validation'],
    evidence: 'hypothesis', solved: false,
  },
  {
    id: 'molecular-motors', title: 'Molecular motors & synthetic actuators', scale: 'atomic',
    problem: 'Convert local energy into controlled molecular motion without indiscriminate membrane or tissue injury.',
    mechanism: 'Photo-, chemical- or ATP-coupled molecular machines can generate nanoscale conformational or rotational motion.',
    interventions: ['targeted actuator', 'aggregate-disassembly concept', 'organelle-localised mechanical intervention'],
    bottlenecks: ['targeting', 'deep-tissue energy delivery', 'thermal/mechanical collateral damage', 'clearance', 'control'],
    evidence: 'experimental', solved: false,
  },
  {
    id: 'precision-editing', title: 'Atomic-scale genetic & epigenetic editing', scale: 'atomic',
    problem: 'Alter selected bases or chromatin marks while preserving genome integrity, cell identity and tissue function.',
    mechanism: 'Base/prime editors and locus-targeted chromatin enzymes can alter sequence or regulatory state without modelling them as magic atom manipulators.',
    interventions: ['base editing', 'prime editing', 'locus-specific TET/DNMT modulation', 'mitochondrial editing research'],
    bottlenecks: ['delivery', 'off-target edits', 'bystander edits', 'mosaicism', 'immune response', 'long-term oncogenic risk'],
    evidence: 'preclinical', solved: false,
  },
  {
    id: 'epigenetic-reprogramming', title: 'Partial reprogramming', scale: 'cell',
    problem: 'Restore youthful regulatory state without loss of cell identity, dedifferentiation or tumorigenesis.',
    mechanism: 'Transient reprogramming-factor exposure can perturb epigenetic state, but safe stop conditions remain an active research problem.',
    interventions: ['pulsatile factor exposure', 'tissue-specific delivery', 'chromatin-state monitoring'],
    bottlenecks: ['teratoma/tumour risk', 'identity loss', 'organ-specific dosing', 'durability', 'human endpoint validation'],
    evidence: 'preclinical', solved: false,
  },
  {
    id: 'senescence-immunity', title: 'Senescence & immunosenescence', scale: 'cell',
    problem: 'Remove harmful senescent-cell burden while preserving context-dependent beneficial senescence and immune function.',
    mechanism: 'Target recognition plus immune or pharmacologic clearance can change senescent-cell burden and SASP signalling.',
    interventions: ['selective senolytic concept', 'immune-cell targeting concept', 'thymic rejuvenation research'],
    bottlenecks: ['marker specificity', 'beneficial senescence', 'immune exhaustion', 'tissue heterogeneity', 'clinical endpoints'],
    evidence: 'experimental', solved: false,
  },
  {
    id: 'ecm-crosslinks', title: 'ECM cross-links & stiffness', scale: 'tissue',
    problem: 'Reverse pathological cross-linking while preserving collagen/elastin architecture and mechanical strength.',
    mechanism: 'Cross-link chemistry changes matrix mechanics and cell-matrix signalling; selective bond cleavage is not a solved therapy.',
    interventions: ['cross-link cleavage research', 'matrix-remodelling enzyme design', 'mechanical stiffness mapping'],
    bottlenecks: ['glucosepane selectivity', 'dense-matrix access', 'protein damage', 'organ-specific mechanics'],
    evidence: 'unsolved', solved: false,
  },
  {
    id: 'mitochondrial-genome', title: 'Mitochondrial genome & bioenergetics', scale: 'organelle',
    problem: 'Correct pathogenic mitochondrial sequence or function across enough mitochondria and cells to change tissue phenotype.',
    mechanism: 'Mitochondrial genetics, heteroplasmy, import constraints and respiratory-chain stoichiometry couple genotype to bioenergetics.',
    interventions: ['mitochondrial base-editing research', 'allotopic-expression research', 'organelle-targeted delivery'],
    bottlenecks: ['double-membrane delivery', 'heteroplasmy threshold', 'multi-tissue distribution', 'long-term expression'],
    evidence: 'experimental', solved: false,
  },
]

export const SCALE_ORDER: AtomicScale[] = ['organism', 'organ', 'tissue', 'cell', 'organelle', 'molecular', 'atomic']

export function unresolvedAtOrBelow(scale: AtomicScale) {
  const index = SCALE_ORDER.indexOf(scale)
  return ATOMIC_CHALLENGES.filter((challenge) => SCALE_ORDER.indexOf(challenge.scale) >= index && !challenge.solved)
}

export const ATOMIC_SIMULATION_DISCLOSURE =
  'Research sandbox only. Visual states are conceptual or evidence-labelled educational models, not atomistic molecular-dynamics output, not a validated therapy, and not proof that an unsolved biomedical problem has been solved.'
