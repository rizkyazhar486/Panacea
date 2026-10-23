// Native Blender replay of the committed public-geometry engineering report.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collect } from './public-organ-geometry.mjs'

export function assertReplayMatches(expected, replay) {
  assert.equal(expected.ok, true, 'committed report must pass')
  assert.equal(replay.ok, true, 'native replay must pass')
  assert.deepEqual(replay, expected, 'native replay must match every committed result and source field')
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'panacea-organ-replay-'))
  try {
    const input = path.join(temp, 'geometry.json'), output = path.join(temp, 'report.json')
    await writeFile(input, JSON.stringify(await collect('public/bodyexposure/adult_male')))
    execFileSync(process.env.BLENDER_BIN || 'blender', ['-b', '--factory-startup', '--python-exit-code', '1',
      '-P', 'scripts/qa/public-organ-interpenetration.py', '--', input, output], { timeout: 120000, maxBuffer: 1024 * 1024 })
    const expected = JSON.parse(await readFile('bodyexposure/qa_reports/gross_public_organ_interpenetration.adult_male.json', 'utf8'))
    assertReplayMatches(expected, JSON.parse(await readFile(output, 'utf8')))
    console.log('Public organ replay matches committed sources, nine gross checks and seven pair results exactly.')
  } finally { await rm(temp, { recursive: true, force: true }) }
}
