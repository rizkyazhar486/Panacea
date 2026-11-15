// Readers that turn the physiology the repository already holds into one shape. Pure: no I/O, no clock, no
// randomness.
//
// Nothing here is written for this file. Every mechanism is read from an existing module — the organ-system
// education graphs, the education networks, the organ teaching atlas, the physiology couplings — and kept only if
// it carries a usable source. A node that claims literature support without one is rejected, not shown with an
// empty source list. The identifiers these modules carry were resolved against NCBI and recorded in
// governance/LITERATURE_CITATION_LEDGER.json; scripts/uji/system-physiology.mts fails if a surfaced citation is
// ever missing from that ledger.

import type { BodySystemId } from '../../data/bodySystems.ts'

export interface PhysiologyCitation {
  kind: 'pubmed' | 'bookshelf'
  /** PMID digits, or an NCBI Bookshelf accession (NBK followed by digits). */
  id: string
  url: string
  /** What the source covers, as the source module states it. */
  note: string
}

export interface PhysiologyMechanism {
  id: string
  label: string
  /** One or more systems; more than one means the mechanism couples them. */
  systems: readonly BodySystemId[]
  /** Set when the mechanism is about one organ rather than the whole system. */
  organ?: string
  /** Statements taken from the source module. Empty when the module only names the mechanism. */
  summary: readonly string[]
  citations: readonly PhysiologyCitation[]
  boundary: string
  /** The module it came from, for traceability. */
  origin: string
}

/** Physiology the repository explicitly marks as not yet sourced (an educational placeholder). */
export interface PhysiologyGap {
  id: string
  /** The organ the placeholder is about, or the system label for a system-wide placeholder. */
  subject: string
  system: BodySystemId
  boundary: string
  origin: string
}

export type RejectionReason =
  | 'literature-backed-without-source'
  | 'url-does-not-match-id'
  | 'boundary-missing'
  | 'unknown-system'
  | 'unreadable-reference'

export interface RejectedSource {
  id: string
  origin: string
  reason: RejectionReason
}

export type SystemLabels = ReadonlyMap<BodySystemId, string>

/** The validators in the education graphs ask for at least this much boundary text. */
export const MIN_BOUNDARY_LENGTH = 40

const PMID = /^\d{1,8}$/

export const pubmedUrl = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
export const bookshelfUrl = (accession: string) => `https://www.ncbi.nlm.nih.gov/books/${accession}/`

const hasBoundary = (text: unknown): text is string => typeof text === 'string' && text.trim().length >= MIN_BOUNDARY_LENGTH

/** "PMID <digits>" or "NCBI Bookshelf NBK<digits>" into a citation; anything else is unreadable. */
export function citationFromReference(reference: unknown, note: string): PhysiologyCitation | null {
  if (typeof reference !== 'string') return null
  const nbk = /^NCBI Bookshelf (NBK\d{3,7})$/.exec(reference.trim())?.[1]
  if (nbk) return { kind: 'bookshelf', id: nbk, url: bookshelfUrl(nbk), note }
  const pmid = /^PMID:? ?(\d{1,8})$/.exec(reference.trim())?.[1]
  if (pmid) return { kind: 'pubmed', id: pmid, url: pubmedUrl(pmid), note }
  return null
}

/** A PubMed or Bookshelf URL in exactly the canonical form into a citation; anything else is unreadable. */
export function citationFromUrl(url: unknown, note: string): PhysiologyCitation | null {
  if (typeof url !== 'string') return null
  const pmid = /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{1,8})\/$/.exec(url)?.[1]
  if (pmid) return { kind: 'pubmed', id: pmid, url, note }
  const nbk = /^https:\/\/www\.ncbi\.nlm\.nih\.gov\/books\/(NBK\d{3,7})\/$/.exec(url)?.[1]
  if (nbk) return { kind: 'bookshelf', id: nbk, url, note }
  return null
}

// ── Organ-system education graphs (src/lib/body*Education.ts) ───────────────────────────────────────────────

/** The fields every education graph node shares. */
export interface EducationNodeLike {
  readonly id: string
  readonly label: string
  readonly kind: string
  readonly evidenceState: string
  readonly evidence?: readonly { readonly kind: string; readonly id: string; readonly url?: string; readonly note: string }[]
  readonly claimScope?: string
  readonly boundary: string
}

export interface EducationSource {
  origin: string
  system: BodySystemId
  /** Set for organ-level graphs (e.g. 'Kidney'); absent for system-wide graphs. */
  organ?: string
  nodes: readonly EducationNodeLike[]
}

