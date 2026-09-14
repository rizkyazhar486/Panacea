import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  susunVolumeTekstur, jendelaAwalVolume, faktorSusut, ambangKeTekstur,
  teksturKeAmbang, skalaKotak, BATAS_VOLUME,
} from '../../src/lib/volumeTekstur.ts'
import type { VolumeMpr } from '../../src/lib/dicomMpr.ts'

// ─────────────────────────────────────────────────────────────────────────────
// VOXEL TIDAK KUBUS, DAN SATU BYTE BUKAN SERIBU SATUAN HOUNSFIELD.
//
// Dua kekeliruan yang membuat sebuah rekonstruksi CT terlihat meyakinkan dan
// tetap salah:
//
//   1. Merender volume 512x512x40 sebagai kubus. Jarak antar-irisan lazimnya
//      beberapa milimeter sementara jarak antar-piksel di bawah satu; tubuh
//      akan tampak pipih ke arah kepala-kaki, dan organ ikut pipih bersamanya.
//
//   2. Memetakan seluruh rentang HU ke 256 langkah lalu memasang penggeser
//      berlabel "HU" di atasnya. Label dan angkanya akan berbeda tanpa ada
//      yang tahu.
// ─────────────────────────────────────────────────────────────────────────────

function irisanPalsu(baris: number, kolom: number, isi: (x: number, y: number) => number) {
  const nilai = new Float32Array(baris * kolom)
  for (let y = 0; y < baris; y++) for (let x = 0; x < kolom; x++) nilai[y * kolom + x] = isi(x, y)
  return { baris, kolom, bingkai: 1, modalitas: 'CT', nilai, minimum: 0, maksimum: 0, terbalik: false } as never
}

function volumePalsu(kolom: number, baris: number, kedalaman: number, opsi?: Partial<VolumeMpr>): VolumeMpr {
  return {
    irisan: Array.from({ length: kedalaman }, (_, z) => irisanPalsu(baris, kolom, (x) => (x === 0 ? -1000 : z * 10))),
    baris, kolom, kedalaman,
    jarakBarisMm: 1, jarakKolomMm: 1, jarakIrisMm: 1,
    minimum: -1000, maksimum: (kedalaman - 1) * 10,
    terbalik: false,
    ...opsi,
  } as VolumeMpr
}

// ── 1. Ukuran fisik mengikuti milimeter, bukan jumlah voxel ────────────────
// Inilah yang mencegah tubuh tampak pipih. Diuji dengan jarak iris yang
// sengaja jauh lebih besar daripada jarak piksel, seperti CT sungguhan.
{
  const v = volumePalsu(64, 64, 20, { jarakBarisMm: 0.7, jarakKolomMm: 0.7, jarakIrisMm: 5 })
  const t = susunVolumeTekstur(v, jendelaAwalVolume(v))
  assert.ok(t.ok, 'a plain volume must build')
  assert.deepEqual(t.tekstur.fisikMm.map((m) => Math.round(m)), [45, 45, 100],
    'the physical box no longer follows millimetres; a body would be flattened along the slice axis')
  const skala = skalaKotak(t.tekstur.fisikMm)
  assert.ok(Math.abs(skala[2] - 1) < 1e-9, 'the longest physical axis must become 1')
  // 64 x 0,7 mm = 44,8 mm terhadap 20 x 5 mm = 100 mm.
  assert.ok(Math.abs(skala[0] - 0.448) < 1e-9, 'the short axes must keep their real proportion')
  // Yang paling mudah salah: memakai JUMLAH VOXEL sebagai proporsi.
  assert.notDeepEqual(skala, [64 / 64, 64 / 64, 20 / 64],
    'the box is proportioned by voxel count rather than by millimetres')
}

// ── 2. Penyusutan bilangan bulat, dan ukuran fisik TIDAK ikut menyusut ─────
{
  assert.equal(faktorSusut(100, 256), 1, 'a volume under the limit must not be shrunk')
  assert.equal(faktorSusut(512, 256), 2, 'a 512 axis needs every 2nd voxel')
  assert.equal(faktorSusut(700, 256), 3, 'a 700 axis needs every 3rd voxel')
  const v = volumePalsu(600, 40, 10)
  const t = susunVolumeTekstur(v, jendelaAwalVolume(v))
  assert.ok(t.ok)
  assert.ok(t.tekstur.lebar <= BATAS_VOLUME.SISI_MAKS, 'the shrunk axis still exceeds the limit')
  assert.equal(t.tekstur.susut[0], 3, 'the reported shrink factor does not match what was done')
  assert.equal(Math.round(t.tekstur.fisikMm[0]), 600,
    'shrinking changed the reported physical size — shrinking does not make a patient smaller')
  assert.equal(t.tekstur.data.length, t.tekstur.lebar * t.tekstur.tinggi * t.tekstur.dalam,
    'the byte count does not match the declared dimensions')
}

