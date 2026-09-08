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

type FetchLike = typeof fetch

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

export type OntologyName = 'doid' | 'hp' | 'uberon' | 'fma' | 'nlm-conditions'
export type OntologySource = 'ebi-ols4' | 'nlm-ctss'
export type OntologyIdentifierSystem = 'DOID' | 'HP' | 'UBERON' | 'FMA' | 'NLM_CONDITIONS_KEY'
type OlsOntologyName = Exclude<OntologyName, 'nlm-conditions'>

export interface OntologyTerm {
  id: string // CURIE bila tersedia; CTSS conditions memakai key internal NLM.
  label: string
  ontology: OntologyName
  source: OntologySource
  identifierSystem: OntologyIdentifierSystem
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
  fetchImpl: FetchLike = fetch,
): Promise<OntologyTerm[]> {
  const url = `${OLS4_BASE}?q=${encodeURIComponent(query)}&ontology=${ontology}&rows=${rows}&exact=false`
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`OLS4 ${ontology} search failed: ${res.status}`)
  const data = (await res.json()) as { response?: { docs?: Ols4Doc[] } }
  const docs = data.response?.docs ?? []
  return docs
    .filter((d) => d.obo_id && d.label)
    .map((d) => ({
      id: d.obo_id as string,
      label: d.label as string,
      ontology,
      source: 'ebi-ols4',
      identifierSystem: identifierSystemForOls(ontology),
      description: rapikanDefinisi(d.description?.[0] ?? ''),
      iri: d.iri ?? '',
    }))
}

// CTSS mengembalikan bentuk larik-tetap:
// [jumlahTotal, kodeArray, dataTambahan|null, tampilanArray]. Tiap elemen pada
// tampilanArray secara resmi merupakan array dari field display yang diminta.
// Parser tetap menerima scalar sebagai fallback defensif bila format upstream
// berubah, tetapi tidak mengasumsikan string[] flat.
type CtssResponse = [number, unknown[], unknown, unknown[]]

type CtssTableConfig =
  | { table: 'conditions'; ontology: 'nlm-conditions'; identifierSystem: 'NLM_CONDITIONS_KEY'; displayField: 'primary_name' }
  | { table: 'hpo'; ontology: 'hp'; identifierSystem: 'HP'; displayField: 'name' }

function ctssDisplayLabel(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '').trim()
  return String(value ?? '').trim()
}

async function searchCtss(
  query: string,
  config: CtssTableConfig,
  fetchImpl: FetchLike = fetch,
): Promise<OntologyTerm[]> {
  const { table, ontology, identifierSystem, displayField } = config
  const url = `${CTSS_BASE}/${table}/v3/search?terms=${encodeURIComponent(query)}&maxList=4&df=${displayField}`
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
    if (!label) continue
    out.push({
      id: code || `NLM:${table}:${i}`,
      label,
      ontology,
      source: 'nlm-ctss',
      identifierSystem,
      description: '',
      iri: '',
    })
  }
  return out
}

/**
 * Mengambil istilah penyakit DAN gejala sekaligus untuk satu atau lebih kata
 * kunci — dipanggil per region tubuh yang diklik. EBI OLS4 dan NLM CTSS
 * dijalankan sekaligus supaya satu sumber yang lambat/kosong tidak membuat
 * seluruh grounding hilang. CTSS conditions tetap masuk bucket diseases,
 * tetapi namespace identifier-nya tidak pernah dipalsukan sebagai DOID.
 */
export async function anatomyOntologyLookup(
  terms: string[],
  fetchImpl: FetchLike = fetch,
): Promise<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }> {
  const unik = [...new Set(terms.map((t) => t.trim()).filter(Boolean))].slice(0, 4)
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'doid', 4, fetchImpl).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'hp', 4, fetchImpl).catch(() => [] as OntologyTerm[]),
      searchCtss(t, {
        table: 'conditions',
        ontology: 'nlm-conditions',
        identifierSystem: 'NLM_CONDITIONS_KEY',
        displayField: 'primary_name',
      }, fetchImpl).catch(() => [] as OntologyTerm[]),
      searchCtss(t, {
        table: 'hpo',
        ontology: 'hp',
        identifierSystem: 'HP',
        displayField: 'name',
      }, fetchImpl).catch(() => [] as OntologyTerm[]),
    ]),
  )
  const diseases: OntologyTerm[] = []
  const phenotypes: OntologyTerm[] = []
  for (let i = 0; i < hasil.length; i++) {
    // Urutan tiap 4: [doid-OLS4, hp-OLS4, conditions-CTSS, hp-CTSS] — indeks
    // genap masuk diseases, ganjil masuk phenotypes.
    const bucket = i % 2 === 0 ? diseases : phenotypes
    for (const term of hasil[i]) {
      if (!bucket.some((x) => x.label.toLowerCase() === term.label.toLowerCase())) bucket.push(term)
    }
  }
  // Diurutkan menurut relevansi terhadap yang dicari SEBELUM dipotong, supaya
  // delapan yang tampil adalah delapan yang paling berkaitan — bukan delapan
  // pertama yang kebetulan dikembalikan mesin cari.
  return {
    diseases: urutkanRelevansi(diseases, terms).slice(0, 8),
    phenotypes: urutkanRelevansi(phenotypes, terms).slice(0, 8),
  }
}

/**
 * Istilah STRUKTUR ANATOMI (bukan penyakit/gejala) dari dua ontologi anatomi
 * yang juga dilayani OLS4 tanpa API key:
 *
 *   - UBERON — ontologi anatomi lintas spesies.
 *   - FMA (Foundational Model of Anatomy) — ontologi anatomi manusia rinci.
 *
 * Ini menyediakan semantic grounding untuk struktur yang belum tentu memiliki
 * geometri 3D lokal. Metadata istilah tidak boleh dianggap sebagai bukti bahwa
 * mesh yang sesuai sudah tersedia atau tervalidasi.
 */
export async function anatomyStructureLookup(
  terms: string[],
  fetchImpl: FetchLike = fetch,
): Promise<OntologyTerm[]> {
  const unik = [...new Set(terms.map((t) => t.trim()).filter(Boolean))].slice(0, 4)
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'uberon', 4, fetchImpl).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'fma', 4, fetchImpl).catch(() => [] as OntologyTerm[]),
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
