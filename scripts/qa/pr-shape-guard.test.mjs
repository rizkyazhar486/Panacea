// Pengujian unit untuk penjaga ukuran PR dan komit (WP-2 Directive D-100).
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { evaluatePrShape } from './pr-shape-guard.mjs'

const basePolicy = {
  maxChangedLines: 1500,
  maxChangedFiles: 60,
  taskBoardIdPattern: '\\b(?:WP-\\d+|ENG-[A-Z0-9-]+|D-100)\\b',
  generatedPaths: [
    {
      pathPrefix: 'governance/RELAND_TRIAGE.json',
      generatorScript: 'scripts/qa/reland-triage.mjs'
    }
  ]
}

test('1. Under-limit diff passes with 0 violations', () => {
  const res = evaluatePrShape({
    numstatEntries: [
      { file: 'src/a.ts', added: 120, deleted: 30 },
      { file: 'src/b.ts', added: 80, deleted: 10 }
    ],
    commitMessages: ['feat(governance): add WP-2 pr-shape-guard'],
    prBody: 'Package: WP-2',
    policy: basePolicy
  })
  assert.equal(res.violations.length, 0)
  assert.equal(res.nonGeneratedLines, 240)
  assert.equal(res.nonGeneratedFiles, 2)
})

test('2. Over-limit non-generated lines fails by name (non-generated-lines)', () => {
  const res = evaluatePrShape({
    numstatEntries: [{ file: 'src/huge.ts', added: 1400, deleted: 200 }],
    commitMessages: ['feat: big change'],
    prBody: 'Package: WP-2',
    policy: basePolicy
  })
  assert.equal(res.violations.length, 1)
  assert.equal(res.violations[0].rule, 'non-generated-lines')
  assert.match(res.violations[0].message, /pr-shape-guard: non-generated-lines 1600\/1500/)
})

test('3. Over-limit file count fails by name (changed-files)', () => {
  const entries = Array.from({ length: 65 }, (_, i) => ({
    file: `src/mod_${i}.ts`,
    added: 5,
    deleted: 0
  }))
  const res = evaluatePrShape({
    numstatEntries: entries,
    commitMessages: ['feat: many files'],
    prBody: 'Package: WP-2',
    policy: basePolicy
  })
  assert.equal(res.violations.length, 1)
  assert.equal(res.violations[0].rule, 'changed-files')
  assert.match(res.violations[0].message, /pr-shape-guard: changed-files 65\/60/)
})

test('4. Generated path is excluded ONLY when its committed generator script exists on disk', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'pr-shape-gen-'))
  try {
    const entries = [{ file: 'governance/RELAND_TRIAGE.json', added: 2500, deleted: 0 }]

    // Tanpa berkas generator di disk -> tetap dihitung dan gagal
    const withoutGen = evaluatePrShape({
      numstatEntries: entries,
      commitMessages: ['chore: triage'],
      prBody: 'WP-3',
      policy: basePolicy,
      repoRoot: tmp
    })
    assert.equal(withoutGen.violations.length, 1)
    assert.equal(withoutGen.violations[0].rule, 'non-generated-lines')

    // Buat berkas generator di disk -> dikecualikan dan lulus
    mkdirSync(join(tmp, 'scripts/qa'), { recursive: true })
    writeFileSync(join(tmp, 'scripts/qa/reland-triage.mjs'), '// generator\n')
    const withGen = evaluatePrShape({
      numstatEntries: entries,
      commitMessages: ['chore: triage'],
      prBody: 'WP-3',
      policy: basePolicy,
      repoRoot: tmp
    })
    assert.equal(withGen.violations.length, 0)
    assert.equal(withGen.nonGeneratedLines, 0)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})

test('5. Directive-style commit message without a TASK_BOARD row id in PR body fails by name', () => {
  const res = evaluatePrShape({
    numstatEntries: [{ file: 'src/a.ts', added: 20, deleted: 5 }],
    commitMessages: ['feat(kernel): implement Directive 059 quantum matrix'],
    prBody: 'No task board identifier here',
    policy: basePolicy
  })
  assert.equal(res.violations.length, 1)
  assert.equal(res.violations[0].rule, 'untracked-directive-commits')
})

test('6. Directive-style commit message with a valid TASK_BOARD row id in PR body passes', () => {
  const res = evaluatePrShape({
    numstatEntries: [{ file: 'src/a.ts', added: 20, deleted: 5 }],
    commitMessages: ['fix(reland): port Directive 067-R GLB inspector'],
    prBody: 'Tracked under WP-4 and D-100',
    policy: basePolicy
  })
  assert.equal(res.violations.length, 0)
})
