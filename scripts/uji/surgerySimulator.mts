import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const data = readFileSync('src/lib/surgerySimulator.ts', 'utf8')
const ui = readFileSync('src/pages/bodyhub/SurgerySimulatorLab.tsx', 'utf8')
const shell = readFileSync('src/pages/bodyhub/SurgicalLab.tsx', 'utf8')
const bodyExplorer = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')

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

assert.match(ui, /data-surgery-simulator="anatomy-grounded"/, 'Simulator root marker is required')
assert.match(ui, /<AtlasViewer3D/, 'Simulator must use the verified atlas viewer')
assert.equal((ui.match(/<AtlasViewer3D/g) ?? []).length, 1, 'Only one dedicated surgical atlas canvas is allowed at a time')
assert.match(ui, /Patient data<\/span><b className="text-neutral-300">None/, 'Simulator must not imply patient-specific data')
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

console.log('✓ Surgery simulator scenarios, provenance, geometry boundaries, cross-section bridge, and integration verified')
