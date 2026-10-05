export interface OrganFakta {
  label: string
  keywords: readonly string[]
  definisi: string
}

/** Vessel, nerve, bone and muscle names stay in their own class. */
const BUKAN_ORGAN = /^(a skeletal muscle|part of the nervous system|an artery|a vein|a bone|cartilage|a tendon|a ligament)/

const ABAI = new Set(['region', 'node', 'bone', 'nerve'])

/**
 * When a structure name is the organ itself, use that organ's written definition.
 * A vein or nerve that merely passes the organ does not inherit the organ sentence.
 */
export function faktaMilikOrgan(nama: string, jenis: string, organ: readonly OrganFakta[]): string | null {
  const rapi = nama.replace(/\s+/g, ' ').trim()
  if (!rapi || !jenis.trim() || BUKAN_ORGAN.test(jenis)) return null
  const n = ` ${rapi.toLowerCase()} `
  let terbaik: { label: string; definisi: string; panjang: number } | null = null
  for (const o of organ) {
    if (!o.definisi.trim()) continue
    for (const mentah of o.keywords) {
      const kata = mentah.trim().toLowerCase()
      if (kata.length < 4 || ABAI.has(kata)) continue
      const batas = new RegExp(`(^|[^a-z])${kata.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`)
      if (!batas.test(n)) continue
      if (!terbaik || kata.length > terbaik.panjang) {
        terbaik = { label: o.label, definisi: o.definisi.trim(), panjang: kata.length }
      }
    }
  }
  if (!terbaik) return null
  return `${rapi} belongs to the ${terbaik.label}: ${terbaik.definisi}`
}
