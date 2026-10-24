// Catatan sumber per mesin kalkulator (kriteria Alpha ENG-C6-03). Murni: tanpa I/O. Fail closed — sebuah mesin hanya boleh
// mengaku "published" bila kutipannya tertulis di kepala berkas mesin itu sendiri; mesin tanpa sumber yang bisa ditunjuk harus
// mengatakannya (kind ≠ published) dan tidak boleh membawa kutipan. Tidak ada kutipan, DOI, atau PMID karangan.

export type SourceKind = 'published' | 'named-method' | 'unattributed' | 'arithmetic' | 'repo-heuristic'
export const SOURCE_KINDS: readonly SourceKind[] = ['published', 'named-method', 'unattributed', 'arithmetic', 'repo-heuristic']

export interface SourceRecord {
  kind: SourceKind
  /** Kutipan terbaca manusia; hanya untuk kind = published. */
  citation: string | null
  /** Potongan teks yang HARUS muncul persis di kepala berkas mesin; mengikat kutipan ke kode agar tidak bisa menyimpang diam-diam. */
  anchor: string | null
  /** Satu kalimat: apa dasar mesin ini dan apa yang BELUM terverifikasi. */
  basis: string
  doi?: string | null
  pmid?: string | null
  /** Metadata persis seperti dikembalikan PubMed saat identifier dicari; wajib bila doi/pmid terisi, agar identifier tidak bisa ditempel tanpa bukti. */
  lookup?: SourceLookup | null
}

export interface SourceLookup {
  source: 'PubMed'
  /** Identifier persis seperti dikembalikan pencarian; harus sama dengan source.pmid/doi sehingga menukar satu sisi saja terdeteksi. */
  pmid: string | null
  doi: string | null
  /** YYYY-MM-DD: kapan pencarian dilakukan (uji tidak memakai jaringan, jadi ini catatan, bukan pemeriksaan ulang). */
  retrievedOn: string
  title: string
  firstAuthor: string
  journal: string
  year: number
  pages: string
}

export interface SourceCheck {
  errors: string[]
  counts: Record<SourceKind, number>
}

const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const DOI = /^10\.\d{4,9}\/\S+$/
const PMID = /^\d{1,9}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

/** `entries[].source` dibandingkan dengan kepala berkas mesin (`headers[id]` = komentar blok pertama). */
export function checkSourceRecords(
  entries: ReadonlyArray<{ id: string; source?: SourceRecord | null }>,
  headers: Readonly<Record<string, string>>,
): SourceCheck {
  const errors: string[] = []
  const counts = Object.fromEntries(SOURCE_KINDS.map((k) => [k, 0])) as Record<SourceKind, number>
  for (const { id, source } of entries) {
    if (!source || typeof source !== 'object') { errors.push(`${id}: source-missing`); continue }
    if (!SOURCE_KINDS.includes(source.kind)) { errors.push(`${id}: unknown-source-kind`); continue }
    counts[source.kind]++
    if (!filled(source.basis)) errors.push(`${id}: basis-missing`)
    if (source.kind === 'published') {
      if (!filled(source.citation)) errors.push(`${id}: citation-missing`)
      if (!filled(source.anchor)) errors.push(`${id}: anchor-missing`)
      else if (!(headers[id] ?? '').includes(source.anchor)) errors.push(`${id}: anchor-not-in-engine-header`)
    } else {
      if (source.citation !== null || source.anchor !== null) errors.push(`${id}: unsourced-must-not-carry-citation`)
      if (filled(source.doi) || filled(source.pmid)) errors.push(`${id}: identifier-without-citation`)
    }
    if (source.doi != null && !(filled(source.doi) && DOI.test(source.doi))) errors.push(`${id}: doi-invalid`)
    if (source.pmid != null && !(filled(source.pmid) && PMID.test(source.pmid))) errors.push(`${id}: pmid-invalid`)
    if (source.kind === 'published' && (filled(source.doi) || filled(source.pmid))) checkLookup(id, source, errors)
  }
  return { errors, counts }
}

/** Identifier hanya sah bila disertai metadata hasil pencarian yang cocok dengan kutipan di kode (penulis pertama dan tahun). */
function checkLookup(id: string, source: SourceRecord, errors: string[]): void {
  const l = source.lookup
  if (!l || typeof l !== 'object') { errors.push(`${id}: identifier-without-lookup`); return }
  if (l.source !== 'PubMed') errors.push(`${id}: lookup-source-invalid`)
  if (!(filled(l.retrievedOn) && DATE.test(l.retrievedOn))) errors.push(`${id}: lookup-date-invalid`)
  for (const k of ['title', 'journal', 'pages'] as const) if (!filled(l[k])) errors.push(`${id}: lookup-${k}-missing`)
  if ((l.pmid ?? null) !== (source.pmid ?? null)) errors.push(`${id}: lookup-pmid-mismatch`)
  if ((l.doi ?? null) !== (source.doi ?? null)) errors.push(`${id}: lookup-doi-mismatch`)
  const citation = source.citation ?? ''
  if (!filled(l.firstAuthor) || !citation.includes(l.firstAuthor)) errors.push(`${id}: lookup-author-not-in-citation`)
  if (!Number.isInteger(l.year) || !citation.includes(String(l.year))) errors.push(`${id}: lookup-year-not-in-citation`)
}

/** Komentar blok pertama berkas (kepala dokumentasi mesin); string kosong bila tidak ada. */
export function engineHeader(source: string): string {
  const m = /^\s*\/\*\*?([\s\S]*?)\*\//.exec(source)
  return m ? m[1]! : ''
}
