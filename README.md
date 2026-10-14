# Panaceamed.id — Computational Human Platform

One longitudinal patient state — daily life, outpatient care, ward, OR, ICU,
follow-up — projected into AI-EMR, Clinical, Body Exposure, sport/performance
and longevity surfaces. AI drafts (anamnesis, assessment, education); a
licensed clinician reviews and signs. See [`CLAUDE.md`](CLAUDE.md) for the
full working contract and [`AGENTS.md`](AGENTS.md) for governing doctrine.

> ⚕️ AI supports, never replaces, a licensed clinician. Diagnosis, dosing and
> final plans require clinician verification.

## Tech stack

| | |
| --- | --- |
| Frontend | React + TypeScript + Vite (`src/`), Tailwind CSS v4 |
| Backend | Node + TypeScript, `tsx` runtime (`server/`) |
| Deploy | Vercel (frontend), Render (`render.yaml`, backend) |
| CI | GitHub Actions (`.github/workflows/`) |

## Architecture

Dependency direction is one-way, inward:

```
pages/  →  components/ / domains/*/ui  →  lib/ (pure logic)  →  data/ (constants, corpora)
                                              ↓
                                        lib/api.ts (the only HTTP boundary)
                                              ↓
                              server/src (routes → service → store)
```

- **`lib/`** — domain logic and use-cases. Pure and deterministic: no React,
  no DOM, no direct `fetch`, no hidden `Date.now()`/`Math.random()`. This is
  what makes it testable offline.
- **`components/`** — presentation only. No formulas, clinical rules or
  parsing; calls into `lib/` and renders the result.
- **`pages/`** — composition (routing, lazy-loading, assembling components).
  No domain logic.
- **`domains/`** — newer bounded-context folders (`physiology`,
  `body-exposure`, `clinical-operations`, `lab-results`, `marketplace`, …),
  each holding its own model/engine/data/adapters/ui. This is the target
  shape for the whole codebase; migration is incremental (see below).
- **Server** — `routes` (input validation + auth) → `service` (business
  rules) → `store`/adapter (DB, FHIR, external APIs). Handlers hold no
  business logic; services know nothing about HTTP.

### Current state vs. target

The codebase is mid-migration from a flat structure to the domain-first
layout described in [`CLAUDE.md` §2](CLAUDE.md#2-arsitektur--clean-architecture):

- `src/pages/landing/` is the reference implementation — composed of
  `sections/`, `components/`, isolated data/SVG/CSS files. New domain work
  should follow this pattern.
- `src/pages/` root still holds ~250 files: real pages plus transitional
  one-line re-export stubs (kept so existing imports and tests don't break).
  Newer page groups already live under subfolders (`clinical/`, `emr/`,
  `dashboard/`, `bodyhub/`, `fitness/`, `discovery/`, `medstudy/`).
  Ungrouped pages are being sorted into domain folders incrementally — see
  `scripts/arch/ratchet.mjs` and `lint:arsitektur` for the enforced boundary.
- `src/lib/` is still largely flat (~500 files, some subfolders). Rule: no
  new files land in the flat `lib/` root — new logic goes into
  `src/domains/<domain>/` instead.
- `src/domains/` already holds newer bounded contexts: `physiology`,
  `body-exposure`, `clinical-operations`, `clinical-review`,
  `clinical-calculators`, `lab-results`, `personal-health`, `affect`,
  `training-goals`, `sports-roster`, `club`, `data-lab`, `macro-policy`,
  `marketplace`, `owner-analytics`, `observability`, `wallet`.
- Dependency boundaries are enforced by `dependency-cruiser`
  (`.dependency-cruiser.cjs`, violations ratcheted down via
  `.dependency-cruiser-known-violations.json`), not just convention.

## Run locally

### Frontend only (demo mode, no backend)

```bash
npm install
npm run dev       # http://localhost:5173
```

Without `VITE_API_URL` set, the app runs on seeded `localStorage` demo data —
every screen and flow is explorable offline.

### Frontend + backend

```bash
# 1) backend
cd server
npm install
npm run dev        # http://localhost:8787 (tsx watch)

# 2) frontend, in a separate terminal
cp .env.example .env.local   # sets VITE_API_URL=http://localhost:8787
npm install
npm run dev         # http://localhost:5173
```

### Build & validate

```bash
npm run build       # dozens of gates (registry/feature/academic/capability
                     # validators + unit tests) + tsc -b + vite build — slow
npm run uji          # frontend deterministic test suite
cd server && npm run typecheck && npm run uji   # backend typecheck + tests
npm run lint:arsitektur   # dependency-cruiser boundary check
```

See [`docs/RUN.md`](../docs/RUN.md) (workspace root) for the combined
Panacea + PanaceaMed-v2 run guide, and [`PANDUAN-SETUP.md`](PANDUAN-SETUP.md)
for first-time environment setup details.

## Brand

Logo: red cross + green `tP` letterform. Palette `#00BF63` · `#FF3131` ·
`#000000` · `#FFFFFF`. Typeface: **Montserrat**.
