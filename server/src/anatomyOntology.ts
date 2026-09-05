// Lapisan retrieval/grounding untuk "Body Explorer" — mengambil istilah nyata
// dari ontologi kedokteran gratis (tanpa API key) alih-alih mengarang
// hubungan organ-penyakit-gejala sendiri:
//
//   - Human Disease Ontology (DOID) — pemetaan penyakit.
//   - Human Phenotype Ontology (HP) — pemetaan gejala/fenotipe.
//
// DUA sumber, bukan satu — tidak bisa diuji langsung dari sandbox ini
// (jaringan dibatasi), jadi alih-alih menebak satu sumber "yang benar" dan
// berisiko keduanya diam-diam kosong, permintaannya dijalankan ke keduanya
// SEKALIGUS dan hasilnya digabung:
//   1. EBI OLS4 (Ontology Lookup Service) — layanan publik EMBL-EBI.
//   2. NLM Clinical Table Search Service (CTSS) — layanan publik US National
//      Library of Medicine, dipakai luas di sistem kesehatan AS, mengindeks
//      tabel "conditions" (penyakit, dari MedlinePlus) dan "hpo" (fenotipe).
// Kalau salah satu gagal atau kosong, sumber yang lain tetap mengisi
// hasilnya — tidak lagi bergantung pada satu API saja.
const OLS4_BASE = 'https://www.ebi.ac.uk/ols4/api/search'
const CTSS_BASE = 'https://clinicaltables.nlm.nih.gov/api'

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
  id: string // CURIE, mis. "DOID:9351" atau "HP:0001945"
  label: string
  ontology: 'doid' | 'hp' | 'uberon' | 'fma'
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
  const url = `${OLS4_BASE}?q=${encodeURIComponent(query)}&ontology=${ontology}&rows=${rows}&exact=false`
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
      description: rapikanDefinisi(d.description?.[0] ?? ''),
      iri: d.iri ?? '',
    }))
}

// CTSS mengembalikan bentuk larik-tetap yang sama di semua tabelnya:
// [jumlahTotal, kodeArray, dataTambahan|null, tampilanArray]. Ditulis defensif
// (Array.isArray di tiap langkah) karena bentuk persisnya tidak bisa
// diverifikasi langsung dari sandbox ini — lebih baik kembali kosong daripada
// melempar galat kalau satu field tidak seperti dugaan.
type CtssResponse = [number, string[], unknown, string[]]

async function searchCtss(query: string, table: 'conditions' | 'hpo', ontology: 'doid' | 'hp', displayField: string): Promise<OntologyTerm[]> {
  const url = `${CTSS_BASE}/${table}/v3/search?terms=${encodeURIComponent(query)}&maxList=4&df=${displayField}`
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
      description: '',
      iri: '',
    })
  }
  return out
}

/**
 * Mengambil istilah penyakit (DOID) DAN gejala (HP) sekaligus untuk satu atau
 * lebih kata kunci — dipanggil per region tubuh yang diklik (lihat
 * bodyRegions.ts di sisi klien untuk daftar kata kuncinya). Menjalankan EBI
 * OLS4 dan NLM CTSS SEKALIGUS untuk tiap kata kunci dan menggabung hasilnya,
 * bukan memilih satu lalu jatuh ke yang lain — supaya satu sumber yang
 * lambat/kosong tidak berarti hasilnya kosong sama sekali.
 */
export async function anatomyOntologyLookup(terms: string[]): Promise<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }> {
  const unik = [...new Set(terms.map((t) => t.trim()).filter(Boolean))].slice(0, 4)
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
    // Urutan tiap 4: [doid-OLS4, hp-OLS4, doid-CTSS, hp-CTSS] — indeks genap
    // masuk diseases, ganjil masuk phenotypes.
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
 *   - FMA (Foundational Model of Anatomy) — ontologi anatomi manusia paling
 *     rinci yang tersedia bebas.
 *
 * Ini menutup dua celah yang memang TIDAK ADA geometrinya di model 3D
 * Z-Anatomy/BodyParts3D (sudah diperiksa sampai tingkat koleksi, bukan
 * diasumsikan): organ reproduksi wanita (uterus, ovarium, tuba uterina,
 * serviks, vagina) dan struktur mikroskopik kulit (epidermis, dermis, folikel
 * rambut, kelenjar sebasea/keringat). Untuk keduanya, aplikasi kini punya
 * istilah anatomi nyata berikut definisinya, meski bentuk 3D-nya belum ada.
 */
export async function anatomyStructureLookup(terms: string[]): Promise<OntologyTerm[]> {
  const unik = [...new Set(terms.map((t) => t.trim()).filter(Boolean))].slice(0, 4)
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
