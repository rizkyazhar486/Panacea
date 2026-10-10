# Body Exposure: candidate dataset audit

Status date: 2026-10-10. Only facts checked on the source page or repository are stated as facts; everything else is marked **unverified**. Nothing here is imported yet. A source enters the pipeline only after its licence is read from the licence file itself and a PROVENANCE.md entry is written. No structure from any source below is clinically reviewed (`clinically_reviewed: false`).

## Already in use
| Source | Licence | Use |
|---|---|---|
| NLM Visible Human (Denver segmentation + CT) | CC BY 4.0 (Denver), NLM terms | female lower limb, CT skeleton |
| Z-Anatomy / BodyParts3D | CC BY-SA 4.0 | male atlas body |
| CMU mocap | acknowledgement required | WALK/RUN retargeting |
| KCL fetal atlas | CC0 1.0 | fetus body (PR #2336) |

## Candidates
| Source | Checked facts | Decision |
|---|---|---|
| `aycibatuhan/nervous-system-atlas` | Code Apache-2.0; generated data and content CC BY-SA 4.0; public edition = 592 meshes in MNI152 space. Its NOTICE lists restricted sets (Harvard-Oxford, Diedrichsen, Brainstem Navigator, PAM50) that its **private** edition uses and its public edition excludes. | Candidate for brain/cord parcels, **public edition only**. Share-alike applies, so the combined nervous-system layer must be CC BY-SA 4.0 with attribution. Never take the private edition or any file flagged `nc`/`noRedistribution`. Its meshes are derived from an MNI template, not from our donor bodies, so they must be registered as `reference_stand_in`, not as part of an individual body. |
| `nqwrc/3d-anatomy` | Describes itself as a Z-Anatomy dataset viewer (2,800+ structures). GitHub reports no licence (NOASSERTION). | Nothing new: Z-Anatomy is already used from its own repository. Skip. |
| `thebuggeddev/anatomy` | No licence file. | Do not use (no licence means no permission). |
| Open Anatomy SPL/NAC Brain Atlas | Page names the Brigham and Women's / MGH collaboration; no licence text found on the page. | **Unverified.** Obtain the licence from the atlas files before any use. |
| GEO GSE186192 | Series page reachable; I did not read its contents. | **Unverified.** Gene-expression data; only relevant to the cell/genome levels, not meshes. |
| OpenSim models (`opensim-org/opensim-models`) | GitHub reports no licence for the repository; individual models carry their own terms. | Read each model's licence before use. Potential value: musculoskeletal ROM and muscle paths to cross-check our rig. |
| FIPAT TA2 front matter (Dalhousie) | PDF not read. | **Unverified.** Terminology reference only. |
| `apps.humanatlas.io/api`, ASCT+B crosswalks | Local CSVs: female 874 rows, male 850, combined 2,305, with Uberon/FMA IDs. | Next step: map our structure IDs to ontology IDs (no new geometry). |
| `wasserth/TotalSegmentator` | Apache-2.0 (code). | Already used for CT bones with the open `total` weights; restricted-licence tasks stay unused. Its MR models are unverified for licence and have not been used. |
| `wasserth/MyelinAge` | Apache-2.0; infant MRI myelin-age prediction. | No use: no anatomy geometry. |
| `wasserth/nnUNet_cust`, `wasserth/MONAI` | Apache-2.0 forks of nnU-Net and MONAI. | Tooling only. Use upstream releases, not these forks (last pushed 2025 and 2021). |
| `wasserth/dipy` | Fork of dipy, GitHub reports no licence; last pushed 2018. | Do not use; upstream dipy is the maintained source (licence to be read there). |

## Dataset completion: primary sources (checked 2026-10-10)
| Gap | Source | Checked facts | Status |
|---|---|---|---|
| Fetal body | KCL fetal body MRI atlas (`~/Downloads/fetal_body_mri_atlas`) | CC0 1.0 (LICENSE and README). 3T T2w atlas of 17 fetuses with 10 organ ROIs (lungs, liver, stomach, spleen, kidney pelvis and parenchyma, bladder, thymus, gallbladder, adrenals) plus a lung-lobe parcellation. | This is the atlas already used for the fetus body in PR #2336. It has no skeleton, skin, brain or heart, so it does not close the fetal-skeleton/skin gap, and it holds no maternal anatomy (uterus, placenta), so it does not close the pregnancy gap. |
| Respiratory motion | TCIA 4D-Lung | Collection page states CC BY 3.0 (commercial use allowed with attribution). The MONAI Physio repository (Apache-2.0) redistributes a converted subset as GitHub release assets; the data licence remains the TCIA one. | Candidate. Not downloaded. Needs deformable registration and a mapping from image motion to our lung and rib meshes; the result would be image-derived motion of a different individual, labelled as such. |
| Respiratory motion | POPI-model (`open-vv/popi-model`) | Six 4D-CT sets with landmarks; terms are attribution to the Léon Bérard Cancer Center and CREATIS plus citation of Vandemeulebroucke 2007. No SPDX licence on the repository. | Candidate for validating registration error only. Commercial-use terms are not stated, so unverified; ask the maintainers before any redistribution. |
| Respiratory motion | DIR-Lab 4D-CT | The data pages gave no licence text when fetched. | **Unverified.** Do not use until terms are obtained. |
| Cardiac motion | ACDC cine-MRI | The challenge pages gave no licence text when fetched; I have not confirmed the terms. | **Unverified.** Do not use until the licence and commercial-use terms are read from the original download. |
| Cardiac geometry | KCL heart model (Zenodo 4590294, 4593739) and CHOP-Valve4D (via MONAI Physio releases) | Referenced in the pasted MONAI Physio downloader; Zenodo and release licences not yet read. | **Unverified.** |
| `Imaging Cancer.tcia` | NBIA manifest of series UIDs | Lists series UIDs only; the collection and licence cannot be told from the manifest. | **Unverified.** Needs the NBIA Data Retriever to resolve, then the collection licence. |
| Older adult | none found | Imaging collections list ages but no cleared source of age-representative whole-body geometry has been identified. | Remains unavailable. |
| Female forearm/hand | NLM Visible Human Female | The VHF images cover the whole body; our current segmentation (Denver + CT) does not include forearms and hands. | Candidate: segment them from the original VHF images. Must stay `model_segmented` until reviewed. A male proxy may only be labelled `reference_stand_in`, never female. |

## Local files in ~/Downloads
- Slicer segmentation-mask folders (~2 GB each, "Final" and "Smoothed"): contents not yet compared with the Denver data already processed.
- MRI-Male*, CT before/after freezing, Five/Six slices: sample slices of about 100 KB to 18 MB; cannot build 3D anatomy.
- OpenCell CSVs: protein localisation, abundance, interactions (cell/molecular level).
- Virtual Population PDF and "11th Release (v2.5).csv": not yet read. The Virtual Population models are commercial, so only the PDF's own description can be used.

## Not possible from these sources
Heartbeat and breathing motion, pregnancy, older-adult anatomy and a segmented female forearm/hand are not provided by any listed dataset. They stay registered as unavailable.
