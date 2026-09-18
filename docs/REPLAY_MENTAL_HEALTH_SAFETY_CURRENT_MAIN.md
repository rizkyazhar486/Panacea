# Mental-health safety replay on current main

This lane replays the bounded fail-closed safety kernel from PR #1773 onto the latest `main` after that branch's full acceptance was confounded by an unrelated stale Body3D/UI baseline.

## Boundary

- Explicit user-reported or clinician-entered safety signals only.
- No suicide-risk prediction score, diagnosis, prescribing, autonomous disposition, or silent wearable/model escalation.
- Hard escalation cannot be downgraded by an LLM.
- External contact remains an orchestration intent and still requires the execution layer's applicable authorization, consent, and emergency policy.
- Qualified clinical human review is required before this behavior can be represented as clinically reviewed or production-ready.

## Merge gate

Keep this PR draft until exact-head repository gates pass and qualified clinical review of the trigger/action policy is recorded.
