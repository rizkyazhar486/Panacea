# Panacea Personal Digital Human — camera-only visual identity layer

Status: active architecture target; first runtime camera-capture slice implemented 2026-09-19.

## Product intent

Panacea should let a patient or user open one ordinary RGB camera, perform a short guided scan, and create a high-fidelity personal digital human that becomes the visual identity shell inside Body Exposure, Clinical and AI-EMR.

```
camera permission → guided slow turn → face close-up → automatic 3×3 QA preview
→ reconstruction adapter → rigged personal surface avatar → longitudinal My Body identity
```

This is deliberately not a manual cosmetic character creator as the primary flow.

## Truth layers

1. **PersonalAvatar** — camera-derived external appearance, body habitus, posture and surface geometry.
2. **ReferenceAnatomy** — licensed/source-backed anatomical atlas.
3. **PatientSpecificAnatomy** — internal anatomy from verified patient-specific sources such as CT/MRI/DICOM.

```
PersonalSurface ≠ ReferenceAnatomy ≠ PatientSpecificInternalAnatomy
```

A camera-only avatar must never be presented as real patient-specific internal organs.

## Camera-only capture

Baseline hardware: `N_camera = 1`.

A 15-second scan at 30 fps can expose up to `15 × 30 = 450 frames`; reconstruction should select useful keyframes instead of treating every frame equally.

The first Panacea contract uses nine guided key views because it is deterministic and browser-friendly. Future adapters may sample additional video frames while preserving the same simple user experience.

## Canonical 3×3 QA

Front · front-left 45° · left · back-left 45° · back · back-right 45° · right · front-right 45° · head close-up.

This grid is a QA/fidelity surface, not a claim that nine still images provide medical-grade metrology.

## Reconstruction architecture

```
RGB frames → segmentation → landmarks → parametric body/face fit
→ multi-view surface reconstruction → texture/material reconstruction
→ mesh cleanup → rig → LOD → Three.js PersonalAvatar runtime
```

The reconstruction model must sit behind an adapter. Candidate technology families include SMPL/SMPL-X, FLAME/DECA and PIFuHD/ICON/ECON-class methods. These are technical references, not bundled assets or automatic licensing grants.

## 4D

`4D = 3D + t`, where `t` is animation/state/longitudinal time.

Target states: breathing, posture, walking/running, ROM/examination positions, rehabilitation movement and longitudinal external-body comparison.

## Fidelity formulas

When a real reference measurement exists:

`E_M = |M_avatar - M_reference| / M_reference × 100%`

Never describe camera-inferred dimensions as clinically measured.

Composite similarity:

`S_total = w_f S_f + w_b S_b + w_p S_p + w_t S_t + w_m S_m`, with `Σw_i = 1`.

## Performance

60 fps budget ≈ 16.7 ms/frame; 30 fps budget ≈ 33.3 ms/frame.

Use progressive LOD, bounded DPR, texture streaming and offscreen suspension. A 4K texture tier may exist for close-up/high-end rendering, but must not make mobile unusable.

## Privacy

Raw camera frames are ephemeral by default. The current slice requests camera only, never microphone; keeps previews as in-memory object URLs; does not write raw frames to local/session storage; revokes object URLs; stops camera tracks; and does not treat capture data as a signed AI-EMR record.

Future reconstruction/upload requires explicit consent, authenticated subject binding, encrypted transport, retention/deletion rules and auditability.

## Clinical integration

The personal avatar may support pain/body-location communication, surface finding annotation, wound/body-region documentation, posture comparison, rehabilitation, longitudinal external-body change, patient education and clinician-patient communication.

Internal anatomy remains atlas reference unless verified patient-specific imaging exists.

## Current boundary

Implemented now:
- camera-only browser capture;
- nine guided views;
- 3×3 QA preview;
- ephemeral frame lifecycle;
- consent/reconstruction request contract;
- similarity/anthropometric helper formulas;
- Body Exposure “My Body” projection;
- deterministic regression gate.

Not yet implemented and must not be falsely claimed:
- production face/body reconstruction model;
- game-quality rigged mesh output;
- reconstruction backend;
- texture baking;
- retopology;
- animation rig generation;
- persistent avatar asset storage;
- signed AI-EMR surface annotation workflow;
- validated CT/MRI-to-avatar registration.

## References

- Loper M, et al. SMPL: A Skinned Multi-Person Linear Model. ACM Trans Graph. 2015.
- Pavlakos G, et al. Expressive Body Capture: 3D Hands, Face, and Body from a Single Image. CVPR. 2019.
- Li T, et al. Learning a model of facial shape and expression from 4D scans. ACM Trans Graph. 2017.
- Feng Y, et al. Learning an Animatable Detailed 3D Face Model from In-The-Wild Images. ACM SIGGRAPH. 2021.
- Saito S, et al. PIFu. ICCV. 2019.
- Saito S, et al. PIFuHD. CVPR. 2020.
- Xiu Y, et al. ICON. CVPR. 2022.
- Xiu Y, et al. ECON. CVPR. 2023.
