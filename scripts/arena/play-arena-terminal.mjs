#!/usr/bin/env node
import readline from 'node:readline';
import process from 'node:process';
import { CARDIOVASCULAR_CATALOG } from '../../src/domains/prometheus-learning/data/cardiovascularCatalog.ts';
import {
  SCORING, createMatch, answerRound, currentQuestionId, standings,
  updateRating, matchLog, eligibleArenaQuestions, pickArenaQuestions,
} from '../../src/domains/prometheus-learning/engine/arena.ts';
import { newProgress, startLesson, submitAnswer } from '../../src/domains/prometheus-learning/engine/progress.ts';
import { getBotDialogue } from '../../src/domains/prometheus-learning/engine/animeArenaDialogue.ts';
import { HEMODYNAMIC_CAUSAL_NETWORK, simulateCausalNetwork } from '../../src/domains/biological-concept-graph/index.ts';

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', cyan: '\x1b[36m',
  teal: '\x1b[38;5;44m', blue: '\x1b[34m', indigo: '\x1b[38;5;63m',
  magenta: '\x1b[35m', purple: '\x1b[38;5;141m', yellow: '\x1b[33m',
  gold: '\x1b[38;5;220m', green: '\x1b[32m', emerald: '\x1b[38;5;48m',
  red: '\x1b[31m', crimson: '\x1b[38;5;196m', white: '\x1b[37m',
};

const BOT_THEMES = {
  'bot:aria': { color: C.teal, icon: '⚡', label: 'ARIA · SPEED' },
  'bot:kenji': { color: C.indigo, icon: '🧠', label: 'KENJI · STEADY' },
  'bot:mira': { color: C.purple, icon: '✨', label: 'MIRA · SCHOLAR' },
  'learner': { color: C.gold, icon: '👑', label: 'LEARNER' },
};

function renderCausalTelemetry(simState) {
  const v = simState.finalState.values;
  const edv = v['preload_edv']?.toFixed(1) ?? '120.0';
  const ino = v['contractility']?.toFixed(2) ?? '1.00';
  const svr = v['afterload_svr']?.toFixed(0) ?? '1200';
  const co = v['cardiac_output']?.toFixed(2) ?? '5.00';
  const map = v['mean_arterial_pressure']?.toFixed(1) ?? '93.3';
  console.log(`${C.dim}┌─ TEACHABLE FIGURES CAUSAL HEMODYNAMICS ENGINE ────────────────────────────────────────┐${C.reset}`);
  console.log(`│ ${C.teal}EDV (Preload):${C.reset} ${edv.padStart(5)} mL │ ${C.magenta}Inotropy:${C.reset} ${ino.padStart(4)}x │ ${C.blue}SVR (Afterload):${C.reset} ${svr.padStart(4)} dyn │ ${C.green}CO:${C.reset} ${co.padStart(4)} L/m │ ${C.yellow}MAP:${C.reset} ${map.padStart(4)} mmHg │`);
  console.log(`${C.dim}└───────────────────────────────────────────────────────────────────────────────────────┘${C.reset}`);
}

function printDialogueBox(dialogue) {
  const theme = BOT_THEMES[dialogue.speakerId] || BOT_THEMES['learner'];
  console.log(`\n${theme.color}┌─ ${theme.icon} ${dialogue.speakerName} (${dialogue.emotion.toUpperCase()}) ───────────────────────────────────${C.reset}`);
  console.log(`${theme.color}│ ${C.white}"${dialogue.text}"${C.reset}`);
  if (dialogue.causalHint) console.log(`${theme.color}│ ${C.dim}💡 Mechanism: ${dialogue.causalHint}${C.reset}`);
  console.log(`${theme.color}└────────────────────────────────────────────────────────────────────────┘${C.reset}\n`);
}

