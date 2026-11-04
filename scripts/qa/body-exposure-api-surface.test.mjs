import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as bxApi from "../../src/domains/body-exposure/index.ts";

test("Body-Exposure Public API Surface: grouped headers, zero duplicate exports, and @internal studios excluded", () => {
  const indexText = fs.readFileSync(path.join(process.cwd(), "src/domains/body-exposure/index.ts"), "utf8");
  const requiredHeaders = [
    "// ── MODEL ──",
    "// ── ENGINE: GROSS ANATOMY ──",
    "// ── ENGINE: IMAGING ──",
    "// ── ENGINE: PHYSIOLOGY ──",
    "// ── ENGINE: CLINICAL CORRELATION ──",
    "// ── ENGINE: BIOMECHANICS & GAIT ──",
    "// ── ADAPTERS ──",
    "// ── UI (cross-domain only) ──"
  ];
  for (const h of requiredHeaders) {
    assert.ok(indexText.includes(h), "Missing required public API section header: " + h);
  }

  // Parse all exported value identifiers in index.ts to verify zero duplicate exports
  const exportBlocks = [...indexText.matchAll(/export\s*\{([\s\S]*?)\}\s*from/g)];
  const seenValueExports = new Set();
  const duplicateExports = [];
  for (const block of exportBlocks) {
    const tokens = block[1].split(",").map((s) => s.trim()).filter(Boolean);
    for (const tok of tokens) {
      if (tok.startsWith("type ")) continue;
      if (seenValueExports.has(tok)) duplicateExports.push(tok);
      seenValueExports.add(tok);
    }
  }
  assert.deepEqual(duplicateExports, [], "Duplicate exports found in index.ts: " + duplicateExports.join(", "));

  // Verify @internal standalone studio components are NOT exported at the domain boundary
  const internalStudios = [
    "KaloLumenVolumetricStudio",
    "ReferredPainDermatomeStudio",
    "CardiopulmonaryCouplingDeck",
    "SoftTissueBiomechanicsDeck",
    "FiveStageVisualAtlas",
    "OrganBiometricOverlayCard"
  ];
  for (const studio of internalStudios) {
    assert.equal(Object.prototype.hasOwnProperty.call(bxApi, studio), false, studio + " must remain @internal");
  }

  // Verify canonical exports exist
  assert.equal(typeof bxApi.BodyExposureAtlasHome, "function");
  assert.equal(typeof bxApi.evaluateAHA17PerfusionBurden, "function");
  assert.equal(typeof bxApi.branchForSegment, "function");
});