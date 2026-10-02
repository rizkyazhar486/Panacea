// Pemakaian:
//   node scripts/bake/bake-anatomy-ao.mjs --input public/anatomy --output public/anatomy/ao \
//        --baked-on 2026-10-02 [--layers skeletal,muscular]
// Menulis <layer>.ao.bin (uint8 per titik, urutan traverse) dan manifest.json yang menautkan
// tiap berkas ke SHA-256 GLB sumbernya. GLB sumber TIDAK diubah.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { REVISION } from 'three'
import { bakeLayerAo, AO_VERSION, DEFAULT_AO_OPTIONS } from './vertexAo.mjs'
import { LAYERS, loadLayerMeshes, sha256 } from './anatomyLayers.mjs'

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? [...a, [x.slice(2), arr[i + 1]]] : a), []))
const input = args.input ?? 'public/anatomy'
const output = args.output ?? 'public/anatomy/ao'
const bakedOn = args['baked-on']
if (!/^\d{4}-\d{2}-\d{2}$/.test(bakedOn ?? '')) throw new Error('--baked-on YYYY-MM-DD is required (explicit date keeps the output reproducible)')
const wanted = (args.layers ? args.layers.split(',') : LAYERS)
for (const l of wanted) if (!LAYERS.includes(l)) throw new Error(`unknown layer ${l}`)

mkdirSync(output, { recursive: true })
const manifestPath = join(output, 'manifest.json')
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { layers: {} }
const readPkg = (name) => JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version
manifest.purpose = 'Per-vertex ambient occlusion computed from the shipped anatomy GLBs. Sidecar only: source GLBs are unchanged. A layer is used only if its source hash and every mesh vertex count match.'
manifest.version = AO_VERSION
manifest.algorithm = { ...DEFAULT_AO_OPTIONS, kind: 'cosine-hemisphere rays, in-layer occluders, distance-weighted', radiusUnit: 'fraction of layer height' }
manifest.tools = { three: readPkg('three'), threeMeshBvh: readPkg('three-mesh-bvh'), threeRevision: REVISION }
manifest.bakedOn = bakedOn

for (const layer of wanted) {
  const t0 = Date.now()
  const { meshes, sourceSha256 } = await loadLayerMeshes(join(input, `${layer}.glb`))
  const { perMesh, radius, height } = bakeLayerAo(meshes, DEFAULT_AO_OPTIONS)
  const total = perMesh.reduce((n, a) => n + a.length, 0)
  const bin = new Uint8Array(total)
  const meshInfo = []
  let off = 0
  perMesh.forEach((a, i) => { bin.set(a, off); meshInfo.push({ i, name: meshes[i].name, vertexCount: a.length, offset: off }); off += a.length })
  writeFileSync(join(output, `${layer}.ao.bin`), bin)
  manifest.layers[layer] = { sourceFile: `${layer}.glb`, sourceSha256, binFile: `${layer}.ao.bin`, binSha256: sha256(bin), vertexTotal: total, radius: +radius.toFixed(5), height: +height.toFixed(4), meshes: meshInfo }
  console.log(`${layer}: ${meshes.length} meshes, ${total} vertices, ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}
writeFileSync(manifestPath, JSON.stringify(manifest) + '\n')
