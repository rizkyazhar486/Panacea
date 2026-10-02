export type LongevityProgramId =
  | 'epigenetic-reprogramming'
  | 'senescence-immunity'
  | 'ecm-crosslinking'
  | 'mitochondrial-genome'
  | 'proteostasis-autophagy'
  | 'stem-cell-regeneration'
  | 'nutrient-sensing-metabolism'
  | 'inflammaging-network'

export interface LongevityLever {
  id: string
  label: string
  question: string
  mechanism: string
  primaryConstraint: string
  mechanismWeight: number
  safetyWeight: number
  translationWeight: number
  uncertaintyWeight: number
}

export interface LongevityProgram {
  id: LongevityProgramId
  title: string
  shortTitle: string
  coreProblem: string
  biologicalLayer: string
  failureMode: string
  successCondition: string
  levers: readonly LongevityLever[]
}

export interface LongevitySimulationInput {
  intensities: Readonly<Record<string, number>>
  deliverySpecificity: number
  reversibility: number
  validationStrength: number
}

export interface LongevitySimulationOutput {
  mechanismSignal: number
  safetyMargin: number
  translationalReadiness: number
  residualUncertainty: number
  systemicBalance: number
  dominantRisks: readonly string[]
}

const clamp = (value: number) => Math.max(0, Math.min(100, value))

const lever = (
  id: string,
  label: string,
  question: string,
  mechanism: string,
  primaryConstraint: string,
  mechanismWeight: number,
  safetyWeight: number,
  translationWeight: number,
  uncertaintyWeight: number,
): LongevityLever => ({
  id,
  label,
  question,
  mechanism,
  primaryConstraint,
  mechanismWeight,
  safetyWeight,
  translationWeight,
  uncertaintyWeight,
})

