import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const data = readFileSync('src/lib/surgerySimulator.ts', 'utf8')
const lapAppy = readFileSync('src/lib/surgerySimulatorAppendectomy.ts', 'utf8')
const ui = readFileSync('src/pages/bodyhub/SurgerySimulatorLab.tsx', 'utf8')
const shell = readFileSync('src/pages/bodyhub/SurgicalLab.tsx', 'utf8')
const bodyExplorer = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')
const mandatoryReferenceRegistry = JSON.parse(readFileSync('data/source-registry/anatomy/thebuggeddev-anatomy.json', 'utf8'))

assert.match(data, /id: 'caesarean-anatomy'/, 'Caesarean scenario is required')
assert.match(data, /atlasFile: 'atlas\/obgin\.glb'/, 'Caesarean must use the female pelvis reference atlas')
assert.match(data, /HuBMAP Human Reference Atlas, female reference body/, 'Caesarean provenance must stay explicit')
assert.match(data, /does not morph the uterus into pregnancy/, 'Pregnancy-specific geometry boundary must remain explicit')
assert.match(data, /placenta\/fetus geometry/, 'Placenta/fetus must not be fabricated')

assert.match(data, /id: 'transseptal-ice'/, 'Transseptal + ICE scenario is required')
assert.match(data, /atlasFile: 'cardio\/cardio\.glb'/, 'Transseptal must use the cardiovascular reference atlas')
assert.match(data, /fossa ovalis/, 'Transseptal must teach the true septal relationship')
assert.match(data, /ICE long-axis orientation/, 'ICE long-axis teaching state is required')
assert.match(data, /ICE orthogonal \/ short-axis orientation/, 'ICE orthogonal teaching state is required')
assert.match(data, /probe axis and transseptal needle axis are not assumed to be identical/, 'ICE beam and needle axes must not be conflated')
assert.match(data, /No force, tissue puncture threshold, haptic feedback or “safe” success zone is simulated/, 'No fake safe zone or puncture mechanics')
assert.match(data, /shimayuz\/cardiac-atlas-lab/, 'Open-source prototype attribution must remain visible')

assert.match(data, /SurgeryAtlasId = 'obgin' \| 'cardio' \| 'gastro'/, 'Gastro atlas must be an explicit supported surgical source')
assert.match(data, /LAP_APPENDIX_SCENARIO/, 'DIYAI Lap Appy scenario must be wired into the simulator')
assert.match(lapAppy, /id: 'diyai-laparoscopic-appendectomy'/, 'DIYAI laparoscopic appendectomy scenario is required')
assert.match(lapAppy, /atlasFile: 'atlas\/gastro\.glb'/, 'Lap Appy must use the existing gastro reference atlas')
assert.match(lapAppy, /BodyParts3D 4\.0 \/ DBCLS/, 'Lap Appy geometry provenance must stay explicit')
assert.match(lapAppy, /10\.1093\/nar\/gkn613/, 'BodyParts3D publication DOI must match repository atlas provenance')
assert.doesNotMatch(lapAppy, /10\.1093\/database\/bap012|Database \(Oxford\)/, 'Unverified BodyParts3D citation text must not return')
assert.match(lapAppy, /PMID:39720866/, 'Appendix variation systematic review must remain pinned')
assert.match(lapAppy, /retrocecal, pelvic, retro-ileal, pre-ileal/, 'Lap Appy must teach positional variation rather than a universal mesh')
assert.match(lapAppy, /three taeniae coli converge at the appendiceal base/, 'Evidence-grounded appendiceal base landmark is required')
assert.match(lapAppy, /Human academic review is currently pending/, 'Human academic review status must remain explicit')
assert.match(lapAppy, /AI-assisted educational draft/, 'AI generation must be disclosed')
assert.match(lapAppy, /not an operative manual, credentialing tool, autonomous surgical advisor or substitute for supervised surgical training/, 'Lap Appy must remain an anatomy/cognitive trainer rather than an operative recipe')
assert.match(lapAppy, /No appendiceal-base division line, stapler trajectory, ligature position or “safe margin” is generated from the atlas/, 'Lap Appy must not infer a procedural safe margin from reference geometry')
assert.doesNotMatch(lapAppy, /trocar.{0,30}(?:mm|cm)|insufflat.{0,30}mmHg|stapler.{0,30}(?:mm|load)|energy.{0,20}(?:watt|\bW\b)|force.{0,20}\bN\b/i, 'DIYAI Lap Appy must not encode operative device settings or force')

