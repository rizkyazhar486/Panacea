import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Gambar dan angka harus punya SATU sumber.
//
// Setiap panel di Body Exposure mengklaim hal yang sama, dengan kalimat yang
// hampir identik: "kurvanya ditarik oleh fungsi yang sama yang mencetak
// angkanya". Klaim itu benar sampai seseorang menuliskan ulang satu rumus
// secara inline untuk menggambar satu garis -- dan saat itu terjadi, TIDAK ADA
// UJI YANG GAGAL. Uji panelnya menguji PUSTAKANYA; gambarnya digambar oleh
// salinan kedua yang tidak pernah diperiksa siapa pun.
//
// Itu bukan kekhawatiran teoretis. Panel termoregulasi dikirim persis begitu
// dalam sesi ini: garis "panas yang harus dibuang" dihitung dengan menyusun
// ulang pertukaran keringnya di dalam komponen. Seluruh 237 berkas uji lulus.
//
// Satu-satunya cara menangkapnya adalah membaca SUMBER panelnya, dan itulah
// yang dilakukan berkas ini.
//
// ATURANNYA SENGAJA SEMPIT, supaya tidak ada yang tergoda melemahkannya:
// sebuah tetapan fisika boleh DITAMPILKAN dan boleh DIOPER sebagai argumen,
// tetapi tidak boleh menjadi operand perkalian atau pembagian kecuali operand
// lainnya adalah bilangan biasa. Menskalakan sumbu dengan 1.05 adalah tata
// letak; mengalikan satu tetapan dengan tetapan atau peubah lain adalah fisika,
// dan fisika tempatnya di pustaka.

const DIR = 'src/pages/bodyhub'

/** Awalan yang menandai tetapan fisika, bukan tetapan tata letak. */
const AWALAN = /^(TETAPAN|RUJUKAN|KONSTAN)/

const berkas = readdirSync(DIR).filter((f) => f.endsWith('.tsx')).sort()
assert.ok(berkas.length > 10, `hanya ${berkas.length} panel terbaca; pemindaiannya mungkin rusak`)

/** Operand di sebelah sebuah posisi: bilangan biasa, atau sesuatu yang lain. */
function bilanganBiasa(teks: string): boolean {
  return /^\s*\d+(\.\d+)?\s*$/.test(teks)
}

const pelanggaran: string[] = []
let diperiksa = 0

for (const f of berkas) {
  const isi = readFileSync(join(DIR, f), 'utf8')
  const baris = isi.split('\n')
  baris.forEach((ln, i) => {
    // Komentar tidak dieksekusi, jadi tidak bisa membuat gambar berbohong.
    if (/^\s*(\/\/|\*|\/\*)/.test(ln)) return
    const pola = /\b([A-Z][A-Z0-9_]{2,}\.[A-Za-z_][A-Za-z0-9_]*)/g
    for (const m of ln.matchAll(pola)) {
      if (!AWALAN.test(m[1])) continue
      diperiksa += 1
      const mulai = m.index ?? 0
      const selesai = mulai + m[1].length
      const sesudah = ln.slice(selesai)
      const sebelum = ln.slice(0, mulai)
      // Operand kanan: tetapan dikali/dibagi sesuatu.
      const kanan = /^\s*[*/]\s*([^,;)\]]+)/.exec(sesudah)
      if (kanan && !bilanganBiasa(kanan[1])) {
        pelanggaran.push(`${f}:${i + 1}  ${m[1]} ${kanan[0].trim().slice(0, 40)}`)
        continue
      }
      // Operand kiri: sesuatu dikali/dibagi tetapan.
      const kiri = /([^,;(\[]+)\s*[*/]\s*$/.exec(sebelum)
      if (kiri && !bilanganBiasa(kiri[1])) {
        pelanggaran.push(`${f}:${i + 1}  ${kiri[0].trim().slice(-40)} ${m[1]}`)
      }
    }
  })
}

assert.ok(diperiksa > 0, 'tidak ada tetapan fisika terbaca di panel mana pun; polanya mungkin rusak')

assert.deepEqual(
  pelanggaran, [],
  'a panel performs arithmetic on a physics constant, which means the picture is drawn by a ' +
  'SECOND copy of the equation and can disagree with the numbers beside it while every test ' +
  `passes:\n  ${pelanggaran.join('\n  ')}\n` +
  'Move the computation into the library and read the result, as every other panel does.',
)

console.log(
  `OK panel-tanpa-fisika-ganda: ${berkas.length} panel dipindai, ${diperiksa} rujukan tetapan fisika ` +
  'diperiksa, dan tidak satu pun dipakai dalam aritmetika -- jadi setiap kurva masih ditarik oleh ' +
  'fungsi yang sama yang mencetak angkanya.',
)
