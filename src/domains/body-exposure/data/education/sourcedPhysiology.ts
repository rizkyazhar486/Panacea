// The shape of the physiology held in this folder: plain data for body systems the older education graphs in
// src/lib did not cover. The system-physiology catalog reads every entry through readReferencedMechanism, which
// drops an entry whose reference is not exactly "PMID" and digits, whose system is unknown or whose boundary is
// missing — and the catalog's tests require that nothing is dropped.

import type { BodySystemId } from '../bodySystems.ts'

export interface SourcedReference {
  /** "PMID" followed by the PubMed id; the work must also be in governance/LITERATURE_CITATION_LEDGER.json. */
  readonly reference: string
  /** Who wrote the work, its title, and what it supports here. */
  readonly note: string
}

export interface SourcedPhysiology {
  readonly id: string
  readonly label: string
  /** Every body system the cited works tie the mechanism to. */
  readonly systems: readonly BodySystemId[]
  /** What the cited abstracts state, one step per line and in their order; nothing beyond them. */
  readonly summary: readonly string[]
  readonly references: readonly SourcedReference[]
  /** Says what the entry is not: a measurement of a person, a diagnosis or treatment guidance. */
  readonly boundary: string
}
