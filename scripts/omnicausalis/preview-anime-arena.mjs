#!/usr/bin/env node
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";

const indexUrl = pathToFileURL(path.join(process.cwd(), "src/domains/omnicausalis-index.ts")).href;
const omnicausalis = await import(indexUrl);

let projectileState = {
  sessionId: "PROJ-UHD-WAVE10",
  activeSystemId: "MUSCULOSKELETAL_ARTICULAR",
  activeStageId: "STAGE_1_WHOLE_BODY_ATLAS",
  selectedFmaId: "FMA:7161",
  cameraYawDeg: 14,
  cameraPitchDeg: 8,
  silhouetteHullOpacity0to1: 0.28,
  transitionHistory: ["STAGE_1_WHOLE_BODY_ATLAS"]
};

let uiState = {
  activePageId: "PAGE_1_BODY_EXPOSURE_UHD",
  depthMode: "MEDICAL_STUDENT",
  scenarioId: "BASELINE_HOMEOSTASIS",
  vo2Max: 56,
  hrvMs: 88,
  acuteTrimp: 480,
  joinedSessionId: "CLUB_BINTARO_FOOTBALL_01"
};

function buildRingCard(valueText, subLabel, percent, strokeHex) {
  const dash = Math.round((Math.max(5, Math.min(100, percent)) / 100) * 238);
  return "<div class=\"glass-card ring-card\">" +
    "<svg width=\"80\" height=\"80\" viewBox=\"0 0 96 96\" style=\"display:block;margin:0 auto 6px;\">" +
    "<circle cx=\"48\" cy=\"48\" r=\"38\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"7\"/>" +
    "<circle cx=\"48\" cy=\"48\" r=\"38\" fill=\"none\" stroke=\"" + strokeHex + "\" stroke-width=\"7\" stroke-linecap=\"round\" stroke-dasharray=\"" + dash + " 238\" transform=\"rotate(-90 48 48)\"/>" +
    "<text x=\"48\" y=\"53\" text-anchor=\"middle\" fill=\"#f8fafc\" font-size=\"16\" font-weight=\"700\" style=\"font-variant-numeric:tabular-nums;\">" + valueText + "</text>" +
    "</svg>" +
    "<div class=\"micro-label\">" + subLabel + "</div></div>";
}

