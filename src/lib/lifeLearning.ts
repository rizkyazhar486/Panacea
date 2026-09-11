export type WealthPillar = 'time' | 'health' | 'finance' | 'knowledge' | 'social' | 'family' | 'career'

export type LifeReading = {
  id: string
  pillar: WealthPillar
  title: string
  source: string
  minutes: number
  level: 'foundation' | 'applied' | 'deep-dive'
  summary: string
  body: string[]
  reflection: string
  action: string
  routes: string[]
}

export const WEALTH_PILLARS: Array<{
  id: WealthPillar
  label: string
  emoji: string
  thesis: string
}> = [
  { id: 'time', label: 'Time', emoji: '⏳', thesis: 'Protect attention, autonomy and usable years.' },
  { id: 'health', label: 'Health', emoji: '❤️', thesis: 'Preserve physical and cognitive capacity for the life you want.' },
  { id: 'finance', label: 'Finance', emoji: '💰', thesis: 'Build resilience and options without turning money into the only score.' },
  { id: 'knowledge', label: 'Knowledge', emoji: '🧠', thesis: 'Convert information into models, judgment and reusable skill.' },
  { id: 'social', label: 'Social', emoji: '🤝', thesis: 'Build belonging, reciprocity and reliable human connection.' },
  { id: 'family', label: 'Family', emoji: '🏡', thesis: 'Invest in presence, repair, care and intergenerational continuity.' },
  { id: 'career', label: 'Career', emoji: '🧭', thesis: 'Compound rare skills, responsibility, contribution and reputation.' },
]

