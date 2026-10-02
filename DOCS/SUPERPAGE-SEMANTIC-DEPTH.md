# Panaceamed semantic-depth super-pages — implementation brief for Claude Code

Owner direction: 2026-09-18.

## Product intent

Use the supplied references as interaction/visual direction, not as assets to copy. The product should feel like one health operating system where the user sees a simple, visual surface first and can progressively reveal much deeper detail.

The key principle is **more detail as the user drills in**, but only Body Exposure should use literal camera/representation semantic zoom. Clinical, Your Body, AI-EMR and For You should use domain-appropriate drill-down or progressive disclosure so the interface never implies false optical magnification or false clinical certainty.

## Shared rules

1. Preserve the current main branch and already-landed work. Integrate; do not create competing duplicate super-pages.
2. Primary scrolling surfaces are visual-first: anatomy, charts, numbers, timelines, scores, media and compact controls.
3. Keep persistent explanatory copy to **one concise sentence per visible widget/item**. The sentence may wrap responsively, but it must remain one sentence.
4. Put interpretation behind **Info / Interpret / Why / Evidence** and keep that disclosure to one short paragraph unless the user explicitly opens a deeper reference.
5. Safety-critical warnings, contraindications and emergency escalation are exempt from brevity when hiding them would be unsafe.
6. Maintain two-step access to important capabilities.
7. Preserve provenance, timestamp, units, confidence and source identity. Never fabricate connected-device data, clinical evidence, reviewer identity or successful integrations.
8. External adapters such as Spotify and Apple Music must fail explicitly when credentials/authorization are unavailable.
9. Keep motion functional: focus, hierarchy, direct manipulation, state change and spatial continuity. Respect reduced motion.
10. Keep the system device-independent. Wearables enrich Your Body; they are not required for basic operation.

## 1. Your Body — daily physiology / health OS

Your Body is the user's day-to-day physiology and fitness operating system, analogous in information density to WHOOP/Garmin but not dependent on either device.

Primary content should be:
- recovery/readiness and sleep;
- running/cycling/swimming and workout sessions;
- push-up, sit-up, calisthenics and strength volume;
- pace, distance, duration, HR/HRV when available, zones, load, recovery and trends;
- body composition and personal 3D body context;
- nutrition/hydration and longitudinal personal health signals;
- source/device confidence and data gaps.

Depth model:
**Today → domain → metric → session → sample/event → source/provenance.**

Rules:
- charts/numbers first;
- do not replace a missing measurement with a fake score;
- every derived score must expose its inputs/formula and confidence;
- wearable-specific fields stay adapter-owned and source-labelled;
- Body Exposure remains the anatomical/scientific deep explorer inside the same body context, not a separate identity.

## 2. Body Exposure — semantic zoom from human to DNA

Preserve and mature the current semantic-zoom engine:
**whole body → system → organ → tissue → cell → organelle → molecule/pathway → genome/DNA.**

Zoom must switch representation/LOD when source resolution changes. Never enlarge a gross mesh and call it microanatomy. Preserve selected system/organ context across scale transitions only when a validated cross-scale relationship exists; otherwise show a source-resolution boundary.

Required behaviors over time:
- orbit/pan/pinch/wheel;
- select, focus, isolate, fade, hide/show;
- layer peeling and exploded anatomy;
- clipping/cross-section;
- source-aware labels and units;
- progressive asset streaming and mobile degradation;
- physiology/pathophysiology/pharmacology/imaging overlays tied to the same selected structure;
- explicit reference/simulated/measured/derived status.

## 3. Clinical — clinical learning and action surface

Clinical is more clinically rigorous than Your Body. It should converge:
- disease/condition education;
- Look & Learn;
- examination and diagnostic reasoning;
- calculators and clinical scores;
- labs and imaging context;
- treatment/management pathways;
- drug mechanism and dosing references;
- ICD-11 coding context;
- evidence/guidelines and source provenance.

Depth model:
**overview → condition → mechanism → assessment → management → coding → evidence.**

The main surface should show compact actions, decision paths, diagrams, calculators and visual summaries. Long prose belongs behind education/evidence disclosure.

Clinical content must preserve:
- clinician-in-loop boundaries;
- reference vs patient-specific distinction;
- dosing units, population constraints and contraindication visibility;
- source/version/date;
- academic review gates and explicit uncertainty.

Do not silently convert educational material into patient-specific treatment.

## 4. AI-EMR — longitudinal clinical source of truth

AI-EMR is not a static form page. It is the longitudinal clinical record surface shared with AI Chatbot and Clinical.

Depth model:
**timeline → encounter → problem → observation → structured resource → provenance/audit.**

Implement toward:
- visual longitudinal timeline;
- visit/episode drill-down;
- problem list and ICD context;
- vitals/labs/imaging/exam observations;
- medication/orders/plan;
- AI suggestions clearly separated from clinician-authored/verified content;
- FHIR/SATUSEHAT-compatible resource inspection where supported;
- author, timestamp, source, confidence, verification and change history;
- two-way patient-state synchronization with Clinical, Your Body and AI Chatbot.

Never represent generic atlas geometry or an AI suggestion as measured patient anatomy/diagnosis. Signing and clinician verification remain explicit.

## 5. For You — fun daily stack, not another medical dashboard

For You is a compact, engaging daily stack. Candidate widgets:
- Spotify / Apple Music adapter card;
- live sports scores;
- faith, prayer/adzan and scripture;
- mental wellbeing and private check-ins;
- motivation;
- library/books/materials;
- stories;
- social/community;
- finance/markets when already supported;
- activity/sport highlights.

For sports/activity inside For You, the scrolling surface must be **graphics and numbers first**: score, pace, distance, load, reps, minutes, trend, zone or recovery. Keep visible text to one sentence; an Info action may reveal one short paragraph.

Do not fake Apple Music/Spotify connectivity. Add adapters behind explicit connection state, auth scopes and unavailable/error states.

## Shared engineering target

Use `src/lib/surfaceSemanticDepth.ts` as the product-level contract and `src/lib/forYouWidgetCatalog.ts` as the initial For You stack catalog. Body Exposure's physical interaction thresholds remain owned by `src/lib/bodySemanticZoom.ts`; do not duplicate those thresholds in another renderer.

The next implementation slices should be small and coherent:
1. connect Your Body sections to the shared depth contract and make formulas/provenance inspectable;
2. converge Clinical modules around the clinical depth ladder without deleting existing routes;
3. add an AI-EMR timeline/provenance lens over the existing record state and `emrPipeline`;
4. render For You from a widget registry and add explicit adapter states for music providers;
5. bind all four surfaces to the same longitudinal patient-state/event model;
6. only then expand deeper 3D/molecular assets and external integrations.

## Acceptance expectations

- Build/typecheck remains green.
- No existing capability is deleted merely to simplify the surface.
- No fake integrations or fake biomedical precision.
- Main scrolling UI follows visual-first + one-sentence rule.
- Info/Interpret disclosure is short, contextual and source-aware.
- Body semantic zoom fails closed at unsupported resolution.
- Clinical/EMR AI outputs remain distinguishable from clinician-verified facts.
- Mobile 390x844 and desktop remain usable.
- Any new long-running blocker goes into CLAUDE.md with a concrete dependency and next action.
