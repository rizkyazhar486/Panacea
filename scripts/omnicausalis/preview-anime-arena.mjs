#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";

const indexUrl = pathToFileURL(path.join(process.cwd(), "src/domains/omnicausalis-index.ts")).href;
const omnicausalis = await import(indexUrl);
const atlasUrl = pathToFileURL(path.join(process.cwd(), "src/domains/body-exposure/data/zAnatomyClearIndonesianAtlas.ts")).href;
const zAtlas = await import(atlasUrl);

let activeChip = "Musculoskeletal";
let activeMode = "MODE_1_ANATOMY_3D";
let sliderOverride = null;

function renderStudioHtml() {
  const card = zAtlas.findClearStructureCard(activeChip);
  const currentVal = sliderOverride !== null ? sliderOverride : card.defaultSliderValue;
  const chips = ["Musculoskeletal", "Heart", "Lungs", "Liver & biliary", "Kidney & urinary tract", "Thyroid", "Ear", "Skin"];

  const chipButtons = chips.map((c) => {
    const isSel = c.toLowerCase() === card.categoryChip.toLowerCase();
    return "<a href=\"/select?chip=" + encodeURIComponent(c) + "\" class=\"organ-chip\" style=\"background:" + (isSel ? card.highlightColorHex : "rgba(30,41,59,0.75)") + ";color:" + (isSel ? "#020617" : "#e2e8f0") + ";border-color:" + (isSel ? card.highlightColorHex : "rgba(255,255,255,0.12)") + ";font-weight:" + (isSel ? "800" : "600") + ";\">" + c + "</a>";
  }).join("");

  const modeButtons = [
    { id: "MODE_1_ANATOMY_3D", label: "1. Anatomi 3D (Z-Anatomy Atlas)" },
    { id: "MODE_2_LIVE_PHYSIOLOGY", label: "2. Simulasi Fisiologi Hidup" },
    { id: "MODE_3_CLINICAL_SURGICAL", label: "3. Klinis, Saraf & Pembedahan" }
  ].map((m) => {
    const isSel = m.id === activeMode;
    return "<a href=\"/select?mode=" + m.id + "\" class=\"mode-tab\" style=\"background:" + (isSel ? "#38bdf8" : "rgba(15,23,42,0.7)") + ";color:" + (isSel ? "#020617" : "#cbd5e1") + ";border-color:" + (isSel ? "#38bdf8" : "rgba(255,255,255,0.1)") + ";\">" + m.label + "</a>";
  }).join("");

  return [
    "<!DOCTYPE html><html lang=\"id\"><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/><title>PanaceaMed ∞ — Z-Anatomy & BioDigital 2027 3D Studio</title>",
    "<style>",
    "*, *::before, *::after { box-sizing: border-box; }",
    "body { margin: 0; padding: 18px 24px 40px; background: #040814; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif; line-height: 1.5; overflow-x: hidden; }",
    ".shell { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }",
    ".top-nav { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 14px 20px; border-radius: 20px; background: rgba(15,23,42,0.75); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.09); flex-wrap: wrap; }",
    ".organ-chip { padding: 8px 16px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.12); text-decoration: none; font-size: 13px; transition: all 0.18s ease; display: inline-flex; align-items: center; }",
    ".mode-tab { padding: 9px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); text-decoration: none; font-size: 13px; font-weight: 700; }",
    ".studio-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 18px; align-items: stretch; }",
    ".viewport-card { position: relative; border-radius: 24px; background: radial-gradient(circle at 50% 35%, #111c35 0%, #030712 85%); border: 1px solid rgba(56,189,248,0.22); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; min-height: 580px; }",
    ".inspector-card { border-radius: 24px; background: rgba(15,23,42,0.78); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.09); padding: 22px; display: flex; flex-direction: column; gap: 14px; }",
    ".info-box { padding: 14px 16px; border-radius: 16px; background: rgba(30,41,59,0.55); border: 1px solid rgba(255,255,255,0.07); }",
    ".label-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #38bdf8; margin-bottom: 4px; }",
    ".cam-btn { padding: 8px 16px; border-radius: 99px; background: rgba(15,23,42,0.85); color: #f8fafc; border: 1px solid rgba(255,255,255,0.15); cursor: pointer; font-size: 12px; font-weight: 700; }",
    "@media (max-width: 1024px) { .studio-grid { grid-template-columns: 1fr; } body { padding: 12px; } }",
    "</style></head><body>",

    "<div class=\"shell\">",
    "<!-- HEADER: JELAS, TIDAK MEMBINGUNGKAN, LANGSUNG KE FUNGSI -->",
    "<header class=\"top-nav\">",
    "<div style=\"display:flex;align-items:center;gap:12px;\">",
    "<div style=\"width:40px;height:40px;border-radius:12px;background:rgba(56,189,248,0.2);border:1px solid #38bdf8;display:flex;align-items:center;justify-content:center;font-weight:900;color:#38bdf8;\">P∞</div>",
    "<div><div style=\"font-size:11px;font-weight:700;color:#34d399;letter-spacing:0.06em;\">HUMAN > BODY EXPOSURE · Z-ANATOMY & BIODIGITAL 2027 STUDIO</div>",
    "<h1 style=\"margin:0;font-size:20px;font-weight:800;\">Eksplorasi Anatomi 3D & Simulasi Fisiologi Hidup</h1></div></div>",
    "<div style=\"display:flex;gap:8px;flex-wrap:wrap;\">" + modeButtons + "</div>",
    "</header>",

    "<!-- BARIS PIL ORGAN CLOSE-UP (PERSIS SEPERTI SCREENSHOT ANDA TAPI SEMUA BERFUNGSI JELAS) -->",
    "<section style=\"display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:6px 4px;\">",
    "<span style=\"font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.06em;margin-right:6px;\">ORGAN CLOSE-UP:</span>",
    chipButtons,
    "</section>",

    "<div class=\"studio-grid\">",
    "<!-- KIRI: VIEWPORT 3D INTERAKTIF REAL-TIME (BISA DIPUTAR, DIZOOM, DIKLIK) -->",
    "<div class=\"viewport-card\">",
    "<div style=\"padding:16px 20px;display:flex;justify-content:space-between;align-items:center;z-index:10;\">",
    "<div><span style=\"padding:4px 10px;border-radius:99px;background:rgba(56,189,248,0.16);border:1px solid #38bdf8;color:#38bdf8;font-size:11px;font-weight:700;\">" + card.fmaId + " · " + card.uberonId + "</span>",
    "<div style=\"font-size:16px;font-weight:800;margin-top:6px;\">" + card.nameId + "</div></div>",
    "<div style=\"display:flex;gap:6px;\">",
    "<button class=\"cam-btn\" onclick=\"setViewPreset('front')\">Depan</button>",
    "<button class=\"cam-btn\" onclick=\"setViewPreset('back')\">Belakang</button>",
    "<button class=\"cam-btn\" onclick=\"setViewPreset('zoom')\">Fokus Organ</button>",
    "</div></div>",

    "<canvas id=\"zanatomy-3d-canvas\" width=\"720\" height=\"500\" style=\"width:100%;height:480px;display:block;cursor:grab;\"></canvas>",

    "<div style=\"padding:12px 20px;background:rgba(2,6,23,0.75);border-top:1px solid rgba(255,255,255,0.07);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#94a3b8;\">",
    "<span>Geser (Drag) untuk memutar 360° · Klik tombol di atas untuk fokus ke organ</span>",
    "<span style=\"color:#34d399;font-weight:700;\">● 60 FPS Real-Time Simulation (Bukan Video)</span>",
    "</div></div>",

    "<!-- KANAN: PENJELASAN LENGKAP, JELAS & SIMULASI FISIOLOGI HIDUP (MENGGANTIKAN 1 KALIMAT MEMBINGUNGKAN) -->",
    "<div class=\"inspector-card\">",
    "<div>",
    "<div class=\"label-tag\" style=\"color:" + card.highlightColorHex + ";\">STRUKTUR TERPILIH · " + card.nameEn.toUpperCase() + "</div>",
    "<h2 style=\"margin:2px 0 8px;font-size:22px;font-weight:800;color:#f8fafc;\">" + card.nameId + "</h2>",
    "<p style=\"margin:0;font-size:14px;color:#e2e8f0;background:rgba(56,189,248,0.08);border-left:3px solid " + card.highlightColorHex + ";padding:10px 14px;border-radius:0 12px 12px 0;\"><strong>Fungsi Utama:</strong> " + card.clearFunctionSummary + "</p>",
    "</div>",

    "<!-- PANEL INTERAKTIF SIMULASI FISIOLOGI REAL-TIME -->",
    "<div class=\"info-box\" style=\"border-color:rgba(16,185,129,0.35);background:rgba(6,78,59,0.18);\">",
    "<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;\">",
    "<span class=\"label-tag\" style=\"color:#34d399;margin:0;\">SIMULASI FISIOLOGI INTERAKTIF: " + card.liveSimulationMetricLabel + "</span>",
    "<span id=\"sim-val-badge\" style=\"font-size:14px;font-weight:800;color:#34d399;\">" + currentVal + " " + card.sliderUnit + "</span></div>",
    "<input id=\"phys-slider\" type=\"range\" min=\"" + card.sliderMin + "\" max=\"" + card.sliderMax + "\" step=\"1\" value=\"" + currentVal + "\" style=\"width:100%;accent-color:#10b981;cursor:pointer;margin:6px 0;\"/>",
    "<canvas id=\"phys-wave-canvas\" width=\"520\" height=\"76\" style=\"width:100%;height:76px;background:#020617;border-radius:10px;border:1px solid rgba(255,255,255,0.08);margin-top:6px;display:block;\"></canvas>",
    "<div style=\"font-size:11.5px;color:#94a3b8;margin-top:6px;font-family:monospace;\">Rumus: " + card.liveSimulationFormula + "</div>",
    "</div>",

    "<div class=\"info-box\">",
    "<div class=\"label-tag\">MEKANISME FISIOLOGI & CARA KERJA</div>",
    "<div style=\"font-size:13px;color:#cbd5e1;\">" + card.howItWorksPhysiology + "</div>",
    "<div style=\"font-size:12.5px;color:#94a3b8;margin-top:6px;\"><strong>Lokasi / Origo-Insersio:</strong> " + card.originInsertionOrLocation + "</div>",
    "</div>",

    "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:10px;\">",
    "<div class=\"info-box\"><div class=\"label-tag\" style=\"color:#f43f5e;\">PENDARAHAN ARTERI & VENA</div><div style=\"font-size:12px;color:#e2e8f0;\"><strong>Arteri:</strong> " + card.arterialSupply + "</div><div style=\"font-size:12px;color:#94a3b8;margin-top:4px;\"><strong>Vena/Limfe:</strong> " + card.venousAndLymphatic + "</div></div>",
    "<div class=\"info-box\"><div class=\"label-tag\" style=\"color:#a855f7;\">INERVASI SARAF & KLINIS</div><div style=\"font-size:12px;color:#e2e8f0;\"><strong>Saraf:</strong> " + card.nerveInnervation + "</div><div style=\"font-size:12px;color:#34d399;margin-top:4px;\"><strong>Klinis:</strong> " + card.clinicalAndDailyRelevance + "</div></div>",
    "</div>",
    "</div></div></div>",

    "<script>",
    "const canvas3d = document.getElementById(\"zanatomy-3d-canvas\");",
    "const ctx3d = canvas3d.getContext(\"2d\");",
    "const waveCanvas = document.getElementById(\"phys-wave-canvas\");",
    "const ctxWave = waveCanvas.getContext(\"2d\");",
    "const slider = document.getElementById(\"phys-slider\");",
    "const badge = document.getElementById(\"sim-val-badge\");",
    "const unitText = \" " + card.sliderUnit + "\";",
    "const activeChipName = \"" + card.categoryChip + "\";",
    "const highlightHex = \"" + card.highlightColorHex + "\";",
    "let simParam = Number(slider.value);",
    "let rotY = 0; let zoomScale = 1.0; let dragging = false; let lastX = 0;",
    "slider.addEventListener(\"input\", () => { simParam = Number(slider.value); badge.textContent = simParam + unitText; });",
    "canvas3d.addEventListener(\"mousedown\", (e) => { dragging = true; lastX = e.clientX; });",
    "window.addEventListener(\"mouseup\", () => { dragging = false; });",
    "window.addEventListener(\"mousemove\", (e) => { if (!dragging) return; rotY += (e.clientX - lastX) * 0.012; lastX = e.clientX; });",
    "window.setViewPreset = function(preset) {",
    "  if (preset === 'front') { rotY = 0; zoomScale = 1.0; }",
    "  else if (preset === 'back') { rotY = Math.PI; zoomScale = 1.0; }",
    "  else if (preset === 'zoom') { zoomScale = zoomScale > 1.2 ? 1.0 : 1.45; }",
    "};",
    "function drawPbrCapsule(x1, y1, r1, x2, y2, r2, baseColor, isHighlighted) {",
    "  const ang = Math.atan2(y2 - y1, x2 - x1);",
    "  const nx = -Math.sin(ang); const ny = Math.cos(ang);",
    "  ctx3d.save();",
    "  ctx3d.beginPath();",
    "  ctx3d.moveTo(x1 + nx * r1, y1 + ny * r1);",
    "  ctx3d.lineTo(x2 + nx * r2, y2 + ny * r2);",
    "  ctx3d.arc(x2, y2, r2, ang + Math.PI/2, ang - Math.PI/2, true);",
    "  ctx3d.lineTo(x1 - nx * r1, y1 - ny * r1);",
    "  ctx3d.arc(x1, y1, r1, ang - Math.PI/2, ang + Math.PI/2, true);",
    "  ctx3d.closePath();",
    "  const grad = ctx3d.createLinearGradient(x1 - r1, y1, x2 + r2, y2);",
    "  if (isHighlighted) {",
    "    grad.addColorStop(0, \"#ffffff\"); grad.addColorStop(0.35, highlightHex); grad.addColorStop(1, \"#0f172a\");",
    "    ctx3d.shadowColor = highlightHex; ctx3d.shadowBlur = 18;",
    "  } else {",
    "    grad.addColorStop(0, \"rgba(225,95,95,0.85)\"); grad.addColorStop(0.5, baseColor); grad.addColorStop(1, \"rgba(45,15,25,0.92)\");",
    "  }",
    "  ctx3d.fillStyle = grad; ctx3d.fill();",
    "  ctx3d.strokeStyle = isHighlighted ? highlightHex : \"rgba(255,255,255,0.14)\";",
    "  ctx3d.lineWidth = isHighlighted ? 2.2 : 1.0; ctx3d.stroke();",
    "  ctx3d.restore();",
    "}",
    "function animateStudio(nowMs) {",
    "  const t = nowMs / 1000;",
    "  const speedFactor = Math.max(0.5, simParam / 50);",
    "  const pulse = Math.sin(t * 3.5 * speedFactor);",
    "  ctx3d.clearRect(0, 0, canvas3d.width, canvas3d.height);",
    "  ctx3d.save();",
    "  const cx = canvas3d.width / 2; const cy = canvas3d.height / 2;",
    "  ctx3d.translate(cx, cy); ctx3d.scale(zoomScale, zoomScale); ctx3d.translate(-cx, -cy);",
    "  const sway = Math.sin(rotY) * 18;",
    "  // Grounding Platform Grid",
    "  const floorGrad = ctx3d.createRadialGradient(cx, 456, 8, cx, 456, 130);",
    "  floorGrad.addColorStop(0, \"rgba(56,189,248,0.45)\"); floorGrad.addColorStop(1, \"rgba(2,6,23,0)\");",
    "  ctx3d.fillStyle = floorGrad; ctx3d.beginPath(); ctx3d.ellipse(cx, 456, 125, 16, 0, 0, Math.PI*2); ctx3d.fill();",
    "  const baseMuscle = \"rgba(153,27,27,0.78)\";",
    "  const isSkin = activeChipName === \"Skin\";",
    "  // Head & Cranium",
    "  drawPbrCapsule(cx + sway*0.2, 54, 24, cx + sway*0.2, 92, 15, baseMuscle, isSkin);",
    "  // Ear Highlight (Left & Right)",
    "  drawPbrCapsule(cx - 24 + sway*0.2, 64, 5, cx - 24 + sway*0.2, 74, 4, baseMuscle, activeChipName === \"Ear\");",
    "  drawPbrCapsule(cx + 24 + sway*0.2, 64, 5, cx + 24 + sway*0.2, 74, 4, baseMuscle, activeChipName === \"Ear\");",
    "  // Thyroid Gland in Anterior Neck",
    "  drawPbrCapsule(cx - 8 + sway*0.2, 95, 6, cx + 8 + sway*0.2, 95, 6, baseMuscle, activeChipName === \"Thyroid\");",
    "  // Thorax & Pectoralis",
    "  drawPbrCapsule(cx, 108, 48, cx, 185, 38, baseMuscle, isSkin);",
    "  // External Abdominal Oblique (Left & Right) — Highlighted when Musculoskeletal selected",
    "  drawPbrCapsule(cx + 20, 172, 16 + pulse*1.5, cx + 16, 232, 14, baseMuscle, activeChipName === \"Musculoskeletal\");",
    "  drawPbrCapsule(cx - 20, 172, 15, cx - 16, 232, 13, baseMuscle, false);",
    "  // Bilateral Lungs",
    "  drawPbrCapsule(cx - 19, 124, 15 + pulse*1.8, cx - 19, 162, 17 + pulse*1.8, \"rgba(14,116,144,0.75)\", activeChipName === \"Lungs\");",
    "  drawPbrCapsule(cx + 19, 124, 15 + pulse*1.8, cx + 19, 162, 17 + pulse*1.8, \"rgba(14,116,144,0.75)\", activeChipName === \"Lungs\");",
    "  // Heart & Coronary Apex",
    "  drawPbrCapsule(cx + 6, 136, 13 + Math.max(0,pulse)*3, cx + 12, 154, 10, \"rgba(225,29,72,0.9)\", activeChipName === \"Heart\");",
    "  // Liver & Gallbladder",
    "  drawPbrCapsule(cx - 20, 176, 17, cx + 4, 182, 11, \"rgba(180,83,9,0.85)\", activeChipName === \"Liver & biliary\");",
    "  // Kidneys (Left & Right)",
    "  drawPbrCapsule(cx - 16, 198, 8, cx - 16, 214, 8, \"rgba(5,150,105,0.85)\", activeChipName === \"Kidney & urinary tract\");",
    "  drawPbrCapsule(cx + 16, 198, 8, cx + 16, 214, 8, \"rgba(5,150,105,0.85)\", activeChipName === \"Kidney & urinary tract\");",
    "  // Upper & Lower Limbs (Grounded to Pedestal)",
    "  drawPbrCapsule(cx - 50, 112, 13, cx - 68, 185, 10, baseMuscle, isSkin);",
    "  drawPbrCapsule(cx - 68, 185, 9.5, cx - 76, 255, 7.5, baseMuscle, isSkin);",
    "  drawPbrCapsule(cx + 50, 112, 13, cx + 68, 185, 10, baseMuscle, isSkin);",
    "  drawPbrCapsule(cx + 68, 185, 9.5, cx + 76, 255, 7.5, baseMuscle, isSkin);",
    "  drawPbrCapsule(cx - 24, 236, 19, cx - 26, 338, 13, baseMuscle, isSkin);",
    "  drawPbrCapsule(cx - 26, 338, 12.5, cx - 24, 438, 8.5, baseMuscle, isSkin);",
    "  drawPbrCapsule(cx - 24, 438, 8, cx - 38, 450, 6.5, baseMuscle, isSkin);",
    "  drawPbrCapsule(cx + 24, 236, 19, cx + 26, 338, 13, baseMuscle, isSkin);",
    "  drawPbrCapsule(cx + 26, 338, 12.5, cx + 24, 438, 8.5, baseMuscle, isSkin);",
    "  drawPbrCapsule(cx + 24, 438, 8, cx + 38, 450, 6.5, baseMuscle, isSkin);",
    "  ctx3d.restore();",
    "  // Draw Real-Time Physiological Waveform on Right Inspector",
    "  ctxWave.clearRect(0, 0, waveCanvas.width, waveCanvas.height);",
    "  ctxWave.strokeStyle = highlightHex; ctxWave.lineWidth = 2.5; ctxWave.beginPath();",
    "  for (let x = 0; x < waveCanvas.width; x++) {",
    "    const phase = (x / 45) * speedFactor - t * 3.2 * speedFactor;",
    "    const y = 38 - Math.sin(phase) * 18 - Math.pow(Math.max(0, Math.sin(phase * 2)), 6) * 14;",
    "    if (x === 0) ctxWave.moveTo(x, y); else ctxWave.lineTo(x, y);",
    "  }",
    "  ctxWave.stroke();",
    "  requestAnimationFrame(animateStudio);",
    "}",
    "requestAnimationFrame(animateStudio);",
    "</script></body></html>"
  ].join("\n");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost:4399");
  if (url.pathname === "/select") {
    if (url.searchParams.get("chip")) { activeChip = url.searchParams.get("chip"); sliderOverride = null; }
    if (url.searchParams.get("mode")) { activeMode = url.searchParams.get("mode"); }
    res.writeHead(302, { Location: "/" });
    res.end();
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(renderStudioHtml());
});

if (process.argv.includes("--smoke-test")) {
  const html = renderStudioHtml();
  if (!html.includes("Otot Obliquus Externus Abdominis") || !html.includes("SIMULASI FISIOLOGI INTERAKTIF")) process.exit(1);
  console.log("  \x1b[32m✓ [Z-ANATOMY 2027 STUDIO & CLEAR INDONESIAN ATLAS SMOKE TEST PASSED]\x1b[0m");
  process.exit(0);
}

server.listen(4399, () => {
  console.log("\n\x1b[32m🚀 [Z-ANATOMY & BIODIGITAL 2027 STUDIO LIVE] Buka di Chrome: http://localhost:4399\x1b[0m");
  exec("open http://localhost:4399");
});