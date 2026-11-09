// Layar Sederhana: batas keras yang harus gagal DENGAN NAMA bila dilanggar.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { SIMPLE_ACTIONS, SEE_EVERYTHING_ROUTE, SIMPLE_ROUTE } from '../../src/domains/simple-mode/model/simpleActions.ts'
import { parseSimpleStart, serializeSimpleStart, SIMPLE_MODE_STORAGE_KEY } from '../../src/domains/simple-mode/engine/simpleModePreference.ts'
import { SimpleHome } from '../../src/domains/simple-mode/ui/SimpleHome.tsx'
import { SimpleModeInvite } from '../../src/domains/simple-mode/ui/SimpleModeInvite.tsx'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const kata = (s: string) => s.trim().split(/\s+/).length
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const kontrasPutih = (hex: string) => 1.05 / (lum(hex) + 0.05)

// positif: preferensi — hanya '1' yang aktif; serialisasi bolak-balik
assert.equal(parseSimpleStart('1'), true)
assert.equal(parseSimpleStart(serializeSimpleStart(true)), true)
assert.equal(parseSimpleStart(serializeSimpleStart(false)), false)
// negatif (gagal tertutup): apa pun selain '1' = mati
for (const buruk of [null, undefined, '', '0', 'true', 'yes', '1 ', 1, true, {}]) gagal('pref-gagal-tertutup', () => assert.equal(parseSimpleStart(buruk), false, String(buruk)))
assert.equal(serializeSimpleStart('1' as unknown as boolean), '0')  // bukan boolean true persis → mati
assert.equal(SIMPLE_MODE_STORAGE_KEY, 'panacea.simpleStart.v1')

// batas keras tampilan: ≤4 tombol utama, label ≤3 kata, petunjuk ≤8 kata (±1 di luar batas ditolak)
gagal('maks-4-tombol-utama', () => assert.ok(SIMPLE_ACTIONS.length <= 4 && SIMPLE_ACTIONS.length >= 1))
for (const a of SIMPLE_ACTIONS) {
  gagal(`label-maks-3-kata:${a.id}`, () => assert.ok(kata(a.label) <= 3, a.label))
  gagal(`petunjuk-maks-8-kata:${a.id}`, () => assert.ok(kata(a.hint) <= 8, a.hint))
  gagal(`kontras-teks-putih:${a.id}`, () => assert.ok(kontrasPutih(a.background) >= 4.5, `${a.background}=${kontrasPutih(a.background).toFixed(2)}`))
}
assert.ok(kata('one two three four') > 3 && kata('one two three') <= 3)  // pengukur kata berpasangan
gagal('id-unik', () => assert.equal(new Set(SIMPLE_ACTIONS.map((a) => a.id)).size, SIMPLE_ACTIONS.length))
gagal('darurat-paling-atas', () => assert.equal(SIMPLE_ACTIONS[0].id, 'help'))

// setiap tujuan adalah rute yang BENAR-BENAR ada (tanpa kemampuan buatan)
const main = readFileSync('src/main.tsx', 'utf8')
for (const to of [...SIMPLE_ACTIONS.map((a) => a.to), SEE_EVERYTHING_ROUTE, SIMPLE_ROUTE])
  gagal(`rute-ada:${to}`, () => assert.ok(new RegExp(`<Route path="${to}" element=\\{<(?!Navigate)`).test(main), to))
// berpasangan: rute yang tak terdaftar memang ditolak oleh pemeriksa yang sama
assert.equal(new RegExp('<Route path="/tidak-ada" element=').test(main), false)

// render: kontrak yang terlihat orang
const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SimpleHome)))
gagal('render-4-tombol-utama', () => assert.equal((html.match(/data-testid="simple-(help|medicine|ask|body)"/g) ?? []).length, SIMPLE_ACTIONS.length))
gagal('render-ada-lihat-semuanya', () => assert.match(html, /data-testid="simple-everything"/))
gagal('render-tanpa-h1-ganda', () => assert.equal((html.match(/<h1/g) ?? []).length, 0))  // Shell sudah memiliki satu h1
gagal('render-judul-satu-h2', () => assert.equal((html.match(/<h2/g) ?? []).length, 1))
gagal('render-bahasa-tujuh-tombol', () => assert.equal((html.match(/<button[^>]*aria-pressed/g) ?? []).length, 7 + 1))  // 7 bahasa + sakelar layar pertama
gagal('render-tanpa-gulir-samping', () => assert.ok(!/overflow-x|width:\s*\d{4,}px/.test(html)))
for (const m of html.matchAll(/min-height:(\d+)px/g)) gagal('sasaran-sentuh-≥72', () => assert.ok(Number(m[1]) >= 72, m[0]))
gagal('render-kalimat-sumber-inggris', () => assert.match(html, /What do you need\?/))
gagal('teks-membungkus-bukan-terpotong', () => assert.ok((html.match(/white-space:normal/g) ?? []).length >= SIMPLE_ACTIONS.length + 1 + 7 + 1))
const undangan = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SimpleModeInvite)))
gagal('undangan-menuju-simple', () => assert.match(undangan, /href="\/simple"/))
gagal('undangan-membungkus', () => assert.match(undangan, /white-space:normal/))

// pengkabelan: beranda memuat undangan + pilihan layar pertama; rute /simple dimuat malas
const home = readFileSync('src/pages/dashboard/Home.tsx', 'utf8')
gagal('home-membaca-pilihan', () => assert.match(home, /readSimpleStart\(\)\) return <SimpleHome/))
gagal('home-menampilkan-undangan', () => assert.match(home, /<SimpleModeInvite \/>/))
gagal('rute-simple-malas', () => assert.match(main, /const SimpleHome = lazy\(/))
// aturan kemurnian: model/engine tanpa I/O
for (const f of ['model/simpleActions.ts', 'engine/simpleModePreference.ts'])
  gagal(`murni:${f}`, () => assert.ok(!/localStorage|Date\.now\(|Math\.random\(|fetch\(|document\.|window\./.test(readFileSync(`src/domains/simple-mode/${f}`, 'utf8')), f))
// terjemahan Indonesia lengkap untuk semua kalimat layar ini (kalimat hilang = Inggris tampil, tetapi harus disengaja)
const id = readFileSync('src/locales/id.ts', 'utf8')
for (const a of SIMPLE_ACTIONS) for (const k of [a.label, a.hint]) gagal(`id-ada:${k}`, () => assert.ok(id.includes(`'${k}':`), k))
console.log('simple-mode: OK')
