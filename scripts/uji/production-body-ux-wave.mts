import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const unified = readFileSync('src/components/PersonalBodyUnifiedSurface.tsx', 'utf8')
const avatar = readFileSync('src/components/PersonalBodyAvatar3D.tsx', 'utf8')
const share = readFileSync('src/lib/sharePersonalBody.ts', 'utf8')
const profile = readFileSync('src/pages/Profile.tsx', 'utf8')
const clinical = readFileSync('src/pages/ClinicalHub.tsx', 'utf8')
const tubuh = readFileSync('src/pages/PusatTubuh.tsx', 'utf8')
const dashboard = readFileSync('src/pages/Dashboard.tsx', 'utf8')
const body = readFileSync('src/pages/UnifiedBodyWorkspace.tsx', 'utf8')
const exposure = readFileSync('src/pages/BodyExposureOS.tsx', 'utf8')
const projector = readFileSync('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', 'utf8')
const main = readFileSync('src/main.tsx', 'utf8')
const drug = readFileSync('src/pages/DrugInfo.tsx', 'utf8')
const catalog = readFileSync('src/lib/obatKatalog.ts', 'utf8')

assert.match(unified, /PersonalBodyAvatar3D/)
assert.match(unified, /UnifiedHumanSimulationProjector/)
assert.match(unified, /sharePersonalBodyCanvas/)
assert.match(unified, /PersonalAvatarCameraCapture/)
assert.match(unified, /data-personal-body-unified-surface="v1"/)
assert.match(tubuh, /PersonalBodyUnifiedSurface/, 'live /tubuh route must expose the unified personal body surface')
assert.match(dashboard, /to="\/clinical-hub"/, 'patient dashboard must reach the visual clinical workspace in one tap')

for (const [name, source] of [['profile', profile], ['clinical', clinical], ['your-body', body]] as const) {
  assert.match(source, /PersonalBodyUnifiedSurface/, `${name} must expose the same personal-body surface`)
}

assert.match(exposure, /key: 'identity'/)
assert.match(exposure, /projectorDomain: 'personal-avatar'/)
assert.match(projector, /const hideReferenceAtlasCanvas = isEndoscopy/)
assert.doesNotMatch(projector, /isStandaloneBodyIdentity/)

assert.match(avatar, /preserveDrawingBuffer:\s*true/)
assert.match(avatar, /dataset\.personalAvatarCanvas = 'true'/)
assert.match(share, /navigator\.share/)
assert.match(share, /navigator\.canShare/)
assert.match(share, /canvas\.toBlob/)

assert.match(body, /PRIMARY_VIEW_KEYS/)
assert.match(body, /More features/)
assert.match(main, /production-readability-v1\.css/)

assert.match(drug, /officialDose/)
assert.match(drug, /Official label dose/)
assert.match(catalog, /jumlahDenganDosisSkdi/)

console.log('production body UX wave: unified avatar/anatomy surface, share, simple navigation, readability and sourced dose fallback locked')
