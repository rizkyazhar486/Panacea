import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { catatanModel, daftarModelRujukan, jalurModel, modelRujukan } from '../../src/lib/organModels.ts'

const lambung = modelRujukan('stomach')
assert.equal(lambung?.id, 'stomach')
assert.equal(lambung?.sumber, 'bodyparts3d')
assert.equal(jalurModel(lambung!), 'organs-atlas/stomach.glb')

const jantung = modelRujukan('heart')
assert.equal(jantung?.id, 'jantung-ruang')
assert.equal(jantung?.berkas, 'atlas/jantung-ruang.glb')
assert.equal(jalurModel(jantung!), 'atlas/jantung-ruang.glb')
assert.equal(modelRujukan('jantung-ruang')?.focusKey, 'heart')
assert.match(catatanModel(jantung!), /BodyParts3D/)
assert.doesNotMatch(jalurModel(jantung!), /organs\/heart/)

const paru = modelRujukan('lungs')
assert.equal(paru?.berkas, 'atlas/paru.glb')
assert.equal(paru?.sumber, 'z-anatomy')
assert.match(catatanModel(paru!), /Z-Anatomy/)
assert.doesNotMatch(catatanModel(paru!), /AI-generated/)

assert.equal(modelRujukan('liver'), undefined, 'there is no reference liver cut, so the AI liver is not offered')
assert.equal(modelRujukan(''), undefined)
assert.equal(modelRujukan('not-an-organ'), undefined)

const daftar = daftarModelRujukan()
assert.deepEqual(daftar.slice(0, 3).map((m) => m.label), ['Heart', 'Lungs', 'Kidneys'])
assert.ok(daftar.some((m) => m.id === 'stomach'))
assert.ok(daftar.some((m) => m.id === 'obgin'))
assert.equal(daftar.some((m) => m.sumber === 'ai'), false)
assert.match(catatanModel(daftar.find((m) => m.id === 'obgin')!), /HuBMAP/)

const layar = readFileSync(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
assert.match(layar, /id="organ-dekat"/, 'the organ close-up row sits above the atlas viewer')
assert.match(layar, /Organ close-up/)
assert.match(layar, /Whole body/, 'the organ view can return to the same body')
assert.match(layar, /modelDekat \?/, 'the organ mesh replaces the body only after an organ with a reference cut is chosen')
assert.match(layar, /catatanModel\(modelDekat\)/, 'provenance is shown for the organ that is open')

console.log('model-rujukan: heart and lungs use shipped atlas cuts; AI meshes do not')
