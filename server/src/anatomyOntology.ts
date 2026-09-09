// Lapisan retrieval/grounding untuk "Body Explorer" — mengambil istilah nyata
// dari ontologi kedokteran gratis (tanpa API key) alih-alih mengarang
// hubungan organ-penyakit-gejala sendiri:
//
//   - Human Disease Ontology (DOID) — pemetaan penyakit.
//   - Human Phenotype Ontology (HP) — pemetaan gejala/fenotipe.
//
// DUA sumber, bukan satu:
//   1. EBI OLS4 (Ontology Lookup Service) — layanan publik EMBL-EBI.
//   2. NLM Clinical Table Search Service (CTSS) — layanan publik US National
//      Library of Medicine, mengindeks tabel "conditions" dan "hpo".
//
// Penting: identifier tabel CTSS "conditions" adalah key internal NLM, BUKAN
// DOID. Karena itu provenance dan identifier system dibawa eksplisit di tiap
// term supaya aplikasi tidak pernah menyajikan identifier NLM sebagai Disease
// Ontology ID.
const OLS4_BASE = 'https://www.ebi.ac.uk/ols4/api/search'
const CTSS_BASE = 'https://clinicaltables.nlm.nih.gov/api'
const MAX_QUERY_LENGTH = 160
const MAX_OLS_ROWS = 10

type FetchLike = typeof fetch
type Clock = () => Date

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH)
}

function clampRows(rows: number): number {
  if (!Number.isFinite(rows)) return 5
  return Math.max(1, Math.min(MAX_OLS_ROWS, Math.trunc(rows)))
}

/**
 * Merapikan definisi ontologi untuk dibaca manusia.
 *
 * Definisi DOID ditulis untuk mesin dan memuat nama relasi apa adanya:
 * "The disease has_symptom fever, has_symptom malaise, has_symptom back pain."
 * Itu tampil di layar sebagai teks rusak. Relasinya diubah jadi bahasa biasa
 * dan pengulangannya diringkas, tanpa membuang satu pun isinya.
 */
export function rapikanDefinisi(teks: string): string {
  if (!teks) return ''
  let t = teks
    .replace(/\bhas_symptom\b/g, 'symptom:')
    .replace(/\bhas_material_basis_in\b/g, 'caused by')
    .replace(/\btransmitted_by\b/g, 'transmitted by')
    .replace(/\bresults_in\b/g, 'resulting in')
    .replace(/\blocated_in\b/g, 'located in')
    .replace(/\bhas_?_?part\b/g, 'includes')
    .replace(/\bderives_from\b/g, 'derived from')
    .replace(/_/g, ' ')
  t = t.replace(/symptom:\s*/g, (function () {
    let pertama = true
    return () => (pertama ? ((pertama = false), 'symptoms include ') : '')
  })())
  return t.replace(/\s+/g, ' ').trim()
}

export function urutkanRelevansi(terms: OntologyTerm[], kueri: string[]): OntologyTerm[] {
  const frasa = kueri.map((k) => normalizeQuery(k).toLowerCase()).filter(Boolean)
  const kata = [...new Set(frasa.flatMap((f) => f.split(/\s+/)).filter((w) => w.length >= 4))]
  const skor = (t: OntologyTerm): number => {
    const label = t.label.toLowerCase()
    const def = t.description.toLowerCase()
    let n = 0
    for (const f of frasa) {
      if (label === f) n += 100
      else if (label.includes(f)) n += 50
      else if (def.includes(f)) n += 5
    }
    for (const w of kata) {
      if (label.includes(w)) n += 10
      else if (def.includes(w)) n += 1
    }
    return n
  }
  return terms
    .map((t) => ({ t, n: skor(t) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.t)
}

export type OntologyName = 'doid' | 'hp' | 'uberon' | 'fma' | 'nlm-conditions'
export type OntologySource = 'ebi-ols4' | 'nlm-ctss'
export type OntologyIdentifierSystem = 'DOID' | 'HP' | 'UBERON' | 'FMA' | 'NLM_CONDITIONS_KEY'
type OlsOntologyName = Exclude<OntologyName, 'nlm-conditions'>

export interface OntologyTerm {
  id: string
  label: string
  ontology: OntologyName
  source: OntologySource
  identifierSystem: OntologyIdentifierSystem
  sourceDataset: string
  sourceUrl: string
  retrievedAt: string
  description: string
  iri: string
}

interface Ols4Doc {
  obo_id?: string
  label?: string
  description?: string[]
  ontology_name?: string
  iri?: string
}

function identifierSystemForOls(ontology: OlsOntologyName): OntologyIdentifierSystem {
  if (ontology === 'doid') return 'DOID'
  if (ontology === 'hp') return 'HP'
  if (ontology === 'uberon') return 'UBERON'
  return 'FMA'
}

async function searchOntology(
  query: string,
  ontology: OlsOntologyName,
  rows = 5,
  retrievedAt: string,
  fetchImpl: FetchLike = fetch,
): Promise<OntologyTerm[]> {
  const q = normalizeQuery(query)
  if (!q) return []
  const rowCount = clampRows(rows)
  const url = `${OLS4_BASE}?q=${encodeURIComponent(q)}&ontology=${ontology}&rows=${rowCount}&exact=false`
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`OLS4 ${ontology} search failed: ${res.status}`)
  const data = (await res.json()) as { response?: { docs?: Ols4Doc[] } }
  const docs = Array.isArray(data.response?.docs) ? data.response?.docs ?? [] : []
  return docs
    .filter((d) => typeof d.obo_id === 'string' && d.obo_id.trim() && typeof d.label === 'string' && d.label.trim())
    .map((d) => ({
      id: (d.obo_id as string).trim(),
      label: (d.label as string).trim(),
      ontology,
      source: 'ebi-ols4',
      identifierSystem: identifierSystemForOls(ontology),
      sourceDataset: `ols4:${ontology}`,
      sourceUrl: url,
      retrievedAt,
      description: rapikanDefinisi(d.description?.[0] ?? ''),
      iri: typeof d.iri === 'string' ? d.iri.trim() : '',
    }))
}

type CtssResponse = [number, unknown[], unknown, unknown[]]

type CtssTableConfig =
  | { table: 'conditions'; ontology: 'nlm-conditions'; identifierSystem: 'NLM_CONDITIONS_KEY'; codeField: 'key_id'; displayField: 'primary_name' }
  | { table: 'hpo'; ontology: 'hp'; identifierSystem: 'HP'; codeField: 'id'; displayField: 'name' }

function ctssDisplayLabel(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '').trim()
  return String(value ?? '').trim()
}

