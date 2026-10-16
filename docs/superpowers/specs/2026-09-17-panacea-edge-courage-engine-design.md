# PANACEA EDGE — Courage & Aliveness Engine

Date: 2026-09-17
Status: Design for review
Owner surface: Panaceamed longitudinal health OS

## 1. Product intent

PANACEA EDGE is a cross-product behavior engine that helps users choose meaningful, voluntary, real-world challenge over passive numbness. It is not a risk-taking game, productivity cult, streak mechanic, or clinical treatment system. It exists to make healthy courage, mastery, exploration, connection, contribution, and purposeful discomfort easier to start and easier to learn from.

The engine should make Panaceamed feel like a system that helps users live more fully outside the app. A successful session may end with the user closing Panaceamed and doing something difficult but constructive in real life.

Core principle:

> Take more meaningful risks that are yours to choose, difficult enough to change you, and safe enough to repeat.

This extends Panaceamed's long-horizon product philosophy: trajectory over peak, durable meaning over compulsive stimulation, and real-world agency over time-in-app.

## 2. Problem definition

Many high-salience digital or consumptive behaviors provide rapid reward with low effort and low durable value. Conversely, actions that produce mastery, stronger relationships, health, contribution, or opportunity often have an activation cost: fear, uncertainty, effort, social exposure, or delayed reward.

PANACEA EDGE should reduce that activation gap without moralizing users or labeling ordinary pleasure as pathology.

The relevant product problem is not "dopamine depletion." The product should avoid that scientifically misleading framing. The useful behavioral pattern is:

- a cue creates anticipation;
- the user chooses an action;
- the action produces an outcome;
- the outcome updates expectations and future behavior;
- repeated choices shape habits, identity, capability, and life trajectory.

EDGE makes constructive actions easier to initiate, captures what the user learned, and gradually calibrates future challenge.

## 3. Scope

### In scope

- Voluntary daily or situational "Edge Missions" across health, social connection, relationships, career, learning, creation, exploration, service, and recovery.
- A personal Courage Curve learned from user-rated challenge, meaning, safety, and post-action experience.
- An Aliveness Map showing where meaningful action is accumulating over time.
- Courage Memory: evidence from the user's own past actions that can be reused by the Panaceamed agent.
- A "Life You Didn't Live" trajectory visualization that compares a current-pattern path with one or more user-chosen action scenarios without pretending to predict the future.
- Safety filtering and explicit non-escalation rules.
- Longitudinal integration with Panaceamed's shared patient/user state.
- Device-independent operation with optional contextual enrichment from sleep, activity, recovery, location class, calendar, or wearable data when permissioned and available.
- Visual-first, low-text, two-step-access UI consistent with the existing Panaceamed product rules.

### Out of scope

- Encouraging illegal, violent, dangerous, self-destructive, medically unsafe, or humiliating behavior.
- Autonomous mental-health diagnosis, suicide-risk prediction, or emergency disposition.
- Financial trading, gambling-like speculation, leverage recommendations, or "bet your life" entrepreneurship prompts.
- Telling users to quit a job, relationship, medication, treatment, or other high-impact commitment based on model inference.
- Treating fear intensity as proof that an action is valuable.
- Maximizing session duration, streak pressure, notification volume, or compulsive return behavior.
- Clinical claims that EDGE itself treats depression, addiction, anxiety, or another disorder.

## 4. Design principles

1. **Autonomy first** — every mission is optional, editable, skippable, snoozable, and explainable.
2. **Meaning before intensity** — challenge is valuable only when tied to a user-chosen value or goal.
3. **Reversibility before bravado** — prefer actions that create learning and option value while limiting irreversible downside.
4. **Progressive challenge** — increase difficulty only after evidence that the previous challenge was manageable and useful.
5. **No shame** — missing or declining a mission never damages a score or creates loss-framed streak pressure.
6. **Real-world completion** — reward actual actions, not tapping, browsing, or app engagement.
7. **Trajectory over peak** — emphasize compounding capability, relationships, health, and contribution.
8. **Safety is upstream** — unsafe missions are filtered before ranking or display.
9. **User evidence beats generic motivation** — replay the user's own successful history when possible.
10. **Device independent** — wearables enrich confidence but never gate usefulness.

## 5. High-level architecture

EDGE should be a shared longitudinal subsystem rather than a standalone page.

