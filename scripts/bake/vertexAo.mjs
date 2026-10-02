// Ambient occlusion per-vertex yang DIHITUNG dari geometri sumber (bukan digambar).
// Setiap titik menembakkan sinar berdistribusi kosinus ke belahan di atas normalnya;
// sinar yang menabrak geometri layer yang sama dalam jarak `radius` menggelapkan titik itu.
// Hasilnya hanya memodulasi cahaya; tidak ada geometri, bentuk, atau warna jaringan yang ditambah.
//
// Murni dan deterministik: tanpa Math.random/Date.now. Sampel memakai deret Hammersley yang
// diputar oleh hash POSISI titik (bukan indeks), jadi titik kembar di jahitan UV mendapat
// nilai identik dan dua kali jalan menghasilkan byte yang sama.
import * as THREE from 'three'
import { MeshBVH } from 'three-mesh-bvh'

export const AO_VERSION = 1

export const DEFAULT_AO_OPTIONS = Object.freeze({
  samples: 24,
  // Radius sebagai pecahan tinggi model (≈3.5 cm pada tubuh 1.75 m).
  radiusFraction: 0.02,
  // Lantai nilai: celah tidak pernah menjadi hitam pekat.
  floor: 0.4,
})

function radicalInverse2(i) {
  let bits = i >>> 0
  bits = ((bits << 16) | (bits >>> 16)) >>> 0
  bits = (((bits & 0x55555555) << 1) | ((bits & 0xaaaaaaaa) >>> 1)) >>> 0
  bits = (((bits & 0x33333333) << 2) | ((bits & 0xcccccccc) >>> 2)) >>> 0
  bits = (((bits & 0x0f0f0f0f) << 4) | ((bits & 0xf0f0f0f0) >>> 4)) >>> 0
  bits = (((bits & 0x00ff00ff) << 8) | ((bits & 0xff00ff00) >>> 8)) >>> 0
  return bits * 2.3283064365386963e-10
}

// Hash bilangan bulat 32-bit dari posisi terkuantisasi (1e-6) -> [0,1).
function positionHash(x, y, z) {
  let h = 2166136261 >>> 0
  for (const v of [x, y, z]) {
    h ^= Math.round(v * 1e6) | 0
    h = Math.imul(h, 16777619) >>> 0
    h ^= h >>> 15
  }
  return (h >>> 0) / 4294967296
}

/**
 * @param {THREE.Mesh[]} meshes mesh dengan matrixWorld sudah diperbarui (urutan = urutan traverse)
 * @returns {{ perMesh: Uint8Array[], radius: number, height: number }}
 */
