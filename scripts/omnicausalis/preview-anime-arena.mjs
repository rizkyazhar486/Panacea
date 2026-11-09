#!/usr/bin/env node
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";

const bxUrl = pathToFileURL(path.join(process.cwd(), "src/domains/body-exposure/index.ts")).href;
const bx = await import(bxUrl);
const locUrl = pathToFileURL(path.join(process.cwd(), "src/locales/bodyExposureLocales.ts")).href;
const locales = await import(locUrl);

let atlasState = bx.createInitialAtlasHomeState("en");

function renderAtlasHomeHtml() {
  const dict = locales.tBodyExposure(atlasState.locale);
  const sel = atlasState.selectedStructure;
  const selText = sel ? dict.structures[sel.sourceMeshName] : null;
  const searchRes = atlasState.searchQuery ? bx.searchStructures(atlasState.searchQuery, atlasState.locale) : null;
  const zoomInfo = bx.computeSemanticZoomRatio(2.2, atlasState.cameraDistanceMeters);
  const hraStatus = bx.verifyAndAdmitHraFemaleV15FromRepoArtifacts();
  const gapBadge = (!hraStatus.admitted && atlasState.referenceBodyMode === "FEMALE_HRA_V1_5_REGIONAL") ? bx.getHonestGapBadgeForContext("female_whole_body") : null;

  const stageButtons = [
    { id: "STAGE_1_ANATOMY", label: dict.stage1Anatomy },
    { id: "STAGE_2_LIVING_PHYSIOLOGY", label: dict.stage2LivingPhysiology },
    { id: "STAGE_3_CLINICAL", label: dict.stage3ClinicalRelevance }
  ].map((s) => {
    const active = atlasState.activeStage === s.id;
    return "<a href=\"/atlas?stage=" + s.id + "\" class=\"stage-pill\" style=\"background:" + (active ? "#38bdf8" : "transparent") + ";color:" + (active ? "#020617" : "#cbd5e1") + ";\">" + s.label + "</a>";
  }).join("");

  const layerToggles = Object.values(atlasState.layers).map((l) => {
    return "<a href=\"/atlas?toggleLayer=" + l.layerId + "\" class=\"layer-chip\" style=\"opacity:" + (l.visible ? "1" : "0.42") + ";border-color:" + (l.visible ? "#38bdf8" : "rgba(255,255,255,0.12)") + ";\">" + l.layerId + " (" + Math.round(l.opacity0to1 * 100) + "%)</a>";
  }).join("");

  const structurePills = bx.ORGAN_FACT_REGISTRY.map((item) => {
    const isSel = sel && sel.sourceMeshName === item.sourceMeshName;
    const itemLoc = dict.structures[item.sourceMeshName];
    return "<a href=\"/atlas?pick=" + encodeURIComponent(item.sourceMeshName) + "\" class=\"layer-chip\" style=\"background:" + (isSel ? "rgba(56,189,248,0.22)" : "rgba(15,23,42,0.65)") + ";border-color:" + (isSel ? "#38bdf8" : "rgba(255,255,255,0.1)") + ";\">" + (itemLoc ? itemLoc.localizedName : item.sourceMeshName) + "</a>";
  }).join("");

  let stageSpecificCard = "";
  if (sel && selText) {
    if (atlasState.activeStage === "STAGE_1_ANATOMY") {
      stageSpecificCard = "<div class=\"detail-box\"><div class=\"tag\">GROSS ANATOMY & NEUROVASCULAR</div><p style=\"margin:4px 0;font-size:13px;color:#e2e8f0;\">" + selText.vascularAndNeuralSummary + "</p></div>";
    } else if (atlasState.activeStage === "STAGE_2_LIVING_PHYSIOLOGY") {
      const cpDeck = bx.evaluateCardiopulmonaryCouplingDeck({ heartRateBpm: 74, endDiastolicVolumeMl: 120, endSystolicVolumeMl: 50, endSystolicElastanceMmHgPerMl: 2.0, unstressedVolumeV0Ml: 10, respiratoryRateBpm: 14, tidalVolumeMl: 500, deadSpaceMl: 150, inspiredFiO2Fraction: 0.21, hemoglobinGPerDl: 15, estimatedSao2Pct: 98 });
      stageSpecificCard = "<div class=\"detail-box\" style=\"border-color:#10b981;\"><div class=\"tag\" style=\"color:#34d399;\">" + dict.provenanceSimulatedDisclaimer + "</div><p style=\"margin:4px 0;font-size:13px;color:#e2e8f0;\">" + selText.detailedMechanism + "</p><div style=\"font-size:12px;color:#38bdf8;margin-top:6px;font-variant-numeric:tabular-nums;\">CO: " + cpDeck.cardiacOutputLPerMin + " L/min · CaO2: " + cpDeck.arterialOxygenContentMlPerDl + " mL/dL · DO2: " + cpDeck.oxygenDeliveryMlPerMin + " mL/min</div></div>";
    } else {
      const derm = bx.mapVisceralOrganToReferredPainDermatome("HEART_MYOCARDIUM");
      stageSpecificCard = "<div class=\"detail-box\" style=\"border-color:#f59e0b;\"><div class=\"tag\" style=\"color:#fbbf24;\">STAGE 3 CLINICAL CORRELATION (DEPTH PANEL)</div><p style=\"margin:4px 0;font-size:13px;color:#e2e8f0;\">" + selText.clinicalCorrelationSummary + "</p><div style=\"font-size:12px;color:#94a3b8;margin-top:6px;\">Referred Pain Dermatomes: " + derm.visceralAfferentSegments.join(", ") + " · Connected Studios: " + sel.deepLinkedLegacyStudios.join(", ") + "</div></div>";
    }
  }

  return [
    "<!DOCTYPE html><html lang=\"" + atlasState.locale + "\"><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>" + dict.atlasTitle + " — PanaceaMed</title>",
    "<style>",
    "*, *::before, *::after { box-sizing: border-box; }",
    "body { margin: 0; padding: 16px 24px; background: #030712; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif; line-height: 1.5; }",
    ".shell { max-width: 1360px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }",
    ".top-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 18px; border-radius: 18px; background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; }",
    ".stage-group { display: inline-flex; padding: 4px; border-radius: 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); gap: 4px; }",
    ".stage-pill { padding: 7px 14px; border-radius: 9px; text-decoration: none; font-size: 12.5px; font-weight: 700; }",
    ".layer-chip { padding: 6px 12px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.12); background: rgba(15,23,42,0.7); color: #e2e8f0; text-decoration: none; font-size: 12px; font-weight: 600; }",
    ".main-grid { display: grid; grid-template-columns: 1.25fr 0.95fr; gap: 16px; align-items: stretch; }",
    ".scene-shell { border-radius: 22px; background: radial-gradient(circle at 50% 38%, #0f172a 0%, #020617 85%); border: 1px solid rgba(56,189,248,0.2); padding: 16px; display: flex; flex-direction: column; justify-content: space-between; min-height: 540px; }",
    ".side-panel { border-radius: 22px; background: rgba(15,23,42,0.78); border: 1px solid rgba(255,255,255,0.08); padding: 20px; display: flex; flex-direction: column; gap: 12px; }",
    ".detail-box { padding: 12px 14px; border-radius: 14px; background: rgba(30,41,59,0.5); border: 1px solid rgba(255,255,255,0.08); }",
    ".tag { font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #38bdf8; }",
    "@media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr; } }",
    "</style></head><body><div class=\"shell\">",

    "<!-- CONTROL 1, 4, 6: TOP BAR WITH <=6 PRIMARY CONTROLS -->",
    "<header class=\"top-bar\">",
    "<div><div class=\"tag\" style=\"color:#34d399;\">/body-exposure · BodyExposureAtlasHome</div>",
    "<h1 style=\"margin:0;font-size:19px;font-weight:800;\">" + dict.atlasTitle + "</h1></div>",
    "<form action=\"/atlas\" method=\"GET\" style=\"flex:1;max-width:360px;display:flex;gap:6px;\">",
    "<input name=\"q\" value=\"" + atlasState.searchQuery + "\" placeholder=\"" + dict.searchPlaceholder + "\" style=\"width:100%;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:#020617;color:#f8fafc;font-size:12.5px;\"/></form>",
    "<div class=\"stage-group\">" + stageButtons + "</div>",
    "<div style=\"display:flex;gap:6px;\">",
    "<a href=\"/atlas?lang=" + (atlasState.locale === "en" ? "id" : "en") + "\" class=\"layer-chip\">" + atlasState.locale.toUpperCase() + "</a>",
    "<a href=\"/atlas?sex=" + (atlasState.referenceBodyMode === "MALE_Z_ANATOMY_SHIPPED" ? "FEMALE_HRA_V1_5_REGIONAL" : "MALE_Z_ANATOMY_SHIPPED") + "\" class=\"layer-chip\">" + (atlasState.referenceBodyMode === "MALE_Z_ANATOMY_SHIPPED" ? "Male (Z-Anatomy)" : "Female (HRA v1.5)") + "</a>",
    "</div></header>",

    (gapBadge ? "<div class=\"detail-box\" style=\"border-color:#f59e0b;background:rgba(120,53,15,0.22);font-size:12.5px;\"><strong>" + dict.gapNotYetSourceBacked + ":</strong> " + gapBadge.honestExplanation + "</div>" : ""),
    (searchRes && searchRes.emptyStateMessage ? "<div class=\"detail-box\" style=\"border-color:#f43f5e;font-size:12.5px;\">" + searchRes.emptyStateMessage + "</div>" : ""),

    "<div class=\"main-grid\">",
    "<!-- CANONICAL 3D SCENE SHELL -->",
    "<div class=\"scene-shell\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;\">",
    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;\"><span class=\"tag\" style=\"align-self:center;margin-right:4px;\">PEEL LAYERS (GLB):</span>" + layerToggles + "</div>",
    "<span class=\"tag\">LOD: " + zoomInfo.activeLodTier + " (" + zoomInfo.relativeZoom + "x)</span></div>",

    "<canvas id=\"canonical-atlas-canvas\" width=\"680\" height=\"420\" style=\"width:100%;height:410px;display:block;\"></canvas>",

    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;align-items:center;\"><span class=\"tag\" style=\"margin-right:4px;\">PICK MESH (BVH):</span>" + structurePills + "</div>",
    "</div>",

    "<!-- RIGHT SIDE PANEL: PROGRESSIVE DISCLOSURE -->",
    "<aside class=\"side-panel\">",
    (sel && selText ? [
      "<div><div class=\"tag\">" + sel.fmaId + " · " + sel.uberonId + " · " + sel.sourceFile + "</div>",
      "<h2 style=\"margin:4px 0 2px;font-size:20px;font-weight:800;\">" + selText.localizedName + "</h2>",
      "<div style=\"font-size:12px;color:#94a3b8;\">Mesh ID: <code>" + sel.sourceMeshName + "</code> · Space: <code>" + sel.referenceSpaceId + "</code></div></div>",
      "<div class=\"detail-box\" style=\"border-left:3px solid #38bdf8;\"><div class=\"tag\">1-SENTENCE FUNCTION SUMMARY</div><div style=\"font-size:13.5px;color:#f8fafc;margin-top:3px;\">" + bx.firstSentence(selText.oneSentenceFunction) + "</div></div>",
      stageSpecificCard,
      "<div style=\"display:flex;gap:8px;flex-wrap:wrap;\">",
      "<a href=\"/atlas?stage=STAGE_2_LIVING_PHYSIOLOGY\" class=\"stage-pill\" style=\"background:#10b981;color:#052e16;\">" + dict.actionSeeLivingPhysiology + "</a>",
      "<a href=\"/atlas?stage=STAGE_3_CLINICAL\" class=\"stage-pill\" style=\"background:#f59e0b;color:#020617;\">" + dict.actionClinicalRelevance + "</a>",
      "</div>",
      "<div class=\"detail-box\" style=\"margin-top:auto;font-size:11.5px;color:#94a3b8;\"><div><strong>" + dict.provenanceAtlasReferenceLabel + "</strong></div><div>" + dict.provenanceEducationalOnly + "</div></div>"
    ].join("") : "<div class=\"detail-box\">Click any anatomical structure to inspect its identity, function, living physiology, and clinical relevance.</div>"),
    "</aside></div></div>",
    "<script>",
    "const c = document.getElementById('canonical-atlas-canvas'); const ctx = c.getContext('2d');",
    "function draw(t) {",
    "  ctx.clearRect(0,0,c.width,c.height); const cx = c.width/2;",
    "  const pulse = 1 + Math.sin(t/220)*0.06;",
    "  ctx.fillStyle = 'rgba(56,189,248,0.18)'; ctx.beginPath(); ctx.ellipse(cx, 390, 95, 14, 0, 0, Math.PI*2); ctx.fill();",
    "  ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.fillStyle = 'rgba(30,41,59,0.55)'; ctx.lineWidth = 1.5;",
    "  ctx.beginPath(); ctx.arc(cx, 55, 22, 0, Math.PI*2); ctx.fill(); ctx.stroke();",
    "  ctx.beginPath(); ctx.roundRect(cx-42, 82, 84, 130, 26); ctx.fill(); ctx.stroke();",
    "  ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(cx+8, 132, 12*pulse, 0, Math.PI*2); ctx.fill();",
    "  ctx.fillStyle = 'rgba(6,182,212,0.5)'; ctx.beginPath(); ctx.ellipse(cx-16, 128, 12, 24, 0, 0, Math.PI*2); ctx.fill();",
    "  ctx.beginPath(); ctx.ellipse(cx+18, 128, 12, 24, 0, 0, Math.PI*2); ctx.fill();",
    "  ctx.fillStyle = 'rgba(245,158,11,0.75)'; ctx.beginPath(); ctx.roundRect(cx+12, 162, 24, 44, 8); ctx.fill();",
    "  requestAnimationFrame(draw);",
    "}",
    "requestAnimationFrame(draw);",
    "</script></body></html>"
  ].join("\n");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:4399");
  if (url.pathname === "/atlas") {
    if (url.searchParams.get("stage")) {
      atlasState = bx.transitionAtlasStage(atlasState, url.searchParams.get("stage")).nextState;
    }
    if (url.searchParams.get("pick")) {
      atlasState = bx.pickStructureInCanonicalScene(atlasState, url.searchParams.get("pick"));
    }
    if (url.searchParams.get("toggleLayer")) {
      const lid = url.searchParams.get("toggleLayer");
      const cur = atlasState.layers[lid];
      if (cur) atlasState = { ...atlasState, layers: bx.toggleOrPeelAtlasLayer(atlasState.layers, lid, { visible: !cur.visible }) };
    }
    if (url.searchParams.get("lang")) {
      atlasState = { ...atlasState, locale: url.searchParams.get("lang") === "id" ? "id" : "en" };
    }
    if (url.searchParams.get("sex")) {
      atlasState = { ...atlasState, referenceBodyMode: url.searchParams.get("sex") };
    }
    if (url.searchParams.has("q")) {
      const q = url.searchParams.get("q") || "";
      const sr = bx.searchStructures(q, atlasState.locale);
      atlasState = { ...atlasState, searchQuery: q, selectedStructure: sr.matches[0] ?? atlasState.selectedStructure };
    }
    res.writeHead(302, { Location: "/body-exposure" });
    res.end();
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(renderAtlasHomeHtml());
});

if (process.argv.includes("--smoke-test")) {
  const out = renderAtlasHomeHtml();
  if (!out.includes("BodyExposureAtlasHome") || !out.includes("ATLAS_REFERENCE")) process.exit(1);
  console.log("  \x1b[32m✓ [CLARITY-FIRST BODY EXPOSURE ATLAS HOME SMOKE TEST PASSED]\x1b[0m");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [BODY EXPOSURE ATLAS HOME LIVE] http://localhost:4399/body-exposure\x1b[0m");
  exec("open http://localhost:4399/body-exposure");
});