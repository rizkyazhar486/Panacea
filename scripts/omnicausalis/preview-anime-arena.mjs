#!/usr/bin/env node
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";

const indexUrl = pathToFileURL(path.join(process.cwd(), "src/domains/omnicausalis-index.ts")).href;
const omnicausalis = await import(indexUrl);

let projectileState = {
  sessionId: "PROJ-UHD-WAVE12",
  activeSystemId: "CARDIOVASCULAR_CIRCULATORY",
  activeStageId: "STAGE_1_WHOLE_BODY_ATLAS",
  selectedFmaId: "FMA:7088",
  cameraYawDeg: 12,
  cameraPitchDeg: 6,
  silhouetteHullOpacity0to1: 0.28,
  transitionHistory: ["STAGE_1_WHOLE_BODY_ATLAS"]
};

let uiState = {
  activePageId: "PAGE_1_BODY_EXPOSURE_UHD",
  viewMode: "ANTERIOR_CORONAL_VIEW",
  zoomLevel: "LEVEL_3_GROSS_ORGAN",
  scenarioId: "BASELINE_HOMEOSTASIS",
  vo2Max: 56,
  hrvMs: 88,
  acuteTrimp: 480,
  joinedSessionId: "CLUB_BINTARO_FOOTBALL_01"
};

function buildRingCard(valueText, subLabel, percent, strokeHex) {
  const dash = Math.round((Math.max(5, Math.min(100, percent)) / 100) * 238);
  return "<div class=\"glass-card ring-card\">" +
    "<svg width=\"76\" height=\"76\" viewBox=\"0 0 96 96\" style=\"display:block;margin:0 auto 6px;\">" +
    "<circle cx=\"48\" cy=\"48\" r=\"38\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"7\"/>" +
    "<circle cx=\"48\" cy=\"48\" r=\"38\" fill=\"none\" stroke=\"" + strokeHex + "\" stroke-width=\"7\" stroke-linecap=\"round\" stroke-dasharray=\"" + dash + " 238\" transform=\"rotate(-90 48 48)\"/>" +
    "<text x=\"48\" y=\"53\" text-anchor=\"middle\" fill=\"#f8fafc\" font-size=\"16\" font-weight=\"700\" style=\"font-variant-numeric:tabular-nums;\">" + valueText + "</text>" +
    "</svg>" +
    "<div class=\"micro-label\">" + subLabel + "</div></div>";
}

