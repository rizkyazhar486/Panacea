// Offline reproducible notices, bounded to Body Exposure rendering/AO tooling.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
export const SOFTWARE = [
  { name: 'three', version: '0.185.1', file: 'LICENSE', sha256: '8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc', source: 'https://raw.githubusercontent.com/mrdoob/three.js/2431a09f46f34c560bc8e44b33be0e567723d5b9/LICENSE', role: 'Runtime 3D renderer and GLTFLoader used by CanonicalBody and Body3D.' },
  { name: 'meshoptimizer', version: '1.1.1', file: 'LICENSE.md', sha256: 'f03037ca7bad1e3eb7f4a63fa6084a8baabd5ba30d3c239a9a7f35705d873e26', source: 'https://raw.githubusercontent.com/zeux/meshoptimizer/dc9d09ed83e1004aef47a1c3c597e0ec64848a37/LICENSE.md', role: 'Three vendors a runtime MeshoptDecoder reporting meshoptimizer 1.1. The separate locked development package is 1.1.1; these versions are not conflated. Its MIT notice matches the pinned upstream 1.1 licence.' },
  { name: 'three-mesh-bvh', version: '0.9.15', file: 'LICENSE', sha256: 'b106ef6198a9862ed2b5b873e944ecf3583c631a84a7462d400ecc1910ce7fee', source: 'https://raw.githubusercontent.com/gkjohnson/three-mesh-bvh/6f4964b7ac00c1ae1ec768615dc434b55c0401e2/LICENSE', role: 'Build-time ambient-occlusion tool in scripts/bake/vertexAo.mjs; not claimed to be imported into the application runtime.' },
]
export const DECODER_SHA256 = 'd428e73a000057c6c94bfcedc3412d0c2dc14ca8800e88553aab05113ad2bf19'
const escapeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

export function validateSoftware(record, locked, installed, text) {
  if (locked?.version !== record.version || installed?.version !== record.version) throw new Error(`${record.name}: version changed; independently recheck source licence`)
  if (locked.license !== 'MIT' || installed.license !== 'MIT') throw new Error(`${record.name}: MIT package metadata changed`)
  if (hash(Buffer.from(text)) !== record.sha256) throw new Error(`${record.name}: licence text differs from primary-source SHA-256`)
}

export function loadSoftware(root) {
  const lock = JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
  const records = SOFTWARE.map((record) => {
    const dir = path.join(root, 'node_modules', record.name)
    const installed = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const text = readFileSync(path.join(dir, record.file), 'utf8')
    validateSoftware(record, lock.packages?.[`node_modules/${record.name}`], installed, text)
    return { ...record, text }
  })
  const decoder = readFileSync(path.join(root, 'node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'))
  if (hash(decoder) !== DECODER_SHA256) throw new Error('Vendored MeshoptDecoder changed; independently recheck version and attribution')
  return records
}

export function renderNotices(records) {
  const sections = records.map((record) => `<section><h2>${escapeHtml(record.name)} <span>${escapeHtml(record.version)}</span></h2>
<p>${escapeHtml(record.role)}</p><p>Licence: MIT. <a href="${escapeHtml(record.source)}">Primary source licence at immutable revision</a>.</p>
<p class="hash">Licence SHA-256: <code>${escapeHtml(record.sha256)}</code></p><pre>${escapeHtml(record.text)}</pre></section>`).join('\n')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Body Exposure software notices</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#000;--link:#00763d;--border:#d4d4d4;--code:#f5f5f5}
@media(prefers-color-scheme:dark){:root{--bg:#101010;--fg:#fff;--link:#00bf63;--border:#444;--code:#202020}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 Montserrat,system-ui,sans-serif}main{max-width:880px;margin:auto;padding:24px 16px 64px;overflow-wrap:anywhere}h1{font-size:1.7rem}h2{font-size:1.2rem}h2 span{font-weight:400}section{border-top:1px solid var(--border);margin-top:24px;padding-top:12px}a{color:var(--link);display:inline-block;min-height:44px;align-content:center}a:focus-visible{outline:3px solid var(--link);outline-offset:3px}pre{background:var(--code);padding:16px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.88em}.hash{font-size:.85em}code{overflow-wrap:anywhere}
</style></head><body><main><a href="provenance.html">Back to anatomical sources and provenance</a>
<h1>Body Exposure software notices</h1>
<p>This bounded notice covers the renderer, its vendored decoder and ambient-occlusion tooling named below. It is not a complete application dependency inventory. Software licensing does not grant rights to anatomical datasets, models, images or clinical content.</p>
<p>Package versions come from package-lock.json and installed package metadata. Full licence texts match the SHA-256 of the cited primary sources, checked on 2026-10-16. The vendored decoder matches Three's pinned source with SHA-256 <code>${DECODER_SHA256}</code>. These checks establish source-level MIT licence evidence for this software slice; they do not certify every third-party right or formal D8 completion.</p>
${sections}
</main></body></html>\n`
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] || '.')
  const output = path.join(root, 'public/bodyexposure/software-notices.html')
  const generated = renderNotices(loadSoftware(root))
  if (process.argv.includes('--write')) { writeFileSync(output, generated); console.log('Body Exposure software notices regenerated.') }
  else if (readFileSync(output, 'utf8') !== generated) throw new Error('Software notices stale or incomplete; regenerate and review')
  else console.log('Body Exposure software notices match pinned licences and locked versions.')
}
