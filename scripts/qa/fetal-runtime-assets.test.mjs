import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const manifest = JSON.parse(fs.readFileSync('bodyexposure/manifest/structures.json')).structures
const fetal = manifest.filter(r => r.panacea_body_id === 'FETUS')
const shipped = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/fetus_source_web_assets.json'))
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
for (const lod of ['LOD2', 'LOD3']) test(`fetal ${lod}: source groups, complete identity and finite web geometry`, async () => {
  const ids = []; let triangles = 0
  for (const system of ['digestive', 'endocrine', 'lymphatic', 'respiratory', 'urinary']) {
    const filename = `fetus.${system}.${lod}.glb`
    const buf = fs.readFileSync(`public/bodyexposure/${filename}`)
    assert.equal(buf.length, shipped.files[filename].bytes)
    assert.equal(createHash('sha256').update(buf).digest('hex'), shipped.files[filename].sha256)
    const gltf = await new Promise((resolve, reject) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', resolve, reject))
    gltf.scene.updateMatrixWorld(true)
    gltf.scene.traverse(o => {
      if (!o.isMesh) return
      let semantic = o
      while (semantic && !semantic.userData.panacea_structure_id) semantic = semantic.parent
      const data = semantic?.userData ?? {}; const id = data.panacea_structure_id
      assert.ok(id, 'packed mesh retains semantic identity'); ids.push(id)
      assert.equal(data.panacea_clinically_reviewed, false)
      assert.equal(data.panacea_review_status, 'review_required')
      assert.equal(data.panacea_version, 'body_v015')
      const positions = o.geometry.attributes.position
      assert.ok(Array.from(positions.array).every(Number.isFinite))
      triangles += (o.geometry.index?.count ?? positions.count) / 3
      if (system === 'respiratory') {
        const side = id.split('.').at(-1)
        assert.ok(['L', 'R'].includes(side))
        assert.deepEqual(data.panacea_source_labels, side === 'L' ? [1, 2] : [3, 4, 5])
        assert.match(data.panacea_source, /7d75fa96162245326f7046bb4df0a41cdeaf7f5c/)
        // GLTF axes are Y-up; canonical X laterality is retained by export.
        o.geometry.computeBoundingBox()
        const x = o.geometry.boundingBox.getCenter(new Vector3()).applyMatrix4(o.matrixWorld).x
        assert.ok(side === 'L' ? x > 0 : x < 0)
      }
    })
  }
  assert.equal(new Set(ids).size, 14)
  assert.deepEqual(ids.sort(), fetal.map(r => r.panacea_structure_id).sort())
  if (lod === 'LOD3') assert.equal(triangles, 6850)
})

test('fetal admission keeps source scope and clinical review pending', () => {
  assert.equal(fetal.length, 14)
  for (const r of fetal) {
    assert.equal(r.panacea_clinically_reviewed, false)
    assert.equal(r.panacea_review_status, 'review_required')
    assert.equal(r.mesh.boundary_edges, 0)
    assert.equal(r.mesh.nonmanifold_edges, 0)
  }
  const evidence = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/fetus_source_lung_groups.json')).lung_group_evidence
  assert.deepEqual(evidence.source_label_groups, { L: [1, 2], R: [3, 4, 5] })
  assert.deepEqual(evidence.excluded_labels, [6, 7, 8, 9])
  assert.equal(evidence.individual_lobe_identity, 'unresolved')
  assert.equal(evidence.clinical_validation, 'pending')
  assert.deepEqual(evidence.voxel_counts, { L: 36334, R: 47926 })
  assert.equal(evidence.outside_older_lung_voxels, 7776)
  assert.equal(evidence.older_lung_not_in_parcels_voxels, 4927)
  const qa = JSON.parse(fs.readFileSync('bodyexposure/qa_reports/gross_fetus_atlas.json'))
  assert.deepEqual(qa.failures, [])
  const order = qa.checks.find(c => c.check === 'fetal_source_organ_order')
  assert.equal(order.ok, true)
  assert.deepEqual(order.detail.missing_required_organs, [])
  assert.ok(!qa.checks.some(c => c.not_applicable?.includes('no organs')))
})
