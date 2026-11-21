// Penganalisis Health Data: ubin "hari khas" dirender NYATA (SSR). Muncul hanya bila impor barusan membawa jam untuk
// sinyal terpilih; jam tanpa bacaan jadi titik, bukan jari nol; kalimatnya menyebut angka dan nama berkas.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { dateOfDay, dayNumber } from '../../src/domains/personal-health/engine/glance/metricInsight.ts'
import { audit } from './support/markupAudit.mts'

const gagal = async (nama: string, f: () => void | Promise<void>) => { try { await f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const { build } = await import('esbuild')
const out = await build({
  stdin: { contents: "export { HealthAnalyzer } from './src/domains/personal-health/ui/glance/HealthAnalyzer.tsx'", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-router-dom'], loader: { '.css': 'empty' }, logLevel: 'silent',
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/health-analyzer-day.uji.mjs', out.outputFiles[0]!.text)
const m = await import(pathToFileURL(resolve('node_modules/.cache/health-analyzer-day.uji.mjs')).href)

const HARI = '2026-11-20'
const T = dayNumber(HARI)!
const rhr = Array.from({ length: 20 }, (_, i) => ({ date: dateOfDay(T - 19 + i), value: 55 + (i % 5) }))
const readSeries = (id: string) => (id === 'restingHr' ? rhr : [])
const jam = Array.from({ length: 24 }, (_, h) => (h >= 6 && h <= 9 ? 50 + h : null))
const render = (typicalDays: unknown) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(m.HealthAnalyzer, { readSeries, today: HARI, typicalDays })))

await gagal('ubin-hari-khas-dari-impor', () => {
  const html = render({ source: 'watch.csv', hours: { restingHr: jam } })
  assert.deepEqual(audit(html), [], 'temuan aksesibilitas')
  assert.doesNotMatch(html.replace(/<[^>]+>/g, ' '), /NaN|undefined|Infinity/)
  assert.match(html, /Typical day · watch\.csv/)
  const tile = html.slice(html.indexOf('ha-day'))
  assert.equal((tile.match(/<line /g) ?? []).length, 4, 'hanya jam terekam')
  assert.equal((tile.match(/class="ha-day-gap"/g) ?? []).length, 20, 'jam kosong = titik')
  assert.match(html, /aria-label="Resting HR by hour of day\. Highest around 09:00 \(59 bpm\), lowest around 06:00 \(56\); 4 of 24 hours have readings\."/)
  assert.match(html, /<p data-pmd-unclamped="true">[^<]*not a zero\.<\/p>/)
})
await gagal('tanpa-jam-tanpa-ubin', () => {
  assert.doesNotMatch(render(null), /ha-day/, 'tanpa impor: tidak ada ubin')
  assert.doesNotMatch(render({ source: 'w.csv', hours: { steps: jam } }), /ha-day/, 'jam untuk sinyal lain tidak dipakai')
  assert.doesNotMatch(render({ source: 'w.csv', hours: { restingHr: Array(24).fill(null) } }), /ha-day/, 'profil kosong: tidak ada dial kosong')
})
console.log('health-analyzer-day: OK')
