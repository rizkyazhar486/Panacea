// Dek fisiologi & klinis Body Exposure dirender NYATA (SSR) di SETIAP tab-nya, lalu diaudit:
//   - setiap kontrol formulir punya nama yang dapat diakses (axe `label`, WCAG 4.1.2);
//   - setiap tombol bernama; setiap grup pilihan menyatakan pilihan aktifnya (aria-pressed), tepat satu;
//   - setiap grafik SVG punya alternatif teks (role=img + aria-label) atau disembunyikan dari pembaca layar;
//   - slider menyebut nilainya BERSAMA satuannya (aria-valuetext), bukan angka telanjang;
//   - pasangan warna yang dulu gagal kontras (diukur axe-core 4.10.2 di peramban) kini >= 4.5:1.
// Baseline terukur sebelum perbaikan: 18 node `label` kritis + 18 node `color-contrast` serius.
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ORGAN_BIOMECHANICS_CATALOG, GI_PERISTALSIS_CATALOG } from '../../src/domains/body-exposure/engine/softTissueBiomechanicsEngine.ts'
import { DECK_ACTIVE_FILL, sliderValueText } from '../../src/domains/body-exposure/ui/deck-kit/deckA11y.ts'
import { defaultPhysiologyCatalog } from '../../src/domains/body-exposure/engine/system-physiology/physiologyCatalog.ts'
import { planSystemIndex, planSystemPhysiology } from '../../src/domains/body-exposure/engine/system-physiology/systemPhysiology.ts'
import { simulationsFor } from '../../src/domains/body-exposure/engine/system-physiology/systemSimulations.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const hitung = (teks: string, pola: RegExp) => (teks.match(pola) ?? []).length

// ── audit markup: murni, diuji sendiri di bawah sebelum dipercaya ──
interface Temuan { aturan: 'kontrol-tanpa-nama' | 'tombol-tanpa-nama' | 'grafik-tanpa-alternatif'; html: string }
function audit(html: string): Temuan[] {
  const temuan: Temuan[] = []
  const labelUntuk = new Set([...html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)].map((m) => m[1]))
  const dibungkus: Array<[number, number]> = []
  for (const m of html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)) {
    if (m[1].replace(/<[^>]+>/g, '').trim()) dibungkus.push([m.index, m.index + m[0].length])
  }
  for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const a = m[2]
    if (/\btype="hidden"/.test(a)) continue
    const id = a.match(/\bid="([^"]+)"/)?.[1]
    const bernama = /\baria-label="[^"]*[^"\s][^"]*"/.test(a) || /\baria-labelledby="[^"]+"/.test(a)
      || (id !== undefined && labelUntuk.has(id)) || dibungkus.some(([awal, akhir]) => m.index > awal && m.index < akhir)
    if (!bernama) temuan.push({ aturan: 'kontrol-tanpa-nama', html: m[0].slice(0, 110) })
  }
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const bernama = /\baria-label="[^"]*[^"\s][^"]*"/.test(m[1]) || m[2].replace(/<[^>]+>/g, '').trim().length > 0
    if (!bernama) temuan.push({ aturan: 'tombol-tanpa-nama', html: m[0].slice(0, 110) })
  }
  for (const m of html.matchAll(/<svg\b([^>]*)>/g)) {
    const a = m[1]
    const baik = /\baria-hidden="true"/.test(a) || (/\brole="img"/.test(a) && /\baria-label="[^"]*[^"\s][^"]*"/.test(a))
    if (!baik) temuan.push({ aturan: 'grafik-tanpa-alternatif', html: m[0].slice(0, 110) })
  }
  return temuan
}
const bersih = (html: string) => assert.deepEqual(audit(html), [], 'pelanggaran aksesibilitas')

