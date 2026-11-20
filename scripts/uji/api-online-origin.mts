import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  COLD_START_RETRY_DELAYS_MS,
  COLD_START_TIMEOUT_MS,
  MAX_COLD_START_TIMEOUT_MS,
  MIN_COLD_START_TIMEOUT_MS,
  PRODUCTION_API_ORIGIN,
  SERVER_WAKING_MESSAGE,
  SERVER_WAKE_TIMEOUT_MESSAGE,
  describeServerWakeStatus,
  normalizeColdStartTimeoutMs,
  resolveApiBaseUrl,
  shouldRetryColdStart,
} from '../../src/domains/identity/apiOrigin.ts'

/** Memastikan panaceamed.id tersambung online, selaras cold start Render (30-60 detik), dan deploy tunggal terjaga. */
export function verifyApiOnlineOriginContract(inputs: {
  readonly apiSource: string
  readonly cloudflarePagesWorkflow: string
  readonly githubPagesWorkflow: string
}) {
  // Positif: produksi dan override env
  assert.equal(resolveApiBaseUrl(undefined, 'panaceamed.id'), PRODUCTION_API_ORIGIN)
  assert.equal(resolveApiBaseUrl('', 'www.panaceamed.id'), PRODUCTION_API_ORIGIN)
  assert.equal(resolveApiBaseUrl('  ', 'app.panaceamed.id'), PRODUCTION_API_ORIGIN)
  assert.equal(resolveApiBaseUrl('https://api.panaceamed.id///', 'panaceamed.id'), 'https://api.panaceamed.id')
  assert.equal(resolveApiBaseUrl('http://127.0.0.1:18790/', 'localhost'), 'http://127.0.0.1:18790')

  // Positif: timeout, retry GET/HEAD, dan pesan status bangun server
  assert.equal(normalizeColdStartTimeoutMs(45_000), 45_000)
  assert.equal(shouldRetryColdStart({ method: 'GET', attempt: 1, maxAttempts: 3, isTimeout: true }), true)
  assert.equal(shouldRetryColdStart({ method: 'HEAD', attempt: 2, maxAttempts: 3, status: 503 }), true)
  assert.equal(shouldRetryColdStart({ method: 'GET', attempt: 1, maxAttempts: 3, status: 502 }), true)
  assert.equal(shouldRetryColdStart({ method: 'GET', attempt: 1, maxAttempts: 3, status: 504 }), true)
  assert.equal(describeServerWakeStatus('waking').message, SERVER_WAKING_MESSAGE)
  assert.match(SERVER_WAKING_MESSAGE, /30–60 detik/, 'pesan bangun harus menyebut cold start 30-60 detik')
  assert.equal(describeServerWakeStatus('timeout').message, SERVER_WAKE_TIMEOUT_MESSAGE)
  assert.equal(describeServerWakeStatus('ready').message, null)
  assert.equal(describeServerWakeStatus('idle').message, null)

  // Negatif: isolasi CI/localhost, anti-spoofing, dan non-idempotent POST tidak di-retry
  assert.equal(resolveApiBaseUrl('', 'localhost'), '')
  assert.equal(resolveApiBaseUrl('', '127.0.0.1'), '')
  assert.equal(resolveApiBaseUrl('', undefined), '')
  assert.equal(resolveApiBaseUrl('', 'evil-panaceamed.id'), '')
  assert.equal(resolveApiBaseUrl('', 'panaceamed.id.evil.com'), '')
  assert.equal(resolveApiBaseUrl('', 'rizkyazhar486.github.io'), '')
  assert.equal(shouldRetryColdStart({ method: 'POST', attempt: 1, maxAttempts: 3, isTimeout: true }), false)
  assert.equal(shouldRetryColdStart({ method: 'PUT', attempt: 1, maxAttempts: 3, status: 503 }), false)
  assert.equal(shouldRetryColdStart({ method: 'GET', attempt: 1, maxAttempts: 3, status: 500 }), false)
  assert.equal(shouldRetryColdStart({ method: 'GET', attempt: 1, maxAttempts: 3, status: 403 }), false)
  assert.equal(shouldRetryColdStart({ method: 'GET', attempt: 1, maxAttempts: 3, status: null, isTimeout: false }), false)

  // Batas: timeout < 30 detik (mis. 10 detik) ditolak dan naik ke 65 detik; max 120 detik; batas attempt
  assert.equal(MIN_COLD_START_TIMEOUT_MS, 30_000)
  assert.equal(COLD_START_TIMEOUT_MS, 65_000)
  assert.equal(MAX_COLD_START_TIMEOUT_MS, 120_000)
  assert.equal(normalizeColdStartTimeoutMs(10_000), COLD_START_TIMEOUT_MS)
  assert.equal(normalizeColdStartTimeoutMs(29_999), COLD_START_TIMEOUT_MS)
  assert.equal(normalizeColdStartTimeoutMs(30_000), 30_000)
  assert.equal(normalizeColdStartTimeoutMs(120_000), 120_000)
  assert.equal(normalizeColdStartTimeoutMs(120_001), 120_000)
  assert.equal(normalizeColdStartTimeoutMs(Number.NaN), COLD_START_TIMEOUT_MS)
  assert.equal(shouldRetryColdStart({ method: 'GET', attempt: 0, maxAttempts: 3, isTimeout: true }), false)
  assert.equal(shouldRetryColdStart({ method: 'GET', attempt: 3, maxAttempts: 3, isTimeout: true }), false)
  assert.ok(COLD_START_RETRY_DELAYS_MS.length >= 2)

  // Kontrak sumber api.ts (harus lewat ../domains/identity & memakai globalThis.location, tanpa 10000 ms hardcoded)
  assert.match(inputs.apiSource, /resolveApiBaseUrl\(/, 'api.ts harus memanggil resolveApiBaseUrl(')
  assert.match(inputs.apiSource, /normalizeColdStartTimeoutMs\(/, 'api.ts harus memakai normalizeColdStartTimeoutMs(')
  assert.equal((inputs.apiSource.match(/shouldRetryColdStart\(/g) ?? []).length >= 2, true, 'api.ts harus memanggil shouldRetryColdStart( untuk status 5xx dan AbortError')
  assert.match(inputs.apiSource, /getServerWakeStatus\(/, 'api.ts harus mengekspor getServerWakeStatus()')
  assert.match(inputs.apiSource, /onServerWakeStatusChange\(/, 'api.ts harus mengekspor onServerWakeStatusChange()')
  assert.match(inputs.apiSource, /import\.meta\.env\.VITE_API_URL/, 'api.ts harus tetap membaca import.meta.env.VITE_API_URL')
  assert.match(inputs.apiSource, /globalThis\.location/, 'api.ts harus memakai globalThis.location agar tidak menambah window baru')
  assert.doesNotMatch(inputs.apiSource, /setTimeout\([^)]*10000\)/, 'api.ts tidak boleh mengembalikan timeout 10 detik')
  assert.match(inputs.apiSource, /'postgres'\s*\|\s*'mongo'\s*\|\s*'berkas'/, 'Health.penyimpanan harus mendukung postgres')

  // Kontrak deploy tunggal: pemicu push paralel dinonaktifkan & VITE_API_URL terdokumentasi
  for (const [label, wf] of [
    ['cloudflare-pages.yml', inputs.cloudflarePagesWorkflow],
    ['deploy.yml', inputs.githubPagesWorkflow],
  ] as const) {
    assert.doesNotMatch(wf, /^\s*push:\s*$/m, `${label} tidak boleh memicu push otomatis ganda`)
    assert.match(wf, /^\s*workflow_dispatch:\s*$/m, `${label} tetap menyediakan workflow_dispatch manual`)
    assert.match(wf, /VITE_API_URL=https:\/\/panaceamed-backend\.onrender\.com/, `${label} harus mencatat VITE_API_URL Worker`)
  }
}

const root = new URL('../../', import.meta.url)
const liveInputs = {
  apiSource: readFileSync(new URL('src/lib/api.ts', root), 'utf8'),
  cloudflarePagesWorkflow: readFileSync(new URL('.github/workflows/cloudflare-pages.yml', root), 'utf8'),
  githubPagesWorkflow: readFileSync(new URL('.github/workflows/deploy.yml', root), 'utf8'),
}

verifyApiOnlineOriginContract(liveInputs)

// Bukti sabotase: setiap mutasi regresi wajib gagal dengan nama AssertionError
const sabotages: readonly [string, Partial<typeof liveInputs>][] = [
  ['missing-resolver', { apiSource: liveInputs.apiSource.replaceAll('resolveApiBaseUrl(', 'directBase(') }],
  ['timeout-10s-regression', { apiSource: liveInputs.apiSource.replaceAll('normalizeColdStartTimeoutMs(', '((t?: number) => t ?? 10000)(') }],
  ['missing-retry-guard', { apiSource: liveInputs.apiSource.replaceAll('shouldRetryColdStart(', '(() => false)(') }],
  ['missing-postgres-type', { apiSource: liveInputs.apiSource.replace("'postgres' | 'mongo' | 'berkas'", "'mongo' | 'berkas'") }],
  ['reenabled-parallel-pages-push', { cloudflarePagesWorkflow: `${liveInputs.cloudflarePagesWorkflow}\non:\n  push:\n` }],
]
for (const [label, patch] of sabotages) {
  assert.throws(
    () => verifyApiOnlineOriginContract({ ...liveInputs, ...patch }),
    { name: 'AssertionError' },
    `sabotase ${label} harus gagal dengan AssertionError`,
  )
}

console.log(`api-online-origin: kontrak online, cold start (>=30s/65s/retry), deploy tunggal, & ${sabotages.length} bukti sabotase terverifikasi`)
