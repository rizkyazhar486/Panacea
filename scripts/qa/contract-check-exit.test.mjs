import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const checker = new URL('../uji/check.mjs', import.meta.url).href
function run(body) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval',
    `import { chk } from ${JSON.stringify(checker)}; ${body}`,
  ], { encoding: 'utf8' })
  assert.equal(result.error, undefined)
  assert.equal(result.signal, null)
  assert.equal(result.stderr, '')
  return result
}

test('all passing contracts exit successfully and retain named diagnostics', () => {
  const result = run("chk('first', true); chk('second', true, 'detail')")
  assert.equal(result.status, 0)
  assert.equal(result.stdout, 'PASS first \nPASS second detail\n')
})

test('a failed contract exits nonzero even when subsequent contracts pass', () => {
  const result = run("chk('first', true); chk('broken', false, 'reason'); chk('last', true)")
  assert.equal(result.status, 1)
  assert.equal(result.stdout, 'PASS first \nFAIL broken reason\nPASS last \n')
})

test('multiple failures still report every contract and exit nonzero', () => {
  const result = run("chk('first', false); chk('second', false)")
  assert.equal(result.status, 1)
  assert.equal(result.stdout, 'FAIL first \nFAIL second \n')
})

test('truthy non-boolean results cannot certify a passing contract', () => {
  const result = run("chk('invalid', 'false')")
  assert.equal(result.status, 1)
  assert.equal(result.stdout, 'FAIL invalid \n')
})

test('a passing contract does not reset a previous failing exit status', () => {
  const result = run("process.exitCode = 7; chk('passing', true)")
  assert.equal(result.status, 7)
  assert.equal(result.stdout, 'PASS passing \n')
})

test('a failed contract preserves a previous nonzero exit status', () => {
  const result = run("process.exitCode = 7; chk('broken', false)")
  assert.equal(result.status, 7)
  assert.equal(result.stdout, 'FAIL broken \n')
})

test('the real Assistive Touch contract rejects a missing accessible name', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'panacea-contract-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const files = [
    'scripts/uji/assistive-touch-component-contract.mts',
    'scripts/uji/check.mjs',
    'src/components/layout/FabNavigasi.tsx',
    'src/components/PemilihAksiFab.tsx',
  ]
  for (const path of files) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), await readFile(new URL(`../../${path}`, import.meta.url)))
  }
  const execute = () => spawnSync(process.execPath, [
    '--experimental-transform-types', join(root, files[0]),
  ], { encoding: 'utf8' })
  const passing = execute()
  assert.equal(passing.error, undefined)
  assert.equal(passing.signal, null)
  assert.equal(passing.status, 0, passing.stdout + passing.stderr)
  assert.equal(passing.stdout.split('\n').filter(line => line.startsWith('PASS ')).length, 15)
  assert.doesNotMatch(passing.stdout, /^FAIL /m)

  const component = join(root, files[2])
  const source = await readFile(component, 'utf8')
  const broken = source.replace('aria-label="Panacea Assistive Touch"', 'aria-label=""')
  assert.notEqual(broken, source, 'mutation must remove the accessible name')
  await writeFile(component, broken)
  const failing = execute()
  assert.equal(failing.error, undefined)
  assert.equal(failing.signal, null)
  assert.equal(failing.status, 1, failing.stdout + failing.stderr)
  assert.match(failing.stdout, /^FAIL Assistive Touch has a stable accessible name /m)
  assert.equal(failing.stdout.split('\n').filter(line => line.startsWith('PASS ')).length, 14)
})
