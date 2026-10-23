// Gerbang CI untuk Alpha B7: menjalankan qa/lab-result-review-clinician-e2e.mjs terhadap server NYATA + Chromium 390x844.
// E2E itu sebelumnya hanya dijalankan manual. Skrip ini menyalakan server (data sementara, status verifikasi dokter bersih)
// dan Vite untuk halaman QA, menjalankan E2E, lalu mematikan keduanya. Gagal dengan nama langkah: SERVER_TIDAK_SIAP,
// VITE_TIDAK_SIAP, atau E2E_GAGAL.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)))
const API_PORT = process.env.LAB_E2E_API_PORT || '18788'
const WEB_PORT = process.env.LAB_E2E_WEB_PORT || '5188'
const API = `http://127.0.0.1:${API_PORT}`
const WEB = `http://localhost:${WEB_PORT}`
const dir = mkdtempSync(join(tmpdir(), 'panacea-lab-e2e-'))
const children = []
const logs = new Map()

function start(name, cmd, args, cwd, env) {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  const buf = []
  const keep = (d) => { buf.push(String(d)); if (buf.length > 200) buf.shift() }
  child.stdout.on('data', keep); child.stderr.on('data', keep)
  logs.set(name, buf); children.push(child)
  return child
}
const stopAll = () => { for (const c of children) { try { process.kill(-c.pid, 'SIGTERM') } catch { /* sudah berhenti */ } } }
async function waitFor(url, label, ms = 120_000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try { if ((await fetch(url)).ok) return } catch { /* belum siap */ }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw Object.assign(new Error(`${label}: ${url} tidak siap dalam ${ms} ms`), { label })
}
const tail = (name) => (logs.get(name) ?? []).join('').split('\n').slice(-25).join('\n')

let kode = 1
try {
  start('server', 'npx', ['tsx', 'src/index.ts'], join(root, 'server'), {
    OWNER_EMAIL: 'owner-qa@example.com', ALLOW_DEV_LOGIN: 'true', CORS_ORIGINS: WEB,
    PANACEA_DATA_FILE: join(dir, 'data.json'), PORT: API_PORT, NODE_ENV: 'test',
  })
  await waitFor(`${API}/api/health`, 'SERVER_TIDAK_SIAP').catch((e) => { throw Object.assign(e, { label: 'SERVER_TIDAK_SIAP', log: tail('server') }) })
  start('vite', 'npx', ['vite', '--port', WEB_PORT, '--strictPort'], root, { VITE_API_URL: API })
  await waitFor(`${WEB}/qa/lab-result-review.html`, 'VITE_TIDAK_SIAP').catch((e) => { throw Object.assign(e, { label: 'VITE_TIDAK_SIAP', log: tail('vite') }) })
  kode = await new Promise((done) => {
    const e2e = spawn('node', ['qa/lab-result-review-clinician-e2e.mjs'], { cwd: root, stdio: 'inherit', env: { ...process.env, QA_API: API, QA_URL: `${WEB}/qa/lab-result-review.html` } })
    e2e.on('exit', (c) => done(c ?? 1))
  })
  if (kode !== 0) console.error(`E2E_GAGAL: lab-result-review-clinician-e2e.mjs keluar dengan kode ${kode}\n--- server ---\n${tail('server')}`)
} catch (e) {
  console.error(`${e.label ?? 'GATE_ERROR'}: ${e.message}\n${e.log ?? ''}`)
} finally {
  stopAll()
  rmSync(dir, { recursive: true, force: true })
}
process.exit(kode)
