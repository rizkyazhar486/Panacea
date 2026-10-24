import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { planRollback, main, isAncestorOfMain, SCOPE } from './rollback-plan.mjs'

const T = 'a'.repeat(40)
const OTHER = 'b'.repeat(40)
const URL1 = 'https://panacea-abc123-panaceamed.vercel.app'
const rec = (over = {}) => ({ status: 'DEPLOYED_SMOKE_VERIFIED', commit_sha: T, deployment_url: URL1, workflow_run: 'https://github.com/o/r/actions/runs/1', ...over })
const plan = (over = {}) => planRollback({ target: T, evidence: [rec()], onMain: true, ...over })

test('memetakan_sha_target_ke_deployment_dan_menyusun_perintah_tanpa_menjalankannya', () => {
  const p = plan()
  assert.equal(p.ok, true)
  assert.equal(p.deploymentUrl, URL1)
  assert.deepEqual(p.command, ['vercel', 'rollback', URL1, `--scope=${SCOPE}`])
  assert.equal(p.workflowRun, 'https://github.com/o/r/actions/runs/1')
})

test('menerima_duplikat_terverifikasi_dengan_url_sama', () => {
  assert.equal(plan({ evidence: [rec(), rec()] }).ok, true)
})

test('menolak_sha_target_cacat', () => {
  for (const target of ['', 'abc1234', 'A'.repeat(40), 'g'.repeat(40), `${T} `, null, undefined, 5]) {
    const p = plan({ target })
    assert.equal(p.ok, false, String(target))
    assert.equal(p.code, 'invalid-target-sha', String(target))
  }
})

test('menolak_sha_saat_ini_cacat_atau_sama_dengan_target', () => {
  assert.equal(plan({ current: 'short' }).code, 'invalid-current-sha')
  assert.equal(plan({ current: T }).code, 'target-is-current')
  assert.equal(plan({ current: OTHER }).ok, true, 'a different current SHA is the pairing control')
})

test('menolak_sha_di_luar_main_atau_yang_statusnya_tidak_diketahui', () => {
  assert.equal(plan({ onMain: false }).code, 'target-not-on-main')
  assert.equal(plan({ onMain: null }).code, 'target-not-on-main')
  assert.match(plan({ onMain: null }).detail, /could not be determined/)
  assert.equal(plan({ onMain: true }).ok, true)
})

test('menolak_tanpa_bukti_rilis_untuk_commit_itu', () => {
  assert.equal(plan({ evidence: [] }).code, 'no-release-evidence')
  assert.equal(plan({ evidence: [rec({ commit_sha: OTHER })] }).code, 'no-release-evidence')
  assert.equal(plan({ evidence: [null, 'x', 7] }).code, 'no-release-evidence')
})

test('menolak_bukti_yang_tidak_lolos_smoke', () => {
  for (const status of ['DEFERRED_QUOTA', 'BLOCKED_RELEASE_GATES', 'FAILED_OR_UNVERIFIED', undefined]) {
    const p = plan({ evidence: [rec({ status })] })
    assert.equal(p.code, 'evidence-not-verified', String(status))
  }
  assert.equal(plan({ evidence: [rec({ status: 'FAILED_OR_UNVERIFIED' }), rec()] }).ok, true, 'one verified record is enough')
})

test('menolak_deployment_ambigu_atau_url_tidak_sah', () => {
  const two = plan({ evidence: [rec(), rec({ deployment_url: 'https://panacea-zzz-panaceamed.vercel.app' })] })
  assert.equal(two.code, 'ambiguous-deployment')
  for (const deployment_url of [null, '', 'http://panacea-abc123-panaceamed.vercel.app', 'https://evil.example.com', 'https://x.vercel.app/path', 'panacea.vercel.app']) {
    assert.equal(plan({ evidence: [rec({ deployment_url })] }).code, 'deployment-url-invalid', String(deployment_url))
  }
})

