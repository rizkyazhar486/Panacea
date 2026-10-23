# Super Intelligence Capability Router

Machine-readable source: [`governance/TASK_CATALOG.json`](../../governance/TASK_CATALOG.json), validated by `node --test scripts/qa/task-catalog.test.mjs`. Companion policy text: `governance/doctrine/PANACEA_AI_FIRST_SUPER_INTELLIGENCE_GUIDANCE.md`.

## Capability vocabulary (the seven)
| Id | Meaning | Honest self-check |
|---|---|---|
| `systems-reasoning` | Map modules, data flow, dependencies, risk, sequencing | Can I name the files and the first failing step? |
| `repo-engineering` | Reproduce, minimal patch, regression test | Do I have a failing-before / passing-after pair? |
| `medical-scientific` | Traceable formulas, anatomy, physiology, sources, uncertainty | Is every constant sourced, with units and limits? |
| `security-privacy` | Threat model, RBAC, tenancy, PHI-leak tests | Is there a negative test per rule? |
| `ux-visual` | Mobile, accessibility, 3D/visual regression | Did I measure at 390x844 and 1440x900? |
| `release-quality` | Exact-head CI, ancestry, deploy/rollback evidence | Is the evidence tied to the exact SHA? |
| `agent-coordination` | Delegate, reconcile, avoid overlap | Did I check open PRs for file overlap? |

## Model tiers (capability, not brand)
| Tier | Use for | Examples |
|---|---|---|
| **S1** | bounded mechanical work with a clear test | rename, baseline refresh with proof, log triage |
| **S2** | standard engineering | feature slice, bug fix, test authoring, CI fixes |
| **S3** | deep reasoning | architecture, security/RBAC, clinical-safety analysis, hard debugging, anything touching patient data or medical numbers |

Route by *validated* capability: if a model fails a task's negative controls, move the task up a tier. Never assume a tier from a model's name, version or marketing.

## Task classes
Generated from the catalog; each class states the mandatory capabilities, minimum tier, evidence to leave, and prohibitions.

| Class | Min tier | Capabilities | Must leave | Never |
|---|---|---|---|---|
| `ci-failure` | S2 | systems-reasoning, repo-engineering, release-quality | first failing step + root cause, fix, exact-head green | disable or retry-until-green |
| `dependency-security` | S2 | security-privacy, repo-engineering | advisory ids, gate output before/after, test run | add an acceptance to hide a high advisory |
| `rbac-privacy` | S3 | security-privacy, systems-reasoning, repo-engineering | positive + negative authz tests, no-PHI-in-logs proof | silently widen or narrow an access policy |
| `clinical-calculator` | S3 | medical-scientific, repo-engineering, security-privacy | source, units, golden cases, fail-closed negatives | state clinical validity or invent constants |
| `body-3d-anatomy` | S3 | medical-scientific, ux-visual, systems-reasoning | provenance per asset, truth-class labels, render proof | present atlas as patient anatomy |
| `ux-accessibility` | S2 | ux-visual, repo-engineering | measured numbers at both viewports, baseline unchanged or improved | relax WCAG thresholds |
| `release-deploy` | S3 | release-quality, systems-reasoning, security-privacy | deployed SHA vs main classification, smoke, rollback | claim "deployed" without a marker |
| `asset-provenance` | S2 | medical-scientific, repo-engineering | source/licence/hash inventory | assert ownership or licence |
| `research-evidence` | S3 | medical-scientific, systems-reasoning | primary-source links, uncertainty, what is unknown | cite from memory or fabricate |
| `governance-process` | S2 | systems-reasoning, agent-coordination | validator green, sabotage shown | remove a hard gate or hide one by re-scoping |
| `human-review-feature` | S3 | security-privacy, ux-visual, repo-engineering | audit-trail tests, no-default-checked proof | let AI author or edit a human record |

## Human review in the router
Every class carries `humanReview.mode`: `optional` (a person may leave a voluntary review) or `none`. It is **never** `required` for engineering completion. Classes that touch law, licence, consent or clinical validity point to a deferred gate id from `ACCEPTANCE_V2.json` instead of asking anyone now.
