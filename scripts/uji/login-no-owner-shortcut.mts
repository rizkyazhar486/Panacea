import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Gerbang sumber: layar login publik tidak boleh punya jalan pintas yang memberi peran owner / identitas orang bernama,
// dan tidak boleh memasang tombol "Google" yang tidak melewati verifikasi Google.
const src = readFileSync(new URL('../../src/pages/landing/Login.tsx', import.meta.url), 'utf8')

const fungsi = (nama: string): string => {
  const i = src.indexOf(`const ${nama} = `)
  assert.ok(i >= 0, `fungsi ${nama} hilang`)
  const j = src.indexOf('\n  }\n', i)
  return src.slice(i, j + 5)
}

// 1. Tidak ada pemanggilan masuk-cepat dengan OWNER_EMAIL atau peran 'owner'.
assert.doesNotMatch(src, /completeQuickSignIn\(\s*\{[^}]*OWNER_EMAIL/s, 'masuk-cepat memakai OWNER_EMAIL')
assert.doesNotMatch(src, /completeQuickSignIn\(\s*\{[^}]*role:\s*'owner'/s, "masuk-cepat memberi peran 'owner'")

// 2. Tidak ada tombol yang mengaku Google tanpa verifikasi Google.
assert.doesNotMatch(src, /Lanjutkan dengan Google/, 'tombol "Lanjutkan dengan Google" palsu kembali')
assert.doesNotMatch(src, /handleOneClickGoogle/, 'handler Google tanpa verifikasi kembali')

// 3. Tidak ada nama orang sungguhan yang dipakai sebagai akun pintas.
assert.doesNotMatch(src, /Continue as dr\./, 'tombol atas nama orang bernama kembali')

// 4. Jalur perangkat: memakai profil tamu, wajib persetujuan, dan tidak menyentuh owner.
const dev = fungsi('continueOnThisDevice')
assert.match(dev, /deviceGuestProfile\(/, 'jalur perangkat tidak memakai deviceGuestProfile')
assert.match(dev, /consentOk\(\)/, 'jalur perangkat melewati persetujuan privasi')
assert.doesNotMatch(dev, /OWNER_EMAIL|'owner'/, 'jalur perangkat menyentuh owner')

// 5. Tombol perangkat benar-benar terpasang dan dapat diuji.
assert.match(src, /data-testid="device-session-btn"/)
assert.match(src, /onClick=\{continueOnThisDevice\}/)

// 6. Tampilan minimal: tanpa kata "lokal"/klaim kepatuhan di layar login; opsi tamu tersembunyi di dalam <details>.
assert.doesNotMatch(src, /Mode lokal|mode lokal|Penyimpanan Lokal|Patuh UU PDP|Continue on this device/, 'teks "lokal"/klaim kepatuhan kembali di login')
const btnAt = src.indexOf('data-testid="device-session-btn"')
const opened = src.lastIndexOf('<details', btnAt)
const closed = src.lastIndexOf('</details>', btnAt)
assert.ok(opened >= 0 && opened > closed, 'tombol sesi tamu tidak berada di dalam <details> (harus tersembunyi)')

console.log('login-no-owner-shortcut: OK')
