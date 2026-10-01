import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../../.github/workflows/deploy.yml', import.meta.url),
  'utf8',
)

assert.match(
  workflow,
  /- run: npm run uji/,
  'Pages workflow must retain the deterministic regression suite before any deploy',
)

assert.match(
  workflow,
  /- run: npm run build/,
  'Pages workflow must retain the production build before any deploy',
)

assert.match(
  workflow,
  /uses: actions\\/deploy-pages@v4/,
  'GitHub Pages deployment capability must remain available',
)

assert.match(
  workflow,
  /deploy:\\n\\s+if: \\$\\{\\{ vars\\.ENABLE_GITHUB_PAGES == 'true' \\}\\}/,
  'Pages deploy job must be opt-in so a repository with Pages disabled does not fail every main push',
)

assert.match(
  workflow,
  /uses: actions\\/upload-pages-artifact@v3[\\s\\S]*?if: \\$\\{\\{ vars\\.ENABLE_GITHUB_PAGES == 'true' \\}\\}|if: \\$\\{\\{ vars\\.ENABLE_GITHUB_PAGES == 'true' \\}\\}[\\s\\S]*?uses: actions\\/upload-pages-artifact@v3/,
  'Pages artifact upload must be skipped when Pages deployment is disabled',
)

console.log('GitHub Pages deploy is explicit opt-in while build/test gates remain intact')
