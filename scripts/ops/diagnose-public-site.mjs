#!/usr/bin/env node
// Diagnose why a public Panacea URL is down — from any laptop with Node 20+, no install, no credentials.
// Read-only: three DNS lookups and one GET (redirects are not followed). Exit 0 = the app shell answered, 1 = it did not.
//
//   node scripts/ops/diagnose-public-site.mjs [https://www.panaceamed.id/]
//
// The classifier is pure (status + headers + body in, verdict out) so it is tested on recorded fixtures
// (scripts/qa/diagnose-public-site.test.mjs). What it cannot do: see inside the owner's Cloudflare account.
// It names the failing layer and the one place to look; the fix itself happens in Cloudflare/GitHub settings.
import { pathToFileURL } from 'node:url'

/** Cloudflare error pages by code. Text is operator guidance (Indonesian); codes are Cloudflare's published ones. */
export const CLOUDFLARE_ERRORS = Object.freeze({
  '1033': {
    title: 'Cloudflare Tunnel tidak punya konektor yang hidup',
    cause: 'Nama host ini diarahkan ke sebuah Cloudflare Tunnel, tetapi tidak ada proses cloudflared yang tersambung untuk tunnel itu. Di semua perangkat hasilnya sama karena yang mati ada di sisi server.',
    steps: [
      'Di komputer yang menjalankan tunnel: pastikan server aplikasi hidup (curl -sI http://127.0.0.1:4040/ harus menjawab).',
      'Jalankan cloudflared untuk tunnel BERNAMA (cloudflared tunnel list, lalu cloudflared tunnel run <nama>). Tunnel cepat (--url) memberi alamat trycloudflare.com acak dan tidak pernah melayani www.panaceamed.id.',
      'Cloudflare dashboard > Zero Trust > Networks > Tunnels: status harus HEALTHY dengan minimal satu konektor, dan Public Hostname www.panaceamed.id harus menunjuk ke http://localhost:4040.',
      'Agar tidak terulang: pasang cloudflared sebagai layanan (sudo cloudflared service install <token>) dan jangan biarkan komputer tidur. Solusi permanen: layani build statis dari hosting terkelola (lihat docs/engineering/PUBLIC-SITE-DOWN-CLOUDFLARE.md).',
    ],
  },
  '1016': {
    title: 'Origin DNS error',
    cause: 'Cloudflare tidak bisa menemukan alamat server asal dari rekaman DNS host ini (target CNAME salah atau sudah dihapus).',
    steps: ['Cloudflare > DNS: periksa target rekaman untuk host ini, perbaiki ke alamat hosting yang benar.'],
  },
  '1000': { title: 'DNS points to prohibited IP', cause: 'Rekaman DNS menunjuk ke alamat IP yang ditolak Cloudflare.', steps: ['Cloudflare > DNS: ganti dengan alamat server asal yang valid.'] },
  '1001': { title: 'DNS resolution error', cause: 'Cloudflare tidak bisa me-resolve nama host server asal.', steps: ['Cloudflare > DNS: pastikan target rekaman dapat di-resolve.'] },
  '1002': { title: 'DNS points to prohibited IP', cause: 'Rekaman DNS menunjuk ke alamat IP yang ditolak Cloudflare.', steps: ['Cloudflare > DNS: ganti dengan alamat server asal yang valid.'] },
  '1014': { title: 'CNAME cross-user banned', cause: 'CNAME menunjuk ke domain di akun Cloudflare lain yang tidak mengizinkannya.', steps: ['Gunakan target yang disediakan layanan hosting untuk domain kustom, bukan CNAME ke zona akun lain.'] },
  '1015': { title: 'Terkena pembatasan laju', cause: 'Aturan rate limiting Cloudflare memblokir permintaan ini.', steps: ['Tunggu beberapa menit; periksa aturan rate limiting jika terus terjadi.'] },
  '1020': { title: 'Akses ditolak aturan firewall', cause: 'Aturan WAF/firewall Cloudflare memblokir permintaan ini.', steps: ['Cloudflare > Security > Events: cari Ray ID di halaman galat dan lihat aturan yang memblokir.'] },
  '520': { title: 'Server asal mengirim jawaban tak dikenal', cause: 'Server asal menutup koneksi atau mengirim jawaban kosong/rusak.', steps: ['Periksa log server asal; mulai ulang proses aplikasinya.'] },
  '521': { title: 'Server asal mati', cause: 'Cloudflare terhubung ke server asal tetapi koneksi ditolak (aplikasi tidak berjalan atau port salah).', steps: ['Mulai aplikasi di server asal dan pastikan port yang dituju Cloudflare terbuka.'] },
  '522': { title: 'Koneksi ke server asal habis waktu', cause: 'Server asal tidak menjawab tepat waktu (kelebihan beban atau firewall memblokir alamat Cloudflare).', steps: ['Izinkan rentang IP Cloudflare di firewall server asal; periksa beban server.'] },
  '523': { title: 'Server asal tidak terjangkau', cause: 'Cloudflare tidak menemukan rute ke server asal (DNS/routing).', steps: ['Periksa alamat IP server asal di rekaman DNS dan jalur jaringannya.'] },
  '524': { title: 'Server asal terlalu lama menjawab', cause: 'Koneksi berhasil tetapi server asal tidak menjawab dalam batas waktu Cloudflare.', steps: ['Periksa permintaan yang lambat di server asal.'] },
  '525': { title: 'Jabat tangan SSL ke server asal gagal', cause: 'Mode SSL Cloudflare (Full) tidak cocok dengan konfigurasi TLS server asal.', steps: ['Cloudflare > SSL/TLS: samakan mode dengan server asal, atau pasang sertifikat di server asal.'] },
  '526': { title: 'Sertifikat SSL server asal tidak sah', cause: 'Server asal menyajikan sertifikat yang tidak valid untuk mode Full (strict).', steps: ['Pasang sertifikat valid (mis. Cloudflare Origin CA) di server asal.'] },
  '530': { title: 'Galat 1xxx dari Cloudflare tanpa kode terbaca', cause: 'HTTP 530 menyertai galat 1xxx (paling sering DNS asal atau tunnel).', steps: ['Buka halaman galat di peramban dan baca kode 1xxx-nya, lalu jalankan ulang skrip ini.'] },
})

