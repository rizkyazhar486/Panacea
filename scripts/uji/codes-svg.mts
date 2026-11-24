// QrSvg / BarcodeSvg (src/domains/codes/ui/CodeSvgs.tsx) rendered for real (server side, no browser): the data state draws the
// path the engine produced on a white ground with black ink (scanner contrast in light and dark themes), every symbol has an
// accessible name, and the error states say what is wrong instead of drawing something misleading.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { encodeQr, qrSvgPath } from '../../src/domains/codes/engine/qr.ts'
import { encodeCode128, code128SvgPath } from '../../src/domains/codes/engine/code128.ts'

const gagal = (nama: string, fn: () => void) => { try { fn() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

const { build } = await import('esbuild')
const out = await build({
  stdin: { contents: "export { QrSvg, BarcodeSvg } from './src/domains/codes/ui/CodeSvgs.tsx'", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom'], logLevel: 'silent',
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/codes-svg.uji.mjs', out.outputFiles[0].text)
const { QrSvg, BarcodeSvg } = await import(pathToFileURL(resolve('node_modules/.cache/codes-svg.uji.mjs')).href)
const html = (node: unknown) => renderToStaticMarkup(node as never)

gagal('qr-dengan-data', () => {
  const value = 'https://www.panaceamed.id/#/health-data'
  const code = encodeQr(value, { ecc: 'M' })
  assert.ok(code.ok)
  const markup = html(createElement(QrSvg, { value, label: 'Link to My Health Data', testId: 'qr' }))
  assert.match(markup, /role="img"/)
  assert.match(markup, /aria-label="Link to My Health Data"/)
  assert.ok(code.ok && markup.includes(`d="${qrSvgPath(code.code, 4)}"`), 'draws exactly the engine path')
  assert.ok(code.ok && markup.includes(`viewBox="0 0 ${code.code.size + 8} ${code.code.size + 8}"`), 'includes the 4-module quiet zone')
  assert.match(markup, /fill="#ffffff"/); assert.match(markup, /fill="#000000"/)
  assert.ok(!markup.includes(value), 'the encoded text is not echoed into the accessible name or DOM')
  assert.match(markup, /data-qr-version="\d+"/)
  assert.ok(!/<p /.test(markup), 'no error message in the data state')
})

gagal('qr-keadaan-galat', () => {
  const tooLong = html(createElement(QrSvg, { value: 'x'.repeat(5000), label: 'Too big', testId: 'qr' }))
  assert.match(tooLong, /role="alert"/); assert.match(tooLong, /too long for a QR code/); assert.ok(!tooLong.includes('<svg'), 'nothing is drawn')
  const empty = html(createElement(QrSvg, { value: '', label: 'Nothing', testId: 'qr' }))
  assert.match(empty, /role="alert"/); assert.match(empty, /nothing to show/); assert.ok(!empty.includes('<svg'))
  // Paired: the same component with a short value draws.
  assert.ok(html(createElement(QrSvg, { value: 'ok', label: 'Fine' })).includes('<svg'))
})

gagal('qr-tingkat-koreksi-mengubah-simbol', () => {
  const m = html(createElement(QrSvg, { value: 'same text', label: 'm', ecc: 'M' }))
  const h = html(createElement(QrSvg, { value: 'same text', label: 'h', ecc: 'H' }))
  assert.notEqual(m.match(/ d="[^"]+"/)?.[0], h.match(/ d="[^"]+"/)?.[0])
})

gagal('barcode-dengan-data', () => {
  const code = encodeCode128('MRN-2026-0042')
  assert.ok(code.ok)
  const markup = html(createElement(BarcodeSvg, { value: 'MRN-2026-0042', label: 'Record number barcode', testId: 'bar' }))
  assert.match(markup, /role="img"/); assert.match(markup, /aria-label="Record number barcode"/)
  assert.ok(code.ok && markup.includes(`d="${code128SvgPath(code.code, 40, 10)}"`))
  assert.ok(code.ok && markup.includes(`viewBox="0 0 ${code.code.modules + 20} 40"`), 'includes the 10-module quiet zone')
  assert.match(markup, /fill="#ffffff"/); assert.match(markup, /fill="#000000"/)
  assert.ok(!markup.includes('MRN-2026-0042'), 'the value is not echoed into the DOM')
})

gagal('barcode-keadaan-galat', () => {
  const bad = html(createElement(BarcodeSvg, { value: 'café', label: 'x', testId: 'bar' }))
  assert.match(bad, /role="alert"/); assert.match(bad, /cannot be shown as a Code 128/); assert.ok(!bad.includes('<svg'))
  const empty = html(createElement(BarcodeSvg, { value: '', label: 'x', testId: 'bar' }))
  assert.match(empty, /nothing to show/)
})

console.log('codes-svg: QR and barcode render the engine output with quiet zones and scanner contrast; too long, empty and unsupported values show an alert instead of a symbol')
