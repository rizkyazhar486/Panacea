# Owner decision: segment the Visible Human Female CT (adult female rig)

Date: 2026-10-09 · Decider: repository owner (Rizky) · Recorded by: Claude Code session (Sonnet 5.5)

## Decision
The owner approved segmenting the NLM Visible Human Female CT to unblock the adult-female skeleton and rig, using only the public database and dataset. The owner stated that a qualified anatomist review is **not required** for this step.

## What this does and does not change
- Approved: producing separately modelled female bones (and lungs if needed) from the Visible Human Female CT/segmentation data.
- **Unchanged:** `clinically_reviewed` stays `false` for every structure produced this way. Skipping an anatomist review means the output is *unreviewed*, not *reviewed*. The UI keeps the existing "not clinically reviewed" marking. No reviewer name, credential or validation status may be invented.
- The donor is a single individual. Output is labelled "single individual from source data", never "reference adult female" and never patient-specific anatomy. Donor age/body habitus must be copied from the source record, not from memory (a search result suggested a 59-year-old donor; unverified).

## Acceptance (to be evidenced by the implementing agent)
1. Source licence/terms of the NLM Visible Human data (and of the Univ. of Denver segmentation/STL collection, if reused) are read from the official page and recorded in `bodyexposure/PROVENANCE.md` with the retrieval date. If terms forbid the use, stop and report.
2. Check the existing Denver STL models first; segment from CT only for what they do not cover.
3. Per-bone provenance: source volume, method, tool version, parameters; laterality and naming checked against the male canonical frame.
4. Existing gross-anatomy gate and render gates stay green; no gate weakened.
5. `body_matrix.json` adult-female status changes only to what the evidence supports (not above `source_backed_partial` until skeleton coverage is measured).

## Blocker found
The cloud sandbox used to record this cannot reach digitalcommons.du.edu, nlm.nih.gov, 3d.nih.gov or humanatlas.io (egress blocked, HTTP 000), so no data was downloaded and no segmentation was run here. The work needs an environment with access to those hosts.

## Related, not approved by this record
Pregnant, fetus and older-adult bodies remain blocked on source data. The KCL fetal body MRI atlas page returned 403 for the owner, so it is not a usable source until access and licence are shown.
