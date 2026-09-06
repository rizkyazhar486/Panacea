// Uji model diseksi dan pembukaan tubuh.
//
// Bagian geometrinya gampang terlihat benar padahal salah: tubuh yang
// "meledak" seragam tetap tampak menarik sekalipun kepala terbang ke atas dan
// hubungan atas-bawah antar struktur rusak. Bagian datanya lebih berat lagi —
// urutan lapisan yang keliru adalah pengajaran yang salah, bukan sekadar
// tampilan yang salah.

import {
  KEDALAMAN, LAPISAN_TERDALAM, keburaman, terlihat, geserBuka,
  WILAYAH, wilayahDari, didalamWilayah, URUTAN, urutanUntukWilayah, urutanDari,
  strukturBerisiko, type KunciLapisan,
} from '../../src/lib/dissection'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}
const LAPIS: KunciLapisan[] = ['surface', 'muscular', 'cardiovascular', 'nervous', 'lymphoid', 'visceral', 'skeletal']

// ── Urutan kedalaman ────────────────────────────────────────────────────────
ok('kulit adalah lapisan terluar', KEDALAMAN.surface === 0)
ok('rangka adalah lapisan terdalam', KEDALAMAN.skeletal === LAPISAN_TERDALAM)
ok('otot berada di atas organ dalam', KEDALAMAN.muscular < KEDALAMAN.visceral)
// Pembuluh dan saraf berjalan DI DALAM dan di antara otot; menaruhnya lebih
// dangkal daripada otot mengajarkan letak yang keliru.
ok('pembuluh dan saraf lebih dalam daripada otot',
  KEDALAMAN.cardiovascular > KEDALAMAN.muscular && KEDALAMAN.nervous > KEDALAMAN.muscular)
ok('setiap lapisan punya kedalaman berbeda',
  new Set(LAPIS.map((l) => KEDALAMAN[l])).size === LAPIS.length)

// ── Keburaman ───────────────────────────────────────────────────────────────
ok('tubuh utuh: semua lapisan pekat', LAPIS.every((l) => keburaman(l, 0) === 1))
ok('lapisan di bawah bidang diseksi tetap pekat', keburaman('skeletal', 3) === 1)
ok('kulit memudar begitu diseksi dimulai', keburaman('surface', 1) < 1)
ok('makin dalam diseksi, kulit makin pudar',
  keburaman('surface', 3) < keburaman('surface', 1))
// Batas bawah bukan kosmetik: begitu lapisan luar hilang total, struktur dalam
// kehilangan rujukan permukaan dan gambar berhenti menjadi tubuh.
ok('lapisan terluar tidak pernah hilang sepenuhnya', keburaman('surface', 6) >= 0.06)
ok('keburaman selalu di antara 0 dan 1',
  LAPIS.every((l) => [0, 1, 2, 3, 4, 5, 6].every((d) => {
    const k = keburaman(l, d); return k > 0 && k <= 1
  })))
ok('kedalaman di luar jangkauan dijepit',
  keburaman('surface', 99) === keburaman('surface', 6) && keburaman('surface', -5) === 1)
ok('lapisan yang tersisa samar masih dianggap terlihat', terlihat('surface', 6))

