// Sinkronisasi kursor MPR (indeks voksel kolom/baris/irisan) ke ruang kotak 3D
// [-0.5, 0.5]^3 yang dipakai ray-caster. Tekstur disusun x=kolom, y=baris,
// z=irisan dan disampel di p + 0.5, jadi pusat voksel i dari n = (i + 0.5)/n - 0.5.
// Penyusutan tekstur tidak mengubah pecahan ini, karena dihitung dari dimensi asli.
export interface KursorVoksel { x: number; y: number; z: number }

export function kursorKeKotak(k: KursorVoksel, dim: { kolom: number; baris: number; kedalaman: number }): [number, number, number] {
  const f = (i: number, n: number) => (Math.min(n - 1, Math.max(0, i)) + 0.5) / n - 0.5
  return [f(k.x, dim.kolom), f(k.y, dim.baris), f(k.z, dim.kedalaman)]
}
