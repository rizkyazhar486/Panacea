// F1: menjaga agar perjalanan ketahanan tetap terpasang di CI, mencakup peran dan halaman yang dijanjikan, dan kontrol negatifnya tidak dilepas.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const script = readFileSync(new URL('./user-journey-resilience.mjs', import.meta.url), 'utf8')
const workflow = readFileSync(new URL('../../.github/workflows/user-journey-acceptance.yml', import.meta.url), 'utf8')

test('journey covers five roles and the critical pages beyond the three in user-journey-e2e', () => {
  for (const j of ["J: 'pasien'", "J: 'dokter'", "J: 'pemilik'", "J: 'perawat'", "J: 'lab'"]) assert.ok(script.includes(j), `missing role ${j}`)
  for (const r of ["'#/chatbot'", "'#/settings'", "'#/profile'", "'#/fitness-hub'", "'#/all-features'", "'#/doctor-review/lab-results'", "'#/owner'"]) assert.ok(script.includes(r), `missing page ${r}`)
  const base = readFileSync(new URL('./user-journey-e2e.mjs', import.meta.url), 'utf8')
  for (const r of ["'#/harian'", "'#/health-data'", "'#/clinical-hub'"]) assert.ok(base.includes(r), `the original journey still covers ${r}`)
})

test('each page is checked for slow API, API 500 and recovery, with paired positive control and unhandled-error check', () => {
  for (const s of ['kontrol positif tanpa gangguan', 'API lambat', 'API 500', 'pemulihan', 'tanpa galat halaman tak tertangani']) assert.ok(script.includes(s), `missing step: ${s}`)
  assert.ok(/status: 500/.test(script) && /r\.fulfill/.test(script), 'API 500 is injected for real')
  assert.ok(/waitForFunction\([\s\S]*?\{ timeout: ms \}\)(?!\.catch)/.test(script), 'page readiness timeout/error must propagate instead of being swallowed')
  assert.ok(/overflowX\(page\)/.test(script) && /bocor\(/.test(script), 'overflow and leaked-text detectors are used')
  assert.ok(script.includes("'#/settings': /Reset Saved App State/"), 'Settings must load its own content, not merely shared navigation')
  const settings = readFileSync(new URL('../../src/pages/dashboard/Settings.tsx', import.meta.url), 'utf8')
  assert.ok(settings.includes('Reset Saved App State'), 'F1 Settings readiness marker must match the rendered Settings label')
  assert.ok(script.includes("rute === '#/chatbot' ? 0 : peran.minChar"), 'only the compact Chatbot route may skip the text-length minimum')
  assert.ok(script.includes('m <= 0 || t.trim().length > m'), 'route-specific readiness cannot bypass the minimum content threshold')
  for (const w of ['[object Object]', 'undefined', 'NaN', 'TypeError', 'Cannot read']) assert.ok(script.includes(`'${w}'`), `leak marker ${w}`)
})

test('nurse and lab fixture roles use the official owner-granted path and the journey runs on a fresh server', () => {
  assert.ok(script.includes("'/api/owner/staff-role'") && script.includes("'/api/owner/staff-assignments'"))
  assert.ok(script.includes("perawat.user.role, 'pasien'"), 'self-registered nurse is a patient first')
  assert.ok(script.includes("lab.user.role, 'pasien'"), 'self-registered lab is a patient first')
  assert.match(script, /staff-role'[\s\S]*?userId: lab\.user\.id, role: 'lab'/, 'lab role is owner-granted')
  assert.match(script, /staff-assignments'[\s\S]*?userId: lab\.user\.id, patientId: P/, 'lab receives an explicit patient assignment')
})

test('workflow runs the journey on a fresh server and keeps two negative controls that must fail by named step', () => {
  assert.ok(workflow.includes('fresh_server resilience'), 'fresh server for the resilience run')
  assert.ok(workflow.includes('node scripts/qa/user-journey-resilience.mjs'))
  assert.ok(/for mode in bocor overflow/.test(workflow), 'both sabotage modes')
  assert.ok(/QA_SABOTASE=\$mode/.test(workflow) && /LOLOS/.test(workflow), 'a sabotage run that passes fails the job')
  assert.ok(workflow.includes('berhenti tanpa langkah gagal bernama'), 'a sabotage run must stop at a named failing step')
  assert.equal((workflow.match(/user-journey-resilience\.mjs'/g) ?? []).length, 2, 'the script is in both path filters (push and pull_request)')
  assert.ok(workflow.includes('user-journey-resilience-negatif-bocor.json') && workflow.includes('user-journey-resilience-evidence.json'), 'evidence is uploaded')
})

test('negative-control modes are validated and injected into every page', () => {
  assert.ok(script.includes("['', 'bocor', 'overflow'].includes(SABOTASE)"), 'unknown sabotage mode fails closed')
  assert.ok(script.includes('addInitScript({ content: SKRIP_SABOTASE[SABOTASE] })'), 'sabotage is injected into the browser context')
  assert.ok(script.includes('NaN [object Object]') && script.includes('width:4000px'), 'leak and overflow payloads')
})

test('contributor identity has explicit negative authorization coverage rather than being counted as a functioning staff journey', () => {
  const main = readFileSync(new URL('./user-journey-e2e.mjs', import.meta.url), 'utf8')
  for (const marker of [
    "'kontributor-f1@example.com'", "'kontributor'",
    "'/api/staff/assignments'", "'/api/owner/staff-role'",
    "'/api/notify/user'", "'/api/auth/logout'",
  ]) assert.ok(main.includes(marker), `F1 contributor negative boundary missing: ${marker}`)
  assert.ok(main.includes('contributor cannot gain staff/owner/verifier powers'))
  assert.ok(main.includes('contributor token revoked on logout'))
})

test('ENG-F1-03 crash render: QA build must contain every page crash, and the no-boundary build must fail by named step', () => {
  assert.ok(script.includes("const CRASH = process.env.QA_CRASH === '1'") && script.includes("'panacea:qa-crash-route'"), 'crash mode uses the QA hook key')
  assert.ok(script.includes("assert.ok(!(CRASH && SABOTASE)"), 'one control per run')
  assert.ok(script.includes("'cangkang hilang setelah crash render (layar galat akar tampil)'"), 'shell loss is a named detector failure')
  assert.ok(workflow.includes('VITE_QA_HOOKS=1 npx vite build') && workflow.includes('VITE_QA_HOOKS=1 VITE_QA_NO_ROUTE_BOUNDARY=1 npx vite build'), 'both QA bundles are built')
  assert.ok(/QA_CRASH=1 QA_OUT="\$RUNNER_TEMP\/user-journey-resilience-crash\.json"[^\n]*\|\| rc=1/.test(workflow), 'positive crash run fails the job when it fails')
  assert.ok(workflow.includes("Kontrol negatif 'crash' LOLOS") && workflow.includes('f1-negative-evidence.mjs crash'), 'negative crash run must fail with verified detector evidence')
  assert.ok(workflow.includes('user-journey-resilience-negatif-crash.json') && workflow.includes('user-journey-resilience-crash.json'), 'crash evidence is uploaded')
})
