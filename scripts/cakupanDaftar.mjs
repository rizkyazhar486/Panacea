import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// Periksa cakupan catatan untuk SEBUAH DAFTAR NAMA yang diberikan dari luar —
// misalnya daftar penyakit pada lembar kurikulum yang difoto.
//
// MENGAPA TIDAK MEMAKAI cakupanSkdi.mjs. Berkas itu memeriksa daftar SKDI di
// dalam aplikasi. Lembar kurikulum memakai penamaan yang berbeda ("Appendisitis
// Akut" berbanding "Apendisitis akut"), memuat butir yang tidak ada di SKDI
// ("Le Fort Fracture", "Snake Bite"), dan mengelompokkannya menurut bagian
// bedah, bukan menurut sistem organ. Memaksakan keduanya menjadi satu daftar
// akan menyembunyikan yang tidak cocok, dan justru yang tidak cocok itulah yang
// perlu dilaporkan.
//
// PENCOCOKAN BERTINGKAT, DAN TINGKATNYA IKUT DILAPORKAN supaya pembacanya tahu
// seberapa yakin sebuah kecocokan:
//   tepat   — nama sama persis setelah dinormalkan
//   alias   — cocok lewat berkas alias
//   kata    — seluruh kata namanya terkandung di dalam kunci catatan
//   (tidak) — tidak ditemukan
//
// Tebakan TIDAK PERNAH dilaporkan sebagai temuan. Kecocokan tingkat "kata"
// ditandai jelas, karena daftar cakupan yang melebih-lebihkan dirinya sendiri
// lebih berbahaya daripada tidak ada daftar sama sekali: ia membuat orang
// berhenti memeriksa.
// ─────────────────────────────────────────────────────────────────────────────

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

const norm = (s) => s.toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const petaNorm = new Map()
for (const k of Object.keys(blok)) {
  const bersih = k.replace(/^OSCE::/, '')
  const n = norm(bersih)
  if (!petaNorm.has(n)) petaNorm.set(n, k)
}

function terisi(kunci) {
  const b = blok[kunci]
  if (!b) return 0
  return FIELD.filter((f) => new RegExp('^\\s{4}' + f + ':', 'm').test(b)).length
}

function cari(nama) {
  const n = norm(nama)
  if (petaNorm.has(n)) return { kunci: petaNorm.get(n), cara: 'tepat' }

  for (const [k, v] of Object.entries(alias)) {
    if (norm(k) === n) {
      const kunci = blok[v] ? v : blok['OSCE::' + v] ? 'OSCE::' + v : null
      if (kunci) return { kunci, cara: 'alias' }
    }
  }

  // Seluruh kata nama harus terkandung — bukan sekadar sebagian, supaya
  // "Trauma Ginjal" tidak dicocokkan dengan "Trauma Kapitis".
  //
  // MINIMAL DUA KATA BERMAKNA. Percobaan pertama menerima satu kata, dan itu
  // menghasilkan kecocokan yang KELIRU SECARA KLINIS: "Ca Prostat" dicocokkan
  // dengan "Hiperplasia prostat jinak", dan "Ca Mammae" dengan "Fibroadenoma
  // mammae" — keganasan disamakan dengan lesi jinak, dan keduanya terhitung
  // sebagai cakupan yang sudah ada. Daftar cakupan yang melebih-lebihkan
  // dirinya sendiri lebih berbahaya daripada tidak ada daftar sama sekali,
  // karena ia membuat orang berhenti memeriksa justru pada butir yang paling
  // perlu diperiksa.
  const kata = n.split(' ').filter((w) => w.length > 3)
  if (kata.length) {
    for (const [kn, kunci] of petaNorm) {
      if (!kata.every((w) => kn.includes(w))) continue
      // SATU KATA HANYA SAH BILA IA AWALAN KUNCINYA.
      //
      // Membatasi ke dua kata saja menutup kekeliruan di atas, tetapi ikut
      // membuang kecocokan yang benar: "Hipoglikemia" adalah satu kata, dan
      // catatannya bernama "Hipoglikemia ringan". Syarat awalan menyelesaikan
      // keduanya sekaligus — "Hipoglikemia ringan" DIAWALI kata itu sehingga
      // diterima, sedangkan "Hiperplasia prostat jinak" tidak diawali
      // "prostat" sehingga "Ca Prostat" tetap ditolak.
      // Awalan harus berupa KATA UTUH, bukan sekadar rangkaian huruf: tanpa
      // syarat batas kata, "Ca Prostat" berpindah dari salah cocok dengan
      // "Hiperplasia prostat jinak" menjadi salah cocok dengan "Prostatitis" —
      // sama kelirunya, hanya berganti sasaran.
      if (kata.length === 1 && !(kn === kata[0] || kn.startsWith(kata[0] + ' '))) continue
      return { kunci, cara: 'kata' }
    }
  }
  return { kunci: null, cara: 'tidak' }
}

const daftar = JSON.parse(readFileSync(process.argv[2], 'utf8'))
let lengkap = 0, sebagian = 0, kosong = 0
const baris = []
for (const kel of daftar) {
  for (const nama of kel.isi) {
    const { kunci, cara } = cari(nama)
    const n = kunci ? terisi(kunci) : 0
    if (n === 8) lengkap++
    else if (n > 0) sebagian++
    else kosong++
    baris.push({ kelompok: kel.kelompok, nama, cara, n, kunci })
  }
}

const total = baris.length
console.log(`Diperiksa ${total} butir dari lembar kurikulum.`)
console.log(`  lengkap 8/8 : ${lengkap}`)
console.log(`  sebagian    : ${sebagian}`)
console.log(`  belum ada   : ${kosong}\n`)

let kelSekarang = ''
for (const b of baris) {
  if (b.kelompok !== kelSekarang) { kelSekarang = b.kelompok; console.log(`── ${kelSekarang}`) }
  const tanda = b.n === 8 ? 'LENGKAP ' : b.n > 0 ? `${b.n}/8     ` : 'BELUM   '
  const ket = b.cara === 'kata' ? '  (cocok lewat kata: ' + b.kunci + ')' : b.cara === 'alias' ? '  (alias)' : ''
  console.log('  ' + tanda + b.nama.padEnd(34) + ket)
}
