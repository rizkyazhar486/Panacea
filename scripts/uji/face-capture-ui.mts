// Wajah dari foto, langkah 1, dirender NYATA (SSR): sebelum persetujuan pemilih foto terkunci, batas "bukan
// pengukuran" terlihat, dan tidak ada tombol selesai tanpa foto.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { audit } from './support/markupAudit.mts'

const { build } = await import('esbuild')
const out = await build({
  stdin: { contents: "export { FaceCapture } from './src/domains/body-exposure/ui/face-capture/FaceCapture.tsx'", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'three', 'three/*', '@mediapipe/*'], loader: { '.css': 'empty' }, logLevel: 'silent',
  // Vite's `?url` asset imports (the MediaPipe runtime) have no meaning in an SSR test; stub them.
  plugins: [{ name: 'url-stub', setup(b) { b.onResolve({ filter: /\?url$/ }, (a) => ({ path: a.path, namespace: 'url-stub' })); b.onLoad({ filter: /.*/, namespace: 'url-stub' }, () => ({ contents: 'export default ""', loader: 'js' })) } }],
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/face-capture-ui.uji.mjs', out.outputFiles[0]!.text)
const m = await import(pathToFileURL(resolve('node_modules/.cache/face-capture-ui.uji.mjs')).href)

const html = renderToStaticMarkup(createElement(m.FaceCapture))
assert.deepEqual(audit(html), [], 'temuan aksesibilitas')
assert.match(html, /Estimated from a photo — a likeness, not a measurement of your anatomy\./)
assert.match(html, /<input type="checkbox"\/>/, 'persetujuan belum dicentang')
assert.match(html, /<input type="file" accept="image\/jpeg,image\/png,image\/webp" disabled=""\/>/, 'pemilih foto terkunci tanpa persetujuan')
assert.match(html, /Agree above to add a photo/)
assert.doesNotMatch(html, /Done aligning|Cancel|<img /, 'tanpa foto: tidak ada tombol selesai, batal, atau gambar')
console.log('face-capture-ui: OK')
