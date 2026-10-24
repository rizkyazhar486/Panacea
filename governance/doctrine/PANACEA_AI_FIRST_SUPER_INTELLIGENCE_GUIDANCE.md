# PanaceaMed AI-First Super Intelligence Development Guidance

> **Owner direction — 2026-10-23.** PanaceaMed is developed and operated through AI-first orchestration. This guidance is model-agnostic and applies to Argon, DeepSeek, Astra, Claude Code, and successor agents. Read the current `docs/governance/AGENT_ENTRYPOINT.md`, root `AGENTS.md`, task board, acceptance V2 and current repository policies before using this complementary doctrine. Latest explicit owner instruction and hard safety rules outrank this document. This proposal does not silently overwrite existing governance or authorize unsafe clinical operation.

## 1. Operating doctrine

- **AI executes by default:** architecture, mapping, implementation, refactoring, documentation, tests, CI troubleshooting, issue triage, release preparation, evidence capture, and safe PR integration are agent responsibilities. Do not wait for human checklist completion to perform tasks within authorized scope.
- **Human involvement is flexible and exception-driven:** offer optional in-product attestations/checklists for owner choices, acceptance of business tradeoffs, and other decisions. Do not require a human to manually perform an AI-executable test or fill a checklist to unlock engineering progress.
- **No invented authority:** optional human review cannot waive applicable law, third-party license terms, real consent, credential checks, clinical authorization, independent review where required, or GitHub branch protection. If authorization is genuinely required, isolate it as a specific external gate while other AI work continues.
- **Evidence, not confidence:** model consensus, self-assigned scores, subjective completion percentages, and fabricated approvals are not verification. Each completed task must link exact SHA, test evidence, and scope.
- **No silent feature deletion or clinical claim inflation.** Preserve existing features and distinguish engineering acceptance from clinical validation and production patient use.

## 2. Super Intelligence capability router

Use the strongest available capabilities across models/tools, without coupling tasks to one vendor:

| Capability | AI responsibilities | Required evidence |
| --- | --- | --- |
| Systems reasoning and architecture | Map modules, dependencies, data flow, risk, and delivery sequencing | Updated architecture map and code references |
| Repository engineering | Reproduce defects; implement smallest safe patch; add regression tests | Diff, failing-before/passing-after tests |
| Medical and scientific reasoning | Research and implement traceable formulas, anatomy, simulations, and source checks | Citations, numeric tests, uncertainty and clinical-use limits |
| Security and privacy | Threat model, RBAC, tenancy isolation, PHI leak tests, secrets scanning | Positive and negative controls; no sensitive logs |
| UX and visual intelligence | Mobile, accessibility, journeys, 3D anatomy, visual regression | Browser tests, screenshots, measurable criteria |
| Quality and release intelligence | Exact-head CI, ancestry, deployment artifact tracking, rollback | Workflow IDs, commit SHA, release evidence |
| Agent coordination | Select appropriate model, delegate bounded tasks, reconcile conflicting outputs | Single accountable owner per task; recorded decisions |

Use cheaper models for bounded mechanical work and stronger reasoning for architecture, clinical-safety analysis, security, and difficult debugging. Do not duplicate full-repository audits without a changed SHA or new evidence.

## 3. Universal task contract

Every task, including future work, must define:
1. **Outcome:** specific user/product value and scoped files or feature.
2. **Inputs:** current `main` SHA, existing implementation, relevant constraints.
3. **Acceptance:** executable commands and deterministic positive/negative tests; explicit expected behavior.
4. **Evidence:** exact commit, test logs, artifacts, and applicable source/provenance records.
5. **Risk:** security, privacy, clinical, legal, accessibility, and rollback impact.
6. **Dependencies:** machine-solvable blockers versus specific external authorization.
7. **Exit:** `PASS`, `FAIL`, or `NOT_RUN` under the canonical `governance/ACCEPTANCE_V2.json` engineering criteria, with SHA, CI run/job IDs and supporting evidence. Distinct deferred external gates remain `DEFERRED_FINAL_STAGE` under `docs/governance/EXTERNAL_GATES.md`; do not conflate engineering PASS with clinical/production approval.

