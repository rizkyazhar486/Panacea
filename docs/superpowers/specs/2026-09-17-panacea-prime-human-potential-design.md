# PANACEA PRIME — Human Potential & Life Trajectory Engine

Date: 2026-09-17
Status: Design for review
Scope: Cross-product longitudinal orchestration layer

## 1. Product intent

PANACEA PRIME helps a user progressively become a stronger, healthier, more capable, more connected, and more purposeful version of themselves without reducing human flourishing to productivity, wealth, status, or a single score.

PRIME is not a separate motivational-content page. It is a shared longitudinal orchestration layer that continuously answers one practical question:

> What is the most important constraint on the user's next stage of growth, and what is the smallest meaningful action or recovery choice that improves it?

PRIME coordinates with existing Panaceamed systems:

- **Your Body** exposes physiological and performance state.
- **Clinical** protects health, evidence quality, and care boundaries.
- **For You** surfaces personal goals, relationships, finance, community, faith/worldview, and daily action.
- **AI-EMR / longitudinal state** preserves durable history and provenance.
- **AI Chatbot / agent** orchestrates interaction and explanation.
- **PANACEA EDGE** supplies calibrated courage and meaningful challenge when action avoidance is the bottleneck.
- **Deep Human Lab** provides research/education about mechanisms and human-scale explanatory models.

The product objective is not to keep users inside Panaceamed. Success means the user becomes better at living outside it.

## 2. Definition of "prime"

PRIME must not imply one culturally universal definition of success.

A user may define a prime life around some combination of:

- physical health and functional capacity;
- emotional stability and psychological flexibility;
- mastery and learning;
- professional or creative excellence;
- financial resilience and ownership;
- autonomy and agency;
- intimate relationships and family;
- friendship, community, and belonging;
- service and contribution;
- spirituality or worldview;
- stewardship and legacy.

The user chooses importance. Panaceamed may reveal trade-offs, constraints, or inconsistencies, but it must not silently replace the user's values with the model's values.

PRIME therefore treats "peak" as a dynamic state of alignment and capacity, not permanent maximum output.

## 3. Core philosophy

### 3.1 Growth loop

```text
OBSERVE
  -> FIND BOTTLENECK
  -> SELECT NEXT EDGE OR RECOVERY NEED
  -> ACT
  -> RECOVER
  -> ADAPT
  -> REASSESS
```

### 3.2 Long-horizon model

```text
potential
 -> action
 -> adaptation
 -> capability
 -> responsibility
 -> contribution
 -> stewardship
```

### 3.3 Prime is sustainable

PRIME must explicitly reject the idea that continuous maximal stress equals excellence.

A useful conceptual relationship is:

```text
adaptation ~= appropriate stress + sufficient recovery
```

while persistent load without recovery increases risk of breakdown, injury, burnout, impaired judgment, or relationship loss.

This relationship is educational, not a patient-specific clinical formula.

## 4. Seven PRIME trajectories

PRIME maintains seven user-configurable domains. Domains are distinct but interdependent.

### 4.1 Body

Includes:

- aerobic capacity;
- strength;
- mobility;
- sleep;
- recovery;
- nutrition;
- functional capacity;
- metabolic/cardiovascular context;
- illness/injury constraints where known.

### 4.2 Mind

Includes:

- attention stability;
- learning;
- emotional regulation;
- psychological flexibility;
- stress management;
- curiosity;
- recovery from cognitive overload.

### 4.3 Craft

Includes:

- skill;
- expertise;
- career capital;
- creative output;
- execution;
- leadership;
- intellectual contribution.

### 4.4 Agency

Includes:

- autonomy;
- courage;
- decision-making;
- action under uncertainty;
- ability to initiate difficult but constructive behavior;
- ability to change direction when evidence changes.

EDGE is the primary action/challenge subsystem for this domain.

### 4.5 Relationships

Includes:

- intimate partnership;
- family;
- friendship;
- companionship;
- trust;
- reciprocity;
- social integration;
- community belonging.

PRIME must never score people themselves or rank relationships as objects.

### 4.6 Resources

Includes:

- financial resilience;
- runway;
- debt burden;
- savings;
- ownership;
- optionality;
- capability to support family, projects, or community;
- long-term stewardship.

PRIME is not an investment adviser and must not convert resource goals into speculative trading or ruin-risk prompts.

### 4.7 Meaning

Includes:

- values;
- purpose;
- contribution;
- service;
- mortality awareness;
- spirituality or worldview if selected;
- legacy and stewardship.

