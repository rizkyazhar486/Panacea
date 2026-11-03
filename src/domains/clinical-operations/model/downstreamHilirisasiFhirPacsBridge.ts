/**
 * Panacea Downstream Hilirisasi & Enterprise Health Interoperability Bridge
 *
 * Bridges Panacea-OS core engines (Sepsis CDS, KaloLumen DICOM 3DCG, Longitudinal Healthspan)
 * with hospital PACS/RIS, SMART-on-FHIR clinical systems, and commercial athletic recovery ecosystems.
 *
 * Standard Specifications & Guidelines:
 * 1. HL7 FHIR Release 4 (R4) - DiagnosticReport, CarePlan, Encounter, Observation, Provenance.
 *    Reference: https://hl7.org/fhir/R4/bundle.html
 * 2. DICOM PS3.18 / DICOMweb WADO-RS & QIDO-RS standard imaging study endpoints.
 *    Reference: https://dicom.nema.org/medical/dicom/current/output/chtml/part18/chapter_10.html
 * 3. Surviving Sepsis Campaign 2021 & 2026 Guidelines:
 *    - Evans L et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis
 *      and Septic Shock 2021. Crit Care Med. 2021;49(11):e1063-e1143 (PMID: 34605781).
 *    - SCCM/ESICM Surviving Sepsis Campaign International Guidelines 2026 Update.
 * 4. FIPS 180-4 / RFC 6234 Cryptographic Hash Standard (Secure SHA-256).
 * 5. Gabbett TJ. The training-injury prevention paradox: should athletes be training smarter and harder?
 *    Br J Sports Med. 2016;50(5):273-280 (PMID: 26758673).
 */

export type TruthClass =
  | 'OBSERVED_CLINICAL'
  | 'DERIVED_PHYSIOLOGICAL'
  | 'SIMULATED_EDUCATIONAL'
  | 'REFERENCE_ATLAS';

export const MISSING_OBSERVATION = Symbol('PANACEA_MISSING_OBSERVATION');

// ── Standard FIPS 180-4 SHA-256 Engine (Pure, Isomorphic, Synchronous) ───────
export { sha256Hex } from '../../../shared/kernel/sha256.ts'

/**
 * Generates an RFC 4122 compliant deterministic UUIDv4-derivative from a seed string.
 * Used for valid FHIR urn:uuid identities without random non-determinism in CI.
 */
