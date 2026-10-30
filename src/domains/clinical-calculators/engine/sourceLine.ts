// Teks sumber yang ditampilkan di halaman kalkulator (ENG-C6-03). Murni: hanya memformat catatan registri; tidak menambah klaim.
// Fail closed — id yang tidak ada di registri atau sumber tanpa kind dikenal ditampilkan sebagai "Source unknown", bukan ditebak.
import { SOURCE_KINDS, type SourceKind, type SourceRecord } from './sourceRecord'

export interface SourceLine {
  id: string
  kind: SourceKind | 'unknown'
  /** Label pendek jenis sumber (UI berbahasa Inggris). */
  label: string
  /** Kutipan untuk sumber terbit; dasar/penjelasan jujur untuk lainnya. */
  text: string
  formula: string | null
  units: string | null
  pubmedUrl: string | null
  doiUrl: string | null
  /** Halaman penerbit untuk terbitan tak terindeks PubMed; hanya published tanpa PMID dan hanya https. */
  publisherUrl: string | null
}

const LABELS: Record<SourceKind, string> = {
  published: 'Published source',
  'named-method': 'Named method; no article cited',
  unattributed: 'No source recorded',
  arithmetic: 'Plain arithmetic',
  'repo-heuristic': 'Project heuristic; not published',
}

export function describeSource(
  id: string,
  source: SourceRecord | null | undefined,
  meta?: { formula?: string | null; units?: string | null }
): SourceLine {
  const formula = meta?.formula && typeof meta.formula === 'string' && meta.formula.trim().length > 0 ? meta.formula.trim() : null
  const units = meta?.units && typeof meta.units === 'string' && meta.units.trim().length > 0 ? meta.units.trim() : null
  if (!source || !SOURCE_KINDS.includes(source.kind)) {
    return { id, kind: 'unknown', label: 'Source unknown', text: 'No source record was found for this calculator.', formula, units, pubmedUrl: null, doiUrl: null, publisherUrl: null }
  }
  const published = source.kind === 'published'
  const text = published && source.citation ? source.citation : source.basis
  return {
    id,
    kind: source.kind,
    label: LABELS[source.kind],
    text,
    formula,
    units,
    // Tautan hanya bila identifier tersimpan DAN bentuknya sah; tidak pernah dirakit dari kutipan.
    pubmedUrl: published && source.pmid && /^\d{1,9}$/.test(source.pmid) ? `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/` : null,
    doiUrl: published && source.doi && /^10\.\d{4,9}\/\S+$/.test(source.doi) ? `https://doi.org/${source.doi}` : null,
    publisherUrl: published && !source.pmid && typeof source.unindexed?.url === 'string' && /^https:\/\/\S+$/.test(source.unindexed.url) ? source.unindexed.url : null,
  }
}
