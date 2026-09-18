# Panaceamed.id — working rules

## Language: English is the base. This is permanent.

The **fundamental language of this application is English**, everywhere, from now
on and for good. English is not a preference to be revisited each session — it is
what makes the product professional and usable outside one person's own screen.

The app is **multilingual on top of that base**: English (source) plus
**Arabic, Mandarin, Indonesian, French, Japanese, Dutch**. Every new string is
written in English first and then translated outward; never the reverse.

### What this means in practice

- **Write every new user-facing string in English.** Buttons, labels, empty
  states, error messages, notification titles and bodies, onboarding copy.
- **Never translate the interface into Indonesian.** If a screen is still in
  Indonesian, it is unfinished work — convert it to English, do not "keep it
  consistent" with its neighbours by adding more Indonesian.
- **Two exceptions, and only these two:**
  1. The **SKDI / OSCE / UKMPPD medical corpus** (disease notes, station notes,
     exam banks, therapy references) stays in Indonesian — it mirrors Indonesian
     national competency material and its wording is the point.
  2. **Scripture and religious content** (Qur'an, hadith, other traditions) keeps
     its source language plus the existing Indonesian rendering.
  The interface *around* both of those is still English.
- **Code comments in this repository are written in Indonesian** by long-standing
  convention, and that stays. Comments are not interface.

### Why this was written down

An earlier session read a note that said "~1,100 remaining English strings" as a
list of strings to translate *into* Indonesian, and pushed ten commits in the
wrong direction before it was caught. The instruction had always been the
opposite. The cost of re-deriving this from context is a day of work thrown away,
so it lives here instead.

## Identifiers are not text

`id`, route paths, `value=` on options, filter keys, and anything compared with
`===` are **data**, not interface. Translating them empties saved layouts and
silently kills filters with no visible error. Translate the label; leave the key.

## Multi-agent coordination — mandatory

This repository is edited concurrently by ChatGPT/Codex, Claude Code, Replit and
other automation. **GitHub `main` is the source of truth, but agents must not push
directly to `main`.** Direct writes make other PRs stale, cancel useful CI, and
create hard-to-audit races.

Before editing:
1. Resolve the latest `main` SHA.
2. Inspect recent commits and open PRs touching the intended files/area.
3. If another active PR owns overlapping paths, do not duplicate it. Pick another
   safe task or coordinate explicitly.
4. Create a short-lived branch from the latest safe `main`.

During implementation:
- Keep one coherent, reversible batch per PR.
- Do not create `TEMP`, placeholder, dummy, or knowingly broken commits on `main`.
- Prefer targeted tests while iterating; diagnose failures before pushing another
  commit so CI is not repeatedly cancelled and restarted.
- Do not weaken validators, biomedical gates, browser smoke, security checks, or
  tests merely to obtain green CI.
- Do not force-push shared branches or overwrite another agent's work.

## Execution mode — all lanes simultaneous, no global priority

The current product directive is **broad concurrent execution across all product
lanes**. ChatGPT/Codex and Claude Code should work at the same time on independent
work rather than serializing the roadmap behind one global priority queue.

All of the following are active scope at the same time:
- UI/UX, interaction, responsive behavior, motion, accessibility and design-system
  implementation;
- backend, APIs, data architecture, Supabase/database work and integrations;
- AI orchestration, clinical reasoning infrastructure, evaluation and safety;
- Body Exposure, anatomy, physiology, pathology, pharmacology and simulation;
- tests, CI, stabilization, observability, security and repository hygiene;
- product analytics, documentation, localization and developer tooling.

**UI/UX is explicitly back in scope.** Do not treat visual/interface work as a
separate deferred phase. It may proceed concurrently with backend, AI, biomedical,
testing and infrastructure work, subject to the same PR and verification rules.

"No global priority" means:
- do not stop healthy independent lanes merely because another lane has an older,
  larger or more prestigious task;
- do not impose a single product-wide ordering such as stabilization → Body →
  backend → UI;
- each lane may still sequence its own prerequisites locally when technically
  necessary;
- a true shared blocker may gate only the work that depends on it, not unrelated
  lanes.

Parallelism must remain race-safe:
1. Prefer separate branches/PRs with disjoint file ownership.
2. Treat an overlapping file or tightly coupled state as single-writer until the
   owning PR lands or releases it.
3. Rebase/replay from current `main` when ancestry or overlap becomes uncertain.
4. Never solve concurrency by force-pushing, bypassing CI, deleting another
   agent's work, or weakening safety checks.
5. Preserve features unless removal is explicitly required and justified.

For long-running or blocked work, leave durable continuation context in this file
or the repository's canonical handoff/task ledger so Claude Code and ChatGPT can
resume without re-deriving intent from chat history.

For progress reporting, report each active lane independently from verifiable repo
state. Do not fabricate precision. A useful aggregate is:

`Overall progress = 100 × (verified completed weighted work / canonical weighted backlog)`

If a trustworthy denominator is unavailable, report the lane status and delta
without inventing a percentage.

## Shipping — PR only

**Never push directly to `main`, and never "push to both main and a Claude branch".**
The previous dual-push rule is retired because it caused moving-main races.

For every production change:
1. Push the short-lived branch and open/update exactly one PR.
2. Run targeted checks first as useful.
3. Require **Validate pull requests** and the complete **Stabilization Acceptance**
   workflow to pass for the exact current PR head. Full acceptance remains the
   authority for frontend build/tests, Body/WebGL smoke, and server gates.
4. Immediately before merge, resolve latest `main`, confirm mergeability, inspect
   changed-file overlap, and confirm the tested head has not changed.
5. If `main` moved into overlapping files, CI/workflow files, or creates uncertain
   ancestry, refresh/rebuild from latest `main` and rerun gates. Never force merge.
6. Merge through the PR only after the exact-head gates are green and the final
   race check is clean. Automatic merge is acceptable under those conditions.
7. After merge, verify the merge is present on `main` and inspect available
   deployment/smoke evidence.
8. Close stale or superseded duplicate PRs so agents do not keep working the same
   candidate twice.

For user-visible changes, verify the affected surface in a real browser at
**390x844** when the repository's browser tooling supports it. For Body/3D work,
preserve the existing WebGL smoke and rendered-artifact checks.

## Biomedical / clinical publication boundary

Software CI is not academic or clinical validation. For anatomy, physiology,
pathology, pharmacology, genomics, surgery, diagnosis/treatment, or other medical
content, preserve provenance, evidence/version boundaries, uncertainty, AI
assistance disclosure, and the repository Academic Accuracy Gate. Never claim
human review unless a real qualified reviewer, credentials, date and scope are
recorded. Never infer patient-specific anatomy, lesion location, procedure target,
force/device setting, diagnosis or treatment from generic atlas/simulation data.


## Active durable continuation queue — 2026-09-18

This is a **snapshot**, not a substitute for resolving live GitHub state. Before
acting on any item below, re-check `main`, the PR head, exact-head CI, changed-path
overlap, ancestry, and whether a newer PR has superseded it.

### Current blockers / exact-head candidates

- **Mental-health safety — PR #1794, head
  `46adc4bfadbd6d322fa8088bdef25cf8b5002075`.** Repository CI is green on
  this head, but merge remains blocked on a real qualified clinical human review
  of the trigger/action policy. Do **not** infer review from CI, the product owner,
  a model, or a prior conversation. Before representing it as clinically reviewed,
  record the real reviewer's name/credentials, review date, review scope, and
  explicit disposition. Then refresh against latest main and rerun required gates.
- **Longitudinal governance core — PR #1805, head
  `62ad45667179eaa7b8dd3276153799f53d310b64`.** Fresh extraction of the
  self-contained governance kernel from stale #1744: patient-scoped idempotent
  event state, provenance/confidence/timestamps, purpose consent ledger, clinician
  review ledger, minimum-necessary AI context, governed Chatbot/AI-EMR bundle and
  audit manifest. Do not merge stale #1744 wholesale and do not create a second
  patient-state store from #1745.
- **MCP Phase B interoperability/terminology — PR #1807, head
  `95307ea118258f227c901f1df675b6b1d6efce54`.** Bounded FHIR R4 inspection,
  SATUSEHAT preview-only Bundle building, bounded HL7 v2 preview conversion,
  truthful ICD fallback identity, RxNorm RxCUI resolution, explicit-only ATC,
  verified local LOINC registry and fail-closed crosswalks. Preserve zero
  patient-store reads, zero SATUSEHAT submission and zero remote clinical writes.
- **Body Exposure evidence increments — PR #1808 head
  `e2c6d13ca96f5a4937e3b3dd58e9fe12544fda13` (skeletal-muscle EC coupling)
  and PR #1809 head `21ba7000a62d58da95a28e3caa204226c61fc545`
  (integumentary barrier/aging).** Generic education only; preserve PubMed
  provenance, semantic-anchor boundaries and no patient-specific inference.
- **Coach energy/training visualization — PR #1810, head
  `44e3b3c73832b5cb23653ba1fd2c7bc2cd8fc0f3`.** Atwater 4/4/9 energy
  accounting and weekly training visualization replay. Keep training duration as
  estimate, not patient-specific exercise prescription.
- **Functional widgets + Assistive Touch — PR #1812, head
  `e4f340adab28e053bd93a94f8d6127036e261dbf`.** Fresh byte-for-byte replay
  of #1799 after a tree-level audit proved all 25 current-main paths were still
  identical to the old base. Require fresh exact-head gates and final latest-main
  overlap audit; #1799 is superseded and closed.
- **Coordination queue itself — PR #1811.** Keep this section current when active
  PR numbers or blockers move; documentation must not become an authority for
  stale CI or stale branch state.

### Long-running lanes that must not be lost

- **Neural Intent follow-on:** Phase A landed through #1795. Phase B must bridge
  IntentEvent into the canonical longitudinal kernel from #1805 (or its eventual
  merged successor), reusing provenance, consent, clinician-review and AI-context
  policies. Phase C must mount the Intent workspace inside existing **Your Body**,
  not create another top-level route, and must retain explicit/observed/decoded/
  simulated labels plus 390x844 and Body/WebGL acceptance.
