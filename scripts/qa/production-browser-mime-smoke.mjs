// E7: exercise the actual production runner against local HTTP/browser fixtures.
// A healthy CSS response passes; MIME lookalikes must fail without leaking URLs.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const runner = fileURLToPath(new URL('./production-browser-check.mjs', import.meta.url))
for (const [name, mime, expected] of [
  ['healthy', 'text/css; charset=utf-8', 0],
  ['parameter-lookalike', 'text/html; note=text/css', 1],
  ['suffix-lookalike', 'text/css-invalid', 1],
]) {
  const out = mkdtempSync(path.join(tmpdir(), 'e7-mime-'))
  const marker = 'synthetic-private-token'
  const server = createServer((req, res) => {
    if (req.url.startsWith('/assets/')) {
      res.writeHead(200, { 'content-type': mime })
      res.end('body { margin: 0; }')
    } else {
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end(`<!doctype html><title>Panacea smoke fixture</title><link rel="stylesheet" href="/assets/Home.css?token=${marker}"><main>Local production runner fixture</main>`)
    }
  })
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
    let output = ''
    const child = spawn(process.execPath, [runner], {
      env: { ...process.env, PROD_URL: `http://127.0.0.1:${server.address().port}`, PROD_API_URL: '', EXPECT_SHA: '', BODY_SESSION: '', OUT: out },
      stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000,
    })
    child.stdout.on('data', (data) => { output += data })
    child.stderr.on('data', (data) => { output += data })
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve) })
    assert.equal(code, expected, `${name}: unexpected runner exit: ${output}`)
    const raw = readFileSync(path.join(out, 'report.json'), 'utf8')
    const report = JSON.parse(raw)
    assert.deepEqual(report.viewports.map((v) => v.width), [390, 1440])
    for (const viewport of report.viewports) assert.equal(viewport.assetFailuresCount > 0, expected === 1, `${name}: required CSS failure evidence`)
    assert.equal(report.findings.some((f) => f.category === 'required_asset_failed'), expected === 1)
    assert.equal((raw + output).includes(marker), false, `${name}: raw request query leaked`)
    console.log(`E7 MIME browser control ${name}: exit ${code}, both viewports, query redacted`)
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    rmSync(out, { recursive: true, force: true })
  }
}
