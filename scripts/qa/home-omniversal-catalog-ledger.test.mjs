import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FITUR_DARI_HUB } from '../../src/lib/katalogFitur.ts'

function routePathOnly(to) {
  return to.trim().split(/[?#]/, 1)[0] || '/'
}

test('FITUR_DARI_HUB has unique canonical base paths that resolve to src/main.tsx routes', () => {
  const main = readFileSync(new URL('../../src/main.tsx', import.meta.url), 'utf8')
  const registeredRoutes = new Set(
    [...main.matchAll(/<Route\s+[^>]*\bpath\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]),
  )

  const seenPaths = new Set()
  for (const entry of FITUR_DARI_HUB) {
    const base = routePathOnly(entry.to)
    assert.equal(seenPaths.has(base), false, `Duplicate base path in FITUR_DARI_HUB: ${base}`)
    seenPaths.add(base)
    assert.equal(
      registeredRoutes.has(base),
      true,
      `FITUR_DARI_HUB entry ${entry.to} (base ${base}) is missing from src/main.tsx`,
    )
  }

  const expectedDeepLinks = [
    '/fitness-hub?view=body-exposure&mode=atlas',
    '/body-exposure',
    '/scan',
    '/genome-lab',
    '/radiology',
    '/clinical-hub',
    '/med-study',
    '/for-you',
  ]
  for (const target of expectedDeepLinks) {
    assert.ok(
      FITUR_DARI_HUB.some((entry) => entry.to === target),
      `Expected Omniversal Home catalog entry missing: ${target}`,
    )
  }
})

test('BodyExposureOS parses ?mode= query parameter while keeping identity as default fallback', () => {
  const os = readFileSync(new URL('../../src/pages/bodyhub/BodyExposureOS.tsx', import.meta.url), 'utf8')
  assert.match(os, /useSearchParams/, 'BodyExposureOS must import/use useSearchParams')
  assert.match(os, /resolveExposureMode/, 'BodyExposureOS must validate mode query parameter via resolveExposureMode')
  assert.match(os, /searchParams\.get\('mode'\)\)\s*\?\?\s*'identity'/, 'BodyExposureOS must fall back to identity mode')
})

test('docs/governance/TASK_BOARD.md records Omniversal Genesis ledger with clinically_reviewed=false invariant', () => {
  const board = readFileSync(new URL('../../docs/governance/TASK_BOARD.md', import.meta.url), 'utf8')
  assert.match(board, /## Omniversal Genesis & Continuous Next-Gen 4-Superpage R&D Queue \(2026-11-28\)/)
  assert.match(board, /clinically_reviewed=false/)
  assert.match(board, /T-OMNI-HOME-01/)
  assert.match(board, /T-OMNI-BODY-01/)
  assert.match(board, /T-OMNI-CLIN-01/)
  assert.match(board, /T-OMNI-FY-01/)
})
