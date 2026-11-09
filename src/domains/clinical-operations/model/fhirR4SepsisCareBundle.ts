import crypto from "node:crypto";

export interface SepsisCareBundleInput {
  readonly patientCanonicalId: string;
  readonly encounterId: string;
  readonly lactateMmolL: number | null;
  readonly bloodCultureTakenBeforeAntibiotics: boolean;
  readonly broadSpectrumAntibioticsAdministered: boolean;
  readonly crystalloidBolusMlPerKg: number;
  readonly meanArterialPressureMmHg: number;
  readonly timestampIso?: string;
}

export function buildFhirBundleForSepsisCare(input: SepsisCareBundleInput) {
  const timestamp = input.timestampIso || new Date().toISOString();
  const patientUuid = "urn:uuid:" + crypto.randomUUID();
  const encounterUuid = "urn:uuid:" + crypto.randomUUID();
  const obsLactateUuid = "urn:uuid:" + crypto.randomUUID();
  const carePlanUuid = "urn:uuid:" + crypto.randomUUID();

  const entries: Array<Record<string, unknown>> = [];

  // 1. Patient Resource
  entries.push({
    fullUrl: patientUuid,
    resource: {
      resourceType: "Patient",
      id: patientUuid.replace("urn:uuid:", ""),
      identifier: [{ system: "https://panaceamed.id/fhir/sid", value: "anon-" + crypto.createHash("sha256").update(input.patientCanonicalId).digest("hex").substring(0, 16) }],
      active: true
    }
  });

  // 2. Encounter Resource
  entries.push({
    fullUrl: encounterUuid,
    resource: {
      resourceType: "Encounter",
      id: encounterUuid.replace("urn:uuid:", ""),
      status: "finished",
      class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "EMER", display: "emergency" },
      subject: { reference: patientUuid },
      period: { start: timestamp }
    }
  });

  // 3. Observation Resource (Lactate if present, else missing indicator)
  if (input.lactateMmolL !== null && typeof input.lactateMmolL === "number" && Number.isFinite(input.lactateMmolL)) {
    entries.push({
      fullUrl: obsLactateUuid,
      resource: {
        resourceType: "Observation",
        id: obsLactateUuid.replace("urn:uuid:", ""),
        status: "final",
        category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory", display: "Laboratory" }] }],
        code: { coding: [{ system: "http://loinc.org", code: "2524-7", display: "Lactate [Moles/volume] in Blood" }] },
        subject: { reference: patientUuid },
        encounter: { reference: encounterUuid },
        effectiveDateTime: timestamp,
        valueQuantity: { value: input.lactateMmolL, unit: "mmol/L", system: "http://unitsofmeasure.org", code: "mmol/L" }
      }
    });
  }

  // 4. CarePlan Resource (Surviving Sepsis 1-Hour Bundle)
  entries.push({
    fullUrl: carePlanUuid,
    resource: {
      resourceType: "CarePlan",
      id: carePlanUuid.replace("urn:uuid:", ""),
      status: "active",
      intent: "order",
      title: "Surviving Sepsis Campaign 2026 1-Hour Bundle Protocol",
      subject: { reference: patientUuid },
      encounter: { reference: encounterUuid },
      created: timestamp,
      activity: [
        { detail: { description: "Blood cultures obtained before antimicrobials", status: input.bloodCultureTakenBeforeAntibiotics ? "completed" : "scheduled" } },
        { detail: { description: "Broad-spectrum antimicrobials administered", status: input.broadSpectrumAntibioticsAdministered ? "completed" : "scheduled" } },
        { detail: { description: "Crystalloid fluid bolus 30 mL/kg for hypotension or lactate >= 4 mmol/L", status: input.crystalloidBolusMlPerKg >= 30 ? "completed" : "in-progress" } }
      ]
    }
  });

  return {
    resourceType: "Bundle" as const,
    id: crypto.randomUUID(),
    type: "collection" as const,
    timestamp,
    entry: entries,
    fhirVersion: "4.0.1" as const,
    truthClass: "OBSERVED_CLINICAL" as const
  };
}