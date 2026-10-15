# Verifying a screen in a real browser (390×844)

**Why earlier attempts "could not verify the UI":** the app uses `HashRouter` and most screens need a saved session.
Opening `/owner-analytics` (no `#`) or opening a route with no session renders the Home / landing page for *every*
route, which looks like a browser problem but is not. Open `/#/owner-analytics` with a session in `localStorage`.

## Recipe

```bash
npm run build && npx vite preview --port 4399 --strictPort &
export PLAYWRIGHT_MODULE=<path to playwright/index.mjs> CHROMIUM_PATH=<chromium executable>
node scripts/qa/route-mobile-probe.mjs /owner-analytics          # 390x844 by default
node scripts/qa/route-mobile-probe.mjs /data-lab-advanced --width 390 --height 844
```

`scripts/qa/route-mobile-probe.mjs` injects a **synthetic** owner session (no real data, ephemeral browser context),
opens `/#/<route>`, and prints hash, first `h1`, horizontal overflow in px, every input's value and size, page
errors, and the first 600 characters of text. It exits `1` with `OVERFLOW_HORIZONTAL`, `ERRO_DE_PAGINA` or
`ROTA_DIVERGENTE`, and `2` with `ROTA_INVALIDA`. For interactions (typing, clicking tabs) write a short Playwright
script with the same session snippet; see `qa/lab-result-review-clinician-e2e.mjs` for a full example.

`--inject "<js>"` runs JS before measuring. It exists so the three detectors can be proven to fail by name
(`document.body.style.minWidth='900px'` → overflow; `setTimeout(()=>{throw new Error('boom')},0)` → page error;
`location.hash='#/x'` → diverged route).

## What was measured with it (main `cf008e32`, 2026-10-12, 390×844, Chromium)

- Owner Analytics: horizontal overflow 0 px; 8 numeric/text inputs start empty, each 42 px high; "No audit yet" lists six
  per-field messages; valid entries show a score; an alt-image count above total images is refused; the A/B tab
  starts empty ("No result yet"), 5 % + 1 pp needs 8,150 per group, 200/4000 vs 232/4000 gives p = 0.1134, conversions above
  visitors are refused; a blank segmentation add stores nothing, a valid add stores one row; no page errors.
- Data Lab Advanced: overflow 0 px; PhenoAge starts with ten empty fields and names all ten as missing; omega-3 = 0 is
  refused; 12000 : 1000 mg shows the high band; no page errors.
- **Not caused by those changes, found while measuring:** Data Lab's *Blood Panel Forecaster* opens with example values
  (90, 92, 95) and already prints a five-year projection. That is an invented starting state of the same kind the
  empty-field ratchet removes elsewhere; it is not counted by the ratchet because it is not `Number(x) || 0`.
- Sports Lab (`/#/latihan?t=sportlab`, main `4242cabd`): overflow 0 px, no page errors. "Add player" opens 12 empty fields (42 px
  high); saving blank shows 11 per-field `role=alert` messages (first: "Name: required"); age 9 shows "Age: 10–60"; pass accuracy 101
  shows "0–100"; a valid entry is saved and listed.
- **Not reachable, so not measurable:** `src/pages/MacroLab.tsx` (the economics lab: policy simulator, trade analysis) has no route.
  `/macro-lab` redirects to the nutrition Macros tab, the build has no `MacroLab-*.js` chunk, and the file is listed in
  `scripts/uji/permukaan-tak-terjangkau.mts`. Input fixes made there (#2322, #2421) are tested at source level only.
- Training target (#2452), `/#/latihan?t=pelatih` and `/#/latihan?t=analisis`, main `40c04273`: overflow 0 px, no page errors, input
  42 px high. With three stored runs the card shows "5 / 20 km | 25%". Clearing the field, entering 0, -3 or 100001 shows
  "Enter a target of at least 1" / "Target must be 1–100000" plus "Showing your last saved target: 20" and the progress stays
  5 / 20 km (a blank field no longer reads as "on track"); entering 30 gives "5 / 30 km | 17%" and stores `{"nilai":30}`.
  Fixture: the synthetic session needs a `patientId`, otherwise personal-health storage is refused and the screen shows
  "0 sessions". Seed `pmd_workouts_v1:scope_v1:<encodeURIComponent(JSON.stringify([accountId, patientId]))>` with
  `{version:1, ownerAccountId, subjectId, items:[{id, nama, mulai, selesai, durasi, jarakKm, hr:[{t,bpm}…], pemulihan:[]}]}`.

Limits: inputs are 42 px high (below a 44 px touch target); this is a technical measurement, not an accessibility or
clinical review.
