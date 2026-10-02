import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildFailureEvidence, failureEvidencePaths } from './body3d-failure-evidence.mjs'

const observed = {
  collected: true,
  readyState: 'complete',
  canvasCount: 0,
  targetCanvasCount: 0,
  bodyText: 'This device could not start 3D graphics',
}
const build = (overrides = {}) =>
  buildFailureEvidence({
    error: new Error('locator.evaluate: Timeout 20000ms exceeded.'),
    elapsedMs: 34_012.6,
    url: 'http://127.0.0.1:4173/#/body-explorer?folds=open',
    page: observed,
    consoleMessages: [{ type: 'error', text: 'WebGL: CONTEXT_LOST_WEBGL' }],
    pageErrors: ['TypeError: x is undefined'],
    webglEvents: [{ type: 'webglcontextlost', atMs: 12_345.67 }],
    ...overrides,
  })

test('memuat_galat_asli_waktu_dan_pengamatan_halaman', () => {
  const evidence = build()
  assert.equal(evidence.schema, 'body3d-failure-evidence/v1')
  assert.deepEqual(evidence.error, { name: 'Error', message: 'locator.evaluate: Timeout 20000ms exceeded.' })
  assert.equal(evidence.elapsedMs, 34013)
  assert.equal(evidence.page.collected, true)
  assert.equal(evidence.page.canvasCount, 0)
  assert.equal(evidence.page.targetCanvasCount, 0)
  assert.equal(evidence.page.bodyText, 'This device could not start 3D graphics')
  assert.deepEqual(evidence.console, [{ type: 'error', text: 'WebGL: CONTEXT_LOST_WEBGL' }])
  assert.deepEqual(evidence.webglEvents, [{ type: 'webglcontextlost', atMs: 12346 }])
})

test('halaman_yang_tak_bisa_ditanyai_tidak_menyajikan_angka_sebagai_pengamatan', () => {
  // Pasangan: hanya `collected` yang berbeda; nilai lain sengaja dibiarkan terisi.
  const evidence = build({ page: { ...observed, collected: false } })
  assert.equal(evidence.page.collected, false)
  assert.equal(evidence.page.canvasCount, null)
  assert.equal(evidence.page.targetCanvasCount, null)
  assert.equal(evidence.page.readyState, null)
  assert.equal(evidence.page.bodyText, '')
  for (const missing of [undefined, null, 'x', 42]) {
    const e = build({ page: missing })
    assert.equal(e.page.collected, false)
    assert.equal(e.page.canvasCount, null)
  }
})

test('membatasi_ukuran_laporan_dan_menyimpan_entri_terbaru', () => {
  const many = Array.from({ length: 100 }, (_, i) => ({ type: 'error', text: `msg-${i}` }))
  const evidence = build({
    consoleMessages: many,
    pageErrors: Array.from({ length: 50 }, (_, i) => `err-${i}`),
    webglEvents: Array.from({ length: 50 }, (_, i) => ({ type: 'webglcontextlost', atMs: i })),
    page: { ...observed, bodyText: 'x'.repeat(5000) },
  })
  assert.equal(evidence.console.length, 30)
  assert.equal(evidence.console[0].text, 'msg-70', 'yang dibuang entri tertua, bukan yang terbaru')
  assert.equal(evidence.console.at(-1).text, 'msg-99')
  assert.equal(evidence.pageErrors.length, 20)
  assert.equal(evidence.pageErrors.at(-1), 'err-49')
  assert.equal(evidence.webglEvents.length, 20)
  assert.equal(evidence.page.bodyText.length, 801, '800 karakter + penanda pemotongan')
  assert.ok(evidence.page.bodyText.endsWith('…'))
})

test('batas_tepat_tidak_dipotong_dan_satu_di_atasnya_dipotong', () => {
  assert.equal(build({ page: { ...observed, bodyText: 'a'.repeat(800) } }).page.bodyText, 'a'.repeat(800))
  assert.equal(build({ page: { ...observed, bodyText: 'a'.repeat(801) } }).page.bodyText, `${'a'.repeat(800)}…`)
  assert.equal(build({ consoleMessages: Array(30).fill({ type: 'error', text: 'e' }) }).console.length, 30)
})

