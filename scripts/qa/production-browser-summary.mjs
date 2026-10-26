import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const accept = (value, valid) => {
  if (!valid(value)) throw new Error('invalid-sanitized-production-report')
  return value
}
const object = value => accept(value, v => v !== null && typeof v === 'object' && !Array.isArray(v))
const array = value => accept(value, Array.isArray)
const count = value => accept(value, v => v === null || (Number.isSafeInteger(v) && v >= 0))
const status = value => accept(value, v => v === null || (Number.isInteger(v) && v >= 100 && v <= 599))
const bool = value => accept(value, v => typeof v === 'boolean')
const category = value => accept(value, v => [
  'network_dns', 'network_tls', 'network_http', 'tls_untrusted', 'http_final_status', 'required_asset_failed',
  'root_error_boundary', 'browser_error', 'horizontal_overflow', 'webgl_unavailable', 'server_sha_mismatch',
  'server_health_unavailable', 'body_render_unavailable', 'public_home_failure', 'other',
].includes(v))

// Ringkasan membaca kontrak tersanitasi; jangan hidupkan kembali URL, teks, atau galat mentah.
export function formatProductionBrowserSummary(value) {
  const report = object(value)
  const network = object(report.network)
  const server = report.server === null ? null : object(report.server)
  const safe = {
    network: {
      dnsAddressCount: count(network.dnsAddressCount),
      tls: network.tls === null ? null : { authorized: bool(object(network.tls).authorized) },
      httpStatuses: array(network.httpStatuses).map(status),
      failed: network.failed === null ? null : { stage: accept(object(network.failed).stage, v => ['dns', 'tls', 'http', 'unknown'].includes(v)) },
    },
    server: server === null ? null : {
      commit: accept(server.commit, v => v === null || (typeof v === 'string' && /^[0-9a-f]{40}$/i.test(v))),
      matchesExpected: bool(server.matchesExpected),
    },
    findings: array(report.findings).map(value => {
      const finding = object(value)
      return { severity: accept(finding.severity, v => ['fail', 'warn', 'info'].includes(v)), category: category(finding.category) }
    }),
    viewports: array(report.viewports).map(value => {
      const viewport = object(value)
      return { width: count(viewport.width), height: count(viewport.height), status: status(viewport.status),
        overflowX: bool(viewport.overflowX), webgl2: bool(viewport.webgl2), errorsCount: count(viewport.errorsCount),
        bodyCanvasPresent: bool(viewport.bodyCanvasPresent), bodyLoaded: bool(viewport.bodyLoaded) }
    }),
  }
  return JSON.stringify(safe, null, 1) + '\n'
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('invalid-summary-arguments')
    process.stdout.write(formatProductionBrowserSummary(JSON.parse(readFileSync(process.argv[2], 'utf8'))))
  } catch {
    // Pesan tetap: galat I/O dan JSON bisa memuat jalur atau nilai rahasia.
    process.stderr.write('production browser summary unavailable: invalid or unreadable report\n')
    process.exitCode = 1
  }
}
