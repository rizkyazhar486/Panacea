# Fetal MRI source-context planes — provenance record

Engineering record written 2026-10-17 from `manifest.json` in this directory and `DOCS/body-exposure/FETAL_MRI_CONTEXT.md`. Not a legal or clinical certification.

- **Source:** https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas, pinned revision `74f11a186c709078d712bb2fd827bfa2b36e3407` (the original T2 volume and the nine-label mask are SHA256-pinned in `manifest.json`).
- **Licence:** CC0-1.0. Verified 2026-10-23 against the original dataset [README](https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas/src/74f11a186c709078d712bb2fd827bfa2b36e3407/README.md) (explicit atlas licence) and [LICENSE](https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas/src/74f11a186c709078d712bb2fd827bfa2b36e3407/LICENSE) (CC0 1.0 Universal), at the same revision pinned in `manifest.json`. This verification concerns the dataset licence only; anatomical identity and clinical validation remain pending.
- **Derivation:** the PNG planes are native-grid crops of the T2 volume produced by `bodyexposure/pipeline/prepare_fetal_mri_context.py`; each encoded PNG is checked against its declared SHA256 by the project's QA.
- **Truth class:** source MRI display context for human interpretation; clinical validation is pending (`manifest.json`). Not patient anatomy.

