// Lapisan retrieval/grounding untuk "Body Explorer" — mengambil istilah nyata
// dari dua ontologi kedokteran gratis (tanpa API key) alih-alih mengarang
// hubungan organ-penyakit-gejala sendiri:
//
//   - Human Disease Ontology (DOID) — pemetaan penyakit.
//   - Human Phenotype Ontology (HP) — pemetaan gejala/fenotipe.
//
// Sumbernya EBI OLS4 (Ontology Lookup Service), layanan publik EMBL-EBI yang
// mengindeks kedua ontologi ini beserta puluhan lainnya. Ini murni retrieval
// (mengembalikan istilah + definisi asli dari ontologinya), bukan penilaian
// klinis — lapisan LLM di atasnya yang merangkai istilah ini jadi penjelasan,
// dan wajib mengutip sumbernya (lihat groundingBlock di ai.ts).
const OLS4_BASE = 'https://www.ebi.ac.uk/ols4/api/search'

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

/**
 * Mengambil istilah penyakit (DOID) DAN gejala (HP) sekaligus untuk satu atau
 * lebih kata kunci — dipanggil per region tubuh yang diklik (lihat
 * bodyRegions.ts di sisi klien untuk daftar kata kuncinya).
 */
export async function anatomyOntologyLookup(terms: string[]): Promise<{ diseases: OntologyTerm[]; phenotypes: OntologyTerm[] }> {
  const unik = [...new Set(terms.map((t) => t.trim()).filter(Boolean))].slice(0, 4)
  const hasil = await Promise.all(
    unik.flatMap((t) => [
      searchOntology(t, 'doid', 4).catch(() => [] as OntologyTerm[]),
      searchOntology(t, 'hp', 4).catch(() => [] as OntologyTerm[]),
    ]),
  )
  const diseases: OntologyTerm[] = []
  const phenotypes: OntologyTerm[] = []
  for (let i = 0; i < hasil.length; i++) {
    const bucket = i % 2 === 0 ? diseases : phenotypes
    for (const term of hasil[i]) {
      if (!bucket.some((x) => x.id === term.id)) bucket.push(term)
    }
  }
  return { diseases: diseases.slice(0, 8), phenotypes: phenotypes.slice(0, 8) }
}
