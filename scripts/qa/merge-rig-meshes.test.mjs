import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { mergeRigMeshes, structureAtFace } from '../../src/domains/body-exposure/adapters/mergeRigMeshes.ts'

// tulang dengan dua struktur (material sama) + satu struktur material lain; mesh di bawah node struktur
function rig() {
  const root = new THREE.Group()
  const bone = new THREE.Object3D(); bone.name = 'FOREARM.L'; bone.position.set(0, 1, 0); root.add(bone)
  const matA = new THREE.MeshStandardMaterial(), matB = new THREE.MeshStandardMaterial()
  const mk = (id, mat, x) => {
    const node = new THREE.Object3D(); node.userData.panacea_structure_id = id; node.position.set(x, 0, 0); bone.add(node)
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat); node.add(m); return node
  }
  return { root, bone, a: mk('RADIUS.L', matA, 0.1), b: mk('ULNA.L', matA, -0.1), c: mk('LIGAMENT.L', matB, 0) }
}

test('menggabung_per_tulang_dan_material', () => {
  const { root, bone } = rig()
  const r = mergeRigMeshes(root)
  assert.deepEqual(r, { mergedMeshes: 2, sourceMeshes: 3, skipped: 0 })
  const merged = bone.children.filter((o) => o.userData.panaceaMerged)
  assert.equal(merged.length, 2)
})

test('mesh_asli_disembunyikan_tetapi_tetap_ada', () => {
  const { root, a } = rig()
  mergeRigMeshes(root)
  assert.equal(a.children[0].visible, false)
  assert.equal(a.parent.name, 'FOREARM.L')
})

test('posisi_gabungan_sama_dengan_dunia_asli', () => {
  const { root, bone } = rig()
  root.updateMatrixWorld(true)
  const before = new THREE.Box3().setFromObject(root)
  mergeRigMeshes(root)
  const merged = bone.children.filter((o) => o.userData.panaceaMerged)
  const after = new THREE.Box3(); merged.forEach((m) => after.union(new THREE.Box3().setFromObject(m)))
  assert.ok(after.min.distanceTo(before.min) < 1e-6 && after.max.distanceTo(before.max) < 1e-6)
})

test('gabungan_ikut_bergerak_dengan_tulang', () => {
  const { root, bone } = rig()
  mergeRigMeshes(root)
  bone.rotation.z = Math.PI / 2; root.updateMatrixWorld(true)
  const m = bone.children.find((o) => o.userData.panaceaMerged)
  const box = new THREE.Box3().setFromObject(m)
  assert.ok(box.getSize(new THREE.Vector3()).y > box.getSize(new THREE.Vector3()).x)  // memanjang ke y setelah rotasi
})

test('segitiga_dipetakan_ke_struktur_asal', () => {
  const { root, bone, a, b } = rig()
  mergeRigMeshes(root)
  const m = bone.children.find((o) => o.userData.panaceaMerged && o.userData.ranges.length === 2)
  const tris = m.userData.ranges[0].count / 3
  assert.equal(structureAtFace(m, 0), a)
  assert.equal(structureAtFace(m, tris - 1), a)      // batas akhir struktur pertama
  assert.equal(structureAtFace(m, tris), b)          // batas awal struktur kedua
})

test('pemetaan_menolak_indeks_tidak_valid_dan_mesh_biasa', () => {
  const { root, bone } = rig()
  mergeRigMeshes(root)
  const m = bone.children.find((o) => o.userData.panaceaMerged)
  assert.equal(structureAtFace(m, -1), null)
  assert.equal(structureAtFace(m, 1.5), null)
  assert.equal(structureAtFace(m, 1e9), null)
  assert.equal(structureAtFace(m, undefined), null)
  assert.equal(structureAtFace(new THREE.Mesh(), 0), null)
})

test('mesh_tanpa_node_struktur_dilewati_bukan_digabung', () => {
  const root = new THREE.Group(); root.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()))
  assert.deepEqual(mergeRigMeshes(root), { mergedMeshes: 0, sourceMeshes: 0, skipped: 1 })
  assert.equal(root.children[0].visible, true)
})

test('atribut_terkuantisasi_didekuantisasi', () => {
  const { root, bone } = rig()
  const src = root.getObjectByProperty('type', 'Mesh')
  const pos = src.geometry.getAttribute('position')
  const q = new Int16Array(pos.count * 3); for (let i = 0; i < q.length; i++) q[i] = Math.round(pos.array[i] / 0.05 * 32767)
  src.geometry.setAttribute('position', new THREE.BufferAttribute(q, 3, true)); src.scale.setScalar(0.05)  // seperti KHR_mesh_quantization
  root.updateMatrixWorld(true); const before = new THREE.Box3().setFromObject(src)
  mergeRigMeshes(root)
  const merged = bone.children.filter((o) => o.userData.panaceaMerged)
  const after = new THREE.Box3(); merged.forEach((m) => after.union(new THREE.Box3().setFromObject(m)))
  assert.ok(after.containsBox(before))
})