async function searchCtss(
  query: string,
  config: CtssTableConfig,
  retrievedAt: string,
  fetchImpl: FetchLike = fetch,
): Promise<OntologyTerm[]> {
  const q = normalizeQuery(query)
  if (!q) return []
  const { table, ontology, identifierSystem, codeField, displayField } = config
  const url = `${CTSS_BASE}/${table}/v3/search?terms=${encodeURIComponent(q)}&maxList=4&cf=${codeField}&df=${displayField}`
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`CTSS ${table} search failed: ${res.status}`)
  const data = (await res.json()) as CtssResponse
  if (!Array.isArray(data)) return []
  const codes = Array.isArray(data[1]) ? data[1] : []
  const display = Array.isArray(data[3]) ? data[3] : []
  const out: OntologyTerm[] = []
  for (let i = 0; i < Math.min(codes.length, display.length); i++) {
    const label = ctssDisplayLabel(display[i])
    const code = String(codes[i] ?? '').trim()
    if (!label || !code) continue
    if (identifierSystem === 'HP' && !/^HP:\d+$/i.test(code)) continue
    out.push({
      id: code,
      label,
      ontology,
      source: 'nlm-ctss',
      identifierSystem,
      sourceDataset: `nlm-clinical-tables:${table}`,
      sourceUrl: url,
      retrievedAt,
      description: '',
      iri: '',
    })
  }
  return out
}

export async function anatomyOntologyLookup(
  terms: string[],
  fetchImpl: FetchLike = fetch,
  clock: Clock = () => new Date(),
): Promise<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }> {
  const unik = [...new Set(terms.map(normalizeQuery).filter(Boolean))].slice(0, 4)
  const retrievedAt = clock().toISOString()
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'doid', 4, retrievedAt, fetchImpl).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'hp', 4, retrievedAt, fetchImpl).catch(() => [] as OntologyTerm[]),
      searchCtss(t, {
        table: 'conditions',
        ontology: 'nlm-conditions',
        identifierSystem: 'NLM_CONDITIONS_KEY',
        codeField: 'key_id',
        displayField: 'primary_name',
      }, retrievedAt, fetchImpl).catch(() => [] as OntologyTerm[]),
      searchCtss(t, {
        table: 'hpo',
        ontology: 'hp',
        identifierSystem: 'HP',
        codeField: 'id',
        displayField: 'name',
      }, retrievedAt, fetchImpl).catch(() => [] as OntologyTerm[]),
    ]),
  )
  const diseases: OntologyTerm[] = []
  const phenotypes: OntologyTerm[] = []
  for (let i = 0; i < hasil.length; i++) {
    const bucket = i % 2 === 0 ? diseases : phenotypes
    for (const term of hasil[i]) {
      if (!bucket.some((x) => x.source === term.source && x.identifierSystem === term.identifierSystem && x.id === term.id)) {
        bucket.push(term)
      }
    }
  }
  return {
    diseases: urutkanRelevansi(diseases, terms).slice(0, 8),
    phenotypes: urutkanRelevansi(phenotypes, terms).slice(0, 8),
  }
}

export async function anatomyStructureLookup(
  terms: string[],
  fetchImpl: FetchLike = fetch,
  clock: Clock = () => new Date(),
): Promise<OntologyTerm[]> {
  const unik = [...new Set(terms.map(normalizeQuery).filter(Boolean))].slice(0, 4)
  const retrievedAt = clock().toISOString()
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'uberon', 4, retrievedAt, fetchImpl).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'fma', 4, retrievedAt, fetchImpl).catch(() => [] as OntologyTerm[]),
    ]),
  )
  const out: OntologyTerm[] = []
  for (const daftar of hasil) {
    for (const term of daftar) {
      if (!out.some((x) => x.source === term.source && x.identifierSystem === term.identifierSystem && x.id === term.id)) out.push(term)
    }
  }
  return out.slice(0, 10)
}
