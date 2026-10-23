// Ringkasan galat untuk layar "Something went wrong" (ErrorBoundary akar). Murni dan tidak pernah melempar: layar galat tidak
// boleh jatuh karena galat saat merangkum galat. Privasi: rute tanpa query/hash-parameter; pesan dipangkas; karakter kontrol
// dan baris baru dipadatkan agar tidak membawa tata letak atau isi berlapis.
export const MAKS_PESAN_GALAT = 200
export const MAKS_RUTE_GALAT = 120

export interface RingkasGalat { pesan: string; rute: string }

const padatkan = (teks: string, maks: number): string => teks.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maks)

function teksGalat(galat: unknown): string {
  try {
    if (galat instanceof Error) return `${galat.name}: ${galat.message}`
    if (typeof galat === 'string') return galat
    if (galat === null || galat === undefined) return 'unknown error'
    return String(galat)
  } catch {
    return 'unknown error'
  }
}

export function ringkasGalat(galat: unknown, rute: unknown): RingkasGalat {
  const pesan = padatkan(teksGalat(galat), MAKS_PESAN_GALAT) || 'unknown error'
  let r = ''
  try { r = typeof rute === 'string' ? rute : '' } catch { r = '' }
  return { pesan, rute: padatkan(r.replace(/^#/, '').split('?')[0], MAKS_RUTE_GALAT) || '/' }
}
