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
//      Library of Medicine, mengindeks tabel "conditions" dan "hpo".
//
// Penting: identifier tabel NLM `conditions` adalah key internal Clinical
// Tables, BUKAN DOID. Karena itu provenance + sistem identifier disimpan secara
// eksplisit dan hasil conditions tidak pernah dilabeli sebagai Disease Ontology.
const OLS4_BASE = 'https://www.ebi.ac.uk/ols4/api/search'
const CTSS_BASE = 'https://clinicaltables.nlm.nih.gov/api'
const QUERY_MAX = 160

export type OntologyNamespace = 'doid' | 'hp' | 'uberon' | 'fma' | 'nlm-condition'
export type OntologySource = 'ols4' | 'nlm-ctss'
export type OntologyIdSystem = 'doid' | 'hp' | 'uberon' | 'fma' | 'nlm-condition-key'

function normalisasiKueri(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, QUERY_MAX)
}

function clampRows(rows: number, fallback = 5): number {
  if (!Number.isFinite(rows)) return fallback
  return Math.max(1, Math.min(10, Math.trunc(rows)))
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
 * Tanpa ini, mencari "back pain" mengembalikan penyakit yang hanya kebetulan
 * menyebut nyeri punggung di definisinya. Label exact/partial diberi bobot lebih
 * tinggi daripada kecocokan definisi. Skor ini hanya ranking retrieval, bukan
 * confidence klinis.
 */
export function urutkanRelevansi(terms: OntologyTerm[], kueri: string[]): OntologyTerm[] {
  const frasa = kueri.map((k) => normalisasiKueri(k).toLowerCase()).filter(Boolean)
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
  /** Identifier dari source asal; jangan diinterpretasikan di luar `idSystem`. */
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

type OlsOntology = Exclude<OntologyNamespace, 'nlm-condition'>

async function searchOntology(query: string, ontology: OlsOntology, rows = 5): Promise<OntologyTerm[]> {
  const q = normalisasiKueri(query)
  if (!q) return []
  const count = clampRows(rows)
  const url = `${OLS4_BASE}?q=${encodeURIComponent(q)}&ontology=${ontology}&rows=${count}&exact=false`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`OLS4 ${ontology} search failed: ${res.status}`)
  const data = (await res.json()) as { response?: { docs?: Ols4Doc[] } }
  const docs = data.response?.docs ?? []
  return docs
    .filter((d) => Boolean(d.obo_id?.trim()) && Boolean(d.label?.trim()))
    .map((d) => ({
      id: (d.obo_id as string).trim(),
      label: (d.label as string).trim(),
      ontology,
      idSystem: ontology,
      source: 'ols4' as const,
      sourceUrl: url,
      description: rapikanDefinisi(d.description?.[0] ?? ''),
      iri: typeof d.iri === 'string' && /^https?:\/\//i.test(d.iri) ? d.iri : '',
    }))
}

// CTSS mengembalikan bentuk larik-tetap yang sama di semua tabelnya:
// [jumlahTotal, kodeArray, dataTambahan|null, tampilanArray].
//
// `conditions` menggunakan key_id internal Clinical Tables. Itu bukan DOID.
// `hpo` menggunakan identifier HP:* yang memang berasal dari HPO.
type CtssResponse = [number, string[], unknown, string[]]

type CtssTableConfig = {
  table: 'conditions' | 'hpo'
  displayField: string
  ontology: 'nlm-condition' | 'hp'
  idSystem: 'nlm-condition-key' | 'hp'
}

const CTSS_TABLES: Record<'conditions' | 'hpo', CtssTableConfig> = {
  conditions: {
    table: 'conditions',
    displayField: 'primary_name',
    ontology: 'nlm-condition',
    idSystem: 'nlm-condition-key',
  },
  hpo: {
    table: 'hpo',
    displayField: 'name',
    ontology: 'hp',
    idSystem: 'hp',
  },
}

async function searchCtss(query: string, table: 'conditions' | 'hpo'): Promise<OntologyTerm[]> {
  const q = normalisasiKueri(query)
  if (!q) return []
  const cfg = CTSS_TABLES[table]
  const url = `${CTSS_BASE}/${cfg.table}/v3/search?terms=${encodeURIComponent(q)}&maxList=4&df=${cfg.displayField}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`CTSS ${table} search failed: ${res.status}`)
  const data = (await res.json()) as CtssResponse
  if (!Array.isArray(data)) return []
  const codes = Array.isArray(data[1]) ? data[1] : []
  const display = Array.isArray(data[3]) ? data[3] : []
  const out: OntologyTerm[] = []
  for (let i = 0; i < Math.min(codes.length, display.length, 4); i++) {
    const label = String(display[i] ?? '').trim()
    const code = String(codes[i] ?? '').trim()
    if (!label || !code) continue
    if (table === 'hpo' && !/^HP:\d+$/i.test(code)) continue
    out.push({
      id: code,
      label,
      ontology: cfg.ontology,
      idSystem: cfg.idSystem,
      source: 'nlm-ctss',
      sourceUrl: url,
      description: '',
      iri: '',
    })
  }
  return out
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const term of terms) {
    const normalized = normalisasiKueri(term)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
    if (out.length >= 4) break
  }
  return out
}

/**
 * Mengambil penyakit DAN fenotipe sekaligus untuk satu atau lebih kata kunci.
 * OLS4 dan NLM CTSS dijalankan bersamaan; kegagalan salah satu sumber tidak
 * membuat sumber lain ikut hilang. Source identity selalu ikut di tiap term.
 */
export async function anatomyOntologyLookup(terms: string[]): Promise<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }> {
  const unik = uniqueTerms(terms)
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'doid', 4).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'hp', 4).catch(() => [] as OntologyTerm[]),
      searchCtss(t, 'conditions').catch(() => [] as OntologyTerm[]),
      searchCtss(t, 'hpo').catch(() => [] as OntologyTerm[]),
    ]),
  )
  const diseases: OntologyTerm[] = []
  const phenotypes: OntologyTerm[] = []
  for (let i = 0; i < hasil.length; i++) {
    // Urutan tiap 4: [DOID OLS4, HP OLS4, NLM conditions, NLM HPO].
    // Disease berada pada posisi 0/2, phenotype pada 1/3.
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
 * Istilah struktur anatomi (bukan penyakit/gejala) dari UBERON + FMA lewat
 * OLS4. Ini adalah semantic grounding; ada/tidaknya istilah ontology tidak
 * berarti mesh 3D tersedia dan tidak boleh dipakai untuk membuat geometri palsu.
 */
export async function anatomyStructureLookup(terms: string[]): Promise<OntologyTerm[]> {
  const unik = uniqueTerms(terms)
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
  return urutkanRelevansi(out, unik).slice(0, 10)
}
