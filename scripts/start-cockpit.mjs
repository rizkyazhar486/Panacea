import { runPanaceaMedWave350AstralPublicMasterOs, orchestratePublicHumanSession } from '../src/core/panaceamedAstralAmethystPublicOrchestratorOs.mjs';
import { runHolisticAutoExpansionAndSmoothOsGovernor } from '../src/core/panaceamedHolisticAutoKernelOs.mjs';
import { evaluatePlanetary5BillionUserSimulation, evaluateTwelveSubspecialtyClinicalDepthMatrix } from '../src/core/panaceamedPlanetary5BillionSimulationOs.mjs';
import { evaluateSmartClinicalOmniboxAndCdss, runProductionDeploymentReadinessAndSmokeTest } from "../src/core/panaceamedPublicProductionReadyOs.mjs";
import { runPanaceaMedWave250UniversalHumanityMasterOs } from "../src/core/panaceamedUniversalHumanityOs.mjs";
import { evaluateWave251To260AutoMaturityCheckRecheck, simulateWave261To270InteractiveClinicalWhatIf, runPanaceaMedWave300AutoMaturityMasterOs } from "../src/core/panaceamedAutoMaturityVisualSimulationOs.mjs";
/**
 * @file scripts/start-cockpit.mjs
 * @description PanaceaMed Wave 300 Live Interactive Cockpit, Visual Simulator & Auto-Maturity Recheck Daemon
 */
import http from "node:http";
import { handleNextGenEdgeHttpGateway, runPanaceaMedNextGenTandemOrchestrator } from "../src/core/panaceamedNextGenHydrogenSpine.mjs";
import { renderInteractiveWave95CockpitHtml, evaluateWave85To88SseStreamAndBiofeedback, runOmnicausalisCenturyWave100Master } from "../src/core/panaceamedCenturyWave100Engine.mjs";
import { runPanaceaMedWave120EmbodiedRoboticMasterOs } from "../src/core/panaceamedEmbodiedRoboticKinematicsOs.mjs";
import { runPanaceaMedWave140ShenzhenTcmMasterOs } from "../src/core/panaceamedShenzhenTcmProactiveLifecycleOs.mjs";
import { runPanaceaMedWave140DataPipelineMaster } from "../src/core/panaceamedDataPipelineEdgeCloudEngine.mjs";
import { runPanaceaMedWave160ImaginativeSingularityMaster } from "../src/core/panaceamedImaginativeSingularityOs.mjs";
import { runPanaceaMedWave200BicentennialMasterOs } from "../src/core/panaceamedSqliteVaultAndComplianceOs.mjs";

const PORT = Number(process.env.PORT || 4040);

export function createCockpitServer() {
  return http.createServer((req, res) => {

  // === WAVE 351-360 PWA OFFLINE-FIRST & PUBLIC MULTI-USER GATEWAY ===
  const urlPath = String(req.url || '/').split('?')[0];
  if (urlPath === '/manifest.webmanifest') {
    const manifestJson = JSON.stringify({
      name: 'PanaceaMed Astral-Amethyst OS',
      short_name: 'PanaceaMed',
      start_url: '/body-exposure',
      display: 'standalone',
      background_color: '#040616',
      theme_color: '#7c3aed'
    });
    res.writeHead(200, {
      'content-type': 'application/manifest+json; charset=utf-8',
      'access-control-allow-origin': '*'
    });
    res.end(manifestJson);
    return;
  }
  if (urlPath === '/sw.js') {
    const swScript = "self.addEventListener('install', () => self.skipWaiting()); self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));";
    res.writeHead(200, {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-cache'
    });
    res.end(swScript);
    return;
  }

    const urlPath = String(req.url || "/").split("?")[0];
    const sendJson = (obj) => {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(obj, null, 2));
    };
    if (req.method === "GET" && urlPath === "/body-exposure") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "x-panaceamed-ui-theme": "APPLE_HIG_DARK_FUTURISTIC_GLASSMORPHISM" });
      res.end(renderInteractiveWave95CockpitHtml({ compositeNorthStar: 99.6 }));
      return;
    }
    if (req.method === "GET" && urlPath === "/api/v2/nextgen/stream") {
      const sse = evaluateWave85To88SseStreamAndBiofeedback({ streamSequenceId: Date.now() });
      res.writeHead(200, sse.headers);
      res.end(sse.sseFrameText);
      return;
    }
    if (req.method === "GET" && urlPath === "/api/v2/nextgen/tandem") return sendJson(runPanaceaMedNextGenTandemOrchestrator());
    if (req.method === "GET" && urlPath === "/api/v3/century/master") return sendJson(runOmnicausalisCenturyWave100Master());
    if (req.method === "GET" && urlPath === "/api/v4/embodied/robotics") return sendJson(runPanaceaMedWave120EmbodiedRoboticMasterOs());
    if (req.method === "GET" && urlPath === "/api/v5/shenzhen/tcm-proactive") return sendJson(runPanaceaMedWave140ShenzhenTcmMasterOs());
    if (req.method === "GET" && urlPath === "/api/v5/pipeline/panacea-score") return sendJson(runPanaceaMedWave140DataPipelineMaster());
    if (req.method === "GET" && urlPath === "/api/v6/imaginative/chronofs") return sendJson(runPanaceaMedWave160ImaginativeSingularityMaster());
    if (req.method === "GET" && urlPath === "/api/v7/vault/sqlite-status") return sendJson(runPanaceaMedWave200BicentennialMasterOs());
    if (req.method === "GET" && urlPath === "/api/v8/production/readiness") return sendJson(runProductionDeploymentReadinessAndSmokeTest());
    if (req.method === "GET" && urlPath === "/api/v8/clinical/omnibox") return sendJson(evaluateSmartClinicalOmniboxAndCdss());
    if (req.method === "GET" && urlPath === "/api/v8/universal/humanity") return sendJson(runPanaceaMedWave250UniversalHumanityMasterOs());
    if (req.method === "GET" && urlPath === "/api/v8/maturity/recheck") return sendJson({ recheck: evaluateWave251To260AutoMaturityCheckRecheck(), master: runPanaceaMedWave300AutoMaturityMasterOs() });
    if (req.method === "GET" && urlPath === "/api/v8/simulation/what-if") return sendJson(simulateWave261To270InteractiveClinicalWhatIf());
    if (req.method === "GET" && urlPath === "/api/v9/astral/public") return sendJson(runPanaceaMedWave350AstralPublicMasterOs());
    if (req.method === "GET" && urlPath === "/api/v9/planetary/5billion") return sendJson(evaluatePlanetary5BillionUserSimulation());
    if (req.method === "GET" && urlPath === "/api/v9/clinical/12-subspecialties") return sendJson(evaluateTwelveSubspecialtyClinicalDepthMatrix());
    if (req.method === "GET" && urlPath === "/api/v9/holistic/governor") return sendJson(runHolisticAutoExpansionAndSmoothOsGovernor());

    const fallback = handleNextGenEdgeHttpGateway({ method: req.method, url: req.url });
    res.writeHead(fallback.statusCode, fallback.headers);
    res.end(fallback.body);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createCockpitServer().listen(PORT, "127.0.0.1");
}