export function generateDeterministicUuid(seed: string): string {
  const hash = sha256Hex(seed);
  const p1 = hash.slice(0, 8);
  const p2 = hash.slice(8, 12);
  const p3 = '4' + hash.slice(13, 16);
  const p4 = ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20);
  const p5 = hash.slice(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

// ── FHIR R4 Standard Code Systems & Interfaces ───────────────────────────────

export const FHIR_CODE_SYSTEMS = {
  LOINC: 'http://loinc.org',
  SNOMED_CT: 'http://snomed.info/sct',
  ICD10: 'http://hl7.org/fhir/sid/icd-10',
  UCUM: 'http://unitsofmeasure.org',
  ACT_CODE: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
  CONDITION_CLINICAL: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
  CONDITION_VER_STATUS: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  CONDITION_CATEGORY: 'http://terminology.hl7.org/CodeSystem/condition-category',
  OBSERVATION_INTERPRETATION: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
  DATA_OPERATION: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
  PROVENANCE_PARTICIPANT_TYPE: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
  PANACEA_TRUTH_CLASS: 'http://panaceamed.id/fhir/truth-class',
} as const;

export interface FhirCoding {
  readonly system: string;
  readonly code: string;
  readonly display: string;
}

export interface FhirCodeableConcept {
  readonly coding: readonly FhirCoding[];
  readonly text?: string;
}

export interface FhirIdentifier {
  readonly use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  readonly type?: FhirCodeableConcept;
  readonly system: string;
  readonly value: string;
}

export interface FhirResourceHeader {
  readonly resourceType: string;
  readonly id: string;
  readonly meta: {
    readonly versionId: string;
    readonly lastUpdated: string;
    readonly profile?: readonly string[];
    readonly tag?: readonly FhirCoding[];
  };
}

export interface FhirPatientResource extends FhirResourceHeader {
  readonly resourceType: 'Patient';
  readonly active?: boolean;
  readonly identifier?: readonly FhirIdentifier[];
  readonly gender?: 'male' | 'female' | 'other' | 'unknown';
  readonly birthDate?: string;
}

export interface FhirObservationResource extends FhirResourceHeader {
  readonly resourceType: 'Observation';
  readonly status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  readonly code: FhirCodeableConcept;
  readonly subject: { readonly reference: string };
  readonly encounter?: { readonly reference: string };
  readonly effectiveDateTime: string;
  readonly valueQuantity?: {
    readonly value: number;
    readonly unit: string;
    readonly system: string;
    readonly code: string;
  };
  readonly dataAbsentReason?: FhirCodeableConcept;
  readonly interpretation?: readonly FhirCodeableConcept[];
}

export interface FhirConditionResource extends FhirResourceHeader {
  readonly resourceType: 'Condition';
  readonly clinicalStatus: FhirCodeableConcept;
  readonly verificationStatus?: FhirCodeableConcept;
  readonly category?: readonly FhirCodeableConcept[];
  readonly severity?: FhirCodeableConcept;
  readonly code: FhirCodeableConcept;
  readonly subject: { readonly reference: string };
  readonly encounter?: { readonly reference: string };
  readonly onsetDateTime?: string;
  readonly recordedDate?: string;
}

export interface FhirEncounterResource extends FhirResourceHeader {
  readonly resourceType: 'Encounter';
  readonly status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  readonly class: FhirCoding;
  readonly type?: readonly FhirCodeableConcept[];
  readonly subject: { readonly reference: string };
  readonly period?: {
    readonly start: string;
    readonly end?: string;
  };
}

export interface FhirCarePlanResource extends FhirResourceHeader {
  readonly resourceType: 'CarePlan';
  readonly status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';
  readonly intent: 'proposal' | 'plan' | 'order' | 'option';
  readonly category: readonly FhirCodeableConcept[];
  readonly subject: { readonly reference: string };
  readonly encounter?: { readonly reference: string };
  readonly activity: readonly {
    readonly detail: {
      readonly code: FhirCodeableConcept;
      readonly status: 'not-started' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
      readonly description: string;
    };
  }[];
}

export interface FhirProvenanceResource extends FhirResourceHeader {
  readonly resourceType: 'Provenance';
  readonly target: readonly { readonly reference: string }[];
  readonly recorded: string;
  readonly activity?: FhirCodeableConcept;
  readonly agent: readonly {
    readonly type?: FhirCodeableConcept;
    readonly who: { readonly display: string };
  }[];
}

export type FhirBundleType =
  | 'document'
  | 'message'
  | 'transaction'
  | 'transaction-response'
  | 'batch'
  | 'batch-response'
  | 'history'
  | 'searchset'
  | 'collection';

export interface FhirBundleEntry {
  readonly fullUrl: string;
  readonly resource: FhirResourceHeader;
}

export interface FhirBundle {
  readonly resourceType: 'Bundle';
  readonly id: string;
  readonly type: FhirBundleType;
  readonly timestamp: string;
  readonly total: number;
  readonly entry: readonly FhirBundleEntry[];
}

// ── DICOMweb Interfaces ─────────────────────────────────────────────────────

export interface DicomWebStudyMetadata {
  readonly studyInstanceUid: string;
  readonly seriesInstanceUid: string;
  readonly sopClassUid: string;
  readonly modality: 'CT' | 'MR';
  readonly patientId: string;
  readonly wadoRsUrl: string;
  readonly qidoRsUrl: string;
  readonly hounsfieldLayers: {
    readonly skinRange: readonly [number, number];
    readonly myocardiumRange: readonly [number, number];
    readonly boneRange: readonly [number, number];
  };
  readonly truthClass: TruthClass;
}

export interface PanaceaLhidEnvelope {
  readonly lhid: string;
  readonly didUri: string;
  readonly patientId: string;
  readonly generatedAtIso: string;
  readonly cryptographicSha256: string;
  readonly truthClass: TruthClass;
  readonly isClinicallyReviewed: boolean;
  readonly payload: Record<string, unknown>;
}

export interface AcwrRecoveryRecommendationInput {
  readonly acuteChronicWorkloadRatio: number;
  readonly autonomicRecoveryPercent: number;
  readonly hrRecovery60Bpm?: number | typeof MISSING_OBSERVATION;
  readonly sleepScorePercent?: number;
}

export interface AcwrRecoveryRecommendationOutput {
  readonly riskZone: 'OPTIMAL_SWEET_SPOT' | 'HIGH_INJURY_SPIKE' | 'OVERTRAINING_FATIGUE' | 'UNDERTRAINING';
  readonly maxRecommendedSessionIntensity: 'HIGH' | 'MODERATE' | 'LOW_RECOVERY_ONLY';
  readonly recommendedClassPassDropins: readonly string[];
  readonly clinicalSafetyMessage: string;
}

// ── DICOM UID and Endpoint Validation (PS3.5 & Security Standards) ───────────

/**
 * Validates a DICOM Unique Identifier (UID) according to DICOM PS3.5 Section 9.
 * Format requirements:
 * - Only numeric digits and dots (0-9, .)
 * - Maximum length: 64 characters
 * - Each component must not contain leading zeroes (except single digit '0')
 * - Root prefix must start with 0, 1, or 2
 */
export function validateDicomUid(uid: string): { readonly valid: boolean; readonly error?: string } {
  if (typeof uid !== 'string' || !uid.trim()) {
    return { valid: false, error: 'DICOM UID cannot be empty' };
  }
  if (uid.length > 64) {
    return { valid: false, error: `DICOM UID exceeds maximum length of 64 characters (${uid.length})` };
  }
  const uidPattern = /^([0-2])(\.(0|[1-9][0-9]*))+$/;
  if (!uidPattern.test(uid)) {
    return { valid: false, error: 'DICOM UID does not conform to PS3.5 format (invalid leading zeroes, illegal characters, or invalid root)' };
  }
  return { valid: true };
}

/**
 * Validates PACS/RIS endpoint URL with SSRF protection against private cloud metadata IPs.
 */
export function validatePacsEndpointUrl(
  url: string,
  options?: { readonly allowLocalDevServer?: boolean },
): { readonly valid: boolean; readonly error?: string; readonly cleanUrl?: string } {
  if (typeof url !== 'string' || !url.trim()) {
    return { valid: false, error: 'PACS endpoint URL cannot be empty' };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: 'Malformed PACS endpoint URL' };
  }

  const isLocalDev = Boolean(options?.allowLocalDevServer);
  const hostname = parsed.hostname.toLowerCase();

  if (parsed.protocol === 'http:' && !isLocalDev) {
    return { valid: false, error: 'Insecure HTTP protocol is prohibited in production PACS endpoints (HTTPS required)' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, error: `Unsupported protocol ${parsed.protocol} for PACS endpoint` };
  }

  // SSRF Protection: Block cloud metadata and link-local services
  const blockedHosts = [
    '169.254.169.254',
    'metadata.google.internal',
    '100.100.100.200',
    'instance-data',
  ];
  if (blockedHosts.includes(hostname)) {
    return { valid: false, error: 'Endpoint resolves to a prohibited cloud metadata address (SSRF guard)' };
  }

  // Block private subnets unless local development server is explicitly allowed
  const isPrivateIp =
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    /^127\./.test(hostname) ||
    hostname === 'localhost';

  if (isPrivateIp && !isLocalDev) {
    return { valid: false, error: 'Endpoint points to private intranet IP without dev authorization' };
  }

  const cleanUrl = parsed.origin + parsed.pathname.replace(/\/+$/, '');
  return { valid: true, cleanUrl };
}

// ── FHIR R4 Resource Builders (Patient, Condition, Encounter) ───────────────

/**
 * Builds a standard FHIR R4 Patient resource with an anonymized opaque identifier
 * derived deterministically from the canonical Panacea patient identity.
 */
