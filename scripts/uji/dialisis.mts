import assert from 'node:assert/strict'
import {
  konsentrasiPada, lintasan, lintasanEuler, ureaAkhir, rasioReduksiUrea,
  urrDariKtv, ktvDariUrr, ktvLangsung, ktvDaugirdas, selisihKtv, sesiSahih,
  klirensDialiser, volumePada, TOLERANSI_KTV, RENTANG_KESEPAKATAN,
  type SesiDialisis,
} from '../../src/lib/dialisis.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

const RUJUKAN: SesiDialisis = {
  klirens: 200, volumeAwal: 36, durasiJam: 4, generasi: 7, ultrafiltrasi: 2, ureaAwal: 120,
}

// ── 1. Solusi analitik harus MENYETUJUI Euler maju ─────────────────────────
//
// Kurva yang digambar berasal dari bentuk tertutup; persamaan diferensialnya
// tidak pernah diintegrasikan saat menggambar. Kalau bentuk tertutup itu salah
// diturunkan, gambarnya tetap halus dan tetap masuk akal — hanya saja bukan
// jawaban dari persamaan yang diklaim panel ini. Euler maju berangkat dari
// dC/dt mentah dan tidak pernah melihat solusinya, jadi ia bisa mendeteksi itu.
// Galat Euler orde satu: menggandakan jumlah langkah harus MEMBAGI DUA galatnya.
{
  const akhirAnalitik = ureaAkhir(RUJUKAN)
  let galatSebelumnya = Infinity
  for (const langkah of [120, 240, 480, 960, 1920, 3840]) {
    const euler = lintasanEuler(RUJUKAN, langkah)
    const galat = Math.abs(euler[euler.length - 1] - akhirAnalitik)
    if (Number.isFinite(galatSebelumnya)) {
      assert.ok(
        galat < galatSebelumnya * 0.6,
        `Euler harus konvergen: ${langkah} langkah menyisakan ${galat}, sebelumnya ${galatSebelumnya}`,
      )
    }
    galatSebelumnya = galat
  }
  assert.ok(galatSebelumnya < 0.01, `Euler halus harus menempel pada analitik; sisa ${galatSebelumnya}`)
}

// Konvergensi juga harus berlaku di SELURUH lintasan, bukan hanya titik akhir.
{
  const langkah = 4800
  const euler = lintasanEuler(RUJUKAN, langkah)
  const total = RUJUKAN.durasiJam * 60
  for (let i = 0; i <= langkah; i += 240) {
    const t = (total * i) / langkah
    assert.ok(
      Math.abs(euler[i] - konsentrasiPada(RUJUKAN, t)) < 0.01,
      `Menit ${t}: Euler ${euler[i]} vs analitik ${konsentrasiPada(RUJUKAN, t)}`,
    )
  }
}

// ── 2. Identitas URR ↔ Kt/V tanpa UF dan tanpa generasi ────────────────────
//
// URR = 1 − e^(−Kt/V) hanya EKSAK ketika volume tetap dan tidak ada urea baru
// yang dibuat. Ini identitas, bukan pendekatan: kalau meleset, salah satu dari
// integrasi, definisi Kt/V, atau URR-nya cacat.
for (const klirens of [80, 140, 200, 260, 320]) {
  for (const durasiJam of [2, 3, 4, 5]) {
    const s: SesiDialisis = { ...RUJUKAN, klirens, durasiJam, generasi: 0, ultrafiltrasi: 0 }
    const ktv = ktvLangsung(s)
    const urr = rasioReduksiUrea(s)
    assert.ok(dekat(urr, urrDariKtv(ktv), 1e-12), `URR ${urr} vs 1−e^(−${ktv})`)
    assert.ok(dekat(ktvDariUrr(urr), ktv, 1e-12), `Kt/V balik dari URR: ${ktvDariUrr(urr)} vs ${ktv}`)
  }
}