Meaning is not reducible to neurotransmitters, productivity, income, or popularity.

## 5. Architecture

```text
                 User-defined values / goals
                           |
                           v
                  +------------------+
                  | PRIME Intent Map |
                  +--------+---------+
                           |
           +---------------+----------------+
           |                                |
           v                                v
+----------------------+        +--------------------------+
| Longitudinal State   |        | Optional Context Sources |
| health / behavior /  |        | wearable / calendar /    |
| relationships / work |        | finance / environment    |
+----------+-----------+        +-------------+------------+
           |                                  |
           +----------------+-----------------+
                            v
                +-----------------------+
                | Constraint Detector   |
                +-----------+-----------+
                            |
                +-----------+------------+
                |                        |
                v                        v
       +----------------+       +-------------------+
       | EDGE Challenge |       | Recovery / Protect|
       | pathway        |       | pathway           |
       +--------+-------+       +---------+---------+
                |                         |
                +------------+------------+
                             v
                   +--------------------+
                   | Action Orchestrator|
                   +---------+----------+
                             |
                             v
                      Real-world action
                             |
                             v
                   +--------------------+
                   | Outcome + Learning |
                   +---------+----------+
                             |
                             v
               Future Self / Prime trajectory
```

PRIME should not duplicate feature logic owned by other subsystems. It coordinates them.

## 6. Domain model

### 6.1 PrimeDomain

```ts
type PrimeDomain =
  | 'body'
  | 'mind'
  | 'craft'
  | 'agency'
  | 'relationships'
  | 'resources'
  | 'meaning';
```

### 6.2 PrimeIntent

```ts
interface PrimeIntent {
  id: string;
  domain: PrimeDomain;
  label: string;
  importance: number;          // 0..1 chosen by user
  horizon: 'today' | '90d' | '1y' | '5y' | '20y' | 'lifetime';
  desiredDirection: 'increase' | 'maintain' | 'protect' | 'explore';
  source: 'user' | 'clinician' | 'care_plan';
  createdAt: string;
  updatedAt: string;
}
```

Model-generated inferred intents are not silently converted into user intents.

### 6.3 PrimeSignal

```ts
type PrimeSignalSource =
  | 'measured'
  | 'self_reported'
  | 'derived'
  | 'recorded'
  | 'simulated'
  | 'reference';

interface PrimeSignal {
  id: string;
  domain: PrimeDomain;
  key: string;
  value: number | string | boolean;
  unit?: string;
  source: PrimeSignalSource;
  confidence?: number;
  observedAt: string;
  staleAfter?: string;
  provenance: string;
}
```

### 6.4 PrimeConstraint

```ts
interface PrimeConstraint {
  id: string;
  domain: PrimeDomain;
  class:
    | 'capacity'
    | 'recovery'
    | 'knowledge'
    | 'execution'
    | 'avoidance'
    | 'environment'
    | 'resource'
    | 'relationship'
    | 'clinical'
    | 'uncertain';
  severity: number;            // product heuristic 0..1
  confidence: number;          // 0..1
  evidenceIds: string[];
  explanation: string;
  detectedAt: string;
}
```

Constraint labels must remain explanatory product states, not diagnoses.

### 6.5 PrimeAction

```ts
interface PrimeAction {
  id: string;
  domain: PrimeDomain;
  constraintId?: string;
  type:
    | 'edge_mission'
    | 'recovery'
    | 'routine'
    | 'learning'
    | 'relationship'
    | 'planning'
    | 'clinical_followup'
    | 'reflection';
  title: string;
  expectedMinutes?: number;
  reversible: boolean;
  requiresConsent: boolean;
  provenance: string;
  status: 'proposed' | 'accepted' | 'completed' | 'declined' | 'deferred';
}
```

## 7. Constraint Detector

PRIME's central intelligence is not a global score. It is a ranked set of explainable constraints.

Examples:

- body capacity is improving, but recovery is declining;
- career knowledge is adequate, but execution consistency is low;
- work output is high, but relationship investment has collapsed;
- exercise load is high while sleep is falling;
- financial ambition is high, but emergency runway is absent;
- user-selected community contribution is important but receives almost no time;
- user reports strong intention but repeatedly avoids one specific action class.

A simplified internal ranking heuristic may be:

```text
constraint_priority =
    importance
  * estimated_impact
  * confidence
  * addressability
  * urgency_modifier
```

This is a product heuristic and must be labeled as such internally.