/**
 * Mechanisms and gaps from organ-system education graphs.
 * - mechanism: a 'physiology' node marked 'literature-backed' with at least one PubMed source;
 * - gap: a 'physiology' node marked 'educational-only' (the graph's own statement that it is a placeholder).
 * A PubMed source whose url does not point at its own id is rejected: the link would send people elsewhere.
 */
export function readEducationSources(sources: readonly EducationSource[], systemLabels: SystemLabels) {
  const mechanisms: PhysiologyMechanism[] = []
  const gaps: PhysiologyGap[] = []
  const rejected: RejectedSource[] = []
  for (const source of sources) {
    if (!systemLabels.has(source.system)) {
      rejected.push({ id: source.origin, origin: source.origin, reason: 'unknown-system' })
      continue
    }
    for (const node of source.nodes) {
      if (node.kind !== 'physiology') continue
      if (!hasBoundary(node.boundary)) {
        rejected.push({ id: node.id, origin: source.origin, reason: 'boundary-missing' })
        continue
      }
      if (node.evidenceState === 'educational-only') {
        gaps.push({ id: node.id, subject: source.organ ?? systemLabels.get(source.system)!, system: source.system, boundary: node.boundary, origin: source.origin })
        continue
      }
      if (node.evidenceState !== 'literature-backed') continue
      const citations: PhysiologyCitation[] = []
      let misdirected = false
      for (const item of node.evidence ?? []) {
        if (item.kind !== 'pubmed' || !PMID.test(item.id)) continue
        if (item.url !== undefined && item.url !== pubmedUrl(item.id)) { misdirected = true; break }
        citations.push({ kind: 'pubmed', id: item.id, url: pubmedUrl(item.id), note: item.note })
      }
      if (misdirected) {
        rejected.push({ id: node.id, origin: source.origin, reason: 'url-does-not-match-id' })
        continue
      }
      if (citations.length === 0) {
        rejected.push({ id: node.id, origin: source.origin, reason: 'literature-backed-without-source' })
        continue
      }
      mechanisms.push({
        id: node.id,
        label: node.label,
        systems: [source.system],
        ...(source.organ ? { organ: source.organ } : {}),
        summary: typeof node.claimScope === 'string' && node.claimScope.trim() ? [node.claimScope.trim()] : [],
        citations,
        boundary: node.boundary,
        origin: source.origin,
      })
    }
  }
  return { mechanisms, gaps, rejected }
}

// ── Education networks (src/lib/body*EducationNetwork.ts) ───────────────────────────────────────────────────

export interface EducationNetworkLike {
  readonly systemId: string
  readonly label: string
  readonly provenanceBoundary: string
  readonly sources: readonly { readonly pmid: string; readonly title: string }[]
  readonly relationships: readonly { readonly kind: string; readonly statement: string; readonly sourcePmids: readonly string[] }[]
}

/**
 * One mechanism per network: its physiology statements (pathophysiology relationships belong to the clinical
 * stage and are left out) with the union of their sources. A statement citing a PMID the network does not list
 * is unreadable and rejects the network.
 */
export function readEducationNetwork(
  network: EducationNetworkLike,
  origin: string,
  systemAliases: Readonly<Record<string, BodySystemId>>,
  systemLabels: SystemLabels,
): { mechanism: PhysiologyMechanism | null; rejected: RejectedSource | null } {
  const id = `${network.systemId}-education-network`
  const reject = (reason: RejectionReason) => ({ mechanism: null, rejected: { id, origin, reason } })
  const system = systemAliases[network.systemId] ?? (network.systemId as BodySystemId)
  if (!systemLabels.has(system)) return reject('unknown-system')
  if (!hasBoundary(network.provenanceBoundary)) return reject('boundary-missing')
  const titles = new Map(network.sources.map((source) => [source.pmid, source.title]))
  const summary: string[] = []
  const citations: PhysiologyCitation[] = []
  for (const relationship of network.relationships) {
    if (relationship.kind === 'pathophysiology') continue
    for (const pmid of relationship.sourcePmids) {
      const title = titles.get(pmid)
      if (title === undefined || !PMID.test(pmid)) return reject('unreadable-reference')
      if (!citations.some((citation) => citation.id === pmid)) citations.push({ kind: 'pubmed', id: pmid, url: pubmedUrl(pmid), note: title })
    }
    summary.push(relationship.statement)
  }
  if (citations.length === 0) return reject('literature-backed-without-source')
  return { mechanism: { id, label: network.label, systems: [system], summary, citations, boundary: network.provenanceBoundary, origin }, rejected: null }
}

// ── Organ teaching atlas (src/lib/bodyOrganEducationAtlas.ts) ───────────────────────────────────────────────

