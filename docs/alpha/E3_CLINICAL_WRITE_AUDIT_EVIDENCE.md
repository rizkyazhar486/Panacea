# E3 — lab and follow-up write audit coverage

Owner: Sol-Cloud; base main29d77bc915d0dc04a458974c895320c96a452d85.

Real HTTP regression reproduced an accepted patient lab-log update with no write audit. Accepted lab-log updates and new care reports now append global audit events with the authenticated session actor and server timestamp. Stale rejected updates and idempotent report retries do not become successful changes or duplicate write events. Targets use account/plan identifiers rather than clinical values.

Mandatory careWriteAuditHttp, imported by auditTrailHttp, covers forged actor/time fields, unauthorized foreign report attempts, successful writes, stale-write rejection, idempotency and process-restart persistence. Existing clinical/link/lab/referral audit coverage remains; the route audit guard now additionally covers lab-log, clinician lab-share, care and second-opinion writes, including their existing patient-scoped addLabAudit events.

Reproduce: cd server && node --import tsx uji/auditTrailHttp.uji.ts. Focused tests and backend typecheck passed. Full backend rerun and exact-head CI must pass before integration.

Limits remain explicit: existing audit storage retains a bounded plain array, not a tamper-evident hash chain or full content diff. Unauthorized EMR attempts are not successful changes and may have no audit entry. This closes write actor/time gaps without claiming stronger integrity, indefinite retention, clinical approval or production delivery.
