// Pilihan "layar pertama" harus ikut menyalakan mode sederhana yang sudah ada (teks 19px, target 48px di SEMUA halaman),
// atomik: keduanya tersimpan, atau keadaan sebelumnya dipulihkan dan hasilnya false. Semua gerbang gagal dengan nama.
import assert from 'node:assert/strict'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

// ── lingkungan tiruan: penyimpanan yang dapat dibuat gagal per kunci, dan kelas pada <html> ──
let data = new Map<string, string>()
let gagalTulis = new Set<string>()
let gagalBaca = false
const kelas = new Set<string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => { if (gagalBaca) throw new Error('baca ditolak'); return data.get(k) ?? null },
  setItem: (k: string, v: string) => { if (gagalTulis.has(k)) throw new Error('tulis ditolak'); data.set(k, String(v)) },
  removeItem: (k: string) => { data.delete(k) }, clear: () => data.clear(), key: () => null, length: 0,
} as Storage
;(globalThis as unknown as { document: unknown }).document = { documentElement: { style: { fontSize: '' }, classList: { toggle: (n: string, f?: boolean) => { const on = f ?? !kelas.has(n); if (on) kelas.add(n); else kelas.delete(n); return on }, contains: (n: string) => kelas.has(n) } } }
const reset = () => { data = new Map(); gagalTulis = new Set(); gagalBaca = false; kelas.clear() }

const { readSimpleStart, writeSimpleStart } = await import('../../src/domains/simple-mode/adapters/simpleModeStorage.ts')
const START = 'panacea.simpleStart.v1'
const BESAR = 'pmd-simple-mode'

// ── positif ──
gagal('nyalakan-keduanya', () => { reset(); assert.equal(writeSimpleStart(true), true); assert.equal(data.get(START), '1'); assert.equal(data.get(BESAR), 'true'); assert.equal(kelas.has('simple-mode'), true); assert.equal(readSimpleStart(), true) })
gagal('matikan-keduanya', () => { reset(); writeSimpleStart(true); assert.equal(writeSimpleStart(false), true); assert.equal(data.get(START), '0'); assert.equal(data.get(BESAR), 'false'); assert.equal(kelas.has('simple-mode'), false); assert.equal(readSimpleStart(), false) })
gagal('idempoten', () => { reset(); assert.equal(writeSimpleStart(true), true); assert.equal(writeSimpleStart(true), true); assert.equal(data.get(BESAR), 'true') })
gagal('dipilih-di-pengaturan-lebih-dulu-tetap-konsisten', () => { reset(); data.set(BESAR, 'true'); kelas.add('simple-mode'); assert.equal(writeSimpleStart(true), true); assert.equal(writeSimpleStart(false), true); assert.equal(kelas.has('simple-mode'), false) /* pilihan ini satu paket: mematikannya mematikan keduanya */ })

// ── negatif: tulis ditolak -> false dan keadaan sebelumnya UTUH (berpasangan: kunci berbeda yang ditolak) ──
gagal('tulis-kunci-besar-ditolak-dipulihkan', () => { reset(); gagalTulis.add(BESAR); assert.equal(writeSimpleStart(true), false); assert.equal(data.get(START) ?? '0', '0'); assert.equal(kelas.has('simple-mode'), false); assert.equal(readSimpleStart(), false) })
gagal('tulis-kunci-mulai-ditolak-dipulihkan', () => { reset(); gagalTulis.add(START); assert.equal(writeSimpleStart(true), false); assert.equal(kelas.has('simple-mode'), false); assert.ok(!data.has(BESAR) || data.get(BESAR) !== 'true') })
gagal('gagal-mematikan-tetap-menyala-utuh', () => { reset(); assert.equal(writeSimpleStart(true), true); gagalTulis.add(BESAR); assert.equal(writeSimpleStart(false), false); assert.equal(readSimpleStart(), true); assert.equal(data.get(BESAR), 'true'); assert.equal(kelas.has('simple-mode'), true) })
gagal('gagal-mematikan-karena-kunci-mulai', () => { reset(); writeSimpleStart(true); gagalTulis.add(START); assert.equal(writeSimpleStart(false), false); assert.equal(readSimpleStart(), true); assert.equal(kelas.has('simple-mode'), true) })
gagal('bacaan-gagal-tertutup', () => { reset(); writeSimpleStart(true); gagalBaca = true; assert.equal(readSimpleStart(), false) })
for (const buruk of ['0', 'true', 'ya', '', '1 ']) gagal(`nilai-buruk-mati:${buruk}`, () => { reset(); data.set(START, buruk); assert.equal(readSimpleStart(), false) })
gagal('nilai-satu-persis-menyala', () => { reset(); data.set(START, '1'); assert.equal(readSimpleStart(), true) })

// ── penyambungan UI: penjelasan terlihat dan diterjemahkan ──
import { readFileSync } from 'node:fs'
gagal('ui-menjelaskan-efek-ke-semua-halaman', () => assert.match(readFileSync('src/domains/simple-mode/ui/SimpleHome.tsx', 'utf8'), /Also makes text and buttons bigger on every page\./))
gagal('ui-penjelasan-tidak-diubah-skrip-visual-first', () => assert.match(readFileSync('src/domains/simple-mode/ui/SimpleHome.tsx', 'utf8'), /data-pmd-unclamped="true"><p[^>]*>\{tr\('Also makes text and buttons bigger on every page\.'\)\}/))
gagal('terjemahan-id-ada', () => assert.ok(readFileSync('src/locales/id.ts', 'utf8').includes("'Also makes text and buttons bigger on every page.':")))
console.log('simple-start-adapter: OK')
