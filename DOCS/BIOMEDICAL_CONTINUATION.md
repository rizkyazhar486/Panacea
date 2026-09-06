# Biomedical Continuation and Claude Handoff

Updated: 2026-09-06. Primary repository: `rizkyazhar486/Panacea`.

## Actual State

- Latest Claude work synchronized locally from main `513e6d4`: molecular pharmacology, cardiovascular flow, specialty pathology, licensed organ geometry and athlete science.
- `PanaceaMed-v2` is a comparison source, not a second deployment target. Do not merge it wholesale.
- Security work is a separate batch with automated regression tests. No new complete biomedical integration or Blender animation is claimed by this batch.
- Claude Code is used on the web/app. No direct authenticated Claude session is available locally. Coordinate through this file and small reviewed commits; never assume simultaneous agents edited the same file safely.
- A one-time continuation is scheduled in the Codex task for the next 11:00 local time, intended as 2026-09-07 11:00 Asia/Jakarta. The user requested Astra Max for complex visualization. The heartbeat does not set a model; verify the task model before that phase.
- GitHub authentication was unavailable on this machine at the last check. Read access works, push does not. Never claim a local commit has been published.
- Blender was not found at `/Applications/Blender.app/Contents/MacOS/Blender`; check for another installation before requesting installation. No Blender assets were generated in this batch.

## Execution Order

1. Re-read `AGENTS.md` and `CLAUDE.md`. Check the worktree, fetch remote state and preserve Claude/user changes. Finish and test any pending local security work before adding visual changes.
2. Reproduce failed modules against the actual app and record route, input, expected result, console/network failure and upstream status. A repository link is not an implemented feature.
3. Audit existing `BodyExplorer`, `CardioLab`, `SpecialtyLab`, `MolecularLab`, `AthleteScience`, `AtlasViewer3D`, `CardioAtlas3D` and `Molecule3D`. Preserve their real geometry, molecular coordinates and attribution.
4. Polish lighting, materials, clipping, framing, hit targets and label placement. Add explicit play/pause, scrubber, speed, reset view, accessible selection and reduced-motion behavior where missing. Release GPU resources and cancel work on unmount; verify repeated model switching.
5. Build reproducible Blender-to-glTF assets only where rigging, deformation or baked animation is needed. Commit source/build scripts and asset provenance. Use Three.js for browser rendering; do not imply that a pulsing static mesh is a validated physiological simulation.
6. Connect organ physiology to workout demand: cardiovascular flow, breathing and gas exchange, skeletal muscle ATP demand, recovery and endocrine/glucose regulation. Reuse explanations already written by Claude; organize normal state, mechanism, perturbation, complications and evidence consistently.
7. Extend cellular modules: cell-cycle stages and checkpoints, glycolysis, pyruvate oxidation, citric-acid cycle, electron transport, chemiosmosis, ATP production and glucose handling. Distinguish location, substrates/products, regulation and educational animation. Verify mechanisms and quantitative claims against primary or authoritative scientific sources.
8. Complete workout automation from `WORKOUT_ATHLETICS_AUTOMATION_SPEC.md`: normalized inputs, validation, reproducible metrics, confidence, physiology interpretation and QA output. Do not infer precise energy-system percentages, disease or VO2max from insufficient data.
9. Repair terminology and drugs: `server/src/icd11.ts`, `drugInfo.ts`, `openfda.ts`, `rxnorm.ts`, `rxclass.ts` and their UI consumers. Test empty queries, non-English synonyms, no results, network errors, throttling, stale requests and successful results. Do not silently label ICD-10-CM as ICD-11. WHO credentials belong only on the server. Check current WHO release/API documentation before updating the pinned release.
10. Integrate upstream tools by small functional adapters with tests, not by blindly copying repositories or model weights. Separate browser packages, external research runtimes, datasets and clinical services. Record exact versions, license/data-use constraints, provenance, clinical validation and the actual blocker.

## Repository Coverage Queue

These are user-supplied candidates, not a declaration that all exist, are safe,
are licensed for redistribution or are already integrated. Reverify canonical
URLs and licenses. Track each as `unverified`, `ready`, `in-progress`, `tested`,
or `blocked` with evidence and next action. The larger reference atlas in
`docs/rujukan/BIOMEDICAL_OPEN_SOURCE_ATLAS.md` and the RSNA reference list are
also part of the review queue, not automatic runtime dependencies.

