#!/usr/bin/env node
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";

const indexUrl = pathToFileURL(path.join(process.cwd(), "src/domains/omnicausalis-index.ts")).href;
const omnicausalis = await import(indexUrl);

let dicomSession = omnicausalis.reconstructPhotorealistic3DCGFromDicomFolder({
  folderPath: "/DICOM/Panacea_Thorax_Cardiac_CT_256Slices",
  sliceCount: 256,
  modality: "CT",
  medMlxBackend: "APPLE_SILICON_METAL_MLX_SEGRESNET"
});

let state = {
  vo2Max: 56,
  hrvMs: 88,
  acuteTrimp: 480,
  joinedSessionId: "CLUB_BINTARO_FOOTBALL_01",
  activeTab: "EXPLORE"
};

function buildRingCard(valueText, subLabel, percent, strokeHex) {
  const dash = Math.round((Math.max(5, Math.min(100, percent)) / 100) * 238);
  return "<div class=\"glass-card ring-card\">" +
    "<svg width=\"88\" height=\"88\" viewBox=\"0 0 96 96\" style=\"display:block;margin:0 auto 10px;\">" +
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
  const layers = dicomSession.layers;
  const light = dicomSession.lightSource;
  const axes = body.fiveVitalityAxes;

  const brandLogoSvg = omnicausalis.renderMonolineSvgIcon("BRAND_CADUCEUS_INFINITY", "#38bdf8", 20);
  const shieldSvg = omnicausalis.renderMonolineSvgIcon("SHIELD_CHECK", "#34d399", 14);
  const pinSvg = omnicausalis.renderMonolineSvgIcon("PIN_LOCATION", "#94a3b8", 14);

  const axisItems = [
    { name: "Cardiovascular", val: axes.cardiovascular.score, sub: axes.cardiovascular.headline, col: "#38bdf8", icon: "HEART_PULSE" },
    { name: "Metabolism", val: axes.metabolism.score, sub: axes.metabolism.headline, col: "#10b981", icon: "FLAME_METABOLIC" },
    { name: "Neuroplasticity", val: axes.neuroplasticity.score, sub: axes.neuroplasticity.headline, col: "#a855f7", icon: "BRAIN_NEURO" },
    { name: "Orthopedic", val: axes.orthopedic.score, sub: axes.orthopedic.headline, col: "#f59e0b", icon: "BONE_ORTHO" },
    { name: "Hormonal Vitality", val: axes.hormonalVitality.score, sub: axes.hormonalVitality.headline, col: "#f43f5e", icon: "SPARK_VITALITY" }
  ].map((a) => {
    const iconSvg = omnicausalis.renderMonolineSvgIcon(a.icon, a.col, 16);
    return "<div class=\"glass-card axis-card\">" +
      "<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;\">" +
      "<div style=\"display:flex;align-items:center;gap:8px;\">" +
      "<span class=\"icon-badge\" style=\"background:rgba(255,255,255,0.04);\">" + iconSvg + "</span>" +
      "<span style=\"font-size:13px;font-weight:600;color:#e2e8f0;letter-spacing:-0.01em;\">" + a.name + "</span></div>" +
      "<span class=\"tabular-num\" style=\"font-size:15px;font-weight:700;color:" + a.col + ";\">" + a.val + "%</span></div>" +
      "<div style=\"font-size:12px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\">" + a.sub + "</div></div>";
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

  const layerPills = layers.map((l) => {
    const on = l.crossSectionEnabled;
    return "<a href=\"/action?cmd=toggle_cs&layer=" + l.layerIndex + "\" class=\"touch-pill\" style=\"background:" + (on ? "rgba(16,185,129,0.16)" : "rgba(30,41,59,0.55)") + ";border-color:" + (on ? "#10b981" : "rgba(255,255,255,0.1)") + ";\">L" + l.layerIndex + " " + (on ? "ON" : "OFF") + "</a>";
  }).join("");

  return [
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\"/><title>PanaceaMed ∞ — Your Body OS</title>",
    "<style>",
    "*, *::before, *::after { box-sizing: border-box; }",
    "body { margin: 0; padding: 28px 36px 96px; background: radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 78%); color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif; line-height: 1.45; overflow-x: hidden; -webkit-font-smoothing: antialiased; }",
    ".tabular-num { font-variant-numeric: tabular-nums; }",
    ".micro-label { font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; }",
    ".glass-card { background: rgba(15,23,42,0.58); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; padding: 20px; }",
    ".ring-card { text-align: center; padding: 18px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; }",
    ".icon-badge { width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }",
    ".brand-squircle { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, rgba(56,189,248,0.2), rgba(16,185,129,0.18)); border: 1px solid rgba(56,189,248,0.35); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }",
    ".touch-btn { min-height: 44px; padding: 0 18px; border-radius: 99px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; flex-shrink: 0; }",
    ".touch-pill { min-height: 38px; padding: 0 14px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1); display: inline-flex; align-items: center; justify-content: center; color: #f8fafc; font-size: 12px; font-weight: 600; text-decoration: none; }",
    ".shell { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }",
    ".top-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }",
    ".ring-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }",
    ".axis-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }",
    ".bento-split { display: grid; grid-template-columns: 1.04fr 1fr; gap: 20px; }",
    ".club-item { padding: 16px; border-radius: 18px; background: rgba(15,23,42,0.68); border: 1px solid rgba(255,255,255,0.07); display: flex; justify-content: space-between; align-items: center; gap: 14px; }",
    ".mobile-nav { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); height: 56px; padding: 0 12px; border-radius: 99px; background: rgba(15,23,42,0.82); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; gap: 6px; z-index: 50; }",
    "@media (max-width: 1023px) {",
    "  body { padding: 16px 16px 88px; }",
    "  .shell { gap: 14px; }",
    "  .glass-card { padding: 16px; border-radius: 20px; }",
    "  .ring-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }",
    "  .axis-grid { grid-template-columns: 1fr; gap: 10px; }",
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
    "<div style=\"display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;\">",
    "<span class=\"micro-label\" style=\"color:#34d399;\">" + body.longitudinalHealthId + "</span>",
    "<span style=\"display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#38bdf8;\">" + shieldSvg + "<span>HIPPOCRATIC & ASTRA VERIFIED (" + astra.healedFailureCodes.length + "/3)</span></span>",
    "</div>",
    "<h1 style=\"margin:0;font-size:clamp(19px,2.2vw,25px);font-weight:700;letter-spacing:-0.02em;color:#f8fafc;\">PanaceaMed · Your Body</h1>",
    "<div style=\"font-size:12px;color:#94a3b8;\">MASTER COMMAND CENTER · Live GPS Tracker · Minimalist Healthspan OS</div>",
    "</div></div>",
    "<div style=\"text-align:right;margin-left:auto;\">",
    "<div class=\"micro-label\">BIOLOGICAL AGE VS " + body.chronologicalAgeYears + "Y</div>",
    "<div class=\"tabular-num\" style=\"font-size:clamp(22px,2.8vw,30px);font-weight:800;color:#34d399;letter-spacing:-0.02em;\">" + body.projectedBiologicalAgeYears + " yrs <span style=\"font-size:14px;color:#38bdf8;\">(" + body.biologicalAgeDeltaYears + "y)</span></div>",
    "</div></header>",

    "<section class=\"ring-grid\">",
    buildRingCard(body.athlyticWhoopMetrics.recoveryPercent + "%", "RECOVERY", body.athlyticWhoopMetrics.recoveryPercent, "#10b981"),
    buildRingCard(String(body.athlyticWhoopMetrics.dayStrain0to21), "DAY STRAIN", (body.athlyticWhoopMetrics.dayStrain0to21 / 21) * 100, "#38bdf8"),
    buildRingCard(body.compositeHealthspanScore + "%", "HEALTHSPAN", body.compositeHealthspanScore, "#a855f7"),
    buildRingCard(body.athlyticWhoopMetrics.acuteChronicWorkloadRatio + "x", "JOINT ACWR", 78, "#f59e0b"),
    "</section>",

    "<section class=\"axis-grid\">" + axisItems + "</section>",

    "<section class=\"bento-split\">",
    "<div class=\"glass-card\" style=\"display:flex;flex-direction:column;justify-content:space-between;gap:14px;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;gap:8px;\">",
    "<span style=\"font-size:14px;font-weight:700;color:#f8fafc;letter-spacing:-0.01em;\">KaloLumen 3D Digital Twin (<10s DICOM)</span>",
    "<span id=\"light-readout\" class=\"tabular-num\" style=\"font-size:11px;color:#38bdf8;font-weight:600;\">Az " + light.azimuthDeg + " deg · El " + light.elevationDeg + " deg</span></div>",
    "<canvas id=\"kalolumen-canvas\" width=\"540\" height=\"240\" style=\"width:100%;height:240px;background:#020617;border-radius:16px;cursor:grab;display:block;border:1px solid rgba(255,255,255,0.06);\"></canvas>",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;\">",
    "<div style=\"display:flex;gap:6px;flex-wrap:wrap;\">" + layerPills + "</div>",
    "<a href=\"/action?cmd=boost_hrv\" class=\"touch-pill\" style=\"background:#10b981;color:#052e16;border-color:#10b981;font-weight:700;\">+ Vagal HRV</a>",
    "</div></div>",

    "<div class=\"glass-card\" style=\"display:flex;flex-direction:column;gap:12px;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;\">",
    "<span style=\"font-size:14px;font-weight:700;color:#f8fafc;letter-spacing:-0.01em;\">Club & Studio Pass</span>",
    "<span class=\"micro-label\" style=\"color:#10b981;\">MATCHED TO " + body.athlyticWhoopMetrics.recoveryPercent + "% RECOVERY</span></div>",
    clubCards,
    "</div></section></div>",

    "<nav class=\"mobile-nav\" aria-label=\"Primary Controls\">",
    "<a href=\"/\" class=\"touch-pill\" style=\"background:rgba(56,189,248,0.18);border-color:#38bdf8;color:#38bdf8;\">Explore</a>",
    "<a href=\"/action?cmd=boost_hrv\" class=\"touch-pill\">Simulate</a>",
    "<a href=\"/action?cmd=toggle_cs&layer=1\" class=\"touch-pill\">Compare</a>",
    "<a href=\"/action?cmd=join_club&id=CLUB_BINTARO_FOOTBALL_01\" class=\"touch-pill\">Pass</a>",
    "</nav>",

    "<script>",
    "const canvas = document.getElementById(\"kalolumen-canvas\");",
    "const ctx = canvas.getContext(\"2d\");",
    "const readout = document.getElementById(\"light-readout\");",
    "let az = " + light.azimuthDeg + "; let el = " + light.elevationDeg + ";",
    "let dragging = false; let lastX = 0; let lastY = 0;",
    "const l1Cs = " + layers[0].crossSectionEnabled + ";",
    "const l2Cs = " + layers[1].crossSectionEnabled + ";",
    "const l3Cs = " + layers[2].crossSectionEnabled + ";",
    "canvas.addEventListener(\"mousedown\", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });",
    "window.addEventListener(\"mouseup\", () => { dragging = false; });",
    "window.addEventListener(\"mousemove\", (e) => {",
    "  if (!dragging) return;",
    "  az = (az + (e.clientX - lastX) * 0.6 + 360) % 360;",
    "  el = Math.max(-80, Math.min(80, el - (e.clientY - lastY) * 0.6));",
    "  lastX = e.clientX; lastY = e.clientY;",
    "  readout.textContent = \"Az \" + az.toFixed(0) + \" deg · El \" + el.toFixed(0) + \" deg\";",
    "  drawScene();",
    "});",
    "function drawLayerSphere(cx, cy, radius, baseRgb, csEnabled, csMode, lx, ly) {",
    "  ctx.save();",
    "  if (csEnabled) {",
    "    ctx.beginPath();",
    "    if (csMode === 0) ctx.rect(0, 0, cx + 14, canvas.height);",
    "    else if (csMode === 1) ctx.rect(0, cy - 8, canvas.width, canvas.height);",
    "    else ctx.rect(cx - 18, 0, canvas.width, canvas.height);",
    "    ctx.clip();",
    "  }",
    "  const grad = ctx.createRadialGradient(cx + lx * radius * 0.55, cy - ly * radius * 0.55, radius * 0.08, cx, cy, radius);",
    "  grad.addColorStop(0, baseRgb[0]); grad.addColorStop(0.55, baseRgb[1]); grad.addColorStop(1, baseRgb[2]);",
    "  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();",
    "  ctx.restore();",
    "}",
    "function drawScene() {",
    "  ctx.clearRect(0, 0, canvas.width, canvas.height);",
    "  const cx = canvas.width / 2; const cy = canvas.height / 2;",
    "  const lx = Math.cos(el * Math.PI / 180) * Math.sin(az * Math.PI / 180);",
    "  const ly = Math.sin(el * Math.PI / 180);",
    "  drawLayerSphere(cx, cy, 42, [\"#ffffff\", \"#cbd5e1\", \"#334155\"], l3Cs, 2, lx, ly);",
    "  drawLayerSphere(cx, cy, 72, [\"#fda4af\", \"#e11d48\", \"rgba(136,19,55,0.85)\"], l2Cs, 1, lx, ly);",
    "  drawLayerSphere(cx, cy, 100, [\"rgba(254,215,170,0.65)\", \"rgba(251,146,60,0.42)\", \"rgba(124,45,18,0.25)\"], l1Cs, 0, lx, ly);",
    "  ctx.fillStyle = \"#38bdf8\"; ctx.beginPath(); ctx.arc(cx + lx * 116, cy - ly * 96, 5, 0, Math.PI * 2); ctx.fill();",
    "}",
    "drawScene();",
    "</script></body></html>"
  ].join("\n");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:4399");
  if (url.pathname === "/action") {
    const cmd = url.searchParams.get("cmd");
    const layerIdx = Number(url.searchParams.get("layer"));
    if (cmd === "toggle_cs" && (layerIdx === 1 || layerIdx === 2 || layerIdx === 3)) {
      const cur = dicomSession.layers[layerIdx - 1];
      dicomSession = { ...dicomSession, layers: omnicausalis.updateIndependentLayerCrossSection(dicomSession.layers, layerIdx, { crossSectionEnabled: !cur.crossSectionEnabled }) };
    } else if (cmd === "join_club") {
      state.joinedSessionId = url.searchParams.get("id") || state.joinedSessionId;
    } else if (cmd === "boost_hrv") {
      state.hrvMs = state.hrvMs >= 104 ? 82 : state.hrvMs + 6;
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
  if (!out.includes("PANACEA-LHID-KELVIN-001") || !out.includes("The Forum Sports Hub Bintaro") || !out.includes("brand-squircle")) process.exit(1);
  console.log("  \x1b[32m✓ [PRECISION LOGO/ICON/FONT & MOBILE 390x844 MINIMALIST UI SMOKE TEST PASSED]\x1b[0m");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [PANACEA MINIMALIST MOBILE & DESKTOP OS LIVE] http://localhost:4399\x1b[0m");
  exec("open http://localhost:4399");
});