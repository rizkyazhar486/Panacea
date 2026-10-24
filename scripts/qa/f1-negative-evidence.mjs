// A failing process alone does not prove that the injected defect was detected.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const routes = ['#/', '#/chatbot', '#/settings', '#/profile', '#/fitness-hub', '#/all-features']

export function verifyNegativeEvidence(mode, report) {
  assert.ok(['bocor', 'overflow', 'galat-render'].includes(mode), 'unknown negative-control mode')
  assert.equal(report?.lulus, 1, 'negative control must complete its positive warmup')
  assert.equal(report?.gagal, 1, 'negative control must have exactly one detector failure')
  assert.equal(report?.hasil?.length, 2, 'negative control must stop at the first detector step')
  const [warmup, failure] = report.hasil
  for (const row of [warmup, failure]) {
    assert.equal(row.viewport, 'mobile-390x844', 'unexpected negative-control viewport')
    assert.equal(row.journey, 'ketahanan-pasien', 'unexpected negative-control journey')
  }
  assert.equal(warmup.ok, true, 'positive warmup failed')
  assert.equal(warmup.step, 'kontrol positif tanpa gangguan: tiap halaman terisi (pemanasan)')
  assert.deepEqual(Object.keys(warmup.detail ?? {}).sort(), [...routes].sort(), 'warmup must visit every injected route')
  for (const route of routes) assert.ok(Number.isFinite(warmup.detail[route]?.chars) && warmup.detail[route].chars > 100, `warmup missing content: ${route}`)
  assert.equal(failure.ok, false, 'injected defect was not detected')
  assert.match(failure.step, /^API lambat \([1-9]\d* ms\): cangkang tetap tampil, tanpa overflow atau teks bocor$/)
  assert.equal(typeof failure.detail, 'string', 'missing detector diagnostics')
  assert.ok(failure.detail.startsWith('API lambat: '), 'wrong detector phase')
  const diagnostics = failure.detail.slice('API lambat: '.length).split(' | ')
  assert.equal(diagnostics.length, routes.length, 'every injected route needs its own detector failure')
  for (const [i, route] of routes.entries()) {
    const prefix = `${route}: `
    assert.ok(diagnostics[i].startsWith(prefix), `missing detector failure: ${route}`)
    const reason = diagnostics[i].slice(prefix.length)
    if (mode === 'bocor') {
      assert.equal(reason, 'teks bocor saat lambat: [object Object],NaN', `wrong leak detector failure: ${route}`)
    } else if (mode === 'galat-render') {
      assert.equal(reason, 'galat render (layar ErrorBoundary tampil) saat lambat', `wrong render-error detector failure: ${route}`)
    } else {
      const match = /^overflow (\d+(?:\.\d+)?)px saat lambat$/.exec(reason)
      assert.ok(match && Number.isFinite(Number(match[1])) && Number(match[1]) > 1, `wrong overflow detector failure: ${route}`)
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [mode, file] = process.argv.slice(2)
    verifyNegativeEvidence(mode, JSON.parse(readFileSync(file, 'utf8')))
    console.log(`F1 negative control ${mode}: detector evidence verified`)
  } catch (error) {
    console.error(`F1 negative control rejected: ${error.message}`)
    process.exitCode = 1
  }
}
