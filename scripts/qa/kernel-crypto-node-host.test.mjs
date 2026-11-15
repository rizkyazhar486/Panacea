// Pure SHA-256 / HMAC in the shared kernel and the single Node host probe. Engines in src/ use them instead of
// node:crypto / node:fs, so the frontend program type-checks without Node types and a browser fails closed.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { sha256Bytes, sha256Hex, hmacSha256Hex } from '../../src/shared/kernel/sha256.ts'
import { nodeHost } from '../../src/shared/kernel/nodeHost.ts'
import { createHardenedSessionEnvelope } from '../../src/domains/governance/securitySessionAndBolaGuardEngine.ts'
import { verifyAndAdmitHraFemaleV15FromRepoArtifacts } from '../../src/domains/body-exposure/engine/data/openGapResolutionAndAiTakeoverEngine.ts'
import { reproduceFrontierSlice } from '../../src/domains/governance/frontierDiscoveryGateEngine.ts'

const bytes = (n, b) => new Uint8Array(n).fill(b)
const nodeHmac = (key, msg) => createHmac('sha256', key).update(msg).digest('hex')

test('sha256_vektor_nist_dan_setara_node', () => {
  assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  for (const text of ['Tensi 146 mmHg — ≥ 38°C', '日本語 🫀', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64)]) {
    assert.equal(sha256Hex(text), createHash('sha256').update(text).digest('hex'), JSON.stringify(text.slice(0, 12)))
  }
  const digest = sha256Bytes(new TextEncoder().encode('abc'))
  assert.equal(digest.length, 32)
  assert.equal(Buffer.from(digest).toString('hex'), sha256Hex('abc'))
})

test('hmac_vektor_rfc4231', () => {
  assert.equal(hmacSha256Hex(bytes(20, 0x0b), 'Hi There'), 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7')
  assert.equal(hmacSha256Hex('Jefe', 'what do ya want for nothing?'), '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843')
  // Case 6: a key longer than the block is hashed first.
  assert.equal(hmacSha256Hex(bytes(131, 0xaa), 'Test Using Larger Than Block-Size Key - Hash Key First'), '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54')
})

test('hmac_batas_kunci_63_64_65_byte_setara_node', () => {
  for (const n of [0, 63, 64, 65]) {
    const key = 'k'.repeat(n)
    assert.equal(hmacSha256Hex(key, 'sess_1::dr-a — ≥'), nodeHmac(key, 'sess_1::dr-a — ≥'), `key of ${n} bytes`)
  }
})

test('hmac_menolak_kunci_atau_pesan_bukan_teks_atau_byte', () => {
  assert.throws(() => hmacSha256Hex(123, 'x'), { name: 'TypeError', message: /key must be/ })
  assert.throws(() => hmacSha256Hex('k', null), { name: 'TypeError', message: /message must be/ })
  assert.equal(hmacSha256Hex('k', 'x'), nodeHmac('k', 'x')) // the twin that differs only in the types
})

test('nodeHost_di_node_memberi_fs_path_cwd', () => {
  const host = nodeHost()
  assert.ok(host)
  assert.equal(host.cwd(), process.cwd())
  assert.equal(host.fs.existsSync(host.path.join(host.cwd(), 'package.json')), true)
})

test('nodeHost_di_luar_node_null', () => {
  const fakeFs = { existsSync: () => true, readFileSync: () => '', writeFileSync: () => {}, mkdirSync: () => {} }
  const fakePath = { join: (...p) => p.join('/'), dirname: (p) => p }
  const builtin = (id) => (id === 'node:fs' ? fakeFs : id === 'node:path' ? fakePath : undefined)
  assert.equal(nodeHost({}), null)
  assert.equal(nodeHost(null), null)
  assert.equal(nodeHost({ process: {} }), null)
  assert.equal(nodeHost({ process: { cwd: () => '/x' } }), null, 'no getBuiltinModule')
  assert.equal(nodeHost({ process: { getBuiltinModule: () => undefined, cwd: () => '/x' } }), null, 'no fs')
  assert.equal(nodeHost({ process: { getBuiltinModule: builtin } }), null, 'no cwd')
  const host = nodeHost({ process: { getBuiltinModule: builtin, cwd: () => '/x', env: { A: '1' } } })
  assert.equal(host?.cwd(), '/x')
  assert.equal(host?.env.A, '1')
})

function withoutNode(fn) {
  const original = process.getBuiltinModule
  process.getBuiltinModule = undefined
  try { return fn() } finally { process.getBuiltinModule = original }
}

test('tanpa_host_node_admisi_hra_tetap_tertahan_dan_riset_menolak', () => {
  assert.deepEqual(withoutNode(() => verifyAndAdmitHraFemaleV15FromRepoArtifacts()), { admitted: false, status: 'GATED_MISSING_ARTIFACTS' })
  assert.throws(() => withoutNode(() => reproduceFrontierSlice({ sliceId: 'HUFNER_OXYGEN_CONTENT_CAPACITY_SLICE_01', observedMetricValue: 19.99 })), /need the repository file system/)
  // Twin under Node: the same calls read the repository.
  assert.equal(verifyAndAdmitHraFemaleV15FromRepoArtifacts().admitted, true)
})

test('sesi_csrf_tanpa_kunci_ditolak_dan_tidak_ada_kunci_tertanam', () => {
  const saved = process.env.PANACEA_CSRF_SECRET
  delete process.env.PANACEA_CSRF_SECRET
  try {
    const params = { actorUserId: 'dr-a', actorRole: 'CLINICIAN', authorizedPatientIds: ['PT-1'] }
    assert.throws(() => createHardenedSessionEnvelope(params), /secret is required/)
    const withKey = createHardenedSessionEnvelope({ ...params, secretKey: 'uji-key' })
    assert.equal(withKey.csrfHmacToken, nodeHmac('uji-key', `${withKey.sessionId}::dr-a`))
    process.env.PANACEA_CSRF_SECRET = 'env-key'
    const fromEnv = createHardenedSessionEnvelope(params)
    assert.equal(fromEnv.csrfHmacToken, nodeHmac('env-key', `${fromEnv.sessionId}::dr-a`))
  } finally {
    if (saved === undefined) delete process.env.PANACEA_CSRF_SECRET
    else process.env.PANACEA_CSRF_SECRET = saved
  }
  const source = readFileSync('src/domains/governance/securitySessionAndBolaGuardEngine.ts', 'utf8')
  assert.doesNotMatch(source, /panacea-asvs5-csrf-hmac-key/)
})

test('engine_frontend_tanpa_modul_node', () => {
  const files = [
    'src/domains/body-exposure/engine/data/openGapResolutionAndAiTakeoverEngine.ts',
    'src/domains/clinical-operations/model/fhirR4SepsisCareBundle.ts',
    'src/domains/governance/frontierDiscoveryGateEngine.ts',
    'src/domains/governance/securitySessionAndBolaGuardEngine.ts',
    'src/domains/medstudyhub/engine/medSciHubSixDepthAndOsceEquipmentEngine.ts',
    'src/domains/one-os/historicalPrTriageAndWholeBodyWorkbenchEngine.ts',
    'src/domains/personal-health/engine/genesisHistoricalDeviceTranslationSlice.ts',
  ]
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    assert.doesNotMatch(source, /from\s+["']node:/, file)
    assert.doesNotMatch(source, /\bprocess\./, file)
  }
})
