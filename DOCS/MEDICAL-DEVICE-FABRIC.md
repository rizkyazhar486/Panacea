# Panacea Medical Device Fabric

Status: architecture + industry integration catalog. This document does **not** claim vendor/model support.

## Why this exists

Panacea already has a Visit Operating System for live scalar measurements, a FHIR R4/SATUSEHAT publication boundary, a DICOM imaging stack, and wearable source adapters. The next step is not to build one isolated connector per device screen. The goal is one **Medical Device Fabric** underneath Clinical, AI-EMR, Your Body and Body Exposure.

The fabric treats each physical device as a source of measured artifacts with explicit device identity, patient/encounter association, timestamps, units, signal quality, provenance and review state. Vendor-specific complexity remains inside adapters; the rest of Panacea consumes one normalized contract.

## Industry coverage target

The canonical catalog is `src/lib/medicalDeviceIntegrationCatalog.ts`. It covers the major digital device families encountered across acute care, ambulatory care, imaging, laboratories, procedure rooms and home monitoring:

- bedside multiparameter monitoring, ECG/telemetry and home vital-sign devices;
- cath-lab coronary physiology plus IVUS/OCT intravascular imaging;
- angiography/fluoroscopy, CT, MRI, radiography/mammography and ultrasound;
- ventilators, anesthesia workstations, infusion/syringe pumps, dialysis/CRRT and ECMO;
- central laboratory and point-of-care analyzers;
- spirometry/PFT, EEG/EMG/neurophysiology and endoscopy;
- surgical navigation/robotics and ophthalmic diagnostics;
- pacemaker/ICD/CRT interrogation;
- fetal/neonatal monitoring;
- digital pathology;
- rehabilitation/motion systems and consumer wearables.

This is intentionally family-level. Thousands of models exist, firmware changes, options differ, and many vendors expose proprietary interfaces. Panacea must never say “supported” merely because the family is present in the catalog.

## Interoperability ladder

Prefer standards before proprietary parsing:

1. **DICOM / DICOMweb** for images, volumes, waveforms and imaging reports where the source supports them.
2. **IHE Devices** profiles for point-of-care device integration: DEC for observations, ACM for alerts, IDCO for implantable cardiac observations, and IPEC/PIV for infusion workflow.
3. **IEEE 11073** device interoperability, including service-oriented device connectivity (SDC) in high-acuity environments and personal-health-device patterns where applicable.
4. **HL7 v2** for existing hospital/LIS interfaces.
5. **FHIR R4** for normalized enterprise publication and Panacea/SATUSEHAT workflows.
6. **BLE GATT, USB, serial or TCP/IP** only through a documented device adapter.
7. **Vendor SDK / vendor cloud** when no open standard provides the required data.

Proprietary wire protocols are not reverse-engineered in production without an authorized, documented integration path.

## One ingestion pipeline

```
physical device
    ↓
source-specific adapter
    ↓
identity + patient/encounter association
    ↓
timestamp / clock-skew validation
    ↓
unit + semantic normalization
    ↓
signal-quality / technical-QC gate
    ↓
canonical device event
    ↓
analyzer registry
    ↓
longitudinal patient state
    ├── Your Body / Body Exposure
    ├── Clinical command space
    ├── AI-EMR live context
    └── clinician-reviewed FHIR/SATUSEHAT publication
```

Images/volumes stay in the DICOM imaging path and are referenced from clinical resources rather than flattened into scalar observations. Continuous waveforms should use a time-series/waveform store and bounded windows; do not force high-frequency raw streams into ordinary FHIR Observation rows.

Step 2 of the implementation sequence below (the non-scalar device-event envelope) is now landed as `src/lib/medicalDeviceEventEnvelope.ts`, with a matching `MEDICAL_DEVICE_EVENT_ENVELOPE_BOUNDARY` string that states this rule in code, not only in this document.

## Analyzer design

Every analyzer declares:

- required device family and input signals;
- exact formula/algorithm version;
- unit assumptions;
- required sampling characteristics;
- minimum signal-quality requirements;
- output provenance and confidence;
- whether the output is technical QC, descriptive physiology, a validated clinical index or only an educational simulation;
- review/publication requirements.

The first analyzer classes are transport integrity, clock skew, signal quality, trend, waveform analysis, hemodynamics, coronary physiology, respiratory mechanics, imaging geometry/quantification, radiation exposure, alert context, therapy delivery, laboratory QC, implant interrogation, movement biomechanics and device health.

### Core formulas

These formulas are deterministic helpers, not autonomous diagnoses:

- **Transport age:** `age_ms = max(0, now - receivedAt)`.
- **Clock skew / delivery latency:** `Δt = receivedAt - capturedAt`.
- **Valid sample completeness:** `completeness = valid_samples / expected_samples × 100%`.
- **Pulse pressure:** `PP = SBP - DBP`.
- **Approximate MAP at ordinary adult heart rates:** `MAP ≈ DBP + (SBP - DBP) / 3`.
- **Shock index:** `SI = HR / SBP`.
- **FFR:** `FFR = Pd / Pa` during the required physiologic conditions; Panacea must not label a generic pressure ratio as FFR without valid calibration and hyperemic context.
- **P/F ratio:** `P/F = PaO2 / FiO2`, with FiO2 as a fraction.
- **Static respiratory-system compliance:** `Cstat = VT / (Pplat - PEEP)` when an inspiratory hold and valid plateau pressure are present.
- **Driving pressure:** `ΔP = Pplat - PEEP`.

Vendor-specific indexes such as proprietary resting pressure-ratio implementations remain vendor-defined and must be implemented from their validated specification rather than guessed from a marketing name.

## AVVIGO+-class cath-lab integration

The poster that motivated this work is Boston Scientific AVVIGO+ Multi-Modality Guidance System. Its public documentation describes a combined PCI-guidance platform for HD IVUS plus coronary physiology, with automated lesion assessment and tableside operation. Panacea should model this class as two coordinated streams:

1. **Intravascular imaging**: pullback frames/series, image geometry, lumen/vessel contours, lesion/stent measurements, pullback position/time and analysis provenance.
2. **Coronary physiology**: aortic and distal pressure streams, pressure-ratio values, calibration/equalization state, pullback timing and procedure context.

A real AVVIGO+ adapter is **not** considered implemented until an authorized Boston Scientific export/API/interface is identified and tested. Public product literature is enough to design the data model, not enough to claim connectivity.

## Safety boundary

Medical-device connectivity can become a regulated control problem very quickly. Panacea therefore starts **inbound/read-only**:

- no pump rate changes;
- no ventilator setting changes;
- no dialysis/ECMO control;
- no implant programming;
- no surgical robot/navigation actuation;
- no automatic treatment order generated from device data.

Any future bidirectional control requires a separately validated pathway with manufacturer authorization, risk management, cybersecurity controls, hazard analysis, auditability and the applicable regulatory/quality-system process. A UI button is not a medical-device control interface.

## Data-quality gates

No sample/artifact reaches clinical context unless the integration can preserve:

- exact source device identity and adapter version;
- patient + encounter association;
- source capture time and receive time;
- canonical units and semantic code when available;
- signal/measurement quality or explicit “unknown”;
- source payload provenance / immutable identifier;
- duplicate detection and replay protection;
- consent and access scope;
- review state for clinical publication.

A source that cannot satisfy these fields remains quarantined or reference-only.

## Relationship to existing Panacea code

- `src/lib/visitOperatingSystem.ts` remains the live visit/session kernel.
- `src/lib/visitDeviceAdapters.ts` remains the scalar adapter boundary for Visit OS.
- `src/lib/visitFhirObservation.ts` remains the clinician-accepted FHIR Observation path.
- `src/lib/dicom.ts`, DICOM series/MPR modules and Body Exposure imaging components remain the imaging path.
- `src/lib/panaceaLongitudinalState.ts` remains the longitudinal source of truth.
- `src/lib/medicalDeviceIntegrationCatalog.ts` is the cross-industry capability registry tying those paths together.

Do not create a second EMR, second patient state, second DICOM viewer or second visit session engine.

## Implementation sequence

1. Keep the catalog as the capability map and add vendor/model adapters only when a real interface is available.
2. **Landed.** Add a canonical non-scalar device-event envelope for waveforms, alarms, settings, therapy-delivery events and image references — `src/lib/medicalDeviceEventEnvelope.ts`.
3. **Partially landed.** Implement technical analyzers first: identity, timestamps, replay, unit normalization, signal quality, sample completeness, device liveness. The envelope module above already validates identity/profile/transport declaration, capture-vs-receive clock order, replay/dedupe by `(deviceId, kind, sequence)`, waveform signal-quality range, waveform sample completeness, and transport-freshness liveness classification. Still open: real unit-normalization tables (this module only checks non-blank units, it does not convert or reconcile units across vendors) and any analyzer beyond these structural checks.
4. Add source-specific high-value adapters in this order: bedside monitors → ventilators → infusion pumps → cath-lab IVUS/physiology → laboratory/POC → implant interrogation.
5. Route imaging through DICOM/DICOMweb and high-frequency streams through bounded waveform/time-series storage.
6. Project only normalized, provenance-preserving results into Clinical/AI-EMR/Body surfaces.
7. Publish only clinician-accepted eligible results through the existing FHIR/SATUSEHAT boundary.
8. Maintain a device conformance matrix: vendor, model, firmware, interface, fields verified, test fixture, supported modes, known limitations and last validation date.

## Acceptance rule

A device moves from `catalog-only` → `contract-ready` → `adapter-tested` → `production-validated`.

Only the last two states permit a support claim, and production use should prefer `production-validated` for regulated clinical workflows.
