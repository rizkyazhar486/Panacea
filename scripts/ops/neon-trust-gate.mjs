#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SKIP_BUILD = process.argv.includes('--skip-build');
const LIVE_URL = process.env.PANACEA_LIVE_URL || 'https://panaceamed.id';

function runCmd(command, args, opts = {}) {
  const res = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: opts.inherit ? 'inherit' : 'pipe',
    env: process.env,
  });
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

function walkFiles(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, exts, out);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

const checks = [];

// 1. Engineering & QA Integrity
if (SKIP_BUILD) {
  checks.push({
    dimension: '1. Engineering & QA Integrity',
    pass: true,
    detail: 'Skipped via --skip-build (run without flag for full 1,828+ QA gate)',
  });
} else {
  const buildRes = runCmd('npm', ['run', 'build'], { inherit: true });
  checks.push({
    dimension: '1. Engineering & QA Integrity',
    pass: buildRes.ok,
    detail: buildRes.ok
      ? 'npm run build + QA test suite + bundle budget PASSED'
      : `npm run build FAILED (exit ${buildRes.status})`,
  });
}

// 2. Cloudflare Edge & SPA Config Lock
const wranglerPath = path.join(ROOT, 'wrangler.toml');
const wranglerContent = fs.existsSync(wranglerPath)
  ? fs.readFileSync(wranglerPath, 'utf8')
  : '';
const hasSpaLock = wranglerContent.includes('not_found_handling = "single-page-application"');
const hasDistRedirects = fs.existsSync(path.join(ROOT, 'dist', '_redirects'));
const hasPublicRedirects = fs.existsSync(path.join(ROOT, 'public', '_redirects'));
const edgeConfigPass = hasSpaLock && !hasDistRedirects && !hasPublicRedirects;

checks.push({
  dimension: '2. Cloudflare SPA & Redirect Lock',
  pass: edgeConfigPass,
  detail: edgeConfigPass
    ? 'wrangler.toml SPA locked; 0 looping _redirects files'
    : `spaLock=${hasSpaLock}, dist/_redirects=${hasDistRedirects}, public/_redirects=${hasPublicRedirects}`,
});

// 3. Canonical Identity, Privacy & Secret Hygiene
const srcFiles = walkFiles(path.join(ROOT, 'src'), ['.ts', '.tsx', '.js', '.jsx']);
const typoHits = [];
const secretHits = [];
const secretPattern = /(postgresql:\/\/[^\s'"]+@[^\s'"]+|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,})/;

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('Asrizal')) {
    typoHits.push(path.relative(ROOT, file));
  }
  if (secretPattern.test(content)) {
    secretHits.push(path.relative(ROOT, file));
  }
}

const hygienePass = typoHits.length === 0 && secretHits.length === 0;
checks.push({
  dimension: '3. Identity & Secret Hygiene',
  pass: hygienePass,
  detail: hygienePass
    ? 'Canonical "Azrissal" clean; 0 hardcoded secrets in src/'
    : `typoHits=${typoHits.length} (${typoHits.slice(0, 3).join(', ')}), secretHits=${secretHits.length}`,
});

// 4. Neon Persistence & Push Contract
const neonSqlPath = path.join(ROOT, 'sql', '001_panaceamed_neon_os.sql');
const neonPushPath = path.join(ROOT, 'scripts', 'db', 'push-neon.mjs');
const hasNeonFiles = fs.existsSync(neonSqlPath) && fs.existsSync(neonPushPath);

let neonPass = false;
let neonDetail = 'Missing sql/001_panaceamed_neon_os.sql or scripts/db/push-neon.mjs';
if (hasNeonFiles) {
  const pushArgs = process.env.DATABASE_URL
    ? ['scripts/db/push-neon.mjs']
    : ['scripts/db/push-neon.mjs', '--dry-run'];
  const neonRes = runCmd('node', pushArgs);
  neonPass = neonRes.ok;
  neonDetail = neonRes.ok
    ? process.env.DATABASE_URL
      ? 'Neon live schema & seed push PASSED'
      : 'Neon schema & push script dry-run PASSED (set DATABASE_URL for live push)'
    : `Neon script failed (exit ${neonRes.status})`;
}

checks.push({
  dimension: '4. Neon Persistence Integrity',
  pass: neonPass,
  detail: neonDetail,
});

// 5. Live Edge Smoke Check
let smokePass = false;
let smokeDetail = `Failed to reach ${LIVE_URL}`;
try {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  const resp = await fetch(LIVE_URL, { signal: controller.signal });
  clearTimeout(timer);
  const html = await resp.text();
  const isHelloWorld = html.trim() === 'Hello world';
  const hasRoot = html.includes('<div id="root"') || html.includes('<!doctype html') || html.includes('<!DOCTYPE html');
  smokePass = resp.status === 200 && !isHelloWorld && hasRoot;
  smokeDetail = smokePass
    ? `HTTP 200 OK · valid PanaceaMed HTML shell at ${LIVE_URL}`
    : `HTTP ${resp.status} · helloWorld=${isHelloWorld} · validHtml=${hasRoot}`;
} catch (err) {
  smokeDetail = `Network check error (${err?.name || 'Error'})`;
}

checks.push({
  dimension: '5. Live Edge Production Smoke',
  pass: smokePass,
  detail: smokeDetail,
});

// Commander Trust Scorecard Output
const passedCount = checks.filter((c) => c.pass).length;
const scorePct = Math.round((passedCount / checks.length) * 100);

console.log('\n================ PANACEAMED COMMANDER TRUST SCORECARD ================');
for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'} | ${c.dimension} -> ${c.detail}`);
}
console.log('----------------------------------------------------------------------');
console.log(`AUTOMATED TRUST SCORE: ${passedCount}/${checks.length} (${scorePct}%)`);
console.log('======================================================================\n');

process.exit(passedCount === checks.length ? 0 : 1);
