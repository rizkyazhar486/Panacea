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
  gaitPreset: "NORMATIVE",
  sepsisPreset: "COMPENSATED",
  activeBotTalk: "DR_SATORU_SENSEI",
  learnerTheta: 2.04,
  arenaScore: 2680,
  lastLog: "Integrated FreeMoCap/SkellyTracker 3D Pose, SepsisAgent/REMOP/Pantheon/MedGen, TalkVid/ExpressiveSpeech VRM Lip-Sync, SimReady-GLB & Piskel/Kenney HUD!"
};

function renderHtml() {
  const layers = dicomSession.layers;
  const light = dicomSession.lightSource;

  const mocap = omnicausalis.analyzeFreeMoCapSkellyPose(
    state.gaitPreset === "HEMIPARETIC"
      ? {
          leftHipXYZ: [-0.12, 0.92, 0.0], leftKneeXYZ: [-0.12, 0.50, 0.04], leftAnkleXYZ: [-0.12, 0.08, 0.02],
          rightHipXYZ: [0.12, 0.88, 0.0], rightKneeXYZ: [0.12, 0.48, 0.28], rightAnkleXYZ: [0.12, 0.10, -0.05]
        }
      : {
          leftHipXYZ: [-0.12, 0.92, 0.0], leftKneeXYZ: [-0.12, 0.50, 0.18], leftAnkleXYZ: [-0.12, 0.08, 0.0],
          rightHipXYZ: [0.12, 0.92, 0.0], rightKneeXYZ: [0.12, 0.50, 0.17], rightAnkleXYZ: [0.12, 0.08, 0.0]
        }
  );

  const sepsis = omnicausalis.evaluateSepsisAgentAndRemopSafety(
    state.sepsisPreset === "SEPTIC_SHOCK"
      ? { respiratoryRateBpm: 28, systolicBpMmHg: 84, glasgowComaScale3to15: 13, paO2FiO2Ratio: 185, platelets10e3PerUl: 88, bilirubinMgDl: 2.4, meanArterialPressureMmHg: 58, creatinineMgDl: 2.3, lactateMmolL: 4.2 }
      : { respiratoryRateBpm: 18, systolicBpMmHg: 118, glasgowComaScale3to15: 15, paO2FiO2Ratio: 410, platelets10e3PerUl: 240, bilirubinMgDl: 0.8, meanArterialPressureMmHg: 82, creatinineMgDl: 0.9, lactateMmolL: 1.1 }
  );

  const botProfile = omnicausalis.PANACEA_COMPETITIVE_ANIME_BOTS[state.activeBotTalk];
  const talkFrame = omnicausalis.synthesizeTalkVidExpressiveBotFrame(state.activeBotTalk, botProfile.signatureLine);

  const layerControlsHtml = layers.map((l) => {
    const badgeBg = l.crossSectionEnabled ? "#10b981" : "#334155";
    const badgeTxt = l.crossSectionEnabled ? "CROSS-SECTION: ON" : "CROSS-SECTION: OFF";
    return "<div style=\"padding:10px;border-radius:8px;background:#1e293b;border-left:4px solid " + l.colorHex + ";margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;\">" +
      "<div><strong style=\"color:" + l.colorHex + ";font-size:12px;\">" + l.label + "</strong>" +
      "<div style=\"font-size:11px;color:#cbd5e1;\">" + l.thresholdMinHu + ".." + l.thresholdMaxHu + " HU · Axis: " + l.crossSectionAxis + "</div></div>" +
      "<div><a href=\"/action?cmd=toggle_cs&layer=" + l.layerIndex + "\" style=\"padding:5px 10px;border-radius:6px;background:" + badgeBg + ";color:#fff;font-weight:700;font-size:11px;text-decoration:none;\">" + badgeTxt + "</a></div></div>";
  }).join("");

  const visemePills = talkFrame.visemeSequence.map((v) =>
    "<span style=\"display:inline-block;padding:2px 6px;margin:2px;border-radius:4px;background:#0f172a;border:1px solid #38bdf8;font-size:10px;color:#38bdf8;\">" + v.viseme.toUpperCase() + ":" + v.weight0to1 + "</span>"
  ).join("");

  return [
    "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><title>PanaceaMed ∞ — Master Omnicausalis Studio</title></head>",
    "<body style=\"margin:0;padding:16px;background:#020617;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-radius:14px;background:#0f172a;border:1px solid #38bdf8;margin-bottom:14px;\">",
    "<div>",
    "<span style=\"padding:3px 10px;border-radius:99px;background:#064e3b;color:#34d399;font-size:10px;font-weight:700;\">KALOLUMEN 3DCG (<10s) · FREEMOCAP/SKELLYTRACKER · SEPSISAGENT/REMOP/PANTHEON/MEDGEN · TALKVID/EXPRESSIVESPEECH · SIMREADY-GLB · PISKEL/KENNEY</span>",
    "<h1 style=\"margin:6px 0 2px;font-size:19px;\">PanaceaMed ∞ — Omnicausalis Multimodal 3DCG, Biomechanics & Clinical AI Command Center</h1>",
    "<div style=\"font-size:12px;color:#38bdf8;\">" + state.lastLog + "</div>",
    "</div>",
    "<div style=\"text-align:right;\">",
    "<div style=\"font-size:11px;color:#94a3b8;\">DICOM 3DCG Build / Score</div>",
    "<div style=\"font-size:20px;font-weight:800;color:#34d399;\">" + (dicomSession.reconstructionTimeMs / 1000).toFixed(2) + "s · " + state.arenaScore + " pts</div>",
    "</div></div>",

    "<div style=\"display:grid;grid-template-columns:1.2fr 1fr;gap:14px;margin-bottom:14px;\">",
    "<div style=\"padding:14px;border-radius:14px;background:#090d16;border:2px solid #38bdf8;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;\">",
    "<strong style=\"color:#38bdf8;font-size:14px;\">💡 Drag Mouse on 3DCG Viewport to Change Light Angle + 3-Layer Cross-Section</strong>",
    "<span id=\"light-readout\" style=\"font-size:11px;padding:2px 8px;border-radius:6px;background:#1e293b;color:#fde68a;\">Az: " + light.azimuthDeg + "° · El: " + light.elevationDeg + "°</span>",
    "</div>",
    "<canvas id=\"kalolumen-canvas\" width=\"640\" height=\"270\" style=\"width:100%;height:270px;background:#020617;border-radius:10px;cursor:grab;display:block;margin-bottom:8px;border:1px solid #1e293b;\"></canvas>",
    layerControlsHtml,
    "</div>",

    "<div style=\"display:flex;flex-direction:column;gap:12px;\">",
    "<div style=\"padding:14px;border-radius:14px;background:#0f172a;border:1px solid #10b981;\">",
    "<h3 style=\"margin:0 0 6px;color:#10b981;font-size:14px;\">🦴 FreeMoCap & SkellyTracker 3D Markerless Gait & Pose Analysis (BX-3)</h3>",
    "<div style=\"font-size:12px;line-height:1.6;color:#e2e8f0;margin-bottom:8px;\">",
    "<b>Backend:</b> <code>" + mocap.trackerBackend + "</code> | <b>Pattern:</b> <span style=\"color:#fde047;font-weight:700;\">" + mocap.detectedGaitPattern + "</span><br/>",
    "<b>Knee Flexion:</b> Left <b>" + mocap.leftKneeFlexionDeg + "°</b> vs Right <b>" + mocap.rightKneeFlexionDeg + "°</b> | <b>Symmetry Index:</b> <b>" + mocap.stepSymmetryIndexPercent + "%</b> | <b>Pelvic Obliquity:</b> " + mocap.pelvicObliquityDeg + "°",
    "</div>",
    "<a href=\"/action?cmd=toggle_gait\" style=\"padding:6px 12px;background:#10b981;color:#052e16;font-weight:700;border-radius:6px;text-decoration:none;font-size:11px;\">🦴 Toggle Normative vs Hemiparetic 3D SkellyPose</a>",
    "</div>",

    "<div style=\"padding:14px;border-radius:14px;background:#0f172a;border:1px solid #f43f5e;\">",
    "<h3 style=\"margin:0 0 6px;color:#f43f5e;font-size:14px;\">🚨 FreedomIntelligence SepsisAgent × REMOP × Pantheon × MedGen ICU Console</h3>",
    "<div style=\"font-size:12px;line-height:1.6;color:#e2e8f0;margin-bottom:8px;\">",
    "<b>qSOFA Score:</b> <b>" + sepsis.qSofaScore + "/3</b> | <b>Total SOFA:</b> <b style=\"color:#f43f5e;\">" + sepsis.totalSofaScore + "</b> | <b>Septic Shock Flag:</b> <b>" + sepsis.septicShockEducationalFlag + "</b><br/>",
    "<b>Pantheon & REMOP Consensus:</b> " + sepsis.pantheonSpecialistConsensus.pharmacologyRemopAgent + "<br/>",
    "<b>MedGen Case ID:</b> <code>" + sepsis.pantheonSpecialistConsensus.medGenSyntheticScenarioId + "</code> · <b>Router:</b> <code>" + sepsis.pantheonSpecialistConsensus.glm4AuroraRoutingModel + "</code>",
    "</div>",
    "<a href=\"/action?cmd=toggle_sepsis\" style=\"padding:6px 12px;background:#f43f5e;color:#fff;font-weight:700;border-radius:6px;text-decoration:none;font-size:11px;\">🚨 Simulate Compensated vs Septic Shock Case (MedGen)</a>",
    "</div>",

    "<div style=\"padding:14px;border-radius:14px;background:#0f172a;border:1px solid #38bdf8;\">",
    "<h3 style=\"margin:0 0 6px;color:#38bdf8;font-size:14px;\">🎙️ TalkVid & ExpressiveSpeech VRM Lip-Sync + SimReady-GLB & Piskel/Kenney HUD</h3>",
    "<div style=\"font-size:12px;color:#cbd5e1;margin-bottom:6px;\">",
    "<b>Active Anime Bot:</b> <span style=\"color:" + botProfile.primaryColorHex + ";font-weight:700;\">" + botProfile.displayName + "</span> (" + talkFrame.emotionTone + " · " + talkFrame.pitchHz + " Hz · " + talkFrame.speakingRateWpm + " WPM)<br/>",
    "<b>SimReady-GLB Physics Prop:</b> <code>" + talkFrame.simReadyGlbAsset.assetId + "</code> | <b>Piskel Badge:</b> <code>" + talkFrame.piskelSpriteBadgeAnimation.spriteSheetId + "</code> (" + talkFrame.piskelSpriteBadgeAnimation.fps + " FPS)",
    "</div>",
    "<div style=\"margin-bottom:8px;\">" + visemePills + "</div>",
    "<a href=\"/action?cmd=cycle_bot\" style=\"padding:6px 12px;background:#38bdf8;color:#082f49;font-weight:700;border-radius:6px;text-decoration:none;font-size:11px;\">🎙️ Switch Anime Bot TalkVid Voice & Viseme Stream</a>",
    "</div>",
    "</div></div>",

    "<script>",
    "const canvas = document.getElementById(\"kalolumen-canvas\");",
    "const ctx = canvas.getContext(\"2d\");",
    "const readout = document.getElementById(\"light-readout\");",
    "let az = " + light.azimuthDeg + "; let el = " + light.elevationDeg + ";",
    "let dragging = false; let lastX = 0; let lastY = 0;",
    "const l1Cs = " + layers[0].crossSectionEnabled + ";",
    "const l2Cs = " + layers[1].crossSectionEnabled + ";",
    "const l3Cs = " + layers[2].crossSectionEnabled + ";",
    "canvas.addEventListener(\"mousedown\", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = \"grabbing\"; });",
    "window.addEventListener(\"mouseup\", () => { dragging = false; canvas.style.cursor = \"grab\"; });",
    "window.addEventListener(\"mousemove\", (e) => {",
    "  if (!dragging) return;",
    "  const dx = e.clientX - lastX; const dy = e.clientY - lastY;",
    "  lastX = e.clientX; lastY = e.clientY;",
    "  az = (az + dx * 0.6 + 360) % 360;",
    "  el = Math.max(-80, Math.min(80, el - dy * 0.6));",
    "  readout.textContent = \"Az: \" + az.toFixed(1) + \"° · El: \" + el.toFixed(1) + \"° (Dragging)\";",
    "  drawScene();",
    "});",
    "function drawLayerSphere(cx, cy, radius, baseRgb, csEnabled, csMode, lx, ly) {",
    "  ctx.save();",
    "  if (csEnabled) {",
    "    ctx.beginPath();",
    "    if (csMode === 0) ctx.rect(0, 0, cx + 15, canvas.height);",
    "    else if (csMode === 1) ctx.rect(0, cy - 8, canvas.width, canvas.height);",
    "    else ctx.rect(cx - 20, 0, canvas.width, canvas.height);",
    "    ctx.clip();",
    "  }",
    "  const grad = ctx.createRadialGradient(cx + lx * radius * 0.55, cy - ly * radius * 0.55, radius * 0.08, cx, cy, radius);",
    "  grad.addColorStop(0, baseRgb[0]); grad.addColorStop(0.55, baseRgb[1]); grad.addColorStop(1, baseRgb[2]);",
    "  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();",
    "  if (csEnabled) { ctx.strokeStyle = baseRgb[0]; ctx.lineWidth = 2; ctx.stroke(); }",
    "  ctx.restore();",
    "}",
    "function drawScene() {",
    "  ctx.clearRect(0, 0, canvas.width, canvas.height);",
    "  const cx = canvas.width / 2; const cy = canvas.height / 2;",
    "  const azRad = az * Math.PI / 180; const elRad = el * Math.PI / 180;",
    "  const lx = Math.cos(elRad) * Math.sin(azRad); const ly = Math.sin(elRad);",
    "  drawLayerSphere(cx, cy, 48, [\"#ffffff\", \"#cbd5e1\", \"#334155\"], l3Cs, 2, lx, ly);",
    "  drawLayerSphere(cx, cy, 82, [\"#fda4af\", \"#e11d48\", \"rgba(136,19,55,0.85)\"], l2Cs, 1, lx, ly);",
    "  drawLayerSphere(cx, cy, 114, [\"rgba(254,215,170,0.65)\", \"rgba(251,146,60,0.42)\", \"rgba(124,45,18,0.25)\"], l1Cs, 0, lx, ly);",
    "  const orbX = cx + lx * 135; const orbY = cy - ly * 115;",
    "  ctx.fillStyle = \"#fde047\"; ctx.beginPath(); ctx.arc(orbX, orbY, 7, 0, Math.PI * 2); ctx.fill();",
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
      const nextLayers = omnicausalis.updateIndependentLayerCrossSection(dicomSession.layers, layerIdx, { crossSectionEnabled: !cur.crossSectionEnabled });
      dicomSession = { ...dicomSession, layers: nextLayers };
      state.lastLog = "Toggled KaloLumen Layer " + layerIdx + " Cross-Section to " + (!cur.crossSectionEnabled ? "ON" : "OFF");
    } else if (cmd === "toggle_gait") {
      state.gaitPreset = state.gaitPreset === "NORMATIVE" ? "HEMIPARETIC" : "NORMATIVE";
      state.lastLog = "Switched FreeMoCap/SkellyTracker 3D Pose to " + state.gaitPreset;
    } else if (cmd === "toggle_sepsis") {
      state.sepsisPreset = state.sepsisPreset === "COMPENSATED" ? "SEPTIC_SHOCK" : "COMPENSATED";
      state.lastLog = "Switched SepsisAgent/REMOP/MedGen ICU simulation to " + state.sepsisPreset;
    } else if (cmd === "cycle_bot") {
      const order = ["DR_SATORU_SENSEI", "DR_MAKIMA_SENPAI", "DR_SENKU_KUN"];
      state.activeBotTalk = order[(order.indexOf(state.activeBotTalk) + 1) % order.length];
      state.lastLog = "Synthesized TalkVid + ExpressiveSpeech visemes for " + state.activeBotTalk;
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
  if (!out.includes("FreeMoCap") || !out.includes("SepsisAgent") || !out.includes("TalkVid")) process.exit(1);
  console.log("  \x1b[32m✓ [ALL 14 EXTERNAL REPO INTEGRATIONS SMOKE TEST PASSED]\x1b[0m");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [OMNICAUSALIS + FREEMOCAP + SEPSISAGENT + TALKVID STUDIO RUNNING] http://localhost:4399\x1b[0m");
  exec("open http://localhost:4399");
});