import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type FrontierVerdict = "SUPPORTED" | "NOT-SUPPORTED" | "INCONCLUSIVE" | "hypothesis — not yet tested";

export interface PreregistrationRecord {
  readonly sliceId: string;
  readonly hypothesisStatement: string;
  readonly quantitativePrediction: { readonly metricName: string; readonly expectedMin: number; readonly expectedMax: number; readonly unit: string };
  readonly explicitFalsificationCriteria: string;
  readonly dataSourceCitation: string;
  readonly deterministicSeed: number;
  readonly registeredOnIso: string;
  readonly preregSha256: string;
}

export function preregisterFrontierHypothesis(input: {
  readonly sliceId: string;
  readonly hypothesisStatement: string;
  readonly quantitativePrediction: { readonly metricName: string; readonly expectedMin: number; readonly expectedMax: number; readonly unit: string };
  readonly explicitFalsificationCriteria: string;
  readonly dataSourceCitation: string;
  readonly deterministicSeed: number;
  readonly registeredOnIso?: string;
}): PreregistrationRecord {
  if (!input.sliceId || !input.sliceId.trim()) throw new Error("Rejected: sliceId is required.");
  if (!input.hypothesisStatement || input.hypothesisStatement.trim().length < 10) {
    throw new Error("Rejected: preregistration requires a measurable hypothesisStatement.");
  }
  if (!input.explicitFalsificationCriteria || input.explicitFalsificationCriteria.trim().length < 10) {
    throw new Error("Rejected: preregistration requires explicitFalsificationCriteria.");
  }
  const registeredOnIso = input.registeredOnIso ?? "2026-11-04T00:00:00.000Z";
  const corePayload = JSON.stringify({
    sliceId: input.sliceId,
    hypothesisStatement: input.hypothesisStatement,
    quantitativePrediction: input.quantitativePrediction,
    explicitFalsificationCriteria: input.explicitFalsificationCriteria,
    dataSourceCitation: input.dataSourceCitation,
    deterministicSeed: input.deterministicSeed,
    registeredOnIso
  });
  const preregSha256 = crypto.createHash("sha256").update(corePayload).digest("hex");
  const record: PreregistrationRecord = { ...input, registeredOnIso, preregSha256 };
  const filePath = path.join(process.cwd(), "data/research/prereg", input.sliceId + ".json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), "utf8");
  return record;
}

export function reproduceFrontierSlice(params: {
  readonly sliceId: string;
  readonly observedMetricValue: number;
}): {
  readonly sliceId: string;
  readonly preregSha256: string;
  readonly observedMetricValue: number;
  readonly verdict: "SUPPORTED" | "NOT-SUPPORTED" | "INCONCLUSIVE";
  readonly uiBadgeLabel: string;
} {
  const filePath = path.join(process.cwd(), "data/research/prereg", params.sliceId + ".json");
  if (!fs.existsSync(filePath)) {
    throw new Error("Rejected: cannot run reproduction without an existing preregistration file for " + params.sliceId);
  }
  const prereg: PreregistrationRecord = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Number.isFinite(params.observedMetricValue)) {
    return {
      sliceId: params.sliceId,
      preregSha256: prereg.preregSha256,
      observedMetricValue: NaN,
      verdict: "INCONCLUSIVE",
      uiBadgeLabel: "VERDICT: INCONCLUSIVE (prereg " + prereg.preregSha256.slice(0, 8) + ")"
    };
  }
  const withinBounds =
    params.observedMetricValue >= prereg.quantitativePrediction.expectedMin &&
    params.observedMetricValue <= prereg.quantitativePrediction.expectedMax;
  const verdict = withinBounds ? ("SUPPORTED" as const) : ("NOT-SUPPORTED" as const);
  if (verdict === "NOT-SUPPORTED") {
    const negPath = path.join(process.cwd(), "data/research/negative-results", params.sliceId + "-negative.json");
    fs.mkdirSync(path.dirname(negPath), { recursive: true });
    fs.writeFileSync(negPath, JSON.stringify({ sliceId: params.sliceId, preregSha256: prereg.preregSha256, observedMetricValue: params.observedMetricValue, verdict }, null, 2), "utf8");
  }
  return {
    sliceId: params.sliceId,
    preregSha256: prereg.preregSha256,
    observedMetricValue: params.observedMetricValue,
    verdict,
    uiBadgeLabel: "VERDICT: " + verdict + " (prereg " + prereg.preregSha256.slice(0, 8) + ")"
  };
}

export const FRONTIER_CLAIMS_VERDICT_LEDGER: Readonly<Record<string, FrontierVerdict>> = {
  HUFNER_OXYGEN_CONTENT_CAPACITY_SLICE_01: "SUPPORTED",
  PINK1_PARKIN_MITOPHAGY_DEPOLARIZATION_MODEL: "SUPPORTED",
  DE_NOVO_QUANTUM_BINDER_MRSA_NDM1_KPC2: "hypothesis — not yet tested",
  MARCUS_1993_ELECTRON_TRANSFER_BIOLOGICAL_TUNNELING: "hypothesis — not yet tested",
  EISENBERG_MCLACHLAN_SOLVATION_FREE_ENERGY: "hypothesis — not yet tested"
};