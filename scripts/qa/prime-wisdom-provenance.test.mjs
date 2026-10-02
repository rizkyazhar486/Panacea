import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const catalogPath = resolve(repoRoot, 'data/prime-wisdom/source-catalog.json');
const seedPath = resolve(repoRoot, 'data/prime-wisdom/seed-units.json');

const REQUIRED_SOURCE_IDS = [
  'huberman-lab',
  'on-purpose-jay-shetty',
  'figuring-out-raj-shamani',
  'modern-wisdom-chris-williamson',
  'mark-cuban-public',
  'jiang-xueqin-public',
  'pbd-podcast',
  'diary-of-a-ceo-steven-bartlett',
  'warren-buffett-berkshire',
  'larry-ellison-public',
  'robert-kiyosaki-public',
  'dana-white-public',
  'shi-heng-yi-public',
  'quran-primary-governed',
  'hadith-primary-governed',
  'buddhist-canon-governed',
  'torah-biblical-primary-governed',
  'rockefeller-primary',
  'david-goggins-public',
  'robert-greene-public',
  'tim-grover-public',
  'thomas-seyfried-public',
  'my-metabolism-app',
  'ted-health-ecosystem',
  'friedrich-nietzsche-primary',
  'brian-tracy-public',
  'steven-kotler-public',
  'tucker-carlson-interviews',
  'vanessa-van-edwards-public',
  'leanne-ten-brinke-public',
  'michael-saylor-public',
  'ray-dalio-public',
  'alex-hormozi-public',
  'rachel-rubin-public',
  'darren-candow-public',
  'david-sinclair-public',
  'sam-sulek-public',
  'jeff-cavaliere-athleanx',
  'chris-bumstead-public',
  'jeff-nippard-public',
  'benjamin-bikman-public',
];

function readJson(path, label) {
  assert.ok(existsSync(path), `${label} must exist`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assertNonEmptyString(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`);
  assert.ok(value.trim().length > 0, `${label} must not be empty`);
}

test('PRIME Wisdom source catalog and seed corpus exist', () => {
  assert.ok(existsSync(catalogPath), 'data/prime-wisdom/source-catalog.json must exist');
  assert.ok(existsSync(seedPath), 'data/prime-wisdom/seed-units.json must exist');
});

test('source catalog contains the approved source universe with unique identities', () => {
  const catalog = readJson(catalogPath, 'source catalog');
  assert.ok(Array.isArray(catalog.sources), 'source catalog must expose sources[]');
  const ids = catalog.sources.map((source) => source.id);
  assert.equal(new Set(ids).size, ids.length, 'source ids must be unique');

  for (const id of REQUIRED_SOURCE_IDS) {
    assert.ok(ids.includes(id), `missing approved source identity: ${id}`);
  }
});

test('every source declares explicit provenance, rights, and ingestion policy', () => {
  const catalog = readJson(catalogPath, 'source catalog');
  const validRights = new Set(['verified', 'licensed', 'user_provided', 'check_required', 'unknown']);
  const validRetention = new Set(['allowed', 'forbidden', 'conditional']);
  const validIngestion = new Set(['public_primary', 'public_metadata', 'licensed_feed', 'user_provided', 'manual_reference']);

  for (const source of catalog.sources) {
    assertNonEmptyString(source.id, 'source.id');
    assertNonEmptyString(source.name, `${source.id}.name`);
    assertNonEmptyString(source.creator, `${source.id}.creator`);
    assertNonEmptyString(source.sourceClass, `${source.id}.sourceClass`);
    assert.ok(source.canonicalUrl === null || typeof source.canonicalUrl === 'string', `${source.id}.canonicalUrl must be string|null`);
    assert.ok(source.rights && typeof source.rights === 'object', `${source.id}.rights is required`);
    assert.ok(validRights.has(source.rights.status), `${source.id}.rights.status is invalid`);
    assert.ok(validRetention.has(source.rights.fullTextRetention), `${source.id}.rights.fullTextRetention is invalid`);
    assert.ok(validRetention.has(source.rights.redistribution), `${source.id}.rights.redistribution is invalid`);
    assert.ok(source.ingestion && typeof source.ingestion === 'object', `${source.id}.ingestion is required`);
    assert.ok(validIngestion.has(source.ingestion.mode), `${source.id}.ingestion.mode is invalid`);
    assert.equal(typeof source.ingestion.allowVerbatimLongForm, 'boolean', `${source.id}.allowVerbatimLongForm must be boolean`);
  }
});

test('unknown or check-required rights always fail closed for long-form retention', () => {
  const catalog = readJson(catalogPath, 'source catalog');
  for (const source of catalog.sources) {
    if (source.rights.status === 'unknown' || source.rights.status === 'check_required') {
      assert.equal(source.ingestion.allowVerbatimLongForm, false, `${source.id} must deny long-form ingestion while rights are unresolved`);
    }

    if (['book', 'podcast', 'interview'].includes(source.sourceClass) && !['verified', 'licensed'].includes(source.rights.status)) {
      assert.equal(source.rights.fullTextRetention, 'forbidden', `${source.id} must forbid full-text retention without verified/licensed rights`);
    }

    if (source.access === 'premium' || source.access === 'paywalled') {
      assert.ok(['public_metadata', 'licensed_feed'].includes(source.ingestion.mode), `${source.id} premium/paywalled ingestion must be metadata or licensed feed only`);
    }
  }
});

test('seed units are original, source-linked, locator-linked, and non-verbatim by default', () => {
  const catalog = readJson(catalogPath, 'source catalog');
  const seeds = readJson(seedPath, 'seed corpus');
  const ids = new Set(catalog.sources.map((source) => source.id));
  assert.ok(Array.isArray(seeds.units), 'seed corpus must expose units[]');
  assert.ok(seeds.units.length > 0, 'seed corpus must not be empty');

  for (const unit of seeds.units) {
    assertNonEmptyString(unit.id, 'unit.id');
    assert.ok(ids.has(unit.sourceId), `${unit.id} references unknown sourceId ${unit.sourceId}`);
    assert.ok(unit.locator && typeof unit.locator === 'object', `${unit.id}.locator is required`);
    assert.ok(Object.values(unit.locator).some((value) => value !== null && value !== ''), `${unit.id}.locator must identify a source location`);
    assertNonEmptyString(unit.principle, `${unit.id}.principle`);
    assert.equal(unit.transformation?.mode, 'original_paraphrase', `${unit.id} seed must use an original paraphrase`);
    assert.notEqual(unit.transformation?.mode, 'verbatim_allowed', `${unit.id} seed must not depend on verbatim retention`);
  }
});