// Audit itu sendiri diuji berpasangan: tiap aturan menolak kasusnya dan menerima kembarannya yang hanya beda di kondisi itu.
gagal('audit-menolak-kontrol-tanpa-nama-dan-menerima-kembarannya', () => {
  assert.equal(audit('<input type="range" value="1"/>')[0]?.aturan, 'kontrol-tanpa-nama')
  assert.deepEqual(audit('<input type="range" aria-label="Depth" value="1"/>'), [])
  assert.equal(audit('<input type="range" aria-label=" " value="1"/>').length, 1, 'nama kosong bukan nama')
  assert.deepEqual(audit('<label for="a">Depth</label><input id="a" type="range"/>'), [])
  assert.equal(audit('<label for="b">Depth</label><input id="a" type="range"/>').length, 1, 'label untuk id lain tidak menamai')
  assert.deepEqual(audit('<label>Intact <input type="checkbox"/></label>'), [])
  assert.equal(audit('<label><input type="checkbox"/></label>').length, 1, 'label pembungkus tanpa teks tidak menamai')
  assert.deepEqual(audit('<input type="hidden" value="x"/>'), [], 'kontrol tersembunyi tidak diaudit')
  assert.equal(audit('<select><option>a</option></select>')[0]?.aturan, 'kontrol-tanpa-nama')
})
gagal('audit-menolak-tombol-dan-grafik-tanpa-nama', () => {
  assert.equal(audit('<button type="button"><svg aria-hidden="true"></svg></button>')[0]?.aturan, 'tombol-tanpa-nama')
  assert.deepEqual(audit('<button type="button" aria-label="Reset"><svg aria-hidden="true"></svg></button>'), [])
  assert.deepEqual(audit('<button type="button">Reset</button>'), [])
  assert.equal(audit('<svg viewBox="0 0 1 1"></svg>')[0]?.aturan, 'grafik-tanpa-alternatif')
  assert.equal(audit('<svg role="img" viewBox="0 0 1 1"></svg>').length, 1, 'role=img tanpa label belum cukup')
  assert.deepEqual(audit('<svg role="img" aria-label="PV loop" viewBox="0 0 1 1"></svg>'), [])
  assert.deepEqual(audit('<svg aria-hidden="true" viewBox="0 0 1 1"></svg>'), [])
})