export interface OrganBoundaryFlags {
  readonly educationalOnly: boolean
  readonly genericReference: boolean
  readonly patientSpecificInference: boolean
  readonly diagnosisOrTreatment: boolean
  readonly quantitativePatientClaim: boolean
}

export interface OrganRelationshipLike {
  readonly id: string
  readonly organ: string
  readonly from: string
  readonly to: string
  readonly projections: readonly string[]
  readonly teachingRelationship: string
  readonly evidenceIds: readonly string[]
  readonly evidenceState: string
  readonly boundary: OrganBoundaryFlags
}

export interface OrganReferenceLike {
  readonly id: string
  readonly title: string
  readonly url: string
}

/** The atlas states its boundary as flags; this is the sentence those flags mean. */
export const ORGAN_RELATIONSHIP_BOUNDARY =
  'Generic educational teaching relationship: not patient-specific, not a diagnosis or treatment, and no quantitative claim about any person.'

const sentenceCase = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text)

/**
 * Organ relationships the atlas marks 'source-checked' and projects into physiology. The organ decides the system
 * (through the organ graphs' own system ids); an organ no graph covers is rejected rather than guessed.
 */
export function readOrganRelationships(
  relationships: readonly OrganRelationshipLike[],
  references: readonly OrganReferenceLike[],
  organSystems: ReadonlyMap<string, { system: BodySystemId; organ: string }>,
  origin: string,
) {
  const mechanisms: PhysiologyMechanism[] = []
  const rejected: RejectedSource[] = []
  for (const relationship of relationships) {
    if (relationship.evidenceState !== 'source-checked' || !relationship.projections.includes('physiology')) continue
    const owner = organSystems.get(relationship.organ.toLowerCase())
    if (!owner) {
      rejected.push({ id: relationship.id, origin, reason: 'unknown-system' })
      continue
    }
    const flags = relationship.boundary
    if (!flags.educationalOnly || !flags.genericReference || flags.patientSpecificInference || flags.diagnosisOrTreatment || flags.quantitativePatientClaim) {
      rejected.push({ id: relationship.id, origin, reason: 'boundary-missing' })
      continue
    }
    if (relationship.evidenceIds.length === 0) {
      rejected.push({ id: relationship.id, origin, reason: 'literature-backed-without-source' })
      continue
    }
    const citations = relationship.evidenceIds.map((evidenceId) => {
      const reference = references.find((item) => item.id === evidenceId)
      return reference ? citationFromUrl(reference.url, reference.title) : null
    })
    if (!citations.every((citation): citation is PhysiologyCitation => citation !== null)) {
      rejected.push({ id: relationship.id, origin, reason: 'unreadable-reference' })
      continue
    }
    mechanisms.push({
      id: relationship.id,
      label: `${sentenceCase(relationship.from)} → ${relationship.to}`,
      systems: [owner.system],
      organ: owner.organ,
      summary: [relationship.teachingRelationship],
      citations,
      boundary: ORGAN_RELATIONSHIP_BOUNDARY,
      origin,
    })
  }
  return { mechanisms, rejected }
}

// ── Physiology couplings that cite by reference string (src/lib/physiology/*Coupling.ts) ────────────────────

export interface ReferencedMechanismInput {
  id: string
  label: string
  systems: readonly BodySystemId[]
  summary: readonly string[]
  references: readonly { reference: string; note: string }[]
  boundary: string
  origin: string
}

/**
 * A mechanism from a module that cites by reference string. Every reference must be readable; one unreadable
 * reference rejects the whole mechanism rather than showing a partial source list.
 */
export function readReferencedMechanism(input: ReferencedMechanismInput, systemLabels: SystemLabels): { mechanism: PhysiologyMechanism | null; rejected: RejectedSource | null } {
  const reject = (reason: RejectionReason) => ({ mechanism: null, rejected: { id: input.id, origin: input.origin, reason } })
  if (input.systems.length === 0 || input.systems.some((system) => !systemLabels.has(system))) return reject('unknown-system')
  if (!hasBoundary(input.boundary)) return reject('boundary-missing')
  const citations: PhysiologyCitation[] = []
  for (const item of input.references) {
    const citation = citationFromReference(item.reference, item.note)
    if (!citation) return reject('unreadable-reference')
    citations.push(citation)
  }
  if (citations.length === 0) return reject('literature-backed-without-source')
  return {
    mechanism: { id: input.id, label: input.label, systems: [...input.systems], summary: [...input.summary], citations, boundary: input.boundary, origin: input.origin },
    rejected: null,
  }
}
