import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { verifyNegativeEvidence } from './f1-negative-evidence.mjs'

const routes = ['#/', '#/chatbot', '#/settings', '#/profile', '#/fitness-hub', '#/all-features']
function evidence(mode) {
  const common = { viewport: 'mobile-390x844', journey: 'ketahanan-pasien' }
  return { lulus: 1, gagal: 1, hasil: [
    { ...common, ok: true, step: 'kontrol positif tanpa gangguan: tiap halaman terisi (pemanasan)', detail: Object.fromEntries(routes.map(route => [route, { chars: 500 }])) },
    { ...common, ok: false, step: 'API lambat (1500 ms): cangkang tetap tampil, tanpa overflow atau teks bocor',
      detail: 'API lambat: ' + routes.map(route => `${route}: ${{ bocor: 'teks bocor saat lambat: [object Object],NaN', overflow: 'overflow 3610px saat lambat', 'galat-render': 'galat render (layar ErrorBoundary tampil) saat lambat' }[mode]}`).join(' | ') },
  ] }
}

for (const mode of ['bocor', 'overflow', 'galat-render']) {
  test(`${mode}: accepts complete paired detector evidence without modifying it`, () => {
    const report = evidence(mode), before = structuredClone(report)
    assert.equal(verifyNegativeEvidence(mode, report), undefined)
    assert.deepEqual(report, before)
  })
  test(`${mode}: unrelated timeout cannot satisfy the negative control`, () => {
    const report = evidence(mode)
    report.hasil[1].detail = 'API lambat: ' + routes.map(route => `${route}: locator.waitFor: Timeout 90000ms exceeded`).join(' | ')
    assert.throws(() => verifyNegativeEvidence(mode, report), /wrong .* detector failure/)
  })
  test(`${mode}: one missing route or wrong detector cannot hide behind other valid failures`, () => {
    const report = evidence(mode)
    report.hasil[1].detail = report.hasil[1].detail.split(' | ').slice(0, -1).join(' | ')
    assert.throws(() => verifyNegativeEvidence(mode, report), /every injected route/)
    assert.throws(() => verifyNegativeEvidence(mode, evidence(mode === 'bocor' ? 'overflow' : 'bocor')), /wrong .* detector failure/)
  })
}

test('rejects empty, malformed, incomplete, or internally inconsistent reports', () => {
  for (const report of [null, {}, { lulus: 1, gagal: 1, hasil: [] }]) assert.throws(() => verifyNegativeEvidence('bocor', report))
  for (const change of [
    r => { r.lulus = 0 }, r => { r.gagal = 0 },
    r => { r.hasil[0].ok = false }, r => { r.hasil[1].ok = true },
    r => { r.hasil[1].step = 'API 500' }, r => { r.hasil[1].viewport = 'desktop-1440x900' },
    r => { r.hasil[1].journey = 'ketahanan-dokter' },
    r => { delete r.hasil[0].detail['#/settings'] },
    r => { r.hasil[0].detail['#/settings'].chars = 100 },
    r => { r.hasil[0].detail['#/settings'].chars = Infinity },
    r => { r.hasil[1].detail = null }, r => { r.hasil[1].detail = 'Timeout' },
    r => { r.hasil[1].detail = r.hasil[1].detail.replace('#/settings:', '#/profile:') },
  ]) {
    const report = evidence('bocor'); change(report)
    assert.throws(() => verifyNegativeEvidence('bocor', report))
  }
  assert.throws(() => verifyNegativeEvidence('unknown', evidence('bocor')), /unknown/)
})

test('overflow keeps the original greater-than-1px boundary and rejects invalid measurements', () => {
  for (const value of ['0', '1', '-2', 'NaN', 'Infinity', '9'.repeat(400)]) {
    const report = evidence('overflow')
    report.hasil[1].detail = report.hasil[1].detail.replace('3610px', `${value}px`)
    assert.throws(() => verifyNegativeEvidence('overflow', report), /wrong overflow detector/)
  }
  const report = evidence('overflow')
  report.hasil[1].detail = report.hasil[1].detail.replaceAll('3610px', '1.01px')
  assert.equal(verifyNegativeEvidence('overflow', report), undefined)
})

test('CLI fails closed for missing/invalid files and rejects timeout evidence previously accepted by grep', () => {
  const dir = mkdtempSync(join(tmpdir(), 'f1-negative-'))
  const script = fileURLToPath(new URL('./f1-negative-evidence.mjs', import.meta.url))
  const file = join(dir, 'evidence.json')
  const run = () => spawnSync(process.execPath, [script, 'bocor', file], { encoding: 'utf8' })
  try {
    assert.equal(run().status, 1)
    writeFileSync(file, '{'); assert.equal(run().status, 1)
    const report = evidence('bocor')
    writeFileSync(file, JSON.stringify(report)); assert.equal(run().status, 0)
    report.hasil[1].detail = 'API lambat: #/: Timeout 90000ms exceeded'
    writeFileSync(file, JSON.stringify(report, null, 2))
    assert.match(readFileSync(file, 'utf8'), /"ok": false/)
    assert.equal(run().status, 1)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('CI executes the evidence verifier and watches its implementation and tests', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/user-journey-acceptance.yml', import.meta.url), 'utf8')
  assert.match(workflow, /elif ! node scripts\/qa\/f1-negative-evidence\.mjs "\$mode"/)
  assert.doesNotMatch(workflow, /elif ! grep/)
  assert.match(workflow, /node --test .*scripts\/qa\/f1-negative-evidence\.test\.mjs/)
  assert.equal(workflow.split("- 'scripts/qa/f1-negative-evidence*'").length - 1, 2)
})

// Mode 'crash' (ENG-F1-03): build tanpa batas rute harus gagal di langkah crash dengan diagnosis "cangkang hilang" per rute.
const LANGKAH_CRASH = 'crash render satu halaman: cangkang tetap hidup, galat tertahan di halaman itu, halaman pulih setelahnya'
function crashEvidence() {
  const report = evidence('bocor')
  report.hasil[1] = { ...report.hasil[1], step: LANGKAH_CRASH,
    detail: 'crash render: ' + routes.map(route => `${route}: cangkang hilang setelah crash render (layar galat akar tampil)`).join(' | ') }
  return report
}
test('crash: accepts a shell-loss failure named for every route', () => {
  assert.equal(verifyNegativeEvidence('crash', crashEvidence()), undefined)
})
test('crash: a timeout, a missing route, or a slow-API failure cannot stand in for the crash detector', () => {
  const timeout = crashEvidence()
  timeout.hasil[1].detail = 'crash render: ' + routes.map(route => `${route}: page.waitForFunction: Timeout 60000ms exceeded`).join(' | ')
  assert.throws(() => verifyNegativeEvidence('crash', timeout), /wrong crash detector failure/)
  const missing = crashEvidence()
  missing.hasil[1].detail = missing.hasil[1].detail.split(' | ').slice(0, -1).join(' | ')
  assert.throws(() => verifyNegativeEvidence('crash', missing), /every injected route/)
  assert.throws(() => verifyNegativeEvidence('crash', evidence('bocor')), /wrong crash step/)
  const passed = crashEvidence(); passed.hasil[1].ok = true
  assert.throws(() => verifyNegativeEvidence('crash', passed), /not detected/)
})
