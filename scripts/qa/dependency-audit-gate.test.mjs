import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { evaluateAudit, validatePolicy } from './dependency-audit-gate.mjs'

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/dependency-audit/${name}.json`, import.meta.url), 'utf8'))
const fixturePath = (name) => new URL(`./fixtures/dependency-audit/${name}.json`, import.meta.url).pathname
const NOW = new Date('2026-10-02T12:00:00.000Z')
const EMPTY_POLICY = { schema_version: 1, fail_on: ['high', 'critical'], accepted: [] }

// Advisory high pada audit server SEBELUM #2210 (data nyata `npm audit`, bukan rekaan).
const SERVER_HIGH = {
  axios: [
    'GHSA-c29m-xwm3-cm6r', 'GHSA-mghh-pgcx-3jjj', 'GHSA-x97p-jq2g-jp4f', 'GHSA-3pq3-5fj3-cg6v',
    'GHSA-542g-h47m-68v8', 'GHSA-m8m8-qj5v-23w3', 'GHSA-r4gj-5m52-g5wh',
  ],
  'ip-address': ['GHSA-mwp4-54f8-5fhr'],
}
const ALL_SERVER_HIGH = Object.values(SERVER_HIGH).flat()

const accept = (id, workspace = 'server', expires = '2026-12-31') => ({
  workspace, id, expires,
  reason: 'Transitive dependency; fix needs a semver-major bump tracked in the risk register.',
  risk: 'risk.dependency_supply_chain',
})
const policyAccepting = (ids, workspace, expires) => ({ ...EMPTY_POLICY, accepted: ids.map((id) => accept(id, workspace, expires)) })
const run = (audit, policy = EMPTY_POLICY, workspace = 'server', now = NOW) => evaluateAudit({ audit, workspace, policy, now })

test('hitungan_high_critical_wajib_bilangan_bulat_nonnegatif_aman', () => {
  const clean = { vulnerabilities: {}, metadata: { vulnerabilities: { high: 0, critical: 0 } } }
  assert.equal(run(clean).kind, 'pass')
  for (const field of ['high', 'critical']) {
    for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '0', null]) {
      const audit = structuredClone(clean)
      audit.metadata.vulnerabilities[field] = value
      const result = run(audit)
      assert.equal(result.ok, false, `${field}=${String(value)}`)
      assert.equal(result.kind, 'unusable')
      assert.match(result.errors[0], /non-negative safe integers/)
    }
  }
})

test('struktur_laporan_rusak_tidak_boleh_dilewati_sebagai_audit_bersih', () => {
  const clean = { vulnerabilities: {}, metadata: { vulnerabilities: { high: 0, critical: 0 } } }
  const inputs = [
    { ...clean, vulnerabilities: [] },
    { ...clean, metadata: { vulnerabilities: [] } },
    ...[null, [], 'bad', {}, { via: null }, { via: 'axios' }, { via: {} },
      { via: [null] }, { via: [42] }, { via: [[]] }, { via: [''] },
      { via: [{ severity: 'toString' }] }, { via: [{ severity: 'constructor' }] },
    ].map((entry) => ({ ...clean, vulnerabilities: { axios: entry } })),
  ]
  for (const audit of inputs) {
    const snapshot = JSON.stringify(audit)
    const result = run(audit)
    assert.equal(result.ok, false, snapshot)
    assert.equal(result.kind, 'unusable', snapshot)
    assert.equal(result.errors.length, 1)
    assert.deepEqual(result.accepted, [])
    assert.equal(JSON.stringify(audit), snapshot, 'input remains unchanged')
  }
  // npm uses strings for transitive dependencies; preserve that valid shape.
  assert.equal(run({ ...clean, vulnerabilities: { wrapper: { via: ['axios'] } } }).kind, 'pass')
  assert.equal(run({ ...clean, vulnerabilities: { wrapper: { via: [] } } }).kind, 'pass')
})

test('menolak_audit_server_sebelum_perbaikan_dan_menyebut_setiap_advisory_high', () => {
  const result = run(fixture('server-before-2210'))
  assert.equal(result.ok, false)
  assert.equal(result.kind, 'vulnerable')
  assert.deepEqual(result.failures.map((f) => f.id).sort(), [...ALL_SERVER_HIGH].sort())
  assert.deepEqual([...new Set(result.failures.map((f) => f.pkg))].sort(), ['axios', 'ip-address'])
  assert.ok(result.failures.every((f) => f.severity === 'high' && f.reason === 'no acceptance in policy'))
  // Advisory moderate pada paket yang sama tidak boleh ikut menggagalkan; hanya dilaporkan sebagai peringatan.
  assert.ok(result.warnings.some((w) => w.id === 'GHSA-vh66-26gq-q6x8' && w.severity === 'moderate'))
  assert.ok(!result.failures.some((f) => f.id === 'GHSA-vh66-26gq-q6x8'))
})

test('menerima_audit_server_setelah_perbaikan_dan_tetap_melaporkan_sisa_moderate', () => {
  const result = run(fixture('server-after-2210'))
  assert.equal(result.ok, true)
  assert.equal(result.kind, 'pass')
  assert.deepEqual(result.failures, [])
  assert.deepEqual(result.warnings.map((w) => w.id), ['GHSA-w5hq-g745-h8pq'])
})

test('audit_web_hanya_moderate_lolos_dan_perbaikan_menghapus_advisory_react_router_dom', () => {
  const before = run(fixture('web-before-2211'), EMPTY_POLICY, 'web')
  const after = run(fixture('web-after-2211'), EMPTY_POLICY, 'web')
  assert.equal(before.ok, true)
  assert.equal(after.ok, true)
  assert.ok(before.warnings.some((w) => w.pkg === 'react-router-dom' && w.id === 'GHSA-jjmj-jmhj-qwj2'))
  assert.ok(!after.warnings.some((w) => w.pkg === 'react-router-dom'))
  assert.deepEqual(after.warnings.map((w) => w.id).sort(), ['GHSA-337j-9hxr-rhxg', 'GHSA-wrjc-x8rr-h8h6'])
})

test('penerimaan_valid_menutup_semua_advisory_high_dan_tercatat', () => {
  const result = run(fixture('server-before-2210'), policyAccepting(ALL_SERVER_HIGH))
  assert.equal(result.ok, true)
  assert.equal(result.accepted.length, ALL_SERVER_HIGH.length)
  assert.ok(result.accepted.every((a) => a.risk === 'risk.dependency_supply_chain' && a.expires === '2026-12-31'))
})

test('penerimaan_untuk_workspace_lain_tidak_berlaku', () => {
  // Pasangan: kasus ini hanya berbeda dari kasus di atas pada workspace.
  const result = run(fixture('server-before-2210'), policyAccepting(ALL_SERVER_HIGH, 'web'))
  assert.equal(result.ok, false)
  assert.equal(result.failures.length, ALL_SERVER_HIGH.length)
})

test('penerimaan_sebagian_tetap_menggagalkan_sisanya', () => {
  const result = run(fixture('server-before-2210'), policyAccepting(SERVER_HIGH.axios))
  assert.equal(result.ok, false)
  assert.deepEqual(result.failures.map((f) => f.id), ['GHSA-mwp4-54f8-5fhr'])
  assert.equal(result.accepted.length, SERVER_HIGH.axios.length)
})

test('penerimaan_berlaku_tepat_pada_hari_kedaluwarsa_dan_gugur_sehari_setelahnya', () => {
  const audit = fixture('server-before-2210')
  const onLastDay = run(audit, policyAccepting(ALL_SERVER_HIGH, 'server', '2026-10-02'))
  assert.equal(onLastDay.ok, true, 'hari terakhir masih berlaku')
  const dayAfter = run(audit, policyAccepting(ALL_SERVER_HIGH, 'server', '2026-10-01'))
  assert.equal(dayAfter.ok, false)
  assert.equal(dayAfter.kind, 'vulnerable')
  assert.ok(dayAfter.failures.every((f) => f.reason === 'acceptance expired on 2026-10-01'))
})

test('input_audit_rusak_gagal_tertutup_bukan_lolos', () => {
  const unusableInputs = {
    objek_kosong: {},
    null: null,
    string: 'not json',
    array: [],
    galat_npm: { message: 'request to registry failed', error: { code: 'ENOTFOUND' } },
    tanpa_metadata: { auditReportVersion: 2, vulnerabilities: {} },
    tanpa_vulnerabilities: { metadata: { vulnerabilities: { high: 0, critical: 0 } } },
    hitungan_bukan_angka: { vulnerabilities: {}, metadata: { vulnerabilities: { high: '0', critical: 0 } } },
  }
  for (const [name, audit] of Object.entries(unusableInputs)) {
    const result = run(audit)
    assert.equal(result.ok, false, `${name} tidak boleh lolos`)
    assert.equal(result.kind, 'unusable', `${name} harus unusable`)
    assert.equal(result.failures.length, 0)
    assert.equal(result.errors.length, 1)
  }
})

test('kunci_error_pada_laporan_yang_tampak_lengkap_tetap_gagal_tertutup', () => {
  // Bagian vulnerabilities/metadata lengkap, sehingga hanya kunci `error` yang membedakan dari kasus lolos.
  const report = { vulnerabilities: {}, metadata: { vulnerabilities: { high: 0, critical: 0 } } }
  assert.equal(run(report).ok, true)
  const withError = run({ ...report, error: { code: 'EAUDIT', summary: 'registry returned 500' } })
  assert.equal(withError.ok, false)
  assert.equal(withError.kind, 'unusable')
  assert.match(withError.errors[0], /returned an error/)
})

test('ringkasan_melaporkan_high_tetapi_tak_ada_advisory_yang_bisa_ditelusuri_gagal_tertutup', () => {
  const clean = { vulnerabilities: {}, metadata: { vulnerabilities: { high: 0, critical: 0 } } }
  assert.equal(run(clean).ok, true)
  // Pasangan: hanya jumlah high di ringkasan yang berbeda.
  const drifted = { vulnerabilities: {}, metadata: { vulnerabilities: { high: 1, critical: 0 } } }
  const result = run(drifted)
  assert.equal(result.ok, false)
  assert.equal(result.kind, 'unusable')
  assert.match(result.errors[0], /no advisory could be attributed/)
})

test('severity_tak_dikenal_gagal_tertutup', () => {
  const audit = {
    vulnerabilities: { foo: { via: [{ name: 'foo', severity: 'catastrophic', url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc' }] } },
    metadata: { vulnerabilities: { high: 0, critical: 0 } },
  }
  const result = run(audit)
  assert.equal(result.ok, false)
  assert.equal(result.kind, 'unusable')
})

test('waktu_evaluasi_tidak_valid_gagal_tertutup', () => {
  // Panggil evaluateAudit langsung: parameter default pada `run` akan mengganti `undefined` dengan waktu valid.
  for (const now of [undefined, null, 'now', 12345, new Date('not a date')]) {
    const result = evaluateAudit({ audit: fixture('server-after-2210'), workspace: 'server', policy: EMPTY_POLICY, now })
    assert.equal(result.ok, false, `now=${String(now)} tidak boleh lolos`)
    assert.equal(result.kind, 'unusable')
  }
  // Pasangan: input yang sama dengan waktu valid lolos.
  assert.equal(evaluateAudit({ audit: fixture('server-after-2210'), workspace: 'server', policy: EMPTY_POLICY, now: NOW }).ok, true)
})

test('kebijakan_cacat_ditolak_dengan_alasan_dan_tidak_pernah_melonggarkan_gerbang', () => {
  const defects = {
    schema_salah: [{ ...EMPTY_POLICY, schema_version: 2 }, /schema_version/],
    fail_on_tanpa_high: [{ ...EMPTY_POLICY, fail_on: ['critical'] }, /must include "high"/],
    fail_on_tanpa_critical: [{ ...EMPTY_POLICY, fail_on: ['high'] }, /must include "critical"/],
    fail_on_tak_dikenal: [{ ...EMPTY_POLICY, fail_on: ['high', 'critical', 'severe'] }, /known severities/],
    accepted_bukan_list: [{ ...EMPTY_POLICY, accepted: {} }, /accepted must be a list/],
    id_bukan_ghsa: [{ ...EMPTY_POLICY, accepted: [{ ...accept('GHSA-aaaa-bbbb-cccc'), id: 'CVE-2026-0001' }] }, /GHSA id/],
    alasan_terlalu_pendek: [{ ...EMPTY_POLICY, accepted: [{ ...accept('GHSA-aaaa-bbbb-cccc'), reason: 'ok' }] }, /reason/],
    risk_bukan_id_register: [{ ...EMPTY_POLICY, accepted: [{ ...accept('GHSA-aaaa-bbbb-cccc'), risk: 'later' }] }, /risk register id/],
    tanggal_format_salah: [{ ...EMPTY_POLICY, accepted: [{ ...accept('GHSA-aaaa-bbbb-cccc'), expires: '2026-10-2' }] }, /real YYYY-MM-DD date/],
    tanggal_tidak_nyata: [{ ...EMPTY_POLICY, accepted: [{ ...accept('GHSA-aaaa-bbbb-cccc'), expires: '2026-02-31' }] }, /real YYYY-MM-DD date/],
    tanpa_kedaluwarsa: [{ ...EMPTY_POLICY, accepted: [{ ...accept('GHSA-aaaa-bbbb-cccc'), expires: undefined }] }, /real YYYY-MM-DD date/],
    tanpa_workspace: [{ ...EMPTY_POLICY, accepted: [{ ...accept('GHSA-aaaa-bbbb-cccc'), workspace: '' }] }, /workspace is required/],
  }
  for (const [name, [policy, expected]] of Object.entries(defects)) {
    const checked = validatePolicy(policy)
    assert.equal(checked.ok, false, `${name} harus ditolak`)
    assert.ok(checked.errors.some((e) => expected.test(e)), `${name}: ${checked.errors.join(' | ')}`)
    const result = run(fixture('server-after-2210'), policy)
    assert.equal(result.ok, false, `${name}: kebijakan cacat tidak boleh meloloskan audit bersih`)
    assert.equal(result.kind, 'policy')
  }
  assert.equal(validatePolicy(null).ok, false)
  assert.equal(validatePolicy([]).ok, false)
  // Kontrol positif: entri yang lengkap diterima.
  assert.deepEqual(validatePolicy(policyAccepting(['GHSA-aaaa-bbbb-cccc'])), { ok: true, errors: [] })
})

test('berkas_kebijakan_repo_valid_dan_tanpa_penerimaan_ganda', () => {
  const policy = JSON.parse(readFileSync(new URL('../../governance/dependency-audit-policy.json', import.meta.url), 'utf8'))
  assert.deepEqual(validatePolicy(policy), { ok: true, errors: [] })
  const keys = policy.accepted.map((e) => `${e.workspace}|${e.id}`)
  assert.equal(new Set(keys).size, keys.length, 'penerimaan ganda untuk advisory yang sama')
})

test('evaluasi_deterministik_dan_tidak_mengubah_masukan', () => {
  const audit = fixture('server-before-2210')
  const snapshot = JSON.stringify(audit)
  const policy = policyAccepting(SERVER_HIGH.axios)
  assert.deepEqual(run(audit, policy), run(audit, policy))
  assert.equal(JSON.stringify(audit), snapshot)
})

test('penerimaan_usang_dilaporkan_tanpa_menggagalkan', () => {
  const result = run(fixture('server-after-2210'), policyAccepting(['GHSA-mwp4-54f8-5fhr']))
  assert.equal(result.ok, true)
  assert.deepEqual(result.stale, ['GHSA-mwp4-54f8-5fhr'])
})

const gate = new URL('./dependency-audit-gate.mjs', import.meta.url).pathname
const policyFile = new URL('../../governance/dependency-audit-policy.json', import.meta.url).pathname
const cli = (...args) => spawnSync(process.execPath, [gate, ...args], { encoding: 'utf8' })

test('cli_exit_0_pada_audit_server_setelah_perbaikan', () => {
  const r = cli('--workspace', 'server', '--file', fixturePath('server-after-2210'), '--policy', policyFile, '--now', '2026-10-02')
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /OK: no unaccepted high\/critical advisories/)
})

test('cli_exit_1_dan_menyebut_paket_pada_audit_server_sebelum_perbaikan', () => {
  const r = cli('--workspace', 'server', '--file', fixturePath('server-before-2210'), '--policy', policyFile, '--now', '2026-10-02')
  assert.equal(r.status, 1)
  assert.match(r.stderr, /FAIL high axios GHSA-c29m-xwm3-cm6r/)
  assert.match(r.stderr, /FAIL high ip-address GHSA-mwp4-54f8-5fhr/)
  assert.doesNotMatch(r.stdout, /OK:/)
})

test('cli_exit_2_tanpa_pesan_OK_untuk_laporan_parseable_tetapi_rusak', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dep-audit-shape-'))
  const file = join(dir, 'audit.json')
  for (const vulnerabilities of [[], { axios: {} }, { axios: { via: [null] } }]) {
    writeFileSync(file, JSON.stringify({ vulnerabilities, metadata: { vulnerabilities: { high: 0, critical: 0 } } }))
    const result = cli('--workspace', 'server', '--file', file, '--policy', policyFile, '--now', '2026-10-02')
    assert.equal(result.status, 2, result.stderr)
    assert.match(result.stderr, /UNUSABLE:/)
    assert.doesNotMatch(result.stdout, /OK:/)
  }
})

test('cli_exit_2_pada_berkas_audit_hilang_rusak_atau_argumen_kurang', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dep-audit-'))
  const garbage = join(dir, 'garbage.json')
  const empty = join(dir, 'empty.json')
  writeFileSync(garbage, '<html>502 Bad Gateway</html>')
  writeFileSync(empty, '')
  for (const file of [garbage, empty, join(dir, 'tidak-ada.json')]) {
    const r = cli('--workspace', 'server', '--file', file, '--policy', policyFile)
    assert.equal(r.status, 2, `${file}: ${r.stderr}`)
    assert.match(r.stderr, /missing or not JSON/)
  }
  assert.equal(cli('--workspace', 'server').status, 2)
  assert.equal(cli('--file', fixturePath('server-after-2210')).status, 2)
  const missingPolicy = cli('--workspace', 'server', '--file', fixturePath('server-after-2210'), '--policy', join(dir, 'tidak-ada.json'))
  assert.equal(missingPolicy.status, 2)
  assert.match(missingPolicy.stderr, /cannot read policy/)
})

test('workflow_menjalankan_gerbang_untuk_kedua_workspace_tanpa_menyamarkan_kegagalan', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/dependency-audit.yml', import.meta.url), 'utf8')
  const active = workflow.split('\n').filter((line) => !/^\s*#/.test(line)).join('\n')
  assert.match(active, /^permissions:\s*\n\s+contents:\s*read\b/m)
  assert.match(active, /schedule:\s*\n\s+- cron:/, 'audit terjadwal agar advisory baru terdeteksi tanpa perubahan kode')
  assert.match(active, /dependency-audit-gate\.mjs --workspace web\b/)
  assert.match(active, /dependency-audit-gate\.mjs --workspace server\b/)
  assert.doesNotMatch(active, /continue-on-error/)
  // `npm audit` keluar non-nol saat ada temuan, jadi boleh ditoleransi; gerbangnya sendiri tidak.
  for (const line of active.split('\n').filter((l) => l.includes('dependency-audit-gate.mjs'))) {
    assert.doesNotMatch(line, /\|\|\s*(true|:)/, `gerbang tidak boleh ditoleransi: ${line.trim()}`)
  }
  for (const path of ['package-lock.json', 'server/package-lock.json', 'governance/dependency-audit-policy.json']) {
    assert.ok(active.includes(`'${path}'`), `perubahan pada ${path} harus memicu audit`)
  }
})
