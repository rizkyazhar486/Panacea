import assert from 'node:assert/strict'
import {
  BODY3D_DESKTOP_MAX_DPR,
  BODY3D_MOBILE_MAX_DPR,
  BODY3D_MAX_RENDER_PIXELS,
  Body3dLayerLoadGeneration,
  body3dDissectionMaterialState,
  body3dPixelRatio,
  body3dRefinePixelRatio,
  body3dNextRefineCeiling,
  BODY3D_REFINE_MAX_RENDER_PIXELS,
  BODY3D_REFINE_FRAME_BUDGET_MS,
  body3dSliceCoordinate,
} from '../../src/lib/body3dQuality.ts'

assert.equal(BODY3D_DESKTOP_MAX_DPR, 2)
assert.equal(BODY3D_MOBILE_MAX_DPR, 1.5)
assert.equal(BODY3D_MAX_RENDER_PIXELS, 5_250_000)

// Phone: preserve the conservative 1.5x cap already validated by mobile WebGL smoke.
assert.equal(body3dPixelRatio(390, 574, 3, true), 1.5)
// Tablet Retina stays at the established 2x ceiling.
assert.equal(body3dPixelRatio(1024, 768, 2, false), 2)
// Common 1440×900 Retina desktop now has enough guarded budget for full 2x HD.
assert.equal(body3dPixelRatio(1440, 900, 2, false), 2)
// Larger 1080p desktop still scales down supersampling instead of exceeding the budget.
const fullHd = body3dPixelRatio(1920, 1080, 2, false)
assert.ok(fullHd > 1.59 && fullHd < 1.60, `unexpected 1080p DPR ${fullHd}`)
// CSS 4K never falls below native 1x.
assert.equal(body3dPixelRatio(3840, 2160, 2, false), 1)
assert.equal(body3dPixelRatio(0, 0, Number.NaN, false), 1)

const generations = new Body3dLayerLoadGeneration()
const first = generations.begin('skeletal')
assert.equal(generations.isCurrent('skeletal', first), true)
generations.invalidate('skeletal')
assert.equal(generations.isCurrent('skeletal', first), false)
const second = generations.begin('skeletal')
assert.equal(generations.isCurrent('skeletal', second), true)

assert.deepEqual(
  body3dDissectionMaterialState('xray', 0.45, 0.5),
  { opacity: 0.225, transparent: true, depthWrite: false },
)
assert.deepEqual(
  body3dDissectionMaterialState('anatomy', 1, 0.4),
  { opacity: 0.4, transparent: true, depthWrite: false },
)
assert.deepEqual(
  body3dDissectionMaterialState('ct', 1, 1),
  { opacity: 1, transparent: false, depthWrite: true },
)

const bounds = { min: { x: -2, y: -1, z: -4 }, max: { x: 2, y: 9, z: 6 } }
assert.equal(body3dSliceCoordinate(bounds, 'axial', 0.5), 4)
assert.equal(body3dSliceCoordinate(bounds, 'coronal', 0.25), -1.5)
assert.equal(body3dSliceCoordinate(bounds, 'sagittal', 1.5), 2)

console.log('Body3D quality/lifecycle guards verified.')

// ── Penghalusan bertahap ────────────────────────────────────────────────────
//
// Cap interaktif 1.5x melindungi fill-rate saat tubuh diputar, tetapi ikut
// berlaku pada frame diam -- dan frame diam itulah yang dibaca. Pada telepon
// ber-DPR 3 itu berarti setengah resolusi linear.

// Telepon: frame diam naik sampai DPR perangkat, karena kanvasnya kecil.
// 390x574 pada 3x hanya 2.0 MP, jauh di bawah anggaran frame diam.
assert.equal(body3dRefinePixelRatio(390, 574, 3, 1.5, 3), 3)

// Penghalusan tidak boleh pernah menurunkan kualitas.
assert.ok(body3dRefinePixelRatio(390, 574, 3, 1.5, 1) >= 1.5,
  'Rasio halus tidak boleh di bawah rasio interaktif.')
assert.equal(body3dRefinePixelRatio(3840, 2160, 2, 2, 3), 2,
  'Kanvas 4K sudah di anggaran; tidak ada tambahan yang dipaksakan.')

// Kanvas desktop besar tetap dibatasi anggaran piksel frame diam. Rasio
// interaktifnya diturunkan dari kebijakan yang sama, bukan dikarang: pada
// 2560x1440 anggaran interaktif sendiri sudah menahan di sekitar 1.19x, jadi
// memberi angka 2 sebagai masukan akan menguji keadaan yang tidak pernah ada.
const interaktifBesar = body3dPixelRatio(2560, 1440, 3, false)
const besar = body3dRefinePixelRatio(2560, 1440, 3, interaktifBesar, 3)
assert.ok(besar > interaktifBesar, 'Frame diam harus lebih tajam daripada frame interaktif.')
assert.ok(besar * besar * 2560 * 1440 <= BODY3D_REFINE_MAX_RENDER_PIXELS + 1,
  `Frame diam melampaui anggaran pikselnya: ${besar}`)

// Lantai "tidak pernah lebih buruk" menang atas anggaran ketika keduanya
// berbenturan: menghaluskan yang justru memperburuk gambar tidak masuk akal.
assert.equal(body3dRefinePixelRatio(2560, 1440, 3, 2, 3), 2,
  'Rasio interaktif yang sudah tinggi dipertahankan apa adanya.')

// Nilai rusak tidak boleh meledak.
assert.ok(Number.isFinite(body3dRefinePixelRatio(0, 0, NaN, NaN, NaN)))

// Langit-langit menyesuaikan dari pengukuran, bukan dari tebakan perangkat.
assert.equal(body3dNextRefineCeiling(3, BODY3D_REFINE_FRAME_BUDGET_MS + 1, 1.5, 3), 2.5,
  'Frame yang melewati anggaran harus menurunkan langit-langit.')
// Naik selangkah demi selangkah, bukan melompat ke DPR perangkat: lompatan
// itulah yang membuat satu frame 3x menahan utas utama sebelum ada bukti
// perangkatnya sanggup.
assert.equal(body3dNextRefineCeiling(2, 10, 1.5, 3), 2.5,
  'Perangkat yang lapang naik satu langkah, bukan langsung ke atas.')
assert.equal(body3dNextRefineCeiling(2.5, 10, 1.5, 3), 3, 'Langkah berikutnya mencapai DPR perangkat.')
assert.equal(body3dNextRefineCeiling(3, 10, 1.5, 3), 3, 'Tidak pernah melewati DPR perangkat.')
assert.equal(body3dNextRefineCeiling(1.5, 9_999, 1.5, 3), 1.5,
  'Tidak pernah turun di bawah rasio interaktif.')

console.log('Body3D refine: frame diam mencapai resolusi perangkat, tetap di dalam anggaran, dan menyesuaikan diri dari waktu frame terukur.')
