// Daftar penyakit di aplikasi dibandingkan berkas induk SKDI 2012.
//
// MENGAPA SKRIP INI ADA. Pemakai mencari 'Gout' di Daftar Penyakit dan
// memperoleh "Tidak ada hasil" — bukan karena pencariannya rusak, melainkan
// karena penyakitnya memang tidak pernah ada di skdiDiseaseList.ts. Tidak ada
// satu pun pemeriksaan yang membandingkan daftar itu dengan sumbernya, jadi
// setiap penyakit yang hilang sewaktu daftar ini pertama kali disalin akan
// tetap hilang tanpa ada yang tahu.
//
// SUMBERNYA TIDAK BERSIH, DAN ITU HARUS DIPERHITUNGKAN. docs/rujukan/
// skdi2012-induk.tsv berasal dari PDF SKDI 2012 yang diuraikan mesin. Nama
// penyakit yang tertulis dua baris di PDF tergabung dengan tetangganya:
//
//   271  "Defect, Atrial Septal Defect, ... Radang pada dinding jantung (Endokarditis,"
//   272  "Miokarditis, Perikarditis)"
//
// Mengimpor berkas itu apa adanya akan memasukkan 45 nama penyakit palsu ke
// dalam aplikasi. Karena itu skrip ini TIDAK menyalin apa pun; ia hanya
// melaporkan selisih supaya diperiksa mata.
//
// BERKAS INDUKNYA JUGA TIDAK LENGKAP. Ia kehilangan entri yang nyata ada di
// SKDI 2012 — Obstructive Sleep Apnea, Abses Bezold, Sindrom metabolik —
// tampaknya termakan oleh penggabungan baris yang sama. Jadi "ada di aplikasi,
// tidak ada di induk" BUKAN bukti bahwa entrinya keliru, dan tidak boleh
// dipakai untuk menghapus apa pun.
//
// CARA MEMBACA KELUARANNYA. Sebuah selisih dianggap TERJELASKAN bila nama di
// satu sisi termuat sebagai potongan baris di sisi lain — itu tanda
// penggabungan baris, bukan penyakit yang hilang. Sisanya yang dilaporkan.
//
// Dijalankan: node scripts/bandingSkdi.mjs
import { readFileSync } from 'node:fs'

const induk = readFileSync('docs/rujukan/skdi2012-induk.tsv', 'utf8')
  .trim()
  .split('\n')
  .slice(1)
  .map((l) => l.split('\t'))
  .map(([no, d, lv]) => ({ no: +no, d: (d ?? '').trim(), lv: (lv ?? '').trim() }))

const app = [
  ...readFileSync('src/lib/skdiDiseaseList.ts', 'utf8').matchAll(
    /\{ system: '([^']*)', disease: '((?:[^'\\]|\\.)*)', level: '([^']*)'/g,
  ),
].map((m) => ({ sys: m[1], d: m[2].replace(/\\'/g, "'"), lv: m[3] }))

const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

const indukNorm = induk.map((m) => norm(m.d))
const appNorm = app.map((a) => norm(a.d))
const setInduk = new Set(indukNorm)
const setApp = new Set(appNorm)

/** Termuat sebagai potongan baris di sisi lain — tanda baris tergabung. */
const potonganDari = (n, daftar) => daftar.some((x) => x !== n && x.includes(n))

const hilang = induk.filter((m, i) => !setApp.has(indukNorm[i]) && !potonganDari(indukNorm[i], appNorm))
const tambahan = app.filter((a, i) => !setInduk.has(appNorm[i]) && !potonganDari(appNorm[i], indukNorm))

// Tingkat kompetensi hanya dibandingkan untuk nama yang muncul SEKALI di kedua
// sisi. 'Benda asing' muncul lima kali dengan tingkat berbeda-beda menurut
// organnya; mencocokkan yang pertama saja melaporkan lima selisih palsu.
const sekali = (arr, n) => arr.filter((x) => x === n).length === 1
const beda = []
for (const [i, m] of induk.entries()) {
  const n = indukNorm[i]
  if (!sekali(indukNorm, n) || !sekali(appNorm, n)) continue
  const a = app[appNorm.indexOf(n)]
  if (a && a.lv !== m.lv) beda.push([m.no, m.d, `induk=${m.lv}`, `aplikasi=${a.lv}`])
}

console.log(`Entri berkas induk   : ${induk.length}`)
console.log(`Entri aplikasi       : ${app.length}`)
console.log(`\nDi induk, tidak di aplikasi (setelah baris tergabung dibuang): ${hilang.length}`)
for (const m of hilang) console.log(`   ${String(m.no).padStart(3)}  ${m.lv.padEnd(3)} ${m.d.slice(0, 90)}`)

console.log(`\nDi aplikasi, tidak di induk — DIPERIKSA TANGAN, jangan dihapus: ${tambahan.length}`)
for (const a of tambahan) console.log(`        ${a.lv.padEnd(3)} ${a.d.slice(0, 90)}`)

console.log(`\nTingkat kompetensi berbeda (nama unik di kedua sisi): ${beda.length}`)
for (const b of beda) console.log(`   ${b.join('  ')}`)

if (!hilang.length && !beda.length) {
  console.log('\ntidak ada penyakit yang hilang dan tidak ada tingkat yang berselisih')
}
