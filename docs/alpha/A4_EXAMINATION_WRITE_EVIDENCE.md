# A4 — clinician-controlled examination writes

Owner: Sol-Cloud. Synthetic engineering fixtures; no clinical approval implied.

The real HTTP regression first failed on main a70fb287: a patient-created examination returned200 instead of403. The write route now requires the authenticated effective verified-doctor role for examination changes, including deletion and verification-metadata changes. Administrative ownership is not clinical authorization. Rejected attempts are audited before any record mutation.

Unchanged full-record examination echoes remain compatible with patient anamnesis edits; object key order does not remove examination provenance. Empty UI examination defaults are not findings. Chatbot proposals and patient-reported context are preserved separately as aiExamDraft and rendered as unexamined AI proposals. The EMR examination controls are read-only for other roles.

Reproduce: cd server && node --import tsx uji/examinationWriteHttp.uji.ts. The mandatory rekamEncounter suite imports this regression. Positive clinician writes, negative patient create/change/delete/metadata, administrative-owner rejection, anonymous rejection, revoked-clinician rejection, persisted non-mutation, unchanged echoes and separate AI proposals are asserted.

Local validation: dedicated HTTP regression, clinicalSigningIntegrity, complete rekamEncounter suite, backend/frontend typechecking, frontend736/736 scripts passed. Full backend suite passed before the final owner-role restriction; final-source full rerun is recorded separately. Exact-head CI and integration remain mandatory before delivery. A3, A5-A7 and production journey validation are not claimed by this change.