// ── 3. Jendela: 0 dan 255 harus berarti sesuatu yang bisa disebut ──────────
{
  const jendela = { bawah: -1000, atas: 1000 }
  assert.equal(ambangKeTekstur(-1000, jendela), 0, 'the window floor must map to 0')
  assert.equal(ambangKeTekstur(1000, jendela), 1, 'the window ceiling must map to 1')
  assert.ok(Math.abs(ambangKeTekstur(0, jendela) - 0.5) < 1e-9, 'water at 0 HU must sit mid-window here')
  // Perjalanan bolak-balik harus kembali ke angka yang sama, kalau tidak
  // penggeser berlabel HU akan menunjuk nilai lain daripada yang dirender.
  for (const hu of [-1000, -500, 0, 300, 1000]) {
    assert.ok(Math.abs(teksturKeAmbang(ambangKeTekstur(hu, jendela), jendela) - hu) < 1e-6,
      `the HU round trip lost ${hu}`)
  }
  // Di luar jendela DIJEPIT, tidak dibiarkan lewat.
  assert.equal(ambangKeTekstur(5000, jendela), 1, 'a value above the window escaped the clamp')
  assert.equal(ambangKeTekstur(-5000, jendela), 0, 'a value below the window escaped the clamp')
}

// ── 4. Nilai benar-benar dikuantisasi, bukan disalin ───────────────────────
{
  const v = volumePalsu(8, 8, 5)
  const t = susunVolumeTekstur(v, { bawah: -1000, atas: 1000 })
  assert.ok(t.ok)
  // Kolom 0 setiap irisan bernilai -1000 HU: udara, harus menjadi byte 0.
  assert.equal(t.tekstur.data[0], 0, 'air at -1000 HU did not map to 0')
  // z=0 memberi 0 HU di kolom lain: tengah jendela, sekitar 127.
  assert.ok(Math.abs(t.tekstur.data[1] - 127) <= 1, 'water at 0 HU did not land mid-range')
}

// ── 5. Penolakan yang jujur ────────────────────────────────────────────────
{
  const tipis = volumePalsu(16, 16, 2)
  const t = susunVolumeTekstur(tipis, jendelaAwalVolume(tipis))
  assert.equal(t.ok, false, 'a two-slice stack must be refused, not ray-cast')
  const v = volumePalsu(16, 16, 5)
  const terbalik = susunVolumeTekstur(v, { bawah: 100, atas: 100 })
  assert.equal(terbalik.ok, false, 'a zero-width window must be refused rather than divided by')
}

// ── 6. Shader-nya harus benar-benar menembus volume ────────────────────────
// Sebuah "volume renderer" yang hanya menggambar satu irisan akan lolos
// setiap uji di atas. Yang diperiksa di sini adalah keberadaan langkah sinar
// dan sampler3D di dalam sumbernya.
const komponen = readFileSync(new URL('../../src/components/VolumeDicom3D.tsx', import.meta.url), 'utf8')
assert.ok(/sampler3D/.test(komponen), 'the shader no longer uses a 3D sampler; it cannot be ray-casting a volume')
assert.ok(/for \(int i = 0; i < \d+; i\+\+\)/.test(komponen), 'the ray-march loop is gone')
assert.ok(/potongKotak/.test(komponen), 'the ray is no longer clipped to the volume box')
assert.ok(/webgl2/.test(komponen), 'the WebGL2 requirement is no longer checked')
assert.ok(/no WebGL2/.test(komponen), 'the missing-WebGL2 case is no longer stated to the reader')
assert.ok(/skalaKotak\(tekstur\.fisikMm\)/.test(komponen),
  'the box is no longer scaled by physical size — the render would be geometrically wrong')

// ── 7. Dua mode render, dan ambang yang SAMA untuk keduanya ───────────────
// Klaim rujukannya berbunyi: volume rendering ditambahkan DI SAMPING surface
// rendering, berbagi pengaturan ambang, supaya keduanya bisa dibandingkan
// atau ditumpuk. Kalau tiap mode memakai ambangnya sendiri, yang dibandingkan
// bukan hal yang sama, dan perbandingannya tidak berarti apa-apa.
assert.ok(/uniform int uMode/.test(komponen), 'the render mode uniform is gone')
assert.ok(/vec3 gradien\(vec3 p, float h\)/.test(komponen),
  'the surface normal is no longer taken from the value gradient')
assert.ok(/if \(uMode >= 1 && diDalam && !kenaPermukaan\)/.test(komponen),
  'surface mode no longer stops at the first voxel inside the threshold')
