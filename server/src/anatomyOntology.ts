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
// Penting: tabel CTSS `conditions` memakai key_id internal NLM, BUKAN DOID.
// Karena itu `ontology` di bawah hanya mempertahankan bucket semantik lama
// (disease / phenotype / anatomy) untuk kompatibilitas UI. Identitas sumber
// yang authoritative selalu ada di `identifierSystem` + `source`.
const OLS4_BASE = 'https://www.ebi.ac.uk/ols4/api/search'
const CTSS_BASE = 'https://clinicaltables.nlm.nih.gov/api'

const QUERY_LIMIT = 160
const MAX_ROWS = 10

function normalizeQuery(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, QUERY_LIMIT)
}

function clampRows(value: number, fallback = 5): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(1, Math.min(MAX_ROWS, Math.floor(value)))
}

/**
 * Merapikan definisi ontologi untuk dibaca manusia.
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

/**
 * Mengurutkan hasil menurut relevansi terhadap yang dicari.
 */
export function urutkanRelevansi(terms: OntologyTerm[], kueri: string[]): OntologyTerm[] {
  const frasa = kueri.map((k) => k.toLowerCase().trim()).filter(Boolean)
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

export type OntologyBucket = 'doid' | 'hp' | 'uberon' | 'fma'
export type OntologyIdentifierSystem = OntologyBucket | 'nlm-conditions'
export type OntologySource = 'ols4' | 'nlm-ctss'

export interface OntologyTerm {
  /**
   * Stable identifier within `identifierSystem`.
   * NLM Conditions IDs are deliberately namespaced as `NLM-CONDITIONS:*`
   * so an internal key_id can never masquerade as a DOID CURIE.
   */
  id: string
  label: string
  /** Compatibility/semantic bucket. Do not infer identifier provenance from this field. */
  ontology: OntologyBucket
  /** Authoritative identifier namespace for `id`. */
  identifierSystem: OntologyIdentifierSystem
  /** Upstream service that returned this row. */
  source: OntologySource
  /** Exact bounded query URL used for provenance/debugging. */
  sourceUrl: string
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

async function searchOntology(query: string, ontology: OntologyBucket, rows = 5): Promise<OntologyTerm[]> {
  const q = normalizeQuery(query)
  if (!q) return []
  const boundedRows = clampRows(rows)
  const url = `${OLS4_BASE}?q=${encodeURIComponent(q)}&ontology=${ontology}&rows=${boundedRows}&exact=false`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`OLS4 ${ontology} search failed: ${res.status}`)
  const data = (await res.json()) as { response?: { docs?: Ols4Doc[] } }
  const docs = data.response?.docs ?? []
  return docs
    .filter((d) => typeof d.obo_id === 'string' && d.obo_id.trim() && typeof d.label === 'string' && d.label.trim())
    .map((d) => ({
      id: (d.obo_id as string).trim(),
      label: (d.label as string).trim(),
      ontology,
      identifierSystem: ontology,
      source: 'ols4' as const,
      sourceUrl: url,
      description: rapikanDefinisi(d.description?.[0] ?? ''),
      iri: typeof d.iri === 'string' ? d.iri : '',
    }))
}

// CTSS mengembalikan [total, codeArray, extra|null, displayArray].
type CtssResponse = [number, string[], unknown, string[]]

async function searchCtss(
  query: string,
  table: 'conditions' | 'hpo',
  ontology: 'doid' | 'hp',
  displayField: string,
): Promise<OntologyTerm[]> {
  const q = normalizeQuery(query)
  if (!q) return []
  const url = `${CTSS_BASE}/${table}/v3/search?terms=${encodeURIComponent(q)}&maxList=4&df=${displayField}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`CTSS ${table} search failed: ${res.status}`)
  const data = (await res.json()) as CtssResponse
  if (!Array.isArray(data)) return []
  const codes = Array.isArray(data[1]) ? data[1] : []
  const display = Array.isArray(data[3]) ? data[3] : []
  const out: OntologyTerm[] = []
  for (let i = 0; i < Math.min(codes.length, display.length); i++) {
    const label = String(display[i] ?? '').trim()
    const code = String(codes[i] ?? '').trim()
    if (!label) continue

    if (table === 'hpo') {
      // HPO Clinical Tables documents `cf=id`; fail closed if a malformed/non-HPO
      // identifier ever appears instead of silently labelling it HP.
      if (!/^HP:\d+$/i.test(code)) continue
      out.push({
        id: code.toUpperCase(),
        label,
        ontology,
        identifierSystem: 'hp',
        source: 'nlm-ctss',
        sourceUrl: url,
        description: '',
        iri: '',
      })
      continue
    }

    // `conditions` uses NLM `key_id`, not Disease Ontology identifiers.
    const safeKey = code || `row-${i}`
    out.push({
      id: `NLM-CONDITIONS:${safeKey}`,
      label,
      ontology,
      identifierSystem: 'nlm-conditions',
      source: 'nlm-ctss',
      sourceUrl: url,
      description: '',
      iri: '',
    })
  }
  return out
}

/**
 * Mengambil penyakit DAN gejala sekaligus. OLS4 dan CTSS dijalankan paralel;
 * kegagalan satu sumber tidak menghapus hasil sumber lain.
 */
export async function anatomyOntologyLookup(terms: string[]): Promise<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }> {
  const unik = [...new Set(terms.map(normalizeQuery).filter(Boolean))].slice(0, 4)
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'doid', 4).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'hp', 4).catch(() => [] as OntologyTerm[]),
      searchCtss(t, 'conditions', 'doid', 'primary_name').catch(() => [] as OntologyTerm[]),
      searchCtss(t, 'hpo', 'hp', 'name').catch(() => [] as OntologyTerm[]),
    ]),
  )
  const diseases: OntologyTerm[] = []
  const phenotypes: OntologyTerm[] = []
  for (let i = 0; i < hasil.length; i++) {
    const bucket = i % 2 === 0 ? diseases : phenotypes
    for (const term of hasil[i]) {
      if (!bucket.some((x) => x.label.toLowerCase() === term.label.toLowerCase())) bucket.push(term)
    }
  }
  return {
    diseases: urutkanRelevansi(diseases, terms).slice(0, 8),
    phenotypes: urutkanRelevansi(phenotypes, terms).slice(0, 8),
  }
}

/**
 * Istilah struktur anatomi dari UBERON dan FMA via OLS4.
 */
export async function anatomyStructureLookup(terms: string[]): Promise<OntologyTerm[]> {
  const unik = [...new Set(terms.map(normalizeQuery).filter(Boolean))].slice(0, 4)
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'uberon', 4).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'fma', 4).catch(() => [] as OntologyTerm[]),
    ]),
  )
  const out: OntologyTerm[] = []
  for (const daftar of hasil) {
    for (const term of daftar) {
      if (!out.some((x) => x.label.toLowerCase() === term.label.toLowerCase())) out.push(term)
    }
  }
  return out.slice(0, 10)
}
