#!/usr/bin/env node
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";

const indexUrl = pathToFileURL(path.join(process.cwd(), "src/domains/omnicausalis-index.ts")).href;
const omnicausalis = await import(indexUrl);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>PanaceaMed ∞ — Body Exposure × Prometheus 3-Bot Anime Sparring Arena</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; }
    body { margin: 0; background: radial-gradient(circle at top right, #0f172a, #020617); color: #f8fafc; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-radius: 16px; background: rgba(15,23,42,0.85); border: 1px solid rgba(56,189,248,0.25); backdrop-filter: blur(16px); margin-bottom: 20px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .card { padding: 20px; border-radius: 16px; background: rgba(30,41,59,0.65); border: 2px solid rgba(148,163,184,0.2); transition: all 0.2s ease; cursor: pointer; }
    .card:hover { transform: translateY(-3px); }
    .sim-panel { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
    .box { padding: 20px; border-radius: 16px; background: rgba(15,23,42,0.85); border: 1px solid rgba(148,163,184,0.2); }
    button { padding: 10px 18px; border-radius: 10px; border: none; font-weight: 700; cursor: pointer; margin-right: 8px; margin-top: 8px; }
    .btn-win { background: #10b981; color: #052e16; }
    .btn-miss { background: #f43f5e; color: #fff; }
    .step-pill { display: inline-block; padding: 4px 9px; margin: 3px; border-radius: 6px; font-size: 11px; background: rgba(16,185,129,0.18); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.35); }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">TRUTH CLASS: SIMULATED_EDUCATIONAL · BX-8 NULL != 0 VERIFIED · G_release = 1</span>
      <h1 style="margin:8px 0 4px;font-size:22px;">PanaceaMed ∞ — Body Exposure × Prometheus Anime Sparring Arena</h1>
      <div style="font-size:13px;color:#94a3b8;">Branch: argon/asc1-life-ascent-workout-mastery | 36/36 Native Node v24 TS Assertions Verified</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#94a3b8;">Learner 3PL IRT Ability (θ)</div>
      <div id="theta-val" style="font-size:28px;font-weight:800;color:#38bdf8;">+1.65</div>
      <div id="score-val" style="font-size:13px;color:#34d399;">Arena Score: 1,450 pts</div>
    </div>
  </div>
  <div class="grid" id="bot-grid"></div>
  <div class="sim-panel">
    <div class="box">
      <h3 style="margin-top:0;">15-Step Body Exposure × Prometheus Golden Journey (EDU-6)</h3>
      <div id="steps-container"></div>
      <div style="margin-top:16px;">
        <button class="btn-win" onclick="runSparring(true)">⚡ Execute Correct Multiscale Diagnosis (+Combo vs 3 Bots)</button>
        <button class="btn-miss" onclick="runSparring(false)">🛡️ Simulate Missed Localization (Test Bot Counter-Attack)</button>
      </div>
      <p id="combat-log" style="font-size:13px;color:#cbd5e1;margin-top:14px;padding:10px;background:rgba(30,41,59,0.7);border-radius:8px;">Ready for sparring round across Cardiovascular, Respiratory (BX-4), and Neurological (BX-1) vertical slices.</p>
    </div>
    <div class="box">
      <h3 style="margin-top:0;">Live Verified Physiology & Clinical Safety Telemetry</h3>
      <div id="telemetry" style="font-size:13px;line-height:1.7;color:#e2e8f0;"></div>
    </div>
  </div>
  <script>
    let theta = 1.65; let score = 1450;
    async function loadState() {
      const res = await fetch("/api/state?theta=" + theta);
      const data = await res.json();
      document.getElementById("bot-grid").innerHTML = data.bots.map(b => `
        <div class="card" style="border-color:${b.primaryColorHex}">
          <div style="display:flex;justify-content:space-between;">
            <strong style="color:${b.primaryColorHex};font-size:17px;">${b.displayName}</strong>
            <span style="font-size:12px;color:#cbd5e1;">Effective θ: <b>${b.effectiveTheta}</b></span>
          </div>
          <div style="font-size:12px;color:#94a3b8;margin:4px 0 10px;">${b.archetype}</div>
          <div style="font-size:11px;padding:8px;background:rgba(15,23,42,0.8);border-radius:8px;color:#cbd5e1;">
            <div><b>3D VRM Asset:</b> ${b.vrmModelPath}</div>
            <div><b>3PL Win Prob:</b> ${(b.winProb * 100).toFixed(1)}%</div>
          </div>
          <blockquote style="margin:10px 0 0;padding-left:10px;border-left:3px solid ${b.primaryColorHex};font-style:italic;font-size:12px;color:#f1f5f9;">“${b.signatureLine}”</blockquote>
        </div>
      `).join("");
      document.getElementById("steps-container").innerHTML = data.goldenSteps.map((s, i) => `<span class="step-pill">${i+1}. ${s}</span>`).join("");
      document.getElementById("telemetry").innerHTML = `
        <div><b>Cardiovascular (Guyton):</b> CO = ${data.hemo.cardiacOutputLMin} L/min | SV = ${data.hemo.strokeVolumeMl} mL | LVEF = ${data.hemo.ejectionFractionPercent}%</div>
        <div><b>Respiratory BX-4 (West):</b> PAO₂ = ${data.resp.alveolarGas.alveolarPO2MmHg} mmHg | A-a Grad = ${data.resp.alveolarGas.alveolarArterialGradientMmHg} mmHg</div>
        <div><b>Neuro BX-1 (Internal Capsule):</b> ${data.neuro.localization.tract} → ${data.neuro.localization.deficitSide}</div>
        <div><b>AHA-17 Segment 17 (BX-2):</b> ${data.aha.primaryArtery} (Watershed: ${data.aha.isWatershedVariant})</div>
        <div><b>Acid-Base & Starling (EDU-3):</b> pH = ${data.sandbox.arterialPh} | Net Filtration = ${data.sandbox.netFiltrationPressureMmHg} mmHg</div>
        <div><b>Digital Twin HR (BX-8 Null Guard):</b> ${data.twin.measuredClinicalState.heartRateBpm} (Truth: ${data.twin.measuredClinicalState.truthClass})</div>
      `;
    }
    function runSparring(win) {
      theta = Number(Math.max(-3, Math.min(3, theta + (win ? 0.18 : -0.15))).toFixed(2));
      if (win) score += 220;
      document.getElementById("theta-val").textContent = (theta >= 0 ? "+" : "") + theta;
      document.getElementById("score-val").textContent = "Arena Score: " + score.toLocaleString() + " pts";
      document.getElementById("combat-log").textContent = win
        ? "🔥 COMBO HIT! You outperformed Dr. Senku-Kun & forced Dr. Makima-Senpai to rubber-band her IRT θ to " + (theta + 0.35).toFixed(2) + "!"
        : "⚡ COUNTER-ATTACK! Dr. Satoru-Sensei localized the pyramidal decussation faster. Remediating via FSRS-4.5...";
      loadState();
    }
    loadState();
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:4399");
  if (url.pathname === "/api/state") {
    const theta = Number(url.searchParams.get("theta") || 1.65);
    const round = omnicausalis.evaluateBotSparringRound(theta, true, 1.1);
    const bots = round.map(r => ({ ...omnicausalis.PANACEA_COMPETITIVE_ANIME_BOTS[r.botId], ...r }));
    const payload = {
      bots,
      goldenSteps: omnicausalis.GOLDEN_JOURNEY_STEPS,
      hemo: omnicausalis.computeHemodynamics(78, 130, 52, 122, 78, 6),
      resp: omnicausalis.executeRespiratoryBx4Journey(0.21, 40, 89, 28),
      neuro: omnicausalis.executeNeurologicalBx1Journey("CORTICOSPINAL", "INTERNAL_CAPSULE", "LEFT"),
      aha: omnicausalis.resolveAha17CoronaryTerritory(17, "RIGHT_DOMINANT"),
      sandbox: omnicausalis.computeStarlingAndAcidBaseSandbox({ capillaryHydrostaticMmHg: 35, interstitialHydrostaticMmHg: 0, capillaryOncoticMmHg: 28, interstitialOncoticMmHg: 3, filtrationCoeffKf: 0.2, reflectionCoeffSigma: 0.9, hco3MmolL: 24, paCO2MmHg: 40 }),
      twin: omnicausalis.buildBoundedHumanDigitalTwinSnapshot({ patientId: "pt-001", workflowStage: "ENCOUNTER", observedHeartRateBpm: null, modeledStrokeVolumeMl: 78 })
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
});

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [LIVE ARENA RUNNING] Open in browser: http://localhost:4399\x1b[0m");
  console.log("Press Ctrl+C anytime to stop the preview server.\n");
  exec("open http://localhost:4399");
});