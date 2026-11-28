// scopeSim: teaching-scope physics on a reference route. Positive, negative, boundary and paired cases with exact
// expected values; deterministic (dt and input are passed in, no clock).
import assert from 'node:assert/strict'
import {
  routeProfile, radiusAt, openFactor, initialScope, stepScope, wallFold, SCOPE,
  type ScopeInput, type RouteProfile,
} from '../../src/domains/body-exposure/engine/endoscopy/scopeSim.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const lurus = (n = 11, r = 0.02) => Array.from({ length: n }, (_, i) => ({ x: 0, y: 0, z: i * 0.01, r }))
const diam: ScopeInput = { push: 0, aimYaw: 0, aimPitch: 0, air: false, suction: false }
const P = routeProfile(lurus())!

gagal('profil_menerima_garis_lurus_panjang_eksak', () => {
  assert.equal(P.length.toFixed(6), '0.100000')
  assert.equal(P.s.length, 11)
  assert.equal(radiusAt(P, 0.05), 0.02)
})

gagal('profil_menolak_masukan_tidak_sah', () => {
  assert.equal(routeProfile([{ x: 0, y: 0, z: 0, r: 0.01 }]), null)
  assert.equal(routeProfile([{ x: 0, y: 0, z: 0, r: 0.01 }, { x: 0, y: 0, z: 0, r: 0.01 }]), null, 'zero length')
  assert.equal(routeProfile([{ x: 0, y: 0, z: 0, r: 0.01 }, { x: 0, y: 0, z: Number.NaN, r: 0.01 }]), null)
  assert.equal(routeProfile([{ x: 0, y: 0, z: 0, r: -1 }, { x: 0, y: 0, z: 1, r: 0.01 }]), null, 'negative radius')
})

gagal('radius_interpolasi_dan_batas', () => {
  const p: RouteProfile = { s: [0, 1], r: [0.01, 0.03], length: 1 }
  assert.ok(Math.abs(radiusAt(p, 0.5) - 0.02) < 1e-12)
  assert.equal(radiusAt(p, -1), 0.01)
  assert.equal(radiusAt(p, 2), 0.03)
  assert.equal(radiusAt(p, Number.NaN), 0.01)
  assert.equal(routeProfile([{ x: 0, y: 0, z: 0, r: 0 }, { x: 0, y: 0, z: 1, r: 0 }])!.r[0], SCOPE.MIN_RADIUS, 'radius floored')
})

gagal('maju_lurus_sejauh_kecepatan_kali_dt', () => {
  const s = stepScope(initialScope(), { ...diam, push: 1 }, 0.2, P)
  assert.equal(s.s.toFixed(6), (SCOPE.SPEED * 0.2).toFixed(6))
  assert.equal(s.contact, false)
  assert.equal(s.time, 0.2)
})

gagal('mundur_tidak_melewati_awal_rute', () => {
  const s = stepScope(initialScope(), { ...diam, push: -1 }, 0.2, P)
  assert.equal(s.s, 0)
})

gagal('ujung_diarahkan_ke_dinding_menjadi_red_out_dan_tertahan', () => {
  let s = initialScope(0)
  for (let i = 0; i < 200; i++) s = stepScope(s, { ...diam, push: 1, aimYaw: 1 }, 0.05, P)
  assert.equal(s.contact, true)
  assert.equal(s.blocked, true)
  const lim = SCOPE.CONTACT * radiusAt(P, s.s) * openFactor(s.insuf)
  assert.ok(Math.abs(Math.hypot(s.ox, s.oy) - lim) < 1e-12, 'tip held exactly at the wall')
  // Paired: same push with the tip straight never touches the wall and keeps advancing.
  let lurusS = initialScope(0)
  for (let i = 0; i < 20; i++) lurusS = stepScope(lurusS, { ...diam, push: 1 }, 0.05, P)
  assert.equal(lurusS.contact, false)
  assert.ok(lurusS.s > 0.04)
})