export function bakeLayerAo(meshes, options = {}) {
  const opt = { ...DEFAULT_AO_OPTIONS, ...options }
  if (!Number.isInteger(opt.samples) || opt.samples < 4 || opt.samples > 256) throw new RangeError('samples must be an integer in [4, 256]')
  if (!(opt.radiusFraction > 0 && opt.radiusFraction < 0.5)) throw new RangeError('radiusFraction must be in (0, 0.5)')
  if (!(opt.floor >= 0 && opt.floor < 1)) throw new RangeError('floor must be in [0, 1)')
  if (meshes.length === 0) throw new RangeError('no meshes to bake')

  // Posisi/normal dunia per mesh + geometri gabungan untuk BVH.
  const worldPos = []
  const worldNrm = []
  const normalMatrix = new THREE.Matrix3()
  const v = new THREE.Vector3()
  let totalVerts = 0
  let totalIdx = 0
  for (const m of meshes) {
    const g = m.geometry
    const pos = g.attributes.position
    const nrm = g.attributes.normal
    if (!pos || !nrm) throw new Error(`mesh "${m.name}" lacks position/normal; refusing to guess`)
    const wp = new Float32Array(pos.count * 3)
    const wn = new Float32Array(pos.count * 3)
    normalMatrix.getNormalMatrix(m.matrixWorld)
    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld)
      wp.set([v.x, v.y, v.z], i * 3)
      v.fromBufferAttribute(nrm, i).applyMatrix3(normalMatrix).normalize()
      wn.set([v.x, v.y, v.z], i * 3)
    }
    worldPos.push(wp)
    worldNrm.push(wn)
    totalVerts += pos.count
    totalIdx += g.index ? g.index.count : pos.count
  }
  const mergedPos = new Float32Array(totalVerts * 3)
  const mergedIdx = new Uint32Array(totalIdx)
  let vo = 0
  let io = 0
  let minY = Infinity
  let maxY = -Infinity
  meshes.forEach((m, k) => {
    mergedPos.set(worldPos[k], vo * 3)
    const g = m.geometry
    if (g.index) for (let i = 0; i < g.index.count; i += 1) mergedIdx[io++] = g.index.getX(i) + vo
    else for (let i = 0; i < g.attributes.position.count; i += 1) mergedIdx[io++] = vo + i
    for (let i = 1; i < worldPos[k].length; i += 3) { if (worldPos[k][i] < minY) minY = worldPos[k][i]; if (worldPos[k][i] > maxY) maxY = worldPos[k][i] }
    vo += g.attributes.position.count
  })
  const height = maxY - minY
  if (!(height > 0)) throw new Error('degenerate model height')
  const radius = height * opt.radiusFraction
  const eps = radius * 0.02

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
  merged.setIndex(new THREE.BufferAttribute(mergedIdx, 1))
  const bvh = new MeshBVH(merged, { targetLeafSize: 8 })

  // Pola hemisfer berdistribusi kosinus (tetap untuk semua titik; diputar per titik).
  const dirs = []
  for (let i = 0; i < opt.samples; i += 1) {
    const u = (i + 0.5) / opt.samples
    const r = Math.sqrt(u)
    const phi = 2 * Math.PI * radicalInverse2(i + 1)
    dirs.push([r * Math.cos(phi), r * Math.sin(phi), Math.sqrt(1 - u)])
  }

  const ray = new THREE.Ray()
  const n = new THREE.Vector3()
  const t = new THREE.Vector3()
  const b = new THREE.Vector3()
  const perMesh = []
  meshes.forEach((m, k) => {
    const count = worldPos[k].length / 3
    const out = new Uint8Array(count)
    for (let i = 0; i < count; i += 1) {
      const px = worldPos[k][i * 3], py = worldPos[k][i * 3 + 1], pz = worldPos[k][i * 3 + 2]
      n.set(worldNrm[k][i * 3], worldNrm[k][i * 3 + 1], worldNrm[k][i * 3 + 2])
      const a = Math.abs(n.x) > 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
      t.crossVectors(a, n).normalize()
      b.crossVectors(n, t)
      const rot = positionHash(px, py, pz) * 2 * Math.PI
      const cr = Math.cos(rot), sr = Math.sin(rot)
      let occ = 0
      for (let s = 0; s < dirs.length; s += 1) {
        const [dx0, dy0, dz] = dirs[s]
        const dx = dx0 * cr - dy0 * sr
        const dy = dx0 * sr + dy0 * cr
        ray.origin.set(px + n.x * eps, py + n.y * eps, pz + n.z * eps)
        ray.direction.set(t.x * dx + b.x * dy + n.x * dz, t.y * dx + b.y * dy + n.y * dz, t.z * dx + b.z * dy + n.z * dz)
        const hit = bvh.raycastFirst(ray, THREE.DoubleSide, 0, radius)
        if (hit) occ += 1 - hit.distance / radius
      }
      const ao = Math.min(1, Math.max(0, 1 - occ / dirs.length))
      out[i] = Math.round(255 * (opt.floor + (1 - opt.floor) * ao))
    }
    perMesh.push(out)
  })
  return { perMesh, radius, height }
}
