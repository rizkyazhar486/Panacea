export interface OrganFakta {
  label: string
  keywords: readonly string[]
  definisi: string
}

export interface CalonOrgan {
  key: string
  keywords: readonly string[]
}

/** Vessel, nerve, bone and muscle names stay in their own class. */
const BUKAN_ORGAN = /^(a skeletal muscle|part of the nervous system|an artery|a vein|a bone|cartilage|a tendon|a ligament)/

const ABAI = new Set(['region', 'node', 'bone', 'nerve'])

/**
 * When a structure name is the organ itself, use that organ's written definition.
 * A vein or nerve that merely passes the organ does not inherit the organ sentence.
 */
function pilihOrgan<T extends { keywords: readonly string[] }>(
  nama: string,
  jenis: string,
  organ: readonly T[],
  layak: (item: T) => boolean,
): { item: T; nama: string } | null {
  const rapi = nama.replace(/\s+/g, ' ').trim()
  if (!rapi || !jenis.trim() || BUKAN_ORGAN.test(jenis)) return null
  const n = ` ${rapi.toLowerCase()} `
  let terbaik: { item: T; panjang: number } | null = null
  for (const item of organ) {
    if (!layak(item)) continue
    for (const mentah of item.keywords) {
      const kata = mentah.trim().toLowerCase()
      if (kata.length < 4 || ABAI.has(kata)) continue
      const batas = new RegExp(`(^|[^a-z])${kata.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`)
      if (!batas.test(n)) continue
      if (!terbaik || kata.length > terbaik.panjang) terbaik = { item, panjang: kata.length }
    }
  }
  return terbaik ? { item: terbaik.item, nama: rapi } : null
}

export function faktaMilikOrgan(nama: string, jenis: string, organ: readonly OrganFakta[]): string | null {
  const pilih = pilihOrgan(nama, jenis, organ, (o) => o.definisi.trim().length > 0)
  if (!pilih) return null
  return `${pilih.nama} belongs to the ${pilih.item.label}: ${pilih.item.definisi.trim()}`
}

/** Organ key for a named structure. A passing vessel, nerve, bone, or muscle stays unmatched. */
export function kunciMilikOrgan(nama: string, jenis: string, organ: readonly CalonOrgan[]): string | null {
  return pilihOrgan(nama, jenis, organ, () => true)?.item.key ?? null
}
