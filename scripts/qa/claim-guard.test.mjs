// Pengujian unit untuk penjaga klaim (WP-1 Directive D-100).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { loadPolicy, run, scanText } from './claim-guard.mjs'

const basePolicy = {
  terms: ['biophoton', 'eternity', '1:1 digital twin'],
  include: ['src', 'public'],
  exclude: ['node_modules', 'dist'],
  allowedBoundaryPaths: ['src/simulations/'],
  baseline: []
}

test('1. Clean text produces 0 hits', () => {
  const hits = scanText('export const heartRateBpm = 72;\n', 'src/clinical.ts', basePolicy)
  assert.equal(hits.length, 0)
})

test('2. "biophoton therapy" in src/x.ts produces 1 violation naming the term and line', () => {
  const hits = scanText('const mode = "classic";\n// biophoton therapy enabled\n', 'src/x.ts', basePolicy)
  assert.equal(hits.length, 1)
  assert.deepEqual(hits[0], { file: 'src/x.ts', line: 2, term: 'biophoton' })
})

test('3. Boundary marker outside allowedBoundaryPaths still produces a violation', () => {
  const text = '// @panacea-claim-boundary: simulation-not-clinical\nconst x = "biophoton";\n'
  const hits = scanText(text, 'src/x.ts', basePolicy)
  assert.equal(hits.length, 1)
  assert.equal(hits[0].term, 'biophoton')
})

test('4. Boundary marker inside allowedBoundaryPaths produces 0 violations', () => {
  const text = '// @panacea-claim-boundary: simulation-not-clinical\nconst x = "biophoton";\n'
  const hits = scanText(text, 'src/simulations/demo.ts', basePolicy)
  assert.equal(hits.length, 0)
})

test('5. Term inside a longer word (eternityx) is not matched (whole-word matching)', () => {
  const hits = scanText('const identifier = "eternityx_module";\n', 'src/x.ts', basePolicy)
  assert.equal(hits.length, 0)
})

test('6. Baseline entry suppresses exactly that file+term and nothing else', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'claim-guard-t6-'))
  try {
    mkdirSync(join(tmp, 'src'), { recursive: true })
    writeFileSync(join(tmp, 'src/a.ts'), 'const a = "biophoton";\nconst b = "eternity";\n')
    writeFileSync(join(tmp, 'src/b.ts'), 'const c = "biophoton";\n')
    const policy = {
      ...basePolicy,
      baseline: [{ file: 'src/a.ts', term: 'biophoton' }]
    }
    const { violations, stale } = run(tmp, policy)
    assert.equal(stale.length, 0)
    assert.equal(violations.length, 2)
    assert.deepEqual(
      violations.map((v) => `${v.file}:${v.term}`).sort(),
      ['src/a.ts:eternity', 'src/b.ts:biophoton']
    )
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('7. Removed baseline hit is reported as stale and run returns 0 violations', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'claim-guard-t7-'))
  try {
    mkdirSync(join(tmp, 'src'), { recursive: true })
    writeFileSync(join(tmp, 'src/clean.ts'), 'export const ok = true;\n')
    const policy = {
      ...basePolicy,
      baseline: [{ file: 'src/clean.ts', term: 'biophoton' }]
    }
    const { violations, stale } = run(tmp, policy)
    assert.equal(violations.length, 0)
    assert.equal(stale.length, 1)
    assert.deepEqual(stale[0], { file: 'src/clean.ts', term: 'biophoton' })
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('8. Policy with an empty term fails validation by name', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'claim-guard-t8-'))
  try {
    const badPolicyPath = join(tmp, 'bad-policy.json')
    writeFileSync(
      badPolicyPath,
      JSON.stringify({
        terms: ['biophoton', '   '],
        include: ['src'],
        exclude: [],
        allowedBoundaryPaths: [],
        baseline: []
      })
    )
    assert.throws(() => loadPolicy(badPolicyPath), /claim-guard: policy\.terms contains an empty/)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('9. CLI on a temp dir with one violation exits 1 and prints the exact line format', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'claim-guard-t9-'))
  try {
    mkdirSync(join(tmp, 'src'), { recursive: true })
    mkdirSync(join(tmp, 'governance'), { recursive: true })
    writeFileSync(join(tmp, 'src/bad.ts'), 'const x = 1;\nconst y = "biophoton";\n')
    writeFileSync(join(tmp, 'governance/CLAIM_GUARD_POLICY.json'), JSON.stringify(basePolicy))
    const scriptAbs = resolve('scripts/qa/claim-guard.mjs')
    let failed = false
    try {
      execFileSync(process.execPath, [scriptAbs], { cwd: tmp, encoding: 'utf8', stdio: 'pipe' })
    } catch (err) {
      failed = true
      assert.equal(err.status, 1)
      assert.match(err.stderr, /src\/bad\.ts:2: unsupported-claim "biophoton"/)
    }
    assert.equal(failed, true, 'Expected CLI to exit with code 1')
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})
