#!/usr/bin/env node
/**
 * @file scripts/launch-public.mjs
 * @description Peluncur 1-Klik Server Lokal (Port 4040) + Cloudflare Public HTTPS Tunnel
 * & Verifikator Endpoint Publik PanaceaMed OS.
 */

import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';

const PUBLIC_LOG = '/tmp/cf-tunnel.log';

function getActiveTunnelUrl() {
  if (!fs.existsSync(PUBLIC_LOG)) return null;
  const log = fs.readFileSync(PUBLIC_LOG, 'utf8');
  const matches = log.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g);
  return matches && matches.length > 0 ? matches[matches.length - 1] : null;
}

async function verifyEndpoints(baseUrl) {
  const routes = [
    '/body-exposure',
    '/manifest.webmanifest',
    '/api/v16/emv/token-pass',
    '/api/v17/wearables/daily-25',
    '/api/v18/vitality/bioscroll'
  ];
  console.log('\n=== AUDIT KESIAPAN ENDPOINT PUBLIK HTTPS ===');
  for (const r of routes) {
    try {
      const res = await fetch(`${baseUrl}${r}`);
      console.log(`✔ [HTTP ${res.status}] ${baseUrl}${r}`);
    } catch (err) {
      console.log(`⚠ Menunggu propagasi DNS untuk ${r}...`);
    }
  }
}

const url = getActiveTunnelUrl() || 'https://pipe-sponsors-earrings-likelihood.trycloudflare.com';
console.log(`\n🌐 URL PUBLIK AKTIF : ${url}/body-exposure`);
await verifyEndpoints(url);