export const LONGEVITY_PROGRAMS: readonly LongevityProgram[] = [
  {
    id: 'epigenetic-reprogramming',
    title: 'Epigenetic drift & partial reprogramming',
    shortTitle: 'Epigenome',
    coreProblem: 'Aging cells progressively lose stable gene-regulatory state, but complete reprogramming can erase identity and create oncogenic or pluripotency risk.',
    biologicalLayer: 'DNA methylation · histone state · chromatin topology · nuclear architecture',
    failureMode: 'Cell identity loss, dysregulated transcription, malignant transformation, or tissue de-differentiation.',
    successCondition: 'Restore youthful regulatory function while preserving lineage identity, genome integrity and tissue architecture.',
    levers: [
      lever('epi-pulse', 'Pulsatile partial reprogramming', 'Can transient factor exposure restore function without crossing into pluripotency?', 'Time-bounded reprogramming pulses with explicit off-state recovery.', 'Reliable stop-switches and tissue-specific exposure.', 0.95, -0.55, 0.55, 0.75),
      lever('epi-target', 'Organ-specific delivery', 'Can reprogramming be restricted to selected tissues?', 'Spatial targeting through vector tropism, local delivery or programmable expression.', 'Off-target transduction and immune clearance.', 0.75, 0.45, 0.45, 0.55),
      lever('epi-identity', 'Identity-preservation sensors', 'Can loss of lineage identity be detected before irreversible drift?', 'Monitor lineage markers and stress states as hard stop conditions.', 'Sensing latency and incomplete marker coverage.', 0.55, 0.75, 0.35, 0.45),
      lever('epi-chromatin', 'Chromatin architecture restoration', 'Can 3D nuclear organization be repaired rather than only methylation marks?', 'Target lamina organization, heterochromatin domains and higher-order chromatin state.', 'Mechanistic complexity and weak causal resolution.', 0.8, -0.1, 0.25, 0.85),
    ],
  },
  {
    id: 'senescence-immunity',
    title: 'Senescent-cell dynamics & immunosenescence',
    shortTitle: 'Senescence',
    coreProblem: 'Damaging senescent cells accumulate while immune surveillance weakens, yet some senescence is transiently useful for repair and tumor suppression.',
    biologicalLayer: 'SASP · innate clearance · adaptive surveillance · thymic output',
    failureMode: 'Chronic inflammatory signaling, tissue dysfunction, impaired surveillance, or over-clearance of beneficial repair states.',
    successCondition: 'Remove harmful senescent populations while preserving context-dependent beneficial senescence and restoring immune competence.',
    levers: [
      lever('sen-marker', 'Context-specific senescence targeting', 'Can destructive senescent states be distinguished from repair-associated states?', 'Multi-marker targeting instead of one universal senescence antigen.', 'Heterogeneous markers and temporal state changes.', 0.9, 0.55, 0.4, 0.7),
      lever('sen-cell', 'Engineered immune clearance', 'Can cell therapies selectively remove damaging senescent cells?', 'CAR-like, bispecific or immune-engager concepts gated by target identity.', 'On-target/off-tissue injury and immune toxicity.', 0.8, -0.35, 0.25, 0.75),
      lever('sen-nano', 'Targeted senolytic delivery', 'Can senolytic exposure be concentrated where burden is highest?', 'Targeted particles or pro-drug activation to reduce systemic exposure.', 'Delivery specificity and tissue penetration.', 0.65, 0.35, 0.5, 0.55),
      lever('sen-thymus', 'Thymic rejuvenation', 'Can adult thymic function and naïve T-cell output be restored safely?', 'Regenerative support for thymic epithelium and immune repertoire renewal.', 'Autoimmunity, architecture and durable function.', 0.75, -0.05, 0.2, 0.85),
    ],
  },
  {
    id: 'ecm-crosslinking',
    title: 'Extracellular-matrix cross-linking & stiffness',
    shortTitle: 'ECM mechanics',
    coreProblem: 'Long-lived matrix proteins accumulate glycation-derived cross-links and structural damage that alter tissue mechanics and cell-matrix signaling.',
    biologicalLayer: 'Collagen · elastin · basement membrane · mechanotransduction',
    failureMode: 'Arterial stiffness, impaired compliance, fibrosis and distorted mechanosignaling.',
    successCondition: 'Reduce pathological cross-links without degrading the underlying matrix or destabilizing tissue mechanics.',
    levers: [
      lever('ecm-cleave', 'Selective cross-link cleavage', 'Can persistent cross-links such as glucosepane be severed without damaging collagen?', 'Catalytic recognition of cross-link chemistry with protein-sparing cleavage.', 'Chemical selectivity inside dense matrix.', 0.9, -0.25, 0.2, 0.9),
      lever('ecm-map', 'Cross-link mapping', 'Can cross-link burden be mapped by tissue and matrix compartment?', 'Spatial molecular imaging and biochemical profiling before intervention.', 'Lack of validated in-vivo mapping tools.', 0.45, 0.75, 0.5, 0.55),
      lever('ecm-remodel', 'Controlled matrix remodeling', 'Can damaged matrix be replaced while preserving organ mechanics?', 'Couple degradation, synthesis and mechanical feedback in a bounded remodeling window.', 'Fibrosis, rupture and maladaptive repair.', 0.7, -0.2, 0.3, 0.75),
      lever('ecm-mech', 'Mechanotransduction reset', 'Can abnormal stiffness signaling be normalized even before matrix replacement?', 'Modulate cell-matrix signaling downstream of pathological stiffness.', 'Transient signaling benefit without structural repair.', 0.5, 0.2, 0.55, 0.5),
    ],
  },
  {
    id: 'mitochondrial-genome',
    title: 'Mitochondrial mutations & bioenergetic collapse',
    shortTitle: 'Mitochondria',
    coreProblem: 'Mitochondrial genomes and quality-control systems accumulate defects, but mitochondrial membranes and genetic code create unusual delivery constraints.',
    biologicalLayer: 'mtDNA · respiratory chain · mitophagy · mitochondrial import',
    failureMode: 'Clonal mutant expansion, impaired ATP production, redox stress and loss of organ reserve.',
    successCondition: 'Restore respiratory capacity while preventing harmful heteroplasmy shifts, off-target editing and proteostatic overload.',
    levers: [
      lever('mito-allotopic', 'Allotopic expression', 'Can mitochondrial proteins be safely encoded in the nucleus and imported back?', 'Nuclear expression paired with mitochondrial targeting sequences.', 'Import efficiency, stoichiometry and membrane insertion.', 0.75, 0.0, 0.25, 0.8),
      lever('mito-editor', 'Mitochondria-targeted editing', 'Can pathogenic mtDNA variants be edited in situ without conventional CRISPR import?', 'Mitochondrial-compatible nucleic-acid editing or selective genome depletion.', 'Delivery, off-target effects and heteroplasmy dynamics.', 0.95, -0.35, 0.2, 0.85),
      lever('mito-delivery', 'Double-membrane delivery', 'Can cargo cross cellular and mitochondrial membranes with useful specificity?', 'Engineered lipid/protein carriers and organelle-targeting chemistry.', 'Endosomal escape and inner-membrane access.', 0.7, 0.1, 0.35, 0.75),
      lever('mito-quality', 'Mitophagy & biogenesis balance', 'Can damaged organelles be cleared while preserving energetic reserve?', 'Coordinate quality control, biogenesis and metabolic demand.', 'Over-clearance or compensatory stress.', 0.6, 0.35, 0.5, 0.55),
    ],
  },
  {
    id: 'proteostasis-autophagy',
    title: 'Proteostasis & autophagy failure',
    shortTitle: 'Proteostasis',
    coreProblem: 'Protein folding, degradation and organelle recycling become less reliable with age, allowing damaged proteins and aggregates to accumulate.',
    biologicalLayer: 'Chaperones · proteasome · lysosome · autophagy',
    failureMode: 'Aggregate toxicity, stalled recycling, impaired stress adaptation and organelle dysfunction.',
    successCondition: 'Increase quality-control capacity without indiscriminate catabolism or destabilizing essential proteins.',
    levers: [
      lever('prot-autophagy', 'Selective autophagy enhancement', 'Can damaged cargo be removed without global catabolic stress?', 'Cargo-selective autophagy and lysosomal flux.', 'Specificity and nutrient-state dependence.', 0.7, 0.2, 0.55, 0.55),
      lever('prot-chaperone', 'Proteome stabilization', 'Can folding support be increased only where proteotoxic stress is high?', 'Stress-responsive chaperone support and folding surveillance.', 'Network compensation and chronic activation.', 0.55, 0.45, 0.55, 0.45),
      lever('prot-lysosome', 'Lysosomal restoration', 'Can lysosomal acidity, trafficking and clearance be restored?', 'Repair lysosomal function and substrate handling.', 'Cell-type variation and storage burden.', 0.6, 0.25, 0.45, 0.6),
      lever('prot-aggregate', 'Aggregate-selective removal', 'Can pathological aggregates be cleared without removing functional assemblies?', 'Recognition of disease-associated conformers or tagged aggregates.', 'Target discrimination and tissue penetration.', 0.65, 0.1, 0.4, 0.65),
    ],
  },
  {
    id: 'stem-cell-regeneration',
    title: 'Stem-cell exhaustion & regenerative reserve',
    shortTitle: 'Regeneration',
    coreProblem: 'Tissue-specific stem and progenitor pools lose regenerative capacity while their niches also deteriorate.',
    biologicalLayer: 'Stem cells · niche · lineage fidelity · regenerative signaling',
    failureMode: 'Poor repair, clonal skew, fibrosis, exhaustion or malignant expansion.',
    successCondition: 'Restore regenerative reserve while maintaining lineage control and genomic quality.',
    levers: [
      lever('stem-niche', 'Niche restoration', 'Can the aged niche be repaired before manipulating the stem cell itself?', 'Restore matrix, vascular, immune and paracrine support.', 'Multi-cellular causality and tissue specificity.', 0.65, 0.4, 0.45, 0.65),
      lever('stem-expand', 'Controlled progenitor expansion', 'Can functional cells be expanded without clonal selection?', 'Transient proliferative support with lineage checkpoints.', 'Oncogenesis and clonal hematopoiesis-like selection.', 0.75, -0.45, 0.35, 0.7),
      lever('stem-replace', 'Cell replacement', 'Can depleted populations be safely replaced and integrated?', 'Ex-vivo or in-situ replacement with integration monitoring.', 'Engraftment, immune compatibility and ectopic growth.', 0.8, -0.25, 0.3, 0.75),
      lever('stem-lineage', 'Lineage-fidelity monitoring', 'Can drift be detected before function is lost?', 'Longitudinal lineage and state surveillance.', 'Sampling limits and uncertain intervention thresholds.', 0.45, 0.7, 0.4, 0.5),
    ],
  },
  {
    id: 'nutrient-sensing-metabolism',
    title: 'Nutrient sensing & metabolic resilience',
    shortTitle: 'Metabolism',
    coreProblem: 'Energy sensing and growth pathways become dysregulated across tissues, with trade-offs between repair, growth and maintenance.',
    biologicalLayer: 'AMPK · mTOR · insulin/IGF signaling · NAD-linked metabolism',
    failureMode: 'Metabolic inflexibility, inappropriate growth signaling, impaired repair or loss of reserve.',
    successCondition: 'Restore context-dependent metabolic flexibility rather than forcing one pathway permanently high or low.',
    levers: [
      lever('met-cycle', 'Adaptive pathway cycling', 'Can anabolic and maintenance states be timed instead of chronically shifted?', 'Time-sequenced modulation aligned to feeding, activity and repair state.', 'Human translation and tissue asynchrony.', 0.5, 0.5, 0.55, 0.55),
      lever('met-sensor', 'Metabolic state sensing', 'Can tissue state be measured before perturbation?', 'Multi-omic and physiological state estimation.', 'Biomarker validity and cost.', 0.35, 0.8, 0.55, 0.4),
      lever('met-reserve', 'Energetic reserve restoration', 'Can stress tolerance improve without simply increasing growth?', 'Support substrate flexibility and mitochondrial reserve.', 'System-level trade-offs.', 0.55, 0.35, 0.5, 0.5),
      lever('met-personalization', 'Context stratification', 'Can interventions be stratified by disease state instead of chronological age alone?', 'Indication- and phenotype-bounded research cohorts.', 'Heterogeneity and surrogate endpoints.', 0.4, 0.65, 0.6, 0.45),
    ],
  },
  {
    id: 'inflammaging-network',
    title: 'Inflammaging & systemic signaling',
    shortTitle: 'Inflammaging',
    coreProblem: 'Persistent low-grade inflammatory signaling emerges from multiple tissues and can both drive and reflect damage.',
    biologicalLayer: 'Innate sensing · cytokine networks · barrier tissues · immune-metabolic feedback',
    failureMode: 'Chronic inflammatory tone, tissue damage, immune exhaustion and loss of repair coordination.',
    successCondition: 'Reduce maladaptive chronic signaling without suppressing protective immunity or wound responses.',
    levers: [
      lever('inf-source', 'Source-resolved inflammation', 'Can dominant inflammatory sources be identified by tissue and trigger?', 'Separate barrier, senescent, metabolic and immune drivers.', 'Shared cytokines create ambiguous attribution.', 0.65, 0.55, 0.45, 0.6),
      lever('inf-feedback', 'Feedback-loop interruption', 'Can self-reinforcing inflammatory loops be interrupted without broad immunosuppression?', 'Targeted interruption of defined signaling loops.', 'Redundancy and infection risk.', 0.7, -0.05, 0.4, 0.6),
      lever('inf-barrier', 'Barrier restoration', 'Can gut, skin and vascular barrier dysfunction be repaired upstream?', 'Improve structural integrity and local immune homeostasis.', 'Multiple barriers and uncertain causal order.', 0.5, 0.45, 0.55, 0.55),
      lever('inf-resolution', 'Pro-resolution signaling', 'Can inflammatory resolution be restored rather than only blocking initiation?', 'Support endogenous resolution pathways and repair transitions.', 'Context dependence and incomplete biomarkers.', 0.55, 0.25, 0.45, 0.6),
    ],
  },
] as const

