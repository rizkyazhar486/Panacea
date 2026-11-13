// Kartu Darurat: mesin murni (nomor, umur, peta, teks bagikan) + kontrak render yang terlihat orang.
// Setiap aturan punya kasus penerima yang HANYA berbeda pada kondisi itu; semua penolakan gagal-tertutup bernama.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ageYears, contactTelHref, emergencyDisplayNumber, emergencyShareText, emergencyTelHref, mapsUrl, sanitizePhone } from '../../src/domains/emergency-card/engine/emergencyCard.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const kontrasPutih = (hex: string) => 1.05 / (lum(hex) + 0.05)

// ── nomor telepon ──
gagal('nomor-valid', () => {
  assert.equal(sanitizePhone('112'), '112')
  assert.equal(sanitizePhone('+62 812-3456 7890'), '+6281234567890')
  assert.equal(sanitizePhone('(021) 555.123'), '021555123')
  assert.equal(sanitizePhone('  118  '), '118')
})
for (const buruk of ['', '   ', 'abc', 'javascript:alert(1)', 'tel:112;ext=1', '112;113', '1+1', '++62812', '112\n113', '11a2', null, undefined, 112, {}, ['112']])
  gagal(`nomor-ditolak:${String(buruk)}`, () => assert.equal(sanitizePhone(buruk), null))
// batas panjang: 2..20 digit, ±1 di luar batas ditolak
gagal('nomor-batas-bawah', () => { assert.equal(sanitizePhone('11'), '11'); assert.equal(sanitizePhone('1'), null) })
gagal('nomor-batas-atas', () => { assert.equal(sanitizePhone('1'.repeat(20)), '1'.repeat(20)); assert.equal(sanitizePhone('1'.repeat(21)), null) })
// berpasangan: hanya isi yang berbeda -> tombol memakai nomor pengguna atau jatuh ke 112
gagal('tel-nomor-pengguna', () => { assert.equal(emergencyTelHref('118'), 'tel:118'); assert.equal(emergencyDisplayNumber('118'), '118') })
for (const buruk of ['', 'javascript:alert(1)', 'tel:1', undefined])
  gagal(`tel-jatuh-ke-112:${String(buruk)}`, () => { assert.equal(emergencyTelHref(buruk), 'tel:112'); assert.equal(emergencyDisplayNumber(buruk), '112') })
gagal('yang-tampil-sama-dengan-yang-dipanggil', () => { for (const x of ['118', '(021) 555', 'x', '']) assert.equal(emergencyTelHref(x), `tel:${emergencyDisplayNumber(x)}`) })
gagal('kontak', () => { assert.equal(contactTelHref('0812 3456 7890'), 'tel:081234567890'); assert.equal(contactTelHref(''), null); assert.equal(contactTelHref('abc'), null) })

// ── umur ──
const NOW = Date.UTC(2026, 10, 9) // 2026-11-09
gagal('umur-valid', () => { assert.equal(ageYears('1950-01-01', NOW), 76); assert.equal(ageYears('2026-11-09', NOW), 0) })
gagal('umur-batas-masa-depan', () => { assert.equal(ageYears('2026-11-10', NOW), null); assert.equal(ageYears('2026-11-09', NOW), 0) })
gagal('umur-batas-atas', () => { assert.equal(ageYears('1876-11-09', NOW), 150); assert.equal(ageYears('1875-11-09', NOW), null) })
// regresi: pada hari ulang tahun umur sudah bertambah, sehari sebelumnya belum (versi 365,25 hari gagal di sini)
gagal('umur-hari-ulang-tahun', () => { assert.equal(ageYears('1950-11-09', NOW), 76); assert.equal(ageYears('1950-11-10', NOW), 75); assert.equal(ageYears('1950-11-08', NOW), 76); assert.equal(ageYears('2000-02-29', Date.UTC(2026, 1, 28)), 25); assert.equal(ageYears('2000-02-29', Date.UTC(2026, 2, 1)), 26) /* lahir 29 Feb: bertambah mulai 1 Mar */ })
for (const buruk of ['', 'abc', '2026-13-45', null, undefined, 19500101])
  gagal(`umur-ditolak:${String(buruk)}`, () => assert.equal(ageYears(buruk, NOW), null))
