// Mendaftar halaman yang MENAMPILKAN angka hasil hitungan sendiri tetapi tidak
// menyebut satu sumber pun.
//
// Yang dicari bukan "ada angka" — hampir semua halaman punya angka. Yang dicari
// adalah gabungan dua hal: koefisien yang ditulis langsung di dalam berkas
// (0,35 · 1,16 · dst) yang dipakai membentuk sebuah skor/usia/risiko, DAN
// tidak adanya penanda sumber (et al., doi, PMID, tahun terbitan) maupun
// keterangan bahwa bobotnya pilihan penulis.
//
// Skripnya bisa salah dalam dua arah, dan itu disengaja terbuka:
//  - halaman yang mengutip sumber di berkas lain akan tampak "tanpa sumber";
//  - halaman yang menyebut satu sumber untuk satu angka dianggap bersumber
//    untuk seluruh isinya.
// Karena itu keluarannya adalah DAFTAR PERIKSA, bukan vonis.

import { readdirSync, readFileSync } from 'node:fs'

const DIR = 'src/pages'
// Dua macam penanda dianggap cukup: KUTIPAN (nama penulis/tahun/lembaga
// pedoman) atau PENGAKUAN bahwa angkanya bukan hasil penelitian. Keduanya
// sama-sama membuat pembaca tahu sedang membaca apa; yang tidak boleh adalah
// diam.
const SUMBER = new RegExp(
  [
    'et al\\.|dkk\\.|doi|PMID|\\(19\\d\\d\\)|\\(20\\d\\d\\)',
    'KDIGO|ACSM|WHO|PSQI|Mifflin|Tanaka|Uth|Navy',
    'pilihan penulis|dipilih penulis|karangan penulis|buatan sendiri|sembarang',
    'bukan hasil penelitian|bukan ukuran terbitan|bukan pengukuran|aturan praktis',
    'not a medical|experimental|heuristic',
  ].join('|'),
  'i',
)
const HITUNGAN = /(skor|score|risiko|risk|usia|age|indeks|index|proyeksi)/i
const KOEFISIEN = /[^\w.]\d\.\d+\s*[*+]|[*]\s*\d\.\d+/

// Berkas yang koefisiennya bukan angka kesehatan (mis. tapis suara derau
// merah muda pada SleepToolkit) tetap muncul — itu batas skrip ini, bukan
// temuan. Dibiarkan tampil agar tidak ada yang disembunyikan diam-diam.
const hasil = []
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.tsx'))) {
  const t = readFileSync(`${DIR}/${f}`, 'utf8')
  if (SUMBER.test(t)) continue
  if (!KOEFISIEN.test(t)) continue
  if (!HITUNGAN.test(t)) continue
  hasil.push({ f, koefisien: (t.match(new RegExp(KOEFISIEN, 'g')) || []).length })
}
hasil.sort((a, b) => b.koefisien - a.koefisien)
for (const h of hasil) console.log(String(h.koefisien).padStart(4), h.f)
console.log(`\n${hasil.length} halaman menghitung sesuatu tanpa menyebut sumber.`)
console.log(
  'Sisa yang tetap muncul adalah batas skrip ini, bukan temuan: tetapan tapis',
  'suara (SleepToolkit) dan angka tata letak CSS (Beranda, TrainingPhysiology)',
  'bukan angka kesehatan.',
)
