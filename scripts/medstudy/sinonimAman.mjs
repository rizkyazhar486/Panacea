// Menjaga tabel sinonim TIDAK memicu penyakit yang keliru.
//
// CACAT YANG MELAHIRKAN SKRIP INI. Pencocokan sinonim semula memakai potongan
// huruf di mana saja, sehingga padanan berupa singkatan pendek meledak:
// 'oma' terkandung di dalam glaukOMA, lipOMA, melanOMA, kondilOMA, trakOMA,
// dan sindrOMA nefrotik; 'ome' di dalam glOMErulonefritis; 'pid' di dalam
// ePIDidimitis; dan 'af' di dalam AFasia. Yang mencari 'glaukoma akut' ikut
// memperoleh otitis media akut.
//
// MENGAPA SKRIP, BUKAN SEKADAR DIPERBAIKI SEKALI. Tabelnya terus bertambah,
// dan setiap singkatan baru dua atau tiga huruf berpotensi mengulangi cacat
// yang sama. Skrip ini menahannya: ia mencoba nama-nama penyakit yang justru
// MENGANDUNG singkatan itu di tengah kata, dan gagal bila ada yang terpicu.
//
// Skrip ini juga memeriksa arah sebaliknya — bahwa padanan yang SAH tetap
// ketemu. Perbaikan yang mematikan pemicu palsu dengan cara mematikan seluruh
// tabelnya akan lulus separuh pemeriksaan; karena itu keduanya diperiksa.
//
// Dijalankan: node scripts/sinonimAman.mjs
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const { sinonimUntuk } = await import(pathToFileURL(resolve('src/lib/sinonimPenyakit.ts')).href)

/** Ketikan yang MENGANDUNG singkatan di tengah kata dan TIDAK boleh terpicu. */
const TIDAK_BOLEH = [
  'glaukoma akut', 'glaukoma sudut tertutup', 'lipoma', 'melanoma', 'trakoma',
  'kondiloma akuminata', 'sindroma nefrotik', 'karsinoma', 'limfoma', 'hematoma',
  'glomerulonefritis', 'epididimitis', 'afasia', 'trikotilomania', 'osteosarkoma',
]

/** Padanan yang harus TETAP ketemu — penjaga terhadap perbaikan yang berlebihan. */
const HARUS = [
  ['af', 'fibrilasi atrial'],
  ['oma', 'otitis media akut'],
  ['sle', 'systemic lupus'],
  ['svt', 'supraventricular'],
  ['pid', 'pelvic inflammatory'],
  ['stroke', 'infark serebral'],
  ['gout', 'pirai'],
  ['tbc', 'tuberkulosis'],
  ['mimisan', 'epistaksis'],
  ['ketombe', 'dermatitis seboroik'],
  ['kaki gajah', 'filariasis'],
  ['batu empedu', 'kolelitiasis'],
  ['radang amandel', 'tonsilitis'],
]

let gagal = 0
for (const q of TIDAK_BOLEH) {
  const r = sinonimUntuk(q)
  if (r.length) { console.log(`  PEMICU PALSU  "${q}"  ->  ${r.join(', ')}`); gagal++ }
}
for (const [q, harus] of HARUS) {
  const r = sinonimUntuk(q)
  if (!r.includes(harus)) { console.log(`  PADANAN HILANG  "${q}"  seharusnya memuat "${harus}", yang ada: ${r.join(', ') || '(kosong)'}`); gagal++ }
}

console.log(`\nketikan yang diperiksa : ${TIDAK_BOLEH.length + HARUS.length}`)
console.log(`gagal                  : ${gagal}`)
if (gagal) process.exit(1)
console.log('\ntidak ada pemicu palsu, dan seluruh padanan yang sah tetap ketemu')
