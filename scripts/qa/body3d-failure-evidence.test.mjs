import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildFailureEvidence, failureEvidencePaths, formatCanvasArtifactFailureLog, formatSmokeFailureLog } from './body3d-failure-evidence.mjs'

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

const smoke = (overrides = {}) =>
  formatSmokeFailureLog({
    failure: 'canvas health timed out after 10000ms',
    failureContext: { hash: '#/body-explorer?folds=open', folds: [{ word: 'Anatomy', open: true }, { word: 'Physiology', open: false }] },
    pageErrors: ['TypeError: x is undefined'],
    probe: { responsive: false, evaluateMs: null },
    elapsedMs: 30_912.4,
    ...overrides,
  })
const parse = (line) => JSON.parse(line.slice('BODY3D_SMOKE_FAILURE '.length))

test('log_kegagalan_smoke_memuat_galat_hash_lipatan_dan_responsivitas', () => {
  const line = smoke()
  assert.ok(line.startsWith('BODY3D_SMOKE_FAILURE '), 'penanda baris harus ada agar mudah dicari di log job')
  assert.ok(!line.includes('\n'), 'harus satu baris')
  const report = parse(line)
  assert.equal(report.schema, 'body3d-smoke-failure-log/v1')
  assert.equal(report.failure, 'canvas health timed out after 10000ms')
  assert.equal(report.elapsedMs, 30912)
  assert.equal(report.hash, '#/body-explorer?folds=open')
  assert.deepEqual(report.folds, [{ word: 'Anatomy', open: true }, { word: 'Physiology', open: false }])
  assert.deepEqual(report.pageErrors, ['TypeError: x is undefined'])
  assert.equal(report.responsive, false)
  assert.equal(report.probeMs, null)
})

test('tanpa_kegagalan_tidak_ada_log', () => {
  for (const failure of [null, undefined, '', 0, {}]) assert.equal(smoke({ failure }), '', `failure=${String(failure)}`)
})

test('probe_responsif_dan_macet_hanya_berbeda_pada_probe', () => {
  const macet = parse(smoke({ probe: { responsive: false, evaluateMs: null } }))
  const responsif = parse(smoke({ probe: { responsive: true, evaluateMs: 42.4 } }))
  assert.equal(macet.responsive, false)
  assert.equal(responsif.responsive, true)
  assert.equal(responsif.probeMs, 42)
  assert.deepEqual({ ...responsif, responsive: null, probeMs: null }, { ...macet, responsive: null, probeMs: null })
})

test('galat_probe_selain_timeout_tidak_dilaporkan_sebagai_macet', () => {
  const report = parse(smoke({ probe: { responsive: null, evaluateMs: null, error: 'page.evaluate: Execution context was destroyed' } }))
  assert.equal(report.responsive, null, 'galat bukan timeout: tidak boleh dibaca macet (false) maupun responsif (true)')
  assert.equal(report.probeError, 'page.evaluate: Execution context was destroyed')
  assert.equal(parse(smoke({ probe: { responsive: false, evaluateMs: null } })).probeError, null)
  assert.equal(parse(smoke({ probe: { responsive: null, evaluateMs: null, error: 'x'.repeat(2000) } })).probeError.length, 301)
})

test('probe_yang_tidak_dijalankan_tidak_dilaporkan_sebagai_responsif', () => {
  for (const probe of [undefined, null, {}, { responsive: 'ya' }, { responsive: 1 }]) {
    assert.equal(parse(smoke({ probe })).responsive, null, `probe=${JSON.stringify(probe)}`)
  }
})

test('log_kegagalan_dibatasi_dan_tahan_masukan_buruk', () => {
  const report = parse(smoke({
    failure: 'x'.repeat(5000),
    pageErrors: Array.from({ length: 100 }, (_, i) => `err-${i}-${'y'.repeat(2000)}`),
    failureContext: { hash: 'h'.repeat(5000), folds: Array.from({ length: 500 }, () => ({ word: 'w'.repeat(500), open: true })) },
  }))
  assert.ok(report.failure.length <= 601)
  assert.ok(report.hash.length <= 201)
  assert.equal(report.pageErrors.length, 20)
  assert.ok(report.pageErrors.every((e) => e.length <= 301))
  assert.equal(report.folds.length, 20)
  assert.ok(report.folds.every((f) => f.word.length <= 41))
  // Masukan bukan-daftar atau konteks hilang tidak boleh melempar.
  const aman = parse(smoke({ pageErrors: 'bukan daftar', failureContext: null, elapsedMs: NaN }))
  assert.deepEqual(aman.pageErrors, [])
  assert.equal(aman.hash, null)
  assert.deepEqual(aman.folds, [])
  assert.equal(aman.elapsedMs, null)
})

