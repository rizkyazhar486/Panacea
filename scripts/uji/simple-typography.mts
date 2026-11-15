// Mode sederhana harus MENANG atas skala teks sebaris pada <html> (akar masalah: font-size sebaris 16px saat boot
// mengalahkan `.simple-mode { font-size: 19px }`), tanpa merusak skala pilihan saat mode itu mati.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
let data = new Map<string, string>(); let gagalTulis = new Set<string>()
const kelas = new Set<string>(); const gaya = { fontSize: '' as string }
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { if (gagalTulis.has(k)) throw new Error('tulis ditolak'); data.set(k, String(v)) },
  removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
} as Storage
;(globalThis as unknown as { document: unknown }).document = { documentElement: { style: gaya, classList: { toggle: (n: string, f?: boolean) => { const on = f ?? !kelas.has(n); if (on) kelas.add(n); else kelas.delete(n); return on }, contains: (n: string) => kelas.has(n) } } }
const reset = () => { data = new Map(); gagalTulis = new Set(); kelas.clear(); gaya.fontSize = '' }
const t = await import('../../src/lib/theme.ts')

// ── skala biasa (regresi: perilaku lama tetap) ──
for (const [skala, px] of [['sm', '15px'], ['md', '16px'], ['lg', '18px']] as const) gagal(`skala-${skala}`, () => { reset(); t.setTextScale(skala); assert.equal(gaya.fontSize, px) })
// ── mode sederhana menyerahkan ukuran ke CSS ──
gagal('sederhana-kosongkan-inline', () => { reset(); t.setTextScale('md'); t.setSimpleMode(true); assert.equal(gaya.fontSize, ''); assert.equal(kelas.has('simple-mode'), true) })
gagal('sederhana-menang-atas-skala-sesudahnya', () => { reset(); t.setSimpleMode(true); t.setTextScale('sm'); assert.equal(gaya.fontSize, ''); t.setTextScale('lg'); assert.equal(gaya.fontSize, '') })
gagal('mematikan-memulihkan-skala-pilihan', () => { reset(); t.setTextScale('sm'); t.setSimpleMode(true); assert.equal(gaya.fontSize, ''); t.setSimpleMode(false); assert.equal(gaya.fontSize, '15px'); assert.equal(kelas.has('simple-mode'), false) })
gagal('boot-menerapkan-keduanya-berurutan', () => { reset(); data.set('pmd-simple-mode', 'true'); data.set('pmd-text-scale', 'lg'); t.applyAppearance(); assert.equal(gaya.fontSize, ''); assert.equal(kelas.has('simple-mode'), true) })
gagal('boot-tanpa-sederhana-memakai-skala', () => { reset(); data.set('pmd-text-scale', 'lg'); t.applyAppearance(); assert.equal(gaya.fontSize, '18px'); assert.equal(kelas.has('simple-mode'), false) })
// ── negatif: penyimpanan menolak menulis -> skala yang DIMINTA tetap dipakai (bukan skala lama dari penyimpanan) ──
gagal('tulis-ditolak-memakai-skala-diminta', () => { reset(); gagalTulis.add('pmd-text-scale'); data.set('pmd-text-scale', 'md'); t.setTextScale('lg'); assert.equal(gaya.fontSize, '18px') })
gagal('nilai-skala-rusak-jatuh-ke-md', () => { reset(); data.set('pmd-text-scale', 'raksasa'); t.applyAppearance(); assert.equal(gaya.fontSize, '16px') })
gagal('nilai-sederhana-rusak-dianggap-mati', () => { reset(); for (const v of ['1', 'yes', '', 'TRUE']) { data.set('pmd-simple-mode', v); t.applyAppearance(); assert.notEqual(kelas.has('simple-mode'), true, v) } })
// ── aturan CSS yang diandalkan memang ada ──
gagal('css-simple-mode-19px', () => assert.match(readFileSync('src/index.css', 'utf8'), /\.simple-mode \{\s*font-size: 19px;/))
console.log('simple-typography: OK')
