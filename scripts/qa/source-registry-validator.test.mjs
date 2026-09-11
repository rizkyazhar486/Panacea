import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const cwd = process.cwd()
const validator = join(cwd, 'scripts', 'validate-source-registry.mjs')
const schemaSource = join(cwd, 'data', 'source-registry', 'source.schema.json')
const schema = await readFile(schemaSource, 'utf8')

const baseEntry = {
  id: 'fixture_source',
  name: 'Fixture Source',
  category: 'evidence',
  kind: ['dataset'],
  homepage: 'https://example.org/source',
  features: ['fixture'],
  usage: {
    runtime: false,
    buildTime: true,
    networkRequired: false,
    notes: 'Offline validator fixture only.',
  },
  license: {
    status: 'CHECK_REQUIRED',
    identifier: null,
    commercialUse: 'CONDITIONAL',
    attributionRequired: null,
    shareAlike: null,
    scope: 'Fixture only.',
    verificationUrl: null,
    verifiedAt: null,
    notes: 'Fixture only.',
  },
  validation: {
    level: 'REFERENCE',
    clinicalDecisionUse: 'NO',
    notes: 'Fixture only.',
  },
  provenance: {
    authority: 'Fixture authority',
    sourceIdentityRequired: true,
    versionPinRequired: true,
    notes: 'Fixture only.',
  },
  adapter: {
    status: 'PLANNED',
    normalizedTarget: 'FixtureRecord',
    module: null,
    notes: 'Fixture only.',
  },
}

const activeEntry = (module) => ({
  ...baseEntry,
  adapter: {
    ...baseEntry.adapter,
    status: 'ACTIVE',
    module,
  },
})

async function runFixture(fixtures) {
  const root = await mkdtemp(join(tmpdir(), 'panacea-source-registry-'))
  try {
    await writeFile(join(root, 'source.schema.json'), schema)
    for (const fixture of fixtures) {
      const directory = fixture.directory ?? String(fixture.entry.category)
      const targetDirectory = join(root, directory)
      await mkdir(targetDirectory, { recursive: true })
      await writeFile(join(targetDirectory, fixture.filename), `${JSON.stringify(fixture.entry, null, 2)}\n`)
    }

    return spawnSync(process.execPath, [validator], {
      cwd,
      env: { ...process.env, PANACEA_SOURCE_REGISTRY_ROOT: root },
      encoding: 'utf8',
    })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('accepts a schema-valid source with consistent semantics', async () => {
  const result = await runFixture([{ filename: 'valid.json', entry: baseEntry }])
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /1 entries, 1 unique ids/)
})

test('rejects duplicate source ids', async () => {
  const result = await runFixture([
    { filename: 'one.json', entry: baseEntry },
    { filename: 'two.json', entry: { ...baseEntry, name: 'Duplicate Fixture Source' } },
  ])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /duplicate source id/)
})

test('rejects category and directory mismatch', async () => {
  const result = await runFixture([
    { directory: 'drug', filename: 'wrong-category.json', entry: baseEntry },
  ])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /must match registry directory/)
})

test('requires web provenance links to use http or https', async () => {
  const cases = [
    {
      filename: 'unsafe-homepage.json',
      field: 'homepage',
      entry: { ...baseEntry, homepage: 'javascript:alert(1)' },
    },
    {
      filename: 'unsafe-repository.json',
      field: 'repository',
      entry: { ...baseEntry, repository: 'data:text/plain,not-a-repository' },
    },
    {
      filename: 'unsafe-license-url.json',
      field: 'license.verificationUrl',
      entry: {
        ...baseEntry,
        license: { ...baseEntry.license, verificationUrl: 'file:///tmp/license.txt' },
      },
    },
  ]

  for (const fixture of cases) {
    const result = await runFixture([{ filename: fixture.filename, entry: fixture.entry }])
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, new RegExp(`${fixture.field.replace('.', '\\.')} must use an http or https URL`))
  }
})

test('rejects ACTIVE adapter without a module', async () => {
  const result = await runFixture([
    {
      filename: 'active-without-module.json',
      entry: {
        ...baseEntry,
        adapter: { ...baseEntry.adapter, status: 'ACTIVE' },
      },
    },
  ])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /ACTIVE adapter must declare a non-null adapter\.module/)
})

test('accepts ACTIVE adapter whose repository-relative module is a real file', async () => {
  const result = await runFixture([
    {
      filename: 'active-existing-module.json',
      entry: activeEntry('scripts/validate-source-registry.mjs'),
    },
  ])
  assert.equal(result.status, 0, result.stderr)
})

test('rejects ACTIVE adapter without source identity provenance', async () => {
  const result = await runFixture([
    {
      filename: 'active-without-source-identity.json',
      entry: {
        ...activeEntry('scripts/validate-source-registry.mjs'),
        provenance: { ...baseEntry.provenance, sourceIdentityRequired: false },
      },
    },
  ])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /ACTIVE adapter requires provenance\.sourceIdentityRequired true/)
})

test('rejects ACTIVE adapter whose module file does not exist', async () => {
  const result = await runFixture([
    {
      filename: 'active-missing-module.json',
      entry: activeEntry('server/src/definitely-not-a-panacea-adapter.ts'),
    },
  ])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /ACTIVE adapter\.module does not exist/)
})

test('rejects ACTIVE adapter module that escapes repository root', async () => {
  const result = await runFixture([
    {
      filename: 'active-outside-repo.json',
      entry: activeEntry('../outside-panacea-adapter.ts'),
    },
  ])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /ACTIVE adapter\.module must stay inside the repository/)
})

test('rejects ACTIVE adapter module that points to a directory', async () => {
  const result = await runFixture([
    {
      filename: 'active-directory.json',
      entry: activeEntry('scripts'),
    },
  ])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /ACTIVE adapter\.module must reference a file/)
})

test('rejects commercial use ALLOWED without verified licensing', async () => {
  const result = await runFixture([
    {
      filename: 'unverified-commercial.json',
      entry: {
        ...baseEntry,
        license: { ...baseEntry.license, commercialUse: 'ALLOWED' },
      },
    },
  ])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /commercialUse ALLOWED requires license\.status VERIFIED/)
})

test('requires evidence fields for VERIFIED licenses', async () => {
  const result = await runFixture([
    {
      filename: 'verified-without-evidence.json',
      entry: {
        ...baseEntry,
        license: { ...baseEntry.license, status: 'VERIFIED' },
      },
    },
  ])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /VERIFIED license must declare license\.identifier/)
  assert.match(result.stderr, /VERIFIED license must declare license\.verificationUrl/)
  assert.match(result.stderr, /VERIFIED license must declare license\.verifiedAt/)
})
