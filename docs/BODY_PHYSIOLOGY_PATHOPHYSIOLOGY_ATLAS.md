# Body Physiology / Pathophysiology Atlas

This contract extends the existing Body Exposure multisystem graph with a lightweight educational mechanism layer. It does not create a second 3D renderer and it does not imply that every mechanism is directly visible as geometry.

## Initial modules

The first bounded set covers six high-value cardiovascular / neurovascular mechanisms:

- atherosclerosis
- ischemic stroke
- intracerebral hemorrhage
- heart failure
- deep-vein thrombosis
- coronary artery disease

Each module is expressed as four ordered mechanism steps. Gross spatial relationships use the existing anatomy viewer where appropriate, while sub-gross mechanisms use scale-appropriate representations such as cross-section, cellular, molecular-network, flow-field, or timeline views.

## Safety and scientific boundaries

Every module is educational-only. Generic atlas geometry must never be promoted into patient-specific anatomy, perfusion measurement, diagnosis, treatment selection, prognosis, or quantitative clinical inference. Clinical or procedural reuse requires the existing Academic Accuracy Gate and qualified human review.

The mandatory design references remain reference-only unless their asset-level licensing and provenance are independently verified:

- https://github.com/thebuggeddev/anatomy
- https://breath-atlas.thebuggeddev.chatgpt.site/

These sources may inform interaction architecture and storytelling but do not become medical evidence merely by being visually compelling.

## Integration intent

The next UI layer should expose these modules through the existing Whole-body Precision / Body Exposure surface. It should reuse the current shared Body3D viewer, the multisystem scale navigator, and existing evidence/trust presentation. No additional heavy renderer, network API, patient data, or persistent clinical state is required.
