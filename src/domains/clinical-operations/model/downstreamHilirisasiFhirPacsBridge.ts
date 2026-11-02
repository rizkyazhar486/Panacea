import { createHash, createHmac } from "node:crypto";
import { evaluateSepsisOneHourBundle } from "./sepsisOneHourBundleCds.ts";

export function canonicalizeJsonForHash(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalizeJsonForHash).join(",") + "]";
  const rec = value as Record<string, unknown>;
  const keys = Object.keys(rec).sort().filter((k) => rec[k] !== undefined);
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalizeJsonForHash(rec[k])).join(",") + "}";
}

// NIST FIPS 180-4 genuine SHA-256 (64 hex chars)
export function computeRealSha256Hex(message: string): string {
  return createHash("sha256").update(message, "utf8").digest("hex");
}

// Keyed HMAC-SHA-256: HMAC(K, m) = H((K' XOR opad) || H((K' XOR ipad) || m))
export function computeKeyedHmacSha256Hex(secretKey: string, message: string): string {
  if (!secretKey || typeof secretKey !== "string" || secretKey.trim().length < 16) {
    throw new Error("FAIL_CLOSED_CRYPTO_ERROR: HMAC secretKey must be a non-empty string of at least 16 characters.");
  }
  return createHmac("sha256", secretKey).update(message, "utf8").digest("hex");
}

// Deterministic RFC 4122 UUID formatted string for valid urn:uuid:* Bundle references
export function deriveDeterministicUuidV4Style(ns: string, name: string): string {
  const h = computeRealSha256Hex(ns + "::" + name);
  const v = (8 + (parseInt(h.slice(16, 17), 16) & 0x3)).toString(16);
  return h.slice(0, 8) + "-" + h.slice(8, 12) + "-4" + h.slice(13, 16) + "-" + v + h.slice(17, 20) + "-" + h.slice(20, 32);
}

export interface PanaceaLhidEnvelopeInput {
  readonly canonicalPatientId: string;
  readonly hmacSecretKey: string;
  readonly clinicalPayload: Record<string, unknown>;
  readonly issuedAtIso?: string;
  readonly legacyV1EnvelopeIdToMigrate?: string;
}

export function generatePanaceaLhidEnvelope(input: PanaceaLhidEnvelopeInput) {
  const rawId = typeof input.canonicalPatientId === "string" ? input.canonicalPatientId.trim() : "";
  if (rawId.length < 3 || /^[0]+$/.test(rawId)) {
    throw new Error("INVALID_PATIENT_IDENTITY: canonicalPatientId must be a valid non-empty identifier.");
  }
  const pseudonymHmacSha256 = computeKeyedHmacSha256Hex(input.hmacSecretKey, "PANACEA_PATIENT_ID_V2::" + rawId);
  // Public ID never exposes any prefix or substring of raw canonicalPatientId
  const publicLongitudinalId = "PANACEA-LHID-V2-" + pseudonymHmacSha256.slice(0, 24).toUpperCase();
  const canonicalPayloadJson = canonicalizeJsonForHash(input.clinicalPayload);
  const payloadSha256Digest = computeRealSha256Hex(canonicalPayloadJson);
  const legacyId = input.legacyV1EnvelopeIdToMigrate ?? null;

  return {
    schemaVersion: "PANACEA_LHID_V2" as const,
    publicLongitudinalId,
    pseudonymHmacSha256,
    payloadSha256Digest,
    canonicalPayloadJson,
    issuedAtIso: input.issuedAtIso ?? "2026-11-02T23:50:00.000Z",
    migrationCompatibility: {
      migratedFromLegacyV1Id: legacyId,
      legacyV1FormatRecognized: legacyId !== null && /^PANACEA-LHID-[A-Z0-9-]+$/i.test(legacyId)
    },
    didRegistryClaimed: false as const
  };
}

export const UUID_URN_REGEX = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export interface FhirSepsisBundleInput {
  readonly canonicalPatientId: string;
  readonly hmacSecretKey: string;
  readonly encounterId: string;
  readonly effectiveDateTimeIso: string;
  readonly observedLactateMmolL: number | null;
  readonly observedMapMmHg: number | null;
  readonly observedSystolicBpMmHg?: number | null;
  readonly sepsisLikelihood?: "DEFINITE_OR_PROBABLE" | "POSSIBLE_INFECTION_UNCERTAIN";
  readonly clinicianAuthorizedCarePlan?: boolean;
}

