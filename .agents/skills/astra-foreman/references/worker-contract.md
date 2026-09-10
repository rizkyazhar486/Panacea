# Worker assignment contract

Use this structure when delegating or creating a copy-and-paste prompt. Populate it with known evidence; mark unknowns explicitly. Omit fields irrelevant to a small task.

```text
Task: [specific outcome]
Target: [repository, machine/environment, branch, known base revision]
Read first: [applicable project instructions and relevant source]
Observed evidence: [symptom, reproduction, logs, source paths]
Acceptance criteria: [observable behavior and meaningful checks]
Scope: [owned files or subsystem; dependencies and explicit exclusions]
Implementation: Inspect current state, diagnose, make the necessary change,
  and preserve unrelated edits. Coordinate before touching another owner's files.
Verification: [reproduction and required gates]. Report actual commands and
  results; distinguish not run, failed, and passed.
Authority: [actions already authorized; actions that still require approval].
  Do not change credentials, paid settings, deployment, or permissions outside scope.
Return: Diagnosis, changed files/diff or commit, evidence, unresolved limits,
  required documentation status, and rollback/deployment notes where relevant.
```

When requesting review, provide the raw diff and original acceptance criteria rather than the implementer's preferred verdict. If independent review is unavailable, perform the review locally and do not describe it as independent.

Keep deployment commands specific to their machine. A handoff must contain enough context for the worker to start without relying on this conversation. Exclude secrets and unrelated personal data.
