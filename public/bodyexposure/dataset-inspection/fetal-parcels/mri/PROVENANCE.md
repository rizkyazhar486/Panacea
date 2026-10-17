# Fetal MRI source-context planes — provenance record

Engineering record written 2026-10-17 from `manifest.json` in this directory and `DOCS/body-exposure/FETAL_MRI_CONTEXT.md`. Not a legal or clinical certification.

- **Source:** https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas, pinned revision `74f11a186c709078d712bb2fd827bfa2b36e3407` (the original T2 volume and the nine-label mask are SHA256-pinned in `manifest.json`).
- **Licence:** CC0-1.0, as recorded in `manifest.json` by the project; not re-verified against the dataset repository from this environment.
- **Derivation:** the PNG planes are native-grid crops of the T2 volume produced by `bodyexposure/pipeline/prepare_fetal_mri_context.py`; each encoded PNG is checked against its declared SHA256 by the project's QA.
- **Truth class:** source MRI display context for human interpretation; clinical validation is pending (`manifest.json`). Not patient anatomy.
