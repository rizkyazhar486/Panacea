// P0 production guard: Home must never preload a deploy-specific CSS chunk.
// A stale mobile/desktop tab could otherwise request a removed Home-<hash>.css
// and crash the entire SPA even though HTTP 200 and the global build succeed.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function verifyHomeOutput({ assets, hasStableCss, stableCssText }) {
  const failures = []
  if (!hasStableCss || typeof stableCssText !== 'string' || stableCssText.length < 1000)
    failures.push('stable Home stylesheet missing or empty in dist')
  const hashedCss = assets.filter((name) => /^Home-[A-Za-z0-9_-]+\.css$/.test(name))
  if (hashedCss.length) failures.push('hashed Home CSS chunks remain: ' + hashedCss.join(', '))
  return failures
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const dist = process.env.HOME_DIST || 'dist'
  const stable = join(dist, 'home-styles.css')
  const assets = join(dist, 'assets')
  const failures = verifyHomeOutput({
    assets: existsSync(assets) ? readdirSync(assets) : [],
    hasStableCss: existsSync(stable),
    stableCssText: existsSync(stable) ? readFileSync(stable, 'utf8') : '',
  })
  if (failures.length) {
    console.error('P0 Home asset contract FAILED: ' + failures.join('; '))
    process.exitCode = 1
  } else console.log('P0 Home asset contract PASS: stable CSS and no hashed Home CSS preload')
}