export async function runTerminalArena(options = {}) {
  const isDemo = options.demo ?? process.argv.includes('--demo');
  const seedArg = process.argv.find((a) => a.startsWith('--seed='));
  const seed = seedArg ? parseInt(seedArg.split('=')[1], 10) : (options.seed ?? 123456);

  process.stdout.write('\x1b[2J\x1b[0;0H');
  console.log(`${C.cyan}╔═══════════════════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.cyan}║   ${C.gold}${C.bold}PANACEAMED PROMETHEUS ARENA · INVICTUS MULTISCALE RETRIEVAL PRACTICE${C.cyan}                  ║${C.reset}`);
  console.log(`${C.cyan}╚═══════════════════════════════════════════════════════════════════════════════════════════╝${C.reset}\n`);
  console.log(`${C.bold}RIVAL OPPONENTS DETECTED:${C.reset}\n  ${C.teal}⚡ [Aria]${C.reset} Speedster (1100)  ${C.indigo}🧠 [Kenji]${C.reset} Methodical (1250)  ${C.purple}✨ [Mira]${C.reset} Top Scholar (1400)\n`);

  let progress = newProgress('learner:hero');
  progress = startLesson(progress, CARDIOVASCULAR_CATALOG, 'learner:hero', 'les:cardiac_output').progress;
  progress = startLesson(progress, CARDIOVASCULAR_CATALOG, 'learner:hero', 'les:cardiomyocyte_structure').progress;
  progress = submitAnswer(progress, CARDIOVASCULAR_CATALOG, { userId: 'learner:hero', questionId: 'q:sarcomere_unit', optionId: 'a', attemptId: 'att1', day: 0 }).progress;
  progress = submitAnswer(progress, CARDIOVASCULAR_CATALOG, { userId: 'learner:hero', questionId: 'q:sr_role', optionId: 'b', attemptId: 'att2', day: 0 }).progress;
  progress = startLesson(progress, CARDIOVASCULAR_CATALOG, 'learner:hero', 'les:ec_coupling').progress;

  const pickedQuestions = pickArenaQuestions(eligibleArenaQuestions(progress, CARDIOVASCULAR_CATALOG), 4, seed);
  const matchRes = createMatch({ matchId: `match:${Date.now()}`, userId: 'learner:hero', seed, timeLimitMs: 15000, questionIds: pickedQuestions }, CARDIOVASCULAR_CATALOG, progress);
  if (!matchRes.ok) { console.error(`Failed to create match: ${matchRes.reason}`); return 1; }

  let match = matchRes.match;
  let causalState = simulateCausalNetwork(HEMODYNAMIC_CAUSAL_NETWORK, []);
  let learnerStreak = 0;

  printDialogueBox(getBotDialogue('bot:mira', 'match_start', seed));
  printDialogueBox(getBotDialogue('bot:aria', 'match_start', seed + 1));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

  for (let rIdx = 0; rIdx < match.questionIds.length; rIdx++) {
    const qid = currentQuestionId(match);
    if (!qid) break;
    const q = CARDIOVASCULAR_CATALOG.questions.find((x) => x.id === qid);
    if (!q) continue;

    console.log(`\n${C.bold}ROUND ${rIdx + 1}/${match.questionIds.length} · CONCEPT: ${C.cyan}${q.conceptId}${C.reset}`);
    renderCausalTelemetry(causalState);
    console.log(`\n${C.bold}${C.white}${q.stem}${C.reset}\n`);
    q.options.forEach((opt, idx) => console.log(`  ${C.bold}${C.cyan}[${String.fromCharCode(65 + idx)}]${C.reset} ${opt.text}`));

    const startTime = Date.now();
    let chosenOptionId = null;
    let responseMs = 4500;

    if (isDemo) {
      await new Promise((r) => setTimeout(r, 300));
      const isCorrect = (seed + rIdx) % 3 !== 0;
      chosenOptionId = isCorrect ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)?.id;
      responseMs = 3600 + rIdx * 500;
      console.log(`\n${C.gold}👑 [Learner Action]: Submitting choice [${(chosenOptionId || 'A').toUpperCase()}] in ${(responseMs / 1000).toFixed(1)}s...${C.reset}`);
    } else {
      const answerInput = await askQuestion(`\n${C.gold}👑 Enter your choice (A, B, C, D) [or 'q' to quit]: ${C.reset}`);
      responseMs = Math.max(SCORING.minResponseMs, Math.min(15000, Date.now() - startTime));
      const cleaned = answerInput.trim().toLowerCase();
      if (cleaned === 'q') { rl.close(); return 0; }
      chosenOptionId = { a: 'a', b: 'b', c: 'c', d: 'd' }[cleaned] || null;
    }

    const ansRes = answerRound(match, CARDIOVASCULAR_CATALOG, { userId: 'learner:hero', questionId: qid, optionId: chosenOptionId, responseMs });
    if (!ansRes.ok) continue;

    match = ansRes.match;
    const currentRound = ansRes.round;
    const learnerRoundAns = currentRound.answers.find((a) => a.competitorId === 'learner');
    const isLearnerCorrect = learnerRoundAns?.correct ?? false;

    if (isLearnerCorrect) {
      learnerStreak++;
      console.log(`\n${C.emerald}✔ CORRECT! +${learnerRoundAns.points} pts (Streak: ${learnerStreak})${C.reset}`);
    } else {
      learnerStreak = 0;
      console.log(`\n${C.crimson}✘ INCORRECT! Correct answer was [${q.correctOptionId.toUpperCase()}]. 0 pts.${C.reset}`);
    }
    console.log(`\n${C.dim}RATIONALE: ${q.options.find((o) => o.id === q.correctOptionId)?.rationale}${C.reset}`);

    if (q.conceptId === 'pcg:sarcomere' || q.conceptId === 'pcg:excitation_contraction_coupling') {
      causalState = simulateCausalNetwork(HEMODYNAMIC_CAUSAL_NETWORK, [{ variableId: 'contractility', type: 'relative_delta', value: isLearnerCorrect ? 0.3 : -0.2 }]);
    } else if (q.conceptId === 'pcg:left_ventricle') {
      causalState = simulateCausalNetwork(HEMODYNAMIC_CAUSAL_NETWORK, [{ variableId: 'preload_edv', type: 'relative_delta', value: 15 }]);
    }

    const botAnswers = currentRound.answers.filter((a) => a.competitorId !== 'learner');
    const fastestBot = botAnswers.slice().sort((a, b) => a.responseMs - b.responseMs)[0];
    console.log(`\n${C.bold}RIVAL ACTIONS THIS ROUND:${C.reset}`);
    for (const bAns of botAnswers) {
      const theme = BOT_THEMES[bAns.competitorId];
      const botProfile = match.bots.find((b) => b.id === bAns.competitorId);
      const mark = bAns.correct ? `${C.green}CORRECT (+${bAns.points} pts)${C.reset}` : `${C.red}WRONG (0 pts)${C.reset}`;
      console.log(`  ${theme.color}${theme.icon} ${botProfile.name.padEnd(8)}${C.reset} Picked [${(bAns.optionId || '-').toUpperCase()}] in ${(bAns.responseMs / 1000).toFixed(1)}s → ${mark}`);
    }

    if (isLearnerCorrect && learnerStreak >= 2) printDialogueBox(getBotDialogue('bot:kenji', 'learner_correct_streak', seed + rIdx));
    else if (!isLearnerCorrect) printDialogueBox(getBotDialogue('bot:aria', 'learner_incorrect', seed + rIdx));
    else if (responseMs < fastestBot.responseMs) printDialogueBox(getBotDialogue('bot:aria', 'learner_answered_fast', seed + rIdx));
    else printDialogueBox(getBotDialogue('bot:mira', 'round_start', seed + rIdx));
  }

  rl.close();
  console.log(`\n${C.gold}${C.bold}FINAL ARENA STANDINGS & RETRIEVAL SUMMARY${C.reset}`);
  const st = standings(match);
  for (const s of st) {
    const theme = BOT_THEMES[s.competitorId] || BOT_THEMES['learner'];
    const rankBadge = s.rank === 1 ? '🥇 1st' : s.rank === 2 ? '🥈 2nd' : s.rank === 3 ? '🥉 3rd' : '   4th';
    console.log(`${rankBadge}  ${theme.color}${s.name.padEnd(16)}${C.reset}  ${String(s.points).padStart(6)}  ${s.correct}/${match.questionIds.length}  ${(s.totalMs / 1000).toFixed(1)}s`);
  }
  matchLog(match, CARDIOVASCULAR_CATALOG).slice(0, 5).forEach((line) => console.log(`${C.dim}${line}${C.reset}`));
  const ratingRes = updateRating(match, 1200);
  if (ratingRes.ok) console.log(`\n${C.emerald}${C.bold}RATING UPDATE:${C.reset} 1200 → ${ratingRes.rating} (${ratingRes.delta >= 0 ? '+' : ''}${ratingRes.delta} Elo)\n`);
  if (st[0]?.competitorId === 'learner') {
    printDialogueBox(getBotDialogue('bot:aria', 'match_learner_win', seed + 99));
    console.log(`${C.emerald}${C.bold}🏆 CONGRATULATIONS! You achieved 1st Place in the Prometheus Cardiac Arena!${C.reset}\n`);
  } else {
    printDialogueBox(getBotDialogue('bot:kenji', 'match_learner_podium', seed + 99));
  }
  return 0;
}

if (process.argv[1]?.endsWith('play-arena-terminal.mjs')) {
  runTerminalArena({ demo: process.argv.includes('--demo') }).then((code) => process.exit(code ?? 0));
}