```text
User goals + values
       |
Behavior history + self-report ---- Optional contextual signals
       |                              (sleep/activity/recovery/etc.)
       v
+-----------------------+
| Candidate Generator   |
+-----------+-----------+
            |
            v
+-----------------------+
| Safety Governor       |<---- Mental-health safety kernel / clinical boundaries
+-----------+-----------+
            |
            v
+-----------------------+
| Courage Calibrator    |
| meaning / challenge   |
| reversibility / fit   |
+-----------+-----------+
            |
            v
+-----------------------+
| Mission Ranker        |
+-----------+-----------+
            |
            v
Home / Your Body / Mind / Social / Career / Agent surfaces
            |
            v
Pre-action check -> real-world action -> post-action reflection
            |
            v
Courage Memory + Aliveness Map + longitudinal state
```

The generator and ranker may use AI assistance, but safety classification and hard exclusions must remain deterministic wherever rules can be deterministic.

## 6. Core domain model

### 6.1 EdgeDomain

```ts
type EdgeDomain =
  | 'body'
  | 'mind'
  | 'relationship'
  | 'family'
  | 'social'
  | 'career'
  | 'learning'
  | 'creation'
  | 'exploration'
  | 'service'
  | 'recovery';
```

### 6.2 EdgeMission

Conceptual schema:

```ts
interface EdgeMission {
  id: string;
  title: string;
  domain: EdgeDomain;
  valueId?: string;
  goalId?: string;
  rationale: string;
  expectedMinutes: number;
  challengeEstimate: number;      // 0..1
  meaningEstimate: number;        // 0..1
  reversibility: number;          // 0..1, higher = easier to reverse
  physicalHazard: number;         // 0..1
  financialHazard: number;        // 0..1
  interpersonalHazard: number;    // 0..1
  legalOrEthicalHazard: number;   // 0..1
  clinicalHazard: number;         // 0..1
  confidence: number;             // 0..1
  provenance: MissionProvenance;
  contraindications: string[];
  createdAt: string;
  expiresAt?: string;
}
```

Scores are product heuristics, not medical measurements.

### 6.3 EdgeAttempt

```ts
interface EdgeAttempt {
  missionId: string;
  startedAt: string;
  completedAt?: string;
  status: 'accepted' | 'completed' | 'declined' | 'deferred' | 'abandoned';
  preFear?: number;       // 0..10 user-entered
  preMeaning?: number;    // 0..10 user-entered
  postFear?: number;      // 0..10 user-entered
  postPride?: number;     // 0..10 user-entered
  postAlive?: number;     // 0..10 user-entered
  postWorthIt?: boolean;
  note?: string;
  evidence?: 'self_report' | 'device_supported' | 'calendar_supported' | 'manual_artifact';
}
```

### 6.4 CourageMemory

A Courage Memory is a compact longitudinal record generated only from actual user history.

Example:

```ts
interface CourageMemory {
  id: string;
  domain: EdgeDomain;
  situationClass: string;
  priorFear: number;
  outcome: string;
  worthIt: boolean;
  learnedStatement: string;
  createdAt: string;
}
```

Example learned statement:

> You rated the presentation 8/10 frightening before starting and 9/10 worthwhile afterwards.

The system must never fabricate a completed action or memory.

## 7. Courage calibration

EDGE should not have one global "bravery score." It should estimate a personal challenge band per domain.

A simple initial heuristic may be:

```text
challenge_fit = 1 - abs(user_target_challenge - mission_challenge)
```

with the target challenge initialized conservatively and updated from actual attempts.

A broader internal mission utility can be:

```text
constructive_value =
    meaning
  * autonomy
  * challenge_fit
  * expected_learning
  * reversibility
  * context_fit
```

A separate risk burden is calculated before ranking:

```text
risk_burden = max(
  physical_hazard,
  financial_hazard,
  legal_or_ethical_hazard,
  clinical_hazard,
  severe_interpersonal_hazard
)
```

A mission is ineligible if a hard exclusion is triggered. Otherwise risk burden can down-rank it.

The engine must not use "more fear = better" or "more risk = more courage."

## 8. Safety Governor

### 8.1 Hard exclusions

EDGE must never propose or positively reinforce missions involving:

