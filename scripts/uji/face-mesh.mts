// Wajah dari foto, langkah 2: titik wajah → permukaan 3D. Delaunay sahih (tidak ada titik di dalam lingkaran-luar
// segitiga mana pun), wajah tingginya tepat 2 unit dan terpusat, semua segitiga menghadap kamera, titik iris dibuang,
// dan masukan rusak ditolak utuh (null), bukan wajah setengah jadi.
import assert from 'node:assert/strict'
import { FACE_SURFACE_POINTS, buildFaceMesh, coverRect, delaunay, type FacePoint } from '../../src/domains/body-exposure/engine/face-capture/faceMesh.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

// 18 × 26 = 468 titik dengan goyangan deterministik (tanpa Math.random) agar tidak ada empat titik sekonsiklik.
const wajah = (): FacePoint[] => Array.from({ length: 468 }, (_, i) => {
  const c = i % 18, r = Math.floor(i / 18)
  const x = 0.3 + c * 0.4 / 17 + ((i * 37) % 11 - 5) * 1e-4
  const y = 0.2 + r * 0.6 / 25 + ((i * 53) % 13 - 6) * 1e-4
  return { x, y, z: -0.1 * (1 - ((x - 0.5) / 0.2) ** 2 - ((y - 0.5) / 0.3) ** 2) }
})

gagal('delaunay-kasus-kecil-eksak', () => {
  assert.equal(delaunay([[0, 0], [1, 0], [1, 1.1], [0, 1]]).length / 3, 2)
  assert.equal(delaunay([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1.05]]).length / 3, 4, 'segi empat + titik tengah')
  assert.deepEqual(delaunay([[0, 0], [1, 0]]), [])
  assert.deepEqual(delaunay([[0, 0], [1, 0], [Number.NaN, 1]]), [], 'titik tak hingga ditolak')
})
gagal('delaunay-sahih-pada-468-titik', () => {
  const p = wajah().map((q) => [q.x, q.y] as const)
  const t = delaunay(p)
  assert.ok(t.length / 3 > 800, `segitiga ${t.length / 3}`)
  for (let k = 0; k < t.length; k += 3) {
    const [a, b, c] = [p[t[k]!]!, p[t[k + 1]!]!, p[t[k + 2]!]!]
    const den = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
    const s = (q: readonly [number, number]) => q[0] ** 2 + q[1] ** 2
    const ox = (s(a) * (b[1] - c[1]) + s(b) * (c[1] - a[1]) + s(c) * (a[1] - b[1])) / den
    const oy = (s(a) * (c[0] - b[0]) + s(b) * (a[0] - c[0]) + s(c) * (b[0] - a[0])) / den
    const r2 = (a[0] - ox) ** 2 + (a[1] - oy) ** 2
    for (const q of p) assert.ok((q[0] - ox) ** 2 + (q[1] - oy) ** 2 >= r2 * (1 - 1e-9), 'titik di dalam lingkaran-luar')
  }
})
gagal('permukaan-terpusat-tinggi-2-menghadap-kamera', () => {
  const m = buildFaceMesh(wajah())!
  assert.equal(m.vertexCount, FACE_SURFACE_POINTS)
  let minY = Infinity, maxY = -Infinity, sx = 0, sy = 0
  for (let i = 0; i < m.vertexCount; i++) { const y = m.positions[i * 3 + 1]!; minY = Math.min(minY, y); maxY = Math.max(maxY, y); sx += m.positions[i * 3]!; sy += y }
  assert.ok(Math.abs(maxY - minY - 2) < 1e-5, 'tinggi 2 unit')
  assert.ok(Math.abs(sx / m.vertexCount) < 1e-5 && Math.abs(sy / m.vertexCount) < 1e-5, 'terpusat')
  for (let t = 0; t < m.indices.length; t += 3) {
    const [a, b, c] = [m.indices[t]!, m.indices[t + 1]!, m.indices[t + 2]!].map((i) => [m.positions[i * 3]!, m.positions[i * 3 + 1]!])
    assert.ok((b![0]! - a![0]!) * (c![1]! - a![1]!) - (b![1]! - a![1]!) * (c![0]! - a![0]!) > 0, 'segitiga menghadap kamera')
  }
  assert.ok(Math.abs(m.uvs[0]! - wajah()[0]!.x) < 1e-7, "uv x (float32)")
  assert.ok(Math.abs(m.uvs[1]! - (1 - wajah()[0]!.y)) < 1e-7)
  assert.ok(m.positions[(9 * 18 + 9) * 3 + 2]! > m.positions[2]!, 'tengah wajah lebih dekat ke kamera daripada sudut')
})
gagal('iris-dibuang-dan-celah-panjang-diputus', () => {
  const iris = [...wajah(), ...Array.from({ length: 10 }, (_, i) => ({ x: 0.4 + i * 0.01, y: 0.4, z: -0.12 }))]
  const m = buildFaceMesh(iris)!
  assert.equal(m.vertexCount, 468, '478 → 468 titik permukaan')
  assert.ok(Math.max(...m.indices) < 468)
  const jauh = wajah(); jauh[0] = { x: 0.01, y: 0.01, z: 0 }
  const j = buildFaceMesh(jauh)!
  for (let t = 0; t < j.indices.length; t += 3) assert.ok(![j.indices[t], j.indices[t + 1], j.indices[t + 2]].includes(0), 'titik terpencil tidak disambung')
})
gagal('masukan-rusak-ditolak-utuh', () => {
  assert.equal(buildFaceMesh(wajah().slice(0, 467)), null)
  assert.equal(buildFaceMesh([...wajah(), wajah()[0]!]), null, '469 titik')
  const nan = wajah(); nan[5] = { ...nan[5]!, z: Number.NaN }
  assert.equal(buildFaceMesh(nan), null)
  assert.equal(buildFaceMesh(wajah().map((p) => ({ ...p, y: 0.5 }))), null, 'semua titik satu baris')
})
gagal('deterministik-dan-cover', () => {
  assert.deepEqual(buildFaceMesh(wajah())!.indices, buildFaceMesh(wajah())!.indices)
  assert.deepEqual(coverRect(600, 400, 512), { w: 768, h: 512 })
  assert.deepEqual(coverRect(400, 400, 512), { w: 512, h: 512 })
  assert.equal(coverRect(0, 400, 512), null)
  assert.equal(coverRect(600, 400, Number.NaN), null)
})
console.log('face-mesh: OK')
