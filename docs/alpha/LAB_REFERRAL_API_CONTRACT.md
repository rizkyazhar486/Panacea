# Lab result & referral API contract (Alpha B2–B9)

Backend is the source of truth. The UI must not keep clinical state in `localStorage`.
Code: `server/src/modules/labResults/` (domain → service → http). Tests: `server/uji/hasilLab.uji.ts`.
This is a **workflow control**, not a clinical judgement. Values are stored exactly as recorded and are never interpreted by the server.

## Roles (mapped from the effective server role)
| Server role | Actor | Notes |
|---|---|---|
| `dokter` with verified STR | `clinician` (authorized) | an unverified `dokter` is treated as `pasien` by `requireAuth` |
| `admin`, owner | `admin` | cannot review (`reviewed`), cannot close a referral |
| `pasien` | `patient` | reads only own/linked patient ids |
| `kontributor`, `verifikator` | none → 403 | |

## Result lifecycle
`received → pending_review → reviewed → communicated → closed` (one step forward only).
- `reviewed`: authorized clinician only. `communicated`: needs `communication {channel, note}` (`in-person|phone|portal-message|letter`).
- `closed`: person (clinician/nurse), never the system.
- Reading never changes status ("viewed ≠ done").
- Every transition appends a hash-chained audit entry `{seq, actorId, role, at, from, to, prevHash, hash}`; a tampered trail makes the record fail closed (`trail-corrupt`).

## Referral lifecycle (separate)
`requested → accepted → scheduled → completed → result_returned → closed`, with `declined`/`cancelled` exits.
- Create: authorized clinician. `declined`/`cancelled` need `closeReason`.
- `result_returned`: needs `resultId` of a lab result of the same patient, or `returnNote` for non-lab referrals.
- `closed`: authorized clinician; if a result is linked it must already be `closed`.

## Endpoints (all require auth)
| Method & path | Body / query | Success |
|---|---|---|
| `POST /api/lab-results` | `{patientId, source: 'lab-intake'\|'manual-entry', item: {name, value\|valueText, unit?, referenceRange?, collectedAt}}` | 201 record |
| `GET /api/lab-results?patientId=` | | `{results}` (scoped to the caller) |
| `GET /api/lab-results/:id` | | record (404 if no access) |
| `POST /api/lab-results/:id/advance` | `{to, expectedStatus?, communication?}` | record |
| `GET /api/lab-results/metrics?dueHours=` | | `{total, byStatus, closed, closureRate\|null, oldestOpenHours\|null, overdue\|null, corrupt}` (staff only) |
| `POST /api/referrals` | `{patientId, kind: 'lab'\|'specialist'\|'imaging'\|'other', reason, toFacility}` | 201 record |
| `GET /api/referrals?patientId=`, `GET /api/referrals/:id` | | |
| `POST /api/referrals/:id/advance` | `{to, expectedStatus?, resultId?, returnNote?, closeReason?}` | record |

Errors: 400 `invalid-input|evidence-required|invalid-timestamp|unknown-status`, 403 `forbidden|role-not-permitted|clinician-not-authorized|system-cannot-record|tenant-mismatch`, 404 `not-found`, 409 `not-allowed-step|stale-status|time-before-last-entry`, 422 `linked-result-invalid`, 500 `trail-corrupt`.
`closureRate`, `oldestOpenHours` and `overdue` are `null` (not measured) when there is no denominator, no open result, or no `dueHours` from the caller; the server never invents a threshold.

## Not done / open
- Patient-facing delivery of the result message (B8) is recorded as evidence only (`communication`); sending is not implemented.
- Storage is the existing file/Mongo persistence of the clinical store; no new database. Clinical sign-off of the workflow rules is pending (`clinically_reviewed = false`).
