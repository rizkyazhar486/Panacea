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
// Penting: grouping UI dan sistem identifier adalah dua hal berbeda. Hasil
// NLM `conditions` masuk bucket penyakit supaya tetap kompatibel dengan UI,
// tetapi key_id NLM BUKAN DOID. Karena itu setiap term membawa `source` dan
// `idSystem` eksplisit agar provenance tidak pernah disimpulkan dari bucket.
const OLS4_BASE = 'https://www.ebi.ac.uk/ols4/api/search'
const CTSS_BASE = 'https://clinicaltables.nlm.nih.gov/api'
const MAX_QUERY_LENGTH = 160
const MAX_LOOKUP_TERMS = 4

export type OntologySource = 'ols4' | 'nlm-ctss'
export type OntologyIdSystem = 'DOID' | 'HP' | 'UBERON' | 'FMA' | 'NLM_CONDITIONS_KEY'

const OLS_ID_SYSTEM: Record<'doid' | 'hp' | 'uberon' | 'fma', OntologyIdSystem> = {
  doid: 'DOID',
  hp: 'HP',
  uberon: 'UBERON',
  fma: 'FMA',
}

function normalizeLookupQuery(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH)
}

function normalizeLookupTerms(terms: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of terms) {
    const normalized = normalizeLookupQuery(raw)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
    if (out.length >= MAX_LOOKUP_TERMS) break
  }
  return out
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
  // "symptom: fever, symptom: malaise, symptom: back pain" -> satu daftar.
  t = t.replace(/symptom:\s*/g, (function () {
    let pertama = true
    return () => (pertama ? ((pertama = false), 'symptoms include ') : '')
  })())
  return t.replace(/\s+/g, ' ').trim()
}

/**
 * Mengurutkan hasil menurut relevansi terhadap yang dicari.
 *
 * Tanpa ini, mencari "back pain" mengembalikan demam Lassa dan brucellosis —
 * keduanya memang MENYEBUT nyeri punggung di antara daftar gejalanya, jadi
 * mesin cari menganggapnya cocok. Yang dicari pengguna adalah penyakit yang
 * MEMANG TENTANG bagian itu, bukan penyakit apa saja yang kebetulan
 * menyinggungnya.
 *
 * Aturannya sederhana dan bisa diperiksa: cocok pada LABEL jauh lebih berarti
 * daripada cocok pada definisi, dan cocok seluruh frasa lebih berarti daripada
 * cocok satu kata.
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
    // Skor nol berarti tidak ada satu pun kata pencarian yang muncul di label
    // MAUPUN definisinya — hasil seperti itu tidak menjelaskan apa pun.
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.t)
}

export interface OntologyTerm {
  id: string
  label: string
  // `ontology` dipertahankan sebagai grouping kompatibilitas. Gunakan
  // `idSystem` untuk mengetahui namespace identifier yang sebenarnya.
  ontology: 'doid' | 'hp' | 'uberon' | 'fma'
  source: OntologySource
  idSystem: OntologyIdSystem
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

async function searchOntology(query: string, ontology: OntologyTerm['ontology'], rows = 5): Promise<OntologyTerm[]> {
  const normalizedQuery = normalizeLookupQuery(query)
  if (!normalizedQuery) return []
  const safeRows = Math.max(1, Math.min(10, Math.trunc(rows) || 5))
  const url = `${OLS4_BASE}?q=${encodeURIComponent(normalizedQuery)}&ontology=${ontology}&rows=${safeRows}&exact=false`
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
      source: 'ols4' as const,
      idSystem: OLS_ID_SYSTEM[ontology],
      description: rapikanDefinisi(d.description?.[0] ?? ''),
      iri: d.iri ?? '',
    }))
}

// CTSS mengembalikan bentuk larik-tetap:
// [jumlahTotal, kodeArray, dataTambahan|null, tampilanArray]. `conditions`
// menggunakan key_id internal NLM; `hpo` menggunakan identifier HPO (HP:...).
// Keduanya tidak boleh disamakan hanya karena berada pada bucket UI yang sama.
type CtssResponse = [number, string[], unknown, string[]]

async function searchCtss(query: string, table: 'conditions' | 'hpo', ontology: 'doid' | 'hp', displayField: string): Promise<OntologyTerm[]> {
  const normalizedQuery = normalizeLookupQuery(query)
  if (!normalizedQuery) return []
  const codeField = table === 'conditions' ? 'key_id' : 'id'
  const url = `${CTSS_BASE}/${table}/v3/search?terms=${encodeURIComponent(normalizedQuery)}&maxList=4&cf=${codeField}&df=${displayField}`
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
    out.push({
      id: code || `NLM:${table}:${i}`,
      label,
      ontology,
      source: 'nlm-ctss',
      idSystem: table === 'conditions' ? 'NLM_CONDITIONS_KEY' : 'HP',
      description: '',
      iri: '',
    })
  }
  return out
}

/**
 * Mengambil istilah penyakit DAN gejala sekaligus untuk satu atau lebih kata
 * kunci. OLS4 dan NLM CTSS dijalankan bersamaan agar satu upstream yang gagal
 * tidak mengosongkan seluruh panel. `ontology` adalah bucket kompatibilitas;
 * `source` + `idSystem` adalah provenance yang harus digunakan untuk citation,
 * linking, atau crosswalk.
 */
export async function anatomyOntologyLookup(terms: string[]): Promise<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }> {
  const unik = normalizeLookupTerms(terms)
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
    // Urutan tiap 4: [doid-OLS4, hp-OLS4, conditions-CTSS, hpo-CTSS].
    const bucket = i % 2 === 0 ? diseases : phenotypes
    for (const term of hasil[i]) {
      if (!bucket.some((x) => x.label.toLowerCase() === term.label.toLowerCase())) bucket.push(term)
    }
  }
  return {
    diseases: urutkanRelevansi(diseases, unik).slice(0, 8),
    phenotypes: urutkanRelevansi(phenotypes, unik).slice(0, 8),
  }
}

/**
 * Istilah STRUKTUR ANATOMI (bukan penyakit/gejala) dari dua ontologi anatomi
 * yang juga dilayani OLS4 tanpa API key:
 *
 *   - UBERON — ontologi anatomi lintas spesies.
 *   - FMA (Foundational Model of Anatomy) — ontologi anatomi manusia rinci.
 *
 * Hasil ini adalah grounding terminologi, bukan geometri 3D baru.
 */
export async function anatomyStructureLookup(terms: string[]): Promise<OntologyTerm[]> {
  const unik = normalizeLookupTerms(terms)
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
