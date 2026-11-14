import { runPanaceaMedWave140ShenzhenTcmMasterOs } from '../src/core/panaceamedShenzhenTcmProactiveLifecycleOs.mjs';
import { runPanaceaMedWave120EmbodiedRoboticMasterOs } from '../src/core/panaceamedEmbodiedRoboticKinematicsOs.mjs';
/**
 * @file scripts/start-cockpit.mjs
 * @description PanaceaMed Wave 100 Live Interactive Cockpit & SSE Server Daemon
 * Penggunaan: node scripts/start-cockpit.mjs
 */

import http from 'node:http';
import { handleOmnicausalisGatewayRequest } from '../src/core/panaceamedOmnicausalisSingularityEngine.mjs';
import { runPanaceaMedNextGenTandemOrchestrator } from '../src/core/panaceamedNextGenHydrogenSpine.mjs';
import {
  renderInteractiveWave95CockpitHtml,
  evaluateWave85To88SseStreamAndBiofeedback,
  runOmnicausalisCenturyWave100Master
} from '../src/core/panaceamedCenturyWave100Engine.mjs';

const PORT = Number(process.env.PORT || 4040);

const server = http.createServer((req, res) => {
  const urlPath = String(req.url || '/').split('?')[0];

  if (req.method === 'GET' && urlPath === '/body-exposure') {
    const html = renderInteractiveWave95CockpitHtml({ compositeNorthStar: 99.6 });
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'x-panaceamed-ui-theme': 'APPLE_HIG_DARK_FUTURISTIC_GLASSMORPHISM'
    });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && urlPath === '/api/v2/nextgen/stream') {
    const sse = evaluateWave85To88SseStreamAndBiofeedback({ streamSequenceId: Date.now() });
    res.writeHead(200, sse.headers);
    res.end(sse.sseFrameText);
    return;
  }

  if (req.method === 'GET' && urlPath === '/api/v2/nextgen/tandem') {
    const snapshot = runPanaceaMedNextGenTandemOrchestrator();
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(snapshot, null, 2));
    return;
  }

  if (req.method === 'GET' && urlPath === '/api/v5/shenzhen/tcm-proactive') {
    const shenzhenTcm = runPanaceaMedWave140ShenzhenTcmMasterOs();
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(shenzhenTcm, null, 2));
    return;
  }

  if (req.method === 'GET' && urlPath === '/api/v4/embodied/robotics') {
    const embodied = runPanaceaMedWave120EmbodiedRoboticMasterOs();
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(embodied, null, 2));
    return;
  }

  if (req.method === 'GET' && urlPath === '/api/v3/century/master') {
    const century = runOmnicausalisCenturyWave100Master();
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(century, null, 2));
    return;
  }

  const fallback = handleOmnicausalisGatewayRequest({ method: req.method, url: req.url });
  res.writeHead(fallback.statusCode, fallback.headers);
  res.end(fallback.body);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`┌────────────────────────────────────────────────────────────────────────┐`);
  console.log(`│ PANACEAMED WAVE 100 INTERACTIVE 4D COCKPIT SERVER AKTIF                │`);
  console.log(`│ • Interactive 4D UI : http://127.0.0.1:${PORT}/body-exposure              │`);
  console.log(`│ • Live SSE Stream   : http://127.0.0.1:${PORT}/api/v2/nextgen/stream      │`);
  console.log(`│ • Century Master v3 : http://127.0.0.1:${PORT}/api/v3/century/master      │`);
  console.log(`└────────────────────────────────────────────────────────────────────────┘`);
});
