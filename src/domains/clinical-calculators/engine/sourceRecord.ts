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
}

export interface SourceCheck {
  errors: string[]
  counts: Record<SourceKind, number>
}

const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const DOI = /^10\.\d{4,9}\/\S+$/
const PMID = /^\d{1,9}$/

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
  }
  return { errors, counts }
}

/** Komentar blok pertama berkas (kepala dokumentasi mesin); string kosong bila tidak ada. */
export function engineHeader(source: string): string {
  const m = /^\s*\/\*\*?([\s\S]*?)\*\//.exec(source)
  return m ? m[1]! : ''
}
