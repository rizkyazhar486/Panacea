import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import { foldsForcedOpen, foldsOpenForSession } from '../../src/shared/ui/foldsPreference.ts'

const out = await build({
  entryPoints: ['src/shared/ui/Fold.tsx'], bundle: true, write: false, format: 'esm', platform: 'node',
  jsx: 'automatic', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/fold.uji.mjs', out.outputFiles[0].text)
const { Fold } = await import(pathToFileURL(resolve('node_modules/.cache/fold.uji.mjs')).href)

// Positif / negatif / batas untuk parameter tautan.
assert.equal(foldsForcedOpen('#/body-explorer?folds=open'), true, 'folds=open opens every fold')
assert.equal(foldsForcedOpen('#/body-explorer?x=1&folds=open'), true, 'folds=open is found among other params')
assert.equal(foldsForcedOpen('#/body-explorer'), false, 'no query keeps folds closed')
assert.equal(foldsForcedOpen('#/body-explorer?folds=closed'), false, 'any other value keeps folds closed')
assert.equal(foldsForcedOpen('#/body-explorer?folds='), false, 'an empty value keeps folds closed')
assert.equal(foldsForcedOpen(''), false, 'an empty hash keeps folds closed')
assert.equal(foldsForcedOpen('#/x?xfolds=open'), false, 'a different param name does not open folds')

// Sesi: tautan sekali sudah cukup, bahkan bila hash ditulis ulang kemudian; tanpa tautan tetap tertutup.
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v) } } }
{
  const st = mem()
  assert.equal(foldsOpenForSession('#/body-explorer', st), false, 'no link, no stored preference: closed')
  assert.equal(foldsOpenForSession('#/body-explorer?folds=open', st), true, 'the link opens folds and is remembered')
  assert.equal(foldsOpenForSession('#/body-explorer', st), true, 'a later rewrite of the hash does not close them again')
  assert.equal(foldsOpenForSession('#/body-explorer', mem()), false, 'a different session without the link stays closed')
  assert.equal(foldsOpenForSession('#/x?folds=open', null), true, 'without storage the link alone still applies')
  const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
  assert.equal(foldsOpenForSession('#/x?folds=open', blocked), true, 'blocked storage falls back to the link')
  assert.equal(foldsOpenForSession('#/x', blocked), false, 'blocked storage without the link stays closed')
}

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
// Home: ringkasan harian, alat esensial dan tujuh kategori tetap terlihat (kontrak hierarki Home);
// bagian sekunder dilipat satu kata.
const home = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')
for (const w of ['Recovery', 'Widgets', 'Live', 'Stories', 'Deck']) assert.match(home, new RegExp(`<Fold label="${w}">`), `Home folds ${w}`)
assert.doesNotMatch(home, /<Fold label="[A-Za-z]+"><(HomeHealthBrief|HomeVisualLanding|HomeEssentialTools|SuperPageLauncher) \/>/, 'the first-viewport hierarchy (status, actions, tools, categories) is never folded')
// Alur QA harus membuka lipatan lewat tautan, bukan mengubah apa yang diuji.
for (const f of ['.github/workflows/stabilization-acceptance.yml', '.github/workflows/organ-3d-acceptance.yml']) {
  assert.doesNotMatch(readFileSync(f, 'utf8'), /#\/body-explorer(?!\?folds=open)\s*$/m, `${f} must open folds for body-explorer smokes`)
}
assert.match(readFileSync('src/main.tsx', 'utf8'), /\ncaptureFoldsPreference\(\)\n/, 'the app captures folds=open at boot, before any route can rewrite the hash')
console.log('Fold verified: closed by default, one word, content stays in DOM, link opens all, 3 folds, one 3D projection.')
