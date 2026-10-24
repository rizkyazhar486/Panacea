# Panacea Universal Medical Device Translation & Synchronized Healthcare OS — Past, Present and Future
## Architecture, data engineering and future-device conformance contract — 2026-10-13

**Status: future-extensible architecture, with a small non-patient-facing event explanation projection in `src/domains/observability/adapters/medicalDeviceOsTranslation.ts`. This document does not certify vendor support, device connectivity, medical diagnoses, real-time control, patient integration, clinical efficacy or regulatory clearance.**

Related authorities: `PANACEA_GENESIS_DIRECTIVE.md`, `PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md`, `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`, `PANACEA_HUMAN_OBSERVABILITY_DOCTRINE.md`, `DOCS/MEDICAL-DEVICE-FABRIC.md`, and `PANACEA_CONSTITUTION.md`.

## 0. Mandatory temporal scope: ALL generations of medical devices

The owner's explicit scope is **past, present, and future medical devices**, including their data and documentation. Support is bounded by accessible, authorized evidence — not retroactive universal connectivity.

| Device generation | Example evidence | Translation route | Truth & time boundary |
| --- | --- | --- | --- |
| **Past / legacy analog** | Paper ECG, handwritten/manual BP or temperature logs, film X-ray, charted ventilator printout | Scanned source image or clinician-attested transcription; typed human review before use | Historical observation/document, NOT automatically a directly measured live device event |
| **Past / legacy digital** | Serial/RS-232 monitor, proprietary historic file, early DICOM, HL7 v2 archive, offline removable media | Authorized file/serial parser or approved export and data migration | Preserve original device/method/version, archived clinical context, dates, conversion uncertainty |
| **Present digital** | ICU monitor, imaging, laboratory, remote vital sensors, clinical wearable | Existing Visit OS scalar path, non-scalar envelope, DICOM/HL7/FHIR and approved adapters | Live or imported signal with device identity, timestamps, quality and consent |
| **Future/emerging** | New optical/implantable/synthetic-biology diagnostics and new sensor modalities | Versioned capability handshake, documented plugin/adapter + independent conformance | Research/sandbox by default until individual device and intended use are validated |

**Historical evidence must never be quietly upgraded** into current telemetry, clinician-accepted measurement or a signed finding. If an original has only a year or a date, preserve that limited time precision. If calibration, units, provenance, subject identity or original document cannot be validated, quarantine or present it explicitly as unverified historical reference. Do not silently recompute old reference ranges against current methods. Preserve corrections with lineage and never invent missing signal samples from a scan.

Historical backfill and future research data use different trust gates from present-day live telemetry. All three still contribute, where authorized and correctly understood, to **one longitudinal clinical narrative** rather than three incompatible patient charts.

## 1. Universal does not mean auto-connect

Panacea must be **prepared to represent historical device evidence, onboard current compatible and authorized medical devices, and adapt to future device data contracts**, from analog ECG and archival imaging to wearables, ventilators, ICU monitors, implants, laboratory equipment, neuromodulation research hardware and novel biomedical sensors.

**Device discoverability, protocol support, payload translation, verified integration and clinical approval are different gates.** Unknown proprietary protocols cannot be decoded by wishful AI generation. A future device may require a licensed SDK, manufacturer agreement, approval, different jurisdiction adapter or separate regulated software.

No arbitrary model may write a device driver, infer a proprietary protocol from a marketing brochure, or generate missing patient measurements. AI may draft an adapter mapping **only** from a lawful specification, test fixtures and independent review. The adapters must pass deterministic conformance before deployment.

## 2. Convergent architecture — one clinical reality

```
LEGACY ARCHIVE / ANALOG TRANSCRIPTION / CURRENT DEVICE / LAB / IMAGING / FUTURE RESEARCH SENSOR
  -> authorized historical digitization / protocol- and standard-specific SOURCE ADAPTER
  -> capability handshake (profile/model/firmware/protocol/supported data, read-only)
  -> authentication + purpose-bound consent + owner/subject/encounter binding
  -> raw ingress quarantine (untrusted until accepted; keep historical raw scans/files)
  -> integrity/QC: schema, replay/idempotency, historical date precision vs transport clock, units, semantics, quality
  -> transport-normalized scalar / non-scalar canonical DEVICE EVENT
  -> typed data routing:
       - Visit OS scalar adapter (clinically measured as verified)
       - device event envelope (alarm / setting / therapy-report / waveform reference)
       - DICOM/DICOMweb imaging reference & imaging store
       - bounded waveform / time-series store
       - HL7 v2 / FHIR R4 enterprise adapters
  -> source-linked deterministic analyzer + separated AI EXPLANATION DRAFT
  -> existing one Longitudinal Patient State / Human Observability
  -> synchronized projections: Clinical / Visit OS / AI-EMR / Body Exposure / Research
  -> clinician-controlled review, signed plans, lab/referral closure, validated publication
  -> audit, revoked-consent behavior, correction/late-data replay and outcome feedback
```

