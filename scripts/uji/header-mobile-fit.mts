// Bilah atas di 390 px: judul memakai SISA ruang, grup kendali kanan tidak menyusut, dan tombol akun hanya avatar
// di bawah sm. Terukur di browser: tombol akun 104 px mulai x=340 -> berakhir x=444 > 390, judul tinggal 72 px.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../../public/ui-iterations/nav-ux-v21.css', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../../src/components/layout/Shell.tsx', import.meta.url), 'utf8')

const rule = (src: string, selector: string) => {
  const i = src.indexOf(selector + ' {')
  assert.notEqual(i, -1, `aturan CSS hilang: ${selector}`)
  return src.slice(i, src.indexOf('}', i))
}

// positif: judul basis 0 (memakai sisa), kendali kanan tidak menyusut
assert.match(rule(css, 'header.kaca > div:first-child'), /flex:\s*1 1 0;/, 'judul harus flex 1 1 0')
assert.match(rule(css, 'header.kaca > div:last-child'), /flex:\s*0 0 auto;/, 'grup kendali kanan tidak boleh menyusut')

// negatif berpasangan: bentuk lama (basis auto / boleh menyusut) memang tidak lolos pemeriksaan yang sama
assert.doesNotMatch('header.kaca > div:first-child {\n  flex: 1 1 auto;\n}', /flex:\s*1 1 0;/)
assert.doesNotMatch('header.kaca > div:last-child {\n  flex: 0 1 auto;\n}', /flex:\s*0 0 auto;/)

// tombol akun: avatar saja di bawah sm (nama + chevron baru dari sm), target ketuk 44 px
const akun = shell.slice(shell.indexOf('aria-label="Menu akun dan keluar"') - 700, shell.indexOf('aria-label="Menu akun dan keluar"'))
assert.match(akun, /\bh-11 w-11\b/, 'tombol akun 44 px di mobile')
assert.match(akun, /sm:w-auto/, 'tombol akun melebar hanya dari sm')
assert.match(shell, /hidden flex-col items-start text-left leading-none sm:flex/, 'nama akun tersembunyi di bawah sm')

// tombol QR header disembunyikan di bawah sm; QR tetap terjangkau lewat menu akun
const qr = shell.slice(shell.indexOf('data-testid="header-qr-pass-btn"') - 700, shell.indexOf('data-testid="header-qr-pass-btn"'))
assert.match(qr, /\bhidden h-9 w-9\b[^`"]*\bsm:grid\b/, 'tombol QR header hanya dari sm')
assert.ok((shell.match(/setQrModalOpen\('qr'\)/g) ?? []).length >= 2, 'QR tetap bisa dibuka dari menu akun')

console.log('header-mobile-fit: judul basis 0, kendali kanan tidak menyusut, akun avatar-saja di mobile, QR terjangkau lewat menu akun PASS')
