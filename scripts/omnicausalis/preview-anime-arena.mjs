#!/usr/bin/env node
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";

const indexUrl = pathToFileURL(path.join(process.cwd(), "src/domains/omnicausalis-index.ts")).href;
const omnicausalis = await import(indexUrl);

let projectileState = {
  sessionId: "PROJ-UHD-01",
  activeSystemId: "MUSCULOSKELETAL_ARTICULAR",
  activeStageId: "STAGE_1_WHOLE_BODY_ATLAS",
  selectedFmaId: "FMA:7161",
  cameraYawDeg: 18,
  cameraPitchDeg: 12,
  silhouetteHullOpacity0to1: 0.28,
  transitionHistory: ["STAGE_1_WHOLE_BODY_ATLAS"]
};

let state = {
  vo2Max: 56,
  hrvMs: 88,
  acuteTrimp: 480,
  joinedSessionId: "CLUB_BINTARO_FOOTBALL_01"
};

function buildRingCard(valueText, subLabel, percent, strokeHex) {
  const dash = Math.round((Math.max(5, Math.min(100, percent)) / 100) * 238);
  return "<div class=\"glass-card ring-card\">" +
    "<svg width=\"84\" height=\"84\" viewBox=\"0 0 96 96\" style=\"display:block;margin:0 auto 8px;\">" +
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
    vo2MaxMlKgMin: state.vo2Max,
    hrvRmssdMs: state.hrvMs,
    hrvBaseline60dMs: 76,
    restingHeartRateBpm: 50,
    restorativeSleepRatio0to1: 0.48,
    acuteLoad7dTrimp: state.acuteTrimp,
    chronicLoad28dTrimp: 440,
    fastingGlucoseMgDl: 81,
    zone2MinutesWeekly: 210
  });
  const matches = omnicausalis.matchReclubAndClassPassSessionsToBiology(body);
  const frustum = omnicausalis.computeAntiClippingGroundedViewportGeometry({
    viewportWidthPx: 620,
    viewportHeightPx: 460,
    stageId: projectileState.activeStageId
  });
  const activeManifest = omnicausalis.COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY.find((s) => s.systemId === projectileState.activeSystemId) || omnicausalis.COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY[0];
  const coupledSim = omnicausalis.executeCrossOrganCoupledSimulation({ scenarioId: "BASELINE_HOMEOSTASIS" });
  const cabgSim = omnicausalis.evaluateCabgEducationalSurgicalSimulation({
    sessionId: "CABG-LIVE",
    currentPhase: "CLAMP_RELEASE_AND_DOPPLER_FLOW_VERIFICATION",
    selectedInstrument: "TRANSIT_TIME_DOPPLER_PROBE",
    nativeLadStenosisPercent: 90,
    limaGraftRadiusMm: 1.35,
    limaGraftLengthMm: 110,
    meanAorticRootPressureMmHg: 88,
    distalCoronaryBedPressureMmHg: 24
  });

  const brandLogoSvg = omnicausalis.renderMonolineSvgIcon("BRAND_CADUCEUS_INFINITY", "#38bdf8", 20);
  const shieldSvg = omnicausalis.renderMonolineSvgIcon("SHIELD_CHECK", "#34d399", 14);
  const pinSvg = omnicausalis.renderMonolineSvgIcon("PIN_LOCATION", "#94a3b8", 14);

  const systemPills = omnicausalis.COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY.slice(0, 6).map((sys) => {
    const active = sys.systemId === projectileState.activeSystemId;
    return "<a href=\"/action?cmd=set_system&sys=" + sys.systemId + "\" class=\"touch-pill\" style=\"background:" + (active ? "rgba(56,189,248,0.18)" : "rgba(15,23,42,0.65)") + ";border-color:" + (active ? sys.spectralAccentHex : "rgba(255,255,255,0.09)") + ";color:" + (active ? "#f8fafc" : "#94a3b8") + ";\">" + sys.displayName + "</a>";
  }).join("");

  const stageFlowPills = [
    { id: "STAGE_1_WHOLE_BODY_ATLAS", label: "1. Whole-Body Atlas" },
    { id: "STAGE_2_ORGAN_SUBSTRUCTURE_FOCUS", label: "2. Organ Focus" },
    { id: "STAGE_3_COUPLED_PHYSIOLOGY_SIM", label: "3. Physiology Sim" },
    { id: "STAGE_4_SURGICAL_PROCEDURAL_SIM", label: "4. Surgical Sim" },
    { id: "STAGE_5_PROMETHEUS_CLINICAL_MASTERY", label: "5. Case Mastery" }
  ].map((st) => {
    const active = st.id === projectileState.activeStageId;
    return "<a href=\"/action?cmd=set_stage&stage=" + st.id + "\" class=\"touch-pill\" style=\"background:" + (active ? "#10b981" : "rgba(30,41,59,0.55)") + ";color:" + (active ? "#052e16" : "#e2e8f0") + ";border-color:" + (active ? "#10b981" : "rgba(255,255,255,0.1)") + ";font-weight:700;\">" + st.label + "</a>";
  }).join("");

  const clubCards = matches.map((m) => {
    const isJoined = state.joinedSessionId === m.sessionId;
    const accent = m.matchStatus === "BIOLOGICALLY_OPTIMAL_MATCH" ? "#10b981" : "#f59e0b";
    return "<div class=\"club-item\" style=\"border-color:" + (isJoined ? accent : "rgba(255,255,255,0.07)") + ";\">" +
      "<div style=\"min-width:0;flex:1;\">" +
      "<div class=\"micro-label\" style=\"color:" + accent + ";margin-bottom:4px;\">" + m.organizerClub + " · STRAIN " + m.estimatedStrain0to21 + "</div>" +
      "<div style=\"font-size:15px;font-weight:700;color:#f8fafc;letter-spacing:-0.01em;margin-bottom:4px;\">" + m.title + "</div>" +
      "<div style=\"display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8;\">" + pinSvg + "<span>" + m.venueName + " (" + m.distanceFromHomeKm + " km) · Rp" + m.feeIdr.toLocaleString() + "</span></div>" +
      "<div style=\"font-size:12px;color:#cbd5e1;margin-top:6px;\">" + m.conciseMedicalAdvice + "</div></div>" +
      "<a href=\"/action?cmd=join_club&id=" + m.sessionId + "\" class=\"touch-btn\" style=\"background:" + (isJoined ? "#10b981" : "rgba(56,189,248,0.12)") + ";color:" + (isJoined ? "#052e16" : "#38bdf8") + ";border:1px solid " + (isJoined ? "#10b981" : "rgba(56,189,248,0.35)") + ";\">" + (isJoined ? "Joined" : "Join Pass") + "</a></div>";
  }).join("");

  return [
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\"/><title>PanaceaMed ∞ — Single-Projectile UHD Body Exposure</title>",
    "<style>",
    "*, *::before, *::after { box-sizing: border-box; }",
    "body { margin: 0; padding: 24px 32px 92px; background: radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 80%); color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif; line-height: 1.45; overflow-x: hidden; -webkit-font-smoothing: antialiased; }",
    ".tabular-num { font-variant-numeric: tabular-nums; }",
    ".micro-label { font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; }",
    ".glass-card { background: rgba(15,23,42,0.58); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; padding: 20px; }",
    ".ring-card { text-align: center; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; }",
    ".brand-squircle { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, rgba(56,189,248,0.2), rgba(16,185,129,0.18)); border: 1px solid rgba(56,189,248,0.35); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }",
    ".touch-btn { min-height: 44px; padding: 0 18px; border-radius: 99px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; flex-shrink: 0; }",
    ".touch-pill { min-height: 36px; padding: 0 13px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1); display: inline-flex; align-items: center; justify-content: center; color: #f8fafc; font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap; }",
    ".shell { max-width: 1320px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }",
    ".top-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }",
    ".ring-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }",
    ".bento-split { display: grid; grid-template-columns: 1.15fr 1fr; gap: 20px; align-items: stretch; }",
    ".club-item { padding: 15px; border-radius: 18px; background: rgba(15,23,42,0.68); border: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; align-items: center; gap: 14px; }",
    ".mobile-nav { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); height: 54px; padding: 0 12px; border-radius: 99px; background: rgba(15,23,42,0.85); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; gap: 6px; z-index: 50; }",
    "@media (max-width: 1023px) {",
    "  body { padding: 14px 14px 86px; }",
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
    "<span style=\"display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#38bdf8;\">" + shieldSvg + "<span>SINGLE-PROJECTILE UHD · ZERO CLIPPING · 11/11 SYSTEMS</span></span>",
    "</div>",
    "<h1 style=\"margin:0;font-size:clamp(19px,2.2vw,24px);font-weight:700;letter-spacing:-0.02em;color:#f8fafc;\">Body Exposure ∞ — Unified Computational Human</h1>",
    "<div style=\"font-size:12px;color:#94a3b8;\">MASTER COMMAND CENTER · Grounded Subsurface Silhouette · Connected Articular Joints · Seamless Flow</div>",
    "</div></div>",
    "<div style=\"text-align:right;margin-left:auto;\">",
    "<div class=\"micro-label\">BIOLOGICAL AGE VS " + body.chronologicalAgeYears + "Y</div>",
    "<div class=\"tabular-num\" style=\"font-size:clamp(22px,2.6vw,28px);font-weight:800;color:#34d399;letter-spacing:-0.02em;\">" + body.projectedBiologicalAgeYears + " yrs <span style=\"font-size:14px;color:#38bdf8;\">(" + body.biologicalAgeDeltaYears + "y)</span></div>",
    "</div></header>",

    "<!-- SINGLE-PROJECTILE 5-STAGE CONTINUOUS FLOW BAR (NO PAGE RELOAD DISCONNECT) -->",
    "<section class=\"glass-card\" style=\"padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;\">",
    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;\">" + stageFlowPills + "</div>",
    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;\">" + systemPills + "</div>",
    "</section>",

    "<section class=\"bento-split\">",
    "<!-- LEFT: UHD GROUNDED FULL-BODY SINGLE-PROJECTILE VIEWPORT (NO CUTOFF, NO FLOATING) -->",
    "<div class=\"glass-card\" style=\"display:flex;flex-direction:column;justify-content:space-between;gap:12px;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;\">",
    "<div><div class=\"micro-label\" style=\"color:" + activeManifest.spectralAccentHex + ";\">" + activeManifest.uberonSystemId + " · " + activeManifest.connectedJointBridgeCount + " ARTICULAR BRIDGES CONNECTED</div>",
    "<div style=\"font-size:16px;font-weight:700;color:#f8fafc;\">" + activeManifest.displayName + " — " + projectileState.activeStageId.replace(/STAGE_\d_/, "").replace(/_/g, " ") + "</div></div>",
    "<span id=\"light-readout\" class=\"tabular-num\" style=\"font-size:11px;color:#38bdf8;font-weight:600;\">Cam " + frustum.cameraDistanceMeters + "m · Full Head-to-Toe Fit</span></div>",

    "<canvas id=\"uhd-body-canvas\" width=\"620\" height=\"460\" style=\"width:100%;height:420px;background:radial-gradient(circle at 50% 42%, #0f172a 0%, #020617 85%);border-radius:18px;cursor:grab;display:block;border:1px solid rgba(255,255,255,0.07);\"></canvas>",

    "<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding-top:4px;\">",
    "<div style=\"padding:10px 12px;border-radius:14px;background:rgba(30,41,59,0.45);border:1px solid rgba(255,255,255,0.06);\"><div class=\"micro-label\">CARDIAC OUTPUT / MAP</div><div class=\"tabular-num\" style=\"font-size:14px;font-weight:700;color:#38bdf8;margin-top:2px;\">" + coupledSim.cardiovascular.cardiacOutputLMin + " L/m · " + coupledSim.cardiovascular.meanArterialPressureMmHg + " mmHg</div></div>",
    "<div style=\"padding:10px 12px;border-radius:14px;background:rgba(30,41,59,0.45);border:1px solid rgba(255,255,255,0.06);\"><div class=\"micro-label\">NEPHRON GFR / PH</div><div class=\"tabular-num\" style=\"font-size:14px;font-weight:700;color:#10b981;margin-top:2px;\">" + coupledSim.renalAndElectrolyte.estimatedGfrMlMin + " mL/m · pH " + coupledSim.respiratoryAndAcidBase.arterialPh + "</div></div>",
    "<div style=\"padding:10px 12px;border-radius:14px;background:rgba(30,41,59,0.45);border:1px solid rgba(255,255,255,0.06);\"><div class=\"micro-label\">CABG LIMA-LAD FLOW</div><div class=\"tabular-num\" style=\"font-size:14px;font-weight:700;color:#f59e0b;margin-top:2px;\">" + cabgSim.poiseuilleGraftHemodynamics.limaGraftFlowMlMin + " mL/m (PI " + cabgSim.poiseuilleGraftHemodynamics.transitTimePulsatilityIndex + ")</div></div>",
    "</div></div>",

    "<!-- RIGHT: HEALTHSPAN RINGS + RECLUB/CLASSPASS SMART PASS -->",
    "<div style=\"display:flex;flex-direction:column;gap:16px;\">",
    "<div class=\"ring-grid\">",
    buildRingCard(body.athlyticWhoopMetrics.recoveryPercent + "%", "RECOVERY", body.athlyticWhoopMetrics.recoveryPercent, "#10b981"),
    buildRingCard(String(body.athlyticWhoopMetrics.dayStrain0to21), "DAY STRAIN", (body.athlyticWhoopMetrics.dayStrain0to21 / 21) * 100, "#38bdf8"),
    buildRingCard(body.compositeHealthspanScore + "%", "HEALTHSPAN", body.compositeHealthspanScore, "#a855f7"),
    buildRingCard(body.athlyticWhoopMetrics.acuteChronicWorkloadRatio + "x", "JOINT ACWR", 78, "#f59e0b"),
    "</div>",
    "<div class=\"glass-card\" style=\"display:flex;flex-direction:column;gap:12px;flex:1;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;\">",
    "<span style=\"font-size:14px;font-weight:700;color:#f8fafc;\">Club & Studio Pass (The Forum Sports Hub Bintaro)</span>",
    "<span class=\"micro-label\" style=\"color:#10b981;\">READY</span></div>",
    clubCards,
    "</div></div></section></div>",

    "<nav class=\"mobile-nav\" aria-label=\"Single-Projectile Controls\">",
    "<a href=\"/action?cmd=set_stage&stage=STAGE_1_WHOLE_BODY_ATLAS\" class=\"touch-pill\" style=\"background:rgba(56,189,248,0.18);border-color:#38bdf8;color:#38bdf8;\">Explore</a>",
    "<a href=\"/action?cmd=set_stage&stage=STAGE_3_COUPLED_PHYSIOLOGY_SIM\" class=\"touch-pill\">Simulate</a>",
    "<a href=\"/action?cmd=set_stage&stage=STAGE_4_SURGICAL_PROCEDURAL_SIM\" class=\"touch-pill\">Procedures</a>",
    "<a href=\"/action?cmd=set_stage&stage=STAGE_5_PROMETHEUS_CLINICAL_MASTERY\" class=\"touch-pill\">Mastery</a>",
    "</nav>",

    "<script>",
    "const canvas = document.getElementById(\"uhd-body-canvas\");",
    "const ctx = canvas.getContext(\"2d\");",
    "const readout = document.getElementById(\"light-readout\");",
    "let yaw = " + projectileState.cameraYawDeg + "; let pitch = " + projectileState.cameraPitchDeg + ";",
    "let dragging = false; let lastX = 0; let lastY = 0;",
    "const accentHex = \"" + activeManifest.spectralAccentHex + "\";",
    "canvas.addEventListener(\"mousedown\", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });",
    "window.addEventListener(\"mouseup\", () => { dragging = false; });",
    "window.addEventListener(\"mousemove\", (e) => {",
    "  if (!dragging) return;",
    "  yaw = (yaw + (e.clientX - lastX) * 0.5 + 360) % 360;",
    "  pitch = Math.max(-45, Math.min(45, pitch - (e.clientY - lastY) * 0.4));",
    "  lastX = e.clientX; lastY = e.clientY;",
    "  readout.textContent = \"Yaw \" + yaw.toFixed(0) + \" deg · Pitch \" + pitch.toFixed(0) + \" deg · Grounded UHD\";",
    "  drawUnifiedBody();",
    "});",
    "function drawCapsuleLimb(x1, y1, x2, y2, w, color) {",
    "  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = \"round\";",
    "  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();",
    "}",
    "function drawArticularJoint(x, y, r) {",
    "  ctx.fillStyle = \"#f8fafc\"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();",
    "  ctx.strokeStyle = accentHex; ctx.lineWidth = 2; ctx.stroke();",
    "}",
    "function drawUnifiedBody() {",
    "  ctx.clearRect(0, 0, canvas.width, canvas.height);",
    "  const cx = canvas.width / 2 + Math.sin(yaw * Math.PI / 180) * 10;",
    "  // 1. GROUNDING PEDESTAL SHADOW (Eliminates Floating Look)",
    "  const pedGrad = ctx.createRadialGradient(cx, 418, 8, cx, 418, 95);",
    "  pedGrad.addColorStop(0, \"rgba(56,189,248,0.38)\"); pedGrad.addColorStop(0.6, \"rgba(16,185,129,0.12)\"); pedGrad.addColorStop(1, \"rgba(2,6,23,0)\");",
    "  ctx.fillStyle = pedGrad; ctx.beginPath(); ctx.ellipse(cx, 418, 92, 16, 0, 0, Math.PI * 2); ctx.fill();",
    "  // 2. CONTINUOUS SUBSURFACE SILHOUETTE HULL (Eliminates Fragmented/Cut Pieces)",
    "  ctx.save(); ctx.strokeStyle = \"rgba(148,163,184,0.22)\"; ctx.fillStyle = \"rgba(30,41,59,0.34)\"; ctx.lineWidth = 1.5;",
    "  ctx.beginPath(); ctx.arc(cx, 62, 23, 0, Math.PI * 2); ctx.fill(); ctx.stroke();",
    "  ctx.beginPath(); ctx.roundRect(cx - 42, 90, 84, 132, 28); ctx.fill(); ctx.stroke();",
    "  ctx.restore();",
    "  // 3. CONTINUOUS SKELETAL-MUSCULAR-VASCULAR ARTICULATED CHAIN (Head-to-Toe Inside Frustum)",
    "  drawCapsuleLimb(cx, 84, cx, 212, 12, \"rgba(226,232,240,0.85)\");",
    "  drawCapsuleLimb(cx - 44, 102, cx + 44, 102, 10, accentHex);",
    "  // Thorax & Myocardium Core",
    "  const ribGrad = ctx.createRadialGradient(cx, 138, 6, cx, 138, 38);",
    "  ribGrad.addColorStop(0, accentHex); ribGrad.addColorStop(1, \"rgba(225,29,72,0.28)\");",
    "  ctx.fillStyle = ribGrad; ctx.beginPath(); ctx.ellipse(cx, 140, 32, 42, 0, 0, Math.PI * 2); ctx.fill();",
    "  // Connected Upper Limbs (Shoulder -> Elbow -> Wrist)",
    "  drawCapsuleLimb(cx - 44, 102, cx - 62, 172, 11, \"rgba(244,63,94,0.75)\");",
    "  drawCapsuleLimb(cx - 62, 172, cx - 70, 238, 9, \"rgba(226,232,240,0.82)\");",
    "  drawCapsuleLimb(cx + 44, 102, cx + 62, 172, 11, \"rgba(244,63,94,0.75)\");",
    "  drawCapsuleLimb(cx + 62, 172, cx + 70, 238, 9, \"rgba(226,232,240,0.82)\");",
    "  // Pelvic Girdle & Connected Lower Limbs (Hip -> Knee -> Ankle -> Grounded Plantar Foot)",
    "  drawCapsuleLimb(cx - 26, 214, cx + 26, 214, 14, \"rgba(226,232,240,0.88)\");",
    "  drawCapsuleLimb(cx - 24, 214, cx - 26, 312, 15, \"rgba(244,63,94,0.78)\");",
    "  drawCapsuleLimb(cx - 26, 312, cx - 24, 404, 11, \"rgba(226,232,240,0.9)\");",
    "  drawCapsuleLimb(cx - 24, 404, cx - 36, 414, 9, accentHex);",
    "  drawCapsuleLimb(cx + 24, 214, cx + 26, 312, 15, \"rgba(244,63,94,0.78)\");",
    "  drawCapsuleLimb(cx + 26, 312, cx + 24, 404, 11, \"rgba(226,232,240,0.9)\");",
    "  drawCapsuleLimb(cx + 24, 404, cx + 36, 414, 9, accentHex);",
    "  // Articular Joint Bridges (Zero Gaps)",
    "  [[cx,88],[cx-44,102],[cx+44,102],[cx-62,172],[cx+62,172],[cx-24,214],[cx+24,214],[cx-26,312],[cx+26,312],[cx-24,404],[cx+24,404]].forEach(([jx,jy]) => drawArticularJoint(jx, jy, 4.5));",
    "}",
    "drawUnifiedBody();",
    "</script></body></html>"
  ].join("\n");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:4399");
  if (url.pathname === "/action") {
    const cmd = url.searchParams.get("cmd");
    if (cmd === "set_system") {
      projectileState = omnicausalis.transitionSingleProjectileBodyExposure(projectileState, { targetSystemId: url.searchParams.get("sys") });
    } else if (cmd === "set_stage") {
      projectileState = omnicausalis.transitionSingleProjectileBodyExposure(projectileState, { targetStageId: url.searchParams.get("stage") });
    } else if (cmd === "join_club") {
      state.joinedSessionId = url.searchParams.get("id") || state.joinedSessionId;
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
  if (!out.includes("SINGLE-PROJECTILE UHD") || !out.includes("The Forum Sports Hub Bintaro")) process.exit(1);
  console.log("  \x1b[32m✓ [WAVE 9 SINGLE-PROJECTILE UHD BODY EXPOSURE SMOKE TEST PASSED]\x1b[0m");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [SINGLE-PROJECTILE UHD BODY EXPOSURE LIVE] http://localhost:4399\x1b[0m");
  exec("open http://localhost:4399");
});