**Never** conflate device ingestion with clinician acceptance. The same event ID, patient/encounter identity, source reference and time semantics must be traceable across surfaces. High-frequency signals are not converted into thousands of unbounded FHIR rows; imaging is not flattened into artificial scalar measurements.

## 3. Future-device adapter declaration (design contract)

Each device-family/vendor/model implementation must define:

| Field | Required proof |
| --- | --- |
| `profileId`, vendor/model, optional firmware | Catalog membership plus verified source documentation |
| `adapterId/version`, interface and transport | Allowed protocols, authenticated permissioned endpoint, license/terms |
| `dataShapes`, metrics, units, codes | Semantic mappings with reference terminology, versioned conversion and unknown-unit rejection |
| `subjectId/encounterId` binding | Trusted source binding or explicit rejection; never approximate matching |
| `capturedAt/receivedAt/sequence` | Explicit clock domain, timezone, skew, out-of-order policy, duplicate replay handling |
| `signalQuality`, calibration and range | Source QC and validity, not fabricated confidence |
| `rawArtifactRef`, checksum, lineage | Immutable or auditable raw provenance, correct retention |
| `consentPurpose`, authorization | Scope, grant/revoke, tenant/role policy, retention and access audit |
| `mappingVersion`, `evidenceClass` | Measured/reference/derived/estimated/simulated distinction |
| `conformanceManifest` | Authorized fixture, positive/negative tests, security review, supported modes and known limitations |
| `controlCapabilities` | **Inbound read-only by default**, including alarms and therapy status; no control commands |

A universal metadata contract **must not become one universal numeric container**. Maintain domain types for scalar readings, bounded waveforms, alarm states, imaging study references, therapy delivery reports, lab results, and future modality-specific artifacts.

## 4. Data engineering laws

1. **Event-time first:** Preserve `capturedAt` vs `receivedAt`, sequence, late arrival, clock skew and transport delay. Synchronize timelines without rewriting clinical history.
2. **Idempotent ingestion:** Deduplicate by verified device identity + immutable source event key/version. Handle retries, partitions, replay, backfill and corrections as auditable transitions; do not guess identity.
3. **Typed units/semantics:** Validate UCUM/LOINC/SNOMED CT and relevant device code systems when applicable. Unknown calibration, units or mappings -> quarantine/reference-only, not a confident reading.
4. **Bounded storage:** Waveform chunk index + checksum and external object storage; DICOM images and video externally referenced; scalar events and compact QC metadata in event store. Use explicit retention and lawful encryption/security.
5. **Lossless provenance:** Keep source payload lineage, transformation versions and immutable pointers; never silently replace raw data with AI explanation.
6. **Consent by purpose:** Care, research, education and model training are **distinct** authorized purposes. Research/model training never inherit care access automatically; revocation and subject deletion/retention exceptions require explicit governance.
7. **Device is not clinician:** Manufacturer alarm severity is a *device-reported state*, not a diagnosis; a therapy-delivery message is not a verified medication administration; a model-derived physiology value is not directly measured.
8. **Outage resilience:** Ingest queues with backpressure, fault isolation per device, retry limits, quarantined malformed data, signed acknowledgments if supported, and observability for dropped/delayed data. No silent fallback placeholder.
9. **Explained gaps:** If a source fails, explain which gate failed (authorization, identity, time, unit, quality, or unsupported firmware), without displaying patient data to unauthorized users.
10. **Never synthetic clinical truth:** AI can create a versioned **explanation, visualization, hypothesis, derived calculation or clinical draft** from traceable source observations, never generate replacement measurements or signed treatment decisions.

## 5. Translation and generative explanation

Every accepted, authorized event may produce an **OS explanation projection**, not a new fact:

- **What was observed:** source-reported modality and event/source date (precision explicit for archives), event type/time, signal/report pointer, units if known, quality and provenance. When a legacy source was transcribed, say “historical record states”, not “device streamed”.
- **What it means technically:** constrained explanation of the source's declared semantics; avoid extrapolating to patient diagnosis.
- **What remains unknown:** calibration limits, sample quality, reference context, device support maturity, missing follow-up/clinician review.
- **Next responsible action:** view source, verify patient/encounter, clinician review, or research-only exploration, never automatic treatment.
- **Why this is shown:** retained event/provenance anchor, mapping/model versions, source documents and evidence class.
- **Depth:** patient plain language / clinician technical / researcher uncertainty and method using the existing Cognitive Translation Kernel; all levels share the same underlying event and truth status.

