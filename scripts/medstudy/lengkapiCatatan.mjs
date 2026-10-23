// Sisipkan field pendalaman ke entri catatan penyakit yang SUDAH ADA.
//
// Menyisipkan, bukan menulis ulang. Entri yang ada sudah memuat definisi,
// diagnosis, tatalaksana, dan referensi yang tervalidasi; menulis ulang
// seluruhnya berarti mempertaruhkan isi yang sudah benar demi menambahkan
// yang belum ada. Yang disisipkan diletakkan tepat sebelum baris `referensi:`
// supaya urutan field tetap seragam di seluruh berkas.
//
// PENJAGAAN:
//   * Kunci yang tidak ditemukan dilaporkan, tidak didiamkan.
//   * Field yang SUDAH ADA pada entri itu tidak ditimpa — dilaporkan sebagai
//     dilewati, karena menimpa isi yang sudah ditulis orang lain diam-diam
//     adalah cara kehilangan pekerjaan tanpa jejak.
//   * Nilai yang memuat backtick ditolak; ia akan merusak literal.
import { readFileSync, writeFileSync } from 'node:fs'

const [berkas, dataPath] = process.argv.slice(2)
const data = JSON.parse(readFileSync(dataPath, 'utf8'))
let src = readFileSync(berkas, 'utf8')

/** Ubah nilai JS-literal menjadi teks TypeScript berindentasi 4 spasi. */
function tulisNilai(v, indent = 4) {
  const sp = ' '.repeat(indent)
  if (typeof v === 'string') return kutip(v)
  if (Array.isArray(v)) {
    return '[\n' + v.map((x) => sp + '  ' + kutip(x) + ',').join('\n') + '\n' + sp + ']'
  }
  // objek (anamnesis terstruktur)
  const isi = Object.entries(v).map(([k, x]) => sp + '  ' + k + ': ' + kutip(x) + ',')
  return '{\n' + isi.join('\n') + '\n' + sp + '}'
}

function kutip(s) {
  if (typeof s !== 'string') throw new Error('nilai bukan teks: ' + JSON.stringify(s))
  if (s.includes('`')) throw new Error('nilai memuat backtick: ' + s.slice(0, 60))
  // Kutip tunggal dipakai di seluruh berkas ini; apostrof di dalam teks
  // memakai tanda kutip tipografis supaya literalnya tidak tertutup lebih awal.
  return "'" + s.replace(/'/g, '’') + "'"
}

let diisi = 0, dilewat = 0
const hilang = []
for (const [kunci, field] of Object.entries(data)) {
  const awal = src.indexOf("\n  '" + kunci.replace(/'/g, "\\'") + "': {")
  if (awal === -1) { hilang.push(kunci); continue }
  // Batas entri: baris `referensi:` pertama sesudah awal.
  const ref = src.indexOf('\n    referensi:', awal)
  if (ref === -1) { hilang.push(kunci + ' (tanpa referensi)'); continue }
  const blok = src.slice(awal, ref)

  const baris = []
  for (const [nama, nilai] of Object.entries(field)) {
    if (new RegExp('^\\s{4}' + nama + ':', 'm').test(blok)) { dilewat++; continue }
    baris.push('    ' + nama + ': ' + tulisNilai(nilai) + ',')
    diisi++
  }
  if (!baris.length) continue
  src = src.slice(0, ref) + '\n' + baris.join('\n') + src.slice(ref)
}

writeFileSync(berkas, src)
console.log(`${diisi} field disisipkan, ${dilewat} dilewati (sudah ada)`)
if (hilang.length) {
  console.log(`KUNCI TIDAK DITEMUKAN (${hilang.length}):`)
  for (const h of hilang) console.log('  ·', h)
}
