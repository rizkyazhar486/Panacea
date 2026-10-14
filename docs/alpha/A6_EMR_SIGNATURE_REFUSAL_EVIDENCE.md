# A6 — EMR signature refusal boundary

Owner: Sol-Cloud. Base main29d77bc915d0dc04a458974c895320c96a452d85.

The real HTTP regression reproduced a patient's forged signing attempt being silently stripped and saved with200. Such attempts now return403, append emr.signature_refused with authenticated actor/time and leave the stored record unchanged. An administrative-owner session cannot create clinical signatures or close clinical encounters. The verified clinician remains the server-stamped signer; ordinary patient history edits carrying an unchanged previous signature still become unsigned drafts as before.

EMR sign controls and their callback now require the same verified-clinician eligibility used by examination editing. Mandatory clinicalSigningIntegrity and aiDraftApprovalHttp cover patient/owner denials, unchanged stored signed state, actor-attributed refusals, explicit clinician approval and restart persistence. Full encounter and backend suites plus backend/frontend typechecks passed. Exact-head CI must pass before integration.

This is the EMR signing unit, not full A6 closure. Active daily-care plan signature/linkage and A7 signed-plan-derived scheduling remain unfinished. No ledger status promoted and no clinical approval fabricated.

First exact-head CI failed at kunjungan-emr: its wiring assertion required the old owner-capable access helper. The assertion now requires the effective server doctor role; UI closure eligibility also uses canEditExam. Dedicated real HTTP owner/patient refusal tests remain mandatory. Failed runs are preserved; a fresh exact-head CI is required after this repair.
