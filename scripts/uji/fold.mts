import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'

const out = await build({
  entryPoints: ['src/shared/ui/Fold.tsx'], bundle: true, write: false, format: 'esm', platform: 'node',
  jsx: 'automatic', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/fold.uji.mjs', out.outputFiles[0].text)
const { Fold, foldsForcedOpen } = await import(pathToFileURL(resolve('node_modules/.cache/fold.uji.mjs')).href)

// Positif / negatif / batas untuk parameter tautan.
assert.equal(foldsForcedOpen('#/body-explorer?folds=open'), true, 'folds=open opens every fold')
assert.equal(foldsForcedOpen('#/body-explorer?x=1&folds=open'), true, 'folds=open is found among other params')
assert.equal(foldsForcedOpen('#/body-explorer'), false, 'no query keeps folds closed')
assert.equal(foldsForcedOpen('#/body-explorer?folds=closed'), false, 'any other value keeps folds closed')
assert.equal(foldsForcedOpen('#/body-explorer?folds='), false, 'an empty value keeps folds closed')
assert.equal(foldsForcedOpen(''), false, 'an empty hash keeps folds closed')
assert.equal(foldsForcedOpen('#/x?xfolds=open'), false, 'a different param name does not open folds')

// Render: tertutup bawaan, satu kata, isi tetap ada di DOM (tak ada kendali yang hilang).
const html = renderToStaticMarkup(createElement(Fold, { label: 'Layers' }, createElement('button', null, 'Vessels')))
assert.match(html, /<details class="fold"/, 'a fold is a native details element')
assert.doesNotMatch(html, /<details[^>]*\sopen/, 'a fold is closed by default')
assert.match(html, /fold__word">Layers</, 'the fold shows one word')
assert.match(html, /<button>Vessels<\/button>/, 'folded content stays in the DOM, so no control disappears')

// Gaya: lantai sentuh dan huruf besar, fokus terlihat, gerak dihormati.
const css = readFileSync('src/shared/ui/fold.css', 'utf8')
assert.match(css, /min-height: 56px/, 'summary keeps a generous touch target')
assert.match(css, /fold__word \{ font-size: 1\.125rem/, 'fold word is 18px, not small print')
assert.match(css, /fold__summary:focus-visible/, 'summary keeps a visible keyboard focus ring')
assert.match(css, /prefers-reduced-motion: reduce/, 'chevron motion respects reduced motion')

// Pemakaian di Body Explorer: tiga lipatan satu kata; satu kanvas 3D utama.
const page = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')
for (const w of ['Modality', 'Ask', 'Explore']) assert.match(page, new RegExp(`<Fold label="${w}">`), `Body Explorer folds ${w}`)
assert.equal((page.match(/<Body3D\b/g) ?? []).length, 1, 'Body Explorer renders exactly one main 3D projection')
// Alur QA harus membuka lipatan lewat tautan, bukan mengubah apa yang diuji.
for (const f of ['.github/workflows/stabilization-acceptance.yml', '.github/workflows/organ-3d-acceptance.yml']) {
  assert.doesNotMatch(readFileSync(f, 'utf8'), /#\/body-explorer(?!\?folds=open)\s*$/m, `${f} must open folds for body-explorer smokes`)
}
console.log('Fold verified: closed by default, one word, content stays in DOM, link opens all, 3 folds, one 3D projection.')
