import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

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

type Fixture = {
  directory?: string
  filename: string
  entry: Record<string, unknown>
}

async function runFixture(fixtures: Fixture[]) {
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

const valid = await runFixture([{ filename: 'valid.json', entry: baseEntry }])
assert.equal(valid.status, 0, valid.stderr)
assert.match(valid.stdout, /1 entries, 1 unique ids/)

const duplicate = await runFixture([
  { filename: 'one.json', entry: baseEntry },
  { filename: 'two.json', entry: { ...baseEntry, name: 'Duplicate Fixture Source' } },
])
assert.notEqual(duplicate.status, 0)
assert.match(duplicate.stderr, /duplicate source id/)

const wrongDirectory = await runFixture([
  { directory: 'drug', filename: 'wrong-category.json', entry: baseEntry },
])
assert.notEqual(wrongDirectory.status, 0)
assert.match(wrongDirectory.stderr, /must match registry directory/)

const activeWithoutModule = await runFixture([
  {
    filename: 'active-without-module.json',
    entry: {
      ...baseEntry,
      adapter: { ...baseEntry.adapter, status: 'ACTIVE' },
    },
  },
])
assert.notEqual(activeWithoutModule.status, 0)
assert.match(activeWithoutModule.stderr, /ACTIVE adapter must declare a non-null adapter\.module/)

const unverifiedCommercial = await runFixture([
  {
    filename: 'unverified-commercial.json',
    entry: {
      ...baseEntry,
      license: { ...baseEntry.license, commercialUse: 'ALLOWED' },
    },
  },
])
assert.notEqual(unverifiedCommercial.status, 0)
assert.match(unverifiedCommercial.stderr, /commercialUse ALLOWED requires license\.status VERIFIED/)

const verifiedWithoutEvidence = await runFixture([
  {
    filename: 'verified-without-evidence.json',
    entry: {
      ...baseEntry,
      license: { ...baseEntry.license, status: 'VERIFIED' },
    },
  },
])
assert.notEqual(verifiedWithoutEvidence.status, 0)
assert.match(verifiedWithoutEvidence.stderr, /VERIFIED license must declare license\.identifier/)
assert.match(verifiedWithoutEvidence.stderr, /VERIFIED license must declare license\.verificationUrl/)
assert.match(verifiedWithoutEvidence.stderr, /VERIFIED license must declare license\.verifiedAt/)

console.log('Source registry validator semantic guards verified.')
