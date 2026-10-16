# E4 data protection acceptance packet — 2026-10-15

Canonical source base: main `0f9e6a2137b08376aada4a583e0dbddacddc7ddd`. E4 remains NOT_CHECKED. This packet records implementation facts and missing evidence; it does not choose a legal retention period or certify compliance.

| Data family / control | Current code and evidence | Remaining acceptance / required decision |
|---|---|---|
| Operational logs | `server/uji/logPrivacyHttp.uji.ts` captures real application output using synthetic identity, clinical and webhook-label markers; #2538 removes the reproduced label leak. | Bounded markers/static checks are not proof about every historical production log. Operator must provide the deployed logging/retention configuration and a redacted verification result. |
| Lab sharing / care consent | `shareExpiryHttp`, `careHttpRbac`, `labShareHttpRbac`: real HTTP expiry, revocation and ownership boundaries. | Revocation stops permission-based access; it does not imply deletion of source records or archives. |
| HR/sleep series deletion | `/api/health-series` DELETE calls `clearHealthSeries` for authenticated account. | This is a scoped deletion endpoint, not complete account/clinical-record erasure. |
| Local settings reset | `src/pages/dashboard/Settings.tsx`: Reset Saved App State invokes local `resetDemo`. | Only `panaceamed.state.v3` is removed/reset. Other local caches and server-held records are not erased; UI must state that limited scope. |
| Lab audit / reviews / care reports | `server/src/store.ts` trims active collections by count and calls `arsipkan` into archive storage. | Count limits/archive movement are not time-based deletion. Approve retention, withdrawal/deletion handling and archive purge/backup rules for each family before implementing destructive retention. |
| Signed clinical records / clinical audit | Clinical identity and signing controls preserve authenticated provenance and historical versions. | Approve the handling of signed records and audit history under deletion requests; do not silently delete records or invent an exception/retention period. |
| Residency / encryption / named privacy authority | No evidence in this packet establishes production region, encryption at rest, or an appointed DPO. | Operator evidence and responsible contact/authority are required. Provider access/secret values must remain outside repo. |

The Legal page is corrected to describe implemented controls, distinguish local reset from server erasure, remove unsupported deployment guarantees and an unverified live-integration claim, and use a fixed review date. It preserves account/data controls and clinician authority. This disclosure repair does not close E4.

## Minimal inputs that unblock the remaining policy-dependent work

An owner-approved data-family matrix: retention trigger and period, what withdrawal changes, what deletion removes/retains, treatment of signed records/audit, archives/backups and responsible executor. Also provide deployment configuration evidence for residency/encryption and operational log retention. No credential values or patient records should be pasted into the public repository. Engineering can then implement the approved policy and test actual file/Mongo restart, revocation, scoped deletion and archive behavior.

No production patient data or destructive deletion is used to prepare this packet. C6 clinical-review authorization and D8 asset permissions remain distinct external evidence requirements.

## Entry-path reconciliation

The sign-in policy summary contained the same unsupported encryption and deletion guarantees, while the full `/legal` route was hidden behind the guest landing screen. The candidate uses one shared factual disclosure in both surfaces and makes only the static Legal route available before login. Authenticated data routes and consent state are unchanged. The modal's full-policy link and close action do not grant consent; the parent consent control remains separate.


The full policy opts out of the existing global compact-prose presentation so control limits remain readable. The native sign-in dialog contains keyboard focus, restores the opener on Escape/close, and leaves consent unchecked. Actual built-route browser assertions cover these behaviors, both themes and both required viewport classes; no authenticated session, policy approval or production deployment is implied.


## Reproducible candidate checks

- `npm run build`: 945 Node QA tests, `tsc -b`, and Vite pass on main0f9e6a21 plus this disclosure candidate.
- `npm run uji`: 736/736 frontend files passed after full-text disclosure repair; the final focus-position and contrast edits pass the actual browser gate; exact-head CI must repeat the required checks.
- `npm run lint:arsitektur`: no new violations; 19 known baseline violations remain. Ratchet: existing675 entries/50obsolete, unchanged.
- `PRIVACY_QA_ORIGIN=http://127.0.0.1:4187 node qa/clinical/privacy-disclosure.mjs` (installed Playwright + Chrome): actual production-built public route, both themes,390×844/1440×900, unchanged unchecked consent, Escape/close/full-policy navigation, focus restoration/containment, unclipped policy, no overflow/page exceptions. Workflow installs Playwright and runs the same script as a required full-acceptance step; artifacts are uploaded as `privacy-disclosure`.
- Before repair, actual browser runs failed on inaccessible guest policy and escaped Shift+Tab focus; visual inspection additionally exposed global compact-prose truncation. The test now asserts readable element dimensions and waits for the initial splash to disappear before screenshots.

Screenshots were visually inspected. These checks do not certify legal compliance, all historical logs, deployment encryption/residency, complete deletion, or full F1/F2 acceptance.

The theme screenshot review also reproduced a dark-dialog heading contrast of1.109:1 caused by the global `.dark .bg-white .text-ink` override. The candidate avoids that conflicting utility pairing locally and requires an actual-browser heading contrast of at least4.5:1; it does not claim a complete application-wide WCAG audit.

Final browser evidence records minimum heading contrast17.93:1 light and13.20:1 dark (sRGB relative luminance, alpha composition bounded against black/white underlying surfaces). The unchanged4.5:1 threshold passes. Final screenshots confirm the dialog opens at its heading with readable dark text hierarchy.

## 2026-10-16 independent review correction

Review reproduced an unsupported rights-request channel: `ContactService.send()` appends transient component messages and generates a random ticket number, with no API, persistence or operator transmission. The shared disclosure therefore states that in-app Support does not submit or retain data-rights requests and does not confirm receipt or completion. It asks users to verify an operator channel independently; no contact or successful request delivery is invented. Public-route and modal browser assertions require this limitation. A direct import of the shared disclosure failed the new limitation assertion before repair and passed after. The broader Support ticket simulation remains a separate risk; this scoped disclosure repair does not make it an operational service.
