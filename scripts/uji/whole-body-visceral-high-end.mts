import assert from 'node:assert/strict'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT, anatomySourceNameMatchesHint } from '../../src/lib/anatomySourceNodeRegistry.ts'
import { compileAtlasAgainstSource } from '../../src/lib/anatomy/atlasCompiler.ts'
import { traceAtlasPath } from '../../src/lib/anatomy/atlasGraph.ts'
import { validateAtlasManifest } from '../../src/lib/anatomy/atlasKernel.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { buildMeasuredAtlasRenderPlan } from '../../src/lib/anatomy/measuredRenderPlanner.ts'

const manifest = COMPLETE_WHOLE_BODY_ATLAS
const ids = new Set(manifest.nodes.map((node) => node.id))
assert.ok(manifest.nodes.length >= 360, `Expected deep visceral atlas expansion; got ${manifest.nodes.length} nodes.`)
assert.equal(ids.size, manifest.nodes.length, 'No duplicate semantic atlas ids are permitted.')

const validation = validateAtlasManifest(manifest)
assert.deepEqual(validation, [], validation.map((issue) => `${issue.code}: ${issue.nodeId ?? '-'} ${issue.message}`).join('\n'))

function requirePath(from: string, to: string, kinds: Parameters<typeof traceAtlasPath>[3]) {
  const path = traceAtlasPath(manifest, from, to, kinds)
  assert.ok(path, `Missing atlas path ${from} -> ${to} via ${kinds?.join(', ') ?? 'all relations'}.`)
  return path
}

const alimentary = requirePath('gi:esophagus', 'gi:anal-canal', ['continuous-with'])
for (const checkpoint of ['gi:stomach', 'gi:duodenum', 'gi:jejunum', 'gi:ileum', 'gi:cecum', 'gi:transverse-colon', 'gi:sigmoid-colon', 'gi:rectum']) {
  assert.equal(alimentary.nodeIds.includes(checkpoint), true, `Alimentary path must include ${checkpoint}.`)
}

const biliary = requirePath('gi:right-hepatic-duct', 'gi:major-duodenal-papilla', ['continuous-with'])
assert.equal(biliary.nodeIds.includes('gi:common-hepatic-duct'), true)
assert.equal(biliary.nodeIds.includes('gi:common-bile-duct'), true)
const gallbladder = requirePath('gi:gallbladder-neck', 'gi:major-duodenal-papilla', ['continuous-with'])
assert.equal(gallbladder.nodeIds.includes('gi:cystic-duct'), true)
assert.equal(gallbladder.nodeIds.includes('gi:common-bile-duct'), true)
requirePath('gi:main-pancreatic-duct', 'gi:major-duodenal-papilla', ['continuous-with'])

const mesentericSupply = requirePath('cv:abdominal-aorta', 'gi:small-intestine', ['continuous-with', 'supplies'])
assert.equal(mesentericSupply.nodeIds.includes('cv:superior-mesenteric-artery'), true)
const renalPerfusion = requirePath('cv:abdominal-aorta', 'urinary:right-kidney', ['continuous-with', 'supplies'])
assert.equal(renalPerfusion.nodeIds.includes('cv:right-renal-artery'), true)

const portal = requirePath('cv:superior-mesenteric-vein', 'cv:inferior-vena-cava', ['drains', 'supplies'])
assert.equal(portal.nodeIds.includes('cv:portal-vein'), true)
assert.equal(portal.nodeIds.includes('gi:liver'), true)
assert.equal(portal.nodeIds.some((id) => id.endsWith('hepatic-vein')), true)

const renalReturn = requirePath('urinary:left-kidney', 'cv:inferior-vena-cava', ['drains'])
assert.equal(renalReturn.nodeIds.includes('cv:left-renal-vein'), true)

