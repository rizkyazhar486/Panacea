export type LongevityChallengeId =
  | 'epigenetic-drift'
  | 'senescence-immunosenescence'
  | 'ecm-crosslinking'
  | 'mitochondrial-decline'

export type ResearchReadiness = 'conceptual' | 'preclinical' | 'translational-bottleneck'

export interface LongevityResearchLever {
  id: string
  label: string
  mechanism: string
  primaryTradeoff: string
  readiness: ResearchReadiness
}

export interface LongevityResearchChallenge {
  id: LongevityChallengeId
  label: string
  scale: 'dna-epigenome' | 'cell' | 'tissue' | 'organelle' | 'system'
  problem: string
  readouts: readonly string[]
  levers: readonly LongevityResearchLever[]
}

export const LONGEVITY_RESEARCH_CHALLENGES: readonly LongevityResearchChallenge[] = [
  {
    id: 'epigenetic-drift',
    label: 'Epigenetic drift & partial reprogramming',
    scale: 'dna-epigenome',
    problem: 'Age-associated regulatory drift can alter cell identity and function; aggressive reprogramming creates a competing loss-of-identity and tumor-risk problem.',
    readouts: ['cell identity', 'chromatin architecture', 'epigenetic age signals', 'malignancy guardrails'],
    levers: [
      { id: 'pulsed-reprogramming', label: 'Pulsed partial reprogramming', mechanism: 'Model reversible, bounded identity restoration rather than a full pluripotency reset.', primaryTradeoff: 'rejuvenation signal vs loss of tissue identity / tumor risk', readiness: 'preclinical' },
      { id: 'chromatin-restoration', label: 'Chromatin architecture restoration', mechanism: 'Represent nuclear-envelope and heterochromatin restoration as a separate control axis from methylation-only clocks.', primaryTradeoff: 'structural restoration vs uncertain causal sufficiency', readiness: 'conceptual' },
    ],
  },
  {
    id: 'senescence-immunosenescence',
    label: 'Senescence & immunosenescence',
    scale: 'system',
    problem: 'Persistent senescent-cell burden and declining immune surveillance can reinforce inflammatory signaling while some senescence remains useful for repair.',
    readouts: ['senescent burden', 'SASP pressure', 'naive T-cell reserve', 'repair-preserving selectivity'],
    levers: [
      { id: 'selective-senolysis', label: 'Selective senescent-cell clearance', mechanism: 'Compare selective immune/targeted clearance concepts against indiscriminate removal.', primaryTradeoff: 'clearance efficiency vs loss of beneficial senescence', readiness: 'translational-bottleneck' },
      { id: 'thymic-rejuvenation', label: 'Thymic rejuvenation', mechanism: 'Model restoration of immune surveillance as an upstream systems lever.', primaryTradeoff: 'immune renewal vs safety and durable tissue control', readiness: 'translational-bottleneck' },
    ],
  },
  {
    id: 'ecm-crosslinking',
    label: 'ECM cross-linking & stiffness',
    scale: 'tissue',
    problem: 'Age-associated matrix cross-linking and glycation can increase stiffness, impair mechanotransduction, and contribute to vascular and tissue dysfunction.',
    readouts: ['matrix stiffness', 'cross-link burden', 'arterial compliance', 'cell-matrix signaling'],
    levers: [
      { id: 'crosslink-cleavage', label: 'Selective cross-link cleavage', mechanism: 'Represent a hypothetical catalytic strategy that lowers damaging cross-links while preserving collagen/elastin integrity.', primaryTradeoff: 'cross-link removal vs structural matrix damage', readiness: 'conceptual' },
    ],
  },
  {
    id: 'mitochondrial-decline',
    label: 'Mitochondrial mutations & bioenergetics',
    scale: 'organelle',
    problem: 'Mitochondrial genome damage and respiratory dysfunction can reduce bioenergetic reserve while mitochondrial delivery remains difficult.',
    readouts: ['ATP reserve', 'heteroplasmy proxy', 'oxidative stress', 'delivery efficiency'],
    levers: [
      { id: 'allotopic-expression', label: 'Allotopic expression', mechanism: 'Model nuclear expression plus mitochondrial protein import as a conceptual rescue path.', primaryTradeoff: 'expression rescue vs import/stoichiometry constraints', readiness: 'translational-bottleneck' },
      { id: 'mitochondrial-editing', label: 'Mitochondrial editing delivery', mechanism: 'Represent in-situ mitochondrial editing as a delivery-constrained research axis, not a clinical capability.', primaryTradeoff: 'editing reach vs organelle delivery and off-target uncertainty', readiness: 'preclinical' },
    ],
  },
] as const

export const LONGEVITY_COMMERCIALIZATION_BOTTLENECKS = [
  { dimension: 'Indication definition', bottleneck: 'Aging itself is not generally treated as a single approved therapeutic indication.', reality: 'Programs need disease- or function-specific endpoints rather than an immortality claim.' },
  { dimension: 'Trial duration & biomarkers', bottleneck: 'Lifespan outcomes are slow and difficult to validate prospectively.', reality: 'Surrogate biomarkers require rigorous validation before they can support regulatory decisions.' },
  { dimension: 'Delivery vectors', bottleneck: 'Systemic delivery faces tissue tropism, dose distribution, and immune-clearance constraints.', reality: 'Targeted delivery must be validated organ-by-organ and indication-by-indication.' },
] as const

export const LONGEVITY_RESEARCH_BOUNDARY =
  'Educational research-frontier simulation only. It does not predict lifespan, reverse aging, establish biological immortality, prescribe an intervention, represent patient-specific biology, or claim regulatory/clinical readiness.'
