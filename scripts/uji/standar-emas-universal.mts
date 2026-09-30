// Standar emas universal: tidak boleh ada organ yang disebut "gold standard" modul.
// Istilah diagnostik "gold standard" (uji rujukan penyakit) tetap sah dan tidak disentuh.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ORGAN = 'eye|eyes|mata|heart|jantung|brain|otak|lung|lungs|paru|kidney|ginjal|liver|hati|skin|kulit|bone|tulang|spine|ear|telinga'
const LARANG = new RegExp(`\\b(${ORGAN})[\\s_-]*gold[\\s_-]*standard\\b|goldStandard(Eye|Heart|Brain|Lung|Mata|Jantung)`, 'i')
// Kalimat yang MENOLAK konsep itu boleh menyebut namanya.
const PENOLAKAN = /no privileged|conflicts with|never|reintroduc|no organ|tidak ada organ|not .*special/i

export function temukanPelanggaran(teks: string, nama: string): string[] {
  return teks.split('\n').flatMap((b, i) => (LARANG.test(b) && !PENOLAKAN.test(b) ? [`${nama}:${i + 1}: ${b.trim().slice(0, 120)}`] : []))
}

// Uji detektor dulu (sabotase bawaan): harus menangkap dan harus melepas penolakan.
assert.equal(temukanPelanggaran('/** Eye Gold Standard physiology core. */', 'x').length, 1)
assert.equal(temukanPelanggaran('const goldStandardHeart = 1', 'x').length, 1)
assert.equal(temukanPelanggaran('There is no privileged "Eye Gold Standard."', 'x').length, 0)
assert.equal(temukanPelanggaran('goldStandard: "biopsi hati"', 'x').length, 0, 'istilah diagnostik harus lolos')

const akar = ['src', 'docs', 'DOCS', 'scripts', 'governance'].filter((d) => existsSync(d))
const berkas: string[] = ['CLAUDE.md', 'AGENTS.md'].filter((f) => existsSync(f))
const jalan = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (n === 'node_modules' || n.startsWith('.')) continue; const s = statSync(p); if (s.isDirectory()) jalan(p); else if (/\.(ts|tsx|md|mts|mjs|ya?ml)$/.test(n) && !p.endsWith('standar-emas-universal.mts')) berkas.push(p) } }
akar.forEach(jalan)
const pelanggaran = berkas.flatMap((f) => temukanPelanggaran(readFileSync(f, 'utf8'), f))
assert.deepEqual(pelanggaran, [], `penamaan standar emas per-organ muncul lagi:\n${pelanggaran.join('\n')}`)
assert.ok(existsSync('docs/body-exposure/HUMAN_DIGITAL_TWIN_GOLD_STANDARD.md'), 'dokumen sumber kebenaran hilang')
console.log(`standar-emas-universal: lulus (${berkas.length} berkas)`)
