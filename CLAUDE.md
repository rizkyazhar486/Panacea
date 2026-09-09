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

## Shared policy

Read and follow `AGENTS.md` as the cross-agent operating policy. If this file and
`AGENTS.md` conflict on Git/CI coordination, follow the safer rule: short-lived
branch → PR → exact-head gates → final latest-main audit → merge.
