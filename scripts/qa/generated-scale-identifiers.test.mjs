import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join('src', 'domains', 'generated-scale');
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
// Deklarasi yang dibangkitkan generateScaleModules.mjs: interface X, function evaluateX, moduleId: 'X'.
const DECL = /(?:export interface (\S+?)\s*\{|export function (\S+?)\(|moduleId: '([^']*)')/g;

export function illegalIdentifiers(source) {
  const bad = [];
  for (const m of source.matchAll(DECL)) {
    const name = m[1] ?? m[2];
    if (name !== undefined && !IDENT.test(name)) bad.push(name);
  }
  return bad;
}

const files = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => fs.readdirSync(path.join(ROOT, d.name)).map((f) => path.join(ROOT, d.name, f)))
  .filter((f) => f.endsWith('.ts'));

test('modul_terbangkit_memakai_identifier_ts_yang_sah', () => {
  assert.ok(files.length >= 1050, `hanya ${files.length} berkas`);
  const offenders = files
    .map((f) => [f, illegalIdentifiers(fs.readFileSync(f, 'utf8'))])
    .filter(([, bad]) => bad.length > 0);
  assert.deepEqual(offenders, []);
});

test('menolak_identifier_dengan_tanda_hubung', () => {
  const src = 'export interface critical-careModule1Input {\n}\nexport function evaluatecritical-careModule1(input) {}';
  assert.deepEqual(illegalIdentifiers(src), ['critical-careModule1Input', 'evaluatecritical-careModule1']);
});

test('menerima_identifier_camelCase_hasil_normalisasi', () => {
  const src = 'export interface criticalCareModule1Input {\n}\nexport function evaluatecriticalCareModule1(input) {}';
  assert.deepEqual(illegalIdentifiers(src), []);
});

test('berkas_domain_berhubung_tetap_ada_tanpa_ganti_nama', () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'critical-care', 'critical-careModule1.ts')));
  assert.ok(fs.existsSync(path.join(ROOT, 'plastic-surgery', 'plastic-surgeryModule35.ts')));
});
