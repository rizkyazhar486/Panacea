# Fetal MRI atlas parcels — provenance record

Engineering record written 2026-10-17 from the project's own manifests and documentation. It is **not** a legal or clinical certification.

- **Source:** https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas (called the "KCL CC0 population atlas" in `DOCS/body-exposure/FETAL_MRI_CONTEXT.md`), pinned revision `74f11a186c709078d712bb2fd827bfa2b36e3407`.
- **Licence:** CC0-1.0, as recorded in `manifest.json` by the project. It was not re-verified against the dataset repository from this environment.
- **Derivation:** `regions.glb` is built from the atlas masks `reo-fetal-t2w-body-atlas-mask-lungs_multi-10.nii.gz` and `reo-fetal-t2w-body-atlas-mask-body_organs-10.nii.gz`; their SHA256 values and the SHA256 of `regions.glb` are pinned in `manifest.json`.
- **Truth class:** population reference, educational only. Not patient anatomy. Clinical validation is pending and anatomical identity of the labels is unresolved (`manifest.json`).
- **Attribution:** the atlas authors and host are named by the `source` field above; cite that source when reusing these derivatives.
