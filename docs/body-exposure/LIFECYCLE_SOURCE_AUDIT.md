# Lifecycle anatomy: source audit (pregnancy, fetus, older adult)

Checked 2026-10-10 on the publishers' own pages. Nothing is built from a source whose terms were not read. "Verified" means the statement was read on the page named.

| Need | Candidate | What was verified | Decision |
|---|---|---|---|
| Fetus (organs) | King's College London fetal body MRI atlas, gin.g-node.org/kcl_cdb/fetal_body_mri_atlas | CC0 1.0 (README and LICENSE). 17 normal fetuses, 3T T2w, 0.75 mm, 10 organ labels. Gestational age 25 to 28 weeks per the preprint (PMC10312818), not stated in the repository. Article CC BY 4.0. | **Used.** 14 organ meshes, atlas not individual, organs only. |
| Fetus with skeleton and skin | none found | The atlas has no skeleton, skin, brain, heart or bowel labels. | Unavailable. Not built, not scaled from a neonate. |
| Pregnant female | ICRP pregnant-female mesh-type reference phantoms (8 to 38 weeks) | ICRP page id=698: "still in consultation", draft report only; the page does not say electronic mesh files are available. The development paper exists (Phys Med Biol 2024, part 1). | Unavailable. Re-check the ICRP page; do not model a pregnant body from the adult phantom plus a fetus. |
| Older adult (65 y and over) | UF/MSK adult mesh library | A paper on the library says the library will be made public "in the near future" at MIRDsoft.org; no download or licence found. | Unavailable. |
| Older adult | Visible Human Female "Nelly" surface phantom (PLOS ONE) | Same donor as our female body, 59 years old: not an older-adult source. | Not applicable. |
| Older adult | the Visible Human Female donor | 59 y per the Denver paper. | Labelled as that individual; never as "older adult". |

What stays blocked, and why: pregnancy and fetal skeleton need data that does not exist under a licence we could verify. An age-specific body would be invented anatomy if built by scaling, so the tabs stay "not yet".
