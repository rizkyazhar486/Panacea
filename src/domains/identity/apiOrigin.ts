// Pure API origin resolver for PanaceaMed frontend builds.
// Keeps explicit VITE_API_URL authoritative (CI, local dev, custom staging),
// defaults Cloudflare edge hosts (panaceamed.id / *.workers.dev) to the live
// Render API so real Google OAuth works even when build vars are omitted, and
// fails closed to '' on unknown/spoofed/localhost hosts.

export const PRODUCTION_API_ORIGIN = 'https://panaceamed-backend.onrender.com'

const PRODUCTION_EXACT_HOSTS = new Set([
  'panaceamed.id',
  'www.panaceamed.id',
])

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/** True only for PanaceaMed's real Cloudflare production/preview hosts (anti-spoofing). */
export function isProductionEdgeHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')
  if (!host) return false
  if (PRODUCTION_EXACT_HOSTS.has(host)) return true
  if (host.endsWith('.panaceamed.id') && host.length > '.panaceamed.id'.length) return true
  if (host.endsWith('.workers.dev') && host.length > '.workers.dev'.length) return true
  return false
}

export function resolveApiOrigin(
  configuredUrl: string | undefined | null,
  browserHostname = '',
): string {
  if (typeof configuredUrl === 'string' && configuredUrl.trim().length > 0) {
    return normalizeOrigin(configuredUrl)
  }
  return isProductionEdgeHost(browserHostname) ? PRODUCTION_API_ORIGIN : ''
}
