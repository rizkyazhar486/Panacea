// E7: public production smoke evidence must be fail-closed without retaining
// request URLs, query strings, page text, network exception messages or tokens.
// The caller MUST still determine exit status from the original findings.
const count = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null
const status = (value) => Number.isInteger(value) && value >= 100 && value <= 599 ? value : null
const bool = (value) => value === true
// UI-reported triangle count is diagnostic only, not an independent geometry check.
const reportedTriangles = (value) => {
  if (typeof value !== 'string') return null
  const match = /^loaded\s*[·•]\s*(\d{1,6})k triangles$/i.exec(value.trim())
  if (!match) return null
  const triangles = Number(match[1]) * 1000
  return Number.isSafeInteger(triangles) ? triangles : null
}
const sliceEvidence = (slicing) => {
  if (!slicing || typeof slicing !== 'object' || Array.isArray(slicing)) return null
  const modes = {}
  for (const mode of ['sagittal', 'coronal', 'axial']) {
    const entry = slicing[mode]
    modes[mode] = entry === 'control-missing'
      ? { controlPresent: false, changesImage: null, positionChangesImage: null }
      : entry && typeof entry === 'object' && !Array.isArray(entry)
        ? { controlPresent: true, changesImage: entry.changesImage === true, positionChangesImage: entry.positionChangesImage === true }
        : { controlPresent: null, changesImage: null, positionChangesImage: null }
  }
  return { ...modes, offRestoresBaseByteExact: slicing.offRestoresBaseByteExact === true }
}
const origin = (value) => {
  try {
    const parsed = new URL(value)
    return ['panaceamed.id', 'www.panaceamed.id', 'localhost', '127.0.0.1'].includes(parsed.hostname) ? parsed.origin : null
  } catch { return null }
}
const category = (message) => {
  const s = typeof message === 'string' ? message : ''
  if (/^network (dns|tls|http):/.test(s)) return `network_${s.match(/^network (dns|tls|http):/)[1]}`
  if (/^TLS tidak terpercaya/.test(s)) return 'tls_untrusted'
  if (/^HTTP akhir/.test(s)) return 'http_final_status'
  if (/required asset/.test(s)) return 'required_asset_failed'
  if (/root ErrorBoundary/.test(s)) return 'root_error_boundary'
  if (/galat halaman/.test(s)) return 'browser_error'
  if (/scroll horizontal/.test(s)) return 'horizontal_overflow'
  if (/WebGL tidak tersedia/.test(s)) return 'webgl_unavailable'
  if (/^server melaporkan commit/.test(s)) return 'server_sha_mismatch'
  if (/^health server tidak terbaca/.test(s)) return 'server_health_unavailable'
  if (/^body \d+px:/.test(s)) return 'body_render_unavailable'
  if (/^\d+px: public home/.test(s)) return 'public_home_failure'
  return 'other'
}

export function sanitizeProductionReport(raw = {}) {
  const network = raw.network && typeof raw.network === 'object' ? raw.network : {}
  const tls = network.tls && typeof network.tls === 'object' ? network.tls : {}
  const failed = network.failed && typeof network.failed === 'object' ? network.failed : null
  const server = raw.server && typeof raw.server === 'object' ? raw.server : null
  return {
    checkedAt: typeof raw.checkedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(raw.checkedAt) ? raw.checkedAt : null,
    origin: origin(raw.base),
    network: {
      dnsAddressCount: Array.isArray(network.dns) ? count(network.dns.length) : null,
      tls: network.tls ? { authorized: bool(tls.authorized) } : null,
      httpStatuses: Array.isArray(network.http) ? network.http.map((r) => status(r?.status)) : [],
      failed: failed ? { stage: ['dns', 'tls', 'http'].includes(failed.stage) ? failed.stage : 'unknown' } : null,
    },
    server: server ? {
      commit: typeof server.commit === 'string' && /^[0-9a-f]{40}$/i.test(server.commit) ? server.commit : null,
      matchesExpected: bool(server.matchesExpected),
    } : null,
    viewports: Array.isArray(raw.viewports) ? raw.viewports.map((v) => ({
      width: count(v?.width), height: count(v?.height), status: status(v?.status),
      overflowX: bool(v?.overflowX), webgl1: bool(v?.webgl1), webgl2: bool(v?.webgl2),
      errorsCount: Array.isArray(v?.errors) ? count(v.errors.length) : null,
      failedRequestsCount: Array.isArray(v?.failedRequests) ? count(v.failedRequests.length) : null,
      assetFailuresCount: Array.isArray(v?.assetFailures) ? count(v.assetFailures.length) : null,
      rootErrorPresent: typeof v?.rootErrorText === 'string' && v.rootErrorText.length > 0,
      bodyCanvasPresent: bool(v?.body?.canvasPresent), bodyLoaded: bool(v?.body?.loaded),
      bodyReportedTriangleCountApprox: v?.body?.loaded === true ? reportedTriangles(v?.body?.stats) : null,
      bodySlicing: sliceEvidence(v?.body?.slicing),
      bodyReviewLabelPresent: typeof v?.body?.reviewLabel === 'string' && v.body.reviewLabel.trim().length > 0,
    })) : [],
    findings: Array.isArray(raw.findings) ? raw.findings.map((f) => ({
      severity: ['fail', 'warn', 'info'].includes(f?.severity) ? f.severity : 'fail',
      category: category(f?.msg),
    })) : [],
  }
}
