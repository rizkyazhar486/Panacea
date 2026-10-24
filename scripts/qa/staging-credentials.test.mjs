// ENG-E7-04: kontrak kredensial staging gagal tertutup, dan workflow staging tidak bisa dilonggarkan diam-diam.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PRODUCTION_HOSTS, STAGING_CONTRACT, checkStagingEnv } from './staging-credentials.mjs'

const SCRIPT = new URL('./staging-credentials.mjs', import.meta.url).pathname
const workflow = readFileSync(new URL('../../.github/workflows/staging-gate.yml', import.meta.url), 'utf8')
const template = readFileSync(new URL('../../docs/governance/staging.env.example', import.meta.url), 'utf8')

const good = { STAGING_URL: 'https://staging.example.test', STAGING_API_URL: 'https://api-staging.example.test', STAGING_DEPLOY_TOKEN: 'tok-unit-test' }
const runCli = (env) => spawnSync(process.execPath, [SCRIPT], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' })

test('menerima_kontrak_lengkap', () => {
  assert.deepEqual(checkStagingEnv(good), { ok: true, problems: [] })
})

test('menolak_tiap_variabel_yang_hilang_dengan_nama_dan_hanya_itu', () => {
  for (const { name } of STAGING_CONTRACT) {
    const { [name]: _drop, ...rest } = good
    assert.deepEqual(checkStagingEnv(rest), { ok: false, problems: [`${name}: absent`] }, `hanya ${name} yang hilang`)
  }
})

test('menolak_nilai_kosong_spasi_dan_tipe_salah_sama_dengan_hilang', () => {
  for (const bad of ['', '   ', undefined, null, 5, {}, []]) {
    assert.deepEqual(checkStagingEnv({ ...good, STAGING_DEPLOY_TOKEN: bad }), { ok: false, problems: ['STAGING_DEPLOY_TOKEN: absent'] })
  }
  assert.equal(checkStagingEnv(null).ok, false)
  assert.equal(checkStagingEnv(undefined).problems.length, STAGING_CONTRACT.length)
  assert.equal(checkStagingEnv('x').ok, false)
})

test('menolak_url_non_https_dan_url_rusak', () => {
  for (const bad of ['http://staging.example.test', 'ftp://x.test', 'staging.example.test', 'not a url']) {
    assert.deepEqual(checkStagingEnv({ ...good, STAGING_URL: bad }), { ok: false, problems: ['STAGING_URL: not an https URL'] }, bad)
  }
  assert.equal(checkStagingEnv({ ...good, STAGING_URL: '  https://staging.example.test  ' }).ok, true, 'spasi pinggir dipangkas (pasangan)')
})

test('menolak_staging_yang_menunjuk_ke_produksi_pasangan_hanya_host_berbeda', () => {
  for (const host of PRODUCTION_HOSTS) {
    assert.deepEqual(checkStagingEnv({ ...good, STAGING_API_URL: `https://${host}` }), { ok: false, problems: ['STAGING_API_URL: points at production'] }, host)
  }
  assert.deepEqual(checkStagingEnv({ ...good, STAGING_URL: 'https://PanaceaMed.ID/' }), { ok: false, problems: ['STAGING_URL: points at production'] }, 'huruf besar tidak mengelabui')
  assert.equal(checkStagingEnv({ ...good, STAGING_URL: 'https://staging.panaceamed.id' }).ok, true, 'subdomain staging yang sah tidak ditolak')
})

test('batas_kontrak_tiga_variabel_dan_template_menyebut_semuanya', () => {
  assert.deepEqual(STAGING_CONTRACT.map((c) => c.name), ['STAGING_URL', 'STAGING_API_URL', 'STAGING_DEPLOY_TOKEN'])
  for (const { name } of STAGING_CONTRACT) assert.ok(new RegExp(`^${name}=$`, 'm').test(template), `template memuat ${name}= tanpa nilai`)
})

test('cli_tanpa_secret_keluar_1_dengan_pesan_bernama', () => {
  const r = runCli({})
  assert.equal(r.status, 1)
  assert.match(r.stderr, /staging credentials absent or invalid: STAGING_URL: absent; STAGING_API_URL: absent; STAGING_DEPLOY_TOKEN: absent/)
  assert.match(r.stderr, /EXT-E7-B/)
  assert.equal(r.stdout, '', 'tidak ada pesan sukses')
})

test('cli_lengkap_keluar_0_dan_tidak_pernah_mencetak_nilai', () => {
  const r = runCli(good)
  assert.equal(r.status, 0)
  assert.match(r.stdout, /staging credentials present/)
  for (const v of Object.values(good)) assert.ok(!r.stdout.includes(v) && !r.stderr.includes(v), 'nilai tidak bocor ke keluaran')
  const bad = runCli({ ...good, STAGING_URL: 'http://leak-check.example.test' })
  assert.equal(bad.status, 1)
  assert.ok(!bad.stderr.includes('leak-check.example.test') && !bad.stderr.includes('tok-unit-test'), 'nilai tidak bocor pada galat')
})

test('workflow_gagal_tertutup_smoke_bergantung_pada_kredensial_dan_hanya_dispatch', () => {
  assert.match(workflow, /on:\s*\n\s*workflow_dispatch:\s*\n/, 'hanya workflow_dispatch')
  assert.ok(!/\n\s*(pull_request|push|schedule):/.test(workflow), 'tidak menjadi cek merah di tiap PR')
  assert.match(workflow, /run: node scripts\/qa\/staging-credentials\.mjs\s*\n/, 'pintu kredensial dijalankan polos')
  assert.ok(!/staging-credentials\.mjs[^\n]*(\|\||;\s*true)/.test(workflow), 'kegagalan pintu tidak ditelan')
  assert.ok(!/continue-on-error/.test(workflow), 'tidak ada continue-on-error')
  assert.match(workflow, /smoke:\s*\n\s*needs: credentials/, 'smoke bergantung pada pintu kredensial')
  assert.match(workflow, /STAGING_DEPLOY_TOKEN: \$\{\{ secrets\.STAGING_DEPLOY_TOKEN \}\}/, 'token dari secrets, bukan literal')
  assert.match(workflow, /PROD_URL: \$\{\{ vars\.STAGING_URL \}\}/, 'smoke memakai URL staging, bukan produksi')
  assert.ok(!/panaceamed\.id/.test(workflow), 'workflow staging tidak menyebut produksi')
})