| Area | User-supplied repositories |
| --- | --- |
| Anatomy and molecular | ashemag/human-atlas; epam/miew; ayush00git/ProtPocket; sammwyy/biovis |
| Cells and expression | chanzuckerberg/cellxgene; holab-hku/starmapVis; agkirici/gene-expression-atlas; TheDongLab/VizIt; ChengLiLab/SCALE; broadinstitute/cell-health |
| Drugs and oncology | idekerlab/DrugCell; romeo111/OpenOnco; Onco-Logic/Onco-Logic; griffithlab/civic-v2; dotdigitize/phuckcancer |
| Wearables and performance | apple/ml-heart-rate-models; sdimi/cardiofitness; b55585wy/wearable-health-research; Boyonbike/oAM-openAthleteMetrics; physusp/physusp; Vide-c-hole/wearable-bio-age; jackie-jiaqi-yin/MotionAge |
| Aging | tgirke/longevityTools; longevity-genie/longevity-forest; exprick/bio-age; keyserfaty/aging-synthesis; dayoonkwon/BioAge; Healome/openage |
| Clinical workflows | chadepickering/clinical_trial_eligibility; openEHR/gdl-guideline-models; healthkey-ai/promop; health-assistant-io/health-assistant; pavanbadempet/AI-Healthcare-System; galinilin/docgemma-connect; ClinicDx/ClinicDx; SayamAlt/Healthcare-AI-Clinical-Decision-Support-System-using-LangGraph |
| Interoperability | openFHIR/openfhir; FHIR/genomics-operations; GoogleCloudPlatform/smart-on-fhir; jmandel/smart-imaging; callahantiff/OMOP2OBO |
| Resolve exact repository first | HumanDNAVisualizer; FastOMOP/OMCP; SMART on FHIR (organization or client not yet specified) |

Reconcile this queue against all four pasted lists in the task, including the
consolidated final attachment. Add missing candidates instead of silently
dropping them. Record upstream failure separately from local integration failure.

## Acceptance and Shipping

Current batch verification: root typecheck and production build passed; server
typecheck and all six test suites passed (including 12 new security cases).
Both dependency audits reported zero known vulnerabilities after updates.
Browser smoke check covered the login form at 390x844 with no horizontal
overflow or console errors. Authenticated 3D/camera/consent flows were NOT
verified in the browser and remain release checks. The build still warns about
large existing chunks and 16 SKDI rows without notes; these are not resolved.

- Targeted domain tests first; then root typecheck/build and all `server` tests required by `CLAUDE.md`.
- Browser verification at desktop and 390x844: nonblank canvas and real assets, animation changes over time, pause stability, selection, reset, model changes, missing asset/WebGL fallback, reduced motion and no overlapping text.
- Use synthetic data for testing. Patient data must not be copied to third-party AI/model services without explicit authorization.
- Document remaining credential, data-license, deployment, GPU/runtime and validation blockers. Do not turn blocked tools into fake successful predictions.
- Commit only coherent tested batches. Refresh remote refs immediately before push. Push main and the Claude branch only when history permits a non-destructive merge; never force push.
- Give the user the actual commit and push result. Completion of a registry or plan is not completion of every integration.

## Security Deployment Notes

- Production now requires a non-default JWT secret of at least 32 characters. Tokens expire in eight hours; logout revokes existing tokens. Existing sessions need to sign in again.
- `ALLOW_DEV_LOGIN=true` and `ALLOW_MOCK_PAYMENTS=true` are explicit local-development options only. Both remain disabled in production. Configure trusted `CORS_ORIGINS` for cookie mutations.
- Patient access is explicit. New self records use `self-<user-id>`. Legacy records without an identity mapping are intentionally hidden, not deleted. Before deployment, back up the data and reconcile legacy patient identity with a reviewed mapping; never guess ownership from a truncated email or grant all clinicians access.
- Patient owners can grant or revoke a verified clinician through `POST /api/clinical/access` with `patientId`, `practitionerId`, and `action` (`grant` or `revoke`). A full consent-management UI and reviewed legacy migration remain follow-up requirements.
- WebSocket tickets are short-lived and obtained from authenticated `/api/realtime/ticket`. Exact registered peer names must resolve unambiguously. Legacy arbitrary room names and sender claims are rejected. A future stable-ID contact selection flow should replace name lookup.
- Backend-enabled browser state no longer persists bearer tokens or clinical records in local storage. The standalone demo retains its local-data behavior.
- Withdrawal balance is reserved before contacting the provider. An ambiguous provider failure keeps the reservation and returns `payout_pending_review`; reconcile against provider records before refunding or retrying. Do not automatically release a possibly-paid reservation.
- Dependency overrides for `qs` and gaxios' `uuid` address published advisories while retaining Express 4. Reassess when upstream releases remove the need for overrides.
- This is targeted hardening, not a complete penetration test, compliance certification or production-readiness signoff. Remaining reviews include distributed transaction durability, authorization on second opinions/moderation, proxy trust, request-body limits, rate-limit storage, camera-consent handling, consent UI and migration.