export function buildFhirBundleForSepsisCare(input: FhirSepsisBundleInput) {
  const lhid = generatePanaceaLhidEnvelope({
    canonicalPatientId: input.canonicalPatientId,
    hmacSecretKey: input.hmacSecretKey,
    clinicalPayload: { encounterId: input.encounterId, effectiveDateTimeIso: input.effectiveDateTimeIso },
    issuedAtIso: input.effectiveDateTimeIso
  });
  const ns = lhid.pseudonymHmacSha256;
  const bundleUuid = deriveDeterministicUuidV4Style(ns, "bundle::" + input.encounterId);
  const patientUuid = deriveDeterministicUuidV4Style(ns, "patient");
  const patientRef = "urn:uuid:" + patientUuid;

  const entry: Array<{ fullUrl: string; resource: Record<string, unknown> }> = [
    {
      fullUrl: patientRef,
      resource: {
        resourceType: "Patient",
        id: patientUuid,
        identifier: [{ system: "urn:panaceamed:lhid:v2", value: lhid.publicLongitudinalId }],
        active: true
      }
    }
  ];

  if (input.observedLactateMmolL !== null && input.observedLactateMmolL !== undefined) {
    if (!Number.isFinite(input.observedLactateMmolL) || input.observedLactateMmolL < 0) {
      throw new RangeError("INVALID_FHIR_OBSERVATION: observedLactateMmolL must be finite and non-negative.");
    }
    const lacUuid = deriveDeterministicUuidV4Style(ns, "obs-lactate::" + input.encounterId);
    entry.push({
      fullUrl: "urn:uuid:" + lacUuid,
      resource: {
        resourceType: "Observation",
        id: lacUuid,
        status: "final",
        category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }] }],
        code: { coding: [{ system: "http://loinc.org", code: "2524-7", display: "Lactate [Moles/volume] in Serum or Plasma" }] },
        subject: { reference: patientRef },
        effectiveDateTime: input.effectiveDateTimeIso,
        valueQuantity: { value: input.observedLactateMmolL, unit: "mmol/L", system: "http://unitsofmeasure.org", code: "mmol/L" }
      }
    });
  }

  if (input.observedMapMmHg !== null && input.observedMapMmHg !== undefined) {
    if (!Number.isFinite(input.observedMapMmHg) || input.observedMapMmHg <= 0) {
      throw new RangeError("INVALID_FHIR_OBSERVATION: observedMapMmHg must be finite and positive.");
    }
    const mapUuid = deriveDeterministicUuidV4Style(ns, "obs-map::" + input.encounterId);
    entry.push({
      fullUrl: "urn:uuid:" + mapUuid,
      resource: {
        resourceType: "Observation",
        id: mapUuid,
        status: "final",
        category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] }],
        code: { coding: [{ system: "http://loinc.org", code: "8478-0", display: "Mean blood pressure" }] },
        subject: { reference: patientRef },
        effectiveDateTime: input.effectiveDateTimeIso,
        valueQuantity: { value: input.observedMapMmHg, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" }
      }
    });
  }

  const cds = evaluateSepsisOneHourBundle({
    patientPopulation: "ADULT_NON_PREGNANT",
    sepsisLikelihood: input.sepsisLikelihood ?? "DEFINITE_OR_PROBABLE",
    meanArterialPressureMmHg: input.observedMapMmHg,
    systolicBpMmHg: input.observedSystolicBpMmHg ?? null,
    serumLactateMmolL: input.observedLactateMmolL,
    vasopressorRequiredForMap65: input.observedMapMmHg !== null && input.observedMapMmHg < 65,
    hypoperfusionPresent: (input.observedMapMmHg !== null && input.observedMapMmHg < 65) || (input.observedLactateMmolL !== null && input.observedLactateMmolL >= 4.0),
    bloodCulturesOrderedBeforeAntimicrobials: false,
    empiricAntimicrobialsOrdered: false,
    crystalloidVolumeAdministeredMlPerKg: null,
    clinicianAuthorizedOrder: Boolean(input.clinicianAuthorizedCarePlan)
  });

  const cpUuid = deriveDeterministicUuidV4Style(ns, "careplan-sepsis::" + input.encounterId);
  entry.push({
    fullUrl: "urn:uuid:" + cpUuid,
    resource: {
      resourceType: "CarePlan",
      id: cpUuid,
      status: input.clinicianAuthorizedCarePlan ? "active" : "draft",
      intent: input.clinicianAuthorizedCarePlan ? "order" : "proposal",
      title: "Surviving Sepsis Campaign Adult Clinical Decision Support Plan",
      description: cds.antimicrobialTimingRecommendation.clinicalRationale + " | " + cds.fluidResuscitationGuidance.clinicalGuidanceText,
      subject: { reference: patientRef },
      created: input.effectiveDateTimeIso,
      activity: [
        {
          detail: {
            kind: "MedicationRequest",
            code: { coding: [{ system: "http://snomed.info/sct", code: "416608005", display: "Drug therapy" }] },
            status: "not-started",
            doNotPerform: false,
            description: "Target antimicrobial window <= " + cds.antimicrobialTimingRecommendation.targetWindowMinutes + " min (Proposal/Order only; never recorded as completed administration without explicit execution)."
          }
        }
      ]
    }
  });

  return {
    resourceType: "Bundle" as const,
    id: bundleUuid,
    type: "collection" as const,
    timestamp: input.effectiveDateTimeIso,
    entry,
    cdsSummary: cds
  };
}