A task must be small enough to reach a concrete change or precise external blocker in one work cycle. Prefer vertical slices over broad percentage-based tasks.

## 4. Execution loop (mandatory)

1. Inspect `main`, relevant PRs, acceptance contract, and first real failing check.
2. Reproduce once; record root cause. Avoid repeated speculative audits.
3. Implement the minimum safe correction and a regression test.
4. Run targeted checks first, then relevant integration and exact-head required CI.
5. Verify PR ancestry, overlap, review requirements, and branch protection.
6. Merge only when permitted and checks are current; never force or bypass protection.
7. Re-read `main`, confirm the change is present, and update evidence.
8. Continue the next independent task automatically within granted execution scope.

When an external decision is required, create a concise decision request, mark only that external gate blocked, and continue independent AI work. Never mark it approved by assumption.

## 5. Flexible in-product human review

Implement a **non-blocking by default** owner/reviewer checklist within the product when useful, with:
- task ID, version, plain-language description, scope, evidence links, and applicable terms;
- options **Approve**, **Request changes**, **Defer**, **Not applicable**, each with timestamp, identity/role where available, and audit trail;
- explicit distinction between voluntary product feedback and legally/clinically required authorization;
- no default checked boxes, implied consent, AI-generated human signatures, or bypass of genuine mandatory gates;
- graceful operation when no human review is provided: engineering tasks continue; dependent restricted actions remain disabled until their actual authorization exists.

A checkbox does not itself confer a license, professional credential, patient consent, or clinical validation. Use policy-specific enforcement for those actions.

## 6. Acceptance, stabilization, and verification

- Design **AI-completable engineering criteria** separately from **external authorization** and **clinical validation** gates.
- Require tests with deterministic fixtures, positive/negative controls, no PHI leakage, reproducible commands, and artifacts tied to exact SHAs.
- Keep old acceptance history intact and publish an explicit versioned mapping when redefining criteria or denominator. Never manufacture progress by moving hard tasks out of scope.
- Stabilization runs fast targeted tests before full CI. Revalidate if `main` moves.
- Verification is earned only for the precise scope tested; production, legal, or clinical claims require their own evidence.
- C6 and other medical features may complete engineering validation independently while remaining restricted from unapproved clinical use.

## 7. Safety and product boundaries

PanaceaMed's AI-first operation does not mean unsupervised patient-facing diagnosis, prescribing, clinical signing, emergency triage, disclosure of PHI, or regulated medical-device deployment. Maintain clinician-centered controls, role permissions, consent, auditability, rollback, and applicable legal/regulatory requirements. Any action requiring a licensed clinician, data subject, rights holder, or authorized operator must not be simulated by an AI agent.

## 8. Agent handoff format

Each agent must leave a short machine-readable or Markdown handoff containing:
- task ID and outcome;
- base/head/main SHAs and touched files;
- exact commands/results and first remaining failure;
- risks and rollback;
- external decisions only if truly necessary;
- one next executable step.

**Definition of success:** meaningful, tested code integrated into `main` with truthful evidence, minimal token/CI waste, and no unnecessary human checklist dependency. This document guides AI execution; it does not supersede binding legal, security, clinical, or repository protection rules.

## 9. Canonical execution pointers (keep this doctrine secondary)

- [Agent entrypoint](../../docs/governance/AGENT_ENTRYPOINT.md): precedence, one-task workflow, same-head tests and handoff.
- [Task Board](../../docs/governance/TASK_BOARD.md): ownership and non-overlap; agents do not take over each other's branch except per the owner-designated Claude integration lane.
- [Capability router](../../docs/governance/SUPER_INTELLIGENCE_CAPABILITIES.md): seven capabilities, tiers and task classes.
- [Acceptance V2](../ACCEPTANCE_V2.json): formal PASS/FAIL/NOT_RUN engineering evidence and deferred external gates.
- [Optional human verification](../../docs/governance/HUMAN_VERIFICATION_OPTIONAL.md): voluntary in-product feedback; restricted actions require actual authority.

The entrypoint's seven hard rules remain binding. A newer repo rule or a specific owner decision supersedes older implementation examples in this document.
