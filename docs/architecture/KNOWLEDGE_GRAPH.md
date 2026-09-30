# Clinical Knowledge Graph Direction

## Purpose
Prevent Panaceamed medical knowledge from becoming isolated encyclopedic pages.

The long-term relationship substrate should connect, where evidence supports it:

`Anatomy <-> Physiology <-> Pathophysiology <-> Disease <-> Symptoms/Signs <-> Tests <-> Biomarkers/Imaging <-> Diagnosis <-> Treatment <-> Medication/Procedure <-> Monitoring <-> Outcome`

Potential relationship families:
- LOCATED_IN
- PART_OF
- SUPPLIED_BY
- INNERVATED_BY
- AFFECTS
- ASSOCIATED_WITH
- CAUSES
- SUPPORTS
- CONTRADICTS
- DIAGNOSED_BY
- TREATED_BY
- CONTRAINDICATED_WITH
- COMPLICATED_BY
- MONITORED_BY
- PREDICTS
- FOLLOWED_BY

Relationships must carry provenance/evidence when used for clinical or scientific inference.

## Separation of knowledge and patient state
The graph describes medical relationships and reference knowledge.
Patient State describes the person.

A patient-specific conclusion should be formed by combining:
`Patient Evidence + Knowledge + Workflow Context + Explicit Uncertainty`

Do not convert generic graph relationships into patient-specific diagnosis or lesion location without supporting patient evidence.

## Research evolution
New literature may:
- add an edge;
- change confidence;
- narrow a population;
- invalidate an old relationship;
- split one concept into multiple concepts.

The graph must support revision rather than treating all imported knowledge as timeless truth.
