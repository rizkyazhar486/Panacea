// Uji pencarian atlas.
//
// Pencarian yang buruk tidak pernah terlihat sebagai galat: ia hanya
// mengembalikan hasil yang salah urutan, atau kosong untuk kata yang jelas ada.
// Yang diuji di sini adalah PERINGKATNYA, bukan sekadar "ada hasilnya".

import { cariAtlas, cakupanAtlas } from '../../src/lib/atlasSearch'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const c = cakupanAtlas()
ok('cakupan masuk akal', c.kondisi >= 150 && c.struktur >= 800 && c.obat >= 30 && c.modul >= 20,
  JSON.stringify(c))

ok('kueri terlalu pendek tidak mengembalikan apa-apa', cariAtlas('a').length === 0)
ok('kata yang tidak ada mengembalikan kosong', cariAtlas('zzzqqq').length === 0)

// Judul harus mengalahkan penyebutan di dalam paragraf.
{
  const h = cariAtlas('asthma')
  ok('mencari asma menemukan asma lebih dulu', h[0]?.id === 'asthma', h.slice(0, 3).map((x) => x.id).join(', '))
}
{
  const h = cariAtlas('cataract')
  ok('mencari katarak menemukan katarak lebih dulu', h[0]?.id === 'katarak', h.slice(0, 3).map((x) => x.id).join(', '))
}
{
  // Nama penyakit SKDI (bahasa Indonesia) juga harus menemukan keadaannya.
  const h = cariAtlas('apendisitis')
  ok('nama SKDI menemukan keadaannya', h.some((x) => x.id === 'appendicitis'), h.slice(0, 3).map((x) => x.id).join(', '))
}
{
  // Struktur bernama harus ditemukan, termasuk yang panjang.
  const h = cariAtlas('transition zone')
  ok('nama struktur ditemukan', h.some((x) => x.jenis === 'struktur' && /transition zone/i.test(x.label)))
  ok('zona transisi membawa serta BPH', cariAtlas('transition zone').some((x) => x.id === 'bph') ||
    cariAtlas('prostatic hyperplasia').some((x) => x.id === 'bph'))
}
{
  const h = cariAtlas('aspirin')
  ok('obat ditemukan dan didahulukan', h[0]?.jenis === 'obat' && h[0].id === 'aspirin', JSON.stringify(h[0]))
}
{
  const h = cariAtlas('cyclo-oxygenase')
  ok('target molekul ditemukan', h.some((x) => x.jenis === 'obat' && x.id === 'aspirin'))
}
{
  // Satu struktur yang ada di dua modul hanya muncul sekali.
  const h = cariAtlas('left kidney', 50)
  const ginjal = h.filter((x) => x.jenis === 'struktur' && x.label.toLowerCase() === 'left kidney')
  ok('struktur yang sama tidak muncul berkali-kali', ginjal.length === 1, String(ginjal.length))
}
{
  // Awal kata dihargai lebih tinggi daripada tengah kata.
  const h = cariAtlas('colic', 30)
  const i = h.findIndex((x) => /colic|kolik/i.test(x.label))
  ok('kecocokan awal kata muncul di urutan atas', i >= 0 && i < 5, String(i))
}
{
  const h = cariAtlas('stroke')
  ok('setiap hasil membawa modulnya', h.length > 0 && h.every((x) => x.module.length > 0))
  ok('hasil dibatasi jumlahnya', cariAtlas('a', 5).length <= 5 && cariAtlas('e', 5).length <= 5)
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