const GENERIC_CLOUDFLARE = Object.freeze({
  title: 'Cloudflare mengembalikan halaman galat',
  cause: 'Cloudflare menjawab dengan halaman galat yang kodenya tidak ada di tabel skrip ini.',
  steps: ['Cari kode galat dan Ray ID di dokumentasi Cloudflare (Error codes), lalu periksa dashboard.'],
})

const stripTags = (html) => String(html).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const headerOf = (headers, name) => {
  if (!headers) return ''
  if (typeof headers.get === 'function') return String(headers.get(name) ?? '')
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name)
  return key ? String(headers[key]) : ''
}

/** Cloudflare page code: "Error 1033", "Error code 1033" (older layout) or "Cloudflare ... 521". Null when absent. */
export function cloudflareCodeFrom(text) {
  const m = String(text).match(/\bError(?:\s+code)?\s*:?\s*(1\d{3}|5\d{2})\b/i)
  return m ? m[1] : null
}

/**
 * Verdict from one response. Input is data only (no network): { status:number, headers, body:string }.
 * 'ok' needs HTTP 200 AND the app shell AND no Cloudflare error text — a 200 that carries an error page is still down.
 */
export function classifyResponse({ status, headers, body }) {
  const text = stripTags(body ?? '')
  const viaCloudflare = /cloudflare/i.test(headerOf(headers, 'server')) || headerOf(headers, 'cf-ray') !== ''
  const code = cloudflareCodeFrom(text)
  const rayId = (text.match(/Ray ID:\s*([0-9a-f]{12,})/i) ?? [])[1] ?? null
  if (code && (viaCloudflare || /cloudflare/i.test(text))) {
    const entry = CLOUDFLARE_ERRORS[code] ?? GENERIC_CLOUDFLARE
    return { verdict: 'cloudflare-error', code, rayId, status, ...entry }
  }
  if (status === 530 && viaCloudflare) return { verdict: 'cloudflare-error', code: '530', rayId, status, ...CLOUDFLARE_ERRORS['530'] }
  if (!Number.isInteger(status) || status < 100) return { verdict: 'unreachable', code: null, rayId: null, status: null, title: 'Tidak ada jawaban HTTP', cause: 'Tidak ada status HTTP yang valid.', steps: ['Periksa DNS dan koneksi internet, lalu ulangi.'] }
  if (status >= 500) return { verdict: 'origin-error', code: String(status), rayId, status, title: `Server menjawab HTTP ${status}`, cause: viaCloudflare ? 'Cloudflare meneruskan galat dari server asal.' : 'Server menjawab galat tanpa halaman Cloudflare.', steps: ['Periksa log aplikasi di server asal.'] }
  if (status >= 300 && status < 400) return { verdict: 'redirect', code: null, rayId, status, title: `Dialihkan (HTTP ${status})`, cause: `Pengalihan ke ${headerOf(headers, 'location') || 'alamat lain'}; skrip ini tidak mengikutinya.`, steps: ['Jalankan ulang skrip dengan alamat tujuan pengalihan.'] }
  if (status >= 400) return { verdict: 'origin-error', code: String(status), rayId, status, title: `Server menjawab HTTP ${status}`, cause: 'Alamat ini ditolak atau tidak ada di server.', steps: ['Periksa alamat dan pengaturan hosting.'] }
  const shell = /id=["']root["']/i.test(String(body ?? ''))
  if (status === 200 && shell) return { verdict: 'ok', code: null, rayId, status, title: 'Aplikasi menjawab', cause: '', steps: [] }
  return { verdict: 'unknown', code: null, rayId, status, title: 'Jawaban 200 tetapi bukan aplikasi Panacea', cause: 'Halaman tidak memuat penanda aplikasi (elemen root).', steps: ['Buka alamat di peramban dan periksa isi halamannya.'] }
}

/** Where a visible DNS target leads. Proxied Cloudflare hosts hide their CNAME, so an empty list is not an error. */
export function describeDnsTarget(cnames) {
  const list = (Array.isArray(cnames) ? cnames : []).map((c) => String(c).toLowerCase().replace(/\.$/, ''))
  if (list.length === 0) return { kind: 'tersembunyi', hint: 'Tidak ada CNAME yang terlihat (host diproksi Cloudflare, atau rekaman A). Lihat dashboard Cloudflare > DNS.' }
  const hit = (suffix) => list.some((c) => c === suffix || c.endsWith(`.${suffix}`))
  if (hit('cfargotunnel.com')) return { kind: 'cloudflare-tunnel', hint: 'Menunjuk ke Cloudflare Tunnel: cloudflared harus hidup di komputer asal.' }
  if (hit('github.io')) return { kind: 'github-pages', hint: 'Menunjuk ke GitHub Pages: periksa Settings > Pages dan variabel ENABLE_GITHUB_PAGES.' }
  if (hit('vercel-dns.com') || hit('vercel.app')) return { kind: 'vercel', hint: 'Menunjuk ke Vercel: periksa proyek dan domain di dashboard Vercel.' }
  if (hit('pages.dev')) return { kind: 'cloudflare-pages', hint: 'Menunjuk ke Cloudflare Pages: periksa deployment terakhir.' }
  if (hit('onrender.com')) return { kind: 'render', hint: 'Menunjuk ke Render: periksa layanan di dashboard Render.' }
  return { kind: 'lain', hint: `Menunjuk ke ${list[0]}.` }
}

/** Only plain http(s) URLs with a host are probed; anything else is refused before any request is made. */
export function parseTarget(input) {
  const raw = String(input ?? '').trim()
  if (!raw) return { ok: false, reason: 'kosong' }
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  let url
  try { url = new URL(withScheme) } catch { return { ok: false, reason: 'bukan-url' } }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, reason: 'skema-ditolak' }
  if (!url.hostname || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(url.hostname)) return { ok: false, reason: 'host-tidak-sah' }
  if (url.username || url.password) return { ok: false, reason: 'kredensial-ditolak' }
  return { ok: true, url: url.href, hostname: url.hostname }
}

