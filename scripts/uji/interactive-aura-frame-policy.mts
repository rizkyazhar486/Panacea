// InteractiveAura (kanvas dekoratif hero landing): kebijakan frame murni + kontrak sumber komponen.
// Cacat yang ditutup: loop rAF 60 fps tanpa henti (juga saat di luar layar) dan mengabaikan
// prefers-reduced-motion OS walau komentarnya mengklaim sebaliknya. Tiap aturan punya kasus
// penerima yang hanya berbeda pada kondisi itu; sabotase sumber harus gagal bernama.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  AURA_FRAME_INTERVAL_MS,
  AURA_MAX_PHYSICS_STEPS,
  AURA_PHYSICS_STEP_MS,
  auraMayAnimate,
  auraPhysicsSteps,
  type AuraMotionInput,
} from '../../src/shared/ui/auraFramePolicy.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

// ── auraMayAnimate ──
const boleh: AuraMotionInput = { reduceMotionClass: false, prefersReducedMotion: false, onScreen: true, documentHidden: false }
gagal('menerima_terlihat_tanpa_preferensi', () => assert.equal(auraMayAnimate(boleh), true))
// Berpasangan: tiap kasus hanya mengubah SATU kondisi dari kasus penerima.
gagal('menolak_kelas_reduce_motion', () => assert.equal(auraMayAnimate({ ...boleh, reduceMotionClass: true }), false))
gagal('menolak_prefers_reduced_motion_os', () => assert.equal(auraMayAnimate({ ...boleh, prefersReducedMotion: true }), false))
gagal('menolak_di_luar_layar', () => assert.equal(auraMayAnimate({ ...boleh, onScreen: false }), false))
gagal('menolak_tab_tersembunyi', () => assert.equal(auraMayAnimate({ ...boleh, documentHidden: true }), false))
// Gagal tertutup: nilai bukan boolean (mis. hasil matchMedia tak tersedia) tidak dianggap izin.
for (const kunci of ['reduceMotionClass', 'prefersReducedMotion', 'onScreen', 'documentHidden'] as const)
  for (const buruk of [undefined, null, 'false', 0, 1]) {
    gagal(`menolak_${kunci}_bukan_boolean:${String(buruk)}`, () =>
      assert.equal(auraMayAnimate({ ...boleh, [kunci]: buruk } as unknown as AuraMotionInput), false))
  }

// ── auraPhysicsSteps ──
gagal('interval_30fps', () => assert.equal(Math.round(1000 / AURA_FRAME_INTERVAL_MS), 30))
gagal('gambar_pertama_satu_langkah', () => assert.equal(auraPhysicsSteps(null, 1234), 1))
// 30 fps -> 2 langkah fisika 60 fps per gambar, sehingga kecepatan drift sama dengan perilaku lama.
gagal('kecepatan_drift_dipertahankan', () => assert.equal(auraPhysicsSteps(1000, 1000 + AURA_FRAME_INTERVAL_MS), 2))
gagal('satu_frame_60fps_satu_langkah', () => assert.equal(auraPhysicsSteps(1000, 1000 + AURA_PHYSICS_STEP_MS), 1))
// Batas: selisih sangat kecil tetap minimal 1; jeda panjang dibatasi.
gagal('batas_bawah_minimal_satu', () => assert.equal(auraPhysicsSteps(1000, 1000.5), 1))
gagal('batas_atas_tepat', () => assert.equal(auraPhysicsSteps(0, AURA_PHYSICS_STEP_MS * AURA_MAX_PHYSICS_STEPS), AURA_MAX_PHYSICS_STEPS))
gagal('batas_atas_lewat_satu', () => assert.equal(auraPhysicsSteps(0, AURA_PHYSICS_STEP_MS * (AURA_MAX_PHYSICS_STEPS + 1)), AURA_MAX_PHYSICS_STEPS))
gagal('jeda_tab_panjang_dibatasi', () => assert.equal(auraPhysicsSteps(0, 60_000), AURA_MAX_PHYSICS_STEPS))
// Negatif: waktu tidak sah -> 0 langkah (tidak menggambar), bukan tebakan.
gagal('menolak_waktu_sama', () => assert.equal(auraPhysicsSteps(1000, 1000), 0))
gagal('menolak_waktu_mundur', () => assert.equal(auraPhysicsSteps(2000, 1000), 0))
for (const [a, b] of [[0, Number.NaN], [0, Number.POSITIVE_INFINITY], [0, -1], [Number.NaN, 10], [Number.NEGATIVE_INFINITY, 10], [-5, 10]] as const)
  gagal(`menolak_waktu_tidak_sah:${a},${b}`, () => assert.equal(auraPhysicsSteps(a, b), 0))
