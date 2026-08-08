// ─────────────────────────────────────────────────────────────────────────────
// Learn — English-language health education.
//
// Two rules govern everything in this file, and they exist because health
// content is where confident writing does the most damage.
//
// 1. EVERY CLAIM CARRIES ITS EVIDENCE TIER, and the tier is shown to the
//    reader rather than buried. "Exercise lowers mortality" and "cold plunges
//    build muscle" are not the same kind of statement, and a page that renders
//    them in identical type is lying by layout. Tiers here mean:
//
//      strong   — randomised trials with hard outcomes, or evidence so
//                 consistent across designs that reversal is implausible.
//      moderate — consistent observational data, or trials using surrogate
//                 endpoints (blood markers rather than events).
//      weak     — small, short, mechanistic, or animal work. Interesting;
//                 not a basis for changing your life.
//
// 2. WHAT WOULD CHANGE THE ANSWER IS STATED. Each topic ends with the
//    honest caveat — the confounder, the missing trial, the population it
//    was never tested in. Readers who know why a claim might be wrong make
//    better decisions than readers handed a clean number.
//
// No dosages, no supplement protocols, and no "optimal" anything. This teaches
// how the evidence sits; it does not practise medicine.
// ─────────────────────────────────────────────────────────────────────────────

export type Tier = 'strong' | 'moderate' | 'weak'

export interface Section {
  heading: string
  body: string
  tier: Tier
  /** What would overturn or qualify this. Always present — never optional. */
  caveat: string
}

export interface Topic {
  id: string
  title: string
  summary: string
  minutes: number
  icon: string
  sections: Section[]
  /** One sentence a reader can act on today. */
  takeaway: string
}

export const TIER_LABEL: Record<Tier, { label: string; blurb: string; color: string }> = {
  strong: {
    label: 'Strong evidence',
    blurb: 'Randomised trials with hard outcomes, or findings so consistent that reversal is implausible.',
    color: '#15803d',
  },
  moderate: {
    label: 'Moderate evidence',
    blurb: 'Consistent observational data, or trials measuring blood markers rather than actual events.',
    color: '#b45309',
  },
  weak: {
    label: 'Weak evidence',
    blurb: 'Small, short, mechanistic, or animal studies. Worth knowing, not worth reorganising your life around.',
    color: '#57616f',
  },
}

