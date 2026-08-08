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
