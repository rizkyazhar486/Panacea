import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workbench = readFileSync('src/pages/bodyhub/ZAnatomyAtlasWorkbench.tsx', 'utf8')
const precisionLab = readFileSync('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8')
const credits = readFileSync('public/anatomy/CREDITS.txt', 'utf8')

for (const asset of [
  'skeleton.glb',
  'skeletal-light.glb',
  'muscular-visible.glb',
  'muscular.glb',
  'clinical.glb',
  'heart.glb',
]) {
  assert.match(workbench, new RegExp(asset.replace('.', '\\.')), `Z-Anatomy workbench must disclose shipped source bundle ${asset}.`)
  assert.match(credits, new RegExp(asset.replace('.', '\\.')), `Anatomy credits must retain ${asset}.`)
}

assert.match(workbench, /Z-Anatomy source geometry/i, 'Workbench must identify Z-Anatomy source geometry.')
assert.match(workbench, /BodyParts3D lineage/i, 'Workbench must disclose BodyParts3D lineage.')
assert.match(workbench, /CC BY-SA 4\.0 derivative bundle/i, 'Workbench must expose share-alike derivative licensing.')
assert.match(credits, /Z-Anatomy/i, 'Repository credits must retain Z-Anatomy attribution.')
assert.match(credits, /BodyParts3D/i, 'Repository credits must retain BodyParts3D attribution.')
assert.match(credits, /Creative Commons Attribution-ShareAlike 4\.0 \(CC BY-SA 4\.0\)/i, 'Repository credits must retain CC BY-SA 4.0 licensing.')

assert.match(workbench, /onEnableLayer\?\./, 'Workbench must control the shared anatomy layer system.')
assert.match(workbench, /onHighlight\?\./, 'Workbench must route selected structures into the shared viewer highlighter.')
assert.match(workbench, /onFocusRegion\?\./, 'Workbench must route selected structures into shared camera focus.')
assert.match(workbench, /WHOLE_BODY_REGIONS\.flatMap/, 'Structure finder must derive its entries from the reviewed whole-body catalogue rather than a second hand-written anatomy list.')
assert.match(workbench, /Counts describe Panacea catalogue targets, not the number of meshes inside a GLB/i, 'Layer counts must not masquerade as source mesh counts.')
assert.match(workbench, /Missing structures are not synthesized/i, 'Workbench must preserve missing-geometry disclosure.')
assert.match(workbench, /not patient-specific anatomy/i, 'Workbench must disclose generic educational geometry.')
assert.match(workbench, /does not imply surgical clearance, pathology, force, tissue strain, or a patient-specific safe corridor/i, 'Workbench must not turn atlas selection into a clinical or biomechanical claim.')
assert.match(workbench, /No second renderer · no remote embed/i, 'Workbench must remain attached to the existing demand-render anatomy viewer.')

assert.match(precisionLab, /import ZAnatomyAtlasWorkbench from '\.\/ZAnatomyAtlasWorkbench'/, 'Whole-body precision lab must mount the Z-Anatomy workbench.')
assert.match(precisionLab, /type Mode = 'z-anatomy' \| 'unfolded' \| 'specialty' \| 'movement'/, 'Existing precision-atlas modes must remain available alongside Z-Anatomy.')
assert.match(precisionLab, /useState<Mode>\('z-anatomy'\)/, 'Z-Anatomy must be the first visible precision-atlas experience.')
assert.match(precisionLab, /\['z-anatomy', 'Z-Anatomy atlas'\]/, 'Z-Anatomy must have an explicit navigation tab.')
assert.match(precisionLab, /mode === 'unfolded'/, 'Existing unfolded anatomy mode must be preserved.')
assert.match(precisionLab, /mode === 'specialty'/, 'Existing specialty atlas mode must be preserved.')
assert.match(precisionLab, /mode === 'movement'/, 'Existing biomechanics mode must be preserved.')

console.log('Body Exposure Z-Anatomy workbench preserves real source bundles, provenance, shared-viewer interaction, and scientific boundaries.')