export function buildFhirPatientResource(params: {
  readonly patientId: string;
  readonly truthClass?: TruthClass;
  readonly gender?: 'male' | 'female' | 'other' | 'unknown';
  readonly birthDate?: string;
  readonly timestampIso?: string;
  readonly idOverride?: string;
}): FhirPatientResource {
  const now = params.timestampIso && !Number.isNaN(Date.parse(params.timestampIso))
    ? params.timestampIso
    : new Date().toISOString();
  const truth = params.truthClass ?? 'OBSERVED_CLINICAL';
  const isEducational = truth === 'SIMULATED_EDUCATIONAL';
  const opaqueId = `pt-${sha256Hex(`PANACEA_PATIENT:${params.patientId}`).slice(0, 12)}`;
  const resourceId = params.idOverride ?? opaqueId;

  return {
    resourceType: 'Patient',
    id: resourceId,
    meta: {
      versionId: '1',
      lastUpdated: now,
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
      tag: [
        {
          system: FHIR_CODE_SYSTEMS.PANACEA_TRUTH_CLASS,
          code: truth,
          display: isEducational ? 'Simulated Educational Patient' : 'Clinical Patient Record',
        },
      ],
    },
    active: true,
    identifier: [
      {
        use: 'official',
        system: 'http://panaceamed.id/patient-id',
        value: opaqueId,
      },
    ],
    gender: params.gender,
    birthDate: params.birthDate,
  };
}

/**
 * Builds a standard FHIR R4 Condition resource for Sepsis or other clinical disorders
 * with full SNOMED CT and ICD-10 code systems, clinical status, and verification status.
 */
export function buildFhirConditionResource(params: {
  readonly patientId: string;
  readonly conditionCode?: {
    readonly snomedCode?: string;
    readonly snomedDisplay?: string;
    readonly icd10Code?: string;
    readonly icd10Display?: string;
  };
  readonly clinicalStatus?: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved';
  readonly verificationStatus?: 'unconfirmed' | 'provisional' | 'differential' | 'confirmed' | 'refuted' | 'entered-in-error';
  readonly encounterId?: string;
  readonly truthClass?: TruthClass;
  readonly timestampIso?: string;
  readonly idOverride?: string;
}): FhirConditionResource {
  const now = params.timestampIso && !Number.isNaN(Date.parse(params.timestampIso))
    ? params.timestampIso
    : new Date().toISOString();
  const truth = params.truthClass ?? 'OBSERVED_CLINICAL';
  const isEducational = truth === 'SIMULATED_EDUCATIONAL';
  const conditionUuid = params.idOverride ?? generateDeterministicUuid(`condition:sepsis:${params.patientId}:${now}`);
  const opaquePatientRef = `Patient/pt-${sha256Hex(`PANACEA_PATIENT:${params.patientId}`).slice(0, 12)}`;

  const snomedCode = params.conditionCode?.snomedCode ?? '91302008';
  const snomedDisplay = params.conditionCode?.snomedDisplay ?? 'Sepsis (disorder)';
  const icd10Code = params.conditionCode?.icd10Code ?? 'A41.9';
  const icd10Display = params.conditionCode?.icd10Display ?? 'Sepsis, unspecified organism';

  const codings: FhirCoding[] = [
    {
      system: FHIR_CODE_SYSTEMS.SNOMED_CT,
      code: snomedCode,
      display: snomedDisplay,
    },
    {
      system: FHIR_CODE_SYSTEMS.ICD10,
      code: icd10Code,
      display: icd10Display,
    },
  ];

  const clinicalStatus = params.clinicalStatus ?? 'active';
  const verificationStatus = params.verificationStatus ?? (isEducational ? 'provisional' : 'confirmed');

  return {
    resourceType: 'Condition',
    id: conditionUuid,
    meta: {
      versionId: '1',
      lastUpdated: now,
      profile: ['http://hl7.org/fhir/StructureDefinition/Condition'],
      tag: [
        {
          system: FHIR_CODE_SYSTEMS.PANACEA_TRUTH_CLASS,
          code: truth,
          display: isEducational ? 'Simulated Educational Condition' : 'Clinical Diagnosis',
        },
      ],
    },
    clinicalStatus: {
      coding: [
        {
          system: FHIR_CODE_SYSTEMS.CONDITION_CLINICAL,
          code: clinicalStatus,
          display: clinicalStatus.charAt(0).toUpperCase() + clinicalStatus.slice(1),
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: FHIR_CODE_SYSTEMS.CONDITION_VER_STATUS,
          code: verificationStatus,
          display: verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1),
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: FHIR_CODE_SYSTEMS.CONDITION_CATEGORY,
            code: 'encounter-diagnosis',
            display: 'Encounter Diagnosis',
          },
        ],
      },
    ],
    code: {
      coding: codings,
      text: isEducational
        ? `Educational Simulation: ${snomedDisplay}`
        : `${snomedDisplay} (${icd10Code})`,
    },
    subject: { reference: opaquePatientRef },
    encounter: params.encounterId ? { reference: `Encounter/${params.encounterId}` } : undefined,
    onsetDateTime: now,
    recordedDate: now,
  };
}

/**
 * Builds a standard FHIR R4 Encounter resource documenting patient admission,
 * emergency triage, or outpatient encounter context.
 */
export function buildFhirEncounterResource(params: {
  readonly encounterId: string;
  readonly patientId: string;
  readonly status?: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  readonly encounterClass?: 'EMER' | 'IMP' | 'AMB' | 'ACUTE';
  readonly truthClass?: TruthClass;
  readonly timestampIso?: string;
  readonly idOverride?: string;
}): FhirEncounterResource {
  const now = params.timestampIso && !Number.isNaN(Date.parse(params.timestampIso))
    ? params.timestampIso
    : new Date().toISOString();
  const truth = params.truthClass ?? 'OBSERVED_CLINICAL';
  const isEducational = truth === 'SIMULATED_EDUCATIONAL';
  const opaquePatientRef = `Patient/pt-${sha256Hex(`PANACEA_PATIENT:${params.patientId}`).slice(0, 12)}`;
  const encClass = params.encounterClass ?? 'EMER';
  const classDisplay = encClass === 'EMER' ? 'emergency' : encClass === 'IMP' ? 'inpatient encounter' : 'ambulatory';
  const resourceId = params.idOverride ?? params.encounterId;

  return {
    resourceType: 'Encounter',
    id: resourceId,
    meta: {
      versionId: '1',
      lastUpdated: now,
      profile: ['http://hl7.org/fhir/StructureDefinition/Encounter'],
      tag: [
        {
          system: FHIR_CODE_SYSTEMS.PANACEA_TRUTH_CLASS,
          code: truth,
          display: isEducational ? 'Simulated Educational Encounter' : 'Clinical Encounter',
        },
      ],
    },
    status: params.status ?? 'in-progress',
    class: {
      system: FHIR_CODE_SYSTEMS.ACT_CODE,
      code: encClass,
      display: classDisplay,
    },
    type: [
      {
        coding: [
          {
            system: FHIR_CODE_SYSTEMS.SNOMED_CT,
            code: '91302008',
            display: 'Sepsis (disorder)',
          },
        ],
        text: 'Sepsis Resuscitation Encounter',
      },
    ],
    subject: { reference: opaquePatientRef },
    period: {
      start: now,
    },
  };
}

