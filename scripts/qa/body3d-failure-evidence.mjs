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
