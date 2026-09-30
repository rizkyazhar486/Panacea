// Label 3D yang diproyeksikan ke layar dihitung tiap frame; React hanya perlu dirender ulang
// bila posisi (px) atau nilai benar-benar berubah melewati toleransi. Tanpa ini setState
// dipanggil ~60×/detik walau kamera diam.
export type TitikLayar = Record<string, Record<string, number | boolean>>

export function layarBerubah(lama: TitikLayar | null, baru: TitikLayar, tolPx = 0.5): boolean {
  if (!lama) return true
  const kl = Object.keys(lama), kb = Object.keys(baru)
  if (kl.length !== kb.length) return true
  for (const k of kb) {
    const a = lama[k], b = baru[k]
    if (!a) return true
    for (const f of Object.keys(b)) {
      const x = a[f], y = b[f]
      if (typeof y === 'number' && typeof x === 'number') { if (Math.abs(x - y) > tolPx) return true }
      else if (x !== y) return true
    }
  }
  return false
}