gagal('umur-jam-tak-valid', () => { assert.equal(ageYears('1950-01-01', Number.NaN), null); assert.equal(ageYears('1950-01-01', Infinity), null) })
gagal('umur-deterministik', () => assert.equal(ageYears('1980-06-15', NOW), ageYears('1980-06-15', NOW)))

// ── peta ──
gagal('peta-valid', () => { assert.equal(mapsUrl(-6.2, 106.8), 'https://maps.google.com/?q=-6.2,106.8'); assert.equal(mapsUrl(90, 180), 'https://maps.google.com/?q=90,180'); assert.equal(mapsUrl(-90, -180), 'https://maps.google.com/?q=-90,-180') })
for (const [la, lo] of [[90.0001, 0], [-90.0001, 0], [0, 180.0001], [0, -180.0001], [Number.NaN, 0], [0, Infinity], ['1', 2], [1, '2'], [null, null], [undefined, 1]] as const)
  gagal(`peta-ditolak:${String(la)},${String(lo)}`, () => assert.equal(mapsUrl(la, lo), null))

// ── teks bagikan: format identik dengan versi sebelumnya (regresi) ──
gagal('bagikan-golden', () => {
  assert.equal(emergencyShareText({ name: 'Ani', url: 'U', bloodType: 'A+', allergies: 'Penicillin' }), '🚨 EMERGENCY — Ani need help. My location: U · Blood type A+ · Allergies: Penicillin')
  assert.equal(emergencyShareText({ name: '', url: 'U', bloodType: '', allergies: '' }), '🚨 EMERGENCY — I need help. My location: U')
  assert.equal(emergencyShareText({ name: 'Ani', url: 'U', bloodType: 'O−', allergies: '' }), '🚨 EMERGENCY — Ani need help. My location: U · Blood type O−')
})

