// Buat entri catatan penyakit BARU dari berkas JSON.
//
// Berbeda dari lengkapiCatatan.mjs yang menyisipkan field ke entri yang sudah
// ada, skrip ini menambahkan entri yang sebelumnya tidak ada sama sekali.
//
// PENJAGAAN:
//   * Kunci yang SUDAH ADA ditolak, tidak ditimpa — menimpa entri tervalidasi
//     diam-diam adalah cara kehilangan pekerjaan tanpa jejak.
//   * Nilai yang memuat backtick ditolak; ia merusak literal.
//   * Apostrof lurus diubah menjadi apostrof tipografis, karena apostrof lurus
//     di dalam literal berkutip tunggal menutup literalnya lebih awal dan
//     merusak seluruh berkas.
//   * Setiap entri wajib punya definisi, tatalaksana, referensi, dan salah
//     satu dari diagnosis atau goldStandard — sama dengan yang dipaksa tipe.
import { readFileSync, writeFileSync } from 'node:fs'

const [berkas, dataPath] = process.argv.slice(2)
const data = JSON.parse(readFileSync(dataPath, 'utf8'))
let src = readFileSync(berkas, 'utf8')

const kutip = (s) => {
  if (typeof s !== 'string') throw new Error('nilai bukan teks: ' + JSON.stringify(s))
  if (s.includes('`')) throw new Error('nilai memuat backtick: ' + s.slice(0, 60))
  return "'" + s.replace(/'/g, '’') + "'"
}

const nilai = (v, ind) => {
  const sp = ' '.repeat(ind)
  if (typeof v === 'string') return kutip(v)
  if (Array.isArray(v)) return '[\n' + v.map((x) => sp + '  ' + kutip(x) + ',').join('\n') + '\n' + sp + ']'
  return '{\n' + Object.entries(v).map(([k, x]) => sp + '  ' + k + ': ' + kutip(x) + ',').join('\n') + '\n' + sp + '}'
}

const tutup = src.lastIndexOf('\n}\n')
if (tutup === -1) throw new Error('tidak menemukan penutup objek')

const blok = []
for (const [kunci, isi] of Object.entries(data)) {
  if (src.includes("\n  '" + kunci + "': {")) throw new Error('kunci sudah ada: ' + kunci)
  for (const w of ['definisi', 'tatalaksana', 'referensi']) {
    if (!isi[w]) throw new Error(kunci + ': field wajib hilang — ' + w)
  }
  if (!isi.diagnosis && !isi.goldStandard) throw new Error(kunci + ': perlu diagnosis atau goldStandard')
  const baris = Object.entries(isi).map(([k, v]) => '    ' + k + ': ' + nilai(v, 4) + ',')
  blok.push('  ' + kutip(kunci) + ': {\n' + baris.join('\n') + '\n  },')
}

src = src.slice(0, tutup) + '\n' + blok.join('\n') + src.slice(tutup)
writeFileSync(berkas, src)
console.log('entri baru:', Object.keys(data).length)
