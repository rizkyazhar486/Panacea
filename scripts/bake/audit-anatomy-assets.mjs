// node scripts/bake/audit-anatomy-assets.mjs --write   -> menulis data/anatomy-assets/manifest.json
// node scripts/bake/audit-anatomy-assets.mjs --check   -> gagal bila manifest tak sesuai GLB terkirim
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { buildManifest } from './auditAnatomyAssets.mjs'

const out = 'data/anatomy-assets/manifest.json'
const mode = process.argv[2]
if (mode !== '--write' && mode !== '--check') throw new Error('use --write or --check')
const fresh = JSON.stringify(await buildManifest(), null, 2) + '\n'
if (mode === '--write') { mkdirSync('data/anatomy-assets', { recursive: true }); writeFileSync(out, fresh); console.log(`wrote ${out}`) }
else if (readFileSync(out, 'utf8') !== fresh) { console.error(`${out} is stale: re-run with --write`); process.exit(1) }
else console.log('anatomy asset manifest is current')
