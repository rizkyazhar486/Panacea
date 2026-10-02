import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DEMO_DEFAULT, getDemo, getDemoTersimpan } from '../../src/lib/profile.ts'

// ── 1. Kenapa penjaga lama tidak pernah bisa menyala ───────────────────────
// Bukan dugaan: dengan penyimpanan kosong, getDemo() TETAP mengembalikan
// berat, tinggi dan usia yang lebih besar dari nol. Syarat
// `berat > 0 && tinggi > 0 && umur > 0` karenanya selalu benar, dan keadaan
// kosong di UbinTdee adalah kode mati yang tidak pernah dijalankan siapa pun.
const toko = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => toko.get(k) ?? null,
  setItem: (k: string, v: string) => void toko.set(k, v),
  removeItem: (k: string) => void toko.delete(k),
  clear: () => toko.clear(),
  key: () => null,
  length: 0,
} as unknown as Storage

toko.clear()
const kosong = getDemo()
assert.ok(kosong.weightKg > 0 && kosong.heightCm > 0 && kosong.age > 0,
  'getDemo() no longer substitutes — re-read this gate, its premise has changed')
assert.equal(kosong.weightKg, DEMO_DEFAULT.weightKg, 'the substituted weight is DEMO_DEFAULT')
assert.equal(kosong.age, DEMO_DEFAULT.age, 'the substituted age is DEMO_DEFAULT')
// Dan bacaan yang benar mengatakan kebenarannya: tidak ada apa-apa.
assert.deepEqual(getDemoTersimpan(), {}, 'an empty store must read back as empty')

// ── 2. Bacaan tersimpan menyala hanya ketika memang ada ────────────────────
toko.set('pmd_profile', JSON.stringify({ age: 41, sex: 'F' }))
const sebagian = getDemoTersimpan()
assert.equal(sebagian.age, 41, 'a stored age must be readable')
assert.equal(sebagian.weightKg, undefined, 'a weight that was never stored must not appear')
toko.clear()

// ── 3. Ubin itu harus memakai bacaan tersimpan, bukan getDemo() ────────────
const ubin = readFileSync(new URL('../../src/components/UbinTdee.tsx', import.meta.url), 'utf8')
assert.ok(/getDemoTersimpan/.test(ubin), 'UbinTdee does not read the stored profile')
// Komentar boleh menyebut getDemo() -- justru harus, karena di situlah
// alasannya dicatat. Yang diperiksa adalah KODE.
const kodeUbin = ubin.split('\n').filter((b) => !b.trim().startsWith('//')).join('\n')
assert.ok(!/\bgetDemo\b\s*\(/.test(kodeUbin),
  'UbinTdee still calls getDemo(), whose defaults make its own guard unreachable')
assert.ok(/useVitalField\('weightKg',\s*tersimpan\.weightKg\s*\|\|\s*0\)/.test(ubin),
  'the weight fallback is not the stored value, so the guard can be satisfied by a default')
assert.ok(/useVitalField\('heightCm',\s*tersimpan\.heightCm\s*\|\|\s*0\)/.test(ubin),
  'the height fallback is not the stored value')
assert.ok(/const umur = tersimpan\.age \|\| 0/.test(ubin), 'age is not read from the stored profile')
assert.ok(/jenisKelamin !== null/.test(ubin),
  'sex is not required, yet Mifflin-St Jeor differs by 166 kcal between the two constants')
assert.ok(/Weight, height, age and sex are needed/.test(ubin),
  'the empty state no longer names what it is waiting for')

// ── 4. Macro Lab boleh memakai nilai awal, asalkan MENYEBUTNYA ─────────────
// Halaman itu punya kolom yang terlihat dan bisa disunting, jadi nilai awal
// masuk akal. Yang tidak masuk akal adalah membiarkannya terbaca seperti
// angka yang tersimpan.
const makro = readFileSync(new URL('../../src/pages/MacroLabGizi.tsx', import.meta.url), 'utf8')
assert.ok(/Not yours yet:/.test(makro), 'Macro Lab no longer marks its substituted values')
assert.ok(/bawaan\.length > 0 &&/.test(makro), 'the notice is not conditional on there being substitutions')
assert.ok(!/from your own body mass/.test(makro),
  'the subtitle still claims the figures are the reader\'s own when they may be defaults')

console.log('ubin-tdee-penjaga: ok')
