// Alpha E3: setiap rute yang MENGUBAH data klinis harus mencatat pelaku + waktu (addAudit).
// Uji statis atas index.ts — murah, deterministik, tanpa jaringan/jam nyata.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const POLA_KLINIS = /^app\.(post|put|patch|delete)\('(\/api\/clinical(?!-calculators)[^']*)'/

export function rutePerubahanKlinisTanpaAudit(sumber: string): string[] {
  const baris = sumber.split('\n')
  const mulai = baris.flatMap((l, i) => (l.startsWith('app.') ? [i] : []))
  const hilang: string[] = []
  for (const i of mulai) {
    const m = POLA_KLINIS.exec(baris[i])
    if (!m) continue
    const berikut = mulai.find((j) => j > i) ?? baris.length
    const badan = baris.slice(i, berikut).join('\n')
    if (!/addAudit\(/.test(badan)) hilang.push(`${m[1].toUpperCase()} ${m[2]}`)
  }
  return hilang
}

// Negatif: handler tanpa addAudit terdeteksi; bacaan GET dan kalkulator tidak dihitung.
const sintetis = [
  "app.post('/api/clinical/vital', requireAuth, (req, res) => {", '  addVital(x)', '})',
  "app.post('/api/clinical/record', requireAuth, (req, res) => {", "  addAudit(u, 'emr.save', p)", '})',
  "app.get('/api/clinical', requireAuth, (req, res) => {", '})',
  "app.post('/api/clinical-calculators/unlock-pnc', requireAuth, (req, res) => {", '})',
].join('\n')
assert.deepEqual(rutePerubahanKlinisTanpaAudit(sintetis), ['POST /api/clinical/vital'])
// Positif: rute nyata.
const nyata = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
assert.ok((nyata.match(/^app\.(post|put|patch|delete)\('\/api\/clinical(?!-calculators)/gm) ?? []).length >= 9, 'pola rute klinis tidak lagi cocok dengan index.ts')
assert.deepEqual(rutePerubahanKlinisTanpaAudit(nyata), [], 'rute perubahan klinis tanpa audit trail')
for (const aksi of ['clinical.education.save', 'clinical.vital.add', 'clinical.supportive.add', 'clinical.patient.create']) {
  assert.ok(nyata.includes(`'${aksi}'`), `aksi audit hilang: ${aksi}`)
}
console.log('auditKlinis: semua rute perubahan klinis mencatat audit; deteksi tanpa-audit terbukti')
