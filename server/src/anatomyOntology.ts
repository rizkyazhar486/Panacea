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
// Penting: key_id pada tabel NLM `conditions` adalah identifier internal tabel,
// BUKAN DOID. Karena itu hasil Conditions tetap masuk bucket `diseases`, tetapi
// namespace/idSystem-nya dipertahankan sebagai NLM condition key dan tidak pernah
// dipresentasikan sebagai Disease Ontology identifier.
const OLS4_BASE = 'https://www.ebi.ac.uk/ols4/api/search'
const CTSS_BASE = 'https://clinicaltables.nlm.nih.gov/api'
const MAX_QUERY_LENGTH = 160
const MAX_OLS_ROWS = 10

export type OntologyNamespace = 'doid' | 'hp' | 'uberon' | 'fma' | 'nlm-condition'
export type OntologySource = 'ols4' | 'nlm-ctss'
export type OntologyIdSystem = 'DOID' | 'HP' | 'UBERON' | 'FMA' | 'NLM_CONDITION_KEY'
type OlsOntology = Exclude<OntologyNamespace, 'nlm-condition'>

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH)
}

function clampRows(rows: number): number {
  if (!Number.isFinite(rows)) return 5
  return Math.max(1, Math.min(MAX_OLS_ROWS, Math.trunc(rows)))
}

function idSystemForOntology(ontology: OlsOntology): OntologyIdSystem {
  if (ontology === 'doid') return 'DOID'
  if (ontology === 'hp') return 'HP'
  if (ontology === 'uberon') return 'UBERON'
  return 'FMA'
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

export interface OntologyTerm {
  id: string
  label: string
  ontology: OntologyNamespace
  idSystem: OntologyIdSystem
  source: OntologySource
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

async function searchOntology(query: string, ontology: OlsOntology, rows = 5): Promise<OntologyTerm[]> {
  const q = normalizeQuery(query)
  if (!q) return []
  const rowCount = clampRows(rows)
  const url = `${OLS4_BASE}?q=${encodeURIComponent(q)}&ontology=${ontology}&rows=${rowCount}&exact=false`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`OLS4 ${ontology} search failed: ${res.status}`)
  const data = (await res.json()) as { response?: { docs?: Ols4Doc[] } }
  const docs = Array.isArray(data.response?.docs) ? data.response?.docs ?? [] : []
  return docs
    .filter((d) => typeof d.obo_id === 'string' && d.obo_id.trim() && typeof d.label === 'string' && d.label.trim())
    .map((d) => ({
      id: (d.obo_id as string).trim(),
      label: (d.label as string).trim(),
      ontology,
      idSystem: idSystemForOntology(ontology),
      source: 'ols4' as const,
      sourceUrl: url,
      description: rapikanDefinisi(d.description?.[0] ?? ''),
      iri: typeof d.iri === 'string' ? d.iri.trim() : '',
    }))
}

// CTSS mengembalikan bentuk larik-tetap:
// [jumlahTotal, kodeArray, dataTambahan|null, tampilanArray].
// Untuk `conditions`, kodeArray diminta eksplisit dari field key_id internal
// NLM; untuk `hpo`, kodeArray diminta eksplisit dari field id dan harus berupa
// CURIE HP:. Keduanya tidak boleh diperlakukan sebagai sistem identifier sama.
type CtssResponse = [number, string[], unknown, string[]]

interface CtssSearchSpec {
  table: 'conditions' | 'hpo'
  ontology: 'nlm-condition' | 'hp'
  idSystem: 'NLM_CONDITION_KEY' | 'HP'
  codeField: 'key_id' | 'id'
  displayField: string
}

async function searchCtss(query: string, spec: CtssSearchSpec): Promise<OntologyTerm[]> {
  const q = normalizeQuery(query)
  if (!q) return []
  const url = `${CTSS_BASE}/${spec.table}/v3/search?terms=${encodeURIComponent(q)}&maxList=4&cf=${encodeURIComponent(spec.codeField)}&df=${encodeURIComponent(spec.displayField)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`CTSS ${spec.table} search failed: ${res.status}`)
  const data = (await res.json()) as CtssResponse
  if (!Array.isArray(data)) return []
  const codes = Array.isArray(data[1]) ? data[1] : []
  const display = Array.isArray(data[3]) ? data[3] : []
  const out: OntologyTerm[] = []
  for (let i = 0; i < Math.min(codes.length, display.length); i++) {
    const label = String(display[i] ?? '').trim()
    const code = String(codes[i] ?? '').trim()
    if (!label || !code) continue
    // HPO harus benar-benar membawa CURIE HP:. Kalau upstream berubah bentuk,
    // lebih aman membuang record daripada memberi label HPO pada ID yang salah.
    if (spec.idSystem === 'HP' && !/^HP:\d+$/i.test(code)) continue
    out.push({
      id: code,
      label,
      ontology: spec.ontology,
      idSystem: spec.idSystem,
      source: 'nlm-ctss',
      sourceUrl: url,
      description: '',
      iri: '',
    })
  }
  return out
}

/**
 * Mengambil istilah penyakit DAN gejala sekaligus untuk satu atau lebih kata
 * kunci. OLS4 dan NLM CTSS dijalankan paralel; sumber yang gagal tidak membuat
 * sumber lain ikut hilang. Bucket `diseases` adalah grouping produk, bukan
 * klaim bahwa semua identifier di dalamnya berasal dari DOID.
 */
export async function anatomyOntologyLookup(terms: string[]): Promise<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }> {
  const unik = [...new Set(terms.map(normalizeQuery).filter(Boolean))].slice(0, 4)
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'doid', 4).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'hp', 4).catch(() => [] as OntologyTerm[]),
      searchCtss(t, {
        table: 'conditions',
        ontology: 'nlm-condition',
        idSystem: 'NLM_CONDITION_KEY',
        codeField: 'key_id',
        displayField: 'primary_name',
      }).catch(() => [] as OntologyTerm[]),
      searchCtss(t, {
        table: 'hpo',
        ontology: 'hp',
        idSystem: 'HP',
        codeField: 'id',
        displayField: 'name',
      }).catch(() => [] as OntologyTerm[]),
    ]),
  )
  const diseases: OntologyTerm[] = []
  const phenotypes: OntologyTerm[] = []
  for (let i = 0; i < hasil.length; i++) {
    // Urutan tiap 4: [doid-OLS4, hp-OLS4, condition-CTSS, hp-CTSS].
    const bucket = i % 2 === 0 ? diseases : phenotypes
    for (const term of hasil[i]) {
      // Jangan collapse term lintas-source hanya karena label sama. DOID dan
      // NLM Conditions harus tetap dapat diaudit sebagai record berbeda.
      if (!bucket.some((x) => x.source === term.source && x.idSystem === term.idSystem && x.id === term.id)) {
        bucket.push(term)
      }
    }
  }
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
 *   - FMA (Foundational Model of Anatomy) — ontologi anatomi manusia.
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
      if (!out.some((x) => x.source === term.source && x.idSystem === term.idSystem && x.id === term.id)) out.push(term)
    }
  }
  return out.slice(0, 10)
}
