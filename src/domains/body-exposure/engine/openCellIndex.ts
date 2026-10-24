// Indeks protein skala sel dari OpenCell (Chan Zuckerberg Biohub, sel HEK293T yang dibiakkan; CC BY-SA 4.0): lokalisasi subseluler tiap protein berlabel + kelimpahan.
// Murni & deterministik: tanpa DOM/jaringan. Fail closed: ID Ensembl salah, anotasi di luar kosakata, angka negatif/NaN, atau baris ganda ditolak dengan alasan;
// tidak ada nilai tebakan. Data diukur pada sel kultur, BUKAN pada jaringan atau tubuh yang sedang ditampilkan.

export const LOCALISATIONS = [
  'big_aggregates', 'cell_contact', 'centrosome', 'chromatin', 'cytoplasmic', 'cytoskeleton', 'er', 'focal_adhesions', 'golgi', 'membrane', 'mitochondria',
  'nuclear_membrane', 'nuclear_punctae', 'nucleolus_fc_dfc', 'nucleolus_gc', 'nucleoplasm', 'vesicles',
] as const
export type Localisation = (typeof LOCALISATIONS)[number]

export const LOCALISATION_LABEL: Record<Localisation, string> = {
  big_aggregates: 'Large aggregates', cell_contact: 'Cell contacts', centrosome: 'Centrosome', chromatin: 'Chromatin', cytoplasmic: 'Cytoplasm',
  cytoskeleton: 'Cytoskeleton', er: 'Endoplasmic reticulum', focal_adhesions: 'Focal adhesions', golgi: 'Golgi apparatus', membrane: 'Plasma membrane', mitochondria: 'Mitochondria',
  nuclear_membrane: 'Nuclear membrane', nuclear_punctae: 'Nuclear puncta', nucleolus_fc_dfc: 'Nucleolus (FC/DFC)', nucleolus_gc: 'Nucleolus (GC)',
  nucleoplasm: 'Nucleoplasm', vesicles: 'Vesicles',
}

export interface OpenCellProtein {
  gene: string
  ensg: string
  uniprot: string | null
  name: string | null
  /** nada tersering = tingkat 3, lalu 2, lalu 1 (kuat → lemah) */
  grade3: Localisation[]
  grade2: Localisation[]
  grade1: Localisation[]
  rnaTpm: number | null
  proteinNm: number | null
  copyNumber: number | null
}
export interface LocRow { target_name: string; ensg_id: string; annotations_grade_3: string; annotations_grade_2: string; annotations_grade_1: string }
export interface AbundanceRow { gene_name: string; ensg_id: string; uniprot_id: string; protein_name: string; hek_rna_tpm: string; hek_protein_conc_nm: string; hek_protein_copy_number: string }
export interface Rejected { gene: string; reason: string }
export interface BuildResult { proteins: OpenCellProtein[]; rejected: Rejected[]; withoutAbundance: number }

const ENSG = /^ENSG\d{11}$/
const KNOWN = new Set<string>(LOCALISATIONS)

function parseAnnotations(s: string): Localisation[] | null {
  const parts = s.split(';').map((x) => x.trim()).filter(Boolean)
  return parts.every((p) => KNOWN.has(p)) ? (parts as Localisation[]) : null
}
function num(s: string | undefined): number | null | 'bad' {
  const t = (s ?? '').trim()
  if (t === '') return null
  const v = Number(t)
  return Number.isFinite(v) && v >= 0 ? v : 'bad'
}

export function buildOpenCellIndex(loc: readonly LocRow[], abundance: readonly AbundanceRow[]): BuildResult {
  const ab = new Map<string, AbundanceRow>()
  for (const r of abundance) {
    const ensg = (r.ensg_id ?? '').trim()
    if (!ab.has(ensg)) ab.set(ensg, r)
  }
  const rejected: Rejected[] = []
  const proteins: OpenCellProtein[] = []
  const seen = new Set<string>()
  let withoutAbundance = 0
  for (const r of loc) {
    const gene = (r.target_name ?? '').trim()
    const ensg = (r.ensg_id ?? '').trim()
    if (!gene) { rejected.push({ gene: '', reason: 'empty gene name' }); continue }
    if (!ENSG.test(ensg)) { rejected.push({ gene, reason: `invalid Ensembl id (${r.ensg_id})` }); continue }
    if (seen.has(ensg)) { rejected.push({ gene, reason: 'duplicate Ensembl id' }); continue }
    const g3 = parseAnnotations(r.annotations_grade_3 ?? ''), g2 = parseAnnotations(r.annotations_grade_2 ?? ''), g1 = parseAnnotations(r.annotations_grade_1 ?? '')
    if (!g3 || !g2 || !g1) { rejected.push({ gene, reason: 'annotation outside the OpenCell vocabulary' }); continue }
    const a = ab.get(ensg)
    const rna = num(a?.hek_rna_tpm), conc = num(a?.hek_protein_conc_nm), copies = num(a?.hek_protein_copy_number)
    if (rna === 'bad' || conc === 'bad' || copies === 'bad') { rejected.push({ gene, reason: 'abundance value is not a non-negative number' }); continue }
    if (!a) withoutAbundance++
    seen.add(ensg)
    proteins.push({ gene, ensg, uniprot: a?.uniprot_id?.trim() || null, name: a?.protein_name?.trim() || null, grade3: g3, grade2: g2, grade1: g1, rnaTpm: rna, proteinNm: conc, copyNumber: copies })
  }
  proteins.sort((x, y) => x.gene.localeCompare(y.gene))
  return { proteins, rejected, withoutAbundance }
}