export const LONGEVITY_TRANSLATION_BOTTLENECKS = [
  {
    id: 'indication',
    dimension: 'Indication definition',
    bottleneck: 'A broad “aging” treatment claim lacks a single established approval pathway and clinically actionable endpoint.',
    reality: 'Programs generally need defined diseases, functional impairments or measurable risk states with prospectively specified endpoints.',
  },
  {
    id: 'biomarkers',
    dimension: 'Trial duration & biomarkers',
    bottleneck: 'Lifespan and late morbidity endpoints are slow, while many aging biomarkers are not validated surrogate endpoints for clinical benefit.',
    reality: 'Biomarkers can support mechanism and stratification, but regulatory acceptance depends on context of use and demonstrated relationship to meaningful outcomes.',
  },
  {
    id: 'delivery',
    dimension: 'Delivery vectors',
    bottleneck: 'Systemic delivery faces organ tropism, dose distribution, repeat-dosing and immune-clearance constraints.',
    reality: 'Targeted LNPs, viral vectors, local delivery and inducible systems each trade reach, durability, manufacturability and immunogenicity.',
  },
  {
    id: 'manufacturing',
    dimension: 'Manufacturing & quality',
    bottleneck: 'Complex cell, gene and nanoparticle products require reproducible identity, potency, purity and batch consistency.',
    reality: 'CMC scalability, release assays and long-term stability can become the limiting step even when biology is compelling.',
  },
  {
    id: 'surveillance',
    dimension: 'Long-term safety',
    bottleneck: 'Reprogramming, genome editing and durable immune engineering can create risks that appear long after initial dosing.',
    reality: 'Long-term follow-up, malignancy surveillance and delayed adverse-event monitoring can be integral to development plans.',
  },
] as const

