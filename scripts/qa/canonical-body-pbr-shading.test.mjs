import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('canonical Blender PAN_* materials classify into dielectric bone, cartilage, and ligament/capsule tissues', () => {
  const src = readFileSync(new URL('../../src/domains/body-exposure/engine/tissueShading.ts', import.meta.url), 'utf8')
  assert.match(src, /replace\(\/\^\(Flat\|PAN\)_\/i,\s*''\)/)
  assert.match(src, /fibrocartilage/)
  assert.match(src, /jointcapsule\|capsule/)
})

test('CanonicalBody upgrades static and animated rig MeshStandardMaterials with dielectric tissueShading', () => {
  const src = readFileSync(new URL('../../src/pages/bodyhub/CanonicalBody.tsx', import.meta.url), 'utf8')
  assert.match(src, /tissueShading\(o\.material\.name\)/)
  assert.match(src, /tissueShading\(srcMat\.name\s*\|\|\s*sys\)/)
  assert.match(src, /new THREE\.MeshPhysicalMaterial\(/)
  assert.match(src, /panaceaTissue:\s*s\.tissue/)
  assert.match(src, /panaceaTissue:\s*sh\.tissue/)
})