- **Longitudinal product bridge:** after #1805 settles, rework #1745 as adapters and
  UI/runtime bridges into the canonical kernel; do **not** transplant its separate
  `longitudinalPatientState.ts` as another source of truth.
- **PANACEA PRIME / EDGE:** re-resolve #1768, #1770 and #1767. Preserve user-owned
  goals, recovery/safety precedence, evidence hierarchy, and non-persuasive
  treatment of political/worldview material.
- **Plugin control plane:** re-resolve #1758 before adding another connector
  abstraction so plugin permissions, consent and tool routing stay centralized.
- **Body whole-body maturation:** continue whole-body → system → organ → tissue →
  cell → organelle → molecular pathway → protein → RNA → DNA/epigenome. Anatomy
  representation coverage is not proof of anatomical accuracy; qualified human
  review and provenance remain separate gates.

### Duplicate/stale-lane hygiene

Fresh replacements currently supersede and close #1797, #1798, #1799, #1800,
#1801 and #1803. Before reviving any earlier validation-only or duplicate branch,
compare changed paths and ancestry against #1805/#1807/#1808/#1809/#1810/#1812
and current main. Also re-check #1762, #1763 and #1759 against the active UI lane.


## Shared policy

Read and follow `AGENTS.md` as the cross-agent operating policy. If this file and
`AGENTS.md` conflict on Git/CI coordination, follow the safer rule: short-lived
branch → PR → exact-head gates → final latest-main audit → merge.
