import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { segmentAt, traceCenterline, type Vec3 } from '../../src/lib/endoskopi/garisTengah.ts'

// Synthetic L-shaped tube (radius 2 cm): a vertical limb then a horizontal limb.
function tube(from: Vec3, to: Vec3, radius: number): Vec3[] {
  const points: Vec3[] = []
  const axis = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]
  const vertical = Math.abs(axis[1]!) > Math.abs(axis[0]!)
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * Math.PI * 2
      const c = [from[0] + axis[0]! * t, from[1] + axis[1]! * t, from[2] + axis[2]! * t]
      points.push(vertical ? [c[0]! + radius * Math.cos(a), c[1]!, c[2]! + radius * Math.sin(a)] : [c[0]!, c[1]! + radius * Math.cos(a), c[2]! + radius * Math.sin(a)])
    }
  }
  return points
}

const line = traceCenterline([
  { id: 'A', label: 'Ascending limb', points: tube([0, 0, 0], [0, 0.3, 0], 0.02) },
  { id: 'B', label: 'Transverse limb', points: tube([0.02, 0.3, 0], [0.3, 0.3, 0], 0.02) },
], 'lowest')

const first = line.nodes[0]!
const last = line.nodes[line.nodes.length - 1]!
assert.ok(first.p[1] < 0.06, 'scope enters at the lowest end when start is lowest')
assert.ok(last.p[0] > 0.24, 'path ends at the far end of the last segment')
assert.deepEqual(line.labels, ['Ascending limb', 'Transverse limb'])
assert.equal(line.segmentStarts[0], 0)
assert.ok(line.segmentStarts[1]! > 0.3 && line.segmentStarts[1]! < 0.7, 'second segment starts mid-route')
for (const node of line.nodes) assert.ok(node.r > 0.012 && node.r < 0.03, `radius ${node.r} tracks the 2 cm tube`)
for (let i = 1; i < line.nodes.length; i++) {
  const a = line.nodes[i - 1]!.p
  const b = line.nodes[i]!.p
  assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.12, 'consecutive centerline nodes are chained, not jumping across the organ')
}
assert.equal(segmentAt(line, 0), 0)
assert.equal(segmentAt(line, 0.99), 1)

// Quantized atlas positions must be copied to floats before world transforms.
const routes = readFileSync('src/pages/bodyhub/endoscopy/scopeRoutes.ts', 'utf8')
assert.match(routes, /new Float32Array\(source\.count \* 3\)/)
assert.doesNotMatch(routes, /geometry\.clone\(\)\.applyMatrix4/)

const workbench = readFileSync('src/pages/bodyhub/VirtualEndoscopyWorkbench.tsx', 'utf8')
assert.match(workbench, /Fold relief and mucosal colour are illustrative/)

console.log('Endoscopy centerline: entry end, chaining, calibre and segment boundaries verified.')
