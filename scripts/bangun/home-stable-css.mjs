// P0: never attach Home CSS to Vite's lazy-import hash. Stale iPhone/desktop
// tabs can reference deleted Home-<hash>.css after each production deploy.
// The stable public URL is regenerated for every build; no source styles are lost.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SOURCES = [
  'home-liquid-reference.css',
  'home-human-interface.css',
  'home-liquid-control-layer.css',
  'home-compact-responsive.css',
]

export function homeStyles(read = (name) => readFileSync(join(ROOT, 'src/styles', name), 'utf8')) {
  const importSource = read('home-green-material-v48.css')
  const material = "@import url('/ui-iterations/panacea-green-material-v48.css?v=20260916-1');"
  if (!importSource.includes(material)) throw new Error('Home green material import changed: review stable asset ordering')
  return `/* Panacea Home stable stylesheet. Rebuilt from src/styles/home-*.css by scripts/bangun/home-stable-css.mjs.
   Deliberately un-hashed: cached tabs must not fail Vite dynamic CSS preloads after deploy. */
${material}

` + SOURCES.map((name) => `/* Source: src/styles/${name} */
${read(name)}
`).join('\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = join(ROOT, 'public/home-styles.css')
  writeFileSync(path, homeStyles())
  console.log('stable Home CSS generated: public/home-styles.css')
}