export const LIFE_READING_LIBRARY: LifeReading[] = [
  {
    id: 'time-attention-budget', pillar: 'time', title: 'Your attention is a finite clinical resource', source: 'Panacea synthesis · attention & time design', minutes: 5, level: 'foundation',
    summary: 'A calendar measures occupied time; an attention budget measures how much high-quality cognition is actually available.',
    body: [
      'There are 168 hours in a week, but not 168 equally useful hours. Sleep, caregiving, commuting, recovery and cognitive fatigue change what an hour can realistically hold. Planning improves when you separate clock time from high-quality attention.',
      'A practical system protects a small number of high-value blocks, batches shallow work and deliberately leaves recovery margin. The goal is not maximum utilization. The goal is enough unfragmented time for the things that would be expensive to lose.',
    ],
    reflection: 'Which three recurring commitments consume the most attention without creating proportional value?',
    action: 'Protect one 45-minute block tomorrow.', routes: ['/life-compass', '/planning'],
  },
  {
    id: 'time-optionality', pillar: 'time', title: 'Time wealth is optionality, not idleness', source: 'Panacea synthesis · autonomy', minutes: 4, level: 'applied',
    summary: 'Free time is valuable when it can be redirected toward recovery, family, learning or opportunity.',
    body: [
      'Time wealth means having enough control over at least part of your schedule to respond to what matters. A person can be financially secure and still time-poor if every hour is pre-committed.',
      'Judge large purchases, jobs and habits partly by their time cost. A cheaper choice that creates hours of maintenance, commuting or stress may be more expensive than its price suggests.',
    ],
    reflection: 'What decision would you make differently if you priced one hour of your life explicitly?',
    action: 'Add a time-cost column to one decision.', routes: ['/life-compass', '/keuangan'],
  },
  {
    id: 'time-recovery-margin', pillar: 'time', title: 'Recovery margin prevents brittle schedules', source: 'Panacea synthesis · workload & recovery', minutes: 4, level: 'applied',
    summary: 'A schedule with zero slack works only when nothing unexpected happens.',
    body: [
      'Human systems are variable. Illness, traffic, family needs and hard days are not exceptions; they are part of real life. A plan that assumes perfect execution turns ordinary variability into repeated failure.',
      'Build margin the way safety-critical systems build redundancy: not everywhere, but around the commitments that matter most. A small buffer protects sleep, exercise, study and relationships from being the first things sacrificed.',
    ],
    reflection: 'Which important habit is always destroyed by small delays?',
    action: 'Add a 15-minute buffer before it.', routes: ['/planning'],
  },

  {
    id: 'health-capacity', pillar: 'health', title: 'Health is capacity, not a collection of normal numbers', source: 'Panacea synthesis · preventive physiology', minutes: 6, level: 'foundation',
    summary: 'Useful health is the ability to move, think, recover, participate and remain independent.',
    body: [
      'Measurements are useful when they change understanding or action. They become noise when a person collects numbers without knowing what question each number answers.',
      'A capacity-oriented view asks what the body can reliably do: tolerate activity, sleep and recover, maintain strength and balance, regulate symptoms and preserve cognition. Trends matter more than isolated snapshots.',
    ],
    reflection: 'Which health metric do you track, and what decision does it actually change?',
    action: 'Keep one metric only if it has a decision rule.', routes: ['/tubuh', '/readiness'],
  },
  {
    id: 'health-sleep-foundation', pillar: 'health', title: 'Sleep is infrastructure for the next day', source: 'Panacea synthesis · sleep physiology', minutes: 5, level: 'foundation',
    summary: 'Sleep changes cognition, recovery, appetite regulation and training response; it is not simply inactive time.',
    body: [
      'The useful question is rarely “Did I get a perfect score?” It is whether sleep opportunity, timing, continuity and daytime function are adequate for the person and their demands.',
      'Consistent wake time, enough sleep opportunity, morning light and reduced late-night stimulation are low-friction levers. Persistent insomnia, loud snoring with daytime sleepiness, or other concerning symptoms deserve proper assessment rather than endless self-optimization.',
    ],
    reflection: 'What is the single most controllable reason your sleep opportunity gets shortened?',
    action: 'Move that constraint 30 minutes earlier tonight.', routes: ['/sleep-pattern', '/sleep-toolkit'],
  },
  {
    id: 'health-strength-cardio', pillar: 'health', title: 'Strength and cardiorespiratory fitness protect different capacities', source: 'Panacea synthesis · exercise physiology', minutes: 6, level: 'applied',
    summary: 'Aerobic capacity, muscular strength, balance and mobility overlap but are not interchangeable.',
    body: [
      'A complete physical-capacity plan trains the systems a person wants to preserve. Walking alone may not provide enough resistance for strength; lifting alone may not build sufficient aerobic endurance.',
      'The sustainable program is the one whose dose can be repeated. Progression should be gradual and adapted to symptoms, injury history and baseline capacity rather than copied from an elite athlete.',
    ],
    reflection: 'Which physical capacity is missing from your current week?',
    action: 'Add one small session for the missing capacity.', routes: ['/workout', '/athlete'],
  },

  {
    id: 'finance-buffer', pillar: 'finance', title: 'A financial buffer buys decision quality', source: 'Panacea synthesis · personal finance', minutes: 5, level: 'foundation',
    summary: 'Liquidity is not exciting, but it can prevent urgent problems from forcing expensive decisions.',
    body: [
      'A buffer converts some unpredictable expenses from emergencies into inconveniences. Its value is partly psychological: more time to compare options, negotiate and avoid high-cost debt.',
      'The right size depends on income stability, dependents, insurance, essential expenses and access to support. The principle is more important than a universal number: avoid operating at zero margin.',
    ],
    reflection: 'How many weeks of essential expenses could you cover without new income?',
    action: 'Calculate essential monthly burn.', routes: ['/keuangan'],
  },
  {
    id: 'finance-avoid-ruin', pillar: 'finance', title: 'Avoiding ruin matters more than winning every bet', source: 'Risk-management synthesis', minutes: 5, level: 'applied',
    summary: 'Compounding only works if a person survives the bad periods.',
    body: [
      'High expected return does not rescue a strategy that can permanently destroy the capital, health or relationships required to continue. Concentration, leverage and illiquidity can turn ordinary volatility into irreversible loss.',
      'A robust plan asks not only “What can I gain?” but “What happens if this is wrong?” Diversification, insurance and position sizing are forms of humility, not pessimism.',
    ],
    reflection: 'Which part of your financial life has a failure mode you could not recover from?',
    action: 'Reduce one single-point-of-failure risk.', routes: ['/keuangan'],
  },
  {
    id: 'finance-time-horizon', pillar: 'finance', title: 'Match the asset to the time horizon', source: 'Investment-literacy synthesis', minutes: 5, level: 'deep-dive',
    summary: 'Money needed soon and money invested for decades should not be asked to tolerate the same risk.',
    body: [
      'Volatility is easier to tolerate when the goal is distant and the investor has adequate liquidity. Short-horizon obligations need reliability more than maximum expected return.',
      'Separate emergency liquidity, near-term goals and long-term investment capital before debating specific assets. Asset selection comes after the job of the money is clear.',
    ],
    reflection: 'Which future expense is currently mixed into long-term investment money?',
    action: 'Label funds by horizon: now, soon, later.', routes: ['/keuangan'],
  },

  {
    id: 'knowledge-retrieval', pillar: 'knowledge', title: 'Recognition is not recall', source: 'Learning-science synthesis', minutes: 5, level: 'foundation',
    summary: 'Information feels familiar when reread; durable learning improves when it has to be reconstructed.',
    body: [
      'Active retrieval exposes the gap between “I have seen this” and “I can produce it without help.” That gap is useful feedback, not failure.',
      'Short closed-book recall followed by immediate correction is often more informative than another pass through the same notes. Spacing the next attempt makes memory work again instead of relying on short-term familiarity.',
    ],
    reflection: 'What topic feels familiar but becomes difficult when the notes are closed?',
    action: 'Write five questions from memory before rereading.', routes: ['/med-study', '/learn'],
  },
  {
    id: 'knowledge-models', pillar: 'knowledge', title: 'Build models, not piles of facts', source: 'Panacea synthesis · reasoning', minutes: 6, level: 'applied',
    summary: 'A useful mental model explains relationships: what causes what, under which conditions, and what evidence could change the conclusion.',
    body: [
      'Facts become easier to retrieve when attached to mechanisms and contrasts. In medicine, anatomy links to physiology, physiology to pathology, pathology to observable findings and findings to decisions.',
      'When learning a new concept, ask for its inputs, outputs, constraints, failure modes and nearest confounders. This creates a reusable structure rather than a disconnected list.',
    ],
    reflection: 'Can you explain your current topic as a causal chain with one uncertainty at each step?',
    action: 'Open Knowledge Bridge and build one chain.', routes: ['/knowledge-bridge'],
  },
  {
    id: 'knowledge-calibration', pillar: 'knowledge', title: 'Confidence should track evidence quality', source: 'Evidence-literacy synthesis', minutes: 6, level: 'deep-dive',
    summary: 'Good judgment includes knowing how much confidence a conclusion deserves.',
    body: [
      'A mechanistic explanation, an observational association and a randomized comparison answer different questions. They should not be blended into one undifferentiated certainty score.',
      'Calibration improves when you state what the claim is, where it came from, what population it applies to, what alternatives exist and what new information would change your mind.',
    ],
    reflection: 'What important belief are you holding with more confidence than its evidence supports?',
    action: 'Write one disconfirming observation.', routes: ['/knowledge-bridge', '/med-study'],
  },

  {
    id: 'social-reliability', pillar: 'social', title: 'Reliability is social capital', source: 'Relationship-skills synthesis', minutes: 4, level: 'foundation',
    summary: 'Trust grows through repeated small evidence that words and actions match.',
    body: [
      'Relationships are shaped less by one dramatic gesture than by patterns: showing up, replying, remembering, repairing and being predictable when the other person is vulnerable.',
      'The same principle applies professionally. Competence earns attention; reliability earns repeated trust.',
    ],
    reflection: 'Who currently has to guess whether you will follow through?',
    action: 'Close one small open loop today.', routes: ['/community', '/my-story'],
  },
  {
    id: 'social-belonging', pillar: 'social', title: 'Belonging needs repeated contact', source: 'Social-health synthesis', minutes: 4, level: 'applied',
    summary: 'Community is usually built by recurrence, not by waiting for an ideal connection to appear.',
    body: [
      'Repeated low-pressure contact creates familiarity and gives relationships enough surface area to deepen. Clubs, classes, teams, volunteering and regular meals can work because they create recurrence by design.',
      'A social plan can therefore be operational: choose one place, one cadence and one contribution instead of setting the vague goal to “be more social.”',
    ],
    reflection: 'Where could you see the same people every week for the next three months?',
    action: 'Schedule one recurring social context.', routes: ['/community'],
  },
  {
    id: 'social-repair', pillar: 'social', title: 'Repair is a relationship skill', source: 'Conflict-repair synthesis', minutes: 5, level: 'deep-dive',
    summary: 'Strong relationships are not conflict-free; they have workable ways to recover after rupture.',
    body: [
      'Repair starts by describing the event without turning it into a verdict on the other person. Own the part you can own, state the impact, ask what you missed and agree on a specific next behavior.',
      'Not every relationship should be preserved, especially when safety is involved. But in healthy relationships, repair prevents small injuries from becoming permanent stories about the other person.',
    ],
    reflection: 'Is there a repair you are postponing because you want the perfect wording?',
    action: 'Send a simple request to talk.', routes: ['/community', '/my-story'],
  },

  {
    id: 'family-presence', pillar: 'family', title: 'Presence is a form of care', source: 'Family-systems synthesis', minutes: 4, level: 'foundation',
    summary: 'Care is partly what receives protected attention when competing demands are loud.',
    body: [
      'Family time can exist on the calendar while attention is elsewhere. Small rituals—shared meals, calls, walks, bedtime routines—work because they make presence repeatable.',
      'The goal is not constant availability. Boundaries protect both work and family by making it clearer when each has the person’s full attention.',
    ],
    reflection: 'Which family ritual would still matter ten years from now?',
    action: 'Protect the next occurrence of that ritual.', routes: ['/my-story', '/family-health'],
  },
  {
    id: 'family-care-load', pillar: 'family', title: 'Invisible care work still consumes capacity', source: 'Caregiving synthesis', minutes: 5, level: 'applied',
    summary: 'Planning fails when caregiving, coordination and emotional labor are treated as if they take no time.',
    body: [
      'Appointments, medication coordination, school logistics, elder care and emotional support are real work even when they are unpaid and fragmented.',
      'Make the load visible before trying to optimize it. Shared calendars, explicit ownership and backup plans can reduce the cognitive burden carried by one person.',
    ],
    reflection: 'Which recurring family task has an unclear owner?',
    action: 'Assign an owner and a backup.', routes: ['/family-health', '/planning'],
  },
  {
    id: 'family-legacy', pillar: 'family', title: 'Legacy is transmitted in ordinary behavior', source: 'Intergenerational-learning synthesis', minutes: 5, level: 'deep-dive',
    summary: 'Values are taught most convincingly by what a family repeatedly does, discusses and repairs.',
    body: [
      'A family story can preserve more than names and dates. It can record decisions, failures, lessons, health history, migration, sacrifice and the principles people want the next generation to understand.',
      'Legacy becomes usable when it contains context rather than mythology: what happened, what was difficult, what was learned and what the next person is free to choose differently.',
    ],
    reflection: 'What lesson from your family deserves to be preserved without being idealized?',
    action: 'Write one paragraph in Your Story.', routes: ['/my-story'],
  },

  {
    id: 'career-capital', pillar: 'career', title: 'Career capital compounds', source: 'Career-development synthesis', minutes: 5, level: 'foundation',
    summary: 'Rare useful skills, evidence of work and trust can accumulate across roles even when job titles change.',
    body: [
      'A career becomes more resilient when value is portable. Build skills that solve real problems, produce visible evidence of good work and develop relationships with people who have seen you deliver.',
      'Credentials can open doors, but repeated proof of competence and reliability determines which doors remain open.',
    ],
    reflection: 'Which capability would make you useful in several industries, not only your current role?',
    action: 'Create one small public artifact proving it.', routes: ['/planning'],
  },
  {
    id: 'career-option-value', pillar: 'career', title: 'Choose some moves for option value', source: 'Decision-strategy synthesis', minutes: 5, level: 'applied',
    summary: 'A good next step can be valuable because it creates several better next steps afterward.',
    body: [
      'Early in a career, learning rate, network quality and responsibility can be more valuable than optimizing only the first salary number. Later, autonomy and fit may dominate.',
      'Evaluate a role by what it teaches, who sees the work, what evidence you can produce and which future paths it preserves. This does not mean accepting exploitation; optionality is valuable only when basic needs and boundaries are protected.',
    ],
    reflection: 'Which current option creates the widest set of credible next options?',
    action: 'Score options on learning, proof, network and autonomy.', routes: ['/planning'],
  },
  {
    id: 'career-burnout-boundary', pillar: 'career', title: 'A career that consumes the person cannot compound forever', source: 'Work-design synthesis', minutes: 5, level: 'deep-dive',
    summary: 'Sustainable performance requires boundaries around workload, recovery and identity.',
    body: [
      'Periods of high demand may be worthwhile, but chronic overload narrows cognition, damages relationships and can make career decisions more reactive. The person doing the work is part of the production system.',
      'Track leading indicators such as sleep opportunity, irritability, loss of recovery time and inability to disengage. These are not a diagnosis; they are signals that work design may need adjustment.',
    ],
    reflection: 'What part of your work pattern would be impossible to sustain for five years?',
    action: 'Change one recurring boundary this week.', routes: ['/planning', '/readiness'],
  },
]

export function readingsForPillar(pillar: WealthPillar | 'all') {
  return pillar === 'all' ? LIFE_READING_LIBRARY : LIFE_READING_LIBRARY.filter((item) => item.pillar === pillar)
}