// ── render nyata (localStorage tiruan; komponen memakainya saat inisialisasi) ──
const mem = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, String(v)) }, removeItem: (k: string) => { mem.delete(k) }, clear: () => mem.clear(), key: () => null, length: 0 } as Storage
// Node tidak menjalankan .tsx/.css secara langsung: bundel komponen apa adanya (preseden info-label.mts), react tetap eksternal.
const { build } = await import('esbuild')
const { writeFileSync, mkdirSync } = await import('node:fs')
const { pathToFileURL } = await import('node:url')
const { resolve } = await import('node:path')
const out = await build({ entryPoints: ['src/pages/clinical/EmergencyCard.tsx'], bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' }, logLevel: 'silent' })
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/emergency-card.uji.mjs', out.outputFiles[0].text)
const { EmergencyCard } = await import(pathToFileURL(resolve('node_modules/.cache/emergency-card.uji.mjs')).href)
const render = (data?: Record<string, unknown>) => { mem.clear(); if (data) mem.set('pmd_emergency_card_v1', JSON.stringify(data)); return renderToStaticMarkup(createElement(EmergencyCard)) }

const kosong = render()
gagal('kosong-panggil-112', () => { assert.match(kosong, /data-testid="emc-call"/); assert.match(kosong, /href="tel:112"/); assert.match(kosong, /emc-call__number">112</) })
gagal('kosong-ajak-isi', () => assert.match(kosong, /data-testid="emc-save"/)) // belum ada kartu -> langsung mode isi
gagal('kosong-tanpa-tombol-kontak', () => assert.ok(!/data-testid="emc-contact"/.test(kosong)))

const penuh = render({ name: 'Ani', bloodType: 'A+', dob: '1950-01-01', allergies: 'Penicillin', conditions: 'Asthma', medications: 'Salbutamol', emergencyName: 'Budi', emergencyPhone: '0812 3456 7890', localEmergencyNumber: '118', organDonor: true })
gagal('penuh-nomor-pengguna', () => { assert.match(penuh, /href="tel:118"/); assert.match(penuh, /emc-call__number">118</) })
gagal('penuh-kontak-tampil', () => { assert.match(penuh, /data-testid="emc-contact"/); assert.match(penuh, /href="tel:081234567890"/); assert.ok(!/data-testid="emc-add-contact"/.test(penuh)) })
gagal('penuh-golongan-darah-dan-alergi', () => { assert.match(penuh, /data-testid="emc-blood"[^>]*><b>A\+<\/b>/); assert.match(penuh, /data-testid="emc-allergies"/); assert.match(penuh, /Penicillin/) })
gagal('penuh-fakta', () => { for (const t of ['Asthma', 'Salbutamol', 'Budi · 0812 3456 7890']) assert.ok(penuh.includes(t), t) })
// berpasangan: hanya nomor kontak yang rusak -> tombol kontak hilang, tombol tambah muncul
const kontakRusak = render({ name: 'Ani', emergencyPhone: 'abc', localEmergencyNumber: '118' })
gagal('kontak-rusak-ditolak', () => { assert.ok(!/data-testid="emc-contact"/.test(kontakRusak)); assert.match(kontakRusak, /data-testid="emc-add-contact"/) })
// negatif keamanan: nomor lokal berbahaya tidak pernah menjadi href
const jahat = render({ name: 'Ani', localEmergencyNumber: 'javascript:alert(1)', emergencyPhone: 'tel:112;ext=1' })
gagal('nomor-berbahaya-tidak-jadi-href', () => { assert.match(jahat, /href="tel:112"/); assert.ok(!/href="javascript:/i.test(jahat)); assert.ok(!/href="[^"]*ext=1/.test(jahat)) /* tampil hanya sebagai teks biasa, tidak pernah menjadi tautan */; assert.ok(!/data-testid="emc-contact"/.test(jahat)) })
// tanggal lahir tak valid tidak pernah menampilkan "NaN"
const lahirRusak = render({ name: 'Ani', dob: 'abc' })
gagal('tanpa-NaN', () => { assert.ok(!/NaN/.test(lahirRusak)); assert.ok(!/NaN/.test(penuh)) })
// teks batas klaim: kata-kata TIDAK berubah dan tampil di kedua keadaan
for (const [nama, html] of [['kosong', kosong], ['penuh', penuh]] as const) gagal(`batas-klaim-${nama}`, () => {
  for (const t of ['not a clinically validated Panacea emergency system', 'Does not replace certified emergency services, medical-alert devices, or institutional triage', 'Verify the local emergency number for your country', 'Stored on this device until you tap SOS or share']) assert.ok(html.includes(t), t)
})
gagal('batas-klaim-tidak-dipotong-skrip-visual-first', () => assert.match(kosong, /class="emc-note" data-pmd-unclamped="true"/))
gagal('struktur-heading', () => { assert.equal((penuh.match(/<h1/g) ?? []).length, 0); assert.ok((penuh.match(/<h2/g) ?? []).length >= 2) })
gagal('aksi-darurat-punya-nama-aksesibel', () => assert.match(penuh, /aria-label="Call 118"/))
gagal('tombol-bagikan-tidak-ganda', () => assert.match(penuh, /data-testid="emc-share"/))

// ── gaya: ukuran sentuh, kontras, gerak, tanpa CSS global ──
const css = readFileSync('src/domains/emergency-card/ui/emergencyCard.css', 'utf8')
// ukuran HARUS ada di blok lantai berspesifisitas ganda (0,3,0): aturan kepadatan global 0,2,0 mengalahkan kelas tunggal
const minTinggi = (sel: string) => { const m = css.match(new RegExp(`html:root body \\.emc-page \\${sel}\\${sel}\\s*\\{\\s*min-height:\\s*(\\d+)px`)); return m ? Number(m[1]) : 0 }
gagal('sentuh-panggil-≥136', () => assert.ok(minTinggi('.emc-call') >= 136, String(minTinggi('.emc-call'))))
gagal('sentuh-panggil-mobile-≥120', () => assert.match(css, /@media \(max-width:\s*420px\)\s*\{\s*html:root body \.emc-page \.emc-call\.emc-call\s*\{\s*min-height:\s*(1[2-9][0-9]|[2-9][0-9]{2})px/))
gagal('lantai-kolom-isian-56', () => assert.match(css, /html:root body \.emc-page \.emc-form :is\(input:not\(\[type='checkbox'\]\), select\) \{ min-height: 56px; \}/))
// spesifisitas: setiap aturan lantai harus memakai awalan html:root body (teknik repo) agar menang atas touch-targets.css (0,3,3)
gagal('lantai-memakai-awalan-html-root-body', () => { const lantai = [...css.matchAll(/^(?:\s*)(html:root body[^{]*|\.emc-page[^{]*)\{\s*min-height/gm)].map((m) => m[1].trim()); assert.ok(lantai.length >= 6, String(lantai.length)); for (const sel of lantai) assert.ok(sel.startsWith('html:root body '), `lantai tanpa awalan akan kalah dari touch-targets.css: ${sel}`) })
gagal('lantai-tidak-dilemahkan-aturan-global', () => { for (const k of ['.emc-call', '.emc-tile', '.emc-cta', '.emc-pill']) assert.ok(!new RegExp(`^\\${k}\\s*\\{[^}]*min-height`, 'm').test(css), `min-height pada kelas tunggal ${k} akan kalah dari aturan global`) })
gagal('sentuh-tile-≥96', () => assert.ok(minTinggi('.emc-tile') >= 96, String(minTinggi('.emc-tile'))))
gagal('sentuh-cta-≥56', () => assert.ok(minTinggi('.emc-cta') >= 56))
gagal('sentuh-pill-≥48', () => assert.ok(minTinggi('.emc-pill') >= 48))
gagal('huruf-nomor-≥48', () => assert.match(css, /\.emc-call__number\s*\{[^}]*font-size:\s*(5[0-9]|[6-9][0-9])px/))
for (const sel of ['.emc-call', '.emc-blood', '.emc-id__bar', '.emc-tile', '.emc-tile--contact', '.emc-cta']) {
  const blok = css.match(new RegExp(`\\${sel}\\s*\\{[^}]*\\}`))?.[0] ?? ''
  const warna = [...blok.matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0]).filter((_, i, a) => !/box-shadow|rgba/.test(blok) || true)
  const latar = [...(blok.match(/background:[^;]+;/)?.[0] ?? '').matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0])
  gagal(`kontras-putih:${sel}`, () => { assert.ok(latar.length > 0, `tak ada warna latar terbaca di ${sel}`); for (const h of latar) assert.ok(kontrasPutih(h) >= 4.5, `${sel} ${h}=${kontrasPutih(h).toFixed(2)}`) })
  void warna
}
// anggaran lapisan-tambal-dilarang.mts: CSS baru tidak boleh menambah penanda prioritas paksa (dihitung juga di komentar)
gagal('tanpa-penanda-prioritas-paksa', () => assert.ok(!/!important/.test(css), 'CSS kartu darurat memakai spesifisitas, bukan prioritas paksa'))
gagal('gerak-dihormati', () => assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*animation:\s*none/))
gagal('fokus-terlihat', () => assert.match(css, /:focus-visible\s*\{\s*outline:\s*4px/))
gagal('dua-kolom-desktop', () => assert.match(css, /min-width:\s*1024px[\s\S]*grid-template-columns/))
gagal('mode-gelap', () => assert.match(css, /:root\.dark \.emc-page/))
gagal('tanpa-selektor-global', () => { for (const m of css.matchAll(/^([^\s@}/][^{]*)\{/gm)) assert.ok(/\.emc-|:root\.dark \.emc-/.test(m[1]) || /^\s*(0|70%|100%|%)/.test(m[1]) || /^\d/.test(m[1].trim()), m[1]) })
// gaya dimuat oleh titik masuk malas, bukan CSS global
const masuk = readFileSync('src/pages/EmergencyCard.tsx', 'utf8')
gagal('css-dimuat-di-titik-masuk-malas', () => assert.match(masuk, /import '\.\.\/domains\/emergency-card\/ui\/emergencyCard\.css'/))
gagal('css-tidak-di-index-global', () => assert.ok(!readFileSync('src/index.css', 'utf8').includes('.emc-')))
// terjemahan Indonesia lengkap untuk setiap tr('...') di halaman ini (kalimat batas klaim sengaja tidak memakai tr)
const sumber = readFileSync('src/pages/clinical/EmergencyCard.tsx', 'utf8')
const id = readFileSync('src/locales/id.ts', 'utf8')
const kunci = [...sumber.matchAll(/tr\((?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\)/g)].map((m) => (m[1] ?? m[2]).replace(/\\'/g, "'"))
gagal('tr-terbaca', () => assert.ok(kunci.length >= 20, String(kunci.length)))
for (const k of kunci) gagal(`id-ada:${k}`, () => assert.ok(id.includes(`'${k.replace(/'/g, "\\'")}':`) || id.includes(`"${k}":`), k))
gagal('batas-klaim-tidak-diterjemahkan-lewat-tr', () => { for (const t of ['not a clinically validated', 'Does not replace certified']) assert.ok(!kunci.some((k) => k.includes(t)), t) })
console.log('emergency-card: OK')
