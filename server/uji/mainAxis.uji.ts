// Uji sumbu serat.
//
// Arah serat yang salah tidak pernah muncul sebagai galat: teksturnya tetap
// tergambar, hanya saja melintang alih-alih membujur — dan otot yang bergaris
// melintang terlihat seperti kain, bukan seperti otot. Karena itu arahnya
// dihitung, bukan ditebak, dan perhitungannya diuji.

import { sumbuUtama, kelonjongan, type Kotak } from '../../src/lib/mainAxis'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}
const kotak = (dx: number, dy: number, dz: number): Kotak =>
  ({ min: [0, 0, 0], maks: [dx, dy, dz] })

// ── Sumbu terpanjang ────────────────────────────────────────────────────────
ok('struktur memanjang ke atas berserat vertikal',
  sumbuUtama(kotak(1, 8, 1)).join(',') === '0,1,0')
ok('struktur memanjang ke samping berserat mendatar',
  sumbuUtama(kotak(8, 1, 1)).join(',') === '1,0,0')
ok('struktur memanjang ke depan-belakang',
  sumbuUtama(kotak(1, 1, 8)).join(',') === '0,0,1')
ok('hasilnya vektor satuan', (() => {
  const v = sumbuUtama(kotak(3, 9, 2))
  return Math.abs(Math.hypot(v[0], v[1], v[2]) - 1) < 1e-9
})())
// Otot paha membujur; kalau sumbunya tertukar, seratnya melintang paha.
ok('kotak mirip femur menunjuk membujur',
  sumbuUtama({ min: [-0.06, 0.2, -0.06], maks: [0.06, 0.65, 0.06] }).join(',') === '0,1,0')

// Kotak rusak tidak boleh menghasilkan vektor nol: basis di shader akan
// runtuh dan teksturnya lenyap sama sekali, tanpa satu pun tanda galat.
ok('kotak berukuran nol tetap memberi sumbu sah',
  sumbuUtama(kotak(0, 0, 0)).join(',') === '0,1,0')
ok('kotak dengan nilai tak hingga tetap memberi sumbu sah',
  sumbuUtama({ min: [0, 0, 0], maks: [NaN, NaN, NaN] }).join(',') === '0,1,0')
ok('kotak terbalik tidak menghasilkan vektor nol', (() => {
  const v = sumbuUtama({ min: [1, 1, 1], maks: [0, 0, 0] })
  return Math.hypot(v[0], v[1], v[2]) === 1
})())

// ── Kelonjongan ─────────────────────────────────────────────────────────────
ok('kubus tidak punya arah serat', kelonjongan(kotak(1, 1, 1)) === 0)
ok('hampir kubus hampir tidak diputar', kelonjongan(kotak(1.1, 1, 1)) < 0.05)
// Otot panjang harus diputar penuh; setengah-setengah menghasilkan pola yang
// tidak berserat maupun teranyam, yaitu yang terburuk dari keduanya.
ok('struktur sangat memanjang diputar penuh', kelonjongan(kotak(1, 6, 1)) === 1)
ok('struktur sedang berada di antaranya', (() => {
  const k = kelonjongan(kotak(1, 2, 1))
  return k > 0 && k < 1
})())
ok('kelonjongan selalu di antara 0 dan 1',
  [[1,1,1],[9,1,1],[1,1,0.001],[2,3,4]].every(([a,b,c]) => {
    const k = kelonjongan(kotak(a, b, c))
    return k >= 0 && k <= 1
  }))
ok('kelonjongan naik bersama perbandingan sisinya',
  kelonjongan(kotak(1, 4, 1)) > kelonjongan(kotak(1, 2, 1)))
// Pipih seperti lembaran (aponeurosis) tetap punya arah, dan arahnya sisi
// terpanjangnya.
ok('lembaran pipih tetap punya arah', kelonjongan(kotak(6, 3, 0.1)) > 0)
ok('ukuran nol tidak membuat pembagian nol',
  Number.isFinite(kelonjongan(kotak(0, 0, 0))) && kelonjongan(kotak(0, 0, 0)) === 0)
ok('satu sisi saja tidak cukup untuk menilai bentuk',
  kelonjongan({ min: [0, 0, 0], maks: [5, 0, 0] }) === 0)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