Clinical urgency is not inferred through this formula. Existing clinical/safety pathways take precedence.

## 8. The Adaptive Human Frontier

PRIME should visualize the user's demonstrated frontier rather than compare the user primarily with population prestige rankings.

The surface answers:

> Where has this person accumulated real capability, and where is the next reachable frontier?

Each domain can show:

- current demonstrated capacity;
- recent trajectory;
- confidence/provenance;
- next reachable frontier;
- protecting constraint;
- optional next action.

The visual should resemble a sparse, living field rather than a seven-card dashboard.

No domain must be maximized.

A narrow profile can be successful if it matches the user's values and remains sustainable.

## 9. Prime Window

PRIME may estimate short periods of high capacity for specific categories of activity.

Example conceptual factors:

```text
prime_window = f(
  recovery,
  energy,
  sleep,
  recent load,
  focus,
  self_reported motivation,
  available time,
  environment,
  clinical constraints
)
```

This is not a validated clinical probability and must never be displayed as one.

Initial user-facing states should be categorical and explainable:

- `HIGH CAPACITY WINDOW`
- `STEADY WINDOW`
- `RECOVERY WINDOW`
- `INSUFFICIENT DATA`

Example actions:

```text
HIGH CAPACITY WINDOW
Best fit · difficult creative work
```

or:

```text
RECOVERY WINDOW
Best fit · low-load work + early sleep
```

Users can always override a non-clinical recommendation.

## 10. Life Allocation

PRIME should help users understand that time is a finite allocation rather than merely show screen time.

A year contains approximately:

```text
24 * 365 = 8,760 hours
```

The system can show how user-defined domains receive time over weeks, months, and years.

Example:

```text
Creation       760 h
Learning       440 h
Exercise       260 h
Family         610 h
Passive media 1020 h
```

The system should ask:

> Does this allocation resemble the life you said you want to build?

It must not shame leisure or presume every unstructured hour is waste.

Time estimates must retain provenance and uncertainty.

## 11. Trade-off Engine

PRIME should make hidden costs visible.

If a user's selected career push is associated with reduced sleep, relationship time, exercise, or recovery, the UI may show the observed trade-off.

Example:

```text
CRAFT      +
SLEEP      -
FAMILY     -
RECOVERY   -
```

The system must distinguish correlation from causation.

It should never tell the user that one trade-off is morally correct. It should expose consequences so the user can decide.

## 12. Seasons of Life

PRIME should model phases rather than demand constant peak output.

Suggested phase vocabulary:

- Build
- Peak
- Recover
- Integrate
- Expand
- Protect
- Transition

The current phase can be user-selected, collaboratively proposed, or derived with explicit uncertainty.

Examples:

- an athlete may enter Peak before competition and Recover after;
- a founder may enter Build during launch and Protect when sleep or health deteriorates;
- a caregiver may prioritize Protect and Relationships;
- an injured user may shift from Build to Recover without being labeled as failing.

## 13. Future Self Continuity

PRIME should visualize multiple horizons simultaneously:

```text
Today -> 90 days -> 1 year -> 5 years -> 20 years
```

These are scenarios, not forecasts.

### 13.1 Current pattern

Shows what mechanisms are likely to continue if selected behaviors stay similar.

### 13.2 Chosen path

Shows plausible intermediate states created by repeated user-selected actions.

Example:

```text
consistent sleep
 -> better training tolerance
 -> more consistent exercise
 -> greater functional capacity
```

or:

```text
publish work
 -> receive feedback
 -> improve skill
 -> expand professional network
 -> increase opportunity surface
```

Unsupported endpoints such as fame, guaranteed wealth, guaranteed marriage, or guaranteed career outcomes must not be shown as predictions.

## 14. PRIME + EDGE integration

PRIME decides **what matters next**.

EDGE helps the user **act despite constructive discomfort** when avoidance is the relevant constraint.

Example:

```text
PRIME constraint: execution / avoidance
PRIME goal: increase professional opportunity
EDGE mission: send the application already prepared
```

If the constraint is recovery, PRIME should not invoke EDGE merely to keep momentum.

Example:

```text
PRIME constraint: recovery
Action: reduce load and protect sleep
EDGE: not invoked
```

This distinction prevents "courage" from becoming compulsive self-overriding.

## 15. PRIME + Your Body

Your Body should expose physiological consequences and adaptations relevant to selected PRIME goals without making unsupported causal claims.

Examples:

- aerobic training -> longitudinal cardiovascular/performance trends;
- resistance training -> strength/musculoskeletal adaptation education;
- sleep -> recovery context;
- stress-regulation practices -> measured vs self-reported signals;
- chronic load -> trend visualization with uncertainty.

Every state must distinguish:

- measured;
- self-reported;
- derived;
- simulated/reference;
- unavailable.

## 16. PRIME + Clinical

Clinical is upstream whenever safety or disease context matters.

PRIME must never:

- override diagnosis/treatment;
- recommend stopping prescribed medication;
- infer exercise clearance from generic models;
- convert a productivity objective into unsafe training;
- encourage sleep restriction;
- use clinical records for lifestyle pressure without user understanding and consent.

If clinical state conflicts with a PRIME action, the safer clinical boundary wins.

## 17. PRIME + Mental Health

PRIME must not convert depression, suicidality, addiction, trauma, anxiety, or another mental-health condition into a "discipline problem."

The existing mental-health safety orchestration boundary takes precedence.

If explicit safety signals require structured assessment or escalation, PRIME optimization pauses.

Low motivation can have many causes. PRIME may ask, observe, and support, but must not label a user lazy, weak, cowardly, or uncommitted.

## 18. PRIME + Resources / Wealth

PRIME can support:

- runway awareness;
- debt reduction goals;
- savings consistency;
- skill/career capital;
- ownership-building goals;
- business creation;
- long-term stewardship;
- family/community support goals.

It should favor optionality and resilience before irreversible high-risk moves.

It must not:

- encourage gambling;
- use casino-like mechanics;
- recommend ruin-risk speculation;
- frame quitting employment as inherently superior;
- tell a user to invest everything in a business;
- promise generational wealth.

A job may be modeled as income, learning, network, reputation, benefits, stability, and optionality rather than merely a trap.

## 19. PRIME + Relationships

Relationships are a core human trajectory, not a side metric.

Possible user-selected actions include:

- protected time with family;
- reaching out to a friend;
- honest but respectful conversation;
- shared routines;
- caregiving;
- community participation;
- mentorship;
- asking for help.

PRIME must not:

- rank loved ones;
- manipulate attachment;
- encourage boundary violations;
- expose private information between users;
- presume marriage or children are required for a meaningful life.

## 20. PRIME + Meaning / Worldview

Worldview is optional.

The shared secular layer includes:

- values;
- purpose;
- service;
- mortality;
- responsibility;
- contribution;
- stewardship;
- legacy.

Users may optionally select a worldview interpretation layer.

Possible layers may include:

- Islam;
- Christianity;
- Hindu traditions;
- Buddhist traditions;
- other supported traditions;
- secular/humanistic;
- custom/personal.

The worldview layer interprets goals and reflection but does not rewrite clinical evidence.

Example secular framing:

> What remains valuable if recognition disappears?

Example Islamic framing, when selected:

> How does this choice relate to amanah, worship, family duty, service, and accountability before God?

Religious content should preserve source provenance and avoid fabricated doctrine.

## 21. Anti-numbness without stimulation escalation

PRIME should not try to defeat passive consumption by becoming more addictive than passive consumption.

It should compete by making real progress more visible and easier to start.

Allowed reinforcement:

- seeing a real capability trend;
- completing meaningful action;
- recalling evidence from one's own history;
- seeing time reallocated toward chosen values;
- seeing relationships or community investment accumulate;
- understanding trade-offs;
- contextual celebration of real-world milestones.

Disallowed reinforcement:

- infinite feed;
- loot boxes;
- punishment streaks;
- artificial urgency;
- variable-ratio rewards designed for return frequency;
- social humiliation;
- status ladders that pressure unsafe comparison;
- meaningless points detached from real behavior.

## 22. Device independence

PRIME must remain useful without wearables.

Minimum context:

- user-selected goals and values;
- explicit self-report;
- completion history;
- chosen routines;
- relevant records the user has provided or connected.

Optional enrichment:

- sleep/activity/recovery devices;
- calendar;
- health records;
- finance data;
- nutrition data;
- environmental context;
- other authorized sources.

Missing device data lowers resolution; it never disables PRIME.

## 23. Provenance and confidence

Every PRIME conclusion should be traceable to evidence class.

Example:

```text
RECOVERY DECLINING
Evidence:
- sleep duration: measured
- fatigue: self-reported
- training load: recorded
Confidence: moderate
```

Inferred states must not be presented as facts.

If evidence is weak, PRIME should say `INSUFFICIENT DATA` or ask one lightweight question instead of manufacturing precision.

