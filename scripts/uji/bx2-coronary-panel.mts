import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { writeFileSync, mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'

// Render panel teritori koroner (BX-2) apa adanya ke markup statis: struktur, label kejujuran, dan batas.
const out = await build({
  entryPoints: ['src/domains/body-exposure/ui/CoronaryTerritoryPanel.tsx'], bundle: true, write: false, format: 'esm', platform: 'node',
  jsx: 'automatic', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/coronary-panel.uji.mjs', out.outputFiles[0].text)
const { CoronaryTerritoryPanel } = await import(pathToFileURL(resolve('node_modules/.cache/coronary-panel.uji.mjs')).href)
const html = renderToStaticMarkup(createElement(CoronaryTerritoryPanel))

// 17 tombol segmen + 4 tombol filter, semuanya <button type="button"> dengan nama aksesibel
const segmentButtons = [...html.matchAll(/<button[^>]*aria-label="Segment (\d+), ([^"]+), assigned to (LAD|LCx|RCA)(, contested)?"/g)]
assert.equal(segmentButtons.length, 17, '17 segment buttons')
assert.deepEqual(segmentButtons.map((m) => Number(m[1])).sort((a, b) => a - b), Array.from({ length: 17 }, (_, i) => i + 1))
const branchOf = (n: number) => segmentButtons.find((m) => Number(m[1]) === n)![3]
assert.equal(branchOf(1), 'LAD'); assert.equal(branchOf(3), 'RCA'); assert.equal(branchOf(5), 'LCx'); assert.equal(branchOf(16), 'LCx')
assert.deepEqual(segmentButtons.filter((m) => m[4]).map((m) => Number(m[1])), [12, 16], 'only segments 12 and 16 are marked contested')
for (const label of ['All', 'LAD', 'LCx', 'RCA']) assert.match(html, new RegExp(`<button[^>]*aria-pressed="(true|false)"[^>]*>${label}</button>`))
assert.match(html, /aria-pressed="true"[^>]*>All<\/button>/, 'All is the default filter')
assert.equal((html.match(/type="button"/g) ?? []).length, 21)

// cincin dan label kejujuran
for (const ring of ['Basal (1–6)', 'Mid-cavity (7–12)', 'Apical (13–16)', 'Apex (17)']) assert.ok(html.includes(ring), ring)
assert.match(html, /Atlas reference — not patient-specific/)
assert.match(html, /not for diagnosis or procedural targeting/)
assert.match(html, /Dominance does not change this table/)
assert.match(html, /approximately 85%/)
assert.match(html, /not a drawn bull&#x27;s-eye|not a drawn bull's-eye/)
assert.match(html, /25201553/); assert.match(html, /32072257/); assert.match(html, /11815441/)

// batas: tidak menyatakan validasi klinis, tidak ada diagram klaim, tidak ada angka dosis/keputusan
for (const forbidden of [/clinically validated/i, /diagnos(is|e) (of|for) the patient/i, /your (heart|coronary)/i, /recommend/i]) assert.doesNotMatch(html, forbidden, String(forbidden))
assert.ok(html.startsWith('<details'), 'collapsed disclosure by default')
assert.doesNotMatch(html.slice(0, 80), /\sopen[=\s>]/)
console.log('bx2-coronary-panel: 17 segmen, filter, label atlas, batas dominansi, sumber, dan kolaps default')
