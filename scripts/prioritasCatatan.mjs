// Daftar kerja yang diurutkan menurut SEBERAPA SERING KELUAR DI UJIAN, bukan
// menurut urutan abjad maupun urutan daftar SKDI.
//
// MENGAPA INI ADA. Ada 556 penyakit yang catatannya belum lengkap. Mengerjakan
// menurut urutan daftar berarti kasus yang keluar empat belas kali dalam
// sepuluh tahun dikerjakan sesudah kasus yang belum pernah keluar sekali pun,
// hanya karena huruf awalnya lebih belakang. Urutan pengerjaan adalah keputusan
// yang paling menentukan hasil di sini, dan keputusan itu pantas dihitung.
//
// Dijalankan: node scripts/prioritasCatatan.mjs [jumlah]
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const FIELD = ['definisi', 'etiologi', 'patofisiologi', 'anamnesis', 'pemeriksaanFisik', 'penunjang', 'diagnosisBanding', 'tatalaksana']

function blokDari(teks, awalan = '') {
  const out = {}
  const idx = []
  const re = /^  '((?:[^'\\]|\\.)*)':\s*\{$/gm
  let m
  while ((m = re.exec(teks))) idx.push({ key: m[1], start: m.index })
  idx.forEach((x, i) => { out[awalan + x.key] = teks.slice(x.start, i + 1 < idx.length ? idx[i + 1].start : teks.length) })
  return out
}

const notes = readFileSync('src/lib/skdiDiseaseNotes.ts', 'utf8')
const osce = readFileSync('src/lib/osceStationNotes.ts', 'utf8')
const aliasSrc = readFileSync('src/lib/skdiDiseaseNoteAliases.ts', 'utf8')
const alias = Object.fromEntries([...aliasSrc.matchAll(/^  '([^']+)':\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]))
const blok = { ...blokDari(notes), ...blokDari(osce, 'OSCE::') }

const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const petaNorm = new Map()
for (const k of Object.keys(blok)) {
  const n = norm(k.replace(/^OSCE::/, ''))
  if (!petaNorm.has(n)) petaNorm.set(n, k)
}
for (const [k, v] of Object.entries(alias)) {
  const kunci = blok[v] ? v : blok['OSCE::' + v] ? 'OSCE::' + v : null
  if (kunci && !petaNorm.has(norm(k))) petaNorm.set(norm(k), kunci)
}

const terisi = (kunci) => {
  const b = blok[kunci]
  return b ? FIELD.filter((f) => new RegExp('^\\s{4}' + f + ':', 'm').test(b)).length : 0
}

/**
 * Pencocokan memakai aturan yang SAMA dengan cakupanDaftar.mjs, termasuk syarat
 * awalan berupa kata utuh untuk nama satu kata — aturan yang lahir dari tiga
 * kekeliruan berturut-turut di sana, dan tidak perlu diulangi di sini.
 */
function cariSatu(nama) {
  const n = norm(nama)
  if (!n) return null
  if (petaNorm.has(n)) return petaNorm.get(n)
  const kata = n.split(' ').filter((w) => w.length > 3)
  if (!kata.length) return null
  for (const [kn, kunci] of petaNorm) {
    if (!kata.every((w) => kn.includes(w))) continue
    if (kata.length === 1 && !(kn === kata[0] || kn.startsWith(kata[0] + ' '))) continue
    return kunci
  }
  return null
}

/**
 * Beberapa bentuk nama dicoba, dan yang PALING LENGKAP catatannya yang dipakai.
 *
 * Percobaan pertama hanya mencoba satu bentuk, dan itu melaporkan GNAPS sebagai
 * 3/8 padahal catatannya sudah 8/8. Sebabnya: nama bakunya menjadi
 * "glomerulonefritis akut pasca streptokokus", sedangkan catatan barunya
 * bernama "Glomerulonefritis akut" — kata "pasca" dan "streptokokus" tidak ada
 * di dalamnya, sehingga pencocokan kata gagal dan jatuh ke stasiun OSCE lama
 * yang memang baru 3/8. Daftar kerja yang melaporkan pekerjaan selesai sebagai
 * belum selesai akan membuat pekerjaan itu dikerjakan dua kali.
 */
function cari(kunciBaku, label) {
  const kata = norm(kunciBaku).split(' ')
  const calon = [
    label,
    kunciBaku,
    kata.slice(0, 3).join(' '),
    kata.slice(0, 2).join(' '),
    kata[0],
  ]
  let terbaik = null
  let terbaikIsi = -1
  for (const c of calon) {
    const k = cariSatu(c)
    if (!k) continue
    const isi = terisi(k)
    if (isi > terbaikIsi) { terbaik = k; terbaikIsi = isi }
    if (isi === 8) break
  }
  return terbaik
}

// Frekuensi OSCE diambil dari lapisan analisis yang sama dengan yang dipakai
// halaman /osce-ukmppd, supaya keduanya tidak pernah berselisih.
const kasus = JSON.parse(
  execFileSync('npx', ['tsx', '-e', `
    import { hitungKasus } from './src/lib/analisisOsce'
    console.log(JSON.stringify(hitungKasus().map((k) => ({ label: k.label, kunci: k.kunci, sistem: k.sistem, jumlah: k.jumlah, terakhir: k.periode[0] }))))
  `], { maxBuffer: 32 * 1024 * 1024 }).toString().trim().split('\n').pop(),
)

const batas = Number(process.argv[2] || 40)
const baris = []
for (const k of kasus) {
  // Kasus yang hanya sekali muncul dilewati: 79% daftar berada di sana, dan
  // memasukkannya membuat daftar kerja ini sama panjangnya dengan daftar SKDI.
  if (k.jumlah < 2) continue
  const kunci = cari(k.kunci, k.label)
  const n = kunci ? terisi(kunci) : 0
  baris.push({ ...k, n, kunci })
}

const belum = baris.filter((b) => b.n < 8)
console.log(`Kasus OSCE yang muncul >=2 kali: ${baris.length}`)
console.log(`  catatannya sudah lengkap 8/8 : ${baris.length - belum.length}`)
console.log(`  belum lengkap                : ${belum.length}\n`)
console.log(`── ${batas} teratas yang BELUM lengkap ──`)
console.log('  ke  isi  kasus                                        sistem')
for (const b of belum.slice(0, batas)) {
  console.log(
    '  ' + String(b.jumlah).padStart(2) + 'x  ' + String(b.n) + '/8  ' +
    b.label.slice(0, 44).padEnd(46) + b.sistem.split(',')[0].slice(0, 24),
  )
}