## 24. Privacy

PRIME may combine unusually sensitive domains: health, finance, work, relationships, values, spirituality, and location-adjacent context.

Requirements:

- explicit source permissions;
- inspectable provenance;
- user control over excluded domains;
- deletion/exclusion of personal memories where supported;
- no social sharing by default;
- no hidden relationship surveillance;
- no silent financial inference from unrelated data;
- no mandatory worldview data;
- no location requirement for core PRIME behavior.

## 25. UI architecture

PRIME follows global Panaceamed rules:

- visual-first;
- one dominant focal state per viewport;
- main scrolling text limited to micro-labels / one-line summaries;
- deeper explanation behind `Interpret`, `Why`, or contextual action;
- maximum two interactions from Home to major PRIME functions;
- wide whitespace despite functional density;
- functional Motion UI;
- reduced-motion support;
- no decorative card soup;
- mobile-first verification at 390x844.

### 25.1 Home state

Possible compact representation:

```text
PRIME · BUILD
Constraint · Recovery
Next · Protect tonight's sleep
```

or:

```text
PRIME · EXPAND
Frontier · Craft
Next · Publish the work
```

### 25.2 Prime Field

The seven domains appear as one continuous field around a central trajectory line.

Motion communicates:

- growth;
- protection;
- decline;
- uncertainty;
- trade-off;
- phase transition.

Motion must not imply clinical certainty.

## 26. Agent behavior

The conversational agent may:

- identify a likely constraint with uncertainty;
- ask one high-value clarification;
- explain why one domain is being prioritized;
- offer one next action;
- resize the action;
- invoke EDGE when constructive challenge is appropriate;
- recommend recovery when load is excessive;
- show a trade-off;
- compare scenarios;
- use user-selected worldview framing;
- retrieve grounded longitudinal evidence.

The agent must not:

- command irreversible life choices;
- shame the user;
- imply that illness is lack of discipline;
- encourage medically unsafe performance behavior;
- promise fame, wealth, relationships, or longevity;
- pressure spiritual belief;
- maximize app dependency.

## 27. Outcome model

PRIME should avoid one total score in the initial implementation.

If later research supports an aggregate visualization, it must be clearly labeled a product index rather than medical truth.

The initial output should instead be:

- phase;
- frontier;
- protecting constraint;
- next action;
- key trade-off;
- confidence.

Example:

```text
Phase       BUILD
Frontier    CRAFT
Constraint  EXECUTION
Action      25 min prototype
Trade-off   RECOVERY stable
Confidence  MODERATE
```

## 28. Success metrics

PRIME should not optimize session length.

Preferred metrics:

- real-world actions completed per unit of app attention;
- user-rated relevance of next actions;
- user understanding of why a recommendation appeared;
- progress in user-selected domains;
- reduction in repeated overload;
- improved alignment between stated values and observed time allocation;
- successful recovery recommendations;
- number of recommendations resized rather than abandoned;
- trajectory continuity without device dependence;
- safety override correctness;
- opt-out/override behavior;
- long-term user agency, including lower dependence on prompts when capability grows.

A high-level product heuristic remains:

```text
value = real_world_health + capability + agency + connection + contribution
        ---------------------------------------------------------------
                         attention consumed
```

This is a product objective, not a validated metric.

## 29. Error handling

- Missing data -> conservative action or one clarifying question.
- Conflicting data -> prefer safer interpretation and expose uncertainty.
- Stale data -> label stale and reduce weighting.
- Device disconnected -> continue with device-independent mode.
- Agent generation failure -> deterministic safe action templates.
- User rejects recommendation -> learn preference; do not punish.
- Repeated overwhelm -> reduce challenge and consider recovery.
- Clinical/safety escalation -> pause PRIME optimization.
- Worldview unavailable -> fall back to shared secular meaning layer.

## 30. Testing strategy

### Unit tests

- domain importance remains user-owned;
- constraint ranking respects confidence and addressability;
- recovery constraint can outrank growth action;
- EDGE is not invoked when recovery is the primary constraint;
- missing wearable data does not disable PRIME;
- stale signals are down-weighted;
- worldview selection is optional;
- worldview layer cannot modify clinical evidence;
- no irreversible high-risk resource action is generated from generic ambition;
- decline/override has no punitive effect.

### Property/invariant tests

