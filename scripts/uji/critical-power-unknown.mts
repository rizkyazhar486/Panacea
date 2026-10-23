// C2: potensi daya kritis tanpa jawaban bukan "0 W".
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { criticalPower2Point: cp } = await import('../../src/pages/fitness/criticalPower.ts')
assert.ok(Math.abs(cp(320, 180, 250, 720) - 226.6667) < 1e-3, 'nilai bawaan')
assert.ok(Math.abs(cp(250, 720, 320, 180) - 226.6667) < 1e-3, 'simetris terhadap urutan tes')
for (const [name, args] of Object.entries({
  'waktu sama': [320, 180, 250, 180], 'waktu kosong': [320, 0, 250, 0], 'daya kosong': [0, 180, 250, 720],
  'NaN': [NaN, 180, 250, 720], 'Infinity': [Infinity, 180, 250, 720], 'negatif': [320, -180, 250, 720],
  'CP negatif': [400, 180, 50, 720],
}) as [string, number[]][]) assert.ok(Number.isNaN(cp(args[0], args[1], args[2], args[3])), `${name}: bukan angka, bukan 0`)
const page = readFileSync('src/pages/fitness/PerformanceLab.tsx', 'utf8')
assert.match(page, /criticalPower2Point\(v\.p1, v\.t1, v\.p2, v\.t2\)/); assert.doesNotMatch(page, /Number\.isFinite\(cp\) \? cp : 0/)
console.log('critical-power-unknown: ok')