// ── 3. Kedua rute Kt/V harus SEPAKAT pada rentang yang dinyatakan ──────────
//
// Ini uji terkuat di berkas ini. `ktvLangsung` hanya melihat K, t dan V;
// `ktvDaugirdas` tidak pernah melihat K sama sekali — ia hanya melihat rasio
// pra/pasca yang keluar dari integrasi. Keduanya bisa sepakat hanya kalau
// integrasinya benar. Toleransi 0,15 bukan longgar-longgaran: Daugirdas adalah
// kecocokan regresi dengan suku koreksi generasi −0,008·t, jadi ia TIDAK
// identik dengan model ini, dan rentang berlakunya ikut dinyatakan.
{
  let terparah = 0
  let jumlah = 0
  for (const klirens of [140, 160, 180, 200, 220]) {
    for (const volumeAwal of [28, 32, 36, 40, 45]) {
      for (const durasiJam of [3, 3.5, 4, 4.5]) {
        for (const ultrafiltrasi of [0, 1, 2, RENTANG_KESEPAKATAN.ufMaksLiter]) {
          for (const generasi of [RENTANG_KESEPAKATAN.generasiMin, 7, RENTANG_KESEPAKATAN.generasiMaks]) {
            const s: SesiDialisis = { klirens, volumeAwal, durasiJam, generasi, ultrafiltrasi, ureaAwal: 120 }
            const langsung = ktvLangsung(s)
            if (langsung < RENTANG_KESEPAKATAN.ktvMin || langsung > RENTANG_KESEPAKATAN.ktvMaks) continue
            jumlah++
            const d = selisihKtv(s)
            assert.ok(
              d <= TOLERANSI_KTV,
              `Kedua rute Kt/V berpisah ${d.toFixed(3)} pada ${JSON.stringify(s)}: ` +
              `${langsung.toFixed(3)} vs ${ktvDaugirdas(s).toFixed(3)}`,
            )
            terparah = Math.max(terparah, d)
          }
        }
      }
    }
  }
  assert.ok(jumlah > 500, `Kisi kesepakatan terlalu kecil: ${jumlah} kombinasi`)
  // Toleransinya tidak boleh dipakai untuk menyembunyikan kemunduran: kalau
  // selisih terburuk tiba-tiba mendekati ambang, itu tetap harus terlihat.
  assert.ok(terparah < 0.13, `Selisih terburuk naik menjadi ${terparah.toFixed(4)}`)
  console.log(`  kesepakatan Kt/V: ${jumlah} kombinasi, selisih terburuk ${terparah.toFixed(4)}`)
}

// ── 4. Menaikkan klirens harus MENAIKKAN Kt/V, secara monoton ──────────────
//
// Tanda yang terbalik di suatu tempat dalam neraca massa bisa lolos dari
// pemeriksaan angka tunggal, tetapi tidak bisa lolos dari arah.
{
  let ktvSebelumnya = -Infinity
  let urrSebelumnya = -Infinity
  for (let klirens = 60; klirens <= 320; klirens += 10) {
    const s: SesiDialisis = { ...RUJUKAN, klirens }
    const ktv = ktvLangsung(s)
    const urr = rasioReduksiUrea(s)
    assert.ok(ktv > ktvSebelumnya, `Kt/V tidak naik pada K=${klirens}: ${ktv} <= ${ktvSebelumnya}`)
    assert.ok(urr > urrSebelumnya, `URR tidak naik pada K=${klirens}: ${urr} <= ${urrSebelumnya}`)
    assert.ok(ktvDaugirdas(s) > 0, `Rute Daugirdas harus ikut hidup pada K=${klirens}`)
    ktvSebelumnya = ktv
    urrSebelumnya = urr
  }
}

// Durasi lebih panjang juga harus menaikkan Kt/V, dan urea harus turun monoton
// sepanjang sesi — kurva yang naik-turun berarti persamaannya salah tanda.
{
  const titik = lintasan(RUJUKAN, 240)
  for (let i = 1; i < titik.length; i++) {
    assert.ok(titik[i].urea < titik[i - 1].urea, `Urea naik pada menit ${titik[i].menit}`)
    assert.ok(titik[i].volume < titik[i - 1].volume, `Volume naik pada menit ${titik[i].menit}`)
  }
  assert.ok(dekat(titik[0].urea, RUJUKAN.ureaAwal, 1e-9))
  assert.ok(dekat(titik[titik.length - 1].urea, ureaAkhir(RUJUKAN), 1e-9))
  // Volume akhir harus persis volume awal dikurangi ultrafiltrasi.
  assert.ok(dekat(titik[titik.length - 1].volume, RUJUKAN.volumeAwal - RUJUKAN.ultrafiltrasi, 1e-9))
}

// ── 5. KONTROL NEGATIF: yang tak bermakna harus MENOLAK, bukan mencetak ────
//
// Ini bagian yang paling mudah dilewatkan dan paling berbahaya kalau hilang.
// Panel yang mencetak "Kt/V 0,00" untuk mesin yang tidak menyaring apa pun
// terlihat persis seperti panel yang bekerja.
{
  const buruk: Array<[string, SesiDialisis]> = [
    ['klirens nol', { ...RUJUKAN, klirens: 0 }],
    ['klirens negatif', { ...RUJUKAN, klirens: -200 }],
    ['volume nol', { ...RUJUKAN, volumeAwal: 0 }],
    ['durasi nol', { ...RUJUKAN, durasiJam: 0 }],
    ['urea awal nol', { ...RUJUKAN, ureaAwal: 0 }],
    ['UF melebihi kompartemennya', { ...RUJUKAN, ultrafiltrasi: 40 }],
    ['UF mengeringkan kompartemen', { ...RUJUKAN, ultrafiltrasi: 36 }],
    ['parameter bukan angka', { ...RUJUKAN, klirens: Number.NaN }],
  ]
  for (const [nama, s] of buruk) {
    assert.equal(sesiSahih(s), false, `${nama}: harus ditolak`)
    assert.ok(Number.isNaN(konsentrasiPada(s, 10)), `${nama}: konsentrasi harus NaN`)
    assert.ok(Number.isNaN(ktvLangsung(s)), `${nama}: Kt/V langsung harus NaN`)
    assert.ok(Number.isNaN(ktvDaugirdas(s)), `${nama}: Kt/V Daugirdas harus NaN`)
    assert.ok(Number.isNaN(rasioReduksiUrea(s)), `${nama}: URR harus NaN`)
    assert.deepEqual(lintasan(s), [], `${nama}: lintasan harus kosong, bukan garis datar`)
  }
}

