// E7: o artefak yang dideploy menyebut commit sumbernya (build.json) dan harus sama dengan commit yang dibangun workflow.
// Pakai: node scripts/qa/verify-build-marker.mjs <urlDeploy> <shaDiharapkan>   (keluar 1 bila tidak cocok atau tidak diketahui)
export function checkMarker(body, expectedSha) {
  if (typeof expectedSha !== 'string' || !/^[0-9a-f]{40}$/i.test(expectedSha)) return { ok: false, reason: 'expected SHA is not a 40-hex commit' }
  let parsed
  try { parsed = JSON.parse(body) } catch { return { ok: false, reason: 'build.json is not valid JSON' } }
  const commit = parsed && typeof parsed === 'object' ? parsed.commit : undefined
  if (commit === null || commit === undefined) return { ok: false, reason: 'build.json carries no commit (unknown)' }
  if (typeof commit !== 'string' || !/^[0-9a-f]{40}$/i.test(commit)) return { ok: false, reason: 'build.json commit is not a 40-hex SHA' }
  return commit.toLowerCase() === expectedSha.toLowerCase() ? { ok: true, reason: 'match' } : { ok: false, reason: `deployed ${commit.slice(0, 8)} differs from built ${expectedSha.slice(0, 8)}` }
}

async function main() {
  const [url, sha] = process.argv.slice(2)
  if (!url || !sha) { console.error('usage: verify-build-marker.mjs <deployment url> <expected sha>'); process.exit(2) }
  let last = { ok: false, reason: 'not fetched' }
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const r = await fetch(`${url.replace(/\/$/, '')}/build.json`, { signal: AbortSignal.timeout(30000), headers: { 'cache-control': 'no-cache' } })
      last = r.ok ? checkMarker(await r.text(), sha) : { ok: false, reason: `HTTP ${r.status}` }
    } catch (e) { last = { ok: false, reason: String(e.message || e) } }
    if (last.ok) break
    await new Promise((res) => setTimeout(res, Number(process.env.VERIFY_MARKER_RETRY_MS) || 3000))
  }
  console.log(`build marker: ${last.ok ? 'OK' : 'FAILED'} — ${last.reason}`)
  process.exit(last.ok ? 0 : 1)
}
if (import.meta.url === `file://${process.argv[1]}`) await main()