export const TOPICS: Topic[] = [
  {
    id: 'movement',
    title: 'Movement and mortality',
    summary: 'Why the first hour of weekly activity matters more than the tenth.',
    minutes: 6,
    icon: '🏃',
    takeaway: 'If you currently do nothing, the largest health return available to you is the walk you take tomorrow — not the training plan you start next month.',
    sections: [
      {
        heading: 'The curve is steepest at zero',
        tier: 'strong',
        body: 'Across large cohorts followed for decades, the relationship between physical activity and death from any cause is not a straight line. It falls sharply as people move from doing essentially nothing to doing a little, then flattens. Going from sedentary to roughly 90 minutes of brisk walking a week is associated with a substantially lower risk of dying in the follow-up period. Going from 300 minutes to 600 adds comparatively little. This shape matters more than any single number, because it tells you where effort is best spent: the person who does nothing has the most to gain, and needs to do the least to gain it.',
        caveat: 'These are observational cohorts. People who are already ill move less, which makes exercise look more protective than it is — an effect called reverse causation. Studies handle it by discarding early deaths, but cannot remove it entirely. The shape of the curve is robust; the exact percentages are not.',
      },
      {
        heading: 'Strength is not optional after 50',
        tier: 'strong',
        body: 'Muscle mass and strength decline from roughly the fourth decade, and the decline accelerates. This matters because grip strength and leg power predict future disability and death better than most blood tests. Resistance training reverses part of the loss at any age tested, including in people over 80 and in nursing-home residents. The trials are small but consistent, and the direction never flips.',
        caveat: 'Trials measure strength and walking speed, not lifespan — no one has randomised people to decades of lifting to see who dies later. The link from strength to survival is observational, so it is possible that strength is a marker of underlying health rather than a cause of it.',
      },
      {
        heading: 'Sitting is a smaller problem than it was sold as',
        tier: 'moderate',
        body: 'Prolonged sitting is associated with worse health outcomes, but much of that association weakens once total activity is taken into account. In pooled analyses, people who sat for long stretches but were otherwise active had risk close to that of people who sat less. The headline "sitting is the new smoking" was never supported by the size of the effect; smoking shortens life by around a decade, and sitting does not come close.',
        caveat: 'Self-reported sitting time is measured badly — people underestimate it consistently. Device-measured studies find somewhat stronger associations, so the true effect may be larger than questionnaire studies suggest.',
      },
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep, honestly',
    summary: 'What is well established, what is oversold, and why sleep trackers disagree with sleep labs.',
    minutes: 7,
    icon: '🌙',
    takeaway: 'Regular timing is better supported than any specific duration, and both are better supported than anything your wearable calls a "sleep score".',
    sections: [
      {
        heading: 'Short sleep tracks with worse outcomes',
        tier: 'moderate',
        body: 'People who habitually sleep less than about six hours have higher rates of cardiovascular disease, metabolic disease, and death. The association is consistent across many populations. Experimentally restricting sleep for days to weeks reliably worsens glucose handling, appetite regulation, blood pressure, and attention — so there is a plausible mechanism, not merely a correlation.',
        caveat: 'The long end is the puzzle. People sleeping over nine hours also show elevated risk, which is almost certainly illness causing long sleep rather than the reverse. That the same curve contains one causal arm and one non-causal arm should make you cautious about reading it too literally.',
      },
      {
        heading: 'Regularity may matter as much as duration',
        tier: 'moderate',
        body: 'Studies using wearable data have found that variability in sleep timing predicts mortality and cardiometabolic risk, in some analyses more strongly than sleep duration itself. Going to bed and waking at ranging times appears to carry cost even when the total hours are adequate. This is a relatively recent line of work, and it is convergent with decades of shift-work research showing that circadian disruption harms metabolic health.',
        caveat: 'Almost entirely observational, and irregular sleepers differ from regular sleepers in many ways — shift work, caregiving, insecure employment, alcohol. Regularity may be a marker of a stable life rather than an independent cause.',
      },
      {
        heading: 'Your tracker is not measuring sleep stages',
        tier: 'weak',
        body: 'Consumer wearables infer sleep from movement and heart rate. Against polysomnography — the laboratory standard, which reads brain activity — they are reasonably good at separating sleep from wake, and considerably worse at staging. Agreement for deep and REM sleep is often modest. Night-to-night numbers should be read as a rough trend, not as a measurement.',
        caveat: 'Validation studies use particular devices, firmware, and populations, and accuracy improves between generations. A specific current device may perform better than the published average — but no consumer device today has been shown to stage sleep with laboratory accuracy.',
      },
      {
        heading: 'Chasing the score can create the problem',
        tier: 'weak',
        body: 'Clinicians have described patients whose anxiety about sleep data worsened their sleep — sometimes called orthosomnia. The evidence is case series and small studies, so its frequency is unknown. It is raised here because it is the one sleep risk that reading this page could plausibly create.',
        caveat: 'Case reports cannot establish how common something is. Most people use sleep trackers without harm, and some are helped by noticing a real pattern.',
      },
    ],
  },
  {
    id: 'metabolic',
    title: 'Reading your own blood work',
    summary: 'Which numbers earn a decision, which are context, and why "normal range" is not the same as "healthy".',
    minutes: 8,
    icon: '🩸',
    takeaway: 'A single out-of-range value on one test is usually noise; a trend across several tests is information.',
    sections: [
      {
        heading: 'Reference ranges describe a population, not health',
        tier: 'strong',
        body: 'A laboratory reference range is usually set to contain the middle 95% of a reference population. Two consequences follow directly. First, one in twenty healthy people falls outside it on any given test by construction — order twenty tests and an out-of-range result is expected. Second, if the reference population is itself unhealthy, the range encodes that: "normal" reflects what is common, not what is good.',
        caveat: 'This argument is often stretched to justify ignoring ranges entirely, or to sell "optimal" ranges that have no outcome data behind them. Ranges are imperfect summaries, not arbitrary ones.',
      },
      {
        heading: 'ApoB and LDL: lowering causes lower risk',
        tier: 'strong',
        body: 'Randomised trials of drugs working through completely different mechanisms — statins, ezetimibe, PCSK9 inhibitors — all reduce cardiovascular events, and the size of the benefit tracks how far the atherogenic particle burden falls. Genetic studies point the same way. When separate designs with different biases converge, causation becomes hard to argue away. This is among the most secure findings in preventive medicine.',
        caveat: 'The trials show that lowering these particles in people at risk reduces events. They say far less about a low-risk 30-year-old with mildly raised numbers, where absolute benefit over any short period is small and long-term data do not exist.',
      },
      {
        heading: 'HbA1c is an average, and averages hide things',
        tier: 'moderate',
        body: 'HbA1c estimates average blood glucose over roughly three months, which makes it useful for diagnosis and tracking. Being an average, it conceals variability: two people with identical values can have very different glucose patterns. It is also distorted by anything altering red blood cell lifespan — anaemia, recent blood loss, some haemoglobin variants, pregnancy, kidney disease.',
        caveat: 'Continuous glucose monitors reveal the variability HbA1c hides, but in people without diabetes it remains unproven that acting on those swings improves any outcome. Seeing more is not the same as knowing more.',
      },
    ],
  },
  {
    id: 'strain-recovery',
    title: 'Strain and recovery',
    summary: 'What is actually being strained, what actually repairs it, and why the two run on different clocks.',
    minutes: 7,
    icon: '\u267b\ufe0f',
    takeaway: 'Training is the request; recovery is where the change is granted — so the useful question is never "was that hard enough?" but "can I absorb it?".',
    sections: [
      {
        heading: 'Adaptation happens after the session, not during it',
        tier: 'strong',
        body: 'A hard session temporarily makes you worse: force output drops, glycogen falls, muscle proteins are damaged, and the nervous system is less able to recruit motor units. Fitness is what remains once that is repaired. This is why two people doing identical training end up in different places — the difference is what happened in the hours between sessions, not in the sessions.',
        caveat: 'The tidy "supercompensation curve" drawn in textbooks is a teaching diagram, not a measured trajectory. Real recovery is messy, overlapping across systems, and its timing varies with age, sleep, and total life stress.',
      },
      {
        heading: 'Different tissues repair on very different clocks',
        tier: 'strong',
        body: 'Glycogen refills in roughly a day with adequate carbohydrate. Muscle protein remodels over two to three days. The nervous system can stay blunted for days after truly maximal work. Tendon, ligament, and bone adapt over weeks to months. Most overuse injury lives in that gap: muscle gets strong enough to load a tendon faster than the tendon can strengthen.',
        caveat: 'Those timelines come from group averages in controlled studies. Individual variation is wide, and no wearable can tell you where any specific tissue is in its cycle.',
      },
      {
        heading: 'Ramp rate matters more than any single hard day',
        tier: 'moderate',
        body: 'What precedes most overuse injury is not one brutal session but a rapid rise in load relative to what the body is used to. That is why the honest measure on a short history is how fast you are adding work, not how tired you feel today.',
        caveat: 'The acute:chronic ratio popularised for this has been criticised hard: its denominator rises with its numerator, so the ratio can look calm precisely when load is spiking, and the causal evidence is weak. Treat it as a speedometer, not a safety limit.',
      },
      {
        heading: 'HRV is a real signal wrapped in a lot of noise',
        tier: 'moderate',
        body: 'Heart-rate variability reflects autonomic balance and does drop with heavy training load, illness, alcohol, and poor sleep. Used as a rolling baseline over weeks, a sustained fall is worth acting on.',
        caveat: 'Night-to-night variation is large enough that any single reading is close to meaningless. Position, breathing, room temperature, and measurement window all shift it. Trends over weeks carry information; today versus yesterday mostly does not.',
      },
      {
        heading: 'Soreness is not a measure of anything useful',
        tier: 'moderate',
        body: 'Delayed-onset muscle soreness tracks novelty and eccentric loading far more than it tracks training quality. A new movement makes you sore; a well-judged session in a familiar movement often does not. Using soreness to grade your training rewards novelty and punishes consistency.',
        caveat: 'Soreness severe enough to limit movement, or accompanied by dark urine and swelling, is a different matter entirely and needs medical assessment — that is rhabdomyolysis, not training.',
      },
    ],
  },
  {
    id: 'fuelling',
    title: 'Fuelling recovery',
    summary: 'The three nutrition variables that decide whether training turns into adaptation — and the many that do not.',
    minutes: 7,
    icon: '\ud83c\udf7d\ufe0f',
    takeaway: 'Eat enough total energy, get enough protein across the day, and put carbohydrate near hard sessions — the rest is refinement worth a fraction as much.',
    sections: [
      {
        heading: 'Total energy is the variable most often got wrong',
        tier: 'strong',
        body: 'Training hard while eating too little produces the pattern once called the female athlete triad and now recognised in both sexes as relative energy deficiency: hormonal disruption, falling bone density, impaired repair, poor mood, and stalled performance. It is often mistaken for overtraining, because it looks identical from the outside.',
        caveat: 'The syndrome is well described, but the exact threshold of energy availability at which it begins is not settled and almost certainly differs between people.',
      },
      {
        heading: 'Protein: how much, and spread across the day',
        tier: 'strong',
        body: 'Muscle protein synthesis responds to protein intake in a dose-dependent way, and trials consistently show more retained and gained muscle at intakes well above the minimum required to avoid deficiency. Spreading it across three or four meals raises the daily total response compared with one large serving.',
        caveat: 'The benefit plateaus — beyond a certain intake, extra protein is used for energy rather than tissue. This page gives no numbers on purpose: the right amount depends on your body mass, training, and kidney health, which is a conversation with a clinician or dietitian.',
      },
      {
        heading: 'Carbohydrate is what makes hard sessions repeatable',
        tier: 'strong',
        body: 'Glycogen is the fuel for high intensity. Starting a hard session depleted lowers the work you can do, raises perceived effort, and blunts the training stimulus you were trying to create. This is the clearest case in nutrition where timing genuinely matters — near hard sessions, not throughout the day.',
        caveat: 'For easy aerobic work the picture is different and deliberately training with lower availability has some support for mitochondrial adaptation. That is a targeted tactic for trained athletes, not a general rule, and it makes hard days worse.',
      },
      {
        heading: 'The anabolic window is much wider than it was sold as',
        tier: 'moderate',
        body: 'The idea that protein must be eaten within thirty minutes of finishing does not survive controlled testing. Across a day, total intake dominates. What matters far more is that you eat enough, not that you eat fast.',
        caveat: 'Timing does regain importance when sessions are close together — two sessions in one day, or a competition schedule. There the constraint is glycogen, not protein.',
      },
      {
        heading: 'Alcohol is the most reliably harmful thing on this list',
        tier: 'moderate',
        body: 'Alcohol after training impairs muscle protein synthesis, worsens glycogen resynthesis, fragments sleep architecture, and suppresses heart-rate variability overnight. Of everything people worry about in recovery nutrition, this is the one with the clearest and largest effect.',
        caveat: 'Most studies use fairly high doses in small samples. The direction is consistent; the size of the effect from a single small drink is much less certain.',
      },
      {
        heading: 'Supplements: a very short honest list',
        tier: 'weak',
        body: 'Creatine monohydrate and caffeine have the strongest and most replicated evidence of anything sold for training. Almost everything else marketed for recovery — most antioxidant blends, most proprietary formulas — has evidence that is thin, short, or industry-funded. Some antioxidant supplementation may even blunt the adaptation you trained for.',
        caveat: 'No doses appear here on purpose. Supplements interact with medication and with kidney and liver conditions, and this page cannot know yours.',
      },
    ],
  },
  {
    id: 'sleep-dimensions',
    title: 'Sleep has five dimensions, not one',
    summary: 'Duration, quality, regularity, timing, and continuity — and which of them your tracker cannot see.',
    minutes: 6,
    icon: '\u23f0',
    takeaway: 'Fix regularity and timing first: they cost nothing, they are the most measurable, and they carry the evidence that a "sleep score" does not.',
    sections: [
      {
        heading: 'Duration and continuity are different things',
        tier: 'moderate',
        body: 'Eight hours in bed broken into six fragments is not eight hours of sleep. Continuity — how few times you surface — affects how restorative a night is independently of its total length. Someone reporting adequate hours who still wakes unrefreshed is usually describing a continuity problem, not a duration one.',
        caveat: 'Consumer devices detect wake far less reliably than they detect sleep, so the fragmentation they report is the least trustworthy number they produce.',
      },
      {
        heading: 'Timing: your body has an opinion about when',
        tier: 'moderate',
        body: 'The same seven hours taken at different clock times are not equivalent. Sleeping against your circadian phase — the pattern of sleeping late on free days and early on work days, sometimes called social jet lag — is associated with worse metabolic markers even when total sleep is adequate. Shift-work research points the same way, and it is the strongest evidence in this whole area.',
        caveat: 'Chronotype is partly genetic and only partly movable. Advice to "just go to bed earlier" ignores that a late chronotype forced early simply loses sleep rather than shifting it.',
      },
      {
        heading: 'Regularity may beat duration',
        tier: 'moderate',
        body: 'In large wearable datasets, variability in sleep timing predicts mortality and cardiometabolic risk — in some analyses more strongly than how long people sleep. A consistent, slightly short schedule appears to beat an erratic, adequate one.',
        caveat: 'Almost entirely observational. Irregular sleepers differ from regular sleepers in many ways — shift work, caregiving, insecure work, alcohol — so regularity may be a marker of a stable life rather than a cause of health.',
      },
      {
        heading: 'What sleep loss does to training specifically',
        tier: 'moderate',
        body: 'Restricted sleep raises perceived effort at the same power output, reduces time to exhaustion, impairs glucose handling, increases appetite, and slows reaction time. Maximal strength for a single effort is surprisingly resistant; everything involving repetition, judgement, and skill is not.',
        caveat: 'Most of this comes from short, severe restriction protocols in young adults. How it maps onto chronic mild restriction in ordinary life is inferred rather than demonstrated.',
      },
      {
        heading: 'Quality is the dimension least visible to a wearable',
        tier: 'weak',
        body: 'Devices infer sleep from movement and heart rate. They separate sleep from wake reasonably well and stage it considerably less well; agreement with laboratory recording for deep and REM sleep is often modest. Treat staged percentages as a rough trend, never as a measurement.',
        caveat: 'Accuracy differs by device and improves between generations, so a particular model may do better than the published average. None of them currently stage sleep to laboratory accuracy.',
      },
    ],
  },
  {
    id: 'mental-load',
    title: 'Mental state is part of the load',
    summary: 'Why the same session costs more in a hard week, and what that means for how you plan.',
    minutes: 6,
    icon: '\ud83e\udde0',
    takeaway: 'Your body does not keep separate accounts for training stress and life stress — so plan training against the week you are actually having.',
    sections: [
      {
        heading: 'Life stress changes how you recover from training',
        tier: 'moderate',
        body: 'Studies in athletes and students find that periods of high psychological stress are followed by slower recovery of strength and higher perceived soreness after identical training. Injury rates also rise during high-stress periods. The practical reading is direct: an exam week or a family crisis is a reason to lower training load, not a reason to prove something.',
        caveat: 'Sample sizes are modest and self-reported stress is a blunt instrument. The direction is consistent across studies; the magnitude is not well established.',
      },
      {
        heading: 'Mental fatigue makes the same effort feel harder',
        tier: 'moderate',
        body: 'Prolonged demanding cognitive work before exercise raises perceived exertion and shortens time to exhaustion, while leaving maximal strength and cardiovascular measures largely unchanged. The cost appears to be in how effort is perceived and tolerated rather than in what the muscle can produce.',
        caveat: 'The classic protocols use long, artificially tedious computer tasks. Whether an ordinary hard day at work produces the same effect is plausible but not directly demonstrated.',
      },
      {
        heading: 'Perceived effort is a real measurement, and it drifts',
        tier: 'strong',
        body: 'Rating of perceived exertion tracks physiological strain closely enough to prescribe and monitor training with, which is why it survives in sports science despite being subjective. It is also the fastest early indicator that recovery is falling behind: the same pace starts feeling harder before any objective marker moves.',
        caveat: 'It is systematically distorted by sleep loss, mental fatigue, caffeine, music, and expectation. That is a feature when you are watching for overload, and a problem when you are trying to hit an exact intensity.',
      },
      {
        heading: 'Motivation loss is a symptom, not a character flaw',
        tier: 'moderate',
        body: 'Persistent low mood, irritability, and loss of drive are among the earliest recognised features of non-functional overreaching — often appearing before performance drops. Treating that as laziness and adding more training is precisely the wrong response, and it is the usual one.',
        caveat: 'These symptoms overlap almost completely with depression, thyroid disease, anaemia, and iron deficiency. Assuming it is training when it is not delays treatment, so persistent symptoms deserve medical assessment rather than a deload.',
      },
      {
        heading: 'What actually helps, ranked by how well it is supported',
        tier: 'weak',
        body: 'Sleep and adequate energy intake carry by far the strongest evidence for recovery. Relaxation and breathing practices have modest support for lowering perceived stress and improving sleep onset. Massage, cold plunge, compression, and similar modalities mostly improve how you feel rather than measurably restoring performance, and cold immersion soon after resistance training may blunt hypertrophy.',
        caveat: 'Feeling better is not nothing — it changes whether you turn up tomorrow. The honest framing is that these are comfort tools with real adherence value, not repair tools.',
      },
    ],
  },
  {
    id: 'longevity-claims',
    title: 'How to judge a longevity claim',
    summary: 'A method you can apply to any headline, supplement, or clinic offer — including the ones this app might one day make.',
    minutes: 6,
    icon: '🔍',
    takeaway: 'Ask what the study measured, in whom, for how long, against what — before asking whether the result was impressive.',
    sections: [
      {
        heading: 'Ask what was actually measured',
        tier: 'strong',
        body: 'Most longevity research measures a surrogate: a blood marker, a cell in a dish, a lifespan in a mouse. Surrogates are cheap and fast, and they fail regularly. Drugs have raised HDL cholesterol without preventing heart attacks; drugs have suppressed abnormal heart rhythms while increasing deaths. A finding about a marker is a hypothesis about health, not a demonstration of it.',
        caveat: 'Surrogates are not worthless — LDL lowering was validated precisely because trials followed it through to events. The lesson is that the validation step is required, not that markers should be ignored.',
      },
      {
        heading: 'Ask in whom, and for how long',
        tier: 'strong',
        body: 'Effects found in one group frequently shrink or vanish in another. A result in young men may not transfer to postmenopausal women; a result in people with disease may not transfer to healthy people. Duration matters just as much: an eight-week trial cannot answer a question about ageing, whatever the press release implies.',
        caveat: 'Demanding perfect population match paralyses decisions. Careful extrapolation is legitimate — it just has to be labelled as extrapolation rather than presented as evidence.',
      },
      {
        heading: 'Ask what it was compared against',
        tier: 'moderate',
        body: 'Comparison decides meaning. Against nothing at all, almost anything looks good, because expectation alone shifts symptoms. Against the current best treatment, most things look ordinary. When you see a claimed improvement, find the control arm first; if there was none, the number tells you very little.',
        caveat: 'For some questions a placebo arm is impossible or unethical — you cannot blind someone to whether they are exercising. There, well-conducted observational work is the best evidence available, and dismissing it for lacking randomisation is its own error.',
      },
      {
        heading: 'Notice who benefits from you believing it',
        tier: 'weak',
        body: 'Funding and commercial interest are associated with more favourable published results. This is a reason to read a study more carefully, not to discard it — industry funds most of the trials that exist, including the ones that changed medicine for the better.',
        caveat: 'Treating funding as proof of dishonesty is a way to avoid reading the methods. The methods are what actually determine whether a result stands.',
      },
    ],
  },
]

export function topicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id)
}
