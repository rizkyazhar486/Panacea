export type CandidateKind = 'small-molecule' | 'natural-product' | 'herbal-mixture' | 'complex-compound'

export type EvidenceTier = 'measured' | 'curated' | 'predicted' | 'hypothesis'

export type EvidenceRecord = {
  id: string
  title: string
  source: 'Open Targets' | 'ChEMBL' | 'BindingDB' | 'PubChem' | 'PubMed' | 'ClinicalTrials.gov' | 'LOTUS' | 'UniProt' | 'Other'
  locator: string
  tier: EvidenceTier
  design: number
  directness: number
  replication: number
  provenance: number
  consistency: number
  status: 'clean' | 'expression-of-concern' | 'retracted' | 'unknown'
  note: string
}

export type ScoreVector = {
  targetEvidence: number
  bindingPlausibility: number
  admetPrior: number
  replication: number
  citationQuality: number
  uncertainty: number
}

export type Candidate = {
  id: string
  name: string
  kind: CandidateKind
  origin: string
  target: string
  mechanismHypothesis: string
  scores: ScoreVector
  evidenceIds: string[]
  components?: Array<{
    name: string
    exposureWeight: number | null
    predictedTargetInteraction: number
    evidenceQuality: number
  }>
}

export type RankedCandidate = Candidate & {
  panaceaScore: number
  adjustedScore: number
  herbalTargetScore: number | null
  evidenceTrust: number
  releaseEligible: boolean
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const round1 = (value: number) => Math.round(value * 10) / 10

export const PANACEA_SCORE_FORMULA = '0.30T + 0.25B + 0.20A + 0.15R + 0.10C'
export const ADJUSTED_SCORE_FORMULA = 'PanaceaScore × (1 − U)'
export const HERBAL_SCORE_FORMULA = 'Σ(wᵢ × p(target|compoundᵢ) × qᵢ)'
export const EVIDENCE_TRUST_FORMULA = '0.30D + 0.25X + 0.20R + 0.15P + 0.10K'

export function panaceaScore(scores: ScoreVector) {
  const T = clamp01(scores.targetEvidence / 100)
  const B = clamp01(scores.bindingPlausibility / 100)
  const A = clamp01(scores.admetPrior / 100)
  const R = clamp01(scores.replication / 100)
  const C = clamp01(scores.citationQuality / 100)
  return round1((0.3 * T + 0.25 * B + 0.2 * A + 0.15 * R + 0.1 * C) * 100)
}

export function uncertaintyAdjustedScore(scores: ScoreVector) {
  const base = panaceaScore(scores)
  const penalty = Math.max(0, Math.min(0.35, scores.uncertainty))
  return round1(base * (1 - penalty))
}

export function evidenceTrust(record: EvidenceRecord) {
  const base =
    0.3 * clamp01(record.design) +
    0.25 * clamp01(record.directness) +
    0.2 * clamp01(record.replication) +
    0.15 * clamp01(record.provenance) +
    0.1 * clamp01(record.consistency)
  const modifier = record.status === 'retracted' ? 0 : record.status === 'expression-of-concern' ? 0.5 : record.status === 'unknown' ? 0.8 : 1
  return round1(base * modifier * 100)
}

export function herbalTargetScore(candidate: Candidate) {
  if (!candidate.components?.length) return null
  if (candidate.components.some((component) => component.exposureWeight === null)) return null
  const weighted = candidate.components.reduce(
    (sum, component) => sum + (component.exposureWeight ?? 0) * clamp01(component.predictedTargetInteraction) * clamp01(component.evidenceQuality),
    0,
  )
  return round1(weighted * 100)
}

export function rankCandidate(candidate: Candidate, evidence: EvidenceRecord[]): RankedCandidate {
  const records = candidate.evidenceIds.map((id) => evidence.find((item) => item.id === id)).filter(Boolean) as EvidenceRecord[]
  const trust = records.length ? records.reduce((sum, record) => sum + evidenceTrust(record), 0) / records.length : 0
  const adjusted = uncertaintyAdjustedScore(candidate.scores)
  const releaseEligible =
    adjusted >= 70 &&
    candidate.scores.uncertainty <= 0.15 &&
    records.some((record) => record.tier === 'measured') &&
    records.filter((record) => record.status === 'clean').length >= 2

  return {
    ...candidate,
    panaceaScore: panaceaScore(candidate.scores),
    adjustedScore: adjusted,
    herbalTargetScore: herbalTargetScore(candidate),
    evidenceTrust: round1(trust),
    releaseEligible,
  }
}

// Synthetic demonstration records only. These values deliberately do not represent
// real compounds, patients, efficacy claims, affinities or clinical evidence.
export const DEMO_EVIDENCE: EvidenceRecord[] = [
  {
    id: 'ev-target',
    title: 'Synthetic target–disease association placeholder',
    source: 'Open Targets',
    locator: 'DEMO:OT-TARGET',
    tier: 'curated',
    design: 0.72,
    directness: 0.78,
    replication: 0.66,
    provenance: 0.96,
    consistency: 0.74,
    status: 'clean',
    note: 'Replace with a versioned Open Targets association record before any research interpretation.',
  },
  {
    id: 'ev-binding',
    title: 'Synthetic measured-binding placeholder',
    source: 'BindingDB',
    locator: 'DEMO:BIND-001',
    tier: 'measured',
    design: 0.82,
    directness: 0.9,
    replication: 0.58,
    provenance: 0.95,
    consistency: 0.71,
    status: 'clean',
    note: 'Placeholder demonstrates where assay type, Ki/Kd/IC50, target identity and publication provenance belong.',
  },
  {
    id: 'ev-chem',
    title: 'Synthetic chemical-identity placeholder',
    source: 'PubChem',
    locator: 'DEMO:CID',
    tier: 'curated',
    design: 0.65,
    directness: 0.88,
    replication: 0.7,
    provenance: 0.97,
    consistency: 0.84,
    status: 'clean',
    note: 'Chemical identity and annotations are provenance inputs, not proof of therapeutic efficacy.',
  },
  {
    id: 'ev-natural',
    title: 'Synthetic organism–natural-product occurrence placeholder',
    source: 'LOTUS',
    locator: 'DEMO:LOTUS',
    tier: 'curated',
    design: 0.58,
    directness: 0.62,
    replication: 0.48,
    provenance: 0.9,
    consistency: 0.68,
    status: 'clean',
    note: 'Occurrence evidence does not establish human exposure, bioavailability, safety or efficacy.',
  },
]

export const DEMO_CANDIDATES: Candidate[] = [
  {
    id: 'sm-a',
    name: 'Candidate SM-A',
    kind: 'small-molecule',
    origin: 'Synthetic demo scaffold',
    target: 'Target-X',
    mechanismHypothesis: 'Competitive modulation hypothesis; no efficacy claim.',
    scores: { targetEvidence: 82, bindingPlausibility: 78, admetPrior: 71, replication: 66, citationQuality: 84, uncertainty: 0.12 },
    evidenceIds: ['ev-target', 'ev-binding', 'ev-chem'],
  },
  {
    id: 'np-b',
    name: 'Candidate NP-B',
    kind: 'natural-product',
    origin: 'Synthetic natural-product demo',
    target: 'Target-X',
    mechanismHypothesis: 'Natural-product interaction hypothesis requiring measured confirmation.',
    scores: { targetEvidence: 68, bindingPlausibility: 72, admetPrior: 60, replication: 52, citationQuality: 76, uncertainty: 0.22 },
    evidenceIds: ['ev-target', 'ev-natural', 'ev-chem'],
  },
  {
    id: 'herbal-c',
    name: 'Herbal Matrix C',
    kind: 'herbal-mixture',
    origin: 'Synthetic multi-constituent demo',
    target: 'Target-X',
    mechanismHypothesis: 'Mixture-level target hypothesis; component exposure is intentionally incomplete.',
    scores: { targetEvidence: 61, bindingPlausibility: 58, admetPrior: 49, replication: 44, citationQuality: 64, uncertainty: 0.31 },
    evidenceIds: ['ev-target', 'ev-natural'],
    components: [
      { name: 'Constituent C1', exposureWeight: 0.55, predictedTargetInteraction: 0.72, evidenceQuality: 0.7 },
      { name: 'Constituent C2', exposureWeight: null, predictedTargetInteraction: 0.64, evidenceQuality: 0.55 },
      { name: 'Constituent C3', exposureWeight: 0.18, predictedTargetInteraction: 0.49, evidenceQuality: 0.5 },
    ],
  },
  {
    id: 'cx-d',
    name: 'Complex Candidate D',
    kind: 'complex-compound',
    origin: 'Synthetic complex-compound demo',
    target: 'Target-X',
    mechanismHypothesis: 'Multi-site interaction hypothesis with explicit domain-shift penalty.',
    scores: { targetEvidence: 73, bindingPlausibility: 69, admetPrior: 55, replication: 57, citationQuality: 70, uncertainty: 0.2 },
    evidenceIds: ['ev-target', 'ev-binding'],
  },
]

export const EVIDENCE_SOURCE_BLUEPRINT = [
  { name: 'Open Targets', role: 'Target–disease association and evidence graph', status: 'adapter-required' },
  { name: 'ChEMBL', role: 'Curated bioactivity and assay records', status: 'adapter-required' },
  { name: 'BindingDB', role: 'Measured protein–ligand binding affinities', status: 'adapter-required' },
  { name: 'PubChem', role: 'Chemical identity, properties, bioactivity and provenance', status: 'adapter-required' },
  { name: 'UniProt', role: 'Protein identity, function and annotation', status: 'adapter-required' },
  { name: 'LOTUS', role: 'Natural-product occurrence and organism relationships', status: 'adapter-required' },
  { name: 'PubMed', role: 'Primary literature provenance and study metadata', status: 'adapter-required' },
  { name: 'ClinicalTrials.gov', role: 'Registered human-study context and validation stage', status: 'adapter-required' },
] as const