- self-harm or suicidal behavior;
- violence or threats;
- reckless driving or dangerous stunts;
- illicit drug use or unsafe substance escalation;
- binge drinking or substance challenges;
- sleep deprivation as achievement;
- starvation, purging, extreme dehydration, or unsafe weight-cutting;
- unsafe exercise beyond available health context;
- medication or treatment discontinuation without appropriate clinician involvement;
- gambling, financial leverage, all-in bets, or ruin-risk speculation;
- illegal acts;
- non-consensual sexual or interpersonal behavior;
- harassment, humiliation, coercion, stalking, or boundary violations;
- "prove yourself" actions with major irreversible financial, legal, medical, or relationship downside.

### 8.2 Mental-health integration

EDGE must consume the repository's mental-health safety orchestration boundary when that subsystem is available. It must not duplicate, downgrade, or override hard escalation states.

When explicit safety signals require structured assessment or escalation, challenge generation pauses. The user is routed to the appropriate safety pathway rather than being given a courage mission.

Inferred low mood, low activity, or reduced engagement may justify a gentle check-in, but must not silently become an emergency classification.

### 8.3 Clinical context

If relevant clinical data are available, exercise or physical missions may be constrained by known limitations. Generic atlas or simulation data must never be treated as patient-specific clearance.

If clinical context is absent, missions default to ordinary low-risk activity and explicitly avoid claims of medical suitability.

## 9. Mission generation

Candidate missions can originate from four sources:

1. **User-authored** — the user enters something they want to do but avoid.
2. **Goal-derived** — generated from a user goal such as running, public speaking, career change, learning, family connection, or community service.
3. **Pattern-derived** — generated from repeated voluntary behavior history, such as a pattern of postponing social connection or avoiding a selected project.
4. **Contextual** — optional suggestions from calendar, activity, sleep, location class, or device signals when permissioned.

The generator should prefer concrete verbs and bounded actions.

Good:
- Send the application you already prepared.
- Ask one person for honest feedback on your project.
- Run the planned interval session if your existing training plan marks today as appropriate.
- Call the family member you chose to reconnect with.
- Publish one useful thing you created.
- Attend the community event you saved.

Bad:
- Become fearless.
- Quit your job today.
- Invest everything in your startup.
- Confront your enemy.
- Train until you cannot continue.

## 10. Mission lifecycle

```text
DISCOVER
  -> ACCEPT
  -> PRE-CHECK
  -> ACT
  -> REFLECT
  -> LEARN
  -> CALIBRATE
```

### Discover
Show one primary mission, not a feed of dozens.

### Accept
The user may accept, edit, swap, defer, or decline without penalty.

### Pre-check
At most a few lightweight inputs: expected fear, meaning, time available, and any required safety confirmation.

### Act
Panaceamed gets out of the way. Timers or guidance appear only when useful.

### Reflect
Use a very short post-action capture. Default target: under 20 seconds.

### Learn
Update Courage Memory and domain calibration.

### Calibrate
Difficulty changes slowly. One unusually positive completion must not cause a large jump in challenge intensity.

## 11. Aliveness Map

The Aliveness Map is a visual longitudinal surface, not a moral scorecard.

Domains are represented as a sparse radial field or body-adjacent constellation:

- Body
- Mind
- Love / Relationships
- Family
- Social
- Career
- Learning
- Creation
- Exploration
- Service
- Recovery

Brightness or motion indicates recent meaningful action; depth/trail length indicates accumulated history. No domain is required to be maximized.

The map should make imbalance visible without shaming. Example: strong work/fitness activity with near-zero relationship/community activity can be shown as a narrow trajectory, not labeled "bad."

## 12. "The Life You Didn't Live"

This surface visualizes scenario divergence, not prediction.

It compares:

- **Current pattern** — what continues if selected routines remain similar.
- **Chosen edge path** — what capabilities or opportunities could become more plausible if the user repeatedly performs selected actions.

The UI must explicitly label these as scenarios with uncertainty, not forecasts.

Outputs should emphasize controllable intermediate states:

```text
publish work
 -> receive feedback
 -> improve skill
 -> grow network
 -> increase opportunity surface
```

rather than unsupported claims such as:

```text
publish work -> become famous
```

This feature should reuse the product's existing visual-first rules: one focal divergence, minimal labels, details behind an Interpret/Why control.

## 13. Home integration

Home should expose only one primary EDGE object at a time.

