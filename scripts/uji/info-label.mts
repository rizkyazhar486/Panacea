import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'

// Node tidak menjalankan .tsx secara langsung: bundel komponen apa adanya (react tetap eksternal).
const out = await build({
  entryPoints: ['src/shared/ui/InfoLabel.tsx'], bundle: true, write: false, format: 'esm', platform: 'node',
  jsx: 'automatic', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
})
// Ditulis di dalam repo agar `react` ter-resolve dari node_modules.
mkdirSync('node_modules/.cache', { recursive: true })
const bundle = 'node_modules/.cache/info-label.uji.mjs'
writeFileSync(bundle, out.outputFiles[0].text)
const { InfoLabel } = await import(pathToFileURL(resolve(bundle)).href)

const html = renderToStaticMarkup(createElement(InfoLabel, { label: 'Heart', info: 'The pump of the circulation.' }))
// Positif: satu kata terlihat, tombol i tertutup, panel tersembunyi.
assert.match(html, /info-label__word">Heart</, 'the label word is shown')
assert.match(html, /aria-expanded="false"/, 'details start collapsed')
assert.match(html, /aria-label="Show details: Heart"/, 'the i button has an accessible name that includes the label')
assert.match(html, /role="region"[^>]*hidden/, 'the explanation panel is hidden until opened')
assert.match(html, /aria-controls="([^"]+)"/, 'the button controls a panel')
const id = /aria-controls="([^"]+)"/.exec(html)![1]
assert.match(html, new RegExp(`id="${id}"`), 'aria-controls points at the real panel id')
// Negatif berpasangan: dua instans tidak boleh berbagi id panel.
const two = renderToStaticMarkup(createElement('div', null, createElement(InfoLabel, { label: 'A', info: 'a' }), createElement(InfoLabel, { label: 'B', info: 'b' })))
const ids = [...two.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1])
assert.equal(new Set(ids).size, 2, 'each label gets its own panel id')
// Gaya: lantai sentuh 44px dan fokus terlihat harus tetap ada.
const css = readFileSync('src/shared/ui/infoLabel.css', 'utf8')
assert.match(css, /info-label__button \{[^}]*width: 44px; height: 44px/, 'i button keeps the 44px touch floor')
assert.match(css, /info-label__button:focus-visible/, 'i button keeps a visible keyboard focus ring')
assert.match(css, /prefers-reduced-motion: no-preference/, 'motion is opt-in via prefers-reduced-motion')
// Pemakaian di SectionTitle: tombol i hanya muncul bila `info` ada, dan info menggantikan subtitle.
const ui = readFileSync('src/components/ui/ui.tsx', 'utf8')
assert.match(ui, /\{!info && subtitle &&/, 'info replaces the subtitle on the main surface')
assert.match(ui, /\{info && \(\s*<button/, 'the i button renders only when info is provided')
assert.match(ui, /aria-controls=\{infoOpen \? infoId : undefined\}/, 'aria-controls only points at a panel that exists')
assert.match(readFileSync('src/pages/bodyhub/BodyExplorer.tsx', 'utf8'), /<SectionTitle[\s\S]{0,300}?\binfo="/, 'Body Explorer uses the one-word + i pattern')
console.log('InfoLabel verified: collapsed by default, labelled, unique ids, 44px floor, focus ring, reduced-motion safe.')