const { build } = await import('esbuild')
const out = await build({
  stdin: {
    contents: [
      "export { CardiopulmonaryCouplingDeck } from './src/domains/body-exposure/ui/CardiopulmonaryCouplingDeck.tsx'",
      "export { SoftTissueBiomechanicsDeck } from './src/domains/body-exposure/ui/SoftTissueBiomechanicsDeck.tsx'",
      "export { NeuroFascicularReflexDeck } from './src/domains/body-exposure/ui/NeuroFascicularReflexDeck.tsx'",
      "export { CoronaryTerritoryPanel } from './src/domains/body-exposure/ui/CoronaryTerritoryPanel.tsx'",
      "export { ReferredPainDermatomeStudio } from './src/domains/body-exposure/ui/ReferredPainDermatomeStudio.tsx'",
      "export { SystemPhysiologyExplorer } from './src/domains/body-exposure/ui/system-physiology/SystemPhysiologyExplorer.tsx'",
      "export { evidenceLine } from './src/domains/body-exposure/ui/system-physiology/SystemIndex.tsx'",
      "export { Segmented, CouplingBadge } from './src/domains/body-exposure/ui/atlas-stage/StagePieces.tsx'",
    ].join('\n'),
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom'], loader: { '.css': 'empty' }, logLevel: 'silent',
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/atlas-deck-a11y.uji.mjs', out.outputFiles[0].text)
const m = await import(pathToFileURL(resolve('node_modules/.cache/atlas-deck-a11y.uji.mjs')).href)
const html = (komponen: unknown, props: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(komponen as never, props as never))
/** Tombol dengan aria-pressed="true" yang teksnya memuat `nama`. */
const ditekan = (teks: string, nama: string) => new RegExp(`<button[^>]*aria-pressed="true"[^>]*>(?:(?!</button>)[\\s\\S])*${nama}`).test(teks)

// ── Cardiopulmonary: 6 slider bernama + bernilai-bersatuan, 5 skenario satu ditekan, loop PV beralternatif ──
gagal('kardiopulmoner-semua-kontrol-bernama', () => {
  const k = html(m.CardiopulmonaryCouplingDeck)
  bersih(k)
  assert.equal(hitung(k, /type="range"/g), 6)
  for (const nama of ['Inotropy Ees (Elastance)', 'End-Diastolic Volume (Ved)', 'End-Systolic Volume (Ves)', 'Heart Rate (HR)', 'Respiratory Rate (RR)', 'Tidal Volume (VT)']) {
    assert.ok(k.includes(`aria-label="${nama}"`), `slider bernama: ${nama}`)
  }
  for (const nilai of ['2.2 mmHg/mL', '120 mL', '50 mL', '72 bpm', '14 breaths per minute', '500 mL']) {
    assert.ok(k.includes(`aria-valuetext="${nilai}"`), `nilai bersatuan: ${nilai}`)
  }
})
gagal('kardiopulmoner-skenario-tepat-satu-ditekan', () => {
  const k = html(m.CardiopulmonaryCouplingDeck)
  assert.match(k, /role="group" aria-label="Clinical scenarios"/)
  assert.equal(hitung(k, /aria-pressed="true"/g), 1); assert.equal(hitung(k, /aria-pressed="false"/g), 4)
  assert.ok(ditekan(k, 'Resting Baseline'), 'yang ditekan = skenario awal')
})
gagal('kardiopulmoner-loop-pv-punya-alternatif-teks-bernilai', () => {
  const k = html(m.CardiopulmonaryCouplingDeck)
  // Angka yang sama dengan pengukur di bawah grafik (mesin: SV 70 mL, EF 58.33 %, Pes 88 mmHg pada pra-atur istirahat).
  assert.match(k, /<svg[^>]*role="img"[^>]*aria-label="Left ventricular pressure–volume loop: stroke volume 70 mL, ejection fraction 58\.33%, end-systolic pressure 88 mmHg"/)
  assert.ok(k.includes('>58.33%<') || k.includes('58.33<!-- -->%'), 'pengukur EF menampilkan angka yang sama')
})

// ── Soft tissue: tiga tab, masing-masing diaudit ──
const ORGAN = Object.values(ORGAN_BIOMECHANICS_CATALOG).length
const SEGMEN = Object.keys(GI_PERISTALSIS_CATALOG).length
gagal('jaringan-lunak-palpasi', () => {
  const k = html(m.SoftTissueBiomechanicsDeck, { initialTab: 'palpation' })
  bersih(k)
  assert.equal(hitung(k, /type="range"/g), 3)
  for (const nama of ['Indentation Depth (d)', 'Probe Velocity (v)', 'Tool Tip Radius (R)']) assert.ok(k.includes(`aria-label="${nama}"`), nama)
  assert.ok(k.includes('aria-valuetext="4.0 mm"') && k.includes('aria-valuetext="10.0 mm/s"') && k.includes('aria-valuetext="2.5 mm"'))
  assert.match(k, /role="group" aria-label="Biomechanics view"/); assert.match(k, /role="group" aria-label="Tissue"/)
  // Terukur di peramban: baris tab 377px di panel 367px (ponsel) = inspektur bisa digeser menyamping 41px. Baris kini boleh membungkus.
  assert.match(k, /role="group" aria-label="Biomechanics view" style="[^"]*flex-wrap:wrap;max-width:100%/)
  assert.equal(hitung(k, /aria-pressed="true"/g), 2, 'satu tab + satu jaringan'); assert.equal(hitung(k, /aria-pressed="false"/g), 2 + (ORGAN - 1))
  assert.ok(ditekan(k, 'Palpation Contact')); assert.match(k, /<svg[^>]*role="img"[^>]*aria-label="Neo-Hookean stress–strain curve/)
  assert.doesNotMatch(k, /opacity:0\.7[^"]*">\(/, 'satuan kPa tidak lagi diredupkan di bawah ambang kontras')
})
gagal('jaringan-lunak-diafragma', () => {
  const k = html(m.SoftTissueBiomechanicsDeck, { initialTab: 'diaphragm_excursion' })
  bersih(k)
  assert.ok(ditekan(k, 'Diaphragm Shift')); assert.match(k, /role="group" aria-label="Breathing mode"/)
  assert.equal(hitung(k, /aria-pressed="true"/g), 2); assert.equal(hitung(k, /aria-pressed="false"/g), 2 + 3)
  assert.ok(k.includes('aria-label="Cycle Phase (φ)"')); assert.match(k, /<svg[^>]*role="img"[^>]*aria-label="Diaphragm excursion/)
})
gagal('jaringan-lunak-peristalsis', () => {
  const k = html(m.SoftTissueBiomechanicsDeck, { initialTab: 'peristalsis' })
  bersih(k)
  assert.ok(ditekan(k, 'GI Peristalsis')); assert.match(k, /role="group" aria-label="Gut segment"/)
  assert.equal(hitung(k, /aria-pressed="true"/g), 2); assert.equal(hitung(k, /aria-pressed="false"/g), 2 + (SEGMEN - 1))
  assert.ok(k.includes('aria-label="Wave Timeline"') && k.includes('aria-valuetext="12.0 s"')); assert.match(k, /<svg[^>]*role="img"[^>]*aria-label="Peristaltic wave/)
  assert.doesNotMatch(k, /opacity:0\.8[^"]*">\(/, 'satuan cpm tidak lagi diredupkan')
})
gagal('jaringan-lunak-tab-tak-dikenal-jatuh-ke-palpasi', () => {
  const k = html(m.SoftTissueBiomechanicsDeck, { initialTab: 'constructor' })
  assert.ok(ditekan(k, 'Palpation Contact'), 'nilai warisan-objek/asing tidak membuka tab kosong')
})

// ── Neuro: tiga tab ──
gagal('neuro-tiga-tab-bersih-dan-menyatakan-pilihan', () => {
  for (const [tab, nama] of [['nerves', '12 Cranial Nerves'], ['reflexes', 'Brainstem Reflex Loops'], ['syndromes', 'Syndromic Localizer']] as const) {
    const k = html(m.NeuroFascicularReflexDeck, { initialTab: tab })
    bersih(k)
    assert.match(k, /role="group" aria-label="Neuro view"/); assert.ok(ditekan(k, nama), `tab ${tab} ditekan`)
    assert.ok(hitung(k, /aria-pressed="true"/g) >= 2, `${tab}: tab + pilihan di dalamnya`)
    assert.doesNotMatch(k, /#0284c7/i, 'biru 4.09:1 tidak dipakai lagi di balik teks putih')
  }
  // Terukur di peramban: baris tab 453px di panel 367px = geser menyamping 121px, tab ketiga terpotong. Baris kini boleh membungkus.
  const saraf = html(m.NeuroFascicularReflexDeck, { initialTab: 'nerves' })
  assert.match(saraf, /role="group" aria-label="Neuro view" style="[^"]*flex-wrap:wrap;max-width:100%/)
  // Saraf terpilih: label di dalam tombol mewarisi warna tombol. Warna tetap #bae6fd di atas isi aktif global terukur 4.05:1.
  const terpilih = /<button[^>]*aria-pressed="true"[^>]*>((?:(?!<\/button>)[\s\S])*CN III(?:(?!<\/button>)[\s\S])*)<\/button>/.exec(saraf)?.[1] ?? ''
  assert.ok(terpilih.includes('Oculomotor'), 'tombol saraf terpilih ditemukan'); assert.match(terpilih, /color:inherit/); assert.doesNotMatch(terpilih, /#bae6fd/i)
  const refleks = html(m.NeuroFascicularReflexDeck, { initialTab: 'reflexes' })
  assert.match(refleks, /role="group" aria-label="Stimulus side"/); assert.ok(ditekan(refleks, 'Stimulus Right Side'))
  assert.equal(hitung(refleks, /type="checkbox"/g), 4)
})

// ── Panel koroner & studio nyeri alih ──
gagal('koroner-dan-nyeri-alih-bersih', () => {
  bersih(html(m.CoronaryTerritoryPanel, { defaultOpen: true }))
  const n = html(m.ReferredPainDermatomeStudio)
  bersih(n)
  assert.match(n, /role="group" aria-label="Body side shown"/); assert.ok(ditekan(n, 'Anterior'))
  assert.doesNotMatch(n, /#3b82f6|#059669|#b45309/i, 'tiga warna yang gagal kontras di panggung gelap sudah diganti')
  assert.match(n, /class="[^"]*text-emerald-800 dark:text-emerald-200/); assert.match(n, /role="note"[^>]*class="[^"]*text-amber-900 dark:text-amber-100|class="[^"]*text-amber-900 dark:text-amber-100[^"]*"[^>]*role="note"/)
})

// ── kontras: rumus WCAG 2.x, pasangan yang diukur gagal di peramban ──
const lum = (hex: string) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
}
const kontras = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
gagal('kontras-rumus-benar-pada-nilai-acuan', () => {
  assert.equal(kontras('#ffffff', '#000000'), 21); assert.equal(kontras('#777777', '#777777'), 1)
  assert.ok(Math.abs(kontras('#ffffff', '#0284c7') - 4.09) < 0.02, 'cocok dengan ukuran axe untuk warna lama (4.09)')
  assert.ok(Math.abs(kontras('#ffffff', '#3b82f6') - 3.67) < 0.02, 'cocok dengan ukuran axe untuk warna lama (3.67)')
})
gagal('kontras-isi-aktif-dek-lolos-aa', () => {
  assert.match(DECK_ACTIVE_FILL, /^#[0-9a-f]{6}$/)
  assert.ok(kontras('#ffffff', DECK_ACTIVE_FILL) >= 4.5, `teks putih di atas ${DECK_ACTIVE_FILL}`)
  assert.ok(kontras('#ffffff', '#0284c7') < 4.5 && kontras('#ffffff', '#3b82f6') < 4.5, 'dua warna lama memang di bawah ambang (bukti aturan ini yang menolak)')
  // satuan di chip: warna penuh di atas latar chip yang diukur axe
  assert.ok(kontras('#94a3b8', '#182234') >= 4.5); assert.ok(kontras('#06b6d4', '#0d374c') >= 4.5)
})

// ── teks nilai slider: nilai + satuan; yang bukan angka hingga tidak diumumkan sama sekali ──
gagal('teks-nilai-slider-positif', () => {
  assert.equal(sliderValueText(2.2, 'mmHg/mL'), '2.2 mmHg/mL'); assert.equal(sliderValueText(4, 'mm', 1), '4.0 mm')
  assert.equal(sliderValueText(0.5, '', 1), '0.5', 'tanpa satuan: hanya nilai, tanpa spasi menggantung')
  assert.equal(sliderValueText(120, '  mL  '), '120 mL', 'satuan dirapikan')
})
gagal('teks-nilai-slider-menolak-bukan-angka-hingga', () => {
  for (const buruk of [NaN, Infinity, -Infinity, '12' as unknown as number, null as unknown as number, undefined as unknown as number]) {
    assert.equal(sliderValueText(buruk, 'mL'), undefined, `tidak mengumumkan ${String(buruk)}`)
  }
  assert.equal(sliderValueText(12, 'mL'), '12 mL', 'berpasangan: angka hingga yang sama bentuknya diterima')
})
gagal('teks-nilai-slider-batas-digit', () => {
  assert.equal(sliderValueText(0, 'mL'), '0 mL', 'nol adalah nilai, bukan kosong'); assert.equal(sliderValueText(-3.5, 'mm', 1), '-3.5 mm')
  assert.equal(sliderValueText(1.23456789, 'x', 0), '1 x'); assert.equal(sliderValueText(1.23456789, 'x', 6), '1.234568 x')
  for (const digit of [-1, 7, 1.5, NaN, Infinity, 100]) assert.equal(sliderValueText(1.5, 'x', digit), '1.5 x', `digit ${digit} diabaikan, tidak melempar`)
  assert.equal(sliderValueText(1.5, 7 as unknown as string), '1.5', 'satuan bukan string diabaikan')
})

// ── Body systems (tab Fisiologi): indeks 11 sistem + kartu setiap sistem, diaudit dan dihitung terhadap rencana mesin ──
const tanpa = () => {}
const penjelajah = (systemId: string | null) => html(m.SystemPhysiologyExplorer, { systemId, onSystem: tanpa, onSimulate: tanpa })
const KATALOG = defaultPhysiologyCatalog()
gagal('sistem-indeks-sebelas-tombol-bernama', () => {
  const k = penjelajah(null)
  bersih(k)
  assert.equal(hitung(k, /<button\b/g), 11)
  for (const sistem of KATALOG.systems) assert.ok(k.includes(`>${sistem.label}</span>`), `baris ${sistem.label}`)
  const indeks = planSystemIndex(KATALOG)
  assert.equal(indeks.ok, true)
  if (!indeks.ok) return
  for (const row of indeks.rows) assert.ok(k.includes(`>${m.evidenceLine(row)}</span>`), `${row.id}: baris bukti dari rencana`)
  assert.ok(k.includes('>Context only · 2 sourced mechanisms</span>'), 'jembatan kontekstual dinyatakan, mekanismenya sendiri tetap dihitung')
})
gagal('sistem-baris-bukti-setiap-cabang', () => {
  const baris = (fidelity: string, mechanismCount: number, gapCount: number) => m.evidenceLine({ fidelity, mechanismCount, gapCount })
  assert.equal(baris('direct', 0, 0), 'No sourced mechanism yet', 'tanpa sumber tampil sebagai celah, bukan nol')
  assert.equal(baris('direct', 1, 0), '1 sourced mechanism')
  assert.equal(baris('compound', 3, 7), '3 sourced mechanisms · 7 organs not yet sourced')
  assert.equal(baris('direct', 0, 1), 'No sourced mechanism yet · 1 organ not yet sourced')
  assert.equal(baris('contextual', 0, 0), 'Context only · no physiology model of its own yet')
  assert.equal(baris('contextual', 2, 0), 'Context only · 2 sourced mechanisms', 'berpasangan: hanya jumlah mekanisme yang berbeda')
  assert.equal(baris('contextual', 0, 2), 'Context only · No sourced mechanism yet · 2 organs not yet sourced', 'celah organ tidak disembunyikan pada sistem kontekstual')
})
gagal('sistem-setiap-kartu-bersih-dan-sesuai-rencana', () => {
  for (const sistem of KATALOG.systems) {
    const plan = planSystemPhysiology(sistem.id, KATALOG)
    assert.equal(plan.ok, true, sistem.id)
    if (!plan.ok) continue
    const v = plan.view
    const k = penjelajah(sistem.id)
    bersih(k)
    assert.ok(k.includes('← All body systems'), `${sistem.id}: jalan kembali`)
    const sitasi = v.mechanisms.reduce((n, mech) => n + mech.citations.length, 0)
    assert.equal(hitung(k, /<a\b/g), sitasi, `${sistem.id}: satu tautan per sumber`)
    assert.equal(hitung(k, /<a\b[^>]*target="_blank" rel="noopener noreferrer"/g), sitasi, `${sistem.id}: tautan keluar aman`)
    for (const mech of v.mechanisms) for (const c of mech.citations) assert.ok(k.includes(`href="${c.url}"`), `${sistem.id}: ${c.url}`)
    assert.equal(hitung(k, /<details\b/g), v.mechanisms.length + v.organGaps.length + (v.loops.length > 0 ? 1 : 0), `${sistem.id}: pengungkapan`)
    assert.equal(hitung(k, /<summary\b/g), hitung(k, /<details\b/g), `${sistem.id}: setiap pengungkapan punya ringkasan`)
    const simulasi = simulationsFor(sistem.id)
    for (const s of simulasi) assert.ok(k.includes(`>${s.label}</button>`), `${sistem.id}: tombol ${s.label}`)
    assert.equal(k.includes('No sourced mechanism for this system'), v.mechanisms.length === 0, `${sistem.id}: catatan celah hanya bila kosong`)
    assert.doesNotMatch(k, /undefined|NaN|\[object Object\]/, `${sistem.id}: tidak ada nilai bocor`)
  }
})
gagal('sistem-asing-gagal-tertutup-dengan-jalan-kembali', () => {
  const k = penjelajah('kidney')
  bersih(k)
  assert.match(k, /role="alert"/)
  assert.ok(k.includes('not in the atlas'))
  assert.ok(!k.includes('<article'), 'tidak ada kartu untuk sistem yang tidak ada')
  assert.ok(k.includes('← All body systems'))
})
gagal('segmen-label-terlihat-termuat-dalam-nama', () => {
  const k = html(m.Segmented, { label: 'View', value: 'a', onChange: tanpa, options: [{ id: 'a', label: 'Body Systems', short: 'Systems' }, { id: 'b', label: 'Neuro Reflexes' }] })
  bersih(k)
  assert.match(k, /<button[^>]*aria-pressed="true"[^>]*aria-label="Body Systems"[^>]*>Systems<\/button>/)
  assert.match(k, /<button(?![^>]*aria-label)[^>]*aria-pressed="false"[^>]*>Neuro Reflexes<\/button>/, 'berpasangan: tanpa label pendek, teks itu sendiri namanya')
})
gagal('lencana-kopling-tombol-hapus-cukup-besar', () => {
  const k = html(m.CouplingBadge, { prefix: 'Coupled to:', name: 'Kidney', layer: 'Organs', onClear: tanpa })
  bersih(k)
  assert.match(k, /<button[^>]*min-height:36px;min-width:44px[^>]*>Clear<\/button>/)
})

console.log('atlas deck a11y: 5 decks, every tab, 11 body-system cards — all controls named, one pressed per choice group, charts described, slider values carry units, fixed colour pairs >= 4.5:1')