function renderHtml() {
  const body = omnicausalis.computeYourBodyHealthspanPortfolio({
    citizenId: "kelvin-001",
    chronologicalAgeYears: 25,
    vo2MaxMlKgMin: uiState.vo2Max,
    hrvRmssdMs: uiState.hrvMs,
    hrvBaseline60dMs: 76,
    restingHeartRateBpm: 50,
    restorativeSleepRatio0to1: 0.48,
    acuteLoad7dTrimp: uiState.acuteTrimp,
    chronicLoad28dTrimp: 440,
    fastingGlucoseMgDl: 81,
    zone2MinutesWeekly: 210
  });
  const matches = omnicausalis.matchReclubAndClassPassSessionsToBiology(body);
  const deepSpec = omnicausalis.getDeepSystemSpecById(projectileState.activeSystemId);
  const activeManifest = omnicausalis.COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY.find((s) => s.systemId === projectileState.activeSystemId) || omnicausalis.COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY[0];
  const coupledSim = omnicausalis.executeCrossOrganCoupledSimulation({ scenarioId: uiState.scenarioId });

  const brandLogoSvg = omnicausalis.renderMonolineSvgIcon("BRAND_CADUCEUS_INFINITY", "#38bdf8", 20);
  const shieldSvg = omnicausalis.renderMonolineSvgIcon("SHIELD_CHECK", "#34d399", 14);
  const pinSvg = omnicausalis.renderMonolineSvgIcon("PIN_LOCATION", "#94a3b8", 14);

  const systemPills = omnicausalis.COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY.map((sys) => {
    const active = sys.systemId === projectileState.activeSystemId;
    return "<a href=\"/action?cmd=set_system&sys=" + sys.systemId + "\" class=\"touch-pill\" style=\"background:" + (active ? "rgba(56,189,248,0.2)" : "rgba(15,23,42,0.55)") + ";border-color:" + (active ? sys.spectralAccentHex : "rgba(255,255,255,0.08)") + ";color:" + (active ? "#f8fafc" : "#94a3b8") + ";\">" + sys.displayName + "</a>";
  }).join("");

  const viewModePills = [
    { id: "ANTERIOR_CORONAL_VIEW", label: "Anterior" },
    { id: "SAGITTAL_CROSS_SECTION", label: "Sagittal Cut" },
    { id: "EXPLODED_LAYER_DISSECTION", label: "Exploded Dissection" }
  ].map((v) => {
    const active = v.id === uiState.viewMode;
    return "<a href=\"/action?cmd=set_view&view=" + v.id + "\" class=\"touch-pill\" style=\"background:" + (active ? "#38bdf8" : "rgba(30,41,59,0.55)") + ";color:" + (active ? "#020617" : "#e2e8f0") + ";border-color:" + (active ? "#38bdf8" : "rgba(255,255,255,0.08)") + ";font-weight:700;\">" + v.label + "</a>";
  }).join("");

  const scenarioPills = [
    { id: "BASELINE_HOMEOSTASIS", label: "Homeostasis" },
    { id: "AEROBIC_EXERCISE_BOUT", label: "Exercise 180W" },
    { id: "ACUTE_HEMORRHAGE_CLASS_II", label: "Hemorrhage" },
    { id: "SEPTIC_VASODILATORY_SHOCK", label: "Septic Shock" }
  ].map((sc) => {
    const active = sc.id === uiState.scenarioId;
    return "<a href=\"/action?cmd=set_scenario&sc=" + sc.id + "\" class=\"touch-pill\" style=\"background:" + (active ? "#10b981" : "rgba(30,41,59,0.55)") + ";color:" + (active ? "#052e16" : "#cbd5e1") + ";border-color:" + (active ? "#10b981" : "rgba(255,255,255,0.08)") + ";font-weight:700;\">" + sc.label + "</a>";
  }).join("");

  const sc = deepSpec.nineLevelScaleChain;
  const scaleChainRows = [
    ["L1 Whole Human", sc.level1WholeHuman],
    ["L2 Organ System", sc.level2OrganSystem],
    ["L3 Gross Organ", sc.level3GrossOrgan],
    ["L4 Substructure", sc.level4Substructure],
    ["L5 Histology", sc.level5TissueHistology],
    ["L6 Cell Ontology", sc.level6FunctionalCell],
    ["L7 Organelle", sc.level7Organelle],
    ["L8 Protein / PDB", sc.level8ProteinPathway],
    ["L9 Genomic Locus", sc.level9GenomicLocus]
  ].map(([k, v]) =>
    "<div style=\"display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:11.5px;\">" +
    "<span style=\"color:#38bdf8;font-weight:600;white-space:nowrap;\">" + k + "</span>" +
    "<span style=\"color:#e2e8f0;text-align:right;\">" + v + "</span></div>"
  ).join("");

  const clubCard = matches[0];
  const isJoined = uiState.joinedSessionId === clubCard.sessionId;

  return [
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\"/><title>PanaceaMed ∞ — Body Exposure Total Multiscale Atlas</title>",
    "<style>",
    "*, *::before, *::after { box-sizing: border-box; }",
    "body { margin: 0; padding: 18px 26px 86px; background: radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 82%); color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif; line-height: 1.45; overflow-x: hidden; -webkit-font-smoothing: antialiased; }",
    ".tabular-num { font-variant-numeric: tabular-nums; }",
    ".micro-label { font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; }",
    ".glass-card { background: rgba(15,23,42,0.62); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; padding: 16px; }",
    ".ring-card { text-align: center; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; }",
    ".brand-squircle { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, rgba(56,189,248,0.22), rgba(16,185,129,0.18)); border: 1px solid rgba(56,189,248,0.38); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }",
    ".touch-btn { min-height: 44px; padding: 0 16px; border-radius: 99px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; flex-shrink: 0; }",
    ".touch-pill { min-height: 34px; padding: 0 12px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1); display: inline-flex; align-items: center; justify-content: center; color: #f8fafc; font-size: 11.5px; font-weight: 600; text-decoration: none; white-space: nowrap; }",
    ".shell { max-width: 1360px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }",
    ".top-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }",
    ".ring-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }",
    ".bento-split { display: grid; grid-template-columns: 1.15fr 1fr; gap: 16px; align-items: stretch; }",
    ".club-item { padding: 12px 14px; border-radius: 16px; background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; align-items: center; gap: 12px; }",
    ".mobile-nav { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); height: 52px; padding: 0 12px; border-radius: 99px; background: rgba(15,23,42,0.88); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; gap: 6px; z-index: 50; }",
    "@media (max-width: 1023px) {",
    "  body { padding: 12px 12px 82px; }",
    "  .ring-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }",
    "  .bento-split { grid-template-columns: 1fr; gap: 14px; }",
    "  .club-item { flex-direction: column; align-items: stretch; }",
    "  .touch-btn { width: 100%; }",
    "}",
    "</style></head><body>",

    "<div class=\"shell\">",
    "<header class=\"glass-card top-bar\">",
    "<div style=\"display:flex;align-items:center;gap:14px;min-width:0;\">",
    "<div class=\"brand-squircle\">" + brandLogoSvg + "</div>",
    "<div style=\"min-width:0;\">",
    "<div style=\"display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px;\">",
    "<span class=\"micro-label\" style=\"color:#34d399;\">" + body.longitudinalHealthId + "</span>",
    "<span style=\"display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#38bdf8;\">" + shieldSvg + "<span>9-LEVEL SEMANTIC ZOOM · CLICK-TO-PICK ORGAN RAYCAST · 11/11 SYSTEMS</span></span>",
    "</div>",
    "<h1 style=\"margin:0;font-size:clamp(18px,2.1vw,23px);font-weight:700;letter-spacing:-0.02em;color:#f8fafc;\">Body Exposure ∞ — " + deepSpec.displayName + " (" + deepSpec.fmaId + ")</h1>",
    "<div style=\"font-size:12px;color:#94a3b8;\">MASTER COMMAND CENTER ·WORKFLOW & OUTFLOW MATRIX · " + deepSpec.rcsbPdbId + " · " + deepSpec.reactomePathwayId + "</div>",
    "</div></div>",
    "<div style=\"text-align:right;margin-left:auto;\">",
    "<div class=\"micro-label\">BIOLOGICAL AGE VS " + body.chronologicalAgeYears + "Y</div>",
    "<div class=\"tabular-num\" style=\"font-size:clamp(20px,2.4vw,26px);font-weight:800;color:#34d399;letter-spacing:-0.02em;\">" + body.projectedBiologicalAgeYears + " yrs <span style=\"font-size:13px;color:#38bdf8;\">(" + body.biologicalAgeDeltaYears + "y)</span></div>",
    "</div></header>",

    "<section class=\"glass-card\" style=\"padding:10px 14px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;\">",
    "<span class=\"micro-label\" style=\"color:#10b981;margin-right:4px;\">11 SYSTEMS:</span>" + systemPills,
    "</section>",

    "<section class=\"bento-split\">",
    "<!-- LEFT: UHD INTERACTIVE RAYCAST BODY EXPOSURE STUDIO -->",
    "<div class=\"glass-card\" style=\"display:flex;flex-direction:column;justify-content:space-between;gap:10px;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;\">",
    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;\">" + viewModePills + "</div>",
    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;\">" + scenarioPills + "</div></div>",

    "<canvas id=\"uhd-body-canvas\" width=\"640\" height=\"450\" title=\"Click any organ hotspot or drag to rotate\" style=\"width:100%;height:430px;background:radial-gradient(circle at 50% 40%, #0f172a 0%, #020617 86%);border-radius:18px;cursor:pointer;display:block;border:1px solid rgba(255,255,255,0.08);\"></canvas>",

    "<!-- GROSS ANATOMY, ARTERIAL, VENOUS, INNERVATION & LYMPHATIC BAR -->",
    "<div style=\"padding:12px 14px;border-radius:16px;background:rgba(30,41,59,0.52);border:1px solid rgba(255,255,255,0.07);display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11.5px;\">",
    "<div><div class=\"micro-label\" style=\"color:#f43f5e;\">ARTERIAL SUPPLY & VENOUS DRAINAGE</div><div style=\"color:#e2e8f0;margin-top:2px;\"><strong>Arterial:</strong> " + deepSpec.grossAnatomyAndNeurovascular.arterialSupply + "</div><div style=\"color:#94a3b8;margin-top:2px;\"><strong>Venous:</strong> " + deepSpec.grossAnatomyAndNeurovascular.venousDrainage + "</div></div>",
    "<div><div class=\"micro-label\" style=\"color:#a855f7;\">INNERVATION & LYMPHATIC DRAINAGE</div><div style=\"color:#e2e8f0;margin-top:2px;\"><strong>Nerves:</strong> " + deepSpec.grossAnatomyAndNeurovascular.innervation + "</div><div style=\"color:#94a3b8;margin-top:2px;\"><strong>Lymph:</strong> " + deepSpec.grossAnatomyAndNeurovascular.lymphaticDrainage + "</div></div>",
    "</div></div>",

    "<!-- RIGHT: 9-LEVEL SEMANTIC MICROSCOPIC ZOOM + PHYSIOLOGY/CLINICAL INSPECTOR -->",
    "<div style=\"display:flex;flex-direction:column;gap:12px;\">",
    "<div class=\"ring-grid\">",
    buildRingCard(body.athlyticWhoopMetrics.recoveryPercent + "%", "RECOVERY", body.athlyticWhoopMetrics.recoveryPercent, "#10b981"),
    buildRingCard(String(body.athlyticWhoopMetrics.dayStrain0to21), "DAY STRAIN", (body.athlyticWhoopMetrics.dayStrain0to21 / 21) * 100, "#38bdf8"),
    buildRingCard(body.compositeHealthspanScore + "%", "HEALTHSPAN", body.compositeHealthspanScore, "#a855f7"),
    buildRingCard(body.athlyticWhoopMetrics.acuteChronicWorkloadRatio + "x", "JOINT ACWR", 78, "#f59e0b"),
    "</div>",

    "<div class=\"glass-card\" style=\"padding:14px 16px;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;\">",
    "<span class=\"micro-label\" style=\"color:#38bdf8;\">9-LEVEL SEMANTIC MICROSCOPIC ZOOM HIERARCHY</span>",
    "<span class=\"micro-label\" style=\"color:#34d399;\">" + deepSpec.uberonId + "</span></div>",
    scaleChainRows,
    "</div>",

    "<div class=\"glass-card\" style=\"padding:14px 16px;display:flex;flex-direction:column;gap:6px;\">",
    "<div class=\"micro-label\" style=\"color:#10b981;\">PHYSIOLOGICAL EQUATION, PATHOPHYSIOLOGY & SURGICAL LINK</div>",
    "<div class=\"tabular-num\" style=\"font-size:12px;font-weight:700;color:#f8fafc;\">" + deepSpec.physiologicalMechanics.governingEquation + "</div>",
    "<div style=\"font-size:11.5px;color:#34d399;\"><strong>Reference:</strong> " + deepSpec.physiologicalMechanics.homeostaticReferenceRange + "</div>",
    "<div style=\"font-size:11.5px;color:#cbd5e1;\"><strong>Surgical / Procedural Sim:</strong> " + deepSpec.pathophysiologyAndClinicalUtility.surgicalAndProceduralSimulationLink + "</div>",
    "<div style=\"font-size:11.5px;color:#94a3b8;\"><strong>Clinical Utility:</strong> " + deepSpec.pathophysiologyAndClinicalUtility.clinicalApplicationUtility + "</div>",
    "</div>",

    "<div class=\"club-item\">",
    "<div style=\"min-width:0;flex:1;\"><div class=\"micro-label\" style=\"color:#10b981;\">" + clubCard.organizerClub + "</div><div style=\"font-size:13.5px;font-weight:700;color:#f8fafc;\">" + clubCard.title + " — " + clubCard.venueName + "</div></div>",
    "<a href=\"/action?cmd=join_club&id=" + clubCard.sessionId + "\" class=\"touch-btn\" style=\"min-height:38px;background:#10b981;color:#052e16;\">" + (isJoined ? "Joined" : "Join") + "</a></div>",
    "</div></section></div>",

    "<nav class=\"mobile-nav\" aria-label=\"Primary Controls\">",
    "<a href=\"/action?cmd=set_view&view=ANTERIOR_CORONAL_VIEW\" class=\"touch-pill\" style=\"background:rgba(56,189,248,0.18);border-color:#38bdf8;color:#38bdf8;\">Explore</a>",
    "<a href=\"/action?cmd=set_view&view=SAGITTAL_CROSS_SECTION\" class=\"touch-pill\">Sagittal</a>",
    "<a href=\"/action?cmd=set_view&view=EXPLODED_LAYER_DISSECTION\" class=\"touch-pill\">Exploded</a>",
    "<a href=\"/action?cmd=set_scenario&sc=AEROBIC_EXERCISE_BOUT\" class=\"touch-pill\">Simulate</a>",
    "</nav>",

    "<script>",
    "const canvas = document.getElementById(\"uhd-body-canvas\");",
    "const ctx = canvas.getContext(\"2d\");",
    "let yaw = " + projectileState.cameraYawDeg + ";",
    "let dragging = false; let moved = false; let lastX = 0;",
    "const accentHex = \"" + activeManifest.spectralAccentHex + "\";",
    "const viewMode = \"" + uiState.viewMode + "\";",
    "const hrBpm = " + coupledSim.cardiovascular.heartRateBpm + ";",
    "const hotspots = [",
    "  { sys: \"NERVOUS_NEUROLOGICAL\", label: \"Brain & CNS (FMA:50801)\", x: 0.50, y: 0.11, col: \"#a855f7\" },",
    "  { sys: \"INTEGUMENTARY_SENSORY_ENT\", label: \"Sensory / ENT (FMA:54448)\", x: 0.50, y: 0.15, col: \"#fdba74\" },",
    "  { sys: \"ENDOCRINE_METABOLIC\", label: \"Endocrine Axis (FMA:9668)\", x: 0.50, y: 0.20, col: \"#eab308\" },",
    "  { sys: \"RESPIRATORY_PULMONARY\", label: \"Lungs (FMA:7195)\", x: 0.45, y: 0.29, col: \"#06b6d4\" },",
    "  { sys: \"CARDIOVASCULAR_CIRCULATORY\", label: \"Heart & LAD (FMA:7088)\", x: 0.52, y: 0.31, col: \"#f43f5e\" },",
    "  { sys: \"GASTROINTESTINAL_HEPATOBILIARY\", label: \"Liver & Biliary (FMA:7197)\", x: 0.45, y: 0.37, col: \"#f97316\" },",
    "  { sys: \"LYMPHATIC_IMMUNE\", label: \"Spleen & Lymph (FMA:7196)\", x: 0.55, y: 0.37, col: \"#34d399\" },",
    "  { sys: \"RENAL_URINARY\", label: \"Kidneys (FMA:7203)\", x: 0.47, y: 0.42, col: \"#10b981\" },",
    "  { sys: \"HEMATOLOGICAL_MARROW\", label: \"Pelvic Marrow (FMA:9608)\", x: 0.44, y: 0.49, col: \"#f43f5e\" },",
    "  { sys: \"REPRODUCTIVE_OBSTETRIC\", label: \"Pelvic Viscera (FMA:17558)\", x: 0.51, y: 0.50, col: \"#ec4899\" },",
    "  { sys: \"MUSCULOSKELETAL_ARTICULAR\", label: \"Knee & Articular Chain (FMA:9611)\", x: 0.46, y: 0.70, col: \"#f59e0b\" }",
    "];",
    "canvas.addEventListener(\"mousedown\", (e) => { dragging = true; moved = false; lastX = e.clientX; });",
    "window.addEventListener(\"mouseup\", () => { dragging = false; });",
    "window.addEventListener(\"mousemove\", (e) => {",
    "  if (!dragging) return;",
    "  if (Math.abs(e.clientX - lastX) > 3) moved = true;",
    "  yaw = (yaw + (e.clientX - lastX) * 0.5 + 360) % 360;",
    "  lastX = e.clientX;",
    "});",
    "canvas.addEventListener(\"click\", (e) => {",
    "  if (moved) return;",
    "  const rect = canvas.getBoundingClientRect();",
    "  const nx = (e.clientX - rect.left) / rect.width;",
    "  const ny = (e.clientY - rect.top) / rect.height;",
    "  let closest = hotspots[0]; let minD = 999;",
    "  hotspots.forEach((h) => { const d = Math.hypot(nx - h.x, ny - h.y); if (d < minD) { minD = d; closest = h; } });",
    "  if (minD < 0.14) { window.location.href = \"/action?cmd=set_system&sys=\" + closest.sys; }",
    "});",
    "function drawTaperedSegment(x1, y1, r1, x2, y2, r2, fillStyle, strokeStyle) {",
    "  const angle = Math.atan2(y2 - y1, x2 - x1);",
    "  const nx = -Math.sin(angle); const ny = Math.cos(angle);",
    "  ctx.beginPath();",
    "  ctx.moveTo(x1 + nx * r1, y1 + ny * r1);",
    "  ctx.lineTo(x2 + nx * r2, y2 + ny * r2);",
    "  ctx.arc(x2, y2, r2, angle + Math.PI / 2, angle - Math.PI / 2, true);",
    "  ctx.lineTo(x1 - nx * r1, y1 - ny * r1);",
    "  ctx.arc(x1, y1, r1, angle - Math.PI / 2, angle + Math.PI / 2, true);",
    "  ctx.closePath();",
    "  if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }",
    "  if (strokeStyle) { ctx.strokeStyle = strokeStyle; ctx.lineWidth = 1.25; ctx.stroke(); }",
    "}",
    "function renderLivingHuman(nowMs) {",
    "  const tSec = nowMs / 1000;",
    "  const breath = Math.sin(tSec * 1.6) * 2.5;",
    "  const pulse = 1 + Math.pow(Math.max(0, Math.sin(tSec * (hrBpm / 60) * Math.PI)), 4) * 0.18;",
    "  const explodeOffset = viewMode === \"EXPLODED_LAYER_DISSECTION\" ? 34 : 0;",
    "  ctx.clearRect(0, 0, canvas.width, canvas.height);",
    "  const cx = canvas.width / 2 + Math.sin(yaw * Math.PI / 180) * 10;",
    "  // Grounded Pedestal Shadow",
    "  const pedGrad = ctx.createRadialGradient(cx, 418, 6, cx, 418, 110);",
    "  pedGrad.addColorStop(0, \"rgba(56,189,248,0.42)\"); pedGrad.addColorStop(0.55, \"rgba(16,185,129,0.14)\"); pedGrad.addColorStop(1, \"rgba(2,6,23,0)\");",
    "  ctx.fillStyle = pedGrad; ctx.beginPath(); ctx.ellipse(cx, 418, 104, 15, 0, 0, Math.PI * 2); ctx.fill();",
    "  ctx.save();",
    "  if (viewMode === \"SAGITTAL_CROSS_SECTION\") { ctx.beginPath(); ctx.rect(0, 0, cx + 8, canvas.height); ctx.clip(); }",
    "  const hullFill = \"rgba(30,41,59,0.42)\"; const hullStroke = \"rgba(148,163,184,0.28)\";",
    "  drawTaperedSegment(cx, 52, 22, cx, 88, 13, hullFill, hullStroke);",
    "  drawTaperedSegment(cx, 98, 44 + breath, cx, 175, 34, hullFill, hullStroke);",
    "  drawTaperedSegment(cx, 175, 34, cx, 222, 38, hullFill, hullStroke);",
    "  drawTaperedSegment(cx - 46 - explodeOffset, 104, 13, cx - 64 - explodeOffset, 172, 10.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx - 64 - explodeOffset, 172, 10, cx - 74 - explodeOffset, 238, 7.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx + 46 + explodeOffset, 104, 13, cx + 64 + explodeOffset, 172, 10.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx + 64 + explodeOffset, 172, 10, cx + 74 + explodeOffset, 238, 7.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx - 23, 220, 18, cx - 25, 314, 12.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx - 25, 314, 12, cx - 23, 404, 8, hullFill, hullStroke);",
    "  drawTaperedSegment(cx - 23, 404, 8, cx - 38, 415, 6, accentHex, hullStroke);",
    "  drawTaperedSegment(cx + 23, 220, 18, cx + 25, 314, 12.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx + 25, 314, 12, cx + 23, 404, 8, hullFill, hullStroke);",
    "  drawTaperedSegment(cx + 23, 404, 8, cx + 38, 415, 6, accentHex, hullStroke);",
    "  // Axial Spine, Vascular Aorta/IVC & Viscera",
    "  drawTaperedSegment(cx, 78, 5, cx, 218, 6.5, \"rgba(226,232,240,0.75)\", null);",
    "  ctx.strokeStyle = \"rgba(244,63,94,0.75)\"; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(cx + 4, 130); ctx.lineTo(cx + 2, 220); ctx.stroke();",
    "  ctx.strokeStyle = \"rgba(56,189,248,0.7)\"; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(cx - 5, 130); ctx.lineTo(cx - 4, 220); ctx.stroke();",
    "  ctx.fillStyle = \"rgba(6,182,212,0.38)\";",
    "  ctx.beginPath(); ctx.ellipse(cx - 17, 132, 13 + breath * 0.5, 26 + breath * 0.6, 0.08, 0, Math.PI * 2); ctx.fill();",
    "  ctx.beginPath(); ctx.ellipse(cx + 17, 132, 13 + breath * 0.5, 26 + breath * 0.6, -0.08, 0, Math.PI * 2); ctx.fill();",
    "  ctx.fillStyle = \"#f43f5e\"; ctx.beginPath(); ctx.arc(cx + 6, 138, 10.5 * pulse, 0, Math.PI * 2); ctx.fill();",
    "  ctx.fillStyle = \"rgba(249,115,22,0.58)\"; ctx.beginPath(); ctx.ellipse(cx - 14, 166, 16, 9, -0.15, 0, Math.PI * 2); ctx.fill();",
    "  ctx.fillStyle = \"rgba(16,185,129,0.68)\"; ctx.beginPath(); ctx.ellipse(cx - 14, 188, 6, 9, 0.1, 0, Math.PI * 2); ctx.fill();",
    "  ctx.beginPath(); ctx.ellipse(cx + 14, 188, 6, 9, -0.1, 0, Math.PI * 2); ctx.fill();",
    "  ctx.fillStyle = \"rgba(168,85,247,0.55)\"; ctx.beginPath(); ctx.ellipse(cx, 50, 17, 13, 0, 0, Math.PI * 2); ctx.fill();",
    "  ctx.restore();",
    "  // Interactive Raycast Organ Hotspots",
    "  hotspots.forEach((h) => {",
    "    const hx = h.x * canvas.width; const hy = h.y * canvas.height;",
    "    ctx.fillStyle = h.col; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fill();",
    "    ctx.strokeStyle = \"#f8fafc\"; ctx.lineWidth = 1.5; ctx.stroke();",
    "  });",
    "  ctx.fillStyle = \"#38bdf8\"; ctx.font = \"600 11px -apple-system, Inter, sans-serif\";",
    "  ctx.fillText(\"Click any glowing organ node to inspect 9-Level Multiscale Atlas · View: \" + viewMode, 18, 438);",
    "  requestAnimationFrame(renderLivingHuman);",
    "}",
    "requestAnimationFrame(renderLivingHuman);",
    "</script></body></html>"
  ].join("\n");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:4399");
  if (url.pathname === "/action") {
    const cmd = url.searchParams.get("cmd");
    if (cmd === "set_system") {
      projectileState = omnicausalis.transitionSingleProjectileBodyExposure(projectileState, { targetSystemId: url.searchParams.get("sys") });
    } else if (cmd === "set_view") {
      uiState.viewMode = url.searchParams.get("view") || uiState.viewMode;
    } else if (cmd === "set_scenario") {
      uiState.scenarioId = url.searchParams.get("sc") || uiState.scenarioId;
    } else if (cmd === "join_club") {
      uiState.joinedSessionId = url.searchParams.get("id") || uiState.joinedSessionId;
    }
    res.writeHead(302, { Location: "/" });
    res.end();
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(renderHtml());
});

if (process.argv.includes("--smoke-test")) {
  const out = renderHtml();
  if (!out.includes("9-LEVEL SEMANTIC MICROSCOPIC ZOOM") || !out.includes("ARTERIAL SUPPLY & VENOUS DRAINAGE")) process.exit(1);
  console.log("  \x1b[32m✓ [WAVE 12 BODY EXPOSURE TOTAL MULTISCALE ATLAS SMOKE TEST PASSED]\x1b[0m");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [WAVE 12 BODY EXPOSURE TOTAL MULTISCALE ATLAS LIVE] http://localhost:4399\x1b[0m");
  exec("open http://localhost:4399");
});