const withTimeout = (promise, ms, label) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${label}: batas waktu ${ms} ms`)), ms))])

export async function diagnose(target, { fetchImpl = globalThis.fetch, dns = null, timeoutMs = 15000 } = {}) {
  const parsed = parseTarget(target)
  if (!parsed.ok) return { ok: false, refused: parsed.reason }
  const resolver = dns ?? await import('node:dns/promises')
  const cnames = await withTimeout(resolver.resolveCname(parsed.hostname), 5000, 'DNS CNAME').catch(() => [])
  const addresses = await withTimeout(resolver.resolve4(parsed.hostname), 5000, 'DNS A').catch(() => [])
  let response
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try { response = await fetchImpl(parsed.url, { method: 'GET', redirect: 'manual', signal: controller.signal, headers: { 'user-agent': 'panacea-diagnose/1' } }) } finally { clearTimeout(timer) }
  } catch (error) {
    return { ok: false, parsed, dns: { cnames, addresses, target: describeDnsTarget(cnames) }, result: { verdict: 'unreachable', code: null, rayId: null, status: null, title: 'Tidak bisa terhubung', cause: `Permintaan gagal: ${error?.cause?.code ?? error?.name ?? 'galat jaringan'}.`, steps: addresses.length === 0 && cnames.length === 0 ? ['Nama host tidak ter-resolve: periksa rekaman DNS di Cloudflare. Bila situs lain juga tidak terbuka dari jaringan ini, masalahnya jaringan Anda, bukan situs.'] : ['Periksa koneksi internet Anda, lalu ulangi.'] } }
  }
  const body = (await response.text().catch(() => '')).slice(0, 65536)
  const result = classifyResponse({ status: response.status, headers: response.headers, body })
  return { ok: result.verdict === 'ok', parsed, dns: { cnames, addresses, target: describeDnsTarget(cnames) }, result }
}

export function formatReport(report) {
  if (report.refused) return `Ditolak: alamat tidak diperiksa (${report.refused}). Gunakan alamat http(s) tanpa kredensial.`
  const { parsed, dns, result } = report
  const lines = [`Alamat      : ${parsed.url}`, `DNS         : ${dns.cnames.length ? `CNAME ${dns.cnames.join(', ')}` : 'tanpa CNAME terlihat'}${dns.addresses.length ? ` · A ${dns.addresses.slice(0, 3).join(', ')}` : ''}`, `Arah DNS    : ${dns.target.hint}`, `Hasil       : ${result.verdict}${result.status ? ` (HTTP ${result.status})` : ''}${result.code ? ` · kode ${result.code}` : ''}${result.rayId ? ` · Ray ID ${result.rayId}` : ''}`, `Arti        : ${result.title}`]
  if (result.cause) lines.push(`Penyebab    : ${result.cause}`)
  result.steps.forEach((step, i) => lines.push(`Langkah ${i + 1}   : ${step}`))
  return lines.join('\n')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const report = await diagnose(process.argv[2] ?? 'https://www.panaceamed.id/')
  console.log(formatReport(report))
  process.exit(report.ok ? 0 : 1)
}