// User-required interactive references are pinned visibly in the default DIYAI
// scenario while remaining fail-closed for code/asset reuse until licensing and
// provenance are explicitly cleared.
assert.match(lapAppy, /https:\/\/github\.com\/thebuggeddev\/anatomy/, 'thebuggeddev/anatomy must remain a mandatory interactive reference')
assert.match(lapAppy, /https:\/\/breath-atlas\.thebuggeddev\.chatgpt\.site\//, 'Breath Atlas must remain a mandatory interactive reference')
assert.match(lapAppy, /no code or assets are vendored until an explicit upstream license and asset provenance are verified/, 'Unlicensed upstream implementation must stay external-only')
assert.equal(mandatoryReferenceRegistry.id, 'thebuggeddev_anatomy', 'Mandatory anatomy reference registry id must stay stable')
assert.equal(mandatoryReferenceRegistry.license.status, 'CHECK_REQUIRED', 'Unverified upstream license must fail closed')
assert.equal(mandatoryReferenceRegistry.license.commercialUse, 'UNKNOWN', 'Commercial reuse must not be inferred')
assert.equal(mandatoryReferenceRegistry.usage.runtime, false, 'External reference must not become a silent runtime dependency')
assert.equal(mandatoryReferenceRegistry.adapter.status, 'NOT_APPLICABLE', 'External reference must not acquire a runtime adapter before licensing/provenance clearance')
assert.equal(mandatoryReferenceRegistry.repository, 'https://github.com/thebuggeddev/anatomy', 'Mandatory anatomy repository must stay registered')
assert.equal(mandatoryReferenceRegistry.homepage, 'https://breath-atlas.thebuggeddev.chatgpt.site/', 'Breath Atlas surface must stay registered')

assert.match(ui, /data-surgery-simulator="anatomy-grounded"/, 'Simulator root marker is required')
assert.match(ui, /<AtlasViewer3D/, 'Simulator must use the verified atlas viewer')
assert.equal((ui.match(/<AtlasViewer3D/g) ?? []).length, 1, 'Only one dedicated surgical atlas canvas is allowed at a time')
assert.match(ui, /Patient data<\/span><b className="text-neutral-300">None/, 'Simulator must not imply patient-specific data')
assert.match(ui, /Do It Yourself with AI #DIYAI/, 'DIYAI identity must be visible in the simulator')
assert.match(ui, /AI-assisted · disclosed/, 'AI-assisted content must be disclosed')
assert.match(ui, /Human review pending/, 'Human academic-review status must be visible')
assert.match(ui, /not academically reviewed/, 'UI must fail closed instead of implying unrecorded expert review')
assert.match(ui, /Source gap:/, 'Missing named geometry must be shown, not hidden')
assert.match(ui, /partsForModule\(scenario\.atlas\)/, 'Female pelvis scenario must use generated reference metadata')
assert.match(ui, /CARDIO_PARTS/, 'Cardiac scenario must use named cardiovascular source metadata')
assert.match(ui, /Open-source Cardiac Atlas Lab reference prototype/, 'Reference implementation link should remain accessible')
assert.doesNotMatch(ui, /SphereGeometry|BoxGeometry|CapsuleGeometry|CylinderGeometry/, 'Surgery UI must not fabricate anatomy primitives')
assert.doesNotMatch(ui, /Math\.random/, 'Surgical simulator must remain deterministic')

// Cross-sectional correlation must drive the SAME evidence-bearing whole-body viewer,
// not a disconnected decorative canvas.
assert.match(ui, /data-surgery-correlation="shared-body3d"/, 'Shared 3D/cross-section correlation panel is required')
for (const label of ['Source 3D', 'Axial CT', 'Coronal CT', 'Sagittal CT', 'Exploded 3D']) {
  assert.match(ui, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${label} preset must remain available`)
}
assert.match(ui, /not patient DICOM, CT segmentation, navigation coordinates or operative planning/, 'Cross-section teaching boundary must remain explicit')
assert.match(ui, /onSharedView\?\.\(view\)/, 'Simulator must emit shared-view state')

assert.match(shell, /SurgerySimulatorLab/, 'Surgical simulator must remain wired into Body Exposure')
assert.match(shell, /onSharedView=\{onSharedView\}/, 'Surgical shell must forward shared-view state to Body Exposure')
assert.match(bodyExplorer, /onSharedView=\{\(view\) => \{/, 'Body Exposure must receive surgery shared-view state')
assert.match(bodyExplorer, /setRenderMode\(view\.renderMode\)/, 'Surgery must drive the shared Body3D render mode')
assert.match(bodyExplorer, /setSlicePlane\(view\.slicePlane\)/, 'Surgery must drive the shared Body3D slice plane')
assert.match(bodyExplorer, /setSlicePos\(view\.slicePos\)/, 'Surgery must drive the shared Body3D slice position')
assert.match(bodyExplorer, /setUnfold\(view\.unfold\)/, 'Surgery must drive the shared Body3D exploded view')

console.log('✓ Surgery simulator scenarios, provenance, mandatory references, academic gates, geometry boundaries, cross-section bridge, and integration verified')