assert.ok(/if \(uMode != 1 && diDalam\)/.test(komponen), 'volume accumulation no longer runs outside surface mode')
// Satu pasang ambang, dipakai kedua cabang.
assert.equal((komponen.match(/uAmbangBawah/g) ?? []).length >= 3, true, 'the shared lower threshold was split per mode')
assert.ok(!/uAmbangBawahPermukaan|uAmbangVolume/.test(komponen),
  'the two modes were given separate thresholds; then they are not comparable')
// Dan ketiga mode harus benar-benar ditawarkan ke pembaca.
for (const m of ["id: 'volume'", "id: 'permukaan'", "id: 'keduanya'"]) {
  assert.ok(komponen.includes(m), `a render mode disappeared from the list: ${m}`)
}
assert.ok(/hole here may be a hole in the data or in your threshold/.test(komponen),
  'surface mode no longer warns that a hole in it is ambiguous')

// ── 8. Radiograf tersimulasi: fisikanya dihitung ulang di sini ────────────
// Beer-Lambert, I = I0 exp(-integral(mu dl)), dengan mu diturunkan dari
// definisi Hounsfield: mu = mu_air * (1 + HU/1000).
//
// Ini ditulis ulang, bukan dicerminkan dari shader-nya, supaya perubahan
// diam-diam pada konstanta atau pada tanda eksponennya gagal di sini.
const mu = (hu: number, muAir: number) => Math.max(0, muAir * (1 + hu / 1000))
const MU_AIR = 0.0193

// Udara pada -1000 HU harus TIDAK menyerap sama sekali. Itu bukan pilihan
// gaya melainkan konsekuensi definisinya, dan kalau ia menyerap, seluruh
// gambar berkabut.
assert.equal(mu(-1000, MU_AIR), 0, 'air at -1000 HU must attenuate nothing')
// Air pada 0 HU harus tepat mu_air.
assert.ok(Math.abs(mu(0, MU_AIR) - MU_AIR) < 1e-12, 'water at 0 HU must equal the water coefficient')
// Tulang padat menyerap jauh lebih kuat.
assert.ok(mu(1000, MU_AIR) > mu(0, MU_AIR) * 1.9, 'dense bone no longer attenuates far more than water')

// 100 mm air harus meneruskan sekitar 14,5% berkas. Angka yang bisa dicek
// tangan: exp(-0.0193 x 100) = 0.145.
const transmisi = Math.exp(-mu(0, MU_AIR) * 100)
assert.ok(Math.abs(transmisi - 0.1452) < 0.001, '100 mm of water no longer transmits ~14.5% of the beam')

assert.ok(/uMode == 3/.test(komponen), 'the simulated radiograph mode is gone')
assert.ok(/uMuAir \* \(1\.0 \+ hu \/ 1000\.0\)/.test(komponen),
  'the attenuation coefficient is no longer derived from the Hounsfield definition')
assert.ok(/exp\(-integral \* uPajanan\)/.test(komponen), 'Beer-Lambert is no longer applied along the ray')
// Bukan "uniform-nya ada", melainkan "integralnya MEMAKAINYA". Menghapus
// pengali panjang lintasan membuat hasilnya tak bersatuan dan berubah
// diam-diam mengikuti resolusi, sementara uniform-nya tetap terdeklarasi.
assert.ok(/integral \+= max\(mu, 0\.0\) \* uMmPerLangkah;/.test(komponen),
  'the ray integral no longer multiplies by the millimetre step, so it has no units')
assert.ok(/MU_AIR_PER_MM = 0\.0193/.test(komponen), 'the stated water coefficient changed without a note')
// Batasnya harus tetap dinyatakan: ini bukan foto.
for (const pola of [/no scatter/i, /beam hardening/i, /simulation, not a photograph/i]) {
  assert.ok(pola.test(komponen), `the radiograph mode no longer states its limit: ${pola}`)
}
assert.ok(/not a dose in milligray/.test(readFileSync(new URL('../../src/pages/bodyhub/VolumeDicomBagian.tsx', import.meta.url), 'utf8')),
  'the exposure slider no longer says it is not a dose')

// ── 9. Kendali harus hilang ketika tidak berlaku ──────────────────────────
// "Opacity per step" adalah pengali penyusunan volume. Pada radiograf ia
// tidak berarti apa-apa, dan penggeser yang tidak berpengaruh mengajari
// pemakainya bahwa angka di layar tidak selalu berhubungan dengan gambarnya.
const bagianSrc = readFileSync(new URL('../../src/pages/bodyhub/VolumeDicomBagian.tsx', import.meta.url), 'utf8')
assert.ok(/\{\(mode === 'volume' \|\| mode === 'keduanya'\) && \(/.test(bagianSrc),
  'the opacity slider is shown in modes that do not composite a volume')
assert.ok(/mode === 'radiograf' \?/.test(bagianSrc),
  'the threshold sliders are still offered in radiograph mode, where they do nothing')

console.log('volume-tekstur: ok')
