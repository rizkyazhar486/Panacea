// Mendaftar teks yang TERLIHAT PEMAKAI dan masih berbahasa Inggris.
//
// Cara mengenalinya: kata-kata Inggris yang lazim muncul di antarmuka
// (your, the, and, with, from, this, ...) di dalam atribut judul/subjudul
// atau di dalam teks JSX. Ini penapis kasar dan tidak dapat sempurna —
// istilah kedokteran memang berbahasa Inggris, dan nama fitur seperti
// "Body Battery" tidak untuk diterjemahkan.
//
// Karena itu keluarannya adalah DAFTAR PERIKSA berperingkat, bukan vonis:
// halaman dengan tumpukan kalimat Inggris berada di atas, dan itulah yang
// perlu dikerjakan lebih dahulu.

import { readdirSync, readFileSync } from 'node:fs'

const KATA = /\b(your|you|the|and|with|from|this|that|these|those|for|are|is|was|were|have|has|been|will|would|should|could|when|where|what|which|how|why|not|but|than|then|here|there|about|into|over|under|after|before|each|every|only|still|already|enough)\b/i

// Baris yang memang tidak untuk diterjemahkan.
const LEWATI = [
  /^\s*(import|export|const|let|function|interface|type|class)\b/,
  /className=|aria-|href=|to=|src=|d="M|viewBox|stroke|fill=/,
  /^\s*\/\//,
]

function kalimatTerlihat(baris) {
  if (LEWATI.some((r) => r.test(baris))) return null
  // Teks di antara > dan <, atau di dalam atribut title/subtitle/placeholder/label.
  // Ambang panjang untuk ATRIBUT diturunkan ke 6 aksara. Dengan ambang 12,
  // judul halaman seperti "Allergy Tracker" lolos — justru teks yang paling
  // besar dan paling terlihat di layar. Ambang yang membuat skrip ini tenang
  // ternyata menyembunyikan yang paling penting.
  // SEMUA atribut diperiksa, bukan yang pertama saja, dan pemeriksaan JSX
  // TIDAK dilewati ketika sebuah atribut cocok tetapi ternyata sudah
  // berbahasa Indonesia.
  //
  // Versi sebelumnya berhenti pada atribut pertama; begitu ambangnya
  // diturunkan ke 6 aksara, atribut pendek berbahasa Indonesia mulai
  // "menutupi" kalimat Inggris di baris yang sama, dan jumlahnya justru TURUN
  // sesudah penapisnya diperluas. Angka yang bergerak ke arah yang mustahil
  // itulah yang menunjukkan alatnya rusak, bukan datanya membaik.
  for (const m of baris.matchAll(/(?:title|subtitle|placeholder|label|ringkas)="([^"]{6,})"/g)) {
    if (KATA.test(m[1])) return m[1]
  }
  // Teks JSX hanya tertangkap bila pembuka dan penutupnya berada pada BARIS
  // YANG SAMA. Paragraf yang dipenggal ke beberapa baris — bentuk yang justru
  // lazim untuk kalimat panjang — luput seluruhnya. Itu ditemukan lewat uji
  // peramban pada halaman Osmolalitas Serum, bukan lewat skrip ini.
  //
  // Karena itu ditambahkan penapis kedua: baris yang seluruhnya teks (tanpa
  // tanda kurung siku maupun kurung kurawal) dan memuat kata Inggris.
  const jsx = baris.match(/>\s*([A-Z][^<>{}]{14,})</)
  if (jsx && KATA.test(jsx[1])) return jsx[1].trim()
  const polos = baris.trim()
  if (polos.length >= 20 && !/[<>{}=]/.test(polos) && KATA.test(polos)) return polos
  return null
}

// SISA YANG MEMANG BENAR BERBAHASA INGGRIS, dan alasannya masing-masing.
// Semuanya sudah diperiksa satu per satu; menerjemahkannya justru menjadikan
// halaman itu salah.
//
//  - "Personality and Individual Differences" — nama jurnal pada sitasi
//    Adan & Almirall (1991). Nama terbitan tidak dialihbahasakan.
//  - "Allergic Rhinitis and its Impact on Asthma (Bousquet dkk., WHO 2008)" —
//    nama resmi pedoman ARIA; menerjemahkannya membuat pedomannya tidak dapat
//    dicari.
//  - Judul makalah Levine dkk. (2018) di dalam kalimat Indonesia — judul
//    makalah dikutip apa adanya.
//  - "Skor HAS-BLED" — tertangkap hanya karena kata "has" ada di dalam
//    akronimnya. Ini kekeliruan penapis, bukan teks Inggris.
//
// Karena itu ambang jujur skrip ini adalah 4, bukan 0.
const hasil = []
for (const dir of ['src/pages', 'src/components']) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.tsx'))) {
    const baris = readFileSync(`${dir}/${f}`, 'utf8').split('\n')
    const temuan = []
    baris.forEach((b, i) => {
      const k = kalimatTerlihat(b)
      if (k) temuan.push({ baris: i + 1, teks: k })
    })
    if (temuan.length) hasil.push({ berkas: `${dir}/${f}`, temuan })
  }
}
hasil.sort((a, b) => b.temuan.length - a.temuan.length)

const arg = process.argv[2]
if (arg) {
  const satu = hasil.find((h) => h.berkas.includes(arg))
  if (!satu) { console.log('tidak ada'); process.exit(0) }
  for (const t of satu.temuan) console.log(String(t.baris).padStart(5), t.teks)
} else {
  for (const h of hasil.slice(0, 25)) console.log(String(h.temuan.length).padStart(4), h.berkas)
  console.log(`\n${hasil.reduce((a, h) => a + h.temuan.length, 0)} kalimat Inggris di ${hasil.length} berkas.`)
}

// ── Kalimat SETENGAH TERJEMAH ──────────────────────────────────────────────
//
// Lebih buruk daripada kalimat yang masih utuh berbahasa Inggris: kalimat yang
// separuhnya sudah Indonesia dan separuhnya belum terbaca seperti kekeliruan
// ketik, dan pembacanya berhenti di tengah. Ini muncul ketika penggantian
// dilakukan sepotong-sepotong.
import { readdirSync as bacaDir, readFileSync as bacaBerkas } from 'node:fs'

const ING = /\b(the|your|with|from|this|that|and|for|when|which|not)\b/i
const IND = /\b(yang|dengan|tidak|adalah|dari|pada|untuk|karena|bukan|lebih)\b/i

const campur = []
for (const dir of ['src/pages', 'src/components']) {
  for (const f of bacaDir(dir).filter((x) => x.endsWith('.tsx'))) {
    bacaBerkas(`${dir}/${f}`, 'utf8').split('\n').forEach((b, i) => {
      if (/^\s*(\/\/|\*|import|export)/.test(b)) return
      if (!/[><"']/.test(b)) return
      const teks = (b.match(/>\s*([^<>{}]{25,})</) || b.match(/"([^"]{25,})"/) || [])[1]
      if (!teks) return
      if (ING.test(teks) && IND.test(teks)) campur.push(`${dir}/${f}:${i + 1}  ${teks.slice(0, 90)}`)
    })
  }
}
if (!process.argv[2]) {
  console.log(`\n${campur.length} kalimat setengah terjemah (Inggris + Indonesia dalam satu kalimat):`)
  for (const c of campur.slice(0, 15)) console.log('  ', c)
}
