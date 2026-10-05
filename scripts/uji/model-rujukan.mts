import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { barisAsal, catatanModel, daftarModelRujukan, jalurModel, modelRujukan } from '../../src/lib/organModels.ts'

const lambung = modelRujukan('stomach')
assert.equal(lambung?.id, 'stomach')
assert.equal(lambung?.sumber, 'bodyparts3d')
assert.equal(jalurModel(lambung!), 'organs-atlas/stomach.glb')

const jantung = modelRujukan('heart')
assert.equal(jantung?.id, 'jantung-ruang')
assert.equal(jantung?.berkas, 'atlas/jantung-ruang.glb')
assert.equal(jantung?.sumber, 'hubmap')
assert.equal(jalurModel(jantung!), 'atlas/jantung-ruang.glb')
assert.equal(modelRujukan('jantung-ruang')?.focusKey, 'heart')
assert.match(catatanModel(jantung!), /Visible Human female heart/)
assert.doesNotMatch(catatanModel(jantung!), /BodyParts3D 4\.0/)
assert.doesNotMatch(jalurModel(jantung!), /organs\/heart/)

const paru = modelRujukan('lungs')
assert.equal(paru?.berkas, 'atlas/paru.glb')
assert.equal(paru?.sumber, 'z-anatomy')
assert.match(catatanModel(paru!), /Z-Anatomy/)
assert.equal(barisAsal(paru!), '13 structures · Z-Anatomy · not this person · revision unpinned')
assert.doesNotMatch(barisAsal(paru!), /CC BY/)
assert.doesNotMatch(catatanModel(paru!), /AI-generated/)

const hati = modelRujukan('liver')
assert.equal(hati?.id, 'bilier')
assert.equal(hati?.label, 'Liver & biliary')
assert.match(catatanModel(hati!), /liver, biliary tree and pancreas/)
assert.doesNotMatch(jalurModel(hati!), /gastro/)

assert.equal(modelRujukan(''), undefined)
assert.equal(modelRujukan('not-an-organ'), undefined)
assert.equal(modelRujukan('brain'), undefined, 'the nerve module is not a brain')

const daftar = daftarModelRujukan()
assert.deepEqual(daftar.slice(0, 3).map((m) => m.label), ['Heart', 'Lungs', 'Liver & biliary'])
assert.equal(daftar.find((m) => m.focusKey === 'kidneys')?.label, 'Kidney & urinary tract')
assert.equal(modelRujukan('skin')?.berkas, 'atlas/kulit.glb')
assert.equal(modelRujukan('breast')?.berkas, 'atlas/payudara.glb')
assert.ok(daftar.some((m) => m.id === 'stomach'))
assert.ok(daftar.some((m) => m.id === 'obgin'))
assert.equal(daftar.some((m) => m.sumber === 'ai'), false)
assert.match(catatanModel(daftar.find((m) => m.id === 'obgin')!), /female pelvis/)

const layar = readFileSync(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
assert.match(layar, /id="organ-dekat"/, 'the organ close-up row sits above the atlas viewer')
assert.match(layar, /Organ close-up/)
assert.match(layar, /Whole body/, 'the organ view can return to the same body')
assert.match(layar, /modelDekat \?/, 'the organ mesh replaces the body only after an organ with a reference cut is chosen')
assert.match(layar, /barisAsal\(modelDekat\)/, 'the first screen keeps provenance to one line')
assert.match(readFileSync(new URL('../../src/components/OrganModel3D.tsx', import.meta.url), 'utf8'), /computeVertexNormals/, 'close-up shading follows the mesh instead of flat facets')

console.log('model-rujukan: heart, lungs and liver use shipped atlas cuts; AI meshes do not')
