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
  joinedSessionId: "CLUB_BINTARO_FOOTBALL_01"
};

function buildRingSvg(valueText, subLabel, percent, strokeHex) {
  const dash = Math.round((Math.max(5, Math.min(100, percent)) / 100) * 251);
  return "<div style=\"text-align:center;padding:22px 16px;border-radius:24px;background:rgba(15,23,42,0.55);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);\">" +
    "<svg width=\"108\" height=\"108\" viewBox=\"0 0 100 100\" style=\"display:block;margin:0 auto 12px;\">" +
    "<circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"none\" stroke=\"rgba(255,255,255,0.07)\" stroke-width=\"8\"/>" +
    "<circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"none\" stroke=\"" + strokeHex + "\" stroke-width=\"8\" stroke-linecap=\"round\" stroke-dasharray=\"" + dash + " 251\" transform=\"rotate(-90 50 50)\"/>" +
    "<text x=\"50\" y=\"55\" text-anchor=\"middle\" fill=\"#f8fafc\" font-size=\"18\" font-weight=\"800\">" + valueText + "</text>" +
    "</svg>" +
    "<div style=\"font-size:12px;font-weight:600;color:#94a3b8;letter-spacing:0.05em;\">" + subLabel + "</div></div>";
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
  const axisPills = [
    { name: "Cardiovascular", val: axes.cardiovascular.score, sub: axes.cardiovascular.headline, col: "#38bdf8" },
    { name: "Metabolism", val: axes.metabolism.score, sub: axes.metabolism.headline, col: "#10b981" },
    { name: "Neuroplasticity", val: axes.neuroplasticity.score, sub: axes.neuroplasticity.headline, col: "#a855f7" },
    { name: "Orthopedic", val: axes.orthopedic.score, sub: axes.orthopedic.headline, col: "#f59e0b" },
    { name: "Hormonal Vitality", val: axes.hormonalVitality.score, sub: axes.hormonalVitality.headline, col: "#f43f5e" }
  ].map((a) =>
    "<div style=\"padding:18px 20px;border-radius:20px;background:rgba(30,41,59,0.45);border:1px solid rgba(255,255,255,0.07);\">" +
    "<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;\">" +
    "<span style=\"font-size:13px;font-weight:700;color:" + a.col + ";\">" + a.name + "</span>" +
    "<span style=\"font-size:16px;font-weight:800;color:#f8fafc;\">" + a.val + "%</span></div>" +
    "<div style=\"font-size:12px;color:#94a3b8;\">" + a.sub + "</div></div>"
  ).join("");

  const clubCards = matches.map((m) => {
    const isJoined = state.joinedSessionId === m.sessionId;
    const accent = m.matchStatus === "BIOLOGICALLY_OPTIMAL_MATCH" ? "#10b981" : "#f59e0b";
    return "<div style=\"padding:18px 20px;border-radius:20px;background:rgba(15,23,42,0.65);border:1px solid " + (isJoined ? accent : "rgba(255,255,255,0.08)") + ";display:flex;justify-content:space-between;align-items:center;gap:16px;\">" +
      "<div><div style=\"font-size:11px;font-weight:700;color:" + accent + ";letter-spacing:0.05em;\">" + m.organizerClub.toUpperCase() + " · STRAIN " + m.estimatedStrain0to21 + "</div>" +
      "<div style=\"font-size:16px;font-weight:700;color:#f8fafc;margin:4px 0;\">" + m.title + "</div>" +
      "<div style=\"font-size:12px;color:#94a3b8;\">" + m.venueName + " (" + m.distanceFromHomeKm + " km) · " + m.durationHours + "h · Rp" + m.feeIdr.toLocaleString() + "</div>" +
      "<div style=\"font-size:12px;color:#cbd5e1;margin-top:6px;\">" + m.conciseMedicalAdvice + "</div></div>" +
      "<a href=\"/action?cmd=join_club&id=" + m.sessionId + "\" style=\"white-space:nowrap;padding:10px 18px;border-radius:99px;background:" + (isJoined ? "#10b981" : "rgba(56,189,248,0.15)") + ";color:" + (isJoined ? "#052e16" : "#38bdf8") + ";border:1px solid " + (isJoined ? "#10b981" : "#38bdf8") + ";font-weight:700;font-size:12px;text-decoration:none;\">" + (isJoined ? "Joined Pass" : "Instant Join") + "</a></div>";
  }).join("");

  const layerPills = layers.map((l) => {
    const on = l.crossSectionEnabled;
    return "<a href=\"/action?cmd=toggle_cs&layer=" + l.layerIndex + "\" style=\"padding:8px 14px;border-radius:99px;background:" + (on ? "rgba(16,185,129,0.18)" : "rgba(30,41,59,0.6)") + ";border:1px solid " + (on ? "#10b981" : "rgba(255,255,255,0.1)") + ";color:#f8fafc;font-size:12px;font-weight:600;text-decoration:none;\">L" + l.layerIndex + " Slice: " + (on ? "ON" : "OFF") + "</a>";
  }).join(" ");

  return [
    "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><title>PanaceaMed ∞ — Your Body & Sagrada-Glass Healthspan OS</title></head>",
    "<body style=\"margin:0;padding:40px 52px;background:radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 75%);color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.5;\">",
    "<header style=\"max-width:1320px;margin:0 auto 36px;padding:28px 36px;border-radius:28px;background:rgba(15,23,42,0.55);backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;\">",
    "<div>",
    "<div style=\"display:flex;gap:10px;align-items:center;margin-bottom:8px;\">",
    "<span style=\"padding:4px 12px;border-radius:99px;background:rgba(16,185,129,0.15);color:#34d399;font-size:11px;font-weight:700;letter-spacing:0.06em;\">" + body.longitudinalHealthId + "</span>",
    "<span style=\"padding:4px 12px;border-radius:99px;background:rgba(56,189,248,0.15);color:#38bdf8;font-size:11px;font-weight:600;\">HIPPOCRATIC OATH VERIFIED · ASTRA HEALED (" + astra.healedFailureCodes.length + "/3) · MASTER COMMAND CENTER</span>",
    "</div>",
    "<h1 style=\"margin:0;font-size:28px;font-weight:800;letter-spacing:-0.02em;\">Your Body — Longitudinal Healthspan Portfolio</h1>",
    "<p style=\"margin:6px 0 0;font-size:14px;color:#94a3b8;\">Precision biology, Athlytic/Whoop recovery telemetry, KaloLumen 3DCG, Live GPS Tracker, and Reclub/ClassPass smart matchmaking.</p>",
    "</div>",
    "<div style=\"text-align:right;\">",
    "<div style=\"font-size:12px;color:#94a3b8;\">Biological Age vs Chronological (" + body.chronologicalAgeYears + "y)</div>",
    "<div style=\"font-size:34px;font-weight:800;color:#34d399;\">" + body.projectedBiologicalAgeYears + " yrs <span style=\"font-size:16px;color:#38bdf8;\">(" + body.biologicalAgeDeltaYears + "y)</span></div>",
    "</div></header>",
    "<main style=\"max-width:1320px;margin:0 auto;display:flex;flex-direction:column;gap:32px;\">",
    "<section style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:24px;\">",
    buildRingSvg(body.athlyticWhoopMetrics.recoveryPercent + "%", "RECOVERY READINESS", body.athlyticWhoopMetrics.recoveryPercent, "#10b981"),
    buildRingSvg(String(body.athlyticWhoopMetrics.dayStrain0to21), "DAY STRAIN (0-21)", (body.athlyticWhoopMetrics.dayStrain0to21 / 21) * 100, "#38bdf8"),
    buildRingSvg(body.compositeHealthspanScore + "%", "HEALTHSPAN VITALITY", body.compositeHealthspanScore, "#a855f7"),
    buildRingSvg(body.athlyticWhoopMetrics.acuteChronicWorkloadRatio + "x", "ORTHOPEDIC ACWR", 78, "#f59e0b"),
    "</section>",
    "<section style=\"display:grid;grid-template-columns:repeat(5,1fr);gap:18px;\">" + axisPills + "</section>",
    "<section style=\"display:grid;grid-template-columns:1.05fr 1fr;gap:28px;\">",
    "<div style=\"padding:28px;border-radius:28px;background:rgba(15,23,42,0.55);backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;justify-content:space-between;\">",
    "<div><div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;\">",
    "<span style=\"font-size:15px;font-weight:700;color:#38bdf8;\">KaloLumen 3-Layer Digital Twin (<10s DICOM)</span>",
    "<span id=\"light-readout\" style=\"font-size:12px;color:#fde68a;\">Drag Mouse: Az " + light.azimuthDeg + "° · El " + light.elevationDeg + "°</span></div>",
    "<canvas id=\"kalolumen-canvas\" width=\"580\" height=\"260\" style=\"width:100%;height:260px;background:#020617;border-radius:20px;cursor:grab;display:block;margin-bottom:18px;border:1px solid rgba(255,255,255,0.06);\"></canvas></div>",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;\">",
    "<div>" + layerPills + "</div>",
    "<a href=\"/action?cmd=boost_hrv\" style=\"padding:8px 16px;border-radius:99px;background:#10b981;color:#052e16;font-size:12px;font-weight:700;text-decoration:none;\">+ Simulate Vagal HRV Boost</a>",
    "</div></div>",
    "<div style=\"padding:28px;border-radius:28px;background:rgba(15,23,42,0.55);backdrop-filter:blur(28px);border:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:16px;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;\">",
    "<span style=\"font-size:15px;font-weight:700;color:#10b981;\">Panacea Club & Studio Pass (Reclub × ClassPass × Biology)</span>",
    "<span style=\"font-size:12px;color:#94a3b8;\">Matched to Recovery " + body.athlyticWhoopMetrics.recoveryPercent + "%</span></div>",
    clubCards,
    "</div></section></main>",
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
    "  readout.textContent = \"Drag Mouse: Az \" + az.toFixed(0) + \"° · El \" + el.toFixed(0) + \"°\";",
    "  drawScene();",
    "});",
    "function drawLayerSphere(cx, cy, radius, baseRgb, csEnabled, csMode, lx, ly) {",
    "  ctx.save();",
    "  if (csEnabled) {",
    "    ctx.beginPath();",
    "    if (csMode === 0) ctx.rect(0, 0, cx + 16, canvas.height);",
    "    else if (csMode === 1) ctx.rect(0, cy - 10, canvas.width, canvas.height);",
    "    else ctx.rect(cx - 20, 0, canvas.width, canvas.height);",
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
    "  drawLayerSphere(cx, cy, 46, [\"#ffffff\", \"#cbd5e1\", \"#334155\"], l3Cs, 2, lx, ly);",
    "  drawLayerSphere(cx, cy, 78, [\"#fda4af\", \"#e11d48\", \"rgba(136,19,55,0.85)\"], l2Cs, 1, lx, ly);",
    "  drawLayerSphere(cx, cy, 108, [\"rgba(254,215,170,0.65)\", \"rgba(251,146,60,0.42)\", \"rgba(124,45,18,0.25)\"], l1Cs, 0, lx, ly);",
    "  ctx.fillStyle = \"#fde047\"; ctx.beginPath(); ctx.arc(cx + lx * 125, cy - ly * 105, 6, 0, Math.PI * 2); ctx.fill();",
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
  if (!out.includes("PANACEA-LHID-KELVIN-001") || !out.includes("The Forum Sports Hub Bintaro")) process.exit(1);
  console.log("  \x1b[32m✓ [SAGRADA-APPLE GLASSMORPHISM + ATHLYTIC + RECLUB UI SMOKE TEST PASSED]\x1b[0m");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [YOUR BODY SAGRADA-GLASS OS LIVE] http://localhost:4399\x1b[0m");
  exec("open http://localhost:4399");
});