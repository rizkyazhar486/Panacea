#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Penjaga teks antarmuka.
//
// Berkas ini lahir dari tiga kerusakan nyata yang SEMUANYA LOLOS typecheck dan
// build, dan hanya ketahuan karena keluarannya dibaca manusia:
//
//   1. Halaman Learn ditulis dengan warna tema gelap (text-slate-300) di atas
//      kartu terang, sehingga teksnya nyaris tak terbaca. Kode sah, hasilnya
//      tidak terpakai.
//   2. Penggantian "Sesi" → "Sessions" menyusup ke tengah kalimat Indonesia
//      yang belum diterjemahkan: "Sessions ini", "Sessions kekuatan". Kalimat
//      campur aduk, tetapi tetap string yang sah.
//   3. Penggantian "Tinggal:" dan "Lahir:" mengubah NAMA VARIABEL —
//      tempatTinggal menjadi tempatLives in. Yang ini ditangkap typecheck,
//      tetapi hanya karena kebetulan merusak sintaks; kalau namanya konsisten
//      di semua tempat, ia akan lolos diam-diam.
//
// Ketiganya satu jenis: SALAH YANG TIDAK MEMBUAT PROGRAM GAGAL. Typecheck
// memeriksa tipe, bukan apakah tulisan bisa dibaca. Jadi pemeriksaannya harus
// dibuat terpisah, dan dijalankan sebelum menyerahkan pekerjaan.
//
// PELAJARAN KETIGA, ditambahkan setelah terulang: kamus penggantian tidak boleh
// berisi SATU KATA yang juga muncul di dalam nama identifier. "Orang" mengubah
// api.cariOrang menjadi api.cariPeople dan memutus panggilannya; "Sesi",
// "Tinggal", dan "Lahir" melakukan hal yang sama sebelumnya. Typecheck menangkap
// dua di antaranya hanya karena kebetulan merusak sintaks. Karena itu pemeriksa
// ini SELALU dijalankan berdampingan dengan `npx tsc --noEmit`, tidak
// menggantikannya — dan penggantian teks massal sebaiknya dibatasi pada frasa
// berspasi, bukan kata tunggal.
//
// Pakai:  node scripts/periksaTeks.mjs [--semua]
// Keluar dengan kode 1 bila ada temuan, supaya bisa dipasang di CI.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { execSync } from 'node:child_process'

const SEMUA = process.argv.includes('--semua')

// Korpus ujian kedokteran SENGAJA berbahasa Indonesia: ia materi belajar UKMPPD
// yang istilahnya terikat pada soal ujian berbahasa Indonesia. Menerjemahkannya
// merusak fungsinya, jadi ia dikecualikan — bukan dilupakan.
const KORPUS_ID = [
  'skdiDiseaseNotes.ts', 'skdiDiseaseList.ts', 'examBank.ts', 'osceStationNotes.ts',
  'osceStationRubrics.ts', 'clinicalSkills.ts', 'skdiTherapyReference.ts',
  'skdiSkillsChecklist.ts', 'quizBank.ts', 'studyContent.ts',
]

const KATA_ID = new RegExp(
  '\\b(yang|dan|dengan|untuk|tidak|bisa|dari|pada|ini|itu|akan|sudah|belum|anda' +
  '|saya|kita|atau|juga|lebih|agar|supaya|karena|bila|jika|saat|setiap|semua' +
  '|hanya|harus|dalam|tanpa|masih|sedang|kembali|lihat|buka|tutup|simpan|hapus' +
  '|tambah|ubah|cari|pilih|kirim|batal|lanjut|mulai|selesai|halaman|pengguna' +
  '|hasil|catatan|latihan|tidur|tubuh|kesehatan|makan|jantung|otot|lemak)\\b', 'i')

