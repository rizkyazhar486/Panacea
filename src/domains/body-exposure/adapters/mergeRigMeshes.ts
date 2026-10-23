// Gabungkan mesh rig per (tulang induk × material) untuk memangkas draw call, tanpa kehilangan identitas struktur.
// Mesh asli tetap ada (disembunyikan) sebagai sumber metadata, kotak fokus, dan anak tulang yang ikut animasi;
// segitiga mesh gabungan dipetakan balik ke node struktur lewat rentang indeks.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export interface MergedRange { start: number; count: number; node: THREE.Object3D }
export interface MergeResult { mergedMeshes: number; sourceMeshes: number; skipped: number }

const structureNode = (o: THREE.Object3D): THREE.Object3D | null => {
  let n: THREE.Object3D | null = o
  while (n && !n.userData.panacea_structure_id) n = n.parent
  return n
}

/** Salin geometri dengan atribut position/normal Float32 (atribut terkuantisasi/ternormalisasi didekuantisasi). */
function toFloat(geo: THREE.BufferGeometry): THREE.BufferGeometry | null {
  const pos = geo.getAttribute('position'), nor = geo.getAttribute('normal')
  if (!pos || !nor) return null
  const out = new THREE.BufferGeometry()
  for (const [name, a] of [['position', pos], ['normal', nor]] as const) {
    const arr = new Float32Array(a.count * 3)
    for (let i = 0; i < a.count; i++) { arr[i * 3] = a.getX(i); arr[i * 3 + 1] = a.getY(i); arr[i * 3 + 2] = a.getZ(i) }
    out.setAttribute(name, new THREE.BufferAttribute(arr, 3))
  }
  const idx = geo.getIndex()
  if (idx) out.setIndex(Array.from({ length: idx.count }, (_, i) => idx.getX(i)))
  else out.setIndex(Array.from({ length: pos.count }, (_, i) => i))
  return out
}

/**
 * Untuk setiap mesh di bawah root: kelompokkan menurut (induk node struktur = tulang, material), satukan geometri
 * dalam ruang lokal tulang, tambahkan mesh gabungan sebagai anak tulang itu. Mesh asli disembunyikan (tidak digambar).
 */
export function mergeRigMeshes(root: THREE.Object3D): MergeResult {
  root.updateMatrixWorld(true)
  const buckets = new Map<THREE.Object3D, Map<THREE.Material, { geos: THREE.BufferGeometry[]; nodes: THREE.Object3D[] }>>()
  let source = 0, skipped = 0
  const meshes: THREE.Mesh[] = []
  root.traverse((o) => { if (o instanceof THREE.Mesh && !o.userData.panaceaMerged) meshes.push(o) })
  for (const m of meshes) {
    const node = structureNode(m)
    const bone = node?.parent
    const mat = Array.isArray(m.material) ? null : m.material
    const geo = mat ? toFloat(m.geometry) : null
    if (!node || !bone || !mat || !geo) { skipped++; continue }
    // ruang lokal tulang: inverse(tulang.world) × mesh.world (termasuk transformasi dekuantisasi node)
    geo.applyMatrix4(new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(m.matrixWorld))
    const byMat = buckets.get(bone) ?? new Map(); buckets.set(bone, byMat)
    const b = byMat.get(mat) ?? { geos: [], nodes: [] }; byMat.set(mat, b)
    b.geos.push(geo); b.nodes.push(node); source++
    m.visible = false
  }
  let merged = 0
  for (const [bone, byMat] of buckets) {
    for (const [mat, b] of byMat) {
      const g = mergeGeometries(b.geos, false)
      if (!g) { skipped += b.geos.length; continue }
      const ranges: MergedRange[] = []
      let start = 0
      b.geos.forEach((geo, i) => { const c = geo.getIndex()!.count; ranges.push({ start, count: c, node: b.nodes[i] }); start += c })
      const mesh = new THREE.Mesh(g, mat)
      mesh.userData.panaceaMerged = true
      mesh.userData.ranges = ranges
      bone.add(mesh); merged++
      b.geos.forEach((geo) => geo.dispose())
    }
  }
  return { mergedMeshes: merged, sourceMeshes: source, skipped }
}

/** Node struktur untuk segitiga faceIndex pada mesh gabungan; null bila bukan mesh gabungan / di luar rentang. */
export function structureAtFace(mesh: THREE.Object3D, faceIndex: number | undefined | null): THREE.Object3D | null {
  const ranges = mesh.userData?.ranges as MergedRange[] | undefined
  if (!ranges || faceIndex == null || !Number.isInteger(faceIndex) || faceIndex < 0) return null
  const idx = faceIndex * 3
  return ranges.find((r) => idx >= r.start && idx < r.start + r.count)?.node ?? null
}
