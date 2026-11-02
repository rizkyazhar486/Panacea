#!/usr/bin/env node
/**
 * PANACEAMED PROMETHEUS ARENA — MULTISCALE ANIME BOT RETRIEVAL TERMINAL
 * ======================================================================
 * End-to-end interactive terminal for competitive medical retrieval practice.
 * Learner competes against 3 deterministic rival bots (Aria, Kenji, Mira)
 * with live anime personality dialogues, multiscale anatomical grounding,
 * and real-time Teachable Figures causal hemodynamics coupling.
 *
 * Usage:
 *   node scripts/arena/play-arena-terminal.mjs           # Interactive mode
 *   node scripts/arena/play-arena-terminal.mjs --demo    # Autonomous demo
 *   node scripts/arena/play-arena-terminal.mjs --seed=42 # Pinned seed
 */

import readline from 'node:readline';
import process from 'node:process';
import { CARDIOVASCULAR_CATALOG } from '../../src/domains/prometheus-learning/data/cardiovascularCatalog.ts';
import {
  ARENA_BOTS,
  SCORING,
  createMatch,
  answerRound,
  currentQuestionId,
  standings,
  updateRating,
  matchLog,
  eligibleArenaQuestions,
  pickArenaQuestions,
} from '../../src/domains/prometheus-learning/engine/arena.ts';
import {
  newProgress,
  startLesson,
  submitAnswer,
} from '../../src/domains/prometheus-learning/engine/progress.ts';
import { getBotDialogue } from '../../src/domains/prometheus-learning/engine/animeArenaDialogue.ts';
import {
  HEMODYNAMIC_CAUSAL_NETWORK,
  simulateCausalNetwork,
} from '../../src/domains/biological-concept-graph/index.ts';

// ANSI Styling
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  teal: '\x1b[38;5;44m',
  blue: '\x1b[34m',
  indigo: '\x1b[38;5;63m',
  magenta: '\x1b[35m',
  purple: '\x1b[38;5;141m',
  yellow: '\x1b[33m',
  gold: '\x1b[38;5;220m',
  green: '\x1b[32m',
  emerald: '\x1b[38;5;48m',
  red: '\x1b[31m',
  crimson: '\x1b[38;5;196m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bgDark: '\x1b[48;5;234m',
  bgTeal: '\x1b[48;5;23m',
  bgIndigo: '\x1b[48;5;17m',
  bgPurple: '\x1b[48;5;53m',
};

const BOT_THEMES = {
  'bot:aria': { color: C.teal, bg: C.bgTeal, icon: '⚡', label: 'ARIA · SPEED' },
  'bot:kenji': { color: C.indigo, bg: C.bgIndigo, icon: '🧠', label: 'KENJI · STEADY' },
  'bot:mira': { color: C.purple, bg: C.bgPurple, icon: '✨', label: 'MIRA · SCHOLAR' },
  'learner': { color: C.gold, bg: C.bgDark, icon: '👑', label: 'LEARNER' },
};

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[0;0H');
}

function printHeader() {
  console.log(`${C.cyan}╔═══════════════════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.cyan}║   ${C.gold}${C.bold}PANACEAMED PROMETHEUS ARENA · INVICTUS MULTISCALE RETRIEVAL PRACTICE${C.cyan}                  ║${C.reset}`);
  console.log(`${C.cyan}║   ${C.dim}Deterministic 3-Rival Training Engine with Teachable Causal Hemodynamics & Anime Bots${C.cyan}   ║${C.reset}`);
  console.log(`${C.cyan}╚═══════════════════════════════════════════════════════════════════════════════════════════╝${C.reset}\n`);
}

function printBotRoster() {
  console.log(`${C.bold}RIVAL OPPONENTS DETECTED:${C.reset}`);
  console.log(`  ${C.teal}⚡ [Aria]${C.reset}    ${C.dim}Speedster (Rating 1100) — answers in ~4.2s, aggressive, high-cadence.${C.reset}`);
  console.log(`  ${C.indigo}🧠 [Kenji]${C.reset}   ${C.dim}Methodical (Rating 1250) — answers in ~7.6s, balanced, checks first principles.${C.reset}`);
  console.log(`  ${C.purple}✨ [Mira]${C.reset}    ${C.dim}Top Scholar (Rating 1400) — answers in ~10.8s, slow but exceptionally accurate.${C.reset}\n`);
}

