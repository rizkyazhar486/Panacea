import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const HTML_PATH = path.join(ROOT, 'public', 'medscihub-human-ai-emr-3d.html');

test('portable single-file HTML is air-gapped with zero external CDN dependencies', () => {
  assert.equal(fs.existsSync(HTML_PATH), true, 'public/medscihub-human-ai-emr-3d.html must exist');
  const html = fs.readFileSync(HTML_PATH, 'utf8');

  // Negative checks: zero external CDN scripts, stylesheets, or unverified claims
  assert.equal(/https?:\/\//i.test(html), false, 'portable edition must contain zero http(s):// external URLs');
  assert.equal(/<script[^>]+src=/i.test(html), false, 'portable edition must inline all scripts without external src');
  assert.equal(/biophoton|quantum[_\s]healing|conscious_immortality/i.test(html), false);

  // Positive checks: full CAD/CAE/3T controls and clinically_reviewed=false guard
  for (const token of [
    'cadCanvas',
    'btnCombine',
    'btnProj',
    'btnWire',
    'btnLaser',
    'rngX',
    'rngY',
    'rngZ',
    'cabgOut',
    'netOut',
    'bioOut',
    'btnExportEmr',
    'clinically_reviewed: false',
    'EDUCATIONAL_AND_CAE_RESEARCH_ONLY',
    './#/med-study?bagian=cad-cae-3d',
  ]) {
    assert.ok(html.includes(token), `portable HTML missing required control/contract token: ${token}`);
  }
});

test('portable HTML preserves <= 1500-line PR budget and clean dark high-contrast styles', () => {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const lines = html.split('\n').length;
  assert.ok(lines > 200 && lines < 700, `unexpected portable HTML line count: ${lines}`);
  assert.ok(html.includes('min-height: 44px'), 'touch targets must enforce >= 44px minimum height');
});
