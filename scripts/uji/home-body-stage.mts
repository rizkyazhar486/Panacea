// Panggung tubuh di Home: setiap sistem tubuh punya titik dari atlas, kartu tidak pernah keluar panggung, jejak
// ventrikel dan vital istirahat berasal dari model, dan masukan tak sah ditolak (gagal tertutup).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { NORMAL, simulate } from '../../src/lib/bodySim.ts'
import { DEFAULT_PARAMS } from '../../src/domains/body-exposure/engine/cardiacCycle.ts'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/domains/body-exposure/data/bodySystems.ts'
import { HOME_BODY_ANCHORS, HOME_BODY_IMAGE } from '../../src/domains/body-exposure/data/homeBodyAnchors.ts'
import { HOME_SYSTEMS, cardPlacement } from '../../src/domains/body-exposure/engine/home-hero/homeBodyStage.ts'
import { restingVitals, ventricleVolumeTrace } from '../../src/domains/body-exposure/engine/home-hero/homeBodyModels.ts'
import { snapshotSource } from '../bangun/home-body-snapshot.mts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const STAGE = { w: 400, h: 500 }, CARD = { w: 120, h: 60 }

gagal('setiap-sistem-tubuh-punya-satu-titik', () => {
  const ids = BODY_SYSTEM_SOURCE_WAVE.map((s) => s.id).sort()
  assert.deepEqual(HOME_SYSTEMS.map((s) => s.id).sort(), ids, 'tidak ada sistem yang hilang atau dobel')
})
gagal('titik-di-dalam-gambar-dan-urut-kepala-ke-kaki', () => {
  for (const s of HOME_SYSTEMS) assert.ok(s.x > 0 && s.x < 1 && s.y > 0 && s.y < 1, `${s.id} di luar gambar`)
  for (let i = 1; i < HOME_SYSTEMS.length; i++) assert.ok(HOME_SYSTEMS[i].y >= HOME_SYSTEMS[i - 1].y)
})
gagal('titik-di-wilayah-anatomi-yang-benar', () => {
  const y = (id: string) => HOME_BODY_ANCHORS.find((a) => a.id === id)!.y
  assert.ok(y('nervous') < y('endocrine') && y('endocrine') < y('cardiovascular'), 'otak di atas tiroid di atas jantung')
  assert.ok(y('cardiovascular') < y('urinary') && y('urinary') < y('musculoskeletal'), 'jantung di atas ginjal di atas paha')
})
gagal('sistem-tanpa-organ-atlas-ditandai', () => {
  assert.deepEqual(HOME_SYSTEMS.filter((s) => !s.inAtlas).map((s) => s.id), ['reproductive'])
})
gagal('gambar-dan-kredit-ada', () => {
  assert.ok(readFileSync(`public/${HOME_BODY_IMAGE.src}`).length > 10_000)
  assert.match(readFileSync('public/home/CREDITS.txt', 'utf8'), /Z-Anatomy[\s\S]*CC BY-SA 4\.0/)
})

gagal('kartu-di-kanan-titik-kiri-dan-sebaliknya', () => {
  assert.deepEqual(cardPlacement(100, 250, CARD, STAGE, 18), { left: 118, top: 220, side: 'right' })
  assert.deepEqual(cardPlacement(300, 250, CARD, STAGE, 18), { left: 162, top: 220, side: 'left' })
})
gagal('kartu-dijepit-di-dalam-panggung', () => {
  const atas = cardPlacement(100, 0, CARD, STAGE, 18, 8)!
  assert.equal(atas.top, 8, 'tidak keluar di atas')
  const bawah = cardPlacement(100, 500, CARD, STAGE, 18, 8)!
  assert.equal(bawah.top, 500 - 8 - 60, 'tidak keluar di bawah')
  const kanan = cardPlacement(200, 250, CARD, STAGE, 18, 8)!
  assert.ok(kanan.left + CARD.w <= STAGE.w - 8, 'tidak keluar di kanan')
})
gagal('kartu-menolak-ukuran-tak-sah', () => {
  assert.equal(cardPlacement(NaN, 1, CARD, STAGE), null)
  assert.equal(cardPlacement(1, 1, { w: 0, h: 60 }, STAGE), null)
  assert.equal(cardPlacement(1, 1, CARD, { w: -1, h: 500 }), null)
  assert.equal(cardPlacement(1, 1, { w: 390, h: 60 }, STAGE, 18, 8), null, 'kartu lebih lebar dari panggung')
})

gagal('jejak-ventrikel-dari-model-wiggers', () => {
  const t = ventricleVolumeTrace(DEFAULT_PARAMS, 2, 160, 40)!
  assert.equal(t.edvMl, DEFAULT_PARAMS.edvMl); assert.equal(t.esvMl, DEFAULT_PARAMS.esvMl)
  assert.equal(t.ejectionFractionPct, Math.round(((DEFAULT_PARAMS.edvMl - DEFAULT_PARAMS.esvMl) / DEFAULT_PARAMS.edvMl) * 100))
  assert.equal(t.beatS, 60 / DEFAULT_PARAMS.hrBpm)
  const ys = [...t.d.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]))
  assert.equal(ys.length, 161)
  assert.ok(Math.min(...ys) <= 0.5 && Math.max(...ys) >= 39.5, 'jejak mengisi kotak dari ESV ke EDV')
})
gagal('jejak-menolak-masukan-tak-sah', () => {
  assert.equal(ventricleVolumeTrace({ ...DEFAULT_PARAMS, hrBpm: 500 }, 2, 160, 40), null)
  assert.equal(ventricleVolumeTrace(DEFAULT_PARAMS, 0, 160, 40), null)
  assert.equal(ventricleVolumeTrace(DEFAULT_PARAMS, 2, 0, 40), null)
  assert.equal(ventricleVolumeTrace(DEFAULT_PARAMS, 2, 160, 40, 3), null)
})

gagal('vital-istirahat-dibaca-dari-simulator', () => {
  const o = simulate(NORMAL)
  const v = Object.fromEntries(restingVitals().map((x) => [x.key, x.value]))
  assert.equal(v.hr, String(NORMAL.heartRate)); assert.equal(v.rr, String(NORMAL.respRate))
  assert.equal(v.co, o.cardiacOutput.toFixed(1)); assert.equal(v.bp, `${o.systolic.toFixed(0)}/${o.diastolic.toFixed(0)}`)
  assert.equal(v.sao2, o.sao2.toFixed(0)); assert.equal(v.urine, o.urineOutput.toFixed(0))
})

gagal('snapshot-home-sama-dengan-model-sekarang', () => {
  assert.equal(readFileSync('src/domains/body-exposure/data/homeBodySnapshot.ts', 'utf8'), snapshotSource(),
    'jalankan: npx tsx scripts/bangun/home-body-snapshot.mts')
})
gagal('home-tidak-memuat-simulator-saat-jalan', () => {
  const hero = readFileSync('src/domains/body-exposure/ui/home-hero/LivingBodyHero.tsx', 'utf8')
  const stage = readFileSync('src/domains/body-exposure/engine/home-hero/homeBodyStage.ts', 'utf8')
  const snap = readFileSync('src/domains/body-exposure/data/homeBodySnapshot.ts', 'utf8')
  // Hanya impor nilai yang dihitung; impor `type` hilang saat kompilasi.
  const muat = /^import (?!type )[^\n]*from '[^']*(bodySim|cardiacCycle|homeBodyModels)[^']*'/m
  for (const src of [hero, stage, snap]) assert.doesNotMatch(src, muat, 'Home memuat model saat jalan')
})

console.log('home-body-stage: OK')
