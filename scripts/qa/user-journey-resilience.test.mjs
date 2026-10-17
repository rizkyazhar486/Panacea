// F1: menjaga agar perjalanan ketahanan tetap terpasang di CI, mencakup peran dan halaman yang dijanjikan, dan kontrol negatifnya tidak dilepas.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const script = readFileSync(new URL('./user-journey-resilience.mjs', import.meta.url), 'utf8')
const workflow = readFileSync(new URL('../../.github/workflows/user-journey-acceptance.yml', import.meta.url), 'utf8')

test('journey covers four roles and the critical pages beyond the three in user-journey-e2e', () => {
  for (const j of ["J: 'pasien'", "J: 'dokter'", "J: 'pemilik'", "J: 'perawat'"]) assert.ok(script.includes(j), `missing role ${j}`)
  for (const r of ["'#/chatbot'", "'#/settings'", "'#/profile'", "'#/fitness-hub'", "'#/all-features'", "'#/doctor-review/lab-results'", "'#/owner'"]) assert.ok(script.includes(r), `missing page ${r}`)
  const base = readFileSync(new URL('./user-journey-e2e.mjs', import.meta.url), 'utf8')
  for (const r of ["'#/harian'", "'#/health-data'", "'#/clinical-hub'"]) assert.ok(base.includes(r), `the original journey still covers ${r}`)
})

test('each page is checked for slow API, API 500 and recovery, with paired positive control and unhandled-error check', () => {
  for (const s of ['kontrol positif tanpa gangguan', 'API lambat', 'API 500', 'pemulihan', 'tanpa galat halaman tak tertangani']) assert.ok(script.includes(s), `missing step: ${s}`)
  assert.ok(/status: 500/.test(script) && /r\.fulfill/.test(script), 'API 500 is injected for real')
  assert.ok(/overflowX\(page\)/.test(script) && /bocor\(/.test(script), 'overflow and leaked-text detectors are used')
  for (const w of ['[object Object]', 'undefined', 'NaN', 'TypeError', 'Cannot read']) assert.ok(script.includes(`'${w}'`), `leak marker ${w}`)
})

test('nurse and fixture roles use the official owner-granted path and the journey runs on a fresh server', () => {
  assert.ok(script.includes("'/api/owner/staff-role'") && script.includes("'/api/owner/staff-assignments'"))
  assert.ok(script.includes("perawat.user.role, 'pasien'"), 'self-registered nurse is a patient first')
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