// ── Geometri pembukaan ──────────────────────────────────────────────────────
const pusat = { x: 0, y: 0, z: 0 }
{
  ok('tanpa pembukaan tidak ada pergeseran', (() => {
    const g = geserBuka({ x: 1, y: 2, z: 0 }, pusat, 0)
    return g.x === 0 && g.y === 0 && g.z === 0
  })())

  // Inti seluruh fungsinya: ketinggian TIDAK boleh berubah. Kalau y ikut
  // bergeser, kepala terbang ke atas dan kaki ke bawah, dan hubungan
  // atas-bawah antar struktur — satu-satunya hal yang membuat gambar itu
  // anatomi — ikut rusak.
  ok('pembukaan tidak pernah mengubah ketinggian',
    [[1, 5, 0], [-3, -2, 4], [0.2, 9, -0.7]].every(([x, y, z]) =>
      geserBuka({ x, y, z }, pusat, 0.3).y === 0))

  const kanan = geserBuka({ x: 2, y: 0, z: 0 }, pusat, 0.3)
  const kiri = geserBuka({ x: -2, y: 0, z: 0 }, pusat, 0.3)
  ok('struktur kanan bergeser ke kanan, kiri ke kiri', kanan.x > 0 && kiri.x < 0)
  ok('kedua sisi bergeser sejauh yang sama', Math.abs(kanan.x + kiri.x) < 1e-9)

  // Struktur di sumbu tubuh (aorta, trakea, vertebra) memang tidak punya sisi.
  const sumbu = geserBuka({ x: 0, y: 3, z: 0 }, pusat, 0.3)
  ok('struktur tepat di sumbu tidak bergeser', sumbu.x === 0 && sumbu.z === 0)

  // Besarnya pergeseran hanya bergantung arah, bukan jarak: struktur jauh
  // tidak boleh terlempar lebih jauh lagi sampai lepas dari tubuh.
  const dekat = geserBuka({ x: 0.1, y: 0, z: 0 }, pusat, 0.3)
  const jauh = geserBuka({ x: 50, y: 0, z: 0 }, pusat, 0.3)
  ok('jarak dari sumbu tidak melipatgandakan pergeseran',
    Math.abs(dekat.x - jauh.x) < 1e-9)

  ok('arah pergeseran ternormalkan', (() => {
    const g = geserBuka({ x: 3, y: 0, z: 4 }, pusat, 1, 0)
    return Math.abs(Math.hypot(g.x, g.z) - 1) < 1e-9
  })())

  // Lapisan luar membuka lebih lebar daripada lapisan dalam — kalau semuanya
  // bergeser sama jauh, yang terjadi bukan pembukaan lapisan melainkan
  // pembesaran seluruh tubuh.
  const luar = geserBuka({ x: 1, y: 0, z: 0 }, pusat, 0.3, 0)
  const dalam = geserBuka({ x: 1, y: 0, z: 0 }, pusat, 0.3, 6)
  ok('lapisan luar membuka lebih lebar daripada lapisan dalam', luar.x > dalam.x)
  ok('lapisan terdalam tetap bergeser sedikit, tidak nol', dalam.x > 0)

  ok('pusat tubuh selain titik nol tetap ditangani', (() => {
    const g = geserBuka({ x: 5, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, 0.2)
    return g.x > 0
  })())
  ok('jumlah negatif dijepit menjadi nol',
    geserBuka({ x: 1, y: 0, z: 0 }, pusat, -5).x === 0)
}

// ── Wilayah ─────────────────────────────────────────────────────────────────
ok('sembilan wilayah tubuh', WILAYAH.length === 9)
ok('kunci wilayah tidak berulang', new Set(WILAYAH.map((w) => w.kunci)).size === WILAYAH.length)
ok('setiap rentang tinggi naik', WILAYAH.every((w) => w.y[0] < w.y[1]))
ok('rentang tinggi berada di dalam 0..1',
  WILAYAH.every((w) => w.y[0] >= 0 && w.y[1] <= 1))
ok('kepala berada di atas toraks',
  wilayahDari('kepala')!.y[0] > wilayahDari('toraks')!.y[1])
ok('tungkai berada di bawah pelvis',
  wilayahDari('tungkai')!.y[1] < wilayahDari('pelvis')!.y[1])
ok('titik setinggi dada masuk toraks', didalamWilayah(wilayahDari('toraks')!, 0.75))
ok('titik setinggi lutut tidak masuk toraks', !didalamWilayah(wilayahDari('toraks')!, 0.2))
// Lengan dan toraks berbagi ketinggian; yang membedakan hanya jarak dari sumbu.
ok('lengan menuntut jarak dari sumbu',
  !didalamWilayah(wilayahDari('bahu-lengan')!, 0.75, 0.02) &&
  didalamWilayah(wilayahDari('bahu-lengan')!, 0.75, 0.3))

// ── Urutan lapisan nyata ────────────────────────────────────────────────────
ok('tujuh urutan lapisan terdokumentasi', URUTAN.length === 7)
ok('kunci urutan tidak berulang', new Set(URUTAN.map((u) => u.kunci)).size === URUTAN.length)
ok('setiap urutan menyebut wilayah yang dikenal',
  URUTAN.every((u) => WILAYAH.some((w) => w.kunci === u.wilayah)))
ok('setiap urutan menyebut sumbernya', URUTAN.every((u) => u.sumber.length > 10))
ok('setiap urutan memberi patokan yang bisa diraba', URUTAN.every((u) => u.patokan.length > 20))
ok('setiap urutan punya minimal empat lapisan', URUTAN.every((u) => u.lapis.length >= 4))
ok('setiap lapisan diberi keterangan', URUTAN.every((u) => u.lapis.every((l) => l.catatan.length > 15)))
ok('setiap urutan menyebut minimal satu struktur berisiko',
  URUTAN.every((u) => u.lapis.some((l) => (l.bahaya?.length ?? 0) > 0)))
// Lapisan pertama yang ditembus selalu permukaan kulit — tertulis "Skin" atau
// dirinci sebagai "Epidermis and dermis"; kalau bukan keduanya, urutannya
// salah susun.
ok('setiap urutan dimulai dari permukaan kulit',
  URUTAN.every((u) => /^(skin|epidermis)/i.test(u.lapis[0].nama)))

{
  const perut = urutanDari('dinding-perut-anterior')!
  const nama = perut.lapis.map((l) => l.nama)
  ok('dinding perut punya sembilan lapisan', nama.length === 9)
  // Camper di atas Scarpa, dan ketiga otot dalam urutan luar ke dalam:
  // inilah yang membedakan urutan yang benar dari daftar nama yang benar.
  ok('Camper berada di atas Scarpa',
    nama.findIndex((n) => n.includes('Camper')) < nama.findIndex((n) => n.includes('Scarpa')))
  ok('urutan tiga otot perut benar dari luar ke dalam',
    nama.findIndex((n) => n.includes('External oblique')) <
    nama.findIndex((n) => n.includes('Internal oblique')) &&
    nama.findIndex((n) => n.includes('Internal oblique')) <
    nama.findIndex((n) => n.includes('Transversus')))
  ok('peritoneum adalah lapisan terdalam', nama[nama.length - 1].includes('peritoneum'))
  ok('bidang neurovaskular disebut di antara internal oblique dan transversus',
    perut.lapis.some((l) => l.catatan.includes('neurovascular plane')))
  ok('pembuluh epigastrika inferior ditandai berisiko',
    perut.lapis.some((l) => l.bahaya?.some((b) => b.includes('epigastric'))))
}
{
  const dada = urutanDari('toraks-lateral')!
  // Kesalahan klasik pemasangan selang dada, dan satu-satunya alasan
  // "segitiga aman" diajarkan sama sekali.
  ok('selang dada menyebut berkas neurovaskular di tepi BAWAH iga',
    dada.lapis.some((l) => l.bahaya?.some((b) => b.includes('LOWER border'))))
  ok('selang dada menyebut jalur di atas tepi atas iga',
    dada.lapis.some((l) => l.catatan.includes('ABOVE the upper border')))
}
{
  const empedu = urutanDari('kandung-empedu')!
  ok('kolesistektomi memuat critical view of safety',
    empedu.lapis.some((l) => l.nama.includes('Critical view of safety')))
  ok('critical view menyebut tidak ada klip sebelum pandangan tercapai',
    empedu.lapis.some((l) => l.catatan.includes('Nothing is clipped')))
  ok('duktus koledokus ditandai berisiko',
    empedu.lapis.some((l) => l.bahaya?.some((b) => b.includes('Common bile duct'))))
}
{
  const karpal = urutanDari('terowongan-karpal')!
  ok('pelepasan terowongan karpal menyebut cabang motorik rekuren',
    karpal.lapis.some((l) => l.bahaya?.some((b) => b.includes('Recurrent motor branch'))))
  ok('ligamen karpal transversum adalah struktur yang dibelah',
    karpal.lapis.some((l) => l.nama.includes('Transverse carpal ligament')))
}
{
  const wajah = urutanDari('flap-kulit')!
  ok('flap wajah menempatkan saraf fasialis di bawah SMAS',
    wajah.lapis.some((l) => l.nama.includes('SMAS')) &&
    wajah.lapis.some((l) => l.catatan.includes('deep to SMAS')))
}

ok('penyaringan per wilayah bekerja', urutanUntukWilayah('abdomen').length === 2)
ok('wilayah tanpa urutan mengembalikan daftar kosong', urutanUntukWilayah('leher').length === 0)
ok('kunci yang tidak dikenal mengembalikan undefined', urutanDari('entah') === undefined)

{
  const bahaya = strukturBerisiko()
  ok('daftar struktur berisiko terkumpul', bahaya.length >= 12)
  ok('daftar struktur berisiko tidak berulang', new Set(bahaya).size === bahaya.length)
  ok('daftar struktur berisiko terurut', [...bahaya].sort().join('|') === bahaya.join('|'))
}

// ── Pemetaan langkah bedah ke kedalaman model ───────────────────────────────
{
  const { kedalamanUntukLangkah } = await import('../../src/pages/bodyhub/SurgicalLab')
  // Perjalanannya yang disamakan, bukan satu lapisan untuk satu lapisan:
  // langkah pertama selalu di permukaan, langkah terakhir selalu di dalam.
  ok('langkah pertama berada di permukaan', kedalamanUntukLangkah(0, 9) === 0)
  ok('langkah terakhir mencapai kedalaman organ dalam',
    kedalamanUntukLangkah(8, 9) === KEDALAMAN.visceral)
  ok('kedalaman tidak pernah mundur', (() => {
    let sebelum = -1
    for (let i = 0; i < 9; i++) {
      const d = kedalamanUntukLangkah(i, 9)
      if (d < sebelum) return false
      sebelum = d
    }
    return true
  })())
  ok('urutan berlapis sedikit tetap terpetakan penuh',
    kedalamanUntukLangkah(4, 5) === KEDALAMAN.visceral)
  ok('urutan satu langkah tidak membagi dengan nol',
    kedalamanUntukLangkah(0, 1) === 0)
  ok('semua urutan nyata terpetakan tanpa nilai di luar jangkauan',
    URUTAN.every((u) => u.lapis.every((_, i) => {
      const d = kedalamanUntukLangkah(i, u.lapis.length)
      return d >= 0 && d <= KEDALAMAN.skeletal
    })))
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
