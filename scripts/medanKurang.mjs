// Medan yang belum terisi pada catatan tertentu.
//
// Dipakai sewaktu melengkapi catatan: menyebut "3/8" saja tidak memberi tahu
// LIMA yang mana yang kurang, dan menebaknya berarti menulis ulang bagian yang
// sudah ada — yang pernah terjadi di sini dan melahirkan satu catatan kembar
// sepanjang delapan ribu huruf.
//
// Dijalankan: node scripts/medanKurang.mjs [kata kunci]
import { readFileSync } from 'node:fs'

const FIELD = ['definisi', 'etiologi', 'patofisiologi', 'anamnesis', 'pemeriksaanFisik', 'penunjang', 'diagnosisBanding', 'tatalaksana']
const SETARA = { patofisiologi: ['patofisiologi', 'rantai'] }

function blokDari(teks, awalan = '') {
  const out = {}
  const idx = []
  const re = /^  '((?:[^'\\]|\\.)*)':\s*\{$/gm
  let m
  while ((m = re.exec(teks))) idx.push({ key: m[1].replace(/\\'/g, "'"), start: m.index })
  idx.forEach((x, i) => { out[awalan + x.key] = teks.slice(x.start, i + 1 < idx.length ? idx[i + 1].start : teks.length) })
  return out
}

const blok = {
  ...blokDari(readFileSync('src/lib/skdiDiseaseNotes.ts', 'utf8')),
  ...blokDari(readFileSync('src/lib/osceStationNotes.ts', 'utf8'), 'OSCE::'),
}

const q = (process.argv[2] ?? '').toLowerCase()
for (const [nama, b] of Object.entries(blok)) {
  if (q && !nama.toLowerCase().includes(q)) continue
  const kurang = FIELD.filter((f) => !(SETARA[f] ?? [f]).some((n) => new RegExp('^\\s{4}' + n + ':', 'm').test(b)))
  if (!kurang.length) continue
  console.log(`${8 - kurang.length}/8  ${nama}`)
  console.log(`     kurang: ${kurang.join(', ')}`)
}
