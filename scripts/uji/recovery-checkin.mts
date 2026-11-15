// Check-in tidur satu ketukan di Layar Sederhana: menulis HANYA `sleepQ` ke catatan Readiness yang sudah ada.
// Positif, negatif (fail-closed bernama), batas, berpasangan, tanpa efek samping, determinisme, adaptor, render nyata.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { isCalendarDay, isSleepQuality, READINESS_STORAGE_KEY, readSleepQuality, recordSleepQuality } from '../../src/domains/recovery-checkin/engine/readinessRecord.ts'
import { SLEEP_FACES } from '../../src/domains/recovery-checkin/model/types.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const HARI = '2026-11-09'

// ── kontrak kunci: harus SAMA dengan yang dipakai halaman Readiness (satu penyimpanan, bukan dua) ──
gagal('kunci-sama-dengan-halaman-readiness', () => {
  assert.equal(READINESS_STORAGE_KEY, 'pmd_readiness_v1')
  assert.match(readFileSync('src/pages/bodyhub/Readiness.tsx', 'utf8'), /const KEY = 'pmd_readiness_v1'/)
})

// ── nilai sah: tepat 1..5 bilangan bulat ──
for (const q of [1, 2, 3, 4, 5]) gagal(`kualitas-sah:${q}`, () => assert.equal(isSleepQuality(q), true))
for (const q of [0, 6, -1, 2.5, Number.NaN, Infinity, '3', null, undefined, true, {}, [3]])
  gagal(`kualitas-ditolak:${String(q)}`, () => assert.equal(isSleepQuality(q), false))
gagal('batas-bawah-dan-atas', () => { assert.equal(isSleepQuality(1), true); assert.equal(isSleepQuality(0), false); assert.equal(isSleepQuality(5), true); assert.equal(isSleepQuality(6), false) })
gagal('wajah-1-sampai-5-berurutan', () => { assert.deepEqual(SLEEP_FACES.map((f) => f.value), [1, 2, 3, 4, 5]); assert.equal(new Set(SLEEP_FACES.map((f) => f.face)).size, 5) })

// ── tanggal ──
gagal('tanggal-sah', () => { assert.equal(isCalendarDay('2026-11-09'), true); assert.equal(isCalendarDay('2028-02-29'), true) })
for (const d of ['2026-02-30', '2026-13-01', '2026-11-9', '', 'x', null, undefined, 20261109, '2027-02-29']) gagal(`tanggal-ditolak:${String(d)}`, () => assert.equal(isCalendarDay(d), false))

// ── menulis: positif ──
gagal('tulis-ke-penyimpanan-kosong', () => {
  for (const raw of [null, '']) { const r = recordSleepQuality(raw, HARI, 4); assert.ok(r.ok); assert.deepEqual(JSON.parse(r.ok ? r.json : '{}'), { [HARI]: { behaviors: [], workouts: [], sleepQ: 4 } }) }
})
// ── menulis: semua isian lain TIDAK berubah (inti kontrak) ──
const KAYA = { [HARI]: { hrv: 65, rhr: 58, sleepH: 7.5, sleepQ: 2, behaviors: ['alcohol'], workouts: [{ rpe: 6, min: 45 }], catatanAsing: 'x' }, '2026-11-08': { hrv: 60, sleepQ: 3, behaviors: [], workouts: [] } }
gagal('mempertahankan-isian-lain-dan-hari-lain', () => {
  const r = recordSleepQuality(JSON.stringify(KAYA), HARI, 5); assert.ok(r.ok)
  const baru = JSON.parse(r.ok ? r.json : '{}')
  assert.deepEqual(baru[HARI], { ...KAYA[HARI], sleepQ: 5 })
  assert.deepEqual(baru['2026-11-08'], KAYA['2026-11-08'])
})
gagal('hari-baru-tidak-menyentuh-hari-lain', () => {
  const r = recordSleepQuality(JSON.stringify(KAYA), '2026-11-10', 1); assert.ok(r.ok)
  const baru = JSON.parse(r.ok ? r.json : '{}')
  assert.deepEqual(baru[HARI], KAYA[HARI]); assert.deepEqual(baru['2026-11-10'], { behaviors: [], workouts: [], sleepQ: 1 })
})
gagal('mengganti-nilai-hari-yang-sama', () => { const a = recordSleepQuality(null, HARI, 2); assert.ok(a.ok); const b = recordSleepQuality(a.ok ? a.json : null, HARI, 5); assert.ok(b.ok); assert.equal(readSleepQuality(b.ok ? b.json : null, HARI), 5) })
// ── menulis: negatif, bernama, dan tanpa efek samping ──
gagal('kualitas-buruk-ditolak-bernama', () => { for (const q of [0, 6, 2.5, Number.NaN, '3', null]) assert.deepEqual(recordSleepQuality('{}', HARI, q), { ok: false, reason: 'bad-quality' }) })
gagal('tanggal-buruk-ditolak-bernama', () => { for (const d of ['2026-02-30', '', null, 5]) assert.deepEqual(recordSleepQuality('{}', d, 3), { ok: false, reason: 'bad-date' }) })
for (const rusak of ['{', 'null', '[]', '"teks"', '12', 'true', '{"a":'])
  gagal(`data-rusak-tidak-ditimpa:${rusak}`, () => assert.deepEqual(recordSleepQuality(rusak, HARI, 3), { ok: false, reason: 'store-unreadable' }))