- clinical/safety state always overrides PRIME optimization;
- no single domain is required to be maximized;
- inferred states are always distinguishable from measured/self-reported states;
- no scenario path is rendered as guaranteed future outcome;
- no user without worldview opt-in receives faith-specific framing;
- no device source becomes required for core functionality.

### Integration tests

- Home -> PRIME state -> next action;
- PRIME constraint -> EDGE mission;
- PRIME recovery constraint -> recovery action without EDGE;
- Your Body trend -> PRIME constraint with provenance;
- time allocation -> trade-off visualization;
- user changes values -> domain priority updates;
- worldview toggle -> interpretation changes while facts stay fixed;
- safety signal -> PRIME pauses -> safety pathway.

### Browser tests

At 390x844 verify:

- one focal state;
- no text overflow;
- two-step access;
- wide spacing;
- reduced-motion behavior;
- no blocking modal takeover;
- clear distinction between phase, frontier, constraint, and action.

## 31. Implementation slices

Production work should be split into small coherent PRs after design approval.

### Slice A — deterministic PRIME core

- types and schemas;
- signal provenance;
- constraint detector interfaces;
- recovery-vs-growth arbitration;
- deterministic action templates;
- unit/invariant tests.

### Slice B — Home PRIME state

- compact phase/frontier/constraint/next-action surface;
- two-step access;
- device-independent state;
- 390x844 verification.

### Slice C — EDGE bridge

- PRIME-to-EDGE interface;
- challenge vs recovery arbitration;
- shared longitudinal event contracts;
- no duplication of EDGE safety logic.

### Slice D — Adaptive Human Frontier

- seven-domain visual field;
- provenance/confidence layers;
- functional motion;
- no aggregate pseudo-clinical score.

### Slice E — Life Allocation + Trade-offs

- time allocation model;
- uncertainty-aware estimates;
- trade-off visualization;
- value-alignment reflection.

### Slice F — Prime Window

- categorical capacity windows;
- explainable contributors;
- device-independent fallback;
- user override.

### Slice G — Future Self Continuity

- scenario horizons;
- current-pattern vs chosen-path divergence;
- explicit assumptions;
- no outcome guarantees.

### Slice H — Optional worldview layer

- opt-in worldview preference;
- secular shared meaning base;
- faith/tradition interpretation adapters;
- provenance and content review gates.

## 32. Coordination with active repository work

PRIME must respect current repository ownership boundaries.

At design time:

- the canonical 3-super-page architecture is active work and PRIME should fit within it rather than introduce a fourth top-level page;
- mental-health safety work is an upstream boundary;
- EDGE is a separate design dependency for challenge generation;
- Deep Human Lab is an explanatory/research dependency, not a duplicate motivation system;
- an active CLAUDE.md continuation-queue PR already owns that file, so this design intentionally does **not** edit `CLAUDE.md` to avoid overlap. PRIME's long-running implementation should be added to the canonical continuation queue by the owner of that lane or after that ownership clears.

No production implementation should bypass the repo's branch -> PR -> exact-head validation -> Stabilization Acceptance -> latest-main audit -> merge workflow.

## 33. Acceptance criteria

PRIME is architecturally complete when:

1. A user can define what matters without being assigned a universal success hierarchy.
2. PRIME can operate with no wearable.
3. The system exposes phase, frontier, constraint, next action, trade-off, and confidence without a fake medical score.
4. Recovery can outrank growth when appropriate.
5. PRIME can invoke EDGE for constructive challenge but never bypass EDGE or mental-health safety boundaries.
6. Clinical context overrides lifestyle optimization when relevant.
7. Life Allocation exposes time use without shaming leisure.
8. Future Self Continuity is explicitly scenario-based rather than predictive.
9. Resources/wealth logic rejects gambling, ruin risk, and guaranteed wealth narratives.
10. Relationships remain first-class and private.
11. Worldview is optional and never alters scientific facts.
12. Main UI remains visual-first, wide-spaced, motion-enabled, and two-step accessible.
13. Provenance distinguishes measured, self-reported, derived, simulated, and reference data.
14. The agent never frames illness or low capacity as moral failure.
15. The subsystem measures success through real-world value rather than app dependency.

## 34. Product north star

PRIME should help a person progressively become more capable of carrying the life they choose without sacrificing the health, relationships, or meaning that make that life worth having.

The system should evolve from asking:

> How can I achieve more?

into:

> What capacity do I need next?

then:

> What should I protect while I grow?

and eventually:

> What becomes better because I was here?

PRIME succeeds when achievement matures into agency, responsibility, connection, contribution, and stewardship.