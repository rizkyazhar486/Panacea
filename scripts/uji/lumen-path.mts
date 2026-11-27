// lumenPath: centre line of a hollow organ from its reference mesh. Positive, negative and boundary cases on synthetic
// tubes whose true axis and radius are known, so every assertion has an exact expected value.
import assert from 'node:assert/strict'
import { lumenPath, segmentCentreline, landmarkAt, anteriorMap } from '../../src/domains/body-exposure/engine/endoscopy/lumenPath.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

/** Cylinder wall: rings of `around` vertices, radius r, from a to b. */
function tabung(a: [number, number, number], b: [number, number, number], r: number, rings = 40, around = 24): Float32Array {
  const out: number[] = []
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = Math.hypot(d[0], d[1], d[2]); const u = d.map((v) => v / len)
  // Any vector not parallel to u, then two perpendiculars.
  const t = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
  const p = [u[1] * t[2] - u[2] * t[1], u[2] * t[0] - u[0] * t[2], u[0] * t[1] - u[1] * t[0]]
  const pl = Math.hypot(p[0], p[1], p[2]); const p1 = p.map((v) => v / pl)
  const p2 = [u[1] * p1[2] - u[2] * p1[1], u[2] * p1[0] - u[0] * p1[2], u[0] * p1[1] - u[1] * p1[0]]
  for (let i = 0; i < rings; i++) {
    const s = i / (rings - 1)
    for (let k = 0; k < around; k++) {
      const ang = (k / around) * Math.PI * 2
      for (let c = 0; c < 3; c++) out.push(a[c] + d[c] * s + r * (Math.cos(ang) * p1[c] + Math.sin(ang) * p2[c]))
    }
  }
  return new Float32Array(out)
}

gagal('menerima_tabung_lurus_pusat_di_sumbu_dan_jari_jari_benar', () => {
  const c = segmentCentreline(tabung([0, 0, 0], [0.2, 0, 0], 0.025), 10)!
  assert.ok(c && c.length === 10)
  for (const s of c) {
    assert.ok(Math.abs(s.y) < 1e-6 && Math.abs(s.z) < 1e-6, `centre off axis: ${s.y}, ${s.z}`)
    assert.ok(Math.abs(s.r - 0.025) < 1e-4, `radius ${s.r}`)
  }
  const xs = c.map((s) => s.x)
  const naik = xs.every((x, i) => i === 0 || x > xs[i - 1])
  const turun = xs.every((x, i) => i === 0 || x < xs[i - 1])
  assert.ok(naik || turun, 'slices are ordered along the axis')
})

gagal('menerima_tabung_lengkung_pusat_tetap_di_dalam_lumen', () => {
  // Half torus (U-bend like the transverse colon): major radius 0.1 m, lumen radius 0.02 m. A flat slab cut across the
  // bend has its centroid off the arc; the refined centre line must stay within 5 mm of the true arc (radius 0.1).
  const R = 0.1, r = 0.02, out: number[] = []
  for (let i = 0; i < 60; i++) {
    const a = (i / 59) * Math.PI
    const cxx = R * Math.cos(a), cyy = R * Math.sin(a)
    for (let k = 0; k < 24; k++) {
      const b = (k / 24) * Math.PI * 2
      out.push(cxx + r * Math.cos(b) * Math.cos(a), cyy + r * Math.cos(b) * Math.sin(a), r * Math.sin(b))
    }
  }
  const c = segmentCentreline(new Float32Array(out), 16)!
  assert.ok(c && c.length >= 12)
  for (const s of c.slice(1, -1)) {
    const d = Math.hypot(s.x, s.y)
    assert.ok(Math.abs(d - R) < 0.005, `centre ${d.toFixed(4)} m from bend axis, expected ${R}`)
    assert.ok(Math.abs(s.z) < 1e-3)
  }
})

gagal('rangkai_membalik_segmen_kedua_agar_menyambung', () => {
  // Second tube is defined end-to-start; the chain must still run continuously from the first tube's end.
  const r = lumenPath([
    { label: 'A', positions: tabung([0, 0, 0], [0, 0.2, 0], 0.02) },
    { label: 'B', positions: tabung([0.2, 0.25, 0], [0.01, 0.25, 0], 0.02) },
  ], 8, { x: 0, y: 0, z: 0 })
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.ok(r.slices[0].y < 0.05, 'starts at the startNear end of A')
  const sambung = r.slices[8], akhirA = r.slices[7]
  assert.ok(Math.hypot(sambung.x - akhirA.x, sambung.y - akhirA.y) < 0.08, 'B starts next to the end of A')
  assert.ok(r.slices[r.slices.length - 1].x > 0.15, 'B ends far from A')
  assert.deepEqual(r.landmarks.map((l) => l.label), ['A', 'B'])
  assert.equal(r.landmarks[0].t, 0)
  assert.ok(r.landmarks[1].t > 0.4 && r.landmarks[1].t < 0.7, `B starts mid-route: ${r.landmarks[1].t}`)
  assert.ok(Math.abs(r.length - (0.2 + 0.05 + 0.2) * (7 / 8) - 0.05) < 0.08, `length ${r.length}`)
})

