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
  const ct = String(contentType).toLowerCase()
  if (status >= 400 || (pathname.endsWith('.css') && !ct.includes('text/css'))) {
    const safeType = ct.includes('text/css') ? 'text/css' : ct.includes('text/html') ? 'text/html' : 'other'
    const safeStatus = Number.isInteger(status) && status >= 100 && status <= 599 ? status : 'unknown'
    return `required asset ref=${ref}: HTTP ${safeStatus} content-type ${safeType}`
  }
  return null
}