for (const side of ['right', 'left'] as const) {
  const urine = requirePath(`urinary:${side}-collecting-duct`, 'urinary:urethra-reference', ['continuous-with'])
  for (const checkpoint of [
    `urinary:${side}-minor-calyces`,
    `urinary:${side}-major-calyces`,
    `urinary:${side}-renal-pelvis`,
    `urinary:${side}-ureter`,
    'urinary:bladder',
    'urinary:bladder-neck',
  ]) assert.equal(urine.nodeIds.includes(checkpoint), true, `Urinary path must include ${checkpoint}.`)
}

// Lower-body lymph must NOT be routed to the right lymphatic duct. Both lower limbs
// drain centrally through lumbar trunks/cisterna chyli/thoracic duct to the LEFT venous angle.
assert.equal(
  traceAtlasPath(manifest, 'lymph:right-inguinal-nodes', 'cv:right-venous-angle', ['drains']),
  null,
  'Right lower-limb lymph must not be incorrectly routed to the right venous angle.',
)
const rightLowerBodyToLeftAngle = requirePath('lymph:right-inguinal-nodes', 'cv:left-venous-angle', ['drains'])
assert.equal(rightLowerBodyToLeftAngle.nodeIds.includes('lymph:cisterna-chyli'), true)
assert.equal(rightLowerBodyToLeftAngle.nodeIds.includes('lymph:thoracic-duct'), true)
const leftLowerBodyToLeftAngle = requirePath('lymph:left-inguinal-nodes', 'cv:left-venous-angle', ['drains'])
assert.equal(leftLowerBodyToLeftAngle.nodeIds.includes('lymph:thoracic-duct'), true)

const rightUpperLymph = requirePath('lymph:right-axillary-nodes', 'cv:right-venous-angle', ['drains'])
assert.equal(rightUpperLymph.nodeIds.includes('lymph:right-lymphatic-duct'), true)
const leftUpperLymph = requirePath('lymph:left-axillary-nodes', 'cv:left-venous-angle', ['drains'])
assert.equal(leftUpperLymph.nodeIds.includes('lymph:thoracic-duct'), true)

const compiled = compileAtlasAgainstSource(manifest, INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT)
assert.equal(compiled.totals.nodeCount, manifest.nodes.length)
assert.ok(compiled.totals.resolvedTriangles > 0)

// Any resolved source match must remain traceable to the exact reviewed hint that produced it.
for (const entry of compiled.nodes) {
  for (const match of entry.sourceMatches) {
    for (const sourceName of match.names) {
      assert.equal(
        anatomySourceNameMatchesHint(sourceName, match.hint),
        true,
        `${entry.node.id} source node ${sourceName} is not justified by reviewed hint ${match.hint}.`,
      )
    }
    if (entry.node.source.files?.length) {
      assert.equal(entry.node.source.files.includes(match.file), true, `${entry.node.id} escaped its source-file allowlist.`)
    }
  }
}

const renderPlan = buildMeasuredAtlasRenderPlan(
  compiled,
  { systems: ['digestive', 'urinary', 'lymphatic', 'endocrine', 'reproductive', 'cardiovascular'], includeReferenceOnly: true },
  {
    triangleBudget: 50_000_000,
    textureBudgetMegabytes: 8_192,
    nodeBudget: 2_048,
    devicePixelRatio: 2,
    viewportWidth: 1440,
    viewportHeight: 900,
  },
)
assert.equal(
  renderPlan.nodes.some((entry) => entry.node.geometryStatus === 'reference-only' || entry.node.geometryStatus === 'planned'),
  false,
  'Deep visceral reference-only nodes must never be promoted into gross render residency.',
)
for (const id of ['urinary:right-glomerulus', 'gi:portal-triad-reference', 'repro:uterus', 'endo:pancreatic-islet-reference']) {
  assert.ok(renderPlan.skipped.some((entry) => entry.nodeId === id && entry.reason.includes('reference')), `${id} must remain explicitly non-renderable gross geometry.`)
}

console.log(`Deep visceral whole-body atlas: ${manifest.nodes.length} semantic nodes; GI, biliary/pancreatic, portal, renal/urinary, lymphatic, endocrine and reproductive fail-closed topology verified.`)
