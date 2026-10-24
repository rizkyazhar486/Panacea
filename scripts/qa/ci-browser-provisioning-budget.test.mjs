import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const workflow = readFileSync(new URL('../../.github/workflows/organ-3d-acceptance.yml', import.meta.url), 'utf8')
const guard = readFileSync(new URL('../uji/body3d-ci-bounded-smoke.mts', import.meta.url), 'utf8')

// Injeksi hanya pembacaan berkas: fixture diuji oleh guard CI yang sebenarnya.
function runGuard(fixture) {
  const injected = guard.replace(/const workflow = readFileSync\([\s\S]*?\n\)/, () => `const workflow = ${JSON.stringify(fixture)}`)
  assert.notEqual(injected, guard, 'fixture must replace the workflow read')
  return spawnSync(process.execPath, ['--input-type=module'], { input: injected, encoding: 'utf8' })
}

test('menerima_anggaran_provisioning_dan_semua_gerbang_asli', () => {
  const result = runGuard(workflow)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /13 proofs are sharded/)
})

for (const [name, before, after, reason] of [
  ['menolak_regresi_anggaran_15_menit', 'timeout-minutes: 22', 'timeout-minutes: 15', 'bounded 22 minute budget'],
  ['menolak_provisioning_tanpa_batas', 'timeout-minutes: 22', '', 'bounded 22 minute budget'],
  ['menolak_job_yang_memotong_anggaran_setup_dan_proof', 'timeout-minutes: 70', 'timeout-minutes: 60', 'retain enough bounded headroom'],
  ['menolak_timeout_anak_apt', '"$PW_PREFIX/node_modules/.bin/playwright" install --with-deps chromium', 'timeout 900 "$PW_PREFIX/node_modules/.bin/playwright" install --with-deps chromium', 'do not wrap apt/Playwright'],
  ['menolak_instalasi_apt_ganda', '"$PW_PREFIX/node_modules/.bin/playwright" install --with-deps chromium', '"$PW_PREFIX/node_modules/.bin/playwright" install --with-deps chromium\n          "$PW_PREFIX/node_modules/.bin/playwright" install --with-deps chromium', 'invoke apt/Playwright exactly once'],
]) {
  test(name, () => {
    const fixture = workflow.replace(before, after)
    assert.notEqual(fixture, workflow, 'negative control must change the workflow')
    const result = runGuard(fixture)
    assert.equal(result.status, 1)
    assert.ok(result.stderr.includes(reason), result.stderr)
  })
}

// Jalankan skrip aggregator, bukan hanya mencocokkan teks YAML-nya.
const aggregator = workflow.slice(workflow.lastIndexOf('        run: |\n') + '        run: |\n'.length)
for (const status of ['success', 'failure', 'cancelled', 'skipped', '']) {
  test(`aggregator_${status}`, () => {
    const result = spawnSync('bash', ['-e', '-c', aggregator], {
      encoding: 'utf8',
      env: { ...process.env, HASIL_SHARD: status },
    })
    assert.equal(result.status, status === 'success' ? 0 : 1, result.stderr)
    assert.equal(result.stdout.includes('::error::'), status !== 'success')
  })
}
