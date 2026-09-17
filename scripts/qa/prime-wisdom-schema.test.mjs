import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const typesPath = resolve(repoRoot, 'src/lib/prime/wisdom/types.ts');
const indexPath = resolve(repoRoot, 'src/lib/prime/wisdom/index.ts');

function extractInterface(source, name) {
  const match = source.match(new RegExp(`export\\s+interface\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'));
  assert.ok(match, `${name} must be exported as an interface`);
  return match[1];
}

function requireField(body, field) {
  assert.match(body, new RegExp(`\\b${field}\\s*:`), `${field} must be required`);
  assert.doesNotMatch(body, new RegExp(`\\b${field}\\?\\s*:`), `${field} must not be optional`);
}

test('PRIME Wisdom normalized type contract exists', () => {
  assert.ok(existsSync(typesPath), 'src/lib/prime/wisdom/types.ts must exist');
  assert.ok(existsSync(indexPath), 'src/lib/prime/wisdom/index.ts must exist');
});

test('PrimeWisdomUnit requires provenance, evidence, rights, and transformation fields', () => {
  assert.ok(existsSync(typesPath), 'Wisdom types are not implemented yet');
  const source = readFileSync(typesPath, 'utf8');
  const body = extractInterface(source, 'PrimeWisdomUnit');

  for (const field of [
    'id',
    'sourceId',
    'sourceClass',
    'locator',
    'domains',
    'principle',
    'evidenceRole',
    'supportingEvidenceIds',
    'contradictingUnitIds',
    'agreementUnitIds',
    'risks',
    'limitations',
    'rights',
    'transformation',
  ]) {
    requireField(body, field);
  }
});

test('rights and worldview contracts preserve explicit provenance boundaries', () => {
  assert.ok(existsSync(typesPath), 'Wisdom types are not implemented yet');
  const source = readFileSync(typesPath, 'utf8');
  const rights = extractInterface(source, 'PrimeWisdomRights');
  const worldview = extractInterface(source, 'PrimeWisdomWorldview');

  for (const field of ['status', 'fullTextRetention', 'redistribution']) requireField(rights, field);

  assert.match(source, /'verified'\s*\|\s*'licensed'\s*\|\s*'user_provided'\s*\|\s*'check_required'\s*\|\s*'unknown'/);
  assert.match(source, /'allowed'\s*\|\s*'forbidden'\s*\|\s*'conditional'/);
  assert.match(worldview, /tradition\?\s*:/);
  assert.match(worldview, /layer\?\s*:/);
  assert.match(worldview, /authenticityStatus\?\s*:/);
});

test('source and evidence unions keep scientific, worldview, opinion, and contested material distinct', () => {
  assert.ok(existsSync(typesPath), 'Wisdom types are not implemented yet');
  const source = readFileSync(typesPath, 'utf8');

  for (const token of [
    'scientific_evidence',
    'clinical_guideline',
    'expert_education',
    'religious_canon',
    'religious_report',
    'religious_commentary',
    'book',
    'interview',
    'podcast',
    'opinion',
    'contested_claim',
    'clinical_authority',
    'scientific_support',
    'mechanistic_hypothesis',
    'ethical_worldview',
    'case_study',
    'personal_experience',
  ]) {
    assert.match(source, new RegExp(`['\"]${token}['\"]`), `missing contract token: ${token}`);
  }
});

test('Wisdom public index exports the normalized contract', () => {
  assert.ok(existsSync(indexPath), 'Wisdom index is not implemented yet');
  const source = readFileSync(indexPath, 'utf8');
  assert.match(source, /export\s+type\s+\{[\s\S]*PrimeWisdomUnit[\s\S]*\}\s+from\s+['\"]\.\/types['\"]/m);
});
