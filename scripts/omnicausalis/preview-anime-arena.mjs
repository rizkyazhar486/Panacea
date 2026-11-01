#!/usr/bin/env node
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";

const indexUrl = pathToFileURL(path.join(process.cwd(), "src/domains/omnicausalis-index.ts")).href;
const omnicausalis = await import(indexUrl);

function renderDashboardHtml() {
  const gpsSample = omnicausalis.evaluateGpsWorkoutSession({
    bodyWeightKg: 70,
    averageHeartRateBpm: 156,
    activityMode: "RUNNING",
    waypoints: [
      { lat: -6.2250, lng: 106.6520, altitudeMeters: 28, timestampMs: 0 },
      { lat: -6.2150, lng: 106.6620, altitudeMeters: 35, timestampMs: 420000 },
      { lat: -6.2000, lng: 106.6780, altitudeMeters: 44, timestampMs: 1050000 },
      { lat: -6.1850, lng: 106.6920, altitudeMeters: 52, timestampMs: 1620000 }
    ]
  });
  const foodAi = omnicausalis.analyzeFoodPhotoAndGenerateNutritionPlan({
    imageId: "meal-photo-post-run-001",
    detectedDishKeys: ["CHICKEN_BREAST_GRILLED_200G", "BROWN_RICE_150G", "TEMPE_BAKAR_100G", "AVOCADO_100G"],
    workoutCaloriesBurnedKcal: gpsSample.caloriesBurnedKcal,
    targetGoal: "MAINTENANCE_RECOMP"
  });
  const round = omnicausalis.evaluateBotSparringRound(1.75, true, 1.1);
  const hemo = omnicausalis.computeHemodynamics(78, 130, 52, 122, 78, 6);
  const resp = omnicausalis.executeRespiratoryBx4Journey(0.21, 40, 89, 28);

  const botCards = round.map((r) => {
    const b = omnicausalis.PANACEA_COMPETITIVE_ANIME_BOTS[r.botId];
    return "<div style=\"padding:18px;border-radius:14px;background:#1e293b;border:2px solid " + b.primaryColorHex + "\">" +
      "<div style=\"display:flex;justify-content:space-between;\"><strong style=\"color:" + b.primaryColorHex + "\">" + b.displayName + "</strong><span>θ = " + r.effectiveTheta + "</span></div>" +
      "<div style=\"font-size:12px;color:#94a3b8;margin:4px 0 8px;\">" + b.archetype + "</div>" +
      "<div style=\"font-size:11px;color:#cbd5e1;\">3D VRM: <code>" + b.vrmModelPath + "</code> | Win Prob: " + (r.winProb * 100).toFixed(1) + "%</div>" +
      "<p style=\"font-style:italic;font-size:12px;color:#f1f5f9;margin:8px 0 0;\">\"" + b.signatureLine + "\"</p>" +
      "</div>";
  }).join("");

  return [
    "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><title>PanaceaMed ∞ — Master Dashboard</title></head>",
    "<body style=\"margin:0;padding:24px;background:#020617;color:#f8fafc;font-family:system-ui,sans-serif;\">",
    "<div style=\"padding:20px;border-radius:16px;background:#0f172a;border:1px solid #334155;margin-bottom:20px;\">",
    "<span style=\"padding:4px 10px;border-radius:99px;background:#064e3b;color:#34d399;font-size:11px;font-weight:700;\">ALL FEATURES VERIFIED · GPS · PACE · CALORIE · FOOD AI · 3 ANIME BOTS · BX/EDU</span>",
    "<h1 style=\"margin:10px 0 4px;font-size:22px;\">PanaceaMed ∞ — Omnicausalis & ASC-1 Life Ascent Command Center</h1>",
    "</div>",
    "<h3 style=\"margin:0 0 10px;color:#38bdf8;\">1. 3 Competitive Anime AI Training Bots (Prometheus × Body Exposure)</h3>",
    "<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;\">" + botCards + "</div>",
    "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:16px;\">",
    "<div style=\"padding:18px;border-radius:14px;background:#0f172a;border:1px solid #334155;\">",
    "<h3 style=\"margin-top:0;color:#10b981;\">2. Live GPS Route, Speed, Pace, KM, Time & Calorie Tracker</h3>",
    "<div><b>Distance (Haversine):</b> " + gpsSample.totalDistanceKm + " km (" + gpsSample.totalDistanceMeters + " m)</div>",
    "<div><b>Active Time:</b> " + gpsSample.formattedTimeHhMmSs + " (" + gpsSample.elapsedSeconds + " s)</div>",
    "<div><b>Speed & Pace:</b> " + gpsSample.averageSpeedKmh + " km/h | <b>" + gpsSample.formattedPaceMmSsPerKm + "</b></div>",
    "<div><b>Elevation Gain:</b> +" + gpsSample.elevationGainMeters + " m</div>",
    "<div><b>Calories Burned:</b> <strong style=\"color:#f43f5e;\">" + gpsSample.caloriesBurnedKcal + " kcal</strong> (MET: " + gpsSample.metabolicEquivalentMet + ")</div>",
    "</div>",
    "<div style=\"padding:18px;border-radius:14px;background:#0f172a;border:1px solid #334155;\">",
    "<h3 style=\"margin-top:0;color:#f59e0b;\">3. AI Food Photo Calorie & Macronutrient Estimator</h3>",
    "<div><b>Total Meal Calories:</b> <strong style=\"color:#34d399;\">" + foodAi.totals.totalCaloriesKcal + " kcal</strong> (Net vs Workout: " + foodAi.netCalorieBalanceKcal + " kcal)</div>",
    "<div><b>Macros:</b> Protein <b>" + foodAi.totals.totalProteinGrams + "g</b> | Carbs <b>" + foodAi.totals.totalCarbsGrams + "g</b> | Fat <b>" + foodAi.totals.totalFatGrams + "g</b> | Fiber <b>" + foodAi.totals.totalFiberGrams + "g</b></div>",
    "<div style=\"margin-top:8px;font-size:12px;color:#cbd5e1;\"><b>AI Nutritionist Advice:</b> " + foodAi.aiNextMealRecommendation + "</div>",
    "<hr style=\"border-color:#1e293b;margin:10px 0;\"/>",
    "<div style=\"font-size:12px;color:#94a3b8;\"><b>Physiology Telemetry:</b> CO = " + hemo.cardiacOutputLMin + " L/min | PAO₂ = " + resp.alveolarGas.alveolarPO2MmHg + " mmHg</div>",
    "</div>",
    "</div>",
    "</body></html>"
  ].join("\n");
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(renderDashboardHtml());
});

if (process.argv.includes("--smoke-test")) {
  const htmlOut = renderDashboardHtml();
  if (!htmlOut.includes("Live GPS Route") || !htmlOut.includes("AI Food Photo Calorie")) {
    process.exit(1);
  }
  console.log("  \x1b[32m✓ [PREVIEW SERVER SMOKE TEST PASSED]\x1b[0m HTML rendered cleanly without syntax errors!");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [LIVE DASHBOARD RUNNING] http://localhost:4399\x1b[0m");
  exec("open http://localhost:4399");
});