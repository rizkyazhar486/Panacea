#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
const modUrl = pathToFileURL(path.join(process.cwd(), "src/domains/governance/frontierDiscoveryGateEngine.ts")).href;
const { preregisterFrontierHypothesis } = await import(modUrl);
const rec = preregisterFrontierHypothesis({
  sliceId: "HUFNER_OXYGEN_CONTENT_CAPACITY_SLICE_01",
  hypothesisStatement: "Arterial oxygen content (CaO2) for Hb=15 g/dL, SaO2=0.98, PaO2=95 mmHg under Hufner 1.34 convention falls within 19.95 to 20.05 mL O2/dL.",
  quantitativePrediction: { metricName: "CaO2", expectedMin: 19.95, expectedMax: 20.05, unit: "mL O2/dL" },
  explicitFalsificationCriteria: "Hypothesis is falsified if computed CaO2 deviates outside [19.95, 20.05] mL O2/dL or uses unverified literal constants.",
  dataSourceCitation: "West Respiratory Physiology 11th ed. / Hufner (1894)",
  deterministicSeed: 20261104
});
console.log("✓ [PREREGISTERED] " + rec.sliceId + " @ sha256:" + rec.preregSha256);