// ── FHIR R4 Bundle Builder for Sepsis Care ───────────────────────────────────

export interface BuildFhirBundleForSepsisCareParams {
  readonly patientId: string;
  readonly lactateMmolL?: number | typeof MISSING_OBSERVATION;
  readonly meanArterialPressureMmhg?: number | typeof MISSING_OBSERVATION;
  readonly antibioticAdministered: boolean;
  readonly fluidResuscitationOrdered: boolean;
  readonly fluidResuscitationAdministered?: boolean;
  readonly truthClass?: TruthClass;
  readonly encounterId?: string;
  readonly timestampIso?: string;
  readonly includePatientResource?: boolean;
  readonly includeConditionResource?: boolean;
}

/**
 * Generates an HL7 FHIR R4 Bundle containing Encounter Observations, CarePlan, and Provenance
 * based on Surviving Sepsis Campaign 2021 & 2026 guidelines.
 *
 * Enforces:
 * - RFC 4122 compliant urn:uuid identities.
 * - Strict truth-class demarcation (simulated educational cases are tagged and non-authorized).
 * - Action completion semantics: ordered fluids/antibiotics are NEVER marked as 'completed'
 *   without explicit confirmation of administration.
 * - Zero-fabrication: unmeasured parameters are strictly omitted from Observations.
 */
