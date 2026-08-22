// Logika bersama untuk menilai APAKAH sebuah kasus rekap punya catatan, dan
// seberapa lengkap catatan itu.
//
// MENGAPA DIPISAH KE SINI. Logika ini semula disalin ke dua skrip. Keduanya
// lalu menyimpang: kasusSekali.mjs menyeragamkan ejaan dan membuang baris yang
// bukan kasus, kasusTanpaCatatan.mjs tidak — dan keduanya melaporkan angka
// "belum ada catatannya" yang berbeda untuk data yang sama. Angka yang saling
// bertentangan lebih buruk daripada tidak ada angka sama sekali, sebab
// keduanya tetap dipercaya.
//
// Dipakai oleh scripts/kasusSekali.mjs dan scripts/kasusTanpaCatatan.mjs.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const FIELD = ['definisi', 'etiologi', 'patofisiologi', 'anamnesis', 'pemeriksaanFisik', 'penunjang', 'diagnosisBanding', 'tatalaksana']
const SETARA = { patofisiologi: ['patofisiologi', 'rantai'] }

function blokDari(teks, awalan = '') {
  const out = {}
  const idx = []
  // Kunci catatan pun ada yang berkutip GANDA, karena isinya mengandung
  // apostrof — "Goiter Endemik / Grave's Disease / Hipertiroid". Pola yang
  // hanya mengenali kutip tunggal membuat catatan itu seolah tidak ada.
  const re = /^  (?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"):\s*\{$/gm
  let m
  while ((m = re.exec(teks))) idx.push({ key: (m[1] ?? m[2]).replace(/\\'/g, "'"), start: m.index })
  idx.forEach((x, i) => { out[awalan + x.key] = teks.slice(x.start, i + 1 < idx.length ? idx[i + 1].start : teks.length) })
  return out
}

/*
 * TABEL PADANAN IKUT DIBACA.
 *
 * osceStationNoteAliases.ts adalah yang dipakai LAYAR untuk menemukan catatan
 * sebuah kasus. Bila skrip ini tidak ikut membacanya, ia melaporkan "belum ada
 * catatannya" untuk kasus yang di layar SUDAH menampilkan catatannya — angka
 * yang mengada-adakan pekerjaan, kebalikan dari cacat yang biasa terjadi di
 * sini tetapi sama menyesatkannya.
 */
const aliasSrc = readFileSync('src/lib/osceStationNoteAliases.ts', 'utf8')
const badanAlias = aliasSrc.slice(aliasSrc.indexOf('const ALIAS'), aliasSrc.indexOf('\n}', aliasSrc.indexOf('const ALIAS')))
/*
 * KUNCI BERKUTIP GANDA IKUT DIBACA.
 *
 * Pola semula hanya mengenali kunci berkutip TUNGGAL dan kunci telanjang.
 * Padahal kunci yang isinya mengandung apostrof ditulis dengan kutip GANDA —
 * "Bell's palsy", "Grave's disease". Akibatnya skrip melaporkan keduanya
 * "belum ada catatannya", padahal di layar tombol catatannya muncul dan
 * isinya benar. Bell's palsy keluar DELAPAN KALI dalam sepuluh tahun, dan
 * selama itu ia berdiri di puncak daftar pekerjaan yang sebenarnya sudah
 * selesai.
 *
 * Ini kesalahan alat ukur, bukan kesalahan aplikasi — bentuk yang paling
 * mahal, sebab ia mengarahkan pekerjaan ke tempat yang keliru.
 *
 * KEMUDIAN HAL YANG SAMA TERJADI PADA SISI NILAINYA. Setelah kunci berkutip
 * ganda dibaca, tiga padanan Graves dan Goiter tetap dilaporkan hilang —
 * kali ini karena SASARANNYA yang berkutip ganda, sebab nama catatannya
 * "Goiter Endemik / Grave's Disease / Hipertiroid" juga mengandung apostrof.
 * Ketahuannya dari angka yang mustahil: kasus ">=2x tanpa catatan" NAIK dari
 * 2 menjadi 5 setelah padanan DITAMBAHKAN. Penambahan padanan tidak pernah
 * bisa menaikkan angka itu, dan justru kemustahilan itulah yang menunjuk ke
 * alat ukurnya, bukan ke datanya.
 */
const ALIAS = new Map(
  [...badanAlias.matchAll(/^\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|([A-Za-z][A-Za-z0-9_]*)):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"),/gm)]
    .map((m) => [(m[1] ?? m[2] ?? m[3]).replace(/\\'/g, "'"), (m[4] ?? m[5]).replace(/\\'/g, "'")]),
)

const notes = readFileSync('src/lib/skdiDiseaseNotes.ts', 'utf8')
const osce = readFileSync('src/lib/osceStationNotes.ts', 'utf8')
const blok = { ...blokDari(notes), ...blokDari(osce, 'OSCE::') }

/*
 * PENYERAGAMAN EJAAN, karena rekap ujian ditulis banyak orang selama sepuluh
 * tahun. Tanpa ini, 'Abses Peritonsilar' dan 'Abses Peritonsiler' dilaporkan
 * belum ada catatannya padahal 'Abses Peritonsil' sudah lengkap 8/8 — dan
 * angka 'belum dikerjakan' menjadi berlipat tanpa satu pun pekerjaan nyata di
 * belakangnya. Hanya perbedaan EJAAN yang diseragamkan, bukan makna.
 */
const EJAAN = [
  [/\b(\w+)(sil[ae]r|siler)\b/g, '$1sil'],   // peritonsilar/peritonsiler -> peritonsil
  [/\bpulmo\w*\b/g, 'paru'],
  [/\bdextra\b|\bsinistra\b|\bbilateral\b/g, ''],
  [/\bec\b|\be c\b|\brme\b|\bsuspek\b|\bsusp\b|\bdd\b/g, ''],
  [/\bamobeasis\b|\bamoebiasis\b|\bamebiasis\b/g, 'amoeba'],
  [/\bkomplis\b|\bkomplit\b|\bkompletus\b/g, 'komplit'],
  [/\bsy\b/g, 'sindrom'],
  [/\bc\b/g, ''],
]
const norm = (s) => {
  let t = s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  for (const [re, ganti] of EJAAN) t = t.replace(re, ganti)
  return t.replace(/\s+/g, ' ').trim()
}

/*
 * BARIS YANG BUKAN KASUS ikut terbawa dari rekap: angka sisa penguraian
 * ('0.0', '6.0') dan catatan periode ('2020 - Februari 2022 Ga ada OSCE').
 * Menghitungnya sebagai pekerjaan berarti mengarang pekerjaan yang tidak ada.
 */
const bukanKasus = (label) =>
  /^[\d.,\s]+$/.test(label) ||
  /ga ada osce|tidak ada osce|covid-19\)$/i.test(label) ||
  label.trim().length < 4
const petaNorm = new Map()
for (const k of Object.keys(blok)) {
  const n = norm(k.replace(/^OSCE::/, ''))
  if (!petaNorm.has(n)) petaNorm.set(n, k)
}

const terisi = (kunci) => {
  const b = blok[kunci]
  if (!b) return 0
  return FIELD.filter((f) => (SETARA[f] ?? [f]).some((nama) => new RegExp('^\\s{4}' + nama + ':', 'm').test(b))).length
}

/*
 * Pencocokan KETAT: nama persis, atau seluruh kata bermakna termuat.
 *
 * MENGAPA KATA PENDEK IKUT DIHITUNG. Sebelumnya hanya kata lebih dari tiga
 * huruf yang dipakai, dan itu membuang justru kata yang membedakan:
 *
 *   'Neuropati DM'   -> tinggal 'neuropati' -> cocok ke 'Neuropati optik'
 *   'OMA perforasi'  -> tinggal 'perforasi' -> cocok ke 'Perforasi usus'
 *
 * Keduanya penyakit yang sama sekali lain. Dilaporkan sebagai "catatannya
 * sudah ada, tinggal dilengkapi", padahal catatan yang dimaksud bukan
 * catatannya — dan yang membacanya belajar penyakit yang salah. Singkatan
 * ujian hampir selalu pendek (DM, OMA, RA, TB, PID), jadi membuang kata
 * pendek berarti membuang pembedanya.
 *
 * Kata sambung yang tidak membedakan apa pun tetap dibuang.
 */
const KATA_SAMBUNG = new Set(['dan', 'atau', 'pada', 'dgn', 'yg', 'the', 'of'])
function cari(nama) {
  const n = norm(nama)
  if (petaNorm.has(n)) return petaNorm.get(n)
  const kata = n.split(' ').filter((w) => w.length >= 2 && !KATA_SAMBUNG.has(w))
  if (!kata.length) return null
  /*
   * KATA PENDEK HARUS COCOK SEBAGAI KATA UTUH, bukan sebagai potongan huruf.
   * 'RA OA' pernah tercocokkan ke 'DIC (Disseminated Intravascular
   * Coagulation)' — 'ra' termuat di dalam "intravascular" dan 'oa' di dalam
   * "coagulation". Dua penyakit yang tidak berhubungan sama sekali. Untuk
   * kata panjang potongan huruf masih masuk akal (imbuhan, jamak); untuk
   * singkatan dua sampai tiga huruf ia hampir selalu kebetulan.
   */
  const adaKata = (kn, w) =>
    w.length >= 4 ? kn.includes(w) : new RegExp(`(^| )${w}( |$)`).test(kn)
  for (const [kn, kunci] of petaNorm) {
    if (!kata.every((w) => adaKata(kn, w))) continue
    if (kata.length === 1 && !(kn === kata[0] || kn.startsWith(kata[0] + ' '))) continue
    return kunci
  }
  return null
}

/**
 * Kunci catatan untuk sebuah kasus rekap — MENIRU urutan yang dipakai LAYAR.
 *
 * catatanStasiun() di aplikasi mencari: padanan lalu catatan stasiun, padanan
 * lalu catatan SKDI, barulah nama apa adanya. Skrip yang memakai urutan lain
 * akan melaporkan angka yang tidak dialami siapa pun.
 *
 * CACAT YANG MELAHIRKAN FUNGSI INI. Kedua skrip semula memanggil cari() saja,
 * yang hanya menyeragamkan ejaan dan TIDAK melihat tabel padanan. Akibatnya
 * 'BV (Pemeriksaan Duh tubuh)' yang keluar EMPAT BELAS KALI dilaporkan belum
 * ada catatannya, padahal padanannya sudah ditulis dan di layar catatannya
 * terbuka. Angka melonjak dari 463 menjadi 678 hanya karena alat ukurnya
 * melewatkan satu langkah yang dilakukan aplikasi.
 */
export function kunciCatatan(label, kunciKasus) {
  const sasaran = ALIAS.get(label) ?? (kunciKasus ? ALIAS.get(kunciKasus) : undefined)
  if (sasaran) {
    if (blok['OSCE::' + sasaran]) return 'OSCE::' + sasaran
    if (blok[sasaran]) return sasaran
  }
  return cari(label) ?? (kunciKasus ? cari(kunciKasus) : null)
}

/** Seluruh kasus rekap, apa adanya dari analisisOsce. */
export function semuaKasus() {
  return JSON.parse(
    execFileSync('npx', ['tsx', '-e', `
      import { hitungKasus } from './src/lib/analisisOsce'
      console.log(JSON.stringify(hitungKasus().map((k) => ({ label: k.label, kunci: k.kunci, sistem: k.sistem, jumlah: k.jumlah }))))
    `], { encoding: 'utf8', maxBuffer: 64e6 }).trim(),
  )
}

export { FIELD, SETARA, ALIAS, blok, petaNorm, cari, terisi, bukanKasus, norm }