gagal('menolak_tanpa_segmen', () => {
  assert.deepEqual(lumenPath([]), { ok: false, reason: 'no-segments' })
})

gagal('menolak_segmen_terlalu_kecil_dengan_nama', () => {
  const r = lumenPath([{ label: 'Tiny', positions: new Float32Array(23 * 3) }])
  assert.deepEqual(r, { ok: false, reason: 'segment-too-small', label: 'Tiny' })
  // Paired: 24 vertices on a real tube is accepted.
  assert.equal(lumenPath([{ label: 'Ok', positions: tabung([0, 0, 0], [0.1, 0, 0], 0.01, 4, 6) }], 2).ok, true)
})

gagal('menolak_nilai_tak_hingga', () => {
  const p = tabung([0, 0, 0], [0.1, 0, 0], 0.01)
  p[5] = Number.NaN
  assert.deepEqual(lumenPath([{ label: 'Bad', positions: p }]), { ok: false, reason: 'non-finite', label: 'Bad' })
  assert.equal(segmentCentreline(p, 8), null)
})

gagal('menolak_jumlah_bin_tidak_sah', () => {
  const p = tabung([0, 0, 0], [0.1, 0, 0], 0.01)
  assert.equal(segmentCentreline(p, 1), null)
  assert.equal(segmentCentreline(p, 2.5), null)
  assert.ok(segmentCentreline(p, 2), 'two bins is the minimum accepted')
})

gagal('landmark_pada_batas', () => {
  const lm = [{ t: 0 }, { t: 0.4 }, { t: 0.8 }]
  assert.equal(landmarkAt(lm, 0), 0)
  assert.equal(landmarkAt(lm, 0.399), 0)
  assert.equal(landmarkAt(lm, 0.4), 1)
  assert.equal(landmarkAt(lm, 1), 2)
  assert.equal(landmarkAt(lm, Number.NaN), -1)
  assert.equal(landmarkAt([], 0.5), -1)
})

gagal('deterministik', () => {
  const s = [{ label: 'A', positions: tabung([0, 0, 0], [0.1, 0.05, 0], 0.015) }]
  assert.deepEqual(lumenPath(s), lumenPath(s))
})

gagal('peta_anterior_kanan_pasien_di_kiri_layar', () => {
  // Patient's right is x < 0: it must land on the viewer's left; higher y must land higher (smaller svg y).
  const m = anteriorMap([{ x: -0.1, y: 0, z: 0, r: 0 }, { x: 0.1, y: 0.2, z: 0, r: 0 }], 10)!
  assert.ok(m[0].x < m[1].x, 'patient right drawn left')
  assert.ok(m[1].y < m[0].y, 'superior drawn higher')
  assert.deepEqual(m, [{ x: 10, y: 90 }, { x: 90, y: 10 }])
})

gagal('peta_anterior_menolak_masukan_tidak_sah', () => {
  assert.equal(anteriorMap([{ x: 0, y: 0, z: 0, r: 0 }]), null)
  assert.equal(anteriorMap([{ x: 0, y: 0, z: 0, r: 0 }, { x: 0, y: 0, z: 1, r: 0 }]), null, 'zero frontal extent')
  assert.equal(anteriorMap([{ x: Number.NaN, y: 0, z: 0, r: 0 }, { x: 1, y: 1, z: 0, r: 0 }]), null)
  assert.equal(anteriorMap([{ x: 0, y: 0, z: 0, r: 0 }, { x: 1, y: 1, z: 0, r: 0 }], 50), null, 'pad must leave room')
  assert.ok(anteriorMap([{ x: 0, y: 0, z: 0, r: 0 }, { x: 1, y: 1, z: 0, r: 0 }], 0), 'zero pad accepted')
})

console.log('lumen-path: anterior map keeps patient right on the viewer left;  straight-tube centre and radius exact, segments chained by nearest end, fails closed on empty / small / NaN / bad bins, landmark boundaries')