// Determinisme.
gagal('deterministik', () => assert.equal(auraPhysicsSteps(10, 77), auraPhysicsSteps(10, 77)))

// ── kontrak sumber komponen ──
const sumber = readFileSync(new URL('../../src/components/ui/InteractiveAura.tsx', import.meta.url), 'utf8')
export function kontrakAura(src: string): string[] {
  const masalah: string[] = []
  if (!/from '..\/..\/shared\/ui\/auraFramePolicy'/.test(src)) masalah.push('tidak memakai auraFramePolicy')
  if (!src.includes("matchMedia?.('(prefers-reduced-motion: reduce)')")) masalah.push('tidak membaca prefers-reduced-motion OS')
  if (!/prefersReducedMotion:\s*media\?\.matches === true/.test(src)) masalah.push('preferensi OS tidak diteruskan ke kebijakan')
  if (!/new IntersectionObserver\(/.test(src) || !/visibility\?\.observe\(cv\)/.test(src)) masalah.push('tidak berhenti saat di luar layar')
  if (!/addEventListener\('visibilitychange', sync\)/.test(src)) masalah.push('tidak bereaksi pada tab tersembunyi')
  if (!/if \(!mayAnimate\(\)\) return stop\(\)/.test(src)) masalah.push('tick tidak memeriksa kebijakan')
  if (!/setTimeout\([\s\S]{0,80}requestAnimationFrame\(tick\)[\s\S]{0,40}AURA_FRAME_INTERVAL_MS\)/.test(src)) masalah.push('gambar ulang tidak dibatasi interval 30 fps')
  if (/draw\(\)[\s\S]{0,200}\n\s*raf = requestAnimationFrame\(tick\)\n\s*\}\n\n\s*function onMove/.test(src)) masalah.push('loop rAF tanpa henti kembali')
  if (!/visibility\?\.disconnect\(\)/.test(src) || !/removeEventListener\('visibilitychange', sync\)/.test(src)) masalah.push('pembersihan tidak lengkap')
  return masalah
}
gagal('kontrak_komponen_terpenuhi', () => assert.deepEqual(kontrakAura(sumber), []))
// Sabotase: tiap mutasi menghapus satu jaminan dan harus terdeteksi dengan nama.
const sabotase: Array<[string, string, string]> = [
  ['preferensi-os-dihapus', "matchMedia?.('(prefers-reduced-motion: reduce)')", "matchMedia?.('(min-width: 0px)')"],
  ['preferensi-os-diabaikan', 'prefersReducedMotion: media?.matches === true', 'prefersReducedMotion: false'],
  ['observer-dihapus', 'visibility?.observe(cv)', '/* no observe */'],
  ['visibilitychange-dihapus', "document.addEventListener('visibilitychange', sync)", '/* none */'],
  ['pemeriksaan-tick-dihapus', 'if (!mayAnimate()) return stop()', '/* always */'],
  ['interval-dihapus', 'AURA_FRAME_INTERVAL_MS)', '0)'],
  ['pembersihan-dihapus', 'visibility?.disconnect()', '/* leak */'],
]
for (const [nama, dari, ke] of sabotase) {
  gagal(`sabotase_terdeteksi:${nama}`, () => {
    assert.ok(sumber.includes(dari), `pola sabotase tidak ditemukan di sumber: ${dari}`)
    assert.notDeepEqual(kontrakAura(sumber.replace(dari, ke)), [], `sabotase ${nama} lolos`)
  })
}
console.log(`interactive-aura-frame-policy: kebijakan (positif, negatif berpasangan, batas, fail-closed) dan kontrak komponen lulus; ${sabotase.length} sabotase terdeteksi`)