test('smoke_v2_memanggil_probe_dan_mencetak_log_saat_gagal', () => {
  const source = readFileSync(new URL('./body3d-mobile-smoke-v2.mjs', import.meta.url), 'utf8')
  assert.match(source, /import \{ formatSmokeFailureLog \} from '\.\/body3d-failure-evidence\.mjs'/)
  assert.match(source, /responsiveProbe = await withTimeout\(page\.evaluate\(\(\) => performance\.now\(\)\), 'responsiveness probe', 3_000\)/)
  assert.match(source, /if \(failureLog\) console\.error\(failureLog\)/)
  assert.match(source, /\/timed out\/\.test\(probeError\.message\)/, 'hanya timeout yang boleh dibaca sebagai macet')
  // Probe harus dijalankan sebelum evaluate konteks (yang bisa menunggu 20 detik pada halaman macet).
  assert.ok(source.indexOf("'responsiveness probe'") < source.indexOf('failureContext = await page.evaluate'))
  // Gerbang tidak boleh dilemahkan: tidak ada penelan galat baru di sekitar asersi, galat asli tetap dilempar ulang.
  assert.match(source, /throw error\n\} finally \{/)
})

test('log_canvas_artifact_memuat_bukti_yang_sama_pada_satu_baris', () => {
  const evidence = build()
  const line = formatCanvasArtifactFailureLog(evidence)
  assert.ok(line.startsWith('BODY3D_CANVAS_ARTIFACT_FAILURE {'))
  assert.equal(line.includes('\n'), false)
  assert.deepEqual(JSON.parse(line.slice('BODY3D_CANVAS_ARTIFACT_FAILURE '.length)), evidence)
  // Pasangan: halaman tak terkumpul tetap tidak menyajikan angka sebagai pengamatan di log.
  const blind = JSON.parse(formatCanvasArtifactFailureLog(build({ page: { ...observed, collected: false } })).slice('BODY3D_CANVAS_ARTIFACT_FAILURE '.length))
  assert.equal(blind.page.canvasCount, null)
  assert.equal(blind.page.collected, false)
})

test('log_canvas_artifact_menolak_masukan_yang_bukan_bukti', () => {
  for (const bad of [undefined, null, 'x', 0, [], {}, { schema: 'lain/v1' }]) {
    assert.equal(formatCanvasArtifactFailureLog(bad), '', `masukan ${JSON.stringify(bad)}`)
  }
})

test('skrip_canvas_artifact_mencetak_bukti_ke_log_setelah_menulis_berkas', () => {
  const src = readFileSync(new URL('./body3d-canvas-artifact.mjs', import.meta.url), 'utf8')
  const lines = src.split('\n').map((l) => l.trim())
  const write = lines.indexOf('await writeFile(evidencePaths.json, JSON.stringify(evidence, null, 2))')
  const print = lines.indexOf('console.error(formatCanvasArtifactFailureLog(evidence))')
  assert.ok(write >= 0 && print === write + 1, 'pencetakan harus tepat setelah penulisan berkas bukti')
  assert.ok(lines.includes("import { buildFailureEvidence, failureEvidencePaths, formatCanvasArtifactFailureLog } from './body3d-failure-evidence.mjs'"))
})

test('canvas_artifact_memberi_batas_aksi_60_detik_tanpa_melonggarkan_pernyataan_ketat', () => {
  const src = readFileSync(new URL('./body3d-canvas-artifact.mjs', import.meta.url), 'utf8')
  const lines = src.split('\n').map((l) => l.trim())
  assert.ok(lines.includes('const ACTION_TIMEOUT_MS = Number(process.env.BODY3D_QA_ACTION_TIMEOUT_MS || 60_000)'))
  assert.ok(lines.includes('page.setDefaultTimeout(ACTION_TIMEOUT_MS)'))
  assert.equal(lines.some((l) => /setDefaultTimeout\(\s*20_?000\s*\)/.test(l)), false, 'batas 20 dtk tidak boleh kembali')
  // Pernyataan ketat tetap ada (kontrol bahwa perubahan ini hanya toleransi macet).
  assert.ok(src.includes('Body3D canvas center outside viewport during visual capture'))
  assert.ok(src.includes("waitFor({ state: 'hidden', timeout: timeoutMs })"))
  assert.ok(lines.includes('await canvas.waitFor({ state: \'visible\', timeout: 45_000 })'))
})