/** Cari menurut nama gen (awalan lebih dulu), lalu nama protein (substring) / Ensembl dan UniProt (ID persis). Tanpa kueri dan filter → daftar kosong; filter lokasi memakai semua tingkat anotasi. */
export function searchProteins(proteins: readonly OpenCellProtein[], query: string, limit = 12, location: Localisation | null = null): OpenCellProtein[] {
  const q = query.trim().toLowerCase()
  if ((!q && !location) || limit <= 0 || (location && !KNOWN.has(location))) return []
  const starts: OpenCellProtein[] = [], rest: OpenCellProtein[] = []
  for (const p of proteins) {
    if (location && ![...p.grade3, ...p.grade2, ...p.grade1].includes(location)) continue
    const g = p.gene.toLowerCase()
    if (g.startsWith(q)) starts.push(p)
    else if (g.includes(q) || (p.name ?? '').toLowerCase().includes(q) || p.ensg.toLowerCase() === q || (p.uniprot ?? '').toLowerCase() === q) rest.push(p)
  }
  return [...starts, ...rest].slice(0, limit)
}

export const OPENCELL_PAGE_SIZE = 8

/** Browse every matching source row while keeping each mobile result page bounded. */
export function searchProteinPage(proteins: readonly OpenCellProtein[], query: string, page = 0, location: Localisation | null = null) {
  const matches = searchProteins(proteins, query, proteins.length, location)
  const pageCount = Math.ceil(matches.length / OPENCELL_PAGE_SIZE)
  const requested = Number.isSafeInteger(page) && page >= 0 ? page : 0
  const current = Math.min(requested, Math.max(0, pageCount - 1))
  const offset = current * OPENCELL_PAGE_SIZE
  return { proteins: matches.slice(offset, offset + OPENCELL_PAGE_SIZE), total: matches.length, page: current, pageCount, offset }
}

export interface PublishedOpenCell { schema: 1; kind: 'opencell_index'; licence: string; citation: string; limitations: string; proteins: OpenCellProtein[] }
export type ParseOpenCell = { ok: true; index: PublishedOpenCell } | { ok: false; error: string }

export function parseOpenCellIndex(raw: unknown): ParseOpenCell {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'index must be an object' }
  const r = raw as Record<string, unknown>
  if (r.schema !== 1 || r.kind !== 'opencell_index') return { ok: false, error: 'unsupported schema or kind' }
  for (const k of ['licence', 'citation', 'limitations'] as const) if (typeof r[k] !== 'string' || !(r[k] as string).trim()) return { ok: false, error: `${k} missing` }
  if (!/CC BY-SA 4\.0/.test(r.licence as string)) return { ok: false, error: 'licence must state CC BY-SA 4.0' }
  if (!Array.isArray(r.proteins) || r.proteins.length === 0) return { ok: false, error: 'proteins missing' }
  const seen = new Set<string>()
  for (const p of r.proteins as OpenCellProtein[]) {
    if (!p || typeof p.ensg !== 'string' || !ENSG.test(p.ensg) || typeof p.gene !== 'string' || !p.gene.trim()) return { ok: false, error: 'protein with invalid gene or Ensembl id' }
    for (const k of ['name', 'uniprot'] as const) if (p[k] !== null && typeof p[k] !== 'string') return { ok: false, error: `${p.gene}: bad ${k}` }
    if (seen.has(p.ensg)) return { ok: false, error: `duplicate ${p.ensg}` }
    seen.add(p.ensg)
    for (const k of ['grade3', 'grade2', 'grade1'] as const) if (!Array.isArray(p[k]) || !p[k].every((x) => KNOWN.has(x))) return { ok: false, error: `${p.gene}: bad ${k}` }
    for (const k of ['rnaTpm', 'proteinNm', 'copyNumber'] as const) if (p[k] !== null && !(Number.isFinite(p[k]) && (p[k] as number) >= 0)) return { ok: false, error: `${p.gene}: bad ${k}` }
  }
  return { ok: true, index: r as unknown as PublishedOpenCell }
}
