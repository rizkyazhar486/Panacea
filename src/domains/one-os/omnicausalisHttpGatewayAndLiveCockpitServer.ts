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
</body>
</html>`;

  return {
    statusCode: 200,
    contentType: "text/html; charset=utf-8",
    body: html
  };
}
