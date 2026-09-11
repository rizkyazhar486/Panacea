// Uji papan widget beranda.
//
// Kenapa berkas ini ada: papan widget pernah kosong tanpa ada yang
// mengosongkannya. Daftar WIDGET_HIDUP dipersempit, dan setiap pemakai yang
// dulu memilih kartu yang kemudian dimatikan membuka beranda lalu mendapati
// papannya kosong. Tidak ada pesan galat, tidak ada yang tercatat, dan tidak
// ada jalan kembali — berkas pilihannya masih ada, jadi cabang "belum pernah
// memilih" tidak pernah tercapai lagi.
//
// Kegagalan seperti itu tidak bisa dilihat dari tangkapan layar milik sendiri:
// papan pengembang berisi pilihan yang masih hidup. Hanya keadaan awal yang
// tepat yang memunculkannya, dan itulah yang dikunci di sini.

const simpanan: Record<string, string> = {}
;(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => simpanan[k] ?? null,
  setItem: (k: string, v: string) => { simpanan[k] = v },
  removeItem: (k: string) => { delete simpanan[k] },
}
;(globalThis as unknown as { window: unknown }).window = { dispatchEvent: () => true }

import {
  WIDGETS, WIDGET_HIDUP, widgetPapan, widgetBawaan, ambilWidget, simpanWidget, alihkanWidget,
} from '../../src/lib/homeWidgets'

const KUNCI = 'pmd-home-widgets'
let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}
const bersih = () => { delete simpanan[KUNCI] }

// ── Katalog ─────────────────────────────────────────────────────────────────
{
  const hidup = widgetPapan()
  ok('papan hanya berisi widget yang dihidupkan',
    hidup.every((w) => (WIDGET_HIDUP as readonly string[]).includes(w.id)))

  // Setiap id di WIDGET_HIDUP harus benar-benar ada di katalog. Id yang salah
  // ketik tidak akan pernah memunculkan galat — kartunya hanya tidak muncul.
  const katalog = new Set(WIDGETS.map((w) => w.id))
  const hantu = (WIDGET_HIDUP as readonly string[]).filter((id) => !katalog.has(id))
  ok('tidak ada id hidup yang tidak punya widget', hantu.length === 0, hantu.join(', '))

  const ganda = (WIDGET_HIDUP as readonly string[]).filter((id, i, a) => a.indexOf(id) !== i)
  ok('tidak ada id hidup yang terdaftar dua kali', ganda.length === 0, ganda.join(', '))

  ok('setiap widget papan punya label dan ringkasan',
    hidup.every((w) => w.label.trim().length > 0 && w.ringkas.trim().length > 0))
}

// ── Bawaan ──────────────────────────────────────────────────────────────────
{
  const bawaan = widgetBawaan()
  ok('bawaan tidak kosong', bawaan.length > 0)
  ok('semua bawaan adalah widget yang hidup',
    bawaan.every((id) => (WIDGET_HIDUP as readonly string[]).includes(id)))

  // Panacea bukan hanya kedokteran. Papan yang seluruh bawaannya satu kategori
  // memberi kesan aplikasi ini hanya melakukan satu hal.
  const kategori = new Set(widgetPapan().filter((w) => bawaan.includes(w.id)).map((w) => w.kategori))
  ok('bawaan tersebar di sedikitnya enam kategori', kategori.size >= 6,
    `${kategori.size}: ${[...kategori].join(', ')}`)

  const semuaKategori = new Set(widgetPapan().map((w) => w.kategori))
  const tanpaWakil = [...semuaKategori].filter((k) => !kategori.has(k))
  ok('setiap kategori papan punya wakil di bawaan', tanpaWakil.length === 0, tanpaWakil.join(', '))
}

// ── Kehilangan senyap: inti berkas ini ──────────────────────────────────────
{
  bersih()
  ok('pemakai baru mendapat bawaan', ambilWidget().length === widgetBawaan().length)

  // Persis keadaan yang dulu mengosongkan papan orang.
  simpanan[KUNCI] = JSON.stringify(['medStudy', 'penyakit', 'usmle', 'kalkulator', 'drugInfo'])
  const pulih = ambilWidget()
  ok('pilihan yang seluruhnya sudah dimatikan tidak meninggalkan papan kosong',
    pulih.length > 0, `dapat ${pulih.length}`)
  ok('papan yang kosong dipulihkan tepat ke bawaan',
    JSON.stringify(pulih) === JSON.stringify(widgetBawaan()))

  // Kehilangan SEBAGIAN bukan kehilangan: yang tersisa memang pilihannya.
  simpanan[KUNCI] = JSON.stringify(['medStudy', 'penyakit', 'zona2'])
  ok('kehilangan sebagian menyisakan pilihan yang masih hidup saja',
    JSON.stringify(ambilWidget()) === JSON.stringify(['zona2']))

  // Papan yang DISENGAJA dikosongkan tetap dihormati? Tidak — papan kosong
  // tidak pernah berguna bagi siapa pun, dan pemilihnya selalu bisa menghapus
  // lagi. Yang penting: keadaannya tidak menjebak.
  simpanan[KUNCI] = JSON.stringify([])
  ok('papan kosong selalu punya jalan kembali', ambilWidget().length > 0)
}

// ── Isi yang rusak tidak boleh menjatuhkan beranda ──────────────────────────
{
  simpanan[KUNCI] = 'bukan json{{'
  ok('isi rusak jatuh ke bawaan', ambilWidget().length === widgetBawaan().length)

  simpanan[KUNCI] = JSON.stringify({ bukan: 'array' })
  ok('isi bukan array jatuh ke bawaan', ambilWidget().length === widgetBawaan().length)

  simpanan[KUNCI] = JSON.stringify(['zona2', 42, null, { a: 1 }, 'napas'])
  ok('entri yang bukan teks dibuang tanpa menjatuhkan sisanya',
    JSON.stringify(ambilWidget()) === JSON.stringify(['zona2', 'napas']))
}

// ── Simpan dan alihkan ──────────────────────────────────────────────────────
{
  bersih()
  simpanWidget(['zona2', 'napas'])
  ok('simpanWidget lalu ambilWidget mengembalikan yang sama',
    JSON.stringify(ambilWidget()) === JSON.stringify(['zona2', 'napas']))

  alihkanWidget('tdee')
  ok('alihkanWidget menambah yang belum ada', ambilWidget().includes('tdee'))
  alihkanWidget('tdee')
  ok('alihkanWidget menghapus yang sudah ada', !ambilWidget().includes('tdee'))

  // Menghapus kartu terakhir mengosongkan papan, dan pemulihannya harus
  // mengembalikan bawaan — bukan membiarkan papan itu kosong selamanya.
  simpanWidget([])
  ok('menghapus kartu terakhir tidak mengunci papan pada keadaan kosong',
    ambilWidget().length > 0)
}

console.log(`\nHome widgets: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exit(1)
