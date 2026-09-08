// Lapisan retrieval/grounding untuk "Body Explorer" — mengambil istilah nyata
// dari ontologi kedokteran gratis (tanpa API key) alih-alih mengarang
// hubungan organ-penyakit-gejala sendiri:
//
//   - Human Disease Ontology (DOID) — pemetaan penyakit.
//   - Human Phenotype Ontology (HP) — pemetaan gejala/fenotipe.
//
// DUA sumber, bukan satu — permintaannya dijalankan ke keduanya SEKALIGUS dan
// hasilnya digabung:
//   1. EBI OLS4 (Ontology Lookup Service) — layanan publik EMBL-EBI.
//   2. NLM Clinical Table Search Service (CTSS) — layanan publik US National
//      Library of Medicine. Tabel `conditions` memakai key internal NLM,
//      sedangkan tabel `hpo` memakai identifier HP yang sesungguhnya.
//
// Karena identifier kedua layanan tidak selalu berasal dari sistem ontologi
// yang sama, setiap hasil membawa `source` dan `idSystem`. Ini mencegah key
// internal NLM Conditions tampil seolah-olah merupakan DOID.
const OLS4_BASE = 'https://www.ebi.ac.uk/ols4/api/search'
const CTSS_BASE = 'https://clinicaltables.nlm.nih.gov/api'
const MAX_QUERY_LENGTH = 160

export type OntologySource = 'ols4' | 'nlm-clinical-tables'
export type OntologyIdSystem = 'DOID' | 'HP' | 'UBERON' | 'FMA' | 'NLM_CONDITION_KEY'
export type OntologyName = 'doid' | 'hp' | 'uberon' | 'fma' | 'nlm-conditions'

function normalisasiKueri(query: string): string {
  return query.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH)
}

function idSystemForOntology(ontology: Exclude<OntologyName, 'nlm-conditions'>): OntologyIdSystem {
  if (ontology === 'doid') return 'DOID'
  if (ontology === 'hp') return 'HP'
  if (ontology === 'uberon') return 'UBERON'
  return 'FMA'
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

export interface OntologyTerm {
  id: string
  label: string
  ontology: OntologyName
  idSystem: OntologyIdSystem
  source: OntologySource
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

async function searchOntology(
  query: string,
  ontology: Exclude<OntologyName, 'nlm-conditions'>,
  rows = 5,
): Promise<OntologyTerm[]> {
  const q = normalisasiKueri(query)
  if (!q) return []
  const boundedRows = Math.max(1, Math.min(10, Math.trunc(rows) || 1))
  const url = `${OLS4_BASE}?q=${encodeURIComponent(q)}&ontology=${ontology}&rows=${boundedRows}&exact=false`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`OLS4 ${ontology} search failed: ${res.status}`)
  const data = (await res.json()) as { response?: { docs?: Ols4Doc[] } }
  const docs = data.response?.docs ?? []
  return docs
    .filter((d) => d.obo_id && d.label)
    .map((d) => ({
      id: d.obo_id as string,
      label: d.label as string,
      ontology,
      idSystem: idSystemForOntology(ontology),
      source: 'ols4' as const,
      description: rapikanDefinisi(d.description?.[0] ?? ''),
      iri: d.iri ?? '',
    }))
}

// CTSS mengembalikan bentuk larik-tetap:
// [jumlahTotal, kodeArray, dataTambahan|null, tampilanArray]. `conditions`
// memakai key internal tabel NLM; hanya tabel `hpo` yang mengembalikan HP ID.
type CtssResponse = [number, string[], unknown, string[]]

async function searchCtss(
  query: string,
  table: 'conditions' | 'hpo',
  displayField: string,
): Promise<OntologyTerm[]> {
  const q = normalisasiKueri(query)
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
    const isHpo = table === 'hpo'
    out.push({
      id: code || `NLM:${table}:${i}`,
      label,
      ontology: isHpo ? 'hp' : 'nlm-conditions',
      idSystem: isHpo ? 'HP' : 'NLM_CONDITION_KEY',
      source: 'nlm-clinical-tables',
      description: '',
      iri: '',
    })
  }
  return out
}

/**
 * Mengambil istilah penyakit DAN fenotipe untuk satu atau lebih kata kunci.
 * Hasil OLS4 dan NLM CTSS digabung agar satu upstream yang lambat/kosong tidak
 * mengosongkan seluruh panel. `diseases` adalah bucket UI, bukan klaim bahwa
 * semua identifier di dalamnya berasal dari Disease Ontology.
 */
export async function anatomyOntologyLookup(terms: string[]): Promise<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }> {
  const unik = [...new Set(terms.map(normalisasiKueri).filter(Boolean))].slice(0, 4)
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'doid', 4).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'hp', 4).catch(() => [] as OntologyTerm[]),
      searchCtss(t, 'conditions', 'primary_name').catch(() => [] as OntologyTerm[]),
      searchCtss(t, 'hpo', 'name').catch(() => [] as OntologyTerm[]),
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
 * Istilah struktur anatomi dari UBERON + FMA lewat OLS4.
 */
export async function anatomyStructureLookup(terms: string[]): Promise<OntologyTerm[]> {
  const unik = [...new Set(terms.map(normalisasiKueri).filter(Boolean))].slice(0, 4)
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
