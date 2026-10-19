import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOFTWARE, validateSoftware, loadSoftware, renderNotices } from './body-renderer-software-notices.mjs'
const root = fileURLToPath(new URL('../../', import.meta.url))
const records = loadSoftware(root)

test('all three exact locked package/version/licence texts match primary-source hashes', () => {
  assert.equal(records.length, 3)
  for (const record of records) {
    assert.doesNotThrow(() => validateSoftware(record, { version: record.version, license: 'MIT' }, { version: record.version, license: 'MIT' }, record.text))
    assert.match(record.text, /Permission is hereby granted/)
    assert.match(record.source, /githubusercontent.com\/[^/]+\/[^/]+\/[0-9a-f]{40}\//)
  }
})
test('version upgrades, missing lock metadata and altered licences cannot silently reuse notices', () => {
  const record = records[0], valid = { version: record.version, license: 'MIT' }
  for (const other of [{ ...valid, version: '0.0.0' }, undefined]) {
    assert.throws(() => validateSoftware(record, other, valid, record.text), /version changed/)
    assert.throws(() => validateSoftware(record, valid, other, record.text), /version changed/)
  }
  assert.throws(() => validateSoftware(record, { ...valid, license: 'Proprietary' }, valid, record.text), /MIT package metadata changed/)
  assert.throws(() => validateSoftware(record, valid, { ...valid, license: 'Proprietary' }, record.text), /MIT package metadata changed/)
  assert.throws(() => validateSoftware(record, valid, valid, record.text.replace('Copyright', 'Omitted')), /primary-source SHA-256/)
})
test('published page contains every complete licence and distinguishes runtime, vendored and tooling roles', () => {
  const page = readFileSync(new URL('../../public/bodyexposure/software-notices.html', import.meta.url), 'utf8')
  assert.equal(page, renderNotices(records))
  assert.match(page, /separate locked development package is 1.1.1/)
  assert.match(page, /not claimed to be imported into the application runtime/)
  assert.match(page, /does not grant rights to anatomical datasets/)
  for (const record of SOFTWARE) assert.ok(page.includes(record.sha256))
})
test('static notice HTML escapes embedded text and URL attributes', () => {
  const page = renderNotices([{ ...records[0], name: '<img src=x>', role: '" onclick="alert(1)', source: 'https://example.test/" unsafe="1', text: '<script>&"</script>' }])
  assert.ok(!page.includes('<img src=x>'))
  assert.ok(!page.includes('<script>'))
  assert.ok(page.includes('&lt;script&gt;&amp;&quot;&lt;/script&gt;'))
  assert.ok(page.includes('https://example.test/&quot; unsafe=&quot;1'))
})
test('provenance and global asset credits pages link to the shipped notice page and notices link back', () => {
  const provenance = readFileSync(new URL('../../public/bodyexposure/provenance.html', import.meta.url), 'utf8')
  const assetCredits = readFileSync(new URL('../../public/asset-credits.html', import.meta.url), 'utf8')
  assert.match(provenance, /href="software-notices.html"/)
  assert.match(assetCredits, /href="\.\/bodyexposure\/software-notices\.html"/)
  assert.match(renderNotices(records), /href="provenance.html"/)
})


test('vendored decoder tampering fails closed before rendering a licence notice', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'panacea-renderer-notices-'))
  try {
    const packages = {}
    for (const record of records) {
      const target = path.join(dir, 'node_modules', record.name)
      mkdirSync(target, { recursive: true })
      const metadata = { version: record.version, license: 'MIT' }
      packages[`node_modules/${record.name}`] = metadata
      writeFileSync(path.join(target, 'package.json'), JSON.stringify(metadata))
      writeFileSync(path.join(target, record.file), record.text)
    }
    writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({ packages }))
    const decoder = 'node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'
    mkdirSync(path.dirname(path.join(dir, decoder)), { recursive: true })
    const original = readFileSync(path.join(root, decoder))
    writeFileSync(path.join(dir, decoder), original)
    assert.deepEqual(loadSoftware(dir), records)
    writeFileSync(path.join(dir, decoder), Buffer.concat([original, Buffer.from('\n// altered')]))
    assert.throws(() => loadSoftware(dir), /Vendored MeshoptDecoder changed/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
