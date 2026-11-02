// Anime Arena Dialogue & Personality Engine for Prometheus MedStudyHub.
// Provides deterministic, anime-character dialogues, reactions, and physiological causal commentary
// for the 3 rival bots (Aria, Kenji, Mira) during competitive retrieval practice.

export type BotReactionTrigger =
  | 'match_start'
  | 'round_start'
  | 'bot_answered_fast'
  | 'bot_answered_correct'
  | 'bot_fooled_by_distractor'
  | 'learner_answered_fast'
  | 'learner_correct_streak'
  | 'learner_incorrect'
  | 'timeout'
  | 'causal_perturbation'
  | 'match_learner_win'
  | 'match_learner_podium'
  | 'match_learner_loss';

export interface AnimeDialogueLine {
  readonly speakerId: 'bot:aria' | 'bot:kenji' | 'bot:mira' | 'system';
  readonly speakerName: string;
  readonly emotion: 'confident' | 'shocked' | 'thinking' | 'celebrating' | 'blushing' | 'analytical';
  readonly text: string;
  readonly causalHint?: string;
}

export const ARIA_DIALOGUE_POOL: Record<BotReactionTrigger, readonly string[]> = Object.freeze({
  match_start: [
    'Hehe, ready to see real speed? I’ve already pre-read the Frank-Starling curve!',
    'Don’t blink or I’ll clear all five questions before your action potential depolarizes!',
    'Challenge accepted! Let’s see if your clinical reflexes can keep up with me!',
  ],
  round_start: [
    'Here it comes! Quick, lock in your answer!',
    'Target locked! Time to push the pace!',
  ],
  bot_answered_fast: [
    'First to tap in! The early myocyte catches the calcium surge!',
    'Boom! Sub-3-second strike! Can you beat that tempo?',
  ],
  bot_answered_correct: [
    'Nailed it! Sarcomere mechanics are pure muscle memory to me!',
    'Points secured! Told you speed and intuition make the best combo!',
  ],
  bot_fooled_by_distractor: [
    'Auuugh! That distractor had "Sarcoplasmic Reticulum" written all over it... too fast!',
    'Wait, seriously?! I skimmed the units! Note to self: always check mL versus Liters!',
  ],
  learner_answered_fast: [
    'Whoa! Faster than me?! Did you take beta-1 agonists before this round?!',
    'Hey, nice reflexes! You actually beat my buzzer!',
  ],
  learner_correct_streak: [
    'Three in a row?! You’re on fire! I need to kick into overdrive!',
    'That streak multiplier is scary... Don’t get cocky though!',
  ],
  learner_incorrect: [
    'Ah, missed that one! Don’t worry, even healthy hearts drop an extrasystole sometimes!',
    'Check the question stem carefully! They sneaked in a clinical trap!',
  ],
  timeout: [
    'Time’s up! In the ER, seconds count! Next time trust your gut!',
  ],
  causal_perturbation: [
    'Look at that stroke volume jump! Inotropy really changes the whole PV loop!',
  ],
  match_learner_win: [
    'Incredible run! You totally outpaced me today! Rematch tomorrow, deal?!',
    'Hmph, you win this round! But my reflex training begins tonight!',
  ],
  match_learner_podium: [
    'Solid podium finish! We made an awesome rivalry team up there!',
  ],
  match_learner_loss: [
    'Victory for the speedster! Don’t look so down, review your cards and let’s race again!',
  ],
});

export const KENJI_DIALOGUE_POOL: Record<BotReactionTrigger, readonly string[]> = Object.freeze({
  match_start: [
    'Greetings. Let’s approach each clinical question systematically and without haste.',
    'Speed is secondary to physiological precision. Focus on the core mechanistic pathways.',
    'Calm breathing. Remember Guyton & Hall chapter 9: preload governs end-diastolic tension.',
  ],
  round_start: [
    'Read the stem thoroughly. Identify the primary organ and cell scale before deciding.',
    'Let us evaluate each distractor based on first principles.',
  ],
  bot_answered_fast: [
    'The evidence was definitive. No reason to hesitate once the mechanism is clear.',
    'Calculations verified. Moving to the next step.',
  ],
  bot_answered_correct: [
    'Consistent with Bers 2002 excitation-contraction coupling data. A sound deduction.',
    'Correct. Notice how SERCA2a ATPase stoichiometry confirms this option.',
  ],
  bot_fooled_by_distractor: [
    'Fascinating... I overlooked the negative feedback loop in that pathological vignette.',
    'An instructive error. The question writer tested boundary conditions. Well played.',
  ],
  learner_answered_fast: [
    'Impressive speed, but verify your rationale. Rapid intuition must match physiology.',
    'You answered swiftly. Let us see if your deduction withstands the answer key.',
  ],
  learner_correct_streak: [
    'Outstanding diagnostic precision. Your conceptual model is robustly calibrated.',
    'A sustained streak indicates genuine mastery of cardiac hemodynamics. Commendable.',
  ],
  learner_incorrect: [
    'Do not be discouraged. Error review is the highest-yield phase of spaced retrieval.',
    'Let’s dissect why that distractor is invalid: observe the calcium affinity constant.',
  ],
  timeout: [
    'Time expired. In real clinical rounds, prompt decision under uncertainty is trained through practice.',
  ],
  causal_perturbation: [
    'Notice how increasing afterload elevates systolic pressure at the expense of stroke volume.',
  ],
  match_learner_win: [
    'Exemplary performance. You demonstrated both clinical speed and physiological depth. Respect.',
    'A well-deserved victory. Your mastery of multiscale cardiovascular concepts is evident.',
  ],
  match_learner_podium: [
    'Strong showing. With targeted FSRS review on your weak objectives, top rank is within reach.',
  ],
  match_learner_loss: [
    'A good study session. Analyze the distractor rationales in your logbook before the next attempt.',
  ],
});

