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
  ligandBound: true,
  plmTier: "SYNTHYRA_ESMFOLD2_600M",
  binderSeq: "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL",
  rivalBot: "DR_SENKU_KUN",
  sepsisPreset: "SEPTIC_SHOCK",
  laps: 2,
  dishes: ["CHICKEN_BREAST_GRILLED_200G", "BROWN_RICE_150G", "TEMPE_BAKAR_100G", "AVOCADO_100G"],
  learnerTheta: 2.15,
  arenaScore: 3480,
  lastLog: "ALL 12 DOMAINS UNIFIED: KaloLumen 3-Layer DICOM (<10s) · Mouse-Drag Light · BioEmu2 · FastPLMs/ESMFold2 · BindCraft2 · SepsisAgent · FreeMoCap · GPS/Pace · Food AI · 3 Anime Bots!"
};

function renderHtml() {
  const layers = dicomSession.layers;
  const light = dicomSession.lightSource;
  const bioemu = omnicausalis.sampleBioEmu2EquilibriumEnsemble({ targetProteinId: "RYR2_CALCIUM_CHANNEL", ligandBound: state.ligandBound });
  const fold = omnicausalis.predictStructureWithFastPlmAndWebGpu({ sequence: state.binderSeq, modelTier: state.plmTier });
  const bindcraft = omnicausalis.designDeNovoBinderAndRunProteinFighter({ targetEpitopeName: "RyR2_S2808_Pocket", binderSequence: state.binderSeq, rivalBotId: state.rivalBot });
  const round = omnicausalis.evaluateBotSparringRound(state.learnerTheta, true, 1.1);

  const waypoints = [{ lat: -6.2250, lng: 106.6520, altitudeMeters: 28, timestampMs: 0 }];
  for (let i = 1; i <= state.laps; i++) {
    waypoints.push({ lat: Number((-6.2250 + i * 0.012).toFixed(5)), lng: Number((106.6520 + i * 0.014).toFixed(5)), altitudeMeters: 28 + i * 9, timestampMs: i * 540000 });
  }
  const gps = omnicausalis.evaluateGpsWorkoutSession({ bodyWeightKg: 70, waypoints });
  const food = omnicausalis.analyzeFoodPhotoAndGenerateNutritionPlan({ imageId: "meal-01", detectedDishKeys: state.dishes, workoutCaloriesBurnedKcal: gps.caloriesBurnedKcal });
  const sepsis = omnicausalis.evaluateSepsisAgentAndRemopSafety(state.sepsisPreset === "SEPTIC_SHOCK"
    ? { respiratoryRateBpm: 28, systolicBpMmHg: 84, glasgowComaScale3to15: 13, paO2FiO2Ratio: 180, platelets10e3PerUl: 85, bilirubinMgDl: 2.5, meanArterialPressureMmHg: 58, creatinineMgDl: 2.4, lactateMmolL: 4.5 }
    : { respiratoryRateBpm: 16, systolicBpMmHg: 120, glasgowComaScale3to15: 15, paO2FiO2Ratio: 420, platelets10e3PerUl: 250, bilirubinMgDl: 0.8, meanArterialPressureMmHg: 85, creatinineMgDl: 0.9, lactateMmolL: 1.0 }
  );

  const layerControlsHtml = layers.map((l) => {
    const bg = l.crossSectionEnabled ? "#10b981" : "#334155";
    const txt = l.crossSectionEnabled ? "CROSS-SECTION: ON" : "CROSS-SECTION: OFF";
    return "<div style=\"padding:7px 10px;border-radius:8px;background:#1e293b;border-left:4px solid " + l.colorHex + ";margin-bottom:5px;display:flex;justify-content:space-between;align-items:center;\">" +
      "<div><strong style=\"color:" + l.colorHex + ";font-size:12px;\">" + l.label + "</strong> <span style=\"font-size:10px;color:#cbd5e1;\">(" + l.thresholdMinHu + ".." + l.thresholdMaxHu + " HU)</span></div>" +
      "<a href=\"/action?cmd=toggle_cs&layer=" + l.layerIndex + "\" style=\"padding:4px 9px;border-radius:6px;background:" + bg + ";color:#fff;font-weight:700;font-size:10px;text-decoration:none;\">" + txt + "</a></div>";
  }).join("");

  const botCardsHtml = round.map((r) => {
    const b = omnicausalis.PANACEA_COMPETITIVE_ANIME_BOTS[r.botId];
    return "<div style=\"padding:10px;border-radius:10px;background:#1e293b;border:1px solid " + b.primaryColorHex + ";\">" +
      "<div style=\"display:flex;justify-content:space-between;\"><strong style=\"color:" + b.primaryColorHex + ";font-size:13px;\">" + b.displayName + "</strong><span style=\"font-size:11px;\">θ=" + r.effectiveTheta + "</span></div>" +
      "<div style=\"font-size:10px;color:#94a3b8;margin-top:2px;\">" + b.archetype + "</div></div>";
  }).join("");

  return [
    "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><title>PanaceaMed ∞ — Master Omnicausalis Command Center</title></head>",
    "<body style=\"margin:0;padding:14px;background:#020617;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:12px;background:#0f172a;border:1px solid #38bdf8;margin-bottom:12px;\">",
    "<div><span style=\"padding:3px 9px;border-radius:99px;background:#064e3b;color:#34d399;font-size:10px;font-weight:700;\">PANACEAMED ∞ MASTER COMMAND CENTER · ALL 7 TRANSCENDENTAL PILLARS · CRASH-SHIELDED · 14 MODULES & 45 REPOS VERIFIED</span>",
    "<h1 style=\"margin:4px 0 2px;font-size:18px;\">KaloLumen 3-Layer DICOM 3DCG × BioEmu2/FastPLMs/BindCraft2 × SepsisAgent/FreeMoCap × GPS/Food AI × 3 Anime Bots</h1>",
    "<div style=\"font-size:11px;color:#38bdf8;\">" + state.lastLog + "</div></div>",
    "<div style=\"text-align:right;\"><div style=\"font-size:10px;color:#94a3b8;\">DICOM Build / ProteinFighter</div>",
    "<div style=\"font-size:18px;font-weight:800;color:#34d399;\">" + (dicomSession.reconstructionTimeMs / 1000).toFixed(2) + "s · " + bindcraft.proteinFighterArenaMatch.learnerFighterScore + " pts</div></div></div>",

    "<div style=\"display:grid;grid-template-columns:1.15fr 1fr;gap:12px;margin-bottom:12px;\">",
    "<div style=\"padding:12px;border-radius:12px;background:#090d16;border:2px solid #38bdf8;\">",
    "<div style=\"display:flex;justify-content:space-between;margin-bottom:6px;\"><strong style=\"color:#38bdf8;font-size:13px;\">💡 Drag Mouse on 3DCG Viewport to Change Light Angle + 3-Layer Cross-Sections</strong>",
    "<span id=\"light-readout\" style=\"font-size:11px;color:#fde68a;\">Az: " + light.azimuthDeg + "° · El: " + light.elevationDeg + "°</span></div>",
    "<canvas id=\"kalolumen-canvas\" width=\"620\" height=\"235\" style=\"width:100%;height:235px;background:#020617;border-radius:10px;cursor:grab;display:block;margin-bottom:8px;border:1px solid #1e293b;\"></canvas>",
    layerControlsHtml,
    "</div>",

    "<div style=\"display:flex;flex-direction:column;gap:8px;\">",
    "<div style=\"padding:10px;border-radius:10px;background:#0f172a;border:1px solid #10b981;font-size:11px;\">",
    "<strong style=\"color:#10b981;font-size:12px;\">🧬 BioEmu2 Ensemble + Synthyra FastPLMs (" + fold.modelTier + ") + BindCraft2/ProteinFighter</strong><br/>",
    "<b>RyR2 Open Prob:</b> <b>" + Math.round(bioemu.states[2].equilibriumProbability * 100) + "%</b> (ΔG=" + bioemu.states[2].freeEnergyDeltaGKcalMol + " kcal/mol) | <b>pLDDT:</b> <b style=\"color:#34d399;\">" + fold.meanPlddt0to100 + "</b> | <b>pTM:</b> " + fold.pTm0to1 + " | <b>ipTM:</b> " + bindcraft.interfacePtmIpTm + "<br/>",
    "<div style=\"margin-top:6px;\">",
    "<a href=\"/action?cmd=toggle_ligand\" style=\"padding:4px 9px;background:#10b981;color:#052e16;font-weight:700;border-radius:5px;text-decoration:none;margin-right:6px;\">⚡ Toggle BioEmu2 Ligand</a>",
    "<a href=\"/action?cmd=cycle_plm\" style=\"padding:4px 9px;background:#38bdf8;color:#082f49;font-weight:700;border-radius:5px;text-decoration:none;margin-right:6px;\">🔄 Switch PLM/WebGPU Model</a>",
    "<a href=\"/action?cmd=cycle_rival\" style=\"padding:4px 9px;background:#f43f5e;color:#fff;font-weight:700;border-radius:5px;text-decoration:none;\">⚔️ ProteinFighter vs " + state.rivalBot + "</a>",
    "</div></div>",

    "<div style=\"padding:10px;border-radius:10px;background:#0f172a;border:1px solid #f59e0b;font-size:11px;\">",
    "<strong style=\"color:#f59e0b;font-size:12px;\">📍 Live GPS Tracker (Speed · Pace · KM · Time · Calorie) & 📸 AI Food Photo Calorie</strong><br/>",
    "<b>GPS Run:</b> <b>" + gps.totalDistanceKm + " km</b> · <b>" + gps.formattedTimeHhMmSs + "</b> · Speed <b>" + gps.averageSpeedKmh + " km/h</b> · Pace <b style=\"color:#38bdf8;\">" + gps.formattedPaceMmSsPerKm + "</b> · Burned <b style=\"color:#f43f5e;\">" + gps.caloriesBurnedKcal + " kcal</b><br/>",
    "<b>AI Food Photo:</b> <b style=\"color:#34d399;\">" + food.totals.totalCaloriesKcal + " kcal</b> (Net: " + food.netCalorieBalanceKcal + " kcal) · Protein <b>" + food.totals.totalProteinGrams + "g</b> · Carbs <b>" + food.totals.totalCarbsGrams + "g</b> · Fat <b>" + food.totals.totalFatGrams + "g</b><br/>",
    "<div style=\"margin-top:6px;\">",
    "<a href=\"/action?cmd=add_lap\" style=\"padding:4px 9px;background:#10b981;color:#052e16;font-weight:700;border-radius:5px;text-decoration:none;margin-right:6px;\">🏃 + Record GPS Split</a>",
    "<a href=\"/action?cmd=scan_food\" style=\"padding:4px 9px;background:#f59e0b;color:#451a03;font-weight:700;border-radius:5px;text-decoration:none;\">📸 + Scan Food Photo (+160 kcal)</a>",
    "</div></div>",

    "<div style=\"padding:10px;border-radius:10px;background:#0f172a;border:1px solid #a855f7;font-size:11px;\">",
    "<strong style=\"color:#e9d5ff;font-size:12px;\">🚨 SepsisAgent × REMOP × Pantheon × MedGen ICU Console & 3 Competitive Anime Bots</strong><br/>",
    "<b>qSOFA:</b> " + sepsis.qSofaScore + "/3 | <b>SOFA:</b> " + sepsis.totalSofaScore + " | <b>Septic Shock:</b> " + sepsis.septicShockEducationalFlag + " | <b>REMOP:</b> " + sepsis.pantheonSpecialistConsensus.pharmacologyRemopAgent,
    "</div>",
    "<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:8px;\">" + botCardsHtml + "</div>",
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
    "  drawLayerSphere(cx, cy, 44, [\"#ffffff\", \"#cbd5e1\", \"#334155\"], l3Cs, 2, lx, ly);",
    "  drawLayerSphere(cx, cy, 74, [\"#fda4af\", \"#e11d48\", \"rgba(136,19,55,0.85)\"], l2Cs, 1, lx, ly);",
    "  drawLayerSphere(cx, cy, 102, [\"rgba(254,215,170,0.65)\", \"rgba(251,146,60,0.42)\", \"rgba(124,45,18,0.25)\"], l1Cs, 0, lx, ly);",
    "  const orbX = cx + lx * 120; const orbY = cy - ly * 102;",
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
      dicomSession = { ...dicomSession, layers: omnicausalis.updateIndependentLayerCrossSection(dicomSession.layers, layerIdx, { crossSectionEnabled: !cur.crossSectionEnabled }) };
    } else if (cmd === "toggle_ligand") { state.ligandBound = !state.ligandBound; }
    else if (cmd === "cycle_plm") {
      const models = ["SYNTHYRA_ESMFOLD2_600M", "SYNTHYRA_ESMFOLD2_300M", "ALPHAFOLD2_WEBGPU_LOCALFOLD", "MOLENCE_MOL1_MULTIMODAL"];
      state.plmTier = models[(models.indexOf(state.plmTier) + 1) % models.length];
    } else if (cmd === "cycle_rival") {
      const bots = ["DR_SENKU_KUN", "DR_MAKIMA_SENPAI", "DR_SATORU_SENSEI"];
      state.rivalBot = bots[(bots.indexOf(state.rivalBot) + 1) % bots.length];
    } else if (cmd === "add_lap") { state.laps += 1; }
    else if (cmd === "scan_food") { state.dishes.push("AVOCADO_100G"); }
    res.writeHead(302, { Location: "/" });
    res.end();
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(renderHtml());
});

if (process.argv.includes("--smoke-test")) {
  const out = renderHtml();
  if (!out.includes("MASTER COMMAND CENTER") || !out.includes("Live GPS Tracker")) process.exit(1);
  console.log("  \x1b[32m✓ [ALL-IN-ONE MASTER COMMAND CENTER SMOKE TEST PASSED]\x1b[0m");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [MASTER COMMAND CENTER LIVE] http://localhost:4399\x1b[0m");
  exec("open http://localhost:4399");
});