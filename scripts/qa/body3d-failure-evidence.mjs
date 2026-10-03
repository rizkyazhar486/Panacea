// Bukti yang disimpan ketika gerbang visual Body3D gagal. Hanya membangun laporan diagnostik;
// ia tidak pernah mengubah lulus/gagalnya gerbang. Dipisahkan dari skrip Playwright agar logikanya
// dapat diuji tanpa peramban.
const MAX_CONSOLE = 30
const MAX_ERRORS = 20
const MAX_TEXT = 800
const MAX_ENTRY = 300

const asList = (value) => (Array.isArray(value) ? value : [])

function clip(value, max) {
  const text = typeof value === 'string' ? value : value == null ? '' : String(value)
  return text.length > max ? `${text.slice(0, max)}…` : text
}

const integerOrNull = (value) => (Number.isInteger(value) ? value : null)

export function failureEvidencePaths(outputPath) {
  const base = String(outputPath).replace(/\.png$/i, '')
  // Nama harus tetap berawalan body3d-mobile- agar ikut terunggah oleh glob artefak di workflow.
  return { json: `${base}-failure.json` }
}

export function buildFailureEvidence({ error, elapsedMs, url, page, consoleMessages, pageErrors, webglEvents }) {
  const state = page && typeof page === 'object' ? page : {}
  const isError = error instanceof Error
  return {
    schema: 'body3d-failure-evidence/v1',
    error: { name: isError ? error.name : 'NonError', message: clip(isError ? error.message : error, 600) },
    elapsedMs: Number.isFinite(elapsedMs) ? Math.round(elapsedMs) : null,
    url: clip(url, 200),
    page: {
      // false: halaman tidak dapat ditanyai (macet atau sudah tertutup), jadi angka di bawah bukan pengamatan.
      collected: state.collected === true,
      readyState: state.collected === true ? clip(state.readyState, 20) : null,
      canvasCount: state.collected === true ? integerOrNull(state.canvasCount) : null,
      targetCanvasCount: state.collected === true ? integerOrNull(state.targetCanvasCount) : null,
      bodyText: state.collected === true ? clip(state.bodyText, MAX_TEXT) : '',
    },
    console: asList(consoleMessages)
      .slice(-MAX_CONSOLE)
      .map((m) => ({ type: clip(m?.type, 12), text: clip(m?.text, MAX_ENTRY) })),
    pageErrors: asList(pageErrors).slice(-MAX_ERRORS).map((e) => clip(e, MAX_ENTRY)),
    webglEvents: asList(webglEvents)
      .slice(-MAX_ERRORS)
      .map((e) => ({ type: clip(e?.type, 24), atMs: Number.isFinite(e?.atMs) ? Math.round(e.atMs) : null })),
  }
}

const MAX_LOG_FOLDS = 20

// Satu baris log untuk kegagalan smoke Body3D. Artefak CI tidak selalu bisa diunduh, sedangkan log job selalu bisa dibaca,
// jadi ringkasan yang sama dicetak ke stderr. `probe.responsive === false` berarti halaman tidak menjawab evaluate dalam
// batas waktu (utas utama macet), bedanya dengan canvas yang memang rusak. Hanya diagnostik; tidak mengubah lulus/gagal.
export function formatSmokeFailureLog({ failure, failureContext, pageErrors, probe, elapsedMs }) {
  if (typeof failure !== 'string' || failure === '') return ''
  const context = failureContext && typeof failureContext === 'object' ? failureContext : null
  const folds = context ? asList(context.folds).slice(0, MAX_LOG_FOLDS) : []
  const report = {
    schema: 'body3d-smoke-failure-log/v1',
    failure: clip(failure, 600),
    elapsedMs: Number.isFinite(elapsedMs) ? Math.round(elapsedMs) : null,
    hash: context ? clip(context.hash, 200) : null,
    folds: folds.map((f) => ({ word: clip(f?.word, 40), open: f?.open === true })),
    pageErrors: asList(pageErrors).slice(-MAX_ERRORS).map((e) => clip(e, MAX_ENTRY)),
    // null: probe tidak dijalankan, bukan "responsif".
    responsive: probe && typeof probe.responsive === 'boolean' ? probe.responsive : null,
    probeMs: probe && Number.isFinite(probe.evaluateMs) ? Math.round(probe.evaluateMs) : null,
    // Galat probe selain timeout (mis. halaman error): bukan bukti macet, jadi dilaporkan terpisah dari `responsive`.
    probeError: probe && typeof probe.error === 'string' ? clip(probe.error, MAX_ENTRY) : null,
  }
  return `BODY3D_SMOKE_FAILURE ${JSON.stringify(report)}`
}

// Satu baris log untuk kegagalan skrip canvas-artifact. Artefak CI tidak selalu bisa diunduh, sedangkan log job selalu bisa
// dibaca; bukti yang sama (sudah dipotong oleh buildFailureEvidence) dicetak ke stderr. Hanya diagnostik; tidak mengubah lulus/gagal.
export function formatCanvasArtifactFailureLog(evidence) {
  if (!evidence || typeof evidence !== 'object' || evidence.schema !== 'body3d-failure-evidence/v1') return ''
  return `BODY3D_CANVAS_ARTIFACT_FAILURE ${JSON.stringify(evidence)}`
}