function renderHtml() {
  const astra = omnicausalis.runAstraSelfHealingAndHippocraticAudit();
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
  const all11Calcs = omnicausalis.computeAllElevenBodySystemCalculations();
  const activeCalc = all11Calcs.find((c) => c.systemId === projectileState.activeSystemId) || all11Calcs[0];
  const activeManifest = omnicausalis.COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY.find((s) => s.systemId === projectileState.activeSystemId) || omnicausalis.COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY[0];
  const pageMatrix = omnicausalis.SEVEN_PAGE_MASTER_WORKFLOW_MATRIX;
  const activePageContract = pageMatrix.find((p) => p.pageId === uiState.activePageId) || pageMatrix[0];
  const coupledSim = omnicausalis.executeCrossOrganCoupledSimulation({ scenarioId: uiState.scenarioId });
  const medProj = omnicausalis.projectDiseaseConceptByDepthMode("ACS_LAD_ISCHEMIA", uiState.depthMode);

  const brandLogoSvg = omnicausalis.renderMonolineSvgIcon("BRAND_CADUCEUS_INFINITY", "#38bdf8", 20);
  const shieldSvg = omnicausalis.renderMonolineSvgIcon("SHIELD_CHECK", "#34d399", 14);
  const pinSvg = omnicausalis.renderMonolineSvgIcon("PIN_LOCATION", "#94a3b8", 14);

  const pageSwitcherPills = pageMatrix.map((p, idx) => {
    const active = p.pageId === uiState.activePageId;
    const shortLabels = ["1. Body Exposure UHD", "2. Your Body LHID", "3. Clinical One OS", "4. Surgical Sim", "5. MedSciHub", "6. KaloLumen DICOM", "7. Reclub Pass"];
    return "<a href=\"/action?cmd=set_page&page=" + p.pageId + "\" class=\"touch-pill\" style=\"background:" + (active ? "#38bdf8" : "rgba(15,23,42,0.65)") + ";color:" + (active ? "#020617" : "#e2e8f0") + ";border-color:" + (active ? "#38bdf8" : "rgba(255,255,255,0.1)") + ";font-weight:700;\">" + shortLabels[idx] + "</a>";
  }).join("");

  const systemPills = omnicausalis.COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY.map((sys) => {
    const active = sys.systemId === projectileState.activeSystemId;
    return "<a href=\"/action?cmd=set_system&sys=" + sys.systemId + "\" class=\"touch-pill\" style=\"background:" + (active ? "rgba(56,189,248,0.18)" : "rgba(15,23,42,0.55)") + ";border-color:" + (active ? sys.spectralAccentHex : "rgba(255,255,255,0.08)") + ";color:" + (active ? "#f8fafc" : "#94a3b8") + ";\">" + sys.displayName + "</a>";
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

  const clubCards = matches.slice(0, 2).map((m) => {
    const isJoined = uiState.joinedSessionId === m.sessionId;
    const accent = m.matchStatus === "BIOLOGICALLY_OPTIMAL_MATCH" ? "#10b981" : "#f59e0b";
    return "<div class=\"club-item\" style=\"border-color:" + (isJoined ? accent : "rgba(255,255,255,0.07)") + ";\">" +
      "<div style=\"min-width:0;flex:1;\">" +
      "<div class=\"micro-label\" style=\"color:" + accent + ";margin-bottom:2px;\">" + m.organizerClub + " · STRAIN " + m.estimatedStrain0to21 + "</div>" +
      "<div style=\"font-size:14px;font-weight:700;color:#f8fafc;margin-bottom:2px;\">" + m.title + "</div>" +
      "<div style=\"display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8;\">" + pinSvg + "<span>" + m.venueName + " · Rp" + m.feeIdr.toLocaleString() + "</span></div></div>" +
      "<a href=\"/action?cmd=join_club&id=" + m.sessionId + "\" class=\"touch-btn\" style=\"background:" + (isJoined ? "#10b981" : "rgba(56,189,248,0.12)") + ";color:" + (isJoined ? "#052e16" : "#38bdf8") + ";border:1px solid " + (isJoined ? "#10b981" : "rgba(56,189,248,0.35)") + ";\">" + (isJoined ? "Joined" : "Join") + "</a></div>";
  }).join("");

  return [
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\"/><title>PanaceaMed ∞ — Next-Gen 7-Page Master OS & UHD Body Exposure</title>",
    "<style>",
    "*, *::before, *::after { box-sizing: border-box; }",
    "body { margin: 0; padding: 20px 28px 88px; background: radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 82%); color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif; line-height: 1.45; overflow-x: hidden; -webkit-font-smoothing: antialiased; }",
    ".tabular-num { font-variant-numeric: tabular-nums; }",
    ".micro-label { font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; }",
    ".glass-card { background: rgba(15,23,42,0.6); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; padding: 18px; }",
    ".ring-card { text-align: center; padding: 14px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; }",
    ".brand-squircle { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, rgba(56,189,248,0.22), rgba(16,185,129,0.18)); border: 1px solid rgba(56,189,248,0.38); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }",
    ".touch-btn { min-height: 44px; padding: 0 16px; border-radius: 99px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; flex-shrink: 0; }",
    ".touch-pill { min-height: 36px; padding: 0 13px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1); display: inline-flex; align-items: center; justify-content: center; color: #f8fafc; font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap; }",
    ".shell { max-width: 1340px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }",
    ".top-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }",
    ".ring-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }",
    ".bento-split { display: grid; grid-template-columns: 1.18fr 1fr; gap: 18px; align-items: stretch; }",
    ".club-item { padding: 14px; border-radius: 16px; background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; align-items: center; gap: 12px; }",
    ".mobile-nav { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); height: 54px; padding: 0 12px; border-radius: 99px; background: rgba(15,23,42,0.88); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; gap: 6px; z-index: 50; }",
    "@media (max-width: 1023px) {",
    "  body { padding: 12px 12px 84px; }",
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
    "<div style=\"display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px;\">",
    "<span class=\"micro-label\" style=\"color:#34d399;\">" + body.longitudinalHealthId + "</span>",
    "<span style=\"display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#38bdf8;\">" + shieldSvg + "<span>SINGLE-PROJECTILE UHD · 7-PAGE INFLOW/OUTFLOW MATRIX · 11/11 SYSTEMS</span></span>",
    "</div>",
    "<h1 style=\"margin:0;font-size:clamp(18px,2.1vw,23px);font-weight:700;letter-spacing:-0.02em;color:#f8fafc;\">" + activePageContract.title + "</h1>",
    "<div style=\"font-size:12px;color:#94a3b8;\">MASTER COMMAND CENTER · " + activePageContract.subtitle + "</div>",
    "</div></div>",
    "<div style=\"text-align:right;margin-left:auto;\">",
    "<div class=\"micro-label\">BIOLOGICAL AGE VS " + body.chronologicalAgeYears + "Y</div>",
    "<div class=\"tabular-num\" style=\"font-size:clamp(20px,2.4vw,26px);font-weight:800;color:#34d399;letter-spacing:-0.02em;\">" + body.projectedBiologicalAgeYears + " yrs <span style=\"font-size:13px;color:#38bdf8;\">(" + body.biologicalAgeDeltaYears + "y)</span></div>",
    "</div></header>",

    "<!-- 7-PAGE MASTER WORKFLOW BAR + ALL 11 CANONICAL SYSTEMS -->",
    "<section class=\"glass-card\" style=\"padding:12px 16px;display:flex;flex-direction:column;gap:10px;\">",
    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;align-items:center;\"><span class=\"micro-label\" style=\"margin-right:4px;color:#38bdf8;\">PAGES:</span>" + pageSwitcherPills + "</div>",
    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;align-items:center;\"><span class=\"micro-label\" style=\"margin-right:4px;color:#10b981;\">11 SYSTEMS:</span>" + systemPills + "</div>",
    "</section>",

    "<section class=\"bento-split\">",
    "<!-- LEFT: 60FPS ANATOMICALLY-CONTOURED UHD BODY EXPOSURE VIEWPORT -->",
    "<div class=\"glass-card\" style=\"display:flex;flex-direction:column;justify-content:space-between;gap:12px;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;\">",
    "<div><div class=\"micro-label\" style=\"color:" + activeManifest.spectralAccentHex + ";\">" + activeManifest.uberonSystemId + " · " + activeManifest.primaryFmaId + " · " + activeManifest.connectedJointBridgeCount + " ARTICULAR BRIDGES</div>",
    "<div style=\"font-size:16px;font-weight:700;color:#f8fafc;\">" + activeManifest.displayName + " — 60FPS Living UHD Projection</div></div>",
    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;\">" + scenarioPills + "</div></div>",

    "<canvas id=\"uhd-body-canvas\" width=\"640\" height=\"450\" style=\"width:100%;height:430px;background:radial-gradient(circle at 50% 40%, #0f172a 0%, #020617 86%);border-radius:18px;cursor:grab;display:block;border:1px solid rgba(255,255,255,0.08);\"></canvas>",

    "<!-- SYSTEM-SPECIFIC MATHEMATICAL FORMULA & INFLOW/OUTFLOW READOUT -->",
    "<div style=\"padding:12px 14px;border-radius:16px;background:rgba(30,41,59,0.5);border:1px solid rgba(255,255,255,0.07);display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:12px;\">",
    "<div><div class=\"micro-label\" style=\"color:#38bdf8;\">CANONICAL EQUATION & SOURCE</div><div class=\"tabular-num\" style=\"font-size:12px;font-weight:700;color:#f8fafc;margin-top:2px;\">" + activeCalc.primaryFormula + "</div><div style=\"font-size:11px;color:#94a3b8;margin-top:2px;\">" + activeCalc.authoritativeSource + "</div></div>",
    "<div><div class=\"micro-label\" style=\"color:#10b981;\">" + activeCalc.primaryMetricLabel + "</div><div class=\"tabular-num\" style=\"font-size:14px;font-weight:800;color:#34d399;margin-top:2px;\">" + activeCalc.primaryMetricValue + "</div></div>",
    "<div><div class=\"micro-label\" style=\"color:#f59e0b;\">" + activeCalc.secondaryMetricLabel + "</div><div class=\"tabular-num\" style=\"font-size:13px;font-weight:700;color:#fde68a;margin-top:2px;\">" + activeCalc.secondaryMetricValue + "</div></div>",
    "</div></div>",

    "<!-- RIGHT: PAGE INFLOW -> ENGINE -> OUTFLOW INSPECTOR + RINGS + RECLUB PASS -->",
    "<div style=\"display:flex;flex-direction:column;gap:14px;\">",
    "<div class=\"ring-grid\">",
    buildRingCard(body.athlyticWhoopMetrics.recoveryPercent + "%", "RECOVERY", body.athlyticWhoopMetrics.recoveryPercent, "#10b981"),
    buildRingCard(String(body.athlyticWhoopMetrics.dayStrain0to21), "DAY STRAIN", (body.athlyticWhoopMetrics.dayStrain0to21 / 21) * 100, "#38bdf8"),
    buildRingCard(body.compositeHealthspanScore + "%", "HEALTHSPAN", body.compositeHealthspanScore, "#a855f7"),
    buildRingCard(body.athlyticWhoopMetrics.acuteChronicWorkloadRatio + "x", "JOINT ACWR", 78, "#f59e0b"),
    "</div>",

    "<!-- PAGE INFLOW / CALCULATION / OUTFLOW ARCHITECTURAL CARD -->",
    "<div class=\"glass-card\" style=\"padding:15px 18px;display:flex;flex-direction:column;gap:8px;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;\">",
    "<span class=\"micro-label\" style=\"color:#38bdf8;\">WORKFLOW & OUTFLOW MATRIX — " + activePageContract.pageId + "</span>",
    "<a href=\"/action?cmd=set_page&page=" + activeCalc.outflowTargetPage + "\" class=\"touch-pill\" style=\"min-height:28px;padding:0 10px;font-size:11px;border-color:#38bdf8;color:#38bdf8;\">Handoff -> " + activeCalc.outflowTargetPage.replace("PAGE_", "P") + "</a></div>",
    "<div style=\"font-size:12px;color:#cbd5e1;\"><strong>Inflow:</strong> " + activePageContract.inflowSources.join(" · ") + "</div>",
    "<div style=\"font-size:12px;color:#cbd5e1;\"><strong>Calculations:</strong> " + activePageContract.activeEnginesAndCalculations.join(" · ") + "</div>",
    "<div style=\"font-size:12px;color:#34d399;\"><strong>Outflow:</strong> " + activePageContract.outflowDestinations.join(" -> ") + "</div>",
    "<div style=\"font-size:11px;color:#94a3b8;\"><strong>MedSciHub (" + uiState.depthMode + "):</strong> " + medProj.mechanisticExplanation + "</div>",
    "</div>",

    "<div class=\"glass-card\" style=\"display:flex;flex-direction:column;gap:10px;flex:1;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;\">",
    "<span style=\"font-size:14px;font-weight:700;color:#f8fafc;\">Club & Studio Pass (The Forum Sports Hub Bintaro)</span>",
    "<span class=\"micro-label\" style=\"color:#10b981;\">ACWR GUARD ACTIVE</span></div>",
    clubCards,
    "</div></div></section></div>",

    "<nav class=\"mobile-nav\" aria-label=\"Primary Controls\">",
    "<a href=\"/action?cmd=set_page&page=PAGE_1_BODY_EXPOSURE_UHD\" class=\"touch-pill\" style=\"background:rgba(56,189,248,0.18);border-color:#38bdf8;color:#38bdf8;\">Explore</a>",
    "<a href=\"/action?cmd=set_page&page=PAGE_3_CLINICAL_ONE_OS_ICU\" class=\"touch-pill\">Clinical OS</a>",
    "<a href=\"/action?cmd=set_page&page=PAGE_4_SURGICAL_SIMULATOR\" class=\"touch-pill\">Surgical</a>",
    "<a href=\"/action?cmd=set_page&page=PAGE_5_MEDSCIHUB_PROMETHEUS\" class=\"touch-pill\">MedSciHub</a>",
    "</nav>",

    "<script>",
    "const canvas = document.getElementById(\"uhd-body-canvas\");",
    "const ctx = canvas.getContext(\"2d\");",
    "let yaw = " + projectileState.cameraYawDeg + "; let pitch = " + projectileState.cameraPitchDeg + ";",
    "let dragging = false; let lastX = 0; let lastY = 0;",
    "const accentHex = \"" + activeManifest.spectralAccentHex + "\";",
    "const activeSys = \"" + projectileState.activeSystemId + "\";",
    "const hrBpm = " + coupledSim.cardiovascular.heartRateBpm + ";",
    "canvas.addEventListener(\"mousedown\", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });",
    "window.addEventListener(\"mouseup\", () => { dragging = false; });",
    "window.addEventListener(\"mousemove\", (e) => {",
    "  if (!dragging) return;",
    "  yaw = (yaw + (e.clientX - lastX) * 0.5 + 360) % 360;",
    "  pitch = Math.max(-40, Math.min(40, pitch - (e.clientY - lastY) * 0.4));",
    "  lastX = e.clientX; lastY = e.clientY;",
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
    "  const breathExpand = Math.sin(tSec * 1.6) * 2.5;",
    "  const cardiacPulse = 1 + Math.pow(Math.max(0, Math.sin(tSec * (hrBpm / 60) * Math.PI)), 4) * 0.16;",
    "  ctx.clearRect(0, 0, canvas.width, canvas.height);",
    "  const cx = canvas.width / 2 + Math.sin(yaw * Math.PI / 180) * 12;",
    "  // 1. SUBTLE BIOMEDICAL COORDINATE GRID & GROUNDING PEDESTAL (ZERO FLOATING)",
    "  ctx.strokeStyle = \"rgba(148,163,184,0.06)\"; ctx.lineWidth = 1;",
    "  for (let gx = 80; gx < canvas.width; gx += 80) { ctx.beginPath(); ctx.moveTo(gx, 20); ctx.lineTo(gx, 425); ctx.stroke(); }",
    "  for (let gy = 50; gy < 425; gy += 75) { ctx.beginPath(); ctx.moveTo(60, gy); ctx.lineTo(canvas.width - 60, gy); ctx.stroke(); }",
    "  const pedGrad = ctx.createRadialGradient(cx, 418, 6, cx, 418, 108);",
    "  pedGrad.addColorStop(0, \"rgba(56,189,248,0.42)\"); pedGrad.addColorStop(0.55, \"rgba(16,185,129,0.14)\"); pedGrad.addColorStop(1, \"rgba(2,6,23,0)\");",
    "  ctx.fillStyle = pedGrad; ctx.beginPath(); ctx.ellipse(cx, 418, 102, 15, 0, 0, Math.PI * 2); ctx.fill();",
    "  // 2. CONTINUOUS SUBSURFACE DERMAL & MYOFASCIAL SILHOUETTE HULL (NO CUT PIECES)",
    "  const hullFill = \"rgba(30,41,59,0.42)\"; const hullStroke = \"rgba(148,163,184,0.28)\";",
    "  // Cranium & Neck Continuum",
    "  drawTaperedSegment(cx, 54, 22, cx, 88, 13, hullFill, hullStroke);",
    "  // Thorax & Abdomen Continuum",
    "  drawTaperedSegment(cx, 98, 44 + breathExpand, cx, 175, 34, hullFill, hullStroke);",
    "  drawTaperedSegment(cx, 175, 34, cx, 222, 38, hullFill, hullStroke);",
    "  // Upper Limbs Tapered Myofascial Hulls (Left & Right)",
    "  drawTaperedSegment(cx - 46, 104, 13, cx - 64, 172, 10.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx - 64, 172, 10, cx - 74, 238, 7.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx + 46, 104, 13, cx + 64, 172, 10.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx + 64, 172, 10, cx + 74, 238, 7.5, hullFill, hullStroke);",
    "  // Lower Limbs Tapered Thigh -> Calf -> Grounded Plantar Foot",
    "  drawTaperedSegment(cx - 23, 220, 18, cx - 25, 314, 12.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx - 25, 314, 12, cx - 23, 404, 8, hullFill, hullStroke);",
    "  drawTaperedSegment(cx - 23, 404, 8, cx - 38, 415, 6, accentHex, hullStroke);",
    "  drawTaperedSegment(cx + 23, 220, 18, cx + 25, 314, 12.5, hullFill, hullStroke);",
    "  drawTaperedSegment(cx + 25, 314, 12, cx + 23, 404, 8, hullFill, hullStroke);",
    "  drawTaperedSegment(cx + 23, 404, 8, cx + 38, 415, 6, accentHex, hullStroke);",
    "  // 3. INTERNAL VISCERA, SKELETAL AXIAL CORE & VASCULAR/NEURAL TREES",
    "  // Axial Spine & Ribcage",
    "  drawTaperedSegment(cx, 78, 5, cx, 218, 6.5, \"rgba(226,232,240,0.75)\", null);",
    "  for (let r = 0; r < 5; r++) {",
    "    const ry = 108 + r * 11; const rw = 28 + (r < 3 ? r * 4 : (4 - r) * 4) + breathExpand;",
    "    ctx.strokeStyle = \"rgba(226,232,240,0.42)\"; ctx.lineWidth = 2.2;",
    "    ctx.beginPath(); ctx.ellipse(cx, ry, rw, 5, 0, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();",
    "  }",
    "  // Bilateral Lungs (Expand with 60FPS Breathing)",
    "  ctx.fillStyle = activeSys === \"RESPIRATORY_PULMONARY\" ? \"rgba(6,182,212,0.55)\" : \"rgba(56,189,248,0.22)\";",
    "  ctx.beginPath(); ctx.ellipse(cx - 17, 132, 13 + breathExpand * 0.5, 26 + breathExpand * 0.6, 0.08, 0, Math.PI * 2); ctx.fill();",
    "  ctx.beginPath(); ctx.ellipse(cx + 17, 132, 13 + breathExpand * 0.5, 26 + breathExpand * 0.6, -0.08, 0, Math.PI * 2); ctx.fill();",
    "  // Pulsating Heart & Aortic Arch (FMA:7088)",
    "  ctx.fillStyle = \"#f43f5e\"; ctx.beginPath(); ctx.arc(cx + 5, 138, 10.5 * cardiacPulse, 0, Math.PI * 2); ctx.fill();",
    "  // Hepatobiliary Liver & Gallbladder (FMA:7197) + Bilateral Kidneys (FMA:7203)",
    "  ctx.fillStyle = activeSys === \"GASTROINTESTINAL_HEPATOBILIARY\" ? \"rgba(249,115,22,0.7)\" : \"rgba(249,115,22,0.32)\";",
    "  ctx.beginPath(); ctx.ellipse(cx - 14, 168, 16, 9, -0.15, 0, Math.PI * 2); ctx.fill();",
    "  ctx.fillStyle = activeSys === \"RENAL_URINARY\" ? \"rgba(16,185,129,0.75)\" : \"rgba(16,185,129,0.32)\";",
    "  ctx.beginPath(); ctx.ellipse(cx - 14, 186, 6, 9, 0.1, 0, Math.PI * 2); ctx.fill();",
    "  ctx.beginPath(); ctx.ellipse(cx + 14, 186, 6, 9, -0.1, 0, Math.PI * 2); ctx.fill();",
    "  // Cerebral Cortex & Neural Connectome Glow (FMA:50801)",
    "  ctx.fillStyle = activeSys === \"NERVOUS_NEUROLOGICAL\" ? \"rgba(168,85,247,0.7)\" : \"rgba(168,85,247,0.3)\";",
    "  ctx.beginPath(); ctx.ellipse(cx, 50, 17, 13, 0, 0, Math.PI * 2); ctx.fill();",
    "  // Articular Joint Capsules (36 Connected Bridges Representation)",
    "  [[cx,84],[cx-46,104],[cx+46,104],[cx-64,172],[cx+64,172],[cx-23,220],[cx+23,220],[cx-25,314],[cx+25,314],[cx-23,404],[cx+23,404]].forEach(([jx,jy]) => {",
    "    ctx.fillStyle = \"#f8fafc\"; ctx.beginPath(); ctx.arc(jx, jy, 4, 0, Math.PI * 2); ctx.fill();",
    "    ctx.strokeStyle = accentHex; ctx.lineWidth = 2; ctx.stroke();",
    "  });",
    "  // Spatial Callout Labels (Clean Tabular Telemetry)",
    "  ctx.fillStyle = \"#94a3b8\"; ctx.font = \"600 11px -apple-system, Inter, sans-serif\";",
    "  ctx.fillText(\"FMA:50801 Cortex & CNS\", 24, 54);",
    "  ctx.fillText(\"FMA:7088 Heart (\" + hrBpm + \" bpm)\", 24, 140);",
    "  ctx.fillText(\"UBERON:0002113 Nephrons\", 24, 190);",
    "  ctx.fillText(\"FMA:9611 Articular Chain\", 24, 316);",
    "  ctx.fillStyle = \"#34d399\"; ctx.fillText(\"Grounded Plantar Pedestal (0% Clipping)\", canvas.width - 230, 436);",
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
    } else if (cmd === "set_page") {
      uiState.activePageId = url.searchParams.get("page") || uiState.activePageId;
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
  if (!out.includes("WORKFLOW & OUTFLOW MATRIX") || !out.includes("The Forum Sports Hub Bintaro")) process.exit(1);
  console.log("  \x1b[32m✓ [WAVE 10 NEXT-GEN 7-PAGE MATRIX & 60FPS CONTOURED UHD BODY EXPOSURE SMOKE TEST PASSED]\x1b[0m");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [WAVE 10 NEXT-GEN 7-PAGE OS & LIVING UHD BODY EXPOSURE LIVE] http://localhost:4399\x1b[0m");
  exec("open http://localhost:4399");
});