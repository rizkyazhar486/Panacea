// F2: menjaga agar audit performa tetap berjalan di CI pada build produksi dengan metodologi yang dinyatakan.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const script = readFileSync(new URL('./perf-audit.mjs', import.meta.url), 'utf8')
const workflow = readFileSync(new URL('../../.github/workflows/ux-audit-acceptance.yml', import.meta.url), 'utf8')

test('script measures the production build with cold contexts, mobile CPU throttling and named metrics', () => {
  assert.ok(script.includes('newContext') && /for \(let i = 0; i < N; i\+\+\)/.test(script), 'a fresh context per sample')
  assert.ok(script.includes('Emulation.setCPUThrottlingRate') && /cpu: 4/.test(script), 'mobile CPU throttling 4x')
  for (const m of ['largest-contentful-paint', 'layout-shift', 'longtask', 'first-contentful-paint', 'encodedBodySize']) assert.ok(script.includes(m), `metric source ${m}`)
  for (const k of ['lcpMs', 'cls', 'tbtMs', 'bytesJs', 'requests']) assert.ok(script.includes(k), `reported metric ${k}`)
  assert.ok(script.includes('390') && script.includes('1440'), 'both viewports')
  for (const r of ["'#/harian'", "'#/chatbot'", "'#/clinical-hub'", "'#/health-data'"]) assert.ok(script.includes(r), `page ${r}`)
  assert.ok(script.includes('landing-anonim') && script.includes('beranda-pasien'), 'anonymous and signed-in landing')
})

test('script is honest about its limits and fails only when a page cannot be measured at all', () => {
  assert.ok(/BATAS: runner CI bukan perangkat pengguna/.test(script) && /bukan klaim pengalaman pengguna/.test(script), 'limits are stated in the script')
  assert.ok(/gagalUkur > 0/.test(script) && /process\.exit\(1\)/.test(script), 'unmeasurable page fails the run')
  assert.ok(!/process\.exit\(0\)/.test(script) && !/ANGGARAN\.\w+ \* /.test(script), 'no invented thresholds or silent success')
})

test('workflow builds production output and runs the audit as its own job with the scripts in both path filters', () => {
  assert.ok(/perf-audit:\n/.test(workflow), 'separate job')
  assert.ok(workflow.includes('VITE_API_URL=http://127.0.0.1:18790 npx vite build'), 'production build, not the dev server')
  assert.ok(workflow.includes('npx vite preview --host 127.0.0.1 --port 5191 --strictPort'), 'serves the production build')
  assert.ok(workflow.includes('node scripts/qa/perf-audit.mjs'))
  assert.ok(workflow.includes('name: perf-evidence'), 'evidence uploaded')
  assert.equal((workflow.match(/scripts\/qa\/perf-audit\.mjs'/g) ?? []).length, 2, 'perf-audit.mjs in push and pull_request paths')
  assert.equal((workflow.match(/scripts\/qa\/perf-stats\.mjs'/g) ?? []).length, 2, 'perf-stats.mjs in push and pull_request paths')
})
