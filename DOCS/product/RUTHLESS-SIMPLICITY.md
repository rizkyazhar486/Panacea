# Panaceamed Ruthless Simplicity


## Owner directive (2026-10-17): simple, visual, concise

Applies to Panaceamed UI, F1 user journeys, F2 UX, PR descriptions and owner-facing reports. When previous guidance encourages a text-heavy screen or report, **this directive wins**, without weakening clinical safety, privacy, RBAC, accessibility, provenance or testing.

- **First viewport:** one obvious purpose, one primary action and at most one brief supporting sentence; show necessary clinical facts, never a wall of explanation.
- **Copy budget:** one concise sentence per visible card/widget; short labels. Put explanations, methodology, formulas, evidence and optional tools behind **Details / Why / Evidence**. Routine tasks must not require reading long prose.
- **Journey:** recognize → act → immediate feedback → next step. Minimize screens, re-entry, interruptions, choices and duplicated navigation. Preserve back, recovery and confirmation where safety demands them.
- **Responsive:** validate patient and clinician journeys on mobile (390×844) and desktop, touch, keyboard, screen reader, light/dark, empty/loading/error states. Never obscure the action or create horizontal overflow.
- **Critical exceptions:** clinical warnings, contraindications, emergencies, missing data, uncertainty, consent, units, provenance and required clinician review stay visible when necessary. Do not shorten safety information into ambiguity.
- **Preserve capability:** simplify presentation and group controls; do not silently remove working features or change clinical behavior.
- **PR acceptance:** include before/after screen captures, the shortest real patient/clinician task path, count of competing primary actions and persistent paragraphs, plus **exact-head F1/F2 checks**. If finding the action requires reading a paragraph wall, fix the design. Do not relax ratchets or call unverified tests VERIFIED.
- **Owner updates (default):** maximum 4 concise lines, approximately 120 words total: (1) result; (2) changed UI/PR/SHA; (3) validated evidence; (4) outstanding blocker/next action. Link full logs, calculations and evidence; write longer only when requested or essential for safety and audit. Never conflate local checks with CI, production, clinical or user acceptance.


Panacea may be technically deep, but the user should experience one obvious path at a time.

## Core equation

`Perceived Complexity = Visible Choices × Hierarchy Levels × Simultaneous Contexts`

Reduce any one term before adding another visible element. A surface with 6 choices × 2 levels × 2 simultaneous contexts already has a complexity load of 24. Prefer one dominant context and progressive disclosure.

## Product rules

1. **One viewport, one focal purpose.** A body, a metric, a task, a conversation, or a decision owns the visual hierarchy.
2. **One primary action.** Secondary actions stay visually quiet.
3. **Six-or-fewer primary choices** when practical. Everything else belongs in Search, More, contextual actions, or a progressive rail.
4. **Two-step access.** From Home, a major feature should normally be reachable in at most two intentional interactions.
5. **Visual first.** Persistent scrolling UI prioritizes body visualization, charts, numbers, state, and short labels. Interpretation lives behind disclosure.
6. **No decoration without meaning.** Gradients, glow, blur, colour, elevation, motion, badges and icons must communicate state, hierarchy, provenance, urgency or interaction.
7. **One canonical source per concern.** One patient-state authority, one body renderer, one route taxonomy, one visit kernel, one provenance model.
8. **No duplicate workflows.** Extend an existing path before inventing a parallel one.
9. **Preserve capability, reduce exposure.** Simplification means hiding or grouping secondary tools, not deleting working features.
10. **Simple inside too.** Prefer direct data flow, boring names, small modules, explicit contracts, and fewer adapter layers.
11. **Motion is feedback, not decoration.** Motion should confirm state change, spatial continuity or direct manipulation.
12. **Clinical meaning beats visual novelty.** Patient-specific data, reference anatomy, AI drafts, simulation and clinician-verified facts must remain distinguishable even when the UI is minimal.

## Workflow equation

`Task Cost = User Interactions + Context Switches + Required Decisions + Waiting`

When two implementations are clinically equivalent, prefer the one with lower Task Cost.

## Implementation order

1. Remove visual noise from shared shell.
2. Collapse duplicate navigation and duplicate controls.
3. Keep the primary surface obvious on mobile.
4. Move explanations to one-tap contextual disclosure.
5. Reuse canonical state and renderers.
6. Add deterministic acceptance so complexity cannot silently creep back.

## Non-negotiable boundary

Simplicity must never hide safety-critical information, uncertainty, provenance, consent state, or clinician-review status.
