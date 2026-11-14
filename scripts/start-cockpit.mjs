/**
 * @file scripts/start-cockpit.mjs
 * @description Live HTTP/WebGPU Server Daemon untuk membuka /body-exposure di Browser
 * Penggunaan: node scripts/start-cockpit.mjs
 */

import http from 'node:http';
import { handleOmnicausalisGatewayRequest } from '../src/core/panaceamedOmnicausalisSingularityEngine.mjs';
import { runPanaceaMedNextGenTandemOrchestrator } from '../src/core/panaceamedNextGenHydrogenSpine.mjs';

const PORT = Number(process.env.PORT || 4040);

const server = http.createServer((req, res) => {
  if (req.url === '/api/v2/nextgen/tandem') {
    const snapshot = runPanaceaMedNextGenTandemOrchestrator();
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(snapshot, null, 2));
    return;
  }

  const response = handleOmnicausalisGatewayRequest({ method: req.method, url: req.url });
  res.writeHead(response.statusCode, response.headers);
  res.end(response.body);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`┌────────────────────────────────────────────────────────────────────────┐`);
  console.log(`│ PANACEAMED OMNICAUSALIS 4D COCKPIT LIVE SERVER AKTIF                   │`);
  console.log(`│ • Cockpit 3D UI : http://127.0.0.1:${PORT}/body-exposure                  │`);
  console.log(`│ • Tandem API v2 : http://127.0.0.1:${PORT}/api/v2/nextgen/tandem          │`);
  console.log(`│ • Healthcheck   : http://127.0.0.1:${PORT}/healthz                        │`);
  console.log(`└────────────────────────────────────────────────────────────────────────┘`);
});
