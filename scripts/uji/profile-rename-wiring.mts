import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const baca = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8')
const store = baca('src/lib/store.tsx')
const profil = baca('src/pages/dashboard/Profile.tsx')

// 1. Ganti nama harus sampai ke account.name (header & sapaan membacanya) dan ke sesi yang diingat.
const i = store.indexOf('updateProfile: (email, partial) => {')
assert.ok(i >= 0, 'updateProfile tidak lagi berbentuk blok')
const blok = store.slice(i, store.indexOf('bookConsult', i))
assert.match(blok, /account: renamed && st\.account && st\.account\.email === email \? \{ \.\.\.st\.account, name: renamed \}/, 'account.name tidak ikut berganti')
assert.match(blok, /saveSession\(\{ \.\.\.current, name: renamed \}\)/, 'sesi yang diingat tidak ikut berganti')
assert.match(blok, /current\.email === email/, 'rename akun lain boleh mengubah akun aktif')

// 2. Form memakai aturan murni dan menolak masukan tidak sah tanpa menyimpan.
assert.match(profil, /sanitizeDisplayName\(draft\.name\)/)
assert.match(profil, /sanitizeUsername\(draft\.username\)/)
const tolak = profil.indexOf('if (!name.ok || !username.ok) {')
assert.ok(tolak >= 0, 'validasi nama/username dihapus')
const sebelumSimpan = profil.slice(tolak, profil.indexOf('updateProfile(email, cleaned)', tolak))
assert.match(sebelumSimpan, /return\n/, 'masukan tidak sah tidak menghentikan penyimpanan')
assert.match(sebelumSimpan, /setFieldErrors\(\{ name:/, 'galat tidak ditampilkan')
assert.match(profil, /if \(savingRef\.current\) return/, 'tombol simpan bisa dobel-submit')
assert.ok((profil.match(/role="alert"/g) ?? []).length >= 2, 'pesan galat nama dan username harus diumumkan (role=alert)')

// 3. Tidak ada identitas orang bernama sebagai contoh/placeholder untuk semua pengguna, dan inisial mengikuti nama.
assert.doesNotMatch(profil, /placeholder="dr\. Rizky Muhammad Azrissal"/, 'placeholder memakai nama pemilik')
assert.doesNotMatch(profil, /placeholder="rizkyazhar486"/, 'placeholder memakai username pemilik')
assert.match(profil, /const initials = initialsOf\(displayName\)/, 'inisial tidak mengikuti nama yang diganti')

console.log('profile-rename-wiring: OK')
