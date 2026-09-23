import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const lab = await readFile(new URL('../../src/pages/bodyhub/RadiologyReconstructionLab.tsx', import.meta.url), 'utf8')
const engine = await readFile(new URL('../../src/pages/bodyhub/BiomedicalEngineLab.tsx', import.meta.url), 'utf8')
const explorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')

// Reachability: Body Exposure -> Biomedical engine -> Imaging 3D -> workstation.
assert.match(explorer, /const BiomedicalEngineLab = lazy/, 'Body Exposure must keep the biomedical engine lazy route')
assert.match(explorer, /key: 'mesin', label: 'Biomedical engine'/, 'Biomedical engine must remain user-reachable from Body Exposure')
assert.match(engine, /key: 'imaging', label: 'Imaging 3D'/, 'Imaging 3D must remain a reachable biomedical-engine subview')
assert.match(engine, /import \{ RadiologyReconstructionLab \} from '\.\/RadiologyReconstructionLab'/, 'Imaging engine must import the reconstruction workstation')
assert.match(engine, /<RadiologyReconstructionLab\s*\/>/, 'Imaging 3D must mount the interactive workstation')

// This must be a live WebGL simulation, not a screenshot or decorative picture.
assert.match(lab, /new THREE\.WebGLRenderer/, 'workstation must own a live WebGL renderer')
assert.match(lab, /new OrbitControls/, 'workstation must support orbit navigation')
assert.match(lab, /data-radiology-reconstruction3d/, 'live reconstruction canvas must expose a stable QA identity')
assert.doesNotMatch(lab, /<img\b|backgroundImage\s*:/, 'workstation must not substitute a screenshot for the interactive reconstruction')

// KaloLumen-inspired interaction classes requested by the user.
for (const mode of ['surface', 'volume', 'overlay']) {
  assert.match(lab, new RegExp(`'${mode}'`), `${mode} reconstruction mode must remain available`)
}
assert.match(lab, /Lower reconstruction threshold/, 'linked lower threshold control must remain available')
assert.match(lab, /Upper reconstruction threshold/, 'linked upper threshold control must remain available')
for (const preset of ['Bone', 'Soft tissue', 'Lung', 'Vessel', 'Wide']) {
  assert.match(lab, new RegExp(`label: '${preset}'`), `${preset} window preset must remain available`)
}
assert.match(lab, /Disconnected hidden/, 'disconnected-component suppression must remain interactive')
assert.match(lab, /Component isolation/, 'per-tissue component isolation must remain reachable')
assert.match(lab, /new THREE\.Plane/, '3D clipping section must use a real Three.js clipping plane')
for (const plane of ['Sagittal', 'Coronal', 'Axial']) {
  assert.match(lab, new RegExp(`'${plane}'`), `${plane} MPR teaching view must remain present`)
}
assert.match(lab, /new THREE\.StereoCamera/, 'side-by-side stereoscopic rendering must remain real camera rendering')
assert.match(lab, /setScissor/, 'stereo rendering must split the live WebGL viewport rather than duplicate a picture')
assert.match(lab, /Lightweight render/, 'bounded low-power rendering mode must remain user-selectable')

// Mobile/runtime hygiene.
assert.match(lab, /Math\.min\(window\.devicePixelRatio \|\| 1, quality === 'light' \? 1\.25 : 2\)/, 'mobile DPR must remain bounded')
assert.match(lab, /IntersectionObserver/, 'offscreen reconstruction must pause')
assert.match(lab, /visibilitychange/, 'background-tab reconstruction must pause')
assert.match(lab, /ResizeObserver/, 'renderer must resize with its container')
assert.match(lab, /webglcontextlost/, 'WebGL context loss must fail closed')
assert.match(lab, /renderLists\.dispose\(\)/, 'renderer-owned render lists must be disposed')
assert.match(lab, /forceContextLoss\(\)/, 'WebGL context must be released on teardown')
assert.ok((lab.match(/min-h-11/g) ?? []).length >= 4, 'primary workstation controls must retain mobile-class touch targets')

// Scientific and clinical boundary: the current mode is deliberately synthetic.
assert.match(lab, /synthetic phantom/i, 'synthetic teaching geometry must be labelled explicitly')
assert.match(lab, /generated geometry, not a DICOM study/i, 'UI must not imply that synthetic geometry is a patient scan')
assert.match(lab, /DICOM import, MRI\/CT segmentation, STL\/DICOM export, patient measurement and diagnostic inference are intentionally not claimed/i, 'unsupported clinical-imaging functions must remain fail-closed')
assert.match(lab, /approximate spatial cues only, not anatomical geometry/i, 'primitive teaching geometry must not be presented as anatomical source geometry')
assert.match(engine, /REFERENCE ATLAS · NOT PATIENT DICOM/, 'existing source-backed atlas must retain its patient-DICOM boundary')
assert.match(engine, /BLOCKED UNTIL REAL DATA/, 'real voxel processing must remain visibly blocked until real validated data exists')

console.log('Radiology reconstruction workstation gate: reachable live WebGL surface/volume/overlay, linked thresholding, component isolation, 3D clipping + tri-view MPR, stereo SBS, bounded performance/lifecycle, and synthetic-vs-patient boundary locked.')