Language models must treat source text and vendor payloads as **untrusted data**, never instructions. Ground every generated sentence in explicit evidence and expose uncertainty. Store narrative as a separate `ai-draft` or derived projection with a link back to events. A narrative is **not** a new Observation or proof of device compatibility.

The minimal pure prototype `medicalDeviceOsTranslation.ts` validates existing non-scalar envelopes, enforces supplied scope, emits a restricted technical explanation, and **never writes state or enables publication**. Production authorization, cross-tenant identity verification and clinical publication remain upstream/server/clinician responsibilities; scope flags supplied by callers are not independently verified by a pure function.

## 6. Synchronization semantics

- One global patient reference and correct encounter association when resolvable, plus per-device, archive/document and per-protocol source identifiers; unresolved historical subject identity blocks clinical association.
- Prefer append-only, time-stamped events and deterministic read models with explicit event time (including date precision), archival import time, clinical review time, source-vs-server clock and analysis/reinterpretation version.
- Maintain separate states for real-time observability, signed clinical truth, derived models and counterfactual research.
- Use an explicit watermark or equivalent per-source policy for late data; surface gaps rather than interpolating undisclosed values.
- Version every analyzer, correction and explanation. Corrections supersede with provenance; do not erase signed clinical records or reinterpret the past without lineage.
- A device becoming disconnected must not generate false zeros or automatically clear alarms. Active alerts and clinical thresholds require manufacturer specifications and appropriate clinician acceptance before patient-facing claims.
- Validate synchronization across home -> primary care -> ED -> ward -> OR -> ICU -> discharge -> follow-up with the **same** patient state and explicit permission boundaries.

## 7. Conformance & translation maturity

`catalog-only -> contract-ready -> adapter-tested -> production-validated`.

`catalog-only`: theoretical family or standard mapping; **no vendor support**.

`contract-ready`: written schema and lawful device specification; no real supported integration.

`adapter-tested`: authorized real payload fixtures, negative tests and verified decoding; limited stated modes only, never universal clinical clearance.

`production-validated`: actual authorized site/device/model/firmware scenario, full privacy/authz, uptime/latency, failover, audit, clinical-review and regulatory checks as applicable.

**Required gate tests:** schema version compatibility, unauthorized subjects/tenants, revoked/missing consent, wrong encounter, rogue commands, missing/calibration-incompatible units, NaN/Infinity, invalid clock/skew, duplicate event IDs, out-of-order streams, corrupt checksum, unsupported firmware, massive payloads, model hallucinations, prompt injection in device text, wrong semantic mapping, failure of reviewer gate, invalid publication state, and device/network outage.

Research-only device integrations are visibly separate from licensed clinical workflows. No silent upgrade from a catalog entry to a supported connection.

## 8. Genesis innovation loop and staged execution

**First** finish the clinical workflow proof and higher-priority safety/security/data/CI/release blockers.

**Smallest present slice:** a pure, read-only translation-and-explanation projection for existing non-scalar device events **and separately typed historical archive references**; fail closed on missing scope, wrong patient, unsafe time/identity or incomplete provenance. No second patient database, no vendor connector, no OCR inference, no UI expansion, no device actuation.

**Subsequent independent PRs (only after proof):** source conformance manifest -> real adapter for one device model -> trusted server-side subject/consent binding -> event-synchronized provenance ledger -> clinician reviewed publication -> explanatory Cognitive Translation projection in existing Clinical/Body surfaces -> measured end-to-end clinical value.

**Research future:** evaluate new biosensors/neural/optical devices in governed sandboxes first, with testable hypotheses and independent validation; never treat general-purpose AI as a shortcut to a regulated device interface.

## 9. Primary standards and reading

- HL7 FHIR R4 Observation: https://hl7.org/fhir/R4/observation.html — observations, device references and clinical context.
- IHE Devices Technical Framework (DEC, ACM, IDCO, IPEC, PIV): https://profiles.ihe.net/DEV/index.html — applicable published IHE device interoperability profiles.
- IEEE 11073 families (personal health and service-oriented device connectivity): verify model-specific conformance/specification; IEEE terminology alone is not device certification.
- FDA, *Design Considerations and Pre-market Submission Recommendations for Interoperable Medical Devices* (2017): https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-considerations-and-pre-market-submission-recommendations-interoperable-medical-devices
- FDA, *Cybersecurity in Medical Devices: Quality Management System Considerations and Content of Premarket Submissions* (2026): https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-management-system-considerations-and-content-premarket

**Definition of success:** Authorized **historical artifacts, current device observations and emerging compatible sensors** can be appropriately represented by versioned, tested translators/adapters, correctly associated with one patient only when verified, chronologically synchronized without fabricated timestamps, and explained transparently with source, uncertainty and qualified review. Emerging hardware requires a new validated adapter; retrospective records remain visibly retrospective. This is an evolving acceptance target, **not a claim of universal support or a clinically deployed integration**.