Example compact state:

```text
ALIVE 78 ↑
Today's Edge · Ask for the feedback you keep avoiding
Fear 7   Meaning 9   Reversible ✓
[DO IT]
```

"ALIVE 78" is optional and must not ship as a pseudo-clinical score unless product research shows users understand it correctly. A safer initial implementation is a trend label such as `ALIVENESS · RISING` derived from recent self-reported meaningful-action patterns.

Interpretation text stays behind one contextual action and is limited to one concise paragraph.

## 14. Your Body integration

Your Body can connect completed real-world actions to physiological education without pretending causality from one event.

Examples:

- a completed run can link to cardiovascular and musculoskeletal adaptation education;
- sleep-supportive choices can connect to sleep/recovery trends;
- stress-management actions can show measured vs self-reported state distinctly;
- repeated training can show longitudinal performance trends.

The UI must distinguish:

- measured;
- self-reported;
- derived;
- simulated/reference;
- unsupported/not available.

## 15. Agent integration

The Panaceamed conversational agent should be able to:

- retrieve the user's chosen values and goals;
- propose one safe mission;
- explain why it was proposed;
- cite a relevant Courage Memory when useful;
- help resize a mission smaller or larger;
- recognize a completed mission from explicit user report;
- ask a concise reflection;
- suggest recovery when challenge load is excessive;
- stop EDGE orchestration when safety pathways take precedence.

The agent must not:

- shame avoidance;
- manufacture urgency;
- imply cowardice;
- coerce disclosure;
- frame unsafe actions as proof of courage;
- autonomously execute irreversible real-world actions.

## 16. Anti-numbness design without addiction mechanics

EDGE should feel emotionally alive while avoiding dark patterns.

Allowed reinforcement:

- meaningful motion after a completed action;
- revealing a new personal insight;
- showing accumulated evidence of capability;
- visualizing trajectory change;
- contextual encouragement grounded in actual history.

Disallowed reinforcement:

- loot boxes;
- random monetary rewards;
- punishment streaks;
- escalating notification pressure;
- artificial scarcity;
- social humiliation;
- follower-like vanity counters;
- variable rewards designed primarily to extend session time.

Primary product success should be measured by useful real-world action with low attention cost.

## 17. Device-independent operation

EDGE must work with zero wearable integrations.

Minimum viable context:

- user-selected values/goals;
- mission history;
- optional pre/post ratings;
- explicit user state;
- ordinary app context.

Optional enrichment may include:

- sleep duration/recovery;
- training load;
- heart-rate or activity context;
- calendar availability;
- weather or environmental context where appropriate;
- location class only with explicit permission and a clear user benefit.

No missing wearable signal should disable mission generation.

## 18. Privacy and consent

EDGE can contain highly sensitive behavioral, relationship, mental-health, financial, and location-adjacent information.

Requirements:

- sensitive sources are opt-in;
- each recommendation retains provenance;
- users can inspect why a mission was suggested;
- users can delete or exclude a Courage Memory from future use;
- private reflections are not exposed socially by default;
- relationship or family missions never reveal one person's private data to another;
- location is not required for the core system;
- inferred states are never presented as facts.

## 19. UX behavior

The system follows existing Panaceamed product rules:

- English is the source UI language;
- visual-first main surfaces;
- no primary scrolling text block longer than one line per element;
- contextual interpretation behind a control;
- maximum two interactions from Home to an important EDGE function;
- wide spacing despite high functional density;
- functional motion showing state transition and continuity;
- no decorative card soup;
- one dominant focal action per viewport;
- mobile-first verification at 390x844.

Suggested motion language:

- mission appears as a restrained luminous edge rather than a modal interruption;
- accepting a mission creates spatial continuity into the action state;
- completion sends a subtle pulse into the relevant Aliveness domain;
- trajectory divergence animates only when the scenario assumptions change.

## 20. Error and uncertainty handling

- If mission context is insufficient, generate a conservative mission or ask one lightweight question.
- If context conflicts, prefer the safer constraint.
- If an external signal is stale, label it stale and do not use it as decisive evidence.
- If model generation fails, fall back to a deterministic library of low-risk mission templates tied to user goals.
- If a user repeatedly declines one domain, reduce prompting frequency rather than escalating pressure.
- If reflections indicate repeated overwhelm, lower challenge and offer recovery-oriented actions.
- If safety state requires escalation, EDGE pauses.

