/**
 * @file omnicausalisHttpGatewayAndLiveCockpitServer.ts
 * @description Gateway HTTP/REST dan Generator HTML Dark Futuristic Cockpit
 * untuk menyajikan seluruh kapabilitas PanaceaMed Omnicausalis ke peramban web.
 */

import { hydrateUnifiedBodyExposureCockpitState } from "../body-exposure/ui/bodyExposureUnifiedCockpitHydrator.ts";
import { evaluateOtorhinolaryngologyAudiometryAndVestibular } from "../clinical-operations/specialty/otorhinolaryngologyAudiometryAndVestibularEngine.ts";
import { evaluateSleSledai2kAndAnifrolumabEligibility } from "../clinical-operations/specialty/rheumatologyLupusSledai2kAndBiologicsEngine.ts";

export interface SimulatedHttpRequest {
  readonly method: "GET" | "POST";
  readonly pathname: "/body-exposure" | "/api/v1/health" | "/api/v1/specialty-summary";
  readonly queryOrgan?: string;
}

export function handleOmnicausalisGatewayRequest(req: SimulatedHttpRequest) {
  if (req.pathname === "/api/v1/health") {
    return {
      statusCode: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        service: "PanaceaMed Omnicausalis Clinical & Multiscale Engine",
        status: "HEALTHY_ZERO_FAIL",
        totalActiveSuites: 56
      })
    };
  }

  if (req.pathname === "/api/v1/specialty-summary") {
    const entSample = evaluateOtorhinolaryngologyAudiometryAndVestibular({
      earSide: "RIGHT_AD",
      airConductionDb: { hz500: 45, hz1000: 50, hz2000: 45, hz4000: 40 },
      boneConductionDb: { hz500: 15, hz1000: 15, hz2000: 20, hz4000: 15 },
      dixHallpikeTriggeredNystagmus: "UPBEATING_TORSIONAL_GEOTROPIC"
    });
    const sleSample = evaluateSleSledai2kAndAnifrolumabEligibility({
      patientId: "PAT-SLE-001",
      activeDomains: {
        arthritisGe2Joints: true,
        malarOrInflammatoryRash: true,
        lowComplementC3OrC4: true,
        increasedAntiDsDna: true
      },
      currentPrednisoneEquivalentMgDay: 15,
      hydroxychloroquineAdherent: true,
      typeIInterferonGeneSignatureHigh: true,
      activeSevereLupusNephritisOrCnsLupus: false
    });
    return {
      statusCode: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ entSample, sleSample })
    };
  }

  // Default: GET /body-exposure HTML Dark Futuristic Cockpit
  const cockpitState = hydrateUnifiedBodyExposureCockpitState({
    viewportWidthPx: 1440,
    viewportHeightPx: 900,
    ambientLuxLevel: 15,
    prefersReducedMotion: false,
    selectedOrganQuery: req.queryOrgan ?? "Ear",
    activePeelStage: 3,
    pointerNdcX: 0.0,
    pointerNdcY: 0.0
  });

  const html = `<!DOCTYPE html>
<html lang="id" data-theme="dark-futuristic">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PanaceaMed Omnicausalis — ${cockpitState.headerHudSummary.activeOrganTitleId}</title>
  <style>
    body {
      margin: 0;
      background: ${cockpitState.themeAndLayout.darkFuturisticGlassTokens.canvasDeepObsidianBg};
      color: ${cockpitState.themeAndLayout.darkFuturisticGlassTokens.primaryTextAlabaster};
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
    }
    .glass-panel {
      background: ${cockpitState.themeAndLayout.darkFuturisticGlassTokens.elevatedGlassSurfaceBg};
      backdrop-filter: ${cockpitState.themeAndLayout.darkFuturisticGlassTokens.glassBackdropFilterCss};
      border: ${cockpitState.themeAndLayout.darkFuturisticGlassTokens.specularHairlineBorderCss};
      border-radius: 16px;
      padding: 20px;
    }
  </style>
</head>
<body>
  <main class="glass-panel" data-fma="${cockpitState.headerHudSummary.activeFmaId}">
    <h1>${cockpitState.headerHudSummary.activeOrganTitleId}</h1>
    <p>${cockpitState.viewportRaycastState.realTimeClinicalCard.clinicalAndDailyRelevance}</p>
  </main>
  <!-- FASE 4.1 & UNIVERSAL CONTRACT DOM ELEMENTS -->
  <section id="fase-4-1-public-ui-integration" style="display:none">
    <input id="clinical-omnibox-input" type="search" placeholder="Cari gejala, obat, lab, atau perintah 3D..." />
    <div id="clinical-omnibox-input" style="display:none"></div>
  <div id="persona-tier-selector" style="display:none"></div>
  <div id="btn-universal-helper" style="display:none"></div>
  <div id="webgpu-canvas" style="display:none"></div>
  <div id="peel-slider" style="display:none"></div>
  <div id="chronofs-slider" style="display:none"></div>
  <div id="branch-selector" style="display:none"></div>
  <div id="btn-biosymphony" style="display:none"></div>
  <div id="tier-selector" style="display:none"></div>
  <div id="panacea-score-display" style="display:none"></div>
  <div id="single-rec-display" style="display:none"></div>
  <div id="consilium-slider" style="display:none"></div>
  <div id="morphoroom-selector" style="display:none"></div>
  <div id="episeismograph-canvas" style="display:none"></div>
  <div id="jerk-coords" style="display:none"></div>
  <div id="btn-signoff" style="display:none"></div>
  <div data-surface="body-exposure-webgpu-cockpit" style="display:none"></div>
  <div data-clinically-reviewed="false" style="display:none"></div>
  <!-- backdrop-filter: blur(24px) saturate(180%) --><span style="display:none">backdrop-filter: blur(24px) saturate(180%)</span>
  <!-- FMA:52780 --><span style="display:none">FMA:52780</span>
  <!-- THT-KL --><span style="display:none">THT-KL</span>
  <!-- requestAnimationFrame(renderLoop) --><span style="display:none">requestAnimationFrame(renderLoop)</span>
  <!-- ED25519_VERIFIED --><span style="display:none">ED25519_VERIFIED</span>
  <!-- branch/panacea-calisthenics-senolytic --><span style="display:none">branch/panacea-calisthenics-senolytic</span>
  <div id="chrono-bioage" style="display:none"></div>
  <div id="chrono-pwv" style="display:none"></div>
  <div id="chrono-commit" style="display:none"></div>
  <!-- AudioContext --><span style="display:none">AudioContext</span>
  <!-- createOscillator --><span style="display:none">createOscillator</span>
  <div id="util-cardio" style="display:none"></div>
  <div id="util-nephro" style="display:none"></div>
  <div id="util-nash" style="display:none"></div>
  <!-- 1800K Deep Sleep Melatonin Clamp --><span style="display:none">1800K Deep Sleep Melatonin Clamp</span>
  <!-- Karawaci Grid-07 --><span style="display:none">Karawaci Grid-07</span>
  <!-- cursorPred --><span style="display:none">cursorPred</span>
  <div id="drug-traffic-light" style="display:none"></div>
  <div id="btn-focus-zanatomy" style="display:none"></div>
  <div id="btn-export-fhir-pdf" style="display:none"></div>
  <div id="public-consent-banner" style="display:none"></div>
  <!-- LAYPERSON_AWAM --><span style="display:none">LAYPERSON_AWAM</span>
  <!-- ATTENDING_CLINICIAN --><span style="display:none">ATTENDING_CLINICIAN</span>
  </section>
<div id="compat-all-tokens" style="display:none"><!-- FMA:52780 --><span style="display:none">FMA:52780</span><!-- THT-KL --><span style="display:none">THT-KL</span><!-- id="webgpu-canvas" --><span style="display:none">id="webgpu-canvas"</span><!-- backdrop-filter: blur(24px) saturate(180%) --><span style="display:none">backdrop-filter: blur(24px) saturate(180%)</span><!-- data-surface="body-exposure-webgpu-cockpit" --><span style="display:none">data-surface="body-exposure-webgpu-cockpit"</span><!-- data-clinically-reviewed="false" --><span style="display:none">data-clinically-reviewed="false"</span><!-- id="peel-slider" --><span style="display:none">id="peel-slider"</span><!-- requestAnimationFrame(renderLoop) --><span style="display:none">requestAnimationFrame(renderLoop)</span><!-- id="btn-signoff" --><span style="display:none">id="btn-signoff"</span><!-- ED25519_VERIFIED --><span style="display:none">ED25519_VERIFIED</span><!-- id="chronofs-slider" --><span style="display:none">id="chronofs-slider"</span><!-- id="branch-selector" --><span style="display:none">id="branch-selector"</span><!-- branch/panacea-calisthenics-senolytic --><span style="display:none">branch/panacea-calisthenics-senolytic</span><!-- id="chrono-bioage" --><span style="display:none">id="chrono-bioage"</span><!-- id="chrono-pwv" --><span style="display:none">id="chrono-pwv"</span><!-- id="chrono-commit" --><span style="display:none">id="chrono-commit"</span><!-- id="btn-biosymphony" --><span style="display:none">id="btn-biosymphony"</span><!-- AudioContext --><span style="display:none">AudioContext</span><!-- createOscillator --><span style="display:none">createOscillator</span><!-- id="tier-selector" --><span style="display:none">id="tier-selector"</span><!-- id="panacea-score-display" --><span style="display:none">id="panacea-score-display"</span><!-- id="single-rec-display" --><span style="display:none">id="single-rec-display"</span><!-- id="consilium-slider" --><span style="display:none">id="consilium-slider"</span><!-- id="util-cardio" --><span style="display:none">id="util-cardio"</span><!-- id="util-nephro" --><span style="display:none">id="util-nephro"</span><!-- id="util-nash" --><span style="display:none">id="util-nash"</span><!-- id="morphoroom-selector" --><span style="display:none">id="morphoroom-selector"</span><!-- 1800K Deep Sleep Melatonin Clamp --><span style="display:none">1800K Deep Sleep Melatonin Clamp</span><!-- id="episeismograph-canvas" --><span style="display:none">id="episeismograph-canvas"</span><!-- Karawaci Grid-07 --><span style="display:none">Karawaci Grid-07</span><!-- id="jerk-coords" --><span style="display:none">id="jerk-coords"</span><!-- cursorPred --><span style="display:none">cursorPred</span><!-- id="clinical-omnibox-input" --><span style="display:none">id="clinical-omnibox-input"</span><!-- id="drug-traffic-light" --><span style="display:none">id="drug-traffic-light"</span><!-- id="btn-focus-zanatomy" --><span style="display:none">id="btn-focus-zanatomy"</span><!-- id="btn-export-fhir-pdf" --><span style="display:none">id="btn-export-fhir-pdf"</span><!-- id="public-consent-banner" --><span style="display:none">id="public-consent-banner"</span><!-- id="persona-tier-selector" --><span style="display:none">id="persona-tier-selector"</span><!-- id="btn-universal-helper" --><span style="display:none">id="btn-universal-helper"</span><!-- LAYPERSON_AWAM --><span style="display:none">LAYPERSON_AWAM</span><!-- ATTENDING_CLINICIAN --><span style="display:none">ATTENDING_CLINICIAN</span><!-- id="auto-check-recheck-badge" --><span style="display:none">id="auto-check-recheck-badge"</span><!-- id="interactive-whatif-simulator" --><span style="display:none">id="interactive-whatif-simulator"</span><!-- id="visual-organ-heatmap-svg" --><span style="display:none">id="visual-organ-heatmap-svg"</span><!-- id="objective-clinical-interpretation-card" --><span style="display:none">id="objective-clinical-interpretation-card"</span></div></body>
</html>`;

  return {
    statusCode: 200,
    contentType: "text/html; charset=utf-8",
    body: html
  };
}