test('masukan_rusak_tidak_melempar_dan_tidak_membocorkan_objek_mentah', () => {
  const evidence = buildFailureEvidence({
    error: { toString: () => 'plain object thrown' },
    elapsedMs: Number.NaN,
    url: undefined,
    page: undefined,
    consoleMessages: 'bukan array',
    pageErrors: null,
    webglEvents: [null, { type: 'webglcontextlost', atMs: 'abc' }],
  })
  assert.equal(evidence.error.name, 'NonError')
  assert.equal(evidence.error.message, 'plain object thrown')
  assert.equal(evidence.elapsedMs, null)
  assert.equal(evidence.url, '')
  assert.deepEqual(evidence.console, [])
  assert.deepEqual(evidence.pageErrors, [])
  assert.deepEqual(evidence.webglEvents, [{ type: '', atMs: null }, { type: 'webglcontextlost', atMs: null }])
  assert.doesNotThrow(() => JSON.stringify(evidence))
})

test('deterministik_dan_tidak_mengubah_masukan', () => {
  const consoleMessages = [{ type: 'error', text: 'a' }]
  const snapshot = JSON.stringify(consoleMessages)
  assert.deepEqual(build({ consoleMessages }), build({ consoleMessages }))
  assert.equal(JSON.stringify(consoleMessages), snapshot)
})

test('jalur_bukti_tetap_di_namespace_artefak_yang_diunggah_workflow', () => {
  assert.deepEqual(failureEvidencePaths('artifacts/body3d-mobile-canvas.png'), {
    json: 'artifacts/body3d-mobile-canvas-failure.json',
  })
  assert.deepEqual(failureEvidencePaths('artifacts/custom'), { json: 'artifacts/custom-failure.json' })
  const workflow = readFileSync(new URL('../../.github/workflows/stabilization-acceptance.yml', import.meta.url), 'utf8')
  assert.match(workflow, /path: artifacts\/body3d-mobile-\*/, 'glob unggahan harus mencakup berkas bukti kegagalan')
  assert.ok('artifacts/body3d-mobile-canvas-failure.json'.startsWith('artifacts/body3d-mobile-'))
})

test('skrip_gerbang_menyimpan_bukti_lalu_melempar_ulang_galat_aslinya', () => {
  const script = readFileSync(new URL('./body3d-canvas-artifact.mjs', import.meta.url), 'utf8')
  const block = script.match(/\}\s*catch \(error\) \{([\s\S]*?)\}\s*finally \{/)
  assert.ok(block, 'harus ada catch tepat sebelum finally')
  const body = block[1]
  assert.match(body, /await saveFailureEvidence\(error\)/)
  assert.match(body, /throw error\b/, 'galat asli harus dilempar ulang; bukti tidak boleh menelan kegagalan')
  assert.ok(body.indexOf('saveFailureEvidence') < body.indexOf('throw error'), 'bukti disimpan sebelum galat dilempar')
  assert.doesNotMatch(body, /\breturn\b/, 'catch tidak boleh keluar normal')
  assert.match(script, /finally \{[\s\S]*browser\.close\(\)/, 'peramban tetap ditutup di finally')
  // Jalur gagal tidak boleh memanggil screenshot: compositor Playwright pernah menggantung pada WebGL SwiftShader,
  // dan jalur ini berjalan tepat ketika konteks WebGL mungkin hilang.
  assert.doesNotMatch(body, /screenshot/i)
  assert.doesNotMatch(script, /page\.screenshot\s*\(/)
  // Pencatat event WebGL hanya mengamati: tidak boleh mengubah pemulihan konteks aplikasi.
  assert.doesNotMatch(script, /webglcontext(lost|restored)[\s\S]{0,200}preventDefault/)
})
