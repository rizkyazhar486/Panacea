// E7 — HTTP 200 is insufficient if the page is blank; non-200 is never acceptance.
// Pure classification is kept separate from the network/browser runner for deterministic negative controls.
import { createHash } from 'node:crypto'
export function assessPublicPage({ status, title, bodyTextChars, rootErrorText = '', assetFailures = [] }) {
  const failures = []
  if (status !== 200) failures.push(`public home HTTP ${status ?? 'no response'}; expected 200`)
  if (typeof title !== 'string' || !title.trim()) failures.push('public home has no document title')
  if (!Number.isFinite(bodyTextChars) || bodyTextChars < 1) failures.push('public home has no visible text')
  if (/something went wrong/i.test(String(rootErrorText))) failures.push('public home rendered root ErrorBoundary instead of application')
  for (const asset of assetFailures) failures.push(`public home required asset failed: ${String(asset).slice(0, 200)}`)
  return failures
}

export function isProductionAsset(assetUrl, baseUrl) {
  try {
    const u = new URL(assetUrl)
    const b = new URL(baseUrl)
    const sameOrigin = u.origin === b.origin ||
      (b.origin === 'https://panaceamed.id' && u.origin === 'https://www.panaceamed.id')
    if (!sameOrigin) return false
    return (u.pathname.startsWith('/assets/') && /\.(?:css|js)$/.test(u.pathname)) ||
      u.pathname === '/home-styles.css' || u.pathname === '/panacea-green-material-v48.css' || u.pathname === '/ui-iterations/panacea-green-material-v48.css'
  } catch { return false }
}

export function productionAssetFailure({ url, status, contentType = '', requestFailure }, baseUrl) {
  if (!isProductionAsset(url, baseUrl)) return null
  // The URL path, query, MIME parameters and request failure may contain secrets.
  // Keep blocking behavior, emit only a deterministic opaque path reference.
  const pathname = new URL(url).pathname
  const ref = createHash('sha256').update(pathname).digest('hex').slice(0, 16)
  if (requestFailure) return `required asset ref=${ref}: request failed`
  // Compare the MIME essence; a parameter mentioning text/css is not CSS.
  const ct = String(contentType).split(';', 1)[0].trim().toLowerCase()
  if (status >= 400 || (pathname.endsWith('.css') && ct !== 'text/css')) {
    const safeType = ct === 'text/css' ? 'text/css' : ct === 'text/html' ? 'text/html' : 'other'
    const safeStatus = Number.isInteger(status) && status >= 100 && status <= 599 ? status : 'unknown'
    return `required asset ref=${ref}: HTTP ${safeStatus} content-type ${safeType}`
  }
  return null
}

const SHA40 = /^[0-9a-f]{40}$/
const sha = (v) => (typeof v === 'string' && SHA40.test(v) ? v : null)

// ENG-E7-02: catat SHA frontend (build.json) dan backend (/api/health build.commit) yang BENAR-BENAR diuji.
// Hilang atau bukan 40-heksadesimal = null (tidak diketahui), tidak pernah dikarang atau dianggap sama.
export function testedShas({ frontendBuild, health, expectSha = '' } = {}) {
  const frontend = sha(frontendBuild?.commit)
  const backend = sha(health?.build?.commit)
  const expect = sha(expectSha)
  const notes = []
  if (!frontend) notes.push('SHA frontend TIDAK diketahui (build.json hilang atau tidak memuat commit 40-heksadesimal)')
  if (!backend) notes.push('SHA backend TIDAK diketahui (/api/health tidak melaporkan build.commit valid)')
  if (expectSha && !expect) notes.push('EXPECT_SHA bukan 40-heksadesimal dan diabaikan')
  if (expect && frontend && frontend !== expect) notes.push(`frontend ${frontend.slice(0, 9)} berbeda dari yang diharapkan ${expect.slice(0, 9)}`)
  if (expect && backend && backend !== expect) notes.push(`backend ${backend.slice(0, 9)} berbeda dari yang diharapkan ${expect.slice(0, 9)}`)
  return { frontend, backend, frontendMatchesExpected: expect && frontend ? frontend === expect : null, backendMatchesExpected: expect && backend ? backend === expect : null, notes }
}
