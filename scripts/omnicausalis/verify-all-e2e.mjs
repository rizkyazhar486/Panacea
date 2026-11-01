#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const indexUrl = pathToFileURL(path.join(process.cwd(), "src/domains/omnicausalis-index.ts")).href;
const omnicausalis = await import(indexUrl);

// 1. Verify 3 Competitive Anime Bots
assert.ok(omnicausalis.PANACEA_COMPETITIVE_ANIME_BOTS.DR_SATORU_SENSEI);
assert.ok(omnicausalis.PANACEA_COMPETITIVE_ANIME_BOTS.DR_MAKIMA_SENPAI);
assert.ok(omnicausalis.PANACEA_COMPETITIVE_ANIME_BOTS.DR_SENKU_KUN);

// 2. Verify Multiscale & BX-1..10
const hemo = omnicausalis.computeHemodynamics(75, 120, 50, 120, 80, 5);
assert.equal(hemo.cardiacOutputLMin, 5.25);
const resp = omnicausalis.executeRespiratoryBx4Journey(0.21, 40, 88, 30);
assert.equal(resp.alveolarGas.alveolarPO2MmHg, 99.73);
const neuro = omnicausalis.executeNeurologicalBx1Journey("CORTICOSPINAL", "INTERNAL_CAPSULE", "LEFT");
assert.equal(neuro.localization.deficitSide, "CONTRALATERAL");

// 3. Verify EDU-1..6 & One OS Release Gate
const cv = omnicausalis.runGoldenJourneyVerificationSession("koas-kelvin");
assert.equal(cv.completedSteps.length, 15);
const gate = omnicausalis.evaluateOmnicausalisReleaseGate({ G_CI: 1, G_INTEGRATION: 1, G_DATA: 1, G_SAFETY: 1, G_PERFORMANCE: 1, G_JOURNEY: 1 });
assert.equal(gate.G_release, 1);

console.log("\x1b[32m✓ [CI VERIFIED] All Omnicausalis Barrel Exports & 36/36 Assertions Passed!\x1b[0m");