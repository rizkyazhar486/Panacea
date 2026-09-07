# Physiology mechanism explorer

Entry: Body Exposure > Physiology (`/body-explorer?mode=physiology`). A specific topic is addressable with `&physiology=spirometry`, for example.

## Implemented

23 source-linked teaching topics cover vision, hearing, smell, voice, UMN/LMN, synaptic transmission, BBB, cardiac relationships, cardiopulmonary exchange, spirometry, shock, ADH, HPA, renal/RAAS, electrolytes, insulin, digestion, hepatic carbohydrate metabolism, protein metabolism, hemostasis, temperature/fever, immunity and allergy.

Each has four selectable stages, an explicitly schematic Three.js mechanism diagram, manual play/pause/scrub/speed controls, a recall question, model limitations and a textbook reference. Related HRA source lookup reuses the existing remote resolver on explicit request; unavailable or unmatched models are not fabricated. Static lessons remain usable without that API.

Cardiovascular calculations expose SV, CO, EF, mean pressure and mean ejection flow with units and independent user inputs. Spirometry uses a declared synthetic exponential volume-time relationship and its derivative. Neither is a patient prediction or diagnostic instrument.

## Verification

- Frontend type check and production build passed; existing large-chunk warnings remain.
- All 67 top-level regression results passed, including topic completeness, unit relationships, invalid input rejection and synthetic curve checks.
- Headless Chrome with an isolated profile: 1440x1000 and 390x844 screenshots inspected; nonblank canvas pixel checks passed (1242 and 1101 sampled colors); paused screenshots were identical.
- All 23 topic transitions, search, quantitative panels and browser error checks passed.
- Reproducible browser check: `qa/physiology-check.mjs`, with `PLAYWRIGHT_MODULE` pointing to the installed Playwright module and optionally `CHROME_PATH` / `QA_URL`. The standalone QA fixture is development-only and does not initialize an account or patient store.

## Not complete

This is a mechanism-explorer foundation, NOT completion of all requested high-definition organ-specific physiology. The 3D nodes represent concepts, not eyes, ears, nephrons or other anatomical structures. HRA source links do not imply a mechanism has a fitted anatomical simulation.

Still required for that larger goal: detailed organ-specific geometry with mechanism localization; calibrated optics/cochlear mechanics; electrophysiological and neurovascular solvers; coupled cardiopulmonary-renal feedback; validated endocrine/metabolic/immune models; measured spirometry import and quality control; independent specialist review. No clinical use or perfect-human simulation claim is warranted.

Git publication must be checked separately. Local GitHub authentication was unavailable during this run.
