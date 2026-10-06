# Opus 5.5 synthetic clinical RAG artifact

This directory contains the committed provenance manifest for
`nisten/opus5-5-doctor-patient-conversations-all-human-diseases`.

The 75 MB JSONL itself is **not vendored into Panacea Git history**. During a
configured deployment it is downloaded from the immutable Hugging Face revision
recorded in `opus55.manifest.json`, then SHA-256 and byte-count verified before
the temporary file is atomically promoted.

Panacea uses this dataset only as `synthetic-research-context` for Chatbot and
AI-EMR retrieval. The runtime adapter excludes the full synthetic
`conversation`, `clinician_persona`, and `patient_scenario` fields from model
prompts. Retrieved hints cannot become measured/recorded patient truth and
cannot be the sole basis for diagnosis, treatment, dosing, or signed EMR
content.

The dataset publisher explicitly requires downstream clinical facts to be
checked against primary sources. The current Hub metadata says Apache-2.0 while
README prose still says MIT, so the source registry keeps license status at
`CHECK_REQUIRED` and preserves attribution.
