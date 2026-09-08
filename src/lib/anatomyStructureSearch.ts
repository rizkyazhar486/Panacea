import { ATLAS_MODULE_INFO, ATLAS_PARTS } from './systemAtlas.gen'
import { CARDIO_PARTS } from './cardioAtlas.gen'
import { skorTeks } from './bodySearch'

// Pencarian struktur specialty sengaja hanya mengindeks nama yang berasal dari
// metadata mesh. Tidak ada sinonim buatan atau fallback ke struktur lain: jika
// nama tidak ada di metadata atlas, hasil tidak dibuat.

export interface StrukturAtlasCari {
  module: string
  moduleLabel: string
  name: string
  kind: string
  region?: string
  score: number
}

function skorNama(nama: string, kueri: string): number {
  const kata = kueri.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!kata.length) return 0
  let total = 0
  for (const k of kata) {
    const skor = skorTeks(nama, k)
    if (skor <= 0) return 0
    total += skor
  }
  return total
}

export function cariStrukturAtlas(kueri: string, maks = 30): StrukturAtlasCari[] {
  const q = kueri.trim()
  if (q.length < 2) return []

  const hasil: StrukturAtlasCari[] = []
  for (const p of ATLAS_PARTS) {
    const score = skorNama(p.name, q)
    if (score <= 0) continue
    hasil.push({
      module: p.module,
      moduleLabel: ATLAS_MODULE_INFO[p.module]?.label ?? p.module,
      name: p.name,
      kind: p.kind,
      score,
    })
  }
  for (const p of CARDIO_PARTS) {
    const score = skorNama(p.name, q)
    if (score <= 0) continue
    hasil.push({
      module: 'cardio',
      moduleLabel: 'Cardio lab',
      name: p.name,
      kind: p.kind,
      region: p.region,
      score,
    })
  }

  // Nama yang sama boleh muncul di dua modul yang memang berbeda. Keduanya
  // dipertahankan karena masing-masing membuka berkas geometri yang berbeda.
  return hasil
    .sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name) || a.module.localeCompare(b.module))
    .slice(0, maks)
}

export function cakupanStrukturAtlas(): { struktur: number; modul: number } {
  return {
    struktur: ATLAS_PARTS.length + CARDIO_PARTS.length,
    modul: Object.keys(ATLAS_MODULE_INFO).length + 1,
  }
}