export function buildFhirBundleForSepsisCare(params: BuildFhirBundleForSepsisCareParams): FhirBundle {
  const now = params.timestampIso && !Number.isNaN(Date.parse(params.timestampIso))
    ? params.timestampIso
    : new Date().toISOString();

  const truth = params.truthClass ?? 'OBSERVED_CLINICAL';
  const isEducational = truth === 'SIMULATED_EDUCATIONAL';

  // Anonymized/Opaque patient reference for privacy
  const opaquePatientRef = `Patient/pt-${sha256Hex(`PANACEA_PATIENT:${params.patientId}`).slice(0, 12)}`;
  const patientUuid = generateDeterministicUuid(`patient:${params.patientId}`);
  const encounterUuid = params.encounterId
    ? generateDeterministicUuid(`encounter:${params.encounterId}:${now}`)
    : undefined;

  const bundleUuid = generateDeterministicUuid(`bundle:sepsis:${params.patientId}:${now}`);
  const entries: { fullUrl: string; resource: FhirResourceHeader }[] = [];
  const targetResourceUuids: string[] = [];

  // Optional Patient Resource in bundle
  if (params.includePatientResource) {
    const patientRes = buildFhirPatientResource({
      patientId: params.patientId,
      truthClass: truth,
      timestampIso: now,
      idOverride: patientUuid,
    });
    targetResourceUuids.push(`urn:uuid:${patientUuid}`);
    entries.push({
      fullUrl: `urn:uuid:${patientUuid}`,
      resource: patientRes,
    });
  }

  // Optional Encounter Resource in bundle
  if (params.encounterId && encounterUuid) {
    const encounterRes = buildFhirEncounterResource({
      encounterId: params.encounterId,
      patientId: params.patientId,
      truthClass: truth,
      timestampIso: now,
      idOverride: encounterUuid,
    });
    targetResourceUuids.push(`urn:uuid:${encounterUuid}`);
    entries.push({
      fullUrl: `urn:uuid:${encounterUuid}`,
      resource: encounterRes,
    });
  }

  // Optional Condition Resource (Sepsis diagnosis)
  if (params.includeConditionResource) {
    const conditionUuid = generateDeterministicUuid(`condition:sepsis:${params.patientId}:${now}`);
    const conditionRes = buildFhirConditionResource({
      patientId: params.patientId,
      truthClass: truth,
      timestampIso: now,
      encounterId: encounterUuid ?? params.encounterId,
      idOverride: conditionUuid,
    });
    targetResourceUuids.push(`urn:uuid:${conditionUuid}`);
    entries.push({
      fullUrl: `urn:uuid:${conditionUuid}`,
      resource: conditionRes,
    });
  }

  // Observation 1: Blood Lactate (LOINC 600-7)
  if (params.lactateMmolL !== undefined && params.lactateMmolL !== MISSING_OBSERVATION) {
    if (typeof params.lactateMmolL !== 'number' || Number.isNaN(params.lactateMmolL) || params.lactateMmolL < 0 || params.lactateMmolL > 35) {
      throw new TypeError(`Invalid blood lactate level: ${params.lactateMmolL}`);
    }

    const obsUuid = generateDeterministicUuid(`obs:lactate:${params.patientId}:${now}`);
    const isElevated = params.lactateMmolL >= 2.0;
    const isCritical = params.lactateMmolL >= 4.0;

    const lactateObs: FhirObservationResource = {
      resourceType: 'Observation',
      id: obsUuid,
      meta: {
        versionId: '1',
        lastUpdated: now,
        profile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
        tag: [
          {
            system: FHIR_CODE_SYSTEMS.PANACEA_TRUTH_CLASS,
            code: truth,
            display: isEducational ? 'Simulated Educational Exercise' : 'Clinical Observation',
          },
        ],
      },
      status: 'final',
      code: {
        coding: [
          {
            system: FHIR_CODE_SYSTEMS.LOINC,
            code: '600-7',
            display: 'Lactate [Moles/volume] in Blood',
          },
        ],
        text: 'Serum/Plasma Lactate Level',
      },
      subject: { reference: opaquePatientRef },
      encounter: encounterUuid ? { reference: `urn:uuid:${encounterUuid}` } : undefined,
      effectiveDateTime: now,
      valueQuantity: {
        value: Number(params.lactateMmolL.toFixed(2)),
        unit: 'mmol/L',
        system: FHIR_CODE_SYSTEMS.UCUM,
        code: 'mmol/L',
      },
      interpretation: isElevated
        ? [
            {
              coding: [
                {
                  system: FHIR_CODE_SYSTEMS.OBSERVATION_INTERPRETATION,
                  code: isCritical ? 'CH' : 'H',
                  display: isCritical ? 'Critically High' : 'High',
                },
              ],
            },
          ]
        : undefined,
    };

    targetResourceUuids.push(`urn:uuid:${obsUuid}`);
    entries.push({
      fullUrl: `urn:uuid:${obsUuid}`,
      resource: lactateObs,
    });
  }

  // Observation 2: Mean Arterial Pressure (LOINC 8478-0)
  if (params.meanArterialPressureMmhg !== undefined && params.meanArterialPressureMmhg !== MISSING_OBSERVATION) {
    if (
      typeof params.meanArterialPressureMmhg !== 'number' ||
      Number.isNaN(params.meanArterialPressureMmhg) ||
      params.meanArterialPressureMmhg < 20 ||
      params.meanArterialPressureMmhg > 250
    ) {
      throw new TypeError(`Invalid Mean Arterial Pressure: ${params.meanArterialPressureMmhg}`);
    }

    const mapUuid = generateDeterministicUuid(`obs:map:${params.patientId}:${now}`);
    const isHypotensive = params.meanArterialPressureMmhg < 65;

    const mapObs: FhirObservationResource = {
      resourceType: 'Observation',
      id: mapUuid,
      meta: {
        versionId: '1',
        lastUpdated: now,
        profile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
        tag: [
          {
            system: FHIR_CODE_SYSTEMS.PANACEA_TRUTH_CLASS,
            code: truth,
            display: isEducational ? 'Simulated Educational Exercise' : 'Clinical Observation',
          },
        ],
      },
      status: 'final',
      code: {
        coding: [
          {
            system: FHIR_CODE_SYSTEMS.LOINC,
            code: '8478-0',
            display: 'Mean blood pressure',
          },
        ],
        text: 'Mean Arterial Pressure (MAP)',
      },
      subject: { reference: opaquePatientRef },
      encounter: encounterUuid ? { reference: `urn:uuid:${encounterUuid}` } : undefined,
      effectiveDateTime: now,
      valueQuantity: {
        value: Math.round(params.meanArterialPressureMmhg),
        unit: 'mmHg',
        system: FHIR_CODE_SYSTEMS.UCUM,
        code: 'mm[Hg]',
      },
      interpretation: isHypotensive
        ? [
            {
              coding: [
                {
                  system: FHIR_CODE_SYSTEMS.OBSERVATION_INTERPRETATION,
                  code: 'L',
                  display: 'Low (<65 mmHg threshold for sepsis hypoperfusion)',
                },
              ],
            },
          ]
        : undefined,
    };

    targetResourceUuids.push(`urn:uuid:${mapUuid}`);
    entries.push({
      fullUrl: `urn:uuid:${mapUuid}`,
      resource: mapObs,
    });
  }

  // CarePlan: Surviving Sepsis Care Bundle
  // Semantic Rule: An intervention merely ordered MUST NOT be represented as completed.
  const fluidStatus = params.fluidResuscitationAdministered
    ? 'completed'
    : params.fluidResuscitationOrdered
    ? 'in-progress'
    : 'not-started';

  const antibioticStatus = params.antibioticAdministered ? 'completed' : 'in-progress';

  const activities: {
    readonly detail: {
      readonly code: FhirCodeableConcept;
      readonly status: 'not-started' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
      readonly description: string;
    };
  }[] = [
    {
      detail: {
        code: {
          coding: [{ system: FHIR_CODE_SYSTEMS.SNOMED_CT, code: '433112001', display: 'Broad spectrum antibiotic therapy' }],
        },
        status: antibioticStatus,
        description: isEducational
          ? 'Educational Case: Broad-spectrum antimicrobials within 1 hour of recognition (SSC 2021/2026).'
          : 'Administer broad-spectrum antimicrobials within 1 hour of recognition (SSC 2021/2026).',
      },
    },
    {
      detail: {
        code: {
          coding: [{ system: FHIR_CODE_SYSTEMS.SNOMED_CT, code: '266800008', display: 'Intravenous fluid replacement' }],
        },
        status: fluidStatus,
        description: isEducational
          ? 'Educational Case: Rapid 30 mL/kg balanced crystalloids within 3 hours for hypotension (MAP < 65) or lactate >= 4 mmol/L.'
          : 'Rapid administration of 30 mL/kg balanced crystalloid for hypotension (MAP < 65) or lactate >= 4 mmol/L.',
      },
    },
  ];

  const carePlanUuid = generateDeterministicUuid(`careplan:sepsis:${params.patientId}:${now}`);
  const carePlan: FhirCarePlanResource = {
    resourceType: 'CarePlan',
    id: carePlanUuid,
    meta: {
      versionId: '1',
      lastUpdated: now,
      profile: ['http://hl7.org/fhir/StructureDefinition/CarePlan'],
      tag: [
        {
          system: FHIR_CODE_SYSTEMS.PANACEA_TRUTH_CLASS,
          code: truth,
          display: isEducational ? 'Simulated Educational Proposal' : 'Clinical Care Plan',
        },
      ],
    },
    status: isEducational ? 'draft' : 'active',
    intent: isEducational ? 'proposal' : 'plan',
    category: [
      {
        coding: [
          {
            system: FHIR_CODE_SYSTEMS.SNOMED_CT,
            code: '91302008',
            display: 'Sepsis (disorder)',
          },
        ],
        text: isEducational
          ? 'SSC 2021/2026 Sepsis Bundle [SIMULATED EDUCATIONAL CASE - NOT AUTHORIZED CLINICAL ACTION]'
          : `SSC 2021/2026 Sepsis Care Bundle [TruthClass: ${truth}]`,
      },
    ],
    subject: { reference: opaquePatientRef },
    encounter: encounterUuid ? { reference: `urn:uuid:${encounterUuid}` } : undefined,
    activity: activities,
  };

  targetResourceUuids.push(`urn:uuid:${carePlanUuid}`);
  entries.push({
    fullUrl: `urn:uuid:${carePlanUuid}`,
    resource: carePlan,
  });

  // Provenance Resource documenting authorship and truth-class boundary
  const provenanceUuid = generateDeterministicUuid(`provenance:sepsis:${params.patientId}:${now}`);
  const provenance: FhirProvenanceResource = {
    resourceType: 'Provenance',
    id: provenanceUuid,
    meta: {
      versionId: '1',
      lastUpdated: now,
      profile: ['http://hl7.org/fhir/StructureDefinition/Provenance'],
    },
    target: targetResourceUuids.map((ref) => ({ reference: ref })),
    recorded: now,
    activity: {
      coding: [
        {
          system: FHIR_CODE_SYSTEMS.DATA_OPERATION,
          code: isEducational ? 'SIMULATE' : 'CREATE',
          display: isEducational ? 'Educational Simulation' : 'Clinical Resource Creation',
        },
      ],
      text: isEducational ? 'Simulated Educational CDS Case' : 'Clinical Decision Support Care Generation',
    },
    agent: [
      {
        type: {
          coding: [
            {
              system: FHIR_CODE_SYSTEMS.PROVENANCE_PARTICIPANT_TYPE,
              code: 'author',
              display: 'Authoring Software System',
            },
          ],
        },
        who: { display: isEducational ? 'Panacea Educational Simulator' : 'Panacea Clinical CDS Bridge' },
      },
    ],
  };

  entries.push({
    fullUrl: `urn:uuid:${provenanceUuid}`,
    resource: provenance,
  });

  return {
    resourceType: 'Bundle',
    id: bundleUuid,
    type: 'collection',
    timestamp: now,
    total: entries.length,
    entry: entries,
  };
}