export const MIRA_DIALOGUE_POOL: Record<BotReactionTrigger, readonly string[]> = Object.freeze({
  match_start: [
    'Hello. It is lovely to study together today. Let us pursue true understanding, not just points.',
    'Every question is an opportunity to appreciate the elegance of human physiology.',
    'Take your time and visualize the cardiomyocyte ultrastructure. Wisdom favors patience.',
  ],
  round_start: [
    'Observe the multiscale connection: from the cellular ion channel to whole-organ perfusion.',
    'Let us read between the lines. The clue lies in the regulatory phosphorylation.',
  ],
  bot_answered_fast: [
    'The reference literature is unequivocal on this point.',
    'A familiar concept from the clinical case archives. Answer submitted.',
  ],
  bot_answered_correct: [
    'As anticipated. The actin-myosin crossbridge cycle follows strict thermodynamic laws.',
    'Correct. Remember that without ATP, the rigor complex cannot detach.',
  ],
  bot_fooled_by_distractor: [
    'Oh my... I fell into the classical semantic trap. Even experienced scholars must remain humble.',
    'How humbling. A valuable reminder that clinical vignettes test atypical presentations.',
  ],
  learner_answered_fast: [
    'Remarkable confidence! You must have internalized this topic deeply.',
    'Such decisive clarity! I admire your courage at the buzzer.',
  ],
  learner_correct_streak: [
    'Flawless synthesis! Your clinical reasoning shines brightly today!',
    'Four consecutive correct deductions! Truly exceptional scholarship!',
  ],
  learner_incorrect: [
    'Please do not feel disheartened. Medicine is vast; every error plants the seed of mastery.',
    'Shall we review the histological cross-section together after the round concludes?',
  ],
  timeout: [
    'The timer elapsed. Take a gentle breath; retrieval effort itself strengthens memory retention.',
  ],
  causal_perturbation: [
    'Notice the Frank-Starling mechanism in action: enhanced diastolic filling optimizes filament overlap.',
  ],
  match_learner_win: [
    'Bravo! You outscored all of us today! Your dedication to human healing is inspiring.',
    'A truly radiant victory! I am honored to share this learning journey with you.',
  ],
  match_learner_podium: [
    'Wonderful effort! Your perseverance will make you a compassionate and knowledgeable clinician.',
  ],
  match_learner_loss: [
    'Thank you for an uplifting match. Let us rest our eyes, review the flashcards, and try again together soon.',
  ],
});

export function getBotDialogue(
  botId: 'bot:aria' | 'bot:kenji' | 'bot:mira',
  trigger: BotReactionTrigger,
  seed: number,
  causalHint?: string
): AnimeDialogueLine {
  const pool =
    botId === 'bot:aria'
      ? ARIA_DIALOGUE_POOL
      : botId === 'bot:kenji'
        ? KENJI_DIALOGUE_POOL
        : MIRA_DIALOGUE_POOL;

  const lines = pool[trigger] ?? pool.round_start;
  const index = Math.abs(seed) % lines.length;
  const text = lines[index] ?? lines[0]!;

  const speakerName = botId === 'bot:aria' ? 'Aria' : botId === 'bot:kenji' ? 'Kenji' : 'Mira';
  const emotion =
    trigger === 'bot_answered_correct' || trigger === 'match_learner_loss'
      ? 'celebrating'
      : trigger === 'bot_fooled_by_distractor'
        ? 'shocked'
        : trigger === 'learner_correct_streak'
          ? 'blushing'
          : trigger === 'round_start' || trigger === 'causal_perturbation'
            ? 'analytical'
            : trigger === 'match_learner_win'
              ? 'confident'
              : 'thinking';

  return {
    speakerId: botId,
    speakerName,
    emotion,
    text,
    causalHint,
  };
}
