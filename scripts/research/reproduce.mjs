#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
const gateUrl = pathToFileURL(path.join(process.cwd(), "src/domains/governance/frontierDiscoveryGateEngine.ts")).href;
const oxyUrl = pathToFileURL(path.join(process.cwd(), "src/lib/physiology/oxygenContentConventions.ts")).href;
const { reproduceFrontierSlice } = await import(gateUrl);
const { DEFAULT_OXYGEN_CONTENT_CONVENTION, oxygenContentMlDl } = await import(oxyUrl);
const observed = oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, 15, 0.98, 95);
const res = reproduceFrontierSlice({ sliceId: "HUFNER_OXYGEN_CONTENT_CAPACITY_SLICE_01", observedMetricValue: observed });
console.log("✓ [REPRODUCED] " + res.sliceId + " -> " + res.uiBadgeLabel);