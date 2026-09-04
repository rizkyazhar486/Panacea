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

export interface OntologyTerm {
  id: string // CURIE, mis. "DOID:9351" atau "HP:0001945"
  label: string
  ontology: 'doid' | 'hp'
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

async function searchOntology(query: string, ontology: 'doid' | 'hp', rows = 5): Promise<OntologyTerm[]> {
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
      description: d.description?.[0] ?? '',
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
  return { diseases: diseases.slice(0, 8), phenotypes: phenotypes.slice(0, 8) }
}
