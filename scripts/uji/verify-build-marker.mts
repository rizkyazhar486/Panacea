// E7: verifikasi penanda build artefak yang dideploy; dan alur kerja produksi mensyaratkannya untuk status "DEPLOYED_SMOKE_VERIFIED".
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { checkMarker } = await import('../../scripts/qa/verify-build-marker.mjs')
const A = 'a'.repeat(40), B = 'b'.repeat(40)
assert.deepEqual(checkMarker(JSON.stringify({ commit: A }), A), { ok: true, reason: 'match' })
assert.equal(checkMarker(JSON.stringify({ commit: A.toUpperCase() }), A).ok, true, 'case-insensitive SHA')
assert.equal(checkMarker(JSON.stringify({ commit: A }), A.toUpperCase()).ok, true)
for (const [name, body] of Object.entries({ other: JSON.stringify({ commit: B }), null: JSON.stringify({ commit: null }), missing: '{}', notJson: '<html>', empty: '', array: '[]', number: JSON.stringify({ commit: 5 }), short: JSON.stringify({ commit: 'abc123' }), nonHex: JSON.stringify({ commit: 'g'.repeat(40) }), nul: 'null' })) assert.equal(checkMarker(body, A).ok, false, `${name} must not verify`)
for (const bad of ['', 'main', 'abc', 'g'.repeat(40), 'a'.repeat(41), null, undefined, 5]) assert.equal(checkMarker(JSON.stringify({ commit: A }), bad as never).ok, false, `expected ${String(bad)} is refused`)
assert.match(checkMarker(JSON.stringify({ commit: B }), A).reason, /differs/); assert.match(checkMarker(JSON.stringify({ commit: null }), A).reason, /unknown/)
// CLI sungguhan terhadap server HTTP lokal: cocok → 0, beda/404/tanpa penanda → 1, argumen kurang → 2.
const { createServer } = await import('node:http'); const { spawn } = await import('node:child_process')
let body = JSON.stringify({ commit: A }), status = 200
const srv = createServer((req, res) => { res.statusCode = req.url === '/build.json' ? status : 404; res.end(body) })
await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r)); const port = (srv.address() as { port: number }).port
const cli = (args: string[]) => new Promise<{ code: number | null; out: string }>((resolve) => { const c = spawn(process.execPath, ['scripts/qa/verify-build-marker.mjs', ...args], { env: { ...process.env, VERIFY_MARKER_RETRY_MS: '5' } }); let out = ''; c.stdout.on('data', (d) => (out += d)); c.stderr.on('data', (d) => (out += d)); c.on('close', (code) => resolve({ code, out })) })
const base = `http://127.0.0.1:${port}`
assert.deepEqual(await cli([base, A]), { code: 0, out: 'build marker: OK — match\n' }, 'matching marker exits 0')
assert.equal((await cli([`${base}/`, A])).code, 0, 'a trailing slash on the URL is fine')
assert.equal((await cli([base, B])).code, 1, 'a different commit exits 1'); body = JSON.stringify({ commit: null }); assert.equal((await cli([base, A])).code, 1, 'an unknown marker exits 1')
body = JSON.stringify({ commit: A }); status = 404; assert.equal((await cli([base, A])).code, 1, 'HTTP 404 exits 1'); status = 200
assert.equal((await cli([`http://127.0.0.1:1`, A])).code, 1, 'an unreachable host exits 1'); assert.equal((await cli([base])).code, 2, 'missing arguments exit 2'); assert.equal((await cli([])).code, 2)
srv.close()
const wf = readFileSync('.github/workflows/vercel-prebuilt-production.yml', 'utf8')
assert.match(wf, /id: marker\n\s+if: steps\.smoke\.outcome == 'success'/, 'the marker step runs only after a successful smoke test')
assert.match(wf, /node scripts\/qa\/verify-build-marker\.mjs "\$DEPLOYMENT_URL" "\$EXPECTED_SHA"/); assert.match(wf, /EXPECTED_SHA: \$\{\{ github\.sha \}\}/)
assert.match(wf, /MARKER_STEP_OUTCOME: \$\{\{ steps\.marker\.outcome \}\}/); assert.match(wf, /elif deployed and smoke_passed and marker_passed and url:\n\s+status = "DEPLOYED_SMOKE_VERIFIED"/, 'DEPLOYED_SMOKE_VERIFIED requires the marker')
assert.match(wf, /"build_marker_step": os\.environ\.get\("MARKER_STEP_OUTCOME", ""\)/); assert.match(wf, /\$\{\{ steps\.marker\.outcome \}\}" != "success" \]; then\n\s+echo "Status: \*\*UNVERIFIED — deployed build marker does not match/, 'the run summary reports a marker mismatch')
console.log('verify-build-marker: ok')