// berpasangan: hanya keadaan data yang berbeda -> yang sah diterima
gagal('berpasangan-data-sah-diterima', () => { assert.ok(recordSleepQuality('{}', HARI, 3).ok); assert.ok(recordSleepQuality('{"2026-11-08":{}}', HARI, 3).ok) })
gagal('masukan-tidak-diubah', () => { const raw = JSON.stringify(KAYA); const salinan = raw; recordSleepQuality(raw, HARI, 1); assert.equal(raw, salinan) })
gagal('deterministik', () => { const raw = JSON.stringify(KAYA); assert.deepEqual(recordSleepQuality(raw, HARI, 4), recordSleepQuality(raw, HARI, 4)) })
// satu hari yang barisnya bukan objek (rusak) diganti baris sah, hari lain tetap
gagal('baris-hari-rusak-diganti-hari-lain-utuh', () => {
  const r = recordSleepQuality(JSON.stringify({ [HARI]: 'x', '2026-11-08': { hrv: 60 } }), HARI, 3); assert.ok(r.ok)
  const baru = JSON.parse(r.ok ? r.json : '{}'); assert.deepEqual(baru[HARI], { behaviors: [], workouts: [], sleepQ: 3 }); assert.deepEqual(baru['2026-11-08'], { hrv: 60 })
})

// ── membaca: kosong bukan nol ──
gagal('baca-nilai', () => assert.equal(readSleepQuality(JSON.stringify(KAYA), HARI), 2))
for (const [nama, raw] of [['null', null], ['kosong', ''], ['rusak', '{'], ['bukan-objek', '[]'], ['tanpa-hari', '{}'], ['tanpa-sleepQ', JSON.stringify({ [HARI]: { hrv: 1 } })], ['nol', JSON.stringify({ [HARI]: { sleepQ: 0 } })], ['enam', JSON.stringify({ [HARI]: { sleepQ: 6 } })], ['teks', JSON.stringify({ [HARI]: { sleepQ: '3' } })]] as const)
  gagal(`baca-kosong-bukan-nol:${nama}`, () => assert.equal(readSleepQuality(raw, HARI), null))
gagal('baca-tanggal-buruk', () => assert.equal(readSleepQuality(JSON.stringify(KAYA), '2026-02-30'), null))

