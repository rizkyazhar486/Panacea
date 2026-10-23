# Optional Human Verification — flexible, never mandatory

Humans (owner, reviewer, tester, specialist) **may** verify work. They are never required to unlock engineering progress, and nobody is asked to run something an AI can run. This file defines what a human review is, what it is not, and the terms that apply.

## 1. Modes
| Mode | Meaning |
|---|---|
| `none` | No human review is offered for this task. |
| `optional` | A person may leave a voluntary review. Work proceeds with or without it. |
| deferred gate | Genuinely needs authority (law, licence, consent, clinical validation, production credentials). Listed in [EXTERNAL_GATES.md](EXTERNAL_GATES.md) as `DEFERRED_FINAL_STAGE`; not asked now. |

There is no mode "required for engineering".

## 2. Where a human fills the checklist (a page, not a meeting)
- **Available now:** the GitHub issue form [`human-review.yml`](../../.github/ISSUE_TEMPLATE/human-review.yml) — one page with the task id, the version/SHA, a checklist, a decision (Approve / Request changes / Defer / Not applicable), a name/role field and the terms below. Submitting it creates an issue that agents read as evidence of a *voluntary* review.
- **Planned (task `T-HR-02`):** an in-product page with the same fields and an append-only audit trail. Spec in §5.

## 3. Terms and conditions (apply to every human review)
1. **Voluntary.** Skipping a review is allowed and has no consequence for engineering status.
2. **Attributed or anonymous-labelled.** A review counts as "attributed" only with a name and role the reviewer states. Without it, it is recorded as *anonymous feedback* and cannot raise any label.
3. **Scope-limited.** A review only attests what its checklist says (for example "UI reads clearly on my phone"). It cannot extend to anything else.
4. **Cannot grant authority.** A checkbox is not a licence, patient consent, professional credential, clinical validation, legal approval, or a waiver of branch protection or third-party terms. Those are handled only by their own deferred gates with their own evidence.
5. **No pre-ticked boxes, no implied consent, no AI signatures.** AI agents must never create, edit, tick or sign a human review. A human record written by an AI is invalid and a bug.
6. **Version-bound.** A review is tied to a task id and SHA/version. When the code at that scope changes, the label becomes *stale* (not deleted); history is append-only.
7. **Claims stay honest.** The product may show "reviewed by <name/role> on <date>, scope: <scope>". It may not show "clinically validated", "approved for use" or "compliant" from a voluntary review. A professional reviewer's statement is recorded as *their claim*; the system does not verify licences.
8. **Privacy.** A review must not contain patient data. Names/contact details given are used only to attribute the review.
9. **Withdrawal.** A reviewer can withdraw (append a withdrawal record); the earlier record stays in history.

## 4. Record (machine-readable)
```json
{ "taskId": "ENG-F2-01", "version": "<sha>", "decision": "approve|request_changes|defer|not_applicable",
  "scope": "plain-language scope attested", "reviewer": { "name": "", "role": "", "attributed": true },
  "checklist": [ { "item": "", "checked": false } ], "termsAccepted": true,
  "createdAt": "<UTC>", "supersedes": null }
```
Validity rules (tested when the feature lands): `termsAccepted` must be true; no item is `checked` by default; `reviewer.attributed` requires a non-empty name and role; records are append-only.

## 5. Spec for the in-product page (task T-HR-02, any capable AI)
Route `#/review/<taskId>`. Shows: task id, plain description, scope, evidence links (read-only), checklist, decision buttons, terms (collapsed disclosure that must be opened or accepted via an explicit checkbox), result label. States: loading, empty, error, saved. Double-submit disabled. Mobile 390x844. Server: authenticated identity optional; append-only store; rate-limited; no PHI. Tests: positive and negative for every rule in §3–§4, including "an AI service identity cannot write a review".
