import test from 'node:test'
import assert from 'node:assert/strict'
import { viewPose, smootherstep, stepTween, ANATOMICAL_VIEWS } from '../../src/domains/body-exposure/engine/cameraViews.ts'

const C = [0, 0.87, 0], SZ = [0.6, 1.74, 0.3]   // tubuh dewasa: lebar 0,6, tinggi 1,74, tebal 0,3 m
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e

test('anterior_kamera_di_depan_subjek_atas_superior', () => {
  const p = viewPose('anterior', C, SZ, 30, 1)
  assert.ok(p.position[2] > 0); assert.equal(p.position[0], 0); assert.equal(p.position[1], C[1])
  assert.deepEqual(p.up, [0, 1, 0]); assert.deepEqual(p.target, C)
})

test('lateral_kiri_dari_plus_x_kanan_dari_minus_x', () => {
  assert.ok(viewPose('left', C, SZ, 30, 1).position[0] > 0)
  assert.ok(viewPose('right', C, SZ, 30, 1).position[0] < 0)
  assert.ok(viewPose('posterior', C, SZ, 30, 1).position[2] < 0)
})

test('superior_dari_atas_dengan_anterior_di_bawah_layar', () => {
  const p = viewPose('superior', C, SZ, 30, 1)
  assert.ok(p.position[1] > C[1]); assert.deepEqual(p.up, [0, 0, -1])
})

test('seluruh_tubuh_muat_tinggi_pada_fov_30', () => {
  const p = viewPose('anterior', C, SZ, 30, 1, 1)
  const dist = p.position[2] - SZ[2] / 2  // jarak ke bidang depan kotak
  const visibleH = 2 * dist * Math.tan((15 * Math.PI) / 180)
  assert.ok(near(visibleH, SZ[1], 1e-9))   // margin 1 → tepat muat
})

test('layar_sempit_menjauhkan_kamera', () => {
  const wide = viewPose('superior', C, [1.7, 0.3, 0.3], 30, 1.5), tall = viewPose('superior', C, [1.7, 0.3, 0.3], 30, 0.4)
  assert.ok(tall.position[1] > wide.position[1])
})

test('semua_tampilan_menghasilkan_pose', () => {
  for (const v of ANATOMICAL_VIEWS) assert.ok(viewPose(v, C, SZ, 30, 0.6), v)
})

test('menolak_input_tidak_valid', () => {
  assert.equal(viewPose('anterior', [0, Number.NaN, 0], SZ, 30, 1), null)
  assert.equal(viewPose('anterior', C, [1, -1, 1], 30, 1), null)
  assert.equal(viewPose('anterior', C, SZ, 0, 1), null)
  assert.equal(viewPose('anterior', C, SZ, 30, 0), null)
  assert.equal(viewPose('oblique', C, SZ, 30, 1), null)
})

test('smootherstep_batas_dan_simetri', () => {
  assert.equal(smootherstep(0), 0); assert.equal(smootherstep(1), 1); assert.equal(smootherstep(0.5), 0.5)
  assert.equal(smootherstep(-3), 0); assert.equal(smootherstep(7), 1)
})

test('transisi_maju_dengan_waktu_dan_selesai_tepat', () => {
  const from = { position: [0, 0, 5], target: [0, 0, 0], up: [0, 1, 0] }, to = { position: [5, 0, 0], target: [0, 1, 0], up: [0, 1, 0] }
  let tw = { from, to, elapsedS: 0, durationS: 0.6 }
  const half = stepTween({ ...tw, elapsedS: 0.25 }, 0.05)
  assert.ok(near(half.pose.position[0], 2.5)); assert.equal(half.done, false)
  for (let i = 0; i < 10; i++) { const r = stepTween(tw, 0.1); tw = r.tween; if (r.done) break }
  const end = stepTween(tw, 0)
  assert.equal(end.done, true); assert.deepEqual(end.pose.position, to.position)
})

test('transisi_membatasi_lompatan_dt_dan_menolak_dt_negatif', () => {
  const tw = { from: { position: [0, 0, 0], target: [0, 0, 0], up: [0, 1, 0] }, to: { position: [10, 0, 0], target: [0, 0, 0], up: [0, 1, 0] }, elapsedS: 0, durationS: 1 }
  assert.ok(near(stepTween(tw, 5).tween.elapsedS, 0.1))
  assert.deepEqual(stepTween(tw, -1), { ok: false, error: 'dt must be a finite, non-negative number' })
  assert.deepEqual(stepTween({ ...tw, durationS: 0 }, 0.1), { ok: false, error: 'duration must be positive' })
})
