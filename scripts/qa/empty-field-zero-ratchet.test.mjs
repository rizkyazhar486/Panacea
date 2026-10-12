import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

const script = fileURLToPath(new URL('../uji/angka-kosong-ratchet.mts', import.meta.url))
const fallback = 'Number(input) || 0;\n'
const established = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`src/view-${i}.tsx`, fallback.repeat(5)]))
const establishedBaseline = { total: 25, berkas: Object.fromEntries(Object.keys(established).map(path => [path, 5])) }

// Execute the actual repository gate against real, isolated filesystem trees.
// A bad source pattern must still fail; a genuinely fixed tree must reach zero.
function run(files, baseline, { missingSource = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'panacea-zero-ratchet-'))
  try {
    if (!missingSource) mkdirSync(join(root, 'src'))
    mkdirSync(join(root, 'governance'))
    writeFileSync(join(root, 'governance/EMPTY_FIELD_ZERO_BASELINE.json'), JSON.stringify(baseline))
    for (const [path, content] of Object.entries(files)) {
      const target = join(root, path)
      mkdirSync(join(target, '..'), { recursive: true })
      writeFileSync(target, content)
    }
    const result = spawnSync(process.execPath, [script], {
      cwd: root, encoding: 'utf8', timeout: 10_000,
      env: { ...process.env, UPDATE_BASELINE: '0' },
    })
    assert.equal(result.error, undefined, 'gate process must execute rather than time out')
    return { status: result.status, output: result.stdout + result.stderr }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('a scanned TSX tree with no blank-to-zero patterns passes the zero baseline', () => {
  const result = run({ 'src/fixed.tsx': 'const amount = parseNumberField(input);\n' }, { total: 0, berkas: {} })
  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /0 kejadian/)
})

test('a small known remaining count is measured without an artificial lower floor', () => {
  const result = run({ 'src/remaining.tsx': fallback }, { total: 1, berkas: { 'src/remaining.tsx': 1 } })
  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /1 kejadian/)
})

test('existing positive scans remain valid', () => {
  const result = run(established, establishedBaseline)
  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /25 kejadian di 5 berkas/)
})

test('an empty source tree cannot manufacture a passing zero', () => {
  const result = run({}, { total: 0, berkas: {} })
  assert.notEqual(result.status, 0)
  assert.match(result.output, /pemindaian.*rusak|tidak.*tsx|TSX/i)
})

test('a missing source tree fails rather than claiming zero', () => {
  const result = run({}, { total: 0, berkas: {} }, { missingSource: true })
  assert.notEqual(result.status, 0)
  assert.match(result.output, /ENOENT/)
})

test('a newly introduced blank-to-zero file is still rejected', () => {
  const result = run({ ...established, 'src/new.tsx': fallback }, establishedBaseline)
  assert.notEqual(result.status, 0)
  assert.match(result.output, /halaman baru membaca kolom kosong sebagai 0/)
})

test('increasing a known file count is still rejected', () => {
  const result = run({ ...established, 'src/view-0.tsx': fallback.repeat(6) }, establishedBaseline)
  assert.notEqual(result.status, 0)
  assert.match(result.output, /jumlah.*kolom naik/)
})

test('a real repair must update the baseline before the gate passes', () => {
  const result = run({ ...established, 'src/view-0.tsx': fallback.repeat(4) }, establishedBaseline)
  assert.notEqual(result.status, 0)
  assert.match(result.output, /halaman diperbaiki, turunkan baseline/)
})

test('inconsistent baseline totals remain rejected', () => {
  const result = run(established, { ...establishedBaseline, total: 26 })
  assert.notEqual(result.status, 0)
  assert.match(result.output, /total di baseline tidak sama/)
})