export const LONGEVITY_RESEARCH_BOUNDARY =
  'Research-frontier simulator only. Scores are synthetic visualization heuristics, not measured biology, efficacy predictions, treatment recommendations, regulatory probabilities, patient-specific inference, proof of age reversal, or a claim that biological immortality is achievable.' as const

export function listLongevityLevers(): readonly LongevityLever[] {
  return LONGEVITY_PROGRAMS.flatMap((program) => program.levers)
}

export function getLongevityProgram(id: LongevityProgramId): LongevityProgram {
  return LONGEVITY_PROGRAMS.find((program) => program.id === id) ?? LONGEVITY_PROGRAMS[0]
}

export function simulateLongevityStrategy(input: LongevitySimulationInput): LongevitySimulationOutput {
  const levers = listLongevityLevers()
  let mechanism = 0
  let safety = 0
  let translation = 0
  let uncertainty = 0
  let totalIntensity = 0

  for (const item of levers) {
    const intensity = clamp(input.intensities[item.id] ?? 0) / 100
    totalIntensity += intensity
    mechanism += intensity * item.mechanismWeight
    safety += intensity * item.safetyWeight
    translation += intensity * item.translationWeight
    uncertainty += intensity * item.uncertaintyWeight
  }

  const divisor = Math.max(1, totalIntensity)
  const delivery = clamp(input.deliverySpecificity)
  const reversibility = clamp(input.reversibility)
  const validation = clamp(input.validationStrength)
  const mechanismSignal = clamp((mechanism / divisor) * 72 + delivery * 0.16 + validation * 0.12)
  const safetyMargin = clamp(58 + (safety / divisor) * 32 + delivery * 0.18 + reversibility * 0.2 - Math.max(0, totalIntensity - 8) * 1.5)
  const translationalReadiness = clamp((translation / divisor) * 52 + delivery * 0.18 + reversibility * 0.1 + validation * 0.32)
  const residualUncertainty = clamp(82 - validation * 0.48 + (uncertainty / divisor) * 28 + Math.max(0, totalIntensity - 10) * 1.2)
  const systemicBalance = clamp((mechanismSignal + safetyMargin + translationalReadiness + (100 - residualUncertainty)) / 4)

  const dominantRisks: string[] = []
  const reprogramming = clamp(input.intensities['epi-pulse'] ?? 0)
  const immuneEngineering = clamp(input.intensities['sen-cell'] ?? 0)
  const matrixCleavage = clamp(input.intensities['ecm-cleave'] ?? 0)
  const mitoEditing = clamp(input.intensities['mito-editor'] ?? 0)
  const stemExpansion = clamp(input.intensities['stem-expand'] ?? 0)

  if (reprogramming > 55 && reversibility < 65) dominantRisks.push('Identity loss / oncogenic reprogramming risk')
  if (immuneEngineering > 55 && delivery < 65) dominantRisks.push('Off-tissue immune targeting risk')
  if (matrixCleavage > 55 && validation < 65) dominantRisks.push('Matrix damage from insufficient cleavage selectivity')
  if (mitoEditing > 55 && validation < 70) dominantRisks.push('Unresolved mtDNA off-target / heteroplasmy risk')
  if (stemExpansion > 55 && reversibility < 70) dominantRisks.push('Clonal expansion / lineage-control risk')
  if (dominantRisks.length === 0) dominantRisks.push('Residual uncertainty remains the dominant risk in this synthetic exploration')

  return {
    mechanismSignal: Math.round(mechanismSignal),
    safetyMargin: Math.round(safetyMargin),
    translationalReadiness: Math.round(translationalReadiness),
    residualUncertainty: Math.round(residualUncertainty),
    systemicBalance: Math.round(systemicBalance),
    dominantRisks,
  }
}