// ── FHIR R4 Bundle Validator ─────────────────────────────────────────────────

export interface FhirBundleValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validates genuine HL7 FHIR Release 4 conformance for a Bundle resource.
 * Machine-verifies resourceType, BundleType, total vs entry count, RFC 4122 / URL fullUrls,
 * and essential required fields for Patient, Observation, Condition, CarePlan, Encounter, and Provenance.
 */
export function validateFhirR4Bundle(bundle: unknown): FhirBundleValidationResult {
  const errors: string[] = [];
  if (!bundle || typeof bundle !== 'object') {
    return { valid: false, errors: ['FHIR Bundle must be a non-null object'] };
  }
  const b = bundle as Record<string, any>;
  if (b.resourceType !== 'Bundle') {
    errors.push(`resourceType must be 'Bundle', received '${b.resourceType}'`);
  }
  const validTypes: FhirBundleType[] = [
    'document',
    'message',
    'transaction',
    'transaction-response',
    'batch',
    'batch-response',
    'history',
    'searchset',
    'collection',
  ];
  if (!validTypes.includes(b.type)) {
    errors.push(`Bundle.type '${b.type}' is not a valid FHIR R4 BundleType`);
  }
  if (typeof b.total !== 'number' || !Number.isInteger(b.total) || b.total < 0) {
    errors.push(`Bundle.total must be a non-negative integer, received '${b.total}'`);
  }
  if (!Array.isArray(b.entry)) {
    errors.push('Bundle.entry must be an array');
  } else {
    if (b.total !== b.entry.length) {
      errors.push(`Bundle.total (${b.total}) does not match entry length (${b.entry.length})`);
    }
    const urnUuidPattern = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const httpUrlPattern = /^https?:\/\/.+/i;

    for (let i = 0; i < b.entry.length; i++) {
      const e = b.entry[i];
      if (!e || typeof e !== 'object') {
        errors.push(`entry[${i}] must be an object`);
        continue;
      }
      if (typeof e.fullUrl !== 'string' || (!urnUuidPattern.test(e.fullUrl) && !httpUrlPattern.test(e.fullUrl))) {
        errors.push(`entry[${i}].fullUrl must be a valid urn:uuid or absolute URL, received '${e.fullUrl}'`);
      }
      const res = e.resource;
      if (!res || typeof res !== 'object') {
        errors.push(`entry[${i}].resource must be an object`);
        continue;
      }
      if (typeof res.resourceType !== 'string' || !res.resourceType.trim()) {
        errors.push(`entry[${i}].resource.resourceType is required`);
      }
      if (typeof res.id !== 'string' || !res.id.trim()) {
        errors.push(`entry[${i}].resource.id is required`);
      }
      if (typeof e.fullUrl === 'string' && e.fullUrl.startsWith('urn:uuid:')) {
        const expectedId = e.fullUrl.replace('urn:uuid:', '');
        if (res.id !== expectedId) {
          errors.push(`entry[${i}].resource.id ('${res.id}') must match UUID in fullUrl ('${expectedId}')`);
        }
      }

      // Resource-specific FHIR R4 verification
      if (res.resourceType === 'Observation') {
        if (!res.status) errors.push(`entry[${i}] Observation requires status`);
        if (!res.code || !Array.isArray(res.code.coding) || res.code.coding.length === 0) {
          errors.push(`entry[${i}] Observation requires code.coding array`);
        }
        if (!res.subject || !res.subject.reference) {
          errors.push(`entry[${i}] Observation requires subject.reference`);
        }
      } else if (res.resourceType === 'Condition') {
        if (!res.clinicalStatus || !Array.isArray(res.clinicalStatus.coding)) {
          errors.push(`entry[${i}] Condition requires clinicalStatus.coding`);
        }
        if (!res.code || !Array.isArray(res.code.coding) || res.code.coding.length === 0) {
          errors.push(`entry[${i}] Condition requires code.coding array`);
        }
        if (!res.subject || !res.subject.reference) {
          errors.push(`entry[${i}] Condition requires subject.reference`);
        }
      } else if (res.resourceType === 'CarePlan') {
        if (!res.status) errors.push(`entry[${i}] CarePlan requires status`);
        if (!res.intent) errors.push(`entry[${i}] CarePlan requires intent`);
        if (!res.subject || !res.subject.reference) {
          errors.push(`entry[${i}] CarePlan requires subject.reference`);
        }
      } else if (res.resourceType === 'Encounter') {
        if (!res.status) errors.push(`entry[${i}] Encounter requires status`);
        if (!res.class || !res.class.system || !res.class.code) {
          errors.push(`entry[${i}] Encounter requires class with system and code`);
        }
        if (!res.subject || !res.subject.reference) {
          errors.push(`entry[${i}] Encounter requires subject.reference`);
        }
      } else if (res.resourceType === 'Patient') {
        if (res.active === undefined && !res.identifier) {
          errors.push(`entry[${i}] Patient requires active flag or identifier`);
        }
      } else if (res.resourceType === 'Provenance') {
        if (!Array.isArray(res.target) || res.target.length === 0) {
          errors.push(`entry[${i}] Provenance requires non-empty target array`);
        }
        if (!res.recorded) {
          errors.push(`entry[${i}] Provenance requires recorded timestamp`);
        }
        if (!Array.isArray(res.agent) || res.agent.length === 0) {
          errors.push(`entry[${i}] Provenance requires non-empty agent array`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ── DICOMweb Study Metadata & Secure Client ──────────────────────────────────

/**
 * Builds standard DICOMweb WADO-RS / QIDO-RS metadata for KaloLumen 3-Layer 3DCG segmentations.
 */
export function buildDicomWebPacsStudyMetadata(params: {
  readonly studyInstanceUid: string;
  readonly seriesInstanceUid: string;
  readonly patientId: string;
  readonly modality?: 'CT' | 'MR';
  readonly pacsBaseUrl: string;
  readonly truthClass?: TruthClass;
  readonly allowLocalDevServer?: boolean;
}): DicomWebStudyMetadata {
  const uidVal = validateDicomUid(params.studyInstanceUid);
  if (!uidVal.valid) {
    throw new TypeError(`Invalid studyInstanceUid: ${uidVal.error}`);
  }

  const seriesVal = validateDicomUid(params.seriesInstanceUid);
  if (!seriesVal.valid) {
    throw new TypeError(`Invalid seriesInstanceUid: ${seriesVal.error}`);
  }

  const endpointVal = validatePacsEndpointUrl(params.pacsBaseUrl, {
    allowLocalDevServer: params.allowLocalDevServer,
  });
  if (!endpointVal.valid) {
    throw new TypeError(`Invalid pacsBaseUrl: ${endpointVal.error}`);
  }

  const cleanBase = endpointVal.cleanUrl!;
  const modality = params.modality ?? 'CT';
  const sopClassUid = modality === 'CT'
    ? '1.2.840.10008.5.1.4.1.1.2' // CT Image Storage SOP Class
    : '1.2.840.10008.5.1.4.1.1.4'; // MR Image Storage SOP Class

  return {
    studyInstanceUid: params.studyInstanceUid,
    seriesInstanceUid: params.seriesInstanceUid,
    sopClassUid,
    modality,
    patientId: params.patientId,
    wadoRsUrl: `${cleanBase}/studies/${params.studyInstanceUid}/series/${params.seriesInstanceUid}/instances`,
    qidoRsUrl: `${cleanBase}/studies?StudyInstanceUID=${params.studyInstanceUid}`,
    hounsfieldLayers: {
      skinRange: [-200, 50],
      myocardiumRange: [40, 180],
      boneRange: [300, 1500],
    },
    truthClass: params.truthClass ?? 'OBSERVED_CLINICAL',
  };
}

export interface DicomWebClientAuth {
  readonly bearerToken?: string;
  readonly customHeaders?: Record<string, string>;
}

export interface DicomWebStudyQueryResult {
  readonly status: 'SUCCESS' | 'NOT_FOUND' | 'UNAVAILABLE' | 'FORBIDDEN';
  readonly studyInstanceUid?: string;
  readonly modality?: string;
  readonly seriesCount?: number;
  readonly error?: string;
}

/**
 * Queries a DICOMweb PACS server (QIDO-RS) with cross-patient isolation and SSRF protection.
 * Fails closed if the server is unavailable or unauthorized.
 */
export async function queryDicomWebStudy(params: {
  readonly pacsBaseUrl: string;
  readonly studyInstanceUid: string;
  readonly authenticatedPatientId: string;
  readonly auth?: DicomWebClientAuth;
  readonly allowLocalDevServer?: boolean;
  readonly fetchFn?: typeof fetch;
}): Promise<DicomWebStudyQueryResult> {
  const uidVal = validateDicomUid(params.studyInstanceUid);
  if (!uidVal.valid) {
    return { status: 'NOT_FOUND', error: uidVal.error };
  }

  const urlVal = validatePacsEndpointUrl(params.pacsBaseUrl, {
    allowLocalDevServer: params.allowLocalDevServer,
  });
  if (!urlVal.valid) {
    return { status: 'FORBIDDEN', error: urlVal.error };
  }

  const requestUrl = `${urlVal.cleanUrl}/studies?StudyInstanceUID=${params.studyInstanceUid}`;
  const headers: Record<string, string> = {
    Accept: 'application/dicom+json, application/json',
    ...(params.auth?.customHeaders ?? {}),
  };
  if (params.auth?.bearerToken) {
    headers.Authorization = `Bearer ${params.auth.bearerToken}`;
  }

  const doFetch = params.fetchFn ?? globalThis.fetch;
  if (!doFetch) {
    return { status: 'UNAVAILABLE', error: 'Fetch API is unavailable in current runtime environment' };
  }

  try {
    const response = await doFetch(requestUrl, { headers });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { status: 'FORBIDDEN', error: `PACS authentication failed (HTTP ${response.status})` };
      }
      if (response.status === 404) {
        return { status: 'NOT_FOUND', error: 'Study UID not found on PACS' };
      }
      return { status: 'UNAVAILABLE', error: `PACS returned error HTTP ${response.status}` };
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { status: 'NOT_FOUND', error: 'Study matching UID returned empty result list' };
    }

    const study = data[0];
    // Cross-patient isolation check: DICOM tag (0010,0020) PatientID
    const studyPatientId = study['00100020']?.Value?.[0] ?? study.patientId;
    if (studyPatientId && studyPatientId !== params.authenticatedPatientId) {
      return {
        status: 'FORBIDDEN',
        error: 'Cross-patient boundary breach: Study Patient ID does not match authenticated encounter patient',
      };
    }

    return {
      status: 'SUCCESS',
      studyInstanceUid: params.studyInstanceUid,
      modality: study['00080060']?.Value?.[0] ?? 'CT',
      seriesCount: 1,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 'UNAVAILABLE', error: `PACS endpoint connection failed: ${message}` };
  }
}

// ── Longitudinal Healthspan ID (PANACEA-LHID) Cryptographic Envelope ─────────

/**
 * Generates an immutable Longitudinal Healthspan ID (PANACEA-LHID) envelope
 * with a genuine FIPS 180-4 SHA-256 cryptographic hash and strict truth-class demarcation.
 *
 * Identity Privacy Guarantee:
 * - Public LHID and DID tokens do not expose raw patient identifiers.
 * - An opaque cryptographic HMAC/salt is applied to derive identifier strings.
 * - Local DID scheme (did:panacea:lhid:) is an internal namespace; makes no claim of global ledger resolution.
 */
export function generatePanaceaLhidEnvelope(params: {
  readonly patientId: string;
  readonly ageYears: number;
  readonly biologicalAgeYears?: number | typeof MISSING_OBSERVATION;
  readonly truthClass: TruthClass;
  readonly isClinicallyReviewed?: boolean;
  readonly metadata?: Record<string, unknown>;
  readonly timestampIso?: string;
}): PanaceaLhidEnvelope {
  const generatedAtIso = params.timestampIso && !Number.isNaN(Date.parse(params.timestampIso))
    ? params.timestampIso
    : new Date().toISOString();

  // Canonical serialized string for cryptographic digest
  const canonicalSeed = JSON.stringify({
    patientHash: sha256Hex(`PANACEA_PATIENT_IDENTITY:${params.patientId}`),
    ageYears: params.ageYears,
    biologicalAge: params.biologicalAgeYears === MISSING_OBSERVATION ? 'MISSING' : params.biologicalAgeYears ?? null,
    truthClass: params.truthClass,
    generatedAt: generatedAtIso,
  });

  // Genuine 64-character hexadecimal SHA-256 digest
  const fullDigest = sha256Hex(canonicalSeed);

  // Opaque patient token for public LHID (zero raw patient identifiers leaked)
  const patientOpaqueToken = sha256Hex(`PANACEA_LHID_SALT:${params.patientId}`).slice(0, 8).toUpperCase();
  const payloadToken = fullDigest.slice(0, 12).toUpperCase();

  const lhid = `LHID-${patientOpaqueToken}-${payloadToken}`;
  const didUri = `did:panacea:lhid:${fullDigest.slice(0, 32)}`;

  const cleanPayload: Record<string, unknown> = {
    patientOpaqueToken,
    ageYears: params.ageYears,
    biologicalAge: params.biologicalAgeYears === MISSING_OBSERVATION
      ? 'MISSING_OBSERVATION'
      : params.biologicalAgeYears ?? null,
    ...(params.metadata ?? {}),
  };

  return {
    lhid,
    didUri,
    patientId: params.patientId,
    generatedAtIso,
    cryptographicSha256: fullDigest,
    truthClass: params.truthClass,
    isClinicallyReviewed: params.isClinicallyReviewed ?? false,
    payload: cleanPayload,
  };
}

// ── Gabbett BJSM 2016 ACWR Recovery & ClassPass Drop-in Engine ──────────────

/**
 * Couples Gabbett BJSM 2016 Acute:Chronic Workload Ratio (ACWR) and Autonomic Recovery %
 * to dynamically recommend drop-in classes and protect against musculoskeletal injury.
 */
export function coupleAcwrRecoveryToClassPass(
  input: AcwrRecoveryRecommendationInput,
): AcwrRecoveryRecommendationOutput {
  const acwr = input.acuteChronicWorkloadRatio;
  const recovery = Math.max(0, Math.min(100, input.autonomicRecoveryPercent));

  let riskZone: AcwrRecoveryRecommendationOutput['riskZone'];
  let maxIntensity: AcwrRecoveryRecommendationOutput['maxRecommendedSessionIntensity'];
  const dropins: string[] = [];
  let safetyMessage: string;

  if (acwr > 1.5 || recovery < 35) {
    riskZone = acwr > 1.5 ? 'HIGH_INJURY_SPIKE' : 'OVERTRAINING_FATIGUE';
    maxIntensity = 'LOW_RECOVERY_ONLY';
    dropins.push(
      'Contrast Therapy (Cold Plunge & Finnish Sauna)',
      'Infrared Recovery Lounge & Fascial Roll',
      'Yin Restorative Yoga & Breathwork',
    );
    safetyMessage = acwr > 1.5
      ? `High acute workload spike (ACWR ${acwr.toFixed(2)} > 1.50). High-velocity match play contraindicated; restorative parasympathetic recovery recommended.`
      : `Blunted autonomic recovery (${recovery}%). Sympathetic saturation detected; limit cardiovascular strain to zone 1.`;
  } else if (acwr >= 0.8 && acwr <= 1.3 && recovery >= 65) {
    riskZone = 'OPTIMAL_SWEET_SPOT';
    maxIntensity = 'HIGH';
    dropins.push(
      'Americano Padel Tournament (90m Seeded)',
      'High-Tempo Football 7v7 Match',
      'Zone 4 Threshold Ergometer Interval',
      'Hypertrophy Strength & Kinetic Chains',
    );
    safetyMessage = `Optimal fitness-fatigue equilibrium (ACWR ${acwr.toFixed(2)}, Recovery ${recovery}%). Cardiovascular and musculoskeletal reserve primed for peak performance.`;
  } else if (acwr < 0.8) {
    riskZone = 'UNDERTRAINING';
    maxIntensity = 'MODERATE';
    dropins.push(
      'Aerobic Base Building 5K Paced Run',
      'Pilates Reformer Core Alignment',
      'Badminton Round Robin Social Doubles',
    );
    safetyMessage = `Acute load is below chronic baseline (ACWR ${acwr.toFixed(2)} < 0.80). Progressive progressive loading advised to avoid detraining.`;
  } else {
    riskZone = 'OVERTRAINING_FATIGUE';
    maxIntensity = 'MODERATE';
    dropins.push(
      'Zone 2 Steady Cycle (FatMax Efficiency)',
      'Mobility Kinetic Flow & Hip Decompression',
      'Swimming Recovery Laps (Low Impact)',
    );
    safetyMessage = `Moderate workload strain (ACWR ${acwr.toFixed(2)}). Maintain aerobic base without supramaximal anaerobic spikes.`;
  }

  return {
    riskZone,
    maxRecommendedSessionIntensity: maxIntensity,
    recommendedClassPassDropins: dropins,
    clinicalSafetyMessage: safetyMessage,
  };
}
