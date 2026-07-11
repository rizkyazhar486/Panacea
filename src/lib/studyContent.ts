// Content library for the Med Study Hub — motivation, OSCE station technique,
// evidence-based study methods, and exam-day strategy for OSCE / UKMPPD / koas
// / PPDS candidates. Written as original guidance (not copied from any exam
// body). Where a claim leans on learning-science evidence (spaced repetition,
// retrieval practice), that's grounded in well-replicated cognitive-psychology
// findings (Ebbinghaus; Roediger & Karpicke 2006; Cepeda et al. 2006), cited
// so nothing reads as an unqualified assertion.

export interface StudyTechnique {
  emoji: string
  title: string
  how: string
  why: string
}

// The highest-leverage, evidence-backed learning methods for high-volume
// medical exams — ordered roughly by effect size in the literature.
export const STUDY_TECHNIQUES: StudyTechnique[] = [
  {
    emoji: '🔁',
    title: 'Active Recall (Retrieval Practice)',
    how: 'Close the book and force yourself to reproduce the answer from memory — flashcards, blank-paper brain-dumps, or answering questions before reading the explanation. Re-reading and highlighting feel productive but are among the weakest methods.',
    why: 'The act of retrieving a memory strengthens it far more than re-exposure. Roediger & Karpicke (2006) showed testing beat re-studying on delayed recall by a large margin, even though re-reading felt easier at the time.',
  },
  {
    emoji: '📅',
    title: 'Spaced Repetition',
    how: 'Revisit material at expanding intervals (1 day → 3 days → 1 week → 3 weeks) rather than cramming it all at once. Anki, or a simple Leitner box, automates the schedule.',
    why: 'Memory decays along a forgetting curve (Ebbinghaus). Reviewing just as you are about to forget resets the curve at a shallower slope; distributed practice reliably beats massed practice (Cepeda et al. 2006 meta-analysis).',
  },
  {
    emoji: '🧩',
    title: 'Interleaving',
    how: 'Mix question types and topics within a session (a cardio case, then endocrine, then a pharmacology stem) instead of doing 50 cardiology questions in a row.',
    why: 'Interleaving forces your brain to first identify which concept applies — the exact skill a clinical vignette tests — rather than mechanically applying a known method. It slows practice but improves transfer to novel problems.',
  },
  {
    emoji: '🩺',
    title: 'Learn From Cases, Not Lists',
    how: 'Anchor facts to a patient: "a 32-year-old woman with palpitations, weight loss, and a diffuse goiter" instead of a bare list of hyperthyroidism features. Build an illness script for each diagnosis (typical patient, timing, key discriminators).',
    why: 'Board and UKMPPD questions are vignette-based. Knowledge organized as illness scripts is retrieved faster and is more resistant to distractor options than isolated facts.',
  },
  {
    emoji: '❓',
    title: 'Question-Bank First',
    how: 'Do questions from day one, not only at the end. Treat every wrong answer as a lead: read the full explanation, note the concept, and make a card for it. Track your weak systems.',
    why: 'Questions are retrieval practice plus format familiarity plus gap-finding in one. Doing them early exposes what you do not know while there is still time to fix it.',
  },
  {
    emoji: '🗣️',
    title: 'Teach It (The Feynman Technique)',
    how: 'Explain a topic out loud, in plain language, as if to a junior student or a patient. Where you stumble or reach for jargon is exactly where your understanding is thin — go back and close that gap.',
    why: 'Generating an explanation is a demanding retrieval + reorganization task. It surfaces illusions of competence that silent re-reading hides, and rehearses the exact skill an OSCE examiner scores.',
  },
  {
    emoji: '😴',
    title: 'Protect Sleep & Consolidation',
    how: 'Do not trade sleep for extra hours the night before — especially not before an OSCE. Study in focused blocks (e.g. 50 min on / 10 min off) rather than marathon sessions.',
    why: 'Memory consolidation happens during sleep; a sleep-deprived brain both encodes and retrieves worse. The marginal facts gained by an all-nighter rarely offset the performance drop across an entire exam.',
  },
]

export interface OsceTip {
  station: string
  emoji: string
  points: string[]
}

