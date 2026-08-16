// Catatan yang SUDAH DITULIS tetapi TIDAK DAPAT DITEMUKAN dari Daftar Penyakit.
//
// CACAT YANG MELAHIRKAN SKRIP INI. Pemakai mencari "Gout" pada Daftar Penyakit
// SKDI dan memperoleh "Tidak ada hasil" — padahal catatan stasiun 'Gout
// Artritis' sudah lengkap 8/8 dan ada enam entri tatalaksananya. Sebabnya:
// halaman itu dibangun dari skdiDiseaseList.ts, dan gout memang tidak pernah
// ada di dalam daftar itu. Catatannya ada, tetapi tidak ada satu pun jalan ke
// sana dari tempat orang mencarinya.
//
// INI BENTUK KEGAGALAN YANG PALING MERUGIKAN, dan sudah muncul berkali-kali di
// aplikasi ini dalam wujud berbeda: catatan yang ada tetapi tidak terjangkau.
// Seluruh skrip penjaga yang ada memeriksa apakah catatannya ADA dan apakah
// LENGKAP; tidak satu pun memeriksa apakah orang dapat SAMPAI ke sana. Angka
// "192/192 lengkap" tetap hijau sementara pemakainya melihat "tidak ada hasil".
//
// CARA MENILAINYA. Untuk tiap catatan yang tergolong lengkap, dicari apakah
// ada penyakit di daftar yang namanya cocok. Pencocokan KETAT — nama persis
// atau seluruh kata bermakna termuat — sebab pencocokan longgar pernah
// menautkan dua penyakit yang tidak berhubungan di skrip lain.
//
// Dijalankan: node scripts/catatanTakTerdaftar.mjs
import { readFileSync } from 'node:fs'

const FIELD = ['definisi', 'etiologi', 'patofisiologi', 'anamnesis', 'pemeriksaanFisik', 'penunjang', 'diagnosisBanding', 'tatalaksana']
const SETARA = { patofisiologi: ['patofisiologi', 'rantai'] }

function blokDari(teks) {
  const out = {}
  const idx = []
  const re = /^  '((?:[^'\\]|\\.)*)':\s*\{$/gm
  let m
  while ((m = re.exec(teks))) idx.push({ key: m[1].replace(/\\'/g, "'"), start: m.index })
  idx.forEach((x, i) => { out[x.key] = teks.slice(x.start, i + 1 < idx.length ? idx[i + 1].start : teks.length) })
  return out
}

const osce = blokDari(readFileSync('src/lib/osceStationNotes.ts', 'utf8'))
const daftarSrc = readFileSync('src/lib/skdiDiseaseList.ts', 'utf8')
const alias = readFileSync('src/lib/skdiDiseaseNoteAliases.ts', 'utf8')

const penyakit = [...daftarSrc.matchAll(/disease: '((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"))

const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const daftarNorm = penyakit.map(norm)

const terisi = (b) =>
  FIELD.filter((f) => (SETARA[f] ?? [f]).some((n) => new RegExp('^\\s{4}' + n + ':', 'm').test(b))).length

/** Apakah catatan ini dapat dijangkau dari daftar penyakit? */
function terjangkau(nama) {
  // Alias yang diperiksa tangan juga dihitung sebagai jalan masuk.
  if (alias.includes(`'${nama}'`)) return true
  for (const potong of nama.split('/')) {
    const n = norm(potong)
    if (!n) continue
    if (daftarNorm.includes(n)) return true
    const kata = n.split(' ').filter((w) => w.length > 3)
    if (kata.length && daftarNorm.some((d) => kata.every((w) => d.includes(w)))) return true
  }
  return false
}

const hilang = []
for (const [nama, blok] of Object.entries(osce)) {
  if (terisi(blok) < 8) continue          // hanya yang catatannya lengkap
  if (terjangkau(nama)) continue
  hilang.push(nama)
}

console.log(`Penyakit di Daftar SKDI          : ${penyakit.length}`)
console.log(`Catatan stasiun lengkap 8/8      : ${Object.values(osce).filter((b) => terisi(b) >= 8).length}`)
console.log(`Lengkap TETAPI tidak terjangkau  : ${hilang.length}`)

if (hilang.length) {
  console.log('\n── catatan lengkap yang TIDAK dapat ditemukan dari Daftar Penyakit ──')
  for (const h of hilang) console.log(`   ${h}`)
  console.log('\nSetiap baris di atas berarti: catatannya sudah ditulis lengkap, tetapi')
  console.log('orang yang mencarinya di Daftar Penyakit memperoleh "Tidak ada hasil".')
} else {
  console.log('\nseluruh catatan lengkap dapat ditemukan dari Daftar Penyakit')
}
