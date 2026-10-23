# A3 — answer authors and draft version history

Owner: Sol-Cloud. Depends on clinician examination boundary PR2523.

The real HTTP regression reproduced unsigned anamnesis edits overwriting the previous draft without an archived version. Every changed persisted record now appends the preceding server-held snapshot, including unsigned drafts and sign transitions. Identical retries create no version. Signed and unsigned archives have separate audit actions.

Changed nonempty answers receive the authenticated writer ID and server timestamp. Explicit AI-origin declarations retain AI origin with an authenticated submitting writer, not a fabricated model identity. Other nonclinical user input has Pengguna origin, displayed as user-entered and not clinician-verified. Unchanged fields keep prior provenance; legacy unattributed values remain unattributed rather than inventing historic authors.

Mandatory real HTTP anamnesisProvenanceVersioning covers answer-level identity/source/time, unchanged-field provenance, exact history counts and snapshots for draft edits and signing, immutable prior snapshots, patient edits, scoped history, unavailable mutation endpoints and process-restart persistence. Unit provenance tests and longitudinal projection ensure signing does not relabel user or AI text as clinician-authored.

Focused HTTP/encounter suites, full backend suite and backend typecheck passed. Initial frontend typecheck identified the narrower longitudinal origin union; widened it and kept user input in its nonclinical origin category. Final frontend typecheck passed; exact-head CI must pass before integration. No human clinical approval, inferred legacy authors or production delivery claimed.
