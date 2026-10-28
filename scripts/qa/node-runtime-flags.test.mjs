import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { typeScriptRunnerArgs } from '../uji/node-runtime-flags.mjs'

test('supported Node 22/23/24/25 use the legacy transform flag', () => {
  for (const version of ['22.18.0', '23.11.0', '24.12.0', '25.2.0']) {
    assert.deepEqual(typeScriptRunnerArgs(version), ['--experimental-transform-types'])
  }
})

test('Node 26+ never receive the removed transform flag', () => {
  for (const version of ['26.0.0', '26.12.1', '27.0.0']) {
    assert.deepEqual(typeScriptRunnerArgs(version), [])
  }
})

test('malformed and unsupported Node versions fail instead of reporting false successes', () => {
  assert.throws(() => typeScriptRunnerArgs('oops'), TypeError)
  assert.throws(() => typeScriptRunnerArgs('22.17.0'), RangeError)
  assert.throws(() => typeScriptRunnerArgs('20.19.0'), RangeError)
})

test('actual current Node executable accepts the centrally selected flags', () => {
  const proc = spawnSync(process.execPath, [
    ...typeScriptRunnerArgs(process.versions.node),
    '--eval', 'process.stdout.write("RUNNER_ARGS_OK")',
  ], { encoding: 'utf8' })
  assert.equal(proc.error, undefined)
  assert.equal(proc.signal, null)
  assert.equal(proc.status, 0, proc.stderr)
  assert.equal(proc.stdout, 'RUNNER_ARGS_OK')
})
