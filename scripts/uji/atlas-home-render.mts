// Panggung atlas Body Exposure dirender NYATA (tanpa WebGL) dengan penampil pengganti: dua proyeksi (lebar & ponsel),
// kontrol yang dulu hilang harus ada, penampil menerima lapisan yang benar, dan cacat yang pernah terukur tidak boleh kembali.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { regionFrameById } from '../../src/domains/body-exposure/engine/atlas-stage/regionFraming.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const hitung = (teks: string, pola: RegExp) => (teks.match(pola) ?? []).length

const { build } = await import('esbuild')
const out = await build({
  stdin: { contents: "export { BodyExposureAtlasHome } from './src/domains/body-exposure/ui/BodyExposureAtlasHome.tsx'", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-dom'], loader: { '.css': 'empty' }, logLevel: 'silent',
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/atlas-home-render.uji.mjs', out.outputFiles[0].text)
const { BodyExposureAtlasHome } = await import(pathToFileURL(resolve('node_modules/.cache/atlas-home-render.uji.mjs')).href)

interface Terima { layers: ReadonlySet<string>; dissect: number; highlighted: readonly string[]; focusKeywords: readonly string[]; homeFrame: unknown; onPick: unknown }
let diterima: Terima[] = []
const Pengganti = (props: Terima) => { diterima.push(props); return createElement('div', { 'data-stub-viewer': [...props.layers].join(',') }) }
const perintah: unknown[] = []
const render = () => { diterima = []; return renderToStaticMarkup(createElement(BodyExposureAtlasHome, { Viewer: Pengganti, sendCamera: (c: unknown) => { perintah.push(c) } })) }

// ── proyeksi lebar (tanpa window, useAdaptive memilih desktop) ──
const lebar = render()
const penampilLebar = diterima[0]
gagal('lebar-proyeksi-dan-keluar-dari-kulit-global', () => {
  assert.match(lebar, /data-atlas-stage="v2"/); assert.match(lebar, /data-atlas-projection="wide"/)
  assert.match(lebar, /data-pmd-unclamped="true"/); assert.match(lebar, /data-pmd-liquid="off"/)
})
gagal('lebar-penampil-hanya-memasang-kulit', () => {
  assert.equal(diterima.length, 1, 'penampil harus dirender tepat sekali')
  assert.deepEqual([...penampilLebar.layers], ['surface']); assert.equal(penampilLebar.dissect, 0)
  assert.deepEqual(penampilLebar.highlighted, []); assert.deepEqual(penampilLebar.focusKeywords, [], 'kata fokus kosong, bukan null: kamera tidak boleh dipulangkan tiap render')
  assert.match(lebar, /data-stub-viewer="surface"/)
})
gagal('bingkai-awal-adalah-seluruh-tubuh', () => { const f = regionFrameById('all'); assert.ok(f.ok); assert.deepEqual(penampilLebar.homeFrame, f.ok ? f.frame : null); assert.equal(typeof penampilLebar.onPick, 'function') })
gagal('lebar-rel-kedalaman-tujuh-perhentian-satu-terpilih', () => {
  assert.match(lebar, /data-atlas-depth-rail="v1"/); assert.match(lebar, /role="radiogroup"/)
  for (let d = 0; d <= 6; d += 1) assert.match(lebar, new RegExp(`data-depth-stop="${d}"`), `perhentian ${d}`)
  assert.equal(hitung(lebar, /data-depth-stop="/g), 7); assert.equal(hitung(lebar, /role="radio" aria-checked="true"/g), 1); assert.equal(hitung(lebar, /role="radio" aria-checked="false"/g), 6)
  assert.match(lebar, /aria-label="Skin, depth 1 of 7" tabindex="0" data-depth-stop="0"/, 'kulit terpilih dan satu-satunya yang bisa ditab')
  assert.equal(hitung(lebar, /tabindex="-1" data-depth-stop="/g), 6, 'enam perhentian lain dijangkau dengan panah, bukan Tab')
  for (const n of ['Skin', 'Muscles', 'Vessels', 'Nerves', 'Lymph', 'Organs', 'Skeleton']) assert.match(lebar, new RegExp(`>${n}</span>`), `label rel ${n}`)
})
gagal('lebar-tujuh-wilayah-seluruh-tubuh-aktif', () => {
  const grup = /aria-label="Frame a body region"[^>]*>(.*?)<\/div>/s.exec(lebar)?.[1] ?? ''
  assert.equal(hitung(grup, /<button/g), 7); assert.equal(hitung(grup, /aria-pressed="true"/g), 1)
  assert.match(grup, /aria-pressed="true"[^>]*>Whole body</)
  for (const n of ['Head &amp; neck', 'Thorax', 'Abdomen', 'Pelvis', 'Upper limbs', 'Lower limbs']) assert.match(grup, new RegExp(`>${n}<`))
})
gagal('lebar-pencarian-dan-kamera', () => {
  assert.match(lebar, /data-atlas-search="v1"/); assert.match(lebar, /<input[^>]*role="searchbox"[^>]*>/); assert.match(/<input[^>]*role="searchbox"[^>]*>/.exec(lebar)?.[0] ?? '', /maxLength="80"/i, 'kolom cari dibatasi 80 karakter')
  for (const n of ['Zoom in', 'Zoom out', 'Front view', 'Back view', 'Reset to whole body']) assert.match(lebar, new RegExp(`aria-label="${n}"`), n)
})
gagal('tiga-tahap-satu-terpilih', () => {
  assert.equal(hitung(lebar, /role="tab"/g), 3); assert.equal(hitung(lebar, /role="tab" aria-selected="true"/g), 1)
  for (const n of ['1. Anatomy', '2. Living Physiology', '3. Clinical Relevance']) assert.match(lebar, new RegExp(`aria-label="${n}"`))
  assert.match(lebar, /role="tab" aria-selected="true" aria-label="1\. Anatomy"/)
})
gagal('lebar-panel-seluruh-tubuh-dengan-tujuh-lapisan', () => {
  assert.match(lebar, /data-testid="atlas-side-panel"/); assert.match(lebar, /Whole-Body Exploration/); assert.match(lebar, /Anatomical Architecture/)
  assert.equal(hitung(lebar, /type="checkbox"/g), 7)
  assert.equal(hitung(lebar, /type="checkbox"[^>]*checked=""/g), 7, 'mode kupas di layar lebar: ketujuh lapisan diminta')
  assert.equal(hitung(lebar, />Shown · /g), 1, 'hanya kulit yang benar-benar tampil'); assert.equal(hitung(lebar, />Behind the skin · /g), 6)
  for (const u of ['1.0 MB', '5.6 MB', '12 MB', '7.8 MB', '0.7 MB', '3.7 MB', '2.7 MB']) assert.ok(lebar.includes(u), `ukuran ${u}`)
})
gagal('penanda-kebenaran-selalu-terlihat', () => { assert.match(lebar, /Reference anatomy · not a scan of you/); assert.match(lebar, /Peeled body/) })
gagal('setiap-tombol-punya-nama', () => {
  for (const m of lebar.matchAll(/<button([^>]*)>(.*?)<\/button>/gs)) {
    const bernama = /aria-label="[^"]+"/.test(m[1]) || m[2].replace(/<[^>]+>/g, '').trim().length > 0
    assert.ok(bernama, `tombol tanpa nama: ${m[0].slice(0, 120)}`)
  }
})

// ── proyeksi ponsel ──
const g = globalThis as unknown as { window?: unknown; navigator?: unknown }
const lama = { window: g.window, navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator') }
g.window = { innerWidth: 390, innerHeight: 844, addEventListener() {}, removeEventListener() {} }
Object.defineProperty(globalThis, 'navigator', { value: { maxTouchPoints: 5 }, configurable: true })
const ponsel = render()
const penampilPonsel = diterima[0]
g.window = lama.window
if (lama.navigator) Object.defineProperty(globalThis, 'navigator', lama.navigator)
gagal('ponsel-proyeksi-lembar-mengintip', () => {
  assert.match(ponsel, /data-atlas-projection="phone"/); assert.match(ponsel, /data-atlas-sheet="peek"/)
  assert.match(ponsel, /data-atlas-sheet="peek"[^>]*style="[^"]*height:148px/, 'lembar mengintip setinggi 148px')
  assert.match(ponsel, /bottom:148px"><div data-stub-viewer=/, 'kanvas berakhir tepat di atas lembar yang mengintip'); assert.match(ponsel, /Tap any structure/)
  assert.match(ponsel, /aria-label="Open the inspector" aria-expanded="false"/)
})
gagal('ponsel-kontrol-yang-sama-tetap-ada', () => {
  assert.deepEqual([...penampilPonsel.layers], ['surface']); assert.equal(hitung(ponsel, /data-depth-stop="/g), 7)
  assert.equal(hitung(/aria-label="Frame a body region"[^>]*>(.*?)<\/div>/s.exec(ponsel)?.[1] ?? '', /<button/g), 7)
  assert.match(ponsel, /aria-label="Search a structure"/); assert.match(ponsel, /aria-label="Reset to whole body"/)
  assert.equal(hitung(ponsel, /role="tab"/g), 3)
  for (const n of ['>Anatomy<', '>Physiology<', '>Clinical<']) assert.ok(ponsel.includes(n), `label pendek ${n}`)
  assert.doesNotMatch(ponsel, />1\. Anatomy</, 'label panjang meluap di 390px; hanya sebagai aria-label')
})
gagal('ponsel-lembar-mengintip-tidak-menyisakan-kontrol-tersembunyi', () => {
  assert.equal(hitung(ponsel, /type="checkbox"/g), 0, 'isi lembar tidak dirender saat mengintip: tidak ada kontrol tak terlihat di urutan tab')
  assert.doesNotMatch(ponsel, /Whole-Body Exploration/); assert.doesNotMatch(ponsel, /aria-hidden="true"[^>]*>[^<]*<button/)
})
gagal('ponsel-mulai-dari-pelat-fokus-yang-ringan', () => {
  assert.match(ponsel, /data-atlas-plate="focus"/, 'ponsel: satu sistem + rangka per kedalaman, bukan enam lapisan sekaligus')
  assert.match(lebar, /data-atlas-plate="peeled"/, 'berpasangan: layar lebar mulai dari tubuh terkupas')
  assert.match(ponsel, /data-atlas-depth="0"/); assert.match(lebar, /data-atlas-depth="0"/)
})
gagal('panggung-menyatakan-cakupan-gelap-di-kedua-proyeksi', () => {
  // Panggung gelap di KEDUA tema aplikasi: tanpa cakupan ini panel ber-`dark:` yang diproyeksikan ke sini saat aplikasi
  // bertema terang memakai teks tema-terang di atas latar gelap (terukur axe: 2.44:1).
  assert.match(lebar, /<div class="as-root dark"/); assert.match(ponsel, /<div class="as-root dark"/)
  assert.equal(hitung(lebar, /class="as-root/g), 1); assert.equal(hitung(ponsel, /class="as-root/g), 1)
  assert.match(lebar, /<input[^>]*class="as-search-input"[^>]*role="searchbox"/)
})
gagal('berpasangan-lebar-vs-ponsel-hanya-proyeksi-yang-berbeda', () => { assert.doesNotMatch(lebar, /data-atlas-sheet=/); assert.doesNotMatch(ponsel, /Deck ⇥/); assert.match(lebar, /Deck ⇥/) })

// ── cacat yang pernah terukur tidak boleh kembali: beranda tidak memiliki adegan WebGL sendiri ──
const sumberBeranda = readFileSync('src/domains/body-exposure/ui/BodyExposureAtlasHome.tsx', 'utf8')
const sumberUi = ['DepthRail.tsx', 'StageSearch.tsx', 'stageTokens.ts'].map((f) => readFileSync(`src/domains/body-exposure/ui/atlas-stage/${f}`, 'utf8'))
gagal('beranda-tidak-memiliki-webgl-sendiri', () => {
  assert.doesNotMatch(sumberBeranda, /from 'three|WebGLRenderer|OrbitControls|GLTFLoader|muatAtlas/, 'beranda memproyeksikan penampil bersama, bukan penampil kedua')
  assert.doesNotMatch(sumberBeranda, /replaceChildren/, 'replaceChildren pernah menghapus slider kupas, tab wilayah dan kolom cari dari DOM')
  assert.doesNotMatch(sumberBeranda, /components\//, 'domain tidak boleh mengimpor src/components')
})
gagal('tanpa-html-mentah-atau-eval', () => { for (const s of [sumberBeranda, ...sumberUi]) assert.doesNotMatch(s, /dangerouslySetInnerHTML|\.innerHTML|\beval\(|new Function\(|document\.write/) })
gagal('gaya-tanpa-important-dan-gerak-opt-in', () => {
  const css = sumberUi[2]
  // Satu-satunya !important yang diizinkan: kolom cari harus tetap transparan melawan aturan global
  // `.dark input { background-color … !important }`, yang tidak dapat dikalahkan tanpa !important (terukur: kotak abu-abu
  // di dalam pil cari pada tema gelap). Di luar aturan itu CSS panggung tetap tanpa !important.
  const aturanCari = '[data-atlas-stage] .as-root input.as-search-input { background-color: transparent !important; border-color: transparent !important; }'
  assert.ok(css.includes(aturanCari), 'aturan kolom cari ada, persis'); assert.doesNotMatch(css.replace(aturanCari, ''), /!important/)
  assert.match(css, /prefers-reduced-motion: no-preference/); assert.match(css, /html:not\(\.reduce-motion\)/)
  assert.equal(hitung(css, /transition:/g), 2); assert.equal(hitung(css.split('@media (prefers-reduced-motion: no-preference)')[0], /transition:/g), 0, 'transisi hanya ada di dalam blok opt-in')
})
gagal('akar-komposisi-menyambung-penampil-bersama', () => {
  const rute = readFileSync('src/app/BodyExposureAtlasRoute.tsx', 'utf8')
  assert.match(rute, /from '\.\.\/components\/bodyhub\/Body3D'/); assert.match(rute, /<BodyExposureAtlasHome Viewer=\{AtlasViewer\} sendCamera=\{sendCamera\} \/>/)
  assert.match(rute, /homeFrame=\{homeFrame\}/); assert.match(rute, /'panacea:body3d-camera'/)
  assert.match(readFileSync('src/main.tsx', 'utf8'), /const BodyExposureAtlasHome = lazy\(\(\) => import\('\.\/app\/BodyExposureAtlasRoute'\)\)/)
})

// ── penampil bersama: tambahan harus lewat penjadwal bersama dan kebijakan murni ──
const body3d = readFileSync('src/components/bodyhub/Body3D.tsx', 'utf8')
gagal('body3d-memilih-lewat-kebijakan-murni', () => {
  assert.match(body3d, /const pilih = firstPickableIndex\(hits\.map\(\(hit\) => kandidatPilih\(hit\.object\)\)\)/)
  assert.match(body3d, /if \(pilih < 0\) return/); assert.doesNotMatch(body3d, /hits\[0\]\.object/, 'benturan pertama bisa berupa lapisan pudar atau simpul tersembunyi')
  assert.match(body3d, /onPickRef\.current\(rawName, humanizeStructureName\(rawName\), sourceLayer\?\.key\)/)
})
gagal('body3d-terbang-lewat-penjadwal-bersama-tanpa-raf-kedua', () => {
  assert.match(body3d, /const langkah = stepTween\(penerbangan\.tween,/); assert.match(body3d, /if \(penerbangan\) renderScheduler\.request\(\)/)
  assert.equal(hitung(body3d, /requestAnimationFrame\(/g), 1, 'satu-satunya RAF adalah milik penjadwal bersama')
  assert.match(body3d, /requestFrame: \(callback\) => requestAnimationFrame\(callback\)/)
  assert.match(body3d, /controls\.addEventListener\('start', batalkanPenerbangan\)/); assert.match(body3d, /controls\.removeEventListener\('start', batalkanPenerbangan\)/)
})
gagal('body3d-menghormati-gerak-dikurangi', () => {
  assert.match(body3d, /classList\.contains\('reduce-motion'\)/); assert.match(body3d, /prefers-reduced-motion: reduce/)
  assert.match(body3d, /if \(sudahDiSana \|\| gerakDikurangi\(\)\) \{/)
})
gagal('body3d-bingkai-divalidasi-dan-gagal-tertutup', () => {
  assert.match(body3d, /const pose = bingkaiSah\(bingkai\) \? viewPose\(bingkai\.view, bingkai\.center, bingkai\.size, cam\.fov, cam\.aspect\) : null/)
  assert.match(body3d, /const poseRumah = bingkaiSah\(rumah\) \? viewPose\(/)
})

console.log(`atlas home render: wide + phone projections from one state; viewer mounts ${[...penampilLebar.layers].join(',')} first; ${hitung(lebar, /<button/g)} wide / ${hitung(ponsel, /<button/g)} phone controls, all named`)