const BUKAN_TEKS = /(text-|bg-|flex|rounded|grid|px-|py-|mt-|mb-|gap-|hover:|border-|https?:\/\/|\/lib\/|\/pages\/|\/components\/|font-|leading-|^[/#])/

// Hanya token warna TEKS bertema gelap yang ditandai. Percobaan pertama juga
// menandai text-white dan bg-white/5, dan itu menghasilkan 1.495 temuan yang
// hampir semuanya sah — tombol berwarna memang bertulisan putih. Penjaga yang
// selalu merah akan diabaikan orang, jadi ia harus menandai HANYA hal yang
// benar-benar merusak keterbacaan: warna teks tema gelap di atas kartu terang.
// Dikalibrasi dengan mengukur kontras sungguhan di peramban, bukan ditebak.
// Pada latar terang, slate-400 ke atas masih lolos ambang WCAG AA 4,5:1;
// yang jatuh di bawahnya adalah slate-100 sampai 300 — dan itulah yang membuat
// halaman Learn nyaris tak terbaca. Rentang yang lebih lebar menghasilkan 472
// temuan dengan hanya satu yang benar-benar gagal.
// Diukur ulang setelah fungsi luminansinya diperbaiki: slate-400 hanya
// mencapai 2,63:1 dan rose-400 2,86:1 di atas kartu terang — keduanya jauh di
// bawah ambang WCAG AA 4,5:1. Pengukuran pertama menyatakan slate-400 lolos
// karena regex-nya salah membaca oklch() sebagai RGB.
// neutral-400 ditambahkan setelah diukur: hanya 2,58:1 di atas putih,
// sementara neutral-500 mencapai 4,74:1 dan hampir tak terbedakan mata. Ia
// dipakai 1.224 kali sebagai label kecil di seluruh aplikasi — jenis teks yang
// paling mudah dianggap "hanya hiasan" padahal ia yang memberi nama pada angka.
const WARNA_GELAP = /\btext-(?:slate-[1-4]00|neutral-400|(?:rose|amber|emerald|sky|lime|teal|cyan|violet|orange|yellow|green|blue|indigo|red)-400)\b/

/**
 * Campuran bahasa: kata Inggris yang menempel pada kata Indonesia. Inilah
 * bentuk kerusakan nomor 2, dan ia tidak akan pernah dilaporkan typecheck.
 */
const CAMPUR = /\b(Sessions|Training|Fitness|Summary|History|Result|Settings|Recovery|Credit|Block|Verified|Age|Status|Occupation|Education|Born|Phone|Height|Weight)\s+(ini|itu|yang|dan|dengan|untuk|tidak|dari|pada|akan|sudah|belum|kekuatan|tercatat|terakhir|seperti|panjang|pendek|mudah|berikutnya|dalam|hari|sedang|berat|kualitas|terjadwal|Anda|saya)\b/

/**
 * Identifier yang rusak akibat penggantian teks di dalam kode: nama variabel
 * yang mengandung SPASI, atau menempel pada kata bertitik dua. Pola sebelumnya
 * ikut menandai saveEducation — nama yang sah — jadi dipersempit ke bentuk yang
 * mustahil muncul dari kode yang ditulis sengaja.
 */
const IDENT_RUSAK = /\b[a-z][a-zA-Z]*[ \t]+(?:in|Lives|Born)[ \t]*:/

function berkas() {
  const keluaran = execSync('git ls-files "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' })
  return keluaran.split('\n').filter(Boolean)
}

function bersihkan(s) {
  return s
    .replace(/^\s*\/\/.*$/gm, '')          // komentar baris — boleh berbahasa Indonesia
    .replace(/\/\*[\s\S]*?\*\//g, '')      // komentar blok
}

const temuan = { bahasa: [], kontras: [], campur: [], ident: [] }

for (const f of berkas()) {
  const mentah = readFileSync(f, 'utf8')
  const isi = bersihkan(mentah)
  const nama = f.split('/').pop()
  const korpus = KORPUS_ID.includes(nama)

  // 1. Campuran bahasa — diperiksa di SEMUA berkas, termasuk korpus, karena
  //    kalimat campur aduk selalu salah di mana pun ia muncul.
  for (const m of isi.matchAll(new RegExp(CAMPUR, 'g'))) {
    temuan.campur.push(`${f}: ${m[0]}`)
  }

  // 2. Identifier rusak.
  for (const m of isi.matchAll(new RegExp(IDENT_RUSAK, 'g'))) {
    temuan.ident.push(`${f}: ${m[0]}`)
  }

  // 3. Warna tema gelap di halaman. Komponen bersama dikecualikan karena
  //    sebagian memang dipakai di atas permukaan gelap.
  // Pustaka ikut diperiksa: token warna ternyata juga hidup di sana sebagai
  // string kelas, dan bug pertama lolos justru karena hanya halaman dipindai.
  if (f.startsWith('src/pages/') || f.startsWith('src/lib/')) {
    for (const m of mentah.matchAll(new RegExp(WARNA_GELAP, 'g'))) {
      temuan.kontras.push(`${f}: ${m[0]}`)
    }
  }

  // 4. Teks Indonesia yang terlihat pengguna.
  if (!korpus) {
    for (const m of isi.matchAll(/'([^'\\\n]{8,})'|"([^"\\\n]{8,})"|>([^<>{}\n]{8,})</g)) {
      const t = (m[1] || m[2] || m[3] || '').trim()
      if (!t || !KATA_ID.test(t) || BUKAN_TEKS.test(t)) continue
      temuan.bahasa.push(`${f}: ${t.slice(0, 70)}`)
    }
  }
}

const bagian = [
  ['Campuran bahasa (Inggris menempel pada kata Indonesia)', temuan.campur, true],
  ['Identifier rusak akibat penggantian teks', temuan.ident, true],
  // TIDAK memblokir, dan itu keputusan sadar. Temuannya nyata — halaman
  // ber-slate hanya terbaca di tema gelap — tetapi jumlahnya ratusan dan
  // mendahului sesi ini. Memblokir di sini berarti seluruh repositori merah
  // sejak hari pertama, dan penjaga yang selalu merah berhenti dibaca.
  ['Warna teks tema gelap di halaman (hanya terbaca di mode gelap)', temuan.kontras, false],
  ['Teks Indonesia yang masih terlihat pengguna', temuan.bahasa, false],
]

let gagal = false
for (const [judul, daftar, memblokir] of bagian) {
  if (!daftar.length) { console.log(`✓ ${judul}: bersih`); continue }
  if (memblokir) gagal = true
  console.log(`\n${memblokir ? '✗' : '•'} ${judul}: ${daftar.length}`)
  const tampil = SEMUA ? daftar : daftar.slice(0, 12)
  for (const x of tampil) console.log('   ', x)
  if (!SEMUA && daftar.length > tampil.length) {
    console.log(`    … ${daftar.length - tampil.length} lagi (pakai --semua)`)
  }
}

// Teks Indonesia yang tersisa TIDAK memblokir: pekerjaan penerjemahan masih
// berjalan, dan penjaga yang selalu merah akan segera diabaikan orang. Yang
// memblokir hanya kerusakan — hal yang tidak boleh pernah bertambah.
console.log(`\nSisa penerjemahan: ${temuan.bahasa.length} (tidak memblokir)`)
process.exit(gagal ? 1 : 0)
