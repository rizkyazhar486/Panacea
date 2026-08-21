// Mencari nama kasus di REKAP UJIAN yang mengandung kata tertentu.
//
// UNTUK APA. Catatan stasiun hanya muncul di layar bila nama kasus di rekap
// TEPAT SAMA dengan kunci catatannya, atau ada barisnya di tabel alias. Menulis
// catatan yang lengkap tanpa aliasnya menghasilkan catatan yang ada di dalam
// berkas dan tidak pernah terbaca siapa pun — kegagalan yang tidak muncul pada
// angka mana pun, dan yang sudah berkali-kali terjadi di sini.
//
// Skrip ini TIDAK membuat alias secara otomatis, dan itu disengaja. Pencocokan
// longgar pernah menautkan 'Anemia def besi' ke 'Anemia APLASTIK' dan 'BLS
// dewasa' ke 'Anisometropia pada DEWASA'. Yang dikerjakannya hanya menampilkan
// calon, supaya tiap barisnya dipilih dengan mata sebelum ditulis ke tabel.
//
// Dijalankan: node scripts/cariKasusRekap.mjs <kata> [kata lain...]
import { execFileSync } from 'node:child_process'

const kata = process.argv.slice(2).map((k) => k.toLowerCase())
if (!kata.length) {
  console.error('pakai: node scripts/cariKasusRekap.mjs <kata> [kata lain...]')
  process.exit(1)
}

const keluar = execFileSync('npx', ['tsx', '-e', `
  import { hitungKasus } from './src/lib/analisisOsce'
  console.log(JSON.stringify(hitungKasus().map((k) => ({ n: k.label, f: k.jumlah }))))
`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

const kasus = JSON.parse(keluar.trim())
for (const k of kata) {
  const cocok = kasus.filter((x) => String(x.n).toLowerCase().includes(k))
  console.log(`\n── "${k}" — ${cocok.length} kasus`)
  for (const c of cocok.sort((a, b) => b.f - a.f)) console.log(`  ${String(c.f).padStart(3)}x  ${c.n}`)
}
