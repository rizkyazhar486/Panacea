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
    // Detect removed or renamed projected-label fields as well as added ones.
    if (!a || Object.keys(a).length !== Object.keys(b).length) return true
    for (const f of Object.keys(b)) {
      if (!Object.prototype.hasOwnProperty.call(a, f)) return true
      const x = a[f], y = b[f]
      if (typeof y === 'number' && typeof x === 'number') {
        // Koordinat tidak-finit: NaN tidak pulih lewat selisih numerik biasa.
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          if (!Object.is(x, y)) return true
        } else if (Math.abs(x - y) > tolPx) return true
      }
      else if (x !== y) return true
    }
  }
  return false
}
