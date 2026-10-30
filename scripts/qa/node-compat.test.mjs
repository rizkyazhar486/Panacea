import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'

test('Node compatibility runner executes successfully', () => {
  const res = spawnSync(process.execPath, ['scripts/qa/node-compat-runner.mjs', '-e', 'console.log("OK")'], { encoding: 'utf8' })
  assert.equal(res.status, 0)
  assert.match(res.stdout, /OK/)
})
