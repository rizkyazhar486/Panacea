// Uji indeks dan pencarian struktur tubuh.
//
// Satu aturan mengatur seluruh berkas ini: hasil pencarian harus menuju ke
// struktur yang BENAR-BENAR ADA di dalam berkas geometrinya. Hasil yang tidak
// menuju ke mana-mana lebih buruk daripada hasil kosong — pengguna akan
// mengira strukturnya ada dan sedang gagal ditampilkan, lalu menyalahkan
// perangkatnya sendiri.

import {
  INDEKS_TUBUH, cariTubuh, cakupanTubuh, pasangan, namaTampil, skorTeks,
} from '../../src/lib/bodySearch'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

// ── Bentuk indeks ───────────────────────────────────────────────────────────
ok('indeks memuat ribuan struktur', INDEKS_TUBUH.length > 2000, String(INDEKS_TUBUH.length))
ok('setiap struktur punya nama berkas', INDEKS_TUBUH.every((s) => s.n.length > 0))
ok('nama bersih tidak menyimpan akhiran sisi',
  INDEKS_TUBUH.every((s) => !/\.(l|r)$/i.test(s.b)))
ok('setiap struktur punya lapisan yang dikenal',
  INDEKS_TUBUH.every((s) => ['surface', 'skeletal', 'muscular', 'cardiovascular', 'nervous', 'visceral', 'lymphoid'].includes(s.l)))
ok('sisi hanya kiri, kanan atau tengah',
  INDEKS_TUBUH.every((s) => ['kiri', 'kanan', 'tengah'].includes(s.s)))
ok('tinggi ternormalkan berada di 0..1',
  INDEKS_TUBUH.every((s) => s.y >= -0.001 && s.y <= 1.001))
// Struktur tanpa geometri tidak bisa disorot; mencatatnya hanya menghasilkan
// hasil pencarian yang tidak menuju ke mana-mana.
ok('setiap struktur membawa geometri', INDEKS_TUBUH.every((s) => s.t > 0))
ok('nama+lapisan tidak berulang', (() => {
  const k = INDEKS_TUBUH.map((s) => `${s.l}|${s.n}`)
  return new Set(k).size === k.length
})())

{
  const c = cakupanTubuh()
  ok('ketujuh lapisan terwakili', Object.keys(c).length === 7)
  ok('setiap lapisan punya isi', Object.values(c).every((n) => n > 0))
  ok('jumlah cakupan sama dengan besar indeks',
    Object.values(c).reduce((a, b) => a + b, 0) === INDEKS_TUBUH.length)
  // Pembuluh dan saraf memang yang paling banyak bercabang; kalau salah satu
  // lapisan tiba-tiba kosong, berarti pembangkitnya gagal diam-diam.
  ok('pembuluh darah adalah lapisan terbanyak',
    c.cardiovascular === Math.max(...Object.values(c)))
  ok('setiap lapisan punya minimal seratus struktur',
    Object.values(c).every((n) => n >= 100))
}

// ── Skor teks ───────────────────────────────────────────────────────────────
ok('cocok persis mendapat skor tertinggi', skorTeks('femur', 'femur') === 1000)
ok('awal nama mengalahkan tengah nama',
  skorTeks('Tibial artery', 'tibia') > skorTeks('Anterior tibial artery', 'tibia'))
ok('awal kata di tengah nama tetap dihitung',
  skorTeks('Anterior tibial artery', 'tibial') > 0)
ok('tidak cocok memberi nol', skorTeks('Femur', 'pancreas') === 0)
ok('kueri kosong memberi nol', skorTeks('Femur', '  ') === 0)
// Tanpa penalti panjang, nama terpanjang selalu menang dan yang dicari
// justru tenggelam.
ok('nama lebih pendek menang pada awalan yang sama',
  skorTeks('Femur', 'fem') > skorTeks('Femoral artery branch', 'fem'))