// ── CLI de punta a punta con un repositorio git real ────────────────────────────────────────────────────────────────
function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } })
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`)
  return r.stdout.trim()
}
function fixture() {
  const repo = mkdtempSync(join(tmpdir(), 'rollback-'))
  git(repo, 'init', '-q', '-b', 'main')
  const commit = (name) => { writeFileSync(join(repo, name), name); git(repo, 'add', '.'); git(repo, 'commit', '-q', '-m', name); return git(repo, 'rev-parse', 'HEAD') }
  const onMainA = commit('a')
  const onMainB = commit('b')
  git(repo, 'checkout', '-q', '-b', 'side')
  const sideOnly = commit('c')
  git(repo, 'checkout', '-q', 'main')
  const evDir = join(repo, '.ev'); mkdirSync(evDir)
  const mk = (sha, url, status = 'DEPLOYED_SMOKE_VERIFIED') => rec({ commit_sha: sha, deployment_url: url, status })
  writeFileSync(join(evDir, 'a.json'), JSON.stringify(mk(onMainA, 'https://panacea-aaa-panaceamed.vercel.app')))
  writeFileSync(join(evDir, 'b.json'), JSON.stringify(mk(onMainB, 'https://panacea-bbb-panaceamed.vercel.app', 'DEFERRED_QUOTA')))
  writeFileSync(join(evDir, 'c.json'), JSON.stringify(mk(sideOnly, 'https://panacea-ccc-panaceamed.vercel.app')))
  return { repo, evDir, onMainA, onMainB, sideOnly }
}
const run = (f, args) => {
  const out = [], err = []
  const code = main(['--repo', f.repo, '--main-ref', 'main', '--evidence', f.evDir, ...args], { log: (s) => out.push(s), error: (s) => err.push(s) })
  return { code, out: out.join('\n'), err: err.join('\n') }
}

test('cli_dry_run_memetakan_sha_main_dan_menampilkan_perintah', () => {
  const f = fixture()
  const r = run(f, ['--target', f.onMainA])
  assert.equal(r.code, 0, r.err)
  assert.match(r.out, new RegExp(`target ${f.onMainA} is on main`))
  assert.match(r.out, /vercel rollback https:\/\/panacea-aaa-panaceamed\.vercel\.app --scope=panaceamed/)
  assert.match(r.out, /NOT EXECUTED/)
  assert.equal(r.err, '')
})

test('cli_dry_run_menolak_sha_di_luar_main_meski_bukti_terverifikasi', () => {
  const f = fixture()
  const r = run(f, ['--target', f.sideOnly])
  assert.equal(r.code, 1)
  assert.match(r.err, /REFUSED \[target-not-on-main\]/)
  assert.equal(r.out, '', 'nothing is printed as a plan when refused')
})

test('cli_dry_run_menolak_sha_tak_dikenal_git_dan_sha_main_tanpa_bukti_terverifikasi', () => {
  const f = fixture()
  assert.match(run(f, ['--target', 'f'.repeat(40)]).err, /REFUSED \[target-not-on-main\].*could not be determined/)
  assert.match(run(f, ['--target', f.onMainB]).err, /REFUSED \[evidence-not-verified\]/)
})

test('cli_menolak_argumen_dan_bukti_yang_tidak_terbaca', () => {
  const f = fixture()
  assert.match(run(f, ['--target', f.onMainA, '--bogus', 'x']).err, /REFUSED \[bad-arguments\]/)
  assert.match(run(f, ['--target']).err, /REFUSED \[bad-arguments\]/)
  const bad = join(f.repo, 'bad.json'); writeFileSync(bad, '{not json')
  const out = [], err = []
  const code = main(['--repo', f.repo, '--main-ref', 'main', '--evidence', bad, '--target', f.onMainA], { log: (s) => out.push(s), error: (s) => err.push(s) })
  assert.equal(code, 1)
  assert.match(err.join(''), /REFUSED \[evidence-unreadable\]/)
})

test('isAncestorOfMain_membedakan_ya_tidak_dan_tidak_diketahui', () => {
  const f = fixture()
  assert.equal(isAncestorOfMain(f.onMainA, 'main', f.repo), true)
  assert.equal(isAncestorOfMain(f.sideOnly, 'main', f.repo), false)
  assert.equal(isAncestorOfMain('e'.repeat(40), 'main', f.repo), null)
  assert.equal(isAncestorOfMain(f.onMainA, 'no-such-ref', f.repo), null)
})

test('skrip_tidak_punya_mode_eksekusi_dan_hanya_memanggil_git', () => {
  const src = readFileSync(new URL('./rollback-plan.mjs', import.meta.url), 'utf8')
  const spawns = [...src.matchAll(/spawnSync\(\s*'([^']+)'/g)].map((m) => m[1])
  assert.deepEqual(spawns, ['git'], 'the only process it starts is git')
  assert.doesNotMatch(src, /--execute|--apply|exec\(|execSync|shell:\s*true/)
})
