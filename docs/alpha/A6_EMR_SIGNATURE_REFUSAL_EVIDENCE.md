# A6 — EMR signature refusal boundary

Owner: Sol-Cloud. Base main29d77bc915d0dc04a458974c895320c96a452d85.

The real HTTP regression reproduced a patient's forged signing attempt being silently stripped and saved with200. Such attempts now return403, append emr.signature_refused with authenticated actor/time and leave the stored record unchanged. An administrative-owner session cannot create clinical signatures or close clinical encounters. The verified clinician remains the server-stamped signer; ordinary patient history edits carrying an unchanged previous signature still become unsigned drafts as before.

EMR sign controls and their callback now require the same verified-clinician eligibility used by examination editing. Mandatory clinicalSigningIntegrity and aiDraftApprovalHttp cover patient/owner denials, unchanged stored signed state, actor-attributed refusals, explicit clinician approval and restart persistence. Full encounter and backend suites plus backend/frontend typechecks passed. Exact-head CI must pass before integration.

This is the EMR signing unit, not full A6 closure. Active daily-care plan signature/linkage and A7 signed-plan-derived scheduling remain unfinished. No ledger status promoted and no clinical approval fabricated.

First exact-head CI failed at kunjungan-emr: its wiring assertion required the old owner-capable access helper. The assertion now requires the effective server doctor role; UI closure eligibility also uses canEditExam. Dedicated real HTTP owner/patient refusal tests remain mandatory. Failed runs are preserved; a fresh exact-head CI is required after this repair.

## Daily-care activation and follow-up — 2026-10-15 candidate

Source base: main `12515dbdcb7b5a50ebb17804b4de6f5c168cd697`, with the existing #2529 EMR refusal unit preserved. This candidate closes the previously documented daily-plan activation gap; canonical A6/A7 remain NOT_CHECKED until required gates, review and integration.

A verified clinician must submit literal `signIntent: true`. The server records authenticated actor/time and SHA-256 of the exact plan content; client-provided signatures, authors and times do not supply approval. Missing/false/string/object intent is rejected 409 and audited before any plan replacement. Wrong roles are rejected 403 and audited. Successful signing is separately audited. The approval record is session-bound evidence, not a digital certificate, tamper-proof storage or clinical validation.

All active consumers use the signed-plan accessor: patient worklist, longitudinal state, clinician review, FHIR export, report submission and reminder processing. Legacy unsigned content is retained and available only through the consent-scoped clinician review response; it does not become active or receive a fabricated historical signer. The clinician can review and explicitly approve its stored content. Client replacements are ignored on this path; clinician, share and patient subject must all match. Revocation continues to terminate access.

Mandatory `server/uji/clinical/carePlanApproval.uji.ts` covers exact signer/time, content changes, malformed approvals, role refusals, all intent types, no stored-plan mutation on refusal, restart persistence, unsigned legacy exclusion and recovery, subject mismatch, consent and signed-plan daily follow-up in patient/clinician worklists. It is imported by `rekamEncounter.uji.ts`. Removing the intent guard makes its named 409 assertion fail (actual 200); source restored and clean fixture passed.

A7 evidence is bounded to the existing daily-care scheduling contract (`cadence: daily`, server activeFrom), correct owner worklists, patient answer submission and clinician review after process restart. It is not a separate booking system or evidence of actual notification delivery.

`qa/clinical/care-plan-approval.mjs` bundles the actual React component, serves application-build CSS, and talks to the actual isolated HTTP/file-backed server using synthetic identities. Browser assertions pass at 390x844 and 1440x900: loading, empty form, real refused-signature response, keyboard signing, signed-state reload, legacy review/reapproval without losing questions, error/Retry, >=44px primary signature controls, no horizontal overflow and no page errors, with reduced motion. Screenshots/JSON are emitted to `artifacts/care-plan-approval`; mandatory Stabilization Acceptance runs this gate. This component fixture does not establish product-route integration or full F1/F2 acceptance.

Local checks: 939 Node QA tests, frontend TypeScript/Vite build, focused real HTTP approval/RBAC/restart journey, full backend tests and backend typecheck/build passed. Architecture lint reports no new violations (19 known), ratchet unchanged. Full frontend final suite passed 736/736; exact-head CI is recorded separately when completed; production is not claimed. Clinical ranges, patient data, anatomy assets and clinically_reviewed authorization are unchanged.


## Main synchronization after D3 integration

The candidate is forward-merged with main `0f9e6a2137b08376aada4a583e0dbddacddc7ddd`. Only the execution checkpoint conflicted; both D3 evidence and A6/A7's bounded approval/follow-up evidence are retained. The clinical implementation is unchanged from tested head `d42da36d6be9edb186d64b80fd0e25b1ec20309e`. That prior head passed all applicable checks, including Validate and full Stabilization; current merged-head CI must pass again. Owner review remains pending and no A6/A7 ledger promotion is made.