## 21. Testing strategy

### Unit tests

- hard-exclusion safety rules;
- risk-burden calculation;
- challenge calibration bounds;
- no challenge escalation after insufficient evidence;
- user decline has no punitive state effect;
- deterministic fallback mission selection;
- provenance preservation;
- scenario visualization never converts uncertainty into certainty language.

### Property/invariant tests

- no mission can pass when a hard safety exclusion is true;
- mission challenge remains within configured bounds;
- missing wearable data does not make mission generation unavailable;
- deleting a Courage Memory prevents future retrieval;
- emergency/safety state always overrides mission ranking.

### Integration tests

- Home -> mission -> reflection -> Courage Memory;
- agent -> mission -> safe resize;
- longitudinal state -> Aliveness Map update;
- explicit safety signal -> EDGE paused -> safety pathway;
- optional wearable signal -> enriched context without becoming required.

### Browser tests

At minimum verify the primary Home/EDGE flow at 390x844:

- one-line primary copy;
- no overflow;
- wide spacing preserved;
- two-step access;
- motion does not block interaction;
- reduced-motion preference is respected.

## 22. Success metrics

Do not optimize primarily for DAU minutes.

Preferred metrics:

- proportion of accepted missions completed in the real world;
- user-rated "worth it" after completion;
- increase in chosen-domain participation over time;
- successful mission resizing rather than abandonment;
- decrease in repeated overwhelm;
- diversity of meaningful domains without forcing balance;
- percentage of recommendations users understand and consider relevant;
- attention cost per completed real-world action;
- opt-out and decline rates by mission class;
- safety-filter activation and false-positive review.

A useful high-level product metric is:

```text
real_world_value / attention_consumed
```

## 23. Initial implementation slices

Implementation should be staged into coherent PRs after this design is approved.

### Slice A — deterministic core

- domain types;
- mission schema;
- attempt/reflection schema;
- safety governor;
- conservative mission templates;
- calibration reducer;
- unit and invariant tests.

### Slice B — Home mission loop

- one compact EDGE Home widget;
- mission detail/action state;
- pre/post reflection;
- persistence;
- 390x844 browser verification.

### Slice C — Courage Memory + agent retrieval

- actual-history memory creation;
- inspect/delete controls;
- grounded agent use.

### Slice D — Aliveness Map

- visual longitudinal domain model;
- functional motion;
- trend/imbalance visualization without normative scoring.

### Slice E — scenario divergence

- "The Life You Didn't Live" scenario engine;
- uncertainty-aware trajectory visualization;
- explicit scenario assumptions.

### Slice F — optional context enrichment

- wearables/activity/sleep/calendar integrations where already available;
- device-independent fallback retained and tested.

Each production slice must follow repository coordination rules: latest-main audit, overlap check, short-lived branch, one coherent PR, targeted tests, exact-head Validate pull requests, complete Stabilization Acceptance, latest-main race check, and merge through PR only.

## 24. Acceptance criteria for the subsystem

PANACEA EDGE is architecturally complete when:

1. A user can create or receive a safe mission without a wearable.
2. The user can accept, resize, defer, decline, complete, and reflect without shame or penalty mechanics.
3. The safety governor blocks all defined hard-exclusion classes before ranking.
4. Existing mental-health safety orchestration takes precedence whenever applicable.
5. Repeated reflections calibrate challenge conservatively by domain.
6. Completed attempts create inspectable, deletable Courage Memories.
7. Home exposes the mission loop within two interactions.
8. Aliveness visualization distinguishes meaningful action history without presenting a clinical score.
9. Scenario divergence is explicitly labeled as uncertain and never shown as prediction.
10. Missing devices or integrations do not break the experience.
11. Reduced-motion and 390x844 responsive behavior are verified.
12. Repository required exact-head CI and Stabilization Acceptance remain authoritative.

## 25. Product north star

PANACEA EDGE should not make users addicted to Panaceamed. It should make the user's own life more rewarding to participate in.

The ideal result is a person who becomes progressively more capable of doing difficult, meaningful, prosocial, health-supportive things with less dependence on external prompting.

The system succeeds when the user needs less courage theater and accumulates more real evidence:

> I was afraid. I chose it because it mattered. I did it safely. I learned. I can act again.