function renderCausalTelemetry(simState) {
  const vals = simState.finalState.values;
  const edv = vals['preload_edv']?.toFixed(1) ?? '120.0';
  const inotropy = vals['contractility']?.toFixed(2) ?? '1.00';
  const svr = vals['afterload_svr']?.toFixed(0) ?? '1200';
  const co = vals['cardiac_output']?.toFixed(2) ?? '5.00';
  const map = vals['mean_arterial_pressure']?.toFixed(1) ?? '93.3';

  console.log(`${C.dim}┌─ TEACHABLE FIGURES CAUSAL HEMODYNAMICS ENGINE ────────────────────────────────────────┐${C.reset}`);
  console.log(`│ ${C.teal}EDV (Preload):${C.reset} ${edv.padStart(5)} mL │ ${C.magenta}Inotropy:${C.reset} ${inotropy.padStart(4)}x │ ${C.blue}SVR (Afterload):${C.reset} ${svr.padStart(4)} dyn │ ${C.green}CO:${C.reset} ${co.padStart(4)} L/m │ ${C.yellow}MAP:${C.reset} ${map.padStart(4)} mmHg │`);
  console.log(`${C.dim}└───────────────────────────────────────────────────────────────────────────────────────┘${C.reset}`);
}

function printDialogueBox(dialogue) {
  const theme = BOT_THEMES[dialogue.speakerId] || BOT_THEMES['learner'];
  console.log(`\n${theme.color}┌─ ${theme.icon} ${dialogue.speakerName} (${dialogue.emotion.toUpperCase()}) ───────────────────────────────────${C.reset}`);
  console.log(`${theme.color}│ ${C.white}"${dialogue.text}"${C.reset}`);
  if (dialogue.causalHint) {
    console.log(`${theme.color}│ ${C.dim}💡 Mechanism: ${dialogue.causalHint}${C.reset}`);
  }
  console.log(`${theme.color}└────────────────────────────────────────────────────────────────────────┘${C.reset}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runTerminalArena(options = {}) {
  const isDemo = options.demo ?? process.argv.includes('--demo');
  const seedArg = process.argv.find((a) => a.startsWith('--seed='));
  const seed = seedArg ? parseInt(seedArg.split('=')[1], 10) : (options.seed ?? 123456);

  clearScreen();
  printHeader();
  printBotRoster();

  // Initialize progress with unlocked lessons
  let progress = newProgress('learner:hero');
  progress = startLesson(progress, CARDIOVASCULAR_CATALOG, 'learner:hero', 'les:cardiac_output').progress;
  progress = startLesson(progress, CARDIOVASCULAR_CATALOG, 'learner:hero', 'les:cardiomyocyte_structure').progress;
  progress = submitAnswer(progress, CARDIOVASCULAR_CATALOG, {
    userId: 'learner:hero',
    questionId: 'q:sarcomere_unit',
    optionId: 'a',
    attemptId: 'att1',
    day: 0,
  }).progress;
  progress = submitAnswer(progress, CARDIOVASCULAR_CATALOG, {
    userId: 'learner:hero',
    questionId: 'q:sr_role',
    optionId: 'b',
    attemptId: 'att2',
    day: 0,
  }).progress;
  progress = startLesson(progress, CARDIOVASCULAR_CATALOG, 'learner:hero', 'les:ec_coupling').progress;

  const eligible = eligibleArenaQuestions(progress, CARDIOVASCULAR_CATALOG);
  const pickedQuestions = pickArenaQuestions(eligible, 4, seed);

  const matchRes = createMatch(
    {
      matchId: `match:${Date.now()}`,
      userId: 'learner:hero',
      seed,
      timeLimitMs: 15000,
      questionIds: pickedQuestions,
    },
    CARDIOVASCULAR_CATALOG,
    progress
  );

  if (!matchRes.ok) {
    console.error(`${C.red}Failed to create match: ${matchRes.reason}${C.reset}`);
    return 1;
  }

  let match = matchRes.match;
  let causalState = simulateCausalNetwork(HEMODYNAMIC_CAUSAL_NETWORK, []);
  let learnerStreak = 0;

  // Initial dialogue from Mira and Aria
  printDialogueBox(getBotDialogue('bot:mira', 'match_start', seed));
  printDialogueBox(getBotDialogue('bot:aria', 'match_start', seed + 1));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

  for (let rIdx = 0; rIdx < match.questionIds.length; rIdx++) {
    const qid = currentQuestionId(match);
    if (!qid) break;
    const q = CARDIOVASCULAR_CATALOG.questions.find((x) => x.id === qid);
    if (!q) continue;

    console.log(`\n${C.bold}${C.yellow}═════════════════════════════════════════════════════════════════════════════════════════════${C.reset}`);
    console.log(`${C.bold}ROUND ${rIdx + 1}/${match.questionIds.length} · CONCEPT: ${C.cyan}${q.conceptId}${C.reset} ${C.dim}[Timer: 15s]${C.reset}`);
    console.log(`${C.bold}${C.yellow}═════════════════════════════════════════════════════════════════════════════════════════════${C.reset}\n`);

    renderCausalTelemetry(causalState);

    console.log(`\n${C.bold}${C.white}${q.stem}${C.reset}\n`);

    q.options.forEach((opt, idx) => {
      const letter = String.fromCharCode(65 + idx);
      console.log(`  ${C.bold}${C.cyan}[${letter}]${C.reset} ${opt.text}`);
    });

    const startTime = Date.now();
    let chosenOptionId = null;
    let responseMs = 4500;

    if (isDemo) {
      // In demo mode: simulate realistic fast response
      await sleep(300);
      const isCorrect = (seed + rIdx) % 3 !== 0;
      chosenOptionId = isCorrect ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)?.id;
      responseMs = 3600 + (rIdx * 500);
      console.log(`\n${C.gold}👑 [Learner Action]: Submitting choice [${(chosenOptionId || 'A').toUpperCase()}] in ${(responseMs / 1000).toFixed(1)}s...${C.reset}`);
    } else {
      const answerInput = await askQuestion(`\n${C.gold}👑 Enter your choice (A, B, C, D) [or 'q' to quit]: ${C.reset}`);
      const elapsed = Date.now() - startTime;
      responseMs = Math.max(SCORING.minResponseMs, Math.min(15000, elapsed));

      const cleaned = answerInput.trim().toLowerCase();
      if (cleaned === 'q') {
        console.log('\nMatch aborted by learner.');
        rl.close();
        return 0;
      }

      const letterMap = { a: 'a', b: 'b', c: 'c', d: 'd' };
      chosenOptionId = letterMap[cleaned] || null;
    }

    const ansRes = answerRound(match, CARDIOVASCULAR_CATALOG, {
      userId: 'learner:hero',
      questionId: qid,
      optionId: chosenOptionId,
      responseMs,
    });

    if (!ansRes.ok) {
      console.error(`${C.red}Round answer rejected: ${ansRes.reason}${C.reset}`);
      continue;
    }

    match = ansRes.match;
    const currentRound = ansRes.round;
    const learnerRoundAns = currentRound.answers.find((a) => a.competitorId === 'learner');
    const isLearnerCorrect = learnerRoundAns?.correct ?? false;

    if (isLearnerCorrect) {
      learnerStreak++;
      console.log(`\n${C.emerald}✔ CORRECT! +${learnerRoundAns.points} pts (Speed: ${(responseMs / 1000).toFixed(1)}s, Streak: ${learnerStreak})${C.reset}`);
    } else {
      learnerStreak = 0;
      console.log(`\n${C.crimson}✘ INCORRECT! Correct answer was [${q.correctOptionId.toUpperCase()}]. 0 pts.${C.reset}`);
    }

    // Print option rationales
    console.log(`\n${C.dim}RATIONALE: ${q.options.find((o) => o.id === q.correctOptionId)?.rationale}${C.reset}`);

    // Update Teachable Causal Figures perturbation based on question
    if (q.conceptId === 'pcg:sarcomere' || q.conceptId === 'pcg:excitation_contraction_coupling') {
      causalState = simulateCausalNetwork(HEMODYNAMIC_CAUSAL_NETWORK, [
        { variableId: 'contractility', type: 'relative_delta', value: isLearnerCorrect ? 0.3 : -0.2 },
      ]);
    } else if (q.conceptId === 'pcg:left_ventricle') {
      causalState = simulateCausalNetwork(HEMODYNAMIC_CAUSAL_NETWORK, [
        { variableId: 'preload_edv', type: 'relative_delta', value: 15 },
      ]);
    }

    // Bot commentary based on round results
    const botAnswers = currentRound.answers.filter((a) => a.competitorId !== 'learner');
    const fastestBot = botAnswers.slice().sort((a, b) => a.responseMs - b.responseMs)[0];

    console.log(`\n${C.bold}RIVAL ACTIONS THIS ROUND:${C.reset}`);
    for (const bAns of botAnswers) {
      const theme = BOT_THEMES[bAns.competitorId];
      const botProfile = match.bots.find((b) => b.id === bAns.competitorId);
      const mark = bAns.correct ? `${C.green}CORRECT (+${bAns.points} pts)${C.reset}` : `${C.red}WRONG (0 pts)${C.reset}`;
      console.log(`  ${theme.color}${theme.icon} ${botProfile.name.padEnd(8)}${C.reset} Picked [${(bAns.optionId || '-').toUpperCase()}] in ${(bAns.responseMs / 1000).toFixed(1)}s → ${mark}`);
    }

    // Trigger personality lines
    if (isLearnerCorrect && learnerStreak >= 2) {
      printDialogueBox(getBotDialogue('bot:kenji', 'learner_correct_streak', seed + rIdx));
    } else if (!isLearnerCorrect) {
      printDialogueBox(getBotDialogue('bot:aria', 'learner_incorrect', seed + rIdx));
    } else if (responseMs < fastestBot.responseMs) {
      printDialogueBox(getBotDialogue('bot:aria', 'learner_answered_fast', seed + rIdx));
    } else {
      printDialogueBox(getBotDialogue('bot:mira', 'round_start', seed + rIdx));
    }
  }

  rl.close();

  // Final Terminal Standings & Celebration
  console.log(`\n\n${C.gold}${C.bold}═════════════════════════════════════════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.gold}${C.bold}                         FINAL ARENA STANDINGS & RETRIEVAL SUMMARY                          ${C.reset}`);
  console.log(`${C.gold}${C.bold}═════════════════════════════════════════════════════════════════════════════════════════════${C.reset}\n`);

  const st = standings(match);
  console.log(`${C.bold}RANK  COMPETITOR        POINTS    CORRECT    TOTAL TIME${C.reset}`);
  console.log(`${C.dim}────────────────────────────────────────────────────────────${C.reset}`);
  for (const s of st) {
    const theme = BOT_THEMES[s.competitorId] || BOT_THEMES['learner'];
    const rankBadge = s.rank === 1 ? '🥇 1st' : s.rank === 2 ? '🥈 2nd' : s.rank === 3 ? '🥉 3rd' : '   4th';
    console.log(`${rankBadge}  ${theme.color}${s.name.padEnd(16)}${C.reset}  ${String(s.points).padStart(6)}      ${s.correct}/${match.questionIds.length}       ${(s.totalMs / 1000).toFixed(1)}s`);
  }

  const logs = matchLog(match, CARDIOVASCULAR_CATALOG);
  console.log(`\n${C.dim}--- AUDIT LOG (SHA: ${match.matchId}) ---${C.reset}`);
  logs.slice(0, 5).forEach((line) => console.log(`${C.dim}${line}${C.reset}`));

  const ratingRes = updateRating(match, 1200);
  if (ratingRes.ok) {
    const sign = ratingRes.delta >= 0 ? '+' : '';
    console.log(`\n${C.emerald}${C.bold}RATING UPDATE:${C.reset} 1200 → ${ratingRes.rating} (${sign}${ratingRes.delta} Elo)\n`);
  }

  const isWinner = st[0]?.competitorId === 'learner';
  if (isWinner) {
    printDialogueBox(getBotDialogue('bot:aria', 'match_learner_win', seed + 99));
    printDialogueBox(getBotDialogue('bot:mira', 'match_learner_win', seed + 100));
    console.log(`${C.emerald}${C.bold}🏆 CONGRATULATIONS! You achieved 1st Place in the Prometheus Cardiac Arena!${C.reset}\n`);
  } else {
    printDialogueBox(getBotDialogue('bot:kenji', 'match_learner_podium', seed + 99));
  }

  return 0;
}

// Direct execution guard
if (process.argv[1]?.endsWith('play-arena-terminal.mjs')) {
  runTerminalArena({ demo: process.argv.includes('--demo') }).then((code) => {
    process.exit(code ?? 0);
  });
}