// P1.6: HONEST SPORT-SCIENCE ACWR MODELING (Gabbett BJSM 2016)
export function coupleAcwrRecoveryToClassPass(input: {
  readonly acuteLoad7dTrimp: number;
  readonly chronicLoad28dTrimp: number;
  readonly wearableRecoveryPercent: number | null;
  readonly calculationMethod?: "ROLLING_AVERAGE_7D_28D" | "EWMA_7D_28D";
}) {
  if (!Number.isFinite(input.acuteLoad7dTrimp) || input.acuteLoad7dTrimp < 0) {
    throw new RangeError("INVALID_WORKLOAD: acuteLoad7dTrimp must be a finite non-negative number.");
  }
  if (!Number.isFinite(input.chronicLoad28dTrimp) || input.chronicLoad28dTrimp <= 0) {
    throw new RangeError("INVALID_CHRONIC_DENOMINATOR: chronicLoad28dTrimp must be > 0.");
  }
  if (input.wearableRecoveryPercent !== null && (!Number.isFinite(input.wearableRecoveryPercent) || input.wearableRecoveryPercent < 0 || input.wearableRecoveryPercent > 100)) {
    throw new RangeError("INVALID_RECOVERY_PERCENT: wearableRecoveryPercent must be in [0, 100] or null.");
  }
  const acwr = Number((input.acuteLoad7dTrimp / input.chronicLoad28dTrimp).toFixed(2));
  const workloadZone =
    acwr < 0.8 ? ("UNDERLOAD_RELATIVE_TO_BASELINE" as const) :
    acwr <= 1.3 ? ("MODERATE_PROGRESSION_BAND" as const) :
    acwr <= 1.5 ? ("ELEVATED_WORKLOAD_SPIKE" as const) : ("HIGH_RELATIVE_WORKLOAD_SPIKE" as const);

  return {
    acwr,
    acuteWindowDays: 7 as const,
    chronicWindowDays: 28 as const,
    loadMetric: "BANISTER_TRIMP_ARBITRARY_UNITS" as const,
    calculationMethod: input.calculationMethod ?? "ROLLING_AVERAGE_7D_28D",
    workloadZone,
    wearableRecoveryMeasurement: input.wearableRecoveryPercent === null ? ("MISSING_OBSERVATION" as const) : input.wearableRecoveryPercent,
    evidenceBasedContext: "ACWR is a descriptive 7d/28d workload-monitoring ratio (Gabbett, BJSM 2016) and not a deterministic individual injury predictor or clinical diagnosis.",
    heuristicSessionGuidance: acwr > 1.5
      ? "Heuristic workload advisory: Recent 7-day load exceeds 1.5x of 28-day baseline. Consider moderating session duration or selecting lower-impact skill/mobility work."
      : input.wearableRecoveryPercent !== null && input.wearableRecoveryPercent < 35
        ? "Heuristic recovery advisory: Wearable recovery metric is below baseline (<35%). Consider moderating training intensity according to subjective readiness."
        : "Heuristic workload advisory: Acute-to-chronic ratio is within the 0.80-1.50 monitoring band."
  };
}