gagal('tarik_mundur_melepaskan_red_out', () => {
  let s = initialScope(0)
  for (let i = 0; i < 200; i++) s = stepScope(s, { ...diam, push: 1, aimYaw: 1 }, 0.05, P)
  for (let i = 0; i < 40; i++) s = stepScope(s, { ...diam, push: -1 }, 0.05, P)
  assert.equal(s.contact, false)
})

gagal('udara_membuka_hisap_menutup_dan_batas', () => {
  let s = initialScope(0.5)
  s = stepScope(s, { ...diam, air: true }, 0.2, P)
  assert.equal(s.insuf.toFixed(6), (0.5 + SCOPE.AIR_RATE * 0.2).toFixed(6))
  s = stepScope(s, { ...diam, suction: true }, 0.2, P)
  assert.equal(s.insuf.toFixed(6), (0.5 + SCOPE.AIR_RATE * 0.2 - SCOPE.SUCTION_RATE * 0.2).toFixed(6))
  let penuh = initialScope(1)
  penuh = stepScope(penuh, { ...diam, air: true }, 0.2, P)
  assert.equal(penuh.insuf, 1)
  let kosong = initialScope(0)
  kosong = stepScope(kosong, { ...diam, suction: true }, 0.2, P)
  assert.equal(kosong.insuf, 0)
  assert.equal(openFactor(0), SCOPE.COLLAPSED)
  assert.equal(openFactor(1), 1)
  assert.equal(openFactor(Number.NaN), SCOPE.COLLAPSED)
})

gagal('menolak_dt_dan_masukan_tidak_sah_tanpa_efek', () => {
  const s0 = initialScope()
  assert.equal(stepScope(s0, { ...diam, push: 1 }, 0, P), s0)
  assert.equal(stepScope(s0, { ...diam, push: 1 }, -0.1, P), s0)
  assert.equal(stepScope(s0, { ...diam, push: 1 }, Number.NaN, P), s0)
  assert.equal(stepScope(s0, { ...diam, push: 1 }, SCOPE.MAX_DT + 0.001, P), s0)
  assert.notEqual(stepScope(s0, { ...diam, push: 1 }, SCOPE.MAX_DT, P), s0, 'MAX_DT itself accepted')
  assert.equal(stepScope(s0, { ...diam, push: Number.POSITIVE_INFINITY }, 0.1, P), s0)
  assert.equal(stepScope(s0, { ...diam, aimYaw: Number.NaN }, 0.1, P), s0)
  assert.deepEqual(s0, initialScope(), 'input state not mutated')
})

gagal('lipatan_dinding_terbatas_dan_khas_wilayah', () => {
  for (const p of ['colon', 'oesophagus', 'stomach', 'duodenum', 'trachea', 'bronchus'] as const) {
    for (let i = 0; i < 50; i++) {
      const f = wallFold(p, i * 0.37, i * 0.0071)
      for (const v of [f.fixed, f.collapsible, f.ridge]) assert.ok(v >= 0 && v <= 1, `${p} ${v}`)
    }
  }
  // Trachea: posterior (theta = pi) is the flat membranous wall without cartilage; anterior has rings.
  const post = wallFold('trachea', Math.PI, 0), ant = wallFold('trachea', 0, 0)
  assert.ok(post.ridge < 0.01 && ant.ridge > 0.9)
  assert.ok(post.collapsible > ant.collapsible)
  // Colon: a haustral fold crest (mid-spacing) is deeper than the gap between folds.
  assert.ok(wallFold('colon', Math.PI / 3, 0.0225).fixed > wallFold('colon', Math.PI / 3, 0).fixed)
  assert.deepEqual(wallFold('colon', Number.NaN, 0), { fixed: 0, collapsible: 0, ridge: 0 })
})

gagal('deterministik', () => {
  const run = () => { let s = initialScope(); for (let i = 0; i < 50; i++) s = stepScope(s, { push: 1, aimYaw: 0.3, aimPitch: -0.2, air: i % 3 === 0, suction: false }, 0.03, P); return s }
  assert.deepEqual(run(), run())
})

console.log('scope-sim: push/pull exact, red-out holds the tip at the wall and blocks advance, withdraw clears it, air/suction bounded, invalid dt/input change nothing, wall relief bounded and region-specific')
