// Uji integrasi Prometheus Arena Terminal Runner, Anime Characters & Teachable Figures
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ARIA_DIALOGUE_POOL,
  KENJI_DIALOGUE_POOL,
  MIRA_DIALOGUE_POOL,
  getBotDialogue,
} from '../../src/domains/prometheus-learning/engine/animeArenaDialogue.ts';
import { runTerminalArena } from '../arena/play-arena-terminal.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..');

test('1. Anime character SVG portraits exist and validate XML structure', () => {
  const characters = ['aria', 'kenji', 'mira'];
  for (const c of characters) {
    const path = join(REPO_ROOT, 'public', 'prometheus', 'arena', `${c}.svg`);
    assert.ok(existsSync(path), `Portrait for ${c} must exist at ${path}`);
    const content = readFileSync(path, 'utf-8');
    assert.ok(content.startsWith('<svg'), `${c}.svg must begin with <svg tag`);
    assert.ok(content.includes('viewBox="0 0 512 512"'), `${c}.svg must have 512x512 viewBox`);
    assert.ok(content.includes(`bg-${c}`), `${c}.svg must define radial gradient bg-${c}`);
    assert.ok(content.endsWith('</svg>\n') || content.endsWith('</svg>'), `${c}.svg must properly terminate`);
  }
});

test('2. Anime dialogue engine yields deterministic, rich personality lines', () => {
  const seeds = [42, 999, 1337];
  for (const seed of seeds) {
    const d1 = getBotDialogue('bot:aria', 'match_start', seed);
    const d2 = getBotDialogue('bot:aria', 'match_start', seed);
    assert.equal(d1.speakerName, 'Aria');
    assert.equal(d1.text, d2.text, 'Same seed must produce identical dialogue line');

    const kenji = getBotDialogue('bot:kenji', 'learner_correct_streak', seed);
    assert.equal(kenji.speakerName, 'Kenji');
    assert.ok(KENJI_DIALOGUE_POOL.learner_correct_streak.includes(kenji.text));

    const mira = getBotDialogue('bot:mira', 'bot_fooled_by_distractor', seed);
    assert.equal(mira.speakerName, 'Mira');
    assert.equal(mira.emotion, 'shocked');
    assert.ok(MIRA_DIALOGUE_POOL.bot_fooled_by_distractor.includes(mira.text));
  }
});

test('3. Terminal runner executes autonomously in demo mode with 0 exit code', async () => {
  // Suppress terminal clear and direct logs during unit test run
  const origLog = console.log;
  const origWrite = process.stdout.write;
  const logs = [];
  console.log = (...args) => logs.push(args.join(' '));
  process.stdout.write = () => {};

  try {
    const exitCode = await runTerminalArena({ demo: true, seed: 777 });
    assert.equal(exitCode, 0, 'Autonomous demo execution must return exit code 0');
    assert.ok(logs.some((l) => l.includes('PANACEAMED PROMETHEUS ARENA')), 'Header banner rendered');
    assert.ok(logs.some((l) => l.includes('FINAL ARENA STANDINGS')), 'Final standings rendered');
    assert.ok(logs.some((l) => l.includes('TEACHABLE FIGURES CAUSAL HEMODYNAMICS')), 'Teachable figures telemetry rendered');
  } finally {
    console.log = origLog;
    process.stdout.write = origWrite;
  }
});