// Kasus negatif kedua: sesi yang SAHIH secara parameter tetapi rasionya tidak
// bisa dimasukkan ke rumus Daugirdas. Generasi urea yang sangat tinggi dengan
// klirens rendah membuat urea justru NAIK; Kt/V lewat rasio tidak ada, dan
// harus NaN alih-alih angka negatif yang kelihatan seperti hasil.
{
  const s: SesiDialisis = { klirens: 1, volumeAwal: 36, durasiJam: 4, generasi: 400, ultrafiltrasi: 0, ureaAwal: 120 }
  assert.equal(sesiSahih(s), true)
  assert.ok(ureaAkhir(s) > s.ureaAwal, 'Uji ini hanya berarti kalau ureanya memang naik')
  assert.ok(Number.isNaN(ktvDaugirdas(s)), 'Rasio >= 1 tidak punya Kt/V Daugirdas')
  assert.ok(rasioReduksiUrea(s) < 0, 'URR negatif adalah fakta, bukan kesalahan: urea bertambah')
}

// Dan kasus ketiga: sesi yang MENYAPU begitu dalam sampai argumen logaritma
// Daugirdas tidak lagi positif.
{
  const s: SesiDialisis = { klirens: 900, volumeAwal: 20, durasiJam: 6, generasi: 0, ultrafiltrasi: 0, ureaAwal: 120 }
  assert.ok(Number.isNaN(ktvDaugirdas(s)), 'Argumen log tidak positif harus NaN')
  assert.ok(Number.isFinite(ktvLangsung(s)), 'Rute langsung tetap terdefinisi di sana')
}

// ── 6. Klirens dialiser dari KoA, Qb dan Qd ────────────────────────────────
//
// Klirens tidak boleh melampaui aliran darah — itu batas fisik, bukan sekadar
// pemeriksaan kewarasan. KoA yang membesar tanpa batas mendekati batas aliran.
{
  assert.ok(Number.isNaN(klirensDialiser(0, 500, 800)))
  assert.ok(Number.isNaN(klirensDialiser(300, 0, 800)))
  assert.ok(Number.isNaN(klirensDialiser(300, 500, 0)))

  let sebelumnya = 0
  for (const koa of [200, 400, 600, 800, 1200, 2000]) {
    const k = klirensDialiser(300, 500, koa)
    assert.ok(k > sebelumnya, `KoA ${koa}: klirens harus naik`)
    assert.ok(k <= 300 + 1e-9, `KoA ${koa}: klirens ${k} melampaui aliran darah`)
    sebelumnya = k
  }
  assert.ok(klirensDialiser(300, 500, 100000) > 299, 'KoA raksasa harus mendekati batas aliran')

  // Menaikkan aliran dialisat harus menaikkan klirens, tidak menurunkannya.
  let sebelumnyaQd = 0
  for (const qd of [300, 500, 700, 900]) {
    const k = klirensDialiser(300, qd, 800)
    assert.ok(k > sebelumnyaQd, `Qd ${qd}: klirens harus naik`)
    sebelumnyaQd = k
  }

  // Klirens yang dihitung itu harus bisa langsung dipakai sebagai K dan
  // menghasilkan Kt/V yang kedua rutenya tetap sepakat.
  const k = klirensDialiser(300, 500, 800)
  const s: SesiDialisis = { ...RUJUKAN, klirens: k }
  assert.ok(selisihKtv(s) <= TOLERANSI_KTV, `Kt/V dari K terhitung berpisah ${selisihKtv(s)}`)
}

// ── 7. Volume dan neraca massa ─────────────────────────────────────────────
//
// Massa urea yang dikeluarkan harus sama dengan massa yang hilang dari
// kompartemen ditambah yang dibuat selama sesi. Kalau faktor satuan 100 itu
// salah di salah satu tempat, uji ini gagal dan uji lainnya belum tentu.
{
  const s = RUJUKAN
  const t = s.durasiJam * 60
  const massaAwal = (s.ureaAwal * s.volumeAwal * 1000) / 100
  const massaAkhir = (ureaAkhir(s) * volumePada(s, t)) / 100
  // Massa yang disingkirkan dialiser, diintegrasikan halus dari kurva yang sama.
  const n = 20000
  let disingkirkan = 0
  for (let i = 0; i < n; i++) {
    const tm = (t * (i + 0.5)) / n
    disingkirkan += ((s.klirens * konsentrasiPada(s, tm)) / 100) * (t / n)
  }
  const dibuat = s.generasi * t
  const sisa = massaAwal + dibuat - disingkirkan - massaAkhir
  assert.ok(Math.abs(sisa) < 1, `Neraca massa tidak tertutup, sisa ${sisa.toFixed(3)} mg`)
}

console.log('dialisis.mts — semua uji lulus')
