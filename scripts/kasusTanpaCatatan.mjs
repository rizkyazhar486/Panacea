// Kasus rekap yang BELUM PUNYA CATATAN, diurutkan menurut SEBERAPA SERING
// ia keluar — bukan menurut abjad.
//
// MENGAPA BUKAN ABJAD. kasusSekali.mjs sengaja hanya menghitung kasus yang
// muncul SATU KALI, dan mencetak "30 teratas" menurut urutan abjad. Akibatnya
// daftar yang muncul selalu dimulai dari 'Abses', 'Acne', 'Akne' — dan kasus
// yang keluar EMPAT KALI dalam sepuluh tahun tidak pernah terlihat sama sekali
// karena tidak masuk saringan "sekali muncul". Menjelang ujian, urutan
// pengerjaan ditentukan oleh seberapa sering sebuah kasus keluar, dan daftar
// menurut abjad justru menyembunyikan pekerjaan yang paling menentukan.
//
// Skrip ini memakai penyeragaman ejaan dan tabel padanan yang SAMA dengan
// kasusSekali.mjs, supaya kedua angkanya dapat dibandingkan.
//
// Dijalankan: node scripts/kasusTanpaCatatan.mjs [jumlah]

import { kunciCatatan, bukanKasus, semuaKasus } from './lib/catatanRekap.mjs'

const kasus = semuaKasus()
const belum = []
let dibuang = 0
for (const k of kasus) {
  if (bukanKasus(k.label)) { dibuang++; continue }
  if (kunciCatatan(k.label, k.kunci) === null) belum.push(k)
}
belum.sort((a, b) => b.jumlah - a.jumlah || a.label.localeCompare(b.label))

const batas = Number(process.argv[2] ?? 60)
console.log(`kasus rekap seluruhnya   : ${kasus.length}`)
console.log(`  bukan kasus (dibuang)  : ${dibuang}`)
console.log(`belum ada catatannya     : ${belum.length}`)
console.log(`  di antaranya muncul >=2x: ${belum.filter((k) => k.jumlah >= 2).length}`)
console.log(`\n── ${Math.min(batas, belum.length)} teratas menurut SERINGNYA, bukan abjad ──`)
for (const k of belum.slice(0, batas)) {
  console.log(`  ${String(k.jumlah).padStart(3)}x  ${k.label.slice(0, 58).padEnd(58)} ${k.sistem ?? ''}`)
}
