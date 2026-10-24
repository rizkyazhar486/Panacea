// ENG-F1-03: crash render satu halaman harus tertahan di batas per rute (Shell tetap hidup), bukan menjatuhkan aplikasi.
// Uji ini menjaga logika murni batas, posisinya di main.tsx (di dalam Shell, membungkus Suspense+Routes), dan bahwa
// kait crash QA serta sakelar kontrol negatif hanya hidup di build QA (VITE_QA_HOOKS=1), tidak di build biasa.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { QA_CRASH_KEY, qaShouldCrash, routeErrorForKey, routeErrorFromError } from '../../src/components/layout/routeErrorState.ts'

// 1. Logika murni
const galat = new Error('x')
assert.deepEqual(routeErrorFromError(galat), { error: galat })
assert.equal(routeErrorForKey({ error: galat, routeKey: '/chatbot' }, '/chatbot'), null, 'rute sama: galat tetap tampil')
assert.deepEqual(routeErrorForKey({ error: galat, routeKey: '/chatbot' }, '/settings'), { error: null, routeKey: '/settings' }, 'pindah rute: galat dibuang')
assert.equal(qaShouldCrash('/chatbot', '/chatbot'), true)
assert.equal(qaShouldCrash('/chatbot', '/settings'), false, 'kait hanya meledakkan rute sasaran')
assert.equal(qaShouldCrash(null, '/'), false, 'tanpa sasaran tidak ada crash')
assert.equal(QA_CRASH_KEY, 'panacea:qa-crash-route')

// 2. Posisi di pohon: Shell > RouteErrorBoundary > (QaCrashProbe, Suspense > Routes)
const main = readFileSync(new URL('../../src/main.tsx', import.meta.url), 'utf8')
const i = (s: string) => { const n = main.indexOf(s); assert.ok(n >= 0, `main.tsx tidak memuat ${s}`); return n }
assert.ok(i('<Shell>') < i('<RouteErrorBoundary>'), 'batas rute di DALAM Shell (Shell harus selamat)')
assert.ok(i('<RouteErrorBoundary>') < i('<QaCrashProbe />') && i('<QaCrashProbe />') < i('<Suspense fallback={<PageLoader />}>'), 'kait QA di dalam batas')
assert.ok(i('</Routes>') < i('</RouteErrorBoundary>') && i('</RouteErrorBoundary>') < i('</Shell>'), 'batas membungkus seluruh Routes')

// 3. Gerbang build: kedua sakelar QA diturunkan dari VITE_QA_HOOKS === '1' (konstanta false di build biasa)
const probe = readFileSync(new URL('../../src/components/layout/QaCrashProbe.tsx', import.meta.url), 'utf8')
const batas = readFileSync(new URL('../../src/components/layout/RouteErrorBoundary.tsx', import.meta.url), 'utf8')
assert.match(probe, /const QA_AKTIF = import\.meta\.env\.VITE_QA_HOOKS === '1'\n/)
assert.match(batas, /const QA_TANPA_BATAS = import\.meta\.env\.VITE_QA_HOOKS === '1' && import\.meta\.env\.VITE_QA_NO_ROUTE_BOUNDARY === '1'\n/)

// 4. Build biasa yang sudah ada (dist/) tidak boleh memuat kait QA. Dilewati bila belum dibangun (CI: build berjalan sebelum uji).
let berkasDist: string[] = []
try { berkasDist = readFileSync(new URL('../../dist/index.html', import.meta.url), 'utf8') ? (await import('node:fs')).readdirSync(new URL('../../dist/assets/', import.meta.url)).filter((f) => f.endsWith('.js')) : [] } catch { berkasDist = [] }
for (const f of berkasDist) {
  const js = readFileSync(new URL(`../../dist/assets/${f}`, import.meta.url), 'utf8')
  assert.ok(!js.includes('QA injected render crash'), `build biasa memuat kait crash QA: ${f}`)
}

console.log(`route-error-boundary: ok (logika, posisi di main.tsx, gerbang build; dist diperiksa ${berkasDist.length} berkas JS)`)
