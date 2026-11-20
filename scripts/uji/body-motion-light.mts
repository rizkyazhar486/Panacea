import assert from 'node:assert/strict'
import * as THREE from 'three'
import { applyMotionLight, tagMotionMeshes } from '../../src/domains/body-exposure/adapters/motionLight.ts'
import type { BodyMotionFrame } from '../../src/domains/body-exposure/engine/body-motion/bodyMotion.ts'

const frame = (p: Partial<BodyMotionFrame> = {}): BodyMotionFrame => ({
  cardiacPhase: 'ejection', heartGlow: 0, lungGlow: 0, breath01: 0, vesselPulse: 0, renalGlow: 0, ...p,
})
const named = (name: string, child?: THREE.Object3D) => {
  const g = new THREE.Group(); g.userData.originalName = name; if (child) g.add(child); return g
}
const mesh = (material: THREE.Material, name?: string) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
  if (name) m.userData.originalName = name
  m.position.set(1, 2, 3)
  return m
}
const black = (c: THREE.Color) => c.r === 0 && c.g === 0 && c.b === 0

// Adegan meniru aset: ventrikel kiri = mesh tanpa nama di bawah node bernama; arteri koroner berbagi material yang sama.
const shared = new THREE.MeshStandardMaterial({ color: '#aa3333' })
const lvMesh = mesh(shared)
const coronary = mesh(shared, 'Circumflex artery of heart')
const cardio = new THREE.Group()
cardio.add(named('Left ventricle', lvMesh), coronary)
cardio.userData.body3dOwnedMaterials = [shared]

const before = { scale: lvMesh.scale.clone(), pos: lvMesh.position.clone(), geo: lvMesh.geometry, rot: lvMesh.quaternion.clone() }

// ── Positif ────────────────────────────────────────────────────────────────────────────────────────
const counts = tagMotionMeshes('cardiovascular', cardio)
assert.deepEqual(counts, { heart: 1, lungs: 0, kidneys: 0, greatVessels: 0 })
assert.notEqual(lvMesh.material, shared, 'ventrikel mendapat material sendiri')
assert.equal(coronary.material, shared, 'arteri koroner tetap memakai material bersama')
assert.equal(lvMesh.userData.baseMaterial, lvMesh.material, 'sorotan memulihkan ke material gerak')
assert.ok((cardio.userData.body3dOwnedMaterials as THREE.Material[]).includes(lvMesh.material as THREE.Material), 'material baru ikut dibuang saat lapisan dilepas')

const lvMat = lvMesh.material as THREE.MeshStandardMaterial
applyMotionLight(cardio, frame({ heartGlow: 1 }))
assert.ok(lvMat.emissive.r > 0.5 && lvMat.emissive.r > lvMat.emissive.b, 'jantung menyala merah pada kontraksi penuh')
assert.ok(black(shared.emissive), 'material bersama (koroner) tidak ikut menyala')
const full = lvMat.emissive.clone()
applyMotionLight(cardio, frame({ heartGlow: 0.5 }))
assert.ok(Math.abs(lvMat.emissive.r - full.r / 2) < 1e-9, 'cahaya sebanding intensitas')

// Geometri tidak disentuh sama sekali.
assert.ok(lvMesh.scale.equals(before.scale) && lvMesh.position.equals(before.pos) && lvMesh.quaternion.equals(before.rot), 'geometri atlas berubah (skala/posisi/rotasi)')
assert.equal(lvMesh.geometry, before.geo)

// null mengembalikan emisi sumber.
applyMotionLight(cardio, null)
assert.ok(black(lvMat.emissive), 'gerak mati → kembali ke emisi sumber')

// Paru di lapisan visceral: mesh tanpa nama di bawah lobus.
const lungMat = new THREE.MeshStandardMaterial()
const lobe = mesh(lungMat)
const visceral = new THREE.Group(); visceral.add(named('Superior lobe of left lung', lobe))
assert.equal(tagMotionMeshes('visceral', visceral).lungs, 1)
const lm = lobe.material as THREE.MeshStandardMaterial
applyMotionLight(visceral, frame({ lungGlow: 1, heartGlow: 0 }))
assert.ok(lm.emissive.b > 0.3 && lm.emissive.b > lm.emissive.r, 'paru berpendar biru saat inspirasi')
applyMotionLight(visceral, frame({ lungGlow: 0, heartGlow: 1 }))
assert.ok(black(lm.emissive), 'paru tidak mengikuti cahaya jantung')

// ── Batas: intensitas di luar 0..1 dijepit ─────────────────────────────────────────────────────────
applyMotionLight(cardio, frame({ heartGlow: 5 }))
assert.ok(lvMat.emissive.equals(full), 'intensitas > 1 diperlakukan sebagai 1')
applyMotionLight(cardio, frame({ heartGlow: -3 }))
assert.ok(black(lvMat.emissive), 'intensitas < 0 diperlakukan sebagai 0')

// ── Negatif ────────────────────────────────────────────────────────────────────────────────────────
// Lapisan salah: nama benar tetapi lapisan cardiovascular untuk paru → tidak ditandai.
const lungMat2 = new THREE.MeshStandardMaterial()
const wrong = new THREE.Group(); wrong.add(named('Superior lobe of left lung', mesh(lungMat2)))
assert.deepEqual(tagMotionMeshes('cardiovascular', wrong), { heart: 0, lungs: 0, kidneys: 0, greatVessels: 0 })
// Material array dan material non-standar dilewati (tidak dibuat menyala).
const basic = new THREE.MeshBasicMaterial()
const arr = new THREE.Group(); arr.add(named('Left atrium', mesh(basic)), named('Right atrium', new THREE.Mesh(new THREE.BoxGeometry(), [new THREE.MeshStandardMaterial()])))
assert.equal(tagMotionMeshes('cardiovascular', arr).heart, 0)
// Lapisan tanpa penanda: applyMotionLight tidak melempar dan tidak mengubah apa pun.
const plain = new THREE.Group(); const pm = new THREE.MeshStandardMaterial(); plain.add(mesh(pm, 'Left atrium'))
applyMotionLight(plain, frame({ heartGlow: 1 }))
assert.ok(black(pm.emissive))

// Determinisme.
applyMotionLight(cardio, frame({ heartGlow: 0.3 })); const a = lvMat.emissive.clone()
applyMotionLight(cardio, frame({ heartGlow: 0.3 })); assert.ok(lvMat.emissive.equals(a))

console.log('body-motion-light: OK')
