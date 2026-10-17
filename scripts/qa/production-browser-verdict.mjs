// E7 — HTTP 200 is insufficient if the page is blank; non-200 is never acceptance.
// Pure classification is kept separate from the network/browser runner for deterministic negative controls.
export function assessPublicPage({ status, title, bodyTextChars, rootErrorText = '', assetFailures = [] }) {
  const failures = []
  if (status !== 200) failures.push(`public home HTTP ${status ?? 'no response'}; expected 200`)
  if (typeof title !== 'string' || !title.trim()) failures.push('public home has no document title')
  if (!Number.isFinite(bodyTextChars) || bodyTextChars < 1) failures.push('public home has no visible text')
  if (/something went wrong/i.test(String(rootErrorText))) failures.push('public home rendered root ErrorBoundary instead of application')
  for (const asset of assetFailures) failures.push(`public home required asset failed: ${String(asset).slice(0, 200)}`)
  return failures
}
