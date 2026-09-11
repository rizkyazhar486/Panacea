# Panacea Eye 4D + end-to-end human anatomy

This release adds a dedicated Eye 4D mode to Body Exposure and extends whole-body layer navigation.

## Eye 4D source contract

- Gross ocular geometry and structure identity resolve from HuBMAP Human Reference Atlas (HRA) source models and ASCT+B / ontology mappings.
- Ocular coverage includes ocular surface, fibrous coat, uvea, optical media, aqueous outflow, retina/macula, optic nerve/chiasm context and adnexal structures when mapped upstream.
- HRA extraocular-muscle source geometry is resolved separately for medial/lateral/superior/inferior rectus, superior/inferior oblique and levator palpebrae superioris, with an explicit gaze-mechanics teaching module.
- 4D means an explicit physiology sequence (light entry → aperture → accommodation → posterior media → retinal reception → neural output → binocular integration) plus explicit ocular-motility states. Source GLB geometry is not deformed to imitate physiology.
- `200× inspection` is an educational detail level, not a claim of histological magnification or patient-specific metric reconstruction.

## Perfect Human Vision teaching bridge

The functional-examination map is based on the uploaded *Perfect Human Vision* teaching deck: visual acuity, color vision, stereoscopy and visual field, with the deck's Snellen/pinhole, low-vision sequence, Ishihara/Farnsworth, stereoscopy and confrontation/perimetry workflow represented as educational concepts. Panacea does not recreate copyrighted standardized plates or claim a phone display substitutes for calibrated clinical testing.

## Whole-body anatomy coverage

The Body Exposure Anatomy mode keeps the existing Human Anatomy Master Atlas and adds a live HRA layer navigator for integument, adipose/soft tissue, muscle, skeleton, nervous, cardiovascular, respiratory, digestive, urinary, reproductive, endocrine and immune/lymphatic anatomy. Mapping-only structures remain visibly distinct from browser-renderable GLB geometry.

## BodyParts3D deep source layer

An additional on-demand deep atlas uses the browser-ready BodyParts3D 4.0 packaging from `ashemag/human-atlas`: 2,234 individual source meshes, 15 display systems and 3,432 named concepts. It is not loaded at app launch. Users can search and load a single structure (lighter) or explicitly load a whole system. BodyParts3D data attribution is preserved as CC BY 4.0 and upstream application-source attribution is preserved as MIT. The source represents an adult male reference and is not patient-specific anatomy.