// ── adaptor + render nyata (localStorage tiruan) ──
const mem = new Map<string, string>(); let tolakTulis = false; let bacaMelempar = false
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => { if (bacaMelempar) throw new Error('baca ditolak'); return mem.get(k) ?? null },
  setItem: (k: string, v: string) => { if (tolakTulis) throw new Error('tulis ditolak'); mem.set(k, String(v)) },
  removeItem: (k: string) => { mem.delete(k) }, clear: () => mem.clear(), key: () => null, length: 0,
} as Storage
const { build } = await import('esbuild')
const { writeFileSync, mkdirSync } = await import('node:fs')
const { pathToFileURL } = await import('node:url')
const { resolve } = await import('node:path')
const out = await build({
  stdin: { contents: "export { SleepCheckin } from './src/domains/recovery-checkin/ui/SleepCheckin.tsx'; export * from './src/domains/recovery-checkin/adapters/readinessStorage.ts'; export { MemoryRouter } from 'react-router-dom'", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-dom'], loader: { '.css': 'empty' }, logLevel: 'silent',
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/recovery-checkin.uji.mjs', out.outputFiles[0].text)
const m = await import(pathToFileURL(resolve('node_modules/.cache/recovery-checkin.uji.mjs')).href)
const hariIni = (await import('../../src/lib/tanggal.ts')).hariIni()
const render = () => renderToStaticMarkup(createElement(m.MemoryRouter, null, createElement(m.SleepCheckin)))
const reset = () => { mem.clear(); tolakTulis = false; bacaMelempar = false }

gagal('adaptor-simpan-dan-baca', () => { reset(); assert.equal(m.readTodaySleepQuality(), null); assert.equal(m.saveTodaySleepQuality(4), true); assert.equal(m.readTodaySleepQuality(), 4); assert.equal(JSON.parse(mem.get('pmd_readiness_v1') ?? '{}')[hariIni].sleepQ, 4) })
gagal('adaptor-mempertahankan-isian-lain', () => { reset(); mem.set('pmd_readiness_v1', JSON.stringify({ [hariIni]: { hrv: 70, behaviors: ['alcohol'], workouts: [] } })); assert.equal(m.saveTodaySleepQuality(3), true); assert.deepEqual(JSON.parse(mem.get('pmd_readiness_v1') ?? '{}')[hariIni], { hrv: 70, behaviors: ['alcohol'], workouts: [], sleepQ: 3 }) })
gagal('adaptor-tulis-ditolak-dilaporkan', () => { reset(); tolakTulis = true; assert.equal(m.saveTodaySleepQuality(3), false); assert.equal(mem.size, 0) })
gagal('adaptor-data-rusak-tidak-ditimpa', () => { reset(); mem.set('pmd_readiness_v1', '{rusak'); assert.equal(m.saveTodaySleepQuality(3), false); assert.equal(mem.get('pmd_readiness_v1'), '{rusak') })
gagal('adaptor-baca-melempar-jadi-kosong', () => { reset(); bacaMelempar = true; assert.equal(m.readTodaySleepQuality(), null); assert.equal(m.saveTodaySleepQuality(3), false) })
gagal('adaptor-nilai-buruk-tidak-menulis', () => { reset(); assert.equal(m.saveTodaySleepQuality(9 as never), false); assert.equal(mem.size, 0) })

const kosong = (reset(), render())
gagal('render-lima-wajah-besar', () => { for (const q of [1, 2, 3, 4, 5]) assert.match(kosong, new RegExp(`aria-pressed="false" data-testid="sleep-${q}"`)); assert.match(kosong, /minHeight:88px|min-height:88px/) })
gagal('render-label-teks-bukan-hanya-emoji', () => { for (const t of ['Very bad', 'Bad', 'Okay', 'Good', 'Very good']) assert.ok(kosong.includes(t), t) })
gagal('render-kosong-tanpa-klaim-tersimpan', () => { assert.ok(!kosong.includes('Saved for today')); assert.match(kosong, /Tap one\./) })
const terisi = (reset(), mem.set('pmd_readiness_v1', JSON.stringify({ [hariIni]: { sleepQ: 4, behaviors: [], workouts: [] } })), render())
gagal('render-terisi-menandai-satu', () => { assert.match(terisi, /aria-pressed="true" data-testid="sleep-4"/); assert.match(terisi, /aria-pressed="false" data-testid="sleep-3"/); assert.match(terisi, /Saved for today/); assert.match(terisi, /href="\/readiness"/) })
gagal('render-nilai-rusak-dianggap-kosong', () => { const h = (reset(), mem.set('pmd_readiness_v1', JSON.stringify({ [hariIni]: { sleepQ: 9 } })), render()); assert.ok(!h.includes('Saved for today')); assert.ok(!/aria-pressed="true"/.test(h)) })
gagal('render-tanpa-skor-atau-klaim', () => { for (const h of [kosong, terisi]) assert.ok(!/(score|readiness score|diagnos|treat|rejuvenat|anti-aging)/i.test(h)) })

// ── terpasang di Layar Sederhana ──
gagal('terpasang-di-layar-sederhana', () => { const s = readFileSync('src/domains/simple-mode/ui/SimpleHome.tsx', 'utf8'); assert.match(s, /from '\.\.\/\.\.\/recovery-checkin\/index'/); assert.match(s, /<SleepCheckin \/>/) })
// ── kemurnian mesin ──
const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
for (const f of ['src/domains/recovery-checkin/engine/readinessRecord.ts', 'src/domains/recovery-checkin/model/types.ts']) gagal(`murni:${f}`, () => assert.ok(!/(Date\.now\(|Math\.random\(|fetch\(|localStorage|document\.|window\.)/.test(tanpaKomentar(readFileSync(f, 'utf8')))))
console.log('recovery-checkin: OK')