// ── Pencarian ───────────────────────────────────────────────────────────────
{
  const femur = cariTubuh('femur')
  ok('femur ditemukan', femur.length > 0)
  ok('hasil teratas femur memang femur', femur[0].struktur.b.toLowerCase().includes('femur'))
  ok('femur berada di lapisan tulang',
    femur.some((h) => h.struktur.l === 'skeletal'))

  // Beberapa kata harus MENYEMPIT, bukan melebar: kalau dicocokkan sebagai
  // ATAU, "left femoral artery" akan mengembalikan setiap struktur kiri.
  const luas = cariTubuh('artery', {}, 500).length
  const sempit = cariTubuh('femoral artery', {}, 500).length
  ok('dua kata menyempitkan hasil', sempit < luas && sempit > 0, `${sempit} < ${luas}`)
  ok('semua hasil dua kata memuat keduanya',
    cariTubuh('femoral artery', {}, 50).every((h) =>
      h.struktur.b.toLowerCase().includes('femoral') && h.struktur.b.toLowerCase().includes('arter')))

  // Sisi tubuh hanya berupa akhiran ".l" di dalam berkas, yang tidak akan
  // pernah diketik siapa pun.
  const kiri = cariTubuh('left femur', {}, 50)
  ok('kata "left" dipahami sebagai sisi tubuh',
    kiri.length > 0 && kiri.every((h) => h.struktur.s === 'kiri'))
  const kanan = cariTubuh('right femur', {}, 50)
  ok('kata "right" dipahami sebagai sisi tubuh',
    kanan.length > 0 && kanan.every((h) => h.struktur.s === 'kanan'))
  ok('bahasa Indonesia untuk sisi juga dipahami',
    cariTubuh('kiri femur', {}, 50).every((h) => h.struktur.s === 'kiri'))

  ok('pencarian tidak peka huruf besar-kecil',
    cariTubuh('FEMUR').length === cariTubuh('femur').length)
  ok('kueri tak dikenal mengembalikan kosong', cariTubuh('zzzqqq').length === 0)
  ok('batas jumlah hasil dihormati', cariTubuh('a', {}, 5).length <= 5)
  ok('kueri kosong dengan saringan mengembalikan isi lapisan itu',
    cariTubuh('', { lapisan: 'visceral' }, 10).every((h) => h.struktur.l === 'visceral'))

  ok('saringan lapisan bekerja',
    cariTubuh('artery', { lapisan: 'cardiovascular' }, 100).every((h) => h.struktur.l === 'cardiovascular'))
  ok('saringan lapisan yang salah mengosongkan hasil',
    cariTubuh('femur', { lapisan: 'visceral' }).length === 0)
  ok('saringan sisi bekerja',
    cariTubuh('', { sisi: 'kanan' }, 30).every((h) => h.struktur.s === 'kanan'))

  // Struktur yang jelas dalam tubuh: inilah yang tidak pernah bisa ditemukan
  // dengan mengetuk layar, karena selalu tertutup.
  for (const istilah of ['aorta', 'vagus', 'liver', 'kidney', 'trachea']) {
    ok(`struktur dalam "${istilah}" dapat ditemukan lewat pencarian`,
      cariTubuh(istilah).length > 0)
  }
}

// ── Pasangan kiri-kanan dan nama tampil ─────────────────────────────────────
{
  const kiri = INDEKS_TUBUH.find((s) => s.s === 'kiri')!
  const p = pasangan(kiri)
  ok('struktur bersisi mengembalikan pasangannya', p.length >= 1)
  ok('pasangan memuat dirinya sendiri', p.includes(kiri.n))
  ok('pasangan hanya berisi nama yang ada di indeks',
    p.every((n) => INDEKS_TUBUH.some((s) => s.n === n)))
  const tengah = INDEKS_TUBUH.find((s) => s.s === 'tengah')!
  ok('struktur tengah tidak dipasangkan', pasangan(tengah).length === 1)

  ok('nama tampil menerjemahkan sisi',
    namaTampil(kiri).includes('(left)') && !namaTampil(kiri).includes('.l'))
  // Sebagian nama anatomi memang memuat kurung — "(Abdominal part of
  // pectoralis major muscle)" — jadi yang diperiksa bukan ada tidaknya kurung,
  // melainkan tidak adanya keterangan sisi pada struktur garis tengah.
  ok('nama tampil struktur tengah tanpa keterangan sisi',
    !/\((left|right)\)$/.test(namaTampil(tengah)))
  ok('nama tampil diawali huruf besar atau kurung',
    /^[A-Z0-9(]/.test(namaTampil(tengah)))
  // Berkas sumber memuat beberapa node bergeometri nyata yang labelnya tidak
  // pernah diisi — namanya hanya "?". Menampilkannya memberi baris kosong yang
  // tidak berarti apa-apa, jadi ia dibuang saat indeks dibangun.
  ok('struktur tanpa nama sungguhan tidak masuk indeks',
    INDEKS_TUBUH.every((s) => /[A-Za-z]/.test(s.b)))
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
