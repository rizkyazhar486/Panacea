import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validatePlayerEntry, PLAYER_BOUNDS, type PlayerEntryText } from '../../src/domains/sports-roster/index.ts'

const fields = [{ key: 'goalsPer90', label: 'Goals per 90 minutes' }, { key: 'passAccuracy', label: 'Pass accuracy (%)' }]
const base: PlayerEntryText = { name: ' Rafi ', position: ' ', age: '25', played: '20', missed: '2', minutes: '80', metrics: { goalsPer90: '0.5', passAccuracy: '88' } }
const run = (patch: Partial<PlayerEntryText>) => validatePlayerEntry({ ...base, ...patch }, fields)
const bad = (patch: Partial<PlayerEntryText>) => { const r = run(patch); assert.equal(r.ok, false, JSON.stringify(patch)); return r.ok ? ({} as Record<string, string>) : r.problems }

// Positif: nilai persis, nama/posisi dirapikan, posisi kosong → tanda hubung.
assert.deepEqual(run({}), { ok: true, value: { name: 'Rafi', position: '—', ageYears: 25, matchesPlayed: 20, matchesMissed: 2, minutesPerMatch: 80, metrics: { goalsPer90: 0.5, passAccuracy: 88 } } })
// Determinisme.
assert.deepEqual(run({}), run({}))

// Batas berpasangan: tepat di batas diterima, satu langkah di luar ditolak dengan pesan kolom itu saja.
const edge = (k: 'age' | 'played' | 'missed' | 'minutes', b: { min: number; max: number }) => {
  for (const v of [b.min, b.max]) assert.equal(run({ [k]: String(v) }).ok, true, `${k}=${v}`)
  for (const v of [b.min - 1, b.max + 1]) assert.deepEqual(Object.keys(bad({ [k]: String(v) })), [k], `${k}=${v}`)
}
edge('age', PLAYER_BOUNDS.ageYears); edge('played', PLAYER_BOUNDS.matchesPlayed)
edge('missed', PLAYER_BOUNDS.matchesMissed); edge('minutes', PLAYER_BOUNDS.minutesPerMatch)
// Metrik: persen 0–100, lainnya 0–1000, ±langkah.
assert.equal(run({ metrics: { goalsPer90: '0', passAccuracy: '100' } }).ok, true)
assert.equal(run({ metrics: { goalsPer90: '1000', passAccuracy: '0' } }).ok, true)
assert.deepEqual(Object.keys(bad({ metrics: { goalsPer90: '0.5', passAccuracy: '100.01' } })), ['metric:passAccuracy'])
assert.deepEqual(Object.keys(bad({ metrics: { goalsPer90: '1000.01', passAccuracy: '88' } })), ['metric:goalsPer90'])
assert.deepEqual(Object.keys(bad({ metrics: { goalsPer90: '-0.01', passAccuracy: '88' } })), ['metric:goalsPer90'])

// Negatif: kosong/spasi/bukan angka/NaN/Infinity/pecahan ditolak dengan alasan eksak, tanpa nilai tebakan.
assert.deepEqual(bad({ age: '' }), { age: 'Age: enter a number' })
assert.deepEqual(bad({ played: '   ' }), { played: 'Matches played: enter a number' })
assert.deepEqual(bad({ missed: 'abc' }), { missed: 'Matches missed: enter a number' })
assert.deepEqual(bad({ minutes: 'Infinity' }), { minutes: 'Minutes per match: enter a number' })
assert.deepEqual(bad({ age: 'NaN' }), { age: 'Age: enter a number' })
assert.deepEqual(bad({ age: '25.5' }), { age: 'Age: whole number only' })
assert.deepEqual(bad({ played: '0' }), { played: 'Matches played: 1–200' })
assert.deepEqual(bad({ name: '   ' }), { name: 'Name: required' })
assert.deepEqual(bad({ metrics: { goalsPer90: '', passAccuracy: '88' } }), { 'metric:goalsPer90': 'Goals per 90 minutes: enter a number' })
assert.deepEqual(bad({ metrics: {} }), { 'metric:goalsPer90': 'Goals per 90 minutes: enter a number', 'metric:passAccuracy': 'Pass accuracy (%): enter a number' })
// Banyak masalah dikumpulkan sekaligus, dan tidak ada `value` yang bocor.
const banyak = validatePlayerEntry({ ...base, name: '', age: '', played: '-3' }, fields)
assert.equal(banyak.ok, false); assert.deepEqual(Object.keys(banyak.ok ? {} : banyak.problems).sort(), ['age', 'name', 'played'])
assert.equal('value' in (banyak as object), false)
// Tipe salah (data tak tepercaya) ditolak, tidak melempar.
assert.equal(validatePlayerEntry({ ...base, age: 25 as unknown as string }, fields).ok, false)
assert.equal(validatePlayerEntry({ ...base, metrics: undefined as unknown as Record<string, string> }, fields).ok, false)

// Regresi: bentuk lama `Number(x) || 0` menyimpan pemain 0 tahun / 0 pertandingan / statistik negatif.
assert.equal(Number('') || 0, 0); assert.equal(Number('-5') || 0, -5)
assert.equal(run({ age: '', played: '' }).ok, false)
assert.equal(run({ metrics: { goalsPer90: '-5', passAccuracy: '88' } }).ok, false)

// Wiring halaman: memakai validator domain lewat index, tidak ada lagi `|| 0`, tombol tak menyimpan saat tak sah.
const halaman = readFileSync(new URL('../../src/pages/SportsLab.tsx', import.meta.url), 'utf8')
assert.match(halaman, /from '\.\.\/domains\/sports-roster'/, 'SportsLab harus memakai domain sports-roster lewat index')
assert.match(halaman, /validatePlayerEntry\(/)
assert.doesNotMatch(halaman, /Number\((age|played|missed|minutes|metrics\[[^\]]*\] \?\? '')\) \|\| 0/, 'bentuk lama Number(x) || 0 kembali di form Add player')
assert.match(halaman, /if \(!r\.ok\) \{ setProblems\(r\.problems\); return \}/, 'submit harus berhenti bila tidak sah')
assert.match(halaman, /useState\(''\)[\s\S]{0,40}setPlayed|const \[played, setPlayed\] = useState\(''\)/, 'kolom harus dimulai kosong')
console.log('sports-roster-entry: ok')