// OSCE is a performance exam — marks are for observable behaviours, so the
// technique is as scoreable as the knowledge. These are the transferable
// behaviours examiners reward across almost every station.
export const OSCE_TECHNIQUE: OsceTip[] = [
  {
    station: 'Opening every station (universal)',
    emoji: '🚪',
    points: [
      'Wash/gel hands before touching the patient — visible hand hygiene is a free mark on almost every station.',
      'Introduce yourself with name and role, confirm the patient\'s name and date of birth, and get consent before you start.',
      'Read the station instructions twice — the task ("take a focused history of the chest pain") is not the same as "take a full history"; do exactly what is asked.',
      'Watch the clock. Most stations are 5–8 minutes; budget time so you always reach closure and safety-netting.',
    ],
  },
  {
    station: 'History-taking stations',
    emoji: '💬',
    points: [
      'Open-ended first ("Tell me what brought you in today"), then focus. Let the patient talk for the first 30–60 seconds without interrupting.',
      'Use a structure so you miss nothing: presenting complaint → SOCRATES for pain → associated symptoms/red flags → past medical, drugs, allergies, family, social → ICE.',
      'Explicitly ask ICE — Ideas, Concerns, Expectations. "What do you think might be causing this? Is there anything you are particularly worried about?" These are almost always on the mark sheet.',
      'Summarise back to the patient before you finish ("So to make sure I have understood…") — it scores communication marks and catches errors.',
    ],
  },
  {
    station: 'Physical examination stations',
    emoji: '🔬',
    points: [
      'Expose adequately but preserve dignity — position, drape, and ask permission before each new step.',
      'Narrate as you go ("I am now feeling for the apex beat") so the examiner can score what you are doing, and always compare both sides.',
      'Follow the classic sequence — inspection → palpation → percussion → auscultation — and offer to complete relevant adjacent exams at the end.',
      'Finish by thanking the patient, covering them up, and stating what you would do next ("I would check observations and request an ECG").',
    ],
  },
  {
    station: 'Procedure / skills stations',
    emoji: '🧤',
    points: [
      'Verbalise the safety checklist: check the equipment, sharps bin ready, aseptic non-touch technique, patient identity and consent.',
      'State indication and contraindications out loud before you begin the procedure.',
      'Dispose of sharps immediately and never re-sheath — safety behaviours are directly marked.',
      'Document and hand over: what you did, how the patient tolerated it, and any follow-up needed.',
    ],
  },
  {
    station: 'Communication & counselling stations',
    emoji: '🤝',
    points: [
      'Chunk-and-check: give information in small pieces and check understanding after each, rather than one long monologue.',
      'Avoid jargon — "high blood pressure" not "hypertension"; explain the "why" in everyday terms.',
      'For breaking bad news, use a framework (e.g. SPIKES): set up, check what they know, get an invitation, give the knowledge, respond to emotion, summarise and plan.',
      'Always safety-net and signpost follow-up: "If X happens, come back or call this number." Leave time to ask "What questions do you have?"',
    ],
  },
  {
    station: 'If you blank or run out of time',
    emoji: '🧯',
    points: [
      'Say your structure out loud — even naming the framework ("I would like to take a SOCRATES pain history") can trigger recall and shows the examiner your approach.',
      'Do not fabricate findings. If you did not examine something, say you would examine it — inventing a normal finding can be an automatic fail on safety.',
      'A calm, safe, incomplete station beats a rushed, unsafe complete one. Prioritise the safety-critical steps.',
      'When the bell goes, stop cleanly and thank the patient — a composed exit reads better than scrambling.',
    ],
  },
]

export interface MotivationCard {
  quote: string
  context: string
}

// Rotating encouragement aimed specifically at the grind of koas, UKMPPD/OSCE,
// and PPDS — acknowledging the difficulty honestly rather than empty hype.
export const MOTIVATION: MotivationCard[] = [
  { quote: 'You do not have to be brilliant on any single day — you have to be consistent across many. The exam rewards the person who kept showing up.', context: 'On consistency over intensity' },
  { quote: 'Every wrong practice question now is a mark you will not lose on the real day. Get them wrong here, on purpose, where it is free.', context: 'On reframing mistakes' },
  { quote: 'The feeling of "I will never remember all of this" is universal among people who go on to pass. It is a sign of the volume, not of your ability.', context: 'On impostor feelings during koas' },
  { quote: 'OSCE is not a memory test, it is a behaviour test. Wash your hands, introduce yourself, be kind and structured — you already know how to be a safe doctor.', context: 'Before an OSCE' },
  { quote: 'PPDS and residency are marathons run at sprint pace. Protect your sleep, your meals, and one relationship — those are not luxuries, they are what keeps you standing.', context: 'For residents (PPDS)' },
  { quote: 'Comparison is the thief of study time. Your only useful benchmark is your own last mock score.', context: 'On not comparing yourself' },
  { quote: 'The night before, you are not learning new material — you are protecting the calm that lets you access what you already know. Close the book earlier than feels comfortable.', context: 'The night before' },
  { quote: 'Burnout is not weakness; it is a signal that the pace is unsustainable, not that you are. Rest is part of the plan, not a failure of it.', context: 'On burnout' },
]

export interface ExamPrepItem {
  title: string
  body: string
}

// A concrete countdown plan and exam-day checklist — the operational layer
// people forget when they focus only on content.
export const EXAM_TIMELINE: ExamPrepItem[] = [
  { title: '8–12 weeks out', body: 'Map the blueprint. List every system/topic and rate your confidence 1–5. Build a spaced-repetition deck and start daily questions across all systems (interleaved), even the ones you have not "finished" reading.' },
  { title: '4–6 weeks out', body: 'Shift weight toward your weakest systems from your question-bank analytics. Start timed blocks to build pacing. For OSCE, begin practising stations out loud with a partner — history, exam, and counselling.' },
  { title: '2 weeks out', body: 'Full-length timed mock(s) under real conditions. Review every mock question, right and wrong. For OSCE, rehearse the universal opening (hygiene, intro, consent, ICE) until it is automatic.' },
  { title: 'Final 3 days', body: 'Taper. Light review of your own error notes and high-yield summaries only — no new resources. Fix your sleep schedule to match exam-day timing. Prepare logistics: route, ID, documents, clothes.' },
  { title: 'Exam morning', body: 'Eat a real breakfast, arrive early, and avoid last-minute panic-cramming with peers outside the hall — it raises anxiety and rarely adds marks. Trust the months of work; your job now is to stay calm and read each question carefully.' },
]
